'use strict';

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const zlib = require('zlib');
const { safeJoin, ensureDir } = require('./util');

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function findEndOfCentralDirectory(buffer) {
  const min = Math.max(0, buffer.length - 65558);
  for (let i = buffer.length - 22; i >= min; i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) return i;
  }
  throw new Error('Ficheiro ZIP inválido (EOCD não encontrado).');
}

function readZip(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 22) throw new Error('Ficheiro ZIP inválido.');
  const eocd = findEndOfCentralDirectory(buffer);
  const count = buffer.readUInt16LE(eocd + 10);
  const cdOffset = buffer.readUInt32LE(eocd + 16);
  if (count === 0xffff || cdOffset === 0xffffffff) throw new Error('ZIP64 não é suportado.');
  const entries = [];
  let offset = cdOffset;
  for (let i = 0; i < count; i += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error('Diretório central ZIP inválido.');
    const flags = buffer.readUInt16LE(offset + 8);
    const method = buffer.readUInt16LE(offset + 10);
    const crc = buffer.readUInt32LE(offset + 16);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLength).replace(/\\/g, '/');
    entries.push({
      name,
      flags,
      method,
      crc,
      compressedSize,
      uncompressedSize,
      localOffset,
      isDirectory: name.endsWith('/'),
    });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function entryData(buffer, entry) {
  if (entry.isDirectory) return Buffer.alloc(0);
  const local = entry.localOffset;
  if (buffer.readUInt32LE(local) !== 0x04034b50) throw new Error(`Cabeçalho local ZIP inválido para ${entry.name}.`);
  const nameLength = buffer.readUInt16LE(local + 26);
  const extraLength = buffer.readUInt16LE(local + 28);
  const start = local + 30 + nameLength + extraLength;
  const compressed = buffer.subarray(start, start + entry.compressedSize);
  let data;
  if (entry.method === 0) data = Buffer.from(compressed);
  else if (entry.method === 8) data = zlib.inflateRawSync(compressed);
  else throw new Error(`Método de compressão ZIP não suportado (${entry.method}) para ${entry.name}.`);
  if (data.length !== entry.uncompressedSize) throw new Error(`Tamanho inválido no ZIP para ${entry.name}.`);
  if (crc32(data) !== entry.crc) throw new Error(`CRC inválido no ZIP para ${entry.name}.`);
  return data;
}

function getZipEntry(buffer, name) {
  const entry = readZip(buffer).find((item) => item.name === name);
  if (!entry) return null;
  return { entry, data: entryData(buffer, entry) };
}

async function extractZip(buffer, destDir, options = {}) {
  const entries = readZip(buffer);
  const filter = typeof options.filter === 'function' ? options.filter : () => true;
  let written = 0;
  for (const entry of entries) {
    if (entry.isDirectory) continue;
    if (entry.name.startsWith('__MACOSX/') || entry.name === '.DS_Store') continue;
    if (!filter(entry)) continue;
    const target = safeJoin(destDir, entry.name);
    ensureDir(path.dirname(target));
    await fsp.writeFile(target, entryData(buffer, entry));
    written += 1;
    if (options.onEntry) options.onEntry(entry, written);
    if (written % 20 === 0) await new Promise((resolve) => setImmediate(resolve));
  }
  return written;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}

function createZip(entries) {
  const chunks = [];
  const central = [];
  let offset = 0;
  let count = 0;
  const { dosTime, dosDate } = dosDateTime();

  for (const item of entries) {
    const name = String(item.name).replace(/\\/g, '/').replace(/^\/+/, '');
    if (!name) continue;
    const data = Buffer.isBuffer(item.data) ? item.data : Buffer.from(String(item.data ?? ''), 'utf8');
    const crc = crc32(data);
    const shouldDeflate = data.length > 32;
    const compressed = shouldDeflate ? zlib.deflateRawSync(data, { level: 6 }) : data;
    const method = shouldDeflate ? 8 : 0;
    const nameBuffer = Buffer.from(name, 'utf8');
    const flags = 0x0800;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(flags, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    local.writeUInt16LE(0, 28);

    chunks.push(local, nameBuffer, compressed);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(flags, 8);
    cd.writeUInt16LE(method, 10);
    cd.writeUInt16LE(dosTime, 12);
    cd.writeUInt16LE(dosDate, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(compressed.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuffer.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nameBuffer);

    offset += local.length + nameBuffer.length + compressed.length;
    count += 1;
  }

  const centralBuffer = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(count, 8);
  end.writeUInt16LE(count, 10);
  end.writeUInt32LE(centralBuffer.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...chunks, centralBuffer, end]);
}

async function createZipFromDirectory(root, base = root, options = {}) {
  const entries = [];
  async function walk(dir) {
    let list;
    try {
      list = await fsp.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const item of list) {
      const full = path.join(dir, item.name);
      const relative = path.relative(base, full).replace(/\\/g, '/');
      if (options.filter && !options.filter(relative, full, item)) continue;
      if (item.isDirectory()) {
        await walk(full);
      } else if (item.isFile()) {
        const stat = await fsp.stat(full);
        if (options.maxFileSize && stat.size > options.maxFileSize) continue;
        entries.push({ name: relative, data: await fsp.readFile(full) });
      }
    }
  }
  await walk(root);
  return createZip(entries);
}

module.exports = {
  crc32,
  readZip,
  entryData,
  getZipEntry,
  extractZip,
  createZip,
  createZipFromDirectory,
};
