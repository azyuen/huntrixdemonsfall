import Phaser from 'phaser';

export function installPolishPass(GameScene){
  const previousCreate=GameScene.prototype.create;
  const previousUpdate=GameScene.prototype.update;
  const previousPerformAttack=GameScene.prototype.performAttack;
  const previousHitEnemy=GameScene.prototype.hitEnemy;
  const TARGET_ZOOM=1.54;
  const RUMI_DISPLAY_SCALE=1.16;

  const preserveFixedUI=(scene,fromZoom,toZoom)=>{
    const cx=scene.scale.width/2,cy=scene.scale.height/2;
    const ratio=fromZoom/toZoom;
    scene.children.list.forEach(obj=>{
      if(!obj||obj.scrollFactorX!==0||obj.depth<120||obj.depth>140)return;
      const sx=cx+(obj.x-cx)*fromZoom;
      const sy=cy+(obj.y-cy)*fromZoom;
      obj.setPosition(cx+(sx-cx)/toZoom,cy+(sy-cy)/toZoom);
      obj.setScale(obj.scaleX*ratio,obj.scaleY*ratio);
    });
  };

  const addAtmosphere=scene=>{
    const W=scene.scale.width,H=scene.scale.height;
    const g=scene.add.graphics().setScrollFactor(0).setDepth(-112);
    if(g.fillGradientStyle){
      g.fillGradientStyle(0x34186f,0x1e326e,0x070914,0x070914,.12,.08,.34,.34);
      g.fillRect(0,0,W,H);
    }
    for(let i=0;i<30;i++){
      const x=(i*173+83)%W,y=28+((i*97)%300),r=i%5===0?1.7:1.1;
      scene.add.circle(x,y,r,i%4===0?0xffd8f1:0xd8e4ff,i%3===0?.45:.28).setScrollFactor(0).setDepth(-111);
    }
    scene.add.circle(W*.75,108,94,0xb4b9ff,.035).setScrollFactor(0).setDepth(-110);
    scene.add.circle(W*.75,108,106,0xa469ff,.018).setScrollFactor(0).setDepth(-110);
  };

  const addRoofDetails=scene=>{
    scene.platforms?.getChildren().forEach((p,i)=>{
      const top=p.y-p.height/2;
      scene.add.rectangle(p.x,top+10,Math.max(18,p.width-10),13,0x090b16,.92).setDepth(2);
      scene.add.rectangle(p.x,top-2,Math.max(18,p.width-12),3,i%3===0?0xd19bc8:0x8da0ce,.62).setDepth(6);
      scene.add.rectangle(p.x,top+5,Math.max(18,p.width-14),2,0xffffff,.06).setDepth(6);
      if(p.width>330){
        const ventX=p.x+p.width*.23;
        scene.add.rectangle(ventX,top-14,42,24,0x111729,.98).setDepth(7).setStrokeStyle(1,0x69708f,.55);
        for(let s=-12;s<=12;s+=8)scene.add.rectangle(ventX+s,top-14,2,14,0x77809b,.32).setDepth(8);
      }
      if(i%3===1&&p.width>300){
        const ax=p.x-p.width*.30;
        scene.add.rectangle(ax,top-27,3,48,0x626a82,.7).setDepth(6);
        scene.add.line(ax,top-42,0,0,15,-12,0xb6c0db,.48).setOrigin(0).setDepth(6);
        scene.add.circle(ax+15,top-54,3,0xff65c9,.75).setDepth(7);
      }
      if(i%4===2&&p.width>350){
        const sx=p.x+p.width*.33;
        scene.add.rectangle(sx,top-26,58,20,0x24172c,.92).setDepth(7).setStrokeStyle(1,0xff5fc9,.42);
        scene.add.text(sx,top-27,i%8===2?'서울':'밤',{fontFamily:'system-ui',fontSize:'11px',fontStyle:'bold',color:'#ff88d6'}).setOrigin(.5).setDepth(8).setAlpha(.75);
      }
    });
  };

  const addGrounding=scene=>{
    if(scene.characterId==='rumi'&&scene.player?.body){
      scene.rumiShadow=scene.add.ellipse(scene.player.x,scene.player.body.bottom+3,68,15,0x000000,.28).setDepth(14);
    }
    scene.enemies?.getChildren().forEach(e=>{
      e._polishShadow=scene.add.ellipse(e.x,e.y+(e.stats?.height||80)/2+3,Math.max(38,(e.stats?.width||50)*.9),11,0x000000,.22).setDepth(13);
    });
  };

  const footBurst=(scene,x,y,strong=false)=>{
    const ring=scene.add.ellipse(x,y,strong?62:42,strong?14:10,0xdac8ff,.05).setDepth(15).setStrokeStyle(strong?2:1,0xd8c8ff,strong?.42:.28);
    scene.tweens.add({targets:ring,scaleX:strong?1.65:1.35,scaleY:.35,alpha:0,duration:strong?230:170,onComplete:()=>ring.destroy()});
    const count=strong?6:4;
    for(let i=0;i<count;i++){
      const dust=scene.add.ellipse(x+Phaser.Math.Between(-18,18),y-2,Phaser.Math.Between(5,10),Phaser.Math.Between(2,4),0xcab9df,.22).setDepth(15);
      scene.tweens.add({targets:dust,x:dust.x+Phaser.Math.Between(-35,35),y:dust.y-Phaser.Math.Between(7,18),alpha:0,scaleX:1.6,duration:Phaser.Math.Between(180,280),onComplete:()=>dust.destroy()});
    }
  };

  const speedStreak=(scene,body)=>{
    const dir=Math.sign(body.velocity.x)||scene.lastFacing||1;
    const y=body.center.y+Phaser.Math.Between(-18,24);
    const x=body.center.x-dir*40;
    const line=scene.add.rectangle(x,y,Phaser.Math.Between(24,46),2,0xd7c8ff,.22).setDepth(15);
    scene.tweens.add({targets:line,x:x-dir*26,alpha:0,scaleX:.4,duration:150,onComplete:()=>line.destroy()});
  };

  const slashFX=(scene,step)=>{
    if(scene.characterId!=='rumi')return;
    const dir=scene.lastFacing||1;
    const x=scene.player.x+dir*(step===2?92:72),y=scene.player.y-8;
    const g=scene.add.graphics().setDepth(34);
    const color=step===2?0xffd86d:0xe6d5ff;
    g.lineStyle(step===2?7:5,color,.9);
    g.beginPath();
    const start=dir>0?-1.05:Math.PI+1.05;
    const end=dir>0?.92:Math.PI-.92;
    g.arc(x,y,step===2?76:58,start,end,false);
    g.strokePath();
    g.lineStyle(step===2?2:1,0xffffff,.75);
    g.beginPath();g.arc(x,y,step===2?64:49,start+.08,end-.08,false);g.strokePath();
    scene.tweens.add({targets:g,alpha:0,scaleX:1.14,scaleY:1.14,duration:step===2?260:180,ease:'Quad.Out',onComplete:()=>g.destroy()});
  };

  const hitBurst=(scene,e,step)=>{
    const count=step===2?8:5;
    for(let i=0;i<count;i++){
      const shard=scene.add.rectangle(e.x+Phaser.Math.Between(-10,10),e.y+Phaser.Math.Between(-20,20),Phaser.Math.Between(5,12),2,step===2?0xffd967:0xff8cda,.82).setDepth(36).setAngle(Phaser.Math.Between(-70,70));
      scene.tweens.add({targets:shard,x:shard.x+Phaser.Math.Between(-45,45),y:shard.y+Phaser.Math.Between(-32,28),alpha:0,scaleX:.25,duration:Phaser.Math.Between(150,240),onComplete:()=>shard.destroy()});
    }
  };

  GameScene.prototype.create=function(...args){
    previousCreate.apply(this,args);
    const oldZoom=this.cameras.main.zoom||1.42;
    preserveFixedUI(this,oldZoom,TARGET_ZOOM);
    this.cameras.main.setZoom(TARGET_ZOOM).setRoundPixels(false);
    this.cameras.main.startFollow(this.player,true,.13,.11,118,2);
    this.touch?.layoutForZoom?.(TARGET_ZOOM);
    const texture=this.textures.get('rumi_anim_atlas');
    texture?.setFilter?.(Phaser.Textures.FilterMode.LINEAR);
    if(this.characterId==='rumi'&&this.rumiVisual&&this.rumiUsesAtlas)this.rumiVisual.setScale(RUMI_DISPLAY_SCALE);
    addAtmosphere(this);
    addRoofDetails(this);
    addGrounding(this);
    this._polishWasGrounded=true;
    this._polishLastVy=0;
    this._polishNextStreak=0;
  };

  GameScene.prototype.performAttack=function(time){
    previousPerformAttack.call(this,time);
    slashFX(this,this.comboStep);
  };

  GameScene.prototype.hitEnemy=function(e,damage,step,buildSync=false){
    const result=previousHitEnemy.call(this,e,damage,step,buildSync);
    if(e?.active&&!e.dead)hitBurst(this,e,step);
    return result;
  };

  GameScene.prototype.update=function(time,delta){
    previousUpdate.call(this,time,delta);
    const body=this.player?.body;
    if(this.rumiShadow&&body){
      const grounded=body.blocked.down||body.touching.down;
      const lift=Phaser.Math.Clamp(Math.abs(body.velocity.y)/700,0,.55);
      this.rumiShadow.setPosition(body.center.x,body.bottom+3).setScale(1-lift*.35,1-lift*.18).setAlpha(grounded?.28:.12);

      if(this.characterId==='rumi'&&this.rumiVisual){
        const speed=Math.abs(body.velocity.x);
        if(this.rumiUsesAtlas){
          if(grounded&&speed<35&&!this.isAttacking){
            const breathe=Math.sin(time/360)*.006;
            this.rumiVisual.setScale(RUMI_DISPLAY_SCALE*(1-breathe*.35),RUMI_DISPLAY_SCALE*(1+breathe));
          }else{
            this.rumiVisual.setScale(RUMI_DISPLAY_SCALE);
          }
        }
        if(grounded&&speed>45&&!this.isAttacking){
          this.rumiVisual.setAngle((body.velocity.x>0?1:-1)*Phaser.Math.Clamp(speed/180,0,1.5));
        }
        if(grounded&&speed>235&&time>=this._polishNextStreak){
          speedStreak(this,body);this._polishNextStreak=time+95;
        }
      }

      if(this._polishWasGrounded&&!grounded&&body.velocity.y<0)footBurst(this,body.center.x,body.bottom,false);
      if(!this._polishWasGrounded&&grounded)footBurst(this,body.center.x,body.bottom,true);
      this._polishWasGrounded=grounded;
      this._polishLastVy=body.velocity.y;
    }

    this.enemies?.getChildren().forEach(e=>{
      const shadow=e._polishShadow;
      if(!shadow)return;
      if(!e.active||e.dead){shadow.destroy();e._polishShadow=null;return;}
      shadow.setPosition(e.x,e.y+(e.stats?.height||80)/2+3);
    });

    this.children.list.forEach(obj=>{
      if(obj?.depth===25&&obj.type==='Rectangle'&&obj.alpha>.14)obj.setAlpha(.12);
    });
  };
}
