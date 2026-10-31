const ICONS = {
  home: '<path d="M3 10.7 12 3l9 7.7"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
  library: '<path d="M4 4h4.5v16H4z"/><path d="M10 4h4v16h-4z"/><path d="m16.2 5.2 3.3-.9 3.5 14.8-3.3.9z"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/>',
  puzzle: '<path d="M8 3h4a2 2 0 0 1 2 2v2h2a2 2 0 0 1 2 2v2h-2a2 2 0 0 0 0 4h2v2a2 2 0 0 1-2 2h-2v-2a2 2 0 0 0-4 0v2H8a2 2 0 0 1-2-2v-2H4a2 2 0 0 1-2-2v-2h2a2 2 0 0 0 0-4H2V7a2 2 0 0 1 2-2h4V5a2 2 0 0 1 2-2Z"/>',
  package: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5"/><path d="M12 12v9"/>',
  sparkles: '<path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/><path d="m5 14 .7 2.3L8 17l-2.3.7L5 20l-.7-2.3L2 17l2.3-.7L5 14Z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.16.38.4.72.7 1 .3.28.68.42 1.1.4H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51.6Z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  play: '<path d="m7 4 13 8-13 8V4Z"/>',
  stop: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'arrow-left': '<path d="m15 18-6-6 6-6"/><path d="M9 12h12"/>',
  'arrow-up-right': '<path d="M7 17 17 7M7 7h10v10"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.9 2.9-2.9-2.9 2.8-3Z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
  upload: '<path d="M12 21V9M7 14l5-5 5 5"/><path d="M5 3h14"/>',
  external: '<path d="M14 3h7v7M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  archive: '<path d="M4 7h16v14H4z"/><path d="M3 3h18v4H3z"/><path d="M10 11h4"/>',
  gamepad: '<path d="M6 12h4M8 10v4M15 11h.01M18 13h.01"/><path d="M6.5 7h11a5 5 0 0 1 4.9 6l-.6 3a3 3 0 0 1-5.1 1.4L15 15H9l-1.7 2.4A3 3 0 0 1 2.2 16l-.6-3A5 5 0 0 1 6.5 7Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8M16 7l2 2M18 5l2 2"/>',
  monitor: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/>',
  zap: '<path d="M13 2 3 14h7l-1 8 11-13h-7l1-7Z"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  alert: '<path d="M10.3 3.6 2.1 18a2 2 0 0 0 1.7 3h16.4a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
  'hard-drive': '<path d="M4 14h16"/><path d="M5 5h14l2 9H3l2-9Z"/><path d="M3 14v5h18v-5"/><path d="M7 17h.01M11 17h.01"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z"/>',
  save: '<path d="M4 3h13l3 3v15H4z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/>',
  'log-in': '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5M15 12H3"/>',
  'log-out': '<path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  code: '<path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/>',
  box: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
  server: '<rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 7h.01M7 17h.01"/>',
  activity: '<path d="M3 12h4l3-9 4 18 3-9h4"/>',
  terminal: '<path d="m4 17 6-6-6-6M12 19h8"/>',
  rotate: '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  cloud: '<path d="M17.5 19H7a5 5 0 1 1 1.3-9.8A6 6 0 0 1 20 11a4 4 0 0 1-2.5 8Z"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1L10.8 5"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.2-1.2"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
};

function icon(name, className = '') {
  const paths = ICONS[name] || ICONS.box;
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

let brandLogoCounter = 0;
function brandLogoSvg(className = '') {
  const id = `minesphere-logo-${++brandLogoCounter}`;
  return `<svg class="${className}" viewBox="0 0 128 128" role="img" aria-label="MineSphere">
    <defs>
      <linearGradient id="${id}-outline" x1="16" y1="12" x2="112" y2="118" gradientUnits="userSpaceOnUse">
        <stop stop-color="var(--accent)"/>
        <stop offset=".55" stop-color="var(--accent)"/>
        <stop offset="1" stop-color="var(--accent-2)"/>
      </linearGradient>
      <linearGradient id="${id}-top" x1="64" y1="10" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stop-color="var(--accent)" stop-opacity=".38"/>
        <stop offset="1" stop-color="var(--accent)" stop-opacity=".12"/>
      </linearGradient>
      <linearGradient id="${id}-left" x1="16" y1="37" x2="64" y2="118" gradientUnits="userSpaceOnUse">
        <stop stop-color="var(--accent)" stop-opacity=".24"/>
        <stop offset="1" stop-color="var(--logo-base)" stop-opacity=".05"/>
      </linearGradient>
      <linearGradient id="${id}-right" x1="112" y1="37" x2="64" y2="118" gradientUnits="userSpaceOnUse">
        <stop stop-color="var(--accent-2)" stop-opacity=".3"/>
        <stop offset="1" stop-color="var(--logo-base)" stop-opacity=".05"/>
      </linearGradient>
      <radialGradient id="${id}-sphere" cx="0" cy="0" r="1" gradientTransform="translate(57 55) rotate(48) scale(30)" gradientUnits="userSpaceOnUse">
        <stop stop-color="var(--logo-shine)"/>
        <stop offset=".28" stop-color="var(--accent)"/>
        <stop offset=".7" stop-color="var(--accent)"/>
        <stop offset="1" stop-color="var(--accent-2)"/>
      </radialGradient>
      <filter id="${id}-glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="4" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#${id}-glow)">
      <path d="M64 8 113 36v56L64 120 15 92V36Z" fill="var(--logo-base)" stroke="url(#${id}-outline)" stroke-width="5" stroke-linejoin="round"/>
      <path d="M64 8 113 36 64 64 15 36Z" fill="url(#${id}-top)"/>
      <path d="M15 36 64 64v56L15 92Z" fill="url(#${id}-left)"/>
      <path d="M113 36 64 64v56l49-28Z" fill="url(#${id}-right)"/>
      <path d="M64 8v56M15 36l49 28 49-28" fill="none" stroke="url(#${id}-outline)" stroke-width="3" stroke-linejoin="round" opacity=".9"/>
    </g>
    <circle cx="64" cy="62" r="22" fill="url(#${id}-sphere)"/>
    <circle cx="57" cy="54" r="7" fill="var(--logo-shine)" opacity=".28"/>
    <ellipse cx="64" cy="62" rx="37" ry="14" fill="none" stroke="var(--accent)" stroke-width="3" opacity=".55" transform="rotate(-24 64 62)"/>
    <circle cx="96" cy="48" r="4" fill="var(--accent-2)"/>
  </svg>`;
}

function injectIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((element) => {
    element.innerHTML = icon(element.dataset.icon);
  });
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ESC[character]);
}

function safeUrl(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^(https?:\/\/|\/)/i.test(text)) return text;
  return '';
}

function fmtBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let index = -1;
  let size = value;
  do {
    size /= 1024;
    index += 1;
  } while (size >= 1024 && index < units.length - 1);
  return `${size.toFixed(size >= 100 ? 0 : 1)} ${units[index]}`;
}

function fmtNum(value) {
  return Number(value || 0).toLocaleString('pt-PT');
}

function fmtCompact(value) {
  return new Intl.NumberFormat('pt-PT', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value) || 0);
}

function fmtDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function fmtPlaytime(ms) {
  const totalMinutes = Math.floor((Number(ms) || 0) / 60000);
  if (totalMinutes < 1) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes}m`;
  if (hours < 10 && minutes) return `${hours}h ${minutes}m`;
  return `${hours}h`;
}

function initials(name) {
  return String(name || '?')
    .trim()
    .slice(0, 2)
    .toUpperCase() || '?';
}

const DEFAULT_ACCENT_COLOR = '#39d99f';
const DEFAULT_ACCENT_COLOR_2 = '#38bdf8';
const ACCENT_PRESETS = [
  ['Mint', '#39d99f', '#38bdf8'],
  ['Aurora', '#22d3ee', '#818cf8'],
  ['Sunset', '#fb7185', '#fbbf24'],
  ['Violet', '#a78bfa', '#f472b6'],
  ['Lime', '#a3e635', '#22d3ee'],
  ['Ember', '#f97316', '#ef4444'],
];

function normalizeHexColor(value, fallback) {
  const text = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(text) ? text.toLowerCase() : fallback;
}

function contrastForColor(hex) {
  const value = normalizeHexColor(hex, DEFAULT_ACCENT_COLOR).slice(1);
  const channels = [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16) / 255);
  const luminance = channels
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
  return luminance > 0.48 ? '#07110d' : '#ffffff';
}

function loaderLabel(type) {
  return {
    vanilla: 'Vanilla',
    fabric: 'Fabric',
    quilt: 'Quilt',
    forge: 'Forge',
    neoforge: 'NeoForge',
    liteloader: 'LiteLoader',
  }[type] || 'Vanilla';
}

function versionTypeLabel(type) {
  return {
    release: 'Release',
    snapshot: 'Snapshot',
    rc: 'Release candidate',
    old_beta: 'Beta antiga',
    old_alpha: 'Alpha antiga',
  }[type] || type || 'Versão';
}

function versionTypeClass(type) {
  if (type === 'release') return 'release';
  if (type === 'snapshot') return 'snapshot';
  if (type === 'rc') return 'rc';
  return 'warning';
}

function projectTypeLabel(type) {
  return {
    mod: 'Mod',
    modpack: 'Modpack',
    resourcepack: 'Resource pack',
    shader: 'Shader',
    datapack: 'Datapack',
  }[type] || 'Conteúdo';
}

function projectTypeIcon(type) {
  return {
    mod: '🧩',
    modpack: '📦',
    resourcepack: '🎨',
    shader: '✨',
    datapack: '🗺️',
  }[type] || '📁';
}

function plainText(value) {
  return String(value || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`]/g, '')
    .replace(/\r/g, '')
    .trim();
}

function debounce(key, callback, delay = 350) {
  clearTimeout(state.timers[key]);
  state.timers[key] = setTimeout(callback, delay);
}

function parseFileName(header, fallback) {
  const value = String(header || '');
  const encoded = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1]);
    } catch {
      /* ignore */
    }
  }
  const plain = value.match(/filename="([^"]+)"/i);
  return plain ? plain[1] : fallback;
}

async function request(path, options = {}) {
  const opts = { method: options.method || 'GET', headers: { ...(options.headers || {}) } };
  if (options.body !== undefined) {
    if (options.body instanceof Blob || options.body instanceof ArrayBuffer || typeof options.body === 'string') {
      opts.body = options.body;
    } else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(options.body);
    }
  }
  const response = await fetch(path, opts);
  const type = response.headers.get('content-type') || '';
  let data;
  if (type.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  if (!response.ok) {
    const message = data && typeof data === 'object' ? data.error : data;
    throw new Error(message || `Erro HTTP ${response.status}.`);
  }
  return data;
}

const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

function uploadFile(path, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', path);
    xhr.responseType = 'json';
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && typeof onProgress === 'function') {
        onProgress(Math.round((event.loaded / event.total) * 100), event.loaded, event.total);
      }
    };
    xhr.onload = () => {
      const data = xhr.response || (() => {
        try {
          return JSON.parse(xhr.responseText);
        } catch {
          return null;
        }
      })();
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
      } else {
        reject(new Error(data?.error || `Erro HTTP ${xhr.status}.`));
      }
    };
    xhr.onerror = () => reject(new Error('Falha de rede durante o envio.'));
    xhr.send(file);
  });
}

const PAGE_META = {
  home: { title: 'Início', subtitle: 'A tua central de Minecraft, num só lugar.' },
  library: { title: 'Biblioteca', subtitle: 'Todas as tuas instalações, perfis e mundos.' },
  versions: { title: 'Versões', subtitle: 'Todas as versões do Minecraft Java, num só sítio.' },
  mods: { title: 'Mods', subtitle: 'Descobre, instala e mantém os teus mods atualizados.' },
  modpacks: { title: 'Modpacks', subtitle: 'Pacotes completos, prontos a jogar em minutos.' },
  resources: { title: 'Recursos', subtitle: 'Resource packs, shaders e datapacks para dar vida ao jogo.' },
  accounts: { title: 'Contas', subtitle: 'Contas Microsoft e perfis offline.' },
  settings: { title: 'Definições', subtitle: 'Controla o launcher, o Java e as integrações.' },
};

const state = {
  app: null,
  page: 'home',
  settings: {},
  accounts: [],
  installations: [],
  activeAccount: null,
  activeJobs: [],
  jobs: new Map(),
  versionCache: null,
  library: { query: '', loader: 'all' },
  versions: { list: [], total: 0, offset: 0, loading: false, loaded: false, type: 'all', query: '', error: null, requestId: 0 },
  mods: {
    instanceId: null,
    source: 'modrinth',
    query: '',
    sort: 'relevance',
    results: [],
    total: 0,
    loading: false,
    loaded: false,
    error: null,
    installed: [],
    installedLoaded: false,
    installedLoading: false,
    updates: [],
    requestId: 0,
    github: { results: [], total: 0, repo: null, releases: [], loading: false, releasesLoading: false },
  },
  modpacks: { query: '', results: [], total: 0, loading: false, loaded: false, error: null, requestId: 0 },
  resources: {
    type: 'resourcepack',
    instanceId: null,
    world: '',
    query: '',
    source: 'modrinth',
    sort: 'relevance',
    results: [],
    total: 0,
    loading: false,
    loaded: false,
    error: null,
    installed: [],
    installedLoaded: false,
    installedLoading: false,
    worlds: [],
    worldsLoaded: false,
    worldsLoading: false,
    requestId: 0,
  },
  detail: { id: null, data: null, tab: 'overview', loading: false, logs: null, logsLoading: false },
  project: null,
  modpackModal: null,
  javaDetected: null,
  javaRuntime: null,
  javaLoading: false,
  system: null,
  systemError: null,
  login: null,
  confirmResolver: null,
  timers: {},
  booted: false,
  signature: '',
};

