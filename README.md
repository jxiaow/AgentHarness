# AgentHarness

AgentHarness 是一个可移植的 AI coding agent 开发流程 harness。

它通过任务模板、阶段 gate、项目 adapter 和轻量流程检查，约束 agent 如何：

- 判断任务类型
- 补齐需求边界
- 选择设计落点
- 执行实现
- 说明验证
- 输出可消费交付

## Quick Start

下载或复制本目录后，按这个顺序接入目标仓库：

1. 把目录放到目标仓库的 `harness/process/`
2. 在仓库根目录创建或更新 `AGENTS.md`；可从 `harness/process/AGENTS.template.md` 起步
3. 用 Node.js 生成项目适配层：

```bash
node harness/process/project/create-adapter.js --target harness/process/project/local --name "Local Project Adapter"
```

4. 按 `harness/process/project/README.md` 补全 `project/local/local.md`、`project/local/rules/` 和可选自动检查
5. 让 agent 处理任务时按 `Default Workflow` 输出 gate；长周期任务创建运行态文档：

```bash
node harness/process/operations/create-operation-docs.js <initiative>
```

`npm run ...` 不能自动使用这些脚本。只有把下面这组 scripts 加到目标仓库 `package.json` 后，才可以使用对应 npm 包装命令；未配置前一律使用上面的 `node ...` 形式。

```json
{
  "scripts": {
    "process:check": "node harness/process/automation/check-process.js",
    "harness:ops:init": "node harness/process/operations/create-operation-docs.js",
    "harness:create-adapter": "node harness/process/project/create-adapter.js"
  }
}
```

配置后可用：

```bash
npm run process:check
npm run harness:ops:init -- <initiative>
npm run harness:create-adapter -- --target harness/process/project/local --name "Local Project Adapter"
```

## Structure

- `templates/` — 任务分流模板
- `gates/` — 阶段收口 gate
- `rules/` — 实现前后必须遵守的稳定规则
- `automation/` — 可自动检查的规则映射
- `project/` — 仓库专属事实和适配说明

## License

MIT. See `LICENSE`.

## Portability Model

harness 默认分成两层：

- `core`：通用流程、gate、模板、输出约束和 process check。迁移时应整体复制 `harness/process/` 的 core 文件。
- `project adapter`：仓库结构、业务链路、高风险入口和项目专属检查。新项目可用 `project/create-adapter.js` 生成 `project/local/`。

迁移到其他仓库时，优先替换 `project/` 和项目专属 rules / automation；不要把业务目录、框架栈、路由入口等写回 core README。

快速生成新项目适配层时，先看 `project/README.md` 和 `project/_template/`。

## Document Placement

文档默认按“稳定层”和“运行态层”分开存放：

- `docs/development/` — 稳定开发文档：架构、模块说明、开发环境、长期参考
- `docs/operations/` — 阶段性运行文档：整改计划、执行板、验证矩阵、决策记录、迁移过程状态

放置规则：

1. 会随着阶段推进频繁更新、完成后可能归档或删除的文档，放 `docs/operations/`
2. 面向长期维护者、在阶段结束后仍应保留为稳定参考的文档，放 `docs/development/`
3. 不要把运行态执行板、checklist、阶段决策长期混放在 `docs/development/`
4. 新 initiative 使用 `node harness/process/operations/create-operation-docs.js <initiative>` 生成运行态文档；只有仓库已配置 npm scripts 时，才可使用对应 npm 包装命令

## Execution Model

默认按这组最小规则执行：

1. Autopilot 默认开启：无真实阻塞时持续推进到实现、验证和交付
2. 先过 Requirement / Design gate，再开始实现；gate 是记录，不是确认点
3. 长周期 / 多阶段 / 全局目标任务，先建立阶段级 todo/checklist 和执行顺序
4. 单个工作包完成后继续下一动作，只在必要时发 1 句 `working update`
5. 用户输入“继续 / 开始 / 接着做”时，默认继续当前阶段目标
6. 只有阶段目标完成或真实阻塞时，才输出 `final closeout`
7. 只有阶段收口、高风险已完成、需要保留长期决策，或用户明确要求时，才写 `docs/development/changes/`
8. 用户明确要求自动推进时，不因小步完成输出完整风险/下一步收口

`final closeout` 前必须先判定当前目标类型：

- `single-task`：一次性任务，只有用户要求的结果和必要验证都完成时才收口
- `staged/ongoing`：长周期、多阶段或连续推进任务，只有当前阶段 checklist 无可执行剩余项，或存在真实阻塞时才收口
- `continuation`：用户只说“继续 / 开始 / 接着做 / 按计划执行”时，继承上一个活动阶段目标并执行下一项，不因刚完成一个工作包收口
- `explicit-closeout`：用户明确说“总结 / 收口 / 先到这 / 到这里”时，按当前已验证状态收口

