export default class TouchControls {
  constructor(scene){
    this.scene=scene; this.axis=0; this.jump=false; this.dodge=false; this.attack=false; this.sync=false;
    this.joystickPointerId=null;
    const h=scene.scale.height;
    const w=scene.scale.width;

    this.centerX=175;
    this.centerY=h-145;

    this.base=scene.add.circle(this.centerX,this.centerY,76,0xffffff,.12)
      .setScrollFactor(0).setDepth(100).setInteractive();
    this.knob=scene.add.circle(this.centerX,this.centerY,36,0xffffff,.28)
      .setScrollFactor(0).setDepth(101);

    const buttonY=h-140;
    const rightInset=165;
    const gap=125;
    const bind=(x,y,label,cb,scale=1)=>{
      const b=scene.add.image(x,y,'button').setScale(scale).setScrollFactor(0).setDepth(100).setInteractive();
      scene.add.text(x,y,label,{fontFamily:'system-ui',fontSize:scale<1?'15px':'17px',fontStyle:'bold',color:'#fff'})
        .setOrigin(.5).setScrollFactor(0).setDepth(101);
      b.on('pointerdown',cb);
    };

    bind(w-rightInset,buttonY,'ATTACK',()=>this.attack=true);
    bind(w-rightInset-gap,buttonY,'JUMP',()=>this.jump=true);
    bind(w-rightInset-gap*2,buttonY,'DODGE',()=>this.dodge=true);
    bind(w-rightInset-gap,buttonY-118,'SYNC',()=>this.sync=true,.82);

    this.base.on('pointerdown',p=>{
      if(this.joystickPointerId===null)this.joystickPointerId=p.id;
      if(p.id===this.joystickPointerId)this.moveStick(p);
    });
    this.base.on('pointermove',p=>{
      if(p.id===this.joystickPointerId && p.isDown)this.moveStick(p);
    });
    scene.input.on('pointerup',p=>{
      if(p.id===this.joystickPointerId)this.reset();
    });
    scene.input.on('gameout',()=>this.reset());
  }

  moveStick(p){
    const dx=Phaser.Math.Clamp(p.x-this.centerX,-60,60);
    this.knob.x=this.centerX+dx;
    this.axis=Math.abs(dx)<12?0:dx/60;
  }

  reset(){
    this.axis=0;
    this.knob.x=this.centerX;
    this.joystickPointerId=null;
  }

  consume(name){const v=this[name];this[name]=false;return v;}
}
