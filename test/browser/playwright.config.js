// SPDX-License-Identifier: MIT
//
// Browser-level suite: drives the built app the way a person does - clicking
// Connect, typing at the REPL, dragging the display. The Node suite next
// door (test/) exercises the same protocol code directly and is faster and
// finer-grained, but it always talks to the stock micropython-webassembly-pyscript
// VM; nothing there ever boots the PyDevices runtime, paints a pixel, or
// notices a crashed tab. This suite is what catches those.
import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: '.',
    timeout: 60_000,
    // The PyDevices VM installs pydevices-desktop from mip on every connect
    // (~55 small requests) before it prints a prompt; give it room.
    expect: { timeout: 45_000 },
    fullyParallel: false,
    workers: 1,
    retries: 0,
    reporter: [['list']],
    use: {
        baseURL: 'http://localhost:10001',
        headless: true,
        viewport: { width: 1400, height: 860 },
    },
    webServer: {
        command: 'python3 -m http.server 10001 --directory ../../build',
        url: 'http://localhost:10001/index.html',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
    },
})
