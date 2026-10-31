'use strict';

const { fetchJson } = require('./util');

const API = 'https://api.github.com';

function normalizeRepo(repo) {
  return {
    source: 'github',
    id: repo.full_name,
    title: repo.name,
    fullName: repo.full_name,
    description: repo.description || 'Sem descrição.',
    iconUrl: repo.owner?.avatar_url || null,
    downloads: repo.stargazers_count || 0,
    follows: repo.forks_count || 0,
    author: repo.owner?.login || '',
    htmlUrl: repo.html_url,
    topics: repo.topics || [],
    updatedAt: repo.updated_at,
    defaultBranch: repo.default_branch,
  };
}

function normalizeRelease(release, repoFullName) {
  return {
    id: release.id,
    tag: release.tag_name,
    name: release.name || release.tag_name,
    body: release.body || '',
    publishedAt: release.published_at,
    prerelease: release.prerelease,
    htmlUrl: release.html_url,
    repo: repoFullName,
    assets: (release.assets || [])
      .filter((asset) => /\.(jar|zip)$/i.test(asset.name))
      .map((asset) => ({
        id: asset.id,
        name: asset.name,
        size: asset.size,
        downloadUrl: asset.browser_download_url,
        contentType: asset.content_type,
        downloads: asset.download_count,
      })),
  };
}

async function searchRepos(query) {
  const q = encodeURIComponent(`${String(query || '').trim()} minecraft`.trim());
  const data = await fetchJson(`${API}/search/repositories?q=${q}&sort=stars&order=desc&per_page=12`, {
    timeout: 30000,
  });
  return {
    hits: (data.items || []).map(normalizeRepo),
    total: data.total_count || 0,
  };
}

async function getReleases(repoFullName) {
  const repo = String(repoFullName || '').trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) throw new Error('Repositório GitHub inválido. Usa o formato owner/repo.');
  const releases = await fetchJson(`${API}/repos/${repo}/releases?per_page=12`, { timeout: 30000 });
  return {
    repo,
    releases: (Array.isArray(releases) ? releases : []).map((release) => normalizeRelease(release, repo)),
  };
}

async function getLatestRelease(repoFullName) {
  const repo = String(repoFullName || '').trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) throw new Error('Repositório GitHub inválido.');
  const release = await fetchJson(`${API}/repos/${repo}/releases/latest`, { timeout: 30000 });
  return normalizeRelease(release, repo);
}

module.exports = {
  searchRepos,
  getReleases,
  getLatestRelease,
  normalizeRepo,
  normalizeRelease,
};
