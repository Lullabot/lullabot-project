import {
  validateSharedTasks,
  validateSharedTaskReference,
  validateExtendsSyntax,
  validateSharedTaskReferences
} from '../../src/validation.js';

describe('Shared Tasks Validation', () => {
  const mockConfig = {
    shared_tasks: {
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
    },
    tools: {
      claude: {
        name: 'Claude Code',
        tasks: {
          rules: '@shared_tasks.rules',
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
          'agents-md': '@shared_tasks.agents-md'
        }
      }
    },
    projects: {
      development: {
        name: 'Development',
        tasks: {
          custom: '@shared_tasks.rules'
        }
      }
    }
  };

  describe('validateSharedTasks', () => {
    it('should validate a valid shared_tasks configuration', () => {
      expect(() => {
        validateSharedTasks(mockConfig);
      }).not.toThrow();
    });

    it('should throw error when shared_tasks section is missing', () => {
      const configWithoutSharedTasks = { ...mockConfig };
      delete configWithoutSharedTasks.shared_tasks;

      expect(() => {
        validateSharedTasks(configWithoutSharedTasks);
      }).toThrow('shared_tasks section is required in configuration');
    });

    it('should throw error when shared_tasks is not an object', () => {
      const configWithInvalidSharedTasks = {
        ...mockConfig,
        shared_tasks: 'not an object'
      };

      expect(() => {
        validateSharedTasks(configWithInvalidSharedTasks);
      }).toThrow('shared_tasks must be an object');
    });

    it('should throw error when shared task is not an object', () => {
      const configWithInvalidTask = {
        ...mockConfig,
        shared_tasks: {
          rules: 'not an object'
        }
      };

      expect(() => {
        validateSharedTasks(configWithInvalidTask);
      }).toThrow("Shared task 'rules' must be an object");
    });

    it('should validate shared task configuration using validateTaskConfigWithLinks', () => {
      const configWithInvalidTaskConfig = {
        ...mockConfig,
        shared_tasks: {
          rules: {
            name: 'Project Rules',
            type: 'remote-copy-files',
            link: 'invalid-url' // Invalid URL
          }
        }
      };

      expect(() => {
        validateSharedTasks(configWithInvalidTaskConfig);
      }).toThrow('Invalid link URL in remote-copy-files task: must be a valid HTTP/HTTPS URL');
    });
  });

  describe('validateSharedTaskReference', () => {
    it('should validate a correct reference format', () => {
      expect(validateSharedTaskReference('@shared_tasks.rules')).toBe(true);
      expect(validateSharedTaskReference('@shared_tasks.agents-md')).toBe(true);
      expect(validateSharedTaskReference('@shared_tasks.task_123')).toBe(true);
      expect(validateSharedTaskReference('@shared_tasks.task-123')).toBe(true);
    });

    it('should reject invalid reference formats', () => {
      expect(validateSharedTaskReference('@shared_tasks.')).toBe(false);
      expect(validateSharedTaskReference('@shared_tasks')).toBe(false);
      expect(validateSharedTaskReference('shared_tasks.rules')).toBe(false);
      expect(validateSharedTaskReference('@shared_tasks.rules.extra')).toBe(false);
      expect(validateSharedTaskReference('@shared_tasks.123start')).toBe(false);
      expect(validateSharedTaskReference('@shared_tasks.task with spaces')).toBe(false);
      expect(validateSharedTaskReference('@shared_tasks.task@special')).toBe(false);
    });

    it('should reject non-string inputs', () => {
      expect(validateSharedTaskReference(123)).toBe(false);
      expect(validateSharedTaskReference({})).toBe(false);
      expect(validateSharedTaskReference(null)).toBe(false);
      expect(validateSharedTaskReference(undefined)).toBe(false);
    });
  });

  describe('validateExtendsSyntax', () => {
    it('should validate a correct extends format', () => {
      expect(validateExtendsSyntax('@shared_tasks.rules')).toBe(true);
      expect(validateExtendsSyntax('@shared_tasks.agents-md')).toBe(true);
      expect(validateExtendsSyntax('@shared_tasks.task_123')).toBe(true);
      expect(validateExtendsSyntax('@shared_tasks.task-123')).toBe(true);
    });

    it('should reject invalid extends formats', () => {
      expect(validateExtendsSyntax('@shared_tasks.')).toBe(false);
      expect(validateExtendsSyntax('@shared_tasks')).toBe(false);
      expect(validateExtendsSyntax('shared_tasks.rules')).toBe(false);
      expect(validateExtendsSyntax('@shared_tasks.rules.extra')).toBe(false);
      expect(validateExtendsSyntax('@shared_tasks.123start')).toBe(false);
      expect(validateExtendsSyntax('@shared_tasks.task with spaces')).toBe(false);
      expect(validateExtendsSyntax('@shared_tasks.task@special')).toBe(false);
    });

    it('should reject non-string inputs', () => {
      expect(validateExtendsSyntax(123)).toBe(false);
      expect(validateExtendsSyntax({})).toBe(false);
      expect(validateExtendsSyntax(null)).toBe(false);
      expect(validateExtendsSyntax(undefined)).toBe(false);
    });
  });

  describe('validateSharedTaskReferences', () => {
    it('should validate all references in a valid configuration', () => {
      expect(() => {
        validateSharedTaskReferences(mockConfig);
      }).not.toThrow();
    });

    it('should handle configuration without shared_tasks', () => {
      const configWithoutSharedTasks = { ...mockConfig };
      delete configWithoutSharedTasks.shared_tasks;

      expect(() => {
        validateSharedTaskReferences(configWithoutSharedTasks);
      }).not.toThrow();
    });

    it('should throw error for invalid reference syntax in tool tasks', () => {
      const configWithInvalidReference = {
        ...mockConfig,
        tools: {
          claude: {
            name: 'Claude Code',
            tasks: {
              rules: '@shared_tasks.' // Invalid syntax
            }
          }
        }
      };

      expect(() => {
        validateSharedTaskReferences(configWithInvalidReference);
      }).toThrow("Invalid shared task reference in tool 'claude', task 'rules': @shared_tasks.");
    });

    it('should throw error for non-existent reference in tool tasks', () => {
      const configWithNonExistentReference = {
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
        validateSharedTaskReferences(configWithNonExistentReference);
      }).toThrow("Shared task reference not found in tool 'claude', task 'rules': @shared_tasks.nonexistent");
    });

    it('should throw error for invalid extends syntax in tool tasks', () => {
      const configWithInvalidExtends = {
        ...mockConfig,
        tools: {
          claude: {
            name: 'Claude Code',
            tasks: {
              'agents-md': {
                extends: '@shared_tasks.' // Invalid syntax
              }
            }
          }
        }
      };

      expect(() => {
        validateSharedTaskReferences(configWithInvalidExtends);
      }).toThrow("Invalid extends syntax in tool 'claude', task 'agents-md': @shared_tasks.");
    });

    it('should throw error for non-existent extends reference in tool tasks', () => {
      const configWithNonExistentExtends = {
        ...mockConfig,
        tools: {
          claude: {
            name: 'Claude Code',
            tasks: {
              'agents-md': {
                extends: '@shared_tasks.nonexistent'
              }
            }
          }
        }
      };

      expect(() => {
        validateSharedTaskReferences(configWithNonExistentExtends);
      }).toThrow("Extends reference not found in tool 'claude', task 'agents-md': @shared_tasks.nonexistent");
    });

    it('should validate references in project tasks', () => {
      expect(() => {
        validateSharedTaskReferences(mockConfig);
      }).not.toThrow();
    });

    it('should throw error for invalid reference in project tasks', () => {
      const configWithInvalidProjectReference = {
        ...mockConfig,
        projects: {
          development: {
            name: 'Development',
            tasks: {
              custom: '@shared_tasks.nonexistent'
            }
          }
        }
      };

      expect(() => {
        validateSharedTaskReferences(configWithInvalidProjectReference);
      }).toThrow("Shared task reference not found in project 'development', task 'custom': @shared_tasks.nonexistent");
    });

    it('should handle tools without tasks', () => {
      const configWithoutTasks = {
        ...mockConfig,
        tools: {
          claude: {
            name: 'Claude Code'
            // No tasks property
          }
        }
      };

      expect(() => {
        validateSharedTaskReferences(configWithoutTasks);
      }).not.toThrow();
    });

    it('should handle projects without tasks', () => {
      const configWithoutProjectTasks = {
        ...mockConfig,
        projects: {
          development: {
            name: 'Development'
            // No tasks property
          }
        }
      };

      expect(() => {
        validateSharedTaskReferences(configWithoutProjectTasks);
      }).not.toThrow();
    });
  });
});
