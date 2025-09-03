// Sample configuration fixtures for testing

/**
 * Basic configuration with cursor and drupal
 */
export const basicConfig = {
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
  files: ['.cursor/rules/ai-prompts.md', '.cursor/rules/coding-standards.md'],
  packages: {
    'memory-bank': {
      name: 'cursor-bank',
      version: '1.0.0'
    }
  }
};

/**
 * Configuration with no project (tool-only setup)
 */
export const noProjectConfig = {
  project: {
    type: null,
    tool: 'claude'
  },
  features: {
    taskPreferences: {
      agents: true
    }
  },
  installation: {
    created: '2024-01-01T00:00:00.000Z',
    updated: '2024-01-01T00:00:00.000Z',
    toolVersion: '1.0.0'
  },
  files: [],
  packages: {}
};

/**
 * Configuration with updated version
 */
export const updatedVersionConfig = {
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
    updated: '2024-01-02T00:00:00.000Z',
    toolVersion: '1.1.0'
  },
  files: ['.cursor/rules/ai-prompts.md'],
  packages: {}
};

/**
 * Legacy configuration format (for backward compatibility testing)
 */
export const legacyConfig = {
  tool: 'cursor',
  project: 'drupal',
  taskPreferences: {
    'memory-bank': true,
    rules: true
  },
  created: '2024-01-01T00:00:00.000Z',
  updated: '2024-01-01T00:00:00.000Z',
  toolVersion: '1.0.0'
};

/**
 * Empty/minimal configuration
 */
export const emptyConfig = {
  project: {
    type: null,
    tool: null
  },
  features: {
    taskPreferences: {}
  },
  installation: {
    created: '2024-01-01T00:00:00.000Z',
    updated: '2024-01-01T00:00:00.000Z',
    toolVersion: '1.0.0'
  },
  files: [],
  packages: {}
};
