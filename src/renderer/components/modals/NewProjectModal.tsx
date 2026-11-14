import React, { useState } from 'react';
import {
  X,
  Plus,
  FolderOpen,
  FileText,
  GraduationCap,
  Sparkles,
  Presentation,
  Check,
  Award,
} from 'lucide-react';
import { TemplateId } from '../../../shared/types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, location: string, templateId: TemplateId) => Promise<void>;
  defaultLocation: string;
  initialTemplate?: TemplateId;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  defaultLocation,
  initialTemplate = 'article',
}) => {
  const [name, setName] = useState('Nuevo-Documento');
  const [location, setLocation] = useState(defaultLocation);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>(initialTemplate);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (defaultLocation) {
      setLocation(defaultLocation);
    }
  }, [defaultLocation, isOpen]);

  React.useEffect(() => {
    if (initialTemplate) {
      setSelectedTemplate(initialTemplate);
    }
  }, [initialTemplate, isOpen]);

  if (!isOpen) return null;

  const handleSelectLocation = async () => {
    try {
      const selected = await window.lumenAPI.selectDirectory();
      if (selected) {
        setLocation(selected);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreate(name.trim(), location.trim(), selectedTemplate);
      onClose();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err);
      alert(`No se pudo crear el proyecto.\n\n${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const templates: { id: TemplateId; name: string; desc: string; icon: any; badge: string }[] = [
    {
      id: 'article',
      name: 'Artículo Científico',
      desc: 'Formato estándar de publicación académica con resumen, secciones, tabla y ecuaciones.',
      icon: Sparkles,
      badge: 'Recomendado',
    },
    {
      id: 'thesis',
      name: 'Tesis de Grado / Posgrado',
      desc: 'Estructura modular completa en carpetas con portada, capítulos y bibliografía BibTeX.',
      icon: GraduationCap,
      badge: 'Completo',
    },
    {
      id: 'ieee',
      name: 'IEEE Conference Paper',
      desc: 'Diseño en dos columnas con formato estandarizado internacional IEEE.',
      icon: Award,
      badge: 'IEEE',
    },
    {
      id: 'presentation',
      name: 'Presentación Beamer',
      desc: 'Diapositivas académicas profesionales para defensas y conferencias.',
      icon: Presentation,
      badge: 'Slides',
    },
    {
      id: 'resume',
      name: 'Curriculum Vitae',
      desc: 'Hoja de vida tipográfica limpia con secciones organizadas.',
      icon: FileText,
      badge: 'CV',
    },
    {
      id: 'blank',
      name: 'Documento en Blanco',
      desc: 'Plantilla mínima para iniciar un proyecto personalizado desde cero.',
      icon: Plus,
      badge: 'Mínimo',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border shadow-2xl rounded-xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-card/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Crear Nuevo Proyecto LaTeX</h3>
              <p className="text-xs text-muted-foreground">Configura el nombre y elige una plantilla optimizada</p>
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
          {/* Project Name and Path */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground font-medium block mb-1">Nombre del Proyecto:</label>
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
                <label className="text-muted-foreground font-medium">Ubicación en Disco (Carpeta Personalizada):</label>
              </div>
              <div className="flex space-x-1.5">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="/ruta/a/tu/carpeta"
                  className="flex-1 bg-secondary/40 border border-border rounded-md px-2.5 py-1.5 text-foreground text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  title="Escribe una ruta personalizada o selecciona una carpeta con el botón de la derecha"
                />
                <button
                  type="button"
                  onClick={handleSelectLocation}
                  className="px-2.5 py-1.5 bg-secondary hover:bg-accent border border-border rounded-md font-medium text-foreground transition flex items-center space-x-1 shrink-0"
                  title="Examinar y seleccionar carpeta personalizada"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Examinar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Template Selection Grid */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Seleccionar Plantilla
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {templates.map((tpl) => {
                const isSelected = selectedTemplate === tpl.id;
                const IconComponent = tpl.icon;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-primary/10 border-primary ring-1 ring-primary'
                        : 'bg-secondary/30 border-border hover:bg-secondary/60 hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`p-1.5 rounded-md ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-foreground text-xs">{tpl.name}</span>
                      </div>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-secondary border border-border text-muted-foreground font-medium">
                        {tpl.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{tpl.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-border flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary-hover rounded-md transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Creando proyecto...' : 'Crear Proyecto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
