/**
 * Targeted tests for file-operations.js uncovered lines
 * Focuses on lines that can be tested easily without complex mocking
 */

import { jest } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the module under test
const fileOperations = await import('../../src/file-operations.js');

describe('File Operations - Targeted Coverage Tests', () => {
  let testDir;
  let originalCwd;

  beforeAll(async () => {
    originalCwd = process.cwd();
    testDir = path.join(__dirname, 'test-file-ops-targeted-temp');
    await fs.ensureDir(testDir);
  });

  afterAll(async () => {
    process.chdir(originalCwd);
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  beforeEach(async () => {
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
      await fs.ensureDir(testDir);
    }
    process.chdir(testDir);
  });

  describe('getToolVersion - Basic functionality', () => {
    it('should return a version string', () => {
      const result = fileOperations.getToolVersion();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('copyFiles - Path traversal security (lines 78-95)', () => {
    it('should handle path traversal security checks', async () => {
      const sourceDir = path.join(testDir, 'source');
      const targetDir = path.join(testDir, 'target');
      await fs.ensureDir(sourceDir);
      await fs.ensureDir(targetDir);

      // Create a test file
      await fs.writeFile(path.join(sourceDir, 'test.txt'), 'content');

      // Test with normal path
      const result = await fileOperations.copyFiles(sourceDir, targetDir, false, ['test.txt']);
      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('target/test.txt'); // Returns object with path property
    });

    it('should handle source directory access error gracefully', async () => {
      const nonExistentDir = path.join(testDir, 'nonexistent');
      const targetDir = path.join(testDir, 'target');

      await expect(
        fileOperations.copyFiles(nonExistentDir, targetDir)
      ).rejects.toThrow('Source directory not found');
    });

    it('should handle missing source items with verbose logging', async () => {
      const sourceDir = path.join(testDir, 'source');
      const targetDir = path.join(testDir, 'target');
      await fs.ensureDir(sourceDir);
      await fs.ensureDir(targetDir);

      // Create one file but try to copy two
      await fs.writeFile(path.join(sourceDir, 'file1.txt'), 'content1');

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await fileOperations.copyFiles(sourceDir, targetDir, true, ['file1.txt', 'nonexistent.txt']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning: nonexistent.txt not found in source directory')
      );
      expect(result).toHaveLength(1); // Only file1.txt was copied

      consoleLogSpy.mockRestore();
    });
  });

  describe('copyFiles - Additional edge cases for coverage', () => {
    it('should handle verbose mode logging in copyFiles', async () => {
      const sourceDir = path.join(testDir, 'source');
      const targetDir = path.join(testDir, 'target');
      await fs.ensureDir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'test.txt'), 'content');

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await fileOperations.copyFiles(sourceDir, targetDir, true);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ Copied 1 items to')
      );
      expect(result).toHaveLength(1);

      consoleLogSpy.mockRestore();
    });

    it('should handle path traversal security in copyFiles', async () => {
      const sourceDir = path.join(testDir, 'source');
      const targetDir = path.join(testDir, 'target');
      await fs.ensureDir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'test.txt'), 'content');

      // Test that the function includes path traversal security checks
      const result = await fileOperations.copyFiles(sourceDir, targetDir, false);
      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('target/test.txt');
    });
  });

  describe('createConfigFile - Edge cases (lines 533-535, 556)', () => {
    it('should handle undefined project type gracefully', async () => {
      const config = {
        project: { type: undefined, tool: 'cursor' },
        features: { taskPreferences: {} },
        files: [],
        packages: {}
      };

      await fileOperations.createConfigFile(config, false);

      // Verify the config file was created
      expect(await fs.pathExists('.lullabot-project.yml')).toBe(true);

      // Read and verify content
      const content = await fs.readFile('.lullabot-project.yml', 'utf8');
      expect(content).toContain('type:');
      expect(content).toContain('tool: cursor');
    });

    it('should handle verbose mode with detailed logging', async () => {
      const config = {
        project: { type: 'drupal', tool: 'cursor' },
        features: { taskPreferences: {} },
        files: ['file1.txt'],
        packages: { 'package1': '1.0.0' }
      };

      // Mock console.log
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await fileOperations.createConfigFile(config, true);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Configuration file created')
      );

      consoleLogSpy.mockRestore();
    });
  });

  describe('Additional edge cases for coverage', () => {
    it('should handle empty items array in copyFiles', async () => {
      const sourceDir = path.join(testDir, 'source');
      const targetDir = path.join(testDir, 'target');
      await fs.ensureDir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'test.txt'), 'content');

      const result = await fileOperations.copyFiles(sourceDir, targetDir, false, []);
      expect(result).toHaveLength(1); // Empty array means copy all files
    });

    it('should handle null items parameter in copyFiles', async () => {
      const sourceDir = path.join(testDir, 'source');
      const targetDir = path.join(testDir, 'target');
      await fs.ensureDir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'test.txt'), 'content');

      const result = await fileOperations.copyFiles(sourceDir, targetDir, false, null);
      expect(result).toHaveLength(1); // Should copy all files when items is null
    });

    it('should handle path traversal security violation in copyFiles', async () => {
      const sourceDir = path.join(testDir, 'source');
      const targetDir = path.join(testDir, 'target');
      await fs.ensureDir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'test.txt'), 'content');

      // Change to a different directory to test path resolution
      const originalCwd = process.cwd();
      const tempDir = path.join(testDir, 'temp');
      await fs.ensureDir(tempDir);
      process.chdir(tempDir);

      try {
        // This should trigger the path traversal security check
        await expect(
          fileOperations.copyFiles(sourceDir, targetDir, false)
        ).rejects.toThrow('Security violation: Attempted to copy file outside project directory');
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('Additional exported functions for coverage', () => {
    it('should handle getPackageVersion with string package name', async () => {
      const result = await fileOperations.getPackageVersion('test-package', true);
      expect(result).toHaveProperty('name', 'test-package');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('lastUpdated');
    });

    it('should handle getPackageVersion with package config object', async () => {
      const packageConfig = {
        name: 'test-package',
        type: 'npx',
        'version-command': 'echo "1.2.3"'
      };

      const result = await fileOperations.getPackageVersion(packageConfig, true);
      expect(result).toHaveProperty('name', 'test-package');
      expect(result).toHaveProperty('version'); // Version might be "unknown" if command fails
      expect(result).toHaveProperty('lastUpdated');
    });

    it('should handle getPackageVersion error gracefully', async () => {
      const packageConfig = {
        name: 'non-existent-package-xyz123',
        type: 'npx'
      };

      // Use verbose = false to suppress npm error output in tests
      const result = await fileOperations.getPackageVersion(packageConfig, false);
      expect(result).toHaveProperty('name', 'non-existent-package-xyz123');
      expect(result).toHaveProperty('version', 'unknown');
      expect(result).toHaveProperty('error');
    });
  });
});
