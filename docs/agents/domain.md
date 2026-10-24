# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`GLOSSARY.md`** at the repo root.
- **`docs/adr/`**: read ADRs that touch the area you're about to work in.

The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) adds to these lazily, when a term or a decision actually gets resolved — not upfront.

## Where this repo's vocabulary actually lives

**Layout: single-context.** One glossary, one ADR directory, at the repo root. The pnpm workspace has five packages, but `core` is the only one carrying domain language; `drafting`, `polish`, and `review` are thin and each holds a single smoke test. A `GLOSSARY-MAP.md` would only add empty files.

Read `GLOSSARY.md` first. It is the canonical layer: it carries the terms whose meaning is easy to get wrong, the `_Avoid_` lists, and the three genuine homonyms. It deliberately does **not** restate the long product tables — for those, go to the source:

| Vocabulary | Lives in | Scope |
| --- | --- | --- |
| 全量创作域词条（约 55 条） | [产品文档 §9 术语表](../产品/是什么.md) | 产品与书仓语义 |
| 书仓格式：目录结构、状态标注、`定稿/卷NN/` 命名、前后台留白规则 | [标准/书仓格式](../标准/书仓格式.md) | 文件与路径事实 |
| 工程契约：写侧 `throw` / 读侧 `{ok:false, reason}`、真源写入器、导出面纪律 | [标准/工程规范](../标准/工程规范.md) | 代码约定 |

Take terms as `GLOSSARY.md` defines them and don't drift to the synonyms its `_Avoid_` lines reject. Three homonyms are worth stating outright, because each has burned a review round: **真源** means "confirmed book-repo facts" in the product sense but "the single authoritative copy of some datum" in the engineering sense; **回执** (proposal receipt, in-memory, shown to the model) is not **收据** (archive receipt, on disk, proves a commit happened); **审读** (one review run) is not **审核** (the review stage in the chapter flow).

When the concept you need isn't in `GLOSSARY.md` or the tables, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (add it to `GLOSSARY.md` right then — don't batch).

## Flag ADR conflicts

`docs/adr/` holds the accepted architectural decisions. If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0001 (design docs as a fourth class), but worth reopening because…_

Creating one is rare by design: an ADR earns its place only when the decision is **hard to reverse**, **surprising without context**, and **the result of a real trade-off** between genuine alternatives. Two of the three is not enough — put those in the standards instead. Use the `NNNN-slug.md` numbering and keep the body short; a single paragraph plus the rejected alternatives is the usual shape.

The rejected-structural-investments list in `docs/技术/现状.md` §12 第 13 条 records things we decided **not** to do — read it before proposing to restructure those areas; re-suggesting a recorded non-goal wastes a review round.
