function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c >>> 0;
    }
  }
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function makeStringPool(strings) {
  const headerSize = 28;
  const count = strings.length;
  const offsets = [];
  const chunks = [];
  let pos = 0;
  for (const s of strings) {
    offsets.push(pos);
    const b = Buffer.alloc(2 + s.length * 2);
    b.writeUInt16LE(s.length, 0);
    for (let i = 0; i < s.length; i++) b.writeUInt16LE(s.charCodeAt(i), 2 + i * 2);
    chunks.push(b);
    pos += b.length;
  }
  const stringsStart = headerSize + count * 4;
  const size = stringsStart + pos;
  const buf = Buffer.alloc(size);
  buf.writeUInt16LE(0x0001, 0);
  buf.writeUInt16LE(headerSize, 2);
  buf.writeUInt32LE(size, 4);
  buf.writeUInt32LE(count, 8);
  buf.writeUInt32LE(0, 12);
  buf.writeUInt32LE(0, 16);
  buf.writeUInt32LE(stringsStart, 20);
  buf.writeUInt32LE(0, 24);
  offsets.forEach((o, i) => buf.writeUInt32LE(o, headerSize + i * 4));
  let p = stringsStart;
  for (const d of chunks) { d.copy(buf, p); p += d.length; }
  return buf;
}

function makeStartElement(name, attributes) {
  const count = attributes.length;
  const body = Buffer.alloc(16 + 20 + count * 20);
  body.writeUInt16LE(0x0102, 0);
  body.writeUInt16LE(16, 2);
  body.writeUInt32LE(body.length, 4);
  body.writeUInt32LE(0xffffffff, 8);
  body.writeUInt32LE(name, 12);
  body.writeUInt16LE(20, 16);
  body.writeUInt16LE(20, 18);
  body.writeUInt16LE(count, 20);
  body.writeUInt16LE(0xffff, 22);
  body.writeUInt16LE(0xffff, 24);
  body.writeUInt16LE(0xffff, 26);
  attributes.forEach((attr, i) => {
    const aOff = 36 + i * 20;
    body.writeUInt32LE(attr.ns ?? 0xffffffff, aOff);
    body.writeUInt32LE(attr.name, aOff + 4);
    body.writeUInt32LE(attr.raw ?? 0xffffffff, aOff + 8);
    body.writeUInt16LE(8, aOff + 12);
    body.writeUInt8(0, aOff + 14);
    body.writeUInt8(attr.type ?? 0x03, aOff + 15);
    body.writeUInt32LE(attr.data ?? 0, aOff + 16);
  });
  return body;
}

function makeAndroidManifest({ packageName, versionName, versionCode = 4 }) {
  const strings = [
    "manifest", "package", "versionName", "versionCode",
    "uses-permission", "name",
    packageName, versionName, "android.permission.INTERNET"
  ];
  const pool = makeStringPool(strings);
  const manifestElem = makeStartElement(0, [
    { name: 1, type: 0x03, data: 6 },
    { name: 2, type: 0x03, data: 7 },
    { name: 3, type: 0x10, data: versionCode }
  ]);
  const usesPerm = makeStartElement(4, [
    { name: 5, type: 0x03, data: 8 }
  ]);

  const header = Buffer.alloc(8);
  header.writeUInt16LE(0x0003, 0);
  header.writeUInt16LE(8, 2);
  header.writeUInt32LE(8 + pool.length + manifestElem.length + usesPerm.length, 4);

  return Buffer.concat([header, pool, manifestElem, usesPerm]);
}

function makeZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, "utf8");
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(0, 10);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, nameBuf, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x031e, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(0, 12);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBuf);

    offset += 30 + nameBuf.length + data.length;
  }
  const centralBuffer = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuffer.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, centralBuffer, eocd]);
}

function makeTestApk({ packageName = "com.crowmods.testapp", versionName = "1.2.3", versionCode = 4 } = {}) {
  const manifest = makeAndroidManifest({ packageName, versionName, versionCode });
  const classesDex = Buffer.from("dex\n035\0".padEnd(64, "\0"), "binary");
  const resources = Buffer.alloc(32, 1);
  const signer = Buffer.from("META-INF signing cert placeholder");
  return makeZip([
    { name: "AndroidManifest.xml", data: manifest },
    { name: "classes.dex", data: classesDex },
    { name: "resources.arsc", data: resources },
    { name: "META-INF/CERT.RSA", data: signer }
  ]);
}

module.exports = { makeTestApk, makeZip, crc32 };