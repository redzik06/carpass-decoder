// Decoder: EDC16C9-39 EEPROM (Vectra C Z19DTH)
// Sterownik silnika Bosch EDC16C9-39 - Vectra C (1.9 CDTI Z19DT/H)
// Wariant C9-39 rozpoznawany po VIN W0L0ZCF oraz Part Number CH...

(function () {
    const MODULE_ID = 'edc16c9-39-vectra-c';
    const MODULE_NAME = 'EDC16C9-39 Vectra C';
    const MODULE_HEX = 'EDC16C9-39';
    const VIN_PREFIX = 'W0L0ZCF';
    const EXPECTED_SIZE = 8192;

    const VIN_OFFSET = 0x1A0;
    const VIN_LENGTH = 17;

    // PIN: bajt 0x01 + 4 cyfry ASCII, 3 kopie co 0x40
    const PIN_OFFSET = 0x543;
    const PIN_LENGTH = 4;
    const PIN_COPIES = [0x543, 0x583, 0x5C3];

    // Metadane
    const PART_OFFSET = 0x607;
    const PART_LENGTH = 13;
    const SW_OFFSET = 0x26;
    const SW_LENGTH = 10;
    const SW2_OFFSET = 0x34;
    const SW2_LENGTH = 10;
    const DATE_PROG_OFFSET = 0x12;
    const DATE_LENGTH = 8;
    const DATE1_OFFSET = 0x07;

    // Wszystkie kopie VIN w pliku (tylko blok 0: 0x1A0 i 0x1C0)
    const VIN_COPIES = [0x1A0, 0x1C0];

    // Mapa checksum EDC16C9-39 (absolutne offsety dla 0x000-0xFFF, 35 par).
    // checksum = (0xFFFF XOR suma[start..end-1]) - blockNumber, zapisany jako 2 bajty BE na [end].
    const CHK_STARTS = [0x0,0x40,0x60,0xc0,0x120,0x140,0x160,0x180,0x1a0,0x1c0,0x1e0,0x200,0x280,0x350,0x430,0x4e0,0x540,0x580,0x5c0,0x600,0x620,0x640,0x660,0x6a0,0x6e0,0x700,0x720,0x740,0x760,0x7c0,0x820,0x840,0x860,0x900,0x920];
    const CHK_ENDS   = [0x3e,0x5e,0xbe,0x11e,0x13e,0x15e,0x17e,0x19e,0x1be,0x1de,0x1fe,0x27e,0x340,0x420,0x4de,0x539,0x57e,0x5be,0x5fe,0x61e,0x63e,0x65e,0x69e,0x6de,0x6fe,0x71e,0x73e,0x75e,0x7be,0x81e,0x83e,0x85e,0x8fe,0x91e,0x93e];
    const CHK_BLOCKS = [0,1,2,2,3,3,4,5,6,6,7,8,9,10,11,12,13,13,13,14,14,14,15,15,16,16,17,17,18,18,19,20,21,22,23];

    function writeVin(data, vin) {
        const bytes = new Uint8Array(17);
        for (let i = 0; i < 17; i++) bytes[i] = vin.charCodeAt(i);
        for (const off of VIN_COPIES) data.set(bytes, off);
    }

    function fixChecksums(data) {
        for (let i = 0; i < CHK_STARTS.length; i++) {
            const s = CHK_STARTS[i], e = CHK_ENDS[i], b = CHK_BLOCKS[i];
            let sum = 0;
            for (let j = s; j < e; j++) sum = (sum + data[j]) & 0xFFFF;
            const calc = ((0xFFFF ^ sum) - b) & 0xFFFF;
            data[e] = (calc >> 8) & 0xFF;
            data[e + 1] = calc & 0xFF;
        }
    }

    function validateChecksums(data) {
        let ok = 0;
        for (let i = 0; i < CHK_STARTS.length; i++) {
            const s = CHK_STARTS[i], e = CHK_ENDS[i], b = CHK_BLOCKS[i];
            let sum = 0;
            for (let j = s; j < e; j++) sum = (sum + data[j]) & 0xFFFF;
            const calc = ((0xFFFF ^ sum) - b) & 0xFFFF;
            const stored = (data[e] << 8) | data[e + 1];
            if (calc === stored) ok++;
        }
        return ok;
    }

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

        log(`Rozpoznano: Bosch EDC16C9-39 - Vectra C Z19DTH`);
        log(`VIN: ${vin}`, 'RESULT');
        log(`PIN (Security Code): ${pin}`, 'RESULT');
        log(`Part Number: ${partNumber}`, 'INFO');
        log(`Software Number: ${softwareNumber}`, 'INFO');
        log(`Software (drugi): ${softwareVariant}`, 'INFO');
        log(`Data programowania: ${programDate}`, 'INFO');
        log(`Data (nagłówek): ${releaseDate}`, 'INFO');

        return {
            unit: 'Bosch - EDC16C9-39',
            eeprom: 'EEPROM',
            vehicle: 'Vectra C',
            pin,
            vin,
            partNumber,
            softwareNumber,
            programDate,
            releaseDate,
            moduleName: MODULE_NAME,
            moduleId: MODULE_HEX,
            actions: [
                {
                    id: 'change-vin',
                    label: 'Zmień VIN',
                    filename: `vectra-c-new-vin.bin`,
                    apply(copy) {
                        const newVin = window.prompt('Podaj nowy VIN (17 znaków):', vin);
                        if (!newVin) return 'Anulowano zmianę VIN';
                        const v = newVin.trim().toUpperCase();
                        if (v.length !== 17 || !/^[A-HJ-NPR-Z0-9]{17}$/.test(v)) {
                            return 'BŁĄD: VIN musi mieć dokładnie 17 znaków (0-9, A-H J-N P-Z)';
                        }
                        writeVin(copy, v);
                        fixChecksums(copy);
                        return `Zmieniono VIN na ${v} + przeliczono sumę kontrolną (${validateChecksums(copy)} pól)`;
                    },
                },
            ],
        };
    }

    window.carpassDecoders = window.carpassDecoders || {};
    window.carpassDecoders[MODULE_ID] = { identify, decode, name: MODULE_NAME };
})();
