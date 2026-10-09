// BChemXtract A0 portrait poster, built with pptxgenjs.
// Layout follows the Orthonym poster: wordmark header, abstract band, open sections separated by rules.
const pptxgen = require("pptxgenjs");
const path = require("path");
const fs = require("fs");
const { applyTheme } = require(process.env.PPTX_SKILL + "/scripts/apply_theme.js");

const A = (f) => path.join(__dirname, "assets", f);
const OUT = process.argv[2] || path.join(__dirname, "BChemXtract_Poster_A0.pptx");

// ---------- theme ----------
const THEME = {
  name: "BChemXtract Poster",
  headFontFace: "Calibri",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1B2033", // body text
    lt1: "FFFFFF",
    dk2: "072563", // Beilstein navy
    lt2: "F1F4F9", // tint
    accent1: "072563", // navy
    accent2: "C61354", // magenta
    accent3: "096779", // teal
    accent4: "5B7FB5", // mid navy
    accent5: "B9C7E0", // pale navy
    accent6: "E3E8F1", // very pale navy
    hlink: "C61354",
    folHlink: "096779",
  },
};
const H = THEME.colors; // hex, for chart options only
const GREY = "6B7390", RULE = "C5CBD9";

const pres = new pptxgen();
pres.defineLayout({ name: "A0P", width: 33.11, height: 46.81 });
pres.layout = "A0P";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.author = "Felix Bänsch";
pres.title = "Automated Extraction and FAIRification of Chemical Structures from Scientific Publications";
const C = pres.SchemeColor;

// ---------- geometry ----------
const W = 33.11, HH = 46.81;
const M = 1.0; // outer margin
const R = W - M; // right edge of content
const LX = M, LW = 12.0; // left column
const RX = LX + LW + 0.8, RW = R - RX; // right column, 18.31
const F = { title: 40, authors: 32, affil: 21, section: 40, sub: 28, body: 24, small: 20 };

// ---------- layout (frame) ----------
pres.defineSlideMaster({
  title: "Poster",
  background: { path: A("bg.png") },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 4.7, w: 22.8, h: 1.5, fontSize: F.title, bold: true, color: H.dk2, valign: "top", margin: 0, lineSpacingMultiple: 0.95 } } },
    { placeholder: { options: { name: "authors", type: "body", x: M, y: 6.35, w: 13.0, h: 0.75, fontSize: F.authors, color: H.dk2, valign: "top", margin: 0 } } },
    { placeholder: { options: { name: "affil", type: "body", x: 14.0, y: 6.3, w: R - 14.0, h: 1.7, fontSize: F.affil, color: H.accent4, valign: "top", align: "right", margin: 0 } } },
  ],
});

const slide = pres.addSlide({ masterName: "Poster" });

// ---------- helpers ----------
function text(t, x, y, w, h, o = {}) {
  slide.addText(t, { x, y, w, h, fontSize: o.size || F.body, color: o.color || C.text1, bold: !!o.bold, italic: !!o.italic, align: o.align || "left", valign: o.valign || "top", margin: 0, isTextBox: true, lineSpacingMultiple: o.ls || 1.0, objectName: o.name || "Text" });
}
function bullets(items, x, y, w, h, o = {}) {
  const runs = items.map((t, i) => ({ text: t, options: { bullet: { indent: 20 }, breakLine: i < items.length - 1, paraSpaceAfter: 8 } }));
  slide.addText(runs, { x, y, w, h, fontSize: o.size || F.body, color: C.text1, valign: "top", margin: 0, isTextBox: true, objectName: o.name || "Bullets" });
}
function section(title, x, y, w) {
  text(title, x, y, w, 0.9, { size: F.section, color: C.accent1, align: "center", valign: "middle", name: `Section ${title}` });
}
function rule(y) {
  slide.addShape(pres.shapes.LINE, { x: M, y, w: R - M, h: 0, line: { color: RULE, width: 1.5 }, objectName: `Rule ${y}` });
}
function stat(x, y, w, big, label, color) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 2.5, fill: { color: C.background1 }, line: { color: H.accent6, width: 1 }, rectRadius: 0.2, shadow: { type: "outer", color: H.accent5, blur: 6, offset: 2, angle: 90, opacity: 0.3 }, objectName: `Stat ${big}` });
  text(big, x + 0.1, y + 0.15, w - 0.2, 1.25, { size: 46, bold: true, color, align: "center", valign: "middle", name: `Stat value ${big}` });
  text(label, x + 0.15, y + 1.4, w - 0.3, 1.0, { size: 18, align: "center", name: `Stat label ${big}` });
}
function pill(t, x, y, w, h, fill, color, size) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: fill }, rectRadius: 0.35, objectName: `Pill ${t}` });
  text(t, x, y, w, h, { size: size || 20, bold: true, color, align: "center", valign: "middle", name: `Pill text ${t}` });
}

