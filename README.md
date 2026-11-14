# LUMEN — Modern LaTeX Desktop Editor

![LUMEN Logo](https://img.shields.io/badge/LUMEN-LaTeX%20Desktop%20Editor-6366f1?style=for-the-badge)
![Linux](https://img.shields.io/badge/OS-Ubuntu%20%7C%20Linux%20Mint-E95420?style=for-the-badge&logo=ubuntu)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Electron](https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white)

**LUMEN** es un entorno de escritorio profesional para la redacción de documentos científicos, académicos, tesis, libros y presentaciones con LaTeX en sistemas Linux (Ubuntu y Linux Mint). Combina la potencia y rigor tipográfico de LaTeX con una interfaz moderna, minimalista y fluida inspirada en **Linear, VS Code, Notion, Overleaf y Figma**.

---

## 🌟 Características Principales

### 1. Interfaz Minimalista y Dividida en Tiempo Real
- **Panel Izquierdo:** Editor de código LaTeX con Monaco Editor (el motor detrás de VS Code).
- **Panel Derecho:** Previsualización reactiva de documentos PDF compilados mediante PDF.js con soporte High-DPI.
- **Divisor Arrastrable:** Redimensionamiento fluido con memoria persistente y relstablecimiento 50/50 con doble clic.
- **Tema Oscuro y Claro:** Paleta de colores profesional de baja saturación con acentos discretos y tipografía optimizada (*Inter* y *JetBrains Mono*).

### 2. Editor LaTeX de Nivel Profesional
- Resaltado de sintaxis LaTeX completo.
- Autocompletado inteligente de entornos (`\begin{equation}`, `\begin{table}`, `\begin{figure}`, etc.) y comandos.
- Marcadores de error y advertencia en el gutter y texto.
- Plegado de código, numeración de líneas y búsqueda/reemplazo (`Ctrl+F`).
- Atajos de teclado nativos: `Ctrl+Enter` para compilar, `Ctrl+S` para guardar, `Ctrl+B` para alternar explorador.

### 3. Sistema de Inserción Visual de Elementos
Barra de herramientas integrada para insertar componentes LaTeX con un solo clic:
- **Insertar Imagen:** Diálogo de selección, copia automática del archivo a `images/` y generación del bloque `\begin{figure}` con posicionamiento y caption.
- **Estructura:** Secciones, subsecciones, documentos en 2 y 3 columnas (`multicols`), saltos de página.
- **Listas:** Viñetas (`itemize`) y listas numeradas (`enumerate`).
- **Bloques de Código y Citas:** `\begin{lstlisting}`, `\begin{quote}` y recuadros de alerta `\begin{tcolorbox}`.
- **Referencias:** Inserción de `\cite{}`, `\ref{}`, `\label{}` e hipervínculos `\href{}`.

### 4. Diseñador Visual de Tablas (WYSIWYG)
Herramienta gráfica interactiva para construir tablas complejas:
- Control dinámico de filas y columnas (+/-).
- Alineación individual por columna (Izquierda, Centro, Derecha).
- Modos tipográficos: **Booktabs académico** (`\toprule`, `\midrule`, `\bottomrule`) o bordes estándar de celda.
- Encabezado con formato automático en negrita.
- Previsualización en vivo del código LaTeX generado.

### 5. Constructor Visual de Ecuaciones Matemáticas
- Paleta organizada de símbolos: letras griegas, operadores, cálculo ($\int, \sum, \partial, \nabla$), fracciones, raíces y matrices.
- Renderizado interactivo inmediato mediante motor **KaTeX**.
- Opciones para ecuación en bloque numerada (`\begin{equation}`) o en línea (`$...$`).

### 6. Motores de Compilación Reales
LUMEN detecta y soporta múltiples compiladores instalados en Linux:
- **Tectonic (Motor Recomendado):** Compilación incremental ultrarrápida que descarga paquetes TeX automáticamente sin requerir instalaciones pesadas.
- **pdfLaTeX (TeX Live):** El estándar tradicional.
- **XeLaTeX:** Soporte completo de Unicode y tipografías del sistema.
- **LuaLaTeX:** Motor moderno de scripting tipográfico.
- **Latexmk:** Automatización multi-pasada con resolución de bibliografías.

### 7. Panel de Diagnóstico Inteligente
Convierte los registros crudos de la terminal LaTeX en diagnósticos legibles:
- Lista categorizada de **Errores** y **Advertencias**.
- Identificación exacta del archivo y número de línea.
- Acceso rápido: haz clic en cualquier error para saltar y resaltar la línea correspondiente en el editor.
- Visor del registro completo `.log` con opción de copiado rápido.

### 8. Colaboración Descentralizada en Tiempo Real (P2P Host)
- **Alojamiento Local:** La computadora del creador funciona como servidor anfitrión sin depender de nubes externas ni suscripciones de pago.
- **Sincronización CRDT:** Comunicación por WebSockets para edición colaborativa libre de conflictos.
- **Conectividad:** Detección de direcciones IP locales (LAN / Wi-Fi) y generación de tokens de seguridad para invitar colegas en un solo clic.
- **Gestión de Sesión:** Control de participantes conectados e inicio/detención del servidor desde la interfaz.

### 9. Gestión de Proyectos
- Estructura estándar en disco:
  ```
  proyecto/
  ├── main.tex
  ├── images/
  ├── sections/
  │   └── introduction.tex
  ├── bibliography/
  │   └── references.bib
  └── output/
      └── document.pdf
  ```
- Pantalla de bienvenida con plantillas integradas:
  - Artículo Científico
  - Tesis de Grado o Posgrado
  - IEEE Conference Paper (2 columnas)
  - Presentación Beamer (Diapositivas)
  - Curriculum Vitae
  - Documento en Blanco
- Explorador lateral de archivos con creación, cambio de nombre, eliminación y apertura en el gestor de archivos de Ubuntu/Mint.

---

## 🚀 Requisitos del Sistema

- **Sistema Operativo:** Ubuntu 20.04+, Linux Mint 20+, Debian 11+ o distribuciones derivadas de Linux x86_64.
- **Node.js:** Versión 18+ (recomendado Node 20 LTS).
- **Compilador LaTeX:** `tectonic` (instalado en `~/.local/bin/tectonic` o PATH) o `texlive` (`pdflatex`, `xelatex`).

---

## 🛠️ Instalación y Puesta en Marcha

### 1. Clonar o acceder al repositorio
```bash
git clone https://github.com/titooDiaz/LUMEN.git
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Iniciar en modo desarrollo
```bash
npm run dev
```

### 4. Compilar para producción y generar instaladores Linux (.deb y .AppImage)
```bash
npm run build
```
Los instaladores generados se encontrarán en el directorio `release/`:
- `release/LUMEN-1.0.0.AppImage` (portable)
- `release/lumen-latex_1.0.0_amd64.deb` (instalable con `dpkg -i`)

---

## 📂 Arquitectura del Código

```
src/
├── main/
│   ├── index.ts              # Proceso principal de Electron (ventanas, IPC, menús)
│   ├── preload.ts            # Puente seguro contextBridge (LumenAPI)
│   └── ipc/
│       ├── fsHandlers.ts     # Manejador de sistema de archivos y selector de imágenes
│       ├── latexHandlers.ts  # Detección de compiladores, ejecución y parser de logs
│       ├── projectHandlers.ts# Almacén de proyectos recientes y creación desde plantilla
│       └── collabServer.ts   # Servidor WebSocket CRDT descentralizado
├── shared/
│   ├── types.ts              # Tipos TypeScript compartidos (diagnósticos, proyectos, collab)
│   └── templates.ts          # Definiciones y contenidos de las plantillas LaTeX
└── renderer/
    ├── main.tsx              # Punto de entrada React
    ├── App.tsx               # Orquestador del espacio de trabajo y estado global
    ├── styles/
    │   └── index.css         # Configuración Tailwind, temas oscuro/claro y scrollbars
    ├── components/
    │   ├── layout/
    │   │   ├── HeaderBar.tsx # Barra superior (compilación, zoom, exportación, collab, tema)
    │   │   ├── Sidebar.tsx   # Explorador de archivos en árbol
    │   │   └── SplitView.tsx # Divisor arrastrable de paneles
    │   ├── editor/
    │   │   ├── LatexEditor.tsx    # Editor Monaco con LaTeX, autocompletado y marcadores
    │   │   ├── VisualToolbar.tsx  # Barra de herramientas de inserción rápida
    │   │   └── DiagnosticPanel.tsx# Panel inferior de errores y registro de compilación
    │   ├── preview/
    │   │   └── PdfViewer.tsx      # Visor PDF.js multi-página, zoom y pantalla completa
    │   ├── modals/
    │   │   ├── TableEditorModal.tsx # Diseñador visual de tablas
    │   │   ├── MathInsertModal.tsx  # Constructor visual de fórmulas con KaTeX
    │   │   ├── ImageInsertModal.tsx # Inserción guiada de imágenes
    │   │   ├── CollabModal.tsx      # Gestión de sesiones P2P Host
    │   │   └── NewProjectModal.tsx  # Selector de plantillas y nuevo proyecto
    │   └── welcome/
    │       └── WelcomeScreen.tsx    # Espacio inicial de bienvenida y proyectos recientes
    └── utils/
        └── webFallbackApi.ts        # Fallback de alta fidelidad para previsualización web y tests
```

---

## 📄 Licencia

Este proyecto está distribuido bajo la licencia **MIT**. Desarrollado para la comunidad académica y científica de software libre.
