/**
 * Comprehensive functional tests for prompts.js
 * Tests the actual business logic with mocked dependencies
 */

import { jest } from '@jest/globals';

// Mock the prompts module
const mockPromptFn = jest.fn();
const mockGetTasksFn = jest.fn();

// Import the module under test
let prompts;

describe('Prompts Module - Functional Tests', () => {
  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Import the module
    prompts = await import('../../src/prompts.js');
  });

  describe('getToolSelection', () => {
    it('should return tool from command line options when provided', async () => {
      const options = { tool: 'cursor' };
      const config = {
        tools: {
          cursor: { name: 'Cursor' },
          vscode: { name: 'VS Code' }
        }
      };

      const result = await prompts.getToolSelection(options, config, mockPromptFn);

      expect(result).toBe('cursor');
      expect(mockPromptFn).not.toHaveBeenCalled();
    });

    it('should throw error for unsupported tool', async () => {
      const options = { tool: 'unsupported' };
      const config = {
        tools: {
          cursor: { name: 'Cursor' }
        }
      };

      await expect(
        prompts.getToolSelection(options, config, mockPromptFn)
      ).rejects.toThrow('Unsupported tool: unsupported. Available tools: cursor');
    });

    it('should prompt user when no tool specified', async () => {
      const options = {};
      const config = {
        tools: {
          cursor: { name: 'Cursor' },
          vscode: { name: 'VS Code' }
        }
      };

      mockPromptFn.mockResolvedValue({ tool: 'vscode' });

      const result = await prompts.getToolSelection(options, config, mockPromptFn);

      expect(result).toBe('vscode');
      expect(mockPromptFn).toHaveBeenCalledWith([
        {
          type: 'list',
          name: 'tool',
          message: 'Which tool are you using?',
          choices: [
            { name: 'Cursor', value: 'cursor' },
            { name: 'VS Code', value: 'vscode' }
          ],
          default: 'cursor'
        }
      ]);
    });

    it('should handle empty tools config', async () => {
      const options = {};
      const config = { tools: {} };

      mockPromptFn.mockResolvedValue({ tool: 'cursor' });

      const result = await prompts.getToolSelection(options, config, mockPromptFn);

      expect(result).toBe('cursor');
      expect(mockPromptFn).toHaveBeenCalledWith([
        {
          type: 'list',
          name: 'tool',
          message: 'Which tool are you using?',
          choices: [],
          default: 'cursor'
        }
      ]);
    });
  });

  describe('getProjectSelection', () => {
    it('should return null for "none" project', async () => {
      const options = { project: 'none' };
      const config = { projects: {} };

      const result = await prompts.getProjectSelection(options, config, mockPromptFn);

      expect(result).toBeNull();
      expect(mockPromptFn).not.toHaveBeenCalled();
    });

    it('should return project from command line options when provided', async () => {
      const options = { project: 'drupal' };
      const config = {
        projects: {
          drupal: { name: 'Drupal' },
          wordpress: { name: 'WordPress' }
        }
      };

      const result = await prompts.getProjectSelection(options, config, mockPromptFn);

      expect(result).toBe('drupal');
      expect(mockPromptFn).not.toHaveBeenCalled();
    });

    it('should throw error for unsupported project', async () => {
      const options = { project: 'unsupported' };
      const config = {
        projects: {
          drupal: { name: 'Drupal' }
        }
      };

      await expect(
        prompts.getProjectSelection(options, config, mockPromptFn)
      ).rejects.toThrow('Unsupported project type: unsupported. Available projects: drupal');
    });

    it('should prompt user when no project specified', async () => {
      const options = {};
      const config = {
        projects: {
          drupal: { name: 'Drupal' },
          wordpress: { name: 'WordPress' },
          none: { name: 'None' }
        }
      };

      mockPromptFn.mockResolvedValue({ project: 'wordpress' });

      const result = await prompts.getProjectSelection(options, config, mockPromptFn);

      expect(result).toBe('wordpress');
      expect(mockPromptFn).toHaveBeenCalledWith([
        {
          type: 'list',
          name: 'project',
          message: 'What type of project is this?',
          choices: [
            { name: 'None (skip project-specific tasks)', value: null },
            { name: 'Drupal', value: 'drupal' },
            { name: 'WordPress', value: 'wordpress' },
            { name: 'None', value: 'none' }
          ],
          default: null
        }
      ]);
    });

    it('should handle empty projects config', async () => {
      const options = {};
      const config = { projects: {} };

      mockPromptFn.mockResolvedValue({ project: 'none' });

      const result = await prompts.getProjectSelection(options, config, mockPromptFn);

      expect(result).toBe('none');
      expect(mockPromptFn).toHaveBeenCalledWith([
        {
          type: 'list',
          name: 'project',
          message: 'What type of project is this?',
          choices: [
            { name: 'None (skip project-specific tasks)', value: null }
          ],
          default: null
        }
      ]);
    });
  });

  describe('getTaskPreferences', () => {
    it('should enable required tasks automatically', async () => {
      const options = {};
      const tasks = {
        'package-install': {
          name: 'Package Installation',
          required: true,
          prompt: 'Install packages?'
        },
        'file-copy': {
          name: 'File Copy',
          required: false,
          prompt: 'Copy files?'
        }
      };

      mockPromptFn.mockResolvedValue({ enabled: true });

      const result = await prompts.getTaskPreferences(options, tasks, mockPromptFn);

      expect(result['package-install']).toBe(true);
      expect(result['file-copy']).toBe(true);
      expect(mockPromptFn).toHaveBeenCalledTimes(1);
    });

    it('should skip disabled tasks', async () => {
      const options = { skipTasks: 'file-copy' };
      const tasks = {
        'package-install': {
          name: 'Package Installation',
          required: false,
          prompt: 'Install packages?'
        },
        'file-copy': {
          name: 'File Copy',
          required: false,
          prompt: 'Copy files?'
        }
      };

      mockPromptFn.mockResolvedValue({ enabled: true });

      const result = await prompts.getTaskPreferences(options, tasks, mockPromptFn);

      expect(result['package-install']).toBe(true);
      expect(result['file-copy']).toBe(false);
      expect(mockPromptFn).toHaveBeenCalledTimes(1);
    });

    it('should prompt for optional tasks', async () => {
      const options = {};
      const tasks = {
        'file-copy': {
          name: 'File Copy',
          required: false,
          prompt: 'Copy files?'
        }
      };

      mockPromptFn.mockResolvedValue({ enabled: false });

      const result = await prompts.getTaskPreferences(options, tasks, mockPromptFn);

      expect(result['file-copy']).toBe(false);
      expect(mockPromptFn).toHaveBeenCalledWith([
        {
          type: 'confirm',
          name: 'enabled',
          message: 'Copy files?',
          default: true
        }
      ]);
    });

    it('should handle tasks without prompts', async () => {
      const options = {};
      const tasks = {
        'file-copy': {
          name: 'File Copy',
          required: false
        }
      };

      mockPromptFn.mockResolvedValue({ enabled: true });

      const result = await prompts.getTaskPreferences(options, tasks, mockPromptFn);

      expect(result['file-copy']).toBe(true);
      expect(mockPromptFn).toHaveBeenCalledWith([
        {
          type: 'confirm',
          name: 'enabled',
          message: 'Would you like to run: File Copy?',
          default: true
        }
      ]);
    });
  });

  describe('confirmAction', () => {
    it('should return user confirmation', async () => {
      mockPromptFn.mockResolvedValue({ confirmed: true });

      const result = await prompts.confirmAction('Are you sure?', false, mockPromptFn);

      expect(result).toBe(true);
      expect(mockPromptFn).toHaveBeenCalledWith([
        {
          type: 'confirm',
          name: 'confirmed',
          message: 'Are you sure?',
          default: false
        }
      ]);
    });

    it('should use default answer when provided', async () => {
      mockPromptFn.mockResolvedValue({ confirmed: false });

      const result = await prompts.confirmAction('Continue?', true, mockPromptFn);

      expect(result).toBe(false);
      expect(mockPromptFn).toHaveBeenCalledWith([
        {
          type: 'confirm',
          name: 'confirmed',
          message: 'Continue?',
          default: true
        }
      ]);
    });
  });

  describe('confirmSetup', () => {
    it('should display setup summary and get confirmation', async () => {
      const config = {
        tool: 'cursor',
        project: 'drupal',
        taskPreferences: {
          'package-install': true,
          'file-copy': false
        }
      };

      const tasks = {
        'package-install': { name: 'Package Installation' },
        'file-copy': { name: 'File Copy' }
      };

      const mockChalk = {
        blue: jest.fn((text) => `BLUE:${text}`),
        cyan: jest.fn((text) => `CYAN:${text}`),
        green: jest.fn((text) => `GREEN:${text}`),
        gray: jest.fn((text) => `GRAY:${text}`)
      };

      const mockLogFn = jest.fn();

      mockPromptFn.mockResolvedValue({ proceed: true });

      const result = await prompts.confirmSetup(
        config,
        tasks,
        mockPromptFn,
        mockChalk,
        mockLogFn
      );

      expect(result).toBe(true);
      expect(mockLogFn).toHaveBeenCalledWith('\nBLUE:📋 Setup Summary:');
      expect(mockLogFn).toHaveBeenCalledWith('• Tool: CYAN:cursor');
      expect(mockLogFn).toHaveBeenCalledWith('• Project Type: CYAN:drupal');
      expect(mockLogFn).toHaveBeenCalledWith('• Tasks: GREEN:✅ Package Installation');
      expect(mockPromptFn).toHaveBeenCalledWith([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Proceed with this setup?',
          default: true
        }
      ]);
    });

    it('should handle no enabled tasks', async () => {
      const config = {
        tool: 'cursor',
        project: 'none',
        taskPreferences: {}
      };

      const tasks = {};

      const mockChalk = {
        blue: jest.fn((text) => `BLUE:${text}`),
        cyan: jest.fn((text) => `CYAN:${text}`),
        gray: jest.fn((text) => `GRAY:${text}`)
      };

      const mockLogFn = jest.fn();

      mockPromptFn.mockResolvedValue({ proceed: false });

      const result = await prompts.confirmSetup(
        config,
        tasks,
        mockPromptFn,
        mockChalk,
        mockLogFn
      );

      expect(result).toBe(false);
      expect(mockLogFn).toHaveBeenCalledWith('• Tasks: GRAY:❌ None selected');
    });

    it('should use console.log as default log function', async () => {
      const config = { tool: 'cursor', project: 'none', taskPreferences: {} };
      const tasks = {};
      const mockChalk = {
        blue: jest.fn((text) => `BLUE:${text}`),
        cyan: jest.fn((text) => `CYAN:${text}`),
        gray: jest.fn((text) => `GRAY:${text}`)
      };

      // Mock console.log
      const originalLog = console.log;
      console.log = jest.fn();

      mockPromptFn.mockResolvedValue({ proceed: true });

      await prompts.confirmSetup(config, tasks, mockPromptFn, mockChalk);

      expect(console.log).toHaveBeenCalled();

      // Restore console.log
      console.log = originalLog;
    });
  });

  describe('promptUser', () => {
    it('should collect complete user configuration', async () => {
      const options = {};
      const config = {
        tools: {
          cursor: { name: 'Cursor' }
        },
        projects: {
          drupal: { name: 'Drupal' }
        }
      };

      const mockTasks = {
        'package-install': { name: 'Package Installation', required: false }
      };

      mockGetTasksFn.mockResolvedValue(mockTasks);
      mockPromptFn
        .mockResolvedValueOnce({ tool: 'cursor' })
        .mockResolvedValueOnce({ project: 'drupal' })
        .mockResolvedValueOnce({ enabled: true });

      const result = await prompts.promptUser(options, config, mockPromptFn, mockGetTasksFn);

      expect(result.tool).toBe('cursor');
      expect(result.project).toBe('drupal');
      expect(result.taskPreferences).toEqual({ 'package-install': true });
      expect(mockGetTasksFn).toHaveBeenCalledWith('cursor', 'drupal', config);
    });

    it('should handle command line overrides', async () => {
      const options = { tool: 'cursor', project: 'drupal' };
      const config = {
        tools: {
          cursor: { name: 'Cursor' }
        },
        projects: {
          drupal: { name: 'Drupal' }
        }
      };

      const mockTasks = {
        'file-copy': { name: 'File Copy', required: false }
      };

      mockGetTasksFn.mockResolvedValue(mockTasks);
      mockPromptFn.mockResolvedValue({ enabled: false });

      const result = await prompts.promptUser(options, config, mockPromptFn, mockGetTasksFn);

      expect(result.tool).toBe('cursor');
      expect(result.project).toBe('drupal');
      expect(result.taskPreferences).toEqual({ 'file-copy': false });
      expect(mockPromptFn).toHaveBeenCalledTimes(1); // Only for task preferences
    });
  });
});
