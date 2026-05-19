#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const excludedDirs = new Set(['node_modules', 'dist', 'target', '.git']);

function normalizePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function isMarkdownFile(filePath) {
  return filePath.endsWith('.md');
}

function collectMarkdownFiles(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return [];
  }

  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    return isMarkdownFile(targetPath) ? [targetPath] : [];
  }

  if (!stat.isDirectory()) {
    return [];
  }

  const files = [];
  const entries = fs.readdirSync(targetPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && excludedDirs.has(entry.name)) {
      continue;
    }

    const childPath = path.join(targetPath, entry.name);
    files.push(...collectMarkdownFiles(childPath));
  }

  return files;
}

function hasAny(content, patterns) {
  return patterns.some(pattern => pattern.test(content));
}

function buildIssue(rule, file, message) {
  return { rule, file, message };
}

function hasFinalCloseoutMarker(content) {
  return /^#{0,6}\s*final closeout\s*$/im.test(content);
}

function checkFinalCloseoutEvidence(relativePath, content) {
  if (!hasFinalCloseoutMarker(content)) {
    return [];
  }

  const missing = [];
  if (!hasAny(content, [/结果[:：]/, /已完成[:：]/, /[Rr]esult[:：]/])) {
    missing.push('missing result');
  }
  if (!hasAny(content, [/验证[:：]/, /已验证[:：]/, /最近一次关键验证命令/, /[Vv]erif/])) {
    missing.push('missing verification');
  }
  if (!hasAny(content, [/未验证[:：]/, /未验证项/, /[Uu]nverified/])) {
    missing.push('missing unverified');
  }
  if (!hasAny(content, [/风险[:：]/, /剩余风险/, /[Rr]isk[:：]/])) {
    missing.push('missing risk');
  }

  if (missing.length === 0) {
    return [];
  }

  return [
    buildIssue(
      'final-closeout-evidence',
      relativePath,
      `final closeout missing evidence anchors: ${missing.join(', ')}`
    ),
  ];
}

function checkInProgressFinalCloseout(relativePath, content) {
  if (!hasFinalCloseoutMarker(content)) {
    return [];
  }

  if (!/\bin_progress\b|进行中/.test(content)) {
    return [];
  }

  return [
    buildIssue(
      'in-progress-final-closeout',
      relativePath,
      'Cannot output final closeout while in in_progress state'
    ),
  ];
}

function checkFinalCloseoutNextStep(relativePath, content) {
  if (!hasFinalCloseoutMarker(content)) {
    return [];
  }

  if (!/下一步[:：]|next step[:：]/i.test(content)) {
    return [];
  }

  if (/阻塞[:：]|需要用户授权|缺关键输入|真实阻塞|等待授权|blocked/i.test(content)) {
    return [];
  }

  return [
    buildIssue(
      'final-closeout-next-step',
      relativePath,
      'final closeout should not add non-blocking next-step suggestions; continue executing when actionable items exist'
    ),
  ];
}

function checkFinalCloseoutActionableRisk(relativePath, content) {
  if (!hasFinalCloseoutMarker(content)) {
    return [];
  }

  if (/阻塞[:：]|需要用户授权|缺关键输入|真实阻塞|等待授权|blocked/i.test(content)) {
    return [];
  }

  const riskLines = content
    .split(/\r?\n/)
    .filter(line => /风险[:：]|剩余风险/.test(line))
    .join('\n');
  if (
    !/(可继续|继续(修|处理|推进|优化|验证)|可修|可处理|可优化|可验证|还能|还可以|待修|待处理|待优化|后续可以|下一步)/i.test(
      riskLines
    )
  ) {
    return [];
  }

  return [
    buildIssue(
      'final-closeout-actionable-risk',
      relativePath,
      'final closeout must not package actionable items as residual risk; continue executing or explain real blocker'
    ),
  ];
}

function checkFinalCloseoutRiskBoilerplate(relativePath, content) {
  if (!hasFinalCloseoutMarker(content)) {
    return [];
  }

  const hasNoUnverified = /未验证[:：]\s*(无|无未验证|none|n\/a)(?:\s|$)/i.test(content) || /[Uu]nverified[:：]\s*(none|n\/a|no unverified)(?:\s|$)/i.test(content);
  const hasNoRisk = /风险[:：]\s*(无|无风险|未发现新的剩余风险|none|n\/a)(?:\s|$)/i.test(content) || /[Rr]isk[:：]\s*(none|n\/a|no risk|no new risk)(?:\s|$)/i.test(content);
  if (!hasNoUnverified || !hasNoRisk) {
    return [];
  }

  return [
    buildIssue(
      'final-closeout-risk-boilerplate',
      relativePath,
      'When no unverified items and no real risk exist, do not output boilerplate risk text for formatting'
    ),
  ];
}

