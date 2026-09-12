import Phaser from 'phaser';
import Rumi, { RUMI_SPEC } from '../characters/Rumi.js';

const WIDTH = 1560;
const HEIGHT = 720;
const GROUND_Y = 600;
const MIN_X = 180;
const MAX_X = WIDTH - 180;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  preload() {
    this.load.image('seoul-sky', `${import.meta.env.BASE_URL}assets/seoul_skyline_strip.jpg?v=2`);
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

    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.leftHeld = false;
    this.rightHeld = false;
    this.createMoveButton(120, 625, '◀', () => { this.leftHeld = true; }, () => { this.leftHeld = false; });
    this.createMoveButton(260, 625, '▶', () => { this.rightHeld = true; }, () => { this.rightHeld = false; });

    this.add.text(28, 26, 'HUNTR/X — V2 RUMI TEST', {
      fontFamily: 'system-ui, sans-serif', fontSize: '22px', fontStyle: '700', color: '#ffffff'
    }).setDepth(20);
    this.add.text(28, 58, '33% VISIBLE HEIGHT • STABLE WEBP TEST • LEFT/RIGHT', {
      fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#c8bde4'
    }).setDepth(20);

    const status = document.getElementById('status');
    if (status) status.remove();
  }

  createMoveButton(x, y, label, onDown, onUp) {
    const circle = this.add.circle(x, y, 52, 0x241a46, 0.72)
      .setStrokeStyle(3, 0x9c7cff, 0.8)
      .setDepth(30)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y - 2, label, {
      fontFamily: 'system-ui, sans-serif', fontSize: '36px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(31);

    circle.on('pointerdown', onDown);
    circle.on('pointerup', onUp);
    circle.on('pointerout', onUp);
    circle.on('pointerupoutside', onUp);
  }

  update(time, delta) {
    const left = this.leftHeld || this.keys.left.isDown || this.keys.a.isDown;
    const right = this.rightHeld || this.keys.right.isDown || this.keys.d.isDown;
    const direction = left === right ? 0 : (left ? -1 : 1);

    this.rumi.updateMotion(time, direction !== 0);

    if (direction !== 0) {
      this.rumi.x = Phaser.Math.Clamp(
        this.rumi.x + direction * RUMI_SPEC.moveSpeed * (delta / 1000),
        MIN_X,
        MAX_X
      );
      this.rumi.setFacing(direction);
    }
  }
}
