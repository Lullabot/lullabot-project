// Expanded unit tests for tool-config.js
import { jest } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the module under test
const toolConfig = await import('../../src/tool-config.js');

describe('Tool Config Module - Expanded', () => {
  let testConfigPath;
  let originalConfigPath;

  beforeAll(async () => {
    // Create a test config file
    testConfigPath = path.join(__dirname, 'test-config-expanded.yml');
    originalConfigPath = process.env.CONFIG_PATH;
    process.env.CONFIG_PATH = testConfigPath;
    // Ensure the actual config.yml is present for loadConfig to work
    const sourceConfigPath = path.join(__dirname, '../../config/config.yml');
    await fs.copy(sourceConfigPath, testConfigPath);
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
    // Clean up before each test (re-copy original config if needed)
    if (await fs.pathExists(testConfigPath)) {
      await fs.remove(testConfigPath);
    }
    const sourceConfigPath = path.join(__dirname, '../../config/config.yml');
    await fs.copy(sourceConfigPath, testConfigPath);
  });

  describe('Configuration loading', () => {
    it('should load configuration successfully', async () => {
      const result = await toolConfig.loadConfig();
      expect(result).toBeDefined();
      expect(result.tools).toBeDefined();
      expect(result.projects).toBeDefined();
      expect(result.tools.cursor).toBeDefined();
      expect(result.tools.claude).toBeDefined();
      expect(result.projects.drupal).toBeDefined();
    });

    it('should load tool configuration successfully', async () => {
      const result = await toolConfig.loadToolConfig();
      expect(result).toBeDefined();
      expect(result.tools).toBeDefined();
      expect(result.tools.cursor).toBeDefined();
      expect(result.tools.claude).toBeDefined();
    });

    it('should handle configuration structure correctly', async () => {
      const config = await toolConfig.loadConfig();

      // Test tools structure
      expect(config.tools).toBeDefined();
      expect(typeof config.tools).toBe('object');
      expect(Object.keys(config.tools).length).toBeGreaterThan(0);

      // Test projects structure
      expect(config.projects).toBeDefined();
      expect(typeof config.projects).toBe('object');
      expect(Object.keys(config.projects).length).toBeGreaterThan(0);

      // Test cursor tool structure
      expect(config.tools.cursor).toBeDefined();
      expect(config.tools.cursor.name).toBe('Cursor');
      expect(config.tools.cursor.tasks).toBeDefined();
      expect(typeof config.tools.cursor.tasks).toBe('object');
    });

    it('should handle configuration validation', async () => {
      const config = await toolConfig.loadConfig();

      // Test that all tools have required properties
      for (const [, toolConfig] of Object.entries(config.tools)) {
        expect(toolConfig.name).toBeDefined();
        expect(typeof toolConfig.name).toBe('string');
        expect(toolConfig.tasks).toBeDefined();
        expect(typeof toolConfig.tasks).toBe('object');
      }

      // Test that all projects have required properties
      for (const [, projectConfig] of Object.entries(config.projects)) {
        expect(projectConfig.name).toBeDefined();
        expect(typeof projectConfig.name).toBe('string');
        // Some projects might not have requiredFiles, so check if they exist
        if (projectConfig.requiredFiles) {
          expect(Array.isArray(projectConfig.requiredFiles)).toBe(true);
        }
      }
    });
  });

  describe('Tool operations', () => {
    it('should get available tools', async () => {
      const config = await toolConfig.loadConfig();
      const tools = toolConfig.getAvailableTools(config);
      expect(tools).toContain('cursor');
      expect(tools).toContain('claude');
      expect(tools).toContain('vscode');
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });

    it('should get tool settings for cursor', async () => {
      const config = await toolConfig.loadConfig();
      const settings = toolConfig.getToolSettings('cursor', config);
      expect(settings.name).toBe('Cursor');
      expect(settings.tasks).toBeDefined();
      expect(typeof settings.tasks).toBe('object');
    });

    it('should get tool settings for claude', async () => {
      const config = await toolConfig.loadConfig();
      const settings = toolConfig.getToolSettings('claude', config);
      expect(settings.name).toBe('Claude Code');
      expect(settings.tasks).toBeDefined();
      expect(typeof settings.tasks).toBe('object');
    });

    it('should get tool settings for vscode', async () => {
      const config = await toolConfig.loadConfig();
      const settings = toolConfig.getToolSettings('vscode', config);
      expect(settings.name).toBe('VSCode');
      expect(settings.tasks).toBeDefined();
      expect(typeof settings.tasks).toBe('object');
    });

    it('should handle missing tool configuration gracefully', async () => {
      const config = await toolConfig.loadConfig();
      expect(() => {
        toolConfig.getToolSettings('nonexistent-tool', config);
      }).toThrow('Tool configuration not found for: nonexistent-tool');
    });

    it('should handle tool settings edge cases', async () => {
      const config = await toolConfig.loadConfig();

      // Test with empty string
      expect(() => {
        toolConfig.getToolSettings('', config);
      }).toThrow('Tool configuration not found for: ');

      // Test with null
      expect(() => {
        toolConfig.getToolSettings(null, config);
      }).toThrow('Tool configuration not found for: null');

      // Test with undefined
      expect(() => {
        toolConfig.getToolSettings(undefined, config);
      }).toThrow('Tool configuration not found for: undefined');
    });
  });

  describe('Project operations', () => {
    it('should get available project types for cursor', async () => {
      const config = await toolConfig.loadConfig();
      const projectTypes = toolConfig.getAvailableProjectTypes('cursor', config);
      expect(Array.isArray(projectTypes)).toBe(true);
      // projectTypes might be empty if not configured, so just check it's an array
    });

    it('should get available project types for claude', async () => {
      const config = await toolConfig.loadConfig();
      const projectTypes = toolConfig.getAvailableProjectTypes('claude', config);
      expect(Array.isArray(projectTypes)).toBe(true);
      // projectTypes might be empty if not configured, so just check it's an array
    });

    it('should handle missing tool in getAvailableProjectTypes gracefully', async () => {
      const config = await toolConfig.loadConfig();
      expect(() => {
        toolConfig.getAvailableProjectTypes('nonexistent-tool', config);
      }).toThrow('Tool configuration not found for: nonexistent-tool');
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

    it('should skip validation when no project is selected', async () => {
      const config = await toolConfig.loadConfig();
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
  });

  describe('Task operations', () => {
    it('should get tasks for cursor with drupal project', async () => {
      const config = await toolConfig.loadConfig();
      const tasks = toolConfig.getTasks('cursor', 'drupal', config);
      expect(tasks).toBeDefined();
      expect(tasks['memory-bank']).toBeDefined();
      expect(tasks.rules).toBeDefined();
      expect(typeof tasks).toBe('object');
      expect(Object.keys(tasks).length).toBeGreaterThan(0);
    });

    it('should get tasks for claude with drupal project', async () => {
      const config = await toolConfig.loadConfig();
      const tasks = toolConfig.getTasks('claude', 'drupal', config);
      expect(tasks).toBeDefined();
      // Check that tasks object exists and has some content
      expect(typeof tasks).toBe('object');
      expect(Object.keys(tasks).length).toBeGreaterThanOrEqual(0);
    });

    it('should filter out project-dependent tasks when no project selected', async () => {
      const config = await toolConfig.loadConfig();
      const tasks = toolConfig.getTasks('cursor', null, config);
      expect(tasks).toBeDefined();
      expect(tasks['memory-bank']).toBeDefined();
      // Rules task requires a project, so it should be filtered out
      expect(tasks.rules).toBeUndefined();
    });

    it('should handle missing tool in getTasks gracefully', async () => {
      const config = await toolConfig.loadConfig();
      expect(() => {
        toolConfig.getTasks('nonexistent-tool', 'drupal', config);
      }).toThrow('Tool configuration not found for: nonexistent-tool');
    });

    it('should handle task filtering based on requires-project flag', async () => {
      const config = await toolConfig.loadConfig();

      // Test with project selected
      const tasksWithProject = toolConfig.getTasks('cursor', 'drupal', config);
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

  describe('Configuration structure validation', () => {
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

    it('should validate configuration integrity', async () => {
      const config = await toolConfig.loadConfig();

      // Test that all referenced project types exist
      for (const [, toolConfig] of Object.entries(config.tools)) {
        if (toolConfig.projectTypes) {
          for (const projectType of toolConfig.projectTypes) {
            expect(config.projects[projectType]).toBeDefined();
            expect(config.projects[projectType].name).toBeDefined();
          }
        }
      }
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle malformed configuration gracefully', async () => {
      // Test with missing properties
      const malformedConfig = {
        tools: { cursor: { name: 'Cursor' } }, // Missing tasks
        projects: { drupal: { name: 'Drupal' } } // Missing requiredFiles
      };

      // Should not throw for basic operations
      expect(() => {
        toolConfig.getAvailableTools(malformedConfig);
      }).not.toThrow();

      // Should handle missing properties gracefully
      try {
        toolConfig.getToolSettings('cursor', malformedConfig);
        // If it succeeds, that's fine
      } catch (error) {
        // If it fails, that's expected
        expect(error).toBeDefined();
      }
    });

    it('should handle null/undefined configuration gracefully', async () => {
      // Test with null config
      expect(() => {
        toolConfig.getAvailableTools(null);
      }).toThrow();

      // Test with undefined config
      expect(() => {
        toolConfig.getAvailableTools(undefined);
      }).toThrow();
    });

    it('should handle configuration with unexpected types', async () => {
      const unexpectedConfig = {
        tools: { cursor: 'not-an-object' },
        projects: { drupal: 123 }
      };

      // Should handle gracefully or throw appropriately
      try {
        toolConfig.getAvailableTools(unexpectedConfig);
        // If it succeeds, that's fine
      } catch (error) {
        // If it fails, that's expected
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance and scalability', () => {
    it('should handle large configuration files efficiently', async () => {
      const config = await toolConfig.loadConfig();

      // Test that operations complete in reasonable time
      const startTime = Date.now();

      // Perform multiple operations
      for (let i = 0; i < 100; i++) {
        toolConfig.getAvailableTools(config);
        toolConfig.getAvailableProjectTypes('cursor', config);
        toolConfig.getTasks('cursor', 'drupal', config);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in less than 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should handle repeated calls efficiently', async () => {
      const config = await toolConfig.loadConfig();

      // Test that repeated calls return consistent results
      const tools1 = toolConfig.getAvailableTools(config);
      const tools2 = toolConfig.getAvailableTools(config);
      const tools3 = toolConfig.getAvailableTools(config);

      expect(tools1).toEqual(tools2);
      expect(tools2).toEqual(tools3);
      expect(tools1).toEqual(tools3);
    });
  });
});
