// SPDX-License-Identifier: MIT
//
// Regression coverage: audio used to never actually turn on. The bridge
// only exists once a program registers a display, so enabling it once at
// connect always failed silently (src/pydevices/runtime.js's armSimulatorAudio
// watches for each new bridge instead).
import { test, expect } from '@playwright/test'
import { connectSimulator, runFile } from './helpers.js'

test('audio enables itself once a program registers a display', async ({ page }) => {
    await connectSimulator(page)
    await runFile(page, '00_touch_paint.py')

    await expect
        .poll(() => page.evaluate(() => globalThis.Module?.pydevicesBridge?.permissions()?.audio ?? false), {
            timeout: 10_000,
        })
        .toBe(true)
})

test('audio re-enables on the new bridge after a reset', async ({ page }) => {
    await connectSimulator(page)
    await runFile(page, '00_touch_paint.py')
    await page.click('#btn-reset-soft')
    await expect(page.locator('#xterm')).toContainText('MPY: soft reboot', { timeout: 20_000 })
    await runFile(page, '00_touch_paint.py')

    await expect
        .poll(() => page.evaluate(() => globalThis.Module?.pydevicesBridge?.permissions()?.audio ?? false), {
            timeout: 10_000,
        })
        .toBe(true)
})
