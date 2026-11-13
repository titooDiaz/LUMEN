import { exec, spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { promisify } from 'node:util';
import { CompilationResult, CompilerInfo, CompilerType, DiagnosticItem } from '../../shared/types';

const execAsync = promisify(exec);

// Find tectonic path (check PATH and ~/.local/bin/tectonic)
function getTectonicPath(): string | null {
  const localBin = path.join(os.homedir(), '.local', 'bin', 'tectonic');
  if (fs.existsSync(localBin)) {
    return localBin;
  }
  return null;
}

export async function detectCompilers(): Promise<CompilerInfo[]> {
  const compilers: CompilerInfo[] = [];

  // Check tectonic
  const tectonicLocal = getTectonicPath();
  try {
    const cmd = tectonicLocal || 'tectonic';
    const { stdout } = await execAsync(`${cmd} --version`);
    const versionMatch = stdout.match(/Tectonic\s+([\d.]+)/i);
    compilers.push({
      type: 'tectonic',
      name: 'Tectonic (Modern & Fast)',
      path: tectonicLocal || 'tectonic',
      available: true,
      version: versionMatch ? versionMatch[1] : '0.17.0',
      isDefault: true,
    });
  } catch {
    compilers.push({
      type: 'tectonic',
      name: 'Tectonic',
      path: tectonicLocal || 'tectonic',
      available: false,
    });
  }

  // Check pdflatex
  try {
    const { stdout } = await execAsync('pdflatex --version');
    const versionMatch = stdout.match(/pdfTeX\s+([\d.-]+)/i);
    compilers.push({
      type: 'pdflatex',
      name: 'pdfLaTeX (TeX Live)',
      path: 'pdflatex',
      available: true,
      version: versionMatch ? versionMatch[1] : 'installed',
    });
  } catch {
    compilers.push({
      type: 'pdflatex',
      name: 'pdfLaTeX (TeX Live)',
      path: 'pdflatex',
      available: false,
    });
  }

  // Check xelatex
  try {
    const { stdout } = await execAsync('xelatex --version');
    const versionMatch = stdout.match(/XeTeX\s+([\d.-]+)/i);
    compilers.push({
      type: 'xelatex',
      name: 'XeLaTeX (Unicode & Modern Fonts)',
      path: 'xelatex',
      available: true,
      version: versionMatch ? versionMatch[1] : 'installed',
    });
  } catch {
    compilers.push({
      type: 'xelatex',
      name: 'XeLaTeX',
      path: 'xelatex',
      available: false,
    });
  }

  // Check lualatex
  try {
    const { stdout } = await execAsync('lualatex --version');
    const versionMatch = stdout.match(/LuaHBTeX\s+([\d.-]+)|LuaTeX\s+([\d.-]+)/i);
    compilers.push({
      type: 'lualatex',
      name: 'LuaLaTeX',
      path: 'lualatex',
      available: true,
      version: versionMatch ? (versionMatch[1] || versionMatch[2]) : 'installed',
    });
  } catch {
    compilers.push({
      type: 'lualatex',
      name: 'LuaLaTeX',
      path: 'lualatex',
      available: false,
    });
  }

  // Check latexmk
  try {
    const { stdout } = await execAsync('latexmk --version');
    const versionMatch = stdout.match(/Latexmk,\s+version:\s+([\d.]+)/i);
    compilers.push({
      type: 'latexmk',
      name: 'Latexmk (Automated Multi-pass)',
      path: 'latexmk',
      available: true,
      version: versionMatch ? versionMatch[1] : 'installed',
    });
  } catch {
    compilers.push({
      type: 'latexmk',
      name: 'Latexmk',
      path: 'latexmk',
      available: false,
    });
  }

  return compilers;
}

export function parseLatexLog(logContent: string, mainFileName: string): { errors: DiagnosticItem[]; warnings: DiagnosticItem[] } {
  const errors: DiagnosticItem[] = [];
  const warnings: DiagnosticItem[] = [];
  const lines = logContent.split('\n');

  let currentFile = mainFileName;
  let counter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect LaTeX error: "! LaTeX Error: <message>" or "! <message>"
    if (line.startsWith('! ')) {
      const message = line.substring(2).trim();
      let lineNumber = 1;
      let context = '';

      // Look ahead for "l.<number> <context>"
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const nextLine = lines[j];
        const lineMatch = nextLine.match(/^l\.(\d+)\s*(.*)$/);
        if (lineMatch) {
          lineNumber = parseInt(lineMatch[1], 10);
          context = lineMatch[2];
          break;
        }
      }

      errors.push({
        id: `err-${++counter}`,
        file: currentFile,
        line: lineNumber,
        severity: 'error',
        message: message,
        rawContext: context || undefined,
      });
    }

    // Detect LaTeX Warning: "LaTeX Warning: <message> on input line <number>."
    if (line.includes('Warning:')) {
      const match = line.match(/(?:LaTeX|Package|Class)\s+([\w-]+)?\s*Warning:\s*(.*?)(?:on input line (\d+))?\.?$/i);
      if (match) {
        const pkg = match[1] ? `[${match[1]}] ` : '';
        const msg = match[2] ? match[2].trim() : line.trim();
        const lineNum = match[3] ? parseInt(match[3], 10) : 1;

        warnings.push({
          id: `warn-${++counter}`,
          file: currentFile,
          line: lineNum,
          severity: 'warning',
          message: `${pkg}${msg}`,
        });
      }
    }

    // Tectonic format errors: "error: <message>"
    if (line.startsWith('error:')) {
      const match = line.match(/error:\s*(?:([^:]+):(\d+):)?\s*(.*)$/);
      if (match) {
        const errFile = match[1] || currentFile;
        const lineNum = match[2] ? parseInt(match[2], 10) : 1;
        const msg = match[3] || line;

        errors.push({
          id: `err-${++counter}`,
          file: path.basename(errFile),
          line: lineNum,
          severity: 'error',
          message: msg.trim(),
        });
      }
    }
  }

  return { errors, warnings };
}

