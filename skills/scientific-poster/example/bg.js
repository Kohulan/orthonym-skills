// Soft gradient background with a faint hexagon motif, A0 portrait at 100 px/in.
const sharp = require("sharp");
const W = 3311, H = 4681;
const r = 70; // hex radius px
const hw = Math.sqrt(3) * r, vh = 1.5 * r;
let hexes = "";
function hex(cx, cy, fill, stroke, op) {
  const pts = [];
  for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; pts.push(`${(cx + r * 0.94 * Math.cos(a)).toFixed(1)},${(cy + r * 0.94 * Math.sin(a)).toFixed(1)}`); }
  return `<polygon points="${pts.join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="2" opacity="${op}"/>`;
}
let seed = 7; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
// right-hand band and bottom-left corner get the motif, fading towards the centre
for (let row = -1; row * vh < H + r; row++) {
  for (let col = -1; col * hw < W + hw; col++) {
    const cx = col * hw + (row % 2 ? hw / 2 : 0), cy = row * vh;
    const dRight = (W - cx) / W, dBottom = (H - cy) / H;
    const w1 = Math.max(0, 1 - dRight / 0.28) * (0.35 + 0.65 * (cy / H)); // right edge, stronger lower
    const w2 = Math.max(0, 1 - (cx / W) / 0.22) * Math.max(0, 1 - dBottom / 0.18); // bottom-left corner
    const w3 = Math.max(0, 1 - (cx / W) / 0.3) * Math.max(0, 1 - (cy / H) / 0.12) * 0.6; // top-left, faint
    const w = Math.min(1, w1 + w2 + w3);
    if (w < 0.05) continue;
    const u = rnd();
    if (u < 0.45 * w) hexes += hex(cx, cy, "none", "#9DB0D2", (0.22 * w).toFixed(2));
    if (u > 0.82 - 0.25 * w) hexes += hex(cx, cy, u > 0.93 ? "#C61354" : "#072563", "none", (0.035 + 0.055 * w).toFixed(2));
  }
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs>
 <radialGradient id="g1" cx="0%" cy="0%" r="55%"><stop offset="0%" stop-color="#B9C7E0" stop-opacity="0.9"/><stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
 <radialGradient id="g2" cx="100%" cy="100%" r="60%"><stop offset="0%" stop-color="#F3C9D8" stop-opacity="0.85"/><stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
 <radialGradient id="g3" cx="100%" cy="8%" r="40%"><stop offset="0%" stop-color="#F6D9E3" stop-opacity="0.6"/><stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
 <radialGradient id="g4" cx="0%" cy="100%" r="40%"><stop offset="0%" stop-color="#CFE3E6" stop-opacity="0.7"/><stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
</defs>
<rect width="100%" height="100%" fill="#FBFBFD"/>
<rect width="100%" height="100%" fill="url(#g1)"/>
<rect width="100%" height="100%" fill="url(#g2)"/>
<rect width="100%" height="100%" fill="url(#g3)"/>
<rect width="100%" height="100%" fill="url(#g4)"/>
${hexes}
</svg>`;
sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile("../assets/bg.png").then((i) => console.log("bg", i.width, i.height, i.size));
