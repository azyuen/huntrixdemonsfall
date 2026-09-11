import Phaser from 'phaser';

export function installVisualArt(GameScene){
  const originalCreate=GameScene.prototype.create;
  const originalUpdate=GameScene.prototype.update;
  const originalSpawnEnemy=GameScene.prototype.spawnEnemy;
  const originalHitEnemy=GameScene.prototype.hitEnemy;
  const originalKillEnemy=GameScene.prototype.killEnemy;
  const originalPerformAttack=GameScene.prototype.performAttack;

  const rumiKey=name=>`rumi_${name}`;
  const setRumiPose=(scene,name)=>{
    const key=rumiKey(name);
    if(scene.characterId!=='rumi'||!scene.textures.exists(key))return false;
    if(scene.player.texture.key!==key)scene.player.setTexture(key);
    scene.rumiPose=name;
    return true;
  };
  const makeAfterImage=(scene,alpha=.28)=>{
    if(scene.characterId!=='rumi'||!scene.player?.active)return;
    const key=scene.player.texture.key;
    if(!key?.startsWith('rumi_'))return;
    const ghost=scene.add.image(scene.player.x,scene.player.y,key)
      .setDisplaySize(scene.player.displayWidth,scene.player.displayHeight)
      .setFlipX(scene.player.flipX).setAngle(scene.player.angle)
      .setAlpha(alpha).setTint(0xb8a7ff).setDepth(17);
    scene.tweens.add({targets:ghost,alpha:0,scaleX:ghost.scaleX*1.06,scaleY:ghost.scaleY*.96,duration:180,onComplete:()=>ghost.destroy()});
  };
  const attackSpark=(scene,finisher=false)=>{
    const dir=scene.lastFacing||1,x=scene.player.x+dir*(finisher?125:95),y=scene.player.y-8;
    const ring=scene.add.circle(x,y,finisher?25:16,0xffffff,.08).setDepth(32).setStrokeStyle(finisher?7:4,finisher?0xffd968:0xd8c8ff,.95);
    scene.tweens.add({targets:ring,scale:finisher?3.4:2.3,alpha:0,duration:finisher?310:190,onComplete:()=>ring.destroy()});
    if(finisher)scene.cameras.main.shake(120,.004);
  };

  GameScene.prototype.create=function(...args){
    originalCreate.apply(this,args);
    this.children.list.slice().forEach(obj=>{if(obj!==this.player&&obj.depth<0)obj.destroy();});

    this.backdropBase=this.add.rectangle(this.scale.width/2,this.scale.height/2,this.scale.width,this.scale.height,0x09051a,1).setScrollFactor(0).setDepth(-120);
    if(this.textures.exists('seoulSky')){
      this.backdrop=this.add.image(this.scale.width/2,this.scale.height/2,'seoulSky').setDisplaySize(this.scale.width,this.scale.height).setScrollFactor(0).setDepth(-110);
      this.backdrop.setTint(0xe5e4ff);
      this.backdropWash=this.add.rectangle(this.scale.width/2,this.scale.height/2,this.scale.width,this.scale.height,0x100b26,.10).setScrollFactor(0).setDepth(-105);
    }

    this.platforms?.getChildren().forEach((p,i)=>{
      p.setFillStyle?.(i%3===0?0x111426:0x17172b,1);p.setStrokeStyle?.(2,0x66577b,.82);
      this.add.rectangle(p.x,p.y-p.height/2+3,Math.max(12,p.width-8),6,0x866c8e,.82).setDepth(3);
    });

    this._nextPetal=0;this._wasGrounded=false;this._lastRumiGhost=0;this._rumiAttackLockUntil=0;
    this.player.setDepth(20).setVisible(true).setAlpha(1).clearTint();

    if(this.characterId==='rumi'&&this.textures.exists('rumi_idle')){
      this.player.setTexture('rumi_idle').setDisplaySize(78,60).setOrigin(.5,.82).setBlendMode(Phaser.BlendModes.NORMAL).setVisible(true).setAlpha(1);
      this.player.body.setSize(30,50,true);
      this.player.body.setOffset(24,7);
      setRumiPose(this,'idle');
    }else{
      this.player.setTexture(this.characterId);
      this.player.setDisplaySize(this.characterId==='mira'?86:74,this.characterId==='mira'?112:94);
      this.player.body.setSize(this.characterId==='mira'?36:34,this.characterId==='zoey'?72:82,true);
    }
  };

  GameScene.prototype.spawnEnemy=function(type,x,y){
    const e=originalSpawnEnemy.call(this,type,x,y),key=type==='boss'?'enemy_boss':type==='brute'?'enemy_brute':type==='ranged'?'enemy_ranged':'enemy_grunt';
    if(this.textures.exists(key)){e.setAlpha(.001);e.visual=this.add.image(e.x,e.y,key).setDepth(18);const scale=type==='boss'?1:type==='brute'?.92:.9;e.visual.setScale(scale);e.visual.baseScale=scale;}return e;
  };

  GameScene.prototype.performAttack=function(time){
    originalPerformAttack.call(this,time);
    const pose=this.comboStep===0?'attack1':this.comboStep===1?'attack2':'finisher';
    if(setRumiPose(this,pose)){
      const dims=pose==='finisher'?[172,61]:pose==='attack2'?[105,56]:[102,56];
      this.player.setDisplaySize(...dims).setOrigin(.5,.82).setVisible(true).setAlpha(1);
      this._rumiAttackLockUntil=time+(this.hunter.attackDuration[this.comboStep]||260);
      this.player.setAngle(this.comboStep===2?0:this.lastFacing*-.8);
      attackSpark(this,this.comboStep===2);makeAfterImage(this,this.comboStep===2?.34:.2);
    }
  };

  GameScene.prototype.hitEnemy=function(e,damage,step,buildSync=false){
    if(e.visual){e.visual.setTint(0xff82d4);e.visual.setScale((e.visual.baseScale||1)*1.07,(e.visual.baseScale||1)*.94);this.time.delayedCall(105,()=>{if(e.visual?.active){e.visual.clearTint();e.visual.setScale(e.visual.baseScale||1);}});}
    return originalHitEnemy.call(this,e,damage,step,buildSync);
  };
  GameScene.prototype.killEnemy=function(e){
    if(e.visual?.active){const v=e.visual;e.visual=null;this.tweens.add({targets:v,alpha:0,scaleX:v.scaleX*1.3,scaleY:v.scaleY*.65,y:v.y-14,duration:e.type==='boss'?460:280,onComplete:()=>v.destroy()});}
    return originalKillEnemy.call(this,e);
  };

  GameScene.prototype.update=function(time,delta){
    originalUpdate.call(this,time,delta);
    if(time>this._nextPetal){this._nextPetal=time+Phaser.Math.Between(650,1100);const cam=this.cameras.main,px=cam.scrollX+cam.width+30,py=Phaser.Math.Between(120,500);const petal=this.add.ellipse(px,py,9,4,0xffa7cf,.5).setDepth(10);this.tweens.add({targets:petal,x:px-Phaser.Math.Between(240,390),y:py+Phaser.Math.Between(30,90),angle:180,alpha:0,duration:Phaser.Math.Between(1800,2500),onComplete:()=>petal.destroy()});}
    if(this.player?.active){
      this.player.setFlipX(this.lastFacing<0);const grounded=this.player.body.blocked.down||this.player.body.touching.down;
      if(this.characterId==='rumi')this.player.setBlendMode(Phaser.BlendModes.NORMAL).setVisible(true);
      if(grounded&&!this._wasGrounded&&this.characterId==='rumi'){const dust=this.add.ellipse(this.player.x,this.player.y+31,58,12,0xc7b5d9,.18).setDepth(15);this.tweens.add({targets:dust,scaleX:1.45,alpha:0,duration:200,onComplete:()=>dust.destroy()});}
      this._wasGrounded=grounded;
      if(this.characterId==='rumi'&&this.textures.exists('rumi_idle')){
        const dodging=this.player.alpha<.8;
        if(dodging){if(setRumiPose(this,'dodge'))this.player.setDisplaySize(117,53).setOrigin(.5,.82);this.player.setAngle(this.lastFacing*3);if(time-this._lastRumiGhost>55){makeAfterImage(this,.22);this._lastRumiGhost=time;}}
        else if(this.isAttacking||time<this._rumiAttackLockUntil){}
        else if(!grounded){const pose=Math.abs(this.player.body.velocity.x)>240?'aerial':'jump';if(setRumiPose(this,pose))this.player.setDisplaySize(pose==='aerial'?157:102,pose==='aerial'?55:59).setOrigin(.5,.82);this.player.setAngle(Phaser.Math.Clamp(this.player.body.velocityY/220,-4,5));}
        else if(Math.abs(this.player.body.velocity.x)>45){if(setRumiPose(this,'run'))this.player.setDisplaySize(97,55).setOrigin(.5,.82);this.player.setAngle(Math.sin(time/105)*1.1);}
        else{if(setRumiPose(this,'idle'))this.player.setDisplaySize(77,59).setOrigin(.5,.82);this.player.setAngle(Math.sin(time/500)*.35);}
      }
    }
    if(this.enemies)this.enemies.getChildren().forEach(e=>{if(!e.visual?.active)return;e.visual.setPosition(e.x,e.y).setFlipX(this.player.x<e.x);const base=e.visual.baseScale||1,motion=Math.abs(e.body?.velocity?.x||0)>5?Math.sin(time/120+e.x*.01)*.025:0;e.visual.setScale(base*(1+motion),base*(1-motion*.5));e.visual.setAlpha(e.type==='boss'&&!this.bossActive&&!this.bossDefeated?.72:1);});
  };
}
