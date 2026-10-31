'use strict';

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { spawn } = require('child_process');
const {
  readJson,
  fileExists,
  ensureDir,
  downloadFile,
  resolveArgumentList,
  parseArgs,
  replaceVars,
  mavenToPath,
  rulesAllow,
  safeJoin,
  normalizeUuid,
  nowStamp,
} = require('./util');
const {
  GAME,
  VERSIONS,
  LIBRARIES,
  ASSETS_ROOT,
  INDEXES,
  OBJECTS,
  VIRTUAL,
  LOG_CONFIGS,
  instanceDir,
} = require('./paths');
const {
  getVersionChain,
  getAllowedLibraries,
  getLibraryArtifact,
  getNativeArtifact,
  isNativeOnlyLibrary,
  ensureAssetIndex,
  ensureAssets,
  ensureLogging,
  ensureLegacyResources,
  getAssetRoot,
  downloadClientJar,
  versionJarPath,
} = require('./mojang');
const { readZip, entryData } = require('./zip');
const { pickJava, inferJavaMajor } = require('./java');
const { getSettings } = require('./store');

const running = new Map();

function mergeVersion(id) {
  const chain = getVersionChain(id);
  const ordered = [...chain].reverse();
  const merged = {
    id,
    arguments: { game: [], jvm: [] },
    libraries: [],
  };
  const libraryMap = new Map();
  const scalarKeys = [
    'type',
    'releaseTime',
    'time',
    'assets',
    'assetIndex',
    'downloads',
    'javaVersion',
    'logging',
    'mainClass',
    'minecraftArguments',
    'complianceLevel',
    'minimumLauncherVersion',
    'jar',
  ];
  for (const item of ordered) {
    const json = item.json || {};
    for (const key of scalarKeys) {
      if (json[key] !== undefined) merged[key] = json[key];
    }
    if (json.arguments) {
      if (Array.isArray(json.arguments.game)) merged.arguments.game.push(...json.arguments.game);
      if (Array.isArray(json.arguments.jvm)) merged.arguments.jvm.push(...json.arguments.jvm);
    }
    for (const lib of json.libraries || []) {
      if (!lib || !lib.name) continue;
      libraryMap.set(lib.name, lib);
    }
  }
  merged.libraries = [...libraryMap.values()];
  const clientEntry = chain.find((item) => item.json?.downloads?.client);
  merged.clientJarVersion = merged.jar || clientEntry?.id || ordered[0]?.id || id;
  merged.chain = chain;
  return merged;
}

function nativeAllowed(lib) {
  if (!isNativeOnlyLibrary(lib)) return false;
  const name = String(lib.name || '');
  if (process.arch === 'x64' && /natives-windows-(arm64|x86)/i.test(name)) return false;
  if (process.arch === 'arm64' && /natives-windows-(x86|x86_64)/i.test(name)) return false;
  return true;
}

async function extractNatives(merged, nativesDir, job) {
  fs.rmSync(nativesDir, { recursive: true, force: true });
  const nativeLibDir = path.join(nativesDir, 'java');
  ensureDir(nativeLibDir);
  const libraries = getAllowedLibraries(merged);
  let count = 0;
  for (const lib of libraries) {
    let artifact = getNativeArtifact(lib);
    if (!artifact && nativeAllowed(lib)) artifact = getLibraryArtifact(lib);
    if (!artifact) continue;
    const file = path.join(LIBRARIES, artifact.path);
    if (!fileExists(file)) {
      if (artifact.url) {
        await downloadFile(
          { url: artifact.url, dest: file, sha1: artifact.sha1, size: artifact.size, label: lib.name },
          {
            onBytes: (bytes) => job?.addBytes(bytes),
            onSkip: (task) => job?.addSkipped(task),
          },
        );
      } else {
        continue;
      }
    }
    const buffer = await fsp.readFile(file);
    let entries;
    try {
      entries = readZip(buffer);
    } catch (error) {
      throw new Error(`Não foi possível ler biblioteca nativa ${lib.name}: ${error.message}`);
    }
    const excludes = Array.isArray(lib.extract?.exclude) ? lib.extract.exclude : [];
    for (const entry of entries) {
      if (entry.isDirectory) continue;
      if (entry.name.startsWith('META-INF/')) continue;
      if (excludes.some((prefix) => entry.name.startsWith(prefix))) continue;
      const target = safeJoin(nativeLibDir, path.basename(entry.name));
      await fsp.writeFile(target, entryData(buffer, entry));
      count += 1;
    }
  }
  job?.setDetail(`${count} ficheiros nativos extraídos.`);
  return count;
}

