import { app } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { ProjectMetadata, TemplateId } from '../../shared/types';
import { TEMPLATES } from '../../shared/templates';

export function getDefaultProjectPath(): string {
  try {
    const docs = app.getPath('documents');
    if (docs && fs.existsSync(docs)) return docs;
  } catch {
    // ignore
  }
  const home = os.homedir();
  const docsEs = path.join(home, 'Documentos');
  if (fs.existsSync(docsEs)) return docsEs;
  const docsEn = path.join(home, 'Documents');
  if (fs.existsSync(docsEn)) return docsEn;
  return home;
}

function getStoragePath(): string {
  const dir = app.getPath('userData');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, 'recent-projects.json');
}

export function loadRecentProjects(): ProjectMetadata[] {
  try {
    const file = getStoragePath();
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf-8');
      const list: ProjectMetadata[] = JSON.parse(data);
      // Filter out paths that no longer exist on disk
      return list.filter((p) => fs.existsSync(p.path));
    }
  } catch (err) {
    console.error('Failed to load recent projects:', err);
  }
  return [];
}

export function saveRecentProject(project: ProjectMetadata): void {
  try {
    const file = getStoragePath();
    let list = loadRecentProjects();
    // Remove if already exists, then add to front
    list = list.filter((p) => p.path !== project.path);
    list.unshift({ ...project, lastOpened: new Date().toISOString() });
    // Keep top 20
    list = list.slice(0, 20);
    fs.writeFileSync(file, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save recent project:', err);
  }
}

export { TEMPLATES };

export async function createProjectFromTemplate(params: {
  templateId: TemplateId;
  targetPath: string;
  projectName: string;
}): Promise<ProjectMetadata> {
  const { templateId, targetPath, projectName } = params;
  
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }

  const projectDir = path.join(targetPath, projectName);

  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  // Create standard subdirectories
  const imagesDir = path.join(projectDir, 'images');
  const outputDir = path.join(projectDir, 'output');
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const template = TEMPLATES[templateId] || TEMPLATES.blank;

  // Write main.tex
  const mainFile = 'main.tex';
  const mainFilePath = path.join(projectDir, mainFile);
  fs.writeFileSync(mainFilePath, template.defaultMainContent, 'utf-8');

  // Write additional files if template defines them
  if (template.files) {
    for (const [relPath, content] of Object.entries(template.files)) {
      const fullFilePath = path.join(projectDir, relPath);
      const parentDir = path.dirname(fullFilePath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(fullFilePath, content, 'utf-8');
    }
  }

  const metadata: ProjectMetadata = {
    id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: projectName,
    path: projectDir,
    mainFile,
    compiler: 'tectonic',
    createdAt: new Date().toISOString(),
    lastOpened: new Date().toISOString(),
  };

  saveRecentProject(metadata);
  return metadata;
}

export async function copyProjectToDirectory(params: {
  sourcePath: string;
  targetDirectory: string;
  newProjectName: string;
}): Promise<ProjectMetadata> {
  const { sourcePath, targetDirectory, newProjectName } = params;

  if (!fs.existsSync(targetDirectory)) {
    fs.mkdirSync(targetDirectory, { recursive: true });
  }

  const newProjectDir = path.join(targetDirectory, newProjectName);
  if (!fs.existsSync(newProjectDir)) {
    fs.mkdirSync(newProjectDir, { recursive: true });
  }

  // Copy all files recursively from sourcePath to newProjectDir, skipping node_modules and .git
  const copyRecursive = (src: string, dest: string) => {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      if (['.git', 'node_modules', '.cache'].includes(entry.name)) continue;
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };

  copyRecursive(sourcePath, newProjectDir);

  // Identify mainFile
  let mainFile = 'main.tex';
  if (!fs.existsSync(path.join(newProjectDir, mainFile))) {
    const entries = fs.readdirSync(newProjectDir);
    const texFile = entries.find((e) => e.endsWith('.tex'));
    if (texFile) mainFile = texFile;
  }

  const metadata: ProjectMetadata = {
    id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: newProjectName,
    path: newProjectDir,
    mainFile,
    compiler: 'tectonic',
    createdAt: new Date().toISOString(),
    lastOpened: new Date().toISOString(),
  };

  saveRecentProject(metadata);
  return metadata;
}
