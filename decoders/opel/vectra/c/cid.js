// Decoder: CID Vectra C (93C66 EEPROM)
// Wyświetlacz zestawu wskaźników - Vectra C / Signum

(function () {
    const MODULE_ID = 'cid-vectra-c';
    const MODULE_NAME = 'CID Vectra C';
    const MODULE_HEX = '64 04 00';
    const VIN_PREFIX = 'W0L0ZCF';
    const EXPECTED_SIZE = 512;

    const VIN_OFFSET = 0xC1;
    const VIN_LENGTH = 17;

    function identify(data) {
        if (data.length !== EXPECTED_SIZE) return false;

        const vinBytes = data.slice(VIN_OFFSET, VIN_OFFSET + VIN_LENGTH);
        const vin = String.fromCharCode(...vinBytes);
        return vin.startsWith(VIN_PREFIX);
    }

    function decode(data) {
        const vinBytes = data.slice(VIN_OFFSET, VIN_OFFSET + VIN_LENGTH);
        const vin = String.fromCharCode(...vinBytes);

        log(`VIN offset: 0x${VIN_OFFSET.toString(16).toUpperCase()} - 0x${(VIN_OFFSET + VIN_LENGTH - 1).toString(16).toUpperCase()}`);
        log(`VIN: ${vin}`, 'RESULT');

        return { vin, moduleName: MODULE_NAME, moduleId: MODULE_HEX };
    }

    window.carpassDecoders = window.carpassDecoders || {};
    window.carpassDecoders[MODULE_ID] = { identify, decode, name: MODULE_NAME };
})();
