const fs = require('fs');
const path = require('path');

const indexPath = 'index.html';
const cssPath = path.join('css', 'railops.css');
const linkTag = '<link rel="stylesheet" href="./css/railops.css">';

const html = fs.readFileSync(indexPath, 'utf8');
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);

if (!styleMatch) {
  if (html.includes(linkTag) && fs.existsSync(cssPath)) {
    console.log('CSS already extracted; nothing to do.');
    process.exit(0);
  }
  throw new Error('Expected one inline application <style> block in index.html');
}

const remainingStyles = html.slice(styleMatch.index + styleMatch[0].length).match(/<style>[\s\S]*?<\/style>/i);
if (remainingStyles) {
  throw new Error('More than one inline <style> block found; refusing automatic extraction');
}

fs.mkdirSync(path.dirname(cssPath), { recursive: true });
fs.writeFileSync(cssPath, styleMatch[1], 'utf8');
fs.writeFileSync(indexPath, html.replace(styleMatch[0], linkTag), 'utf8');

console.log(`Extracted ${Buffer.byteLength(styleMatch[1], 'utf8')} bytes to ${cssPath}`);
