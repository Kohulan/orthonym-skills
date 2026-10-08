// score.js -- music and sound design in code, rendered offline (never live), so
// the soundtrack is identical on every render and lines up with frames exactly.
// Plain script: exposes window.Score.
//
//   const S = Score.create({ bpm: 112, duration: 60, key: 'D', seed: 3 });
//   S.groove({ from: S.bar(1), to: S.bar(17), chords: S.prog('i-VI-III-VII'), drums: 'four', arp: true });
//   S.riser(S.bar(9) - 2, 2); S.impact(S.bar(9)); S.whoosh(12.4, .6); S.tick(5.1);
//   window.renderAudio = () => S.render();          // render.mjs calls this, muxes the WAV
//
// A licensed track instead of (or under) the synth:  await S.useTrack(window.TRACK_B64, { gain: .9 })
// and Score.analyze(window.TRACK_B64) -> { bpm, beats, duration } to cut on its beats.
// Contents: Score.create -> S.bar/beat/snap/prog/scaleNote · pad, bass, pluck, kick, clap, hat, tick, riser, impact, whoosh, sparkle · groove · useTrack · render; Score.analyze
(function () {
  const NOTES = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  const hz = m => 440 * 2 ** ((m - 69) / 12);
  function rng(seed) { let s = seed >>> 0; return () => { s += 0x6d2b79f5; let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }

  function create({ bpm = 110, duration = 30, key = 'D', minor = true, seed = 1, sampleRate = 48000, master = .8 } = {}) {
    const beatS = 60 / bpm, root = 48 + NOTES[key];               // root in octave 3
    const scale = minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
    const events = [];                                              // (ctx, bus) => void, run at render
    const kicks = [];                                               // for sidechain ducking of pads
    let track = null;

    const S = {
      bpm, beatS, duration, sampleRate,
      beat: n => n * beatS, bar: n => (n - 1) * 4 * beatS,        // bar(1) = 0
      snap: (t, div = 1) => Math.round(t / (beatS / div)) * (beatS / div),
      // Roman-numeral progression in the key -> arrays of MIDI notes (triad + 7th, voiced mid)
      prog(str) {
        const deg = { i: 0, ii: 1, iii: 2, iv: 3, v: 4, vi: 5, vii: 6 };
        return str.split('-').map(r => { const d = deg[r.toLowerCase().replace(/[^iv]/g, '')];
          const n = k => root + 12 + scale[(d + k) % 7] + 12 * Math.floor((d + k) / 7);
          return [n(0), n(2), n(4), n(6)]; });
      },
      scaleNote: (deg, oct = 0) => root + 12 * (oct + Math.floor(deg / 7)) + scale[((deg % 7) + 7) % 7],
    };
    const add = f => (events.push(f), S);

    // --- instruments ---------------------------------------------------------
    S.pad = (t, dur, notes, { gain = .09, cutoff = 1800, attack = .8, release = 1.2 } = {}) => add((c, b) => {
      const g = c.createGain(), f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = .6;
      f.frequency.setValueAtTime(cutoff * .35, t); f.frequency.linearRampToValueAtTime(cutoff, t + attack + dur * .3);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack);
      g.gain.setValueAtTime(gain, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + release);
      for (const m of notes) for (const det of [-9, 0, 8]) {
        const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = det;
        o.connect(f); o.start(t); o.stop(t + dur + release + .05); }
      f.connect(g); g.connect(b.pads); g.connect(b.verb);
    });
    S.bass = (t, dur, m, { gain = .22 } = {}) => add((c, b) => {
      const g = c.createGain(), f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + .01);
      g.gain.exponentialRampToValueAtTime(gain * .5, t + dur * .7); g.gain.linearRampToValueAtTime(0, t + dur);
      for (const [type, mm] of [['sawtooth', m], ['sine', m - 12]]) { const o = c.createOscillator();
        o.type = type; o.frequency.value = hz(mm); o.connect(f); o.start(t); o.stop(t + dur + .02); }
      f.connect(g); g.connect(b.dry);
    });
    S.pluck = (t, m, { gain = .07, decay = .35 } = {}) => add((c, b) => {
      const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
      o.type = 'triangle'; o.frequency.value = hz(m); f.type = 'lowpass'; f.frequency.setValueAtTime(5200, t);
      f.frequency.exponentialRampToValueAtTime(700, t + decay);
      g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(1e-4, t + decay);
      o.connect(f); f.connect(g); g.connect(b.dry); g.connect(b.verb); o.start(t); o.stop(t + decay + .05);
    });
    S.kick = (t, { gain = .9 } = {}) => { kicks.push(t); return add((c, b) => {
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(155, t); o.frequency.exponentialRampToValueAtTime(42, t + .13);
      g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(1e-4, t + .5);
      o.connect(g); g.connect(b.dry); o.start(t); o.stop(t + .55); }); };
    S.clap = (t, { gain = .35 } = {}) => add((c, b) => noiseHit(c, b, t, gain, 'bandpass', 1600, .2, true));
    S.hat = (t, { gain = .12, open = false } = {}) => add((c, b) => noiseHit(c, b, t, gain, 'highpass', 7500, open ? .22 : .045));
    S.tick = (t, { gain = .12 } = {}) => add((c, b) => {                // UI click, for taps and keypresses
      const o = c.createOscillator(), g = c.createGain(); o.frequency.value = 2400;
      g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(1e-4, t + .018);
      o.connect(g); g.connect(b.dry); o.start(t); o.stop(t + .03); });
    S.riser = (t, dur = 2, { gain = .22 } = {}) => add((c, b) => {
      const n = noiseSrc(c, t, dur + .1), f = c.createBiquadFilter(), g = c.createGain();
      f.type = 'bandpass'; f.Q.value = 1.4; f.frequency.setValueAtTime(350, t); f.frequency.exponentialRampToValueAtTime(7000, t + dur);
      g.gain.setValueAtTime(1e-4, t); g.gain.exponentialRampToValueAtTime(gain, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + .05);
      n.connect(f); f.connect(g); g.connect(b.dry); g.connect(b.verb);
      const o = c.createOscillator(), og = c.createGain(); o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(1300, t + dur); og.gain.setValueAtTime(0, t);
      og.gain.linearRampToValueAtTime(gain * .25, t + dur); og.gain.linearRampToValueAtTime(0, t + dur + .05);
      o.connect(og); og.connect(b.verb); o.start(t); o.stop(t + dur + .1); });
    S.impact = (t, { gain = .9 } = {}) => { kicks.push(t); return add((c, b) => {    // logo hits, big reveals
      const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(70, t);
      o.frequency.exponentialRampToValueAtTime(28, t + 1.2); g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(1e-4, t + 1.8); o.connect(g); g.connect(b.dry); o.start(t); o.stop(t + 1.9);
      noiseHit(c, b, t, gain * .45, 'lowpass', 2400, .6, true); }); };
    S.whoosh = (t, dur = .6, { gain = .2 } = {}) => add((c, b) => {    // transitions, camera moves
      const n = noiseSrc(c, t, dur), f = c.createBiquadFilter(), g = c.createGain(); f.type = 'bandpass'; f.Q.value = 2;
      f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(3200, t + dur * .5);
      f.frequency.exponentialRampToValueAtTime(400, t + dur); g.gain.setValueAtTime(1e-4, t);
      g.gain.exponentialRampToValueAtTime(gain, t + dur * .45); g.gain.exponentialRampToValueAtTime(1e-4, t + dur);
      n.connect(f); f.connect(g); g.connect(b.dry); g.connect(b.verb); });
    S.sparkle = (t, { gain = .05, notes = 5 } = {}) => {                // a bright arpeggio, e.g. on a success state
      for (let i = 0; i < notes; i++) S.pluck(t + i * beatS / 4, S.scaleNote([0, 2, 4, 7, 9][i % 5], 3), { gain, decay: .6 });
      return S; };

    // A whole section: chords per bar, bass on roots, drums and an arpeggio.
    S.groove = ({ from, to, chords, barsPerChord = 1, drums = 'four', arp = false, bass = true, padGain } = {}) => {
      const barS = 4 * beatS; let i = 0;
      for (let t = from; t < to - 1e-6; t += barS * barsPerChord, i++) {
        const ch = chords[i % chords.length], len = Math.min(barS * barsPerChord, to - t);
        S.pad(t, len, ch, padGain ? { gain: padGain } : {});
        if (bass) for (let b = 0; b < len - 1e-6; b += beatS * 2) S.bass(t + b, beatS * 1.8, ch[0] - 12);
        if (arp) for (let s = 0; s < len / (beatS / 2) - 1e-6; s++) S.pluck(t + s * beatS / 2, ch[s % 4] + 12 * ((s >> 2) % 2));
        for (let bt = 0; bt < len - 1e-6; bt += beatS) {
          const tb = t + bt, n = Math.round(bt / beatS);
          if (drums === 'four') { S.kick(tb); if (n % 2) S.clap(tb); S.hat(tb + beatS / 2); }
          else if (drums === 'half') { if (n % 4 === 0) S.kick(tb); if (n % 4 === 2) S.clap(tb); S.hat(tb + beatS / 2, { gain: .07 }); }
        }
      }
      return S;
    };

    S.useTrack = async (b64, { gain = .9, offset = 0 } = {}) => { track = { b64, gain, offset }; return S; };

    // --- render --------------------------------------------------------------
    let noiseBuf;
    function noiseSrc(c, t, dur) { const s = c.createBufferSource(); s.buffer = noiseBuf; s.start(t, 0, dur); return s; }
    function noiseHit(c, b, t, gain, type, freq, decay, verb) {
      const n = noiseSrc(c, t, decay + .05), f = c.createBiquadFilter(), g = c.createGain(); f.type = type; f.frequency.value = freq;
      g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(1e-4, t + decay);
      n.connect(f); f.connect(g); g.connect(b.dry); if (verb) g.connect(b.verb);
    }
    S.render = async () => {
      const len = Math.ceil(duration * sampleRate), c = new OfflineAudioContext(2, len, sampleRate), r = rng(seed);
      noiseBuf = c.createBuffer(1, sampleRate * 3, sampleRate); const nd = noiseBuf.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = r() * 2 - 1;
      // reverb: a seeded, exponentially decaying stereo impulse
      const ir = c.createBuffer(2, sampleRate * 2.6, sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = (r() * 2 - 1) * (1 - i / d.length) ** 2.6; }
      const verb = c.createConvolver(); verb.buffer = ir; const verbIn = c.createGain(); verbIn.gain.value = .32;
      const glue = c.createDynamicsCompressor(); glue.threshold.value = -18; glue.ratio.value = 3; glue.attack.value = .01; glue.release.value = .2;
      const limit = c.createDynamicsCompressor(); limit.threshold.value = -2; limit.ratio.value = 20; limit.attack.value = .002; limit.release.value = .08;
      const out = c.createGain(); out.gain.setValueAtTime(master, 0);
      out.gain.setValueAtTime(master, Math.max(0, duration - 1.6)); out.gain.linearRampToValueAtTime(0, duration);   // fade out
      const pads = c.createGain();                                   // ducked by every kick/impact: the "pump"
      for (const k of [...kicks].sort((a, b) => a - b)) { pads.gain.setValueAtTime(1, k); pads.gain.linearRampToValueAtTime(.45, k + .02); pads.gain.linearRampToValueAtTime(1, k + beatS * .8); }
      const dry = c.createGain();
      pads.connect(glue); dry.connect(glue); verbIn.connect(verb); verb.connect(glue); glue.connect(limit); limit.connect(out); out.connect(c.destination);
      const bus = { dry, pads, verb: verbIn };
      if (track) {
        const buf = await c.decodeAudioData(b64ToBuf(track.b64)); const s = c.createBufferSource(), g = c.createGain();
        s.buffer = buf; g.gain.value = track.gain; s.connect(g); g.connect(limit); s.start(0, track.offset);
      }
      for (const e of events) e(c, bus);
      return wavB64(await c.startRendering());
    };
    return S;
  }

  // --- a licensed track: tempo and beat grid -----------------------------------
  async function analyze(b64) {
    const c = new OfflineAudioContext(1, 48000, 48000);
    const buf = await c.decodeAudioData(b64ToBuf(b64)), sr = buf.sampleRate, d = buf.getChannelData(0), hop = 512;
    const env = []; let prev = 0;
    for (let i = 0; i + hop < d.length; i += hop) { let e = 0; for (let j = 0; j < hop; j++) e += d[i + j] ** 2;
      e = Math.sqrt(e / hop); env.push(Math.max(0, e - prev)); prev = e; }                    // onset strength
    const fps = sr / hop; let best = 0, bestLag = 0;
    for (let bpm = 70; bpm <= 180; bpm += .5) { const lag = fps * 60 / bpm; let s = 0;
      for (let i = 0; i + lag * 4 < env.length; i++) s += env[i] * (env[Math.round(i + lag)] + env[Math.round(i + lag * 2)] * .5);
      if (s > best) { best = s; bestLag = lag; } }
    const bpm = Math.round(60 * fps / bestLag * 2) / 2; let phase = 0, pbest = -1;
    for (let p = 0; p < bestLag; p++) { let s = 0; for (let k = p; k < env.length; k += bestLag) s += env[Math.round(k)] || 0;
      if (s > pbest) { pbest = s; phase = p; } }
    const beats = []; for (let k = phase; k < env.length; k += bestLag) beats.push(+(k / fps).toFixed(3));
    return { bpm, beats, duration: buf.duration };
  }

  function b64ToBuf(b64) { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }
  function wavB64(ab) {
    const ch = ab.numberOfChannels, n = ab.length, sr = ab.sampleRate, out = new DataView(new ArrayBuffer(44 + n * ch * 2));
    const w = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVEfmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true);
    out.setUint16(22, ch, true); out.setUint32(24, sr, true); out.setUint32(28, sr * ch * 2, true); out.setUint16(32, ch * 2, true);
    out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * ch * 2, true);
    const data = [...Array(ch)].map((_, i) => ab.getChannelData(i));
    for (let i = 0, o = 44; i < n; i++) for (let k = 0; k < ch; k++, o += 2) out.setInt16(o, Math.max(-1, Math.min(1, data[k][i])) * 32767, true);
    const bytes = new Uint8Array(out.buffer); let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  window.Score = { create, analyze };
})();
