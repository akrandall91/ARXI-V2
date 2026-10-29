/* Real sizes: Bar 13 x 3.5 in, Panel 13 x 7 in (W x H); the enclosures below keep those proportions.
   ARXI 3D product renders: a Bar and a Panel, dark enclosures with a frosted diffuser face that plays live content.
   ArxiModels(stageEl,{bar:scenes,panel:scenes,mode,finish,onLabel}) -> {setMode('both'|'bar'|'panel'), setFinish('black'|'white'|'mix'), setScenes(kind,scenes)} or null when WebGL is unavailable.
   A single mode shows only that display, centred. Needs three.js (r128) and ArxiMatrix. */
(function(){
  function roundedRect(T,w,h,r){const s=new T.Shape(),x=-w/2,y=-h/2;
    s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s}
  function shadowTex(T){const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');
    const gr=g.createRadialGradient(128,32,4,128,32,128);gr.addColorStop(0,'rgba(13,17,23,.55)');gr.addColorStop(.45,'rgba(13,17,23,.18)');gr.addColorStop(1,'rgba(13,17,23,0)');
    g.save();g.scale(1,.25);g.fillStyle=gr;g.fillRect(0,0,256,256);g.restore();return new T.CanvasTexture(c)}
  let holder=null;
  function offscreenCanvas(px){
    if(!holder){holder=document.createElement('div');holder.setAttribute('aria-hidden','true');
      holder.style.cssText='position:fixed;left:-20000px;top:0;width:1000px;pointer-events:none;opacity:0';document.body.appendChild(holder)}
    const c=document.createElement('canvas');c.style.cssText='display:block;width:'+px+'px';holder.appendChild(c);return c}

  function ArxiModels(stage,opts){
    const T=window.THREE;if(!T||!window.ArxiMatrix)return null;
    let renderer;try{renderer=new T.WebGLRenderer({antialias:true,alpha:true});if(!renderer.getContext())return null}catch(e){return null}
    renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));renderer.outputEncoding=T.sRGBEncoding;
    renderer.domElement.style.cssText='display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab';
    stage.appendChild(renderer.domElement);
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene=new T.Scene(),cam=new T.PerspectiveCamera(28,1,.1,200);
    scene.add(new T.HemisphereLight(0xffffff,0xaab3c0,.7));
    const key=new T.DirectionalLight(0xffffff,.85);key.position.set(-4,6,7);scene.add(key);
    const rim=new T.DirectionalLight(0xdfe7ff,.55);rim.position.set(6,3,-5);scene.add(rim);
    const world=new T.Group();scene.add(world);
    const sh=shadowTex(T);
    let mode=opts.mode||'both';

    function unit(cols,rows,scenes){
      const pitch=.1,fw=cols*pitch,fh=rows*pitch,bez=.16,depth=.5,W=fw+bez*2,H=fh+(rows>11?.171:.085)*2,g=new T.Group();
      const geo=new T.ExtrudeGeometry(roundedRect(T,W-.04,H-.04,.09),{depth:depth-.04,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:4,curveSegments:10});
      geo.translate(0,0,-(depth-.04)/2);
      const bodyMat=new T.MeshStandardMaterial({color:0x08090b,roughness:.62,metalness:.25});g.add(new T.Mesh(geo,bodyMat));
      /* recessed bezel lip */
      const lip=new T.Mesh(new T.PlaneGeometry(fw+.05,fh+.05),new T.MeshStandardMaterial({color:0x050608,roughness:.9}));lip.position.z=depth/2+.001;g.add(lip);
      const cv=offscreenCanvas(cols*20);const mx=window.ArxiMatrix(cv,{w:cols,h:rows,onLabel:t=>{if(opts.onLabel&&(mode===(rows>11?'panel':'bar')))opts.onLabel(t)}});mx.setScenes(scenes||[]);
      const tex=new T.CanvasTexture(cv);tex.encoding=T.sRGBEncoding;tex.anisotropy=renderer.capabilities.getMaxAnisotropy();
      const screen=new T.Mesh(new T.PlaneGeometry(fw,fh),new T.MeshStandardMaterial({color:0x000000,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:1.05,roughness:.6}));
      screen.position.z=depth/2+.003;g.add(screen);
      /* frosted diffuser: a faint satin sheen over the light */
      const frost=new T.Mesh(new T.PlaneGeometry(fw,fh),new T.MeshPhysicalMaterial({color:0xffffff,transparent:true,opacity:.035,roughness:.35,clearcoat:1,clearcoatRoughness:.4}));
      frost.position.z=depth/2+.006;g.add(frost);
      const s=new T.Mesh(new T.PlaneGeometry(W*1.5,depth*3.2),new T.MeshBasicMaterial({map:sh,transparent:true,depthWrite:false}));
      s.rotation.x=-Math.PI/2;s.position.y=-H/2+.002;g.add(s);
      return{g,tex,W,H,depth,mx,bodyMat,pos:new T.Vector3(),rot:0,scale:1};
    }
    const panel=unit(44,22,opts.panel),bar=unit(44,11,opts.bar);
    world.add(panel.g,bar.g);
    /* optional shelf the display stands on (rooms): a plank with a top and a front colour */
    let shelf=null;
    function setShelf(sh){
      if(!sh){if(shelf)shelf.visible=false;return}
      if(!shelf){shelf=new T.Group();const top=new T.Mesh(new T.BoxGeometry(8.4,.16,1.7),new T.MeshStandardMaterial({roughness:.75,metalness:0}));top.position.set(0,-.08,.1);shelf.add(top);shelf.userData.top=top;world.add(shelf)}
      shelf.visible=true;shelf.scale.x=(sh.w||8.4)/8.4;shelf.userData.top.material.color.set(sh.top||'#B98A5E');shelf.userData.top.material.roughness=sh.rough!=null?sh.rough:.75;shelf.userData.top.material.metalness=sh.metal||0}
    if(opts.shelf)setShelf(opts.shelf);
    const FIN={black:{c:0x08090b,r:.62,m:.25},white:{c:0xECEEF1,r:.45,m:.05}};
    function paint(u,f){const F=FIN[f];u.bodyMat.color.setHex(F.c);u.bodyMat.roughness=F.r;u.bodyMat.metalness=F.m}
    let finish=opts.finish||'mix';
    function setFinish(f){finish=f;paint(panel,f==='mix'?'white':f);paint(bar,f==='mix'?'black':f)}
    function layout(){
      if(mode==='both'){const s=opts.barLeft?-1:1;panel.pos.set(-2.75*s,panel.H/2,0);panel.rot=.16*s;panel.scale=1;bar.pos.set(2.75*s,bar.H/2,.5);bar.rot=-.16*s;bar.scale=1}
      else{const on=mode==='panel'?panel:bar,off=mode==='panel'?bar:panel;on.pos.set(0,on.H/2,0);on.rot=0;on.scale=1;off.pos.set(mode==='panel'?6:-6,off.H/2,0);off.scale=0}
    }
    let target=new T.Vector3(),camPos=new T.Vector3(),curT=new T.Vector3(),curP=new T.Vector3(),first=true;
    function frame(){
      const r=stage.getBoundingClientRect(),aspect=Math.max(.5,r.width/Math.max(1,r.height));
      let cx,cy,w,h;
      if(mode==='bar'){cx=0;cy=bar.H/2;w=bar.W*.92;h=bar.H*1.8}
      else if(mode==='panel'){cx=0;cy=panel.H/2;w=panel.W*.92;h=panel.H}
      else{cx=0;cy=panel.H/2;w=10.4;h=panel.H}
      const v=T.MathUtils.degToRad(cam.fov),hf=2*Math.atan(Math.tan(v/2)*aspect);
      const d=(Math.max((w*.62)/Math.tan(hf/2),(h*.85)/Math.tan(v/2))+1)/(opts.zoom||1);
      target.set(cx,cy,0);camPos.set(cx+d*.08,cy+d*.16,d);
      if(first||reduce){curT.copy(target);curP.copy(camPos);first=false}
    }
    function size(){const r=stage.getBoundingClientRect();renderer.setSize(r.width,r.height,false);cam.aspect=r.width/Math.max(1,r.height);cam.updateProjectionMatrix();frame()}
    setFinish(finish);layout();[panel,bar].forEach(u=>{u.g.position.copy(u.pos);u.g.rotation.y=u.rot;u.g.scale.setScalar(Math.max(.001,u.scale));u.g.visible=u.scale>0});
    new ResizeObserver(size).observe(stage);size();

    /* drag to turn */
    let yaw=0,pitch=0,vy=0,drag=null,idle=0;
    const el=renderer.domElement;
    el.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,yaw,pitch};el.setPointerCapture(e.pointerId);el.style.cursor='grabbing'});
    el.addEventListener('pointermove',e=>{if(!drag)return;yaw=Math.max(-1.1,Math.min(1.1,drag.yaw+(e.clientX-drag.x)*.006));pitch=Math.max(-.25,Math.min(.35,drag.pitch+(e.clientY-drag.y)*.004));idle=0});
    ['pointerup','pointercancel'].forEach(t=>el.addEventListener(t,()=>{drag=null;el.style.cursor='grab'}));
    el.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){yaw=Math.max(-1.1,yaw-.15);idle=0}else if(e.key==='ArrowRight'){yaw=Math.min(1.1,yaw+.15);idle=0}});
    el.tabIndex=0;el.setAttribute('role','img');el.setAttribute('aria-label',opts.label||'3D render of the ARXI Bar and Panel. Drag to turn them.');

    let visible=true,raf=0,last=performance.now();
    new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible&&!raf)raf=requestAnimationFrame(loop)}).observe(stage);
    function loop(now){
      raf=0;if(!visible)return;const dt=Math.min(.05,(now-last)/1000);last=now;
      if(!drag&&!reduce){idle+=dt;if(idle>2.5){const goal=Math.sin(now/4200)*.38;yaw+=(goal-yaw)*Math.min(1,dt*.8);pitch+=(0-pitch)*Math.min(1,dt*.8)}}
      world.rotation.y=yaw;world.rotation.x=pitch*.5;
      [panel,bar].forEach(u=>{const k2=reduce?1:Math.min(1,dt*5);u.g.position.lerp(u.pos,k2);u.g.rotation.y+=(u.rot-u.g.rotation.y)*k2;
        const s=u.g.scale.x+(u.scale-u.g.scale.x)*k2;u.g.scale.setScalar(Math.max(.001,s));u.g.visible=s>.02});
      const k=reduce?1:Math.min(1,dt*4);curT.lerp(target,k);curP.lerp(camPos,k);cam.position.copy(curP);cam.lookAt(curT);
      panel.tex.needsUpdate=true;bar.tex.needsUpdate=true;
      renderer.render(scene,cam);raf=requestAnimationFrame(loop);
    }
    raf=requestAnimationFrame(loop);
    return{setMode(m){mode=m;layout();frame()},setFinish,setShelf,setScenes(kind,sc){(kind==='panel'?panel:bar).mx.setScenes(sc)},bar:bar.mx,panel:panel.mx};
  }
  window.ArxiModels=ArxiModels;

  /* ---------- shared pieces for the lineup, stills and take-apart view ---------- */
  const FINS={black:{c:0x08090b,r:.62,m:.25},white:{c:0xECEEF1,r:.45,m:.05}};
  function lights(T,scene){scene.add(new T.HemisphereLight(0xffffff,0xaab3c0,.7));const k=new T.DirectionalLight(0xffffff,.85);k.position.set(-4,6,7);scene.add(k);
    const r=new T.DirectionalLight(0xdfe7ff,.55);r.position.set(6,3,-5);scene.add(r)}
  function makeScreen(T,cols,rows,scenes){const cv=offscreenCanvas(cols*20);const mx=window.ArxiMatrix(cv,{w:cols,h:rows});mx.setScenes(scenes||[]);
    const tex=new T.CanvasTexture(cv);tex.encoding=T.sRGBEncoding;tex.anisotropy=4;return{cv,mx,tex}}
  function makeUnit(T,kind,tex,finish,sh){
    const cols=44,rows=kind==='panel'?22:11,pitch=.1,fw=cols*pitch,fh=rows*pitch,bez=.16,depth=.5,W=fw+bez*2,H=fh+(rows>11?.171:.085)*2,g=new T.Group();
    const geo=new T.ExtrudeGeometry(roundedRect(T,W-.04,H-.04,.09),{depth:depth-.04,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:4,curveSegments:10});
    geo.translate(0,0,-(depth-.04)/2);const F=FINS[finish]||FINS.black;
    const bodyMat=new T.MeshStandardMaterial({color:F.c,roughness:F.r,metalness:F.m});g.add(new T.Mesh(geo,bodyMat));
    const lip=new T.Mesh(new T.PlaneGeometry(fw+.05,fh+.05),new T.MeshStandardMaterial({color:0x050608,roughness:.9}));lip.position.z=depth/2+.001;g.add(lip);
    const screen=new T.Mesh(new T.PlaneGeometry(fw,fh),new T.MeshStandardMaterial({color:0x000000,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:1.05,roughness:.6}));
    screen.position.z=depth/2+.003;g.add(screen);
    if(sh){const s=new T.Mesh(new T.PlaneGeometry(W*1.5,depth*3.2),new T.MeshBasicMaterial({map:sh,transparent:true,depthWrite:false}));s.rotation.x=-Math.PI/2;s.position.y=-H/2+.002;g.add(s)}
    return{g,W,H,depth,fw,fh,bodyMat}}
  function newRenderer(T,stage,extra){let r;try{r=new T.WebGLRenderer(Object.assign({antialias:true,alpha:true},extra||{}));if(!r.getContext())return null}catch(e){return null}
    r.setPixelRatio(Math.min(2,window.devicePixelRatio||1));r.outputEncoding=T.sRGBEncoding;
    if(stage){r.domElement.style.cssText='display:block;width:100%;height:100%';stage.appendChild(r.domElement)}return r}
  function fitCam(T,cam,w,h,aspect){const v=T.MathUtils.degToRad(cam.fov),hf=2*Math.atan(Math.tan(v/2)*aspect);return Math.max((w*.55)/Math.tan(hf/2),(h*.6)/Math.tan(v/2))+1}

  /* Store lineup: every display in the order, side by side, in its finish. One shared screen texture per size. */
  function ArxiLineup(stage,opts){
    const T=window.THREE;if(!T||!window.ArxiMatrix)return null;const renderer=newRenderer(T,stage);if(!renderer)return null;
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene=new T.Scene(),cam=new T.PerspectiveCamera(26,1,.1,300);lights(T,scene);const world=new T.Group();scene.add(world);const sh=shadowTex(T);
    const scr={bar:makeScreen(T,44,11,opts.bar),panel:makeScreen(T,44,22,opts.panel)};
    let units=[],target=new T.Vector3(),camPos=new T.Vector3(),curT=new T.Vector3(),curP=new T.Vector3(),first=true;
    function size(){const r=stage.getBoundingClientRect();if(!r.width)return;renderer.setSize(r.width,r.height,false);cam.aspect=r.width/Math.max(1,r.height);cam.updateProjectionMatrix();frame()}
    function frame(){
      let w=0,h=1.4;units.forEach(u=>{w+=u.W+.45;h=Math.max(h,u.H)});w=Math.max(4.8,w);
      const r=stage.getBoundingClientRect(),d=fitCam(T,cam,w,h,Math.max(.4,r.width/Math.max(1,r.height)));
      target.set(0,h*.45,0);camPos.set(d*.05,h*.45+d*.17,d);if(first||reduce){curT.copy(target);curP.copy(camPos);first=false}}
    function setItems(items){
      const want=items.slice(0,8);
      const next=[];
      want.forEach((it,i)=>{let u=units.find(x=>!x._used&&x.kind===it.kind&&x.finish===it.finish);
        if(!u){u=makeUnit(T,it.kind,scr[it.kind].tex,it.finish,sh);u.kind=it.kind;u.finish=it.finish;u.g.scale.setScalar(.001);world.add(u.g)}
        u._used=true;next.push(u)});
      units.forEach(u=>{if(next.indexOf(u)<0)world.remove(u.g)});next.forEach(u=>{delete u._used});units=next;
      let x=0;const total=units.reduce((s,u)=>s+u.W,0)+(units.length-1)*.45;x=-total/2;
      units.forEach(u=>{u.tx=x+u.W/2;u.ty=u.H/2;u.tz=-Math.abs(x+u.W/2)*.08;u.trot=-(x+u.W/2)*.035;x+=u.W+.45});
      frame();
    }
    new ResizeObserver(size).observe(stage);size();
    let visible=true,raf=0,last=performance.now();
    new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible&&!raf)raf=requestAnimationFrame(loop)}).observe(stage);
    function loop(now){raf=0;if(!visible)return;const dt=Math.min(.05,(now-last)/1000);last=now;const k=reduce?1:Math.min(1,dt*5);
      units.forEach(u=>{u.g.position.x+=(u.tx-u.g.position.x)*k;u.g.position.y=u.ty;u.g.position.z+=(u.tz-u.g.position.z)*k;u.g.rotation.y+=(u.trot-u.g.rotation.y)*k;
        const s=u.g.scale.x+(1-u.g.scale.x)*k;u.g.scale.setScalar(s)});
      world.rotation.y=reduce?0:Math.sin(now/5000)*.12;
      curT.lerp(target,reduce?1:Math.min(1,dt*4));curP.lerp(camPos,reduce?1:Math.min(1,dt*4));cam.position.copy(curP);cam.lookAt(curT);
      scr.bar.tex.needsUpdate=true;scr.panel.tex.needsUpdate=true;renderer.render(scene,cam);raf=requestAnimationFrame(loop)}
    raf=requestAnimationFrame(loop);
    return{setItems,screens:scr};
  }

  /* Small still images of one display (for list rows). One hidden renderer, cached per kind+finish. */
  let still=null;
  function ArxiStill(kind,finish,scenes){
    const T=window.THREE;if(!T||!window.ArxiMatrix)return Promise.resolve(null);
    if(!still){const r=newRenderer(T,null,{preserveDrawingBuffer:true});if(!r){still={dead:true};return Promise.resolve(null)}
      r.setPixelRatio(1);r.setSize(240,150,false);const scene=new T.Scene();lights(T,scene);const cam=new T.PerspectiveCamera(26,240/150,.1,100);
      still={r,scene,cam,cache:{},scr:{},sh:shadowTex(T)}}
    if(still.dead)return Promise.resolve(null);
    const key=kind+'-'+finish;if(still.cache[key])return still.cache[key];
    still.cache[key]=new Promise(res=>{
      if(!still.scr[kind])still.scr[kind]=makeScreen(T,44,kind==='panel'?22:11,scenes||[{lines:[{t:'10:42',c:'#F4F1FF'},{t:'68* CLEAR',c:['#FFB04A','#FF4FD8']},{t:'TUE OCT 28',c:'#3FE0FF'}],hold:99999}]);
      setTimeout(()=>{const s=still.scr[kind];s.tex.needsUpdate=true;const u=makeUnit(T,kind,s.tex,finish,still.sh);u.g.position.y=u.H/2;u.g.rotation.y=-.32;still.scene.add(u.g);
        const d=fitCam(T,still.cam,u.W*1.05,u.H*1.3,240/150);still.cam.position.set(d*.05,u.H*.5+d*.12,d);still.cam.lookAt(0,u.H*.5,0);
        still.r.render(still.scene,still.cam);const url=still.r.domElement.toDataURL('image/png');still.scene.remove(u.g);res(url)},250)});
    return still.cache[key];
  }

  /* Take-apart view of a Bar: frame, frosted diffuser, LED panel, controller, back shell. progress 0 = assembled, 1 = apart. */
  function ArxiExploded(stage,opts){
    const T=window.THREE;if(!T||!window.ArxiMatrix)return null;const renderer=newRenderer(T,stage);if(!renderer)return null;
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene=new T.Scene(),cam=new T.PerspectiveCamera(28,1,.1,200);lights(T,scene);const world=new T.Group();scene.add(world);
    const S=makeScreen(T,44,11,opts.scenes);
    const cols=44,rows=11,fw=4.4,fh=1.1,bez=.16,depth=.5,W=fw+bez*2,H=fh+(rows>11?.171:.085)*2,fin=FINS[opts.finish||'black'];
    /* back shell: an open tray */
    const back=new T.Group();
    const trayMat=new T.MeshStandardMaterial({color:fin.c,roughness:fin.r,metalness:fin.m});
    const base=new T.Mesh(new T.ExtrudeGeometry(roundedRect(T,W,H,.09),{depth:.05,bevelEnabled:false,curveSegments:10}),trayMat);base.position.z=-depth/2;back.add(base);
    const wallShape=roundedRect(T,W,H,.09);wallShape.holes.push(roundedRect(T,W-.08,H-.08,.06));
    const walls=new T.Mesh(new T.ExtrudeGeometry(wallShape,{depth:depth-.03,bevelEnabled:false,curveSegments:10}),trayMat);walls.position.z=-depth/2;back.add(walls);
    /* controller board */
    const board=new T.Group();
    const pcb=new T.Mesh(new T.BoxGeometry(1.3,.62,.035),new T.MeshStandardMaterial({color:0x1f6f4a,roughness:.6}));board.add(pcb);
    const chip=new T.Mesh(new T.BoxGeometry(.5,.36,.06),new T.MeshStandardMaterial({color:0xb8bec6,metalness:.8,roughness:.3}));chip.position.set(-.28,0,.045);board.add(chip);
    const sens=new T.Mesh(new T.BoxGeometry(.3,.22,.05),new T.MeshStandardMaterial({color:0x2a2d33,roughness:.5}));sens.position.set(.36,.08,.04);board.add(sens);
    board.position.set(.6,0,-.1);
    /* LED panel: live colour through a mask of round LEDs */
    const leds=new T.Group();
    leds.add(new T.Mesh(new T.PlaneGeometry(fw+.06,fh+.06),new T.MeshStandardMaterial({color:0xf2f2f2,roughness:.8})));
    const ledLit=new T.Mesh(new T.PlaneGeometry(fw,fh),new T.MeshBasicMaterial({map:S.tex}));ledLit.position.z=.002;leds.add(ledLit);
    const mc=document.createElement('canvas');mc.width=cols*16;mc.height=rows*16;const mg=mc.getContext('2d');mg.fillStyle='#e9eaec';mg.fillRect(0,0,mc.width,mc.height);
    mg.globalCompositeOperation='destination-out';for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){mg.beginPath();mg.arc(x*16+8,y*16+8,4.2,0,Math.PI*2);mg.fill()}
    const maskTex=new T.CanvasTexture(mc);maskTex.encoding=T.sRGBEncoding;
    const mask=new T.Mesh(new T.PlaneGeometry(fw,fh),new T.MeshStandardMaterial({map:maskTex,transparent:true,roughness:.7}));mask.position.z=.004;leds.add(mask);
    /* frosted diffuser */
    const difMat=new T.MeshStandardMaterial({color:0x000000,emissive:0xffffff,emissiveMap:S.tex,emissiveIntensity:1,transparent:true,opacity:1,roughness:.4});
    const diff=new T.Mesh(new T.PlaneGeometry(fw+.04,fh+.04),difMat);
    const frost=new T.Mesh(new T.PlaneGeometry(fw+.04,fh+.04),new T.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:0,roughness:.3}));frost.position.z=.002;
    const diffuser=new T.Group();diffuser.add(diff,frost);
    /* front frame */
    const ring=roundedRect(T,W,H,.09);ring.holes.push(roundedRect(T,fw+.02,fh+.02,.02));
    const frame=new T.Mesh(new T.ExtrudeGeometry(ring,{depth:.04,bevelEnabled:true,bevelThickness:.01,bevelSize:.01,bevelSegments:2,curveSegments:10}),trayMat);
    const LAY=[{o:frame,z0:depth/2-.04,z1:depth/2+2.3,label:'Frame'},{o:diffuser,z0:depth/2-.045,z1:depth/2+1.55,label:'Frosted diffuser'},
      {o:leds,z0:depth/2-.07,z1:depth/2+.8,label:'Full-color LED panel'},{o:board,z0:-.1,z1:.15,label:'Controller'},{o:back,z0:0,z1:-.4,label:'Back shell'}];
    LAY.forEach(l=>{world.add(l.o);l.o.position.z=l.z0});
    const labels=LAY.map(l=>{const e=document.createElement('span');e.className='xlabel';e.textContent=l.label;stage.appendChild(e);return e});
    let p=0,goal=0,manual=null;
    function size(){const r=stage.getBoundingClientRect();if(!r.width)return;renderer.setSize(r.width,r.height,false);cam.aspect=r.width/Math.max(1,r.height);cam.updateProjectionMatrix()}
    new ResizeObserver(size).observe(stage);size();
    function scrollGoal(){if(manual!==null)return manual;const r=stage.getBoundingClientRect(),vh=window.innerHeight||800;const c=(r.top+r.height/2)/vh;
      /* apart while the view sits mid-screen */ const t=1-Math.min(1,Math.abs(c-.5)/.42);return Math.max(0,Math.min(1,(t-.15)/.6))}
    let visible=true,raf=0,last=performance.now();
    new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible&&!raf)raf=requestAnimationFrame(loop)}).observe(stage);
    const v3=new T.Vector3();
    function loop(now){raf=0;if(!visible)return;const dt=Math.min(.05,(now-last)/1000);last=now;
      goal=reduce&&manual===null?0:scrollGoal();p+=(goal-p)*(reduce?1:Math.min(1,dt*4));const e=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
      LAY.forEach(l=>{l.o.position.z=l.z0+(l.z1-l.z0)*e});
      difMat.opacity=1-e*.35;frost.material.opacity=e*.45;difMat.emissiveIntensity=1-e*.55;
      world.rotation.y=-.62*e+Math.sin(now/5000)*.05*(1-e);world.rotation.x=.12*e;
      const r=stage.getBoundingClientRect(),aspect=r.width/Math.max(1,r.height),d=fitCam(T,cam,W+e*2.2,H+e*1.2,aspect);
      cam.position.set(e*1.2,.15+e*.6,d);cam.lookAt(e*.2,0,e*.6);
      S.tex.needsUpdate=true;renderer.render(scene,cam);
      LAY.forEach((l,i)=>{const el=labels[i];v3.set(-W/2+.1,H/2+.12,0);l.o.localToWorld(v3);v3.project(cam);
        el.style.transform='translate('+((v3.x*.5+.5)*r.width)+'px,'+((-v3.y*.5+.5)*r.height)+'px) translate(-10%,-100%)';el.style.opacity=Math.max(0,(e-.55)/.45).toFixed(2)});
      raf=requestAnimationFrame(loop)}
    raf=requestAnimationFrame(loop);
    return{toggle(){manual=(manual===null?(p>.5?0:1):(manual?0:1));return manual===1},release(){manual=null}};
  }

  /* Connected: a Panel and a Bar side by side with the hub between them. pulse(targets) sends light from the hub to each display. */
  function ArxiDuo(stage,opts){
    const T=window.THREE;if(!T||!window.ArxiMatrix)return null;const renderer=newRenderer(T,stage);if(!renderer)return null;
    renderer.domElement.style.cursor='grab';renderer.domElement.style.touchAction='pan-y';
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene=new T.Scene(),cam=new T.PerspectiveCamera(28,1,.1,200);lights(T,scene);const world=new T.Group();scene.add(world);const sh=shadowTex(T);
    const sp=makeScreen(T,44,22,[]),sb=makeScreen(T,44,11,[]);
    const P=makeUnit(T,'panel',sp.tex,opts.panelFinish||'white',sh),B=makeUnit(T,'bar',sb.tex,opts.barFinish||'black',sh);
    P.g.position.set(-2.7,P.H/2,0);P.g.rotation.y=.18;B.g.position.set(2.7,B.H/2,.35);B.g.rotation.y=-.18;world.add(P.g,B.g);
    const pScreen=P.g.children[2].material,bScreen=B.g.children[2].material;
    /* hub: a small puck with a status ring (illustrative) */
    const hub=new T.Group();
    const puck=new T.Mesh(new T.CylinderGeometry(.42,.46,.16,40),new T.MeshStandardMaterial({color:0xE9ECF0,roughness:.45}));puck.position.y=.08;hub.add(puck);
    const ringMat=new T.MeshBasicMaterial({color:0x3FE0FF,transparent:true,opacity:.55});
    const ring=new T.Mesh(new T.TorusGeometry(.3,.025,8,48),ringMat);ring.rotation.x=-Math.PI/2;ring.position.y=.165;hub.add(ring);
    const hs=new T.Mesh(new T.PlaneGeometry(1.4,1.4),new T.MeshBasicMaterial({map:sh,transparent:true,depthWrite:false}));hs.rotation.x=-Math.PI/2;hs.position.y=.002;hub.add(hs);
    hub.position.set(0,0,1.6);world.add(hub);
    /* pulses */
    const pulses=[];const dotGeo=new T.SphereGeometry(.1,16,12);
    function curve(to){const a=new T.Vector3(0,.25,1.6),c=to.clone(),m=a.clone().lerp(c,.5);m.y+=1.6;return new T.QuadraticBezierCurve3(a,m,c)}
    const tgt={panel:new T.Vector3(-2.7,P.H/2,.3),bar:new T.Vector3(2.7,B.H/2,.65)};
    let flash={panel:0,bar:0},ringT=0;
    /* discovery: rings sweep out from the hub across the floor, then the found display appears */
    const ripples=[];let barScale=1,barGoal=1,pendingFind=0;
    function discover(){barScale=0;barGoal=0;B.g.scale.setScalar(.001);B.g.visible=false;ringT=1;
      for(let i=0;i<3;i++){const r=new T.Mesh(new T.RingGeometry(.92,1,64),new T.MeshBasicMaterial({color:0x3FE0FF,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}));
        r.rotation.x=-Math.PI/2;r.position.set(0,.01,1.6);world.add(r);ripples.push({r,t:-i*.35})}
      pendingFind=reduce?.01:1.3}
    function pulse(list){ringT=1;(list||['panel','bar']).forEach((k,i)=>{if(!tgt[k])return;const c=curve(tgt[k]);
      for(let j=0;j<4;j++){const m=new T.Mesh(dotGeo,new T.MeshBasicMaterial({color:0x3FE0FF,transparent:true,opacity:1-j*.22}));m.scale.setScalar(1-j*.18);world.add(m);
        pulses.push({m,c,t:-(i*.25)-j*.05,k,head:j===0})}})}
    let visible=true,raf=0,last=performance.now(),yaw=0,pitch=0,drag=null,idle=9;
    const el=renderer.domElement;el.tabIndex=0;el.setAttribute('role','img');el.setAttribute('aria-label',opts.label||'3D render of a Panel and a Bar connected through the hub. Drag to turn.');
    el.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,yaw,pitch};el.setPointerCapture(e.pointerId);el.style.cursor='grabbing'});
    el.addEventListener('pointermove',e=>{if(!drag)return;yaw=Math.max(-.9,Math.min(.9,drag.yaw+(e.clientX-drag.x)*.006));pitch=Math.max(-.2,Math.min(.3,drag.pitch+(e.clientY-drag.y)*.004));idle=0});
    ['pointerup','pointercancel'].forEach(t=>el.addEventListener(t,()=>{drag=null;el.style.cursor='grab'}));
    function size(){const r=stage.getBoundingClientRect();if(!r.width)return;renderer.setSize(r.width,r.height,false);cam.aspect=r.width/Math.max(1,r.height);cam.updateProjectionMatrix()}
    new ResizeObserver(size).observe(stage);size();
    new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible&&!raf)raf=requestAnimationFrame(loop)}).observe(stage);
    const labels=(opts.labels||[]).map(l=>{const e=document.createElement('span');e.className='xlabel';e.textContent=l.t;stage.appendChild(e);return{e,k:l.k}});const v3=new T.Vector3();
    function loop(now){raf=0;if(!visible)return;const dt=Math.min(.05,(now-last)/1000);last=now;
      if(!drag&&!reduce){idle+=dt;if(idle>2.5){yaw+=(Math.sin(now/5200)*.22-yaw)*Math.min(1,dt*.8);pitch+=(0-pitch)*Math.min(1,dt)}}
      world.rotation.y=yaw;world.rotation.x=pitch*.5;
      for(let i=pulses.length-1;i>=0;i--){const p=pulses[i];p.t+=dt*(reduce?3:.95);
        if(p.t<0){p.m.visible=false;continue}p.m.visible=true;
        if(p.t>=1){if(p.head)flash[p.k]=1;world.remove(p.m);p.m.material.dispose();pulses.splice(i,1);continue}
        p.m.position.copy(p.c.getPoint(p.t))}
      for(let i=ripples.length-1;i>=0;i--){const q=ripples[i];q.t+=dt*(reduce?4:.8);if(q.t<0)continue;if(q.t>=1){world.remove(q.r);ripples.splice(i,1);continue}
        q.r.scale.setScalar(.3+q.t*4.2);q.r.material.opacity=(1-q.t)*.42}
      if(pendingFind>0){pendingFind-=dt;if(pendingFind<=0){barGoal=1;B.g.visible=true;pulse(['bar'])}}
      if(barScale!==barGoal){barScale+=(barGoal-barScale)*(reduce?1:Math.min(1,dt*5));if(Math.abs(barGoal-barScale)<.003)barScale=barGoal;B.g.scale.setScalar(Math.max(.001,barScale))}
      flash.panel*=Math.pow(.04,dt);flash.bar*=Math.pow(.04,dt);ringT*=Math.pow(.15,dt);
      pScreen.emissiveIntensity=1.05+flash.panel*.6;bScreen.emissiveIntensity=1.05+flash.bar*.6;
      ringMat.opacity=.35+ringT*.65+.1*Math.sin(now/600);
      const r=stage.getBoundingClientRect(),aspect=r.width/Math.max(1,r.height),d=fitCam(T,cam,9.6,2.9,aspect);
      cam.position.set(.3,1.25+d*.09,d);cam.lookAt(0,1.05,.5);
      sp.tex.needsUpdate=true;sb.tex.needsUpdate=true;renderer.render(scene,cam);
      labels.forEach(L=>{const u=L.k==='panel'?P:L.k==='bar'?B:null;if(u)v3.set(-u.W/2+.1,u.H/2+.18,0).applyMatrix4(u.g.matrixWorld);else v3.set(0,-.05,.5).applyMatrix4(hub.matrixWorld);
        v3.project(cam);L.e.style.opacity=L.k==='bar'?Math.max(0,(barScale-.6)/.4):1;L.e.style.transform='translate('+((v3.x*.5+.5)*r.width)+'px,'+((-v3.y*.5+.5)*r.height)+'px) '+(L.k==='hub'?'translate(-50%,0)':'translate(0,-100%)')});
      raf=requestAnimationFrame(loop)}
    raf=requestAnimationFrame(loop);
    return{panel:sp.mx,bar:sb.mx,pulse,discover};
  }
  window.ArxiDuo=ArxiDuo;
  window.ArxiLineup=ArxiLineup;window.ArxiStill=ArxiStill;window.ArxiExploded=ArxiExploded;
})();
