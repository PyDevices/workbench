/*
 * The Bluetooth transport must never start a GATT write while another is still
 * in flight, however fast the REPL is typed into.
 */
import { assert } from 'chai'

Object.defineProperty(globalThis.navigator, 'bluetooth', { value: {}, configurable: true })
const { WebBluetooth } = await import('../../src/transports/bluetooth.js')

function makeTransport(chunk) {
    const t = new WebBluetooth()
    t.writeChunk = chunk
    const sent = []
    let inFlight = false
    t.tx = {
        async writeValue(v) {
            if (inFlight) { throw new DOMException('GATT operation already in progress.', 'NetworkError') }
            inFlight = true
            await new Promise(r => setTimeout(r, 5))
            sent.push(Array.from(v))
            inFlight = false
        },
    }
    return { t, sent }
}

describe('Bluetooth transport writes', function () {
    it('keeps every keystroke typed back to back', async function () {
        const { t, sent } = makeTransport(20)
        const errors = []
        t.handleWriteError = (e) => { errors.push(e.message); return true }
        const text = 'print("hello world")\r'
        await Promise.all([...text].map(c => t.write(c)))
        assert.deepEqual(errors, [])
        assert.equal(String.fromCharCode(...sent.flat()), text)
    })

    it('batches waiting keystrokes without exceeding the characteristic size', async function () {
        const { t, sent } = makeTransport(8)
        t.handleWriteError = () => true
        const text = 'abcdefghijklmnopqrstuvwxyz'
        await Promise.all([...text].map(c => t.write(c)))
        assert.equal(String.fromCharCode(...sent.flat()), text)
        assert.isTrue(sent.every(s => s.length <= 8))
        assert.isBelow(sent.length, text.length)
    })
})
