/**
 * Version consistency tests
 * Ensures that version numbers are consistent across the codebase
 */

import { getCurrentVersion, getPackageName } from '../utils/package-info.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Version Consistency', () => {
  let packageVersion;
  let packageName;

  beforeAll(async () => {
    packageVersion = await getCurrentVersion();
    packageName = await getPackageName();
  });

  it('should have a valid semver version', () => {
    // Check if version follows semantic versioning (major.minor.patch)
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
    expect(packageVersion).toMatch(semverRegex);
  });

  it('should have version greater than 0.0.0', () => {
    const [major, minor, patch] = packageVersion.split('.').map(Number);
    expect(major).toBeGreaterThanOrEqual(0);
    expect(minor).toBeGreaterThanOrEqual(0);
    expect(patch).toBeGreaterThanOrEqual(0);

    // At least one part should be greater than 0
    expect(major + minor + patch).toBeGreaterThan(0);
  });

  it('should have consistent version in package.json and source code', async () => {
    // Read package.json directly
    const packageJsonPath = path.join(__dirname, '../../package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

    expect(packageJson.version).toBe(packageVersion);
  });

  it('should have a valid package name', () => {
    expect(packageName).toBeTruthy();
    expect(typeof packageName).toBe('string');
    expect(packageName.length).toBeGreaterThan(0);
  });

  it('should report hardcoded version numbers in test files for review', async () => {
    // This test helps identify hardcoded versions that should be made dynamic
    const testDir = path.join(__dirname, '..');
    const testFiles = await fs.readdir(testDir, { recursive: true });

    const versionPattern = /\b2\.\d+\.\d+\b/g;
    const hardcodedVersions = [];

    for (const file of testFiles) {
      if (file.endsWith('.js') && !file.includes('version-consistency.test.js')) {
        const filePath = path.join(testDir, file);
        const content = await fs.readFile(filePath, 'utf8');

        // Check for hardcoded version patterns
        const matches = content.match(versionPattern);
        if (matches) {
          // Filter out obvious test data (like git tags in tests)
          const isTestData = content.includes('git tag') ||
                           content.includes('test data') ||
                           content.includes('mock') ||
                           content.includes('fixture') ||
                           content.includes('invalid-tag') ||
                           content.includes('non-existent');

          if (!isTestData) {
            hardcodedVersions.push({ file, matches });
          }
        }
      }
    }

    // Log findings for review
    if (hardcodedVersions.length > 0) {
      console.log('📋 Found hardcoded versions in test files (review for dynamic conversion):');
      hardcodedVersions.forEach(({ file, matches }) => {
        console.log(`  - ${file}: ${matches.join(', ')}`);
      });
    } else {
      console.log('✅ No hardcoded versions found in test files');
    }

    // This test always passes - it's informational
    expect(hardcodedVersions.length).toBeGreaterThanOrEqual(0);
  });
});
