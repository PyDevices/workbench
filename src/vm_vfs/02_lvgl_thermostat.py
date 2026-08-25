# LVGL: Smart Thermostat Dial (Round Watch UI)
#
# Switch the simulator's display shape to "round" to see this the way a
# round watch face would show it.
import display_driver
import lvgl as lv
from board_config import display_drv

ver_str = f"v{lv.version_major()}.{lv.version_minor()}" if hasattr(lv, "version_major") else ""
print(f"Initializing Smart Thermostat Dial ({ver_str})...".strip())


def _font(size):
    for s in (size, 28, 20, 16, 14, 12):
        name = f"font_montserrat_{s}"
        if hasattr(lv, name):
            f = getattr(lv, name)
            return f() if callable(f) else f
    return lv.font_default() if hasattr(lv, "font_default") else None


# Clean active screen from previous runs
scr = lv.screen_active()
scr.clean()
scr.set_style_bg_color(lv.color_hex(0x0B0F19), 0)

# Temperature Arc (Interactive drag)
dim = min(display_drv.width, display_drv.height) - 30
arc = lv.arc(scr)
arc.set_size(dim, dim)
arc.set_rotation(135)
arc.set_bg_angles(0, 270)
arc.set_range(16, 32)
arc.set_value(22)
arc.center()

arc.set_style_arc_width(12, lv.PART.MAIN)
arc.set_style_arc_color(lv.color_hex(0x1F2937), lv.PART.MAIN)
arc.set_style_arc_width(12, lv.PART.INDICATOR)
arc.set_style_arc_color(lv.color_hex(0xEC4899), lv.PART.INDICATOR)

# Labels
lbl_temp = lv.label(scr)
lbl_temp.set_text("22 C")
lbl_temp.set_style_text_color(lv.color_hex(0xF9FAFB), 0)
f_temp = _font(28)
if f_temp:
    lbl_temp.set_style_text_font(f_temp, 0)
lbl_temp.align(lv.ALIGN.CENTER, 0, -10)

lbl_status = lv.label(scr)
lbl_status.set_text("COMFORT - HEATING")
lbl_status.set_style_text_color(lv.color_hex(0xF472B6), 0)
lbl_status.align(lv.ALIGN.CENTER, 0, 24)


def arc_event_cb(e):
    val = arc.get_value()
    lbl_temp.set_text(f"{val} C")
    if val >= 25:
        lbl_status.set_text("HIGH - WARMING")
        arc.set_style_arc_color(lv.color_hex(0xEF4444), lv.PART.INDICATOR)
    elif val <= 18:
        lbl_status.set_text("ECO - COOLING")
        arc.set_style_arc_color(lv.color_hex(0x3B82F6), lv.PART.INDICATOR)
    else:
        lbl_status.set_text("COMFORT - BALANCED")
        arc.set_style_arc_color(lv.color_hex(0xEC4899), lv.PART.INDICATOR)
    print(f"Target Temperature: {val} C")


arc.add_event_cb(arc_event_cb, lv.EVENT.VALUE_CHANGED, None)
print("Drag the outer ring to adjust temperature!")
