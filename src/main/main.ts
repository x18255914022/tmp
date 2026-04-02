import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import * as db from './database';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Salmon Tracker — Трекер выборка × локус',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  db.initDatabase();
  registerIpcHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

function registerIpcHandlers() {
  // ─── Projects ───
  ipcMain.handle('projects:getAll', () => db.getAllProjects());
  ipcMain.handle('projects:get', (_e, id: number) => db.getProject(id));
  ipcMain.handle('projects:create', (_e, data) => db.createProject(data));
  ipcMain.handle('projects:update', (_e, id: number, data) => db.updateProject(id, data));
  ipcMain.handle('projects:delete', (_e, id: number) => db.deleteProject(id));

  // ─── Sample Groups ───
  ipcMain.handle('groups:getByProject', (_e, projectId: number) => db.getSampleGroupsByProject(projectId));
  ipcMain.handle('groups:get', (_e, id: number) => db.getSampleGroup(id));
  ipcMain.handle('groups:create', (_e, data) => db.createSampleGroup(data));
  ipcMain.handle('groups:update', (_e, id: number, data) => db.updateSampleGroup(id, data));
  ipcMain.handle('groups:delete', (_e, id: number) => db.deleteSampleGroup(id));

  // ─── Batch × Locus ───
  ipcMain.handle('batchLocus:getByGroup', (_e, groupId: number) => db.getBatchLociByGroup(groupId));
  ipcMain.handle('batchLocus:update', (_e, id: number, data) => db.updateBatchLocus(id, data));

  // ─── Locus Reference ───
  ipcMain.handle('loci:getAll', () => db.getAllLoci());
  ipcMain.handle('loci:create', (_e, data) => db.createLocus(data));
  ipcMain.handle('loci:update', (_e, id: number, data) => db.updateLocus(id, data));
  ipcMain.handle('loci:delete', (_e, id: number) => db.deleteLocus(id));

  // ─── PCR Rerun Notes ───
  ipcMain.handle('rerun:getAll', () => db.getAllRerunNotes());
  ipcMain.handle('rerun:create', (_e, data) => db.createRerunNote(data));
  ipcMain.handle('rerun:delete', (_e, id: number) => db.deleteRerunNote(id));

  // ─── Dashboard ───
  ipcMain.handle('dashboard:stats', () => db.getDashboardStats());

  // ─── Export ───
  ipcMain.handle('export:data', () => db.getExportData());
  ipcMain.handle('export:chooseFile', async () => {
    const result = await dialog.showSaveDialog({
      title: 'Экспорт в Excel',
      defaultPath: `salmon-tracker-export-${new Date().toISOString().slice(0, 10)}.xlsx`,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    });
    return result.filePath || null;
  });

  // ─── Backup ───
  ipcMain.handle('backup:save', async () => {
    const result = await dialog.showSaveDialog({
      title: 'Сохранить резервную копию',
      defaultPath: `salmon-tracker-backup-${new Date().toISOString().slice(0, 10)}.db`,
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    });
    if (result.filePath) {
      db.backupDatabase(result.filePath);
      return result.filePath;
    }
    return null;
  });

  ipcMain.handle('backup:restore', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Восстановить из резервной копии',
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
      properties: ['openFile'],
    });
    if (result.filePaths.length > 0) {
      db.restoreDatabase(result.filePaths[0]);
      return true;
    }
    return false;
  });
}
