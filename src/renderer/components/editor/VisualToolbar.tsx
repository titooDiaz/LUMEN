import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Table as TableIcon,
  Columns2,
  Columns3,
  List,
  ListOrdered,
  Sigma,
  Divide,
  Grid,
  Heading1,
  Heading2,
  Quote,
  Code2,
  BookOpen,
  SquareCode,
  Link2,
  FileSpreadsheet,
  Bold,
  Italic,
  Box,
  SeparatorHorizontal,
  ChevronDown,
} from 'lucide-react';

interface VisualToolbarProps {
  onInsertCode: (snippet: string) => void;
  onOpenImagePicker: () => void;
  onOpenTableModal: () => void;
  onOpenMathModal: () => void;
}

export const VisualToolbar: React.FC<VisualToolbarProps> = ({
  onInsertCode,
  onOpenImagePicker,
  onOpenTableModal,
  onOpenMathModal,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const handleInsert = (snippet: string) => {
    onInsertCode(snippet);
    setActiveDropdown(null);
  };

  return (
    <div className="h-9 border-b border-border bg-card/40 flex items-center px-2 space-x-1 overflow-x-auto select-none text-xs text-muted-foreground z-20">
      {/* Grupo: Formato Rápido */}
      <div className="flex items-center space-x-0.5 pr-1 border-r border-border">
        <button
          onClick={() => handleInsert('\\textbf{${1:texto en negrita}} ')}
          className="p-1 rounded hover:bg-accent hover:text-foreground transition"
          title="Negrita (\textbf{})"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleInsert('\\textit{${1:texto en cursiva}} ')}
          className="p-1 rounded hover:bg-accent hover:text-foreground transition"
          title="Cursiva (\textit{})"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grupo: Estructura */}
      <div className="relative pr-1 border-r border-border">
        <button
          onClick={() => toggleDropdown('structure')}
          className="flex items-center space-x-1 px-1.5 py-1 rounded hover:bg-accent hover:text-foreground transition"
          title="Estructura del Documento"
        >
          <Heading1 className="w-3.5 h-3.5" />
          <span>Estructura</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {activeDropdown === 'structure' && (
          <div className="absolute top-8 left-0 w-48 bg-popover border border-border shadow-lg rounded-md py-1 z-50 text-foreground">
            <button
              onClick={() => handleInsert('\n\\section{${1:Título de la Sección}}\n${2:Contenido...}\n')}
              className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center space-x-2"
            >
              <Heading1 className="w-3.5 h-3.5 text-primary" />
              <span>Sección (\section)</span>
            </button>
            <button
              onClick={() => handleInsert('\n\\subsection{${1:Título de la Subsección}}\n${2:Contenido...}\n')}
              className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center space-x-2"
            >
              <Heading2 className="w-3.5 h-3.5 text-primary" />
              <span>Subsección (\subsection)</span>
            </button>
            <button
              onClick={() => handleInsert('\n\\subsubsection{${1:Título}}\n')}
              className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center space-x-2"
            >
              <span className="w-3.5 text-[10px] font-bold text-center">H3</span>
              <span>Subsubsección</span>
            </button>
            <div className="h-px bg-border my-1" />
            <button
              onClick={() =>
                handleInsert(
                  '\n\\begin{multicols}{2}\n${1:Contenido columna 1}\n\\columnbreak\n${2:Contenido columna 2}\n\\end{multicols}\n'
                )
              }
              className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center space-x-2"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>2 Columnas (multicols)</span>
            </button>
            <button
              onClick={() =>
                handleInsert(
                  '\n\\begin{multicols}{3}\n${1:Columna 1}\n\\columnbreak\n${2:Columna 2}\n\\columnbreak\n${3:Columna 3}\n\\end{multicols}\n'
                )
              }
              className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center space-x-2"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>3 Columnas</span>
            </button>
            <div className="h-px bg-border my-1" />
            <button
              onClick={() => handleInsert('\n\\newpage\n')}
              className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center space-x-2"
            >
              <SeparatorHorizontal className="w-3.5 h-3.5" />
              <span>Salto de Página (\newpage)</span>
            </button>
          </div>
        )}
      </div>

      {/* Grupo: Insertar Imagen */}
      <button
        onClick={onOpenImagePicker}
        className="flex items-center space-x-1 px-1.5 py-1 rounded hover:bg-accent hover:text-foreground transition"
        title="Insertar Imagen desde el ordenador (copia automática a /images)"
      >
        <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
        <span>Imagen</span>
      </button>

      {/* Grupo: Editor Visual de Tablas */}
      <button
        onClick={onOpenTableModal}
        className="flex items-center space-x-1 px-1.5 py-1 rounded hover:bg-accent hover:text-foreground transition"
        title="Crear Tabla con Diseñador Gráfico Visual"
      >
        <TableIcon className="w-3.5 h-3.5 text-emerald-400" />
        <span>Tabla Visual</span>
      </button>

      {/* Grupo: Matemáticas */}
      <div className="relative pr-1 border-r border-border">
        <button
          onClick={() => toggleDropdown('math')}
          className="flex items-center space-x-1 px-1.5 py-1 rounded hover:bg-accent hover:text-foreground transition"
          title="Fórmulas y Ecuaciones Matemáticas"
        >
          <Sigma className="w-3.5 h-3.5 text-amber-400" />
          <span>Matemáticas</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {activeDropdown === 'math' && (
          <div className="absolute top-8 left-0 w-52 bg-popover border border-border shadow-lg rounded-md py-1 z-50 text-foreground">
            <button
              onClick={onOpenMathModal}
              className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center space-x-2 font-medium text-primary"
            >
              <Sigma className="w-3.5 h-3.5" />
              <span>Constructor de Ecuaciones...</span>
            </button>
            <div className="h-px bg-border my-1" />
            <button
              onClick={() => handleInsert('\n\\begin{equation}\n  ${1:E = mc^2}\n  \\label{eq:${2:etiqueta}}\n\\end{equation}\n')}
              className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center space-x-2"
            >
              <span>Ecuación numerada</span>
            </button>
            <button
              onClick={() => handleInsert('$${1:x = \\alpha + \\beta}$ ')}
              className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center space-x-2"
            >
              <span>Ecuación en línea ($...$)</span>
            </button>
            <button
              onClick={() => handleInsert('\\frac{${1:numerador}}{${2:denominador}} ')}
              className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center space-x-2"
            >
              <Divide className="w-3.5 h-3.5" />
              <span>Fracción (\frac)</span>
            </button>
            <button
              onClick={() =>
                handleInsert(
                  '\n\\begin{pmatrix}\n  ${1:a_{11}} & ${2:a_{12}} \\\\\n  ${3:a_{21}} & ${4:a_{22}}\n\\end{pmatrix}\n'
                )
              }
              className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center space-x-2"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Matriz 2x2 (\pmatrix)</span>
            </button>
            <button
              onClick={() => handleInsert('\\sqrt{${1:x}} ')}
              className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center space-x-2"
            >
              <span>Raíz cuadrada (\sqrt)</span>
            </button>
            <button
              onClick={() => handleInsert('\\int_{${1:0}}^{${2:\\infty}} ${3:f(x)} \\, dx ')}
              className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center space-x-2"
            >
              <span>Integral definida (\int)</span>
            </button>
            <button
              onClick={() => handleInsert('\\sum_{${1:i=1}}^{${2:n}} ${3:x_i} ')}
              className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center space-x-2"
            >
              <span>Sumatorio (\sum)</span>
            </button>
          </div>
        )}
      </div>

      {/* Grupo: Listas */}
      <div className="flex items-center space-x-0.5 pr-1 border-r border-border">
        <button
          onClick={() =>
            handleInsert(
              '\n\\begin{itemize}\n  \\item ${1:Primer elemento}\n  \\item ${2:Segundo elemento}\n\\end{itemize}\n'
            )
          }
          className="p-1 rounded hover:bg-accent hover:text-foreground transition"
          title="Lista con viñetas (\begin{itemize})"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() =>
            handleInsert(
              '\n\\begin{enumerate}\n  \\item ${1:Paso uno}\n  \\item ${2:Paso dos}\n\\end{enumerate}\n'
            )
          }
          className="p-1 rounded hover:bg-accent hover:text-foreground transition"
          title="Lista numerada (\begin{enumerate})"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grupo: Bloques de Código y Citas */}
      <div className="flex items-center space-x-0.5 pr-1 border-r border-border">
        <button
          onClick={() =>
            handleInsert(
              '\n\\begin{lstlisting}[language=${1:Python}, caption={${2:Descripción}}]\n${3:# Tu código aquí}\n\\end{lstlisting}\n'
            )
          }
          className="p-1 rounded hover:bg-accent hover:text-foreground transition"
          title="Bloque de Código (\begin{lstlisting})"
        >
          <Code2 className="w-3.5 h-3.5 text-cyan-400" />
        </button>
        <button
          onClick={() =>
            handleInsert(
              '\n\\begin{quote}\n  ${1:Texto de la cita académica o pasaje destacado.}\n\\end{quote}\n'
            )
          }
          className="p-1 rounded hover:bg-accent hover:text-foreground transition"
          title="Cita destacada (\begin{quote})"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() =>
            handleInsert(
              '\n\\begin{tcolorbox}[colback=blue!5!white,colframe=blue!75!black,title=${1:Nota Importante}]\n  ${2:Texto del recuadro}\n\\end{tcolorbox}\n'
            )
          }
          className="p-1 rounded hover:bg-accent hover:text-foreground transition"
          title="Recuadro de Texto Destacado (tcolorbox / alert)"
        >
          <Box className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grupo: Referencias y Citas */}
      <div className="flex items-center space-x-0.5">
        <button
          onClick={() => handleInsert('\\cite{${1:clave_bibliografica}} ')}
          className="p-1 rounded hover:bg-accent hover:text-foreground transition flex items-center space-x-1"
          title="Cita Bibliográfica (\cite{})"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="text-[11px]">Cita</span>
        </button>
        <button
          onClick={() => handleInsert('\\label{${1:etiqueta}} ')}
          className="p-1 rounded hover:bg-accent hover:text-foreground transition"
          title="Etiqueta (\label{})"
        >
          <span className="text-[11px] font-mono">label</span>
        </button>
        <button
          onClick={() => handleInsert('\\ref{${1:etiqueta}} ')}
          className="p-1 rounded hover:bg-accent hover:text-foreground transition"
          title="Referencia cruzada (\ref{})"
        >
          <span className="text-[11px] font-mono">ref</span>
        </button>
        <button
          onClick={() => handleInsert('\\href{${1:https://ejemplo.com}}{${2:Texto enlace}} ')}
          className="p-1 rounded hover:bg-accent hover:text-foreground transition"
          title="Hiperenlace (\href{})"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
