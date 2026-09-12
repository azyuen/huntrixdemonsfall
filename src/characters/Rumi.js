import Phaser from 'phaser';
import { rumiIdleRunSheetDataUrl } from '../assets/rumiIdleRunSheet.js';

const GAME_HEIGHT = 720;
const FRAME_WIDTH = 240;
const FRAME_HEIGHT = 320;
const APPROX_VISIBLE_IDLE_HEIGHT = 305;

const IDLE_FRAMES = [5, 6, 7, 8, 7, 6];
const RUN_FRAMES = [0, 1, 2, 3, 4];

export const RUMI_SPEC = Object.freeze({
  visibleBodyRatio: 0.33,
  futureBossScreenRatio: 0.27,
  sourceCanvas: [FRAME_WIDTH, FRAME_HEIGHT],
  normalScale: (GAME_HEIGHT * 0.33) / APPROX_VISIBLE_IDLE_HEIGHT,
  originX: 0.5,
  originY: 0.985,
  idleFrameMs: 500,
  runFrameMs: 110,
  moveSpeed: 300
});

export default class Rumi extends Phaser.GameObjects.Sprite {
  static preload(scene) {
    scene.load.spritesheet('rumi-idle-run-sheet', rumiIdleRunSheetDataUrl, {
      frameWidth: FRAME_WIDTH,
      frameHeight: FRAME_HEIGHT,
      endFrame: 9
    });
  }

  constructor(scene, x, groundY) {
    super(scene, x, groundY, 'rumi-idle-run-sheet', IDLE_FRAMES[0]);
    scene.add.existing(this);

    this.motionState = 'idle';
    this.motionStartedAt = scene.time.now;
    this.lastFrame = IDLE_FRAMES[0];

    this
      .setOrigin(RUMI_SPEC.originX, RUMI_SPEC.originY)
      .setScale(RUMI_SPEC.normalScale)
      .setDepth(10);
  }

  setFacing(direction) {
    if (direction !== 0) this.setFlipX(direction < 0);
  }

  updateMotion(time, moving) {
    const nextState = moving ? 'run' : 'idle';
    if (nextState !== this.motionState) {
      this.motionState = nextState;
      this.motionStartedAt = time;
    }

    const frames = this.motionState === 'run' ? RUN_FRAMES : IDLE_FRAMES;
    const frameMs = this.motionState === 'run' ? RUMI_SPEC.runFrameMs : RUMI_SPEC.idleFrameMs;
    const elapsed = Math.max(0, time - this.motionStartedAt);
    const frame = frames[Math.floor(elapsed / frameMs) % frames.length];

    if (frame !== this.lastFrame) {
      this.setFrame(frame);
      this.lastFrame = frame;
    }
  }
}
