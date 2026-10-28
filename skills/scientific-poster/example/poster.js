// BChemXtract A0 portrait poster, built with pptxgenjs.
// Layout follows the Orthonym poster: wordmark header, abstract band, open sections separated by rules.
const pptxgen = require("pptxgenjs");
const path = require("path");
const fs = require("fs");
const { applyTheme } = require("./theme.js");

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
// type scale: nothing under 28 pt on A0, which is 7 pt when the poster is printed on A4
const F = { title: 52, authors: 36, affil: 28, section: 48, sub: 32, body: 30, small: 28 };

// ---------- layout (frame) ----------
pres.defineSlideMaster({
  title: "Poster",
  background: { path: A("bg.png") },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 4.7, w: 22.8, h: 1.65, fontSize: F.title, bold: true, color: H.dk2, valign: "top", margin: 0, lineSpacingMultiple: 0.95 } } },
    { placeholder: { options: { name: "authors", type: "body", x: M, y: 6.6, w: 13.0, h: 0.75, fontSize: F.authors, color: H.dk2, valign: "top", margin: 0 } } },
    { placeholder: { options: { name: "affil", type: "body", x: 14.0, y: 6.55, w: R - 14.0, h: 1.5, fontSize: F.affil, color: H.accent4, valign: "top", align: "right", margin: 0 } } },
  ],
});

const slide = pres.addSlide({ masterName: "Poster" });

// ---------- helpers ----------
function text(t, x, y, w, h, o = {}) {
  slide.addText(t, { x, y, w, h, fontSize: o.size || F.body, color: o.color || C.text1, bold: !!o.bold, italic: !!o.italic, align: o.align || "left", valign: o.valign || "top", margin: 0, isTextBox: true, lineSpacingMultiple: o.ls || 1.0, objectName: o.name || "Text" });
}
function bullets(items, x, y, w, h, o = {}) {
  const runs = items.map((t, i) => ({ text: t, options: { bullet: { indent: 24 }, breakLine: i < items.length - 1, paraSpaceAfter: 10 } }));
  slide.addText(runs, { x, y, w, h, fontSize: o.size || F.body, color: C.text1, valign: "top", margin: 0, isTextBox: true, objectName: o.name || "Bullets" });
}
function section(title, x, y, w) {
  text(title, x, y, w, 0.9, { size: F.section, color: C.accent1, align: "center", valign: "middle", name: `Section ${title}` });
}
function rule(y) {
  slide.addShape(pres.shapes.LINE, { x: M, y, w: R - M, h: 0, line: { color: RULE, width: 1.5 }, objectName: `Rule ${y}` });
}
// stat row: big value on the left, a two-line label beside it
function stat(x, y, w, h, big, label, color) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: C.background1 }, line: { color: H.accent6, width: 1 }, rectRadius: 0.2, shadow: { type: "outer", color: H.accent5, blur: 6, offset: 2, angle: 90, opacity: 0.3 }, objectName: `Stat ${big}` });
  text(big, x + 0.2, y, 3.3, h, { size: 54, bold: true, color, valign: "middle", name: `Stat value ${big}` });
  text(label, x + 3.6, y, w - 3.8, h, { size: F.small, valign: "middle", name: `Stat label ${big}` });
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
  { text: "1 Beilstein-Institut zur Förderung der Chemischen Wissenschaften, Frankfurt am Main\n" },
  { text: "2 Microverse Centre Jena, Friedrich Schiller University Jena\n" },
  { text: "* fbaensch@beilstein-institut.de", options: { color: H.dk2 } },
], { placeholder: "affil" });

