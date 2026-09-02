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
const VERSION='156.2-reference-safe-register-import';
const EXCEL_EXT=new Set(['xlsx','xls','xlsm','xlsb','ods']);

function text(v){return String(v??'').trim();}
function key(v){return text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function siteKey(v){return text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'');}
function normalizeRef(v){
  return text(v).normalize('NFKC').toUpperCase().replace(/[‐‑‒–—−]/g,'-').replace(/\s+/g,'').replace(/[^A-Z0-9._\/-]/g,'-').replace(/-{2,}/g,'-').replace(/^-+|-+$/g,'');
}
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
  const seen=new Map();
  const sitesByRef=new Map();
  const duplicateRows=[];
  for(let r=info.headerIdx+1;r<rows.length;r++){
    const row=Array.isArray(rows[r])?rows[r]:[];
    const ref=normalizeRef(row[info.refCol]);
    const site=siteKey(row[info.siteCol]);
    if(!ref||!site)continue;
    const pair=site+'|'+ref;
    if(seen.has(pair)){duplicateRows.push(r);continue;}
    seen.set(pair,r);
    if(!sitesByRef.has(ref))sitesByRef.set(ref,new Set());
    sitesByRef.get(ref).add(site);
  }
  // Une même référence sur plusieurs chantiers est légitime : seules les
  // répétitions du même couple chantier/référence sont des doublons.
  const crossSiteDuplicate=[...sitesByRef.entries()].filter(([,sites])=>sites.size>1).map(([ref,sites])=>({ref,sites:[...sites]}));
  const clean=rows.map(row=>Array.isArray(row)?row.slice():[]);
  for(const r of duplicateRows.slice().sort((a,b)=>b-a))clean.splice(r,1);
  const uniqueCount=seen.size;
  let declaredMismatch=false;
  for(let r=0;r<Math.min(info.headerIdx,clean.length);r++){
    for(let c=0;c<(clean[r]||[]).length;c++){
      const raw=text(clean[r][c]);
      if(!raw)continue;
      const m=raw.match(/(\d{1,5})(\s*(?:articles?|materiels?|matériels?|references?|références?))/i);
      if(!m)continue;
      const declared=Number(m[1]);
      if(declared&&declared!==uniqueCount){
        declaredMismatch=true;
        clean[r][c]=raw.replace(m[0],String(uniqueCount)+m[2]);
      }
    }
  }
  const changed=duplicateRows.length>0||declaredMismatch;
  return {kind:changed?'normalized':'clean',rows:changed?clean:rows,duplicateRows,declaredMismatch,uniqueCount,crossSiteDuplicate};
}
function normalizeWorkbook(wb,XLSX){
  const reports=[];
  let ambiguous=false;
  if(!wb||!XLSX||!XLSX.utils)return {reports,ambiguous};
  for(const name of wb.SheetNames||[]){
    const sheet=wb.Sheets?.[name];
    if(!sheet)continue;
    const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false,dateNF:'dd/mm/yyyy',blankrows:false});
    const result=normalizeStructuredRows(rows);
    if(result.kind==='not-structured')continue;
    if(result.kind==='normalized')wb.Sheets[name]=XLSX.utils.aoa_to_sheet(result.rows);
    reports.push({sheet:name,kind:result.kind,duplicateRows:result.duplicateRows.length,declaredMismatch:result.declaredMismatch,uniqueCount:result.uniqueCount,crossSiteDuplicate:result.crossSiteDuplicate});
  }
  return {reports,ambiguous};
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
  const groups=new Map();
  const sitesByRef=new Map();
  if(!wb||!XLSX?.utils)return {groups:[],crossSiteReferences:[]};
  for(const sheetName of wb.SheetNames||[]){
    const sheet=wb.Sheets?.[sheetName];if(!sheet)continue;
    const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false,dateNF:'dd/mm/yyyy',blankrows:false});
    const info=headerInfo(rows);if(!info)continue;
    for(let r=info.headerIdx+1;r<rows.length;r++){
      const row=Array.isArray(rows[r])?rows[r]:[];
      const reference=normalizeRef(row[info.refCol]);
      const site=text(row[info.siteCol]);
      const sk=siteKey(site);
      if(!reference||!sk)continue;
      const item={
        id:reference,reference,
        nom:info.nameCol>=0?text(row[info.nameCol])||reference:reference,
        cat:info.catCol>=0?text(row[info.catCol])||'Outillage':'Outillage',
        echeance:info.dateCol>=0?formatDate(row[info.dateCol]):''
      };
      if(!groups.has(sk))groups.set(sk,{site,siteKey:sk,items:new Map()});
      const group=groups.get(sk);
      group.items.set(reference,mergeItem(group.items.get(reference),item));
      if(!sitesByRef.has(reference))sitesByRef.set(reference,new Set());
      sitesByRef.get(reference).add(sk);
    }
  }
  return {
    groups:[...groups.values()].map(g=>({site:g.site,siteKey:g.siteKey,items:[...g.items.values()]})),
    crossSiteReferences:[...sitesByRef.entries()].filter(([,sites])=>sites.size>1).map(([reference,sites])=>({reference,sites:[...sites]}))
  };
}
function sheetGroupsFromV145(wb,win){
  try{
    const model=win.RailOpsProductionV145?.workbookModel?.(wb);
    if(!model?.sheets?.length)return [];
    return model.sheets.filter(s=>Array.isArray(s.items)&&s.items.length).map(s=>({
      site:s.name,siteKey:siteKey(s.name),items:s.items.map(x=>({id:normalizeRef(x.ref),reference:normalizeRef(x.ref),nom:text(x.nom)||normalizeRef(x.ref),cat:text(x.cat)||'Outillage',echeance:text(x.echeance)})).filter(x=>x.reference)
    }));
  }catch(e){return [];}
}
function activeChantiers(win){
  const rows=win.S?.chantiers||[];
  return rows.filter(c=>c&&String(c.statut||'').toLowerCase()!=='termine');
}
function resolveExistingTargets(groups,win){
  const ch=activeChantiers(win);
  const resolved=[],missing=[],ambiguous=[];
  for(const group of groups||[]){
    const matches=ch.filter(c=>siteKey(c.nom)===group.siteKey);
    if(matches.length===1)resolved.push({chantier:matches[0],site:group.site,items:group.items});
    else if(matches.length===0)missing.push(group.site);
    else ambiguous.push({site:group.site,count:matches.length});
  }
  return {resolved,missing,ambiguous,ok:missing.length===0&&ambiguous.length===0&&resolved.length>0};
}
function buildPayload(resolved){
  return {targets:resolved.map(g=>({chantierId:String(g.chantier.id),items:g.items.map(item=>({id:item.id||item.reference,reference:item.reference,nom:item.nom,cat:item.cat,echeance:item.echeance||''}))}))};
}
function materialBusinessRef(m){
  const direct=normalizeRef(m?.reference);if(direct)return direct;
  const id=text(m?.id);return normalizeRef(id.split('__MC__')[0]||id);
}
function absentCount(resolved,win){
  let count=0;const mats=win.S?.mat||[];
  for(const g of resolved){const incoming=new Set(g.items.map(x=>x.reference));for(const m of mats)if(String(m.chantierId)===String(g.chantier.id)&&!incoming.has(materialBusinessRef(m)))count++;}
  return count;
}
function mappingMessage(mapping){
  const parts=[];
  if(mapping.missing.length)parts.push('chantier(s) introuvable(s) : '+mapping.missing.join(', '));
  if(mapping.ambiguous.length)parts.push('nom(s) ambigu(s) : '+mapping.ambiguous.map(x=>`${x.site} (${x.count})`).join(', '));
  return parts.join(' · ');
}

