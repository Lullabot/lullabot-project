# GitHub Actions Setup

This repository includes comprehensive GitHub Actions workflows for continuous integration and automated NPM publishing.

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

#### Test Job
- **Node.js versions:** 18.x, 20.x (matrix strategy)
- **Actions:**
  - Install dependencies with `npm ci`
  - Run full test suite with `npm test`
  - Generate coverage reports with `npm run test:coverage`
  - Upload coverage to Codecov (Node.js 20.x only)

#### Lint Job
- **Node.js version:** 20.x
- **Actions:**
  - Run ESLint with `npm run lint`
  - Check Prettier formatting with `npm run format:check`
  - Verify no auto-fixable ESLint issues

#### Build Job
- **Node.js version:** 20.x
- **Actions:**
  - Verify package.json configuration
  - Test CLI help command
  - Test CLI version command

### 2. Release Workflow (`.github/workflows/release.yml`)

**Triggers:**
- GitHub release published

**Features:**
- **Pre-publish validation:**
  - Run full test suite
  - Run linting checks
  - Run formatting checks
  - Verify CLI functionality
- **NPM publishing:**
  - Uses [publish-npm-action](https://github.com/marketplace/actions/publish-npm-package-on-release)
  - Automatic version detection from release tag
  - Public package publishing
  - Post-publish verification
- **Release summary:**
  - Automatic GitHub release summary generation
  - NPM package URL and installation instructions

## Setup Requirements

### 1. NPM Token Setup

1. **Create NPM Automation Token:**
   - Go to [npmjs.com](https://www.npmjs.com) → Profile → Access Tokens
   - Create an "Automation" token with "Publish" permission
   - Copy the token

2. **Add to GitHub Secrets:**
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add new repository secret:
     - **Name:** `NPM_TOKEN`
     - **Value:** Your NPM automation token

### 2. Repository Configuration

The following are already configured in `package.json`:

```json
{
  "files": [
    "index.js",
    "src/",
    "config/",
    "assets/",
    "scripts/",
    "README.md",
    "LICENSE"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/lullabot/lullabot-project.git"
  },
  "bugs": {
    "url": "https://github.com/lullabot/lullabot-project/issues"
  },
  "homepage": "https://github.com/lullabot/lullabot-project#readme"
}
```

## Usage

### Creating a Release

1. **Update version in package.json:**
   ```bash
   npm version patch  # or minor, major
   ```

2. **Push changes:**
   ```bash
   git push origin main
   git push --tags
   ```

3. **Create GitHub Release:**
   - Go to repository → Releases → Create a new release
   - Select the tag (e.g., `v2.1.1`)
   - Add release notes
   - Click "Publish release"

4. **Automatic Publishing:**
   - The release workflow will automatically:
     - Run all tests and quality checks
     - Publish to NPM
     - Generate a release summary

### Monitoring Workflows

- **CI Status:** Check the "Actions" tab for CI workflow results
- **Release Status:** Monitor the release workflow in the Actions tab
- **NPM Package:** Verify publication at [npmjs.com/package/lullabot-project](https://www.npmjs.com/package/lullabot-project)

## Workflow Features

### Quality Assurance
- **Multi-Node.js testing:** Ensures compatibility across Node.js versions
- **Comprehensive testing:** Runs all 456+ tests with coverage reporting
- **Code quality:** ESLint and Prettier validation
- **CLI functionality:** Verifies command-line interface works correctly

### Automation
- **Zero-touch publishing:** Fully automated NPM publishing on release
- **Version synchronization:** Automatic version detection from Git tags
- **Release summaries:** Automatic generation of release documentation
- **Verification:** Post-publish validation of NPM package

### Developer Experience
- **Fast feedback:** Quick CI results on pull requests
- **Clear error messages:** Detailed failure information
- **Coverage reporting:** Code coverage tracking and reporting
- **Release automation:** Streamlined release process

## Troubleshooting

### Common Issues

**NPM Authentication Failed:**
- Verify `NPM_TOKEN` secret is correctly set
- Ensure token has "Automation" type with "Publish" permission
- Check token hasn't expired

**Tests Fail:**
- Review test output in Actions tab
- Ensure all tests pass locally before pushing
- Check for environment-specific issues

**Linting Fails:**
- Run `npm run lint:fix` locally to auto-fix issues
- Run `npm run format` to fix formatting issues
- Ensure code follows project style guidelines

**Release Fails:**
- Verify package.json has correct version
- Ensure Git tag matches package.json version
- Check NPM_TOKEN has proper permissions

### Getting Help

- **CI Issues:** Check the Actions tab for detailed logs
- **NPM Issues:** Verify package configuration and token permissions
- **Release Issues:** Review release workflow logs and NPM package status

## Security

- **Token Security:** NPM_TOKEN is stored as encrypted GitHub secret
- **Minimal Permissions:** Workflows use minimal required permissions
- **Public Publishing:** Package is published as public (configurable)
- **No Credential Storage:** No sensitive data stored in repository

## Performance

- **Parallel Jobs:** CI jobs run in parallel for faster feedback
- **Caching:** npm cache is cached between runs
- **Matrix Strategy:** Efficient testing across multiple Node.js versions
- **Fast Publishing:** Optimized release workflow for quick NPM publishing
