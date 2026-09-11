import Phaser from 'phaser';
import { GAMEPLAY } from '../config/gameplay.js';
import TouchControls from '../ui/TouchControls.js';

export default class GameScene extends Phaser.Scene {
  constructor(){super('Game');}
  init(data){this.characterId=data?.character||'rumi';this.hunter=GAMEPLAY.hunters[this.characterId]||GAMEPLAY.hunters.rumi;}

  create(){
    this.cameras.main.setBackgroundColor('#100b2d');this.physics.world.setBounds(0,0,GAMEPLAY.worldWidth,720);
    for(let i=0;i<28;i++){const x=i*170,h=Phaser.Math.Between(150,420);this.add.rectangle(x,720-h/2,150,h,0x1a1740).setOrigin(0,.5);}
    this.add.circle(950,125,65,0xe7dfff,.85).setScrollFactor(.12);this.add.text(620,75,'SEOUL // HUNTR/X SYNC TEST',{fontFamily:'system-ui',fontSize:'22px',color:'#bba7ff'}).setScrollFactor(.35);

    this.platforms=this.physics.add.staticGroup();
    const platform=(x,y,w,h=40)=>{const r=this.add.rectangle(x,y,w,h,0x33265d).setStrokeStyle(3,0x66508f);this.physics.add.existing(r,true);this.platforms.add(r);};
    platform(500,560,1000);platform(1250,520,360);platform(1660,455,330);platform(2050,540,360);platform(2500,465,420);platform(3010,530,450);platform(3540,440,400);platform(4020,550,360);

    this.player=this.physics.add.sprite(180,430,this.hunter.texture).setCollideWorldBounds(false);
    this.player.body.setSize(Math.max(34,this.player.width-4),Math.max(72,this.player.height-4));
    this.physics.add.collider(this.player,this.platforms);

    this.playerHealth=this.hunter.health;this.lastPlayerHit=-9999;this.lastFacing=1;this.lastDodge=-9999;this.isAttacking=false;this.comboStep=0;this.lastAttack=-9999;
    this.sync=0;this.maxSync=100;this.supportIndex=0;
    this.isRespawning=false;this.lastSafeX=180;this.lastSafeY=430;

    this.enemies=this.physics.add.group();[720,1420,2130,2730,3290,3900].forEach((x,i)=>this.spawnEnemy(x,i%2?360:420));this.physics.add.collider(this.enemies,this.platforms);
    this.cursors=this.input.keyboard.createCursorKeys();this.keys=this.input.keyboard.addKeys('A,D,W,SPACE,J,K,L');this.touch=new TouchControls(this);
    this.cameras.main.setBounds(0,0,GAMEPLAY.worldWidth,720);this.cameras.main.startFollow(this.player,true,.09,.09,260,0);

    this.add.rectangle(175,48,270,28,0x140d24,.9).setScrollFactor(0).setDepth(120).setStrokeStyle(2,0xffffff,.35);
    this.healthBar=this.add.rectangle(42,48,266,22,this.hunter.accent).setOrigin(0,.5).setScrollFactor(0).setDepth(121);
    this.healthText=this.add.text(175,48,`${this.hunter.name}  ${this.playerHealth} / ${this.hunter.health}`,{fontFamily:'system-ui',fontSize:'16px',fontStyle:'bold',color:'#fff'}).setOrigin(.5).setScrollFactor(0).setDepth(122);
    this.comboText=this.add.text(780,46,'',{fontFamily:'system-ui',fontSize:'22px',fontStyle:'bold',color:'#f8d8ff'}).setOrigin(.5).setScrollFactor(0).setDepth(122);
    this.styleText=this.add.text(1320,48,this.hunter.role,{fontFamily:'system-ui',fontSize:'17px',fontStyle:'bold',color:'#d6c9ef'}).setOrigin(.5).setScrollFactor(0).setDepth(122);

    this.add.rectangle(780,92,330,24,0x140d24,.92).setScrollFactor(0).setDepth(120).setStrokeStyle(2,0xd8baff,.45);
    this.syncBar=this.add.rectangle(617,92,326,17,0xd26cff).setOrigin(0,.5).setScrollFactor(0).setDepth(121);
    this.syncText=this.add.text(780,92,'SYNC 0%  •  build with hits',{fontFamily:'system-ui',fontSize:'14px',fontStyle:'bold',color:'#fff'}).setOrigin(.5).setScrollFactor(0).setDepth(122);
  }

