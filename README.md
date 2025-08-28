# Lullabot Project Setup

A CLI tool that helps developers set up their IDE environment with AI tools, memory banks, and project-specific rules. The tool is designed to be extensible, user-friendly, and maintainable.

## Features

- **IDE Configuration**: Set up your development environment for supported IDEs
- **Project Validation**: Automatically validate project types and structure
- **Memory Bank Setup**: Configure AI memory banks for enhanced development
- **Project Rules**: Install project-specific coding standards and guidelines
- **Interactive Setup**: Guided setup process with clear prompts
- **Update Management**: Easy updates to existing configurations
- **Extensible**: Easy to add new IDEs and project types

## Installation

### Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn package manager

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
lullabot-project init -i cursor -p drupal -m -r
```

### Commands

#### `init` - Initialize Development Environment

Set up your development environment with AI tools and project rules.

```bash
lullabot-project init [options]
```

**Options:**
- `-i, --ide <ide>` - Specify IDE (cursor)
- `-p, --project <type>` - Specify project type (drupal)
- `--skip-memory-bank` - Skip memory bank setup
- `--skip-rules` - Skip project rules
- `-v, --verbose` - Verbose output
- `--skip-validation` - Skip project type validation
- `--dry-run` - Show what would be done without executing

**Examples:**
```bash
# Interactive setup
lullabot-project init

# Quick setup for Cursor + Drupal
lullabot-project init -i cursor -p drupal

# Setup with all features (default)
lullabot-project init -i cursor -p drupal

# Setup without memory bank
lullabot-project init -i cursor -p drupal --skip-memory-bank

# Setup without rules
lullabot-project init -i cursor -p drupal --skip-rules

# Setup without both features
lullabot-project init -i cursor -p drupal --skip-memory-bank --skip-rules

# Verbose setup with validation
lullabot-project init -i cursor -p drupal -v
```

#### `update` - Update Existing Setup

Update your existing development environment configuration using stored settings.

```bash
lullabot-project update [options]
```

**Options:**
- `-i, --ide <ide>` - Override stored IDE setting (optional)
- `-p, --project <type>` - Override stored project type (optional)
- `--skip-memory-bank` - Skip memory bank setup
- `--skip-rules` - Skip project rules
- `-v, --verbose` - Verbose output
- `--dry-run` - Show what would be updated without executing
- `-F, --force` - Force update - recreate configuration if corrupted

**Examples:**
```bash
# Update using stored configuration (most common)
lullabot-project update

# Update with verbose output
lullabot-project update -v

# Update and change IDE
lullabot-project update -i windsurf

# Update and skip memory bank
lullabot-project update --skip-memory-bank

# Update and skip rules
lullabot-project update --skip-rules

# Update with overrides and verbose
lullabot-project update -i cursor -p drupal --skip-rules -v

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
- Rules files (`.{ide}/rules/*` or IDE-specific)
- Memory bank files (noted but not removed as they may be used by other projects)

## Supported IDEs

### Cursor

- **Memory Bank**: Uses `npx cursor-bank init`
- **Rules Path**: `.cursor/rules`
- **Supported Projects**: Drupal

### Windsurf

- **Memory Bank**: Not supported (no external setup available)
- **Rules Path**: `.windsurf/rules`
- **Supported Projects**: Drupal

### Adding New IDEs

New IDEs can be easily added by updating the `config/config.yml` file:

```yaml
ides:
  windsurf:
    name: "Windsurf"
    # No memory-bank-command - Windsurf does not support external memory banks
```

**Memory Bank Support:**
- If the IDE has a memory bank command, add `memory-bank-command: "command"`
- If the IDE does not support external memory banks, omit the `memory-bank-command` field
- The tool will automatically skip memory bank prompts for IDEs without memory bank commands

**Rules Path:**
- Rules paths are automatically inferred from the IDE key (e.g., "cursor" → `.cursor/rules`)
- No additional configuration needed for rules paths
- Each IDE can have its own project-specific rules in different formats

## Supported Project Types

### Drupal

- **Validation**: Checks for `composer.json` with Drupal dependencies
- **Rules**: Comprehensive Drupal coding standards and AI prompts
- **Features**: Memory bank integration, project guidelines

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

Then create the rules directory structure for each IDE: `rules/{ide}/{project-type}/`

## Configuration File

The tool creates a `.lullabot-project.yml` file in your project root:

```yaml
project:
  type: "drupal"
  ide: "cursor"

features:
  memoryBank: true
  rules: true

installation:
  created: "2024-01-15T10:30:00Z"
  updated: "2024-01-20T14:30:00Z"
  toolVersion: "1.0.0"

files:
  - ".cursor/rules/ai-prompts.md"
  - ".cursor/rules/coding-standards.md"
  - ".cursor/rules/project-rules.md"

packages:
  memoryBank:
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

Rules are installed in IDE-specific locations:
- **Cursor**: `.cursor/rules/`
- **Windsurf**: `.windsurf/rules/`

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

#### "Memory bank setup failed"
```bash
# Check if the memory bank package is available
npx cursor-bank --version

# Try manual installation
npm install -g cursor-bank
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
lullabot-project init -i cursor -p drupal --skip-memory-bank --dry-run
lullabot-project update --force --dry-run
```

## Development

### Project Structure

```
lullabot-project/
├── package.json
├── index.js (main executable)
├── src/
│   ├── cli.js (CLI logic)
│   ├── prompts.js (interactive prompts)
│   ├── ide-config.js (IDE configuration handling)
│   ├── file-operations.js (file copying/management)
│   ├── commands.js (specific command execution)
│   └── validation.js (directory validation)
├── config/
│   └── config.yml (IDE and project definitions)
└── rules/
    ├── cursor/
    │   └── drupal/
    │       ├── coding-standards.md
    │       ├── ai-prompts.md
    │       └── project-rules.md
    └── windsurf/
        └── drupal/
            ├── coding-standards.md
            ├── ai-prompts.md
            └── project-rules.md
```

### Adding New Features

1. **New IDE**: Update `config/ides.yml` and create rules directory
2. **New Project Type**: Add validation rules and create project-specific rules
3. **New Commands**: Add command logic in `src/commands.js` and CLI setup in `index.js`

### Testing

```bash
# Test the tool locally
npm start init -i cursor -p drupal -v

# Test with dry run
npm start init -i cursor -p drupal --skip-memory-bank --dry-run

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
- Support for Cursor IDE
- Drupal project type
- Memory bank integration
- Project rules installation
- Interactive setup process
- Configuration management
