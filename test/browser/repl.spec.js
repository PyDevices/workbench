// SPDX-License-Identifier: MIT
//
// Regression coverage for the empty-single-input lexer bug (the org's
// MicroPython patch 0008, originally commit 7e2367c in the build workspace):
// a bare Enter used to print a traceback nobody caused, on the very first
// line of the very first session.
import { test, expect } from '@playwright/test'
import { connectSimulator, terminalText, focusTerminal } from './helpers.js'

test.describe('REPL', () => {
    test('a bare Enter at a fresh prompt is silent', async ({ page }) => {
        await connectSimulator(page)
        const before = await terminalText(page)
        await focusTerminal(page)
        await page.keyboard.press('Enter')
        await page.waitForTimeout(1500)
        const delta = (await terminalText(page)).slice(before.length)
        expect(delta).not.toContain('SyntaxError')
        expect(delta).not.toContain('Traceback')
    })

    test('evaluates an expression', async ({ page }) => {
        await connectSimulator(page)
        const before = await terminalText(page)
        await focusTerminal(page)
        await page.keyboard.type('6 * 7')
        await page.keyboard.press('Enter')
        await expect
            .poll(async () => (await terminalText(page)).slice(before.length))
            .toContain('42')
    })

    test('a soft reset leaves a clean prompt', async ({ page }) => {
        await connectSimulator(page)
        const before = await terminalText(page)
        await page.click('#btn-reset-soft')
        await expect(page.locator('#xterm')).toContainText('MPY: soft reboot', { timeout: 15_000 })
        const delta = (await terminalText(page)).slice(before.length)
        expect(delta).not.toContain('SyntaxError')
    })
})
