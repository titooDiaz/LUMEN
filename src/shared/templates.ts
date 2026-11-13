import { TemplateDefinition, TemplateId } from './types';

export const TEMPLATES: Record<TemplateId, TemplateDefinition> = {
  blank: {
    id: 'blank',
    name: 'Documento en Blanco',
    description: 'Estructura mínima con configuración estándar para comenzar desde cero.',
    badge: 'Mínimo',
    defaultMainContent: `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{amsmath}
\\usepackage{graphicx}
\\usepackage{hyperref}

\\title{Título del Documento}
\\author{Tu Nombre}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introducción}
Escribe aquí tu contenido...

\\end{document}
`,
  },

  article: {
    id: 'article',
    name: 'Artículo Académico / Científico',
    description: 'Formato estándar para papers y publicaciones de investigación con resumen y secciones.',
    badge: 'Recomendado',
    defaultMainContent: `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{hyperref}
\\usepackage{cite}
\\usepackage{geometry}
\\geometry{margin=2.5cm}

\\title{\\textbf{Investigación Científica: Avances y Metodologías con LUMEN}}
\\author{
  \\textbf{Dr. Nombre del Investigador}\\\\
  \\textit{Departamento de Ciencias de la Computación}\\\\
  \\textit{Universidad Tecnológica}\\\\
  \\texttt{investigador@universidad.edu}
}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Este documento presenta un estudio exhaustivo sobre las metodologías modernas en la redacción y publicación de artículos científicos con LaTeX en sistemas Linux Ubuntu y Mint. Se evalúan los tiempos de compilación, la fidelidad tipográfica y la colaboración descentralizada en tiempo real.
\\end{abstract}

\\section{Introducción}
La preparación de documentos científicos requiere herramientas tipográficas de alta precisión. LaTeX se ha consolidado como el estándar de facto en la comunidad académica mundial.

\\section{Metodología}
Para evaluar los resultados, se emplearon modelos matemáticos rigurosos. Considérese la siguiente formulación fundamental:

\\begin{equation}
  E = mc^2 + \\int_{0}^{\\infty} \\psi(x, t) \\, dx
  \\label{eq:fundamental}
\\end{equation}

\\subsection{Variables de Control}
En la Tabla~\\ref{tab:parametros} se resumen los parámetros principales utilizados durante los experimentos.

\\begin{table}[htbp]
  \\centering
  \\caption{Parámetros de Simulación Experimental}
  \\label{tab:parametros}
  \\begin{tabular}{llr}
    \\toprule
    \\textbf{Parámetro} & \\textbf{Descripción} & \\textbf{Valor} \\\\
    \\midrule
    $\\alpha$ & Tasa de aprendizaje & $0.001$ \\\\
    $\\beta$ & Factor de convergencia & $0.95$ \\\\
    $N$ & Muestras evaluadas & $10{,}000$ \\\\
    \\bottomrule
  \\end{tabular}
\\end{table}

\\section{Conclusiones}
LUMEN permite a investigadores y estudiantes concentrarse en el contenido y la calidad académica, combinando el poder absoluto de LaTeX con una interfaz moderna y eficiente.

\\end{document}
`,
  },

  thesis: {
    id: 'thesis',
    name: 'Tesis de Grado o Posgrado',
    description: 'Estructura modular completa con portada, capítulos, bibliografía e imágenes.',
    badge: 'Completo',
    defaultMainContent: `\\documentclass[12pt,oneside,a4paper]{report}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{geometry}
\\geometry{top=3cm,bottom=3cm,left=3.5cm,right=2.5cm}

\\title{
  \\vspace{-2cm}
  \\textbf{DESARROLLO DE SISTEMAS DISTRIBUIDOS REACTIVOS}\\\\[1.5cm]
  \\large TESIS DE GRADO
}
\\author{
  \\textbf{Tesista:} Juan Pérez\\\\
  \\textbf{Director:} Dr. Carlos Gómez
}
\\date{\\today}

\\begin{document}

\\maketitle

\\tableofcontents

\\chapter{Introducción}
\\input{sections/introduction.tex}

\\chapter{Marco Teórico}
\\input{sections/methodology.tex}

\\chapter{Conclusiones}
En este trabajo de investigación se demostró la viabilidad de arquitecturas descentralizadas para la edición tipográfica colaborativa.

\\end{document}
`,
    files: {
      'sections/introduction.tex': `% Introducción a la Tesis
En este capítulo se describe la problemática abordada, los objetivos generales y específicos, así como la justificación metodológica de la investigación.

\\section{Motivación}
La necesidad de redactar documentos académicos extensos demanda herramientas robustas y fiables.
`,
      'sections/methodology.tex': `% Metodología
\\section{Diseño Experimental}
Se implementó un pipeline automatizado para la compilación y validación de sintaxis en tiempo real.
`,
      'bibliography/references.bib': `@article{knuth1984texbook,
  title={The TeXbook},
  author={Knuth, Donald Ervin and Bibby, Duane},
  volume={1993},
  year={1984},
  publisher={Addison-Wesley Reading}
}
`,
    },
  },

  ieee: {
    id: 'ieee',
    name: 'IEEE Conference / Transacción',
    description: 'Formato estándar de dos columnas utilizado en conferencias internacionales de ingeniería.',
    badge: 'IEEE',
    defaultMainContent: `\\documentclass[conference]{IEEEtran}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{algorithmic}
\\usepackage{graphicx}
\\usepackage{textcomp}
\\usepackage{xcolor}

\\title{A Novel Architecture for Distributed Real-time LaTeX Collaboration}

\\author{
  \\IEEEauthorblockN{First Author}
  \\IEEEauthorblockA{\\textit{Dept. of Computer Science} \\\\
  \\textit{University of Engineering}\\\\
  City, Country \\\\
  author@university.edu}
}

\\begin{document}

\\maketitle

\\begin{abstract}
This paper presents the architectural foundations of LUMEN, an offline-first collaborative LaTeX desktop environment with CRDT synchronization and immediate visual feedback.
\\end{abstract}

\\begin{IEEEkeywords}
LaTeX, Desktop Applications, Real-time Collaboration, CRDT, Human-Computer Interaction
\\end{IEEEkeywords}

\\section{Introduction}
Modern scientific authorship demands synchronous editing without sacrificing document compilation integrity.

\\section{Architecture}
The desktop environment couples an embedded CRDT server with a fast incremental TeX engine.

\\section{Conclusion}
Future work includes extending decentralized synchronization through peer discovery.

\\end{document}
`,
  },

  presentation: {
    id: 'presentation',
    name: 'Presentación Beamer (Diapositivas)',
    description: 'Diseño elegante de diapositivas académicas y profesionales con el paquete Beamer.',
    badge: 'Slides',
    defaultMainContent: `\\documentclass{beamer}
\\usetheme{Madrid}
\\usecolortheme{beaver}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}

\\title[LUMEN Presentation]{LUMEN: Modern LaTeX Desktop Editor}
\\subtitle{Herramientas Visuales y Colaboración en Tiempo Real}
\\author{Equipo de Investigación}
\\date{\\today}

\\begin{document}

\\begin{frame}
  \\titlepage
\\end{frame}

\\begin{frame}{Contenido}
  \\tableofcontents
\\end{frame}

\\section{Visión General}
\\begin{frame}{¿Qué es LUMEN?}
  \\begin{itemize}
    \\item Editor de escritorio moderno para Linux (Ubuntu y Linux Mint).
    \\item Vista dividida con previsualización PDF interactiva.
    \\item Barra de inserción visual de ecuaciones, tablas e imágenes.
    \\item Colaboración descentralizada en tiempo real.
  \\end{itemize}
\\end{frame}

\\section{Ecuaciones y Tipografía}
\\begin{frame}{Potencia Tipográfica}
  \\begin{block}{Ecuación de Schrödinger}
    \\[ i\\hbar\\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r},t) = \\hat{H}\\Psi(\\mathbf{r},t) \\]
  \\end{block}
\\end{frame}

\\end{document}
`,
  },

  resume: {
    id: 'resume',
    name: 'Curriculum Vitae / Hoja de Vida',
    description: 'Plantilla profesional y limpia para presentar tu trayectoria académica y laboral.',
    badge: 'CV',
    defaultMainContent: `\\documentclass[10pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=2cm]{geometry}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\usepackage{enumitem}

\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{10pt}{5pt}

\\begin{document}
\\pagestyle{empty}

{\\LARGE \\textbf{Tu Nombre y Apellidos}}\\\\
\\vspace{2pt}
\\textit{Ingeniero de Software / Investigador Académico}\\\\
Email: \\href{mailto:correo@ejemplo.com}{correo@ejemplo.com} | Teléfono: +34 600 000 000 | LinkedIn: /in/usuario

\\section{Experiencia Profesional}
\\textbf{Desarrollador Senior} \\hfill 2022 -- Presente\\\\
\\textit{Empresa Tecnológica} \\hfill Remoto
\\begin{itemize}[noitemsep,topsep=0pt]
  \\item Liderazgo técnico en la arquitectura de aplicaciones desktop.
  \\item Optimización del pipeline de renderizado y visualización de documentos.
\\end{itemize}

\\section{Educación}
\\textbf{Grado en Ingeniería Informática} \\hfill 2018 -- 2022\\\\
\\textit{Universidad Politécnica}

\\section{Habilidades Técnicas}
\\textbf{Lenguajes:} TypeScript, C++, Python, LaTeX, Rust.\\\\
\\textbf{Herramientas:} Electron, React, Git, Linux, Docker.

\\end{document}
`,
  },
};
