(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{
    root.RailOpsChefChantierStats150B2B=api;
    api.installChefChantierStatsAdapter(root);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function num(value){
    const n=Number(value);
    return Number.isFinite(n)?n:0;
  }
  function esc(value){
    return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function pct(value,total){return total?Math.round(num(value)/num(total)*100):0;}

  function aggregateChefChantierStats(rows,ids){
    const allowed=new Set((Array.isArray(ids)?ids:[]).map(id=>String(id)));
    return (Array.isArray(rows)?rows:[]).reduce((acc,row)=>{
      if(!row||!allowed.has(String(row.chantier_id)))return acc;
      acc.total+=num(row.total_materiels);
      acc.v1+=num(row.verif_1_ok);
      acc.v2+=num(row.verif_2_ok);
      return acc;
    },{total:0,v1:0,v2:0});
  }

  function stateOf(target){
    try{return typeof target?.st==='function'?target.st():null;}catch(e){return null;}
  }
  function isChefChantier(target){
    try{return typeof target?.isCC==='function'&&target.isCC();}catch(e){return false;}
  }
  function active(c){
    const s=String(c?.statut||'actif').toLowerCase();
    return !['archive','archivé','archivee','archivée','termine','terminé'].includes(s);
  }
  function chantierById(state,id){return (state?.chantiers||[]).find(c=>String(c.id)===String(id))||null;}
  function children(state,id){return (state?.chantiers||[]).filter(c=>active(c)&&String(c.parent_id||'')===String(id));}
  function descendants(state,id){
    const out=[];const seen=new Set();const q=[String(id)];
    while(q.length){
      const cur=q.shift();if(seen.has(cur))continue;seen.add(cur);out.push(cur);
      for(const c of state?.chantiers||[])if(active(c)&&String(c.parent_id||'')===cur)q.push(String(c.id));
    }
    return out;
  }
  function statsForState(state,c){
    const x=aggregateChefChantierStats(state?.chefChantierStats,descendants(state,c?.id));
    return {...x,p1:pct(x.v1,x.total),p2:pct(x.v2,x.total)};
  }
  function chef(c){return c?.chef||'—';}
  function masters(state){return (state?.chantiers||[]).filter(c=>active(c)&&!c.parent_id);}
  function progress(label,n,total,p){
    const safePct=Math.max(0,Math.min(100,num(p)));
    return `<div class="ro148-prog"><div class="ro148-prog-h"><span>${esc(label)}</span><strong>${num(n)}/${num(total)} · ${safePct}%</strong></div><div class="ro148-track"><div class="ro148-fill" style="width:${safePct}%"></div></div></div>`;
  }
  function card(state,c,child=false){
    const x=statsForState(state,c);
    return `<button class="ro148-card" data-ro150-chantier="${esc(c?.id)}"><div class="ro148-cardtop"><div><div class="ro148-name">${esc(c?.nom||'Chantier')}</div><div class="ro148-sub">${esc(c?.lieu||'')}${child?' · Sous-chantier':' · Chef d’équipe : '+esc(chef(c))}</div></div><span class="ro148-count">${x.total} suivis</span></div>${progress('Vérification 1',x.v1,x.total,x.p1)}${progress('Vérification 2',x.v2,x.total,x.p2)}</button>`;
  }
  function wire(target,root){
    if(!root||typeof root.querySelectorAll!=='function')return;
    for(const button of root.querySelectorAll('[data-ro150-chantier]')){
      button.onclick=()=>target?.RailOpsRole148?.open?.(button.getAttribute('data-ro150-chantier'));
    }
    const back=root.querySelector?.('[data-ro150-back]');
    if(back)back.onclick=()=>target?.RailOpsRole148?.back?.();
  }
  function groupedCards(state,list){
    const map=new Map();
    for(const c of list){const key=chef(c);if(!map.has(key))map.set(key,[]);map.get(key).push(c);}
    return [...map.entries()].sort((a,b)=>a[0].localeCompare(b[0],'fr')).map(([name,items])=>{
      const initials=(String(name).match(/\b\p{L}/gu)||['?']).slice(0,2).join('').toUpperCase();
      const cards=items.sort((a,b)=>String(a.nom||'').localeCompare(String(b.nom||''),'fr')).map(c=>card(state,c,false)).join('');
      return `<section class="ro148-group"><div class="ro148-group-h"><div class="ro148-avatar">${esc(initials)}</div><div><strong>${esc(name)}</strong><span>${items.length} chantier(s)</span></div></div>${cards}</section>`;
    }).join('');
  }
  function renderDashboard(target,root){
    const state=stateOf(target);if(!state||!root)return false;
    const list=masters(state);
    const sums=list.reduce((acc,c)=>{const x=statsForState(state,c);acc.total+=x.total;acc.v1+=x.v1;acc.v2+=x.v2;return acc;},{total:0,v1:0,v2:0});
    const p1=pct(sums.v1,sums.total),p2=pct(sums.v2,sums.total);
    root.innerHTML=`<div class="topbar"><div class="tbi"><div class="tbt">Vue globale des vérifications</div><div class="tbs">${list.length} chantier(s) maître(s)</div></div><div class="avatar" style="cursor:pointer">${esc(String(state.agent||'?').slice(0,2).toUpperCase())}</div></div><div class="ro148-wrap"><div class="ro148-summary"><div><strong>${list.length}</strong><span>Chantiers</span></div><div><strong>${p1}%</strong><span>Vérif. 1</span></div><div><strong>${p2}%</strong><span>Vérif. 2</span></div></div><div class="ro148-note">Les sous-chantiers sont regroupés sous leur chantier maître. Statistiques serveur uniquement : aucune référence matériel n’est chargée.</div><div class="ro148-title">Par chef d'équipe</div>${list.length?groupedCards(state,list):'<div class="ro148-empty">Aucun chantier actif</div>'}</div>`;
    wire(target,root);return true;
  }
  function renderDetail(target){
    const state=stateOf(target);const root=target?.document?.getElementById?.('app');
    if(!state||!root)return false;
    const c=chantierById(state,state.curC);if(!c)return false;
    const x=statsForState(state,c),kids=children(state,c.id);
    root.innerHTML=`<div class="topbar"><button class="ro148-back" data-ro150-back="1">‹</button><div class="tbi"><div class="tbt">${esc(c.nom||'Chantier')}</div><div class="tbs">${esc(c.lieu||'')} · Chef d’équipe : ${esc(chef(c))}</div></div></div><div class="ro148-wrap"><div class="ro148-note">Vue d’avancement uniquement · aucune référence matériel n’est affichée.</div><div class="ro148-big"><div><strong>${x.p1}%</strong><span>Vérification 1</span></div><div><strong>${x.p2}%</strong><span>Vérification 2</span></div></div>${progress('Vérification 1',x.v1,x.total,x.p1)}${progress('Vérification 2',x.v2,x.total,x.p2)}${kids.length?`<div class="ro148-title">Sous-chantiers</div>${kids.map(k=>card(state,k,true)).join('')}`:''}</div>`;
    wire(target,root);return true;
  }

  function installChefChantierStatsAdapter(target){
    if(!target)return false;
    if(target.__railopsChefChantierStats150B2BInstalled)return true;
    let installed=false;
    const ready=()=>isChefChantier(target)&&Array.isArray(stateOf(target)?.chefChantierStats);

    if(typeof target.statsFor==='function'){
      const baseStatsFor=target.statsFor;
      target.statsFor=function(c){
        if(!ready())return baseStatsFor.apply(this,arguments);
        return statsForState(stateOf(target),c);
      };
      installed=true;
    }
    if(typeof target.pgDash==='function'){
      const base=target.pgDash;
      target.pgDash=function(root){if(ready()&&renderDashboard(target,root))return;return base.apply(this,arguments);};
      installed=true;
    }
    if(typeof target.pgChantiers==='function'){
      const base=target.pgChantiers;
      target.pgChantiers=function(root){if(ready()&&renderDashboard(target,root))return;return base.apply(this,arguments);};
      installed=true;
    }
    if(typeof target.renderChantierDetail==='function'){
      const base=target.renderChantierDetail;
      target.renderChantierDetail=function(){if(ready()&&renderDetail(target))return;return base.apply(this,arguments);};
      installed=true;
    }
    target.__railopsChefChantierStats150B2BInstalled=installed;
    return installed;
  }

  return {aggregateChefChantierStats,statsForState,renderDashboard,installChefChantierStatsAdapter};
});
