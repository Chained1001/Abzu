# 规格：域前缀命名统一 + 文件内部格式统一立法

## 现状

1. scan 域 9 个文件命名混杂：workflow-{域}、{主题}-guide、{主题}-base、裸主题名、{域}-{主题} 五种模式并存；作者裁定统一为**域前缀**（`scan-` 开头），其他域同理。
2. 文件内部格式无统一立法：治理文档 H2 用中文序号（一二三）、skill 资产用语义节名 + Stage 体系、移植文件混用 `## 9 维画像` / `### 1. 数据完整性`——三种体系无成文分工，未来各域文件必漂移。

## 决策

- 命名：references/{域}/ 下所有文件一律 `{域}-{主题}.md`；域工作流规则由 `workflow-{域}.md` 翻转为 `{域}-workflow.md`；阶段方法论 `{域}-stage-{阶段名}.md`。
- 格式：markdown-style 增补序号体系/引号分工/行内定义/箭头/状态符号五条（并入既有节，不新开文件）；存量移植文件按既有移植豁免条款豁免，增量必须遵循。

## 文件级改动清单

1. `git mv` 8 个文件：workflow-scan→scan-workflow、collection-guide→scan-collection-guide、analysis-guide→scan-analysis-guide、publishing-guide→scan-publishing-guide、genre-trends→scan-genre-trends、reader-profiling→scan-reader-profiling、topic-decision→scan-topic-decision、cdp-base→scan-cdp-base（scan-output-format 已合规）
2. 全仓引用同步：references/scan/ 全路径引用 sed 替换；H1 标题内文件名更新；SKILL.md 路由表；test-prompts 场景 6
3. file-conventions 命名总表：域工作流/阶段方法论/结构参考三行改为域前缀规则
4. markdown-style：§一 增标题序号体系与层级上限；§二 增引号分工；§三 增行内定义/箭头/状态符号
5. CHANGELOG 记录

## 验收标准

- [ ] references/scan/ 下 9 文件全部 scan- 开头
- [ ] 全仓无旧文件名残留引用（归档规格豁免）
- [ ] file-conventions 三行规则为域前缀版
- [ ] markdown-style 含序号体系/引号分工/行内定义/箭头/状态符号条款
- [ ] `agentskills validate` 通过；`npx markdownlint-cli2` 0 违例
