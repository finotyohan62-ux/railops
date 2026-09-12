const fs=require('fs');
const assert=require('assert');
const path='prototype/habilitations-demo.html';
assert.ok(fs.existsSync(path),'standalone habilitation demo must exist');
const html=fs.readFileSync(path,'utf8');
assert.ok(html.includes('id="hab-file"'),'demo must provide a PDF file picker');
assert.ok(html.includes('id="hab-confirm"'),'demo must provide a local confirmation button');
assert.ok(html.includes('disabled>Confirmer'),'confirmation must be disabled before a valid parse');
assert.ok(html.includes('RailOpsHabilitationsPdf.readHabilitationPdf'),'demo must use the isolated PDF reader');
assert.ok(html.includes('RailOpsHabilitationsParser.extractHabilitations'),'demo must use the isolated parser');
assert.ok(html.includes('Aucun fichier n’est envoyé'),'demo must make local-only behavior explicit');
assert.ok(!/type="(?:text|date)"[^>]*(?:code|valid)/i.test(html),'prototype must not let the agent freely rewrite extracted habilitation data');
for(const forbidden of ['supabase','vercel','railops_activate_habilitation_document','storage.from']){
  assert.ok(!html.toLowerCase().includes(forbidden.toLowerCase()),`standalone demo must not integrate persistence: ${forbidden}`);
}
console.log('habilitations standalone prototype contract: ok');
