import "server-only";

import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";

const GRID = 5;
const CELL = 12;
const SIZE = GRID * CELL;
const BACKGROUND: [number, number, number] = [241, 243, 248];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(input: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < input.length; i += 1) {
    crc = CRC_TABLE[(crc ^ input[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([length, typeBytes, data, crc]);
}

function encodePng(width: number, height: number, rgb: Buffer): Buffer {
  const stride = width * 3;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y += 1) {
    // One filter byte (0 = none) in front of every scanline.
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (h % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let rgb: [number, number, number];
  if (hp < 1) rgb = [c, x, 0];
  else if (hp < 2) rgb = [x, c, 0];
  else if (hp < 3) rgb = [0, c, x];
  else if (hp < 4) rgb = [0, x, c];
  else if (hp < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const m = l - c / 2;
  return rgb.map((value) => Math.round((value + m) * 255)) as [
    number,
    number,
    number,
  ];
}

/**
 * Deterministic default avatar: a 5x5 mirrored identicon in the learner's own
 * colour, derived from their leaderboard id. It is generated, never stored, so a
 * learner who never uploads a photo still has a stable picture on the board.
 */
export function generatedAvatar(id: string): {
  contentType: string;
  bytes: Buffer;
} {
  const digest = createHash("sha256").update(id).digest();
  const foreground = hslToRgb(digest[0] * (360 / 256), 0.62, 0.55);

  const pixels = Buffer.alloc(SIZE * SIZE * 3);
  const paint = (x: number, y: number, colour: [number, number, number]) => {
    const offset = (y * SIZE + x) * 3;
    pixels[offset] = colour[0];
    pixels[offset + 1] = colour[1];
    pixels[offset + 2] = colour[2];
  };

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      paint(x, y, BACKGROUND);
    }
  }

  // Only the left half is picked from the hash; the right half mirrors it, which
  // is what gives every identicon a symmetric, face-like shape.
  for (let col = 0; col < 3; col += 1) {
    for (let row = 0; row < GRID; row += 1) {
      if (((digest[1 + row] >> col) & 1) === 0) continue;
      const mirror = GRID - 1 - col;
      for (let dy = 0; dy < CELL; dy += 1) {
        const y = row * CELL + dy;
        for (let dx = 0; dx < CELL; dx += 1) {
          paint(col * CELL + dx, y, foreground);
          paint(mirror * CELL + dx, y, foreground);
        }
      }
    }
  }

  return { contentType: "image/png", bytes: encodePng(SIZE, SIZE, pixels) };
}
