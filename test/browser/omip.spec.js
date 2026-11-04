// SPDX-License-Identifier: MIT
//
// The Tools menu puts omip.py on the device: the real file, fetched from its
// repository in this browser, written over the raw REPL, as source, and
// importable. A WebSerial board goes through the same install over a different
// transport, which a headless browser can't open.
import { test, expect } from '@playwright/test'
import { connectSimulator, focusTerminal, terminalText } from './helpers.js'

const INDEXES = [/vsh\.pp\.ua/i, /micropython\.org\/pi\//i, /omnipython\.org/i]

async function openTools(page) {
    await page.click('.tab[data-target="menu-tools"]')
    await expect(page.locator('#install-omip')).toBeVisible()
}

test('the Tools menu installs omip.py as source, with no index, and it imports', async ({ page }) => {
    await connectSimulator(page)

    const indexRequests = []
    page.on('request', (request) => {
        if (INDEXES.some((pattern) => pattern.test(request.url()))) {
            indexRequests.push(request.url())
        }
    })

    await openTools(page)
    await page.click('#install-omip')
    await expect(page.locator('#toast-container')).toContainText('Installed omip.py')

    await focusTerminal(page)
    const before = await terminalText(page)
    await page.keyboard.type('import omip, os; print("omip-ok", omip.__file__, omip.INDEX, "omip.mpy" in os.listdir("/lib"))')
    await page.keyboard.press('Enter')
    await expect
        .poll(async () => (await terminalText(page)).slice(before.length))
        .toContain('omip-ok /lib/omip.py https://lib.omnipython.org False')

    expect(indexRequests).toEqual([])
})

test('a failed download says so and writes nothing', async ({ page }) => {
    await connectSimulator(page)
    await page.route('**/raw.githubusercontent.com/**', (route) => route.fulfill({ status: 404, body: 'nope' }))

    await openTools(page)
    await page.click('#install-omip')
    await expect(page.locator('#toast-container')).toContainText('Installing failed')

    await focusTerminal(page)
    const before = await terminalText(page)
    await page.keyboard.type('import os; print("has-omip", "omip.py" in os.listdir("/lib"))')
    await page.keyboard.press('Enter')
    await expect
        .poll(async () => (await terminalText(page)).slice(before.length))
        .toContain('has-omip False')
})

test('with nothing connected it asks for a device', async ({ page }) => {
    await page.goto('/')
    await openTools(page)
    await page.click('#install-omip')
    await expect(page.locator('#toast-container')).toContainText('Connect')
})
