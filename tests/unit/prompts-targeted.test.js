/**
 * Targeted tests for prompts.js uncovered lines
 * Specifically targets lines 143-146 and 151-155 for --all-tasks and --tasks flag handling
 */

import { jest } from '@jest/globals';

// Mock dependencies
const mockPromptFn = jest.fn().mockResolvedValue({ enabled: true });

describe('Prompts - Targeted Coverage Tests', () => {
  let prompts;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Import the module
    prompts = await import('../../src/prompts.js');
  });

  describe('getTaskPreferences - --all-tasks flag handling (lines 143-146)', () => {
    it('should enable all tasks when --all-tasks flag is specified', async () => {
      const tasks = {
        'file-copy': { name: 'File Copy', required: false, prompt: 'Copy files?' },
        'package-install': { name: 'Package Install', required: false, prompt: 'Install packages?' },
        'command-exec': { name: 'Command Execution', required: false, prompt: 'Run commands?' }
      };

      const options = {
        allTasks: true
      };

      const result = await prompts.getTaskPreferences(options, tasks, mockPromptFn);

      expect(result).toEqual({
        'file-copy': true,
        'package-install': true,
        'command-exec': true
      });

      // Should not prompt user when --all-tasks is specified
      expect(mockPromptFn).not.toHaveBeenCalled();
    });

    it('should enable all tasks even when some are required', async () => {
      const tasks = {
        'file-copy': { name: 'File Copy', required: true, prompt: 'Copy files?' },
        'package-install': { name: 'Package Install', required: false, prompt: 'Copy files?' },
        'command-exec': { name: 'Command Execution', required: true, prompt: 'Run commands?' }
      };

      const options = {
        allTasks: true
      };

      const result = await prompts.getTaskPreferences(options, tasks, mockPromptFn);

      expect(result).toEqual({
        'file-copy': true,
        'package-install': true,
        'command-exec': true
      });

      // Should not prompt user when --all-tasks is specified
      expect(mockPromptFn).not.toHaveBeenCalled();
    });

    it('should override other task options when --all-tasks is specified', async () => {
      const tasks = {
        'file-copy': { name: 'File Copy', required: false, prompt: 'Copy files?' },
        'package-install': { name: 'Package Install', required: false, prompt: 'Install packages?' }
      };

      const options = {
        allTasks: true
      };

      const result = await prompts.getTaskPreferences(options, tasks, mockPromptFn);

      expect(result).toEqual({
        'file-copy': true,
        'package-install': true
      });

      // Should not prompt user when --all-tasks is specified
      expect(mockPromptFn).not.toHaveBeenCalled();
    });
  });

  describe('getTaskPreferences - --tasks flag handling (lines 151-155)', () => {
    it('should enable only specified tasks when --tasks flag is used', async () => {
      const tasks = {
        'file-copy': { name: 'File Copy', required: false, prompt: 'Copy files?' },
        'package-install': { name: 'Package Install', required: false, prompt: 'Install packages?' },
        'command-exec': { name: 'Command Execution', required: false, prompt: 'Run commands?' }
      };

      const options = {
        tasks: 'file-copy,command-exec'
      };

      const result = await prompts.getTaskPreferences(options, tasks, mockPromptFn);

      expect(result).toEqual({
        'file-copy': true,
        'package-install': false,
        'command-exec': true
      });

      // Should not prompt user when --tasks is specified
      expect(mockPromptFn).not.toHaveBeenCalled();
    });

    it('should handle single task specification', async () => {
      const tasks = {
        'file-copy': { name: 'File Copy', required: false, prompt: 'Copy files?' },
        'package-install': { name: 'Package Install', required: false, prompt: 'Install packages?' }
      };

      const options = {
        tasks: 'file-copy'
      };

      const result = await prompts.getTaskPreferences(options, tasks, mockPromptFn);



      expect(result).toEqual({
        'file-copy': true,
        'package-install': false
      });

      // Should not prompt user when --tasks is specified
      expect(mockPromptFn).not.toHaveBeenCalled();
    });

    it('should handle tasks with whitespace', async () => {
      const tasks = {
        'file-copy': { name: 'File Copy', required: false, prompt: 'Copy files?' },
        'package-install': { name: 'Package Install', required: false, prompt: 'Install packages?' },
        'command-exec': { name: 'Command Execution', required: false, prompt: 'Run commands?' }
      };

      const options = {
        tasks: ' file-copy , package-install '
      };

      const result = await prompts.getTaskPreferences(options, tasks, mockPromptFn);

      expect(result).toEqual({
        'file-copy': true,
        'package-install': true,
        'command-exec': false
      });

      // Should not prompt user when --tasks is specified
      expect(mockPromptFn).not.toHaveBeenCalled();
    });

    it('should handle required tasks correctly when --tasks is specified', async () => {
      const tasks = {
        'file-copy': { name: 'File Copy', required: true, prompt: 'Copy files?' },
        'package-install': { name: 'Package Install', required: false, prompt: 'Install packages?' },
        'command-exec': { name: 'Command Execution', required: true, prompt: 'Run commands?' }
      };

      const options = {
        tasks: 'file-copy'
      };

      const result = await prompts.getTaskPreferences(options, tasks, mockPromptFn);

      expect(result).toEqual({
        'file-copy': true,
        'package-install': false,
        'command-exec': false
      });

      // Should not prompt user when --tasks is specified
      expect(mockPromptFn).not.toHaveBeenCalled();
    });
  });

  describe('Integration tests for flag combinations', () => {
    it('should prioritize --all-tasks over --tasks flag', async () => {
      const tasks = {
        'file-copy': { name: 'File Copy', required: false, prompt: 'Copy files?' },
        'package-install': { name: 'Package Install', required: false, prompt: 'Install packages?' }
      };

      const options = {
        allTasks: true
      };

      const result = await prompts.getTaskPreferences(options, tasks, mockPromptFn);

      expect(result).toEqual({
        'file-copy': true,
        'package-install': true
      });

      // Should not prompt user when --all-tasks is specified
      expect(mockPromptFn).not.toHaveBeenCalled();
    });

    it('should handle empty tasks string gracefully', async () => {
      const tasks = {
        'file-copy': { name: 'File Copy', required: false, prompt: 'Copy files?' },
        'package-install': { name: 'Package Install', required: false, prompt: 'Install packages?' }
      };

      const options = {
        tasks: ''
      };

      const result = await prompts.getTaskPreferences(options, tasks, mockPromptFn);



      expect(result).toEqual({
        'file-copy': true,
        'package-install': true
      });

      // Should prompt user when no flags are specified (empty tasks string is falsy)
      expect(mockPromptFn).toHaveBeenCalledTimes(2);
    });

    it('should handle tasks flag with non-existent task names', async () => {
      const tasks = {
        'file-copy': { name: 'File Copy', required: false, prompt: 'Copy files?' },
        'package-install': { name: 'Package Install', required: false, prompt: 'Install packages?' }
      };

      const options = {
        tasks: 'file-copy,nonexistent-task,package-install'
      };

      const result = await prompts.getTaskPreferences(options, tasks, mockPromptFn);

      expect(result).toEqual({
        'file-copy': true,
        'package-install': true
      });

      // Should not prompt user when --tasks is specified
      expect(mockPromptFn).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle tasks object with no optional tasks', async () => {
      const tasks = {
        'file-copy': { name: 'File Copy', required: true, prompt: 'Copy files?' },
        'package-install': { name: 'Package Install', required: true, prompt: 'Install packages?' }
      };

      const options = {};

      const result = await prompts.getTaskPreferences(options, tasks, mockPromptFn);

      expect(result).toEqual({
        'file-copy': true,
        'package-install': true
      });

      // Should not prompt user when all tasks are required
      expect(mockPromptFn).not.toHaveBeenCalled();
    });

    it('should handle mixed required and optional tasks with --tasks flag', async () => {
      const tasks = {
        'file-copy': { name: 'File Copy', required: true, prompt: 'Copy files?' },
        'package-install': { name: 'Package Install', required: false, prompt: 'Install packages?' },
        'command-exec': { name: 'Command Execution', required: false, prompt: 'Run commands?' }
      };

      const options = {
        tasks: 'package-install'
      };

      const result = await prompts.getTaskPreferences(options, tasks, mockPromptFn);

      expect(result).toEqual({
        'file-copy': false, // Not specified in --tasks (--tasks overrides required status)
        'package-install': true, // Specified in --tasks
        'command-exec': false // Not specified
      });

      // Should not prompt user when --tasks is specified
      expect(mockPromptFn).not.toHaveBeenCalled();
    });
  });
});
