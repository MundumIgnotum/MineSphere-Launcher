'use strict';

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { execFile } = require('child_process');
const {
  fileExists,
  ensureDir,
  readJson,
  writeJson,
  downloadFile,
  parseJavaVersion,
  randomId,
} = require('./util');
const { JAVA_DIR, TEMP } = require('./paths');
const { extractZip } = require('./zip');

let detectionCache = null;
let detectionCacheAt = 0;
const CACHE_MS = 30 * 1000;

function runJavaVersion(javaPath) {
  return new Promise((resolve) => {
    execFile(
      javaPath,
      ['-version'],
      { timeout: 7000, windowsHide: true, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        const output = `${stdout || ''}\n${stderr || ''}`.trim();
        if (error && !output) return resolve(null);
        const major = parseJavaVersion(output);
        if (!major) return resolve(null);
        resolve({
          path: javaPath,
          major,
          version: output.split(/\r?\n/)[0] || `Java ${major}`,
          is64Bit: /64-Bit/i.test(output) || process.arch !== 'x64',
          output,
        });
      },
    );
  });
}

function childDirs(root, depth = 0) {
  const out = [];
  let entries;
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const full = path.join(root, entry.name);
    out.push(full);
    if (depth < 1) out.push(...childDirs(full, depth + 1));
  }
  return out;
}

function findJavaInRoots() {
  const roots = new Set();
  const env = process.env;
  if (env.JAVA_HOME) roots.add(path.join(env.JAVA_HOME));
  if (env.LOCALAPPDATA) roots.add(path.join(env.LOCALAPPDATA, 'Programs', 'Eclipse Adoptium'));
  if (env.APPDATA) roots.add(path.join(env.APPDATA, '.minecraft', 'runtime'));
  if (env.USERPROFILE) roots.add(path.join(env.USERPROFILE, '.jdks'));
  roots.add('C:\\Program Files\\Java');
  roots.add('C:\\Program Files\\Eclipse Adoptium');
  roots.add('C:\\Program Files\\Microsoft');
  roots.add('C:\\Program Files\\BellSoft');
  roots.add('C:\\Program Files\\Zulu');
  roots.add('C:\\Program Files\\Amazon Corretto');
  roots.add('C:\\Program Files (x86)\\Minecraft Launcher\\runtime');
  roots.add(JAVA_DIR);

  const candidates = new Set();
  for (const root of roots) {
    const direct = path.join(root, 'bin', 'java.exe');
    if (fileExists(direct)) candidates.add(direct);
    for (const dir of childDirs(root, 0)) {
      const exe = path.join(dir, 'bin', 'java.exe');
      if (fileExists(exe)) candidates.add(exe);
    }
  }
  if (env.PATH) {
    for (const part of env.PATH.split(path.delimiter)) {
      const exe = path.join(part, 'java.exe');
      if (fileExists(exe)) candidates.add(exe);
    }
  }
  return [...candidates];
}

async function detectJava(force = false) {
  if (!force && detectionCache && Date.now() - detectionCacheAt < CACHE_MS) return detectionCache;
  const candidates = new Set(findJavaInRoots());
  const list = [];
  for (const candidate of candidates) {
    const info = await runJavaVersion(candidate);
    if (info && info.is64Bit) list.push(info);
  }
  const unique = [];
  const seen = new Set();
  for (const info of list.sort((a, b) => b.major - a.major || a.path.localeCompare(b.path))) {
    let key = info.path.toLowerCase();
    try {
      key = fs.realpathSync(info.path).toLowerCase();
    } catch {
      /* ignore */
    }
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({ ...info, path: path.normalize(info.path) });
  }
  detectionCache = unique;
  detectionCacheAt = Date.now();
  return unique;
}

function runtimeJavaPath(major) {
  return path.join(JAVA_DIR, String(major), 'bin', 'java.exe');
}

async function findRuntime(major) {
  const exe = runtimeJavaPath(major);
  if (fileExists(exe)) {
    const info = await runJavaVersion(exe);
    if (info) return info;
  }
  return null;
}

const javaInstalls = new Map();

function downloadJava(major, job) {
  const numeric = Number(major) || 21;
  const previous = javaInstalls.get(numeric) || Promise.resolve();
  const current = previous
    .catch(() => {})
    .then(() => downloadJavaUnlocked(numeric, job));
  javaInstalls.set(numeric, current);
  return current.finally(() => {
    if (javaInstalls.get(numeric) === current) javaInstalls.delete(numeric);
  });
}

