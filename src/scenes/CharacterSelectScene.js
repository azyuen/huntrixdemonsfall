import Phaser from 'phaser';
import { GAMEPLAY } from '../config/gameplay.js';

export default class CharacterSelectScene extends Phaser.Scene {
  constructor(){ super('CharacterSelect'); }
  create(){
    const {width,height}=this.scale;

    this.add.rectangle(width/2,height/2,width,height,0x09051a,.32).setDepth(-2);
    this.add.rectangle(width/2,96,width,192,0x0d0920,.76).setDepth(-1);
    this.add.text(width/2,66,'HUNTR/X',{fontFamily:'system-ui',fontSize:'48px',fontStyle:'bold',color:'#ffffff',stroke:'#7f57c7',strokeThickness:2}).setOrigin(.5);
    this.add.text(width/2,119,'DEMONS FALL',{fontFamily:'system-ui',fontSize:'23px',fontStyle:'bold',letterSpacing:6,color:'#d8c8ff'}).setOrigin(.5);
    this.add.text(width/2,157,'CHOOSE YOUR HUNTER',{fontFamily:'system-ui',fontSize:'15px',fontStyle:'bold',letterSpacing:3,color:'#9f91bd'}).setOrigin(.5);

    const ids=['rumi','mira','zoey'];
    const xs=[width/2-360,width/2,width/2+360];
    ids.forEach((id,i)=>{
      const h=GAMEPLAY.hunters[id];
      const x=xs[i];
      const card=this.add.rectangle(x,405,290,400,0x171126,.94).setStrokeStyle(3,h.accent,.72).setInteractive({useHandCursor:true});
      const glow=this.add.rectangle(x,405,302,412,h.accent,.08).setDepth(-.5);
      let portrait;
      if(id==='rumi'&&this.textures.exists('rumi_sheet')){
        portrait=this.add.image(x,315,'rumi_sheet',0).setDisplaySize(255,121);
      }else{
        portrait=this.add.image(x,308,h.texture).setScale(2.15);
      }
      this.add.text(x,430,h.name,{fontFamily:'system-ui',fontSize:'34px',fontStyle:'bold',color:'#ffffff'}).setOrigin(.5);
      this.add.text(x,470,h.role.toUpperCase(),{fontFamily:'system-ui',fontSize:'15px',fontStyle:'bold',color:'#e6dcff',letterSpacing:1}).setOrigin(.5);
      const stats=id==='rumi'?'BALANCED • MEDIUM REACH • BROADSWORD':id==='mira'?'POWER • LONG REACH • GOK-DO':'SPEED • SHORT RANGE • SHIN-KALA';
      this.add.text(x,516,stats,{fontFamily:'system-ui',fontSize:'12px',color:'#bfb4d9',align:'center',wordWrap:{width:242}}).setOrigin(.5);
      this.add.text(x,555,id==='rumi'?'●●●':id==='mira'?'●●○':'●●●',{fontFamily:'system-ui',fontSize:'16px',color:h.accent}).setOrigin(.5);
      card.on('pointerover',()=>{card.setFillStyle(0x241a3b,.98);glow.setAlpha(.18);portrait.setScale(portrait.scaleX*1.025,portrait.scaleY*1.025);});
      card.on('pointerout',()=>{card.setFillStyle(0x171126,.94);glow.setAlpha(.08);if(id==='rumi')portrait.setDisplaySize(255,121);else portrait.setScale(2.15);});
      card.on('pointerdown',()=>this.scene.start('Game',{character:id}));
    });

    this.add.text(width/2,height-38,'Tap a hunter to begin',{fontFamily:'system-ui',fontSize:'17px',color:'#aaa1c9'}).setOrigin(.5);
    this.input.keyboard.on('keydown-ONE',()=>this.scene.start('Game',{character:'rumi'}));
    this.input.keyboard.on('keydown-TWO',()=>this.scene.start('Game',{character:'mira'}));
    this.input.keyboard.on('keydown-THREE',()=>this.scene.start('Game',{character:'zoey'}));
  }
}
