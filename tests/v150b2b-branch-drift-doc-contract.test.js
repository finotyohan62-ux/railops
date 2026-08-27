const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const docPath = path.join(root, 'docs', 'v150b2b-branch-drift-review.md');
const doc = fs.readFileSync(docPath, 'utf8');

assert.match(doc, /SHA courant de `main`/i, 'La revue doit relever le SHA de main');
assert.match(doc, /SHA de la branche/i, 'La revue doit relever le SHA de la branche');
assert.match(doc, /merge-base/i, 'La revue doit relever le merge-base');
assert.match(doc, /Supabase réel en lecture seule/i, 'La revue doit exiger une vérification Supabase en lecture seule');
assert.match(doc, /aucun merge, rebase ou cherry-pick automatique/i, 'La revue doit interdire les synchronisations automatiques');
assert.match(doc, /aucune modification de `main`/i, 'La revue doit garder main intact');
assert.match(doc, /validation explicite avant merge, rebase ou cherry-pick/i, 'Les changements runtime doivent rester soumis à validation explicite');

console.log('PASS: branch drift review documentation keeps the read-only safety contract explicit');
