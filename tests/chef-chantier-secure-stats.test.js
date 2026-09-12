const fs=require('fs');
const assert=require('assert');

const path='js/core/chef-chantier-stats.js';
assert.ok(fs.existsSync(path),'chef chantier secure stats module missing');
const mod=require('../'+path);

// Matches the live RPC shape returned by railops_chef_chantier_tree_stats().
const rows=[
  {chantier_id:'A',parent_id:null,chantier_nom:'Maître',lieu:'X',total_materiels:4,verif_1_ok:3,verif_2_ok:2,verif_1_pct:75,verif_2_pct:50},
  {chantier_id:'B',parent_id:'A',chantier_nom:'Zone B',lieu:'Y',total_materiels:2,verif_1_ok:1,verif_2_ok:1,verif_1_pct:50,verif_2_pct:50}
];
const synthetic=mod.buildSyntheticMaterials(rows,'2026-09-07');
assert.equal(synthetic.length,6,'must preserve aggregate material totals without real references');
assert.equal(synthetic.filter(x=>x.verifLundi?.weekKey==='2026-09-07').length,4,'V1 aggregate mismatch');
assert.equal(synthetic.filter(x=>x.verifSemaine?.weekKey==='2026-09-07').length,3,'V2 aggregate mismatch');
assert.ok(synthetic.every(x=>String(x.id).startsWith('__CHEF_STATS__')),'synthetic rows must never expose business references');

const original=[{id:'REAL-REF',chantierId:'A'}];
let seen=null;
const state={role:'chef_chantier',mat:original,chefChantierStats:rows};
const root={S:state,render(){seen=this.S.mat;return 'ok';}};
mod.install(root,{defer:false});
const result=root.render();
assert.equal(result,'ok');
assert.ok(Array.isArray(seen)&&seen.length===6,'Chef render must consume secure aggregate rows');
assert.strictEqual(root.S.mat,original,'real state must be restored immediately after render');

const normalState={role:'agent',mat:original,chefChantierStats:rows};
let normalSeen=null;
const normalRoot={S:normalState,render(){normalSeen=this.S.mat;}};
mod.install(normalRoot,{defer:false});
normalRoot.render();
assert.strictEqual(normalSeen,original,'non-Chef roles must remain untouched');

const source=fs.readFileSync(path,'utf8');
for(const forbidden of ['db.from','db.rpc','saveOfflineQueue','roPersistMaterial','railops_upsert_scan']){
  assert.ok(!source.includes(forbidden),`stats bridge must be read-only: ${forbidden}`);
}
const sync=fs.readFileSync('js/core/sync.js','utf8');
assert.ok(sync.includes('./js/core/chef-chantier-stats.js'),'sync loader must load Chef stats bridge');

const sqlPath='docs/sql/2026-09-12-fix-chef-chantier-stats.sql';
assert.ok(fs.existsSync(sqlPath),'auditable Chef stats RPC SQL missing');
const sql=fs.readFileSync(sqlPath,'utf8');
assert.ok(sql.includes('railops_chef_chantier_tree_stats'),'must replace the secure Chef stats RPC');
assert.ok(sql.includes('parent_id text')&&sql.includes('verif_1_ok bigint')&&sql.includes('verif_2_ok bigint'),'SQL must preserve the live RPC return signature');
assert.ok(sql.includes("date_trunc('week', current_timestamp at time zone 'Europe/Paris')"),'RPC must count the current local week');
assert.ok(sql.includes('with recursive active_tree'),'RPC scope must match the active global Chef chantier tree');
assert.ok(sql.includes('verifLundi')&&sql.includes('verifSemaine'),'RPC must aggregate both verification passes');
assert.ok(!/select\s+m\.id\s*,/i.test(sql),'RPC must not expose material references');

console.log('chef chantier secure stats contract: ok');
