'use strict';

const { fetchJson } = require('./util');

const API = 'https://api.modrinth.com/v2';

function encode(value) {
  return encodeURIComponent(value);
}

function buildFacets({ projectType, gameVersion, loader, categories }) {
  const facets = [];
  if (projectType) facets.push([`project_type:${projectType}`]);
  if (gameVersion) facets.push([`versions:${gameVersion}`]);
  if (loader) facets.push([`categories:${loader}`]);
  if (Array.isArray(categories)) {
    for (const category of categories.filter(Boolean)) facets.push([`categories:${category}`]);
  }
  return facets;
}

async function searchProjects(options = {}) {
  const params = new URLSearchParams();
  params.set('query', options.query || '');
  params.set('limit', String(Math.min(50, Math.max(1, Number(options.limit) || 20))));
  params.set('offset', String(Math.max(0, Number(options.offset) || 0)));
  params.set('index', options.sort || 'relevance');
  const facets = buildFacets(options);
  if (facets.length) params.set('facets', JSON.stringify(facets));
  const data = await fetchJson(`${API}/search?${params.toString()}`, { timeout: 30000 });
  return {
    hits: (data.hits || []).map((hit) => ({
      source: 'modrinth',
      id: hit.project_id,
      slug: hit.slug,
      title: hit.title,
      description: hit.description,
      iconUrl: hit.icon_url,
      downloads: hit.downloads,
      follows: hit.follows,
      categories: hit.categories || [],
      clientSide: hit.client_side,
      serverSide: hit.server_side,
      projectType: hit.project_type,
      author: hit.author,
      versions: hit.versions || [],
      dateModified: hit.date_modified,
      license: hit.license,
      gallery: hit.gallery || [],
    })),
    total: data.total_hits || 0,
    offset: data.offset || 0,
    limit: data.limit || 0,
  };
}

async function getProject(idOrSlug) {
  const project = await fetchJson(`${API}/project/${encode(idOrSlug)}`, { timeout: 30000 });
  return {
    ...project,
    source: 'modrinth',
  };
}

async function getVersions(projectId, options = {}) {
  const params = new URLSearchParams();
  if (options.gameVersion) params.set('game_versions', JSON.stringify([options.gameVersion]));
  if (options.loader) params.set('loaders', JSON.stringify([options.loader]));
  const query = params.toString();
  const versions = await fetchJson(`${API}/project/${encode(projectId)}/version${query ? `?${query}` : ''}`, {
    timeout: 30000,
  });
  return Array.isArray(versions) ? versions : [];
}

function loaderForInstance(loaderType) {
  if (!loaderType || loaderType === 'vanilla' || loaderType === 'liteloader') return null;
  return loaderType;
}

function normalizeLoader(loaderType) {
  if (!loaderType) return null;
  if (loaderType === 'neoforge') return 'neoforge';
  if (loaderType === 'forge') return 'forge';
  if (loaderType === 'fabric') return 'fabric';
  if (loaderType === 'quilt') return 'quilt';
  return null;
}

function isVersionCompatible(version, options = {}) {
  if (!version) return false;
  const { gameVersion, loader, projectType } = options;
  if (gameVersion && !(version.game_versions || []).includes(gameVersion)) return false;
  if (loader && (projectType === 'mod' || projectType === 'modpack')) {
    const normalized = normalizeLoader(loader);
    if (normalized && Array.isArray(version.loaders) && version.loaders.length) {
      if (!version.loaders.includes(normalized)) return false;
    }
  }
  return true;
}

function pickVersion(versions, options = {}) {
  const compatible = (versions || []).filter((version) => isVersionCompatible(version, options));
  const sorted = [...compatible].sort((a, b) => {
    const date = String(b.date_published || '').localeCompare(String(a.date_published || ''));
    if (date) return date;
    return String(b.version_number || '').localeCompare(String(a.version_number || ''));
  });
  const release = sorted.find((version) => version.version_type === 'release');
  return release || sorted[0] || null;
}

function getPrimaryFile(version) {
  if (!version) return null;
  return version.files?.find((file) => file.primary) || version.files?.[0] || null;
}

function versionSummary(version) {
  if (!version) return null;
  const file = getPrimaryFile(version);
  return {
    id: version.id,
    name: version.name,
    versionNumber: version.version_number,
    versionType: version.version_type,
    gameVersions: version.game_versions || [],
    loaders: version.loaders || [],
    datePublished: version.date_published,
    downloads: version.downloads || 0,
    changelog: version.changelog || '',
    dependencies: version.dependencies || [],
    file: file
      ? {
          filename: file.filename,
          url: file.url,
          size: file.size,
          hashes: file.hashes,
          primary: Boolean(file.primary),
        }
      : null,
  };
}

async function getVersion(versionId) {
  return fetchJson(`${API}/version/${encode(versionId)}`, { timeout: 30000 });
}

async function getProjectVersionsForInstance(projectId, instance) {
  const loader = loaderForInstance(instance?.loader?.type);
  return getVersions(projectId, {
    gameVersion: instance?.version,
    loader,
  });
}

async function resolveLatestVersion(projectId, instance, projectType) {
  const versions = await getVersions(projectId, {
    gameVersion: instance?.version,
    loader: projectType === 'mod' || projectType === 'modpack' ? loaderForInstance(instance?.loader?.type) : undefined,
  });
  return pickVersion(versions, {
    gameVersion: instance?.version,
    loader: loaderForInstance(instance?.loader?.type),
    projectType,
  });
}

async function getFeatured(options = {}) {
  return searchProjects({ ...options, query: options.query || '', sort: 'downloads' });
}

module.exports = {
  API,
  searchProjects,
  getProject,
  getVersions,
  getVersion,
  pickVersion,
  getPrimaryFile,
  versionSummary,
  isVersionCompatible,
  loaderForInstance,
  normalizeLoader,
  getProjectVersionsForInstance,
  resolveLatestVersion,
  getFeatured,
};
