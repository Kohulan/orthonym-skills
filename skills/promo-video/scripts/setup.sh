#!/usr/bin/env bash
# One-time (and idempotent) tool check for promo-video. Prints three lines the
# other scripts read back:  NODE_MODULES=...  CHROME=...  FFMPEG=...
# Run it at the start of every video job; it installs only what is missing.
# On failure it names each missing tool on stderr ("MISSING: ...") and exits 1.
set -euo pipefail
SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS="$SKILL_DIR/.tools"
mkdir -p "$TOOLS"

# playwright-core: drives Chrome for capture and frame rendering. Kept inside the
# skill so no project's package.json is touched. stderr stays visible so a failed
# install says why.
if [ ! -d "$TOOLS/node_modules/playwright-core" ]; then
  command -v npm >/dev/null || { echo "MISSING: npm (install Node.js, current LTS: https://nodejs.org)" >&2; exit 1; }
  echo '{"name":"promo-video-tools","private":true}' > "$TOOLS/package.json"
  (cd "$TOOLS" && npm i -s playwright-core@1.58 >/dev/null) ||
    { echo "MISSING: playwright-core (npm install failed in $TOOLS; offline?)" >&2; exit 1; }
fi

# Chrome for Testing: reuse any Playwright download; fetch one only if none exists.
find_chrome() {
  for d in $(ls -d "$HOME"/Library/Caches/ms-playwright/chromium-* "$HOME"/.cache/ms-playwright/chromium-* 2>/dev/null | sort -t- -k2 -n -r); do
    for exe in "$d/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" \
               "$d/chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" \
               "$d/chrome-linux64/chrome" "$d/chrome-linux/chrome"; do
      [ -x "$exe" ] && { echo "$exe"; return 0; }
    done
  done
  return 1
}
CHROME="$(find_chrome || true)"
if [ -z "$CHROME" ]; then
  (cd "$TOOLS" && npx -y playwright-core@1.58 install chromium >/dev/null) || true
  CHROME="$(find_chrome || true)"
fi

# ffmpeg: the system one if present, else the static build that imageio-ffmpeg
# ships (fetched by uvx, nothing installed system-wide).
FFMPEG="$(command -v ffmpeg || true)"
if [ -z "$FFMPEG" ] && command -v uvx >/dev/null; then
  FFMPEG="$(uvx --quiet --from imageio-ffmpeg python -c 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())' 2>/dev/null || true)"
fi

echo "NODE_MODULES=$TOOLS/node_modules"
echo "CHROME=$CHROME"
echo "FFMPEG=$FFMPEG"
missing=0
[ -n "$CHROME" ] || { echo "MISSING: Chrome for Testing (npx -y playwright-core@1.58 install chromium)" >&2; missing=1; }
[ -n "$FFMPEG" ] || { echo "MISSING: ffmpeg (brew install ffmpeg, or sudo apt install ffmpeg; or install uv to fetch one)" >&2; missing=1; }
exit "$missing"
