import Phaser from 'phaser';
import { GAMEPLAY } from '../config/gameplay.js';
import TouchControls from '../ui/TouchControls.js';

export default class GameScene extends Phaser.Scene {
  constructor(){super('Game');}
  init(data){this.characterId=data?.character||'rumi';this.hunter=GAMEPLAY.hunters[this.characterId]||GAMEPLAY.hunters.rumi;}

  create(){
    this.cameras.main.setBackgroundColor('#100b2d');
    this.physics.world.setBounds(0,0,GAMEPLAY.worldWidth,720);

    for(let i=0;i<62;i++){
      const x=i*155,h=Phaser.Math.Between(150,430);
      this.add.rectangle(x,720-h/2,138,h,0x1a1740).setOrigin(0,.5);
    }
    this.add.circle(950,125,65,0xe7dfff,.85).setScrollFactor(.12);
    this.add.text(620,75,'SEOUL // DEMON DISTRICT',{fontFamily:'system-ui',fontSize:'22px',color:'#bba7ff'}).setScrollFactor(.35);

    this.platforms=this.physics.add.staticGroup();
    this.platformSpecs=[
      [500,560,1000,40],[1250,520,360,40],[1660,455,330,40],[2050,540,360,40],[2500,465,420,40],
      [3010,530,450,40],[3540,440,400,40],[4020,550,360,40],[4480,500,460,40],[5000,430,380,40],
      [5480,540,520,40],[6080,470,430,40],[6610,530,420,40],[7160,455,430,40],
      [7500,500,260,40],[8350,540,1400,40]
    ];
    const platform=(x,y,w,h=40)=>{
      const r=this.add.rectangle(x,y,w,h,0x33265d).setStrokeStyle(3,0x66508f);
      this.physics.add.existing(r,true);this.platforms.add(r);
    };
    this.platformSpecs.forEach(p=>platform(...p));

    this.add.rectangle(8350,514,1400,10,0x8b527d,.28).setDepth(2);
    this.add.text(8350,460,'DREAD CAPTAIN ARENA',{fontFamily:'system-ui',fontSize:'18px',fontStyle:'bold',color:'#845f91'}).setOrigin(.5).setAlpha(.65);

    this.player=this.physics.add.sprite(180,430,this.hunter.texture).setCollideWorldBounds(false);
    this.player.body.setSize(Math.max(34,this.player.width-4),Math.max(72,this.player.height-4));
    this.physics.add.collider(this.player,this.platforms);

    this.playerHealth=this.hunter.health;
    this.lastPlayerHit=-9999;this.lastFacing=1;this.lastDodge=-9999;
    this.dodgeInvulnerableUntil=-9999;
    this.isAttacking=false;this.comboStep=0;this.lastAttack=-9999;
    this.sync=0;this.maxSync=100;this.supportIndex=0;
    this.isRespawning=false;this.isDefeated=false;this.lastSafeX=180;this.lastSafeY=430;
    this.checkpointX=180;this.checkpointY=430;
    this.airDodgeUsed=false;

    this.bossActive=false;this.bossDefeated=false;this.bossGate=null;this.boss=null;

    this.enemies=this.physics.add.group();
    this.projectiles=this.physics.add.group();
    this.physics.add.collider(this.enemies,this.platforms);
    this.physics.add.collider(this.projectiles,this.platforms,p=>p.destroy());
    this.physics.add.overlap(this.player,this.projectiles,(player,p)=>this.hitPlayerFromProjectile(p));

    const encounter=[
      ['grunt',720,420],['grunt',850,420],
      ['grunt',1420,360],['ranged',1600,350],
      ['grunt',2130,420],['brute',2260,410],
      ['grunt',2720,360],['ranged',2860,350],['grunt',3030,410],
      ['brute',3560,390],['ranged',3710,350],['grunt',3860,410],
      ['grunt',4510,390],['grunt',4660,390],['ranged',4840,350],
      ['brute',5480,470],['grunt',5600,470],['ranged',5780,430],
      ['grunt',6120,400],['grunt',6250,400],['brute',6410,420],['ranged',6570,390],
      ['grunt',7050,390],['ranged',7180,350],['grunt',7300,390],
      ['boss',8400,430]
    ];
    encounter.forEach(([type,x,y])=>this.spawnEnemy(type,x,y));

    this.cursors=this.input.keyboard.createCursorKeys();
    this.keys=this.input.keyboard.addKeys('A,D,W,SPACE,J,K,L');
    this.touch=new TouchControls(this);
    this.cameras.main.setBounds(0,0,GAMEPLAY.worldWidth,720);
    this.cameras.main.startFollow(this.player,true,.09,.09,260,0);

    this.add.rectangle(175,48,270,28,0x140d24,.9).setScrollFactor(0).setDepth(120).setStrokeStyle(2,0xffffff,.35);
    this.healthBar=this.add.rectangle(42,48,266,22,this.hunter.accent).setOrigin(0,.5).setScrollFactor(0).setDepth(121);
    this.healthText=this.add.text(175,48,`${this.hunter.name}  ${this.playerHealth} / ${this.hunter.health}`,{fontFamily:'system-ui',fontSize:'16px',fontStyle:'bold',color:'#fff'}).setOrigin(.5).setScrollFactor(0).setDepth(122);
    this.comboText=this.add.text(780,46,'',{fontFamily:'system-ui',fontSize:'22px',fontStyle:'bold',color:'#f8d8ff'}).setOrigin(.5).setScrollFactor(0).setDepth(122);
    this.styleText=this.add.text(1320,48,this.hunter.role,{fontFamily:'system-ui',fontSize:'17px',fontStyle:'bold',color:'#d6c9ef'}).setOrigin(.5).setScrollFactor(0).setDepth(122);
    this.add.rectangle(780,92,330,24,0x140d24,.92).setScrollFactor(0).setDepth(120).setStrokeStyle(2,0xd8baff,.45);
    this.syncBar=this.add.rectangle(617,92,326,17,0xd26cff).setOrigin(0,.5).setScrollFactor(0).setDepth(121);
    this.syncText=this.add.text(780,92,'SYNC 0%  •  build with hits',{fontFamily:'system-ui',fontSize:'14px',fontStyle:'bold',color:'#fff'}).setOrigin(.5).setScrollFactor(0).setDepth(122);

    this.bossHudBg=this.add.rectangle(780,138,560,27,0x160a18,.92).setScrollFactor(0).setDepth(125).setStrokeStyle(2,0xe087b8,.8).setVisible(false);
    this.bossHudBar=this.add.rectangle(503,138,554,19,0xe087b8,.9).setOrigin(0,.5).setScrollFactor(0).setDepth(126).setVisible(false);
    this.bossHudText=this.add.text(780,138,'DREAD CAPTAIN',{fontFamily:'system-ui',fontSize:'14px',fontStyle:'bold',color:'#fff'}).setOrigin(.5).setScrollFactor(0).setDepth(127).setVisible(false);
  }

