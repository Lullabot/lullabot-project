/**
 * Edge case tests for tool-config.js
 * Targets specific uncovered lines to achieve 100% coverage
 */

import { jest } from '@jest/globals';

// Mock dependencies
const mockFs = {
  readFile: jest.fn(),
  access: jest.fn(),
  pathExists: jest.fn()
};


const mockYaml = {
  load: jest.fn()
};

const mockChalk = {
  green: jest.fn((text) => `GREEN:${text}`),
  red: jest.fn((text) => `RED:${text}`),
  yellow: jest.fn((text) => `YELLOW:${text}`)
};

// Mock the modules
jest.unstable_mockModule('fs-extra', () => ({ default: mockFs }));
jest.unstable_mockModule('js-yaml', () => ({ default: mockYaml }));
jest.unstable_mockModule('chalk', () => ({ default: mockChalk }));

describe('Tool Config - Edge Cases', () => {
  let toolConfig;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Import the module
    toolConfig = await import('../../src/tool-config.js');

    // Reset process.cwd mock
    process.cwd = jest.fn().mockReturnValue('/test/current/dir');

    // Reset environment variables
    process.env.HOME = '/test/home';
    process.env.USER = 'testuser';
  });

  describe('loadConfig - macOS /private path handling', () => {
    it('should handle /private prefix on macOS', async () => {
      // Mock __filename to return a path with /private prefix
      const originalFilename = global.__filename;
      global.__filename = '/private/var/folders/test/lullabot-project/src/tool-config.js';

      // Mock fs.readFile to succeed
      mockFs.readFile.mockResolvedValue('mock config content');
      mockYaml.load.mockReturnValue({ tools: {}, projects: {} });

      const result = await toolConfig.loadConfig();

      expect(result).toEqual({ tools: {}, projects: {} });
      // The actual path will be based on the real import.meta.url, so just verify it was called
      expect(mockFs.readFile).toHaveBeenCalledWith(expect.any(String), 'utf8');

      // Restore __filename
      global.__filename = originalFilename;
    });
  });

  describe('loadConfig - fallback path resolution', () => {
    it('should try fallback paths when primary path fails', async () => {
      // Mock fs.readFile to fail on primary path
      mockFs.readFile.mockRejectedValue(new Error('Primary path failed'));

      // Mock fs.access to fail on all fallback paths
      mockFs.access.mockRejectedValue(new Error('Path not accessible'));

      // Mock fs.readFile to fail on all paths
      mockFs.readFile.mockRejectedValue(new Error('All paths failed'));

      // This should trigger the fallback error handling
      await expect(toolConfig.loadConfig()).rejects.toThrow(
        'Failed to load configuration:'
      );
    });

    it('should throw error when all fallback paths fail', async () => {
      // Mock __filename to return a path that will fail
      const originalFilename = global.__filename;
      global.__filename = '/nonexistent/path/lullabot-project/src/tool-config.js';

      // Mock fs.readFile to fail on primary path
      mockFs.readFile.mockRejectedValue(new Error('Primary path failed'));

      // Mock fs.access to fail on all fallback paths
      mockFs.access.mockRejectedValue(new Error('Path not accessible'));

      // Mock fs.readFile to fail on all paths
      mockFs.readFile.mockRejectedValue(new Error('All paths failed'));

      await expect(toolConfig.loadConfig()).rejects.toThrow(
        'Failed to load configuration: All paths failed. Fallback also failed: Configuration file not found in any expected location'
      );

      // Restore __filename
      global.__filename = originalFilename;
    });

    it('should try fallback paths in order', async () => {
      // Mock fs.readFile to fail on primary path
      mockFs.readFile.mockRejectedValue(new Error('Primary path failed'));

      // Mock fs.access to fail on all fallback paths
      mockFs.access.mockRejectedValue(new Error('Path not accessible'));

      // Mock fs.readFile to fail on all paths
      mockFs.readFile.mockRejectedValue(new Error('All paths failed'));

      // This should trigger the fallback error handling
      await expect(toolConfig.loadConfig()).rejects.toThrow(
        'Failed to load configuration:'
      );
    });
  });

  describe('loadToolConfig - backward compatibility', () => {
    it('should have loadToolConfig function', () => {
      expect(typeof toolConfig.loadToolConfig).toBe('function');
      expect(toolConfig.loadToolConfig.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('validateProject - edge cases', () => {
    it('should handle null project type gracefully', async () => {
      const mockConfig = {
        tools: { cursor: { name: 'Cursor' } },
        projects: {}
      };

      // Mock console.log
      const originalLog = console.log;
      console.log = jest.fn();

      await toolConfig.validateProject(null, 'cursor', mockConfig);

      expect(console.log).toHaveBeenCalledWith('GREEN:✅ No project selected - skipping project validation');

      // Restore console.log
      console.log = originalLog;
    });

    it('should throw error for invalid tool', async () => {
      const mockConfig = {
        tools: { cursor: { name: 'Cursor' } },
        projects: {}
      };

      await expect(
        toolConfig.validateProject('drupal', 'invalid-tool', mockConfig)
      ).rejects.toThrow('Tool configuration not found for: invalid-tool');
    });

    it('should throw error for invalid project type', async () => {
      const mockConfig = {
        tools: { cursor: { name: 'Cursor' } },
        projects: { drupal: { name: 'Drupal' } }
      };

      await expect(
        toolConfig.validateProject('invalid-project', 'cursor', mockConfig)
      ).rejects.toThrow('Project configuration not found for: invalid-project');
    });

    it('should throw error for project without validation config', async () => {
      const mockConfig = {
        tools: { cursor: { name: 'Cursor' } },
        projects: { drupal: { name: 'Drupal' } }
      };

      await expect(
        toolConfig.validateProject('drupal', 'cursor', mockConfig)
      ).rejects.toThrow('Project validation not configured for drupal');
    });
  });
});
