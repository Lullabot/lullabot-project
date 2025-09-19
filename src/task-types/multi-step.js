import chalk from 'chalk';
import { resolveTaskConfig } from '../tool-config.js';
import { substituteVariables } from '../utils/variable-substitution.js';
import { validateTaskConfig } from '../validation.js';
import { taskTypes } from './index.js';

/**
 * Resolves a step configuration, handling shared task references, extends, and inline definitions
 * @param {Object} step - The step configuration object
 * @param {Object} sharedTasks - Available shared tasks
 * @param {string} tool - The selected tool
 * @param {string} projectType - The selected project type
 * @returns {Object} Resolved step configuration
 */
function resolveStep(step, sharedTasks, tool, projectType) {
  for (const [stepName, stepConfig] of Object.entries(step)) {
    let resolvedConfig;

    if (typeof stepConfig === 'string') {
      // Direct shared task reference: "rules": "@shared_tasks.rules"
      // Reuse existing shared task resolution from tool-config.js
      resolvedConfig = resolveTaskConfig(
        stepConfig,
        sharedTasks,
        tool,
        projectType
      );
    } else if (stepConfig.extends) {
      // Extended shared task: "agents-md": { extends: "@shared_tasks.agents-md", ... }
      // Reuse existing extends resolution from tool-config.js
      resolvedConfig = resolveTaskConfig(
        stepConfig,
        sharedTasks,
        tool,
        projectType
      );
    } else {
      // Inline task definition: "gitleaks": { type: "package-install", ... }
      // Apply variable substitution to inline config
      resolvedConfig = substituteVariables(stepConfig, tool, projectType);
    }

    return {
      name: stepName, // For logging only, doesn't override task name
      ...resolvedConfig
    };
  }
}

/**
 * Validates a step configuration
 * @param {Object} stepConfig - The step configuration to validate
 * @throws {Error} If the step configuration is invalid
 */
function validateStepConfig(stepConfig) {
  // Basic structure validation
  if (!stepConfig.type) {
    throw new Error('Step must have a type');
  }

  // Validate task type exists (upfront validation)
  if (!taskTypes[stepConfig.type]) {
    throw new Error(`Unknown task type: ${stepConfig.type}`);
  }

  // Use existing validation system for step config
  validateTaskConfig(stepConfig);
}

/**
 * Executes a task type with the given configuration
 * @param {Object} stepConfig - The step configuration
 * @param {string} tool - The selected tool
 * @param {string} projectType - The selected project type
 * @param {boolean} verbose - Whether to run in verbose mode
 * @param {Object} dependencies - Dependencies object
 * @returns {Promise<Object>} The execution result
 */
async function executeTaskType(
  stepConfig,
  tool,
  projectType,
  verbose,
  dependencies
) {
  const taskType = taskTypes[stepConfig.type];
  if (!taskType) {
    throw new Error(`Unknown task type: ${stepConfig.type}`);
  }

  // Call the task type's execute function directly
  return await taskType.execute(
    stepConfig,
    tool,
    projectType,
    verbose,
    dependencies
  );
}

/**
 * Executes a multi-step task
 * @param {Object} task - The multi-step task configuration
 * @param {string} tool - The selected tool
 * @param {string} projectType - The selected project type
 * @param {boolean} verbose - Whether to run in verbose mode
 * @param {Object} dependencies - Dependencies object
 * @returns {Promise<Object>} The execution result
 */
async function execute(
  task,
  tool,
  projectType,
  verbose = false,
  dependencies = {}
) {
  const { steps, 'fail-fast': failFast = true } = task;
  const results = [];
  const errors = [];
  const allFiles = [];

  // Handle empty steps array (no-op)
  if (!steps || steps.length === 0) {
    return { output: 'No steps to execute', files: [], stepResults: [] };
  }

  if (verbose) {
    console.log(chalk.gray(`🔧 Executing multi-step task: ${task.name}`));
  }

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepName = Object.keys(step)[0];

    if (verbose) {
      console.log(chalk.gray(`  Step ${i + 1}/${steps.length}: ${stepName}`));
    }

    try {
      // Resolve and validate step
      const stepConfig = resolveStep(
        step,
        dependencies.sharedTasks,
        tool,
        projectType
      );
      validateStepConfig(stepConfig); // Upfront validation

      // Create enhanced dependencies with accumulated files from previous steps
      const enhancedDependencies = {
        ...dependencies,
        config: {
          ...dependencies.config,
          files: [...(dependencies.config?.files || []), ...allFiles]
        }
      };

      // Execute step using existing task type system
      const stepResult = await executeTaskType(
        stepConfig,
        tool,
        projectType,
        verbose,
        enhancedDependencies
      );

      // Aggregate results
      results.push({ step: stepName, result: stepResult });
      if (stepResult.files) {
        allFiles.push(...stepResult.files);
      }

      if (verbose) {
        console.log(
          chalk.gray(
            `    ✅ ${stepResult.output || 'Step completed successfully'}`
          )
        );
      }
    } catch (error) {
      const errorInfo = { step: stepName, error: error.message };

      if (failFast) {
        throw new Error(
          `Failed at step ${i + 1} (${stepName}): ${error.message}`
        );
      } else {
        errors.push(errorInfo);
        if (verbose) {
          console.log(chalk.gray(`    ❌ ${error.message}`));
        }
      }
    }
  }

  // Handle collected errors
  if (errors.length > 0) {
    const errorSummary = errors
      .map((e) => `Step ${e.step}: ${e.error}`)
      .join('; ');
    throw new Error(`Multi-step task completed with errors: ${errorSummary}`);
  }

  // Return results based on verbose mode
  if (verbose) {
    return {
      output: results.map((r) => r.result.output).join('\n'),
      files: allFiles,
      stepResults: results // Detailed results for debugging
    };
  } else {
    return {
      output: 'Multi-step task completed successfully',
      files: allFiles,
      stepResults: results
    };
  }
}

export { execute };
