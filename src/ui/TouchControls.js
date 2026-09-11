export default class TouchControls {
  constructor(scene){
    this.scene=scene; this.axis=0; this.jump=false; this.dodge=false; this.attack=false; this.sync=false;
    this.joystickPointerId=null;
    const h=scene.scale.height;
    const w=scene.scale.width;

    // Keep controls comfortably inside phone safe areas and closer to natural thumb arcs.
    this.centerX=215;
    this.centerY=h-145;

    this.base=scene.add.circle(this.centerX,this.centerY,68,0x0b1020,.46)
      .setStrokeStyle(3,0xd8dcff,.72).setScrollFactor(0).setDepth(100).setInteractive();
    this.knob=scene.add.circle(this.centerX,this.centerY,34,0xd9dbe8,.45)
      .setStrokeStyle(2,0xffffff,.36).setScrollFactor(0).setDepth(101);

    const addChevron=(x,y,txt)=>scene.add.text(x,y,txt,{fontFamily:'system-ui',fontSize:'24px',fontStyle:'bold',color:'#dce1ff'})
      .setOrigin(.5).setScrollFactor(0).setDepth(102).setAlpha(.72);
    addChevron(this.centerX-47,this.centerY,'‹');
    addChevron(this.centerX+47,this.centerY,'›');

    const btn=(x,y,label,cb,{r=45,accent=0x91a7ff,glow=false,icon='' }={})=>{
      const halo=glow?scene.add.circle(x,y,r+9,accent,.13).setScrollFactor(0).setDepth(98):null;
      if(halo)scene.tweens.add({targets:halo,scale:1.08,alpha:.05,duration:700,yoyo:true,repeat:-1});
      const b=scene.add.circle(x,y,r,0x0b1020,.74).setStrokeStyle(3,glow?0xffc64b:0xdfe5ff,.78)
        .setScrollFactor(0).setDepth(100).setInteractive();
      if(icon)scene.add.text(x,y-8,icon,{fontFamily:'system-ui',fontSize:r>48?'27px':'23px',fontStyle:'bold',color:glow?'#ffd65c':'#cdd8ff'})
        .setOrigin(.5).setScrollFactor(0).setDepth(101);
      scene.add.text(x,y+(icon?20:0),label,{fontFamily:'system-ui',fontSize:r>48?'13px':'12px',fontStyle:'bold',color:'#ffffff',align:'center'})
        .setOrigin(.5).setScrollFactor(0).setDepth(101);
      b.on('pointerdown',()=>{b.setScale(.94);cb();});
      b.on('pointerup',()=>b.setScale(1));
      b.on('pointerout',()=>b.setScale(1));
      return b;
    };

    // Entire action cluster shifted left and upward from the screen edges.
    const attackX=w-235;
    const attackY=h-145;
    btn(attackX,attackY,'ATTACK',()=>this.attack=true,{r:45,icon:'⚔'});
    btn(attackX-125,attackY+4,'JUMP',()=>this.jump=true,{r:42,icon:'↑'});
    btn(attackX+5,attackY-125,'DODGE',()=>this.dodge=true,{r:42,icon:'➜'});
    btn(attackX+100,attackY-12,'SYNC\nATTACK',()=>this.sync=true,{r:54,accent:0xffba31,glow:true,icon:'✦'});

    // Capture joystick dragging globally while this pointer owns the stick. This prevents
    // camera zoom/scroll transforms from making the stick feel reversed or dropping input.
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
  }

  moveStick(p){
    // pointer.position is screen-space; controls are fixed to screen-space too.
    const px=p.position?.x ?? p.x;
    const dx=Phaser.Math.Clamp(px-this.centerX,-52,52);
    this.knob.x=this.centerX+dx;
    this.axis=Math.abs(dx)<10?0:dx/52;
  }

  reset(){
    this.axis=0;
    this.knob.x=this.centerX;
    this.joystickPointerId=null;
  }

  consume(name){const v=this[name];this[name]=false;return v;}
}
