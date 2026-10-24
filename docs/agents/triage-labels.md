# 分诊标签

技能用五个规范的分诊角色说话。本文件把这些角色映射到本仓 issue 记录里实际使用的标签串。

| 上游技能里的标签 | 本仓实际标签 | 含义 |
| --- | --- | --- |
| `needs-triage` | `needs-triage` | 维护者需要评估这个 issue |
| `needs-info` | `needs-info` | 等报告者补充信息 |
| `ready-for-agent` | `ready-for-agent` | 规格完整，可交给无人值守的代理 |
| `ready-for-human` | `ready-for-human` | 需要人工实现 |
| `wontfix` | `wontfix` | 不予处理 |

技能提到某个角色时（例如「打上可交给代理的分诊标签」），用这张表里对应的标签串。

「本仓实际标签」这一列按你真实使用的词表改。

## 本仓的几点说明

- `wontfix` 早于这套设置就存在：它是 GitHub 的自带标签，本来就有。其余四个是为这套词表新建的。
- GitHub 自带的 `question` 标签（「请求更多信息」）与 `needs-info` 有重叠。这里它们**不是**同义词：issue 缺少报告者信息就无法推进时用 `needs-info`（这也是技能应当设置的状态）；`question` 留作人工自由标记。
- 目前还没有 `wayfinder:*` 标签，`/wayfinder` 首次使用时才创建。
