/* Tabs: <div class="seg" data-tabs="panelsId"><button data-tab="a">…</button></div> + panels [data-panel="a"] inside #panelsId */
(function(){
  document.querySelectorAll('[data-tabs]').forEach(g=>{
    const root=document.getElementById(g.dataset.tabs);if(!root)return;
    const btns=[...g.querySelectorAll('[data-tab]')];g.setAttribute('role','tablist');
    function sel(id){btns.forEach(b=>{const on=b.dataset.tab===id;b.setAttribute('aria-selected',on?'true':'false');b.setAttribute('role','tab')});
      root.querySelectorAll(':scope > [data-panel]').forEach(p=>p.hidden=p.dataset.panel!==id)}
    btns.forEach(b=>{b.type='button';b.addEventListener('click',()=>sel(b.dataset.tab))});
    sel((btns.find(b=>b.getAttribute('aria-selected')==='true')||btns[0]).dataset.tab);
  });
})();
