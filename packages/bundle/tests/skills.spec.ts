import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { parse as parseYaml } from 'yaml'
import { NOVEL_TOOL_NAMES, NOVEL_TEST_TOOL_NAMES } from '../src/novel-tools'
import { REFERENCE_TOOL_NAMES } from '../src/reference/tools'

/**
 * 主控+节点+聚合技能（全生命周期 11 份）。
 * 目录名即 frontmatter name（Agent Skills 规范硬要求：name 必须与父目录名一致）。
 */
const EXPECTED_SKILLS: ReadonlyArray<{ readonly name: string; readonly 中文名: string }> = [
  { name: 'novel-director', 中文名: '工作台总控' },
  { name: 'novel-inspiration', 中文名: '灵感与立项' },
  { name: 'novel-design', 中文名: '定调设计' },
  { name: 'novel-outline', 中文名: '细纲备料' },
  { name: 'novel-drafting', 中文名: '正文起草' },
  { name: 'novel-review', 中文名: '全面审读' },
  { name: 'novel-polish', 中文名: '精修润色' },
  { name: 'novel-revision', 中文名: '改稿' },
  { name: 'novel-settle', 中文名: '定稿沉淀' },
  { name: 'novel-export', 中文名: '最小导出' },
  { name: 'novel-analyze', 中文名: '参考小说拆解' },
]

const BLACKLIST = ['家位', '门控', '闭环', '抓手', '世代']

function skillPath(name: string): string {
  return path.join(__dirname, '..', 'skills', name, 'SKILL.md')
}

function readSkill(name: string): string {
  return fs.readFileSync(skillPath(name), 'utf8')
}

const SKILL_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * 解析 SKILL.md frontmatter，走真 YAML 解析而非逐行正则。
 *
 * 必须真解析（2026-09-01 真机实证）：novel-settle 的 description 里含未加引号的
 * `ch: 提交`，YAML 读成嵌套映射直接抛错，dsh 的 parseSkillFile 拿不到 name/description
 * 便 warn-and-drop —— 技能静默不装载，真机上从未生效。而逐行正则不在乎 YAML 合法性，
 * 一路绿灯，所以这个缺陷此前测试完全测不出来。
 */
function readFrontmatter(text: string): Record<string, unknown> {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  if (m === null) throw new Error('缺少 frontmatter')
  const parsed: unknown = parseYaml(m[1]!)
  if (parsed === null || typeof parsed !== 'object') throw new Error('frontmatter 不是映射')
  return parsed as Record<string, unknown>
}

