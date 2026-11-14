import { LumenAPI, CompilerInfo, ProjectMetadata, TemplateId, CollabStatus, CompilationResult, ProjectFile } from '../../shared/types';
import { TEMPLATES } from '../../shared/templates';

function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ');
}

function cleanLatexText(text: string): string {
  return text
    .replace(/\\textbf\{([^}]+)\}/g, '$1')
    .replace(/\\textit\{([^}]+)\}/g, '$1')
    .replace(/\\texttt\{([^}]+)\}/g, '$1')
    .replace(/\\large\s*/g, '')
    .replace(/\\LARGE\s*/g, '')
    .replace(/\\bfseries\s*/g, '')
    .replace(/\\uppercase\s*/g, '')
    .replace(/\\\\/g, ' ')
    .replace(/\\,/g, ' ')
    .replace(/[\$\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateDynamicPdfBase64(sourceCode: string, projectName: string): string {
  const titleMatch = sourceCode.match(/\\title(?:\[[^\]]*\])?\{([\s\S]*?)\}/);
  const title = titleMatch ? cleanLatexText(titleMatch[1]) : projectName;

  const authorMatch = sourceCode.match(/\\author(?:\[[^\]]*\])?\{([\s\S]*?)\}/);
  const author = authorMatch ? cleanLatexText(authorMatch[1]) : 'Autor';

  const lines: { text: string; isHeading: boolean }[] = [];
  
  const abstractMatch = sourceCode.match(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/);
  if (abstractMatch) {
    lines.push({ text: 'Resumen (Abstract)', isHeading: true });
    const absText = cleanLatexText(abstractMatch[1]);
    for (let i = 0; i < absText.length; i += 75) {
      lines.push({ text: absText.substring(i, i + 75), isHeading: false });
    }
  }

  const bodyText = sourceCode.replace(/\\begin\{abstract\}[\s\S]*?\\end\{abstract\}/, '');
  const sectionRegex = /\\(?:section|chapter|subsection|begin\{frame\})\*?\{?([^}\n]*)\}?/g;
  let secMatch;
  let secCount = 0;
  while ((secMatch = sectionRegex.exec(bodyText)) !== null && lines.length < 35) {
    const rawTitle = secMatch[1] ? cleanLatexText(secMatch[1]) : '';
    if (rawTitle && rawTitle.length > 1) {
      secCount++;
      lines.push({ text: `${secCount}. ${rawTitle}`, isHeading: true });
    }
  }

  if (lines.length === 0) {
    const cleanBody = cleanLatexText(
      sourceCode
        .replace(/\\[a-zA-Z]+(\[[^\]]*\])?(\{[^}]*\})?/g, '')
        .replace(/[{}]/g, '')
    );
    for (let i = 0; i < Math.min(cleanBody.length, 600); i += 75) {
      lines.push({ text: cleanBody.substring(i, i + 75), isHeading: false });
    }
  }

  let stream = 'BT\n';
  stream += '/F2 18 Tf\n0 0 0 rg\n';
  stream += `50 780 Td\n(${escapePdfText(title.substring(0, 60))}) Tj\n`;
  stream += 'ET\n';

  stream += 'BT\n/F1 10 Tf\n0.3 0.3 0.3 rg\n';
  const now = new Date().toLocaleTimeString();
  stream += `50 758 Td\n(${escapePdfText(author.substring(0, 45))}  |  Compilado: ${now}) Tj\n`;
  stream += 'ET\n';

  stream += '0.5 w\n0.7 0.7 0.7 RG\n50 746 m 545 746 l S\n';

  let y = 720;
  for (const item of lines) {
    if (y < 60) break;
    stream += 'BT\n';
    if (item.isHeading) {
      y -= 6;
      stream += '/F2 12 Tf\n0.1 0.1 0.1 rg\n';
    } else {
      stream += '/F1 10 Tf\n0.25 0.25 0.25 rg\n';
    }
    stream += `50 ${y} Td\n(${escapePdfText(item.text)}) Tj\n`;
    stream += 'ET\n';
    y -= item.isHeading ? 18 : 13;
  }

  stream += 'BT\n/F1 8 Tf\n0.5 0.5 0.5 rg\n50 28 Td\n(LUMEN Modern LaTeX Desktop Editor  |  Previsualizacion Reactiva en Tiempo Real) Tj\nET\n';

  const streamBytes = new TextEncoder().encode(stream);
  const streamLen = streamBytes.length;

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
6 0 obj
<< /Length ${streamLen} >>
stream
${stream}
endstream
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000318 00000 n 
0000000397 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
${470 + streamLen}
%%EOF`;

  const bytes = new TextEncoder().encode(pdf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Check if native Electron API is present
export function initLumenAPI(): void {
  if (typeof window !== 'undefined' && !window.lumenAPI) {
    if (/Electron/i.test(navigator.userAgent)) {
      // This is a hard failure: the native preload bridge did not load, so
      // compilation would silently use the mock PDF generator instead of the
      // real LaTeX compiler. Keep the app usable but make the problem obvious.
      console.error(
        'LUMEN: The Electron preload bridge is unavailable. LaTeX compilation ' +
        'will use the web mock. Check that dist-electron/preload.cjs exists and ' +
        'that BrowserWindow.webPreferences.preload points to it.'
      );
    } else {
      console.warn('LUMEN: Running in Web / Dev Mode. Initializing High-Fidelity Web Fallback.');
    }

    // In-memory virtual filesystem for web preview
    const vfs: Record<string, string> = {
      '/home/usuario/Documentos/Proyecto-Demo/main.tex': TEMPLATES.article.defaultMainContent,
      '/home/usuario/Documentos/Proyecto-Demo/sections/introduction.tex': '% Introducción...',
    };

    const mockCompilers: CompilerInfo[] = [
      {
        type: 'tectonic',
        name: 'Tectonic (Fast & Portable)',
        path: 'tectonic',
        available: true,
        version: '0.17.0',
        isDefault: true,
      },
      {
        type: 'pdflatex',
        name: 'pdfLaTeX (TeX Live)',
        path: 'pdflatex',
        available: false,
      },
      {
        type: 'xelatex',
        name: 'XeLaTeX (Unicode)',
        path: 'xelatex',
        available: false,
      },
    ];

    let collabHosting = false;
    let collabToken = 'LUMEN77';
    let collabPort = 8765;

    window.lumenAPI = {
      isNative: false,
      selectDirectory: async () => '/home/usuario/Documentos/Proyecto-Demo',
      selectImage: async () => ({
        path: '/home/usuario/Imágenes/figura1.png',
        name: 'figura1.png',
      }),
      readProjectTree: async (projectPath: string): Promise<ProjectFile[]> => {
        const items: ProjectFile[] = [
          {
            name: 'main.tex',
            path: `${projectPath}/main.tex`,
            relativePath: 'main.tex',
            isDirectory: false,
            extension: '.tex',
          },
          {
            name: 'sections',
            path: `${projectPath}/sections`,
            relativePath: 'sections',
            isDirectory: true,
            children: [
              {
                name: 'introduction.tex',
                path: `${projectPath}/sections/introduction.tex`,
                relativePath: 'sections/introduction.tex',
                isDirectory: false,
                extension: '.tex',
              },
            ],
          },
          {
            name: 'images',
            path: `${projectPath}/images`,
            relativePath: 'images',
            isDirectory: true,
            children: [],
          },
        ];
        return items;
      },
      pathExists: async () => true,
      readFile: async (filePath: string) => {
        return vfs[filePath] || TEMPLATES.article.defaultMainContent;
      },
      writeFile: async (filePath: string, content: string) => {
        vfs[filePath] = content;
        return true;
      },
      createFile: async (filePath: string, content = '') => {
        vfs[filePath] = content;
        return true;
      },
      createFolder: async () => true,
      deletePath: async (targetPath: string) => {
        delete vfs[targetPath];
        return true;
      },
      renamePath: async (oldPath: string, newPath: string) => {
        if (vfs[oldPath] !== undefined) {
          vfs[newPath] = vfs[oldPath];
          delete vfs[oldPath];
        }
        return true;
      },
      copyFileToProject: async (sourcePath: string, targetFolderPath: string) => {
        const fileName = sourcePath.split(/[\\/]/).pop() || 'image.png';
        const destination = `${targetFolderPath}/${fileName}`;
        vfs[destination] = '';
        return destination;
      },
      getCompilers: async () => mockCompilers,
      compile: async (params): Promise<CompilationResult> => {
        const startTime = Date.now();
        const mainPath = `${params.projectPath}/${params.mainFile}`;
        const source = params.sourceCode !== undefined ? params.sourceCode : (vfs[mainPath] || '');
        if (params.sourceCode !== undefined) {
          vfs[mainPath] = params.sourceCode;
        }

        const projectName = params.projectPath.split('/').pop() || 'Proyecto';
        const dynamicBase64 = generateDynamicPdfBase64(source, projectName);

        return {
          success: true,
          pdfPath: `${params.projectPath}/output/main.pdf`,
          pdfBufferBase64: dynamicBase64,
          log: `[LUMEN Web Engine: ${params.compiler}]\nDocumento compilado con éxito en tiempo real.\nSalida generada: ${params.projectPath}/output/main.pdf`,
          errors: [],
          warnings: [],
          durationMs: Date.now() - startTime + 80,
          timestamp: new Date().toISOString(),
        };
      },
      readPdfBase64: async () => null,
      getDefaultProjectPath: async () => '/home/usuario/Documentos',
      getRecentProjects: async (): Promise<ProjectMetadata[]> => {
        const saved = localStorage.getItem('lumen_recent_projects');
        if (saved) {
          try {
            return JSON.parse(saved);
          } catch {
            // ignore
          }
        }
        return [
          {
            id: 'demo-1',
            name: 'Proyecto-Demo',
            path: '/home/usuario/Documentos/Proyecto-Demo',
            mainFile: 'main.tex',
            compiler: 'tectonic',
            createdAt: new Date().toISOString(),
            lastOpened: new Date().toISOString(),
            isFavorite: true,
          },
        ];
      },
      saveProjectMetadata: async (project: ProjectMetadata) => {
        const saved = localStorage.getItem('lumen_recent_projects');
        let list: ProjectMetadata[] = saved ? JSON.parse(saved) : [];
        list = list.filter((p) => p.path !== project.path);
        list.unshift(project);
        localStorage.setItem('lumen_recent_projects', JSON.stringify(list));
      },
      createProjectFromTemplate: async (params): Promise<ProjectMetadata> => {
        const template = TEMPLATES[params.templateId] || TEMPLATES.article;
        const projectPath = `${params.targetPath}/${params.projectName}`;
        vfs[`${projectPath}/main.tex`] = template.defaultMainContent;

        const metadata: ProjectMetadata = {
          id: `proj-${Date.now()}`,
          name: params.projectName,
          path: projectPath,
          mainFile: 'main.tex',
          compiler: 'tectonic',
          createdAt: new Date().toISOString(),
          lastOpened: new Date().toISOString(),
        };

        const saved = localStorage.getItem('lumen_recent_projects');
        let list: ProjectMetadata[] = saved ? JSON.parse(saved) : [];
        list.unshift(metadata);
        localStorage.setItem('lumen_recent_projects', JSON.stringify(list));

        return metadata;
      },
      copyProjectToDirectory: async (params): Promise<ProjectMetadata> => {
        const newProjectPath = `${params.targetDirectory}/${params.newProjectName}`;
        Object.keys(vfs).forEach((oldKey) => {
          if (oldKey.startsWith(params.sourcePath)) {
            const rel = oldKey.substring(params.sourcePath.length);
            vfs[`${newProjectPath}${rel}`] = vfs[oldKey];
          }
        });
        const metadata: ProjectMetadata = {
          id: `proj-${Date.now()}`,
          name: params.newProjectName,
          path: newProjectPath,
          mainFile: 'main.tex',
          compiler: 'tectonic',
          createdAt: new Date().toISOString(),
          lastOpened: new Date().toISOString(),
        };
        const saved = localStorage.getItem('lumen_recent_projects');
        let list: ProjectMetadata[] = saved ? JSON.parse(saved) : [];
        list.unshift(metadata);
        localStorage.setItem('lumen_recent_projects', JSON.stringify(list));
        return metadata;
      },
      saveFileAs: async (params) => {
        vfs[params.defaultPath] = params.content;
        return params.defaultPath;
      },
      startCollabServer: async (params) => {
        collabHosting = true;
        collabPort = params.port || 8765;
        collabToken = params.token || 'LUMEN77';
        return {
          success: true,
          port: collabPort,
          token: collabToken,
          ips: ['192.168.1.105', '127.0.0.1'],
        };
      },
      stopCollabServer: async () => {
        collabHosting = false;
        return true;
      },
      getCollabStatus: async (): Promise<CollabStatus> => ({
        isHosting: collabHosting,
        port: collabPort,
        token: collabToken,
        hostIPs: ['192.168.1.105', '127.0.0.1'],
        clients: collabHosting
          ? [
              {
                id: 'p-1',
                name: 'Dr. García (Host)',
                color: '#6366f1',
                isHost: true,
                canWrite: true,
                connectedAt: new Date().toISOString(),
              },
            ]
          : [],
      }),
      getLocalIPs: async () => ['192.168.1.105', '127.0.0.1'],
      exportPdf: async (pdfPath: string) => {
        if (!pdfPath) return false;
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${'JVBERi0xLjUK'}`;
        link.download = pdfPath.split('/').pop() || 'main.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
        return true;
      },
      showInFileManager: async () => {},
    };
  }
}
