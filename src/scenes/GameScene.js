import Phaser from 'phaser';
import { GAMEPLAY } from '../config/gameplay.js';
import TouchControls from '../ui/TouchControls.js';

export default class GameScene extends Phaser.Scene {
  constructor(){super('Game');}
  create(){
    this.cameras.main.setBackgroundColor('#100b2d'); this.physics.world.setBounds(0,0,GAMEPLAY.worldWidth,720);
    for(let i=0;i<28;i++){const x=i*170,h=Phaser.Math.Between(150,420);this.add.rectangle(x,720-h/2,150,h,0x1a1740).setOrigin(0,.5);}
    this.add.circle(950,125,65,0xe7dfff,.85).setScrollFactor(.12); this.add.text(620,75,'SEOUL // COMBAT TEST',{fontFamily:'system-ui',fontSize:'22px',color:'#bba7ff'}).setScrollFactor(.35);
    this.platforms=this.physics.add.staticGroup(); const platform=(x,y,w,h=40)=>{const r=this.add.rectangle(x,y,w,h,0x33265d).setStrokeStyle(3,0x66508f);this.physics.add.existing(r,true);this.platforms.add(r);};
    platform(500,560,1000);platform(1250,520,360);platform(1660,455,330);platform(2050,540,360);platform(2500,465,420);platform(3010,530,450);platform(3540,440,400);platform(4020,550,360);
    this.player=this.physics.add.sprite(180,430,'rumi').setCollideWorldBounds(false);this.player.body.setSize(38,84);this.physics.add.collider(this.player,this.platforms);
    this.playerHealth=GAMEPLAY.playerMaxHealth;this.lastPlayerHit=-9999;this.lastFacing=1;this.lastDodge=-9999;this.isAttacking=false;this.comboStep=0;this.lastAttack=-9999;
    this.enemies=this.physics.add.group();[720,1420,2130,2730,3290,3900].forEach((x,i)=>this.spawnEnemy(x,i%2?360:420));this.physics.add.collider(this.enemies,this.platforms);
    this.cursors=this.input.keyboard.createCursorKeys();this.keys=this.input.keyboard.addKeys('A,D,W,SPACE,J,K');this.touch=new TouchControls(this);
    this.cameras.main.setBounds(0,0,GAMEPLAY.worldWidth,720);this.cameras.main.startFollow(this.player,true,.09,.09,260,0);
    this.add.rectangle(175,48,270,28,0x140d24,.9).setScrollFactor(0).setDepth(120).setStrokeStyle(2,0xffffff,.35);
    this.healthBar=this.add.rectangle(42,48,266,22,0xef4f8a).setOrigin(0,.5).setScrollFactor(0).setDepth(121);
    this.healthText=this.add.text(175,48,'RUMI  100 / 100',{fontFamily:'system-ui',fontSize:'16px',fontStyle:'bold',color:'#fff'}).setOrigin(.5).setScrollFactor(0).setDepth(122);
    this.comboText=this.add.text(780,46,'',{fontFamily:'system-ui',fontSize:'22px',fontStyle:'bold',color:'#f8d8ff'}).setOrigin(.5).setScrollFactor(0).setDepth(122);
  }
  spawnEnemy(x,y){
    const e=this.add.rectangle(x,y,48,76,0x271a35).setStrokeStyle(4,0x8d5b91);this.physics.add.existing(e);e.body.setSize(48,76);e.health=GAMEPLAY.enemyMaxHealth;e.lastAttack=-9999;e.dead=false;e.hitUntil=0;this.enemies.add(e);
    e.hpBg=this.add.rectangle(x,y-55,58,8,0x160e20).setDepth(30);e.hpBar=this.add.rectangle(x-28,y-55,56,5,0xc25c86).setOrigin(0,.5).setDepth(31);
  }
  update(time){
    if(this.player.y>820){this.player.setPosition(Math.max(120,this.player.x-120),360);this.player.setVelocity(0);}
    const grounded=this.player.body.blocked.down||this.player.body.touching.down;
    const kb=(this.cursors.left.isDown||this.keys.A.isDown?-1:0)+(this.cursors.right.isDown||this.keys.D.isDown?1:0),axis=kb||this.touch.axis;

    // Movement remains live through jumps, landings and attacks.
    if(axis){
      this.lastFacing=Math.sign(axis);
      this.player.setVelocityX(axis*GAMEPLAY.moveSpeed);
    }else if(grounded&&!this.isAttacking){
      this.player.setVelocityX(0);
    }

    const jump=Phaser.Input.Keyboard.JustDown(this.cursors.up)||Phaser.Input.Keyboard.JustDown(this.keys.W)||Phaser.Input.Keyboard.JustDown(this.keys.SPACE)||this.touch.consume('jump');
    if(jump&&grounded)this.player.setVelocityY(-GAMEPLAY.jumpSpeed);

    const dodge=Phaser.Input.Keyboard.JustDown(this.keys.K)||this.touch.consume('dodge');if(dodge&&time-this.lastDodge>=GAMEPLAY.dodgeCooldown){this.lastDodge=time;this.isAttacking=false;this.player.setVelocityX(this.lastFacing*GAMEPLAY.dodgeSpeed);this.player.setAlpha(.5);this.time.delayedCall(GAMEPLAY.dodgeDuration,()=>this.player.setAlpha(1));}
    if((Phaser.Input.Keyboard.JustDown(this.keys.J)||this.touch.consume('attack'))&&!this.isAttacking)this.performAttack(time);
    this.updateEnemies(time);this.updateHUD();
  }
  performAttack(time){
    if(time-this.lastAttack>GAMEPLAY.comboReset)this.comboStep=0;else this.comboStep=(this.comboStep+1)%3;this.lastAttack=time;const step=this.comboStep;this.isAttacking=true;

    // If Rumi is already running, preserve that momentum. From rest, give only a small attack lunge.
    if(Math.abs(this.player.body.velocity.x)<80)this.player.setVelocityX(this.lastFacing*(step===2?105:55));

    const reach=GAMEPLAY.attackReach[step],hitX=this.player.x+this.lastFacing*(42+reach/2),slash=this.add.rectangle(hitX,this.player.y-4,reach,68,step===2?0xffd5ff:0xb68cff,.25).setDepth(25);slash.setStrokeStyle(step===2?6:4,step===2?0xffffff:0xd8baff,.85);this.tweens.add({targets:slash,alpha:0,scaleX:1.25,duration:GAMEPLAY.attackDuration[step],onComplete:()=>slash.destroy()});
    this.enemies.getChildren().forEach(e=>{if(e.dead)return;const dx=e.x-this.player.x,inFront=Math.sign(dx)===this.lastFacing||Math.abs(dx)<30;if(inFront&&Math.abs(dx)<=reach+48&&Math.abs(e.y-this.player.y)<85)this.hitEnemy(e,GAMEPLAY.attackDamage[step],step);});
    this.comboText.setText(step===0?'STRIKE':step===1?'STRIKE ×2':'FINISHER!');this.time.delayedCall(GAMEPLAY.attackDuration[step],()=>this.isAttacking=false);this.time.delayedCall(650,()=>{if(time===this.lastAttack)this.comboText.setText('');});
  }
  hitEnemy(e,damage,step){e.health-=damage;e.hitUntil=this.time.now+170;e.setFillStyle(0x7d5a86);e.body.setVelocityX(this.lastFacing*(step===2?360:210));this.cameras.main.shake(step===2?70:40,step===2?.004:.002);this.time.delayedCall(90,()=>{if(!e.dead)e.setFillStyle(0x271a35);});if(e.health<=0)this.killEnemy(e);}
  killEnemy(e){e.dead=true;e.body.enable=false;e.hpBg.destroy();e.hpBar.destroy();for(let i=0;i<7;i++){const p=this.add.circle(e.x+Phaser.Math.Between(-18,18),e.y+Phaser.Math.Between(-28,28),Phaser.Math.Between(8,18),0x5a426a,.55).setDepth(20);this.tweens.add({targets:p,x:p.x+Phaser.Math.Between(-45,45),y:p.y-Phaser.Math.Between(25,80),alpha:0,scale:1.8,duration:Phaser.Math.Between(350,650),onComplete:()=>p.destroy()});}this.tweens.add({targets:e,alpha:0,scaleX:1.5,scaleY:.4,duration:240,onComplete:()=>e.destroy()});}
  updateEnemies(time){this.enemies.getChildren().forEach(e=>{if(e.dead)return;e.hpBg.setPosition(e.x,e.y-55);e.hpBar.setPosition(e.x-28,e.y-55);e.hpBar.width=56*Math.max(0,e.health/GAMEPLAY.enemyMaxHealth);if(time<e.hitUntil)return;const dx=this.player.x-e.x,dy=Math.abs(this.player.y-e.y);if(Math.abs(dx)<GAMEPLAY.enemyAggroRange&&dy<100){if(Math.abs(dx)>GAMEPLAY.enemyAttackRange)e.body.setVelocityX(Math.sign(dx)*GAMEPLAY.enemySpeed);else{e.body.setVelocityX(0);if(time-e.lastAttack>GAMEPLAY.enemyAttackCooldown){e.lastAttack=time;this.enemyAttack(e,time);}}}else e.body.setVelocityX(0);});}
  enemyAttack(e,time){e.setScale(1.12,1);this.time.delayedCall(100,()=>{if(!e.dead)e.setScale(1);});if(time-this.lastPlayerHit<GAMEPLAY.playerInvulnerability)return;if(Phaser.Math.Distance.Between(e.x,e.y,this.player.x,this.player.y)<105){this.lastPlayerHit=time;this.playerHealth=Math.max(0,this.playerHealth-GAMEPLAY.enemyAttackDamage);this.player.setTint(0xff7c9d);this.player.setVelocityX(Math.sign(this.player.x-e.x)*280);this.cameras.main.shake(90,.006);this.time.delayedCall(180,()=>this.player.clearTint());if(this.playerHealth<=0)this.resetPlayer();}}
  resetPlayer(){this.playerHealth=GAMEPLAY.playerMaxHealth;this.player.setPosition(180,430);this.player.setVelocity(0);this.player.clearTint();this.comboText.setText('RECOVER!');this.time.delayedCall(800,()=>this.comboText.setText(''));}
  updateHUD(){this.healthBar.width=266*(this.playerHealth/GAMEPLAY.playerMaxHealth);this.healthText.setText(`RUMI  ${this.playerHealth} / ${GAMEPLAY.playerMaxHealth}`);}
}
