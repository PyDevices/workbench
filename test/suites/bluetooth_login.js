/*
 * SPDX-License-Identifier: MIT
 *
 * Logging in over Bluetooth: the WebBluetooth transport against a fake board that
 * keeps the rules a password-protected Bluetooth REPL keeps (bledev.repl, like
 * WebREPL). The first line the board is sent is taken as the password, so
 * nothing but an empty line may go before it: a board that sees anything else
 * answers "Access denied" and hangs up.
 *
 * Web Bluetooth is faked at the GATT level, so nothing here touches a board.
 */

import { assert } from 'chai'
import { WebBluetooth } from '../../src/transports/bluetooth.js'

const NUS_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
const NUS_WRITE = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'
const NUS_NOTIFY = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'

const PROMPT = 'Password: '
const BANNER = '\r\nbledev REPL connected\r\n>>> '
const DENIED = '\r\nAccess denied\r\n'

/*
 * kind 'password': bledev.repl with a password. 'plain': a REPL with no lock,
 * answering every line with a prompt. 'silent': a board that answers nothing,
 * as one still pairing does.
 */
class FakeBoard {
    constructor(kind, password = 'hunter22') {
        this.kind = kind
        this.password = password
        this.writes = []
        this.line = ''
        this.authed = kind === 'plain'
        this.refused = false
        this.connected = false
        this.repl = ''
        this.listener = null
        const board = this
        this.notifyChar = {
            uuid: NUS_NOTIFY,
            addEventListener(_name, fn) { board.listener = fn },
            removeEventListener() { board.listener = null },
            async startNotifications() {},
        }
        this.writeChar = {
            uuid: NUS_WRITE,
            async writeValue(data) { board.feed(new TextDecoder().decode(data)) },
        }
        this.device = {
            name: 'mpy-repl',
            addEventListener() {},
            removeEventListener() {},
            gatt: {
                connected: false,
                connect: async () => {
                    this.connected = true
                    this.device.gatt.connected = true
                    return {
                        getPrimaryServices: async () => [{
                            uuid: NUS_SERVICE,
                            getCharacteristic: async (uuid) =>
                                uuid === NUS_NOTIFY ? this.notifyChar : this.writeChar,
                        }],
                    }
                },
                disconnect: async () => {
                    this.connected = false
                    this.device.gatt.connected = false
                },
            },
        }
    }

    say(text) {
        const value = new TextEncoder().encode(text)
        setTimeout(() => { if (this.listener) this.listener({ target: { value } }) }, 5)
    }

    feed(text) {
        this.writes.push(text)
        if (this.kind === 'silent' || this.refused || !this.connected) { return }
        if (this.authed) {
            this.repl += text
            if (text.includes('\r')) { this.say('\r\n>>> ') }
            return
        }
        for (let i = 0; i < text.length; i++) {
            const c = text[i]
            if (c === '\r' || c === '\n') {
                if (!this.line) { this.say(PROMPT); continue }
                if (this.line === this.password) {
                    this.authed = true
                    this.repl += text.slice(i + 1)
                    this.say(BANNER)
                } else {
                    this.refused = true
                    this.say(DENIED)
                }
                this.line = ''
                return
            }
            this.line += c
        }
    }
}

async function transportFor(board, password) {
    Object.defineProperty(globalThis.navigator, 'bluetooth', {
        value: { requestDevice: async () => board.device },
        configurable: true,
    })
    const port = new WebBluetooth()
    let asked = 0
    port.onPasswordRequest(async () => { asked++; return password })
    await port.requestAccess()
    return { port, asked: () => asked }
}

describe('Bluetooth / logging in', function () {
    after(function () {
        delete globalThis.navigator.bluetooth
    })

    it('asks for the password before sending anything else', async function () {
        const board = new FakeBoard('password')
        const { port, asked } = await transportFor(board, 'hunter22')
        await port.connect()
        assert.equal(asked(), 1, 'the password was asked for once')
        assert.isTrue(board.authed, 'the board let us in')
        assert.deepEqual(board.writes, ['\r', 'hunter22\r'],
            'only an empty line went before the password')
        await port.write(' \r')
        assert.equal(board.repl, ' \r', 'what follows reaches the REPL')
        await port.disconnect()
    })

    it('reports a wrong password', async function () {
        const board = new FakeBoard('password')
        const { port } = await transportFor(board, 'hunter2')
        let error = null
        try { await port.connect() } catch (err) { error = err }
        assert.match(String(error), /Invalid password/)
        assert.isFalse(board.authed)
        await port.disconnect()
    })

    it('does not ask a board with no password', async function () {
        const board = new FakeBoard('plain')
        const { port, asked } = await transportFor(board, 'hunter22')
        await port.connect()
        assert.equal(asked(), 0)
        assert.deepEqual(board.writes, ['\r'])
        await port.disconnect()
    })

    it('does not hold up a board that says nothing', async function () {
        const board = new FakeBoard('silent')
        const { port, asked } = await transportFor(board, 'hunter22')
        const started = Date.now()
        await port.connect()
        assert.isBelow(Date.now() - started, 3000, 'connect() gave up waiting')
        assert.equal(asked(), 0)
        await port.disconnect()
    })
})
