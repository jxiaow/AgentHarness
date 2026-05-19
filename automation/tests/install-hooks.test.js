import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const scriptPath = path.resolve('automation/install-hooks.js');

let tempDir;

function runInstallHooks(...args) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: tempDir,
    encoding: 'utf8',
  });
}

function setupRepo() {
  // Create a fake repo with .git/hooks and a .githooks source
  fs.mkdirSync(path.join(tempDir, '.git', 'hooks'), { recursive: true });
  fs.mkdirSync(path.join(tempDir, '.githooks'), { recursive: true });
  fs.writeFileSync(
    path.join(tempDir, '.githooks', 'pre-commit'),
    '#!/bin/sh\n# agent-harness pre-commit hook\necho "running checks"\n',
    'utf8'
  );
}

describe('install-hooks script', () => {
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'install-hooks-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('installs hooks from .githooks into .git/hooks', () => {
    setupRepo();

    const result = runInstallHooks();

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Installed hooks: pre-commit');

    const installed = fs.readFileSync(path.join(tempDir, '.git/hooks/pre-commit'), 'utf8');
    expect(installed).toContain('agent-harness pre-commit hook');
  });

  it('does not overwrite existing non-harness hooks', () => {
    setupRepo();
    const existingHook = '#!/bin/sh\necho "user custom hook"\n';
    fs.writeFileSync(path.join(tempDir, '.git/hooks/pre-commit'), existingHook, 'utf8');

    const result = runInstallHooks();

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Skipped');
    expect(result.stdout).toContain('pre-commit');

    const preserved = fs.readFileSync(path.join(tempDir, '.git/hooks/pre-commit'), 'utf8');
    expect(preserved).toBe(existingHook);
  });

  it('overwrites existing non-harness hooks with --force', () => {
    setupRepo();
    fs.writeFileSync(
      path.join(tempDir, '.git/hooks/pre-commit'),
      '#!/bin/sh\necho "user custom hook"\n',
      'utf8'
    );

    const result = runInstallHooks('--force');

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Installed hooks: pre-commit');

    const installed = fs.readFileSync(path.join(tempDir, '.git/hooks/pre-commit'), 'utf8');
    expect(installed).toContain('agent-harness pre-commit hook');
  });

  it('overwrites existing harness hooks without --force', () => {
    setupRepo();
    // Pre-existing harness hook (older version)
    fs.writeFileSync(
      path.join(tempDir, '.git/hooks/pre-commit'),
      '#!/bin/sh\n# agent-harness pre-commit hook\n# old version\n',
      'utf8'
    );

    const result = runInstallHooks();

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Installed hooks: pre-commit');

    const installed = fs.readFileSync(path.join(tempDir, '.git/hooks/pre-commit'), 'utf8');
    expect(installed).toContain('running checks');
    expect(installed).not.toContain('old version');
  });

  it('uninstalls only harness-installed hooks', () => {
    setupRepo();
    fs.writeFileSync(
      path.join(tempDir, '.git/hooks/pre-commit'),
      '#!/bin/sh\n# agent-harness pre-commit hook\necho "harness"\n',
      'utf8'
    );
    fs.writeFileSync(
      path.join(tempDir, '.git/hooks/pre-push'),
      '#!/bin/sh\necho "user custom hook"\n',
      'utf8'
    );

    const result = runInstallHooks('--uninstall');

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Removed harness hooks: pre-commit');
    expect(fs.existsSync(path.join(tempDir, '.git/hooks/pre-commit'))).toBe(false);
    expect(fs.existsSync(path.join(tempDir, '.git/hooks/pre-push'))).toBe(true);
  });

  it('finds hooks directory in consumer layout (harness/core/.githooks)', () => {
    fs.mkdirSync(path.join(tempDir, '.git', 'hooks'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'harness/core/.githooks'), { recursive: true });
    fs.writeFileSync(
      path.join(tempDir, 'harness/core/.githooks/pre-commit'),
      '#!/bin/sh\n# agent-harness pre-commit hook\necho "from consumer layout"\n',
      'utf8'
    );

    const result = runInstallHooks();

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Installed hooks: pre-commit');

    const installed = fs.readFileSync(path.join(tempDir, '.git/hooks/pre-commit'), 'utf8');
    expect(installed).toContain('from consumer layout');
  });

  it('errors when not in a git repo and no --target given', () => {
    fs.mkdirSync(path.join(tempDir, '.githooks'), { recursive: true });
    fs.writeFileSync(
      path.join(tempDir, '.githooks/pre-commit'),
      '#!/bin/sh\n# agent-harness pre-commit hook\n',
      'utf8'
    );

    const result = runInstallHooks();

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Not inside a git repository');
  });

  it('errors when no hooks source directory found', () => {
    fs.mkdirSync(path.join(tempDir, '.git', 'hooks'), { recursive: true });

    const result = runInstallHooks();

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Could not find harness .githooks directory');
  });

  it('supports custom --target directory', () => {
    fs.mkdirSync(path.join(tempDir, '.githooks'), { recursive: true });
    fs.writeFileSync(
      path.join(tempDir, '.githooks/pre-commit'),
      '#!/bin/sh\n# agent-harness pre-commit hook\n',
      'utf8'
    );
    const customTarget = path.join(tempDir, 'custom-hooks');

    const result = runInstallHooks('--target', customTarget);

    expect(result.status).toBe(0);
    expect(fs.existsSync(path.join(customTarget, 'pre-commit'))).toBe(true);
  });

  it('prints usage with --help', () => {
    const result = runInstallHooks('--help');

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('install-hooks.js');
    expect(result.stdout).toContain('--force');
    expect(result.stdout).toContain('--uninstall');
  });

  it('is exposed as the harness:install-hooks npm script', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));

    expect(packageJson.scripts['harness:install-hooks']).toBe(
      'node automation/install-hooks.js'
    );
  });
});
