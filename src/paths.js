'use strict';

const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const GAME = path.join(ROOT, 'game');
const INSTANCES = path.join(ROOT, 'instances');
const RUNTIME = path.join(ROOT, 'runtime');
const PUBLIC = path.join(ROOT, 'public');
const ASSETS = path.join(PUBLIC, 'assets');

const LIBRARIES = path.join(GAME, 'libraries');
const VERSIONS = path.join(GAME, 'versions');
const ASSETS_ROOT = path.join(GAME, 'assets');
const INDEXES = path.join(ASSETS_ROOT, 'indexes');
const OBJECTS = path.join(ASSETS_ROOT, 'objects');
const VIRTUAL = path.join(ASSETS_ROOT, 'virtual');
const LOG_CONFIGS = path.join(ASSETS_ROOT, 'log_configs');
const JAVA_DIR = path.join(RUNTIME, 'java');
const CACHE = path.join(DATA, 'cache');
const META_CACHE = path.join(CACHE, 'meta');
const TEMP = path.join(DATA, 'temp');
const BACKUPS = path.join(DATA, 'backups');
const SKINS = path.join(DATA, 'skins');

const SETTINGS_FILE = path.join(DATA, 'settings.json');
const ACCOUNTS_FILE = path.join(DATA, 'accounts.json');
const INSTALLATIONS_FILE = path.join(DATA, 'installations.json');

for (const dir of [DATA, GAME, INSTANCES, RUNTIME, LIBRARIES, VERSIONS, ASSETS_ROOT, INDEXES, OBJECTS, VIRTUAL, LOG_CONFIGS, JAVA_DIR, CACHE, META_CACHE, TEMP, BACKUPS, SKINS]) {
  fs.mkdirSync(dir, { recursive: true });
}

function instanceDir(id) {
  if (!/^[a-zA-Z0-9_-]+$/.test(String(id))) throw new Error('Identificador de instalação inválido.');
  return path.join(INSTANCES, id);
}

module.exports = {
  ROOT,
  DATA,
  GAME,
  INSTANCES,
  RUNTIME,
  PUBLIC,
  ASSETS,
  LIBRARIES,
  VERSIONS,
  ASSETS_ROOT,
  INDEXES,
  OBJECTS,
  VIRTUAL,
  LOG_CONFIGS,
  JAVA_DIR,
  CACHE,
  META_CACHE,
  TEMP,
  BACKUPS,
  SKINS,
  SETTINGS_FILE,
  ACCOUNTS_FILE,
  INSTALLATIONS_FILE,
  instanceDir,
};
