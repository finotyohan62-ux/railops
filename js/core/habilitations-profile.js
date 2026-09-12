(function(root){
'use strict';
if(!root||root.RailOpsHabilitationsProfile)return;

const BUCKET='railops-habilitations';
const PANEL_ATTR='data-railops-habilitations-profile';
const CATEGORIES=[
  {key:'habilitation',title:'Habilitations',icon:'⚡'},
  {key:'competence',title:'Autres compétences',icon:'🎓'},
  {key:'secourisme',title:'Secourisme',icon:'🩹'}
];
let activeRecord=null;
let pendingFile=null;
let pendingRead=null;
let pendingParsed=null;
let injectTimer=null;

function state(){try{return typeof S!=='undefined'?S:null;}catch(_){return null;}}
function client(){try{return typeof db!=='undefined'?db:null;}catch(_){return null;}}
function esc(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function notify(text,type='info'){try{if(typeof toast==='function')toast(text,type);}catch(_){} }
function currentAgent(){
  const s=state();
  if(s?.currentAgent?.id)return s.currentAgent;
  return (s?.users||[]).find(u=>String(u?.nom||'')===String(s?.agent||''))||null;
}
function statusOf(validUntil){
  const parser=root.RailOpsHabilitationsParser;
  if(!validUntil||!parser?.habilitationStatus)return 'unknown';
  return parser.habilitationStatus(validUntil,new Date(),60);
}
function statusLabel(value){return value==='valid'?'Valide':value==='expiring'?'Expire bientôt':value==='expired'?'Expirée':'À vérifier';}
function statusClass(value){return value==='valid'?'ok':value==='expiring'?'warn':value==='expired'?'danger':'muted';}
function dateFr(value){
  if(!value)return '—';
  const m=String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m?`${m[3]}/${m[2]}/${m[1]}`:String(value);
}
function normalizeItems(record){
  const items=Array.isArray(record?.items)?record.items:[];
  return items.map(item=>({
    type:item.type||'habilitation',
    code:item.code||'',
    labelSource:item.labelSource||item.label_source||item.code||'',
    validFrom:item.validFrom||item.valid_from||null,
    validUntil:item.validUntil||item.valid_until||null
  }));
}
function byType(items,type){return (items||[]).filter(item=>item.type===type);}

function ensureStyle(){
  if(document.getElementById('ro-hab-profile-style'))return;
  const style=document.createElement('style');style.id='ro-hab-profile-style';
  style.textContent=`
  [${PANEL_ATTR}]{margin:18px 0 4px;border-top:1px solid var(--border,#e6e8eb);padding-top:16px;color:var(--text,#18202a)}
  .ro-hab-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
  .ro-hab-head h3{margin:0;font-size:16px}.ro-hab-sub{font-size:12px;color:var(--muted,#718096);margin-top:3px}
  .ro-hab-update{border:0;border-radius:10px;padding:9px 11px;background:var(--accent,#f5a623);color:#111;font-weight:700;cursor:pointer;font-size:12px}
  .ro-hab-grid{display:grid;grid-template-columns:1fr;gap:10px}.ro-hab-block{border:1px solid var(--border,#e6e8eb);border-radius:13px;padding:12px;background:var(--bg2,#fff)}
  .ro-hab-block-title{font-size:13px;font-weight:800;margin-bottom:8px}.ro-hab-row{padding:9px 0;border-top:1px solid var(--border,#edf0f2)}.ro-hab-row:first-of-type{border-top:0}
  .ro-hab-label{font-size:13px;font-weight:700;line-height:1.3}.ro-hab-code{font-size:11px;color:var(--muted,#718096);margin-top:2px}.ro-hab-dates{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:6px;font-size:11px;color:var(--muted,#718096)}
  .ro-hab-state{border-radius:999px;padding:3px 7px;font-weight:800;font-size:10px;white-space:nowrap}.ro-hab-state.ok{background:#e8f7ee;color:#176b3a}.ro-hab-state.warn{background:#fff3d5;color:#855900}.ro-hab-state.danger{background:#fde7e7;color:#9b2525}.ro-hab-state.muted{background:#eef1f4;color:#667085}
  .ro-hab-empty{font-size:12px;color:var(--muted,#718096);padding:5px 0}.ro-hab-docline{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:12px 0 0;font-size:11px;color:var(--muted,#718096)}
  .ro-hab-link{border:0;background:none;color:var(--accent,#c77800);font:inherit;font-weight:700;cursor:pointer;padding:4px 0}
  .ro-hab-preview{margin-top:12px;border:1px solid var(--accent,#f5a623);border-radius:13px;padding:12px;background:rgba(245,166,35,.06)}.ro-hab-preview h4{margin:0 0 6px;font-size:14px}.ro-hab-preview-note{font-size:11px;color:var(--muted,#718096);margin-bottom:8px}
  .ro-hab-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:10px}.ro-hab-actions button{border:0;border-radius:9px;padding:8px 11px;font-size:12px;font-weight:800;cursor:pointer}.ro-hab-cancel{background:#eef1f4;color:#344054}.ro-hab-confirm{background:var(--accent,#f5a623);color:#111}.ro-hab-confirm:disabled{opacity:.45;cursor:not-allowed}
  .ro-hab-issues{font-size:11px;color:#8a5a00;margin-top:8px}.ro-hab-loading{font-size:12px;color:var(--muted,#718096);padding:10px 0}
  @media(min-width:720px){.ro-hab-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
  `;
  document.head.appendChild(style);
}

function findProfileHost(){
  const movl=document.getElementById('movl');
  if(movl){return movl.querySelector('.msheet,.modal-sheet,.modal-content,.sheet,.modal')||movl;}
  const overlay=document.getElementById('modal-overlay');
  if(overlay&&overlay.children.length){return overlay.querySelector('.msheet,.modal-sheet,.modal-content,.sheet,.modal')||overlay.lastElementChild||overlay;}
  return null;
}
function panel(){return document.querySelector(`[${PANEL_ATTR}]`);}

function rowHtml(item){
  const st=statusOf(item.validUntil);
  const label=item.labelSource||item.code||'Qualification';
  const code=item.code&&String(label).toUpperCase().indexOf(String(item.code).toUpperCase())<0?`<div class="ro-hab-code">${esc(item.code)}</div>`:'';
  return `<div class="ro-hab-row"><div class="ro-hab-label">${esc(label)}</div>${code}<div class="ro-hab-dates"><span>${item.validFrom?`${dateFr(item.validFrom)} → `:''}${dateFr(item.validUntil)}</span><span class="ro-hab-state ${statusClass(st)}">${statusLabel(st)}</span></div></div>`;
}
function blockHtml(title,icon,items){return `<section class="ro-hab-block"><div class="ro-hab-block-title">${icon} ${esc(title)}</div>${items.length?items.map(rowHtml).join(''):'<div class="ro-hab-empty">Aucune donnée détectée.</div>'}</section>`;}
function qualificationGrid(items){return `<div class="ro-hab-grid">${CATEGORIES.map(cat=>blockHtml(cat.title,cat.icon,byType(items,cat.key))).join('')}</div>`;}

function renderActive(target){
  if(!target)return;
  const items=normalizeItems(activeRecord);
  target.innerHTML=`
    <div class="ro-hab-head"><div><h3>Qualifications professionnelles</h3><div class="ro-hab-sub">Document rattaché à ton profil RailOps</div></div><button class="ro-hab-update" type="button">${activeRecord?'Mettre à jour':'Ajouter mon PDF'}</button></div>
    <input class="ro-hab-file" type="file" accept="application/pdf,.pdf" hidden>
    ${activeRecord?qualificationGrid(items):'<div class="ro-hab-empty">Aucune habilitation enregistrée sur ton profil.</div>'}
    ${activeRecord?`<div class="ro-hab-docline"><span>Mis à jour ${activeRecord.activated_at?dateFr(String(activeRecord.activated_at).slice(0,10)):'récemment'}</span><button class="ro-hab-link" type="button">Voir le PDF</button></div>`:''}
    <div class="ro-hab-preview-slot"></div>`;
  const update=target.querySelector('.ro-hab-update');
  const input=target.querySelector('.ro-hab-file');
  update?.addEventListener('click',()=>input?.click());
  input?.addEventListener('change',()=>handleFile(input.files?.[0],target));
  target.querySelector('.ro-hab-link')?.addEventListener('click',viewOwnPdf);
}
function renderLoading(target,text='Chargement des qualifications…'){if(target)target.innerHTML=`<div class="ro-hab-loading">${esc(text)}</div>`;}
function renderLoadError(target){
  if(!target)return;
  target.innerHTML=`<div class="ro-hab-head"><div><h3>Qualifications professionnelles</h3><div class="ro-hab-sub">Habilitations · Autres compétences · Secourisme</div></div></div><div class="ro-hab-empty">Impossible de charger les qualifications pour le moment.</div>`;
}

async function loadActive(target){
  const c=client(),agent=currentAgent();
  if(!c||!agent?.id){renderLoadError(target);return;}
  renderLoading(target);
  try{
    const {data,error}=await c.rpc('railops_habilitations_scope',{p_user_id:agent.id});
    if(error)throw error;
    const rows=Array.isArray(data)?data:[];
    activeRecord=rows.find(row=>String(row.user_id)===String(agent.id))||rows[0]||null;
    renderActive(target);
  }catch(error){
    console.warn('[RailOps habilitations] chargement',error);
    renderLoadError(target);
  }
}

function flattenParsed(parsed){
  const out=[];
  for(const item of parsed?.habilitations||[])out.push({type:'habilitation',...item});
  for(const item of parsed?.competences||[])out.push({type:'competence',...item});
  for(const item of parsed?.secourisme||[])out.push({type:'secourisme',...item});
  return out;
}
function previewHtml(parsed,read){
  const all=flattenParsed(parsed);
  const issues=parsed?.ambiguities||[];
  const source=read?.method==='ocr'?`OCR${Number.isFinite(read?.confidence)?` · ${Math.round(read.confidence*100)} %`:''}`:'Texte PDF';
  return `<div class="ro-hab-preview"><h4>Prévisualisation du nouveau document</h4><div class="ro-hab-preview-note">Lecture : ${esc(source)}. Vérifie les informations détectées avant de confirmer.</div>${qualificationGrid(all)}${issues.length?`<div class="ro-hab-issues">${issues.map(x=>`• ${esc(x)}`).join('<br>')}</div>`:''}<div class="ro-hab-actions"><button class="ro-hab-cancel" type="button">Annuler</button><button class="ro-hab-confirm" type="button" ${parsed?.ok?'':'disabled'}>Confirmer</button></div></div>`;
}
async function handleFile(file,target){
  pendingFile=null;pendingRead=null;pendingParsed=null;
  if(!file)return;
  const slot=target?.querySelector('.ro-hab-preview-slot');
  if(!slot)return;
  if(file.type!=='application/pdf'&&!/\.pdf$/i.test(file.name||'')){slot.innerHTML='<div class="ro-hab-issues">Un fichier PDF est requis.</div>';return;}
  slot.innerHTML='<div class="ro-hab-loading">Lecture du PDF…</div>';
  try{
    const read=await root.RailOpsHabilitationsPdf.readHabilitationPdf(file);
    const parsed=root.RailOpsHabilitationsParser.extractProfileQualifications(read.text);
    pendingFile=file;pendingRead=read;pendingParsed=parsed;
    slot.innerHTML=previewHtml(parsed,read);
    slot.querySelector('.ro-hab-cancel')?.addEventListener('click',()=>{pendingFile=null;pendingRead=null;pendingParsed=null;slot.innerHTML='';});
    const confirm=slot.querySelector('.ro-hab-confirm');
    confirm.disabled=!parsed.ok;
    confirm.addEventListener('click',()=>confirmPending(target,confirm));
  }catch(error){
    console.error('[RailOps habilitations] lecture PDF',error);
    slot.innerHTML=`<div class="ro-hab-issues">${esc(error?.message||'Lecture du PDF impossible.')}</div>`;
  }
}

async function confirmPending(target,button){
  const c=client();
  const parsed=pendingParsed,read=pendingRead,file=pendingFile;
  if(!c||!file||!parsed?.ok||!read)return;
  button.disabled=true;button.textContent='Enregistrement…';
  try{
    const {data:userData,error:userError}=await c.auth.getUser();
    if(userError)throw userError;
    const authId=userData?.user?.id;if(!authId)throw new Error('Session RailOps introuvable.');
    const documentId=crypto.randomUUID();
    const storagePath=`${authId}/${documentId}.pdf`;
    const {error:uploadError}=await c.storage.from('railops-habilitations').upload(storagePath,file,{contentType:'application/pdf',upsert:false});
    if(uploadError)throw uploadError;
    const items=flattenParsed(parsed);
    const {error:activationError}=await c.rpc('railops_activate_habilitation_document',{
      p_document_id:documentId,
      p_storage_path:storagePath,
      p_source_method:read.method,
      p_source_confidence:Number.isFinite(read.confidence)?read.confidence:null,
      p_items:items
    });
    if(activationError)throw activationError;
    pendingFile=null;pendingRead=null;pendingParsed=null;
    notify('Habilitation mise à jour ✓','ok');
    await loadActive(target);
  }catch(error){
    console.error('[RailOps habilitations] activation',error);
    notify('Impossible de mettre à jour le document. L’ancienne habilitation reste active.','danger');
    button.disabled=false;button.textContent='Réessayer';
  }
}

async function viewOwnPdf(){
  const c=client();if(!c||!activeRecord?.document_id)return;
  try{
    const {data:userData,error:userError}=await c.auth.getUser();if(userError)throw userError;
    const authId=userData?.user?.id;if(!authId)throw new Error('Session absente');
    const path=`${authId}/${activeRecord.document_id}.pdf`;
    const {data,error}=await c.storage.from(BUCKET).createSignedUrl(path,300);if(error)throw error;
    if(data?.signedUrl)root.open(data.signedUrl,'_blank','noopener');
  }catch(error){console.error('[RailOps habilitations] ouverture PDF',error);notify('PDF indisponible pour le moment.','danger');}
}

function injectProfilePanel(){
  clearTimeout(injectTimer);
  const existing=panel();if(existing)return existing;
  const host=findProfileHost();if(!host)return null;
  ensureStyle();
  const target=document.createElement('section');target.setAttribute(PANEL_ATTR,'1');
  target.innerHTML='<div class="ro-hab-loading">Chargement des qualifications…</div>';
  const actions=host.querySelector('.modal-actions,.msheet-actions,.sheet-actions');
  if(actions&&actions.parentNode===host)host.insertBefore(target,actions);else host.appendChild(target);
  loadActive(target);
  return target;
}
function scheduleInjection(){
  [0,40,120,300,700].forEach(delay=>setTimeout(()=>{if(!panel())injectProfilePanel();},delay));
}
function installProfileHook(){
  const base=root.openProfil;
  if(typeof base!=='function')return false;
  if(base.__railopsHabilitationsWrapped)return true;
  const wrapped=function(){const result=base.apply(this,arguments);scheduleInjection();return result;};
  wrapped.__railopsHabilitationsWrapped=true;
  wrapped.__railopsHabilitationsBase=base;
  root.openProfil=wrapped;
  try{openProfil=wrapped;}catch(_){}
  return true;
}

function install(){
  if(!root.RailOpsHabilitationsParser||!root.RailOpsHabilitationsPdf)return false;
  if(!installProfileHook())return false;
  return true;
}

root.RailOpsHabilitationsProfile={
  version:'1.0.0-profile',
  install,
  injectProfilePanel,
  loadActive,
  flattenParsed,
  currentAgent
};

if(!install()){
  let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>40)clearInterval(timer);},100);
}
})(typeof window!=='undefined'?window:null);
