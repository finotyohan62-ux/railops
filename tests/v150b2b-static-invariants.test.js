const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const runtimeFiles = [
  'v150b2b-loader.js',
  'v150b2b-chef-chantier-stats.js',
  'v150b2b-owner-mode.js',
  'v150b2b-secure-admin.js',
  'v150b2b-secure-delete.js',
  'v150b2b-maintenance.js',
];

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

for (const file of runtimeFiles) {
  const source = read(file);
  assert.equal(
    source.includes('users.mdp'),
    false,
    `${file} must never read or expose users.mdp`
  );
  assert.equal(
    /\.from\(\s*['"]users['"]\s*\)/.test(source),
    false,
    `${file} must not access the users table directly`
  );
  assert.equal(
    source.includes('20260821_v150b2b_strict_rls.sql'),
    false,
    `${file} must not reference the strict RLS migration at runtime`
  );
}

const loader = read('v150b2b-loader.js');
assert.match(
  loader,
  /ctx\.role==='chef_chantier'\?rpc\('railops_chef_chantier_tree_stats'\):Promise\.resolve\(\[\]\)/,
  'Chef de chantier must load server-side aggregate stats explicitly'
);
assert.match(
  loader,
  /S\.chefChantierStats=ctx\.role==='chef_chantier'\?\(chefChantierStats\|\|\[\]\):\[\]/,
  'Chef de chantier aggregate stats must stay isolated in their dedicated state field'
);

const preview = read('v150b2b-test.html');
assert.equal(
  preview.includes('20260821_v150b2b_strict_rls.sql'),
  false,
  'preview page must never auto-reference the strict RLS migration'
);
assert.ok(
  preview.indexOf('v150b2b-loader.js') < preview.indexOf('v150b2b-chef-chantier-stats.js'),
  'secure loader must be injected before the Chef de chantier stats adapter'
);

console.log('PASS: v150B-2B static safety invariants');
