import Phaser from 'phaser';
import { rumiStableIdleDataUrl } from '../assets/rumiStableIdleV2.js';

const GAME_HEIGHT = 720;
const TARGET_BODY_HEIGHT = GAME_HEIGHT * 0.33;
const IDLE_SOURCE_BODY_HEIGHT = 373;
const RUN_SOURCE_BODY_HEIGHT = 292;
const IDLE_ORIGIN_Y = 1;
const RUN_ORIGIN_Y = 0.97;

const RUN_FRAMES = [
  'rumi-run-0',
  'rumi-run-1',
  'rumi-run-2',
  'rumi-run-3',
  'rumi-run-4'
];

export const RUMI_SPEC = Object.freeze({
  visibleBodyRatio: 0.33,
  futureBossScreenRatio: 0.27,
  idleScale: TARGET_BODY_HEIGHT / IDLE_SOURCE_BODY_HEIGHT,
  runScale: TARGET_BODY_HEIGHT / RUN_SOURCE_BODY_HEIGHT,
  originX: 0.5,
  idleOriginY: IDLE_ORIGIN_Y,
  runOriginY: RUN_ORIGIN_Y,
  moveSpeed: 300,
  runFrameMs: 100
});

export default class Rumi extends Phaser.GameObjects.Image {
  static preload(scene) {
    // Keep the already-proven canonical idle frame while the new run cycle uses
    // five independently materialized and SHA-verified transparent WebPs.
    scene.load.image('rumi-stable-idle', rumiStableIdleDataUrl);

    const base = import.meta.env.BASE_URL;
    RUN_FRAMES.forEach((key, index) => {
      scene.load.image(
        key,
        `${base}assets/rumi_run_${String(index + 1).padStart(2, '0')}.webp?v=1`
      );
    });
  }

  constructor(scene, x, groundY) {
    super(scene, x, groundY, 'rumi-stable-idle');
    scene.add.existing(this);

    this
      .setOrigin(RUMI_SPEC.originX, RUMI_SPEC.idleOriginY)
      .setScale(RUMI_SPEC.idleScale)
      .setDepth(10);

    this.motionMode = 'idle';
    this.frameIndex = -1;
    this.nextFrameAt = 0;
  }

  setFacing(direction) {
    if (direction !== 0) this.setFlipX(direction < 0);
  }

  setMode(mode, time) {
    if (this.motionMode === mode) return;

    this.motionMode = mode;
    this.frameIndex = -1;
    this.nextFrameAt = time;

    if (mode === 'run') {
      this
        .setOrigin(RUMI_SPEC.originX, RUMI_SPEC.runOriginY)
        .setScale(RUMI_SPEC.runScale);
      return;
    }

    this
      .setTexture('rumi-stable-idle')
      .setOrigin(RUMI_SPEC.originX, RUMI_SPEC.idleOriginY)
      .setScale(RUMI_SPEC.idleScale);
  }

  updateMotion(time, isMoving) {
    const mode = isMoving ? 'run' : 'idle';
    this.setMode(mode, time);

    if (mode !== 'run' || time < this.nextFrameAt) return;

    this.frameIndex = (this.frameIndex + 1) % RUN_FRAMES.length;
    this.setTexture(RUN_FRAMES[this.frameIndex]);
    this.nextFrameAt = time + RUMI_SPEC.runFrameMs;
  }
}
