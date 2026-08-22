const fs = require('fs');
const path = require('path');

const indexPath = 'index.html';
const lifecyclePath = path.join('js', 'core', 'lifecycle.js');
const externalTag = '<script id="railops-v155-lifecycle" src="./js/core/lifecycle.js"></script>';

const html = fs.readFileSync(indexPath, 'utf8');
const re = /<script id="railops-v155-lifecycle">([\s\S]*?)<\/script>/;
const match = html.match(re);

if (!match) {
  if (html.includes(externalTag) && fs.existsSync(lifecyclePath)) {
    console.log('Lifecycle already extracted; nothing to do.');
    process.exit(0);
  }
  throw new Error('Expected inline railops-v155-lifecycle script in index.html');
}

if (!match[1].includes("const VERSION='155-lifecycle-cleanup';")) {
  throw new Error('Lifecycle marker not found; refusing extraction');
}

fs.mkdirSync(path.dirname(lifecyclePath), { recursive: true });
fs.writeFileSync(lifecyclePath, match[1], 'utf8');
fs.writeFileSync(indexPath, html.replace(match[0], externalTag), 'utf8');

console.log(`Extracted ${Buffer.byteLength(match[1], 'utf8')} bytes to ${lifecyclePath}`);
