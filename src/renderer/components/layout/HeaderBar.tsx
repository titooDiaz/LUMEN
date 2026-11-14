import React from 'react';
import {
  Play,
  RotateCcw,
  Share2,
  Download,
  FolderTree,
  FolderDown,
  Sun,
  Moon,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Users,
  Terminal,
} from 'lucide-react';
import { CompilerType, CompilerInfo } from '../../../shared/types';

interface HeaderBarProps {
  projectName: string;
  activeFileName?: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isDiagnosticOpen: boolean;
  onToggleDiagnostic: () => void;
  errorCount: number;
  warningCount: number;
  isCompiling: boolean;
  lastCompileSuccess: boolean | null;
  durationMs?: number;
  onCompile: () => void;
  compilers: CompilerInfo[];
  selectedCompiler: CompilerType;
  onSelectCompiler: (compiler: CompilerType) => void;
  autoCompile: boolean;
  onToggleAutoCompile: () => void;
  onOpenCollab: () => void;
  collabPeerCount: number;
  isHostingCollab: boolean;
  onExportPdf: () => void;
  onSaveProjectAs?: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onFitWidth: () => void;
  onBackToWelcome: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  projectName,
  activeFileName,
  isSidebarOpen,
  onToggleSidebar,
  isDiagnosticOpen,
  onToggleDiagnostic,
  errorCount,
  warningCount,
  isCompiling,
  lastCompileSuccess,
  durationMs,
  onCompile,
  compilers,
  selectedCompiler,
  onSelectCompiler,
  autoCompile,
  onToggleAutoCompile,
  onOpenCollab,
  collabPeerCount,
  isHostingCollab,
  onExportPdf,
  onSaveProjectAs,
  theme,
  onToggleTheme,
  zoom,
  onZoomChange,
  onFitWidth,
  onBackToWelcome,
}) => {
  return (
    <header className="h-12 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between px-3 select-none z-30 drag-region">
      {/* Left section: App branding, sidebar toggle, project info */}
      <div className="flex items-center space-x-2 no-drag">
        <button
          onClick={onBackToWelcome}
          className="flex items-center space-x-2 px-2 py-1 rounded-md hover:bg-accent/60 transition group text-left"
          title="Volver a Proyectos"
        >
          <div className="w-5 h-5 rounded bg-primary/20 border border-primary/50 flex items-center justify-center text-primary font-bold text-xs">
            L
          </div>
          <span className="font-semibold text-sm tracking-tight group-hover:text-primary transition-colors">
            LUMEN
          </span>
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        <button
          onClick={onToggleSidebar}
          className={`p-1.5 rounded-md transition ${
            isSidebarOpen
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
          title="Alternar Explorador de Archivos (Ctrl+B)"
        >
          <FolderTree className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-1.5 text-xs text-muted-foreground max-w-xs truncate">
          <span className="font-medium text-foreground truncate">{projectName}</span>
          {activeFileName && (
            <>
              <span>/</span>
              <span className="truncate text-foreground/80">{activeFileName}</span>
            </>
          )}
        </div>
      </div>

      {/* Middle section: Compiler selection, Compile action, status badge */}
      <div className="flex items-center space-x-2 no-drag">
        {/* Compiler selector */}
        <div className="relative">
          <select
            value={selectedCompiler}
            onChange={(e) => onSelectCompiler(e.target.value as CompilerType)}
            className="text-xs bg-secondary/80 hover:bg-secondary border border-border rounded-md px-2 py-1 pr-6 text-foreground font-medium appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
            title="Seleccionar motor de compilación LaTeX"
          >
            {compilers.map((c) => (
              <option key={c.type} value={c.type} disabled={!c.available}>
                {c.name} {c.available ? '' : '(no detectado)'}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-muted-foreground text-[10px]">
            ▼
          </div>
        </div>

        {/* Compile button */}
        <button
          onClick={onCompile}
          disabled={isCompiling}
          className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary-hover active:scale-[0.98] transition font-medium text-xs shadow-sm disabled:opacity-50"
          title="Compilar Documento (Ctrl+Enter)"
        >
          {isCompiling ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>{isCompiling ? 'Compilando...' : 'Compilar'}</span>
        </button>

        {/* Auto compile toggle */}
        <button
          onClick={onToggleAutoCompile}
          className={`px-2 py-1 rounded-md text-xs font-medium border transition ${
            autoCompile
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-secondary/40 border-border text-muted-foreground hover:text-foreground'
          }`}
          title="Compilar automáticamente al editar"
        >
          Auto
        </button>

        {/* Status Pill */}
        {isCompiling ? (
          <div className="flex items-center space-x-1.5 px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Generando PDF...</span>
          </div>
        ) : lastCompileSuccess === true ? (
          <div
            onClick={onToggleDiagnostic}
            className="flex items-center space-x-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20 transition"
            title="Compilación exitosa. Clic para ver registro."
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Éxito {durationMs ? `(${durationMs}ms)` : ''}</span>
          </div>
        ) : lastCompileSuccess === false ? (
          <button
            onClick={onToggleDiagnostic}
            className="flex items-center space-x-1.5 px-2 py-1 rounded-full bg-destructive/15 text-destructive-foreground text-xs font-medium border border-destructive/30 hover:bg-destructive/25 transition cursor-pointer"
            title="Errores detectados. Clic para abrir diagnóstico."
          >
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span className="text-red-400 font-semibold">{errorCount} error{errorCount !== 1 ? 'es' : ''}</span>
          </button>
        ) : null}
      </div>

      {/* Right section: PDF Zoom controls, Export, Collaboration, Diagnostics, Theme */}
      <div className="flex items-center space-x-1.5 no-drag">
        {/* PDF Zoom */}
        <div className="flex items-center bg-secondary/60 border border-border rounded-md px-1 py-0.5">
          <button
            onClick={() => onZoomChange(Math.max(0.4, zoom - 0.15))}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition"
            title="Reducir zoom"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono w-10 text-center text-muted-foreground select-none">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(2.5, zoom + 0.15))}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onFitWidth}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition border-l border-border ml-0.5"
            title="Ajustar al ancho"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>

        {/* Save in Custom Folder / Save As */}
        {onSaveProjectAs && (
          <button
            onClick={onSaveProjectAs}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition flex items-center space-x-1"
            title="Guardar en carpeta personalizada... (Ctrl+Shift+S)"
          >
            <FolderDown className="w-4 h-4 text-primary" />
          </button>
        )}

        {/* Export PDF */}
        <button
          onClick={onExportPdf}
          className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition"
          title="Exportar PDF compilado"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Real-time Collaboration Share */}
        <button
          onClick={onOpenCollab}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition ${
            isHostingCollab
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : collabPeerCount > 0
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-secondary/60 border-border text-foreground hover:bg-accent'
          }`}
          title="Colaboración en tiempo real (P2P Host)"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Compartir</span>
          {collabPeerCount > 0 && (
            <span className="px-1 py-0.2 rounded-full text-[10px] bg-primary text-primary-foreground font-bold">
              {collabPeerCount}
            </span>
          )}
        </button>

        {/* Diagnostics Drawer toggle */}
        <button
          onClick={onToggleDiagnostic}
          className={`p-1.5 rounded-md transition relative ${
            isDiagnosticOpen
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
          title="Panel de Diagnóstico y Errores"
        >
          <Terminal className="w-4 h-4" />
          {errorCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>

        {/* Dark / Light Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition"
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
