/* ARXI LED matrix preview, full RGB. ArxiMatrix(canvas,{w,h,onLabel}) -> {setScenes(list), setSize(w,h), size()}
   Scene: {label, lines:[{t,c}], icon, iconColor, dim, hold, fx, fxColors}
   Line colour c: '#hex' | 'sung' (lyrics: the song's own colour, words light up as they are sung) | 'song' (the song's colour)
                  | ['#a','#b'] (gradient) | 'team' (team colours by abbreviation). 'flow'/'rainbow' are old names for 'song'.
   fx (drawn behind text; full strength when a scene has no text), each modelled on the firmware (ARXIv2):
     'viz'      the music: on a Bar, the style background moving with the beat (Carbon sweep + sparkles);
                on a Panel, the 'bars' visualizer from its own mic
     'ambient'  the Vibrant style field in one hue      'sunrise' the wake-up light (night, dawn, day; the sun rises)
     'burst'/'touchdown'  the touchdown moment: team-colour stripes sweep in, then rings burst in team colours
     'wash'     Screen colours: your colour as the backdrop at a quarter strength */
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
      if(/touchdown|celebrat/i.test(L))s.fx='burst';
      else if(/sunrise|morning|wake/i.test(L))s.fx='sunrise';
      else if(/in sync|ambient|party|sound/i.test(L))s.fx='viz';
    }
    if(s.lines&&!s.dim){s.lines=s.lines.map((l,i)=>{if(!l||!l.t)return l;
      if((!l.c||l.c==='flow')&&/lyric/i.test(L)&&i===Math.min(1,s.lines.length-1))return Object.assign({},l,{c:'sung'});
      if(!l.c&&/now playing|any app/i.test(L)&&i===Math.min(1,s.lines.length-1))return Object.assign({},l,{c:'song'});
      if(/score|game|matchup|scoreboard/i.test(L)&&/^[A-Z]{2,4} /.test(l.t)&&TEAM[l.t.split(' ')[0]]&&(!l.c||l.c===C.WH||l.c===C.CY||l.c===C.AMB||l.c==='#F4EEE4'||l.c==='#62D2DE'||l.c==='#FFB04A'))return Object.assign({},l,{c:'team'});
      return l})}
    return s;
  }
  function ArxiMatrix(canvas,opts){
    opts=opts||{};
    let W=opts.w||44,H=opts.h||11,scenes=[],idx=0,t0=performance.now(),raf=0,grid=[],bars=[];
    const ctx=canvas.getContext('2d');
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function colorAt(c,x,i,n,el,info){
      if(Array.isArray(c))return mix(c[0],c[1],Math.max(0,Math.min(1,x/W)));
      if(c==='flow'||c==='rainbow'||c==='song')return hsl(info.hue,80,62);
      if(c==='sung'){ /* the firmware's lyric colours: sung words bright, the rest of the line dim, in the song's hue */
        const sung=info.scroll?x<W*.55:i<n*Math.min(1,(el%4200)/3400);
        return sung?hsl(info.hue,70,86):hsl(info.hue,55,34)}
      return c;
    }
    const songHue=t=>{let h=2166136261;for(const ch of String(t)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0}return h%360};
    function blit(s,x,y,col,el,scroll){
      const up=String(s).toUpperCase();let team=null;const info={hue:songHue(up),scroll:!!scroll};
      if(col==='team'){const first=up.split(' ')[0];team={len:first.length,c:TEAM[first]||C.WH}}
      let ci=0;
      for(const ch of up){const g=F[ch]||F[' '];
        const c0=team?(ci<team.len?team.c:C.WH):null;
        for(let r=0;r<5;r++)for(let c=0;c<3;c++){if(g[r]&(4>>c)){const px=x+c,py=y+r;if(px>=0&&px<W&&py>=0&&py<H)grid[py*W+px]=c0||colorAt(col,px,ci,up.length,el,info)}}
        x+=4;ci++}
    }
    const rows=()=>H>11?[1,8,15]:[0,6];
    function dur(sc){let d=sc.hold||3600;if(!reduce)(sc.lines||[]).forEach(l=>{if(l&&l.t&&textW(l.t)>W)d=Math.max(d,(textW(l.t)+W+8)*70)});return d}
    function fx(sc,el,k){
      const t=el/1000;
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){let col=null;
        const hue=sc._hue!=null?sc._hue:(sc._hue=songHue(sc.label||''));
        if(sc.fx==='viz'&&H<=11){ /* Bar: the style background with the music (firmware carbonMusicField): a dark weave, a sweep of colour on each beat, sparkles */
          const wv=((x+y)&3)===0?26:((x+40-y)&3)===0?16:8;let r=wv,g=wv+1,b=wv+4;
          const beat=(t*112/60)%1,sp=beat*1.6;const head=sp*(W+H/2+12)-2,d=head-(x+(y>>1));
          if(sp<1&&d>=0&&d<10){const v=(1-d/10)*.85;const c=hslToRgb(hsl(hue,100,50)).match(/\d+/g).map(Number);r+=c[0]*v;g+=c[1]*v;b+=c[2]*v}
          if(((x*7+y*13+Math.floor(t*4))%37)===0){r=190;g=205;b=235}
          col='rgb('+[r,g,b].map(v=>Math.min(255,Math.round(v))).join(',')+')'}
        else if(sc.fx==='viz'){ /* Panel: the 'bars' visualizer, 16 bands from its own mic, in the theme's colour ramp */
          if(!bars.length||bars.length!==16)bars=new Array(16).fill(0);
          const band=Math.floor(x*16/W);
          if(y===0&&x%Math.ceil(W/16)===0){const beat=Math.exp(-((t*112/60)%1)*5);const target=(band<4?.35+.6*beat:.25+.45*(.5+.5*Math.sin(t*2.1*(1+band*.37)+band)))*H;bars[band]+=(target-bars[band])*.4}
          const hgt=bars[band];if(H-1-y<hgt&&(x%Math.ceil(W/16))<Math.ceil(W/16)-1)col=hsl(hue+((H-1-y)/H)*40,90,52+((H-1-y)/H)*14)}
        else if(sc.fx==='ambient'){ /* the Vibrant style field: one hue, slow waves, a few sparks */
          const a=Math.sin(x*.17+t*.9),b=Math.sin(y*.55+x*.07-t*.7);const v=.25+.35*((a*.5+.5)*(b*.25+.75));col=hsl(hue+a*8,85,v*60)}
        else if(sc.fx==='sunrise'){ /* the wake-up light (firmware sunScene): night to day, dawn at the horizon, the sun rising */
          const p=Math.min(1,(t%14)/11),hz=H-3,dawn=Math.max(0,1-Math.abs(p-.35)/.35);
          const lerp=(a,b,k)=>a.map((v,i)=>v+(b[i]-v)*k),night=[1,1,10],dayc=[40,140,255],dn=[255,60,0];let c;
          if(y>hz)c=lerp([4,3,8],[220,70,10],y===hz+1?dawn*.78:0).map(v=>v*(.14+p*.27));
          else{const rf=y/hz;c=lerp(lerp(night,dayc,p),dn,Math.min(1,dawn*(.25+.75*rf)*1.4)*.9)}
          const sy=(hz+1)-p*(hz+2),dd=Math.hypot(x-W/2,(y-sy)*1.0);
          if(dd<=3&&y<=hz){const core=lerp(lerp([220,20,0],[255,140,10],Math.min(1,p*2.2)),[255,250,220],Math.max(0,Math.min(1,(p-.45)*2.5)));const k=dd<=1.5?1:dd<=2.3?.6:.25;c=c.map((v,i)=>Math.min(255,v*(1-k)+core[i]*k))}
          col='rgb('+c.map(v=>Math.round(v)).join(',')+')'}
        else if(sc.fx==='burst'||sc.fx==='touchdown'){ /* the touchdown (firmware floodFrom + burst): stripes in team colours sweep in, then rings burst */
          const P=sc._team||(sc._team=teamOf(sc)),A=mix(P,'#000000',.55),cyc=(t*1000)%5400;
          if(cyc<2400){const front=Math.min(W,cyc*W/800),xx=W-1-x;if(xx<front)col=(((xx+Math.floor(cyc/70))/3|0)&1)?P:A}
          else{col=mix(P,'#000000',.9);const cc=(cyc-2400)%1800;
            for(let b=0;b<3;b++){const cx=W*(8+b*14)/44,cy=H*(3+(b&1)*3)/11,r=Math.min(9,((cc+b*550)%1800)/130)*W/44;const d=Math.hypot(x-cx,(y-cy)*2);
              if(Math.abs(d-r)<.8)col=b===0?P:b===1?A:'#FFFFFF'}}}
        else if(sc.fx==='wash'){ /* Screen colours (My colours): your colour as the backdrop at a quarter */
          const cs=sc.fxColors||['#FF4FD8'];col=mix(cs[0],'#000000',.75)}
        if(col)grid[y*W+x]=k<1?scale(col.startsWith('hsl')?hslToRgb(col):col,k):col}
    }
    function teamOf(sc){if(sc.team&&TEAM[sc.team])return TEAM[sc.team];for(const l of sc.lines||[]){const a=String(l&&l.t||'').split(' ');for(const w of a)if(TEAM[w]&&w.length>1)return TEAM[w]}return C.GRN}
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
        blit(l.t,x,ys[i],sc.dim?C.DIM:(l.c||C.WH),el,tw>W)});
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
  ArxiMatrix.C=C;ArxiMatrix.TEAM=TEAM;ArxiMatrix.FONT=F;ArxiMatrix.SPR=SPR;
  window.ArxiMatrix=ArxiMatrix;
})();
