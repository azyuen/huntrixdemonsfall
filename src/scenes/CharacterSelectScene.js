import Phaser from 'phaser';

export default class CharacterSelectScene extends Phaser.Scene {
  constructor(){ super('CharacterSelect'); }
  create(){
    const {width,height}=this.scale;
    this.add.text(width/2,110,'HUNTR/X: DEMONS FALL',{fontFamily:'system-ui',fontSize:'48px',fontStyle:'bold',color:'#ffffff'}).setOrigin(.5);
    this.add.text(width/2,175,'Choose your hunter',{fontFamily:'system-ui',fontSize:'24px',color:'#cbbcff'}).setOrigin(.5);
    const card=this.add.rectangle(width/2,height/2+30,300,330,0x24144d).setStrokeStyle(4,0x9b72ff).setInteractive({useHandCursor:true});
    this.add.image(width/2,height/2-30,'rumi').setScale(2);
    this.add.text(width/2,height/2+100,'RUMI',{fontFamily:'system-ui',fontSize:'38px',fontStyle:'bold',color:'#ffffff'}).setOrigin(.5);
    this.add.text(width/2,height/2+145,'Balanced',{fontFamily:'system-ui',fontSize:'20px',color:'#e6dcff'}).setOrigin(.5);
    const start=()=>this.scene.start('Game',{character:'rumi'}); card.on('pointerdown',start); this.input.keyboard.on('keydown-ENTER',start);
    this.add.text(width/2,height-55,'Tap Rumi or press Enter',{fontFamily:'system-ui',fontSize:'18px',color:'#aaa1c9'}).setOrigin(.5);
  }
}