function checkFinalCloseoutNextStepConflict(relativePath, content) {
  if (!/final closeout/i.test(content)) {
    return [];
  }

  if (
    !/(final closeout|收口)[^\n。；;]*(必须|默认应|默认必须|至少)[^\n。；;]*(下一步|next step)/i.test(
      content
    )
  ) {
    return [];
  }

  return [
    buildIssue(
      'final-closeout-next-step-conflict',
      relativePath,
      '不要把“下一步”写成 final closeout 的必填项；未完成时继续执行或记录阻塞'
    ),
  ];
}

function checkGateOutputOneLine(relativePath, content) {
  const issues = [];
  const gatePattern = /\b(Scope|Plan|Build|Close|Git)\s+gate\s*[:：]/g;
  const taskTypePattern = /任务类型\s*[:：]|[Tt]ask\s+[Tt]ype\s*[:：]/;
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const matches = line.match(gatePattern) || [];
    if (matches.length < 2 && !(taskTypePattern.test(line) && matches.length > 0)) {
      return;
    }

    issues.push(
      buildIssue(
        'gate-output-one-line',
        relativePath,
        `Line ${index + 1} contains task type or gate outputs crammed together; task type and different gates must be separated by newlines`
      )
    );
  });

  return issues;
}

function checkLongRunningPlan(relativePath, content) {
  if (!/任务尺寸[:：]\s*`?long-running`?|Size[:：]\s*`?long-running`?/i.test(content)) {
    return [];
  }

  const missing = [];
  if (!/- \[[ x-]\]/.test(content)) {
    missing.push('missing stage-level checklist');
  }
  if (!/执行顺序|阶段顺序|[Ee]xecution\s+[Oo]rder|[Ss]tage\s+[Oo]rder/.test(content)) {
    missing.push('missing execution order');
  }
  if (!/当前工作包|第一工作包|current work package/i.test(content)) {
    missing.push('missing current work package');
  }

  if (missing.length === 0) {
    return [];
  }

  return [
    buildIssue(
      'long-running-plan',
      relativePath,
      `long-running task missing stage plan fields: ${missing.join(', ')}`
    ),
  ];
}

function checkOperationDocLocation(relativePath, content) {
  const normalized = normalizePath(relativePath);
  if (!normalized.startsWith('docs/development/')) {
    return [];
  }

  if (normalized.startsWith('docs/development/changes/')) {
    return [];
  }

  const fileName = path.basename(normalized).toLowerCase();
  const fileNameLooksLikeOperationDoc =
    /(^|[-_])(board|matrix|decisions)(\.md)$/.test(fileName) || /^current-.*\.md$/.test(fileName);
  const contentLooksLikeOperationDoc =
    /运行态文档|运行态执行板|验证矩阵|决策记录|当前状态|工作包|阻塞项|完成标准|验证方式|[Ee]xecution [Bb]oard|[Vv]erification [Mm]atrix|[Dd]ecision [Ll]og|[Ww]ork [Pp]ackage/.test(
      content
    ) || /^- \[[ x-]\]/m.test(content);
  const looksLikeOperationDoc =
    /^current-.*\.md$/.test(fileName) ||
    /运行态文档|运行态执行板|验证矩阵|决策记录|[Ee]xecution [Bb]oard|[Vv]erification [Mm]atrix|[Dd]ecision [Ll]og/.test(content) ||
    (fileNameLooksLikeOperationDoc && contentLooksLikeOperationDoc);

  if (!looksLikeOperationDoc) {
    return [];
  }

  return [
    buildIssue(
      'operation-doc-location',
      relativePath,
      'Operations board, verification matrix, and decision log should be in docs/operations/'
    ),
  ];
}

function checkCloseoutTargetTypes(relativePath, content) {
  const normalized = normalizePath(relativePath);
  // Only check in consumer layout where harness/core/README.md is the process README.
  // In the core repo itself, README.md is the project introduction (not a process doc).
  if (normalized !== 'harness/core/README.md') {
    return [];
  }

  const required = ['single-task', 'staged/ongoing', 'continuation', 'explicit-closeout'];
  const missing = required.filter(item => !content.includes(item));
  if (missing.length === 0) {
    return [];
  }

  return [
    buildIssue(
      'closeout-target-types',
      relativePath,
      `README missing final closeout target types: ${missing.join(', ')}`
    ),
  ];
}

