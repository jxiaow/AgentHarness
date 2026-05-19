#!/usr/bin/env node

/**
 * Project entry check — configuration-driven.
 *
 * This script checks that new entry points (views, routes, pages, etc.) are
 * properly registered in the project's entry files. It loads check rules from
 * a configuration file so it stays generic and portable across projects.
 *
 * Configuration file: harness/project/entry-checks.json (or --config <path>)
 *
 * Each rule in the config defines:
 * - name: rule identifier
 * - filePattern: regex to match candidate files (relative path)
 * - excludePattern: (optional) regex to exclude certain paths
 * - registryFile: path to the file where entries should be registered
 * - registryPatterns: array of patterns to search in the registry file (uses ${name} as placeholder)
 * - contentChecks: (optional) array of content-based checks on the matched file itself
 *   - pattern: regex that triggers the issue (if matched, issue is raised)
 *   - unless: (optional) regex that suppresses the issue if also matched
 *   - message: issue message
 *   - ruleName: rule identifier for this content check
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function normalizePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function readIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function buildIssue(rule, file, message) {
  return { rule, file, message };
}

function loadConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    return null;
  }

  const content = fs.readFileSync(configPath, 'utf8');
  let config;
  try {
    config = JSON.parse(content);
  } catch (error) {
    console.error(`Failed to parse entry-checks config: ${configPath}`);
    console.error(`  ${error.message}`);
    process.exit(1);
  }

  if (!config || typeof config !== 'object') {
    console.error(`Invalid entry-checks config: ${configPath}`);
    console.error('  Config must be a JSON object with a "rules" array.');
    process.exit(1);
  }

  if (!Array.isArray(config.rules)) {
    console.error(`Invalid entry-checks config: ${configPath}`);
    console.error('  Missing or invalid "rules" field (must be an array).');
    process.exit(1);
  }

  for (let i = 0; i < config.rules.length; i += 1) {
    const rule = config.rules[i];
    if (!rule.name || typeof rule.name !== 'string') {
      console.error(`Invalid entry-checks config: ${configPath}`);
      console.error(`  rules[${i}]: missing or invalid "name" field.`);
      process.exit(1);
    }
    if (!rule.filePattern || typeof rule.filePattern !== 'string') {
      console.error(`Invalid entry-checks config: ${configPath}`);
      console.error(`  rules[${i}] (${rule.name}): missing or invalid "filePattern" field.`);
      process.exit(1);
    }
  }

  return config;
}

function resolveConfigPath(argv, baseDir) {
  const index = argv.indexOf('--config');
  if (index !== -1 && argv[index + 1]) {
    return path.resolve(baseDir, argv[index + 1]);
  }

  // Try consumer layout first, then core-local layout
  const consumerPath = path.resolve(baseDir, 'harness/project/entry-checks.json');
  if (fs.existsSync(consumerPath)) {
    return consumerPath;
  }

  return null;
}

function isEntryCheckCandidate(relativePath, config) {
  if (!config || !config.rules) {
    return false;
  }

  return config.rules.some(rule => {
    const fileRegex = new RegExp(rule.filePattern);
    if (!fileRegex.test(relativePath)) {
      return false;
    }
    if (rule.excludePattern && new RegExp(rule.excludePattern).test(relativePath)) {
      return false;
    }
    return true;
  });
}

function getEntryName(relativePath, rule) {
  if (rule.nameExtractor) {
    const match = relativePath.match(new RegExp(rule.nameExtractor));
    if (match) {
      return match[1];
    }
  }

  const ext = path.extname(relativePath);
  return path.basename(relativePath, ext);
}

function checkRegistryEntry(relativePath, baseDir, rule) {
  // Skip registry check if no registry file or patterns are defined
  if (!rule.registryFile || !rule.registryPatterns || rule.registryPatterns.length === 0) {
    return [];
  }

  const fileRegex = new RegExp(rule.filePattern);
  if (!fileRegex.test(relativePath)) {
    return [];
  }

  if (rule.excludePattern && new RegExp(rule.excludePattern).test(relativePath)) {
    return [];
  }

  const entryName = getEntryName(relativePath, rule);
  const registryPath = path.join(baseDir, rule.registryFile);
  const registryContent = readIfExists(registryPath);

  const isRegistered = rule.registryPatterns.some(pattern => {
    const resolvedPattern = pattern.replace(/\$\{name\}/g, entryName);
    return registryContent.includes(resolvedPattern);
  });

  if (isRegistered) {
    return [];
  }

  const message = (rule.message || `New entry ${entryName} must be registered in ${rule.registryFile}`)
    .replace(/\$\{name\}/g, entryName);

  return [buildIssue(rule.name, relativePath, message)];
}

function checkContentRules(relativePath, content, rule) {
  const fileRegex = new RegExp(rule.filePattern);
  if (!fileRegex.test(relativePath)) {
    return [];
  }

  if (rule.excludePattern && new RegExp(rule.excludePattern).test(relativePath)) {
    return [];
  }

  if (!rule.contentChecks) {
    return [];
  }

  const issues = [];
  for (const check of rule.contentChecks) {
    const pattern = new RegExp(check.pattern, check.flags || 's');
    if (!pattern.test(content)) {
      continue;
    }

    if (check.unless) {
      const unlessPattern = new RegExp(check.unless, check.unlessFlags || 's');
      if (unlessPattern.test(content)) {
        continue;
      }
    }

    issues.push(buildIssue(check.ruleName || rule.name, relativePath, check.message));
  }

  return issues;
}

function checkFile(filePath, baseDir, config) {
  const relativePath = normalizePath(path.relative(baseDir, filePath));
  const content = readIfExists(filePath);
  const issues = [];

  if (!config || !config.rules) {
    return issues;
  }

  for (const rule of config.rules) {
    issues.push(...checkRegistryEntry(relativePath, baseDir, rule));
    issues.push(...checkContentRules(relativePath, content, rule));
  }

  return issues;
}

function parseFiles(argv) {
  const filesIndex = argv.indexOf('--files');
  if (filesIndex === -1) {
    return [];
  }

  const files = [];
  for (let index = filesIndex + 1; index < argv.length; index += 1) {
    const value = argv[index];
    if (value.startsWith('--')) {
      break;
    }
    files.push(value);
  }

  return files;
}

function parseMaxIssues(argv) {
  const index = argv.indexOf('--max-issues');
  if (index === -1) {
    return 5;
  }

  const value = Number.parseInt(argv[index + 1], 10);
  return Number.isFinite(value) && value > 0 ? value : 5;
}

function parseReportPath(argv) {
  const index = argv.indexOf('--report');
  if (index === -1) {
    return null;
  }

  return argv[index + 1] || null;
}

function hasSummary(argv) {
  return argv.includes('--summary');
}

function collectGitChangedFiles(baseDir, mode) {
  const args = ['diff', '--name-only', '--diff-filter=ACMR'];
  if (mode === 'staged') {
    args.splice(1, 0, '--cached');
  }

  const result = spawnSync('git', args, { cwd: baseDir, encoding: 'utf8' });
  if (result.status !== 0) {
    return [];
  }

  const trackedFiles = result.stdout
    .split(/\r?\n/)
    .map(file => file.trim())
    .filter(Boolean);

  if (mode === 'staged') {
    return trackedFiles;
  }

  const untrackedResult = spawnSync('git', ['ls-files', '--others', '--exclude-standard'], {
    cwd: baseDir,
    encoding: 'utf8',
  });
  if (untrackedResult.status !== 0) {
    return trackedFiles;
  }

  const untrackedFiles = untrackedResult.stdout
    .split(/\r?\n/)
    .map(file => file.trim())
    .filter(Boolean);

  return [...new Set([...trackedFiles, ...untrackedFiles])];
}

function resolveTargetFiles(argv, baseDir) {
  const explicitFiles = parseFiles(argv);
  if (explicitFiles.length > 0) {
    return explicitFiles;
  }

  if (argv.includes('--staged')) {
    return collectGitChangedFiles(baseDir, 'staged');
  }

  if (argv.includes('--changed')) {
    return collectGitChangedFiles(baseDir, 'changed');
  }

  return [];
}

function printUsage() {
  console.log(
    'Usage: node harness/core/automation/check-entry.js --files <changed-file> [...]'
  );
  console.log('Usage: node harness/core/automation/check-entry.js --changed');
  console.log('Usage: node harness/core/automation/check-entry.js --staged');
  console.log('Usage: node harness/core/automation/check-entry.js --init');
  console.log('Option: --config <path> specify entry-checks config file');
  console.log('Option: --max-issues <n> limit issue output count, default 5');
  console.log('Option: --summary only output counts aggregated by rule');
  console.log(
    'Example: node harness/core/automation/check-entry.js --files src/views/Foo.vue'
  );
}

function printIssues(issues, maxIssues) {
  const visibleIssues = issues.slice(0, maxIssues);
  for (const issue of visibleIssues) {
    console.log(`${issue.file}`);
    console.log(`  rule: ${issue.rule}`);
    console.log(`  message: ${issue.message}\n`);
  }

  const hiddenCount = issues.length - visibleIssues.length;
  if (hiddenCount > 0) {
    console.log(`Another ${hiddenCount} issue(s) not shown; use --max-issues to adjust.`);
  }
}

function printSummary(issues) {
  const counts = new Map();
  for (const issue of issues) {
    counts.set(issue.rule, (counts.get(issue.rule) || 0) + 1);
  }

  for (const [rule, count] of counts.entries()) {
    console.log(`${rule}: ${count}`);
  }
}

function writeReport(reportPath, payload) {
  if (!reportPath) {
    return;
  }

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Detailed report: ${reportPath}`);
}

function run(argv, options = {}) {
  const baseDir = options.baseDir || process.cwd();
  const configPath = resolveConfigPath(argv, baseDir);
  const config = configPath ? loadConfig(configPath) : null;

  if (!config) {
    return { files: [], issues: [], noConfig: true };
  }

  const relativeFiles = resolveTargetFiles(argv, baseDir);
  const files = relativeFiles
    .map(file => path.resolve(baseDir, file))
    .filter(file => fs.existsSync(file))
    .filter(file => isEntryCheckCandidate(normalizePath(path.relative(baseDir, file)), config));
  const issues = files.flatMap(file => checkFile(file, baseDir, config));

  return { files, issues, noConfig: false };
}

function initConfig(baseDir) {
  const targetDir = path.resolve(baseDir, 'harness/project');
  const targetPath = path.join(targetDir, 'entry-checks.json');

  if (fs.existsSync(targetPath)) {
    console.log(`Config already exists: ${path.relative(baseDir, targetPath)}`);
    return;
  }

  const template = {
    rules: [
      {
        name: 'example-view-entry',
        filePattern: '^src/views/.+\\.vue$',
        nameExtractor: '/([^/]+)\\.vue$',
        registryFile: 'src/router/index.js',
        registryPatterns: ['${name}', 'views/${name}.vue'],
        message: 'New view ${name} must be registered in src/router/index.js',
      },
    ],
  };

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(targetPath, `${JSON.stringify(template, null, 2)}\n`, 'utf8');
  console.log(`Created entry-checks config: ${path.relative(baseDir, targetPath)}`);
  console.log('Edit the rules array to match your project structure.');
}

function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  if (process.argv.includes('--init')) {
    initConfig(process.cwd());
    process.exit(0);
  }

  const argv = process.argv.slice(2);
  const { files, issues, noConfig } = run(argv);

  if (noConfig) {
    console.log('No entry check config found (skipping entry checks)');
    process.exit(0);
  }

  const maxIssues = parseMaxIssues(argv);
  const summary = hasSummary(argv);
  const reportPath = parseReportPath(argv);

  if (files.length === 0) {
    if (argv.includes('--changed') || argv.includes('--staged') || parseFiles(argv).length > 0) {
      console.log('No entry check issues found (no checkable changed files)');
      process.exit(0);
    }

    printUsage();
    process.exit(1);
  }

  if (issues.length === 0) {
    console.log(`No entry check issues found (scanned ${files.length} files)`);
    process.exit(0);
  }

  console.log(`Found ${issues.length} entry check issue(s):\n`);
  if (summary) {
    printSummary(issues);
  } else {
    printIssues(issues, maxIssues);
  }
  writeReport(reportPath, { filesScanned: files.length, issues });

  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = {
  main,
  run,
  checkFile,
  collectGitChangedFiles,
  isEntryCheckCandidate,
  loadConfig,
  resolveConfigPath,
  initConfig,
  parseMaxIssues,
  parseReportPath,
  hasSummary,
};
