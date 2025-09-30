/**
 * Unit tests for content filtering functionality
 */

import {
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
} from '../../src/utils/content-filters.js';

describe('Content Filters', () => {
  describe('FILTER_TYPES', () => {
    test('should have all required filter types', () => {
      expect(FILTER_TYPES.FRONTMATTER_REMOVAL).toBe('frontmatter-removal');
      expect(FILTER_TYPES.EXTRACT_CONTENT).toBe('extract-content');
      expect(FILTER_TYPES.LINE_RANGE).toBe('line-range');
      expect(FILTER_TYPES.REMOVE_LINES).toBe('remove-lines');
    });
  });

  describe('COMMON_PATTERNS', () => {
    test('should have all required patterns', () => {
      expect(COMMON_PATTERNS.QUINTUPLE_BACKTICKS).toBe('`````.*?`````');
      expect(COMMON_PATTERNS.TRIPLE_BACKTICKS).toBe('```.*?```');
      expect(COMMON_PATTERNS.YAML_FRONTMATTER).toBe('^---\\n.*?\\n---');
      expect(COMMON_PATTERNS.COMMENT_LINES).toBe('^#.*$');
      expect(COMMON_PATTERNS.EMPTY_LINES).toBe('^\\s*$');
    });
  });

  describe('removeFrontmatter', () => {
    test('should remove YAML frontmatter', () => {
      const content = `---
title: "Test Document"
author: "Test Author"
date: "2024-01-01"
---

# Test Document

This is the actual content we want to keep.`;

      const result = removeFrontmatter(content);
      expect(result.trim()).toBe(`# Test Document

This is the actual content we want to keep.`);
    });

    test('should handle content without frontmatter', () => {
      const content = `# Test Document

This is the actual content we want to keep.`;

      const result = removeFrontmatter(content);
      expect(result).toBe(content);
    });

    test('should handle empty content', () => {
      const result = removeFrontmatter('');
      expect(result).toBe('');
    });
  });

  describe('extractContent', () => {
    test('should extract content using regex pattern', () => {
      const content = `# Some Document

\`\`\`\`\`
# Testing QA Engineer

This document outlines the role and responsibilities...
\`\`\`\`\`

Some other content we don't want.`;

      const result = extractContent(content, '`````.*?`````', 's');
      expect(result).toContain('# Testing QA Engineer');
      expect(result).toContain('This document outlines');
    });

    test('should return original content if no match', () => {
      const content = `# Test Document

This is the content.`;

      const result = extractContent(content, '`````.*?`````', 's');
      expect(result).toBe(content);
    });

    test('should throw error for invalid regex', () => {
      const content = `# Test Document`;

      expect(() => {
        extractContent(content, 'invalid[pattern', '');
      }).toThrow('Invalid regex pattern');
    });
  });

  describe('extractLineRange', () => {
    test('should extract specific line range', () => {
      const content = `Line 1
Line 2
Line 3
Line 4
Line 5`;

      const result = extractLineRange(content, 2, 4);
      expect(result).toBe(`Line 2
Line 3
Line 4`);
    });

    test('should handle empty range', () => {
      const content = `Line 1
Line 2`;

      const result = extractLineRange(content, 3, 2);
      expect(result).toBe('');
    });

    test('should handle out of bounds range', () => {
      const content = `Line 1
Line 2`;

      const result = extractLineRange(content, 1, 10);
      expect(result).toBe(`Line 1
Line 2`);
    });
  });

  describe('removeLines', () => {
    test('should remove lines matching pattern', () => {
      const content = `# This is a comment
Line 1
# Another comment
Line 2
Line 3`;

      const result = removeLines(content, '^#.*$');
      expect(result).toBe(`Line 1
Line 2
Line 3`);
    });

    test('should handle content without matching lines', () => {
      const content = `Line 1
Line 2
Line 3`;

      const result = removeLines(content, '^#.*$');
      expect(result).toBe(content);
    });

    test('should throw error for invalid regex', () => {
      const content = `Line 1`;

      expect(() => {
        removeLines(content, 'invalid[pattern', '');
      }).toThrow('Invalid regex pattern');
    });
  });

  describe('validateFilterConfig', () => {
    test('should validate correct filter configuration', () => {
      const filters = [
        { type: 'frontmatter-removal' },
        { type: 'extract-content', pattern: '`````.*?`````', flags: 's' },
        { type: 'line-range', start: 1, end: 10 },
        { type: 'remove-lines', pattern: '^#.*$' }
      ];

      const errors = validateFilterConfig(filters);
      expect(errors).toHaveLength(0);
    });

    test('should catch invalid filter types', () => {
      const filters = [
        { type: 'invalid-type' }
      ];

      const errors = validateFilterConfig(filters);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Invalid filter type');
    });

    test('should catch missing required parameters', () => {
      const filters = [
        { type: 'extract-content' } // Missing pattern
      ];

      const errors = validateFilterConfig(filters);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Missing required parameter');
    });

    test('should catch invalid line ranges', () => {
      const filters = [
        { type: 'line-range', start: 10, end: 5 } // Invalid range
      ];

      const errors = validateFilterConfig(filters);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('must be less than or equal to end');
    });

    test('should catch invalid regex patterns', () => {
      const filters = [
        { type: 'extract-content', pattern: 'invalid[pattern' }
      ];

      const errors = validateFilterConfig(filters);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Invalid regex pattern');
    });
  });

  describe('shouldProcessFile', () => {
    test('should process text files', () => {
      expect(shouldProcessFile('test.md')).toBe(true);
      expect(shouldProcessFile('test.txt')).toBe(true);
      expect(shouldProcessFile('test.yml')).toBe(true);
      expect(shouldProcessFile('test.js')).toBe(true);
    });

    test('should not process binary files', () => {
      expect(shouldProcessFile('test.png')).toBe(false);
      expect(shouldProcessFile('test.jpg')).toBe(false);
      expect(shouldProcessFile('test.pdf')).toBe(false);
    });
  });

  describe('previewContent', () => {
    test('should preview content with filters', async () => {
      const content = `---
title: "Test"
---

\`\`\`\`\`
# Testing QA Engineer

This document outlines the role and responsibilities...
\`\`\`\`\`

Some other content.`;

      const filters = [
        { type: 'frontmatter-removal' },
        { type: 'extract-content', pattern: '`````.*?`````', flags: 's' }
      ];

      const result = await previewContent(content, filters, 'test.md');
      expect(result).toContain('# Testing QA Engineer');
      expect(result).not.toContain('---');
      expect(result).not.toContain('Some other content');
    });
  });

  describe('processContent', () => {
    test('should process content with multiple filters', async () => {
      const content = `---
title: "Test"
---

\`\`\`\`\`
# Testing QA Engineer

This document outlines the role and responsibilities...
\`\`\`\`\`

# This is a comment
Some other content.`;

      const filters = [
        { type: 'frontmatter-removal' },
        { type: 'extract-content', pattern: '`````.*?`````', flags: 's' },
        { type: 'remove-lines', pattern: '^#.*$' }
      ];

      const result = await processContent(content, filters, 'test.md', false);
      expect(result).toContain('This document outlines');
      expect(result).not.toContain('---');
      expect(result).not.toContain('Some other content');
    });

    test('should handle filter failures gracefully', async () => {
      const content = `# Test Document

This is the content.`;

      const filters = [
        { type: 'extract-content', pattern: 'invalid[pattern' }, // Invalid regex
        { type: 'remove-lines', pattern: '^#.*$' } // This should still work
      ];

      const result = await processContent(content, filters, 'test.md', false);
      expect(result.trim()).toBe('This is the content.'); // Should still process the working filter
    });

    test('should return original content if all filters produce empty results', async () => {
      const content = `# Test Document

This is the content.`;

      const filters = [
        { type: 'extract-content', pattern: '`````.*?`````', flags: 's' } // No match
      ];

      const result = await processContent(content, filters, 'test.md', false);
      expect(result).toBe(content); // Should return original content
    });
  });
});
