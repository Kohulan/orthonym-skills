#!/usr/bin/env node
// Films a real web app for a promo: a CDP screencast at 2x, a visible pointer
// with click ripples, and named story beats ("markers") with the rect the stage
// camera should zoom to. Output: <outdir>/frames/*.jpg + <outdir>/footage.json,
// which a stage reads through Kit.footage(window.DATA.footage, cams).
//
//   node capture.mjs shots.mjs --outdir footage
//
// shots.mjs (copy assets/shots-template.mjs) exports:
//   export default { url, viewport: { width, height }, warm: async (page) => {}, steps: async (api) => {} }
// api: page, mark(key, selectors?, pad?), moveTo(target, steps?), click(selector), type(selector, text, delay?),
//      scroll(toY | 'bottom', ms?), wait(ms)
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launch, args } from './lib.mjs';

const a = args();
const shots = (await import(pathToFileURL(path.resolve(a._[0] || 'shots.mjs')))).default;
const outdir = path.resolve(a.outdir || 'footage'), fdir = path.join(outdir, 'frames');
fs.rmSync(fdir, { recursive: true, force: true }); fs.mkdirSync(fdir, { recursive: true });
const { width: W, height: H } = shots.viewport || { width: 1080, height: 1000 };

const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, ...(shots.context || {}) });
await ctx.addInitScript(() => addEventListener('DOMContentLoaded', () => {
  const s = document.createElement('style');
  s.textContent = `#__cur{position:fixed;left:0;top:0;width:28px;height:28px;z-index:2147483647;pointer-events:none;
    transform:translate(-100px,-100px);filter:drop-shadow(0 3px 4px rgba(0,0,0,.35))}
    #__cur.down::after{content:'';position:absolute;left:-16px;top:-16px;width:32px;height:32px;border-radius:50%;
    background:rgba(255,255,255,.5);box-shadow:0 0 0 2px rgba(0,0,0,.25);animation:__rip .5s ease-out forwards}
    @keyframes __rip{from{transform:scale(.3);opacity:1}to{transform:scale(1.7);opacity:0}}`;
  document.head.append(s);
  const c = document.createElement('div'); c.id = '__cur';
  c.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28"><path d="M3 2l7.5 19 2.6-7.9L21 10.5z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  document.body.append(c);
  addEventListener('mousemove', e => { c.style.transform = `translate(${e.clientX - 3}px,${e.clientY - 2}px)`; }, true);
  addEventListener('mousedown', () => { c.classList.remove('down'); void c.offsetWidth; c.classList.add('down'); }, true);
}));

const page = await ctx.newPage();
if (shots.warm) { await page.goto(shots.url, { waitUntil: 'networkidle' }); await shots.warm(page); }

const cdp = await ctx.newCDPSession(page);
const frames = []; let n = 0;
cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
  const f = path.join(fdir, String(n++).padStart(5, '0') + '.jpg');
  fs.writeFileSync(f, Buffer.from(data, 'base64'));
  frames.push([f, metadata.timestamp]);
  cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});

const wait = ms => page.waitForTimeout(ms);
const markers = [];
let mx = W / 2, my = H * .7;
const api = {
  page, wait,
  async mark(key, sels = null, pad = 24) {
    let rect = null;
    if (sels) {
      const bs = (await Promise.all(sels.map(q => page.locator(q).first().boundingBox().catch(() => null)))).filter(Boolean);
      if (bs.length) { const x0 = Math.min(...bs.map(b => b.x)) - pad, y0 = Math.min(...bs.map(b => b.y)) - pad;
        const x1 = Math.max(...bs.map(b => b.x + b.width)) + pad, y1 = Math.max(...bs.map(b => b.y + b.height)) + pad;
        rect = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; }
    }
    markers.push({ key, t: Date.now() / 1000, rect });
  },
  async moveTo(target, steps = 16) {
    const bb = typeof target === 'string' ? await page.locator(target).first().boundingBox() : target;
    const x = bb.x + (bb.width || 0) / 2, y = bb.y + (bb.height || 0) / 2;
    for (let i = 1; i <= steps; i++) { const t = i / steps, e = t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      await page.mouse.move(mx + (x - mx) * e, my + (y - my) * e); await wait(12); }
    mx = x; my = y;
  },
  async click(sel) { await api.moveTo(sel); await wait(150); await page.mouse.down(); await page.mouse.up(); },
  async type(sel, text, delay = 55) { await api.click(sel); await page.keyboard.type(text, { delay }); },
  async scroll(to, ms = 1400) {
    await page.evaluate(([to, ms]) => new Promise(r => {
      const from = scrollY, dest = to === 'bottom' ? document.documentElement.scrollHeight - innerHeight : to, t0 = performance.now();
      const step = now => { const t = Math.min(1, (now - t0) / ms), e = t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
        scrollTo(0, from + (dest - from) * e); t < 1 ? requestAnimationFrame(step) : r(); };
      requestAnimationFrame(step); }), [to, ms]);
  },
};

await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 94, maxWidth: W * 2, maxHeight: H * 2, everyNthFrame: 1 });
await page.goto(shots.url, { waitUntil: 'domcontentloaded' });
await page.mouse.move(mx, my);
await api.mark('start');
await shots.steps(api);
await api.mark('end');
await cdp.send('Page.stopScreencast');
await browser.close();

// frame paths relative to outdir's parent keeps footage.json portable next to the stage
const rel = frames.map(([f, t]) => [path.relative(path.dirname(outdir), f), t]);
fs.writeFileSync(path.join(outdir, 'footage.json'), JSON.stringify({ frames: rel, markers, W, H }));
const t0 = markers[0].t;
console.log(`${n} frames; beats: ` + markers.map(m => `${m.key}@${(m.t - t0).toFixed(1)}s`).join(' '));
