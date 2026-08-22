const fs = require('fs');
const path = require('path');

const indexPath = 'index.html';
const corePath = path.join('js', 'legacy-core.js');
const externalTag = '<script id="railops-legacy-core" src="./js/legacy-core.js"></script>';
const html = fs.readFileSync(indexPath, 'utf8');
const re = /<script>(const a0ax=a0b;[\s\S]*?)<\/script>/;
const match = html.match(re);

if (!match) {
  if (html.includes(externalTag) && fs.existsSync(corePath)) {
    console.log('Legacy core already extracted; nothing to do.');
    process.exit(0);
  }
  throw new Error('Expected historical inline RailOps core script in index.html');
}

if (!match[1].includes("const OFFLINE_KEY='ro_offline_queue';")) {
  throw new Error('Offline queue marker missing; refusing extraction');
}
if (!match[1].includes('createClient(SUPA_URL,SUPA_KEY)')) {
  throw new Error('Supabase initialization marker missing; refusing extraction');
}
if ((html.match(/<script>const a0ax=a0b;/g) || []).length !== 1) {
  throw new Error('Historical core marker is not unique; refusing extraction');
}

fs.mkdirSync(path.dirname(corePath), { recursive: true });
fs.writeFileSync(corePath, match[1], 'utf8');
fs.writeFileSync(indexPath, html.replace(match[0], externalTag), 'utf8');
console.log(`Extracted ${Buffer.byteLength(match[1], 'utf8')} bytes to ${corePath}`);
