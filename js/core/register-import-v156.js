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
const VERSION='156-multichantier-source-reconciliation';
const EXCEL_EXT=new Set(['xlsx','xls','xlsm','xlsb','ods']);

function text(v){return String(v??'').trim();}
function key(v){return text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function siteKey(v){return text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'');}
function normalizeRef(v){
  return text(v).normalize('NFKC').toUpperCase().replace(/[‐‑‒–—−]/g,'-').replace(/\s+/g,'').replace(/[^A-Z0-9._\/-]/g,'-').replace(/-{2,}/g,'-').replace(/^-+|-+$/g,'');
}
function refColumn(headers){
  return headers.findIndex(x=>/^(ref|refs|reference|references|ref materiel|reference materiel|code|code materiel|identifiant|identifiant materiel)$/.test(x)||x.startsWith('ref '));
}
function findColumn(headers,kind){
  if(kind==='name')return headers.findIndex(x=>/designation|libelle|materiel|article/.test(x)&&!/nombre|nb /.test(x));
  if(kind==='number')return headers.findIndex(x=>/^(numero|numero serie|n serie|no serie|num|serial)$/.test(x));
  if(kind==='qty')return headers.findIndex(x=>/^(qte|quantite|nombre|nb)$/.test(x));
  if(kind==='cat')return headers.findIndex(x=>/categorie|famille|type/.test(x));
  if(kind==='date')return headers.findIndex(x=>/validite|echeance|expiration|date limite|date valid/.test(x));
  if(kind==='status')return headers.findIndex(x=>/^(statut|status|etat)$/.test(x));
  return -1;
}
function headerInfo(rows){
  const data=Array.isArray(rows)?rows:[];
  for(let r=0;r<Math.min(30,data.length);r++){
    const h=(Array.isArray(data[r])?data[r]:[]).map(key);
    const refCol=refColumn(h);
    const siteCol=h.findIndex(x=>/^(site|zone|emplacement|affectation|sous chantier|sous chantier actuel|chantier|lieu)$/.test(x)||/site actuel|zone actuelle|sous chantier/.test(x));
    if(refCol>=0&&siteCol>=0)return {headerIdx:r,refCol,siteCol,headers:h};
  }
  return null;
}
function referenceHeaderInfo(rows){
  const data=Array.isArray(rows)?rows:[];
  for(let r=0;r<Math.min(30,data.length);r++){
    const headers=(Array.isArray(data[r])?data[r]:[]).map(key);
    const refCol=refColumn(headers);
    if(refCol<0)continue;
    return {
      headerIdx:r,
      refCol,
      nameCol:findColumn(headers,'name'),
      numberCol:findColumn(headers,'number'),
      qtyCol:findColumn(headers,'qty'),
      catCol:findColumn(headers,'cat'),
      dateCol:findColumn(headers,'date'),
      statusCol:findColumn(headers,'status'),
      headers
    };
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
  const crossSiteDuplicate=[...sitesByRef.entries()].filter(([,sites])=>sites.size>1).map(([ref,sites])=>({ref,sites:[...sites]}));
  if(crossSiteDuplicate.length){
    return {kind:'ambiguous',rows,duplicateRows,declaredMismatch:false,uniqueCount:seen.size,crossSiteDuplicate};
  }
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
  return {kind:changed?'normalized':'clean',rows:changed?clean:rows,duplicateRows,declaredMismatch,uniqueCount,crossSiteDuplicate:[]};
}

function isMetaSheetName(name){
  const n=key(name);
  return /^(inventaire|tableau de bord|dashboard|alertes?|audit|transfert|retour|retours|saisie|saisie perte vol|refs liste|references liste|recap|recapitulatif|historique|journal|parametres?)$/.test(n);
}
function siteLabelFromSheet(name,rows,headerIdx){
  const limit=headerIdx>=0?Math.min(headerIdx,6):Math.min((rows||[]).length,6);
  for(let r=0;r<limit;r++){
    for(const cell of (Array.isArray(rows[r])?rows[r]:[])){
      const raw=text(cell);if(!raw)continue;
      let m=raw.match(/\bSITE\s*:\s*(.+?)(?:\s*(?:--|—|\|)\s*\d+\s*(?:articles?|materiels?|matériels?|references?|références?)|$)/i);
      if(m&&text(m[1]))return text(m[1]).toUpperCase();
      m=raw.match(/^(.+?)\s*(?:--|—)\s*\d+\s*(?:articles?|materiels?|matériels?|references?|références?)/i);
      if(m&&text(m[1]))return text(m[1]).toUpperCase();
    }
  }
  if(isMetaSheetName(name))return '';
  return text(name).toUpperCase();
}
function rowValue(row,index){return index>=0?text((Array.isArray(row)?row:[])[index]):'';}
function siteSheetItems(sheet){
  const rows=Array.isArray(sheet?.rows)?sheet.rows:[];
  const info=referenceHeaderInfo(rows);
  if(!info)return null;
  const site=siteLabelFromSheet(sheet?.name||'',rows,info.headerIdx);
  if(!site)return null;
  const byRef=new Map();
  for(let r=info.headerIdx+1;r<rows.length;r++){
    const row=Array.isArray(rows[r])?rows[r]:[];
    const ref=normalizeRef(row[info.refCol]);
    if(!ref)continue;
    if(byRef.has(ref))continue;
    byRef.set(ref,{
      ref,
      name:rowValue(row,info.nameCol),
      number:rowValue(row,info.numberCol)||ref,
      qty:rowValue(row,info.qtyCol)||'1',
      cat:rowValue(row,info.catCol),
      date:rowValue(row,info.dateCol),
      status:rowValue(row,info.statusCol)
    });
  }
  if(!byRef.size)return null;
  return {name:sheet.name,site,siteKey:siteKey(site),info,items:[...byRef.values()]};
}
function buildInventoryRow(headerRow,item,site){
  const headers=(Array.isArray(headerRow)?headerRow:[]).map(key);
  const size=Math.max(headers.length,8);
  const row=Array(size).fill('');
  const refCol=refColumn(headers);
  const siteCol=headers.findIndex(x=>/^(site|zone|emplacement|affectation|sous chantier|sous chantier actuel|chantier|lieu)$/.test(x)||/site actuel|zone actuelle|sous chantier/.test(x));
  const nameCol=findColumn(headers,'name');
  const numberCol=findColumn(headers,'number');
  const qtyCol=findColumn(headers,'qty');
  const catCol=findColumn(headers,'cat');
  const dateCol=findColumn(headers,'date');
  const statusCol=findColumn(headers,'status');
  if(refCol>=0)row[refCol]=item.ref;
  if(nameCol>=0)row[nameCol]=item.name||item.ref;
  if(numberCol>=0)row[numberCol]=item.number||item.ref;
  if(qtyCol>=0)row[qtyCol]=item.qty||'1';
  if(siteCol>=0)row[siteCol]=site;
  if(catCol>=0)row[catCol]=item.cat||'Outillage';
  if(dateCol>=0)row[dateCol]=item.date||'';
  if(statusCol>=0)row[statusCol]=item.status||'';
  return row;
}
function reconcileStructuredSources(sheets){
  const models=(Array.isArray(sheets)?sheets:[]).map(s=>({name:text(s?.name),rows:(Array.isArray(s?.rows)?s.rows:[]).map(r=>Array.isArray(r)?r.slice():[])}));
  const structured=models.map((sheet,index)=>({sheet,index,info:headerInfo(sheet.rows)})).filter(x=>x.info);
  if(!structured.length)return {sheets:models,added:0,conflicts:0,conflictRefs:[],inventorySheet:null,changed:false};
  const namedInventory=structured.filter(x=>/inventaire/.test(key(x.sheet.name))).sort((a,b)=>b.sheet.rows.length-a.sheet.rows.length)[0];
  const inventory=namedInventory||structured.sort((a,b)=>b.sheet.rows.length-a.sheet.rows.length)[0];
  const invRows=inventory.sheet.rows;
  const invInfo=inventory.info;
  const inventoryByRef=new Map();
  for(let r=invInfo.headerIdx+1;r<invRows.length;r++){
    const row=Array.isArray(invRows[r])?invRows[r]:[];
    const ref=normalizeRef(row[invInfo.refCol]);
    if(!ref)continue;
    const site=text(row[invInfo.siteCol]);
    if(!inventoryByRef.has(ref))inventoryByRef.set(ref,new Set());
    inventoryByRef.get(ref).add(siteKey(site)||'__NONE__');
  }

  const candidatesByRef=new Map();
  for(const model of models){
    if(model===inventory.sheet)continue;
    const source=siteSheetItems(model);
    if(!source)continue;
    for(const item of source.items){
      if(!candidatesByRef.has(item.ref))candidatesByRef.set(item.ref,[]);
      candidatesByRef.get(item.ref).push({source,item});
    }
  }

  let added=0;
  const conflictRefs=new Set();
  const headerRow=invRows[invInfo.headerIdx]||[];
  for(const [ref,candidates] of candidatesByRef){
    const existingSites=inventoryByRef.get(ref);
    if(existingSites){
      for(const candidate of candidates){
        if(!existingSites.has(candidate.source.siteKey))conflictRefs.add(ref);
      }
      continue;
    }
    const sourceSites=new Set(candidates.map(c=>c.source.siteKey));
    if(sourceSites.size!==1){conflictRefs.add(ref);continue;}
    const chosen=candidates[0];
    invRows.push(buildInventoryRow(headerRow,chosen.item,chosen.source.site));
    inventoryByRef.set(ref,new Set([chosen.source.siteKey]));
    added++;
  }
  return {
    sheets:models,
    added,
    conflicts:conflictRefs.size,
    conflictRefs:[...conflictRefs].sort(),
    inventorySheet:inventory.sheet.name,
    changed:added>0
  };
}

function normalizeWorkbook(wb,XLSX){
  const reports=[];
  let ambiguous=false;
  let changed=false;
  if(!wb||!XLSX||!XLSX.utils)return {reports,ambiguous,changed};

  const sheetModels=[];
  for(const name of wb.SheetNames||[]){
    const sheet=wb.Sheets?.[name];
    if(!sheet)continue;
    const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false,dateNF:'dd/mm/yyyy',blankrows:false});
    sheetModels.push({name,rows});
  }
  const reconciled=reconcileStructuredSources(sheetModels);
  if(reconciled.changed&&reconciled.inventorySheet){
    const inv=reconciled.sheets.find(s=>s.name===reconciled.inventorySheet);
    if(inv){wb.Sheets[inv.name]=XLSX.utils.aoa_to_sheet(inv.rows);changed=true;}
  }
  if(reconciled.added||reconciled.conflicts){
    reports.push({sheet:reconciled.inventorySheet||'',kind:'reconciled',added:reconciled.added,conflicts:reconciled.conflicts,conflictRefs:reconciled.conflictRefs});
  }

  for(const name of wb.SheetNames||[]){
    const sheet=wb.Sheets?.[name];
    if(!sheet)continue;
    const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false,dateNF:'dd/mm/yyyy',blankrows:false});
    const result=normalizeStructuredRows(rows);
    if(result.kind==='ambiguous'){
      ambiguous=true;
      reports.push({sheet:name,kind:result.kind,duplicateRows:result.duplicateRows.length,declaredMismatch:false,uniqueCount:result.uniqueCount,crossSiteDuplicate:result.crossSiteDuplicate});
      continue;
    }
    if(result.kind!=='normalized')continue;
    wb.Sheets[name]=XLSX.utils.aoa_to_sheet(result.rows);
    changed=true;
    reports.push({sheet:name,kind:result.kind,duplicateRows:result.duplicateRows.length,declaredMismatch:result.declaredMismatch,uniqueCount:result.uniqueCount,crossSiteDuplicate:[]});
  }
  return {reports,ambiguous,changed,reconciliation:{added:reconciled.added,conflicts:reconciled.conflicts,conflictRefs:reconciled.conflictRefs}};
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
  async function handleInput(input){
    const file=input?.files?.[0];
    if(!file)return;
    const baseImport=resolveBaseImport();
    if(typeof baseImport!=='function'){
      try{win.toast?.('Moteur d’import indisponible','danger');}catch(e){}
      return;
    }
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    if(!EXCEL_EXT.has(ext)||typeof file.arrayBuffer!=='function'||!win.XLSX)return baseImport(input);
    try{
      const originalBuffer=await file.arrayBuffer();
      const wb=win.XLSX.read(originalBuffer,{type:'array',cellDates:true,bookVBA:true});
      const outcome=normalizeWorkbook(wb,win.XLSX);
      if(outcome.ambiguous||!outcome.changed)return baseImport(input);
      if(typeof win.File!=='function')return baseImport(input);
      const rewritten=win.XLSX.write(wb,{type:'array',bookType:'xlsx'});
      const syntheticFile=new win.File([rewritten],file.name,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      const normalizedReports=outcome.reports.filter(r=>r.kind==='normalized');
      const duplicates=normalizedReports.reduce((n,r)=>n+(r.duplicateRows||0),0);
      const stale=normalizedReports.filter(r=>r.declaredMismatch).length;
      const added=outcome.reconciliation?.added||0;
      const conflicts=outcome.reconciliation?.conflicts||0;
      try{input.value='';}catch(e){}
      try{console.info('[RailOps v156 import]',outcome.reports);}catch(e){}
      if(typeof win.toast==='function'){
        const parts=[];
        if(added)parts.push(`${added} référence(s) absente(s) de l’inventaire récupérée(s) depuis les onglets site`);
        if(duplicates)parts.push(`${duplicates} doublon(s) identique(s) neutralisé(s)`);
        if(stale)parts.push('total annoncé obsolète corrigé pour lecture');
        if(conflicts)parts.push(`${conflicts} conflit(s) d’affectation conservé(s) selon INVENTAIRE`);
        win.toast(`Registre contrôlé : ${parts.join(' · ')||'aucune correction nécessaire'}`,conflicts?'warn':'ok');
      }
      return baseImport({files:[syntheticFile],value:''});
    }catch(e){
      try{console.warn('[RailOps v156 import] lecture inchangée',e);}catch(_){}
      return baseImport(input);
    }
  }
  const api={version:VERSION,handleInput,normalizeStructuredRows,reconcileStructuredSources,normalizeWorkbook,resolveBaseImport};
  return api;
}
return {version:VERSION,normalizeStructuredRows,reconcileStructuredSources,normalizeWorkbook,createBrowserApi};
});
