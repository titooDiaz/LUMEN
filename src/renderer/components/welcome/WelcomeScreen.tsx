import React, { useState } from 'react';
import {
  FolderOpen,
  Plus,
  Clock,
  Star,
  Search,
  Sparkles,
  GraduationCap,
  Award,
  Presentation,
  FileText,
  ChevronRight,
  Trash2,
  Cpu,
  CheckCircle2,
  RefreshCw,
  Download,
  AlertCircle,
  Github,
} from 'lucide-react';
import { CompilerInfo, ProjectMetadata, TemplateId } from '../../../shared/types';

interface WelcomeScreenProps {
  recentProjects: ProjectMetadata[];
  onOpenProject: (projectPath: string) => void;
  onOpenFolderDialog: () => void;
  onNewProjectModal: () => void;
  onQuickCreateFromTemplate: (templateId: TemplateId) => void;
  compilers: CompilerInfo[];
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  updateState: { checking: boolean; installing: boolean; available: boolean; version: string; canInstall: boolean; message: string };
  onCheckUpdates: () => void;
  onInstallUpdate: () => void;
  onToggleFavorite: (project: ProjectMetadata) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  recentProjects,
  onOpenProject,
  onOpenFolderDialog,
  onNewProjectModal,
  onQuickCreateFromTemplate,
  compilers,
  theme,
  onToggleTheme,
  updateState,
  onCheckUpdates,
  onInstallUpdate,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites'>('all');