function pageFromHash() {
  const page = String(location.hash || '').replace(/^#\/?/, '').split('?')[0];
  return PAGE_META[page] ? page : 'home';
}

function navigate(page) {
  if (!PAGE_META[page]) page = 'home';
  state.page = page;
  const targetHash = `#/${page}`;
  if (location.hash !== targetHash) location.hash = targetHash;
  renderPage({ resetScroll: true });
}

function hydrate(data) {
  state.app = data;
  state.settings = data.settings || {};
  state.accounts = data.accounts || [];
  state.installations = data.installations || [];
  state.activeAccount = data.activeAccount || null;
  state.activeJobs = data.jobs || [];
  ensureSelections();
  syncActiveJobs();
  state.signature = stateSignature();
}

function stateSignature() {
  return JSON.stringify({
    installations: state.installations.map((item) => [item.id, item.status, item.running, item.totalPlayMs, item.modsCount]),
    activeAccount: state.activeAccount?.id || null,
    accounts: state.accounts.map((item) => item.id),
  });
}

function pickDefaultInstance() {
  const ready = state.installations.filter((item) => item.status === 'ready');
  return (
    ready.find((item) => item.id === state.settings.lastInstanceId) ||
    ready.find((item) => item.loader?.type !== 'vanilla') ||
    ready[0] ||
    state.installations[0] ||
    null
  );
}

function ensureSelections() {
  const ids = new Set(state.installations.map((item) => item.id));
  if (state.mods.instanceId && !ids.has(state.mods.instanceId)) state.mods.instanceId = null;
  if (state.resources.instanceId && !ids.has(state.resources.instanceId)) state.resources.instanceId = null;
  const fallback = pickDefaultInstance();
  if (!state.mods.instanceId) state.mods.instanceId = fallback?.id || null;
  if (!state.resources.instanceId) state.resources.instanceId = fallback?.id || null;
  if (state.detail.id && !ids.has(state.detail.id)) {
    state.detail = { id: null, data: null, tab: 'overview', loading: false, logs: null, logsLoading: false };
  }
}

function syncActiveJobs() {
  for (const job of state.activeJobs || []) {
    if (!state.jobs.has(job.id)) {
      state.jobs.set(job.id, { ...job, _opts: { title: job.title, fromState: true } });
    }
  }
}

function selectedInstance() {
  const ready = state.installations.filter((item) => item.status === 'ready');
  return ready.find((item) => item.id === state.settings.lastInstanceId) || ready[0] || null;
}

function instanceById(id) {
  return state.installations.find((item) => item.id === id) || null;
}

function streamerMode() {
  return Boolean(state.settings.streamerMode);
}

function accountDisplayName(account) {
  return streamerMode() ? 'Conta privada' : account?.name || 'Conta';
}

function applyTheme(overrides = null) {
  const settings = { ...state.settings, ...(overrides || {}) };
  const theme = settings.theme === 'light' ? 'light' : 'dark';
  const accent = normalizeHexColor(settings.accentColor, DEFAULT_ACCENT_COLOR);
  const accent2 = normalizeHexColor(settings.accentColor2, DEFAULT_ACCENT_COLOR_2);
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.dataset.streamer = settings.streamerMode ? 'true' : 'false';
  root.style.setProperty('--accent', accent);
  root.style.setProperty('--accent-2', accent2);
  root.style.setProperty('--accent-contrast', contrastForColor(accent));
  const button = document.getElementById('themeToggle');
  if (button) {
    button.innerHTML = icon(theme === 'dark' ? 'sun' : 'moon');
    button.title = theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro';
  }
}

function updateChrome() {
  const meta = PAGE_META[state.page] || PAGE_META.home;
  const title = document.getElementById('pageTitle');
  const subtitle = document.getElementById('pageSubtitle');
  if (title) title.textContent = meta.title;
  if (subtitle) subtitle.textContent = meta.subtitle;
  document.title = `${meta.title} · MineSphere Launcher`;
  document.querySelectorAll('#mainNav [data-page]').forEach((button) => {
    button.classList.toggle('active', button.dataset.page === state.page);
  });
  renderAccountChip();
  applyTheme();
  const quick = document.getElementById('quickPlay');
  if (quick) {
    const current = selectedInstance();
    quick.disabled = !current;
    quick.title = current ? (current.running ? 'Parar o jogo' : `Jogar ${current.name}`) : 'Cria uma instalação para jogar';
    quick.innerHTML = icon(current?.running ? 'stop' : 'play');
  }
}

function renderAccountChip() {
  const avatar = document.getElementById('accountAvatar');
  const name = document.getElementById('accountName');
  const type = document.getElementById('accountType');
  if (!avatar || !name || !type) return;
  const account = state.activeAccount;
  if (account) {
    const image = streamerMode() ? '' : safeUrl(account.skinUrl);
    avatar.innerHTML = streamerMode()
      ? icon('user')
      : image
        ? `<img src="${esc(image)}" alt="">`
        : esc(initials(account.name));
    name.textContent = accountDisplayName(account);
    type.textContent = account.type === 'msa' ? 'Microsoft' : 'Offline';
  } else {
    avatar.textContent = '?';
    name.textContent = 'Sem conta';
    type.textContent = 'Adicionar conta';
  }
}

function renderPage(options = {}) {
  if (!state.app) return;
  const content = document.getElementById('content');
  if (!content) return;
  const active = document.activeElement;
  const focusId = active && active.id ? active.id : null;
  const selectionStart = active && 'selectionStart' in active ? active.selectionStart : null;
  const previousScroll = content.scrollTop;

  updateChrome();
  content.innerHTML = renderContent();
  injectIcons(content);
  renderJobs();

  if (options.resetScroll) {
    content.scrollTop = 0;
  } else {
    content.scrollTop = previousScroll;
  }

  if (focusId) {
    const target = document.getElementById(focusId);
    if (target && typeof target.focus === 'function') {
      target.focus({ preventScroll: true });
      if (selectionStart !== null && typeof target.setSelectionRange === 'function') {
        try {
          target.setSelectionRange(selectionStart, selectionStart);
        } catch {
          /* ignore */
        }
      }
    }
  }

  ensurePageData();
}

function renderContent() {
  switch (state.page) {
    case 'library':
      return renderLibrary();
    case 'versions':
      return renderVersions();
    case 'mods':
      return renderMods();
    case 'modpacks':
      return renderModpacks();
    case 'resources':
      return renderResources();
    case 'accounts':
      return renderAccounts();
    case 'settings':
      return renderSettings();
    default:
      return renderHome();
  }
}

function ensurePageData() {
  if (!state.booted) return;
  if (state.page === 'versions' && !state.versions.loaded && !state.versions.loading) {
    loadVersions(true);
  }
  if (state.page === 'mods') {
    if (!state.mods.installedLoaded && !state.mods.installedLoading) loadInstalledMods();
    if (!state.mods.loaded && !state.mods.loading) loadModsSearch();
  }
  if (state.page === 'modpacks' && !state.modpacks.loaded && !state.modpacks.loading) {
    loadModpacks();
  }
  if (state.page === 'resources') {
    if (!state.resources.worldsLoaded && !state.resources.worldsLoading) loadWorlds();
    if (!state.resources.installedLoaded && !state.resources.installedLoading) loadInstalledResources();
    if (!state.resources.loaded && !state.resources.loading) loadResources();
  }
  if (state.page === 'settings' && !state.system && !state.systemLoading && !state.systemError) loadSystem();
}

function renderHome() {
  const installations = state.installations;
  const ready = installations.filter((item) => item.status === 'ready');
  const current = ready.find((item) => item.id === state.settings.lastInstanceId) || ready[0] || null;
  const totalMods = installations.reduce((total, item) => total + (Number(item.modsCount) || 0), 0);
  const totalPlay = installations.reduce((total, item) => total + (Number(item.totalPlayMs) || 0), 0);
  const recent = installations.slice(0, 6);

  const heroAction = current
    ? `<button class="btn primary big" data-action="${current.running ? 'stop' : 'launch'}" data-id="${esc(current.id)}">${icon(current.running ? 'stop' : 'play')} ${current.running ? 'Parar jogo' : `Jogar ${esc(current.name)}`}</button>
       <button class="btn ghost big" data-action="instance-detail" data-id="${esc(current.id)}">${icon('settings')} Gerir instalação</button>`
    : `<button class="btn primary big" data-action="new-instance">${icon('plus')} Criar primeira instalação</button>`;

  return `
    <section class="hero fade-in">
      <div class="hero-copy">
        <span class="eyebrow"><span class="dot"></span> Minecraft Java · tudo-em-um</span>
        <h1>${installations.length ? 'A tua próxima<br><span class="gradient-text">aventura começa aqui.</span>' : 'Prepara o teu<br><span class="gradient-text">primeiro mundo.</span>'}</h1>
        <p>${installations.length
          ? 'Versões, loaders, mods, modpacks e backups — tudo organizado num launcher rápido, privado e feito para jogar.'
          : 'Escolhe uma versão, adiciona um loader e começa a jogar. O MineSphere trata das bibliotecas, do Java e dos ficheiros por ti.'}</p>
        <div class="hero-actions">${heroAction}</div>
        <div class="hero-meta">
          <span>${icon('shield')} Dados locais</span>
          <span>${icon('zap')} Downloads paralelos</span>
          <span>${icon('refresh')} Auto-reparação</span>
        </div>
      </div>
      <div class="hero-art">
        <div class="orb">${brandLogoSvg('hero-logo')}</div>
        <div class="hero-float f1">${icon('gamepad')} <span><strong>${ready.length}</strong> prontas a jogar</span></div>
        <div class="hero-float f2">${icon('puzzle')} <span><strong>${fmtNum(totalMods)}</strong> mods instalados</span></div>
        <div class="hero-float f3">${icon('clock')} <span><strong>${fmtPlaytime(totalPlay)}</strong> de jogo</span></div>
      </div>
    </section>

    <div class="stats-grid fade-in">
      ${statCard('library', 'blue', installations.length, 'Instalações')}
      ${statCard('clock', 'orange', fmtPlaytime(totalPlay), 'Tempo de jogo')}
      ${statCard('puzzle', 'purple', fmtNum(totalMods), 'Mods instalados')}
      ${statCard('users', '', state.accounts.length, 'Contas ligadas')}
    </div>

    <div class="section-head">
      <div>
        <h2 class="section-title">As tuas instalações</h2>
        <p>${installations.length ? 'Continua de onde paraste ou cria um novo perfil.' : 'Ainda não tens nenhuma instalação.'}</p>
      </div>
      <button class="section-link" data-page="library">Ver biblioteca ${icon('chevron-right')}</button>
    </div>

    ${recent.length
      ? `<div class="instance-grid">${recent.map(renderInstanceCard).join('')}</div>`
      : emptyState('library', 'Sem instalações', 'Cria a tua primeira instalação para começares a jogar.', `<button class="btn primary" data-action="new-instance">${icon('plus')} Nova instalação</button>`)}

    <div class="section-head">
      <div>
        <h2 class="section-title">Descobre mais</h2>
        <p>Conteúdo escolhido para a tua próxima aventura.</p>
      </div>
    </div>
    <div class="discover-grid">
      <button class="discover-card" data-page="mods">
        <span class="discover-icon">${icon('puzzle')}</span>
        <span><strong>Mods</strong><span>Milhares de mods para Fabric, Forge e mais.</span></span>
        <span class="chevron">${icon('chevron-right')}</span>
      </button>
      <button class="discover-card" data-page="modpacks">
        <span class="discover-icon purple">${icon('package')}</span>
        <span><strong>Modpacks</strong><span>Experiências completas, prontas a instalar.</span></span>
        <span class="chevron">${icon('chevron-right')}</span>
      </button>
      <button class="discover-card" data-page="resources">
        <span class="discover-icon blue">${icon('sparkles')}</span>
        <span><strong>Resource packs & shaders</strong><span>Um novo visual para o teu Minecraft.</span></span>
        <span class="chevron">${icon('chevron-right')}</span>
      </button>
    </div>
  `;
}

function statCard(iconName, tone, value, label) {
  return `<div class="stat-card">
    <span class="stat-icon ${tone}">${icon(iconName)}</span>
    <span class="stat-meta"><strong>${esc(value)}</strong><span>${esc(label)}</span></span>
  </div>`;
}

function renderInstanceCard(instance) {
  const status = instance.status || 'ready';
  const iconUrl = safeUrl(instance.iconUrl);
  const badge = instance.running
    ? '<span class="badge success"><span class="dot"></span> A jogar</span>'
    : status === 'installing'
      ? '<span class="badge info"><span class="dot"></span> A instalar</span>'
      : status === 'error'
        ? '<span class="badge error">Erro</span>'
        : '<span class="badge release">Pronta</span>';
  const action = instance.running
    ? `<button class="btn danger sm" data-action="stop" data-id="${esc(instance.id)}">${icon('stop')} Parar</button>`
    : `<button class="btn primary sm" data-action="launch" data-id="${esc(instance.id)}" ${status !== 'ready' ? 'disabled' : ''}>${icon('play')} Jogar</button>`;
  return `<article class="instance-card ${esc(status)} ${instance.running ? 'running' : ''}" style="--card-accent:${esc(instance.color || '#39d99f')}" data-action="instance-detail" data-id="${esc(instance.id)}">
    <div class="instance-top">
      <div class="instance-icon">${iconUrl ? `<img src="${esc(iconUrl)}" alt="" loading="lazy">` : esc(instance.icon || '🌍')}</div>
      <div class="instance-menu">${badge}</div>
    </div>
    <h3 title="${esc(instance.name)}">${esc(instance.name)}</h3>
    <div class="instance-sub"><span>${esc(instance.version)}</span><span class="dot"></span><span>${esc(instance.loaderLabel || loaderLabel(instance.loader?.type))}</span></div>
    <div class="instance-meta">
      <span>${icon('puzzle')} ${fmtNum(instance.modsCount)} mods</span>
      <span>${icon('clock')} ${fmtPlaytime(instance.totalPlayMs)}</span>
    </div>
    <div class="instance-actions">
      ${action}
      <button class="btn ghost sm" data-action="instance-detail" data-id="${esc(instance.id)}">${icon('settings')} Gerir</button>
    </div>
  </article>`;
}

function renderLibrary() {
  const query = state.library.query.trim().toLowerCase();
  const loader = state.library.loader;
  const list = state.installations.filter((instance) => {
    if (loader !== 'all' && instance.loader?.type !== loader) return false;
    if (!query) return true;
    return `${instance.name} ${instance.version} ${instance.loader?.type}`.toLowerCase().includes(query);
  });

  return `
    <div class="page-toolbar">
      <div class="toolbar-group">
        <label class="search toolbar-search">
          <span data-icon="search"></span>
          <input id="library-search" type="search" placeholder="Filtrar instalações..." value="${esc(state.library.query)}" data-search="library" autocomplete="off">
        </label>
        <select class="select" style="width:auto" data-filter="library-loader" aria-label="Filtrar por loader">
          ${['all', 'vanilla', 'fabric', 'quilt', 'forge', 'neoforge'].map((type) => `<option value="${type}" ${loader === type ? 'selected' : ''}>${type === 'all' ? 'Todos os loaders' : loaderLabel(type)}</option>`).join('')}
        </select>
      </div>
      <div class="toolbar-group">
        <span class="muted small">${list.length} de ${state.installations.length}</span>
        <button class="btn primary" data-action="new-instance">${icon('plus')} Nova instalação</button>
      </div>
    </div>
    ${list.length
      ? `<div class="instance-grid">${list.map(renderInstanceCard).join('')}</div>`
      : emptyState('library', state.installations.length ? 'Nenhum resultado' : 'Sem instalações', state.installations.length ? 'Não há instalações que correspondam ao filtro.' : 'Cria a tua primeira instalação para começares a jogar.', `<button class="btn primary" data-action="new-instance">${icon('plus')} Nova instalação</button>`)}
  `;
}

function renderVersions() {
  const versions = state.versions;
  const filters = [
    ['all', 'Todas'],
    ['release', 'Releases'],
    ['snapshot', 'Snapshots'],
    ['rc', 'RC'],
    ['old_beta', 'Beta'],
    ['old_alpha', 'Alpha'],
  ];
  return `
    <div class="page-toolbar">
      <div class="toolbar-group">
        ${filters.map(([type, label]) => `<button class="chip ${versions.type === type ? 'active' : ''}" data-action="version-filter" data-type="${type}">${label}</button>`).join('')}
      </div>
      <div class="toolbar-group">
        <label class="search toolbar-search">
          <span data-icon="search"></span>
          <input id="versions-search" type="search" placeholder="Pesquisar versão..." value="${esc(versions.query)}" data-search="versions" autocomplete="off">
        </label>
      </div>
    </div>
    ${versions.error ? notice('danger', versions.error) : ''}
    ${versions.loading && !versions.list.length
      ? `<div class="version-list">${Array.from({ length: 8 }, () => '<div class="skeleton" style="height:52px"></div>').join('')}</div>`
      : versions.list.length
        ? `<div class="version-list">${versions.list.map(renderVersionRow).join('')}</div>
           <div class="load-more">
             ${versions.list.length < versions.total
               ? `<button class="btn ghost" data-action="load-more-versions">${versions.loading ? '<span class="spinner"></span>' : icon('chevron-down')} Carregar mais (${fmtNum(versions.total - versions.list.length)} restantes)</button>`
               : `<span class="muted small">${fmtNum(versions.total)} versões encontradas</span>`}
           </div>`
        : emptyState('layers', 'Sem versões', 'Não encontrámos versões para esta pesquisa.')}
  `;
}

function renderVersionRow(version) {
  return `<div class="version-row">
    <span class="version-id">${esc(version.id)}</span>
    <span class="badge ${versionTypeClass(version.type)}">${esc(versionTypeLabel(version.type))}</span>
    <span class="version-date">${esc(fmtDate(version.releaseTime))}</span>
    <button class="btn soft sm" data-action="install-version" data-version="${esc(version.id)}">${icon('download')} Instalar</button>
  </div>`;
}

function emptyState(iconName, title, text, action = '') {
  return `<div class="empty-state">
    <span class="empty-icon">${icon(iconName)}</span>
    <h3>${esc(title)}</h3>
    <p>${esc(text)}</p>
    ${action}
  </div>`;
}

function notice(tone, text, action = '') {
  return `<div class="notice ${tone || ''}">${icon(tone === 'warning' ? 'alert' : tone === 'danger' ? 'alert' : 'info')}<div>${esc(text)} ${action}</div></div>`;
}

function renderMods() {
  const instance = instanceById(state.mods.instanceId) || pickDefaultInstance();
  if (!state.installations.length) {
    return emptyState('puzzle', 'Sem instalações', 'Cria uma instalação para começares a instalar mods.', `<button class="btn primary" data-action="new-instance">${icon('plus')} Nova instalação</button>`);
  }
  const source = state.mods.source;
  const vanilla = instance && (instance.loader?.type === 'vanilla' || !instance.loader?.type);
  const sourceNotice =
    source === 'curseforge' && !state.settings.curseforgeKey
      ? notice('warning', 'A CurseForge precisa de uma API key gratuita. Adiciona-a nas definições para pesquisar e instalar.', `<button class="section-link" data-page="settings">Abrir definições ${icon('chevron-right')}</button>`)
      : '';

  return `
    <div class="page-toolbar">
      <div class="toolbar-group">
        <select class="select" style="width:auto;min-width:230px" data-change="mods-instance" aria-label="Instalação">
          ${state.installations.map((item) => `<option value="${esc(item.id)}" ${item.id === instance?.id ? 'selected' : ''}>${esc(item.name)} · ${esc(item.version)}</option>`).join('')}
        </select>
        <div class="source-tabs">
          ${sourceTab('modrinth', 'Modrinth', 'MODRINTH', source)}
          ${sourceTab('curseforge', 'CurseForge', 'CF', source)}
          ${sourceTab('github', 'GitHub', 'GH', source)}
        </div>
      </div>
      <div class="toolbar-group">
        <label class="search toolbar-search">
          <span data-icon="search"></span>
          <input id="mods-search" type="search" placeholder="Pesquisar mods..." value="${esc(state.mods.query)}" data-search="mods" autocomplete="off">
        </label>
        <select class="select" style="width:auto" data-change="mods-sort" aria-label="Ordenar">
          <option value="relevance" ${state.mods.sort === 'relevance' ? 'selected' : ''}>Relevância</option>
          <option value="downloads" ${state.mods.sort === 'downloads' ? 'selected' : ''}>Downloads</option>
          <option value="newest" ${state.mods.sort === 'newest' ? 'selected' : ''}>Novos</option>
        </select>
      </div>
    </div>
    ${sourceNotice}
    ${vanilla && source !== 'github' ? notice('warning', 'Esta instalação é Vanilla. Instala Fabric, Quilt, Forge ou NeoForge para usar mods.', `<button class="section-link" data-action="edit-instance" data-id="${esc(instance.id)}">Ver instalação ${icon('chevron-right')}</button>`) : ''}
    <div class="split" style="margin-top:14px">
      <div>
        ${renderModResults(instance)}
      </div>
      ${renderInstalledModsPanel()}
    </div>
  `;
}

function sourceTab(source, label, badge, current) {
  return `<button class="source-tab ${source === current ? 'active' : ''}" data-action="mods-source" data-source="${source}">${esc(label)} <span class="badge">${esc(badge)}</span></button>`;
}

function renderModResults(instance) {
  const mods = state.mods;
  if (mods.source === 'github') return renderGithubResults();
  if (mods.loading && !mods.results.length) {
    return `<div class="result-grid">${Array.from({ length: 6 }, () => '<div class="skeleton skeleton-card"></div>').join('')}</div>`;
  }
  if (mods.error) return notice('danger', mods.error);
  if (!mods.results.length) {
    return emptyState('search', 'Sem resultados', mods.query ? 'Tenta outra pesquisa ou muda de fonte.' : 'Pesquisa mods para começares.');
  }
  return `<div class="section-head" style="margin-top:0">
      <div><h2 class="section-title">Resultados</h2><p>${fmtNum(mods.total)} projetos encontrados</p></div>
      ${mods.loading ? '<span class="spinner"></span>' : ''}
    </div>
    <div class="result-grid">${mods.results.map((hit) => projectCard(hit, {
      source: mods.source,
      projectType: 'mod',
      disabled: !instance,
    })).join('')}</div>`;
}

function renderInstalledModsPanel() {
  const mods = state.mods;
  const updates = new Map((mods.updates || []).map((update) => [update.key, update]));
  const list = mods.installed || [];
  return `<aside class="panel">
    <div class="panel-head">
      <div><h3>Instalados</h3><p>${list.length} ${list.length === 1 ? 'mod' : 'mods'} nesta instalação</p></div>
      <div class="toolbar-group">
        <button class="btn ghost sm" data-action="check-updates" ${!list.length ? 'disabled' : ''} title="Procurar atualizações">${icon('refresh')} Verificar</button>
      </div>
    </div>
    ${mods.updates.length ? `<div class="panel-body">${notice('warning', `${mods.updates.length} ${mods.updates.length === 1 ? 'atualização disponível' : 'atualizações disponíveis'}.`, `<button class="section-link" data-action="update-all-mods">Atualizar tudo ${icon('chevron-right')}</button>`)}</div>` : ''}
    ${mods.installedLoading && !list.length
      ? '<div class="loading-row"><span class="spinner"></span> A ler mods...</div>'
      : list.length
        ? `<div class="installed-list">${list.map((item) => renderInstalledItem(item, updates.get(item.key), 'mod')).join('')}</div>`
        : `<div class="empty-state" style="border:0;background:transparent;min-height:180px">
            <span class="empty-icon">${icon('puzzle')}</span>
            <h3>Ainda sem mods</h3>
            <p>Os mods que instalares aparecem aqui.</p>
          </div>`}
  </aside>`;
}

function renderInstalledItem(item, update, type) {
  const iconUrl = safeUrl(item.iconUrl);
  return `<div class="installed-item ${item.enabled === false ? 'disabled' : ''}">
    <div class="item-icon">${iconUrl ? `<img src="${esc(iconUrl)}" alt="" loading="lazy">` : projectTypeIcon(item.projectType || type)}</div>
    <div class="item-main">
      <strong title="${esc(item.title || item.fileName)}">${esc(item.title || item.fileName)}</strong>
      <span>${esc(item.fileName)}${item.size ? ` · ${fmtBytes(item.size)}` : ''}</span>
    </div>
    <div class="item-actions">
      ${update ? `<button class="icon-action" data-action="update-mod" data-key="${esc(item.key)}" title="Atualizar">${icon('download')}</button>` : ''}
      <label class="switch" title="${item.enabled === false ? 'Ativar' : 'Desativar'}">
        <input type="checkbox" data-change="toggle-mod" data-key="${esc(item.key)}" ${item.enabled !== false ? 'checked' : ''}>
        <span></span>
      </label>
      <button class="icon-action danger" data-action="remove-mod" data-key="${esc(item.key)}" title="Remover">${icon('trash')}</button>
    </div>
  </div>`;
}

function renderGithubResults() {
  const github = state.mods.github;
  if (github.repo) return renderGithubReleases();
  if (github.loading && !github.results.length) {
    return `<div class="result-grid">${Array.from({ length: 6 }, () => '<div class="skeleton skeleton-card"></div>').join('')}</div>`;
  }
  if (!github.results.length) {
    return emptyState('code', 'Sem repositórios', 'Pesquisa um repositório ou projeto no GitHub.');
  }
  return `<div class="section-head" style="margin-top:0">
      <div><h2 class="section-title">Repositórios</h2><p>${fmtNum(github.total)} resultados · releases com ficheiros .jar</p></div>
    </div>
    <div class="result-grid">${github.results.map((repo) => `<article class="project-card" data-action="github-releases" data-repo="${esc(repo.fullName)}">
      <div class="project-top">
        <div class="project-icon">${safeUrl(repo.iconUrl) ? `<img src="${esc(safeUrl(repo.iconUrl))}" alt="" loading="lazy">` : 'GH'}</div>
        <div class="project-title"><h3>${esc(repo.title)}</h3><span>${esc(repo.fullName)}</span></div>
      </div>
      <p class="project-desc">${esc(repo.description)}</p>
      <div class="project-foot">
        <span>${icon('star')} ${fmtCompact(repo.downloads)}</span>
        <span>${icon('code')} ${esc(repo.author)}</span>
      </div>
      <button class="btn soft sm" data-action="github-releases" data-repo="${esc(repo.fullName)}">${icon('download')} Ver releases</button>
    </article>`).join('')}</div>`;
}

function renderGithubReleases() {
  const github = state.mods.github;
  if (github.releasesLoading) {
    return `<div class="loading-row"><span class="spinner"></span> A obter releases...</div>`;
  }
  return `<div class="panel">
    <div class="panel-head">
      <div><h3>${esc(github.repo)}</h3><p>Escolhe um ficheiro de uma release para instalar.</p></div>
      <button class="btn ghost sm" data-action="github-close">${icon('arrow-left')} Voltar</button>
    </div>
    <div class="panel-body">
      ${github.releases.length
        ? github.releases.map((release) => `<div class="detail-section">
            <h4>${esc(release.name)} <span class="badge ${release.prerelease ? 'warning' : 'release'}">${release.prerelease ? 'Pré-release' : 'Release'}</span></h4>
            <p class="muted small" style="margin:-4px 0 8px">${esc(release.tag)} · ${esc(fmtDate(release.publishedAt))}</p>
            ${release.assets.length
              ? release.assets.map((asset) => `<div class="version-option">
                  <span class="version-name">${esc(asset.name)} <span class="muted">· ${fmtBytes(asset.size)}</span></span>
                  <button class="btn soft sm" data-action="install-github" data-repo="${esc(release.repo)}" data-tag="${esc(release.tag)}" data-asset="${esc(asset.id)}">${icon('download')} Instalar</button>
                </div>`).join('')
              : '<p class="muted small">Sem ficheiros .jar ou .zip nesta release.</p>'}
          </div>`).join('')
        : '<p class="muted small">Este repositório não tem releases públicas.</p>'}
    </div>
  </div>`;
}

function projectCard(hit, options = {}) {
  const type = options.projectType || hit.projectType || hit.project_type || 'mod';
  const source = options.source || hit.source || 'modrinth';
  const iconUrl = safeUrl(hit.iconUrl || hit.icon_url);
  const author = hit.author || hit.owner || (source === 'modrinth' ? 'Modrinth' : source === 'curseforge' ? 'CurseForge' : 'GitHub');
  const categories = (hit.categories || hit.topics || []).slice(0, 2);
  return `<article class="project-card" data-action="${options.openAction || 'open-project'}" data-source="${esc(source)}" data-id="${esc(hit.id || hit.slug)}" data-type="${esc(type)}">
    <div class="project-top">
      <div class="project-icon">${iconUrl ? `<img src="${esc(iconUrl)}" alt="" loading="lazy">` : esc(initials(hit.title))}</div>
      <div class="project-title">
        <h3 title="${esc(hit.title)}">${esc(hit.title)}</h3>
        <span>${esc(author)}${categories.length ? ` · ${esc(categories.join(' · '))}` : ''}</span>
      </div>
    </div>
    <p class="project-desc">${esc(hit.description || 'Sem descrição.')}</p>
    <div class="project-foot">
      <span>${icon('download')} ${fmtCompact(hit.downloads)}</span>
      <span>${icon('star')} ${fmtCompact(hit.follows)}</span>
    </div>
    <button class="btn soft sm" data-action="${options.installAction || 'quick-install'}" data-source="${esc(source)}" data-project="${esc(hit.id || hit.slug)}" data-type="${esc(type)}" ${options.disabled ? 'disabled' : ''}>${icon('download')} Instalar</button>
  </article>`;
}

function renderModpacks() {
  const installed = state.installations.filter((item) => item.modpack);
  const modpacks = state.modpacks;
  return `
    <div class="page-toolbar">
      <div class="toolbar-group">
        <label class="search toolbar-search">
          <span data-icon="search"></span>
          <input id="modpacks-search" type="search" placeholder="Pesquisar modpacks..." value="${esc(modpacks.query)}" data-search="modpacks" autocomplete="off">
        </label>
      </div>
      <div class="toolbar-group">
        <button class="btn ghost" data-action="import-modpack">${icon('upload')} Importar</button>
        <button class="btn ghost" data-action="export-modpack">${icon('download')} Exportar</button>
      </div>
    </div>
    ${installed.length ? `<div class="section-head" style="margin-top:0">
      <div><h2 class="section-title">Instalados</h2><p>Modpacks prontos a atualizar.</p></div>
    </div>
    <div class="instance-grid" style="margin-bottom:22px">${installed.map(renderInstanceCard).join('')}</div>` : ''}
    <div class="section-head" style="margin-top:0">
      <div><h2 class="section-title">Descobrir modpacks</h2><p>${modpacks.loading ? 'A pesquisar...' : `${fmtNum(modpacks.total)} pacotes no Modrinth`}</p></div>
    </div>
    ${modpacks.error ? notice('danger', modpacks.error) : ''}
    ${modpacks.loading && !modpacks.results.length
      ? `<div class="result-grid">${Array.from({ length: 6 }, () => '<div class="skeleton skeleton-card"></div>').join('')}</div>`
      : modpacks.results.length
        ? `<div class="result-grid">${modpacks.results.map((hit) => projectCard(hit, { projectType: 'modpack', source: 'modrinth', openAction: 'open-modpack', installAction: 'install-modpack' })).join('')}</div>`
        : emptyState('package', 'Sem modpacks', 'Tenta outra pesquisa.')}
  `;
}

function renderResources() {
  const instance = instanceById(state.resources.instanceId) || pickDefaultInstance();
  const resources = state.resources;
  const type = resources.type;
  const isDatapack = type === 'datapack';
  const sourceNotice =
    resources.source === 'curseforge' && !state.settings.curseforgeKey
      ? notice('warning', 'A CurseForge precisa de uma API key gratuita nas definições.', `<button class="section-link" data-page="settings">Abrir definições ${icon('chevron-right')}</button>`)
      : '';

  return `
    <div class="page-toolbar">
      <div class="toolbar-group">
        <div class="tabs">
          <button class="tab ${type === 'resourcepack' ? 'active' : ''}" data-action="resources-type" data-type="resourcepack">Resource packs</button>
          <button class="tab ${type === 'shader' ? 'active' : ''}" data-action="resources-type" data-type="shader">Shaders</button>
          <button class="tab ${type === 'datapack' ? 'active' : ''}" data-action="resources-type" data-type="datapack">Datapacks</button>
        </div>
        <select class="select" style="width:auto;min-width:210px" data-change="resources-instance" aria-label="Instalação">
          ${state.installations.map((item) => `<option value="${esc(item.id)}" ${item.id === instance?.id ? 'selected' : ''}>${esc(item.name)} · ${esc(item.version)}</option>`).join('')}
        </select>
        ${isDatapack ? `<select class="select" style="width:auto;min-width:170px" data-change="resources-world" aria-label="Mundo">
          <option value="">Selecionar mundo...</option>
          ${resources.worlds.map((world) => `<option value="${esc(world.name)}" ${resources.world === world.name ? 'selected' : ''}>${esc(world.name)}</option>`).join('')}
        </select>` : ''}
      </div>
      <div class="toolbar-group">
        ${isDatapack ? '' : `<div class="source-tabs">
          ${sourceTab('modrinth', 'Modrinth', 'MODRINTH', resources.source)}
          ${sourceTab('curseforge', 'CurseForge', 'CF', resources.source)}
        </div>`}
        <label class="search toolbar-search">
          <span data-icon="search"></span>
          <input id="resources-search" type="search" placeholder="Pesquisar ${isDatapack ? 'datapacks' : type === 'shader' ? 'shaders' : 'resource packs'}..." value="${esc(resources.query)}" data-search="resources" autocomplete="off">
        </label>
      </div>
    </div>
    ${sourceNotice}
    ${isDatapack && !resources.world ? notice('warning', 'Seleciona um mundo para poderes instalar datapacks.') : ''}
    <div class="split" style="margin-top:14px">
      <div>
        ${resources.loading && !resources.results.length
          ? `<div class="result-grid">${Array.from({ length: 6 }, () => '<div class="skeleton skeleton-card"></div>').join('')}</div>`
          : resources.error
            ? notice('danger', resources.error)
            : resources.results.length
              ? `<div class="section-head" style="margin-top:0"><div><h2 class="section-title">Resultados</h2><p>${fmtNum(resources.total)} projetos</p></div>${resources.loading ? '<span class="spinner"></span>' : ''}</div>
                 <div class="result-grid">${resources.results.map((hit) => projectCard(hit, {
                   source: resources.source,
                   projectType: type,
                   disabled: !instance || (isDatapack && !resources.world),
                 })).join('')}</div>`
              : emptyState('sparkles', 'Sem resultados', 'Pesquisa conteúdo para dar vida ao teu jogo.')}
      </div>
      <aside class="panel">
        <div class="panel-head">
          <div><h3>Instalados</h3><p>${resources.installed.length} ${projectTypeLabel(type).toLowerCase()}${resources.installed.length === 1 ? '' : 's'}</p></div>
          <button class="btn ghost sm" data-action="refresh-resources" title="Atualizar lista">${icon('refresh')}</button>
        </div>
        ${resources.installedLoading && !resources.installed.length
          ? '<div class="loading-row"><span class="spinner"></span> A ler ficheiros...</div>'
          : resources.installed.length
            ? `<div class="installed-list">${resources.installed.map((item) => renderInstalledItem(item, null, type)).join('')}</div>`
            : `<div class="empty-state" style="border:0;background:transparent;min-height:180px"><span class="empty-icon">${icon('sparkles')}</span><h3>Ainda sem ficheiros</h3><p>Os teus ${projectTypeLabel(type).toLowerCase()} aparecem aqui.</p></div>`}
      </aside>
    </div>
  `;
}

function renderAccounts() {
  return `
    <div class="page-toolbar">
      <div class="toolbar-group">
        <span class="badge accent">${state.accounts.length} ${state.accounts.length === 1 ? 'conta' : 'contas'}</span>
        <span class="muted small">A conta ativa é usada ao iniciar o jogo.</span>
      </div>
      <div class="toolbar-group">
        <button class="btn ghost" data-action="add-offline">${icon('user')} Conta offline</button>
        <button class="btn primary" data-action="add-microsoft">${icon('log-in')} Conta Microsoft</button>
      </div>
    </div>
    ${state.accounts.length
      ? `<div class="account-grid">${state.accounts.map(renderAccountCard).join('')}
          <button class="add-account-card" data-action="add-microsoft">
            <span class="empty-icon">${icon('plus')}</span>
            <strong>Adicionar outra conta</strong>
            <span>Microsoft ou perfil offline.</span>
          </button>
        </div>`
      : `<div class="account-grid">
          <button class="add-account-card" data-action="add-microsoft">
            <span class="empty-icon">${icon('log-in')}</span>
            <strong>Entrar com Microsoft</strong>
            <span>Usa a tua conta oficial para jogar online.</span>
          </button>
          <button class="add-account-card" data-action="add-offline">
            <span class="empty-icon">${icon('user')}</span>
            <strong>Criar perfil offline</strong>
            <span>Ideal para testes, sem internet.</span>
          </button>
        </div>`}
    <div style="margin-top:16px">${notice('info', 'As credenciais são guardadas apenas neste computador, em data/accounts.json. O MineSphere não envia tokens para servidores externos.')}</div>
  `;
}

function renderAccountCard(account) {
  const active = state.activeAccount?.id === account.id;
  const hidden = streamerMode();
  const avatar = hidden ? '' : safeUrl(account.skinUrl);
  const expiry = hidden
    ? account.type === 'msa' ? 'Sessão Microsoft' : 'Perfil offline'
    : account.type === 'msa' && account.expiresAt
      ? `Sessão até ${fmtDate(account.expiresAt)}`
      : account.type === 'msa'
        ? 'Sessão Microsoft'
        : 'Perfil offline';
  return `<article class="account-card ${active ? 'active' : ''}">
    <div class="account-card-top">
      <div class="account-avatar">${hidden ? icon('user') : avatar ? `<img src="${esc(avatar)}" alt="">` : esc(initials(account.name))}</div>
      <div class="account-card-info">
        <strong>${esc(accountDisplayName(account))}</strong>
        <span>${esc(expiry)}</span>
      </div>
      ${active ? '<span class="badge accent"><span class="dot"></span> Ativa</span>' : `<span class="badge">${account.type === 'msa' ? 'Microsoft' : 'Offline'}</span>`}
    </div>
    <span class="mono">${hidden ? '••••••••-••••-••••-••••-••••••••••••' : esc(account.uuid)}</span>
    <div class="account-card-actions">
      ${active ? `<button class="btn ghost sm" disabled>${icon('check')} Em uso</button>` : `<button class="btn soft sm" data-action="activate-account" data-id="${esc(account.id)}">${icon('check')} Ativar</button>`}
      <button class="btn ghost sm" data-action="edit-skin" data-id="${esc(account.id)}">${icon('user')} Skin</button>
      ${account.type === 'msa' ? `<button class="btn ghost sm" data-action="refresh-account" data-id="${esc(account.id)}" title="Renovar sessão">${icon('refresh')}</button>` : ''}
      <button class="btn danger sm" data-action="remove-account" data-id="${esc(account.id)}">${icon('trash')}</button>
    </div>
  </article>`;
}

function openSkinModal(id) {
  const account = state.accounts.find((item) => item.id === id);
  if (!account) return;
  const official = account.type === 'msa';
  const avatar = safeUrl(account.skinUrl);
  openModal({
    title: 'Skin da conta',
    subtitle: accountDisplayName(account),
    size: 'small',
    body: `<form data-form="skin" data-skin-mode="${official ? 'official' : 'local'}">
      <input type="hidden" name="id" value="${esc(account.id)}">
      <div class="skin-preview">
        <div class="account-avatar skin-preview-avatar">${avatar ? `<img src="${esc(avatar)}" alt="">` : esc(initials(account.name))}</div>
        <div>
          <strong>${official ? 'Skin oficial Minecraft' : 'Skin local do launcher'}</strong>
          <p class="muted small">${official ? 'A skin fica associada à tua conta Microsoft e aparece nos servidores.' : 'Esta skin aparece no launcher. Para a veres no jogo, ativa a cópia para CustomSkinLoader.'}</p>
        </div>
      </div>
      <div class="field"><label>Ficheiro PNG</label><input class="input" type="file" name="skinFile" accept="image/png,.png"><span class="hint">64×64 pixels (máximo 2 MB). ${official ? 'A Microsoft só aceita o formato moderno.' : 'Também aceitamos o formato antigo 64×32.'}</span></div>
      ${official ? `<div class="field"><label>Modelo</label><select class="select" name="skinVariant"><option value="classic">Clássico (braços de 4 px)</option><option value="slim">Fino (braços de 3 px)</option></select></div>` : ''}
      ${official
        ? notice('info', 'O envio oficial pode demorar alguns segundos. A skin anterior só é substituída depois de a Microsoft confirmar.')
        : `<label class="setting-line"><div><strong>Copiar para CustomSkinLoader</strong><span>Sincroniza a skin com todas as instâncias; ao desativar, remove cópias antigas. Requer o mod CustomSkinLoader para aparecer no jogo.</span></div><span class="switch"><input type="checkbox" name="syncSkin" checked><span></span></span></label>`}
      ${!official && account.hasLocalSkin ? `<button class="btn danger sm" type="button" data-action="remove-skin" data-id="${esc(account.id)}">${icon('trash')} Remover skin local</button>` : ''}
      <div class="modal-foot" style="margin:20px -21px -20px">
        <button class="btn ghost" type="button" data-action="close-modal">Cancelar</button>
        <button class="btn primary" type="submit">${icon('upload')} ${official ? 'Enviar para a Microsoft' : 'Aplicar skin'}</button>
      </div>
    </form>`,
  });
}

function openOfflineSkinPrompt(account) {
  openModal({
    title: 'Escolher uma skin?',
    subtitle: accountDisplayName(account),
    size: 'small',
    body: `<p style="margin:0;color:var(--text-soft);line-height:1.6">A conta <strong>${esc(account.name)}</strong> foi criada. Queres escolher já uma skin local para usar no launcher?</p>
      <p class="muted small" style="line-height:1.6">A skin local não altera a tua skin em servidores. Para aparecer no jogo, instala o CustomSkinLoader e ativa a cópia ao guardar.</p>
      <label class="setting-line" style="margin-top:16px"><div><strong>Não mostrar novamente</strong><span>Podes voltar a ativar esta pergunta nas Definições.</span></div><span class="switch"><input type="checkbox" id="offline-skin-disable"><span></span></span></label>
      <div class="modal-foot" style="margin:20px -21px -20px">
        <button class="btn ghost" type="button" data-action="offline-skin-later" data-id="${esc(account.id)}">Agora não</button>
        <button class="btn primary" type="button" data-action="offline-skin-choose" data-id="${esc(account.id)}">${icon('user')} Escolher skin</button>
      </div>`,
  });
}

async function saveOfflineSkinPromptPreference(disabled) {
  if (!disabled) return;
  const result = await api.put('/api/settings', { offlineSkinPrompt: false });
  state.settings = result.settings;
  applyTheme();
}

function renderSettings() {
  const s = state.settings;
  const accentColor = normalizeHexColor(s.accentColor, DEFAULT_ACCENT_COLOR);
  const accentColor2 = normalizeHexColor(s.accentColor2, DEFAULT_ACCENT_COLOR_2);
  const javaRows = state.javaDetected
    ? state.javaDetected.length
      ? state.javaDetected.map((item) => `<div class="detected-item">
          <span class="badge success">Java ${item.major}</span>
          <span class="mono sensitive">${esc(item.path)}</span>
          <span class="muted">${esc(item.version || '')}</span>
        </div>`).join('')
      : '<div class="notice warning">' + icon('alert') + '<div>Nenhum Java encontrado. Descarrega uma versão ou define um caminho manualmente.</div></div>'
    : '<span class="muted small">A deteção ainda não foi executada.</span>';
  const system = state.system;
  return `
    <div class="page-toolbar">
      <div class="toolbar-group"><span class="badge accent">${icon('settings')} Configuração local</span></div>
      <div class="toolbar-group"><button class="btn primary" type="submit" form="settings-form">${icon('save')} Guardar alterações</button></div>
    </div>
    <form id="settings-form" data-form="settings">
      <div class="settings-grid">
        <section class="setting-card">
          <div class="setting-card-head">
            <span class="stat-icon">${icon('sun')}</span>
            <div><h3>Aparência</h3><p>Personaliza a interface do launcher.</p></div>
          </div>
          <div class="setting-card-body">
            <div class="field"><label>Tema</label>
              <select class="select" name="theme">
                <option value="dark" ${s.theme !== 'light' ? 'selected' : ''}>Escuro</option>
                <option value="light" ${s.theme === 'light' ? 'selected' : ''}>Claro</option>
              </select>
            </div>
            <div class="field">
              <label>Cores do launcher</label>
              <div class="color-grid">
                <label class="color-field">
                  <input type="color" name="accentColor" value="${esc(accentColor)}" data-change="appearance-preview">
                  <span>Principal</span>
                </label>
                <label class="color-field">
                  <input type="color" name="accentColor2" value="${esc(accentColor2)}" data-change="appearance-preview">
                  <span>Secundária</span>
                </label>
              </div>
              <div class="color-presets">
                ${ACCENT_PRESETS.map(([name, first, second]) => `<button class="color-preset" type="button" data-action="accent-preset" data-accent="${first}" data-accent2="${second}" title="${name}" aria-label="Usar cores ${name}" style="background:linear-gradient(135deg, ${first}, ${second})"></button>`).join('')}
              </div>
            </div>
            ${switchLine('streamerMode', s.streamerMode, 'Modo streamer', 'Desfoca nomes, UUIDs, skins e caminhos sensíveis.', 'data-change="appearance-preview"')}
            ${switchLine('showSnapshots', s.showSnapshots, 'Mostrar snapshots', 'Inclui versões de desenvolvimento na lista.')}
            ${switchLine('closeOnLaunch', s.closeOnLaunch, 'Fechar launcher ao jogar', 'A janela fecha quando o Minecraft inicia.')}
            ${switchLine('offlineSkinPrompt', s.offlineSkinPrompt !== false, 'Perguntar por skin offline', 'Ao criar uma conta offline, pergunta se queres escolher uma skin local.')}
          </div>
        </section>

        <section class="setting-card">
          <div class="setting-card-head">
            <span class="stat-icon purple">${icon('cpu')}</span>
            <div><h3>Desempenho</h3><p>Memória, Java e downloads.</p></div>
          </div>
          <div class="setting-card-body">
            <div class="field"><label>Memória máxima</label>
              <div class="range-line">
                <input type="range" name="ramMb" min="1024" max="32768" step="512" value="${Number(s.ramMb) || 4096}" data-range="ram">
                <output class="range-value" id="ram-value">${fmtBytes((Number(s.ramMb) || 4096) * 1024 * 1024)}</output>
              </div>
            </div>
            <div class="field"><label>Memória mínima (MB)</label><input class="input" type="number" name="minRamMb" min="256" max="8192" value="${Number(s.minRamMb) || 1024}"></div>
            <div class="field"><label>Argumentos JVM</label><textarea class="textarea" name="jvmArgs" rows="3">${esc(s.jvmArgs || '')}</textarea></div>
            <div class="field"><label>Downloads em paralelo</label>
              <div class="range-line">
                <input type="range" name="parallelDownloads" min="1" max="16" step="1" value="${Number(s.parallelDownloads) || 8}" data-range="parallel">
                <output class="range-value" id="parallel-value">${Number(s.parallelDownloads) || 8}</output>
              </div>
            </div>
            <div class="form-grid">
              <div class="field"><label>Largura da janela</label><input class="input" type="number" name="resolutionWidth" min="0" max="7680" value="${Number(s.resolutionWidth) || 0}" placeholder="Automático"></div>
              <div class="field"><label>Altura da janela</label><input class="input" type="number" name="resolutionHeight" min="0" max="4320" value="${Number(s.resolutionHeight) || 0}" placeholder="Automático"></div>
            </div>
          </div>
        </section>

        <section class="setting-card">
          <div class="setting-card-head">
            <span class="stat-icon blue">${icon('server')}</span>
            <div><h3>Java</h3><p>O launcher escolhe o Java certo por versão.</p></div>
          </div>
          <div class="setting-card-body">
            <div class="field"><label>Caminho do Java</label><input class="input sensitive" type="text" name="javaPath" value="${esc(s.javaPath || 'auto')}" placeholder="auto"></div>
            ${switchLine('autoDownloadJava', s.autoDownloadJava, 'Descarregar Java automaticamente', 'Usa o Adoptium/Temurin quando não encontra Java.')}
            <div class="toolbar-group">
              <button class="btn ghost sm" type="button" data-action="detect-java">${state.javaLoading ? '<span class="spinner"></span>' : icon('search')} Detetar Java</button>
              ${[8, 17, 21, 25].map((major) => `<button class="btn ghost sm" type="button" data-action="download-java" data-major="${major}">${icon('download')} Java ${major}</button>`).join('')}
            </div>
            <div class="detected-list">${javaRows}</div>
          </div>
        </section>

        <section class="setting-card">
          <div class="setting-card-head">
            <span class="stat-icon orange">${icon('archive')}</span>
            <div><h3>Jogo & backups</h3><p>Protege os teus mundos e mantém mods atualizados.</p></div>
          </div>
          <div class="setting-card-body">
            ${switchLine('autoBackup', s.autoBackup, 'Backup automático antes de jogar', 'Cria um ZIP dos mundos em cada arranque.')}
            <div class="field"><label>Backups a manter</label><input class="input" type="number" name="backupLimit" min="1" max="50" value="${Number(s.backupLimit) || 5}"></div>
            ${switchLine('autoUpdateMods', s.autoUpdateMods, 'Atualizar mods ao jogar', 'Procura e aplica atualizações compatíveis antes do arranque.')}
            <div class="field"><label>Pasta de sincronização</label><input class="input sensitive" type="text" name="syncFolder" value="${esc(s.syncFolder || '')}" placeholder="Ex.: C:\\Users\\Nome\\OneDrive\\MineSphere"></div>
            <div class="toolbar-group">
              <button class="btn ghost sm" type="button" data-action="sync-push">${icon('upload')} Enviar configuração</button>
              <button class="btn ghost sm" type="button" data-action="sync-pull">${icon('download')} Receber configuração</button>
            </div>
          </div>
        </section>

        <section class="setting-card">
          <div class="setting-card-head">
            <span class="stat-icon">${icon('key')}</span>
            <div><h3>Integrações</h3><p>Chaves para a Microsoft e CurseForge.</p></div>
          </div>
          <div class="setting-card-body">
            <div class="field"><label>Microsoft Client ID</label><input class="input" type="text" name="microsoftClientId" value="${esc(s.microsoftClientId || '')}"><span class="hint">O ID público pré-configurado usa o fluxo Live Connect. Um UUID de app Azure usa o Entra v2 com “public client flows”. Vê o README.</span></div>
            <div class="field"><label>CurseForge API key</label><input class="input" type="password" name="curseforgeKey" value="${esc(s.curseforgeKey || '')}" autocomplete="off"><span class="hint">Necessária para pesquisar e instalar conteúdo da CurseForge.</span></div>
          </div>
        </section>

        <section class="setting-card">
          <div class="setting-card-head">
            <span class="stat-icon purple">${icon('database')}</span>
            <div><h3>Dados & sistema</h3><p>Exporta, importa e consulta o ambiente.</p></div>
          </div>
          <div class="setting-card-body">
            <div class="toolbar-group">
              <button class="btn ghost sm" type="button" data-action="export-config">${icon('download')} Exportar configuração</button>
              <button class="btn ghost sm" type="button" data-action="import-config">${icon('upload')} Importar configuração</button>
              <input type="file" id="config-import" accept=".json,application/json" class="hidden" data-change="config-import">
            </div>
            ${state.systemError
              ? notice('danger', `Não foi possível obter informações do sistema: ${state.systemError}`, `<button class="btn ghost sm" type="button" data-action="retry-system">${icon('refresh')} Tentar novamente</button>`)
              : system
                ? `<dl class="kv">
                    <dt>Versão</dt><dd>${esc(system.version)}</dd>
                    <dt>Node.js</dt><dd>${esc(system.node)}</dd>
                    <dt>Plataforma</dt><dd>${esc(system.platform)} · ${esc(system.arch)}</dd>
                    <dt>Memória livre</dt><dd>${esc(system.memory?.free || '—')} de ${esc(system.memory?.total || '—')}</dd>
                    <dt>Pasta de dados</dt><dd class="mono sensitive">${esc(system.data)}</dd>
                  </dl>`
                : '<span class="muted small">A carregar informações do sistema...</span>'}
          </div>
        </section>
      </div>
    </form>
    <div style="margin-top:16px">${notice('warning', 'Os tokens de sessão são guardados localmente sem encriptação. Usa apenas este computador e mantém a pasta data protegida.')}</div>
  `;
}

function switchLine(name, checked, title, description, extra = '') {
  return `<label class="setting-line">
    <div><strong>${esc(title)}</strong><span>${esc(description)}</span></div>
    <span class="switch"><input type="checkbox" name="${esc(name)}" ${checked ? 'checked' : ''} ${extra}><span></span></span>
  </label>`;
}

function openModal({ title, subtitle = '', body = '', size = '' }) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = `<div class="modal-overlay" data-action="modal-overlay">
    <div class="modal ${size}" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal-head">
        <div><h2 id="modalTitle">${esc(title)}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div>
        <button class="modal-close" type="button" data-action="close-modal" aria-label="Fechar">${icon('x')}</button>
      </div>
      <div class="modal-body" id="modalBody">${body}</div>
    </div>
  </div>`;
  injectIcons(root);
}

