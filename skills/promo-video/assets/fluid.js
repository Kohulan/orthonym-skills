// fluid.js -- a compact GPU fluid (stable fluids: advection, vorticity,
// pressure projection) on WebGL2, written for frame-exact video rendering.
// Plain script: exposes window.Fluid. Nothing here reads a clock; the stage
// calls step(dt) with dt = 1/fps (use Kit.stepper so stills and renders agree).
//
//   const fx = Fluid.create(canvas, { simRes: 128, dyeRes: 1024 });
//   fx.splat(0.3, 0.5, 900, -200, [0.9, 0.1, 0.2], 0.4);   // x,y in 0..1 from top-left
//   fx.step(1 / 30); fx.render();                          // premultiplied, transparent ground
//
// Look knobs: curl (swirl), velocityDissipation (how long it keeps moving),
// densityDissipation (how fast ink fades), shading (fake 3D relief on the ink).
(function () {
  const VERT = `#version 300 es
  precision highp float;
  in vec2 aPos; uniform vec2 texelSize;
  out vec2 vUv, vL, vR, vT, vB;
  void main(){ vUv = aPos * .5 + .5;
    vL = vUv - vec2(texelSize.x, 0.); vR = vUv + vec2(texelSize.x, 0.);
    vT = vUv + vec2(0., texelSize.y); vB = vUv - vec2(0., texelSize.y);
    gl_Position = vec4(aPos, 0., 1.); }`;
  const HEAD = `#version 300 es
  precision highp float; precision highp sampler2D;
  in vec2 vUv, vL, vR, vT, vB; out vec4 o;`;
  const FRAG = {
    splat: `uniform sampler2D uTarget; uniform float aspect, radius; uniform vec3 color; uniform vec2 point;
      void main(){ vec2 p = vUv - point; p.x *= aspect;
        o = vec4(texture(uTarget, vUv).xyz + exp(-dot(p, p) / radius) * color, 1.); }`,
    advect: `uniform sampler2D uVelocity, uSource; uniform vec2 simTexel; uniform float dt, dissipation;
      void main(){ vec2 c = vUv - dt * texture(uVelocity, vUv).xy * simTexel;
        o = texture(uSource, c) / (1. + dissipation * dt); }`,
    divergence: `uniform sampler2D uVelocity;
      void main(){ float L = texture(uVelocity, vL).x, R = texture(uVelocity, vR).x,
        T = texture(uVelocity, vT).y, B = texture(uVelocity, vB).y; vec2 C = texture(uVelocity, vUv).xy;
        if (vL.x < 0.) L = -C.x; if (vR.x > 1.) R = -C.x; if (vT.y > 1.) T = -C.y; if (vB.y < 0.) B = -C.y;
        o = vec4(.5 * (R - L + T - B), 0., 0., 1.); }`,
    curl: `uniform sampler2D uVelocity;
      void main(){ float L = texture(uVelocity, vL).y, R = texture(uVelocity, vR).y,
        T = texture(uVelocity, vT).x, B = texture(uVelocity, vB).x;
        o = vec4(.5 * (R - L - T + B), 0., 0., 1.); }`,
    vorticity: `uniform sampler2D uVelocity, uCurl; uniform float curl, dt;
      void main(){ float L = texture(uCurl, vL).x, R = texture(uCurl, vR).x, T = texture(uCurl, vT).x,
        B = texture(uCurl, vB).x, C = texture(uCurl, vUv).x;
        vec2 f = .5 * vec2(abs(T) - abs(B), abs(R) - abs(L)); f /= length(f) + 1e-4; f *= curl * C; f.y *= -1.;
        o = vec4(clamp(texture(uVelocity, vUv).xy + f * dt, -1000., 1000.), 0., 1.); }`,
    pressure: `uniform sampler2D uPressure, uDivergence;
      void main(){ float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x,
        T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
        o = vec4((L + R + B + T - texture(uDivergence, vUv).x) * .25, 0., 0., 1.); }`,
    gradient: `uniform sampler2D uPressure, uVelocity;
      void main(){ float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x,
        T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
        o = vec4(texture(uVelocity, vUv).xy - vec2(R - L, T - B), 0., 1.); }`,
    scale: `uniform sampler2D uTexture; uniform float value; void main(){ o = value * texture(uTexture, vUv); }`,
    display: `uniform sampler2D uTexture; uniform vec2 dyeTexel; uniform float shading, gain;
      void main(){ vec3 c = texture(uTexture, vUv).rgb * gain;
        if (shading > 0.) {
          float l = length(texture(uTexture, vL).rgb), r = length(texture(uTexture, vR).rgb);
          float t = length(texture(uTexture, vT).rgb), b = length(texture(uTexture, vB).rgb);
          vec3 n = normalize(vec3(l - r, t - b, length(dyeTexel) * 1.2 / shading));
          c *= clamp(dot(n, normalize(vec3(-.4, .5, 1.))) + .35, .65, 1.15);
        }
        c = min(c, vec3(1.)); o = vec4(c, max(c.r, max(c.g, c.b))); }`,
  };

  function create(canvas, opts = {}) {
    const o = Object.assign({ simRes: 128, dyeRes: 1024, curl: 28, pressureIters: 22, pressure: .8,
      velocityDissipation: .25, densityDissipation: .6, shading: 1, gain: 1 }, opts);
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: false });
    if (!gl) throw new Error('fluid.js: WebGL2 unavailable');
    if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('fluid.js: EXT_color_buffer_float unavailable');
    const HF = gl.HALF_FLOAT;

    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    function shader(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('fluid.js shader: ' + gl.getShaderInfoLog(s)); return s; }
    const vs = shader(gl.VERTEX_SHADER, VERT);
    const P = {};
    for (const [k, src] of Object.entries(FRAG)) {
      const p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, shader(gl.FRAGMENT_SHADER, HEAD + src));
      gl.bindAttribLocation(p, 0, 'aPos'); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('fluid.js link: ' + gl.getProgramInfoLog(p));
      const u = {}; for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) {
        const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
      P[k] = { p, u };
    }

    const res = r => { const a = canvas.width / canvas.height;
      return a < 1 ? [r, Math.round(r / a)] : [Math.round(r * a), r]; };
    function target(w, h, ifmt, fmt) {
      const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR],
        [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
      gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, HF, null);
      const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      return { tex, fb, w, h, texel: [1 / w, 1 / h],
        bind(i) { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tex); return i; } };
    }
    const pair = (w, h, i, f) => { const d = { read: target(w, h, i, f), write: target(w, h, i, f),
      swap() { [d.read, d.write] = [d.write, d.read]; } }; return d; };

    let vel, dye, prs, div, crl, sim, dyeR;
    function reset() {
      sim = res(o.simRes); dyeR = res(o.dyeRes);
      vel = pair(sim[0], sim[1], gl.RG16F, gl.RG); prs = pair(sim[0], sim[1], gl.R16F, gl.RED);
      div = target(sim[0], sim[1], gl.R16F, gl.RED); crl = target(sim[0], sim[1], gl.R16F, gl.RED);
      dye = pair(dyeR[0], dyeR[1], gl.RGBA16F, gl.RGBA);
    }
    reset();

    function use(name, texel) { const q = P[name]; gl.useProgram(q.p);
      if (q.u.texelSize) gl.uniform2fv(q.u.texelSize, texel); return q.u; }
    function blit(t) {
      if (t) { gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb); gl.viewport(0, 0, t.w, t.h); }
      else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height); }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function splat(x, y, dx, dy, color, radius = .3) {
      gl.disable(gl.BLEND);
      const aspect = canvas.width / canvas.height, r = radius / 100 * (aspect > 1 ? aspect : 1);
      let u = use('splat', vel.read.texel);
      gl.uniform1i(u.uTarget, vel.read.bind(0)); gl.uniform1f(u.aspect, aspect);
      gl.uniform2f(u.point, x, 1 - y); gl.uniform3f(u.color, dx, -dy, 0); gl.uniform1f(u.radius, r);
      blit(vel.write); vel.swap();
      u = use('splat', dye.read.texel);
      gl.uniform1i(u.uTarget, dye.read.bind(0)); gl.uniform3fv(u.color, color);
      blit(dye.write); dye.swap();
    }

    function step(dt) {
      gl.disable(gl.BLEND);
      const tx = vel.read.texel;
      let u = use('curl', tx); gl.uniform1i(u.uVelocity, vel.read.bind(0)); blit(crl);
      u = use('vorticity', tx); gl.uniform1i(u.uVelocity, vel.read.bind(0)); gl.uniform1i(u.uCurl, crl.bind(1));
      gl.uniform1f(u.curl, o.curl); gl.uniform1f(u.dt, dt); blit(vel.write); vel.swap();
      u = use('divergence', tx); gl.uniform1i(u.uVelocity, vel.read.bind(0)); blit(div);
      u = use('scale', tx); gl.uniform1i(u.uTexture, prs.read.bind(0)); gl.uniform1f(u.value, o.pressure); blit(prs.write); prs.swap();
      u = use('pressure', tx); gl.uniform1i(u.uDivergence, div.bind(0));
      for (let i = 0; i < o.pressureIters; i++) { gl.uniform1i(u.uPressure, prs.read.bind(1)); blit(prs.write); prs.swap(); }
      u = use('gradient', tx); gl.uniform1i(u.uPressure, prs.read.bind(0)); gl.uniform1i(u.uVelocity, vel.read.bind(1));
      blit(vel.write); vel.swap();
      u = use('advect', tx); gl.uniform2fv(u.simTexel, tx); gl.uniform1f(u.dt, dt);
      gl.uniform1i(u.uVelocity, vel.read.bind(0)); gl.uniform1i(u.uSource, vel.read.bind(0));
      gl.uniform1f(u.dissipation, o.velocityDissipation); blit(vel.write); vel.swap();
      u = use('advect', dye.read.texel); gl.uniform2fv(u.simTexel, tx); gl.uniform1f(u.dt, dt);
      gl.uniform1i(u.uVelocity, vel.read.bind(0)); gl.uniform1i(u.uSource, dye.read.bind(1));
      gl.uniform1f(u.dissipation, o.densityDissipation); blit(dye.write); dye.swap();
    }

    function render() {
      gl.disable(gl.BLEND); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      const u = use('display', dye.read.texel);
      gl.uniform1i(u.uTexture, dye.read.bind(0)); gl.uniform2fv(u.dyeTexel, dye.read.texel);
      gl.uniform1f(u.shading, o.shading); gl.uniform1f(u.gain, o.gain); blit(null);
    }

    return { splat, step, render, reset, options: o, gl };
  }
  window.Fluid = { create };
})();
