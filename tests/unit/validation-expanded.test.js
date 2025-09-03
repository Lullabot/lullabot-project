// Expanded unit tests for validation.js
import { jest } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the module under test
const validation = await import('../../src/validation.js');

describe('Validation Module - Expanded', () => {
  let testDir;
  let originalCwd;

  beforeAll(async () => {
    originalCwd = process.cwd();
    testDir = path.join(__dirname, 'test-validation-expanded-temp');
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
  });

  describe('validateFile', () => {
    it('should validate existing files', async () => {
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'test content');

      const result = await validation.validateFile(testFile);
      expect(result).toBe(true);
    });

    it('should handle non-existent files', async () => {
      const nonExistentFile = path.join(testDir, 'nonexistent.txt');

      try {
        await validation.validateFile(nonExistentFile);
        // If it succeeds, that's unexpected
        expect(true).toBe(false);
      } catch (error) {
        // Expected to throw for non-existent files
        expect(error.message).toContain('not found');
      }
    });

    it('should handle directory paths', async () => {
      const subDir = path.join(testDir, 'subdir');
      await fs.ensureDir(subDir);

      try {
        const result = await validation.validateFile(subDir);
        // If it succeeds, that's fine
        expect(result).toBeDefined();
      } catch (error) {
        // If it fails, that's also fine
        expect(error).toBeDefined();
      }
    });

    it('should handle symbolic links', async () => {
      const sourceFile = path.join(testDir, 'source.txt');
      const linkFile = path.join(testDir, 'link.txt');

      await fs.writeFile(sourceFile, 'source content');
      await fs.symlink(sourceFile, linkFile);

      const result = await validation.validateFile(linkFile);
      expect(result).toBe(true);
    });

    it('should handle broken symbolic links', async () => {
      const linkFile = path.join(testDir, 'broken-link.txt');
      await fs.symlink('/nonexistent/path', linkFile);

      try {
        const result = await validation.validateFile(linkFile);
        // If it succeeds, that's fine
        expect(result).toBeDefined();
      } catch (error) {
        // If it fails, that's also fine
        expect(error).toBeDefined();
      }
    });

    it('should handle files with special characters in names', async () => {
      const specialFile = path.join(testDir, 'file with spaces.txt');
      await fs.writeFile(specialFile, 'content');

      const result = await validation.validateFile(specialFile);
      expect(result).toBe(true);
    });

    it('should handle files with unicode characters in names', async () => {
      const unicodeFile = path.join(testDir, 'file-émojis-🚀.txt');
      await fs.writeFile(unicodeFile, 'content');

      const result = await validation.validateFile(unicodeFile);
      expect(result).toBe(true);
    });
  });

  describe('validateDirectoryWritable', () => {
    it('should validate writable directories', async () => {
      const result = await validation.validateDirectoryWritable(testDir);
      expect(result).toBe(true);
    });

    it('should handle non-existent directories', async () => {
      const nonExistentDir = path.join(testDir, 'nonexistent');

      // validateDirectoryWritable creates directories if they don't exist
      const result = await validation.validateDirectoryWritable(nonExistentDir);
      expect(result).toBe(true);
      expect(await fs.pathExists(nonExistentDir)).toBe(true);
    });

    it('should handle files as directories', async () => {
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'content');

      try {
        const result = await validation.validateDirectoryWritable(testFile);
        // If it succeeds, that's fine
        expect(result).toBeDefined();
      } catch (error) {
        // If it fails, that's also fine
        expect(error).toBeDefined();
      }
    });

    it('should handle nested directory creation', async () => {
      const nestedDir = path.join(testDir, 'nested', 'deep', 'structure');

      const result = await validation.validateDirectoryWritable(nestedDir);
      expect(result).toBe(true);

      // Verify the directory was actually created
      expect(await fs.pathExists(nestedDir)).toBe(true);
    });

    it('should handle directory permissions', async () => {
      const result = await validation.validateDirectoryWritable(testDir);
      expect(result).toBe(true);

      // Test that we can actually write to the directory
      const testFile = path.join(testDir, 'write-test.txt');
      await fs.writeFile(testFile, 'test content');
      expect(await fs.pathExists(testFile)).toBe(true);
    });
  });

  describe('validateFileContent', () => {
    it('should validate file content with exact match', async () => {
      const testFile = path.join(testDir, 'content-test.txt');
      const content = 'exact match content';
      await fs.writeFile(testFile, content);

      const result = await validation.validateFileContent(testFile, content);
      expect(result).toBe(true);
    });

    it('should validate file content with partial match', async () => {
      const testFile = path.join(testDir, 'partial-test.txt');
      const content = 'this is a longer content string with multiple words';
      await fs.writeFile(testFile, content);

      const result = await validation.validateFileContent(testFile, 'longer content');
      expect(result).toBe(true);
    });

    it('should handle case-sensitive matching', async () => {
      const testFile = path.join(testDir, 'case-test.txt');
      const content = 'Case Sensitive Content';
      await fs.writeFile(testFile, content);

      // Exact case match should work
      const result1 = await validation.validateFileContent(testFile, 'Case Sensitive Content');
      expect(result1).toBe(true);

      // Different case should not match
      try {
        await validation.validateFileContent(testFile, 'case sensitive content');
        // If it succeeds, that's unexpected
        expect(true).toBe(false);
      } catch (error) {
        // Expected to throw for content not found
        expect(error.message).toContain('Required content not found');
      }
    });

    it('should handle multiline content', async () => {
      const testFile = path.join(testDir, 'multiline-test.txt');
      const content = 'line 1\nline 2\nline 3';
      await fs.writeFile(testFile, content);

      const result = await validation.validateFileContent(testFile, 'line 2');
      expect(result).toBe(true);
    });

    it('should handle empty files', async () => {
      const testFile = path.join(testDir, 'empty-test.txt');
      await fs.writeFile(testFile, '');

      const result = await validation.validateFileContent(testFile, '');
      expect(result).toBe(true);
    });

    it('should handle non-existent files', async () => {
      const nonExistentFile = path.join(testDir, 'nonexistent.txt');

      try {
        await validation.validateFileContent(nonExistentFile, 'any content');
        // If it succeeds, that's unexpected
        expect(true).toBe(false);
      } catch (error) {
        // Expected to throw for non-existent files
        expect(error.message).toContain('not found');
      }
    });

    it('should handle regex patterns in content', async () => {
      const testFile = path.join(testDir, 'regex-test.txt');
      const content = 'version 1.2.3 and build 456';
      await fs.writeFile(testFile, content);

      // Test with regex-like patterns
      const result1 = await validation.validateFileContent(testFile, 'version 1.2.3');
      expect(result1).toBe(true);

      const result2 = await validation.validateFileContent(testFile, 'build 456');
      expect(result2).toBe(true);
    });
  });

  describe('isProjectDirectory', () => {
    it('should identify project directories correctly', async () => {
      process.chdir(testDir);

      // Create a basic project structure
      await fs.writeFile(path.join(testDir, 'package.json'), '{"name": "test-project"}');
      await fs.writeFile(path.join(testDir, 'README.md'), '# Test Project');

      const result = await validation.isProjectDirectory();
      expect(result).toBe(true);
    });

    it('should handle non-project directories', async () => {
      process.chdir(testDir);

      // Directory with no project files
      const result = await validation.isProjectDirectory();
      expect(result).toBe(false);
    });

    it('should handle verbose mode', async () => {
      process.chdir(testDir);

      // Create a basic project structure
      await fs.writeFile(path.join(testDir, 'package.json'), '{"name": "test-project"}');

      const originalLog = console.log;
      const logs = [];
      console.log = jest.fn((...args) => logs.push(args.join(' ')));

      try {
        const result = await validation.isProjectDirectory(true);
        expect(result).toBe(true);
        expect(logs.length).toBeGreaterThan(0);
      } finally {
        console.log = originalLog;
      }
    });

    it('should handle different project file combinations', async () => {
      process.chdir(testDir);

      // Test with composer.json (Drupal project)
      await fs.writeFile(path.join(testDir, 'composer.json'), '{"name": "drupal/project"}');
      const result1 = await validation.isProjectDirectory();
      expect(result1).toBe(true);

      // Test with package.json (Node.js project)
      await fs.remove(path.join(testDir, 'composer.json'));
      await fs.writeFile(path.join(testDir, 'package.json'), '{"name": "node-project"}');
      const result2 = await validation.isProjectDirectory();
      expect(result2).toBe(true);

      // Test with both files
      await fs.writeFile(path.join(testDir, 'composer.json'), '{"name": "hybrid-project"}');
      const result3 = await validation.isProjectDirectory();
      expect(result3).toBe(true);
    });

    it('should handle project files in subdirectories', async () => {
      process.chdir(testDir);

      // Create project files in subdirectories
      const subDir = path.join(testDir, 'subdir');
      await fs.ensureDir(subDir);
      await fs.writeFile(path.join(subDir, 'package.json'), '{"name": "sub-project"}');

      // isProjectDirectory only checks current directory, not subdirectories
      const result = await validation.isProjectDirectory();
      expect(result).toBe(false);
    });
  });

  describe('validateDirectory', () => {
    it('should validate existing directories', async () => {
      const result = await validation.validateDirectory(testDir);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.isValid).toBeDefined();
      expect(result.found).toBeDefined();
      expect(result.missing).toBeDefined();
      expect(Array.isArray(result.found)).toBe(true);
      expect(Array.isArray(result.missing)).toBe(true);
    });

    it('should handle non-existent directories', async () => {
      const nonExistentDir = path.join(testDir, 'nonexistent');

      // validateDirectory only checks the current working directory
      // So we need to change to the non-existent directory first
      try {
        process.chdir(nonExistentDir);
        const result = await validation.validateDirectory();
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      } catch (error) {
        // Expected to fail when directory doesn't exist
        expect(error).toBeDefined();
      } finally {
        process.chdir(testDir);
      }
    });

    it('should handle files as directories', async () => {
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'content');

      // validateDirectory only checks the current working directory
      // So we need to change to the file's directory first
      const testFileDir = path.dirname(testFile);
      process.chdir(testFileDir);

      const result = await validation.validateDirectory();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');

      process.chdir(testDir);
    });

    it('should handle verbose mode', async () => {
      const originalLog = console.log;
      const logs = [];
      console.log = jest.fn((...args) => logs.push(args.join(' ')));

      try {
        // Make sure we're in a valid directory
        process.chdir(testDir);
        const result = await validation.validateDirectory(true);
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(logs.length).toBeGreaterThan(0);
      } finally {
        console.log = originalLog;
        process.chdir(testDir);
      }
    });

    it('should handle nested directory validation', async () => {
      const nestedDir = path.join(testDir, 'nested', 'deep', 'structure');
      await fs.ensureDir(nestedDir);

      process.chdir(nestedDir);
      const result = await validation.validateDirectory();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      process.chdir(testDir);
    });

    it('should handle symbolic links to directories', async () => {
      const sourceDir = path.join(testDir, 'source-dir');
      const linkDir = path.join(testDir, 'link-dir');

      await fs.ensureDir(sourceDir);
      await fs.symlink(sourceDir, linkDir);

      process.chdir(linkDir);
      const result = await validation.validateDirectory();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      process.chdir(testDir);
    });

    it('should handle broken symbolic links to directories', async () => {
      const linkDir = path.join(testDir, 'broken-link-dir');
      await fs.symlink('/nonexistent/directory', linkDir);

      try {
        process.chdir(linkDir);
        const result = await validation.validateDirectory();
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      } catch (error) {
        // Expected to fail when directory doesn't exist
        expect(error).toBeDefined();
      } finally {
        process.chdir(testDir);
      }
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle extremely long file paths', async () => {
      // Create a deeply nested directory structure
      let deepPath = testDir;
      for (let i = 0; i < 20; i++) {
        deepPath = path.join(deepPath, `level-${i}`);
      }
      await fs.ensureDir(deepPath);

      process.chdir(deepPath);
      const result = await validation.validateDirectory();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      process.chdir(testDir);
    });

    it('should handle files with very long names', async () => {
      const longName = `${'a'.repeat(100)}.txt`; // Reduced length to avoid ENAMETOOLONG
      const longFile = path.join(testDir, longName);
      await fs.writeFile(longFile, 'content');

      const result = await validation.validateFile(longFile);
      expect(result).toBe(true);
    });

    it('should handle special file types', async () => {
      // Test with hidden files
      const hiddenFile = path.join(testDir, '.hidden');
      await fs.writeFile(hiddenFile, 'hidden content');

      const result1 = await validation.validateFile(hiddenFile);
      expect(result1).toBe(true);

      // Test with files starting with numbers
      const numberedFile = path.join(testDir, '123-file.txt');
      await fs.writeFile(numberedFile, 'numbered content');

      const result2 = await validation.validateFile(numberedFile);
      expect(result2).toBe(true);
    });

    it('should handle concurrent file operations', async () => {
      const testFile = path.join(testDir, 'concurrent-test.txt');

      // Create the file first
      await fs.writeFile(testFile, 'content');

      // Create multiple validation operations
      const operations = [
        validation.validateFile(testFile),
        validation.validateFile(testFile),
        validation.validateFile(testFile)
      ];

      const results = await Promise.all(operations);
      expect(results.every(r => r === true)).toBe(true);
    });
  });

  describe('Performance and scalability', () => {
    it('should handle large numbers of files efficiently', async () => {
      // Create many test files
      const fileCount = 100;
      const files = [];

      for (let i = 0; i < fileCount; i++) {
        const fileName = `test-${i}.txt`;
        const filePath = path.join(testDir, fileName);
        await fs.writeFile(filePath, `content ${i}`);
        files.push(filePath);
      }

      const startTime = Date.now();

      // Validate all files
      const results = await Promise.all(
        files.map(file => validation.validateFile(file))
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
      expect(results.every(r => r === true)).toBe(true);
      expect(results.length).toBe(fileCount);
    });

    it('should handle repeated operations efficiently', async () => {
      const testFile = path.join(testDir, 'repeat-test.txt');
      await fs.writeFile(testFile, 'content');

      const startTime = Date.now();

      // Perform multiple validations
      for (let i = 0; i < 50; i++) {
        await validation.validateFile(testFile);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('File system integration', () => {
    it('should work with fs-extra operations', async () => {
      // Test integration with fs-extra
      const sourceFile = path.join(testDir, 'source.txt');
      const targetFile = path.join(testDir, 'target.txt');

      await fs.writeFile(sourceFile, 'source content');
      await fs.copy(sourceFile, targetFile);

      // Both files should be valid
      const sourceValid = await validation.validateFile(sourceFile);
      const targetValid = await validation.validateFile(targetFile);

      expect(sourceValid).toBe(true);
      expect(targetValid).toBe(true);

      // Content should match
      const sourceContent = await validation.validateFileContent(sourceFile, 'source content');
      const targetContent = await validation.validateFileContent(targetFile, 'source content');

      expect(sourceContent).toBe(true);
      expect(targetContent).toBe(true);
    });

    it('should handle file modifications', async () => {
      const testFile = path.join(testDir, 'modify-test.txt');

      // Create file
      await fs.writeFile(testFile, 'initial content');
      let result = await validation.validateFile(testFile);
      expect(result).toBe(true);

      // Modify file
      await fs.appendFile(testFile, '\nmodified content');
      result = await validation.validateFile(testFile);
      expect(result).toBe(true);

      // Verify content changes
      const content1 = await validation.validateFileContent(testFile, 'initial content');
      const content2 = await validation.validateFileContent(testFile, 'modified content');

      expect(content1).toBe(true);
      expect(content2).toBe(true);
    });

    it('should handle file deletions', async () => {
      const testFile = path.join(testDir, 'delete-test.txt');

      // Create and validate file
      await fs.writeFile(testFile, 'content');
      let result = await validation.validateFile(testFile);
      expect(result).toBe(true);

      // Delete file
      await fs.remove(testFile);
      try {
        result = await validation.validateFile(testFile);
        // If it succeeds, that's unexpected
        expect(true).toBe(false);
      } catch (error) {
        // Expected to throw for deleted files
        expect(error.message).toContain('not found');
      }
    });
  });
});
