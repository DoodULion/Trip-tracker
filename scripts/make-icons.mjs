// Generates the app icons (PNG) with no dependencies: node scripts/make-icons.mjs
// The icon is a station sign: an orange field, an ink route line, a white roundel, two end stations.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const ORANGE = [243, 151, 0];
const INK = [26, 26, 26];
const WHITE = [255, 255, 255];

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Colour of a point in unit space (0..1). `s` scales the artwork about the centre (maskable icons keep to a safe zone).
function sample(u, v, s) {
  const x = (u - 0.5) / s + 0.5;
  const y = (v - 0.5) / s + 0.5;
  const d = (cx, cy) => Math.hypot(x - cx, y - cy);
  if (d(0.5, 0.5) <= 0.115) return WHITE; // roundel face
  if (d(0.5, 0.5) <= 0.215) return INK; // roundel ring
  if (d(0.17, 0.5) <= 0.07 || d(0.83, 0.5) <= 0.07) return INK; // end stations
  if (x >= 0.17 && x <= 0.83 && Math.abs(y - 0.5) <= 0.035) return INK; // route line
  return ORANGE;
}

function render(size, s = 1) {
  const SS = 4; // 4x4 supersampling for smooth edges
  return png(size, (px, py) => {
    let r = 0, g = 0, b = 0;
    for (let j = 0; j < SS; j++) {
      for (let i = 0; i < SS; i++) {
        const c = sample((px + (i + 0.5) / SS) / size, (py + (j + 0.5) / SS) / size, s);
        r += c[0]; g += c[1]; b += c[2];
      }
    }
    const n = SS * SS;
    return [r / n, g / n, b / n];
  });
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192.png', render(192));
writeFileSync('public/icons/icon-512.png', render(512));
writeFileSync('public/icons/icon-512-maskable.png', render(512, 0.78));
writeFileSync('public/icons/apple-touch-icon.png', render(180)); // 180x180, as iOS requires
writeFileSync('public/icons/favicon-48.png', render(48));
console.log('icons written to public/icons');
