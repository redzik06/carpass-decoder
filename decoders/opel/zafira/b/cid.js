// Decoder: CID Zafira B (93C66 EEPROM)
// Wyświetlacz zestawu wskaźników - Zafira B

(function () {
    const MODULE_ID = 'cid-zafira-b';
    const MODULE_NAME = 'CID Zafira B';
    const MODULE_HEX = '64 04 00';
    const VIN_PREFIX = 'W0L0AHM';
    const EXPECTED_SIZE = 512;

    const VIN_OFFSET = 0xC1;
    const VIN_LENGTH = 17;

    // PIN CarPass - niskie nibble bajtów (wzorzec wspólny z Vectra C)
    const PIN_OFFSETS = [0x1E3, 0x1E7, 0x1E4, 0x1E8];

    // Metadane (jak Vectra C - standardowy układ)
    const CODE_INDEX_OFFSET = 0x00;
    const CODE_INDEX_LENGTH = 5;
    const HW_OFFSET = 0x18C;   // Hardware Number (BE int32)
    const PART_OFFSET = 0x190; // Part Number (BE int32)
    const IDENT_OFFSET = 0x194;
    const IDENT_LENGTH = 2;
    const DATA_VERSION_OFFSET = 0x196;
    const DATA_VERSION_LENGTH = 4;

    function readPin(data) {
        return PIN_OFFSETS.map(off => data[off] & 0x0F).join('');
    }

    function readAscii(data, offset, length) {
        return String.fromCharCode(...data.slice(offset, offset + length)).trim();
    }

    function readIntBE(data, offset, length) {
        let value = 0;
        for (let i = 0; i < length; i++) {
            value = value * 256 + data[offset + i];
        }
        return value;
    }

    function identify(data) {
        if (data.length !== EXPECTED_SIZE) return false;

        const vinBytes = data.slice(VIN_OFFSET, VIN_OFFSET + VIN_LENGTH);
        const vin = String.fromCharCode(...vinBytes);
        return vin.startsWith(VIN_PREFIX);
    }

    function decode(data) {
        const vin = readAscii(data, VIN_OFFSET, VIN_LENGTH);
        const pin = readPin(data);
        const codeIndex = readAscii(data, CODE_INDEX_OFFSET, CODE_INDEX_LENGTH);
        const hwNumber = readIntBE(data, HW_OFFSET, 4);
        const partNumber = readIntBE(data, PART_OFFSET, 4);
        const ident = readAscii(data, IDENT_OFFSET, IDENT_LENGTH);
        const dataVersion = readAscii(data, DATA_VERSION_OFFSET, DATA_VERSION_LENGTH);

        log(`VIN offset: 0x${VIN_OFFSET.toString(16).toUpperCase()} - 0x${(VIN_OFFSET + VIN_LENGTH - 1).toString(16).toUpperCase()}`);
        log(`VIN: ${vin}`, 'RESULT');
        log(`PIN CarPass: ${pin}`, 'RESULT');
        log(`Code Index: ${codeIndex}`, 'INFO');
        log(`Ident: ${ident}`, 'INFO');
        log(`Part Number: ${partNumber}`, 'INFO');
        log(`Hardware Number: ${hwNumber}`, 'INFO');
        log(`Data Version: ${dataVersion}`, 'INFO');

        return {
            vin,
            pin,
            moduleName: MODULE_NAME,
            moduleId: MODULE_HEX,
            unit: 'Siemens VDO - GID / CID',
            eeprom: '93C66 EEPROM',
            vehicle: 'Zafira B',
            codeIndex,
            ident,
            partNumber: String(partNumber),
            hardwareNumber: String(hwNumber),
            dataVersion,
        };
    }

    window.carpassDecoders = window.carpassDecoders || {};
    window.carpassDecoders[MODULE_ID] = { identify, decode, name: MODULE_NAME };
})();
