import c00 from './rumiAnimChunks/c00.js';
import c01 from './rumiAnimChunks/c01.js';
import c02 from './rumiAnimChunks/c02.js';
import c03 from './rumiAnimChunks/c03.js';

// Temporary compatibility loader while the remaining animation asset chunks are staged.
// The full loader is completed once all chunk modules are present.
export const stagedRumiAnimationData = [c00, c01, c02, c03].join('');
