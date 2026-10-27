# Browser and platform support

The simulator works in any modern browser. Connecting a real board has more requirements.

| Connection | Browser | Notes |
|---|---|---|
| Simulator | any modern browser | no hardware needed |
| USB / Serial | Chromium-based: Chrome, Edge, Opera, Brave | usually works on Windows, Linux, macOS, Android; not iOS |
| Bluetooth LE | Chromium-based | usually works on Windows, Linux, macOS, Android; not iOS |
| WebREPL (network, internet), P2P | any | the only options on iOS |

- Some USB devices need a driver installed.
- Some boards aren't detected by Android over USB OTG. Try the `Use WebUSB instead of WebSerial` setting. If that fails, only Bluetooth, WebREPL and P2P are left.
- Older MicroPython versions may or may not work. ViperIDE has been reported to work with MicroPython v1.13 from September 2020.

Guides: [USB](../guides/connect-over-usb.md), [Bluetooth](../guides/connect-over-bluetooth.md), [local network](../guides/connect-over-your-network.md), [internet](../guides/connect-over-the-internet.md).
