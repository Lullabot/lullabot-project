import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { promptUser } from './prompts.js';
import { loadConfig, loadIdeConfig, validateProject } from './ide-config.js';
import { copyRules, executeMemoryBank, createConfigFile, readConfigFile, getPackageVersion } from './file-operations.js';
import { confirmAction } from './prompts.js';
import { isProjectDirectory } from './validation.js';

/**
 * Initialize development environment setup
 */
async function initSetup(options) {
  // Handle dry run
  if (options.dryRun) {
    console.log(chalk.blue('🔍 DRY RUN - What would be done:'));
    console.log('─'.repeat(50));

    try {
      // Load configuration
      const fullConfig = await loadConfig();

      // Get user input (interactive or from options)
      const config = await promptUser(options, fullConfig);

      console.log(`\n📋 Configuration that would be created:`);
      console.log(`• IDE: ${chalk.cyan(config.ide)}`);
      console.log(`• Project Type: ${chalk.cyan(config.project)}`);
      console.log(`• Memory Bank: ${config.memoryBank ? chalk.green('✅') : chalk.gray('❌')}`);
      console.log(`• Project Rules: ${config.rules ? chalk.green('✅') : chalk.gray('❌')}`);

      console.log(`\n🔧 Actions that would be performed:`);

      if (!options.skipValidation) {
        console.log(`• Validate project type: ${config.project}`);
      }

      if (config.memoryBank) {
        const ideSettings = fullConfig.ides[config.ide];
        if (ideSettings && ideSettings['memory-bank-command']) {
          if (options.verbose) {
            console.log(chalk.gray(`  IDE Settings for ${config.ide}:`), ideSettings);
          }
          console.log(`• Execute memory bank command: ${ideSettings['memory-bank-command']}`);
        } else {
          console.log(`• Skip memory bank setup (${config.ide} does not support external memory banks)`);
        }
      } else if (options.skipMemoryBank) {
        console.log(`• Skip memory bank setup (--skip-memory-bank)`);
              } else {
          const ideSettings = fullConfig.ides[config.ide];
          if (!ideSettings || !ideSettings['memory-bank-command']) {
            console.log(`• Skip memory bank setup (${config.ide} does not support external memory banks)`);
          } else {
            console.log(`• Skip memory bank setup (not enabled)`);
          }
        }

      if (config.rules) {
        console.log(`• Copy rules to: .${config.ide}/rules/`);
      } else {
        console.log(`• Skip project rules (--skip-rules)`);
      }

      console.log(`• Create configuration file: .lullabot-project.yml`);

      console.log(`\n${chalk.yellow('Note: No actual changes would be made.')}`);
      return;
    } catch (error) {
      console.error(chalk.red('❌ Dry run failed:'), error.message);
      throw error;
    }
  }

  const spinner = ora('Initializing development environment...').start();

  try {
    // Load configuration
    const fullConfig = await loadConfig();

    // Stop spinner before showing prompts to avoid overlap
    spinner.stop();

    // Get user input (interactive or from options)
    const config = await promptUser(options, fullConfig);

    if (options.verbose) {
      console.log(chalk.blue('📋 Configuration:'), config);
    }

    // Restart spinner for the actual setup process
    spinner.start('Setting up development environment...');

    // Check if we're in a project directory (always run this check)
    spinner.text = 'Checking project directory...';
    await isProjectDirectory(options.verbose);

    // Validate project type if not skipped
    if (!options.skipValidation) {
      spinner.text = 'Validating project type...';
      await validateProject(config.project, config.ide, fullConfig);
    }

    // Execute memory bank setup if enabled and IDE supports it
    if (config.memoryBank) {
      const ideSettings = fullConfig.ides[config.ide];
      if (ideSettings && ideSettings['memory-bank-command']) {
        spinner.text = 'Setting up memory bank...';
        const memoryBankResult = await executeMemoryBank(config.ide, { ides: fullConfig.ides }, options.verbose);

        // Store package information
        if (memoryBankResult.packageInfo) {
          config.packages = {
            ...config.packages,
            memoryBank: memoryBankResult.packageInfo
          };
        }
              } else {
          if (options.verbose) {
            console.log(chalk.gray(`  Skipping memory bank setup - ${config.ide} does not support external memory banks`));
          }
        }
    }

    // Copy project rules if enabled
    if (config.rules) {
      spinner.text = 'Copying project rules...';
      const copiedFiles = await copyRules(config.ide, config.project, { ides: fullConfig.ides }, options.verbose);
      config.files = copiedFiles;
    }

    // Convert flat config to nested structure for storage
    const nestedConfig = {
      project: {
        ide: config.ide,
        type: config.project
      },
      features: {
        memoryBank: config.memoryBank,
        rules: config.rules
      },
      installation: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        toolVersion: '1.0.0'
      },
      files: config.files || [],
      packages: config.packages || {}
    };

    // Create configuration file
    spinner.text = 'Saving configuration...';
    await createConfigFile(nestedConfig, options.verbose);

    spinner.succeed('Setup completed successfully!');

    // Display success summary
    displaySuccessSummary(config);

  } catch (error) {
    spinner.fail('Setup failed');
    throw error;
  }
}

