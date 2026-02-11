const { contextBridge } = require('electron');

// Expose a minimal API to the renderer process.
// BalanceBooks currently uses localStorage/IndexedDB so no Node.js
// bridge is needed yet, but this provides a safe extension point.
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
});
