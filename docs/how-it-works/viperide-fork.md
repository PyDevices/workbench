# Built on ViperIDE

Workbench is a fork of [ViperIDE](https://github.com/vshymanskyy/ViperIDE) by [Volodymyr Shymanskyy](https://github.com/vshymanskyy), released under the MIT license. The connectivity, file manager, package manager and editor tooling come from there. If you find Workbench useful, star ViperIDE too.

## What this fork changes

- The virtual device is the PyDevices MicroPython WebAssembly build with the whole PyDevices stack frozen in, reached from its own toolbar button beside USB, Bluetooth and WebREPL. It has a display stage with resolution and shape presets (round watch faces included), live resize, audio, and pointer and keyboard input.
- It boots with example programs for each of those libraries.
- Gallery examples open by name with `?example=`. See [Open a gallery example](../guides/open-a-gallery-example.md).
- PyDevices branding, and no analytics. The Amplitude tracking in upstream is removed; the calls remain as empty stubs so merges from ViperIDE stay small.

## The fork policy

PyDevices-specific code lives in new files, diffs to upstream files stay minimal, and generic improvements are sent upstream.

## What is still upstream's

- The relay at `hub.viper-ide.org`, used by [connecting over the internet](../guides/connect-over-the-internet.md), is run by upstream.
- The `viper-tools` package the connection guides install is fetched from upstream's repository.
- The install-button image in [Share a package](../guides/share-a-package-with-an-install-link.md) is served from upstream.
- The environment variable that sets the site's address, `VIPER_IDE_BASE_URL`, keeps upstream's name.
- The screenshots in these docs show ViperIDE.
- The guides for the connection methods began as ViperIDE's documentation.
- Version tags `v0.5.x` and `v0.6.x` in the repository are upstream's history, not Workbench releases.
