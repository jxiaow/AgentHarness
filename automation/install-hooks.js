#!/usr/bin/env node

/**
 * Install agent-harness git hooks into the repository.
 *
 * Default behavior: copies .githooks/pre-commit into .git/hooks/pre-commit.
 *
 * Options:
 * --hooks-dir <path>  Source hooks directory (default: harness/core/.githooks or .githooks)
 * --target <path>     Target hooks directory (default: <repo>/.git/hooks)
 * --force             Overwrite existing hook files
 * --uninstall         Remove harness hooks
 * --help, -h          Show usage
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const HOOK_MARKER = '# agent-harness pre-commit hook';

function findGitDir(startDir) {
  let dir = path.resolve(startDir);
  while (true) {
    const gitPath = path.join(dir, '.git');
    if (fs.existsSync(gitPath)) {
      const stat = fs.statSync(gitPath);
      if (stat.isDirectory()) {
        return gitPath;
      }
      // Worktree case: .git is a file pointing to the real gitdir
      if (stat.isFile()) {
        const content = fs.readFileSync(gitPath, 'utf8').trim();
        const match = content.match(/^gitdir:\s*(.+)$/);
        if (match) {
          return path.resolve(dir, match[1]);
        }
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}

function findHooksDir(cwd) {
  // Try consumer layout first
  const consumer = path.resolve(cwd, 'harness/core/.githooks');
  if (fs.existsSync(consumer)) {
    return consumer;
  }
  // Then core-local
  const local = path.resolve(cwd, '.githooks');
  if (fs.existsSync(local)) {
    return local;
  }
  return null;
}

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === '--hooks-dir') {
      options.hooksDir = argv[i + 1];
      i += 1;
    } else if (value === '--target') {
      options.target = argv[i + 1];
      i += 1;
    } else if (value === '--force') {
      options.force = true;
    } else if (value === '--uninstall') {
      options.uninstall = true;
    } else if (value === '--help' || value === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }
  return options;
}

function printUsage() {
  console.log('Usage: node harness/core/automation/install-hooks.js [options]');
  console.log('');
  console.log('Installs agent-harness git hooks (pre-commit by default).');
  console.log('');
  console.log('Options:');
  console.log('  --hooks-dir <path>  Source hooks directory (auto-detected by default)');
  console.log('  --target <path>     Target hooks directory (default: <repo>/.git/hooks)');
  console.log('  --force             Overwrite existing non-harness hook files');
  console.log('  --uninstall         Remove harness-installed hooks');
  console.log('  --help, -h          Show this message');
}

function isHarnessHook(content) {
  return content.includes(HOOK_MARKER);
}

function installHooks(options) {
  const cwd = process.cwd();
  const hooksDir = options.hooksDir
    ? path.resolve(cwd, options.hooksDir)
    : findHooksDir(cwd);

  if (!hooksDir || !fs.existsSync(hooksDir)) {
    throw new Error(
      'Could not find harness .githooks directory. Pass --hooks-dir <path> to specify it.'
    );
  }

  let targetDir;
  if (options.target) {
    targetDir = path.resolve(cwd, options.target);
  } else {
    const gitDir = findGitDir(cwd);
    if (!gitDir) {
      throw new Error('Not inside a git repository. Pass --target <path> to specify hooks dir.');
    }
    targetDir = path.join(gitDir, 'hooks');
  }

  fs.mkdirSync(targetDir, { recursive: true });

  const hookFiles = fs.readdirSync(hooksDir).filter(name => {
    const filePath = path.join(hooksDir, name);
    return fs.statSync(filePath).isFile();
  });

  if (hookFiles.length === 0) {
    console.log('No hook files found in source directory.');
    return;
  }

  const installed = [];
  const skipped = [];
  for (const hookName of hookFiles) {
    const sourcePath = path.join(hooksDir, hookName);
    const targetPath = path.join(targetDir, hookName);

    if (fs.existsSync(targetPath) && !options.force) {
      const existing = fs.readFileSync(targetPath, 'utf8');
      if (!isHarnessHook(existing)) {
        skipped.push(hookName);
        continue;
      }
    }

    const content = fs.readFileSync(sourcePath, 'utf8');
    fs.writeFileSync(targetPath, content, { mode: 0o755 });
    // Ensure executable bit on POSIX systems
    try {
      fs.chmodSync(targetPath, 0o755);
    } catch (error) {
      // chmod may fail on Windows, that's OK
    }
    installed.push(hookName);
  }

  if (installed.length > 0) {
    console.log(`Installed hooks: ${installed.join(', ')}`);
    console.log(`Target: ${path.relative(cwd, targetDir)}`);
  }
  if (skipped.length > 0) {
    console.log(
      `Skipped (existing non-harness hooks): ${skipped.join(', ')}`
    );
    console.log('Use --force to overwrite.');
  }
}

function uninstallHooks(options) {
  const cwd = process.cwd();
  let targetDir;
  if (options.target) {
    targetDir = path.resolve(cwd, options.target);
  } else {
    const gitDir = findGitDir(cwd);
    if (!gitDir) {
      throw new Error('Not inside a git repository.');
    }
    targetDir = path.join(gitDir, 'hooks');
  }

  if (!fs.existsSync(targetDir)) {
    console.log('No hooks directory found; nothing to uninstall.');
    return;
  }

  const removed = [];
  for (const name of fs.readdirSync(targetDir)) {
    const filePath = path.join(targetDir, name);
    if (!fs.statSync(filePath).isFile()) continue;
    const content = fs.readFileSync(filePath, 'utf8');
    if (isHarnessHook(content)) {
      fs.unlinkSync(filePath);
      removed.push(name);
    }
  }

  if (removed.length > 0) {
    console.log(`Removed harness hooks: ${removed.join(', ')}`);
  } else {
    console.log('No harness-installed hooks found.');
  }
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    printUsage();
    process.exit(1);
  }

  if (options.help) {
    printUsage();
    return;
  }

  try {
    if (options.uninstall) {
      uninstallHooks(options);
    } else {
      installHooks(options);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  parseArgs,
  installHooks,
  uninstallHooks,
  findGitDir,
  findHooksDir,
  isHarnessHook,
};
