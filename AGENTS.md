# AGENTS.md

## Obowiązki agenta (ZASADY OBOWIĄZKOWE — czytaj jako pierwsze)

Każda zmiana w tym projekcie musi spełniać WSZYSTKIE poniższe obowiązki. Pominięcie któregokolwiek = niedokończona praca.

1. **Changelog w README** — każda nowa funkcja / istotna zmiana (nie poprawka kosmetyczna) = nowy wiersz na GÓRZE tabeli `📝 Changelog` w `README.md`, z **datą i godziną** (`YYYY-MM-DD HH:MM`, weź z `date`), opisem PL + EN.
2. **Nowe pole wyniku** → dodaj je BOTH: w dekoderze (`decode()` zwraca obiekt) ORAZ w szablonie `resultsContent` w `app.js`. Bez tego pole nie wyrenderuje się.
3. **Nowy dekoder** → utwórz `decoders/{brand}/{model}/{generation}/{module}.js` (IIFE) ORAZ dodaj `<script src="...">` w `carpass-decoder.html` po `app.js`. Oba kroki, inaczej dekoder nie działa.
4. **Język UI** — wszystkie widoczne dla użytkownika stringi po POLSKU (nazwy pól, logi, przyciski, komunikaty). Komunikaty błędów = `log(..., 'ERROR')`.
5. **Hard checki** — `identify()`: NAJPIERW rozmiar pliku, potem VIN prefix/markery. Zły rozmiar lub zły VIN prefix = `false`/alert, NIGDY nie dekoduj.
6. **Weryfikacja składni** — po każdej edycji JS uruchom `node --check <plik>` dla WSZYSTKICH zmienionych plików `.js`.
7. **Weryfikacja funkcjonalna** — zmiany dekoderów/akcji testuj na plikach z `test pliki/` (Node dla logiki; dla EDC16 dodatkowo `fixChecksums`/`validateChecksums` → 62/62 lub 35/35 pól OK). Nie zakładaj — sprawdź.
8. **Dokumentacja** — nowe offsety/reguły/algorytmy wpisz do `AGENTS.md`; historię sesji aktualizuj w `ROZMOWA.md`.
9. **Styl** — trzymaj się reguł DarkPan (sekcja „Styling rules"): stała szerokość 1920px + `transform: scale()`, BEZ media queries/breakpointów, zaokrąglone rogi, `css/bootstrap.min.css` = build darkpan (`$primary: #EB1616`), NIE podmieniaj na stockowy Bootstrap.
10. **Brak komentarzy** — nie dodawaj komentarzy w kodzie, chyba że użytkownik o nie poprosi.
11. **Git** — na koniec `git add -A && git commit` (jeśli użytkownik prosi o push: `git push origin master`) i zostaw **czyste drzewo robocze**. Sprawdź `git status`.
12. **README/Funkcje** — gdy zmieniasz konkretną funkcję modułu, zaktualizuj też listę „Features" i tabelę „Wspierane moduły".

Wzorzec dekodera, offsety, algorytmy i struktury EEPROM — poniżej. Ufaj AGENTS.md bardziej niż nazwom plików (np. plik o nazwie „Vectra C" może być naprawdę Zafirą B — decyduje VIN).

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

Pola dodatkowe (istniejące w projekcie):
- `softwareNumber`, `programDate`, `releaseDate` — EDC16 (software number + dwie daty programu)
- `remainingTries` — wartość bajtu `0x1E3` (nieudane próby PIN, tylko Astra/Zafira)
- `reset` — obiekt `{ offsets, value, filename }` dla przycisku „Pobierz zresetowany dump" (Astra/Zafira)
- `actions` — tablica `[{ id, label, filename, apply(copy) }]` do menu „Operacje na pliku"

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

## EDC16 EEPROM (Bosch — sterownik silnika)

Dwa osobne dekodery dla EEPROM-u sterowników silnika Bosch EDC16 (Opel 1.9 CDTI):
- `decoders/opel/zafira/b/edc16c9.js` — **EDC16C9**, Zafira B Z19DTH, EXPECTED_SIZE 4096
- `decoders/opel/vectra/c/edc16c9-39.js` — **EDC16C9-39**, Vectra C Z19DTH, EXPECTED_SIZE 8192

**WAŻNE (identyfikacja):** rozpoznawanie po `identify()` = rozmiar + VIN prefix. VIN Zafiry `W0L0AHM`, Vectry `W0L0ZCF`. Plik może być wewnętrznie mylnie nazwany "Vectra C", ale to VIN decyduje — `W0L0AHM` = Zafira B.

Rozmiary są rozłączne (4096 vs 8192), więc dekodery nie kolidują. **PIN w EDC16 to 4 bajty ASCII** (nie niskie nibble jak w CID!):

**PIN (Security Code) EDC16 — reguła:**
- PIN = 4 bajty **ASCII cyfr** (`'0'`–`'9'`), tuż przed nimi bajt `0x01` (wzorzec `01` + 4 cyfry)
- Występuje w **3 kopiach co 0x40 (64 bajty)** w pliku
- Offsety NIE są stałe między C9 a C9-39:
  - EDC16C9 (Zafira, 4096B): PIN na `0x483/0x4C3/0x503`
  - EDC16C9-39 (Vectra, 8192B): PIN na `0x543/0x583/0x5C3`

**Inne pola (offsety różne między wariantami):**

EDC16C9 Zafira (4096B):
- VIN: ASCII na `0xC2` (czyste, np. `W0L0AHM7562133839`)
- Part Number: ASCII na `0x462` (np. `S001002830`)
- Software Number: ASCII na `0x26` (np. `1037379426`)
- Duplikaty co `0x800` (2 kopie bloku)

EDC16C9-39 Vectra (8192B):
- VIN: ASCII na `0x1A0` (np. `W0L0ZCF3571119743`)
- Part Number: ASCII na `0x607` (np. `CH000010411`)
- Software Number: ASCII na `0x26` (np. `1037386702`)

**Wspólny nagłówek (oba):** Software Number na `0x26`, drugi numer `//` na `0x34`, data na `0x07` i `0x12` (powtórzona na `0x20`).

**C9 vs C9-39 — rozróżnienie:** Part Number (`S00...` Zafira vs `CH...` Vectra) + VIN prefix (`W0L0AHM` vs `W0L0ZCF`).

**Uwaga o HW:** NIE używaj `hardwareNumber` w EDC16 — w samym EEPROM nie ma numeru `0281xxxxxx` (jest w kalibracji/flashu, nie w EEPROM). Użyj `softwareNumber`.

Nowe pola wynikowe (dodane do template `app.js`): `softwareNumber`, `programDate`, `releaseDate`.

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

## Sidebar menu — operacje na pliku

Sidebar (lewe menu) ma sekcję **"Operacje na pliku"** budowaną dynamicznie w `app.js` z pola `actions` wyniku dekodera, oraz sekcję **"Nadchodzące"** z 5 placeholderami `COMMING SOON`.

- Każdy dekoder może zwrócić `actions: [{ id, label, filename, apply(copy) }]` w `decode()`
- `apply(copy)` mutuje kopię `loadedFileData` (Uint8Array) i zwraca komunikat (string) do logu
- `app.js` `populateFileActions(result)` renderuje akcje; kliknięcie kopiuje dane, wywołuje `apply()`, pobiera wynik przez `downloadBin()`
- Gdy brak rozpoznanego modułu / brak akcji — placeholder "Rozpoznaj moduł, aby zobaczyć operacje"
- `showInput()` i `clearBtn` resetują menu przez `populateFileActions(null)`
- `downloadBin(bytes, filename)` — wspólny helper pobierania (używany też przez przycisk reset)
- COMMING SOON: `COMING_SOON_ITEMS` w `app.js` (5 pozycji), klik loguje info

Realne akcje w Astra H / Zafira B:
- `reset-counter` — `apply`: `copy[0x1E3] = 0x00`
- `clear-pin` — `apply`: `PIN_OFFSETS.forEach(o => copy[o] &= 0xF0)` (zeruje niskie nibble PIN)

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

## Zmiana VIN (EDC16) + suma kontrolna

Oba dekodery EDC16 mają akcję `change-vin` w menu (Operacje na pliku). `apply(copy)`:
1. Pobiera nowy VIN przez `window.prompt` (walidacja: 17 znaków, dozwolone `0-9 A-H J-N P-Z`)
2. Wpisuje go we WSZYSTKIE kopie VIN (`writeVin`)
3. Przelicza sumy kontrolne mapy (`fixChecksums`) i pobiera nowy plik

**Algorytm checksum EDC16 (zweryfikowany na plikach testowych):**
```
checksum = (0xFFFF XOR suma[ start .. end-1 ]) - blockNumber    // 16-bit
```
Checksum zapisywany jako 2 bajty big-endian na offsetach `[end]`, `[end+1]`.

Mapy pól pochodzą z narzędzia `crc.part1/edc16_crc_tool.exe` (podkatalog `ecu/`):
- `crc.part1/ecu/Opel edc16c9.txt` — **EDC16C9**, mapa **per blok 2048** (31 par), stosowana do KAŻDEGO bloku (Zafira: 2 bloki → 62 pary). VIN kopie: `0xC2, 0xE2, 0x8C2, 0x8E2`.
- `crc.part1/ecu/Opel edc16c39.txt` — **EDC16C9-39**, mapa **absolutna dla 0x000-0xFFF** (35 par, offsety do 0x93E). VIN kopie: `0x1A0, 0x1C0` (dane tylko w blokach 0-1; bloki 2-3 puste FF).

Uwaga: `chk` pary 4-5 (C9) i 8-9 (C9-39) obejmują VIN — po zmianie VIN przeliczamy wszystkie pary mapy (bezpieczniej). `validateChecksums(copy)` zwraca liczbę poprawnych pól (użyte w komunikacie).
