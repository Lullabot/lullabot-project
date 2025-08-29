const fs = require('fs-extra');
const path = require('path');

/**
 * Create a temporary test directory
 */
async function createTempDir () {
  const tempDir = path.join(__dirname, 'temp', `test-${Date.now()}`);
  await fs.ensureDir(tempDir);
  return tempDir;
}

/**
 * Clean up temporary test directory
 */
async function cleanupTempDir (tempDir) {
  if (tempDir && await fs.pathExists(tempDir)) {
    await fs.remove(tempDir);
  }
}

/**
 * Create a mock project structure
 */
async function createMockProject (tempDir, projectType = 'drupal') {
  const projectFiles = {
    drupal: {
      'composer.json': JSON.stringify({
        require: {
          'drupal/core': '^10.0'
        }
      }),
      '.git': '',
      'README.md': '# Test Drupal Project'
    },
    react: {
      'package.json': JSON.stringify({
        dependencies: {
          'react': '^18.0.0'
        }
      }),
      '.git': '',
      'README.md': '# Test React Project'
    }
  };

  const files = projectFiles[projectType] || projectFiles.drupal;

  for (const [filename, content] of Object.entries(files)) {
    const filePath = path.join(tempDir, filename);
    if (filename === '.git') {
      await fs.ensureDir(filePath);
    } else {
      await fs.writeFile(filePath, content);
    }
  }

  return tempDir;
}

/**
 * Mock inquirer responses
 */
function mockInquirerResponses (responses) {
  const inquirer = require('inquirer');
  inquirer.prompt = jest.fn().mockResolvedValue(responses);
}

/**
 * Mock file system operations
 */
function mockFsOperations () {
  const fsExtra = require('fs-extra');

  // Mock pathExists to return true by default
  fsExtra.pathExists = jest.fn().mockResolvedValue(true);

  // Mock readFile to return empty content by default
  fsExtra.readFile = jest.fn().mockResolvedValue('');

  // Mock writeFile to do nothing
  fsExtra.writeFile = jest.fn().mockResolvedValue();

  // Mock ensureDir to do nothing
  fsExtra.ensureDir = jest.fn().mockResolvedValue();

  // Mock copy to do nothing
  fsExtra.copy = jest.fn().mockResolvedValue();

  // Mock readdir to return empty array by default
  fsExtra.readdir = jest.fn().mockResolvedValue([]);

  return fsExtra;
}

/**
 * Mock child_process.execSync
 */
function mockExecSync () {
  const { execSync } = require('child_process');
  execSync.mockReturnValue('1.0.1');
}

/**
 * Reset all mocks
 */
function resetMocks () {
  jest.clearAllMocks();
}

module.exports = {
  createTempDir,
  cleanupTempDir,
  createMockProject,
  mockInquirerResponses,
  mockFsOperations,
  mockExecSync,
  resetMocks
};
