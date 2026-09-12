import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const chunkDir = join(root, 'src', 'assets', 'rumiRunV2Chunks');
const outputDir = join(root, 'public', 'assets');

const frames = [
  {
    output: 'rumi_run_01.webp',
    chunks: ['run0_0.js', 'run0_1.js', 'run0_2.js'],
    bytes: 26108,
    sha256: '72f4c3cd9a32ce9beba77daa01034bdf0de704c02704a93ea1cb6f2e654f80ef'
  },
  {
    output: 'rumi_run_02.webp',
    chunks: ['run1_0.js', 'run1_1.js'],
    bytes: 26038,
    sha256: '40d42431854982e320836fb12c2177721190062f934b0b0a84452cf90b529226'
  },
  {
    output: 'rumi_run_03.webp',
    chunks: ['run2_0.js', 'run2_1.js'],
    bytes: 26398,
    sha256: 'f523b87ed89cbee2372c7b632b5f70d4b763e476a4df0663f437f55af99687e2'
  },
  {
    output: 'rumi_run_04.webp',
    chunks: ['run3_0.js', 'run3_1.js'],
    bytes: 24612,
    sha256: '3c4af7f36eed79a0bc6bf19acbd2fb3bd647098758709cad269a5f05f33a13af'
  },
  {
    output: 'rumi_run_05.webp',
    chunks: ['run4_0.js', 'run4_1.js'],
    bytes: 25280,
    sha256: '7c3d0399683e8b8a460079fc50fa99fe5d162bcb02028d5e8ffd98f7bde5b204'
  }
];

function readBase64Chunk(file) {
  const source = readFileSync(join(chunkDir, file), 'utf8');
  const match = source.match(/export\s+default\s+['"]([A-Za-z0-9+/=]+)['"]/s);
  if (!match) throw new Error(`Could not parse Base64 payload from ${file}`);
  return match[1];
}

mkdirSync(outputDir, { recursive: true });

for (const frame of frames) {
  const payload = frame.chunks.map(readBase64Chunk).join('');
  const bytes = Buffer.from(payload, 'base64');
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const riff = bytes.subarray(0, 4).toString('ascii');
  const webp = bytes.subarray(8, 12).toString('ascii');

  if (bytes.length !== frame.bytes) {
    throw new Error(`${frame.output}: expected ${frame.bytes} bytes, got ${bytes.length}`);
  }
  if (sha256 !== frame.sha256) {
    throw new Error(`${frame.output}: SHA-256 mismatch (${sha256})`);
  }
  if (riff !== 'RIFF' || webp !== 'WEBP') {
    throw new Error(`${frame.output}: invalid WebP header`);
  }

  writeFileSync(join(outputDir, frame.output), bytes);
  console.log(`materialized ${frame.output} (${bytes.length} bytes, ${sha256.slice(0, 12)}…)`);
}
