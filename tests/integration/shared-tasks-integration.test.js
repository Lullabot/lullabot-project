import { loadConfig, getTasks } from '../../src/tool-config.js';
import { validateSharedTasks, validateSharedTaskReferences } from '../../src/validation.js';

describe('Shared Tasks Integration', () => {
  let config;

  beforeAll(async () => {
    config = await loadConfig();
  });

  describe('Configuration Loading', () => {
    it('should load configuration with shared_tasks section', () => {
      expect(config).toBeDefined();
      expect(config.shared_tasks).toBeDefined();
      expect(typeof config.shared_tasks).toBe('object');
    });

    it('should have required shared tasks', () => {
      expect(config.shared_tasks.rules).toBeDefined();
      expect(config.shared_tasks['agents-md']).toBeDefined();
    });

    it('should validate shared tasks configuration', () => {
      expect(() => {
        validateSharedTasks(config);
      }).not.toThrow();
    });

    it('should validate all shared task references', () => {
      expect(() => {
        validateSharedTaskReferences(config);
      }).not.toThrow();
    });
  });

  describe('Task Resolution', () => {
    it('should resolve shared task references for claude tool', () => {
      const tasks = getTasks('claude', 'development', config);

      expect(tasks.rules).toBeDefined();
      expect(tasks.rules.name).toBe('Project Rules from Prompt Library');
      expect(tasks.rules.type).toBe('remote-copy-files');
      expect(tasks.rules.link).toBe('https://github.com/Lullabot/prompt_library');
      expect(tasks.rules.id).toBe('rules');
      expect(tasks.rules.taskSource).toBe('tool');
    });

    it('should resolve extends with overrides for claude tool', () => {
      const tasks = getTasks('claude', 'development', config);

      expect(tasks['agents-md']).toBeDefined();
      expect(tasks['agents-md'].name).toBe('AGENTS.md');
      expect(tasks['agents-md'].type).toBe('agents-md');
      expect(tasks['agents-md']['link-type']).toBe('@'); // Override applied
      expect(tasks['agents-md'].id).toBe('agents-md');
      expect(tasks['agents-md'].taskSource).toBe('tool');
    });

    it('should resolve shared task references for cursor tool', () => {
      const tasks = getTasks('cursor', 'development', config);

      expect(tasks.rules).toBeDefined();
      expect(tasks.rules.name).toBe('Project Rules from Prompt Library');
      expect(tasks.rules.type).toBe('remote-copy-files');
      expect(tasks.rules.id).toBe('rules');
      expect(tasks.rules.taskSource).toBe('tool');
    });

    it('should resolve extends with overrides for cursor tool', () => {
      const tasks = getTasks('cursor', 'development', config);

      expect(tasks['agents-md']).toBeDefined();
      expect(tasks['agents-md'].name).toBe('AGENTS.md');
      expect(tasks['agents-md'].type).toBe('agents-md');
      expect(tasks['agents-md']['link-type']).toBe('@'); // Override applied
      expect(tasks['agents-md'].id).toBe('agents-md');
      expect(tasks['agents-md'].taskSource).toBe('tool');
    });

    it('should resolve shared task references for gemini tool', () => {
      const tasks = getTasks('gemini', 'development', config);

      expect(tasks.rules).toBeDefined();
      expect(tasks.rules.name).toBe('Project Rules from Prompt Library');
      expect(tasks.rules.type).toBe('remote-copy-files');
      expect(tasks.rules.id).toBe('rules');
      expect(tasks.rules.taskSource).toBe('tool');
    });

    it('should resolve shared task references for gemini tool (no overrides)', () => {
      const tasks = getTasks('gemini', 'development', config);

      expect(tasks['agents-md']).toBeDefined();
      expect(tasks['agents-md'].name).toBe('AGENTS.md');
      expect(tasks['agents-md'].type).toBe('agents-md');
      expect(tasks['agents-md']['link-type']).toBe('markdown'); // Default value
      expect(tasks['agents-md'].id).toBe('agents-md');
      expect(tasks['agents-md'].taskSource).toBe('tool');
    });

    it('should resolve shared task references for github-copilot tool', () => {
      const tasks = getTasks('github-copilot', 'development', config);

      expect(tasks.rules).toBeDefined();
      expect(tasks.rules.name).toBe('Project Rules from Prompt Library');
      expect(tasks.rules.type).toBe('remote-copy-files');
      expect(tasks.rules.id).toBe('rules');
      expect(tasks.rules.taskSource).toBe('tool');
    });

    it('should resolve shared task references for windsurf tool', () => {
      const tasks = getTasks('windsurf', 'development', config);

      expect(tasks.rules).toBeDefined();
      expect(tasks.rules.name).toBe('Project Rules from Prompt Library');
      expect(tasks.rules.type).toBe('remote-copy-files');
      expect(tasks.rules.id).toBe('rules');
      expect(tasks.rules.taskSource).toBe('tool');
    });
  });

  describe('Task Consistency', () => {
    it('should have consistent rules task across all tools', () => {
      const tools = ['claude', 'cursor', 'gemini', 'github-copilot', 'windsurf'];
      const rulesTasks = tools.map(tool => getTasks(tool, 'development', config).rules);

      // All rules tasks should have the same core properties
      rulesTasks.forEach(task => {
        expect(task.name).toBe('Project Rules from Prompt Library');
        expect(task.type).toBe('remote-copy-files');
        expect(task.link).toBe('https://github.com/Lullabot/prompt_library');
        expect(task.source).toBe('development/rules/'); // Variable should be substituted
        expect(task.target).toBe('.ai/rules');
        expect(task['requires-project']).toBe(true);
      });
    });

    it('should have consistent agents-md task across all tools (with proper overrides)', () => {
      const tools = ['claude', 'cursor', 'gemini', 'github-copilot', 'windsurf'];
      const agentsTasks = tools.map(tool => getTasks(tool, 'development', config)['agents-md']);

      // All agents-md tasks should have the same core properties
      agentsTasks.forEach(task => {
        expect(task.name).toBe('AGENTS.md');
        expect(task.type).toBe('agents-md');
        expect(task.source).toBe('assets/AGENTS.md');
        expect(task.target).toBe('.');
        expect(task.required).toBe(false);
      });

      // Check specific overrides
      const claudeTask = getTasks('claude', 'development', config)['agents-md'];
      const cursorTask = getTasks('cursor', 'development', config)['agents-md'];
      const geminiTask = getTasks('gemini', 'development', config)['agents-md'];

      expect(claudeTask['link-type']).toBe('@');
      expect(cursorTask['link-type']).toBe('@');
      expect(geminiTask['link-type']).toBe('markdown');
    });
  });

  describe('Tool-Specific Tasks', () => {
    it('should preserve tool-specific tasks alongside shared tasks', () => {
      const claudeTasks = getTasks('claude', 'development', config);

      // Should have shared tasks
      expect(claudeTasks.rules).toBeDefined();
      expect(claudeTasks['agents-md']).toBeDefined();

      // Should have tool-specific tasks
      expect(claudeTasks.wrapper).toBeDefined();
      expect(claudeTasks.wrapper.name).toBe('AI Tool Wrapper'); // Now using shared task name
      expect(claudeTasks.wrapper.type).toBe('copy-files');
    });

    it('should preserve cursor-specific tasks', () => {
      const cursorTasks = getTasks('cursor', 'development', config);

      // Should have shared tasks
      expect(cursorTasks.rules).toBeDefined();
      expect(cursorTasks['agents-md']).toBeDefined();

      // Should have cursor-specific tasks
      expect(cursorTasks['memory-bank']).toBeDefined();
      expect(cursorTasks['drupal-rules']).toBeDefined();
      expect(cursorTasks['vscode-xdebug']).toBeDefined();
    });
  });
});
