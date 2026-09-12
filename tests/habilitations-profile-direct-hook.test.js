const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const orderJs=fs.readFileSync('js/core/habilitations-profile-order.js','utf8');

function makeHost(){
  return {
    children:[],
    _candidates:[],
    querySelector(selector){
      if(selector==='[data-railops-habilitations-profile]')return this.children.find(node=>node._panel)||null;
      return null;
    },
    querySelectorAll(){return this._candidates;},
    insertBefore(node,anchor){
      this.children=this.children.filter(x=>x!==node);
      const i=this.children.indexOf(anchor);
      if(i<0)this.children.push(node);else this.children.splice(i,0,node);
      node.parentElement=this;
    }
  };
}
function el(text,parent){return {textContent:text||'',value:'',parentElement:parent,getAttribute(){return '';}};}

let host=null;
let baseCalls=0;
let injectedHost=null;
const listeners={};
const context={
  window:{},
  document:{
    body:{},
    getElementById(id){return id==='movl'?host:null;},
    querySelector(){return null;},
    addEventListener(type,handler,capture){listeners[type]={handler,capture};}
  },
  MutationObserver:class{
    constructor(){throw new Error('MutationObserver fallback must not be installed when openProfil is directly hookable');}
  },
  queueMicrotask(fn){fn();},
  Promise,
  Date,
  console
};
context.window.window=context.window;

const legacyOpenProfil=function(){
  baseCalls++;
  host=makeHost();
  const identity=el('Agent RailOps',host);
  const security=el('',host);
  const logout=el('',host);
  const passwordButton=el('Changer mon mot de passe',security);
  const logoutButton=el('Se déconnecter',logout);
  host._candidates=[passwordButton,logoutButton];
  host.children=[identity,security,logout];
};
context.window.openProfil=legacyOpenProfil;
context.openProfil=legacyOpenProfil;
context.window.RailOpsHabilitationsProfile={
  injectProfilePanel(profileHost){
    injectedHost=profileHost;
    const panel=el('Qualifications professionnelles',profileHost);
    panel._panel=true;
    profileHost.children.push(panel);
    return panel;
  }
};

vm.runInNewContext(orderJs,context);

const api=context.window.RailOpsHabilitationsProfileOrder;
assert.ok(api,'profile order helper must expose its API');
assert.strictEqual(typeof api.installDirectProfileHook,'function','profile integration must expose a direct openProfil lifecycle hook');
assert.notStrictEqual(context.window.openProfil,legacyOpenProfil,'real openProfil must be wrapped directly when available');
assert.strictEqual(listeners.click,undefined,'click-intent fallback must stay disabled when direct openProfil hook is available');

context.window.openProfil();
assert.strictEqual(baseCalls,1,'wrapped openProfil must preserve the legacy profile renderer');
assert.strictEqual(injectedHost,host,'qualifications must mount into the exact profile sheet created by openProfil');
assert.deepStrictEqual(
  host.children.map(node=>node._panel?'panel':node.textContent==='Agent RailOps'?'identity':node===host.children.find(x=>x.textContent===''&&x===node&&x!==undefined)?'other':'other'),
  ['identity','panel','other','other'],
  'qualifications must be inserted immediately after identity and before profile security/actions'
);
assert.strictEqual(host.children[1]._panel,true,'qualifications panel must be the second top-level profile block');

console.log('habilitations direct openProfil lifecycle hook: ok');
