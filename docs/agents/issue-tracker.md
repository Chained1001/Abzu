# Issue 记录：GitHub

本仓的 issue 与规格都记在 GitHub 的 `Chained1001/Abzu` 仓库。一律用 `gh` CLI 操作。

## 约定

- **建 issue**：`gh issue create --title "..." --body "..."`。多行正文用 heredoc。
- **读 issue**：`gh issue view <number> --json number,title,body,labels,comments`。
- **列 issue**：`gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`，按需加 `--label` 与 `--state` 过滤。
- **把 issue 挂成另一个的子 issue**：`gh issue create --parent <parent> ...`，或事后 `gh issue edit <parent> --add-sub-issue <child>`（`gh` 2.94+）。不支持子 issue 时，在子 issue 正文第一行写 `Part of #<parent>`。
- **评论**：`gh issue comment <number> --body "..."`
- **加／去标签**：`gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **关闭**：`gh issue close <number> --comment "..."`

仓库由 `git remote -v` 推断；在 clone 目录里跑 `gh` 会自动识别。

## PR 作为分诊面

**把 PR 当请求面：否。**（如果本仓把外部 PR 当作功能请求，改成「是」；`/triage` 会读这个标记。）

设成「是」时，PR 走与 issue 相同的标签与状态，用 `gh pr` 的对应命令：

- **读 PR**：`gh pr view <number> --comments`，看 diff 用 `gh pr diff <number>`。
- **列外部 PR 待分诊**：`gh api --paginate 'repos/{owner}/{repo}/pulls?state=open' --jq '.[] | select(.author_association | IN("OWNER","MEMBER","COLLABORATOR") | not) | {number, title, author: .user.login, author_association, labels: [.labels[].name]}'`。
- **评论／打标签／关闭**：`gh pr comment`、`gh pr edit --add-label`/`--remove-label`、`gh pr close`。

GitHub 的 issue 与 PR 共用一个编号空间，所以裸写 `#42` 可能指两者之一：先 `gh pr view 42`，再退回 `gh issue view 42`。

## 技能说「发到 issue 记录」时

建一个 GitHub issue。

## 技能说「取相关工单」时

按上面 **读 issue** 那条读。

## 寻路操作

`/wayfinder` 用的。**地图**是一个 issue，**子** issue 是工单。

- **地图**：一个打 `wayfinder:map` 标签的 issue，正文装「笔记／已定决策／迷雾」三段。`gh issue create --label wayfinder:map`。
- **子工单**：作为 GitHub 子 issue 挂到地图上（见上面 **把 issue 挂成另一个的子 issue**）。子 issue 不可用时，把子项加进地图正文的任务列表，并在子 issue 正文首行写 `Part of #<map>`。标签 `wayfinder:<type>`（`research`／`prototype`／`grilling`／`task`）。认领后指派给驱动它的开发者。
- **阻塞关系**：用 GitHub 的**原生 issue 依赖**，这是规范且界面可见的表示。加一条边：`gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`，其中 `<blocker-db-id>` 是阻塞者的数字**数据库 id**（`gh api repos/<owner>/<repo>/issues/<n> --jq .id`，**不是** `#number` 也不是 `node_id`）。GitHub 通过 `issue_dependencies_summary.blocked_by` 报告（只含未关闭的阻塞者，即当前生效的闸）。依赖功能不可用时，退回在子 issue 正文首行写 `Blocked by: #<n>, #<n>`。所有阻塞者都关闭了，工单才算解锁。
- **前沿查询**：列出地图下未关闭的子 issue（`gh issue list --state open`，限定在地图的子 issue／任务列表内），剔除有未关闭阻塞者（`issue_dependencies_summary.blocked_by > 0`，或 `Blocked by` 行里有未关闭 issue）的、以及已有指派人的；按地图顺序取第一个。
- **认领**：`gh issue edit <n> --add-assignee @me`，这是本次会话的第一次写操作。
- **解决**：`gh issue comment <n> --body "<答案>"`，然后 `gh issue close <n>`，再把一条上下文指针（要点＋链接）追加到地图的「已定决策」段。

## 覆盖通用约定的本仓约定

- **代理绝不提交、推送、打 tag。** 见 `AGENTS.md` 硬约束 1：提交与推送属于作者，或经明确批准。技能关闭了一个 issue，不等于工作已合并；要在关闭评论里说清楚。
- **不要把个人绝对路径、API key、会话记录或真实作品内容粘进 issue 正文或评论。** `pnpm check:public` 会扫全部历史并拒绝。用合成例子。
- **issue 正文可以带领域词汇。** 书仓路径名要原样书写（`作品契约/契约.md`、`定稿/卷NN/`），它们不是笔误。