function buildClasspath(merged, clientJar) {
  const paths = [];
  for (const lib of getAllowedLibraries(merged)) {
    if (isNativeOnlyLibrary(lib)) continue;
    const artifact = getLibraryArtifact(lib);
    if (!artifact) continue;
    const full = path.join(LIBRARIES, artifact.path);
    if (!paths.includes(full)) paths.push(full);
  }
  if (clientJar && !paths.includes(clientJar)) paths.push(clientJar);
  return paths;
}

function supportsQuickPlay(versionId) {
  const match = String(versionId || '').match(/^(\d+)\.(\d+)/);
  if (!match) return false;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  return major > 1 || (major === 1 && minor >= 20);
}

function applyAutoJoinArgs(instance, versionId, gameArgs, job) {
  const autoJoin = instance.autoJoin;
  if (!autoJoin || autoJoin.type === 'off') return gameArgs;
  if (autoJoin.type === 'server' && autoJoin.server) {
    if (!gameArgs.includes('--server')) {
      gameArgs.push('--server', autoJoin.server);
      const port = Number(autoJoin.port) || 25565;
      if (port !== 25565 && !gameArgs.includes('--port')) gameArgs.push('--port', String(port));
    }
    return gameArgs;
  }
  if (autoJoin.type === 'world' && autoJoin.world) {
    if (!supportsQuickPlay(versionId)) {
      job?.warn?.('A ligação automática a um mundo requer Minecraft 1.20 ou superior.');
      return gameArgs;
    }
    if (!gameArgs.includes('--quickPlaySingleplayer')) {
      gameArgs.push('--quickPlaySingleplayer', autoJoin.world);
    }
  }
  return gameArgs;
}

function getFeatureFlags(instance, settings) {
  const width = Number(instance.resolutionWidth || settings.resolutionWidth) || 0;
  const height = Number(instance.resolutionHeight || settings.resolutionHeight) || 0;
  return {
    is_demo_user: false,
    has_custom_resolution: Boolean(width && height),
    has_quick_plays_support: false,
    is_quick_play_singleplayer: false,
    is_quick_play_multiplayer: false,
    is_quick_play_realms: false,
  };
}

function ensureLoaderClientJar(instance, merged) {
  // Forge/NeoForge ignore the loader-named jar and load the patched client from libraries.
  const type = instance.loader?.type;
  if (type !== 'forge' && type !== 'neoforge') return merged.clientJarVersion;
  const loaderJar = versionJarPath(merged.id);
  if (fileExists(loaderJar)) return merged.id;
  const parentJar = versionJarPath(merged.clientJarVersion);
  if (!fileExists(parentJar)) return merged.clientJarVersion;
  ensureDir(path.dirname(loaderJar));
  fs.copyFileSync(parentJar, loaderJar);
  return merged.id;
}

function ensureJvmArgs(jvmArgs, nativeLibDir, classpath) {
  const args = jvmArgs.filter((arg) => !String(arg).startsWith('-Djava.library.path='));
  const hasClasspath = args.some((arg) => arg === '-cp' || arg === '-classpath');
  args.unshift(`-Djava.library.path=${nativeLibDir}`);
  if (!hasClasspath) args.push('-cp', classpath);
  return args;
}

