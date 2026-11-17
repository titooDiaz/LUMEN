import { contextBridge, ipcRenderer } from 'electron';
import { CompilerType, LumenAPI, ProjectMetadata, TemplateId } from '../shared/types';

const api: LumenAPI = {
  isNative: true,
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  openExternal: (url: string) => ipcRenderer.invoke('system:open-external', url),
  // Filesystem
  selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),
  selectImage: () => ipcRenderer.invoke('dialog:select-image'),
  readProjectTree: (projectPath: string) => ipcRenderer.invoke('fs:read-tree', projectPath),
  pathExists: (targetPath: string) => ipcRenderer.invoke('fs:path-exists', targetPath),
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
  getDefaultProjectPath: () => ipcRenderer.invoke('project:get-default-path'),
  getRecentProjects: () => ipcRenderer.invoke('project:get-recents'),
  saveProjectMetadata: (project: ProjectMetadata) => ipcRenderer.invoke('project:save-metadata', project),
  createProjectFromTemplate: (params: { templateId: TemplateId; targetPath: string; projectName: string }) =>
    ipcRenderer.invoke('project:create-from-template', params),
  copyProjectToDirectory: (params: { sourcePath: string; targetDirectory: string; newProjectName: string }) =>
    ipcRenderer.invoke('project:copy-to-directory', params),

  // Real-time Collaboration
  startCollabServer: (params: { port?: number; token?: string }) =>
    ipcRenderer.invoke('collab:start-server', params),
  stopCollabServer: () => ipcRenderer.invoke('collab:stop-server'),
  getCollabStatus: () => ipcRenderer.invoke('collab:get-status'),
  getLocalIPs: () => ipcRenderer.invoke('collab:get-ips'),
  getAvailableCollabSessions: () => ipcRenderer.invoke('collab:get-available-sessions'),

  // System
  exportPdf: (pdfPath: string) => ipcRenderer.invoke('system:export-pdf', pdfPath),
  saveFileAs: (params: { defaultPath: string; content: string }) =>
    ipcRenderer.invoke('system:save-file-as', params),
  showInFileManager: (targetPath: string) => ipcRenderer.invoke('system:show-in-folder', targetPath),
};

contextBridge.exposeInMainWorld('lumenAPI', api);
