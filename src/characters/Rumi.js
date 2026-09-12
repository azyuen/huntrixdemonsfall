import Phaser from 'phaser';

const GAME_HEIGHT = 720;
const SOURCE_FRAME_HEIGHT = 399;

export const RUMI_SPEC = Object.freeze({
  // Visual calibration pass: make Rumi substantially larger on mobile.
  normalScreenRatio: 0.52,
  futureBossScreenRatio: 0.27,
  sourceCanvas: [216, SOURCE_FRAME_HEIGHT],
  normalScale: (GAME_HEIGHT * 0.52) / SOURCE_FRAME_HEIGHT,
  originX: 0.5,
  originY: 0.985,
  idleFps: 2.2,
  idleSequence: [0, 1, 2, 3, 2, 1],
  moveSpeed: 300
});

const idleKey = index => `rumi-idle-${index}`;

export default class Rumi extends Phaser.GameObjects.Sprite {
  static preload(scene) {
    [0, 1, 2, 3].forEach(index => {
      scene.load.image(
        idleKey(index),
        `${import.meta.env.BASE_URL}assets/rumi_idle_0${index}.webp?v=2`
      );
    });
  }

  static ensureAnimations(scene) {
    if (scene.anims.exists('rumi-idle')) return;

    scene.anims.create({
      key: 'rumi-idle',
      frames: RUMI_SPEC.idleSequence.map(index => ({ key: idleKey(index) })),
      frameRate: RUMI_SPEC.idleFps,
      repeat: -1
    });
  }

  constructor(scene, x, groundY) {
    super(scene, x, groundY, idleKey(0));
    scene.add.existing(this);

    Rumi.ensureAnimations(scene);

    this
      .setOrigin(RUMI_SPEC.originX, RUMI_SPEC.originY)
      .setScale(RUMI_SPEC.normalScale)
      .setDepth(10)
      .play('rumi-idle');
  }

  setFacing(direction) {
    if (direction === 0) return;
    this.setFlipX(direction < 0);
  }
}
