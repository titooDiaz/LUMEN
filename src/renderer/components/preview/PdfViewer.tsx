import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  FileX,
  Loader2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from 'lucide-react';

// Configure pdfjs worker
// Use unpkg or cdnjs worker compatible with 3.11.174
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  pdfBase64: string | null;
  isCompiling: boolean;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onFitWidth: () => void;
  errorCount: number;
  onOpenDiagnostics: () => void;
  onManualCompile: () => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfBase64,
  isCompiling,
  zoom,
  onZoomChange,
  onFitWidth,
  errorCount,
  onOpenDiagnostics,
  onManualCompile,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  // Load PDF Document when pdfBase64 changes
  useEffect(() => {
    let isCancelled = false;

    async function loadPdf() {
      if (!pdfBase64) {
        setPdfDoc(null);
        setNumPages(0);
        return;
      }

      try {
        setIsRendering(true);
        setRenderError(null);
        const binaryString = atob(pdfBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const loadingTask = pdfjsLib.getDocument({ data: bytes.buffer });
        const doc = await loadingTask.promise;
        if (!isCancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage(1);
          setIsRendering(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Failed to load PDF with pdfjs:', err);
          setRenderError(err.message || 'Error al procesar el archivo PDF');
          setIsRendering(false);
        }
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [pdfBase64]);

  // Render pages onto canvases
  useEffect(() => {
    if (!pdfDoc) return;
    let isCancelled = false;

    async function renderAllPages() {
      const pixelRatio = window.devicePixelRatio || 1;

      for (let pageNum = 1; pageNum <= pdfDoc!.numPages; pageNum++) {
        if (isCancelled) break;
        const canvas = canvasRefs.current[pageNum - 1];
        if (!canvas) continue;

        try {
          const page = await pdfDoc!.getPage(pageNum);
          if (isCancelled) break;

          const viewport = page.getViewport({ scale: zoom });
          const context = canvas.getContext('2d');
          if (!context) continue;

          canvas.height = viewport.height * pixelRatio;
          canvas.width = viewport.width * pixelRatio;
          canvas.style.height = `${viewport.height}px`;
          canvas.style.width = `${viewport.width}px`;

          context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };

          await page.render(renderContext).promise;
        } catch (err) {
          // Render cancelled or interrupted
        }
      }
    }

    renderAllPages();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, zoom]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  const scrollToPage = (pageNum: number) => {
    const targetCanvas = canvasRefs.current[pageNum - 1];
    if (targetCanvas) {
      targetCanvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentPage(pageNum);
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col bg-card/30 relative select-none overflow-hidden"
    >
      {/* Top Floating Controls */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1 bg-card/85 backdrop-blur-md border border-border/80 px-2.5 py-1 rounded-full shadow-lg text-xs text-foreground">
        {/* Page navigation */}
        <button
          onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="p-1 rounded-full hover:bg-accent disabled:opacity-40 transition"
          title="Página anterior"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <span className="font-mono text-[11px] px-1 text-muted-foreground">
          <strong className="text-foreground">{currentPage}</strong> / {numPages || 1}
        </span>

        <button
          onClick={() => scrollToPage(Math.min(numPages, currentPage + 1))}
          disabled={currentPage >= numPages}
          className="p-1 rounded-full hover:bg-accent disabled:opacity-40 transition"
          title="Página siguiente"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <div className="h-3 w-px bg-border mx-1" />

        {/* Zoom */}
        <button
          onClick={() => onZoomChange(Math.max(0.4, zoom - 0.15))}
          className="p-1 rounded-full hover:bg-accent transition"
          title="Alejar"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono text-[11px] w-9 text-center text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => onZoomChange(Math.min(2.5, zoom + 0.15))}
          className="p-1 rounded-full hover:bg-accent transition"
          title="Acercar"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="h-3 w-px bg-border mx-1" />

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="p-1 rounded-full hover:bg-accent transition"
          title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center space-y-6 pt-14">
        {/* Compiling Overlay badge */}
        {isCompiling && (
          <div className="fixed bottom-6 right-6 z-30 flex items-center space-x-2 px-3.5 py-2 bg-card/90 backdrop-blur-md border border-primary/40 rounded-full shadow-2xl text-xs font-medium text-primary">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Compilando documento...</span>
          </div>
        )}

        {/* Error state when no PDF and compilation failed */}
        {!pdfBase64 && errorCount > 0 ? (
          <div className="m-auto max-w-md p-6 rounded-2xl bg-destructive/10 border border-destructive/25 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm">Error al compilar el documento</h4>
              <p className="text-xs text-muted-foreground mt-1">
                LaTeX encontró {errorCount} problema(s) sintáctico(s) que impidieron generar el PDF.
              </p>
            </div>
            <div className="flex justify-center space-x-2 pt-2">
              <button
                onClick={onOpenDiagnostics}
                className="px-3.5 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 font-medium text-xs transition"
              >
                Ver diagnóstico y corregir
              </button>
              <button
                onClick={onManualCompile}
                className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent text-foreground font-medium text-xs transition flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reintentar</span>
              </button>
            </div>
          </div>
        ) : !pdfBase64 ? (
          <div className="m-auto text-center space-y-3 text-muted-foreground">
            <FileX className="w-10 h-10 mx-auto opacity-40" />
            <p className="text-xs font-medium">Aún no se ha generado la previsualización PDF</p>
            <button
              onClick={onManualCompile}
              className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary-hover text-xs font-medium transition"
            >
              Compilar ahora (Ctrl+Enter)
            </button>
          </div>
        ) : (
          /* Multi-page PDF Rendering */
          Array.from({ length: numPages }).map((_, idx) => (
            <div
              key={idx}
              className="relative rounded-sm shadow-2xl border border-border/70 overflow-hidden bg-white transition-transform duration-150"
            >
              <canvas
                ref={(el) => {
                  canvasRefs.current[idx] = el;
                }}
                className="block"
              />
              <div className="absolute bottom-1 right-2 text-[10px] text-zinc-400 pointer-events-none select-none">
                {idx + 1}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
