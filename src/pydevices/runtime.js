/*
 * SPDX-FileCopyrightText: 2026 PyDevices
 * SPDX-License-Identifier: MIT
 *
 * The PyDevices MicroPython WASM runtime as a Workbench device.
 *
 * This is the same build the PyDevices simulator runs: displaydev paints onto a
 * canvas, pointer/keyboard events are fed back to Python, and lvgl, pdwidgets,
 * pygraphics and palettes are frozen in. It speaks the stock MicroPython WASM
 * API, so it drops straight into the MicroPythonWASM transport and every panel
 * that works against a real board works against it too.
 */

import { MicroPythonWASM, SYSTEM_DIRS } from '../transports/vm.js'

export { SYSTEM_DIRS }

// Where displaydev paints. index.html owns the elements; Python looks them up
// by these ids through the runtime's canvas bridge.
export const DISPLAY_CANVAS_ID = 'display_canvas'
export const AUX_CANVAS_ID = 'aux_canvas'

export const DEFAULT_WIDTH = 320
export const DEFAULT_HEIGHT = 240

const MIP_INDEX = 'https://PyDevices.github.io/mip'

// The runtime is ~6 MB, so it is fetched on first connect rather than bundled.
// The import has to survive Rollup: an IIFE bundle cannot code-split, and a
// literal specifier would be inlined (or fail to resolve). Going through
// new Function keeps the import opaque to the bundler and runs it as a real
// dynamic import at runtime.
const dynamicImport = new Function('url', 'return import(url)')

let runtimeModule = null

function runtimeURL(file) {
    // Resolved against the document so the app keeps working under a project
    // path such as /workbench/ as well as at a domain root.
    return new URL(`assets/pydevices/${file}`, document.baseURI).href
}

async function loadPyDevicesMicroPython(mpOpts) {
    if (!runtimeModule) {
        runtimeModule = await dynamicImport(runtimeURL('micropython.mjs'))
    }
    return runtimeModule.loadMicroPython(mpOpts)
}

/*
 * Boot script, mirroring what the PyDevices simulator runs before handing over
 * the REPL: tell displaydev how big the panel is, put the runtime's own
 * directories on sys.path, then make sure the desktop support package is there.
 *
 * board_config is the entry point user code imports, so its presence is what
 * decides whether the package still needs installing - checked as a file rather
 * than an import, which would build a display as a side effect. The install
 * needs the network; failing it leaves a usable REPL without the PyDevices
 * libraries, and the next connect tries again.
 */
function bootScript(width, height) {
    return `
import os, sys
from displaydev import env_set
env_set("PYDEVICES_WIDTH", ${Number(width)})
env_set("PYDEVICES_HEIGHT", ${Number(height)})
sys.path[:] = [".", ".frozen", "lib", "utils"]
try:
    os.stat("lib/board_config.mpy")
except OSError:
    try:
        import mip
        mip.install("pydevices-desktop", index=${JSON.stringify(MIP_INDEX)}, target="lib")
    except Exception as exc:
        print("PyDevices libraries unavailable offline:", exc)
os.chdir("/")
`
}

function getDefaultMainPy() {
    return `\
# PyDevices Workbench - virtual device
# Read more: https://github.com/PyDevices/workbench

# This is the PyDevices MicroPython build running in your browser through
# WebAssembly. The display below is a real framebuffer: draw to it exactly as
# you would on a board, then plug in hardware and run the same code there.

from board_config import display_drv
from palettes import get_palette

WIDTH, HEIGHT = display_drv.width, display_drv.height
pal = get_palette()

display_drv.fill(pal.BLACK)

# A few bands of colour, so it is obvious the panel is live
bands = [pal.RED, pal.YELLOW, pal.LIME, pal.CYAN, pal.BLUE, pal.MAGENTA]
band_h = HEIGHT // (len(bands) + 2)
top = (HEIGHT - band_h * len(bands)) // 2
for i, colour in enumerate(bands):
    display_drv.fill_rect(0, top + i * band_h, WIDTH, band_h, colour)

print("Display:", WIDTH, "x", HEIGHT)
print("Edit this file and press Run, or type at the REPL below.")
`
}

/**
 * Build the PyDevices virtual device transport.
 *
 * @param {Object} [opts]
 * @param {number} [opts.width]  - Display width in pixels
 * @param {number} [opts.height] - Display height in pixels
 */
export function createPyDevicesVM(opts = {}) {
    const width = opts.width || DEFAULT_WIDTH
    const height = opts.height || DEFAULT_HEIGHT

    return new MicroPythonWASM(loadPyDevicesMicroPython, {
        wasmURL: runtimeURL('micropython.wasm'),
        infoType: 'PyDevices Simulator',
        // The build is compiled with ASYNCIFY, so the VM can yield to the
        // browser instead of locking the tab up for the length of a sleep.
        asyncify: true,
        // lvgl and framebuffers need considerably more room than the 1 MB default.
        mpOptions: { heapsize: 16 * 1024 * 1024 },
        populateFS(mp) {
            mp.FS.writeFile('/main.py', getDefaultMainPy())
        },
        async onBoot(mp) {
            await mp.runPythonAsync(bootScript(width, height))
        },
    })
}
