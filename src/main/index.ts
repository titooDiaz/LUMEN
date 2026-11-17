import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  selectDirectoryDialog,
  selectImageDialog,
  readProjectTreeRecursive,
  copyFileToProject,
  exportPdfDialog,
  saveFileAsDialog,
  showPathInFileManager,
} from './ipc/fsHandlers';
import { detectCompilers, compileLatexProject } from './ipc/latexHandlers';
import {
  loadRecentProjects,
  saveRecentProject,
  createProjectFromTemplate,
  getDefaultProjectPath,
  copyProjectToDirectory,
} from './ipc/projectHandlers';
import { collabServerInstance } from './ipc/collabServer';
import './ipc/updateHandlers';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: 'LUMEN — Modern LaTeX Desktop Editor',
    backgroundColor: '#09090b',
    webPreferences: {
      preload: path.join(currentDir, 'preload.cjs'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#09090b',
      symbolColor: '#a1a1aa',
      height: 38,
    },
  });

  // Load URL or build
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // Vite emits the renderer entry point at dist/index.html. The Electron
    // main bundle is emitted beside it in dist-electron/.
    mainWindow.loadFile(path.join(currentDir, '../dist/index.html'));
  }

  // Hide default menu for ultra clean minimalist UI
  Menu.setApplicationMenu(null);

  mainWindow.on('closed', () => {
    mainWindow = null;
    collabServerInstance.stop();
  });
}

app.whenReady().then(() => {
  collabServerInstance.startDiscovery();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  collabServerInstance.stop();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler Registrations
ipcMain.handle('dialog:select-directory', async () => {
  if (!mainWindow) return null;
  return selectDirectoryDialog(mainWindow);
});

ipcMain.handle('dialog:select-image', async () => {
  if (!mainWindow) return null;
  return selectImageDialog(mainWindow);
});

ipcMain.handle('fs:read-tree', async (_, projectPath: string) => {
  return readProjectTreeRecursive(projectPath);
});

ipcMain.handle('fs:path-exists', async (_, targetPath: string) => {
  try {
    return !!targetPath && fs.existsSync(targetPath);
  } catch {
    return false;
  }
});

ipcMain.handle('fs:read-file', async (_, filePath: string) => {
  return fs.readFileSync(filePath, 'utf-8');
});

ipcMain.handle('fs:write-file', async (_, filePath: string, content: string) => {
  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
});

ipcMain.handle('fs:create-file', async (_, filePath: string, content = '') => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
});

ipcMain.handle('fs:create-folder', async (_, folderPath: string) => {
  fs.mkdirSync(folderPath, { recursive: true });
  return true;
});

ipcMain.handle('fs:delete-path', async (_, targetPath: string) => {
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
    return true;
  }
  return false;
});

ipcMain.handle('fs:rename-path', async (_, oldPath: string, newPath: string) => {
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    return true;
  }
  return false;
});

ipcMain.handle('fs:copy-file', async (_, sourcePath: string, targetFolderPath: string) => {
  return copyFileToProject(sourcePath, targetFolderPath);
});

// LaTeX
ipcMain.handle('latex:get-compilers', async () => {
  return detectCompilers();
});

ipcMain.handle('latex:compile', async (_, params) => {
  return compileLatexProject(params);
});

ipcMain.handle('latex:read-pdf-base64', async (_, pdfPath: string) => {
  if (fs.existsSync(pdfPath)) {
    const buf = fs.readFileSync(pdfPath);
    return buf.toString('base64');
  }
  return null;
});

// Project & Templates
ipcMain.handle('project:get-default-path', async () => {
  return getDefaultProjectPath();
});

ipcMain.handle('project:get-recents', async () => {
  return loadRecentProjects();
});

ipcMain.handle('project:save-metadata', async (_, project) => {
  saveRecentProject(project);
});

ipcMain.handle('project:create-from-template', async (_, params) => {
  return createProjectFromTemplate(params);
});

ipcMain.handle('project:copy-to-directory', async (_, params) => {
  return copyProjectToDirectory(params);
});

// Collaboration
ipcMain.handle('collab:start-server', async (_, params) => {
  return collabServerInstance.start(params.port, params.token);
});

ipcMain.handle('collab:stop-server', async () => {
  return collabServerInstance.stop();
});

ipcMain.handle('collab:get-status', async () => {
  return collabServerInstance.getStatus();
});

ipcMain.handle('collab:get-ips', async () => {
  return collabServerInstance.getLocalIPAddresses();
});

ipcMain.handle('collab:get-available-sessions', async () => collabServerInstance.getAvailableSessions());

// System
ipcMain.handle('system:export-pdf', async (_, pdfPath: string) => {
  if (!mainWindow) return false;
  return exportPdfDialog(pdfPath, mainWindow);
});

ipcMain.handle('system:save-file-as', async (_, params: { defaultPath: string; content: string }) => {
  if (!mainWindow) return null;
  return saveFileAsDialog(mainWindow, params.defaultPath, params.content);
});

ipcMain.handle('system:show-in-folder', async (_, targetPath: string) => {
  return showPathInFileManager(targetPath);
});

ipcMain.handle('system:open-external', async (_, targetUrl: string) => {
  const parsed = new URL(targetUrl);
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'github.com' || parsed.pathname !== '/titooDiaz/LUMEN') {
    throw new Error('Enlace externo no permitido.');
  }
  await shell.openExternal('https://github.com/titooDiaz/LUMEN');
});
