# 规格：Markdown 写作规范立法 + 行尾统一 + lint 基线体检

## 现状

- 已有规范管辖行为（宪法）、文件命名（file-conventions）、术语（glossary）、验收（test-prompts），**无任何规范管 .md 正文的写法**——阶段 1 将写 SKILL.md 正文与多个 references，缺此层规范必然各写各的。
- 行尾无策略：无 .gitattributes，每次 staging 刷 CRLF 警告。
- 发现既有不一致：file-conventions 命名总表中"工程规范/项目参照"两行写的是中文名示例（`文件规范.md`、`术语表.md`），实际文件全部是英文名——规范与实测不符（宪法 §3 自检应捕获而漏检）。

## 决策

- 立法 `docs/standards/markdown-style.md`：Markdown 正文结构 + 中文排版 + AI 友好写作 + 符号与编码安全四域合一。依据 markdownlint 规则集、中文文案排版指北、Anthropic skill 写作实践、mo-shu 工艺教训。
- 新增 `.gitattributes`（`* text=auto eol=lf`）终结行尾漂移。
- 引入 `.markdownlint-cli2.jsonc` 最小配置（含"不采用规则+理由"），使全仓 lint 体检可复现；**不进 CI**（不做清单 CI 条目不变）。
- 跑一次 markdownlint 全仓体检，违例当批清零，作为基线。

## 文件级改动清单

1. 新增 `docs/standards/markdown-style.md`（四域 + 不采用规则 + 维护条款）
2. 新增 `.gitattributes`
3. 新增 `.markdownlint-cli2.jsonc`（最小配置，注释写明不采用理由）
4. `AGENTS.md` §0 必读文档表增加 markdown-style.md 行
5. `file-conventions.md` 命名总表"工程规范/项目参照"两行示例改为实际英文名
6. lint 体检发现的违例就地修复（表格分隔行样式统一、断言列表前补空行；`.zcode/**` 排除进 lint 配置）
7. `CHANGELOG.md` 记录
8. （施工中新增）`AGENTS.md` §5 反模式清单回填一条：验收命令退出码经管道被吞（本批 lint 体检实操事故）

## 验收标准

- [x] markdown-style.md 存在，含结构/中文排版/AI 友好/符号编码四域 + "不采用规则（带理由）"节
- [x] `.gitattributes` 存在且为 LF 策略
- [x] AGENTS.md §0 表含 markdown-style.md 行
- [x] file-conventions 命名总表无与实际文件名不符的示例
- [x] `npx markdownlint-cli2` 全仓 0 违例（EXIT=0，11 文件；`.zcode/**` 排除）
- [x] markdown-style.md 自身 ≤100 行
- [x] CHANGELOG 有对应条目

> 验收完成：2026-09-05，全部通过。
