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
  fetchBuffer,
  downloadFile,
  downloadMany,
  sha1Buffer,
  sha512Buffer,
  hashFile,
  randomId,
  nowStamp,
} = require('./util');
const { readZip, entryData, getZipEntry, createZip } = require('./zip');
const { instanceDir } = require('./paths');
const { getSettings, createInstallation, updateInstallation, getInstallation } = require('./store');
const { ensureVersionInstalled, getVersionMeta } = require('./mojang');
const { installLoader } = require('./loaders');
const modrinth = require('./modrinth');
const curseforge = require('./curseforge');
const mods = require('./mods');

function parseLoaderFromDependencies(dependencies) {
  if (!dependencies || !dependencies.minecraft) throw new Error('O modpack não indica a versão do Minecraft.');
  const mc = dependencies.minecraft;
  if (dependencies['fabric-loader']) return { mcVersion: mc, loader: { type: 'fabric', version: dependencies['fabric-loader'] } };
  if (dependencies['quilt-loader']) return { mcVersion: mc, loader: { type: 'quilt', version: dependencies['quilt-loader'] } };
  if (dependencies.forge) return { mcVersion: mc, loader: { type: 'forge', version: dependencies.forge } };
  if (dependencies.neoforge) return { mcVersion: mc, loader: { type: 'neoforge', version: dependencies.neoforge } };
  return { mcVersion: mc, loader: { type: 'vanilla', version: null } };
}

function parseMrpack(buffer) {
  const entry = getZipEntry(buffer, 'modrinth.index.json');
  if (!entry) throw new Error('O ficheiro não é um modpack Modrinth válido (modrinth.index.json em falta).');
  let index;
  try {
    index = JSON.parse(entry.data.toString('utf8'));
  } catch {
    throw new Error('modrinth.index.json inválido.');
  }
  if (!index.dependencies) throw new Error('O modpack não tem dependências definidas.');
  const parsed = parseLoaderFromDependencies(index.dependencies);
  return { index, ...parsed };
}

async function resolveModpack(projectId, versionId = null) {
  const project = await modrinth.getProject(projectId);
  let version;
  if (versionId) {
    version = await modrinth.getVersion(versionId);
  } else {
    const versions = await modrinth.getVersions(projectId);
    version = modrinth.pickVersion(versions, {});
  }
  if (!version) throw new Error('Nenhuma versão do modpack encontrada.');
  const file =
    version.files?.find((item) => item.filename?.toLowerCase().endsWith('.mrpack')) ||
    modrinth.getPrimaryFile(version);
  if (!file?.url) throw new Error('O modpack não tem ficheiro .mrpack.');
  const buffer = await fetchBuffer(file.url, { timeout: 120000 });
  if (file.hashes?.sha1 && sha1Buffer(buffer) !== file.hashes.sha1) {
    throw new Error('O ficheiro .mrpack falhou a verificação de integridade.');
  }
  const parsed = parseMrpack(buffer);
  return {
    source: 'modrinth',
    projectId,
    project,
    version,
    versionId: version.id,
    versionNumber: version.version_number,
    name: project.title,
    iconUrl: project.icon_url,
    buffer,
    index: parsed.index,
    mcVersion: parsed.mcVersion,
    loader: parsed.loader,
  };
}

async function resolveLatestModpackVersion(projectId) {
  const project = await modrinth.getProject(projectId);
  const versions = await modrinth.getVersions(projectId);
  const version = modrinth.pickVersion(versions, {});
  if (!version) throw new Error('Nenhuma versão do modpack encontrada.');
  const file =
    version.files?.find((item) => item.filename?.toLowerCase().endsWith('.mrpack')) ||
    modrinth.getPrimaryFile(version);
  if (!file?.url) throw new Error('O modpack não tem ficheiro .mrpack.');
  const buffer = await fetchBuffer(file.url, { timeout: 120000 });
  if (file.hashes?.sha1 && sha1Buffer(buffer) !== file.hashes.sha1) {
    throw new Error('O ficheiro .mrpack falhou a verificação de integridade.');
  }
  const parsed = parseMrpack(buffer);
  return {
    source: 'modrinth',
    projectId,
    project,
    version,
    versionId: version.id,
    versionNumber: version.version_number,
    name: project.title,
    iconUrl: project.icon_url,
    buffer,
    index: parsed.index,
    mcVersion: parsed.mcVersion,
    loader: parsed.loader,
  };
}

