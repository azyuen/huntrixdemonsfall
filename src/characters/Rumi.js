import Phaser from 'phaser';

const GAME_HEIGHT = 720;
const SOURCE_BODY_HEIGHT = 390;

export const RUMI_SPEC = Object.freeze({
  normalScreenRatio: 0.33,
  bossScreenRatio: 0.27,
  sourceCanvas: [216, 399],
  sourceBodyHeight: SOURCE_BODY_HEIGHT,
  normalScale: (GAME_HEIGHT * 0.33) / SOURCE_BODY_HEIGHT,
  bossZoomFromNormal: 0.27 / 0.33,
  originX: 0.5,
  originY: 0.985,
  idleFps: 6,
  idleSequence: [0, 1, 2, 3, 2, 1]
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
}
