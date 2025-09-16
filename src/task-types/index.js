import { execute as copyFilesExecute } from './copy-files.js';
import { execute as packageInstallExecute } from './package-install.js';
import { execute as agentsMdExecute } from './agents-md.js';
import { execute as remoteCopyFilesExecute } from './remote-copy-files.js';

/**
 * Registry of available task types.
 * Maps task type names to their execution functions.
 *
 * Note: 'command' task type has been removed for security reasons.
 */
const taskTypes = {
  'copy-files': { execute: copyFilesExecute },
  'package-install': { execute: packageInstallExecute },
  'agents-md': { execute: agentsMdExecute },
  'remote-copy-files': { execute: remoteCopyFilesExecute }
};

/**
 * Get a task executor by task type.
 *
 * @param {string} taskType - The task type name
 * @returns {Object} Task executor object with execute function
 * @throws {Error} If task type is not found
 */
function getTaskExecutor(taskType) {
  const executor = taskTypes[taskType];
  if (!executor) {
    throw new Error(`Unknown task type: ${taskType}`);
  }
  return executor;
}

/**
 * Check if a task type is supported.
 *
 * @param {string} taskType - The task type name
 * @returns {boolean} True if task type is supported
 */
function isTaskTypeSupported(taskType) {
  return taskType in taskTypes;
}

/**
 * Get list of all supported task types.
 *
 * @returns {string[]} Array of supported task type names
 */
function getSupportedTaskTypes() {
  return Object.keys(taskTypes);
}

export {
  taskTypes,
  getTaskExecutor,
  isTaskTypeSupported,
  getSupportedTaskTypes
};
