"""
Paint on the display by dragging across it.

Everything here works on a real board too: the same board_config, the same
display driver, the same events. Connect hardware over USB, copy this file
across, and it runs unchanged.

Only needs pydevices-desktop, which the simulator installs at boot.
"""

import board_config
import appdev
import events
from board_config import display_drv

app = appdev.App(board_config)

WIDTH, HEIGHT = display_drv.width, display_drv.height

BACKGROUND = 0x18E3   # dark slate, RGB565
SWATCH_H = 28
BRUSH = 6

# Pick from these by tapping the strip along the top
COLOURS = [0xF800, 0xFD20, 0xFFE0, 0x07E0, 0x07FF, 0x001F, 0xF81F, 0xFFFF]

state = {"colour": COLOURS[0], "drawing": False}


def draw_palette():
    swatch_w = WIDTH // len(COLOURS)
    for i, colour in enumerate(COLOURS):
        display_drv.fill_rect(i * swatch_w, 0, swatch_w, SWATCH_H, colour)
    # A notch under the selected colour, so the choice is visible
    selected = COLOURS.index(state["colour"])
    display_drv.fill_rect(selected * swatch_w, SWATCH_H - 4, swatch_w, 4, 0x0000)


def clear_canvas():
    display_drv.fill_rect(0, SWATCH_H, WIDTH, HEIGHT - SWATCH_H, BACKGROUND)


def paint(x, y):
    half = BRUSH // 2
    x = max(0, min(WIDTH - BRUSH, x - half))
    y = max(SWATCH_H, min(HEIGHT - BRUSH, y - half))
    display_drv.fill_rect(x, y, BRUSH, BRUSH, state["colour"])


def on_down(event):
    x, y = event.pos[0], event.pos[1]
    if y < SWATCH_H:
        swatch_w = WIDTH // len(COLOURS)
        index = min(len(COLOURS) - 1, x // swatch_w)
        state["colour"] = COLOURS[index]
        draw_palette()
        return
    state["drawing"] = True
    paint(x, y)


def on_move(event):
    if state["drawing"]:
        paint(event.pos[0], event.pos[1])


def on_up(_event):
    state["drawing"] = False


app.on(events.MOUSEBUTTONDOWN, on_down)
app.on(events.MOUSEMOTION, on_move)
app.on(events.MOUSEBUTTONUP, on_up)

clear_canvas()
draw_palette()

print("Drag on the display to paint. Tap the top strip to change colour.")
print("Run clear_canvas() at the REPL to wipe it.")
