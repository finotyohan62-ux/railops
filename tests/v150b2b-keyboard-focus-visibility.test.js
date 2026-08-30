const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.resolve(__dirname, '../css/railops.css'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

assert(css.includes(':focus-visible'), 'RailOps interactive controls should expose a keyboard-only focus-visible style');
assert(/:focus-visible\s*\{[^}]*outline\s*:\s*2px\s+solid\s+var\(--accent\)/s.test(css), 'focus-visible should use a clear accent outline');
assert(/:focus-visible\s*\{[^}]*outline-offset\s*:\s*2px/s.test(css), 'focus-visible outline should be offset from the control edge');

console.log('PASS: keyboard focus visibility contract');
