import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import chalk from 'chalk';

/**
 * Load configuration from YAML file
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
 * Load IDE configuration from YAML file (backward compatibility)
 */
async function loadIdeConfig() {
  const config = await loadConfig();
  return { ides: config.ides };
}

/**
 * Validate project type against current directory
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
      if (!await fs.pathExists(filePath)) {
        issues.push(`Missing required file: ${file}`);
      }
    }
  }

  // Check required content in files
  if (projectValidation.requiredContent) {
    for (const [file, content] of Object.entries(projectValidation.requiredContent)) {
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
      if (!await fs.pathExists(filePath)) {
        warnings.push(`Optional file not found: ${file}`);
      }
    }
  }

  // Display warnings if any
  if (warnings.length > 0) {
    console.log(chalk.yellow('\n⚠️  Warnings:'));
    warnings.forEach(warning => {
      console.log(chalk.yellow(`  • ${warning}`));
    });
  }

  // Throw error if there are critical issues
  if (issues.length > 0) {
    console.log(chalk.red('\n❌ Project validation failed:'));
    issues.forEach(issue => {
      console.log(chalk.red(`  • ${issue}`));
    });
    throw new Error(`Project validation failed. This doesn't appear to be a valid ${projectType} project.`);
  }

  console.log(chalk.green(`✅ Project validation passed for ${projectType}`));
}

/**
 * Get IDE settings for a specific IDE
 */
function getIdeSettings(ide, ideConfig) {
  const settings = ideConfig.ides[ide];
  if (!settings) {
    throw new Error(`IDE configuration not found for: ${ide}`);
  }
  return settings;
}

/**
 * Get available IDEs
 */
function getAvailableIdes(ideConfig) {
  return Object.keys(ideConfig.ides);
}

/**
 * Get available project types for an IDE
 */
function getAvailableProjectTypes(ide, ideConfig) {
  const ideSettings = getIdeSettings(ide, ideConfig);
  return Object.keys(ideSettings['project-validation'] || {});
}

export {
  loadConfig,
  loadIdeConfig,
  validateProject,
  getIdeSettings,
  getAvailableIdes,
  getAvailableProjectTypes
};
