// Unit tests for tool-config.js
import { jest } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the module under test
const toolConfig = await import('../../src/tool-config.js');

describe('Tool Config Module', () => {
  let testConfigPath;
  let originalConfigPath;

  beforeAll(async () => {
    // Create a test config file
    testConfigPath = path.join(__dirname, 'test-config.yml');
    originalConfigPath = process.env.CONFIG_PATH;
    process.env.CONFIG_PATH = testConfigPath;
  });

  afterAll(async () => {
    // Clean up
    if (await fs.pathExists(testConfigPath)) {
      await fs.remove(testConfigPath);
    }
    if (originalConfigPath) {
      process.env.CONFIG_PATH = originalConfigPath;
    } else {
      delete process.env.CONFIG_PATH;
    }
  });

  beforeEach(async () => {
    // Clean up before each test
    if (await fs.pathExists(testConfigPath)) {
      await fs.remove(testConfigPath);
    }
  });

  describe('Basic functionality', () => {
    it('should have the expected module structure', () => {
      expect(toolConfig).toBeDefined();
      expect(typeof toolConfig.loadConfig).toBe('function');
      expect(typeof toolConfig.loadToolConfig).toBe('function');
      expect(typeof toolConfig.validateProject).toBe('function');
      expect(typeof toolConfig.getToolSettings).toBe('function');
      expect(typeof toolConfig.getAvailableTools).toBe('function');
      expect(typeof toolConfig.getAvailableProjectTypes).toBe('function');
      expect(typeof toolConfig.getTasks).toBe('function');
    });

    it('should load configuration successfully', async () => {
      const result = await toolConfig.loadConfig();
      expect(result).toBeDefined();
      expect(result.tools).toBeDefined();
      expect(result.projects).toBeDefined();
      expect(result.tools.cursor).toBeDefined();
      expect(result.tools.claude).toBeDefined();
      expect(result.projects.development).toBeDefined();
    });

    it('should get available tools', async () => {
      const config = await toolConfig.loadConfig();
      const tools = toolConfig.getAvailableTools(config);
      expect(tools).toContain('cursor');
      expect(tools).toContain('claude');
      expect(tools).toContain('vscode');
    });

    it('should get tool settings for cursor', async () => {
      const config = await toolConfig.loadConfig();
      const settings = toolConfig.getToolSettings('cursor', config);
      expect(settings.name).toBe('Cursor');
      expect(settings.tasks).toBeDefined();
    });

    it('should get tasks for cursor with development project', async () => {
      const config = await toolConfig.loadConfig();
      const tasks = toolConfig.getTasks('cursor', 'development', config);
      expect(tasks).toBeDefined();
      expect(tasks['memory-bank']).toBeDefined();
      expect(tasks.rules).toBeDefined();
    });

    it('should filter out project-dependent tasks when no project selected', async () => {
      const config = await toolConfig.loadConfig();
      const tasks = toolConfig.getTasks('cursor', null, config);
      expect(tasks).toBeDefined();
      expect(tasks['memory-bank']).toBeDefined();
      // Rules task requires a project, so it should be filtered out
      expect(tasks.rules).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('should handle missing tool configuration gracefully', async () => {
      const config = await toolConfig.loadConfig();

      expect(() => {
        toolConfig.getToolSettings('nonexistent-tool', config);
      }).toThrow('Tool configuration not found for: nonexistent-tool');
    });

    it('should handle missing project configuration gracefully', async () => {
      const config = await toolConfig.loadConfig();

      // getTasks doesn't validate project existence, so this should not throw
      // It will return tool tasks but no project-specific tasks
      const tasks = toolConfig.getTasks('cursor', 'nonexistent-project', config);
      expect(tasks).toBeDefined();
      // Should contain tool tasks
      expect(tasks['memory-bank']).toBeDefined();
      expect(tasks.rules).toBeDefined(); // Rules is now available for all projects (no projects filter)
      // But rules requires a project, so it should be filtered out when no project
      const tasksWithoutProject = toolConfig.getTasks('cursor', null, config);
      expect(tasksWithoutProject.rules).toBeUndefined(); // This should be undefined when no project
    });

    it('should handle missing tool in getTasks gracefully', async () => {
      const config = await toolConfig.loadConfig();

      expect(() => {
        toolConfig.getTasks('nonexistent-tool', 'drupal', config);
      }).toThrow('Tool configuration not found for: nonexistent-tool');
    });
  });

  describe('Project validation', () => {
    it('should skip validation when no project is selected', async () => {
      const config = await toolConfig.loadConfig();

      // Mock console.log to capture output
      const originalLog = console.log;
      const logs = [];
      console.log = jest.fn((...args) => logs.push(args.join(' ')));

      try {
        await toolConfig.validateProject(null, 'cursor', config);
        expect(logs.some(log => log.includes('No project selected'))).toBe(true);
      } finally {
        console.log = originalLog;
      }
    });

    it('should handle project validation with missing tool gracefully', async () => {
      const config = await toolConfig.loadConfig();

      await expect(
        toolConfig.validateProject('drupal', 'nonexistent-tool', config)
      ).rejects.toThrow('Tool configuration not found for: nonexistent-tool');
    });

    it('should handle project validation with missing project gracefully', async () => {
      const config = await toolConfig.loadConfig();

      await expect(
        toolConfig.validateProject('nonexistent-project', 'cursor', config)
      ).rejects.toThrow('Project configuration not found for: nonexistent-project');
    });
  });

  describe('Task filtering', () => {
    it('should filter tasks based on requires-project flag', async () => {
      const config = await toolConfig.loadConfig();

      // Test with project selected
      const tasksWithProject = toolConfig.getTasks('cursor', 'development', config);
      expect(tasksWithProject.rules).toBeDefined();

      // Test without project selected
      const tasksWithoutProject = toolConfig.getTasks('cursor', null, config);
      expect(tasksWithoutProject.rules).toBeUndefined();
    });

    it('should include tool tasks regardless of project selection', async () => {
      const config = await toolConfig.loadConfig();

      const tasksWithProject = toolConfig.getTasks('cursor', 'drupal', config);
      const tasksWithoutProject = toolConfig.getTasks('cursor', null, config);

      // Tool tasks should be present in both cases
      expect(tasksWithProject['memory-bank']).toBeDefined();
      expect(tasksWithoutProject['memory-bank']).toBeDefined();
    });
  });

  describe('Configuration structure', () => {
    it('should handle loadToolConfig correctly', async () => {
      const result = await toolConfig.loadToolConfig();
      expect(result).toBeDefined();
      expect(result.tools).toBeDefined();
      expect(result.tools.cursor).toBeDefined();
      expect(result.tools.claude).toBeDefined();
    });

    it('should get available project types for a tool', async () => {
      const config = await toolConfig.loadConfig();
      const projectTypes = toolConfig.getAvailableProjectTypes('cursor', config);
      expect(Array.isArray(projectTypes)).toBe(true);
    });

    it('should handle getAvailableProjectTypes with missing tool gracefully', async () => {
      const config = await toolConfig.loadConfig();

      expect(() => {
        toolConfig.getAvailableProjectTypes('nonexistent-tool', config);
      }).toThrow('Tool configuration not found for: nonexistent-tool');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty configuration gracefully', async () => {
      // Test with minimal config structure
      const minimalConfig = {
        tools: {},
        projects: {}
      };

      expect(() => {
        toolConfig.getAvailableTools(minimalConfig);
      }).not.toThrow();

      expect(toolConfig.getAvailableTools(minimalConfig)).toEqual([]);
    });

    it('should handle missing project validation gracefully', async () => {
      const config = await toolConfig.loadConfig();

      // This should not throw, but may log warnings
      expect(() => {
        toolConfig.getAvailableProjectTypes('cursor', config);
      }).not.toThrow();
    });
  });
});
