// SPDX-License-Identifier: MIT
//
// ?example=<name> opens a card of the PyDevices gallery here: its files are
// written to the device, the entry file lands in the editor, and Run runs it.
// The gallery itself is stood in for by the fixtures next door (real example
// and helper files, frozen when they were copied), so the suite needs no
// network and the files cannot drift under it; it is the live site these
// assertions describe, though, down to the URLs.
import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { terminalText, focusTerminal, distinctCanvasColors } from './helpers.js'

const GALLERY = 'https://pydevices.github.io/pydevices-examples/gallery/'
const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'gallery')

/* The app's service worker fetches on the page's behalf, and a request it
   makes never reaches page.route; blocked so the stand-in sees every one. */
test.use({ serviceWorkers: 'block' })

/* Serves the fixture tree at the gallery's address and records what was asked
   for, so a test can say which files an example did - and did not - fetch. */
async function serveGallery(page) {
    const fetched = []
    await page.route(`${GALLERY}**`, async (route) => {
        const rel = decodeURIComponent(route.request().url().slice(GALLERY.length).split('?')[0])
        fetched.push(rel)
        const file = path.resolve(FIXTURES, rel)
        if (!file.startsWith(FIXTURES + path.sep) || !fs.existsSync(file)) {
            return route.fulfill({ status: 404, body: `no ${rel} in the fixture gallery` })
        }
        return route.fulfill({ path: file, contentType: rel.endsWith('.json') ? 'application/json' : 'text/plain' })
    })
    return fetched
}

async function waitForPrompt(page) {
    await expect(page.locator('#xterm')).toContainText('>>>', { timeout: 45_000 })
}

const activeTab = (page) => page.locator('#editor-tabs .tab.active .tab-title')

/* Asks the device something at its own prompt and returns the one line it
   printed - what it really holds, not what the file tree believes. The answer
   must be short: the terminal wraps long lines, and a wrapped line reads back
   as several. Keystrokes typed while the terminal is still settling after the
   last answer have been seen to vanish, so a line whose echo does not show
   up is typed again. */
async function askDevice(page, expression) {
    const tag = `ask-${Math.random().toString(36).slice(2, 8)}`
    const line = `import os; print("${tag}", ${expression})`
    const before = await terminalText(page)
    for (let attempt = 0; attempt < 3; attempt++) {
        await focusTerminal(page)
        await page.keyboard.type(line)
        await page.keyboard.press('Enter')
        try {
            await expect.poll(async () => (await terminalText(page)).slice(before.length).includes(`\n${tag} `),
                              { timeout: 5_000 }).toBe(true)
            break
        } catch (_err) {
            /* no echo, no answer: try again */
        }
    }
    const out = (await terminalText(page)).slice(before.length)
    const at = out.indexOf(`\n${tag} `)
    expect(at, `no answer to: ${line}\n${out}`).toBeGreaterThanOrEqual(0)
    return out.slice(at + tag.length + 2).split('\n')[0].trim()
}

/* Only for a folder short enough to list on one line */
const listDir = (page, dir) => askDevice(page, `sorted(os.listdir(${JSON.stringify(dir)}))`)

/* Which of the given device paths exist, as a list of booleans in the same order */
async function present(page, paths) {
    const checks = paths.map(devicePath => {
        const i = devicePath.lastIndexOf('/')
        const [dir, name] = [devicePath.slice(0, i) || '/', devicePath.slice(i + 1)]
        return `${JSON.stringify(name)} in os.listdir(${JSON.stringify(dir)})`
    })
    const answer = await askDevice(page, `[${checks.join(', ')}]`)
    return answer.slice(1, -1).split(',').map(x => x.trim() === 'True')
}

const exists = async (page, devicePath) => (await present(page, [devicePath]))[0]

/* How many pixels of the display are not black, counted at full resolution:
   helpers.js's sampler reads every 97th pixel, which misses a sprite the
   size of an alien. */
async function paintedPixels(page) {
    return page.evaluate(() => {
        const c = document.getElementById('display_canvas')
        const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
        let n = 0
        for (let i = 0; i < d.length; i += 4) {
            if (d[i] || d[i + 1] || d[i + 2]) n++
        }
        return n
    })
}

