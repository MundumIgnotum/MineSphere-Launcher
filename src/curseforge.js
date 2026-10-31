'use strict';

const { fetchJson } = require('./util');
const { getSettings } = require('./store');

const API = 'https://api.curseforge.com/v1';
const GAME_ID = 432;
const CLASS_IDS = {
  mod: 6,
  modpack: 4471,
  resourcepack: 12,
  shader: 6552,
};
const LOADER_TYPES = {
  forge: 1,
  fabric: 4,
  quilt: 5,
  neoforge: 6,
  liteloader: 3,
};

function apiKey() {
  const key = String(getSettings().curseforgeKey || '').trim();
  if (!key) throw new Error('Adiciona uma API key da CurseForge nas Definições para usar esta fonte.');
  return key;
}

function headers() {
  return {
    'x-api-key': apiKey(),
    Accept: 'application/json',
  };
}

function encode(value) {
  return encodeURIComponent(value);
}

function normalizeHit(mod) {
  const logo = mod.logo?.thumbnailUrl || mod.logo?.url || null;
  return {
    source: 'curseforge',
    id: String(mod.id),
    slug: mod.slug,
    title: mod.name,
    description: mod.summary,
    iconUrl: logo,
    downloads: mod.downloadCount || 0,
    follows: mod.thumbsUpCount || 0,
    categories: (mod.categories || []).map((category) => category.name),
    projectType: mod.classId === CLASS_IDS.modpack ? 'modpack' : mod.classId === CLASS_IDS.resourcepack ? 'resourcepack' : mod.classId === CLASS_IDS.shader ? 'shader' : 'mod',
    author: mod.authors?.[0]?.name || '',
    dateModified: mod.dateModified,
    links: mod.links || {},
    latestFiles: mod.latestFiles || [],
  };
}

async function search(options = {}) {
  const projectType = options.projectType || 'mod';
  const classId = CLASS_IDS[projectType];
  if (!classId) throw new Error('Tipo de projeto não suportado na CurseForge.');
  const params = new URLSearchParams();
  params.set('gameId', String(GAME_ID));
  params.set('classId', String(classId));
  params.set('searchFilter', options.query || '');
  params.set('sortField', options.sort === 'downloads' ? '6' : options.sort === 'newest' ? '11' : '2');
  params.set('sortOrder', 'desc');
  params.set('pageSize', String(Math.min(50, Math.max(1, Number(options.limit) || 20))));
  params.set('index', String(Math.max(0, Number(options.offset) || 0)));
  if (options.gameVersion) params.set('gameVersion', options.gameVersion);
  if (options.loader && LOADER_TYPES[options.loader]) params.set('modLoaderType', String(LOADER_TYPES[options.loader]));
  const data = await fetchJson(`${API}/mods/search?${params.toString()}`, { headers: headers(), timeout: 30000 });
  return {
    hits: (data.data || []).map(normalizeHit),
    total: data.pagination?.totalCount || 0,
    offset: data.pagination?.index || 0,
    limit: data.pagination?.pageSize || 0,
  };
}

async function getMod(id) {
  const data = await fetchJson(`${API}/mods/${encode(id)}`, { headers: headers(), timeout: 30000 });
  return { ...normalizeHit(data.data), body: data.data?.summary || '', gallery: [] };
}

async function getFiles(modId, options = {}) {
  const params = new URLSearchParams();
  if (options.gameVersion) params.set('gameVersion', options.gameVersion);
  if (options.loader && LOADER_TYPES[options.loader]) params.set('modLoaderType', String(LOADER_TYPES[options.loader]));
  params.set('pageSize', '50');
  const data = await fetchJson(`${API}/mods/${encode(modId)}/files?${params.toString()}`, {
    headers: headers(),
    timeout: 30000,
  });
  return Array.isArray(data.data) ? data.data : [];
}

function pickFile(files) {
  if (!Array.isArray(files) || !files.length) return null;
  const sorted = [...files].sort((a, b) => String(b.fileDate || '').localeCompare(String(a.fileDate || '')));
  return sorted.find((file) => file.releaseType === 1) || sorted[0];
}

async function getDownloadUrl(modId, fileId) {
  try {
    const data = await fetchJson(`${API}/mods/${encode(modId)}/files/${encode(fileId)}/download-url`, {
      headers: headers(),
      timeout: 30000,
    });
    if (data.data) return data.data;
  } catch {
    /* fall back to file data */
  }
  const fileData = await fetchJson(`${API}/mods/${encode(modId)}/files/${encode(fileId)}`, {
    headers: headers(),
    timeout: 30000,
  });
  return fileData.data?.downloadUrl || null;
}

async function resolveFile(modId, options = {}) {
  const files = await getFiles(modId, options);
  const file = options.fileId ? files.find((item) => String(item.id) === String(options.fileId)) : pickFile(files);
  if (!file) throw new Error('Nenhum ficheiro compatível encontrado na CurseForge.');
  let url = file.downloadUrl;
  if (!url) url = await getDownloadUrl(modId, file.id);
  if (!url) throw new Error('A CurseForge não forneceu um URL de download para este ficheiro.');
  return {
    ...file,
    downloadUrl: url,
    filename: file.fileName,
    size: file.fileLength,
    hashes: file.hashes,
  };
}

async function getFileById(modId, fileId) {
  const data = await fetchJson(`${API}/mods/${encode(modId)}/files/${encode(fileId)}`, {
    headers: headers(),
    timeout: 30000,
  });
  const file = data.data;
  if (!file) throw new Error('Ficheiro CurseForge não encontrado.');
  let url = file.downloadUrl;
  if (!url) url = await getDownloadUrl(modId, fileId);
  return { ...file, downloadUrl: url, filename: file.fileName, size: file.fileLength, hashes: file.hashes };
}

function loaderType(loader) {
  return LOADER_TYPES[loader] || null;
}

module.exports = {
  API,
  search,
  getMod,
  getFiles,
  pickFile,
  getDownloadUrl,
  resolveFile,
  getFileById,
  loaderType,
  normalizeHit,
};