function createInstanceForPack(resolved, options = {}) {
  const id = randomId(6);
  const gameDir = instanceDir(id);
  ensureDir(gameDir);
  for (const sub of ['mods', 'config', 'resourcepacks', 'shaderpacks', 'saves', 'screenshots', 'logs']) {
    ensureDir(path.join(gameDir, sub));
  }
  const record = {
    id,
    name: options.name || resolved.name || 'Modpack',
    icon: options.icon || '🧩',
    color: options.color || '#a78bfa',
    iconUrl: resolved.iconUrl || null,
    version: resolved.mcVersion,
    versionType: 'release',
    loader: resolved.loader,
    versionId: resolved.mcVersion,
    status: 'installing',
    gameDir,
    modpack: {
      source: resolved.source,
      projectId: resolved.projectId || null,
      versionId: resolved.versionId || null,
      versionNumber: resolved.versionNumber || null,
      name: resolved.name || options.name || 'Modpack',
    },
  };
  return createInstallation(record);
}

async function ensureBaseAndLoader(instance, resolved, job) {
  job?.setStage('Versão', `A preparar Minecraft ${resolved.mcVersion}...`);
  await ensureVersionInstalled(resolved.mcVersion, job);
  const loaderResult = await installLoader(
    { ...instance, version: resolved.mcVersion, loader: resolved.loader },
    job,
    { version: resolved.loader.version },
  );
  updateInstallation(instance.id, {
    versionId: loaderResult.versionId,
    loader: { type: resolved.loader.type, version: loaderResult.loaderVersion || resolved.loader.version },
    status: 'installing',
  });
  return loaderResult;
}

