/*
 * SPDX-FileCopyrightText: 2026 PyDevices
 * SPDX-License-Identifier: MIT
 *
 * How a gallery example is resolved into files and device paths, against an
 * in-memory gallery: which files come along, where each one goes, and what is
 * refused. The browser suite (test/browser/gallery-open.spec.js) covers the
 * same resolver end to end, on the real runtime; this is where the corners
 * are cheap to pin down.
 */

import { assert } from 'chai'
import { resolveGalleryExample, rawStageGalleryExample, GALLERY_URL } from '../../src/pydevices/gallery.js'

const SITE = {
    'lib/examples/paint.py': 'from board_config import display_drv\nimport appdev\n',
    'lib/examples/calc_lvgl.py': '# deps: lvgl\n# modules: calc_engine\n"""calc"""\nimport lvgl as lv\nfrom calc_engine import CalcEngine\n',
    'lib/examples/calc_engine.py': 'class CalcEngine: pass\n',
    'lib/examples/hello.py': '# utils: tft_config\nimport tft_config\nimport vga2_bold_16x32 as font\n',
    'lib/examples/alien/__init__.py': 'from . import alien\n',
    'lib/examples/alien/alien.py': 'import tft_bitmap\nimport alien_bitmap\n',
    'lib/examples/alien/alien_bitmap.py': 'BITMAP = b""\n',
    'lib/examples/audiolive_rack.py': '# manifests: audiolive\nimport audiolive\n',
    'lib/examples/gui_demo.py': 'from color_setup import ssd\n',
    'lib/utils/tft_config.py': 'import tft_text\n',
    'lib/utils/tft_text.py': 'from pygraphics import Area\n',
    'lib/utils/tft_bitmap.py': 'import tft_text\n',
    'lib/utils/color_setup.py': 'import hardware_setup\n',
    'lib/utils/hardware_setup.py': 'from gui.core.ugui import Display\n',
    'lib/utils/fonts/__init__.py': '',
    'lib/utils/fonts/vga2_bold_16x32.py': 'WIDTH = 16\n',
    'lib/utils/fonts/vga1_8x8.py': 'WIDTH = 8\n',
    'lib/utils/pixel_sim/__init__.py': '',
    'lib/utils/pixel_sim/board_config.py': '',
}

const LISTING = Object.keys(SITE)
    .map(p => p.replace(/^lib\/examples\//, '').replace(/^lib\//, ''))
    .sort()

/* A gallery served from memory, remembering what was asked of it */
function fakeGallery(site = SITE, listing = LISTING) {
    const requests = []
    const take = (url) => {
        assert.isTrue(url.startsWith(GALLERY_URL), `off-gallery fetch: ${url}`)
        const rel = url.slice(GALLERY_URL.length)
        requests.push(rel)
        return rel
    }
    return {
        requests,
        getJSON: async (url) => {
            const rel = take(url)
            if (rel !== 'python-files.json') throw new Error('404')
            return listing
        },
        getText: async (url) => {
            const rel = take(url)
            if (!(rel in site)) throw new Error(`404 ${rel}`)
            return site[rel]
        },
    }
}

const paths = (plan) => plan.files.map(f => f.path).sort()

describe('Gallery examples / resolving', function () {
    it('a single-file example is one file, in the root', async function () {
        const g = fakeGallery()
        const plan = await resolveGalleryExample('paint', g)
        assert.equal(plan.entry, '/paint.py')
        // board_config is the runtime's own; pixel_sim/board_config.py is not
        // what `import board_config` means, and must not come along
        assert.deepEqual(paths(plan), ['/paint.py'])
        assert.deepEqual(plan.packages, [])
        assert.deepEqual(g.requests, ['python-files.json', 'lib/examples/paint.py'])
        assert.equal(plan.files[0].text, SITE['lib/examples/paint.py'])
    })

    it('a module the entry imports from beside itself comes along, to the root', async function () {
        const plan = await resolveGalleryExample('calc_lvgl', fakeGallery())
        assert.equal(plan.entry, '/calc_lvgl.py')
        assert.deepEqual(paths(plan), ['/calc_engine.py', '/calc_lvgl.py'])
    })

    it('a package example goes whole under /lib, with the entry named after it', async function () {
        const plan = await resolveGalleryExample('alien', fakeGallery())
        assert.equal(plan.entry, '/lib/alien/alien.py')
        assert.deepEqual(paths(plan), [
            '/lib/alien/__init__.py', '/lib/alien/alien.py', '/lib/alien/alien_bitmap.py',
            // what alien imports, and what that imports
            '/lib/tft_bitmap.py', '/lib/tft_text.py',
        ])
    })

    it('helpers follow their own imports until nothing new turns up', async function () {
        const plan = await resolveGalleryExample('gui_demo', fakeGallery())
        assert.deepEqual(paths(plan), ['/gui_demo.py', '/lib/color_setup.py', '/lib/hardware_setup.py'])
    })

    it('a file inside a helper package is found by its own name, with the package __init__', async function () {
        const plan = await resolveGalleryExample('hello', fakeGallery())
        assert.deepEqual(paths(plan), [
            '/hello.py',
            '/lib/fonts/__init__.py', '/lib/fonts/vga2_bold_16x32.py',
            '/lib/tft_config.py', '/lib/tft_text.py',
        ])
    })

    it('a package named in # manifests: is left to the package manager', async function () {
        const g = fakeGallery()
        const plan = await resolveGalleryExample('audiolive_rack', g)
        assert.deepEqual(paths(plan), ['/audiolive_rack.py'])
        assert.deepEqual(plan.packages, [`${GALLERY_URL}packages/audiolive.json`])
    })

    it('a name the gallery does not list is refused by name', async function () {
        await assert.rejects(() => resolveGalleryExample('nothing_here', fakeGallery()), /no example named "nothing_here"/)
    })

    it('a name that is not an identifier is refused before anything is fetched', async function () {
        const g = fakeGallery()
        await assert.rejects(() => resolveGalleryExample('../index', g), /not an example name/)
        assert.deepEqual(g.requests, [])
    })

    it('a gallery that cannot be reached says so', async function () {
        const g = fakeGallery()
        g.getJSON = async () => { throw new Error('ENETDOWN') }
        await assert.rejects(() => resolveGalleryExample('paint', g), /Cannot reach the gallery/)
    })
})

describe('Gallery examples / staging', function () {
    it('makes each folder once, writes every file in place, then installs the packages', async function () {
        const log = []
        const raw = {
            makePath: async (p) => { log.push(['mkdir', p]) },
            writeFile: async (p, text, chunk, direct) => { log.push(['write', p, text, direct]) },
        }
        const plan = {
            entry: '/lib/alien/alien.py',
            files: [
                { path: '/lib/alien/__init__.py', text: 'a' },
                { path: '/lib/alien/alien.py', text: 'b' },
                { path: '/lib/tft_text.py', text: 'c' },
                { path: '/note.py', text: 'd' },
            ],
            packages: ['https://example.test/packages/audiolive.json'],
        }
        await rawStageGalleryExample(raw, plan, { installPkg: async (r, url) => { log.push(['install', url]) } })
        assert.deepEqual(log, [
            ['mkdir', 'lib/alien'],
            ['write', '/lib/alien/__init__.py', 'a', true],
            ['write', '/lib/alien/alien.py', 'b', true],
            ['mkdir', 'lib'],
            ['write', '/lib/tft_text.py', 'c', true],
            ['write', '/note.py', 'd', true],
            ['install', 'https://example.test/packages/audiolive.json'],
        ])
    })
})
