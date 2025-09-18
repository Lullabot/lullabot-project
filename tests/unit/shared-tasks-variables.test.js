import {
  resolveTaskConfig,
  getTasks
} from '../../src/tool-config.js';

describe('Shared Tasks with Variable Substitution', () => {
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
    'ai-task-manager': {
      name: 'AI Task Manager',
      description: 'Set up AI Task Manager',
      type: 'package-install',
      link: 'https://github.com/e0ipso/ai-task-manager',
      package: {
        name: '@e0ipso/ai-task-manager',
        type: 'npx',
        'install-command': 'npx @e0ipso/ai-task-manager init --assistants {tool}',
        'version-command': 'npx @e0ipso/ai-task-manager init --version'
      },
      required: false,
      prompt: 'Would you like to set up AI Task Manager?'
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
          'ai-task-manager': '@shared_tasks.ai-task-manager',
          'agents-md': {
            extends: '@shared_tasks.agents-md',
            'link-type': '@'
          }
        }
      },
      gemini: {
        name: 'Gemini',
        tasks: {
          rules: '@shared_tasks.rules',
          'ai-task-manager': '@shared_tasks.ai-task-manager',
          'agents-md': '@shared_tasks.agents-md'
        }
      }
    },
    projects: {
      development: {
        name: 'Development'
      }
    }
  };

  describe('resolveTaskConfig with variables', () => {
    it('should substitute {project-type} variable in shared task', () => {
      const result = resolveTaskConfig('@shared_tasks.rules', mockSharedTasks, 'claude', 'development');

      expect(result.source).toBe('development/rules/');
      expect(result.target).toBe('.ai/rules');
    });

    it('should substitute {tool} variable in shared task', () => {
      const result = resolveTaskConfig('@shared_tasks.ai-task-manager', mockSharedTasks, 'claude', 'development');

      expect(result.package['install-command']).toBe('npx @e0ipso/ai-task-manager init --assistants claude');
    });

    it('should substitute {tool} variable for different tools', () => {
      const claudeResult = resolveTaskConfig('@shared_tasks.ai-task-manager', mockSharedTasks, 'claude', 'development');
      const geminiResult = resolveTaskConfig('@shared_tasks.ai-task-manager', mockSharedTasks, 'gemini', 'development');

      expect(claudeResult.package['install-command']).toBe('npx @e0ipso/ai-task-manager init --assistants claude');
      expect(geminiResult.package['install-command']).toBe('npx @e0ipso/ai-task-manager init --assistants gemini');
    });

    it('should handle extends with variable substitution', () => {
      const result = resolveTaskConfig({
        extends: '@shared_tasks.agents-md',
        'link-type': '@'
      }, mockSharedTasks, 'claude', 'development');

      expect(result['link-type']).toBe('@');
      expect(result.name).toBe('AGENTS.md');
    });

    it('should throw error for unsupported variables', () => {
      const invalidSharedTasks = {
        'invalid-task': {
          name: 'Test {unsupported} task',
          type: 'copy-files'
        }
      };

      expect(() => {
        resolveTaskConfig('@shared_tasks.invalid-task', invalidSharedTasks, 'claude', 'development');
      }).toThrow('Unsupported variables found in task: unsupported. Supported variables: tool, project-type');
    });

    it('should throw error when {tool} is used but no tool provided', () => {
      expect(() => {
        resolveTaskConfig('@shared_tasks.ai-task-manager', mockSharedTasks, null, 'development');
      }).toThrow('Task contains {tool} variables but no tool context is available');
    });
  });

  describe('getTasks with variable substitution', () => {
    it('should resolve shared tasks with {tool} variables for claude', () => {
      const tasks = getTasks('claude', 'development', mockConfig);

      expect(tasks['ai-task-manager']).toBeDefined();
      expect(tasks['ai-task-manager'].package['install-command']).toBe('npx @e0ipso/ai-task-manager init --assistants claude');
      expect(tasks['ai-task-manager'].id).toBe('ai-task-manager');
      expect(tasks['ai-task-manager'].taskSource).toBe('tool');
    });

    it('should resolve shared tasks with {tool} variables for gemini', () => {
      const tasks = getTasks('gemini', 'development', mockConfig);

      expect(tasks['ai-task-manager']).toBeDefined();
      expect(tasks['ai-task-manager'].package['install-command']).toBe('npx @e0ipso/ai-task-manager init --assistants gemini');
      expect(tasks['ai-task-manager'].id).toBe('ai-task-manager');
      expect(tasks['ai-task-manager'].taskSource).toBe('tool');
    });

    it('should resolve shared tasks with {project-type} variables', () => {
      const tasks = getTasks('claude', 'development', mockConfig);

      expect(tasks.rules).toBeDefined();
      expect(tasks.rules.source).toBe('development/rules/');
      expect(tasks.rules.target).toBe('.ai/rules');
    });

    it('should handle extends with variable substitution', () => {
      const tasks = getTasks('claude', 'development', mockConfig);

      expect(tasks['agents-md']).toBeDefined();
      expect(tasks['agents-md']['link-type']).toBe('@');
      expect(tasks['agents-md'].name).toBe('AGENTS.md');
    });

    it('should handle different project types', () => {
      const developmentTasks = getTasks('claude', 'development', mockConfig);
      const qaTasks = getTasks('claude', 'quality-assurance', mockConfig);

      expect(developmentTasks.rules.source).toBe('development/rules/');
      expect(qaTasks.rules.source).toBe('quality-assurance/rules/');
    });
  });

  describe('Variable substitution edge cases', () => {
    it('should handle empty project type', () => {
      const tasks = getTasks('claude', null, mockConfig);

      // Rules task should be filtered out because it requires a project
      expect(tasks.rules).toBeUndefined();

      // But ai-task-manager should still be available
      expect(tasks['ai-task-manager']).toBeDefined();
      expect(tasks['ai-task-manager'].package['install-command']).toBe('npx @e0ipso/ai-task-manager init --assistants claude');
    });

    it('should handle multiple variables in same string', () => {
      const multiVarSharedTasks = {
        'multi-var-task': {
          name: 'Task for {tool} in {project-type}',
          type: 'copy-files',
          command: 'setup-{tool}-for-{project-type}'
        }
      };

      const result = resolveTaskConfig('@shared_tasks.multi-var-task', multiVarSharedTasks, 'claude', 'development');

      expect(result.name).toBe('Task for claude in development');
      expect(result.command).toBe('setup-claude-for-development');
    });

    it('should preserve non-variable content', () => {
      const tasks = getTasks('claude', 'development', mockConfig);

      expect(tasks['ai-task-manager'].name).toBe('AI Task Manager');
      expect(tasks['ai-task-manager'].type).toBe('package-install');
      expect(tasks['ai-task-manager'].package.name).toBe('@e0ipso/ai-task-manager');
    });
  });
});
