export function installVisualArt(GameScene){
  const originalCreate=GameScene.prototype.create;
  const originalUpdate=GameScene.prototype.update;
  const originalSpawnEnemy=GameScene.prototype.spawnEnemy;
  const originalHitEnemy=GameScene.prototype.hitEnemy;
  const originalKillEnemy=GameScene.prototype.killEnemy;
  const originalPerformAttack=GameScene.prototype.performAttack;

  const rumiFrames={idle:0,run:1,jump:2,attack1:3,attack2:4,finisher:5,aerial:6,dodge:7};

  const setRumiFrame=(scene,name)=>{
    if(scene.characterId!=='rumi'||!scene.textures.exists('rumi_sheet'))return false;
    const frame=rumiFrames[name]??0;
    if(scene.player.texture.key!=='rumi_sheet'||Number(scene.player.frame.name)!==frame){
      scene.player.setTexture('rumi_sheet',frame);
    }
    scene.rumiPose=name;
    return true;
  };

  const makeAfterImage=(scene,alpha=.28)=>{
    if(scene.characterId!=='rumi'||!scene.player?.active)return;
    const ghost=scene.add.image(scene.player.x,scene.player.y,'rumi_sheet',Number(scene.player.frame.name)||0)
      .setDisplaySize(scene.player.displayWidth,scene.player.displayHeight)
      .setFlipX(scene.player.flipX)
      .setAngle(scene.player.angle)
      .setAlpha(alpha)
      .setTint(0xb8a7ff)
      .setDepth(17);
    scene.tweens.add({targets:ghost,alpha:0,scaleX:ghost.scaleX*1.06,scaleY:ghost.scaleY*.96,duration:180,onComplete:()=>ghost.destroy()});
  };

  const attackSpark=(scene,finisher=false)=>{
    const dir=scene.lastFacing||1;
    const x=scene.player.x+dir*(finisher?125:95),y=scene.player.y-8;
    const ring=scene.add.circle(x,y,finisher?25:16,0xffffff,.08).setDepth(32)
      .setStrokeStyle(finisher?7:4,finisher?0xffd968:0xd8c8ff,.95);
    scene.tweens.add({targets:ring,scale:finisher?3.4:2.3,alpha:0,duration:finisher?310:190,onComplete:()=>ring.destroy()});
    if(finisher)scene.cameras.main.shake(120,.004);
  };

  GameScene.prototype.create=function(...args){
    originalCreate.apply(this,args);

    // Remove all legacy procedural skyline objects. The illustrated CSS background is now the sole skyline layer.
    this.children.list.slice().forEach(obj=>{
      if(obj===this.player)return;
      if(obj.depth<0)obj.destroy();
    });

    // Re-style the prototype collision platforms so they read as rooftops instead of grey test blocks.
    this.platforms?.getChildren().forEach((p,i)=>{
      p.setFillStyle?.(i%3===0?0x15162a:0x1a1830,1);
      p.setStrokeStyle?.(2,0x514768,.8);
      const lip=this.add.rectangle(p.x,p.y-p.height/2+3,Math.max(12,p.width-8),7,0x75627e,.82).setDepth(3);
      if(i%2===0){
        const vent=this.add.rectangle(p.x-p.width*.28,p.y-p.height/2-14,36,22,0x24263b,.9).setDepth(4).setStrokeStyle(2,0x5f6077,.55);
        this.add.rectangle(vent.x,vent.y-4,24,3,0x77798e,.65).setDepth(5);
      }
    });

    // Light atmospheric petals: deliberately sparse so they never obscure combat.
    this._nextPetal=0;
    this._wasGrounded=false;
    this._lastRumiGhost=0;
    this._rumiAttackLockUntil=0;

    this.player.setDepth(20);
    if(this.characterId==='rumi'&&this.textures.exists('rumi_sheet')){
      this.player.setTexture('rumi_sheet',rumiFrames.idle);
      this.player.setDisplaySize(260,123);
      this.player.body.setSize(31,66,true);
      this.player.body.setOffset(80,18);
      this.player.setOrigin(.5,.72);
      this.player.setPipeline?.('TextureTintPipeline');
      setRumiFrame(this,'idle');
    }else{
      this.player.setTexture(this.characterId);
      this.player.setDisplaySize(this.characterId==='mira'?86:74,this.characterId==='mira'?112:94);
      this.player.body.setSize(this.characterId==='mira'?36:34,this.characterId==='zoey'?72:82,true);
    }
  };

  GameScene.prototype.spawnEnemy=function(type,x,y){
    const e=originalSpawnEnemy.call(this,type,x,y);
    const key=type==='boss'?'enemy_boss':type==='brute'?'enemy_brute':type==='ranged'?'enemy_ranged':'enemy_grunt';
    if(this.textures.exists(key)){
      e.setAlpha(.001);
      e.visual=this.add.image(e.x,e.y,key).setDepth(18);
      const scale=type==='boss'?1:type==='brute'?.92:.9;
      e.visual.setScale(scale);
      e.visual.baseScale=scale;
    }
    return e;
  };

  GameScene.prototype.performAttack=function(time){
    originalPerformAttack.call(this,time);
    const pose=this.comboStep===0?'attack1':this.comboStep===1?'attack2':'finisher';
    if(setRumiFrame(this,pose)){
      this._rumiAttackLockUntil=time+(this.hunter.attackDuration[this.comboStep]||260);
      this.player.setAngle(this.comboStep===2?0:this.lastFacing*-.8);
      attackSpark(this,this.comboStep===2);
      makeAfterImage(this,this.comboStep===2?.34:.2);
    }else{
      const key=`${this.characterId}_${pose}`;
      if(this.textures.exists(key))this.player.setTexture(key);
    }
  };

  GameScene.prototype.hitEnemy=function(e,damage,step,buildSync=false){
    if(e.visual){
      e.visual.setTint(0xff82d4);
      e.visual.setScale((e.visual.baseScale||1)*1.07,(e.visual.baseScale||1)*.94);
      this.time.delayedCall(105,()=>{if(e.visual?.active){e.visual.clearTint();e.visual.setScale(e.visual.baseScale||1);}});
      const hit=this.add.circle(e.x,e.y-6,step===2?18:11,0xffd9f3,.75).setDepth(35);
      this.tweens.add({targets:hit,scale:2.2,alpha:0,duration:160,onComplete:()=>hit.destroy()});
    }
    return originalHitEnemy.call(this,e,damage,step,buildSync);
  };

  GameScene.prototype.killEnemy=function(e){
    if(e.visual?.active){
      const v=e.visual;e.visual=null;
      for(let i=0;i<(e.type==='boss'?12:6);i++){
        const mote=this.add.circle(v.x+Phaser.Math.Between(-18,18),v.y+Phaser.Math.Between(-25,25),Phaser.Math.Between(4,9),0xc94ab4,.45).setDepth(19);
        this.tweens.add({targets:mote,x:mote.x+Phaser.Math.Between(-30,30),y:mote.y-Phaser.Math.Between(30,80),alpha:0,duration:Phaser.Math.Between(280,520),onComplete:()=>mote.destroy()});
      }
      this.tweens.add({targets:v,alpha:0,scaleX:v.scaleX*1.3,scaleY:v.scaleY*.65,y:v.y-14,duration:e.type==='boss'?460:280,onComplete:()=>v.destroy()});
    }
    return originalKillEnemy.call(this,e);
  };

  GameScene.prototype.update=function(time,delta){
    originalUpdate.call(this,time,delta);

    // Atmospheric foreground movement.
    if(time>this._nextPetal){
      this._nextPetal=time+Phaser.Math.Between(520,900);
      const cam=this.cameras.main;
      const px=cam.scrollX+cam.width+30,py=Phaser.Math.Between(110,520);
      const petal=this.add.ellipse(px,py,10,5,0xffa7cf,.55).setDepth(10).setAngle(Phaser.Math.Between(-30,30));
      this.tweens.add({targets:petal,x:px-Phaser.Math.Between(260,430),y:py+Phaser.Math.Between(40,110),angle:petal.angle+180,alpha:0,duration:Phaser.Math.Between(1800,2600),onComplete:()=>petal.destroy()});
    }

    if(this.player?.active){
      this.player.setFlipX(this.lastFacing<0);
      const grounded=this.player.body.blocked.down||this.player.body.touching.down;

      // Landing feedback makes jump -> run feel deliberate instead of snapping between stills.
      if(grounded&&!this._wasGrounded&&this.characterId==='rumi'){
        const dust=this.add.ellipse(this.player.x,this.player.y+31,62,14,0xc7b5d9,.2).setDepth(15);
        this.tweens.add({targets:dust,scaleX:1.5,alpha:0,duration:220,onComplete:()=>dust.destroy()});
        this.player.setScale(this.player.scaleX*1.03,this.player.scaleY*.96);
        this.time.delayedCall(90,()=>{if(this.player?.active)this.player.setDisplaySize(260,123);});
      }
      this._wasGrounded=grounded;

      if(this.characterId==='rumi'&&this.textures.exists('rumi_sheet')){
        const dodging=this.player.alpha<.8;
        if(dodging){
          setRumiFrame(this,'dodge');
          this.player.setAngle(this.lastFacing*3);
          if(time-this._lastRumiGhost>55){makeAfterImage(this,.24);this._lastRumiGhost=time;}
        }else if(this.isAttacking||time<this._rumiAttackLockUntil){
          // attack pose remains locked until the gameplay attack window ends
        }else if(!grounded){
          setRumiFrame(this,Math.abs(this.player.body.velocity.x)>240?'aerial':'jump');
          this.player.setAngle(Phaser.Math.Clamp(this.player.body.velocityY/220,-4,5));
        }else if(Math.abs(this.player.body.velocity.x)>45){
          setRumiFrame(this,'run');
          this.player.setAngle(Math.sin(time/105)*1.35);
          if(time-this._lastRumiGhost>150&&Math.abs(this.player.body.velocity.x)>280){makeAfterImage(this,.09);this._lastRumiGhost=time;}
        }else{
          setRumiFrame(this,'idle');
          this.player.setAngle(Math.sin(time/500)*.45);
        }
      }
    }

    if(this.enemies){
      this.enemies.getChildren().forEach(e=>{
        if(!e.visual?.active)return;
        e.visual.setPosition(e.x,e.y);
        e.visual.setFlipX(this.player.x<e.x);
        const base=e.visual.baseScale||1;
        const motion=Math.abs(e.body?.velocity?.x||0)>5?Math.sin(time/120+e.x*.01)*.025:0;
        e.visual.setScale(base*(1+motion),base*(1-motion*.5));
        e.visual.setAlpha(e.type==='boss'&&!this.bossActive&&!this.bossDefeated?.72:1);
      });
    }
  };
}
