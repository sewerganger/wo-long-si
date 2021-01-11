/* eslint-disable @typescript-eslint/no-var-requires */
import { app, BrowserWindow, Tray, Menu, screen, session } from 'electron';
import { CPP, WinWin } from 'win-win-api';
const { SetWindowPos, GetDesktopWindow, SetParent } = new WinWin().user32();

// const icon = require('./icons/png/16x16.png');
import { resolve } from 'path';

import { bufferCastInt32 } from './utils';

declare const MAIN_WINDOW_WEBPACK_ENTRY: any;
let tray: Tray;
let mainWindow: BrowserWindow;

// const HWND_BOTTOM = 1;

// const desktopHwnd = GetDesktopWindow();

if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}


// const showAtPos = (mainWindow: BrowserWindow) => {
//   const { width, height } = screen.getPrimaryDisplay().workAreaSize;
//   mainWindow.setAlwaysOnTop(true);
//   mainWindow.setPosition(width - 310, height - 610, true);
// };

const createWindow = (): void => {

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    minHeight: 160,
    minWidth: 200,
    maxHeight: height - 40,
    maxWidth: width - 40,
    transparent: true,
    frame: false,
    show: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      webSecurity: false,
      enableRemoteModule: true,
    }
  });


  session.defaultSession.webRequest.onBeforeSendHeaders({ urls: ['*://*.hdslb.com/*'] }, (details, callback) => {
    details.requestHeaders['Referer'] = 'https://www.bilibili.com/';
    callback({ requestHeaders: details.requestHeaders });
  });

  console.log(MAIN_WINDOW_WEBPACK_ENTRY);

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // const mainHwnd = bufferCastInt32(mainWindow.getNativeWindowHandle());


  // SetWindowPos(mainHwnd, HWND_BOTTOM, 0, 0, 400, 600, CPP.SWP_SHOWWINDOW);


  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });


  mainWindow.webContents.openDevTools({
    mode: 'detach'
  });

  mainWindow.setSkipTaskbar(true);

  mainWindow.on('resize', () => {
    const [width, height] = mainWindow.getSize();
    mainWindow.webContents.executeJavaScript(`localStorage.setItem('windowSize', [${width}, ${height}])`);
  });


  mainWindow.setAlwaysOnTop(true, 'main-menu');

  mainWindow.webContents
    .executeJavaScript('localStorage.getItem("windowSize");', true)
    .then(result => {
      if (result) {
        const [w, h] = result.split(',');
        mainWindow.setSize(parseFloat(w), parseFloat(h));
      }
      // mainWindow.setSize()
    });


  tray = new Tray(resolve(__dirname, './icons/png/16x16.png'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示',
      click: () => {
        mainWindow?.show();
      }
    },
    {
      label: '退出',
      click: () => {
        mainWindow?.destroy();
      }
    }
  ]);

  tray.setToolTip('bilibili dashboard for uploader');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
    }
  });

};


app.on('ready', createWindow);

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

