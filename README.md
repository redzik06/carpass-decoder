<div align="center">

# Opel CarPass Decoder

**PL** | Dekoder zrzutów EEPROM dźwięku / modułów Opel z odczytem kodu CarPass (Security Code)
**EN** | EEPROM decoder for Opel audio / module dumps with CarPass (Security Code) reading

</div>

---

## 📖 Opis projektu / About

**PL:** Aplikacja webowa do dekodowania binarnych zrzutów (dumpów) pamięci EEPROM modułów marki Opel. Po wgraniu pliku automatycznie rozpoznaje moduł, odczytuje numer VIN oraz **kod CarPass (Security Code)**, a także pozwala na wykonanie bezpiecznych operacji na pliku (np. reset licznika prób, wykasowanie PIN).

**EN:** A web app that decodes binary EEPROM dumps of Opel modules. Once a file is loaded, it auto-identifies the module, reads the VIN and the **CarPass (Security Code)**, and lets you perform safe file operations (e.g. reset of the attempt counter, PIN clearing).

---

## ✨ Funkcje / Features

- **Automatyczne rozpoznawanie modułu** / *Automatic module identification*
  - Sprawdzanie rozmiaru pliku (twarda weryfikacja) / *Hard file-size check*
  - Weryfikacja prefixu VIN / markerów / *VIN-prefix / marker verification*
- **Odczyt VIN** / *VIN reading*
- **Odczyt kodu CarPass (Security Code, PIN)** / *CarPass (Security Code, PIN) reading*
- **Odczyt metadanych modułu** / *Module metadata reading*
  - Code Index, Serial, Ident, Part Number, Hardware Number, Data Version
- **Operacje na pliku** / *File operations*
  - Reset licznika prób PIN / *PIN attempt-counter reset*
  - Wykasowanie PIN CarPass / *CarPass PIN clearing*
  - Zmiana VIN z automatycznym przeliczeniem sumy kontrolnej (EDC16) / *VIN change + automatic checksum recalc (EDC16)*
  - Pola na przyszłe funkcje (COMMING SOON) / *Placeholders for future features*
- **Log operacji w czasie rzeczywistym** / *Real-time operation log*
- **Interfejs DarkPan (Bootstrap 5), po polsku** / *DarkPan (Bootstrap 5) UI, in Polish*

---

## 📝 Changelog

> Aktualizowany przy każdej istotnej zmianie (nowe funkcje / znaczące poprawki), z datą i godziną. Najnowsze wpisy na górze.
> *Updated with each significant change (new features / notable fixes), with date and time. Newest entries first.*

| Data i godzina / Date & time | Zmiana / Change |
|---|---|
| **2026-09-05 07:26** | **Dodano sekcję changelog do README** — historia zmian z datą i godziną, aktualizowana przy każdej istotnej zmianie. / *Added a changelog section to the README.* |
| **2026-09-04 16:18** | **EDC16: zmiana VIN z przeliczeniem sumy kontrolnej.** Akcja „Zmień VIN” w dekoderach EDC16C9 (Zafira B) i EDC16C9-39 (Vectra C): nowy VIN wpisywany we wszystkie kopie w EEPROM, a suma kontrolna (checksum) wszystkich pól mapy przeliczana automatycznie. Dodano narzędzie `crc.part1/` (EDC16 CRC Tool + mapy ECU) jako źródło algorytmu. / *VIN change with checksum recalc for EDC16 decoders + CRC tool.* |
| **2026-09-04 15:52** | **Nowe dekodery sterowników silnika Bosch EDC16.** EDC16C9 (Zafira B, Z19DTH, 4096B) oraz EDC16C9-39 (Vectra C, Z19DTH, 8192B): odczyt VIN, PIN (4 bajty ASCII), Part Number, Software Number i dwóch dat. / *New Bosch EDC16 engine-ECU decoders.* |
| **2026-09-04 15:35** | **Dwujęzyczny README (PL/EN)** — opis, funkcje, obsługa, wspierane moduły, struktura projektu. / *Bilingual (PL/EN) README.* |
| **2026-09-04 15:32** | **Menu boczne „Operacje na pliku”.** Akcje na kopii wgrywanego pliku (reset licznika, wykasowanie PIN) + sekcja „Nadchodzące” z 5 pola-mi na przyszłe funkcje. / *Sidebar file-operations menu + „Coming soon” section.* |
| **2026-09-04 15:26** | **Restyle interfejsu na motyw DarkPan** (Bootstrap 5, kolor primary `#EB1616`), skalowanie widoku do rozdzielczości. / *Restyle to the DarkPan admin theme.* |
| **2026-09-04 13:37** | **Licznik nieudanych prób PIN („Nieudane próby”).** Odczyt bajtu `0x1E3` wprost z pliku + przycisk „Pobierz zresetowany dump” dla Astra H / Zafira B (generuje plik bit-identyczny z wzorcowym resetem). / *Remaining-tries counter read + reset download.* |
| **2026-09-04 12:43** | **Dekoder CID Zafira B** — poprawny przesunięty układ PIN (jak Astra H), rozróżnianie Astra H / Zafira B po markerze na `0xC2`. / *CID Zafira B decoder (shifted layout).* |
| **2026-09-04 12:36** | **Odczyt PIN CarPass i pełnych metadanych modułu** (Code Index, Serial, Ident, Part/Hardware Number, Data Version) dla CID Vectra C. / *CarPass PIN + full module-metadata decoding.* |
| **2026-09-03 14:41** | **Wydanie początkowe** — szkielet aplikacji, wgrywanie pliku, auto-identyfikacja, dekoder CID Vectra C. / *Initial release.* |

