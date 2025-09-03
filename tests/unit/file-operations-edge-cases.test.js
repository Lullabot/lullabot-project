// Edge case tests for file-operations.js targeting uncovered lines
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the module under test
const fileOperations = await import('../../src/file-operations.js');

describe('File Operations - Edge Cases', () => {
  let testDir;
  let originalCwd;

  beforeAll(async () => {
    originalCwd = process.cwd();
    testDir = path.join(__dirname, 'test-file-ops-edge-temp');
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

  describe('copyFiles - Security and Edge Cases', () => {
    it('should handle verbose mode with missing source items', async () => {
      const sourceDir = path.join(testDir, 'source');
      const targetDir = path.join(testDir, 'target');
      await fs.ensureDir(sourceDir);
      await fs.ensureDir(targetDir);

      // Create some source files
      await fs.writeFile(path.join(sourceDir, 'existing.txt'), 'content');

      // Try to copy items including non-existent ones
      const itemsToCopy = ['existing.txt', 'missing.txt', 'another-missing.txt'];

      const result = await fileOperations.copyFiles(sourceDir, targetDir, true, itemsToCopy);

      // The result includes the target directory path
      expect(result).toEqual(['target/existing.txt']);
      expect(await fs.pathExists(path.join(targetDir, 'existing.txt'))).toBe(true);
      expect(await fs.pathExists(path.join(targetDir, 'missing.txt'))).toBe(false);
    });

    it('should handle verbose mode with all items missing', async () => {
      const sourceDir = path.join(testDir, 'source');
      const targetDir = path.join(testDir, 'target');
      await fs.ensureDir(sourceDir);
      await fs.ensureDir(targetDir);

      // Try to copy non-existent items
      const itemsToCopy = ['missing1.txt', 'missing2.txt'];

      const result = await fileOperations.copyFiles(sourceDir, targetDir, true, itemsToCopy);

      expect(result).toEqual([]);
      expect(await fs.pathExists(targetDir)).toBe(true);
    });

    it('should handle verbose mode with successful copies', async () => {
      const sourceDir = path.join(testDir, 'source');
      const targetDir = path.join(testDir, 'target');
      await fs.ensureDir(sourceDir);
      await fs.ensureDir(targetDir);

      // Create source files
      await fs.writeFile(path.join(sourceDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(sourceDir, 'file2.txt'), 'content2');

      const itemsToCopy = ['file1.txt', 'file2.txt'];

      const result = await fileOperations.copyFiles(sourceDir, targetDir, true, itemsToCopy);

      // The result includes the target directory path
      expect(result).toEqual(['target/file1.txt', 'target/file2.txt']);
      expect(await fs.pathExists(path.join(targetDir, 'file1.txt'))).toBe(true);
      expect(await fs.pathExists(path.join(targetDir, 'file2.txt'))).toBe(true);
    });

    it('should handle verbose mode with mixed existing and missing items', async () => {
      const sourceDir = path.join(testDir, 'source');
      const targetDir = path.join(testDir, 'target');
      await fs.ensureDir(sourceDir);
      await fs.ensureDir(targetDir);

      // Create some source files
      await fs.writeFile(path.join(sourceDir, 'existing1.txt'), 'content1');
      await fs.writeFile(path.join(sourceDir, 'existing2.txt'), 'content2');

      const itemsToCopy = ['existing1.txt', 'missing1.txt', 'existing2.txt', 'missing2.txt'];

      const result = await fileOperations.copyFiles(sourceDir, targetDir, true, itemsToCopy);

      // The result includes the target directory path
      expect(result).toEqual(['target/existing1.txt', 'target/existing2.txt']);
      expect(await fs.pathExists(path.join(targetDir, 'existing1.txt'))).toBe(true);
      expect(await fs.pathExists(path.join(targetDir, 'existing2.txt'))).toBe(true);
      expect(await fs.pathExists(path.join(targetDir, 'missing1.txt'))).toBe(false);
      expect(await fs.pathExists(path.join(targetDir, 'missing2.txt'))).toBe(false);
    });
  });

  describe('createConfigFile - Edge Cases', () => {
    it('should handle verbose mode with complex config structure', async () => {
      const config = {
        project: {
          type: { tool: 'cursor', type: 'drupal' },
          tool: 'cursor'
        },
        features: {
          taskPreferences: { rules: true, settings: false }
        },
        installation: {
          created: '2023-01-01T00:00:00.000Z'
        },
        files: ['file1.txt', 'file2.txt'],
        packages: { 'package1': '1.0.0' }
      };

      const configPath = await fileOperations.createConfigFile(config, true);

      expect(await fs.pathExists(configPath)).toBe(true);

      const configContent = await fs.readFile(configPath, 'utf8');
      const parsedConfig = await import('js-yaml');
      const loadedConfig = parsedConfig.load(configContent);

      // The project type is not normalized to null, it keeps the object
      expect(loadedConfig.project.type).toEqual({ tool: 'cursor', type: 'drupal' });
      expect(loadedConfig.project.tool).toBe('cursor');
      expect(loadedConfig.features.taskPreferences).toEqual({ rules: true, settings: false });
      expect(loadedConfig.installation.created).toBe('2023-01-01T00:00:00.000Z');
      expect(loadedConfig.installation.updated).toBeDefined();
      expect(loadedConfig.installation.toolVersion).toBeDefined();
      expect(loadedConfig.files).toEqual(['file1.txt', 'file2.txt']);
      expect(loadedConfig.packages).toEqual({ 'package1': '1.0.0' });
    });

    it('should handle verbose mode with minimal config', async () => {
      const config = {
        tool: 'cursor'
      };

      const configPath = await fileOperations.createConfigFile(config, true);

      expect(await fs.pathExists(configPath)).toBe(true);

      const configContent = await fs.readFile(configPath, 'utf8');
      const parsedConfig = await import('js-yaml');
      const loadedConfig = parsedConfig.load(configContent);

      expect(loadedConfig.project.type).toBeNull();
      expect(loadedConfig.project.tool).toBe('cursor');
      expect(loadedConfig.features.taskPreferences).toBeUndefined();
      expect(loadedConfig.installation.created).toBeDefined();
      expect(loadedConfig.installation.updated).toBeDefined();
      expect(loadedConfig.installation.toolVersion).toBeDefined();
      expect(loadedConfig.files).toEqual([]);
      expect(loadedConfig.packages).toEqual({});
    });

    it('should handle verbose mode with null project type', async () => {
      const config = {
        project: {
          type: null,
          tool: 'cursor'
        }
      };

      const configPath = await fileOperations.createConfigFile(config, true);

      expect(await fs.pathExists(configPath)).toBe(true);

      const configContent = await fs.readFile(configPath, 'utf8');
      const parsedConfig = await import('js-yaml');
      const loadedConfig = parsedConfig.load(configContent);

      expect(loadedConfig.project.type).toBeNull();
      expect(loadedConfig.project.tool).toBe('cursor');
    });

    it('should handle verbose mode with undefined project type', async () => {
      const config = {
        project: {
          type: undefined,
          tool: 'cursor'
        }
      };

      const configPath = await fileOperations.createConfigFile(config, true);

      expect(await fs.pathExists(configPath)).toBe(true);

      const configContent = await fs.readFile(configPath, 'utf8');
      const parsedConfig = await import('js-yaml');
      const loadedConfig = parsedConfig.load(configContent);

      // When project.type is undefined but project exists, use the project object as type
      expect(loadedConfig.project.type).toEqual({
        type: undefined,
        tool: 'cursor'
      });
      expect(loadedConfig.project.tool).toBe('cursor');
    });

    it('should handle verbose mode with complex project type object', async () => {
      const config = {
        project: {
          type: {
            tool: 'cursor',
            type: 'drupal',
            metadata: { version: '9.0' }
          },
          tool: 'cursor'
        }
      };

      const configPath = await fileOperations.createConfigFile(config, true);

      expect(await fs.pathExists(configPath)).toBe(true);

      const configContent = await fs.readFile(configPath, 'utf8');
      const parsedConfig = await import('js-yaml');
      const loadedConfig = parsedConfig.load(configContent);

      // The project type keeps the object structure
      expect(loadedConfig.project.type).toEqual({
        tool: 'cursor',
        type: 'drupal',
        metadata: { version: '9.0' }
      });
      expect(loadedConfig.project.tool).toBe('cursor');
    });
  });

  describe('readConfigFile - Edge Cases', () => {
    it('should handle verbose mode in readConfigFile', async () => {
      // Create a config file first
      const config = { tool: 'cursor' };
      await fileOperations.createConfigFile(config, false);

      // Read it back
      const readConfig = await fileOperations.readConfigFile();

      expect(readConfig).toBeDefined();
      expect(readConfig.project.tool).toBe('cursor');
    });

    it('should handle verbose mode in updateConfigFile', async () => {
      // Create initial config
      const initialConfig = { tool: 'cursor' };
      await fileOperations.createConfigFile(initialConfig, false);

      // Update with new data
      const updateConfig = {
        project: { type: 'drupal' },
        files: ['new-file.txt']
      };

      const configPath = await fileOperations.updateConfigFile(updateConfig, true);

      expect(await fs.pathExists(configPath)).toBe(true);

      const configContent = await fs.readFile(configPath, 'utf8');
      const parsedConfig = await import('js-yaml');
      const loadedConfig = parsedConfig.load(configContent);

      // The tool is not preserved in the update, only the new data
      expect(loadedConfig.project.tool).toBeUndefined();
      expect(loadedConfig.project.type).toBe('drupal');
      expect(loadedConfig.files).toEqual(['new-file.txt']);
    });
  });

  describe('getCreatedFiles - Edge Cases', () => {
    it('should handle verbose mode with empty config', async () => {
      const config = {};
      const result = await fileOperations.getCreatedFiles(config);
      expect(result).toEqual([]);
    });

    it('should handle verbose mode with null files array', async () => {
      const config = { files: null };
      const result = await fileOperations.getCreatedFiles(config);
      expect(result).toEqual([]);
    });

    it('should handle verbose mode with undefined files array', async () => {
      const config = { files: undefined };
      const result = await fileOperations.getCreatedFiles(config);
      expect(result).toEqual([]);
    });
  });

  describe('getPackageVersion - Edge Cases', () => {
    it('should handle verbose mode with string package name', async () => {
      const result = await fileOperations.getPackageVersion('test-package', true);

      expect(result).toBeDefined();
      expect(result.name).toBe('test-package');
      expect(result.version).toBeDefined();
      expect(result.lastUpdated).toBeDefined();
    });

    it('should handle verbose mode with package config object', async () => {
      const packageConfig = {
        name: 'test-package',
        type: 'npm',
        versionCommand: 'npm list test-package'
      };

      const result = await fileOperations.getPackageVersion(packageConfig, true);

      expect(result).toBeDefined();
      expect(result.name).toBe('test-package');
      expect(result.type).toBeUndefined(); // type is not returned in result
      expect(result.version).toBeDefined();
      expect(result.lastUpdated).toBeDefined();
    });

    it('should handle verbose mode with package config using kebab-case', async () => {
      const packageConfig = {
        name: 'test-package',
        type: 'npm',
        'version-command': 'npm list test-package'
      };

      const result = await fileOperations.getPackageVersion(packageConfig, true);

      expect(result).toBeDefined();
      expect(result.name).toBe('test-package');
      expect(result.version).toBeDefined();
      expect(result.lastUpdated).toBeDefined();
    });

    it('should handle package version command failures gracefully', async () => {
      // Test with a package that doesn't exist to trigger error handling
      const result = await fileOperations.getPackageVersion({
        name: 'non-existent-package-xyz123',
        type: 'npx'
      }, true);
      expect(result).toBeDefined();
      expect(result.name).toBe('non-existent-package-xyz123');
      expect(result.version).toBe('unknown');
      expect(result.error).toBeDefined();
    }, 10000);

    it('should handle default case in getDefaultVersionCommand', async () => {
      // Test the default case by calling getPackageVersion with an unknown type
      const result = await fileOperations.getPackageVersion({
        name: 'test-package',
        type: 'unknown-type'
      }, true);
      expect(result).toBeDefined();
      expect(result.name).toBe('test-package');
      expect(typeof result.version).toBe('string');
    }, 10000);
  });

  describe('copyFiles - Security Edge Cases', () => {
    it('should handle verbose mode with all items missing', async () => {
      const sourceDir = path.join(testDir, 'source');
      const targetDir = path.join(testDir, 'target');

      try {
        await fs.ensureDir(sourceDir);
        await fs.ensureDir(targetDir);

        // Try to copy non-existent items
        const itemsToCopy = ['missing1.txt', 'missing2.txt'];

        const result = await fileOperations.copyFiles(sourceDir, targetDir, true, itemsToCopy);
        expect(result).toEqual([]);

      } finally {
        if (await fs.pathExists(sourceDir)) {
          await fs.remove(sourceDir);
        }
        if (await fs.pathExists(targetDir)) {
          await fs.remove(targetDir);
        }
      }
    });

    it('should handle verbose mode with mixed existing and missing items', async () => {
      const sourceDir = path.join(testDir, 'source');
      const targetDir = path.join(testDir, 'target');

      try {
        await fs.ensureDir(sourceDir);
        await fs.ensureDir(targetDir);

        // Create one existing file
        await fs.writeFile(path.join(sourceDir, 'existing.txt'), 'content');

        const result = await fileOperations.copyFiles(sourceDir, targetDir, true, ['existing.txt', 'missing.txt']);
        expect(result).toEqual(['target/existing.txt']);

      } finally {
        if (await fs.pathExists(sourceDir)) {
          await fs.remove(sourceDir);
        }
        if (await fs.pathExists(targetDir)) {
          await fs.remove(targetDir);
        }
      }
    });
  });
});
