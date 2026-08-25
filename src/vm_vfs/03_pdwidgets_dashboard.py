# pdwidgets: Interactive Sensor Deck Dashboard
import appdev
import board_config
import pdwidgets as pd

print("Initializing pdwidgets Sensor Deck...")

app = appdev.App(board_config)
display = pd.Display(board_config.display_drv, app)

# Screen background
screen = pd.Screen(display, bg=0x0842)

# Header Title
lbl_title = pd.Label(
    screen,
    value="PDWIDGETS INSTRUMENT",
    x=16,
    y=12,
    align=pd.ALIGN.TOP_LEFT,
    text_height=pd.TEXT_SIZE.SMALL,
    fg=0x8C71,
    bg=screen.bg,
)

# Gauge Widget
gauge = pd.Gauge(
    screen,
    x=16,
    y=30,
    w=78,
    h=78,
    align=pd.ALIGN.TOP_LEFT,
    value=0.68,
    fg=0x156A,
    track_color=0x18E3,
    label="68%",
)

# Switch Widget
switch_label = pd.Label(
    screen,
    value="ONLINE",
    x=124,
    y=36,
    align=pd.ALIGN.TOP_LEFT,
    text_height=pd.TEXT_SIZE.SMALL,
    fg=0xFFFF,
    bg=screen.bg,
)
switch = pd.Switch(
    screen,
    x=124,
    y=54,
    w=68,
    h=28,
    align=pd.ALIGN.TOP_LEFT,
    value=True,
    on_color=0x04C6,
    off_color=0x31A6,
    knob_color=0xFFFF,
)


def on_switch_change(s):
    switch_label.value = "ONLINE" if s.value else "MUTED"
    switch_label.fg = 0xFFFF if s.value else 0x8C71
    print(f"Switch toggled: {'ONLINE' if s.value else 'MUTED'}")


switch.set_change_cb(on_switch_change)

# Telemetry Readouts
lbl_telemetry = pd.Label(
    screen,
    value="BUS TELEMETRY: 48 kHz",
    x=16,
    y=116,
    align=pd.ALIGN.TOP_LEFT,
    text_height=pd.TEXT_SIZE.SMALL,
    fg=0x35FA,
    bg=screen.bg,
)

prog = pd.ProgressBar(
    screen,
    x=16,
    y=134,
    w=display.width - 32,
    h=12,
    align=pd.ALIGN.TOP_LEFT,
    value=0.55,
    fg=0x35FA,
    bg=0x1082,
)

# Interactive Slider
lbl_slider = pd.Label(
    screen,
    value="GAIN DAMPING: 72%",
    x=16,
    y=158,
    align=pd.ALIGN.TOP_LEFT,
    text_height=pd.TEXT_SIZE.SMALL,
    fg=0xFD20,
    bg=screen.bg,
)

slider = pd.Slider(
    screen,
    x=16,
    y=176,
    w=display.width - 32,
    h=20,
    align=pd.ALIGN.TOP_LEFT,
    value=0.72,
    fg=0xF440,
    bg=0x2124,
    knob_color=0xFFFF,
)


def on_slider_change(s):
    pct = int(s.value * 100)
    lbl_slider.value = f"GAIN DAMPING: {pct}%"
    gauge.value = s.value
    gauge.label = f"{pct}%"
    print(f"Gain adjusted to: {pct}%")


slider.set_change_cb(on_slider_change)

print("pdwidgets Sensor Deck is live! Move the slider or click buttons.")
