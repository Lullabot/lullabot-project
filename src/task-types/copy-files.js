import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { getFilesFromGit } from '../git-operations.js';
import { expandPatterns } from '../utils/pattern-matcher.js';

/**
 * Copy files from Git repository to the appropriate location.
 * This function handles copying files from the Git repository using the source path
 * specified in the task configuration.
 *
 * @param {string} sourcePath - Source path in the repository (from task config)
 * @param {string} targetPath - Target path where files should be copied
 * @param {boolean} verbose - Whether to show detailed output
 * @param {string[]|Object} items - Optional array of specific items to copy or object for renaming
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
    let trackedFiles = [];
    try {
      const gitResult = await getFilesFromGit(
        sourcePath,
        targetPath,
        verbose,
        items,
        dependencies
      );

      if (verbose) {
        console.log(chalk.gray(`Git operation result: ${gitResult}`));
      }

      // Use the tracked files from the git operation result
      if (gitResult && gitResult.files) {
        trackedFiles = gitResult.files;
        if (verbose) {
          console.log(
            chalk.gray(
              `Tracked files from git operation: ${JSON.stringify(trackedFiles)}`
            )
          );
        }
      } else {
        if (verbose) {
          console.log(
            chalk.yellow(
              `No tracked files in git operation result: ${JSON.stringify(gitResult)}`
            )
          );
        }
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
 * Enhanced to support file renaming via object syntax.
 *
 * @param {string} sourceDir - Source directory path
 * @param {string} targetDir - Target directory path
 * @param {boolean} verbose - Whether to show detailed output
 * @param {string[]|Object} items - Optional array of specific items to copy or object for renaming
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

  // Handle items as array or object for renaming
  let itemsToCopy = [];
  let renameMap = {};

  if (Array.isArray(items)) {
    // Expand patterns to actual filenames
    itemsToCopy = await expandPatterns(items, sourceDir, true);
  } else if (items && typeof items === 'object') {
    // Object format - no pattern support (for renaming)
    itemsToCopy = Object.keys(items);
    renameMap = items;
  } else {
    // No specific items, copy all files in the directory
    const allItems = await fs.readdir(sourceDir);
    itemsToCopy.push(...allItems);
  }

  const trackedFiles = [];

  for (const fileName of itemsToCopy) {
    const sourceItem = path.join(sourceDir, fileName);
    const targetFileName = renameMap[fileName] || fileName;
    const targetItem = path.join(targetDir, targetFileName);

    // Check if the item exists in the source directory
    try {
      await fs.access(sourceItem);
    } catch (_error) {
      if (verbose) {
        console.log(
          chalk.yellow(`  Warning: ${fileName} not found in source directory`)
        );
      }
      continue;
    }

    if (verbose) {
      const renameInfo = renameMap[fileName]
        ? ` (renamed to ${targetFileName})`
        : '';
      console.log(chalk.gray(`  Copying ${fileName}${renameInfo}`));
    }

    // Copy the file or directory
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
  }

  if (verbose) {
    console.log(chalk.green(`✅ Copied files to ${targetDir}`));
    console.log(chalk.gray(`Tracked ${trackedFiles.length} files`));
  }

  return trackedFiles;
}

/**
 * Execute the copy-files task.
 * Handles copying files from Git repository or local filesystem based on source path.
 *
 * @param {Object} task - Task configuration object
 * @param {string} tool - The tool identifier (unused but kept for interface consistency)
 * @param {string} projectType - The project type (unused but kept for interface consistency)
 * @param {boolean} verbose - Whether to show detailed output
 * @param {Object} dependencies - Injected dependencies for file tracking
 * @returns {Promise<Object>} Task execution result
 */
async function execute(
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
    const items = task.items || null;
    const result = await copyFiles(
      source,
      target,
      verbose,
      items,
      dependencies
    );
    return result;
  }
}

export { execute, copyFiles };
