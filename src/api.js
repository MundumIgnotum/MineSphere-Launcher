'use strict';

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { URL } = require('url');
const {
  PUBLIC,
  DATA,
  GAME,
  ROOT,
} = require('./paths');
const {
  getSettings,
  saveSettings,
  getAccounts,
  getActiveAccount,
  getActiveAccountRaw,
  getAccount,
  setActiveAccount,
  removeAccount,
  exportConfig,
  importConfig,
  getInstallations,
  getInstallation,
  createInstallation,
  updateInstallation,
} = require('./store');
const auth = require('./auth');
const skins = require('./skins');
const java = require('./java');
const mojang = require('./mojang');
const loaders = require('./loaders');
const instances = require('./instances');
const mods = require('./mods');
const modpacks = require('./modpacks');
const backups = require('./backups');
const launch = require('./launch');
const modrinth = require('./modrinth');
const curseforge = require('./curseforge');
const github = require('./github');
const { jobManager } = require('./jobs');
const {
  ensureDir,
  writeJson,
  readJson,
  fileExists,
  safeJoin,
  randomId,
  formatBytes,
} = require('./util');
const { getZipEntry } = require('./zip');
const { createDirs, LOADER_META } = instances;

const VERSION = '1.0.0';
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function sendJson(res, status, data) {
  if (res.headersSent) return;
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(data));
}

function sendText(res, status, text, type = 'text/plain; charset=utf-8') {
  if (res.headersSent) return;
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(text);
}

