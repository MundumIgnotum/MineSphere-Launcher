'use strict';

const path = require('path');
const { randomId, readJson, writeJson, normalizeUuid } = require('./util');
const {
  SETTINGS_FILE,
  ACCOUNTS_FILE,
  INSTALLATIONS_FILE,
  instanceDir,
} = require('./paths');

const DEFAULT_SETTINGS = {
  theme: 'dark',
  accentColor: '#39d99f',
  accentColor2: '#38bdf8',
  streamerMode: false,
  ramMb: 4096,
  minRamMb: 1024,
  jvmArgs:
    '-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch',
  javaPath: 'auto',
  autoDownloadJava: true,
  parallelDownloads: 8,
  autoBackup: true,
  backupLimit: 5,
  autoUpdateMods: false,
  curseforgeKey: '',
  microsoftClientId: '00000000402b5328',
  syncFolder: '',
  lastInstanceId: null,
  closeOnLaunch: false,
  showSnapshots: true,
  offlineSkinPrompt: true,
  resolutionWidth: 0,
  resolutionHeight: 0,
};

let settingsCache = null;
let accountsCache = null;
let installationsCache = null;

function getSettings() {
  if (settingsCache) return settingsCache;
  const stored = readJson(SETTINGS_FILE, {});
  settingsCache = { ...DEFAULT_SETTINGS, ...(stored && typeof stored === 'object' ? stored : {}) };
  return settingsCache;
}

function normalizeHexColor(value, fallback) {
  const text = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(text) ? text.toLowerCase() : fallback;
}

function saveSettings(patch) {
  const current = getSettings();
  const next = { ...current, ...(patch && typeof patch === 'object' ? patch : {}) };
  next.ramMb = Math.max(512, Math.min(65536, Number(next.ramMb) || DEFAULT_SETTINGS.ramMb));
  next.minRamMb = Math.max(256, Math.min(next.ramMb, Number(next.minRamMb) || DEFAULT_SETTINGS.minRamMb));
  next.parallelDownloads = Math.max(1, Math.min(32, Number(next.parallelDownloads) || 8));
  next.backupLimit = Math.max(1, Math.min(50, Number(next.backupLimit) || 5));
  next.theme = next.theme === 'light' ? 'light' : 'dark';
  next.accentColor = normalizeHexColor(next.accentColor, DEFAULT_SETTINGS.accentColor);
  next.accentColor2 = normalizeHexColor(next.accentColor2, DEFAULT_SETTINGS.accentColor2);
  next.streamerMode = Boolean(next.streamerMode);
  next.offlineSkinPrompt = next.offlineSkinPrompt !== false;
  delete next.accent;
  settingsCache = next;
  writeJson(SETTINGS_FILE, next);
  return next;
}

function getAccountsStore() {
  if (accountsCache) return accountsCache;
  const stored = readJson(ACCOUNTS_FILE, {});
  accountsCache = {
    accounts: Array.isArray(stored.accounts) ? stored.accounts : [],
    activeId: stored.activeId || null,
  };
  return accountsCache;
}

function saveAccountsStore() {
  writeJson(ACCOUNTS_FILE, accountsCache);
}

function publicAccount(account) {
  if (!account) return null;
  return {
    id: account.id,
    type: account.type,
    name: account.name,
    uuid: account.uuid,
    expiresAt: account.expiresAt || null,
    skinUrl: account.skinUrl || null,
    remoteSkinUrl: account.remoteSkinUrl || null,
    skinSource: account.skinSource === 'local' ? 'local' : 'remote',
    hasLocalSkin: Boolean(account.hasLocalSkin),
    xuid: account.xuid || null,
    createdAt: account.createdAt || null,
    lastLoginAt: account.lastLoginAt || null,
    hasSession: Boolean(account.accessToken),
  };
}

function getAccounts() {
  return getAccountsStore().accounts.map(publicAccount);
}

function getRawAccounts() {
  return getAccountsStore().accounts;
}

function getAccount(id) {
  return getAccountsStore().accounts.find((account) => account.id === id) || null;
}

function getActiveAccountRaw() {
  const store = getAccountsStore();
  return store.accounts.find((account) => account.id === store.activeId) || store.accounts[0] || null;
}

function getActiveAccount() {
  return publicAccount(getActiveAccountRaw());
}

function setActiveAccount(id) {
  const store = getAccountsStore();
  if (!store.accounts.some((account) => account.id === id)) throw new Error('Conta não encontrada.');
  store.activeId = id;
  saveAccountsStore();
  return publicAccount(getAccount(id));
}

function upsertAccount(account, options = {}) {
  const store = getAccountsStore();
  const now = new Date().toISOString();
  const incoming = {
    ...account,
    id: account.id || randomId(8),
    uuid: account.uuid ? normalizeUuid(account.uuid) : account.uuid,
    createdAt: account.createdAt || now,
    lastLoginAt: now,
  };
  const index = store.accounts.findIndex(
    (item) => item.id === incoming.id || (incoming.type === 'offline' && item.type === 'offline' && item.name.toLowerCase() === incoming.name.toLowerCase()),
  );
  if (index >= 0) {
    incoming.createdAt = store.accounts[index].createdAt || incoming.createdAt;
    store.accounts[index] = { ...store.accounts[index], ...incoming };
  } else {
    store.accounts.push(incoming);
  }
  if (options.activate !== false) store.activeId = incoming.id;
  if (!store.activeId) store.activeId = incoming.id;
  saveAccountsStore();
  return publicAccount(getAccount(incoming.id));
}

