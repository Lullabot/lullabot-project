# Drupal Coding Standards for Cursor

## PHP Coding Standards

### General Rules
- Use PHP 8+ features when possible
- Always declare `strict_types=1;` at the top of PHP files
- Use PHP 8 attributes over annotations for Drupal plugins
- Prefer PHP array_* functions over foreach loops where appropriate
- Limit comment lines to 80 characters max and wrap to new lines
- Always end comments with a period

### Drupal-Specific Standards
- Follow Drupal Coding Standards (DCS)
- Use Drupal's coding standards for naming conventions
- Implement proper dependency injection
- Use Drupal's service container appropriately
- Follow Drupal's hook system patterns

### File Organization
- One class per file
- Use PSR-4 autoloading standards
- Organize files in proper directory structure
- Use descriptive file and directory names

## JavaScript/TypeScript Standards

### General Rules
- Use modern ES6+ features
- Prefer const over let, avoid var
- Use arrow functions for callbacks
- Implement proper error handling
- Use TypeScript when possible for type safety

### Drupal JavaScript
- Follow Drupal's JavaScript coding standards
- Use Drupal behaviors properly
- Implement proper event handling
- Use Drupal's translation system

## CSS/SCSS Standards

### General Rules
- Use BEM methodology for class naming
- Implement responsive design principles
- Use CSS custom properties for theming
- Follow mobile-first approach

### Drupal Theming
- Use Drupal's theme system properly
- Implement proper template overrides
- Use Drupal's CSS organization patterns
- Follow Drupal's responsive design guidelines

## Git Workflow

### Commit Standards
- Use conventional commit messages
- Keep commits atomic and focused
- Write descriptive commit messages
- Reference issue numbers when applicable

### Branch Strategy
- Use feature branches for development
- Implement proper code review process
- Use descriptive branch names
- Keep branches up to date with main

## Code Review Checklist

### Before Submitting
- [ ] Code follows Drupal coding standards
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] No debugging code remains
- [ ] Proper error handling implemented
- [ ] Security considerations addressed

### Review Points
- [ ] Code readability and maintainability
- [ ] Performance implications
- [ ] Security vulnerabilities
- [ ] Accessibility compliance
- [ ] Cross-browser compatibility
