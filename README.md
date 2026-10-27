![Workbench editing main.py with the file manager and terminal](docs/images/screenshot-desktop-chrome.png)

# Workbench

Workbench is a MicroPython IDE that runs in your browser, with a built-in simulator for MicroPython-compatible devices and the PyDevices libraries, and USB, Bluetooth and WebREPL connections to real boards. It's a fork of [ViperIDE](https://github.com/vshymanskyy/ViperIDE) by Volodymyr Shymanskyy (MIT license); [how the fork works](docs/how-it-works/viperide-fork.md).

## Open it

There's nothing to install: open <https://pydevices.github.io/workbench/>. A browser can also install it as an app (the install icon in Chrome or Edge's address bar). To run your own copy, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Try it

Press the simulator button, then type these lines at the `>>>` prompt:

```python
>>> from board_config import display_drv
Initializing WasmDisplay...
WasmDisplay: initialized.
>>> import pygraphics as pg
>>> from palettes import get_palette
>>> pal = get_palette()
>>> w, h = display_drv.width, display_drv.height
>>> w, h
(320, 240)
>>> buf = bytearray(w * h * 2)
>>> fb = pg.FrameBuffer(buf, w, h, pg.RGB565)
>>> pg.fill(fb, pal.NAVY)
Area(0, 0, 320, 240)
>>> pg.circle(fb, w // 2, h // 2, 80, pal.CYAN)
Area(80, 40, 160, 160)
>>> display_drv.blit_rect(buf, 0, 0, w, h)
(0, 0, 320, 240)
>>> hex(fb.pixel(w // 2, h // 2 - 80))
'0x7ff'
```

A cyan circle appears on the navy display, and the last line reads back a pixel on its edge: `0x7ff` is `pal.CYAN`.

[Docs](https://github.com/PyDevices/workbench/blob/main/docs/index.md) · [Examples](https://pydevices.github.io/pydevices-examples/gallery/) · [Roadmap](ROADMAP.md)

Made by [PyDevices](https://pydevices.com).
