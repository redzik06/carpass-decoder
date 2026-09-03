# AGENTS.md

## Project overview

Static HTML/CSS/JS app for decoding Opel CarPass EEPROM dumps. No build step, no bundler, no tests. Open `carpass-decoder.html` directly or via any static server.

## Architecture

- `carpass-decoder.html` — entry point, loads `app.js` then decoder scripts
- `app.js` — file upload, auto-identify, decode flow, view switching, scaling
- `style.css` — high-contrast black theme, linear viewport scaling
- `decoders/` — each decoder is a self-registering IIFE

## Decoder pattern

Decoders live at `decoders/{brand}/{model}/{generation}/{module}.js`. Each must:
1. Be wrapped in an IIFE
2. Export `identify(data)` → boolean (check file size first, then VIN/magic bytes)
3. Export `decode(data)` → `{ vin, moduleName, moduleId }` (call `log()` for output)
4. Register via `window.carpassDecoders[id] = { identify, decode, name }`

File size is a **hard check** — wrong size = immediately return false from `identify()`.
VIN prefix is a **hard check** — mismatch = don't decode, only alert.

## Styling rules (non-obvious)

- `border-radius` is always `0` — all sharp edges, no rounded corners
- `--color-bg: #000000` (pure black), `--color-border: #ffffff` (white)
- `--color-primary: #ff0000`, `--color-success: #00ff00`
- Page is fixed at `width: 1920px` and uses JS `transform: scale()` to fit any viewport — never add responsive breakpoints or media queries
- Both panels must always fill full viewport height (they're `flex: 1`)

## Adding a new decoder

1. Create `decoders/{brand}/{model}/{generation}/{module}.js`
2. Follow the CID Vectra C decoder as template (`decoders/opel/vectra/c/cid.js`)
3. Add `<script src="..."></script>` tag in `carpass-decoder.html` (after `app.js`)

## Gotchas

- `log(message, type)` writes to the log panel; types: `INFO`, `WARN`, `ERROR`, `RESULT`
- Decoders call `log()` during decode — it depends on DOM being ready
- `window.carpassDecoders` must be initialized before decoders load (app.js handles this implicitly since it runs first)
- UI is in Polish — keep all user-facing strings in Polish
