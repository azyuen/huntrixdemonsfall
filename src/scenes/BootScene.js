import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor(){ super('Boot'); }
  create(){
    const status=document.getElementById('status');
    if(status) status.remove();

    const g=this.add.graphics();
    g.fillStyle(0xf2c4d7).fillRoundedRect(0,0,42,88,12);
    g.fillStyle(0x7a3cff).fillRect(6,42,30,40);
    g.generateTexture('rumi',42,88);
    g.clear();
    g.fillStyle(0x6b55ff,0.9).fillCircle(48,48,44);
    g.lineStyle(4,0xffffff,0.6).strokeCircle(48,48,44);
    g.generateTexture('button',96,96);
    g.destroy();

    this.scene.start('CharacterSelect');
  }
}