// =====================================================================
// ABSTRACT BAND
// =====================================================================
const AY = 8.6, AH = 5.0;
{
  // vertical tab
  const cx = 1.45, cy = AY + AH / 2, tw = 3.4, th = 0.9;
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx - tw / 2, y: cy - th / 2, w: tw, h: th, rotate: 270, fill: { color: C.accent2 }, line: { color: C.accent2 }, rectRadius: 0.3, objectName: "Abstract tab" });
  slide.addText("Abstract", { x: cx - tw / 2, y: cy - th / 2, w: tw, h: th, rotate: 270, fontSize: 32, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: "Abstract tab text" });
  text("Chemical structures are published mostly as images, so databases and search engines cannot read them. BChemXtract is an open-source Java library that reads the ChemDraw CDX and CDXML files authors already submit, separates the chemistry from annotations, expands abbreviations and converts each structure with the Chemistry Development Kit into InChI, SMILES and MDL formats. In the Beilstein Journals, curators check the structures before they are published as Schema.org JSON-LD and deposited in PubChem. Volume 20 of the Beilstein Journal of Organic Chemistry gave 23,320 structures with an InChI in under two minutes. On a 225-file benchmark, 98.2% of unique substances got a valid InChI, against 14.2% for Open Babel.",
    2.5, AY, 21.6, AH, { size: F.body, align: "justify", ls: 1.04, valign: "middle", name: "Abstract" });
  // QR codes
  const q = 2.6, qx1 = 25.1, qx2 = 28.9;
  slide.addImage({ path: A("qr-github.png"), x: qx1, y: AY, w: q, h: q, objectName: "QR library GitHub" });
  slide.addImage({ path: A("qr-web.png"), x: qx2, y: AY, w: q, h: q, objectName: "QR web application" });
  text("GitHub", qx1 - 0.4, AY + q + 0.1, q + 0.8, 0.5, { size: F.small, align: "center", color: C.accent1, name: "QR label 1" });
  text("Web app", qx2 - 0.4, AY + q + 0.1, q + 0.8, 0.5, { size: F.small, align: "center", color: C.accent1, name: "QR label 2" });
  text("cheminfo.beilstein.org/bchemxtract", 24.2, AY + 3.4, R - 24.2, 0.5, { size: F.small, italic: true, color: C.accent2, align: "center", name: "Web URL" });
  text("github.com/beilstein-institut/bchemxtract", 24.2, AY + 3.95, R - 24.2, 0.5, { size: F.small, italic: true, color: C.accent1, align: "center", name: "GitHub URL" });
}
rule(AY + AH + 0.35);