function createBrowserApi(win){
  let resolvedBaseImport=null;
  function resolveBaseImport(){
    if(resolvedBaseImport)return resolvedBaseImport;
    const toleranceBase=win.RailOpsRegisterImportToleranceV155?.baseImport;
    if(typeof toleranceBase==='function'){resolvedBaseImport=toleranceBase;return resolvedBaseImport;}
    const current=win.importCSV;
    if(typeof current==='function'&&current!==api.handleInput){resolvedBaseImport=current;return resolvedBaseImport;}
    return null;
  }
  function notify(msg,type='ok'){try{win.toast?.(msg,type);}catch(e){}}
  async function readWorkbook(file){
    if(!file||!win.XLSX)throw new Error('Bibliothèque XLSX indisponible');
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    if(['csv','txt'].includes(ext)){const str=await file.text();return win.XLSX.read(str,{type:'string',raw:false,cellDates:true});}
    const buffer=await file.arrayBuffer();return win.XLSX.read(buffer,{type:'array',cellDates:true,bookVBA:true});
  }
  async function refresh(){
    try{if(typeof win.load==='function')await win.load();}catch(e){console.warn('[RailOps registre] recharge',e);}
    try{if(typeof win.render==='function')win.render();win.RailOpsDisplayV142?.apply?.();}catch(e){}
  }
  async function rpc(name,payload){
    const result=await win.db.rpc(name,{p_payload:payload});
    if(result?.error)throw result.error;
    return Array.isArray(result?.data)?result.data[0]:result?.data;
  }
  async function serverImportStructured(wb,file){
    const parsed=structuredGroupsFromWorkbook(wb,win.XLSX);
    if(!parsed.groups.length)return {handled:false};
    const mapping=resolveExistingTargets(parsed.groups,win);
    if(!mapping.ok){
      // Les sous-chantiers peuvent être absents lors du tout premier import.
      // Dans ce cas, ne jamais bloquer : rendre la main au moteur de mapping
      // v145 qui permet de choisir le chantier maître puis créer/réutiliser
      // chaque destination. Une fois les destinations résolues, les imports
      // suivants peuvent repasser par le RPC atomique ci-dessous.
      notify('Certaines destinations doivent être associées ou créées avant import','warn');
      return {handled:false,needsMapping:true};
    }
    if(!parsed.crossSiteReferences.length)return {handled:false};
    const total=mapping.resolved.reduce((n,g)=>n+g.items.length,0);
    if(typeof win.confirm==='function'&&!win.confirm(`Importer ${total} occurrence(s) sur ${mapping.resolved.length} chantier(s) ?\n\nUne même référence présente sur plusieurs chantiers sera conservée comme occurrence distincte.`))return {handled:true,cancelled:true};
    const data=await rpc('railops_import_material_register_admin',buildPayload(mapping.resolved));
    await refresh();
    notify(`Import multi-chantier validé ✓ · ${data?.processed??total} occurrence(s) traitée(s)`,'ok');
    return {handled:true,data};
  }
  async function handleInput(input){
    if(input?.id==='replaceFile'||input?.dataset?.railopsMode==='replace')return handleReplaceInput(input);
    const file=input?.files?.[0];
    if(!file)return;
    const baseImport=resolveBaseImport();
    if(typeof baseImport!=='function'){notify('Moteur d’import indisponible','danger');return;}
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    if(!EXCEL_EXT.has(ext)||typeof file.arrayBuffer!=='function'||!win.XLSX)return baseImport(input);
    try{
      const wb=await readWorkbook(file);
      const structured=await serverImportStructured(wb,file);
      if(structured.handled){try{input.value='';}catch(e){}return structured;}
      const outcome=normalizeWorkbook(wb,win.XLSX);
      if(!outcome.reports.some(r=>r.kind==='normalized'))return baseImport(input);
      if(typeof win.File!=='function')return baseImport(input);
      const rewritten=win.XLSX.write(wb,{type:'array',bookType:'xlsx'});
      const syntheticFile=new win.File([rewritten],file.name,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      const normalizedReports=outcome.reports.filter(r=>r.kind==='normalized');
      const duplicates=normalizedReports.reduce((n,r)=>n+r.duplicateRows,0);
      const stale=normalizedReports.filter(r=>r.declaredMismatch).length;
      try{input.value='';}catch(e){}
      try{console.info('[RailOps v156 import]',normalizedReports);}catch(e){}
      notify(`Registre contrôlé : ${duplicates} doublon(s) du même chantier neutralisé(s)${stale?' · total annoncé obsolète corrigé pour lecture':''}`,'warn');
      return baseImport({files:[syntheticFile],value:''});
    }catch(e){
      try{console.warn('[RailOps v156 import] lecture inchangée',e);}catch(_){}
      notify('Import interrompu sans écriture : '+(e.message||e),'danger');
    }
  }
  async function handleReplaceInput(input){
    const file=input?.files?.[0];if(!file)return;
    try{
      if(!win.XLSX)throw new Error('Bibliothèque XLSX indisponible');
      const wb=await readWorkbook(file);
      normalizeWorkbook(wb,win.XLSX);
      let parsed=structuredGroupsFromWorkbook(wb,win.XLSX);
      let groups=parsed.groups;
      if(!groups.length)groups=sheetGroupsFromV145(wb,win);
      if(!groups.length)throw new Error('Aucun chantier et aucune référence exploitable détectés');
      const mapping=resolveExistingTargets(groups,win);
      if(!mapping.ok)throw new Error(mappingMessage(mapping)||'Destination introuvable');
      const total=mapping.resolved.reduce((n,g)=>n+g.items.length,0);
      const absent=absentCount(mapping.resolved,win);
      const question=`Remplacer le registre de ${mapping.resolved.length} chantier(s) avec ${total} occurrence(s) ?\n\n${absent} référence(s) absente(s) du nouveau registre seront retirées des chantiers, mais leur historique, scans et identité seront conservés.`;
      if(typeof win.confirm==='function'&&!win.confirm(question))return {cancelled:true};
      const data=await rpc('railops_replace_material_register_admin',buildPayload(mapping.resolved));
      await refresh();
      notify(`Registre remplacé ✓ · ${data?.targets??mapping.resolved.length} chantier(s) · ${data?.detached??absent} ancienne(s) occurrence(s) conservée(s) en historique`,'ok');
      return data;
    }catch(e){
      try{console.error('[RailOps v156 remplacement]',e);}catch(_){}
      notify('Remplacement interrompu sans aucune modification : '+(e.message||e),'danger');
      return {error:e};
    }finally{try{input.value='';}catch(e){}}
  }
  const api={version:VERSION,handleInput,handleReplaceInput,normalizeStructuredRows,normalizeWorkbook,structuredGroupsFromWorkbook,resolveExistingTargets,buildPayload,resolveBaseImport};
  return api;
}
return {version:VERSION,normalizeStructuredRows,normalizeWorkbook,structuredGroupsFromWorkbook,resolveExistingTargets,buildPayload,createBrowserApi};
});
