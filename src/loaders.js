'use strict';

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { spawn } = require('child_process');
const {
  fetchJson,
  fetchText,
  readJson,
  writeJson,
  fileExists,
  ensureDir,
  downloadFile,
  downloadMany,
  randomId,
  sleep,
} = require('./util');
const {
  GAME,
  VERSIONS,
  LIBRARIES,
  TEMP,
} = require('./paths');
const {
  ensureVersionJson,
  ensureLibraries,
  getAllowedLibraries,
  getLibraryArtifact,
} = require('./mojang');
const { pickJava, inferJavaMajor } = require('./java');
const { getSettings } = require('./store');

const mavenCache = new Map();
const MAVEN_CACHE_MS = 10 * 60 * 1000;

function parseMavenVersions(xml) {
  const versions = [];
  const regex = /<version>([^<]+)<\/version>/g;
  let match;
  while ((match = regex.exec(String(xml || '')))) versions.push(match[1].trim());
  return versions;
}

async function getMavenVersions(url) {
  const cached = mavenCache.get(url);
  if (cached && Date.now() - cached.at < MAVEN_CACHE_MS) return cached.versions;
  const xml = await fetchText(url, { timeout: 30000 });
  const versions = parseMavenVersions(xml);
  mavenCache.set(url, { at: Date.now(), versions });
  return versions;
}

function versionSortKey(value) {
  return String(value)
    .split(/[.-]/)
    .map((part) => Number(part) || 0)
    .slice(0, 8);
}

function compareVersions(a, b) {
  const ka = versionSortKey(a);
  const kb = versionSortKey(b);
  for (let i = 0; i < Math.max(ka.length, kb.length); i += 1) {
    const diff = (kb[i] || 0) - (ka[i] || 0);
    if (diff) return diff;
  }
  return String(b).localeCompare(String(a));
}

function encode(value) {
  return encodeURIComponent(value);
}

async function listFabricVersions(mcVersion) {
  const data = await fetchJson(`https://meta.fabricmc.net/v2/versions/loader/${encode(mcVersion)}`, { timeout: 30000 });
  if (!Array.isArray(data)) return [];
  return data
    .map((entry) => ({
      version: entry.loader?.version,
      fullVersion: entry.loader?.version,
      stable: entry.loader?.stable !== false,
      type: 'fabric',
    }))
    .filter((entry) => entry.version);
}

async function listQuiltVersions(mcVersion) {
  const data = await fetchJson(`https://meta.quiltmc.org/v3/versions/loader/${encode(mcVersion)}`, { timeout: 30000 });
  if (!Array.isArray(data)) return [];
  return data
    .map((entry) => ({
      version: entry.loader?.version,
      fullVersion: entry.loader?.version,
      stable: entry.loader?.stable !== false,
      type: 'quilt',
    }))
    .filter((entry) => entry.version);
}

async function listForgeVersions(mcVersion) {
  const metadataUrl = 'https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml';
  const all = await getMavenVersions(metadataUrl);
  const prefix = `${mcVersion}-`;
  const matching = all.filter((version) => version.startsWith(prefix));
  let recommended = null;
  let latest = null;
  try {
    const promos = await fetchJson('https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json', {
      timeout: 20000,
    });
    recommended = promos?.promos?.[`${mcVersion}-recommended`] || null;
    latest = promos?.promos?.[`${mcVersion}-latest`] || null;
  } catch {
    /* promotions are optional */
  }
  const mapped = matching.map((fullVersion) => {
    const version = fullVersion.slice(prefix.length);
    return {
      version,
      fullVersion,
      stable: version === recommended || version === latest || !/-/.test(version),
      recommended: version === recommended,
      latest: version === latest,
      type: 'forge',
    };
  });
  mapped.sort((a, b) => compareVersions(a.version, b.version));
  return mapped;
}

function neoForgePrefix(mcVersion) {
  const parts = String(mcVersion).split('.').map(Number);
  if (parts[0] === 1 && parts.length >= 2) {
    const minor = parts[1];
    const patch = parts[2] || 0;
    if (minor === 20 && patch === 1) return { legacy: true, prefix: `${mcVersion}-` };
    return { legacy: false, prefix: `${minor}.${patch}.` };
  }
  if (parts.length >= 2) return { legacy: false, prefix: `${parts[0]}.${parts[1]}.` };
  return { legacy: false, prefix: `${mcVersion}.` };
}

