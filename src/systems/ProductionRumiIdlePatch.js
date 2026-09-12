const PRODUCTION_IDLE_SCALE=0.335;
const IDLE_ANIMATION_KEY='rumi-idle-production';

export function installProductionRumiIdle(GameScene){
  const previousCreate=GameScene.prototype.create;
  const previousUpdate=GameScene.prototype.update;

  const registerIdle=scene=>{
    if(!scene.textures.exists('rumi_idle_prod'))return false;
    if(!scene.anims.exists(IDLE_ANIMATION_KEY)){
      scene.anims.create({
        key:IDLE_ANIMATION_KEY,
        frames:[0,1,2,3,2,1].map(frame=>({key:'rumi_idle_prod',frame})),
        frameRate:5,
        repeat:-1
      });
    }
    return true;
  };

  const useProductionIdle=scene=>{
    const visual=scene.rumiVisual;
    const body=scene.player?.body;
    if(scene.characterId!=='rumi'||!visual||!body||scene.rumiPose!=='idle')return;
    if(!scene.anims.exists(IDLE_ANIMATION_KEY))return;

    if(visual.anims.currentAnim?.key!==IDLE_ANIMATION_KEY)visual.play(IDLE_ANIMATION_KEY);
    visual
      .setOrigin(.5,1)
      .setScale(PRODUCTION_IDLE_SCALE)
      .setPosition(body.center.x,body.bottom+5)
      .setFlipX(scene.lastFacing<0)
      .setAngle(0)
      .setAlpha(1)
      .setVisible(true);
  };

  GameScene.prototype.create=function(...args){
    const result=previousCreate.apply(this,args);
    registerIdle(this);
    useProductionIdle(this);
    return result;
  };

  GameScene.prototype.update=function(time,delta){
    previousUpdate.call(this,time,delta);
    useProductionIdle(this);
  };
}

export const RUMI_IDLE_PRODUCTION_SPEC={
  frameWidth:216,
  frameHeight:399,
  sourceBodyHeight:384,
  runtimeScale:PRODUCTION_IDLE_SCALE,
  sequence:[0,1,2,3,2,1],
  frameRate:5
};
