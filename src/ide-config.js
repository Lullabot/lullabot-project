import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import chalk from 'chalk';

/**
 * Load configuration from YAML file.
 * Reads the main configuration file that contains IDE and project definitions.
 *
 * @returns {Promise<Object>} Parsed configuration object
 * @throws {Error} If configuration file cannot be loaded or parsed
 */
async function loadConfig() {
  try {
    // Get the directory where the tool is located
    const toolDir = path.dirname(new URL(import.meta.url).pathname);
    const configPath = path.join(toolDir, '..', 'config', 'config.yml');
    const configContent = await fs.readFile(configPath, 'utf8');
    return yaml.load(configContent);
  } catch (error) {
    throw new Error(`Failed to load configuration: ${error.message}`);
  }
}

/**
 * Load IDE configuration from YAML file (backward compatibility).
 * Returns a simplified structure for legacy code that expects only IDE settings.
 *
 * @returns {Promise<Object>} Object containing IDE configurations
 */
async function loadIdeConfig() {
  const config = await loadConfig();
  return { ides: config.ides };
}

/**
 * Validate project type against current directory.
 * Checks for required files and content to ensure the current directory
 * is a valid project of the specified type.
 *
 * @param {string} projectType - The project type to validate
 * @param {string} ide - The IDE identifier
 * @param {Object} config - Full configuration object
 * @throws {Error} If project validation fails
 */
async function validateProject(projectType, ide, config) {
  const ideSettings = config.ides[ide];
  if (!ideSettings) {
    throw new Error(`IDE configuration not found for: ${ide}`);
  }

  const projectConfig = config.projects[projectType];
  if (!projectConfig) {
    throw new Error(`Project configuration not found for: ${projectType}`);
  }

  const projectValidation = projectConfig.validation;
  if (!projectValidation) {
    throw new Error(`Project validation not configured for ${projectType}`);
  }

  const currentDir = process.cwd();
  const issues = [];

  // Check required files
  if (projectValidation.requiredFiles) {
    for (const file of projectValidation.requiredFiles) {
      const filePath = path.join(currentDir, file);
      if (!(await fs.pathExists(filePath))) {
        issues.push(`Missing required file: ${file}`);
      }
    }
  }

  // Check required content in files
  if (projectValidation.requiredContent) {
    for (const [file, content] of Object.entries(
      projectValidation.requiredContent
    )) {
      const filePath = path.join(currentDir, file);
      if (await fs.pathExists(filePath)) {
        const fileContent = await fs.readFile(filePath, 'utf8');
        if (!fileContent.includes(content)) {
          issues.push(`Required content not found in ${file}: ${content}`);
        }
      } else {
        issues.push(`Cannot check content in missing file: ${file}`);
      }
    }
  }

  // Check optional files (for warnings)
  const warnings = [];
  if (projectValidation.optionalFiles) {
    for (const file of projectValidation.optionalFiles) {
      const filePath = path.join(currentDir, file);
      if (!(await fs.pathExists(filePath))) {
        warnings.push(`Optional file not found: ${file}`);
      }
    }
  }

  // Display warnings if any
  if (warnings.length > 0) {
    console.log(chalk.yellow('\n⚠️  Warnings:'));
    warnings.forEach((warning) => {
      console.log(chalk.yellow(`  • ${warning}`));
    });
  }

  // Throw error if there are critical issues
  if (issues.length > 0) {
    console.log(chalk.red('\n❌ Project validation failed:'));
    issues.forEach((issue) => {
      console.log(chalk.red(`  • ${issue}`));
    });
    throw new Error(
      `Project validation failed. This doesn't appear to be a valid ${projectType} project.`
    );
  }

  console.log(chalk.green(`✅ Project validation passed for ${projectType}`));
}

/**
 * Get IDE settings for a specific IDE.
 * Returns the configuration object for the specified IDE.
 *
 * @param {string} ide - The IDE identifier
 * @param {Object} ideConfig - IDE configuration object
 * @returns {Object} IDE settings object
 * @throws {Error} If IDE configuration is not found
 */
function getIdeSettings(ide, ideConfig) {
  const settings = ideConfig.ides[ide];
  if (!settings) {
    throw new Error(`IDE configuration not found for: ${ide}`);
  }
  return settings;
}

/**
 * Get available IDEs from the configuration.
 * Returns an array of IDE identifiers that are configured.
 *
 * @param {Object} ideConfig - IDE configuration object
 * @returns {string[]} Array of available IDE identifiers
 */
function getAvailableIdes(ideConfig) {
  return Object.keys(ideConfig.ides);
}

/**
 * Get available project types for an IDE.
 * Returns an array of project types that are supported by the specified IDE.
 *
 * @param {string} ide - The IDE identifier
 * @param {Object} ideConfig - IDE configuration object
 * @returns {string[]} Array of available project type identifiers
 */
function getAvailableProjectTypes(ide, ideConfig) {
  const ideSettings = getIdeSettings(ide, ideConfig);
  return Object.keys(ideSettings['project-validation'] || {});
}

/**
 * Get tasks for the given IDE and project type.
 * Combines IDE-specific tasks and project-specific tasks into a single object.
 * Each task is marked with its source (ide or project) for tracking.
 *
 * @param {string} ide - The IDE identifier
 * @param {string} projectType - The project type
 * @param {Object} config - Full configuration object
 * @returns {Object} Object containing all available tasks
 * @throws {Error} If IDE or project configuration is not found
 */
function getTasks(ide, projectType, config) {
  const ideSettings = config.ides[ide];
  if (!ideSettings) {
    throw new Error(`IDE configuration not found for: ${ide}`);
  }

  const projectConfig = config.projects[projectType];
  if (!projectConfig) {
    throw new Error(`Project configuration not found for: ${projectType}`);
  }

  const tasks = {};

  // Add IDE tasks
  if (ideSettings.tasks) {
    for (const [taskId, task] of Object.entries(ideSettings.tasks)) {
      tasks[taskId] = {
        ...task,
        id: taskId,
        taskSource: 'ide'
      };
    }
  }

  // Add project tasks (if any)
  if (projectConfig.tasks) {
    for (const [taskId, task] of Object.entries(projectConfig.tasks)) {
      tasks[taskId] = {
        ...task,
        id: taskId,
        taskSource: 'project'
      };
    }
  }

  return tasks;
}

export {
  loadConfig,
  loadIdeConfig,
  validateProject,
  getIdeSettings,
  getAvailableIdes,
  getAvailableProjectTypes,
  getTasks
};
