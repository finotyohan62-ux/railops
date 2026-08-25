const fs=require('node:fs');
const path=require('node:path');
function fail(m){console.error('FAIL:',m);process.exit(1)}
const root=path.resolve(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const modulePath=path.join(root,'js/core/secure-admin.js');
if(!fs.existsSync(modulePath))fail('secure user-admin module missing');
const admin=fs.readFileSync(modulePath,'utf8');
if(!index.includes('js/core/secure-admin.js'))fail('secure user-admin module is not loaded by production index');
if(!admin.includes("db.functions.invoke('railops-user-admin'"))fail('user mutations do not use railops-user-admin edge function');
for(const action of ['update_profile','delete_user','change_password'])if(!admin.includes(action))fail('missing secure user action '+action);
if(!admin.includes('window.saveUser='))fail('legacy saveUser is not overridden');
if(!admin.includes('window.doDeleteUser='))fail('legacy delete user is not overridden');
if(!admin.includes('window.doChangePass='))fail('legacy password change is not overridden');
console.log('PASS: authenticated user administration routes through secure Edge Function');
