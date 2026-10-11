/*
 * SPDX-FileCopyrightText: 2026 PyDevices
 * SPDX-License-Identifier: MIT
 *
 * Opening an example from the PyDevices gallery.
 *
 * A link such as ?example=paint names one card of the published gallery. The
 * gallery is a static site, so everything an example is made of can be read
 * straight off it: python-files.json lists every example and helper file it
 * carries, and the files themselves sit under lib/examples/ and lib/utils/.
 * This module works out which of those files the named example needs and
 * where each one goes on the device, then writes them there. Nothing here
 * touches the page, so the resolver runs under Node as well.
 *
 * Where things land follows what a board user would do by hand:
 *
 *   - A single-file example and the modules it imports from beside it go
 *     in the root, next to main.py.
 *   - A package example (examples/<name>/...) goes under /lib/<name>/, where
 *     a mip install would put it, so `import <name>` works at the prompt.
 *   - The helpers under lib/utils/ that the example reaches for go in /lib/,
 *     and only those: a board is written over a serial link, so the whole
 *     helper tree would be a long wait for files nothing imports.
 *   - Extra packages an example declares with `# manifests:` are installed
 *     through the package manager, like any other package.
 */

import { fetchJSON, fetchText, splitPath } from '../utils.js'

export const GALLERY_URL = 'https://pydevices.github.io/pydevices-examples/gallery/'

/* How many lines the gallery scans for its `# key: a, b` headers */
const HEADER_LINES = 10

/* The same shape the gallery generator matches when it works out which
   modules an example imports from beside itself. */
const IMPORT_RE = /^\s*(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))/gm

const NAME_RE = /^[A-Za-z_]\w*$/

function headerList(text, key) {
    const want = `# ${key}:`
    for (const line of text.split('\n').slice(0, HEADER_LINES)) {
        const s = line.trim()
        if (s.startsWith(want)) {
            return s.slice(want.length).split(',').map(x => x.trim()).filter(Boolean)
        }
    }
    return []
}

function topLevelImports(text) {
    const names = new Set()
    for (const m of text.matchAll(IMPORT_RE)) {
        const mod = m[1] || m[2]
        if (!mod || mod.startsWith('.')) continue
        names.add(mod.split('.')[0])
    }
    return names
}

/* Helper packages whose files are imported one by one, by their own names:
   tft_config puts utils/fonts/ on sys.path, and an example then says
   `import vga2_bold_16x32`. A file inside any other helper package is that
   package's own (pixel_sim/board_config.py is pixel_sim's board config, not
   the one frozen into the runtime) and comes along only when the package
   does. */
const FLAT_PACKAGES = new Set(['fonts'])

/*
 * The helper files under lib/utils/, indexed by the names a program imports
 * them as: a module (utils/console.py), a package (utils/pixel_sim/...), or
 * a file in one of the FLAT_PACKAGES, with that package's __init__. Each
 * name maps to the files that make it importable.
 */
function indexUtils(listing) {
    const byName = new Map()
    const add = (name, rel) => {
        if (!byName.has(name)) byName.set(name, new Set())
        byName.get(name).add(rel)
    }
    for (const rel of listing) {
        if (!rel.startsWith('utils/') || !rel.endsWith('.py')) continue
        const parts = rel.slice('utils/'.length).split('/')
        if (parts.length === 1) {
            add(parts[0].slice(0, -3), rel)
            continue
        }
        // Every file of the package, under the package's name
        add(parts[0], rel)
        // A file inside it, under its own name, with the package's __init__
        const stem = parts[parts.length - 1].slice(0, -3)
        if (stem !== '__init__' && FLAT_PACKAGES.has(parts[0])) {
            add(stem, rel)
            const init = `utils/${parts.slice(0, -1).join('/')}/__init__.py`
            if (listing.includes(init)) add(stem, init)
        }
    }
    return byName
}

/*
 * Works out what the named example is made of.
 *
 * Returns { name, entry, files, packages }: `entry` is the device path of the
 * file to open in the editor, `files` is [{ path, text }] for everything to
 * write, and `packages` is the package.json URLs to hand the package manager.
 * Throws when the gallery has no such example, or cannot be reached.
 *
 * `gallery` and the fetchers are parameters so the resolver can be tested
 * without a network.
 */
