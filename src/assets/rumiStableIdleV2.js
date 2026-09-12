import c00 from './rumiStableIdleChunks/c00.js';
import c01 from './rumiStableIdleChunks/c01.js';
import c02 from './rumiStableIdleChunks/c02.js';
import c03 from './rumiStableIdleChunks/c03.js';
import c04 from './rumiStableIdleChunks/c04.js';
import c05 from './rumiStableIdleChunks/c05.js';
import c06 from './rumiStableIdleChunks/c06.js';

export const rumiStableIdleBase64 = [c00, c01, c02, c03, c04, c05, c06].join('');

if (rumiStableIdleBase64.length !== 44392 || !rumiStableIdleBase64.startsWith('UklGR')) {
  throw new Error(`Rumi WebP asset integrity error (${rumiStableIdleBase64.length} chars)`);
}

export const rumiStableIdleDataUrl = `data:image/webp;base64,${rumiStableIdleBase64}`;
