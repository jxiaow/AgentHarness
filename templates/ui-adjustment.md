# UI Adjustment Template

## Goal

控制 UI 调整范围，确保视觉、交互和主题适配不漏项。

## Minimal Analysis

默认只补这 5 项：

- 调整类型
- 影响页面/组件
- 主要改动
- 验证方式
- 剩余风险

## Design Approval Gate

以下情况必须在 Design gate 后暂停，先让用户确认方案，确认前禁止进入实现：

- 用户要求“重新设计 UI / 重做界面 / 整体改版 / 视觉方案”
- 改动会影响页面信息架构、核心布局、视觉风格或多个核心页面
- 需要在多个可行视觉方向中做取舍
- 需要用户判断“改成什么样子”是否符合预期

Design gate 至少要给出：

- 目标页面和每个页面的布局方案
- 核心视觉方向（密度、色彩、卡片/表格/日志等形态）
- 关键交互状态（hover / active / focus / empty / loading）
- 响应式处理方式
- 明确询问用户是否按该方案实现

以下情况不需要暂停确认，可按 Autopilot 继续：

- 单个颜色、间距、文案、图标、对齐等明确样式修复
- 用户已给出足够具体的设计稿、截图或实现要求
- 用户明确说“直接实现 / 不需要确认 / 按你的方案做”

## Required References

- UI 设计、视觉重构、组件样式调整前，必须先参考 `docs/design/design-system.md`
- 主题变量和状态样式继续按 `harness/process/project/local/rules/theme-patterns.md` 执行

## Only Add When Relevant

- 涉及主题：补 light / dark
- 涉及布局：补响应式
- 涉及交互：补 hover / active / disabled / focus
- 涉及公共组件：说明是局部微调还是公共样式变化

## Recommended Output

```text
UI gate
- 类型：...
- 影响：...
- 改动：...
- 验证：...
```