export async function resolveGalleryExample(name, { gallery = GALLERY_URL, getJSON = fetchJSON, getText = fetchText } = {}) {
    if (!NAME_RE.test(name)) {
        throw new Error(`"${name}" is not an example name`)
    }
    let listing
    try {
        listing = await getJSON(gallery + 'python-files.json')
    } catch (err) {
        throw new Error(`Cannot reach the gallery at ${gallery}`, { cause: err })
    }
    if (!Array.isArray(listing)) {
        throw new Error('The gallery index is not a list of files')
    }
    const utilsByName = indexUtils(listing)

    const isModule = listing.includes(`${name}.py`)
    const packageFiles = listing.filter(rel => rel.startsWith(`${name}/`) && rel.endsWith('.py'))
    if (!isModule && !packageFiles.length) {
        throw new Error(`The gallery has no example named "${name}"`)
    }

    /* rel (as listed) -> device path */
    const wanted = new Map()
    let entryRel
    if (isModule) {
        entryRel = `${name}.py`
        wanted.set(entryRel, `/${name}.py`)
    } else {
        entryRel = packageFiles.includes(`${name}/${name}.py`) ? `${name}/${name}.py` : `${name}/__init__.py`
        for (const rel of packageFiles) wanted.set(rel, `/lib/${rel}`)
    }

    const texts = new Map()
    const fetchRel = async (rel) => {
        if (!texts.has(rel)) {
            const url = gallery + (rel.startsWith('utils/') ? 'lib/' : 'lib/examples/') + rel
            texts.set(rel, await getText(url))
        }
        return texts.get(rel)
    }

    const entryText = await fetchRel(entryRel)

    /* A single-file example may import modules from beside itself. The gallery
       stages the ones named in `# modules:` and the ones the entry imports;
       here they come along to the root with it. A package it imports comes
       whole, under /lib like the example's own package would. */
    if (isModule) {
        const siblings = new Set(headerList(entryText, 'modules').map(m => m.endsWith('.py') ? m.slice(0, -3) : m))
        for (const top of topLevelImports(entryText)) siblings.add(top)
        for (const top of siblings) {
            if (top === name) continue
            if (listing.includes(`${top}.py`)) {
                wanted.set(`${top}.py`, `/${top}.py`)
            } else if (listing.includes(`${top}/__init__.py`)) {
                for (const rel of listing) {
                    if (rel.startsWith(`${top}/`) && rel.endsWith('.py')) wanted.set(rel, `/lib/${rel}`)
                }
            }
        }
    }

    await Promise.all([...wanted.keys()].map(fetchRel))

    /* The helpers: everything the staged files import that lives under
       lib/utils/, and everything those helpers import in turn, until nothing
       new turns up. The `# utils:` header is taken at its word as well. */
    const helperNames = new Set(headerList(entryText, 'utils'))
    const scanned = new Set()
    for (;;) {
        for (const rel of wanted.keys()) {
            if (scanned.has(rel)) continue
            scanned.add(rel)
            for (const top of topLevelImports(texts.get(rel))) helperNames.add(top)
        }
        let grew = false
        for (const helper of helperNames) {
            for (const rel of utilsByName.get(helper) || []) {
                if (wanted.has(rel)) continue
                wanted.set(rel, '/lib/' + rel.slice('utils/'.length))
                grew = true
            }
        }
        if (!grew) break
        await Promise.all([...wanted.keys()].filter(rel => !texts.has(rel)).map(fetchRel))
    }

    const packages = headerList(entryText, 'manifests')
        .filter(m => NAME_RE.test(m))
        .map(m => `${gallery}packages/${m}.json`)

    const files = [...wanted].map(([rel, path]) => ({ path, text: texts.get(rel) }))
    return { name, entry: wanted.get(entryRel), files, packages }
}

/*
 * Writes a resolved example to the device the raw session is open on, then
 * installs the packages it declared. `installPkg(raw, url)` is the app's own
 * package install, so what it does with a URL (compile to .mpy, toasts) is
 * the same as for any other package.
 */
export async function rawStageGalleryExample(raw, plan, { installPkg }) {
    const made = new Set(['/'])
    for (const { path, text } of plan.files) {
        const [dirname] = splitPath(path)
        if (dirname && !made.has(dirname)) {
            await raw.makePath(dirname)
            made.add(dirname)
        }
        await raw.writeFile(path, text, 128, true)
    }
    for (const url of plan.packages) {
        await installPkg(raw, url)
    }
}