  const filteredProjects = recentProjects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.path.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeFilter === 'favorites') {
      return matchesSearch && p.isFavorite;
    }
    return matchesSearch;
  });

  const availableCompilers = compilers.filter((c) => c.available);

  return (
    <div className="relative w-full h-full bg-background flex flex-col overflow-y-auto select-none">
      {/* Top Banner / Window Drag */}
      <div className="h-12 border-b border-border px-6 flex items-center justify-between drag-region">
        <div className="flex items-center space-x-2.5 no-drag">
          <div className="w-6 h-6 rounded-md bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xs">
            L
          </div>
          <span className="font-bold text-sm tracking-tight text-foreground">LUMEN</span>
          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            LaTeX Desktop
          </span>
        </div>

        <div className="flex items-center space-x-2 no-drag text-xs text-muted-foreground">
          <span>Linux Ubuntu & Mint</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl w-full mx-auto p-8 space-y-10 flex-1">
        {/* Hero Section */}
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Modern LaTeX Desktop Editor
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Entorno profesional de alto rendimiento para redacción científica, tesis y artículos académicos.
            Edición en tiempo real, herramientas visuales sin memorizar comandos y colaboración descentralizada.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <button
            onClick={onNewProjectModal}
            title="Crear un proyecto nuevo a partir de una plantilla"
            className="p-5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition text-left flex items-start space-x-3.5 group shadow-sm"
          >
            <div className="p-2.5 rounded-lg bg-primary text-primary-foreground group-hover:scale-105 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-sm text-foreground block group-hover:text-primary transition-colors">
                Nuevo Proyecto
              </span>
              <span className="text-xs text-muted-foreground mt-0.5 block">
                Crear desde una plantilla optimizada
              </span>
            </div>
          </button>

          <button
            onClick={onOpenFolderDialog}
            title="Buscar y abrir una carpeta de proyecto"
            className="p-5 rounded-xl border border-border bg-card/60 hover:bg-accent/60 transition text-left flex items-start space-x-3.5 group shadow-sm"
          >
            <div className="p-2.5 rounded-lg bg-secondary text-foreground group-hover:scale-105 transition-transform">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-sm text-foreground block group-hover:text-primary transition-colors">
                Abrir Carpeta Existente
              </span>
              <span className="text-xs text-muted-foreground mt-0.5 block">
                Abrir cualquier directorio LaTeX de tu disco
              </span>
            </div>
          </button>

          <div className="p-5 rounded-xl border border-border bg-card/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Motores TeX Detectados</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {availableCompilers.length} activos
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {compilers.map((c) => (
                <span
                  key={c.type}
                  className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${
                    c.available
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-secondary/40 border-border text-muted-foreground/60 line-through'
                  }`}
                >
                  {c.name.split(' ')[0]}
                </span>
              ))}
            </div>
          </div>
        </div>

        <section className="rounded-xl border border-border bg-card/50 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary"><Download className="w-5 h-5" /></div>
            <div>
              <h2 className="font-semibold text-sm text-foreground">Actualizaciones de LUMEN</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {updateState.message || (updateState.checking ? 'Buscando una versión nueva…' : 'Versión instalada: ' + updateState.version)}
              </p>
              {updateState.available && !updateState.canInstall && <p className="text-xs text-amber-500 mt-1"><AlertCircle className="inline w-3 h-3 mr-1" />La versión está publicada, pero aún no tiene instalador automático.</p>}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={onCheckUpdates} disabled={updateState.checking || updateState.installing} className="px-3 py-2 rounded-lg border border-border text-xs font-medium hover:bg-accent disabled:opacity-50 flex items-center gap-2">
              <RefreshCw className={`w-3.5 h-3.5 ${updateState.checking ? 'animate-spin' : ''}`} />Buscar actualización
            </button>
            {updateState.available && updateState.canInstall && <button onClick={onInstallUpdate} disabled={updateState.installing} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
              <Download className="w-3.5 h-3.5" />{updateState.installing ? 'Instalando…' : 'Actualizar ahora'}
            </button>}
          </div>
        </section>

        {/* Quick Starter Templates */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Comenzar con Plantilla Rápida
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => onQuickCreateFromTemplate('article')}
              title="Crear un artículo científico"
              className="p-3.5 rounded-lg border border-border bg-card/40 hover:bg-card hover:border-primary/50 transition text-left group"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                  Artículo Científico
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2">Formato estándar de paper académico.</p>
            </button>

            <button
              onClick={() => onQuickCreateFromTemplate('thesis')}
              title="Crear una tesis con estructura modular"
              className="p-3.5 rounded-lg border border-border bg-card/40 hover:bg-card hover:border-primary/50 transition text-left group"
            >
              <div className="flex items-center space-x-2 mb-2">
                <GraduationCap className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                  Tesis Completa
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2">Estructura modular con capítulos y bib.</p>
            </button>

            <button
              onClick={() => onQuickCreateFromTemplate('ieee')}
              title="Crear un artículo con formato IEEE"
              className="p-3.5 rounded-lg border border-border bg-card/40 hover:bg-card hover:border-primary/50 transition text-left group"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Award className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                  IEEE Paper
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2">2 Columnas para conferencias IEEE.</p>
            </button>

            <button
              onClick={() => onQuickCreateFromTemplate('presentation')}
              title="Crear una presentación Beamer"
              className="p-3.5 rounded-lg border border-border bg-card/40 hover:bg-card hover:border-primary/50 transition text-left group"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Presentation className="w-4 h-4 text-rose-400" />
                <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                  Beamer Slides
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2">Diapositivas y presentaciones LaTeX.</p>
            </button>
          </div>
        </div>

        {/* Recent Projects Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center space-x-4 text-xs font-semibold">
              <button
                onClick={() => setActiveFilter('all')}
                className={`flex items-center space-x-1.5 pb-2 -mb-2 border-b-2 transition ${
                  activeFilter === 'all'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Documentos Recientes ({recentProjects.length})</span>
              </button>
              <button
                onClick={() => setActiveFilter('favorites')}
                className={`flex items-center space-x-1.5 pb-2 -mb-2 border-b-2 transition ${
                  activeFilter === 'favorites'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>Favoritos</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar proyecto o ruta..."
                title="Filtrar los proyectos recientes por nombre o ruta"
                className="w-full bg-secondary/40 border border-border rounded-md pl-8 pr-3 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Project List */}
          {filteredProjects.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground bg-secondary/10 rounded-xl border border-dashed border-border space-y-2">
              <FileText className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-xs font-medium">No se encontraron proyectos recientes.</p>
              <p className="text-[11px]">Crea un nuevo proyecto o abre una carpeta existente para comenzar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {filteredProjects.map((proj) => (
                <div
                  key={proj.id || proj.path}
                  onClick={() => onOpenProject(proj.path)}
                  title={`Abrir proyecto ${proj.name}`}
                  className="p-3.5 rounded-lg border border-border bg-card/40 hover:bg-card hover:border-primary/40 transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2 rounded-md bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-xs text-foreground block truncate group-hover:text-primary transition-colors">
                        {proj.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground block truncate font-mono">
                        {proj.path}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleFavorite(proj);
                      }}
                      title={proj.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                      aria-label={proj.isFavorite ? `Quitar ${proj.name} de favoritos` : `Agregar ${proj.name} a favoritos`}
                      aria-pressed={Boolean(proj.isFavorite)}
                      className="rounded p-1 text-amber-400 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Star className={`w-4 h-4 ${proj.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(proj.lastOpened).toLocaleDateString()}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => void window.lumenAPI.openExternal('https://github.com/titooDiaz/LUMEN')}
        title="Abrir el repositorio de LUMEN en GitHub"
        aria-label="Abrir el repositorio de LUMEN en GitHub"
        className="fixed bottom-5 right-5 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition hover:scale-105 hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Github className="h-6 w-6" />
      </button>
    </div>
  );
};
