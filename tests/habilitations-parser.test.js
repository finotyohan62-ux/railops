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

console.log('habilitations parser contract: ok');
