'use strict';

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const {
  fetchJson,
  readJson,
  writeJson,
  fileExists,
  sha1File,
  downloadFile,
  downloadMany,
  rulesAllow,
  mavenToPath,
  replaceVars,
  ensureDir,
  sleep,
} = require('./util');
const {
  GAME,
  VERSIONS,
  LIBRARIES,
  ASSETS_ROOT,
  INDEXES,
  OBJECTS,
  VIRTUAL,
  LOG_CONFIGS,
  META_CACHE,
  CACHE,
} = require('./paths');
const { getSettings } = require('./store');

const MANIFEST_URL = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
const MANIFEST_CACHE = path.join(CACHE, 'version_manifest_v2.json');
const MANIFEST_MAX_AGE = 10 * 60 * 1000;

let manifestMemory = null;
let manifestMemoryAt = 0;

function versionDir(id) {
  return path.join(VERSIONS, id);
}

function versionJsonPath(id) {
  return path.join(versionDir(id), `${id}.json`);
}

function versionJarPath(id) {
  return path.join(versionDir(id), `${id}.jar`);
}

async function getManifest(force = false) {
  if (!force && manifestMemory && Date.now() - manifestMemoryAt < MANIFEST_MAX_AGE) return manifestMemory;
  if (!force && fileExists(MANIFEST_CACHE)) {
    const stat = fs.statSync(MANIFEST_CACHE);
    if (Date.now() - stat.mtimeMs < MANIFEST_MAX_AGE) {
      const cached = readJson(MANIFEST_CACHE);
      if (cached?.versions) {
        manifestMemory = cached;
        manifestMemoryAt = Date.now();
        return cached;
      }
    }
  }
  try {
    const manifest = await fetchJson(MANIFEST_URL, { timeout: 30000 });
    if (!manifest?.versions) throw new Error('Manifesto de versões inválido.');
    writeJson(MANIFEST_CACHE, manifest);
    manifestMemory = manifest;
    manifestMemoryAt = Date.now();
    return manifest;
  } catch (error) {
    if (fileExists(MANIFEST_CACHE)) {
      const cached = readJson(MANIFEST_CACHE);
      if (cached?.versions) {
        manifestMemory = cached;
        manifestMemoryAt = Date.now();
        return cached;
      }
    }
    throw error;
  }
}

async function listVersions({ type = 'all', search = '' } = {}) {
  const manifest = await getManifest();
  const needle = String(search || '').trim().toLowerCase();
  return manifest.versions
    .filter((version) => {
      if (type && type !== 'all') {
        if (type === 'rc') {
          if (version.type !== 'snapshot' || !/(?:^|[-_.])(rc|pre)/i.test(version.id)) return false;
        } else if (version.type !== type) {
          return false;
        }
      }
      if (needle && !version.id.toLowerCase().includes(needle)) return false;
      return true;
    })
    .map((version) => ({
      id: version.id,
      type: version.type,
      url: version.url,
      releaseTime: version.releaseTime,
      sha1: version.sha1,
      complianceLevel: version.complianceLevel,
    }));
}

async function getVersionEntry(id) {
  const manifest = await getManifest();
  return manifest.versions.find((version) => version.id === id) || null;
}

async function getVersionMeta(id, options = {}) {
  const cacheFile = path.join(META_CACHE, `${id}.json`);
  if (!options.force && fileExists(cacheFile)) {
    const stat = fs.statSync(cacheFile);
    if (Date.now() - stat.mtimeMs < 6 * 60 * 60 * 1000) {
      const cached = readJson(cacheFile);
      if (cached?.id === id) return cached;
    }
  }
  const entry = await getVersionEntry(id);
  if (!entry) throw new Error(`Versão "${id}" não encontrada no manifesto da Mojang.`);
  try {
    const meta = await fetchJson(entry.url, { timeout: 30000 });
    if (!meta?.id) throw new Error('Metadados de versão inválidos.');
    writeJson(cacheFile, meta);
    return meta;
  } catch (error) {
    if (fileExists(cacheFile)) {
      const cached = readJson(cacheFile);
      if (cached?.id === id) return cached;
    }
    throw error;
  }
}

