import React, { useState, useEffect } from 'react';
import { X, FolderOpen, FolderDown, FileCode, Check } from 'lucide-react';

interface SaveAsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjectName: string;
  defaultLocation: string;
  activeFileName?: string | null;
  onSaveProjectAs: (newProjectName: string, targetDirectory: string) => Promise<void>;
  onSaveActiveFileAs?: () => Promise<void>;
}

export const SaveAsModal: React.FC<SaveAsModalProps> = ({
  isOpen,
  onClose,
  currentProjectName,
  defaultLocation,
  activeFileName,
  onSaveProjectAs,
  onSaveActiveFileAs,
}) => {
  const [name, setName] = useState(`${currentProjectName}-copia`);
  const [location, setLocation] = useState(defaultLocation);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(`${currentProjectName}-copia`);
      if (defaultLocation) {
        setLocation(defaultLocation);
      }
    }
  }, [isOpen, currentProjectName, defaultLocation]);

  if (!isOpen) return null;

  const handleSelectLocation = async () => {
    try {
      const selected = await window.lumenAPI.selectDirectory();
      if (selected) {
        setLocation(selected);
      }
    } catch (err) {
      console.error('Error selecting directory:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;
    setIsSubmitting(true);
    try {
      await onSaveProjectAs(name.trim(), location.trim());
      onClose();
    } catch (err) {
      console.error('Error saving project copy:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveFileOnly = async () => {
    if (!onSaveActiveFileAs) return;
    try {
      await onSaveActiveFileAs();
      onClose();
    } catch (err) {
      console.error('Error saving file as:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border shadow-2xl rounded-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-card/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <FolderDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Guardar en Carpeta Personalizada</h3>
              <p className="text-xs text-muted-foreground">Guarda una copia completa del proyecto en la carpeta que elijas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="text-muted-foreground font-medium block mb-1">Nombre de la Nueva Carpeta/Proyecto:</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-secondary/40 border border-border rounded-md px-2.5 py-1.5 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Mi-Proyecto-Latex"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-muted-foreground font-medium">Carpeta de Destino:</label>
            </div>
            <div className="flex space-x-1.5">
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="/ruta/personalizada"
                className="flex-1 bg-secondary/40 border border-border rounded-md px-2.5 py-1.5 text-foreground text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                title="Escribe la ruta o selecciónala con el botón Explorar"
              />
              <button
                type="button"
                onClick={handleSelectLocation}
                className="px-2.5 py-1.5 bg-secondary hover:bg-accent border border-border rounded-md font-medium text-foreground transition flex items-center space-x-1 shrink-0"
                title="Examinar carpetas de tu sistema"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Examinar</span>
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Se creará la carpeta: <span className="font-mono text-foreground">{location}/{name}</span>
            </p>
          </div>

          {activeFileName && onSaveActiveFileAs && (
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                ¿Solo deseas guardar el archivo <span className="font-mono text-foreground">{activeFileName}</span>?
              </span>
              <button
                type="button"
                onClick={handleSaveFileOnly}
                className="px-2.5 py-1 bg-secondary hover:bg-accent border border-border rounded text-[11px] font-medium text-foreground transition flex items-center space-x-1"
              >
                <FileCode className="w-3 h-3 text-primary" />
                <span>Guardar archivo como...</span>
              </button>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-border flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !location.trim()}
              className="px-4 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary-hover rounded-md transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Proyecto Aquí'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
