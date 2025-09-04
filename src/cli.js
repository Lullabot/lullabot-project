/**
 * Refactored cli.js - More testable version
 *
 * Key improvements:
 * - Dependencies injected as parameters
 * - Large functions broken down into smaller, focused functions
 * - Pure functions that can be tested in isolation
 * - Separated business logic from UI logic
 * - Extracted utility functions for better testability
 */

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
 * @param {Object} dependencies - Injected dependencies
 * @param {Function} dependencies.promptUser - Function to get user input
 * @param {Function} dependencies.loadConfig - Function to load configuration
 * @param {Function} dependencies.getTasks - Function to get tasks for tool/project
 * @param {Function} dependencies.validateProject - Function to validate project
 * @param {Function} dependencies.executeTask - Function to execute tasks
 * @param {Function} dependencies.createConfigFile - Function to create config file
 * @param {Object} dependencies.chalk - Chalk instance for styling
 * @param {Function} dependencies.logFn - Console.log function (can be mocked)
 * @param {Function} dependencies.spinnerFn - Spinner creation function (can be mocked)
 * @returns {Promise<void>}
 */
async function initSetup(options, dependencies) {
  const {
    promptUser,
    loadConfig,
    getTasks,
    validateProject,
    createConfigFile,
    chalk,
    logFn = console.log,
    spinnerFn
  } = dependencies;

  // Handle dry run mode - show what would be done without making changes
  if (options.dryRun) {
    await handleDryRun(options, {
      promptUser,
      loadConfig,
      getTasks,
      chalk,
      logFn
    });
    return;
  }

  // Create spinner for progress indication
  const spinner = spinnerFn
    ? spinnerFn('Initializing development environment...')
    : null;

  try {
    // Load configuration from config files
    const fullConfig = await loadConfig();

    // Get user input (interactive or from options)
    let config = await promptUser(
      options,
      fullConfig,
      dependencies.promptUser,
      dependencies.getTasks
    );

    // Get tasks for the tool and project type
    const tasks = await getTasks(config.tool, config.project, fullConfig);

    // Validate project if not skipped and project is selected
    if (!options.skipValidation && config.project) {
      spinner?.start('Validating project...');
      await validateProject(config.project, config.tool, fullConfig);
      spinner?.succeed('Project validation passed');
    } else if (!options.skipValidation && !config.project) {
      logFn(chalk.gray('Skipping project validation (no project selected)'));
    }

    // Execute enabled tasks
    spinner?.start('Executing tasks...');
    const results = await executeEnabledTasks(
      config,
      tasks,
      fullConfig,
      options,
      dependencies
    );
    spinner?.succeed('Task execution completed');

    // Process task results to extract copied files and package information
    config = processTaskResults(config, results);

    // Create configuration file
    spinner?.start('Creating configuration file...');
    await createConfigFile(config, fullConfig);
    spinner?.succeed('Configuration file created');

    // Display success summary
    displaySuccessSummary(config, results, { chalk, logFn });
  } catch (error) {
    spinner?.fail('Setup failed');
    throw error;
  }
}

/**
 * Handle dry run mode - show what would be done without making changes
 */
