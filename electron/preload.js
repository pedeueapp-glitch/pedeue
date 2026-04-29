const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  getAutoStart: () => ipcRenderer.invoke('get-autostart'),
  toggleAutoStart: (value) => ipcRenderer.send('toggle-autostart', value),
  setZoom: (level) => ipcRenderer.send('set-zoom', level),
  openDrawer: (printerName) => ipcRenderer.send('open-drawer', printerName),
  printSilent: (htmlContent, printerName) => ipcRenderer.send('print-silent', { htmlContent, printerName })
});
