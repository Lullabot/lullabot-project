import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import yaml from 'js-yaml';
import chalk from 'chalk';
import { getTaskExecutor } from './task-types/index.js';

/**
 * Get the current tool version from package.json.
 * Returns the version from the package.json file or defaults to '1.0.0' if not available.
 *
 * @returns {string} The tool version
 */
function getToolVersion() {
  try {
    // Get the tool's package.json path (not the current working directory)
    // Use the current file's location to find the tool root
    const currentFile = import.meta.url;
    const currentDir = path.dirname(new URL(currentFile).pathname);
    const toolDir = path.resolve(currentDir, '..');
    const packagePath = path.join(toolDir, 'package.json');

    if (fs.existsSync(packagePath)) {
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      return packageData.version || '1.0.0';
    }
  } catch (error) {
    // If we can't read the package.json, fall back to default
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        chalk.yellow(
          `Warning: Could not read package.json version, using default.${error.message}`
        )
      );
    }
  }
  return '1.0.0';
}

/**
 * Create configuration file with the provided configuration data.
 * Converts the configuration object to YAML format and writes it to disk.
 *
 * @param {Object} config - Configuration object to save
 * @param {boolean} verbose - Whether to show detailed output
 * @returns {Promise<string>} Path to the created configuration file
 */
async function createConfigFile(config, verbose = false) {
  // Normalize configuration structure for storage
  let projectType;

  if (config.project?.type !== undefined) {
    // Use the explicit type if it's defined
    projectType = config.project.type;
  } else if (config.project !== undefined) {
    // Use the project object as the type if no explicit type
    projectType = config.project;
  } else {
    // No project information available
    projectType = null;
  }

  const configData = {
    project: {
      type: projectType, // Handle both object and string, normalize undefined to null
      tool: config.project?.tool || config.tool
    },
    features: {
      taskPreferences:
        config.features?.taskPreferences || config.taskPreferences
    },
    installation: {
      created: config.installation?.created || new Date().toISOString(),
      updated: new Date().toISOString(),
      toolVersion: getToolVersion()
    },
    files: config.files || [],
    packages: config.packages || {}
  };

  const configPath = path.join(process.cwd(), '.lullabot-project.yml');

  if (verbose) {
    console.log(chalk.gray(`  Creating configuration file: ${configPath}`));
  }

  // Write configuration to YAML file
  await fs.writeFile(configPath, yaml.dump(configData, { indent: 2 }));

  if (verbose) {
    console.log(chalk.green('✅ Configuration file created'));
  }

  return configPath;
}

/**
 * Read configuration file from disk and parse YAML content.
 * Returns null if the configuration file doesn't exist.
 *
 * @returns {Promise<Object|null>} Parsed configuration object or null if not found
 */
async function readConfigFile() {
  const configPath = path.join(process.cwd(), '.lullabot-project.yml');

  try {
    await fs.access(configPath);
  } catch (_error) {
    return null;
  }

  try {
    const configContent = await fs.readFile(configPath, 'utf8');
    return yaml.load(configContent);
  } catch (error) {
    throw new Error(`Failed to read configuration file: ${error.message}`);
  }
}

/**
 * Update configuration file with new data while preserving existing values.
 * Merges the new configuration with the existing one and updates timestamps.
 *
 * @param {Object} config - New configuration data to merge
 * @param {boolean} verbose - Whether to show detailed output
 * @returns {Promise<string>} Path to the updated configuration file
 */
async function updateConfigFile(config, verbose = false) {
  const existingConfig = await readConfigFile();
  if (!existingConfig) {
    throw new Error('No existing configuration found');
  }

  // Merge existing config with new data
  const updatedConfig = {
    ...existingConfig,
    ...config,
    installation: {
      ...existingConfig.installation,
      updated: new Date().toISOString()
    }
  };

  const configPath = path.join(process.cwd(), '.lullabot-project.yml');

  if (verbose) {
    console.log(chalk.gray(`  Updating configuration file: ${configPath}`));
  }

  await fs.writeFile(configPath, yaml.dump(updatedConfig, { indent: 2 }));

  if (verbose) {
    console.log(chalk.green('✅ Configuration file updated'));
  }

  return configPath;
}