async function handleDryRun(options, dependencies) {
  const { promptUser, loadConfig, getTasks, chalk, logFn } = dependencies;

  logFn(chalk.blue('🔍 DRY RUN - What would be done:'));
  logFn('─'.repeat(50));

  // Load configuration from config files
  const fullConfig = await loadConfig();

  // Get user input (interactive or from options)
  const config = await promptUser(
    options,
    fullConfig,
    dependencies.promptUser,
    dependencies.getTasks
  );

  // Get tasks for the tool and project type
  const tasks = getTasks(config.tool, config.project, fullConfig);

  logFn('\n📋 Configuration that would be created:');
  logFn(`• Tool: ${chalk.cyan(config.tool)}`);
  if (config.project) {
    logFn(`• Project Type: ${chalk.cyan(config.project)}`);
  } else {
    logFn(
      `• Project Type: ${chalk.gray('None (project-specific tasks disabled)')}`
    );
  }

  // Show enabled tasks based on user preferences
  const enabledTasks = Object.entries(config.taskPreferences || {})
    .filter(([_, enabled]) => enabled)
    .map(([taskId, _]) => tasks[taskId]?.name || taskId);

  if (enabledTasks.length > 0) {
    logFn(`• Tasks: ${chalk.green('✅')} ${enabledTasks.join(', ')}`);
  } else {
    logFn(`• Tasks: ${chalk.gray('❌ None selected')}`);
  }

  logFn('\n🔧 Actions that would be performed:');

  // Show validation step if not skipped
  if (!options.skipValidation) {
    if (config.project) {
      logFn(`• Validate project type: ${config.project}`);
    } else {
      logFn(`• Skip project validation (no project selected)`);
    }
  }

  // Show what each enabled task would do
  for (const [taskId, task] of Object.entries(tasks)) {
    if (config.taskPreferences[taskId]) {
      if (task.type === 'command') {
        logFn(`• Execute: ${task.command}`);
      } else if (task.type === 'package-install') {
        logFn(`• Install package: ${task.package.name} (${task.package.type})`);
        logFn(`  Command: ${task.package['install-command']}`);
      } else if (task.type === 'copy-files') {
        // Replace placeholders in source and target paths
        const source = task.source
          .replace(/{tool}/g, config.tool)
          .replace(
            /{project-type}/g,
            config.project?.type || config.project || ''
          );
        const target = task.target
          .replace(/{tool}/g, config.tool)
          .replace(
            /{project-type}/g,
            config.project?.type || config.project || ''
          );

        logFn(`• Copy files from: ${source} → ${target}`);
      }
    }
  }

  logFn(`\n${'─'.repeat(50)}`);
  logFn(chalk.yellow('💡 This was a dry run - no changes were made.'));
  logFn(
    chalk.yellow('   Run without --dry-run to actually perform the setup.')
  );
}

/**
 * Process task execution results to extract copied files and package information.
 * Updates the configuration object with the results.
 *
 * @param {Object} config - Configuration object to update
 * @param {Array} results - Task execution results
 * @returns {Object} Updated configuration object
 */
function processTaskResults(config, results) {
  const updatedConfig = { ...config };

  // Initialize arrays/objects if they don't exist
  updatedConfig.files = updatedConfig.files || [];
  updatedConfig.packages = updatedConfig.packages || {};

  // Process successful task results
  for (const result of results) {
    if (result.success && result.result) {
      if (result.task.type === 'copy-files') {
        // Add copied files to the files array
        if (Array.isArray(result.result)) {
          updatedConfig.files.push(...result.result);
        }
      } else if (result.task.type === 'package-install') {
        // Add package information
        if (result.result.packageInfo) {
          const packageName = result.task.package.name;
          updatedConfig.packages[packageName] = result.result.packageInfo;
        }
      }
    }
  }

  return updatedConfig;
}

/**
 * Execute enabled tasks and return results
 */
async function executeEnabledTasks(
  config,
  tasks,
  fullConfig,
  options,
  dependencies
) {
  const { executeTask, logFn, chalk } = dependencies;
  const results = [];

  for (const [taskId, task] of Object.entries(tasks)) {
    if (
      config.features?.taskPreferences?.[taskId] ||
      config.taskPreferences?.[taskId]
    ) {
      try {
        const result = await executeTask(
          task,
          config.tool,
          config.project,
          options.verbose || false,
          dependencies
        );
        results.push({ taskId, task, result, success: true });
        logFn(chalk.green(`✅ ${task.name || taskId}: Completed`));
      } catch (error) {
        results.push({ taskId, task, error, success: false });
        logFn(
          chalk.red(`❌ ${task.name || taskId}: Failed - ${error.message}`)
        );
      }
    }
  }
  return results;
}

/**
 * Display success summary after setup completion
 */
