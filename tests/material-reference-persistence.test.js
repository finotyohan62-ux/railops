const fs=require('node:fs');
const path=require('node:path');
function fail(m){console.error('FAIL:',m);process.exit(1)}
const root=path.resolve(__dirname,'..');
const sync=fs.readFileSync(path.join(root,'js/core/sync.js'),'utf8');
const legacy=fs.readFileSync(path.join(root,'js/legacy-core.js'),'utf8');
const register=fs.readFileSync(path.join(root,'js/core/register-import-v156.js'),'utf8');

if(!sync.includes("db.rpc('railops_upsert_material_admin',{p_item:payload})"))fail('chef/admin material persistence does not resolve through the reference-aware RPC');
if(!sync.includes("String(S?.role||'').trim().toLowerCase()==='agent'"))fail('agent update-only path was removed');
if(!sync.includes("String(S?.role||'').trim().toLowerCase()==='cte'"))fail('cte update-only path was removed');
if(!sync.includes("Object.assign(row,resolved)"))fail('resolved server id is not copied back into local material state');
if(!legacy.includes('await roPersistMaterial(b)'))fail('legacy live material save bypasses the central persistence resolver');
if(!register.includes("railops_apply_structured_register_admin"))fail('structured register import/replace no longer uses the atomic reference-aware server path');
if(!register.includes('return baseImport(input)'))fail('unstructured legacy-compatible register fallback was removed');

console.log('PASS: register/material persistence is routed through reference-aware server resolution');