  findPlatformAt(x){return this.platformSpecs.find(([px,py,pw])=>x>=px-pw/2&&x<=px+pw/2)||null;}
  findNearestPlatform(x){
    let best=null,bestDistance=Infinity;
    this.platformSpecs.forEach(p=>{const [px,,pw]=p,left=px-pw/2,right=px+pw/2;const d=x<left?left-x:x>right?x-right:0;if(d<bestDistance){bestDistance=d;best=p;}});
    return best;
  }

  spawnEnemy(type,x,y){
    const stats=GAMEPLAY.enemies[type]||GAMEPLAY.enemies.grunt;
    const p=this.findPlatformAt(x)||this.findNearestPlatform(x);
    const [px,py,pw,ph]=p;
    const platformLeft=px-pw/2+stats.width/2+16,platformRight=px+pw/2-stats.width/2-16;
    const spawnX=Phaser.Math.Clamp(x,platformLeft,platformRight),spawnY=py-ph/2-stats.height/2-2;
    const e=this.add.rectangle(spawnX,spawnY,stats.width,stats.height,stats.color).setStrokeStyle(type==='boss'?7:4,stats.outline);
    this.physics.add.existing(e);e.body.setSize(stats.width,stats.height);
    e.type=type;e.stats=stats;e.health=stats.health;e.maxHealth=stats.health;e.lastAttack=-9999;e.dead=false;e.hitUntil=0;
    e.platformLeft=platformLeft;e.platformRight=platformRight;e.spawnX=spawnX;e.spawnY=spawnY;
    e.actionUntil=0;e.nextSpecial=0;e.specialCycle=0;e.summoned=false;
    this.enemies.add(e);
    e.hpBg=this.add.rectangle(spawnX,spawnY-stats.height/2-16,Math.max(58,stats.width+12),8,0x160e20).setDepth(30);
    e.hpBar=this.add.rectangle(spawnX-Math.max(56,stats.width+10)/2,spawnY-stats.height/2-16,Math.max(56,stats.width+10),5,stats.outline).setOrigin(0,.5).setDepth(31);
    e.label=this.add.text(spawnX,spawnY-stats.height/2-34,stats.name,{fontFamily:'system-ui',fontSize:type==='boss'?'15px':'12px',fontStyle:'bold',color:type==='boss'?'#ffd5ea':'#c9bfd9'}).setOrigin(.5).setDepth(31);
    if(type==='boss'){this.boss=e;e.setAlpha(.75);}
    return e;
  }

