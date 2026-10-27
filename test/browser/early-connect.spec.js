// SPDX-License-Identifier: MIT
//
// A click on Connect made the instant the page starts loading used to be
// lost: the button was live before the script behind it had run, so the click
// hit an undefined `app` and nothing happened. The buttons now stay disabled
// until the app can honour the click, so an early click waits for that and
// then connects.
import { test, expect } from '@playwright/test'

const DELAY_MS = 3000

/* The app ships as one inline script at the end of index.html. To simulate a
   slow load, serve the same page with that script parked in an inert block
   and only started DELAY_MS later; the buttons above it are on screen the
   whole time. */
async function slowApp(page) {
    await page.route('**/index.html', async (route) => {
        const res = await route.fetch()
        const html = await res.text()
        const start = html.indexOf('<script>', html.indexOf('id="dpi-ruler"'))
        const end = html.lastIndexOf('</script>')
        const code = html.slice(start + '<script>'.length, end)
        const late = `<script type="text/plain" id="late-app">${code}</script>
<script>setTimeout(function () {
  var s = document.createElement('script')
  s.textContent = document.getElementById('late-app').textContent
  document.body.appendChild(s)
}, ${DELAY_MS})</script>`
        await route.fulfill({ response: res, body: html.slice(0, start) + late + html.slice(end + '</script>'.length) })
    })
}

test('connect clicked while the page is still loading connects once ready', async ({ page }) => {
    await slowApp(page)
    await page.goto('/index.html')
    // Playwright waits for the button to be enabled before it clicks.
    await page.locator('#btn-conn-sim').click()
    await expect(page.locator('#xterm')).toContainText('>>>', { timeout: 45_000 })
})

test('connect buttons are disabled until the app is ready', async ({ page }) => {
    await slowApp(page)
    await page.goto('/index.html')
    await expect(page.locator('#btn-conn-sim')).toBeDisabled()
    await expect(page.locator('#btn-conn-sim')).toBeEnabled({ timeout: 15_000 })
})
