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
import { DEFAULT_WIDTH, DEFAULT_HEIGHT } from './runtime.js'

const STAGE_ID = 'device-stage'

export function setStageResolution(width, height) {
    const canvas = QID('display_canvas')
    if (!canvas) return
    canvas.width = width
    canvas.height = height
}

export function showDeviceStage() {
    const stage = QID(STAGE_ID)
    if (!stage) return
    setStageResolution(DEFAULT_WIDTH, DEFAULT_HEIGHT)
    stage.classList.add('visible')
}

export function hideDeviceStage() {
    const stage = QID(STAGE_ID)
    if (!stage) return
    stage.classList.remove('visible')
}

/* Pointer and key events only reach Python while the canvas has focus, and a
   click on the bezel is a click meant for the device. */
export function initDeviceStage() {
    const stage = QID(STAGE_ID)
    if (!stage) return
    stage.addEventListener('pointerdown', () => {
        QID('display_canvas')?.focus()
    })
}
