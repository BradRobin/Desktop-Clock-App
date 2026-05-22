const timeDisplay = document.getElementById('time-display');
const container = document.getElementById('clock-container');
const optionsMenu = document.getElementById('options-menu');
const modeButtons = optionsMenu.querySelectorAll('.options-menu-item');
const stopwatchPanel = document.getElementById('stopwatch-panel');
const btnPlay = document.getElementById('btn-play');
const btnPause = document.getElementById('btn-pause');
const btnRecord = document.getElementById('btn-record');
const lapList = document.getElementById('lap-list');
const btnClose = document.getElementById('btn-close');

const TIME_UNITS = ['hours', 'minutes', 'seconds'];
const FLASH_CLASS = 'flash';

let timeUnits = null;
let lastTimeParts = { hours: '', minutes: '', seconds: '' };

let settings = {};
let mode = 'clock';
let clockIntervalId = null;
let stopwatchIntervalId = null;
let stopwatchAccumulated = 0;
let stopwatchRunStart = null;
let lapCount = 0;

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
}

function padTwo(n) {
    return n.toString().padStart(2, '0');
}

function initTimeDisplay() {
    timeDisplay.innerHTML = '';
    timeUnits = {};

    TIME_UNITS.forEach((unit, index) => {
        if (index > 0) {
            const separator = document.createElement('span');
            separator.className = 'time-separator';
            separator.textContent = ':';
            separator.setAttribute('aria-hidden', 'true');
            timeDisplay.appendChild(separator);
        }

        const unitEl = document.createElement('span');
        unitEl.className = 'time-unit';
        unitEl.dataset.unit = unit;

        const digits = [
            document.createElement('span'),
            document.createElement('span'),
        ];
        digits.forEach((digitEl) => {
            digitEl.className = 'digit';
            digitEl.dataset.value = '0';

            const glyph = document.createElement('span');
            glyph.className = 'digit-glyph';
            glyph.textContent = '0';
            digitEl.appendChild(glyph);

            unitEl.appendChild(digitEl);
        });

        timeDisplay.appendChild(unitEl);
        timeUnits[unit] = { el: unitEl, digits };
    });
}

function flashDigit(digitEl) {
    digitEl.classList.remove(FLASH_CLASS);
    void digitEl.offsetWidth;
    digitEl.classList.add(FLASH_CLASS);
}

function setUnitDigits(unit, value, shouldFlash) {
    const str = padTwo(value);
    const { digits } = timeUnits[unit];

    str.split('').forEach((char, index) => {
        const digitEl = digits[index];
        const glyph = digitEl.querySelector('.digit-glyph');
        const changed = glyph.textContent !== char;

        glyph.textContent = char;
        digitEl.dataset.value = char;

        if (shouldFlash && changed) {
            flashDigit(digitEl);
        }
    });
}

function resetTimeDisplayState() {
    lastTimeParts = { hours: '', minutes: '', seconds: '' };
}

function updateTimeDisplay(parts) {
    const hasPrevious = lastTimeParts.hours !== '' ||
        lastTimeParts.minutes !== '' ||
        lastTimeParts.seconds !== '';

    TIME_UNITS.forEach((unit) => {
        const next = parts[unit];
        if (lastTimeParts[unit] === next) return;

        setUnitDigits(unit, next, hasPrevious);
    });

    lastTimeParts = { ...parts };
    timeDisplay.setAttribute(
        'aria-label',
        `${parts.hours} hours, ${parts.minutes} minutes, ${parts.seconds} seconds`,
    );
}

