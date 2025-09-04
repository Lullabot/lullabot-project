/**
 * Integration tests for file protection functionality.
 * Tests the complete workflow of file change detection and protection.
 */

// Note: initCommand and updateCommand are not used in these tests
// as we test the underlying functions directly for better isolation
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

describe('File Protection Integration', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    testDir = await fs.mkdtemp('/tmp/lullabot-test-');
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(testDir);
  });

  describe('Project Initialization Protection', () => {
    test('should prevent re-init without force flag', async () => {
      // Create a config file to simulate initialized project
      const configContent = {
        project: { type: 'drupal', tool: 'cursor' },
        files: [],
        installation: { created: new Date().toISOString() }
      };
      await fs.writeFile('.lullabot-project.yml', JSON.stringify(configContent));

      // Test the isProjectInitialized function directly
      const { isProjectInitialized } = await import('../../src/file-operations.js');
      const dependencies = {
        configExists: async () => {
          const { configExists } = await import('../../src/file-operations.js');
          return configExists();
        }
      };

      const isInitialized = await isProjectInitialized(dependencies);
      expect(isInitialized).toBe(true);
    }, 10000);

    test('should detect uninitialized project', async () => {
      // No config file exists
      const { isProjectInitialized } = await import('../../src/file-operations.js');
      const dependencies = {
        configExists: async () => {
          const { configExists } = await import('../../src/file-operations.js');
          return configExists();
        }
      };

      const isInitialized = await isProjectInitialized(dependencies);
      expect(isInitialized).toBe(false);
    });
  });

  describe('File Change Detection', () => {
    test('should detect file changes using hash comparison', async () => {
      // Create a test file
      const testFile = path.join(testDir, 'test.txt');
      const originalContent = 'original content';
      await fs.writeFile(testFile, originalContent);

      // Calculate original hash
      const originalHash = crypto.createHash('sha256').update(originalContent).digest('hex');

      // Create config with original hash
      const configContent = {
        project: { type: 'drupal', tool: 'cursor' },
        files: [
          { path: 'test.txt', originalHash }
        ],
        installation: { created: new Date().toISOString() }
      };
      await fs.writeFile('.lullabot-project.yml', JSON.stringify(configContent));

      // Modify the file
      const modifiedContent = 'modified content';
      await fs.writeFile(testFile, modifiedContent);

      // Test file change detection
      const { checkFileChanges } = await import('../../src/file-operations.js');
      const dependencies = {
        calculateFileHash: async (_filePath) => {
          const content = await fs.readFile(_filePath);
          return crypto.createHash('sha256').update(content).digest('hex');
        }
      };

      const changedFiles = await checkFileChanges(configContent, dependencies);

      expect(changedFiles).toHaveLength(1);
      expect(changedFiles[0].path).toBe('test.txt');
      expect(changedFiles[0].originalHash).toBe(originalHash);
      expect(changedFiles[0].currentHash).not.toBe(originalHash);
    });

    test('should not detect changes for unchanged files', async () => {
      // Create a test file
      const testFile = path.join(testDir, 'test.txt');
      const content = 'test content';
      await fs.writeFile(testFile, content);

      // Calculate hash
      const hash = crypto.createHash('sha256').update(content).digest('hex');

      // Create config with hash
      const configContent = {
        project: { type: 'drupal', tool: 'cursor' },
        files: [
          { path: 'test.txt', originalHash: hash }
        ],
        installation: { created: new Date().toISOString() }
      };

      // Test file change detection
      const { checkFileChanges } = await import('../../src/file-operations.js');
      const dependencies = {
        calculateFileHash: async (_filePath) => {
          const content = await fs.readFile(_filePath);
          return crypto.createHash('sha256').update(content).digest('hex');
        }
      };

      const changedFiles = await checkFileChanges(configContent, dependencies);

      expect(changedFiles).toHaveLength(0);
    });

    test('should handle missing files', async () => {
      // Create config with non-existent file
      const configContent = {
        project: { type: 'drupal', tool: 'cursor' },
        files: [
          { path: 'missing.txt', originalHash: 'some-hash' }
        ],
        installation: { created: new Date().toISOString() }
      };

      // Test file change detection
      const { checkFileChanges } = await import('../../src/file-operations.js');
      const dependencies = {
        calculateFileHash: async (_filePath) => {
          throw new Error('File not found');
        }
      };

      const changedFiles = await checkFileChanges(configContent, dependencies);

      expect(changedFiles).toHaveLength(1);
      expect(changedFiles[0].path).toBe('missing.txt');
      expect(changedFiles[0].currentHash).toBeNull();
      expect(changedFiles[0].error).toBe('File not found');
    });
  });

  describe('File Tracking', () => {
    test('should track installed files with hashes', async () => {
      // Create a test file
      const testFile = path.join(testDir, 'test.txt');
      const content = 'test content';
      await fs.writeFile(testFile, content);

      // Test file tracking
      const { trackInstalledFile } = await import('../../src/file-operations.js');
      const dependencies = {
        calculateFileHash: async (_filePath) => {
          const content = await fs.readFile(_filePath);
          return crypto.createHash('sha256').update(content).digest('hex');
        }
      };

      const result = await trackInstalledFile('test.txt', dependencies);

      expect(result.path).toBe('test.txt');
      expect(result.originalHash).toBeDefined();
      expect(result.originalHash).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex format
    });

    test('should calculate consistent hashes for same content', async () => {
      // Create a test file
      const testFile = path.join(testDir, 'test.txt');
      const content = 'consistent content';
      await fs.writeFile(testFile, content);

      // Test file tracking
      const { trackInstalledFile } = await import('../../src/file-operations.js');
      const dependencies = {
        calculateFileHash: async (_filePath) => {
          const content = await fs.readFile(_filePath);
          return crypto.createHash('sha256').update(content).digest('hex');
        }
      };

      const result1 = await trackInstalledFile('test.txt', dependencies);
      const result2 = await trackInstalledFile('test.txt', dependencies);

      expect(result1.originalHash).toBe(result2.originalHash);
    });
  });

  describe('Update Command Protection', () => {
    test('should detect file changes for update protection', async () => {
      // Create a test file
      const testFile = path.join(testDir, 'test.txt');
      const originalContent = 'original content';
      await fs.writeFile(testFile, originalContent);

      // Calculate original hash
      const originalHash = crypto.createHash('sha256').update(originalContent).digest('hex');

      // Create config with original hash
      const configContent = {
        project: { type: 'drupal', tool: 'cursor' },
        files: [
          { path: 'test.txt', originalHash }
        ],
        installation: { created: new Date().toISOString() }
      };

      // Modify the file
      const modifiedContent = 'modified content';
      await fs.writeFile(testFile, modifiedContent);

      // Test file change detection
      const { checkFileChanges } = await import('../../src/file-operations.js');
      const dependencies = {
        calculateFileHash: async (_filePath) => {
          const content = await fs.readFile(_filePath);
          return crypto.createHash('sha256').update(content).digest('hex');
        }
      };

      const changedFiles = await checkFileChanges(configContent, dependencies);

      expect(changedFiles).toHaveLength(1);
      expect(changedFiles[0].path).toBe('test.txt');
      expect(changedFiles[0].originalHash).toBe(originalHash);
      expect(changedFiles[0].currentHash).not.toBe(originalHash);
    });
  });
});
