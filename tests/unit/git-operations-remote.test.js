// Tests for the remote repository functions in git-operations.js
import fs from 'fs-extra';
import path from 'path';

// Import the functions under test
const {
  validateRepository,
  getOrCloneRepository,
  copyFilesFromRemote,
  cleanupAllClones
} = await import('../../src/git-operations.js');

describe('Git Operations - Remote Repository Functions', () => {
  let testDir;
  let mockTempDir;
  let originalCwd;

  beforeEach(async () => {
    // Create temporary directories for tests
    testDir = await fs.mkdtemp('/tmp/git-ops-remote-test-');
    mockTempDir = await fs.mkdtemp('/tmp/mock-repo-');
    originalCwd = process.cwd();
    process.chdir(testDir);

    // Ensure clean state - remove .ai directory if it exists
    try {
      await fs.remove('.ai');
    } catch (_error) {
      // Ignore errors if directory doesn't exist
    }
  });

  afterEach(async () => {
    // Clean up
    process.chdir(originalCwd);
    await fs.remove(testDir);
    await fs.remove(mockTempDir);
    // Also clean up any .ai directory that might have been created
    await fs.remove('.ai').catch(() => {});
  });

  describe('validateRepository', () => {
    it('should validate accessible repository successfully', async () => {
      const repository = {
        url: 'https://github.com/Lullabot/prompt_library',
        type: 'branch',
        target: 'main'
      };

      const result = await validateRepository(repository, false);

      expect(result).toBe(true);
    }, 30000);

    it('should throw error for repository not found', async () => {
      const repository = {
        url: 'https://github.com/nonexistent/repo',
        type: 'branch',
        target: 'main'
      };

      await expect(validateRepository(repository, false))
        .rejects.toThrow();
    }, 30000);

    it('should throw error for malformed URL', async () => {
      const repository = {
        url: 'not-a-valid-url',
        type: 'branch',
        target: 'main'
      };

      await expect(validateRepository(repository, false))
        .rejects.toThrow();
    }, 30000);
  });

  describe('getOrCloneRepository', () => {
    it('should clone repository successfully', async () => {
      const repository = {
        url: 'https://github.com/Lullabot/prompt_library',
        type: 'branch',
        target: 'main'
      };

      const result = await getOrCloneRepository(repository, false);

      expect(result).toMatch(/lullabot-/);
      expect(await fs.pathExists(result)).toBe(true);
    }, 60000);

    it('should return cached repository on subsequent calls', async () => {
      const repository = {
        url: 'https://github.com/Lullabot/prompt_library',
        type: 'branch',
        target: 'main'
      };

      // First call
      const result1 = await getOrCloneRepository(repository, false);

      // Second call
      const result2 = await getOrCloneRepository(repository, false);

      expect(result1).toBe(result2);
    }, 60000);

    it('should handle different cache keys for different repositories', async () => {
      const repo1 = {
        url: 'https://github.com/Lullabot/prompt_library',
        type: 'branch',
        target: 'main'
      };

      const repo2 = {
        url: 'https://github.com/Lullabot/prompt_library',
        type: 'tag',
        target: 'main'
      };

      const result1 = await getOrCloneRepository(repo1, false);
      const result2 = await getOrCloneRepository(repo2, false);

      expect(result1).not.toBe(result2);
    }, 60000);

    it('should handle clone failure with proper error messages', async () => {
      const repository = {
        url: 'https://github.com/nonexistent/repo',
        type: 'branch',
        target: 'main'
      };

      await expect(getOrCloneRepository(repository, false))
        .rejects.toThrow();
    }, 120000);

    it('should handle branch not found error', async () => {
      const repository = {
        url: 'https://github.com/Lullabot/prompt_library',
        type: 'branch',
        target: 'nonexistent'
      };

      await expect(getOrCloneRepository(repository, false))
        .rejects.toThrow();
    }, 30000);
  });

  describe('copyFilesFromRemote', () => {
    beforeEach(async () => {
      // Create mock repository structure
      await fs.ensureDir(path.join(mockTempDir, 'development', 'rules'));
      await fs.writeFile(
        path.join(mockTempDir, 'development', 'rules', 'coding-standards.md'),
        '# Coding Standards\nTest content'
      );
      await fs.writeFile(
        path.join(mockTempDir, 'development', 'rules', 'drupal-core.md'),
        '# Drupal Core\nTest content'
      );
      await fs.writeFile(
        path.join(mockTempDir, 'development', 'rules', 'template.njk'),
        'Template content'
      );
    });

    it('should copy all .md files when no items specified', async () => {
      const dependencies = {
        trackInstalledFile: jest.fn().mockImplementation((path, _deps) =>
          Promise.resolve({ path, hash: 'test-hash' })
        )
      };

      const result = await copyFilesFromRemote(
        mockTempDir,
        'development/rules',
        '.ai/rules',
        false,
        dependencies,
        null
      );

      expect(result).toHaveLength(2);
      expect(result[0].path).toBe('.ai/rules/coding-standards.md');
      expect(result[1].path).toBe('.ai/rules/drupal-core.md');

      // Verify files were copied
      expect(await fs.pathExists('.ai/rules/coding-standards.md')).toBe(true);
      expect(await fs.pathExists('.ai/rules/drupal-core.md')).toBe(true);
      expect(await fs.pathExists('.ai/rules/template.njk')).toBe(false); // .njk files should be filtered out
    });

    it('should copy specific files when items array specified', async () => {
      const dependencies = {
        trackInstalledFile: jest.fn().mockImplementation((path, _deps) =>
          Promise.resolve({ path, hash: 'test-hash' })
        )
      };

      const result = await copyFilesFromRemote(
        mockTempDir,
        'development/rules',
        '.ai/rules',
        false,
        dependencies,
        ['coding-standards.md']
      );

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('.ai/rules/coding-standards.md');

      // Verify only specified file was copied
      expect(await fs.pathExists('.ai/rules/coding-standards.md')).toBe(true);
      expect(await fs.pathExists('.ai/rules/drupal-core.md')).toBe(false);
    });

    it('should rename files when items object specified', async () => {
      const dependencies = {
        trackInstalledFile: jest.fn().mockImplementation((path, _deps) =>
          Promise.resolve({ path, hash: 'test-hash' })
        )
      };

      const result = await copyFilesFromRemote(
        mockTempDir,
        'development/rules',
        '.ai/rules',
        false,
        dependencies,
        {
          'coding-standards.md': 'main-rules.md',
          'drupal-core.md': 'framework-rules.md'
        }
      );

      expect(result).toHaveLength(2);
      expect(result[0].path).toBe('.ai/rules/main-rules.md');
      expect(result[1].path).toBe('.ai/rules/framework-rules.md');

      // Verify files were renamed
      expect(await fs.pathExists('.ai/rules/main-rules.md')).toBe(true);
      expect(await fs.pathExists('.ai/rules/framework-rules.md')).toBe(true);
      expect(await fs.pathExists('.ai/rules/coding-standards.md')).toBe(false);
    });

    it('should handle missing source path', async () => {
      const dependencies = {};

      await expect(copyFilesFromRemote(
        mockTempDir,
        'nonexistent/path',
        '.ai/rules',
        false,
        dependencies,
        null
      )).rejects.toThrow('Source path not found in repository: nonexistent/path');
    });

    it('should handle missing files gracefully', async () => {
      const dependencies = {
        trackInstalledFile: jest.fn().mockImplementation((path, _deps) =>
          Promise.resolve({ path, hash: 'test-hash' })
        )
      };

      const result = await copyFilesFromRemote(
        mockTempDir,
        'development/rules',
        '.ai/rules',
        true, // verbose mode
        dependencies,
        ['nonexistent.md', 'coding-standards.md']
      );

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('.ai/rules/coding-standards.md');
    });

    it('should not create target directory if no files copied', async () => {
      const dependencies = {};

      // Ensure target directory doesn't exist before test
      await fs.remove('.ai/rules');

      const result = await copyFilesFromRemote(
        mockTempDir,
        'development/rules',
        '.ai/rules',
        false,
        dependencies,
        ['nonexistent1.md', 'nonexistent2.md']
      );

      expect(result).toHaveLength(0);
      expect(await fs.pathExists('.ai/rules')).toBe(false);
    });

    it('should handle empty items array', async () => {
      const dependencies = {
        trackInstalledFile: jest.fn().mockImplementation((path, _deps) =>
          Promise.resolve({ path, hash: 'test-hash' })
        )
      };

      const result = await copyFilesFromRemote(
        mockTempDir,
        'development/rules',
        '.ai/rules',
        false,
        dependencies,
        []
      );

      expect(result).toHaveLength(0);
      expect(await fs.pathExists('.ai/rules')).toBe(false);
    });

    it('should handle empty items object', async () => {
      const dependencies = {
        trackInstalledFile: jest.fn().mockImplementation((path, _deps) =>
          Promise.resolve({ path, hash: 'test-hash' })
        )
      };

      // Ensure target directory doesn't exist before test
      await fs.remove('.ai/rules');

      const result = await copyFilesFromRemote(
        mockTempDir,
        'development/rules',
        '.ai/rules',
        false,
        dependencies,
        {}
      );

      // Empty object should fall back to copying all .md files
      expect(result).toHaveLength(2);
      expect(await fs.pathExists('.ai/rules')).toBe(true);
    });
  });

  describe('cleanupAllClones', () => {
    it('should clean up all cached repositories', async () => {
      const repository = {
        url: 'https://github.com/Lullabot/prompt_library',
        type: 'branch',
        target: 'main'
      };

      // Clone a repository to populate cache
      const tempDir = await getOrCloneRepository(repository, false);
      expect(await fs.pathExists(tempDir)).toBe(true);

      // Clean up
      await cleanupAllClones();

      // Verify directory was removed
      expect(await fs.pathExists(tempDir)).toBe(false);
    }, 60000);

    it('should handle cleanup when no repositories are cached', async () => {
      // Should not throw error
      await expect(cleanupAllClones()).resolves.toBeUndefined();
    });
  });
});