// =====================================================================
// ROW 2: How it works (left) / Results (right)
// =====================================================================
const R2Y = AY + AH + 0.6, R2B = 32.5; // 14.2 .. 32.5
{
  section("How BChemXtract works", LX, R2Y, LW);
  // problem illustration
  const pimg = fs.existsSync(A("problem.png")) ? "problem.png" : "problem.jpeg";
  const iw = 10.0, ih = iw * 1184 / 3584;
  slide.addImage({ path: A(pimg), x: LX + (LW - iw) / 2, y: R2Y + 1.0, w: iw, h: ih, objectName: "Problem illustration" });
  text("A figure reaches the reader as pixels. The ChemDraw file behind it still holds the atoms and bonds.", LX, R2Y + 1.05 + ih, LW, 0.95, { size: F.small, italic: true, color: GREY, align: "center", name: "Problem caption" });
  // legend, two by two
  const ly = R2Y + 5.4;
  const leg = [["Input", C.accent5], ["BChemXtract library", C.accent1], ["Editorial workflow", C.accent3], ["Published output", C.accent2]];
  leg.forEach(([t, col], i) => {
    const x = LX + (i % 2) * 5.6, y = ly + Math.floor(i / 2) * 0.55;
    slide.addShape(pres.shapes.RECTANGLE, { x, y: y + 0.1, w: 0.35, h: 0.35, fill: { color: col }, line: { color: col }, objectName: `Legend swatch ${i}` });
    text(t, x + 0.5, y, 5.0, 0.55, { size: F.small, valign: "middle", name: `Legend text ${i}` });
  });
  // flow: one line of text per step at 28 pt
  const steps = [
    ["CDX / CDXML file", "Submitted with the manuscript; no ChemDraw needed.", "in"],
    ["CDX object model", "Fragments, atoms, bonds, text, arrows as Java objects.", "lib"],
    ["Fragment visitors", "Chemistry split from labels; nicknames expanded.", "lib"],
    ["CDK conversion", "Stereo from wedges and CIP labels; sugars recognised.", "lib"],
    ["Identifiers", "InChI, InChIKey, SMILES, V3000; one per InChIKey.", "lib"],
    ["Manual validation", "About 200 structures per hour, checked by eye.", "val"],
    ["FAIR publication", "Schema.org JSON-LD, PubChem deposit, download.", "out"],
  ];
  const fills = { in: C.accent5, lib: C.accent1, val: C.accent3, out: C.accent2 };
  const txt = { in: C.accent1, lib: C.background1, val: C.background1, out: C.background1 };
  const bh = 1.22, bg = 0.32;
  let sy = R2Y + 6.65;
  steps.forEach((s, i) => {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: LX, y: sy, w: LW, h: bh, fill: { color: fills[s[2]] }, line: { color: fills[s[2]] }, rectRadius: 0.15, objectName: `Step ${i + 1} box` });
    text(s[0], LX + 0.3, sy + 0.06, LW - 0.6, 0.55, { size: F.sub, bold: true, color: txt[s[2]], valign: "middle", name: `Step ${i + 1} title` });
    text(s[1], LX + 0.3, sy + 0.62, LW - 0.6, 0.5, { size: F.small, color: txt[s[2]], valign: "middle", name: `Step ${i + 1} text` });
    if (i < steps.length - 1) slide.addShape(pres.shapes.DOWN_ARROW, { x: LX + LW / 2 - 0.25, y: sy + bh + 0.03, w: 0.5, h: bg - 0.06, fill: { color: C.accent4 }, line: { color: C.accent4 }, objectName: `Arrow ${i + 1}` });
    sy += bh + bg;
  });
}
{
  section("Results", RX, R2Y, RW);
  const HW = (RW - 0.8) / 2, H1 = RX, H2 = RX + HW + 0.8;
  const SY = R2Y + 1.05;
  const chartText = { fontFace: "+mn-lt", size: F.small };
  // --- half 1: production
  text("In production: BJOC vol. 20", H1, SY, HW, 0.7, { size: F.sub, bold: true, color: C.accent1, valign: "middle", name: "Sub production" });
  const sh = 1.15, ty = SY + 0.85;
  stat(H1, ty, HW, sh, "110 s", "for the whole volume\n(version 1.4.1)", C.accent1);
  stat(H1, ty + sh + 0.2, HW, sh, "81.0%", "of 28,785 fragments\ngave an InChI", C.accent2);
  stat(H1, ty + 2 * (sh + 0.2), HW, sh, "19,965", "unique InChIs\nin the volume", C.accent3);
  const chY = ty + 3 * (sh + 0.2) + 0.15, chH = 8.4;
  slide.addChart(pres.charts.BAR, [
    { name: "Plain", labels: ["Fragments", "With InChI", "Unique InChIs"], values: [28785, 14770, 19965] },
    { name: "Markush, enumerated", labels: ["Fragments", "With InChI", "Unique InChIs"], values: [null, 8550, null] },
  ], {
    x: H1, y: chY, w: HW, h: chH,
    chartArea: { fill: { color: "FFFFFF", transparency: 100 }, roundedCorners: false }, plotArea: { fill: { color: "FFFFFF", transparency: 100 } },
    barDir: "col", barGrouping: "stacked", barGapWidthPct: 45,
    chartColors: [H.accent1, H.accent3],
    showTitle: true, title: "Yield from 2,993 figures and schemes", titleFontSize: chartText.size, titleColor: H.dk1, titleFontFace: chartText.fontFace,
    showValue: true, dataLabelPosition: "ctr", dataLabelColor: "FFFFFF", dataLabelFontSize: chartText.size, dataLabelFontBold: true, dataLabelFontFace: chartText.fontFace, dataLabelFormatCode: "#,##0",
    catAxisLabelFontSize: chartText.size, catAxisLabelColor: H.dk1, catAxisLabelFontFace: chartText.fontFace,
    valAxisHidden: true, valAxisMaxVal: 30000, valGridLine: { style: "none" }, catGridLine: { style: "none" },
    showLegend: true, legendPos: "b", legendFontSize: chartText.size, legendColor: H.dk1, legendFontFace: chartText.fontFace,
    objectName: "BJOC volume 20 yield chart",
  });
  const by = chY + chH + 0.3;
  bullets([
    "23,320 structures got an InChI: 14,770 plain, 8,550 from Markush enumeration.",
    "Most rejections come from unusual drawings or wrong nickname data in the file.",
  ], H1, by, HW, R2B - 1.4 - by, { name: "Production bullets" });
  text("A whole journal volume in under two minutes; a human checks every structure.", H1, R2B - 1.3, HW, 1.3, { italic: true, color: C.accent2, valign: "bottom", name: "Production takeaway" });

  // --- half 2: benchmark
  text("Benchmark vs Open Babel 3.1.1", H2, SY, HW, 0.7, { size: F.sub, bold: true, color: C.accent1, valign: "middle", name: "Sub benchmark" });
  const bchY = SY + 0.85, bchH = 7.6;
  slide.addChart(pres.charts.BAR, [
    { name: "Real InChI generated", labels: ["BChemXtract", "Open Babel"], values: [98.2, 14.2] },
  ], {
    x: H2, y: bchY, w: HW, h: bchH,
    chartArea: { fill: { color: "FFFFFF", transparency: 100 }, roundedCorners: false }, plotArea: { fill: { color: "FFFFFF", transparency: 100 } },
    barDir: "bar", barGapWidthPct: 45,
    chartColors: [H.accent2, H.accent5],
    showTitle: true, title: "225 files: substances with a real InChI (%)", titleFontSize: chartText.size, titleColor: H.dk1, titleFontFace: chartText.fontFace,
    showValue: true, dataLabelPosition: "outEnd", dataLabelColor: H.dk1, dataLabelFontSize: 36, dataLabelFontBold: true, dataLabelFontFace: chartText.fontFace, dataLabelFormatCode: '0.0"%"',
    catAxisLabelFontSize: chartText.size, catAxisLabelColor: H.dk1, catAxisLabelFontFace: chartText.fontFace, catAxisOrientation: "maxMin",
    valAxisHidden: true, valAxisMaxVal: 125, valAxisMinVal: 0,
    valGridLine: { style: "none" }, catGridLine: { style: "none" },
    showLegend: false,
    objectName: "Benchmark chart",
  });
  const rows = [
    [{ text: "Metric", options: { bold: true, color: H.lt1, fill: { color: H.accent1 } } }, { text: "BChemXtract", options: { bold: true, color: H.lt1, fill: { color: H.accent1 }, align: "right" } }, { text: "Open Babel", options: { bold: true, color: H.lt1, fill: { color: H.accent1 }, align: "right" } }],
    ["Unique substances", "1,360", "1,317"],
    ["Real InChIs", "1,336", "187"],
    ["Unexpanded aliases", "23", "617"],
    ["Time per file", "51 ms", "252 ms"],
    ["… one outlier out", "51 ms", "55 ms"],
  ].map((r, i) => i === 0 ? r : r.map((v, j) => ({ text: v, options: { align: j ? "right" : "left", fill: { color: i % 2 ? "FFFFFF" : H.accent6 }, color: H.dk1, bold: j === 1 } })));
  const tY = bchY + bchH + 0.3, rh = 0.74;
  slide.addTable(rows, { x: H2, y: tY, w: HW, colW: [HW - 5.1, 2.6, 2.5], fontSize: F.small, fontFace: "+mn-lt", rowH: rh, border: { type: "solid", pt: 1, color: "D5DAE6" }, margin: 0.08, valign: "middle", objectName: "Benchmark table" });
  const nY = tY + 6 * rh + 0.35;
  text("Open Babel cannot expand ChemDraw nicknames, so most of its SMILES are wildcards that InChI rejects. Per file, the speed is the same; one file costs Open Babel 44 s.", H2, nY, HW, R2B - 1.4 - nY, { name: "Benchmark note" });
  text("Open Babel reads the drawing; BChemXtract reads the chemistry.", H2, R2B - 1.3, HW, 1.3, { italic: true, color: C.accent2, valign: "bottom", name: "Benchmark takeaway" });
}
rule(R2B + 0.25);

