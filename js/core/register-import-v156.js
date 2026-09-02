(function(root,factory){
'use strict';
const core=factory();
if(typeof module==='object'&&module.exports)module.exports=core;
if(root){
  const api=core.createBrowserApi(root);
  root.RailOpsRegisterImportV156=api;
  try{console.info('[RailOps] import registre unifié actif —',api.version);}catch(e){}
}
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const VERSION='156.3-structured-register-owner';
const EXCEL_EXT=new Set(['xlsx','xls','xlsm','xlsb','ods']);

function text(v){return String(v??'').trim();}
function key(v){return text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function siteKey(v){return text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'');}
function normalizeRef(v){
  return text(v).normalize('NFKC').toUpperCase().replace(/[‐‑‒–—−]/g,'-').replace(/\s+/g,'').replace(/[^A-Z0-9._\/-]/g,'-').replace(/-{2,}/g,'-').replace(/^-+|-+$/g,'');
}
function esc(v){return text(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function headerInfo(rows){
  const data=Array.isArray(rows)?rows:[];
  for(let r=0;r<Math.min(30,data.length);r++){
    const h=(Array.isArray(data[r])?data[r]:[]).map(key);
    const refCol=h.findIndex(x=>/^(ref|refs|reference|references|ref materiel|reference materiel|code|code materiel|identifiant|identifiant materiel)$/.test(x)||x.startsWith('ref '));
    const siteCol=h.findIndex(x=>/^(site|zone|emplacement|affectation|sous chantier|sous chantier actuel|chantier|nom chantier|lieu)$/.test(x)||/site actuel|zone actuelle|sous chantier/.test(x));
    if(refCol<0||siteCol<0)continue;
    const nameCol=h.findIndex(x=>/^(designation|nom|nom designation|article|materiel|libelle|description)$/.test(x)||x.includes('designation'));
    const catCol=h.findIndex(x=>/^(categorie|cat|groupe|famille|type)$/.test(x)||x.includes('categorie'));
    const dateCol=h.findIndex(x=>/^(echeance|date echeance|expiration|validite|date limite|prochaine verification|date verification)$/.test(x)||x.includes('echeance'));
    return {headerIdx:r,refCol,siteCol,nameCol,catCol,dateCol};
  }
  return null;
}
function normalizeStructuredRows(rows){
  const info=headerInfo(rows);
  if(!info)return {kind:'not-structured',rows,duplicateRows:[],declaredMismatch:false,uniqueCount:0,crossSiteDuplicate:[]};
  const seen=new Map(),sitesByRef=new Map(),duplicateRows=[];
  for(let r=info.headerIdx+1;r<rows.length;r++){
    const row=Array.isArray(rows[r])?rows[r]:[];
    const ref=normalizeRef(row[info.refCol]),site=siteKey(row[info.siteCol]);
    if(!ref||!site)continue;
    const pair=site+'|'+ref;
    if(seen.has(pair)){duplicateRows.push(r);continue;}
    seen.set(pair,r);
    if(!sitesByRef.has(ref))sitesByRef.set(ref,new Set());
    sitesByRef.get(ref).add(site);
  }
  const crossSiteDuplicate=[...sitesByRef.entries()].filter(([,sites])=>sites.size>1).map(([ref,sites])=>({ref,sites:[...sites]}));
  const clean=rows.map(row=>Array.isArray(row)?row.slice():[]);
  for(const r of duplicateRows.slice().sort((a,b)=>b-a))clean.splice(r,1);
  const uniqueCount=seen.size;
  let declaredMismatch=false;
  for(let r=0;r<Math.min(info.headerIdx,clean.length);r++)for(let c=0;c<(clean[r]||[]).length;c++){
    const raw=text(clean[r][c]);if(!raw)continue;
    const m=raw.match(/(\d{1,5})(\s*(?:articles?|materiels?|matériels?|references?|références?))/i);if(!m)continue;
    const declared=Number(m[1]);
    if(declared&&declared!==uniqueCount){declaredMismatch=true;clean[r][c]=raw.replace(m[0],String(uniqueCount)+m[2]);}
  }
  const changed=duplicateRows.length>0||declaredMismatch;
  return {kind:changed?'normalized':'clean',rows:changed?clean:rows,duplicateRows,declaredMismatch,uniqueCount,crossSiteDuplicate};
}
function normalizeWorkbook(wb,XLSX){
  const reports=[];
  if(!wb||!XLSX?.utils)return {reports,ambiguous:false};
  for(const name of wb.SheetNames||[]){
    const sheet=wb.Sheets?.[name];if(!sheet)continue;
    const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false,dateNF:'dd/mm/yyyy',blankrows:false});
    const result=normalizeStructuredRows(rows);
    if(result.kind==='not-structured')continue;
    if(result.kind==='normalized')wb.Sheets[name]=XLSX.utils.aoa_to_sheet(result.rows);
    reports.push({sheet:name,kind:result.kind,duplicateRows:result.duplicateRows.length,declaredMismatch:result.declaredMismatch,uniqueCount:result.uniqueCount,crossSiteDuplicate:result.crossSiteDuplicate});
  }
  return {reports,ambiguous:false};
}
function formatDate(v){
  if(v===null||v===undefined||v==='')return '';
  if(v instanceof Date&&!isNaN(v))return v.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'});
  if(typeof v==='number'&&v>1000){const d=new Date(Date.UTC(1899,11,30)+v*86400000);return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'});}
  return text(v);
}
function mergeItem(old,item){
  if(!old)return item;
  if((!old.nom||old.nom===old.reference)&&item.nom)old.nom=item.nom;
  if((!old.cat||old.cat==='Outillage')&&item.cat)old.cat=item.cat;
  if(!old.echeance&&item.echeance)old.echeance=item.echeance;
  return old;
}
function structuredGroupsFromWorkbook(wb,XLSX){
  const groups=new Map(),sitesByRef=new Map();
  if(!wb||!XLSX?.utils)return {groups:[],crossSiteReferences:[]};
  for(const sheetName of wb.SheetNames||[]){
    const sheet=wb.Sheets?.[sheetName];if(!sheet)continue;
    const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false,dateNF:'dd/mm/yyyy',blankrows:false});
    const info=headerInfo(rows);if(!info)continue;
    for(let r=info.headerIdx+1;r<rows.length;r++){
      const row=Array.isArray(rows[r])?rows[r]:[];
      const reference=normalizeRef(row[info.refCol]),site=text(row[info.siteCol]),sk=siteKey(site);
      if(!reference||!sk)continue;
      const item={id:reference,reference,nom:info.nameCol>=0?text(row[info.nameCol])||reference:reference,cat:info.catCol>=0?text(row[info.catCol])||'Outillage':'Outillage',echeance:info.dateCol>=0?formatDate(row[info.dateCol]):''};
      if(!groups.has(sk))groups.set(sk,{site,siteKey:sk,items:new Map()});
      const group=groups.get(sk);group.items.set(reference,mergeItem(group.items.get(reference),item));
      if(!sitesByRef.has(reference))sitesByRef.set(reference,new Set());sitesByRef.get(reference).add(sk);
    }
  }
  return {groups:[...groups.values()].map(g=>({site:g.site,siteKey:g.siteKey,items:[...g.items.values()]})),crossSiteReferences:[...sitesByRef.entries()].filter(([,sites])=>sites.size>1).map(([reference,sites])=>({reference,sites:[...sites]}))};
}
function activeChantiers(win){return (win.S?.chantiers||[]).filter(c=>c&&String(c.statut||'').toLowerCase()!=='termine');}
function activeMasters(win){return activeChantiers(win).filter(c=>!c.parent_id);}
function resolveExistingTargets(groups,win){
  const ch=activeChantiers(win),resolved=[],missing=[],ambiguous=[];
  for(const group of groups||[]){const matches=ch.filter(c=>siteKey(c.nom)===group.siteKey);if(matches.length===1)resolved.push({chantier:matches[0],site:group.site,items:group.items});else if(!matches.length)missing.push(group.site);else ambiguous.push({site:group.site,count:matches.length});}
  return {resolved,missing,ambiguous,ok:missing.length===0&&ambiguous.length===0&&resolved.length>0};
}
function buildPayload(resolved){return {targets:resolved.map(g=>({chantierId:String(g.chantier.id),items:g.items.map(item=>({id:item.id||item.reference,reference:item.reference,nom:item.nom,cat:item.cat,echeance:item.echeance||''}))}))};}
function buildStructuredPayload(mode,parentId,groups){
  return {mode,parentId:String(parentId),targets:(groups||[]).map(g=>({site:g.site,items:g.items.map(item=>({id:item.id||item.reference,reference:item.reference,nom:item.nom,cat:item.cat,echeance:item.echeance||''}))}))};
}
function sheetGroupsFromV145(wb,win){
  try{const model=win.RailOpsProductionV145?.workbookModel?.(wb);if(!model?.sheets?.length)return [];return model.sheets.filter(s=>Array.isArray(s.items)&&s.items.length).map(s=>({site:s.name,siteKey:siteKey(s.name),items:s.items.map(x=>({id:normalizeRef(x.ref),reference:normalizeRef(x.ref),nom:text(x.nom)||normalizeRef(x.ref),cat:text(x.cat)||'Outillage',echeance:text(x.echeance)})).filter(x=>x.reference)}));}catch(e){return [];}
}

function createBrowserApi(win){
  let resolvedBaseImport=null;
  function resolveBaseImport(){
    if(resolvedBaseImport)return resolvedBaseImport;
    const toleranceBase=win.RailOpsRegisterImportToleranceV155?.baseImport;
    if(typeof toleranceBase==='function'){resolvedBaseImport=toleranceBase;return resolvedBaseImport;}
    const current=win.importCSV;if(typeof current==='function'&&current!==api.handleInput){resolvedBaseImport=current;return resolvedBaseImport;}
    return null;
  }
  function notify(msg,type='ok'){try{win.toast?.(msg,type);}catch(e){}}
  async function readWorkbook(file){
    if(!file||!win.XLSX)throw new Error('Bibliothèque XLSX indisponible');
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    if(['csv','txt'].includes(ext)){const str=await file.text();return win.XLSX.read(str,{type:'string',raw:false,cellDates:true});}
    return win.XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true,bookVBA:true});
  }
  async function refresh(){
    try{if(typeof win.load==='function')await win.load();}catch(e){try{win.console?.warn?.('[RailOps registre] recharge',e);}catch(_){} }
    try{if(typeof win.render==='function')win.render();win.RailOpsDisplayV142?.apply?.();}catch(e){}
  }
  async function rpc(name,payload){const result=await win.db.rpc(name,{p_payload:payload});if(result?.error)throw result.error;return Array.isArray(result?.data)?result.data[0]:result?.data;}
  function defaultDialog(cfg){
    const doc=win.document;if(!doc)throw new Error('Interface de sélection indisponible');
    doc.getElementById('ro-v156-register-modal')?.remove();
    const overlay=doc.createElement('div');overlay.id='ro-v156-register-modal';overlay.className='moverlay';
    const total=cfg.groups.reduce((n,g)=>n+g.items.length,0);
    const duplicates=(cfg.reports||[]).reduce((n,r)=>n+(r.duplicateRows||0),0);
    const stale=(cfg.reports||[]).filter(r=>r.declaredMismatch).length;
    const modeLabel=cfg.mode==='replace'?'Remplacer le registre':'Importer le registre';
    const warning=cfg.mode==='replace'?'Les références absentes du nouveau registre seront retirées des chantiers concernés, mais leur identité, scans et historique seront conservés.':'Aucune référence déjà présente sur un autre chantier ne sera supprimée. Une référence commune restera une occurrence distincte et conservera la pastille Multi-chantier.';
    overlay.innerHTML=`<div class="msheet" style="max-height:90vh;overflow:auto"><div class="mhandle"></div><h3 style="margin:0 0 4px">${modeLabel}</h3><div style="font-size:11px;color:var(--text2);margin-bottom:12px">${esc(cfg.fileName)} · ${total} occurrence(s) · ${cfg.groups.length} destination(s)</div><label class="fl">Chantier maître</label><select id="ro-v156-master" class="fi">${cfg.masters.map(m=>`<option value="${esc(m.id)}">${esc(m.nom)}</option>`).join('')}</select><div style="margin:12px 0">${cfg.groups.map(g=>`<div style="display:flex;justify-content:space-between;gap:12px;padding:8px 10px;margin-bottom:6px;border-radius:9px;background:var(--bg3)"><strong>${esc(g.site)}</strong><span style="color:var(--text2)">${g.items.length} réf.</span></div>`).join('')}</div><div style="font-size:11px;color:var(--text2);padding:9px 11px;border-radius:9px;background:var(--bg3);margin-bottom:10px">${warning}${duplicates?`<br><strong>${duplicates}</strong> doublon(s) du même chantier seront neutralisés.`:''}${stale?'<br>Les compteurs obsolètes du fichier sont ignorés au profit des lignes réellement présentes.':''}</div><div id="ro-v156-error" style="display:none;font-size:11px;color:#e24b4a;margin:8px 0"></div><button id="ro-v156-go" class="btn btn-accent">${modeLabel}</button><button id="ro-v156-cancel" class="btn btn-outline" style="margin-top:8px">Annuler</button></div>`;
    (doc.getElementById('app')||doc.body).appendChild(overlay);
    doc.getElementById('ro-v156-cancel').onclick=()=>overlay.remove();
    doc.getElementById('ro-v156-go').onclick=async()=>{
      const button=doc.getElementById('ro-v156-go'),errorBox=doc.getElementById('ro-v156-error'),parentId=doc.getElementById('ro-v156-master')?.value;
      button.disabled=true;button.textContent='Traitement sécurisé…';errorBox.style.display='none';
      try{await cfg.onSubmit(parentId);overlay.remove();}catch(e){errorBox.textContent=e.message||String(e);errorBox.style.display='block';button.disabled=false;button.textContent=modeLabel;}
    };
  }
  function openDialog(cfg){
    const custom=win.RailOpsStructuredRegisterUI?.open;
    if(typeof custom==='function')return custom(cfg);
    return defaultDialog(cfg);
  }
  async function structuredFlow(wb,file,input,mode){
    const outcome=normalizeWorkbook(wb,win.XLSX);
    const parsed=structuredGroupsFromWorkbook(wb,win.XLSX);
    if(!parsed.groups.length)return {handled:false};
    const masters=activeMasters(win);
    if(!masters.length){notify('Aucun chantier maître actif disponible pour ce registre','danger');return {handled:true,error:'NO_ACTIVE_MASTER'};}
    try{input.value='';}catch(e){}
    const cfg={mode,groups:parsed.groups,masters,fileName:file.name,reports:outcome.reports,crossSiteReferences:parsed.crossSiteReferences,onSubmit:async parentId=>{
      if(!parentId)throw new Error('Sélectionnez un chantier maître');
      const payload=buildStructuredPayload(mode,parentId,parsed.groups);
      const data=await rpc('railops_apply_structured_register_admin',payload);
      await refresh();
      const total=parsed.groups.reduce((n,g)=>n+g.items.length,0);
      if(mode==='replace')notify(`Registre remplacé ✓ · ${data?.targets??parsed.groups.length} chantier(s) · ${data?.detached??0} ancienne(s) occurrence(s) conservée(s) en historique`,'ok');
      else notify(`Import validé ✓ · ${data?.processed??total}/${total} occurrence(s) traitée(s) · ${data?.createdTargets??0} sous-chantier(s) créé(s)`,'ok');
      return data;
    }};
    openDialog(cfg);
    return {handled:true,awaitingSelection:true};
  }
  async function handleInput(input){
    const mode=(input?.id==='replaceFile'||input?.dataset?.railopsMode==='replace')?'replace':'import';
    const file=input?.files?.[0];if(!file)return;
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    const baseImport=resolveBaseImport();
    if((!EXCEL_EXT.has(ext)&&!['csv','txt'].includes(ext))||!win.XLSX){
      if(mode==='replace'){notify('Format non supporté pour le remplacement sécurisé','danger');return {handled:true,error:'UNSUPPORTED_REPLACE_FORMAT'};}
      if(typeof baseImport==='function')return baseImport(input);
      notify('Moteur d’import indisponible','danger');return;
    }
    try{
      const wb=await readWorkbook(file);
      const structured=await structuredFlow(wb,file,input,mode);
      if(structured.handled)return structured;
      if(mode==='replace')return handleUnstructuredReplace(wb,file,input);
      if(typeof baseImport!=='function')throw new Error('Moteur d’import simple indisponible');
      return baseImport(input);
    }catch(e){
      try{win.console?.error?.('[RailOps v156 registre]',e);}catch(_){}
      notify(`${mode==='replace'?'Remplacement':'Import'} interrompu sans écriture : ${e.message||e}`,'danger');
      return {handled:true,error:e};
    }
  }
  async function handleUnstructuredReplace(wb,file,input){
    const groups=sheetGroupsFromV145(wb,win);if(!groups.length)throw new Error('Aucune référence exploitable détectée');
    const mapping=resolveExistingTargets(groups,win);if(!mapping.ok)throw new Error('Destination introuvable ou ambiguë pour le remplacement');
    const total=mapping.resolved.reduce((n,g)=>n+g.items.length,0);
    if(typeof win.confirm==='function'&&!win.confirm(`Remplacer ${mapping.resolved.length} registre(s) avec ${total} référence(s) ?`))return {handled:true,cancelled:true};
    const data=await rpc('railops_replace_material_register_admin',buildPayload(mapping.resolved));await refresh();notify(`Registre remplacé ✓ · ${data?.targets??mapping.resolved.length} chantier(s)`,'ok');try{input.value='';}catch(e){}return {handled:true,data};
  }
  async function handleReplaceInput(input){return handleInput(Object.assign(input||{},{dataset:Object.assign({},input?.dataset||{},{railopsMode:'replace'})}));}
  const api={version:VERSION,handleInput,handleReplaceInput,normalizeStructuredRows,normalizeWorkbook,structuredGroupsFromWorkbook,resolveExistingTargets,buildPayload,buildStructuredPayload,resolveBaseImport};
  return api;
}
return {version:VERSION,normalizeStructuredRows,normalizeWorkbook,structuredGroupsFromWorkbook,resolveExistingTargets,buildPayload,buildStructuredPayload,createBrowserApi};
});
