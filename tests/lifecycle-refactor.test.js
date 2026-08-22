const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('index.html', 'utf8');

function count(re) {
  return (source.match(re) || []).length;
}

assert(source.includes('railops-v155-lifecycle'), 'v155 lifecycle manager is missing');
assert(source.includes('RailOpsLifecycleV155'), 'v155 lifecycle API is missing');

assert(!source.includes('const oldRender146=render;'), 'v146 still wraps render directly');
assert(!source.includes('const oldLoad146=load;'), 'v146 still wraps load directly');

assert(!source.includes("if(typeof oldRender==='function')window.render=function(){const r=oldRender.apply(this,arguments);setTimeout(apply,25);return r;};"), 'v142 still wraps render directly');
assert(!source.includes("window.render=function(){const r=oldRender.apply(this,arguments);schedule();return r;};"), 'v154 still wraps render directly');

assert(source.includes("RailOpsLifecycleV155.afterRender('v142-display'"), 'v142 is not registered on the shared render lifecycle');
assert(source.includes("RailOpsLifecycleV155.afterRender('v146-integrity'"), 'v146 is not registered on the shared render lifecycle');
assert(source.includes("RailOpsLifecycleV155.afterLoad('v146-integrity'"), 'v146 is not registered on the shared load lifecycle');
assert(source.includes("RailOpsLifecycleV155.afterRender('v154-inventory-label'"), 'v154 is not registered on the shared render lifecycle');
assert(source.includes("RailOpsLifecycleV155.onMutation('v154-inventory-label'"), 'v154 is not registered on the shared mutation lifecycle');

assert.strictEqual(count(/id=\"railops-v155-lifecycle\"/g), 1, 'there must be exactly one v155 lifecycle manager');

console.log('v155 lifecycle refactor invariants: OK');