async function ensureVersionJson(id, options = {}) {
  const meta = await getVersionMeta(id, options);
  ensureDir(versionDir(id));
  const file = versionJsonPath(id);
  if (options.force || !fileExists(file)) writeJson(file, meta);
  return { meta, file, dir: versionDir(id) };
}

function readInstalledVersion(id) {
  return readJson(versionJsonPath(id), null);
}

function getVersionChain(id) {
  const chain = [];
  const seen = new Set();
  let current = id;
  while (current) {
    if (seen.has(current)) throw new Error(`Dependência circular de versões: ${current}`);
    seen.add(current);
    const json = readInstalledVersion(current);
    if (!json) throw new Error(`A versão "${current}" ainda não está instalada. Instala-a primeiro.`);
    chain.push({ id: current, json });
    current = json.inheritsFrom;
  }
  return chain;
}

function getAllowedLibraries(meta, features = {}) {
  return (meta.libraries || []).filter((lib) => lib && rulesAllow(lib.rules, features));
}

function getLibraryArtifact(lib) {
  if (!lib) return null;
  const artifact = lib.downloads?.artifact;
  if (artifact && artifact.url) {
    return {
      url: artifact.url,
      path: artifact.path || mavenToPath(lib.name),
      sha1: artifact.sha1,
      size: artifact.size,
    };
  }
  if (lib.name && lib.url) {
    const mavenPath = mavenToPath(lib.name);
    const base = String(lib.url).endsWith('/') ? lib.url : `${lib.url}/`;
    return {
      url: `${base}${mavenPath}`,
      path: mavenPath,
      sha1: lib.sha1,
      size: lib.size,
    };
  }
  return null;
}

function nativeClassifier(lib) {
  if (!lib?.natives) return null;
  const classifier = lib.natives.windows || lib.natives[process.platform === 'win32' ? 'windows' : 'linux'];
  if (!classifier) return null;
  return String(classifier).replace('${arch}', process.arch === 'x64' ? '64' : '32');
}

function getNativeArtifact(lib) {
  const classifier = nativeClassifier(lib);
  if (!classifier) return null;
  const artifact = lib.downloads?.classifiers?.[classifier];
  if (!artifact) return null;
  return {
    url: artifact.url,
    path: artifact.path || mavenToPath(`${lib.name}:${classifier}`),
    sha1: artifact.sha1,
    size: artifact.size,
  };
}

function isNativeOnlyLibrary(lib) {
  if (!lib) return false;
  if (lib.natives) return true;
  return /:natives-(windows|linux|macos|osx)/i.test(String(lib.name || ''));
}

async function ensureLibraries(meta, job, options = {}) {
  const features = options.features || {};
  const libraries = getAllowedLibraries(meta, features);
  const tasks = new Map();
  for (const lib of libraries) {
    const artifact = getLibraryArtifact(lib);
    if (artifact) {
      const dest = path.join(LIBRARIES, artifact.path);
      if (!tasks.has(dest)) {
        tasks.set(dest, {
          url: artifact.url,
          dest,
          sha1: artifact.sha1,
          size: artifact.size,
          label: `Biblioteca ${lib.name}`,
        });
      }
    }
    const native = getNativeArtifact(lib);
    if (native) {
      const dest = path.join(LIBRARIES, native.path);
      if (!tasks.has(dest)) {
        tasks.set(dest, {
          url: native.url,
          dest,
          sha1: native.sha1,
          size: native.size,
          label: `Nativo ${lib.name}`,
        });
      }
    }
  }
  job?.setStage('Bibliotecas', `A preparar ${tasks.size} bibliotecas...`);
  const concurrency = options.concurrency || getSettings().parallelDownloads || 8;
  if (tasks.size) await downloadMany([...tasks.values()], { concurrency, job });
  return [...tasks.values()].map((task) => task.dest);
}

