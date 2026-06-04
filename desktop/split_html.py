#!/usr/bin/env python3
"""
split_html.py — Split WeProject_Desktop.html into separate CSS / JS / image files
for clean GitHub Pages hosting.
"""

import re
import os
import shutil
import hashlib
import base64
import sys

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR  = "/Users/candy/Documents/1.WeQuote/1.Design/17-Prototype-html/1-WeProject Portal/desktop"
SRC_FILE  = os.path.join(BASE_DIR, "WeProject_Desktop.html")
BAK_FILE  = os.path.join(BASE_DIR, "WeProject_Desktop_original.html")
OUT_HTML  = os.path.join(BASE_DIR, "WeProject_Desktop.html")
OUT_CSS   = os.path.join(BASE_DIR, "style.css")
OUT_JS    = os.path.join(BASE_DIR, "script.js")
IMG_DIR   = os.path.join(BASE_DIR, "images")
SPLIT_OLD = os.path.join(BASE_DIR, "WeProject_Desktop_split.html")

# Line numbers (1-based, inclusive) from the spec
LINE_HEAD_START   = 1      # <!DOCTYPE …>
LINE_HEAD_END     = 8      # <!-- Font Awesome … -->   (line before <style>)
LINE_CSS_START    = 10     # first line inside <style>
LINE_CSS_END      = 4245   # last line inside <style> (line 4246 is </style>)
LINE_BODY_START   = 4248   # <body>
LINE_BODY_END     = 7651   # last line before <script>
LINE_JS_START     = 7653   # first line inside <script>
LINE_JS_END       = 8561   # last line inside <script> (line 8562 is </script>)
LINE_PANELS_START = 8563   # panels + branding HTML after </script>
LINE_PANELS_END   = 8726   # </body></html> (or last line of file)

# ── Step 1: backup ─────────────────────────────────────────────────────────────
print("Backing up original file …")
shutil.copy2(SRC_FILE, BAK_FILE)
print(f"  Backup → {BAK_FILE}  ({os.path.getsize(BAK_FILE):,} bytes)")

# ── Step 2: read all lines (file is ~82 MB — fits in memory) ──────────────────
print("Reading source file …")
with open(SRC_FILE, "r", encoding="utf-8") as fh:
    lines = fh.readlines()
print(f"  {len(lines):,} lines read")

# Join to a single string for regex replacement
content = "".join(lines)
print(f"  Total chars: {len(content):,}")

# ── Step 3: extract & replace base64 data URIs ────────────────────────────────
print("Scanning for base64 data URIs …")

os.makedirs(IMG_DIR, exist_ok=True)

# Regex: capture (mime_type, base64_data)
# The data runs until a quote (single or double) or closing paren.
DATA_URI_RE = re.compile(
    r'data:image/(png|svg\+xml|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/=]+)',
    re.ASCII
)

# Maps hash → (filename, replacement_uri)
hash_to_img: dict[str, tuple[str, str]] = {}
# Maps original data_uri_string → replacement_path  (for string replacement)
uri_to_path: dict[str, str] = {}

img_counter = 0
total_matches = 0

for m in DATA_URI_RE.finditer(content):
    mime  = m.group(1)   # e.g. "png" or "svg+xml"
    data  = m.group(2)   # base64 payload

    total_matches += 1

    # Determine extension
    if mime == "svg+xml":
        ext = "svg"
    elif mime in ("jpeg", "jpg"):
        ext = "jpg"
    else:
        ext = mime   # png, gif, webp

    # Deduplicate by SHA-256 of the raw base64 string
    h = hashlib.sha256(data.encode("ascii")).hexdigest()

    if h not in hash_to_img:
        img_counter += 1
        filename     = f"img_{img_counter:02d}.{ext}"
        filepath     = os.path.join(IMG_DIR, filename)
        rel_path     = f"images/{filename}"

        # Decode and save
        try:
            raw_bytes = base64.b64decode(data)
        except Exception as e:
            print(f"  WARNING: could not decode image {filename}: {e}")
            continue

        with open(filepath, "wb") as img_fh:
            img_fh.write(raw_bytes)

        hash_to_img[h] = (filename, rel_path)
        print(f"  Saved  images/{filename}  ({len(raw_bytes):,} bytes)")
    else:
        rel_path = hash_to_img[h][1]

    # Record full data URI → relative path (only if not already recorded)
    full_uri = m.group(0)   # "data:image/png;base64,<data>"
    if full_uri not in uri_to_path:
        uri_to_path[full_uri] = rel_path

