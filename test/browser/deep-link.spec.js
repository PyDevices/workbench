// SPDX-License-Identifier: MIT
//
// Regression coverage: a ?vm=1 link enters through the WebREPL connection
// path, so everything keyed on connType === 'sim' - the display stage, the
// audio watch, the toolbar highlight - used to be skipped entirely.
import { test, expect } from '@playwright/test'

test('?vm=1 is treated as the simulator, not a WebREPL connection', async ({ page }) => {
    await page.goto('/?vm=1')
    await expect(page.locator('#xterm')).toContainText('>>>', { timeout: 45_000 })

    await expect(page.locator('#device-stage')).toHaveClass(/visible/)
    await expect(page.locator('#btn-conn-sim')).toHaveClass(/connected/)
    await expect(page.locator('#btn-conn-ws')).not.toHaveClass(/connected/)
})
