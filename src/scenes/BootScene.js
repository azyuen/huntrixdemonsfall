import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor(){ super('Boot'); }
  create(){
    const status=document.getElementById('status');
    if(status) status.remove();

    const makeHunter=(key,bodyColor,detailColor,height=88,width=42)=>{
      const g=this.add.graphics();
      g.fillStyle(0xf1c8d8).fillRoundedRect(width*.2,0,width*.6,height*.28,10);
      g.fillStyle(bodyColor).fillRoundedRect(0,height*.22,width,height*.63,10);
      g.fillStyle(detailColor).fillRect(width*.18,height*.46,width*.64,height*.12);
      g.generateTexture(key,width,height);
      g.destroy();
    };

    makeHunter('rumi',0x7a3cff,0xff75c8,88,42);
    makeHunter('mira',0x522f84,0xc68aff,94,40);
    makeHunter('zoey',0x155f82,0x6edcff,82,40);

    const g=this.add.graphics();
    g.fillStyle(0x6b55ff,0.9).fillCircle(48,48,44);
    g.lineStyle(4,0xffffff,0.6).strokeCircle(48,48,44);
    g.generateTexture('button',96,96);
    g.destroy();

    this.scene.start('CharacterSelect');
  }
}
