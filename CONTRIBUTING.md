# Contributing to Workbench

Workbench is a fork of [ViperIDE](https://github.com/vshymanskyy/ViperIDE). The fork's policy is in [How it works](docs/how-it-works/viperide-fork.md#the-fork-policy): PyDevices-specific code goes in new files, diffs to upstream files stay small, and generic improvements are sent upstream. A bug fix or a translation is a good first contribution. Issues go to <https://github.com/PyDevices/workbench/issues>.

## Prerequisites

- Node.js and npm
- Python 3 and pip

Install JavaScript dependencies from the repository root:

```sh
npm install --include=dev
```

## Project Layout

| Path | Purpose |
|---|---|
| `src/` | Browser application source, styles, workers, bundled HTML entry files, translations, and virtual filesystem assets |
| `assets/` | Icons and images copied into the production build |
| `docs/` | The documentation, starting at [docs/index.md](docs/index.md) |
| `test/` | The protocol-level suite (`test/suites/`) and the browser suite (`test/browser/`) |
| `packages/viper-tools/` | MicroPython helper package metadata and files |
| `mcp/` | MCP server for controlling Workbench from an AI client |
| `build.py` | Production build script used by GitHub Pages deployment |
| `rollup.config.mjs` | Rollup bundle configuration |

## Base URL

Workbench loads its WebAssembly runtimes, virtual filesystem archives and `manifest.json` over absolute URLs, so the origin it is served from has to be baked into the bundle. It is substituted at build time from the `VIPER_IDE_BASE_URL` environment variable (the name is unchanged from upstream ViperIDE):

- In JavaScript, as the `VIPER_IDE_BASE_URL` constant (replaced by Rollup)
- In HTML, as the `${VIPER_IDE_BASE_URL}` placeholder (replaced while copying the files into `build/`)

`build.py` defaults it to `http://localhost:10001` and passes it on to Rollup. The `static.yml` and `release.yml` CI workflows both set `VIPER_IDE_BASE_URL=https://pydevices.github.io/workbench` explicitly for production builds (`static.yml` for the GitHub Pages deploy on every push to `main`, `release.yml` for the bundle attached to a tagged release).

**To override it manually, set `VIPER_IDE_BASE_URL`:**

```sh
export VIPER_IDE_BASE_URL=http://localhost:10001
```

```powershell
$env:VIPER_IDE_BASE_URL = "http://localhost:10001"
```

Without an override, a locally served IDE fetches its assets from the local development server.

## Run Locally

The development server is provided by Rollup watch mode. It serves the `build/` directory and rebuilds when source files change.

Run the full build from the repository root:

```sh
python3 build.py --skip-tests
```

The script:

- Clears and recreates `build/`
- Copies static HTML and assets
- Generates `build/translations.json` from `src/lang/*.json`
- Generates `build/manifest.json` with the version from `package.json`
- Resolves the base URL from `VIPER_IDE_BASE_URL`, defaulting to `http://localhost:10001`
- Vendors `python-minifier` from PyPI into `src/tools_vfs/lib/python_minifier`
- Builds reproducible virtual filesystem archives into `build/assets/`
- Runs `npm install` if `node_modules` is missing
- Unless `--skip-tests` is passed, runs ESLint (`npm run lint`) and the mocha
  protocol-level test suite (`npm run test`)
- Runs the Rollup build
- Inlines generated CSS and JavaScript into the HTML files
- Copies WebAssembly runtime assets (`micropython.wasm`, the `mpy-cross-*.wasm`
  binaries, `ruff_wasm_bg.wasm`) into `build/assets/`

The generated site, including those WebAssembly assets, is in `build/`.

Two flags change this behavior:

- `--prepare` stops right after vendoring dependencies (the `npm install`,
  `python-minifier`, and virtual filesystem tarball steps) — it does **not**
  run lint/tests, the Rollup build, or copy the WASM assets. It exists so
  other tooling (e.g. `npm test` on its own) has what it needs without paying
  for a full build; it does not produce a servable `build/`.
- `--skip-tests` runs the full build but skips the `npm run lint` and
  `npm run test` steps.

`npm run start` (Rollup watch mode) serves whatever is already in `build/`,
so run `python3 build.py --skip-tests` (or plain `python3 build.py`) at least
once first.

Start the watcher:

```sh
npm start
```


## Linting

Run ESLint directly:

```sh
npx eslint
```

The ESLint configuration ignores `build/`, `src/websocket_relay.cjs`, `mcp/` and `assets/pydevices/`.

## Translations

Translations live in `src/lang/*.json`. During `python3 build.py`, they are combined into `build/translations.json`.

When adding or changing UI strings:

- Update `src/lang/en.json` first
- Keep keys consistent across language files
- Run `python3 build.py` or `npx eslint` before submitting changes

The helper script `src/lang/_update.py` can be used when updating generated translation files.

## MCP Server

The MCP server is maintained separately under `mcp/`.

Install its dependencies:

```sh
cd mcp
npm install
```

For development, build Workbench first, then run the MCP server:

```sh
cd ..
python3 build.py --skip-tests
cd mcp
npm start
```

The server serves the built app, opens a browser window, and exposes MCP tools for IDE, terminal, file, package, and device operations.

## Testing

```sh
npm test              # protocol-level suite (test/) - no browser, no hardware
npm run test:browser  # browser-level suite (test/browser/) - drives the built app
```

`npm test` exercises `src/rawmode.js`, `src/transports/` and `src/package_mgr.js` directly against the stock MicroPython WASM VM; point it at real hardware with `VIPER_TEST_TARGET` (see [test/README.md](test/README.md)). It never touches the PyDevices runtime.

`npm run test:browser` does: it drives the same `build/` output CI deploys with Playwright, connecting the simulator, running every example, resizing, resetting and installing a package. It's what catches PyDevices-runtime regressions the protocol suite can't see. Run `python3 build.py --skip-tests` first if `build/` is stale.

## Releases

Workbench has two independent release tracks (see `.github/workflows/`):

- **App releases**: pushing a plain `vX.Y.Z` tag (matching `v[0-9]*`) triggers
  `release.yml`, which builds the app with
  `VIPER_IDE_BASE_URL=https://pydevices.github.io/workbench` via
  `python3 build.py --skip-tests`, zips `build/`, and attaches it to a GitHub
  Release for that tag. It first refuses to run against a pre-fork tree (a
  `package.json` name that isn't Workbench's), since the `v0.5.x`-`v0.6.x`
  tags inherited from ViperIDE predate the fork. `workflow_dispatch` can
  re-run it against an existing tag for a catch-up release.
- **MCP releases**: pushing an `mcp-v*` tag triggers `mcp-dist.yml`, which
  publishes only the MCP tool's npm artifact from `mcp/`. It does not touch
  the app release.
- **GitHub Pages**: every push to `main` runs `static.yml`, which builds with
  `python3 build.py --prepare && npm run lint && npm run test`, then
  `python3 build.py --skip-tests`, and deploys `build/` to
  <https://pydevices.github.io/workbench/>. This is separate from, and more
  frequent than, either tagged release track above.

Tags `v0.5.x` and `v0.6.x` predate the fork and are upstream ViperIDE's release history.

Before release-oriented changes, verify both the root application build and any affected MCP package behavior.
