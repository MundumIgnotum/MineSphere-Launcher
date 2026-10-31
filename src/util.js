'use strict';

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');
const { once } = require('events');

const USER_AGENT = 'MineSphereLauncher/1.0.0 (MineSphere; +https://localhost)';
const IS_WINDOWS = process.platform === 'win32';
const OS_NAME = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'osx' : 'linux';
const ARCH_NAME = process.arch === 'x64' ? 'x86_64' : process.arch === 'ia32' ? 'x86' : process.arch;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function ensureDirAsync(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

function fileExists(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

function dirExists(dir) {
  try {
    return fs.statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

function removeFile(file) {
  try {
    fs.rmSync(file, { force: true });
  } catch {
    /* ignore */
  }
}

function sha1Buffer(buffer) {
  return crypto.createHash('sha1').update(buffer).digest('hex');
}

function sha256Buffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function sha512Buffer(buffer) {
  return crypto.createHash('sha512').update(buffer).digest('hex');
}

async function hashFile(file, algorithm = 'sha1') {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm);
    const stream = fs.createReadStream(file);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function sha1File(file) {
  return hashFile(file, 'sha1');
}

function md5Buffer(buffer) {
  return crypto.createHash('md5').update(buffer).digest();
}

function offlineUuid(name) {
  const hash = md5Buffer(Buffer.from(`OfflinePlayer:${name}`, 'utf8'));
  hash[6] = (hash[6] & 0x0f) | 0x30;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  return hash.toString('hex');
}

function randomId(bytes = 8) {
  return crypto.randomBytes(bytes).toString('hex');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(2)} GB`;
}

function sanitizeFilename(name, fallback = 'ficheiro') {
  const cleaned = String(name || '')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\.+$/g, '')
    .trim();
  return cleaned.slice(0, 180) || fallback;
}

function safeJoin(base, relative) {
  const root = path.resolve(base);
  const target = path.resolve(root, relative);
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error('Caminho de ficheiro inválido.');
  }
  return target;
}

function mavenToPath(name) {
  let extension = 'jar';
  let coordinate = String(name || '');
  const at = coordinate.lastIndexOf('@');
  if (at !== -1) {
    extension = coordinate.slice(at + 1) || 'jar';
    coordinate = coordinate.slice(0, at);
  }
  const parts = coordinate.split(':');
  if (parts.length < 3) throw new Error(`Coordenada Maven inválida: ${name}`);
  const [group, artifact, version, classifier] = parts;
  const groupPath = group.replace(/\./g, '/');
  const file = `${artifact}-${version}${classifier ? `-${classifier}` : ''}.${extension}`;
  return `${groupPath}/${artifact}/${version}/${file}`;
}

function parseArgs(input) {
  const result = [];
  const regex = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match;
  while ((match = regex.exec(String(input || '')))) {
    result.push(match[1] ?? match[2] ?? match[3]);
  }
  return result;
}

function replaceVars(value, vars) {
  return String(value).replace(/\$\{([^}]+)\}/g, (full, key) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) return String(vars[key]);
    return full;
  });
}

function ruleMatches(rule, features = {}) {
  if (!rule || typeof rule !== 'object') return false;
  if (rule.os) {
    const os = rule.os;
    if (os.name && os.name !== OS_NAME) return false;
    if (os.arch && os.arch !== ARCH_NAME && !(os.arch === 'x86' && process.arch === 'ia32')) return false;
    if (os.version) {
      try {
        const version = process.getSystemVersion ? process.getSystemVersion() : '';
        if (!new RegExp(os.version).test(version)) return false;
      } catch {
        /* ignore malformed rule */
      }
    }
  }
  if (rule.features && typeof rule.features === 'object') {
    for (const [key, expected] of Object.entries(rule.features)) {
      if (Boolean(features[key]) !== Boolean(expected)) return false;
    }
  }
  return true;
}

function rulesAllow(rules, features = {}) {
  if (!Array.isArray(rules) || rules.length === 0) return true;
  let allowed = false;
  for (const rule of rules) {
    if (ruleMatches(rule, features)) allowed = rule.action === 'allow';
  }
  return allowed;
}

function resolveArgumentList(list, features = {}) {
  const out = [];
  if (!Array.isArray(list)) return out;
  for (const entry of list) {
    if (typeof entry === 'string') {
      out.push(entry);
      continue;
    }
    if (entry && typeof entry === 'object' && rulesAllow(entry.rules, features)) {
      if (Array.isArray(entry.value)) out.push(...entry.value.map(String));
      else if (entry.value !== undefined) out.push(String(entry.value));
    }
  }
  return out;
}

function normalizeUuid(uuid) {
  return String(uuid || '').replace(/-/g, '').toLowerCase();
}

function isUuid(value) {
  return /^[0-9a-f]{32}$/i.test(normalizeUuid(value));
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        ...options,
        headers: {
          'User-Agent': USER_AGENT,
          ...(options.headers || {}),
        },
        signal: options.signal || AbortSignal.timeout(options.timeout || 45000),
      });
      if (res.status === 429 || res.status >= 500) {
        const text = await res.text().catch(() => '');
        const error = new Error(`HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`);
        error.status = res.status;
        throw error;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const error = new Error(`HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`);
        error.status = res.status;
        error.body = text;
        throw error;
      }
      return res;
    } catch (error) {
      lastError = error;
      const status = Number(error.status);
      const retryable = !status || status === 429 || status >= 500;
      if (!retryable || attempt === retries) break;
      await sleep(Math.min(8000, 500 * 2 ** attempt) + Math.floor(Math.random() * 250));
    }
  }
  throw lastError;
}

async function fetchJson(url, options = {}) {
  const res = await fetchWithRetry(url, options);
  return res.json();
}

async function fetchText(url, options = {}) {
  const res = await fetchWithRetry(url, options);
  return res.text();
}

async function fetchBuffer(url, options = {}) {
  const res = await fetchWithRetry(url, options);
  return Buffer.from(await res.arrayBuffer());
}

async function postForm(url, params, options = {}) {
  const body = new URLSearchParams(params).toString();
  const res = await fetch(url, {
    method: 'POST',
    redirect: 'follow',
    ...options,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
      ...(options.headers || {}),
    },
    body,
    signal: options.signal || AbortSignal.timeout(options.timeout || 45000),
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

async function postJson(url, payload, options = {}) {
  const res = await fetch(url, {
    method: 'POST',
    redirect: 'follow',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
      ...(options.headers || {}),
    },
    body: JSON.stringify(payload),
    signal: options.signal || AbortSignal.timeout(options.timeout || 45000),
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

const activeDownloads = new Map();

async function replaceDownloadedFile(tmp, dest, sha1) {
  try {
    fs.renameSync(tmp, dest);
    return;
  } catch (error) {
    if (!['EEXIST', 'EPERM', 'EACCES', 'ENOTEMPTY'].includes(error.code)) throw error;
  }
  if (sha1 && fileExists(dest)) {
    try {
      if ((await sha1File(dest)) === sha1) {
        removeFile(tmp);
        return;
      }
    } catch {
      /* replace the unusable destination */
    }
  }
  removeFile(dest);
  fs.renameSync(tmp, dest);
}

async function downloadFileInner(task, opts = {}) {
  const { url, dest, sha1, size, label } = task;
  if (!url) throw new Error(`URL em falta para ${dest}`);
  if (!dest) throw new Error('Destino em falta para download.');

  if (sha1 && fileExists(dest)) {
    try {
      if ((await sha1File(dest)) === sha1) {
        if (opts.onSkip) opts.onSkip(task);
        return { skipped: true, bytes: size || 0 };
      }
    } catch {
      /* redownload */
    }
  } else if (!sha1 && fileExists(dest) && fs.statSync(dest).size > 0) {
    if (opts.onSkip) opts.onSkip(task);
    return { skipped: true, bytes: fs.statSync(dest).size };
  }

  ensureDir(path.dirname(dest));
  const retries = opts.retries ?? 3;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const tmp = `${dest}.part-${process.pid}-${randomId(6)}`;
    let writeStream;
    try {
      const res = await fetchWithRetry(url, { timeout: opts.timeout || 120000 }, 0);
      writeStream = fs.createWriteStream(tmp, { flags: 'wx' });
      let received = 0;
      const contentLength = Number(res.headers.get('content-length')) || 0;
      if (contentLength && opts.onTotal) opts.onTotal(contentLength);
      for await (const chunk of res.body) {
        const buffer = Buffer.from(chunk);
        received += buffer.length;
        if (!writeStream.write(buffer)) await once(writeStream, 'drain');
        if (opts.onBytes) opts.onBytes(buffer.length);
      }
      await new Promise((resolve, reject) => {
        writeStream.once('error', reject);
        writeStream.end(() => resolve());
      });
      writeStream = null;

      if (sha1) {
        const actual = await sha1File(tmp);
        if (actual !== sha1) {
          throw new Error(`Verificação SHA-1 falhou para ${label || path.basename(dest)}.`);
        }
      }
      if (size && fs.statSync(tmp).size !== size) {
        // Size is only a warning; some servers re-compress. Keep the verified file.
      }
      await replaceDownloadedFile(tmp, dest, sha1);
      return { skipped: false, bytes: received };
    } catch (error) {
      lastError = error;
      if (writeStream) {
        try {
          writeStream.destroy();
        } catch {
          /* ignore */
        }
      }
      removeFile(tmp);
      const status = Number(error.status);
      const retryable = !status || status === 429 || status >= 500 || /SHA-1|aborted|ECONN|socket/i.test(error.message);
      if (!retryable || attempt === retries) break;
      await sleep(500 * 2 ** attempt);
    }
  }
  throw new Error(`Falha ao descarregar ${label || path.basename(dest)}: ${lastError?.message || 'erro desconhecido'}`);
}

/**
 * Downloads one file to a destination, verifying a sha1 hash when provided.
 * Existing files that already match the hash are skipped. Concurrent requests
 * for the same destination share one download instead of corrupting each
 * other's temporary file.
 */
async function downloadFile(task, opts = {}) {
  const { dest, sha1 } = task;
  if (!dest) throw new Error('Destino em falta para download.');
  const key = path.resolve(dest);
  const active = activeDownloads.get(key);
  if (active) {
    await active;
    if (sha1 && fileExists(dest)) {
      try {
        if ((await sha1File(dest)) !== sha1) {
          throw new Error(`Verificação SHA-1 falhou para ${task.label || path.basename(dest)}.`);
        }
      } catch (error) {
        throw new Error(`Falha ao descarregar ${task.label || path.basename(dest)}: ${error.message}`);
      }
    }
    if (opts.onSkip) opts.onSkip(task);
    return { skipped: true, bytes: task.size || 0 };
  }
  const promise = downloadFileInner(task, opts);
  activeDownloads.set(key, promise);
  try {
    return await promise;
  } finally {
    if (activeDownloads.get(key) === promise) activeDownloads.delete(key);
  }
}

async function downloadMany(tasks, opts = {}) {
  const concurrency = Math.max(1, Math.min(32, Number(opts.concurrency) || 8));
  const job = opts.job;
  const total = tasks.length;
  if (job && typeof job.setFiles === 'function') job.setFiles(total);
  let completed = 0;
  let failed = 0;
  const errors = [];
  let index = 0;

  async function worker() {
    while (true) {
      const current = index;
      index += 1;
      if (current >= tasks.length) return;
      const task = tasks[current];
      try {
        await downloadFile(task, {
          ...opts,
          onBytes: (bytes) => {
            if (job && typeof job.addBytes === 'function') job.addBytes(bytes);
            if (opts.onBytes) opts.onBytes(bytes);
          },
          onSkip: (t) => {
            if (job && typeof job.addSkipped === 'function') job.addSkipped(t);
            if (opts.onSkip) opts.onSkip(t);
          },
        });
      } catch (error) {
        failed += 1;
        errors.push(error);
        if (job && typeof job.warn === 'function') job.warn(error.message);
        if (opts.failFast) throw error;
      } finally {
        completed += 1;
        if (job && typeof job.fileDone === 'function') job.fileDone();
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, Math.max(1, total)) }, () => worker());
  await Promise.all(workers);
  if (errors.length) {
    const sample = errors.slice(0, 3).map((error) => error.message).join(' | ');
    throw new Error(`${failed} download(s) falharam. ${sample}`);
  }
  return { total, failed };
}

async function runPool(items, concurrency, worker) {
  const queue = [...items];
  let index = 0;
  async function runner() {
    while (true) {
      const current = index;
      index += 1;
      if (current >= queue.length) return;
      await worker(queue[current], current);
    }
  }
  await Promise.all(Array.from({ length: Math.min(Math.max(1, concurrency), Math.max(1, queue.length)) }, () => runner()));
}

async function directorySize(dir) {
  let total = 0;
  async function walk(current) {
    let entries;
    try {
      entries = await fsp.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile()) {
        try {
          total += (await fsp.stat(full)).size;
        } catch {
          /* ignore */
        }
      }
    }
  }
  await walk(dir);
  return total;
}

async function listFilesRecursive(dir, base = dir, out = []) {
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await listFilesRecursive(full, base, out);
    else if (entry.isFile()) out.push(path.relative(base, full));
  }
  return out;
}

function parseJavaVersion(output) {
  const text = String(output || '');
  const modern = text.match(/version\s+"(\d+)(?:\.(\d+))?/i);
  if (modern) return Number(modern[1]);
  const legacy = text.match(/java version\s+"1\.(\d+)/i);
  if (legacy) return Number(legacy[1]);
  return 0;
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function truncate(text, length = 240) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

module.exports = {
  USER_AGENT,
  IS_WINDOWS,
  OS_NAME,
  ARCH_NAME,
  ensureDir,
  ensureDirAsync,
  fileExists,
  dirExists,
  readJson,
  writeJson,
  removeFile,
  sha1Buffer,
  sha256Buffer,
  sha512Buffer,
  hashFile,
  sha1File,
  md5Buffer,
  offlineUuid,
  randomId,
  sleep,
  formatBytes,
  sanitizeFilename,
  safeJoin,
  mavenToPath,
  parseArgs,
  replaceVars,
  ruleMatches,
  rulesAllow,
  resolveArgumentList,
  normalizeUuid,
  isUuid,
  fetchWithRetry,
  fetchJson,
  fetchText,
  fetchBuffer,
  postForm,
  postJson,
  downloadFile,
  downloadMany,
  runPool,
  directorySize,
  listFilesRecursive,
  parseJavaVersion,
  nowStamp,
  truncate,
};
