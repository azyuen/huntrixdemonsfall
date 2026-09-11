export default class TouchControls {
  constructor(scene){
    this.scene=scene;
    this.axis=0; this.jump=false; this.dodge=false; this.attack=false; this.sync=false;
    this.joystickPointerId=null;
    this.uiZoom=1;
    this.nodes=[];

    const h=scene.scale.height;
    const w=scene.scale.width;

    // Desired positions are SCREEN positions in the logical 1280x720 canvas.
    // layoutForZoom() converts these to world positions so camera zoom cannot push
    // the controls toward / off the phone edges.
    this.joyScreenX=235;
    this.joyScreenY=h-155;

    this.base=scene.add.circle(this.joyScreenX,this.joyScreenY,58,0x0b1020,.48)
      .setStrokeStyle(3,0xd8dcff,.76).setScrollFactor(0).setDepth(100).setInteractive();
    this.knob=scene.add.circle(this.joyScreenX,this.joyScreenY,29,0xd9dbe8,.48)
      .setStrokeStyle(2,0xffffff,.38).setScrollFactor(0).setDepth(101);
    this.leftChevron=scene.add.text(this.joyScreenX-42,this.joyScreenY,'‹',{fontFamily:'system-ui',fontSize:'22px',fontStyle:'bold',color:'#dce1ff'})
      .setOrigin(.5).setScrollFactor(0).setDepth(102).setAlpha(.68);
    this.rightChevron=scene.add.text(this.joyScreenX+42,this.joyScreenY,'›',{fontFamily:'system-ui',fontSize:'22px',fontStyle:'bold',color:'#dce1ff'})
      .setOrigin(.5).setScrollFactor(0).setDepth(102).setAlpha(.68);

    const makeButton=(screenX,screenY,label,cb,{r=41,accent=0x91a7ff,glow=false,icon=''}={})=>{
      const halo=glow?scene.add.circle(screenX,screenY,r+8,accent,.13).setScrollFactor(0).setDepth(98):null;
      if(halo)scene.tweens.add({targets:halo,scale:1.08,alpha:.05,duration:700,yoyo:true,repeat:-1});
      const circle=scene.add.circle(screenX,screenY,r,0x0b1020,.76)
        .setStrokeStyle(3,glow?0xffc64b:0xdfe5ff,.82).setScrollFactor(0).setDepth(100).setInteractive();
      const iconText=icon?scene.add.text(screenX,screenY-8,icon,{fontFamily:'system-ui',fontSize:r>46?'25px':'21px',fontStyle:'bold',color:glow?'#ffd65c':'#cdd8ff'})
        .setOrigin(.5).setScrollFactor(0).setDepth(101):null;
      const labelText=scene.add.text(screenX,screenY+(icon?18:0),label,{fontFamily:'system-ui',fontSize:r>46?'12px':'11px',fontStyle:'bold',color:'#ffffff',align:'center'})
        .setOrigin(.5).setScrollFactor(0).setDepth(101);
      const node={screenX,screenY,circle,halo,iconText,labelText};
      this.nodes.push(node);
      circle.on('pointerdown',()=>{circle.setScale((circle._uiScale||1)*.94);cb();});
      const release=()=>circle.setScale(circle._uiScale||1);
      circle.on('pointerup',release); circle.on('pointerout',release);
      return node;
    };

    // Ergonomic mobile layout: the three frequent actions form a widely-spaced bottom
    // row, while Sync sits above Attack on the right where it is visible but less likely
    // to be hit accidentally.
    this.dodgeNode=makeButton(w-500,h-155,'DODGE',()=>this.dodge=true,{r:39,icon:'➜'});
    this.jumpNode=makeButton(w-390,h-155,'JUMP',()=>this.jump=true,{r:39,icon:'↑'});
    this.attackNode=makeButton(w-280,h-155,'ATTACK',()=>this.attack=true,{r:41,icon:'⚔'});
    this.syncNode=makeButton(w-280,h-280,'SYNC\nATTACK',()=>this.sync=true,{r:48,accent:0xffba31,glow:true,icon:'✦'});

    this.base.on('pointerdown',p=>{
      if(this.joystickPointerId===null)this.joystickPointerId=p.id;
      if(p.id===this.joystickPointerId)this.moveStick(p);
    });
    scene.input.on('pointermove',p=>{
      if(p.id===this.joystickPointerId && p.isDown)this.moveStick(p);
    });
    scene.input.on('pointerup',p=>{
      if(p.id===this.joystickPointerId)this.reset();
    });
    scene.input.on('gameout',()=>this.reset());

    // VisualArtPatch applies gameplay zoom after GameScene.create() returns.
    // Run on the next tick so we pick up the final camera zoom automatically.
    scene.time.delayedCall(0,()=>this.layoutForZoom(scene.cameras.main.zoom||1));
  }

  worldFromScreen(screenX,screenY,zoom){
    const cx=this.scene.scale.width/2;
    const cy=this.scene.scale.height/2;
    return {x:cx+(screenX-cx)/zoom,y:cy+(screenY-cy)/zoom};
  }

  layoutForZoom(zoom=1){
    this.uiZoom=zoom;
    const inv=1/zoom;

    const joy=this.worldFromScreen(this.joyScreenX,this.joyScreenY,zoom);
    this.centerX=joy.x; this.centerY=joy.y;
    this.base.setPosition(joy.x,joy.y).setScale(inv); this.base._uiScale=inv;
    this.knob.setPosition(joy.x,joy.y).setScale(inv);

    const lc=this.worldFromScreen(this.joyScreenX-42,this.joyScreenY,zoom);
    const rc=this.worldFromScreen(this.joyScreenX+42,this.joyScreenY,zoom);
    this.leftChevron.setPosition(lc.x,lc.y).setScale(inv);
    this.rightChevron.setPosition(rc.x,rc.y).setScale(inv);

    this.nodes.forEach(node=>{
      const p=this.worldFromScreen(node.screenX,node.screenY,zoom);
      node.circle.setPosition(p.x,p.y).setScale(inv); node.circle._uiScale=inv;
      if(node.halo){node.halo.setPosition(p.x,p.y).setScale(inv);}
      if(node.iconText){node.iconText.setPosition(p.x,p.y-8/zoom).setScale(inv);}
      node.labelText.setPosition(p.x,p.y+(node.iconText?18/zoom:0)).setScale(inv);
    });
    this.reset();
  }

  moveStick(p){
    // Pointer coordinates are screen-space. Compare against the joystick's SCREEN centre,
    // not its zoom-compensated world coordinate. This fixes the right->left reversal.
    const px=p.position?.x ?? p.x;
    const dx=Phaser.Math.Clamp(px-this.joyScreenX,-48,48);
    this.axis=Math.abs(dx)<9?0:dx/48;
    this.knob.x=this.centerX+dx/this.uiZoom;
  }

  reset(){
    this.axis=0;
    if(this.knob&&Number.isFinite(this.centerX))this.knob.x=this.centerX;
    this.joystickPointerId=null;
  }

  consume(name){const v=this[name];this[name]=false;return v;}
}