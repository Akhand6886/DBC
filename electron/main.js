const { app, BrowserWindow, ipcMain, shell, protocol, net } = require('electron');
const path = require('path');

// Register custom protocol privilege to resolve absolute URLs correctly
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true } }
]);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const startUrl = isDev 
    ? (process.env.ELECTRON_START_URL || 'http://localhost:3000')
    : 'app://localhost/index.html';

  mainWindow.loadURL(startUrl);

  // Open external http/https links in default OS browser without intercepting data/blob downloads
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Handle custom 'app://' protocol to serve Next.js static output files
  protocol.handle('app', (request) => {
    const url = new URL(request.url);
    let pathname = url.pathname;
    
    // Default to index.html for root path
    if (pathname === '/' || pathname === '') {
      pathname = '/index.html';
    }
    
    const resolvedPath = path.normalize(path.join(__dirname, '../out', pathname));
    return net.fetch(`file://${resolvedPath}`);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler for desktop OS commands
ipcMain.handle('app:get-version', () => app.getVersion());
ipcMain.handle('app:get-platform', () => process.platform);