/**
 * Update existing development environment setup
 */
async function updateSetup(options) {
  // Handle dry run
  if (options.dryRun) {
    console.log(chalk.blue('🔍 DRY RUN - What would be updated:'));
    console.log('─'.repeat(50));

    try {
      // Load existing configuration
      const existingConfig = await readConfigFile();
      if (!existingConfig && !options.force) {
        throw new Error('No existing configuration found. Run "lullabot-project init" to setup.');
      }

      // Load configuration
      const fullConfig = await loadConfig();

      // Use stored configuration as base, or create new if force mode
      let config;
      if (options.force && (!existingConfig || !existingConfig.project || !existingConfig.project.ide)) {
        // Force mode with corrupted config - prompt for new configuration
        console.log(chalk.yellow('⚠️  Force mode: Configuration appears corrupted. Recreating...'));
        config = await promptUser(options, fullConfig);
      } else {
        config = { ...existingConfig };
      }

      // Only apply overrides if explicitly provided
      if (options.ide) {
        if (!fullConfig.ides[options.ide]) {
          throw new Error(`Unsupported IDE: ${options.ide}. Available IDEs: ${Object.keys(fullConfig.ides).join(', ')}`);
        }
        if (!config.project) config.project = {};
        config.project.ide = options.ide;
      }

      if (options.project) {
        if (!fullConfig.projects[options.project]) {
          const availableProjects = Object.keys(fullConfig.projects).join(', ');
          throw new Error(`Unsupported project type: ${options.project}. Available projects: ${availableProjects}`);
        }
        if (!config.project) config.project = {};
        config.project.type = options.project;
      }

      // Handle skip options for memory bank and rules
      if (options.skipMemoryBank) {
        config.features = { ...config.features, memoryBank: false };
      }

      if (options.skipRules) {
        config.features = { ...config.features, rules: false };
      }

      console.log(`\n📋 Current configuration:`);
      console.log(`• IDE: ${chalk.cyan(existingConfig.project?.ide || existingConfig.ide || 'Unknown')}`);
      console.log(`• Project Type: ${chalk.cyan(existingConfig.project?.type || existingConfig.project || 'Unknown')}`);
      console.log(`• Memory Bank: ${existingConfig.features?.memoryBank || existingConfig.memoryBank ? chalk.green('✅') : chalk.gray('❌')}`);
      console.log(`• Project Rules: ${existingConfig.features?.rules || existingConfig.rules ? chalk.green('✅') : chalk.gray('❌')}`);

      console.log(`\n📋 Updated configuration:`);
      console.log(`• IDE: ${chalk.cyan(config.project?.ide || config.ide || 'Unknown')}`);
      console.log(`• Project Type: ${chalk.cyan(config.project?.type || config.project || 'Unknown')}`);
      console.log(`• Memory Bank: ${config.features?.memoryBank || config.memoryBank ? chalk.green('✅') : chalk.gray('❌')}`);
      console.log(`• Project Rules: ${config.features?.rules || config.rules ? chalk.green('✅') : chalk.gray('❌')}`);

      console.log(`\n🔧 Actions that would be performed:`);

      if (config.memoryBank) {
        const ideSettings = fullConfig.ides[config.ide];
        console.log(`• Execute memory bank command: ${ideSettings['memory-bank-command']}`);
      }

      if (config.rules) {
        const ideSettings = fullConfig.ides[config.ide];
        console.log(`• Update rules in: .${ideSettings['rules-path']}/`);
      }

      console.log(`• Update configuration file: .lullabot-project.yml`);

      console.log(`\n${chalk.yellow('Note: No actual changes would be made.')}`);
      return;
    } catch (error) {
      console.error(chalk.red('❌ Dry run failed:'), error.message);
      throw error;
    }
  }

  const spinner = ora('Updating development environment...').start();

  try {
    // Load existing configuration
    const existingConfig = await readConfigFile();
    if (!existingConfig && !options.force) {
      throw new Error('No existing configuration found. Run "lullabot-project init" to setup.');
    }

          // Load configuration
      const fullConfig = await loadConfig();

      // Use stored configuration as base, or create new if force mode
      let config;
      if (options.force && (!existingConfig || !existingConfig.project || !existingConfig.project.ide)) {
        // Force mode with corrupted config - prompt for new configuration
        spinner.stop();
        console.log(chalk.yellow('⚠️  Force mode: Configuration appears corrupted. Recreating...'));
        const flatConfig = await promptUser(options, fullConfig);

      // Convert flat config to nested structure
      config = {
        project: {
          ide: flatConfig.ide,
          type: flatConfig.project
        },
        features: {
          memoryBank: flatConfig.memoryBank,
          rules: flatConfig.rules
        },
        installation: {
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          toolVersion: '1.0.0'
        },
        files: [],
        packages: {}
      };

      // Restart spinner for the actual update process
      spinner.start('Updating development environment...');
    } else {
      config = { ...existingConfig };
    }

    // Only apply overrides if explicitly provided
    if (options.ide) {
      if (!ideConfig.ides[options.ide]) {
        throw new Error(`Unsupported IDE: ${options.ide}. Available IDEs: ${Object.keys(ideConfig.ides).join(', ')}`);
      }
      if (!config.project) config.project = {};
      config.project.ide = options.ide;
    }

    if (options.project) {
      if (options.project !== 'drupal') {
        throw new Error(`Unsupported project type: ${options.project}. Currently only 'drupal' is supported.`);
      }
      if (!config.project) config.project = {};
      config.project.type = options.project;
    }

    // Ensure config has the correct structure for the rest of the function
    if (!config.project) {
      config.project = {
        ide: config.ide,
        type: config.project
      };
    }

    // Handle skip options for memory bank and rules
    if (options.skipMemoryBank) {
      config.features = { ...config.features, memoryBank: false };
    }

    if (options.skipRules) {
      config.features = { ...config.features, rules: false };
    }

    if (options.verbose) {
      spinner.stop();
      console.log(chalk.blue('📋 Current configuration:'), existingConfig);
      console.log(chalk.blue('📋 Updated configuration:'), config);
    }

    // Execute memory bank update if enabled and IDE supports it
    if (config.features?.memoryBank || config.memoryBank) {
      const ide = config.project?.ide || config.ide;
      const ideSettings = fullConfig.ides[ide];
      if (ideSettings && ideSettings['memory-bank-command']) {
        spinner.text = 'Updating memory bank...';
        const memoryBankResult = await executeMemoryBank(ide, { ides: fullConfig.ides }, options.verbose);

        // Store package information
        if (memoryBankResult.packageInfo) {
          config.packages = {
            ...config.packages,
            memoryBank: memoryBankResult.packageInfo
          };
        }
              } else {
          if (options.verbose) {
            console.log(chalk.gray(`  Skipping memory bank update - ${ide} does not support external memory banks`));
          }
        }
    }

    // Update project rules if enabled
    if (config.features?.rules || config.rules) {
      spinner.text = 'Updating project rules...';
      const copiedFiles = await copyRules(config.project?.ide || config.ide, config.project?.type || config.project, { ides: fullConfig.ides }, options.verbose, true);
      config.files = copiedFiles;
    }

    // Update configuration file
    spinner.text = 'Updating configuration...';
    await createConfigFile(config, options.verbose);

    spinner.succeed('Update completed successfully!');

    // Display update summary
    displayUpdateSummary(config);

  } catch (error) {
    spinner.fail('Update failed');
    throw error;
  }
}

