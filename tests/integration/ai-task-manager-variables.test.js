import { loadConfig, getTasks } from '../../src/tool-config.js';

describe('AI Task Manager Variable Substitution Integration', () => {
  let config;

  beforeAll(async () => {
    config = await loadConfig();
  });

  describe('Configuration Loading', () => {
    it('should load configuration with ai-task-manager in shared_tasks', () => {
      expect(config).toBeDefined();
      expect(config.shared_tasks).toBeDefined();
      expect(config.shared_tasks['ai-task-manager']).toBeDefined();
    });

    it('should have ai-task-manager with {tool} variable in install-command', () => {
      const aiTaskManager = config.shared_tasks['ai-task-manager'];

      expect(aiTaskManager.name).toBe('AI Task Manager');
      expect(aiTaskManager.type).toBe('package-install');
      expect(aiTaskManager.package['install-command']).toContain('{tool}');
      expect(aiTaskManager.package['install-command']).toBe('npx @e0ipso/ai-task-manager init --assistants {tool}');
    });
  });

  describe('Task Resolution', () => {
    it('should resolve ai-task-manager for claude with correct install-command', () => {
      const tasks = getTasks('claude', 'development', config);

      expect(tasks['ai-task-manager']).toBeDefined();
      expect(tasks['ai-task-manager'].name).toBe('AI Task Manager');
      expect(tasks['ai-task-manager'].type).toBe('package-install');
      expect(tasks['ai-task-manager'].package['install-command']).toBe('npx @e0ipso/ai-task-manager init --assistants claude');
      expect(tasks['ai-task-manager'].package['version-command']).toBe('npx @e0ipso/ai-task-manager init --version');
      expect(tasks['ai-task-manager'].id).toBe('ai-task-manager');
      expect(tasks['ai-task-manager'].taskSource).toBe('tool');
    });

    it('should resolve ai-task-manager for gemini with correct install-command', () => {
      const tasks = getTasks('gemini', 'development', config);

      expect(tasks['ai-task-manager']).toBeDefined();
      expect(tasks['ai-task-manager'].name).toBe('AI Task Manager');
      expect(tasks['ai-task-manager'].type).toBe('package-install');
      expect(tasks['ai-task-manager'].package['install-command']).toBe('npx @e0ipso/ai-task-manager init --assistants gemini');
      expect(tasks['ai-task-manager'].package['version-command']).toBe('npx @e0ipso/ai-task-manager init --version');
      expect(tasks['ai-task-manager'].id).toBe('ai-task-manager');
      expect(tasks['ai-task-manager'].taskSource).toBe('tool');
    });

    it('should have consistent ai-task-manager configuration across tools', () => {
      const claudeTasks = getTasks('claude', 'development', config);
      const geminiTasks = getTasks('gemini', 'development', config);

      const claudeTask = claudeTasks['ai-task-manager'];
      const geminiTask = geminiTasks['ai-task-manager'];

      // All properties should be the same except install-command
      expect(claudeTask.name).toBe(geminiTask.name);
      expect(claudeTask.description).toBe(geminiTask.description);
      expect(claudeTask.type).toBe(geminiTask.type);
      expect(claudeTask.link).toBe(geminiTask.link);
      expect(claudeTask.package.name).toBe(geminiTask.package.name);
      expect(claudeTask.package.type).toBe(geminiTask.package.type);
      expect(claudeTask.package['version-command']).toBe(geminiTask.package['version-command']);
      expect(claudeTask.required).toBe(geminiTask.required);
      expect(claudeTask.prompt).toBe(geminiTask.prompt);

      // Only install-command should differ
      expect(claudeTask.package['install-command']).not.toBe(geminiTask.package['install-command']);
      expect(claudeTask.package['install-command']).toContain('claude');
      expect(geminiTask.package['install-command']).toContain('gemini');
    });
  });

  describe('Tool References', () => {
    it('should have ai-task-manager as shared task reference in claude', () => {
      expect(config.tools.claude.tasks['ai-task-manager']).toBe('@shared_tasks.ai-task-manager');
    });

    it('should have ai-task-manager as shared task reference in gemini', () => {
      expect(config.tools.gemini.tasks['ai-task-manager']).toBe('@shared_tasks.ai-task-manager');
    });

    it('should not have duplicate ai-task-manager definitions in tool configs', () => {
      // Verify that the tool configs only have references, not full definitions
      const claudeTask = config.tools.claude.tasks['ai-task-manager'];
      const geminiTask = config.tools.gemini.tasks['ai-task-manager'];

      expect(typeof claudeTask).toBe('string');
      expect(typeof geminiTask).toBe('string');
      expect(claudeTask).toBe('@shared_tasks.ai-task-manager');
      expect(geminiTask).toBe('@shared_tasks.ai-task-manager');
    });
  });

  describe('Variable Substitution Validation', () => {
    it('should not have any {tool} variables in resolved tasks', () => {
      const claudeTasks = getTasks('claude', 'development', config);
      const geminiTasks = getTasks('gemini', 'development', config);

      // Check that all {tool} variables have been substituted
      const claudeTaskString = JSON.stringify(claudeTasks);
      const geminiTaskString = JSON.stringify(geminiTasks);

      expect(claudeTaskString).not.toContain('{tool}');
      expect(geminiTaskString).not.toContain('{tool}');
    });

    it('should have correct tool names in install-commands', () => {
      const claudeTasks = getTasks('claude', 'development', config);
      const geminiTasks = getTasks('gemini', 'development', config);

      expect(claudeTasks['ai-task-manager'].package['install-command']).toContain('--assistants claude');
      expect(geminiTasks['ai-task-manager'].package['install-command']).toContain('--assistants gemini');
    });
  });
});


