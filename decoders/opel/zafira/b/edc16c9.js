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

    // Wszystkie kopie VIN w pliku (2 identyczne bloki 2048 × 2 kopie = 4)
    const VIN_COPIES = [0xC2, 0xE2, 0x8C2, 0x8E2];

    // Mapa checksum EDC16C9 (per blok 2048, stosowana do bloku 0 i bloku 1).
    // checksum = (0xFFFF XOR suma[start..end-1]) - blockNumber, zapisany jako 2 bajty BE na [end].
    const CHK_STARTS = [0x0,0x40,0x80,0xa0,0xc0,0xe0,0x100,0x120,0x1a0,0x270,0x350,0x3f0,0x450,0x480,0x4c0,0x500,0x540,0x560,0x580,0x5a0,0x5e0,0x620,0x640,0x660,0x680,0x6a0,0x6e0,0x700,0x720,0x7c0,0x7e0];
    const CHK_ENDS   = [0x3e,0x7e,0x9e,0xbe,0xde,0xfe,0x11e,0x19e,0x260,0x340,0x3e2,0x448,0x47e,0x4be,0x4fe,0x53e,0x55e,0x57e,0x59e,0x5de,0x61e,0x63e,0x65e,0x67e,0x69e,0x6de,0x6fe,0x71e,0x7be,0x7de,0x7fe];
    const CHK_BLOCKS = [0,1,2,2,3,3,4,5,6,7,8,9,10,11,11,11,12,12,12,13,13,14,14,15,15,16,17,18,19,20,21];
    const BLOCK_SIZE = 0x800;

    function writeVin(data, vin) {
        const bytes = new Uint8Array(17);
        for (let i = 0; i < 17; i++) bytes[i] = vin.charCodeAt(i);
        for (const off of VIN_COPIES) data.set(bytes, off);
    }

    function fixChecksums(data) {
        for (let block = 0; block < data.length / BLOCK_SIZE; block++) {
            const base = block * BLOCK_SIZE;
            for (let i = 0; i < CHK_STARTS.length; i++) {
                const s = CHK_STARTS[i], e = CHK_ENDS[i], b = CHK_BLOCKS[i];
                let sum = 0;
                for (let j = base + s; j < base + e; j++) sum = (sum + data[j]) & 0xFFFF;
                const calc = ((0xFFFF ^ sum) - b) & 0xFFFF;
                data[base + e] = (calc >> 8) & 0xFF;
                data[base + e + 1] = calc & 0xFF;
            }
        }
    }

    function validateChecksums(data) {
        let ok = 0;
        for (let block = 0; block < data.length / BLOCK_SIZE; block++) {
            const base = block * BLOCK_SIZE;
            for (let i = 0; i < CHK_STARTS.length; i++) {
                const s = CHK_STARTS[i], e = CHK_ENDS[i], b = CHK_BLOCKS[i];
                let sum = 0;
                for (let j = base + s; j < base + e; j++) sum = (sum + data[j]) & 0xFFFF;
                const calc = ((0xFFFF ^ sum) - b) & 0xFFFF;
                const stored = (data[base + e] << 8) | data[base + e + 1];
                if (calc === stored) ok++;
            }
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
            actions: [
                {
                    id: 'change-vin',
                    label: 'Zmień VIN',
                    filename: `zafira-b-new-vin.bin`,
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
