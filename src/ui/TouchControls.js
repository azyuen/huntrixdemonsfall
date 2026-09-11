export default class TouchControls {
  constructor(scene){
    this.scene=scene; this.axis=0; this.jump=false; this.dodge=false; this.attack=false;
    const h=scene.scale.height;
    this.base=scene.add.circle(135,h-120,76,0xffffff,.12).setScrollFactor(0).setDepth(100).setInteractive();
    this.knob=scene.add.circle(135,h-120,36,0xffffff,.28).setScrollFactor(0).setDepth(101);
    const bind=(x,label,cb)=>{ const b=scene.add.image(x,h-110,'button').setScrollFactor(0).setDepth(100).setInteractive(); scene.add.text(x,h-110,label,{fontFamily:'system-ui',fontSize:'17px',fontStyle:'bold',color:'#fff'}).setOrigin(.5).setScrollFactor(0).setDepth(101); b.on('pointerdown',cb); };
    bind(scene.scale.width-105,'ATTACK',()=>this.attack=true); bind(scene.scale.width-220,'JUMP',()=>this.jump=true); bind(scene.scale.width-335,'DODGE',()=>this.dodge=true);
    this.base.on('pointerdown',p=>this.moveStick(p)); this.base.on('pointermove',p=>{if(p.isDown)this.moveStick(p)}); this.base.on('pointerup',()=>this.reset()); this.base.on('pointerout',p=>{if(!p.isDown)this.reset()});
  }
  moveStick(p){ const dx=Phaser.Math.Clamp(p.x-135,-60,60); this.knob.x=135+dx; this.axis=Math.abs(dx)<12?0:dx/60; }
  reset(){this.axis=0;this.knob.x=135;}
  consume(name){const v=this[name];this[name]=false;return v;}
}
