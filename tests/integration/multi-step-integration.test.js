import { jest } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';

// Import the modules under test
const multiStepModule = await import('../../src/task-types/multi-step.js');

// Mock task types with real implementations
const mockTaskTypes = {
  'copy-files': {
    execute: jest.fn().mockImplementation(async (task, _tool, _projectType, _verbose, _dependencies) => {
      // Simulate file copying
      const targetPath = task.target || '.';
      await fs.ensureDir(targetPath);

      if (task.items && Array.isArray(task.items)) {
        for (const item of task.items) {
          const filePath = path.join(targetPath, item);
          await fs.writeFile(filePath, 'test content');
        }
      }

      return {
        output: `Files copied to ${targetPath}`,
        files: task.items || []
      };
    })
  },
  'package-install': {
    execute: jest.fn().mockImplementation(async (task, _tool, _projectType, _verbose, _dependencies) => {
      return {
        output: `Package ${task.package.name} installed successfully`,
        files: []
      };
    })
  }
};

// Mock the task types module
const originalTaskTypes = (await import('../../src/task-types/index.js')).taskTypes;
Object.assign((await import('../../src/task-types/index.js')).taskTypes, mockTaskTypes);

describe('Multi-Step Integration Tests', () => {
  const testDir = path.join(process.cwd(), 'test-multi-step');
  const mockDependencies = {
    sharedTasks: {
      'test-shared': {
        type: 'copy-files',
        source: 'assets/test/',
        target: '.',
        items: ['shared.txt']
      }
    }
  };

  beforeEach(async () => {
    // Clean up test directory
    await fs.remove(testDir);
    await fs.ensureDir(testDir);
    process.chdir(testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    const originalDir = process.cwd();
    if (originalDir.includes('test-multi-step')) {
      process.chdir(path.dirname(originalDir));
    }
    await fs.remove(testDir);
  });

  afterAll(async () => {
    // Restore original task types
    Object.assign((await import('../../src/task-types/index.js')).taskTypes, originalTaskTypes);
  });

  describe('Real File Operations', () => {
    it('should execute multi-step task with real file operations', async () => {
      const task = {
        name: 'Integration Test Multi-Step',
        type: 'multi-step',
        steps: [
          {
            'create-config': {
              type: 'copy-files',
              target: 'config/',
              items: ['app.json', 'settings.json']
            }
          },
          {
            'create-docs': {
              type: 'copy-files',
              target: 'docs/',
              items: ['README.md']
            }
          }
        ]
      };

      const result = await multiStepModule.execute(task, 'test-tool', 'test-project', false, mockDependencies);

      expect(result.output).toBe('Multi-step task completed successfully');
      expect(result.files).toEqual(['app.json', 'settings.json', 'README.md']);
      expect(result.stepResults).toHaveLength(2);

      // Verify files were actually created
      expect(await fs.pathExists('config/app.json')).toBe(true);
      expect(await fs.pathExists('config/settings.json')).toBe(true);
      expect(await fs.pathExists('docs/README.md')).toBe(true);
    });

    it('should handle shared task references in multi-step', async () => {
      const task = {
        name: 'Shared Task Multi-Step',
        type: 'multi-step',
        steps: [
          {
            'shared-step': '@shared_tasks.test-shared'
          },
          {
            'additional-step': {
              type: 'copy-files',
              target: 'additional/',
              items: ['extra.txt']
            }
          }
        ]
      };

      const result = await multiStepModule.execute(task, 'test-tool', 'test-project', false, mockDependencies);

      expect(result.output).toBe('Multi-step task completed successfully');
      expect(result.files).toEqual(['shared.txt', 'extra.txt']);
      expect(result.stepResults).toHaveLength(2);

      // Verify files were created
      expect(await fs.pathExists('shared.txt')).toBe(true);
      expect(await fs.pathExists('additional/extra.txt')).toBe(true);
    });

    it('should handle mixed step types in multi-step', async () => {
      const task = {
        name: 'Mixed Types Multi-Step',
        type: 'multi-step',
        steps: [
          {
            'install-step': {
              type: 'package-install',
              package: {
                name: 'test-package',
                type: 'npm'
              }
            }
          },
          {
            'copy-step': {
              type: 'copy-files',
              target: 'files/',
              items: ['data.json']
            }
          }
        ]
      };

      const result = await multiStepModule.execute(task, 'test-tool', 'test-project', false, mockDependencies);

      expect(result.output).toBe('Multi-step task completed successfully');
      expect(result.files).toEqual(['data.json']);
      expect(result.stepResults).toHaveLength(2);

      // Verify file was created
      expect(await fs.pathExists('files/data.json')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle step failures gracefully with fail-fast', async () => {
      const task = {
        name: 'Fail Fast Test',
        type: 'multi-step',
        'fail-fast': true,
        steps: [
          {
            'success-step': {
              type: 'copy-files',
              target: 'success/',
              items: ['success.txt']
            }
          },
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

      // Mock the second step to fail
      const { taskTypes } = await import('../../src/task-types/index.js');
      taskTypes['package-install'].execute.mockRejectedValueOnce(
        new Error('Package installation failed')
      );

      await expect(multiStepModule.execute(task, 'test-tool', 'test-project', false, mockDependencies))
        .rejects.toThrow('Failed at step 2 (failing-step): Package installation failed');

      // Verify first step succeeded
      expect(await fs.pathExists('success/success.txt')).toBe(true);
    });

    it('should continue on error when fail-fast is false', async () => {
      const task = {
        name: 'Continue On Error Test',
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
              target: 'success/',
              items: ['success.txt']
            }
          }
        ]
      };

      // Mock the first step to fail
      const { taskTypes } = await import('../../src/task-types/index.js');
      taskTypes['package-install'].execute.mockRejectedValueOnce(
        new Error('Package installation failed')
      );

      await expect(multiStepModule.execute(task, 'test-tool', 'test-project', false, mockDependencies))
        .rejects.toThrow('Multi-step task completed with errors: Step failing-step: Package installation failed');

      // Verify second step succeeded
      expect(await fs.pathExists('success/success.txt')).toBe(true);
    });
  });

  describe('Variable Substitution', () => {
    it('should apply variable substitution in multi-step tasks', async () => {
      const task = {
        name: 'Variable Substitution Test',
        type: 'multi-step',
        steps: [
          {
            'tool-specific': {
              type: 'copy-files',
              target: '{tool}/',
              items: ['{project-type}.json']
            }
          }
        ]
      };

      const result = await multiStepModule.execute(task, 'cursor', 'development', false, mockDependencies);

      expect(result.output).toBe('Multi-step task completed successfully');
      expect(result.files).toEqual(['development.json']);
      expect(result.stepResults).toHaveLength(1);

      // Verify file was created with substituted values
      expect(await fs.pathExists('cursor/development.json')).toBe(true);
    });
  });

  describe('Complex Workflows', () => {
    it('should handle complex multi-step workflow', async () => {
      const task = {
        name: 'Complex Workflow Test',
        type: 'multi-step',
        'fail-fast': false,
        steps: [
          {
            'setup-config': {
              type: 'copy-files',
              target: 'config/',
              items: ['app.json', 'database.json']
            }
          },
          {
            'install-deps': {
              type: 'package-install',
              package: {
                name: 'project-deps',
                type: 'npm'
              }
            }
          },
          {
            'create-docs': {
              type: 'copy-files',
              target: 'docs/',
              items: ['README.md', 'API.md']
            }
          },
          {
            'setup-tests': {
              type: 'copy-files',
              target: 'tests/',
              items: ['test-setup.js']
            }
          }
        ]
      };

      const result = await multiStepModule.execute(task, 'test-tool', 'test-project', false, mockDependencies);

      expect(result.output).toBe('Multi-step task completed successfully');
      expect(result.files).toEqual([
        'app.json', 'database.json', 'README.md', 'API.md', 'test-setup.js'
      ]);
      expect(result.stepResults).toHaveLength(4);

      // Verify all files were created
      expect(await fs.pathExists('config/app.json')).toBe(true);
      expect(await fs.pathExists('config/database.json')).toBe(true);
      expect(await fs.pathExists('docs/README.md')).toBe(true);
      expect(await fs.pathExists('docs/API.md')).toBe(true);
      expect(await fs.pathExists('tests/test-setup.js')).toBe(true);
    });
  });
});
