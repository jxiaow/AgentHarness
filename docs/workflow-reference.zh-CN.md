# 工作流参考

本文是 agent-harness 的详细流程规则。根 README 保持简短；把 harness 接入真实仓库时使用本文。

## 默认工作流

每个任务，agent 应该：

1. 从 `templates/` 选择最接近的模板。
2. 判断任务尺寸：`tiny`、`normal` 或 `long-running`。
3. 输出 Scope gate。
4. *（普通和长任务）* 输出 Solution gate。
5. *（仅长任务）* 输出 Plan gate，创建运行态工作区。
6. 阅读相关 `rules/` 和项目规则。
7. 实现改动。
8. 输出 Build gate。
9. 跑必要的验证。
10. 输出 Close gate。

Gate 默认是过程记录。没有真实阻塞，且 Solution gate 没暴露尚未批准的公开行为方案时，agent 记录 gate 后继续推进。

## 任务尺寸

| Size | 适用场景 | Gate 流 |
| ---- | -------- | -------- |
| `tiny` | 单文件文案、样式或局部配置改动 | `Scope → Close`（Build 折叠成一行或合并到 Close） |
| `normal` | 常规 bug、新功能、重构或 UI 调整 | `Scope → Solution → Build → Close` |
| `long-running` | 仓库结构、workspace、迁移或多阶段整改 | `Scope → Solution → Plan → Build → Close`（Plan 创建 `docs/operations/<initiative>/`） |

### Tiny 任务快捷方式

对于改动简单且与 Scope 完全一致的 tiny 任务：

```text
Task type
Tiny

Scope gate
- 目标：修复 src/api/auth.js 错误信息中的拼写错误
- 方案：改一个字符串字面量
- 风险：无
- 验证：visual diff

Build gate: implemented as scoped, no deviations.

Close gate
- 结果：拼写已修正
- 验证：build pass，visual diff
- 未验证和风险：无（覆盖范围内）
```

## 执行模型

agent-harness 默认按 autopilot 执行：

1. 没有真实阻塞时，agent 从 Scope 和 Solution 一直推进到 Build 和 Close。
2. Scope gate 必须在实现前输出。它界定任务范围，但不能替代 Solution gate。
3. 普通和长任务必须在 Build 前展示 Solution gate。纯实现方案默认继续自动推进。
4. 若 Solution gate 改变公开契约、用户流程、默认语义或已有入口，且该精确方向尚未被批准，则实现前必须暂停。
5. 长周期或多阶段工作必须先在 Plan gate 阶段创建阶段级 todo/checklist 和执行顺序。
6. 完成一个工作包不等于最终收口。agent 应继续推进到下一个可执行项。
7. "继续"、"开始"、"接着做"默认表示继续当前活动阶段。
8. 仅当当前目标完成或出现真实阻塞时，才允许输出最终 Close gate。
9. 持久性决策可以写入 `docs/development/changes/`，但仅在阶段收口、高风险工作完成后，或用户明确要求时。
10. 外部 skill 或计划工具不应膨胀工作流。把它们的输出收敛到 harness gate，继续推进，除非遇到真实阻塞。

真实阻塞仅限于：

- 命令需要用户授权
- 继续会覆盖或破坏已有工作
- 需求变化大到继续就会明显偏离目标
- 缺少关键输入且无法从仓库推断

## 收口规则

输出最终 Close gate 前，agent 必须先判定当前处理的目标类型：

- `single-task`：有边界的一次性任务；只在用户请求的结果和必要验证完成后收口。
- `staged/ongoing`：长周期、多阶段或持续性工作；只在当前阶段无可执行剩余项或出现真实阻塞时收口。
- `continuation`：用户只说"继续 / 开始 / 接着做 / 按计划执行"等；继承当前活动阶段，继续下一项。
- `explicit-closeout`：用户明确说"总结 / 收口 / 暂停"等；按当前已验证状态收口。

