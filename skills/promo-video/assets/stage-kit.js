// stage-kit.js -- the small toolkit every promo stage uses. Plain script (no
// module) so a stage opened from file:// can load it with <script src>.
//
// The one idea behind all of it: a frame is a pure function of time. The
// renderer calls window.renderFrame(t) for t = 0, 1/fps, 2/fps, ... in order and
// screenshots after each call, so nothing may depend on wall-clock time,
// requestAnimationFrame, CSS transitions or Math.random(). Everything moves
// because t moved. Stateful things (a fluid sim, particles) step by exactly
// 1/fps per call; see Kit.stepper.
(function () {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  // progress of t through [a, b], 0..1
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const ease = {
    linear: k => k,
    inOut: k => (k < .5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2),
    out: k => 1 - (1 - k) ** 3,
    outQuint: k => 1 - (1 - k) ** 5,
    in: k => k ** 3,
    back: k => { const c = 1.7; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; },
    // critically damped spring feel, overshoot ~4%
    spring: k => 1 - Math.exp(-6 * k) * Math.cos(k * 9.4),
    expo: k => (k === 1 ? 1 : 1 - 2 ** (-10 * k)),
  };
  // eased progress in one call: tween(t, 1.2, 1.8, 'out')
  const tween = (t, a, b, e = 'out') => ease[e](prog(t, a, b));

  // Seeded randomness: same seed, same video, every render.
  function rng(seed = 1) {
    let s = seed >>> 0;
    return () => { s += 0x6d2b79f5; let r = Math.imul(s ^ (s >>> 15), 1 | s);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
  }
  // Smooth 1D value noise for drift and wobble, deterministic.
  function noise1(seed = 7) {
    const r = rng(seed), v = Array.from({ length: 256 }, r);
    return x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
      return lerp(v[i & 255], v[(i + 1) & 255], u) * 2 - 1; };
  }

  // A timeline of named scenes: [{id, at, dur, ...}] -> lookups by time.
  function timeline(scenes) {
    let at = 0;
    const list = scenes.map(s => { const o = { ...s, at: s.at ?? at }; at = o.at + o.dur; return o; });
    return {
      scenes: list, duration: at,
      // the scene on screen at t, with local time and 0..1 progress
      at(t) { const s = list.find(x => t >= x.at && t < x.at + x.dur) || list[list.length - 1];
        return { ...s, local: t - s.at, p: clamp((t - s.at) / s.dur) }; },
      get(id) { return list.find(x => x.id === id); },
    };
  }

  // Split an element's text into per-line / per-word / per-char spans once, then
  // animate them by index. Keeps inline markup like <em> intact at line level.
  function splitLines(el) {
    if (el.__lines) return el.__lines;
    const lines = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = lines.map(l => `<span class="kit-l" style="display:block;overflow:hidden;padding-bottom:.06em"><span style="display:inline-block">${l}</span></span>`).join('');
    return (el.__lines = [...el.querySelectorAll('.kit-l > span')]);
  }
  function splitChars(el) {
    if (el.__chars) return el.__chars;
    const chars = [...el.textContent].map(c => {
      const s = document.createElement('span');
      s.style.cssText = 'display:inline-block;white-space:pre'; s.textContent = c; return s;
    });
    el.replaceChildren(...chars);
    return (el.__chars = chars);
  }
  // Mask-reveal lines rising in, then leaving upward. inAt/outAt in seconds.
  function riseLines(el, t, inAt, outAt, { stagger = .08, dur = .55 } = {}) {
    const ls = splitLines(el);
    ls.forEach((l, i) => {
      const k = tween(t, inAt + i * stagger, inAt + i * stagger + dur, 'outQuint');
      const o = outAt == null ? 0 : tween(t, outAt + i * stagger * .5, outAt + i * stagger * .5 + .35, 'inOut');
      l.style.transform = `translateY(${(1 - k) * 110 - o * 110}%)`;
    });
  }

  // App-footage camera. data = footage.json from capture.mjs. cams = [[beatKey,
  // scale, [cx, cy] | null]] where null centres on the beat's recorded rect.
  function footage(data, cams = [], { move = 1.1, delay = .15 } = {}) {
    const t0 = data.markers[0].t;
    const beat = Object.fromEntries(data.markers.map(m => [m.key, { t: m.t - t0, rect: m.rect }]));
    const frames = data.frames.map(([f, t]) => [f, t - t0]);
    const W = data.W, H = data.H;
    const shots = cams.map(([k, s, c]) => {
      if (!beat[k]) throw new Error(`footage: no beat "${k}"`);
      if (!c && beat[k].rect && s > 1) { const r = beat[k].rect; c = [r.x + r.w / 2, r.y + r.h / 2]; }
      c = c || [W / 2, H / 2];
      const vw = W / s, vh = H / s;
      return { t: beat[k].t, s, x: clamp(c[0] - vw / 2, 0, W - vw), y: clamp(c[1] - vh / 2, 0, H - vh) };
    });
    let fi = 0;
    return {
      beat, W, H, length: beat.end ? beat.end.t : frames[frames.length - 1][1],
      frameAt(a) { while (fi < frames.length - 1 && frames[fi + 1][1] <= a) fi++;
        while (fi > 0 && frames[fi][1] > a) fi--; return frames[fi][0]; },
      camAt(a) { let cur = shots[0] || { s: 1, x: 0, y: 0 };
        for (let i = 1; i < shots.length; i++) { const c = shots[i], st = c.t + delay;
          if (a < st) break; const k = ease.inOut(prog(a, st, st + move));
          cur = { s: lerp(cur.s, c.s, k), x: lerp(cur.x, c.x, k), y: lerp(cur.y, c.y, k) }; }
        return cur; },
      // put frame + camera onto an <img> inside a box of width boxW (px)
      async apply(img, a, boxW) {
        const src = this.frameAt(Math.max(0, a));
        if (!img.src.endsWith(src)) { img.src = src; await img.decode().catch(() => {}); }
        const c = this.camAt(a), k = boxW / W;
        img.style.transformOrigin = '0 0';
        img.style.transform = `scale(${c.s}) translate(${-c.x * k}px, ${-c.y * k}px)`;
      },
    };
  }

  // For stateful simulations: advances `step(dt)` so the sim is exactly at time
  // t, whether frames arrive in order (render) or jump (storyboard stills).
  function stepper(step, fps) {
    let n = 0; const dt = 1 / fps;
    return { to(t, reset) { const target = Math.round(t * fps);
      if (target < n) { reset(); n = 0; }
      while (n < target) { step(dt, n * dt); n++; } } };
  }

  const css = (el, o) => Object.assign(el.style, o);
  window.Kit = { clamp, lerp, prog, ease, tween, rng, noise1, timeline, splitLines, splitChars, riseLines, footage, stepper, css };
})();