async function downloadClientJar(meta, job, versionId) {
  const client = meta.downloads?.client;
  if (!client?.url) return null;
  const dest = versionJarPath(versionId);
  job?.setStage('Cliente', `A descarregar o cliente ${versionId}...`);
  await downloadFile(
    {
      url: client.url,
      dest,
      sha1: client.sha1,
      size: client.size,
      label: `Cliente ${versionId}`,
    },
    {
      onBytes: (bytes) => job?.addBytes(bytes),
      onSkip: (task) => job?.addSkipped(task),
    },
  );
  return dest;
}

async function ensureLogging(meta, job) {
  const file = meta.logging?.client?.file;
  if (!file?.url) return null;
  const dest = path.join(LOG_CONFIGS, file.id || path.basename(new URL(file.url).pathname));
  job?.setStage('Configuração', 'A descarregar configuração de logging...');
  await downloadFile(
    { url: file.url, dest, sha1: file.sha1, size: file.size, label: 'Configuração de logging' },
    {
      onBytes: (bytes) => job?.addBytes(bytes),
      onSkip: (task) => job?.addSkipped(task),
    },
  );
  return { ...file, localPath: dest };
}

async function ensureAssetIndex(meta, job) {
  const indexInfo = meta.assetIndex;
  if (!indexInfo?.url) return null;
  const dest = path.join(INDEXES, `${indexInfo.id}.json`);
  job?.setStage('Assets', 'A obter índice de assets...');
  await downloadFile(
    {
      url: indexInfo.url,
      dest,
      sha1: indexInfo.sha1,
      size: indexInfo.size,
      label: `Índice de assets ${indexInfo.id}`,
    },
    {
      onBytes: (bytes) => job?.addBytes(bytes),
      onSkip: (task) => job?.addSkipped(task),
    },
  );
  return { ...indexInfo, localPath: dest, data: readJson(dest) };
}

async function ensureAssets(meta, job, options = {}) {
  const index = await ensureAssetIndex(meta, job);
  if (!index?.data?.objects) return { index, count: 0 };
  const objects = Object.entries(index.data.objects);
  const tasks = new Map();
  for (const [name, object] of objects) {
    if (!object?.hash) continue;
    const dest = path.join(OBJECTS, object.hash.slice(0, 2), object.hash);
    if (!tasks.has(dest)) {
      tasks.set(dest, {
        url: `https://resources.download.minecraft.net/${object.hash.slice(0, 2)}/${object.hash}`,
        dest,
        sha1: object.hash,
        size: object.size,
        label: name,
      });
    }
  }
  job?.setStage('Assets', `A descarregar ${tasks.size} assets...`);
  const concurrency = options.concurrency || getSettings().parallelDownloads || 8;
  if (tasks.size) await downloadMany([...tasks.values()], { concurrency, job });

  if (index.data.virtual) {
    job?.setStage('Assets', 'A preparar assets virtuais (versão antiga)...');
    const virtualDir = path.join(VIRTUAL, index.id);
    ensureDir(virtualDir);
    let count = 0;
    for (const [name, object] of objects) {
      const source = path.join(OBJECTS, object.hash.slice(0, 2), object.hash);
      const dest = path.join(virtualDir, name);
      ensureDir(path.dirname(dest));
      try {
        const stat = fs.statSync(dest);
        if (stat.size === object.size) continue;
      } catch {
        /* copy */
      }
      try {
        await fsp.copyFile(source, dest);
        count += 1;
      } catch {
        /* ignore missing object; downloads report failures above */
      }
      if (count % 100 === 0) await new Promise((resolve) => setImmediate(resolve));
    }
  }
  return { index, count: objects.length };
}

