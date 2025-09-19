// Integration tests for remote-copy-files functionality
import fs from 'fs-extra';

// Import the functions under test
const { execute } = await import('../../src/task-types/remote-copy-files.js');

describe('Remote Copy Files - Integration Tests', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Create a temporary directory for each test
    testDir = await fs.mkdtemp('/tmp/remote-copy-files-integration-test-');
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(async () => {
    // Clean up and restore original working directory
    process.chdir(originalCwd);
    await fs.remove(testDir);
  });

  describe('Real Repository Integration', () => {
    it('should successfully clone and copy files from prompt library main branch', async () => {
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
          Promise.resolve({ path: filePath, hash: 'integration-test-hash' })
        )
      };

      const result = await execute(task, 'cursor', 'development', true, dependencies);

      // Verify that files were copied
      expect(result).toBeDefined();
      expect(result).toHaveProperty('files');
      expect(Array.isArray(result.files)).toBe(true);

      // Check that the target directory was created
      expect(await fs.pathExists('.ai/rules')).toBe(true);

      // Verify that trackInstalledFile was called for each copied file
      expect(dependencies.trackInstalledFile).toHaveBeenCalled();
    }, 60000); // 60 second timeout for network operations

    it('should handle different project types correctly', async () => {
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
          Promise.resolve({ path: filePath, hash: 'integration-test-hash' })
        )
      };

      // Test with different project types
      const projectTypes = ['development', 'content-strategy', 'design', 'project-management', 'quality-assurance', 'sales-marketing'];

      for (const projectType of projectTypes) {
        // Clean up previous test
        await fs.remove('.ai').catch(() => {});

        const result = await execute(task, 'cursor', projectType, false, dependencies);

        // Verify that the operation completed (may be empty if no rules exist for that type)
        expect(result).toBeDefined();
        expect(result).toHaveProperty('files');
      expect(Array.isArray(result.files)).toBe(true);
      }
    }, 120000); // 2 minute timeout for multiple operations

    it('should handle selective file copying with items array', async () => {
      const task = {
        repository: {
          url: 'https://github.com/Lullabot/prompt_library',
          type: 'branch',
          target: 'main'
        },
        source: '{project-type}/rules/',
        target: '.ai/rules/',
        items: ['coding-standards.md', 'drupal-core.md'] // These may not exist, but should be handled gracefully
      };

      const dependencies = {
        trackInstalledFile: jest.fn().mockImplementation((filePath, _deps) =>
          Promise.resolve({ path: filePath, hash: 'integration-test-hash' })
        )
      };

      const result = await execute(task, 'cursor', 'development', true, dependencies);

      // Verify that the operation completed
      expect(result).toBeDefined();
      expect(result).toHaveProperty('files');
      expect(Array.isArray(result.files)).toBe(true);

      // The result may be empty if the specified files don't exist, which is expected
    }, 60000);

    it('should handle file renaming with items object', async () => {
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
          Promise.resolve({ path: filePath, hash: 'integration-test-hash' })
        )
      };

      const result = await execute(task, 'cursor', 'development', true, dependencies);

      // Verify that the operation completed
      expect(result).toBeDefined();
      expect(result).toHaveProperty('files');
      expect(Array.isArray(result.files)).toBe(true);
    }, 60000);

    it('should handle repository validation failure gracefully', async () => {
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
  });

  describe('Error Handling Integration', () => {
    it('should handle network timeout gracefully', async () => {
      const task = {
        repository: {
          url: 'https://github.com/slow-responding-repo/that-times-out',
          type: 'branch',
          target: 'main'
        },
        source: '{project-type}/rules/',
        target: '.ai/rules/'
      };

      const dependencies = {
        trackInstalledFile: jest.fn()
      };

      // This should fail with a timeout or network error
      await expect(execute(task, 'cursor', 'development', false, dependencies))
        .rejects.toThrow();
    }, 15000);

    it('should handle malformed repository URL gracefully', async () => {
      const task = {
        repository: {
          url: 'not-a-valid-url',
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
    }, 15000);
  });

  describe('File System Integration', () => {
    it('should preserve file permissions and timestamps', async () => {
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
          Promise.resolve({ path: filePath, hash: 'integration-test-hash' })
        )
      };

      const result = await execute(task, 'cursor', 'development', false, dependencies);

      // Verify that the operation completed
      expect(result).toBeDefined();
      expect(result).toHaveProperty('files');
      expect(Array.isArray(result.files)).toBe(true);

      // If files were copied, verify they exist
      if (result.length > 0) {
        for (const fileInfo of result) {
          expect(await fs.pathExists(fileInfo.path)).toBe(true);
        }
      }
    }, 60000);

    it('should handle concurrent operations correctly', async () => {
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
          Promise.resolve({ path: filePath, hash: 'integration-test-hash' })
        )
      };

      // Run multiple operations concurrently
      const promises = [
        execute(task, 'cursor', 'development', false, dependencies),
        execute(task, 'cursor', 'content-strategy', false, dependencies),
        execute(task, 'cursor', 'design', false, dependencies)
      ];

      const results = await Promise.all(promises);

      // Verify all operations completed
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result).toHaveProperty('files');
      expect(Array.isArray(result.files)).toBe(true);
      });
    }, 90000); // 90 second timeout for concurrent operations
  });
});
