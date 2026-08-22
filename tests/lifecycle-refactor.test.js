const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');
const lifecyclePath = 'js/core/lifecycle.js';
assert(fs.existsSync(lifecyclePath), 'external v155 lifecycle core is missing');
const lifecycle = fs.readFileSync(lifecyclePath, 'utf8');
const source = html + '\n' + lifecycle;

function count(re) {
  return (source.match(re) || []).length;
}

assert(html.includes('id="railops-v155-lifecycle"'), 'v155 lifecycle script marker is missing');
assert(html.includes('src="./js/core/lifecycle.js"'), 'v155 lifecycle external script is missing');
assert(lifecycle.includes('RailOpsLifecycleV155'), 'v155 lifecycle API is missing');
assert(lifecycle.includes("beforeRender(name,fn)"), 'v155 beforeRender API is missing');
assert(lifecycle.includes("afterRender(name,fn)"), 'v155 afterRender API is missing');
assert(lifecycle.includes("afterLoad(name,fn)"), 'v155 afterLoad API is missing');
assert(lifecycle.includes("onMutation(name,fn)"), 'v155 mutation API is missing');

// v140/v142/v146/v154 must no longer wrap render themselves.
assert(!source.includes('const oldRender=render;'), 'a legacy render wrapper is still present');
assert(!source.includes('const oldRender146=render;'), 'v146 still wraps render directly');
assert(!source.includes("const oldRender=window.render;"), 'a window.render wrapper is still present');

// v140/v145/v146/v149 must no longer wrap load themselves.
assert(!source.includes('const oldLoad=load;'), 'a legacy load wrapper is still present');
assert(!source.includes('const oldLoad145=load;'), 'v145 still wraps load directly');
assert(!source.includes('const oldLoad146=load;'), 'v146 still wraps load directly');
assert(!source.includes('const oldLoad149=load;'), 'v149 still wraps load directly');

assert(html.includes("RailOpsLifecycleV155.afterRender('v140-stable'"), 'v140 is not registered on the shared render lifecycle');
assert(html.includes("RailOpsLifecycleV155.afterLoad('v140-stable'"), 'v140 is not registered on the shared load lifecycle');
assert(html.includes("RailOpsLifecycleV155.onMutation('v142-display'"), 'v142 is not registered on the shared mutation lifecycle');
assert(html.includes("RailOpsLifecycleV155.afterRender('v142-display'"), 'v142 is not registered on the shared render lifecycle');
assert(html.includes("RailOpsLifecycleV155.afterLoad('v145-cleanup'"), 'v145 is not registered on the shared load lifecycle');
assert(html.includes("RailOpsLifecycleV155.beforeRender('v146-integrity'"), 'v146 is not registered before render');
assert(html.includes("RailOpsLifecycleV155.afterRender('v146-integrity'"), 'v146 is not registered after render');
assert(html.includes("RailOpsLifecycleV155.afterLoad('v146-integrity'"), 'v146 is not registered on the shared load lifecycle');
assert(html.includes("RailOpsLifecycleV155.afterLoad('v149-archive'"), 'v149 is not registered on the shared load lifecycle');
assert(html.includes("RailOpsLifecycleV155.afterRender('inventory-label'"), 'inventory label normalization is not registered on the shared render lifecycle');
assert(html.includes("RailOpsLifecycleV155.onMutation('inventory-label'"), 'inventory label normalization is not registered on the shared mutation lifecycle');

assert(!source.includes('id="railops-v154-inventory-responsible-label-fix"'), 'v154 still exists as an independent patch');
assert(html.includes('id="railops-inventory-responsible-label"'), 'inventory label normalizer is missing');

assert.strictEqual((html.match(/id="railops-v155-lifecycle"/g) || []).length, 1, 'there must be exactly one v155 lifecycle script marker');
assert.strictEqual(count(/const observerV155=new MutationObserver\(/g), 1, 'there must be exactly one v155 lifecycle observer');
assert(!source.includes('new MutationObserver(schedule)'), 'a legacy patch MutationObserver is still present');

console.log('v155 lifecycle refactor invariants: OK');