function setModalBody(html) {
  const body = document.getElementById('modalBody');
  if (body) {
    body.innerHTML = html;
    injectIcons(body);
  }
}

function setModalTitle(title, subtitle = '') {
  const heading = document.getElementById('modalTitle');
  if (heading) heading.textContent = title;
  if (subtitle) {
    const paragraph = heading?.parentElement?.querySelector('p');
    if (paragraph) paragraph.textContent = subtitle;
  }
}

function closeModal() {
  stopLoginPoll(true);
  if (state.confirmResolver) {
    const resolve = state.confirmResolver;
    state.confirmResolver = null;
    resolve(false);
  }
  const root = document.getElementById('modalRoot');
  if (root) root.innerHTML = '';
  state.project = null;
  state.modpackModal = null;
  state.detail = { id: null, data: null, tab: 'overview', loading: false, logs: null, logsLoading: false };
}

function confirmDialog(message, options = {}) {
  return new Promise((resolve) => {
    state.confirmResolver = resolve;
    openModal({
      title: options.title || 'Confirmar',
      body: `<p style="margin:0;color:var(--text-soft);font-size:12px;line-height:1.65">${esc(message)}</p>
        <div class="modal-foot" style="margin:20px -21px -20px">
          <button class="btn ghost" type="button" data-action="confirm-no">Cancelar</button>
          <button class="btn ${options.danger === false ? 'primary' : 'danger'}" type="button" data-action="confirm-yes">${esc(options.confirmLabel || 'Confirmar')}</button>
        </div>`,
      size: 'small',
    });
  });
}

