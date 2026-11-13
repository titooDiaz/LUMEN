import React, { useState, useEffect, useRef } from 'react';
import { X, Sigma, Check, Sparkles } from 'lucide-react';
import katex from 'katex';

interface MathInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertMath: (latexCode: string) => void;
}

export const MathInsertModal: React.FC<MathInsertModalProps> = ({
  isOpen,
  onClose,
  onInsertMath,
}) => {
  const [equation, setEquation] = useState('E = mc^2 + \\int_{0}^{\\infty} \\psi(x) \\, dx');
  const [isBlock, setIsBlock] = useState(true);
  const [isNumbered, setIsNumbered] = useState(true);
  const [label, setLabel] = useState('eq:fundamental');
  const previewRef = useRef<HTMLDivElement>(null);
  const [katexError, setKatexError] = useState<string | null>(null);

  useEffect(() => {
    if (!previewRef.current || !isOpen) return;
    try {
      katex.render(equation || ' ', previewRef.current, {
        displayMode: isBlock,
        throwOnError: false,
      });
      setKatexError(null);
    } catch (err: any) {
      setKatexError(err.message || 'Error de sintaxis');
    }
  }, [equation, isBlock, isOpen]);

  if (!isOpen) return null;

  const insertSymbol = (sym: string) => {
    setEquation((prev) => prev + sym);
  };

  const symbols = {
    griegas: [
      { label: 'α', code: '\\alpha ' },
      { label: 'β', code: '\\beta ' },
      { label: 'γ', code: '\\gamma ' },
      { label: 'δ', code: '\\delta ' },
      { label: 'ε', code: '\\epsilon ' },
      { label: 'θ', code: '\\theta ' },
      { label: 'λ', code: '\\lambda ' },
      { label: 'μ', code: '\\mu ' },
      { label: 'π', code: '\\pi ' },
      { label: 'σ', code: '\\sigma ' },
      { label: 'ω', code: '\\omega ' },
      { label: 'Δ', code: '\\Delta ' },
      { label: 'Ω', code: '\\Omega ' },
      { label: 'Σ', code: '\\Sigma ' },
    ],
    operadores: [
      { label: '±', code: '\\pm ' },
      { label: '×', code: '\\times ' },
      { label: '÷', code: '\\div ' },
      { label: '·', code: '\\cdot ' },
      { label: '≠', code: '\\neq ' },
      { label: '≈', code: '\\approx ' },
      { label: '≤', code: '\\le ' },
      { label: '≥', code: '\\ge ' },
      { label: '∞', code: '\\infty ' },
      { label: '∂', code: '\\partial ' },
      { label: '∇', code: '\\nabla ' },
    ],
    estructuras: [
      { label: 'a/b', code: '\\frac{a}{b} ' },
      { label: '√x', code: '\\sqrt{x} ' },
      { label: 'xⁿ', code: 'x^{n} ' },
      { label: 'xᵢ', code: 'x_{i} ' },
      { label: '∫', code: '\\int_{a}^{b} f(x) \\, dx ' },
      { label: '∑', code: '\\sum_{i=1}^{n} ' },
      { label: '∏', code: '\\prod_{i=1}^{n} ' },
      { label: 'lim', code: '\\lim_{x \\to 0} ' },
    ],
    matrices: [
      { label: '[2×2]', code: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} ' },
      { label: '[3×3]', code: '\\begin{pmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 1 \\end{pmatrix} ' },
    ],
  };

  const handleConfirm = () => {
    let code = '';
    if (!isBlock) {
      code = `$${equation.trim()}$ `;
    } else if (isNumbered) {
      code = `\\begin{equation}\n  ${equation.trim()}\n`;
      if (label.trim()) {
        code += `  \\label{${label.trim()}}\n`;
      }
      code += `\\end{equation}\n`;
    } else {
      code = `\\[\n  ${equation.trim()}\n\\]\n`;
    }

    onInsertMath(code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border shadow-2xl rounded-xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-card/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sigma className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Constructor Visual de Fórmulas Matemáticas</h3>
              <p className="text-xs text-muted-foreground">Previsualización inmediata en tiempo real con motor KaTeX</p>
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
          {/* Symbol Palettes */}
          <div className="space-y-2">
            <div className="flex items-center space-x-1.5 text-muted-foreground font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Símbolos y Operadores Rápidos (clic para insertar):</span>
            </div>

            <div className="flex flex-wrap gap-1 p-2 rounded-lg bg-secondary/40 border border-border max-h-36 overflow-y-auto">
              <div className="w-full text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Letras Griegas</div>
              {symbols.griegas.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => insertSymbol(s.code)}
                  className="px-2 py-1 rounded bg-card hover:bg-accent border border-border text-foreground font-medium transition min-w-[28px]"
                  title={s.code}
                >
                  {s.label}
                </button>
              ))}

              <div className="w-full text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">Estructuras y Operadores</div>
              {symbols.estructuras.concat(symbols.operadores).map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => insertSymbol(s.code)}
                  className="px-2 py-1 rounded bg-card hover:bg-accent border border-border text-foreground font-medium transition"
                  title={s.code}
                >
                  {s.label}
                </button>
              ))}

              <div className="w-full text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">Matrices</div>
              {symbols.matrices.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => insertSymbol(s.code)}
                  className="px-2 py-1 rounded bg-card hover:bg-accent border border-border text-foreground font-medium transition"
                  title={s.code}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Equation Input */}
          <div>
            <label className="text-muted-foreground font-medium block mb-1">Código TeX de la Ecuación:</label>
            <textarea
              value={equation}
              onChange={(e) => setEquation(e.target.value)}
              rows={3}
              className="w-full bg-secondary/40 border border-border rounded-md px-3 py-2 text-foreground font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="Escribe la expresión matemática en LaTeX..."
            />
          </div>

          {/* Live KaTeX Rendered Preview */}
          <div>
            <label className="text-muted-foreground font-medium block mb-1">Previsualización Renderizada:</label>
            <div className="p-4 rounded-lg bg-background border border-border min-h-[70px] flex items-center justify-center overflow-x-auto text-base">
              <div ref={previewRef} />
              {katexError && <span className="text-red-400 text-xs">{katexError}</span>}
            </div>
          </div>

          {/* Configuration Options */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="eq-type"
                  checked={isBlock}
                  onChange={() => setIsBlock(true)}
                  className="text-primary focus:ring-primary"
                />
                <span>Ecuación en Bloque</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="eq-type"
                  checked={!isBlock}
                  onChange={() => setIsBlock(false)}
                  className="text-primary focus:ring-primary"
                />
                <span>En línea con el texto ($...$)</span>
              </label>
            </div>

            {isBlock && (
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNumbered}
                    onChange={(e) => setIsNumbered(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span>Numerada (\equation)</span>
                </label>
                {isNumbered && (
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="eq:etiqueta"
                    className="w-32 bg-secondary/40 border border-border rounded px-2 py-1 font-mono text-[11px]"
                  />
                )}
              </div>
            )}
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
            <span>Insertar en el Documento</span>
          </button>
        </div>
      </div>
    </div>
  );
};
