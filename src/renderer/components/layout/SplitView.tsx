import React, { useState, useEffect, useRef } from 'react';

interface SplitViewProps {
  left: React.ReactNode;
  right: React.ReactNode;
  initialSplit?: number; // percentage (e.g. 50)
  minLeftWidth?: number; // px
  minRightWidth?: number; // px
}

export const SplitView: React.FC<SplitViewProps> = ({
  left,
  right,
  initialSplit = 50,
  minLeftWidth = 350,
  minRightWidth = 350,
}) => {
  const [splitPercent, setSplitPercent] = useState<number>(() => {
    const saved = localStorage.getItem('lumen_split_percent');
    return saved ? parseFloat(saved) : initialSplit;
  });

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const totalWidth = rect.width;

      if (totalWidth <= 0) return;

      const newPercent = (offsetX / totalWidth) * 100;

      // Enforce min widths
      const leftPx = (newPercent / 100) * totalWidth;
      const rightPx = totalWidth - leftPx;

      if (leftPx >= minLeftWidth && rightPx >= minRightWidth) {
        setSplitPercent(newPercent);
        localStorage.setItem('lumen_split_percent', newPercent.toString());
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minLeftWidth, minRightWidth]);

  return (
    <div
      ref={containerRef}
      className={`flex-1 flex overflow-hidden relative select-none ${
        isDragging ? 'cursor-col-resize select-none pointer-events-auto' : ''
      }`}
    >
      {/* Left Pane (LaTeX Editor) */}
      <div
        style={{ width: `${splitPercent}%` }}
        className="h-full flex flex-col overflow-hidden select-text border-r border-border"
      >
        {left}
      </div>

      {/* Resizable Divider Handle */}
      <div
        onMouseDown={() => setIsDragging(true)}
        onDoubleClick={() => {
          setSplitPercent(50);
          localStorage.setItem('lumen_split_percent', '50');
        }}
        className={`w-1.5 hover:w-2 -ml-0.5 z-20 cursor-col-resize transition-all duration-75 flex items-center justify-center group ${
          isDragging ? 'bg-primary w-2 shadow-lg ring-1 ring-primary' : 'bg-transparent hover:bg-primary/40'
        }`}
        title="Arrastra para redimensionar paneles (Doble clic para 50/50)"
      >
        <div className="w-0.5 h-6 rounded-full bg-border group-hover:bg-primary" />
      </div>

      {/* Right Pane (PDF Preview) */}
      <div style={{ width: `${100 - splitPercent}%` }} className="h-full flex flex-col overflow-hidden">
        {right}
      </div>
    </div>
  );
};
