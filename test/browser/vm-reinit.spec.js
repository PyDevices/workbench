// SPDX-License-Identifier: MIT
//
// Regression coverage for the stale-callback bug (cmods patch 0007 / commit
// 4533056): asyncio's scheduler leaves a setTimeout callback running past a
// VM restart, and used to fire into the new interpreter with a recycled
// jsffi proxy index - surfacing as an uncaught "TypeError: 'module' object
// isn't callable" sometime after any reset that followed a running program.
import { test, expect } from '@playwright/test'
import { connectSimulator, runFile } from './helpers.js'

test('a VM restart after a running program raises no uncaught JS error', async ({ page }) => {
    const pageErrors = []
    page.on('pageerror', (err) => pageErrors.push(err.message))

    await connectSimulator(page)
    await runFile(page, '00_touch_paint.py')
    await page.click('#btn-reset-soft')
    await expect(page.locator('#xterm')).toContainText('MPY: soft reboot', { timeout: 20_000 })
    await runFile(page, '00_touch_paint.py')

    expect(pageErrors).toEqual([])
})