function displaySuccessSummary(config, results, dependencies) {
  const { chalk, logFn } = dependencies;

  logFn(chalk.green('\n🎉 Setup completed successfully!'));
  logFn('\n📋 Summary:');
  logFn(`• Tool: ${chalk.cyan(config.tool)}`);
  if (config.project) {
    logFn(`• Project Type: ${chalk.cyan(config.project)}`);
  } else {
    logFn(
      `• Project Type: ${chalk.gray('None (project-specific tasks disabled)')}`
    );
  }

  const successfulTasks = results.filter((r) => r.success);
  const failedTasks = results.filter((r) => !r.success);

  if (successfulTasks.length > 0) {
    logFn(`• Successful Tasks: ${chalk.green('✅')} ${successfulTasks.length}`);
    successfulTasks.forEach(({ task }) => {
      logFn(`  - ${task.name || 'Unknown task'}`);
    });
  }

  if (failedTasks.length > 0) {
    logFn(`• Failed Tasks: ${chalk.red('❌')} ${failedTasks.length}`);
    failedTasks.forEach(({ task, error }) => {
      logFn(`  - ${task.name || 'Unknown task'}: ${error.message}`);
    });
  }

  logFn(chalk.blue('\n💡 Next steps:'));
  logFn('  • Review the created configuration file (.lullabot-project.yml)');
  logFn('  • Customize settings as needed');
  logFn('  • Run "lullabot-project update" to apply changes');
}

/**
 * Update existing development environment setup.
 * Checks for updates and applies them based on configuration.
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
 * @param {Object} dependencies - Injected dependencies
 * @returns {Promise<void>}
 */
async function updateSetup(options, dependencies) {
  const {
    loadConfig,
    readConfigFile,
    chalk,
    logFn = console.log,
    spinnerFn
  } = dependencies;

  // Create spinner for progress indication
  const spinner = spinnerFn ? spinnerFn('Checking for updates...') : null;

  try {
    // Load current configuration
    const currentConfig = await readConfigFile();
    if (!currentConfig) {
      throw new Error(
        'No existing configuration found. Run "lullabot-project init" first.'
      );
    }

    // Load full configuration
    const fullConfig = await loadConfig();

    // Check if update is needed
    spinner?.start('Checking if update is needed...');
    const updateNeeded = await checkIfUpdateNeeded(
      currentConfig,
      options.verbose,
      dependencies
    );

    if (!updateNeeded && !options.force) {
      spinner?.succeed('No updates needed');
      logFn(chalk.green('✅ Your setup is already up to date!'));
      return;
    }

    spinner?.succeed('Update needed');

    // Handle dry run mode
    if (options.dryRun) {
      await handleUpdateDryRun(
        currentConfig,
        fullConfig,
        options,
        dependencies
      );
      return;
    }

    // Perform the update
    spinner?.start('Applying updates...');
    const results = await performUpdate(
      currentConfig,
      fullConfig,
      options,
      dependencies
    );
    spinner?.succeed('Update completed');

    // Display update summary
    displayUpdateSummary(results, { chalk, logFn });
  } catch (error) {
    spinner?.fail('Update failed');
    throw error;
  }
}

/**
 * Check if an update is needed by comparing versions
 */
async function checkIfUpdateNeeded(currentConfig, verbose, dependencies) {
  const { getToolVersion, logFn, chalk } = dependencies;

  try {
    const currentToolVersion =
      currentConfig.installation?.toolVersion || currentConfig.toolVersion;
    const latestToolVersion = await getToolVersion();

    if (verbose) {
      logFn(chalk.gray(`Current tool version: ${currentToolVersion}`));
      logFn(chalk.gray(`Latest tool version: ${latestToolVersion}`));
    }

    return currentToolVersion !== latestToolVersion;
  } catch (error) {
    if (verbose) {
      logFn(
        chalk.yellow(
          `Warning: Could not determine tool version: ${error.message}`
        )
      );
    }
    return true; // Assume update is needed if we can't determine version
  }
}

/**
 * Handle dry run mode for updates
 */
async function handleUpdateDryRun(
  currentConfig,
  fullConfig,
  options,
  dependencies
) {
  const { chalk, logFn } = dependencies;

  logFn(chalk.blue('🔍 DRY RUN - What would be updated:'));
  logFn('─'.repeat(50));
  logFn(`• Current tool version: ${chalk.cyan(currentConfig.toolVersion)}`);
  logFn(
    `• Force update: ${options.force ? chalk.yellow('Yes') : chalk.gray('No')}`
  );
  logFn('\n🔧 Actions that would be performed:');
  logFn('• Re-run all enabled tasks');
  logFn('• Update configuration file');
  logFn(`\n${'─'.repeat(50)}`);
  logFn(chalk.yellow('💡 This was a dry run - no changes were made.'));
}

