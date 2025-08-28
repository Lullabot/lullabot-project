import chalk from 'chalk';
import { initSetup, updateSetup, showConfig, removeSetup } from './cli.js';

/**
 * Initialize development environment setup
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
 * Update existing development environment setup
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
 * Show current configuration and status
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
 * Remove all files and configuration created by lullabot-project
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

export {
  initCommand,
  updateCommand,
  configCommand,
  removeCommand
};
