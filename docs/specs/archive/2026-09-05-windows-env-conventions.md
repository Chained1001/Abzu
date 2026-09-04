# 规格：宪法增补 Windows 环境约定

## 现状

AGENTS.md 无 Windows 命令执行约定（仅 §8 一句"正斜杠"）。本会话已实际踩坑四起（sed 反斜杠路径报错、pip CLI 不在 PATH、npx glob 显式传参、目录不自动创建），mo-shu 有更贵教训（GBK 编码事故、python 探测链）。宪法 §0 已是命令与起步信息的家，环境约定应并入。

## 决策

§0 更名"会话起步与环境约定"，新增 Windows（Git Bash）环境约定小节，五条：shell 语义与路径、Python 探测链与编码、pip CLI 入口、目录先行、npx glob 与退出码。

## 文件级改动清单

1. `AGENTS.md` §0：标题更名；尾部新增环境约定小节
2. `CHANGELOG.md`：Changed 条目
3. 规格归档

## 验收标准

- [x] §0 标题含"环境约定"，含五条 Windows 条款
- [x] AGENTS.md 行数 <120（实测见提交）
- [x] `npx markdownlint-cli2` 全仓 0 违例
- [x] CHANGELOG 有条目