/**
 * Show current configuration and status
 */
async function showConfig(options) {
  try {
    // Load existing configuration
    const config = await readConfigFile();
    if (!config) {
      console.log(chalk.yellow('⚠️  No configuration found. Run "lullabot-project init" to setup.'));
      return;
    }

    // Check for updates if requested
    if (options.checkUpdates) {
      await checkForUpdates(config, options);
    }

    // Display configuration
    displayConfig(config, options);

  } catch (error) {
    throw error;
  }
}

/**
 * Check for available updates
 */
async function checkForUpdates(config, options) {
  console.log(chalk.blue('\n🔍 Checking for updates...'));

  try {
    // Load IDE configuration
    const ideConfig = await loadIdeConfig();

    const updates = [];

    // Check tool version (simplified - in real implementation would check against latest release)
    const currentVersion = config.installation?.toolVersion || '1.0.0';
    if (currentVersion !== '1.0.0') {
      updates.push({
        type: 'tool',
        current: currentVersion,
        latest: '1.0.0',
        description: 'Tool version update available'
      });
    }

    // Check memory bank package version
    if (config.features?.memoryBank || config.memoryBank) {
      const memoryBankPackage = config.packages?.memoryBank;
      if (memoryBankPackage && memoryBankPackage.version !== 'unknown') {
        try {
          // Get current version from the package
          const currentPackageInfo = await getPackageVersion(memoryBankPackage.name, false);

          if (currentPackageInfo.version !== memoryBankPackage.version) {
            updates.push({
              type: 'memory-bank',
              current: memoryBankPackage.version,
              latest: currentPackageInfo.version,
              description: `${memoryBankPackage.name} update available`
            });
          }
        } catch (error) {
          // If we can't check the version, don't add an update
          if (options.verbose) {
            console.log(chalk.gray(`  Could not check ${memoryBankPackage.name} version: ${error.message}`));
          }
        }
      }
    }

    if (updates.length > 0) {
      console.log(chalk.yellow('\n🔄 Available Updates:'));
      updates.forEach(update => {
        console.log(`• ${update.description}: ${update.current} → ${update.latest}`);
      });
      console.log(chalk.gray('\n💡 Run "lullabot-project update" to install updates'));
    } else {
      console.log(chalk.green('✅ All components are up to date'));
    }

  } catch (error) {
    console.log(chalk.yellow('⚠️  Could not check for updates:'), error.message);
  }
}

