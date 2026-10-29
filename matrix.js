/* ARXI LED matrix preview, full RGB. ArxiMatrix(canvas,{w,h,onLabel}) -> {setScenes(list), setSize(w,h), size()}
   Scene: {label, lines:[{t,c}], icon, iconColor, dim, hold, fx, fxColors}
   Line colour c: '#hex' | 'flow' (moving spectrum) | 'rainbow' | ['#a','#b'] (gradient) | 'team' (team colours by abbreviation)
   fx: 'viz' | 'ambient' | 'sunrise' | 'burst' | 'wash'  (drawn behind text; full strength when a scene has no text) */
(function(){
  const F={'0':[7,5,5,5,7],'1':[2,6,2,2,7],'2':[7,1,7,4,7],'3':[7,1,3,1,7],'4':[5,5,7,1,1],'5':[7,4,7,1,7],'6':[7,4,7,5,7],'7':[7,1,1,2,2],'8':[7,5,7,5,7],'9':[7,5,7,1,7],
  A:[2,5,7,5,5],B:[6,5,6,5,6],C:[3,4,4,4,3],D:[6,5,5,5,6],E:[7,4,6,4,7],F:[7,4,6,4,4],G:[3,4,5,5,3],H:[5,5,7,5,5],I:[7,2,2,2,7],J:[1,1,1,5,2],K:[5,5,6,5,5],L:[4,4,4,4,7],M:[5,7,7,5,5],N:[6,5,5,5,5],O:[2,5,5,5,2],P:[6,5,6,4,4],Q:[2,5,5,7,3],R:[6,5,6,5,5],S:[3,4,2,1,6],T:[7,2,2,2,2],U:[5,5,5,5,7],V:[5,5,5,5,2],W:[5,5,7,7,5],X:[5,5,2,5,5],Y:[5,5,2,2,2],Z:[7,1,2,4,7],
  ':':[0,2,0,2,0],'-':[0,0,7,0,0],'.':[0,0,0,0,2],"'":[2,2,0,0,0],'*':[2,5,2,0,0],'/':[1,1,2,4,4],'?':[7,1,3,0,2],'%':[5,1,2,4,5],'>':[4,2,1,2,4],'+':[0,2,7,2,0],'!':[2,2,2,0,2],',':[0,0,0,2,4],'@':[7,5,7,4,7],'#':[5,7,5,7,5],'&':[2,5,2,5,3],' ':[0,0,0,0,0]};
  /* colour sprites: each char is a palette key, '.' is off */
  const SPR={
    star:{p:{y:'#FFD23F',o:'#FF9F1C'},m:['..y..','.yyy.','yyoyy','.yyy.','.y.y.']},
    note:{p:{m:'#FF4FD8',v:'#8B5CFF'},m:['..vvv','..v.v','..v.v','mmv.v','mm.mm']},
    sun:{p:{y:'#FFE14D',o:'#FF8A1F'},m:['o.o.o','.yyy.','oyyyo','.yyy.','o.o.o']},
    moon:{p:{w:'#DDE7FF',b:'#7FA6FF'},m:['.ww..','wb...','wb...','wb...','.ww..']},
    drop:{p:{b:'#3FA9FF',c:'#9FE3FF'},m:['..b..','.bcb.','bcbbb','bbbbb','.bbb.']},
    bolt:{p:{y:'#FFE600',o:'#FFB000'},m:['..yy.','.yy..','yyyy.','..oo.','.oo..']},
    ball:{p:{o:'#FF7A1A',d:'#7A2E00'},m:['.ooo.','odode','ododo','odedo','.ooo.'].map(r=>r.replace(/e/g,'o'))},
    alert:{p:{r:'#FF3B30',y:'#FFD60A'},m:['..r..','.ryr.','.ryr.','rrrrr','rryrr']},
    bus:{p:{y:'#FFC21A',b:'#5AC8FA',k:'#333'},m:['yyyyy','ybyby','yyyyy','yyyyy','.k.k.']},
    cal:{p:{r:'#FF453A',w:'#F2F2F7'},m:['r...r','rrrrr','w...w','w.r.w','wwwww']},
    up:{p:{g:'#34C759'},m:['..g..','.ggg.','g.g.g','..g..','..g..']},
    heart:{p:{r:'#FF2D55',p:'#FF8FAB'},m:['.r.r.','rprrr','rrrrr','.rrr.','..r..']}
  };
  const C={AMB:'#FFB04A',CY:'#3FE0FF',WH:'#F4F1FF',RED:'#FF3B5C',GRN:'#38F28A',DIM:'#6A5A44',PNK:'#FF4FD8',VIO:'#8B5CFF',YEL:'#FFE14D',ORG:'#FF7A1A',BLU:'#3D7BFF'};
  /* bright, LED-friendly team colours */
  const TEAM={NYG:'#3D7BFF',PHI:'#00C2A8',DAL:'#5AA9FF',WAS:'#FF4B4B',KC:'#FF2D3D',BUF:'#2F7BFF',DET:'#2FA8FF',GB:'#FFC72C',CHI:'#FF7A1A',MIN:'#9A5CFF',SF:'#FF3B30',SEA:'#69BE28',LAR:'#FFD100',ARI:'#FF2D55',NE:'#FF4B5C',MIA:'#00D1C1',NYJ:'#2FD27A',BAL:'#9A5CFF',PIT:'#FFC21A',CIN:'#FF7A1A',CLE:'#FF6A13',DEN:'#FF7A1A',LV:'#C9CED6',LAC:'#2FB7FF',HOU:'#FF3B5C',IND:'#3D8BFF',JAX:'#00B7C8',TEN:'#5AC8FA',ATL:'#FF3B30',CAR:'#2FB7FF',NO:'#E8C47A',TB:'#FF3B30',
    BOS:'#2FD27A',NYK:'#FF7A1A',CHA:'#00C2C8',LAL:'#FFC72C',GSW:'#FFC72C',OKC:'#2FA8FF',MIL:'#46C46A',PHX:'#FF7A1A',UTAH:'#9A5CFF',UTA:'#9A5CFF',LSU:'#B05CFF',AUB:'#FF7A1A',UCF:'#FFC72C'};
  const textW=s=>s.length*4-1;
  const hsl=(h,s,l)=>'hsl('+((h%360)+360)%360+','+s+'%,'+l+'%)';
  function hexRGB(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return[n>>16&255,n>>8&255,n&255]}
  function mix(a,b,t){const A=hexRGB(a),B=hexRGB(b);return'rgb('+A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(',')+')'}
  function scale(col,k){if(!col)return col;let r,g,b;
    if(col[0]==='#'){[r,g,b]=hexRGB(col)}else if(col.startsWith('rgb')){[r,g,b]=col.match(/\d+/g).map(Number)}else return col;
    return'rgb('+[r,g,b].map(v=>Math.round(v*k)).join(',')+')'}
  /* label-based defaults so every page shows the screens in full colour */
  function auto(sc){
    if(sc._auto)return sc;const s=Object.assign({},sc,{_auto:true}),L=String(sc.label||'');
    if(!s.fx){
      if(/touchdown|celebrat|goal|win/i.test(L))s.fx='burst';
      else if(/sunrise|morning|wake/i.test(L))s.fx='sunrise';
      else if(/in sync|ambient|party|sound/i.test(L))s.fx='viz';
    }
    if(s.lines&&!s.dim){s.lines=s.lines.map((l,i)=>{if(!l||!l.t)return l;
      if(!l.c&&/lyric|now playing|any app/i.test(L)&&i===Math.min(1,s.lines.length-1))return Object.assign({},l,{c:'flow'});
      if(/score|game|matchup|scoreboard/i.test(L)&&/^[A-Z]{2,4} /.test(l.t)&&TEAM[l.t.split(' ')[0]]&&(!l.c||l.c===C.WH||l.c===C.CY||l.c===C.AMB||l.c==='#F4EEE4'||l.c==='#62D2DE'||l.c==='#FFB04A'))return Object.assign({},l,{c:'team'});
      return l})}
    return s;
  }
  function ArxiMatrix(canvas,opts){
    opts=opts||{};
    let W=opts.w||44,H=opts.h||11,scenes=[],idx=0,t0=performance.now(),raf=0,grid=[],bars=[];
    const ctx=canvas.getContext('2d');
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function colorAt(c,x,i,n,el){
      if(Array.isArray(c))return mix(c[0],c[1],Math.max(0,Math.min(1,x/W)));
      if(c==='flow')return hsl(x*7-el/12,95,62);
      if(c==='rainbow')return hsl(x*8,95,60);
      return c;
    }
    function blit(s,x,y,col,el){
      const up=String(s).toUpperCase();let team=null;
      if(col==='team'){const first=up.split(' ')[0];team={len:first.length,c:TEAM[first]||C.WH}}
      let ci=0;
      for(const ch of up){const g=F[ch]||F[' '];
        const c0=team?(ci<team.len?team.c:C.WH):null;
        for(let r=0;r<5;r++)for(let c=0;c<3;c++){if(g[r]&(4>>c)){const px=x+c,py=y+r;if(px>=0&&px<W&&py>=0&&py<H)grid[py*W+px]=c0||colorAt(col,px,ci,up.length,el)}}
        x+=4;ci++}
    }
    const rows=()=>H>11?[1,8,15]:[0,6];
    function dur(sc){let d=sc.hold||3600;if(!reduce)(sc.lines||[]).forEach(l=>{if(l&&l.t&&textW(l.t)>W)d=Math.max(d,(textW(l.t)+W+8)*70)});return d}
    function fx(sc,el,k){
      const t=el/1000;
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){let col=null;
        if(sc.fx==='viz'){if(!bars.length||bars.length!==W)bars=new Array(W).fill(0);
          if(y===0){const target=(Math.sin(x*.55+t*5.3)*.5+.5)*(Math.sin(x*.17-t*2.1)*.5+.5)*H*1.1+Math.random()*1.5;bars[x]+=(target-bars[x])*.35}
          const hgt=bars[x];if(H-1-y<hgt)col=hsl(x*8+t*40,95,58-((H-1-y)/H)*8)}
        else if(sc.fx==='ambient'){const v=Math.sin(x*.18+t*.7)+Math.sin(y*.35-t*.5)+Math.sin((x+y)*.12+t*.4);col=hsl(200+v*55+t*12,85,48)}
        else if(sc.fx==='sunrise'){const f=y/(H-1),p=(Math.sin(t*.6)*.5+.5)*.15;col=mix('#3B1C6E','#FF8A1F',Math.min(1,f+p));if(f>.75)col=mix('#FF8A1F','#FFD86B',(f-.75)*4)}
        else if(sc.fx==='burst'){const cx=W/2,cy=H/2,d=Math.hypot((x-cx)*.6,y-cy),ring=(t*14)%(W*.6);
          if(Math.abs(d-ring)<1.2)col=hsl(d*18+t*90,100,60);else if(Math.random()<.03)col=hsl(Math.random()*360,100,65)}
        else if(sc.fx==='wash'){const cs=sc.fxColors||['#FF4FD8','#3FE0FF'];col=mix(cs[0],cs[1],(Math.sin(x*.12-t*1.2)*.5+.5))}
        if(col)grid[y*W+x]=k<1?scale(col.startsWith('hsl')?hslToRgb(col):col,k):col}
    }
    function hslToRgb(s){const [h,sa,l]=s.match(/[\d.]+/g).map(Number);const S=sa/100,Lg=l/100,a=S*Math.min(Lg,1-Lg),f=n=>{const k=(n+h/30)%12;return Lg-a*Math.max(-1,Math.min(k-3,9-k,1))};
      return'rgb('+[f(0),f(8),f(4)].map(v=>Math.round(v*255)).join(',')+')'}
    function render(now){
      let sc=scenes[idx];if(!sc)return;sc=auto(sc);
      const el=now-t0,ys=rows();grid=new Array(W*H).fill(null);
      const hasText=(sc.lines||[]).some(l=>l&&l.t);
      if(sc.fx&&!sc.dim)fx(sc,el,hasText?.28:1);
      (sc.lines||[]).slice(0,ys.length).forEach((l,i)=>{if(!l||!l.t)return;const tw=textW(l.t);let x=0;
        if(tw>W)x=reduce?0:W-Math.floor(el/70)%(tw+W+8);
        /* clear a dark band behind text so it stays readable over effects */
        if(sc.fx&&!sc.dim)for(let r=-0;r<5;r++)for(let c=Math.max(0,x-1);c<Math.min(W,x+tw+1);c++){const yy=ys[i]+r;if(yy<H)grid[yy*W+c]=null}
        blit(l.t,x,ys[i],sc.dim?C.DIM:(l.c||C.WH),el)});
      if(sc.icon&&SPR[sc.icon]){const sp=SPR[sc.icon];
        sp.m.forEach((row,r)=>[...row].forEach((ch,c)=>{if(ch!=='.'){const y=ys[0]+r,x=W-5+c;if(y<H){let col=sc.iconColor&&sc.iconColor!=='auto'&&!/^#?(62D2DE|3FE0FF)$/i.test(sc.iconColor)?sc.iconColor:sp.p[ch];if(sc.dim)col=C.DIM;grid[y*W+x]=col}}}))}
      paint(sc.dim);
    }
    const off=document.createElement('canvas'),ox=off.getContext('2d');
    /* the panel sits behind a frosted diffuser: draw each pixel as a soft square of light, not a bare LED */
    function paint(dim){
      const cw=canvas.clientWidth;if(!cw)return;
      const dpr=window.devicePixelRatio||1,pw=Math.round(cw*dpr),ph=Math.round(cw*H/W*dpr);
      if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph}
      if(off.width!==W||off.height!==H){off.width=W;off.height=H}
      ox.globalAlpha=1;ox.fillStyle='#0E1014';ox.fillRect(0,0,W,H);
      ox.globalAlpha=dim?.5:1;
      for(let i=0;i<W*H;i++){const col=grid[i];if(col){ox.fillStyle=col;ox.fillRect(i%W,(i/W)|0,1,1)}}
      ox.globalAlpha=1;
      const cell=canvas.width/W;
      ctx.save();ctx.imageSmoothingEnabled=false;
      ctx.fillStyle='#0A0B0E';ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.filter='blur('+(cell*.2).toFixed(1)+'px)';ctx.drawImage(off,0,0,canvas.width,canvas.height);
      ctx.globalCompositeOperation='lighter';ctx.globalAlpha=dim?.15:.32;ctx.filter='blur('+(cell*.85).toFixed(1)+'px)';ctx.drawImage(off,0,0,canvas.width,canvas.height);
      ctx.restore();
      /* faint baffle lines between pixels, as seen through the diffuser */
      ctx.save();ctx.strokeStyle='rgba(0,0,0,.28)';ctx.lineWidth=Math.max(1,cell*.07);ctx.beginPath();
      for(let x=1;x<W;x++){ctx.moveTo(x*cell,0);ctx.lineTo(x*cell,canvas.height)}
      for(let y=1;y<H;y++){ctx.moveTo(0,y*cell);ctx.lineTo(canvas.width,y*cell)}
      ctx.stroke();ctx.restore();
    }
    function emit(){if(opts.onLabel&&scenes[idx])opts.onLabel(scenes[idx].label||'',idx,scenes.length)}
    function loop(now){
      if(!scenes.length)return;
      if(scenes.length>1&&now-t0>dur(scenes[idx])){idx=(idx+1)%scenes.length;t0=now;emit()}
      render(now);raf=requestAnimationFrame(loop);
    }
    function start(){cancelAnimationFrame(raf);if(reduce)render(performance.now()+1500);else raf=requestAnimationFrame(loop)}
    if(reduce)canvas.addEventListener('click',()=>{if(scenes.length>1){idx=(idx+1)%scenes.length;emit();render(performance.now()+1500)}});
    window.addEventListener('resize',()=>render(performance.now()));
    return{
      setScenes(list){scenes=list||[];idx=0;t0=performance.now();emit();start()},
      setSize(w,h){W=w;H=h;bars=[];t0=performance.now();start()},
      show(i){if(scenes[i]){idx=i;t0=performance.now();emit();start()}},
      size(){return{w:W,h:H}}
    };
  }
  ArxiMatrix.C=C;ArxiMatrix.TEAM=TEAM;
  window.ArxiMatrix=ArxiMatrix;
})();
