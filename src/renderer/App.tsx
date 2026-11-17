import React, { useState, useEffect, useRef, useCallback } from 'react';
import type * as monacoType from 'monaco-editor';
import * as Y from 'yjs';
import {
  CompilerInfo,
  CompilerType,
  CompilationResult,
  ProjectFile,
  ProjectMetadata,
  TemplateId,
  CollabStatus,
} from '../shared/types';
import { HeaderBar } from './components/layout/HeaderBar';
import { Sidebar } from './components/layout/Sidebar';
import { SplitView } from './components/layout/SplitView';
import { LatexEditor } from './components/editor/LatexEditor';
import { VisualToolbar } from './components/editor/VisualToolbar';
import { DiagnosticPanel } from './components/editor/DiagnosticPanel';
import { PdfViewer } from './components/preview/PdfViewer';
import { WelcomeScreen } from './components/welcome/WelcomeScreen';
import { TableEditorModal } from './components/modals/TableEditorModal';
import { ImageInsertModal } from './components/modals/ImageInsertModal';
import { MathInsertModal } from './components/modals/MathInsertModal';
import { CollabModal } from './components/modals/CollabModal';
import { NewProjectModal } from './components/modals/NewProjectModal';
import { SaveAsModal } from './components/modals/SaveAsModal';
import { CreateEntryModal } from './components/modals/CreateEntryModal';
import { X, FileCode } from 'lucide-react';

const GHOST_NAMES = ['sigma ghost', 'random ghost', 'otaku ghost', 'pixel ghost', 'lunar ghost', 'cosmic ghost', 'syntax ghost', 'phantom ghost', 'boba ghost', 'neon ghost'];

