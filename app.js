// Linear scaling - page looks identical at any viewport size
const DESIGN_WIDTH = 1920;

function applyScale() {
    const scale = window.innerWidth / DESIGN_WIDTH;
    document.body.style.transform = `scale(${scale})`;
    document.body.style.height = `${window.innerHeight / scale}px`;
}

applyScale();
window.addEventListener('resize', applyScale);

// DOM elements
const inputSection = document.getElementById('input-section');
const outputSection = document.getElementById('output-section');
const decodeBtn = document.getElementById('decode-btn');
const clearBtn = document.getElementById('clear-btn');
const backBtn = document.getElementById('back-btn');
const resultsContent = document.getElementById('results-content');
const decodedCode = document.getElementById('decoded-code');
const logOutput = document.getElementById('log-output');
const fileInput = document.getElementById('file-input');
const fileUploadArea = document.getElementById('file-upload-area');
const fileInfo = document.getElementById('file-info');

// File data storage
let loadedFile = null;
let loadedFileData = null;

// File upload handlers
fileInput.addEventListener('change', handleFileSelect);

fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.style.borderColor = 'var(--color-primary)';
});

fileUploadArea.addEventListener('dragleave', () => {
    fileUploadArea.style.borderColor = '';
});

fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.style.borderColor = '';
    if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelect();
    }
});

function handleFileSelect() {
    const file = fileInput.files[0];
    if (!file) return;

    loadedFile = file;
    const reader = new FileReader();

    reader.onload = (e) => {
        loadedFileData = new Uint8Array(e.target.result);
        fileUploadArea.classList.add('has-file');
        fileInfo.innerHTML = `
            <span class="file-name">${escapeHtml(file.name)}</span><br>
            Rozmiar: ${formatBytes(file.size)} (${loadedFileData.length} bajtów)
        `;
        log(`Załadowano plik: ${file.name} (${formatBytes(file.size)})`);
    };

    reader.readAsArrayBuffer(file);
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function clearFile() {
    loadedFile = null;
    loadedFileData = null;
    fileInput.value = '';
    fileUploadArea.classList.remove('has-file');
    fileInfo.innerHTML = '';
}

// Logging
function log(message, type = 'INFO') {
    const timestamp = new Date().toLocaleTimeString('pl-PL');
    const entry = document.createElement('div');
    entry.textContent = `[${timestamp}] [${type}] ${message}`;
    logOutput.appendChild(entry);
    logOutput.scrollTop = logOutput.scrollHeight;
}

// Sidebar navigation
const navInput = document.getElementById('nav-input');
const navOutput = document.getElementById('nav-output');

navInput.addEventListener('click', (e) => { e.preventDefault(); showInput(); });
navOutput.addEventListener('click', (e) => { e.preventDefault(); showOutput(); });

document.querySelector('.sidebar-toggler').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('.sidebar').classList.toggle('open');
    document.querySelector('.content').classList.toggle('open');
});

// View switching
function showOutput() {
    inputSection.style.display = 'none';
    outputSection.classList.add('active');
    navInput.classList.remove('active');
    navOutput.classList.add('active');
}

function showInput() {
    outputSection.classList.remove('active');
    inputSection.style.display = '';
    navOutput.classList.remove('active');
    navInput.classList.add('active');
    populateFileActions(null);
}

backBtn.addEventListener('click', showInput);

