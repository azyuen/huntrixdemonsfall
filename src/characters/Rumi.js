import Phaser from 'phaser';
import { rumiStableIdleDataUrl } from '../assets/rumiStableIdle.js';

const GAME_HEIGHT = 720;
const SOURCE_HEIGHT = 384;

export const RUMI_SPEC = Object.freeze({
  visibleBodyRatio: 0.33,
  futureBossScreenRatio: 0.27,
  sourceCanvasHeight: SOURCE_HEIGHT,
  normalScale: (GAME_HEIGHT * 0.33) / SOURCE_HEIGHT,
  originX: 0.5,
  originY: 0.985,
  moveSpeed: 300
});

export default class Rumi extends Phaser.GameObjects.Image {
  static preload(scene) {
    // Stability pass: use one real WebP frame directly from the project-source
    // artwork. No AVIF, no sprite-sheet parser and no custom frame slicing.
    scene.load.image('rumi-stable-idle', rumiStableIdleDataUrl);
  }

  constructor(scene, x, groundY) {
    super(scene, x, groundY, 'rumi-stable-idle');
    scene.add.existing(this);

    this
      .setOrigin(RUMI_SPEC.originX, RUMI_SPEC.originY)
      .setScale(RUMI_SPEC.normalScale)
      .setDepth(10);
  }

  setFacing(direction) {
    if (direction !== 0) this.setFlipX(direction < 0);
  }

  // Animation is intentionally disabled for this verification build. Once this
  // canonical WebP renders reliably, idle/run will use separate WebP textures.
  updateMotion() {}
}
