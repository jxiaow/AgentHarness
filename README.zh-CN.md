# AgentHarness

AgentHarness 是一个给 AI coding agent 使用的可移植流程层。它让 agent 在直接动手改代码之前，先说明需求、选择设计方案、在项目规则内实现、验证结果，并输出清晰的交付收口。

它适合在真实仓库里使用 Codex、Claude Code、Gemini CLI 或自定义 coding agent 的团队。在这些仓库里，一句“直接改代码”经常会变成跳过上下文、重构半途而止、验证含糊，或文档变乱。

## 为什么需要它

AI coding agent 很有用，但它们会以可预测的方式失败：

- 需求边界还没清楚就开始写代码。
- 做局部修复时违反项目架构。
- 把一个小工作包说成“已完成”，但更大的迁移仍然没结束。
- 把稳定文档、过渡计划和执行 checklist 混在同一个地方。
- 没说明实际运行了什么验证，就说某件事已经验证过。

AgentHarness 把这些失败模式收敛成一个小而可重复的工作流：

```text
Requirement -> Design -> Implementation -> Verification -> Delivery
```

重点不是增加仪式感，而是让 agent 的工作可审阅、可恢复，并且更不容易跑偏。

## 你会得到什么

- **任务模板**：覆盖 bug 修复、新功能、重构、UI 调整和跨模块改动。
- **阶段 gate**：强制 agent 记录范围、设计、实现、验证和交付。
- **Autopilot 规则**：gate 是过程记录，不是审批暂停点。
- **项目适配层**：记录仓库事实、高风险路径和本地规则。
- **运行态文档**：承接长周期迁移和整改工作。
- **轻量流程检查**：发现 Markdown 结构问题和已知 harness 规则问题。

## 30 秒示例

没有流程层时：

```text
User: Fix the deployment page bug.
Agent: I changed three files. It should work now.
```

使用 AgentHarness 时：

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

## 快速开始

把这个目录复制到你的仓库中：

```text
your-repo/
└── harness/
    └── process/
```

在仓库根目录创建或更新 `AGENTS.md`。可以从这个模板开始：

```text
harness/process/AGENTS.template.md
```

生成项目适配层：

```bash
node harness/process/project/create-adapter.js --target harness/process/project/local --name "Local Project Adapter"
```

把你的仓库事实填到适配层里：

- `harness/process/project/local/local.md`
- `harness/process/project/local/rules/`
- 可选：`harness/process/project/local/automation/`

要求 agent 遵循 harness。一个最小的根目录 `AGENTS.md` 可以这样写：

```md
# AGENTS.md

Use `harness/process/` as the development workflow.

Before editing code:
- classify the task
- output Requirement gate
- output Design gate
- read the relevant rules

After editing:
- output Implementation gate
- run necessary verification
- output Verification and Delivery gates
```

## 可选 npm Scripts

只有把包装命令加到你自己的 `package.json` 后，`npm run ...` 才能使用。

```json
{
  "scripts": {
    "process:check": "node harness/process/automation/check-process.js",
    "harness:ops:init": "node harness/process/operations/create-operation-docs.js",
    "harness:create-adapter": "node harness/process/project/create-adapter.js"
  }
}
```

之后可以运行：

```bash
npm run process:check
npm run harness:ops:init -- desktop-restructure
npm run harness:create-adapter -- --target harness/process/project/local --name "Local Project Adapter"
```

## 仓库结构

```text
harness/process/
├── AGENTS.template.md          # 根目录说明模板
├── README.md                   # 本文件
├── automation/                 # 轻量检查
├── examples/                   # 可复制的工作流示例
├── gates/                      # Requirement、Design、Verification、Delivery、Git
├── operations/                 # 长周期事项文档生成器
├── project/                    # 项目适配模板和本地适配层
├── rules/                      # 可移植的实现规则
└── templates/                  # 任务类型模板
```

## 核心模型

AgentHarness 有两层：

