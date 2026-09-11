import Phaser from 'phaser';
import { GAMEPLAY } from '../config/gameplay.js';

export default class CharacterSelectScene extends Phaser.Scene {
  constructor(){ super('CharacterSelect'); }
  create(){
    const {width,height}=this.scale;
    this.add.text(width/2,82,'HUNTR/X: DEMONS FALL',{fontFamily:'system-ui',fontSize:'46px',fontStyle:'bold',color:'#ffffff'}).setOrigin(.5);
    this.add.text(width/2,137,'Choose your hunter',{fontFamily:'system-ui',fontSize:'23px',color:'#cbbcff'}).setOrigin(.5);

    const ids=['rumi','mira','zoey'];
    const xs=[width/2-360,width/2,width/2+360];
    ids.forEach((id,i)=>{
      const h=GAMEPLAY.hunters[id];
      const card=this.add.rectangle(xs[i],390,285,390,0x24144d).setStrokeStyle(4,h.accent).setInteractive({useHandCursor:true});
      this.add.image(xs[i],300,h.texture).setScale(2.15);
      this.add.text(xs[i],426,h.name,{fontFamily:'system-ui',fontSize:'34px',fontStyle:'bold',color:'#ffffff'}).setOrigin(.5);
      this.add.text(xs[i],468,h.role,{fontFamily:'system-ui',fontSize:'19px',color:'#e6dcff'}).setOrigin(.5);
      const stats=id==='rumi'?'MED SPEED • MED REACH • MED POWER':id==='mira'?'MED-SLOW • LONG REACH • HIGH POWER':'FAST • SHORT REACH • RAPID + RANGED';
      this.add.text(xs[i],515,stats,{fontFamily:'system-ui',fontSize:'13px',color:'#bfb4d9',align:'center',wordWrap:{width:240}}).setOrigin(.5);
      card.on('pointerdown',()=>this.scene.start('Game',{character:id}));
    });

    this.add.text(width/2,height-42,'Tap a hunter to start',{fontFamily:'system-ui',fontSize:'18px',color:'#aaa1c9'}).setOrigin(.5);
    this.input.keyboard.on('keydown-ONE',()=>this.scene.start('Game',{character:'rumi'}));
    this.input.keyboard.on('keydown-TWO',()=>this.scene.start('Game',{character:'mira'}));
    this.input.keyboard.on('keydown-THREE',()=>this.scene.start('Game',{character:'zoey'}));
  }
}
