import { simpleGit } from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import chalk from 'chalk';

const git = simpleGit();

// Configuration for our repository
const config = {
  repoUrl: 'https://github.com/Lullabot/lullabot-project',
  branch: 'main'
};

/**
 * Clone the repository to a temporary directory and copy specific files.
 * This follows the same pattern as cursor-bank for consistency.
 * Creates a temporary directory, clones the repository, copies files,
 * and cleans up the temporary directory.
 *
 * @param {string} sourcePath - Path to source files in the repository
 * @param {string} targetPath - Path where files should be copied
 * @param {boolean} verbose - Whether to show detailed output
 * @returns {Promise<boolean>} True if operation was successful
 */
export async function cloneAndCopyFiles(
  sourcePath,
  targetPath,
  verbose = false
) {
  // Create a temporary directory with unique timestamp
  const tempDir = path.join(os.tmpdir(), `lullabot-project-${Date.now()}`);

  if (verbose) {
    console.log(chalk.gray(`Creating temporary directory: ${tempDir}`));
  }

  try {
    // Clone the repository with shallow clone for efficiency
    if (verbose) {
      console.log(chalk.gray('Cloning repository...'));
      console.log(
        chalk.gray(`Cloning from ${config.repoUrl} branch ${config.branch}`)
      );
    }

    await git.clone(config.repoUrl, tempDir, [
      '--depth',
      '1',
      '--single-branch',
      '--branch',
      config.branch
    ]);

    // Path to source directory in the cloned repo
    const fullSourcePath = path.join(tempDir, sourcePath);

    // Check if source exists
    if (!fs.existsSync(fullSourcePath)) {
      throw new Error(`Source path ${sourcePath} not found in repository`);
    }

    // Create target directory if it doesn't exist
    if (verbose) {
      console.log(chalk.gray(`Copying files to ${targetPath}...`));
    }

    await fs.ensureDir(path.dirname(targetPath));

    // Copy directory or file
    await fs.copy(fullSourcePath, targetPath);

    if (verbose) {
      console.log(
        chalk.gray(`Successfully copied ${sourcePath} to ${targetPath}`)
      );
    }

    return true;
  } catch (error) {
    if (verbose) {
      console.log(chalk.red(`Git operation failed: ${error.message}`));
    }
    throw error;
  } finally {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      if (verbose) {
        console.log(chalk.gray(`Cleaning up temporary directory: ${tempDir}`));
      }
      await fs.remove(tempDir);
    }
  }
}

/**
 * Get files from the repository for a specific source path and target.
 * Uses the source path from the task configuration to copy files from Git.
 *
 * @param {string} sourcePath - Source path in the repository (from task config)
 * @param {string} targetPath - Path where files should be copied
 * @param {boolean} verbose - Whether to show detailed output
 * @returns {Promise<boolean>} True if operation was successful
 */
export async function getFilesFromGit(sourcePath, targetPath, verbose = false) {
  return await cloneAndCopyFiles(sourcePath, targetPath, verbose);
}

/**
 * Get configuration files from the repository.
 * Copies the config directory from the repository to the target location.
 *
 * @param {string} targetDir - Directory where files should be copied
 * @param {boolean} verbose - Whether to show detailed output
 * @returns {Promise<boolean>} True if operation was successful
 */
export async function getConfigFromGit(targetDir, verbose = false) {
  const sourcePath = 'config';
  const targetPath = path.join(targetDir, 'config');

  return await cloneAndCopyFiles(sourcePath, targetPath, verbose);
}
