import { getTaskPreferences } from '../../src/prompts.js';

describe('Prompts with Links', () => {
  let mockPromptFn;

  beforeEach(() => {
    // Mock the prompt function to capture the message
    mockPromptFn = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTaskPreferences with links', () => {
    it('should include link in prompt message when task has link', async () => {
      const tasks = {
        testTask: {
          name: 'Test Task',
          type: 'copy-files',
          link: 'https://example.com',
          required: false,
          prompt: 'Would you like to run the test task?'
        }
      };

      const options = {};

      // Mock the prompt function to return a response
      mockPromptFn.mockResolvedValue({ enabled: true });

      await getTaskPreferences(options, tasks, mockPromptFn);

      // Verify the prompt was called with the correct message including the clickable link
      const expectedMessage = 'Would you like to run the test task? (\x1b]8;;https://example.com\x1b\\Learn more\x1b]8;;\x1b\\)';
      expect(mockPromptFn).toHaveBeenCalledWith([
        {
          type: 'confirm',
          name: 'enabled',
          message: expectedMessage,
          default: true
        }
      ]);
    });

    it('should not include link in prompt message when task has no link', async () => {
      const tasks = {
        testTask: {
          name: 'Test Task',
          type: 'copy-files',
          required: false,
          prompt: 'Would you like to run the test task?'
        }
      };

      const options = {};

      // Mock the prompt function to return a response
      mockPromptFn.mockResolvedValue({ enabled: true });

      await getTaskPreferences(options, tasks, mockPromptFn);

      // Verify the prompt was called with the original message (no link)
      expect(mockPromptFn).toHaveBeenCalledWith([
        {
          type: 'confirm',
          name: 'enabled',
          message: 'Would you like to run the test task?',
          default: true
        }
      ]);
    });

    it('should include link in prompt message when task has no custom prompt', async () => {
      const tasks = {
        testTask: {
          name: 'Test Task',
          type: 'copy-files',
          link: 'https://github.com/user/repo',
          required: false
          // No custom prompt - should use default
        }
      };

      const options = {};

      // Mock the prompt function to return a response
      mockPromptFn.mockResolvedValue({ enabled: true });

      await getTaskPreferences(options, tasks, mockPromptFn);

      // Verify the prompt was called with the default message including the clickable link
      const expectedMessage = 'Would you like to run: Test Task? (\x1b]8;;https://github.com/user/repo\x1b\\Learn more\x1b]8;;\x1b\\)';
      expect(mockPromptFn).toHaveBeenCalledWith([
        {
          type: 'confirm',
          name: 'enabled',
          message: expectedMessage,
          default: true
        }
      ]);
    });

    it('should handle multiple tasks with and without links', async () => {
      const tasks = {
        taskWithLink: {
          name: 'Task With Link',
          type: 'copy-files',
          link: 'https://example.com',
          required: false,
          prompt: 'Enable task with link?'
        },
        taskWithoutLink: {
          name: 'Task Without Link',
          type: 'copy-files',
          required: false,
          prompt: 'Enable task without link?'
        }
      };

      const options = {};

      // Mock the prompt function to return responses
      mockPromptFn
        .mockResolvedValueOnce({ enabled: true })  // First call for taskWithLink
        .mockResolvedValueOnce({ enabled: false }); // Second call for taskWithoutLink

      await getTaskPreferences(options, tasks, mockPromptFn);

      // Verify both prompts were called with correct messages
      expect(mockPromptFn).toHaveBeenCalledTimes(2);

      const expectedMessage1 = 'Enable task with link? (\x1b]8;;https://example.com\x1b\\Learn more\x1b]8;;\x1b\\)';
      expect(mockPromptFn).toHaveBeenNthCalledWith(1, [
        {
          type: 'confirm',
          name: 'enabled',
          message: expectedMessage1,
          default: true
        }
      ]);

      expect(mockPromptFn).toHaveBeenNthCalledWith(2, [
        {
          type: 'confirm',
          name: 'enabled',
          message: 'Enable task without link?',
          default: true
        }
      ]);
    });

    it('should not prompt for required tasks regardless of link', async () => {
      const tasks = {
        requiredTask: {
          name: 'Required Task',
          type: 'copy-files',
          link: 'https://example.com',
          required: true,
          prompt: 'This should not be prompted'
        }
      };

      const options = {};

      const result = await getTaskPreferences(options, tasks, mockPromptFn);

      // Verify no prompts were called for required tasks
      expect(mockPromptFn).not.toHaveBeenCalled();

      // Verify the required task is automatically enabled
      expect(result.requiredTask).toBe(true);
    });

    it('should not prompt for skipped tasks regardless of link', async () => {
      const tasks = {
        skippedTask: {
          name: 'Skipped Task',
          type: 'copy-files',
          link: 'https://example.com',
          required: false,
          prompt: 'This should not be prompted'
        }
      };

      const options = {
        skipTasks: 'skippedTask'
      };

      const result = await getTaskPreferences(options, tasks, mockPromptFn);

      // Verify no prompts were called for skipped tasks
      expect(mockPromptFn).not.toHaveBeenCalled();

      // Verify the skipped task is disabled
      expect(result.skippedTask).toBe(false);
    });

    it('should handle tasks with --all-tasks option regardless of links', async () => {
      const tasks = {
        taskWithLink: {
          name: 'Task With Link',
          type: 'copy-files',
          link: 'https://example.com',
          required: false
        },
        taskWithoutLink: {
          name: 'Task Without Link',
          type: 'copy-files',
          required: false
        }
      };

      const options = {
        allTasks: true
      };

      const result = await getTaskPreferences(options, tasks, mockPromptFn);

      // Verify no prompts were called when --all-tasks is specified
      expect(mockPromptFn).not.toHaveBeenCalled();

      // Verify all tasks are enabled
      expect(result.taskWithLink).toBe(true);
      expect(result.taskWithoutLink).toBe(true);
    });

    it('should handle tasks with --tasks option regardless of links', async () => {
      const tasks = {
        taskWithLink: {
          name: 'Task With Link',
          type: 'copy-files',
          link: 'https://example.com',
          required: false
        },
        taskWithoutLink: {
          name: 'Task Without Link',
          type: 'copy-files',
          required: false
        }
      };

      const options = {
        tasks: 'taskWithLink'
      };

      const result = await getTaskPreferences(options, tasks, mockPromptFn);

      // Verify no prompts were called when --tasks is specified
      expect(mockPromptFn).not.toHaveBeenCalled();

      // Verify only specified task is enabled
      expect(result.taskWithLink).toBe(true);
      expect(result.taskWithoutLink).toBe(false);
    });
  });
});
