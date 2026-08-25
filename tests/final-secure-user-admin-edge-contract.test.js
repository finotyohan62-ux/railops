const fs=require('node:fs');
const path=require('node:path');
function fail(m){console.error('FAIL:',m);process.exit(1)}
const source=fs.readFileSync(path.join(__dirname,'..','js/core/secure-admin.js'),'utf8');
if(!source.includes("invokeAdmin('update_profile'"))fail('profile update is not routed securely');
if(!source.includes("invokeAdmin('delete_user'"))fail('delete is not routed securely');
if(!source.includes("invokeAdmin('change_password'"))fail('password change is not routed securely');
console.log('PASS: secure user admin actions match Edge Function contract');
