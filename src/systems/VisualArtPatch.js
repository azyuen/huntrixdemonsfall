import Phaser from 'phaser';

export function installVisualArt(GameScene){
  const originalCreate=GameScene.prototype.create;
  const originalUpdate=GameScene.prototype.update;
  const originalSpawnEnemy=GameScene.prototype.spawnEnemy;
  const originalHitEnemy=GameScene.prototype.hitEnemy;
  const originalKillEnemy=GameScene.prototype.killEnemy;
  const originalPerformAttack=GameScene.prototype.performAttack;

  const RUMI_ART_SCALE=1.02;
  const fallbackSourceSizes={idle:[77,59],run:[97,55],jump:[102,59],attack1:[102,56],attack2:[105,56],finisher:[172,61],aerial:[157,55],dodge:[117,53]};
  const fallbackScale=1.82;

  const rumiFrameData={
    r0_0:[5,8,118,111,2.1],r0_1:[123,8,106,111,3.3],r0_2:[229,8,107,111,-2.9],r0_3:[336,8,120,111,-3.9],
    r0_4:[456,8,111,111,7.6],r0_5:[567,8,97,111,-1.3],r0_6:[664,8,96,111,1.9],r0_7:[760,8,94,111,-.2],r0_8:[854,8,78,111,7.8],
    r1_0:[0,130,125,97,13.5],r1_1:[125,130,100,97,-.3],r1_2:[225,130,100,97,.2],r1_3:[325,130,107,97,-4],
    r1_4:[432,130,110,97,1.8],r1_5:[542,130,105,97,.6],r1_6:[647,130,102,97,1.5],r1_7:[749,130,113,97,-6.6],r1_8:[862,130,101,97,13.6],
    r2_0:[4,239,120,112,1],r2_1:[124,239,112,112,2],r2_2:[236,239,125,112,-8],r2_3:[361,239,143,112,-.9],
    r2_4:[504,239,137,112,4.1],r2_5:[641,239,132,112,-1.8],r2_6:[773,239,138,112,-.9],r2_7:[911,239,99,112,21.1],
    r3_0:[5,361,154,152,2.3],r3_1:[159,361,139,152,5.7],r3_2:[298,361,126,152,1],r3_3:[424,361,128,152,-2.7],
    r3_4:[552,361,119,152,6.8],r3_5:[671,361,123,152,-8.7],r3_6:[794,361,140,152,.8],
    r4_0:[0,526,150,126,-.6],r4_1:[150,526,138,126,6.7],r4_2:[288,526,153,126,-13.9],r4_3:[441,526,163,126,9.8],
    r4_4:[604,526,171,126,-13.6],r4_5:[775,526,180,126,9.8],
    r5_0:[0,666,183,80,27.1]
  };

  const rumiAnimations={
    idle:{frames:['r0_0','r0_1','r0_2','r0_3'],frameRate:5,repeat:-1},
    run:{frames:['r0_4','r0_5','r0_6','r0_7','r0_8','r1_0','r1_1','r1_2','r1_3','r1_4','r1_5','r1_6','r1_7','r1_8'],frameRate:14,repeat:-1},
    jump:{frames:['r2_0','r2_1','r2_2'],frameRate:14,repeat:0},
    aerial:{frames:['r2_3','r2_4','r2_5'],frameRate:8,repeat:-1},
    land:{frames:['r2_7','r2_6'],frameRate:12,repeat:0},
    dodge:{frames:['r2_3','r2_4','r2_5'],frameRate:17,repeat:0},
    attack1:{frames:['r3_0','r3_1','r3_2'],frameRate:14,repeat:0},
    attack2:{frames:['r3_3','r3_4','r3_5','r3_6'],frameRate:17,repeat:0},
    finisher:{frames:['r4_0','r4_1','r4_2','r4_3','r4_4','r4_5'],frameRate:20,repeat:0}
  };

  const registerRumiAnimations=scene=>{
    if(!scene.textures.exists('rumi_anim_atlas'))return false;
    const texture=scene.textures.get('rumi_anim_atlas');
    if(!texture||texture.key==='__MISSING')return false;
    Object.entries(rumiFrameData).forEach(([name,[x,y,w,h]])=>{
      if(!texture.has(name))texture.add(name,0,x,y,w,h);
    });
    Object.entries(rumiAnimations).forEach(([state,def])=>{
      const key=`rumi-${state}`;
      if(!scene.anims.exists(key))scene.anims.create({key,frames:def.frames.map(frame=>({key:'rumi_anim_atlas',frame})),frameRate:def.frameRate,repeat:def.repeat});
    });
    return texture.has('r0_0');
  };

  const setFallbackPose=(scene,name)=>{
    if(scene.characterId!=='rumi'||!scene.rumiVisual)return false;
    const safeName=name==='land'?'idle':name;
    const key=`rumi_${safeName}`;
    if(!scene.textures.exists(key))return false;
    if(scene.rumiVisual.texture.key!==key)scene.rumiVisual.setTexture(key);
    const [sw,sh]=fallbackSourceSizes[safeName]||fallbackSourceSizes.idle;
    scene.rumiVisual.setDisplaySize(sw*fallbackScale,sh*fallbackScale).setOrigin(.5,1).setVisible(true);
    scene.rumiPose=name;
    return true;
  };

  const playRumi=(scene,name,force=false)=>{
    if(scene.characterId!=='rumi'||!scene.rumiVisual)return false;
    if(!scene.rumiUsesAtlas)return setFallbackPose(scene,name);
    const key=`rumi-${name}`;
    if(!scene.anims.exists(key))return false;
    if(force||scene.rumiVisual.anims.currentAnim?.key!==key)scene.rumiVisual.play(key,!force);
    scene.rumiPose=name;
    scene.rumiVisual.setScale(RUMI_ART_SCALE).setOrigin(.5,1).setVisible(true);
    return true;
  };

  const alignRumiToBody=scene=>{
    const body=scene.player?.body,visual=scene.rumiVisual;
    if(!body||!visual)return;
    const flip=scene.lastFacing<0;
    let offset=0;
    if(scene.rumiUsesAtlas){const data=rumiFrameData[visual.frame?.name];if(data)offset=data[4]||0;}
    const facingSign=flip?-1:1;
    visual.setPosition(body.center.x-offset*RUMI_ART_SCALE*facingSign,body.bottom+5).setFlipX(flip);
  };

  const makeRumiGhost=scene=>{
    const visual=scene.rumiVisual;
    if(!visual)return;
    let ghost;
    if(scene.rumiUsesAtlas){ghost=scene.add.image(visual.x,visual.y,'rumi_anim_atlas',visual.frame?.name||'r2_4').setOrigin(.5,1).setScale(RUMI_ART_SCALE);}
    else{ghost=scene.add.image(visual.x,visual.y,visual.texture.key).setDisplaySize(visual.displayWidth,visual.displayHeight).setOrigin(.5,1);}
    ghost.setFlipX(visual.flipX).setAlpha(.2).setTint(0xc5b5ff).setDepth(17);
    scene.tweens.add({targets:ghost,alpha:0,x:ghost.x-(scene.lastFacing||1)*24,duration:180,onComplete:()=>ghost.destroy()});
  };

  const syncRumiVisual=(scene,time)=>{
    if(!scene.rumiVisual||!scene.player?.body)return;
    const body=scene.player.body;
    const grounded=body.blocked.down||body.touching.down;
    const wasGrounded=scene._rumiWasGrounded;
    const dodging=time<=scene.dodgeInvulnerableUntil;
    const wasDodging=scene._rumiWasDodging;

    if(dodging){if(!wasDodging)playRumi(scene,'dodge',true);}
    else if(scene.isAttacking||time<scene._rumiAttackLockUntil){}
    else if(grounded&&!wasGrounded){scene._rumiLandingUntil=time+150;playRumi(scene,'land',true);}
    else if(time<scene._rumiLandingUntil){}
    else if(!grounded&&wasGrounded){scene._rumiJumpUntil=time+180;playRumi(scene,'jump',true);}
    else if(!grounded){if(time>=scene._rumiJumpUntil)playRumi(scene,'aerial');}
    else if(Math.abs(body.velocity.x)>45)playRumi(scene,'run');
    else playRumi(scene,'idle');

    alignRumiToBody(scene);
    if(dodging){
      scene.rumiVisual.setAlpha(.78).setAngle((scene.lastFacing||1)*1.5);
      if(time-scene._lastRumiGhost>65){makeRumiGhost(scene);scene._lastRumiGhost=time;}
    }else{
      scene.rumiVisual.setAlpha(1);
      if(scene.rumiPose==='aerial'||scene.rumiPose==='jump')scene.rumiVisual.setAngle(Phaser.Math.Clamp(body.velocity.y/420,-1.6,2));
      else scene.rumiVisual.setAngle(0);
    }
    if(scene.rumiAura){scene.rumiAura.setPosition(body.center.x,body.bottom-44);scene.rumiAura.setAlpha(scene.isAttacking?.09:.028);}
    scene._rumiWasGrounded=grounded;scene._rumiWasDodging=dodging;
  };

  const attackSpark=(scene,finisher=false)=>{
    const dir=scene.lastFacing||1,x=scene.player.x+dir*(finisher?150:112),y=scene.player.y-10;
    const ring=scene.add.circle(x,y,finisher?30:18,0xffffff,.08).setDepth(32).setStrokeStyle(finisher?7:4,finisher?0xffd968:0xc9b8ff,.95);
    scene.tweens.add({targets:ring,scale:finisher?3.5:2.4,alpha:0,duration:finisher?320:190,onComplete:()=>ring.destroy()});
    if(finisher)scene.cameras.main.shake(120,.004);
  };

  const buildSkyline=scene=>{
    const W=scene.scale.width,H=scene.scale.height;
    scene.add.rectangle(W/2,H/2,W,H,0x080b1d,1).setScrollFactor(0).setDepth(-130);
    scene.add.rectangle(W/2,200,W,400,0x17275c,1).setScrollFactor(0).setDepth(-129);
    scene.add.rectangle(W/2,300,W,230,0x37205d,.50).setScrollFactor(0).setDepth(-128);
    for(let i=0;i<4;i++)scene.add.ellipse(W*.58+i*120,245+i*18,560,150,0x7b4fa0,.035).setScrollFactor(0).setDepth(-127);
    scene.add.circle(W*.75,108,118,0x8390ff,.11).setScrollFactor(0).setDepth(-126);
    scene.add.circle(W*.75,108,76,0xf2f3ff,.96).setScrollFactor(0).setDepth(-125);
    scene.add.circle(W*.728,92,17,0xbec5e5,.15).setScrollFactor(0).setDepth(-124);
    scene.add.circle(W*.775,130,21,0xbec5e5,.13).setScrollFactor(0).setDepth(-124);
    const makeBuilding=(x,base,w,h,color,depth,windowColor=0xff8ad9)=>{
      scene.add.rectangle(x+w/2,base-h/2,w,h,color,1).setScrollFactor(0).setDepth(depth);
      scene.add.rectangle(x+w*.16,base-h-6,w*.68,7,0x222750,.8).setScrollFactor(0).setDepth(depth+1);
      for(let wx=x+18;wx<x+w-10;wx+=24)for(let wy=base-h+24;wy<base-14;wy+=28){const seed=(wx*3+wy*7)%11;if(seed<5)scene.add.rectangle(wx,wy,5,8,seed%2?windowColor:0x84c6ff,.44).setScrollFactor(0).setDepth(depth+1);}
    };
    const far=[[-20,410,145,245],[105,420,100,205],[190,390,135,280],[315,430,100,175],[405,365,145,300],[545,420,110,205],[650,385,130,260],[785,425,95,170],[870,390,150,250],[1020,425,110,185],[1130,365,145,300],[1270,415,110,215],[1380,380,150,270],[1525,425,95,170]];
    far.forEach(([x,b,w,h],i)=>makeBuilding(x,b,w,h,i%2?0x25264f:0x1f2148,-123,i%3===0?0xff9acb:0xffc97a));
    const near=[[-60,505,250,150],[150,515,190,125],[325,475,250,180],[560,520,170,115],[720,470,235,185],[940,510,180,140],[1110,460,245,195],[1345,510,220,135]];
    near.forEach(([x,b,w,h],i)=>{scene.add.rectangle(x+w/2,b-h/2,w,h,i%2?0x11162f:0x0e1429,1).setScrollFactor(0).setDepth(-121);if(i===1||i===4||i===6){scene.add.rectangle(x+w*.35,b-h-18,42,28,0x1e2440,1).setScrollFactor(0).setDepth(-120);scene.add.circle(x+w*.35,b-h-18,8,0xff4fd8,.18).setScrollFactor(0).setDepth(-119);}});
    scene.add.rectangle(95,330,104,260,0x1a1530,.88).setScrollFactor(0).setDepth(-118).setStrokeStyle(2,0xff4bc5,.24);
    scene.add.text(95,328,'또\n다시\n빛날\n우리\n♡',{fontFamily:'system-ui',fontSize:'24px',fontStyle:'bold',color:'#ff75d0',align:'center',lineSpacing:7}).setOrigin(.5).setScrollFactor(0).setDepth(-117).setShadow(0,0,'#ff2db7',12,true,true);
    scene.add.rectangle(W*.86,252,9,170,0x24284f,.98).setScrollFactor(0).setDepth(-120);
    scene.add.triangle(W*.86,154,W*.835,222,W*.885,222,W*.86,140,0x303764,.98).setScrollFactor(0).setDepth(-120);
    scene.add.rectangle(W*.86,187,40,5,0x58e8ff,.95).setScrollFactor(0).setDepth(-119);
    scene.add.rectangle(W*.86,194,32,4,0xff55d8,.95).setScrollFactor(0).setDepth(-119);
    scene.add.rectangle(12,300,18,310,0x211426,.88).setScrollFactor(0).setDepth(-116).setAngle(-8);
    for(let i=0;i<20;i++)scene.add.circle(20+Phaser.Math.Between(0,120),170+Phaser.Math.Between(0,250),Phaser.Math.Between(3,7),0xff83bf,.48).setScrollFactor(0).setDepth(-115);
    scene.add.rectangle(W/2,575,W,290,0x080b18,.92).setScrollFactor(0).setDepth(-114);
    scene.add.rectangle(W/2,548,W,6,0x6f4f85,.40).setScrollFactor(0).setDepth(-113);
  };

  const layoutHUDForZoom=scene=>{
    const zoom=scene.cameras.main.zoom||1,inv=1/zoom,cx=scene.scale.width/2,cy=scene.scale.height/2;
    const map=(sx,sy)=>({x:cx+(sx-cx)/zoom,y:cy+(sy-cy)/zoom});
    const place=(obj,sx,sy)=>{if(!obj)return;const p=map(sx,sy);obj.setPosition(p.x,p.y).setScale(inv);};
    const hudBgs=scene.children.list.filter(o=>o.depth===120&&o.scrollFactorX===0&&o.type==='Rectangle');
    const nearest=(tx,ty,exclude)=>hudBgs.filter(o=>o!==exclude).sort((a,b)=>((a.x-tx)**2+(a.y-ty)**2)-((b.x-tx)**2+(b.y-ty)**2))[0];
    scene._healthHudBg=scene._healthHudBg||nearest(175,48,null);scene._syncHudBg=scene._syncHudBg||nearest(780,92,scene._healthHudBg);
    place(scene._healthHudBg,190,52);if(scene._healthHudBg)scene._healthHudBg.setScale(inv);place(scene.healthBar,56,52);if(scene.healthBar)scene.healthBar.setOrigin(0,.5);place(scene.healthText,190,52);if(scene.healthText)scene.healthText.setFontSize(15);
    place(scene._syncHudBg,640,54);if(scene._syncHudBg)scene._syncHudBg.setScale(inv);place(scene.syncBar,477,54);if(scene.syncBar)scene.syncBar.setOrigin(0,.5);place(scene.syncText,640,54);if(scene.syncText)scene.syncText.setFontSize(13);
    place(scene.comboText,640,90);if(scene.comboText)scene.comboText.setFontSize(18);place(scene.styleText,1080,50);if(scene.styleText)scene.styleText.setFontSize(14);place(scene.upgradeText,1080,76);if(scene.upgradeText)scene.upgradeText.setFontSize(11);
    place(scene.bossHudBg,640,112);place(scene.bossHudBar,363,112);if(scene.bossHudBar)scene.bossHudBar.setOrigin(0,.5);place(scene.bossHudText,640,112);
  };

  GameScene.prototype.create=function(...args){
    originalCreate.apply(this,args);
    this.children.list.slice().forEach(obj=>{if(obj!==this.player&&obj.depth<0)obj.destroy();});
    buildSkyline(this);
    this.cameras.main.setZoom(1.42);this.cameras.main.startFollow(this.player,true,.12,.10,135,2);
    this.platforms?.getChildren().forEach((p,i)=>{p.setFillStyle?.(i%3===0?0x111326:0x15152a,1);p.setStrokeStyle?.(2,0x8c719b,.82);this.add.rectangle(p.x,p.y-p.height/2+3,Math.max(12,p.width-8),7,0xa383ad,.76).setDepth(3);if(i%2===0){const unit=this.add.rectangle(p.x-p.width*.28,p.y-p.height/2-22,54,34,0x191c30,.96).setDepth(4).setStrokeStyle(2,0x5f6077,.5);this.add.circle(unit.x-12,unit.y,8,0x090b13,.9).setDepth(5).setStrokeStyle(2,0x6d6f88,.5);this.add.circle(unit.x+12,unit.y,8,0x090b13,.9).setDepth(5).setStrokeStyle(2,0x6d6f88,.5);}});
    this._nextPetal=0;this._lastRumiGhost=0;this._rumiAttackLockUntil=0;this._rumiJumpUntil=0;this._rumiLandingUntil=0;this._rumiWasGrounded=false;this._rumiWasDodging=false;
    if(this.characterId==='rumi'){
      this.player.setTexture('rumi').setVisible(false).setAlpha(1);this.player.body.setSize(34,72,true);this.rumiUsesAtlas=registerRumiAnimations(this);
      if(this.rumiUsesAtlas){this.rumiVisual=this.add.sprite(this.player.x,this.player.y,'rumi_anim_atlas','r0_0').setDepth(20).setOrigin(.5,1).setScale(RUMI_ART_SCALE);playRumi(this,'idle',true);}
      else if(this.textures.exists('rumi_idle')){this.rumiVisual=this.add.image(this.player.x,this.player.y,'rumi_idle').setDepth(20).setOrigin(.5,1);setFallbackPose(this,'idle');}
      if(this.rumiVisual){this.rumiAura=this.add.ellipse(this.player.x,this.player.y,86,102,0x9e78ff,.025).setDepth(16).setStrokeStyle(2,0xe8dcff,.07);syncRumiVisual(this,this.time.now);}
    }
    layoutHUDForZoom(this);
  };

  GameScene.prototype.spawnEnemy=function(type,x,y){const e=originalSpawnEnemy.call(this,type,x,y),key=type==='boss'?'enemy_boss':type==='brute'?'enemy_brute':type==='ranged'?'enemy_ranged':'enemy_grunt';if(this.textures.exists(key)){e.setAlpha(.001);e.visual=this.add.image(e.x,e.y,key).setDepth(18);const s=type==='boss'?1.22:type==='brute'?1.12:1.06;e.visual.setScale(s);e.visual.baseScale=s;}return e;};
  GameScene.prototype.performAttack=function(time){originalPerformAttack.call(this,time);if(this.characterId==='rumi'&&this.rumiVisual){const step=this.comboStep,pose=step===0?'attack1':step===1?'attack2':'finisher';playRumi(this,pose,true);this._rumiAttackLockUntil=time+(this.hunter.attackDuration[step]||260);attackSpark(this,step===2);}};
  GameScene.prototype.hitEnemy=function(e,damage,step,buildSync=false){if(e.visual){e.visual.setTint(0xff76dc);e.visual.setScale((e.visual.baseScale||1)*1.08,(e.visual.baseScale||1)*.94);this.time.delayedCall(105,()=>{if(e.visual?.active){e.visual.clearTint();e.visual.setScale(e.visual.baseScale||1);}});}return originalHitEnemy.call(this,e,damage,step,buildSync);};
  GameScene.prototype.killEnemy=function(e){if(e.visual?.active){const v=e.visual;e.visual=null;this.tweens.add({targets:v,alpha:0,scaleX:v.scaleX*1.32,scaleY:v.scaleY*.62,y:v.y-16,duration:e.type==='boss'?480:300,onComplete:()=>v.destroy()});}return originalKillEnemy.call(this,e);};
  GameScene.prototype.update=function(time,delta){
    originalUpdate.call(this,time,delta);
    if(time>this._nextPetal){this._nextPetal=time+Phaser.Math.Between(650,1100);const cam=this.cameras.main,px=cam.scrollX+cam.width+30,py=Phaser.Math.Between(110,500);const petal=this.add.ellipse(px,py,11,5,0xff8dc8,.52).setDepth(10).setAngle(Phaser.Math.Between(-25,25));this.tweens.add({targets:petal,x:px-Phaser.Math.Between(260,430),y:py+Phaser.Math.Between(40,110),angle:petal.angle+180,alpha:0,duration:Phaser.Math.Between(1800,2600),onComplete:()=>petal.destroy()});}
    if(this.characterId==='rumi'&&this.rumiVisual)syncRumiVisual(this,time);
    if(this.enemies)this.enemies.getChildren().forEach(e=>{if(!e.visual?.active)return;e.visual.setPosition(e.x,e.y).setFlipX(this.player.x<e.x);const base=e.visual.baseScale||1,motion=Math.abs(e.body?.velocity?.x||0)>5?Math.sin(time/120+e.x*.01)*.025:0;e.visual.setScale(base*(1+motion),base*(1-motion*.5));e.visual.setAlpha(e.type==='boss'&&!this.bossActive&&!this.bossDefeated?.72:1);});
  };
}
