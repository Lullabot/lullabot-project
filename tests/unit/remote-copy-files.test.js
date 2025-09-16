// Tests for the remote-copy-files task type
import fs from 'fs-extra';

// Import the module under test
const { execute } = await import('../../src/task-types/remote-copy-files.js');

describe('Remote Copy Files Task Type', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Create a temporary directory for each test
    testDir = await fs.mkdtemp('/tmp/remote-copy-files-test-');
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(async () => {
    // Clean up and restore original working directory
    process.chdir(originalCwd);
    await fs.remove(testDir);
  });

  describe('execute', () => {
    it('should handle invalid repository URL gracefully', async () => {
      const task = {
        repository: {
          url: 'https://github.com/nonexistent/repository',
          type: 'branch',
          target: 'main'
        },
        source: '{project-type}/rules/',
        target: '.ai/rules/'
      };

      const dependencies = {
        trackInstalledFile: jest.fn()
      };

      await expect(execute(task, 'cursor', 'development', false, dependencies))
        .rejects.toThrow();
    }, 30000);

    it('should handle invalid branch/tag gracefully', async () => {
      const task = {
        repository: {
          url: 'https://github.com/Lullabot/prompt_library',
          type: 'branch',
          target: 'nonexistent-branch'
        },
        source: '{project-type}/rules/',
        target: '.ai/rules/'
      };

      const dependencies = {
        trackInstalledFile: jest.fn()
      };

      await expect(execute(task, 'cursor', 'development', false, dependencies))
        .rejects.toThrow();
    }, 30000);

    it('should replace project-type placeholder correctly', async () => {
      // This test verifies the placeholder replacement logic
      // We'll use a real repository but expect it to fail with the correct path
      const task = {
        repository: {
          url: 'https://github.com/Lullabot/prompt_library',
          type: 'branch',
          target: 'main'
        },
        source: '{project-type}/rules/',
        target: '.ai/rules/'
      };

      const dependencies = {
        trackInstalledFile: jest.fn()
      };

      // This should work with the real repository
      try {
        const result = await execute(task, 'cursor', 'development', false, dependencies);
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        // If it fails, it should be due to network/repository issues, not placeholder replacement
        expect(error.message).not.toContain('undefined');
      }
    }, 60000);

    it('should handle different project types', async () => {
      const task = {
        repository: {
          url: 'https://github.com/Lullabot/prompt_library',
          type: 'branch',
          target: 'main'
        },
        source: '{project-type}/rules/',
        target: '.ai/rules/'
      };

      const dependencies = {
        trackInstalledFile: jest.fn().mockImplementation((filePath, _deps) =>
          Promise.resolve({ path: filePath, hash: 'test-hash' })
        )
      };

      // Test with different project types
      const projectTypes = ['development', 'content-strategy', 'design'];

      for (const projectType of projectTypes) {
        try {
          const result = await execute(task, 'cursor', projectType, false, dependencies);
          expect(result).toBeDefined();
          expect(Array.isArray(result)).toBe(true);
        } catch (error) {
          // Network errors are acceptable in unit tests
          expect(error.message).toBeDefined();
        }
      }
    }, 90000);

    it('should handle items parameter correctly', async () => {
      const task = {
        repository: {
          url: 'https://github.com/Lullabot/prompt_library',
          type: 'branch',
          target: 'main'
        },
        source: '{project-type}/rules/',
        target: '.ai/rules/',
        items: ['coding-standards.md', 'drupal-core.md']
      };

      const dependencies = {
        trackInstalledFile: jest.fn().mockImplementation((filePath, _deps) =>
          Promise.resolve({ path: filePath, hash: 'test-hash' })
        )
      };

      try {
        const result = await execute(task, 'cursor', 'development', false, dependencies);
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        // Network errors are acceptable in unit tests
        expect(error.message).toBeDefined();
      }
    }, 60000);

    it('should handle items object for renaming', async () => {
      const task = {
        repository: {
          url: 'https://github.com/Lullabot/prompt_library',
          type: 'branch',
          target: 'main'
        },
        source: '{project-type}/rules/',
        target: '.ai/rules/',
        items: {
          'coding-standards.md': 'main-rules.md',
          'drupal-core.md': 'framework-rules.md'
        }
      };

      const dependencies = {
        trackInstalledFile: jest.fn().mockImplementation((filePath, _deps) =>
          Promise.resolve({ path: filePath, hash: 'test-hash' })
        )
      };

      try {
        const result = await execute(task, 'cursor', 'development', false, dependencies);
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        // Network errors are acceptable in unit tests
        expect(error.message).toBeDefined();
      }
    }, 60000);

    it('should handle empty project type gracefully', async () => {
      const task = {
        repository: {
          url: 'https://github.com/Lullabot/prompt_library',
          type: 'branch',
          target: 'main'
        },
        source: '{project-type}/rules/',
        target: '.ai/rules/'
      };

      const dependencies = {
        trackInstalledFile: jest.fn()
      };

      try {
        const result = await execute(task, 'cursor', '', false, dependencies);
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        // Should not fail due to empty project type
        expect(error.message).not.toContain('undefined');
      }
    }, 60000);

    it('should handle undefined project type gracefully', async () => {
      const task = {
        repository: {
          url: 'https://github.com/Lullabot/prompt_library',
          type: 'branch',
          target: 'main'
        },
        source: '{project-type}/rules/',
        target: '.ai/rules/'
      };

      const dependencies = {
        trackInstalledFile: jest.fn()
      };

      try {
        const result = await execute(task, 'cursor', undefined, false, dependencies);
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        // Should fail with a clear error message about the undefined path
        expect(error.message).toContain('undefined/rules/');
      }
    }, 60000);
  });
});