/**
 * Display success summary after setup
 */
function displaySuccessSummary(config) {
  console.log('\n' + chalk.green('✅ Setup completed successfully!'));
  console.log('\n📋 Summary:');
  console.log(`• IDE: ${chalk.cyan(config.project?.ide || config.ide)}`);
  console.log(`• Project Type: ${chalk.cyan(config.project?.type || config.project)}`);

  const ide = config.project?.ide || config.ide;
  const hasMemoryBank = config.features?.memoryBank || config.memoryBank;

  if (hasMemoryBank) {
    console.log(`• Memory Bank: ${chalk.green('✅ Installed')}`);
  } else {
    console.log(`• Memory Bank: ${chalk.gray('❌ Not installed')}`);
  }

  console.log(`• Project Rules: ${config.features?.rules || config.rules ? chalk.green('✅ Copied') : chalk.gray('❌ Not copied')}`);

  if (config.features?.rules || config.rules) {
    console.log(`\n📁 Rules location: .${ide}/rules/`);
  }

  console.log('\n🎉 Your development environment is ready!');
  console.log(chalk.gray('Run "lullabot-project config" to see your current setup.'));
}

/**
 * Display update summary after update
 */
function displayUpdateSummary(config) {
  console.log('\n' + chalk.green('✅ Update completed successfully!'));
  console.log('\n📋 Updated:');
  console.log(`• IDE: ${chalk.cyan(config.project?.ide || config.ide || 'Unknown')}`);
  console.log(`• Project Type: ${chalk.cyan(config.project?.type || 'Unknown')}`);

  const hasMemoryBank = config.features?.memoryBank || config.memoryBank;
  if (hasMemoryBank) {
    console.log(`• Memory Bank: ${chalk.green('✅ Updated')}`);
  } else {
    console.log(`• Memory Bank: ${chalk.gray('❌ Not enabled')}`);
  }

  console.log(`• Project Rules: ${config.features?.rules || config.rules ? chalk.green('✅ Updated') : chalk.gray('❌ Not enabled')}`);

  console.log('\n🎉 Your development environment is up to date!');
}

