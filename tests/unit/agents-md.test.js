// Tests for the agents-md task type
import fs from 'fs-extra';
import path from 'path';

// Import the module under test
const { execute } = await import('../../src/task-types/agents-md.js');

describe('Agents MD Task Type', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Create a temporary directory for each test
    testDir = await fs.mkdtemp('/tmp/agents-md-test-');
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(async () => {
    // Clean up and restore original working directory
    process.chdir(originalCwd);
    await fs.remove(testDir);
  });

  describe('execute', () => {
    it('should create AGENTS.md with empty comment section when no .ai/ files exist', async () => {
      const config = {
        files: []
      };

      const dependencies = {
        config,
        projectRoot: testDir
      };

      const task = {
        source: 'assets/AGENTS.md',
        target: '.'
      };
      const result = await execute(task, 'cursor', 'drupal', true, dependencies);

      expect(result.success).toBe(true);
      expect(result.message).toContain('AGENTS.md updated with');
      expect(result.files).toHaveLength(1);
      expect(result.files[0].path).toBe('AGENTS.md');

      // Check that AGENTS.md was created with empty comment section
      const agentsMdPath = path.join(testDir, 'AGENTS.md');
      expect(await fs.pathExists(agentsMdPath)).toBe(true);

      const content = await fs.readFile(agentsMdPath, 'utf8');
      expect(content).toContain('<!-- Lullabot Project Start -->');
      expect(content).toContain('<!-- Lullabot Project End -->');
      expect(content).toContain('# Example AGENTS.md File');
    });

    it('should create AGENTS.md with file references when .ai/ files exist', async () => {
      const config = {
        files: [
          { path: '.ai/drupal-core.md', originalHash: 'hash1' },
          { path: '.ai/drupal-testing.md', originalHash: 'hash2' },
          { path: '.ai/code-quality.md', originalHash: 'hash3' },
          { path: '.cursor/rules/something.md', originalHash: 'hash4' } // Should be ignored
        ]
      };

      const dependencies = {
        config,
        projectRoot: testDir
      };

      const task = {
        source: 'assets/AGENTS.md',
        target: '.'
      };
      const result = await execute(task, 'cursor', 'drupal', true, dependencies);

      expect(result.success).toBe(true);
      expect(result.message).toContain('AGENTS.md updated with');
      expect(result.files).toHaveLength(1);
      expect(result.files[0].path).toBe('AGENTS.md');

      // Check that AGENTS.md was created with file references
      const agentsMdPath = path.join(testDir, 'AGENTS.md');
      expect(await fs.pathExists(agentsMdPath)).toBe(true);

      const content = await fs.readFile(agentsMdPath, 'utf8');
      expect(content).toContain('<!-- Lullabot Project Start -->');
      expect(content).toContain('<!-- Lullabot Project End -->');
      expect(content).toContain('## Project-Specific AI Development Files');
      expect(content).toContain('[.ai/drupal-core.md](.ai/drupal-core.md)');
      expect(content).toContain('[.ai/drupal-testing.md](.ai/drupal-testing.md)');
      expect(content).toContain('[.ai/code-quality.md](.ai/code-quality.md)');
      expect(content).not.toContain('@.cursor/rules/something.md');
    });

    it('should update existing AGENTS.md while preserving user content', async () => {
      // Create an existing AGENTS.md with user content
      const existingContent = `# My Project

This is my custom content.

<!-- Lullabot Project Start -->
@.ai/old-file.md
<!-- Lullabot Project End -->

More user content here.`;

      const agentsMdPath = path.join(testDir, 'AGENTS.md');
      await fs.writeFile(agentsMdPath, existingContent);

      const config = {
        files: [
          { path: '.ai/new-file.md', originalHash: 'hash1' }
        ]
      };

      const dependencies = {
        config,
        projectRoot: testDir
      };

      const task = {
        source: 'assets/AGENTS.md',
        target: '.'
      };
      const result = await execute(task, 'cursor', 'drupal', true, dependencies);

      expect(result.success).toBe(true);
      expect(result.message).toContain('AGENTS.md updated with');
      expect(result.files).toHaveLength(1); // Tracks existing files with preExisting flag
      expect(result.files[0].preExisting).toBe(true);

      // Check that user content was preserved and Lullabot section was updated
      const updatedContent = await fs.readFile(agentsMdPath, 'utf8');
      expect(updatedContent).toContain('# My Project');
      expect(updatedContent).toContain('This is my custom content.');
      expect(updatedContent).toContain('More user content here.');
      expect(updatedContent).toContain('[.ai/new-file.md](.ai/new-file.md)');
      expect(updatedContent).not.toContain('[.ai/old-file.md](.ai/old-file.md)');
    });

    it('should handle missing dependencies gracefully', async () => {
      await expect(
        execute({}, 'cursor', 'drupal', true, {})
      ).rejects.toThrow('Missing required dependencies: config and projectRoot');
    });

    it('should handle missing config gracefully', async () => {
      const dependencies = {
        projectRoot: testDir
      };

      await expect(
        execute({}, 'cursor', 'drupal', true, dependencies)
      ).rejects.toThrow('Missing required dependencies: config and projectRoot');
    });

    it('should handle missing projectRoot gracefully', async () => {
      const dependencies = {
        config: { files: [] }
      };

      await expect(
        execute({}, 'cursor', 'drupal', true, dependencies)
      ).rejects.toThrow('Missing required dependencies: config and projectRoot');
    });

    it('should provide verbose output when requested', async () => {
      const config = {
        files: [
          { path: '.ai/file1.md', originalHash: 'hash1' },
          { path: '.ai/file2.md', originalHash: 'hash2' }
        ]
      };

      const dependencies = {
        config,
        projectRoot: testDir
      };

      // Mock console.log to capture verbose output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const task = {
        source: 'assets/AGENTS.md',
        target: '.'
      };
      await execute(task, 'cursor', 'drupal', true, dependencies);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('AGENTS.md created/updated')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('  - .ai/file1.md')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('  - .ai/file2.md')
      );

      consoleSpy.mockRestore();
    });

    it('should provide verbose output for empty case', async () => {
      const config = {
        files: []
      };

      const dependencies = {
        config,
        projectRoot: testDir
      };

      // Mock console.log to capture verbose output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const task = {
        source: 'assets/AGENTS.md',
        target: '.'
      };
      await execute(task, 'cursor', 'drupal', true, dependencies);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('AGENTS.md created/updated with empty Lullabot comment section.')
      );

      consoleSpy.mockRestore();
    });

    it('should handle files with null or undefined paths', async () => {
      const config = {
        files: [
          { path: '.ai/valid-file.md', originalHash: 'hash1' },
          { path: null, originalHash: 'hash2' },
          { path: undefined, originalHash: 'hash3' },
          { originalHash: 'hash4' } // Missing path property
        ]
      };

      const dependencies = {
        config,
        projectRoot: testDir
      };

      const task = {
        source: 'assets/AGENTS.md',
        target: '.'
      };
      const result = await execute(task, 'cursor', 'drupal', true, dependencies);

      expect(result.success).toBe(true);

      // Check that only valid files are referenced
      const agentsMdPath = path.join(testDir, 'AGENTS.md');
      const content = await fs.readFile(agentsMdPath, 'utf8');
      expect(content).toContain('[.ai/valid-file.md](.ai/valid-file.md)');
      expect(content).not.toContain('@null');
      expect(content).not.toContain('@undefined');
    });
  });
});
