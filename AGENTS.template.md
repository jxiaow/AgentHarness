# AGENTS.md

目标仓库使用 `harness/process/` 作为 AI/agent 开发流程。

## Process Entry

处理任何开发任务前，先读取：

- `harness/process/README.md`
- `harness/process/templates/`
- `harness/process/gates/`
- `harness/process/project/local/local.md`（生成项目 adapter 后）

## Required Flow

所有任务按以下顺序执行：

1. 声明任务类型
2. 进入对应模板
3. 输出 Requirement gate
4. 输出 Design gate
5. 实现前读取相关 rules
6. 完成后输出 Implementation gate
7. 运行必要验证并输出 Verification gate
8. 输出 Delivery gate

gate 是过程记录，不是确认点。无真实阻塞时，继续推进到当前用户目标完成。

## Autopilot Defaults

- 用户说“继续 / 开始 / 接着做”时，继续当前阶段目标。
- 单个工作包完成不等于本轮结束。
- 长周期任务先创建 `docs/operations/<initiative>/` 四件套和阶段 checklist。
- 只有目标完成或出现真实阻塞时，才输出 final closeout。

## Project Adapter

项目事实、目录结构、高风险入口和项目专属检查只写入：

- `harness/process/project/local/local.md`
- `harness/process/project/local/rules/`
- `harness/process/project/local/automation/`

不要把目标仓库的业务路径、技术栈假设或私有规则写回 harness core。
