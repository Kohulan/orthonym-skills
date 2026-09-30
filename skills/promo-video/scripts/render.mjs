#!/usr/bin/env node
// Frame-exact renderer. Loads a stage page, calls window.renderFrame(t) for
// every frame in order, screenshots each one straight into ffmpeg, then muxes
// the soundtrack the stage composed (window.renderAudio) or a track file.
//
//   node render.mjs stage.html --out promo.mp4                 full render
//   node render.mjs stage.html --stills 0,2.5,6 --outdir board  PNG stills (storyboard)
//   node render.mjs stage.html --out draft.mp4 --from 10 --to 18 --fps 15   a quick section preview
//
// Options: --data name=file.json (repeatable as name=a.json,other=b.json) -> window.DATA[name]
//          --track music.mp3  -> window.TRACK_B64, for Score.analyze / Score.useTrack
//          --ss 2             supersample: render at 2x and downscale (crisper thin lines, slower)
//          --crf 17           quality (lower = better, bigger)   --no-audio   skip sound
// Stage contract (see assets/stage-template.html):
//   window.STAGE = { width, height, fps, duration }
//   async window.renderFrame(t)      pure function of t
//   async window.renderAudio()       optional -> base64 WAV (Score.render())
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { launch, getTools, args } from './lib.mjs';

const a = args();
const stage = path.resolve(a._[0] || 'stage.html');
if (!fs.existsSync(stage)) { console.error(`no stage at ${stage}`); process.exit(1); }
const { FFMPEG } = getTools();
const ss = +(a.ss || 1);

const browser = await launch();
const probe = await browser.newPage();
await probe.goto('file://' + stage);
const S0 = await probe.evaluate(() => window.STAGE);
await probe.close();
if (!S0) { console.error('stage has no window.STAGE'); process.exit(1); }
const fps = +(a.fps || S0.fps || 30), W = S0.width, H = S0.height;

const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: ss });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const data = {};
if (a.data) for (const kv of String(a.data).split(',')) { const [k, f] = kv.split('='); data[k] = JSON.parse(fs.readFileSync(path.resolve(f), 'utf8')); }
const trackB64 = a.track ? fs.readFileSync(path.resolve(a.track)).toString('base64') : null;
await page.addInitScript(([d, tr, fps]) => { window.DATA = d; window.TRACK_B64 = tr; window.RENDER_FPS = fps; }, [data, trackB64, fps]);
await page.goto('file://' + stage, { waitUntil: 'load' });
await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  if (window.stageReady) await window.stageReady;           // e.g. three.js models, textures
});
const dur = +(a.to || S0.duration) - +(a.from || 0);
const from = +(a.from || 0);

async function frame(t) { await page.evaluate(t => window.renderFrame(t), t); }

if (a.stills) {
  const outdir = path.resolve(a.outdir || 'stills'); fs.mkdirSync(outdir, { recursive: true });
  // Stateful sims must reach each time; renderFrame is called in ascending order.
  const times = String(a.stills).split(',').map(Number).sort((x, y) => x - y);
  for (const t of times) { await frame(t); await page.screenshot({ path: path.join(outdir, `t${t.toFixed(2)}.png`) }); }
  console.log(`${times.length} stills -> ${outdir}`);
} else {
  const out = path.resolve(a.out || 'out.mp4'), silent = out.replace(/\.mp4$/, '') + '.video.mp4';
  const vf = [`scale=${W}:${H}:flags=lanczos:out_range=tv`, 'format=yuv420p'].join(',');
  const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-vf', vf, '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(a.crf || 17), '-profile:v', 'high', '-movflags', '+faststart', silent],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(dur * fps), t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await frame(from + i / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % (fps * 5) === 0) process.stdout.write(`  frame ${i}/${n}  (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));

  let wav = null;
  if (!a['no-audio'] && !a.from && await page.evaluate(() => typeof window.renderAudio === 'function')) {
    wav = out.replace(/\.mp4$/, '') + '.music.wav';
    fs.writeFileSync(wav, Buffer.from(await page.evaluate(() => window.renderAudio()), 'base64'));
  } else if (!a['no-audio'] && a.track && !a.from) wav = path.resolve(a.track);
  if (wav) {
    // -14 LUFS is the level LinkedIn/YouTube/Instagram normalise to; afade guards the tail.
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', silent, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
      '-af', `loudnorm=I=-14:TP=-1.5:LRA=11,afade=t=out:st=${Math.max(0, dur - 1.2)}:d=1.2`, '-ar', '48000', '-c:a', 'aac', '-b:a', '192k',
      '-t', String(dur), '-movflags', '+faststart', out]);
    fs.rmSync(silent);
  } else fs.renameSync(silent, out);
  console.log(`${n} frames, ${dur.toFixed(2)} s at ${fps} fps -> ${out}${wav ? ' (with sound)' : ''}  in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
if (errors.length) console.log(`PAGE ERRORS (${errors.length}):\n  ` + [...new Set(errors)].slice(0, 8).join('\n  '));
await browser.close();