async function openInstanceDetail(id) {
  state.detail = { id, data: null, tab: 'overview', loading: true, logs: null, logsLoading: false };
  openModal({ title: 'Instalação', subtitle: 'A carregar detalhes...', body: '<div class="loading-row"><span class="spinner"></span> A carregar instalação...</div>', size: 'xwide' });
  try {
    const data = await api.get(`/api/instances/${encodeURIComponent(id)}`);
    if (state.detail.id !== id) return;
    state.detail.data = data;
    state.detail.loading = false;
    renderDetailModal();
  } catch (error) {
    closeModal();
    toast(error.message, 'error');
  }
}

function renderDetailModal() {
  const detail = state.detail;
  if (!detail.data) return;
  const instance = detail.data.instance;
  const stats = detail.data.stats || {};
  const pack = detail.data.pack;
  setModalTitle(instance.name, `${instance.version} · ${instance.loaderLabel || loaderLabel(instance.loader?.type)}`);
  const tab = detail.tab || 'overview';
  const tabs = [
    ['overview', 'Visão geral'],
    ['backups', `Backups (${detail.data.backups?.length || 0})`],
    ['screenshots', `Capturas (${detail.data.screenshots?.length || 0})`],
    ['worlds', `Mundos (${detail.data.worlds?.length || 0})`],
    ['logs', 'Registos'],
  ];
  const status = instance.running
    ? '<span class="badge success"><span class="dot"></span> A jogar</span>'
    : instance.status === 'installing'
      ? '<span class="badge info"><span class="dot"></span> A instalar</span>'
      : instance.status === 'error'
        ? '<span class="badge error">Erro</span>'
        : '<span class="badge release">Pronta</span>';
  const body = `
    <div class="detail-hero">
      <div class="instance-icon" style="--card-accent:${esc(instance.color || '#39d99f')}">${safeUrl(instance.iconUrl) ? `<img src="${esc(safeUrl(instance.iconUrl))}" alt="">` : esc(instance.icon || '🌍')}</div>
      <div class="detail-hero-info">
        <h3>${esc(instance.name)}</h3>
        <p>${esc(instance.version)} · ${esc(instance.loaderLabel || loaderLabel(instance.loader?.type))} · ${esc(instance.status === 'ready' ? 'pronta' : instance.status)}</p>
      </div>
      ${status}
    </div>
    ${instance.error ? notice('danger', instance.error) : ''}
    <div class="detail-actions">
      ${instance.running
        ? `<button class="btn danger" data-action="stop" data-id="${esc(instance.id)}">${icon('stop')} Parar jogo</button>`
        : `<button class="btn primary" data-action="launch" data-id="${esc(instance.id)}" ${instance.status !== 'ready' ? 'disabled' : ''}>${icon('play')} Jogar</button>`}
      <button class="btn ghost" data-action="repair-instance" data-id="${esc(instance.id)}">${icon('wrench')} Reparar</button>
      <button class="btn ghost" data-action="open-folder" data-id="${esc(instance.id)}">${icon('folder')} Abrir pasta</button>
      <button class="btn ghost" data-action="edit-instance" data-id="${esc(instance.id)}">${icon('edit')} Editar</button>
      ${pack ? `<button class="btn soft" data-action="update-modpack" data-id="${esc(instance.id)}">${icon('refresh')} Atualizar modpack</button>` : ''}
      <button class="btn danger" data-action="delete-instance" data-id="${esc(instance.id)}">${icon('trash')} Apagar</button>
    </div>
    <div class="detail-tabs">
      ${tabs.map(([key, label]) => `<button class="detail-tab ${tab === key ? 'active' : ''}" data-action="detail-tab" data-tab="${key}">${esc(label)}</button>`).join('')}
    </div>
    <div id="detailTabContent">${renderDetailTab(tab, detail.data)}</div>
  `;
  setModalBody(body);
}

