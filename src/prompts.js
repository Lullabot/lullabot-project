import inquirer from 'inquirer';
import chalk from 'chalk';

/**
 * Prompt user for configuration options
 */
async function promptUser(options, config) {
  const userConfig = {};

  // Get IDE selection
  userConfig.ide = await getIdeSelection(options, config);

  // Get project type selection
  userConfig.project = await getProjectSelection(options, config);

  // Get memory bank preference
  userConfig.memoryBank = await getMemoryBankPreference(options, config, userConfig.ide);

  // Get rules preference
  userConfig.rules = await getRulesPreference(options);

  return userConfig;
}

/**
 * Get IDE selection from user
 */
async function getIdeSelection(options, config) {
  // If IDE is provided via command line, use it
  if (options.ide) {
    if (!config.ides?.[options.ide]) {
      throw new Error(`Unsupported IDE: ${options.ide}. Available IDEs: ${Object.keys(config.ides || {}).join(', ')}`);
    }
    return options.ide;
  }

  // Otherwise, prompt user
  const ideChoices = Object.keys(config.ides || {}).map(ideKey => ({
    name: config.ides[ideKey].name,
    value: ideKey
  }));

  const { ide } = await inquirer.prompt([
    {
      type: 'list',
      name: 'ide',
      message: 'Which IDE are you using?',
      choices: ideChoices,
      default: 'cursor'
    }
  ]);

  return ide;
}

/**
 * Get project type selection from user
 */
async function getProjectSelection(options, config) {
  // If project type is provided via command line, validate it
  if (options.project) {
    if (!config.projects?.[options.project]) {
      const availableProjects = Object.keys(config.projects || {}).join(', ');
      throw new Error(`Unsupported project type: ${options.project}. Available projects: ${availableProjects}`);
    }
    return options.project;
  }

  // Otherwise, prompt user with available project types
  const projectChoices = Object.entries(config.projects || {}).map(([key, project]) => ({
    name: project.name,
    value: key
  }));

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
 * Get memory bank preference from user
 */
async function getMemoryBankPreference(options, config, selectedIde) {
  // If skip memory bank option is provided via command line, disable it
  if (options.skipMemoryBank) {
    return false;
  }

  // Check if the selected IDE has a memory bank command
  const ideSettings = config.ides[selectedIde];
  if (!ideSettings || !ideSettings['memory-bank-command']) {
    // IDE doesn't have a memory bank command, so don't prompt
    return false;
  }

  // Otherwise, prompt user (default to true)
  const { memoryBank } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'memoryBank',
      message: 'Would you like to set up a memory bank for AI assistance?',
      default: true
    }
  ]);

  return memoryBank;
}

/**
 * Get rules preference from user
 */
async function getRulesPreference(options) {
  // If skip rules option is provided via command line, disable it
  if (options.skipRules) {
    return false;
  }

  // Otherwise, prompt user (default to true)
  const { rules } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'rules',
      message: 'Would you like to install project-specific rules and guidelines?',
      default: true
    }
  ]);

  return rules;
}

/**
 * Confirm destructive action
 */
async function confirmAction(message, defaultAnswer = false) {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: message,
      default: defaultAnswer
    }
  ]);

  return confirmed;
}

/**
 * Display a summary and get confirmation
 */
async function confirmSetup(config) {
  console.log('\n' + chalk.blue('📋 Setup Summary:'));
  console.log(`• IDE: ${chalk.cyan(config.ide)}`);
  console.log(`• Project Type: ${chalk.cyan(config.project)}`);
  console.log(`• Memory Bank: ${config.memoryBank ? chalk.green('✅') : chalk.gray('❌')}`);
  console.log(`• Project Rules: ${config.rules ? chalk.green('✅') : chalk.gray('❌')}`);

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

export {
  promptUser,
  confirmAction,
  confirmSetup
};
