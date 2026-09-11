import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor(){ super('Boot'); }

  preload(){
    this.load.image('seoulSky', `${import.meta.env.BASE_URL}assets/seoul_skyline_strip.jpg`);
  }

  create(){
    const status=document.getElementById('status');
    if(status) status.remove();

    const makeHunter=(id,pose='idle')=>{
      const specs={
        rumi:{hair:0x6d36a8,jacket:0xe4a63b,accent:0xb68cff,skin:0xf2c8c2,pants:0x141522,weapon:0xd9d6ff,h:104},
        mira:{hair:0xb93d72,jacket:0x3b213b,accent:0xff7db4,skin:0xf0c6bd,pants:0x17141d,weapon:0xf2b9ff,h:112},
        zoey:{hair:0x17131f,jacket:0x1c668b,accent:0x70ddff,skin:0xefc1b8,pants:0x151923,weapon:0x9deaff,h:94}
      };
      const s=specs[id],W=96,H=124,g=this.add.graphics();
      const crouch=pose.startsWith('attack')||pose==='dodge';
      const bodyY=crouch?43:37,headY=crouch?26:20;
      // hair / head
      g.fillStyle(s.hair).fillCircle(44,headY,15);
      if(id==='rumi'){
        g.lineStyle(7,s.hair,1).beginPath().moveTo(32,headY+7).lineTo(17,35).lineTo(7,44).strokePath();
        g.lineStyle(4,0x8b50c8,1).beginPath().moveTo(25,32).lineTo(12,38).lineTo(3,44).strokePath();
      }else if(id==='mira'){
        g.lineStyle(8,s.hair,1).beginPath().moveTo(52,headY+6).lineTo(63,50).lineTo(67,78).strokePath();
      }else{
        g.fillCircle(30,13,8).fillCircle(57,13,8);
      }
      g.fillStyle(s.skin).fillEllipse(44,headY+1,22,27);
      g.fillStyle(0x25172f).fillEllipse(39,headY,3,2).fillEllipse(49,headY,3,2);
      // torso / jacket
      g.fillStyle(s.jacket).fillRoundedRect(27,bodyY,34,id==='mira'?43:39,8);
      g.fillStyle(0xf5e6e0).fillRect(40,bodyY+4,8,29);
      g.fillStyle(s.accent).fillRect(29,bodyY+28,30,5);
      // legs by pose
      g.lineStyle(10,s.pants,1);
      if(pose==='run1'||pose==='attack1'){g.beginPath().moveTo(38,bodyY+39).lineTo(27,93).strokePath();g.beginPath().moveTo(50,bodyY+39).lineTo(64,86).strokePath();}
      else if(pose==='run2'||pose==='attack2'){g.beginPath().moveTo(38,bodyY+39).lineTo(25,84).strokePath();g.beginPath().moveTo(50,bodyY+39).lineTo(61,96).strokePath();}
      else if(pose==='jump'||pose==='dodge'){g.beginPath().moveTo(38,bodyY+39).lineTo(28,82).strokePath();g.beginPath().moveTo(50,bodyY+39).lineTo(67,78).strokePath();}
      else{g.beginPath().moveTo(38,bodyY+39).lineTo(34,98).strokePath();g.beginPath().moveTo(50,bodyY+39).lineTo(55,98).strokePath();}
      // boots
      g.lineStyle(5,0x08090f,1).beginPath().moveTo(30,98).lineTo(22,99).strokePath();g.beginPath().moveTo(55,98).lineTo(64,99).strokePath();
      // arms and weapons
      g.lineStyle(7,s.skin,1);
      const swing=pose==='attack1'?0:pose==='attack2'?1:pose==='finisher'?2:-1;
      if(swing>=0){
        g.beginPath().moveTo(31,bodyY+12).lineTo(18,bodyY+22).strokePath();
        g.beginPath().moveTo(58,bodyY+12).lineTo(70,bodyY+16).strokePath();
      }else{
        g.beginPath().moveTo(31,bodyY+12).lineTo(20,bodyY+28).strokePath();g.beginPath().moveTo(58,bodyY+12).lineTo(67,bodyY+30).strokePath();
      }
      if(id==='rumi'){
        g.lineStyle(5,0x88622d,1).beginPath().moveTo(swing>=0?68:62,bodyY+18).lineTo(swing>=0?83:80,bodyY+(swing===2?0:9)).strokePath();
        g.lineStyle(swing===2?9:7,s.weapon,.98).beginPath().moveTo(swing>=0?80:77,bodyY+(swing===2?0:8)).lineTo(swing===2?95:91,bodyY-(swing===2?15:2)).strokePath();
      }else if(id==='mira'){
        g.lineStyle(4,0xc59c55,1).beginPath().moveTo(9,bodyY+34).lineTo(89,bodyY-5).strokePath();
        g.fillStyle(s.weapon,.95).fillTriangle(80,bodyY-10,95,bodyY-13,87,bodyY+1);
      }else{
        g.lineStyle(5,s.weapon,.95).beginPath().moveTo(18,bodyY+28).lineTo(6,bodyY+15).strokePath();g.beginPath().moveTo(68,bodyY+28).lineTo(82,bodyY+14).strokePath();
      }
      // glow accent
      g.lineStyle(2,s.accent,.65).strokeRoundedRect(25,bodyY-2,38,45,9);
      const key=pose==='idle'?id:`${id}_${pose}`;g.generateTexture(key,W,H);g.destroy();
    };

    ['rumi','mira','zoey'].forEach(id=>['idle','run1','run2','jump','attack1','attack2','finisher','dodge'].forEach(p=>makeHunter(id,p)));

    const makeEnemy=(key,{w=72,h=92,body=0x15131c,crack=0xe943c0,hat=true,bulk=0})=>{
      const g=this.add.graphics(),cx=w/2;
      if(bulk){g.fillStyle(body).fillEllipse(cx,h*.58,w*.78,h*.62);g.fillCircle(cx,h*.25,w*.23);}
      else{g.fillStyle(body).fillRoundedRect(cx-w*.22,h*.28,w*.44,h*.57,12);g.fillCircle(cx,h*.23,w*.17);}
      if(hat){g.fillStyle(0x09090e).fillRect(cx-w*.29,h*.13,w*.58,7).fillRect(cx-w*.16,h*.02,w*.32,h*.16);}
      g.lineStyle(Math.max(3,w*.045),crack,.9).beginPath().moveTo(cx-6,h*.36).lineTo(cx+8,h*.49).lineTo(cx-2,h*.62).lineTo(cx+10,h*.73).strokePath();
      g.fillStyle(crack,.9).fillCircle(cx-7,h*.23,3).fillCircle(cx+7,h*.23,3);
      g.lineStyle(Math.max(7,w*.11),body,1).beginPath().moveTo(cx-w*.13,h*.8).lineTo(cx-w*.18,h*.98).strokePath();g.beginPath().moveTo(cx+w*.13,h*.8).lineTo(cx+w*.18,h*.98).strokePath();
      g.generateTexture(key,w,h);g.destroy();
    };
    makeEnemy('enemy_grunt',{w:58,h:86});
    makeEnemy('enemy_ranged',{w:56,h:84,body:0x17182a,crack:0x718cff});
    makeEnemy('enemy_brute',{w:86,h:104,body:0x18151d,crack:0xd54aab,hat:true,bulk:1});
    makeEnemy('enemy_boss',{w:112,h:132,body:0x17131a,crack:0xff4db8,hat:true,bulk:1});

    const g=this.add.graphics();g.fillStyle(0x6b55ff,0.9).fillCircle(48,48,44);g.lineStyle(4,0xffffff,0.6).strokeCircle(48,48,44);g.generateTexture('button',96,96);g.destroy();
    this.scene.start('CharacterSelect');
  }
}