  updateCheckpoint(){
    if(this.bossActive||this.player.x<=this.checkpointX+900)return;
    const p=this.findPlatformAt(this.player.x)||this.findNearestPlatform(this.player.x);if(!p)return;
    const [px,py,pw,ph]=p,inset=70;
    this.checkpointX=Phaser.Math.Clamp(this.player.x,px-pw/2+inset,px+pw/2-inset);
    this.checkpointY=py-ph/2-this.player.displayHeight/2-2;
  }

  startBossEncounter(){
    if(this.bossActive||this.bossDefeated||!this.boss||this.boss.dead)return;
    this.bossActive=true;
    this.checkpointX=7820;this.checkpointY=458;this.lastSafeX=this.checkpointX;this.lastSafeY=this.checkpointY;
    this.flashSyncLabel('ENCOUNTER — DREAD CAPTAIN');
    this.cameras.main.shake(260,.006);
    this.boss.setAlpha(1);this.boss.nextSpecial=this.time.now+1800;
    this.bossHudBg.setVisible(true);this.bossHudBar.setVisible(true);this.bossHudText.setVisible(true);
    this.bossGate=this.add.rectangle(GAMEPLAY.bossArena.left+8,345,22,390,0xb55a9b,.48).setDepth(18).setStrokeStyle(3,0xf2b4e1,.8);
    this.physics.add.existing(this.bossGate,true);this.physics.add.collider(this.player,this.bossGate);
    this.tweens.add({targets:this.bossGate,alpha:{from:.2,to:.62},duration:420,yoyo:true,repeat:-1});
    this.cameras.main.setBounds(GAMEPLAY.bossArena.left,0,GAMEPLAY.bossArena.right-GAMEPLAY.bossArena.left,720);
  }

  endBossEncounter(){
    this.bossActive=false;this.bossDefeated=true;
    this.bossHudBg.setVisible(false);this.bossHudBar.setVisible(false);this.bossHudText.setVisible(false);
    if(this.bossGate){this.bossGate.destroy();this.bossGate=null;}
    this.cameras.main.setBounds(0,0,GAMEPLAY.worldWidth,720);
    this.flashSyncLabel('AREA CLEAR — DREAD CAPTAIN DEFEATED!');
  }

  update(time){
    if(this.isRespawning||this.isDefeated){this.updateHUD();return;}
    const grounded=this.player.body.blocked.down||this.player.body.touching.down;
    if(grounded){this.lastSafeX=this.player.x;this.lastSafeY=this.player.y;this.airDodgeUsed=false;this.updateCheckpoint();}
    if(!this.bossActive&&!this.bossDefeated&&this.player.x>=GAMEPLAY.bossArena.entryX)this.startBossEncounter();
    if(this.player.y>790){this.handleFall();this.updateHUD();return;}

    const kb=(this.cursors.left.isDown||this.keys.A.isDown?-1:0)+(this.cursors.right.isDown||this.keys.D.isDown?1:0),axis=kb||this.touch.axis;
    if(axis){this.lastFacing=Math.sign(axis);this.player.setVelocityX(axis*this.hunter.moveSpeed);}else if(grounded&&!this.isAttacking)this.player.setVelocityX(0);
    const jump=Phaser.Input.Keyboard.JustDown(this.cursors.up)||Phaser.Input.Keyboard.JustDown(this.keys.W)||Phaser.Input.Keyboard.JustDown(this.keys.SPACE)||this.touch.consume('jump');
    if(jump&&grounded)this.player.setVelocityY(-GAMEPLAY.jumpSpeed);
    const dodge=Phaser.Input.Keyboard.JustDown(this.keys.K)||this.touch.consume('dodge');
    if(dodge&&time-this.lastDodge>=GAMEPLAY.dodgeCooldown){
      if(!grounded&&this.airDodgeUsed){}
      else{
        this.lastDodge=time;this.isAttacking=false;
        this.dodgeInvulnerableUntil=time+GAMEPLAY.dodgeDuration;
        if(!grounded){
          this.airDodgeUsed=true;
          this.player.setVelocityX(this.lastFacing*this.hunter.dodgeSpeed*.9);
          this.player.setTint(0x9de8ff);
        }else{
          this.player.setVelocityX(this.lastFacing*this.hunter.dodgeSpeed);
          this.player.setTint(0xe7d8ff);
        }
        this.player.setAlpha(.42);
        this.time.delayedCall(GAMEPLAY.dodgeDuration,()=>{this.player.clearTint();this.player.setAlpha(1);});
      }
    }
    if((Phaser.Input.Keyboard.JustDown(this.keys.J)||this.touch.consume('attack'))&&!this.isAttacking)this.performAttack(time);
    if(Phaser.Input.Keyboard.JustDown(this.keys.L)||this.touch.consume('sync'))this.useSync();
    this.updateEnemies(time);this.updateHUD();
  }

