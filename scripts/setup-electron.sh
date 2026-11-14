#!/usr/bin/env bash
set -e

ZIP_PATH="/tmp/electron-download-LEUV0N/electron-v30.5.1-linux-x64.zip"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$REPO_ROOT/node_modules/electron/dist"

if [ ! -f "$ZIP_PATH" ]; then
  echo "Zip not found: $ZIP_PATH"
  exit 1
fi

echo "Extracting Electron binary to $TARGET_DIR..."
mkdir -p "$TARGET_DIR"
unzip -q -o "$ZIP_PATH" -d "$TARGET_DIR"
echo -n "electron" > "$REPO_ROOT/node_modules/electron/path.txt"
chmod +x "$TARGET_DIR/electron"

echo "Electron successfully installed:"
"$REPO_ROOT/node_modules/.bin/electron" --version