export const App: React.FC = () => {
  const encodeUpdate = (update: Uint8Array): string => {
    let binary = '';
    update.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  };

  const decodeUpdate = (encoded: string): Uint8Array => {
    const binary = atob(encoded);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  };

  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('lumen_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('lumen_theme', theme);
  }, [theme]);

  // Project state
  const [currentProject, setCurrentProject] = useState<ProjectMetadata | null>(null);
  const [recentProjects, setRecentProjects] = useState<ProjectMetadata[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState<Record<string, boolean>>({});

  const handleToggleFavorite = async (project: ProjectMetadata) => {
    const updatedProject = { ...project, isFavorite: !project.isFavorite };
    await window.lumenAPI.saveProjectMetadata(updatedProject);
    setRecentProjects(await window.lumenAPI.getRecentProjects());
  };

  // Compilers state
  const [compilers, setCompilers] = useState<CompilerInfo[]>([]);
  const [selectedCompiler, setSelectedCompiler] = useState<CompilerType>('tectonic');
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compileResult, setCompileResult] = useState<CompilationResult | null>(null);
  const [autoCompile, setAutoCompile] = useState<boolean>(true);

  // Layout & UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1.0);
  // Incremented whenever the user asks to fit the PDF to the available width.
  // The actual scale is computed inside PdfViewer, which knows the pane size
  // and the real page width returned by PDF.js.
  const [fitWidthSignal, setFitWidthSignal] = useState<number>(0);
  const handleFitWidth = () => setFitWidthSignal((signal) => signal + 1);

  // Modals state
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isMathModalOpen, setIsMathModalOpen] = useState(false);
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
  const [isJoinCollabOpen, setIsJoinCollabOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [createEntry, setCreateEntry] = useState<{ kind: 'file' | 'folder'; parentDir: string } | null>(null);
  const [selectedModalTemplate, setSelectedModalTemplate] = useState<TemplateId>('article');
  const [customProjectsFolder, setCustomProjectsFolder] = useState<string>(() => {
    return localStorage.getItem('lumen_custom_projects_folder') || '';
  });
  const [updateState, setUpdateState] = useState({ checking: false, installing: false, available: false, version: '…', canInstall: false, message: '' });

  // Collaboration state
  const [collabStatus, setCollabStatus] = useState<CollabStatus>({
    isHosting: false,
    clients: [],
  });
  const [userName, setUserName] = useState<string>(() => GHOST_NAMES[Math.floor(Math.random() * GHOST_NAMES.length)]);
  const [isConnectedRemote, setIsConnectedRemote] = useState<boolean>(false);
  const [collabConnectionError, setCollabConnectionError] = useState('');
  const collabConnectionErrorRef = useRef('');
  const collabWsRef = useRef<WebSocket | null>(null);
  const sharedSessionRef = useRef<{ projectName: string; fileName: string; content: string; sharedFilePath: string } | null>(null);
  const localPathBySharedRef = useRef<Map<string, string>>(new Map());
  const cursorSendTimerRef = useRef<NodeJS.Timeout | null>(null);
  const yDocsRef = useRef<Map<string, Y.Doc>>(new Map());
  const applyingRemoteUpdateRef = useRef(false);

  // Monaco editor reference
  const editorRef = useRef<monacoType.editor.IStandaloneCodeEditor | null>(null);
  const mathSelectionRef = useRef<monacoType.Range | null>(null);

  // Auto-compile debounce timer
  const compileTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Use a ref to track compilation state without stale closure issues
  const isCompilingRef = useRef<boolean>(false);

  // Keep a ref to currentProject so auto-compile timer always has the latest value
  const currentProjectRef = useRef<ProjectMetadata | null>(null);
  currentProjectRef.current = currentProject;

  // Latest editor state. Timers and Monaco keybindings capture props/state
  // from the render in which they were created, so reading from these refs
  // avoids compiling an outdated copy of the document.
  const fileContentsRef = useRef<Record<string, string>>(fileContents);
  fileContentsRef.current = fileContents;
  const activeFilePathRef = useRef<string | null>(activeFilePath);
  activeFilePathRef.current = activeFilePath;
  const isDirtyRef = useRef<Record<string, boolean>>(isDirty);
  isDirtyRef.current = isDirty;
  const selectedCompilerRef = useRef<CompilerType>(selectedCompiler);
  selectedCompilerRef.current = selectedCompiler;
  const autoCompileRef = useRef<boolean>(autoCompile);
  autoCompileRef.current = autoCompile;

  // If a compile is requested while another one is running, keep only the
  // latest request and run it as soon as the current compile finishes.
  const pendingCompileRef = useRef<{
    project: ProjectMetadata;
    mainFile: string;
    currentCode: string;
    compiler: CompilerType;
  } | null>(null);

  // Initial load: fetch recent projects, detected compilers & system default path
  useEffect(() => {
    async function init() {
      try {
        const detected = await window.lumenAPI.getCompilers();
        setCompilers(detected);
        const available = detected.find((c) => c.available);
        if (available) {
          setSelectedCompiler(available.type);
        }

        const recents = await window.lumenAPI.getRecentProjects();
        setRecentProjects(recents);

        const defaultPath = await window.lumenAPI.getDefaultProjectPath();
        const storedFolder = localStorage.getItem('lumen_custom_projects_folder') || '';
        // A path saved by the web fallback (e.g. /home/usuario/Documentos)
        // does not exist on this machine. Never keep an invalid folder, or
        // project creation will fail with EACCES.
        const storedFolderExists = storedFolder
          ? await window.lumenAPI.pathExists(storedFolder)
          : false;
        const projectsFolder = storedFolderExists ? storedFolder : defaultPath;
        localStorage.setItem('lumen_custom_projects_folder', projectsFolder);
        setCustomProjectsFolder(projectsFolder);
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, []);

  // Global keyboard shortcuts (Ctrl+Shift+S for Save As)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        if (currentProject) {
          setIsSaveAsModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentProject]);

  // Refresh project files tree
  const refreshProjectTree = useCallback(async (projectPath: string) => {
    try {
      const tree = await window.lumenAPI.readProjectTree(projectPath);
      setFiles(tree);
    } catch (err) {
      console.error('Failed to read project tree:', err);
    }
  }, []);

  // Open an existing project by directory path
  const handleOpenProject = async (projectPath: string) => {
    // Discard any pending auto-compile from the previously open project.
    if (compileTimerRef.current) {
      clearTimeout(compileTimerRef.current);
      compileTimerRef.current = null;
    }
    pendingCompileRef.current = null;

    try {
      const tree = await window.lumenAPI.readProjectTree(projectPath);
      setFiles(tree);

      // Find main file (default main.tex)
      let mainFile = 'main.tex';
      const hasMain = tree.some((f) => f.name === 'main.tex' && !f.isDirectory);
      if (!hasMain) {
        const firstTex = tree.find((f) => f.name.endsWith('.tex') && !f.isDirectory);
        if (firstTex) mainFile = firstTex.name;
      }

      const mainFilePath = `${projectPath}/${mainFile}`;

      // Read main file content
      const content = await window.lumenAPI.readFile(mainFilePath);

      const metadata: ProjectMetadata = {
        id: `proj-${Date.now()}`,
        name: projectPath.split('/').pop() || 'Proyecto',
        path: projectPath,
        mainFile,
        compiler: selectedCompiler,
        createdAt: new Date().toISOString(),
        lastOpened: new Date().toISOString(),
      };

      await window.lumenAPI.saveProjectMetadata(metadata);
      setRecentProjects(await window.lumenAPI.getRecentProjects());

      setCurrentProject(metadata);
      setOpenTabs([mainFilePath]);
      setActiveFilePath(mainFilePath);
      setFileContents({ [mainFilePath]: content });
      ensureCollabDocument(mainFilePath, content);

      // Trigger initial compilation
      triggerCompile(metadata, mainFile, content, selectedCompiler);
    } catch (err) {
      console.error('Failed to open project:', err);
    }
  };

  // Compile project function (uses refs to avoid stale closures and lost clicks)
  const triggerCompile = async (
    project: ProjectMetadata,
    mainFile: string,
    currentCode: string,
    compiler: CompilerType
  ) => {
    // Never drop a compile request: keep the latest one and execute it once
    // the current compilation has finished.
    if (isCompilingRef.current) {
      pendingCompileRef.current = { project, mainFile, currentCode, compiler };
      return;
    }

    isCompilingRef.current = true;
    setIsCompiling(true);

    try {
      const result = await window.lumenAPI.compile({
        projectPath: project.path,
        mainFile,
        compiler,
        sourceCode: currentCode,
      });

      setCompileResult(result);
      if (!result.success && result.errors.length > 0) {
        setIsDiagnosticOpen(true);
      }
    } catch (err: any) {
      console.error('Compilation failed:', err);
      setCompileResult({
        success: false,
        log: err.message || 'Error desconocido al compilar',
        errors: [{ id: 'err-1', file: mainFile, line: 1, severity: 'error', message: err.message }],
        warnings: [],
        durationMs: 0,
        timestamp: new Date().toISOString(),
      });
      setIsDiagnosticOpen(true);
    } finally {
      isCompilingRef.current = false;
      setIsCompiling(false);

      const pending = pendingCompileRef.current;
      pendingCompileRef.current = null;
      // Only replay the queued compile if the project is still open.
      if (pending && currentProjectRef.current?.path === pending.project.path) {
        void triggerCompile(
          pending.project,
          pending.mainFile,
          pending.currentCode,
          pending.compiler
        );
      }
    }
  };

  const handleManualCompile = () => {
    const project = currentProjectRef.current;
    if (!project) return;
    // Cancel any pending auto-compile timer and compile immediately
    if (compileTimerRef.current) {
      clearTimeout(compileTimerRef.current);
      compileTimerRef.current = null;
    }
    void compileCurrentProject(project);
  };

  const compileCurrentProject = async (
    project: ProjectMetadata,
    // Fresh content from the editor. React state updates are asynchronous, so
    // after an edit the state still holds the previous version. Passing the
    // new value explicitly prevents auto-compile from overwriting the file
    // with stale text (which made the PDF look static).
    override?: { filePath: string; content: string }
  ) => {
    const mainFilePath = `${project.path}/${project.mainFile}`;
    const activePath = override?.filePath ?? activeFilePathRef.current;
    const latestContents = override
      ? { ...fileContentsRef.current, [override.filePath]: override.content }
      : fileContentsRef.current;

    // Persist every dirty file before compiling, including the one that was
    // just edited. The compiler must always receive main.tex, even when a
    // section or bibliography tab is active.
    const dirtyPaths = Object.keys(isDirtyRef.current).filter(
      (filePath) => isDirtyRef.current[filePath]
    );

    const savedPaths: string[] = [];
    for (const filePath of dirtyPaths) {
      if (filePath === override?.filePath) continue;
      const content = latestContents[filePath];
      if (content === undefined) continue;
      await window.lumenAPI.writeFile(filePath, content);
      savedPaths.push(filePath);
    }

    // Save the freshly edited tab explicitly: React has not committed its
    // state yet, so its entry may still be missing from the dirty map.
    if (override) {
      await window.lumenAPI.writeFile(override.filePath, override.content);
      savedPaths.push(override.filePath);
    }

    if (savedPaths.length > 0) {
      setIsDirty((prev) => {
        const next = { ...prev };
        for (const filePath of savedPaths) {
          next[filePath] = false;
        }
        return next;
      });
    }

    const mainContent =
      activePath === mainFilePath && latestContents[mainFilePath] !== undefined
        ? latestContents[mainFilePath]
        : await window.lumenAPI.readFile(mainFilePath);

    await triggerCompile(project, project.mainFile, mainContent, selectedCompilerRef.current);
  };

  // Handle editor code change with auto-compile debounce
  const handleCodeChange = (newCode: string) => {
    if (!activeFilePath) return;

    setFileContents((prev) => ({ ...prev, [activeFilePath]: newCode }));
    setIsDirty((prev) => ({ ...prev, [activeFilePath]: true }));

    const doc = yDocsRef.current.get(activeFilePath);
    if (doc && !applyingRemoteUpdateRef.current) {
      const text = doc.getText('content');
      doc.transact(() => {
        if (text.toString() !== newCode) {
          text.delete(0, text.length);
          text.insert(0, newCode);
        }
      }, 'local');
    }

    // Auto-save & auto-compile
    if (autoCompileRef.current) {
      if (compileTimerRef.current) {
        clearTimeout(compileTimerRef.current);
      }
      const editedPath = activeFilePath;
      compileTimerRef.current = setTimeout(async () => {
        compileTimerRef.current = null;
        const project = currentProjectRef.current;
        if (!project) return;
        // Pass the freshly edited text explicitly. The state update for this
        // keystroke has not been committed yet, so compiling from state would
        // restore the previous version and leave the preview outdated.
        await compileCurrentProject(project, { filePath: editedPath, content: newCode });
      }, 900);
    }
  };

  const handleSaveCurrentFile = async () => {
    if (!activeFilePath) return;
    const content = fileContents[activeFilePath] || '';
    await window.lumenAPI.writeFile(activeFilePath, content);
    setIsDirty((prev) => ({ ...prev, [activeFilePath]: false }));
  };

  // Insert snippet into Monaco Editor at cursor position
  const handleInsertCode = (snippet: string) => {
    if (!editorRef.current || !activeFilePath) {
      alert('Selecciona primero un archivo LaTeX para insertar el contenido.');
      return;
    }
    const editor = editorRef.current;
    const selection = mathSelectionRef.current || editor.getSelection() || editor.getModel()?.getFullModelRange();
    if (!selection) return;
    editor.executeEdits('lumen-visual-insert', [
      {
        range: selection,
        text: snippet,
        forceMoveMarkers: true,
      },
    ]);
    // Monaco's controlled value can be updated asynchronously. Persist the
    // resulting model immediately so visual insertions cannot be overwritten
    // by the previous React value.
    handleCodeChange(editor.getValue());
    mathSelectionRef.current = null;
    editor.focus();
  };

  const handleOpenMathModal = () => {
    const editor = editorRef.current;
    if (!editor || !activeFilePath) {
      setIsMathModalOpen(true);
      return;
    }
    mathSelectionRef.current = editor.getSelection() || editor.getModel()?.getFullModelRange() || null;
    setIsMathModalOpen(true);
  };

  const handleInsertImage = (snippet: string) => {
    handleInsertCode(snippet);
    if (currentProject) {
      void refreshProjectTree(currentProject.path);
    }
  };

  // Jump to line in editor
  const handleJumpToLine = (lineNumber: number) => {
    if (!editorRef.current) return;
    editorRef.current.revealLineInCenter(lineNumber);
    editorRef.current.setPosition({ lineNumber, column: 1 });
    editorRef.current.focus();
  };

  // Select file from sidebar
  const handleSelectFile = async (filePath: string) => {
    if (!openTabs.includes(filePath)) {
      setOpenTabs([...openTabs, filePath]);
    }
    setActiveFilePath(filePath);

    if (fileContents[filePath] === undefined) {
      try {
        const content = await window.lumenAPI.readFile(filePath);
        setFileContents((prev) => ({ ...prev, [filePath]: content }));
        ensureCollabDocument(filePath, content);
      } catch (err) {
        console.error('Error reading file:', err);
      }
    }
  };

  const ensureCollabDocument = useCallback((filePath: string, content: string) => {
    if (yDocsRef.current.has(filePath)) return;
    const doc = new Y.Doc();
    const text = doc.getText('content');
    if (content) text.insert(0, content);
    doc.on('update', (update: Uint8Array, origin: unknown) => {
      if (origin === 'remote' || !collabWsRef.current || collabWsRef.current.readyState !== WebSocket.OPEN) return;
      const sharedPath = [...localPathBySharedRef.current.entries()].find(([, localPath]) => localPath === filePath)?.[0] || filePath;
      collabWsRef.current.send(JSON.stringify({
        type: 'lumen:y-update',
        filePath: sharedPath,
        update: encodeUpdate(update),
      }));
    });
    yDocsRef.current.set(filePath, doc);
  }, []);

  // Close tab
  const handleCloseTab = (tabPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = openTabs.filter((t) => t !== tabPath);
    setOpenTabs(newTabs);

    if (activeFilePath === tabPath) {
      if (newTabs.length > 0) {
        setActiveFilePath(newTabs[newTabs.length - 1]);
      } else {
        setActiveFilePath(null);
      }
    }
  };

  // Create file in project
  const handleCreateFile = async (parentDir: string) => {
    setCreateEntry({ kind: 'file', parentDir });
  };

  // Create folder in project
  const handleCreateFolder = async (parentDir: string) => {
    setCreateEntry({ kind: 'folder', parentDir });
  };

  const handleCreateEntrySubmit = async (name: string) => {
    if (!createEntry || !currentProject) return;
    const normalizedName = name.trim();
    if (!normalizedName || normalizedName.includes('/') || normalizedName.includes('\\')) throw new Error('Escribe un nombre válido, sin rutas.');
    const newPath = `${createEntry.parentDir}/${normalizedName}`;
    const exists = await window.lumenAPI.pathExists(newPath);
    if (exists) throw new Error('Ya existe un archivo o carpeta con ese nombre.');
    if (createEntry.kind === 'file') {
      await window.lumenAPI.createFile(newPath, `% Archivo: ${normalizedName}\n`);
      await refreshProjectTree(currentProject.path);
      setCreateEntry(null);
      await handleSelectFile(newPath);
    } else {
      await window.lumenAPI.createFolder(newPath);
      await refreshProjectTree(currentProject.path);
      setCreateEntry(null);
    }
  };

  // Delete path
  const handleDeletePath = async (targetPath: string) => {
    if (!confirm(`¿Eliminar definitivamente "${targetPath.split('/').pop()}"?`)) return;
    await window.lumenAPI.deletePath(targetPath);
    setOpenTabs((prev) => prev.filter((t) => t !== targetPath));
    if (activeFilePath === targetPath) setActiveFilePath(null);
    await refreshProjectTree(currentProject!.path);
  };

  // Rename path
  const handleRenamePath = async (oldPath: string, newPath: string) => {
    await window.lumenAPI.renamePath(oldPath, newPath);
    setOpenTabs((prev) => prev.map((t) => (t === oldPath ? newPath : t)));
    if (activeFilePath === oldPath) setActiveFilePath(newPath);
    await refreshProjectTree(currentProject!.path);
  };

  // Create project from template
  const handleCreateProject = async (name: string, location: string, templateId: TemplateId) => {
    const metadata = await window.lumenAPI.createProjectFromTemplate({
      templateId,
      targetPath: location,
      projectName: name,
    });

    // Only remember the folder once it is known to be writable.
    localStorage.setItem('lumen_custom_projects_folder', location);
    setCustomProjectsFolder(location);

    await handleOpenProject(metadata.path);
  };

  // Quick create from welcome screen opens the modal with pre-selected template
  const handleQuickCreate = async (templateId: TemplateId) => {
    setSelectedModalTemplate(templateId);
    setIsNewProjectModalOpen(true);
  };

  // Save current project copy in a custom folder
  const handleSaveProjectAs = async (newProjectName: string, targetDirectory: string) => {
    if (!currentProject) return;

    // Save active changes first
    await handleSaveCurrentFile();

    const metadata = await window.lumenAPI.copyProjectToDirectory({
      sourcePath: currentProject.path,
      targetDirectory,
      newProjectName,
    });

    localStorage.setItem('lumen_custom_projects_folder', targetDirectory);
    setCustomProjectsFolder(targetDirectory);

    await handleOpenProject(metadata.path);
  };

  // Save active file (.tex) as a standalone file in any custom folder
  const handleSaveActiveFileAs = async () => {
    if (!activeFilePath) return;
    const currentContent = fileContents[activeFilePath] || '';
    const defaultFileName = activeFilePath.split('/').pop() || 'documento.tex';
    const savedPath = await window.lumenAPI.saveFileAs({
      defaultPath: defaultFileName,
      content: currentContent,
    });
    if (savedPath && currentProject) {
      await refreshProjectTree(currentProject.path);
    }
  };

  // Open directory dialog
  const handleOpenFolderDialog = async () => {
    const selected = await window.lumenAPI.selectDirectory();
    if (selected) {
      handleOpenProject(selected);
    }
  };

  // Export PDF
  const handleExportPdf = async () => {
    if (!compileResult?.pdfPath) {
      alert('Primero debes compilar el documento para generar el archivo PDF.');
      return;
    }
    try {
      const exported = await window.lumenAPI.exportPdf(compileResult.pdfPath);
      if (!exported) {
        alert('No se pudo exportar el PDF. Verifica que el archivo compilado exista.');
      }
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('No se pudo exportar el PDF.');
    }
  };

  // Collaboration Host Server Actions
  const handleStartCollabServer = async (port = 8765, token?: string) => {
    const res = await window.lumenAPI.startCollabServer({ port, token });
    if (res.success) {
      await connectToCollab('127.0.0.1', res.port, res.token, userName);
      const updatedStatus = await window.lumenAPI.getCollabStatus();
      setCollabStatus(updatedStatus);
    }
  };

  const handleStopCollabServer = async () => {
    await window.lumenAPI.stopCollabServer();
    setCollabStatus({ isHosting: false, clients: [] });
  };

  const connectToCollab = (host: string, port: number, token: string, nick: string): Promise<boolean> => {
    return new Promise((resolve) => {
      let settled = false;
      let rejectedReason = '';
      const finish = (result: boolean) => {
        if (settled) return;
        settled = true;
        if (timeout !== undefined) window.clearTimeout(timeout);
        resolve(result);
      };
      let ws: WebSocket;
      let timeout: number | undefined;
      try {
      ws = new WebSocket(`ws://${host}:${port}/?token=${encodeURIComponent(token)}&name=${encodeURIComponent(nick)}`);
      timeout = window.setTimeout(() => { ws.close(); finish(false); }, 6000);
      collabWsRef.current = ws;

      ws.onopen = () => {
        setIsConnectedRemote(true);
        if (currentProject && activeFilePath) {
          ws.send(JSON.stringify({
            type: 'lumen:session-info', projectName: currentProject.name,
            fileName: activeFilePath.split('/').pop(), content: fileContentsRef.current[activeFilePath] || '', sharedFilePath: activeFilePath,
          }));
        }
        for (const [filePath, doc] of yDocsRef.current) {
          ws.send(JSON.stringify({
            type: 'lumen:y-sync-init',
            filePath,
            update: encodeUpdate(Y.encodeStateAsUpdate(doc)),
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'lumen:ready') finish(true);
          if (msg.type === 'lumen:session-info' && typeof msg.fileName === 'string') {
            sharedSessionRef.current = { projectName: msg.projectName || 'Documento compartido', fileName: msg.fileName, content: msg.content || '', sharedFilePath: msg.sharedFilePath || msg.fileName };
          }
          if (msg.type === 'lumen:y-update' && msg.filePath && msg.update) {
            const localPath = localPathBySharedRef.current.get(msg.filePath) || (currentProjectRef.current && msg.filePath.startsWith(`${currentProjectRef.current.path}/`) ? msg.filePath : null);
            if (!localPath) return;
            if (!yDocsRef.current.has(localPath)) {
              ensureCollabDocument(localPath, '');
            }
            const existing = yDocsRef.current.get(localPath);
            if (!existing) return;
            applyingRemoteUpdateRef.current = true;
            try {
              Y.applyUpdate(existing, decodeUpdate(msg.update), 'remote');
              const content = existing.getText('content').toString();
              setFileContents((prev) => ({ ...prev, [localPath]: content }));
              setIsDirty((prev) => ({ ...prev, [localPath]: true }));
              void window.lumenAPI.writeFile(localPath, content);
            } finally {
              applyingRemoteUpdateRef.current = false;
            }
          }
          if (msg.type === 'lumen:cursor' && msg.peerId) {
            const mappedCursor = { ...msg.cursor, filePath: localPathBySharedRef.current.get(msg.cursor.filePath) || msg.cursor.filePath };
            setCollabStatus((prev) => ({ ...prev, clients: prev.clients.map((client) => client.id === msg.peerId ? { ...client, name: msg.name || client.name, color: msg.color || client.color, cursor: mappedCursor } : client) }));
          }
          if (msg.type === 'lumen:cursor-remove' && msg.peerId) {
            setCollabStatus((prev) => ({ ...prev, clients: prev.clients.map((client) => client.id === msg.peerId ? { ...client, cursor: undefined } : client) }));
          }
          if (msg.type === 'lumen:peer-list') {
            setCollabStatus((prev) => ({ ...prev, clients: msg.clients }));
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = (event) => {
        setIsConnectedRemote(false);
        if (event.code === 4001) rejectedReason = 'Token incorrecto: verifica la contraseña con quien hospeda la sesión.';
        else if (event.code === 4002) rejectedReason = 'La sesión está llena (máximo 5 participantes).';
        else if (event.code !== 1000) rejectedReason = 'No se pudo alcanzar el servidor. Comprueba IP, puerto y firewall; si el servidor está en otra red, el descubrimiento local no lo encontrará.';
        const message = rejectedReason || 'La sesión se cerró antes de completar la conexión.';
        collabConnectionErrorRef.current = message;
        setCollabConnectionError(message);
        finish(false);
      };
      } catch (err) {
        if (timeout !== undefined) window.clearTimeout(timeout);
      console.error('Remote collab connection failed:', err);
        finish(false);
      }
    });
  };

  const handleConnectRemote = async (host: string, port: number, token: string, nick: string): Promise<boolean | string> => {
    collabConnectionErrorRef.current = '';
    setCollabConnectionError('');
    if (collabWsRef.current && collabWsRef.current.readyState < WebSocket.CLOSING) collabWsRef.current.close();
    sharedSessionRef.current = null;
    const connected = await connectToCollab(host, port, token, nick);
    if (!connected) {
      if (!collabConnectionErrorRef.current) {
        collabConnectionErrorRef.current = 'No se pudo alcanzar el servidor. Comprueba IP, puerto y firewall; el descubrimiento local requiere que la red permita broadcasts.';
        setCollabConnectionError(collabConnectionErrorRef.current);
      }
      return collabConnectionErrorRef.current;
    }
    const session = sharedSessionRef.current as { projectName: string; fileName: string; content: string; sharedFilePath: string } | null;
    if (!session) {
      collabWsRef.current?.close();
      setIsConnectedRemote(false);
      return false;
    }
    const base = await window.lumenAPI.getDefaultProjectPath();
    const localProjectPath = `${base}/LUMEN-${session.projectName.replace(/[^\w-]/g, '-')}-compartido`;
    await window.lumenAPI.createFolder(localProjectPath);
    const localFile = `${localProjectPath}/${session.fileName}`;
    await window.lumenAPI.createFile(localFile, session.content);
    localPathBySharedRef.current.set(session.sharedFilePath, localFile);
    setCollabStatus((prev) => ({ ...prev, clients: prev.clients.map((client) => client.cursor?.filePath === session.sharedFilePath ? { ...client, cursor: { ...client.cursor, filePath: localFile } } : client) }));
    ensureCollabDocument(localFile, '');
    await handleOpenProject(localProjectPath);
    const joinSocket = collabWsRef.current;
    if (joinSocket?.readyState === WebSocket.OPEN) joinSocket.send(JSON.stringify({ type: 'lumen:y-sync-request' }));
    setIsJoinCollabOpen(false);
    return true;
  };

  const handleCursorChange = (position: { lineNumber: number; column: number }) => {
    const socket = collabWsRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || !activeFilePath) return;
    if (cursorSendTimerRef.current) clearTimeout(cursorSendTimerRef.current);
    cursorSendTimerRef.current = setTimeout(() => {
      const sharedPath = [...localPathBySharedRef.current.entries()].find(([, localPath]) => localPath === activeFilePath)?.[0] || activeFilePath;
      socket.send(JSON.stringify({ type: 'lumen:cursor', cursor: { filePath: sharedPath, ...position } }));
    }, 45);
  };

  const handleCheckUpdates = async () => {
    setUpdateState((state) => ({ ...state, checking: true, message: '' }));
    try {
      const result = await window.lumenAPI.checkForUpdates();
      setUpdateState({ checking: false, installing: false, available: result.updateAvailable, version: result.currentVersion, canInstall: result.canInstall, message: result.updateAvailable ? `Disponible: versión ${result.latestVersion}` : 'Tienes la versión más reciente.' });
    } catch (error) {
      setUpdateState((state) => ({ ...state, checking: false, message: error instanceof Error ? error.message : 'No se pudo consultar GitHub.' }));
    }
  };

  const handleInstallUpdate = async () => {
    setUpdateState((state) => ({ ...state, installing: true, message: 'Descargando e instalando. Puede aparecer una solicitud gráfica de contraseña.' }));
    try {
      await window.lumenAPI.installUpdate();
    } catch (error) {
      setUpdateState((state) => ({ ...state, installing: false, message: error instanceof Error ? error.message : 'No se pudo instalar la actualización.' }));
    }
  };

  useEffect(() => {
    if (!currentProject) void handleCheckUpdates();
  }, [currentProject]);

  // Render Welcome Screen if no project is active
  if (!currentProject) {
    return (
      <div className="w-screen h-screen">
        <WelcomeScreen
          recentProjects={recentProjects}
          onOpenProject={handleOpenProject}
          onOpenFolderDialog={handleOpenFolderDialog}
          onNewProjectModal={() => setIsNewProjectModalOpen(true)}
          onQuickCreateFromTemplate={handleQuickCreate}
          compilers={compilers}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          updateState={updateState}
          onCheckUpdates={handleCheckUpdates}
          onInstallUpdate={handleInstallUpdate}
          onToggleFavorite={handleToggleFavorite}
          onJoinCollab={() => setIsJoinCollabOpen(true)}
        />

        <CollabModal
          isOpen={isJoinCollabOpen}
          onClose={() => setIsJoinCollabOpen(false)}
          status={{ isHosting: false, clients: [] }}
          onStartServer={handleStartCollabServer}
          onStopServer={handleStopCollabServer}
          onConnectRemote={handleConnectRemote}
          currentUserName={userName}
          onChangeUserName={setUserName}
          isConnectedToRemote={isConnectedRemote}
          connectionError={collabConnectionError}
          mode="join"
        />

        <NewProjectModal
          isOpen={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
          onCreate={handleCreateProject}
          defaultLocation={customProjectsFolder}
          initialTemplate={selectedModalTemplate}
        />
      </div>
    );
  }

  // Active Project Workspace
  const activeFileName = activeFilePath ? activeFilePath.split('/').pop() : undefined;

  return (
    <div className="w-screen h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Top Header Bar */}
      <HeaderBar
        projectName={currentProject.name}
        activeFileName={activeFileName}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isDiagnosticOpen={isDiagnosticOpen}
        onToggleDiagnostic={() => setIsDiagnosticOpen(!isDiagnosticOpen)}
        errorCount={compileResult?.errors.length || 0}
        warningCount={compileResult?.warnings.length || 0}
        isCompiling={isCompiling}
        lastCompileSuccess={compileResult ? compileResult.success : null}
        durationMs={compileResult?.durationMs}
        onCompile={handleManualCompile}
        compilers={compilers}
        selectedCompiler={selectedCompiler}
        onSelectCompiler={setSelectedCompiler}
        autoCompile={autoCompile}
        onToggleAutoCompile={() => setAutoCompile(!autoCompile)}
        onOpenCollab={() => setIsCollabModalOpen(true)}
        collabPeerCount={collabStatus.clients.length}
        isHostingCollab={collabStatus.isHosting}
        collabParticipants={collabStatus.clients.filter((participant) => !participant.isHost)}
        currentUserName={userName}
        isConnectedRemote={isConnectedRemote}
        onExportPdf={handleExportPdf}
        onSaveProjectAs={() => setIsSaveAsModalOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        zoom={zoom}
        onZoomChange={setZoom}
        onFitWidth={handleFitWidth}
        onBackToWelcome={() => setCurrentProject(null)}
      />

      {/* Main Body with Sidebar & SplitView */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Collapsible Sidebar File Explorer */}
        {isSidebarOpen && (
          <Sidebar
            files={files}
            activeFilePath={activeFilePath}
            onSelectFile={handleSelectFile}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onDeletePath={handleDeletePath}
            onRenamePath={handleRenamePath}
            onSaveProjectAs={() => setIsSaveAsModalOpen(true)}
            projectPath={currentProject.path}
          />
        )}

        {/* Resizable Split Panes: Editor on Left, PDF Preview on Right */}
        <SplitView
          left={
            <div className="h-full flex flex-col overflow-hidden bg-card/20">
              {/* Document Tab Bar */}
              <div className="h-8 border-b border-border bg-card/40 flex items-center px-1 overflow-x-auto select-none space-x-1">
                {openTabs.map((tabPath) => {
                  const fileName = tabPath.split('/').pop() || 'archivo';
                  const isActive = activeFilePath === tabPath;
                  const dirty = isDirty[tabPath];

                  return (
                    <div
                      key={tabPath}
                      onClick={() => handleSelectFile(tabPath)}
                      className={`group flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs cursor-pointer border transition ${
                        isActive
                          ? 'bg-background border-border text-foreground font-medium shadow-sm'
                          : 'border-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate max-w-[120px]">{fileName}</span>
                      {dirty && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                      <button
                        onClick={(e) => handleCloseTab(tabPath, e)}
                        title={`Cerrar ${fileName}`}
                        aria-label={`Cerrar ${fileName}`}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Visual Element Insertion Toolbar */}
              <VisualToolbar
                onInsertCode={handleInsertCode}
                onOpenImagePicker={() => setIsImageModalOpen(true)}
                onOpenTableModal={() => setIsTableModalOpen(true)}
                onOpenMathModal={handleOpenMathModal}
              />

              {/* Code Editor */}
              <div className="flex-1 overflow-hidden relative">
                {activeFilePath ? (
                  <LatexEditor
                    value={fileContents[activeFilePath] || ''}
                    onChange={handleCodeChange}
                    onCompile={handleManualCompile}
                    onSave={handleSaveCurrentFile}
                    theme={theme}
                    diagnostics={compileResult?.errors || []}
                    editorRef={editorRef}
                    onCursorChange={handleCursorChange}
                    remoteCursors={collabStatus.clients.filter((user) => user.cursor?.filePath === activeFilePath).map((user) => ({ id: user.id, name: user.name, color: user.color, lineNumber: user.cursor!.lineNumber, column: user.cursor!.column }))}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    Selecciona un archivo del explorador lateral para editar.
                  </div>
                )}
              </div>

              {/* Bottom Diagnostics / Error Panel */}
              {isDiagnosticOpen && (
                <DiagnosticPanel
                  isOpen={isDiagnosticOpen}
                  onClose={() => setIsDiagnosticOpen(false)}
                  errors={compileResult?.errors || []}
                  warnings={compileResult?.warnings || []}
                  rawLog={compileResult?.log || ''}
                  onJumpToLine={handleJumpToLine}
                />
              )}
            </div>
          }
          right={
            <PdfViewer
              pdfBase64={compileResult?.pdfBufferBase64 || null}
              isCompiling={isCompiling}
              zoom={zoom}
              onZoomChange={setZoom}
              onFitWidth={handleFitWidth}
              fitWidthSignal={fitWidthSignal}
              errorCount={compileResult?.errors.length || 0}
              onOpenDiagnostics={() => setIsDiagnosticOpen(true)}
              onManualCompile={handleManualCompile}
            />
          }
        />
      </div>

      {/* Modals */}
      <TableEditorModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        onInsertTable={handleInsertCode}
      />

      <ImageInsertModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onInsertImage={handleInsertImage}
        projectPath={currentProject.path}
      />

      <MathInsertModal
        isOpen={isMathModalOpen}
        onClose={() => { setIsMathModalOpen(false); mathSelectionRef.current = null; }}
        onInsertMath={handleInsertCode}
      />

      <CreateEntryModal
        kind={createEntry?.kind || 'file'}
        isOpen={Boolean(createEntry)}
        onClose={() => setCreateEntry(null)}
        onSubmit={handleCreateEntrySubmit}
      />

      <CollabModal
        isOpen={isCollabModalOpen}
        onClose={() => setIsCollabModalOpen(false)}
        status={collabStatus}
        onStartServer={handleStartCollabServer}
        onStopServer={handleStopCollabServer}
        onConnectRemote={handleConnectRemote}
        currentUserName={userName}
        onChangeUserName={setUserName}
        isConnectedToRemote={isConnectedRemote}
        connectionError={collabConnectionError}
        mode="host"
      />

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreate={handleCreateProject}
        defaultLocation={customProjectsFolder}
        initialTemplate={selectedModalTemplate}
      />

      <SaveAsModal
        isOpen={isSaveAsModalOpen}
        onClose={() => setIsSaveAsModalOpen(false)}
        currentProjectName={currentProject.name}
        defaultLocation={customProjectsFolder || currentProject.path.substring(0, currentProject.path.lastIndexOf('/'))}
        activeFileName={activeFileName}
        onSaveProjectAs={handleSaveProjectAs}
        onSaveActiveFileAs={handleSaveActiveFileAs}
      />
    </div>
  );
};

export default App;
