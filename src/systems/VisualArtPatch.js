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
    if(scene.player.texture.key!=='rumi_sheet'||scene.player.frame.name!==frame)scene.player.setTexture('rumi_sheet',frame);
    return true;
  };

  GameScene.prototype.create=function(...args){
    originalCreate.apply(this,args);

    // Kill every old procedural background object. The CSS art layer is now the only skyline.
    this.children.list.slice().forEach(obj=>{
      if(obj===this.player)return;
      if(obj.depth<0)obj.destroy();
    });

    this.player.setDepth(20);
    if(this.characterId==='rumi'&&this.textures.exists('rumi_sheet')){
      this.player.setTexture('rumi_sheet',rumiFrames.idle);
      this.player.setDisplaySize(260,123);
      this.player.body.setSize(28,65,true);
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
      e.setAlpha(.01);
      e.visual=this.add.image(e.x,e.y,key).setDepth(18);
      const scale=type==='boss'?1:type==='brute'?.92:.9;
      e.visual.setScale(scale);
    }
    return e;
  };

  GameScene.prototype.performAttack=function(time){
    originalPerformAttack.call(this,time);
    const pose=this.comboStep===0?'attack1':this.comboStep===1?'attack2':'finisher';
    if(!setRumiFrame(this,pose)){
      const key=`${this.characterId}_${pose}`;
      if(this.textures.exists(key))this.player.setTexture(key);
    }
  };

  GameScene.prototype.hitEnemy=function(e,damage,step,buildSync=false){
    if(e.visual){e.visual.setTint(0xff82d4);this.time.delayedCall(110,()=>{if(e.visual?.active)e.visual.clearTint();});}
    return originalHitEnemy.call(this,e,damage,step,buildSync);
  };

  GameScene.prototype.killEnemy=function(e){
    if(e.visual?.active){
      const v=e.visual;e.visual=null;
      this.tweens.add({targets:v,alpha:0,scaleX:v.scaleX*1.35,scaleY:v.scaleY*.65,y:v.y-18,duration:e.type==='boss'?420:260,onComplete:()=>v.destroy()});
    }
    return originalKillEnemy.call(this,e);
  };

  GameScene.prototype.update=function(time,delta){
    originalUpdate.call(this,time,delta);

    if(this.player?.active){
      this.player.setFlipX(this.lastFacing<0);
      if(this.characterId==='rumi'&&this.textures.exists('rumi_sheet')){
        if(!this.isAttacking){
          const grounded=this.player.body.blocked.down||this.player.body.touching.down;
          if(this.player.alpha<.8)setRumiFrame(this,'dodge');
          else if(!grounded)setRumiFrame(this,Math.abs(this.player.body.velocity.x)>250?'aerial':'jump');
          else if(Math.abs(this.player.body.velocity.x)>45){
            setRumiFrame(this,'run');
            // small cadence motion so the source frame feels alive rather than like a cardboard cutout
            const bob=Math.sin(time/70)*2.2;
            this.player.setAngle(Math.sin(time/95)*1.8);
            this.player.y+=bob*.08;
          }else{
            setRumiFrame(this,'idle');
            this.player.setAngle(0);
          }
        }
      }else if(!this.isAttacking){
        const grounded=this.player.body.blocked.down||this.player.body.touching.down;
        let key=this.characterId;
        if(this.player.alpha<.8)key=`${this.characterId}_dodge`;
        else if(!grounded)key=`${this.characterId}_jump`;
        else if(Math.abs(this.player.body.velocity.x)>45)key=`${this.characterId}_${Math.floor(time/130)%2?'run1':'run2'}`;
        if(this.textures.exists(key)&&this.player.texture.key!==key)this.player.setTexture(key);
      }
    }

    if(this.enemies){
      this.enemies.getChildren().forEach(e=>{
        if(!e.visual?.active)return;
        e.visual.setPosition(e.x,e.y);
        e.visual.setFlipX(this.player.x<e.x);
        const pulse=e.scaleX||1;
        const base=e.type==='boss'?1:e.type==='brute'?.92:.9;
        e.visual.setScale(base*pulse,base*(e.scaleY||1));
        e.visual.setAlpha(e.type==='boss'&&!this.bossActive&&!this.bossDefeated?.72:1);
      });
    }
  };
}
