import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const scriptPath = path.resolve('automation/check-entry.js');

let tempDir;

function writeFixture(relativePath, content) {
  const filePath = path.join(tempDir, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

function writeConfig(config) {
  return writeFixture('harness/project/entry-checks.json', JSON.stringify(config, null, 2));
}

function runCheck(...args) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: tempDir,
    encoding: 'utf8',
  });
}

describe('check-entry script', () => {
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'entry-checks-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('exits cleanly when no config file exists', () => {
    writeFixture('src/views/Foo.vue', '<template><div>Foo</div></template>');

    const result = runCheck('--files', 'src/views/Foo.vue');

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('No entry check config found');
  });

  it('detects missing registry entry based on config', () => {
    writeConfig({
      rules: [
        {
          name: 'view-router-entry',
          filePattern: '^src/views/.+\\.vue$',
          nameExtractor: '/([^/]+)\\.vue$',
          registryFile: 'src/router/index.js',
          registryPatterns: ['${name}', 'views/${name}.vue'],
          message: 'New view ${name} must be registered in src/router/index.js',
        },
      ],
    });
    writeFixture('src/views/Dashboard.vue', '<template><div>Dashboard</div></template>');
    writeFixture('src/router/index.js', 'export default []');

    const result = runCheck('--files', 'src/views/Dashboard.vue');

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('view-router-entry');
    expect(result.stdout).toContain('Dashboard');
  });

  it('passes when entry is registered', () => {
    writeConfig({
      rules: [
        {
          name: 'view-router-entry',
          filePattern: '^src/views/.+\\.vue$',
          nameExtractor: '/([^/]+)\\.vue$',
          registryFile: 'src/router/index.js',
          registryPatterns: ['${name}', 'views/${name}.vue'],
          message: 'New view ${name} must be registered in src/router/index.js',
        },
      ],
    });
    writeFixture('src/views/Dashboard.vue', '<template><div>Dashboard</div></template>');
    writeFixture('src/router/index.js', "import Dashboard from '../views/Dashboard.vue'");

    const result = runCheck('--files', 'src/views/Dashboard.vue');

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('No entry check issues found');
  });

  it('detects content check violations', () => {
    writeConfig({
      rules: [
        {
          name: 'async-handler',
          filePattern: '^src/routes/.+\\.js$',
          registryFile: '',
          registryPatterns: [],
          contentChecks: [
            {
              ruleName: 'async-route-handler',
              pattern: 'router\\.get\\([^)]*async\\s*\\(',
              unless: 'asyncHandler\\s*\\(\\s*async\\s*\\(',
              message: 'Async route handler must be wrapped with asyncHandler',
            },
          ],
        },
      ],
    });
    writeFixture(
      'src/routes/users.js',
      "router.get('/users', async (req, res) => { res.json([]); });"
    );

    const result = runCheck('--files', 'src/routes/users.js');

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('async-route-handler');
  });

  it('passes content check when unless pattern matches', () => {
    writeConfig({
      rules: [
        {
          name: 'async-handler',
          filePattern: '^src/routes/.+\\.js$',
          registryFile: '',
          registryPatterns: [],
          contentChecks: [
            {
              ruleName: 'async-route-handler',
              pattern: 'router\\.get\\([^)]*async\\s*\\(',
              unless: 'asyncHandler\\s*\\(\\s*async\\s*\\(',
              message: 'Async route handler must be wrapped with asyncHandler',
            },
          ],
        },
      ],
    });
    writeFixture(
      'src/routes/users.js',
      "router.get('/users', asyncHandler( async (req, res) => { res.json([]); }));"
    );

    const result = runCheck('--files', 'src/routes/users.js');

    expect(result.status).toBe(0);
  });

  it('respects excludePattern', () => {
    writeConfig({
      rules: [
        {
          name: 'route-check',
          filePattern: '^src/routes/.+\\.js$',
          excludePattern: '^src/routes/migration/',
          registryFile: 'src/app.js',
          registryPatterns: ['routes/${name}'],
          message: 'Route ${name} must be mounted',
        },
      ],
    });
    writeFixture('src/routes/migration/legacy.js', 'module.exports = {}');
    writeFixture('src/app.js', '// app');

    const result = runCheck('--files', 'src/routes/migration/legacy.js');

    // File is excluded, so no checkable files
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('no checkable changed files');
  });

  it('prints usage for help', () => {
    const result = runCheck('--help');

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('check-entry.js');
    expect(result.stdout).toContain('--config');
  });

  it('supports --summary output', () => {
    writeConfig({
      rules: [
        {
          name: 'view-router-entry',
          filePattern: '^src/views/.+\\.vue$',
          nameExtractor: '/([^/]+)\\.vue$',
          registryFile: 'src/router/index.js',
          registryPatterns: ['${name}'],
          message: 'Missing ${name}',
        },
      ],
    });
    writeFixture('src/views/A.vue', '<template></template>');
    writeFixture('src/views/B.vue', '<template></template>');
    writeFixture('src/router/index.js', '// empty');

    const result = runCheck('--files', 'src/views/A.vue', 'src/views/B.vue', '--summary');

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('view-router-entry: 2');
  });

  it('supports custom --config path', () => {
    const configPath = path.join(tempDir, 'custom-config.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        rules: [
          {
            name: 'page-check',
            filePattern: '^pages/.+\\.tsx$',
            nameExtractor: '/([^/]+)\\.tsx$',
            registryFile: 'routes.ts',
            registryPatterns: ['${name}'],
            message: 'Page ${name} not in routes',
          },
        ],
      }),
      'utf8'
    );
    writeFixture('pages/Home.tsx', 'export default function Home() {}');
    writeFixture('routes.ts', '// no routes');

    const result = runCheck('--config', configPath, '--files', 'pages/Home.tsx');

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('page-check');
    expect(result.stdout).toContain('Home');
  });

  it('is exposed as part of the harness:check npm script', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));

    expect(packageJson.scripts['harness:check']).toBe('node automation/check-harness.js');
  });

  it('exits with error on malformed config JSON', () => {
    writeFixture('harness/project/entry-checks.json', '{ invalid json }');
    writeFixture('src/views/Foo.vue', '<template></template>');

    const result = runCheck('--files', 'src/views/Foo.vue');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Failed to parse entry-checks config');
  });
});
