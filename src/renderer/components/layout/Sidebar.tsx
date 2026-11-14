import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  FolderDown,
  FilePlus,
  FolderTree,
  ExternalLink,
} from 'lucide-react';
import { ProjectFile } from '../../../shared/types';

interface SidebarProps {
  files: ProjectFile[];
  activeFilePath: string | null;
  onSelectFile: (filePath: string) => void;
  onCreateFile: (parentDir: string) => void;
  onCreateFolder: (parentDir: string) => void;
  onDeletePath: (path: string) => void;
  onRenamePath: (oldPath: string, newPath: string) => void;
  onSaveProjectAs?: () => void;
  projectPath: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  activeFilePath,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onDeletePath,
  onRenamePath,
  onSaveProjectAs,
  projectPath,
}) => {
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const toggleFolder = (folderPath: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  const startRename = (file: ProjectFile, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPath(file.path);
    setEditName(file.name);
  };

  const submitRename = (file: ProjectFile) => {
    if (editName.trim() && editName !== file.name) {
      const parentDir = file.path.substring(0, file.path.lastIndexOf('/'));
      const newPath = `${parentDir}/${editName.trim()}`;
      onRenamePath(file.path, newPath);
    }
    setEditingPath(null);
  };

  const getFileIcon = (file: ProjectFile) => {
    if (file.isDirectory) {
      const isCollapsed = collapsedFolders[file.path];
      return isCollapsed ? (
        <Folder className="w-4 h-4 text-amber-400 shrink-0" />
      ) : (
        <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
      );
    }

    const ext = file.extension?.toLowerCase() || '';
    if (ext === '.tex') return <FileCode className="w-4 h-4 text-primary shrink-0" />;
    if (ext === '.bib') return <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />;
    if (['.png', '.jpg', '.jpeg', '.svg', '.pdf'].includes(ext)) {
      return <ImageIcon className="w-4 h-4 text-blue-400 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-muted-foreground shrink-0" />;
  };

  const renderTree = (items: ProjectFile[], level = 0) => {
    return items.map((file) => {
      const isSelected = activeFilePath === file.path;
      const isCollapsed = collapsedFolders[file.path];
      const isEditing = editingPath === file.path;

      return (
        <div key={file.path} className="select-none">
          <div
            onClick={() => {
              if (file.isDirectory) {
                toggleFolder(file.path);
              } else {
                onSelectFile(file.path);
              }
            }}
            style={{ paddingLeft: `${Math.max(8, level * 14)}px` }}
            className={`group flex items-center justify-between py-1 px-2 rounded-md text-xs cursor-pointer transition ${
              isSelected
                ? 'bg-primary/15 text-primary font-medium'
                : 'text-foreground/80 hover:bg-accent hover:text-foreground'
            }`}
          >
            <div className="flex items-center space-x-1.5 min-w-0 flex-1 mr-1">
              {file.isDirectory && (
                <span className="text-muted-foreground w-3 flex justify-center">
                  {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </span>
              )}
              {getFileIcon(file)}

              {isEditing ? (
                <input
                  type="text"
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => submitRename(file)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitRename(file);
                    if (e.key === 'Escape') setEditingPath(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-background border border-primary px-1 py-0.2 rounded text-xs text-foreground focus:outline-none w-full"
                />
              ) : (
                <span className="truncate">{file.name}</span>
              )}
            </div>

            {/* Hover Actions */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-0.5 transition shrink-0">
              {file.isDirectory && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateFile(file.path);
                    }}
                    className="p-1 hover:bg-background/80 rounded text-muted-foreground hover:text-foreground"
                    title="Nuevo archivo en esta carpeta"
                  >
                    <FilePlus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateFolder(file.path);
                    }}
                    className="p-1 hover:bg-background/80 rounded text-muted-foreground hover:text-foreground"
                    title="Nueva subcarpeta"
                  >
                    <FolderPlus className="w-3 h-3" />
                  </button>
                </>
              )}
              <button
                onClick={(e) => startRename(file, e)}
                className="p-1 hover:bg-background/80 rounded text-muted-foreground hover:text-foreground"
                title="Renombrar"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePath(file.path);
                }}
                className="p-1 hover:bg-background/80 rounded text-muted-foreground hover:text-red-400"
                title="Eliminar"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Render children if directory and not collapsed */}
          {file.isDirectory && !isCollapsed && file.children && (
            <div className="border-l border-border/40 ml-3">
              {renderTree(file.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="w-60 h-full border-r border-border bg-sidebar flex flex-col select-none z-10 text-xs">
      {/* Sidebar Header */}
      <div className="h-9 px-3 border-b border-sidebar-border flex items-center justify-between font-semibold text-muted-foreground">
        <div className="flex items-center space-x-1.5 uppercase tracking-wider text-[10px]">
          <FolderTree className="w-3.5 h-3.5 text-primary" />
          <span>Explorador</span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onCreateFile(projectPath)}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition"
            title="Nuevo Archivo (.tex / .bib)"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onCreateFolder(projectPath)}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition"
            title="Nueva Carpeta"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          {onSaveProjectAs && (
            <button
              onClick={onSaveProjectAs}
              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition"
              title="Guardar proyecto en carpeta personalizada..."
            >
              <FolderDown className="w-3.5 h-3.5 text-primary" />
            </button>
          )}
          <button
            onClick={() => window.lumenAPI.showInFileManager(projectPath)}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition"
            title="Abrir en el gestor de archivos de Linux"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tree view */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {files.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <span className="text-[11px]">Carpeta vacía. Crea un archivo para comenzar.</span>
          </div>
        ) : (
          renderTree(files)
        )}
      </div>
    </div>
  );
};