function removeAccount(id) {
  const store = getAccountsStore();
  const index = store.accounts.findIndex((account) => account.id === id);
  if (index === -1) throw new Error('Conta não encontrada.');
  store.accounts.splice(index, 1);
  if (store.activeId === id) store.activeId = store.accounts[0]?.id || null;
  saveAccountsStore();
  return true;
}

function getInstallations() {
  if (installationsCache) return installationsCache;
  const stored = readJson(INSTALLATIONS_FILE, []);
  installationsCache = Array.isArray(stored) ? stored : [];
  return installationsCache;
}

function saveInstallations() {
  writeJson(INSTALLATIONS_FILE, installationsCache);
}

function normalizeAutoJoin(value) {
  const source = value && typeof value === 'object' ? value : {};
  const type = source.type === 'server' || source.type === 'world' ? source.type : 'off';
  return {
    type,
    server: type === 'server' ? String(source.server || '').trim().slice(0, 255) : '',
    port: Math.max(1, Math.min(65535, Number(source.port) || 25565)),
    world: type === 'world' ? String(source.world || '').trim().slice(0, 128) : '',
  };
}

function normalizeInstallation(record) {
  const id = record.id || randomId(6);
  return {
    id,
    name: record.name || `Instalação ${id}`,
    icon: record.icon || '🌍',
    color: record.color || '#38d39f',
    iconUrl: record.iconUrl || null,
    version: record.version,
    versionType: record.versionType || 'release',
    loader: record.loader && record.loader.type ? record.loader : { type: 'vanilla', version: null },
    versionId: record.versionId || record.version,
    status: record.status || 'ready',
    error: record.error || null,
    gameDir: record.gameDir || instanceDir(id),
    createdAt: record.createdAt || new Date().toISOString(),
    lastPlayed: record.lastPlayed || null,
    totalPlayMs: Number(record.totalPlayMs) || 0,
    ramMb: record.ramMb ? Number(record.ramMb) : null,
    minRamMb: record.minRamMb ? Number(record.minRamMb) : null,
    jvmArgs: record.jvmArgs || '',
    javaPath: record.javaPath || 'auto',
    resolutionWidth: Number(record.resolutionWidth) || 0,
    resolutionHeight: Number(record.resolutionHeight) || 0,
    autoJoin: normalizeAutoJoin(record.autoJoin),
    modpack: record.modpack || null,
    notes: record.notes || '',
  };
}

function getInstallation(id) {
  const record = getInstallations().find((item) => item.id === id);
  return record ? normalizeInstallation(record) : null;
}

function createInstallation(record) {
  const normalized = normalizeInstallation(record);
  const existing = getInstallations().findIndex((item) => item.id === normalized.id);
  if (existing >= 0) getInstallations()[existing] = normalized;
  else getInstallations().push(normalized);
  saveInstallations();
  return normalized;
}

function updateInstallation(id, patch) {
  const list = getInstallations();
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) throw new Error('Instalação não encontrada.');
  list[index] = normalizeInstallation({ ...list[index], ...patch, id });
  saveInstallations();
  return list[index];
}

function deleteInstallation(id) {
  const list = getInstallations();
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) throw new Error('Instalação não encontrada.');
  list.splice(index, 1);
  const settings = getSettings();
  if (settings.lastInstanceId === id) saveSettings({ lastInstanceId: list[0]?.id || null });
  saveInstallations();
  return true;
}

function setLastInstance(id) {
  saveSettings({ lastInstanceId: id });
}

function exportConfig() {
  const settings = { ...getSettings() };
  delete settings.curseforgeKey;
  delete settings.microsoftClientId;
  return {
    format: 'minesphere-config',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    installations: getInstallations().map((item) => {
      const copy = { ...item };
      delete copy.gameDir;
      return copy;
    }),
  };
}

function importConfig(data, options = {}) {
  if (!data || data.format !== 'minesphere-config') throw new Error('Formato de configuração inválido.');
  if (data.settings && typeof data.settings === 'object') {
    const allowed = {};
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      if (Object.prototype.hasOwnProperty.call(data.settings, key)) allowed[key] = data.settings[key];
    }
    if (options.includeSensitive) {
      // Sensitive values are never imported from third-party files by default.
    }
    saveSettings(allowed);
  }
  if (Array.isArray(data.installations)) {
    for (const item of data.installations) {
      if (!item || !item.id || !item.version) continue;
      const normalized = normalizeInstallation({ ...item, gameDir: instanceDir(item.id) });
      const list = getInstallations();
      const index = list.findIndex((existing) => existing.id === normalized.id);
      if (index >= 0) list[index] = normalized;
      else list.push(normalized);
    }
    saveInstallations();
  }
  return { settings: getSettings(), installations: getInstallations() };
}

module.exports = {
  DEFAULT_SETTINGS,
  getSettings,
  saveSettings,
  getAccounts,
  getRawAccounts,
  getAccount,
  getActiveAccount,
  getActiveAccountRaw,
  setActiveAccount,
  upsertAccount,
  removeAccount,
  publicAccount,
  getInstallations,
  getInstallation,
  createInstallation,
  updateInstallation,
  deleteInstallation,
  normalizeAutoJoin,
  setLastInstance,
  exportConfig,
  importConfig,
};
