/**
 * gen-icons.mjs — draws the app icons with no image dependencies.
 * Run with: node scripts/gen-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'public/icons');
mkdirSync(outDir, { recursive: true });

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const payload = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(payload), 0);
  return Buffer.concat([length, payload, crc]);
}

function encodePNG(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  return Buffer.concat([
    signature,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

function inRoundRect(x, y, x0, y0, x1, y1, r) {
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

function render(size, maskable) {
  const SS = 3;
  const scale = maskable ? 0.74 : 1;
  const barWidth = 0.138 * scale;
  const gap = 0.086 * scale;
  const totalWidth = barWidth * 3 + gap * 2;
  const left = 0.5 - totalWidth / 2;
  const baseline = 0.5 + 0.19 * scale;
  const heights = [0.245, 0.38, 0.515].map((h) => h * scale);
  const colors = [
    [0x2f, 0xa8, 0x7c],
    [0x4f, 0xd6, 0xa2],
    [0xcf, 0xfa, 0xe5],
  ];
  const bars = heights.map((h, index) => {
    const x0 = left + index * (barWidth + gap);
    return { x0, x1: x0 + barWidth, y0: baseline - h, y1: baseline, r: barWidth / 2, color: colors[index] };
  });

  const sample = (px, py) => {
    // Background: near-black green with a soft emerald glow from the top left.
    let rgb = mix([9, 25, 19], [4, 11, 8], py);
    const distance = Math.hypot(px - 0.3, py - 0.16);
    const glow = Math.max(0, 1 - distance / 0.78) ** 2 * 0.55;
    rgb = mix(rgb, [20, 132, 94], glow);
    for (const bar of bars) {
      if (inRoundRect(px, py, bar.x0, bar.y0, bar.x1, bar.y1, bar.r)) return bar.color;
    }
    return rgb;
  };

  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          const px = (x * SS + sx + 0.5) / (SS * size);
          const py = (y * SS + sy + 0.5) / (SS * size);
          const color = sample(px, py);
          r += color[0];
          g += color[1];
          b += color[2];
        }
      }
      const count = SS * SS;
      const offset = (y * size + x) * 4;
      rgba[offset] = Math.round(r / count);
      rgba[offset + 1] = Math.round(g / count);
      rgba[offset + 2] = Math.round(b / count);
      rgba[offset + 3] = 255;
    }
  }
  return encodePNG(size, size, rgba);
}

const targets = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-512-maskable.png', 512, true],
  ['apple-touch-icon.png', 180, false],
];

for (const [name, size, maskable] of targets) {
  writeFileSync(resolve(outDir, name), render(size, maskable));
  console.log(`wrote public/icons/${name} (${size}px)`);
}