  handleFall(){
    if(this.isRespawning||this.isDefeated)return;
    this.isRespawning=true;this.isAttacking=false;this.player.setVelocity(0);
    this.playerHealth=Math.max(0,this.playerHealth-GAMEPLAY.fallDamage);this.sync=Math.max(0,this.sync-GAMEPLAY.fallSyncLoss);
    this.flashSyncLabel(`FALL!  -${GAMEPLAY.fallDamage} HP`);this.cameras.main.shake(160,.007);this.cameras.main.fadeOut(230,10,6,25);
    this.time.delayedCall(260,()=>{
      if(this.playerHealth<=0){this.isRespawning=false;this.handleDefeat('FALL');}
      else{this.player.setPosition(this.lastSafeX,this.lastSafeY-18);this.player.setVelocity(0);this.player.setAlpha(.6);this.lastPlayerHit=this.time.now;this.cameras.main.fadeIn(260,10,6,25);this.time.delayedCall(360,()=>{this.player.setAlpha(1);this.isRespawning=false;});}
    });
  }

  performAttack(time){
    if(time-this.lastAttack>this.hunter.comboReset)this.comboStep=0;else this.comboStep=(this.comboStep+1)%3;
    this.lastAttack=time;const step=this.comboStep;this.isAttacking=true;
    if(Math.abs(this.player.body.velocity.x)<80)this.player.setVelocityX(this.lastFacing*(step===2?105:55));
    const reach=this.hunter.attackReach[step],duration=this.hunter.attackDuration[step],damage=this.hunter.attackDamage[step];
    if(this.characterId==='zoey'&&step===2)this.fireZoeyProjectile(damage+8);else this.doMeleeAttack(reach,damage,step,duration);
    this.comboText.setText(step===0?'STRIKE':step===1?'STRIKE ×2':this.characterId==='zoey'?'SHIN-KALA THROW!':'FINISHER!');
    this.time.delayedCall(duration,()=>this.isAttacking=false);this.time.delayedCall(650,()=>{if(time===this.lastAttack)this.comboText.setText('');});
  }

  doMeleeAttack(reach,damage,step,duration){
    const hitX=this.player.x+this.lastFacing*(42+reach/2),height=this.characterId==='mira'?48:68;
    const slash=this.add.rectangle(hitX,this.player.y-4,reach,height,this.hunter.accent,.24).setDepth(25).setStrokeStyle(step===2?6:4,this.hunter.accent,.9);
    this.tweens.add({targets:slash,alpha:0,scaleX:1.18,duration,onComplete:()=>slash.destroy()});
    this.enemies.getChildren().forEach(e=>{if(e.dead)return;const dx=e.x-this.player.x,inFront=Math.sign(dx)===this.lastFacing||Math.abs(dx)<30;if(inFront&&Math.abs(dx)<=reach+48&&Math.abs(e.y-this.player.y)<110)this.hitEnemy(e,damage,step,true);});
  }

  fireZoeyProjectile(damage){
    const blade=this.add.rectangle(this.player.x+this.lastFacing*55,this.player.y-8,34,10,this.hunter.accent,.95).setDepth(28);
    this.physics.add.existing(blade);blade.body.allowGravity=false;blade.body.setVelocityX(this.lastFacing*760);blade.hit=false;
    const overlap=this.physics.add.overlap(blade,this.enemies,(b,e)=>{if(b.hit||e.dead)return;b.hit=true;this.hitEnemy(e,damage,2,true);overlap.destroy();b.destroy();});
    this.time.delayedCall(750,()=>{if(blade.active){overlap.destroy();blade.destroy();}});
  }

