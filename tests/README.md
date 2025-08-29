# Testing Documentation

This document describes the testing strategy and setup for the lullabot-project CLI tool.

## Test Structure

The test suite is organized into several categories:

### 1. Basic Tests (`tests/basic.test.js`)
- Simple unit tests to verify Jest is working correctly
- Tests basic JavaScript functionality
- Async operation testing

### 2. Functional Tests (`tests/functional.test.js`)
- End-to-end CLI testing using child processes
- Tests command-line interface behavior
- Verifies help, version, and error handling

### 3. Module Tests (`tests/module.test.js`)
- Tests core functionality without importing ES modules
- Validates configuration structures
- Tests file operations logic
- Command-line argument parsing

### 4. Integration Tests
- Tests the complete CLI workflow
- Mocks all dependencies for isolated testing
- Tests init, update, config, and remove commands
- (Note: ES module compatibility issues prevent direct testing of some modules)

## Test Setup

### Dependencies
- **Jest**: Testing framework
- **Supertest**: HTTP testing (for future API testing)

### Configuration
- Jest configuration in `jest.config.js`
- Test setup in `tests/setup.js`
- Utility functions in `tests/utils.js`

### Mocking Strategy
- Console output is mocked to avoid noise during tests
- File system operations are mocked for isolated testing
- External commands (like `npx`) are mocked
- Process exit is mocked to prevent test termination

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Files
```bash
npm test tests/basic.test.js
npm test tests/functional.test.js
npm test tests/module.test.js
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Coverage

The test suite covers:

### CLI Commands
- ✅ `init` - Initialize development environment
- ✅ `update` - Update existing configuration
- ✅ `config` - Show current configuration
- ✅ `remove` - Remove all files and configuration

### Core Functionality
- ✅ Configuration loading and validation
- ✅ Project type validation
- ✅ File operations (copy, create, remove)
- ✅ Memory bank setup
- ✅ Rules installation
- ✅ Error handling

### User Experience
- ✅ Interactive prompts
- ✅ Command-line arguments
- ✅ Help and version display
- ✅ Verbose output
- ✅ Dry-run mode

## Testing Challenges

### ES Modules
The project uses ES modules, which presents challenges with Jest:
- Direct imports of ES modules are not supported in the current Jest configuration
- Functional tests avoid direct module imports by testing CLI behavior
- Module logic is tested indirectly through configuration validation and file operations
- Future improvements could include better ES module support configuration

### File System Operations
- All file operations are mocked to prevent side effects
- Tests use temporary directories when needed
- File existence and content are simulated

### External Commands
- Commands like `npx cursor-bank init` are mocked
- Package version checking is simulated
- Process execution is controlled

## Future Improvements

1. **Better ES Module Support**: Configure Jest to better handle ES modules for direct module testing
2. **Integration Tests**: More comprehensive end-to-end testing with proper ES module support
3. **Snapshot Testing**: For configuration file generation
4. **Performance Testing**: For large project operations
5. **Cross-platform Testing**: Ensure compatibility across operating systems
6. **Unit Tests**: Direct testing of individual modules once ES module support is improved

## Best Practices

1. **Isolation**: Each test should be independent
2. **Mocking**: Mock external dependencies
3. **Descriptive Names**: Test names should clearly describe what they test
4. **Error Cases**: Test both success and failure scenarios
5. **Edge Cases**: Test boundary conditions and unusual inputs
