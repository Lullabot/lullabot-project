import { jest } from '@jest/globals';

// Import the modules under test
const multiStepModule = await import('../../src/task-types/multi-step.js');
const validationModule = await import('../../src/validation.js');

// Mock dependencies
const mockDependencies = {
  sharedTasks: {
    'test-shared': {
      type: 'copy-files',
      source: 'assets/test/',
      target: '.',
      items: ['test.txt']
    }
  }
};

// Mock task types
const mockTaskTypes = {
  'copy-files': {
    execute: jest.fn().mockResolvedValue({
      output: 'Files copied successfully',
      files: ['test.txt']
    })
  },
  'package-install': {
    execute: jest.fn().mockResolvedValue({
      output: 'Package installed successfully',
      files: []
    })
  }
};

// Mock the task types module
const originalTaskTypes = (await import('../../src/task-types/index.js')).taskTypes;
Object.assign((await import('../../src/task-types/index.js')).taskTypes, mockTaskTypes);

describe('Multi-Step Task Type', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Restore original task types
    Object.assign((await import('../../src/task-types/index.js')).taskTypes, originalTaskTypes);
  });

  describe('execute', () => {
    it('should execute a multi-step task with inline task definitions', async () => {
      const task = {
        name: 'Test Multi-Step',
        type: 'multi-step',
        steps: [
          {
            'copy-step': {
              type: 'copy-files',
              source: 'assets/test/',
              target: '.',
              items: ['test.txt']
            }
          },
          {
            'install-step': {
              type: 'package-install',
              package: {
                name: 'test-package',
                type: 'npm'
              }
            }
          }
        ]
      };

      const result = await multiStepModule.execute(task, 'test-tool', 'test-project', false, mockDependencies);

      expect(result.output).toBe('Multi-step task completed successfully');
      expect(result.files).toEqual(['test.txt']);
      expect(result.stepResults).toHaveLength(2);
      expect(mockTaskTypes['copy-files'].execute).toHaveBeenCalledTimes(1);
      expect(mockTaskTypes['package-install'].execute).toHaveBeenCalledTimes(1);
    });

    it('should execute a multi-step task with shared task references', async () => {
      const task = {
        name: 'Test Multi-Step',
        type: 'multi-step',
        steps: [
          {
            'shared-step': '@shared_tasks.test-shared'
          }
        ]
      };

      const result = await multiStepModule.execute(task, 'test-tool', 'test-project', false, mockDependencies);

      expect(result.output).toBe('Multi-step task completed successfully');
      expect(result.files).toEqual(['test.txt']);
      expect(result.stepResults).toHaveLength(1);
      expect(mockTaskTypes['copy-files'].execute).toHaveBeenCalledTimes(1);
    });

    it('should handle empty steps array', async () => {
      const task = {
        name: 'Test Multi-Step',
        type: 'multi-step',
        steps: []
      };

      const result = await multiStepModule.execute(task, 'test-tool', 'test-project', false, mockDependencies);

      expect(result.output).toBe('No steps to execute');
      expect(result.files).toEqual([]);
      expect(result.stepResults).toEqual([]);
    });

    it('should handle undefined steps', async () => {
      const task = {
        name: 'Test Multi-Step',
        type: 'multi-step'
      };

      const result = await multiStepModule.execute(task, 'test-tool', 'test-project', false, mockDependencies);

      expect(result.output).toBe('No steps to execute');
      expect(result.files).toEqual([]);
      expect(result.stepResults).toEqual([]);
    });

    it('should fail fast by default when a step fails', async () => {
      const task = {
        name: 'Test Multi-Step',
        type: 'multi-step',
        steps: [
          {
            'failing-step': {
              type: 'package-install',
              package: {
                name: 'failing-package',
                type: 'npm'
              }
            }
          }
        ]
      };

      mockTaskTypes['package-install'].execute.mockRejectedValueOnce(
        new Error('Package installation failed')
      );

      await expect(multiStepModule.execute(task, 'test-tool', 'test-project', false, mockDependencies))
        .rejects.toThrow('Failed at step 1 (failing-step): Package installation failed');
    });

    it('should continue on error when fail-fast is false', async () => {
      const task = {
        name: 'Test Multi-Step',
        type: 'multi-step',
        'fail-fast': false,
        steps: [
          {
            'failing-step': {
              type: 'package-install',
              package: {
                name: 'failing-package',
                type: 'npm'
              }
            }
          },
          {
            'success-step': {
              type: 'copy-files',
              source: 'assets/test/',
              target: '.',
              items: ['test.txt']
            }
          }
        ]
      };

      // Reset mocks to ensure clean state
      mockTaskTypes['package-install'].execute.mockReset();
      mockTaskTypes['copy-files'].execute.mockReset();

      // Mock the first step to fail, second to succeed
      mockTaskTypes['package-install'].execute.mockRejectedValueOnce(
        new Error('Package installation failed')
      );
      mockTaskTypes['copy-files'].execute.mockResolvedValueOnce({
        output: 'Files copied successfully',
        files: ['test.txt']
      });

      await expect(multiStepModule.execute(task, 'test-tool', 'test-project', false, mockDependencies))
        .rejects.toThrow('Multi-step task completed with errors: Step failing-step: Package installation failed');

      // Verify both steps were executed
      expect(mockTaskTypes['package-install'].execute).toHaveBeenCalledTimes(1);
      expect(mockTaskTypes['copy-files'].execute).toHaveBeenCalledTimes(1);
    });

    it('should throw error when all steps fail and fail-fast is false', async () => {
      const task = {
        name: 'Test Multi-Step',
        type: 'multi-step',
        'fail-fast': false,
        steps: [
          {
            'failing-step-1': {
              type: 'package-install',
              package: {
                name: 'failing-package-1',
                type: 'npm'
              }
            }
          },
          {
            'failing-step-2': {
              type: 'package-install',
              package: {
                name: 'failing-package-2',
                type: 'npm'
              }
            }
          }
        ]
      };

      // Reset mocks to ensure clean state
      mockTaskTypes['package-install'].execute.mockReset();

      // Mock both steps to fail
      mockTaskTypes['package-install'].execute
        .mockRejectedValueOnce(new Error('Package installation failed 1'))
        .mockRejectedValueOnce(new Error('Package installation failed 2'));

      await expect(multiStepModule.execute(task, 'test-tool', 'test-project', false, mockDependencies))
        .rejects.toThrow('Multi-step task completed with errors: Step failing-step-1: Package installation failed 1; Step failing-step-2: Package installation failed 2');
    });

    it('should provide verbose output when verbose is true', async () => {
      const task = {
        name: 'Test Multi-Step',
        type: 'multi-step',
        steps: [
          {
            'copy-step': {
              type: 'copy-files',
              source: 'assets/test/',
              target: '.',
              items: ['test.txt']
            }
          }
        ]
      };

      // Reset mocks to ensure clean state
      mockTaskTypes['copy-files'].execute.mockReset();
      mockTaskTypes['copy-files'].execute.mockResolvedValueOnce({
        output: 'Files copied successfully',
        files: ['test.txt']
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await multiStepModule.execute(task, 'test-tool', 'test-project', true, mockDependencies);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🔧 Executing multi-step task: Test Multi-Step'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Step 1/1: copy-step'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Files copied successfully'));
      expect(result.output).toBe('Files copied successfully');
      expect(result.stepResults).toHaveLength(1);

      consoleSpy.mockRestore();
    });

    it('should aggregate files from all steps', async () => {
      const task = {
        name: 'Test Multi-Step',
        type: 'multi-step',
        steps: [
          {
            'copy-step-1': {
              type: 'copy-files',
              source: 'assets/test/',
              target: '.',
              items: ['test1.txt']
            }
          },
          {
            'copy-step-2': {
              type: 'copy-files',
              source: 'assets/test/',
              target: '.',
              items: ['test2.txt']
            }
          }
        ]
      };

      // Reset mocks to ensure clean state
      mockTaskTypes['copy-files'].execute.mockReset();

      // Mock both steps to return different files
      mockTaskTypes['copy-files'].execute
        .mockResolvedValueOnce({ output: 'Files copied', files: ['test1.txt'] })
        .mockResolvedValueOnce({ output: 'Files copied', files: ['test2.txt'] });

      const result = await multiStepModule.execute(task, 'test-tool', 'test-project', false, mockDependencies);

      expect(result.files).toEqual(['test1.txt', 'test2.txt']);
    });
  });

  describe('validateMultiStepTask', () => {
    it('should validate a valid multi-step task', () => {
      const task = {
        type: 'multi-step',
        steps: [
          {
            'test-step': {
              type: 'copy-files',
              source: 'assets/test/',
              target: '.'
            }
          }
        ]
      };

      expect(() => validationModule.validateMultiStepTask(task)).not.toThrow();
    });

    it('should validate a multi-step task with shared task reference', () => {
      const task = {
        type: 'multi-step',
        steps: [
          {
            'shared-step': '@shared_tasks.test-shared'
          }
        ]
      };

      expect(() => validationModule.validateMultiStepTask(task)).not.toThrow();
    });

    it('should validate a multi-step task with extends', () => {
      const task = {
        type: 'multi-step',
        steps: [
          {
            'extended-step': {
              extends: '@shared_tasks.test-shared',
              target: './custom'
            }
          }
        ]
      };

      expect(() => validationModule.validateMultiStepTask(task)).not.toThrow();
    });

    it('should validate fail-fast boolean', () => {
      const task = {
        type: 'multi-step',
        'fail-fast': false,
        steps: [
          {
            'test-step': {
              type: 'copy-files',
              source: 'assets/test/',
              target: '.'
            }
          }
        ]
      };

      expect(() => validationModule.validateMultiStepTask(task)).not.toThrow();
    });

    it('should throw error for missing steps', () => {
      const task = {
        type: 'multi-step'
      };

      expect(() => validationModule.validateMultiStepTask(task)).toThrow('Multi-step task must have a steps array');
    });

    it('should throw error for non-array steps', () => {
      const task = {
        type: 'multi-step',
        steps: 'not-an-array'
      };

      expect(() => validationModule.validateMultiStepTask(task)).toThrow('Multi-step task steps must be an array');
    });

    it('should throw error for step without exactly one key', () => {
      const task = {
        type: 'multi-step',
        steps: [
          {
            'step1': { type: 'copy-files' },
            'step2': { type: 'package-install' }
          }
        ]
      };

      expect(() => validationModule.validateMultiStepTask(task)).toThrow('Step 1 must have exactly one key (step name)');
    });

    it('should throw error for empty step name', () => {
      const task = {
        type: 'multi-step',
        steps: [
          {
            '': {
              type: 'copy-files'
            }
          }
        ]
      };

      expect(() => validationModule.validateMultiStepTask(task)).toThrow('Step 1 name must be a non-empty string');
    });

    it('should throw error for invalid shared task reference', () => {
      const task = {
        type: 'multi-step',
        steps: [
          {
            'invalid-step': 'invalid-reference'
          }
        ]
      };

      expect(() => validationModule.validateMultiStepTask(task)).toThrow('Step 1 (invalid-step): Invalid shared task reference format');
    });

    it('should throw error for step without type or extends', () => {
      const task = {
        type: 'multi-step',
        steps: [
          {
            'invalid-step': {
              source: 'assets/test/'
            }
          }
        ]
      };

      expect(() => validationModule.validateMultiStepTask(task)).toThrow('Step 1 (invalid-step): Must have a type or extends property');
    });

    it('should throw error for invalid fail-fast type', () => {
      const task = {
        type: 'multi-step',
        'fail-fast': 'not-a-boolean',
        steps: [
          {
            'test-step': {
              type: 'copy-files'
            }
          }
        ]
      };

      expect(() => validationModule.validateMultiStepTask(task)).toThrow('Multi-step task fail-fast must be a boolean');
    });
  });
});
