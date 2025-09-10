import { simpleGit } from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const git = simpleGit();

// Get the tool version from package.json
function getToolVersion() {
  try {
    // Use import.meta.url to get the tool's directory, not the current working directory
    const toolDir = path.dirname(new URL(import.meta.url).pathname);
    const packageJsonPath = path.join(toolDir, '..', 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return packageJson.version;
    }
  } catch (_error) {
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
 * Get the latest available tag from the repository.
 * This is used to determine if updates are needed.
 *
 * @returns {Promise<string|null>} The latest tag version, or null if no tags found
 */
export async function getLatestTag() {
  try {
    // Create a temporary directory for checking
    const tempDir = path.join(
      os.tmpdir(),
      `lullabot-project-latest-${Date.now()}`
    );

    // Clone just the tags to get the latest one
    await git.clone(config.repoUrl, tempDir, [
      '--depth',
      '1',
      '--no-single-branch',
      '--tags'
    ]);

    // Get all tags and find the latest one
    const tags = await git.cwd(tempDir).tags();

    if (!tags.all || tags.all.length === 0) {
      await fs.remove(tempDir);
      return null;
    }

    // Sort tags by semantic version and get the latest
    const sortedTags = tags.all
      .filter((tag) => /^\d+\.\d+\.\d+$/.test(tag)) // Only semantic version tags
      .sort((a, b) => {
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);

        for (let i = 0; i < 3; i++) {
          if (aParts[i] !== bParts[i]) {
            return bParts[i] - aParts[i]; // Descending order
          }
        }
        return 0;
      });

    const latestTag = sortedTags[0] || null;

    // Clean up
    await fs.remove(tempDir);

    return latestTag;
  } catch (_error) {
    // If we can't check tags, return null
    return null;
  }
}

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
  } catch (_error) {
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
  verbose = false,
  items = null,
  dependencies = {}
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
    } catch (_tagError) {
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
      // Try local fallback for development
      if (dependencies.useLocalFiles) {
        if (verbose) {
          console.log(
            chalk.yellow(`Source not found in Git, trying local fallback...`)
          );
        }
        return await copyFromLocalFiles(
          sourcePath,
          targetPath,
          verbose,
          items,
          dependencies
        );
      }
      throw new Error(`Source path ${sourcePath} not found in repository`);
    }

    // Create target directory if it doesn't exist
    if (verbose) {
      console.log(chalk.gray(`Copying files to ${targetPath}...`));
    }

    await fs.ensureDir(path.dirname(targetPath));

    // Copy directory or file
    if (items && Array.isArray(items) && items.length > 0) {
      // Copy only specified items
      if (verbose) {
        console.log(chalk.gray(`Copying specific items: ${items.join(', ')}`));
      }

      // Create target directory if it doesn't exist
      await fs.ensureDir(targetPath);

      // Copy each specified item
      for (const item of items) {
        const sourceItemPath = path.join(fullSourcePath, item);
        const targetItemPath = path.join(targetPath, item);

        if (fs.existsSync(sourceItemPath)) {
          await fs.copy(sourceItemPath, targetItemPath);
          if (verbose) {
            console.log(chalk.gray(`Copied ${item} to ${targetItemPath}`));
          }
        } else {
          if (verbose) {
            console.log(
              chalk.yellow(`Warning: Item ${item} not found in source`)
            );
          }
        }
      }
    } else {
      // Copy entire directory
      await fs.copy(fullSourcePath, targetPath);
    }

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
export async function getFilesFromGit(
  sourcePath,
  targetPath,
  verbose = false,
  items = null,
  dependencies = {}
) {
  return await cloneAndCopyFiles(
    sourcePath,
    targetPath,
    verbose,
    items,
    dependencies
  );
}

/**
 * Copy files from local development directory instead of Git repository.
 * Used for development workflow when files haven't been committed yet.
 *
 * @param {string} sourcePath - Path to source files relative to project root
 * @param {string} targetPath - Path where files should be copied
 * @param {boolean} verbose - Whether to show detailed output
 * @param {Array} items - Specific items to copy (optional)
 * @param {Object} dependencies - Dependencies object
 * @returns {Promise<Object>} Result object with files array
 */
