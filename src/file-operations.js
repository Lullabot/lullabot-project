import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import yaml from 'js-yaml';
import chalk from 'chalk';
import { getFilesFromGit } from './git-operations.js';

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
 * Copy files from Git repository to the appropriate location.
 * This function handles copying files from the Git repository using the source path
 * specified in the task configuration.
 *
 * @param {string} sourcePath - Source path in the repository (from task config)
 * @param {string} targetPath - Target path where files should be copied
 * @param {boolean} verbose - Whether to show detailed output
 * @param {string[]} items - Optional array of specific items to copy
 * @param {Object} dependencies - Injected dependencies for file tracking
 * @returns {Promise<Object[]>} Array of file tracking objects with paths and hashes
 */
async function copyFilesFromGit(
  sourcePath,
  targetPath,
  verbose = false,
  items = null,
  dependencies = {}
) {
  try {
    // Get the list of files that exist before copying
    const existingFiles = new Set();
    try {
      await fs.access(targetPath);
      const existingItems = await fs.readdir(targetPath);
      for (const item of existingItems) {
        existingFiles.add(item);
      }
    } catch (_error) {
      // Target doesn't exist yet, no existing files
    }

    if (verbose) {
      console.log(
        chalk.gray(`Starting Git copy from ${sourcePath} to ${targetPath}`)
      );
    }

    // Use Git operations to get files from the repository
    // Pass items array to filter what gets copied
    try {
      const gitResult = await getFilesFromGit(
        sourcePath,
        targetPath,
        verbose,
        items
      );

      if (verbose) {
        console.log(chalk.gray(`Git operation result: ${gitResult}`));
      }
    } catch (gitError) {
      if (verbose) {
        console.log(
          chalk.red(`Git operation failed with error: ${gitError.message}`)
        );
        console.log(chalk.red(`Error stack: ${gitError.stack}`));
      }
      throw gitError;
    }

    // Get list of copied files for tracking with hashes
    const trackedFiles = [];

    // If we have specific items to copy, track those
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const itemPath = path.join(targetPath, item);
        const relativePath = path.relative(process.cwd(), itemPath);

        // Additional safety: ensure the path is within the current directory
        const resolvedPath = path.resolve(process.cwd(), relativePath);
        const currentDir = process.cwd();

        if (
          !resolvedPath.startsWith(currentDir + path.sep) &&
          resolvedPath !== currentDir
        ) {
          throw new Error(
            `Security violation: Attempted to track file outside project directory: ${resolvedPath}`
          );
        }

        // Track file with hash if dependencies are provided
        if (dependencies.trackInstalledFile) {
          const fileInfo = await dependencies.trackInstalledFile(
            relativePath,
            dependencies
          );
          trackedFiles.push(fileInfo);
        } else {
          // Fallback to simple path tracking
          trackedFiles.push({ path: relativePath });
        }
      }
    } else {
      // Fallback: track files that weren't there before copying
      try {
        await fs.access(targetPath);
        const targetContents = await fs.readdir(targetPath);

        for (const item of targetContents) {
          if (!existingFiles.has(item)) {
            const itemPath = path.join(targetPath, item);
            const relativePath = path.relative(process.cwd(), itemPath);

            const resolvedPath = path.resolve(process.cwd(), relativePath);
            const currentDir = process.cwd();

            if (
              !resolvedPath.startsWith(currentDir + path.sep) &&
              resolvedPath !== currentDir
            ) {
              throw new Error(
                `Security violation: Attempted to track file outside project directory: ${resolvedPath}`
              );
            }

            // Track file with hash if dependencies are provided
            if (dependencies.trackInstalledFile) {
              const fileInfo = await dependencies.trackInstalledFile(
                relativePath,
                dependencies
              );
              trackedFiles.push(fileInfo);
            } else {
              // Fallback to simple path tracking
              trackedFiles.push({ path: relativePath });
            }
          }
        }
      } catch (_error) {
        // Target doesn't exist, no files to track
      }
    }

    if (verbose) {
      console.log(chalk.green(`✅ Copied files to ${targetPath}`));
      console.log(chalk.gray(`Tracked ${trackedFiles.length} files`));
    }

    return trackedFiles;
  } catch (error) {
    if (verbose) {
      console.log(chalk.red(`Git copy failed: ${error.message}`));
    }
    throw new Error(`Failed to copy files from Git: ${error.message}`);
  }
}

/**
 * Copy files from a source directory to a target directory.
 * This is a generic function for copying any files from the local filesystem.
 * Supports copying specific items or all files in the source directory.
 *
 * @param {string} sourceDir - Source directory path
 * @param {string} targetDir - Target directory path
 * @param {boolean} verbose - Whether to show detailed output
 * @param {string[]} items - Optional array of specific items to copy
 * @param {Object} dependencies - Injected dependencies for file tracking
 * @returns {Promise<Object[]>} Array of file tracking objects with paths and hashes
 */
