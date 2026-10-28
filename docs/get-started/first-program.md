# Run your first program

You can do this without a board. Workbench starts a MicroPython virtual device in your browser, with a display, the PyDevices libraries and example programs already on its file system.

1. Open <https://pydevices.github.io/workbench/> and press the simulator button in the toolbar. The terminal prints a `>>>` prompt when the device is up.
2. Click `04_pygraphics_shapes.py` in the file tree and press Run (or F5). The shapes appear on the display next to the editor, and the terminal prints `Rendered pygraphics vector FrameBuffer successfully to display!`.
3. Type at the `>>>` prompt:

   ```python
   >>> 6 * 7
   42
   ```

Edit the file and press Run again. To put the same program on a real board, connect it ([USB](../guides/connect-over-usb.md), [Bluetooth](../guides/connect-over-bluetooth.md), [your network](../guides/connect-over-your-network.md)) and the file tree switches to the board's files.

The simulator also has a resolution and shape picker, including round watch faces, and you can resize the display by dragging it.

More programs are in the [gallery](https://pydevices.github.io/gallery/gallery/); [open one in Workbench](../guides/open-a-gallery-example.md) by name.
