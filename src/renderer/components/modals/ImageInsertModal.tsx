import React, { useEffect, useRef, useState } from 'react';
import { X, Image as ImageIcon, Check, FolderOpen } from 'lucide-react';

interface ImageInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertImage: (latexSnippet: string) => void;
  projectPath: string;
}

export const ImageInsertModal: React.FC<ImageInsertModalProps> = ({
  isOpen,
  onClose,
  onInsertImage,
  projectPath,
}) => {
  const [imagePath, setImagePath] = useState('');
  const [imageRelPath, setImageRelPath] = useState('');
  const [caption, setCaption] = useState('Descripción de la figura');
  const [label, setLabel] = useState('fig:ejemplo');
  const [width, setWidth] = useState('0.8\\textwidth');
  const [placement, setPlacement] = useState('htbp');
  const [isCentered, setIsCentered] = useState(true);
  const [isCopying, setIsCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsCopying(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectFile = async () => {
    if (!window.lumenAPI.isNative) {
      fileInputRef.current?.click();
      return;
    }
    setError(null);
    try {
      const selected = await window.lumenAPI.selectImage();
      if (selected) {
        setIsCopying(true);
        // Copy image into project's images/ subfolder
        const targetDir = `${projectPath}/images`;
        const copiedDestination = await window.lumenAPI.copyFileToProject(selected.path, targetDir);
        if (!copiedDestination) {
          throw new Error('No se pudo copiar la imagen al proyecto.');
        }
        setImagePath(copiedDestination);
        const fileName = selected.name;
        setImageRelPath(`images/${fileName}`);

        // Suggest label from filename
        const baseName = fileName.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '-');
        setLabel(`fig:${baseName}`);
        setCaption(`Ilustración representativa de ${baseName.replace(/-/g, ' ')}`);
        setIsCopying(false);
      }
    } catch (err) {
      console.error('Error selecting image:', err);
      setError(err instanceof Error ? err.message : 'No se pudo seleccionar la imagen.');
      setIsCopying(false);
    }
  };

  const handleBrowserFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setIsCopying(true);
    try {
      const copiedDestination = await window.lumenAPI.copyFileToProject(
        file.name,
        `${projectPath}/images`
      );
      setImagePath(copiedDestination);
      setImageRelPath(`images/${file.name}`);
      const baseName = file.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '-');
      setLabel(`fig:${baseName}`);
      setCaption(`Ilustración representativa de ${baseName.replace(/-/g, ' ')}`);
    } catch (err) {
      console.error('Error importing browser image:', err);
      setError(err instanceof Error ? err.message : 'No se pudo importar la imagen.');
    } finally {
      setIsCopying(false);
    }
  };

  const handleConfirm = () => {
    if (!imageRelPath) return;

    let code = `\\begin{figure}[${placement}]\n`;
    if (isCentered) {
      code += `  \\centering\n`;
    }
    code += `  \\includegraphics[width=${width}]{${imageRelPath}}\n`;
    if (caption.trim()) {
      code += `  \\caption{${caption.trim()}}\n`;
    }
    if (label.trim()) {
      code += `  \\label{${label.trim()}}\n`;
    }
    code += `\\end{figure}\n`;

    onInsertImage(code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border shadow-2xl rounded-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-card/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Insertar Imagen</h3>
              <p className="text-xs text-muted-foreground">Copia el archivo a /images y genera el bloque figure</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* File Picker */}
          <div>
            <label className="text-muted-foreground font-medium block mb-1.5">Archivo de Imagen:</label>
            <div className="flex space-x-2">
              <input
                type="text"
                readOnly
                value={imageRelPath || 'Ninguna imagen seleccionada'}
                className="flex-1 bg-secondary/40 border border-border rounded-md px-2.5 py-1.5 text-foreground font-mono text-[11px]"
              />
              <button
                type="button"
                onClick={handleSelectFile}
                className="px-3 py-1.5 bg-secondary hover:bg-accent border border-border rounded-md font-medium text-foreground flex items-center space-x-1.5 transition"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>{isCopying ? 'Copiando...' : 'Explorar...'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.eps,.svg"
                className="hidden"
                onChange={(event) => {
                  void handleBrowserFile(event.target.files?.[0]);
                  event.currentTarget.value = '';
                }}
              />
            </div>
            {imagePath && !error && (
              <p className="mt-1 text-[10px] text-emerald-400">
                Imagen copiada en el proyecto: {imagePath}
              </p>
            )}
            {error && <p className="mt-1 text-[10px] text-red-400">{error}</p>}
          </div>

          {/* Caption & Label */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground block mb-1">Título / Pie de imagen (\caption):</label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-secondary/40 border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-muted-foreground block mb-1">Etiqueta (\label):</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full bg-secondary/40 border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Width & Placement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground block mb-1">Ancho relativo / absoluto:</label>
              <select
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="w-full bg-secondary/40 border border-border rounded-md px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="0.5\\textwidth">50% del ancho del texto (0.5\textwidth)</option>
                <option value="0.7\\textwidth">70% del ancho del texto (0.7\textwidth)</option>
                <option value="0.8\\textwidth">80% del ancho del texto (0.8\textwidth)</option>
                <option value="1.0\\textwidth">100% ancho completo (1.0\textwidth)</option>
                <option value="8cm">8 centímetros (8cm)</option>
                <option value="12cm">12 centímetros (12cm)</option>
              </select>
            </div>
            <div>
              <label className="text-muted-foreground block mb-1">Posicionamiento TeX:</label>
              <select
                value={placement}
                onChange={(e) => setPlacement(e.target.value)}
                className="w-full bg-secondary/40 border border-border rounded-md px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              >
                <option value="htbp">[htbp] Automático recomendado</option>
                <option value="h!">[h!] Aquí exactamente (forzado)</option>
                <option value="t">[t] Arriba de la página</option>
                <option value="b">[b] Al pie de la página</option>
                <option value="p">[p] Página separada</option>
              </select>
            </div>
          </div>

          {/* Center Checkbox */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="center-check"
              checked={isCentered}
              onChange={(e) => setIsCentered(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="center-check" className="text-foreground cursor-pointer">
              Centrar figura horizontalmente (\centering)
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-end space-x-2 bg-card/60">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!imageRelPath || isCopying}
            className="px-4 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary-hover rounded-md transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Insertar Imagen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
