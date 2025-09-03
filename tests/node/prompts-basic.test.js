// Basic test for prompts.js using Node.js built-in test runner
import { test, describe } from 'node:test';
import assert from 'node:assert';

// Import the module under test
const prompts = await import('../../src/prompts.js');

describe('Prompts Module - Basic', () => {
  test('should import successfully', () => {
    assert.ok(prompts);
  });

  test('should have expected module structure', () => {
    assert.ok(prompts);
    assert.strictEqual(typeof prompts.promptUser, 'function');
    assert.strictEqual(typeof prompts.confirmAction, 'function');
    assert.strictEqual(typeof prompts.confirmSetup, 'function');
  });

  test('should have correct function signatures', () => {
    // Test that functions exist and have expected parameter counts
    assert.ok(prompts.promptUser.length >= 2); // options, config
    assert.ok(prompts.confirmAction.length >= 1); // message, defaultAnswer
    assert.ok(prompts.confirmSetup.length >= 2); // config, tasks
  });

  test('should have async functions', () => {
    // All prompt functions should be async
    assert.strictEqual(prompts.promptUser.constructor.name, 'AsyncFunction');
    assert.strictEqual(prompts.confirmAction.constructor.name, 'AsyncFunction');
    assert.strictEqual(prompts.confirmSetup.constructor.name, 'AsyncFunction');
  });

  test('should export all expected functions', () => {
    const expectedExports = [
      'promptUser',
      'confirmAction',
      'confirmSetup'
    ];

    for (const exportName of expectedExports) {
      assert.ok(Object.prototype.hasOwnProperty.call(prompts, exportName));
      assert.strictEqual(typeof prompts[exportName], 'function');
    }
  });

  test('should not export unexpected functions', () => {
    // Only the expected functions should be exported
    const exportedKeys = Object.keys(prompts);
    const expectedKeys = [
      'confirmAction',
      'confirmSetup',
      'getProjectSelection',
      'getTaskPreferences',
      'getToolSelection',
      'promptUser'
    ];

    assert.deepStrictEqual(exportedKeys.sort(), expectedKeys.sort());
  });

  test('should have consistent function patterns', () => {
    const promptFunctions = [
      prompts.promptUser,
      prompts.confirmAction,
      prompts.confirmSetup
    ];

    for (const func of promptFunctions) {
      // All should be functions
      assert.strictEqual(typeof func, 'function');

      // All should be async
      assert.strictEqual(func.constructor.name, 'AsyncFunction');
    }
  });

  test('should handle function properties correctly', () => {
    // Test that functions have expected properties
    const promptFunctions = [
      prompts.promptUser,
      prompts.confirmAction,
      prompts.confirmSetup
    ];

    for (const func of promptFunctions) {
      // Test function properties
      assert.ok(func.name); // Function should have a name
      assert.strictEqual(typeof func.toString, 'function'); // Should have toString method
      assert.strictEqual(typeof func.call, 'function'); // Should have call method
      assert.strictEqual(typeof func.apply, 'function'); // Should have apply method
      assert.strictEqual(typeof func.bind, 'function'); // Should have bind method
    }
  });

  test('should handle module properties correctly', () => {
    // Test module-level properties
    assert.ok(Array.isArray(Object.keys(prompts)));
    assert.ok(Object.keys(prompts).length > 0);

    // Test that all exported items are functions
    for (const key of Object.keys(prompts)) {
      assert.strictEqual(typeof prompts[key], 'function');
    }
  });
});