若当前目标存在 `docs/operations/<initiative>/` 执行板或 checklist，`final closeout` 前还必须读取它，并确认同阶段没有可继续的最高优先级项；否则只能输出 `working update` 并继续。

需要创建运行态执行板、验证矩阵和决策记录时，运行：

```bash
node harness/process/operations/create-operation-docs.js <initiative>
```

该命令默认生成 `docs/operations/<initiative>/current-<initiative>.md`、`<initiative>-board.md`、`<initiative>-matrix.md` 和 `<initiative>-decisions.md`。

允许暂停的阻塞只有：需要用户授权命令；继续会误伤已有改动；需求变化导致继续明显偏离目标；缺关键输入且无法从仓库自行判断。

外部技能、计划模板或工具流程不得放大输出量；若其要求完整 spec、等待用户批准或提交代码，默认折叠为本 harness gate 结论，继续执行到当前目标完成。

## Task Size Model

所有任务都必须过 gate，但输出密度按任务尺寸调整，避免流程本身制造负担。

| Size           | 适用场景                                                 | Gate 输出               | 额外要求                                    |
| -------------- | -------------------------------------------------------- | ----------------------- | ------------------------------------------- |
| `tiny`         | 单文件、小文案、小样式、局部配置，不改变接口和数据流     | 每个 gate 2-4 行短列表  | Verification 仍必须写未验证项               |
| `normal`       | 常规 Bug、新功能、重构、UI 调整                          | 每个 gate 3-6 行短列表  | 实现前补看相关 rules                        |
| `long-running` | 根目录、workspace、目录迁移、跨脚本/构建/测试/文档的整改 | gate + 阶段级 checklist | 先落 `docs/operations/<initiative>/` 四件套 |

尺寸判断只影响输出密度，不影响 gate 顺序。不能用 `tiny` 作为跳过 Requirement / Design / Verification / Delivery 的理由。

默认判断：

1. 能在一个明确文件内完成，且无接口、路由、构建入口变化：`tiny`
2. 涉及两个以上模块、入口文件或用户可见流程：`normal`
3. 命中仓库结构、workspace、迁移或多阶段整改条件：`long-running`

推荐 checklist 结构：

- `[x]` 已完成项
- `[ ]` 待做项
- `[-]` 已知阻塞项：原因

收口前最小检查：

1. 已按 `single-task` / `staged/ongoing` / `continuation` / `explicit-closeout` 判定当前目标类型
2. 当前用户目标已完成，而非仅完成一个工作包
3. 已无可继续的下一执行动作，或存在真实阻塞
4. 若使用执行板，已读取执行板并确认同阶段最高优先级项已推进且无下一可执行动作

若任一项不满足，只能继续执行并输出 `working update`。

## Default Workflow

默认顺序：

1. 先选模板（`templates/`）
2. 判断任务尺寸（`tiny` / `normal` / `long-running`）
3. 过 Requirement gate
4. 过 Design gate
5. 若属于 `long-running`，先写阶段级 todo/checklist 和执行顺序
6. 按顺序进入当前第一阶段，并补看相关 `rules/`
7. 过 Implementation gate
8. 过 Verification gate
9. 过 Delivery gate
10. 用户要求提交时，过 Git gate

如果任务跨多个模板，先用主模板约束主线，再补看次模板。

## Responsibility Split

避免同一规则在多个文件中长期漂移：

- `AGENTS.md`：只放仓库级强约束、自动触发、红线和导航
- `README.md`：解释通用执行模型、任务尺寸和长周期流程
- `templates/`：只描述任务类型的最小分析点
- `gates/`：只描述阶段收口字段、示例和反例
- `rules/`：只描述可移植的实现前后稳定规则
- `automation/`：通用 process check 放在本目录；项目入口检查只作为 adapter 接入
- `project/`：只放仓库事实、业务链路、项目专属规则和迁移时应替换的内容

## Lean Output Defaults

默认使用精简输出，避免流程本身制造过多对话负担：

1. 起手更新 1 句：目标 + 第一动作
2. 任务类型单独成行；禁止和 gate 标题挤到同一行
3. Requirement / Design gate 使用多行短列表；精简不等于把多个字段用分号挤到一行
4. 不同 gate 之间必须换行分隔；禁止把多个 gate 压到同一行
5. 执行中默认不报；超过约 30 秒、风险变化或关键验证完成时，1 句同步
6. 单个工作包完成时，不输出完整收口总结；更新状态并继续
7. 只有阶段完成或真实阻塞时，才输出完整 `Verification + Delivery`
8. 没有真实风险或未验证项时，不为凑格式展开“风险/下一步”清单

