# displaydev: Low-Level Direct Display Driver
from board_config import display_drv
from palettes import get_palette

print("Initializing bare display driver...")

pal = get_palette()

# Fill solid dark background
display_drv.fill(pal.BLACK if hasattr(pal, "BLACK") else 0x0000)

# Draw color bars
colors = [
    pal.RED if hasattr(pal, "RED") else 0xF800,
    pal.GREEN if hasattr(pal, "GREEN") else 0x07E0,
    pal.BLUE if hasattr(pal, "BLUE") else 0x001F,
    pal.YELLOW if hasattr(pal, "YELLOW") else 0xFFE0,
    pal.CYAN if hasattr(pal, "CYAN") else 0x07FF,
    pal.MAGENTA if hasattr(pal, "MAGENTA") else 0xF81F,
    pal.WHITE if hasattr(pal, "WHITE") else 0xFFFF,
    pal.ORANGE if hasattr(pal, "ORANGE") else 0xFD20,
]
bar_w = display_drv.width // len(colors)

for i, color in enumerate(colors):
    display_drv.fill_rect(i * bar_w, 20, bar_w, display_drv.height - 40, color)

print("Rendered 8-bar test pattern directly to display hardware!")
