import {
  substituteVariables,
  containsVariables,
  getVariablesInString,
  validateTaskVariables
} from '../../src/utils/variable-substitution.js';

describe('Variable Substitution', () => {
  describe('substituteVariables', () => {
    it('should substitute {tool} variable in simple string', () => {
      const task = {
        name: 'Test Task for {tool}',
        type: 'copy-files'
      };

      const result = substituteVariables(task, 'claude', 'development');

      expect(result.name).toBe('Test Task for claude');
      expect(result.type).toBe('copy-files');
    });

    it('should substitute {project-type} variable in simple string', () => {
      const task = {
        name: 'Test Task for {project-type}',
        type: 'copy-files'
      };

      const result = substituteVariables(task, 'claude', 'development');

      expect(result.name).toBe('Test Task for development');
      expect(result.type).toBe('copy-files');
    });

    it('should substitute multiple variables in same string', () => {
      const task = {
        name: 'Test Task for {tool} in {project-type}',
        type: 'copy-files'
      };

      const result = substituteVariables(task, 'claude', 'development');

      expect(result.name).toBe('Test Task for claude in development');
    });

    it('should substitute variables in nested objects', () => {
      const task = {
        name: 'AI Task Manager',
        type: 'package-install',
        package: {
          name: '@e0ipso/ai-task-manager',
          'install-command': 'npx @e0ipso/ai-task-manager init --assistants {tool}',
          'version-command': 'npx @e0ipso/ai-task-manager init --version'
        }
      };

      const result = substituteVariables(task, 'claude', 'development');

      expect(result.package['install-command']).toBe('npx @e0ipso/ai-task-manager init --assistants claude');
      expect(result.package['version-command']).toBe('npx @e0ipso/ai-task-manager init --version');
    });

    it('should substitute variables in arrays', () => {
      const task = {
        name: 'Test Task',
        commands: [
          'echo "Setting up {tool}"',
          'echo "For {project-type} project"'
        ]
      };

      const result = substituteVariables(task, 'claude', 'development');

      expect(result.commands[0]).toBe('echo "Setting up claude"');
      expect(result.commands[1]).toBe('echo "For development project"');
    });

    it('should handle empty tool and projectType', () => {
      const task = {
        name: 'Test Task for {tool} in {project-type}',
        type: 'copy-files'
      };

      const result = substituteVariables(task, '', null);

      expect(result.name).toBe('Test Task for  in ');
    });

    it('should throw error when {tool} is used but no tool provided', () => {
      const task = {
        name: 'Test Task for {tool}',
        type: 'copy-files'
      };

      expect(() => {
        substituteVariables(task, null, 'development');
      }).toThrow('Task contains {tool} variables but no tool context is available');
    });

    it('should handle non-object inputs', () => {
      expect(substituteVariables(null, 'claude', 'development')).toBe(null);
      expect(substituteVariables(undefined, 'claude', 'development')).toBe(undefined);
      expect(substituteVariables('string', 'claude', 'development')).toBe('string');
      expect(substituteVariables(123, 'claude', 'development')).toBe(123);
    });

    it('should not modify original object', () => {
      const task = {
        name: 'Test Task for {tool}',
        type: 'copy-files'
      };

      const originalName = task.name;
      substituteVariables(task, 'claude', 'development');

      expect(task.name).toBe(originalName);
    });
  });

  describe('containsVariables', () => {
    it('should detect {tool} variable', () => {
      expect(containsVariables('Test {tool} task')).toBe(true);
    });

    it('should detect {project-type} variable', () => {
      expect(containsVariables('Test {project-type} task')).toBe(true);
    });

    it('should detect multiple variables', () => {
      expect(containsVariables('Test {tool} for {project-type}')).toBe(true);
    });

    it('should return false for strings without variables', () => {
      expect(containsVariables('Test task')).toBe(false);
      expect(containsVariables('Test {other} task')).toBe(false);
    });

    it('should return false for non-string inputs', () => {
      expect(containsVariables(null)).toBe(false);
      expect(containsVariables(undefined)).toBe(false);
      expect(containsVariables(123)).toBe(false);
      expect(containsVariables({})).toBe(false);
    });
  });

  describe('getVariablesInString', () => {
    it('should extract single variable', () => {
      const result = getVariablesInString('Test {tool} task');
      expect(result).toEqual(['tool']);
    });

    it('should extract multiple variables', () => {
      const result = getVariablesInString('Test {tool} for {project-type}');
      expect(result).toEqual(['tool', 'project-type']);
    });

    it('should handle duplicate variables', () => {
      const result = getVariablesInString('Test {tool} and {tool} again');
      expect(result).toEqual(['tool']);
    });

    it('should return empty array for strings without variables', () => {
      const result = getVariablesInString('Test task');
      expect(result).toEqual([]);
    });

    it('should return empty array for non-string inputs', () => {
      expect(getVariablesInString(null)).toEqual([]);
      expect(getVariablesInString(undefined)).toEqual([]);
      expect(getVariablesInString(123)).toEqual([]);
    });
  });

  describe('validateTaskVariables', () => {
    it('should pass validation for supported variables', () => {
      const task = {
        name: 'Test {tool} for {project-type}',
        type: 'copy-files'
      };

      expect(() => {
        validateTaskVariables(task);
      }).not.toThrow();
    });

    it('should throw error for unsupported variables', () => {
      const task = {
        name: 'Test {unsupported} task',
        type: 'copy-files'
      };

      expect(() => {
        validateTaskVariables(task);
      }).toThrow('Unsupported variables found in task: unsupported. Supported variables: tool, project-type');
    });

    it('should throw error for multiple unsupported variables', () => {
      const task = {
        name: 'Test {unsupported1} and {unsupported2}',
        type: 'copy-files'
      };

      expect(() => {
        validateTaskVariables(task);
      }).toThrow('Unsupported variables found in task: unsupported1, unsupported2. Supported variables: tool, project-type');
    });

    it('should handle mixed supported and unsupported variables', () => {
      const task = {
        name: 'Test {tool} and {unsupported}',
        type: 'copy-files'
      };

      expect(() => {
        validateTaskVariables(task);
      }).toThrow('Unsupported variables found in task: unsupported. Supported variables: tool, project-type');
    });

    it('should handle non-object inputs', () => {
      expect(() => {
        validateTaskVariables(null);
      }).not.toThrow();

      expect(() => {
        validateTaskVariables(undefined);
      }).not.toThrow();

      expect(() => {
        validateTaskVariables('string');
      }).not.toThrow();
    });
  });
});
