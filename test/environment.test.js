const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { isLocal } = require('../src/utils/environment');

const markerPath = path.resolve(__dirname, '..', '.local_marker');

test('isLocal returns false when marker file is absent', () => {
  // ensure the file does not exist
  if (fs.existsSync(markerPath)) {
    fs.unlinkSync(markerPath);
  }
  assert.equal(isLocal(), false);
});

test('isLocal returns true when marker file exists', () => {
  fs.writeFileSync(markerPath, '');
  try {
    assert.equal(isLocal(), true);
  } finally {
    fs.unlinkSync(markerPath);
  }
});
