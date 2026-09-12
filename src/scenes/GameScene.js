import Phaser from 'phaser';
import Rumi, { RUMI_SPEC } from '../characters/Rumi.js';

const WIDTH = 1560;
const HEIGHT = 720;
const GROUND_Y = 600;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  preload() {
    this.load.image(
      'seoul-sky',
      `${import.meta.env.BASE_URL}assets/seoul_skyline_strip.jpg?v=2`
    );
    Rumi.preload(this);
  }

  create() {
    this.cameras.main.setBackgroundColor('#09051a');

    const sky = this.add.image(WIDTH / 2, HEIGHT / 2, 'seoul-sky');
    sky.setDisplaySize(WIDTH, HEIGHT).setAlpha(0.72).setDepth(-20);

    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x120a2d, 0.35).setDepth(-19);
    this.add.rectangle(WIDTH / 2, GROUND_Y + 60, WIDTH, 120, 0x171427).setDepth(0);
    this.add.rectangle(WIDTH / 2, GROUND_Y, WIDTH, 8, 0x65557d).setDepth(1);

    this.rumi = new Rumi(this, WIDTH / 2, GROUND_Y);

    this.add.text(28, 26, 'HUNTR/X — V2 IDLE TEST', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      fontStyle: '700',
      color: '#ffffff'
    }).setDepth(20);

    this.add.text(28, 58, `NORMAL VIEW • ${Math.round(RUMI_SPEC.normalScreenRatio * 100)}% SCREEN HEIGHT • 4 APPROVED FRAMES`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#c8bde4'
    }).setDepth(20);

    const status = document.getElementById('status');
    if (status) status.remove();
  }
}
