import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

/**
 * Validate current directory for common project indicators
 */
async function validateDirectory(verbose = false) {
  const currentDir = process.cwd();
  const indicators = [
    'package.json',
    'composer.json',
    '.git',
    'README.md',
    'README.txt'
  ];

  const found = [];
  const missing = [];

  for (const indicator of indicators) {
    const indicatorPath = path.join(currentDir, indicator);
    if (await fs.pathExists(indicatorPath)) {
      found.push(indicator);
    } else {
      missing.push(indicator);
    }
  }

  if (verbose) {
    console.log(chalk.blue('📁 Directory validation:'));
    console.log(chalk.green(`  Found: ${found.join(', ')}`));
    console.log(chalk.gray(`  Missing: ${missing.join(', ')}`));
  }

  return {
    isValid: found.length > 0,
    found,
    missing
  };
}

/**
 * Check if directory appears to be a valid project
 */
async function isProjectDirectory(verbose = false) {
  const validation = await validateDirectory(verbose);

  if (!validation.isValid) {
    console.log(chalk.yellow('\n⚠️  Warning: This directory doesn\'t appear to be a project directory.'));
    console.log(chalk.yellow('   Expected to find at least one of: package.json, composer.json, .git, README.md'));
    console.log(chalk.yellow('   You can continue, but some features may not work as expected.'));
  }

  return validation.isValid;
}

/**
 * Validate file exists and is readable
 */
async function validateFile(filePath, description = 'file') {
  if (!await fs.pathExists(filePath)) {
    throw new Error(`${description} not found: ${filePath}`);
  }

  try {
    await fs.access(filePath, fs.constants.R_OK);
  } catch (error) {
    throw new Error(`${description} not readable: ${filePath}`);
  }

  return true;
}

/**
 * Validate directory exists and is writable
 */
async function validateDirectoryWritable(dirPath, description = 'directory') {
  if (!await fs.pathExists(dirPath)) {
    try {
      await fs.ensureDir(dirPath);
    } catch (error) {
      throw new Error(`Cannot create ${description}: ${dirPath}`);
    }
  }

  try {
    await fs.access(dirPath, fs.constants.W_OK);
  } catch (error) {
    throw new Error(`${description} not writable: ${dirPath}`);
  }

  return true;
}

/**
 * Check if a file contains specific content
 */
async function validateFileContent(filePath, requiredContent, description = 'file') {
  await validateFile(filePath, description);

  const content = await fs.readFile(filePath, 'utf8');
  if (!content.includes(requiredContent)) {
    throw new Error(`Required content not found in ${description}: ${requiredContent}`);
  }

  return true;
}

export {
  validateDirectory,
  isProjectDirectory,
  validateFile,
  validateDirectoryWritable,
  validateFileContent
};