function renderDetailTab(tab, data) {
  const instance = data.instance;
  const stats = data.stats || {};
  if (tab === 'backups') {
    return `<div class="detail-section">
      <h4>Backups de mundos <button class="btn soft sm" data-action="create-backup" data-id="${esc(instance.id)}">${icon('archive')} Criar backup</button></h4>
      ${data.backups?.length
        ? data.backups.map((backup) => `<div class="backup-row">
            <span>${icon('archive')}</span>
            <span class="mono" title="${esc(backup.fileName)}">${esc(backup.fileName)}</span>
            <span class="muted">${fmtBytes(backup.size)} · ${esc(fmtDate(backup.createdAt))}</span>
            <button class="btn ghost sm" data-action="restore-backup" data-id="${esc(instance.id)}" data-file="${esc(backup.fileName)}">${icon('rotate')} Restaurar</button>
            <button class="icon-action danger" data-action="delete-backup" data-id="${esc(instance.id)}" data-file="${esc(backup.fileName)}" title="Apagar">${icon('trash')}</button>
          </div>`).join('')
        : '<p class="muted small">Ainda não existem backups. Cria um antes de grandes alterações.</p>'}
    </div>`;
  }
  if (tab === 'screenshots') {
    return `<div class="detail-section">
      <h4>Capturas de ecrã <span class="muted">${data.screenshots?.length || 0} ficheiros</span></h4>
      ${data.screenshots?.length
        ? `<div class="screenshot-grid">${data.screenshots.map((shot) => `<div class="screenshot">
            <a href="${esc(shot.url)}" target="_blank" rel="noreferrer" title="${esc(shot.fileName)}"><img src="${esc(shot.url)}" alt="${esc(shot.fileName)}" loading="lazy"></a>
            <button class="icon-action danger" data-action="delete-screenshot" data-id="${esc(instance.id)}" data-file="${esc(shot.fileName)}" title="Apagar">${icon('trash')}</button>
          </div>`).join('')}</div>`
        : '<p class="muted small">Ainda não há capturas nesta instalação.</p>'}
    </div>`;
  }
  if (tab === 'worlds') {
    return `<div class="detail-section">
      <h4>Mundos <span class="muted">${data.worlds?.length || 0} mundos</span></h4>
      ${data.worlds?.length
        ? `<div class="world-list">${data.worlds.map((world) => `<div class="world-row">
            <span class="item-icon">🌍</span>
            <span class="truncate">${esc(world.name)}</span>
            <span class="muted" style="margin-left:auto">${esc(fmtDate(world.mtime))}</span>
          </div>`).join('')}</div>`
        : '<p class="muted small">Ainda não há mundos nesta instalação. Entra no jogo para criar um.</p>'}
    </div>`;
  }
  if (tab === 'logs') {
    return `<div class="detail-section">
      <h4>Registos <button class="btn ghost sm" data-action="refresh-logs" data-id="${esc(instance.id)}">${state.detail.logsLoading ? '<span class="spinner"></span>' : icon('refresh')} Atualizar</button></h4>
      ${state.detail.logs === null
        ? '<div class="loading-row"><span class="spinner"></span> A carregar registos...</div>'
        : state.detail.logs.length
          ? `<pre class="log-view">${esc(state.detail.logs.join('\n'))}</pre>`
          : '<p class="muted small">Ainda não há registos. Inicia o jogo uma vez para gerar o latest.log.</p>'}
    </div>`;
  }
  const pack = data.pack;
  return `
    <div class="detail-stats">
      <div class="mini-stat"><strong>${fmtNum(stats.modsCount)}</strong><span>Mods</span></div>
      <div class="mini-stat"><strong>${fmtPlaytime(stats.totalPlayMs)}</strong><span>Tempo de jogo</span></div>
      <div class="mini-stat"><strong>${fmtBytes(stats.size)}</strong><span>Tamanho</span></div>
      <div class="mini-stat"><strong>${fmtNum(stats.backups)}</strong><span>Backups</span></div>
    </div>
    <div class="detail-section">
      <h4>Informação</h4>
      <dl class="kv">
        <dt>Versão</dt><dd>${esc(instance.version)} ${instance.versionType ? `<span class="badge ${versionTypeClass(instance.versionType)}">${esc(versionTypeLabel(instance.versionType))}</span>` : ''}</dd>
        <dt>Loader</dt><dd>${esc(loaderLabel(instance.loader?.type))}${instance.loader?.version ? ` ${esc(instance.loader.version)}` : ''}</dd>
        <dt>Versão do jogo</dt><dd class="mono">${esc(instance.versionId || instance.version)}</dd>
        <dt>Memória</dt><dd>${instance.ramMb ? `${fmtBytes(instance.ramMb * 1024 * 1024)} máx.` : 'Automática'}${instance.minRamMb ? ` · ${fmtBytes(instance.minRamMb * 1024 * 1024)} mín.` : ''}</dd>
        <dt>Java</dt><dd class="sensitive">${esc(instance.javaPath || 'auto')}</dd>
        <dt>Entrar automaticamente</dt><dd>${esc(autoJoinSummary(instance.autoJoin))}</dd>
        <dt>Pasta</dt><dd class="mono sensitive">${esc(instance.gameDir)}</dd>
        <dt>Último jogo</dt><dd>${esc(fmtDate(instance.lastPlayed))}</dd>
        <dt>Notas</dt><dd>${esc(instance.notes || '—')}</dd>
      </dl>
    </div>
    ${pack ? `<div class="detail-section"><h4>Modpack</h4><dl class="kv">
      <dt>Nome</dt><dd>${esc(pack.name || instance.name)}</dd>
      <dt>Versão</dt><dd>${esc(pack.versionId || '—')}</dd>
      <dt>Fonte</dt><dd>${esc(pack.source || '—')}</dd>
      <dt>Projeto</dt><dd class="mono">${esc(pack.projectId || '—')}</dd>
    </dl></div>` : ''}
  `;
}

