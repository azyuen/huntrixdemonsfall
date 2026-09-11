import crypto from 'node:crypto';
import { rumiAnimationBase64 } from '../src/assets/rumiAnimatedAssetLoader.js';

const EXPECTED_BASE64_LENGTH = 417976;
const EXPECTED_BYTE_LENGTH = 313480;
const EXPECTED_SHA256 = '866ccdc14312f505cd650dde42f18882941067d4cc089704579d8575faeaf2c3';

const invalid = [...rumiAnimationBase64].some(c => !/[A-Za-z0-9+/=]/.test(c));
const bytes = Buffer.from(rumiAnimationBase64, 'base64');
const sha = crypto.createHash('sha256').update(bytes).digest('hex');

if (rumiAnimationBase64.length !== EXPECTED_BASE64_LENGTH) {
  throw new Error(`Rumi atlas base64 length ${rumiAnimationBase64.length}, expected ${EXPECTED_BASE64_LENGTH}`);
}
if (invalid) {
  throw new Error('Rumi atlas contains invalid base64 characters');
}
if (bytes.length !== EXPECTED_BYTE_LENGTH) {
  throw new Error(`Rumi atlas byte length ${bytes.length}, expected ${EXPECTED_BYTE_LENGTH}`);
}
if (sha !== EXPECTED_SHA256) {
  throw new Error(`Rumi atlas checksum ${sha} does not match approved art ${EXPECTED_SHA256}`);
}

console.log(`Rumi atlas verified: ${bytes.length} bytes, sha256 ${sha}`);
