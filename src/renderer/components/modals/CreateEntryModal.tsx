import React, { useEffect, useRef, useState } from 'react';
import { FilePlus, FolderPlus, X } from 'lucide-react';

interface CreateEntryModalProps {
  kind: 'file' | 'folder';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

export const CreateEntryModal: React.FC<CreateEntryModalProps> = ({ kind, isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setError('');
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, kind]);

  if (!isOpen) return null;
  const isFile = kind === 'file';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError('');
    try {
      await onSubmit(name);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo crear.');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form onSubmit={submit} className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl text-foreground">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2 font-semibold text-sm">{isFile ? <FilePlus className="h-4 w-4 text-primary" /> : <FolderPlus className="h-4 w-4 text-primary" />}{isFile ? 'Crear archivo' : 'Crear carpeta'}</div>
          <button type="button" onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-accent" title="Cerrar"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-2 p-5">
          <label htmlFor="new-entry-name" className="text-xs text-muted-foreground">{isFile ? 'Nombre (por ejemplo, capitulo.tex)' : 'Nombre de la carpeta'}</label>
          <input ref={inputRef} id="new-entry-name" value={name} onChange={(event) => setName(event.target.value)} placeholder={isFile ? 'documento.tex' : 'capitulos'} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
          {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" onClick={onClose} title="Cancelar sin crear" className="rounded-md border border-border px-3 py-2 text-xs hover:bg-accent">Cancelar</button>
          <button type="submit" disabled={busy || !name.trim()} title={isFile ? 'Crear el archivo en la carpeta seleccionada' : 'Crear la carpeta seleccionada'} className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{busy ? 'Creando…' : 'Crear'}</button>
        </div>
      </form>
    </div>
  );
};
