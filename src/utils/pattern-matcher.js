import picomatch from 'picomatch';
import fs from 'fs-extra';
import path from 'path';

/**
 * Expand patterns to matching filenames
 * @param {string[]} patterns - Array of glob patterns, regex patterns, or specific filenames
 * @param {string} sourceDir - Source directory to search in
 * @param {boolean} recursive - Whether to search recursively
 * @returns {Promise<string[]>} Array of matching filenames
 */
export async function expandPatterns(patterns, sourceDir, recursive = true) {
  const allFiles = await getAllFiles(sourceDir, recursive);
  const matches = new Set();

  for (const pattern of patterns) {
    if (typeof pattern !== 'string') {
      throw new Error(`Invalid pattern: ${pattern}. Must be a string.`);
    }

    if (isRegexPattern(pattern)) {
      // Handle regex patterns: /pattern/flags
      const regex = parseRegexPattern(pattern);
      for (const file of allFiles) {
        if (regex.test(file)) {
          matches.add(file);
        }
      }
    } else if (isGlobPattern(pattern)) {
      // Handle glob patterns
      const matcher = picomatch(pattern, {
        dot: true,
        globstar: true,
        basename: false
      });
      for (const file of allFiles) {
        if (matcher(file)) {
          matches.add(file);
        }
      }
    } else {
      // Handle specific filenames
      if (allFiles.includes(pattern)) {
        matches.add(pattern);
      }
    }
  }

  return Array.from(matches);
}

/**
 * Check if a pattern is a regex pattern (starts and ends with /)
 * @param {string} pattern - Pattern to check
 * @returns {boolean} True if it's a regex pattern
 */
function isRegexPattern(pattern) {
  return pattern.startsWith('/') && pattern.includes('/') && pattern.length > 1;
}

/**
 * Check if a pattern contains glob characters
 * @param {string} pattern - Pattern to check
 * @returns {boolean} True if it's a glob pattern
 */
function isGlobPattern(pattern) {
  return (
    pattern.includes('*') ||
    pattern.includes('?') ||
    pattern.includes('[') ||
    pattern.includes('{')
  );
}

/**
 * Parse a regex pattern string into a RegExp object
 * @param {string} pattern - Regex pattern string like "/pattern/flags"
 * @returns {RegExp} Compiled regex object
 * @throws {Error} If pattern is invalid
 */
function parseRegexPattern(pattern) {
  const match = pattern.match(/^\/(.*)\/([gimuy]*)$/);
  if (!match) {
    throw new Error(
      `Invalid regex pattern: ${pattern}. Must be in format /pattern/flags`
    );
  }
  try {
    return new RegExp(match[1], match[2]);
  } catch (error) {
    throw new Error(`Invalid regex pattern: ${pattern}. ${error.message}`);
  }
}

/**
 * Get all files in a directory, optionally recursively
 * @param {string} dir - Directory to search
 * @param {boolean} recursive - Whether to search subdirectories
 * @returns {Promise<string[]>} Array of relative file paths
 */
async function getAllFiles(dir, recursive = true) {
  const files = [];

  try {
    const items = await fs.readdir(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);

      if (stat.isFile()) {
        files.push(item);
      } else if (stat.isDirectory() && recursive) {
        const subFiles = await getAllFiles(fullPath, true);
        files.push(...subFiles.map((f) => path.join(item, f)));
      }
    }
  } catch (_error) {
    // Directory doesn't exist or can't be read
    return [];
  }

  return files;
}

/**
 * Validate that patterns are correctly formatted
 * @param {string[]} patterns - Array of patterns to validate
 * @throws {Error} If any pattern is invalid
 */
export function validatePatterns(patterns) {
  for (const pattern of patterns) {
    if (typeof pattern !== 'string') {
      throw new Error(`Invalid pattern: ${pattern}. Must be a string.`);
    }

    if (isRegexPattern(pattern)) {
      try {
        parseRegexPattern(pattern);
      } catch (error) {
        throw new Error(`Invalid regex pattern: ${pattern}. ${error.message}`);
      }
    }
  }
}
