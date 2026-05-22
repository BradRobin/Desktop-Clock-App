const defaultSettings = {
    timeFormat: '12h',
    fontFamily: 'Segoe UI',
    fontSize: 72,
    textColor: '#ffffff',
    backgroundColor: '#000000',
    backgroundOpacity: 50,
    alwaysOnTop: true,
    runAtStartup: false,
    lockPosition: false,
    layout: 'horizontal'
};

const inputs = {
    textColor: document.getElementById('textColor'),
    backgroundColor: document.getElementById('backgroundColor'),
    backgroundOpacity: document.getElementById('backgroundOpacity'),
    fontFamily: document.getElementById('fontFamily'),
    fontSize: document.getElementById('fontSize'),
    layout: document.querySelectorAll('input[name="layout"]'),
    alwaysOnTop: document.getElementById('alwaysOnTop'),
    lockPosition: document.getElementById('lockPosition'),
    runAtStartup: document.getElementById('runAtStartup')
};

const valueDisplays = {
    backgroundOpacity: document.getElementById('bgOpacityValue'),
    fontSize: document.getElementById('fontSizeValue')
};

let currentSettings = {};

async function init() {
    currentSettings = await window.api.getSettings();
    populateForm(currentSettings);
    setupListeners();
}

function populateForm(settings) {
    const layoutRadio = Array.from(inputs.layout).find(r => r.value === settings.layout);
    if (layoutRadio) layoutRadio.checked = true;

    inputs.textColor.value = settings.textColor;
    inputs.backgroundColor.value = settings.backgroundColor;
    inputs.backgroundOpacity.value = settings.backgroundOpacity;
    inputs.fontFamily.value = settings.fontFamily;
    inputs.fontSize.value = settings.fontSize;

    inputs.alwaysOnTop.checked = settings.alwaysOnTop;
    inputs.lockPosition.checked = settings.lockPosition;
    inputs.runAtStartup.checked = settings.runAtStartup;

    updateDisplays();
}

function updateDisplays() {
    valueDisplays.backgroundOpacity.textContent = inputs.backgroundOpacity.value;
    valueDisplays.fontSize.textContent = inputs.fontSize.value;
}

function gatherSettings() {
    return {
        textColor: inputs.textColor.value,
        backgroundColor: inputs.backgroundColor.value,
        backgroundOpacity: parseInt(inputs.backgroundOpacity.value, 10),
        fontFamily: inputs.fontFamily.value,
        fontSize: parseInt(inputs.fontSize.value, 10),
        layout: document.querySelector('input[name="layout"]:checked').value,
        alwaysOnTop: inputs.alwaysOnTop.checked,
        lockPosition: inputs.lockPosition.checked,
        runAtStartup: inputs.runAtStartup.checked
    };
}

function saveSettings() {
    const newSettings = gatherSettings();
    window.api.updateSettings(newSettings);
}

function setupListeners() {
    ['change', 'input'].forEach(evt => {
        inputs.textColor.addEventListener(evt, saveSettings);
        inputs.backgroundColor.addEventListener(evt, saveSettings);
        inputs.backgroundOpacity.addEventListener(evt, () => { updateDisplays(); saveSettings(); });
        inputs.fontSize.addEventListener(evt, () => { updateDisplays(); saveSettings(); });
    });

    inputs.fontFamily.addEventListener('change', saveSettings);
    inputs.alwaysOnTop.addEventListener('change', saveSettings);
    inputs.lockPosition.addEventListener('change', saveSettings);
    inputs.runAtStartup.addEventListener('change', saveSettings);

    inputs.layout.forEach(r => r.addEventListener('change', saveSettings));

    document.getElementById('btnReset').addEventListener('click', () => {
        window.api.updateSettings(defaultSettings);
        populateForm(defaultSettings);
    });

    document.getElementById('btnSave').addEventListener('click', () => {
        saveSettings();
        window.close();
    });
}

init();