print(f"\n  Total data-URI occurrences : {total_matches}")
print(f"  Unique images extracted    : {img_counter}")
print(f"  URI→path mappings          : {len(uri_to_path)}")

# ── Step 4: replace all data URIs in content ──────────────────────────────────
print("\nReplacing data URIs in content …")

replaced_count = 0
for full_uri, rel_path in uri_to_path.items():
    occurrences = content.count(full_uri)
    if occurrences:
        content = content.replace(full_uri, rel_path)
        replaced_count += occurrences
        print(f"  Replaced {occurrences}× → {rel_path}")

print(f"  Total replacements: {replaced_count}")

# Re-split into lines for slicing (lines are shorter now — mostly references)
lines = content.splitlines(keepends=True)
print(f"  Lines after replacement: {len(lines):,}")

def get_lines(start_1based: int, end_1based: int) -> str:
    """Return lines[start..end] (1-based, inclusive) as a joined string."""
    return "".join(lines[start_1based - 1 : end_1based])

# ── Step 5: write style.css ───────────────────────────────────────────────────
print("\nWriting style.css …")
css_content = get_lines(LINE_CSS_START, LINE_CSS_END)
with open(OUT_CSS, "w", encoding="utf-8") as f:
    f.write(css_content)
print(f"  style.css  → {os.path.getsize(OUT_CSS):,} bytes")

# ── Step 6: write script.js ───────────────────────────────────────────────────
print("Writing script.js …")
js_content = get_lines(LINE_JS_START, LINE_JS_END)
with open(OUT_JS, "w", encoding="utf-8") as f:
    f.write(js_content)
print(f"  script.js  → {os.path.getsize(OUT_JS):,} bytes")

# ── Step 7: build new slim HTML ───────────────────────────────────────────────
print("Building new WeProject_Desktop.html …")

head_lines = get_lines(LINE_HEAD_START, LINE_HEAD_END)
body_html  = get_lines(LINE_BODY_START, LINE_BODY_END)
panels_html = get_lines(LINE_PANELS_START, LINE_PANELS_END)

new_html = (
    head_lines
    + '<link rel="stylesheet" href="style.css"/>\n'
    + '</head>\n'
    + body_html
    + '\n<script src="script.js"></script>\n'
    + panels_html
)

with open(OUT_HTML, "w", encoding="utf-8") as f:
    f.write(new_html)
print(f"  WeProject_Desktop.html → {os.path.getsize(OUT_HTML):,} bytes")

# ── Step 8: remove stale split file if it exists ──────────────────────────────
if os.path.exists(SPLIT_OLD):
    os.remove(SPLIT_OLD)
    print(f"\nRemoved stale file: {SPLIT_OLD}")

# ── Summary ───────────────────────────────────────────────────────────────────
print("\n" + "═" * 60)
print("SUMMARY")
print("═" * 60)
print(f"Unique images extracted : {img_counter}")
print(f"Data-URI replacements   : {replaced_count}")
print()

files_to_report = [
    ("WeProject_Desktop.html (new slim)", OUT_HTML),
    ("WeProject_Desktop_original.html (backup)", BAK_FILE),
    ("style.css", OUT_CSS),
    ("script.js", OUT_JS),
]
for label, path in files_to_report:
    if os.path.exists(path):
        sz = os.path.getsize(path)
        print(f"  {label:<45} {sz:>12,} bytes  ({sz/1024/1024:.2f} MB)")

# Image folder total
img_files = os.listdir(IMG_DIR)
img_total  = sum(os.path.getsize(os.path.join(IMG_DIR, f)) for f in img_files)
print(f"  {'images/ folder (' + str(len(img_files)) + ' files)':<45} {img_total:>12,} bytes  ({img_total/1024/1024:.2f} MB)")
print()
print("Done.")