  spawnEnemy(x,y){
    const e=this.add.rectangle(x,y,48,76,0x271a35).setStrokeStyle(4,0x8d5b91);this.physics.add.existing(e);e.body.setSize(48,76);e.health=GAMEPLAY.enemyMaxHealth;e.lastAttack=-9999;e.dead=false;e.hitUntil=0;this.enemies.add(e);
    e.hpBg=this.add.rectangle(x,y-55,58,8,0x160e20).setDepth(30);e.hpBar=this.add.rectangle(x-28,y-55,56,5,0xc25c86).setOrigin(0,.5).setDepth(31);
  }

  update(time){
    if(this.isRespawning){this.updateHUD();return;}

    const grounded=this.player.body.blocked.down||this.player.body.touching.down;
    if(grounded){this.lastSafeX=this.player.x;this.lastSafeY=this.player.y;}
    if(this.player.y>790){this.handleFall();this.updateHUD();return;}

    const kb=(this.cursors.left.isDown||this.keys.A.isDown?-1:0)+(this.cursors.right.isDown||this.keys.D.isDown?1:0),axis=kb||this.touch.axis;
    if(axis){this.lastFacing=Math.sign(axis);this.player.setVelocityX(axis*this.hunter.moveSpeed);}else if(grounded&&!this.isAttacking)this.player.setVelocityX(0);

    const jump=Phaser.Input.Keyboard.JustDown(this.cursors.up)||Phaser.Input.Keyboard.JustDown(this.keys.W)||Phaser.Input.Keyboard.JustDown(this.keys.SPACE)||this.touch.consume('jump');
    if(jump&&grounded)this.player.setVelocityY(-GAMEPLAY.jumpSpeed);

    const dodge=Phaser.Input.Keyboard.JustDown(this.keys.K)||this.touch.consume('dodge');
    if(dodge&&time-this.lastDodge>=GAMEPLAY.dodgeCooldown){this.lastDodge=time;this.isAttacking=false;this.player.setVelocityX(this.lastFacing*this.hunter.dodgeSpeed);this.player.setAlpha(.5);this.time.delayedCall(GAMEPLAY.dodgeDuration,()=>this.player.setAlpha(1));}

    if((Phaser.Input.Keyboard.JustDown(this.keys.J)||this.touch.consume('attack'))&&!this.isAttacking)this.performAttack(time);
    if(Phaser.Input.Keyboard.JustDown(this.keys.L)||this.touch.consume('sync'))this.useSync();

    this.updateEnemies(time);this.updateHUD();
  }

  handleFall(){
    if(this.isRespawning)return;
    this.isRespawning=true;this.isAttacking=false;this.player.setVelocity(0);
    this.playerHealth=Math.max(0,this.playerHealth-GAMEPLAY.fallDamage);
    this.sync=Math.max(0,this.sync-GAMEPLAY.fallSyncLoss);
    this.flashSyncLabel(`FALL!  -${GAMEPLAY.fallDamage} HP`);
    this.cameras.main.shake(160,.007);this.cameras.main.fadeOut(230,10,6,25);

    this.time.delayedCall(260,()=>{
      if(this.playerHealth<=0){
        this.resetPlayer();
      }else{
        this.player.setPosition(this.lastSafeX,this.lastSafeY-18);this.player.setVelocity(0);this.player.setAlpha(.6);
        this.lastPlayerHit=this.time.now;this.cameras.main.fadeIn(260,10,6,25);
        this.time.delayedCall(360,()=>{this.player.setAlpha(1);this.isRespawning=false;});
      }
    });
  }

