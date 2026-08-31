const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

function countMeta(name) {
  const pattern = new RegExp(`<meta\\s+name=["']${name}["'][^>]*>`, 'gi');
  return (html.match(pattern) || []).length;
}

assert(countMeta('apple-mobile-web-app-capable') === 1, 'apple-mobile-web-app-capable meta tag must appear exactly once');
assert(countMeta('apple-mobile-web-app-status-bar-style') === 1, 'apple-mobile-web-app-status-bar-style meta tag must appear exactly once');
assert(countMeta('mobile-web-app-capable') === 1, 'mobile-web-app-capable meta tag must appear exactly once');

console.log('PASS: PWA capability meta tags are unique');
