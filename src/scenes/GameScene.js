import Phaser from 'phaser';
import { GAMEPLAY } from '../config/gameplay.js';
import TouchControls from '../ui/TouchControls.js';

export default class GameScene extends Phaser.Scene {
  constructor(){super('Game');}
  create(){
    this.cameras.main.setBackgroundColor('#100b2d'); this.physics.world.setBounds(0,0,GAMEPLAY.worldWidth,720);
    for(let i=0;i<28;i++){ const x=i*170; const h=Phaser.Math.Between(150,420); this.add.rectangle(x,720-h/2,150,h,0x1a1740).setOrigin(0,.5); }
    this.add.circle(950,125,65,0xe7dfff,.85).setScrollFactor(.12); this.add.text(620,75,'SEOUL // ROOFTOP TEST',{fontFamily:'system-ui',fontSize:'22px',color:'#bba7ff'}).setScrollFactor(.35);
    this.platforms=this.physics.add.staticGroup();
    const platform=(x,y,w,h=40)=>{ const r=this.add.rectangle(x,y,w,h,0x33265d).setStrokeStyle(3,0x66508f); this.physics.add.existing(r,true); this.platforms.add(r); };

    // Keep the playable action comfortably above the thumb-control zone.
    platform(500,560,1000);
    platform(1250,520,360);
    platform(1660,455,330);
    platform(2050,540,360);
    platform(2500,465,420);
    platform(3010,530,450);
    platform(3540,440,400);
    platform(4020,550,360);

    this.player=this.physics.add.sprite(180,430,'rumi').setCollideWorldBounds(false); this.player.body.setSize(38,84); this.physics.add.collider(this.player,this.platforms);
    this.cursors=this.input.keyboard.createCursorKeys(); this.keys=this.input.keyboard.addKeys('A,D,W,SPACE,J,K'); this.touch=new TouchControls(this); this.lastFacing=1; this.lastDodge=-9999;
    this.cameras.main.setBounds(0,0,GAMEPLAY.worldWidth,720); this.cameras.main.startFollow(this.player,true,.09,.09,260,0);
    this.notice=this.add.text(780,34,'Move: A/D or ←/→   Jump: W/Space   Dodge: K   Attack: placeholder',{fontFamily:'system-ui',fontSize:'17px',color:'#fff'}).setOrigin(.5).setScrollFactor(0).setDepth(110);
  }
  update(time){
    if(this.player.y>820){this.player.setPosition(Math.max(120,this.player.x-120),360);this.player.setVelocity(0);}
    const kb=(this.cursors.left.isDown||this.keys.A.isDown?-1:0)+(this.cursors.right.isDown||this.keys.D.isDown?1:0); const axis=kb||this.touch.axis;
    if(axis){this.lastFacing=Math.sign(axis);this.player.setVelocityX(axis*GAMEPLAY.moveSpeed);}else this.player.setVelocityX(0);
    const grounded=this.player.body.blocked.down||this.player.body.touching.down; const jump=Phaser.Input.Keyboard.JustDown(this.cursors.up)||Phaser.Input.Keyboard.JustDown(this.keys.W)||Phaser.Input.Keyboard.JustDown(this.keys.SPACE)||this.touch.consume('jump'); if(jump&&grounded)this.player.setVelocityY(-GAMEPLAY.jumpSpeed);
    const dodge=Phaser.Input.Keyboard.JustDown(this.keys.K)||this.touch.consume('dodge'); if(dodge&&time-this.lastDodge>=GAMEPLAY.dodgeCooldown){this.lastDodge=time;this.player.setVelocityX(this.lastFacing*GAMEPLAY.dodgeSpeed);this.player.setAlpha(.55);this.time.delayedCall(GAMEPLAY.dodgeDuration,()=>this.player.setAlpha(1));}
    if(Phaser.Input.Keyboard.JustDown(this.keys.J)||this.touch.consume('attack')){this.notice.setText('Attack placeholder — combat arrives in Phase 3');this.time.delayedCall(900,()=>this.notice.setText('Move: A/D or ←/→   Jump: W/Space   Dodge: K   Attack: placeholder'));}
  }
}
