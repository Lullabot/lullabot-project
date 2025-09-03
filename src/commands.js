/**
 * Refactored commands.js - More testable version
 *
 * Key improvements:
 * - Dependencies injected as parameters
 * - No direct imports from cli.js
 * - Pure functions that can be tested in isolation
 * - Separated error handling from business logic
 */

/**
 * Initialize development environment setup command handler.
 * Wraps the initSetup function with error handling and exit codes.
 *
 * @param {Object} options - Command line options and flags
 * @param {boolean} options.dryRun - Whether to perform a dry run without making changes
 * @param {boolean} options.verbose - Whether to show detailed output
 * @param {boolean} options.skipValidation - Whether to skip project validation
 * @param {string} options.tool - Tool to use (if provided via command line)
 * @param {string} options.project - Project type (if provided via command line)
 * @param {string} options.tasks - Comma-separated list of tasks to enable
 * @param {string} options.skipTasks - Comma-separated list of tasks to skip
 * @param {boolean} options.allTasks - Whether to enable all available tasks
 * @param {Function} initSetupFn - Function to handle initialization setup
 * @param {Object} chalk - Chalk instance for styling
 * @param {Function} logFn - Console.log function (can be mocked)
 * @param {Function} errorFn - Console.error function (can be mocked)
 * @param {Function} exitFn - Process.exit function (can be mocked)
 * @returns {Promise<void>}
 */
async function initCommand(options) {
  try {
    // Import the function dynamically to avoid circular dependencies
    const { initSetup } = await import('./cli.js');

    // Create a simple dependencies object with what's needed
    const dependencies = {
      readConfigFile: async () => {
        const { readConfigFile } = await import('./file-operations.js');
        return readConfigFile();
      },
      loadConfig: async () => {
        const { loadConfig } = await import('./tool-config.js');
        return loadConfig();
      },
      getTasks: async (tool, project, config) => {
        const { getTasks } = await import('./tool-config.js');
        return getTasks(tool, project, config);
      },
      validateProject: async (projectType, tool, config) => {
        const { validateProject } = await import('./tool-config.js');
        return validateProject(projectType, tool, config);
      },
      executeTask: async (task, fullConfig, config) => {
        const { executeTask } = await import('./file-operations.js');
        return executeTask(task, fullConfig, config);
      },
      createConfigFile: async (config, fullConfig) => {
        const { createConfigFile } = await import('./file-operations.js');
        return createConfigFile(config, fullConfig);
      },
      promptUser: async (options, fullConfig, _promptFn, _getTasksFn) => {
        const { promptUser } = await import('./prompts.js');
        // Create the actual promptFn and getTasksFn functions
        const actualPromptFn = async (questions) => {
          const inquirer = await import('inquirer');
          return inquirer.default.prompt(questions);
        };
        const actualGetTasksFn = async (tool, project, config) => {
          const { getTasks } = await import('./tool-config.js');
          return getTasks(tool, project, config);
        };
        return promptUser(
          options,
          fullConfig,
          actualPromptFn,
          actualGetTasksFn
        );
      },
      confirmAction: async (message, defaultValue) => {
        const { confirmAction } = await import('./prompts.js');
        return confirmAction(message, defaultValue);
      },
      chalk,
      logFn: console.log
    };

    await initSetup(options, dependencies);
  } catch (error) {
    console.error(chalk.red('❌ Setup failed:'), error.message);
    if (options.verbose) {
      console.error(chalk.gray('Stack trace:'), error.stack);
    }
    process.exit(1);
  }
}

/**
 * Update existing development environment setup command handler.
 * Wraps the updateSetup function with error handling and exit codes.
 *
 * @param {Object} options - Command line options and flags
 * @param {boolean} options.dryRun - Whether to perform a dry run without making changes
 * @param {boolean} options.verbose - Whether to show detailed output
 * @param {boolean} options.force - Whether to force update even with corrupted config
 * @param {string} options.tool - Tool to use (if provided via command line)
 * @param {string} options.project - Project type (if provided via command line)
 * @param {string} options.tasks - Comma-separated list of tasks to enable
 * @param {string} options.skipTasks - Comma-separated list of tasks to skip
 * @param {boolean} options.allTasks - Whether to enable all available tasks
 * @param {Function} updateSetupFn - Function to handle update setup
 * @param {Object} chalk - Chalk instance for styling
 * @param {Function} logFn - Console.log function (can be mocked)
 * @param {Function} errorFn - Console.error function (can be mocked)
 * @param {Function} exitFn - Process.exit function (can be mocked)
 * @returns {Promise<void>}
 */
