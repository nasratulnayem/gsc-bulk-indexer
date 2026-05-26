#!/usr/bin/env bash
# Build a clean Chrome Web Store upload package.
# Output:
#   dist/                          ready to load-unpacked
#   chrome-web-store-upload.zip    ready to upload to the store

set -euo pipefail
cd "$(dirname "$0")"

ROOT="$(pwd)"
DIST="$ROOT/dist"
ZIP="$ROOT/chrome-web-store-upload.zip"

rm -rf "$DIST" "$ZIP"
mkdir -p "$DIST"

# Copy only files the extension needs at runtime.
cp manifest.json "$DIST/"
cp -R popup "$DIST/"
cp -R content "$DIST/"

# Ship only the runtime PNGs (no python script, no oversized logos).
mkdir -p "$DIST/icons"
cp icons/icon-16.png  "$DIST/icons/"
cp icons/icon-32.png  "$DIST/icons/"
cp icons/icon-48.png  "$DIST/icons/"
cp icons/icon-128.png "$DIST/icons/"

# Zip dist contents at the root of the archive (no parent folder inside).
( cd "$DIST" && zip -qr "$ZIP" . )

echo "✓ dist/         $(du -sh "$DIST" | cut -f1)"
echo "✓ $(basename "$ZIP")  $(du -sh "$ZIP" | cut -f1)"
