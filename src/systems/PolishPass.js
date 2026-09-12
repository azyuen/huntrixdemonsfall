import Phaser from 'phaser';

export function installPolishPass(GameScene){
  const previousCreate=GameScene.prototype.create;
  const previousUpdate=GameScene.prototype.update;
  const TARGET_ZOOM=1.54;

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

  GameScene.prototype.create=function(...args){
    previousCreate.apply(this,args);
    const oldZoom=this.cameras.main.zoom||1.42;
    preserveFixedUI(this,oldZoom,TARGET_ZOOM);
    this.cameras.main.setZoom(TARGET_ZOOM).setRoundPixels(false);
    this.cameras.main.startFollow(this.player,true,.13,.11,118,2);
    this.touch?.layoutForZoom?.(TARGET_ZOOM);

    const texture=this.textures.get('rumi_anim_atlas');
    texture?.setFilter?.(Phaser.Textures.FilterMode.LINEAR);

    addAtmosphere(this);
    addRoofDetails(this);
    addGrounding(this);
  };

  GameScene.prototype.update=function(time,delta){
    previousUpdate.call(this,time,delta);
    const body=this.player?.body;
    if(this.rumiShadow&&body){
      const airborne=!(body.blocked.down||body.touching.down);
      const lift=Phaser.Math.Clamp(Math.abs(body.velocity.y)/700,0,.55);
      this.rumiShadow.setPosition(body.center.x,body.bottom+3).setScale(1-lift*.35,1-lift*.18).setAlpha(airborne?.12:.28);
    }
    this.enemies?.getChildren().forEach(e=>{
      const shadow=e._polishShadow;
      if(!shadow)return;
      if(!e.active||e.dead){shadow.destroy();e._polishShadow=null;return;}
      shadow.setPosition(e.x,e.y+(e.stats?.height||80)/2+3);
    });
  };
}
