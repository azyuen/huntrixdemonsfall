const NORMAL_ZOOM=1.85;
const BOSS_ZOOM=1.54;
const ZOOM_RESPONSE_MS=260;

export function installCameraDirector(GameScene){
  const previousCreate=GameScene.prototype.create;
  const previousUpdate=GameScene.prototype.update;

  const preserveFixedUI=(scene,fromZoom,toZoom)=>{
    if(Math.abs(toZoom-fromZoom)<0.0001)return;
    const cx=scene.scale.width/2,cy=scene.scale.height/2;
    const ratio=fromZoom/toZoom;
    scene.children.list.forEach(obj=>{
      if(!obj||obj.scrollFactorX!==0||obj.depth<120||obj.depth>140)return;
      const sx=cx+(obj.x-cx)*fromZoom;
      const sy=cy+(obj.y-cy)*fromZoom;
      obj.setPosition(cx+(sx-cx)/toZoom,cy+(sy-cy)/toZoom);
      obj.setScale(obj.scaleX*ratio,obj.scaleY*ratio);
    });
  };

  const applyZoom=(scene,fromZoom,toZoom)=>{
    preserveFixedUI(scene,fromZoom,toZoom);
    scene.cameras.main.setZoom(toZoom);
    scene.touch?.layoutForZoom?.(toZoom);
  };

  GameScene.prototype.create=function(...args){
    const result=previousCreate.apply(this,args);
    const current=this.cameras.main.zoom||BOSS_ZOOM;
    applyZoom(this,current,NORMAL_ZOOM);
    this._cameraDirectorZoom=NORMAL_ZOOM;
    return result;
  };

  GameScene.prototype.update=function(time,delta){
    previousUpdate.call(this,time,delta);
    const target=this.bossActive?BOSS_ZOOM:NORMAL_ZOOM;
    const current=this.cameras.main.zoom||target;
    if(Math.abs(target-current)<0.001){
      if(current!==target)applyZoom(this,current,target);
      this._cameraDirectorZoom=target;
      return;
    }

    const blend=1-Math.exp(-Math.max(0,delta||16)/ZOOM_RESPONSE_MS);
    const next=current+(target-current)*blend;
    applyZoom(this,current,next);
    this._cameraDirectorZoom=next;
  };
}

export const CAMERA_FRAMING={
  normalZoom:NORMAL_ZOOM,
  bossZoom:BOSS_ZOOM,
  normalRumiScreenFraction:0.33,
  bossRumiScreenFraction:0.27
};