async function prepareLaunch(instance, account, job) {
  const settings = getSettings();
  const merged = mergeVersion(instance.versionId || instance.version);
  const gameDir = instance.gameDir || instanceDir(instance.id);
  ensureDir(gameDir);
  for (const sub of ['mods', 'resourcepacks', 'shaderpacks', 'saves', 'screenshots', 'logs', 'config']) {
    ensureDir(path.join(gameDir, sub));
  }

  const nativesDir = path.join(gameDir, 'natives');
  let clientJar = versionJarPath(merged.clientJarVersion);
  if (!fileExists(clientJar)) {
    const clientEntry = merged.chain.find((item) => item.json?.downloads?.client);
    if (!clientEntry) throw new Error('Cliente Minecraft não encontrado. Repara a instalação.');
    job?.setStage('Cliente', 'A descarregar cliente em falta...');
    await downloadClientJar(clientEntry.json, job, merged.clientJarVersion);
  }
  if (!fileExists(clientJar)) throw new Error('O ficheiro do cliente Minecraft está em falta.');
  const loaderClient = ensureLoaderClientJar(instance, merged);
  if (loaderClient !== merged.clientJarVersion) {
    merged.clientJarVersion = loaderClient;
    clientJar = versionJarPath(loaderClient);
  }
  if (!fileExists(clientJar)) throw new Error('O ficheiro do cliente Minecraft está em falta.');

  // Ensure every classpath library exists; repair only the missing ones.
  const missing = [];
  for (const lib of getAllowedLibraries(merged)) {
    if (isNativeOnlyLibrary(lib)) continue;
    const artifact = getLibraryArtifact(lib);
    if (!artifact) continue;
    const full = path.join(LIBRARIES, artifact.path);
    if (!fileExists(full)) missing.push({ ...artifact, dest: full, label: lib.name });
  }
  if (missing.length) {
    job?.setStage('Bibliotecas', `A reparar ${missing.length} bibliotecas em falta...`);
    for (const task of missing) {
      await downloadFile(task, {
        onBytes: (bytes) => job?.addBytes(bytes),
        onSkip: (item) => job?.addSkipped(item),
      });
    }
  }

  const assetIndexInfo = merged.assetIndex;
  if (assetIndexInfo?.id) {
    const indexPath = path.join(INDEXES, `${assetIndexInfo.id}.json`);
    if (!fileExists(indexPath)) {
      job?.setStage('Assets', 'A preparar assets em falta...');
      await ensureAssets(merged, job);
    }
  }
  await ensureLegacyResources(merged, gameDir, job);
  const logging = await ensureLogging(merged, job);
  await extractNatives(merged, nativesDir, job);

  const assetRoot = await getAssetRoot(merged);
  const classpath = buildClasspath(merged, clientJar).join(path.delimiter);
  const features = getFeatureFlags(instance, settings);
  const width = Number(instance.resolutionWidth || settings.resolutionWidth) || 0;
  const height = Number(instance.resolutionHeight || settings.resolutionHeight) || 0;

  const session = {
    accessToken: account.accessToken || '0',
    uuid: normalizeUuid(account.uuid),
    name: account.name,
    xuid: account.xuid || '',
    userType: account.type === 'msa' ? 'msa' : 'legacy',
  };

  const vars = {
    auth_player_name: session.name,
    version_name: merged.id,
    game_directory: gameDir,
    assets_root: assetRoot,
    assets_index_name: merged.assetIndex?.id || merged.assets || 'legacy',
    auth_uuid: session.uuid,
    auth_access_token: session.accessToken,
    auth_session: `token:${session.accessToken}:${session.uuid}`,
    clientid: session.uuid,
    auth_xuid: session.xuid,
    user_type: session.userType,
    version_type: merged.type || 'release',
    user_properties: '{}',
    natives_directory: nativesDir,
    launcher_name: 'MineSphere',
    launcher_version: '1.0.0',
    classpath,
    classpath_separator: path.delimiter,
    library_directory: LIBRARIES,
    game_assets: assetRoot,
    resolution_width: width || 854,
    resolution_height: height || 480,
    profile_name: instance.name,
  };

  let jvmArgs = resolveArgumentList(merged.arguments?.jvm || [], features).map((arg) => replaceVars(arg, vars));
  if (!jvmArgs.length) jvmArgs = [];
  jvmArgs = ensureJvmArgs(jvmArgs, path.join(nativesDir, 'java'), classpath);
  if (logging?.argument) {
    const logArg = replaceVars(logging.argument, { path: logging.localPath });
    if (!jvmArgs.includes(logArg)) jvmArgs.push(logArg);
  }

  const customJvmArgs = parseArgs(instance.jvmArgs || settings.jvmArgs || '');
  const ram = Math.max(512, Number(instance.ramMb || settings.ramMb) || 4096);
  const minRam = Math.max(256, Math.min(ram, Number(instance.minRamMb || settings.minRamMb) || 1024));
  const hasXmx = [...jvmArgs, ...customJvmArgs].some((arg) => /^-Xmx/i.test(arg));
  const hasXms = [...jvmArgs, ...customJvmArgs].some((arg) => /^-Xms/i.test(arg));
  const memoryArgs = [];
  if (!hasXmx) memoryArgs.push(`-Xmx${ram}M`);
  if (!hasXms) memoryArgs.push(`-Xms${minRam}M`);
  jvmArgs = [...memoryArgs, ...jvmArgs, ...customJvmArgs];
  if (!jvmArgs.some((arg) => arg.startsWith('-Dminecraft.launcher.brand='))) {
    jvmArgs.push('-Dminecraft.launcher.brand=MineSphere');
  }
  if (!jvmArgs.some((arg) => arg.startsWith('-Dminecraft.launcher.version='))) {
    jvmArgs.push('-Dminecraft.launcher.version=1.0.0');
  }
  if (!jvmArgs.some((arg) => arg.startsWith('-Dlog4j2.formatMsgNoLookups='))) {
    jvmArgs.push('-Dlog4j2.formatMsgNoLookups=true');
  }

  let gameArgs = merged.arguments?.game?.length
    ? resolveArgumentList(merged.arguments.game, features)
    : parseArgs(merged.minecraftArguments || '');
  gameArgs = gameArgs.map((arg) => replaceVars(arg, vars));
  if (width && height && !gameArgs.includes('--width')) {
    gameArgs.push('--width', String(width), '--height', String(height));
  }
  applyAutoJoinArgs(instance, instance.version || merged.id, gameArgs, job);

  if (!merged.mainClass) throw new Error('A versão não define uma mainClass. Repara a instalação.');
  if (!gameArgs.length) throw new Error('A versão não define argumentos de jogo. Repara a instalação.');

  const javaMajor = merged.javaVersion?.majorVersion || inferJavaMajor(merged);
  const javaInfo = await pickJava(javaMajor, settings, job);
  job?.setStage('Lançamento', `A iniciar com Java ${javaInfo.major}...`);

  return {
    merged,
    gameDir,
    nativesDir,
    javaInfo,
    javaMajor,
    args: [...jvmArgs, merged.mainClass, ...gameArgs],
    logPath: path.join(gameDir, 'logs', `minesphere-${nowStamp()}.log`),
    commandPreview: `${javaInfo.path} ${[...jvmArgs, merged.mainClass, ...gameArgs].join(' ')}`,
  };
}

