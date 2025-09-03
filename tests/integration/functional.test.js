import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('CLI Functional Tests', () => {
  const cliPath = path.join(__dirname, '..', '..', 'index.js');

  it('should show help when no arguments provided', (done) => {
    const child = spawn('node', [cliPath, '--help']);
    let output = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      expect(code).toBe(0);
      expect(output).toContain('Usage: lullabot-project');
      expect(output).toContain('Commands:');
      expect(output).toContain('init');
      expect(output).toContain('update');
      expect(output).toContain('config');
      expect(output).toContain('remove');
      done();
    });
  });

  it('should show version when --version is provided', (done) => {
    const child = spawn('node', [cliPath, '--version']);
    let output = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      expect(code).toBe(0);
      expect(output).toMatch(/^\d+\.\d+\.\d+/);
      done();
    });
  });

  it('should show error for invalid command', (done) => {
    const child = spawn('node', [cliPath, 'invalid-command']);
    let output = '';

    child.stderr.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      expect(code).toBe(1);
      expect(output).toContain('error: unknown command');
      done();
    });
  });
});
