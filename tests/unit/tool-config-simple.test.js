// Simple unit tests for tool-config.js
import { jest } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the module under test
const toolConfig = await import('../../src/tool-config.js');

describe('Tool Config Module - Simple', () => {
  let testDir;
  let originalCwd;
  let config;

  beforeAll(async () => {
    originalCwd = process.cwd();
    testDir = path.join(__dirname, 'test-tool-config-simple-temp');
    await fs.ensureDir(testDir);

    // Load the configuration once for all tests
    config = await toolConfig.loadConfig();
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

  describe('loadConfig', () => {
    it('should load configuration successfully', async () => {
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should have tools property if configured', async () => {
      if (config.tools) {
        expect(typeof config.tools).toBe('object');
        expect(Array.isArray(Object.keys(config.tools))).toBe(true);
      }
    });

    it('should handle configuration loading errors gracefully', async () => {
      // Mock fs.readFile to throw an error
      const originalReadFile = fs.readFile;
      fs.readFile = jest.fn().mockRejectedValue(new Error('File not found'));

      try {
        // This should fail because fs.readFile is mocked to throw
        await expect(toolConfig.loadConfig()).rejects.toThrow('Failed to load configuration: File not found');
      } finally {
        // Restore original function
        fs.readFile = originalReadFile;
      }
    });
  });

  describe('getToolSettings', () => {
    it('should get tool settings for cursor if available', async () => {
      if (config.tools && config.tools.cursor) {
        const settings = toolConfig.getToolSettings('cursor', config);
        expect(settings).toBeDefined();
        expect(typeof settings).toBe('object');
      }
    });

    it('should throw error for non-existent tool', async () => {
      if (config.tools) {
        expect(() => {
          toolConfig.getToolSettings('non-existent-tool', config);
        }).toThrow('Tool configuration not found for: non-existent-tool');
      }
    });
  });

  describe('getAvailableProjectTypes', () => {
    it('should get available project types for cursor if available', async () => {
      if (config.tools && config.tools.cursor) {
        const projectTypes = toolConfig.getAvailableProjectTypes('cursor', config);
        expect(Array.isArray(projectTypes)).toBe(true);
      }
    });

    it('should throw error for non-existent tool', async () => {
      if (config.tools) {
        expect(() => {
          toolConfig.getAvailableProjectTypes('non-existent-tool', config);
        }).toThrow('Tool configuration not found for: non-existent-tool');
      }
    });
  });

  describe('getTasks', () => {
    it('should get tasks for cursor with drupal project if available', async () => {
      if (config.tools && config.tools.cursor) {
        const tasks = toolConfig.getTasks('cursor', 'drupal', config);
        expect(tasks).toBeDefined();
        expect(typeof tasks).toBe('object');
      }
    });

    it('should handle null project type', async () => {
      if (config.tools && config.tools.cursor) {
        const tasks = toolConfig.getTasks('cursor', null, config);
        expect(tasks).toBeDefined();
        expect(typeof tasks).toBe('object');
      }
    });

    it('should throw error for non-existent tool', async () => {
      if (config.tools) {
        expect(() => {
          toolConfig.getTasks('non-existent-tool', 'drupal', config);
        }).toThrow('Tool configuration not found for: non-existent-tool');
      }
    });
  });

  describe('validateProject', () => {
    it('should handle null project type (skip validation)', async () => {
      const result = await toolConfig.validateProject(null, 'cursor', config);
      expect(result).toBeUndefined(); // Should return early for null project
    });

    it('should handle undefined project type', async () => {
      const result = await toolConfig.validateProject(undefined, 'cursor', config);
      expect(result).toBeUndefined(); // Should return early for undefined project
    });
  });

  describe('getAvailableTools', () => {
    it('should get available tools', async () => {
      const tools = toolConfig.getAvailableTools(config);
      expect(Array.isArray(tools)).toBe(true);
      if (config.tools) {
        expect(tools.length).toBeGreaterThan(0);
      }
    });
  });

  describe('loadToolConfig', () => {
    it('should load tool config', async () => {
      const toolConfigResult = await toolConfig.loadToolConfig();
      expect(toolConfigResult).toBeDefined();
      expect(toolConfigResult.tools).toBeDefined();
    });
  });
});