// =====================================================================
// ROW 3: FAIR (left) / Web application (right)
// =====================================================================
const R3Y = R2B + 0.5, R3B = 42.55; // 33.0 .. 42.55
{
  section("FAIR at publication", LX, R3Y, LW);
  const items = [
    ["Findable", "InChI and InChIKey in metadata", "indexed, resolvable in PubChem"],
    ["Accessible", "JSON-LD on every article page", "for people and machines, free"],
    ["Interoperable", "InChI, SMILES, MDL V3000", "built on CDK, no paid software"],
    ["Reusable", "Exact identifiers, open licence", "the drawing stays as it was"],
  ];
  const rh = 1.62, y0 = R3Y + 1.2, pw = 3.4, ph = 0.85;
  slide.addShape(pres.shapes.LINE, { x: LX + 0.25, y: y0 + ph / 2, w: 0, h: 3 * rh, line: { color: H.accent3, width: 2 }, objectName: "FAIR spine" });
  items.forEach((it, i) => {
    const y = y0 + i * rh;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: LX, y, w: pw, h: ph, fill: { color: C.background1 }, line: { color: C.accent3, width: 2.5 }, rectRadius: 0.3, objectName: `FAIR pill ${it[0]}` });
    slide.addText([{ text: it[0][0], options: { color: C.accent2 } }, { text: it[0].slice(1) }], { x: LX, y, w: pw, h: ph, fontSize: F.small, bold: true, color: C.accent3, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: `FAIR pill text ${it[0]}` });
    text(it[1], LX + pw + 0.3, y - 0.08, LW - pw - 0.3, 0.6, { bold: true, valign: "middle", name: `FAIR line ${it[0]}` });
    text(it[2], LX + pw + 0.3, y + 0.5, LW - pw - 0.3, 0.55, { size: F.small, color: GREY, valign: "middle", name: `FAIR detail ${it[0]}` });
  });
  const cy = y0 + 4 * rh;
  text("Authors, editors and readers change nothing.", LX, cy, LW, 0.55, { italic: true, color: C.accent2, name: "FAIR closing line" });
  slide.addText([
    { text: "Next: ", options: { bold: true, color: C.accent1 } },
    { text: "reaction schemes, wider Markush enumeration, a shared abbreviation table." },
  ], { x: LX, y: cy + 0.7, w: LW, h: R3B - (cy + 0.7), fontSize: F.small, color: C.text1, valign: "top", margin: 0, isTextBox: true, objectName: "What comes next" });
}
{
  section("Web application", RX, R3Y, RW);
  const sw = (RW - 0.6) / 2, sy = R3Y + 1.15;
  const h1 = sw * 2320 / 4000, h2 = sw * 2400 / 4000;
  const shadow = () => ({ type: "outer", color: H.accent5, blur: 8, offset: 3, angle: 90, opacity: 0.4 });
  slide.addImage({ path: A("web-landing.png"), x: RX, y: sy, w: sw, h: h1, shadow: shadow(), objectName: "Web app landing page" });
  slide.addImage({ path: A("web-browse-top.png"), x: RX + sw + 0.6, y: sy, w: sw, h: h2, shadow: shadow(), objectName: "Web app browse view" });
  text("Landing page (version 1.5.0)", RX, sy + h2 + 0.15, sw, 0.5, { size: F.small, italic: true, color: GREY, align: "center", name: "Caption landing" });
  text("One extraction, one row per InChIKey", RX + sw + 0.6, sy + h2 + 0.15, sw, 0.5, { size: F.small, italic: true, color: GREY, align: "center", name: "Caption browse" });
  const by = sy + h2 + 0.85;
  bullets([
    "Upload CDX or CDXML in the browser or through the REST API; get InChI, InChIKey, SMILES and a drawing for every structure.",
    "Search by InChIKey, formula or substructure; export SDF, CSV, JSON, CML and more.",
  ], RX, by, RW, R3B - by, { name: "Web bullets" });
}
rule(R3B + 0.25);

