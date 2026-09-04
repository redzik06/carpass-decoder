// Decoder: CID Zafira B (93C66 EEPROM)
// Wyświetlacz zestawu wskaźników - Zafira B
// UWAGA: Zafira B używa tej samej struktury co Astra H (przesunięty VIN na 0xC0).
// Różnica to tylko prefix VIN: W0L0AHM (Astra H: W0L0AHL).

(function () {
    const MODULE_ID = 'cid-zafira-b';
    const MODULE_NAME = 'CID Zafira B';
    const MODULE_HEX = '64 04 00';
    const VIN_PREFIX = 'W0L0AHM';
    const EXPECTED_SIZE = 512;

    // Marker specyficzny dla Zafira B w dumpie (przesunięte VDS)
    // Zafira B: L0A0MH na 0xC2 (Astra H ma L0A0LH - to je odróżnia)
    const VDS_MARKER = 'L0A0MH';
    const VDS_OFFSET = 0xC2;
    const VDS_LENGTH = 6;

    // Ostatnie 10 znaków VIN (cyfry) czytane z dumpu
    const DIGITS_OFFSET = 0xC8;
    const DIGITS_LENGTH = 10;

    // PIN CarPass - niskie nibble bajtów (wzorzec jak Astra H, przesunięty)
    const PIN_OFFSETS = [0x1E2, 0x1E6, 0x1E5, 0x1E9];

    // Licznik prób PIN - bajt 0x1E3 odczytywany i wyświetlany wprost z pliku.
    // Reset (przycisk) zeruje to pole do 0x00, jak wzorzec zrestetowany.BIN.
    const TRY_COUNTER_OFFSETS = [0x1E3];
    const TRY_COUNTER_RESET = 0x00;

    // Metadane
    const CODE_INDEX_OFFSET = 0x00;
    const CODE_INDEX_LENGTH = 6;
    const SERIAL_OFFSET = 0x194;
    const SERIAL_LENGTH = 14;

    function readDigits(data) {
        const bytes = data.slice(DIGITS_OFFSET, DIGITS_OFFSET + DIGITS_LENGTH);
        return String.fromCharCode(...bytes);
    }

    function readVin(data) {
        return VIN_PREFIX + readDigits(data);
    }

    function readPin(data) {
        return PIN_OFFSETS.map(off => data[off] & 0x0F).join('');
    }

    function readAscii(data, offset, length) {
        return String.fromCharCode(...data.slice(offset, offset + length)).trim();
    }

    function readCodeIndex(data) {
        const bytes = data.slice(CODE_INDEX_OFFSET, CODE_INDEX_OFFSET + CODE_INDEX_LENGTH);
        const ascii = bytes.filter(b => b >= 0x20 && b < 0x7F);
        return ascii.length ? String.fromCharCode(...ascii) : '';
    }

    function identify(data) {
        if (data.length !== EXPECTED_SIZE) return false;

        // Marker w dumpie odróżnia Zafirę B (L0A0MH) od Astry H (L0A0LH)
        const marker = String.fromCharCode(...data.slice(VDS_OFFSET, VDS_OFFSET + VDS_LENGTH));
        return marker === VDS_MARKER;
    }

    function decode(data) {
        const vin = readVin(data);
        const pin = readPin(data);
        const codeIndex = readCodeIndex(data);
        const serial = readAscii(data, SERIAL_OFFSET, SERIAL_LENGTH);
        const remainingTries = data[TRY_COUNTER_OFFSETS[0]];

        log(`VIN prefix ${VIN_PREFIX} podmieniony (uszkodzony początek w dumpie)`);
        log(`VIN: ${vin}`, 'RESULT');
        log(`PIN CarPass: ${pin}`, 'RESULT');
        log(`Code Index: ${codeIndex}`, 'INFO');
        log(`Serial: ${serial}`, 'INFO');
        log(`Pozostałe próby: ${remainingTries}`, 'INFO');
        if (TRY_COUNTER_OFFSETS.length > 1) {
            log(`Pozostałe próby (2. pole): ${data[TRY_COUNTER_OFFSETS[1]]}`, 'INFO');
        }

        return {
            vin,
            pin,
            moduleName: MODULE_NAME,
            moduleId: MODULE_HEX,
            unit: 'Siemens VDO - GID / CID',
            eeprom: '93C66 EEPROM',
            vehicle: 'Zafira B',
            codeIndex,
            serial,
            remainingTries: String(remainingTries),
            reset: {
                offsets: TRY_COUNTER_OFFSETS,
                value: TRY_COUNTER_RESET,
                filename: `zafira-b-${pin}-reset.bin`,
            },
        };
    }

    window.carpassDecoders = window.carpassDecoders || {};
    window.carpassDecoders[MODULE_ID] = { identify, decode, name: MODULE_NAME };
})();
