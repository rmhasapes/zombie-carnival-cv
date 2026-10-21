import fs from 'node:fs';
import zlib from 'node:zlib';

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const output = Buffer.alloc(data.length + 12);
  output.writeUInt32BE(data.length, 0);
  name.copy(output, 4);
  data.copy(output, 8);
  output.writeUInt32BE(crc32(Buffer.concat([name, data])), data.length + 8);
  return output;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function processAtlas(inputPath, outputPath) {
  const png = fs.readFileSync(inputPath);
  const signature = png.subarray(0, 8);
  let offset = 8, ihdr, width, height;
  const compressed = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      ihdr = Buffer.from(data);
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 6 || data[12] !== 0) throw new Error(`${inputPath}: expected non-interlaced 8-bit RGBA PNG`);
    } else if (type === 'IDAT') compressed.push(data);
    offset += length + 12;
  }

  const raw = zlib.inflateSync(Buffer.concat(compressed));
  const stride = width * 4;
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const source = raw[y * (stride + 1) + 1 + x];
      const left = x >= 4 ? pixels[y * stride + x - 4] : 0;
      const above = y ? pixels[(y - 1) * stride + x] : 0;
      const upperLeft = y && x >= 4 ? pixels[(y - 1) * stride + x - 4] : 0;
      const predictor = filter === 0 ? 0 : filter === 1 ? left : filter === 2 ? above : filter === 3 ? Math.floor((left + above) / 2) : filter === 4 ? paeth(left, above, upperLeft) : NaN;
      if (!Number.isFinite(predictor)) throw new Error(`${inputPath}: unsupported PNG filter ${filter}`);
      pixels[y * stride + x] = (source + predictor) & 255;
    }
  }

  for (let i = 0; i < pixels.length; i += 4) {
    const red = pixels[i], green = pixels[i + 1], blue = pixels[i + 2];
    const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    pixels[i] = Math.max(0, Math.min(255, Math.round((luminance + (red - luminance) * 0.30) * 0.96 - 3)));
    pixels[i + 1] = Math.max(0, Math.min(255, Math.round((luminance + (green - luminance) * 0.30) * 0.96 - 3)));
    pixels[i + 2] = Math.max(0, Math.min(255, Math.round((luminance + (blue - luminance) * 0.30) * 0.98 - 2)));
    // Alpha is intentionally untouched.
  }

  const scanlines = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) pixels.copy(scanlines, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  fs.writeFileSync(outputPath, Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(scanlines, {level: 9})), chunk('IEND', Buffer.alloc(0))]));
}

for (let index = 0; index < 6; index++) processAtlas(`assets/rig-${index}.png`, `assets/rig-muted-${index}.png`);
