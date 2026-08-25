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

- The virtual device is the PyDevices MicroPython WASM build, with a display
  canvas, touch/keyboard input, and audio (lvgl, pdwidgets, pygraphics,
  displaydev built in) — *in progress*.
- PyDevices branding and package index; no analytics (the Amplitude tracking
  from upstream is removed).

## Development

```bash
npm install
python3 build.py --prepare   # fetch MicroPython WASM assets
npm run start                # dev server at http://localhost:10001
```

`python3 build.py` produces the deployable site in `build/`. CI deploys `main`
to GitHub Pages.

## License

[MIT](LICENSE), same as ViperIDE.
