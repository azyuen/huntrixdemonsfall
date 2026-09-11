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

    if(dodging){
      setRumiPose(scene,'dodge');
    }else if(scene.isAttacking||time<scene._rumiAttackLockUntil){
      // Preserve the selected attack pose through the active attack window.
    }else if(!grounded){
      setRumiPose(scene,Math.abs(body.velocity.x)>240?'aerial':'jump');
    }else if(Math.abs(body.velocity.x)>45){
      setRumiPose(scene,'run');
    }else{
      setRumiPose(scene,'idle');
    }

    // The physics body is the source of truth. Artwork is anchored to its feet.
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

  GameScene.prototype.create=function(...args){
    originalCreate.apply(this,args);

    // Remove all old procedural skyline pieces.
    this.children.list.slice().forEach(obj=>{if(obj!==this.player&&obj.depth<0)obj.destroy();});

    // Full dark base so there is never an unpainted/grey WebGL clear area.
    this.backdropBase=this.add.rectangle(this.scale.width/2,this.scale.height/2,this.scale.width,this.scale.height,0x09051a,1)
      .setScrollFactor(0).setDepth(-120);

    if(this.textures.exists('seoulSky')){
      // The source image has a large flat grey lower section baked into it.
      // Crop to the illustrated top 36% only, then scale that crop behind the level.
      this.backdrop=this.add.image(this.scale.width/2,275,'seoulSky').setScrollFactor(0).setDepth(-110);
      const sourceW=this.backdrop.width;
      const sourceH=this.backdrop.height;
      const cropH=Math.max(1,Math.floor(sourceH*.36));
      this.backdrop.setCrop(0,0,sourceW,cropH);
      this.backdrop.setDisplaySize(this.scale.width,550);
      this.backdrop.setTint(0xe7e8ff);

      // Subtle atmospheric fade into the dark rooftop foreground.
      this.add.rectangle(this.scale.width/2,450,this.scale.width,220,0x100b26,.18).setScrollFactor(0).setDepth(-106);
      this.add.rectangle(this.scale.width/2,540,this.scale.width,150,0x09051a,.34).setScrollFactor(0).setDepth(-105);
    }

    this.platforms?.getChildren().forEach((p,i)=>{
      p.setFillStyle?.(i%3===0?0x111426:0x17172b,1);
      p.setStrokeStyle?.(2,0x66577b,.82);
      this.add.rectangle(p.x,p.y-p.height/2+3,Math.max(12,p.width-8),6,0x866c8e,.82).setDepth(3);
    });

    this._nextPetal=0;
    this._lastRumiGhost=0;
    this._rumiAttackLockUntil=0;

    if(this.characterId==='rumi'&&this.textures.exists('rumi_idle')){
      // Invisible controller + separate visible art keeps physics and pose swaps independent.
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
