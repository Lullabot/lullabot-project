# AI Development Instructions

This project uses standardized AI development instructions that work across all supported AI tools.

## Project Overview

This document contains the AI development guidelines and rules for this project. The instructions below are automatically managed by the Lullabot Project tool and should not be manually edited between the comment markers.

<!-- Lullabot Project Start -->

## Project-Specific AI Development Files

This project includes the following AI development files:

<!-- Dynamic file references will be inserted here -->

<!-- Lullabot Project End -->

## Usage

These instructions are designed to work with various AI development tools:

- **Claude Code**: Uses `claude.md` wrapper file
- **Cursor**: Direct support for AGENTS.md
- **Windsurf**: Uses `.windsurf/rules/agents.md` wrapper file
- **GitHub Copilot**: Uses `.github/copilot-instructions.md` wrapper file
- **Gemini**: Uses `gemini.md` wrapper file

## Customization

You can add your own custom instructions above or below the Lullabot-managed section. Content outside the `<!-- Lullabot Project Start -->` and `<!-- Lullabot Project End -->` markers will be preserved during updates.

## Updates

To update the project-specific files referenced in this document, run:

```bash
lullabot-project update
```

This will refresh the file references while preserving your custom content.