function sendBuffer(res, status, buffer, headers = {}) {
  if (res.headersSent) return;
  res.writeHead(status, {
    'Content-Length': buffer.length,
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(buffer);
}

function sendError(res, error, status = 400) {
  const message = error instanceof Error ? error.message : String(error || 'Erro desconhecido.');
  if (res.headersSent) {
    try {
      res.end();
    } catch {
      /* ignore */
    }
    return;
  }
  sendJson(res, error.statusCode || status, { error: message });
}

function readBody(req, limit = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        const error = new Error('O ficheiro é demasiado grande.');
        error.statusCode = 413;
        reject(error);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function jsonBody(req, limit) {
  const buffer = await readBody(req, limit);
  if (!buffer.length) return {};
  try {
    return JSON.parse(buffer.toString('utf8'));
  } catch {
    const error = new Error('JSON inválido.');
    error.statusCode = 400;
    throw error;
  }
}

function publicState() {
  return {
    version: VERSION,
    settings: getSettings(),
    accounts: getAccounts(),
    activeAccount: getActiveAccount(),
    installations: instances.listInstances(),
    running: launch.listRunning(),
    jobs: jobManager.list(true),
  };
}

function appState() {
  return publicState();
}

function contentDisposition(filename) {
  const safe = String(filename || 'download').replace(/["\r\n]/g, '_');
  return `attachment; filename="${safe.replace(/[^\x20-\x7e]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}

function serveStatic(req, res, pathname) {
  let relative = decodeURIComponent(pathname);
  if (relative === '/') relative = '/index.html';
  if (relative === '/favicon.ico') relative = '/assets/icon.svg';
  let file;
  try {
    file = safeJoin(PUBLIC, relative.replace(/^\/+/, ''));
  } catch {
    return sendText(res, 403, 'Acesso negado.');
  }
  if (!fileExists(file)) {
    return sendText(res, 404, 'Não encontrado.');
  }
  const ext = path.extname(file).toLowerCase();
  const data = fs.readFileSync(file);
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=60',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(data);
}

function instanceOrThrow(id) {
  const record = getInstallation(id);
  if (!record) throw new Error('Instalação não encontrada.');
  return record;
}

function accountOrThrow(id) {
  const account = getAccount(id);
  if (!account) throw new Error('Conta não encontrada.');
  return account;
}

function syncFolderFile() {
  const settings = getSettings();
  if (!settings.syncFolder) throw new Error('Define uma pasta de sincronização nas definições.');
  ensureDir(settings.syncFolder);
  return path.join(settings.syncFolder, 'minesphere-config.json');
}

async function searchSource({ source, query, instance, projectType, limit, offset, sort }) {
  const instanceRecord = instance ? instanceOrThrow(instance) : null;
  const useLoader = projectType === 'mod' || projectType === 'modpack';
  if (source === 'curseforge') {
    return curseforge.search({
      query,
      projectType,
      gameVersion: instanceRecord?.version,
      loader: useLoader ? instanceRecord?.loader?.type : undefined,
      limit,
      offset,
      sort,
    });
  }
  return modrinth.searchProjects({
    query,
    projectType,
    gameVersion: instanceRecord?.version,
    loader: useLoader && instanceRecord ? modrinth.loaderForInstance(instanceRecord.loader?.type) : undefined,
    limit,
    offset,
    sort,
  });
}

async function handleApi(req, res, url) {
  const pathname = url.pathname;
  const method = req.method || 'GET';

  if (pathname === '/api/health' && method === 'GET') {
    return sendJson(res, 200, { ok: true, version: VERSION, time: new Date().toISOString() });
  }

  if (pathname === '/api/state' && method === 'GET') {
    return sendJson(res, 200, appState());
  }

  if (pathname === '/api/settings' && method === 'GET') {
    return sendJson(res, 200, { settings: getSettings() });
  }

  if (pathname === '/api/settings' && (method === 'PUT' || method === 'PATCH')) {
    const body = await jsonBody(req);
    const allowed = [
      'theme',
      'accentColor',
      'accentColor2',
      'streamerMode',
      'ramMb',
      'minRamMb',
      'jvmArgs',
      'javaPath',
      'autoDownloadJava',
      'parallelDownloads',
      'autoBackup',
      'backupLimit',
      'autoUpdateMods',
      'curseforgeKey',
      'microsoftClientId',
      'syncFolder',
      'lastInstanceId',
      'closeOnLaunch',
      'showSnapshots',
      'offlineSkinPrompt',
      'resolutionWidth',
      'resolutionHeight',
    ];
    const patch = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(body, key)) patch[key] = body[key];
    }
    return sendJson(res, 200, { settings: saveSettings(patch) });
  }

  if (pathname === '/api/accounts' && method === 'GET') {
    return sendJson(res, 200, { accounts: getAccounts(), activeAccount: getActiveAccount() });
  }

  if (pathname === '/api/accounts/offline' && method === 'POST') {
    const body = await jsonBody(req);
    return sendJson(res, 201, { account: auth.createOfflineAccount(body.name), state: appState() });
  }

  if (pathname === '/api/auth/microsoft/start' && method === 'POST') {
    return sendJson(res, 201, { login: await auth.startMicrosoftLogin() });
  }

  if (pathname === '/api/auth/microsoft/status' && method === 'GET') {
    const id = url.searchParams.get('id');
    const login = auth.getLoginStatus(id);
    if (!login) {
      const error = new Error('Início de sessão não encontrado ou expirado.');
      error.statusCode = 404;
      throw error;
    }
    return sendJson(res, 200, { login });
  }

  if (pathname === '/api/auth/microsoft/cancel' && method === 'POST') {
    const body = await jsonBody(req);
    return sendJson(res, 200, { ok: auth.cancelLogin(body.id) });
  }

  let match = pathname.match(/^\/api\/accounts\/([^/]+)\/(activate|refresh)$/);
  if (match && method === 'POST') {
    const id = decodeURIComponent(match[1]);
    if (match[2] === 'activate') {
      return sendJson(res, 200, { account: setActiveAccount(id), state: appState() });
    }
    await auth.refreshAccount(id);
    return sendJson(res, 200, { account: getActiveAccount(), state: appState() });
  }

  match = pathname.match(/^\/api\/accounts\/([^/]+)\/skin\/file$/);
  if (match && method === 'GET') {
    const id = decodeURIComponent(match[1]);
    const buffer = skins.readLocal(id);
    if (!buffer) throw new Error('Esta conta não tem uma skin local.');
    return sendBuffer(res, 200, buffer, {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
    });
  }

  match = pathname.match(/^\/api\/accounts\/([^/]+)\/skin(?:\/(official))?$/);
  if (match && method === 'POST') {
    const id = decodeURIComponent(match[1]);
    const buffer = await readBody(req, 2 * 1024 * 1024);
    const account = match[2] === 'official'
      ? await skins.uploadOfficial(id, buffer, { variant: url.searchParams.get('variant') })
      : skins.saveLocal(id, buffer, { sync: url.searchParams.get('sync') === '1' });
    return sendJson(res, 200, { account, state: appState() });
  }

  if (match && method === 'DELETE') {
    const account = skins.removeLocal(decodeURIComponent(match[1]));
    return sendJson(res, 200, { account, state: appState() });
  }

  match = pathname.match(/^\/api\/accounts\/([^/]+)$/);
  if (match && method === 'DELETE') {
    const id = decodeURIComponent(match[1]);
    const account = getAccount(id);
    skins.removeLocalFile(id);
    if (account && account.type === 'offline') skins.removeCustomSkinLoader(account);
    removeAccount(id);
    return sendJson(res, 200, { ok: true, state: appState() });
  }

  if (pathname === '/api/java/detect' && method === 'GET') {
    const detected = await java.detectJava(url.searchParams.get('refresh') === '1');
    return sendJson(res, 200, {
      detected: detected.map((info) => ({ path: info.path, major: info.major, version: info.version, is64Bit: info.is64Bit })),
      runtime: java.getJavaStatus().runtime,
    });
  }

  if (pathname === '/api/java/download' && method === 'POST') {
    const body = await jsonBody(req);
    const major = Number(body.major);
    if (![8, 11, 16, 17, 21, 25].includes(major)) throw new Error('Versão de Java inválida.');
    const job = jobManager.run('java', `Descarregar Java ${major}`, async (job) => {
      const info = await java.downloadJava(major, job);
      return { major: info.major, path: info.path };
    });
    return sendJson(res, 202, { jobId: job.id });
  }

  if (pathname === '/api/versions' && method === 'GET') {
    const type = url.searchParams.get('type') || 'all';
    const search = url.searchParams.get('search') || '';
    const limit = Math.max(1, Math.min(1000, Number(url.searchParams.get('limit')) || 100));
    const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
    const versions = await mojang.listVersions({ type, search });
    return sendJson(res, 200, {
      total: versions.length,
      offset,
      limit,
      versions: versions.slice(offset, offset + limit),
    });
  }

  match = pathname.match(/^\/api\/versions\/([^/]+)$/);
  if (match && method === 'GET') {
    return sendJson(res, 200, { version: await mojang.getVersionDetails(decodeURIComponent(match[1])) });
  }

  if (pathname === '/api/loaders' && method === 'GET') {
    const version = url.searchParams.get('version');
    const type = url.searchParams.get('type') || 'vanilla';
    if (!version) throw new Error('Versão do Minecraft em falta.');
    const list = await loaders.listLoaderVersions(version, type);
    return sendJson(res, 200, { loaders: list });
  }

  if (pathname === '/api/instances' && method === 'GET') {
    return sendJson(res, 200, { installations: instances.listInstances() });
  }

  if (pathname === '/api/instances' && method === 'POST') {
    const body = await jsonBody(req);
    const result = await instances.createInstance(body);
    return sendJson(res, 202, { ...result, state: appState() });
  }

  match = pathname.match(/^\/api\/instances\/([^/]+)(?:\/(.*))?$/);
  if (match) {
    const id = decodeURIComponent(match[1]);
    const rest = match[2] || '';
    if (!rest && method === 'GET') {
      return sendJson(res, 200, await instances.getDetail(id));
    }
    if (!rest && method === 'PATCH') {
      const body = await jsonBody(req);
      return sendJson(res, 200, { instance: instances.updateInstance(id, body), state: appState() });
    }
    if (!rest && method === 'DELETE') {
      const deleteFiles = url.searchParams.get('files') === '1';
      instances.deleteInstance(id, deleteFiles);
      return sendJson(res, 200, { ok: true, state: appState() });
    }
    if (rest === 'launch' && method === 'POST') {
      const body = await jsonBody(req);
      const result = instances.launchInstance(id, body.accountId || null);
      return sendJson(res, 202, result);
    }
    if (rest === 'stop' && method === 'POST') {
      return sendJson(res, 200, { ok: instances.stopInstance(id) });
    }
    if (rest === 'repair' && method === 'POST') {
      return sendJson(res, 202, instances.repairInstance(id));
    }
    if (rest === 'logs' && method === 'GET') {
      const limit = Math.max(10, Math.min(1000, Number(url.searchParams.get('limit')) || 250));
      return sendJson(res, 200, { lines: instances.getLogs(id, limit) });
    }
    if (rest === 'open-folder' && method === 'POST') {
      return sendJson(res, 200, { ok: instances.openFolder(id) });
    }
    if (rest === 'stats' && method === 'GET') {
      return sendJson(res, 200, { stats: await instances.getStats(id) });
    }
    if (rest === 'screenshots' && method === 'GET') {
      const record = instanceOrThrow(id);
      return sendJson(res, 200, { screenshots: backups.listScreenshots(record) });
    }
    if (rest.startsWith('screenshots/') && (method === 'GET' || method === 'DELETE')) {
      const fileName = decodeURIComponent(rest.slice('screenshots/'.length));
      const record = instanceOrThrow(id);
      if (method === 'DELETE') {
        backups.deleteScreenshot(record, fileName);
        return sendJson(res, 200, { ok: true });
      }
      const safe = path.basename(fileName);
      if (!/\.(png|jpe?g|webp)$/i.test(safe)) throw new Error('Ficheiro inválido.');
      const file = path.join(record.gameDir, 'screenshots', safe);
      if (!fileExists(file)) throw new Error('Captura não encontrada.');
      const data = await fsp.readFile(file);
      return sendBuffer(res, 200, data, { 'Content-Type': safe.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg', 'Cache-Control': 'no-store' });
    }
    if (rest === 'backups' && method === 'GET') {
      const record = instanceOrThrow(id);
      return sendJson(res, 200, { backups: backups.listBackups(record) });
    }
    if (rest === 'backups' && method === 'POST') {
      const record = instanceOrThrow(id);
      const job = jobManager.run('backup', `Backup de ${record.name}`, async (job) => {
        const result = await backups.createBackup(record, job);
        await backups.pruneBackups(record, getSettings().backupLimit);
        return result;
      });
      return sendJson(res, 202, { jobId: job.id });
    }
    if (rest.startsWith('backups/') && rest.endsWith('/restore') && method === 'POST') {
      const record = instanceOrThrow(id);
      const fileName = decodeURIComponent(rest.slice('backups/'.length, -'/restore'.length));
      const job = jobManager.run('restore', `Restaurar ${record.name}`, async (job) => backups.restoreBackup(record, fileName, job));
      return sendJson(res, 202, { jobId: job.id });
    }
    if (rest.startsWith('backups/') && method === 'DELETE') {
      const record = instanceOrThrow(id);
      const fileName = decodeURIComponent(rest.slice('backups/'.length));
      backups.deleteBackup(record, fileName);
      return sendJson(res, 200, { ok: true });
    }
    if (rest === 'worlds' && method === 'GET') {
      const record = instanceOrThrow(id);
      return sendJson(res, 200, { worlds: mods.listWorlds(record) });
    }
    if (rest === 'mods' && method === 'GET') {
      const record = instanceOrThrow(id);
      const world = url.searchParams.get('world') || null;
      return sendJson(res, 200, { mods: mods.listInstalled(record, { world }) });
    }
    if (rest === 'mods/toggle' && method === 'POST') {
      const record = instanceOrThrow(id);
      const body = await jsonBody(req);
      return sendJson(res, 200, { mod: mods.toggle(record, body.key), mods: mods.listInstalled(record, { world: body.world || null }) });
    }
    if (rest === 'mods/remove' && method === 'POST') {
      const record = instanceOrThrow(id);
      const body = await jsonBody(req);
      mods.remove(record, body.key);
      return sendJson(res, 200, { ok: true, mods: mods.listInstalled(record, { world: body.world || null }) });
    }
    if (rest === 'mods/install' && method === 'POST') {
      const record = instanceOrThrow(id);
      const body = await jsonBody(req);
      const source = body.source || 'modrinth';
      const job = jobManager.run('install-content', `Instalar em ${record.name}`, async (job) => {
        if (source === 'curseforge') {
          return mods.installCurseForge({
            instance: record,
            modId: body.projectId,
            fileId: body.versionId,
            projectType: body.projectType || 'mod',
            world: body.world || null,
            job,
          });
        }
        return mods.installModrinth({
          instance: record,
          projectId: body.projectId,
          versionId: body.versionId || null,
          world: body.world || null,
          job,
        });
      });
      return sendJson(res, 202, { jobId: job.id });
    }
    if (rest === 'mods/install-github' && method === 'POST') {
      const record = instanceOrThrow(id);
      const body = await jsonBody(req);
      const job = jobManager.run('install-github', `Instalar em ${record.name}`, async (job) => {
        const data = await github.getReleases(body.repo);
        const release = data.releases.find((item) => String(item.tag) === String(body.tag)) || data.releases[0];
        if (!release) throw new Error('Release não encontrada.');
        const asset = release.assets.find((item) => String(item.id) === String(body.assetId));
        if (!asset) throw new Error('Asset não encontrado.');
        return mods.installGithub({
          instance: record,
          repo: data.repo,
          release,
          asset,
          projectType: body.projectType || 'mod',
          world: body.world || null,
          job,
        });
      });
      return sendJson(res, 202, { jobId: job.id });
    }
    if (rest === 'mods/check-updates' && method === 'POST') {
      const record = instanceOrThrow(id);
      return sendJson(res, 200, { updates: await mods.checkUpdates(record) });
    }
    if (rest === 'mods/update' && method === 'POST') {
      const record = instanceOrThrow(id);
      const body = await jsonBody(req);
      const job = jobManager.run('update-mods', `Atualizar mods de ${record.name}`, async (job) => {
        if (body.key) return mods.applyUpdate(record, body.key, job);
        return mods.updateAll(record, job);
      });
      return sendJson(res, 202, { jobId: job.id });
    }
    if (rest === 'modpack/update' && method === 'POST') {
      const record = instanceOrThrow(id);
      const job = jobManager.run('update-modpack', `Atualizar ${record.name}`, async (job) => modpacks.updateModpack(record, job));
      return sendJson(res, 202, { jobId: job.id });
    }
    throw new Error('Rota da instalação não encontrada.');
  }

  if (pathname === '/api/jobs' && method === 'GET') {
    return sendJson(res, 200, { jobs: jobManager.list(url.searchParams.get('active') === '1') });
  }

  match = pathname.match(/^\/api\/jobs\/([^/]+)$/);
  if (match && method === 'GET') {
    const job = jobManager.get(decodeURIComponent(match[1]));
    if (!job) throw new Error('Tarefa não encontrada.');
    return sendJson(res, 200, { job: job.toJSON() });
  }

  if (pathname === '/api/mods/search' && method === 'GET') {
    const source = url.searchParams.get('source') || 'modrinth';
    const result = await searchSource({
      source,
      query: url.searchParams.get('query') || '',
      instance: url.searchParams.get('instanceId') || null,
      projectType: url.searchParams.get('projectType') || 'mod',
      limit: url.searchParams.get('limit') || 20,
      offset: url.searchParams.get('offset') || 0,
      sort: url.searchParams.get('sort') || 'relevance',
    });
    return sendJson(res, 200, result);
  }

  if (pathname === '/api/mods/project' && method === 'GET') {
    const source = url.searchParams.get('source') || 'modrinth';
    const id = url.searchParams.get('id');
    if (!id) throw new Error('Projeto em falta.');
    const instance = url.searchParams.get('instanceId') ? instanceOrThrow(url.searchParams.get('instanceId')) : null;
    if (source === 'curseforge') {
      const project = await curseforge.getMod(id);
      const files = await curseforge.getFiles(id, {
        gameVersion: instance?.version,
        loader: instance?.loader?.type,
      });
      return sendJson(res, 200, {
        project,
        versions: files.map((file) => ({
          id: file.id,
          name: file.displayName,
          versionNumber: file.displayName,
          versionType: file.releaseType === 1 ? 'release' : 'beta',
          gameVersions: file.gameVersions || [],
          datePublished: file.fileDate,
          downloads: file.downloadCount || 0,
          file: {
            filename: file.fileName,
            url: file.downloadUrl,
            size: file.fileLength,
            hashes: file.hashes,
          },
        })),
      });
    }
    const project = await modrinth.getProject(id);
    const loader = instance && (project.project_type === 'mod' || project.project_type === 'modpack')
      ? modrinth.loaderForInstance(instance.loader?.type)
      : undefined;
    const versions = await modrinth.getVersions(id, {
      gameVersion: instance?.version,
      loader,
    });
    return sendJson(res, 200, {
      project,
      versions: versions.map(modrinth.versionSummary),
    });
  }

  if (pathname === '/api/github/search' && method === 'GET') {
    return sendJson(res, 200, await github.searchRepos(url.searchParams.get('query') || ''));
  }

  if (pathname === '/api/github/releases' && method === 'GET') {
    const repo = url.searchParams.get('repo');
    if (!repo) throw new Error('Repositório em falta.');
    return sendJson(res, 200, await github.getReleases(repo));
  }

  if (pathname === '/api/modpacks/search' && method === 'GET') {
    const instance = url.searchParams.get('instanceId') ? instanceOrThrow(url.searchParams.get('instanceId')) : null;
    const result = await modrinth.searchProjects({
      query: url.searchParams.get('query') || '',
      projectType: 'modpack',
      gameVersion: instance?.version,
      loader: instance ? modrinth.loaderForInstance(instance.loader?.type) : undefined,
      limit: url.searchParams.get('limit') || 20,
      offset: url.searchParams.get('offset') || 0,
      sort: url.searchParams.get('sort') || 'downloads',
    });
    return sendJson(res, 200, result);
  }

  if (pathname === '/api/modpacks/versions' && method === 'GET') {
    const projectId = url.searchParams.get('projectId');
    if (!projectId) throw new Error('Modpack em falta.');
    const versions = await modrinth.getVersions(projectId);
    return sendJson(res, 200, { versions: versions.map(modrinth.versionSummary) });
  }

  if (pathname === '/api/modpacks/install' && method === 'POST') {
    const body = await jsonBody(req);
    if (!body.projectId) throw new Error('Modpack em falta.');
    const resolved = await modpacks.resolveModpack(body.projectId, body.versionId || null);
    const record = modpacks.createInstanceForPack(resolved, { name: body.name || resolved.name });
    const job = jobManager.run('install-modpack', `Instalar ${record.name}`, async (job) =>
      modpacks.installMrpackIntoInstance(record, resolved, job),
    );
    return sendJson(res, 202, { instance: getInstallation(record.id), jobId: job.id, state: appState() });
  }

  if (pathname === '/api/modpacks/import' && method === 'POST') {
    const buffer = await readBody(req, 600 * 1024 * 1024);
    if (!buffer.length) throw new Error('Ficheiro vazio.');
    const name = url.searchParams.get('name') || null;
    let kind = 'generic';
    let resolved = null;
    const mrpackEntry = getZipEntry(buffer, 'modrinth.index.json');
    const manifestEntry = getZipEntry(buffer, 'manifest.json');
    if (mrpackEntry) {
      kind = 'mrpack';
      const parsed = modpacks.parseMrpack(buffer);
      resolved = {
        source: 'modrinth',
        projectId: null,
        versionId: null,
        versionNumber: parsed.index.versionId || null,
        name: name || parsed.index.name || 'Modpack importado',
        iconUrl: null,
        buffer,
        index: parsed.index,
        mcVersion: parsed.mcVersion,
        loader: parsed.loader,
      };
    } else if (manifestEntry) {
      kind = 'curseforge';
      resolved = await modpacks.importCurseForgeZip(buffer);
      if (name) resolved.name = name;
    } else {
      let meta = null;
      try {
        const packMeta = getZipEntry(buffer, 'minesphere-pack.json');
        if (packMeta) meta = JSON.parse(packMeta.data.toString('utf8'));
      } catch {
        /* ignore */
      }
      const version = url.searchParams.get('version') || meta?.minecraft;
      const loaderType = url.searchParams.get('loaderType') || meta?.loader?.type || 'vanilla';
      const loaderVersion = url.searchParams.get('loaderVersion') || meta?.loader?.version || null;
      if (!version) throw new Error('Para ZIP genérico, indica a versão do Minecraft.');
      if (!LOADER_META[loaderType] || loaderType === 'liteloader') throw new Error('Loader inválido para importação.');
      const entry = await mojang.getVersionEntry(version);
      if (!entry) throw new Error('Versão do Minecraft inválida.');
      const id = randomId(6);
      const record = createInstallation({
        id,
        name: name || path.basename(url.searchParams.get('filename') || 'Modpack importado').replace(/\.zip$/i, ''),
        icon: '📦',
        color: LOADER_META[loaderType].color,
        version,
        versionType: entry.type,
        loader: { type: loaderType, version: loaderVersion },
        versionId: version,
        status: 'installing',
        gameDir: path.join(ROOT, 'instances', id),
      });
      createDirs(record);
      const job = jobManager.run('import-zip', `Importar ${record.name}`, async (job) =>
        modpacks.installGenericZipIntoInstance(record, buffer, job),
      );
      return sendJson(res, 202, { kind, instance: getInstallation(id), jobId: job.id, state: appState() });
    }
    const record = modpacks.createInstanceForPack(resolved, { name: resolved.name });
    const job = jobManager.run('import-modpack', `Importar ${record.name}`, async (job) => {
      if (kind === 'curseforge') return modpacks.installCurseForgeZipIntoInstance(record, resolved, job);
      return modpacks.installMrpackIntoInstance(record, resolved, job);
    });
    return sendJson(res, 202, { kind, instance: getInstallation(record.id), jobId: job.id, state: appState() });
  }

  if (pathname === '/api/modpacks/export' && method === 'GET') {
    const instanceId = url.searchParams.get('instanceId');
    if (!instanceId) throw new Error('Instalação em falta.');
    const record = instanceOrThrow(instanceId);
    const format = url.searchParams.get('format') === 'zip' ? 'zip' : 'mrpack';
    const output = format === 'zip' ? await modpacks.exportFullZip(record) : await modpacks.exportMrpack(record);
    return sendBuffer(res, 200, output.buffer, {
      'Content-Type': 'application/zip',
      'Content-Disposition': contentDisposition(output.fileName),
      'Cache-Control': 'no-store',
    });
  }

  if (pathname === '/api/modpacks/installed' && method === 'GET') {
    return sendJson(res, 200, {
      modpacks: instances
        .listInstances()
        .filter((item) => item.modpack)
        .map((item) => ({ instance: item, modpack: item.modpack })),
    });
  }

  if (pathname === '/api/resources/search' && method === 'GET') {
    const type = url.searchParams.get('type') || 'resourcepack';
    if (!['resourcepack', 'shader', 'datapack'].includes(type)) throw new Error('Tipo de recurso inválido.');
    const result = await searchSource({
      source: url.searchParams.get('source') || 'modrinth',
      query: url.searchParams.get('query') || '',
      instance: url.searchParams.get('instanceId') || null,
      projectType: type,
      limit: url.searchParams.get('limit') || 20,
      offset: url.searchParams.get('offset') || 0,
      sort: url.searchParams.get('sort') || 'relevance',
    });
    return sendJson(res, 200, result);
  }

  if (pathname === '/api/config/export' && method === 'GET') {
    const data = JSON.stringify(exportConfig(), null, 2);
    return sendBuffer(res, 200, Buffer.from(data), {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': contentDisposition('minesphere-config.json'),
    });
  }

  if (pathname === '/api/config/import' && method === 'POST') {
    const body = await jsonBody(req, 10 * 1024 * 1024);
    importConfig(body);
    return sendJson(res, 200, { ok: true, state: appState() });
  }

  if (pathname === '/api/config/sync' && method === 'POST') {
    const body = await jsonBody(req);
    const file = syncFolderFile();
    if (body.direction === 'pull') {
      if (!fileExists(file)) throw new Error('Ainda não existe configuração sincronizada nessa pasta.');
      const data = readJson(file);
      importConfig(data);
      return sendJson(res, 200, { ok: true, state: appState() });
    }
    writeJson(file, exportConfig());
    return sendJson(res, 200, { ok: true, path: file, exportedAt: new Date().toISOString() });
  }

  if (pathname === '/api/system' && method === 'GET') {
    return sendJson(res, 200, {
      version: VERSION,
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      root: ROOT,
      data: DATA,
      game: GAME,
      java: java.getJavaStatus(),
      memory: {
        total: formatBytes(require('os').totalmem()),
        free: formatBytes(require('os').freemem()),
      },
    });
  }

  throw Object.assign(new Error('Rota API não encontrada.'), { statusCode: 404 });
}

async function handle(req, res) {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self' data:",
  );
  if (url.pathname.startsWith('/api/')) {
    try {
      await handleApi(req, res, url);
    } catch (error) {
      console.error(`[api] ${req.method} ${url.pathname}:`, error.message);
      sendError(res, error);
    }
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return sendText(res, 405, 'Método não permitido.');
  serveStatic(req, res, url.pathname);
}

function createApp() {
  return (req, res) => {
    handle(req, res).catch((error) => {
      console.error('[server]', error);
      sendError(res, error, 500);
    });
  };
}

module.exports = { createApp, handle, VERSION };
