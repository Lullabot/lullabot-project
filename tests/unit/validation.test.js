// Unit tests for validation.js
import { jest } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the module under test
const validation = await import('../../src/validation.js');

describe('Validation Module', () => {
  let testDir;

  beforeAll(async () => {
    // Create test directory
    testDir = path.join(__dirname, 'test-validation-temp');
    await fs.ensureDir(testDir);
  });

  afterAll(async () => {
    // Clean up test directory
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  beforeEach(async () => {
    // Clean up before each test - remove all files and subdirectories
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
      await fs.ensureDir(testDir);
    }
  });

  describe('isProjectDirectory', () => {
    let originalCwd;

    beforeAll(() => {
      originalCwd = process.cwd();
    });

    afterAll(() => {
      process.chdir(originalCwd);
    });

    it('should return true when project indicators exist', async () => {
      // Change to test directory and create project indicators
      process.chdir(testDir);
      await fs.writeFile('composer.json', '{}');
      await fs.writeFile('.git', 'gitdir: .git');

      const result = await validation.isProjectDirectory();
      expect(result).toBe(true);
    });

    it('should return false when no project indicators exist', async () => {
      // Change to test directory (empty)
      process.chdir(testDir);

      const result = await validation.isProjectDirectory();
      expect(result).toBe(false);
    });

    it('should return false for empty directory', async () => {
      // Change to test directory (empty)
      process.chdir(testDir);

      const result = await validation.isProjectDirectory();
      expect(result).toBe(false);
    });

    it('should show verbose output when verbose is true', async () => {
      // Change to test directory (empty)
      process.chdir(testDir);

      // Mock console.log to capture output
      const originalLog = console.log;
      const logs = [];
      console.log = jest.fn((...args) => logs.push(args.join(' ')));

      try {
        const result = await validation.isProjectDirectory(true);
        expect(result).toBe(false);
        expect(logs.length).toBeGreaterThan(0);
        expect(logs.some(log => log.includes('Warning:'))).toBe(true);
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('validateDirectory', () => {
    let originalCwd;

    beforeAll(() => {
      originalCwd = process.cwd();
    });

    afterAll(() => {
      process.chdir(originalCwd);
    });

    it('should validate directory with verbose output', async () => {
      // Change to test directory and create some indicators
      process.chdir(testDir);
      await fs.writeFile('composer.json', '{}');

      // Mock console.log to capture output
      const originalLog = console.log;
      const logs = [];
      console.log = jest.fn((...args) => logs.push(args.join(' ')));

      try {
        const result = await validation.validateDirectory(true);
        expect(result.isValid).toBe(true);
        expect(result.found).toContain('composer.json');
        expect(logs.length).toBeGreaterThan(0);
        expect(logs.some(log => log.includes('Directory validation:'))).toBe(true);
      } finally {
        console.log = originalLog;
      }
    });

    it('should validate directory without verbose output', async () => {
      // Change to test directory and create some indicators
      process.chdir(testDir);
      await fs.writeFile('package.json', '{}');

      // Mock console.log to capture output
      const originalLog = console.log;
      const logs = [];
      console.log = jest.fn((...args) => logs.push(args.join(' ')));

      try {
        const result = await validation.validateDirectory(false);
        expect(result.isValid).toBe(true);
        expect(result.found).toContain('package.json');
        expect(logs.length).toBe(0); // No verbose output
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('Basic functionality', () => {
    it('should have the expected module structure', () => {
      expect(validation).toBeDefined();
      expect(typeof validation.validateDirectory).toBe('function');
      expect(typeof validation.isProjectDirectory).toBe('function');
      expect(typeof validation.validateFile).toBe('function');
      expect(typeof validation.validateDirectoryWritable).toBe('function');
      expect(typeof validation.validateFileContent).toBe('function');
    });
  });

  describe('validateFile', () => {
    it('should return true when file exists and is readable', async () => {
      // Create test file
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'test content');

      const result = await validation.validateFile(testFile, 'test file');
      expect(result).toBe(true);
    });

    it('should throw error when file does not exist', async () => {
      const testFile = path.join(testDir, 'nonexistent.txt');

      await expect(validation.validateFile(testFile, 'test file')).rejects.toThrow(
        'test file not found:'
      );
    });

    it('should throw error when file is not readable', async () => {
      // Create test file
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'test content');

      // Make file not readable (this might not work on all systems)
      try {
        await fs.chmod(testFile, 0o000);

        await expect(validation.validateFile(testFile, 'test file')).rejects.toThrow(
          'test file not readable:'
        );
      } finally {
        // Restore permissions for cleanup
        await fs.chmod(testFile, 0o644);
      }
    });
  });

  describe('validateDirectoryWritable', () => {
    it('should return true when directory exists and is writable', async () => {
      const result = await validation.validateDirectoryWritable(testDir, 'test directory');
      expect(result).toBe(true);
    });

    it('should create directory when it does not exist', async () => {
      const newDir = path.join(testDir, 'new-subdir');

      const result = await validation.validateDirectoryWritable(newDir, 'new directory');
      expect(result).toBe(true);
      expect(await fs.pathExists(newDir)).toBe(true);
    });

        it('should throw error when directory cannot be created', async () => {
      // Try to create directory in a location that should fail
      const invalidPath = '/root/invalid-path';

      await expect(validation.validateDirectoryWritable(invalidPath, 'invalid directory')).rejects.toThrow(
        'Cannot create invalid directory:'
      );
    });

    it('should throw error when directory exists but is not writable', async () => {
      // Create a directory
      const testSubDir = path.join(testDir, 'test-subdir');
      await fs.ensureDir(testSubDir);

      // Make directory not writable (this might not work on all systems)
      try {
        await fs.chmod(testSubDir, 0o444); // Read-only

        await expect(validation.validateDirectoryWritable(testSubDir, 'test directory')).rejects.toThrow(
          'test directory not writable:'
        );
      } finally {
        // Restore permissions for cleanup
        await fs.chmod(testSubDir, 0o755);
      }
    });
  });

  describe('validateFileContent', () => {
    it('should return true when file contains required content', async () => {
      // Create test file with required content
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'This file contains drupal/core');

      const result = await validation.validateFileContent(
        testFile,
        'drupal/core',
        'test file'
      );
      expect(result).toBe(true);
    });

    it('should throw error when file does not contain required content', async () => {
      // Create test file without required content
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'This file contains other content');

      await expect(validation.validateFileContent(
        testFile,
        'drupal/core',
        'test file'
      )).rejects.toThrow('Required content not found in test file: drupal/core');
    });

    it('should throw error when file does not exist', async () => {
      const testFile = path.join(testDir, 'nonexistent.txt');

      await expect(validation.validateFileContent(
        testFile,
        'drupal/core',
        'test file'
      )).rejects.toThrow('test file not found:');
    });
  });


});
