#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const defaultReportPath = '.tmp/harness-check-report.json';

function hasHarnessScripts(rootDir, processScript, entryScript) {
  return fs.existsSync(path.join(rootDir, processScript)) && fs.existsSync(path.join(rootDir, entryScript));
}

function resolveHarnessLayout(automationDir = __dirname) {
  const consumerRoot = path.resolve(automationDir, '../../..');
  const consumerProcessScript = path.join('harness', 'core', 'automation', 'check-process.js');
  const consumerEntryScript = path.join('harness', 'core', 'automation', 'check-entry.js');
  if (hasHarnessScripts(consumerRoot, consumerProcessScript, consumerEntryScript)) {
    return {
      rootDir: consumerRoot,
      processScript: consumerProcessScript,
      entryScript: consumerEntryScript,
    };
  }

  const coreRoot = path.resolve(automationDir, '..');
  const coreProcessScript = path.join('automation', 'check-process.js');
  const coreEntryScript = path.join('automation', 'check-entry.js');
  if (hasHarnessScripts(coreRoot, coreProcessScript, coreEntryScript)) {
    return {
      rootDir: coreRoot,
      processScript: coreProcessScript,
      entryScript: coreEntryScript,
    };
  }

  console.warn(
    `Warning: could not locate harness scripts in expected layout; falling back to consumer root: ${consumerRoot}`
  );
  return {
    rootDir: consumerRoot,
    processScript: consumerProcessScript,
    entryScript: consumerEntryScript,
  };
}

function runNodeScript(rootDir, scriptPath, args = []) {
  const commandLabel = ['node', scriptPath, ...args].join(' ');
  console.log(`> ${commandLabel}`);

  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: rootDir,
    encoding: 'utf8',
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  return result.status || 0;
}

function resolveMode(argv) {
  return argv.includes('--staged') ? '--staged' : '--changed';
}

function resolveMaxIssueArgs(argv) {
  const index = argv.indexOf('--max-issues');
  if (index === -1) return [];
  const value = argv[index + 1];
  return value ? ['--max-issues', value] : [];
}

function resolveSummaryArgs(argv) {
  return argv.includes('--summary') ? ['--summary'] : [];
}

function resolveReportArgs(argv) {
  const index = argv.indexOf('--report');
  if (index !== -1) {
    const value = argv[index + 1];
    return value ? ['--report', value] : [];
  }
  return ['--report', defaultReportPath];
}

function resolveExplicitTargets(argv) {
  const targets = [];
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--max-issues' || value === '--report') {
      index += 1;
      continue;
    }
    if (value === '--summary' || value === '--changed' || value === '--staged') continue;
    if (!value.startsWith('--')) targets.push(value);
  }
  return targets;
}

function main() {
  const layout = resolveHarnessLayout();
  const argv = process.argv.slice(2);
  const explicitTargets = argv.includes('--staged') ? [] : resolveExplicitTargets(argv);
  const mode = resolveMode(argv);
  const maxIssueArgs = resolveMaxIssueArgs(argv);
  const summaryArgs = resolveSummaryArgs(argv);
  const reportArgs = resolveReportArgs(argv);

  const processArgs =
    explicitTargets.length > 0
      ? [...explicitTargets, ...summaryArgs, ...maxIssueArgs, ...reportArgs]
      : [mode, ...summaryArgs, ...maxIssueArgs, ...reportArgs];

  const entryArgs =
    explicitTargets.length > 0
      ? ['--files', ...explicitTargets, ...summaryArgs, ...maxIssueArgs, ...reportArgs]
      : [mode, ...summaryArgs, ...maxIssueArgs, ...reportArgs];

  const checks = [
    [layout.processScript, processArgs],
    [layout.entryScript, entryArgs],
  ];

  let hasFailure = false;
  for (const [script, args] of checks) {
    const status = runNodeScript(layout.rootDir, script, args);
    if (status !== 0) {
      hasFailure = true;
    }
  }

  if (hasFailure) {
    process.exit(1);
  }

  console.log('harness checks passed');
}

if (require.main === module) {
  main();
}

module.exports = {
  main,
  resolveMode,
  resolveMaxIssueArgs,
  resolveSummaryArgs,
  resolveReportArgs,
  resolveExplicitTargets,
  resolveHarnessLayout,
  runNodeScript,
};
