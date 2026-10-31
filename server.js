'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { createApp, VERSION } = require('./src/api');

const BASE_PORT = Number(process.env.MINESPHERE_PORT) || 47821;
const NO_OPEN = process.argv.includes('--no-open');

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
  if (NO_OPEN) return;
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

const app = createApp();
let port = BASE_PORT;

function listen(attempt = 0) {
  const server = http.createServer(app);
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && attempt < 20) {
      port += 1;
      setTimeout(() => listen(attempt + 1), 120);
      return;
    }
    console.error('Não foi possível iniciar o servidor:', error);
    process.exit(1);
  });
  server.listen(port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${port}`;
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
    console.log(`  Dados:     ${path.join(__dirname, 'data')}`);
    console.log(`  Jogo:      ${path.join(__dirname, 'game')}`);
    console.log('');
    console.log('  Mantém esta janela aberta enquanto usares o launcher.');
    console.log('  Pressiona Ctrl+C para terminar.');
    console.log('');
    openWindow(url);
  });
}

listen();

process.on('unhandledRejection', (error) => {
  console.error('[unhandledRejection]', error);
});

process.on('uncaughtException', (error) => {
  console.error('[uncaughtException]', error);
});
