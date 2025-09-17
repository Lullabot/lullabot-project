import { validateUrl, validateTaskConfigWithLinks } from '../../src/validation.js';

describe('Task Links Functionality', () => {
  describe('validateUrl', () => {
    it('should validate correct HTTP URLs', () => {
      expect(validateUrl('http://example.com')).toBe(true);
      expect(validateUrl('http://github.com/user/repo')).toBe(true);
      expect(validateUrl('http://localhost:3000')).toBe(true);
    });

    it('should validate correct HTTPS URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('https://github.com/user/repo')).toBe(true);
      expect(validateUrl('https://cursor.sh/docs/memory-bank')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateUrl('ftp://example.com')).toBe(false);
      expect(validateUrl('example.com')).toBe(false);
      expect(validateUrl('www.example.com')).toBe(false);
      expect(validateUrl('')).toBe(false);
      expect(validateUrl(null)).toBe(false);
      expect(validateUrl(undefined)).toBe(false);
      expect(validateUrl(123)).toBe(false);
      expect(validateUrl({})).toBe(false);
      expect(validateUrl([])).toBe(false);
    });

    it('should reject URLs without protocol', () => {
      expect(validateUrl('github.com/user/repo')).toBe(false);
      expect(validateUrl('cursor.sh/docs')).toBe(false);
    });

    it('should reject URLs with invalid protocols', () => {
      expect(validateUrl('ftp://example.com')).toBe(false);
      expect(validateUrl('file:///path/to/file')).toBe(false);
      expect(validateUrl('ssh://user@host')).toBe(false);
    });
  });

  describe('validateTaskConfigWithLinks', () => {
    it('should not throw error for task without link', () => {
      const task = {
        name: 'Test Task',
        type: 'copy-files',
        source: 'assets/test/',
        target: '.test/',
        required: false
      };

      expect(() => {
        validateTaskConfigWithLinks(task);
      }).not.toThrow();
    });

    it('should not throw error for task with valid link', () => {
      const task = {
        name: 'Test Task',
        type: 'copy-files',
        link: 'https://github.com/user/repo',
        source: 'assets/test/',
        target: '.test/',
        required: false
      };

      expect(() => {
        validateTaskConfigWithLinks(task);
      }).not.toThrow();
    });

    it('should throw error for task with invalid link', () => {
      const task = {
        name: 'Test Task',
        type: 'copy-files',
        link: 'invalid-url',
        source: 'assets/test/',
        target: '.test/',
        required: false
      };

      expect(() => {
        validateTaskConfigWithLinks(task);
      }).toThrow('Invalid link URL in copy-files task: must be a valid HTTP/HTTPS URL');
    });

    it('should throw error for task with non-string link', () => {
      const task = {
        name: 'Test Task',
        type: 'copy-files',
        link: 123,
        source: 'assets/test/',
        target: '.test/',
        required: false
      };

      expect(() => {
        validateTaskConfigWithLinks(task);
      }).toThrow('Invalid link URL in copy-files task: must be a valid HTTP/HTTPS URL');
    });

    it('should throw error for task with empty link', () => {
      const task = {
        name: 'Test Task',
        type: 'copy-files',
        link: '',
        source: 'assets/test/',
        target: '.test/',
        required: false
      };

      expect(() => {
        validateTaskConfigWithLinks(task);
      }).toThrow('Invalid link URL in copy-files task: must be a valid HTTP/HTTPS URL');
    });

    it('should validate existing task configuration as well', () => {
      const task = {
        name: 'Test Task',
        type: 'copy-files',
        link: 'https://example.com',
        source: 'assets/test/',
        target: '.test/',
        required: false,
        items: ['valid-pattern.md'] // Valid pattern should not cause validation to fail
      };

      expect(() => {
        validateTaskConfigWithLinks(task);
      }).not.toThrow(); // Should not throw for valid configuration
    });
  });

  describe('Edge Cases', () => {
    it('should handle URLs with query parameters', () => {
      expect(validateUrl('https://example.com?param=value')).toBe(true);
      expect(validateUrl('https://github.com/user/repo?tab=readme')).toBe(true);
    });

    it('should handle URLs with fragments', () => {
      expect(validateUrl('https://example.com#section')).toBe(true);
      expect(validateUrl('https://cursor.sh/docs#memory-bank')).toBe(true);
    });

    it('should handle URLs with ports', () => {
      expect(validateUrl('http://localhost:3000')).toBe(true);
      expect(validateUrl('https://example.com:8080')).toBe(true);
    });

    it('should handle URLs with paths', () => {
      expect(validateUrl('https://github.com/user/repo/blob/main/README.md')).toBe(true);
      expect(validateUrl('https://cursor.sh/docs/memory-bank')).toBe(true);
    });

    it('should handle URLs with subdomains', () => {
      expect(validateUrl('https://docs.cursor.sh')).toBe(true);
      expect(validateUrl('https://api.github.com')).toBe(true);
    });
  });
});