// Download helper
function downloadBin(bytes, filename) {
    const blob = new Blob([bytes], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Sidebar menu: file actions + coming soon placeholders
const fileActionsEl = document.getElementById('file-actions');
const comingSoonEl = document.getElementById('coming-soon');

const COMING_SOON_ITEMS = [
    'Usuwanie błędów (DTC)',
    'Ustawienie przebiegu',
    'Wymiana PIN / nowy klucz',
    'Formatowanie EEPROM',
    'Kopia zapasowa (backup)',
];

function buildComingSoon() {
    comingSoonEl.innerHTML = '';
    COMING_SOON_ITEMS.forEach((label) => {
        const a = document.createElement('a');
        a.href = '#';
        a.className = 'nav-item nav-link sidebar-link coming-soon';
        a.innerHTML = `<i class="fa fa-hourglass-half me-2"></i>${escapeHtml(label)}<span class="coming-soon-badge">COMMING SOON</span>`;
        a.addEventListener('click', (e) => {
            e.preventDefault();
            log(`Funkcja "${label}" będzie dostępna wkrótce (COMMING SOON).`, 'INFO');
        });
        comingSoonEl.appendChild(a);
    });
}

function populateFileActions(result) {
    fileActionsEl.innerHTML = '';
    const actions = (result && result.actions) || [];
    if (actions.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'nav-item nav-link sidebar-link';
        empty.style.color = '#3d4050';
        empty.style.cursor = 'default';
        empty.innerHTML = '<i class="fa fa-info-circle me-2"></i>Rozpoznaj moduł, aby zobaczyć operacje';
        fileActionsEl.appendChild(empty);
        return;
    }
    actions.forEach((action) => {
        const a = document.createElement('a');
        a.href = '#';
        a.className = 'nav-item nav-link sidebar-link';
        a.innerHTML = `<i class="fa fa-wrench me-2"></i>${escapeHtml(action.label)}`;
        a.addEventListener('click', (e) => {
            e.preventDefault();
            if (!loadedFileData) {
                log('Brak pliku binarnego do operacji.', 'WARN');
                return;
            }
            const copy = new Uint8Array(loadedFileData);
            const msg = action.apply(copy);
            downloadBin(copy, action.filename);
            log(msg + `, pobrano plik: ${action.filename}`, 'RESULT');
        });
        fileActionsEl.appendChild(a);
    });
}

buildComingSoon();

// Auto-identify and decode
function identifyDecoder(data) {
    const decoders = window.carpassDecoders || {};
    for (const id in decoders) {
        if (decoders[id].identify(data)) {
            return { id, decoder: decoders[id] };
        }
    }
    return null;
}

// Decode button handler
decodeBtn.addEventListener('click', () => {
    if (!loadedFileData) {
        log('Brak pliku binarnego do dekodowania', 'WARN');
        return;
    }

    log('Analiza pliku...');
    const match = identifyDecoder(loadedFileData);

    if (!match) {
        log('Nie rozpoznano modułu. Plik nie pasuje do żadnego dekodera.', 'ERROR');
        alert('Nie rozpoznano modułu!\n\nPlik nie pasuje do żadnego z zarejestrowanych dekoderów.\nSprawdź czy plik jest poprawny.');
        return;
    }

    log(`Rozpoznano moduł: ${match.decoder.name}`);
    const result = match.decoder.decode(loadedFileData);

    populateFileActions(result);

    if (result.pin) {
        decodedCode.textContent = result.pin;
    }

    resultsContent.innerHTML = `
        ${result.unit !== undefined ? `
        <div class="result-item">
            <span class="result-label">Unit</span>
            <span class="result-value">${escapeHtml(result.unit)}</span>
        </div>` : ''}
        ${result.eeprom !== undefined ? `
        <div class="result-item">
            <span class="result-label">EEPROM</span>
            <span class="result-value">${escapeHtml(result.eeprom)}</span>
        </div>` : ''}
        ${result.vehicle !== undefined ? `
        <div class="result-item">
            <span class="result-label">Pojazd</span>
            <span class="result-value">${escapeHtml(result.vehicle)}</span>
        </div>` : ''}
        ${result.pin !== undefined ? `
        <div class="result-item">
            <span class="result-label">Security Code</span>
            <span class="result-value" style="color: var(--color-success);">${escapeHtml(result.pin)}</span>
        </div>` : ''}
        ${result.vin !== undefined ? `
        <div class="result-item">
            <span class="result-label">VIN</span>
            <span class="result-value" style="color: var(--color-success);">${escapeHtml(result.vin)}</span>
        </div>` : ''}
        ${result.codeIndex !== undefined ? `
        <div class="result-item">
            <span class="result-label">Code Index</span>
            <span class="result-value">${escapeHtml(result.codeIndex)}</span>
        </div>` : ''}
        ${result.ident !== undefined ? `
        <div class="result-item">
            <span class="result-label">Ident</span>
            <span class="result-value">${escapeHtml(result.ident)}</span>
        </div>` : ''}
        ${result.partNumber !== undefined ? `
        <div class="result-item">
            <span class="result-label">Part Number</span>
            <span class="result-value">${escapeHtml(result.partNumber)}</span>
        </div>` : ''}
        ${result.hardwareNumber !== undefined ? `
        <div class="result-item">
            <span class="result-label">Hardware Number</span>
            <span class="result-value">${escapeHtml(result.hardwareNumber)}</span>
        </div>` : ''}
        ${result.softwareNumber !== undefined ? `
        <div class="result-item">
            <span class="result-label">Software Number</span>
            <span class="result-value">${escapeHtml(result.softwareNumber)}</span>
        </div>` : ''}
        ${result.programDate !== undefined ? `
        <div class="result-item">
            <span class="result-label">Data programowania</span>
            <span class="result-value">${escapeHtml(result.programDate)}</span>
        </div>` : ''}
        ${result.releaseDate !== undefined ? `
        <div class="result-item">
            <span class="result-label">Data (nagłówek)</span>
            <span class="result-value">${escapeHtml(result.releaseDate)}</span>
        </div>` : ''}
        ${result.serial !== undefined ? `
        <div class="result-item">
            <span class="result-label">Serial</span>
            <span class="result-value">${escapeHtml(result.serial)}</span>
        </div>` : ''}
        ${result.remainingTries !== undefined ? `
        <div class="result-item">
            <span class="result-label">Nieudane próby</span>
            <span class="result-value">${escapeHtml(result.remainingTries)}</span>
        </div>` : ''}
        ${result.reset !== undefined ? `
        <div class="result-item" style="flex-direction: column; align-items: stretch; gap: 6px;">
            <span class="result-label">Reset licznika prób</span>
            <button id="reset-counter-btn" class="reset-btn">Pobierz zresetowany dump</button>
        </div>` : ''}
        <div class="result-item">
            <span class="result-label">Moduł</span>
            <span class="result-value">${escapeHtml(result.moduleName)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">ID</span>
            <span class="result-value">${escapeHtml(result.moduleId)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Plik</span>
            <span class="result-value">${escapeHtml(loadedFile.name)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Rozmiar</span>
            <span class="result-value">${loadedFileData.length} bajtów</span>
        </div>
    `;

    showOutput();

    const resetBtn = document.getElementById('reset-counter-btn');
    if (resetBtn && result.reset) {
        resetBtn.addEventListener('click', () => {
            const copy = new Uint8Array(loadedFileData);
            result.reset.offsets.forEach(off => { copy[off] = result.reset.value; });
            downloadBin(copy, result.reset.filename);
            log(`Zresetowano licznik prób, pobrano plik: ${result.reset.filename}`, 'RESULT');
        });
    }
});

// Clear button handler
clearBtn.addEventListener('click', () => {
    clearFile();
    decodedCode.textContent = '—';
    populateFileActions(null);
    log('Wyczyszczono dane wejściowe');
});

// HTML escape helper
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
