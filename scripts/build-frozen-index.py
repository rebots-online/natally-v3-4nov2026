#!/usr/bin/env python3
"""Builds LIBS/UI/STITCH/FROZEN.md, ELEMENTS.md and index.html from the per-screen
notes.json and elements.json files. Run again after any screen is re-frozen.

    python3 scripts/build-frozen-index.py
"""
import hashlib, html, json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
STITCH = ROOT / "LIBS" / "UI" / "STITCH"
PROJECT = "8007307049701360266"
DESIGN_SYSTEM = "assets/10690659705351619056"
ORDER = [
    "pick-a-modality", "landing-desktop", "landing-phone", "sign-in", "birth-details",
    "voice-setup", "atelier", "atelier-desktop", "atelier-chart-lesson",
    "synastry-share-sheets", "top-up", "profile", "settings", "about",
    "souvenir-offer", "souvenir-atelier", "souvenir-pdf-opening", "souvenir-pdf-elements",
]

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    screens, problems = [], []
    for slug in ORDER:
        d = STITCH / "screens" / slug
        if not (d / "notes.json").exists():
            problems.append(f"{slug}: not frozen yet")
            continue
        notes = json.loads((d / "notes.json").read_text())
        elements = json.loads((d / "elements.json").read_text())
        ids = [e["id"] for e in elements]
        dupes = sorted({i for i in ids if ids.count(i) > 1})
        if dupes:
            problems.append(f"{slug}: duplicate ids {dupes}")
        if sha(d / "original.html") != notes["originalSha256"]:
            problems.append(f"{slug}: original.html differs from its recorded hash")
        notes["frozenSha256"] = sha(d / "index.html")
        screens.append((slug, notes, elements))

    # FROZEN.md
    L = ["# Frozen UI — Natally v3", "",
         f"Google Stitch project `{PROJECT}`, design system \"Natally\" (`{DESIGN_SYSTEM}`).",
         "This folder is the UI. Architecture rows cite a screen and an element id from here;",
         "coders wire these elements and never redesign them.", "",
         "Each screen folder holds:", "",
         "- `original.html`: the Stitch export, byte for byte. Never edited.",
         "- `index.html`: the frozen copy. It differs from the original only by the corrections listed below.",
         "- `elements.json`: every element that has an id.",
         "- `notes.json`: hashes and the corrections applied.",
         "- `stitch-screenshot.png`, `frozen-screenshot.png`: Stitch's render and a browser render of the frozen copy.", "",
         "Corrections allowed at freeze, and nothing else:", "",
         "1. Stitch's stand-in pictures replaced by the brand files under `public/`.",
         "2. Astrological glyphs forced to text form.",
         "3. Words Stitch added after a bracket placeholder removed.",
         "4. A unique id added to any interactive element that had none.", "",
         "Text in square brackets is a placeholder for live data. Example values (a name, a date,",
         "a price, a balance) are examples; the app shows real data or values from configuration.", "",
         "| Screen | Folder | Stitch screen id | Ids | Interactive | Art replaced | Ids added | sha256 of frozen copy |",
         "|---|---|---|---|---|---|---|---|"]
    for slug, n, els in screens:
        L.append(f"| {n['title']} | `screens/{slug}/` | `{n['stitchScreenId']}` | {len(els)} | "
                 f"{sum(1 for e in els if e.get('interactive'))} | {len(n.get('artReplaced', []))} | "
                 f"{len(n.get('idsAdded', []))} | `{n['frozenSha256'][:16]}…` |")
    L += ["", "## Corrections applied, per screen", ""]
    for slug, n, _ in screens:
        L.append(f"### {n['title']} (`{slug}`)")
        for a in n.get("artReplaced", []):
            L.append(f"- Art: {a.get('what')} → `{a.get('to')}`")
        if n.get("glyphsFixed"):
            L.append(f"- Glyphs forced to text: {n['glyphsFixed']}")
        for frag in n.get("placeholderTextRemoved", []):
            L.append(f"- Removed added words: \"{frag}\"")
        for i in n.get("idsAdded", []):
            L.append(f"- Id added: `{i}`")
        for c in n.get("orchestratorCorrections", []):
            L.append(f"- {c}")
        if not (n.get("artReplaced") or n.get("glyphsFixed") or n.get("placeholderTextRemoved") or n.get("idsAdded") or n.get("orchestratorCorrections")):
            L.append("- None beyond the text-glyph rule.")
        L.append("")
    (STITCH / "FROZEN.md").write_text("\n".join(L))

    # ELEMENTS.md
    E = ["# Element catalogue — frozen UI", "",
         "Every element with an id, per screen, in document order. `●` marks an interactive element.", ""]
    for slug, n, els in screens:
        E += [f"## {n['title']} — `screens/{slug}/index.html`", "", "| | id | tag | text |", "|---|---|---|---|"]
        for e in els:
            text = (e.get("text") or "").replace("|", "\\|").replace("\n", " ")
            tag = e["tag"] + (f"[{e['type']}]" if e.get("type") else "")
            E.append(f"| {'●' if e.get('interactive') else ''} | `{e['id']}` | {tag} | {text} |")
        E.append("")
    (STITCH / "ELEMENTS.md").write_text("\n".join(E))

    # index.html gallery
    cards = "\n".join(
        f'<a class="card" href="screens/{slug}/index.html"><img loading="lazy" src="screens/{slug}/frozen-screenshot.png" alt="">'
        f'<span>{html.escape(n["title"])}</span></a>' for slug, n, _ in screens)
    (STITCH / "index.html").write_text(f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Natally v3 — frozen screens</title>
<style>
 body{{margin:0;background:#120c1c;color:#f1e8d8;font:15px/1.5 system-ui,sans-serif;padding:24px}}
 h1{{font:400 28px Georgia,serif;margin:0 0 4px}} p{{color:#a698b5;margin:0 0 24px}}
 .grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}}
 .card{{display:block;background:#1a1226;border:1px solid #3a2d50;border-radius:16px;overflow:hidden;color:inherit;text-decoration:none}}
 .card img{{width:100%;height:320px;object-fit:cover;object-position:top;display:block;background:#0b0712}}
 .card span{{display:block;padding:12px 16px}}
 .card:hover{{border-color:#c9a24a}}
</style></head><body>
<h1>Natally v3 — frozen screens</h1>
<p>Stitch project {PROJECT}. Open a screen to operate it.</p>
<div class="grid">
{cards}
</div></body></html>
""")
    print(f"{len(screens)} screens indexed; {sum(len(e) for _, _, e in screens)} elements with ids")
    for p in problems:
        print("PROBLEM:", p)
    return 1 if problems else 0

if __name__ == "__main__":
    sys.exit(main())
