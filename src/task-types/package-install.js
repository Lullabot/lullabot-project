import { execSync } from 'child_process';
import chalk from 'chalk';

/**
 * Get the default version command for a package based on its type.
 * Returns the appropriate command to check package version.
 *
 * @param {string} packageName - Name of the package
 * @param {string} type - Package type (npx, npm, yarn, pnpm)
 * @returns {string} Version command to execute
 */
function getDefaultVersionCommand(packageName, type) {
  switch (type) {
    case 'npx':
      return `npx ${packageName} --version`;
    case 'npm':
      return `npm list ${packageName}`;
    case 'yarn':
      return `yarn list ${packageName}`;
    case 'pnpm':
      return `pnpm list ${packageName}`;
    default:
      return `${packageName} --version`;
  }
}

/**
 * Parse version from command output based on package type.
 * Handles different output formats from various package managers.
 *
 * @param {string} output - Raw command output
 * @param {string} type - Package type (npx, npm, yarn, pnpm)
 * @returns {string} Extracted version string
 */
function parseVersionFromOutput(output, type) {
  // Handle null/undefined output
  if (!output) {
    return 'unknown';
  }

  switch (type) {
    case 'npm':
    case 'yarn':
    case 'pnpm': {
      // Parse "└── package@version" format
      const match = output.match(/└── [^@]+@([^\s]+)/);
      return match ? match[1] : 'unknown';
    }
    default:
      // For npx and custom, assume direct version output
      return output.trim();
  }
}

/**
 * Get package version information by executing version command.
 * Handles both string package names and package configuration objects.
 *
 * @param {string|Object} packageConfig - Package name or configuration object
 * @param {boolean} verbose - Whether to show detailed output
 * @returns {Promise<Object>} Package information including name, version, and metadata
 */
async function getPackageVersion(packageConfig, verbose = false) {
  // Handle case where packageConfig is just a string (package name)
  if (typeof packageConfig === 'string') {
    packageConfig = { name: packageConfig, type: 'npx' };
  }

  const { name, type = 'npx' } = packageConfig;
  // Handle both camelCase and kebab-case property names
  const versionCommand =
    packageConfig.versionCommand || packageConfig['version-command'];

  try {
    if (verbose) {
      console.log(chalk.gray(`  Checking version for: ${name} (${type})`));
    }

    // Use custom version command if provided, otherwise use type-based defaults
    const command = versionCommand || getDefaultVersionCommand(name, type);

    const output = execSync(command, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: verbose ? 'inherit' : 'pipe',
      timeout: 10000
    });

    const version = parseVersionFromOutput(output, type);

    if (verbose) {
      console.log(chalk.gray(`  Found version: ${version}`));
    }

    return {
      name,
      version,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    if (verbose) {
      console.log(
        chalk.gray(`  Could not get version for ${name}: ${error.message}`)
      );
    }
    return {
      name,
      version: 'unknown',
      lastUpdated: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Execute a package installation task by running the install command.
 * Gets package version information after installation.
 *
 * @param {Object} task - Task configuration object
 * @param {string} tool - The tool identifier (unused but kept for interface consistency)
 * @param {string} projectType - The project type (unused but kept for interface consistency)
 * @param {boolean} verbose - Whether to show detailed output
 * @param {Object} dependencies - Injected dependencies (unused but kept for interface consistency)
 * @returns {Promise<Object>} Installation result with output and package info
 */
async function execute(
  task,
  tool,
  projectType,
  verbose = false,
  _dependencies = {}
) {
  const { package: pkg } = task;

  if (verbose) {
    console.log(chalk.gray(`Installing package: ${pkg.name}`));
    console.log(chalk.gray(`Install command: ${pkg['install-command']}`));
  }

  try {
    // Execute install command
    const installOutput = execSync(pkg['install-command'], {
      encoding: 'utf8',
      stdio: verbose ? 'inherit' : 'pipe'
    });

    // Get package version
    const packageInfo = await getPackageVersion(pkg, verbose);

    return {
      output: installOutput || 'Package installed successfully',
      packageInfo
    };
  } catch (error) {
    throw new Error(`Package installation failed: ${error.message}`);
  }
}

export { execute };
