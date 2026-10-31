'use strict';

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const {
  ensureDir,
  readJson,
  writeJson,
  fileExists,
  safeJoin,
  sanitizeFilename,
  downloadFile,
  sha1File,
  randomId,
} = require('./util');
const { instanceDir } = require('./paths');
const modrinth = require('./modrinth');
const curseforge = require('./curseforge');
const github = require('./github');

const META_DIR = '.minesphere';
const META_FILE = 'mods.json';

function gameDirFor(instance) {
  return instance.gameDir || instanceDir(instance.id);
}

function metaPath(instance) {
  return path.join(gameDirFor(instance), META_DIR, META_FILE);
}

function readMeta(instance) {
  const data = readJson(metaPath(instance), null);
  if (data && data.entries && typeof data.entries === 'object') return data;
  return { version: 1, entries: {} };
}

function saveMeta(instance, meta) {
  writeJson(metaPath(instance), meta);
}

function worldDir(instance, world) {
  const safeWorld = sanitizeFilename(world, '');
  if (!safeWorld) throw new Error('Mundo inválido.');
  return path.join(gameDirFor(instance), 'saves', safeWorld);
}

function listWorlds(instance) {
  const saves = path.join(gameDirFor(instance), 'saves');
  let entries = [];
  try {
    entries = fs.readdirSync(saves, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = path.join(saves, entry.name);
      let mtime = 0;
      try {
        mtime = fs.statSync(dir).mtimeMs;
      } catch {
        /* ignore */
      }
      return { name: entry.name, mtime };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

function folderFor(projectType, world) {
  if (projectType === 'resourcepack') return { folder: 'resourcepacks', world: null };
  if (projectType === 'shader') return { folder: 'shaderpacks', world: null };
  if (projectType === 'datapack') {
    if (!world) throw new Error('Seleciona um mundo para instalar o datapack.');
    return { folder: 'datapacks', world };
  }
  return { folder: 'mods', world: null };
}

function targetDir(instance, projectType, world) {
  const info = folderFor(projectType, world);
  const dir = info.world
    ? path.join(worldDir(instance, info.world), 'datapacks')
    : path.join(gameDirFor(instance), info.folder);
  ensureDir(dir);
  return { ...info, dir };
}

function relativeKey(instance, fullPath) {
  return path.relative(gameDirFor(instance), fullPath).replace(/\\/g, '/');
}

function fileNameFromKey(key) {
  return key.split('/').pop();
}

function findEntry(meta, key) {
  return meta.entries[key] || null;
}

function removeActualFile(instance, entry) {
  const baseDir = entry.world
    ? path.join(worldDir(instance, entry.world), 'datapacks')
    : path.join(gameDirFor(instance), entry.folder || 'mods');
  const canonical = path.join(baseDir, entry.fileName);
  for (const candidate of [canonical, `${canonical}.disabled`]) {
    try {
      fs.rmSync(candidate, { force: true });
    } catch {
      /* ignore */
    }
  }
}

function uniqueFileName(dir, fileName, existingKey, entry) {
  if (entry && entry.fileName) return entry.fileName;
  let candidate = sanitizeFilename(fileName, 'ficheiro');
  const ext = path.extname(candidate);
  const stem = candidate.slice(0, candidate.length - ext.length);
  let i = 1;
  while (fileExists(path.join(dir, candidate)) || fileExists(path.join(dir, `${candidate}.disabled`))) {
    candidate = `${stem} (${i})${ext}`;
    i += 1;
    if (i > 100) break;
  }
  return candidate;
}

async function downloadToTarget({ url, dir, fileName, sha1, size, replace, job, label }) {
  const dest = path.join(dir, fileName);
  if (replace) {
    fs.rmSync(dest, { force: true });
    fs.rmSync(`${dest}.disabled`, { force: true });
  }
  await downloadFile(
    { url, dest, sha1, size, label },
    {
      onBytes: (bytes) => job?.addBytes(bytes),
      onSkip: (task) => job?.addSkipped(task),
      retries: 3,
    },
  );
  return dest;
}

function makeEntry({ folder, world, fileName, source, projectId, versionId, title, iconUrl, downloadUrl, hashes, gameVersions, loaders, projectType, dependencies, extra }) {
  return {
    key: '',
    folder,
    world: world || null,
    fileName,
    source,
    projectId: projectId ? String(projectId) : null,
    versionId: versionId ? String(versionId) : null,
    title: title || fileName,
    iconUrl: iconUrl || null,
    downloadUrl: downloadUrl || null,
    hashes: hashes || null,
    gameVersions: gameVersions || [],
    loaders: loaders || [],
    projectType: projectType || 'mod',
    dependencies: dependencies || [],
    enabled: true,
    installedAt: new Date().toISOString(),
    ...(extra || {}),
  };
}

function saveEntry(instance, entry) {
  const meta = readMeta(instance);
  entry.key = relativeKey(
    instance,
    path.join(
      entry.world
        ? path.join(worldDir(instance, entry.world), 'datapacks')
        : path.join(gameDirFor(instance), entry.folder),
      entry.fileName,
    ),
  );
  meta.entries[entry.key] = entry;
  saveMeta(instance, meta);
  return entry;
}

async function installModrinth(options) {
  const {
    instance,
    projectId,
    versionId,
    world,
    job,
    installDependencies = true,
    depth = 0,
    visited = new Set(),
  } = options;
  if (!projectId) throw new Error('Projeto Modrinth em falta.');
  if (visited.has(`modrinth:${projectId}`)) return null;
  visited.add(`modrinth:${projectId}`);
  if (depth > 4) return null;

  const project = await modrinth.getProject(projectId);
  const projectType = project.project_type;
  if (!['mod', 'resourcepack', 'shader', 'datapack', 'modpack'].includes(projectType)) {
    throw new Error(`Tipo de projeto não suportado: ${projectType}`);
  }
  if (projectType === 'modpack') throw new Error('Usa a aba Modpacks para instalar modpacks.');
  if (projectType === 'mod' && (!instance.loader || instance.loader.type === 'vanilla')) {
    throw new Error('Esta instalação é Vanilla. Cria uma instalação com Fabric, Quilt, Forge ou NeoForge para usar mods.');
  }
  const loader = modrinth.loaderForInstance(instance.loader?.type);
  let versions;
  if (versionId) {
    const direct = await modrinth.getVersion(versionId);
    versions = [direct];
  } else {
    versions = await modrinth.getVersions(projectId, {
      gameVersion: instance.version,
      loader: projectType === 'mod' ? loader : undefined,
    });
  }
  const version = modrinth.pickVersion(versions, {
    gameVersion: instance.version,
    loader,
    projectType,
  });
  if (!version) {
    throw new Error(`Nenhuma versão compatível de "${project.title}" para Minecraft ${instance.version}${loader ? ` (${loader})` : ''}.`);
  }
  const file = modrinth.getPrimaryFile(version);
  if (!file?.url) throw new Error('O projeto não tem ficheiro de download.');
  const { folder, world: resolvedWorld, dir } = targetDir(instance, projectType, world);
  const meta = readMeta(instance);
  const existing = Object.values(meta.entries).find(
    (entry) => entry.source === 'modrinth' && entry.projectId === String(projectId) && entry.folder === folder && (entry.world || null) === (resolvedWorld || null),
  );
  const fileName = uniqueFileName(dir, file.filename, null, existing);
  job?.setStage(
    projectType === 'mod' ? 'Mods' : projectType === 'resourcepack' ? 'Resource packs' : projectType === 'shader' ? 'Shaders' : 'Datapacks',
    `A instalar ${project.title}...`,
  );
  const dest = await downloadToTarget({
    url: file.url,
    dir,
    fileName,
    sha1: file.hashes?.sha1,
    size: file.size,
    replace: Boolean(existing),
    job,
    label: file.filename,
  });
  if (existing && existing.fileName !== fileName) removeActualFile(instance, existing);
  if (existing && existing.key) delete meta.entries[existing.key];
  const entry = makeEntry({
    folder,
    world: resolvedWorld,
    fileName,
    source: 'modrinth',
    projectId,
    versionId: version.id,
    title: project.title,
    iconUrl: project.icon_url,
    downloadUrl: file.url,
    hashes: file.hashes,
    gameVersions: version.game_versions,
    loaders: version.loaders,
    projectType,
    dependencies: version.dependencies,
  });
  const saved = saveEntry(instance, entry);
  if (installDependencies && projectType === 'mod') {
    const required = (version.dependencies || []).filter((dep) => dep.dependency_type === 'required' && dep.project_id);
    for (const dep of required) {
      try {
        await installModrinth({
          instance,
          projectId: dep.project_id,
          versionId: dep.version_id || null,
          job,
          installDependencies: true,
          depth: depth + 1,
          visited,
        });
      } catch (error) {
        job?.warn(`Dependência ${dep.project_id}: ${error.message}`);
      }
    }
  }
  return saved;
}

async function installCurseForge(options) {
  const { instance, modId, fileId, projectType = 'mod', world, job, depth = 0, visited = new Set() } = options;
  if (!modId) throw new Error('Projeto CurseForge em falta.');
  if (visited.has(`curseforge:${modId}`)) return null;
  visited.add(`curseforge:${modId}`);
  if (depth > 4) return null;
  if (projectType === 'mod' && (!instance.loader || instance.loader.type === 'vanilla')) {
    throw new Error('Esta instalação é Vanilla. Cria uma instalação com Fabric, Quilt, Forge ou NeoForge para usar mods.');
  }
  const loader = instance.loader?.type === 'liteloader' ? null : instance.loader?.type;
  const file = await curseforge.resolveFile(modId, {
    gameVersion: instance.version,
    loader,
    fileId,
  });
  if (!file.downloadUrl) throw new Error('A CurseForge não forneceu um URL de download.');
  const project = await curseforge.getMod(modId).catch(() => null);
  const { folder, world: resolvedWorld, dir } = targetDir(instance, projectType, world);
  const meta = readMeta(instance);
  const existing = Object.values(meta.entries).find(
    (entry) => entry.source === 'curseforge' && entry.projectId === String(modId) && entry.folder === folder && (entry.world || null) === (resolvedWorld || null),
  );
  const fileName = uniqueFileName(dir, file.filename, null, existing);
  job?.setStage('CurseForge', `A instalar ${project?.title || file.filename}...`);
  await downloadToTarget({
    url: file.downloadUrl,
    dir,
    fileName,
    sha1: file.hashes?.find((hash) => hash.algo === 1)?.value,
    size: file.size,
    replace: Boolean(existing),
    job,
    label: file.filename,
  });
  if (existing && existing.key) delete meta.entries[existing.key];
  if (existing && existing.fileName !== fileName) removeActualFile(instance, existing);
  const entry = makeEntry({
    folder,
    world: resolvedWorld,
    fileName,
    source: 'curseforge',
    projectId: modId,
    versionId: file.id,
    title: project?.title || file.filename,
    iconUrl: project?.iconUrl || null,
    downloadUrl: file.downloadUrl,
    hashes: file.hashes,
    gameVersions: file.gameVersions || [],
    loaders: [],
    projectType,
    dependencies: file.dependencies || [],
    extra: { curseForgeFileId: file.id },
  });
  const saved = saveEntry(instance, entry);
  if (projectType === 'mod' && Array.isArray(file.dependencies)) {
    for (const dep of file.dependencies.filter((item) => item.relationType === 3)) {
      try {
        await installCurseForge({
          instance,
          modId: dep.modId,
          projectType: 'mod',
          job,
          depth: depth + 1,
          visited,
        });
      } catch (error) {
        job?.warn(`Dependência CurseForge ${dep.modId}: ${error.message}`);
      }
    }
  }
  return saved;
}

async function installGithub(options) {
  const { instance, repo, release, asset, projectType = 'mod', world, job } = options;
  if (!asset?.downloadUrl) throw new Error('Asset GitHub inválido.');
  if (projectType === 'mod' && (!instance.loader || instance.loader.type === 'vanilla')) {
    throw new Error('Esta instalação é Vanilla. Cria uma instalação com Fabric, Quilt, Forge ou NeoForge para usar mods.');
  }
  const { folder, world: resolvedWorld, dir } = targetDir(instance, projectType, world);
  const meta = readMeta(instance);
  const existing = Object.values(meta.entries).find(
    (entry) => entry.source === 'github' && entry.githubRepo === repo && entry.folder === folder && (entry.world || null) === (resolvedWorld || null),
  );
  const fileName = uniqueFileName(dir, asset.name, null, existing);
  job?.setStage('GitHub', `A instalar ${asset.name}...`);
  const dest = await downloadToTarget({
    url: asset.downloadUrl,
    dir,
    fileName,
    replace: Boolean(existing),
    job,
    label: asset.name,
  });
  if (existing && existing.key) delete meta.entries[existing.key];
  if (existing && existing.fileName !== fileName) removeActualFile(instance, existing);
  const hashes = { sha1: await sha1File(dest) };
  const entry = makeEntry({
    folder,
    world: resolvedWorld,
    fileName,
    source: 'github',
    projectId: repo,
    versionId: release?.tag || null,
    title: asset.name.replace(/\.(jar|zip)$/i, ''),
    iconUrl: null,
    downloadUrl: asset.downloadUrl,
    hashes,
    gameVersions: [],
    loaders: [],
    projectType,
    dependencies: [],
    extra: { githubRepo: repo, githubTag: release?.tag || null, githubAssetId: asset.id },
  });
  return saveEntry(instance, entry);
}

function listInstalled(instance, options = {}) {
  const meta = readMeta(instance);
  const entries = [];
  const seenKeys = new Set();
  for (const [key, entry] of Object.entries(meta.entries)) {
    const baseDir = entry.world
      ? path.join(worldDir(instance, entry.world), 'datapacks')
      : path.join(gameDirFor(instance), entry.folder || 'mods');
    const canonical = path.join(baseDir, entry.fileName);
    const enabled = fileExists(canonical);
    const disabled = fileExists(`${canonical}.disabled`);
    if (!enabled && !disabled) continue;
    if (options.world && entry.world && entry.world !== options.world) continue;
    if (options.world && entry.projectType === 'datapack' && entry.world !== options.world) continue;
    let size = 0;
    try {
      size = fs.statSync(enabled ? canonical : `${canonical}.disabled`).size;
    } catch {
      /* ignore */
    }
    entries.push({ ...entry, key, enabled, size });
    seenKeys.add(key);
  }
  const scanFolders = [
    { folder: 'mods', extensions: ['.jar'], world: null },
    { folder: 'resourcepacks', extensions: ['.zip'], world: null },
    { folder: 'shaderpacks', extensions: ['.zip'], world: null },
  ];
  if (options.world) {
    scanFolders.push({ folder: 'datapacks', extensions: ['.zip'], world: options.world, base: path.join(worldDir(instance, options.world), 'datapacks') });
  }
  for (const scan of scanFolders) {
    const dir = scan.base || path.join(gameDirFor(instance), scan.folder);
    let files = [];
    try {
      files = fs.readdirSync(dir);
    } catch {
      continue;
    }
    for (const fileName of files) {
      const disabled = fileName.endsWith('.disabled');
      const actual = disabled ? fileName.slice(0, -'.disabled'.length) : fileName;
      if (!scan.extensions.some((ext) => actual.toLowerCase().endsWith(ext))) continue;
      const key = relativeKey(instance, path.join(dir, actual));
      if (seenKeys.has(key)) continue;
      const projectType = scan.folder === 'resourcepacks' ? 'resourcepack' : scan.folder === 'shaderpacks' ? 'shader' : scan.folder === 'datapacks' ? 'datapack' : 'mod';
      let size = 0;
      try {
        size = fs.statSync(path.join(dir, fileName)).size;
      } catch {
        /* ignore */
      }
      entries.push({
        key,
        folder: scan.folder,
        world: scan.world,
        fileName: actual,
        source: 'local',
        projectId: null,
        versionId: null,
        title: actual,
        iconUrl: null,
        downloadUrl: null,
        hashes: null,
        gameVersions: [],
        loaders: [],
        projectType,
        dependencies: [],
        enabled: !disabled,
        installedAt: null,
        size,
      });
      seenKeys.add(key);
    }
  }
  return entries.sort((a, b) => String(a.title).localeCompare(String(b.title)));
}

function toggle(instance, key) {
  const meta = readMeta(instance);
  let entry = meta.entries[key];
  if (!entry) {
    const local = listInstalled(instance).find((item) => item.key === key);
    if (!local) throw new Error('Entrada de mod não encontrada.');
    entry = local;
  }
  const baseDir = entry.world
    ? path.join(worldDir(instance, entry.world), 'datapacks')
    : path.join(gameDirFor(instance), entry.folder || 'mods');
  const canonical = path.join(baseDir, entry.fileName);
  const disabled = `${canonical}.disabled`;
  if (fileExists(canonical)) {
    fs.renameSync(canonical, disabled);
    entry.enabled = false;
  } else if (fileExists(disabled)) {
    fs.renameSync(disabled, canonical);
    entry.enabled = true;
  } else {
    throw new Error('Ficheiro não encontrado.');
  }
  meta.entries[key] = entry;
  saveMeta(instance, meta);
  return { ...entry, key, enabled: entry.enabled };
}

function remove(instance, key) {
  const meta = readMeta(instance);
  let entry = meta.entries[key];
  if (!entry) {
    entry = listInstalled(instance).find((item) => item.key === key);
  }
  if (!entry) throw new Error('Entrada não encontrada.');
  removeActualFile(instance, entry);
  delete meta.entries[key];
  saveMeta(instance, meta);
  return true;
}

async function checkUpdates(instance) {
  const meta = readMeta(instance);
  const updates = [];
  for (const [key, entry] of Object.entries(meta.entries)) {
    if (!['modrinth', 'curseforge', 'github'].includes(entry.source)) continue;
    if (entry.projectType === 'modpack') continue;
    try {
      if (entry.source === 'modrinth' && entry.projectId) {
        const versions = await modrinth.getVersions(entry.projectId, {
          gameVersion: instance.version,
          loader: entry.projectType === 'mod' ? modrinth.loaderForInstance(instance.loader?.type) : undefined,
        });
        const latest = modrinth.pickVersion(versions, {
          gameVersion: instance.version,
          loader: modrinth.loaderForInstance(instance.loader?.type),
          projectType: entry.projectType,
        });
        if (latest && latest.id !== entry.versionId) {
          updates.push({
            key,
            title: entry.title,
            source: entry.source,
            projectType: entry.projectType,
            currentVersion: entry.versionId,
            newVersion: latest.id,
            newVersionName: latest.version_number,
            fileName: entry.fileName,
          });
        }
      } else if (entry.source === 'curseforge' && entry.projectId) {
        const files = await curseforge.getFiles(entry.projectId, {
          gameVersion: instance.version,
          loader: entry.projectType === 'mod' ? instance.loader?.type : undefined,
        });
        const latest = curseforge.pickFile(files);
        if (latest && String(latest.id) !== String(entry.versionId)) {
          updates.push({
            key,
            title: entry.title,
            source: entry.source,
            projectType: entry.projectType,
            currentVersion: entry.versionId,
            newVersion: latest.id,
            newVersionName: latest.displayName,
            fileName: entry.fileName,
          });
        }
      } else if (entry.source === 'github' && entry.githubRepo) {
        const release = await github.getLatestRelease(entry.githubRepo);
        const asset =
          release.assets.find((item) => item.name === entry.fileName) ||
          release.assets.find((item) => item.name.toLowerCase().endsWith('.jar'));
        if (asset && release.tag !== entry.githubTag) {
          updates.push({
            key,
            title: entry.title,
            source: entry.source,
            projectType: entry.projectType,
            currentVersion: entry.githubTag,
            newVersion: release.tag,
            newVersionName: asset.name,
            fileName: entry.fileName,
          });
        }
      }
    } catch (error) {
      // Ignore individual update failures; the UI still lists installed content.
    }
  }
  return updates;
}

async function applyUpdate(instance, key, job) {
  const meta = readMeta(instance);
  const entry = meta.entries[key];
  if (!entry) throw new Error('Entrada não encontrada.');
  if (entry.source === 'modrinth') {
    return installModrinth({
      instance,
      projectId: entry.projectId,
      world: entry.world,
      job,
      installDependencies: true,
    });
  }
  if (entry.source === 'curseforge') {
    return installCurseForge({
      instance,
      modId: entry.projectId,
      projectType: entry.projectType,
      world: entry.world,
      job,
    });
  }
  if (entry.source === 'github') {
    const release = await github.getLatestRelease(entry.githubRepo);
    const asset =
      release.assets.find((item) => item.name === entry.fileName) ||
      release.assets.find((item) => item.name.toLowerCase().endsWith('.jar'));
    if (!asset) throw new Error('Nenhum asset compatível na release mais recente.');
    return installGithub({
      instance,
      repo: entry.githubRepo,
      release,
      asset,
      projectType: entry.projectType,
      world: entry.world,
      job,
    });
  }
  return null;
}

async function updateAll(instance, job) {
  const updates = await checkUpdates(instance);
  const results = [];
  for (const update of updates) {
    try {
      job?.setStage('Atualizações', `A atualizar ${update.title}...`);
      await applyUpdate(instance, update.key, job);
      results.push({ ...update, updated: true });
    } catch (error) {
      job?.warn(`${update.title}: ${error.message}`);
      results.push({ ...update, updated: false, error: error.message });
    }
  }
  return { updates, results };
}

function countMods(instance) {
  const dir = path.join(gameDirFor(instance), 'mods');
  try {
    return fs.readdirSync(dir).filter((name) => /\.jar(?:\.disabled)?$/i.test(name)).length;
  } catch {
    return 0;
  }
}

module.exports = {
  readMeta,
  saveMeta,
  installModrinth,
  installCurseForge,
  installGithub,
  listInstalled,
  toggle,
  remove,
  checkUpdates,
  applyUpdate,
  updateAll,
  countMods,
  listWorlds,
  worldDir,
  targetDir,
};
