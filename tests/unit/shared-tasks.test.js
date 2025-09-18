import {
  resolveSharedTaskReference,
  resolveTaskWithExtends,
  resolveTaskConfig,
  getTasks
} from '../../src/tool-config.js';

describe('Shared Tasks Functionality', () => {
  const mockSharedTasks = {
    rules: {
      name: 'Project Rules from Prompt Library',
      description: 'Copy project-specific rules from Lullabot prompt library',
      type: 'remote-copy-files',
      link: 'https://github.com/Lullabot/prompt_library',
      repository: {
        url: 'https://github.com/Lullabot/prompt_library',
        type: 'branch',
        target: 'main'
      },
      source: '{project-type}/rules/',
      target: '.ai/rules',
      required: false,
      'requires-project': true,
      prompt: 'Would you like to install project-specific rules from the prompt library?'
    },
    'agents-md': {
      name: 'AGENTS.md',
      description: 'Create/update AGENTS.md with project-specific rules',
      type: 'agents-md',
      source: 'assets/AGENTS.md',
      target: '.',
      'link-type': 'markdown',
      required: false,
      prompt: 'Would you like to set up AGENTS.md with project-specific rules?'
    }
  };

  const mockConfig = {
    shared_tasks: mockSharedTasks,
    tools: {
      claude: {
        name: 'Claude Code',
        tasks: {
          rules: '@shared_tasks.rules',
          'agents-md': {
            extends: '@shared_tasks.agents-md',
            'link-type': '@'
          },
          wrapper: {
            name: 'CLAUDE.md Wrapper',
            type: 'copy-files',
            source: 'assets/wrappers/',
            items: { 'claude.md': 'CLAUDE.md' },
            target: '.',
            required: false,
            prompt: 'Would you like to create a CLAUDE.md wrapper file?'
          }
        }
      }
    },
    projects: {
      development: {
        name: 'Development'
      }
    }
  };

  describe('resolveSharedTaskReference', () => {
    it('should resolve a valid shared task reference', () => {
      const result = resolveSharedTaskReference('@shared_tasks.rules', mockSharedTasks);
      expect(result).toEqual(mockSharedTasks.rules);
    });

    it('should return the original config if not a reference', () => {
      const originalConfig = { name: 'Test Task', type: 'copy-files' };
      const result = resolveSharedTaskReference(originalConfig, mockSharedTasks);
      expect(result).toEqual(originalConfig);
    });

    it('should throw error for non-existent shared task', () => {
      expect(() => {
        resolveSharedTaskReference('@shared_tasks.nonexistent', mockSharedTasks);
      }).toThrow('Shared task not found: @shared_tasks.nonexistent');
    });

    it('should throw error when shared_tasks is null', () => {
      expect(() => {
        resolveSharedTaskReference('@shared_tasks.rules', null);
      }).toThrow('Shared task not found: @shared_tasks.rules');
    });
  });

  describe('resolveTaskWithExtends', () => {
    it('should merge base task with overrides using shallow merge', () => {
      const taskConfig = {
        extends: '@shared_tasks.agents-md',
        'link-type': '@'
      };

      const result = resolveTaskWithExtends(taskConfig, mockSharedTasks);

      expect(result).toEqual({
        name: 'AGENTS.md',
        description: 'Create/update AGENTS.md with project-specific rules',
        type: 'agents-md',
        source: 'assets/AGENTS.md',
        target: '.',
        'link-type': '@', // Override applied
        required: false,
        prompt: 'Would you like to set up AGENTS.md with project-specific rules?'
      });
    });

    it('should return original config if no extends', () => {
      const originalConfig = { name: 'Test Task', type: 'copy-files' };
      const result = resolveTaskWithExtends(originalConfig, mockSharedTasks);
      expect(result).toEqual(originalConfig);
    });

    it('should throw error for non-existent extends reference', () => {
      const taskConfig = {
        extends: '@shared_tasks.nonexistent',
        'link-type': '@'
      };

      expect(() => {
        resolveTaskWithExtends(taskConfig, mockSharedTasks);
      }).toThrow('Shared task not found: @shared_tasks.nonexistent');
    });

    it('should handle multiple overrides', () => {
      const taskConfig = {
        extends: '@shared_tasks.rules',
        prompt: 'Custom prompt for this tool',
        required: true
      };

      const result = resolveTaskWithExtends(taskConfig, mockSharedTasks);

      expect(result.prompt).toBe('Custom prompt for this tool');
      expect(result.required).toBe(true);
      expect(result.name).toBe('Project Rules from Prompt Library'); // From base
    });
  });

  describe('resolveTaskConfig', () => {
    it('should resolve direct reference', () => {
      const result = resolveTaskConfig('@shared_tasks.rules', mockSharedTasks, 'claude', 'development');
      expect(result).toEqual({
        ...mockSharedTasks.rules,
        source: 'development/rules/' // Variable should be substituted
      });
    });

    it('should resolve extends with overrides', () => {
      const taskConfig = {
        extends: '@shared_tasks.agents-md',
        'link-type': '@'
      };

      const result = resolveTaskConfig(taskConfig, mockSharedTasks);

      expect(result['link-type']).toBe('@');
      expect(result.name).toBe('AGENTS.md');
    });

    it('should handle regular task config without changes', () => {
      const regularConfig = {
        name: 'Regular Task',
        type: 'copy-files',
        source: 'assets/',
        target: '.'
      };

      const result = resolveTaskConfig(regularConfig, mockSharedTasks);
      expect(result).toEqual(regularConfig);
    });
  });

  describe('getTasks with shared tasks', () => {
    it('should resolve shared task references in tool tasks', () => {
      const result = getTasks('claude', 'development', mockConfig);

      expect(result.rules).toEqual({
        ...mockSharedTasks.rules,
        source: 'development/rules/', // Variable should be substituted
        id: 'rules',
        taskSource: 'tool'
      });
    });

    it('should resolve extends with overrides in tool tasks', () => {
      const result = getTasks('claude', 'development', mockConfig);

      expect(result['agents-md']).toEqual({
        ...mockSharedTasks['agents-md'],
        'link-type': '@', // Override applied
        id: 'agents-md',
        taskSource: 'tool'
      });
    });

    it('should handle regular tasks without changes', () => {
      const result = getTasks('claude', 'development', mockConfig);

      expect(result.wrapper).toEqual({
        name: 'CLAUDE.md Wrapper',
        type: 'copy-files',
        source: 'assets/wrappers/',
        items: { 'claude.md': 'CLAUDE.md' },
        target: '.',
        required: false,
        prompt: 'Would you like to create a CLAUDE.md wrapper file?',
        id: 'wrapper',
        taskSource: 'tool'
      });
    });

    it('should throw error for invalid shared task reference', () => {
      const invalidConfig = {
        ...mockConfig,
        tools: {
          claude: {
            name: 'Claude Code',
            tasks: {
              rules: '@shared_tasks.nonexistent'
            }
          }
        }
      };

      expect(() => {
        getTasks('claude', 'development', invalidConfig);
      }).toThrow('Shared task not found: @shared_tasks.nonexistent');
    });

    it('should throw error for invalid extends reference', () => {
      const invalidConfig = {
        ...mockConfig,
        tools: {
          claude: {
            name: 'Claude Code',
            tasks: {
              'agents-md': {
                extends: '@shared_tasks.nonexistent',
                'link-type': '@'
              }
            }
          }
        }
      };

      expect(() => {
        getTasks('claude', 'development', invalidConfig);
      }).toThrow('Shared task not found: @shared_tasks.nonexistent');
    });
  });
});
