import { LumenAPI, CompilerInfo, ProjectMetadata, TemplateId, CollabStatus, CompilationResult, ProjectFile } from '../../shared/types';
import { TEMPLATES } from '../../shared/templates';

// Check if native Electron API is present
export function initLumenAPI(): void {
  if (typeof window !== 'undefined' && !window.lumenAPI) {
    console.warn('LUMEN: Running in Web / Dev Mode. Initializing High-Fidelity Web Fallback.');

    // In-memory virtual filesystem for web preview
    const vfs: Record<string, string> = {
      '/home/miguel/Documents/Proyecto-Demo/main.tex': TEMPLATES.article.defaultMainContent,
      '/home/miguel/Documents/Proyecto-Demo/sections/introduction.tex': '% Introducción...',
    };

    const mockCompilers: CompilerInfo[] = [
      {
        type: 'tectonic',
        name: 'Tectonic (Fast & Portable)',
        path: '/home/miguel/.local/bin/tectonic',
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
      selectDirectory: async () => '/home/miguel/Documents/Proyecto-Demo',
      selectImage: async () => ({
        path: '/home/miguel/Pictures/figure1.png',
        name: 'figure1.png',
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
        const fileName = sourcePath.split('/').pop() || 'image.png';
        return `${targetFolderPath}/${fileName}`;
      },
      getCompilers: async () => mockCompilers,
      compile: async (params): Promise<CompilationResult> => {
        const startTime = Date.now();
        // In web fallback mode, we synthesize a clean PDF or return success
        return {
          success: true,
          pdfPath: `${params.projectPath}/output/main.pdf`,
          pdfBufferBase64: 'JVBERi0xLjUKJcfsj6IKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA1OTUgODQyXQovQ29udGVudHMgNCAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0xlbmd0aCA4NQo+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjEwMCA3NTAgVGROCihMVU1FTiAtIE1vZGVybiBMYVRlWCBFZGl0b3IpIFRqCjEwMCA3MDAgVGROCihDb21waWxhZG8gY29uIMOpeGl0bykgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTggMDAwMDAgbiAKMDAwMDAwMDA3MCAwMDAwMCBuIAowMDAwMDAwMTI3IDAwMDAwIG4gCjAwMDAwMDAyMjUgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA1Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgozNjAKJSVFT0YK',
          log: `[LUMEN Engine: ${params.compiler}]\nDocumento compilado con éxito.\nSalida generada: ${params.projectPath}/output/main.pdf`,
          errors: [],
          warnings: [],
          durationMs: Date.now() - startTime + 380,
          timestamp: new Date().toISOString(),
        };
      },
      readPdfBase64: async () => null,
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
            path: '/home/miguel/Documents/Proyecto-Demo',
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
      exportPdf: async () => true,
      showInFileManager: async () => {},
    };
  }
}
