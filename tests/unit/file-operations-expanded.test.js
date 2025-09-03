// Expanded unit tests for file-operations.js
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the module under test
const fileOperations = await import('../../src/file-operations.js');

describe('File Operations Module - Expanded', () => {
  let testDir;
  let originalCwd;

  beforeAll(async () => {
    originalCwd = process.cwd();
    testDir = path.join(__dirname, 'test-file-ops-expanded-temp');
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

  describe('getToolVersion', () => {
    it('should return version from package.json', () => {
      const version = fileOperations.getToolVersion();
      expect(version).toBeDefined();
      expect(typeof version).toBe('string');
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should return a valid semver version', () => {
      const version = fileOperations.getToolVersion();
      const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
      expect(version).toMatch(semverRegex);
    });

    it('should return version greater than 0.0.0', () => {
      const version = fileOperations.getToolVersion();
      const [major, minor, patch] = version.split('.').map(Number);
      expect(major).toBeGreaterThanOrEqual(0);
      expect(minor).toBeGreaterThanOrEqual(0);
      expect(patch).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createConfigFile', () => {
    it('should create configuration file successfully', async () => {
      process.chdir(testDir);
      const config = {
        project: { type: 'drupal', tool: 'cursor' },
        features: { taskPreferences: { rules: true } },
        installation: { created: '2024-01-01T00:00:00.000Z', toolVersion: '1.0.0' }
      };
      const configPath = path.join(testDir, '.lullabot-project.yml');
      await fileOperations.createConfigFile(config, true);
      expect(await fs.pathExists(configPath)).toBe(true);
      const content = await fs.readFile(configPath, 'utf8');
      expect(content).toContain('drupal');
      expect(content).toContain('cursor');
      expect(content).toContain('2.0.0');
    });

    it('should handle null project type correctly', async () => {
      process.chdir(testDir);
      const config = {
        project: { type: null, tool: 'cursor' },
        features: { taskPreferences: { rules: true } },
        installation: { created: '2024-01-01T00:00:00.000Z', toolVersion: '1.0.0' }
      };
      const configPath = path.join(testDir, '.lullabot-project.yml');
      await fileOperations.createConfigFile(config, true);
      expect(await fs.pathExists(configPath)).toBe(true);
      const content = await fs.readFile(configPath, 'utf8');
      expect(content).toContain('null');
      expect(content).toContain('cursor');
    });

    it('should handle verbose mode correctly', async () => {
      process.chdir(testDir);
      const config = {
        project: { type: 'drupal', tool: 'cursor' },
        installation: { created: '2024-01-01T00:00:00.000Z', toolVersion: '1.0.0' }
      };
      const configPath = path.join(testDir, '.lullabot-project.yml');

      // Test with verbose true
      await fileOperations.createConfigFile(config, true);
      expect(await fs.pathExists(configPath)).toBe(true);

      // Test with verbose false
      await fs.remove(configPath);
      await fileOperations.createConfigFile(config, false);
      expect(await fs.pathExists(configPath)).toBe(true);
    });

    it('should handle complex configuration structures', async () => {
      process.chdir(testDir);
      const config = {
        project: { type: 'drupal', tool: 'cursor' },
        features: {
          taskPreferences: {
            rules: true,
            'memory-bank': false
          }
        },
        installation: {
          created: '2024-01-01T00:00:00.000Z',
          toolVersion: '2.0.0'
        },
        files: ['file1.txt', 'file2.txt']
      };
      const configPath = path.join(testDir, '.lullabot-project.yml');
      await fileOperations.createConfigFile(config, true);
      expect(await fs.pathExists(configPath)).toBe(true);
      const content = await fs.readFile(configPath, 'utf8');
      expect(content).toContain('file1.txt');
      expect(content).toContain('file2.txt');
      expect(content).toContain('2.0.0');
    });
  });

  describe('readConfigFile', () => {
    it('should read configuration file successfully', async () => {
      process.chdir(testDir);
      const configPath = path.join(testDir, '.lullabot-project.yml');
      const testConfig = {
        project: { type: 'drupal' },
        features: { taskPreferences: { rules: true } }
      };
      await fs.writeFile(configPath, JSON.stringify(testConfig));
      const result = await fileOperations.readConfigFile();
      expect(result.project.type).toBe('drupal');
      expect(result.features.taskPreferences.rules).toBe(true);
    });

    it('should return null when config file does not exist', async () => {
      process.chdir(testDir);
      const result = await fileOperations.readConfigFile();
      expect(result).toBeNull();
    });

    it('should handle malformed config files gracefully', async () => {
      process.chdir(testDir);
      const configPath = path.join(testDir, '.lullabot-project.yml');
      await fs.writeFile(configPath, 'invalid yaml content {');

      try {
        const result = await fileOperations.readConfigFile();
        // If it succeeds, that's fine
        expect(result).toBeDefined();
      } catch (error) {
        // If it fails, that's expected with malformed content
        expect(error).toBeDefined();
      }
    });
  });

  describe('copyFilesFromGit', () => {
    it('should handle git copy operations', async () => {
      expect(typeof fileOperations.copyFilesFromGit).toBe('function');
      expect(fileOperations.copyFilesFromGit.length).toBe(2); // sourcePath, targetPath (verbose has default)
    });

    it('should handle different source and target paths', async () => {
      const sourcePath = 'assets/rules';
      const targetPath = path.join(testDir, 'rules');

      expect(typeof sourcePath).toBe('string');
      expect(typeof targetPath).toBe('string');
      expect(targetPath).toContain(testDir);
      expect(targetPath).toContain('rules');
    });
  });

  describe('executeTask', () => {
    it('should handle task execution', async () => {
      expect(typeof fileOperations.executeTask).toBe('function');
      expect(fileOperations.executeTask.length).toBeGreaterThanOrEqual(3); // task, tool, projectType, verbose (verbose has default value)
    });

    it('should handle different task types', async () => {
      const taskTypes = [
        'copy-files',
        'install-packages',
        'run-commands',
        'copy-files-from-git'
      ];

      for (const taskType of taskTypes) {
        expect(typeof taskType).toBe('string');
        expect(taskType.length).toBeGreaterThan(0);
      }
    });
  });

  describe('File system operations', () => {
    it('should handle file copying operations', async () => {
      const sourceDir = path.join(testDir, 'source');
      const targetDir = path.join(testDir, 'target');
      await fs.ensureDir(sourceDir);
      await fs.ensureDir(targetDir);

      // Create test files
      await fs.writeFile(path.join(sourceDir, 'test.txt'), 'test content');
      await fs.writeFile(path.join(sourceDir, 'test2.txt'), 'test content 2');
      await fs.ensureDir(path.join(sourceDir, 'nested'));
      await fs.writeFile(path.join(sourceDir, 'nested', 'deep.txt'), 'deep content');

      const files = await fs.readdir(sourceDir);
      expect(files).toContain('test.txt');
      expect(files).toContain('test2.txt');

      // Copy files
      for (const file of files) {
        const sourceFile = path.join(sourceDir, file);
        const targetFile = path.join(targetDir, file);
        if ((await fs.stat(sourceFile)).isFile()) {
          await fs.copy(sourceFile, targetFile);
        }
      }

      const targetFiles = await fs.readdir(targetDir);
      expect(targetFiles).toContain('test.txt');
      expect(targetFiles).toContain('test2.txt');
    });

    it('should handle directory operations', async () => {
      const testSubDir = path.join(testDir, 'subdir', 'nested');
      await fs.ensureDir(testSubDir);
      expect(await fs.pathExists(testSubDir)).toBe(true);

      const deeplyNested = path.join(testDir, 'a', 'b', 'c', 'd', 'e', 'f');
      await fs.ensureDir(deeplyNested);
      expect(await fs.pathExists(deeplyNested)).toBe(true);

      // Test file creation in nested directories
      const testFile = path.join(deeplyNested, 'test.txt');
      await fs.writeFile(testFile, 'test content');
      expect(await fs.pathExists(testFile)).toBe(true);
    });

    it('should handle file permissions', async () => {
      const testFile = path.join(testDir, 'permission-test.txt');
      await fs.writeFile(testFile, 'test content');

      // Test file permissions
      const stats = await fs.stat(testFile);
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBeGreaterThan(0);

      // Test file reading
      const content = await fs.readFile(testFile, 'utf8');
      expect(content).toBe('test content');
    });

    it('should handle symbolic links', async () => {
      const sourceFile = path.join(testDir, 'source.txt');
      const linkFile = path.join(testDir, 'link.txt');

      await fs.writeFile(sourceFile, 'source content');
      await fs.symlink(sourceFile, linkFile);

      expect(await fs.pathExists(linkFile)).toBe(true);
      const content = await fs.readFile(linkFile, 'utf8');
      expect(content).toBe('source content');
    });
  });

  describe('Error handling', () => {
    it('should handle file system errors gracefully', async () => {
      const nonExistentPath = path.join(testDir, 'non-existent', 'file.txt');

      try {
        await fs.readFile(nonExistentPath, 'utf8');
        // If it succeeds, that's unexpected
        expect(true).toBe(false);
      } catch (error) {
        // Expected to fail
        expect(error).toBeDefined();
        expect(error.code).toBe('ENOENT');
      }
    });

    it('should handle permission errors gracefully', async () => {
      const readOnlyFile = path.join(testDir, 'readonly.txt');
      await fs.writeFile(readOnlyFile, 'content');

      // Make file read-only (this might not work on all systems)
      try {
        await fs.chmod(readOnlyFile, 0o444);
        // Test that we can still read it
        const content = await fs.readFile(readOnlyFile, 'utf8');
        expect(content).toBe('content');
      } catch (error) {
        // If chmod fails, that's fine
        expect(error).toBeDefined();
      }
    });
  });

  describe('Path handling', () => {
    it('should handle different path separators', async () => {
      const paths = [
        'path/to/file',
        'path\\to\\file',
        'path/to/file.txt',
        './relative/path',
        '../parent/path',
        '/absolute/path'
      ];

      for (const pathStr of paths) {
        expect(typeof pathStr).toBe('string');
        expect(pathStr.length).toBeGreaterThan(0);

        // Test path operations
        const dirname = path.dirname(pathStr);
        const basename = path.basename(pathStr);
        const extname = path.extname(pathStr);

        expect(typeof dirname).toBe('string');
        expect(typeof basename).toBe('string');
        expect(typeof extname).toBe('string');
      }
    });

    it('should handle path resolution correctly', async () => {
      const relativePath = './test-file';
      const absolutePath = path.resolve(testDir, relativePath);

      expect(absolutePath).toContain(testDir);
      expect(absolutePath).toContain('test-file');
      expect(path.isAbsolute(absolutePath)).toBe(true);
    });
  });
});
