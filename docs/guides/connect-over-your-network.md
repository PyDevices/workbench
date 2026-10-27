# Connect a board over your local network

The board runs a web server and Workbench connects to it over WebREPL. Your computer and the board need to be on the same network.

The WebSocket this uses isn't encrypted, and a secure site like Workbench can't open one. To get around that, the board serves a small page over plain HTTP, and that page loads the IDE from `viper-ide.org`, which is ViperIDE's site, not Workbench's. To reach a board over the internet instead, use [a relay](connect-over-the-internet.md).

1. Connect [Workbench](https://pydevices.github.io/workbench/) to the board over USB ([how](connect-over-usb.md)).
2. In the left panel, open `Package Manager` and install `viper-tools`.
3. Put this in the board's `main.py`:

   ```py
   import web_repl

   # Setup your WiFi network
   web_repl.connect_wifi('WiFi_SSID', 'WiFi_Password')

   # Password will be required to access the REPL (4-8 symbols)
   web_repl.start(password='1234')
   ```

4. Reset the board. The terminal shows a line like this:

   ```log
   WebREPL server started on http://192.168.1.123:8266/
   ```

5. Open that address. You can also press the WebREPL button in Workbench and connect from there.

If the original MicroPython WebREPL page opens instead, the board has the stock `webrepl` package and not the one in `viper-tools`.

