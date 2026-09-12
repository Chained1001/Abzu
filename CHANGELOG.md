# Changelog

本文件记录 Abzu 的显著变更。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本遵循 [SemVer](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added

### Changed

- 底座与业务分层：底座（`AGENTS.md`／`docs/specs/施工机制.md`／`docs/standards/`）去业务化——产品设计整块迁入新建 `docs/product/` 八份，术语／产物契约／测试与验收三份标准抽芯为通用方法，其余标准逐行通用化；AGENTS 不再路由产品文档。核验：`check.sh` 全绿，14 条验收断言全过。
- 基座审计整改（060）：`AGENTS.md`＋`docs/standards/` 11 份＋`施工机制.md`＋`docs/product/` 两份按 F1–F24 整改——规格自审收敛为三条并补回立法质量两条、T1 两义分流、机检锚点节号统一、三份标准补节目录、旧仓业务词与失准指向清零。核验：`check.sh` 全绿，22 条验收断言全过。

### Fixed
