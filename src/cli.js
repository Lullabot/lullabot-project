import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { promptUser } from './prompts.js';
import { loadConfig, loadToolConfig, validateProject } from './tool-config.js';
import {
  executeTask,
  createConfigFile,
  readConfigFile,
  getPackageVersion,
  getToolVersion
} from './file-operations.js';
import { confirmAction } from './prompts.js';
import { isProjectDirectory } from './validation.js';

/**
 * Initialize development environment setup with comprehensive configuration.
 * Handles both interactive and non-interactive modes, dry runs, and verbose output.
 *
 * @param {Object} options - Command line options and flags
 * @param {boolean} options.dryRun - Whether to perform a dry run without making changes
 * @param {boolean} options.verbose - Whether to show detailed output
 * @param {boolean} options.skipValidation - Whether to skip project validation
 * @param {string} options.tool - Tool to use (if provided via command line)
 * @param {string} options.project - Project type (if provided via command line)
 * @param {string} options.tasks - Comma-separated list of tasks to enable
 * @param {string} options.skipTasks - Comma-separated list of tasks to skip
 * @param {boolean} options.allTasks - Whether to enable all available tasks
 */
async function initSetup(options) {
  // Handle dry run mode - show what would be done without making changes
  if (options.dryRun) {
    console.log(chalk.blue('🔍 DRY RUN - What would be done:'));
    console.log('─'.repeat(50));

    try {
      // Load configuration from config files
      const fullConfig = await loadConfig();

      // Get user input (interactive or from options)
      const config = await promptUser(options, fullConfig);

      // Get tasks for the tool and project type
      const { getTasks } = await import('./tool-config.js');
      const tasks = getTasks(config.tool, config.project, fullConfig);

      console.log('\n📋 Configuration that would be created:');
      console.log(`• Tool: ${chalk.cyan(config.tool)}`);
      if (config.project) {
        console.log(`• Project Type: ${chalk.cyan(config.project)}`);
      } else {
        console.log(
          `• Project Type: ${chalk.gray('None (project-specific tasks disabled)')}`
        );
      }

      // Show enabled tasks based on user preferences
      const enabledTasks = Object.entries(config.taskPreferences || {})
        .filter(([_, enabled]) => enabled)
        .map(([taskId, _]) => tasks[taskId]?.name || taskId);

      if (enabledTasks.length > 0) {
        console.log(`• Tasks: ${chalk.green('✅')} ${enabledTasks.join(', ')}`);
      } else {
        console.log(`• Tasks: ${chalk.gray('❌ None selected')}`);
      }

      console.log('\n🔧 Actions that would be performed:');

      // Show validation step if not skipped
      if (!options.skipValidation) {
        if (config.project) {
          console.log(`• Validate project type: ${config.project}`);
        } else {
          console.log(`• Skip project validation (no project selected)`);
        }
      }

      // Show what each enabled task would do
      for (const [taskId, task] of Object.entries(tasks)) {
        if (config.taskPreferences[taskId]) {
          if (task.type === 'command') {
            console.log(`• Execute: ${task.command}`);
          } else if (task.type === 'package-install') {
            console.log(
              `• Install package: ${task.package.name} (${task.package.type})`
            );
            console.log(`  Command: ${task.package['install-command']}`);
          } else if (task.type === 'copy-files') {
            // Replace placeholders in source and target paths
            const source = task.source
              .replace(/{tool}/g, config.tool)
              .replace(/{project-type}/g, config.project || '');
            const target = task.target
              .replace(/{tool}/g, config.tool)
              .replace(/{project-type}/g, config.project || '');

            // Check if this is a Git-based source for special handling
            if (source.startsWith('assets/')) {
              console.log(
                `• Copy files from Git repository: ${source} to ${target}`
              );
            } else {
              console.log(`• Copy files from ${source} to ${target}`);
            }
          }
        }
      }

      console.log('• Create configuration file: .lullabot-project.yml');

      console.log(
        `\n${chalk.yellow('Note: No actual changes would be made.')}`
      );
      return;
    } catch (error) {
      console.error(chalk.red('❌ Dry run failed:'), error.message);
      throw error;
    }
  }

  const spinner = ora('Initializing development environment...').start();

  try {
    // Load configuration from config files
    const fullConfig = await loadConfig();

    // Stop spinner before showing prompts to avoid overlap
    spinner.stop();

    // Get user input (interactive or from options)
    const config = await promptUser(options, fullConfig);

    // Get tasks for the tool and project type
    const { getTasks } = await import('./tool-config.js');
    const tasks = getTasks(config.tool, config.project, fullConfig);

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
      await validateProject(config.project, config.tool, fullConfig);
    }

    // Execute tasks based on user preferences
    const executedTasks = [];
    const copiedFiles = [];
    const packages = {};

    // Process each task that the user has enabled
    for (const [taskId, task] of Object.entries(tasks)) {
      if (config.taskPreferences[taskId]) {
        spinner.text = `Executing ${task.name}...`;
        const result = await executeTask(
          task,
          config.tool,
          config.project,
          options.verbose
        );
        executedTasks.push(taskId);

        // Collect copied files and package info for tracking
        if (task.type === 'copy-files') {
          copiedFiles.push(...result);
        }
        if (result.packageInfo) {
          packages[taskId] = result.packageInfo;
        }
      }
    }

    // Convert flat config to nested structure for storage
    const nestedConfig = {
      project: {
        tool: config.tool,
        type: config.project || null // Ensure null is explicitly set for "none"
      },
      features: {
        taskPreferences: config.taskPreferences
      },
      installation: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        toolVersion: getToolVersion()
      },
      files: copiedFiles,
      packages
    };

    // Create configuration file
    spinner.text = 'Saving configuration...';
    await createConfigFile(nestedConfig, options.verbose);

    spinner.succeed('Setup completed successfully!');

    // Display success summary
    displaySuccessSummary(config, tasks);
  } catch (error) {
    spinner.fail('Setup failed');
    throw error;
  }
}

