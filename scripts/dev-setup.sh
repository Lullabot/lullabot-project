#!/bin/bash

# Development setup script for lullabot-project
echo "Setting up development environment..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Install VS Code extensions if code command is available
if command -v code &> /dev/null; then
  echo "Installing recommended VS Code extensions..."
  code --install-extension esbenp.prettier-vscode
  code --install-extension dbaeumer.vscode-eslint
  code --install-extension ms-vscode.vscode-json
else
  echo "VS Code 'code' command not found. Please install extensions manually:"
  echo "- esbenp.prettier-vscode"
  echo "- dbaeumer.vscode-eslint"
  echo "- ms-vscode.vscode-json"
fi

echo "Development environment setup complete!"
echo ""
echo "Available commands:"
echo "  npm run lint        - Run ESLint"
echo "  npm run lint:fix    - Run ESLint with auto-fix"
echo "  npm run format      - Run Prettier to format code"
echo "  npm run format:check - Check if code is formatted"
echo "  npm test           - Run tests"
echo "  npm start          - Start the application"