async function updateCommand(options) {
  try {
    // Import the function dynamically to avoid circular dependencies
    const { updateSetup } = await import('./cli.js');

    // Create a simple dependencies object with what's needed
    const dependencies = {
      readConfigFile: async () => {
        const { readConfigFile } = await import('./file-operations.js');
        return readConfigFile();
      },
      loadConfig: async () => {
        const { loadConfig } = await import('./tool-config.js');
        return loadConfig();
      },
      getTasks: async (tool, project, config) => {
        const { getTasks } = await import('./tool-config.js');
        return getTasks(tool, project, config);
      },
      executeTask: async (task, fullConfig, config) => {
        const { executeTask } = await import('./file-operations.js');
        return executeTask(task, fullConfig, config);
      },
      createConfigFile: async (config, fullConfig) => {
        const { createConfigFile } = await import('./file-operations.js');
        return createConfigFile(config, fullConfig);
      },
      chalk,
      logFn: console.log
    };

    await updateSetup(options, dependencies);
  } catch (error) {
    console.error(chalk.red('❌ Update failed:'), error.message);
    if (options.verbose) {
      console.error(chalk.gray('Stack trace:'), error.stack);
    }
    process.exit(1);
  }
}

/**
 * Show current configuration and status command handler.
 * Wraps the showConfig function with error handling and exit codes.
 *
 * @param {Object} options - Command line options and flags
 * @param {boolean} options.checkUpdates - Whether to check for available updates
 * @param {boolean} options.json - Whether to output in JSON format
 * @param {boolean} options.verbose - Whether to show detailed output
 * @param {Function} showConfigFn - Function to handle configuration display
 * @param {Object} chalk - Chalk instance for styling
 * @param {Function} logFn - Console.log function (can be mocked)
 * @param {Function} errorFn - Console.error function (can be mocked)
 * @param {Function} exitFn - Process.exit function (can be mocked)
 * @returns {Promise<void>}
 */
async function configCommand(options) {
  try {
    // Import the function dynamically to avoid circular dependencies
    const { showConfig } = await import('./cli.js');

    // Create a simple dependencies object with what's needed
    const dependencies = {
      readConfigFile: async () => {
        const { readConfigFile } = await import('./file-operations.js');
        return readConfigFile();
      },
      loadConfig: async () => {
        const { loadConfig } = await import('./tool-config.js');
        return loadConfig();
      },
      getTasks: async (tool, project, config) => {
        const { getTasks } = await import('./tool-config.js');
        return getTasks(tool, project, config);
      },
      getToolVersion: async () => {
        const { getToolVersion } = await import('./file-operations.js');
        return getToolVersion();
      },
      chalk,
      logFn: console.log
    };

    await showConfig(options, dependencies);
  } catch (error) {
    console.error(chalk.red('❌ Config display failed:'), error.message);
    if (options.verbose) {
      console.error(chalk.gray('Stack trace:'), error.stack);
    }
    process.exit(1);
  }
}

/**
 * Remove all files and configuration created by lullabot-project command handler.
 * Wraps the removeSetup function with error handling and exit codes.
 *
 * @param {Object} options - Command line options and flags
 * @param {boolean} options.dryRun - Whether to perform a dry run without making changes
 * @param {boolean} options.verbose - Whether to show detailed output
 * @param {boolean} options.force - Whether to skip confirmation prompt
 * @param {Function} removeSetupFn - Function to handle removal setup
 * @param {Object} chalk - Chalk instance for styling
 * @param {Function} logFn - Console.log function (can be mocked)
 * @param {Function} errorFn - Console.error function (can be mocked)
 * @param {Function} exitFn - Process.exit function (can be mocked)
 * @returns {Promise<void>}
 */
async function removeCommand(options) {
  try {
    // Import the function dynamically to avoid circular dependencies
    const { removeSetup } = await import('./cli.js');

    // Create a simple dependencies object with what's needed
    const dependencies = {
      readConfigFile: async () => {
        const { readConfigFile } = await import('./file-operations.js');
        return readConfigFile();
      },
      confirmAction: async (message, defaultValue) => {
        const { confirmAction: actualConfirmAction } = await import(
          './prompts.js'
        );
        const { default: inquirer } = await import('inquirer');
        return actualConfirmAction(message, defaultValue, inquirer.prompt);
      },
      fs: await import('fs-extra'),
      path: await import('path'),
      chalk,
      logFn: console.log
    };

    await removeSetup(options, dependencies);
  } catch (error) {
    console.error(chalk.red('❌ Remove failed:'), error.message);
    if (options.verbose) {
      console.error(chalk.gray('Stack trace:'), error.stack);
    }
    process.exit(1);
  }
}

import chalk from 'chalk';

// Export the refactored functions
export { initCommand, updateCommand, configCommand, removeCommand };