若 AGENTS.md 与本 README 重复，以 AGENTS.md 的强约束为准；本 README 只补执行细节，避免重复输出两套流程结论。

## Lean Execution Defaults

默认使用低 token 执行策略，避免命令和上下文膨胀：

1. 搜索和文件列表默认限制在目标目录，并排除构建产物目录
2. `git status` 默认只看当前任务路径，不做全仓输出
3. 文件读取先定位再窗口读取，不整段通读大文件
4. 长输出先截断，只保留决策所需片段
5. 自动化默认跑 `node harness/process/automation/check-process.js --changed --summary` 这类轻量检查，不把全量 lint/test 当成每轮默认动作
6. 若必须扩大检查范围，需在 Verification gate 明确说明原因

详细规范见：`rules/token-efficiency.md`

## Long-Running Remediation Workflow

当任务属于“项目级整改 / 迁移收口 / 连续多轮重构”时，除了正常 gate，还必须把执行状态落到 `docs/operations/` 下的整改工作流文档：

- `docs/operations/remediation/current-remediation.md` - 整改总述、范围和固定执行顺序
- `docs/operations/remediation/remediation-board.md` - 唯一 backlog 与状态事实来源
- `docs/operations/remediation/remediation-matrix.md` - 验证矩阵，区分格式、lint、编译、单测、smoke、联调
- `docs/operations/remediation/remediation-decisions.md` - 决策、不做项和重开条件

以下场景必须自动按本节处理，不能只按“普通重构”执行：

- 根目录结构调整、仓库结构调整、目录迁移
- workspace 改动、包重命名、应用入口重命名
- 同时影响目录结构 + 脚本/构建 + 测试/文档中的两类及以上入口

命中以上任一项时，Requirement / Design gate 之后必须先完成两步，未完成前禁止进入实现：

1. 在 `docs/operations/<initiative>/` 下创建等价四件套或复用现有 initiative 四件套
2. 写清阶段级 todo/checklist、执行顺序、非目标和当前第一工作包

这类任务必须先写“阶段级 todo/checklist + 执行顺序”，再按顺序推进到当前第一工作包，而不是按一句“继续”临时决定下一步。阶段级记录至少包含：

- `阶段目标`
- `阶段顺序`
- `非目标`
- `完成标准`

工作包记录至少包含：

- `ID`
- `目标`
- `范围`
- `风险`
- `验证方式`
- `完成标准`
- `前置依赖`
- `当前状态`

执行要求：

1. 先在 `current-remediation.md` 或等价阶段文档中写清阶段级 todo/checklist、执行顺序和非目标
2. 再更新 `remediation-board.md`，确认当前应执行的第一优先级工作包
3. Requirement / Design gate 明确“当前阶段解决什么，不解决什么”和“当前工作包解决什么，不解决什么”
4. 完成后更新 `remediation-board.md`、`remediation-matrix.md`
5. 若产生新的架构结论、暂缓项或重开条件，同步写入 `remediation-decisions.md`
6. `current-remediation.md` 只保留总述和执行顺序，不再承担细粒度状态来源

输出要求：

1. 单个工作包完成后，只能发 `working update`，并同步执行板 / 验证矩阵 / checklist
2. 只要当前用户目标仍属于“继续推进当前整改阶段”，就必须直接进入下一个工作包或下一验证动作
3. 只有在“当前阶段目标完成”或“出现真实阻塞”时，才能输出 `final closeout`
4. 如果用户只是说“继续”“按计划执行”，默认含义是继续推进整改阶段，而不是做到当前工作包就停

如果任务被中断，恢复时应优先读取这四个文档，而不是依赖短期会话上下文。

## Quick Navigation

- 任务分流：`templates/`
- 阶段 gate：`gates/`
- 通用稳定规则：`rules/`
- 项目规则：`project/local/rules/`（生成 adapter 后）
- 自动化映射：`automation/`
- 项目适配：`project/local/local.md`（生成 adapter 后）
- 项目适配脚手架：`project/_template/`

## Entry Points

- `templates/` — 任务分流
- `gates/` — 阶段收口
- `rules/` — 通用稳定规则
- `automation/` — 自动化映射
- `project/` — 项目适配层

## Maintenance Rule

后续新增规则、模板、gate 或自动化映射，直接加到本目录。维护 harness 时至少检查：

- 模板触发、gate 顺序、README 默认流程是否一致
- 仓库事实是否只放在 `project/` 或项目专属 rules 中
- 自动化映射表格是否可正常渲染，含 `|` 的正则必须转义
- 新规则是否已有对应的人工判断项或自动化候选项