async function copyFromLocalFiles(
  sourcePath,
  targetPath,
  verbose,
  items,
  dependencies
) {
  // Get the project root directory (where this tool is located)
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  const projectRoot = path.resolve(currentDir, '..');

  // Construct full path to local source
  const localSourcePath = path.join(projectRoot, sourcePath);

  if (verbose) {
    console.log(chalk.gray(`Copying from local path: ${localSourcePath}`));
  }

  // Check if local source exists
  if (!fs.existsSync(localSourcePath)) {
    throw new Error(`Local source path ${localSourcePath} not found`);
  }

  const trackedFiles = [];

  // Check if sourcePath is a file or directory
  const sourceStats = await fs.stat(localSourcePath);

  if (sourceStats.isFile()) {
    // Source is a file - copy it directly
    if (verbose) {
      console.log(chalk.gray(`Copying file: ${sourcePath}`));
    }

    // Determine the target file path
    let finalTargetPath = targetPath;

    // If target is a directory (like '.'), append the filename
    if (
      targetPath === '.' ||
      targetPath.endsWith('/') ||
      targetPath.endsWith('\\')
    ) {
      const fileName = path.basename(sourcePath);
      finalTargetPath = path.join(targetPath, fileName);
    }

    // Create target directory if it doesn't exist
    await fs.ensureDir(path.dirname(finalTargetPath));

    // Copy the file
    await fs.copy(localSourcePath, finalTargetPath);

    // Track the file
    const relativePath = path.relative(process.cwd(), finalTargetPath);
    if (dependencies.trackInstalledFile) {
      if (verbose) {
        console.log(chalk.gray(`  Tracking file: ${relativePath}`));
      }
      const fileInfo = await dependencies.trackInstalledFile(
        relativePath,
        dependencies
      );
      trackedFiles.push(fileInfo);
      if (verbose) {
        console.log(
          chalk.gray(`  Tracked file info: ${JSON.stringify(fileInfo)}`)
        );
      }
    } else {
      if (verbose) {
        console.log(
          chalk.yellow(
            `  No trackInstalledFile function available, using fallback`
          )
        );
      }
      trackedFiles.push({ path: relativePath });
    }

    if (verbose) {
      console.log(chalk.gray(`  Copied: ${sourcePath} to ${finalTargetPath}`));
    }
  } else {
    // Source is a directory - copy items from it
    if (items && Array.isArray(items) && items.length > 0) {
      // Copy only specified items
      if (verbose) {
        console.log(chalk.gray(`Copying specific items: ${items.join(', ')}`));
      }

      await fs.ensureDir(targetPath);

      for (const item of items) {
        const sourceItem = path.join(localSourcePath, item);
        const targetItem = path.join(targetPath, item);

        if (fs.existsSync(sourceItem)) {
          await fs.copy(sourceItem, targetItem);

          // Track the file
          const relativePath = path.relative(process.cwd(), targetItem);
          if (dependencies.trackInstalledFile) {
            const fileInfo = await dependencies.trackInstalledFile(
              relativePath,
              dependencies
            );
            trackedFiles.push(fileInfo);
          } else {
            trackedFiles.push({ path: relativePath });
          }

          if (verbose) {
            console.log(chalk.gray(`  Copied: ${item}`));
          }
        } else {
          if (verbose) {
            console.log(
              chalk.yellow(`  Warning: ${item} not found in local source`)
            );
          }
        }
      }
    } else {
      // Copy entire directory
      try {
        // Remove target directory if it exists to avoid conflicts
        if (fs.existsSync(targetPath)) {
          if (verbose) {
            console.log(
              chalk.gray(`  Removing existing target directory: ${targetPath}`)
            );
          }
          await fs.remove(targetPath);
        }

        await fs.copy(localSourcePath, targetPath);

        // Track all copied files
        const targetContents = await fs.readdir(targetPath);
        for (const item of targetContents) {
          const itemPath = path.join(targetPath, item);
          const relativePath = path.relative(process.cwd(), itemPath);
          if (dependencies.trackInstalledFile) {
            const fileInfo = await dependencies.trackInstalledFile(
              relativePath,
              dependencies
            );
            trackedFiles.push(fileInfo);
          } else {
            trackedFiles.push({ path: relativePath });
          }
        }

        if (verbose) {
          console.log(chalk.gray(`  Copied entire directory: ${sourcePath}`));
        }
      } catch (copyError) {
        if (verbose) {
          console.log(
            chalk.red(`  Error copying directory: ${copyError.message}`)
          );
        }
        throw new Error(`Failed to copy directory: ${copyError.message}`);
      }
    }
  }

  return {
    success: true,
    files: trackedFiles
  };
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
