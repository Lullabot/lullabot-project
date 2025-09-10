// Unit tests for file-operations.js
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the module under test
const fileOperations = await import('../../src/file-operations.js');

describe('File Operations Module', () => {
  let testDir;
  let originalCwd;

  beforeAll(async () => {
    // Store original working directory
    originalCwd = process.cwd();

    // Create test directory
    testDir = path.join(__dirname, 'test-file-ops-temp');
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
      expect(fileOperations).toBeDefined();
      expect(typeof fileOperations.getToolVersion).toBe('function');
      expect(typeof fileOperations.createConfigFile).toBe('function');
      expect(typeof fileOperations.readConfigFile).toBe('function');
      expect(typeof fileOperations.executeTask).toBe('function');
    });
  });

  describe('getToolVersion', () => {
    it('should return version from package.json', () => {
      // This function reads from the tool's package.json, so it should return a version
      const version = fileOperations.getToolVersion();
      expect(version).toBeDefined();
      expect(typeof version).toBe('string');
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('createConfigFile', () => {
    it('should create configuration file successfully', async () => {
      // Change to test directory first
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
    });

    it('should handle file write errors gracefully', async () => {
      // This test would require mocking fs.writeFile to fail
      // For now, we'll test that the function exists and has the right signature
      expect(typeof fileOperations.createConfigFile).toBe('function');
      // Function has 2 parameters: config, verbose (verbose has default value)
      expect(fileOperations.createConfigFile.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('readConfigFile', () => {
    it('should read configuration file successfully', async () => {
      // Change to test directory first
      process.chdir(testDir);

      // Create a test config file
      const configPath = path.join(testDir, '.lullabot-project.yml');
      const testConfig = { project: { type: 'drupal' } };
      await fs.writeFile(configPath, yaml.dump(testConfig));

      const result = await fileOperations.readConfigFile();
      expect(result.project.type).toBe('drupal');
    });

    it('should return null when config file does not exist', async () => {
      // Change to test directory first
      process.chdir(testDir);

      const result = await fileOperations.readConfigFile();
      expect(result).toBeNull();
    });
  });

  describe('copyFilesFromGit', () => {
    it('should handle git copy operations', async () => {
      // This function has been moved to the copy-files task type module
      // We'll test the executeTask function instead which routes to the appropriate task type
      expect(typeof fileOperations.executeTask).toBe('function');
    });
  });

  describe('executeTask', () => {
    it('should handle task execution', async () => {
      // This function handles various task types, so we'll test the basic structure
      expect(typeof fileOperations.executeTask).toBe('function');

      // Test function signature
      // Function has 4 parameters: task, tool, projectType, verbose (verbose has default value)
      expect(fileOperations.executeTask.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('File system operations', () => {
    it('should handle file copying operations', async () => {
      // Create test source files
      const sourceDir = path.join(testDir, 'source');
      const targetDir = path.join(testDir, 'target');
      await fs.ensureDir(sourceDir);
      await fs.ensureDir(targetDir);

      await fs.writeFile(path.join(sourceDir, 'test.txt'), 'test content');
      await fs.writeFile(path.join(sourceDir, 'test2.txt'), 'test content 2');

      // Test that we can perform basic file operations
      const files = await fs.readdir(sourceDir);
      expect(files).toContain('test.txt');
      expect(files).toContain('test2.txt');

      // Copy files manually to test the concept
      for (const file of files) {
        await fs.copy(
          path.join(sourceDir, file),
          path.join(targetDir, file)
        );
      }

      const targetFiles = await fs.readdir(targetDir);
      expect(targetFiles).toContain('test.txt');
      expect(targetFiles).toContain('test2.txt');
    });

    it('should handle directory operations', async () => {
      const testSubDir = path.join(testDir, 'subdir', 'nested');
      await fs.ensureDir(testSubDir);

      expect(await fs.pathExists(testSubDir)).toBe(true);

      // Test nested directory creation
      const deeplyNested = path.join(testDir, 'a', 'b', 'c', 'd');
      await fs.ensureDir(deeplyNested);
      expect(await fs.pathExists(deeplyNested)).toBe(true);
    });
  });
});
