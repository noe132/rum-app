import './processLock';
import './test';
import './log';
import { initialize, enable } from '@electron/remote/main';
import { app, BrowserWindow, ipcMain, Menu, Tray, dialog, nativeTheme } from 'electron';
import ElectronStore from 'electron-store';

import { initQuorum } from './quorum';
import { handleUpdate } from './updater';
import { MenuBuilder } from './menu';
import { sleep } from './utils';
import { mainLang } from './lang';
import { appState } from './appState';
import { devRootPath, othersIcon, win32Icon } from './constants';

initialize();

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = !isDevelopment;

const store = new ElectronStore();

const main = () => {
  let win: BrowserWindow | null;
  ElectronStore.initRenderer();
  const createWindow = async () => {
    if (isDevelopment) {
      process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
      // wait 3 second for webpack to be up
      await sleep(3000);
    }

    nativeTheme.themeSource = 'light';
    win = new BrowserWindow({
      width: 1280,
      height: 780,
      minWidth: 768,
      minHeight: 500,
      webPreferences: {
        contextIsolation: false,
        enableRemoteModule: true,
        nodeIntegration: true,
        webSecurity: !isDevelopment && !process.env.TEST_ENV,
        webviewTag: true,
      } as any,
      titleBarOverlay: {
        color: '#fff',
        symbolColor: '#fff',
        height: 63,
      },
    });

    enable(win.webContents);

    if (process.env.TEST_ENV === 'prod') {
      win.loadFile('src/dist/index.html');
    } else if (isDevelopment || process.env.TEST_ENV === 'dev') {
      win.loadURL('http://localhost:1212/index.html');
    } else {
      win.loadFile('dist/index.html');
    }

    const menuBuilder = new MenuBuilder(win);
    menuBuilder.buildMenu();

    win.on('close', async (e) => {
      if (appState.quitting) {
        win = null;
      } else {
        e.preventDefault();
        if (win?.isFullScreen()) {
          win?.once('leave-full-screen', () => win?.hide());
          win?.setFullScreen(false);
        } else {
          win?.hide();
        }
        if (process.platform === 'win32') {
          const notice = !store.get('not-notice-when-close');
          if (notice) {
            try {
              const res = await dialog.showMessageBox({
                type: 'info',
                buttons: [mainLang.yes],
                title: mainLang.windowMinimize,
                message: mainLang.runInBackground,
                checkboxLabel: mainLang.doNotRemind,
              });
              if (res?.checkboxChecked) {
                store.set('not-notice-when-close', true);
              }
            } catch {}
          }
        }
      }
    });

    if (isProduction) {
      sleep(3000).then(() => {
        handleUpdate(win!);
      });
    }
  };

  let tray;
  function createTray() {
    const icon = process.platform === 'win32'
      ? win32Icon
      : othersIcon;

    tray = new Tray(icon);
    const showApp = () => {
      if (win) {
        win.show();
      }
    };
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示主界面',
        click: showApp,
      },
      {
        label: '退出',
        click: () => {
          app.quit();
        },
      },
    ]);
    tray.on('click', showApp);
    tray.on('double-click', showApp);
    tray.setToolTip('Rum');
    tray.setContextMenu(contextMenu);
  }

  ipcMain.on('app-quit-prompt', () => {
    appState.quitPrompt = true;
  });

  ipcMain.on('disable-app-quit-prompt', () => {
    appState.quitPrompt = false;
  });

  app.on('render-process-gone', () => {
    appState.quitPrompt = false;
  });

  app.on('before-quit', (e) => {
    if (appState.quitPrompt) {
      e.preventDefault();
      win?.webContents.send('app-before-quit');
    } else {
      appState.quitting = true;
    }
  });

  ipcMain.on('app-quit', () => {
    app.quit();
  });

  app.on('window-all-closed', () => {});

  app.on('second-instance', (_event, _commandLine, _workingDirectory, additionalData) => {
    if (win) {
      if (!win.isVisible()) win.show();
      if (win.isMinimized()) win.restore();
      win.focus();
    }
    if (Array.isArray(additionalData)) {
      const firstArg = additionalData.at(0);
      if (!firstArg) {
        return;
      }
      if (firstArg.startsWith('rum-app://')) {
        win?.webContents.send('rum-app', firstArg);
      }
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      win?.show();
    }
  });

  // app.on('certificate-error', (event, _webContents, _url, _error, certificate, callback) => {
  //   const serverCert = certificate.data.trim();
  //   const userInputCert = quorumState.userInputCert.trim();
  //   const certValid = userInputCert
  //     ? userInputCert === serverCert
  //     : true;
  //   if (certValid) {
  //     event.preventDefault();
  //     callback(true);
  //     return;
  //   }
  //   callback(false);
  // });

  try {
    initQuorum();
  } catch (err) {
    console.error('Quorum err: ');
    console.error(err);
  }

  ipcMain.on('inspect-picker', () => {
    if (!win || !isDevelopment) {
      return;
    }
    if (win.webContents.isDevToolsOpened()) {
      (win as any).devToolsWebContents.executeJavaScript('DevToolsAPI.enterInspectElementMode()');
    } else {
      win.webContents.once('devtools-opened', () => {
        (win as any).devToolsWebContents.executeJavaScript('DevToolsAPI.enterInspectElementMode()');
      });
      (win as any).openDevTools();
    }
  });

  app.whenReady().then(() => {
    if (isDevelopment) {
      console.log('Starting main process...');
    }
    createWindow();
    if (process.platform !== 'darwin') {
      createTray();
    }

    const mainjs = devRootPath;
    const electronExe = process.execPath;
    if (isDevelopment) {
      app.setAsDefaultProtocolClient('rum-app', electronExe, [mainjs]);
    } else {
      app.setAsDefaultProtocolClient('rum-app');
    }
  });

  ipcMain.on('app-version', (event) => {
    const version = app.getVersion();
    event.returnValue = version;
  });

  ipcMain.on('base-path', (event) => {
    const basePath = isProduction ? process.resourcesPath : `file://${app.getAppPath()}`;
    event.returnValue = basePath;
  });

  ipcMain.on('app-path', (event, arg) => {
    const appPath = app.getPath(arg);
    event.returnValue = appPath;
  });

  ipcMain.on('set-badge-count', (_, badgeCount) => {
    app.setBadgeCount(badgeCount);
  });

  ipcMain.on('relaunch', () => {
    app.relaunch();
  });

  ipcMain.on('quit', () => {
    app.quit();
  });

  ipcMain.handle('open-dialog', async (_, arg) => {
    const file = await dialog.showOpenDialog(win!, arg);
    return file;
  });

  ipcMain.handle('save-dialog', async (_, arg) => {
    const file = await dialog.showSaveDialog(arg);
    return file;
  });

  ipcMain.handle('message-box', async (_, arg) => {
    const file = await dialog.showMessageBox(arg);
    return file;
  });
};

if (app.hasSingleInstanceLock()) {
  main();
}
