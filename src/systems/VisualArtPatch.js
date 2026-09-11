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
  const scale=1.62;

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

    scene.rumiVisual.setPosition(body.center.x,body.bottom+4).setFlipX(scene.lastFacing<0);

    if(dodging){
      scene.rumiVisual.setAlpha(.72).setAngle((scene.lastFacing||1)*2.5);
      if(time-scene._lastRumiGhost>65){
        const ghost=scene.add.image(scene.rumiVisual.x,scene.rumiVisual.y,scene.rumiVisual.texture.key)
          .setDisplaySize(scene.rumiVisual.displayWidth,scene.rumiVisual.displayHeight)
          .setOrigin(.5,1).setFlipX(scene.rumiVisual.flipX).setAlpha(.20).setTint(0xb8a7ff).setDepth(17);
        scene.tweens.add({targets:ghost,alpha:0,x:ghost.x-(scene.lastFacing||1)*22,duration:170,onComplete:()=>ghost.destroy()});
        scene._lastRumiGhost=time;
      }
    }else{
      scene.rumiVisual.setAlpha(1);
      if(scene.rumiPose==='run')scene.rumiVisual.setAngle(Math.sin(time/125)*.6);
      else if(scene.rumiPose==='jump'||scene.rumiPose==='aerial')scene.rumiVisual.setAngle(Phaser.Math.Clamp(body.velocity.y/300,-2.2,2.8));
      else scene.rumiVisual.setAngle(0);
    }

    if(scene.rumiAura){
      scene.rumiAura.setPosition(body.center.x,body.bottom-40);
      scene.rumiAura.setAlpha(scene.isAttacking?.10:.035);
    }
  };

  const attackSpark=(scene,finisher=false)=>{
    const dir=scene.lastFacing||1,x=scene.player.x+dir*(finisher?135:105),y=scene.player.y-10;
    const ring=scene.add.circle(x,y,finisher?28:18,0xffffff,.08).setDepth(32).setStrokeStyle(finisher?7:4,finisher?0xffd968:0xd8c8ff,.95);
    scene.tweens.add({targets:ring,scale:finisher?3.4:2.3,alpha:0,duration:finisher?310:190,onComplete:()=>ring.destroy()});
    if(finisher)scene.cameras.main.shake(120,.004);
  };

  const buildSkyline=scene=>{
    const W=scene.scale.width,H=scene.scale.height;
    scene.add.rectangle(W/2,H/2,W,H,0x09051a,1).setScrollFactor(0).setDepth(-120);
    scene.add.rectangle(W/2,170,W,340,0x151544,1).setScrollFactor(0).setDepth(-119);
    scene.add.rectangle(W/2,285,W,230,0x1d2452,.72).setScrollFactor(0).setDepth(-118);

    // moon + halo
    scene.add.circle(W*.82,128,104,0x6070ff,.12).setScrollFactor(0).setDepth(-117);
    scene.add.circle(W*.82,128,72,0xe9e9ff,.92).setScrollFactor(0).setDepth(-116);
    scene.add.circle(W*.80,108,13,0xc5c7e5,.18).setScrollFactor(0).setDepth(-115);
    scene.add.circle(W*.845,145,19,0xc5c7e5,.13).setScrollFactor(0).setDepth(-115);

    // distant city layer
    const far=[[-40,360,160,260],[105,370,110,220],[205,350,150,285],[345,382,105,205],[435,335,170,320],[590,375,125,230],[700,345,145,290],[835,390,110,190],[930,350,160,280],[1080,385,115,210],[1170,335,150,315],[1315,375,120,235],[1415,350,155,280],[1545,390,100,195]];
    far.forEach(([x,y,w,h],i)=>{
      const b=scene.add.rectangle(x+w/2,y-h/2,w,h,i%3===0?0x191a3c:0x20214a,.96).setScrollFactor(0).setDepth(-114);
      for(let wx=x+18;wx<x+w-10;wx+=28){
        for(let wy=y-h+28;wy<y-18;wy+=34){
          if(((wx+wy+i*17)%5)<1.8){
            scene.add.rectangle(wx,wy,5,8,((wx+wy)%3===0)?0xffca73:0x7fc9ff,.28).setScrollFactor(0).setDepth(-113);
          }
        }
      }
    });

    // nearer rooftop silhouettes
    const near=[[-50,440,260,150],[175,455,195,125],[345,425,260,180],[585,465,170,115],[730,420,240,185],[955,450,190,140],[1125,410,255,200],[1360,452,220,135]];
    near.forEach(([x,y,w,h],i)=>{
      scene.add.rectangle(x+w/2,y-h/2,w,h,i%2?0x11152d:0x101329,1).setScrollFactor(0).setDepth(-112);
      if(i===2||i===5)scene.add.rectangle(x+w*.68,y-h-18,8,36,0x8f61b7,.55).setScrollFactor(0).setDepth(-111);
    });

    // Namsan-style tower silhouette on right
    scene.add.rectangle(W*.91,250,8,150,0x202143,.95).setScrollFactor(0).setDepth(-111);
    scene.add.triangle(W*.91,160,W*.89,205,W*.93,205,W*.91,145,0x2e315d,.95).setScrollFactor(0).setDepth(-111);
    scene.add.rectangle(W*.91,188,34,4,0xc94cff,.7).setScrollFactor(0).setDepth(-110);

    scene.add.rectangle(W/2,485,W,150,0x09051a,.60).setScrollFactor(0).setDepth(-109);
  };

  GameScene.prototype.create=function(...args){
    originalCreate.apply(this,args);

    // Remove every legacy background layer, including the old skyline image.
    this.children.list.slice().forEach(obj=>{if(obj!==this.player&&obj.depth<0)obj.destroy();});
    buildSkyline(this);

    this.platforms?.getChildren().forEach((p,i)=>{
      p.setFillStyle?.(i%3===0?0x111426:0x17172b,1);
      p.setStrokeStyle?.(2,0x66577b,.82);
      this.add.rectangle(p.x,p.y-p.height/2+3,Math.max(12,p.width-8),6,0x866c8e,.82).setDepth(3);
    });

    this._nextPetal=0;
    this._lastRumiGhost=0;
    this._rumiAttackLockUntil=0;

    if(this.characterId==='rumi'&&this.textures.exists('rumi_idle')){
      this.player.setTexture('rumi').setVisible(false).setAlpha(1);
      this.player.body.setSize(34,72,true);
      this.rumiVisual=this.add.image(this.player.x,this.player.y,'rumi_idle').setDepth(20).setOrigin(.5,1);
      setRumiPose(this,'idle');
      this.rumiAura=this.add.ellipse(this.player.x,this.player.y,80,96,0x9e78ff,.035).setDepth(16).setStrokeStyle(2,0xe8dcff,.08);
      syncRumiVisual(this,this.time.now);
    }
  };

  GameScene.prototype.spawnEnemy=function(type,x,y){
    const e=originalSpawnEnemy.call(this,type,x,y),key=type==='boss'?'enemy_boss':type==='brute'?'enemy_brute':type==='ranged'?'enemy_ranged':'enemy_grunt';
    if(this.textures.exists(key)){
      e.setAlpha(.001);
      e.visual=this.add.image(e.x,e.y,key).setDepth(18);
      const s=type==='boss'?1:type==='brute'?.92:.9;
      e.visual.setScale(s);e.visual.baseScale=s;
    }
    return e;
  };

  GameScene.prototype.performAttack=function(time){
    originalPerformAttack.call(this,time);
    if(this.characterId==='rumi'&&this.rumiVisual){
      const pose=this.comboStep===0?'attack1':this.comboStep===1?'attack2':'finisher';
      setRumiPose(this,pose);
      this._rumiAttackLockUntil=time+(this.hunter.attackDuration[this.comboStep]||260);
      attackSpark(this,this.comboStep===2);
    }
  };

  GameScene.prototype.hitEnemy=function(e,damage,step,buildSync=false){
    if(e.visual){
      e.visual.setTint(0xff82d4);
      e.visual.setScale((e.visual.baseScale||1)*1.07,(e.visual.baseScale||1)*.94);
      this.time.delayedCall(105,()=>{if(e.visual?.active){e.visual.clearTint();e.visual.setScale(e.visual.baseScale||1);}});
    }
    return originalHitEnemy.call(this,e,damage,step,buildSync);
  };

  GameScene.prototype.killEnemy=function(e){
    if(e.visual?.active){
      const v=e.visual;e.visual=null;
      this.tweens.add({targets:v,alpha:0,scaleX:v.scaleX*1.3,scaleY:v.scaleY*.65,y:v.y-14,duration:e.type==='boss'?460:280,onComplete:()=>v.destroy()});
    }
    return originalKillEnemy.call(this,e);
  };

  GameScene.prototype.update=function(time,delta){
    originalUpdate.call(this,time,delta);

    if(time>this._nextPetal){
      this._nextPetal=time+Phaser.Math.Between(850,1450);
      const cam=this.cameras.main,px=cam.scrollX+cam.width+30,py=Phaser.Math.Between(120,430);
      const petal=this.add.ellipse(px,py,9,4,0xffa7cf,.40).setDepth(10);
      this.tweens.add({targets:petal,x:px-Phaser.Math.Between(240,390),y:py+Phaser.Math.Between(30,90),angle:180,alpha:0,duration:Phaser.Math.Between(1800,2500),onComplete:()=>petal.destroy()});
    }

    if(this.characterId==='rumi'&&this.rumiVisual)syncRumiVisual(this,time);

    if(this.enemies)this.enemies.getChildren().forEach(e=>{
      if(!e.visual?.active)return;
      e.visual.setPosition(e.x,e.y).setFlipX(this.player.x<e.x);
      const base=e.visual.baseScale||1,motion=Math.abs(e.body?.velocity?.x||0)>5?Math.sin(time/120+e.x*.01)*.025:0;
      e.visual.setScale(base*(1+motion),base*(1-motion*.5));
      e.visual.setAlpha(e.type==='boss'&&!this.bossActive&&!this.bossDefeated?.72:1);
    });
  };
}
