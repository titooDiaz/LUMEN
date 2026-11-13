import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Check,
  Code,
  Table as TableIcon,
} from 'lucide-react';

interface TableEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertTable: (latexCode: string) => void;
}

type Alignment = 'l' | 'c' | 'r';

export const TableEditorModal: React.FC<TableEditorModalProps> = ({
  isOpen,
  onClose,
  onInsertTable,
}) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [alignments, setAlignments] = useState<Alignment[]>(['l', 'c', 'r']);
  const [hasHeader, setHasHeader] = useState(true);
  const [useBooktabs, setUseBooktabs] = useState(true);
  const [hasBorders, setHasBorders] = useState(true);
  const [caption, setCaption] = useState('Resultados Experimentales');
  const [label, setLabel] = useState('tab:resultados');
  const [cellData, setCellData] = useState<string[][]>([
    ['Elemento', 'Categoría', 'Valor'],
    ['Sensor A', 'Óptico', '98.5\\%'],
    ['Sensor B', 'Térmico', '94.2\\%'],
  ]);

  if (!isOpen) return null;

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const updated = cellData.map((row, r) =>
      row.map((cell, c) => (r === rowIndex && c === colIndex ? value : cell))
    );
    setCellData(updated);
  };

  const addRow = () => {
    const newRow = Array(cols).fill('');
    setCellData([...cellData, newRow]);
    setRows(rows + 1);
  };

  const removeRow = () => {
    if (rows <= 1) return;
    setCellData(cellData.slice(0, rows - 1));
    setRows(rows - 1);
  };

  const addColumn = () => {
    const updated = cellData.map((row) => [...row, '']);
    setCellData(updated);
    setAlignments([...alignments, 'c']);
    setCols(cols + 1);
  };

  const removeColumn = () => {
    if (cols <= 1) return;
    const updated = cellData.map((row) => row.slice(0, cols - 1));
    setCellData(updated);
    setAlignments(alignments.slice(0, cols - 1));
    setCols(cols - 1);
  };

  const cycleAlignment = (colIndex: number) => {
    const nextAlign: Record<Alignment, Alignment> = { l: 'c', c: 'r', r: 'l' };
    const updated = [...alignments];
    updated[colIndex] = nextAlign[updated[colIndex] || 'c'];
    setAlignments(updated);
  };

  // Generate LaTeX code
  const generateLatex = (): string => {
    let colSpec = '';
    if (useBooktabs) {
      colSpec = alignments.join('');
    } else {
      colSpec = hasBorders ? `|${alignments.join('|')}|` : alignments.join('');
    }

    let code = `\\begin{table}[htbp]\n`;
    code += `  \\centering\n`;
    if (caption.trim()) {
      code += `  \\caption{${caption.trim()}}\n`;
    }
    if (label.trim()) {
      code += `  \\label{${label.trim()}}\n`;
    }
    code += `  \\begin{tabular}{${colSpec}}\n`;

    if (useBooktabs) {
      code += `    \\toprule\n`;
    } else if (hasBorders) {
      code += `    \\hline\n`;
    }

    cellData.forEach((row, rIdx) => {
      // Format row cells
      const formattedCells = row.map((cell, cIdx) => {
        const val = cell.trim() || ' ';
        if (rIdx === 0 && hasHeader) {
          return `\\textbf{${val}}`;
        }
        return val;
      });

      code += `    ${formattedCells.join(' & ')} \\\\\n`;

      if (rIdx === 0 && hasHeader) {
        if (useBooktabs) {
          code += `    \\midrule\n`;
        } else if (hasBorders) {
          code += `    \\hline\n`;
        }
      }
    });

    if (useBooktabs) {
      code += `    \\bottomrule\n`;
    } else if (hasBorders) {
      code += `    \\hline\n`;
    }

    code += `  \\end{tabular}\n`;
    code += `\\end{table}\n`;

    return code;
  };

  const handleConfirm = () => {
    onInsertTable(generateLatex());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border shadow-2xl rounded-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-card/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TableIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Editor Visual de Tablas</h3>
              <p className="text-xs text-muted-foreground">Configura la cuadrícula y genera código LaTeX limpio</p>
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
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Controls: Rows/Cols, Style options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dimensions */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Dimensiones</label>
              <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-1 bg-secondary/60 border border-border rounded-md px-2 py-1">
                  <span className="text-muted-foreground">Filas:</span>
                  <span className="font-bold w-4 text-center">{rows}</span>
                  <button onClick={addRow} className="p-1 hover:bg-accent rounded" title="Añadir fila">
                    <Plus className="w-3 h-3" />
                  </button>
                  <button onClick={removeRow} className="p-1 hover:bg-accent rounded text-red-400" title="Eliminar fila">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center space-x-1 bg-secondary/60 border border-border rounded-md px-2 py-1">
                  <span className="text-muted-foreground">Columnas:</span>
                  <span className="font-bold w-4 text-center">{cols}</span>
                  <button onClick={addColumn} className="p-1 hover:bg-accent rounded" title="Añadir columna">
                    <Plus className="w-3 h-3" />
                  </button>
                  <button onClick={removeColumn} className="p-1 hover:bg-accent rounded text-red-400" title="Eliminar columna">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Styling */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Opciones Tipográficas</label>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => setHasHeader(!hasHeader)}
                  className={`px-2 py-1 rounded border transition ${
                    hasHeader ? 'bg-primary/10 border-primary text-primary font-medium' : 'bg-secondary/40 border-border text-muted-foreground'
                  }`}
                >
                  Fila Encabezado
                </button>
                <button
                  onClick={() => setUseBooktabs(!useBooktabs)}
                  className={`px-2 py-1 rounded border transition ${
                    useBooktabs ? 'bg-primary/10 border-primary text-primary font-medium' : 'bg-secondary/40 border-border text-muted-foreground'
                  }`}
                >
                  Booktabs (Académico)
                </button>
                {!useBooktabs && (
                  <button
                    onClick={() => setHasBorders(!hasBorders)}
                    className={`px-2 py-1 rounded border transition ${
                      hasBorders ? 'bg-primary/10 border-primary text-primary font-medium' : 'bg-secondary/40 border-border text-muted-foreground'
                    }`}
                  >
                    Bordes de Celda
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Caption & Label */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-muted-foreground mb-1 block">Título / Caption:</label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-secondary/40 border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Ej. Comparación de Rendimiento"
              />
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block">Etiqueta / Label (\label):</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full bg-secondary/40 border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono text-[11px]"
                placeholder="tab:rendimiento"
              />
            </div>
          </div>

          {/* Alignment Selector Row */}
          <div>
            <div className="text-[11px] text-muted-foreground mb-1.5 flex items-center justify-between">
              <span>Alineación por columna (haz clic para cambiar Izq / Centro / Der):</span>
            </div>
            <div className="flex gap-2 mb-2">
              {alignments.map((align, cIdx) => (
                <button
                  key={cIdx}
                  onClick={() => cycleAlignment(cIdx)}
                  className="flex-1 py-1 rounded bg-secondary/80 border border-border hover:bg-accent flex items-center justify-center space-x-1 text-xs text-muted-foreground transition"
                  title="Cambiar alineación"
                >
                  {align === 'l' && <AlignLeft className="w-3.5 h-3.5 text-primary" />}
                  {align === 'c' && <AlignCenter className="w-3.5 h-3.5 text-primary" />}
                  {align === 'r' && <AlignRight className="w-3.5 h-3.5 text-primary" />}
                  <span className="font-mono text-[11px] uppercase font-bold text-foreground">{align}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Editable Grid */}
          <div className="border border-border rounded-lg overflow-x-auto bg-background/50 p-2">
            <table className="w-full border-collapse text-xs">
              <tbody>
                {cellData.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx === 0 && hasHeader ? 'border-b-2 border-border font-semibold' : 'border-b border-border/40'}>
                    {row.map((cell, cIdx) => {
                      const align = alignments[cIdx] || 'c';
                      const textAlignClass =
                        align === 'l' ? 'text-left' : align === 'r' ? 'text-right' : 'text-center';

                      return (
                        <td key={cIdx} className="p-1 min-w-[120px]">
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                            placeholder={rIdx === 0 && hasHeader ? `Columna ${cIdx + 1}` : '-'}
                            className={`w-full bg-secondary/20 hover:bg-secondary/40 focus:bg-background border border-transparent focus:border-primary rounded px-2 py-1.5 text-foreground focus:outline-none transition ${textAlignClass} ${
                              rIdx === 0 && hasHeader ? 'font-semibold text-primary' : ''
                            }`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Code Preview */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-[11px] text-muted-foreground">
              <Code className="w-3.5 h-3.5" />
              <span>Código LaTeX generado:</span>
            </div>
            <pre className="p-3 bg-secondary/60 border border-border rounded-lg text-[11px] font-mono text-muted-foreground overflow-x-auto max-h-28">
              {generateLatex()}
            </pre>
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
            className="px-4 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary-hover rounded-md transition flex items-center space-x-1.5 shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Insertar Tabla en el Editor</span>
          </button>
        </div>
      </div>
    </div>
  );
};
