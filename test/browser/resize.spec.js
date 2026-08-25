// SPDX-License-Identifier: MIT
import { test, expect } from '@playwright/test'
import { connectSimulator, runFile, canvasSize, terminalText } from './helpers.js'

test('changing resolution resets the VM and takes effect', async ({ page }) => {
    await connectSimulator(page)
    expect(await canvasSize(page)).toEqual({ width: 320, height: 240 })

    await runFile(page, '00_touch_paint.py')

    const before = await terminalText(page)
    await page.selectOption('#sim-resolution', '240x240-round')
    await expect(page.locator('#xterm')).toContainText('MPY: soft reboot', { timeout: 20_000 })
    const delta = (await terminalText(page)).slice(before.length)
    expect(delta).not.toContain('Traceback')

    expect(await canvasSize(page)).toEqual({ width: 240, height: 240 })
    expect(await page.locator('#display_canvas').getAttribute('class')).toContain('round')

    // The board still boots and runs at the new size - not just that the
    // canvas element resized.
    const output = await runFile(page, '00_touch_paint.py')
    expect(output).not.toContain('Traceback')
})

test('a custom size applies and can be cancelled', async ({ page }) => {
    await connectSimulator(page)

    await page.selectOption('#sim-resolution', 'custom')
    await expect(page.locator('#custom-size-dialog')).toBeVisible()
    await page.click('#custom-size-cancel')
    await expect(page.locator('#custom-size-dialog')).toBeHidden()
    expect(await canvasSize(page)).toEqual({ width: 320, height: 240 })

    await page.selectOption('#sim-resolution', 'custom')
    await page.fill('#custom-size-w', '160')
    await page.fill('#custom-size-h', '128')
    await page.click('#custom-size-form button.primary')
    await expect(page.locator('#xterm')).toContainText('MPY: soft reboot', { timeout: 20_000 })
    expect(await canvasSize(page)).toEqual({ width: 160, height: 128 })
})
