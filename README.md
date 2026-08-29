# PyDevices Workbench

**A MicroPython IDE for Web and Mobile — work with a built-in device simulator or a real board, in the same browser tab.**

Live at <https://pydevices.github.io/workbench/>.

- **Simulator**: a MicroPython WebAssembly virtual device runs entirely in your browser — no hardware needed.
- **Real boards**: connect over USB (Web Serial / WebUSB), Bluetooth, or WebREPL. File manager, package installer (`mip`), and REPL terminal all work the same on every device.
- **Editor tooling**: CodeMirror with ruff linting/formatting, `.mpy` cross-compilation, and disassembly — all in-browser.

Part of the [PyDevices](https://pydevices.github.io/) project: displays, widgets, and graphics for MicroPython.

## Built on ViperIDE

Workbench is a fork of [ViperIDE](https://github.com/vshymanskyy/ViperIDE) by
[Volodymyr Shymanskyy](https://github.com/vshymanskyy) (MIT license). If you find
this useful, please star ViperIDE too — the connectivity, file manager, and
editor tooling come from there. Fork policy: PyDevices-specific code lives in
new files, diffs to upstream files stay minimal, and generic improvements are
sent upstream.

What this fork changes:

- The virtual device is the PyDevices MicroPython WASM build (lvgl,
  pdwidgets, pygraphics and palettes built in; `displaydev`, `board_config`
  and the rest of `pydevices-desktop` install from mip at boot), reached from
  its own toolbar button alongside USB/Bluetooth/WebREPL. It gets a real
  display stage — resolution and shape presets including round watch faces,
  live resize, audio, pointer and keyboard input — and boots with example
  programs for each of those libraries already in its file tree.
- PyDevices branding; no analytics (the Amplitude tracking from upstream is
  removed).

## Development

```bash
npm install
python3 build.py --skip-tests   # full build (lint/test skipped) into build/
npm run start                   # watch server at http://localhost:10001
```

`python3 build.py --skip-tests` produces the deployable site in `build/`,
including the MicroPython WASM assets (`micropython.wasm`, the
`mpy-cross-*.wasm` binaries, `ruff_wasm_bg.wasm`) that the dev server needs to
serve the simulator, `.mpy` compile and lint. `--prepare` on its own stops
before that step — it only vendors dependencies (`npm install`,
`python-minifier`, the virtual filesystem tarballs) so tools like `npm test`
have what they need without a full build. `npm run start` reuses whatever is
already in `build/`, so run the full build first (or after pulling changes
that touch assets). Plain `python3 build.py` (no flags) also runs lint and
tests before building. CI deploys `main` to GitHub Pages.

### Testing

```bash
npm test              # protocol-level suite (test/) - no browser, no hardware
npm run test:browser  # browser-level suite (test/browser/) - drives the built app
```

`npm test` exercises `src/rawmode.js`, `src/transports/` and
`src/package_mgr.js` directly against the stock MicroPython WASM VM; point it
at real hardware with `VIPER_TEST_TARGET` (see `test/README.md`). It never
touches the PyDevices runtime. `npm run test:browser` does: it builds on the
same `build/` output CI deploys and drives it with Playwright — connecting
the simulator, running every example, resizing, resetting, installing a
package — so it is what catches PyDevices-runtime regressions the protocol
suite can't see. Run `python3 build.py --skip-tests` first if `build/` is
stale.

## Releases

- Plain `vX.Y.Z` tags (e.g. `v1.2.0`) release the app itself: a GitHub Release
  is created with the built `build/` bundle attached as a zip.
- `mcp-v*` tags release only the MCP tool's npm artifact, from `mcp/`.
- The inherited `v0.5.x`–`v0.6.x` tags predate the fork and are upstream
  ViperIDE release history, not Workbench releases.

## Support

- Issues: <https://github.com/PyDevices/workbench/issues> (just enabled).
- Browsers: board connectivity (Web Serial / WebUSB / Bluetooth) requires a
  Chromium-based browser (Chrome, Edge, Opera, Brave, etc.) — not available on
  Safari or iOS. The simulator has no such requirement and works in any
  modern browser.

## License

[MIT](LICENSE), same as ViperIDE.
