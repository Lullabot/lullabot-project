/**
 * Unit tests for file change detection functionality.
 * Tests hash calculation, file change detection, and project initialization checks.
 */

import {
  calculateFileHash,
  checkFileChanges,
  trackInstalledFile,
  isProjectInitialized
} from '../../src/file-operations.js';

describe('File Change Detection', () => {
  let mockDependencies;

  beforeEach(() => {
    mockDependencies = {
      crypto: {
        createHash: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnThis(),
          digest: jest.fn().mockReturnValue('mock-hash-123')
        })
      },
      fs: {
        readFile: jest.fn().mockResolvedValue('file content')
      },
      configExists: jest.fn().mockResolvedValue(true),
      calculateFileHash: jest.fn().mockResolvedValue('mock-hash-123')
    };
  });

  describe('calculateFileHash', () => {
    test('should calculate file hash with valid dependencies', async () => {
      const result = await calculateFileHash('/test/file.txt', mockDependencies);

      expect(result).toBe('mock-hash-123');
      expect(mockDependencies.fs.readFile).toHaveBeenCalledWith('/test/file.txt');
      expect(mockDependencies.crypto.createHash).toHaveBeenCalledWith('sha256');
    });

    test('should throw error when crypto dependency is missing', async () => {
      const invalidDeps = { fs: mockDependencies.fs };

      await expect(calculateFileHash('/test/file.txt', invalidDeps))
        .rejects.toThrow('Missing required dependencies: crypto and fs');
    });

    test('should throw error when fs dependency is missing', async () => {
      const invalidDeps = { crypto: mockDependencies.crypto };

      await expect(calculateFileHash('/test/file.txt', invalidDeps))
        .rejects.toThrow('Missing required dependencies: crypto and fs');
    });

    test('should handle file read errors', async () => {
      mockDependencies.fs.readFile.mockRejectedValue(new Error('File not found'));

      await expect(calculateFileHash('/missing/file.txt', mockDependencies))
        .rejects.toThrow('File not found');
    });
  });

  describe('checkFileChanges', () => {
    test('should detect unchanged files', async () => {
      const config = {
        files: [
          { path: '/test/file.txt', originalHash: 'mock-hash-123' }
        ]
      };

      const result = await checkFileChanges(config, mockDependencies);

      expect(result).toEqual([]);
    });

    test('should detect changed files', async () => {
      const config = {
        files: [
          { path: '/test/file.txt', originalHash: 'old-hash-456' }
        ]
      };

      const result = await checkFileChanges(config, mockDependencies);

      expect(result).toEqual([
        {
          path: '/test/file.txt',
          originalHash: 'old-hash-456',
          currentHash: 'mock-hash-123'
        }
      ]);
    });

    test('should handle missing files', async () => {
      const config = {
        files: [
          { path: '/missing/file.txt', originalHash: 'old-hash-456' }
        ]
      };

      // Mock calculateFileHash to throw error for missing files
      mockDependencies.calculateFileHash.mockRejectedValue(new Error('File not found'));

      const result = await checkFileChanges(config, mockDependencies);

      expect(result).toEqual([
        {
          path: '/missing/file.txt',
          originalHash: 'old-hash-456',
          currentHash: null,
          error: 'File not found'
        }
      ]);
    });

    test('should handle empty files array', async () => {
      const config = { files: [] };

      const result = await checkFileChanges(config, mockDependencies);

      expect(result).toEqual([]);
    });

    test('should handle config without files property', async () => {
      const config = {};

      const result = await checkFileChanges(config, mockDependencies);

      expect(result).toEqual([]);
    });

    test('should throw error when calculateFileHash dependency is missing', async () => {
      const config = {
        files: [{ path: '/test/file.txt', originalHash: 'old-hash-456' }]
      };

      await expect(checkFileChanges(config, {}))
        .rejects.toThrow('Missing required dependency: calculateFileHash');
    });
  });

  describe('trackInstalledFile', () => {
    test('should track file with hash', async () => {
      const result = await trackInstalledFile('/test/file.txt', mockDependencies);

      expect(result).toEqual({
        path: '/test/file.txt',
        originalHash: 'mock-hash-123'
      });
      expect(mockDependencies.calculateFileHash).toHaveBeenCalledWith('/test/file.txt', mockDependencies);
    });

    test('should throw error when calculateFileHash dependency is missing', async () => {
      await expect(trackInstalledFile('/test/file.txt', {}))
        .rejects.toThrow('Missing required dependency: calculateFileHash');
    });
  });

  describe('isProjectInitialized', () => {
    test('should return true when config exists', async () => {
      const result = await isProjectInitialized(mockDependencies);

      expect(result).toBe(true);
      expect(mockDependencies.configExists).toHaveBeenCalled();
    });

    test('should return false when config does not exist', async () => {
      mockDependencies.configExists.mockResolvedValue(false);

      const result = await isProjectInitialized(mockDependencies);

      expect(result).toBe(false);
    });

    test('should throw error when configExists dependency is missing', async () => {
      await expect(isProjectInitialized({}))
        .rejects.toThrow('Missing required dependency: configExists');
    });
  });
});
