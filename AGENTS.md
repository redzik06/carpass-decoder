# AGENTS.md

## Project overview

Static HTML/CSS/JS app for decoding Opel CarPass EEPROM dumps. No build step, no bundler, no tests. Open `carpass-decoder.html` directly or via any static server.

## Architecture

- `carpass-decoder.html` — entry point, loads `app.js` then decoder scripts
- `app.js` — file upload, auto-identify, decode flow, view switching, sidebar toggle, scaling
- `style.css` — DarkPan admin theme (sidebar + navbar + cards), linear viewport scaling
- `css/bootstrap.min.css` — Bootstrap 5 themed red (`$primary: #EB1616`, copied from darkpan)
- `decoders/` — each decoder is a self-registering IIFE

## Decoder pattern

Decoders live at `decoders/{brand}/{model}/{generation}/{module}.js`. Each must:
1. Be wrapped in an IIFE
2. Export `identify(data)` → boolean (check file size first, then VIN/magic bytes)
3. Export `decode(data)` → `{ vin, pin, moduleName, moduleId, ...metadata }` (call `log()` for output)
4. Register via `window.carpassDecoders[id] = { identify, decode, name }`

File size is a **hard check** — wrong size = immediately return false from `identify()`.
VIN prefix is a **hard check** — mismatch = don't decode, only alert.

## Result object & UI fields

`decode()` returns an object whose fields are auto-rendered by `app.js` into the results list. Each decoder should return only the fields it can decode:

- `unit`, `eeprom`, `vehicle` — static strings (e.g. Siemens VDO - GID / CID, 93C66 EEPROM)
- `pin` — Security Code CarPass
- `vin`
- `codeIndex`
- `ident`
- `partNumber`
- `hardwareNumber`
- `serial`
- `moduleName`, `moduleId`

`app.js` renders each known field as a `<div class="result-item">` row. Add any new output field to both the decoder and the `resultsContent` template in `app.js`.

## PIN CarPass decoding

PIN (4-cyfrowy kod CarPass) to niskie nibble (`& 0x0F`) czterech bajtów w obszarze 0x1E0. Układ zależy od tego, czy VIN jest przesunięty:

- **Standardowy układ** (VIN czysty ASCII na 0xC1, np. Vectra C, Zafira B):
  `PIN = (0x1E3)(0x1E7)(0x1E4)(0x1E8)`
- **Przesunięty układ o 1 bajt w lewo** (VIN na 0xC0 z wstawionym 0x00, np. Astra H):
  `PIN = (0x1E2)(0x1E6)(0x1E5)(0x1E9)`

## Vectra C / Zafira B metadata (standard UKŁAD)

- Code Index: ASCII na 0x00 (5 bajtów, np. `01701`)
- Hardware Number: BE int32 na 0x18C
- Part Number: BE int32 na 0x190
- Ident: ASCII na 0x194 (2 bajty, np. `DB`)
- Data Version: ASCII na 0x196 (np. `DBD4`)
- VIN: czysty ASCII na 0xC1

## Astra H CID specific structure

VIN zaczyna się na 0xC0 z `0x00` po 'W', a prawdziwy VIN odtwarza się z prefixu `W0L0AHL` + 10 cyfr z 0xC8 (marker rozpoznawczy `L0A0LH` na 0xC2). Metadane Astra H są INNE niż Vectra:

- Code Index: ASCII na 0x00 (odfiltrowane nie-ASCII, np. `00021`)
- Serial: ASCII na 0x194 (14 bajtów, np. `ESES5D021DM1TS`)
- **Brak** zmapowanych pól Ident / Part Number / Hardware Number — wymagają referencji (jak dla Vectra) do zmapowania.

## Zafira B (przesunięty układ, jak Astra H)

Zafira B używa **tej samej struktury co Astra H** (przesunięty VIN na 0xC0), różni się tylko prefixem VIN `W0L0AHM` (Astra H: `W0L0AHL`). Rozróżnienie w `identify()` opiera się na markerze na 0xC2 (6 bajtów):
- Astra H: marker `L0A0LH` (litera `L` na 0xC6)
- Zafira B: marker `L0A0MH` (litera `M` na 0xC6)

VIN Zafiry: `W0L0AHM` + 10 cyfr/znaków z 0xC8 (np. `W0L0AHM5725025704`). PIN CarPass: jak Astra H, `(0x1E2)(0x1E6)(0x1E5)(0x1E9)` (zweryfikowano: `zafira b cid pin 8838 93C66.bin` → PIN `8838`). Code Index i Serial — jak Astra H.