async function extractOverrides(buffer, targetDir, job) {
  const entries = readZip(buffer);
  let count = 0;
  for (const entry of entries) {
    if (entry.isDirectory) continue;
    if (!entry.name.startsWith('overrides/') && !entry.name.startsWith('client-overrides/')) continue;
    const relative = entry.name.replace(/^(client-overrides|overrides)\//, '');
    if (!relative || relative.startsWith('.minesphere/')) continue;
    const target = safeJoin(targetDir, relative);
    ensureDir(path.dirname(target));
    await fsp.writeFile(target, entryData(buffer, entry));
    count += 1;
    if (count % 20 === 0) await new Promise((resolve) => setImmediate(resolve));
  }
  job?.setDetail(`${count} ficheiros de overrides extraídos.`);
  return count;
}

async function installMrpackIntoInstance(instance, resolved, job) {
  try {
    updateInstallation(instance.id, { status: 'installing', error: null });
    const loaderResult = await ensureBaseAndLoader(instance, resolved, job);
    const tasks = [];
    const skipped = [];
    for (const file of resolved.index.files || []) {
      if (!file || !file.path) continue;
      if (file.env?.client === 'unsupported') {
        skipped.push(file.path);
        continue;
      }
      if (!Array.isArray(file.downloads) || !file.downloads.length) {
        skipped.push(file.path);
        continue;
      }
      const dest = safeJoin(instance.gameDir, file.path);
      if (file.path.startsWith('.minesphere/')) continue;
      tasks.push({
        url: file.downloads[0],
        dest,
        sha1: file.hashes?.sha1,
        size: file.fileSize,
        label: file.path,
      });
    }
    job?.setStage('Modpack', `A descarregar ${tasks.length} ficheiros do modpack...`);
    await downloadMany(tasks, { concurrency: getSettings().parallelDownloads || 8, job });
    job?.setStage('Modpack', 'A extrair overrides...');
    await extractOverrides(resolved.buffer, instance.gameDir, job);
    const packMeta = {
      source: resolved.source,
      projectId: resolved.projectId || null,
      versionId: resolved.versionId || null,
      versionNumber: resolved.versionNumber || null,
      name: resolved.name,
      installedAt: new Date().toISOString(),
      index: resolved.index,
      skipped,
    };
    writeJson(path.join(instance.gameDir, '.minesphere', 'pack.json'), packMeta);
    const updated = updateInstallation(instance.id, {
      status: 'ready',
      version: resolved.mcVersion,
      versionId: loaderResult.versionId,
      loader: { type: resolved.loader.type, version: loaderResult.loaderVersion || resolved.loader.version },
      error: null,
    });
    job?.setStage('Modpack', 'Instalação concluída.');
    return updated;
  } catch (error) {
    updateInstallation(instance.id, { status: 'error', error: error.message });
    throw error;
  }
}

async function extractGenericZip(buffer, targetDir, job) {
  const entries = readZip(buffer);
  const fileEntries = entries.filter((entry) => !entry.isDirectory && !entry.name.startsWith('__MACOSX/'));
  const firstSegments = new Set(
    fileEntries.map((entry) => entry.name.split('/')[0]).filter((segment) => segment && !segment.includes('.')),
  );
  let strip = '';
  if (firstSegments.size === 1) {
    const candidate = [...firstSegments][0];
    const known = ['mods', 'config', 'resourcepacks', 'shaderpacks', 'saves', 'logs', 'defaultconfigs'];
    if (!known.includes(candidate)) {
      const prefix = `${candidate}/`;
      if (fileEntries.every((entry) => entry.name.startsWith(prefix))) strip = prefix;
    }
  }
  let count = 0;
  for (const entry of fileEntries) {
    let relative = entry.name;
    if (strip && relative.startsWith(strip)) relative = relative.slice(strip.length);
    if (!relative || relative.startsWith('.minesphere/')) continue;
    const target = safeJoin(targetDir, relative);
    ensureDir(path.dirname(target));
    await fsp.writeFile(target, entryData(buffer, entry));
    count += 1;
    if (count % 20 === 0) await new Promise((resolve) => setImmediate(resolve));
  }
  job?.setDetail(`${count} ficheiros extraídos.`);
  return count;
}

async function installGenericZipIntoInstance(instance, buffer, job) {
  try {
    updateInstallation(instance.id, { status: 'installing', error: null });
    const resolved = { mcVersion: instance.version, loader: instance.loader, name: instance.name };
    const loaderResult = await ensureBaseAndLoader(instance, resolved, job);
    job?.setStage('Modpack', 'A extrair ficheiro ZIP...');
    await extractGenericZip(buffer, instance.gameDir, job);
    writeJson(path.join(instance.gameDir, '.minesphere', 'pack.json'), {
      source: 'zip',
      name: instance.name,
      installedAt: new Date().toISOString(),
    });
    return updateInstallation(instance.id, {
      status: 'ready',
      versionId: loaderResult.versionId,
      loader: { type: instance.loader.type, version: loaderResult.loaderVersion || instance.loader.version },
      error: null,
    });
  } catch (error) {
    updateInstallation(instance.id, { status: 'error', error: error.message });
    throw error;
  }
}

async function importCurseForgeZip(buffer) {
  const manifestEntry = getZipEntry(buffer, 'manifest.json');
  if (!manifestEntry) throw new Error('manifest.json da CurseForge em falta.');
  let manifest;
  try {
    manifest = JSON.parse(manifestEntry.data.toString('utf8'));
  } catch {
    throw new Error('manifest.json inválido.');
  }
  const mcVersion = manifest.minecraft?.version;
  const loaderEntry = manifest.minecraft?.modLoaders?.find((item) => item.primary) || manifest.minecraft?.modLoaders?.[0];
  if (!mcVersion || !loaderEntry?.id) throw new Error('O manifest não define a versão/loader do Minecraft.');
  const loaderId = String(loaderEntry.id);
  let loader = { type: 'vanilla', version: null };
  if (loaderId.startsWith('forge-')) loader = { type: 'forge', version: loaderId.slice('forge-'.length) };
  else if (loaderId.startsWith('neoforge-')) loader = { type: 'neoforge', version: loaderId.slice('neoforge-'.length) };
  else if (loaderId.startsWith('fabric-')) loader = { type: 'fabric', version: loaderId.slice('fabric-'.length) };
  else if (loaderId.startsWith('quilt-')) loader = { type: 'quilt', version: loaderId.slice('quilt-'.length) };
  return {
    source: 'curseforge',
    name: manifest.name || 'Modpack CurseForge',
    mcVersion,
    loader,
    manifest,
    buffer,
    projectId: null,
    versionId: null,
    versionNumber: manifest.version || null,
    iconUrl: null,
    index: null,
  };
}

async function installCurseForgeZipIntoInstance(instance, resolved, job) {
  try {
    updateInstallation(instance.id, { status: 'installing', error: null });
    const loaderResult = await ensureBaseAndLoader(instance, resolved, job);
    const tasks = [];
    for (const item of resolved.manifest.files || []) {
      if (!item.projectID || !item.fileID) continue;
      try {
        const file = await curseforge.getFileById(item.projectID, item.fileID);
        let folder = 'mods';
        try {
          const mod = await curseforge.getMod(item.projectID);
          if (mod.projectType === 'resourcepack') folder = 'resourcepacks';
          else if (mod.projectType === 'shader') folder = 'shaderpacks';
        } catch {
          /* fallback to mods */
        }
        const dir = path.join(instance.gameDir, folder);
        ensureDir(dir);
        const fileName = sanitizeFilename(file.filename || `mod-${item.projectID}.jar`);
        tasks.push({
          url: file.downloadUrl,
          dest: path.join(dir, fileName),
          sha1: file.hashes?.find((hash) => hash.algo === 1)?.value,
          size: file.size,
          label: fileName,
        });
      } catch (error) {
        job?.warn(`Ficheiro CurseForge ${item.projectID}/${item.fileID}: ${error.message}`);
      }
    }
    job?.setStage('Modpack', `A descarregar ${tasks.length} ficheiros da CurseForge...`);
    await downloadMany(tasks, { concurrency: getSettings().parallelDownloads || 8, job });
    const overrides = resolved.manifest.overrides || 'overrides';
    const entries = readZip(resolved.buffer);
    let count = 0;
    for (const entry of entries) {
      if (entry.isDirectory || !entry.name.startsWith(`${overrides}/`)) continue;
      const relative = entry.name.slice(overrides.length + 1);
      if (!relative || relative.startsWith('.minesphere/')) continue;
      const target = safeJoin(instance.gameDir, relative);
      ensureDir(path.dirname(target));
      await fsp.writeFile(target, entryData(resolved.buffer, entry));
      count += 1;
      if (count % 20 === 0) await new Promise((resolve) => setImmediate(resolve));
    }
    writeJson(path.join(instance.gameDir, '.minesphere', 'pack.json'), {
      source: 'curseforge',
      name: resolved.name,
      installedAt: new Date().toISOString(),
      manifest: resolved.manifest,
    });
    return updateInstallation(instance.id, {
      status: 'ready',
      versionId: loaderResult.versionId,
      loader: { type: resolved.loader.type, version: loaderResult.loaderVersion || resolved.loader.version },
      error: null,
    });
  } catch (error) {
    updateInstallation(instance.id, { status: 'error', error: error.message });
    throw error;
  }
}

function addFileToEntries(entries, base, relative, prefix = '') {
  const full = path.join(base, relative);
  if (!fileExists(full)) return;
  const name = `${prefix}${relative}`.replace(/\\/g, '/');
  entries.push({ name, data: fs.readFileSync(full) });
}

async function addDirectoryToEntries(entries, dir, prefix, options = {}) {
  let list;
  try {
    list = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const item of list) {
    const full = path.join(dir, item.name);
    const relative = path.join(prefix, item.name).replace(/\\/g, '/');
    if (item.isDirectory()) {
      if (item.name === '.minesphere' || item.name === 'logs' || item.name === 'backups' || item.name === 'natives') continue;
      await addDirectoryToEntries(entries, full, relative, options);
    } else if (item.isFile()) {
      if (options.filter && !options.filter(relative)) continue;
      entries.push({ name: relative, data: await fsp.readFile(full) });
    }
  }
}

async function exportMrpack(instance) {
  const meta = mods.readMeta(instance);
  const dependencies = { minecraft: instance.version };
  if (instance.loader?.type === 'fabric') dependencies['fabric-loader'] = instance.loader.version;
  else if (instance.loader?.type === 'quilt') dependencies['quilt-loader'] = instance.loader.version;
  else if (instance.loader?.type === 'forge') dependencies.forge = instance.loader.version;
  else if (instance.loader?.type === 'neoforge') dependencies.neoforge = instance.loader.version;

  const files = [];
  const overrides = [];
  for (const [key, entry] of Object.entries(meta.entries)) {
    if (entry.folder !== 'mods' || entry.projectType !== 'mod') continue;
    const full = path.join(instance.gameDir, entry.folder, entry.fileName);
    if (!fileExists(full)) continue;
    if (entry.source === 'modrinth' && entry.downloadUrl) {
      let hashes = entry.hashes || {};
      if (!hashes.sha1) hashes = { ...hashes, sha1: await hashFile(full, 'sha1') };
      if (!hashes.sha512) hashes = { ...hashes, sha512: await hashFile(full, 'sha512') };
      files.push({
        path: `mods/${entry.fileName}`,
        hashes: { sha1: hashes.sha1, sha512: hashes.sha512 },
        env: { client: 'required', server: 'required' },
        downloads: [entry.downloadUrl],
        fileSize: fs.statSync(full).size,
      });
    } else {
      overrides.push({ name: `overrides/mods/${entry.fileName}`, data: fs.readFileSync(full) });
    }
  }
  const configDir = path.join(instance.gameDir, 'config');
  const entries = [];
  await addDirectoryToEntries(entries, configDir, 'overrides/config');
  const optionsFile = path.join(instance.gameDir, 'options.txt');
  if (fileExists(optionsFile)) entries.push({ name: 'overrides/options.txt', data: fs.readFileSync(optionsFile) });
  for (const entry of entries) overrides.push(entry);
  const index = {
    formatVersion: 1,
    game: 'minecraft',
    versionId: `minesphere-${nowStamp()}`,
    name: instance.name,
    summary: 'Modpack exportado pelo MineSphere Launcher',
    files,
    dependencies,
  };
  const zip = createZip([
    { name: 'modrinth.index.json', data: JSON.stringify(index, null, 2) },
    ...overrides,
  ]);
  return {
    buffer: zip,
    fileName: `${sanitizeFilename(instance.name, 'modpack')}.mrpack`,
    index,
  };
}

async function exportFullZip(instance) {
  const entries = [];
  for (const folder of ['mods', 'config', 'resourcepacks', 'shaderpacks']) {
    await addDirectoryToEntries(entries, path.join(instance.gameDir, folder), folder);
  }
  for (const file of ['options.txt', 'servers.dat']) {
    if (fileExists(path.join(instance.gameDir, file))) {
      entries.push({ name: file, data: fs.readFileSync(path.join(instance.gameDir, file)) });
    }
  }
  entries.push({
    name: 'minesphere-pack.json',
    data: JSON.stringify(
      {
        format: 'minesphere-pack',
        version: 1,
        name: instance.name,
        minecraft: instance.version,
        loader: instance.loader,
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  });
  return {
    buffer: createZip(entries),
    fileName: `${sanitizeFilename(instance.name, 'instancia')}.zip`,
  };
}

async function updateModpack(instance, job) {
  const packPath = path.join(instance.gameDir, '.minesphere', 'pack.json');
  const pack = readJson(packPath);
  if (!pack?.projectId) throw new Error('Esta instalação não tem informação de modpack para atualizar.');
  const resolved = await resolveLatestModpackVersion(pack.projectId);
  if (resolved.versionId === pack.versionId) {
    return { updated: false, version: resolved.versionNumber };
  }
  job?.setStage('Modpack', `A atualizar para ${resolved.versionNumber}...`);
  updateInstallation(instance.id, { status: 'installing', error: null });
  try {
    const loaderChanged =
      resolved.loader.type !== instance.loader?.type || String(resolved.loader.version) !== String(instance.loader?.version);
    const loaderResult = await ensureBaseAndLoader(
      { ...instance, version: resolved.mcVersion, loader: resolved.loader },
      resolved,
      job,
    );
    const tasks = [];
    for (const file of resolved.index.files || []) {
      if (!file?.path || !Array.isArray(file.downloads) || !file.downloads.length) continue;
      if (file.env?.client === 'unsupported') continue;
      const dest = safeJoin(instance.gameDir, file.path);
      tasks.push({ url: file.downloads[0], dest, sha1: file.hashes?.sha1, size: file.fileSize, label: file.path });
    }
    job?.setStage('Modpack', `A descarregar ${tasks.length} ficheiros atualizados...`);
    await downloadMany(tasks, { concurrency: getSettings().parallelDownloads || 8, job });
    await extractOverrides(resolved.buffer, instance.gameDir, job);
    const oldFiles = new Set((pack.index?.files || []).map((file) => file.path));
    const newFiles = new Set((resolved.index.files || []).map((file) => file.path));
    for (const oldPath of oldFiles) {
      if (!newFiles.has(oldPath) && oldPath && !oldPath.startsWith('.minesphere/')) {
        try {
          fs.rmSync(safeJoin(instance.gameDir, oldPath), { force: true });
        } catch {
          /* ignore */
        }
      }
    }
    writeJson(packPath, {
      ...pack,
      source: resolved.source,
      versionId: resolved.versionId,
      versionNumber: resolved.versionNumber,
      name: resolved.name,
      index: resolved.index,
      installedAt: new Date().toISOString(),
    });
    const updated = updateInstallation(instance.id, {
      status: 'ready',
      version: resolved.mcVersion,
      versionId: loaderResult.versionId,
      loader: { type: resolved.loader.type, version: loaderResult.loaderVersion || resolved.loader.version },
      error: null,
    });
    return { updated: true, version: resolved.versionNumber, loaderChanged, instance: updated };
  } catch (error) {
    updateInstallation(instance.id, { status: 'error', error: error.message });
    throw error;
  }
}

async function getInstalledPackInfo(instance) {
  return readJson(path.join(instance.gameDir, '.minesphere', 'pack.json'), null);
}

module.exports = {
  resolveModpack,
  resolveLatestModpackVersion,
  parseMrpack,
  createInstanceForPack,
  installMrpackIntoInstance,
  installGenericZipIntoInstance,
  importCurseForgeZip,
  installCurseForgeZipIntoInstance,
  exportMrpack,
  exportFullZip,
  updateModpack,
  getInstalledPackInfo,
  extractOverrides,
  extractGenericZip,
};
