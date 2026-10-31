'use strict';

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { spawn } = require('child_process');
const {
  ensureDir,
  randomId,
  fileExists,
  directorySize,
} = require('./util');
const { instanceDir } = require('./paths');
const {
  getInstallation,
  getInstallations,
  createInstallation,
  updateInstallation,
  deleteInstallation,
  normalizeAutoJoin,
  setLastInstance,
  getSettings,
  getAccount,
  getActiveAccountRaw,
} = require('./store');
const { getVersionEntry, ensureVersionInstalled } = require('./mojang');
const { installLoader, loaderLabel } = require('./loaders');
const { ensureFreshAccount } = require('./auth');
const { jobManager } = require('./jobs');
const launch = require('./launch');
const mods = require('./mods');
const backups = require('./backups');
const modpacks = require('./modpacks');

const LOADER_META = {
  vanilla: { icon: '🌍', color: '#38d39f' },
  fabric: { icon: '🧵', color: '#f0c674' },
  quilt: { icon: '🧶', color: '#c792ea' },
  forge: { icon: '🔨', color: '#f97316' },
  neoforge: { icon: '🔥', color: '#ef4444' },
  liteloader: { icon: '🧪', color: '#60a5fa' },
};

function cleanAutoJoin(value) {
  const autoJoin = normalizeAutoJoin(value);
  if (autoJoin.type === 'server') {
    if (!autoJoin.server) throw new Error('Indica o endereço do servidor.');
    if (/\s/.test(autoJoin.server)) throw new Error('O endereço do servidor não pode conter espaços.');
  }
  if (autoJoin.type === 'world') {
    if (!autoJoin.world) throw new Error('Indica o nome do mundo.');
    if (/[\\/:*?"<>|\x00-\x1f]/.test(autoJoin.world) || autoJoin.world === '.' || autoJoin.world === '..') {
      throw new Error('Nome de mundo inválido.');
    }
  }
  return autoJoin;
}

function createDirs(record) {
  const dir = record.gameDir || instanceDir(record.id);
  ensureDir(dir);
  for (const sub of ['mods', 'config', 'resourcepacks', 'shaderpacks', 'saves', 'screenshots', 'logs']) {
    ensureDir(path.join(dir, sub));
  }
  return dir;
}

function publicInstance(record) {
  const running = launch.getRunning(record.id);
  return {
    ...record,
    modsCount: mods.countMods(record),
    running: Boolean(running),
    runningInfo: running,
    loaderLabel: loaderLabel(record.loader?.type || 'vanilla'),
  };
}

function listInstances() {
  return getInstallations()
    .map((record) => getInstallation(record.id))
    .filter(Boolean)
    .map(publicInstance)
    .sort((a, b) => {
      const aTime = Date.parse(a.lastPlayed || a.createdAt) || 0;
      const bTime = Date.parse(b.lastPlayed || b.createdAt) || 0;
      return bTime - aTime;
    });
}

async function createInstance(payload) {
  const version = String(payload.version || '').trim();
  if (!version) throw new Error('Seleciona uma versão do Minecraft.');
  const entry = await getVersionEntry(version);
  if (!entry) throw new Error(`A versão "${version}" não existe no manifesto da Mojang.`);
  const loaderType = String(payload.loaderType || 'vanilla');
  if (!LOADER_META[loaderType]) throw new Error('Mod loader inválido.');
  if (loaderType === 'liteloader') {
    throw new Error('LiteLoader não é suportado automaticamente nesta versão. Escolhe Vanilla, Fabric, Quilt, Forge ou NeoForge.');
  }
  const autoJoin = cleanAutoJoin(payload.autoJoin);
  const id = randomId(6);
  const gameDir = instanceDir(id);
  ensureDir(gameDir);
  const meta = LOADER_META[loaderType];
  const name = String(payload.name || `${version} ${loaderLabel(loaderType)}`).trim().slice(0, 48) || `Instalação ${version}`;
  const record = createInstallation({
    id,
    name,
    icon: payload.icon || meta.icon,
    color: /^#[0-9a-f]{6}$/i.test(payload.color || '') ? payload.color : meta.color,
    iconUrl: payload.iconUrl || null,
    version,
    versionType: entry.type,
    loader: { type: loaderType, version: payload.loaderVersion || null },
    versionId: version,
    status: 'installing',
    gameDir,
    ramMb: payload.ramMb ? Number(payload.ramMb) : null,
    minRamMb: payload.minRamMb ? Number(payload.minRamMb) : null,
    jvmArgs: payload.jvmArgs || '',
    javaPath: payload.javaPath || 'auto',
    autoJoin,
  });
  createDirs(record);

  const job = jobManager.run('install', `Instalar ${record.name}`, async (job) => {
    try {
      await ensureVersionInstalled(version, job);
      const result = await installLoader(record, job, { version: payload.loaderVersion || null });
      const updated = updateInstallation(record.id, {
        status: 'ready',
        versionId: result.versionId,
        loader: { type: loaderType, version: result.loaderVersion || payload.loaderVersion || null },
        error: null,
      });
      createDirs(updated);
      return { instanceId: record.id, versionId: result.versionId };
    } catch (error) {
      updateInstallation(record.id, { status: 'error', error: error.message });
      throw error;
    }
  });
  return { instance: getInstallation(id), jobId: job.id };
}

function updateInstance(id, patch) {
  const record = getInstallation(id);
  if (!record) throw new Error('Instalação não encontrada.');
  const clean = {};
  if (patch.name !== undefined) clean.name = String(patch.name).trim().slice(0, 48) || record.name;
  if (patch.icon !== undefined) clean.icon = String(patch.icon).slice(0, 8) || record.icon;
  if (patch.iconUrl !== undefined) clean.iconUrl = patch.iconUrl ? String(patch.iconUrl) : null;
  if (patch.color !== undefined && /^#[0-9a-f]{6}$/i.test(patch.color)) clean.color = patch.color;
  if (patch.ramMb !== undefined) clean.ramMb = patch.ramMb ? Math.max(512, Math.min(65536, Number(patch.ramMb))) : null;
  if (patch.minRamMb !== undefined) clean.minRamMb = patch.minRamMb ? Math.max(256, Number(patch.minRamMb)) : null;
  if (patch.jvmArgs !== undefined) clean.jvmArgs = String(patch.jvmArgs || '').slice(0, 4000);
  if (patch.javaPath !== undefined) clean.javaPath = String(patch.javaPath || 'auto').slice(0, 500);
  if (patch.notes !== undefined) clean.notes = String(patch.notes || '').slice(0, 2000);
  if (patch.resolutionWidth !== undefined) clean.resolutionWidth = Math.max(0, Math.min(7680, Number(patch.resolutionWidth) || 0));
  if (patch.resolutionHeight !== undefined) clean.resolutionHeight = Math.max(0, Math.min(4320, Number(patch.resolutionHeight) || 0));
  if (patch.autoJoin !== undefined) clean.autoJoin = cleanAutoJoin(patch.autoJoin);
  return publicInstance(updateInstallation(id, clean));
}

function deleteInstance(id, deleteFiles = false) {
  const record = getInstallation(id);
  if (!record) throw new Error('Instalação não encontrada.');
  if (launch.getRunning(id)) throw new Error('Fecha o Minecraft antes de apagar esta instalação.');
  deleteInstallation(id);
  if (deleteFiles) {
    try {
      fs.rmSync(record.gameDir || instanceDir(id), { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
  return true;
}

function repairInstance(id) {
  const record = getInstallation(id);
  if (!record) throw new Error('Instalação não encontrada.');
  const job = jobManager.run('repair', `Reparar ${record.name}`, async (job) => {
    job.setStage('Verificação', 'A verificar ficheiros base...');
    await ensureVersionInstalled(record.version, job);
    if (record.loader?.type && record.loader.type !== 'vanilla') {
      job.setStage('Loader', `A reinstalar ${loaderLabel(record.loader.type)}...`);
      const result = await installLoader(record, job, { version: record.loader.version });
      updateInstallation(id, {
        versionId: result.versionId,
        loader: { type: record.loader.type, version: result.loaderVersion || record.loader.version },
      });
    }
    createDirs(record);
    updateInstallation(id, { status: 'ready', error: null });
    return { instanceId: id, repaired: true };
  });
  return { jobId: job.id };
}

function launchInstance(id, accountId = null) {
  const record = getInstallation(id);
  if (!record) throw new Error('Instalação não encontrada.');
  if (record.status !== 'ready') throw new Error('Esta instalação ainda não está pronta.');
  if (launch.getRunning(id)) throw new Error('Esta instância já está em execução.');
  const account = accountId ? getAccount(accountId) : getActiveAccountRaw();
  if (!account) throw new Error('Cria ou seleciona uma conta antes de jogar.');
  const settings = getSettings();

  const job = jobManager.run('launch', `Iniciar ${record.name}`, async (job) => {
    const fresh = await ensureFreshAccount(account);
    if (settings.autoBackup) {
      try {
        await backups.createBackup(record, job);
        await backups.pruneBackups(record, settings.backupLimit);
      } catch (error) {
        job.warn(`Backup automático: ${error.message}`);
      }
    }
    if (settings.autoUpdateMods) {
      try {
        await mods.updateAll(record, job);
      } catch (error) {
        job.warn(`Atualização automática de mods: ${error.message}`);
      }
    }
    const launched = await launch.launchInstance(record, fresh, job, {
      onExit: (code, state) => {
        const duration = Math.max(0, Date.now() - state.startedAt);
        const current = getInstallation(id);
        if (current) {
          updateInstallation(id, {
            totalPlayMs: (Number(current.totalPlayMs) || 0) + duration,
            lastPlayed: new Date().toISOString(),
          });
        }
      },
    });
    setLastInstance(id);
    updateInstallation(id, { lastPlayed: new Date().toISOString(), status: 'ready' });
    return { pid: launched.pid, instanceId: id, logPath: launched.logPath };
  });
  return { jobId: job.id, instanceId: id };
}

function stopInstance(id) {
  return launch.stopInstance(id);
}

async function getStats(id) {
  const record = getInstallation(id);
  if (!record) throw new Error('Instalação não encontrada.');
  const gameDir = record.gameDir || instanceDir(id);
  let size = 0;
  try {
    size = await directorySize(gameDir);
  } catch {
    /* ignore */
  }
  return {
    modsCount: mods.countMods(record),
    screenshots: backups.listScreenshots(record).length,
    backups: backups.listBackups(record).length,
    worlds: mods.listWorlds(record).length,
    size,
    totalPlayMs: Number(record.totalPlayMs) || 0,
    lastPlayed: record.lastPlayed,
    running: Boolean(launch.getRunning(id)),
    status: record.status,
  };
}

async function getDetail(id) {
  const record = getInstallation(id);
  if (!record) throw new Error('Instalação não encontrada.');
  const stats = await getStats(id);
  const pack = await modpacks.getInstalledPackInfo(record).catch(() => null);
  return {
    instance: publicInstance(record),
    stats,
    backups: backups.listBackups(record),
    screenshots: backups.listScreenshots(record),
    worlds: mods.listWorlds(record),
    pack,
    running: launch.getRunning(id),
  };
}

function getLogs(id, limit = 250) {
  const record = getInstallation(id);
  if (!record) throw new Error('Instalação não encontrada.');
  const runningLogs = launch.getRunningLogs(id, limit);
  if (runningLogs.length) return runningLogs;
  const logsDir = path.join(record.gameDir || instanceDir(id), 'logs');
  let files = [];
  try {
    files = fs
      .readdirSync(logsDir)
      .filter((name) => name.endsWith('.log'))
      .map((name) => ({ name, mtime: fs.statSync(path.join(logsDir, name)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
  } catch {
    return [];
  }
  if (!files.length) return [];
  try {
    const content = fs.readFileSync(path.join(logsDir, files[0].name), 'utf8');
    return content.split(/\r?\n/).slice(-limit);
  } catch {
    return [];
  }
}

function openFolder(id) {
  const record = getInstallation(id);
  if (!record) throw new Error('Instalação não encontrada.');
  const dir = record.gameDir || instanceDir(id);
  ensureDir(dir);
  if (process.platform === 'win32') {
    spawn('explorer.exe', [dir], { detached: true, stdio: 'ignore' }).unref();
  } else if (process.platform === 'darwin') {
    spawn('open', [dir], { detached: true, stdio: 'ignore' }).unref();
  } else {
    spawn('xdg-open', [dir], { detached: true, stdio: 'ignore' }).unref();
  }
  return true;
}

module.exports = {
  LOADER_META,
  createDirs,
  publicInstance,
  listInstances,
  createInstance,
  updateInstance,
  deleteInstance,
  repairInstance,
  launchInstance,
  stopInstance,
  getStats,
  getDetail,
  getLogs,
  openFolder,
};