// =====================================================================
// HEADER
// =====================================================================
slide.addImage({ path: A("logo.png"), x: M, y: 0.65, w: 17.0, h: 17.0 * 1819 / 8156, objectName: "BChemXtract wordmark" });
slide.addImage({ path: A("beilstein.png"), x: 24.3, y: 2.55 - (7.8 * 553 / 2400) / 2, w: 7.8, h: 7.8 * 553 / 2400, objectName: "Beilstein-Institut logo" });
slide.addText("Automated Extraction and FAIRification of\nChemical Structures from Scientific Publications", { placeholder: "title" });
slide.addText([
  { text: "Felix Bänsch" }, { text: "1,2*", options: { superscript: true } },
  { text: ", Kohulan Rajan" }, { text: "1,2", options: { superscript: true } },
  { text: " and Markus Nietfeld" }, { text: "1", options: { superscript: true } },
], { placeholder: "authors" });
slide.addText([
  { text: "1. Beilstein-Institut zur Förderung der Chemischen Wissenschaften, Frankfurt am Main, Germany\n" },
  { text: "2. Microverse Centre Jena, Friedrich Schiller University Jena, Jena, Germany\n" },
  { text: "* Correspondence to: fbaensch@beilstein-institut.de", options: { color: H.dk2 } },
], { placeholder: "affil" });

// =====================================================================
// ABSTRACT BAND
// =====================================================================
const AY = 8.5, AH = 5.9;
{
  // vertical tab
  const cx = 1.45, cy = AY + AH / 2, tw = 3.4, th = 0.9;
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx - tw / 2, y: cy - th / 2, w: tw, h: th, rotate: 270, fill: { color: C.accent2 }, line: { color: C.accent2 }, rectRadius: 0.3, objectName: "Abstract tab" });
  slide.addText("Abstract", { x: cx - tw / 2, y: cy - th / 2, w: tw, h: th, rotate: 270, fontSize: 28, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: "Abstract tab text" });
  text("Chemical structures are published predominantly as images, which makes them inaccessible for database indexing, structure-based search and computational reuse. Optical chemical structure recognition and PDF-extraction tools attempt post-publication recovery, but cannot restore the information lost during image rendering. BChemXtract is an open-source Java library that extracts chemical structures directly from the ChemDraw CDX and CDXML files that authors already submit with their manuscripts. It parses the CDX object hierarchy to isolate chemical fragments from graphical annotations, expands abbreviations using a community-curated lookup table and converts the structures via the Chemistry Development Kit into standard machine-readable formats. BChemXtract is integrated into the production workflow of the Beilstein Journals, where extracted structures are manually validated before being embedded in article metadata as Schema.org JSON-LD, deposited in PubChem and offered for download. Applied to the 2993 ChemDraw figures and schemes of volume 20 of the Beilstein Journal of Organic Chemistry, it yielded 23,320 structures with InChIs in under two minutes. On a 225-file benchmark corpus it generated valid InChIs for 98.2% of extracted unique substances, compared with 14.2% for Open Babel, at comparable per-file speed. BChemXtract makes published chemistry FAIR at the point of publication without altering author workflows. It is available under the MIT licence together with a web application and the benchmark corpus.",
    2.5, AY, 21.6, AH, { size: 25, align: "justify", ls: 1.04, name: "Abstract" });
  // QR codes
  const q = 2.7, qx1 = 25.1, qx2 = 28.9;
  slide.addImage({ path: A("qr-github.png"), x: qx1, y: AY + 0.1, w: q, h: q, objectName: "QR library GitHub" });
  slide.addImage({ path: A("qr-web.png"), x: qx2, y: AY + 0.1, w: q, h: q, objectName: "QR web application" });
  text("Library\nGitHub", qx1 - 0.3, AY + q + 0.25, q + 0.6, 1.0, { size: 22, align: "center", color: C.accent1, name: "QR label 1" });
  text("Web\napplication", qx2 - 0.3, AY + q + 0.25, q + 0.6, 1.0, { size: 22, align: "center", color: C.accent1, name: "QR label 2" });
  text("cheminfo.beilstein.org/bchemxtract", 24.4, AY + 4.45, R - 24.4, 0.55, { size: 22, italic: true, color: C.accent2, align: "center", name: "Web URL" });
  text("github.com/beilstein-institut/bchemxtract", 24.4, AY + 5.05, R - 24.4, 0.55, { size: 22, italic: true, color: C.accent1, align: "center", name: "GitHub URL" });
}
rule(AY + AH + 0.35);

