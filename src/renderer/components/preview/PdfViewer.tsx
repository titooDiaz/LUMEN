import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
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
  MoveHorizontal,
  RefreshCw,
} from 'lucide-react';

// Configure pdfjs worker locally via Vite asset bundler (100% offline and secure)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PdfViewerProps {
  pdfBase64: string | null;
  isCompiling: boolean;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onFitWidth: () => void;
  fitWidthSignal: number;
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
  fitWidthSignal,
  errorCount,
  onOpenDiagnostics,
  onManualCompile,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  // Natural width (in CSS px) of the first PDF page at 100%.
  const pageWidthRef = useRef<number>(595.28);
  // While true, the zoom level follows the available pane width.
  const fitModeRef = useRef<boolean>(true);
  // Scale applied by the last fit operation, used to distinguish the programmatic
  // zoom change from a manual one coming from the header controls.
  const lastFitScaleRef = useRef<number>(0);
  const hasAutoFittedRef = useRef<boolean>(false);
  const previousZoomRef = useRef<number>(zoom);

  /**
   * Scale the page so its full width is visible inside the preview pane.
   * The content area has 24px of padding on each side (p-6).
   */
  const applyFitToWidth = useCallback(() => {
    const scrollArea = scrollRef.current;
    if (!scrollArea) return;

    const horizontalPadding = 48;
    const availableWidth = Math.max(220, scrollArea.clientWidth - horizontalPadding);
    const pageWidth = pageWidthRef.current || 595.28;
    const scale = Math.min(2.5, Math.max(0.4, availableWidth / pageWidth));
    const roundedScale = Number(scale.toFixed(3));

    fitModeRef.current = true;
    lastFitScaleRef.current = roundedScale;
    onZoomChange(roundedScale);
  }, [onZoomChange]);

  // Keep the zoom updated when the user resizes the split panes, but only if
  // the user has not chosen a manual zoom level.
  useEffect(() => {
    const scrollArea = scrollRef.current;
    if (!scrollArea || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      if (fitModeRef.current) {
        applyFitToWidth();
      }
    });
    observer.observe(scrollArea);
    return () => observer.disconnect();
  }, [applyFitToWidth]);

  // The "fit to width" button in the header/in the viewer increments this
  // signal. The actual scale depends on the pane size, so it must be computed
  // here instead of in the header.
  useEffect(() => {
    if (fitWidthSignal > 0) {
      requestAnimationFrame(applyFitToWidth);
    }
  }, [fitWidthSignal, applyFitToWidth]);

  // Any zoom change that did not come from applyFitToWidth is a manual zoom,
  // which should stop the automatic fit-on-resize behavior.
  useEffect(() => {
    const previousZoom = previousZoomRef.current;
    previousZoomRef.current = zoom;
    if (
      previousZoom !== zoom &&
      Math.abs(zoom - lastFitScaleRef.current) > 0.001
    ) {
      fitModeRef.current = false;
    }
  }, [zoom]);

  const changeZoomManually = (newZoom: number) => {
    fitModeRef.current = false;
    onZoomChange(newZoom);
  };

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
        setRenderError(null);
        const binaryString = atob(pdfBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const loadingTask = pdfjsLib.getDocument({ data: bytes.buffer });
        const doc = await loadingTask.promise;
        if (isCancelled) return;

        // Remember the real page width so fit-to-width works for A4, Letter,
        // Beamer slides and any other paper size.
        const firstPage = await doc.getPage(1);
        if (isCancelled) return;
        pageWidthRef.current = firstPage.getViewport({ scale: 1 }).width;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);

        // Fit the document the first time a PDF is shown. Recompilations keep
        // the zoom level the user selected.
        if (!hasAutoFittedRef.current) {
          hasAutoFittedRef.current = true;
          requestAnimationFrame(applyFitToWidth);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Failed to load PDF with pdfjs:', err);
          setRenderError(err.message || 'Error al procesar el archivo PDF');
        }
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [pdfBase64, applyFitToWidth]);

  // Render pages onto canvases
  useEffect(() => {
    if (!pdfDoc || numPages === 0) return;
    let isCancelled = false;

    async function renderAllPages() {
      // Allow DOM to paint the canvas elements
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (isCancelled) return;

      const pixelRatio = window.devicePixelRatio || 1;

      for (let pageNum = 1; pageNum <= pdfDoc!.numPages; pageNum++) {
        if (isCancelled) break;
        let canvas = canvasRefs.current[pageNum - 1];
        if (!canvas) {
          // Retry after another animation frame if canvas is mounting
          await new Promise((resolve) => requestAnimationFrame(resolve));
          if (isCancelled) break;
          canvas = canvasRefs.current[pageNum - 1];
        }
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
  }, [pdfDoc, zoom, numPages]);

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
      className="w-full h-full flex flex-col bg-secondary/40 relative select-none overflow-hidden"
    >
      {/* Top Floating Controls */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1 whitespace-nowrap min-w-max max-w-[calc(100%-1.5rem)] bg-card/85 backdrop-blur-md border border-border/80 px-2.5 py-1 rounded-full shadow-lg text-xs text-foreground">
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
          onClick={() => changeZoomManually(Math.max(0.4, zoom - 0.15))}
          className="p-1 rounded-full hover:bg-accent transition"
          title="Alejar"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono text-[11px] w-9 text-center text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => changeZoomManually(Math.min(2.5, zoom + 0.15))}
          className="p-1 rounded-full hover:bg-accent transition"
          title="Acercar"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onFitWidth}
          className={`p-1 rounded-full hover:bg-accent transition ${
            Math.abs(zoom - lastFitScaleRef.current) < 0.001 ? 'text-primary' : ''
          }`}
          title="Ajustar al ancho del panel"
        >
          <MoveHorizontal className="w-3.5 h-3.5" />
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
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 flex flex-col items-center space-y-6 pt-14 [scrollbar-gutter:stable]"
      >
        {/* Compiling Overlay badge */}
        {isCompiling && (
          <div className="fixed bottom-6 right-6 z-30 flex items-center space-x-2 px-3.5 py-2 bg-card/90 backdrop-blur-md border border-primary/40 rounded-full shadow-2xl text-xs font-medium text-primary">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Compilando documento...</span>
          </div>
        )}

        {/* Error state when PDF parsing/rendering fails */}
        {renderError ? (
          <div className="m-auto max-w-md p-6 rounded-2xl bg-destructive/10 border border-destructive/25 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm">Error en la previsualización PDF</h4>
              <p className="text-xs text-muted-foreground mt-1 font-mono break-all">{renderError}</p>
            </div>
            <div className="flex justify-center space-x-2 pt-2">
              <button
                onClick={onManualCompile}
                className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium text-xs transition flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recompilar</span>
              </button>
            </div>
          </div>
        ) : !pdfBase64 && errorCount > 0 ? (
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
        ) : pdfBase64 && !pdfDoc ? (
          <div className="m-auto flex flex-col items-center gap-3 text-muted-foreground">
            <div className="w-14 h-14 rounded-2xl bg-card border border-border/70 flex items-center justify-center shadow-sm">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
            <p className="text-xs font-medium">Generando vista previa del PDF…</p>
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
            <div key={idx} className="flex flex-col items-center gap-2 shrink-0">
              <div className="relative rounded-[3px] shadow-2xl shadow-black/30 ring-1 ring-black/10 dark:ring-white/10 overflow-hidden bg-white">
                <canvas
                  ref={(el) => {
                    canvasRefs.current[idx] = el;
                  }}
                  className="block"
                />
              </div>
              <span className="text-[10px] font-medium tracking-wide text-muted-foreground/80 select-none">
                {idx + 1} / {numPages}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