  performAttack(time){
    if(time-this.lastAttack>this.hunter.comboReset)this.comboStep=0;else this.comboStep=(this.comboStep+1)%3;this.lastAttack=time;const step=this.comboStep;this.isAttacking=true;
    if(Math.abs(this.player.body.velocity.x)<80)this.player.setVelocityX(this.lastFacing*(step===2?105:55));
    const reach=this.hunter.attackReach[step],duration=this.hunter.attackDuration[step],damage=this.hunter.attackDamage[step];
    if(this.characterId==='zoey'&&step===2)this.fireZoeyProjectile(damage+8);else this.doMeleeAttack(reach,damage,step,duration);
    this.comboText.setText(step===0?'STRIKE':step===1?'STRIKE ×2':this.characterId==='zoey'?'SHIN-KALA THROW!':'FINISHER!');
    this.time.delayedCall(duration,()=>this.isAttacking=false);this.time.delayedCall(650,()=>{if(time===this.lastAttack)this.comboText.setText('');});
  }

  doMeleeAttack(reach,damage,step,duration){
    const hitX=this.player.x+this.lastFacing*(42+reach/2),height=this.characterId==='mira'?48:68;
    const slash=this.add.rectangle(hitX,this.player.y-4,reach,height,this.hunter.accent,.24).setDepth(25);slash.setStrokeStyle(step===2?6:4,this.hunter.accent,.9);
    this.tweens.add({targets:slash,alpha:0,scaleX:1.18,duration,onComplete:()=>slash.destroy()});
    this.enemies.getChildren().forEach(e=>{if(e.dead)return;const dx=e.x-this.player.x,inFront=Math.sign(dx)===this.lastFacing||Math.abs(dx)<30;if(inFront&&Math.abs(dx)<=reach+48&&Math.abs(e.y-this.player.y)<85)this.hitEnemy(e,damage,step,true);});
  }

  fireZoeyProjectile(damage){
    const blade=this.add.rectangle(this.player.x+this.lastFacing*55,this.player.y-8,34,10,this.hunter.accent,.95).setDepth(28);this.physics.add.existing(blade);blade.body.allowGravity=false;blade.body.setVelocityX(this.lastFacing*760);blade.hit=false;
    const overlap=this.physics.add.overlap(blade,this.enemies,(b,e)=>{if(b.hit||e.dead)return;b.hit=true;this.hitEnemy(e,damage,2,true);overlap.destroy();b.destroy();});
    this.time.delayedCall(750,()=>{if(blade.active){overlap.destroy();blade.destroy();}});
  }

  gainSync(amount){this.sync=Phaser.Math.Clamp(this.sync+amount,0,this.maxSync);}

  useSync(){
    if(this.sync<25){this.flashSyncLabel('BUILD SYNC WITH HITS');return;}
    if(this.sync>=100){this.fullSync();this.sync=0;return;}
    if(this.sync>=60){this.duoCombo();this.sync-=60;return;}
    this.supportAttack();this.sync-=25;
  }

  otherHunters(){return ['rumi','mira','zoey'].filter(id=>id!==this.characterId);}

  supportAttack(){
    const ids=this.otherHunters(),supportId=ids[this.supportIndex%ids.length];this.supportIndex++;
    const support=GAMEPLAY.hunters[supportId];this.flashSyncLabel(`${support.name} SUPPORT!`);
    const ghost=this.add.image(this.player.x-this.lastFacing*62,this.player.y,support.texture).setDepth(24).setAlpha(.92);
    this.tweens.add({targets:ghost,x:ghost.x+this.lastFacing*145,duration:420,ease:'Power2',onComplete:()=>this.tweens.add({targets:ghost,alpha:0,duration:260,onComplete:()=>ghost.destroy()})});
    const reach=supportId==='mira'?230:supportId==='zoey'?170:155,damage=supportId==='mira'?34:supportId==='zoey'?27:30;
    const fx=this.add.rectangle(this.player.x+this.lastFacing*reach*.55,this.player.y-5,reach,72,support.accent,.22).setDepth(23).setStrokeStyle(5,support.accent,.8);
    this.tweens.add({targets:fx,alpha:0,scaleX:1.2,duration:560,onComplete:()=>fx.destroy()});
    this.damageEnemiesNear(this.player.x+this.lastFacing*reach*.5,this.player.y,reach*.7,100,damage,2);
  }

