import inquirer from 'inquirer';
import chalk from 'chalk';

/**
 * Prompt user for configuration options.
 * Collects tool selection, project type, and task preferences from the user.
 * Handles both interactive prompts and command-line options.
 *
 * @param {Object} options - Command line options that may override prompts
 * @param {Object} config - Full configuration object with available options
 * @returns {Promise<Object>} User configuration object
 */
async function promptUser(options, config) {
  const userConfig = {};

  // Get tool selection
  userConfig.tool = await getToolSelection(options, config);

  // Get project type selection
  userConfig.project = await getProjectSelection(options, config);

  // Get task preferences
  const { getTasks } = await import('./tool-config.js');
  const tasks = getTasks(userConfig.tool, userConfig.project, config);
  userConfig.taskPreferences = await getTaskPreferences(options, tasks);

  return userConfig;
}

/**
 * Get tool selection from user or command line options.
 * Validates the tool against available options and provides interactive selection.
 *
 * @param {Object} options - Command line options
 * @param {Object} config - Full configuration object
 * @returns {Promise<string>} Selected tool identifier
 * @throws {Error} If tool is not supported
 */
async function getToolSelection(options, config) {
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

  const { tool } = await inquirer.prompt([
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
 * @returns {Promise<string>} Selected project type identifier
 * @throws {Error} If project type is not supported
 */
async function getProjectSelection(options, config) {
  // If project type is provided via command line, validate it
  if (options.project) {
    if (!config.projects?.[options.project]) {
      const availableProjects = Object.keys(config.projects || {}).join(', ');
      throw new Error(
        `Unsupported project type: ${options.project}. Available projects: ${availableProjects}`
      );
    }
    return options.project;
  }

  // Otherwise, prompt user with available project type choices
  const projectChoices = Object.entries(config.projects || {}).map(
    ([key, project]) => ({
      name: project.name,
      value: key
    })
  );

  const { project } = await inquirer.prompt([
    {
      type: 'list',
      name: 'project',
      message: 'What type of project is this?',
      choices: projectChoices,
      default: 'drupal'
    }
  ]);

  return project;
}

/**
 * Get task preferences from user or command line options.
 * Handles various task selection modes: all tasks, specific tasks, skip tasks, or interactive.
 * Required tasks are always enabled regardless of user preferences.
 *
 * @param {Object} options - Command line options
 * @param {Object} tasks - Available tasks object
 * @returns {Promise<Object>} Task preferences object with task IDs as keys and boolean values
 */
async function getTaskPreferences(options, tasks) {
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
      const answer = await inquirer.prompt([
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
 * @returns {Promise<boolean>} True if user confirmed, false otherwise
 */
async function confirmAction(message, defaultAnswer = false) {
  const { confirmed } = await inquirer.prompt([
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
 * @returns {Promise<boolean>} True if user wants to proceed, false otherwise
 */
async function confirmSetup(config, tasks) {
  console.log(`\n${chalk.blue('📋 Setup Summary:')}`);
  console.log(`• Tool: ${chalk.cyan(config.tool)}`);
  console.log(`• Project Type: ${chalk.cyan(config.project)}`);

  // Display enabled tasks
  const enabledTasks = Object.entries(config.taskPreferences || {})
    .filter(([_, enabled]) => enabled)
    .map(([taskId, _]) => tasks[taskId]?.name || taskId);

  if (enabledTasks.length > 0) {
    console.log(`• Tasks: ${chalk.green('✅')} ${enabledTasks.join(', ')}`);
  } else {
    console.log(`• Tasks: ${chalk.gray('❌ None selected')}`);
  }

  const { proceed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'proceed',
      message: 'Proceed with this setup?',
      default: true
    }
  ]);

  return proceed;
}

export { promptUser, confirmAction, confirmSetup };
