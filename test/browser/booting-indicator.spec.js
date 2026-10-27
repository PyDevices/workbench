// SPDX-License-Identifier: MIT
//
// Launching the simulator used to show nothing until the board appeared, so
// the click looked ignored. The page now shows a "Starting" status from the
// click until the prompt is up, and clears it when the boot fails too.
import { test, expect } from '@playwright/test'

test('a booting indicator shows from the click until the prompt is up', async ({ page }) => {
    await page.goto('/')
    const status = page.locator('#boot-status')
    await expect(status).toBeHidden()
    await page.click('#btn-conn-sim')
    await expect(status).toBeVisible({ timeout: 2000 })
    await expect(status).toContainText('Starting')
    await expect(page.locator('#btn-conn-sim')).toHaveClass(/booting/)
    await expect(page.locator('#xterm')).toContainText('>>>', { timeout: 45_000 })
    await expect(status).toBeHidden()
    await expect(page.locator('#btn-conn-sim')).not.toHaveClass(/booting/)
})

test('the booting indicator shows, then clears, when the simulator fails to start', async ({ page }) => {
    await page.route('**/micropython.wasm', (route) => route.abort())
    await page.goto('/')
    // A failed boot can be over in well under a poll, so watch for the sign
    // from inside the page instead of racing it.
    await page.evaluate(() => {
        const el = document.getElementById('boot-status')
        window.__sawBooting = false
        new MutationObserver(() => { if (!el.hidden) window.__sawBooting = true })
            .observe(el, { attributes: true, attributeFilter: ['hidden'] })
    })
    await page.click('#btn-conn-sim')
    await expect.poll(() => page.evaluate(() => window.__sawBooting), { timeout: 30_000 }).toBe(true)
    await expect(page.locator('#boot-status')).toBeHidden({ timeout: 30_000 })
    await expect(page.locator('#btn-conn-sim')).not.toHaveClass(/booting/)
    await expect(page.locator('#xterm')).not.toContainText('>>>')
})
