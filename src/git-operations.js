import { simpleGit } from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { expandPatterns } from './utils/pattern-matcher.js';
import {
  processContent,
  shouldProcessFile,
  validateFilterConfig
} from './utils/content-filters.js';

const execAsync = promisify(exec);

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
    // If useLocalFiles is true, try local files first (skip Git operations entirely)
    if (dependencies.useLocalFiles) {
      if (verbose) {
        console.log(
          chalk.yellow(`Using local files (--local flag detected)...`)
        );
      }
      try {
        return await copyFromLocalFiles(
          sourcePath,
          targetPath,
          verbose,
          items,
          dependencies
        );
      } catch (error) {
        if (verbose) {
          console.log(
            chalk.yellow(
              `Local files not found, falling back to Git: ${error.message}`
            )
          );
        }
        // Fall through to Git logic
      }
    }

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

    // Check if source exists in Git
    if (!fs.existsSync(fullSourcePath)) {
      throw new Error(`Source path ${sourcePath} not found in repository`);
    }

    // Create target directory if it doesn't exist
    if (verbose) {
      console.log(chalk.gray(`Copying files to ${targetPath}...`));
    }

    await fs.ensureDir(path.dirname(targetPath));

    // Copy directory or file
    if (items && Array.isArray(items) && items.length > 0) {
      // Copy only specified items (array syntax)
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
    } else if (items && typeof items === 'object' && !Array.isArray(items)) {
      // Copy and rename items (object syntax: { "source.md": "target.md" })
      if (verbose) {
        console.log(
          chalk.gray(`Copying and renaming items: ${JSON.stringify(items)}`)
        );
      }

      // Create target directory if it doesn't exist
      await fs.ensureDir(targetPath);

      // Copy each item with renaming
      for (const [sourceItem, targetItem] of Object.entries(items)) {
        const sourceItemPath = path.join(fullSourcePath, sourceItem);
        const targetItemPath = path.join(targetPath, targetItem);

        if (fs.existsSync(sourceItemPath)) {
          await fs.copy(sourceItemPath, targetItemPath);
          if (verbose) {
            console.log(
              chalk.gray(`Copied ${sourceItem} to ${targetItemPath}`)
            );
          }
        } else {
          if (verbose) {
            console.log(
              chalk.yellow(`Warning: Item ${sourceItem} not found in source`)
            );
          }
        }
      }
    } else {
      // Check if source is a file or directory
      const sourceStats = await fs.stat(fullSourcePath);
      if (sourceStats.isFile()) {
        // Source is a file - copy it to target directory with the same filename
        const fileName = path.basename(fullSourcePath);
        const targetFilePath = path.join(targetPath, fileName);
        await fs.copy(fullSourcePath, targetFilePath);
        if (verbose) {
          console.log(
            chalk.gray(`Copied file ${fileName} to ${targetFilePath}`)
          );
        }
      } else {
        // Copy entire directory
        await fs.copy(fullSourcePath, targetPath);
      }
    }

    if (verbose) {
      console.log(
        chalk.gray(`Successfully copied ${sourcePath} to ${targetPath}`)
      );
    }

    // Track the copied files
    const trackedFiles = [];

    if (dependencies.trackInstalledFile) {
      // Track files based on what was copied
      if (items && Array.isArray(items) && items.length > 0) {
        // Track specific items (array syntax)
        for (const item of items) {
          const targetItemPath = path.join(targetPath, item);
          if (fs.existsSync(targetItemPath)) {
            const relativePath = path.relative(process.cwd(), targetItemPath);
            const fileInfo = await dependencies.trackInstalledFile(
              relativePath,
              dependencies
            );
            trackedFiles.push(fileInfo);
          }
        }
      } else if (items && typeof items === 'object' && !Array.isArray(items)) {
        // Track renamed items (object syntax)
        for (const [, targetItem] of Object.entries(items)) {
          const targetItemPath = path.join(targetPath, targetItem);
          if (fs.existsSync(targetItemPath)) {
            const relativePath = path.relative(process.cwd(), targetItemPath);
            const fileInfo = await dependencies.trackInstalledFile(
              relativePath,
              dependencies
            );
            trackedFiles.push(fileInfo);
          }
        }
      } else {
        // Check if we copied a single file or entire directory
        const sourceStats = await fs.stat(fullSourcePath);
        if (sourceStats.isFile()) {
          // Track the single file that was copied
          const fileName = path.basename(fullSourcePath);
          const targetFilePath = path.join(targetPath, fileName);
          if (fs.existsSync(targetFilePath)) {
            const relativePath = path.relative(process.cwd(), targetFilePath);
            const fileInfo = await dependencies.trackInstalledFile(
              relativePath,
              dependencies
            );
            trackedFiles.push(fileInfo);
          }
        } else {
          // Track only the files that were actually copied from the source directory
          if (fs.existsSync(fullSourcePath)) {
            const sourceContents = await fs.readdir(fullSourcePath);
            for (const item of sourceContents) {
              const sourceItemPath = path.join(fullSourcePath, item);
              const targetItemPath = path.join(targetPath, item);

              // Only track if the file exists in both source and target (was actually copied)
              if (
                fs.existsSync(sourceItemPath) &&
                fs.existsSync(targetItemPath)
              ) {
                const relativePath = path.relative(
                  process.cwd(),
                  targetItemPath
                );
                const fileInfo = await dependencies.trackInstalledFile(
                  relativePath,
                  dependencies
                );
                trackedFiles.push(fileInfo);
              }
            }
          }
        }
      }

      return { files: trackedFiles };
    } else {
      // Fallback: track files without trackInstalledFile
      if (items && Array.isArray(items) && items.length > 0) {
        // Track specific items (array syntax)
        for (const item of items) {
          const targetItemPath = path.join(targetPath, item);
          if (fs.existsSync(targetItemPath)) {
            const relativePath = path.relative(process.cwd(), targetItemPath);
            trackedFiles.push({ path: relativePath });
          }
        }
      } else if (items && typeof items === 'object' && !Array.isArray(items)) {
        // Track renamed items (object syntax)
        for (const [, targetItem] of Object.entries(items)) {
          const targetItemPath = path.join(targetPath, targetItem);
          if (fs.existsSync(targetItemPath)) {
            const relativePath = path.relative(process.cwd(), targetItemPath);
            trackedFiles.push({ path: relativePath });
          }
        }
      } else {
        // Check if we copied a single file or entire directory
        const sourceStats = await fs.stat(fullSourcePath);
        if (sourceStats.isFile()) {
          // Track the single file that was copied
          const fileName = path.basename(fullSourcePath);
          const targetFilePath = path.join(targetPath, fileName);
          if (fs.existsSync(targetFilePath)) {
            const relativePath = path.relative(process.cwd(), targetFilePath);
            trackedFiles.push({ path: relativePath });
          }
        } else {
          // Track only the files that were actually copied from the source directory
          if (fs.existsSync(fullSourcePath)) {
            const sourceContents = await fs.readdir(fullSourcePath);
            for (const item of sourceContents) {
              const sourceItemPath = path.join(fullSourcePath, item);
              const targetItemPath = path.join(targetPath, item);

              // Only track if the file exists in both source and target (was actually copied)
              if (
                fs.existsSync(sourceItemPath) &&
                fs.existsSync(targetItemPath)
              ) {
                const relativePath = path.relative(
                  process.cwd(),
                  targetItemPath
                );
                trackedFiles.push({ path: relativePath });
              }
            }
          }
        }
      }
    }

    return { files: trackedFiles };
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
      // Copy only specified items (array syntax)
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
    } else if (items && typeof items === 'object' && !Array.isArray(items)) {
      // Copy and rename items (object syntax: { "source.md": "target.md" })
      if (verbose) {
        console.log(
          chalk.gray(`Copying and renaming items: ${JSON.stringify(items)}`)
        );
      }

      await fs.ensureDir(targetPath);

      for (const [sourceItem, targetItem] of Object.entries(items)) {
        const sourceItemPath = path.join(localSourcePath, sourceItem);
        const targetItemPath = path.join(targetPath, targetItem);

        if (fs.existsSync(sourceItemPath)) {
          await fs.copy(sourceItemPath, targetItemPath);

          // Track the file
          const relativePath = path.relative(process.cwd(), targetItemPath);
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
            console.log(chalk.gray(`  Copied: ${sourceItem} -> ${targetItem}`));
          }
        } else {
          if (verbose) {
            console.log(
              chalk.yellow(`  Warning: ${sourceItem} not found in local source`)
            );
          }
        }
      }
    } else {
      // Copy entire directory - preserve pre-existing files
      await fs.ensureDir(targetPath);

      // Get list of files in source directory
      const sourceContents = await fs.readdir(localSourcePath);

      for (const item of sourceContents) {
        const sourceItem = path.join(localSourcePath, item);
        const targetItem = path.join(targetPath, item);

        // Copy the file
        await fs.copy(sourceItem, targetItem);

        // Track only the files that were actually copied from source
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
      }

      if (verbose) {
        console.log(chalk.gray(`  Copied entire directory: ${sourcePath}`));
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

// ============================================================================
// Remote Repository Functions for Prompt Library Integration
// ============================================================================

/**
 * Clone a remote repository to a temporary directory.
 *
 * @param {Object} repository - Repository configuration object
 * @param {string} repository.url - Repository URL
 * @param {string} repository.type - Type of target ('branch' or 'tag')
 * @param {string} repository.target - Target branch or tag name
 * @param {boolean} verbose - Whether to show detailed output
 * @returns {Promise<string>} Path to the temporary directory
 */
async function cloneRemoteRepository(repository, verbose) {
  const { url, target } = repository;

  // Create temporary directory
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lullabot-'));

  try {
    // Shallow clone for efficiency
    const cloneCommand = `git clone --depth 1 --branch ${target} ${url} .`;
    await execAsync(cloneCommand, { cwd: tempDir, timeout: 30000 });

    if (verbose) {
      console.log(
        chalk.green(`✅ Successfully cloned repository to ${tempDir}`)
      );
    }

    return tempDir;
  } catch (error) {
    // Clean up temp directory on failure
    await fs.remove(tempDir).catch(() => {});

    if (error.code === 'ENOTFOUND') {
      throw new Error(`Repository not found: ${url}`);
    } else if (error.message.includes('not found')) {
      throw new Error(`Branch/tag '${target}' not found in repository: ${url}`);
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error(`Timeout while cloning repository: ${url}`);
    } else {
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }
}

// Clone caching for multiple tasks
const cloneCache = new Map();

/**
 * Get or clone a repository with caching support.
 *
 * @param {Object} repository - Repository configuration object
 * @param {boolean} verbose - Whether to show detailed output
 * @returns {Promise<string>} Path to the temporary directory
 */
async function getOrCloneRepository(repository, verbose) {
  const cacheKey = `${repository.url}:${repository.type}:${repository.target}`;

  if (cloneCache.has(cacheKey)) {
    return cloneCache.get(cacheKey);
  }

  const tempDir = await cloneRemoteRepository(repository, verbose);
  cloneCache.set(cacheKey, tempDir);
  return tempDir;
}

/**
 * Clean up all cloned repositories.
 */
async function cleanupAllClones() {
  for (const tempDir of cloneCache.values()) {
    await fs.remove(tempDir);
  }
  cloneCache.clear();
}

/**
 * Validate that a repository is accessible.
 *
 * @param {Object} repository - Repository configuration object
 * @param {boolean} verbose - Whether to show detailed output
 * @returns {Promise<boolean>} True if repository is accessible
 */
async function validateRepository(repository, verbose) {
  try {
    // Test if repository is accessible
    await execAsync(`git ls-remote --heads ${repository.url}`, {
      timeout: 10000
    });

    if (verbose) {
      console.log(
        chalk.green(`✅ Repository validation successful: ${repository.url}`)
      );
    }
    return true;
  } catch (error) {
    if (verbose) {
      console.log(chalk.red(`Repository validation failed: ${error.message}`));
    }

    if (error.code === 'ENOTFOUND') {
      throw new Error(`Repository not found: ${repository.url}`);
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error(`Timeout while validating repository: ${repository.url}`);
    } else {
      throw new Error(
        `Cannot access repository: ${repository.url} - ${error.message}`
      );
    }
  }
}

/**
 * Copy files from a remote repository with smart filtering.
 *
 * @param {string} tempDir - Temporary directory containing cloned repository
 * @param {string} sourcePath - Source path within the repository
 * @param {string} targetPath - Target path for copied files
 * @param {boolean} verbose - Whether to show detailed output
 * @param {Object} dependencies - Injected dependencies for file tracking
 * @param {Array|Object} items - Optional array of specific items to copy or object for renaming
 * @returns {Promise<Object[]>} Array of file tracking objects
 */
async function copyFilesFromRemote(
  tempDir,
  sourcePath,
  targetPath,
  verbose,
  dependencies,
  items = null
) {
  const fullSourcePath = path.join(tempDir, sourcePath);

  // Validate source path exists
  try {
    await fs.access(fullSourcePath);
  } catch (_error) {
    throw new Error(`Source path not found in repository: ${sourcePath}`);
  }

  // Smart filtering logic with pattern support
  let filesToCopy = [];
  if (items && (Array.isArray(items) || Object.keys(items).length > 0)) {
    if (Array.isArray(items)) {
      // Expand patterns to actual filenames
      filesToCopy = await expandPatterns(items, fullSourcePath, true);
    } else {
      // Object format - no pattern support (for renaming)
      filesToCopy = Object.keys(items);
    }
  } else {
    // No items - copy only .md files
    const allFiles = await fs.readdir(fullSourcePath);
    filesToCopy = allFiles.filter((file) => file.endsWith('.md'));
  }

  // Handle items as array or object for renaming
  const renameMap = Array.isArray(items) ? {} : items || {};

  const trackedFiles = [];
  let targetDirCreated = false;

  for (const fileName of filesToCopy) {
    const sourceItem = path.join(fullSourcePath, fileName);
    const targetFileName = renameMap[fileName] || fileName;
    const targetItem = path.join(targetPath, targetFileName);

    // Check if source file exists
    try {
      await fs.access(sourceItem);
    } catch (_error) {
      if (verbose) {
        console.log(
          chalk.yellow(`Warning: ${fileName} not found in ${sourcePath}`)
        );
      }
      continue;
    }

    // Create target directory only when we actually have a file to copy
    if (!targetDirCreated) {
      await fs.ensureDir(targetPath);
      targetDirCreated = true;
    }

    // Check if we should apply content filters
    const taskConfig = dependencies.task || {};
    const shouldFilter =
      taskConfig.filters &&
      taskConfig.filters.length > 0 &&
      shouldProcessFile(targetItem);

    if (shouldFilter) {
      // Validate filter configuration
      const validationErrors = validateFilterConfig(taskConfig.filters);
      if (validationErrors.length > 0) {
        if (verbose) {
          console.log(chalk.red(`Filter validation errors for ${fileName}:`));
          validationErrors.forEach((error) =>
            console.log(chalk.red(`  ${error}`))
          );
        }
        throw new Error(
          `Invalid filter configuration: ${validationErrors.join(', ')}`
        );
      }

      if (verbose) {
        console.log(
          chalk.gray(
            `  Applying ${taskConfig.filters.length} content filters to ${fileName}`
          )
        );
      }

      // Read content and apply filters
      const content = await fs.readFile(sourceItem, 'utf8');
      const processedContent = await processContent(
        content,
        taskConfig.filters,
        sourceItem,
        verbose
      );

      // Write filtered content
      await fs.writeFile(targetItem, processedContent);

      if (verbose) {
        console.log(chalk.green(`  ✅ Content filtered: ${fileName}`));
      }
    } else {
      // Copy the file with preserved permissions (no filtering)
      await fs.copy(sourceItem, targetItem, { preserveTimestamps: true });
    }

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
  }

  // Fail gracefully if no files were copied
  if (trackedFiles.length === 0) {
    if (verbose) {
      console.log(
        chalk.yellow('No files were copied from the remote repository')
      );
    }
  }

  return trackedFiles;
}

// Export the new functions
export {
  getOrCloneRepository,
  copyFilesFromRemote,
  validateRepository,
  cleanupAllClones
};
