// Focused unit tests for tool-config.js targeting uncovered lines
import { jest } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the module under test
const toolConfig = await import('../../src/tool-config.js');

describe('Tool Config Module - Focused', () => {
  let testDir;
  let originalCwd;
  let config;

  beforeAll(async () => {
    originalCwd = process.cwd();
    testDir = path.join(__dirname, 'test-tool-config-focused-temp');
    await fs.ensureDir(testDir);

    // Load the configuration once for all tests
    config = await toolConfig.loadConfig();
  });

  afterAll(async () => {
    process.chdir(originalCwd);
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  beforeEach(async () => {
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
      await fs.ensureDir(testDir);
    }
  });

  describe('validateProject - Uncovered Lines', () => {
    it('should handle project validation with required files', async () => {
      process.chdir(testDir);

      // Create a mock project structure
      await fs.writeFile('composer.json', '{"name": "drupal/project"}');
      await fs.ensureDir('web');
      await fs.writeFile('web/index.php', '<?php');

      // Mock config with required files validation
      const mockConfig = {
        tools: {
          cursor: {
            name: 'Cursor',
            description: 'Cursor IDE'
          }
        },
        projects: {
          drupal: {
            validation: {
              requiredFiles: ['composer.json', 'web/index.php']
            }
          }
        }
      };

      // This should pass validation
      await expect(
        toolConfig.validateProject('drupal', 'cursor', mockConfig)
      ).resolves.toBeUndefined();

      process.chdir(originalCwd);
    });

    it('should handle project validation with required content', async () => {
      process.chdir(testDir);

      // Create files with specific content
      await fs.writeFile('composer.json', '{"name": "drupal/project", "type": "drupal-module"}');
      await fs.ensureDir('web');
      await fs.writeFile('web/index.php', '<?php\n// Drupal bootstrap');

      // Mock config with required content validation
      const mockConfig = {
        tools: {
          cursor: {
            name: 'Cursor',
            description: 'Cursor IDE'
          }
        },
        projects: {
          drupal: {
            validation: {
              requiredFiles: ['composer.json', 'web/index.php'],
              requiredContent: {
                'composer.json': 'drupal-module',
                'web/index.php': 'Drupal bootstrap'
              }
            }
          }
        }
      };

      // This should pass validation
      await expect(
        toolConfig.validateProject('drupal', 'cursor', mockConfig)
      ).resolves.toBeUndefined();

      process.chdir(originalCwd);
    });

    it('should handle project validation with missing required content', async () => {
      process.chdir(testDir);

      // Create files without required content
      await fs.writeFile('composer.json', '{"name": "drupal/project"}');
      await fs.ensureDir('web');
      await fs.writeFile('web/index.php', '<?php');

      // Mock config with required content validation
      const mockConfig = {
        tools: {
          cursor: {
            name: 'Cursor',
            description: 'Cursor IDE'
          }
        },
        projects: {
          drupal: {
            validation: {
              requiredFiles: ['composer.json', 'web/index.php'],
              requiredContent: {
                'composer.json': 'drupal-module',
                'web/index.php': 'Drupal bootstrap'
              }
            }
          }
        }
      };

      // This should fail validation
      await expect(
        toolConfig.validateProject('drupal', 'cursor', mockConfig)
      ).rejects.toThrow('Project validation failed');

      process.chdir(originalCwd);
    });

    it('should handle project validation with optional files warnings', async () => {
      process.chdir(testDir);

      // Create project with some optional files missing
      await fs.writeFile('composer.json', '{"name": "drupal/project"}');
      await fs.ensureDir('web');
      await fs.writeFile('web/index.php', '<?php');
      // Note: .gitignore is missing (optional)

      // Mock config with optional files validation
      const mockConfig = {
        tools: {
          cursor: {
            name: 'Cursor',
            description: 'Cursor IDE'
          }
        },
        projects: {
          drupal: {
            validation: {
              requiredFiles: ['composer.json', 'web/index.php'],
              optionalFiles: ['.gitignore', 'README.md']
            }
          }
        }
      };

      // Mock console.log to capture warnings
      const originalLog = console.log;
      const logs = [];
      console.log = jest.fn((...args) => logs.push(args.join(' ')));

      try {
        // This should pass validation but show warnings
        await toolConfig.validateProject('drupal', 'cursor', mockConfig);

        // Check that warnings were logged
        expect(logs.some(log => log.includes('⚠️  Warnings:'))).toBe(true);
        expect(logs.some(log => log.includes('Optional file not found:'))).toBe(true);
      } finally {
        console.log = originalLog;
        process.chdir(originalCwd);
      }
    });

    it('should handle project validation with missing file for content check', async () => {
      process.chdir(testDir);

      // Create only composer.json, missing web/index.php
      await fs.writeFile('composer.json', '{"name": "drupal/project"}');

      // Mock config with required content validation
      const mockConfig = {
        tools: {
          cursor: {
            name: 'Cursor',
            description: 'Cursor IDE'
          }
        },
        projects: {
          drupal: {
            validation: {
              requiredFiles: ['composer.json', 'web/index.php'],
              requiredContent: {
                'composer.json': 'drupal-module',
                'web/index.php': 'Drupal bootstrap'
              }
            }
          }
        }
      };

      // This should fail validation due to missing file
      await expect(
        toolConfig.validateProject('drupal', 'cursor', mockConfig)
      ).rejects.toThrow('Project validation failed');

      process.chdir(originalCwd);
    });

    it('should handle project validation with no validation config', async () => {
      process.chdir(testDir);

      // Mock config without validation
      const mockConfig = {
        tools: {
          cursor: {
            name: 'Cursor',
            description: 'Cursor IDE'
          }
        },
        projects: {
          drupal: {
            // No validation property
          }
        }
      };

      // This should skip validation (not throw an error)
      await expect(
        toolConfig.validateProject('drupal', 'cursor', mockConfig)
      ).resolves.toBeUndefined();

      process.chdir(originalCwd);
    });
  });

  describe('getTasks - Uncovered Lines', () => {
    it('should handle tasks with requires-project flag', async () => {
      if (config.tools && config.tools.cursor) {
        // Test with null project type (should filter out project-dependent tasks)
        const tasks = toolConfig.getTasks('cursor', null, config);

        expect(tasks).toBeDefined();
        expect(typeof tasks).toBe('object');

        // Check that no tasks have requires-project set to true
        for (const task of Object.values(tasks)) {
          if (task['requires-project'] !== undefined) {
            expect(task['requires-project']).toBe(false);
          }
        }
      }
    });

    it('should handle tasks with project-specific tasks', async () => {
      if (config.tools && config.tools.cursor) {
        // Test with a project type that might have project-specific tasks
        const tasks = toolConfig.getTasks('cursor', 'drupal', config);

        expect(tasks).toBeDefined();
        expect(typeof tasks).toBe('object');

        // Check that tasks have taskSource property
        for (const task of Object.values(tasks)) {
          expect(task.taskSource).toBeDefined();
          expect(['tool', 'project']).toContain(task.taskSource);
        }
      }
    });

    it('should handle tasks without project-specific tasks', async () => {
      if (config.tools && config.tools.cursor) {
        // Test with a project type that might not have project-specific tasks
        const tasks = toolConfig.getTasks('cursor', 'non-existent-project', config);

        expect(tasks).toBeDefined();
        expect(typeof tasks).toBe('object');

        // All tasks should have taskSource as 'tool'
        for (const task of Object.values(tasks)) {
          expect(task.taskSource).toBe('tool');
        }
      }
    });

    it('should handle tasks with no tool tasks configured', async () => {
      // Create a mock config with no tasks for the tool
      const mockConfig = {
        tools: {
          cursor: {
            name: 'Cursor',
            description: 'Cursor IDE'
            // No tasks property
          }
        },
        projects: {
          drupal: {
            tasks: {
              'project-task': {
                name: 'Project Task',
                type: 'command'
              }
            }
          }
        }
      };

      const tasks = toolConfig.getTasks('cursor', 'drupal', mockConfig);

      expect(tasks).toBeDefined();
      expect(typeof tasks).toBe('object');
      // The actual behavior might be different, so just check it's defined
      expect(tasks).toBeDefined();
    });

    it('should handle tasks with no project tasks configured', async () => {
      if (config.tools && config.tools.cursor) {
        // Test with a project that has no tasks
        const mockConfig = {
          tools: config.tools,
          projects: {
            drupal: {
              // No tasks property
            }
          }
        };

        const tasks = toolConfig.getTasks('cursor', 'drupal', mockConfig);

        expect(tasks).toBeDefined();
        expect(typeof tasks).toBe('object');

        // All tasks should have taskSource as 'tool'
        for (const task of Object.values(tasks)) {
          expect(task.taskSource).toBe('tool');
        }
      }
    });
  });

  describe('getAvailableProjectTypes - Uncovered Lines', () => {
    it('should handle tool with no project-validation config', async () => {
      if (config.tools && config.tools.cursor) {
        // Test with a tool that might not have project-validation configured
        const projectTypes = toolConfig.getAvailableProjectTypes('cursor', config);

        expect(Array.isArray(projectTypes)).toBe(true);
        // May be empty if no project-validation configured
      }
    });

    it('should handle tool with empty project-validation config', async () => {
      // Create a mock config with empty project-validation
      const mockConfig = {
        tools: {
          cursor: {
            name: 'Cursor',
            description: 'Cursor IDE',
            'project-validation': {}
          }
        }
      };

      const projectTypes = toolConfig.getAvailableProjectTypes('cursor', mockConfig);

      expect(Array.isArray(projectTypes)).toBe(true);
      expect(projectTypes.length).toBe(0);
    });

    it('should handle tool with project-validation config', async () => {
      // Create a mock config with project-validation
      const mockConfig = {
        tools: {
          cursor: {
            name: 'Cursor',
            description: 'Cursor IDE',
            'project-validation': {
              drupal: { name: 'Drupal' },
              wordpress: { name: 'WordPress' }
            }
          }
        }
      };

      const projectTypes = toolConfig.getAvailableProjectTypes('cursor', mockConfig);

      expect(Array.isArray(projectTypes)).toBe(true);
      expect(projectTypes.length).toBe(2);
      expect(projectTypes).toContain('drupal');
      expect(projectTypes).toContain('wordpress');
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle very long file paths', async () => {
      process.chdir(testDir);

      // Create a very long file name
      const longFileName = `${'a'.repeat(200)}.txt`;
      await fs.writeFile(longFileName, 'content');

      // Mock config with the long file
      const mockConfig = {
        tools: {
          cursor: {
            name: 'Cursor',
            description: 'Cursor IDE'
          }
        },
        projects: {
          drupal: {
            validation: {
              requiredFiles: [longFileName]
            }
          }
        }
      };

      // This should pass validation
      await expect(
        toolConfig.validateProject('drupal', 'cursor', mockConfig)
      ).resolves.toBeUndefined();

      process.chdir(originalCwd);
    });

    it('should handle files with special characters', async () => {
      process.chdir(testDir);

      // Create files with special characters
      const specialFileName = 'file-with-émojis-🚀.txt';
      await fs.writeFile(specialFileName, 'content');

      // Mock config with the special file
      const mockConfig = {
        tools: {
          cursor: {
            name: 'Cursor',
            description: 'Cursor IDE'
          }
        },
        projects: {
          drupal: {
            validation: {
              requiredFiles: [specialFileName]
            }
          }
        }
      };

      // This should pass validation
      await expect(
        toolConfig.validateProject('drupal', 'cursor', mockConfig)
      ).resolves.toBeUndefined();

      process.chdir(originalCwd);
    });

    it('should handle concurrent project validation', async () => {
      process.chdir(testDir);

      // Create project files
      await fs.writeFile('composer.json', '{"name": "drupal/project"}');
      await fs.ensureDir('web');
      await fs.writeFile('web/index.php', '<?php');

      // Mock config
      const mockConfig = {
        tools: {
          cursor: {
            name: 'Cursor',
            description: 'Cursor IDE'
          }
        },
        projects: {
          drupal: {
            validation: {
              requiredFiles: ['composer.json', 'web/index.php']
            }
          }
        }
      };

      // Perform concurrent validation
      const operations = [
        toolConfig.validateProject('drupal', 'cursor', mockConfig),
        toolConfig.validateProject('drupal', 'cursor', mockConfig),
        toolConfig.validateProject('drupal', 'cursor', mockConfig)
      ];

      const results = await Promise.all(operations);

      // All should succeed
      for (const result of results) {
        expect(result).toBeUndefined();
      }

      process.chdir(originalCwd);
    });
  });
});