## Zresetowany dump (licznik prób / nieudane próby)

Bajt **0x1E3** = liczba nieudanych prób programowania PIN. Aplikacja **odczytuje i wyświetla wartość wprost z wgrywanego pliku** (bez żadnego twardego mapowania — działa dla dowolnego pliku). Etykieta w UI: **"Nieudane próby"**.

Przykład z forum (Shooting): "PIN 0688 and here is reset, it was down to 5 tries remaining" — plik resetu `zrestetowany.BIN` ma `0x1E3=0x00`.

Testowe pliki resetu (ten sam pojazd co `astra h cid 93c66.BIN`):
- `zrestetowany.BIN` — różni się od Astry tylko na 0x1E3 (`0x05` → `0x00`), 0x1E8 pozostał `0x05`
- `zresetowany 10.BIN` — dodatkowo zeruje 0x1E8 oraz kasuje część bajtów PIN regionu na 0xFF (wykasowany PIN)

Uwaga: se pliki z `0x1E3=0x00` (np. `zafira b cid pin 8838 93C66.bin`) pokazują 0 — to zgodne z ich zawartością (nazwa "10" w `zresetowany 10.BIN` to tylko nazwa pliku, wartość bajta to 0).

Dekodery Astra H i Zafira B mają funkcję **reset licznika prób**:
- zwracają `remainingTries` (wartość 0x1E3) i `reset: { offsets, value, filename }`
- `app.js` renderuje przycisk "Pobierz zresetowany dump", który kopiuje `loadedFileData`, zeruje pole z `reset.offsets` (0x1E3 na 0x00) i pobiera zmodyfikowany plik
- Wygenerowany plik jest bit-identyczny z wzorcowym `zrestetowany.BIN` (zweryfikowane)
- Vectra C NIE ma tego pola (brak takiego licznika) — reset tylko w Astra/Zafira

Nowe pola w wyniku dekodera: `remainingTries`, `reset` (obiekt). Dodawane do dekoderów Astra/Zafira i renderowane w `app.js`.

## Styling rules (non-obvious)

UI follows the **DarkPan** Bootstrap 5 admin template (sidebar + navbar + content cards). Theme vars in `style.css` `:root`:
- `--primary: #EB1616`, `--secondary: #191C24`, `--light: #6C7293`, `--dark: #000000`
- `--color-primary: #EB1616`, `--color-success: #00ff00` (aliases used by `app.js` inline styles)

- `bootstrap.min.css` in `css/` is the darkpan build with `$primary: #EB1616` baked in — `.btn-primary`, `.text-primary` are already red; keep it, don't replace with stock Bootstrap
- DarkPan uses **rounded** corners (cards/buttons) — modern look; do NOT force `border-radius: 0`
- Page is fixed at `width: 1920px` and uses JS `transform: scale()` to fit any viewport — never add responsive breakpoints or media queries
- Sidebar is `250px`, content fills the rest (`1670px`); `.content.open` expands to `1920px` when `.sidebar.open`
- Both panels/cards must always fill full viewport height (they're `flex: 1`)
- Font Awesome 5 icons via CDN for sidebar/navbar icons

## Adding a new decoder

1. Create `decoders/{brand}/{model}/{generation}/{module}.js`
2. Follow the CID Vectra C decoder as template (`decoders/opel/vectra/c/cid.js`)
3. Add `<script src="..."></script>` tag in `carpass-decoder.html` (after `app.js`)

Examples of added decoders:
- `decoders/opel/astra/h/cid.js` — CID Astra H (VIN_PREFIX = `W0L0AHL`)
- `decoders/opel/zafira/b/cid.js` — CID Zafira B (VIN_PREFIX = `W0L0AHM`)

Common checks:
- EXPECTED_SIZE: 512
- VIN_OFFSET: 0xC1
- VIN_LENGTH: 17

## Gotchas

- `log(message, type)` writes to the log panel; types: `INFO`, `WARN`, `ERROR`, `RESULT`
- Decoders call `log()` during decode — it depends on DOM being ready
- `window.carpassDecoders` must be initialized before decoders load (app.js handles this implicitly since it runs first)
- UI is in Polish — keep all user-facing strings in Polish
