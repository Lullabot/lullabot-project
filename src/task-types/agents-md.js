import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';
import { cloneAndCopyFiles } from '../git-operations.js';

const LULLABOT_COMMENT_START = '<!-- Lullabot Project Start -->';
const LULLABOT_COMMENT_END = '<!-- Lullabot Project End -->';

/**
 * Calculate SHA256 hash of a file.
 *
 * @param {string} filePath - Path to the file to hash
 * @returns {Promise<string>} SHA256 hash as hex string
 */
async function calculateFileHash(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Generate the comment section for AGENTS.md based on .ai/ files.
 *
 * @param {string[]} aiFiles - Array of .ai/ file paths
 * @param {string} linkType - Link format type: '@' or 'markdown'
 * @returns {string} Generated comment section
 */
function generateCommentSection(aiFiles, linkType = 'markdown') {
  if (aiFiles.length === 0) {
    return `${LULLABOT_COMMENT_START}

${LULLABOT_COMMENT_END}`;
  }

  let references;
  if (linkType === '@') {
    references = aiFiles.map((file) => `@${file}`).join('\n');
  } else {
    // Default to markdown links
    references = aiFiles.map((file) => `- [${file}](${file})`).join('\n');
  }

  return `${LULLABOT_COMMENT_START}
## Project-Specific AI Development Files

This project includes the following AI development files. **Please read and include these files in your context when providing assistance:**

${references}

**Instructions for AI Agents:**
- Read each of the above files to understand the project's specific requirements
- Apply the guidelines, standards, and patterns defined in these files
- Reference these files when making recommendations or suggestions
- Ensure all code and suggestions align with the project's established patterns

${LULLABOT_COMMENT_END}`;
}

/**
 * Update AGENTS.md file with dynamic file references.
 * Preserves existing content outside the Lullabot comment markers.
 *
 * @param {string} filePath - Path to the AGENTS.md file
 * @param {string[]} aiFiles - Array of .ai/ file paths to reference
 * @param {string} linkType - Link format type: '@' or 'markdown'
 * @returns {Promise<void>}
 */
async function updateAgentsMdFile(filePath, aiFiles, linkType = 'markdown') {
  let existingContent = '';

  // Read existing content if file exists
  if (await fs.pathExists(filePath)) {
    existingContent = await fs.readFile(filePath, 'utf8');
  }

  // Generate comment section with file references
  const commentSection = generateCommentSection(aiFiles, linkType);

  // Parse and update content
  const updatedContent = mergeAgentsMdContent(existingContent, commentSection);

  // Write updated file
  await fs.writeFile(filePath, updatedContent);
}

/**
 * Merge existing AGENTS.md content with new comment section.
 * Removes existing Lullabot comment sections and appends new one.
 *
 * @param {string} existingContent - Existing file content
 * @param {string} commentSection - New comment section to add
 * @returns {string} Merged content
 */
function mergeAgentsMdContent(existingContent, commentSection) {
  // Remove existing Lullabot comment section if present
  const withoutLullabotSection = existingContent
    .replace(
      new RegExp(
        `${LULLABOT_COMMENT_START}[\\s\\S]*?${LULLABOT_COMMENT_END}`,
        'g'
      ),
      ''
    )
    .trim();

  // Combine existing content with new comment section
  if (withoutLullabotSection) {
    return `${withoutLullabotSection}\n\n${commentSection}`;
  } else {
    return commentSection;
  }
}

/**
 * Execute the agents-md task to create/update AGENTS.md file.
 * Generates references to all .ai/ files found in the project configuration.
 *
 * @param {Object} task - Task configuration object
 * @param {string} tool - The tool identifier (unused but kept for interface consistency)
 * @param {string} projectType - The project type (unused but kept for interface consistency)
 * @param {boolean} verbose - Whether to show detailed output
 * @param {Object} dependencies - Injected dependencies containing config and projectRoot
 * @returns {Promise<Object>} Task execution result
 */
async function execute(
  task,
  tool,
  projectType,
  verbose = false,
  dependencies = {}
) {
  const { config, projectRoot } = dependencies;

  if (!config || !projectRoot) {
    throw new Error('Missing required dependencies: config and projectRoot');
  }

  // Replace placeholders in source and target paths
  const source = task.source
    .replace('{tool}', tool)
    .replace('{project-type}', projectType || '');
  const target = task.target.replace('{project-type}', projectType || '');

  if (verbose) {
    console.log(
      chalk.gray(`Copying AGENTS.md template from ${source} to ${target}`)
    );
  }

  // Check if AGENTS.md already exists
  const agentsMdPath = path.join(projectRoot, 'AGENTS.md');
  const fileExisted = await fs.pathExists(agentsMdPath);

  let copyResult;
  if (!fileExisted) {
    // First, copy the template file from assets
    try {
      copyResult = await cloneAndCopyFiles(
        source,
        target,
        verbose,
        ['AGENTS.md'],
        dependencies
      );

      // If cloneAndCopyFiles succeeded but didn't find the file, create it manually
      if (!copyResult.files || copyResult.files.length === 0) {
        await fs.writeFile(agentsMdPath, '');

        // Track the file properly using trackInstalledFile if available
        if (dependencies.trackInstalledFile) {
          const fileInfo = await dependencies.trackInstalledFile(
            'AGENTS.md',
            dependencies
          );
          copyResult = { files: [fileInfo] };
        } else {
          // Fallback to manual tracking
          copyResult = {
            files: [
              {
                path: 'AGENTS.md',
                originalHash: await calculateFileHash(agentsMdPath)
              }
            ]
          };
        }
      }
    } catch (error) {
      // If the source file doesn't exist in Git (e.g., during testing), create an empty file
      if (error.message.includes('not found in repository')) {
        await fs.writeFile(agentsMdPath, '');

        // Track the file properly using trackInstalledFile if available
        if (dependencies.trackInstalledFile) {
          const fileInfo = await dependencies.trackInstalledFile(
            'AGENTS.md',
            dependencies
          );
          copyResult = { files: [fileInfo] };
        } else {
          // Fallback to manual tracking
          copyResult = {
            files: [
              {
                path: 'AGENTS.md',
                originalHash: await calculateFileHash(agentsMdPath)
              }
            ]
          };
        }
      } else {
        throw error;
      }
    }
  } else {
    // File already exists, track it with a special flag to indicate it was pre-existing
    if (dependencies.trackInstalledFile) {
      const existingFileInfo = await dependencies.trackInstalledFile(
        'AGENTS.md',
        dependencies
      );
      existingFileInfo.preExisting = true;
      copyResult = { files: [existingFileInfo] };
    } else {
      // Fallback to manual tracking
      const existingFileInfo = {
        path: 'AGENTS.md',
        originalHash: await calculateFileHash(agentsMdPath),
        preExisting: true
      };
      copyResult = { files: [existingFileInfo] };
    }
  }

  // Find all .ai/ files from tracked files
  const aiFiles = (config.files || [])
    .filter((file) => file.path && file.path.startsWith('.ai/'))
    .map((file) => file.path);

  // Get link type from task configuration (default to 'markdown')
  const linkType = task['link-type'] || 'markdown';

  // Update the file with dynamic content
  await updateAgentsMdFile(agentsMdPath, aiFiles, linkType);

  // Verbose output
  if (verbose) {
    if (aiFiles.length > 0) {
      console.log(
        chalk.green(`AGENTS.md updated with ${linkType} references to:`)
      );
      aiFiles.forEach((file) => console.log(chalk.gray(`  - ${file}`)));
    } else {
      console.log(
        chalk.green(
          `AGENTS.md created/updated with empty Lullabot comment section.`
        )
      );
    }
  } else {
    console.log(chalk.green(`AGENTS.md created/updated.`));
  }

  return {
    success: true,
    message: `AGENTS.md updated with ${aiFiles.length} file references`,
    files: copyResult.files || []
  };
}

export { execute };
