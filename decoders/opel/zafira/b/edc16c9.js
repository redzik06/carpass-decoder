// Decoder: EDC16C9 EEPROM (Zafira B Z19DTH)
// Sterownik silnika Bosch EDC16C9 - Zafira B (1.9 CDTI Z19DT/H)
// UWAGA: plik może być wewnętrznie nazwany "Vectra C", ale VIN W0L0AHM = Zafira B.

(function () {
    const MODULE_ID = 'edc16c9-zafira-b';
    const MODULE_NAME = 'EDC16C9 Zafira B';
    const MODULE_HEX = 'EDC16C9';
    const VIN_PREFIX = 'W0L0AHM';
    const EXPECTED_SIZE = 4096;

    const VIN_OFFSET = 0xC2;
    const VIN_LENGTH = 17;

    // PIN: bajt 0x01 + 4 cyfry ASCII, 3 kopie co 0x40
    const PIN_OFFSET = 0x483;
    const PIN_LENGTH = 4;
    const PIN_COPIES = [0x483, 0x4C3, 0x503];

    // Metadane
    const PART_OFFSET = 0x462;
    const PART_LENGTH = 12;
    const SW_OFFSET = 0x26;
    const SW_LENGTH = 10;
    const SW2_OFFSET = 0x34;
    const SW2_LENGTH = 10;
    const DATE_PROG_OFFSET = 0x12;
    const DATE_LENGTH = 8;
    const DATE1_OFFSET = 0x07;

    function readAscii(data, offset, length) {
        const bytes = data.slice(offset, offset + length);
        const ascii = bytes.filter(b => b >= 0x20 && b < 0x7F);
        return String.fromCharCode(...ascii).trim();
    }

    function readVin(data) {
        return readAscii(data, VIN_OFFSET, VIN_LENGTH);
    }

    function readPin(data) {
        const off = PIN_OFFSET;
        const s = readAscii(data, off, PIN_LENGTH);
        return /^\d{4}$/.test(s) ? s : '';
    }

    function identify(data) {
        if (data.length !== EXPECTED_SIZE) return false;
        const vin = readVin(data);
        return vin.startsWith(VIN_PREFIX);
    }

    function decode(data) {
        const vin = readVin(data);
        const pin = readPin(data);
        const partNumber = readAscii(data, PART_OFFSET, PART_LENGTH);
        const softwareNumber = readAscii(data, SW_OFFSET, SW_LENGTH);
        const softwareVariant = readAscii(data, SW2_OFFSET, SW2_LENGTH);
        const programDate = readAscii(data, DATE_PROG_OFFSET, DATE_LENGTH);
        const releaseDate = readAscii(data, DATE1_OFFSET, DATE_LENGTH);

        log(`Rozpoznano: Bosch EDC16C9 - Zafira B Z19DTH`);
        log(`VIN: ${vin}`, 'RESULT');
        log(`PIN (Security Code): ${pin}`, 'RESULT');
        log(`Part Number: ${partNumber}`, 'INFO');
        log(`Software Number: ${softwareNumber}`, 'INFO');
        log(`Software (drugi): ${softwareVariant}`, 'INFO');
        log(`Data programowania: ${programDate}`, 'INFO');
        log(`Data (nagłówek): ${releaseDate}`, 'INFO');

        return {
            unit: 'Bosch - EDC16C9',
            eeprom: 'EEPROM',
            vehicle: 'Zafira B',
            pin,
            vin,
            partNumber,
            softwareNumber,
            programDate,
            releaseDate,
            moduleName: MODULE_NAME,
            moduleId: MODULE_HEX,
        };
    }

    window.carpassDecoders = window.carpassDecoders || {};
    window.carpassDecoders[MODULE_ID] = { identify, decode, name: MODULE_NAME };
})();