/**
 * Check if configuration file exists in the current directory.
 *
 * @returns {Promise<boolean>} True if configuration file exists, false otherwise
 */
async function configExists() {
  const configPath = path.join(process.cwd(), '.lullabot-project.yml');
  try {
    await fs.access(configPath);
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Get list of files created by the tool based on configuration.
 * Returns the files that were copied during setup, stored in config.files.
 *
 * @param {Object} config - Configuration object
 * @returns {Promise<string[]>} Array of file paths that were created
 */
async function getCreatedFiles(config) {
  // Return the files that were copied during setup
  return config.files || [];
}

/**
 * Execute a task based on its type and configuration.
 * Routes to the appropriate execution function based on task type using the modular system.
 *
 * @param {Object} task - Task configuration object
 * @param {string} tool - The tool identifier
 * @param {string} projectType - The project type
 * @param {boolean} verbose - Whether to show detailed output
 * @param {Object} dependencies - Injected dependencies for file tracking
 * @returns {Promise<Object>} Task execution result
 */
async function executeTask(
  task,
  tool,
  projectType,
  verbose = false,
  dependencies = {}
) {
  const taskId = task.id;

  if (verbose) {
    console.log(chalk.gray(`Executing task: ${task.name}`));
  }

  try {
    const taskExecutor = getTaskExecutor(task.type);
    return await taskExecutor.execute(
      task,
      tool,
      projectType,
      verbose,
      dependencies
    );
  } catch (error) {
    throw new Error(`Task '${taskId}' failed: ${error.message}`);
  }
}

/**
 * Get the default version command for a package based on its type.
 * Returns the appropriate command to check package version.
 *
 * @param {string} packageName - Name of the package
 * @param {string} type - Package type (npx, npm, yarn, pnpm)
 * @returns {string} Version command to execute
 */
function getDefaultVersionCommand(packageName, type) {
  switch (type) {
    case 'npx':
      return `npx ${packageName} --version`;
    case 'npm':
      return `npm list ${packageName}`;
    case 'yarn':
      return `yarn list ${packageName}`;
    case 'pnpm':
      return `pnpm list ${packageName}`;
    default:
      return `${packageName} --version`;
  }
}

/**
 * Parse version from command output based on package type.
 * Handles different output formats from various package managers.
 *
 * @param {string} output - Raw command output
 * @param {string} type - Package type (npx, npm, yarn, pnpm)
 * @returns {string} Extracted version string
 */
function parseVersionFromOutput(output, type) {
  // Handle null/undefined output
  if (!output) {
    return 'unknown';
  }

  switch (type) {
    case 'npm':
    case 'yarn':
    case 'pnpm': {
      // Parse "└── package@version" format
      const match = output.match(/└── [^@]+@([^\s]+)/);
      return match ? match[1] : 'unknown';
    }
    default:
      // For npx and custom, assume direct version output
      return output.trim();
  }
}

/**
 * Get package version information by executing version command.
 * Handles both string package names and package configuration objects.
 *
 * @param {string|Object} packageConfig - Package name or configuration object
 * @param {boolean} verbose - Whether to show detailed output
 * @returns {Promise<Object>} Package information including name, version, and metadata
 */
async function getPackageVersion(packageConfig, verbose = false) {
  // Handle case where packageConfig is just a string (package name)
  if (typeof packageConfig === 'string') {
    packageConfig = { name: packageConfig, type: 'npx' };
  }

  const { name, type = 'npx' } = packageConfig;
  // Handle both camelCase and kebab-case property names
  const versionCommand =
    packageConfig.versionCommand || packageConfig['version-command'];

  try {
    if (verbose) {
      console.log(chalk.gray(`  Checking version for: ${name} (${type})`));
    }

    // Use custom version command if provided, otherwise use type-based defaults
    const command = versionCommand || getDefaultVersionCommand(name, type);

    const output = execSync(command, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: verbose ? 'inherit' : 'pipe',
      timeout: 10000
    });

    const version = parseVersionFromOutput(output, type);

    if (verbose) {
      console.log(chalk.gray(`  Found version: ${version}`));
    }

    return {
      name,
      version,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    if (verbose) {
      console.log(
        chalk.gray(`  Could not get version for ${name}: ${error.message}`)
      );
    }
    return {
      name,
      version: 'unknown',
      lastUpdated: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Calculate SHA256 hash of a file.
 * Uses dependency injection for testability.
 *
 * @param {string} filePath - Path to the file to hash
 * @param {Object} dependencies - Injected dependencies
 * @param {Object} dependencies.crypto - Crypto module
 * @param {Object} dependencies.fs - File system module
 * @returns {Promise<string>} SHA256 hash as hex string
 */
async function calculateFileHash(filePath, dependencies = {}) {
  const { crypto, fs } = dependencies;

  if (!crypto || !fs) {
    throw new Error('Missing required dependencies: crypto and fs');
  }

  const content = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Check for file changes by comparing current hashes with stored hashes.
 * Uses dependency injection for testability.
 *
 * @param {Object} config - Configuration object with files array
 * @param {Object} dependencies - Injected dependencies
 * @param {Function} dependencies.calculateFileHash - Function to calculate file hash
 * @returns {Promise<Array>} Array of changed files with change details
 */
async function checkFileChanges(config, dependencies = {}) {
  const { calculateFileHash } = dependencies;

  if (!calculateFileHash) {
    throw new Error('Missing required dependency: calculateFileHash');
  }

  const changedFiles = [];

  for (const fileInfo of config.files || []) {
    try {
      const currentHash = await calculateFileHash(fileInfo.path, dependencies);
      if (currentHash !== fileInfo.originalHash) {
        changedFiles.push({
          path: fileInfo.path,
          originalHash: fileInfo.originalHash,
          currentHash
        });
      }
    } catch (error) {
      // File doesn't exist or can't be read
      changedFiles.push({
        path: fileInfo.path,
        originalHash: fileInfo.originalHash,
        currentHash: null,
        error: error.message
      });
    }
  }

  return changedFiles;
}

/**
 * Track an installed file with its hash.
 * Uses dependency injection for testability.
 *
 * @param {string} filePath - Path to the installed file
 * @param {Object} dependencies - Injected dependencies
 * @param {Function} dependencies.calculateFileHash - Function to calculate file hash
 * @returns {Promise<Object>} File tracking object with path and hash
 */
async function trackInstalledFile(filePath, dependencies = {}) {
  const { calculateFileHash } = dependencies;

  if (!calculateFileHash) {
    throw new Error('Missing required dependency: calculateFileHash');
  }

  const hash = await calculateFileHash(filePath, dependencies);
  return {
    path: filePath,
    originalHash: hash
  };
}

/**
 * Check if project is initialized by checking for configuration file.
 * Uses dependency injection for testability.
 *
 * @param {Object} dependencies - Injected dependencies
 * @param {Function} dependencies.configExists - Function to check if config exists
 * @returns {Promise<boolean>} True if project is initialized, false otherwise
 */
async function isProjectInitialized(dependencies = {}) {
  const { configExists } = dependencies;

  if (!configExists) {
    throw new Error('Missing required dependency: configExists');
  }

  return await configExists();
}

export {
  executeTask,
  createConfigFile,
  readConfigFile,
  updateConfigFile,
  configExists,
  getCreatedFiles,
  getPackageVersion,
  getToolVersion,
  calculateFileHash,
  checkFileChanges,
  trackInstalledFile,
  isProjectInitialized
};
