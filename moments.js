/* ARXI moments: samples of the animations that are on the displays, alone and together.
   ArxiMoments(root) builds a picker (moment x Bar alone / Panel alone / Together) and plays each one.
   Every frame here is drawn from the firmware (ARXIv2): the 44x11 Bar's lib/arxi_hud and the second screen's
   lib/arxi_companion, laid out for the Panel's 44x22. Needs matrix.js (for the font). */
(function(){
  const PI=Math.PI,clamp=(v,a,b)=>v<a?a:v>b?b:v,ease=k=>{k=clamp(k,0,1);return k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2};
  const sc=(c,k)=>[c[0]*k,c[1]*k,c[2]*k],mixc=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];
  function h2r(h,s,l){h=((h%360)+360)%360;s/=100;l/=100;const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1))};return[f(0)*255,f(8)*255,f(4)*255]}
  const hash=n=>{n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);return(n^(n>>>16))>>>0},rnd=i=>hash(i*2654435761+7)/4294967296;
  const WHITE=[255,255,255],BLACK=[0,0,0];

  /* ---- a small canvas of light ---- */
  function Grid(W,H){this.W=W;this.H=H;this.p=new Float32Array(W*H*3)}
  Grid.prototype={
    clear(){this.p.fill(0)},
    set(x,y,c,a){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=this.W||y>=this.H)return;const i=(y*this.W+x)*3;a=a==null?1:a;
      for(let k=0;k<3;k++)this.p[i+k]=a>=1?c[k]:this.p[i+k]+(c[k]-this.p[i+k])*a},
    add(x,y,c){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=this.W||y>=this.H)return;const i=(y*this.W+x)*3;for(let k=0;k<3;k++)this.p[i+k]=Math.min(255,this.p[i+k]+c[k])},
    get(x,y){const i=(y*this.W+x)*3;return[this.p[i],this.p[i+1],this.p[i+2]]},
    fill(c,a){for(let y=0;y<this.H;y++)for(let x=0;x<this.W;x++)this.set(x,y,c,a)},
    rect(x0,y0,x1,y1,c,a){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)this.set(x,y,c,a)},
    disc(cx,cy,r,c,a){for(let y=Math.floor(cy-r);y<=Math.ceil(cy+r);y++)for(let x=Math.floor(cx-r);x<=Math.ceil(cx+r);x++)if((x-cx)*(x-cx)+(y-cy)*(y-cy)<=r*r)this.set(x,y,c,a)},
    line(x0,y0,x1,y1,c){const n=Math.max(1,Math.ceil(Math.max(Math.abs(x1-x0),Math.abs(y1-y0))));for(let i=0;i<=n;i++)this.set(x0+(x1-x0)*i/n,y0+(y1-y0)*i/n,c)},
    text(s,x,y,c,k,a){k=k||1;const F=window.ArxiMatrix.FONT;for(const ch of String(s).toUpperCase()){const g=F[ch]||F[' '];
      for(let r=0;r<5;r++)for(let q=0;q<3;q++)if(g[r]&(4>>q))for(let dy=0;dy<k;dy++)for(let dx=0;dx<k;dx++)this.set(x+q*k+dx,y+r*k+dy,typeof c==='function'?c(x+q*k):c,a);x+=4*k}},
    tw(s,k){return(String(s).length*4-1)*(k||1)},
    textC(s,y,c,k,a){this.text(s,Math.floor((this.W-this.tw(s,k))/2),y,c,k,a)},
    outlineC(s,y,c,k){const x=Math.floor((this.W-this.tw(s,k))/2);[[-1,0],[1,0],[0,-1],[0,1]].forEach(([dx,dy])=>this.text(s,x+dx,y+dy,BLACK,k));this.text(s,x,y,c,k)},
    shift(ox,oy){if(!ox&&!oy)return;const q=new Float32Array(this.p.length);for(let y=0;y<this.H;y++)for(let x=0;x<this.W;x++){const sx=x-ox,sy=y-oy;if(sx<0||sy<0||sx>=this.W||sy>=this.H)continue;const a=(y*this.W+x)*3,b=(sy*this.W+sx)*3;q[a]=this.p[b];q[a+1]=this.p[b+1];q[a+2]=this.p[b+2]}this.p=q}
  };

  /* the diffuser: each pixel a soft square of light (same look as matrix.js) */
  function paint(canvas,g){
    const cw=canvas.clientWidth;if(!cw)return;const W=g.W,H=g.H,dpr=window.devicePixelRatio||1,pw=Math.round(cw*dpr),ph=Math.round(cw*H/W*dpr);
    if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph}
    const off=canvas._off||(canvas._off=document.createElement('canvas'));if(off.width!==W||off.height!==H){off.width=W;off.height=H}
    const ox=off.getContext('2d'),img=ox.createImageData(W,H);
    for(let i=0;i<W*H;i++){const r=g.p[i*3],gg=g.p[i*3+1],b=g.p[i*3+2];img.data[i*4]=r?r:14;img.data[i*4+1]=gg?gg:16;img.data[i*4+2]=b?b:20;img.data[i*4+3]=255}
    ox.putImageData(img,0,0);const ctx=canvas.getContext('2d'),cell=canvas.width/W;
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle='#0A0B0E';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.filter='blur('+(cell*.2).toFixed(1)+'px)';ctx.drawImage(off,0,0,canvas.width,canvas.height);
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.32;ctx.filter='blur('+(cell*.85).toFixed(1)+'px)';ctx.drawImage(off,0,0,canvas.width,canvas.height);ctx.restore();
    ctx.save();ctx.strokeStyle='rgba(0,0,0,.28)';ctx.lineWidth=Math.max(1,cell*.07);ctx.beginPath();
    for(let x=1;x<W;x++){ctx.moveTo(x*cell,0);ctx.lineTo(x*cell,canvas.height)}for(let y=1;y<H;y++){ctx.moveTo(0,y*cell);ctx.lineTo(canvas.width,y*cell)}ctx.stroke();ctx.restore();
  }

  /* ---- shared pieces ---- */
  function weave(g,hue,t,level){ /* the Carbon style's weave, a sweep of colour on each beat (112 bpm), sparkles */
    const beat=(t/1000*112/60)%1,sp=beat*1.6,col=h2r(hue,100,50);
    for(let y=0;y<g.H;y++)for(let x=0;x<g.W;x++){const wv=((x+y)&3)===0?26:((x+40-y)&3)===0?16:8;let c=[wv,wv+1,wv+4];
      const d=sp*(g.W+g.H/2+12)-2-(x+(y>>1));if(sp<1&&d>=0&&d<10)c=c.map((v,i)=>v+col[i]*(1-d/10)*.8);
      g.set(x,y,sc(c,level))}
    for(let i=0;i<4;i++){const k=Math.floor(t/150)+i*13;g.set((k*19+i*29)%g.W,(k*5+i*3)%g.H,sc([190,205,235],level))}
  }
  function board3(g,rows){rows.forEach(([s,c],i)=>g.text(s,2,1+i*7,c))}
  function confetti(g,tt,a,b){for(let i=0;i<34;i++){const x=rnd(i)*g.W+Math.sin(tt*3+i)*1.5,y=(tt*11*(0.7+rnd(i+50)*.6)+rnd(i+90)*g.H)%(g.H+2)-1;g.set(x,y,i%3===0?WHITE:i&1?a:b)}}
  function cloud(g,cx,cy,s,top,bot){g.disc(cx,cy+1,2.6*s,bot);g.disc(cx+3*s,cy,3*s,top);g.disc(cx+6.5*s,cy+1,2.4*s,bot);g.rect(Math.round(cx-1),Math.round(cy+1),Math.round(cx+7.5*s),Math.round(cy+2.6*s),bot)}
  function rain(g,t,n,sp,col,slant){for(let i=0;i<n;i++){const x=rnd(i*13+1)*g.W,y=((t/1000)*sp*(.8+rnd(i*7)*.5)+rnd(i*5)*(g.H+4))%(g.H+4)-2;g.add(x-y*slant,y,col)}}

  /* ---- the moments ---- */
  const PHI=[0,194,168],PHIA=[150,160,165],NYG=[61,123,255],BOS=[47,210,122],BOSA=[220,235,225],NYK=[255,122,26],BALL=[255,120,20];
  const M=[
  { id:'td',name:'Touchdown',period:8600,
    text:{bar:'The Bar plays the whole moment: the scoring team’s colours sweep in, TOUCHDOWN, rings burst in team colours, then the score.',
          panel:'On its own, the Panel plays the same moment with more room, and ends on a three-line scoreboard.',
          both:'The hub starts both at the same instant. The Bar calls it in words while the Panel shows the play: the run into the end zone, a colour wipe, TD and confetti. They land on the score together.'},
    extra:'With Volt switched on, ARXI’s character struts across the Bar and spikes the ball on the Panel.',
    bar(g,t){g.clear();
      if(t<2400){const front=Math.min(44,t*44/800);for(let xx=0;xx<front;xx++){const x=43-xx,c=(((xx+Math.floor(t/70))/3|0)&1)?PHI:PHIA;for(let y=0;y<11;y++)g.set(x,y,c)}if(t>500)g.outlineC('TOUCHDOWN',3,WHITE)}
      else if(t<5400){const u=t-2400;g.fill(sc(PHI,.1));const cyc=u%1800;
        for(let b=0;b<3;b++){const cx=8+b*14,cy=3+(b&1)*3,r=Math.min(9,((cyc+b*550)%1800)/130),c=b===0?PHI:b===1?PHIA:WHITE;for(let a=0;a<12;a++){const an=a*.5236;g.set(cx+Math.cos(an)*r,cy+Math.sin(an)*r/2,c)}}
        g.outlineC('PHI',3,WHITE);const sdx=[3,-3,0,2,-2,0],sdy=[0,0,-1,1,-1,0],i=Math.min(5,u/36|0);if(u<220)g.shift(sdx[i],sdy[i])}
      else{g.text('NYG 0',1,0,NYG);g.text('PHI 7',24,0,PHI);g.textC('TD +6',6,WHITE)}},
    panel(g,t,mode){g.clear();const tt=t/1000;
      if(mode==='panel'){
        if(t<2400){const front=Math.min(44,t*44/800);for(let xx=0;xx<front;xx++){const x=43-xx,c=(((xx+Math.floor(t/70))/3|0)&1)?PHI:PHIA;for(let y=0;y<22;y++)g.set(x,y,c)}if(t>500)g.outlineC('TOUCHDOWN',8,WHITE)}
        else if(t<5400){const u=t-2400;g.fill(sc(PHI,.1));const cyc=u%1800;
          for(let b=0;b<3;b++){const cx=8+b*14,cy=6+(b&1)*8,r=Math.min(9,((cyc+b*550)%1800)/130),c=b===0?PHI:b===1?PHIA:WHITE;for(let a=0;a<16;a++){const an=a*.3927;g.set(cx+Math.cos(an)*r,cy+Math.sin(an)*r,c)}}
          g.outlineC('PHI',6,WHITE,2)}
        else board3(g,[['NYG    0',NYG],['PHI    7',PHI],['TD Q1 9:41',[170,175,190]]]);
        return}
      /* together: the second screen's half (lib/arxi_companion EvScore, 8 s) */
      if(tt<1.2){g.fill([8,46,18]);for(let x=4;x<38;x+=6)for(let y=0;y<22;y++)g.set(x,y,[30,90,40]);g.rect(38,0,43,21,sc(PHI,.55));
        const rx=4+ease(tt/1.2)*36;g.rect(rx-1,9,rx+1,13,PHI);g.rect(rx,8,rx,8,[240,220,200]);g.set(rx+2,11,[150,80,30]);return}
      const u=tt-1.2;
      if(u<.7){const edge=ease(u/.7)*50;for(let x=0;x<44;x++){const d=edge-x;if(d>0)for(let y=0;y<22;y++)g.set(x,y,d<2?WHITE:PHI)}return}
      if(u<2.4){const k=.55+.35*Math.sin((u-.7)*10);g.fill(sc(PHI,k*.5));g.textC('TD',4,WHITE,3);return}
      if(u<4.6){g.fill(sc(PHI,.18));confetti(g,u,PHI,PHIA);g.outlineC('PHI',6,WHITE,2);return}
      board3(g,[['NYG    0',NYG],['PHI    7',PHI],['Q1  9:41',[170,175,190]]]);const f=clamp((u-4.6)/1.2,0,1);g.rect(0,7,43,13,PHI,(1-f)*.45);g.text('PHI    7',2,8,f<1?WHITE:PHI)}
  },
  { id:'storm',name:'Thunderstorm',period:6000,
    text:{bar:'Alone, the Bar shows the storm and the temperature, and every few seconds a bolt cracks across the strip.',
          panel:'Alone, the Panel draws the whole storm itself: rain, a heavy cloud and its own lightning, with the temperature in the corner.',
          both:'Together, the bolt crosses from one display to the other. It races to the Bar’s right edge, and a quarter second later it enters the Panel and strikes down to the ground. While the Bar shows the reading, the Panel becomes the sky.'},
    extra:'Snow settles on the clock’s digits, and the air turns hazy on both when the air quality drops. Set the Panel to the right of the Bar for the bolt to line up.',
    bar(g,t){g.clear();
      cloud(g,2,1,1,[150,160,180],[100,110,130]);for(let i=0;i<5;i++){const x=3+i*2,y=5+((t/90+i*3)%5|0);g.set(x-(y-5)*.3,y,[80,130,230])}
      g.text('61*',17,0,WHITE);g.text('STORM',17,6,[90,160,255]);
      const age=t-1000;if(age>=0&&age<450){const fl=age<80?170:170*(450-age)/370/3;for(let y=0;y<11;y++)for(let x=0;x<44;x++)g.add(x,y,[fl,fl,Math.min(255,fl*1.25)]);
        const vy=[0,3,2,5,4,7,6,9,8],reach=age<120?Math.floor(age*9/120):8,v=age<250?255:255*(450-age)/200;
        for(let s=0;s<reach;s++){const x0=4+s*5,x1=s===7?43:4+(s+1)*5;g.line(x0,vy[s],x1,vy[s+1],[v,v,255])}}},
    panel(g,t,mode){g.clear();g.fill([6,8,18]);rain(g,t,26,18,[80,130,230],.25);cloud(g,13,2,1.6,[90,95,115],[60,62,80]);
      if(mode==='panel'){g.text('61*',1,16,[200,210,230]);const ph=t%4300;
        if(ph<250){if(((ph*24/1000)|0)%2===0)for(let y=0;y<22;y++)for(let x=0;x<44;x++)g.add(x,y,[70,70,90]);const y0=9;g.line(22,y0,19,y0+5,[255,240,120]);g.line(19,y0+5,23,y0+7,[255,240,120]);g.line(23,y0+7,20,y0+12,[255,240,120])}
        return}
      const age=t-1250;if(age<0||age>=450)return; /* the strip's bolt, taken 250 ms later from the left edge */
      g.fill(WHITE,age<80?.59:.59*(450-age)/370/3);const vx=[0,5,4,9,8,13,12],vy=[2,4,7,9,11,13,15],reach=age<120?Math.floor(age*6/120)+1:6,v=age<250?255:255*(450-age)/200,k=1.4;
      for(let s=0;s<reach;s++)g.line(vx[s]*k,vy[s]*k,vx[s+1]*k,vy[s+1]*k,[v,v,255]);if(reach>=4)g.line(9*k,9*k,15*k,12*k,[v/2,v/2,200])}
  },
  { id:'three',name:'Splash three',period:5200,
    text:{bar:'The Bar takes the shot: the ball arcs the length of the strip, then SPLASH and +3 ripple out in team colours.',
          panel:'The Panel shows the finish on its own: the ball drops through the net, a splash in team colours, then +3.',
          both:'Together, the Bar shoots and the Panel catches it: the ball flies toward the Panel and swishes through its net. It plays for your favourite team only, at most once every three minutes.'},
    extra:'Scoring runs catch fire on both: flames up the Bar’s edges, flames along the Panel’s bottom.',
    bar(g,t){g.clear();
      if(t<900){g.fill(sc(BOS,.07));const f=t/900,bx=2+f*44,by=9-Math.sin(f*PI)*8;for(let k=1;k<=3;k++)g.set(bx-k*2,9-Math.sin(Math.max(0,f-k*.045)*PI)*8,sc(BOSA,(160-k*40)/255));g.set(bx,by,BALL);g.set(bx+1,by,[200,90,10])}
      else if(t<3500){g.fill(sc(BOS,.1));const r=(t-900)/60;for(let y=0;y<11;y++)for(let x=0;x<44;x++){const d=Math.sqrt((x-22)*(x-22)+(y-5)*(y-5)*4);if(Math.abs(d-r)<1.2||Math.abs(d-r+9)<1)g.set(x,y,sc(BOSA,.6))}g.outlineC(t<2200?'SPLASH':'+3',3,WHITE)}
      else{g.text('BOS 91',1,0,BOS);g.text('Q4',36,0,[170,175,190]);g.text('NYK 88',1,6,NYK);g.text('2:14',28,6,[170,175,190])}},
    panel(g,t){g.clear();const tt=t/1000,rx=30;
      if(tt>=3.5){board3(g,[['BOS   91',BOS],['NYK   88',NYK],['Q4  2:14',[170,175,190]]]);return}
      g.fill(sc(BOS,.08));for(let y=1;y<=10;y++)g.set(rx+9,y,[200,200,210]);
      const sw=tt>.8&&tt<1.4?Math.sin((tt-.8)*25)*.8:0;for(let y=9;y<=13;y++)for(let x=rx-3+((y-9)>>1);x<=rx+5-((y-9)>>1);x+=2)g.set(x+Math.round(sw),y,[220,220,230],.8);
      for(let x=rx-4;x<=rx+6;x++)g.set(x,8,[255,90,30]);
      if(tt<1.1){const p=clamp(tt/.8,0,1),bx=p<1?p*(rx+1):rx+1,by=p<1?7-Math.sin(p*PI)*6:7+(tt-.8)*24;g.disc(bx,by,1.6,BALL)}
      if(tt>=.8&&tt<2.2){const k=(tt-.8)/1.4;for(let i=0;i<16;i++){const a=i*.39,r=k*18;g.set(rx+1+Math.cos(a)*r,11+Math.sin(a)*r*.6+k*k*8,i&1?BOSA:BOS,1-k)}}
      if(tt>=1.6){g.fill(BLACK,.43);g.textC('+3',1,WHITE,2);g.textC('SPLASH',15,BOS)}}
  },
  { id:'song',name:'A song',period:10000,
    text:{bar:'On the Bar, each word lights up as it’s sung, in a colour picked for the song, while the background moves with the beat.',
          panel:'On its own, the Panel shows the line over two rows, with the song’s name underneath.',
          both:'Together, the Bar keeps the words and the Panel never repeats them. It shows pictures for what the line is about (122 of them, set off by 819 words), or one of 24 visualizers driven by its own mic, or a painting made over the length of the song.'},
    extra:'On a chorus line, Volt can step onto the Bar with a mic, and take the Panel under a spotlight.',
    bar(g,t){const hue=286;weave(g,hue,t,.55);const s='CITY LIGHTS ON THE BAY',w=g.tw(s),x=44-Math.floor(t/70);
      g.rect(0,2,43,8,BLACK,.55);g.text(s,x,3,px=>px<24?h2r(hue,70,86):h2r(hue,55,34));const b=.25+.2*Math.sin(t/400);for(let xx=0;xx<44;xx++)g.set(xx,10,sc(h2r(hue,90,55),b))},
    panel(g,t,mode){const hue=286;
      if(mode==='panel'){weave(g,hue,t,.4);const words=['CITY','LIGHTS','ON','THE','BAY'],k=Math.floor(clamp(t/7000,0,1)*words.length+.2),hot=h2r(hue,70,86),dim=h2r(hue,55,34);
        g.rect(0,1,43,13,BLACK,.55);let wi=0;
        [['CITY','LIGHTS'],['ON','THE','BAY']].forEach((ws,row)=>{const l=ws.join(' '),sx=Math.floor((44-g.tw(l))/2);let x=sx;
          ws.forEach(w=>{g.text(w,x,2+row*7,wi<k?hot:dim);x+=(w.length+1)*4;wi++})});
        const S=window.ArxiMatrix.SPR.note;S.m.forEach((row,r)=>[...row].forEach((ch,c)=>{if(ch!=='.'){const h=S.p[ch];g.set(1+c,16+r,[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)])}}));
        g.text('LOW HOURS',8,16,h2r(hue,40,60));return}
      g.clear();const beat=Math.exp(-((t/1000*112/60)%1)*5);
      if(t<5200){ /* the line as a picture: a city at night over the water */
        for(let y=0;y<22;y++)g.rect(0,y,43,y,mixc([4,4,20],[40,20,70],y/14));
        for(let i=0;i<10;i++)g.set(rnd(i)*44,rnd(i+20)*6,[200,205,255],.4+.4*Math.sin(t/300+i));
        g.disc(36,4,2,[230,230,210]);
        for(let b=0;b<11;b++){const x0=b*4,h=5+(hash(b*97)%8),top=14-h;g.rect(x0,top,x0+2,13,[16,14,30]);
          for(let wy=top+1;wy<13;wy+=2)for(let wx=x0;wx<=x0+2;wx+=2){const on=(hash(b*131+wy*7+wx)&255)<70+beat*120;if(on)g.set(wx,wy,(hash(b+wy)&1)?[255,196,96]:h2r(hue,80,62))}}
        for(let y=15;y<22;y++)for(let x=0;x<44;x++){const sx=x+Math.round(Math.sin(y*1.3+t/250)*1.2),src=g.get(clamp(sx,0,43),28-y);g.set(x,y,mixc([4,6,22],src,.45*(1-(y-15)/9)))}
        return}
      const n=14;for(let b=0;b<n;b++){const lv=b<4?.35+.6*beat:.25+.45*(.5+.5*Math.sin(t/1000*2.1*(1+b*.37)+b)),h=Math.round(lv*22);
        for(let y=0;y<h;y++){const c=h2r(hue+y*3,90,48+y*1.4);g.rect(1+b*3,21-y,2+b*3,21-y,c)}g.rect(1+b*3,21-h-1,2+b*3,21-h-1,[230,230,240],.7)}}
  },
  { id:'wake',name:'Wake-up light',period:12000,
    text:{bar:'The wake-up light: the Bar brightens from night through dawn to day over the time you choose, and the clock stays on the whole way.',
          panel:'The Panel runs the same light on its own, with a bigger clock.',
          both:'Together, the Panel’s city wakes up with the Bar’s light: the sky follows it, the sun comes up behind the buildings and the windows switch on.'},
    extra:'There’s a red-light look for both the wake-up and the wind-down, and with Volt on he climbs out of bed and stretches.',
    bar(g,t){sunrise(g,clamp(t/10000,0,1));clockHalo(g,'6:30',1,1,1)},
    panel(g,t,mode){const p=clamp(t/10000,0,1);if(mode==='panel'){sunrise(g,p);clockHalo(g,'6:30',2,2,2);return}skyline(g,p,t)}
  }];
  function sunrise(g,p){ /* firmware sunScene (standard sunrise) */
    const H=g.H,W=g.W,hz=H-3,dawn=clamp(1-Math.abs(p-.35)/.35,0,1);
    for(let y=0;y<H;y++){let c;if(y>hz){c=y===hz+1?mixc([4,3,8],[220,70,10],dawn*.78):[4,3,8];c=sc(c,(35+p*70)/255)}
      else{const rf=y/hz;c=mixc(mixc([1,1,10],[40,140,255],p),[255,60,0],clamp(dawn*(.25+.75*rf)*1.4,0,1)*.9)}g.rect(0,y,W-1,y,c)}
    const sv=clamp(1-p*3,0,1);if(sv>.02)for(let i=0;i<6;i++)g.set(rnd(i+3)*W,rnd(i+9)*(hz-1),sc([200,200,255],sv));
    const sy=(hz+1)-p*(hz+2),core=mixc(mixc([220,20,0],[255,140,10],clamp(p*2.2,0,1)),[255,250,220],clamp((p-.45)*2.5,0,1)),r=H>11?4.5:3;
    for(let y=Math.floor(sy-r);y<=hz;y++)for(let x=Math.floor(W/2-r);x<=W/2+r;x++){const d=Math.hypot(x-W/2,y-sy);if(d<=r){const k=d<=r*.45?1:d<=r*.75?.6:.25;g.set(x,y,core,k)}}
  }
  function clockHalo(g,s,x,y,k){[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]].forEach(([dx,dy])=>g.text(s,x+dx,y+dy,BLACK,k));g.text(s,x,y,[255,225,190],k)}
  function skyline(g,p,t){ /* lib/arxi_companion skyline, following the Bar's ramp */
    const top=mixc(mixc([3,4,18],[70,150,255],p),[110,60,90],clamp(1-Math.abs(p-.3)/.3,0,1)*.6),bot=mixc(mixc([10,8,26],[150,200,255],p),[255,110,40],clamp(1-Math.abs(p-.35)/.35,0,1));
    for(let y=0;y<22;y++)g.rect(0,y,43,y,mixc(top,bot,y/21));
    const sv=clamp(1-p*3,0,1);for(let i=0;i<12;i++)g.add(rnd(i+40)*44,rnd(i+60)*9,sc([220,225,255],sv*.8*(.6+.4*Math.sin(t/400+i))));
    const sy=22-p*18;g.disc(33,sy,3.6,sc(mixc([255,110,40],[255,240,190],clamp(p*2.5,0,1)),.35));g.disc(33,sy,1.9,mixc([255,110,40],[255,240,190],clamp(p*2.5,0,1)));
    const lights=p<.15?.05:p<.75?.05+.55*Math.sin((p-.15)/.6*PI):.05,golden=clamp(1-Math.abs(p-.35)/.25,0,1);
    for(let b=0;b<11;b++){const x0=b*4,h=7+(hash(b*97)%10),ty=22-h,body=mixc([16,18,30],sc(bot,.25),.35);g.rect(x0,ty,x0+2,21,body);
      if(golden>.02){for(let x=x0;x<=x0+2;x++)g.set(x,ty,[255,150,60],golden*.85)}
      for(let wy=ty+1;wy<21;wy+=2)for(let wx=x0;wx<=x0+2;wx+=2)if((hash(b*131+wy*7+wx)&255)<lights*255)g.set(wx,wy,[255,196,96])}
  }

  /* ---- the picker ---- */
  function ArxiMoments(root,opts){
    opts=opts||{};if(!root||!window.ArxiMatrix)return null;
    root.classList.add('mo');
    root.innerHTML='<div class="mo-top"><div class="seg mo-tabs" role="tablist" aria-label="Moment"></div>'+
      '<div class="seg mo-modes" role="radiogroup" aria-label="Displays"><button type="button" data-m="bar">Bar alone</button><button type="button" data-m="panel">Panel alone</button><button type="button" data-m="both">Together</button></div></div>'+
      '<div class="mo-stage"><figure class="mo-dev mo-bar"><canvas aria-label="ARXI Bar"></canvas><figcaption>Bar</figcaption></figure>'+
      '<figure class="mo-dev mo-panel"><canvas aria-label="ARXI Panel"></canvas><figcaption>Panel</figcaption></figure><div class="mo-prog"><i></i></div></div>'+
      '<p class="mo-text" aria-live="polite"></p><p class="mo-extra"></p>';
    const tabs=root.querySelector('.mo-tabs'),modes=root.querySelector('.mo-modes'),cb=root.querySelector('.mo-bar canvas'),cp=root.querySelector('.mo-panel canvas');
    M.forEach(m=>{const b=document.createElement('button');b.type='button';b.textContent=m.name;b.dataset.id=m.id;b.setAttribute('role','tab');tabs.appendChild(b)});
    const gb=new Grid(44,11),gp=new Grid(44,22);
    let cur=M.find(m=>m.id===opts.moment)||M[0],mode=opts.mode||'both',t0=performance.now(),raf=0,vis=true;
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function sync(){tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',b.dataset.id===cur.id?'true':'false'));
      modes.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===mode?'true':'false'));
      root.querySelector('.mo-bar').hidden=mode==='panel';root.querySelector('.mo-panel').hidden=mode==='bar';root.dataset.mode=mode;
      root.querySelector('.mo-text').textContent=cur.text[mode];root.querySelector('.mo-extra').textContent=cur.extra||'';t0=performance.now();draw(performance.now())}
    function draw(now){const t=reduce?cur.period*.42:(now-t0)%cur.period;
      if(mode!=='panel'){cur.bar(gb,t,mode);paint(cb,gb)}if(mode!=='bar'){cur.panel(gp,t,mode);paint(cp,gp)}
      root.querySelector('.mo-prog i').style.width=(t/cur.period*100).toFixed(1)+'%'}
    function loop(now){draw(now);raf=vis?requestAnimationFrame(loop):0}
    tabs.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;cur=M.find(m=>m.id===b.dataset.id);sync()});
    modes.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;mode=b.dataset.m;sync()});
    window.addEventListener('resize',()=>draw(performance.now()));
    if('IntersectionObserver' in window)new IntersectionObserver(es=>{vis=es[0].isIntersecting;if(vis&&!raf&&!reduce)raf=requestAnimationFrame(loop)}).observe(root);
    sync();if(!reduce)raf=requestAnimationFrame(loop);
    return{show(id,m){cur=M.find(x=>x.id===id)||cur;if(m)mode=m;sync()}};
  }
  ArxiMoments.list=M.map(m=>({id:m.id,name:m.name}));
  /* one moment looping on one canvas: kind 'bar' or 'panel', mode as in the picker ('bar'|'panel'|'both') */
  ArxiMoments.player=function(canvas,id,o){o=o||{};const m=M.find(x=>x.id===id);if(!m||!canvas)return null;
    const kind=o.kind||'bar',mode=o.mode||kind,g=kind==='panel'?new Grid(44,22):new Grid(44,11),t0=performance.now();
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;let raf=0,live=true,vis=true;
    function draw(now){const t=reduce?m.period*.42:(now-t0)%m.period;m[kind](g,t,mode);paint(canvas,g);if(o.onLabel)o.onLabel(m.name)}
    function loop(now){raf=0;if(!live||!canvas.isConnected)return;draw(now);if(vis&&!reduce)raf=requestAnimationFrame(loop)}
    let io=null;if('IntersectionObserver' in window){io=new IntersectionObserver(es=>{vis=es[0].isIntersecting;if(vis&&!raf&&live)raf=requestAnimationFrame(loop)});io.observe(canvas)}
    draw(performance.now());if(!reduce)raf=requestAnimationFrame(loop);
    return{stop(){live=false;cancelAnimationFrame(raf);if(io)io.disconnect()},name:m.name}};
  window.ArxiMoments=ArxiMoments;
})();
