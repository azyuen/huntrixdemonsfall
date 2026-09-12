import Phaser from 'phaser';

const FINAL_IDLE_SCALE=0.334;
const FINAL_IDLE_ORIGIN_Y=0.985;
const FINAL_IDLE_FPS=6;
const FINAL_IDLE_SEQUENCE=[0,1,2,3,2,1];

export function installFinalRumiIdle(GameScene){
  const previousCreate=GameScene.prototype.create;
  const previousUpdate=GameScene.prototype.update;

  const finalIdleReady=scene=>scene.textures.exists('rumi_idle_final');

  const showFinalIdle=(scene,time)=>{
    const frameMs=1000/FINAL_IDLE_FPS;
    const sequenceIndex=Math.floor(time/frameMs)%FINAL_IDLE_SEQUENCE.length;
    const frame=FINAL_IDLE_SEQUENCE[sequenceIndex];
    const visual=scene.rumiVisual;
    if(!visual||!scene.textures.exists('rumi_idle_final'))return;

    if(visual.texture.key!=='rumi_idle_final'||visual.frame?.name!==frame){
      visual.anims?.stop();
      visual.setTexture('rumi_idle_final',frame);
    }
    visual.setOrigin(.5,FINAL_IDLE_ORIGIN_Y).setScale(FINAL_IDLE_SCALE).setVisible(true);
    visual.setFlipX(scene.lastFacing<0);
    visual.setPosition(scene.player.body.center.x,scene.player.body.bottom+5);
    visual.setAngle(0).setAlpha(1);
    scene.rumiPose='idle-final';
  };

  GameScene.prototype.create=function(...args){
    const result=previousCreate.apply(this,args);
    this.rumiFinalIdleReady=this.characterId==='rumi'&&finalIdleReady(this);
    if(this.rumiFinalIdleReady){
      this.textures.get('rumi_idle_final')?.setFilter?.(Phaser.Textures.FilterMode.LINEAR);
      const body=this.player?.body;
      if(body&&(body.blocked.down||body.touching.down)&&Math.abs(body.velocity.x)<45)showFinalIdle(this,this.time.now);
    }
    return result;
  };

  GameScene.prototype.update=function(time,delta){
    previousUpdate.call(this,time,delta);
    if(!this.rumiFinalIdleReady||!this.rumiVisual||!this.player?.body)return;
    const body=this.player.body;
    const grounded=body.blocked.down||body.touching.down;
    const dodging=time<=this.dodgeInvulnerableUntil;
    const busy=this.isAttacking||time<this._rumiAttackLockUntil||time<this._rumiLandingUntil||dodging;
    if(grounded&&!busy&&Math.abs(body.velocity.x)<=45)showFinalIdle(this,time);
  };
}

export const FINAL_RUMI_IDLE_SPEC={
  sourceCanvas:[216,399],
  sheetSize:[864,399],
  bodyHeightPx:390,
  runtimeScale:FINAL_IDLE_SCALE,
  origin:[0.5,FINAL_IDLE_ORIGIN_Y],
  frameRate:FINAL_IDLE_FPS,
  sequence:FINAL_IDLE_SEQUENCE
};
