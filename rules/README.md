# Rules

本目录承载设计和实现阶段都必须遵守的稳定规则。

可移植规则应避免写入具体仓库目录和业务入口。项目专属规则应放到 `../project/local/rules/`；迁移 harness core 时，本目录默认只随 core 规则一起复制。

## Current Rules

- `token-efficiency.md`

## Quick Selection

- 低 token 执行与最小化命令范围：`token-efficiency.md`

项目规则按 adapter 选择。生成 adapter 后入口通常是 `../project/local/rules/`。