// =====================================================================
// ROW 2: How it works (left) / Results (right)
// =====================================================================
const R2Y = AY + AH + 0.6, R2B = 32.6; // 15.0 .. 32.6
{
  section("How BChemXtract works", LX, R2Y, LW);
  // problem illustration
  const pimg = fs.existsSync(A("problem.png")) ? "problem.png" : "problem.jpeg";
  const iw = 11.0, ih = iw * 1184 / 3584;
  slide.addImage({ path: A(pimg), x: LX + (LW - iw) / 2, y: R2Y + 1.0, w: iw, h: ih, objectName: "Problem illustration" });
  text("A figure reaches the reader as pixels. The ChemDraw file submitted with it still holds atoms, bonds, stereochemistry and charges.", LX, R2Y + 1.0 + ih + 0.1, LW, 0.75, { size: F.small, italic: true, color: GREY, align: "center", name: "Problem caption" });
  // legend
  const ly = R2Y + 5.65;
  const leg = [["Input", C.accent5, 0], ["BChemXtract library", C.accent1, 1.7], ["Editorial workflow", C.accent3, 5.2], ["Published output", C.accent2, 8.6]];
  leg.forEach(([t, col, off], i) => {
    slide.addShape(pres.shapes.RECTANGLE, { x: LX + off, y: ly + 0.08, w: 0.35, h: 0.35, fill: { color: col }, line: { color: col }, objectName: `Legend swatch ${i}` });
    text(t, LX + off + 0.5, ly, 3.2, 0.5, { size: 18, valign: "middle", name: `Legend text ${i}` });
  });
  // flow
  const steps = [
    ["CDX / CDXML file", "Submitted with the manuscript. Read by CDXReader (binary) or CDXMLReader (XML); no ChemDraw needed.", "in"],
    ["CDX object model", "Document, pages, fragments, atoms, bonds, text, arrows and reaction schemes as plain Java objects.", "lib"],
    ["Fragment visitors", "Chemical fragments isolated from annotations. Nicknames (BChemLookup), R-groups and Markush legends expanded.", "lib"],
    ["CDK conversion", "IAtomContainer with stereo from wedges and CIP labels; Haworth and chair sugars recognised. Safety limits, e.g. InChI up to 500 atoms.", "lib"],
    ["Identifiers", "InChI, InChIKey, SMILES, CXSMILES, MDL V3000, formula, PNG. Reactions give RInChI. Deduplicated per article by InChIKey.", "lib"],
    ["Manual validation", "Validators compare each structure with the drawing, about 200 per hour. Failures feed back into the parser.", "val"],
    ["FAIR publication", "Schema.org JSON-LD in the article page, deposition in PubChem, download from the journal.", "out"],
  ];
  const fills = { in: C.accent5, lib: C.accent1, val: C.accent3, out: C.accent2 };
  const txt = { in: C.accent1, lib: C.background1, val: C.background1, out: C.background1 };
  const bh = 1.36, bg = 0.32;
  let sy = R2Y + 6.3;
  steps.forEach((s, i) => {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: LX, y: sy, w: LW, h: bh, fill: { color: fills[s[2]] }, line: { color: fills[s[2]] }, rectRadius: 0.15, objectName: `Step ${i + 1} box` });
    text(s[0], LX + 0.3, sy + 0.06, LW - 0.6, 0.5, { size: 23, bold: true, color: txt[s[2]], valign: "middle", name: `Step ${i + 1} title` });
    text(s[1], LX + 0.3, sy + 0.56, LW - 0.6, bh - 0.6, { size: 18, color: txt[s[2]], name: `Step ${i + 1} text` });
    if (i < steps.length - 1) slide.addShape(pres.shapes.DOWN_ARROW, { x: LX + LW / 2 - 0.25, y: sy + bh + 0.03, w: 0.5, h: bg - 0.06, fill: { color: C.accent4 }, line: { color: C.accent4 }, objectName: `Arrow ${i + 1}` });
    sy += bh + bg;
  });
}
{
  section("Results", RX, R2Y, RW);
  const HW = (RW - 0.8) / 2, H1 = RX, H2 = RX + HW + 0.8;
  const SY = R2Y + 1.05;
  // --- half 1: production
  text("In production: BJOC volume 20 (2024)", H1, SY, HW, 0.7, { size: F.sub, bold: true, color: C.accent1, valign: "middle", name: "Sub production" });
  const tw = (HW - 0.5) / 3, ty = SY + 0.85;
  stat(H1, ty, tw, "110 s", "for the whole volume\n(v1.4.1)", C.accent1);
  stat(H1 + tw + 0.25, ty, tw, "81.0%", "of 28,785 fragments\ngave an InChI", C.accent2);
  stat(H1 + 2 * (tw + 0.25), ty, tw, "19,965", "unique InChIs\nin the volume", C.accent3);
  const chY = ty + 2.8, chH = 8.2;
  slide.addChart(pres.charts.BAR, [
    { name: "Plain structures", labels: ["Fragments extracted", "Fragments with InChI", "Unique InChIs"], values: [28785, 14770, 19965] },
    { name: "Markush structures (substituent enumeration)", labels: ["Fragments extracted", "Fragments with InChI", "Unique InChIs"], values: [null, 8550, null] },
  ], {
    x: H1, y: chY, w: HW, h: chH,
    chartArea: { fill: { color: "FFFFFF", transparency: 100 }, roundedCorners: false }, plotArea: { fill: { color: "FFFFFF", transparency: 100 } },
    barDir: "col", barGrouping: "stacked", barGapWidthPct: 55,
    chartColors: [H.accent1, H.accent3],
    showTitle: true, title: "Extraction yield from 2993 figures and schemes", titleFontSize: 22, titleColor: H.dk1, titleFontFace: "+mn-lt",
    showValue: true, dataLabelPosition: "ctr", dataLabelColor: "FFFFFF", dataLabelFontSize: 20, dataLabelFontBold: true, dataLabelFontFace: "+mn-lt", dataLabelFormatCode: "#,##0",
    catAxisLabelFontSize: 20, catAxisLabelColor: H.dk1, catAxisLabelFontFace: "+mn-lt",
    valAxisLabelFontSize: 18, valAxisLabelColor: GREY, valAxisLabelFontFace: "+mn-lt", valAxisLabelFormatCode: "#,##0", valAxisMaxVal: 30000, valAxisMajorUnit: 10000,
    valGridLine: { color: "D5DAE6", size: 1 }, catGridLine: { style: "none" },
    showLegend: true, legendPos: "b", legendFontSize: 20, legendColor: H.dk1, legendFontFace: "+mn-lt",
    objectName: "BJOC volume 20 yield chart",
  });
  const by = chY + chH + 0.3;
  bullets([
    "23,320 structures got an InChI: 14,770 plain, 8,550 from Markush substituent enumeration. Duplicates within an article are discarded.",
    "Rejections in manual validation stem mostly from unusual drawing conventions or wrong nickname data stored in the CDX file.",
  ], H1, by, HW, R2B - 1.5 - by, { size: 22, name: "Production bullets" });
  text("Under two minutes for a whole journal volume; every structure is checked by a human before it is published.", H1, R2B - 1.3, HW, 1.3, { size: 22, italic: true, color: C.accent2, name: "Production takeaway" });

  // --- half 2: benchmark
  text("Benchmark vs Open Babel 3.1.1", H2, SY, HW, 0.7, { size: F.sub, bold: true, color: C.accent1, valign: "middle", name: "Sub benchmark" });
  const bchY = SY + 0.85, bchH = 7.0;
  slide.addChart(pres.charts.BAR, [
    { name: "Real InChI generated", labels: ["BChemXtract 1.4.1", "Open Babel 3.1.1"], values: [98.2, 14.2] },
  ], {
    x: H2, y: bchY, w: HW, h: bchH,
    chartArea: { fill: { color: "FFFFFF", transparency: 100 }, roundedCorners: false }, plotArea: { fill: { color: "FFFFFF", transparency: 100 } },
    barDir: "bar", barGapWidthPct: 45,
    chartColors: [H.accent2, H.accent5],
    showTitle: true, title: "225 CDX files: unique substances with a real InChI (%)", titleFontSize: 22, titleColor: H.dk1, titleFontFace: "+mn-lt",
    showValue: true, dataLabelPosition: "outEnd", dataLabelColor: H.dk1, dataLabelFontSize: 26, dataLabelFontBold: true, dataLabelFontFace: "+mn-lt", dataLabelFormatCode: '0.0"%"',
    catAxisLabelFontSize: 20, catAxisLabelColor: H.dk1, catAxisLabelFontFace: "+mn-lt", catAxisOrientation: "maxMin",
    valAxisHidden: true, valAxisMaxVal: 115, valAxisMinVal: 0,
    valGridLine: { style: "none" }, catGridLine: { style: "none" },
    showLegend: false,
    objectName: "Benchmark chart",
  });
  const rows = [
    [{ text: "Metric", options: { bold: true, color: H.lt1, fill: { color: H.accent1 } } }, { text: "BChemXtract", options: { bold: true, color: H.lt1, fill: { color: H.accent1 }, align: "right" } }, { text: "Open Babel", options: { bold: true, color: H.lt1, fill: { color: H.accent1 }, align: "right" } }],
    ["Unique substances", "1360", "1317"],
    ["Real InChIs", "1336 (98.2 %)", "187 (14.2 %)"],
    ["Unexpanded aliases (*)", "23", "617"],
    ["Time per file", "51 ms", "252 ms"],
    ["Per file, one outlier excluded", "51 ms", "55 ms"],
  ].map((r, i) => i === 0 ? r : r.map((v, j) => ({ text: v, options: { align: j ? "right" : "left", fill: { color: i % 2 ? "FFFFFF" : H.accent6 }, color: H.dk1, bold: j === 1 } })));
  const tY = bchY + bchH + 0.3, rh = 0.7;
  slide.addTable(rows, { x: H2, y: tY, w: HW, colW: [HW - 4.6, 2.3, 2.3], fontSize: 21, fontFace: "+mn-lt", rowH: rh, border: { type: "solid", pt: 1, color: "D5DAE6" }, margin: 0.08, valign: "middle", objectName: "Benchmark table" });
  const nY = tY + 6 * rh + 0.35;
  text("Open Babel cannot expand ChemDraw nicknames and S-groups, so most of its output is wildcard SMILES that InChI rejects. Per-file speed is comparable; the 4.9× total gap is one pathological file on which Open Babel spends 44 s.", H2, nY, HW, R2B - 1.5 - nY, { size: 22, name: "Benchmark note" });
  text("Open Babel reads the drawing; BChemXtract reads the chemistry: nicknames, R-groups and Markush legends included.", H2, R2B - 1.3, HW, 1.3, { size: 22, italic: true, color: C.accent2, name: "Benchmark takeaway" });
}
rule(R2B + 0.25);