function launchInstance(instance, account, job, options = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      const prepared = await prepareLaunch(instance, account, job);
      const logDir = path.join(prepared.gameDir, 'logs');
      ensureDir(logDir);
      const logStream = fs.createWriteStream(prepared.logPath, { flags: 'a' });
      logStream.write(`=== MineSphere Launcher ===\n${new Date().toISOString()}\n${prepared.commandPreview}\n\n`);
      const child = spawn(prepared.javaInfo.path, prepared.args, {
        cwd: prepared.gameDir,
        env: process.env,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const state = {
        child,
        instanceId: instance.id,
        startedAt: Date.now(),
        logPath: prepared.logPath,
        lines: [],
        logStream,
        accountId: account.id,
      };
      running.set(instance.id, state);
      const handleData = (chunk) => {
        const text = chunk.toString();
        logStream.write(text);
        for (const line of text.split(/\r?\n/)) {
          if (!line.trim()) continue;
          state.lines.push(line);
          if (state.lines.length > 400) state.lines.shift();
        }
      };
      child.stdout.on('data', handleData);
      child.stderr.on('data', handleData);
      child.on('error', (error) => {
        logStream.write(`\n[ERRO] ${error.message}\n`);
        logStream.end();
        running.delete(instance.id);
        reject(error);
      });
      child.on('spawn', () => {
        job?.setStage('Em execução', `Minecraft iniciado (PID ${child.pid}).`);
        resolve({ ...state, pid: child.pid, commandPreview: prepared.commandPreview });
      });
      child.on('close', (code) => {
        logStream.write(`\n[PROCESSO TERMINADO] código ${code}\n`);
        logStream.end();
        state.closedAt = Date.now();
        state.exitCode = code;
        running.delete(instance.id);
        if (options.onExit) options.onExit(code, state);
        if (state.onExit) state.onExit(code);
      });
    } catch (error) {
      reject(error);
    }
  });
}

function getRunning(instanceId) {
  const state = running.get(instanceId);
  if (!state) return null;
  return {
    instanceId,
    pid: state.child.pid,
    startedAt: state.startedAt,
    elapsedMs: Date.now() - state.startedAt,
    exitCode: state.exitCode ?? null,
    logPath: state.logPath,
  };
}

function getRunningLogs(instanceId, limit = 200) {
  const state = running.get(instanceId);
  return state ? state.lines.slice(-limit) : [];
}

function stopInstance(instanceId) {
  const state = running.get(instanceId);
  if (!state) throw new Error('A instância não está em execução.');
  const pid = state.child.pid;
  if (process.platform === 'win32') {
    try {
      spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true });
    } catch {
      state.child.kill();
    }
  } else {
    state.child.kill('SIGTERM');
  }
  return true;
}

function listRunning() {
  return [...running.keys()].map((id) => getRunning(id)).filter(Boolean);
}

module.exports = {
  mergeVersion,
  buildClasspath,
  extractNatives,
  supportsQuickPlay,
  applyAutoJoinArgs,
  prepareLaunch,
  launchInstance,
  getRunning,
  getRunningLogs,
  stopInstance,
  listRunning,
  running,
};