async function listNeoForgeVersions(mcVersion) {
  const mapping = neoForgePrefix(mcVersion);
  if (mapping.legacy) {
    const all = await getMavenVersions('https://maven.neoforged.net/releases/net/neoforged/forge/maven-metadata.xml');
    const matching = all.filter((version) => version.startsWith(mapping.prefix));
    return matching
      .map((fullVersion) => ({
        version: fullVersion.slice(mapping.prefix.length),
        fullVersion,
        stable: true,
        type: 'neoforge',
        legacy: true,
      }))
      .sort((a, b) => compareVersions(a.version, b.version));
  }
  const all = await getMavenVersions('https://maven.neoforged.net/releases/net/neoforged/neoforge/maven-metadata.xml');
  return all
    .filter((version) => version.startsWith(mapping.prefix) && !version.includes('-beta'))
    .map((version) => ({
      version,
      fullVersion: version,
      stable: true,
      type: 'neoforge',
      legacy: false,
    }))
    .sort((a, b) => compareVersions(a.version, b.version));
}

async function listLiteLoaderVersions(mcVersion) {
  try {
    const data = await fetchJson('https://dl.liteloader.com/versions/versions.json', { timeout: 20000 });
    const entry = data?.versions?.[mcVersion];
    if (!entry) return [];
    return Object.keys(entry).map((version) => ({
      version,
      fullVersion: version,
      stable: true,
      type: 'liteloader',
      unsupported: true,
    }));
  } catch {
    return [];
  }
}

async function listLoaderVersions(mcVersion, type = 'vanilla') {
  switch (type) {
    case 'vanilla':
      return [{ version: mcVersion, fullVersion: mcVersion, stable: true, type: 'vanilla' }];
    case 'fabric':
      return listFabricVersions(mcVersion);
    case 'quilt':
      return listQuiltVersions(mcVersion);
    case 'forge':
      return listForgeVersions(mcVersion);
    case 'neoforge':
      return listNeoForgeVersions(mcVersion);
    case 'liteloader':
      return listLiteLoaderVersions(mcVersion);
    default:
      throw new Error(`Mod loader desconhecido: ${type}`);
  }
}

async function installFabricLike(instance, job, options = {}) {
  const mcVersion = instance.version;
  const type = instance.loader.type;
  let loaderVersion = options.version;
  if (!loaderVersion) {
    const versions = await listLoaderVersions(mcVersion, type);
    const stable = versions.find((entry) => entry.stable) || versions[0];
    if (!stable) throw new Error(`Não há versões ${type} compatíveis com ${mcVersion}.`);
    loaderVersion = stable.version;
  }
  job?.setStage(type === 'fabric' ? 'Fabric' : 'Quilt', `A obter perfil ${type} ${loaderVersion}...`);
  const base =
    type === 'fabric'
      ? `https://meta.fabricmc.net/v2/versions/loader/${encode(mcVersion)}/${encode(loaderVersion)}/profile/json`
      : `https://meta.quiltmc.org/v3/versions/loader/${encode(mcVersion)}/${encode(loaderVersion)}/profile/json`;
  const profile = await fetchJson(base, { timeout: 30000 });
  if (!profile?.id || !profile?.mainClass) throw new Error(`Perfil ${type} inválido.`);
  const dir = path.join(VERSIONS, profile.id);
  ensureDir(dir);
  writeJson(path.join(dir, `${profile.id}.json`), profile);
  const libraries = getAllowedLibraries(profile, {});
  const tasks = new Map();
  for (const lib of libraries) {
    const artifact = getLibraryArtifact(lib);
    if (!artifact) continue;
    const dest = path.join(LIBRARIES, artifact.path);
    if (!tasks.has(dest)) {
      tasks.set(dest, {
        url: artifact.url,
        dest,
        sha1: artifact.sha1,
        size: artifact.size,
        label: lib.name,
      });
    }
  }
  job?.setStage(type === 'fabric' ? 'Fabric' : 'Quilt', `A descarregar ${tasks.size} bibliotecas...`);
  await downloadMany([...tasks.values()], {
    concurrency: getSettings().parallelDownloads || 8,
    job,
  });
  return {
    versionId: profile.id,
    loaderVersion,
    profile,
  };
}

