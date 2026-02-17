const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Application constants
const APP_NAME = 'TradeOS Admin';
const APP_WIDTH = 1280;
const APP_HEIGHT = 800;

// Load environment variables from parent directory
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: APP_WIDTH,
    height: APP_HEIGHT,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: APP_NAME,
    autoHideMenuBar: false,
  });

  // Load the webapp admin panel
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
  const adminUrl = `${backendUrl}/admin`;
  
  mainWindow.loadURL(adminUrl);

  // Create application menu
  createMenu();

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMenu() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
  
  const template = [
    {
      label: 'File',
      submenu: [
        { type: 'separator' },
        { label: 'Exit', role: 'quit' }
      ]
    },
    {
      label: 'Admin',
      submenu: [
        { 
          label: 'Users',
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(`${backendUrl}/admin/users`);
            }
          }
        },
        { 
          label: 'Billing',
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(`${backendUrl}/admin/billing`);
            }
          }
        },
        { 
          label: 'Bots',
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(`${backendUrl}/admin/bots`);
            }
          }
        },
        { 
          label: 'CRM',
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(`${backendUrl}/admin/crm`);
            }
          }
        },
        { 
          label: 'Prices',
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(`${backendUrl}/admin/prices`);
            }
          }
        },
        { 
          label: 'Fees',
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(`${backendUrl}/admin/fees`);
            }
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (!mainWindow) {
    createWindow();
  }
});
