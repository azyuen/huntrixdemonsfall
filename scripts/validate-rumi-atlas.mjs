import crypto from 'node:crypto';
import { rumiAnimationBase64 } from '../src/assets/rumiAnimatedAssetLoader.js';

const EXPECTED_BASE64_LENGTH = 417976;
const EXPECTED_BYTE_LENGTH = 313480;
const EXPECTED_SHA256 = '866ccdc14312f505cd650dde42f18882941067d4cc089704579d8575faeaf2c3';
const EXPECTED_CHUNK_SHA = [
'395c9f1719cd1a7f58e7ca299b935aa030ebcd67c7d54c68263bf98baa295c92','ffc09dd29ae07a4dff7c158a577778c8e0dd7aa0e8aeae2b077f8718e1cb5fa9','43b26401097a2b1816d69d5661cb23202365efc9bc7d4bcad9d3fc6c93f62646','846b4dc8d076fdd5a8cd973d0804df77dc8d2af24a41be99fb1f18f49be6f1a7','75eef6f0f886b67cbe244b9afd8e6454bc2d784576d2ba420fd612dded63baa0','f4dee712e3b70a295a54de4eb6611df61382c1b824714b51ad314ce7711cdabb','dce511e0bd36e497451a61360ffd151f0b612522b34dc0f7ebbd27aa649d6aff','869a294401b6e578d5d2955db4834da59f908962ce1545c4722aeda77ea70e4f','fa25ad7230d2db552be005444e985abbc937d11bff910cd70efa31e12ff8afc6','24d0455e70edce7600ed578dbcb64979b5c43d23cc453517fd51b0b564bbed6d','c949c5c10a2bff32446bd71be8d318de2babf1de209c58e981c4b7de7cce3cfb','d44dd3ce735585f73f511b80b0d9385aa1639f70053b9fbc0724e659c43321d0','e6b92d0ad129b574ffe4984da271ae7871870b595b7d9bb127423a22ba246221','b5e681b9ac68b3cb5fa6c69299c05c26a4cb60c5f0c3457dca2fb7488ab0e2f1','78d75af0ee229bc3f335489d63476c6c90ae31de92ff12fbf8b556860c7191c9','4bcf2d1cd781a5930d0dd10848580ce26d8d63b28b07ad861bdefcea2c63f24e','75903cff841036a3faee6cbdcf5c00df51f62ee03119e1a52978603f21719dd6','cec25b13102e2c7ca948463b0646e5ecce6f687dcecc361fad5fbb73fa7a9aab','1409d06cb5454f045d6cabe31a664178beacc91d3fb2066ac176b8c25ad5aa91','e602ea4da9375284ec59faa76849b5ebb2e5f4021bd48c61389127c8511d79bb','0f60cd3289598d44df9d9391e584d619fd8432a346d4dcb55238686ad9e0b001','a4229e035993fead03d9f8d615a568a5c1ca5c3992bf2c8fc7628f5db35bfebc','e344ec0b746746dd3a28fc57ea746fd806542ec3392037ce1fdb44bd9f18d5bc','7d6217c763342c85b158af92108015a20449989fe464d344632cca92b5705861'];
const hashText = value => crypto.createHash('sha256').update(value).digest('hex');
const actualChunkSha=[];
const mismatches=[];
for(let i=0;i<24;i++){
  const value=rumiAnimationBase64.slice(i*18000,(i+1)*18000);
  const h=hashText(value); actualChunkSha.push(h);
  if(h!==EXPECTED_CHUNK_SHA[i]) mismatches.push({i,len:value.length,actual:h,expected:EXPECTED_CHUNK_SHA[i]});
}
const invalid=[];
for(let i=0;i<rumiAnimationBase64.length;i++) if(!/[A-Za-z0-9+/=]/.test(rumiAnimationBase64[i])) invalid.push(i);
const bytes=Buffer.from(rumiAnimationBase64,'base64');
const sha=crypto.createHash('sha256').update(bytes).digest('hex');
console.log('Rumi atlas diagnostics',JSON.stringify({base64Length:rumiAnimationBase64.length,byteLength:bytes.length,sha,mismatches,invalidCount:invalid.length}));
if(rumiAnimationBase64.length!==EXPECTED_BASE64_LENGTH) throw new Error(`Rumi atlas base64 length ${rumiAnimationBase64.length}, expected ${EXPECTED_BASE64_LENGTH}`);
if(invalid.length) throw new Error(`Rumi atlas contains ${invalid.length} invalid base64 characters`);
if(bytes.length!==EXPECTED_BYTE_LENGTH) throw new Error(`Rumi atlas byte length ${bytes.length}, expected ${EXPECTED_BYTE_LENGTH}`);
if(sha!==EXPECTED_SHA256) throw new Error(`Rumi atlas checksum ${sha} does not match approved art ${EXPECTED_SHA256}`);
console.log(`Rumi atlas verified: ${bytes.length} bytes, sha256 ${sha}`);