async function refreshDetail() {
  if (!state.detail.id || !document.getElementById('modalBody')) return;
  const id = state.detail.id;
  try {
    const data = await api.get(`/api/instances/${encodeURIComponent(id)}`);
    if (state.detail.id !== id) return;
    state.detail.data = data;
    renderDetailModal();
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function loadDetailLogs(id) {
  state.detail.logsLoading = true;
  renderDetailModal();
  try {
    const data = await api.get(`/api/instances/${encodeURIComponent(id)}/logs?limit=300`);
    state.detail.logs = data.lines || [];
  } catch (error) {
    state.detail.logs = [`Erro ao carregar registos: ${error.message}`];
  } finally {
    state.detail.logsLoading = false;
    if (state.detail.id === id) renderDetailModal();
  }
}

async function ensureVersionCache() {
  if (state.versionCache) return state.versionCache;
  const data = await api.get('/api/versions?limit=1000');
  state.versionCache = data.versions || [];
  return state.versionCache;
}

async function openNewInstance(presetVersion = null) {
  openModal({ title: 'Nova instalação', subtitle: 'Escolhe a versão e o loader.', body: '<div class="loading-row"><span class="spinner"></span> A carregar versões...</div>', size: 'wide' });
  try {
    const versions = await ensureVersionCache();
    const selected = presetVersion || versions.find((version) => version.type === 'release')?.id || versions[0]?.id || '';
    setModalBody(renderNewInstanceForm(versions, selected));
    await refreshLoaderOptions();
  } catch (error) {
    setModalBody(`<div class="notice danger">${icon('alert')}<div>${esc(error.message)}</div></div>`);
  }
}

function autoJoinFields(autoJoin = {}) {
  const type = autoJoin.type === 'server' || autoJoin.type === 'world' ? autoJoin.type : 'off';
  const server = type === 'server' ? String(autoJoin.server || '') : '';
  const port = Number(autoJoin.port) || 25565;
  const world = type === 'world' ? String(autoJoin.world || '') : '';
  return `
    <div class="field span-2">
      <label>Entrar automaticamente</label>
      <select class="select" name="autoJoinType" data-change="autojoin-type">
        <option value="off" ${type === 'off' ? 'selected' : ''}>Não entrar automaticamente</option>
        <option value="server" ${type === 'server' ? 'selected' : ''}>Entrar num servidor</option>
        <option value="world" ${type === 'world' ? 'selected' : ''}>Abrir um mundo</option>
      </select>
      <span class="hint">Aplica-se sempre que iniciares esta instalação.</span>
    </div>
    <div class="field span-2 ${type === 'server' ? '' : 'hidden'}" data-autojoin-field="server">
      <label>Servidor</label>
      <div class="form-row">
        <input class="input" type="text" name="autoJoinServer" maxlength="255" value="${esc(server)}" placeholder="play.exemplo.pt">
        <input class="input" type="number" name="autoJoinPort" min="1" max="65535" value="${port}" placeholder="25565" style="max-width:140px">
      </div>
    </div>
    <div class="field span-2 ${type === 'world' ? '' : 'hidden'}" data-autojoin-field="world">
      <label>Mundo</label>
      <input class="input" type="text" name="autoJoinWorld" maxlength="128" value="${esc(world)}" placeholder="Nome da pasta em saves">
      <span class="hint">Requer Minecraft 1.20 ou superior. Usa o nome da pasta do mundo, não o nome visível no jogo.</span>
    </div>`;
}

function autoJoinSummary(autoJoin) {
  if (!autoJoin || autoJoin.type === 'off') return 'Não';
  if (autoJoin.type === 'server') {
    const port = Number(autoJoin.port) || 25565;
    return `Servidor · ${autoJoin.server}${port === 25565 ? '' : `:${port}`}`;
  }
  if (autoJoin.type === 'world') return `Mundo · ${autoJoin.world}`;
  return 'Não';
}

function toggleAutoJoinFields(select) {
  const form = select.closest('form');
  if (!form) return;
  const type = select.value;
  form.querySelectorAll('[data-autojoin-field]').forEach((field) => {
    field.classList.toggle('hidden', field.dataset.autojoinField !== type);
  });
}

function renderNewInstanceForm(versions, selected) {
  const options = versions.map((version) => `<option value="${esc(version.id)}" ${version.id === selected ? 'selected' : ''}>${esc(version.id)} · ${esc(versionTypeLabel(version.type))}</option>`).join('');
  return `<form id="new-instance-form" data-form="new-instance">
    <div class="form-grid">
      <div class="field span-2"><label>Nome</label><input class="input" type="text" name="name" id="new-name" maxlength="48" placeholder="Ex.: Aventura com amigos"></div>
      <div class="field"><label>Versão do Minecraft</label><select class="select" name="version" id="new-version" data-change="new-version">${options}</select></div>
      <div class="field"><label>Loader</label>
        <select class="select" name="loaderType" id="new-loader" data-change="new-loader">
          <option value="vanilla">Vanilla</option>
          <option value="fabric">Fabric</option>
          <option value="quilt">Quilt</option>
          <option value="forge">Forge</option>
          <option value="neoforge">NeoForge</option>
          <option value="liteloader" disabled>LiteLoader (não suportado)</option>
        </select>
      </div>
      <div class="field"><label>Versão do loader</label><select class="select" name="loaderVersion" id="new-loader-version" disabled><option value="">Não aplicável</option></select><span class="hint" id="loader-version-hint">Automático é a opção recomendada.</span></div>
      <div class="field"><label>Ícone</label><input class="input" type="text" name="icon" id="new-icon" maxlength="4" value="🌍" placeholder="🌍"></div>
      <div class="field"><label>Cor</label><input class="input" type="color" name="color" id="new-color" value="#39d99f" style="padding:4px;height:42px"></div>
      <div class="field span-2"><label>Notas (opcional)</label><input class="input" type="text" name="notes" id="new-notes" maxlength="300" placeholder="Para que serve esta instalação?"></div>
      ${autoJoinFields()}
    </div>
    <details style="margin-top:16px">
      <summary class="muted small" style="cursor:pointer;font-weight:700">Definições avançadas</summary>
      <div class="form-grid" style="margin-top:12px">
        <div class="field"><label>RAM máxima (MB)</label><input class="input" type="number" name="ramMb" min="512" max="65536" placeholder="Automática"></div>
        <div class="field"><label>RAM mínima (MB)</label><input class="input" type="number" name="minRamMb" min="256" max="8192" placeholder="Automática"></div>
        <div class="field span-2"><label>Argumentos JVM</label><input class="input" type="text" name="jvmArgs" placeholder="Usar predefinição"></div>
        <div class="field span-2"><label>Java</label><input class="input sensitive" type="text" name="javaPath" placeholder="auto"></div>
      </div>
    </details>
    <div class="modal-foot" style="margin:20px -21px -20px">
      <button class="btn ghost" type="button" data-action="close-modal">Cancelar</button>
      <button class="btn primary" type="submit">${icon('plus')} Criar e instalar</button>
    </div>
  </form>`;
}

async function refreshLoaderOptions() {
  const versionSelect = document.getElementById('new-version');
  const loaderSelect = document.getElementById('new-loader');
  const target = document.getElementById('new-loader-version');
  const hint = document.getElementById('loader-version-hint');
  if (!versionSelect || !loaderSelect || !target) return;
  const version = versionSelect.value;
  const type = loaderSelect.value;
  if (type === 'vanilla') {
    target.innerHTML = '<option value="">Não aplicável</option>';
    target.disabled = true;
    if (hint) hint.textContent = 'A versão Vanilla não usa loader.';
    return;
  }
  target.disabled = true;
  target.innerHTML = '<option value="">A carregar...</option>';
  if (hint) hint.textContent = 'A obter versões compatíveis...';
  try {
    const data = await api.get(`/api/loaders?version=${encodeURIComponent(version)}&type=${encodeURIComponent(type)}`);
    if (document.getElementById('new-version')?.value !== version || document.getElementById('new-loader')?.value !== type) return;
    const options = (data.loaders || []).map((entry) => {
      const label = entry.recommended ? ' · recomendado' : entry.latest ? ' · mais recente' : '';
      return `<option value="${esc(entry.version)}">${esc(entry.version)}${label}</option>`;
    });
    target.innerHTML = '<option value="">Automático (recomendado)</option>' + options.join('');
    target.disabled = false;
    if (hint) hint.textContent = options.length ? `${data.loaders.length} versões compatíveis.` : 'Nenhuma versão encontrada para esta combinação.';
  } catch (error) {
    if (document.getElementById('new-version')?.value !== version || document.getElementById('new-loader')?.value !== type) return;
    target.innerHTML = '<option value="">Automático</option>';
    target.disabled = false;
    if (hint) hint.textContent = error.message;
  }
}

function openEditInstance(id) {
  const instance = instanceById(id);
  if (!instance) return;
  openModal({ title: 'Editar instalação', subtitle: instance.name, body: `<form id="edit-instance-form" data-form="edit-instance">
    <input type="hidden" name="id" value="${esc(instance.id)}">
    <div class="form-grid">
      <div class="field span-2"><label>Nome</label><input class="input" type="text" name="name" maxlength="48" value="${esc(instance.name)}"></div>
      <div class="field"><label>Ícone</label><input class="input" type="text" name="icon" maxlength="4" value="${esc(instance.icon || '🌍')}"></div>
      <div class="field"><label>Cor</label><input class="input" type="color" name="color" value="${esc(instance.color || '#39d99f')}" style="padding:4px;height:42px"></div>
      <div class="field"><label>RAM máxima (MB)</label><input class="input" type="number" name="ramMb" min="512" max="65536" value="${instance.ramMb || ''}" placeholder="Automática"></div>
      <div class="field"><label>RAM mínima (MB)</label><input class="input" type="number" name="minRamMb" min="256" max="8192" value="${instance.minRamMb || ''}" placeholder="Automática"></div>
      <div class="field span-2"><label>Argumentos JVM</label><textarea class="textarea" name="jvmArgs" rows="2">${esc(instance.jvmArgs || '')}</textarea></div>
      <div class="field"><label>Java</label><input class="input sensitive" type="text" name="javaPath" value="${esc(instance.javaPath || 'auto')}"></div>
      <div class="field"><label>Resolução (largura × altura)</label>
        <div class="form-row"><input class="input" type="number" name="resolutionWidth" min="0" max="7680" value="${Number(instance.resolutionWidth) || 0}" placeholder="Largura"><input class="input" type="number" name="resolutionHeight" min="0" max="4320" value="${Number(instance.resolutionHeight) || 0}" placeholder="Altura"></div>
      </div>
      <div class="field span-2"><label>Notas</label><textarea class="textarea" name="notes" rows="2" maxlength="2000">${esc(instance.notes || '')}</textarea></div>
      ${autoJoinFields(instance.autoJoin)}
    </div>
    <div class="modal-foot" style="margin:20px -21px -20px">
      <button class="btn ghost" type="button" data-action="close-modal">Cancelar</button>
      <button class="btn primary" type="submit">${icon('save')} Guardar</button>
    </div>
  </form>` });
}

function openDeleteInstance(id) {
  const instance = instanceById(id);
  if (!instance) return;
  openModal({ title: 'Apagar instalação', body: `<p style="margin:0;color:var(--text-soft);line-height:1.6">Tens a certeza que queres apagar <strong>${esc(instance.name)}</strong>? Esta ação não pode ser desfeita.</p>
    <label class="setting-line" style="margin-top:16px"><div><strong>Apagar também os ficheiros</strong><span>Remove mundos, mods, capturas e configurações desta instância.</span></div><span class="switch"><input type="checkbox" id="delete-files" checked><span></span></span></label>
    <div class="modal-foot" style="margin:20px -21px -20px">
      <button class="btn ghost" type="button" data-action="close-modal">Cancelar</button>
      <button class="btn danger" type="button" data-action="delete-instance-confirm" data-id="${esc(id)}">${icon('trash')} Apagar</button>
    </div>`, size: 'small' });
}

async function openProject(source, id, projectType = 'mod') {
  const instanceId = state.page === 'resources' ? state.resources.instanceId : state.mods.instanceId;
  const world = state.page === 'resources' && state.resources.type === 'datapack' ? state.resources.world : null;
  state.project = { source, id, projectType, instanceId, world, data: null };
  openModal({ title: 'Projeto', subtitle: 'A carregar detalhes...', body: '<div class="loading-row"><span class="spinner"></span> A carregar projeto...</div>', size: 'wide' });
  try {
    const params = new URLSearchParams({ source, id });
    if (instanceId) params.set('instanceId', instanceId);
    const data = await api.get(`/api/mods/project?${params.toString()}`);
    state.project.data = data;
    renderProjectModal();
  } catch (error) {
    setModalBody(`<div class="notice danger">${icon('alert')}<div>${esc(error.message)}</div></div>`);
  }
}

function renderProjectModal() {
  const context = state.project;
  if (!context?.data) return;
  const project = context.data.project;
  const versions = context.data.versions || [];
  const type = project.project_type || context.projectType || 'mod';
  const iconUrl = safeUrl(project.icon_url || project.iconUrl);
  const gallery = (project.gallery || []).map((image) => safeUrl(typeof image === 'string' ? image : image.url)).filter(Boolean).slice(0, 6);
  const description = plainText(project.body || project.description || project.summary || '').slice(0, 2600);
  setModalTitle(project.title || 'Projeto', `${projectTypeLabel(type)} · ${context.source === 'curseforge' ? 'CurseForge' : 'Modrinth'}`);
  const body = `
    <div class="modal-project-head">
      <div class="modal-icon">${iconUrl ? `<img src="${esc(iconUrl)}" alt="">` : projectTypeIcon(type)}</div>
      <div><h3>${esc(project.title || 'Projeto')}</h3><p>${fmtCompact(project.downloads)} downloads · ${fmtCompact(project.followers || project.follows)} seguidores</p></div>
    </div>
    ${gallery.length ? `<div class="gallery">${gallery.map((image) => `<img src="${esc(image)}" alt="" loading="lazy">`).join('')}</div>` : ''}
    <p class="muted" style="font-size:11.5px;line-height:1.7;white-space:pre-line;max-height:260px;overflow:auto">${esc(description || 'Sem descrição disponível.')}</p>
    ${versions.length
      ? `<div class="version-picker">
          <label class="field"><span style="font-size:11px;font-weight:700">Versão a instalar</span>
            <select class="select" id="project-version">
              ${versions.map((version) => `<option value="${esc(version.id)}">${esc(version.versionNumber || version.name || version.id)}${version.gameVersions?.length ? ` · ${esc(version.gameVersions.slice(0, 3).join(', '))}` : ''}</option>`).join('')}
            </select>
          </label>
        </div>`
      : '<div class="notice warning">' + icon('alert') + '<div>Não há versões compatíveis com esta instalação.</div></div>'}
    <div class="modal-foot" style="margin:20px -21px -20px">
      ${project.html_url || project.links?.websiteUrl ? `<a class="btn ghost" href="${esc(project.html_url || project.links.websiteUrl)}" target="_blank" rel="noreferrer">${icon('external')} Abrir página</a>` : ''}
      <button class="btn ghost" type="button" data-action="close-modal">Fechar</button>
      <button class="btn primary" type="button" data-action="install-project" data-source="${esc(context.source)}" data-project="${esc(project.id || project.slug || context.id)}" data-type="${esc(type)}" ${!versions.length ? 'disabled' : ''}>${icon('download')} Instalar</button>
    </div>
  `;
  setModalBody(body);
}

async function openModpack(hit) {
  if (!hit) return;
  state.modpackModal = { hit, versions: [], loading: true };
  openModal({ title: hit.title || 'Modpack', subtitle: 'A carregar versões...', body: '<div class="loading-row"><span class="spinner"></span> A carregar modpack...</div>', size: 'wide' });
  try {
    const data = await api.get(`/api/modpacks/versions?projectId=${encodeURIComponent(hit.id)}`);
    state.modpackModal.versions = data.versions || [];
    renderModpackModal();
  } catch (error) {
    setModalBody(`<div class="notice danger">${icon('alert')}<div>${esc(error.message)}</div></div>`);
  }
}

function renderModpackModal() {
  const context = state.modpackModal;
  if (!context) return;
  const hit = context.hit;
  const iconUrl = safeUrl(hit.iconUrl);
  const versions = context.versions || [];
  setModalTitle(hit.title || 'Modpack', 'Modpack · Modrinth');
  const body = `
    <div class="modal-project-head">
      <div class="modal-icon">${iconUrl ? `<img src="${esc(iconUrl)}" alt="">` : '📦'}</div>
      <div><h3>${esc(hit.title)}</h3><p>${esc(hit.author || 'Modrinth')} · ${fmtCompact(hit.downloads)} downloads</p></div>
    </div>
    <p class="muted" style="font-size:11.5px;line-height:1.7">${esc(hit.description || '')}</p>
    <div class="version-picker">
      <label class="field"><span style="font-size:11px;font-weight:700">Versão do modpack</span>
        <select class="select" id="modpack-version">
          ${versions.map((version) => `<option value="${esc(version.id)}">${esc(version.versionNumber || version.name || version.id)}${version.gameVersions?.length ? ` · ${esc(version.gameVersions.slice(0, 3).join(', '))}` : ''}</option>`).join('')}
        </select>
      </label>
    </div>
    ${versions.length ? '' : '<div class="notice warning">' + icon('alert') + '<div>Este modpack não tem versões disponíveis.</div></div>'}
    <div class="modal-foot" style="margin:20px -21px -20px">
      <button class="btn ghost" type="button" data-action="close-modal">Cancelar</button>
      <button class="btn primary" type="button" data-action="install-modpack-version" data-project="${esc(hit.id)}" ${!versions.length ? 'disabled' : ''}>${icon('download')} Instalar modpack</button>
    </div>
  `;
  setModalBody(body);
}

async function openImportModal() {
  openModal({ title: 'Importar modpack', subtitle: 'Aceita .mrpack, ZIP da CurseForge ou ZIP genérico.', body: '<div class="loading-row"><span class="spinner"></span> A carregar versões...</div>', size: 'wide' });
  try {
    const versions = await ensureVersionCache();
    const selected = versions.find((version) => version.type === 'release')?.id || versions[0]?.id || '';
    setModalBody(`<form id="import-form" data-form="import-modpack">
      <div class="form-grid">
        <div class="field span-2"><label>Ficheiro do modpack</label><input class="input" type="file" name="file" id="import-file" accept=".mrpack,.zip,application/zip" required><span class="hint">.mrpack do Modrinth, ZIP exportado da CurseForge ou ZIP com mods/config.</span></div>
        <div class="field span-2"><label>Nome da instalação (opcional)</label><input class="input" type="text" name="name" maxlength="48" placeholder="Nome do modpack"></div>
        <div class="field"><label>Versão do Minecraft</label><select class="select" name="version" id="import-version">${versions.map((version) => `<option value="${esc(version.id)}" ${version.id === selected ? 'selected' : ''}>${esc(version.id)} · ${esc(versionTypeLabel(version.type))}</option>`).join('')}</select><span class="hint">Ignorado para .mrpack e manifest da CurseForge.</span></div>
        <div class="field"><label>Loader (ZIP genérico)</label><select class="select" name="loaderType"><option value="vanilla">Vanilla</option><option value="fabric">Fabric</option><option value="quilt">Quilt</option><option value="forge">Forge</option><option value="neoforge">NeoForge</option></select></div>
        <div class="field span-2"><label>Versão do loader (opcional)</label><input class="input" type="text" name="loaderVersion" placeholder="Automático"></div>
      </div>
      <div id="import-progress" class="hidden" style="margin-top:16px">
        <div class="activity-stage"><span id="import-stage">A enviar ficheiro...</span><span id="import-percent">0%</span></div>
        <div class="progress" style="height:6px;border-radius:999px;background:var(--panel-3);overflow:hidden;margin-top:6px"><div id="import-bar" style="height:100%;width:0;background:linear-gradient(90deg,var(--accent),var(--accent-2));transition:width .2s"></div></div>
      </div>
      <div class="modal-foot" style="margin:20px -21px -20px">
        <button class="btn ghost" type="button" data-action="close-modal">Cancelar</button>
        <button class="btn primary" type="submit">${icon('upload')} Importar e instalar</button>
      </div>
    </form>`);
  } catch (error) {
    setModalBody(`<div class="notice danger">${icon('alert')}<div>${esc(error.message)}</div></div>`);
  }
}

function openExportModal() {
  if (!state.installations.length) {
    toast('Cria uma instalação antes de exportar.', 'warning');
    return;
  }
  const selected = selectedInstance() || state.installations[0];
  openModal({ title: 'Exportar instância', subtitle: 'Cria um modpack partilhável.', body: `<div class="form-grid">
    <div class="field span-2"><label>Instalação</label><select class="select" id="export-instance">${state.installations.map((item) => `<option value="${esc(item.id)}" ${item.id === selected.id ? 'selected' : ''}>${esc(item.name)} · ${esc(item.version)}</option>`).join('')}</select></div>
    <div class="field span-2"><label>Formato</label><select class="select" id="export-format"><option value="mrpack">.mrpack (Modrinth, recomendado)</option><option value="zip">.zip completo (mods + config)</option></select></div>
  </div>
  <div class="modal-foot" style="margin:20px -21px -20px">
    <button class="btn ghost" type="button" data-action="close-modal">Cancelar</button>
    <button class="btn primary" type="button" data-action="do-export">${icon('download')} Exportar</button>
  </div>`, size: 'small' });
}

async function openOfflineModal() {
  openModal({ title: 'Conta offline', subtitle: 'Um perfil local para jogar sem conta Microsoft.', body: `<form id="offline-form" data-form="offline" novalidate>
    <div class="field"><label>Nome de utilizador</label><input class="input" type="text" name="name" id="offline-name" minlength="3" maxlength="16" pattern="[A-Za-z0-9_]+" placeholder="Ex.: Steve" aria-describedby="offline-error" required><span class="hint">3 a 16 caracteres: letras, números e _.</span><div class="field-error" id="offline-error" role="alert"></div></div>
    <div class="modal-foot" style="margin:20px -21px -20px">
      <button class="btn ghost" type="button" data-action="close-modal">Cancelar</button>
      <button class="btn primary" type="submit">${icon('user')} Criar conta</button>
    </div>
  </form>`, size: 'small' });
  setTimeout(() => document.getElementById('offline-name')?.focus(), 0);
}

async function openMicrosoftModal() {
  stopLoginPoll(true);
  openModal({ title: 'Entrar com Microsoft', subtitle: 'Início de sessão por código de dispositivo.', body: '<div class="loading-row"><span class="spinner"></span> A pedir código à Microsoft...</div>', size: 'small' });
  try {
    const data = await api.post('/api/auth/microsoft/start');
    state.login = { id: data.login.id, status: data.login, timer: null };
    renderMicrosoftBody();
    scheduleMicrosoftPoll();
  } catch (error) {
    setModalBody(`<div class="notice danger">${icon('alert')}<div>${esc(error.message)}</div></div>
      <div class="modal-foot" style="margin:20px -21px -20px">
        <button class="btn ghost" type="button" data-action="close-modal">Fechar</button>
        <button class="btn primary" type="button" data-page="settings">Abrir definições</button>
      </div>`);
  }
}

function renderMicrosoftBody() {
  const login = state.login?.status;
  if (!login) return;
  if (login.status === 'success') {
    setModalBody(`<div class="empty-state" style="border:0;background:transparent;min-height:220px"><span class="empty-icon" style="color:var(--success)">${icon('check')}</span><h3>Sessão iniciada!</h3><p>${esc(login.account?.name || login.message || 'Conta adicionada.')}</p><button class="btn primary" type="button" data-action="close-modal">Continuar</button></div>`);
    return;
  }
  if (['failed', 'expired', 'cancelled'].includes(login.status)) {
    setModalBody(`<div class="notice danger">${icon('alert')}<div>${esc(login.error || 'Não foi possível iniciar sessão.')}</div></div>
      <div class="modal-foot" style="margin:20px -21px -20px">
        <button class="btn ghost" type="button" data-action="close-modal">Fechar</button>
        <button class="btn primary" type="button" data-action="retry-microsoft">${icon('refresh')} Tentar novamente</button>
      </div>`);
    return;
  }
  const verification = safeUrl(login.verificationUri);
  setModalBody(`<p class="muted small" style="margin:0 0 10px">Abre a página da Microsoft e introduz este código:</p>
    <div class="code-box"><strong>${esc(login.userCode || '...')}</strong><button class="icon-btn" type="button" data-action="copy-code" title="Copiar código">${icon('copy')}</button></div>
    <ol class="steps">
      <li>Abre <a href="${esc(verification)}" target="_blank" rel="noreferrer">${esc(verification || 'microsoft.com/link')}</a> no teu navegador.</li>
      <li>Introduz o código acima e inicia sessão com a conta Microsoft.</li>
      <li>Volta aqui. O MineSphere deteta a sessão automaticamente.</li>
    </ol>
    <div class="loading-row" style="padding:10px 0"><span class="spinner"></span> À espera da confirmação da Microsoft...</div>
    <div class="modal-foot" style="margin:20px -21px -20px">
      <button class="btn ghost" type="button" data-action="close-modal">Cancelar</button>
      <a class="btn primary" href="${esc(verification)}" target="_blank" rel="noreferrer">${icon('external')} Abrir Microsoft</a>
    </div>`);
}

function scheduleMicrosoftPoll() {
  if (!state.login) return;
  const interval = Math.max(2, Number(state.login.status?.interval) || 5) * 1000;
  state.login.timer = setTimeout(pollMicrosoft, interval);
}

async function pollMicrosoft() {
  if (!state.login) return;
  try {
    const data = await api.get(`/api/auth/microsoft/status?id=${encodeURIComponent(state.login.id)}`);
    if (!state.login) return;
    state.login.status = data.login;
    renderMicrosoftBody();
    if (data.login.status === 'success') {
      stopLoginPoll(false);
      setTimeout(async () => {
        closeModal();
        await refreshApp();
        toast(streamerMode() ? 'Sessão Microsoft iniciada.' : `Sessão iniciada como ${data.login.account?.name || 'conta Microsoft'}.`, 'success');
      }, 700);
      return;
    }
    if (['failed', 'expired', 'cancelled'].includes(data.login.status)) {
      stopLoginPoll(false);
      return;
    }
    scheduleMicrosoftPoll();
  } catch (error) {
    if (!state.login) return;
    setModalBody(`<div class="notice danger">${icon('alert')}<div>${esc(error.message)}</div></div>
      <div class="modal-foot" style="margin:20px -21px -20px">
        <button class="btn ghost" type="button" data-action="close-modal">Fechar</button>
        <button class="btn primary" type="button" data-action="retry-microsoft">Tentar novamente</button>
      </div>`);
  }
}

function stopLoginPoll(cancel = false) {
  if (state.login?.timer) clearTimeout(state.login.timer);
  if (cancel && state.login?.id) {
    api.post('/api/auth/microsoft/cancel', { id: state.login.id }).catch(() => {});
  }
  state.login = null;
}

async function loadVersions(reset = true) {
  const versions = state.versions;
  const requestId = ++versions.requestId;
  versions.loading = true;
  versions.loaded = true;
  versions.error = null;
  if (reset) {
    versions.offset = 0;
    versions.list = [];
  }
  renderPage();
  const offset = reset ? 0 : versions.list.length;
  try {
    const params = new URLSearchParams({
      type: versions.type,
      search: versions.query,
      limit: '100',
      offset: String(offset),
    });
    const data = await api.get(`/api/versions?${params.toString()}`);
    if (requestId !== versions.requestId) return;
    versions.total = data.total || 0;
    versions.list = reset ? data.versions || [] : [...versions.list, ...(data.versions || [])];
    versions.offset = versions.list.length;
  } catch (error) {
    if (requestId === versions.requestId) versions.error = error.message;
  } finally {
    if (requestId === versions.requestId) {
      versions.loading = false;
      renderPage();
    }
  }
}

async function loadModsSearch() {
  const mods = state.mods;
  const requestId = ++mods.requestId;
  mods.loading = true;
  mods.loaded = true;
  mods.error = null;
  if (mods.source === 'github') {
    mods.github.loading = true;
    mods.github.repo = null;
    mods.github.releases = [];
  }
  renderPage();
  try {
    if (mods.source === 'github') {
      const data = await api.get(`/api/github/search?query=${encodeURIComponent(mods.query)}`);
      if (requestId !== mods.requestId) return;
      mods.github.results = data.hits || [];
      mods.github.total = data.total || 0;
    } else {
      const params = new URLSearchParams({
        source: mods.source,
        query: mods.query,
        projectType: 'mod',
        limit: '24',
        sort: mods.sort,
      });
      if (mods.instanceId) params.set('instanceId', mods.instanceId);
      const data = await api.get(`/api/mods/search?${params.toString()}`);
      if (requestId !== mods.requestId) return;
      mods.results = data.hits || [];
      mods.total = data.total || 0;
    }
  } catch (error) {
    if (requestId === mods.requestId) {
      mods.error = error.message;
      if (mods.source === 'github') mods.github.results = [];
      else mods.results = [];
    }
  } finally {
    if (requestId === mods.requestId) {
      mods.loading = false;
      mods.github.loading = false;
      renderPage();
    }
  }
}

async function loadInstalledMods() {
  const mods = state.mods;
  if (!mods.instanceId) {
    mods.installed = [];
    mods.installedLoaded = true;
    mods.installedLoading = false;
    return;
  }
  const requestId = (mods.installedRequestId || 0) + 1;
  mods.installedRequestId = requestId;
  mods.installedLoading = true;
  mods.installedLoaded = true;
  renderPage();
  try {
    const data = await api.get(`/api/instances/${encodeURIComponent(mods.instanceId)}/mods`);
    if (requestId !== mods.installedRequestId) return;
    mods.installed = (data.mods || []).filter((item) => item.projectType === 'mod' || item.folder === 'mods');
  } catch (error) {
    if (requestId === mods.installedRequestId) {
      mods.installed = [];
      toast(error.message, 'error');
    }
  } finally {
    if (requestId === mods.installedRequestId) {
      mods.installedLoading = false;
      renderPage();
    }
  }
}

async function loadModpacks() {
  const modpacks = state.modpacks;
  const requestId = ++modpacks.requestId;
  modpacks.loading = true;
  modpacks.loaded = true;
  modpacks.error = null;
  renderPage();
  try {
    const params = new URLSearchParams({
      query: modpacks.query,
      limit: '24',
      sort: 'downloads',
    });
    const data = await api.get(`/api/modpacks/search?${params.toString()}`);
    if (requestId !== modpacks.requestId) return;
    modpacks.results = data.hits || [];
    modpacks.total = data.total || 0;
  } catch (error) {
    if (requestId === modpacks.requestId) {
      modpacks.error = error.message;
      modpacks.results = [];
    }
  } finally {
    if (requestId === modpacks.requestId) {
      modpacks.loading = false;
      renderPage();
    }
  }
}

async function loadWorlds() {
  const resources = state.resources;
  if (!resources.instanceId) {
    resources.worlds = [];
    resources.world = '';
    resources.worldsLoaded = true;
    resources.worldsLoading = false;
    return;
  }
  resources.worldsLoading = true;
  renderPage();
  try {
    const data = await api.get(`/api/instances/${encodeURIComponent(resources.instanceId)}/worlds`);
    resources.worlds = data.worlds || [];
    if (resources.type === 'datapack' && !resources.worlds.some((world) => world.name === resources.world)) {
      resources.world = resources.worlds[0]?.name || '';
    }
  } catch (error) {
    resources.worlds = [];
    resources.world = '';
    toast(error.message, 'error');
  } finally {
    resources.worldsLoaded = true;
    resources.worldsLoading = false;
    renderPage();
    if (resources.type === 'datapack') loadInstalledResources();
  }
}

async function loadInstalledResources() {
  const resources = state.resources;
  if (!resources.instanceId || (resources.type === 'datapack' && !resources.world)) {
    resources.installed = [];
    resources.installedLoaded = true;
    resources.installedLoading = false;
    return;
  }
  const requestId = (resources.installedRequestId || 0) + 1;
  resources.installedRequestId = requestId;
  resources.installedLoading = true;
  resources.installedLoaded = true;
  renderPage();
  try {
    const query = resources.type === 'datapack' ? `?world=${encodeURIComponent(resources.world)}` : '';
    const data = await api.get(`/api/instances/${encodeURIComponent(resources.instanceId)}/mods${query}`);
    if (requestId !== resources.installedRequestId) return;
    resources.installed = (data.mods || []).filter((item) => {
      if (item.projectType !== resources.type) return false;
      if (resources.type === 'datapack' && item.world && item.world !== resources.world) return false;
      return true;
    });
  } catch (error) {
    if (requestId === resources.installedRequestId) {
      resources.installed = [];
      toast(error.message, 'error');
    }
  } finally {
    if (requestId === resources.installedRequestId) {
      resources.installedLoading = false;
      renderPage();
    }
  }
}

async function loadResources() {
  const resources = state.resources;
  if (resources.type === 'datapack' && resources.source !== 'modrinth') {
    resources.source = 'modrinth';
  }
  const requestId = ++resources.requestId;
  resources.loading = true;
  resources.loaded = true;
  resources.error = null;
  renderPage();
  try {
    const params = new URLSearchParams({
      source: resources.source,
      type: resources.type,
      query: resources.query,
      limit: '24',
      sort: resources.sort,
    });
    if (resources.instanceId) params.set('instanceId', resources.instanceId);
    const data = await api.get(`/api/resources/search?${params.toString()}`);
    if (requestId !== resources.requestId) return;
    resources.results = data.hits || [];
    resources.total = data.total || 0;
  } catch (error) {
    if (requestId === resources.requestId) {
      resources.error = error.message;
      resources.results = [];
    }
  } finally {
    if (requestId === resources.requestId) {
      resources.loading = false;
      renderPage();
    }
  }
}

async function loadGithubReleases(repo) {
  state.mods.github.repo = repo;
  state.mods.github.releasesLoading = true;
  state.mods.github.releases = [];
  renderPage();
  try {
    const data = await api.get(`/api/github/releases?repo=${encodeURIComponent(repo)}`);
    state.mods.github.releases = data.releases || [];
  } catch (error) {
    toast(error.message, 'error');
    state.mods.github.repo = null;
  } finally {
    state.mods.github.releasesLoading = false;
    renderPage();
  }
}

async function loadSystem() {
  if (state.systemLoading || state.system) return;
  state.systemLoading = true;
  try {
    state.system = await api.get('/api/system');
    state.systemError = null;
  } catch (error) {
    state.systemError = error.message;
  } finally {
    state.systemLoading = false;
    if (state.page === 'settings') renderPage();
  }
}

async function loadJavaDetect(refresh = false) {
  if (state.javaLoading) return;
  state.javaLoading = true;
  renderPage();
  try {
    const data = await api.get(`/api/java/detect${refresh ? '?refresh=1' : ''}`);
    state.javaDetected = data.detected || [];
    state.javaRuntime = data.runtime || null;
  } catch (error) {
    toast(error.message, 'error');
    state.javaDetected = [];
  } finally {
    state.javaLoading = false;
    if (state.page === 'settings') renderPage();
  }
}

async function refreshApp() {
  try {
    const data = await api.get('/api/state');
    hydrate(data);
    renderPage();
  } catch (error) {
    toast(error.message, 'error');
  }
}

function toast(message, type = 'info') {
  const root = document.getElementById('toastRoot');
  if (!root) return;
  const element = document.createElement('div');
  element.className = `toast ${type}`;
  const iconName = type === 'error' || type === 'warning' ? 'alert' : type === 'success' ? 'check' : 'info';
  element.innerHTML = `<span class="toast-icon">${icon(iconName)}</span><span class="toast-message">${esc(message)}</span><button class="toast-close" type="button" data-action="dismiss-toast" aria-label="Fechar">${icon('x')}</button>`;
  root.appendChild(element);
  setTimeout(() => {
    element.classList.add('leaving');
    setTimeout(() => element.remove(), 220);
  }, 5200);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
}

function renderJobs() {
  const dock = document.getElementById('activityDock');
  if (!dock) return;
  const jobs = [...state.jobs.values()]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 4);
  dock.innerHTML = jobs.map((job) => {
    const status = job.status || 'running';
    const running = status === 'running';
    const failed = status === 'failed';
    const progress = typeof job.progress === 'number' ? job.progress : null;
    const title = job.title || job._opts?.title || 'Tarefa';
    const stage = job.stage || (running ? 'A preparar...' : status === 'completed' ? 'Concluído' : 'Erro');
    const message = job.error || job.message || job.detail || '';
    const bytes = job.bytesTotalLabel ? `${job.bytesDownloadedLabel || ''} / ${job.bytesTotalLabel}` : job.bytesDownloadedLabel || '';
    return `<div class="activity ${failed ? 'error' : ''}">
      <div class="activity-head">
        ${running ? '<span class="spinner"></span>' : `<span class="status-icon ${failed ? 'error' : ''}">${icon(failed ? 'alert' : 'check')}</span>`}
        <span class="activity-title" title="${esc(title)}">${esc(title)}</span>
        ${progress !== null ? `<span class="activity-percent">${progress}%</span>` : ''}
        ${running ? '' : `<button class="icon-action" type="button" data-action="dismiss-job" data-id="${esc(job.id)}" title="Fechar">${icon('x')}</button>`}
      </div>
      <div class="progress ${progress === null && running ? 'indeterminate' : ''}"><div style="width:${progress ?? 0}%"></div></div>
      <div class="activity-stage"><span>${esc(stage)}${message ? ` · ${esc(message)}` : ''}</span><span>${esc(bytes)}</span></div>
    </div>`;
  }).join('');
}

function watchJob(jobId, options = {}) {
  if (!jobId) return;
  const existing = state.jobs.get(jobId);
  if (existing && existing.status && existing.status !== 'running') {
    return;
  }
  state.jobs.set(jobId, {
    ...(existing || {}),
    id: jobId,
    title: existing?.title || options.title || 'Tarefa',
    status: existing?.status || 'running',
    progress: existing?.progress ?? null,
    _opts: options,
    _notified: existing?._notified || false,
  });
  renderJobs();
  pollJob(jobId);
}

async function pollJob(jobId) {
  const entry = state.jobs.get(jobId);
  if (!entry || entry._polling || (entry.status && entry.status !== 'running')) return;
  entry._polling = true;
  try {
    const data = await api.get(`/api/jobs/${encodeURIComponent(jobId)}`);
    const job = data.job;
    const current = state.jobs.get(jobId) || entry;
    const options = current._opts || {};
    const merged = { ...job, _opts: options, _notified: current._notified || false, _polling: false };
    state.jobs.set(jobId, merged);
    if ((job.status === 'completed' || job.status === 'failed') && !merged._notified) {
      merged._notified = true;
      if (job.status === 'completed') {
        toast(`${job.title} concluído.`, 'success');
      } else {
        toast(job.error || `${job.title} falhou.`, 'error');
      }
      await handleJobComplete(job, options);
      setTimeout(() => {
        const latest = state.jobs.get(jobId);
        if (latest && latest.status !== 'running') {
          state.jobs.delete(jobId);
          renderJobs();
        }
      }, 7000);
    }
  } catch (error) {
    const current = state.jobs.get(jobId);
    if (current && !current._notified) {
      current.status = 'failed';
      current.error = error.message;
      current._notified = true;
      toast(error.message, 'error');
      setTimeout(() => {
        state.jobs.delete(jobId);
        renderJobs();
      }, 7000);
    }
  } finally {
    const current = state.jobs.get(jobId);
    if (current) current._polling = false;
    renderJobs();
  }
}

async function handleJobComplete(job, options) {
  try {
    if (typeof options.onDone === 'function') {
      await options.onDone(job);
    } else if (job.type === 'backup' || job.type === 'restore') {
      if (state.detail.id) await refreshDetail();
    } else {
      await refreshApp();
    }
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function pollJobs() {
  for (const [jobId, job] of state.jobs.entries()) {
    if (!job.status || job.status === 'running') pollJob(jobId);
  }
}

async function pollState() {
  if (!state.booted || document.hidden) return;
  try {
    const before = state.signature;
    const data = await api.get('/api/state');
    hydrate(data);
    if (before !== state.signature) {
      if (['home', 'library', 'accounts'].includes(state.page)) renderPage();
      else updateChrome();
    }
  } catch {
    /* a falha de rede é tratada no próximo pedido */
  }
}

function startPolling() {
  if (state.pollingStarted) return;
  state.pollingStarted = true;
  setInterval(pollJobs, 900);
  setInterval(pollState, 8000);
}

async function handleAction(action, element, event) {
  const data = element.dataset;
  switch (action) {
    case 'new-instance':
      await openNewInstance(data.version || null);
      break;
    case 'quick-play': {
      const instance = selectedInstance();
      if (!instance) {
        await openNewInstance();
      } else if (instance.running) {
        await stopInstance(instance.id);
      } else {
        await launchInstance(instance.id);
      }
      break;
    }
    case 'theme-toggle':
      await toggleTheme();
      break;
    case 'account-chip':
      navigate('accounts');
      break;
    case 'launch':
      await launchInstance(data.id);
      break;
    case 'stop':
      await stopInstance(data.id);
      break;
    case 'instance-detail':
      await openInstanceDetail(data.id);
      break;
    case 'edit-instance':
      openEditInstance(data.id);
      break;
    case 'delete-instance':
      openDeleteInstance(data.id);
      break;
    case 'delete-instance-confirm': {
      const files = document.getElementById('delete-files')?.checked;
      await api.delete(`/api/instances/${encodeURIComponent(data.id)}?files=${files ? '1' : '0'}`);
      closeModal();
      await refreshApp();
      toast('Instalação apagada.', 'success');
      break;
    }
    case 'repair-instance': {
      const result = await api.post(`/api/instances/${encodeURIComponent(data.id)}/repair`);
      watchJob(result.jobId, { title: 'Reparar instalação', onDone: refreshDetail });
      toast('Reparação iniciada.', 'info');
      break;
    }
    case 'open-folder':
      await api.post(`/api/instances/${encodeURIComponent(data.id)}/open-folder`);
      toast('Pasta aberta no Explorador.', 'success');
      break;
    case 'detail-tab':
      state.detail.tab = data.tab || 'overview';
      if (state.detail.tab === 'logs' && state.detail.logs === null) {
        await loadDetailLogs(state.detail.id);
      } else {
        renderDetailModal();
      }
      break;
    case 'create-backup': {
      const result = await api.post(`/api/instances/${encodeURIComponent(data.id)}/backups`);
      watchJob(result.jobId, { title: 'Criar backup', onDone: refreshDetail });
      toast('Backup iniciado.', 'info');
      break;
    }
    case 'restore-backup': {
      const ok = await confirmDialog('Restaurar este backup? Os mundos atuais serão substituídos. É criado um backup de segurança antes.', { title: 'Restaurar backup', confirmLabel: 'Restaurar' });
      if (!ok) break;
      const result = await api.post(`/api/instances/${encodeURIComponent(data.id)}/backups/${encodeURIComponent(data.file)}/restore`);
      watchJob(result.jobId, { title: 'Restaurar backup', onDone: refreshDetail });
      toast('Restauro iniciado.', 'info');
      break;
    }
    case 'delete-backup': {
      const ok = await confirmDialog('Apagar este backup permanentemente?', { title: 'Apagar backup', confirmLabel: 'Apagar' });
      if (!ok) break;
      await api.delete(`/api/instances/${encodeURIComponent(data.id)}/backups/${encodeURIComponent(data.file)}`);
      await refreshDetail();
      toast('Backup apagado.', 'success');
      break;
    }
    case 'delete-screenshot': {
      const ok = await confirmDialog('Apagar esta captura?', { title: 'Apagar captura', confirmLabel: 'Apagar' });
      if (!ok) break;
      await api.delete(`/api/instances/${encodeURIComponent(data.id)}/screenshots/${encodeURIComponent(data.file)}`);
      await refreshDetail();
      toast('Captura apagada.', 'success');
      break;
    }
    case 'refresh-logs':
      state.detail.logs = null;
      await loadDetailLogs(data.id);
      break;
    case 'version-filter':
      state.versions.type = data.type || 'all';
      state.versions.loaded = false;
      state.versions.list = [];
      renderPage();
      await loadVersions(true);
      break;
    case 'load-more-versions':
      await loadVersions(false);
      break;
    case 'install-version':
      await openNewInstance(data.version);
      break;
    case 'mods-source': {
      const source = data.source || 'modrinth';
      if (state.page === 'resources') {
        if (state.resources.type === 'datapack' && source !== 'modrinth') break;
        state.resources.source = source;
        state.resources.loaded = false;
        state.resources.results = [];
        renderPage();
        await loadResources();
      } else {
        state.mods.source = source;
        state.mods.loaded = false;
        state.mods.results = [];
        renderPage();
        await loadModsSearch();
      }
      break;
    }
    case 'open-project':
      await openProject(data.source || 'modrinth', data.id, data.type || 'mod');
      break;
    case 'quick-install': {
      if (data.type === 'modpack') {
        await installModpack(data.project);
      } else {
        await installContent({
          source: data.source || 'modrinth',
          projectId: data.project,
          versionId: null,
          projectType: data.type || 'mod',
        });
      }
      break;
    }
    case 'install-project': {
      const context = state.project;
      if (!context) break;
      const versionId = document.getElementById('project-version')?.value || null;
      await installContent({
        source: context.source,
        projectId: context.id,
        versionId,
        projectType: context.projectType,
        world: context.world,
      });
      break;
    }
    case 'install-modpack':
      await installModpack(data.id || data.project);
      break;
    case 'install-modpack-version': {
      const projectId = data.project;
      const versionId = document.getElementById('modpack-version')?.value || null;
      await installModpack(projectId, versionId);
      break;
    }
    case 'open-modpack': {
      const hit = state.modpacks.results.find((item) => String(item.id) === String(data.id));
      if (hit) await openModpack(hit);
      else toast('Modpack não encontrado. Atualiza a pesquisa.', 'warning');
      break;
    }
    case 'update-modpack': {
      const result = await api.post(`/api/instances/${encodeURIComponent(data.id)}/modpack/update`);
      watchJob(result.jobId, {
        title: 'Atualizar modpack',
        onDone: async () => {
          await refreshDetail();
          await refreshApp();
        },
      });
      toast('Atualização do modpack iniciada.', 'info');
      break;
    }
    case 'import-modpack':
      await openImportModal();
      break;
    case 'export-modpack':
      openExportModal();
      break;
    case 'do-export':
      await downloadExport();
      break;
    case 'check-updates': {
      const instanceId = state.mods.instanceId;
      if (!instanceId) break;
      const result = await api.post(`/api/instances/${encodeURIComponent(instanceId)}/mods/check-updates`);
      state.mods.updates = result.updates || [];
      renderPage();
      toast(state.mods.updates.length ? `${state.mods.updates.length} atualizações encontradas.` : 'Todos os mods estão atualizados.', state.mods.updates.length ? 'info' : 'success');
      break;
    }
    case 'update-all-mods': {
      const instanceId = state.mods.instanceId;
      if (!instanceId) break;
      const result = await api.post(`/api/instances/${encodeURIComponent(instanceId)}/mods/update`, {});
      watchJob(result.jobId, {
        title: 'Atualizar mods',
        onDone: async () => {
          await loadInstalledMods();
          await refreshApp();
        },
      });
      toast('Atualização de mods iniciada.', 'info');
      break;
    }
    case 'update-mod': {
      const instanceId = state.mods.instanceId;
      if (!instanceId) break;
      const result = await api.post(`/api/instances/${encodeURIComponent(instanceId)}/mods/update`, { key: data.key });
      watchJob(result.jobId, {
        title: 'Atualizar mod',
        onDone: async () => {
          await loadInstalledMods();
          await refreshApp();
        },
      });
      break;
    }
    case 'remove-mod': {
      const instanceId = state.page === 'resources' ? state.resources.instanceId : state.mods.instanceId;
      if (!instanceId) break;
      const world = state.page === 'resources' && state.resources.type === 'datapack' ? state.resources.world : null;
      const ok = await confirmDialog('Remover este ficheiro da instalação?', { title: 'Remover ficheiro', confirmLabel: 'Remover' });
      if (!ok) break;
      await api.post(`/api/instances/${encodeURIComponent(instanceId)}/mods/remove`, { key: data.key, world });
      await loadInstalledForCurrent();
      toast('Ficheiro removido.', 'success');
      break;
    }
    case 'github-releases':
      await loadGithubReleases(data.repo);
      break;
    case 'github-close':
      state.mods.github.repo = null;
      state.mods.github.releases = [];
      renderPage();
      break;
    case 'install-github': {
      const instanceId = state.mods.instanceId;
      if (!instanceId) {
        toast('Seleciona uma instalação.', 'warning');
        break;
      }
      const result = await api.post(`/api/instances/${encodeURIComponent(instanceId)}/mods/install-github`, {
        repo: data.repo,
        tag: data.tag,
        assetId: data.asset,
        projectType: 'mod',
      });
      watchJob(result.jobId, {
        title: 'Instalar do GitHub',
        onDone: async () => {
          await loadInstalledMods();
          await refreshApp();
        },
      });
      toast('Instalação iniciada.', 'info');
      break;
    }
    case 'resources-type': {
      const type = data.type || 'resourcepack';
      state.resources.type = type;
      if (type === 'datapack') state.resources.source = 'modrinth';
      state.resources.loaded = false;
      state.resources.results = [];
      state.resources.installedLoaded = false;
      state.resources.installed = [];
      renderPage();
      if (type === 'datapack') await loadWorlds();
      await loadResources();
      await loadInstalledResources();
      break;
    }
    case 'refresh-resources':
      await loadInstalledResources();
      break;
    case 'add-offline':
      await openOfflineModal();
      break;
    case 'add-microsoft':
      await openMicrosoftModal();
      break;
    case 'activate-account': {
      const result = await api.post(`/api/accounts/${encodeURIComponent(data.id)}/activate`);
      hydrate(result.state);
      renderPage();
      toast('Conta ativada.', 'success');
      break;
    }
    case 'refresh-account': {
      await api.post(`/api/accounts/${encodeURIComponent(data.id)}/refresh`);
      await refreshApp();
      toast('Sessão renovada.', 'success');
      break;
    }
    case 'edit-skin':
      openSkinModal(data.id);
      break;
    case 'remove-skin': {
      const ok = await confirmDialog('Remover a skin local desta conta?', { title: 'Remover skin', confirmLabel: 'Remover' });
      if (!ok) break;
      const result = await api.delete(`/api/accounts/${encodeURIComponent(data.id)}/skin`);
      hydrate(result.state);
      closeModal();
      renderPage();
      toast('Skin local removida.', 'success');
      break;
    }
    case 'offline-skin-choose': {
      const disable = document.getElementById('offline-skin-disable')?.checked;
      await saveOfflineSkinPromptPreference(disable);
      closeModal();
      openSkinModal(data.id);
      break;
    }
    case 'offline-skin-later': {
      const disable = document.getElementById('offline-skin-disable')?.checked;
      await saveOfflineSkinPromptPreference(disable);
      closeModal();
      break;
    }
    case 'remove-account': {
      const ok = await confirmDialog('Remover esta conta do launcher?', { title: 'Remover conta', confirmLabel: 'Remover' });
      if (!ok) break;
      const result = await api.delete(`/api/accounts/${encodeURIComponent(data.id)}`);
      hydrate(result.state);
      renderPage();
      toast('Conta removida.', 'success');
      break;
    }
    case 'copy-code':
      await copyText(state.login?.status?.userCode || '');
      toast('Código copiado.', 'success');
      break;
    case 'retry-microsoft':
      await openMicrosoftModal();
      break;
    case 'accent-preset': {
      const accent = normalizeHexColor(data.accent, DEFAULT_ACCENT_COLOR);
      const accent2 = normalizeHexColor(data.accent2, DEFAULT_ACCENT_COLOR_2);
      const form = document.getElementById('settings-form');
      const first = form?.querySelector('[name="accentColor"]');
      const second = form?.querySelector('[name="accentColor2"]');
      if (first) first.value = accent;
      if (second) second.value = accent2;
      applyTheme({ accentColor: accent, accentColor2: accent2 });
      break;
    }
    case 'detect-java':
      await loadJavaDetect(true);
      break;
    case 'retry-system':
      state.system = null;
      state.systemError = null;
      await loadSystem();
      break;
    case 'download-java': {
      const result = await api.post('/api/java/download', { major: Number(data.major) });
      watchJob(result.jobId, {
        title: `Descarregar Java ${data.major}`,
        onDone: async () => {
          await loadJavaDetect(true);
        },
      });
      toast(`Download do Java ${data.major} iniciado.`, 'info');
      break;
    }
    case 'sync-push':
    case 'sync-pull': {
      const direction = action === 'sync-pull' ? 'pull' : 'push';
      const result = await api.post('/api/config/sync', { direction });
      if (result.state) {
        hydrate(result.state);
        renderPage();
      }
      toast(direction === 'pull' ? 'Configuração recebida.' : 'Configuração enviada.', 'success');
      break;
    }
    case 'export-config': {
      const anchor = document.createElement('a');
      anchor.href = '/api/config/export';
      anchor.click();
      toast('Exportação iniciada.', 'success');
      break;
    }
    case 'import-config':
      document.getElementById('config-import')?.click();
      break;
    case 'dismiss-job':
      state.jobs.delete(data.id);
      renderJobs();
      break;
    case 'dismiss-toast':
      element.closest('.toast')?.remove();
      break;
    case 'close-modal':
      closeModal();
      break;
    case 'modal-overlay':
      if (event.target === element) closeModal();
      break;
    case 'confirm-yes': {
      const resolve = state.confirmResolver;
      state.confirmResolver = null;
      closeModal();
      resolve?.(true);
      break;
    }
    case 'confirm-no': {
      const resolve = state.confirmResolver;
      state.confirmResolver = null;
      closeModal();
      resolve?.(false);
      break;
    }
    case 'reload-page':
      location.reload();
      break;
    default:
      break;
  }
}

async function toggleTheme() {
  const next = state.settings.theme === 'light' ? 'dark' : 'light';
  const result = await api.put('/api/settings', { theme: next });
  state.settings = result.settings;
  applyTheme();
  if (state.page === 'settings') renderPage();
}

async function launchInstance(id) {
  const instance = id ? instanceById(id) : selectedInstance();
  if (!instance) {
    await openNewInstance();
    return;
  }
  if (instance.running) {
    await stopInstance(instance.id);
    return;
  }
  if (instance.status !== 'ready') {
    toast('Esta instalação ainda não está pronta.', 'warning');
    return;
  }
  if (!state.activeAccount) {
    toast('Cria ou seleciona uma conta antes de jogar.', 'warning');
    navigate('accounts');
    return;
  }
  const result = await api.post(`/api/instances/${encodeURIComponent(instance.id)}/launch`, { accountId: state.activeAccount.id });
  watchJob(result.jobId, {
    title: `Iniciar ${instance.name}`,
    onDone: refreshApp,
  });
  toast('A iniciar o Minecraft...', 'info');
  setTimeout(() => refreshApp().catch(() => {}), 1600);
}

async function stopInstance(id) {
  const instance = id ? instanceById(id) : selectedInstance();
  if (!instance) return;
  await api.post(`/api/instances/${encodeURIComponent(instance.id)}/stop`);
  toast('Pedido para parar o jogo enviado.', 'info');
  setTimeout(() => refreshApp().catch(() => {}), 800);
}

async function installContent({ source, projectId, versionId, projectType, world }) {
  const instanceId = state.page === 'resources' ? state.resources.instanceId : state.mods.instanceId;
  const instance = instanceById(instanceId);
  if (!instance) {
    toast('Seleciona uma instalação primeiro.', 'warning');
    return;
  }
  if (instance.status !== 'ready') {
    toast('A instalação ainda não está pronta.', 'warning');
    return;
  }
  if (projectType === 'mod' && (instance.loader?.type === 'vanilla' || !instance.loader?.type)) {
    toast('Instala um loader (Fabric, Forge, etc.) para usar mods.', 'warning');
    return;
  }
  if (projectType === 'datapack' && !world) {
    toast('Seleciona um mundo para instalar o datapack.', 'warning');
    return;
  }
  const result = await api.post(`/api/instances/${encodeURIComponent(instanceId)}/mods/install`, {
    source,
    projectId,
    versionId: versionId || null,
    projectType: projectType || 'mod',
    world: world || null,
  });
  closeModal();
  watchJob(result.jobId, {
    title: `Instalar ${projectTypeLabel(projectType)}`,
    onDone: async () => {
      await loadInstalledForCurrent();
      await refreshApp();
    },
  });
  toast('Instalação iniciada.', 'info');
}

async function loadInstalledForCurrent() {
  if (state.page === 'mods') return loadInstalledMods();
  if (state.page === 'resources') return loadInstalledResources();
  if (state.detail.id) return refreshDetail();
  return undefined;
}

async function toggleMod(key) {
  const instanceId = state.page === 'resources' ? state.resources.instanceId : state.mods.instanceId;
  if (!instanceId) return;
  const world = state.page === 'resources' && state.resources.type === 'datapack' ? state.resources.world : null;
  await api.post(`/api/instances/${encodeURIComponent(instanceId)}/mods/toggle`, { key, world });
  await loadInstalledForCurrent();
}

async function installModpack(projectId, versionId = null, name = null) {
  const result = await api.post('/api/modpacks/install', {
    projectId,
    versionId: versionId || null,
    name: name || null,
  });
  if (result.state) hydrate(result.state);
  closeModal();
  watchJob(result.jobId, {
    title: 'Instalar modpack',
    onDone: refreshApp,
  });
  navigate('library');
  toast('Instalação do modpack iniciada.', 'info');
}

async function downloadExport() {
  const instanceId = document.getElementById('export-instance')?.value;
  const format = document.getElementById('export-format')?.value || 'mrpack';
  if (!instanceId) return;
  const response = await fetch(`/api/modpacks/export?instanceId=${encodeURIComponent(instanceId)}&format=${encodeURIComponent(format)}`);
  if (!response.ok) {
    let message = `Erro HTTP ${response.status}.`;
    try {
      const data = await response.json();
      message = data.error || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const blob = await response.blob();
  const fileName = parseFileName(response.headers.get('content-disposition'), `minesphere-${format}.zip`);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  closeModal();
  toast('Exportação concluída.', 'success');
}

async function importConfigFile(input) {
  const file = input.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    const ok = await confirmDialog('Importar esta configuração? As definições atuais serão substituídas.', { title: 'Importar configuração', confirmLabel: 'Importar' });
    if (!ok) return;
    const result = await api.post('/api/config/import', data);
    hydrate(result.state);
    renderPage();
    toast('Configuração importada.', 'success');
  } catch (error) {
    toast(`Ficheiro inválido: ${error.message}`, 'error');
  } finally {
    input.value = '';
  }
}

function numberValue(formData, key, fallback = 0) {
  const raw = formData.get(key);
  if (raw === null || raw === '') return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

async function handleForm(formName, form) {
  const submit = form.querySelector('button[type="submit"]');
  if (submit) submit.disabled = true;
  try {
    if (formName === 'new-instance') {
      const formData = new FormData(form);
      const payload = {
        name: String(formData.get('name') || '').trim() || undefined,
        version: String(formData.get('version') || ''),
        loaderType: String(formData.get('loaderType') || 'vanilla'),
        loaderVersion: String(formData.get('loaderVersion') || '') || null,
        icon: String(formData.get('icon') || '🌍'),
        color: String(formData.get('color') || '#39d99f'),
        notes: String(formData.get('notes') || ''),
        autoJoin: {
          type: String(formData.get('autoJoinType') || 'off'),
          server: String(formData.get('autoJoinServer') || ''),
          port: numberValue(formData, 'autoJoinPort', 25565),
          world: String(formData.get('autoJoinWorld') || ''),
        },
      };
      if (formData.get('ramMb')) payload.ramMb = numberValue(formData, 'ramMb');
      if (formData.get('minRamMb')) payload.minRamMb = numberValue(formData, 'minRamMb');
      if (formData.get('jvmArgs')) payload.jvmArgs = String(formData.get('jvmArgs'));
      if (formData.get('javaPath')) payload.javaPath = String(formData.get('javaPath'));
      const result = await api.post('/api/instances', payload);
      hydrate(result.state);
      closeModal();
      watchJob(result.jobId, { title: 'Instalar instância', onDone: refreshApp });
      navigate('library');
      toast('Instalação criada. Os ficheiros estão a ser preparados.', 'info');
    } else if (formName === 'edit-instance') {
      const formData = new FormData(form);
      const id = String(formData.get('id'));
      const payload = {
        name: String(formData.get('name') || ''),
        icon: String(formData.get('icon') || '🌍'),
        color: String(formData.get('color') || '#39d99f'),
        ramMb: formData.get('ramMb') ? numberValue(formData, 'ramMb') : null,
        minRamMb: formData.get('minRamMb') ? numberValue(formData, 'minRamMb') : null,
        jvmArgs: String(formData.get('jvmArgs') || ''),
        javaPath: String(formData.get('javaPath') || 'auto'),
        notes: String(formData.get('notes') || ''),
        resolutionWidth: numberValue(formData, 'resolutionWidth'),
        resolutionHeight: numberValue(formData, 'resolutionHeight'),
        autoJoin: {
          type: String(formData.get('autoJoinType') || 'off'),
          server: String(formData.get('autoJoinServer') || ''),
          port: numberValue(formData, 'autoJoinPort', 25565),
          world: String(formData.get('autoJoinWorld') || ''),
        },
      };
      const reopenDetail = state.detail.id === id;
      const result = await api.patch(`/api/instances/${encodeURIComponent(id)}`, payload);
      hydrate(result.state);
      closeModal();
      toast('Instalação atualizada.', 'success');
      if (reopenDetail) await openInstanceDetail(id);
    } else if (formName === 'offline') {
      const formData = new FormData(form);
      const name = String(formData.get('name') || '').trim();
      if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) {
        const error = document.getElementById('offline-error');
        if (error) error.textContent = 'Usa 3 a 16 caracteres: letras, números e _ (sem espaços).';
        document.getElementById('offline-name')?.focus();
        return;
      }
      const result = await api.post('/api/accounts/offline', { name });
      hydrate(result.state);
      closeModal();
      renderPage();
      toast(streamerMode() ? 'Conta offline criada e ativada.' : `Conta ${result.account.name} criada e ativada.`, 'success');
      if (state.settings.offlineSkinPrompt !== false) openOfflineSkinPrompt(result.account);
    } else if (formName === 'skin') {
      const formData = new FormData(form);
      const id = String(formData.get('id') || '');
      const file = form.querySelector('input[type="file"]')?.files?.[0];
      if (!file) throw new Error('Seleciona um ficheiro PNG.');
      if (file.size > 2 * 1024 * 1024) throw new Error('A skin é demasiado grande (máximo 2 MB).');
      if (file.type && file.type !== 'image/png') throw new Error('Escolhe um ficheiro PNG.');
      const official = form.dataset.skinMode === 'official';
      const sync = formData.has('syncSkin');
      const variant = String(formData.get('skinVariant') || 'classic');
      const query = official
        ? `variant=${encodeURIComponent(variant)}`
        : `sync=${sync ? '1' : '0'}`;
      const result = await uploadFile(
        `/api/accounts/${encodeURIComponent(id)}/skin${official ? '/official' : ''}?${query}`,
        file,
      );
      if (result.state) hydrate(result.state);
      closeModal();
      renderPage();
      toast(official ? 'Skin enviada para a Microsoft.' : 'Skin local aplicada.', 'success');
    } else if (formName === 'settings') {
      const formData = new FormData(form);
      const patch = {
        theme: String(formData.get('theme') || 'dark'),
        accentColor: String(formData.get('accentColor') || DEFAULT_ACCENT_COLOR),
        accentColor2: String(formData.get('accentColor2') || DEFAULT_ACCENT_COLOR_2),
        streamerMode: formData.has('streamerMode'),
        ramMb: numberValue(formData, 'ramMb', 4096),
        minRamMb: numberValue(formData, 'minRamMb', 1024),
        jvmArgs: String(formData.get('jvmArgs') || ''),
        parallelDownloads: numberValue(formData, 'parallelDownloads', 8),
        resolutionWidth: numberValue(formData, 'resolutionWidth'),
        resolutionHeight: numberValue(formData, 'resolutionHeight'),
        javaPath: String(formData.get('javaPath') || 'auto'),
        autoDownloadJava: formData.has('autoDownloadJava'),
        autoBackup: formData.has('autoBackup'),
        backupLimit: numberValue(formData, 'backupLimit', 5),
        autoUpdateMods: formData.has('autoUpdateMods'),
        syncFolder: String(formData.get('syncFolder') || ''),
        microsoftClientId: String(formData.get('microsoftClientId') || ''),
        curseforgeKey: String(formData.get('curseforgeKey') || ''),
        closeOnLaunch: formData.has('closeOnLaunch'),
        showSnapshots: formData.has('showSnapshots'),
        offlineSkinPrompt: formData.has('offlineSkinPrompt'),
      };
      const result = await api.put('/api/settings', patch);
      state.settings = result.settings;
      applyTheme();
      renderPage();
      toast('Definições guardadas.', 'success');
    } else if (formName === 'import-modpack') {
      const formData = new FormData(form);
      const file = form.querySelector('#import-file')?.files?.[0];
      if (!file) throw new Error('Seleciona um ficheiro .mrpack ou .zip.');
      const params = new URLSearchParams({
        name: String(formData.get('name') || ''),
        version: String(formData.get('version') || ''),
        loaderType: String(formData.get('loaderType') || 'vanilla'),
        loaderVersion: String(formData.get('loaderVersion') || ''),
        filename: file.name,
      });
      const progress = document.getElementById('import-progress');
      const bar = document.getElementById('import-bar');
      const percent = document.getElementById('import-percent');
      const stage = document.getElementById('import-stage');
      if (progress) progress.classList.remove('hidden');
      if (stage) stage.textContent = 'A enviar ficheiro...';
      const result = await uploadFile(`/api/modpacks/import?${params.toString()}`, file, (value) => {
        if (bar) bar.style.width = `${value}%`;
        if (percent) percent.textContent = `${value}%`;
      });
      if (result.state) hydrate(result.state);
      closeModal();
      watchJob(result.jobId, { title: 'Importar modpack', onDone: refreshApp });
      navigate('library');
      toast('Modpack importado. A instalação está a decorrer.', 'info');
    }
  } finally {
    if (submit) submit.disabled = false;
  }
}

function bindEvents() {
  document.addEventListener('click', async (event) => {
    const pageButton = event.target.closest('[data-page]');
    if (pageButton) {
      event.preventDefault();
      if (document.getElementById('modalBody')) closeModal();
      navigate(pageButton.dataset.page);
      return;
    }
    const element = event.target.closest('[data-action]');
    if (!element || element.disabled) return;
    if (element.tagName === 'A' && !element.dataset.action) return;
    if (element.dataset.action === 'modal-overlay' && event.target !== element) return;
    event.preventDefault();
    try {
      await handleAction(element.dataset.action, element, event);
    } catch (error) {
      toast(error.message, 'error');
    }
  });

  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('form[data-form]');
    if (!form) return;
    event.preventDefault();
    try {
      await handleForm(form.dataset.form, form);
    } catch (error) {
      toast(error.message, 'error');
    }
  });

  document.addEventListener('change', async (event) => {
    const element = event.target;
    const change = element.dataset.change;
    try {
      if (change === 'new-version' || change === 'new-loader') {
        await refreshLoaderOptions();
      } else if (change === 'autojoin-type') {
        toggleAutoJoinFields(element);
      } else if (change === 'mods-instance') {
        state.mods.instanceId = element.value;
        state.mods.loaded = false;
        state.mods.results = [];
        state.mods.installedLoaded = false;
        state.mods.installed = [];
        state.mods.updates = [];
        state.mods.github = { results: [], total: 0, repo: null, releases: [], loading: false, releasesLoading: false };
        renderPage();
        await loadInstalledMods();
        await loadModsSearch();
      } else if (change === 'mods-sort') {
        state.mods.sort = element.value;
        state.mods.loaded = false;
        renderPage();
        await loadModsSearch();
      } else if (change === 'resources-instance') {
        state.resources.instanceId = element.value;
        state.resources.world = '';
        state.resources.worldsLoaded = false;
        state.resources.installedLoaded = false;
        state.resources.installed = [];
        state.resources.loaded = false;
        state.resources.results = [];
        renderPage();
        await loadWorlds();
        await loadResources();
        await loadInstalledResources();
      } else if (change === 'resources-world') {
        state.resources.world = element.value;
        state.resources.installedLoaded = false;
        state.resources.installed = [];
        renderPage();
        await loadInstalledResources();
      } else if (change === 'toggle-mod') {
        await toggleMod(element.dataset.key);
      } else if (change === 'config-import') {
        await importConfigFile(element);
      } else if (change === 'appearance-preview') {
        const form = element.closest('#settings-form');
        if (form) {
          const formData = new FormData(form);
          applyTheme({
            accentColor: formData.get('accentColor'),
            accentColor2: formData.get('accentColor2'),
            streamerMode: formData.has('streamerMode'),
          });
        }
      } else if (element.dataset.filter === 'library-loader') {
        state.library.loader = element.value;
        renderPage();
      }
    } catch (error) {
      toast(error.message, 'error');
      renderPage();
    }
  });

  document.addEventListener('input', (event) => {
    const element = event.target;
    if (element.id === 'offline-name') {
      const error = document.getElementById('offline-error');
      if (error) error.textContent = '';
    }
    if (element.dataset.search) {
      const target = element.dataset.search;
      if (target === 'library') {
        state.library.query = element.value;
        renderPage();
      } else if (target === 'versions') {
        state.versions.query = element.value;
        debounce('versions', () => loadVersions(true));
      } else if (target === 'mods') {
        state.mods.query = element.value;
        debounce('mods', () => loadModsSearch());
      } else if (target === 'modpacks') {
        state.modpacks.query = element.value;
        debounce('modpacks', () => loadModpacks());
      } else if (target === 'resources') {
        state.resources.query = element.value;
        debounce('resources', () => loadResources());
      }
    }
    if (element.dataset.range === 'ram') {
      const output = document.getElementById('ram-value');
      if (output) output.textContent = fmtBytes(Number(element.value) * 1024 * 1024);
    }
    if (element.dataset.range === 'parallel') {
      const output = document.getElementById('parallel-value');
      if (output) output.textContent = element.value;
    }
  });

  const globalSearch = document.getElementById('globalSearch');
  globalSearch?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    handleGlobalSearch(globalSearch.value);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.getElementById('modalBody')) closeModal();
  });

  window.addEventListener('hashchange', () => {
    const page = pageFromHash();
    if (page !== state.page) {
      state.page = page;
      renderPage({ resetScroll: true });
    }
  });
}

