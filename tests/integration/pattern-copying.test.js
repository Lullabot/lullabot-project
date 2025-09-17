import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { execute as copyFilesExecute } from '../../src/task-types/copy-files.js';
import { execute as remoteCopyFilesExecute } from '../../src/task-types/remote-copy-files.js';

describe('Pattern-based File Copying Integration', () => {
  let testDir;
  let sourceDir;
  let targetDir;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pattern-copying-test-'));
    sourceDir = path.join(testDir, 'source');
    targetDir = path.join(testDir, 'target');

    await fs.ensureDir(sourceDir);
    await fs.ensureDir(targetDir);

    // Create test files
    await fs.writeFile(path.join(sourceDir, 'README.md'), '# Test README');
    await fs.writeFile(path.join(sourceDir, 'config.json'), '{"test": true}');
    await fs.writeFile(path.join(sourceDir, 'config.yaml'), 'test: true');
    await fs.writeFile(path.join(sourceDir, 'test-file.js'), 'console.log("test");');
    await fs.writeFile(path.join(sourceDir, 'test-file.ts'), 'console.log("test");');
    await fs.writeFile(path.join(sourceDir, 'config-test.json'), '{"test": true}');
    await fs.writeFile(path.join(sourceDir, 'README.txt'), 'Test readme');
    await fs.writeFile(path.join(sourceDir, 'index.html'), '<html></html>');

    // Create subdirectory with files
    const subDir = path.join(sourceDir, 'docs');
    await fs.ensureDir(subDir);
    await fs.writeFile(path.join(subDir, 'guide.md'), '# Guide');
    await fs.writeFile(path.join(subDir, 'api.md'), '# API');
    await fs.writeFile(path.join(subDir, 'config.json'), '{"docs": true}');
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.remove(testDir);
  });

  describe('copy-files with patterns', () => {
    it('should copy files matching glob patterns', async () => {
      const task = {
        type: 'copy-files',
        source: sourceDir,
        target: targetDir,
        items: ['*.md', '*.{js,ts}']
      };

      const result = await copyFilesExecute(task, 'test-tool', 'test-project', true);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check that files were copied
      expect(await fs.pathExists(path.join(targetDir, 'README.md'))).toBe(true);
      expect(await fs.pathExists(path.join(targetDir, 'test-file.js'))).toBe(true);
      expect(await fs.pathExists(path.join(targetDir, 'test-file.ts'))).toBe(true);
      expect(await fs.pathExists(path.join(targetDir, 'config.json'))).toBe(false);
    });

    it('should copy files matching regex patterns', async () => {
      const task = {
        type: 'copy-files',
        source: sourceDir,
        target: targetDir,
        items: ['/^config.*\\.json$/', '/^test-.*\\.(js|ts)$/']
      };

      const result = await copyFilesExecute(task, 'test-tool', 'test-project', true);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check that files were copied
      expect(await fs.pathExists(path.join(targetDir, 'config.json'))).toBe(true);
      expect(await fs.pathExists(path.join(targetDir, 'config-test.json'))).toBe(true);
      expect(await fs.pathExists(path.join(targetDir, 'test-file.js'))).toBe(true);
      expect(await fs.pathExists(path.join(targetDir, 'test-file.ts'))).toBe(true);
      expect(await fs.pathExists(path.join(targetDir, 'README.md'))).toBe(false);
    });

    it('should copy files with mixed patterns', async () => {
      const task = {
        type: 'copy-files',
        source: sourceDir,
        target: targetDir,
        items: ['*.md', 'config.json', '/^test-.*\\.(js|ts)$/']
      };

      const result = await copyFilesExecute(task, 'test-tool', 'test-project', true);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check that files were copied
      expect(await fs.pathExists(path.join(targetDir, 'README.md'))).toBe(true);
      expect(await fs.pathExists(path.join(targetDir, 'config.json'))).toBe(true);
      expect(await fs.pathExists(path.join(targetDir, 'test-file.js'))).toBe(true);
      expect(await fs.pathExists(path.join(targetDir, 'test-file.ts'))).toBe(true);
      expect(await fs.pathExists(path.join(targetDir, 'index.html'))).toBe(false);
    });

    it('should handle recursive patterns', async () => {
      const task = {
        type: 'copy-files',
        source: sourceDir,
        target: targetDir,
        items: ['**/*.md']
      };

      const result = await copyFilesExecute(task, 'test-tool', 'test-project', true);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check that files were copied
      expect(await fs.pathExists(path.join(targetDir, 'README.md'))).toBe(true);
      expect(await fs.pathExists(path.join(targetDir, 'docs/guide.md'))).toBe(true);
      expect(await fs.pathExists(path.join(targetDir, 'docs/api.md'))).toBe(true);
      expect(await fs.pathExists(path.join(targetDir, 'config.json'))).toBe(false);
    });

    it('should handle no matches gracefully', async () => {
      const task = {
        type: 'copy-files',
        source: sourceDir,
        target: targetDir,
        items: ['*.nonexistent']
      };

      const result = await copyFilesExecute(task, 'test-tool', 'test-project', true);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should preserve file content when copying', async () => {
      const task = {
        type: 'copy-files',
        source: sourceDir,
        target: targetDir,
        items: ['README.md']
      };

      await copyFilesExecute(task, 'test-tool', 'test-project', true);

      const originalContent = await fs.readFile(path.join(sourceDir, 'README.md'), 'utf8');
      const copiedContent = await fs.readFile(path.join(targetDir, 'README.md'), 'utf8');

      expect(copiedContent).toBe(originalContent);
    });
  });

  describe('remote-copy-files with patterns', () => {
    it('should copy files matching glob patterns from remote repository', async () => {
      const task = {
        type: 'remote-copy-files',
        repository: {
          url: 'https://github.com/Lullabot/prompt_library',
          type: 'branch',
          target: 'main'
        },
        source: 'development/rules/',
        target: targetDir,
        items: ['*.md']
      };

      const result = await remoteCopyFilesExecute(task, 'test-tool', 'development', true);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check that .md files were copied
      const files = await fs.readdir(targetDir);
      const mdFiles = files.filter(file => file.endsWith('.md'));
      expect(mdFiles.length).toBeGreaterThan(0);
    });

    it('should handle no matches from remote repository', async () => {
      const task = {
        type: 'remote-copy-files',
        repository: {
          url: 'https://github.com/Lullabot/prompt_library',
          type: 'branch',
          target: 'main'
        },
        source: 'development/rules/',
        target: targetDir,
        items: ['*.nonexistent']
      };

      const result = await remoteCopyFilesExecute(task, 'test-tool', 'development', true);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should throw error for invalid regex patterns', async () => {
      const task = {
        type: 'copy-files',
        source: sourceDir,
        target: targetDir,
        items: ['/invalid[regex/']
      };

      await expect(copyFilesExecute(task, 'test-tool', 'test-project', true))
        .rejects.toThrow('Invalid regex pattern');
    });

    it('should throw error for non-string patterns', async () => {
      const task = {
        type: 'copy-files',
        source: sourceDir,
        target: targetDir,
        items: ['*.md', 123, 'config.json']
      };

      await expect(copyFilesExecute(task, 'test-tool', 'test-project', true))
        .rejects.toThrow('Invalid pattern: 123. Must be a string.');
    });

    it('should throw error for non-existent source directory', async () => {
      const task = {
        type: 'copy-files',
        source: path.join(testDir, 'nonexistent'),
        target: targetDir,
        items: ['*.md']
      };

      await expect(copyFilesExecute(task, 'test-tool', 'test-project', true))
        .rejects.toThrow('Source directory not found');
    });
  });

  describe('Backward compatibility', () => {
    it('should work with specific filenames (no patterns)', async () => {
      const task = {
        type: 'copy-files',
        source: sourceDir,
        target: targetDir,
        items: ['README.md', 'config.json']
      };

      const result = await copyFilesExecute(task, 'test-tool', 'test-project', true);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);

      // Check that specific files were copied
      expect(await fs.pathExists(path.join(targetDir, 'README.md'))).toBe(true);
      expect(await fs.pathExists(path.join(targetDir, 'config.json'))).toBe(true);
      expect(await fs.pathExists(path.join(targetDir, 'test-file.js'))).toBe(false);
    });

    it('should work with object format for renaming (no patterns)', async () => {
      const task = {
        type: 'copy-files',
        source: sourceDir,
        target: targetDir,
        items: { 'README.md': 'DOCS.md', 'config.json': 'settings.json' }
      };

      const result = await copyFilesExecute(task, 'test-tool', 'test-project', true);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);

      // Check that files were copied with new names
      expect(await fs.pathExists(path.join(targetDir, 'DOCS.md'))).toBe(true);
      expect(await fs.pathExists(path.join(targetDir, 'settings.json'))).toBe(true);
      expect(await fs.pathExists(path.join(targetDir, 'README.md'))).toBe(false);
      expect(await fs.pathExists(path.join(targetDir, 'config.json'))).toBe(false);
    });

    it('should work without items (copy all .md files for remote-copy-files)', async () => {
      const task = {
        type: 'remote-copy-files',
        repository: {
          url: 'https://github.com/Lullabot/prompt_library',
          type: 'branch',
          target: 'main'
        },
        source: 'development/rules/',
        target: targetDir
        // No items specified
      };

      const result = await remoteCopyFilesExecute(task, 'test-tool', 'development', true);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check that .md files were copied (default behavior)
      const files = await fs.readdir(targetDir);
      const mdFiles = files.filter(file => file.endsWith('.md'));
      expect(mdFiles.length).toBeGreaterThan(0);
    });
  });
});