function formatElapsed(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${padTwo(hours)}:${padTwo(minutes)}:${padTwo(seconds)}`;
}

function getStopwatchElapsed() {
    if (stopwatchRunStart !== null) {
        return stopwatchAccumulated + (performance.now() - stopwatchRunStart);
    }
    return stopwatchAccumulated;
}

function isStopwatchRunning() {
    return stopwatchRunStart !== null;
}

function updateClock() {
    const now = new Date();
    updateTimeDisplay({
        hours: padTwo(now.getHours()),
        minutes: padTwo(now.getMinutes()),
        seconds: padTwo(now.getSeconds()),
    });
}

function updateStopwatchDisplay() {
    const ms = getStopwatchElapsed();
    const totalSeconds = Math.floor(ms / 1000);
    updateTimeDisplay({
        hours: padTwo(Math.floor(totalSeconds / 3600)),
        minutes: padTwo(Math.floor((totalSeconds % 3600) / 60)),
        seconds: padTwo(totalSeconds % 60),
    });
}

function updateStopwatchControls() {
    const running = isStopwatchRunning();

    btnPlay.disabled = running;
    btnPause.disabled = !running;
    btnRecord.disabled = !running;
}

function showStopwatchPanel(show) {
    stopwatchPanel.classList.toggle('hidden', !show);
    stopwatchPanel.setAttribute('aria-hidden', show ? 'false' : 'true');
}

function startClockTicker() {
    stopClockTicker();
    clockIntervalId = setInterval(() => {
        if (mode === 'clock') updateClock();
    }, 1000);
}

function stopClockTicker() {
    if (clockIntervalId !== null) {
        clearInterval(clockIntervalId);
        clockIntervalId = null;
    }
}

function startStopwatchTicker() {
    stopStopwatchTicker();
    stopwatchIntervalId = setInterval(() => {
        if (mode === 'stopwatch' && isStopwatchRunning()) updateStopwatchDisplay();
    }, 100);
}

function stopStopwatchTicker() {
    if (stopwatchIntervalId !== null) {
        clearInterval(stopwatchIntervalId);
        stopwatchIntervalId = null;
    }
}

function pauseStopwatch() {
    if (!isStopwatchRunning()) return;
    stopwatchAccumulated += performance.now() - stopwatchRunStart;
    stopwatchRunStart = null;
    stopStopwatchTicker();
    updateStopwatchDisplay();
    updateStopwatchControls();
}

function startStopwatch() {
    if (isStopwatchRunning()) return;
    stopwatchRunStart = performance.now();
    startStopwatchTicker();
    updateStopwatchDisplay();
    updateStopwatchControls();
}

function resetStopwatch() {
    pauseStopwatch();
    stopwatchAccumulated = 0;
    lapCount = 0;
    lapList.replaceChildren();
    updateStopwatchDisplay();
    updateStopwatchControls();
}

function recordLap() {
    const elapsed = getStopwatchElapsed();
    if (elapsed <= 0) return;

    pauseStopwatch();

    lapCount += 1;
    const item = document.createElement('li');
    const label = document.createElement('span');
    const value = document.createElement('span');
    label.textContent = `Lap ${lapCount}`;
    value.textContent = formatElapsed(elapsed);
    item.append(label, value);
    lapList.prepend(item);

    updateStopwatchControls();
}

function updateModeMenuState() {
    modeButtons.forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
}

function showOptionsMenu() {
    optionsMenu.classList.remove('hidden');
    updateModeMenuState();
}

function hideOptionsMenu() {
    optionsMenu.classList.add('hidden');
}

function setMode(newMode, persist = true) {
    if (newMode !== 'clock' && newMode !== 'stopwatch') return;
    if (mode === newMode) {
        hideOptionsMenu();
        return;
    }

    if (mode === 'stopwatch') {
        pauseStopwatch();
    }

    mode = newMode;
    hideOptionsMenu();
    updateModeMenuState();
    resetTimeDisplayState();

    if (mode === 'clock') {
        showStopwatchPanel(false);
        stopClockTicker();
        startClockTicker();
        updateClock();
    } else {
        showStopwatchPanel(true);
        stopClockTicker();
        updateStopwatchDisplay();
        updateStopwatchControls();
    }

    if (persist) {
        window.api.updateSettings({ widgetMode: mode });
    }
}

function applySettings(newSettings) {
    settings = newSettings;

    const root = document.documentElement;
    root.style.setProperty('--font-family', settings.fontFamily);
    root.style.setProperty('--font-size', `${settings.fontSize}px`);
    root.style.setProperty('--text-color', settings.textColor);

    const rgb = hexToRgb(settings.backgroundColor);
    root.style.setProperty('--bg-rgb', rgb);
    root.style.setProperty('--bg-opacity', settings.backgroundOpacity / 100);

    if (settings.layout === 'horizontal') {
        container.classList.add('layout-horizontal');
    } else {
        container.classList.remove('layout-horizontal');
    }

    if (settings.lockPosition) {
        container.classList.remove('draggable');
        container.classList.add('locked');
    } else {
        container.classList.remove('locked');
        container.classList.add('draggable');
    }

    const savedMode = settings.widgetMode === 'stopwatch' ? 'stopwatch' : 'clock';
    if (savedMode !== mode) {
        setMode(savedMode, false);
    } else if (mode === 'clock') {
        showStopwatchPanel(false);
        startClockTicker();
        updateClock();
    } else {
        showStopwatchPanel(true);
        updateStopwatchDisplay();
        updateStopwatchControls();
    }

    updateModeMenuState();
}

container.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showOptionsMenu();
});

window.api.onShowOptionsMenu(showOptionsMenu);

modeButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setMode(btn.dataset.mode);
    });
});

btnPlay.addEventListener('click', (e) => {
    e.stopPropagation();
    hideOptionsMenu();
    startStopwatch();
});

btnPause.addEventListener('click', (e) => {
    e.stopPropagation();
    hideOptionsMenu();
    pauseStopwatch();
});

btnRecord.addEventListener('click', (e) => {
    e.stopPropagation();
    hideOptionsMenu();
    recordLap();
});

function isPointerOverWidget(clientX, clientY) {
    const rect = container.getBoundingClientRect();
    return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
    );
}

function syncCloseBtnVisibility(e) {
    const inside = isPointerOverWidget(e.clientX, e.clientY);
    container.classList.toggle('show-close-btn', inside);
}

document.addEventListener('mousemove', syncCloseBtnVisibility);

btnClose.addEventListener('click', (e) => {
    e.stopPropagation();
    hideOptionsMenu();
    if (confirm('Quit Desktop Clock?')) {
        window.api.closeApp();
    }
});

document.addEventListener('click', (e) => {
    if (!optionsMenu.contains(e.target)) hideOptionsMenu();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideOptionsMenu();
});

initTimeDisplay();

timeDisplay.addEventListener('animationend', (e) => {
    if (e.animationName !== 'digit-sweep' || !e.target.classList.contains('digit')) {
        return;
    }
    e.target.classList.remove(FLASH_CLASS);
});

window.api.getSettings().then(applySettings);
window.api.onSettingsUpdated(applySettings);
