export function installRunSummary(GameScene){
  if(GameScene.prototype.__runSummaryInstalled)return;
  GameScene.prototype.__runSummaryInstalled=true;

  const originalCreate=GameScene.prototype.create;
  GameScene.prototype.create=function(...args){
    const result=originalCreate.apply(this,args);
    this.runStats={kills:0,falls:0,syncUses:0,startTime:this.time.now};
    this.levelCompleteQueued=false;
    return result;
  };

  const originalKillEnemy=GameScene.prototype.killEnemy;
  GameScene.prototype.killEnemy=function(enemy,...args){
    if(this.runStats&&!enemy.dead)this.runStats.kills++;
    return originalKillEnemy.call(this,enemy,...args);
  };

  const originalHandleFall=GameScene.prototype.handleFall;
  GameScene.prototype.handleFall=function(...args){
    if(this.runStats&&!this.isRespawning&&!this.isDefeated)this.runStats.falls++;
    return originalHandleFall.apply(this,args);
  };

  const originalUseSync=GameScene.prototype.useSync;
  GameScene.prototype.useSync=function(...args){
    if(this.runStats&&this.sync>=25)this.runStats.syncUses++;
    return originalUseSync.apply(this,args);
  };

  const originalEndBoss=GameScene.prototype.endBossEncounter;
  GameScene.prototype.endBossEncounter=function(...args){
    const result=originalEndBoss.apply(this,args);
    if(this.levelCompleteQueued)return result;
    this.levelCompleteQueued=true;
    this.time.delayedCall(1700,()=>{
      const stats={
        kills:this.runStats?.kills||0,
        falls:this.runStats?.falls||0,
        syncUses:this.runStats?.syncUses||0,
        timeMs:Math.max(0,this.time.now-(this.runStats?.startTime||0))
      };
      this.scene.start('LevelComplete',{character:this.characterId,stats});
    });
    return result;
  };
}