describe('聚合 skills 体系（渐进式披露与 Subagent 协同）', () => {
  it('交付 11 份 SKILL.md，文件名一一对应', () => {
    for (const s of EXPECTED_SKILLS) {
      expect(fs.existsSync(skillPath(s.name)), `${s.name}/SKILL.md 应存在`).toBe(true)
    }
    // 反向核对：磁盘上不得多出未登记的技能。此前《改稿》在盘上却不在表内、
    // 《技法路由》退役后残留也测不出来，都因为只做了单向检查。
    const onDisk = fs
      .readdirSync(path.join(__dirname, '..', 'skills'), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()
    expect(onDisk).toEqual([...EXPECTED_SKILLS.map((s) => s.name)].sort())
  })

  it('工作台总控：含状态校准 + 主控边界 + 节点路由 + 子代理交接 + 章内接续', () => {
    const text = readSkill('novel-director')
    expect(text).toContain('novel_get_story_status')
    expect(text).toContain('状态校准第一律')
    expect(text).toContain('主控六大边界')
    expect(text).toContain('严禁代写正文')
    expect(text).toContain('节点路由')
    expect(text).toContain('novel_create_book')
    expect(text).toContain('Subagent')
    expect(text).toContain('自包含')
    expect(text).toContain('发现项')
    expect(text).toContain('建议稿')
    // 章内接续：机械步骤直接做下一步；决定点（发现项处置/定稿裁决/新选择）仍停稳
    expect(text).toContain('章内接续')
    expect(text).toContain('直接做下一步，不结束回合等一句「继续」')
    expect(text).toContain('不自动开下一章')
  })

  it('中文路由标题对应可加载的 frontmatter name，不能用中文标题调用 skill', () => {
    const director = readSkill('novel-director')
    const routes = [...director.matchAll(/^\| ([^|]+) \| `(novel-[a-z-]+)` \|$/gm)]
    expect(routes).toHaveLength(EXPECTED_SKILLS.length)
    for (const [, title, name] of routes) {
      expect(EXPECTED_SKILLS).toContainEqual({ name, 中文名: title })
      expect(SKILL_NAME_RE.test(name!)).toBe(true)
      expect(readFrontmatter(readSkill(name!)).name).toBe(name)
    }
    expect(director).toContain('{"name":"novel-director"}')
  })

  it('灵感与立项：含三步法 + 七要素 + 建书门槛', () => {
    const text = readSkill('novel-inspiration')
    expect(text).toContain('随手记')
    expect(text).toContain('七要素')
    expect(text).toContain('核心创意')
    expect(text).toContain('差异化')
    expect(text).toContain('禁区')
    expect(text).toContain('novel_create_book')
    expect(text).toContain('快速开写')
    expect(text).not.toContain('novel_seed_min_design')
    expect(text).toContain('未经作者明确同意，严禁进入建书')
  })

  it('定调设计：含契约六部 + 双路径 + 分部更新纪律 + 强制多方向', () => {
    const text = readSkill('novel-design')
    expect(text).toContain('契约六部')
    // 快速开写走起草确认,seed 只供测试/走查,不出现在作者面技能里
    expect(text).toContain('路径 A：快速开写')
    expect(text).not.toContain('novel_seed_min_design')
    expect(text).toContain('novel_update_contract')
    expect(text).toContain('题材与读者定位')
    expect(text).toContain('创作禁区与不可妥协项')
    expect(text).toContain('留白')
    expect(text).toContain('分部更新')
    expect(text).toContain('强制多方向')
    expect(text).toContain('不参与发散')
    expect(text).toContain('典型版')
    expect(text).toContain('代价与放弃项')
    expect(text).toContain('方向选择')
  })

  it('E1 标尺批：参考标尺单源资产落位 + 三消费视图接线 + 审读分档区间', () => {
    // 标尺单源资产：文件存在、头部含单源声明（数值只存标尺,SKILL 与底本不内联）
    const scalePath = path.join(__dirname, '..', 'skills', 'novel-design', 'references', '参考标尺.md')
    expect(fs.existsSync(scalePath), 'novel-design/references/参考标尺.md 应存在').toBe(true)
    const scale = fs.readFileSync(scalePath, 'utf8')
    expect(scale).toContain('反派体系单源声明')
    // 视图接线防回退：SKILL 点名标尺与取数算式,对手梯队/压力升级检查/主战层级行均在
    const design = readSkill('novel-design')
    expect(design).toContain('取数')
    expect(design).toContain('参考标尺')
    expect(design).toContain('对手梯队')
    expect(design).toContain('压力升级检查')
    expect(design).toContain('主战层级')
    // 分卷主战层级表行绝不进「故事阶段分配」——那是 parseVolumeAllocations 的进度解析位
    expect(design).toContain('绝不写进「故事阶段分配」')
    // 审读侧：分档区间在底本定用法（候选不是及格线）,数值随派发材料动态摘录
    const pacing = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-review', '底本', '节奏与张力审读.md'), 'utf8')
    expect(pacing).toContain('分档参考区间')
    expect(pacing).toContain('候选，不是及格线')
  })

  it('E5′ KB 批：净版六件存在带版本戳零标注残留；SKILL §x.y 引用逐一命中分发件标题', () => {
    const refsDir = path.join(__dirname, '..', 'skills', 'novel-design', 'references')
    // 0B 节级索引.yaml 不入包（发行正则只认 md/mjs），节级核验直接解析分发件 §x.y 标题
    const kbFiles = ['01_开书.md', '02_人物设计.md', '03_世界观设计.md', '04_大纲.md', '05_卷纲.md', '0A_第一性原理层.md']
    const chapterFile: Record<string, string> = { '1': '01_开书.md', '2': '02_人物设计.md', '3': '03_世界观设计.md', '4': '04_大纲.md', '5': '05_卷纲.md' }
    const stamp = '> 知识库净版 · 源版本 v2.0.2 · 净版纪律见 docs/design/增强实施计划.md §二'
    const headings = new Map<string, Set<string>>()
    for (const f of kbFiles) {
      const p = path.join(refsDir, f)
      expect(fs.existsSync(p), `novel-design/references/${f} 应存在`).toBe(true)
      const text = fs.readFileSync(p, 'utf8')
      expect(text.startsWith('# '), `${f}: 应以一级标题开头`).toBe(true)
      expect(text, `${f}: 头部应含净版版本戳（唯一元信息）`).toContain(stamp)
      // 净版纪律：分发层只含归纳态方法论——来源行/编者推断/可信度/原话标记/理论锚点一律剥净
      for (const banned of ['**来源**：', '编者推断', '可信度', '内容：原话', '理论锚点']) {
        expect(text, `${f}: 净版不应残留「${banned}」`).not.toContain(banned)
      }
      expect(text.match(/T0\d\d/g), `${f}: 净版不应残留 T 编号理论锚点`).toBeNull()
      headings.set(f.replace('.md', ''), new Set([...text.matchAll(/^## (§[\d.]+)/gm)].map((m) => m[1]!)))
    }
    // 引用一致性：SKILL 里全部 §x.y 引用（判据行/追问卡）逐一反查分发件标题，悬空即失败
    const design = readSkill('novel-design')
    const mentioned = [...new Set([...design.matchAll(/§\d+\.\d+/g)].map((m) => m[0]))]
    expect(mentioned.length, '《定调设计》应含 §x.y 判据引用').toBeGreaterThan(0)
    const dangling = mentioned.filter((ref) => {
      const chapter = ref.slice(1).split('.')[0]!
      const file = chapterFile[chapter]
      return file === undefined || !(headings.get(file.replace('.md', ''))?.has(ref) ?? false)
    })
    expect(dangling, `以下 §x.y 引用在分发件中无对应标题：${dangling.join('、')}`).toEqual([])
    // E5′ 瘦身件防回退：对谈纪律/五步判据行/三张追问卡/种子三百字
    expect(design).toContain('## 对谈纪律')
    expect(design).toContain('判据：读 [01_开书](references/01_开书.md)')
    expect(design).toContain('判据：读 [05_卷纲](references/05_卷纲.md)')
    expect(design).toContain('追问限额')
    expect(design).toContain('金手指四轨道追问')
    expect(design).toContain('暗面一问')
    expect(design).toContain('结局镜像卡')
    expect(design).toContain('书房/开书/<书名>/种子底子.md')
    expect(readSkill('novel-outline'), '《细纲备料》应可带种子底子进材料包').toContain('种子底子')
  })

  it('细纲备料：含定位段/细纲段 + 材料包十段 + 事实播报', () => {
    const text = readSkill('novel-outline')
    expect(text).toContain('定位段')
    expect(text).toContain('细纲段')
    expect(text).toContain('近期窗口')
    expect(text).toContain('材料清单.json')
    expect(text).toContain('条目切片')
    expect(text).toContain('来源与版本')
    expect(text).toContain('不是开写门槛')
    expect(text).toContain('本章形状')
    expect(text).toContain('已排除走向')
    // 任务19:已定稿章细纲勘误走候选→再确认,只改设计工件无需吃书补偿
    expect(text).toContain('已定稿章的细纲勘误')
    expect(text).toContain('窗口条目已消费不影响确认')
    expect(text).toContain('无需吃书补偿')
  })

  it('正文起草：含自包含任务包 + 子代理派发 + 单点重试', () => {
    const text = readSkill('novel-drafting')
    expect(text).toContain('起草子代理')
    expect(text).toContain('自包含')
    expect(text).toContain('确认细纲全文')
    expect(text).toContain('材料包切片')
    expect(text).toContain('文风基准')
    expect(text).toContain('单点重试')
    expect(text).toContain('绝不亲自写正文')
    expect(text).toContain('已排除走向')
  })

  it('定稿沉淀：含三步流程 + 七件 + 作者裁决 + 原子沉淀', () => {
    const text = readSkill('novel-settle')
    expect(text).toContain('novel_prepare_pack')
    expect(text).toContain('novel_settle_chapter')
    expect(text).toContain('待定稿包')
    expect(text).toContain('卷对账')
    expect(text).toContain('作者裁决')
    expect(text).toContain('未获作者明确批准')
    expect(text).toContain('只增不改')
    expect(text).toContain('吃书补偿')
    // 任务21 件一:卷末与卷摘要段(候选脚本＋确认落盘＋待核对不写无偏离)
    expect(text).toContain('卷摘要候选.mjs')
    expect(text).toContain('目标: 卷摘要')
    expect(text).toContain('待核对')
    expect(text).toContain('不设上限、不截断')
  })

  it('全面审读：含 8 维标准 + Subagent 派发指引 + 发现项规范', () => {
    const text = readSkill('novel-review')
    expect(text).toContain('章节结构')
    expect(text).toContain('人物与关系')
    expect(text).toContain('情节与因果')
    expect(text).toContain('信息披露')
    expect(text).toContain('线索与伏笔')
    expect(text).toContain('节奏与张力')
    expect(text).toContain('读者承诺')
    expect(text).toContain('文风与表达')
    expect(text).toContain('Subagent')
    expect(text).toContain('发现项')
    expect(text).toContain('绝不直接修改正文')
  })

  it('精修润色：含 7 道工序 + 保真红线 + 逐道回退机制', () => {
    const text = readSkill('novel-polish')
    expect(text).toContain('去 AI 痕迹')
    expect(text).toContain('语言自然化')
    expect(text).toContain('句段节奏调整')
    expect(text).toContain('对话润色')
    expect(text).toContain('文风贴合')
    expect(text).toContain('冗余精简')
    expect(text).toContain('修辞与意象调整')
    expect(text).toContain('只改表达，不改事实')
    expect(text).toContain('可回退')
  })

  it('最小导出：含范围选择 + 冲突不覆盖 + 清单最后落盘 + 逐字节一致', () => {
    const text = readSkill('novel-export')
    expect(text).toContain('最小导出.mjs')
    expect(text).toContain('已定稿')
    expect(text).toContain('--校验 true')
    expect(text).toContain('不支持原位覆盖')
    expect(text).toContain('校验.ok:true')
    expect(text).toContain('不覆盖')
    expect(text).toContain('逐字节一致')
    expect(text).toContain('SHA-256')
  })

  it('作者介入:五份章节节点技能各含「作者介入」小节与作者稿通道', () => {
    for (const name of ['novel-drafting', 'novel-polish', 'novel-review', 'novel-revision', 'novel-settle']) {
      const text = readSkill(name)
      expect(text, `${name}: 含「作者介入」小节`).toContain('## 作者介入')
    }
    expect(readSkill('novel-drafting')).toContain('作者手写')
    expect(readSkill('novel-revision')).toContain('novel_apply_revision_batch')
    expect(readSkill('novel-settle')).toContain('底本/沉淀对账.md')
  })

  it('零机器味：SKILL 与底本/工序全部不含黑名单词', () => {
    const walkMd = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name)
        return e.isDirectory() ? walkMd(p) : e.name.endsWith('.md') ? [p] : []
      })
    for (const f of walkMd(path.join(__dirname, '..', 'skills'))) {
      const text = fs.readFileSync(f, 'utf8')
      for (const w of BLACKLIST) {
        expect(text, `${path.basename(f)}: 不应含「${w}」`).not.toContain(w)
      }
    }
  })

  it('frontmatter：name 合法且与父目录名一致 + 非空中文 description', () => {
    for (const s of EXPECTED_SKILLS) {
      const text = readSkill(s.name)
      // 非法 YAML 在此直接抛错，与 dsh 的 warn-and-drop 静默丢弃形成对照
      const fm = readFrontmatter(text)
      const name = fm['name']
      const description = fm['description']
      expect(typeof name, `${s.中文名}: name 应是字符串`).toBe('string')
      expect(typeof description, `${s.中文名}: description 应是字符串`).toBe('string')
      if (typeof name === 'string' && typeof description === 'string') {
        expect(SKILL_NAME_RE.test(name), `${s.中文名}: name 应是英文 kebab-case`).toBe(true)
        expect(name, `${s.中文名}: name 应与父目录名一致`).toBe(s.name)
        expect(name.length, `${s.中文名}: name ≤64`).toBeLessThanOrEqual(64)
        expect(description.trim().length, `${s.中文名}: description 非空`).toBeGreaterThan(0)
        expect(description.length, `${s.中文名}: description ≤1024`).toBeLessThanOrEqual(1024)
        expect(description, `${s.中文名}: description 中文`).toMatch(/[一-鿿]/)
      }
    }
  })

  it('工具文档覆盖：作者环境注册的每个工具名至少在一篇技能 .md 中出现（边界匹配）', () => {
    // 递归收集 skills/ 下全部 .md（SKILL.md、底本/、工序/、scripts/ 等）
    const walkMd = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name)
        return e.isDirectory() ? walkMd(p) : e.name.endsWith('.md') ? [p] : []
      })
    const files = walkMd(path.join(__dirname, '..', 'skills'))
    expect(files.length, 'skills/ 下应收集到 .md 文档').toBeGreaterThan(0)
    const corpus = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n')
    // 测试专用工具（NOVEL_TEST_TOOL_NAMES）不在作者环境注册，不要求文档覆盖
    const authorTools = NOVEL_TOOL_NAMES.filter((name) => !NOVEL_TEST_TOOL_NAMES.includes(name))
    // 边界匹配防前缀假覆盖：只提 novel_apply_revision_batch 不算覆盖 novel_apply_revision
    const mentions = (name: string) => new RegExp(`${name}(?![a-z_])`).test(corpus)
    // 工具只在运行时 description 里自我介绍、技能文档零提及时，模型行为没有文档锚点
    // （案底：novel_editor_suggest 曾是孤儿工具）。失败信息列出未覆盖工具名，方便后人修。
    const uncovered = authorTools.filter((name) => !mentions(name))
    expect(uncovered, `以下工具注册于作者环境却未出现在任何技能 .md 中：${uncovered.join('、')}`).toEqual([])
  })

  it('工具文档零悬空：技能 .md 提及的每个 novel_* 工具名必须真实注册或属白名单', () => {
    const walkMd = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name)
        return e.isDirectory() ? walkMd(p) : e.name.endsWith('.md') ? [p] : []
      })
    const mentioned = new Set<string>()
    for (const f of walkMd(path.join(__dirname, '..', 'skills'))) {
      for (const m of fs.readFileSync(f, 'utf8').matchAll(/novel_[a-z_]+/g)) mentioned.add(m[0])
    }
    // 白名单：novel-director 的否定式提及（明说"当前无此工具，不虚构调用"）、
    // `novel_reference_*` 族称（总控用通配符指代四组参考工具）与测试专用工具
    const whitelist = new Set(['novel_ledger_query', 'novel_memory_query', 'novel_reference_', ...NOVEL_TEST_TOOL_NAMES])
    const registered = new Set<string>([...NOVEL_TOOL_NAMES, ...REFERENCE_TOOL_NAMES])
    const dangling = [...mentioned].filter((name) => !whitelist.has(name) && !registered.has(name))
    // 防前缀截断误报：提及串是注册名前缀（文档省略了后缀）也算悬空——逐条精确对表
    expect(dangling, `技能文档提及了不存在于注册表的工具：${dangling.join('、')}`).toEqual([])
  })
})
