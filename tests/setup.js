// Test setup file for ES modules
import { jest } from '@jest/globals';

// Make jest globally available
global.jest = jest;

// Mock console methods to avoid output during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// Mock process.exit to prevent tests from actually exiting
const originalExit = process.exit;
process.exit = jest.fn();

// Setup and teardown for ES modules
global.beforeAll = beforeAll;
global.afterAll = afterAll;
global.beforeEach = beforeEach;
global.afterEach = afterEach;
global.describe = describe;
global.it = it;
global.expect = expect;

beforeAll(async () => {
  // Any async setup if needed
});

afterAll(async () => {
  // Restore process.exit after tests
  process.exit = originalExit;
});