async function ensureLegacyResources(meta, gameDir, job) {
  const indexInfo = meta.assetIndex;
  if (!indexInfo?.id) return;
  const indexPath = path.join(INDEXES, `${indexInfo.id}.json`);
  if (!fileExists(indexPath)) return;
  const index = readJson(indexPath);
  if (!index?.map_to_resources) return;
  const resourcesDir = path.join(gameDir, 'resources');
  ensureDir(resourcesDir);
  job?.setStage('Assets', 'A preparar resources (versão antiga)...');
  let count = 0;
  for (const [name, object] of Object.entries(index.objects || {})) {
    const source = path.join(OBJECTS, object.hash.slice(0, 2), object.hash);
    const dest = path.join(resourcesDir, name);
    ensureDir(path.dirname(dest));
    try {
      const stat = fs.statSync(dest);
      if (stat.size === object.size) continue;
    } catch {
      /* copy */
    }
    try {
      await fsp.copyFile(source, dest);
      count += 1;
    } catch {
      /* ignore */
    }
    if (count % 100 === 0) await new Promise((resolve) => setImmediate(resolve));
  }
}

async function ensureVersionInstalled(id, job, options = {}) {
  job?.setStage('Versão', `A preparar Minecraft ${id}...`);
  const { meta } = await ensureVersionJson(id, { force: options.forceJson });
  await downloadClientJar(meta, job, id);
  await ensureLibraries(meta, job, options);
  await ensureLogging(meta, job);
  if (options.assets !== false) await ensureAssets(meta, job, options);
  return meta;
}

async function verifyVersion(id, job, options = {}) {
  const meta = await ensureVersionJson(id);
  const tasks = [];
  const client = meta.downloads?.client;
  if (client?.url) {
    tasks.push({
      url: client.url,
      dest: versionJarPath(id),
      sha1: client.sha1,
      size: client.size,
      label: `Cliente ${id}`,
    });
  }
  for (const lib of getAllowedLibraries(meta)) {
    const artifact = getLibraryArtifact(lib);
    if (artifact) tasks.push({ ...artifact, dest: path.join(LIBRARIES, artifact.path), label: lib.name });
    const native = getNativeArtifact(lib);
    if (native) tasks.push({ ...native, dest: path.join(LIBRARIES, native.path), label: `${lib.name} (nativo)` });
  }
  job?.setStage('Verificação', `A verificar ${tasks.length} ficheiros...`);
  let corrupted = 0;
  for (const task of tasks) {
    if (!fileExists(task.dest)) {
      corrupted += 1;
      continue;
    }
    if (task.sha1) {
      try {
        if ((await sha1File(task.dest)) !== task.sha1) corrupted += 1;
      } catch {
        corrupted += 1;
      }
    }
  }
  if (options.repair !== false) {
    await downloadMany(tasks, { concurrency: getSettings().parallelDownloads || 8, job });
  }
  return { total: tasks.length, corrupted };
}

async function getAssetRoot(meta) {
  if (meta.assetIndex?.id) {
    const indexPath = path.join(INDEXES, `${meta.assetIndex.id}.json`);
    const index = readJson(indexPath);
    if (index?.virtual) return path.join(VIRTUAL, meta.assetIndex.id);
  }
  return ASSETS_ROOT;
}

async function getVersionDetails(id) {
  const meta = await getVersionMeta(id);
  return {
    id: meta.id,
    type: meta.type,
    releaseTime: meta.releaseTime,
    time: meta.time,
    mainClass: meta.mainClass,
    assetIndex: meta.assetIndex?.id || null,
    javaVersion: meta.javaVersion?.majorVersion || null,
    libraries: meta.libraries?.length || 0,
    downloads: meta.downloads || null,
    arguments: meta.arguments || null,
    minecraftArguments: meta.minecraftArguments || null,
    logging: meta.logging || null,
  };
}

module.exports = {
  MANIFEST_URL,
  versionDir,
  versionJsonPath,
  versionJarPath,
  getManifest,
  listVersions,
  getVersionEntry,
  getVersionMeta,
  ensureVersionJson,
  readInstalledVersion,
  getVersionChain,
  getAllowedLibraries,
  getLibraryArtifact,
  getNativeArtifact,
  isNativeOnlyLibrary,
  ensureLibraries,
  downloadClientJar,
  ensureLogging,
  ensureAssetIndex,
  ensureAssets,
  ensureLegacyResources,
  ensureVersionInstalled,
  verifyVersion,
  getAssetRoot,
  getVersionDetails,
  replaceVars,
  sleep,
};