export async function compileLatexProject(params: {
  projectPath: string;
  mainFile: string;
  compiler: CompilerType;
  sourceCode?: string;
}): Promise<CompilationResult> {
  const startTime = Date.now();
  const { projectPath, mainFile, compiler, sourceCode } = params;

  // Make sure output folder exists
  const outputDir = path.join(projectPath, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // If sourceCode was passed directly, save it to mainFile first to ensure consistency
  const mainFilePath = path.isAbsolute(mainFile) ? mainFile : path.join(projectPath, mainFile);
  if (sourceCode !== undefined) {
    fs.writeFileSync(mainFilePath, sourceCode, 'utf-8');
  }

  const baseName = path.basename(mainFilePath, path.extname(mainFilePath));
  const expectedPdfPath = path.join(outputDir, `${baseName}.pdf`);

  let binary = compiler as string;
  if (compiler === 'tectonic') {
    binary = getTectonicPath() || 'tectonic';
  }

  let cmdArgs: string[] = [];

  if (compiler === 'tectonic') {
    cmdArgs = [
      mainFilePath,
      '--outdir', outputDir,
      '--keep-logs',
      '--synctex',
    ];
  } else if (compiler === 'latexmk') {
    cmdArgs = [
      '-pdf',
      `-outdir=${outputDir}`,
      '-synctex=1',
      '-interaction=nonstopmode',
      mainFilePath,
    ];
  } else {
    // pdflatex, xelatex, lualatex
    cmdArgs = [
      '-synctex=1',
      '-interaction=nonstopmode',
      `-output-directory=${outputDir}`,
      mainFilePath,
    ];
  }

  return new Promise<CompilationResult>((resolve) => {
    let stdoutData = '';
    let stderrData = '';

    const proc = spawn(binary, cmdArgs, {
      cwd: projectPath,
      env: {
        ...process.env,
        PATH: `${path.join(os.homedir(), '.local', 'bin')}:${process.env.PATH}`,
      },
    });

    proc.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    proc.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    proc.on('error', (err) => {
      resolve({
        success: false,
        log: `Failed to launch compiler (${binary}): ${err.message}\n` +
             `Make sure ${compiler} or tectonic is installed.`,
        errors: [{
          id: 'launch-error',
          file: path.basename(mainFilePath),
          line: 1,
          severity: 'error',
          message: `Compiler "${compiler}" failed to launch: ${err.message}`,
        }],
        warnings: [],
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    });

    proc.on('close', (code) => {
      const fullLog = stdoutData + '\n' + stderrData;
      const logPath = path.join(outputDir, `${baseName}.log`);

      let logContent = fullLog;
      if (fs.existsSync(logPath)) {
        try {
          logContent = fs.readFileSync(logPath, 'utf-8') + '\n' + fullLog;
        } catch {
          // ignore
        }
      }

      const { errors, warnings } = parseLatexLog(logContent, path.basename(mainFilePath));
      const pdfExists = fs.existsSync(expectedPdfPath);

      let pdfBufferBase64: string | undefined = undefined;
      if (pdfExists) {
        try {
          const pdfBuffer = fs.readFileSync(expectedPdfPath);
          pdfBufferBase64 = pdfBuffer.toString('base64');
        } catch (readErr) {
          console.error('Error reading PDF:', readErr);
        }
      }

      const durationMs = Date.now() - startTime;

      resolve({
        success: pdfExists && errors.length === 0,
        pdfPath: pdfExists ? expectedPdfPath : undefined,
        pdfBufferBase64,
        log: logContent,
        errors,
        warnings,
        durationMs,
        timestamp: new Date().toISOString(),
      });
    });
  });
}
