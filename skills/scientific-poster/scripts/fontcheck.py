#!/usr/bin/env python3
"""Fail when any text on a poster is too small to read on an A4 print at arm's length.

Usage: fontcheck.py <poster.pptx> [--a4 7]

The floor is given as the size the text must have when the whole poster is printed on A4
(default 7 pt). The script scales it to the slide: 28 pt on A0, about 20 pt on A1.
It reads every text run on the slides (placeholder runs take their size from the slide
layout), every table cell and every chart (titles, axes, data labels, legends).
Text with no size anywhere is reported as unknown, because PowerPoint then uses its
default, which is too small for a poster. Exit 1 when anything is under the floor or unknown.
"""
import re
import sys
import zipfile
import posixpath
try:  # defusedxml is in the build venv; the stdlib parser is the fallback
    from defusedxml import ElementTree as ET
except ImportError:
    import xml.etree.ElementTree as ET

NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "c": "http://schemas.openxmlformats.org/drawingml/2006/chart",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}
REL = "{http://schemas.openxmlformats.org/package/2006/relationships}Relationship"
A4_SHORT_IN = 210 / 25.4  # A4 width in inches; portrait poster width scales to it


def rels(z, part):
    """Map relationship ids of a part to the target part names."""
    d, f = posixpath.split(part)
    rp = posixpath.join(d, "_rels", f + ".rels")
    if rp not in z.namelist():
        return {}
    out = {}
    for r in ET.fromstring(z.read(rp)).iter(REL):
        tgt = r.get("Target")
        out[r.get("Id")] = tgt.lstrip("/") if tgt.startswith("/") else posixpath.normpath(posixpath.join(d, tgt))
    return out


def ph_key(sp):
    ph = sp.find("p:nvSpPr/p:nvPr/p:ph", NS)
    return None if ph is None else (ph.get("type", "body"), ph.get("idx", "0"))


def layout_sizes(z, layout):
    """Font size of each placeholder in a slide layout, keyed by (type, idx) and by type."""
    sizes = {}
    for sp in ET.fromstring(z.read(layout)).iter(f"{{{NS['p']}}}sp"):
        k = ph_key(sp)
        if k is None:
            continue
        sz = [int(e.get("sz")) for e in sp.iter() if e.get("sz") and e.tag.endswith(("defRPr", "rPr"))]
        if sz:
            sizes[k] = sizes[k[0]] = min(sz) / 100
    return sizes


def flag(el, path):
    e = el.find(path, NS)
    return e is not None and e.get("val") in ("1", "true")


def shown(dl):
    """True when a data label element shows anything."""
    return not flag(dl, "c:delete") and any(
        flag(dl, f"c:{k}") for k in ("showVal", "showCatName", "showSerName", "showPercent"))


def size_in(dl):
    s = [int(e.get("sz")) / 100 for e in dl.findall("c:txPr//a:defRPr", NS) if e.get("sz")]
    return min(s) if s else None


def dlbl_sizes(dls, chart):
    """Sizes of the data labels that are drawn: per-point labels, and the series default
    only where a point has no label of its own."""
    out = []
    points = [d for d in dls.findall("c:dLbl", NS) if shown(d)]
    out += [(size_in(d), "chart data label") for d in points]
    ser = next((s for s in chart.iter(f"{{{NS['c']}}}ser") if dls in list(s)), None)
    n = ser.find(".//c:val//c:ptCount", NS) if ser is not None else None
    covered = {d.find("c:idx", NS).get("val") for d in dls.findall("c:dLbl", NS)}
    if shown(dls) and (n is None or len(covered) < int(n.get("val"))):
        out.append((size_in(dls), "chart data labels"))
    return out


def text_of(el):
    return "".join(t.text or "" for t in el.iter(f"{{{NS['a']}}}t")).strip()


def main():
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    a4 = float(args[args.index("--a4") + 1]) if "--a4" in args else 7.0
    z = zipfile.ZipFile(args[0])
    pres = ET.fromstring(z.read("ppt/presentation.xml"))
    sld = pres.find("p:sldSz", NS)
    w_in = min(int(sld.get("cx")), int(sld.get("cy"))) / 914400
    scale = A4_SHORT_IN / w_in
    floor = round(a4 / scale * 2) / 2  # A0 is 841 mm, not 4 x 210 mm: 28.03 pt becomes 28
    found, small, unknown = [], [], []
    slides = sorted((n for n in z.namelist() if re.fullmatch(r"ppt/slides/slide\d+\.xml", n)),
                    key=lambda n: int(re.findall(r"\d+", n)[-1]))
    for part in slides:
        root = ET.fromstring(z.read(part))
        rl = rels(z, part)
        layout = next((t for t in rl.values() if "slideLayouts/" in t), None)
        lsz = layout_sizes(z, layout) if layout else {}
        for sp in root.iter():
            if sp.tag not in (f"{{{NS['p']}}}sp", f"{{{NS['p']}}}graphicFrame"):
                continue
            name = (sp.find(".//p:cNvPr", NS).get("name") if sp.find(".//p:cNvPr", NS) is not None else "?")
            k = ph_key(sp) if sp.tag.endswith("}sp") else None
            inherited = lsz.get(k) or (lsz.get(k[0]) if k else None)
            for para in sp.iter(f"{{{NS['a']}}}p"):
                for r in para.findall("a:r", NS):
                    t = text_of(r)
                    if not t:
                        continue
                    rpr = r.find("a:rPr", NS)
                    sz = rpr.get("sz") if rpr is not None else None
                    size = int(sz) / 100 if sz else inherited
                    (found if size else unknown).append((size, part, name, t))
            # charts: every sz in the chart part, labelled by the element that holds it
            for ch in sp.iter(f"{{{NS['c']}}}chart"):
                cpart = rl.get(ch.get(f"{{{NS['r']}}}id"))
                if not cpart:
                    continue
                croot = ET.fromstring(z.read(cpart))
                for tag in ("title", "valAx", "catAx", "dLbls", "legend"):
                    for el in croot.iter(f"{{{NS['c']}}}{tag}"):
                        if tag in ("valAx", "catAx") and flag(el, "c:delete"):
                            continue
                        label = f"chart {tag}"
                        if tag == "dLbls":
                            for s, lbl in dlbl_sizes(el, croot):
                                (found if s else unknown).append((s, cpart, name, lbl))
                            continue
                        szs = [int(e.get("sz")) / 100 for e in el.iter() if e.get("sz")]
                        if szs:
                            found.append((min(szs), cpart, name, label))
                        else:
                            unknown.append((None, cpart, name, label))
    small = [f for f in found if f[0] < floor - 1e-6]
    lo = min((f[0] for f in found), default=0)
    print(f"slide {w_in:.2f} in wide; floor {a4:g} pt on A4 = {floor:.1f} pt on the poster")
    print(f"smallest text {lo:g} pt = {lo * scale:.1f} pt on A4; runs under the floor: {len(small)}; "
          f"without a size: {len(unknown)}")
    for s, part, name, t in sorted(small) + unknown:
        print(f"  {'?' if s is None else f'{s:g}'} pt  {part.split('/')[-1]}  [{name}]  {t[:60]}")
    sys.exit(1 if small or unknown else 0)


if __name__ == "__main__":
    main()
