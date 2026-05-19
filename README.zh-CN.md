# agent-harness

agent-harness 是一个给 AI coding agent 使用的可移植流程层。它让 agent 在直接动手改代码之前，先说明需求、选择设计方案、在项目规则内实现、验证结果，并输出清晰的交付收口。

适合在真实仓库里使用 Codex、Claude Code、Kiro、Gemini CLI、Cursor 或自定义 coding agent 的团队。

English README: [README.md](README.md)

---

## 谁该读什么

| 你是… | 从这里开始 |
| --- | --- |
| 开发者，想把 harness 接入项目 | [快速开始](#快速开始) |
| Agent 维护者 / harness 贡献者 | [docs/maintaining.zh-CN.md](docs/maintaining.zh-CN.md) |
| 想了解完整工作流细节 | [docs/workflow-reference.zh-CN.md](docs/workflow-reference.zh-CN.md) |

---

## 为什么需要它

AI coding agent 很有用，但它们会以可预测的方式失败：

- 需求边界还没清楚就开始写代码
- 做局部修复时违反项目架构
- 把一个小工作包说成"已完成"，但更大的迁移仍然没结束
- 把稳定文档、过渡计划和执行 checklist 混在同一个地方
- 没说明实际运行了什么验证，就说某件事已经验证过

agent-harness 把这些失败模式收敛成一个小而可重复的工作流：

```text
Requirement → Design → Implementation → Verification → Delivery
```

重点不是增加仪式感，而是让 agent 的工作可审阅、可恢复，并且更不容易跑偏。

---

## 你会得到什么

- **任务模板** — 覆盖 bug 修复、新功能、重构、UI 调整和跨模块改动。
- **阶段 gate** — 强制 agent 记录范围、设计、实现、验证和交付。
- **Autopilot 规则** — gate 是过程记录，不是审批暂停点。
- **项目适配层** — 记录仓库事实、高风险路径和本地规则。
- **运行态文档** — 承接长周期迁移和整改工作。
- **轻量流程检查** — 发现 Markdown 结构问题和已知 harness 规则问题。

---

## 30 秒示例

没有流程层时：

```text
User: Fix the deployment page bug.
Agent: I changed three files. It should work now.
```

使用 agent-harness 时：

```text
Task type
Bug

Requirement gate
- Symptom: deployment page fails when the selected host is missing.
- Boundary: keep API shape and routing unchanged.
- Expected behavior: show an actionable empty state.
- Verification: targeted unit test and smoke path.

Design gate
- Fix point: normalize missing host state in the store, not inside the component.
- Risk: host selection is shared by deployment and branch flows.
- Rules: preserve Pinia state path and existing router entry.

Verification gate
- `npm run test:unit -- deploy-host-selection`: pass
- Manual smoke: deployment page empty state renders
- Not covered: real SSH connection
```

agent 仍然可以快速推进，但 reviewer 能看到它理解了什么、改了什么、以及什么没有验证。

更多示例：

- [Bug fix gate output](examples/bug-fix-gate-output.md)
- [Long-running remediation board](examples/long-running-remediation.md)

---

## 快速开始

### 1. 添加 submodule

```bash
git submodule add https://github.com/jxiaow/agent-harness.git harness/core
mkdir -p harness/project/rules
```

### 2. 告诉 AI

> 读 `harness/core/ONBOARD.md`，根据这个仓库生成 profile 和规则。

AI 会自动：

1. 扫描仓库结构（package.json、目录、入口、路由等）
2. 生成 `harness/project/profile.md` — 项目事实、模块落点、高风险路径、红线
3. 生成 `harness/project/rules/*.md` — 基于风险点的项目规则（简单项目 1–3 个，复杂项目 5–8 个）
4. 生成根目录 `AGENTS.md` — 工作流入口，包含项目硬约束

### 3. 完成

仓库现在有了完整的 agent 工作流。任何读取 `AGENTS.md` 的 AI agent 都会遵循 gate 流程。

### 生成的 profile 长什么样

`harness/project/profile.md` 包含：

```markdown
# Project Profile

## Stack
（技术栈：语言、框架、构建工具）

## Repository Shape
（核心目录树，不超过 15 行）

## Product Chain Map
（主要业务链，3–8 条）

## Module Placement
（表格：按类型列出新代码该放哪）

## High-Risk Changes
（修改需要额外谨慎的文件）

## Active Rules / Reading Sets
（按任务类型读取哪些规则）

## Project Hard Constraints
（红线：什么不能绕过、什么不能直接操作、什么改了必须同步）
```

---

## 工作原理

```text
harness/
├── core/                    ← submodule（通用，可独立升级）
│   ├── AGENTS.template.md   # 复制到仓库根目录作为 AGENTS.md
│   ├── ONBOARD.md           # AI 读这个文件来初始化新项目
│   ├── gates/               # 阶段 gate 定义
│   ├── templates/           # 任务类型模板（bug-fix, new-feature 等）
│   ├── rules/               # 通用规则（token-efficiency, test-failure-triage）
│   ├── automation/          # 流程检查
│   ├── operations/          # 长周期运行态模板
│   ├── examples/            # Gate 输出示例
│   └── docs/                # 详细参考文档
│
└── project/                 ← 项目专属（不随 core 更新被覆盖）
    ├── profile.md           # 项目事实、链路、落点、约束
    └── rules/               # 项目专属规则
```

**core/** 是通用的 — 定义工作流、gate 和模板，不了解你的项目。

**project/** 是专属的 — 包含你项目的架构事实、风险点和红线。AI 根据你的实际仓库结构生成。

---

## 工作流

每个任务遵循：

```text
1. 声明任务类型（bug / feature / refactor / UI / cross-module）
2. Requirement gate — 解决什么问题，范围内外是什么
3. Design gate — 改哪里，风险是什么，怎么验证
4. Implementation — 在项目规则内写代码
5. Verification gate — 验证了什么，没验证什么，残余风险
6. Delivery gate — 带证据的交付收口
```

Gate 是过程记录，不是审批暂停点。agent 输出 gate 后继续推进，除非遇到真正的阻塞（需要用户授权、会覆盖已有工作、需求发生重大变化、或缺少关键输入）。

---

## 自动触发

agent 检测到关键词时自动进入工作流：

| 关键词 | 模板 |
| --- | --- |
| 修复 / bug / 错误 | `bug-fix` |
| 重构 / 优化 / 整理 | `refactor` |
| 新增 / 添加 / 实现 | `new-feature` |
| 调整 / 改样式 | `ui-adjustment` |
| 跨模块 / 影响多个 | `cross-module-change` |

---

## 兼容性

agent-harness 与 agent 无关。它适用于任何能读取 Markdown 指令的 AI coding agent：

| Agent | 如何接入 harness |
| --- | --- |
| Codex | 读取仓库根目录的 `AGENTS.md` |
| Claude Code | 读取仓库根目录的 `AGENTS.md` |
| Kiro | 通过 steering rules 读取 `AGENTS.md` |
| Gemini CLI | 读取仓库根目录的 `AGENTS.md` |
| Cursor | 读取 `.cursorrules` 或 `AGENTS.md` |
| 自定义 agent | 指向 `AGENTS.md` 即可 |

无运行时依赖。无 SDK。只是 Markdown 文件，塑造 agent 行为。

---

## 升级 core

```bash
cd harness/core && git pull origin main
cd ../.. && git add harness/core && git commit -m "chore: update harness core"
```

## 克隆含 submodule 的仓库

```bash
git clone --recurse-submodules <your-repo>
# 或已有克隆：
git submodule update --init
```

---

## 可选 npm Scripts

添加到 `package.json` 方便使用：

```json
{
  "scripts": {
    "process:check": "node harness/core/automation/check-process.js",
    "harness:check": "node harness/core/automation/check-harness.js",
    "harness:ops:init": "node harness/core/operations/create-operation-docs.js",
    "harness:install-hooks": "node harness/core/automation/install-hooks.js"
  }
}
```

| Script | 用途 |
| --- | --- |
| `process:check` | 检查 Markdown 结构和 gate 规范 |
| `harness:check` | 组合检查 — 依次运行流程检查 + 项目入口检查 |
| `harness:ops:init` | 为长周期任务创建运行态文档工作区 |
| `harness:install-hooks` | 安装 git pre-commit hook，每次提交自动跑 harness:check |

使用示例：
- 日常收口：`npm run harness:check -- --changed --summary --max-issues 3`
- Pre-commit：`npm run harness:check -- --staged --summary`
- 自动 pre-commit：`npm run harness:install-hooks`（一次性配置）
- 全量扫描：`npm run process:check`

---

## 常见问题

| 问题 | 解决方案 |
| --- | --- |
| AI 没有自动进入工作流 | 确认 `AGENTS.md` 在仓库根目录且包含自动触发关键词表。部分 agent 需要重启才能识别新文件。 |
| Clone 后 submodule 目录为空 | 运行 `git submodule update --init --recursive` |
| Merge 时 submodule 冲突 | 运行 `git checkout --theirs harness/core && git submodule update --init`，然后确认 core 版本可接受 |
| AI 生成的规则太多 / 太少 | 手动编辑 `harness/project/rules/`。规则应对应真实风险点，不追求理论完备性。 |
| Gate 输出太啰嗦 | Gate 应该是短列表。如果 AI 写成段落，提醒它："gate 是过程记录，用短列表。" |
| `check-process.js` 误报 | 检查 Markdown 是否符合预期的标题结构。用 `--summary` 查看触发了哪些规则。 |

---

## 更多文档

- [工作流参考](docs/workflow-reference.zh-CN.md) — 完整流程规则、任务大小、执行模型
- [维护说明](docs/maintaining.zh-CN.md) — 如何演进 core 而不破坏项目
- [Workflow reference (English)](docs/workflow-reference.md)
- [Maintaining (English)](docs/maintaining.md)

---

## License

MIT. See [LICENSE](LICENSE).