// =====================================================================
// FOOTER
// =====================================================================
{
  const FY = R3B + 0.5; // 43.05
  text("MIT licence. Library 1.5.0 on Maven Central (org.beilstein:bchemxtract) and GitHub. Numbers from 1.4.1 with CDK 2.12.", LX, FY, 26.0, 0.55, { size: F.small, color: C.accent1, valign: "middle", name: "Licence line" });
  text("Contact", 26.6, FY + 0.6, 2.6, 0.6, { size: F.small, bold: true, color: C.accent1, align: "right", valign: "middle", name: "Contact label" });
  slide.addImage({ path: A("qr-contact.png"), x: 29.55, y: FY - 0.05, w: 2.55, h: 2.55, objectName: "QR contact e-mail" });
  // short references on the poster; the full list goes into the README
  const refs = [
    "1  Heller SR et al. J Cheminform 2015;7:23",
    "2  Willighagen EL et al. J Cheminform 2017;9:33",
    "3  O'Boyle NM et al. J Cheminform 2011;3:33",
    "4  Wilkinson MD et al. Sci Data 2016;3:160018",
    "5  Kim S et al. Nucleic Acids Res 2025;53:D1516",
    "6  Zenodo 10.5281/zenodo.22047220",
  ];
  const col = (items, x, w) => slide.addText(items.map((t, i) => ({ text: t, options: { breakLine: i < items.length - 1 } })), { x, y: FY + 0.7, w, h: 1.45, fontSize: F.small, color: C.text1, valign: "top", margin: 0, isTextBox: true, objectName: "References" });
  col(refs.slice(0, 3), LX, 12.6);
  col(refs.slice(3), LX + 12.9, 12.6);
  text("Funding: all authors are employees of the Beilstein-Institut; no external funding. We thank Jörg Parsch, Nicole Jung, the CDK team and the InChI Trust.", LX, FY + 2.25, 23.0, 0.95, { size: F.small, color: GREY, valign: "top", name: "Funding" });
  text("Built on", 24.3, FY + 2.6, 2.2, 0.6, { size: F.small, color: GREY, align: "right", valign: "middle", name: "CDK label" });
  slide.addImage({ path: A("cdk.png"), x: 26.7, y: FY + 2.6, w: 1.6, h: 1.6 * 602 / 1200, objectName: "CDK logo" });
}

slide.addNotes("A0 portrait poster for BChemXtract. Numbers from the manuscript (BJOC volume 20 batch with v1.4.1; 225-file benchmark vs Open Babel 3.1.1, report of 2026-09-09). Layout inspired by the Orthonym poster. Nothing under 28 pt, so an A4 print stays readable at arm's length.");

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
