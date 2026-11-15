import { app, ipcMain } from 'electron';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const RELEASE_URL = 'https://api.github.com/repos/titooDiaz/LUMEN/releases/latest';
const VERSION_URL = 'https://raw.githubusercontent.com/titooDiaz/LUMEN/main/package.json';
const currentVersion = app.getVersion();

type ReleaseAsset = { name: string; browser_download_url: string };
type Release = { tag_name: string; assets: ReleaseAsset[]; html_url: string };

function compareVersions(a: string, b: string): number {
  const left = a.replace(/^v/, '').split('.').map(Number);
  const right = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const difference = (left[i] || 0) - (right[i] || 0);
    if (difference) return Math.sign(difference);
  }
  return 0;
}

async function getLatestRelease(): Promise<Release> {
  const response = await fetch(RELEASE_URL, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'LUMEN-Desktop-Updater' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    if (response.status === 404) throw new Error('Aún no hay una actualización publicada para LUMEN.');
    throw new Error(`GitHub respondió con el estado ${response.status}.`);
  }
  return response.json() as Promise<Release>;
}

ipcMain.handle('update:check', async () => {
  const versionResponse = await fetch(VERSION_URL, { signal: AbortSignal.timeout(15000) });
  if (!versionResponse.ok) throw new Error('No se pudo leer la versión publicada en GitHub.');
  const repositoryPackage = await versionResponse.json() as { version?: string };
  if (!repositoryPackage.version) throw new Error('El repositorio no contiene un número de versión válido.');
  const version = repositoryPackage.version;
  let canInstall = false;
  let releaseUrl = 'https://github.com/titooDiaz/LUMEN/releases';
  try {
    const release = await getLatestRelease();
    canInstall = compareVersions(release.tag_name, version) >= 0 && release.assets.some((asset) => asset.name.endsWith('.deb'));
    releaseUrl = release.html_url;
  } catch {
    // A version can be committed before its tagged installer is published.
  }
  return {
    currentVersion,
    latestVersion: version,
    updateAvailable: compareVersions(version, currentVersion) > 0,
    releaseUrl,
    canInstall,
  };
});

ipcMain.handle('update:install', async () => {
  if (process.platform !== 'linux' || !mainWindowExists()) {
    throw new Error('La instalación automática está disponible en Ubuntu, Mint y Debian.');
  }
  const release = await getLatestRelease();
  const asset = release.assets.find((item) => item.name.endsWith('.deb'));
  if (!asset) throw new Error('La versión nueva todavía no incluye un instalador .deb.');

  const response = await fetch(asset.browser_download_url, {
    headers: { 'User-Agent': 'LUMEN-Desktop-Updater' },
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok || !response.body) throw new Error('No se pudo descargar el instalador.');
  const installerPath = path.join(os.tmpdir(), `lumen-update-${release.tag_name}.deb`);
  await fs.promises.writeFile(installerPath, Buffer.from(await response.arrayBuffer()));
  try {
    // pkexec presents the system's graphical administrator prompt. No terminal is needed.
    await execFileAsync('pkexec', ['dpkg', '-i', installerPath], { timeout: 180000 });
    app.relaunch();
    app.quit();
    return true;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(detail.includes('cancel') ? 'Se canceló la actualización.' : 'No se pudo instalar. Revisa los permisos de administrador y vuelve a intentarlo.');
  } finally {
    await fs.promises.rm(installerPath, { force: true }).catch(() => undefined);
  }
});

function mainWindowExists(): boolean {
  return app.isReady();
}
