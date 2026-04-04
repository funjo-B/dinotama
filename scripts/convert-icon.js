const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC = path.join(__dirname, '..', 'image', '유아 공룡의 작업 아이콘.png');
const OUT = path.join(__dirname, '..', 'public', 'assets', 'icons');

async function run() {
  const input = sharp(SRC);

  // PNG 각 사이즈
  for (const size of [16, 32, 48, 64, 128, 256, 512, 1024]) {
    await input.clone().resize(size, size).png().toFile(path.join(OUT, `icon-${size}.png`));
  }
  fs.copyFileSync(path.join(OUT, 'icon-256.png'), path.join(OUT, 'icon.png'));
  console.log('[Icon] PNGs done');

  // macOS ICNS
  const iconsetDir = path.join(OUT, 'icon.iconset');
  fs.mkdirSync(iconsetDir, { recursive: true });
  const icnsSizes = [
    ['icon_16x16.png', 16], ['icon_16x16@2x.png', 32],
    ['icon_32x32.png', 32], ['icon_32x32@2x.png', 64],
    ['icon_128x128.png', 128], ['icon_128x128@2x.png', 256],
    ['icon_256x256.png', 256], ['icon_256x256@2x.png', 512],
    ['icon_512x512.png', 512], ['icon_512x512@2x.png', 1024],
  ];
  for (const [name, size] of icnsSizes) {
    await input.clone().resize(size, size).png().toFile(path.join(iconsetDir, name));
  }
  execSync(`iconutil -c icns "${iconsetDir}" -o "${path.join(OUT, 'icon.icns')}"`);
  fs.rmSync(iconsetDir, { recursive: true, force: true });
  console.log('[Icon] icon.icns done');

  // Windows ICO
  const icoSizes = [16, 32, 48, 256];
  const entries = [];
  for (const size of icoSizes) {
    entries.push({ size, buf: await input.clone().resize(size, size).png().toBuffer() });
  }
  const headerSize = 6;
  const entrySize = 16;
  let offset = headerSize + entrySize * entries.length;
  const parts = [];
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(entries.length, 4);
  parts.push(header);
  const dataBuffers = [];
  for (const { size, buf } of entries) {
    const e = Buffer.alloc(entrySize);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(buf.length, 8); e.writeUInt32LE(offset, 12);
    parts.push(e);
    dataBuffers.push(buf);
    offset += buf.length;
  }
  fs.writeFileSync(path.join(OUT, 'icon.ico'), Buffer.concat([...parts, ...dataBuffers]));
  console.log('[Icon] icon.ico done');
}

run().catch(console.error);
