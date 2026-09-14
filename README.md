# Abzu

跑在 Claude Code 上的 AI 写作 skill 套件——面向长篇网文的阶段化创作流程。

## 安装

```bash
npx skills add Chained1001/Abzu -y
```

## 使用

只认**标准技能名显式调用**（自然语言提及不触发）：

```text
/abzu-outline     大纲：立项、设定、全书总纲
/abzu-volume      卷纲：单卷规划与收卷判断
/abzu-write       正文：章纲与章节撰写
```

## 文档索引

- 产品设计（业务层）：[docs/product/](docs/product/)——[产品定义](docs/product/产品定义.md)、[架构设计](docs/product/架构设计.md)、[大纲域设计](docs/product/outline/大纲域设计.md)＋分件（[大纲域设计-规格与资料步](docs/product/outline/大纲域设计-规格与资料步.md)、[大纲域设计-草稿步](docs/product/outline/大纲域设计-草稿步.md)、[大纲域设计-打磨定稿步](docs/product/outline/大纲域设计-打磨定稿步.md)、[大纲域设计-附录](docs/product/outline/大纲域设计-附录.md)）、[卷纲域设计](docs/product/volume/卷纲域设计.md)、[正文域设计](docs/product/write/正文域设计.md)、[书目录契约](docs/product/书目录契约.md)、[术语表](docs/product/术语表.md)、[验收场景](docs/product/验收场景.md)
- 开发入口与路由：[AGENTS.md](AGENTS.md)
- 标准：[docs/standards/](docs/standards/)
- 施工机制与规格：[docs/specs/](docs/specs/)

## 许可

[MIT](LICENSE)