// =====================================================================
// ROW 3: FAIR (left) / Web application (right)
// =====================================================================
const R3Y = R2B + 0.5, R3B = 43.0; // 33.1 .. 43.0
{
  section("FAIR at the point of publication", LX, R3Y, LW);
  const items = [
    ["Findable", "InChI and InChIKey in the article metadata", "indexed by search engines, resolvable in PubChem"],
    ["Accessible", "Schema.org JSON-LD on every article page", "readable by humans and machines, free download"],
    ["Interoperable", "Open formats only: InChI, SMILES, MDL V3000", "built on CDK, no proprietary software needed"],
    ["Reusable", "Unambiguous identifiers plus an open licence", "the drawing stays exactly as the author made it"],
  ];
  const rh = 1.6, y0 = R3Y + 1.15, pw = 3.5, ph = 0.8;
  slide.addShape(pres.shapes.LINE, { x: LX + 0.25, y: y0 + ph / 2, w: 0, h: 3 * rh, line: { color: H.accent3, width: 2 }, objectName: "FAIR spine" });
  items.forEach((it, i) => {
    const y = y0 + i * rh;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: LX, y, w: pw, h: ph, fill: { color: C.background1 }, line: { color: C.accent3, width: 2.5 }, rectRadius: 0.3, objectName: `FAIR pill ${it[0]}` });
    slide.addText([{ text: it[0][0], options: { color: C.accent2 } }, { text: it[0].slice(1) }], { x: LX, y, w: pw, h: ph, fontSize: 24, bold: true, color: C.accent3, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: `FAIR pill text ${it[0]}` });
    text(it[1], LX + pw + 0.35, y - 0.05, LW - pw - 0.35, 0.6, { size: 22, bold: true, valign: "middle", name: `FAIR line ${it[0]}` });
    text(it[2], LX + pw + 0.35, y + 0.5, LW - pw - 0.35, 0.6, { size: 20, color: GREY, valign: "middle", name: `FAIR detail ${it[0]}` });
  });
  const cy = y0 + 4 * rh + 0.1;
  text("No change for authors, editors or readers: the drawing tool, the manuscript workflow and the figures stay as they are.", LX, cy, LW, 0.95, { size: 22, italic: true, color: C.accent2, name: "FAIR closing line" });
  slide.addText([
    { text: "What comes next: ", options: { bold: true, color: C.accent1 } },
    { text: "reaction schemes with roles and conditions, Markush enumeration beyond legend substitution, and a community-grown abbreviation table." },
  ], { x: LX, y: cy + 1.05, w: LW, h: R3B - (cy + 1.05), fontSize: 20, color: C.text1, valign: "top", margin: 0, isTextBox: true, objectName: "What comes next" });
}
{
  section("Web application", RX, R3Y, RW);
  const sw = (RW - 0.6) / 2, sy = R3Y + 1.1;
  const h1 = sw * 2320 / 4000, h2 = sw * 2400 / 4000;
  const shadow = () => ({ type: "outer", color: H.accent5, blur: 8, offset: 3, angle: 90, opacity: 0.4 });
  slide.addImage({ path: A("web-landing.png"), x: RX, y: sy, w: sw, h: h1, shadow: shadow(), objectName: "Web app landing page" });
  slide.addImage({ path: A("web-browse-top.png"), x: RX + sw + 0.6, y: sy, w: sw, h: h2, shadow: shadow(), objectName: "Web app browse view" });
  text("Landing page of the public instance (v1.5.0)", RX, sy + h2 + 0.15, sw, 0.5, { size: 18, italic: true, color: GREY, align: "center", name: "Caption landing" });
  text("Browse view of one extraction, deduplicated by InChIKey", RX + sw + 0.6, sy + h2 + 0.15, sw, 0.5, { size: 18, italic: true, color: GREY, align: "center", name: "Caption browse" });
  const by = sy + h2 + 0.85;
  bullets([
    "Upload CDX or CDXML in the browser or through the REST API. Every structure comes back with InChI, InChIKey, SMILES, formula and a drawing; search by InChIKey, formula, SMILES or substructure; export PNG, JSON, SDF, CSV, CML and RXN.",
    "Same Java library in-process via JPype, FastAPI, PostgreSQL, Celery and React. One docker compose up for a private instance; public instance at cheminfo.beilstein.org/bchemxtract.",
  ], RX, by, RW, R3B - by, { size: 22, name: "Web bullets" });
}
rule(R3B + 0.25);

