/**
 * Unit tests for file overwrite confirmation prompts.
 * Tests the confirmFileOverwrite function with various scenarios.
 */

import { confirmFileOverwrite } from '../../src/prompts.js';

describe('File Overwrite Prompts', () => {
  let mockDependencies;

  beforeEach(() => {
    mockDependencies = {
      promptFn: jest.fn(),
      chalk: {
        yellow: jest.fn((text) => `YELLOW:${text}`),
        red: jest.fn((text) => `RED:${text}`)
      }
    };
  });

  describe('confirmFileOverwrite', () => {
    test('should return true when no files are provided', async () => {
      const result = await confirmFileOverwrite([], mockDependencies);

      expect(result).toBe(true);
      expect(mockDependencies.promptFn).not.toHaveBeenCalled();
    });

    test('should return true when null files are provided', async () => {
      const result = await confirmFileOverwrite(null, mockDependencies);

      expect(result).toBe(true);
      expect(mockDependencies.promptFn).not.toHaveBeenCalled();
    });

    test('should prompt user for confirmation with modified files', async () => {
      const changedFiles = [
        { path: '/test/file1.txt', originalHash: 'hash1', currentHash: 'hash2' },
        { path: '/test/file2.txt', originalHash: 'hash3', currentHash: 'hash4' }
      ];

      mockDependencies.promptFn.mockResolvedValue({ confirmed: true });

      const result = await confirmFileOverwrite(changedFiles, mockDependencies);

      expect(result).toBe(true);
      expect(mockDependencies.promptFn).toHaveBeenCalledWith([
        {
          type: 'confirm',
          name: 'confirmed',
          message: expect.stringContaining('YELLOW:⚠️  Warning: The following files have been modified:'),
          default: false
        }
      ]);
    });

    test('should handle files with errors', async () => {
      const changedFiles = [
        { path: '/missing/file.txt', originalHash: 'hash1', currentHash: null, error: 'File not found' }
      ];

      mockDependencies.promptFn.mockResolvedValue({ confirmed: false });

      const result = await confirmFileOverwrite(changedFiles, mockDependencies);

      expect(result).toBe(false);
      expect(mockDependencies.promptFn).toHaveBeenCalledWith([
        {
          type: 'confirm',
          name: 'confirmed',
          message: expect.stringContaining('RED:/missing/file.txt (File not found)'),
          default: false
        }
      ]);
    });

    test('should throw error when promptFn dependency is missing', async () => {
      const invalidDeps = { chalk: mockDependencies.chalk };

      await expect(confirmFileOverwrite([{ path: '/test.txt' }], invalidDeps))
        .rejects.toThrow('Missing required dependencies: promptFn and chalk');
    });

    test('should throw error when chalk dependency is missing', async () => {
      const invalidDeps = { promptFn: mockDependencies.promptFn };

      await expect(confirmFileOverwrite([{ path: '/test.txt' }], invalidDeps))
        .rejects.toThrow('Missing required dependencies: promptFn and chalk');
    });

    test('should handle user declining confirmation', async () => {
      const changedFiles = [
        { path: '/test/file.txt', originalHash: 'hash1', currentHash: 'hash2' }
      ];

      mockDependencies.promptFn.mockResolvedValue({ confirmed: false });

      const result = await confirmFileOverwrite(changedFiles, mockDependencies);

      expect(result).toBe(false);
    });

    test('should build correct warning message format', async () => {
      const changedFiles = [
        { path: '/test/file1.txt', originalHash: 'hash1', currentHash: 'hash2' },
        { path: '/test/file2.txt', originalHash: 'hash3', currentHash: 'hash4' }
      ];

      mockDependencies.promptFn.mockResolvedValue({ confirmed: true });

      await confirmFileOverwrite(changedFiles, mockDependencies);

      const callArgs = mockDependencies.promptFn.mock.calls[0][0];
      const message = callArgs[0].message;

      expect(message).toContain('YELLOW:⚠️  Warning: The following files have been modified:');
      expect(message).toContain('RED:/test/file1.txt');
      expect(message).toContain('RED:/test/file2.txt');
      expect(message).toContain('These files will be overwritten with the latest versions.');
      expect(message).toContain('Continue?');
    });
  });
});