/**
 * Display current configuration
 */
function displayConfig(config, options) {
  // Handle JSON output
  if (options.json) {
    const jsonOutput = {
      project: {
        type: config.project?.type || config.project,
        ide: config.project?.ide || config.ide
      },
      features: {
        memoryBank: config.features?.memoryBank || config.memoryBank,
        rules: config.features?.rules || config.rules
      },
      installation: {
        created: config.installation?.created || 'Unknown',
        updated: config.installation?.updated || 'Unknown',
        toolVersion: config.installation?.toolVersion || 'Unknown'
      },
      files: config.files || [],
      packages: config.packages || {}
    };

    console.log(JSON.stringify(jsonOutput, null, 2));
    return;
  }

  // Regular formatted output
  console.log('\n📋 Lullabot Project Configuration');
  console.log('─'.repeat(50));

  console.log(`\n💻 IDE: ${chalk.cyan(config.project?.ide || config.ide)}`);
  console.log(`📦 Project Type: ${chalk.cyan(config.project?.type || config.project)}`);
  console.log(`📅 Installed: ${chalk.gray(config.installation?.created || 'Unknown')}`);
  console.log(`🔄 Last Updated: ${chalk.gray(config.installation?.updated || 'Unknown')}`);
  console.log(`📦 Tool Version: ${chalk.gray(config.installation?.toolVersion || 'Unknown')}`);

  console.log('\n✅ Features Enabled:');
  console.log(`• Memory Bank: ${config.features?.memoryBank ? chalk.green('✅') : chalk.gray('❌')}`);
  console.log(`• Project Rules: ${config.features?.rules ? chalk.green('✅') : chalk.gray('❌')}`);

  // Show package information if available
  if (config.packages && Object.keys(config.packages).length > 0) {
    console.log('\n📦 Packages:');
    Object.entries(config.packages).forEach(([key, pkg]) => {
      const version = pkg.version === 'unknown' ? chalk.gray('unknown') : chalk.cyan(pkg.version);
      console.log(`• ${pkg.name}: ${version}`);
    });
  }

  if (options.verbose && config.files && config.files.length > 0) {
    console.log('\n📁 Files:');
    config.files.forEach(file => {
      if (file) {
        console.log(`  • ${file}`);
      }
    });
  }

  console.log('\n📁 Configuration: .lullabot-project.yml');
}

