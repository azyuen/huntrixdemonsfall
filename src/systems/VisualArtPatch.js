import Phaser from 'phaser';

export function installVisualArt(GameScene){
  const originalCreate=GameScene.prototype.create;
  const originalUpdate=GameScene.prototype.update;
  const originalSpawnEnemy=GameScene.prototype.spawnEnemy;
  const originalHitEnemy=GameScene.prototype.hitEnemy;
  const originalKillEnemy=GameScene.prototype.killEnemy;
  const originalPerformAttack=GameScene.prototype.performAttack;

  const rumiKey=name=>`rumi_${name}`;
  const sourceSizes={idle:[77,59],run:[97,55],jump:[102,59],attack1:[102,56],attack2:[105,56],finisher:[172,61],aerial:[157,55],dodge:[117,53]};
  const scale=1.82;

  const setRumiPose=(scene,name)=>{
    if(scene.characterId!=='rumi'||!scene.rumiVisual)return false;
    const key=rumiKey(name);
    if(!scene.textures.exists(key))return false;
    if(scene.rumiVisual.texture.key!==key)scene.rumiVisual.setTexture(key);
    const [sw,sh]=sourceSizes[name]||sourceSizes.idle;
    scene.rumiVisual.setDisplaySize(sw*scale,sh*scale).setOrigin(.5,1).setVisible(true);
    scene.rumiPose=name;
    return true;
  };

  const syncRumiVisual=(scene,time)=>{
    if(!scene.rumiVisual||!scene.player?.body)return;
    const body=scene.player.body;
    const grounded=body.blocked.down||body.touching.down;
    const dodging=time<=scene.dodgeInvulnerableUntil;
    if(dodging)setRumiPose(scene,'dodge');
    else if(scene.isAttacking||time<scene._rumiAttackLockUntil){}
    else if(!grounded)setRumiPose(scene,Math.abs(body.velocity.x)>240?'aerial':'jump');
    else if(Math.abs(body.velocity.x)>45)setRumiPose(scene,'run');
    else setRumiPose(scene,'idle');
    scene.rumiVisual.setPosition(body.center.x,body.bottom+5).setFlipX(scene.lastFacing<0);
    if(dodging){
      scene.rumiVisual.setAlpha(.76).setAngle((scene.lastFacing||1)*2.5);
      if(time-scene._lastRumiGhost>70){
        const ghost=scene.add.image(scene.rumiVisual.x,scene.rumiVisual.y,scene.rumiVisual.texture.key)
          .setDisplaySize(scene.rumiVisual.displayWidth,scene.rumiVisual.displayHeight).setOrigin(.5,1)
          .setFlipX(scene.rumiVisual.flipX).setAlpha(.20).setTint(0xc5b5ff).setDepth(17);
        scene.tweens.add({targets:ghost,alpha:0,x:ghost.x-(scene.lastFacing||1)*24,duration:180,onComplete:()=>ghost.destroy()});
        scene._lastRumiGhost=time;
      }
    }else{
      scene.rumiVisual.setAlpha(1);
      if(scene.rumiPose==='run')scene.rumiVisual.setAngle(Math.sin(time/125)*.55);
      else if(scene.rumiPose==='jump'||scene.rumiPose==='aerial')scene.rumiVisual.setAngle(Phaser.Math.Clamp(body.velocity.y/320,-2,2.5));
      else scene.rumiVisual.setAngle(0);
    }
    if(scene.rumiAura){scene.rumiAura.setPosition(body.center.x,body.bottom-44);scene.rumiAura.setAlpha(scene.isAttacking?.09:.028);}
  };

  const attackSpark=(scene,finisher=false)=>{
    const dir=scene.lastFacing||1,x=scene.player.x+dir*(finisher?150:112),y=scene.player.y-10;
    const ring=scene.add.circle(x,y,finisher?30:18,0xffffff,.08).setDepth(32).setStrokeStyle(finisher?7:4,finisher?0xffd968:0xc9b8ff,.95);
    scene.tweens.add({targets:ring,scale:finisher?3.5:2.4,alpha:0,duration:finisher?320:190,onComplete:()=>ring.destroy()});
    if(finisher)scene.cameras.main.shake(120,.004);
  };

  const buildSkyline=scene=>{
    const W=scene.scale.width,H=scene.scale.height;
    scene.add.rectangle(W/2,H/2,W,H,0x080b1d,1).setScrollFactor(0).setDepth(-130);
    scene.add.rectangle(W/2,200,W,400,0x17275c,1).setScrollFactor(0).setDepth(-129);
    scene.add.rectangle(W/2,300,W,230,0x37205d,.50).setScrollFactor(0).setDepth(-128);
    for(let i=0;i<4;i++)scene.add.ellipse(W*.58+i*120,245+i*18,560,150,0x7b4fa0,.035).setScrollFactor(0).setDepth(-127);
    scene.add.circle(W*.75,108,118,0x8390ff,.11).setScrollFactor(0).setDepth(-126);
    scene.add.circle(W*.75,108,76,0xf2f3ff,.96).setScrollFactor(0).setDepth(-125);
    scene.add.circle(W*.728,92,17,0xbec5e5,.15).setScrollFactor(0).setDepth(-124);
    scene.add.circle(W*.775,130,21,0xbec5e5,.13).setScrollFactor(0).setDepth(-124);
    const makeBuilding=(x,base,w,h,color,depth,windowColor=0xff8ad9)=>{
      scene.add.rectangle(x+w/2,base-h/2,w,h,color,1).setScrollFactor(0).setDepth(depth);
      scene.add.rectangle(x+w*.16,base-h-6,w*.68,7,0x222750,.8).setScrollFactor(0).setDepth(depth+1);
      for(let wx=x+18;wx<x+w-10;wx+=24)for(let wy=base-h+24;wy<base-14;wy+=28){const seed=(wx*3+wy*7)%11;if(seed<5)scene.add.rectangle(wx,wy,5,8,seed%2?windowColor:0x84c6ff,.44).setScrollFactor(0).setDepth(depth+1);}
    };
    const far=[[-20,410,145,245],[105,420,100,205],[190,390,135,280],[315,430,100,175],[405,365,145,300],[545,420,110,205],[650,385,130,260],[785,425,95,170],[870,390,150,250],[1020,425,110,185],[1130,365,145,300],[1270,415,110,215],[1380,380,150,270],[1525,425,95,170]];
    far.forEach(([x,b,w,h],i)=>makeBuilding(x,b,w,h,i%2?0x25264f:0x1f2148,-123,i%3===0?0xff9acb:0xffc97a));
    const near=[[-60,505,250,150],[150,515,190,125],[325,475,250,180],[560,520,170,115],[720,470,235,185],[940,510,180,140],[1110,460,245,195],[1345,510,220,135]];
    near.forEach(([x,b,w,h],i)=>{scene.add.rectangle(x+w/2,b-h/2,w,h,i%2?0x11162f:0x0e1429,1).setScrollFactor(0).setDepth(-121);if(i===1||i===4||i===6){scene.add.rectangle(x+w*.35,b-h-18,42,28,0x1e2440,1).setScrollFactor(0).setDepth(-120);scene.add.circle(x+w*.35,b-h-18,8,0xff4fd8,.18).setScrollFactor(0).setDepth(-119);}});
    scene.add.rectangle(95,330,104,260,0x1a1530,.88).setScrollFactor(0).setDepth(-118).setStrokeStyle(2,0xff4bc5,.24);
    scene.add.text(95,328,'또\n다시\n빛날\n우리\n♡',{fontFamily:'system-ui',fontSize:'24px',fontStyle:'bold',color:'#ff75d0',align:'center',lineSpacing:7}).setOrigin(.5).setScrollFactor(0).setDepth(-117).setShadow(0,0,'#ff2db7',12,true,true);
    scene.add.rectangle(W*.86,252,9,170,0x24284f,.98).setScrollFactor(0).setDepth(-120);
    scene.add.triangle(W*.86,154,W*.835,222,W*.885,222,W*.86,140,0x303764,.98).setScrollFactor(0).setDepth(-120);
    scene.add.rectangle(W*.86,187,40,5,0x58e8ff,.95).setScrollFactor(0).setDepth(-119);
    scene.add.rectangle(W*.86,194,32,4,0xff55d8,.95).setScrollFactor(0).setDepth(-119);
    scene.add.rectangle(12,300,18,310,0x211426,.88).setScrollFactor(0).setDepth(-116).setAngle(-8);
    for(let i=0;i<20;i++)scene.add.circle(20+Phaser.Math.Between(0,120),170+Phaser.Math.Between(0,250),Phaser.Math.Between(3,7),0xff83bf,.48).setScrollFactor(0).setDepth(-115);
    scene.add.rectangle(W/2,575,W,290,0x080b18,.92).setScrollFactor(0).setDepth(-114);
    scene.add.rectangle(W/2,548,W,6,0x6f4f85,.40).setScrollFactor(0).setDepth(-113);
  };

  GameScene.prototype.create=function(...args){
    originalCreate.apply(this,args);
    this.children.list.slice().forEach(obj=>{if(obj!==this.player&&obj.depth<0)obj.destroy();});
    buildSkyline(this);

    // Tighter mobile framing: close enough to read Rumi and enemy tells without losing platform context.
    this.cameras.main.setZoom(1.28);
    this.cameras.main.startFollow(this.player,true,.11,.10,150,4);

    this.platforms?.getChildren().forEach((p,i)=>{
      p.setFillStyle?.(i%3===0?0x111326:0x15152a,1);p.setStrokeStyle?.(2,0x8c719b,.82);
      this.add.rectangle(p.x,p.y-p.height/2+3,Math.max(12,p.width-8),7,0xa383ad,.76).setDepth(3);
      if(i%2===0){const unit=this.add.rectangle(p.x-p.width*.28,p.y-p.height/2-22,54,34,0x191c30,.96).setDepth(4).setStrokeStyle(2,0x5f6077,.5);this.add.circle(unit.x-12,unit.y,8,0x090b13,.9).setDepth(5).setStrokeStyle(2,0x6d6f88,.5);this.add.circle(unit.x+12,unit.y,8,0x090b13,.9).setDepth(5).setStrokeStyle(2,0x6d6f88,.5);}
    });
    this._nextPetal=0;this._lastRumiGhost=0;this._rumiAttackLockUntil=0;
    if(this.characterId==='rumi'&&this.textures.exists('rumi_idle')){
      this.player.setTexture('rumi').setVisible(false).setAlpha(1);this.player.body.setSize(34,72,true);
      this.rumiVisual=this.add.image(this.player.x,this.player.y,'rumi_idle').setDepth(20).setOrigin(.5,1);setRumiPose(this,'idle');
      this.rumiAura=this.add.ellipse(this.player.x,this.player.y,86,102,0x9e78ff,.025).setDepth(16).setStrokeStyle(2,0xe8dcff,.07);syncRumiVisual(this,this.time.now);
    }
    if(this.healthText)this.healthText.setFontSize(15).setPosition(178,42);
    if(this.healthBar){this.healthBar.setPosition(62,42);this.healthBar.height=18;}
    if(this.syncText)this.syncText.setFontSize(13).setPosition(410,74);
    if(this.syncBar){this.syncBar.setPosition(248,74);this.syncBar.height=14;}
    if(this.styleText)this.styleText.setPosition(1170,40).setFontSize(14);
    if(this.upgradeText)this.upgradeText.setPosition(1170,68).setFontSize(11);
  };

  GameScene.prototype.spawnEnemy=function(type,x,y){const e=originalSpawnEnemy.call(this,type,x,y),key=type==='boss'?'enemy_boss':type==='brute'?'enemy_brute':type==='ranged'?'enemy_ranged':'enemy_grunt';if(this.textures.exists(key)){e.setAlpha(.001);e.visual=this.add.image(e.x,e.y,key).setDepth(18);const s=type==='boss'?1.22:type==='brute'?1.12:1.06;e.visual.setScale(s);e.visual.baseScale=s;}return e;};
  GameScene.prototype.performAttack=function(time){originalPerformAttack.call(this,time);if(this.characterId==='rumi'&&this.rumiVisual){const pose=this.comboStep===0?'attack1':this.comboStep===1?'attack2':'finisher';setRumiPose(this,pose);this._rumiAttackLockUntil=time+(this.hunter.attackDuration[this.comboStep]||260);attackSpark(this,this.comboStep===2);}};
  GameScene.prototype.hitEnemy=function(e,damage,step,buildSync=false){if(e.visual){e.visual.setTint(0xff76dc);e.visual.setScale((e.visual.baseScale||1)*1.08,(e.visual.baseScale||1)*.94);this.time.delayedCall(105,()=>{if(e.visual?.active){e.visual.clearTint();e.visual.setScale(e.visual.baseScale||1);}});}return originalHitEnemy.call(this,e,damage,step,buildSync);};
  GameScene.prototype.killEnemy=function(e){if(e.visual?.active){const v=e.visual;e.visual=null;this.tweens.add({targets:v,alpha:0,scaleX:v.scaleX*1.32,scaleY:v.scaleY*.62,y:v.y-16,duration:e.type==='boss'?480:300,onComplete:()=>v.destroy()});}return originalKillEnemy.call(this,e);};
  GameScene.prototype.update=function(time,delta){
    originalUpdate.call(this,time,delta);
    if(time>this._nextPetal){this._nextPetal=time+Phaser.Math.Between(650,1100);const cam=this.cameras.main,px=cam.scrollX+cam.width+30,py=Phaser.Math.Between(110,500);const petal=this.add.ellipse(px,py,11,5,0xff8dc8,.52).setDepth(10).setAngle(Phaser.Math.Between(-25,25));this.tweens.add({targets:petal,x:px-Phaser.Math.Between(260,430),y:py+Phaser.Math.Between(40,110),angle:petal.angle+180,alpha:0,duration:Phaser.Math.Between(1800,2600),onComplete:()=>petal.destroy()});}
    if(this.characterId==='rumi'&&this.rumiVisual)syncRumiVisual(this,time);
    if(this.enemies)this.enemies.getChildren().forEach(e=>{if(!e.visual?.active)return;e.visual.setPosition(e.x,e.y).setFlipX(this.player.x<e.x);const base=e.visual.baseScale||1,motion=Math.abs(e.body?.velocity?.x||0)>5?Math.sin(time/120+e.x*.01)*.025:0;e.visual.setScale(base*(1+motion),base*(1-motion*.5));e.visual.setAlpha(e.type==='boss'&&!this.bossActive&&!this.bossDefeated?.72:1);});
  };
}
