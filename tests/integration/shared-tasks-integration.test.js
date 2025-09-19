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
      expect(tasks.rules.name).toBe('Rules and AGENTS.md setup');
      expect(tasks.rules.type).toBe('multi-step');
      expect(tasks.rules.id).toBe('rules');
      expect(tasks.rules.taskSource).toBe('tool');
    });

    it('should resolve extends with overrides for claude tool', () => {
      const tasks = getTasks('claude', 'development', config);

      expect(tasks.wrapper).toBeDefined();
      expect(tasks.wrapper.name).toBe('AI Tool Wrapper');
      expect(tasks.wrapper.type).toBe('copy-files');
      expect(tasks.wrapper.items).toEqual({ "claude.md": "CLAUDE.md" }); // Override applied
      expect(tasks.wrapper.id).toBe('wrapper');
      expect(tasks.wrapper.taskSource).toBe('tool');
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
      expect(tasks.rules.name).toBe('Rules and AGENTS.md setup');
      expect(tasks.rules.type).toBe('multi-step');
      expect(tasks.rules.id).toBe('rules');
      expect(tasks.rules.taskSource).toBe('tool');
    });

    it('should resolve shared task references for gemini tool (no overrides)', () => {
      const tasks = getTasks('gemini', 'development', config);

      expect(tasks.wrapper).toBeDefined();
      expect(tasks.wrapper.name).toBe('AI Tool Wrapper');
      expect(tasks.wrapper.type).toBe('copy-files');
      expect(tasks.wrapper.items).toEqual({ "gemini.md": "GEMINI.md" }); // Override applied
      expect(tasks.wrapper.id).toBe('wrapper');
      expect(tasks.wrapper.taskSource).toBe('tool');
    });

    it('should resolve shared task references for github-copilot tool', () => {
      const tasks = getTasks('github-copilot', 'development', config);

      expect(tasks.rules).toBeDefined();
      expect(tasks.rules.name).toBe('Rules and AGENTS.md setup');
      expect(tasks.rules.type).toBe('multi-step');
      expect(tasks.rules.id).toBe('rules');
      expect(tasks.rules.taskSource).toBe('tool');
    });

    it('should resolve shared task references for windsurf tool', () => {
      const tasks = getTasks('windsurf', 'development', config);

      expect(tasks.rules).toBeDefined();
      expect(tasks.rules.name).toBe('Rules and AGENTS.md setup');
      expect(tasks.rules.type).toBe('multi-step');
      expect(tasks.rules.id).toBe('rules');
      expect(tasks.rules.taskSource).toBe('tool');
    });
  });

  describe('Task Consistency', () => {
    it('should have consistent rules task across all tools', () => {
      const tools = ['claude', 'cursor', 'gemini', 'github-copilot', 'windsurf'];
      const rulesTasks = tools.map(tool => getTasks(tool, 'development', config).rules);

      // Check that all tools have a rules task
      rulesTasks.forEach(task => {
        expect(task).toBeDefined();
        expect(task.id).toBe('rules');
        expect(task.taskSource).toBe('tool');
      });

      // Check that cursor has individual rules task
      const cursorRules = getTasks('cursor', 'development', config).rules;
      expect(cursorRules.name).toBe('Project Rules from Prompt Library');
      expect(cursorRules.type).toBe('remote-copy-files');

      // Check that other tools have multi-step rules task
      const multiStepTools = ['claude', 'gemini', 'github-copilot', 'windsurf'];
      multiStepTools.forEach(tool => {
        const task = getTasks(tool, 'development', config).rules;
        expect(task.name).toBe('Rules and AGENTS.md setup');
        expect(task.type).toBe('multi-step');
      });
    });

    it('should have consistent agents-md task across all tools (with proper overrides)', () => {
      // Only cursor has individual agents-md task
      const cursorTasks = getTasks('cursor', 'development', config);
      expect(cursorTasks['agents-md']).toBeDefined();
      expect(cursorTasks['agents-md'].name).toBe('AGENTS.md');
      expect(cursorTasks['agents-md'].type).toBe('agents-md');
      expect(cursorTasks['agents-md'].source).toBe('assets/AGENTS.md');
      expect(cursorTasks['agents-md'].target).toBe('.');
      expect(cursorTasks['agents-md'].required).toBe(false);
      expect(cursorTasks['agents-md']['link-type']).toBe('@'); // Override applied

      // Other tools don't have individual agents-md tasks (they're part of multi-step)
      const toolsWithoutIndividualAgents = ['claude', 'gemini', 'github-copilot', 'windsurf'];
      toolsWithoutIndividualAgents.forEach(tool => {
        const tasks = getTasks(tool, 'development', config);
        expect(tasks['agents-md']).toBeUndefined();
      });
    });
  });

  describe('Tool-Specific Tasks', () => {
    it('should preserve tool-specific tasks alongside shared tasks', () => {
      const claudeTasks = getTasks('claude', 'development', config);

      // Should have shared tasks
      expect(claudeTasks.rules).toBeDefined();
      // Note: claude doesn't have individual agents-md task (it's part of multi-step rules)

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