function writeLauncherProfiles(dir) {
  ensureDir(dir);
  const file = path.join(dir, 'launcher_profiles.json');
  if (!fileExists(file)) {
    writeJson(file, {
      profiles: {},
      settings: {},
      version: 3,
    });
  }
  return file;
}

async function copyDirMerge(source, target) {
  if (!fs.existsSync(source)) return 0;
  ensureDir(target);
  let count = 0;
  const entries = await fsp.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) {
      count += await copyDirMerge(from, to);
    } else if (entry.isFile()) {
      ensureDir(path.dirname(to));
      await fsp.copyFile(from, to);
      count += 1;
    }
    if (count % 200 === 0) await new Promise((resolve) => setImmediate(resolve));
  }
  return count;
}

function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || GAME,
      env: { ...process.env, ...(options.env || {}) },
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    let lastLine = '';
    const timeout = setTimeout(() => {
      try {
        child.kill();
      } catch {
        /* ignore */
      }
      reject(new Error('O instalador demorou demasiado tempo.'));
    }, options.timeout || 20 * 60 * 1000);
    const onData = (chunk) => {
      const text = chunk.toString();
      output += text;
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length) {
        lastLine = lines[lines.length - 1];
        if (options.onLine) options.onLine(lastLine);
      }
      if (output.length > 200000) output = output.slice(-100000);
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) resolve({ code, output, lastLine });
      else reject(new Error(`O instalador terminou com código ${code}. ${lastLine || ''}`.trim()));
    });
  });
}

