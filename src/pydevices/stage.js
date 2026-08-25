/*
 * SPDX-FileCopyrightText: 2026 PyDevices
 * SPDX-License-Identifier: MIT
 *
 * The device stage: where the virtual device's display appears.
 *
 * The runtime's canvas bridge looks its targets up by element id, so the
 * canvases live in the page from the start and are simply revealed when a
 * virtual device connects. A real board draws on its own screen, so the stage
 * stays out of the way for every other connection type.
 */

import { QID } from '../utils_browser.js'
import { DEFAULT_WIDTH, DEFAULT_HEIGHT, setBootSize } from './runtime.js'

const STAGE_ID = 'device-stage'
const STORAGE_KEY = 'workbench-display'

/* Panels people actually build against: the small SPI displays, a couple of
   phone-shaped panels, and the round watch faces that are the reason shape is
   a setting at all rather than a consequence of the pixel count. */
export const PRESETS = {
    '320x240':       { width: 320, height: 240, shape: 'rect',  label: '320 × 240' },
    '240x320':       { width: 240, height: 320, shape: 'rect',  label: '240 × 320' },
    '240x240':       { width: 240, height: 240, shape: 'rect',  label: '240 × 240' },
    '240x240-round': { width: 240, height: 240, shape: 'round', label: '240 × 240 round' },
    '466x466-round': { width: 466, height: 466, shape: 'round', label: '466 × 466 round' },
    '480x320':       { width: 480, height: 320, shape: 'rect',  label: '480 × 320' },
    '320x480':       { width: 320, height: 480, shape: 'rect',  label: '320 × 480' },
    '800x480':       { width: 800, height: 480, shape: 'rect',  label: '800 × 480' },
}

const DEFAULT_CONFIG = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, shape: 'rect' }

let config = { ...DEFAULT_CONFIG }
/* Set by app.js, which owns the port and therefore the reset */
let resizeHandler = null

function readStored() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        const width = parseInt(parsed.width, 10)
        const height = parseInt(parsed.height, 10)
        if (!isValidSize(width, height)) return null
        return { width, height, shape: parsed.shape === 'round' ? 'round' : 'rect' }
    } catch {
        return null
    }
}

function persist() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch {
        /* private browsing, quota - the size just will not be remembered */
    }
}

function isValidSize(width, height) {
    return Number.isInteger(width) && Number.isInteger(height) &&
           width >= 16 && height >= 16 && width <= 2048 && height <= 2048
}

/* The key the <select> should be showing for the size in force */
function presetKey(cfg) {
    for (const [key, preset] of Object.entries(PRESETS)) {
        if (preset.width === cfg.width && preset.height === cfg.height && preset.shape === cfg.shape) {
            return key
        }
    }
    return 'custom'
}

export function getDisplayConfig() {
    return { ...config }
}

/* The canvas is the framebuffer: its width and height are device pixels, and
   the runtime reads them when it builds the display. */
function applyConfig() {
    const canvas = QID('display_canvas')
    if (canvas) {
        canvas.width = config.width
        canvas.height = config.height
        canvas.classList.toggle('round', config.shape === 'round')
    }
    QID('device-bezel')?.classList.toggle('round', config.shape === 'round')
    setBootSize(config.width, config.height)

    const select = QID('sim-resolution')
    if (select) {
        const key = presetKey(config)
        if (key === 'custom') {
            const custom = select.querySelector('option[value="custom"]')
            if (custom) custom.textContent = `${config.width} × ${config.height}…`
        }
        select.value = key
    }
}

/*
 * A running interpreter has already built its display, so a new size only
 * reaches it through a reset - which app.js performs, since it owns the port.
 */
function commit(next) {
    const changed = next.width !== config.width || next.height !== config.height
    config = { ...config, ...next }
    persist()
    applyConfig()
    if (changed && resizeHandler) resizeHandler()
}

export function onDisplayResize(handler) {
    resizeHandler = handler
}

export function showDeviceStage() {
    const stage = QID(STAGE_ID)
    if (!stage) return
    applyConfig()
    stage.classList.add('visible')
}

export function hideDeviceStage() {
    QID(STAGE_ID)?.classList.remove('visible')
}

function openCustomDialog() {
    const dialog = QID('custom-size-dialog')
    if (!dialog) return
    QID('custom-size-w').value = config.width
    QID('custom-size-h').value = config.height
    QID('custom-size-round').checked = config.shape === 'round'
    dialog.showModal()
}

export function initDeviceStage() {
    const stage = QID(STAGE_ID)
    if (!stage) return

    const stored = readStored()
    if (stored) config = stored
    applyConfig()

    /* Pointer and key events only reach Python while the canvas has focus, and
       a click anywhere on the bezel is a click meant for the device. */
    QID('device-bezel')?.addEventListener('pointerdown', () => {
        QID('display_canvas')?.focus()
    })

    QID('sim-resolution')?.addEventListener('change', (event) => {
        const value = event.target.value
        if (value === 'custom') {
            openCustomDialog()
            /* Put the select back until the dialog says otherwise */
            event.target.value = presetKey(config)
            return
        }
        const preset = PRESETS[value]
        if (preset) commit({ width: preset.width, height: preset.height, shape: preset.shape })
    })

    const form = QID('custom-size-form')
    form?.addEventListener('submit', () => {
        const width = parseInt(QID('custom-size-w').value, 10)
        const height = parseInt(QID('custom-size-h').value, 10)
        if (!isValidSize(width, height)) return
        commit({ width, height, shape: QID('custom-size-round').checked ? 'round' : 'rect' })
    })
    QID('custom-size-cancel')?.addEventListener('click', () => QID('custom-size-dialog')?.close())
}
