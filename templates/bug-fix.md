# Bug Fix Template

## Goal

定位根因，用尽量小的修复面解决问题。

## Minimal Analysis

默认只补这 5 项：

- 问题现象
- 期望行为
- 根因或怀疑主链
- 修复面
- 验证方式

## Only Add When Relevant

- 有稳定复现：补复现步骤和触发条件
- 有环境差异：补 Web / 桌面运行时 / OS
- 有日志、堆栈、截图：只引用关键证据
- 还没复现成功：明确哪些结论只是代码路径分析

## Recommended Output

```text
Bug gate
- 现象：...
- 根因/主链：...
- 修复面：...
- 验证：...
```