  gainSync(amount){this.sync=Phaser.Math.Clamp(this.sync+amount,0,this.maxSync);}
  useSync(){if(this.sync<25){this.flashSyncLabel('BUILD SYNC WITH HITS');return;}if(this.sync>=100){this.fullSync();this.sync=0;return;}if(this.sync>=60){this.duoCombo();this.sync-=60;return;}this.supportAttack();this.sync-=25;}
  otherHunters(){return ['rumi','mira','zoey'].filter(id=>id!==this.characterId);}

  supportAttack(){
    const ids=this.otherHunters(),supportId=ids[this.supportIndex%ids.length];this.supportIndex++;const support=GAMEPLAY.hunters[supportId];this.flashSyncLabel(`${support.name} SUPPORT!`);
    const ghost=this.add.image(this.player.x-this.lastFacing*62,this.player.y,support.texture).setDepth(24).setAlpha(.92);
    this.tweens.add({targets:ghost,x:ghost.x+this.lastFacing*145,duration:420,ease:'Power2',onComplete:()=>this.tweens.add({targets:ghost,alpha:0,duration:260,onComplete:()=>ghost.destroy()})});
    const reach=supportId==='mira'?230:supportId==='zoey'?170:155,damage=supportId==='mira'?34:supportId==='zoey'?27:30;
    const fx=this.add.rectangle(this.player.x+this.lastFacing*reach*.55,this.player.y-5,reach,72,support.accent,.22).setDepth(23).setStrokeStyle(5,support.accent,.8);
    this.tweens.add({targets:fx,alpha:0,scaleX:1.2,duration:560,onComplete:()=>fx.destroy()});this.damageEnemiesNear(this.player.x+this.lastFacing*reach*.5,this.player.y,reach*.7,110,damage,2);
  }

  duoCombo(){
    const ids=this.otherHunters(),supportId=ids[this.supportIndex%ids.length];this.supportIndex++;const support=GAMEPLAY.hunters[supportId];this.flashSyncLabel(`${this.hunter.name} + ${support.name}  DUO COMBO!`);
    const ally=this.add.image(this.player.x-this.lastFacing*75,this.player.y,support.texture).setDepth(24).setAlpha(.95);this.tweens.add({targets:ally,x:ally.x+this.lastFacing*190,duration:560,ease:'Power2'});
    const ring=this.add.circle(this.player.x+this.lastFacing*90,this.player.y,70,this.hunter.accent,.12).setDepth(22).setStrokeStyle(7,support.accent,.85);this.tweens.add({targets:ring,scale:2.6,alpha:0,duration:780,onComplete:()=>ring.destroy()});
    this.damageEnemiesNear(this.player.x+this.lastFacing*120,this.player.y,260,140,58,2);this.cameras.main.shake(190,.005);this.time.delayedCall(720,()=>this.tweens.add({targets:ally,alpha:0,duration:220,onComplete:()=>ally.destroy()}));
  }

  fullSync(){
    this.flashSyncLabel('FULL HUNTR/X SYNC!');const ids=['rumi','mira','zoey'],offsets=[-95,0,95],echoes=[];
    ids.forEach((id,i)=>{const h=GAMEPLAY.hunters[id],img=this.add.image(this.player.x+offsets[i],this.player.y-(i===1?8:0),h.texture).setDepth(27).setAlpha(.98);echoes.push(img);const beam=this.add.rectangle(this.player.x+this.lastFacing*(120+i*70),this.player.y+(i-1)*34,250+i*75,20,h.accent,.5).setDepth(25).setAngle((i-1)*8);this.tweens.add({targets:beam,scaleX:1.65,alpha:0,duration:800+i*90,onComplete:()=>beam.destroy()});});
    const pulse=this.add.circle(this.player.x,this.player.y,80,0xffffff,.08).setDepth(24).setStrokeStyle(9,0xffa5f0,.9);this.tweens.add({targets:pulse,scale:4.6,alpha:0,duration:1150,onComplete:()=>pulse.destroy()});
    this.enemies.getChildren().forEach(e=>{if(!e.dead&&Math.abs(e.x-this.player.x)<560&&Math.abs(e.y-this.player.y)<210)this.hitEnemy(e,95,2,false);});this.cameras.main.shake(420,.009);this.time.delayedCall(900,()=>echoes.forEach(img=>this.tweens.add({targets:img,alpha:0,duration:280,onComplete:()=>img.destroy()})));
  }

