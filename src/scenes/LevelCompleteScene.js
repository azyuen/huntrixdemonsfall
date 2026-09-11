import Phaser from 'phaser';
import { GAMEPLAY } from '../config/gameplay.js';

export default class LevelCompleteScene extends Phaser.Scene {
  constructor(){super('LevelComplete');}

  init(data){
    this.characterId=data?.character||'rumi';
    this.stats=data?.stats||{kills:0,falls:0,syncUses:0,timeMs:0};
  }

  create(){
    const {width,height}=this.scale;
    const hunter=GAMEPLAY.hunters[this.characterId]||GAMEPLAY.hunters.rumi;
    const seconds=Math.max(1,Math.round((this.stats.timeMs||0)/1000));
    const mins=Math.floor(seconds/60);
    const secs=String(seconds%60).padStart(2,'0');

    this.cameras.main.setBackgroundColor('#0d0922');
    this.add.rectangle(width/2,height/2,width,height,0x130d2c,1);
    this.add.circle(width/2,225,145,hunter.accent,.08).setStrokeStyle(5,hunter.accent,.25);
    this.add.image(width/2,225,hunter.texture).setScale(2.7);

    this.add.text(width/2,62,'AREA CLEAR',{fontFamily:'system-ui',fontSize:'48px',fontStyle:'bold',color:'#ffffff'}).setOrigin(.5);
    this.add.text(width/2,112,'DREAD CAPTAIN DEFEATED',{fontFamily:'system-ui',fontSize:'21px',fontStyle:'bold',color:'#e6b8dd'}).setOrigin(.5);
    this.add.text(width/2,375,`${hunter.name} // RUN SUMMARY`,{fontFamily:'system-ui',fontSize:'24px',fontStyle:'bold',color:'#ffffff'}).setOrigin(.5);

    const stats=[
      ['DEMONS DEFEATED',this.stats.kills||0],
      ['SYNC ATTACKS',this.stats.syncUses||0],
      ['FALLS',this.stats.falls||0],
      ['TIME',`${mins}:${secs}`]
    ];
    const startX=width/2-360;
    stats.forEach(([label,value],i)=>{
      const x=startX+i*240;
      this.add.rectangle(x,465,205,100,0x211746,.9).setStrokeStyle(2,hunter.accent,.45);
      this.add.text(x,444,label,{fontFamily:'system-ui',fontSize:'13px',fontStyle:'bold',color:'#bfb5da'}).setOrigin(.5);
      this.add.text(x,482,String(value),{fontFamily:'system-ui',fontSize:'28px',fontStyle:'bold',color:'#ffffff'}).setOrigin(.5);
    });

    const makeButton=(x,label,cb)=>{
      const b=this.add.rectangle(x,615,310,72,0x2a1b57).setStrokeStyle(3,hunter.accent,.8).setInteractive({useHandCursor:true});
      this.add.text(x,615,label,{fontFamily:'system-ui',fontSize:'19px',fontStyle:'bold',color:'#ffffff'}).setOrigin(.5);
      b.on('pointerdown',cb);
      return b;
    };

    makeButton(width/2-190,'PLAY AGAIN',()=>this.scene.start('Game',{character:this.characterId}));
    makeButton(width/2+190,'CHANGE HUNTER',()=>this.scene.start('CharacterSelect'));
  }
}
