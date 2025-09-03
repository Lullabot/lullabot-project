#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import {
  initCommand,
  updateCommand,
  configCommand,
  removeCommand
} from './src/commands.js';
import { getToolVersion } from './src/file-operations.js';

const program = new Command();

// Set up the CLI program
program
  .name('lullabot-project')
  .description(
    'Setup development environment with AI tools, memory banks, and project-specific rules'
  )
  .version(getToolVersion());

// Add commands
program
  .command('init')
  .description('Initialize development environment setup')
  .option('-t, --tool <tool>', 'Specify tool (cursor, windsurf, vscode)')
  .option('-p, --project <type>', 'Specify project type (drupal, none)')
  .option('--skip-tasks <tasks>', 'Skip specific tasks (comma-separated)')
  .option('--tasks <tasks>', 'Only run specific tasks (comma-separated)')
  .option('--all-tasks', 'Run all tasks without prompts')
  .option('-v, --verbose', 'Verbose output')
  .option('--skip-validation', 'Skip project type validation')
  .option('--dry-run', 'Show what would be done without executing')
  .action(initCommand);

program
  .command('update')
  .description('Update existing development environment setup')
  .option('-t, --tool <tool>', 'Override stored tool setting')
  .option('-p, --project <type>', 'Override stored project type (drupal, none)')
  .option('--skip-tasks <tasks>', 'Skip specific tasks (comma-separated)')
  .option('--tasks <tasks>', 'Only run specific tasks (comma-separated)')
  .option('--all-tasks', 'Run all tasks without prompts')
  .option('-v, --verbose', 'Verbose output')
  .option('--dry-run', 'Show what would be updated without executing')
  .option('-F, --force', 'Force update - recreate configuration if corrupted')
  .action(updateCommand);

program
  .command('config')
  .description('Show current configuration and status')
  .option('-v, --verbose', 'Show detailed file information')
  .option('--json', 'Output in JSON format')
  .option('--check-updates', 'Check for available updates')
  .action(configCommand);

program
  .command('remove')
  .description('Remove all files and configuration created by lullabot-project')
  .option('-v, --verbose', 'Verbose output')
  .option('--dry-run', 'Show what would be removed without executing')
  .option('-f, --force', 'Force removal without confirmation')
  .action(removeCommand);

// Handle errors gracefully
program.exitOverride();

try {
  program.parse();
} catch (err) {
  if (
    err.code === 'commander.help' ||
    err.code === 'commander.helpDisplayed' ||
    err.code === 'commander.version'
  ) {
    process.exit(0);
  }
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
}