/**
 * Perform the actual update
 */
async function performUpdate(currentConfig, fullConfig, options, dependencies) {
  const { getTasks, executeTask, createConfigFile } = dependencies;

  // Get tasks for the current tool and project
  const tool = currentConfig.project?.tool || currentConfig.tool;
  const projectType = currentConfig.project?.type;
  const tasks = await getTasks(tool, projectType, fullConfig);

  // Execute all enabled tasks
  const results = [];
  for (const [taskId, task] of Object.entries(tasks)) {
    if (
      currentConfig.features?.taskPreferences?.[taskId] ||
      currentConfig.taskPreferences?.[taskId]
    ) {
      try {
        const result = await executeTask(
          task,
          tool,
          projectType,
          false,
          dependencies
        );
        results.push({ taskId, task, result, success: true });
      } catch (error) {
        results.push({ taskId, task, error, success: false });
      }
    }
  }

  // Update configuration file with new tool version
  await createConfigFile(currentConfig, fullConfig);

  return results;
}

/**
 * Display update summary
 */
function displayUpdateSummary(results, dependencies) {
  const { chalk, logFn } = dependencies;

  logFn(chalk.green('\n🎉 Update completed successfully!'));

  const successfulTasks = results.filter((r) => r.success);
  const failedTasks = results.filter((r) => !r.success);

  if (successfulTasks.length > 0) {
    logFn(`\n✅ Successfully updated: ${successfulTasks.length} tasks`);
    successfulTasks.forEach(({ task }) => {
      logFn(`  • ${task.name || 'Unknown task'}`);
    });
  }

  if (failedTasks.length > 0) {
    logFn(`\n❌ Failed to update: ${failedTasks.length} tasks`);
    failedTasks.forEach(({ task, error }) => {
      logFn(`  • ${task.name || 'Unknown task'}: ${error.message}`);
    });
  }
}

/**
 * Show current configuration and status.
 *
 * @param {Object} options - Command line options and flags
 * @param {boolean} options.checkUpdates - Whether to check for available updates
 * @param {boolean} options.json - Whether to output in JSON format
 * @param {boolean} options.verbose - Whether to show detailed output
 * @param {Object} dependencies - Injected dependencies
 * @returns {Promise<void>}
 */
async function showConfig(options, dependencies) {
  const {
    readConfigFile,
    loadConfig,
    chalk,
    logFn = console.log
  } = dependencies;

  try {
    // Load current configuration
    const currentConfig = await readConfigFile();
    if (!currentConfig) {
      logFn(
        chalk.yellow(
          'No configuration found. Run "lullabot-project init" first.'
        )
      );
      return;
    }

    // Load full configuration for additional details
    const fullConfig = await loadConfig();

    if (options.json) {
      // Output in JSON format
      const jsonOutput = {
        tool: currentConfig.tool,
        project: currentConfig.project,
        toolVersion: currentConfig.toolVersion,
        taskPreferences:
          currentConfig.features?.taskPreferences ||
          currentConfig.taskPreferences ||
          {},
        files: currentConfig.files || [],
        packages: currentConfig.packages || {}
      };
      logFn(JSON.stringify(jsonOutput, null, 2));
      return;
    }

    // Display configuration in human-readable format
    await displayConfig(currentConfig, fullConfig, options, dependencies);

    // Check for updates if requested
    if (options.checkUpdates) {
      await checkForUpdates(currentConfig, options, dependencies);
    }
  } catch (error) {
    throw new Error(`Failed to display configuration: ${error.message}`);
  }
}

/**
 * Display configuration in human-readable format
 */
