const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { extractPreviewModules } = require('./v150b2b-preview-modules.js');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

const preview = read('v150b2b-test.html');
const runtimeFiles = extractPreviewModules(preview);

assert.ok(runtimeFiles.length > 0, 'preview must inject at least one v150B-2B runtime module');

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

const chefStatsAdapter = read('v150b2b-chef-chantier-stats.js');
assert.equal(
  /\bdb\s*\./.test(chefStatsAdapter),
  false,
  'Chef de chantier stats adapter must remain display-only and must not call Supabase directly'
);
assert.equal(
  /\.(?:insert|update|upsert|delete)\s*\(/.test(chefStatsAdapter),
  false,
  'Chef de chantier stats adapter must never contain persistence mutations'
);

assert.equal(
  preview.includes('20260821_v150b2b_strict_rls.sql'),
  false,
  'preview page must never auto-reference the strict RLS migration'
);
assert.ok(
  preview.indexOf('v150b2b-loader.js') < preview.indexOf('v150b2b-chef-chantier-stats.js'),
  'secure loader must be injected before the Chef de chantier stats adapter'
);

console.log(`PASS: v150B-2B static safety invariants (${runtimeFiles.length} preview modules covered)`);
