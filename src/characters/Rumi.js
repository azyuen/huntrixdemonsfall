import Phaser from 'phaser';
import { rumiStableIdleDataUrl } from '../assets/rumiStableIdleV2.js';

const GAME_HEIGHT = 720;
const SOURCE_HEIGHT = 384;
const VISIBLE_BODY_HEIGHT = 373;

export const RUMI_SPEC = Object.freeze({
  visibleBodyRatio: 0.33,
  futureBossScreenRatio: 0.27,
  sourceCanvasHeight: SOURCE_HEIGHT,
  sourceBodyHeight: VISIBLE_BODY_HEIGHT,
  normalScale: (GAME_HEIGHT * 0.33) / VISIBLE_BODY_HEIGHT,
  originX: 0.5,
  originY: 1,
  moveSpeed: 300
});

export default class Rumi extends Phaser.GameObjects.Image {
  static preload(scene) {
    // Stability build: one canonical WebP frame reconstructed from verified
    // chunks. No AVIF, sprite-sheet parser, or manual frame slicing.
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
