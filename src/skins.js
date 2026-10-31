'use strict';

const fs = require('fs');
const path = require('path');
const { SKINS } = require('./paths');
const { ensureDir, fileExists } = require('./util');
const { getAccount, getInstallations, upsertAccount } = require('./store');
const { ensureFreshAccount } = require('./auth');

const MC_SKIN_URL = 'https://api.minecraftservices.com/minecraft/profile/skins';
const MC_PROFILE_URL = 'https://api.minecraftservices.com/minecraft/profile';
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_SKIN_BYTES = 2 * 1024 * 1024;

function skinFile(accountId) {
  const id = String(accountId || '');
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('Identificador de conta inválido.');
  return path.join(SKINS, `${id}.png`);
}

function validatePng(buffer, options = {}) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 33) throw new Error('O ficheiro PNG está vazio ou é inválido.');
  if (buffer.length > MAX_SKIN_BYTES) throw new Error('A skin é demasiado grande (máximo 2 MB).');
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error('O ficheiro não é um PNG válido.');
  if (buffer.toString('ascii', 12, 16) !== 'IHDR') throw new Error('O cabeçalho do PNG é inválido.');
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width !== 64 || (height !== 64 && height !== 32)) {
    throw new Error('A skin tem de ter 64×64 pixels (ou 64×32 no formato antigo).');
  }
  if (options.official && height !== 64) {
    throw new Error('A Microsoft só aceita skins modernas de 64×64 pixels.');
  }
  return { width, height };
}

function defaultSkinUrl(account) {
  return account?.uuid ? `https://mc-heads.net/avatar/${account.uuid}/128` : null;
}

function localSkinUrl(accountId) {
  return `/api/accounts/${encodeURIComponent(accountId)}/skin/file?v=${Date.now()}`;
}

function readLocal(accountId) {
  const file = skinFile(accountId);
  return fileExists(file) ? fs.readFileSync(file) : null;
}

function writeLocal(accountId, buffer) {
  ensureDir(SKINS);
  const file = skinFile(accountId);
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, buffer);
  fs.renameSync(tmp, file);
  return file;
}

function removeLocalFile(accountId) {
  try {
    fs.rmSync(skinFile(accountId), { force: true });
  } catch {
    /* ignore */
  }
}

function safeName(name) {
  const cleaned = String(name || 'skin').replace(/[^a-zA-Z0-9_.-]/g, '_').replace(/^\.+$/, '_');
  return cleaned || 'skin';
}

function skinSyncFile(record, account) {
  return path.join(record.gameDir, 'CustomSkinLoader', 'LocalSkin', 'skins', `${safeName(account.name)}.png`);
}

function removeCustomSkinLoader(account) {
  let removed = 0;
  for (const record of getInstallations()) {
    if (!record.gameDir) continue;
    try {
      const file = skinSyncFile(record, account);
      if (fileExists(file)) {
        fs.rmSync(file, { force: true });
        removed += 1;
      }
    } catch {
      /* a broken instance must not block skin removal */
    }
  }
  return removed;
}

function syncCustomSkinLoader(account, buffer) {
  let copied = 0;
  for (const record of getInstallations()) {
    if (!record.gameDir) continue;
    try {
      const file = skinSyncFile(record, account);
      ensureDir(path.dirname(file));
      fs.writeFileSync(file, buffer);
      copied += 1;
    } catch {
      /* a broken instance must not block the skin upload */
    }
  }
  return copied;
}

function saveLocal(accountId, buffer, options = {}) {
  const account = getAccount(accountId);
  if (!account) throw new Error('Conta não encontrada.');
  if (account.type !== 'offline') {
    throw new Error('Contas Microsoft usam o envio oficial para a Minecraft Services.');
  }
  validatePng(buffer);
  const remoteSkinUrl = account.remoteSkinUrl
    || (account.skinSource === 'local' ? null : account.skinUrl)
    || defaultSkinUrl(account);
  writeLocal(account.id, buffer);
  const updated = upsertAccount({
    ...account,
    remoteSkinUrl,
    skinUrl: localSkinUrl(account.id),
    skinSource: 'local',
    hasLocalSkin: true,
  }, { activate: false });
  if (options.sync) syncCustomSkinLoader(account, buffer);
  else removeCustomSkinLoader(account);
  return updated;
}

function removeLocal(accountId) {
  const account = getAccount(accountId);
  if (!account) throw new Error('Conta não encontrada.');
  removeLocalFile(account.id);
  if (account.type === 'offline') removeCustomSkinLoader(account);
  const remoteSkinUrl = account.remoteSkinUrl || defaultSkinUrl(account);
  return upsertAccount({
    ...account,
    skinUrl: remoteSkinUrl,
    remoteSkinUrl,
    skinSource: 'remote',
    hasLocalSkin: false,
  }, { activate: false });
}

async function fetchProfile(accessToken) {
  const response = await fetch(MC_PROFILE_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'User-Agent': 'MineSphereLauncher/1.0.0',
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) return null;
  return response.json();
}

async function uploadOfficial(accountId, buffer, options = {}) {
  const account = getAccount(accountId);
  if (!account) throw new Error('Conta não encontrada.');
  if (account.type !== 'msa') throw new Error('Apenas contas Microsoft podem enviar skins oficiais.');
  validatePng(buffer, { official: true });
  const fresh = await ensureFreshAccount(account);
  if (!fresh?.accessToken) throw new Error('A conta não tem uma sessão Minecraft válida. Inicia sessão novamente.');

  const form = new FormData();
  form.append('variant', options.variant === 'slim' ? 'slim' : 'classic');
  form.append('file', new Blob([buffer], { type: 'image/png' }), 'skin.png');
  const response = await fetch(MC_SKIN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${fresh.accessToken}`,
      Accept: 'application/json',
      'User-Agent': 'MineSphereLauncher/1.0.0',
    },
    body: form,
    signal: AbortSignal.timeout(60000),
  });
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!response.ok) {
    const detail = data?.errorMessage || data?.error || data?.path || `HTTP ${response.status}`;
    throw new Error(`A Microsoft recusou a skin: ${detail}`);
  }

  const profile = await fetchProfile(fresh.accessToken);
  const skinUrl = profile?.skins?.[0]?.url || fresh.remoteSkinUrl || fresh.skinUrl || null;
  removeLocalFile(fresh.id);
  return upsertAccount({
    ...fresh,
    skinUrl,
    remoteSkinUrl: skinUrl,
    skinSource: 'remote',
    hasLocalSkin: false,
  }, { activate: false });
}

module.exports = {
  skinFile,
  validatePng,
  readLocal,
  saveLocal,
  removeLocal,
  removeLocalFile,
  removeCustomSkinLoader,
  syncCustomSkinLoader,
  uploadOfficial,
  defaultSkinUrl,
};
