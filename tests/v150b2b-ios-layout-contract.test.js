const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

function localStyleSources(documentHtml) {
  const sources = [documentHtml];
  const linkPattern = /<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
  for (const match of documentHtml.matchAll(linkPattern)) {
    const href = match[1].split(/[?#]/, 1)[0];
    if (!href || /^(?:https?:)?\/\//i.test(href) || href.startsWith('data:')) continue;
    const cssPath = path.resolve(root, href);
    if (!cssPath.startsWith(root + path.sep) || !fs.existsSync(cssPath)) continue;
    sources.push(fs.readFileSync(cssPath, 'utf8'));
  }
  return sources.join('\n');
}

function metaContents(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...html.matchAll(new RegExp(`<meta\\s+name=["']${escaped}["']\\s+content=["']([^"']*)["']\\s*>`, 'gi'))]
    .map(match => match[1]);
}

function assertConsistentMeta(name) {
  const values = metaContents(name);
  assert.ok(values.length > 0, `${name} metadata must remain present`);
  assert.equal(new Set(values).size, 1, `${name} declarations must not conflict`);
}

const styles = localStyleSources(html);

assert.match(
  html,
  /<meta\s+name="viewport"\s+content="[^"]*width=device-width[^"]*viewport-fit=cover[^"]*">/i,
  'iPhone layout must keep viewport-fit=cover so safe-area insets are exposed'
);

assert.doesNotMatch(
  html,
  /user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\.0+)?/i,
  'mobile viewport must not disable user zoom'
);

assert.match(
  styles,
  /-webkit-text-size-adjust\s*:\s*100%/i,
  'Safari must keep predictable text sizing without disabling system text scaling'
);

assert.match(
  html,
  /<meta\s+name="apple-mobile-web-app-title"\s+content="RailOps"\s*>/i,
  'iOS standalone mode must keep the RailOps app title'
);

assertConsistentMeta('apple-mobile-web-app-capable');
assertConsistentMeta('apple-mobile-web-app-status-bar-style');

assert.match(
  styles,
  /#app\{[^}]*padding-left:env\(safe-area-inset-left,0px\)[^}]*padding-right:env\(safe-area-inset-right,0px\)[^}]*top:env\(safe-area-inset-top,0px\)/i,
  'app shell must preserve iPhone top and side safe areas'
);

assert.match(
  styles,
  /\.bnav\{[^}]*padding:[^;}]*env\(safe-area-inset-bottom,12px\)/i,
  'bottom navigation must preserve the iPhone home-indicator safe area'
);

assert.match(
  styles,
  /\.ni\{[^}]*min-height:44px/i,
  'bottom navigation items must keep a 44px minimum touch target on iPhone'
);

assert.match(
  styles,
  /\.tbk\{[^}]*min-width:44px[^}]*min-height:44px/i,
  'top-bar back buttons must keep a 44px minimum touch target on iPhone'
);

assert.match(
  styles,
  /\.btn\{[^}]*min-height:44px/i,
  'primary action buttons must keep a 44px minimum touch target on mobile'
);

assert.match(
  styles,
  /\.screen\{[^}]*overflow-y:auto[^}]*-webkit-overflow-scrolling:touch/i,
  'scrollable screens must preserve momentum scrolling on iOS'
);

assert.match(
  styles,
  /\.msheet\{[^}]*padding:[^;}]*calc\(32px\s*\+\s*env\(safe-area-inset-bottom,0px\)\)/i,
  'bottom sheets must keep their actions above the iPhone home indicator'
);

assert.match(
  styles,
  /\.fab\{[^}]*bottom:calc\(76px\s*\+\s*env\(safe-area-inset-bottom,0px\)\)/i,
  'floating action buttons must stay above the iPhone home-indicator safe area'
);

console.log('PASS: iPhone/mobile layout safety contract is preserved');
