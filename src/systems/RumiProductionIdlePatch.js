import Phaser from 'phaser';

const PROD_IDLE_KEY='rumi-idle-production';
const PROD_IDLE_TEXTURE='rumi_idle_prod';
const PROD_IDLE_SCALE=.33;

export function installRumiProductionIdle(GameScene){
  const previousCreate=GameScene.prototype.create;
  const previousUpdate=GameScene.prototype.update;

  const registerIdle=scene=>{
    if(!scene.textures.exists(PROD_IDLE_TEXTURE))return false;
    scene.textures.get(PROD_IDLE_TEXTURE)?.setFilter?.(Phaser.Textures.FilterMode.LINEAR);
    if(!scene.anims.exists(PROD_IDLE_KEY)){
      scene.anims.create({
        key:PROD_IDLE_KEY,
        frames:[0,1,2,3,2,1].map(frame=>({key:PROD_IDLE_TEXTURE,frame})),
        frameRate:4,
        repeat:-1
      });
    }
    return true;
  };

  const redirectPrototypeIdle=scene=>{
    const sprite=scene.rumiVisual;
    if(!sprite||sprite._productionIdleRedirectInstalled)return;
    const originalPlay=sprite.play.bind(sprite);
    sprite.play=(key,ignoreIfPlaying=false,startFrame=0)=>{
      const requested=typeof key==='string'?key:key?.key;
      if(requested==='rumi-idle'&&scene.anims.exists(PROD_IDLE_KEY)){
        return originalPlay(PROD_IDLE_KEY,ignoreIfPlaying,startFrame);
      }
      return originalPlay(key,ignoreIfPlaying,startFrame);
    };
    sprite._productionIdleRedirectInstalled=true;
  };

  GameScene.prototype.create=function(...args){
    const result=previousCreate.apply(this,args);
    if(this.characterId==='rumi'&&this.rumiVisual&&registerIdle(this)){
      redirectPrototypeIdle(this);
      this.rumiVisual.play(PROD_IDLE_KEY,false).setOrigin(.5,1).setScale(PROD_IDLE_SCALE).setVisible(true);
      this.rumiPose='idle';
    }
    return result;
  };

  GameScene.prototype.update=function(time,delta){
    previousUpdate.call(this,time,delta);
    if(this.characterId!=='rumi'||!this.rumiVisual)return;
    if(this.rumiVisual.texture?.key===PROD_IDLE_TEXTURE){
      // The four production frames already contain the idle motion; do not add procedural squash/stretch.
      this.rumiVisual.setScale(PROD_IDLE_SCALE).setOrigin(.5,1);
    }
  };
}

export const RUMI_PRODUCTION_IDLE={
  texture:PROD_IDLE_TEXTURE,
  animation:PROD_IDLE_KEY,
  scale:PROD_IDLE_SCALE,
  frameOrder:[0,1,2,3,2,1],
  frameRate:4
};
