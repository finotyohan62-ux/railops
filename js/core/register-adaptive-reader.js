(function(root,factory){
'use strict';
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.RailOpsAdaptiveRegisterReader=api;
})(typeof window!=='undefined'?window:null,function(){
'use strict';

const VERSION='1.1-adaptive-register-reader';

function text(v){return String(v??'').trim();}
function key(v){
  return text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
    .replace(/[‐‑‒–—−]/g,'-').replace(/[_\\/.:-]+/g,' ').replace(/[^a-z0-9 -]+/g,' ')
    .replace(/\s+/g,' ').trim();
}
function siteKey(v){return text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'');}
function normalizeRef(v){
  return text(v).normalize('NFKC').toUpperCase().replace(/[‐‑‒–—−]/g,'-').replace(/\s+/g,'')
    .replace(/[^A-Z0-9._\/-]/g,'-').replace(/-{2,}/g,'-').replace(/^-+|-+$/g,'');
}
function formatDate(v){
  if(v===null||v===undefined||v==='')return '';
  if(v instanceof Date&&!isNaN(v))return v.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'});
  if(typeof v==='number'&&v>1000){const d=new Date(Date.UTC(1899,11,30)+v*86400000);return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'});}
  return text(v);
}
function isMetaSheetName(name){
  return /^(inventaire|tableau de bord|dashboard|alertes?|audit|transfert|retour|retours|saisie|saisie perte vol|refs liste|references liste|recap|recapitulatif|historique|journal|parametres?|configuration|config|sommaire)$/.test(key(name));
}
function isGenericSheetName(name){return /^(feuil|feuille|sheet)\s*\d*$/.test(key(name));}

function headerKind(v){
  const h=key(v),c=h.replace(/\s+/g,'');
  if(!h)return null;
  if(/^(ref|refs|reference|references|id|identifiant|identifiants|numero|num|no|n|code|matricule)$/.test(c)
    ||/^(id|identifiant|numero|num|no|n|code)(materiel|article|equipement|outil)$/.test(c)
    ||/^(materiel|article|equipement|outil)(id|numero|num|no|n|code)$/.test(c)
    ||h.includes('reference materiel')||h.includes('reference article'))return 'ref';
  if(/^(site|zone|emplacement|affectation|chantier|nom chantier|sous chantier|sous chantier actuel|lieu)$/.test(h)
    ||h.includes('site actuel')||h.includes('zone actuelle')||h.includes('sous chantier'))return 'site';
  if(h.includes('designation')||h==='nom'||h==='nom materiel'||h==='nom article'||h==='libelle'||h==='article'||h==='materiel'||h==='equipement'||h==='outil'||h==='description')return 'name';
  if(h.includes('categorie')||h==='cat'||h==='type'||h.includes('famille')||h.includes('groupe'))return 'cat';
  if(h.includes('echeance')||h.includes('expiration')||h.includes('validite')||h.includes('date limite')||h.includes('prochaine verification')||h.includes('date verification'))return 'date';
  return null;
}
function headerProfile(rows){
  const data=Array.isArray(rows)?rows:[];
  let best=null;
  for(let r=0;r<Math.min(30,data.length);r++){
    const row=Array.isArray(data[r])?data[r]:[];
    const kinds=row.map(headerKind);
    const refCol=kinds.indexOf('ref');
    if(refCol<0)continue;
    const siteCol=kinds.indexOf('site');
    const nameCol=kinds.indexOf('name');
    const catCol=kinds.indexOf('cat');
    const dateCol=kinds.indexOf('date');
    const recognized=kinds.filter(Boolean).length;
    const score=8+(siteCol>=0?5:0)+(nameCol>=0?2:0)+(catCol>=0?1:0)+(dateCol>=0?1:0)+recognized;
    if(!best||score>best.score)best={headerIdx:r,refCol,siteCol,nameCol,catCol,dateCol,score};
  }
  return best;
}
function markerSite(row){
  const cells=(Array.isArray(row)?row:[]).map(text).filter(Boolean);
  if(!cells.length)return '';
  for(const raw of cells){
    let m=raw.match(/^\s*(?:SITE|CHANTIER|ZONE|EMPLACEMENT|LIEU)\s*:\s*(.+?)\s*$/i);
    if(m&&text(m[1]))return text(m[1]).toUpperCase();
    m=raw.match(/^(.+?)\s*(?:--|—|\|)\s*\d+\s*(?:articles?|materiels?|matériels?|references?|références?)\s*$/i);
    if(m&&text(m[1]))return text(m[1]).toUpperCase();
  }
  return '';
}
function titleSite(name,rows,headerIdx){
  const limit=Math.max(0,Math.min(headerIdx>=0?headerIdx:6,6));
  for(let r=0;r<limit;r++){
    const site=markerSite(rows?.[r]);
    if(site)return site;
  }
  if(isMetaSheetName(name)||isGenericSheetName(name))return '';
  return text(name).toUpperCase();
}
function isSectionTitle(row,refCol){
  const raw=text((Array.isArray(row)?row:[])[refCol]);
  if(!raw)return false;
  const other=(Array.isArray(row)?row:[]).filter((_,i)=>i!==refCol).map(text);
  return /^.+\(\s*\d+\s+(?:articles?|materiels?|matériels?|references?|références?)\s*\)\s*$/i.test(raw)&&other.every(v=>!v);
}
function mergeItem(old,item){
  if(!old)return item;
  if((!old.nom||old.nom===old.reference)&&item.nom)old.nom=item.nom;
  if((!old.cat||old.cat==='Outillage')&&item.cat)old.cat=item.cat;
  if(!old.echeance&&item.echeance)old.echeance=item.echeance;
  return old;
}
function itemFromRow(row,profile){
  const reference=normalizeRef(row?.[profile.refCol]);
  if(!reference||isSectionTitle(row,profile.refCol))return null;
  return {
    id:reference,
    reference,
    nom:profile.nameCol>=0?text(row?.[profile.nameCol])||reference:reference,
    cat:profile.catCol>=0?text(row?.[profile.catCol])||'Outillage':'Outillage',
    echeance:profile.dateCol>=0?formatDate(row?.[profile.dateCol]):''
  };
}
function parseSheetRows(rows,options){
  const opts=options||{};
  const data=Array.isArray(rows)?rows:[];
  const profile=opts.profile||headerProfile(data);
  if(!profile)return [];
  const end=Number.isInteger(opts.end)?Math.min(opts.end,data.length):data.length;
  const start=Number.isInteger(opts.start)?opts.start:profile.headerIdx+1;
  const out=new Map();
  let lastSite=text(opts.site||'');
  for(let r=start;r<end;r++){
    const row=Array.isArray(data[r])?data[r]:[];
    if(!row.some(v=>text(v))){if(opts.resetSiteOnBlank)lastSite='';continue;}
    let site=text(opts.site||'');
    if(!site&&profile.siteCol>=0){
      const explicit=text(row[profile.siteCol]);
      if(explicit)lastSite=explicit;
      site=explicit||(opts.carrySite!==false?lastSite:'');
    }
    const item=itemFromRow(row,profile);if(!item)continue;
    item.site=site;
    item.siteKey=siteKey(site);
    const dedupe=(item.siteKey||'__NONE__')+'|'+item.reference;
    out.set(dedupe,mergeItem(out.get(dedupe),item));
  }
  return [...out.values()];
}
function groupItems(items){
  const groups=new Map();
  for(const item of items||[]){
    const sk=siteKey(item.site);if(!sk)continue;
    if(!groups.has(sk))groups.set(sk,{site:text(item.site),siteKey:sk,items:new Map()});
    const group=groups.get(sk);
    group.items.set(item.reference,mergeItem(group.items.get(item.reference),{
      id:item.id||item.reference,reference:item.reference,nom:item.nom,cat:item.cat,echeance:item.echeance||''
    }));
  }
  return [...groups.values()].map(g=>({site:g.site,siteKey:g.siteKey,items:[...g.items.values()]}));
}
function emptyModel(format,confidence){return {version:VERSION,format,confidence,groups:[],warnings:[],conflicts:[],blockingConflicts:[]};}
function addToGroup(groups,site,item){
  const sk=siteKey(site);if(!sk)return;
  let group=groups.find(g=>g.siteKey===sk);
  if(!group){group={site:text(site),siteKey:sk,items:[]};groups.push(group);}
  const old=group.items.find(x=>x.reference===item.reference);
  if(old)mergeItem(old,item);else group.items.push({id:item.id||item.reference,reference:item.reference,nom:item.nom,cat:item.cat,echeance:item.echeance||''});
}

function parseInventorySiteSheets(models,inventoryModel,inventoryProfile,simpleSiteSheets){
  const model=emptyModel('inventory-site-sheets',0.99);
  const inventoryItems=parseSheetRows(inventoryModel.rows,{profile:inventoryProfile,carrySite:true,resetSiteOnBlank:true});
  model.groups=groupItems(inventoryItems);
  const sitesByRef=new Map();
  for(const group of model.groups)for(const item of group.items){
    if(!sitesByRef.has(item.reference))sitesByRef.set(item.reference,new Set());
    sitesByRef.get(item.reference).add(group.siteKey);
  }
  const candidates=new Map();
  for(const entry of simpleSiteSheets){
    const site=titleSite(entry.name,entry.rows,entry.profile.headerIdx);if(!site)continue;
    const items=parseSheetRows(entry.rows,{profile:entry.profile,site});
    for(const item of items){
      const existing=sitesByRef.get(item.reference);
      const sk=siteKey(site);
      if(existing){
        if(existing.has(sk)){
          const g=model.groups.find(x=>x.siteKey===sk);const old=g?.items.find(x=>x.reference===item.reference);if(old)mergeItem(old,item);
        }else model.conflicts.push({reference:item.reference,authoritativeSites:[...existing],sourceSite:site});
        continue;
      }
      if(!candidates.has(item.reference))candidates.set(item.reference,[]);
      candidates.get(item.reference).push({site,item});
    }
  }
  for(const [reference,list] of candidates){
    const uniqueSites=[...new Set(list.map(x=>siteKey(x.site)).filter(Boolean))];
    if(uniqueSites.length!==1){model.conflicts.push({reference,sourceSites:list.map(x=>x.site)});model.blockingConflicts.push({reference,sourceSites:list.map(x=>x.site)});continue;}
    addToGroup(model.groups,list[0].site,list[0].item);
  }
  return model;
}
function structuredModel(structured){
  const model=emptyModel('structured-table',0.97);
  const all=[];
  for(const entry of structured)all.push(...parseSheetRows(entry.rows,{profile:entry.profile,carrySite:true,resetSiteOnBlank:true}));
  model.groups=groupItems(all);
  return model;
}
function parseSiteSheetEntry(entry){
  const site=titleSite(entry.name,entry.rows,entry.profile.headerIdx);if(!site)return null;
  const items=parseSheetRows(entry.rows,{profile:entry.profile,site});
  if(!items.length)return null;
  return {site,siteKey:siteKey(site),items:items.map(({site:_,siteKey:__,...item})=>item)};
}
function inferredPlainBlockMarkers(rows){
  const candidates=[];
  const data=Array.isArray(rows)?rows:[];
  for(let r=0;r<data.length;r++){
    const row=Array.isArray(data[r])?data[r]:[];
    if(!row.map(headerKind).includes('ref'))continue;
    let p=r-1;
    while(p>=0&&!(Array.isArray(data[p])&&data[p].some(v=>text(v))))p--;
    if(p<0)continue;
    const cells=(Array.isArray(data[p])?data[p]:[]).map(text).filter(Boolean);
    if(cells.length!==1)continue;
    const raw=cells[0],k=key(raw);
    if(!raw||raw.length>100||!k||isMetaSheetName(raw)||isGenericSheetName(raw))continue;
    if(headerKind(raw)||/^(registre|materiel|matériel|inventaire|liste|tableau|recap|récap)/i.test(raw))continue;
    candidates.push({row:p,site:raw.toUpperCase()});
  }
  const unique=[];const seenRows=new Set();
  for(const marker of candidates){if(seenRows.has(marker.row))continue;seenRows.add(marker.row);unique.push(marker);}
  return unique.length>=2?unique:[];
}
function blockSegments(entry){
  const rows=entry.rows;
  let markers=[];
  for(let r=0;r<rows.length;r++){const site=markerSite(rows[r]);if(site)markers.push({row:r,site});}
  if(!markers.length)markers=inferredPlainBlockMarkers(rows);
  if(!markers.length)return [];
  const groups=[];
  for(let i=0;i<markers.length;i++){
    const current=markers[i],end=i+1<markers.length?markers[i+1].row:rows.length;
    const slice=rows.slice(current.row+1,end);
    const profile=headerProfile(slice);if(!profile)continue;
    const items=parseSheetRows(slice,{profile,site:current.site});
    if(items.length)groups.push({site:current.site,siteKey:siteKey(current.site),items:items.map(({site:_,siteKey:__,...item})=>item)});
  }
  return groups;
}
function mergeGroups(groups){
  const out=[];
  for(const group of groups||[])for(const item of group.items||[])addToGroup(out,group.site,item);
  return out;
}

function detectAndParseWorkbook(sheets){
  const models=(Array.isArray(sheets)?sheets:[]).map(s=>({name:text(s?.name),rows:(Array.isArray(s?.rows)?s.rows:[]).map(r=>Array.isArray(r)?r.slice():[])}));
  const usable=models.filter(s=>s.rows.some(row=>Array.isArray(row)&&row.some(v=>text(v))));
  if(!usable.length)return emptyModel('unknown',0);

  const entries=usable.map(sheet=>({name:sheet.name,rows:sheet.rows,profile:headerProfile(sheet.rows)}));
  const structured=entries.filter(e=>e.profile&&e.profile.siteCol>=0&&!isMetaSheetName(e.name));
  const simple=entries.filter(e=>e.profile&&e.profile.siteCol<0&&!isMetaSheetName(e.name));
  const inventory=entries.find(e=>/inventaire/.test(key(e.name))&&e.profile&&e.profile.siteCol>=0);
  const secondarySites=simple.filter(e=>titleSite(e.name,e.rows,e.profile.headerIdx));

  if(inventory&&secondarySites.length){return parseInventorySiteSheets(models,inventory,inventory.profile,secondarySites);}

  if(structured.length){
    const model=structuredModel(structured);
    if(model.groups.length)return model;
  }

  const blockGroups=[];
  for(const entry of entries.filter(e=>!isMetaSheetName(e.name)))blockGroups.push(...blockSegments(entry));
  if(blockGroups.length>=2){const model=emptyModel('block-per-site',0.94);model.groups=mergeGroups(blockGroups);return model;}

  const siteSheetGroups=secondarySites.map(parseSiteSheetEntry).filter(Boolean);
  if(siteSheetGroups.length>=2){const model=emptyModel('sheet-per-site',0.92);model.groups=mergeGroups(siteSheetGroups);return model;}

  if(blockGroups.length===1){const model=emptyModel('block-per-site',0.84);model.groups=mergeGroups(blockGroups);return model;}

  const nonMetaSimple=simple.filter(e=>!isMetaSheetName(e.name));
  if(nonMetaSimple.length===1){
    const entry=nonMetaSimple[0];
    const items=parseSheetRows(entry.rows,{profile:entry.profile,site:''}).map(({site:_,siteKey:__,...item})=>item);
    const model=emptyModel('single-sheet',0.62);
    if(items.length)model.groups=[{site:'',siteKey:'',items}];
    return model;
  }

  return emptyModel('unknown',0.2);
}

return {VERSION,version:VERSION,text,key,siteKey,normalizeRef,headerKind,headerProfile,isMetaSheetName,parseSheetRows,detectAndParseWorkbook};
});
