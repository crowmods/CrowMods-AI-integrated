const zlib = require("node:zlib");

function readU16(buf, off) { return buf.readUInt16LE(off); }
function readU32(buf, off) { return buf.readUInt32LE(off); }

function parseZip(buffer) {
  const entries = [];
  let eocd = -1;
  for (let i = buffer.length - 22; i >= 0; i--) {
    if (buffer[i] === 0x50 && buffer[i + 1] === 0x4b &&
        buffer[i + 2] === 0x05 && buffer[i + 3] === 0x06) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) return { entries: [], error: "EOCD not found" };

  const cdCount = readU16(buffer, eocd + 10);
  const cdOffset = readU32(buffer, eocd + 16);

  let off = cdOffset;
  for (let i = 0; i < cdCount; i++) {
    if (off + 46 > buffer.length) break;
    if (buffer[off] !== 0x50 || buffer[off + 1] !== 0x4b ||
        buffer[off + 2] !== 0x01 || buffer[off + 3] !== 0x02) break;
    const compMethod = readU16(buffer, off + 10);
    const compSize = readU32(buffer, off + 20);
    const uncompSize = readU32(buffer, off + 24);
    const nameLen = readU16(buffer, off + 28);
    const extraLen = readU16(buffer, off + 30);
    const commentLen = readU16(buffer, off + 32);
    const localOffset = readU32(buffer, off + 42);
    const name = buffer.slice(off + 46, off + 46 + nameLen).toString("utf8");
    entries.push({
      name,
      method: compMethod,
      compressedSize: compSize,
      size: uncompSize,
      localOffset
    });
    off += 46 + nameLen + extraLen + commentLen;
  }
  return { entries, error: null };
}

function extractEntry(buffer, entry) {
  const localHeader = entry.localOffset;
  if (buffer[localHeader] !== 0x50 || buffer[localHeader + 1] !== 0x4b) return null;
  const nameLen = readU16(buffer, localHeader + 26);
  const extraLen = readU16(buffer, localHeader + 28);
  const dataStart = localHeader + 30 + nameLen + extraLen;
  const data = buffer.slice(dataStart, dataStart + entry.compressedSize);
  if (entry.method === 0) return data;
  if (entry.method === 8) {
    try {
      return zlib.inflateRawSync(data);
    } catch {
      return null;
    }
  }
  return null;
}

function parseStringPool(buf, poolOffset) {
  const headerSize = readU16(buf, poolOffset + 2);
  const stringCount = readU32(buf, poolOffset + 8);
  const flags = readU32(buf, poolOffset + 16);
  const stringsStart = readU32(buf, poolOffset + 20);
  const isUtf8 = (flags & 0x100) !== 0;
  const strings = [];
  let offset = poolOffset + headerSize;
  const offsets = [];
  for (let i = 0; i < stringCount; i++) {
    offsets.push(readU32(buf, offset));
    offset += 4;
  }
  const base = poolOffset + stringsStart;
  for (let i = 0; i < stringCount; i++) {
    let p = base + offsets[i];
    if (isUtf8) {
      const len = readUtf8Length(buf, p);
      const [str, next] = len;
      p = next;
      strings.push(buf.slice(p, p + str).toString("utf8"));
    } else {
      const len = readUtf16Length(buf, p);
      const [str, next] = len;
      p = next;
      let s = "";
      for (let j = 0; j < str; j++) s += String.fromCharCode(readU16(buf, p + j * 2));
      strings.push(s);
    }
  }
  return { strings, isUtf8 };
}

function readUtf8Length(buf, p) {
  const b0 = buf[p];
  if (b0 & 0x80) {
    const len = ((b0 & 0x7f) << 8) | buf[p + 1];
    return [len, p + 2];
  }
  return [b0, p + 1];
}

function readUtf16Length(buf, p) {
  const b0 = readU16(buf, p);
  if (b0 & 0x8000) {
    const len = ((b0 & 0x7fff) << 16) | readU16(buf, p + 2);
    return [len, p + 4];
  }
  return [b0, p + 2];
}

const TYPE_STRING = 0x03;

function parseManifest(buffer) {
  const result = {
    package: null,
    versionName: null,
    versionCode: null,
    minSdk: null,
    targetSdk: null,
    permissions: []
  };

  let off = 0;
  let pool = null;

  const rootType = readU16(buffer, 0);
  const rootSize = readU32(buffer, 4);
  if (rootType === 0x0003) {
    off = 8;
  }

  while (off + 8 <= buffer.length) {
    const type = readU16(buffer, off);
    const headerSize = readU16(buffer, off + 2);
    const size = readU32(buffer, off + 4);
    if (size === 0 || off + size > buffer.length) break;

    if (type === 0x0001) {
      pool = parseStringPool(buffer, off);
    } else if (type === 0x0102 && pool) {
      const nameIdx = readU32(buffer, off + 12);
      const attrStart = readU16(buffer, off + 16);
      const attrCount = readU16(buffer, off + 20);
      const tagName = pool.strings[nameIdx] || "";
      const attrBase = off + headerSize + attrStart;
      for (let a = 0; a < attrCount; a++) {
        const aOff = attrBase + a * 20;
        const aNameIdx = readU32(buffer, aOff + 4);
        const rawIdx = readU32(buffer, aOff + 8);
        const dataType = buffer[aOff + 15];
        const typed = readU32(buffer, aOff + 16);
        const aName = pool.strings[aNameIdx] || "";
        let value = null;
        if (dataType === TYPE_STRING) {
          const idx = typed;
          if (idx !== 0xffffffff && pool.strings[idx] !== undefined) value = pool.strings[idx];
          else if (rawIdx !== 0xffffffff && pool.strings[rawIdx] !== undefined) value = pool.strings[rawIdx];
        }
        if (tagName === "manifest") {
          if (aName === "package") result.package = value;
          if (aName === "versionName") result.versionName = value;
          if (aName === "versionCode") result.versionCode = value ?? typed;
        }
        if (tagName === "uses-sdk") {
          if (aName === "minSdkVersion") result.minSdk = value ?? typed;
          if (aName === "targetSdkVersion") result.targetSdk = value ?? typed;
        }
        if (tagName === "uses-permission" && aName === "name" && value) {
          result.permissions.push(value);
        }
      }
    }
    off += size;
  }
  return result;
}

function extractMetadata(buffer, extension) {
  const { entries, error } = parseZip(buffer);
  if (error) return { ok: false, error, fileCount: 0 };
  const names = entries.map(e => e.name);
  const info = {
    ok: true,
    fileCount: entries.length,
    format: "zip",
    androidManifest: null,
    signers: [],
    hasApkSigningBlock: false,
    hasClassesDex: false,
    hasResourcesArsc: false
  };

  const manifestEntry = entries.find(e => e.name === "AndroidManifest.xml");
  if (manifestEntry) {
    const data = extractEntry(buffer, manifestEntry);
    if (data) {
      info.androidManifest = parseManifest(data);
    }
  }

  info.hasClassesDex = names.some(n => n === "classes.dex" || /^classes\d*\.dex$/.test(n));
  info.hasResourcesArsc = names.some(n => n === "resources.arsc");
  info.signers = names
    .filter(n => /^META-INF\/.+\.(RSA|DSA|EC)$/i.test(n))
    .map(n => ({ entry: n }));

  const blockMarker = Buffer.from("APK Sig Block 42");
  const idx = buffer.indexOf(blockMarker);
  info.hasApkSigningBlock = idx !== -1;

  return info;
}

module.exports = { extractMetadata, parseZip, parseManifest };