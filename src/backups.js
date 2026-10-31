'use strict';

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { spawn } = require('child_process');
const {
  ensureDir,
  fileExists,
  nowStamp,
  sanitizeFilename,
} = require('./util');
const { createZip, createZipFromDirectory } = require('./zip');
const { instanceDir } = require('./paths');

function gameDirFor(instance) {
  return instance.gameDir || instanceDir(instance.id);
}

function backupsDir(instance) {
  return path.join(gameDirFor(instance), 'backups');
}

function savesDir(instance) {
  return path.join(gameDirFor(instance), 'saves');
}

function quotePowerShell(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function runPowerShell(script, timeout = 10 * 60 * 1000) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
      { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let output = '';
    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {
        /* ignore */
      }
      reject(new Error('A operação de backup demorou demasiado tempo.'));
    }, timeout);
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(output);
      else reject(new Error(`Backup falhou (código ${code}): ${output.slice(-500)}`));
    });
  });
}

function hasSaves(instance) {
  try {
    return fs.readdirSync(savesDir(instance)).length > 0;
  } catch {
    return false;
  }
}

async function createBackup(instance, job, options = {}) {
  const dir = backupsDir(instance);
  ensureDir(dir);
  const prefix = options.prefix || 'mundos';
  const fileName = `${prefix}-${nowStamp()}.zip`;
  const dest = path.join(dir, fileName);
  job?.setStage('Backup', 'A criar backup dos mundos...');
  if (!hasSaves(instance)) {
    await fsp.writeFile(dest, createZip([]));
    return { fileName, size: fs.statSync(dest).size, createdAt: new Date().toISOString() };
  }
  if (process.platform === 'win32') {
    const script = [
      `$src = ${quotePowerShell(savesDir(instance))}`,
      `$dst = ${quotePowerShell(dest)}`,
      'if (Test-Path -LiteralPath $dst) { Remove-Item -LiteralPath $dst -Force }',
      'Compress-Archive -Path (Join-Path $src "*") -DestinationPath $dst -CompressionLevel Optimal -Force',
      'if (-not (Test-Path -LiteralPath $dst)) { throw "Backup não criado" }',
    ].join('; ');
    await runPowerShell(script);
  } else {
    const buffer = await createZipFromDirectory(savesDir(instance));
    await fsp.writeFile(dest, buffer);
  }
  const stat = await fsp.stat(dest);
  job?.setDetail(`Backup criado: ${fileName} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
  return { fileName, size: stat.size, createdAt: new Date().toISOString() };
}

function listBackups(instance) {
  const dir = backupsDir(instance);
  let files = [];
  try {
    files = fs.readdirSync(dir);
  } catch {
    return [];
  }
  return files
    .filter((name) => name.toLowerCase().endsWith('.zip'))
    .map((name) => {
      const full = path.join(dir, name);
      let stat = null;
      try {
        stat = fs.statSync(full);
      } catch {
        /* ignore */
      }
      return {
        fileName: name,
        size: stat?.size || 0,
        createdAt: stat?.mtime?.toISOString() || null,
        mtime: stat?.mtimeMs || 0,
      };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

async function restoreBackup(instance, fileName, job) {
  const safe = path.basename(String(fileName || ''));
  if (!/^[A-Za-z0-9._-]+\.zip$/i.test(safe)) throw new Error('Nome de backup inválido.');
  const source = path.join(backupsDir(instance), safe);
  if (!fileExists(source)) throw new Error('Backup não encontrado.');
  const saves = savesDir(instance);
  ensureDir(saves);
  job?.setStage('Backup', 'A criar backup de segurança antes de restaurar...');
  await createBackup(instance, job, { prefix: 'antes-restauro' }).catch(() => null);
  job?.setStage('Backup', 'A restaurar mundos...');
  if (process.platform === 'win32') {
    const script = [
      `$src = ${quotePowerShell(source)}`,
      `$dst = ${quotePowerShell(saves)}`,
      'Expand-Archive -LiteralPath $src -DestinationPath $dst -Force',
    ].join('; ');
    await runPowerShell(script);
  } else {
    const buffer = await fsp.readFile(source);
    const { extractZip } = require('./zip');
    await extractZip(buffer, saves);
  }
  job?.setDetail('Backup restaurado.');
  return { fileName: safe, restoredAt: new Date().toISOString() };
}

function deleteBackup(instance, fileName) {
  const safe = path.basename(String(fileName || ''));
  if (!/^[A-Za-z0-9._-]+\.zip$/i.test(safe)) throw new Error('Nome de backup inválido.');
  const target = path.join(backupsDir(instance), safe);
  if (!fileExists(target)) throw new Error('Backup não encontrado.');
  fs.rmSync(target, { force: true });
  return true;
}

async function pruneBackups(instance, limit = 5) {
  const backups = listBackups(instance);
  const max = Math.max(1, Number(limit) || 5);
  const toDelete = backups.slice(max);
  for (const backup of toDelete) {
    try {
      fs.rmSync(path.join(backupsDir(instance), backup.fileName), { force: true });
    } catch {
      /* ignore */
    }
  }
  return toDelete.map((backup) => backup.fileName);
}

function listScreenshots(instance) {
  const dir = path.join(gameDirFor(instance), 'screenshots');
  let files = [];
  try {
    files = fs.readdirSync(dir);
  } catch {
    return [];
  }
  return files
    .filter((name) => /\.(png|jpe?g|webp)$/i.test(name))
    .map((name) => {
      const full = path.join(dir, name);
      let stat = null;
      try {
        stat = fs.statSync(full);
      } catch {
        /* ignore */
      }
      return {
        fileName: name,
        size: stat?.size || 0,
        createdAt: stat?.mtime?.toISOString() || null,
        mtime: stat?.mtimeMs || 0,
        url: `/api/instances/${encodeURIComponent(instance.id)}/screenshots/${encodeURIComponent(name)}`,
      };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

function deleteScreenshot(instance, fileName) {
  const safe = sanitizeFilename(String(fileName || ''), '');
  if (!safe) throw new Error('Nome inválido.');
  const target = path.join(gameDirFor(instance), 'screenshots', safe);
  if (!fileExists(target)) throw new Error('Captura não encontrada.');
  fs.rmSync(target, { force: true });
  return true;
}

module.exports = {
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup,
  pruneBackups,
  listScreenshots,
  deleteScreenshot,
  backupsDir,
  savesDir,
};
