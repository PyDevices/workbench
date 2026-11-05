/*
 * SPDX-FileCopyrightText: 2026 PyDevices
 * SPDX-License-Identifier: MIT
 *
 * Putting omip.py on the connected device, so it can install OmniPython
 * packages for itself. The file comes straight from its repository and needs
 * no package index. It stays source: CircuitPython can't run the .mpy this app
 * would compile, and the same file then works on every board.
 */

import { rawInstallPkg } from '../package_mgr.js'

const OMIP_PACKAGE = {
    name: 'omip',
    urls: [['omip.py', 'github:PyDevices/pydevices/lib/omip.py']],
}

export async function rawInstallOmip(raw, dev) {
    return rawInstallPkg(raw, OMIP_PACKAGE.name, {
        dev,
        pkg_info: OMIP_PACKAGE,
        prefer_source: true,
    })
}
