const fs=require('fs');
const assert=require('assert');

const modulePath='js/core/habilitations-profile.js';
assert.ok(fs.existsSync(modulePath),'agent profile habilitation module must exist');
const js=fs.readFileSync(modulePath,'utf8');
const bootstrap=fs.readFileSync('js/core/secure-admin.js','utf8');

const parserPos=bootstrap.indexOf("loadFeatureScript('js/core/habilitations-parser.js')");
const pdfPos=bootstrap.indexOf("loadFeatureScript('js/core/habilitations-pdf.js')");
const profilePos=bootstrap.indexOf("loadFeatureScript('js/core/habilitations-profile.js')");
assert.ok(parserPos>=0&&pdfPos>parserPos&&profilePos>pdfPos,'isolated feature bootstrap must load parser, PDF adapter and profile module sequentially');

assert.ok(/openProfil/.test(js),'integration must hook the existing profile flow');
assert.ok(/S\.currentAgent/.test(js),'profile integration must target the signed-in RailOps agent');
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

console.log('habilitations agent profile integration contract: ok');
