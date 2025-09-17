import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { validatePatterns } from './utils/pattern-matcher.js';

/**
 * Validate current directory for common project indicators.
 * Checks for typical files and directories that indicate a project structure.
 * Returns information about what was found and what was missing.
 *
 * @param {boolean} verbose - Whether to show detailed output
 * @returns {Promise<Object>} Validation result with found/missing indicators
 */
async function validateDirectory(verbose = false) {
  const currentDir = process.cwd();
  const indicators = [
    'package.json',
    'composer.json',
    '.git',
    'README.md',
    'README.txt'
  ];

  const found = [];
  const missing = [];

  // Check each indicator file/directory
  for (const indicator of indicators) {
    const indicatorPath = path.join(currentDir, indicator);
    if (await fs.pathExists(indicatorPath)) {
      found.push(indicator);
    } else {
      missing.push(indicator);
    }
  }

  if (verbose) {
    console.log(chalk.blue('📁 Directory validation:'));
    console.log(chalk.green(`  Found: ${found.join(', ')}`));
    console.log(chalk.gray(`  Missing: ${missing.join(', ')}`));
  }

  return {
    isValid: found.length > 0,
    found,
    missing
  };
}

/**
 * Check if directory appears to be a valid project.
 * Validates the current directory and provides warnings if it doesn't look like a project.
 * Returns true if at least one project indicator is found.
 *
 * @param {boolean} verbose - Whether to show detailed output
 * @returns {Promise<boolean>} True if directory appears to be a valid project
 */
async function isProjectDirectory(verbose = false) {
  const validation = await validateDirectory(verbose);

  if (!validation.isValid) {
    console.log(
      chalk.yellow(
        "\n⚠️  Warning: This directory doesn't appear to be a project directory."
      )
    );
    console.log(
      chalk.yellow(
        '   Expected to find at least one of: package.json, composer.json, .git, README.md'
      )
    );
    console.log(
      chalk.yellow(
        '   You can continue, but some features may not work as expected.'
      )
    );
  }

  return validation.isValid;
}

/**
 * Validate file exists and is readable.
 * Checks if the specified file exists and can be read by the current user.
 *
 * @param {string} filePath - Path to the file to validate
 * @param {string} description - Human-readable description of the file for error messages
 * @returns {Promise<boolean>} True if file exists and is readable
 * @throws {Error} If file doesn't exist or is not readable
 */
async function validateFile(filePath, description = 'file') {
  if (!(await fs.pathExists(filePath))) {
    throw new Error(`${description} not found: ${filePath}`);
  }

  try {
    await fs.access(filePath, fs.constants.R_OK);
  } catch (_error) {
    throw new Error(`${description} not readable: ${filePath}`);
  }

  return true;
}

/**
 * Validate directory exists and is writable.
 * Checks if the specified directory exists (creates it if it doesn't) and is writable.
 *
 * @param {string} dirPath - Path to the directory to validate
 * @param {string} description - Human-readable description of the directory for error messages
 * @returns {Promise<boolean>} True if directory exists and is writable
 * @throws {Error} If directory cannot be created or is not writable
 */
async function validateDirectoryWritable(dirPath, description = 'directory') {
  if (!(await fs.pathExists(dirPath))) {
    try {
      await fs.ensureDir(dirPath);
    } catch (_error) {
      throw new Error(`Cannot create ${description}: ${dirPath}`);
    }
  }

  try {
    await fs.access(dirPath, fs.constants.W_OK);
  } catch (_error) {
    throw new Error(`${description} not writable: ${dirPath}`);
  }

  return true;
}

/**
 * Check if a file contains specific content.
 * Validates that the file exists and contains the required content string.
 *
 * @param {string} filePath - Path to the file to check
 * @param {string} requiredContent - Content that must be present in the file
 * @param {string} description - Human-readable description of the file for error messages
 * @returns {Promise<boolean>} True if file contains the required content
 * @throws {Error} If file doesn't exist or doesn't contain required content
 */
async function validateFileContent(
  filePath,
  requiredContent,
  description = 'file'
) {
  await validateFile(filePath, description);

  const content = await fs.readFile(filePath, 'utf8');
  if (!content.includes(requiredContent)) {
    throw new Error(
      `Required content not found in ${description}: ${requiredContent}`
    );
  }

  return true;
}

/**
 * Validate task configuration for copy-files and remote-copy-files tasks.
 * Checks for valid patterns and proper configuration.
 *
 * @param {Object} task - Task configuration object
 * @throws {Error} If task configuration is invalid
 */
function validateTaskConfig(task) {
  if (task.type === 'copy-files' || task.type === 'remote-copy-files') {
    if (task.items) {
      if (Array.isArray(task.items)) {
        // Validate patterns in array format
        try {
          validatePatterns(task.items);
        } catch (error) {
          throw new Error(
            `Invalid pattern in ${task.type} task: ${error.message}`
          );
        }
      } else if (typeof task.items === 'object') {
        // Object format - no pattern support (for renaming)
        for (const [key, value] of Object.entries(task.items)) {
          if (typeof key !== 'string' || typeof value !== 'string') {
            throw new Error(
              `Invalid item in ${task.type} task: keys and values must be strings for renaming`
            );
          }
          // Check if key contains pattern characters
          if (
            key.includes('*') ||
            key.includes('?') ||
            key.includes('[') ||
            key.includes('{') ||
            key.startsWith('/')
          ) {
            throw new Error(
              `Wildcard patterns not supported in object format (renaming) for ${task.type} task. Use array format for patterns.`
            );
          }
        }
      } else {
        throw new Error(
          `Invalid items format in ${task.type} task: must be array or object`
        );
      }
    }
  }
}

/**
 * Validate URL format for task links.
 * Checks if the URL has a valid format (starts with http:// or https://).
 *
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL format is valid
 */
function validateUrl(url) {
  if (typeof url !== 'string') {
    return false;
  }

  // Basic URL validation - must start with http:// or https://
  const urlPattern = /^https?:\/\/.+/;
  return urlPattern.test(url);
}

/**
 * Validate task configuration for all task types.
 * Checks for valid patterns, proper configuration, and URL format.
 *
 * @param {Object} task - Task configuration object
 * @throws {Error} If task configuration is invalid
 */
function validateTaskConfigWithLinks(task) {
  // Validate existing task configuration
  validateTaskConfig(task);

  // Validate link if present
  if (task.link !== undefined) {
    if (!validateUrl(task.link)) {
      throw new Error(
        `Invalid link URL in ${task.type} task: must be a valid HTTP/HTTPS URL`
      );
    }
  }
}

export {
  validateDirectory,
  isProjectDirectory,
  validateFile,
  validateDirectoryWritable,
  validateFileContent,
  validateTaskConfig,
  validateUrl,
  validateTaskConfigWithLinks
};
