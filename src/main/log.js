const fs = require('fs');
const { ipcMain } = require('electron');
const log = require('electron-log');

const filePath = log.transports.file.getFile().path;

(async () => {
  try {
    const data = (await fs.promises.readFile(filePath)).toString();
    if (data.length > 1000 * 100) {
      log.transports.file.getFile().clear();
    }
  } catch (_e) {}
})();

// override console with electron-log
Object.assign(console, log.functions);

process.on('unhandledRejection', (reason) => {
  console.warn('unhandledRejection');
  console.warn(reason);
});

process.on('uncaughtException', (err) => {
  console.warn('uncaughtException');
  console.warn(err.message);
  console.warn(err.stack);

  process.exit(1);
});

ipcMain.on('get_main_log', async (event) => {
  const data = (await fs.promises.readFile(filePath)).toString();
  event.sender.send('response_main_log', {
    data: `${filePath}\n\n${data}`,
  });
});