async function displayConfig(currentConfig, fullConfig, options, dependencies) {
  const { chalk, logFn } = dependencies;

  logFn(chalk.blue('📋 Current Configuration:'));
  logFn('─'.repeat(50));
  // Handle new configuration structure
  const tool = currentConfig.project?.tool || currentConfig.tool;
  const projectType = currentConfig.project?.type;

  logFn(`• Tool: ${chalk.cyan(tool || 'Not specified')}`);

  if (projectType) {
    logFn(`• Project Type: ${chalk.cyan(projectType)}`);
  } else {
    logFn(
      `• Project Type: ${chalk.gray('None (project-specific tasks disabled)')}`
    );
  }

  logFn(
    `• Tool Version: ${chalk.cyan(currentConfig.installation?.toolVersion || currentConfig.toolVersion || 'Not specified')}`
  );

  // Show enabled tasks
  const { getTasks } = dependencies;
  const tasks = await getTasks(tool, projectType, fullConfig);
  const enabledTasks = Object.entries(
    currentConfig.features?.taskPreferences ||
      currentConfig.taskPreferences ||
      {}
  )
    .filter(([_, enabled]) => enabled)
    .map(([taskId, _]) => tasks[taskId]?.name || taskId);

  if (enabledTasks.length > 0) {
    logFn(`• Enabled Tasks: ${chalk.green('✅')} ${enabledTasks.join(', ')}`);
  } else {
    logFn(`• Enabled Tasks: ${chalk.gray('❌ None')}`);
  }

  // Show created files
  if (currentConfig.files && currentConfig.files.length > 0) {
    logFn(
      `• Created Files: ${chalk.green('📁')} ${currentConfig.files.length} files`
    );
    if (options.verbose) {
      currentConfig.files.forEach((file) => {
        logFn(`  - ${file}`);
      });
    }
  } else {
    logFn(`• Created Files: ${chalk.gray('📁 None')}`);
  }

  // Show installed packages
  if (
    currentConfig.packages &&
    Object.keys(currentConfig.packages).length > 0
  ) {
    logFn(
      `• Installed Packages: ${chalk.green('📦')} ${Object.keys(currentConfig.packages).length} packages`
    );
    if (options.verbose) {
      Object.entries(currentConfig.packages).forEach(
        ([packageName, packageInfo]) => {
          logFn(`  - ${packageName}@${packageInfo.version}`);
        }
      );
    }
  } else {
    logFn(`• Installed Packages: ${chalk.gray('📦 None')}`);
  }
}

/**
 * Check for available updates
 */
async function checkForUpdates(currentConfig, options, dependencies) {
  const { getToolVersion, chalk, logFn } = dependencies;

  try {
    logFn(`\n${chalk.blue('🔄 Checking for updates...')}`);

    const currentVersion =
      currentConfig.installation?.toolVersion || currentConfig.toolVersion;
    const latestVersion = await getToolVersion();

    if (currentVersion === latestVersion) {
      logFn(chalk.green('✅ You have the latest version!'));
    } else {
      logFn(
        chalk.yellow(
          `🔄 Update available: ${currentVersion} → ${latestVersion}`
        )
      );
      logFn(chalk.blue('💡 Run "lullabot-project update" to apply updates.'));
    }
  } catch (error) {
    logFn(chalk.yellow(`⚠️  Could not check for updates: ${error.message}`));
  }
}

/**
 * Remove all files and configuration created by lullabot-project.
 *
 * @param {Object} options - Command line options and flags
 * @param {boolean} options.dryRun - Whether to perform a dry run without making changes
 * @param {boolean} options.verbose - Whether to show detailed output
 * @param {boolean} options.force - Whether to skip confirmation prompt
 * @param {Object} dependencies - Injected dependencies
 * @returns {Promise<void>}
 */
async function removeSetup(options, dependencies) {
  const {
    readConfigFile,
    confirmAction,
    chalk,
    logFn = console.log,
    spinnerFn
  } = dependencies;

  // Create spinner for progress indication
  const spinner = spinnerFn ? spinnerFn('Preparing for removal...') : null;

  try {
    // Load current configuration
    const currentConfig = await readConfigFile();
    if (!currentConfig) {
      logFn(chalk.yellow('No configuration found. Nothing to remove.'));
      return;
    }

    // Confirm removal unless forced
    if (!options.force) {
      const confirmed = await confirmAction(
        'Are you sure you want to remove all files and configuration created by lullabot-project?',
        false
      );
      if (!confirmed) {
        logFn(chalk.blue('Removal cancelled.'));
        return;
      }
    }

    // Handle dry run mode
    if (options.dryRun) {
      await handleRemoveDryRun(currentConfig, options, dependencies);
      return;
    }

    // Perform removal
    spinner?.start('Removing files...');
    const removedFiles = await performRemoval(
      currentConfig,
      options,
      dependencies
    );
    spinner?.succeed('Removal completed successfully!');

    // Display removal summary
    displayRemovalSummary(removedFiles, { chalk, logFn });
  } catch (error) {
    spinner?.fail('Removal failed');
    throw error;
  }
}

