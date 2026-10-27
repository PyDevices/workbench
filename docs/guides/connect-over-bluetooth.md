# Connect a board over Bluetooth

A board with native Bluetooth LE, such as a Raspberry Pi Pico W or an ESP32, can run a REPL that Workbench reaches over the air. You need a Chromium-based browser (Chrome, Edge, Opera, Brave). It usually works on Windows, Linux, macOS and Android, and isn't available on iOS.

1. Connect [Workbench](https://pydevices.github.io/workbench/) to the board over USB ([how](connect-over-usb.md)).
2. In the left panel, open `Package Manager` and install `viper-tools`.
3. Put this in the board's `main.py`:

   ```py
   import ble_repl
   ble_repl.start()
   ```

4. Reset the board.
5. Press the Bluetooth button in Workbench. It scans for nearby devices on its own.

