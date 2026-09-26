// SPDX-License-Identifier: MIT
//
// multimer's timers on the PyDevices runtime are woken by the page's own
// loop and dispatched through the wasm bridge (pydevices_timer_dispatch).
// A runtime whose bridge declares external_call_depth_dec() with the wrong
// signature boots, paints and answers the REPL, then throws "function
// signature mismatch" on every timer callback; this is the test that sees it.
import { test, expect } from '@playwright/test'
import { connectSimulator, terminalText, focusTerminal } from './helpers.js'

async function say(page, line) {
    await page.keyboard.type(line)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)
}

// xterm renders only the visible rows, so read a count right after printing it.
async function count(page, tag) {
    await say(page, `print('${tag}', len(ticks))`)
    const m = (await terminalText(page)).match(new RegExp(`${tag} (\\d+)`))
    return m ? Number(m[1]) : NaN
}

test('timers keep firing at the prompt after the arming line returns', async ({ page }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(String(e)))
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

    await connectSimulator(page)
    await focusTerminal(page)
    await say(page, 'import multimer')
    await say(page, 'ticks = []')
    await say(page, "fast = multimer.every(10, lambda t: ticks.append(1), name='fast')")
    await page.waitForTimeout(1000)

    const first = await count(page, 'COUNT_A')
    await page.waitForTimeout(1000)
    const second = await count(page, 'COUNT_B')
    expect(first).toBeGreaterThan(20)
    expect(second).toBeGreaterThan(first + 30)

    await say(page, 'multimer.report()')
    await expect(page.locator('#xterm')).toContainText("name='fast'")
    expect(errors.filter((e) => /signature mismatch|null function/.test(e))).toEqual([])
})