function checkCloseGateContinuation(relativePath, content) {
  const normalized = normalizePath(relativePath);
  // Match both consumer layout and core-local layout
  if (normalized !== 'harness/core/gates/close-gate.md' && normalized !== 'gates/close-gate.md') {
    return [];
  }

  const missing = [];
  if (
    !/continuation/.test(content) ||
    !/继续\s*\/\s*开始\s*\/\s*接着做\s*\/\s*按计划执行|continue\s*\/\s*start\s*\//.test(content)
  ) {
    missing.push('missing continuation inheritance rule');
  }
  if (!/执行板|board/i.test(content) || !/checklist/.test(content)) {
    missing.push('missing board/checklist closeout confirmation');
  }
  if (!/工作包完成当最终完成|工作包完成当作最终完成|仅完成一个工作包|single work package.*final|work package completion.*final|one work package.*final completion|treat one work package as final completion/.test(content)) {
    missing.push('missing rule forbidding single work package false closeout');
  }

  if (missing.length === 0) {
    return [];
  }

  return [
    buildIssue(
      'close-gate-continuation',
      relativePath,
      `Close gate missing continuation closeout constraints: ${missing.join(', ')}`
    ),
  ];
}

function checkProfilePathReferences(relativePath, content, baseDir) {
  const normalized = normalizePath(relativePath);
  // Only check profile.md files in harness/project/ or root
  if (
    normalized !== 'harness/project/profile.md' &&
    normalized !== 'profile.md'
  ) {
    return [];
  }

  // Extract paths from inline code blocks (`path/to/file`) that look like file paths
  // A "path" here means: contains a slash AND ends with a known extension OR has no extension and looks like a directory
  const pathPattern = /`([a-zA-Z0-9_./-]+\/[a-zA-Z0-9_./-]+)`/g;
  const referencedPaths = new Set();
  let match;
  while ((match = pathPattern.exec(content)) !== null) {
    const candidate = match[1];
    // Skip anything that looks like a URL fragment, glob, or template placeholder
    if (candidate.includes('*') || candidate.includes('<') || candidate.includes('>')) {
      continue;
    }
    referencedPaths.add(candidate);
  }

  const issues = [];
  for (const refPath of referencedPaths) {
    const fullPath = path.resolve(baseDir, refPath);
    if (!fs.existsSync(fullPath)) {
      issues.push(
        buildIssue(
          'profile-stale-path',
          relativePath,
          `referenced path does not exist: ${refPath}`
        )
      );
    }
  }

  return issues;
}

