import Phaser from 'phaser';
import run00 from '../assets/rumiRunData/run00.js';
import run01 from '../assets/rumiRunData/run01.js';
import run02 from '../assets/rumiRunData/run02.js';
import run03 from '../assets/rumiRunData/run03.js';
import run04 from '../assets/rumiRunData/run04.js';

const GAME_HEIGHT = 720;
const TARGET_BODY_HEIGHT = GAME_HEIGHT * 0.33;
const IDLE_SOURCE_BODY_HEIGHT = 373;
const RUN_SOURCE_BODY_HEIGHT = (373 / 384) * 240;

const IDLE_FRAMES = [
  'rumi-idle-0',
  'rumi-idle-1',
  'rumi-idle-2',
  'rumi-idle-3'
];
const IDLE_SEQUENCE = [0, 1, 2, 3, 2, 1];
const RUN_FRAMES = [
  'rumi-run-0',
  'rumi-run-1',
  'rumi-run-2',
  'rumi-run-3',
  'rumi-run-4'
];
const RUN_DATA = [run00, run01, run02, run03, run04];

export const RUMI_SPEC = Object.freeze({
  visibleBodyRatio: 0.33,
  futureBossScreenRatio: 0.27,
  idleScale: TARGET_BODY_HEIGHT / IDLE_SOURCE_BODY_HEIGHT,
  runScale: TARGET_BODY_HEIGHT / RUN_SOURCE_BODY_HEIGHT,
  originX: 0.5,
  originY: 1,
  moveSpeed: 300,
  idleFrameMs: 450,
  runFrameMs: 100
});

export default class Rumi extends Phaser.GameObjects.Image {
  static preload(scene) {
    const base = import.meta.env.BASE_URL;

    IDLE_FRAMES.forEach((key, index) => {
      scene.load.image(
        key,
        `${base}assets/rumi_idle_${String(index).padStart(2, '0')}.webp?v=5`
      );
    });

    RUN_FRAMES.forEach((key, index) => {
      scene.load.image(key, RUN_DATA[index]);
    });
  }

  constructor(scene, x, groundY) {
    super(scene, x, groundY, IDLE_FRAMES[0]);
    scene.add.existing(this);

    this
      .setOrigin(RUMI_SPEC.originX, RUMI_SPEC.originY)
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
    this.setScale(mode === 'run' ? RUMI_SPEC.runScale : RUMI_SPEC.idleScale);
  }

  updateMotion(time, isMoving) {
    const mode = isMoving ? 'run' : 'idle';
    this.setMode(mode, time);

    if (time < this.nextFrameAt) return;

    if (mode === 'run') {
      this.frameIndex = (this.frameIndex + 1) % RUN_FRAMES.length;
      this.setTexture(RUN_FRAMES[this.frameIndex]);
      this.nextFrameAt = time + RUMI_SPEC.runFrameMs;
      return;
    }

    this.frameIndex = (this.frameIndex + 1) % IDLE_SEQUENCE.length;
    this.setTexture(IDLE_FRAMES[IDLE_SEQUENCE[this.frameIndex]]);
    this.nextFrameAt = time + RUMI_SPEC.idleFrameMs;
  }
}