  damageEnemiesNear(x,y,halfW,halfH,damage,step){this.enemies.getChildren().forEach(e=>{if(!e.dead&&Math.abs(e.x-x)<=halfW&&Math.abs(e.y-y)<=halfH)this.hitEnemy(e,damage,step,false);});}
  flashSyncLabel(text){this.comboText.setText(text).setScale(1.08);this.tweens.add({targets:this.comboText,scale:1,duration:220});this.time.delayedCall(1200,()=>{if(this.comboText.text===text)this.comboText.setText('');});}

  hitEnemy(e,damage,step,buildSync=false){
    e.health-=damage;e.hitUntil=this.time.now+(e.type==='boss'?100:170);e.setFillStyle(0x7d5a86);
    e.body.setVelocityX(this.lastFacing*(e.type==='boss'?(step===2?120:55):(step===2?360:210)));
    if(buildSync)this.gainSync(step===2?GAMEPLAY.syncFinisherGain:GAMEPLAY.syncHitGain);
    this.cameras.main.shake(step===2?70:40,step===2?.004:.002);this.time.delayedCall(90,()=>{if(!e.dead)e.setFillStyle(e.stats.color);});if(e.health<=0)this.killEnemy(e);
  }

  killEnemy(e){
    const wasBoss=e.type==='boss';e.dead=true;e.body.enable=false;e.hpBg.destroy();e.hpBar.destroy();e.label.destroy();
    for(let i=0;i<(wasBoss?16:7);i++){const p=this.add.circle(e.x+Phaser.Math.Between(-24,24),e.y+Phaser.Math.Between(-36,36),Phaser.Math.Between(8,20),wasBoss?0x8b456d:0x5a426a,.6).setDepth(20);this.tweens.add({targets:p,x:p.x+Phaser.Math.Between(-55,55),y:p.y-Phaser.Math.Between(25,95),alpha:0,scale:1.8,duration:Phaser.Math.Between(450,800),onComplete:()=>p.destroy()});}
    this.tweens.add({targets:e,alpha:0,scaleX:1.5,scaleY:.4,duration:wasBoss?420:240,onComplete:()=>e.destroy()});
    if(wasBoss){this.cameras.main.shake(420,.008);this.endBossEncounter();}
  }

  keepEnemyOnPlatform(e,velocityX){
    if(e.y>720){e.setPosition(e.spawnX,e.spawnY);e.body.setVelocity(0);return 0;}
    if(e.x<e.platformLeft){e.x=e.platformLeft;e.body.setVelocityX(0);return Math.max(0,velocityX);}
    if(e.x>e.platformRight){e.x=e.platformRight;e.body.setVelocityX(0);return Math.min(0,velocityX);}
    if(velocityX<0&&e.x<=e.platformLeft+12)return 0;if(velocityX>0&&e.x>=e.platformRight-12)return 0;return velocityX;
  }

  updateEnemies(time){
    this.enemies.getChildren().forEach(e=>{
      if(e.dead)return;const top=e.y-e.stats.height/2;e.hpBg.setPosition(e.x,top-16);e.label.setPosition(e.x,top-34);const w=Math.max(56,e.stats.width+10);e.hpBar.setPosition(e.x-w/2,top-16);e.hpBar.width=w*Math.max(0,e.health/e.maxHealth);
      if(e.type==='boss'){this.updateBoss(e,time);return;}
      if(e.y>720){this.keepEnemyOnPlatform(e,0);return;}if(time<e.hitUntil){e.body.setVelocityX(this.keepEnemyOnPlatform(e,e.body.velocity.x));return;}
      const dx=this.player.x-e.x,dy=Math.abs(this.player.y-e.y),dist=Math.abs(dx);if(dist>GAMEPLAY.enemyAggroRange||dy>150){e.body.setVelocityX(0);return;}
      let desired=0;
      if(e.type==='ranged'){if(dist<190)desired=-Math.sign(dx)*e.stats.speed;else if(dist>e.stats.range)desired=Math.sign(dx)*e.stats.speed;desired=this.keepEnemyOnPlatform(e,desired);e.body.setVelocityX(desired);if(dist<=e.stats.range&&time-e.lastAttack>e.stats.cooldown){e.lastAttack=time;this.fireWraithShot(e);}return;}
      if(dist>e.stats.range)desired=Math.sign(dx)*e.stats.speed;desired=this.keepEnemyOnPlatform(e,desired);e.body.setVelocityX(desired);if(dist<=e.stats.range&&time-e.lastAttack>e.stats.cooldown){e.lastAttack=time;this.enemyMeleeAttack(e,time);}
    });
  }

