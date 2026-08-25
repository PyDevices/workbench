/*
 * SPDX-FileCopyrightText: 2024 Volodymyr Shymanskyy
 * SPDX-License-Identifier: MIT
 *
 * MicroPython WASM transport. Works in both browser and Node: the caller passes
 * a loadMicroPython function (statically imported in the browser bundle, dynamically
 * resolved under Node) and optional configuration for the WASM URL and initial FS.
 */

import { Transport } from './base.js'

const PYEXEC_FORCED_EXIT = 0x100
export const SYSTEM_DIRS = new Set(['/sys', '/dev', '/proc'])

const MACHINE_MODULE = `\
def reset():
    raise SystemExit

def soft_reset():
    raise SystemExit
`

/**
 * Recursively walk the Emscripten FS and collect all user files/dirs.
 */
function snapshotFS(FS, root = '/') {
    const dirs = []
    const files = []

    function walk(path) {
        if (SYSTEM_DIRS.has(path)) return
        let entries
        try {
            entries = FS.readdir(path)
        } catch {
            return
        }
        for (const name of entries) {
            if (name === '.' || name === '..') continue
            const full = path === '/' ? '/' + name : path + '/' + name
            let stat
            try {
                stat = FS.stat(full)
            } catch {
                continue
            }
            if (FS.isDir(stat.mode)) {
                dirs.push(full)
                walk(full)
            } else if (FS.isFile(stat.mode)) {
                try {
                    files.push({ path: full, data: FS.readFile(full) })
                } catch {
                    // skip unreadable files
                }
            }
        }
    }

    walk(root)
    return { dirs, files }
}

function restoreFS(FS, snapshot) {
    for (const dir of snapshot.dirs) {
        try { FS.mkdir(dir) } catch { /* already exists */ }
    }
    for (const { path, data } of snapshot.files) {
        try { FS.writeFile(path, data) } catch { /* skip */ }
    }
}

/**
 * MicroPython WASM transport.
 *
 * @param {Function} loadMicroPython  - The loadMicroPython factory from the MP package
 * @param {Object}   [opts]
 * @param {string}   [opts.wasmURL]   - Explicit URL for micropython.wasm (browser)
 * @param {Function} [opts.populateFS] - async (mp) => void, called on first boot to
 *                                       populate the filesystem with example files etc.
 * @param {Function} [opts.onBoot]     - async (mp) => void, called for every VM, including
 *                                       the ones a reset creates, once its FS is ready.
 * @param {Object}   [opts.mpOptions] - Extra loadMicroPython options (heapsize, pystack, ...)
 * @param {boolean}  [opts.asyncify]  - Feed the REPL through replProcessCharWithAsyncify,
 *                                      which only builds compiled with ASYNCIFY provide.
 *                                      It lets the VM yield to the browser mid-call.
 * @param {string}   [opts.infoType]  - Label reported as the device type
 */
export class MicroPythonWASM extends Transport {
    constructor(loadMicroPython, opts = {}) {
        super()
        this._loadMicroPython = loadMicroPython
        this._wasmURL = opts.wasmURL || undefined
        this._populateFS = opts.populateFS || null
        this._onBoot = opts.onBoot || null
        this._mpOptions = opts.mpOptions || null
        this._asyncify = !!opts.asyncify
        this.mp = null
        this._inRawMode = false
        this._suppressedOutput = false
        this._fsPopulated = false
        this._decoder = new TextDecoder('utf-8')
        this._writeQueue = Promise.resolve()
        this.info = { type: opts.infoType || 'MicroPython WASM' }
    }

    async requestAccess() {
        await this._createVM()
    }

    async _createVM(fsSnapshot = null) {
        const mpOpts = Object.assign({ linebuffer: false }, this._mpOptions)
        if (this._wasmURL) mpOpts.url = this._wasmURL

        mpOpts.stdout = (data) => {
            if (this._suppressedOutput) return
            if (typeof data === 'string') {
                this.receiveCallback(data)
            } else {
                this.receiveCallback(this._decoder.decode(data, { stream: true }))
            }
            this.activityCallback()
        }
        // Builds that split stderr out would otherwise drop tracebacks on the floor.
        mpOpts.stderr = mpOpts.stdout

        this.mp = await this._loadMicroPython(mpOpts)

        if (fsSnapshot) {
            restoreFS(this.mp.FS, fsSnapshot)
        } else if (this._populateFS && !this._fsPopulated) {
            await this._populateFS(this.mp)
            this._fsPopulated = true
        } else {
            try { this.mp.FS.mkdir('/lib') } catch { /* exists */ }
        }

        // Always ensure machine module is present
        try { this.mp.FS.mkdir('/lib') } catch { /* exists */ }
        this.mp.FS.writeFile('/lib/machine.py', MACHINE_MODULE)

        // Interpreter state - sys.path, environment, imports - does not survive
        // into the fresh VM a reset builds, so this runs for every one of them,
        // where populateFS only ever runs for the first.
        if (this._onBoot) {
            await this._onBoot(this.mp)
        }
    }

    _processInputChar(c) {
        // NOTE: PyScript variant is not built with ASYNCIFY, so it only gets the
        // plain call. Builds that do have it (see opts.asyncify) yield to the
        // browser inside sleeps and long loops instead of freezing the page.
        if (this._asyncify) {
            return this.mp.replProcessCharWithAsyncify(c)
        }
        return this.mp.replProcessChar(c)
    }

    /**
     * Restart the WASM VM while preserving the filesystem.
     * Implements both hard and soft reset identically.
     */
    async _restart() {
        const wasRaw = this._inRawMode

        const snapshot = snapshotFS(this.mp.FS)
        this._suppressedOutput = true

        this._decoder = new TextDecoder('utf-8')

        await this._createVM(snapshot)
        this.mp.replInit()

        if (wasRaw) {
            await this._processInputChar(0x03)
            await this._processInputChar(0x01)
        }

        this._suppressedOutput = false
        if (wasRaw) {
            this.receiveCallback('MPY: soft reboot\r\nraw REPL; CTRL-B to exit\r\n>')
        } else {
            this.receiveCallback('MPY: soft reboot\r\n>>> ')
        }
        this.activityCallback()
    }

    async connect() {
        this.mp.replInit()
    }

    async disconnect() {
        this.mp = null
    }

    /*
     * The REPL takes one character at a time, and strictly one at a time: under
     * ASYNCIFY a call can suspend mid-character, and the runtime rejects a second
     * one while it is in flight. Terminal keystrokes are written straight to the
     * port, so they can land in the middle of another write - a Ctrl-D from the
     * reset button, say - and the interleaved characters reach the parser as
     * garbage. One queue for the whole VM keeps every write in order.
     */
    async writeBytes(data) {
        const done = this._writeQueue.then(() => this._writeBytesNow(data))
        /* The chain must survive a failed write, or nothing after it would run */
        this._writeQueue = done.catch(() => {})
        return done
    }

    async _writeBytesNow(data) {
        for (let i = 0; i < data.length; i++) {
            const byte = data[i]

            if (byte === 0x01) this._inRawMode = true
            else if (byte === 0x02) this._inRawMode = false

            const ret = await this._processInputChar(byte)
            if (ret === PYEXEC_FORCED_EXIT) {
                await this._restart()
            } else if (ret) {
                this.disconnectCallback()
            }
        }
    }
}
