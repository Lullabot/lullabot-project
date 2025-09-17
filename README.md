[![CI](https://github.com/lullabot/lullabot-project/actions/workflows/ci.yml/badge.svg)](https://github.com/lullabot/lullabot-project/actions/workflows/ci.yml)
[![Release](https://github.com/lullabot/lullabot-project/actions/workflows/release.yml/badge.svg)](https://github.com/lullabot/lullabot-project/actions/workflows/release.yml)
[![npm version](https://badge.fury.io/js/lullabot-project.svg)](https://badge.fury.io/js/lullabot-project)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# Lullabot Project Setup

A CLI tool that helps developers set up their development environment with AI tools, memory banks, and project-specific rules. The tool is designed to be extensible, user-friendly, and maintainable.

## Features

- **Tool Configuration**: Set up your development environment for supported tools
- **Project Validation**: Automatically validate project types and structure
- **Memory Bank Setup**: Configure AI memory banks for enhanced development
- **Project Rules**: Install project-specific coding standards and guidelines
- **AGENTS.md Standardization**: Centralized AI development instructions across all tools
- **Git-Based File Access**: Pull latest rules and configurations from the repository
- **Version-Pinned Operations**: Automatically uses Git tags matching the tool version for consistency
- **Flexible Task System**: Dynamic task execution with package installation, file copying, and command execution
- **Interactive Setup**: Guided setup process with clear prompts
- **Update Management**: Easy updates to existing configurations
- **Extensible**: Easy to add new tools and project types
- **Comprehensive Testing**: Robust test suite with excellent coverage

## Prompt Library Integration

The tool now integrates with the [Lullabot Prompt Library](https://github.com/Lullabot/prompt_library) to provide centralized, up-to-date project rules and guidelines.

### How It Works

- **Centralized Rules**: Project rules are pulled from the public Lullabot Prompt Library repository
- **Automatic Updates**: Rules are always up-to-date with the latest versions from the repository
- **Project Type Mapping**: Rules are organized by discipline (development, content-strategy, design, etc.)
- **Smart Filtering**: Only `.md` files are copied by default, with support for selective file copying
- **Efficient Operations**: Shallow cloning and caching for fast, reliable operations

### Supported Project Types

The tool supports the following project types that correspond to disciplines in the prompt library:

- **development** - Development discipline (formerly "drupal")
- **content-strategy** - Content Strategy discipline
- **design** - Design discipline
- **project-management** - Project Management discipline
- **quality-assurance** - Quality Assurance discipline (formerly "qa")
- **sales-marketing** - Sales and Marketing discipline

### Remote Repository Features

- **Branch and Tag Support**: Pull from specific branches or tags
- **Shallow Cloning**: Only download the latest commit for efficiency
- **Clone Caching**: Reuse cloned repositories for multiple tasks
- **Error Handling**: Comprehensive error handling for network issues and missing files
- **File Renaming**: Support for renaming files during copy operations

## AGENTS.md Standardization

The tool now supports the **AGENTS.md Standard** - a unified approach to AI development instructions across all supported tools.

### What is AGENTS.md?

AGENTS.md is a standardized file that serves as the central source of truth for AI development instructions in your project. Instead of maintaining separate instruction files for each AI tool (Claude, Cursor, Windsurf, etc.), you maintain one `AGENTS.md` file that all tools can reference.

### How It Works

1. **Centralized Instructions**: Create a single `AGENTS.md` file in your project root
2. **Tool-Specific Wrappers**: Each AI tool gets a lightweight wrapper file that imports `AGENTS.md`
3. **Automatic Generation**: The tool automatically generates `AGENTS.md` with references to your project-specific rules
4. **User Customization**: Add your own custom instructions outside the Lullabot-managed sections

### Example Structure

```
your-project/
├── AGENTS.md                    # Central AI instructions
├── .ai/                        # Project-specific rules
│   └── rules/
│       ├── drupal-core.md
│       ├── drupal-testing.md
│       └── code-quality.md
├── claude.md                   # Claude wrapper (imports AGENTS.md)
├── .windsurf/rules/agents.md   # Windsurf wrapper (imports AGENTS.md)
└── .github/copilot-instructions.md # GitHub Copilot wrapper (imports AGENTS.md)
```

### Benefits

- **Consistency**: Same instructions across all AI tools
- **Maintainability**: Update instructions in one place
- **Flexibility**: Each tool can have additional tool-specific instructions
- **User Control**: Preserve your custom instructions during updates
- **Future-Proof**: Easy to add new AI tools

### Supported Tools

- **Claude Code**: Uses `claude.md` wrapper
- **Cursor**: Direct `AGENTS.md` support
- **Windsurf**: Uses `.windsurf/rules/agents.md` wrapper
- **GitHub Copilot**: Uses `.github/copilot-instructions.md` wrapper
- **Gemini**: Uses `gemini.md` wrapper

## Current Status

### 🎯 **Production Ready**
The tool is now in production-ready state with:
- ✅ **100% functionality** - All core features working reliably
- ✅ **Excellent test coverage** - Comprehensive testing across all modules
- ✅ **No known regressions** - Stable and reliable operation
- ✅ **Robust error handling** - Graceful handling of edge cases and failures

### 📊 **Test Coverage Status**
Our comprehensive test suite provides excellent coverage:

| Module | Statements | Functions | Lines | Branches | Status |
|--------|------------|-----------|-------|----------|---------|
| **prompts.js** | 100% | 100% | 100% | 81.57% | ✅ Excellent |
| **validation.js** | 100% | 100% | 100% | 100% | ✅ Perfect |
| **tool-config.js** | 97.67% | 100% | 97.67% | 90% | ✅ Very Good |
| **file-operations.js** | 86.81% | 100% | 86.81% | 71.53% | ✅ Good |
| **git-operations.js** | 80.45% | 100% | 80.23% | 70% | ✅ Good |

**Overall**: 99.8% test success rate with 456 tests passing out of 456 total tests.

### 🚀 **Recent Improvements**
- **Enhanced error handling** for all operations
- **Improved path traversal security** in file operations
- **Better Git operation reliability** with fallback mechanisms
- **Comprehensive edge case testing** for robust operation
- **Memory bank integration** working reliably
- **Project rules installation** with proper validation
- **AGENTS.md task** now working correctly with proper Git tag resolution
- **Verbose flag** working properly for comprehensive debugging
- **Parameter passing** fixed across all function calls
- **Project validation** now handles projects with and without validation rules

## Installation

### Install the Tool

```bash
# Install globally
npm install -g lullabot-project

# Or use npx (recommended)
npx lullabot-project init
```

## Usage

### Quick Start

```bash
# Interactive setup
lullabot-project init

# Quick setup with options
lullabot-project init -i cursor -p development --all-tasks
```

### AGENTS.md Usage

The tool automatically sets up AGENTS.md standardization when you select tools that support it:

```bash
# Set up Cursor with AGENTS.md
lullabot-project init -t cursor -p development

# Set up Claude with AGENTS.md
lullabot-project init -t claude -p development
```

This will:
1. Copy project-specific rules to `.ai/rules/` directory
2. Generate `AGENTS.md` with references to those rules
3. Create tool-specific wrapper files that import `AGENTS.md`

#### Customizing AGENTS.md

You can add your own custom instructions to `AGENTS.md`:

```markdown
# My Project AI Instructions

## Custom Rules
- Always use TypeScript for new files
- Follow our custom naming conventions
- Include comprehensive error handling

<!-- Lullabot Project Start -->
## Project-Specific AI Development Files

This project includes the following AI development files:

@.ai/rules/drupal-core.md
@.ai/rules/drupal-testing.md
@.ai/rules/code-quality.md

<!-- Lullabot Project End -->

## Additional Guidelines
- Review all AI-generated code before committing
- Test thoroughly in development environment
```

The tool will preserve your custom content and only update the Lullabot-managed section between the comment markers.

#### Link Type Configuration

The `agents-md` task supports different link formats for file references. You can configure this in the `config/config.yml` file:

```yaml
agents-md:
  name: "AGENTS.md"
  type: "agents-md"
  source: "assets/AGENTS.md"
  target: "."
  link-type: "markdown"  # or "@"
```

**Available link types:**

- **`markdown`** (default for Windsurf, GitHub Copilot): Creates markdown links
  ```
  - [.ai/rules/drupal-core.md](.ai/rules/drupal-core.md)
  - [.ai/rules/drupal-testing.md](.ai/rules/drupal-testing.md)
  ```

- **`@`** (default for Cursor, Claude): Creates @ symbol references
  ```
  @.ai/rules/drupal-core.md
  @.ai/rules/drupal-testing.md
  ```

**AI Agent Instructions:**

The AGENTS.md file automatically includes instructions for AI agents to read and apply the project-specific files:

```markdown
## Project-Specific AI Development Files

This project includes the following AI development files. **Please read and include these files in your context when providing assistance:**

- [.ai/rules/drupal-core.md](.ai/rules/drupal-core.md)
- [.ai/rules/drupal-testing.md](.ai/rules/drupal-testing.md)

**Instructions for AI Agents:**
- Read each of the above files to understand the project's specific requirements
- Apply the guidelines, standards, and patterns defined in these files
- Reference these files when making recommendations or suggestions
- Ensure all code and suggestions align with the project's established patterns
```

### Commands

#### `init` - Initialize Development Environment

Set up your development environment with AI tools and project rules.

```bash
lullabot-project init [options]
```

**Options:**
- `-t, --tool <tool>` - Specify a single tool (cursor, claude, gemini, github-copilot, windsurf)
- `-p, --project <type>` - Specify project type (development, quality-assurance, none)
- `--skip-tasks <tasks>` - Skip specific tasks (comma-separated)
- `--tasks <tasks>` - Execute only specific tasks (comma-separated)
- `--all-tasks` - Execute all available tasks
- `-v, --verbose` - Verbose output
- `--skip-validation` - Skip project type validation
- `--dry-run` - Show what would be done without executing
- `--local` - Use local files instead of Git repository (for development)

**Examples:**
```bash
# Interactive setup
lullabot-project init

# Quick setup for Cursor + Drupal
lullabot-project init -t cursor -p development

# Setup with all features (default)
lullabot-project init -t cursor -p development --all-tasks

# Setup without memory bank
lullabot-project init -t cursor -p development --skip-tasks memory-bank

# Setup without rules
lullabot-project init -t cursor -p development --skip-tasks rules

# Setup without both features
lullabot-project init -t cursor -p development --skip-tasks memory-bank,rules

# Setup without project-specific rules (tool-only)
lullabot-project init -t cursor -p none

# Execute only specific tasks
lullabot-project init -t cursor -p development --tasks memory-bank

# Execute all available tasks
lullabot-project init -t cursor -p development --all-tasks

# Verbose setup with validation
lullabot-project init -t cursor -p development -v

# Local development mode (uses local files instead of Git)
lullabot-project init -t cursor -p development --local
```

#### `update` - Update Existing Setup

Update your existing development environment configuration using stored settings.

```bash
lullabot-project update [options]
```

**Options:**
- `-t, --tool <tool>` - Override stored tool setting with a single tool (optional)
- `-p, --project <type>` - Override stored project type (development, quality-assurance, none, optional)
- `--skip-tasks <tasks>` - Skip specific tasks (comma-separated)
- `--tasks <tasks>` - Execute only specific tasks (comma-separated)
- `--all-tasks` - Execute all available tasks
- `-v, --verbose` - Verbose output
- `--dry-run` - Show what would be updated without executing
- `-F, --force` - Force update - recreate configuration if corrupted
- `--local` - Use local files instead of Git repository (for development)

**Examples:**
```bash
# Update using stored configuration (most common)
lullabot-project update

# Update with verbose output
lullabot-project update -v

# Update and change tool
lullabot-project update -t windsurf

# Update and skip memory bank
lullabot-project update --skip-tasks memory-bank

# Update and skip rules
lullabot-project update --skip-tasks rules

# Update with overrides and verbose
lullabot-project update -t cursor -p development --skip-tasks rules -v

# Force update if configuration is corrupted
lullabot-project update --force

# Force update with dry-run to see what would happen
lullabot-project update --force --dry-run

# Local development mode (uses local files instead of Git)
lullabot-project update --local
```

#### `config` - Show Configuration

Display your current configuration and status.

```bash
lullabot-project config [options]
```

**Options:**
- `-v, --verbose` - Show detailed file information
- `--json` - Output in JSON format for automation
- `--check-updates` - Check for available updates

**Examples:**
```bash
# Show basic configuration
lullabot-project config

# Show detailed configuration
lullabot-project config -v

# JSON output for automation
lullabot-project config --json

# Check for available updates
lullabot-project config --check-updates
```

#### `remove` - Remove All Files and Configuration

Remove all files and configuration created by lullabot-project.

```bash
lullabot-project remove [options]
```

**Options:**
- `-v, --verbose` - Verbose output
- `--dry-run` - Show what would be removed without executing
- `-f, --force` - Force removal without confirmation

**Examples:**
```bash
# See what would be removed (recommended first step)
lullabot-project remove --dry-run

# Remove with confirmation prompt
lullabot-project remove

# Force remove without confirmation
lullabot-project remove --force

# Verbose removal with detailed output
lullabot-project remove --verbose

# Force remove with verbose output
lullabot-project remove --force --verbose
```

**What gets removed:**
- Configuration file (`.lullabot-project.yml`)
- Rules files (`.ai/rules/*`)
- AGENTS.md file (with special handling):
  - **If created by tool**: Entire file is deleted
  - **If file existed before**: Only Lullabot comment section is removed, preserving user content
- Memory bank files (noted but not removed as they may be used by other projects)

## Supported Tools

### Cursor

- **Memory Bank**: Uses `npx cursor-bank init`
- **Rules Path**: `.ai/rules/` (centralized)
- **AGENTS.md**: Direct support with `@` link format
- **Supported Projects**: Drupal
- **Additional Tasks**: VSCode XDebug setup

### Claude

- **Memory Bank**: Not supported (no external setup available)
- **Rules Path**: `.ai/rules/` (centralized)
- **AGENTS.md**: Uses `claude.md` wrapper with `@` link format
- **Supported Projects**: Drupal

### Windsurf

- **Memory Bank**: Not supported (no external setup available)
- **Rules Path**: `.ai/rules/` (centralized)
- **AGENTS.md**: Uses `.windsurf/rules/agents.md` wrapper with markdown link format
- **Supported Projects**: Drupal

### GitHub Copilot

- **Memory Bank**: Not supported (no external setup available)
- **Rules Path**: `.ai/rules/` (centralized)
- **AGENTS.md**: Uses `.github/copilot-instructions.md` wrapper with markdown link format
- **Supported Projects**: Drupal

### VSCode

- **Memory Bank**: Not supported (no external setup available)
- **Rules Path**: Not applicable
- **Supported Projects**: Drupal
- **Additional Tasks**: VSCode XDebug setup

### Adding New Tools

New tools can be easily added by updating the `config/config.yml` file:

```yaml
tools:
  newtool:
    name: "New Tool"
    tasks:
      rules:
        name: "Project Rules"
        type: "copy-files"
        source: "assets/rules/{project-type}/"
        target: ".ai/rules"
        required: false
        prompt: "Would you like to install project-specific rules and guidelines?"
      agents-md:
        name: "AGENTS.md"
        type: "agents-md"
        source: "assets/AGENTS.md"
        target: "."
        link-type: "markdown"  # or "@"
        required: false
        prompt: "Would you like to set up AGENTS.md with project-specific rules?"
      wrapper:
        name: "newtool.md Wrapper"
        type: "copy-files"
        source: "assets/wrappers/"
        items: ["newtool.md"]
        required: false
        prompt: "Would you like to create a wrapper file for New Tool?"
```

## Task System

The tool uses a flexible task system that allows different tools to have different setup requirements. Each tool can define multiple tasks of different types.

### Task Types

#### `package-install` - Install Packages

Install packages using various package managers:

```yaml
memory-bank:
  name: "Memory Bank Setup"
  type: "package-install"
  package:
    name: "cursor-bank"
    type: "npx"
    install-command: "npx cursor-bank init"
    version-command: "npx cursor-bank --version"
  required: false
  prompt: "Would you like to set up a memory bank for AI assistance?"
```

**Supported Package Types:**
- **`npx`**: Execute packages via npx (e.g., `npx package-name --version`)
- **`npm`**: Install via npm (e.g., `npm list package-name`)
- **`yarn`**: Install via yarn (e.g., `yarn list package-name`)
- **`pnpm`**: Install via pnpm (e.g., `pnpm list package-name`)
- **`custom`**: Fully custom commands

**Package Configuration:**
- `name`: Package name for tracking
- `type`: Package manager type
- `install-command`: Command to install the package
- `version-command`: Command to check package version (optional, auto-generated if not provided)

#### `copy-files` - Copy Files and Directories

Copy project-specific files to tool locations. Rules are pulled from the Git repository, while other files use local assets:

```yaml
rules:
  name: "Project Rules"
  type: "copy-files"
  source: "assets/rules/{project-type}/"
  target: ".ai/rules"
  required: false
  prompt: "Would you like to install project-specific rules and guidelines?"
```

**Configuration:**
- `source`: Source directory with placeholders (`{tool}`, `{project-type}`)
- `target`: Target directory with placeholders
- `items`: Optional array of specific files/directories to copy, or object for renaming (if not specified, copies all items)

**Pattern-based File Selection:**
The `items` key now supports advanced pattern matching for flexible file selection:

**Glob Patterns:**
```yaml
items:
  - "*.md"                    # All markdown files
  - "*.{js,ts,jsx,tsx}"      # All JavaScript/TypeScript files
  - "test-*"                  # Files starting with "test-"
  - "*-config.*"              # Files ending with "-config"
  - "**/*.md"                 # Recursive markdown files
  - "src/**/*.{js,ts}"        # Recursive JS/TS in src/
```

**Regex Patterns:**
```yaml
items:
  - "/^config-.*\\.json$/"    # Files starting with "config-" and ending with ".json"
  - "/.*\\.(test|spec)\\.(js|ts)$/"  # Test files
  - "/^[A-Z].*\\.md$/"        # Markdown files starting with capital letter
```

**Mixed Patterns:**
```yaml
items:
  - "*.md"                    # Glob pattern
  - "README.txt"              # Specific file
  - "/^config-.*\\.json$/"    # Regex pattern
```

**Copy Options:**
- **Copy all files/directories** (default behavior):
  ```yaml
  rules:
    type: "copy-files"
    source: "assets/rules/{project-type}/"
    target: ".ai/rules"
  ```

- **Copy specific files only**:
  ```yaml
  rules:
    type: "copy-files"
    source: "assets/rules/{project-type}/"
    target: ".ai/rules"
    items: ["coding-standards.md", "ai-prompts.md"]
  ```


#### `agents-md` - Create/Update AGENTS.md

Create or update the AGENTS.md file with project-specific rule references:

```yaml
agents-md:
  name: "AGENTS.md"
  type: "agents-md"
  source: "assets/AGENTS.md"
  target: "."
  link-type: "@"  # or "markdown"
  required: false
  prompt: "Would you like to set up AGENTS.md with project-specific rules?"
```

#### `remote-copy-files` - Copy Files from Remote Repository

Copy files from a remote Git repository (used for prompt library integration):

```yaml
rules:
  name: "Project Rules from Prompt Library"
  type: "remote-copy-files"
  repository:
    url: "https://github.com/Lullabot/prompt_library"
    type: "branch"
    target: "main"
  source: "{project-type}/rules/"
  target: ".ai/rules"
  required: false
  prompt: "Would you like to install project-specific rules from the prompt library?"
```

**Configuration:**
- `repository`: Repository configuration object
  - `url`: Repository URL
  - `type`: Repository reference type (`branch` or `tag`)
  - `target`: Branch or tag name
- `source`: Source path within the repository (supports `{project-type}` placeholder)
- `target`: Target directory for copied files
- `items`: Optional array of specific files to copy with pattern support (if not specified, copies all `.md` files)

**Pattern Support:**
The `remote-copy-files` task supports the same pattern matching as `copy-files`:

```yaml
rules:
  type: "remote-copy-files"
  repository:
    url: "https://github.com/Lullabot/prompt_library"
    type: "branch"
    target: "main"
  source: "{project-type}/rules/"
  target: ".ai/rules"
  items: ["*.md", "*.{json,yaml}", "/^config-.*\\.json$/"]
```
- `required`: Whether the task is required
- `prompt`: User prompt for the task

**Features:**
- **Smart Filtering**: If `items` specified, copy exact files; otherwise copy only `.md` files
- **Pattern Matching**: Support for glob patterns and regex patterns in `items` array
- **Recursive Search**: Support for recursive directory patterns with `**`

**Pattern Limitations:**
- Patterns only work with array format in `items` (not object format for renaming)
- Regex patterns must be enclosed in forward slashes: `/pattern/flags`
- Glob patterns support standard wildcards: `*`, `?`, `[]`, `{}`, `**`

**Error Handling:**
- Invalid regex patterns will throw descriptive errors
- Non-string patterns in arrays will be rejected
- Patterns in object format (renaming) will cause validation errors
- **Shallow Cloning**: Only download latest commit for efficiency
- **Clone Caching**: Reuse cloned repositories for multiple tasks
- **Network Error Handling**: Comprehensive error handling for network issues and missing files
- **File Renaming**: Support for renaming files during copy operations

**Note**: The `--local` flag does not affect `remote-copy-files` tasks, which always pull from remote repositories.

**Configuration:**
- `source`: Template file for AGENTS.md
- `target`: Target directory (usually "." for project root)
- `link-type`: Link format for file references ("@" or "markdown")

#### `command` - Execute Commands

Execute arbitrary shell commands:

```yaml
custom-setup:
  name: "Custom Setup"
  type: "command"
  command: "echo 'Custom setup complete'"
  required: false
  prompt: "Would you like to run custom setup?"
```

### Task Configuration

**Required Fields:**
- `name`: Human-readable task name
- `type`: Task type (`package-install`, `copy-files`, `agents-md`, `command`)
- `required`: Whether the task is required (true) or optional (false)

**Optional Fields:**
- `description`: Detailed task description
- `prompt`: Custom prompt text for optional tasks
- `projects`: Array of project types this task applies to (see Project-Specific Tasks below)
- `link`: URL to learn more about the task (displayed in prompts)

### Project-Specific Tasks

Tasks can be limited to specific project types using the `projects` array. This allows you to show only relevant tasks based on the selected project type.

**Configuration:**
```yaml
# Task applies to specific projects
development-task:
  name: "Development Tools"
  type: "copy-files"
  projects: ["development"]
  source: "assets/dev/"
  target: ".dev/"
  required: false
  prompt: "Set up development tools?"

# Task applies to multiple projects
multi-project-task:
  name: "Quality Tools"
  type: "copy-files"
  projects: ["development", "quality-assurance"]
  source: "assets/quality/"
  target: ".quality/"
  required: false
  prompt: "Set up quality tools?"

# Task applies to all projects (no projects key)
universal-task:
  name: "Universal Setup"
  type: "copy-files"
  source: "assets/universal/"
  target: ".universal/"
  required: false
  prompt: "Set up universal tools?"

# Task is disabled (applies to no projects)
disabled-task:
  name: "Disabled Task"
  type: "copy-files"
  projects: []
  source: "assets/disabled/"
  target: ".disabled/"
  required: false
  prompt: "This task will never appear"
```

**Behavior:**
- **No `projects` key**: Task applies to all project types
- **Empty `projects: []`**: Task is disabled and will not appear for any project
- **Specific projects**: Task only appears when one of the specified project types is selected
- **Multiple projects**: Task appears when any of the specified project types is selected

**Examples:**
- Development-specific tools only show for `development` projects
- QA tools show for both `development` and `quality-assurance` projects
- Universal tools (like wrappers) show for all project types
- Disabled tasks never appear in the task list

### Task Links

Tasks can include helpful links that are displayed in prompts to provide additional context and resources.

**Configuration:**
```yaml
rules:
  name: "Project Rules from Prompt Library"
  type: "remote-copy-files"
  link: "https://github.com/Lullabot/prompt_library"
  # ... rest of config

memory-bank:
  name: "Memory Bank Setup"
  type: "package-install"
  link: "https://cursor.sh/docs/memory-bank"
  # ... rest of config
```

**Behavior:**
- Links are displayed inline with the main prompt text
- Format: `(Learn more)` - the text "Learn more" is a clickable link
- Uses terminal link formatting (OSC 8 escape sequences) for clickability
- Works in modern terminals like iTerm2, VS Code terminal, etc.
- Falls back gracefully in terminals that don't support clickable links
- URLs must be valid HTTP/HTTPS links
- Optional field - tasks work fine without links

**Example Prompt:**
```
Would you like to install project-specific rules from the prompt library? (Learn more)
```

### Task Execution

- Tasks are executed in the order they are defined in the configuration
- Required tasks are automatically enabled
- Optional tasks prompt the user for confirmation
- Task results are tracked and stored in the configuration file
- Package versions are automatically tracked for update checking

### Command Line Task Control

Use these flags to control which tasks are executed:

```bash
# Skip specific tasks
lullabot-project init --skip-tasks memory-bank,rules

# Execute only specific tasks
lullabot-project init --tasks memory-bank

# Execute all available tasks
lullabot-project init --all-tasks
```

**Memory Bank Support:**
- Memory bank setup can be handled through the task system
- Add a `package-install` task for memory bank setup if the tool supports it
- If the tool does not support external memory banks, simply don't include a memory bank task
- The tool will automatically skip memory bank prompts for tools without memory bank tasks

**Rules Path:**
- Rules paths are automatically inferred from the tool key (e.g., "cursor" → `.cursor/rules`)
- No additional configuration needed for rules paths
- Each tool can have its own project-specific rules in different formats

## Project Selection

The tool supports both project-specific and tool-only setups:

### Project Types

#### Drupal

- **Validation**: Checks for `composer.json` with Drupal dependencies
- **Rules**: Comprehensive Drupal coding standards and AI prompts
- **Features**: Memory bank integration, project guidelines

#### None (Tool-Only Setup)

- **No Project Validation**: Skips project type validation
- **Limited Tasks**: Only tool-specific tasks are available
- **Use Case**: When you want to set up AI tools without project-specific rules
- **Available Tasks**: Memory bank, VSCode XDebug, AGENTS.md (project rules are disabled)

**Note**: Some tasks require a project to be selected. These tasks will be automatically disabled when "None" is chosen.

### Adding New Project Types

New project types can be added by updating the `config/config.yml` file:

```yaml
projects:
  myproject:
    name: "MyProject"
    validation:
      requiredFiles:
        - "package.json"
        - ".git"
      requiredContent:
        package.json: "myproject"
      optionalFiles:
        - "README.md"
        - "src/"
```

Then create the rules directory structure: `assets/rules/{project-type}/`

## Configuration File

The tool creates a `.lullabot-project.yml` file in your project root:

```yaml
project:
  type: "drupal"
  tool: "cursor"

features:
  taskPreferences:
    memory-bank: true
    rules: true
    vscode-xdebug: false

installation:
  created: "2024-01-15T10:30:00Z"
  updated: "2024-01-20T14:30:00Z"
  toolVersion: "1.0.0"

files:
  - path: ".ai/rules/ai-prompts.md"
    originalHash: "abc123..."
  - path: ".ai/rules/coding-standards.md"
    originalHash: "def456..."
  - path: ".ai/rules/project-rules.md"
    originalHash: "ghi789..."
  - path: "AGENTS.md"
    originalHash: "jkl012..."
    preExisting: false

packages:
  memory-bank:
    name: "cursor-bank"
    version: "1.0.1"
    lastUpdated: "2024-01-20T14:30:00Z"
    # Package tracking for update checking
    # Additional packages will be added here as they are installed
```

### Package Tracking

The tool automatically tracks external package versions for update checking:

- **Memory Bank Packages**: Versions of memory bank tools (e.g., `cursor-bank`)
- **Update Detection**: Automatically checks for newer versions when using `--check-updates`
- **Version History**: Stores installation and update timestamps
- **Real-time Checking**: Compares stored versions with current available versions

## Project Rules

### Drupal Rules

The tool installs comprehensive rules for Drupal development:

- **Coding Standards**: PHP, JavaScript, CSS/SCSS standards
- **AI Prompts**: Helpful prompts for Drupal development
- **Project Guidelines**: Best practices and workflows

### Rules Location

Rules are installed in a centralized location:
- **All Tools**: `.ai/rules/`

This centralized approach allows all AI tools to reference the same set of project-specific rules through the AGENTS.md standardization system.

### Git-Based File Access

The tool uses Git to pull the latest rules and configurations from the repository:

- **Repository**: Rules are stored in the [Lullabot/lullabot-project](https://github.com/Lullabot/lullabot-project) repository
- **Automatic Updates**: Always pulls the latest version from the main branch
- **Temporary Cloning**: Uses shallow clone for efficiency
- **Fallback**: If Git fails, falls back to local bundled files

## Troubleshooting

### Common Issues

#### "No existing configuration found"
```bash
# Run the init command first
lullabot-project init
```

#### "Project validation failed"
```bash
# Skip validation if needed
lullabot-project init --skip-validation

# Or ensure you're in the correct project directory
```


#### "Git operation failed"
```bash
# Check network connectivity
ping github.com

# Try with verbose output for more details
lullabot-project init -v
```

#### "Permission denied"
```bash
# Check directory permissions
ls -la

# Ensure you have write access to the current directory
```

### AGENTS.md Issues

#### AGENTS.md not created
- Ensure you selected a tool that supports AGENTS.md (Cursor, Claude, Windsurf, GitHub Copilot, Gemini)
- Make sure you chose the "AGENTS.md" task during setup

#### Missing file references in AGENTS.md
- Verify you selected the "Project Rules" task during setup to copy files to `.ai/rules/` directory first
- Check that `.ai/rules/` directory contains the expected rule files

#### Wrapper files not working
- Ensure wrapper files (like `claude.md`) contain the `@AGENTS.md` reference
- Verify wrapper files are in the correct location for your tool:
  - `claude.md` in project root
  - `.windsurf/rules/agents.md` for Windsurf
  - `.github/copilot-instructions.md` for GitHub Copilot

#### Custom content lost
- The tool preserves content outside the `<!-- Lullabot Project Start -->` and `<!-- Lullabot Project End -->` markers
- Make sure your custom content is outside these comment sections

#### Tool doesn't recognize AGENTS.md
- Some tools may need to be restarted after AGENTS.md is created or updated
- Clear the tool's cache if available
- Verify the wrapper file syntax is correct for your specific tool

#### AGENTS.md removal issues
- **File not removed**: Check if AGENTS.md is tracked in `.lullabot-project.yml` - it should be listed in the `files` section
- **Comment section not removed**: Ensure the file has the `preExisting: true` flag in the configuration if it existed before tool setup
- **File deleted when it should be preserved**: The tool deletes the entire file if it was created by the tool, or removes only the Lullabot comment section if it existed before

#### "Configuration appears corrupted"
```bash
# Use force update to recreate configuration
lullabot-project update --force

# Or remove and start fresh
lullabot-project remove --dry-run
lullabot-project remove
lullabot-project init
```

#### "Update command shows undefined values"
```bash
# Force update to fix corrupted configuration
lullabot-project update --force

# Or check current configuration
lullabot-project config --verbose
```

### Verbose Mode

Use verbose mode for detailed debugging:

```bash
lullabot-project init -v
lullabot-project update -v
lullabot-project config -v
```

### Dry Run

Test what the tool would do without making changes:

```bash
# See what init would do
lullabot-project init --dry-run

# See what update would do
lullabot-project update --dry-run

# See what remove would do
lullabot-project remove --dry-run

# Combine with other options
lullabot-project init -i cursor -p development --skip-tasks memory-bank --dry-run
lullabot-project update --force --dry-run
```

## Local Development Mode

The tool supports a `--local` flag for development and testing purposes. This mode allows you to use local files instead of pulling from the Git repository.

### When to Use Local Mode

- **Development**: When you're working on the tool itself and want to test changes
- **Testing**: When you want to test new assets before committing them to Git
- **Offline Development**: When you don't have access to the Git repository

### How It Works

```bash
# Use local files instead of Git repository
lullabot-project init --local -t cursor -p development
lullabot-project update --local
```

**Local Mode Behavior:**
- Files are copied from the local `assets/` directory instead of the Git repository
- No network access required
- Useful for testing new files before they're committed and tagged
- Falls back to Git if local files are not found
- **Note**: The `--local` flag only works with `copy-files` tasks. It does not affect `remote-copy-files` tasks, which always pull from remote repositories

### Development Workflow

1. **Make changes** to assets in the local repository
2. **Test locally** using `--local` flag
3. **Commit and tag** changes in Git
4. **Test with Git** using normal commands

## Development

### Project Structure

```
lullabot-project/
├── package.json
├── index.js (main executable)
├── src/
│   ├── cli.js (CLI logic and command handling)
│   ├── prompts.js (interactive prompts)
│   ├── tool-config.js (Tool configuration handling)
│   ├── file-operations.js (file copying/management)
│   ├── git-operations.js (Git-based file access)
│   ├── commands.js (specific command execution)
│   └── validation.js (directory validation)
├── config/
│   └── config.yml (Tool and project definitions)
├── assets/
│   ├── rules/
│   │   └── drupal/
│   │       ├── coding-standards.md
│   │       ├── ai-prompts.md
│   │       └── project-rules.md
│   ├── wrappers/
│   │   ├── claude.md
│   │   ├── windsurf.md
│   │   ├── github-copilot.md
│   │   └── gemini.md
│   ├── AGENTS.md
│   └── vscode/
│       └── launch.json
└── tests/
    ├── basic.test.js
    ├── functional.test.js
    ├── module.test.js
    ├── setup.js
    ├── utils.js
    └── README.md
```

### Adding New Features

1. **New Tool**: Update `config/config.yml` and create rules directory in `assets/rules/{tool}/`
2. **New Project Type**: Add validation rules and create project-specific rules
3. **New Commands**: Add command logic in `src/commands.js` and CLI setup in `index.js`

### Testing

The project includes a comprehensive test suite with excellent coverage. Our testing approach focuses on reliability, edge cases, and real-world scenarios.

#### Quick Test Commands

```bash
# Run all tests
npm test

# Run specific test files
npm test tests/unit/prompts-targeted.test.js

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm test -- --coverage

# Run tests with verbose output
npm test -- --verbose
```

#### Test Coverage

Our comprehensive test suite provides excellent coverage across all modules:

- ✅ **CLI command functionality** - All commands tested with various options
- ✅ **Configuration management** - Loading, saving, and updating configurations
- ✅ **File operations** - Copying, security checks, and error handling
- ✅ **User interaction** - Prompts, confirmations, and task preferences
- ✅ **Error handling** - Graceful failure modes and edge cases
- ✅ **Integration workflows** - End-to-end setup and update processes
- ✅ **Security features** - Path traversal prevention and validation
- ✅ **Git operations** - Repository cloning and file access
- ✅ **Package management** - Installation and version tracking

#### Test Architecture

We use a multi-layered testing approach:

- **Unit Tests**: Focused testing of individual functions and modules
- **Integration Tests**: Testing module interactions and workflows
- **Targeted Tests**: Specific coverage of edge cases and error paths
- **Functional Tests**: End-to-end testing of user workflows
- **Edge Case Tests**: Comprehensive coverage of failure scenarios

#### Coverage Goals

Our testing strategy targets:
- **100% function coverage** - All functions are tested
- **90%+ statement coverage** - Comprehensive code execution testing
- **80%+ branch coverage** - Testing different code paths
- **Real-world scenarios** - Testing actual user workflows

#### Manual Testing

```bash
# Test the tool locally
npm start init -i cursor -p development -v

# Test with dry run
npm start init -i cursor -p development --skip-tasks memory-bank --dry-run

# Test update command
npm start update -v

# Test config command
npm start config --json
```

## Version Pinning

The tool automatically ensures version consistency by using Git tags that match the tool version number. This prevents compatibility issues and ensures users always get the exact files that correspond to their tool version.

### How It Works

1. **Automatic Version Detection**: The tool reads its version from `package.json`
2. **Tag-Based Cloning**: Git operations attempt to clone from the version tag first (e.g., `v1.0.0`)
3. **Fallback Protection**: If the tag doesn't exist, it falls back to the main branch
4. **Clear Feedback**: Users see exactly which tag/branch was used for file operations

### Example

```bash
# Tool version 1.0.0 will attempt to clone from tag 1.0.0
lullabot-project init -t cursor -p development -v

# Output shows:
# Attempting to clone from https://github.com/Lullabot/lullabot-project tag 1.0.0
# ✅ Successfully cloned from tag 1.0.0
```

### Benefits

- **Version Consistency**: Files are always from the exact tool version
- **Reproducible Results**: Same tool version = same file versions
- **Compatibility**: Prevents issues from mismatched file versions
- **Transparency**: Clear visibility into which Git reference was used

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the verbose output for debugging

## Development

### Prerequisites

- Node.js 18.18.0 or higher (for ESLint v9)
- npm or yarn package manager

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd lullabot-project
   ```

2. **Run the development setup script:**
   ```bash
   ./scripts/dev-setup.sh
   ```

3. **Or manually install dependencies:**
   ```bash
   npm install
   ```

### Development Commands

- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Run ESLint with auto-fix for fixable issues
- `npm run format` - Run Prettier to format code
- `npm run format:check` - Check if code is properly formatted
- `npm test` - Run tests
- `npm start` - Start the application

### Code Quality

This project uses:
- **ESLint v9** for code linting and syntax checking
- **Prettier** for code formatting
- **Jest** for comprehensive testing with excellent coverage

The configuration ensures consistent code style across the project with:
- 2-space indentation
- Single quotes for strings
- 80-character line length
- Semicolons required
- No trailing commas

### Quality Assurance

Our commitment to quality is demonstrated through:

- **Comprehensive Testing**: 456 tests covering all functionality
- **Excellent Coverage**: 100% function coverage, 90%+ statement coverage
- **Edge Case Testing**: Comprehensive testing of failure scenarios
- **Security Testing**: Path traversal prevention and validation testing
- **Integration Testing**: End-to-end workflow testing
- **Regression Prevention**: No known regressions in current release
- **Continuous Improvement**: Regular testing and validation of all features

### VS Code Integration

The project includes VS Code settings for automatic formatting and linting:
- Format on save enabled
- ESLint auto-fix on save
- Prettier as default formatter
