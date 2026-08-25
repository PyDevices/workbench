// SPDX-License-Identifier: MIT
//
// Every example the VM ships runs clean and paints something. One connect
// and one page for the whole file, each example run as a step within it -
// booting the simulator (the mip install alone is ~55 requests) dominates
// the cost of this suite far more than running six short programs does, and
// nothing here mutates state a later example depends on.
import { test, expect } from '@playwright/test'
import { connectSimulator, runFile, distinctCanvasColors, clickCanvas } from './helpers.js'

test('every example runs clean and paints the display', async ({ page }) => {
    test.setTimeout(120_000)
    await connectSimulator(page)

    for (const [file, minColors] of [
        ['00_touch_paint.py', 1],
        ['01_lvgl_counter.py', 5],
        ['02_lvgl_thermostat.py', 5],
        ['03_pdwidgets_dashboard.py', 5],
        ['04_pygraphics_shapes.py', 5],
        ['05_displaydev_raw.py', 5],
    ]) {
        await test.step(file, async () => {
            const output = await runFile(page, file)
            expect(output, output).not.toContain('Traceback')
            expect(await distinctCanvasColors(page)).toBeGreaterThanOrEqual(minColors)
        })
    }
})

test('the LVGL counter button is clickable through the pointer bridge', async ({ page }) => {
    await connectSimulator(page)
    await runFile(page, '01_lvgl_counter.py')
    // The "+1" button sits in the lower-right quadrant of the card. Measured
    // off a rendered frame - see helpers.js's clickCanvas doc comment for how
    // to re-derive this if the layout ever moves.
    await clickCanvas(page, 0.78, 0.76)
    await expect(page.locator('#xterm')).toContainText('Incremented: 1', { timeout: 15_000 })
})
