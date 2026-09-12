import Phaser from 'phaser';
import { rumiAnimationDataUrl } from '../assets/rumiAnimatedAssetLoader.js';

export default class BootScene extends Phaser.Scene {
  constructor(){ super('Boot'); }

  preload(){
    this.load.image('seoulSky', `${import.meta.env.BASE_URL}assets/seoul_skyline_strip.jpg?v=64`);
    // Keep the old pose images as a fallback while the new atlas drives unfinished Rumi moves.
    ['idle','run','jump','attack1','attack2','finisher','aerial','dodge'].forEach(name=>{
      this.load.image(`rumi_${name}`, `${import.meta.env.BASE_URL}assets/rumi_${name}.png?v=64`);
    });
    // Production idle frames are compact validated WebP files served directly from public/assets.
    [0,1,2,3].forEach(i=>{
      this.load.image(`rumi_idle_final_${i}`, `${import.meta.env.BASE_URL}assets/rumi_idle_0${i}.webp?v=2`);
    });
    this.load.image('rumi_anim_atlas', rumiAnimationDataUrl);
  }

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

    const makeEnemy=(key,{w=72,h=92,body=0x15131c,crack=0xe943c0,hat=true,bulk=0})=>{
      const g=this.add.graphics(),cx=w/2;
      if(bulk){g.fillStyle(body).fillEllipse(cx,h*.58,w*.78,h*.62);g.fillCircle(cx,h*.25,w*.23);}
      else{g.fillStyle(body).fillRoundedRect(cx-w*.22,h*.28,w*.44,h*.57,12);g.fillCircle(cx,h*.23,w*.17);}
      if(hat){g.fillStyle(0x09090e).fillRect(cx-w*.29,h*.13,w*.58,7).fillRect(cx-w*.16,h*.02,w*.32,h*.16);}
      g.lineStyle(Math.max(3,w*.045),crack,.9).beginPath().moveTo(cx-6,h*.36).lineTo(cx+8,h*.49).lineTo(cx-2,h*.62).lineTo(cx+10,h*.73).strokePath();
      g.fillStyle(crack,.9).fillCircle(cx-7,h*.23,3).fillCircle(cx+7,h*.23,3);
      g.lineStyle(Math.max(7,w*.11),body,1).beginPath().moveTo(cx-w*.13,h*.8).lineTo(cx-w*.18,h*.98).strokePath();
      g.beginPath().moveTo(cx+w*.13,h*.8).lineTo(cx+w*.18,h*.98).strokePath();
      g.generateTexture(key,w,h);g.destroy();
    };
    makeEnemy('enemy_grunt',{w:58,h:86});
    makeEnemy('enemy_ranged',{w:56,h:84,body:0x17182a,crack:0x718cff});
    makeEnemy('enemy_brute',{w:86,h:104,body:0x18151d,crack:0xd54aab,hat:true,bulk:1});
    makeEnemy('enemy_boss',{w:112,h:132,body:0x17131a,crack:0xff4db8,hat:true,bulk:1});

    const g=this.add.graphics();
    g.fillStyle(0x6b55ff,0.9).fillCircle(48,48,44);
    g.lineStyle(4,0xffffff,0.6).strokeCircle(48,48,44);
    g.generateTexture('button',96,96);
    g.destroy();

    this.scene.start('CharacterSelect');
  }
}