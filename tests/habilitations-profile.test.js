const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const modulePath='js/core/habilitations-profile.js';
const orderPath='js/core/habilitations-profile-order.js';
assert.ok(fs.existsSync(modulePath),'agent profile habilitation module must exist');
assert.ok(fs.existsSync(orderPath),'agent profile order helper must exist');
const js=fs.readFileSync(modulePath,'utf8');
const orderJs=fs.readFileSync(orderPath,'utf8');
const bootstrap=fs.readFileSync('js/core/secure-admin.js','utf8');

const parserPos=bootstrap.indexOf("loadFeatureScript('js/core/habilitations-parser.js')");
const pdfPos=bootstrap.indexOf("loadFeatureScript('js/core/habilitations-pdf.js')");
const profilePos=bootstrap.indexOf("loadFeatureScript('js/core/habilitations-profile.js')");
const orderPos=bootstrap.indexOf("loadFeatureScript('js/core/habilitations-profile-order.js')");
assert.ok(parserPos>=0&&pdfPos>parserPos&&profilePos>pdfPos&&orderPos>profilePos,'isolated feature bootstrap must load parser, PDF adapter, profile and profile ordering sequentially');

assert.ok(/openProfil/.test(js),'integration must hook the existing profile flow');
assert.ok(/currentAgent/.test(js)&&/\.agent/.test(js),'profile integration must resolve the signed-in RailOps agent without trusting a foreign profile id');
assert.ok(js.includes('data-railops-habilitations-profile'),'profile integration must guard against duplicate injection');
assert.ok(!/nav-item[^\n]*(habilitation|comp[eé]tence)/i.test(js),'feature must not create a new bottom navigation item');

for(const label of ['Habilitations','Autres compétences','Secourisme']){
  assert.ok(js.includes(label),`profile must display the ${label} block`);
}

assert.ok(js.includes('RailOpsHabilitationsPdf.readHabilitationPdf'),'profile upload must use the isolated PDF reader');
assert.ok(js.includes('RailOpsHabilitationsParser.extractProfileQualifications'),'profile upload must use the validated three-block parser');
assert.ok(js.includes("railops_habilitations_scope"),'profile must load active qualification data through the scoped RPC');
assert.ok(js.includes("railops-habilitations"),'profile must upload PDFs to the private habilitation bucket');
assert.ok(js.includes("railops_activate_habilitation_document"),'profile must activate data through the transactional RPC');
assert.ok(/parsed\.ok/.test(js),'confirmation must depend on a successful parse');
assert.ok(/crypto\.randomUUID\(\)/.test(js),'each uploaded PDF must use a fresh document id');
assert.ok(/auth\.getUser\(\)/.test(js),'storage path must be bound to the authenticated user');

for(const forbidden of [
  ".from('agent_habilitations').insert",
  '.from("agent_habilitations").insert',
  ".from('agent_habilitations').upsert",
  '.from("agent_habilitations").upsert',
  ".from('agent_habilitation_documents').insert",
  '.from("agent_habilitation_documents").insert'
]) assert.ok(!js.includes(forbidden),`profile module must not write protected tables directly: ${forbidden}`);

const uploadPos=js.indexOf(".from('railops-habilitations')");
const activatePos=js.indexOf("railops_activate_habilitation_document");
assert.ok(uploadPos>=0&&activatePos>uploadPos,'PDF upload must happen before transactional activation');

function makeHost(){
  return {
    children:[],
    _candidates:[],
    querySelectorAll(){return this._candidates;},
    querySelector(){return null;},
    insertBefore(node,anchor){
      this.children=this.children.filter(x=>x!==node);
      const i=this.children.indexOf(anchor);
      if(i<0)this.children.push(node);else this.children.splice(i,0,node);
      node.parentElement=this;
    }
  };
}
function el(text,parent){return {textContent:text||'',value:'',parentElement:parent,getAttribute(){return '';}};}
const listeners={};
const context={
  window:{},
  document:{
    querySelector(){return null;},
    getElementById(){return null;},
    addEventListener(type,handler,capture){listeners[type]={handler,capture};}
  },
  setTimeout(fn){fn();},
  console,
  Date,
  Promise
};
context.window.window=context.window;
vm.runInNewContext(orderJs,context);
const orderApi=context.window.RailOpsHabilitationsProfileOrder;
assert.ok(orderApi,'profile order helper must expose its API');

{
  const logoutOnly={textContent:'Agent RailOps · Se déconnecter'};
  assert.strictEqual(orderApi.looksLikeProfile(logoutOnly),true,'profile detection must work even when logout is the only stable account action');
  assert.strictEqual(orderApi.looksLikeProfile({textContent:'Changer le mot de passe'}),false,'a password action alone must not be mistaken for the profile sheet');
}

// Regression: sync.js loads the Habilitations feature before the obfuscated legacy core.
// If window.openProfil is not hookable yet, the real dashboard click must still establish
// an explicit Profile intent. This must not depend on modal copy such as “Déconnexion”.
{
  assert.strictEqual(typeof orderApi.isProfileTrigger,'function','profile integration must expose a structural profile-trigger detector');
  assert.ok(listeners.click&&listeners.click.capture===true,'profile integration must install a capture click bridge before legacy openProfil is hookable');
  const trigger={
    closest(selector){return selector==='[onclick*="openProfil"]'?this:null;},
    getAttribute(name){return name==='onclick'?'openProfil()':null;},
    parentElement:null
  };
  assert.strictEqual(orderApi.isProfileTrigger(trigger),true,'the real openProfil avatar trigger must be recognized structurally');
  assert.strictEqual(orderApi.isProfileTrigger({closest(){return null;},getAttribute(){return null;},parentElement:null}),false,'unrelated controls must not be mistaken for profile triggers');
  listeners.click.handler({target:trigger});
  assert.strictEqual(orderApi.looksLikeProfile({textContent:'Agent RailOps'}),true,'a real profile click must recognize the profile even when the sheet has no logout/password signature');
}

{
  const host=makeHost();
  const identity=el('Agent RailOps',host);
  const security=el('',host);
  const logout=el('',host);
  const panel=el('Qualifications professionnelles',host);
  const passwordButton=el('Changer le mot de passe',security);
  const logoutButton=el('Déconnexion',logout);
  host._candidates=[passwordButton,logoutButton];
  host.children=[identity,security,logout,panel];
  orderApi.placePanel(panel,host);
  assert.deepStrictEqual(host.children.map(x=>x===identity?'identity':x===panel?'panel':x===security?'security':x===logout?'logout':'other'),['identity','panel','security','logout'],'qualifications must sit after identity and before account/security and logout');
}

{
  const host=makeHost();
  const identity=el('Agent RailOps',host);
  const logout=el('',host);
  const panel=el('Qualifications professionnelles',host);
  const logoutButton=el('Se déconnecter',logout);
  host._candidates=[logoutButton];
  host.children=[identity,logout,panel];
  orderApi.placePanel(panel,host);
  assert.deepStrictEqual(host.children.map(x=>x===identity?'identity':x===panel?'panel':x===logout?'logout':'other'),['identity','panel','logout'],'logout must remain the final profile action');
}

console.log('habilitations agent profile integration contract: ok');