/**
 * Handle dry run mode for removal
 */
async function handleRemoveDryRun(currentConfig, options, dependencies) {
  const { chalk, logFn } = dependencies;

  logFn(chalk.blue('🔍 DRY RUN - What would be removed:'));
  logFn('─'.repeat(50));
  logFn(`• Configuration file: ${chalk.cyan('.lullabot-project.yml')}`);

  if (currentConfig.files && currentConfig.files.length > 0) {
    logFn(`• Files: ${chalk.red('🗑️')} ${currentConfig.files.length} files`);
    if (options.verbose) {
      currentConfig.files.forEach((file) => {
        logFn(`  - ${file}`);
      });
    }
  } else {
    logFn(`• Files: ${chalk.gray('🗑️ None')}`);
  }

  logFn(`\n${'─'.repeat(50)}`);
  logFn(chalk.yellow('💡 This was a dry run - no changes were made.'));
}

/**
 * Perform the actual removal
 */
async function performRemoval(currentConfig, options, dependencies) {
  const { fs, path, chalk, logFn } = dependencies;
  const removedFiles = [];

  // Remove configuration file
  if (await fs.pathExists('.lullabot-project.yml')) {
    await fs.remove('.lullabot-project.yml');
    if (options.verbose) {
      logFn(chalk.gray('  Removed: .lullabot-project.yml'));
    }
  }

  // Remove created files
  if (currentConfig.files && currentConfig.files.length > 0) {
    for (const fileInfo of currentConfig.files) {
      // Handle both old format (strings) and new format (objects)
      const filePath = typeof fileInfo === 'string' ? fileInfo : fileInfo.path;
      const fullPath = path.resolve(filePath);

      if (options.verbose) {
        logFn(
          chalk.gray(
            `  Debug: filePath=${filePath}, fullPath=${fullPath}, cwd=${process.cwd()}`
          )
        );
      }

      // Validate path safety
      if (!isPathSafe(filePath, process.cwd(), fullPath, path)) {
        logFn(chalk.yellow(`  Skipped (unsafe path): ${filePath}`));
        continue;
      }

      if (await fs.pathExists(fullPath)) {
        await fs.remove(fullPath);
        removedFiles.push(filePath);
        if (options.verbose) {
          logFn(chalk.gray(`  Removed: ${fullPath}`));
        }
      } else {
        if (options.verbose) {
          logFn(chalk.gray(`  File not found: ${fullPath}`));
        }
      }
    }
  }

  return removedFiles;
}

/**
 * Display removal summary
 */
function displayRemovalSummary(removedFiles, dependencies) {
  const { chalk, logFn } = dependencies;

  logFn(chalk.green('\n✅ Files removed:'));
  removedFiles.forEach((file) => {
    logFn(chalk.green(`  • ${file}`));
  });

  if (removedFiles.length === 0) {
    logFn(chalk.yellow('  No files were found to remove.'));
  }

  logFn(
    chalk.blue(
      '\n💡 Note: Memory bank files (if any) were not removed as they may be used by other projects.'
    )
  );
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
function isPathSafe(filePath, currentDir, resolvedPath, path) {
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

// Export the refactored functions
export {
  initSetup,
  updateSetup,
  showConfig,
  removeSetup,
  // Export utility functions for testing
  handleDryRun,
  executeEnabledTasks,
  displaySuccessSummary,
  checkIfUpdateNeeded,
  handleUpdateDryRun,
  performUpdate,
  displayUpdateSummary,
  displayConfig,
  checkForUpdates,
  handleRemoveDryRun,
  performRemoval,
  displayRemovalSummary,
  isPathSafe
};
// Export a factory function for backward compatibility
export function createCLI(dependencies) {
  return {
    initSetup: (options) => initSetup(options, dependencies),
    updateSetup: (options) => updateSetup(options, dependencies),
    showConfig: (options) => showConfig(options, dependencies),
    removeSetup: (options) => removeSetup(options, dependencies)
  };
}
