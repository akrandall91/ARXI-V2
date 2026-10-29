/* ARXI cart + pricing, shared by every page (per-browser storage). A cart is a list of displays, each with a room. */
(function(){
  const FINISHES={black:'Black',white:'White'};
  const PROD={
    lite:{name:'Lite Bar',short:'Lite',price:159,add:139,size:'Bar · two lines'},
    probar:{name:'Pro Bar',short:'Pro Bar',price:249,add:229,size:'Bar · two lines'},
    panel:{name:'Pro Panel',short:'Panel',price:299,add:279,size:'Panel · three lines'}
  };
  const HUB=49;
  const SETS=[
    {n:'Whole Home',need:{panel:2,probar:2},price:999},
    {n:'Game Room',need:{panel:1,probar:2},price:739},
    {n:'Duo',need:{panel:1,probar:1},price:529},
    {n:'Pro Pair',need:{probar:2},price:469},
    {n:'Mixed Pair',need:{probar:1,lite:1},price:389},
    {n:'Lite Pair',need:{lite:2},price:299}
  ];
  // Placeholder codes: replace before launch. Codes in page code are visible to anyone, so keep real ones modest.
  const CODES={
    WELCOME10:{label:'10% off your first ARXI',pct:10},
    ARXI25:{label:'$25 off orders of $299 or more',amt:25,min:299},
    WHOLEHOME:{label:'$50 off three or more displays',amt:50,minDisplays:3}
  };
  const KEY='arxi-cart';
  const empty=()=>({lines:[],hub:0,owns:false,code:''});
  function load(){
    try{const c=JSON.parse(localStorage.getItem(KEY)||'null');
      if(c){const e=empty();
        if(Array.isArray(c.lines))e.lines=c.lines.filter(l=>PROD[l.product]).map(l=>({room:String(l.room||''),product:l.product,finish:l.finish==='white'?'white':'black'}));
        else if(c.items)['lite','probar','panel'].forEach(k=>{for(let i=0;i<(c.items[k]||0);i++)e.lines.push({room:'',product:k})});
        e.hub=c.hub?1:(c.items&&c.items.hub?1:0);e.owns=!!c.owns;e.code=c.code||'';return e}}catch(e){}
    return empty();
  }
  function save(c){try{localStorage.setItem(KEY,JSON.stringify(c))}catch(e){}badge()}
  function counts(c){const n={lite:0,probar:0,panel:0};c.lines.forEach(l=>n[l.product]++);return n}
  function displays(c){return c.lines.length}
  function count(c){return c.lines.length+(c.hub&&!(c.lines.length>=2||c.owns&&c.lines.length)?1:0)}
  function base(c){
    const cnt=counts(c),n=c.lines.length;
    const single=['lite','probar','panel'].reduce((s,k)=>s+cnt[k]*PROD[k].price,0);
    if(c.owns){
      if(!n){const h=c.hub?HUB:0;return{reg:h,total:h,save:0,deal:'',hub:c.hub?'paid':'none',connected:false}}
      const t=['lite','probar','panel'].reduce((s,k)=>s+cnt[k]*PROD[k].add,0);
      if(n>=2){const alt=base({lines:c.lines,hub:0,owns:false});if(alt.total<t)return{reg:single+HUB,total:alt.total,save:single+HUB-alt.total,deal:alt.deal,hub:'included',connected:true}}
      return{reg:single+HUB,total:t,save:single+HUB-t,deal:'Owner pricing',hub:'included',connected:true};
    }
    if(n<2){const h=c.hub?HUB:0;return{reg:single+h,total:single+h,save:0,deal:'',hub:c.hub?'paid':'none',connected:false}}
    const reg=single+HUB,ex=x=>x.lite*PROD.lite.add+x.probar*PROD.probar.add+x.panel*PROD.panel.add;
    const first=['panel','probar','lite'].find(k=>cnt[k]),c0=Object.assign({},cnt);c0[first]--;
    let best={total:HUB+PROD[first].price+ex(c0),deal:'Hub included'};
    SETS.forEach(s=>{
      if(!Object.entries(s.need).every(([k,v])=>cnt[k]>=v))return;
      const x=Object.assign({},cnt);Object.entries(s.need).forEach(([k,v])=>x[k]-=v);
      const left=x.lite+x.probar+x.panel,t=s.price+ex(x);
      if(t<best.total)best={total:t,deal:s.n+(left?' + '+left+' more':'')};
    });
    return{reg,total:best.total,save:reg-best.total,deal:best.deal,hub:'included',connected:true};
  }
  function codeCheck(c,b){
    const code=(c.code||'').trim().toUpperCase();if(!code)return{amount:0};
    const d=CODES[code];if(!d)return{amount:0,error:'That code isn’t valid.'};
    if(d.min&&b.total<d.min)return{amount:0,error:'This code needs an order of $'+d.min+' or more.'};
    if(d.minDisplays&&c.lines.length<d.minDisplays)return{amount:0,error:'This code needs '+d.minDisplays+' or more displays.'};
    const amount=d.pct?Math.round(b.total*d.pct/100):Math.min(d.amt,b.total);
    return{amount,code,label:d.label};
  }
  function price(c){const b=base(c),d=codeCheck(c,b);b.discount=d;b.grand=Math.max(0,b.total-(d.amount||0));return b}
  // The best single display to add next, if it unlocks a real saving.
  function nudge(c){
    if(c.owns||!c.lines.length)return null;
    const now=base(c).total;let best=null;
    ['lite','probar','panel'].forEach(k=>{
      const t={lines:c.lines.concat([{room:'',product:k}]),hub:c.hub,owns:false,code:''},b=base(t),delta=b.total-now,saving=PROD[k].price-delta;
      if(saving>=25&&(!best||saving>best.saving))best={product:k,delta,saving,deal:b.deal};
    });
    return best;
  }
  function add(lines,opts){
    const c=load();
    if(Array.isArray(lines))lines.forEach(l=>{if(PROD[l.product])c.lines.push({room:l.room||'',product:l.product,finish:l.finish==='white'?'white':'black'})});
    else ['lite','probar','panel'].forEach(k=>{for(let i=0;i<(lines[k]||0);i++)c.lines.push({room:'',product:k})});
    save(c);return c;
  }
  function badge(){const n=count(load());document.querySelectorAll('[data-cart]').forEach(a=>{a.dataset.count=n;a.classList.toggle('has',n>0)})}
  const fmt=n=>'$'+n.toLocaleString('en-US');
  window.ARXI={FINISHES,PROD,SETS,HUB,CODES,load,save,price,base,nudge,add,count,counts,displays,badge,fmt,empty};
  badge();
  window.addEventListener('storage',e=>{if(e.key===KEY)badge()});
})();
