
## Bluetooth Low Energy REPL

This can be used on devices with native BLE support:
- Raspberry Pi Pico W
- ESP32

> [!IMPORTANT]
> - This connection method requires a Chrome-based browser like Edge, Opera, Chromium, Brave, etc.
> - It usually works on Windows, Linux, MacOS, Android
> - Not available on iOS

#### 1. Connect [Workbench](https://pydevices.github.io/workbench/) to your device using USB

#### 2. In the left panel: `Package Manager` -> install `viper-tools`

#### 3. In your `main.py`

```py
import ble_repl
ble_repl.start()
```

#### 4. Reset your device

#### 5. Connect Workbench to your device using `BLE`

Use the Bluetooth button in `Workbench` to connect to your device.

It will scan for nearby devices automatically.

---
This guide originates from [ViperIDE](https://github.com/vshymanskyy/ViperIDE)'s documentation; Workbench is a fork.
