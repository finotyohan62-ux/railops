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
const VERSION='156-unified-register-import';
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
    const siteCol=h.findIndex(x=>/^(site|zone|emplacement|affectation|sous chantier|sous chantier actuel|chantier|lieu)$/.test(x)||/site actuel|zone actuelle|sous chantier/.test(x));
    if(refCol>=0&&siteCol>=0)return {headerIdx:r,refCol,siteCol};
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
function normalizeWorkbook(wb,XLSX){
  const reports=[];
  let ambiguous=false;
  if(!wb||!XLSX||!XLSX.utils)return {reports,ambiguous};
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
    reports.push({sheet:name,kind:result.kind,duplicateRows:result.duplicateRows.length,declaredMismatch:result.declaredMismatch,uniqueCount:result.uniqueCount,crossSiteDuplicate:[]});
  }
  return {reports,ambiguous};
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
      if(outcome.ambiguous||!outcome.reports.some(r=>r.kind==='normalized'))return baseImport(input);
      if(typeof win.File!=='function')return baseImport(input);
      const rewritten=win.XLSX.write(wb,{type:'array',bookType:'xlsx'});
      const syntheticFile=new win.File([rewritten],file.name,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      const normalizedReports=outcome.reports.filter(r=>r.kind==='normalized');
      const duplicates=normalizedReports.reduce((n,r)=>n+r.duplicateRows,0);
      const stale=normalizedReports.filter(r=>r.declaredMismatch).length;
      try{input.value='';}catch(e){}
      try{console.info('[RailOps v156 import]',normalizedReports);}catch(e){}
      if(typeof win.toast==='function')win.toast(`Registre contrôlé : ${duplicates} doublon(s) identique(s) neutralisé(s)${stale?' · total annoncé obsolète corrigé pour lecture':''}`,'warn');
      return baseImport({files:[syntheticFile],value:''});
    }catch(e){
      try{console.warn('[RailOps v156 import] lecture inchangée',e);}catch(_){}
      return baseImport(input);
    }
  }
  const api={version:VERSION,handleInput,normalizeStructuredRows,normalizeWorkbook,resolveBaseImport};
  return api;
}
return {version:VERSION,normalizeStructuredRows,normalizeWorkbook,createBrowserApi};
});
