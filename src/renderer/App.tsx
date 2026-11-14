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
import { X, FileCode } from 'lucide-react';

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

  // Modals state
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isMathModalOpen, setIsMathModalOpen] = useState(false);
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // Collaboration state
  const [collabStatus, setCollabStatus] = useState<CollabStatus>({
    isHosting: false,
    clients: [],
  });
  const [userName, setUserName] = useState<string>('Autor Local');
  const [isConnectedRemote, setIsConnectedRemote] = useState<boolean>(false);
  const collabWsRef = useRef<WebSocket | null>(null);
  const yDocsRef = useRef<Map<string, Y.Doc>>(new Map());
  const applyingRemoteUpdateRef = useRef(false);

  // Monaco editor reference
  const editorRef = useRef<monacoType.editor.IStandaloneCodeEditor | null>(null);

  // Auto-compile debounce timer
  const compileTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initial load: fetch recent projects & detected compilers
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
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, []);

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

  // Compile project function
  const triggerCompile = async (
    project: ProjectMetadata,
    mainFile: string,
    currentCode: string,
    compiler: CompilerType
  ) => {
    if (isCompiling) return;
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
      setIsCompiling(false);
    }
  };

  const handleManualCompile = () => {
    if (!currentProject) return;
    void compileCurrentProject(currentProject);
  };

  const compileCurrentProject = async (project: ProjectMetadata) => {
    const mainFilePath = `${project.path}/${project.mainFile}`;
    const activeContent = activeFilePath ? fileContents[activeFilePath] : undefined;

    // Persist the file currently being edited before compiling. The compiler
    // must always receive main.tex, even when a section or bibliography tab
    // is active.
    if (activeFilePath && activeContent !== undefined && isDirty[activeFilePath]) {
      await window.lumenAPI.writeFile(activeFilePath, activeContent);
      setIsDirty((prev) => ({ ...prev, [activeFilePath]: false }));
    }

    const mainContent =
      activeFilePath === mainFilePath && activeContent !== undefined
        ? activeContent
        : await window.lumenAPI.readFile(mainFilePath);

    await triggerCompile(project, project.mainFile, mainContent, selectedCompiler);
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
    if (autoCompile && currentProject) {
      if (compileTimerRef.current) {
        clearTimeout(compileTimerRef.current);
      }
      compileTimerRef.current = setTimeout(async () => {
        // Save file to disk
        await window.lumenAPI.writeFile(activeFilePath, newCode);
        setIsDirty((prev) => ({ ...prev, [activeFilePath]: false }));
        // Compile the actual project entry point, not whichever tab is active.
        await compileCurrentProject(currentProject);
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
    const selection = editor.getSelection();
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
    editor.focus();
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
      collabWsRef.current.send(JSON.stringify({
        type: 'lumen:y-update',
        filePath,
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
    const fileName = prompt('Nombre del nuevo archivo (ej. capitulo1.tex o referencias.bib):');
    if (!fileName) return;

    const newPath = `${parentDir}/${fileName.trim()}`;
    await window.lumenAPI.createFile(newPath, `% Archivo: ${fileName}\n`);
    await refreshProjectTree(currentProject!.path);
    handleSelectFile(newPath);
  };

  // Create folder in project
  const handleCreateFolder = async (parentDir: string) => {
    const folderName = prompt('Nombre de la nueva carpeta:');
    if (!folderName) return;

    const newPath = `${parentDir}/${folderName.trim()}`;
    await window.lumenAPI.createFolder(newPath);
    await refreshProjectTree(currentProject!.path);
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
    handleOpenProject(metadata.path);
  };

  // Quick create from welcome screen
  const handleQuickCreate = async (templateId: TemplateId) => {
    const defaultDir = '/home/miguel/Documents';
    const name = `Proyecto-${templateId}-${Date.now().toString().slice(-4)}`;
    await handleCreateProject(name, defaultDir, templateId);
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
      const updatedStatus = await window.lumenAPI.getCollabStatus();
      setCollabStatus(updatedStatus);
      connectToCollab('127.0.0.1', res.port, res.token, userName);
    }
  };

  const handleStopCollabServer = async () => {
    await window.lumenAPI.stopCollabServer();
    setCollabStatus({ isHosting: false, clients: [] });
  };

  const connectToCollab = (host: string, port: number, token: string, nick: string) => {
    try {
      const ws = new WebSocket(`ws://${host}:${port}/?token=${token}&name=${encodeURIComponent(nick)}`);
      collabWsRef.current = ws;

      ws.onopen = () => {
        setIsConnectedRemote(true);
        ws.send(JSON.stringify({ type: 'lumen:y-sync-request' }));
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
          if (msg.type === 'lumen:y-update' && msg.filePath && msg.update) {
            if (!yDocsRef.current.has(msg.filePath)) {
              ensureCollabDocument(msg.filePath, '');
            }
            const existing = yDocsRef.current.get(msg.filePath);
            if (!existing) return;
            applyingRemoteUpdateRef.current = true;
            Y.applyUpdate(existing, decodeUpdate(msg.update), 'remote');
            const content = existing.getText('content').toString();
            setFileContents((prev) => ({ ...prev, [msg.filePath]: content }));
            setIsDirty((prev) => ({ ...prev, [msg.filePath]: true }));
            void window.lumenAPI.writeFile(msg.filePath, content);
            applyingRemoteUpdateRef.current = false;
          }
          if (msg.type === 'lumen:peer-list') {
            setCollabStatus((prev) => ({ ...prev, clients: msg.clients }));
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        setIsConnectedRemote(false);
      };
    } catch (err) {
      console.error('Remote collab connection failed:', err);
    }
  };

  const handleConnectRemote = (host: string, port: number, token: string, nick: string) => {
    connectToCollab(host, port, token, nick);
  };

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
        />

        <NewProjectModal
          isOpen={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
          onCreate={handleCreateProject}
          defaultLocation="/home/miguel/Documents"
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
        onExportPdf={handleExportPdf}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        zoom={zoom}
        onZoomChange={setZoom}
        onFitWidth={() => setZoom(1.1)}
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
                onOpenMathModal={() => setIsMathModalOpen(true)}
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
              onFitWidth={() => setZoom(1.1)}
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
        onClose={() => setIsMathModalOpen(false)}
        onInsertMath={handleInsertCode}
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
      />

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreate={handleCreateProject}
        defaultLocation="/home/miguel/Documents"
      />
    </div>
  );
};

export default App;
