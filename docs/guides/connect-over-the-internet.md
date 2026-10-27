# Connect a board over the internet

A secure WebSocket relay lets you reach a board from anywhere. This is experimental and may have bugs.

1. Connect [Workbench](https://pydevices.github.io/workbench/) to the board over USB ([how](connect-over-usb.md)).
2. In the left panel, open `Package Manager` and install `viper-tools`.
3. Put this in the board's `main.py`:

   ```py
   import wss_repl

   # Setup your WiFi network
   wss_repl.connect_wifi('WiFi_SSID', 'WiFi_Password')

   # Connect to the WebSocket server
   wss_repl.start()
   ```

   The board builds its ID from its hardware ID, so it stays the same across boots. If the board has no hardware ID, it makes a random one and keeps it in `.viper.json`. To use a fixed ID, call `wss_repl.start(uid='YOUR-DEVICE-UID')`.
4. Reset the board. The terminal shows a line like this:

   ```log
   IDE available on https://viper-ide.org?wss=YOUR-DEVICE-UID
   ```

5. Open `https://pydevices.github.io/workbench/?wss=YOUR-DEVICE-UID` with the ID from that line. The link the board prints opens ViperIDE, because `viper-tools` comes from there.

## Use your own relay

If you run your own [relay server](../../src/websocket_relay.cjs), give its URL to the board:

```py
wss_repl.start(url='wss://your-server-url')
```

Then press the WebREPL button in Workbench. The board's address is `wss://your-server-url/YOUR-DEVICE-UID`.

The default relay, `hub.viper-ide.org`, is run by ViperIDE's author and inherited from upstream. See [the fork](../how-it-works/viperide-fork.md).

