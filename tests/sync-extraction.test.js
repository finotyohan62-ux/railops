const fs=require('fs');
const assert=require('assert');

const index=fs.readFileSync('index.html','utf8');
const legacy=fs.readFileSync('js/legacy-core.js','utf8');

assert.ok(fs.existsSync('js/core/sync.js'),'js/core/sync.js must exist');
const sync=fs.readFileSync('js/core/sync.js','utf8');

assert.ok(sync.includes("const OFFLINE_KEY='ro_offline_queue';"),'sync.js must own the offline queue key');
assert.ok(sync.includes('function getOfflineQueue(){'),'sync.js must own getOfflineQueue');
assert.ok(sync.includes('function addToOfflineQueue('),'sync.js must own addToOfflineQueue');
assert.ok(sync.includes('async function flushOfflineQueue(){'),'sync.js must own flushOfflineQueue');
assert.ok(sync.includes("window['addEventListener']"),'sync.js must preserve current network listeners');

assert.ok(!legacy.includes("const OFFLINE_KEY='ro_offline_queue';"),'legacy-core.js must no longer own the offline queue block');
assert.ok(legacy.includes('const S='),'legacy-core.js must still own app state');
assert.ok(legacy.includes('db=createClient('),'legacy-core.js must still own the Supabase client');
assert.ok(legacy.includes('function render(){'),'legacy-core.js must still own legacy rendering');

const legacyTag='<script id="railops-legacy-core" src="./js/legacy-core.js"></script>';
const syncTag='<script id="railops-sync" src="./js/core/sync.js"></script>';
assert.strictEqual(index.split(legacyTag).length-1,1,'legacy core must be loaded exactly once');
assert.strictEqual(index.split(syncTag).length-1,1,'sync core must be loaded exactly once');
assert.ok(index.indexOf(legacyTag)<index.indexOf(syncTag),'sync.js must load after legacy-core.js so its historical dependencies already exist');

console.log('sync extraction invariants: ok');
