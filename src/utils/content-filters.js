/**
 * Content filtering utilities for copy-files and remote-copy-files tasks
 */

import path from 'path';

// Filter types
const FILTER_TYPES = {
  FRONTMATTER_REMOVAL: 'frontmatter-removal',
  EXTRACT_CONTENT: 'extract-content',
  LINE_RANGE: 'line-range',
  REMOVE_LINES: 'remove-lines'
};

// Common regex patterns library
const COMMON_PATTERNS = {
  QUINTUPLE_BACKTICKS: '`````.*?`````',
  TRIPLE_BACKTICKS: '```.*?```',
  YAML_FRONTMATTER: '^---\\n.*?\\n---',
  COMMENT_LINES: '^#.*$',
  EMPTY_LINES: '^\\s*$'
  // Add more patterns as needed
};

/**
 * Remove YAML frontmatter from content
 */
function removeFrontmatter(content) {
  // Remove ---yaml ... --- blocks (including any trailing whitespace/newlines)
  return content.replace(/^---\n.*?\n---\s*\n?/s, '');
}

/**
 * Extract content using regex patterns
 */
function extractContent(content, pattern, flags = '', group = 0) {
  try {
    const regex = new RegExp(pattern, flags);
    const match = regex.exec(content);

    if (match && match[group] !== undefined) {
      return match[group].trim();
    }

    return content; // Return original if no match
  } catch (error) {
    throw new Error(`Invalid regex pattern: ${pattern} - ${error.message}`);
  }
}

/**
 * Extract specific line ranges
 */
function extractLineRange(content, start, end) {
  const lines = content.split('\n');
  const startIndex = Math.max(0, start - 1);
  const endIndex = Math.min(lines.length, end);

  if (startIndex >= endIndex) {
    return '';
  }

  return lines.slice(startIndex, endIndex).join('\n');
}

/**
 * Remove lines matching patterns
 */
function removeLines(content, pattern, flags = '') {
  try {
    const regex = new RegExp(pattern, flags);
    const lines = content.split('\n');
    const filteredLines = lines.filter((line) => !regex.test(line));
    return filteredLines.join('\n');
  } catch (error) {
    throw new Error(`Invalid regex pattern: ${pattern} - ${error.message}`);
  }
}

/**
 * Validate filter configuration
 */
function validateFilterConfig(filters) {
  const errors = [];

  for (const [index, filter] of filters.entries()) {
    // Validate filter type
    if (!Object.values(FILTER_TYPES).includes(filter.type)) {
      errors.push(
        `Filter ${index + 1}: Invalid filter type '${filter.type}'. Supported types: ${Object.values(FILTER_TYPES).join(', ')}`
      );
    }

    // Validate required parameters
    switch (filter.type) {
      case FILTER_TYPES.EXTRACT_CONTENT:
        if (!filter.pattern) {
          errors.push(
            `Filter ${index + 1}: Missing required parameter 'pattern' for filter type 'extract-content'`
          );
        }
        break;
      case FILTER_TYPES.LINE_RANGE:
        if (filter.start === undefined || filter.end === undefined) {
          errors.push(
            `Filter ${index + 1}: Missing required parameters 'start' and 'end' for filter type 'line-range'`
          );
        } else if (filter.start > filter.end) {
          errors.push(
            `Filter ${index + 1}: Line range start (${filter.start}) must be less than or equal to end (${filter.end})`
          );
        }
        break;
      case FILTER_TYPES.REMOVE_LINES:
        if (!filter.pattern) {
          errors.push(
            `Filter ${index + 1}: Missing required parameter 'pattern' for filter type 'remove-lines'`
          );
        }
        break;
    }

    // Validate regex patterns (basic syntax check)
    if (filter.pattern) {
      try {
        new RegExp(filter.pattern, filter.flags || '');
      } catch (error) {
        errors.push(
          `Filter ${index + 1}: Invalid regex pattern '${filter.pattern}' - ${error.message}`
        );
      }
    }
  }

  return errors;
}

