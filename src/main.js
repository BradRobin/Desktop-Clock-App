const { app, BrowserWindow, ipcMain, Tray, Menu, screen, nativeImage } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store({
    defaults: {
        timeFormat: '12h',
        fontFamily: 'Segoe UI',
        fontSize: 72,
        textColor: '#ffffff',
        backgroundColor: '#000000',
        backgroundOpacity: 50,
        alwaysOnTop: true,
        runAtStartup: false,
        lockPosition: false,
        layout: 'horizontal',
        clockX: null,
        clockY: null,
        widgetMode: 'clock'
    }
});

let clockWindow = null;
let settingsWindow = null;
let tray = null;

const WM_INITMENU = 0x0116;

function suppressWindowsSystemMenu(win) {
    if (process.platform !== 'win32') return;

    const showWidgetOptionsMenu = () => {
        if (win && !win.isDestroyed()) {
            win.webContents.send('show-options-menu');
        }
    };

    win.on('system-context-menu', (event) => {
        event.preventDefault();
        showWidgetOptionsMenu();
    });

    win.hookWindowMessage(WM_INITMENU, () => {
        win.setEnabled(false);
        win.setEnabled(true);
        showWidgetOptionsMenu();
    });
}

function createClockWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    const savedX = store.get('clockX');
    const savedY = store.get('clockY');

    clockWindow = new BrowserWindow({
        width: 600,
        height: 340,
        x: savedX !== null ? savedX : width - 620,
        y: savedY !== null ? savedY : 20,
        transparent: true,
        frame: false,
        alwaysOnTop: store.get('alwaysOnTop'),
        skipTaskbar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    clockWindow.loadFile(path.join(__dirname, 'clock/clock.html'));

    suppressWindowsSystemMenu(clockWindow);

    clockWindow.webContents.on('context-menu', (event) => {
        event.preventDefault();
        clockWindow.webContents.send('show-options-menu');
    });

    // Save position on move
    clockWindow.on('moved', () => {
        if (clockWindow) {
            const [x, y] = clockWindow.getPosition();
            store.set('clockX', x);
            store.set('clockY', y);
        }
    });

    // Make window transparent to mouse events if needed
    if (store.get('lockPosition')) {
        clockWindow.setIgnoreMouseEvents(true, { forward: true });
    }

    clockWindow.on('closed', () => {
        clockWindow = null;
    });
}

function createSettingsWindow() {
    if (settingsWindow) {
        if (settingsWindow.isMinimized()) settingsWindow.restore();
        settingsWindow.focus();
        return;
    }

    settingsWindow = new BrowserWindow({
        width: 450,
        height: 650,
        title: 'Clock Settings',
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    settingsWindow.loadFile(path.join(__dirname, 'settings/settings.html'));

    settingsWindow.on('closed', () => {
        settingsWindow = null;
    });
}

function createTray() {
    // A simple 16x16 placeholder icon for the tray
    const iconDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABoSURBVDhPY/iPD0wk4/7///4DoxkYkBiDBwHIA2BvMBgNMApGB4wOQD8MIMsZAAHkAdgLDEYDjILRAaMD0BODG2IA/QAA6AdkwDAgA4YBGTAIyAAfH/QDGAYMRAOMgtGBz8EAAQYAHxM6L+R/0yAAAAAASUVORK5CYII=';
    const icon = nativeImage.createFromDataURL(iconDataUrl);
    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Settings', click: () => createSettingsWindow() },
        { type: 'separator' },
        { label: 'Quit Desktop Clock', click: () => { app.isQuitting = true; app.quit(); } }
    ]);

    tray.setToolTip('Desktop Clock Widget');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => createSettingsWindow());
}

app.whenReady().then(() => {
    createClockWindow();
    createTray();

    // Set startup behavior
    app.setLoginItemSettings({
        openAtLogin: store.get('runAtStartup'),
        path: app.getPath('exe')
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createClockWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Settings Window requests
ipcMain.on('open-settings', () => {
    createSettingsWindow();
});

ipcMain.on('close-app', () => {
    app.isQuitting = true;
    app.quit();
});

// Store IPC interactions
ipcMain.handle('get-settings', () => {
    return store.store;
});

ipcMain.handle('update-settings', (event, newSettings) => {
    store.set(newSettings);

    if (newSettings.alwaysOnTop !== undefined && clockWindow) {
        clockWindow.setAlwaysOnTop(newSettings.alwaysOnTop);
    }

    if (newSettings.runAtStartup !== undefined) {
        app.setLoginItemSettings({
            openAtLogin: newSettings.runAtStartup,
            path: app.getPath('exe')
        });
    }

    if (newSettings.lockPosition !== undefined && clockWindow) {
        clockWindow.setIgnoreMouseEvents(newSettings.lockPosition, { forward: true });
    }

    // Notify renderer of changes so it can redraw clock
    if (clockWindow) {
        clockWindow.webContents.send('settings-updated', store.store);
    }

    return store.store;
});

ipcMain.on('set-ignore-mouse-events', (event, ignore) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !store.get('lockPosition')) {
        win.setIgnoreMouseEvents(ignore, { forward: true });
    }
});
