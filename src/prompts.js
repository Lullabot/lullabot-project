/**
 * Refactored prompts.js - More testable version
 *
 * Key improvements:
 * - Dependencies injected as parameters
 * - No dynamic imports
 * - Pure functions where possible
 * - Separated business logic from UI logic
 */

/**
 * Prompt user for configuration options.
 * Collects tool selection, project type, and task preferences from the user.
 * Handles both interactive prompts and command-line options.
 *
 * @param {Object} options - Command line options that may override prompts
 * @param {Object} config - Full configuration object with available options
 * @param {Function} promptFn - Function to handle user prompts (inquirer.prompt)
 * @param {Function} getTasksFn - Function to get tasks (from tool-config)
 * @returns {Promise<Object>} User configuration object
 */
async function promptUser(options, config, promptFn, getTasksFn) {
  const userConfig = {};

  // Get tool selection
  userConfig.tool = await getToolSelection(options, config, promptFn);

  // Get project type selection
  userConfig.project = await getProjectSelection(options, config, promptFn);

  // Get task preferences
  const tasks = await getTasksFn(userConfig.tool, userConfig.project, config);
  userConfig.taskPreferences = await getTaskPreferences(
    options,
    tasks,
    promptFn
  );

  return userConfig;
}

/**
 * Get tool selection from user or command line options.
 * Validates the tool against available options and provides interactive selection.
 *
 * @param {Object} options - Command line options
 * @param {Object} config - Full configuration object
 * @param {Function} promptFn - Function to handle user prompts
 * @returns {Promise<string>} Selected tool identifier
 * @throws {Error} If tool is not supported
 */
async function getToolSelection(options, config, promptFn) {
  // If tool is provided via command line, use it
  if (options.tool) {
    if (!config.tools?.[options.tool]) {
      throw new Error(
        `Unsupported tool: ${options.tool}. Available tools: ${Object.keys(config.tools || {}).join(', ')}`
      );
    }
    return options.tool;
  }

  // Otherwise, prompt user with available tool choices
  const toolChoices = Object.keys(config.tools || {}).map((toolKey) => ({
    name: config.tools[toolKey].name,
    value: toolKey
  }));

  const { tool } = await promptFn([
    {
      type: 'list',
      name: 'tool',
      message: 'Which tool are you using?',
      choices: toolChoices,
      default: 'cursor'
    }
  ]);

  return tool;
}

/**
 * Get project type selection from user or command line options.
 * Validates the project type against available options and provides interactive selection.
 *
 * @param {Object} options - Command line options
 * @param {Object} config - Full configuration object
 * @param {Function} promptFn - Function to handle user prompts
 * @returns {Promise<string|null>} Selected project type identifier or null for "None"
 * @throws {Error} If project type is not supported
 */
async function getProjectSelection(options, config, promptFn) {
  // If project type is provided via command line, validate it
  if (options.project) {
    if (options.project === 'none') {
      return null;
    }
    if (!config.projects?.[options.project]) {
      const availableProjects = Object.keys(config.projects || {}).join(', ');
      throw new Error(
        `Unsupported project type: ${options.project}. Available projects: ${availableProjects}`
      );
    }
    return options.project;
  }

  // Otherwise, prompt user with available project type choices
  const projectChoices = [
    { name: 'None (skip project-specific tasks)', value: null },
    ...Object.entries(config.projects || {}).map(([key, project]) => ({
      name: project.name,
      value: key
    }))
  ];

  const { project } = await promptFn([
    {
      type: 'list',
      name: 'project',
      message: 'What type of project is this?',
      choices: projectChoices,
      default: null
    }
  ]);

  return project;
}

/**
 * Get task preferences from user or command line options.
 * Handles required tasks, command line overrides, and interactive prompts.
 *
 * @param {Object} options - Command line options
 * @param {Object} tasks - Available tasks object
 * @param {Function} promptFn - Function to handle user prompts
 * @returns {Promise<Object>} Task preferences object
 */
async function getTaskPreferences(options, tasks, promptFn) {
  const taskPreferences = {};

  // If --all-tasks is specified, enable all tasks
  if (options.allTasks) {
    for (const [taskId] of Object.entries(tasks)) {
      taskPreferences[taskId] = true;
    }
    return taskPreferences;
  }

  // If --tasks is specified, only enable those tasks
  if (options.tasks) {
    const taskList = options.tasks.split(',').map((t) => t.trim());
    for (const [taskId] of Object.entries(tasks)) {
      taskPreferences[taskId] = taskList.includes(taskId);
    }
    return taskPreferences;
  }

  // If --skip-tasks is specified, disable those tasks
  const skipTasks = options.skipTasks
    ? options.skipTasks.split(',').map((t) => t.trim())
    : [];

  // Prompt for each optional task
  for (const [taskId, task] of Object.entries(tasks)) {
    if (task.required) {
      // Required tasks are always enabled
      taskPreferences[taskId] = true;
    } else if (skipTasks.includes(taskId)) {
      // Skip tasks that are explicitly disabled
      taskPreferences[taskId] = false;
    } else {
      // Prompt user for optional tasks
      const answer = await promptFn([
        {
          type: 'confirm',
          name: 'enabled',
          message: task.prompt || `Would you like to run: ${task.name}?`,
          default: true
        }
      ]);
      taskPreferences[taskId] = answer.enabled;
    }
  }

  return taskPreferences;
}

/**
 * Confirm destructive action with user.
 * Prompts for confirmation before performing potentially destructive operations.
 *
 * @param {string} message - Confirmation message to display
 * @param {boolean} defaultAnswer - Default answer (true for yes, false for no)
 * @param {Function} promptFn - Function to handle user prompts
 * @returns {Promise<boolean>} True if user confirmed, false otherwise
 */
async function confirmAction(message, defaultAnswer = false, promptFn) {
  const { confirmed } = await promptFn([
    {
      type: 'confirm',
      name: 'confirmed',
      message,
      default: defaultAnswer
    }
  ]);

  return confirmed;
}

/**
 * Display a summary and get confirmation before proceeding.
 * Shows the configuration that will be applied and asks for final confirmation.
 *
 * @param {Object} config - Configuration object to summarize
 * @param {Object} tasks - Available tasks object
 * @param {Function} promptFn - Function to handle user prompts
 * @param {Object} chalk - Chalk instance for styling
 * @param {Function} logFn - Console.log function (can be mocked)
 * @returns {Promise<boolean>} True if user wants to proceed, false otherwise
 */
async function confirmSetup(
  config,
  tasks,
  promptFn,
  chalk,
  logFn = console.log
) {
  logFn(`\n${chalk.blue('📋 Setup Summary:')}`);
  logFn(`• Tool: ${chalk.cyan(config.tool)}`);
  logFn(`• Project Type: ${chalk.cyan(config.project)}`);

  // Display enabled tasks
  const enabledTasks = Object.entries(config.taskPreferences || {})
    .filter(([_, enabled]) => enabled)
    .map(([taskId, _]) => tasks[taskId]?.name || taskId);

  if (enabledTasks.length > 0) {
    logFn(`• Tasks: ${chalk.green('✅')} ${enabledTasks.join(', ')}`);
  } else {
    logFn(`• Tasks: ${chalk.gray('❌ None selected')}`);
  }

  const { proceed } = await promptFn([
    {
      type: 'confirm',
      name: 'proceed',
      message: 'Proceed with this setup?',
      default: true
    }
  ]);

  return proceed;
}

// Export the refactored functions
export {
  promptUser,
  getToolSelection,
  getProjectSelection,
  getTaskPreferences,
  confirmAction,
  confirmSetup
};
