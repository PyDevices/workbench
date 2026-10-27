# How Workbench works

Workbench is a MicroPython IDE that runs entirely in a browser tab: no server, no install. It's a static site, served from GitHub Pages, and everything it does happens in your browser.

## Three parts

**The editor.** CodeMirror, with ruff for linting and formatting and a WebAssembly build of `mpy-cross` for compiling `.mpy` files, all in the page. Files open from, and save to, the connected device.

**The connection.** Workbench speaks MicroPython's raw REPL protocol to a board through one of several transports: Web Serial or WebUSB, Web Bluetooth, WebSocket (WebREPL, directly or through a relay), or a WebRTC peer. The transports live in `src/transports/`, the protocol in `src/rawmode.js`. Everything above them (file manager, package manager, terminal) is the same on every transport.

**The simulator.** One of the transports is a MicroPython WebAssembly build running in the page. To the rest of Workbench it looks like a board. This fork's build has the PyDevices libraries frozen in (lvgl, pdwidgets, pygraphics, palettes, `displaydev` and a desktop `board_config`), so nothing installs at boot. Its display is a canvas next to the editor that accepts pointer and keyboard input and plays audio. Six example programs, one per library, are in its file tree when it starts.

## Where code runs

Your files on a real board stay on the board; Workbench keeps a cache of the listing and unsaved edits in the browser so a reload doesn't lose them. The simulator's file system lives in the page. Packages come from `micropython.org` and GitHub directly to your browser, and from GitLab through the `cors.sh` proxy. The only service Workbench itself depends on is the relay used for [connecting over the internet](../guides/connect-over-the-internet.md), and only when you use that.

## Differences from ViperIDE

Workbench is a fork. [The fork](viperide-fork.md) page says what it takes from ViperIDE, what it changes, and how the two stay close.