  updateBoss(e,time){
    if(!this.bossActive||e.dead){e.body.setVelocityX(0);return;}
    this.bossHudBar.width=554*Math.max(0,e.health/e.maxHealth);
    if(e.y>720){this.keepEnemyOnPlatform(e,0);return;}
    if(time<e.hitUntil||time<e.actionUntil)return;

    const ratio=e.health/e.maxHealth,dx=this.player.x-e.x,dist=Math.abs(dx);
    if(!e.summoned&&ratio<=e.stats.summonAt){e.summoned=true;this.bossSummon(e);return;}
    if(time>=e.nextSpecial){
      e.specialCycle++;
      if(e.specialCycle%2===1)this.bossCharge(e);else this.bossSlam(e);
      e.nextSpecial=time+2600;return;
    }
    const desired=dist>e.stats.range?Math.sign(dx)*e.stats.speed:0;e.body.setVelocityX(this.keepEnemyOnPlatform(e,desired));
    if(dist<=e.stats.range&&time-e.lastAttack>e.stats.cooldown){e.lastAttack=time;this.enemyMeleeAttack(e,time);}
  }

  bossCharge(e){
    e.actionUntil=this.time.now+1150;e.body.setVelocityX(0);const dir=Math.sign(this.player.x-e.x)||1;
    const available=dir>0?e.platformRight-e.x:e.x-e.platformLeft,travel=Math.min(520,Math.max(180,available));
    const warningX=e.x+dir*travel/2;
    const warn=this.add.rectangle(warningX,e.y+42,travel,18,0xe087b8,.2).setDepth(21).setStrokeStyle(3,0xffbbdf,.75);
    this.tweens.add({targets:warn,alpha:.65,duration:180,yoyo:true,repeat:1});this.flashSyncLabel('DREAD CHARGE!');
    this.time.delayedCall(430,()=>{
      if(e.dead)return;warn.destroy();const start=e.x,target=Phaser.Math.Clamp(e.x+dir*travel,e.platformLeft,e.platformRight);
      this.tweens.add({targets:e,x:target,duration:360,ease:'Cubic.In',onUpdate:()=>{if(e.body)e.body.updateFromGameObject();},onComplete:()=>{if(e.body)e.body.setVelocityX(0);}});
      if(this.player.y>e.y-115&&this.player.x>=Math.min(start,target)-30&&this.player.x<=Math.max(start,target)+30)this.damagePlayer(e.stats.chargeDamage,dir*430);
      this.cameras.main.shake(220,.009);
    });
  }

  bossSlam(e){
    e.actionUntil=this.time.now+1200;e.body.setVelocityX(0);this.flashSyncLabel('DREAD SLAM — JUMP OR DODGE!');
    const ring=this.add.circle(e.x,e.y+45,55,0xe087b8,.12).setDepth(21).setStrokeStyle(7,0xffb8dd,.8);
    this.tweens.add({targets:ring,scale:4.8,alpha:.5,duration:560,ease:'Quad.Out'});
    this.time.delayedCall(570,()=>{
      if(e.dead){ring.destroy();return;}this.cameras.main.shake(330,.012);
      const close=Math.abs(this.player.x-e.x)<300,lowEnough=this.player.y>e.y-145;
      if(close&&lowEnough)this.damagePlayer(e.stats.slamDamage,Math.sign(this.player.x-e.x)*320);
      this.tweens.add({targets:ring,alpha:0,scale:5.4,duration:260,onComplete:()=>ring.destroy()});
    });
  }

  bossSummon(e){
    e.actionUntil=this.time.now+1700;e.body.setVelocityX(0);this.flashSyncLabel('DREAD CAPTAIN SUMMONS WRAITHS!');
    const aura=this.add.circle(e.x,e.y,80,0x92547e,.15).setDepth(20).setStrokeStyle(8,0xd18ab4,.8);this.tweens.add({targets:aura,scale:2.2,alpha:0,duration:1200,onComplete:()=>aura.destroy()});
    this.time.delayedCall(650,()=>{if(!e.dead){this.spawnEnemy('ranged',7950,430);this.spawnEnemy('ranged',8820,430);}});
  }

