const fs=require('fs');
const assert=require('assert');

const path='js/core/chef-chantier-stats.js';
assert.ok(fs.existsSync(path),'chef chantier secure stats module missing');
const mod=require('../'+path);

const rows=[
  {chantier_id:'A',total_materiels:4,verif1_faite:3,verif2_faite:2,absents:1,hors_service:1},
  {chantier_id:'B',total_materiels:2,verif1_faite:1,verif2_faite:1,absents:0,hors_service:0}
];
const synthetic=mod.buildSyntheticMaterials(rows,'2026-09-07');
assert.equal(synthetic.length,6,'must preserve aggregate material totals without real references');
assert.equal(synthetic.filter(x=>x.verifLundi?.weekKey==='2026-09-07').length,4,'V1 aggregate mismatch');
assert.equal(synthetic.filter(x=>x.verifSemaine?.weekKey==='2026-09-07').length,3,'V2 aggregate mismatch');
assert.equal(synthetic.filter(x=>x.presence==='absent').length,1,'absence aggregate mismatch');
assert.equal(synthetic.filter(x=>x.etat==='hors-service').length,1,'hors-service aggregate mismatch');
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

console.log('chef chantier secure stats contract: ok');