async function downloadJavaUnlocked(numeric, job) {
  const existing = await findRuntime(numeric);
  if (existing) {
    job?.setStage('Java', `Java ${numeric} já está disponível.`);
    return existing;
  }
  const targetDir = path.join(JAVA_DIR, String(numeric));
  ensureDir(TEMP);
  const work = path.join(TEMP, `java-${numeric}-${randomId(4)}`);
  ensureDir(work);
  const zipPath = path.join(work, 'java.zip');
  const jobStage = (message) => job?.setStage('Java', message);

  const urls = [
    `https://api.adoptium.net/v3/binary/latest/${numeric}/ga/windows/x64/jre/hotspot/normal/eclipse?project=jdk`,
    `https://api.adoptium.net/v3/binary/latest/${numeric}/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk`,
  ];
  let lastError = null;
  for (const url of urls) {
    try {
      jobStage(`A descarregar Java ${numeric} (Temurin)...`);
      await downloadFile(
        { url, dest: zipPath, label: `Java ${numeric}` },
        {
          timeout: 180000,
          onBytes: (bytes) => job?.addBytes(bytes),
          onTotal: (total) => job?.setBytesTotal(total),
        },
      );
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      try {
        fs.rmSync(zipPath, { force: true });
      } catch {
        /* ignore */
      }
    }
  }
  if (lastError) throw new Error(`Não foi possível descarregar o Java ${numeric}: ${lastError.message}`);

  jobStage('A extrair Java...');
  const zipBuffer = await fsp.readFile(zipPath);
  const extractDir = path.join(work, 'extract');
  ensureDir(extractDir);
  await extractZip(zipBuffer, extractDir);
  let javaExe = null;
  async function findExe(dir, depth = 0) {
    if (javaExe || depth > 3) return;
    const entries = await fsp.readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isFile() && entry.name.toLowerCase() === 'java.exe') {
        javaExe = full;
        return;
      }
      if (entry.isDirectory()) await findExe(full, depth + 1);
      if (javaExe) return;
    }
  }
  await findExe(extractDir);
  if (!javaExe) throw new Error('O pacote de Java não contém bin/java.exe.');
  const detected = await runJavaVersion(javaExe);
  if (!detected) throw new Error('O Java descarregado não é executável.');
  const root = path.resolve(javaExe, '..', '..');
  try {
    fs.rmSync(targetDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  ensureDir(path.dirname(targetDir));
  try {
    fs.renameSync(root, targetDir);
  } catch {
    await fsp.cp(root, targetDir, { recursive: true, force: true });
  }
  try {
    fs.rmSync(work, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  detectionCache = null;
  const info = await runJavaVersion(runtimeJavaPath(numeric));
  if (!info) throw new Error('Falha ao preparar o Java descarregado.');
  return info;
}

function inferJavaMajor(meta) {
  if (meta?.javaVersion?.majorVersion) return Number(meta.javaVersion.majorVersion);
  const id = String(meta?.id || '');
  const match = id.match(/^1\.(\d+)(?:\.(\d+))?/);
  if (match) {
    const minor = Number(match[1]);
    const patch = Number(match[2] || 0);
    if (minor >= 20 && patch >= 5) return 21;
    if (minor >= 18) return 17;
    if (minor === 17) return 16;
    return 8;
  }
  const modern = id.match(/^(\d+)\.(\d+)/);
  if (modern && Number(modern[1]) >= 26) return 21;
  return 21;
}

async function pickJava(major, settings, job) {
  const requested = Number(major) || 21;
  const custom = settings?.javaPath && settings.javaPath !== 'auto' ? settings.javaPath : null;
  if (custom && fileExists(custom)) {
    const info = await runJavaVersion(custom);
    if (info) return info;
  }
  const detected = await detectJava();
  const exact = detected.find((info) => info.major === requested);
  if (exact) return exact;
  const runtime = await findRuntime(requested);
  if (runtime) return runtime;
  if (settings?.autoDownloadJava !== false) {
    job?.setStage('Java', `Java ${requested} não encontrado. A descarregar automaticamente...`);
    return downloadJava(requested, job);
  }
  const available = detected.map((info) => info.major).join(', ') || 'nenhum';
  throw new Error(`Java ${requested} não encontrado. Instala o Java ${requested} ou ativa o download automático nas definições. (Detetado: ${available})`);
}

function getJavaStatus() {
  const detected = detectionCache || [];
  return {
    detected,
    runtime: fs.existsSync(JAVA_DIR) ? fs.readdirSync(JAVA_DIR).filter((name) => /^\d+$/.test(name)) : [],
  };
}

module.exports = {
  detectJava,
  runJavaVersion,
  downloadJava,
  pickJava,
  inferJavaMajor,
  getJavaStatus,
  runtimeJavaPath,
  findRuntime,
};
