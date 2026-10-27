// SPDX-License-Identifier: MIT
//
// The simulator's File Manager used to list the runtime's own folders (dev,
// home, proc, tmp) and a machine.py in lib/ next to the examples. A fresh
// simulator shows the examples, main.py and an empty lib/ for installed
// packages, nothing else.
import { test, expect } from '@playwright/test'
import { connectSimulator } from './helpers.js'

test('a fresh simulator lists only the examples, main.py and an empty lib/', async ({ page }) => {
    await connectSimulator(page)
    const rows = page.locator('#menu-file-tree .tree-row[data-path]')
    await expect(rows.filter({ hasText: 'main.py' })).toHaveCount(1)
    const paths = await rows.evaluateAll((els) => els.map((e) => e.getAttribute('data-path')))
    expect(paths.sort()).toEqual([
        '/',
        '/00_touch_paint.py',
        '/01_lvgl_counter.py',
        '/02_lvgl_thermostat.py',
        '/03_pdwidgets_dashboard.py',
        '/04_pygraphics_shapes.py',
        '/05_displaydev_raw.py',
        '/lib',
        '/main.py',
    ])
})

test('the interpreter still has what it needs after the tree is trimmed', async ({ page }) => {
    await connectSimulator(page)
    await page.locator('#xterm').click()
    await page.keyboard.type("import os, machine; print('TMP', os.stat('/tmp') is not None, hasattr(machine, 'reset'))\n")
    await expect(page.locator('#xterm')).toContainText('TMP True True')
})
