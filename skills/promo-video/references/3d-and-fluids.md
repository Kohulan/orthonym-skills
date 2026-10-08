# 3D (three.js) and fluids (fluid.js)

Use them where they carry the story: a molecule turning in 3D, a product object, an ink wipe
between shots, a logo emerging from smoke. Not as wallpaper.

## The rule that makes both work in a video

Everything is a function of `t`. The renderer calls `renderFrame(t)` for each frame in order
and screenshots after each call. So: no `requestAnimationFrame`, no `clock.getDelta()`, no
`Math.random()` at render time (use `Kit.rng(seed)` once at setup), no CSS transitions.

## three.js

Setup lives in the stage template. The parts that matter:

```js
const gl = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
gl.setPixelRatio(1);                 // supersample with render.mjs --ss 2 instead
gl.toneMapping = THREE.ACESFilmicToneMapping;
scene.environment = new THREE.PMREMGenerator(gl).fromScene(new RoomEnvironment(), .04).texture;  // glossy PBR for free
// in renderFrame(t): set every transform from t, then gl.render(scene, cam)
```

- Materials: `MeshPhysicalMaterial` with `clearcoat` looks premium; a coloured rim light from
  behind separates objects from a dark ground.
- Models: load with `GLTFLoader` and resolve `window.stageReady` when done, so render.mjs waits.
- Bloom: `EffectComposer` + `UnrealBloomPass` from `three/addons/` is deterministic; call
  `composer.render()` in place of `gl.render`.
- Many objects: `InstancedMesh`; positions computed from `t` (and a seeded rng), not integrated.
- Text in 3D is rarely worth it; keep type in the DOM layer above the canvas, where it is sharp.

### Real molecules (RDKit)

Generate true 3D coordinates once and paste them into the stage (or load via `--data`):

```bash
uvx --from rdkit python - <<'EOF'
import json
from rdkit import Chem
from rdkit.Chem import AllChem
m = Chem.AddHs(Chem.MolFromSmiles("CN1C=NC2=C1C(=O)N(C(=O)N2C)C"))
AllChem.EmbedMolecule(m, randomSeed=42); AllChem.MMFFOptimizeMolecule(m)
m = Chem.RemoveHs(m)                       # keep Hs if the shot is close-up
c = m.GetConformer()
atoms = [[*c.GetAtomPosition(a.GetIdx()), a.GetSymbol()] for a in m.GetAtoms()]
bonds = [[b.GetBeginAtomIdx(), b.GetEndAtomIdx(), b.GetBondTypeAsDouble()] for b in m.GetBonds()]
print(json.dumps({"atoms": atoms, "bonds": bonds}))
EOF
```

Centre the coordinates on their mean before use. CPK-ish colours on a dark ground: C `#2b2f38`,
N `#3f6bff`, O `#ff3b55`, S `#f2c230`, Cl/F `#36c96b`, H `#e8eaee`. Double bonds: two thin
cylinders offset along the ring plane, or one thicker one.

### Headless GPU

render.mjs launches Chrome with GPU flags; on a Mac, WebGL runs on the real GPU (Metal via
ANGLE). Always render one still of a 3D scene before a full render. If the canvas is blank:
check PAGE ERRORS, then re-render with `CHROME_ARGS=--use-angle=swiftshader node $SK/scripts/render.mjs ...`
(software, slower but always works).

## Fluids (fluid.js)

A stable-fluids solver on WebGL2 (advection, vorticity confinement, pressure projection).

```js
const fx = Fluid.create(canvas, { simRes: 128, dyeRes: 768, curl: 30, densityDissipation: .9, shading: .8 });
const splats = [[time, x, y, dx, dy, [r, g, b], radius], ...];            // planned, not random at render time
const sim = Kit.stepper((dt, now) => {
  for (const s of splats) if (s[0] >= now && s[0] < now + dt) fx.splat(...s.slice(1));
  fx.step(dt);
}, FPS);
// renderFrame(t): sim.to(t, () => fx.reset()); fx.render();
```

- `x, y` are 0..1 from the top-left; `dx, dy` are velocity in roughly pixels per second
  (1500-3000 gives a lively burst); `radius` 0.2-0.6.
- Looks: `curl` 20-40 swirls; `densityDissipation` 0.3 (lingering smoke) to 1.5 (quick puff);
  `velocityDissipation` 0.1-0.5; `shading` 0 (flat) to 1.2 (embossed ink).
- On a dark ground: `mix-blend-mode: screen` on the canvas, saturated colours at 0.6-1.0.
  On a light ground: blend `multiply` and use the colour you want the ink to be, darkened.
- Ink wipe: 6-10 big splats from one edge within 0.3 s, colour = the next shot's ground, raise
  `densityDissipation` after the next shot is revealed so the ink clears.
- Cost: stills that jump forward re-simulate from 0 (Kit.stepper), so a board with late shots is
  slower; keep simRes at 128 and dyeRes at 512-1024.
