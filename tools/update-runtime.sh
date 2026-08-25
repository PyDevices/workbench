#!/usr/bin/env bash
# Refresh the vendored PyDevices MicroPython WASM runtime.
#
# The runtime is the PyDevices build of MicroPython: displaydev canvas output,
# pointer/keyboard input, audio, and lvgl/pdwidgets/pygraphics/palettes frozen
# in. It is vendored here (rather than fetched during the build) so builds are
# reproducible and work offline.
#
# Source of truth: https://pydevices.github.io/vendor/micropython/
# Usage: tools/update-runtime.sh [path-to-local-vendor-dir]

set -euo pipefail

dest="$(cd "$(dirname "$0")/.." && pwd)/assets/pydevices"
mkdir -p "$dest"

if [ $# -ge 1 ]; then
    src="$1"
    echo "Copying runtime from $src"
    for f in micropython.mjs micropython.wasm; do
        cp "$src/$f" "$dest/$f"
        chmod 644 "$dest/$f"
    done
else
    base="https://pydevices.github.io/vendor/micropython"
    echo "Downloading runtime from $base"
    for f in micropython.mjs micropython.wasm; do
        curl -fsSL "$base/$f" -o "$dest/$f.tmp"
        mv "$dest/$f.tmp" "$dest/$f"
    done
fi

ls -l "$dest"
echo "Runtime updated. Re-run the build and smoke-test the virtual device."
