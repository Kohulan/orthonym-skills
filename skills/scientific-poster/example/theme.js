// Writes the poster palette into the pptx theme, so pres.SchemeColor shapes render in the poster's
// colours and stay recolourable in PowerPoint. pptxgenjs sets the theme fonts but always writes
// Office's colour scheme; this replaces it after writeFile.
//
//   const { applyTheme } = require("./theme.js");
//   await pres.writeFile({ fileName: OUT });
//   await applyTheme(OUT, THEME);   // THEME = { name, colors: { dk1, lt1, ..., folHlink } }
const fs = require("fs");

const SLOTS = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];

// jszip ships with pptxgenjs; resolve it from there so no separate install is needed.
const JSZip = require(require.resolve("jszip", { paths: [require.resolve("pptxgenjs")] }));

async function applyTheme(file, theme) {
  for (const k of SLOTS) {
    if (!/^[0-9A-F]{6}$/i.test(theme.colors[k] || "")) throw new Error(`THEME.colors.${k} must be six hex digits without "#"`);
  }
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const part = "ppt/theme/theme1.xml";
  const xml = await zip.file(part).async("string");
  const name = theme.name.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const scheme = `<a:clrScheme name="${name}">` +
    SLOTS.map((k) => `<a:${k}><a:srgbClr val="${theme.colors[k].toUpperCase()}"/></a:${k}>`).join("") +
    "</a:clrScheme>";
  const out = xml.replace(/<a:clrScheme\b[\s\S]*?<\/a:clrScheme>/, () => scheme);
  if (!out.includes(scheme)) throw new Error(`${part} has no colour scheme to replace`);
  zip.file(part, out);
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

module.exports = { applyTheme };
