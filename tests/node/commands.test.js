// Test for commands.js using Node.js built-in test runner
import { test, describe } from 'node:test';
import assert from 'node:assert';

// Import the module under test
const commands = await import('../../src/commands.js');

describe('Commands Module', () => {
  test('should have expected module structure', () => {
    assert.ok(commands);
    assert.strictEqual(typeof commands.initCommand, 'function');
    assert.strictEqual(typeof commands.updateCommand, 'function');
    assert.strictEqual(typeof commands.configCommand, 'function');
    assert.strictEqual(typeof commands.removeCommand, 'function');
  });

  test('should have correct function signatures', () => {
    // All command functions take options parameter
    assert.ok(commands.initCommand.length >= 1); // options
    assert.ok(commands.updateCommand.length >= 1); // options
    assert.ok(commands.configCommand.length >= 1); // options
    assert.ok(commands.removeCommand.length >= 1); // options
  });

  test('should have async functions', () => {
    // All command functions should be async
    assert.strictEqual(commands.initCommand.constructor.name, 'AsyncFunction');
    assert.strictEqual(commands.updateCommand.constructor.name, 'AsyncFunction');
    assert.strictEqual(commands.configCommand.constructor.name, 'AsyncFunction');
    assert.strictEqual(commands.removeCommand.constructor.name, 'AsyncFunction');
  });

  test('should export all expected functions', () => {
    const expectedExports = [
      'initCommand',
      'updateCommand',
      'configCommand',
      'removeCommand'
    ];

    for (const exportName of expectedExports) {
      assert.ok(Object.prototype.hasOwnProperty.call(commands, exportName));
      assert.strictEqual(typeof commands[exportName], 'function');
    }
  });

  test('should not export unexpected functions', () => {
    // Only the expected functions should be exported
    const exportedKeys = Object.keys(commands);
    const expectedKeys = [
      'initCommand',
      'updateCommand',
      'configCommand',
      'removeCommand'
    ];

    assert.deepStrictEqual(exportedKeys.sort(), expectedKeys.sort());
  });

  test('should have consistent function patterns', () => {
    const commandFunctions = [
      commands.initCommand,
      commands.updateCommand,
      commands.configCommand,
      commands.removeCommand
    ];

    for (const func of commandFunctions) {
      // All should be functions
      assert.strictEqual(typeof func, 'function');

      // All should be async
      assert.strictEqual(func.constructor.name, 'AsyncFunction');

      // All should take at least one parameter
      assert.ok(func.length >= 1);
    }
  });
});
