# Git Gate

## Goal

Constrain the minimum standards for committing code after completing a development task, avoiding poor commit quality, unrelated changes, or leaked sensitive information.

This stage focuses on "how code enters version control", not code quality itself (that is the job of Build gate and Close gate).

## When To Use

Only enter Git gate when the user explicitly requests a commit, branch creation, or PR preparation. After normal code changes are complete, just state the change scope and verification results in the Close gate.

## Must Check

### Pre-commit self-check

- Have relevant lint/tests passed (or is there a clear reason for not running them)
- `git diff --stat` to confirm change scope; are unrelated files included
- Are there temp files, log files, or local config files mixed in
- Are there `.env`, `credentials`, `*.pem` or other sensitive files

### Commit message format

- Format: `<type>: <message>`
  - `feat`: new feature
  - `fix`: bug fix
  - `refactor`: refactoring (no external behavior change)
  - `docs`: documentation update
  - `chore`: build/toolchain configuration
  - `style`: code formatting (no logic change)
  - `perf`: performance optimization
  - `test`: test addition or modification
- Message must be a meaningful description; do not just write `fix: bug` or `update: files`
- For complex changes, the commit body should explain:
  - Why this change was made
  - Which modules are affected
  - Whether there are breaking changes

### Commit granularity

- Multiple unrelated changes must be split into separate commits
- Code formatting and logic changes must be committed separately
- Refactoring and new features must be committed separately
- Documentation updates and business logic changes should be committed separately

### Do not commit

- `.env`, `credentials`, `*.pem`, `*.key`
- `node_modules/`
- `*.log`, log directories
- IDE config files (`.idea/`, `.vscode/` unless team convention to share)
- Temp files, debug output
- Application runtime log directories
- Database or local persistence data files
- Build artifacts (unless explicitly required to commit dist)

### Branch naming

- Branch naming: `feature/<name>`, `fix/<name>`, `refactor/<name>`
- Use kebab-case, not underscores or camelCase
- Branch name should reflect task content, e.g. `feature/host-search`, `fix/deploy-timeout`
- Do not commit directly to master/main

## Workflow

### Standard flow

```bash
# 1. Confirm change scope
git status
git diff --stat

# 2. Self-check (choose minimal relevant command for the task)
npm run lint

# 3. Commit (user executes or agent follows instructions)
git add <files>
git commit -m "<type>: <message>"

# 4. Confirm clean commit
git status
git log -1
```

### Splitting multiple changes

```bash
# Commit logic changes first
git add <route-files> <service-files>
git commit -m "feat: add host search API"

# Then commit formatting (if needed)
git add <component-files>
git commit -m "style: format search components"
```

## Commit Examples

### Good

```
feat: add host search with fuzzy matching

- Add POST /api/hosts/search endpoint
- Add BaseSelect searchable mode
- Add hostsStore.searchHosts() composable
```

```
fix: resolve deploy timeout on large projects

Deploy task was timing out due to missing keep-alive header
in SSE response. Added explicit Transfer-Encoding: chunked.
```

```
refactor: extract branch conflict handling to composable

No behavior change. Extracted conflict detection and
resolution logic from BranchView.vue to useBranchConflict.js.
```

### Bad

```
fix: bug
update: files
fix deploy issue
feat add search
```

## Gate Pass Criteria

All of the following must be met to pass Git Gate:

- [ ] No sensitive or unrelated files committed
- [ ] Commit message format is correct and meaningful
- [ ] Commit granularity is reasonable (unrelated changes split)
- [ ] Working directory is clean (`git status` shows no unexpected untracked files)
- [ ] Branch naming follows convention (if a new branch was created)

## Recommended Output

```text
Git gate
- Scope: ...
- Checks: ...
- Commit message: ...
- Excluded: ...
```
