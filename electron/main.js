const { app, BrowserWindow, ipcMain, Tray, Menu, dialog } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

let mainWindow;
let tray;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      partition: 'persist:pedeue-session'
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    title: "PedeUe - Sistema PDV"
  });

  // Remove o menu padrão completamente para parecer um app nativo
  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);

  const startURL = isDev
    ? 'http://localhost:3000/entrar'
    : 'https://pedeue.com/entrar';

  mainWindow.loadURL(startURL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // Prevenir fechamento acidental
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      const choice = dialog.showMessageBoxSync(mainWindow, {
        type: 'question',
        buttons: ['Sair do Sistema', 'Cancelar'],
        title: 'Sair',
        message: 'Deseja realmente sair do sistema?'
      });

      if (choice === 0) {
        isQuitting = true;
        app.quit();
      }
    }
  });
}

function createTray() {
  // O Windows não aceita SVG como ícone de bandeja nativamente.
  // Futuramente, você pode adicionar um arquivo .ico em public/ e habilitar aqui.
  console.log("System Tray desativado temporariamente (falta ícone .ico)");
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Lógica para listar impressoras
ipcMain.handle('get-printers', async () => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  return win ? win.webContents.getPrintersAsync() : [];
});

// Auto-start (Iniciar com o Windows)
ipcMain.handle('get-autostart', () => {
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.on('toggle-autostart', (event, value) => {
  app.setLoginItemSettings({
    openAtLogin: value,
    path: app.getPath('exe')
  });
});

// Controle de Zoom
ipcMain.on('set-zoom', (event, level) => {
  if (mainWindow) {
    mainWindow.webContents.setZoomLevel(level);
  }
});

// Abertura de Gaveta (Envia pulso ESC/POS para a impressora padrão)
ipcMain.on('open-drawer', (event, printerName) => {
  const drawerWindow = new BrowserWindow({ show: false });
  // Comando ESC/POS para abrir gaveta: 27 112 0 25 250
  const escPosCommand = `<script>window.onload=()=>{window.print();window.close();}</script><style>@media print{@page{margin:0}}</style>&#27;&#112;&#0;&#25;&#250;`;
  drawerWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(escPosCommand)}`);
  drawerWindow.webContents.print({
    silent: true,
    deviceName: printerName || ''
  });
});

// Lógica de Impressão Silenciosa para Impressora Térmica
ipcMain.on('print-silent', (event, { htmlContent, printerName }) => {
  let printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

  printWindow.webContents.on('did-finish-load', () => {
    printWindow.webContents.print({
      silent: true,
      printBackground: true,
      deviceName: printerName || '' // Usa a impressora configurada ou a padrão
    }, (success, failureReason) => {
      if (!success) console.log('Falha na impressão:', failureReason);
      printWindow.close();
    });
  });
});
