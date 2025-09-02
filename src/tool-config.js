import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import chalk from 'chalk';

/**
 * Load configuration from YAML file.
 * Reads the main configuration file that contains tool and project definitions.
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
 * Load tool configuration from YAML file (backward compatibility).
 * Returns a simplified structure for legacy code that expects only tool settings.
 *
 * @returns {Promise<Object>} Object containing tool configurations
 */
async function loadToolConfig() {
  const config = await loadConfig();
  return { tools: config.tools };
}

/**
 * Validate project type against current directory.
 * Checks for required files and content to ensure the current directory
 * is a valid project of the specified type.
 *
 * @param {string|null} projectType - The project type to validate or null for "None"
 * @param {string} tool - The tool identifier
 * @param {Object} config - Full configuration object
 * @throws {Error} If project validation fails
 */
async function validateProject(projectType, tool, config) {
  // Skip validation if no project is selected
  if (!projectType) {
    console.log(
      chalk.green('✅ No project selected - skipping project validation')
    );
    return;
  }

  const toolSettings = config.tools[tool];
  if (!toolSettings) {
    throw new Error(`Tool configuration not found for: ${tool}`);
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
 * Get tool settings for a specific tool.
 * Returns the configuration object for the specified tool.
 *
 * @param {string} tool - The tool identifier
 * @param {Object} toolConfig - Tool configuration object
 * @returns {Object} Tool settings object
 * @throws {Error} If tool configuration is not found
 */
function getToolSettings(tool, toolConfig) {
  const settings = toolConfig.tools[tool];
  if (!settings) {
    throw new Error(`Tool configuration not found for: ${tool}`);
  }
  return settings;
}

/**
 * Get available tools from the configuration.
 * Returns an array of tool identifiers that are configured.
 *
 * @param {Object} toolConfig - Tool configuration object
 * @returns {string[]} Array of available tool identifiers
 */
function getAvailableTools(toolConfig) {
  return Object.keys(toolConfig.tools);
}

/**
 * Get available project types for a tool.
 * Returns an array of project types that are supported by the specified tool.
 *
 * @param {string} tool - The tool identifier
 * @param {Object} toolConfig - Tool configuration object
 * @returns {string[]} Array of available project type identifiers
 */
function getAvailableProjectTypes(tool, toolConfig) {
  const toolSettings = getToolSettings(tool, toolConfig);
  return Object.keys(toolSettings['project-validation'] || {});
}

/**
 * Get tasks for the given tool and project type.
 * Combines tool-specific tasks and project-specific tasks into a single object.
 * Each task is marked with its source (tool or project) for tracking.
 * Filters out tasks that require a project when no project is selected.
 *
 * @param {string} tool - The tool identifier
 * @param {string|null} projectType - The project type or null for "None"
 * @param {Object} config - Full configuration object
 * @returns {Object} Object containing all available tasks
 * @throws {Error} If tool configuration is not found
 */
function getTasks(tool, projectType, config) {
  const toolSettings = config.tools[tool];
  if (!toolSettings) {
    throw new Error(`Tool configuration not found for: ${tool}`);
  }

  const tasks = {};

  // Add tool tasks
  if (toolSettings.tasks) {
    for (const [taskId, task] of Object.entries(toolSettings.tasks)) {
      // Skip tasks that require a project when no project is selected
      if (task['requires-project'] && !projectType) {
        continue;
      }

      tasks[taskId] = {
        ...task,
        id: taskId,
        taskSource: 'tool'
      };
    }
  }

  // Add project tasks (if any) - only when project is selected
  if (projectType && config.projects[projectType]?.tasks) {
    for (const [taskId, task] of Object.entries(
      config.projects[projectType].tasks
    )) {
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
  loadToolConfig,
  validateProject,
  getToolSettings,
  getAvailableTools,
  getAvailableProjectTypes,
  getTasks
};
