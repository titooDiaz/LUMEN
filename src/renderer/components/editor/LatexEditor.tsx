import React, { useRef, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import type * as monacoType from 'monaco-editor';
import { DiagnosticItem } from '../../../shared/types';

interface LatexEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  onCompile: () => void;
  onSave: () => void;
  theme: 'dark' | 'light';
  diagnostics: DiagnosticItem[];
  editorRef: React.MutableRefObject<monacoType.editor.IStandaloneCodeEditor | null>;
}

export const LatexEditor: React.FC<LatexEditorProps> = ({
  value,
  onChange,
  onCompile,
  onSave,
  theme,
  diagnostics,
  editorRef,
}) => {
  const monacoInstanceRef = useRef<Monaco | null>(null);

  const handleEditorDidMount = (
    editor: monacoType.editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editorRef.current = editor;
    monacoInstanceRef.current = monaco;

    // Define custom LUMEN dark and light themes
    monaco.editor.defineTheme('lumen-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '818cf8', fontStyle: 'bold' },
        { token: 'comment', foreground: '71717a', fontStyle: 'italic' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'f59e0b' },
        { token: 'tag', foreground: '38bdf8' },
        { token: 'delimiter', foreground: 'a1a1aa' },
      ],
      colors: {
        'editor.background': '#09090b',
        'editor.foreground': '#f4f4f5',
        'editor.lineHighlightBackground': '#18181b',
        'editorLineNumber.foreground': '#52525b',
        'editorLineNumber.activeForeground': '#818cf8',
        'editorCursor.foreground': '#818cf8',
        'editor.selectionBackground': '#27272a80',
        'editor.inactiveSelectionBackground': '#27272a40',
      },
    });

    monaco.editor.defineTheme('lumen-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '4f46e5', fontStyle: 'bold' },
        { token: 'comment', foreground: '71717a', fontStyle: 'italic' },
        { token: 'string', foreground: '059669' },
        { token: 'number', foreground: 'd97706' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#18181b',
        'editor.lineHighlightBackground': '#f4f4f5',
        'editorLineNumber.foreground': '#a1a1aa',
        'editorLineNumber.activeForeground': '#4f46e5',
        'editorCursor.foreground': '#4f46e5',
      },
    });

    monaco.editor.setTheme(theme === 'dark' ? 'lumen-dark' : 'lumen-light');

    // Register LaTeX snippets and autocomplete
    monaco.languages.registerCompletionItemProvider('latex', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions: monacoType.languages.CompletionItem[] = [
          {
            label: '\\documentclass',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\documentclass[${1:11pt,a4paper}]{${2:article}}\n',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Definir la clase del documento LaTeX',
            range,
          },
          {
            label: '\\usepackage',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\usepackage{${1:paquete}}\n',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Importar un paquete LaTeX',
            range,
          },
          {
            label: '\\begin{equation}',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\begin{equation}\n  ${1:f(x) = y}\n  \\label{eq:${2:etiqueta}}\n\\end{equation}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Entorno de ecuación matemática numerada',
            range,
          },
          {
            label: '\\begin{figure}',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\begin{figure}[htbp]\n  \\centering\n  \\includegraphics[width=${1:0.8\\textwidth}]{${2:images/foto.png}}\n  \\caption{${3:Descripción}}\n  \\label{fig:${4:foto}}\n\\end{figure}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Entorno de figura con imagen y pie',
            range,
          },
          {
            label: '\\begin{table}',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\begin{table}[htbp]\n  \\centering\n  \\caption{${1:Título}}\n  \\label{tab:${2:etiqueta}}\n  \\begin{tabular}{${3:llr}}\n    \\toprule\n    ${4:Encabezado 1} & ${5:Encabezado 2} & ${6:Encabezado 3} \\\\\n    \\midrule\n    ${7:Dato 1} & ${8:Dato 2} & ${9:Dato 3} \\\\\n    \\bottomrule\n  \\end{tabular}\n\\end{table}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Tabla profesional con estilo booktabs',
            range,
          },
          {
            label: '\\begin{itemize}',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\begin{itemize}\n  \\item ${1:Primer elemento}\n  \\item ${2:Segundo elemento}\n\\end{itemize}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Lista con viñetas',
            range,
          },
          {
            label: '\\begin{enumerate}',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\begin{enumerate}\n  \\item ${1:Paso 1}\n  \\item ${2:Paso 2}\n\\end{enumerate}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Lista numerada',
            range,
          },
          {
            label: '\\section',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\section{${1:Título de la Sección}}\n',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Nueva sección de primer nivel',
            range,
          },
          {
            label: '\\subsection',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\subsection{${1:Título de la Subsección}}\n',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Nueva subsección',
            range,
          },
          {
            label: '\\cite',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\cite{${1:clave}}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Cita bibliográfica',
            range,
          },
          {
            label: '\\ref',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\ref{${1:etiqueta}}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Referencia cruzada a figura/tabla/ecuación',
            range,
          },
          {
            label: '\\frac',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '\\frac{${1:a}}{${2:b}}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Fracción matemática',
            range,
          },
        ];

        return { suggestions };
      },
    });

    // Keybindings: Ctrl+Enter (Compile), Ctrl+S (Save)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onCompile();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });
  };

  // Sync theme changes with editor
  useEffect(() => {
    if (monacoInstanceRef.current) {
      monacoInstanceRef.current.editor.setTheme(theme === 'dark' ? 'lumen-dark' : 'lumen-light');
    }
  }, [theme]);

  // Set error markers in editor gutter and squiggly lines
  useEffect(() => {
    if (!editorRef.current || !monacoInstanceRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;

    const markers: monacoType.editor.IMarkerData[] = diagnostics.map((d) => ({
      startLineNumber: Math.max(1, d.line),
      startColumn: 1,
      endLineNumber: Math.max(1, d.line),
      endColumn: 100,
      message: d.message,
      severity:
        d.severity === 'error'
          ? monacoInstanceRef.current!.MarkerSeverity.Error
          : monacoInstanceRef.current!.MarkerSeverity.Warning,
    }));

    monacoInstanceRef.current.editor.setModelMarkers(model, 'lumen-latex', markers);
  }, [diagnostics]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage="latex"
        value={value}
        onChange={(val) => onChange(val || '')}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 13.5,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          minimap: { enabled: true, maxColumn: 80, scale: 0.8 },
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          tabSize: 2,
          insertSpaces: true,
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true, indentation: true },
          padding: { top: 12, bottom: 20 },
        }}
      />
    </div>
  );
};
