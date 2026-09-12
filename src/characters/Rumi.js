import Phaser from 'phaser';
import { rumiIdleRunSheetDataUrl } from '../assets/rumiIdleRunSheet.js';

const GAME_HEIGHT = 720;
const FRAME_WIDTH = 240;
const FRAME_HEIGHT = 320;

export const RUMI_SPEC = Object.freeze({
  normalScreenRatio: 0.60,
  futureBossScreenRatio: 0.27,
  sourceCanvas: [FRAME_WIDTH, FRAME_HEIGHT],
  normalScale: (GAME_HEIGHT * 0.60) / FRAME_HEIGHT,
  originX: 0.5,
  originY: 0.985,
  idleFps: 1.5,
  runFps: 9,
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

  static ensureAnimations(scene) {
    if (!scene.anims.exists('rumi-idle')) {
      scene.anims.create({
        key: 'rumi-idle',
        frames: [5, 6, 7, 8, 7, 6].map(frame => ({ key: 'rumi-idle-run-sheet', frame })),
        frameRate: RUMI_SPEC.idleFps,
        repeat: -1
      });
    }

    if (!scene.anims.exists('rumi-run')) {
      scene.anims.create({
        key: 'rumi-run',
        frames: [0, 1, 2, 3, 4].map(frame => ({ key: 'rumi-idle-run-sheet', frame })),
        frameRate: RUMI_SPEC.runFps,
        repeat: -1
      });
    }
  }

  constructor(scene, x, groundY) {
    super(scene, x, groundY, 'rumi-idle-run-sheet', 5);
    scene.add.existing(this);
    Rumi.ensureAnimations(scene);

    this.motionState = 'idle';
    this
      .setOrigin(RUMI_SPEC.originX, RUMI_SPEC.originY)
      .setScale(RUMI_SPEC.normalScale)
      .setDepth(10)
      .play('rumi-idle');
  }

  setFacing(direction) {
    if (direction !== 0) this.setFlipX(direction < 0);
  }

  setMoving(moving) {
    const nextState = moving ? 'run' : 'idle';
    if (this.motionState === nextState) return;
    this.motionState = nextState;
    this.play(nextState === 'run' ? 'rumi-run' : 'rumi-idle', true);
  }
}
