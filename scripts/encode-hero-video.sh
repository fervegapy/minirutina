#!/usr/bin/env bash
# Encode a source video into the two formats the Hero <video> element
# expects: a high-quality WebM (VP9) preferred by Chrome/FF/Edge and an
# MP4 (H.264) fallback for Safari.
#
# Usage:
#   ./scripts/encode-hero-video.sh <source-video> [quality]
#
# quality (optional):
#   high   — CRF 28 WebM / CRF 22 MP4 — sharp, ~3-5 MB target (default)
#   medium — CRF 32 WebM / CRF 26 MP4 — balanced, ~1-2 MB target
#   low    — CRF 38 WebM / CRF 30 MP4 — heavy compression, <1 MB target
#
# Outputs (overwritten):
#   public/hero-v2.webm
#   public/hero-v2.mp4
#
# Bump the VERSION variable below (and the <source src=...> URLs in
# Hero.tsx) when you re-encode — that's the cache-busting trick so
# users don't keep seeing the old video.

set -euo pipefail

SRC="${1:-}"
QUALITY="${2:-high}"

if [[ -z "$SRC" || ! -f "$SRC" ]]; then
  echo "Uso: $0 <source-video> [high|medium|low]"
  exit 1
fi

case "$QUALITY" in
  high)   WEBM_CRF=28; MP4_CRF=22 ;;
  medium) WEBM_CRF=32; MP4_CRF=26 ;;
  low)    WEBM_CRF=38; MP4_CRF=30 ;;
  *) echo "quality debe ser high|medium|low"; exit 1 ;;
esac

OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/public"
VERSION="v2"               # bump and update Hero.tsx <source> URLs to bust cache
WEBM="$OUT_DIR/hero-$VERSION.webm"
MP4="$OUT_DIR/hero-$VERSION.mp4"

echo "→ Codificando WebM (VP9, CRF $WEBM_CRF)..."
ffmpeg -y -i "$SRC" \
  -c:v libvpx-vp9 -crf "$WEBM_CRF" -b:v 0 \
  -row-mt 1 -threads 8 -deadline good \
  -vf "scale=1280:-2" -an \
  "$WEBM"

echo "→ Codificando MP4 (H.264, CRF $MP4_CRF)..."
ffmpeg -y -i "$SRC" \
  -vcodec libx264 -crf "$MP4_CRF" -preset slow \
  -vf "scale=1280:-2" -an \
  -movflags +faststart \
  "$MP4"

echo
echo "Listo:"
ls -lh "$WEBM" "$MP4"
