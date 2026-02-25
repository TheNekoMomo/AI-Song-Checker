#!/usr/bin/env node

const { execFileSync } = require('node:child_process');

const checks = [
  [process.execPath, ['--check', 'src/types.js']],
  [process.execPath, ['--check', 'src/events/interactionCreate/handleCommands.js']],
  [process.execPath, ['--check', 'src/utils/spotifyHelper.js']],
];

for (const [cmd, args] of checks) {
  execFileSync(cmd, args, { stdio: 'inherit' });
}

console.log('typecheck OK (JSDoc-heavy files parse correctly)');