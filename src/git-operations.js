import { simpleGit } from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import chalk from 'chalk';

const git = simpleGit();

// Get the tool version from package.json
function getToolVersion() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return packageJson.version;
    }
  } catch (error) {
    // Fallback to default version if package.json can't be read
  }
  return '1.0.0'; // Default fallback version
}

// Configuration for our repository
const config = {
  repoUrl: 'https://github.com/Lullabot/lullabot-project',
  branch: 'main', // Fallback branch if tag doesn't exist
  version: getToolVersion()
};

/**
 * Check if a specific tag exists in the repository.
 * This can be used to validate that the version tag exists before attempting to clone.
 *
 * @param {string} tag - The tag to check
 * @returns {Promise<boolean>} True if the tag exists, false otherwise
 */
export async function tagExists(tag) {
  try {
    // Create a temporary directory for checking
    const tempDir = path.join(
      os.tmpdir(),
      `lullabot-project-check-${Date.now()}`
    );

    // Clone just the tags to check if our version exists
    await git.clone(config.repoUrl, tempDir, [
      '--depth',
      '1',
      '--no-single-branch',
      '--tags'
    ]);

    // Check if our tag exists
    const tags = await git.cwd(tempDir).tags();
    const tagExists = tags.all.includes(tag);

    // Clean up
    await fs.remove(tempDir);

    return tagExists;
  } catch (error) {
    // If we can't check tags, assume they don't exist
    return false;
  }
}

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
    // Try to use the version tag first, fallback to main branch if tag doesn't exist
    if (verbose) {
      console.log(chalk.gray('Cloning repository...'));
      console.log(
        chalk.gray(
          `Attempting to clone from ${config.repoUrl} tag ${config.version}`
        )
      );
    }

    try {
      // First try to clone from the version tag
      await git.clone(config.repoUrl, tempDir, [
        '--depth',
        '1',
        '--single-branch',
        '--branch',
        config.version
      ]);

      if (verbose) {
        console.log(
          chalk.green(`✅ Successfully cloned from tag ${config.version}`)
        );
      }
    } catch (tagError) {
      if (verbose) {
        console.log(
          chalk.yellow(
            `⚠️  Tag ${config.version} not found, falling back to main branch`
          )
        );
        console.log(
          chalk.gray(`Cloning from ${config.repoUrl} branch ${config.branch}`)
        );
      }

      // Fallback to main branch if the tag doesn't exist
      await git.clone(config.repoUrl, tempDir, [
        '--depth',
        '1',
        '--single-branch',
        '--branch',
        config.branch
      ]);

      if (verbose) {
        console.log(
          chalk.yellow(`⚠️  Cloned from fallback branch ${config.branch}`)
        );
      }
    }

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