  enemyMeleeAttack(e,time){
    e.setScale(e.type==='boss'?1.24:e.type==='brute'?1.18:1.12,1);this.time.delayedCall(e.type==='boss'?180:120,()=>{if(!e.dead)e.setScale(1);});
    if(time-this.lastPlayerHit<GAMEPLAY.playerInvulnerability)return;if(Phaser.Math.Distance.Between(e.x,e.y,this.player.x,this.player.y)<e.stats.range+35)this.damagePlayer(e.stats.damage,Math.sign(this.player.x-e.x)*(e.type==='boss'?380:300));
  }

  fireWraithShot(e){
    const dir=Math.sign(this.player.x-e.x)||1,shot=this.add.circle(e.x+dir*28,e.y-10,9,0x748dff,.95).setDepth(26).setStrokeStyle(2,0xc7d2ff,.9);
    this.physics.add.existing(shot);shot.body.allowGravity=false;shot.body.setVelocityX(dir*330);shot.damage=e.stats.damage;this.projectiles.add(shot);this.time.delayedCall(2200,()=>{if(shot.active)shot.destroy();});
  }

  evadeFeedback(){
    this.flashSyncLabel('EVADE!');
    const ring=this.add.circle(this.player.x,this.player.y,26,0xffffff,.05).setDepth(34).setStrokeStyle(4,0xbcefff,.9);
    this.tweens.add({targets:ring,scale:2.1,alpha:0,duration:220,onComplete:()=>ring.destroy()});
  }

  hitPlayerFromProjectile(p){
    if(!p.active||this.isRespawning||this.isDefeated)return;
    const damage=p.damage||10;
    if(this.time.now<=this.dodgeInvulnerableUntil){p.destroy();this.evadeFeedback();return;}
    p.destroy();
    if(this.time.now-this.lastPlayerHit<GAMEPLAY.playerInvulnerability)return;
    this.damagePlayer(damage,0);
  }

  damagePlayer(damage,knockback=0){
    if(this.isRespawning||this.isDefeated)return false;
    if(this.time.now<=this.dodgeInvulnerableUntil){this.evadeFeedback();return false;}
    this.lastPlayerHit=this.time.now;
    this.playerHealth=Math.max(0,this.playerHealth-damage);
    this.player.setTint(0xff7c9d);if(knockback)this.player.setVelocityX(knockback);
    this.cameras.main.shake(100,.006);
    this.time.delayedCall(180,()=>this.player.clearTint());
    if(this.playerHealth<=0)this.handleDefeat('DEMONS');
    return true;
  }

  handleDefeat(reason='DEFEATED'){
    if(this.isDefeated)return;this.isDefeated=true;this.isRespawning=false;this.isAttacking=false;this.player.setVelocity(0);this.player.setAlpha(.45);this.projectiles.clear(true,true);this.comboText.setText(`${reason} — DEFEATED`).setScale(1.18);this.cameras.main.shake(180,.008);this.cameras.main.fadeOut(420,20,5,22);this.time.delayedCall(650,()=>this.resetPlayer());
  }

  resetPlayer(){
    this.isRespawning=true;this.playerHealth=this.hunter.health;this.player.setPosition(this.checkpointX,this.checkpointY);this.player.setVelocity(0);this.player.clearTint();this.player.setAlpha(.65);this.sync=0;this.lastSafeX=this.checkpointX;this.lastSafeY=this.checkpointY;this.lastPlayerHit=this.time.now;this.dodgeInvulnerableUntil=-9999;this.projectiles.clear(true,true);
    this.cameras.main.fadeIn(320,10,6,25);this.comboText.setText('CHECKPOINT');this.comboText.setScale(1);this.time.delayedCall(650,()=>{this.player.setAlpha(1);this.isRespawning=false;this.isDefeated=false;this.comboText.setText('');});
  }

  updateHUD(){
    this.healthBar.width=266*(this.playerHealth/this.hunter.health);this.healthText.setText(`${this.hunter.name}  ${this.playerHealth} / ${this.hunter.health}`);this.syncBar.width=326*(this.sync/this.maxSync);
    const tier=this.sync>=100?'FULL SYNC READY':this.sync>=60?'DUO READY':this.sync>=25?'SUPPORT READY':'build with hits';this.syncText.setText(`SYNC ${Math.floor(this.sync)}%  •  ${tier}`);
    if(this.bossActive&&this.boss&&!this.boss.dead)this.bossHudBar.width=554*Math.max(0,this.boss.health/this.boss.maxHealth);
  }
}
