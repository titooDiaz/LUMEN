export type CompilerType = 'tectonic' | 'pdflatex' | 'xelatex' | 'lualatex' | 'latexmk';

export interface CompilerInfo {
  type: CompilerType;
  name: string;
  path: string;
  available: boolean;
  version?: string;
  isDefault?: boolean;
}

export interface DiagnosticItem {
  id: string;
  file: string;
  line: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  rawContext?: string;
}

export interface CompilationResult {
  success: boolean;
  pdfPath?: string;
  pdfBufferBase64?: string;
  log: string;
  errors: DiagnosticItem[];
  warnings: DiagnosticItem[];
  durationMs: number;
  timestamp: string;
}

export interface ProjectFile {
  name: string;
  path: string;
  relativePath: string;
  isDirectory: boolean;
  children?: ProjectFile[];
  extension?: string;
  size?: number;
  modifiedAt?: string;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  path: string;
  mainFile: string;
  compiler: CompilerType;
  createdAt: string;
  lastOpened: string;
  isFavorite?: boolean;
}

export type TemplateId = 'blank' | 'article' | 'ieee' | 'thesis' | 'presentation' | 'resume';

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  description: string;
  badge: string;
  defaultMainContent: string;
  files?: Record<string, string>;
}

export interface CollabUser {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
  canWrite: boolean;
  connectedAt: string;
}

export interface CollabStatus {
  isHosting: boolean;
  port?: number;
  hostIPs?: string[];
  roomId?: string;
  token?: string;
  clients: CollabUser[];
}

export interface LumenAPI {
  isNative: boolean;
  // Filesystem
  selectDirectory: () => Promise<string | null>;
  selectImage: () => Promise<{ path: string; name: string } | null>;
  readProjectTree: (projectPath: string) => Promise<ProjectFile[]>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<boolean>;
  createFile: (filePath: string, content?: string) => Promise<boolean>;
  createFolder: (folderPath: string) => Promise<boolean>;
  deletePath: (targetPath: string) => Promise<boolean>;
  renamePath: (oldPath: string, newPath: string) => Promise<boolean>;
  copyFileToProject: (sourcePath: string, targetFolderPath: string) => Promise<string>;

  // LaTeX Compilation
  getCompilers: () => Promise<CompilerInfo[]>;
  compile: (params: {
    projectPath: string;
    mainFile: string;
    compiler: CompilerType;
    sourceCode?: string;
  }) => Promise<CompilationResult>;
  readPdfBase64: (pdfPath: string) => Promise<string | null>;

  // Projects & Templates
  getRecentProjects: () => Promise<ProjectMetadata[]>;
  saveProjectMetadata: (project: ProjectMetadata) => Promise<void>;
  createProjectFromTemplate: (params: {
    templateId: TemplateId;
    targetPath: string;
    projectName: string;
  }) => Promise<ProjectMetadata>;

  // Real-time Collaboration (Embedded CRDT Server & Network)
  startCollabServer: (params: { port?: number; token?: string }) => Promise<{ success: boolean; port: number; token: string; ips: string[] }>;
  stopCollabServer: () => Promise<boolean>;
  getCollabStatus: () => Promise<CollabStatus>;
  getLocalIPs: () => Promise<string[]>;

  // System
  exportPdf: (pdfPath: string) => Promise<boolean>;
  showInFileManager: (targetPath: string) => Promise<void>;
}

declare global {
  interface Window {
    lumenAPI: LumenAPI;
  }
}
