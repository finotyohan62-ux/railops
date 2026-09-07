const fs=require('fs'); const vm=require('vm'); const assert=require('assert');
const source=fs.readFileSync(__dirname+'/../js/core/secure-admin.js','utf8');
function harness({users=[],agent='Agent Test',isAdminOwner=false}={}){
 const calls=[]; const notices=[];
 const fields={'new-mdp':{value:'nouveau123'},'new-mdp2':{value:'nouveau123'},movl:{remove(){calls.push(['remove-modal']);}}};
 const ctx={
   console:{info(){},error(){},warn(){}}, setTimeout(fn){fn();}, localStorage:{removeItem(){}},
   document:{getElementById(id){return fields[id]||null;}}, toast:(t,k)=>notices.push([t,k]),
   S:{users,agent,isAdminOwner},
   db:{
     auth:{async getSession(){return {data:{session:{access_token:'tok'}}};},async updateUser(payload){calls.push(['updateUser',payload]);return {data:{user:{id:'self-auth'}},error:null};}},
     functions:{async invoke(name,args){calls.push(['invoke',name,args]);return {data:{ok:true},error:null};}}
   },
   window:{}
 }; ctx.window=ctx; vm.createContext(ctx); vm.runInContext(source,ctx); return {ctx,calls,notices};
}
(async()=>{
  const self=harness({users:[]});
  await self.ctx.doChangePass(null,true);
  assert.equal(self.calls.filter(c=>c[0]==='updateUser').length,1,'self password change must use authenticated Supabase user');
  assert.equal(self.calls.filter(c=>c[0]==='invoke').length,0,'self password change must not call admin edge function');

  const admin=harness({users:[{id:'target',nom:'Other'}],isAdminOwner:true});
  await admin.ctx.doChangePass('target',false);
  const invokes=admin.calls.filter(c=>c[0]==='invoke');
  assert.equal(invokes.length,1,'admin reset must call admin edge function');
  assert.equal(invokes[0][2].body.action,'change_password');
  assert.equal(invokes[0][2].body.user_id,'target');
  assert.equal(admin.calls.filter(c=>c[0]==='updateUser').length,0,'admin reset must not update the administrator password');
  console.log('PASS password self/admin runtime');
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