/**
 * Remove all files and configuration created by lullabot-project
 */
async function removeSetup(options) {
  // Handle dry run
  if (options.dryRun) {
    console.log(chalk.blue('🔍 DRY RUN - What would be removed:'));
    console.log('─'.repeat(50));

    try {
      // Load existing configuration to see what was created
      const existingConfig = await readConfigFile();
      if (!existingConfig) {
        console.log(chalk.yellow('⚠️  No configuration found. Nothing to remove.'));
        return;
      }

      console.log(`\n📋 Files that would be removed:`);

      // Configuration file
      console.log(`• Configuration file: .lullabot-project.yml`);

      // IDE-specific files based on configuration
      if (existingConfig.project?.ide) {
        const ide = existingConfig.project.ide;
        const projectType = existingConfig.project?.type || 'unknown';

        // Rules directory
        if (existingConfig.features?.rules && existingConfig.files) {
          console.log(`• Rule files:`);
          existingConfig.files.forEach(filePath => {
            console.log(`  - ${filePath}`);
          });
        }

        // Memory bank files (if any were created)
        if (existingConfig.features?.memoryBank) {
          console.log(`• Memory bank files (if any were created by ${ide} memory bank tool)`);
        }
      }

      console.log(`\n${chalk.yellow('Note: No actual changes would be made.')}`);
      return;
    } catch (error) {
      console.error(chalk.red('❌ Dry run failed:'), error.message);
      throw error;
    }
  }

  const spinner = ora('Removing lullabot-project files...').start();

  try {
    // Load existing configuration
    const existingConfig = await readConfigFile();
    if (!existingConfig) {
      spinner.stop();
      console.log(chalk.yellow('⚠️  No configuration found. Nothing to remove.'));
      return;
    }

    // Ask for confirmation unless force flag is used
    if (!options.force) {
      spinner.stop();
      const confirmed = await confirmAction('Are you sure you want to remove all lullabot-project files and configuration?');
      if (!confirmed) {
        console.log(chalk.blue('❌ Removal cancelled.'));
        return;
      }
      spinner.start('Removing lullabot-project files...');
    }

    const removedFiles = [];

    // Remove configuration file
    const configPath = path.join(process.cwd(), '.lullabot-project.yml');
    if (await fs.pathExists(configPath)) {
      await fs.remove(configPath);
      removedFiles.push('.lullabot-project.yml');
      if (options.verbose) {
        console.log(chalk.gray(`  Removed: ${configPath}`));
      }
    }

          // Remove IDE-specific files
      if (existingConfig.project?.ide) {
        const ide = existingConfig.project.ide;

        // Remove specific rule files that were created by the tool
        if (existingConfig.features?.rules && existingConfig.files) {
          for (const filePath of existingConfig.files) {
            const fullPath = path.join(process.cwd(), filePath);
            if (await fs.pathExists(fullPath)) {
              await fs.remove(fullPath);
              removedFiles.push(filePath);
              if (options.verbose) {
                console.log(chalk.gray(`  Removed: ${fullPath}`));
              }
            }
          }
        }

        // Note: Memory bank files are typically managed by the memory bank tool itself
        // We don't remove them as they might be used by other projects
      }

    spinner.succeed('Removal completed successfully!');

    // Display summary
    console.log(chalk.green('\n✅ Files removed:'));
    removedFiles.forEach(file => {
      console.log(chalk.green(`  • ${file}`));
    });

    if (removedFiles.length === 0) {
      console.log(chalk.yellow('  No files were found to remove.'));
    }

    console.log(chalk.blue('\n💡 Note: Memory bank files (if any) were not removed as they may be used by other projects.'));

  } catch (error) {
    spinner.fail('Removal failed');
    throw error;
  }
}

export {
  initSetup,
  updateSetup,
  showConfig,
  removeSetup
};
