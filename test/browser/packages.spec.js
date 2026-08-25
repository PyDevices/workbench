// SPDX-License-Identifier: MIT
//
// Regression coverage: package installs on the simulator used to fail every
// time with "lib folder not found in sys.path" because the boot script put
// a relative "lib" on sys.path instead of the absolute /lib every board has.
import { test, expect } from '@playwright/test'
import { connectSimulator, focusTerminal, terminalText } from './helpers.js'

test('a package installs from the panel and imports', async ({ page }) => {
    await connectSimulator(page)

    const installed = await page.evaluate(() => window.app.installPkg('aioprof'))
    expect(installed).toBe(true)

    await focusTerminal(page)
    const before = await terminalText(page)
    await page.keyboard.type('import aioprof; print("import-ok", aioprof.__file__)')
    await page.keyboard.press('Enter')
    await expect
        .poll(async () => (await terminalText(page)).slice(before.length))
        .toContain('import-ok /lib/aioprof')
})
