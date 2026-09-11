export function installVisualArt(GameScene){
  const originalCreate=GameScene.prototype.create;
  const originalUpdate=GameScene.prototype.update;
  const originalSpawnEnemy=GameScene.prototype.spawnEnemy;
  const originalHitEnemy=GameScene.prototype.hitEnemy;
  const originalKillEnemy=GameScene.prototype.killEnemy;
  const originalPerformAttack=GameScene.prototype.performAttack;

  GameScene.prototype.create=function(...args){
    originalCreate.apply(this,args);

    // Remove the old procedural skyline/window blocks now that real background art is loaded.
    this.children.list.slice().forEach(obj=>{
      if(obj===this.player)return;
      if(obj.depth<=-4 && (obj.type==='Rectangle'||obj.type==='Arc')) obj.destroy();
    });

    // Illustrated Seoul background, fixed behind gameplay. Two copies provide enough width without stretching the art excessively.
    if(this.textures.exists('seoulSky')){
      const a=this.add.image(780,360,'seoulSky').setDisplaySize(1560,720).setScrollFactor(0).setDepth(-30).setAlpha(.9);
      const b=this.add.image(2340,360,'seoulSky').setDisplaySize(1560,720).setScrollFactor(.08,0).setDepth(-29).setAlpha(.35).setTint(0x756a98);
      a.setOrigin(.5);b.setOrigin(.5);
    }

    this.player.setDepth(20);
    this.player.setTexture(this.characterId);
    this.player.setDisplaySize(this.characterId==='mira'?86:this.characterId==='zoey'?74:80,this.characterId==='mira'?112:this.characterId==='zoey'?94:104);
    this.player.body.setSize(this.characterId==='mira'?36:34,this.characterId==='zoey'?72:82,true);
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
    const key=`${this.characterId}_${pose}`;
    if(this.textures.exists(key))this.player.setTexture(key);
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

    // Animate hunter using pose textures while preserving the existing physics/combat system.
    if(this.player?.active){
      this.player.setFlipX(this.lastFacing<0);
      if(!this.isAttacking){
        const grounded=this.player.body.blocked.down||this.player.body.touching.down;
        let key=this.characterId;
        if(this.player.alpha<.8) key=`${this.characterId}_dodge`;
        else if(!grounded) key=`${this.characterId}_jump`;
        else if(Math.abs(this.player.body.velocity.x)>45) key=`${this.characterId}_${Math.floor(time/130)%2?'run1':'run2'}`;
        if(this.textures.exists(key)&&this.player.texture.key!==key)this.player.setTexture(key);
      }
    }

    // Keep enemy art exactly over invisible physics bodies and face the player.
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
