#!/usr/bin/env node

const { readdirSync, statSync } = require('node:fs');
const { join, extname } = require('node:path');
const { execFileSync } = require('node:child_process');

const root = process.cwd();
const skipDirs = new Set(['.git', 'node_modules']);

function getJsFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (skipDirs.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...getJsFiles(full));
    } else if (extname(full) === '.js') {
      out.push(full);
    }
  }
  return out;
}

const jsFiles = getJsFiles(root);
let hasError = false;

for (const file of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (error) {
    hasError = true;
    process.stderr.write(`Syntax error in ${file}\n`);
    if (error.stderr) process.stderr.write(String(error.stderr));
  }

}

if (hasError) {
  process.exit(1);
}

console.log(`lint OK (${jsFiles.length} JS files checked)`);