// =====================================================================
// FOOTER
// =====================================================================
{
  const FY = R3B + 0.5; // 43.5
  text("MIT licence. Library 1.5.0 on Maven Central (org.beilstein:bchemxtract) and GitHub, web application on GitHub. Numbers measured with 1.4.1 and CDK 2.12.", LX, FY, 26.0, 0.75, { size: 20, color: C.accent1, valign: "middle", name: "Licence line" });
  text("Contact", 27.4, FY, 2.0, 2.5, { size: 24, bold: true, color: C.accent1, align: "right", valign: "middle", name: "Contact label" });
  slide.addImage({ path: A("qr-contact.png"), x: 29.55, y: FY - 0.05, w: 2.55, h: 2.55, objectName: "QR contact e-mail" });
  const refs = [
    "1. Heller, S. R. et al. InChI, the IUPAC International Chemical Identifier. J Cheminform 7, 23 (2015).",
    "2. Willighagen, E. L. et al. The Chemistry Development Kit (CDK) v2.0. J Cheminform 9, 33 (2017).",
    "3. O'Boyle, N. M. et al. Open Babel: an open chemical toolbox. J Cheminform 3, 33 (2011).",
    "4. Wilkinson, M. D. et al. The FAIR Guiding Principles for scientific data management and stewardship. Sci Data 3, 160018 (2016).",
    "5. Kim, S. et al. PubChem 2025 update. Nucleic Acids Res 53, D1516–D1525 (2025).",
    "6. Zenodo: 10.5281/zenodo.22047220 (library, benchmark corpus and scripts), 10.5281/zenodo.21930420 (web application).",
  ];
  const col = (items, x, w) => slide.addText(items.map((t, i) => ({ text: t, options: { breakLine: i < items.length - 1 } })), { x, y: FY + 0.95, w, h: 1.1, fontSize: 15, color: C.text1, valign: "top", margin: 0, isTextBox: true, objectName: "References" });
  col(refs.slice(0, 3), LX, 12.6);
  col(refs.slice(3), LX + 13.0, 13.4);
  text("Funding: all authors are employees of the Beilstein-Institut; no external funding. We thank Jörg Parsch for testing, Nicole Jung for help with the abbreviation lookup tables, the CDK team and the InChI Trust.", LX, FY + 2.15, 23.4, 0.7, { size: 15, color: GREY, valign: "middle", name: "Funding" });
  text("Built on", 24.9, FY + 2.15, 1.6, 0.7, { size: 16, color: GREY, align: "right", valign: "middle", name: "CDK label" });
  slide.addImage({ path: A("cdk.png"), x: 26.7, y: FY + 2.1, w: 1.6, h: 1.6 * 602 / 1200, objectName: "CDK logo" });
}

slide.addNotes("A0 portrait poster for BChemXtract. Numbers from the manuscript (BJOC volume 20 batch with v1.4.1; 225-file benchmark vs Open Babel 3.1.1, report of 2026-09-09). Layout inspired by the Orthonym poster.");

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
