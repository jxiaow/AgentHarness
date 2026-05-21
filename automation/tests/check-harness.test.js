import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import { afterEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { resolveHarnessLayout } = require('../check-harness.js');
const scriptPath = path.resolve('automation/check-harness.js');

let tempDir;

function writeFile(relativePath) {
  const filePath = path.join(tempDir, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, '#!/usr/bin/env node\n', 'utf8');
  return filePath;
}

describe('check-harness layout resolution', () => {
  afterEach(() => {
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      tempDir = null;
    }
  });

  it('resolves scripts in the core repository checkout', () => {
    const layout = resolveHarnessLayout(path.resolve('automation'));

    expect(layout.rootDir).toBe(path.resolve('.'));
    expect(layout.processScript).toBe(path.join('automation', 'check-process.js'));
    expect(layout.entryScript).toBe(path.join('automation', 'check-entry.js'));
  });

  it('resolves scripts when installed as harness/core in a consumer repository', () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-layout-'));
    const automationDir = path.join(tempDir, 'harness', 'core', 'automation');
    writeFile('harness/core/automation/check-process.js');
    writeFile('harness/core/automation/check-entry.js');

    const layout = resolveHarnessLayout(automationDir);

    expect(layout.rootDir).toBe(tempDir);
    expect(layout.processScript).toBe(path.join('harness', 'core', 'automation', 'check-process.js'));
    expect(layout.entryScript).toBe(path.join('harness', 'core', 'automation', 'check-entry.js'));
  });

  it('falls back to consumer root with warning when scripts are not found', () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-layout-'));
    const automationDir = path.join(tempDir, 'some', 'nested', 'automation');
    fs.mkdirSync(automationDir, { recursive: true });

    const warnSpy = [];
    const originalWarn = console.warn;
    console.warn = (...args) => warnSpy.push(args.join(' '));

    const layout = resolveHarnessLayout(automationDir);

    console.warn = originalWarn;

    expect(warnSpy.length).toBe(1);
    expect(warnSpy[0]).toContain('Warning');
    expect(layout.processScript).toBe(path.join('harness', 'core', 'automation', 'check-process.js'));
  });

  it('prints usage with --help', () => {
    const result = require('child_process').spawnSync(
      process.execPath,
      [scriptPath, '--help'],
      { encoding: 'utf8' }
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Usage:');
    expect(result.stdout).toContain('--changed');
    expect(result.stdout).toContain('--staged');
    expect(result.stdout).toContain('--summary');
  });

  it('keeps process and entry details in the combined report', () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-report-'));
    const automationDir = path.join(tempDir, 'automation');
    fs.mkdirSync(automationDir, { recursive: true });
    const tempHarnessScript = path.join(automationDir, 'check-harness.js');
    fs.copyFileSync(scriptPath, tempHarnessScript);
    fs.writeFileSync(
      path.join(automationDir, 'check-process.js'),
      `#!/usr/bin/env node
const fs = require('fs');
const reportIndex = process.argv.indexOf('--report');
if (reportIndex !== -1) {
  fs.mkdirSync(require('path').dirname(process.argv[reportIndex + 1]), { recursive: true });
  fs.writeFileSync(process.argv[reportIndex + 1], JSON.stringify({ filesScanned: 1, issues: [{ rule: 'process-rule', file: 'a.md' }] }));
}
process.exit(1);
`,
      'utf8'
    );
    fs.writeFileSync(
      path.join(automationDir, 'check-entry.js'),
      `#!/usr/bin/env node
const fs = require('fs');
const reportIndex = process.argv.indexOf('--report');
if (reportIndex !== -1) {
  fs.mkdirSync(require('path').dirname(process.argv[reportIndex + 1]), { recursive: true });
  fs.writeFileSync(process.argv[reportIndex + 1], JSON.stringify({ filesScanned: 1, issues: [{ rule: 'entry-rule', file: 'b.js' }] }));
}
process.exit(1);
`,
      'utf8'
    );

    const reportPath = path.join(tempDir, 'report.json');
    const result = require('child_process').spawnSync(
      process.execPath,
      [tempHarnessScript, '--changed', '--report', reportPath],
      { cwd: tempDir, encoding: 'utf8' }
    );

    expect(result.status).toBe(1);
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    expect(report.checks.process.issues[0].rule).toBe('process-rule');
    expect(report.checks.entry.issues[0].rule).toBe('entry-rule');
  });
});
