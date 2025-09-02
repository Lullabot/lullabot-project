# Lullabot Project Setup

A CLI tool that helps developers set up their development environment with AI tools, memory banks, and project-specific rules. The tool is designed to be extensible, user-friendly, and maintainable.

## Features

- **Tool Configuration**: Set up your development environment for supported tools
- **Project Validation**: Automatically validate project types and structure
- **Memory Bank Setup**: Configure AI memory banks for enhanced development
- **Project Rules**: Install project-specific coding standards and guidelines
- **Git-Based File Access**: Pull latest rules and configurations from the repository
- **Flexible Task System**: Dynamic task execution with package installation, file copying, and command execution
- **Interactive Setup**: Guided setup process with clear prompts
- **Update Management**: Easy updates to existing configurations
- **Extensible**: Easy to add new tools and project types

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
lullabot-project init -i cursor -p drupal --all-tasks
```

### Commands

#### `init` - Initialize Development Environment

Set up your development environment with AI tools and project rules.

```bash
lullabot-project init [options]
```

**Options:**
- `-t, --tool <tool>` - Specify tool (cursor, windsurf, vscode)
- `-p, --project <type>` - Specify project type (drupal, none)
- `--skip-tasks <tasks>` - Skip specific tasks (comma-separated)
- `--tasks <tasks>` - Execute only specific tasks (comma-separated)
- `--all-tasks` - Execute all available tasks
- `-v, --verbose` - Verbose output
- `--skip-validation` - Skip project type validation
- `--dry-run` - Show what would be done without executing

**Examples:**
```bash
# Interactive setup
lullabot-project init

# Quick setup for Cursor + Drupal
lullabot-project init -t cursor -p drupal

# Setup with all features (default)
lullabot-project init -t cursor -p drupal --all-tasks

# Setup without memory bank
lullabot-project init -t cursor -p drupal --skip-tasks memory-bank

# Setup without rules
lullabot-project init -t cursor -p drupal --skip-tasks rules

# Setup without both features
lullabot-project init -t cursor -p drupal --skip-tasks memory-bank,rules

# Setup without project-specific rules (tool-only)
lullabot-project init -t cursor -p none

# Execute only specific tasks
lullabot-project init -t cursor -p drupal --tasks memory-bank

# Execute all available tasks
lullabot-project init -t cursor -p drupal --all-tasks

# Verbose setup with validation
lullabot-project init -t cursor -p drupal -v
```

#### `update` - Update Existing Setup

Update your existing development environment configuration using stored settings.

```bash
lullabot-project update [options]
```

**Options:**
- `-t, --tool <tool>` - Override stored tool setting (optional)
- `-p, --project <type>` - Override stored project type (drupal, none, optional)
- `--skip-tasks <tasks>` - Skip specific tasks (comma-separated)
- `--tasks <tasks>` - Execute only specific tasks (comma-separated)
- `--all-tasks` - Execute all available tasks
- `-v, --verbose` - Verbose output
- `--dry-run` - Show what would be updated without executing
- `-F, --force` - Force update - recreate configuration if corrupted

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
lullabot-project update -t cursor -p drupal --skip-tasks rules -v

# Force update if configuration is corrupted
lullabot-project update --force

# Force update with dry-run to see what would happen
lullabot-project update --force --dry-run
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
- Rules files (`.{tool}/rules/*` or tool-specific)
- Memory bank files (noted but not removed as they may be used by other projects)

## Supported Tools

### Cursor

- **Memory Bank**: Uses `npx cursor-bank init`
- **Rules Path**: `.cursor/rules`
- **Supported Projects**: Drupal
- **Additional Tasks**: VSCode XDebug setup

### Windsurf

- **Memory Bank**: Not supported (no external setup available)
- **Rules Path**: `.windsurf/rules`
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
        source: "assets/rules/newtool/{project-type}/"
        target: ".newtool/rules/"
        required: false
        prompt: "Would you like to install project-specific rules and guidelines?"
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
  source: "assets/rules/cursor/{project-type}/"
  target: ".cursor/rules/"
  required: false
  prompt: "Would you like to install project-specific rules and guidelines?"
```

**Configuration:**
- `source`: Source directory with placeholders (`{tool}`, `{project-type}`)
- `target`: Target directory with placeholders
- `items`: Optional array of specific files/directories to copy (if not specified, copies all items)

**Copy Options:**
- **Copy all files/directories** (default behavior):
  ```yaml
  rules:
    type: "copy-files"
    source: "assets/rules/cursor/{project-type}/"
    target: ".cursor/rules/"
  ```

- **Copy specific files only**:
  ```yaml
  rules:
    type: "copy-files"
    source: "assets/rules/cursor/{project-type}/"
    target: ".cursor/rules/"
    items: ["coding-standards.md", "ai-prompts.md"]
  ```


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
- `type`: Task type (`package-install`, `copy-files`, `command`)
- `required`: Whether the task is required (true) or optional (false)

**Optional Fields:**
- `description`: Detailed task description
- `prompt`: Custom prompt text for optional tasks

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

Then create the rules directory structure for each tool: `assets/rules/{tool}/{project-type}/`

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
  - ".cursor/rules/ai-prompts.md"
  - ".cursor/rules/coding-standards.md"
  - ".cursor/rules/project-rules.md"

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

Rules are installed in tool-specific locations:
- **Cursor**: `.cursor/rules/`
- **Windsurf**: `.windsurf/rules/`

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
lullabot-project init -i cursor -p drupal --skip-tasks memory-bank --dry-run
lullabot-project update --force --dry-run
```

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
│   │   ├── cursor/
│   │   │   └── drupal/
│   │   │       ├── coding-standards.md
│   │   │       ├── ai-prompts.md
│   │   │       └── project-rules.md
│   │   └── windsurf/
│   │       └── drupal/
│   │           ├── coding-standards.md
│   │           ├── ai-prompts.md
│   │           └── project-rules.md
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

The project includes a comprehensive test suite. For detailed testing information, see [tests/README.md](tests/README.md).

#### Quick Test Commands

```bash
# Run all tests
npm test

# Run specific test files
npm test tests/functional.test.js

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

#### Test Coverage

The test suite covers:
- ✅ CLI command functionality
- ✅ Configuration management
- ✅ File operations
- ✅ User interaction
- ✅ Error handling
- ✅ Integration workflows

#### Manual Testing

```bash
# Test the tool locally
npm start init -i cursor -p drupal -v

# Test with dry run
npm start init -i cursor -p drupal --skip-tasks memory-bank --dry-run

# Test update command
npm start update -v

# Test config command
npm start config --json
```

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

## Changelog

### Version 1.0.0
- Initial release
- **Git-Based File Access**: Pull latest rules from repository
- **Enhanced Task System**: Dynamic task execution with package installation, file copying, and command execution
- **Flexible File Copying**: Support for copying individual files and/or directories
- **Backward Compatibility**: All existing configurations continue to work without changes
- Support for Cursor, Windsurf, and VSCode tools
- Drupal project type
- Memory bank integration
- Project rules installation
- Interactive setup process
- Configuration management

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
- **Jest** for testing

The configuration ensures consistent code style across the project with:
- 2-space indentation
- Single quotes for strings
- 80-character line length
- Semicolons required
- No trailing commas

### VS Code Integration

The project includes VS Code settings for automatic formatting and linting:
- Format on save enabled
- ESLint auto-fix on save
- Prettier as default formatter
