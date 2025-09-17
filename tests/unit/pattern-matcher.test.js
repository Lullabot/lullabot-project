import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { expandPatterns, validatePatterns } from '../../src/utils/pattern-matcher.js';

describe('Pattern Matcher', () => {
  let testDir;
  let sourceDir;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pattern-matcher-test-'));
    sourceDir = path.join(testDir, 'source');
    await fs.ensureDir(sourceDir);

    // Create test files
    await fs.writeFile(path.join(sourceDir, 'README.md'), '# Test');
    await fs.writeFile(path.join(sourceDir, 'config.json'), '{}');
    await fs.writeFile(path.join(sourceDir, 'config.yaml'), 'test: true');
    await fs.writeFile(path.join(sourceDir, 'test-file.js'), 'console.log("test");');
    await fs.writeFile(path.join(sourceDir, 'test-file.ts'), 'console.log("test");');
    await fs.writeFile(path.join(sourceDir, 'config-test.json'), '{}');
    await fs.writeFile(path.join(sourceDir, 'README.txt'), 'Test readme');
    await fs.writeFile(path.join(sourceDir, 'index.html'), '<html></html>');

    // Create subdirectory with files
    const subDir = path.join(sourceDir, 'docs');
    await fs.ensureDir(subDir);
    await fs.writeFile(path.join(subDir, 'guide.md'), '# Guide');
    await fs.writeFile(path.join(subDir, 'api.md'), '# API');
    await fs.writeFile(path.join(subDir, 'config.json'), '{}');
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.remove(testDir);
  });

  describe('expandPatterns', () => {
    it('should match glob patterns for markdown files', async () => {
      const patterns = ['*.md'];
      const result = await expandPatterns(patterns, sourceDir, false);

      expect(result).toContain('README.md');
      expect(result).not.toContain('config.json');
      expect(result).not.toContain('test-file.js');
    });

    it('should match glob patterns with multiple extensions', async () => {
      const patterns = ['*.{js,ts}'];
      const result = await expandPatterns(patterns, sourceDir, false);

      expect(result).toContain('test-file.js');
      expect(result).toContain('test-file.ts');
      expect(result).not.toContain('README.md');
    });

    it('should match glob patterns with prefixes', async () => {
      const patterns = ['config-*'];
      const result = await expandPatterns(patterns, sourceDir, false);

      expect(result).toContain('config-test.json');
      expect(result).not.toContain('config.json');
      expect(result).not.toContain('config.yaml');
    });

    it('should match glob patterns with suffixes', async () => {
      const patterns = ['*-test.*'];
      const result = await expandPatterns(patterns, sourceDir, false);

      expect(result).toContain('config-test.json');
      expect(result).not.toContain('test-file.js');
    });

    it('should match recursive patterns', async () => {
      const patterns = ['**/*.md'];
      const result = await expandPatterns(patterns, sourceDir, true);

      expect(result).toContain('README.md');
      expect(result).toContain('docs/guide.md');
      expect(result).toContain('docs/api.md');
    });

    it('should match regex patterns', async () => {
      const patterns = ['/^config.*\\.json$/'];
      const result = await expandPatterns(patterns, sourceDir, false);

      expect(result).toContain('config.json');
      expect(result).toContain('config-test.json');
      expect(result).not.toContain('config.yaml');
    });

    it('should match regex patterns with flags', async () => {
      const patterns = ['/^readme\\.(md|txt)$/i'];
      const result = await expandPatterns(patterns, sourceDir, false);

      expect(result).toContain('README.md');
      expect(result).toContain('README.txt');
    });

    it('should match specific filenames', async () => {
      const patterns = ['README.md', 'config.json'];
      const result = await expandPatterns(patterns, sourceDir, false);

      expect(result).toContain('README.md');
      expect(result).toContain('config.json');
      expect(result).not.toContain('test-file.js');
    });

    it('should handle mixed patterns', async () => {
      const patterns = ['*.md', 'config.json', '/^test-.*\\.(js|ts)$/'];
      const result = await expandPatterns(patterns, sourceDir, false);

      expect(result).toContain('README.md');
      expect(result).toContain('config.json');
      expect(result).toContain('test-file.js');
      expect(result).toContain('test-file.ts');
    });

    it('should handle non-recursive search', async () => {
      const patterns = ['*.md'];
      const result = await expandPatterns(patterns, sourceDir, false);

      expect(result).toContain('README.md');
      expect(result).not.toContain('docs/guide.md');
      expect(result).not.toContain('docs/api.md');
    });

    it('should return empty array for no matches', async () => {
      const patterns = ['*.nonexistent'];
      const result = await expandPatterns(patterns, sourceDir, false);

      expect(result).toEqual([]);
    });

    it('should handle empty patterns array', async () => {
      const patterns = [];
      const result = await expandPatterns(patterns, sourceDir, false);

      expect(result).toEqual([]);
    });

    it('should handle non-existent directory', async () => {
      const patterns = ['*.md'];
      const result = await expandPatterns(patterns, path.join(testDir, 'nonexistent'), false);

      expect(result).toEqual([]);
    });
  });

  describe('validatePatterns', () => {
    it('should validate valid glob patterns', () => {
      const patterns = ['*.md', '*.{js,ts}', 'test-*'];
      expect(() => validatePatterns(patterns)).not.toThrow();
    });

    it('should validate valid regex patterns', () => {
      const patterns = ['/^config.*\\.json$/', '/^test-.*\\.(js|ts)$/i'];
      expect(() => validatePatterns(patterns)).not.toThrow();
    });

    it('should validate mixed valid patterns', () => {
      const patterns = ['*.md', 'config.json', '/^test-.*\\.js$/'];
      expect(() => validatePatterns(patterns)).not.toThrow();
    });

    it('should throw error for invalid regex patterns', () => {
      const patterns = ['/invalid[regex/'];
      expect(() => validatePatterns(patterns)).toThrow('Invalid regex pattern');
    });

    it('should throw error for malformed regex patterns', () => {
      const patterns = ['/incomplete'];
      expect(() => validatePatterns(patterns)).toThrow('Invalid regex pattern');
    });

    it('should throw error for non-string patterns', () => {
      const patterns = ['*.md', 123, 'config.json'];
      expect(() => validatePatterns(patterns)).toThrow('Invalid pattern: 123. Must be a string.');
    });

    it('should handle empty patterns array', () => {
      const patterns = [];
      expect(() => validatePatterns(patterns)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle patterns with special characters', async () => {
      // Create file with special characters
      await fs.writeFile(path.join(sourceDir, 'file-with-dashes.md'), '# Test');
      await fs.writeFile(path.join(sourceDir, 'file_with_underscores.md'), '# Test');
      await fs.writeFile(path.join(sourceDir, 'file.with.dots.md'), '# Test');

      const patterns = ['file-*.md', 'file_*.md', 'file.*.md'];
      const result = await expandPatterns(patterns, sourceDir, false);

      expect(result).toContain('file-with-dashes.md');
      expect(result).toContain('file_with_underscores.md');
      expect(result).toContain('file.with.dots.md');
    });

    it('should handle case sensitivity in regex', async () => {
      // Create files with different names to avoid filesystem case-insensitivity issues
      await fs.writeFile(path.join(sourceDir, 'config.json'), '{}');
      await fs.writeFile(path.join(sourceDir, 'Config.json'), '{}');
      await fs.writeFile(path.join(sourceDir, 'CONFIG.json'), '{}');

      const patterns = ['/^config\\.json$/i'];
      const result = await expandPatterns(patterns, sourceDir, false);

      // On case-insensitive filesystems, only one file will exist
      // So we just verify that the pattern matching works
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(file => file.toLowerCase().includes('config'))).toBe(true);
    });

    it('should handle complex glob patterns', async () => {
      await fs.writeFile(path.join(sourceDir, 'test1.js'), 'test');
      await fs.writeFile(path.join(sourceDir, 'test2.ts'), 'test');
      await fs.writeFile(path.join(sourceDir, 'spec1.js'), 'test');
      await fs.writeFile(path.join(sourceDir, 'spec2.ts'), 'test');

      const patterns = ['test[12].{js,ts}', 'spec[12].{js,ts}'];
      const result = await expandPatterns(patterns, sourceDir, false);

      expect(result).toContain('test1.js');
      expect(result).toContain('test2.ts');
      expect(result).toContain('spec1.js');
      expect(result).toContain('spec2.ts');
    });
  });
});