- **Core**：模板、gate、规则、运行态工作流和检查，可在不同仓库之间复用。
- **Project adapter**：仓库专属事实，例如模块边界、高风险文件、本地命令和领域规则。

不要把业务事实放进 core。把它们放进 `project/local/`，这样 harness 才能复制到另一个仓库，而不会携带上一个仓库的架构。

## 默认工作流

对每个任务，agent 应该：

1. 从 `templates/` 选择最接近的模板。
2. 判断任务尺寸：`tiny`、`normal` 或 `long-running`。
3. 输出 Requirement gate。
4. 输出 Design gate。
5. 阅读相关 `rules/` 和项目规则。
6. 实现改动。
7. 输出 Implementation gate。
8. 运行必要验证。
9. 输出 Verification gate。
10. 输出 Delivery gate。

默认情况下，gate 不是审批检查点。如果没有真实阻塞，agent 记录 gate 后继续执行。

## 任务尺寸

| Size | 适用场景 | 额外要求 |
| ---- | -------- | -------- |
| `tiny` | 单文件文案、样式或局部配置改动 | 仍要输出 Requirement 和 Design gate |
| `normal` | 常规 bug、新功能、重构或 UI 调整 | 实现前阅读相关规则 |
| `long-running` | 仓库结构、workspace、迁移或多阶段整改 | 实现前创建 `docs/operations/<initiative>/` 文档 |

## 长周期工作

对于迁移、仓库重构或连续整改，先创建一个 operations 工作区：

```bash
node harness/process/operations/create-operation-docs.js <initiative>
```

这会创建：

```text
docs/operations/<initiative>/
├── current-<initiative>.md
├── <initiative>-board.md
├── <initiative>-matrix.md
└── <initiative>-decisions.md
```

把这些文件作为以下内容的事实来源：

- 阶段目标
- 工作包顺序
- backlog 状态
- 验证矩阵
- 决策和重开条件

一个工作包完成，不等于整个任务完成。除非阶段完成或出现真实阻塞，否则 agent 应该继续推进下一个最高优先级事项。

## 文档放置

使用两层文档：

- `docs/development/`：稳定架构、模块、环境搭建和长期维护文档。
- `docs/operations/`：临时执行文档，例如计划、执行板、checklist、验证矩阵和迁移状态。

不要把过渡 checklist 和阶段决策长期混在稳定开发文档里。

## 精简输出规则

agent 默认输出应该保持紧凑：

- 起手一句话说明目标和第一步动作。
- 任务类型单独成行。
- Requirement 和 Design gate 保持短列表。
- 不要把 gate 当作暂停点。
- 如果更大的目标仍有工作，不要因为单个工作包完成就输出 final closeout。
- final closeout 中区分已完成内容、验证、未验证项和真实剩余风险。

在 final closeout 前，先判断当前目标类型：

- `single-task`：一个有边界的任务；只有请求结果和必要验证完成后才能收口。
- `staged/ongoing`：迁移、整改或多阶段工作；只有当前阶段没有可执行剩余项，或出现真实阻塞时才能收口。
- `continuation`：用户说“继续”、“开始”或“接着做”；继承当前阶段，并推进下一个可执行事项。
- `explicit-closeout`：用户要求总结、停止或收口；报告当前已验证状态，不把未完成工作说成已完成。

## 验证

对于常规改动，优先使用有针对性的检查：

```bash
node harness/process/automation/check-process.js --changed --summary --max-issues 5
```

开发 harness 本身时，运行 harness 测试：

```bash
npm run harness:test
```

流程检查不是业务测试。它只证明 harness 可见的流程文件通过了当前已实现的检查。

## GitHub Description 怎么写

短描述：

```text
Portable workflow gates for AI coding agents: requirements, design, implementation, verification, and delivery.
```

建议 topics：

```text
ai-agents, coding-agents, codex, claude-code, developer-tools, workflow, software-engineering, agents-md
```

## License

MIT. See [LICENSE](LICENSE).