  duoCombo(){
    const ids=this.otherHunters(),supportId=ids[this.supportIndex%ids.length];this.supportIndex++;
    const support=GAMEPLAY.hunters[supportId];this.flashSyncLabel(`${this.hunter.name} + ${support.name}  DUO COMBO!`);
    const ally=this.add.image(this.player.x-this.lastFacing*75,this.player.y,support.texture).setDepth(24).setAlpha(.95);
    this.tweens.add({targets:ally,x:ally.x+this.lastFacing*190,duration:560,ease:'Power2'});
    const ring=this.add.circle(this.player.x+this.lastFacing*90,this.player.y,70,this.hunter.accent,.12).setDepth(22).setStrokeStyle(7,support.accent,.85);
    this.tweens.add({targets:ring,scale:2.6,alpha:0,duration:780,onComplete:()=>ring.destroy()});
    this.damageEnemiesNear(this.player.x+this.lastFacing*120,this.player.y,260,125,58,2);
    this.cameras.main.shake(190,.005);
    this.time.delayedCall(720,()=>this.tweens.add({targets:ally,alpha:0,duration:220,onComplete:()=>ally.destroy()}));
  }

  fullSync(){
    this.flashSyncLabel('FULL HUNTR/X SYNC!');
    const ids=['rumi','mira','zoey'],offsets=[-95,0,95],echoes=[];
    ids.forEach((id,i)=>{
      const h=GAMEPLAY.hunters[id];
      const img=this.add.image(this.player.x+offsets[i],this.player.y-(i===1?8:0),h.texture).setDepth(27).setAlpha(.98);echoes.push(img);
      const beam=this.add.rectangle(this.player.x+this.lastFacing*(120+i*70),this.player.y+(i-1)*34,250+i*75,20,h.accent,.5).setDepth(25).setAngle((i-1)*8);
      this.tweens.add({targets:beam,scaleX:1.65,alpha:0,duration:800+i*90,onComplete:()=>beam.destroy()});
    });
    const pulse=this.add.circle(this.player.x,this.player.y,80,0xffffff,.08).setDepth(24).setStrokeStyle(9,0xffa5f0,.9);
    this.tweens.add({targets:pulse,scale:4.6,alpha:0,duration:1150,onComplete:()=>pulse.destroy()});
    this.enemies.getChildren().forEach(e=>{if(!e.dead&&Math.abs(e.x-this.player.x)<520&&Math.abs(e.y-this.player.y)<190)this.hitEnemy(e,95,2,false);});
    this.cameras.main.shake(420,.009);
    this.time.delayedCall(900,()=>echoes.forEach(img=>this.tweens.add({targets:img,alpha:0,duration:280,onComplete:()=>img.destroy()})));
  }

  damageEnemiesNear(x,y,halfW,halfH,damage,step){this.enemies.getChildren().forEach(e=>{if(!e.dead&&Math.abs(e.x-x)<=halfW&&Math.abs(e.y-y)<=halfH)this.hitEnemy(e,damage,step,false);});}

  flashSyncLabel(text){
    this.comboText.setText(text).setScale(1.08);this.tweens.add({targets:this.comboText,scale:1,duration:220});
    this.time.delayedCall(1200,()=>{if(this.comboText.text===text)this.comboText.setText('');});
  }

