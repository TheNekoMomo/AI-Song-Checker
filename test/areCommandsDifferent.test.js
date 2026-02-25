const test = require('node:test');
const assert = require('node:assert/strict');

const areCommandsDifferent = require('../src/utils/areCommandsDifferent');

function makeExisting(overrides = {}) {
  return {
    description: 'test command',
    options: [
      {
        name: 'mode',
        description: 'Mode option',
        type: 3,
        required: true,
        choices: [
          { name: 'A', value: 'a' },
          { name: 'B', value: 'b' },
        ],
      },
    ],
    ...overrides,
  };
}

function makeLocal(overrides = {}) {
  return {
    name: 'test',
    description: 'test command',
    options: [
      {
        name: 'mode',
        description: 'Mode option',
        type: 3,
        required: true,
        choices: [
          { name: 'A', value: 'a' },
          { name: 'B', value: 'b' },
        ],
      },
    ],
    callback: () => {},
    ...overrides,
  };
}

test('areCommandsDifferent returns false when command definitions match', () => {
  const existing = makeExisting();
  const local = makeLocal();

  assert.equal(areCommandsDifferent(existing, local), false);
});

test('areCommandsDifferent returns true when command descriptions differ', () => {
  const existing = makeExisting({ description: 'old description' });
  const local = makeLocal({ description: 'new description' });

  assert.equal(areCommandsDifferent(existing, local), true);
});

test('areCommandsDifferent returns true when option is missing on existing command', () => {
  const existing = makeExisting({ options: [] });
  const local = makeLocal();

  assert.equal(areCommandsDifferent(existing, local), true);
});

test('areCommandsDifferent returns true when choice value changes', () => {
  const existing = makeExisting();
  const local = makeLocal({
    options: [
      {
        name: 'mode',
        description: 'Mode option',
        type: 3,
        required: true,
        choices: [
          { name: 'A', value: 'a' },
          { name: 'B', value: 'changed' },
        ],
      },
    ],
  });

  assert.equal(areCommandsDifferent(existing, local), true);
});