import { getTasks, validateTaskProjects } from '../../src/tool-config.js';

describe('Project-Specific Task Filtering', () => {
  const mockConfig = {
    tools: {
      testTool: {
        tasks: {
          universalTask: {
            name: 'Universal Task',
            type: 'copy-files',
            source: 'assets/universal/',
            target: '.universal/',
            required: false,
            prompt: 'Universal task prompt'
          },
          developmentTask: {
            name: 'Development Task',
            type: 'copy-files',
            projects: ['development'],
            source: 'assets/dev/',
            target: '.dev/',
            required: false,
            prompt: 'Development task prompt'
          },
          multiProjectTask: {
            name: 'Multi-Project Task',
            type: 'copy-files',
            projects: ['development', 'quality-assurance'],
            source: 'assets/multi/',
            target: '.multi/',
            required: false,
            prompt: 'Multi-project task prompt'
          },
          disabledTask: {
            name: 'Disabled Task',
            type: 'copy-files',
            projects: [],
            source: 'assets/disabled/',
            target: '.disabled/',
            required: false,
            prompt: 'This should never appear'
          },
          requiresProjectTask: {
            name: 'Requires Project Task',
            type: 'copy-files',
            'requires-project': true,
            source: 'assets/requires/',
            target: '.requires/',
            required: false,
            prompt: 'Requires project task prompt'
          }
        }
      }
    },
    projects: {
      development: {
        name: 'Development'
      },
      'quality-assurance': {
        name: 'Quality Assurance'
      },
      design: {
        name: 'Design'
      }
    }
  };

  describe('getTasks', () => {
    it('should return all tasks when no project is selected and tasks have no projects restriction', () => {
      const tasks = getTasks('testTool', null, mockConfig);

      expect(tasks).toHaveProperty('universalTask');
      expect(tasks).not.toHaveProperty('requiresProjectTask'); // requires-project: true
      expect(tasks).not.toHaveProperty('developmentTask');
      expect(tasks).not.toHaveProperty('multiProjectTask');
      expect(tasks).not.toHaveProperty('disabledTask');
    });

    it('should return only matching tasks when development project is selected', () => {
      const tasks = getTasks('testTool', 'development', mockConfig);

      expect(tasks).toHaveProperty('universalTask');
      expect(tasks).toHaveProperty('developmentTask');
      expect(tasks).toHaveProperty('multiProjectTask');
      expect(tasks).toHaveProperty('requiresProjectTask');
      expect(tasks).not.toHaveProperty('disabledTask');
    });

    it('should return only matching tasks when quality-assurance project is selected', () => {
      const tasks = getTasks('testTool', 'quality-assurance', mockConfig);

      expect(tasks).toHaveProperty('universalTask');
      expect(tasks).not.toHaveProperty('developmentTask');
      expect(tasks).toHaveProperty('multiProjectTask');
      expect(tasks).toHaveProperty('requiresProjectTask');
      expect(tasks).not.toHaveProperty('disabledTask');
    });

    it('should return only universal tasks when design project is selected', () => {
      const tasks = getTasks('testTool', 'design', mockConfig);

      expect(tasks).toHaveProperty('universalTask');
      expect(tasks).not.toHaveProperty('developmentTask');
      expect(tasks).not.toHaveProperty('multiProjectTask');
      expect(tasks).toHaveProperty('requiresProjectTask');
      expect(tasks).not.toHaveProperty('disabledTask');
    });

    it('should not return tasks with requires-project when no project is selected', () => {
      const tasks = getTasks('testTool', null, mockConfig);

      expect(tasks).toHaveProperty('universalTask');
      expect(tasks).not.toHaveProperty('requiresProjectTask');
    });

    it('should return tasks with requires-project when project is selected', () => {
      const tasks = getTasks('testTool', 'development', mockConfig);

      expect(tasks).toHaveProperty('requiresProjectTask');
    });

    it('should throw error for non-existent tool', () => {
      expect(() => {
        getTasks('nonExistentTool', 'development', mockConfig);
      }).toThrow('Tool configuration not found for: nonExistentTool');
    });

    it('should handle tool with no tasks', () => {
      const configWithNoTasks = {
        tools: {
          emptyTool: {}
        },
        projects: {}
      };

      const tasks = getTasks('emptyTool', 'development', configWithNoTasks);
      expect(tasks).toEqual({});
    });

    it('should handle tool with no tasks property', () => {
      const configWithNoTasksProperty = {
        tools: {
          noTasksTool: {
            name: 'No Tasks Tool'
          }
        },
        projects: {}
      };

      const tasks = getTasks('noTasksTool', 'development', configWithNoTasksProperty);
      expect(tasks).toEqual({});
    });
  });

  describe('validateTaskProjects', () => {
    it('should not throw error for task without projects array', () => {
      const task = {
        name: 'Test Task',
        type: 'copy-files'
      };

      expect(() => {
        validateTaskProjects(task, 'testTask', mockConfig);
      }).not.toThrow();
    });

    it('should not throw error for task with valid projects array', () => {
      const task = {
        name: 'Test Task',
        type: 'copy-files',
        projects: ['development', 'quality-assurance']
      };

      expect(() => {
        validateTaskProjects(task, 'testTask', mockConfig);
      }).not.toThrow();
    });

    it('should not throw error for task with empty projects array', () => {
      const task = {
        name: 'Test Task',
        type: 'copy-files',
        projects: []
      };

      expect(() => {
        validateTaskProjects(task, 'testTask', mockConfig);
      }).not.toThrow();
    });

    it('should throw error for task with invalid project types', () => {
      const task = {
        name: 'Test Task',
        type: 'copy-files',
        projects: ['development', 'invalid-project', 'another-invalid']
      };

      expect(() => {
        validateTaskProjects(task, 'testTask', mockConfig);
      }).toThrow('Task \'testTask\' references invalid project types: invalid-project, another-invalid. Available project types: development, quality-assurance, design');
    });

    it('should throw error for task with single invalid project type', () => {
      const task = {
        name: 'Test Task',
        type: 'copy-files',
        projects: ['invalid-project']
      };

      expect(() => {
        validateTaskProjects(task, 'testTask', mockConfig);
      }).toThrow('Task \'testTask\' references invalid project types: invalid-project. Available project types: development, quality-assurance, design');
    });

    it('should handle config with no projects', () => {
      const configWithNoProjects = {
        tools: {},
        projects: {}
      };

      const task = {
        name: 'Test Task',
        type: 'copy-files',
        projects: ['development']
      };

      expect(() => {
        validateTaskProjects(task, 'testTask', configWithNoProjects);
      }).toThrow('Task \'testTask\' references invalid project types: development. Available project types: ');
    });

    it('should handle task with non-array projects property', () => {
      const task = {
        name: 'Test Task',
        type: 'copy-files',
        projects: 'not-an-array'
      };

      expect(() => {
        validateTaskProjects(task, 'testTask', mockConfig);
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle task with projects array containing duplicates', () => {
      const task = {
        name: 'Test Task',
        type: 'copy-files',
        projects: ['development', 'development', 'quality-assurance']
      };

      expect(() => {
        validateTaskProjects(task, 'testTask', mockConfig);
      }).not.toThrow();
    });

    it('should handle case sensitivity in project names', () => {
      const task = {
        name: 'Test Task',
        type: 'copy-files',
        projects: ['Development'] // Capital D
      };

      expect(() => {
        validateTaskProjects(task, 'testTask', mockConfig);
      }).toThrow('Task \'testTask\' references invalid project types: Development. Available project types: development, quality-assurance, design');
    });

    it('should handle task with mixed valid and invalid projects', () => {
      const task = {
        name: 'Test Task',
        type: 'copy-files',
        projects: ['development', 'invalid-project', 'quality-assurance']
      };

      expect(() => {
        validateTaskProjects(task, 'testTask', mockConfig);
      }).toThrow('Task \'testTask\' references invalid project types: invalid-project. Available project types: development, quality-assurance, design');
    });
  });

  describe('Integration with existing functionality', () => {
    it('should work with requires-project flag and projects array', () => {
      const configWithBothFlags = {
        tools: {
          testTool: {
            tasks: {
              complexTask: {
                name: 'Complex Task',
                type: 'copy-files',
                'requires-project': true,
                projects: ['development'],
                source: 'assets/complex/',
                target: '.complex/',
                required: false,
                prompt: 'Complex task prompt'
              }
            }
          }
        },
        projects: {
          development: { name: 'Development' }
        }
      };

      // Should not appear when no project is selected
      const tasksNoProject = getTasks('testTool', null, configWithBothFlags);
      expect(tasksNoProject).not.toHaveProperty('complexTask');

      // Should appear when development project is selected
      const tasksWithProject = getTasks('testTool', 'development', configWithBothFlags);
      expect(tasksWithProject).toHaveProperty('complexTask');

      // Should not appear when different project is selected
      const tasksWithDifferentProject = getTasks('testTool', 'quality-assurance', configWithBothFlags);
      expect(tasksWithDifferentProject).not.toHaveProperty('complexTask');
    });

    it('should preserve task metadata when filtering', () => {
      const tasks = getTasks('testTool', 'development', mockConfig);

      expect(tasks.developmentTask).toHaveProperty('id', 'developmentTask');
      expect(tasks.developmentTask).toHaveProperty('taskSource', 'tool');
      expect(tasks.developmentTask).toHaveProperty('name', 'Development Task');
      expect(tasks.developmentTask).toHaveProperty('projects', ['development']);
    });
  });
});
