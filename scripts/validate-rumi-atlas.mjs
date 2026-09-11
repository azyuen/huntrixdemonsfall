import crypto from 'node:crypto';
import { rumiAnimationBase64 } from '../src/assets/rumiAnimatedAssetLoader.js';

const EXPECTED_BASE64_LENGTH = 417976;
const EXPECTED_BYTE_LENGTH = 313480;
const EXPECTED_SHA256 = '866ccdc14312f505cd650dde42f18882941067d4cc089704579d8575faeaf2c3';

const invalid=[];
for(let i=0;i<rumiAnimationBase64.length;i++){
  const c=rumiAnimationBase64[i];
  if(!/[A-Za-z0-9+/=]/.test(c)) invalid.push([i,JSON.stringify(c)]);
}
const padding=[];
for(let i=0;i<rumiAnimationBase64.length;i++) if(rumiAnimationBase64[i]==='=') padding.push(i);
const marker='[... truncated ...]';
const markers=[];
for(let pos=rumiAnimationBase64.indexOf(marker); pos!==-1; pos=rumiAnimationBase64.indexOf(marker,pos+1)) markers.push(pos);

const bytes = Buffer.from(rumiAnimationBase64, 'base64');
const sha = crypto.createHash('sha256').update(bytes).digest('hex');
console.log('Rumi atlas diagnostics',JSON.stringify({base64Length:rumiAnimationBase64.length,byteLength:bytes.length,sha,markers,invalid:invalid.slice(0,40),padding:padding.slice(0,20),paddingCount:padding.length}));

if (rumiAnimationBase64.length !== EXPECTED_BASE64_LENGTH) {
  throw new Error(`Rumi atlas base64 length ${rumiAnimationBase64.length}, expected ${EXPECTED_BASE64_LENGTH}`);
}
if (invalid.length) throw new Error(`Rumi atlas contains ${invalid.length} invalid base64 characters`);
if (padding.length && (padding.length>2 || padding[0] < EXPECTED_BASE64_LENGTH-2)) {
  throw new Error(`Rumi atlas contains internal base64 padding at ${padding.join(',')}`);
}
if (bytes.length !== EXPECTED_BYTE_LENGTH) {
  throw new Error(`Rumi atlas byte length ${bytes.length}, expected ${EXPECTED_BYTE_LENGTH}`);
}
if (sha !== EXPECTED_SHA256) {
  throw new Error(`Rumi atlas checksum ${sha} does not match approved art ${EXPECTED_SHA256}`);
}

console.log(`Rumi atlas verified: ${bytes.length} bytes, sha256 ${sha}`);
