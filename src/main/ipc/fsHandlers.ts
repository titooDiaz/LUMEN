import { dialog, BrowserWindow, shell } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ProjectFile } from '../../shared/types';

// Ignore directories and temporary build artifacts in project tree
const IGNORED_DIRS = new Set(['.git', 'node_modules', '.cache']);
const IGNORED_EXTENSIONS = new Set(['.aux', '.log', '.out', '.toc', '.fls', '.fdb_latexmk', '.synctex.gz', '.bbl', '.blg', '.nav', '.snm', '.vrb']);

export async function selectDirectoryDialog(mainWindow: BrowserWindow): Promise<string | null> {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select LaTeX Project Folder',
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
}

export async function selectImageDialog(mainWindow: BrowserWindow): Promise<{ path: string; name: string } | null> {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    title: 'Select Image to Insert',
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'pdf', 'eps', 'svg', 'webp'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  const filePath = result.filePaths[0];
  return {
    path: filePath,
    name: path.basename(filePath),
  };
}

export function readProjectTreeRecursive(projectPath: string, relativeDir = ''): ProjectFile[] {
  const currentPath = path.join(projectPath, relativeDir);
  if (!fs.existsSync(currentPath)) return [];

  const entries = fs.readdirSync(currentPath, { withFileTypes: true });
  const items: ProjectFile[] = [];

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;

    const fullPath = path.join(currentPath, entry.name);
    const relPath = path.join(relativeDir, entry.name);

    if (entry.isDirectory()) {
      items.push({
        name: entry.name,
        path: fullPath,
        relativePath: relPath,
        isDirectory: true,
        children: readProjectTreeRecursive(projectPath, relPath),
      });
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      // Only skip temporary LaTeX auxiliary files if in output or root, but keep .tex, .bib, images, etc.
      if (IGNORED_EXTENSIONS.has(ext)) continue;

      let size = 0;
      let modifiedAt = '';
      try {
        const stats = fs.statSync(fullPath);
        size = stats.size;
        modifiedAt = stats.mtime.toISOString();
      } catch {
        // ignore
      }

      items.push({
        name: entry.name,
        path: fullPath,
        relativePath: relPath,
        isDirectory: false,
        extension: ext,
        size,
        modifiedAt,
      });
    }
  }

  // Sort folders first, then alphabetically
  return items.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
}

export function copyFileToProject(sourcePath: string, targetFolderPath: string): string {
  if (!fs.existsSync(targetFolderPath)) {
    fs.mkdirSync(targetFolderPath, { recursive: true });
  }
  const fileName = path.basename(sourcePath);
  const destination = path.join(targetFolderPath, fileName);

  fs.copyFileSync(sourcePath, destination);
  return destination;
}

export async function exportPdfDialog(pdfPath: string, mainWindow: BrowserWindow): Promise<boolean> {
  if (!fs.existsSync(pdfPath)) return false;

  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Compiled PDF',
    defaultPath: path.basename(pdfPath),
    filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
  });

  if (result.canceled || !result.filePath) {
    return false;
  }

  fs.copyFileSync(pdfPath, result.filePath);
  return true;
}

export async function showPathInFileManager(targetPath: string): Promise<void> {
  if (fs.existsSync(targetPath)) {
    shell.showItemInFolder(targetPath);
  }
}
