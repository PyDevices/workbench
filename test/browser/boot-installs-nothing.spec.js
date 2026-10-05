// SPDX-License-Identifier: MIT
//
// The PyDevices stack is frozen into the WASM runtime, so connecting the
// simulator installs nothing: no request to any mip index while it boots.
// Boot used to mip-install pydevices-desktop on every connect; this keeps
// that from coming back unnoticed.
import { test, expect } from '@playwright/test'
import { connectSimulator, focusTerminal, terminalText } from './helpers.js'

const MIP_INDEXES = [/pydevices\.github\.io\/mip/i, /micropython\.org\/pi\//i]

test('connecting the simulator installs nothing and the stack is there', async ({ page }) => {
    const indexRequests = []
    page.on('request', (request) => {
        if (MIP_INDEXES.some((pattern) => pattern.test(request.url()))) {
            indexRequests.push(request.url())
        }
    })

    await connectSimulator(page)

    await focusTerminal(page)
    const before = await terminalText(page)
    await page.keyboard.type('import os, board_peripherals, displaydev; print("stack-ok", os.listdir("/lib"))')
    await page.keyboard.press('Enter')
    await expect
        .poll(async () => (await terminalText(page)).slice(before.length))
        .toContain('stack-ok')

    expect(indexRequests).toEqual([])
})
