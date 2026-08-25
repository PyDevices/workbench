// SPDX-License-Identifier: MIT
import { expect } from '@playwright/test'

/*
 * Connects the PyDevices virtual device and waits for a real prompt - not a
 * fixed delay, since the mip install this triggers (~55 requests for
 * pydevices-desktop) varies with network conditions far more than the WASM
 * boot itself does.
 */
export async function connectSimulator(page) {
    await page.goto('/')
    await page.click('#btn-conn-sim')
    await expect(page.locator('#xterm')).toContainText('>>>', { timeout: 45_000 })
}

export async function terminalText(page) {
    return page.locator('#xterm').innerText()
}

/* The last line each example prints once it has finished setting up - proof
   the run actually reached the end of the file, not just that some output
   arrived. Every example ends with one of these. */
export const READY_TEXT = {
    '00_touch_paint.py': 'Drag on the display to paint',
    '01_lvgl_counter.py': 'LVGL Counter initialized and active',
    '02_lvgl_thermostat.py': 'Drag the outer ring to adjust temperature',
    '03_pdwidgets_dashboard.py': 'pdwidgets Sensor Deck is live',
    '04_pygraphics_shapes.py': 'Rendered pygraphics vector FrameBuffer',
    '05_displaydev_raw.py': 'Rendered 8-bar test pattern',
}

/* Opens a file from the device tree, runs it, and waits for its own
   completion marker to appear - not a generic "stopped changing" check.
   xterm.js's cursor blinks on roughly the same period a short poll interval
   would use, so two consecutive reads of the raw terminal text can differ
   forever even after a run has genuinely finished; polling for content that
   can only be produced by print() sidesteps that entirely, and is also a
   stronger assertion than "some new byte arrived" would have been. Returns
   the output captured after the file was opened, which normal callers treat
   as the whole run - not exact byte-for-byte, since the trailing edge is
   whatever the terminal was doing when the marker landed, but the interesting
   evidence (a traceback, or the marker itself) is always well inside it. */
export async function runFile(page, filename) {
    await page.click(`text=${filename}`)
    const before = await terminalText(page)
    await page.click('#btn-run')

    const marker = READY_TEXT[filename]
    if (marker) {
        await expect(page.locator('#xterm')).toContainText(marker, { timeout: 20_000 })
    } else {
        await expect
            .poll(async () => (await terminalText(page)).length, { timeout: 20_000 })
            .toBeGreaterThan(before.length)
    }
    // The marker is the last line of the file's own top-level code, but a
    // program that registers callbacks keeps running after it; give a beat
    // for anything printed at the very end (a stray line after the last
    // print(), or the "OK...>" raw-mode framing) to land before reading back.
    await page.waitForTimeout(500)
    return (await terminalText(page)).slice(before.length)
}

/* A program that registers a display calls canvas.focus() as part of
   installing its input handlers, which silently steals keystrokes from the
   terminal. Anything that types after running one has to win focus back. */
export async function focusTerminal(page) {
    await page.click('#xterm .xterm-screen')
}

/* Clicks the display canvas at a fraction of its width/height - the canvas
   is never CSS-scaled here, but going through its live bounding box is still
   the only way to hit real page coordinates instead of guessing them from a
   screenshot. To find fractions for a new target: run the program, call
   page.screenshot(), and divide the target's pixel offset from the canvas's
   top-left corner by the canvas's width/height. */
export async function clickCanvas(page, xFrac, yFrac) {
    const box = await page.locator('#display_canvas').boundingBox()
    await page.mouse.click(box.x + box.width * xFrac, box.y + box.height * yFrac)
}

export async function dragCanvas(page, from, to, { steps = 6 } = {}) {
    const box = await page.locator('#display_canvas').boundingBox()
    const p = (f) => ({ x: box.x + box.width * f[0], y: box.y + box.height * f[1] })
    const a = p(from)
    const b = p(to)
    await page.mouse.move(a.x, a.y)
    await page.mouse.down()
    for (let i = 1; i <= steps; i++) {
        await page.mouse.move(a.x + (b.x - a.x) * (i / steps), a.y + (b.y - a.y) * (i / steps))
        await page.waitForTimeout(30)
    }
    await page.mouse.up()
}

/* Number of visually distinct colours sampled off the display canvas - cheap
   evidence that something was actually drawn, without pixel-matching a
   reference image that would break on every font/anti-aliasing change. */
export async function distinctCanvasColors(page) {
    return page.evaluate(() => {
        const c = document.getElementById('display_canvas')
        const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
        const seen = new Set()
        for (let i = 0; i < d.length; i += 4 * 97) {
            seen.add(`${d[i]},${d[i + 1]},${d[i + 2]}`)
        }
        return seen.size
    })
}

export async function canvasSize(page) {
    return page.evaluate(() => {
        const c = document.getElementById('display_canvas')
        return { width: c.width, height: c.height }
    })
}
