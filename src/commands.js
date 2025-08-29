import chalk from 'chalk';
import {
  initSetup,
  updateSetup,
  showConfig,
  removeSetup,
  taskSetup
} from './cli.js';

/**
 * Initialize development environment setup command handler.
 * Wraps the initSetup function with error handling and exit codes.
 *
 * @param {Object} options - Command line options and flags
 * @param {boolean} options.dryRun - Whether to perform a dry run without making changes
 * @param {boolean} options.verbose - Whether to show detailed output
 * @param {boolean} options.skipValidation - Whether to skip project validation
 * @param {string} options.ide - IDE to use (if provided via command line)
 * @param {string} options.project - Project type (if provided via command line)
 * @param {string} options.tasks - Comma-separated list of tasks to enable
 * @param {string} options.skipTasks - Comma-separated list of tasks to skip
 * @param {boolean} options.allTasks - Whether to enable all available tasks
 */
async function initCommand(options) {
  try {
    await initSetup(options);
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
 * @param {string} options.ide - IDE to use (if provided via command line)
 * @param {string} options.project - Project type (if provided via command line)
 * @param {string} options.tasks - Comma-separated list of tasks to enable
 * @param {string} options.skipTasks - Comma-separated list of tasks to skip
 * @param {boolean} options.allTasks - Whether to enable all available tasks
 */
async function updateCommand(options) {
  try {
    await updateSetup(options);
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
 */
async function configCommand(options) {
  try {
    await showConfig(options);
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
 */
async function removeCommand(options) {
  try {
    await removeSetup(options);
  } catch (error) {
    console.error(chalk.red('❌ Remove failed:'), error.message);
    if (options.verbose) {
      console.error(chalk.gray('Stack trace:'), error.stack);
    }
    process.exit(1);
  }
}

/**
 * Run specific tasks using stored configuration command handler.
 * Wraps the taskSetup function with error handling and exit codes.
 *
 * @param {string[]} tasks - Array of task names to run
 * @param {Object} options - Command line options and flags
 * @param {boolean} options.dryRun - Whether to perform a dry run without making changes
 * @param {boolean} options.verbose - Whether to show detailed output
 */
async function taskCommand(tasks, options) {
  try {
    await taskSetup(tasks, options);
  } catch (error) {
    console.error(chalk.red('❌ Task execution failed:'), error.message);
    if (options.verbose) {
      console.error(chalk.gray('Stack trace:'), error.stack);
    }
    process.exit(1);
  }
}

export {
  initCommand,
  updateCommand,
  configCommand,
  removeCommand,
  taskCommand
};
