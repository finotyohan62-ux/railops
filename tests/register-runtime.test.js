const fs=require('fs');const vm=require('vm');const assert=require('assert');
const source=fs.readFileSync(__dirname+'/../js/core/secure-register.js','utf8');
function element(value=''){return {value,id:'',name:'',placeholder:'',options:[],getAttribute(){return null;}};}
function harness({invokeResult,sessionError=null,getUserResult={data:{user:{id:'auth-1'}},error:null}}={}){
  const calls=[];const notices=[];const storage=new Map();
  const fields={in:element('Agent Test'),ib:element('B123'),ip:element('secret123'),ir:element('agent'),ic:element('INVITE')};
  Object.entries(fields).forEach(([id,el])=>el.id=id);
  const button={disabled:false,textContent:'Créer mon compte'};
  const app={querySelectorAll(sel){if(sel==='input[type="password"]')return [fields.ip];if(sel==='select')return [fields.ir];return Object.values(fields);}};
  const document={
    getElementById(id){if(id==='app')return app;return fields[id]||null;},
    querySelector(sel){return sel.includes('doInscription')?button:null;},
    contains(x){return x===button;}
  };
  const ctx={
    console:{info(){},warn(){},error(){}},JSON,
    document,toast:(t,k)=>notices.push([t,k]),S:{agent:null,role:null,page:'login'},
    localStorage:{removeItem(k){storage.delete(k);calls.push(['removeItem',k]);},setItem(k,v){storage.set(k,v);calls.push(['setItem',k,v]);}},
    db:{
      functions:{async invoke(name,args){calls.push(['invoke',name,args]);return invokeResult||{data:{ok:true,session:{access_token:'at',refresh_token:'rt'},profile:{nom:'Agent Test',role:'agent'}},error:null};}},
      auth:{async setSession(payload){calls.push(['setSession',payload]);return {error:sessionError};},async getUser(){calls.push(['getUser']);return getUserResult;}}
    },
    async load(){calls.push(['load']);},render(){calls.push(['render']);},setupRealtime(){calls.push(['setupRealtime']);},flushOfflineQueue(){calls.push(['flushOfflineQueue']);},
    setTimeout(fn,ms){calls.push(['timeout',ms]);fn();},window:{}
  };ctx.window=ctx;vm.createContext(ctx);vm.runInContext(source,ctx);return {ctx,calls,notices,button,storage};
}
(async()=>{
  {
    const h=harness();await h.ctx.doInscription();
    const invoke=h.calls.find(c=>c[0]==='invoke');assert.ok(invoke,'register edge function must be called');
    assert.equal(invoke[1],'railops-register');
    assert.deepEqual(JSON.parse(JSON.stringify(invoke[2].body)),{nom:'Agent Test',badge:'B123',password:'secret123',role:'agent',invitation_code:'INVITE'});
    assert.equal(h.calls.filter(c=>c[0]==='setSession').length,1);assert.equal(h.calls.filter(c=>c[0]==='getUser').length,1);assert.equal(h.calls.filter(c=>c[0]==='load').length,1);
    assert.equal(h.ctx.S.agent,'Agent Test');assert.equal(h.ctx.S.role,'agent');assert.equal(h.ctx.S.page,'dashboard');
    assert.ok(h.notices.some(n=>n[0]==='Compte créé ✓'&&n[1]==='ok'),'success must be reported');
    assert.equal(h.button.disabled,false);assert.equal(h.button.textContent,'Créer mon compte');
  }
  {
    const h=harness({invokeResult:{data:{ok:false,code:'BAD_INVITATION_CODE'},error:null}});await h.ctx.doInscription();
    assert.equal(h.calls.filter(c=>c[0]==='setSession').length,0,'failed registration must not install a session');
    assert.equal(h.ctx.S.page,'login');assert.ok(h.notices.some(n=>n[0]==='Code d’invitation incorrect.'&&n[1]==='danger'));
  }
  {
    const h=harness({invokeResult:{data:{ok:true,session:{access_token:'at',refresh_token:'rt'},profile:{}},error:null}});await h.ctx.doInscription();
    assert.equal(h.ctx.S.page,'login','incomplete profile must not enter dashboard');assert.equal(h.calls.filter(c=>c[0]==='load').length,0);
    assert.ok(h.notices.some(n=>n[0].startsWith('Création du compte impossible')));
  }
  console.log('PASS registration runtime (3 cases)');
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
