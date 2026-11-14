import { contextBridge, ipcRenderer } from 'electron';
import { CompilerType, LumenAPI, ProjectMetadata, TemplateId } from '../shared/types';

const api: LumenAPI = {
  isNative: true,
  // Filesystem
  selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),
  selectImage: () => ipcRenderer.invoke('dialog:select-image'),
  readProjectTree: (projectPath: string) => ipcRenderer.invoke('fs:read-tree', projectPath),
  readFile: (filePath: string) => ipcRenderer.invoke('fs:read-file', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:write-file', filePath, content),
  createFile: (filePath: string, content?: string) => ipcRenderer.invoke('fs:create-file', filePath, content),
  createFolder: (folderPath: string) => ipcRenderer.invoke('fs:create-folder', folderPath),
  deletePath: (targetPath: string) => ipcRenderer.invoke('fs:delete-path', targetPath),
  renamePath: (oldPath: string, newPath: string) => ipcRenderer.invoke('fs:rename-path', oldPath, newPath),
  copyFileToProject: (sourcePath: string, targetFolderPath: string) =>
    ipcRenderer.invoke('fs:copy-file', sourcePath, targetFolderPath),

  // LaTeX Compilation
  getCompilers: () => ipcRenderer.invoke('latex:get-compilers'),
  compile: (params: { projectPath: string; mainFile: string; compiler: CompilerType; sourceCode?: string }) =>
    ipcRenderer.invoke('latex:compile', params),
  readPdfBase64: (pdfPath: string) => ipcRenderer.invoke('latex:read-pdf-base64', pdfPath),

  // Projects & Templates
  getRecentProjects: () => ipcRenderer.invoke('project:get-recents'),
  saveProjectMetadata: (project: ProjectMetadata) => ipcRenderer.invoke('project:save-metadata', project),
  createProjectFromTemplate: (params: { templateId: TemplateId; targetPath: string; projectName: string }) =>
    ipcRenderer.invoke('project:create-from-template', params),

  // Real-time Collaboration
  startCollabServer: (params: { port?: number; token?: string }) =>
    ipcRenderer.invoke('collab:start-server', params),
  stopCollabServer: () => ipcRenderer.invoke('collab:stop-server'),
  getCollabStatus: () => ipcRenderer.invoke('collab:get-status'),
  getLocalIPs: () => ipcRenderer.invoke('collab:get-ips'),

  // System
  exportPdf: (pdfPath: string) => ipcRenderer.invoke('system:export-pdf', pdfPath),
  showInFileManager: (targetPath: string) => ipcRenderer.invoke('system:show-in-folder', targetPath),
};

contextBridge.exposeInMainWorld('lumenAPI', api);
