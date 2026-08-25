# LVGL: Interactive Counter & Buttons
#
# The same lvgl bindings run on real hardware - only board_config differs.
import display_driver
import lvgl as lv
from board_config import display_drv

ver_str = f"v{lv.version_major()}.{lv.version_minor()}" if hasattr(lv, "version_major") else ""
print(f"Initializing LVGL {ver_str} Counter Demo...".strip())


def _font(size):
    for s in (size, 14, 16, 12, 20):
        name = f"font_montserrat_{s}"
        if hasattr(lv, name):
            f = getattr(lv, name)
            return f() if callable(f) else f
    return lv.font_default() if hasattr(lv, "font_default") else None


def _create_btn(parent):
    btn_cls = getattr(lv, "button", getattr(lv, "btn", None))
    return btn_cls(parent)


# Clean active screen from previous runs
scr = lv.screen_active()
scr.clean()
scr.set_style_bg_color(lv.color_hex(0x0F172A), 0)

# Card Container
card = lv.obj(scr)
card.set_size(min(display_drv.width - 40, 280), min(display_drv.height - 40, 200))
card.center()
card.set_style_bg_color(lv.color_hex(0x1E293B), 0)
card.set_style_border_color(lv.color_hex(0x334155), 0)
card.set_style_border_width(2, 0)
card.set_style_radius(16, 0)
card.set_style_pad_all(16, 0)

# Title Label with dynamic LVGL version
title = lv.label(card)
title.set_text(f"PyDevices - LVGL {ver_str}".strip())
title.set_style_text_color(lv.color_hex(0xF8FAFC), 0)
title.align(lv.ALIGN.TOP_MID, 0, 0)

# Counter Value
count = 0
lbl_count = lv.label(card)
lbl_count.set_text("Count: 0")
lbl_count.set_style_text_color(lv.color_hex(0x38BDF8), 0)
f_large = _font(20)
if f_large:
    lbl_count.set_style_text_font(f_large, 0)
lbl_count.align(lv.ALIGN.CENTER, 0, -10)


def btn_inc_cb(e):
    global count
    count += 1
    lbl_count.set_text(f"Count: {count}")
    print(f"Incremented: {count}")


def btn_dec_cb(e):
    global count
    count -= 1
    lbl_count.set_text(f"Count: {count}")
    print(f"Decremented: {count}")


def btn_reset_cb(e):
    global count
    count = 0
    lbl_count.set_text("Count: 0")
    print("Reset count to 0")


# Plus Button
btn_plus = _create_btn(card)
btn_plus.set_size(65, 38)
btn_plus.align(lv.ALIGN.BOTTOM_RIGHT, 0, 0)
btn_plus.set_style_bg_color(lv.color_hex(0x0284C7), 0)
btn_plus.add_event_cb(btn_inc_cb, lv.EVENT.CLICKED, None)
lbl_plus = lv.label(btn_plus)
lbl_plus.set_text("+1")
lbl_plus.center()

# Minus Button
btn_minus = _create_btn(card)
btn_minus.set_size(65, 38)
btn_minus.align(lv.ALIGN.BOTTOM_LEFT, 0, 0)
btn_minus.set_style_bg_color(lv.color_hex(0x475569), 0)
btn_minus.add_event_cb(btn_dec_cb, lv.EVENT.CLICKED, None)
lbl_minus = lv.label(btn_minus)
lbl_minus.set_text("-1")
lbl_minus.center()

# Reset Button
btn_rst = _create_btn(card)
btn_rst.set_size(80, 38)
btn_rst.align(lv.ALIGN.BOTTOM_MID, 0, 0)
btn_rst.set_style_bg_color(lv.color_hex(0xDC2626), 0)
btn_rst.add_event_cb(btn_reset_cb, lv.EVENT.CLICKED, None)
lbl_rst = lv.label(btn_rst)
lbl_rst.set_text("Reset")
lbl_rst.center()

print("LVGL Counter initialized and active. Click buttons to interact!")
