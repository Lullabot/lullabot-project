import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import yaml from 'js-yaml';
import chalk from 'chalk';

/**
 * Copy project rules to the appropriate location
 */
async function copyRules(ide, projectType, ideConfig, verbose = false, isUpdate = false) {
  const ideSettings = ideConfig.ides[ide];
  // Infer rules path from IDE key (e.g., "cursor" -> ".cursor/rules")
  const rulesPath = `.${ide}/rules`;
  const targetDir = path.join(process.cwd(), rulesPath);

  // Source directory for rules
  const toolDir = path.dirname(new URL(import.meta.url).pathname);
  const sourceDir = path.join(toolDir, '..', 'rules', ide, projectType);

  if (!await fs.pathExists(sourceDir)) {
    throw new Error(`Rules not found for ${ide}/${projectType}`);
  }

  // Create target directory if it doesn't exist
  await fs.ensureDir(targetDir);

  // Copy all files from source to target
  const files = await fs.readdir(sourceDir);
  const copiedFiles = [];

  for (const file of files) {
    const sourceFile = path.join(sourceDir, file);
    const targetFile = path.join(targetDir, file);

    if (verbose) {
      console.log(chalk.gray(`  Copying: ${file}`));
    }

    await fs.copy(sourceFile, targetFile);
    copiedFiles.push(path.join(rulesPath, file));
  }

  if (verbose) {
    console.log(chalk.green(`✅ Copied ${copiedFiles.length} rule files to ${targetDir}`));
  }

  return copiedFiles;
}

/**
 * Execute memory bank setup command
 */
async function executeMemoryBank(ide, ideConfig, verbose = false) {
  const ideSettings = ideConfig.ides[ide];
  const command = ideSettings['memory-bank-command'];

  if (!command) {
    throw new Error(`Memory bank command not configured for ${ide}`);
  }

  if (verbose) {
    console.log(chalk.gray(`  Executing: ${command}`));
  }

  try {
    const output = execSync(command, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: verbose ? 'inherit' : 'pipe'
    });

    if (verbose) {
      console.log(chalk.green(`✅ Memory bank setup completed`));
    }

    // Extract package name from command (e.g., "npx cursor-bank init" -> "cursor-bank")
    const packageName = command.split(' ')[1];

    // Get package version information
    const packageInfo = await getPackageVersion(packageName, verbose);

    return {
      output,
      packageInfo
    };
  } catch (error) {
    throw new Error(`Memory bank setup failed: ${error.message}`);
  }
}

/**
 * Create configuration file
 */
async function createConfigFile(config, verbose = false) {
  const configData = {
    project: {
      type: config.project?.type || config.project,
      ide: config.project?.ide || config.ide
    },
    features: {
      memoryBank: config.features?.memoryBank || config.memoryBank,
      rules: config.features?.rules || config.rules
    },
    installation: {
      created: config.installation?.created || new Date().toISOString(),
      updated: new Date().toISOString(),
      toolVersion: '1.0.0'
    },
    files: config.files || [],
    packages: config.packages || {}
  };

  const configPath = path.join(process.cwd(), '.lullabot-project.yml');

  if (verbose) {
    console.log(chalk.gray(`  Creating configuration file: ${configPath}`));
  }

  await fs.writeFile(configPath, yaml.dump(configData, { indent: 2 }));

  if (verbose) {
    console.log(chalk.green(`✅ Configuration file created`));
  }

  return configPath;
}

/**
 * Read configuration file
 */
async function readConfigFile() {
  const configPath = path.join(process.cwd(), '.lullabot-project.yml');

  if (!await fs.pathExists(configPath)) {
    return null;
  }

  try {
    const configContent = await fs.readFile(configPath, 'utf8');
    return yaml.load(configContent);
  } catch (error) {
    throw new Error(`Failed to read configuration file: ${error.message}`);
  }
}

/**
 * Update configuration file with new data
 */
async function updateConfigFile(config, verbose = false) {
  const existingConfig = await readConfigFile();
  if (!existingConfig) {
    throw new Error('No existing configuration found');
  }

  // Merge existing config with new data
  const updatedConfig = {
    ...existingConfig,
    ...config,
    installation: {
      ...existingConfig.installation,
      updated: new Date().toISOString()
    }
  };

  const configPath = path.join(process.cwd(), '.lullabot-project.yml');

  if (verbose) {
    console.log(chalk.gray(`  Updating configuration file: ${configPath}`));
  }

  await fs.writeFile(configPath, yaml.dump(updatedConfig, { indent: 2 }));

  if (verbose) {
    console.log(chalk.green(`✅ Configuration file updated`));
  }

  return configPath;
}

/**
 * Check if configuration file exists
 */
async function configExists() {
  const configPath = path.join(process.cwd(), '.lullabot-project.yml');
  return await fs.pathExists(configPath);
}

/**
 * Get list of files created by the tool
 */
async function getCreatedFiles(config) {
  const files = [];

  if (config.features?.rules) {
    const ideSettings = await loadIdeConfig();
    const rulesPath = ideSettings.ides[config.project.ide].rulesPath;
    const rulesDir = path.join(process.cwd(), rulesPath, config.project.type);

    if (await fs.pathExists(rulesDir)) {
      const ruleFiles = await fs.readdir(rulesDir);
      ruleFiles.forEach(file => {
        files.push(path.join(rulesPath, config.project.type, file));
      });
    }
  }

  return files;
}

/**
 * Get package version information
 */
async function getPackageVersion(packageName, verbose = false) {
  try {
    if (verbose) {
      console.log(chalk.gray(`  Checking version for: ${packageName}`));
    }

    // Try to get version using npx
    const command = `npx ${packageName} --version`;
    const output = execSync(command, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: verbose ? 'inherit' : 'pipe',
      timeout: 10000 // 10 second timeout
    });

    const version = output.trim();
    if (verbose) {
      console.log(chalk.gray(`  Found version: ${version}`));
    }

    return {
      name: packageName,
      version: version,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    if (verbose) {
      console.log(chalk.gray(`  Could not get version for ${packageName}: ${error.message}`));
    }
    return {
      name: packageName,
      version: 'unknown',
      lastUpdated: new Date().toISOString(),
      error: error.message
    };
  }
}

export {
  copyRules,
  executeMemoryBank,
  createConfigFile,
  readConfigFile,
  updateConfigFile,
  configExists,
  getCreatedFiles,
  getPackageVersion
};
