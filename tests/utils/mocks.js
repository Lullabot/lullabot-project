// Mock utilities for testing
import { jest } from '@jest/globals';

/**
 * Mock file system operations
 */
export const createFsMock = () => ({
  pathExists: jest.fn(),
  ensureDir: jest.fn(),
  readdir: jest.fn(),
  readFile: jest.fn(),
  readFileSync: jest.fn(),
  writeFile: jest.fn(),
  writeFileSync: jest.fn(),
  copy: jest.fn(),
  remove: jest.fn(),
  existsSync: jest.fn()
});

/**
 * Mock Git operations
 */
export const createGitMock = () => ({
  clone: jest.fn(),
  cwd: jest.fn().mockReturnThis(),
  tags: jest.fn()
});

/**
 * Mock inquirer for user prompts
 */
export const createInquirerMock = () => ({
  prompt: jest.fn()
});

/**
 * Mock ora spinner
 */
export const createOraMock = () => ({
  start: jest.fn().mockReturnThis(),
  stop: jest.fn().mockReturnThis(),
  succeed: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  text: ''
});

/**
 * Mock chalk for colors
 */
export const createChalkMock = () => ({
  blue: jest.fn((text) => text),
  green: jest.fn((text) => text),
  red: jest.fn((text) => text),
  yellow: jest.fn((text) => text),
  cyan: jest.fn((text) => text),
  gray: jest.fn((text) => text)
});

/**
 * Mock process methods
 */
export const createProcessMock = () => ({
  cwd: jest.fn(() => '/test/project'),
  exit: jest.fn()
});

/**
 * Create a complete mock environment for testing
 */
export const createMockEnvironment = () => ({
  fs: createFsMock(),
  git: createGitMock(),
  inquirer: createInquirerMock(),
  ora: createOraMock(),
  chalk: createChalkMock(),
  process: createProcessMock()
});
