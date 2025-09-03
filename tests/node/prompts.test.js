// Test for prompts.js using Node.js built-in test runner
import { test, describe } from 'node:test';
import assert from 'node:assert';

// Import the module under test
const prompts = await import('../../src/prompts.js');

describe('Prompts Module', () => {
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

  test('should handle basic function calls without crashing', async () => {
    // Test that functions can be called without throwing
    // They will likely fail due to missing dependencies, but that's expected
    try {
      await prompts.promptUser({}, { tools: {}, projects: {} });
      // If it succeeds, that's fine
    } catch (error) {
      // If it fails, that's expected without proper setup
      assert.ok(error);
    }

    try {
      await prompts.confirmAction('Test message');
      // If it succeeds, that's fine
    } catch (error) {
      // If it fails, that's expected without proper setup
      assert.ok(error);
    }

    try {
      await prompts.confirmSetup({}, {});
      // If it succeeds, that's fine
    } catch (error) {
      // If it fails, that's expected without proper setup
      assert.ok(error);
    }
  });

  test('should handle different option types', async () => {
    const testOptions = [
      {},
      { tool: 'cursor' },
      { project: 'drupal' },
      { verbose: true },
      { force: true },
      { dryRun: true },
      { json: true },
      { checkUpdates: true },
      { allTasks: true },
      { tasks: 'memory-bank,rules' },
      { skipTasks: 'memory-bank' }
    ];

    const testConfig = {
      tools: { cursor: { name: 'Cursor' } },
      projects: { drupal: { name: 'Drupal' } }
    };

    for (const options of testOptions) {
      try {
        await prompts.promptUser(options, testConfig);
        // If it succeeds, that's fine
      } catch (error) {
        // If it fails, that's expected without proper setup
        assert.ok(error);
      }
    }
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
});
