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

function resolveReportPath(argv) {
  const args = resolveReportArgs(argv);
  const index = args.indexOf('--report');
  return index === -1 ? null : args[index + 1];
}

function childReportPath(reportPath, label) {
  if (!reportPath) return null;
  const parsed = path.parse(reportPath);
  return path.join(parsed.dir, `${parsed.name}.${label}${parsed.ext || '.json'}`);
}

function reportArgsFor(reportPath, label) {
  const childPath = childReportPath(reportPath, label);
  return childPath ? ['--report', childPath] : [];
}

function readReport(reportPath) {
  if (!reportPath || !fs.existsSync(reportPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
}

function writeCombinedReport(reportPath, reports) {
  if (!reportPath) {
    return;
  }

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify({ checks: reports }, null, 2)}\n`, 'utf8');
  console.log(`Combined report: ${reportPath}`);
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

function printUsage() {
  console.log('Usage: node harness/core/automation/check-harness.js [options] [paths...]');
  console.log('');
  console.log('Runs both check-process.js and check-entry.js sequentially.');
  console.log('');
  console.log('Options:');
  console.log('  --changed         Check files in working tree diff (default if no paths given)');
  console.log('  --staged          Check files in staged diff');
  console.log('  --summary         Output rule counts only');
  console.log('  --max-issues <n>  Limit issue output count (default 5)');
  console.log('  --report <path>   Write detailed JSON report (default .tmp/harness-check-report.json)');
  console.log('  --help, -h        Show this message');
  console.log('');
  console.log('Examples:');
  console.log('  node harness/core/automation/check-harness.js --changed --summary');
  console.log('  node harness/core/automation/check-harness.js --staged --max-issues 10');
  console.log('  node harness/core/automation/check-harness.js docs templates');
}

function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const layout = resolveHarnessLayout();
  const argv = process.argv.slice(2);
  const explicitTargets = argv.includes('--staged') ? [] : resolveExplicitTargets(argv);
  const mode = resolveMode(argv);
  const maxIssueArgs = resolveMaxIssueArgs(argv);
  const summaryArgs = resolveSummaryArgs(argv);
  const reportPath = resolveReportPath(argv);

  const processArgs =
    explicitTargets.length > 0
      ? [...explicitTargets, ...summaryArgs, ...maxIssueArgs, ...reportArgsFor(reportPath, 'process')]
      : [mode, ...summaryArgs, ...maxIssueArgs, ...reportArgsFor(reportPath, 'process')];

  const entryArgs =
    explicitTargets.length > 0
      ? ['--files', ...explicitTargets, ...summaryArgs, ...maxIssueArgs, ...reportArgsFor(reportPath, 'entry')]
      : [mode, ...summaryArgs, ...maxIssueArgs, ...reportArgsFor(reportPath, 'entry')];

  const checks = [
    ['process', layout.processScript, processArgs],
    ['entry', layout.entryScript, entryArgs],
  ];

  let hasFailure = false;
  const reports = {};
  for (const [label, script, args] of checks) {
    const status = runNodeScript(layout.rootDir, script, args);
    const childPath = childReportPath(reportPath, label);
    reports[label] = {
      status,
      ...(readReport(childPath) || { filesScanned: 0, issues: [] }),
    };
    if (status !== 0) {
      hasFailure = true;
    }
  }
  writeCombinedReport(reportPath, reports);

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
  printUsage,
  resolveMode,
  resolveMaxIssueArgs,
  resolveSummaryArgs,
  resolveReportArgs,
  resolveReportPath,
  childReportPath,
  resolveExplicitTargets,
  resolveHarnessLayout,
  runNodeScript,
};