async function copyFiles(
  sourceDir,
  targetDir,
  verbose = false,
  items = null,
  dependencies = {}
) {
  try {
    await fs.access(sourceDir);
  } catch (_error) {
    throw new Error(`Source directory not found: ${sourceDir}`);
  }

  // Create target directory if it doesn't exist
  await fs.ensureDir(targetDir);

  // Determine what to copy
  let itemsToCopy = [];

  if (items && Array.isArray(items) && items.length > 0) {
    // Copy only specified items
    itemsToCopy = items;
  } else {
    // Copy all files and directories
    const allItems = await fs.readdir(sourceDir);
    itemsToCopy = allItems;
  }

  const trackedFiles = [];

  // Copy each item from source to target
  for (const item of itemsToCopy) {
    const sourceItem = path.join(sourceDir, item);
    const targetItem = path.join(targetDir, item);

    // Check if the item exists in the source directory
    try {
      await fs.access(sourceItem);
    } catch (_error) {
      if (verbose) {
        console.log(
          chalk.yellow(`  Warning: ${item} not found in source directory`)
        );
      }
      continue;
    }

    if (verbose) {
      console.log(chalk.gray(`  Copying: ${item}`));
    }

    await fs.copy(sourceItem, targetItem);

    // Store a normalized, safe file path for tracking
    const normalizedPath = path.relative(process.cwd(), targetItem);

    // Additional safety: ensure the path is within the current directory
    const resolvedPath = path.resolve(process.cwd(), normalizedPath);
    const currentDir = process.cwd();

    if (
      !resolvedPath.startsWith(currentDir + path.sep) &&
      resolvedPath !== currentDir
    ) {
      throw new Error(
        `Security violation: Attempted to copy file outside project directory: ${resolvedPath}`
      );
    }

    // Track file with hash if dependencies are provided
    if (dependencies.trackInstalledFile) {
      const fileInfo = await dependencies.trackInstalledFile(
        normalizedPath,
        dependencies
      );
      trackedFiles.push(fileInfo);
    } else {
      // Fallback to simple path tracking
      trackedFiles.push({ path: normalizedPath });
    }
  }

  if (verbose) {
    console.log(
      chalk.green(`✅ Copied ${trackedFiles.length} items to ${targetDir}`)
    );
  }

  return trackedFiles;
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
 * Routes to the appropriate execution function based on task type.
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
    // Route to appropriate execution function based on task type
    switch (task.type) {
      case 'command':
        return await executeCommandTask(task, verbose);
      case 'copy-files':
        return await executeCopyFilesTask(
          task,
          tool,
          projectType,
          verbose,
          dependencies
        );
      case 'package-install':
        return await executePackageInstallTask(task, verbose);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  } catch (error) {
    throw new Error(`Task '${taskId}' failed: ${error.message}`);
  }
}

/**
 * Execute a command task by running the specified shell command.
 * Extracts package information if the command is an npx command.
 *
 * @param {Object} task - Task configuration object
 * @param {boolean} verbose - Whether to show detailed output
 * @returns {Promise<Object>} Command execution result with output and package info
 */
async function executeCommandTask(task, verbose = false) {
  const command = task.command;

  if (verbose) {
    console.log(chalk.gray(`Executing command: ${command}`));
  }

  try {
    // Execute the shell command
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: verbose ? 'inherit' : 'pipe'
    });

    if (verbose) {
      console.log(chalk.gray('Command completed successfully'));
    }

    // Extract package info for version tracking if it's an npx command
    const packageName = command.includes('npx') ? command.split(' ')[1] : null;
    const packageInfo = packageName
      ? await getPackageVersion(packageName, false)
      : null;

    return {
      output: output || 'Command executed successfully',
      packageInfo
    };
  } catch (error) {
    throw new Error(`Command failed: ${error.message}`);
  }
}

/**
 * Execute a copy-files task by copying files from source to target.
 * Determines whether to use Git operations or local filesystem based on the source path.
 *
 * @param {Object} task - Task configuration object
 * @param {string} tool - The tool identifier
 * @param {string} projectType - The project type
 * @param {boolean} verbose - Whether to show detailed output
 * @param {Object} dependencies - Injected dependencies for file tracking
 * @returns {Promise<Object[]>} Array of file tracking objects with paths and hashes
 */
async function executeCopyFilesTask(
  task,
  tool,
  projectType,
  verbose = false,
  dependencies = {}
) {
  // Replace placeholders in source and target paths
  const source = task.source
    .replace('{tool}', tool)
    .replace('{project-type}', projectType || '');
  const target = task.target.replace('{project-type}', projectType || '');

  if (verbose) {
    console.log(chalk.gray(`Copying files from ${source} to ${target}`));
  }

  // Check if this is a Git-based source (starts with assets/)
  if (source.startsWith('assets/')) {
    // Use Git for files from the repository
    const items = task.items || null;
    const result = await copyFilesFromGit(
      source,
      target,
      verbose,
      items,
      dependencies
    );
    return result;
  } else {
    // Use local file system for other files
    const toolDir = path.dirname(new URL(import.meta.url).pathname);
    const fullSourcePath = path.join(toolDir, '..', source);
    const items = task.items || null;

    const result = await copyFiles(
      fullSourcePath,
      target,
      verbose,
      items,
      dependencies
    );
    return result;
  }
}

/**
 * Execute a package installation task by running the install command.
 * Gets package version information after installation.
 *
 * @param {Object} task - Task configuration object
 * @param {boolean} verbose - Whether to show detailed output
 * @returns {Promise<Object>} Installation result with output and package info
 */
async function executePackageInstallTask(task, verbose = false) {
  const { package: pkg } = task;

  if (verbose) {
    console.log(chalk.gray(`Installing package: ${pkg.name}`));
    console.log(chalk.gray(`Install command: ${pkg['install-command']}`));
  }

  try {
    // Execute install command
    const installOutput = execSync(pkg['install-command'], {
      encoding: 'utf8',
      stdio: verbose ? 'inherit' : 'pipe'
    });

    // Get package version
    const packageInfo = await getPackageVersion(pkg, verbose);

    return {
      output: installOutput || 'Package installed successfully',
      packageInfo
    };
  } catch (error) {
    throw new Error(`Package installation failed: ${error.message}`);
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
  copyFiles,
  copyFilesFromGit,
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
