# Historia rozmowy - Opel CarPass Decoder

## Sesja 2026-09-02

### 1. Auto-kompaktowanie kontekstu (logów)

**Użytkownik:** "zrób teraz autokompaktowanie kontekstu"

Zmodyfikowano `app.js` - dodano auto-kompaktację logów:
- Max 50 wpisów w panelu logów
- Po przekroczeniu starsze wpisy są usuwane
- Na górze pojawia się licznik: `--- Skompaktowano X starszych wpisów ---`
- "Wyczyść" resetuje licznik

```javascript
// Logging with auto-compaction
const LOG_MAX_ENTRIES = 50;
let logCompactCount = 0;

function log(message, type = 'INFO') {
    const timestamp = new Date().toLocaleTimeString('pl-PL');
    const entry = document.createElement('div');
    entry.textContent = `[${timestamp}] [${type}] ${message}`;
    logOutput.appendChild(entry);

    // Auto-compact when too many entries
    const entries = logOutput.children;
    if (entries.length > LOG_MAX_ENTRIES) {
        const toCompact = entries.length - LOG_MAX_ENTRIES;
        for (let i = 0; i < toCompact; i++) {
            entries[0].remove();
        }
        logCompactCount += toCompact;

        let notice = logOutput.querySelector('.compact-notice');
        if (!notice) {
            notice = document.createElement('div');
            notice.className = 'compact-notice';
            notice.style.cssText = 'color: var(--color-warning); font-style: italic;';
            logOutput.prepend(notice);
        }
        notice.textContent = `--- Skompaktowano ${logCompactCount} starszych wpisów ---`;
    }

    logOutput.scrollTop = logOutput.scrollHeight;
}
```

Zmodyfikowano handler clear:
```javascript
clearBtn.addEventListener('click', () => {
    clearFile();
    decodedCode.textContent = '—';
    logOutput.innerHTML = '';
    logCompactCount = 0;
    log('Wyczyszczono dane wejściowe');
});
```

### 2. Cofnięcie zmian

**Użytkownik:** "cofnij zmiany w plikach"

Przywrócono oryginalny kod:
- `log()` wrócił do prostej wersji bez kompaktacji
- `clearBtn` handler wrócił do oryginału (bez resetowania `logCompactCount` i czyszczenia `logOutput.innerHTML`)

### 3. Podsumowanie postępów

**Użytkownik:** "What did we do so far?"

Otrzymano szczegółowe podsumowanie projektu:
- High-contrast theme: pure black (#000000), white borders, red primary
- Linear scaling: 1920px fixed width, transform: scale()
- Auto-identification system
- First decoder: CID Vectra C (93C66 EEPROM, 512 bytes)
- 31 Opel model directories
- Test file: vectra c display 93c66.BIN → VIN: W0L0ZCF4861135984

### 4. Utworzenie AGENTS.md

**Użytkownik:** "Create or update `AGENTS.md`"

Utworzono `/home/dziupla/Pulpit/testy opencode/AGENTS.md` z instrukcjami dla przyszłych sesji OpenCode:

```markdown
# AGENTS.md

## Project overview
Static HTML/CSS/JS app for decoding Opel CarPass EEPROM dumps.

## Architecture
- carpass-decoder.html — entry point
- app.js — file upload, auto-identify, decode flow
- style.css — high-contrast black theme, linear viewport scaling
- decoders/ — each decoder is a self-registering IIFE

## Decoder pattern
Decoders at decoders/{brand}/{model}/{generation}/{module}.js
- IIFE wrapper
- identify(data) → boolean
- decode(data) → { vin, moduleName, moduleId }
- Register via window.carpassDecoders[id]

## Styling rules
- border-radius always 0 (sharp edges)
- --color-bg: #000000, --color-border: #ffffff
- Page fixed 1920px, JS transform: scale()

## Gotchas
- log(message, type) writes to log panel
- UI is in Polish
```

### 5. Wrzucenie na GitHuba

**Użytkownik:** "na githuba teraz wrzucamy"

Kroki:
1. Zainstalowano GitHub CLI (gh v2.99.0) ręcznie do `~/.local/bin/`
2. Zalogowano tokenem PAT (ukrytym w .gitignore)
3. Utworzono `.gitignore`:
   ```
   .opencode/
   test pliki/
   ```
4. Zainicjalizowano git, dodano pliki
5. Skonfigurowano git user: `redzik06 <redzik06@users.noreply.github.com>`
6. Utworzono commit: "Opel CarPass decoder - initial release"
7. Utworzono repo i wypchnięto:
   ```
   gh repo create carpass-decoder --public --source=. --push
   ```
   **URL:** https://github.com/redzik06/carpass-decoder

## Sesja 2026-09-04

### 6. Odczyt PIN CarPass

**Użytkownik:** zgłosił problem "tylko tam gdzie powinno pokazac pin pokazuje sie vin"

Odkryto i zaimplementowano odczyt PIN CarPass z dumpów:
- PIN to niskie nibble (`& 0x0F`) 4 bajtów w obszarze 0x1E0
- **Standardowy układ** (Vectra C, Zafira B): `PIN = (0x1E3)(0x1E7)(0x1E4)(0x1E8)`
- **Przesunięty układ** (Astra H): `PIN = (0x1E2)(0x1E6)(0x1E5)(0x1E9)`

Źródło algorytmu: gist "Decode Astra H Gid 93c66 eeprom" (PL125).

Zweryfikowano:
- `vectra c cid 93c66 pin 0079.bin` → PIN 0079 ✓
- `astra h cid 93c66.BIN` → PIN 0688 ✓
- `zrestetowany.BIN` → PIN 0688 (ten sam pojazd co astra) ✓
- `se asra h mnire.bin` → PIN 0291
- `vectra c display 93c66.BIN` → PIN 4838

### 7. Pełne metadane (Vectra C)

Użytkownik podał pełne dane dla pliku z PIN 0079:
```
Unit: Siemens VDO - GID / CID
EEPROM: 93C66 EEPROM
Vehicle: Vectra C
Security Code:0079
VIN:W0L0ZCF4861026640
Code Index:01701
Ident: DB
Part Number:24461297
Hardware Number:13128263
```

Wymapowano pola Vectra C:
- Code Index: ASCII na 0x00 (5 bajtów)
- Hardware Number: BE int32 na 0x18C
- Part Number: BE int32 na 0x190
- Ident: ASCII na 0x194 (DB)
- Data Version: ASCII na 0x196 (DBD4)
- VIN: ASCII na 0xC1

### 8. Metadane Astra H (częściowo)

Struktura Astra H jest INNA niż Vectra C. Wyciągnięto co się dało bez referencji:
- Code Index: ASCII na 0x00 (odfiltrowano nie-ASCII, `00021`)
- Serial: ASCII na 0x194 (14 bajtów, `ESES5D021DM1TS`)
- Brak zmapowanych Part/Hardware/Ident (wymagają referencji)

### 9. Zresetowany dump (licznik prób)

`zrestetowany.BIN` to ten sam pojazd co `astra h cid 93c66.BIN` (identyczny VIN), różni się tylko na 0x1E3 — pole licznika pozostałych prób. Obsługa resetu licznika to planowany przyszły krok w dekoderach Astra i Zafira.