function handleGlobalSearch(value) {
  const query = String(value || '').trim();
  if (!query) return;
  if (state.page === 'versions') {
    state.versions.query = query;
    state.versions.loaded = false;
    renderPage();
    loadVersions(true);
    return;
  }
  if (state.page === 'modpacks') {
    state.modpacks.query = query;
    state.modpacks.loaded = false;
    renderPage();
    loadModpacks();
    return;
  }
  if (state.page === 'resources') {
    state.resources.query = query;
    state.resources.loaded = false;
    renderPage();
    loadResources();
    return;
  }
  if (state.page === 'mods') {
    state.mods.query = query;
    state.mods.loaded = false;
    renderPage();
    loadModsSearch();
    return;
  }
  state.mods.query = query;
  state.mods.source = 'modrinth';
  state.mods.loaded = false;
  navigate('mods');
}

function showBootError(error) {
  const content = document.getElementById('content');
  if (!content) return;
  content.innerHTML = `<div class="empty-state" style="margin-top:40px">
    <span class="empty-icon" style="color:var(--danger)">${icon('alert')}</span>
    <h3>Não foi possível ligar ao launcher</h3>
    <p>${esc(error.message || 'Erro desconhecido.')}</p>
    <p class="small">Confirma que o servidor está a correr: <span class="mono">node server.js</span></p>
    <button class="btn primary" data-action="reload-page">${icon('refresh')} Tentar novamente</button>
  </div>`;
  injectIcons(content);
}

async function boot() {
  injectIcons();
  bindEvents();
  applyTheme();
  state.page = pageFromHash();
  try {
    const data = await api.get('/api/state');
    hydrate(data);
    state.booted = true;
    renderPage();
    startPolling();
  } catch (error) {
    showBootError(error);
  }
}

boot();



