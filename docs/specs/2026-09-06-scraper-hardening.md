# 规格：爬虫补强——选择器维护入口 + 失效显性化 + 采集礼仪

> 本规格自包含。施工前先读仓库根 AGENTS.md。施工方只改本规格「文件级改动清单」列出的 5 个文件。

## 背景与目标

四个平台抓取脚本（`skills/abzu/scripts/` 下 qidian/fanqie/qimao/jjwxc-rank-scraper.js）为可用移植代码。补强目标：①平台改版时维护者能一处定位全部选择器 ②选择器失配时显性报错而非静默产出坏数据 ③采集行为成文（限速/礼貌）。

## 现状事实（grep 锚点，2026-09-06 实测）

- qidian-rank-scraper.js：L7/L35 m.qidian.com SSR pageContext；L114 `querySelectorAll('.book-img-text ul li')`；L117 `h2 a[href*="/book/"]`；L130 `h2 a`；L136 `p.author a.name`；L139 `p.author a`；L146 `p.author span`。空结果失效报告：无
- fanqie-rank-scraper.js：`__INITIAL_STATE__`（L6/L65/L70）；详情页解码 bookName/categoryV2/abstract（L108-109）；简介【】标签（L148）。空结果失效报告：无
- qimao-rank-scraper.js：`text()` helper（L69-70）实参 `.qm-switch-tab .item.active` / `.child-tabs-item.menu-tab.active` / `.date-type-tabs .tab.active`；L339 已有「页面结构可能已变（选择器没匹配到数据）」。空结果失效报告：有 1 处
- jjwxc-rank-scraper.js：topten.php（L7）/onebook.php（L8）/itemprop 微数据（L114）/collectedCount+nutritionCount（L127）。空结果失效报告：无
- scan-collection-guide.md：无采集礼仪节

## 文件级改动清单

### 1-4. 四个抓取脚本：头部维护入口注释块

插入位置：文件头 JSDoc 注释块（`/** ... */`）结束之后、第一行可执行代码之前（shebang 与 JSDoc 原位不动）。**纯注释，零逻辑改动**。各脚本插入内容（逐字使用）：

qidian-rank-scraper.js：

```javascript
/* ═══ 平台改版维护入口 ═══
 * 全部页面选择器/数据源（改版只改这里）：
 * - 首选数据源：m.qidian.com 移动端 SSR pageContext JSON
 * - PC 回退选择器：'.book-img-text ul li' / 'h2 a[href*="/book/"]' / 'p.author a.name' / 'p.author a' / 'p.author span'
 * 失效症状：SSR JSON 缺 pageContext，或 PC 页选择器返回 0 条
 * 排查：references/scan/scan-cdp-base.md 与 references/scan/scan-collection-guide.md
 */
```

fanqie-rank-scraper.js：

```javascript
/* ═══ 平台改版维护入口 ═══
 * 全部页面选择器/数据源（改版只改这里）：
 * - 榜单页：window.__INITIAL_STATE__ 结构化列表
 * - 详情页：内嵌 JSON bookName/author/abstract/categoryV2 与 og:meta（字体反爬解码）
 * - 标签：简介开头【tag+tag】格式
 * 失效症状：书名大量显示 bookId:xxx 或（标题待解析）
 * 排查：references/scan/scan-output-format.md「故障排查」与 references/scan/scan-cdp-base.md
 */
```

qimao-rank-scraper.js：

```javascript
/* ═══ 平台改版维护入口 ═══
 * 全部页面选择器/数据源（改版只改这里）：
 * - tab 选择器：'.qm-switch-tab .item.active' / '.child-tabs-item.menu-tab.active' / '.date-type-tabs .tab.active'
 * - 榜单列表：qimao.com/paihang 各榜单链接与列表项选择器
 * 失效症状：列表为空或热度字段缺失
 * 排查：references/scan/scan-output-format.md 与 references/scan/scan-cdp-base.md
 */
```

jjwxc-rank-scraper.js：

```javascript
/* ═══ 平台改版维护入口 ═══
 * 全部页面选择器/数据源（改版只改这里）：
 * - 列表页：jjwxc.net/topten.php?orderstr={榜单ID}（anchor 取 novelid）
 * - 详情页：onebook.php?novelid= 的 itemprop 微数据 collectedCount/nutritionCount/scoreCount/wordCount/updataStatus
 * 失效症状：频道分组为空或收藏数/营养液缺失
 * 排查：references/scan/scan-output-format.md 晋江节与 references/scan/scan-cdp-base.md
 */
```

### 5. 四个抓取脚本：空结果显性报错

在各脚本的「榜单列表为空 / 条目数=0」分支，确保输出含「选择器失效」字样的错误信息。要求：

- 无此分支报错的脚本：在该分支补一条 `console.error`，格式 `[平台名] 选择器失效：页面结构可能已变，条目数为 0，请核对 URL 与选择器`
- 已有等价报错的（qimao L339）：在原文案中补入「选择器失效」字样
- qimao 文案改为：`[qimao] 选择器失效：页面结构可能已变（选择器没匹配到数据），请检查榜单URL或更新选择器 (…)`（保留原有括号内容）

### 6. scan-collection-guide.md：新增「采集礼仪」节

插入位置：「## 采集质量检查（每完成一个榜单立即执行）」节之前。内容**逐字**使用：

```markdown
## 采集礼仪〔abzu 自定〕

- 请求间隔：同站点连续请求间隔 ≥ 2 秒；详情页补采每 5 本一批、批间 ≥ 2 秒
- 单次上限：单榜单 ≤ 100 条、详情补采总量 ≤ 100 本（脚本默认即此量级，勿调大）
- 失败退避：同一请求失败退避重试 ≤ 3 次（2s/4s/8s），仍失败则停下记录，不无限重试
- 只采公开榜单页与作品页公开字段；不碰付费墙内正文、不尝试绕过登录
- 登录态只复用用户自己的（chrome-debug-profile），不申请或使用他人凭据
```

## 禁止事项

- 禁止改动任何 JS 采集逻辑 / 字符串拼接 / 函数结构（本批只允许：加注释块、加或改错误信息文案、新增 scan-collection-guide 小节）
- 禁止修改清单外任何文件（scan-analyze.js / cdp-utils.js / setup-cdp-chrome.js / CHANGELOG.md / references 其余文件均不得触碰）
- 禁止 git commit / push
- 禁止运行联网采集——验证只做 `node --check` 语法检查

## 验收标准（施工方自核验 + 规划方独立复跑）

- [ ] `node --check` 四个改动脚本全过；未改动 3 脚本（scan-analyze/cdp-utils/setup-cdp-chrome）无任何 diff
- [ ] grep -c "平台改版维护入口" 四脚本各 = 1
- [ ] grep -c "选择器失效" 四脚本各 ≥ 1
- [ ] scan-collection-guide.md 含「采集礼仪」节且文案与规格逐字一致
- [ ] git status 显示且仅显示：4 个脚本修改 + 1 个 md 修改
- [ ] `npx markdownlint-cli2` 0 违例

## 提交

施工方不提交。完成后输出【核验请求】（格式见 AGENTS.md §3.8）。
