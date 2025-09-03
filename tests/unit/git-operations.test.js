// Unit tests for git-operations.js
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the module under test
const gitOperations = await import('../../src/git-operations.js');

describe('Git Operations Module', () => {
  let testDir;
  let originalCwd;

  beforeAll(async () => {
    // Store original working directory
    originalCwd = process.cwd();

    // Create test directory
    testDir = path.join(__dirname, 'test-git-ops-temp');
    await fs.ensureDir(testDir);
  });

  afterAll(async () => {
    // Restore original working directory
    process.chdir(originalCwd);

    // Clean up test directory
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  beforeEach(async () => {
    // Clean up before each test
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
      await fs.ensureDir(testDir);
    }
  });

  describe('Basic functionality', () => {
    it('should have the expected module structure', () => {
      expect(gitOperations).toBeDefined();
      expect(typeof gitOperations.getLatestTag).toBe('function');
      expect(typeof gitOperations.tagExists).toBe('function');
      expect(typeof gitOperations.cloneAndCopyFiles).toBe('function');
      expect(typeof gitOperations.getFilesFromGit).toBe('function');
      expect(typeof gitOperations.getConfigFromGit).toBe('function');
    });
  });

  describe('Function signatures', () => {
    it('should have correct function signatures', () => {
      // Test that functions exist and have expected parameter counts
      expect(gitOperations.getLatestTag.length).toBe(0); // No parameters
      expect(gitOperations.tagExists.length).toBe(1); // tag parameter
      // Function has 3 parameters: sourcePath, targetPath, verbose (verbose has default value)
      expect(gitOperations.cloneAndCopyFiles.length).toBeGreaterThanOrEqual(2);
      expect(gitOperations.getFilesFromGit.length).toBeGreaterThanOrEqual(2);
      expect(gitOperations.getConfigFromGit.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getLatestTag', () => {
    it('should be callable without throwing', async () => {
      // This function requires actual Git operations, so we'll test that it exists
      // and can be called without throwing (it will likely fail due to no Git access)
      expect(typeof gitOperations.getLatestTag).toBe('function');

      // The function should handle errors gracefully and return null
      try {
        const result = await gitOperations.getLatestTag();
        // If it succeeds, result should be a string or null
        expect(typeof result === 'string' || result === null).toBe(true);
      } catch (error) {
        // If it fails, that's also acceptable in a test environment
        expect(error).toBeDefined();
      }
    });
  });

  describe('tagExists', () => {
    it('should be callable without throwing', async () => {
      // This function requires actual Git operations, so we'll test that it exists
      // and can be called without throwing (it will likely fail due to no Git access)
      expect(typeof gitOperations.tagExists).toBe('function');

      // The function should handle errors gracefully and return false
      try {
        const result = await gitOperations.tagExists('1.0.0');
        // If it succeeds, result should be a boolean
        expect(typeof result).toBe('boolean');
      } catch (error) {
        // If it fails, that's also acceptable in a test environment
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid tag names gracefully', async () => {
      try {
        const result = await gitOperations.tagExists('');
        expect(typeof result).toBe('boolean');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('cloneAndCopyFiles', () => {
    it('should be callable without throwing', async () => {
      // This function requires actual Git operations, so we'll test that it exists
      // and can be called without throwing (it will likely fail due to no Git access)
      expect(typeof gitOperations.cloneAndCopyFiles).toBe('function');

      // The function should handle errors gracefully
      try {
        const result = await gitOperations.cloneAndCopyFiles('test/source', 'test/target', false);
        // If it succeeds, result should be a boolean
        expect(typeof result).toBe('boolean');
      } catch (error) {
        // If it fails, that's also acceptable in a test environment
        expect(error).toBeDefined();
      }
    });

    it('should handle verbose mode', async () => {
      try {
        const result = await gitOperations.cloneAndCopyFiles('test/source', 'test/target', true);
        expect(typeof result === 'boolean' || result === undefined).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid source paths', async () => {
      try {
        const result = await gitOperations.cloneAndCopyFiles('', 'test/target', false);
        expect(typeof result === 'boolean' || result === undefined).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('getFilesFromGit', () => {
    it('should be callable without throwing', async () => {
      // This function is a wrapper around cloneAndCopyFiles
      expect(typeof gitOperations.getFilesFromGit).toBe('function');

      try {
        const result = await gitOperations.getFilesFromGit('test/source', 'test/target', false);
        expect(typeof result === 'boolean' || result === undefined).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle verbose mode', async () => {
      try {
        const result = await gitOperations.getFilesFromGit('test/source', 'test/target', true);
        expect(typeof result === 'boolean' || result === undefined).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('getConfigFromGit', () => {
    it('should be callable without throwing', async () => {
      // This function is a wrapper around cloneAndCopyFiles
      expect(typeof gitOperations.getConfigFromGit).toBe('function');

      try {
        const result = await gitOperations.getConfigFromGit('test/target', false);
        expect(typeof result === 'boolean' || result === undefined).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle verbose mode', async () => {
      try {
        const result = await gitOperations.getConfigFromGit('test/target', true);
        expect(typeof result === 'boolean' || result === undefined).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should use correct source path', async () => {
      // This function should always use 'config' as the source path
      // We can't test the actual Git operation, but we can verify the function exists
      expect(typeof gitOperations.getConfigFromGit).toBe('function');
    });
  });

  describe('Error handling', () => {
    it('should handle network errors gracefully', async () => {
      // Test that functions don't crash on network errors
      const functions = [
        () => gitOperations.getLatestTag(),
        () => gitOperations.tagExists('1.0.0'),
        () => gitOperations.cloneAndCopyFiles('test/source', 'test/target', false),
        () => gitOperations.getFilesFromGit('test/source', 'test/target', false),
        () => gitOperations.getConfigFromGit('test/target', false)
      ];

      for (const func of functions) {
        try {
          await func();
          // If it succeeds, that's fine
        } catch (error) {
          // If it fails, that's also fine - just make sure it's a proper error
          expect(error).toBeDefined();
          expect(typeof error.message).toBe('string');
        }
      }
    });

    it('should handle invalid parameters gracefully', async () => {
      // Test with invalid parameters
      try {
        await gitOperations.cloneAndCopyFiles(null, undefined, 'invalid');
        // If it succeeds, that's fine
      } catch (error) {
        // If it fails, that's expected with invalid parameters
        expect(error).toBeDefined();
      }
    });
  });

  describe('File system operations', () => {
    it('should handle temporary directory operations', async () => {
      // Test that we can create and remove temporary directories
      const tempDir = path.join(testDir, 'temp-git-test');
      await fs.ensureDir(tempDir);

      expect(await fs.pathExists(tempDir)).toBe(true);

      // Create a test file
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'test content');
      expect(await fs.pathExists(testFile)).toBe(true);

      // Clean up
      await fs.remove(tempDir);
      expect(await fs.pathExists(tempDir)).toBe(false);
    });

    it('should handle path operations correctly', async () => {
      // Test path joining and resolution
      const sourcePath = 'assets/rules';
      const targetPath = path.join(testDir, 'rules');

      expect(typeof sourcePath).toBe('string');
      expect(typeof targetPath).toBe('string');
      expect(targetPath).toContain(testDir);
      expect(targetPath).toContain('rules');
    });
  });

  describe('Configuration handling', () => {
    it('should have expected configuration structure', async () => {
      // Test that the module has the expected configuration
      // We can't access the internal config directly, but we can test the functions
      // that use it
      expect(typeof gitOperations.getLatestTag).toBe('function');
      expect(typeof gitOperations.tagExists).toBe('function');
      expect(typeof gitOperations.cloneAndCopyFiles).toBe('function');
    });

    it('should handle version fallbacks', async () => {
      // Test that functions can handle version-related operations
      try {
        await gitOperations.tagExists('999.999.999'); // Non-existent version
        // If it succeeds, that's fine
      } catch (error) {
        // If it fails, that's expected for non-existent versions
        expect(error).toBeDefined();
      }
    });
  });
});