async function run(page) {
    const before = await terminalText(page)
    await page.click('#btn-run')
    return () => terminalText(page).then(t => t.slice(before.length))
}

test('a single-file example opens from a link, fetching only itself, and runs', async ({ page }) => {
    const fetched = await serveGallery(page)
    await page.goto('/?vm=1&example=paint')
    await waitForPrompt(page)

    await expect(activeTab(page)).toHaveText('paint.py', { timeout: 20_000 })
    expect(fetched).toEqual(['python-files.json', 'lib/examples/paint.py'])
    expect(await exists(page, '/paint.py')).toBe(true)

    const output = await run(page)
    await expect(page.locator('#xterm')).toContainText('Select a color and PAINT!', { timeout: 20_000 })
    expect(await output()).not.toContain('Traceback')
    expect(await distinctCanvasColors(page)).toBeGreaterThanOrEqual(5)
})

test('a package example lands under /lib with the helpers it imports, and runs', async ({ page }) => {
    const fetched = await serveGallery(page)
    await page.goto('/?vm=1&example=alien')
    await waitForPrompt(page)

    await expect(activeTab(page)).toHaveText('alien.py', { timeout: 20_000 })
    expect(await listDir(page, '/lib/alien')).toBe("['__init__.py', 'alien.py', 'alien_bitmap.py']")
    /* tft_text is not imported by alien itself: it comes in because tft_config
       imports it. The fonts package is not, because nothing here does. */
    expect(await present(page, ['/lib/tft_bitmap.py', '/lib/tft_config.py', '/lib/tft_text.py', '/lib/fonts']))
        .toEqual([true, true, true, false])
    expect(fetched).not.toContain('lib/utils/fonts/__init__.py')

    const output = await run(page)
    /* The alien drifts about on a black panel: no completion line to wait
       for, so the proof it is running is the picture (a one-bit sprite,
       white on black), and no traceback. */
    await expect.poll(() => paintedPixels(page), { timeout: 20_000 }).toBeGreaterThanOrEqual(50)
    expect(await output()).not.toContain('Traceback')
})

test('a module beside the entry comes with it, and __file__ lets the entry find it', async ({ page }) => {
    await serveGallery(page)
    await page.goto('/?vm=1&example=calc_lvgl')
    await waitForPrompt(page)

    await expect(activeTab(page)).toHaveText('calc_lvgl.py', { timeout: 20_000 })
    expect(await present(page, ['/calc_lvgl.py', '/calc_engine.py'])).toEqual([true, true])

    /* calc_lvgl locates calc_engine through __file__ - a NameError here would
       mean the run no longer tells a program where it is. */
    const output = await run(page)
    await expect.poll(() => distinctCanvasColors(page), { timeout: 20_000 }).toBeGreaterThanOrEqual(5)
    expect(await output()).not.toContain('Traceback')
})

test('a font reached by its own name inside a helper package is staged with it', async ({ page }) => {
    await serveGallery(page)
    await page.goto('/?vm=1&example=hello')
    await waitForPrompt(page)

    await expect(activeTab(page)).toHaveText('hello.py', { timeout: 20_000 })
    expect(await listDir(page, '/lib/fonts')).toBe("['__init__.py', 'vga2_bold_16x32.py']")

    const output = await run(page)
    await expect.poll(() => distinctCanvasColors(page), { timeout: 20_000 }).toBeGreaterThanOrEqual(3)
    expect(await output()).not.toContain('Traceback')
})

test('with no device in the link, the example waits for the one you connect', async ({ page }) => {
    await serveGallery(page)
    await page.goto('/?example=paint')
    await expect(page.locator('#toast-container')).toContainText('Connect the simulator or a board to open paint')

    await page.click('#btn-conn-sim')
    await waitForPrompt(page)
    await expect(activeTab(page)).toHaveText('paint.py', { timeout: 20_000 })
    expect(await exists(page, '/paint.py')).toBe(true)
})

test('a name the gallery does not have is reported, and the device is still usable', async ({ page }) => {
    await serveGallery(page)
    await page.goto('/?vm=1&example=no_such_example')
    await waitForPrompt(page)

    await expect(page.locator('#toast-container')).toContainText('no example named "no_such_example"', { timeout: 20_000 })
    expect(await exists(page, '/main.py')).toBe(true)
})
