export default class TouchControls {
  constructor(scene){
    this.scene=scene; this.axis=0; this.jump=false; this.dodge=false; this.attack=false; this.sync=false;
    this.joystickPointerId=null;
    const h=scene.scale.height;
    const w=scene.scale.width;

    /*
      These controls are rendered by the main Phaser camera. Because the gameplay camera
      is zoomed, screen-fixed objects also appear farther from the centre. The coordinates
      below deliberately sit well inside the logical 1280x720 canvas so the final controls
      land in a comfortable thumb zone instead of being clipped by phone edges/notches.
    */
    this.centerX=330;
    this.centerY=h-200;

    this.base=scene.add.circle(this.centerX,this.centerY,64,0x0b1020,.46)
      .setStrokeStyle(3,0xd8dcff,.72).setScrollFactor(0).setDepth(100).setInteractive();
    this.knob=scene.add.circle(this.centerX,this.centerY,32,0xd9dbe8,.45)
      .setStrokeStyle(2,0xffffff,.36).setScrollFactor(0).setDepth(101);

    const addChevron=(x,y,txt)=>scene.add.text(x,y,txt,{fontFamily:'system-ui',fontSize:'22px',fontStyle:'bold',color:'#dce1ff'})
      .setOrigin(.5).setScrollFactor(0).setDepth(102).setAlpha(.70);
    addChevron(this.centerX-44,this.centerY,'‹');
    addChevron(this.centerX+44,this.centerY,'›');

    const btn=(x,y,label,cb,{r=43,accent=0x91a7ff,glow=false,icon='' }={})=>{
      const halo=glow?scene.add.circle(x,y,r+8,accent,.13).setScrollFactor(0).setDepth(98):null;
      if(halo)scene.tweens.add({targets:halo,scale:1.08,alpha:.05,duration:700,yoyo:true,repeat:-1});
      const b=scene.add.circle(x,y,r,0x0b1020,.74).setStrokeStyle(3,glow?0xffc64b:0xdfe5ff,.78)
        .setScrollFactor(0).setDepth(100).setInteractive();
      if(icon)scene.add.text(x,y-8,icon,{fontFamily:'system-ui',fontSize:r>48?'26px':'22px',fontStyle:'bold',color:glow?'#ffd65c':'#cdd8ff'})
        .setOrigin(.5).setScrollFactor(0).setDepth(101);
      scene.add.text(x,y+(icon?19:0),label,{fontFamily:'system-ui',fontSize:r>48?'12px':'11px',fontStyle:'bold',color:'#ffffff',align:'center'})
        .setOrigin(.5).setScrollFactor(0).setDepth(101);
      b.on('pointerdown',()=>{b.setScale(.94);cb();});
      b.on('pointerup',()=>b.setScale(1));
      b.on('pointerout',()=>b.setScale(1));
      return b;
    };

    // Compact diamond cluster, substantially inset from the right and bottom edges.
    const attackX=w-360;
    const attackY=h-205;
    btn(attackX,attackY,'ATTACK',()=>this.attack=true,{r:43,icon:'⚔'});
    btn(attackX-105,attackY+8,'JUMP',()=>this.jump=true,{r:41,icon:'↑'});
    btn(attackX+2,attackY-100,'DODGE',()=>this.dodge=true,{r:41,icon:'➜'});
    btn(attackX+102,attackY-20,'SYNC\nATTACK',()=>this.sync=true,{r:50,accent:0xffba31,glow:true,icon:'✦'});

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
    const px=p.position?.x ?? p.x;
    const dx=Phaser.Math.Clamp(px-this.centerX,-50,50);
    this.knob.x=this.centerX+dx;
    this.axis=Math.abs(dx)<10?0:dx/50;
  }

  reset(){
    this.axis=0;
    this.knob.x=this.centerX;
    this.joystickPointerId=null;
  }

  consume(name){const v=this[name];this[name]=false;return v;}
}
