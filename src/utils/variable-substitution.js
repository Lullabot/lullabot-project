/**
 * Variable substitution utility for task configurations.
 * Supports {tool} and {project-type} variables in strings and nested objects.
 */

/**
 * Substitute variables in a string value.
 * Replaces {tool} with the tool name and {project-type} with the project type.
 *
 * @param {string} value - String value to substitute variables in
 * @param {string} tool - Tool name for {tool} substitution
 * @param {string|null} projectType - Project type for {project-type} substitution
 * @returns {string} String with variables substituted
 */
function substituteStringVariables(value, tool, projectType) {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .replace(/{tool}/g, tool || '')
    .replace(/{project-type}/g, projectType || '');
}

/**
 * Recursively substitute variables in an object.
 * Handles nested objects, arrays, and strings.
 *
 * @param {any} obj - Object, array, or primitive value to process
 * @param {string} tool - Tool name for {tool} substitution
 * @param {string|null} projectType - Project type for {project-type} substitution
 * @returns {any} Object with variables substituted
 */
function substituteObjectVariables(obj, tool, projectType) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return substituteStringVariables(obj, tool, projectType);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      substituteObjectVariables(item, tool, projectType)
    );
  }

  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = substituteObjectVariables(value, tool, projectType);
    }
    return result;
  }

  // For primitives (number, boolean, etc.), return as-is
  return obj;
}

/**
 * Substitute variables in a task configuration.
 * Replaces {tool} and {project-type} variables throughout the task object.
 *
 * @param {Object} task - Task configuration object
 * @param {string} tool - Tool name for {tool} substitution
 * @param {string|null} projectType - Project type for {project-type} substitution
 * @returns {Object} Task configuration with variables substituted
 * @throws {Error} If tool is required but not provided
 */
export function substituteVariables(task, tool, projectType) {
  if (!task || typeof task !== 'object') {
    return task;
  }

  // Validate that tool is provided if {tool} variables are used
  const taskString = JSON.stringify(task);
  if (taskString.includes('{tool}') && (tool === null || tool === undefined)) {
    throw new Error(
      'Task contains {tool} variables but no tool context is available'
    );
  }

  return substituteObjectVariables(task, tool, projectType);
}

/**
 * Check if a string contains any variable placeholders.
 * Useful for validation and optimization.
 *
 * @param {string} str - String to check
 * @returns {boolean} True if string contains variable placeholders
 */
export function containsVariables(str) {
  if (typeof str !== 'string') {
    return false;
  }
  return str.includes('{tool}') || str.includes('{project-type}');
}

/**
 * Get all variable names used in a string.
 * Returns an array of variable names found in the string.
 *
 * @param {string} str - String to analyze
 * @returns {string[]} Array of variable names found
 */
export function getVariablesInString(str) {
  if (typeof str !== 'string') {
    return [];
  }

  const variables = [];
  // Match {variable} patterns where variable contains only letters, numbers, hyphens, underscores
  const matches = str.match(/{[a-zA-Z][a-zA-Z0-9_-]*}/g);

  if (matches) {
    for (const match of matches) {
      const variable = match.slice(1, -1); // Remove { and }
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }
  }

  return variables;
}

/**
 * Validate that all variables in a task are supported.
 * Throws an error if unsupported variables are found.
 *
 * @param {Object} task - Task configuration to validate
 * @throws {Error} If unsupported variables are found
 */
export function validateTaskVariables(task) {
  if (!task || typeof task !== 'object') {
    return;
  }

  const supportedVariables = ['tool', 'project-type'];
  const taskString = JSON.stringify(task);
  const usedVariables = getVariablesInString(taskString);

  const unsupportedVariables = usedVariables.filter(
    (variable) => !supportedVariables.includes(variable)
  );

  if (unsupportedVariables.length > 0) {
    throw new Error(
      `Unsupported variables found in task: ${unsupportedVariables.join(', ')}. ` +
        `Supported variables: ${supportedVariables.join(', ')}`
    );
  }
}
