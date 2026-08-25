# pygraphics: High-Performance Vector & FrameBuffer Graphics
import math

from board_config import display_drv
from palettes import get_palette
import pygraphics as pg

print("Initializing pygraphics vector canvas...")

width = display_drv.width
height = display_drv.height

# Define palette
pal = get_palette()

# Create 16-bit RGB565 frame buffer
buf = bytearray(width * height * 2)
fb = pg.FrameBuffer(buf, width, height, pg.RGB565)

# Fill background
fb.fill(pal.NAVY if hasattr(pal, "NAVY") else 0x0842)

cx, cy = width // 2, height // 2

# Draw concentric geometric circles & ellipses
for r in range(20, min(cx, cy) - 10, 15):
    pg.ellipse(fb, cx, cy, r, int(r * 0.7), pal.CYAN if hasattr(pal, "CYAN") else 0x07FF)

# Radiating vector lines
for i in range(16):
    angle = i * (2 * math.pi / 16)
    x2 = int(cx + (cx - 20) * math.cos(angle))
    y2 = int(cy + (cy - 20) * math.sin(angle))
    pg.line(fb, cx, cy, x2, y2, pal.ORANGE if hasattr(pal, "ORANGE") else 0xFD20)

# Central Orbs
pg.circle(fb, cx, cy, 18, pal.RED if hasattr(pal, "RED") else 0xF800)
pg.circle(fb, cx, cy, 8, pal.WHITE if hasattr(pal, "WHITE") else 0xFFFF)

# Header Badge and Text
pg.fill_rect(fb, 10, 10, 150, 24, pal.DARKGREY if hasattr(pal, "DARKGREY") else 0x39E7)
pg.rect(fb, 10, 10, 150, 24, pal.GREY if hasattr(pal, "GREY") else 0x7BEF)
pg.text8(fb, "PyGraphics", 18, 18, pal.CYAN if hasattr(pal, "CYAN") else 0x07FF)

# Footer Badge
pg.fill_rect(fb, 10, height - 34, 180, 24, pal.DARKGREY if hasattr(pal, "DARKGREY") else 0x39E7)
pg.rect(fb, 10, height - 34, 180, 24, pal.GREY if hasattr(pal, "GREY") else 0x7BEF)
pg.text8(fb, "RGB565 FrameBuffer", 18, height - 26, pal.GREEN if hasattr(pal, "GREEN") else 0x07E0)

# Blit frame to canvas display
display_drv.blit_rect(buf, 0, 0, width, height)
print("Rendered pygraphics vector FrameBuffer successfully to display!")
