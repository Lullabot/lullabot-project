// Tests for prompts.js module
import { jest } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock console.log to capture output
const originalConsoleLog = console.log;
let consoleOutput = [];

describe('Prompts Module', () => {
  let testDir;
  let originalCwd;

  beforeAll(async () => {
    originalCwd = process.cwd();
    testDir = path.join(__dirname, 'test-prompts-temp');
    await fs.ensureDir(testDir);
  });

  afterAll(async () => {
    process.chdir(originalCwd);
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  beforeEach(async () => {
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
      await fs.ensureDir(testDir);
    }
    consoleOutput = [];
    console.log = jest.fn((...args) => {
      consoleOutput.push(args.join(' '));
    });
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    jest.clearAllMocks();
  });

  describe('Module Import', () => {
    it('should be able to import prompts module', async () => {
      // Test that we can import the module without hanging
      const prompts = await import('../../src/prompts.js');

      expect(prompts).toBeDefined();
      expect(typeof prompts).toBe('object');
    });

    it('should have expected exports', async () => {
      const prompts = await import('../../src/prompts.js');

      // Check that all expected exports exist
      expect(prompts).toHaveProperty('promptUser');
      expect(prompts).toHaveProperty('confirmAction');
      expect(prompts).toHaveProperty('confirmSetup');
    });

    it('should have correct export types', async () => {
      const prompts = await import('../../src/prompts.js');

      // Check that exports are functions
      expect(typeof prompts.promptUser).toBe('function');
      expect(typeof prompts.confirmAction).toBe('function');
      expect(typeof prompts.confirmSetup).toBe('function');
    });
  });

  describe('confirmAction', () => {
    it('should have correct function signature', async () => {
      const prompts = await import('../../src/prompts.js');

      // Check function parameters - confirmAction has 1 required parameter (defaultAnswer has default value)
      expect(prompts.confirmAction.length).toBe(1);
    });

    it('should be an async function', async () => {
      const prompts = await import('../../src/prompts.js');

      // Check that it's an async function
      expect(prompts.confirmAction.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('confirmSetup', () => {
    it('should have correct function signature', async () => {
      const prompts = await import('../../src/prompts.js');

      // Check function parameters
      expect(prompts.confirmSetup.length).toBe(4);
    });

    it('should be an async function', async () => {
      const prompts = await import('../../src/prompts.js');

      // Check that it's an async function
      expect(prompts.confirmSetup.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('promptUser', () => {
    it('should have correct function signature', async () => {
      const prompts = await import('../../src/prompts.js');

      // Check function parameters
      expect(prompts.promptUser.length).toBe(4);
    });

    it('should be an async function', async () => {
      const prompts = await import('../../src/prompts.js');

      // Check that it's an async function
      expect(prompts.promptUser.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('Function Properties', () => {
    it('should have correct function names', async () => {
      const prompts = await import('../../src/prompts.js');

      expect(prompts.promptUser.name).toBe('promptUser');
      expect(prompts.confirmAction.name).toBe('confirmAction');
      expect(prompts.confirmSetup.name).toBe('confirmSetup');
    });

    it('should be callable', async () => {
      const prompts = await import('../../src/prompts.js');

      expect(typeof prompts.promptUser).toBe('function');
      expect(typeof prompts.confirmAction).toBe('function');
      expect(typeof prompts.confirmSetup).toBe('function');
    });

    it('should be enumerable', async () => {
      const prompts = await import('../../src/prompts.js');

      const keys = Object.keys(prompts);
      expect(keys).toContain('promptUser');
      expect(keys).toContain('confirmAction');
      expect(keys).toContain('confirmSetup');
    });
  });

  describe('ES Module Behavior', () => {
    it('should have read-only properties', async () => {
      const prompts = await import('../../src/prompts.js');

      expect(() => {
        prompts.promptUser = jest.fn();
      }).toThrow(TypeError);

      expect(() => {
        prompts.confirmAction = jest.fn();
      }).toThrow(TypeError);

      expect(() => {
        prompts.confirmSetup = jest.fn();
      }).toThrow(TypeError);
    });

    it('should not allow property deletion', async () => {
      const prompts = await import('../../src/prompts.js');

      expect(() => {
        delete prompts.promptUser;
      }).toThrow(TypeError);

      expect(() => {
        delete prompts.confirmAction;
      }).toThrow(TypeError);

      expect(() => {
        delete prompts.confirmSetup;
      }).toThrow(TypeError);
    });

    it('should have null prototype', async () => {
      const prompts = await import('../../src/prompts.js');

      const prototype = Object.getPrototypeOf(prompts);
      // ES modules have null prototype
      expect(prototype).toBeNull();
    });
  });

  describe('Function String Representation', () => {
    it('should have meaningful toString output', async () => {
      const prompts = await import('../../src/prompts.js');

      const promptUserStr = prompts.promptUser.toString();
      const confirmActionStr = prompts.confirmAction.toString();
      const confirmSetupStr = prompts.confirmSetup.toString();

      expect(typeof promptUserStr).toBe('string');
      expect(typeof confirmActionStr).toBe('string');
      expect(typeof confirmSetupStr).toBe('string');

      expect(promptUserStr.length).toBeGreaterThan(0);
      expect(confirmActionStr.length).toBeGreaterThan(0);
      expect(confirmSetupStr.length).toBeGreaterThan(0);
    });

    it('should contain function name in toString', async () => {
      const prompts = await import('../../src/prompts.js');

      const promptUserStr = prompts.promptUser.toString();
      const confirmActionStr = prompts.confirmAction.toString();
      const confirmSetupStr = prompts.confirmSetup.toString();

      expect(promptUserStr).toContain('promptUser');
      expect(confirmActionStr).toContain('confirmAction');
      expect(confirmSetupStr).toContain('confirmSetup');
    });

    it('should contain async keyword in toString', async () => {
      const prompts = await import('../../src/prompts.js');

      const promptUserStr = prompts.promptUser.toString();
      const confirmActionStr = prompts.confirmAction.toString();
      const confirmSetupStr = prompts.confirmSetup.toString();

      expect(promptUserStr).toContain('async');
      expect(confirmActionStr).toContain('async');
      expect(confirmSetupStr).toContain('async');
    });
  });
});
