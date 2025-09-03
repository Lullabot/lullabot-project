// Test helper utilities

/**
 * Create a sample configuration object for testing
 */
export const createSampleConfig = (overrides = {}) => ({
  project: {
    type: 'drupal',
    tool: 'cursor'
  },
  features: {
    taskPreferences: {
      'memory-bank': true,
      rules: true
    }
  },
  installation: {
    created: '2024-01-01T00:00:00.000Z',
    updated: '2024-01-01T00:00:00.000Z',
    toolVersion: '1.0.0'
  },
  files: [],
  packages: {},
  ...overrides
});

/**
 * Create a sample tool configuration for testing
 */
export const createSampleToolConfig = () => ({
  tools: {
    cursor: {
      name: 'Cursor',
      tasks: {
        'memory-bank': {
          name: 'Memory Bank',
          type: 'command',
          command: 'npx cursor-bank init'
        },
        rules: {
          name: 'Project Rules',
          type: 'copy-files',
          source: 'assets/rules/{tool}/{project-type}',
          target: '.{tool}/rules',
          'requires-project': true
        }
      }
    },
    claude: {
      name: 'Claude',
      tasks: {
        agents: {
          name: 'AGENTS.md',
          type: 'copy-files',
          source: 'assets/rules',
          target: './'
        }
      }
    }
  },
  projects: {
    drupal: {
      name: 'Drupal',
      validation: {
        requiredFiles: ['composer.json'],
        requiredContent: {
          'composer.json': 'drupal/core'
        }
      }
    }
  }
});

/**
 * Create a temporary directory path for testing
 */
export const createTempPath = (suffix = '') => `/tmp/lullabot-project-test-${Date.now()}${suffix}`;

/**
 * Create a mock package.json content
 */
export const createMockPackageJson = (version = '1.0.0') => JSON.stringify({
  name: 'lullabot-project',
  version,
  type: 'module'
});

/**
 * Create a mock composer.json content for Drupal projects
 */
export const createMockComposerJson = () => JSON.stringify({
  name: 'test/drupal-project',
  require: {
    'drupal/core': '^10.0'
  }
});

/**
 * Async test wrapper that handles cleanup
 */
export const withCleanup = (testFn) => async () => {
  const cleanup = [];

  try {
    await testFn({ cleanup });
  } finally {
    // Run cleanup functions
    for (const cleanupFn of cleanup) {
      try {
        await cleanupFn();
      } catch (error) {
        console.warn('Cleanup failed:', error);
      }
    }
  }
};

/**
 * Wait for a specified amount of time (for async testing)
 */
export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Assert that a mock function was called with specific arguments
 */
export const expectCalledWith = (mockFn, ...args) => {
  expect(mockFn).toHaveBeenCalledWith(...args);
};

/**
 * Assert that a mock function was called a specific number of times
 */
export const expectCalledTimes = (mockFn, times) => {
  expect(mockFn).toHaveBeenCalledTimes(times);
};