async function installForgeLike(instance, job, options = {}) {
  const mcVersion = instance.version;
  const type = instance.loader.type;
  const isNeo = type === 'neoforge';
  let fullVersion = options.version;
  let installerUrl;
  if (!fullVersion) {
    const versions = await listLoaderVersions(mcVersion, type);
    const chosen = versions.find((entry) => entry.recommended || entry.latest) || versions[0];
    if (!chosen) throw new Error(`Não há versões ${isNeo ? 'NeoForge' : 'Forge'} para ${mcVersion}.`);
    fullVersion = chosen.fullVersion;
  }
  if (isNeo) {
    if (String(fullVersion).startsWith(`${mcVersion}-`)) {
      installerUrl = `https://maven.neoforged.net/releases/net/neoforged/forge/${fullVersion}/forge-${fullVersion}-installer.jar`;
    } else {
      installerUrl = `https://maven.neoforged.net/releases/net/neoforged/neoforge/${fullVersion}/neoforge-${fullVersion}-installer.jar`;
    }
  } else {
    if (!String(fullVersion).startsWith(`${mcVersion}-`)) fullVersion = `${mcVersion}-${fullVersion}`;
    installerUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${fullVersion}/forge-${fullVersion}-installer.jar`;
  }

  const vanilla = await ensureVersionJson(mcVersion);
  const javaInfo = await pickJava(inferJavaMajor(vanilla.meta), getSettings(), job);
  const work = path.join(TEMP, `${isNeo ? 'neoforge' : 'forge'}-${randomId(4)}`);
  const installerPath = path.join(work, 'installer.jar');
  const fakeAppData = path.join(work, 'appdata');
  const fakeMc = path.join(fakeAppData, '.minecraft');
  ensureDir(work);
  ensureDir(fakeMc);
  writeLauncherProfiles(fakeMc);
  writeLauncherProfiles(GAME);
  job?.setStage(isNeo ? 'NeoForge' : 'Forge', `A descarregar instalador ${fullVersion}...`);
  await downloadFile(
    { url: installerUrl, dest: installerPath, label: `Instalador ${isNeo ? 'NeoForge' : 'Forge'}` },
    {
      timeout: 120000,
      onBytes: (bytes) => job?.addBytes(bytes),
      onTotal: (total) => job?.setBytesTotal(total),
    },
  );

  const beforeVersions = new Set(fs.readdirSync(VERSIONS));
  job?.setStage(isNeo ? 'NeoForge' : 'Forge', 'A executar o instalador (pode demorar vários minutos)...');
  const args = ['-jar', installerPath, '--installClient', GAME];
  await runProcess(javaInfo.path, args, {
    cwd: fakeMc,
    env: { APPDATA: fakeAppData, HOME: fakeAppData, USERPROFILE: fakeAppData },
    timeout: 25 * 60 * 1000,
    onLine: (line) => {
      if (line.length < 240) job?.setDetail(line);
    },
  });

  // Some installers ignore the path argument and use APPDATA/.minecraft.
  if (fs.existsSync(path.join(fakeMc, 'libraries'))) {
    job?.setStage(isNeo ? 'NeoForge' : 'Forge', 'A integrar bibliotecas do instalador...');
    await copyDirMerge(path.join(fakeMc, 'libraries'), LIBRARIES);
  }
  if (fs.existsSync(path.join(fakeMc, 'versions'))) {
    const fakeVersions = fs.readdirSync(path.join(fakeMc, 'versions'));
    for (const name of fakeVersions) {
      await copyDirMerge(path.join(fakeMc, 'versions', name), path.join(VERSIONS, name));
    }
  }

  const candidates = [];
  for (const name of fs.readdirSync(VERSIONS)) {
    const jsonPath = path.join(VERSIONS, name, `${name}.json`);
    if (!fileExists(jsonPath)) continue;
    const json = readJson(jsonPath);
    if (!json) continue;
    if (json.inheritsFrom === mcVersion && name !== mcVersion) {
      const isLoaderName = /forge|neoforge/i.test(name);
      if (isLoaderName || !beforeVersions.has(name)) {
        candidates.push({ id: name, json, mtime: fs.statSync(jsonPath).mtimeMs });
      }
    }
  }
  // Launcher profiles are the most reliable source for the generated version id.
  for (const profilePath of [path.join(GAME, 'launcher_profiles.json'), path.join(fakeMc, 'launcher_profiles.json')]) {
    const profiles = readJson(profilePath);
    for (const profile of Object.values(profiles?.profiles || {})) {
      const id = profile?.lastVersionId;
      if (!id || id === mcVersion) continue;
      if (!candidates.some((candidate) => candidate.id === id) && fileExists(path.join(VERSIONS, id, `${id}.json`))) {
        candidates.push({ id, json: readJson(path.join(VERSIONS, id, `${id}.json`)), mtime: Date.now() });
      }
    }
  }
  candidates.sort((a, b) => b.mtime - a.mtime);
  if (!candidates.length) {
    throw new Error(
      'O instalador terminou, mas não foi possível localizar a versão gerada. Verifica os logs e tenta novamente.',
    );
  }
  const selected = candidates[0];
  job?.setStage(isNeo ? 'NeoForge' : 'Forge', `Instalado: ${selected.id}`);
  try {
    fs.rmSync(work, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  return {
    versionId: selected.id,
    loaderVersion: fullVersion,
    profile: selected.json,
  };
}

async function installLoader(instance, job, options = {}) {
  const type = instance.loader?.type || 'vanilla';
  if (type === 'vanilla') return { versionId: instance.version, loaderVersion: null };
  if (type === 'liteloader') {
    throw new Error(
      'LiteLoader é experimental e não é instalado automaticamente nesta versão do MineSphere. Usa Forge numa versão antiga ou instala o LiteLoader manualmente.',
    );
  }
  if (type === 'fabric' || type === 'quilt') return installFabricLike(instance, job, options);
  if (type === 'forge' || type === 'neoforge') return installForgeLike(instance, job, options);
  throw new Error(`Mod loader não suportado: ${type}`);
}

function loaderLabel(type) {
  const labels = {
    vanilla: 'Vanilla',
    fabric: 'Fabric',
    quilt: 'Quilt',
    forge: 'Forge',
    neoforge: 'NeoForge',
    liteloader: 'LiteLoader',
  };
  return labels[type] || type;
}

module.exports = {
  listLoaderVersions,
  installLoader,
  loaderLabel,
  listFabricVersions,
  listQuiltVersions,
  listForgeVersions,
  listNeoForgeVersions,
  listLiteLoaderVersions,
  parseMavenVersions,
  neoForgePrefix,
};