/**
 * Check if file should be processed by filters
 */
function shouldProcessFile(filePath) {
  const textExtensions = [
    '.md',
    '.txt',
    '.yml',
    '.yaml',
    '.json',
    '.js',
    '.ts',
    '.py',
    '.php',
    '.rb',
    '.go',
    '.rs',
    '.java',
    '.c',
    '.cpp',
    '.h',
    '.hpp'
  ];
  const ext = path.extname(filePath).toLowerCase();
  return textExtensions.includes(ext);
}

/**
 * Preview content after applying filters (without modifying files)
 */
async function previewContent(content, filters, _filePath) {
  let processedContent = content;

  for (const filter of filters) {
    try {
      switch (filter.type) {
        case 'frontmatter-removal':
          processedContent = removeFrontmatter(processedContent);
          break;
        case 'extract-content':
          processedContent = extractContent(
            processedContent,
            filter.pattern,
            filter.flags || '',
            filter.group || 0
          );
          break;
        case 'line-range':
          processedContent = extractLineRange(
            processedContent,
            filter.start,
            filter.end
          );
          break;
        case 'remove-lines':
          processedContent = removeLines(
            processedContent,
            filter.pattern,
            filter.flags || ''
          );
          break;
        default:
          console.log(`Unknown filter type: ${filter.type}`);
      }
    } catch (error) {
      console.log(`Filter ${filter.type} failed: ${error.message}`);
    }
  }

  return processedContent;
}

/**
 * Process content through multiple filters sequentially
 */
async function processContent(content, filters, filePath, verbose = false) {
  let processedContent = content;
  const results = {
    successful: 0,
    failed: 0,
    warnings: []
  };

  for (const [index, filter] of filters.entries()) {
    try {
      const beforeLength = processedContent.length;

      switch (filter.type) {
        case 'frontmatter-removal':
          processedContent = removeFrontmatter(processedContent);
          break;
        case 'extract-content':
          processedContent = extractContent(
            processedContent,
            filter.pattern,
            filter.flags || '',
            filter.group || 0
          );
          break;
        case 'line-range':
          processedContent = extractLineRange(
            processedContent,
            filter.start,
            filter.end
          );
          break;
        case 'remove-lines':
          processedContent = removeLines(
            processedContent,
            filter.pattern,
            filter.flags || ''
          );
          break;
        default:
          if (verbose) {
            console.log(`Unknown filter type: ${filter.type}`);
          }
      }

      const afterLength = processedContent.length;
      results.successful++;

      if (verbose) {
        console.log(
          `  ✅ Filter ${index + 1} (${filter.type}): ${beforeLength} → ${afterLength} characters`
        );
      }

      // Check if filter produced empty content
      if (processedContent.length === 0 && beforeLength > 0) {
        const warning = `Filter ${index + 1} (${filter.type}) produced empty content, keeping original`;
        results.warnings.push(warning);
        if (verbose) {
          console.log(`  ⚠️  ${warning}`);
        }
        processedContent = content; // Return original content
      }
    } catch (error) {
      results.failed++;
      const warning = `Filter ${index + 1} (${filter.type}) failed: ${error.message}`;
      results.warnings.push(warning);

      if (verbose) {
        console.log(`  ❌ ${warning}`);
      }
      // Continue with other filters
    }
  }

  // Log summary if there were failures
  if (results.failed > 0 && verbose) {
    console.log(
      `  📊 Filter Summary: ${results.successful} successful, ${results.failed} failed`
    );
  }

  return processedContent;
}

export {
  FILTER_TYPES,
  COMMON_PATTERNS,
  removeFrontmatter,
  extractContent,
  extractLineRange,
  removeLines,
  validateFilterConfig,
  shouldProcessFile,
  previewContent,
  processContent
};