如果 `docs/operations/<initiative>/` 下存在活动的执行板或 checklist，agent 必须在最终 Close gate 前读取它，确认最高优先级可执行项已被推进。

## 长周期工作

对于迁移、仓库重构、持续整改，在 Plan gate 阶段创建运行态工作区：

```bash
node harness/core/operations/create-operation-docs.js <initiative>
```

这会创建：

```text
docs/operations/<initiative>/
├── current-<initiative>.md
├── <initiative>-board.md
├── <initiative>-matrix.md
└── <initiative>-decisions.md
```

把这些文件作为以下信息的唯一真实来源：

- 阶段目标
- 工作包顺序
- 待办状态
- 验证矩阵
- 决策和重开条件

完成一个工作包不等于完成整个任务。继续到下一个最高优先级项，除非阶段完成或出现真实阻塞。

## 长周期整改流程

仓库重构、workspace 调整、包改名、应用入口改名、迁移和多阶段整改使用本流程。

实现前：

1. 输出 Scope gate。
2. 输出 Solution gate。
3. 创建或复用 `docs/operations/<initiative>/`，输出 Plan gate。
4. 在运行态文档里写阶段级 todo/checklist、执行顺序、非目标和第一个工作包。
5. 更新 board，明确当前最高优先级工作包。

每个工作包应记录：

- `ID`
- 目标
- 范围
- 风险
- 验证方法
- 完成标准
- 依赖
- 状态

工作包完成时：

1. 更新 board。
2. 更新验证矩阵。
3. 如有决策、推迟或重开条件变化，记录到 decisions 文档。
4. 继续到下一项，除非阶段完成或被阻塞。

## 文档分层

使用两层文档：

- `docs/development/`：稳定的架构、模块、配置和长期维护文档。
- `docs/operations/`：临时执行文档——计划、board、checklist、验证矩阵、迁移状态。

不要把过渡性 checklist 和阶段决策混进稳定的 development 文档。

## 精简输出规则

默认 agent 输出应紧凑：

- 用 1 句话开头：目标和第一步动作。
- task type 放在自己的一行。
- Scope 和 Solution gate 用短列表。
- Build gate 设计上就短；无偏离时一行就够。
- 不要把 gate 当作暂停点。
- 当大目标还有工作时，不要为单个工作包输出最终 Close gate。
- Close gate 中分别记录已完成、已验证、未验证和真实剩余风险。

## 精简执行默认值

默认命令和 context 使用应小：

1. 仅搜索目标路径，排除 `target/`、`node_modules/`、`dist/` 等生成产物。
2. 尽量只对当前任务相关的路径检查 `git status`。
3. 读文件用"先定位再开窗"模式。
4. 截断长输出，只保留决策相关的行。
5. 优先用 changed-file 流程检查，除非结论依赖更广检查。
6. 必须跑大范围检查时，在 Close gate 说明原因和范围。

详情见 [../rules/token-efficiency.md](../rules/token-efficiency.md)。

## 验证

普通改动优先用有针对性的检查：

```bash
node harness/core/automation/check-process.js --changed --summary --max-issues 5
```

harness 自身开发跑测试：

```bash
npm run harness:test
```

流程检查不是业务测试。它只能证明 harness 可见的流程文件通过了当前实现的检查。

### 本地 dev server 和浏览器验证

前端改动默认不启动本地 dev server。仅当验证结果依赖真实浏览器运行时才启动，例如：新页面、大范围 UI 重做、响应式/交互/路由风险、截图审阅、或用户明确要求预览。

小范围文案、间距、颜色 token、静态样式契约、纯逻辑改动，优先使用静态检查、单元测试、契约测试或 build。不要占用端口只为证明小改动。

需要 server 时，启动前先说明目的、命令、预期端口，启动后给出 URL，收口前确认是否停止 server 或说明为什么保留。端口冲突时不要反复探测；说明后切一次合理端口，清理失败启动残留。

启动 server 不等于浏览器验证。Close gate 必须说明实际检查的路径、视口、状态和缺口。
