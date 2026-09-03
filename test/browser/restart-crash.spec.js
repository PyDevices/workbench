// SPDX-License-Identifier: MIT
//
// Regression coverage for the wasmbridge leak (the org's MicroPython patch
// 0007, originally commit 71af1b6 in the build workspace, with the
// generation guard in 4533056): restarting the VM while an appdev
// program's paint loop and canvas listeners are live used to reliably crash
// the tab. Any page method call after a real crash rejects, which is the
// natural way Playwright surfaces one - no explicit crash listener needed
// for a test to fail on it.
import { test, expect } from '@playwright/test'
import { connectSimulator, runFile } from './helpers.js'

test('repeated resets while a display program is running do not crash the tab', async ({ page }) => {
    test.setTimeout(90_000)
    await connectSimulator(page)

    for (let cycle = 0; cycle < 4; cycle++) {
        await test.step(`cycle ${cycle + 1}`, async () => {
            await runFile(page, '00_touch_paint.py')
            await page.click('#btn-reset-soft')
            await expect(page.locator('#xterm')).toContainText('MPY: soft reboot', { timeout: 20_000 })
        })
    }

    // The page is still responsive - the strongest available proof nothing
    // silently wedged the renderer.
    await expect(page.locator('#display_canvas')).toBeVisible()
})
