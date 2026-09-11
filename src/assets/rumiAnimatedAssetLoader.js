import c00 from './rumiAnimChunks/c00.js';
import c01 from './rumiAnimChunks/c01.js';
import c02 from './rumiAnimChunks/c02.js';
import c03 from './rumiAnimChunks/c03.js';
import c04 from './rumiAnimChunks/c04.js';
import c05 from './rumiAnimChunks/c05.js';
import c06 from './rumiAnimChunks/c06.js';
import c07 from './rumiAnimChunks/c07.js';
import c08 from './rumiAnimChunks/c08.js';
import c09 from './rumiAnimChunks/c09.js';
import c10a from './rumiAnimChunks/c10a.js';
import c10b from './rumiAnimChunks/c10b.js';
import c11a from './rumiAnimChunks/c11a.js';
import c11b from './rumiAnimChunks/c11b.js';
import c12 from './rumiAnimChunks/c12.js';
import c13 from './rumiAnimChunks/c13.js';
import c15 from './rumiAnimChunks/c15.js';
import c16 from './rumiAnimChunks/c16.js';
import tail0 from './rumiAnimChunks/tail0.js';
import tail1 from './rumiAnimChunks/tail1.js';
import tail2 from './rumiAnimChunks/tail2.js';
import tail3 from './rumiAnimChunks/tail3.js';
import gap322a from './rumiAnimChunks/gap322a.js';
import gap322b from './rumiAnimChunks/gap322b.js';
import gap322c from './rumiAnimChunks/gap322c.js';
import gap372a from './rumiAnimChunks/gap372a.js';
import gap372b from './rumiAnimChunks/gap372b.js';

// Reconstruct the approved 313,480-byte WebP atlas. Three staged source ranges
// were damaged by transport truncation markers; replace those exact 23-character
// spans with the verified bytes from the approved atlas before decoding.
const stagedRumiAnimationBase64 = [
  c00,c01,c02,c03,c04,c05,c06,c07,c08,c09,
  c10a,c10b,c11a,c11b,c12,c13,
  tail0.slice(0,18000),
  c15,c16,
  tail1.slice(4000,20000),
  gap322a,gap322b,gap322c,
  tail2.slice(0,20000),
  gap372a,gap372b,
  tail3
].join('');

const atlasRepairs = [
  [262000, 'motgC2xiWJdOvmp9mZIAoP1'],
  [311984, 'azaRc8atiM/DJiG9OErpAGb'],
  [361984, '9wzdpTAfCTHsHjmoUeU959O']
];

export const rumiAnimationBase64 = atlasRepairs.reduce(
  (value, [offset, replacement]) =>
    value.slice(0, offset) + replacement + value.slice(offset + replacement.length),
  stagedRumiAnimationBase64
);

export const rumiAnimationDataUrl = `data:image/webp;base64,${rumiAnimationBase64}`;
