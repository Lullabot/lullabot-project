/**
 * Test utility for reading package information dynamically
 * This prevents hardcoding version numbers in tests
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to package.json relative to this utility file
const packageJsonPath = path.join(__dirname, '../../package.json');

let packageInfo = null;

/**
 * Get package information from package.json
 * @returns {Promise<Object>} Package information including version, name, etc.
 */
export async function getPackageInfo() {
  if (!packageInfo) {
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
    packageInfo = JSON.parse(packageJsonContent);
  }
  return packageInfo;
}

/**
 * Get the current package version
 * @returns {Promise<string>} Current package version
 */
export async function getCurrentVersion() {
  const info = await getPackageInfo();
  return info.version;
}

/**
 * Get the package name
 * @returns {Promise<string>} Package name
 */
export async function getPackageName() {
  const info = await getPackageInfo();
  return info.name;
}

/**
 * Get the package description
 * @returns {Promise<string>} Package description
 */
export async function getPackageDescription() {
  const info = await getPackageInfo();
  return info.description;
}
