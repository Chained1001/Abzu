# 专题二·方向三：开源"去 AI 味"项目调研（2026-10-12）

## 一、项目/资源清单

| 项目 | 星数 | 核心手法 | 链接 |
|---|---|---|---|
| blader/humanizer | 55.9k | 26 条 AI 痕迹模式（源自 Wikipedia "Signs of AI writing"），6 类：表演式表达/节奏套路/空洞拔高/格式套路/聊天残留/错位读者；纯 SKILL.md 提示词，明言不以骗检测器为目标 | github.com/blader/humanizer |
| 说人话 MrGeDiao/shuorenhua | 2.1k | 中文优先保守改写；铁律"数字/条件/承诺/原意不动"；三档改动边界（自由/保结构/原位）；不做检测、不打分 | github.com/MrGeDiao/shuorenhua |
| hylarucoder/ai-flavor-remover | 1.2k | 中文去 AI 味 prompt（Gemini 2.5 Pro 实测，朱雀 70%→17%）：长短句交错、去机械连接词、禁套话（"值得注意的是/不难发现"）、show don't tell、诊断→策略→改写三段输出 | github.com/hylarucoder/ai-flavor-remover |
| lynote-ai/humanize-text | 3.4k | SFT+KTO 训练管线＋翻译链改写（需训练，重依赖） | github.com/lynote-ai/humanize-text |
| de-slop | ~1k | 43 规则×4 轴（平实词/人声/结构），0–100 打分器（规则式，可 grep） | de-slop-ai.vercel.app |
| Aboudjem/humanizer-skill | 271 | 本地 55 模式×5 声腔，0–100 AI 痕迹分（纯规则计分） | github.com/Aboudjem |
| 社区提示词 | — | r/WritingWithAI、creativindie 3 prompt＋100+ 禁词表、CSDN 25 prompt 合集（检测率 85%→45-55%）：句长不齐、允许不完美语法、感官细节、潜台词、人物声腔 | reddit.com/r/WritingWithAI |
| NovelAI/ST 社区 | — | anlatan-nai-extras（NAI 模型上下文控制）、Sphiratrioth preset 集（HF）：预设＋Author's Note 调文风，非去味判据 | github.com/artisticMink |

国内网文侧：Vela（本地 AI 小说 IDE）、InkOS（可仿写流水线）均为生产工具，无独立去味判据；番茄生态教程核心共识＝"人情味"在题材与细节，不在指令。

## 二、治理手法归类（对照散文卡判据层）

| 层 | 手法 | 散文卡覆盖 |
|---|---|---|
| 词汇层 | 禁词表/套话 grep、具体动词换抽象词 | 部分有（词频横向审查） |
| 句式层 | 去机械连接词、破整齐排比、句首多样、限破折号 | 补充点：**"not X but Y"式表演句/一行金句收尾/三连排比**是散文卡未显式覆盖的强判据 |
| 节奏层 | 句长方差（burstiness）工程、段落长短错落 | 节奏卡有，缺量化 |
| 语义层 | show don't tell、删空洞拔高与假冲突、感官锚点、声腔匹配（喂作者样本） | 写作卡可补"预防型"（社区共识：预防优于事后修） |

## 三、检测器当裁判：可行但只做相对门禁

- 朱雀（matrix.tencent.com/ai-detect，免费网页，7 维特征，~92% 准确）与 GPTZero（困惑度+burstiness，免费 API 1 万词/月）可当**手动盲测替身**，但：外部 API 依赖、题库偏差（熟悉题材误判 100%、冷门 0%）、误判名家——只可作抽样人工门，不可入自动化管线。
- 本地开源检测器 Binoculars（ICML24，双模型困惑度比，90%@0.01%FPR）、Fast-DetectGPT（曲率）需 GPU+Python+权重，不合 Abzu 零依赖。
- **可吸收路径**：其底层指标可用零依赖 Node 近似——句长方差（burstiness）、n 元困惑度代理（对拆书人味语料算交叉熵）、连接词密度、禁模式 grep。以参考作品为人味基线做**相对分**（AI 稿 vs 基线），不做绝对 AI 分。需先拿已知 AI 稿+人味语料校准。

## 四、可吸收前五（落点）

1. humanizer 26 模式中叙事适用子集（表演句/金句收尾/三连排比/拔高词/聊天残留）→ **润色判据**（改写为中文小说语境判据，不抄原文）；
2. 说人话"改动边界"设计（事实/数字/设定/承诺不动＋三档模式）→ **润色管线改动护栏**；
3. 零依赖 burstiness/困惑度代理计分脚本 → **脚本层自动量化门禁**（接现有词频/横向审查脚本旁）；
4. r/WritingWithAI 预防型手法（感官锚点、潜台词、声腔样本注入）→ **写作卡**（生成侧防味优于修味）；
5. 朱雀手动抽样 → **盲测流程步骤**（终稿前人工过一次，非自动化）。

不吸收：训练类（humanize-text）、API 依赖类、多 agent 编排类（patina）。

## 五、Jev 式迁移评估

本地 `桌面根 goutoujunshi-jev` 不存在（仅主仓，grep 无 jev/AI味 内容），GitHub 亦未见该衍生仓——无法核对原判据。按对话体去味判据的一般形态评估：**可迁移**＝短句错落、语气词、禁排比/禁总结腔、口语连接词（适配小说对白与第一人称叙述）；**不可迁移**＝其判据服务社交功能（接住情绪、可退出、废话救场），非散文审美（场景感、感官、潜台词），叙述层仍需散文卡判据补位。建议补交该仓后复核。

## 六、版权与纪律

humanizer（MIT）、说人话（MIT）、Wikipedia Signs of AI writing（CC-BY-SA）：均注来源、只改写为判据不抄提示词原文；本报告仅存链接与手法归纳，沙盘产物不入 A 仓。
