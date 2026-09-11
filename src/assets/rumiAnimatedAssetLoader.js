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
import c10 from './rumiAnimChunks/c10.js';
import c11a from './rumiAnimChunks/c11a.js';
import c11b from './rumiAnimChunks/c11b.js';
import c12 from './rumiAnimChunks/c12.js';
import c13 from './rumiAnimChunks/c13.js';
import tail0 from './rumiAnimChunks/tail0.js';
import tail1 from './rumiAnimChunks/tail1.js';
import tail2 from './rumiAnimChunks/tail2.js';
import tail3 from './rumiAnimChunks/tail3.js';

export const rumiAnimationBase64 = [
  c00,c01,c02,c03,c04,c05,c06,c07,c08,c09,c10,
  c11a,c11b,c12,c13,tail0,tail1,tail2,tail3
].join('');

export const rumiAnimationDataUrl = `data:image/webp;base64,${rumiAnimationBase64}`;