---

## 🚀 Uruchomienie / How to run

**Wymagania / Requirements:**

- Nowoczesna przeglądarka (Chrome, Firefox, Edge, Safari) / *A modern browser*
- Do uruchomienia nie jest potrzebny żaden serwer ani instalacja / *No server or install required*

**Opcja A — bezpośrednio z dysku / Open directly:**

Plik aplikacji otwiera się bezpośrednio w przeglądarce:

```bash
# Windows
start carpass-decoder.html

# macOS
open carpass-decoder.html

# Linux
xdg-open carpass-decoder.html
```

**Opcja B — przez lokalny serwer (zalecane przy automatycznym odczycie plików) / Via local server (recommended):**

```bash
# Python 3
python3 -m http.server 8000

# następnie otwórz / then open:
# http://localhost:8000/carpass-decoder.html
```

---

## 🧭 Obsługa / Usage

### Krok 1 — Wczytaj plik / Step 1 — Load a file

1. W panelu **„Dane wejściowe"** kliknij obszar pliku lub przeciągnij i upuść plik binarny.
   *(In the **„Input data"** panel, click the upload area or drag & drop a binary file.)*
2. Obsługiwane formaty: `.bin`, `.dat`, `.hex`, `.raw` (oraz dowolny plik binarny).
   *(Supported formats: `.bin`, `.dat`, `.hex`, `.raw` and any other binary file.)*
3. Po wgraniu wyświetli się nazwa pliku oraz jego rozmiar.
   *(The file name and size are shown after loading.)*

### Krok 2 — Dekoduj / Step 2 — Decode

1. Kliknij przycisk **„Dekoduj CarPass"** / *Click the **„Decode CarPass"** button.*
2. Aplikacja automatycznie rozpoznaje moduł i wyświetla wyniki w panelu **„Dane wyjściowe"**:
   *(The app auto-identifies the module and shows results in the **„Output data"** panel:)*

   | Pole / Field | Opis / Description |
   |---|---|
   | **Kod CarPass** | Security Code (PIN) modułu / *module Security Code (PIN)* |
   | **VIN** | Numer nadwozia / *vehicle identification number* |
   | **Unit / EEPROM** | Typ modułu i pamięci / *module & memory type* |
   | **Pojazd / Vehicle** | Model pojazdu / *vehicle model* |
   | **Code Index** | Indeks kodu / *code index* |
   | **Serial / Ident / Part / HW** | Metadane modułu / *module metadata* |
   | **Nieudane próby** | Liczba nieudanych prób programowania PIN (bajt `0x1E3`, wartość wprost z pliku) / *failed PIN programming attempts (byte `0x1E3`, raw value)* |

3. Jeśli moduł nie został rozpoznany, pojawi się komunikat ostrzegawczy.
   *(If the module is not recognized, a warning message appears.)*

### Krok 3 — Operacje na pliku / Step 3 — File operations

Menu boczne **„Operacje na pliku"** (po rozpoznaniu modułu) umożliwia:
*(The sidebar **„File operations"** menu — once a module is recognized — lets you:)*

- **Reset licznika prób** — wyzerowanie licznika nieudanych prób (`0x1E3 = 0x00`) i pobranie zmodyfikowanego pliku. *RESET of the attempt counter and download of the modified file.*
- **Wykasuj PIN CarPass** — wykasowanie kodu PIN z pliku i pobranie czystego dumpu. *Clear the CarPass PIN and download a clean dump.*

> Każda operacja działa na **kopii** wgrywanego pliku — oryginalny plik na dysku pozostaje nietknięty.
> *Each operation works on a **copy** of the loaded file — the original file on disk stays untouched.*

Sekcja **„Nadchodzące" / „Coming soon"** zawiera pola na przyszłe funkcje (m.in. usuwanie błędów DTC, ustawianie przebiegu, wymianę PIN, formatowanie EEPROM, kopię zapasową).

---

## 🛠️ Wspierane moduły / Supported modules

| Moduł / Module | Marka / Brand | Pamięć / Memory | Funkcje / Features |
|---|---|---|---|
| **CID Astra H** | Opel | 93C66 EEPROM | VIN, PIN, Code Index, Serial, reset licznika, wykasuj PIN |
| **CID Zafira B** | Opel | 93C66 EEPROM | VIN, PIN, Code Index, Serial, reset licznika, wykasuj PIN |
| **CID Vectra C / Signum** | Opel | 93C66 EEPROM | VIN, PIN, Code Index, Ident, Part/Hardware Number, Data Version |
| **EDC16C9 — Zafira B (Z19DTH)** | Opel / Bosch | EEPROM (4096B) | VIN, PIN (ASCII), Part Number, Software Number, daty, zmiana VIN + checksum |
| **EDC16C9-39 — Vectra C (Z19DTH)** | Opel / Bosch | EEPROM (8192B) | VIN, PIN (ASCII), Part Number, Software Number, daty, zmiana VIN + checksum |

> ⚠️ Dekodery odczytują dane z pliku **wprost** (zgodnie z ich zawartością). Rozpoznawanie działa tylko dla obsługiwanych modułów i prawidłowych plików.
> *Decoders read data **directly** from the file (as-is). Identification works only for supported modules and correct files.*

---

## 📁 Struktura projektu / Project structure

```
carpass-decoder/
├── carpass-decoder.html      # punkt wejścia / entry point (Bootstrap + DarkPan theme)
├── app.js                    # logika: upload, identyfikacja, dekodowanie, menu, log
├── style.css                 # style motywu DarkPan / DarkPan theme styles
├── css/
│   └── bootstrap.min.css     # Bootstrap 5 (build z kolorem primary #EB1616)
├── decoders/                 # dekodery (samorejestrujące się IIFE)
│   └── opel/
│       ├── astra/h/cid.js    # CID Astra H
│       ├── zafira/b/cid.js   # CID Zafira B
│       ├── zafira/b/edc16c9.js      # EDC16C9 Zafira B (sterownik silnika)
│       ├── vectra/c/cid.js   # CID Vectra C / Signum
│       └── vectra/c/edc16c9-39.js   # EDC16C9-39 Vectra C (sterownik silnika)
├── AGENTS.md                 # notatki techniczne dla agentów / agents' technical notes
└── ROZMOWA.md                # historia sesji roboczych / session log
```

---

## 🧮 Jak działa dekodowanie PIN (CarPass) / How PIN (CarPass) decoding works

PIN CarPass to **niskie nibble** (`& 0x0F`) czterech bajtów w obszarze `0x1E0`. Układ zależy od przesunięcia VIN:
*The CarPass PIN is the **low nibble** (`& 0x0F`) of four bytes in the `0x1E0` area. The layout depends on the VIN shift:*

- **Układ standardowy / Standard layout** (VIN na `0xC1`, np. Vectra C):
  `PIN = (0x1E3)(0x1E7)(0x1E4)(0x1E8)`
- **Układ przesunięty o 1 bajt w lewo / Shifted-left layout** (VIN na `0xC0`, np. Astra H / Zafira B):
  `PIN = (0x1E2)(0x1E6)(0x1E5)(0x1E9)`

Bajt `0x1E3` = liczba nieudanych prób programowania PIN; wyświetlany jest wprost z pliku.
*Byte `0x1E3` = number of failed PIN programming attempts; shown directly from the file.*

---

## 📄 Licencja / License

Projekt edukacyjny / narzędzie diagnostyczne. Używa motywu **DarkPan** (HTML Codex / ThemeWagon) oraz **Bootstrap 5**.
*Educational / diagnostic utility. Uses the **DarkPan** theme (HTML Codex / ThemeWagon) and **Bootstrap 5**.*
