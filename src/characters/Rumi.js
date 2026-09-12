import Phaser from 'phaser';
import { rumiIdleRunSheetDataUrl } from '../assets/rumiIdleRunSheet.js';

const GAME_HEIGHT = 720;
const FRAME_WIDTH = 240;
const FRAME_HEIGHT = 320;
const VISIBLE_BODY_HEIGHT = 293;

const IDLE_FRAMES = [5, 6, 7, 8, 7, 6];
const RUN_FRAMES = [0, 1, 2, 3, 4];

export const RUMI_SPEC = Object.freeze({
  visibleBodyRatio: 0.33,
  futureBossScreenRatio: 0.27,
  sourceCanvas: [FRAME_WIDTH, FRAME_HEIGHT],
  sourceBodyHeight: VISIBLE_BODY_HEIGHT,
  normalScale: (GAME_HEIGHT * 0.33) / VISIBLE_BODY_HEIGHT,
  originX: 0.5,
  originY: 0.985,
  idleFrameMs: 850,
  runFrameMs: 100,
  moveSpeed: 300
});

export default class Rumi extends Phaser.GameObjects.Image {
  static preload(scene) {
    // Load the approved 1200x640 sheet as ONE image. Phaser's spritesheet
    // parser was producing bad frame data for the AVIF data URL on iOS.
    scene.load.image('rumi-idle-run-sheet', rumiIdleRunSheetDataUrl);
  }

  static ensureFrames(scene) {
    const texture = scene.textures.get('rumi-idle-run-sheet');
    if (!texture || texture.has('0')) return;

    // Sheet layout: run 01-05 on row 1, idle 01-04 on row 2.
    for (let frame = 0; frame < 9; frame += 1) {
      const column = frame % 5;
      const row = Math.floor(frame / 5);
      texture.add(String(frame), 0, column * FRAME_WIDTH, row * FRAME_HEIGHT, FRAME_WIDTH, FRAME_HEIGHT);
    }
  }

  constructor(scene, x, groundY) {
    Rumi.ensureFrames(scene);
    super(scene, x, groundY, 'rumi-idle-run-sheet', String(IDLE_FRAMES[0]));
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
      this.lastFrame = -1;
    }

    const frames = this.motionState === 'run' ? RUN_FRAMES : IDLE_FRAMES;
    const frameMs = this.motionState === 'run' ? RUMI_SPEC.runFrameMs : RUMI_SPEC.idleFrameMs;
    const elapsed = Math.max(0, time - this.motionStartedAt);
    const frame = frames[Math.floor(elapsed / frameMs) % frames.length];

    if (frame !== this.lastFrame) {
      this.setFrame(String(frame));
      this.lastFrame = frame;
    }
  }
}