/**
 * Update existing development environment setup with new configuration.
 * Handles both interactive and non-interactive modes, dry runs, and verbose output.
 * Supports partial updates and force mode for corrupted configurations.
 *
 * @param {Object} options - Command line options and flags
 * @param {boolean} options.dryRun - Whether to perform a dry run without making changes
 * @param {boolean} options.verbose - Whether to show detailed output
 * @param {boolean} options.force - Whether to force update even with corrupted config
 * @param {string} options.tool - Tool to use (if provided via command line)
 * @param {string} options.project - Project type (if provided via command line)
 * @param {string} options.tasks - Comma-separated list of tasks to enable
 * @param {string} options.skipTasks - Comma-separated list of tasks to skip
 * @param {boolean} options.allTasks - Whether to enable all available tasks
 */
async function updateSetup(options) {
  // Handle dry run mode - show what would be updated without making changes
  if (options.dryRun) {
    console.log(chalk.blue('🔍 DRY RUN - What would be updated:'));
    console.log('─'.repeat(50));

    try {
      // Load existing configuration
      const existingConfig = await readConfigFile();
      if (!existingConfig && !options.force) {
        throw new Error(
          'No existing configuration found. Run "lullabot-project init" to setup.'
        );
      }

      // Load configuration
      const fullConfig = await loadConfig();

      // Use stored configuration as base, or create new if force mode
      let config;
      if (
        options.force &&
        (!existingConfig ||
          !existingConfig.project ||
          !existingConfig.project.tool)
      ) {
        // Force mode with corrupted config - prompt for new configuration
        console.log(
          chalk.yellow(
            '⚠️  Force mode: Configuration appears corrupted. Recreating...'
          )
        );
        config = await promptUser(options, fullConfig);
      } else {
        config = { ...existingConfig };
      }

      // Only apply overrides if explicitly provided
      if (options.tool) {
        if (!fullConfig.tools[options.tool]) {
          throw new Error(
            `Unsupported tool: ${options.tool}. Available tools: ${Object.keys(fullConfig.tools).join(', ')}`
          );
        }
        if (!config.project) config.project = {};
        config.project.tool = options.tool;
      }

      if (options.project) {
        if (!fullConfig.projects[options.project]) {
          const availableProjects = Object.keys(fullConfig.projects).join(', ');
          throw new Error(
            `Unsupported project type: ${options.project}. Available projects: ${availableProjects}`
          );
        }
        if (!config.project) config.project = {};
        config.project.type = options.project;
      }

      // Get tasks for the tool and project type
      const { getTasks } = await import('./tool-config.js');
      const tasks = getTasks(
        config.project?.tool || config.tool,
        config.project?.type || config.project,
        fullConfig
      );

      // Handle task options
      if (options.skipTasks) {
        const skipTaskList = options.skipTasks.split(',').map((t) => t.trim());
        if (!config.features) config.features = {};
        if (!config.features.taskPreferences)
          config.features.taskPreferences = {};
        for (const taskId of skipTaskList) {
          config.features.taskPreferences[taskId] = false;
        }
      }

      if (options.tasks) {
        const taskList = options.tasks.split(',').map((t) => t.trim());
        if (!config.features) config.features = {};
        config.features.taskPreferences = {};
        for (const [taskId] of Object.entries(tasks)) {
          config.features.taskPreferences[taskId] = taskList.includes(taskId);
        }
      }

      if (options.allTasks) {
        if (!config.features) config.features = {};
        config.features.taskPreferences = {};
        for (const [taskId] of Object.entries(tasks)) {
          config.features.taskPreferences[taskId] = true;
        }
      }

      // Display current and updated configuration
      console.log('\n📋 Current configuration:');
      console.log(
        `• Tool: ${chalk.cyan(existingConfig.project?.tool || existingConfig.tool || 'Unknown')}`
      );
      if (existingConfig.project?.type || existingConfig.project) {
        console.log(
          `• Project Type: ${chalk.cyan(existingConfig.project?.type || existingConfig.project)}`
        );
      } else {
        console.log(
          `• Project Type: ${chalk.gray('None (project-specific tasks disabled)')}`
        );
      }

      // Show current tasks
      if (existingConfig.features?.taskPreferences) {
        const currentTasks = Object.entries(
          existingConfig.features.taskPreferences
        )
          .filter(([_, enabled]) => enabled)
          .map(([taskId, _]) => tasks[taskId]?.name || taskId);
        if (currentTasks.length > 0) {
          console.log(
            `• Tasks: ${chalk.green('✅')} ${currentTasks.join(', ')}`
          );
        } else {
          console.log(`• Tasks: ${chalk.gray('❌ None')}`);
        }
      } else {
        console.log(`• Tasks: ${chalk.gray('❌ None')}`);
      }

      console.log('\n📋 Updated configuration:');
      console.log(
        `• Tool: ${chalk.cyan(config.project?.tool || config.tool || 'Unknown')}`
      );
      if (config.project?.type || config.project) {
        console.log(
          `• Project Type: ${chalk.cyan(config.project?.type || config.project)}`
        );
      } else {
        console.log(
          `• Project Type: ${chalk.gray('None (project-specific tasks disabled)')}`
        );
      }

      // Show updated tasks
      if (config.features?.taskPreferences) {
        const updatedTasks = Object.entries(config.features.taskPreferences)
          .filter(([_, enabled]) => enabled)
          .map(([taskId, _]) => tasks[taskId]?.name || taskId);
        if (updatedTasks.length > 0) {
          console.log(
            `• Tasks: ${chalk.green('✅')} ${updatedTasks.join(', ')}`
          );
        } else {
          console.log(`• Tasks: ${chalk.gray('❌ None')}`);
        }
      } else {
        console.log(`• Tasks: ${chalk.gray('❌ None')}`);
      }

      console.log('\n🔧 Actions that would be performed:');

      // Show what tasks would be executed
      for (const [taskId, task] of Object.entries(tasks)) {
        if (config.features?.taskPreferences?.[taskId]) {
          if (task.type === 'command') {
            console.log(`• Execute: ${task.command}`);
          } else if (task.type === 'package-install') {
            console.log(
              `• Install package: ${task.package.name} (${task.package.type})`
            );
            console.log(`  Command: ${task.package['install-command']}`);
          } else if (task.type === 'copy-files') {
            const source = task.source
              .replace(/{tool}/g, config.project?.tool || config.tool)
              .replace(
                /{project-type}/g,
                config.project?.type || config.project || ''
              );
            const target = task.target
              .replace(/{tool}/g, config.project?.tool || config.tool)
              .replace(
                /{project-type}/g,
                config.project?.type || config.project || ''
              );

            // Check if this is a Git-based source
            if (source.startsWith('assets/')) {
              console.log(
                `• Copy files from Git repository: ${source} to ${target}`
              );
            } else {
              console.log(`• Copy files from ${source} to ${target}`);
            }
          }
        }
      }

      console.log('• Update configuration file: .lullabot-project.yml');

      console.log(
        `\n${chalk.yellow('Note: No actual changes would be made.')}`
      );
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
      throw new Error(
        'No existing configuration found. Run "lullabot-project init" to setup.'
      );
    }

    // Load configuration
    const fullConfig = await loadConfig();

    // Use stored configuration as base, or create new if force mode
    let config;
    if (
      options.force &&
      (!existingConfig ||
        !existingConfig.project ||
        !existingConfig.project.tool)
    ) {
      // Force mode with corrupted config - prompt for new configuration
      spinner.stop();
      console.log(
        chalk.yellow(
          '⚠️  Force mode: Configuration appears corrupted. Recreating...'
        )
      );
      const flatConfig = await promptUser(options, fullConfig);

      // Convert flat config to nested structure
      config = {
        project: {
          tool: flatConfig.tool,
          type: flatConfig.project
        },
        features: {
          taskPreferences: flatConfig.taskPreferences
        },
        installation: {
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          toolVersion: getToolVersion()
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
    if (options.tool) {
      if (!fullConfig.tools[options.tool]) {
        throw new Error(
          `Unsupported tool: ${options.tool}. Available tools: ${Object.keys(fullConfig.tools).join(', ')}`
        );
      }
      if (!config.project) config.project = {};
      config.project.tool = options.tool;
    }

    if (options.project) {
      if (!fullConfig.projects[options.project]) {
        const availableProjects = Object.keys(fullConfig.projects).join(', ');
        throw new Error(
          `Unsupported project type: ${options.project}. Available projects: ${availableProjects}`
        );
      }
      if (!config.project) config.project = {};
      config.project.type = options.project;
    }

    // Ensure config has the correct structure for the rest of the function
    if (!config.project) {
      config.project = {
        tool: config.tool,
        type: config.project
      };
    }

    // Get tasks for the tool and project type
    const { getTasks } = await import('./tool-config.js');
    const tasks = getTasks(
      config.project?.tool || config.tool,
      config.project?.type || config.project,
      fullConfig
    );

    // Handle task options
    if (options.skipTasks) {
      const skipTaskList = options.skipTasks.split(',').map((t) => t.trim());
      if (!config.features) config.features = {};
      if (!config.features.taskPreferences)
        config.features.taskPreferences = {};
      for (const taskId of skipTaskList) {
        config.features.taskPreferences[taskId] = false;
      }
    }

    if (options.tasks) {
      const taskList = options.tasks.split(',').map((t) => t.trim());
      if (!config.features) config.features = {};
      config.features.taskPreferences = {};
      for (const [taskId] of Object.entries(tasks)) {
        config.features.taskPreferences[taskId] = taskList.includes(taskId);
      }
    }

    if (options.allTasks) {
      if (!config.features) config.features = {};
      config.features.taskPreferences = {};
      for (const [taskId] of Object.entries(tasks)) {
        config.features.taskPreferences[taskId] = true;
      }
    }

    if (options.verbose) {
      spinner.stop();
      console.log(chalk.blue('📋 Current configuration:'), existingConfig);
      console.log(chalk.blue('📋 Updated configuration:'), config);
    }

    // Execute tasks based on configuration
    const executedTasks = [];
    const copiedFiles = [];
    const packages = {};

    for (const [taskId, task] of Object.entries(tasks)) {
      if (config.features?.taskPreferences?.[taskId]) {
        spinner.text = `Executing ${task.name}...`;
        const result = await executeTask(
          task,
          config.project?.tool || config.tool,
          config.project?.type || config.project,
          options.verbose
        );
        executedTasks.push(taskId);

        // Collect copied files and package info
        if (task.type === 'copy-files') {
          copiedFiles.push(...result);
        }
        if (result.packageInfo) {
          packages[taskId] = result.packageInfo;
        }
      }
    }

    // Update config with results
    config.files = copiedFiles;
    config.packages = { ...config.packages, ...packages };

    // Update configuration file
    spinner.text = 'Updating configuration...';
    await createConfigFile(config, options.verbose);

    spinner.succeed('Update completed successfully!');

    // Display update summary
    displayUpdateSummary(config, tasks);
  } catch (error) {
    spinner.fail('Update failed');
    throw error;
  }
}

/**
 * Show current configuration and status with optional update checking.
 * Displays configuration in both human-readable and JSON formats.
 *
 * @param {Object} options - Command line options and flags
 * @param {boolean} options.checkUpdates - Whether to check for available updates
 * @param {boolean} options.json - Whether to output in JSON format
 * @param {boolean} options.verbose - Whether to show detailed output
 */
async function showConfig(options) {
  // Load existing configuration
  const config = await readConfigFile();
  if (!config) {
    console.log(
      chalk.yellow(
        '⚠️  No configuration found. Run "lullabot-project init" to setup.'
      )
    );
    return;
  }

  // Check for updates if requested
  if (options.checkUpdates) {
    await checkForUpdates(config, options);
  }

  // Display configuration
  displayConfig(config, options);
}

/**
 * Check for available updates for the tool and installed packages.
 * Compares current versions with latest available versions.
 *
 * @param {Object} config - Current configuration object
 * @param {Object} options - Command line options and flags
 */
async function checkForUpdates(config, options) {
  console.log(chalk.blue('\n🔍 Checking for updates...'));

  try {
    // Load tool configuration
    const toolConfig = await loadToolConfig();

    const updates = [];

    // Check tool version (simplified - in real implementation would check against latest release)
    const currentVersion = config.installation?.toolVersion || getToolVersion();
    const latestVersion = getToolVersion();
    if (currentVersion !== latestVersion) {
      updates.push({
        type: 'tool',
        current: currentVersion,
        latest: latestVersion,
        description: 'Tool version update available'
      });
    }

    // Check package versions for all enabled tasks
    if (config.features?.taskPreferences) {
      for (const [taskId, enabled] of Object.entries(
        config.features.taskPreferences
      )) {
        if (enabled) {
          const taskPackage = config.packages?.[taskId];
          if (taskPackage && taskPackage.version !== 'unknown') {
            try {
              // Get the tool to find the package configuration
              const tool = config.project?.tool || config.tool;

              // Get the full package configuration from the tool config
              const toolSettings = toolConfig.tools[tool];
              const task = toolSettings?.tasks?.[taskId];
              const packageConfig = task?.package;

              if (packageConfig) {
                // Get current version from the package using the full configuration
                const currentPackageInfo = await getPackageVersion(
                  packageConfig,
                  false
                );
                if (currentPackageInfo.version !== taskPackage.version) {
                  updates.push({
                    type: taskId,
                    current: taskPackage.version,
                    latest: currentPackageInfo.version,
                    description: `${taskPackage.name} update available`
                  });
                }
              } else {
                // Fallback to just using the package name
                const currentPackageInfo = await getPackageVersion(
                  taskPackage.name,
                  false
                );
                if (currentPackageInfo.version !== taskPackage.version) {
                  updates.push({
                    type: taskId,
                    current: taskPackage.version,
                    latest: currentPackageInfo.version,
                    description: `${taskPackage.name} update available`
                  });
                }
              }
            } catch (error) {
              // If we can't check the version, don't add an update
              if (options.verbose) {
                console.log(
                  chalk.gray(
                    `  Could not check ${taskPackage.name} version: ${error.message}`
                  )
                );
              }
            }
          }
        }
      }
    }

    if (updates.length > 0) {
      console.log(chalk.yellow('\n🔄 Available Updates:'));
      updates.forEach((update) => {
        console.log(
          `• ${update.description}: ${update.current} → ${update.latest}`
        );
      });
      console.log(
        chalk.gray('\n💡 Run "lullabot-project update" to install updates')
      );
    } else {
      console.log(chalk.green('✅ All components are up to date'));
    }
  } catch (error) {
    console.log(
      chalk.yellow('⚠️  Could not check for updates:'),
      error.message
    );
  }
}

/**
 * Display success summary after setup completion.
 * Shows what was configured and where files were placed.
 *
 * @param {Object} config - Configuration object
 * @param {Object} tasks - Available tasks object
 */
function displaySuccessSummary(config, tasks) {
  console.log(`\n${chalk.green('✅ Setup completed successfully!')}`);
  console.log('\n📋 Summary:');
  console.log(
    `• Tool: ${chalk.cyan(config.project?.tool || config.tool || 'Unknown')}`
  );
  if (config.project) {
    console.log(`• Project Type: ${chalk.cyan(config.project)}`);
  } else {
    console.log(
      `• Project Type: ${chalk.gray('None (project-specific tasks disabled)')}`
    );
  }

  // Display enabled tasks
  const enabledTasks = Object.entries(config.taskPreferences || {})
    .filter(([_, enabled]) => enabled)
    .map(([taskId, _]) => tasks[taskId]?.name || taskId);

  if (enabledTasks.length > 0) {
    console.log(`• Tasks: ${chalk.green('✅')} ${enabledTasks.join(', ')}`);
  } else {
    console.log(`• Tasks: ${chalk.gray('❌ None selected')}`);
  }

  // Show actual files that were copied (not just task configuration)
  if (config.files && config.files.length > 0) {
    console.log('\n📁 Files copied to:');
    config.files.forEach((filePath) => {
      console.log(`  • ${filePath}`);
    });
  } else {
    console.log('\n📁 Files copied: None');
  }

  console.log('\n🎉 Your development environment is ready!');
  console.log(
    chalk.gray('Run "lullabot-project config" to see your current setup.')
  );
}

/**
 * Display update summary after update completion.
 * Shows what was updated and current status.
 *
 * @param {Object} config - Configuration object
 * @param {Object} tasks - Available tasks object
 */
function displayUpdateSummary(config, tasks) {
  console.log(`\n${chalk.green('✅ Update completed successfully!')}`);
  console.log('\n📋 Updated:');
  console.log(
    `• Tool: ${chalk.cyan(config.project?.tool || config.tool || 'Unknown')}`
  );
  if (config.project?.type) {
    console.log(`• Project Type: ${chalk.cyan(config.project.type)}`);
  } else {
    console.log(
      `• Project Type: ${chalk.gray('None (project-specific tasks disabled)')}`
    );
  }

  // Display enabled tasks
  if (config.features?.taskPreferences && tasks) {
    const enabledTasks = Object.entries(config.features.taskPreferences)
      .filter(([_, enabled]) => enabled)
      .map(([taskId, _]) => tasks[taskId]?.name || taskId);

    if (enabledTasks.length > 0) {
      console.log(
        `• Tasks: ${chalk.green('✅ Updated')} ${enabledTasks.join(', ')}`
      );
    } else {
      console.log(`• Tasks: ${chalk.gray('❌ None enabled')}`);
    }
  } else {
    console.log(`• Tasks: ${chalk.gray('❌ None configured')}`);
  }

  console.log('\n🎉 Your development environment is up to date!');
}

/**
 * Display current configuration in human-readable or JSON format.
 * Handles both old and new configuration formats for backward compatibility.
 *
 * @param {Object} config - Configuration object
 * @param {Object} options - Command line options and flags
 */
function displayConfig(config, options) {
  // Handle JSON output
  if (options.json) {
    const jsonOutput = {
      project: {
        type: config.project?.type || null, // Always use the type field, fallback to null
        tool: config.project?.tool || config.tool
      },
      features: {
        taskPreferences:
          config.features?.taskPreferences || config.taskPreferences
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

  console.log(`\n💻 Tool: ${chalk.cyan(config.project?.tool || config.tool)}`);
  if (config.project?.type) {
    console.log(`📦 Project Type: ${chalk.cyan(config.project.type)}`);
  } else {
    console.log(
      `📦 Project Type: ${chalk.gray('None (project-specific tasks disabled)')}`
    );
  }
  console.log(
    `📅 Installed: ${chalk.gray(config.installation?.created || 'Unknown')}`
  );
  console.log(
    `🔄 Last Updated: ${chalk.gray(config.installation?.updated || 'Unknown')}`
  );
  console.log(
    `📦 Tool Version: ${chalk.gray(config.installation?.toolVersion || 'Unknown')}`
  );

  console.log('\n✅ Features Enabled:');

  // Handle both old and new config formats
  if (config.features?.taskPreferences) {
    // New task-based format
    const enabledTasks = Object.entries(config.features.taskPreferences)
      .filter(([_, enabled]) => enabled)
      .map(([taskId, _]) => taskId);

    if (enabledTasks.length > 0) {
      console.log(`• Tasks: ${chalk.green('✅')} ${enabledTasks.join(', ')}`);
    } else {
      console.log(`• Tasks: ${chalk.gray('❌ None')}`);
    }
  }

  // Show package information if available
  if (config.packages && Object.keys(config.packages).length > 0) {
    console.log('\n📦 Packages:');
    Object.entries(config.packages).forEach(([_, pkg]) => {
      const version =
        pkg.version === 'unknown'
          ? chalk.gray('unknown')
          : chalk.cyan(pkg.version);
      console.log(`• ${pkg.name}: ${version}`);
    });
  }

  if (options.verbose && config.files && config.files.length > 0) {
    console.log('\n📁 Files:');
    config.files.forEach((file) => {
      if (file) {
        console.log(`  • ${file}`);
      }
    });
  }

  console.log('\n📁 Configuration: .lullabot-project.yml');
}

/**
 * Remove all files and configuration created by lullabot-project.
 * Handles both dry run mode and actual removal with confirmation.
 *
 * @param {Object} options - Command line options and flags
 * @param {boolean} options.dryRun - Whether to perform a dry run without making changes
 * @param {boolean} options.verbose - Whether to show detailed output
 * @param {boolean} options.force - Whether to skip confirmation prompt
 */
async function removeSetup(options) {
  // Handle dry run mode - show what would be removed without making changes
  if (options.dryRun) {
    console.log(chalk.blue('🔍 DRY RUN - What would be removed:'));
    console.log('─'.repeat(50));

    try {
      // Load existing configuration to see what was created
      const existingConfig = await readConfigFile();
      if (!existingConfig) {
        console.log(
          chalk.yellow('⚠️  No configuration found. Nothing to remove.')
        );
        return;
      }

      console.log('\n📋 Files that would be removed:');

      // Configuration file
      console.log('• Configuration file: .lullabot-project.yml');

      // Tool-specific files based on configuration
      if (existingConfig.project?.tool) {
        // Show copied files from all copy-files tasks
        if (existingConfig.features?.taskPreferences && existingConfig.files) {
          const copyTasks = Object.entries(
            existingConfig.features.taskPreferences
          ).filter(([_, enabled]) => enabled);

          if (copyTasks.length > 0) {
            console.log('• Copied files:');
            existingConfig.files.forEach((filePath) => {
              console.log(`  - ${filePath}`);
            });
          }
        }
      }

      console.log(
        `\n${chalk.yellow('Note: No actual changes would be made.')}`
      );
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
      console.log(
        chalk.yellow('⚠️  No configuration found. Nothing to remove.')
      );
      return;
    }

    // Ask for confirmation unless force flag is used
    if (!options.force) {
      spinner.stop();
      const confirmed = await confirmAction(
        'Are you sure you want to remove all lullabot-project files and configuration?'
      );
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

    // Remove tool-specific files
    if (existingConfig.project?.tool) {
      // Remove specific files that were created by the tool
      if (existingConfig.features?.taskPreferences && existingConfig.files) {
        console.log(
          chalk.blue('\n🔍 Validating file paths for safe removal...')
        );

        for (const filePath of existingConfig.files) {
          // CRITICAL: Validate that the file path is safe and within the current directory
          const fullPath = path.resolve(process.cwd(), filePath);
          const currentDir = process.cwd();

          if (options.verbose) {
            console.log(chalk.gray(`  Checking: ${filePath} -> ${fullPath}`));
          }

          // Use the improved path validation logic
          if (!isPathSafe(filePath, currentDir, fullPath)) {
            console.log(
              chalk.red(
                `⚠️  Skipping unsafe file path: ${filePath} (resolves to: ${fullPath})`
              )
            );
            continue;
          }

          if (await fs.pathExists(fullPath)) {
            await fs.remove(fullPath);
            removedFiles.push(filePath);
            if (options.verbose) {
              console.log(chalk.gray(`  Removed: ${fullPath}`));
            }
          } else {
            if (options.verbose) {
              console.log(chalk.gray(`  File not found: ${fullPath}`));
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
    removedFiles.forEach((file) => {
      console.log(chalk.green(`  • ${file}`));
    });

    if (removedFiles.length === 0) {
      console.log(chalk.yellow('  No files were found to remove.'));
    }

    console.log(
      chalk.blue(
        '\n💡 Note: Memory bank files (if any) were not removed as they may be used by other projects.'
      )
    );
  } catch (error) {
    spinner.fail('Removal failed');
    throw error;
  }
}

/**
 * Validate that a file path is safe for removal.
 * Prevents path traversal attacks and ensures files can only be removed from the current directory.
 *
 * @param {string} filePath - The file path to validate
 * @param {string} currentDir - The current working directory
 * @param {string} resolvedPath - The resolved absolute path
 * @returns {boolean} True if the path is safe, false otherwise
 */
function isPathSafe(filePath, currentDir, resolvedPath) {
  // Check for empty or invalid file paths
  if (!filePath || filePath.trim() === '') {
    return false;
  }

  // Check if the resolved path is within the current directory
  if (
    !resolvedPath.startsWith(currentDir + path.sep) &&
    resolvedPath !== currentDir
  ) {
    return false;
  }

  // Check for dangerous path patterns in the original filePath
  const dangerousPatterns = [
    /\.\./g, // Parent directory traversal
    /\.\.\\/g, // Windows-style parent directory traversal
    /\.\.%2F/gi, // URL-encoded parent directory traversal
    /\.\.%5C/gi, // URL-encoded Windows-style parent directory traversal
    /^\.\.$/, // Just ".."
    /^\.\.\/$/, // Just "../"
    /^\.\.\\$/, // Just "..\"
    /^\.\.\.\./ // Multiple dots that could be malicious
  ];

  // Check if the filePath contains any dangerous patterns
  for (const pattern of dangerousPatterns) {
    if (pattern.test(filePath)) {
      return false;
    }
  }

  // Check if the path contains too many directory separators that could indicate traversal
  const separators = (filePath.match(/[/\\]/g) || []).length;
  if (separators > 10) {
    // Arbitrary limit to catch excessive nesting
    return false;
  }

  return true;
}

export { initSetup, updateSetup, showConfig, removeSetup };
