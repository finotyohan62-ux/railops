const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('index.html', 'utf8');

function count(re) {
  return (source.match(re) || []).length;
}

assert(source.includes('id="railops-v155-lifecycle"'), 'v155 lifecycle manager is missing');
assert(source.includes('RailOpsLifecycleV155'), 'v155 lifecycle API is missing');
assert(source.includes("beforeRender(name,fn)"), 'v155 beforeRender API is missing');
assert(source.includes("afterRender(name,fn)"), 'v155 afterRender API is missing');
assert(source.includes("afterLoad(name,fn)"), 'v155 afterLoad API is missing');
assert(source.includes("onMutation(name,fn)"), 'v155 mutation API is missing');

// v140/v142/v146/v154 must no longer wrap render themselves.
assert(!source.includes('const oldRender=render;'), 'a legacy render wrapper is still present');
assert(!source.includes('const oldRender146=render;'), 'v146 still wraps render directly');
assert(!source.includes("const oldRender=window.render;"), 'a window.render wrapper is still present');

// v140/v145/v146/v149 must no longer wrap load themselves.
assert(!source.includes('const oldLoad=load;'), 'a legacy load wrapper is still present');
assert(!source.includes('const oldLoad145=load;'), 'v145 still wraps load directly');
assert(!source.includes('const oldLoad146=load;'), 'v146 still wraps load directly');
assert(!source.includes('const oldLoad149=load;'), 'v149 still wraps load directly');

assert(source.includes("RailOpsLifecycleV155.afterRender('v140-stable'"), 'v140 is not registered on the shared render lifecycle');
assert(source.includes("RailOpsLifecycleV155.afterLoad('v140-stable'"), 'v140 is not registered on the shared load lifecycle');
assert(source.includes("RailOpsLifecycleV155.onMutation('v142-display'"), 'v142 is not registered on the shared mutation lifecycle');
assert(source.includes("RailOpsLifecycleV155.afterRender('v142-display'"), 'v142 is not registered on the shared render lifecycle');
assert(source.includes("RailOpsLifecycleV155.afterLoad('v145-cleanup'"), 'v145 is not registered on the shared load lifecycle');
assert(source.includes("RailOpsLifecycleV155.beforeRender('v146-integrity'"), 'v146 is not registered before render');
assert(source.includes("RailOpsLifecycleV155.afterRender('v146-integrity'"), 'v146 is not registered after render');
assert(source.includes("RailOpsLifecycleV155.afterLoad('v146-integrity'"), 'v146 is not registered on the shared load lifecycle');
assert(source.includes("RailOpsLifecycleV155.afterLoad('v149-archive'"), 'v149 is not registered on the shared load lifecycle');
assert(source.includes("RailOpsLifecycleV155.afterRender('inventory-label'"), 'inventory label normalization is not registered on the shared render lifecycle');
assert(source.includes("RailOpsLifecycleV155.onMutation('inventory-label'"), 'inventory label normalization is not registered on the shared mutation lifecycle');

assert(!source.includes('id="railops-v154-inventory-responsible-label-fix"'), 'v154 still exists as an independent patch');
assert(source.includes('id="railops-inventory-responsible-label"'), 'inventory label normalizer is missing');

assert.strictEqual(count(/id="railops-v155-lifecycle"/g), 1, 'there must be exactly one v155 lifecycle manager');
assert.strictEqual(count(/new MutationObserver\(/g), 1, 'there must be exactly one global MutationObserver');

console.log('v155 lifecycle refactor invariants: OK');
