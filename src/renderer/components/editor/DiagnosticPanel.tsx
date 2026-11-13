import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  FileText,
  ChevronDown,
  X,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { DiagnosticItem } from '../../../shared/types';

interface DiagnosticPanelProps {
  isOpen: boolean;
  onClose: () => void;
  errors: DiagnosticItem[];
  warnings: DiagnosticItem[];
  rawLog: string;
  onJumpToLine: (line: number) => void;
}

export const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({
  isOpen,
  onClose,
  errors,
  warnings,
  rawLog,
  onJumpToLine,
}) => {
  const [activeTab, setActiveTab] = useState<'errors' | 'warnings' | 'log'>('errors');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLog = () => {
    navigator.clipboard.writeText(rawLog);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-64 border-t border-border bg-card/95 backdrop-blur-md flex flex-col z-20 text-xs">
      {/* Top Header & Tabs */}
      <div className="h-9 px-3 border-b border-border flex items-center justify-between select-none bg-secondary/30">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('errors')}
            className={`px-3 py-1 rounded-md flex items-center space-x-1.5 transition font-medium ${
              activeTab === 'errors'
                ? 'bg-destructive/15 text-red-400 border border-destructive/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            <span>Errores</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500/20 text-red-400 font-bold">
              {errors.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('warnings')}
            className={`px-3 py-1 rounded-md flex items-center space-x-1.5 transition font-medium ${
              activeTab === 'warnings'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Advertencias</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-400 font-bold">
              {warnings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('log')}
            className={`px-3 py-1 rounded-md flex items-center space-x-1.5 transition font-medium ${
              activeTab === 'log'
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Registro TeX (Log)</span>
          </button>
        </div>

        <div className="flex items-center space-x-1.5">
          {activeTab === 'log' && (
            <button
              onClick={handleCopyLog}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition"
              title="Copiar log al portapapeles"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition"
            title="Cerrar panel de diagnóstico"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'errors' && (
          <div className="space-y-2">
            {errors.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground flex flex-col items-center space-y-1">
                <Check className="w-6 h-6 text-emerald-400/80 mb-1" />
                <span className="font-medium text-foreground">Sin errores de compilación</span>
                <span className="text-[11px]">El documento compiló limpiamente sin fallos sintácticos.</span>
              </div>
            ) : (
              errors.map((err) => (
                <div
                  key={err.id}
                  onClick={() => onJumpToLine(err.line)}
                  className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/25 hover:bg-destructive/15 transition cursor-pointer flex items-start justify-between group"
                >
                  <div className="space-y-1 pr-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-red-400">{err.message}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {err.file}:{err.line}
                      </span>
                    </div>
                    {err.rawContext && (
                      <div className="font-mono text-[11px] text-muted-foreground bg-background/50 px-2 py-0.5 rounded border border-border/50">
                        {err.rawContext}
                      </div>
                    )}
                  </div>
                  <button
                    className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-red-500/20 text-red-300 rounded text-[11px] font-medium flex items-center space-x-1 shrink-0 transition"
                    title="Saltar a esta línea en el editor"
                  >
                    <span>Ir a línea {err.line}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'warnings' && (
          <div className="space-y-2">
            {warnings.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No hay advertencias en este documento.
              </div>
            ) : (
              warnings.map((warn) => (
                <div
                  key={warn.id}
                  onClick={() => onJumpToLine(warn.line)}
                  className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-amber-300 font-medium">{warn.message}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      (línea {warn.line})
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Línea {warn.line}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'log' && (
          <pre className="font-mono text-[11px] text-muted-foreground bg-background/60 p-3 rounded-lg border border-border whitespace-pre-wrap select-text leading-relaxed">
            {rawLog || 'No hay registro de compilación disponible aún.'}
          </pre>
        )}
      </div>
    </div>
  );
};
