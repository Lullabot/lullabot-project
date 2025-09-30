import {
  getOrCloneRepository,
  copyFilesFromRemote,
  validateRepository
} from '../git-operations.js';

/**
 * Execute the remote-copy-files task.
 * Handles copying files from remote repositories with smart filtering.
 *
 * @param {Object} task - Task configuration object
 * @param {string} tool - The tool identifier (unused but kept for interface consistency)
 * @param {string} projectType - The project type for placeholder replacement
 * @param {boolean} verbose - Whether to show detailed output
 * @param {Object} dependencies - Injected dependencies for file tracking
 * @returns {Promise<Object>} Task execution result
 */
async function execute(
  task,
  tool,
  projectType,
  verbose = false,
  dependencies = {}
) {
  const { repository, source, target, items } = task;

  // Replace project type placeholder
  const remoteSource = source.replace('{project-type}', projectType);

  // Validate repository accessibility
  await validateRepository(repository, verbose);

  // Clone remote repository (with caching)
  const tempDir = await getOrCloneRepository(repository, verbose);

  try {
    // Copy files from remote repository with smart filtering
    const trackedFiles = await copyFilesFromRemote(
      tempDir,
      remoteSource,
      target,
      verbose,
      { ...dependencies, task }, // Pass the task configuration
      items
    );

    return {
      output: `Successfully copied ${trackedFiles.length} files from remote repository`,
      files: trackedFiles
    };
  } finally {
    // Cleanup handled at the end of all tasks
  }
}

export { execute };