function checkScopeGateQuality(relativePath, content) {
  // Skip template/doc/example files
  const normalized = normalizePath(relativePath);
  if (
    normalized.startsWith('gates/') ||
    normalized.startsWith('harness/core/gates/') ||
    normalized.startsWith('templates/') ||
    normalized.startsWith('harness/core/templates/') ||
    normalized.startsWith('docs/') ||
    normalized.startsWith('harness/core/docs/') ||
    normalized.startsWith('examples/') ||
    normalized.startsWith('harness/core/examples/') ||
    normalized.endsWith('AGENTS.template.md') ||
    normalized.endsWith('AGENTS.md') ||
    normalized.endsWith('README.md') ||
    normalized.endsWith('README.zh-CN.md')
  ) {
    return [];
  }

  // Match Scope gate at start of line
  if (!/^\s*Scope\s+gate\s*$/im.test(content)) {
    return [];
  }

  // Extract the Scope gate section (from "Scope gate" to the next gate or heading)
  const scopeMatch = content.match(/^\s*Scope\s+gate\s*\r?\n([\s\S]*?)(?=^\s*(?:Plan|Build|Close|Git)\s+gate|^#|\Z)/im);
  if (!scopeMatch) {
    return [];
  }

  const scopeContent = scopeMatch[1];
  // Count distinct field lines (lines starting with "- " that contain a colon or are substantive)
  const fieldLines = scopeContent.split(/\r?\n/).filter(line => /^\s*-\s+\S/.test(line));

  if (fieldLines.length >= 3) {
    return [];
  }

  return [
    buildIssue(
      'scope-gate-quality',
      relativePath,
      `Scope gate has only ${fieldLines.length} field(s); minimum 3 required (goal, approach, and at least one of: boundary/risk/verification)`
    ),
  ];
}

function checkCloseGateRequiresScope(relativePath, content) {
  // Check that if a Close gate is present, a Scope gate is also present.
  // Skip files that are gate templates / process docs themselves.
  const normalized = normalizePath(relativePath);
  if (
    normalized.startsWith('gates/') ||
    normalized.startsWith('harness/core/gates/') ||
    normalized.startsWith('templates/') ||
    normalized.startsWith('harness/core/templates/') ||
    normalized.startsWith('docs/') ||
    normalized.startsWith('harness/core/docs/') ||
    normalized.startsWith('examples/') ||
    normalized.startsWith('harness/core/examples/') ||
    normalized.endsWith('AGENTS.template.md') ||
    normalized.endsWith('AGENTS.md') ||
    normalized.endsWith('README.md') ||
    normalized.endsWith('README.zh-CN.md')
  ) {
    return [];
  }

  // Match Close gate at the start of a line (actual gate output, not prose mention)
  if (!/^\s*Close\s+gate\s*$|^\s*Close\s+gate\s*[:：]/im.test(content)) {
    return [];
  }

  // Match Scope gate at the start of a line
  const hasScope = /^\s*Scope\s+gate\s*$|^\s*Scope\s+gate\s*[:：]/im.test(content);

  if (hasScope) {
    return [];
  }

  return [
    buildIssue(
      'close-without-scope',
      relativePath,
      'Close gate present without prior Scope gate'
    ),
  ];
}

function checkFile(filePath, baseDir) {
  const relativePath = normalizePath(path.relative(baseDir, filePath));
  const content = fs.readFileSync(filePath, 'utf8');

  return [
    ...checkFinalCloseoutEvidence(relativePath, content),
    ...checkInProgressFinalCloseout(relativePath, content),
    ...checkFinalCloseoutNextStep(relativePath, content),
    ...checkFinalCloseoutActionableRisk(relativePath, content),
    ...checkFinalCloseoutRiskBoilerplate(relativePath, content),
    ...checkFinalCloseoutNextStepConflict(relativePath, content),
    ...checkGateOutputOneLine(relativePath, content),
    ...checkLongRunningPlan(relativePath, content),
    ...checkOperationDocLocation(relativePath, content),
    ...checkCloseoutTargetTypes(relativePath, content),
    ...checkCloseGateContinuation(relativePath, content),
    ...checkProfilePathReferences(relativePath, content, baseDir),
    ...checkScopeGateQuality(relativePath, content),
    ...checkCloseGateRequiresScope(relativePath, content),
  ];
}

function printUsage() {
  console.log('Usage: node harness/core/automation/check-process.js <file-or-dir> [...]');
  console.log('Usage: node harness/core/automation/check-process.js --changed');
  console.log('Usage: node harness/core/automation/check-process.js --staged');
  console.log('Option: --max-issues <n> limit issue output count, default 5');
  console.log('Option: --summary only output counts aggregated by rule');
  console.log(
    'Example: node harness/core/automation/check-process.js AGENTS.md harness/core docs'
  );
  console.log('');
  console.log('Default scan scope (no args): AGENTS.md, harness/core/, harness/project/, docs/');
  console.log('--changed scans all .md files in the working tree diff (including untracked)');
  console.log('--staged scans only .md files in the staged diff');
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
    .filter(file => isMarkdownFile(file));

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
    .filter(file => isMarkdownFile(file));

  return [...new Set([...trackedFiles, ...untrackedFiles])];
}

function parseTargets(argv) {
  const targets = [];
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--max-issues') {
      index += 1;
      continue;
    }

    if (value === '--report') {
      index += 1;
      continue;
    }

    if (value === '--summary') {
      continue;
    }

    if (value === '--changed' || value === '--staged') {
      continue;
    }

    if (!value.startsWith('--')) {
      targets.push(value);
    }
  }

  return targets;
}

function writeReport(reportPath, payload) {
  if (!reportPath) {
    return;
  }

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Detailed report: ${reportPath}`);
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

function run(argv, options = {}) {
  const baseDir = options.baseDir || process.cwd();
  const parsedTargets = parseTargets(argv);
  let files;
  if (parsedTargets.length > 0) {
    files = parsedTargets.flatMap(target => collectMarkdownFiles(path.resolve(baseDir, target)));
  } else if (argv.includes('--staged')) {
    files = collectGitChangedFiles(baseDir, 'staged').map(file => path.resolve(baseDir, file));
  } else if (argv.includes('--changed')) {
    files = collectGitChangedFiles(baseDir, 'changed').map(file => path.resolve(baseDir, file));
  } else {
    files = ['AGENTS.md', 'harness/core', 'harness/project', 'docs'].flatMap(target =>
      collectMarkdownFiles(path.resolve(baseDir, target))
    );
  }
  const issues = files.flatMap(file => checkFile(file, baseDir));

  return { files, issues };
}

function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const { files, issues } = run(process.argv.slice(2));
  const maxIssues = parseMaxIssues(process.argv.slice(2));
  const summary = hasSummary(process.argv.slice(2));
  const reportPath = parseReportPath(process.argv.slice(2));

  if (issues.length === 0) {
    console.log(`No process check issues found (scanned ${files.length} Markdown files)`);
    process.exit(0);
  }

  console.log(`Found ${issues.length} process check issue(s):\n`);
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
  collectMarkdownFiles,
  collectGitChangedFiles,
  parseMaxIssues,
  parseReportPath,
  hasSummary,
};
