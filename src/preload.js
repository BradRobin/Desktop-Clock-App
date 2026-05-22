const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Store
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (newSettings) => ipcRenderer.invoke('update-settings', newSettings),
  onSettingsUpdated: (callback) => ipcRenderer.on('settings-updated', (_event, settings) => callback(settings)),
  onShowOptionsMenu: (callback) => ipcRenderer.on('show-options-menu', () => callback()),
  
  // App Control
  openSettings: () => ipcRenderer.send('open-settings'),
  closeApp: () => ipcRenderer.send('close-app'),

  // Window State Control
  setIgnoreMouseEvents: (ignore) => ipcRenderer.send('set-ignore-mouse-events', ignore),
});