  hitEnemy(e,damage,step,buildSync=false){
    e.health-=damage;e.hitUntil=this.time.now+170;e.setFillStyle(0x7d5a86);e.body.setVelocityX(this.lastFacing*(step===2?360:210));
    if(buildSync)this.gainSync(step===2?GAMEPLAY.syncFinisherGain:GAMEPLAY.syncHitGain);
    this.cameras.main.shake(step===2?70:40,step===2?.004:.002);this.time.delayedCall(90,()=>{if(!e.dead)e.setFillStyle(0x271a35);});if(e.health<=0)this.killEnemy(e);
  }

  killEnemy(e){
    e.dead=true;e.body.enable=false;e.hpBg.destroy();e.hpBar.destroy();
    for(let i=0;i<7;i++){const p=this.add.circle(e.x+Phaser.Math.Between(-18,18),e.y+Phaser.Math.Between(-28,28),Phaser.Math.Between(8,18),0x5a426a,.55).setDepth(20);this.tweens.add({targets:p,x:p.x+Phaser.Math.Between(-45,45),y:p.y-Phaser.Math.Between(25,80),alpha:0,scale:1.8,duration:Phaser.Math.Between(350,650),onComplete:()=>p.destroy()});}
    this.tweens.add({targets:e,alpha:0,scaleX:1.5,scaleY:.4,duration:240,onComplete:()=>e.destroy()});
  }

  updateEnemies(time){
    this.enemies.getChildren().forEach(e=>{
      if(e.dead)return;e.hpBg.setPosition(e.x,e.y-55);e.hpBar.setPosition(e.x-28,e.y-55);e.hpBar.width=56*Math.max(0,e.health/GAMEPLAY.enemyMaxHealth);if(time<e.hitUntil)return;
      const dx=this.player.x-e.x,dy=Math.abs(this.player.y-e.y);
      if(Math.abs(dx)<GAMEPLAY.enemyAggroRange&&dy<100){if(Math.abs(dx)>GAMEPLAY.enemyAttackRange)e.body.setVelocityX(Math.sign(dx)*GAMEPLAY.enemySpeed);else{e.body.setVelocityX(0);if(time-e.lastAttack>GAMEPLAY.enemyAttackCooldown){e.lastAttack=time;this.enemyAttack(e,time);}}}else e.body.setVelocityX(0);
    });
  }

  enemyAttack(e,time){
    e.setScale(1.12,1);this.time.delayedCall(100,()=>{if(!e.dead)e.setScale(1);});
    if(time-this.lastPlayerHit<GAMEPLAY.playerInvulnerability)return;
    if(Phaser.Math.Distance.Between(e.x,e.y,this.player.x,this.player.y)<105){
      this.lastPlayerHit=time;this.playerHealth=Math.max(0,this.playerHealth-GAMEPLAY.enemyAttackDamage);this.player.setTint(0xff7c9d);this.player.setVelocityX(Math.sign(this.player.x-e.x)*280);this.cameras.main.shake(90,.006);this.time.delayedCall(180,()=>this.player.clearTint());if(this.playerHealth<=0)this.resetPlayer();
    }
  }

  resetPlayer(){
    this.playerHealth=this.hunter.health;this.player.setPosition(180,430);this.player.setVelocity(0);this.player.clearTint();this.sync=0;this.lastSafeX=180;this.lastSafeY=430;this.cameras.main.fadeIn(260,10,6,25);this.comboText.setText('RECOVER!');
    this.time.delayedCall(700,()=>{this.isRespawning=false;this.comboText.setText('');});
  }

  updateHUD(){
    this.healthBar.width=266*(this.playerHealth/this.hunter.health);this.healthText.setText(`${this.hunter.name}  ${this.playerHealth} / ${this.hunter.health}`);
    this.syncBar.width=326*(this.sync/this.maxSync);
    const tier=this.sync>=100?'FULL SYNC READY':this.sync>=60?'DUO READY':this.sync>=25?'SUPPORT READY':'build with hits';
    this.syncText.setText(`SYNC ${Math.floor(this.sync)}%  •  ${tier}`);
  }
}
