'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { createApp, VERSION } = require('./src/api');
const { DATA, GAME } = require('./src/paths');

const BASE_PORT = Number(process.env.MINESPHERE_PORT) || 47821;
const NO_OPEN = process.argv.includes('--no-open');

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index !== -1 && process.argv[index + 1]) return process.argv[index + 1];
  const inline = process.argv.find((arg) => arg.startsWith(`${name}=`));
  return inline ? inline.slice(name.length + 1) : null;
}

// The desktop host starts this server as a child. If the host crashes or is
// killed, the child would keep the port and the data files locked, so stop as
// soon as the parent disappears. Running games are separate processes and
// are left alone.
function watchParent(pid) {
  const parent = Number(pid);
  if (!Number.isInteger(parent) || parent <= 0) return;
  const timer = setInterval(() => {
    try {
      process.kill(parent, 0);
    } catch (error) {
      if (error.code !== 'ESRCH') return;
      clearInterval(timer);
      process.exit(0);
    }
  }, 2000);
  if (typeof timer.unref === 'function') timer.unref();
}

function findBrowser() {
  const candidates = [
    process.env['PROGRAMFILES(X86)'] && path.join(process.env['PROGRAMFILES(X86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env['PROGRAMFILES(X86)'] && path.join(process.env['PROGRAMFILES(X86)'], 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ].filter(Boolean);
  return candidates.find((candidate) => {
    try {
      return fs.existsSync(candidate);
    } catch {
      return false;
    }
  });
}

function openWindow(url) {
  const browser = findBrowser();
  if (browser) {
    const child = spawn(
      browser,
      [`--app=${url}`, '--window-size=1480,920', '--no-first-run', '--disable-features=TranslateUI'],
      { detached: true, stdio: 'ignore', windowsHide: false },
    );
    child.unref();
    return;
  }
  if (process.platform === 'win32') {
    spawn('cmd.exe', ['/c', 'start', '', url], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
  } else if (process.platform === 'darwin') {
    spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
  } else {
    spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
  }
}

function bind(app, startPort) {
  return new Promise((resolve, reject) => {
    let port = startPort;
    const attempt = (tries) => {
      const server = http.createServer(app);
      const onError = (error) => {
        server.removeListener('listening', onListening);
        if (error.code === 'EADDRINUSE' && tries < 20) {
          port += 1;
          setTimeout(() => attempt(tries + 1), 120);
          return;
        }
        reject(error);
      };
      const onListening = () => {
        server.removeListener('error', onError);
        resolve({ server, port });
      };
      server.once('error', onError);
      server.once('listening', onListening);
      server.listen(port, '127.0.0.1');
    };
    attempt(0);
  });
}

async function startServer(options = {}) {
  const app = options.app || createApp();
  const { server, port } = await bind(app, Number(options.port) || BASE_PORT);
  const url = `http://127.0.0.1:${port}`;

  if (options.log !== false) {
    console.log('');
    console.log('  ███╗   ███╗██╗███╗   ██╗███████╗███████╗██████╗ ██╗  ██╗███████╗██████╗ ███████╗');
    console.log('  ████╗ ████║██║████╗  ██║██╔════╝██╔════╝██╔══██╗██║  ██║██╔════╝██╔══██╗██╔════╝');
    console.log('  ██╔████╔██║██║██╔██╗ ██║█████╗  ███████╗██████╔╝███████║█████╗  ██████╔╝█████╗  ');
    console.log('  ██║╚██╔╝██║██║██║╚██╗██║██╔══╝  ╚════██║██╔═══╝ ██╔══██║██╔══╝  ██╔══██╗██╔══╝  ');
    console.log('  ██║ ╚═╝ ██║██║██║ ╚████║███████╗███████║██║     ██║  ██║███████╗██║  ██║███████╗');
    console.log('  ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝╚═╝     ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝');
    console.log('');
    console.log(`  MineSphere Launcher v${VERSION}`);
    console.log(`  Interface: ${url}`);
    console.log(`  Dados:     ${DATA}`);
    console.log(`  Jogo:      ${GAME}`);
    console.log('');
    console.log('  Mantém esta janela aberta enquanto usares o launcher.');
    console.log('  Pressiona Ctrl+C para terminar.');
    console.log('');
  }

  if (options.open !== false) openWindow(url);
  return { server, port, url, close: () => new Promise((resolve) => server.close(resolve)) };
}

if (require.main === module) {
  watchParent(argValue('--parent-pid'));
  startServer({ open: !NO_OPEN }).catch((error) => {
    console.error('Não foi possível iniciar o servidor:', error);
    process.exitCode = 1;
  });

  process.on('unhandledRejection', (error) => {
    console.error('[unhandledRejection]', error);
  });

  process.on('uncaughtException', (error) => {
    console.error('[uncaughtException]', error);
  });
}

module.exports = { startServer, openWindow, findBrowser };
