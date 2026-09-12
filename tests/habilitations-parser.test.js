const assert=require('assert');
const parser=require('../js/core/habilitations-parser.js');

assert.equal(parser.normalizeCode('H3 B3'),'H3B3');
assert.equal(parser.normalizeCode('CH3 / CB3'),'CH3CB3');
assert.equal(parser.normalizeCode('APS 9'),'APS9');

const text=`
H1B1 - valable jusqu'au 15/04/2027
S11 - validité 03/11/2026
APS9 - échéance : 28/09/2026
`;
const parsed=parser.extractHabilitations(text);
assert.equal(parsed.ok,true);
assert.deepEqual(parsed.items.map(x=>[x.code,x.validUntil]),[
  ['H1B1','2027-04-15'],
  ['S11','2026-11-03'],
  ['APS9','2026-09-28']
]);

const ambiguous=parser.extractHabilitations('H3B3 S11\nValidité : 31/12/2027');
assert.equal(ambiguous.ok,false);
assert.ok(ambiguous.ambiguities.length>0);

assert.equal(parser.habilitationStatus('2026-09-11','2026-09-12',60),'expired');
assert.equal(parser.habilitationStatus('2026-10-01','2026-09-12',60),'expiring');
assert.equal(parser.habilitationStatus('2027-04-15','2026-09-12',60),'valid');
assert.equal(parser.parseFrenchDate('31/02/2027'),null,'invalid calendar dates must be rejected');

const duplicate=parser.extractHabilitations(`
CH3 / CB3 - valable jusqu’au 01-12-2027
CH3CB3 - valable jusqu'au 01/12/2027
`);
assert.equal(duplicate.ok,true);
assert.deepEqual(duplicate.items.map(x=>[x.code,x.validUntil]),[['CH3CB3','2027-12-01']]);

const undated=parser.extractHabilitations('H1B1 - habilitation électrique');
assert.equal(undated.ok,false);
assert.ok(undated.ambiguities.length>0);

const conflicting=parser.extractHabilitations(`
S11 - validité 03/11/2026
S11 - validité 03/11/2027
`);
assert.equal(conflicting.ok,false,'same code with conflicting validity dates must block activation');
assert.ok(conflicting.ambiguities.some(x=>x.includes('S11')));

const datedRange=parser.extractHabilitations(`
H1B1 - du 15/04/2024 au 15/04/2027
S11 - du 03/11/2024 au 03/11/2026
`);
assert.equal(datedRange.ok,true,'a row with start and end dates must be accepted');
assert.deepEqual(datedRange.items.map(x=>[x.code,x.validFrom,x.validUntil]),[
  ['H1B1','2024-04-15','2027-04-15'],
  ['S11','2024-11-03','2026-11-03']
]);

const repeatedTitle=parser.extractHabilitations(`
Habilitation H1B1
H1B1 - valable jusqu'au 15/04/2027
`);
assert.equal(repeatedTitle.ok,true,'an undated title mention must not invalidate a dated occurrence of the same code');
assert.deepEqual(repeatedTitle.items.map(x=>[x.code,x.validUntil]),[['H1B1','2027-04-15']]);

const reversedRange=parser.extractHabilitations('APS9 - du 28/09/2027 au 28/09/2026');
assert.equal(reversedRange.ok,false,'a reversed validity range must be rejected');

const incompleteRangeTable=parser.extractHabilitations(`
Habilitation    Debut    Fin
H3B3            12/01/2025
S11             03/11/2024    03/11/2026
`);
assert.equal(incompleteRangeTable.ok,false,'a lone date in a Debut/Fin table must not be guessed as the expiry date');
assert.ok(incompleteRangeTable.ambiguities.some(x=>x.includes('H3B3')));

// Anonymous regression fixture based on the real SFERIS title layout supplied for acceptance testing.
// Real names, identifiers and document IDs are deliberately not committed.
const sferisTitle=parser.extractHabilitations(`
Volet Habilitation
TES M - ASP déplacement dans les emprises    Date d'Habilitation    Date limite d'Habilitation
20/01/2025    19/01/2028
Particularité de l'habilitation
TSAE op - Agent Prestataire S9    Date d'Habilitation    Date limite d'Habilitation
31/03/2026    30/03/2029
Particularité de l'habilitation
TSAE op - CH1CB1 - Protection Electrique Caténaire    Date d'Habilitation    Date limite d'Habilitation
20/01/2025    19/01/2028
Volet autre(s) Compétence(s)
Certification - Risques électriques C0    20/01/2025    19/01/2028
Volet Secourisme
Validité : 11/02/2028
`);
assert.equal(sferisTitle.ok,true,'the real-world SFERIS table structure must be parsed without guessing');
assert.deepEqual(sferisTitle.items.map(x=>[x.code,x.validFrom,x.validUntil]),[
  ['TESM','2025-01-20','2028-01-19'],
  ['S9','2026-03-31','2029-03-30'],
  ['CH1CB1','2025-01-20','2028-01-19']
]);
assert.ok(sferisTitle.items[0].labelSource.includes('ASP déplacement dans les emprises'),'official row wording must be preserved');
assert.ok(!sferisTitle.items.some(x=>x.code==='C0'),'other competencies must not be silently mixed into the habilitation section');

console.log('habilitations parser contract: ok');
