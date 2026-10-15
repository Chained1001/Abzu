import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { spawnSync } from 'node:child_process'
import { parse as parseYaml } from 'yaml'
import { NOVEL_TOOL_NAMES, NOVEL_TEST_TOOL_NAMES, createNovelTools } from '../src/novel-tools'
import { REFERENCE_TOOL_NAMES } from '../src/reference/tools'
import { readSkill, skillPath } from './skill-test-helpers'

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

describe('聚合 skills 体系（常驻结构契约）', () => {
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
    // P1 瘦身：书房/记忆/检索/上层规划细则下沉 references，SKILL 只留引用行＋手写回流行为指令
    const studyRef = path.join(__dirname, '..', 'skills', 'novel-director', 'references', '书房与检索.md')
    expect(fs.existsSync(studyRef), 'novel-director/references/书房与检索.md 应存在').toBe(true)
    expect(text).toContain('[书房与检索](references/书房与检索.md)')
    expect(text, '手写章回流引导必须留在 SKILL 本体（行为指令不下沉）').toContain('无既有草稿目录/无审核记录的新章手稿')
    expect(text).toContain('novel_import_draft')
    // 常驻体量上限：调度核心之外的内容走按需读取，SKILL 本体不得超过 8500 字符
    expect(text.length, `SKILL 本体 ${text.length} 字符，超过瘦身上限 8500`).toBeLessThanOrEqual(8500)
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

  it('E5′ KB 批：净版本域件存在带版本戳零标注残留；SKILL §x.y 引用逐一命中分发件标题（v2.4.1 节图全局化）', () => {
    const refsDir = path.join(__dirname, '..', 'skills', 'novel-design', 'references')
    // 0B 节级索引.yaml 不入包（发行正则只认 md/mjs），节级核验直接解析分发件 §x.y 标题
    // v2.4.1 阶段1：04/05 拆为 8 件（§4.11 存根件在 novel-outline）；v2.4.2 阶段2：02 拆为 6 件；v2.4.3 阶段3：01/03 拆为 8 件（§1.10 跨域移入《大纲-牌局与结构检查》，design 包全拆分件化）；v2.4.4 阶段4：06 拆 3 件＋存根归位、07 拆 6 件；v2.4.5 阶段5a：08 拆 3 件入 novel-director、0A 退役出清单；节图改全局收集
    const stamp = '> 知识库净版 · 源版本 v2.4.7 · 净版纪律见 docs/标准/技能编写规范.md'
    const kbFiles: ReadonlyArray<{ readonly dir: string; readonly file: string }> = [
      ...['开书-构思与验证.md', '开书-读者与情绪定位.md', '开书-书名与简介.md', '开书-参考作品利用.md', '人物设计-主角.md', '人物设计-金手指设计.md', '人物设计-配角与群像.md', '人物设计-反派.md', '人物设计-弧光与关系.md', '人物设计-人物卡工具.md', '世界观-规则与铁则.md', '世界观-力量体系与天花板.md', '世界观-地图与势力.md', '世界观-经济与原创性.md', '大纲-主线与骨架.md', '大纲-激励事件与首尾.md', '大纲-换图与支线.md', '大纲-伏笔埋收.md', '大纲-牌局与结构检查.md', '卷纲-卷功能与结构.md', '卷纲-节奏与高潮.md', '卷纲-情节类型骨架.md'].map((file) => ({ dir: refsDir, file })),
      { dir: path.join(__dirname, '..', 'skills', 'novel-outline', 'references'), file: '章纲-信息与情绪.md' },
    ]
    const headings = new Set<string>()
    for (const { dir, file: f } of kbFiles) {
      const p = path.join(dir, f)
      expect(fs.existsSync(p), `references/${f} 应存在`).toBe(true)
      const text = fs.readFileSync(p, 'utf8')
      expect(text.startsWith('# '), `${f}: 应以一级标题开头`).toBe(true)
      expect(text, `${f}: 头部应含净版版本戳（唯一元信息）`).toContain(stamp)
      // 净版纪律：分发层只含归纳态方法论——来源行/编者推断/可信度/原话标记/理论锚点一律剥净
      for (const banned of ['**来源**：', '编者推断', '可信度', '内容：原话', '理论锚点']) {
        expect(text, `${f}: 净版不应残留「${banned}」`).not.toContain(banned)
      }
      expect(text.match(/T0\d\d/g), `${f}: 净版不应残留 T 编号理论锚点`).toBeNull()
      for (const m of text.matchAll(/^## (§[\d.]+)/gm)) headings.add(m[1]!)
    }
    // 引用一致性：SKILL 里全部 §x.y 引用（判据行/追问卡）逐一反查全局节图，悬空即失败
    const design = readSkill('novel-design')
    const mentioned = [...new Set([...design.matchAll(/§\d+\.\d+/g)].map((m) => m[0]))]
    expect(mentioned.length, '《定调设计》应含 §x.y 判据引用').toBeGreaterThan(0)
    const dangling = mentioned.filter((ref) => !headings.has(ref))
    expect(dangling, `以下 §x.y 引用在分发件中无对应标题：${dangling.join('、')}`).toEqual([])
    // E5′ 瘦身件防回退：对谈纪律/五步判据行/三张追问卡/种子三百字
    expect(design).toContain('## 对谈纪律')
    expect(design).toContain('判据：读 [开书-读者与情绪定位](references/开书-读者与情绪定位.md)')
    expect(design).toContain('判据：读 [卷纲-节奏与高潮](references/卷纲-节奏与高潮.md)')
    expect(design).toContain('追问限额')
    expect(design).toContain('金手指四轨道追问')
    expect(design).toContain('暗面一问')
    //（0.0.40 心智批·设计：结局镜像卡并入「首尾镜像」——断言随裁同步；0.0.42 判据微修批：钉加粗体星号与 batches 侧统一）
    expect(design).toContain('**首尾镜像**')
    expect(design).toContain('书房/开书/<书名>/种子底子.md')
    expect(readSkill('novel-outline'), '《细纲备料》应可带种子底子进材料包').toContain('种子底子')
  })

  it('KB 08 批＋章纲/正文拆分件批：净版件存在带版本戳零标注残留；outline/drafting/director 三 SKILL §x.y 引用逐一命中分发件标题', () => {
    // 域随技能走：06 拆 4 件→novel-outline（存根归位）、07 拆 6 件→novel-drafting、08 拆 3 件→novel-director（v2.4.5 阶段5a）、0A 退役；引用测试逻辑与 E5′ 一致，只扩解析范围
    const kbChapters: ReadonlyArray<{ readonly skill: string; readonly file: string; readonly chapter: string }> = [
      ...['章纲-章型与开篇.md', '章纲-冲突与爽点.md', '章纲-场景与节奏.md', '章纲-信息与情绪.md'].map((file) => ({ skill: 'novel-outline', file, chapter: '6' })),
      ...['正文-展示与对白.md', '正文-场景与动作.md', '正文-视角落地.md', '正文-文笔修炼.md', '正文-开场转场与特殊戏.md', '正文-中文行文规范.md'].map((file) => ({ skill: 'novel-drafting', file, chapter: '7' })),
      ...['排障-索引与改稿流程.md', '排障-专项修复.md', '排障-长篇防崩.md'].map((file) => ({ skill: 'novel-director', file, chapter: '8' })),
    ]
    const stamp = '> 知识库净版 · 源版本 v2.4.7 · 净版纪律见 docs/标准/技能编写规范.md'
    // v2.4.1 阶段1：§4.x/§5.x 分驻拆分件、v2.4.2 阶段2：§2.x 分驻人物件、v2.4.3 阶段3：§1.x/§3.x 分驻开书/世界观件、v2.4.4 阶段4：§6.x/§7.x 分驻章纲/正文件、v2.4.5 阶段5a：§8.x 分驻排障三件＋0A 退役——节图全局化（§→所在件集合），取代章→单文件映射；
    // 三 SKILL 里出现的任何 §x.y 都要能落到某个分发件标题
    const kbAllFiles: ReadonlyArray<{ readonly skill: string; readonly file: string }> = [
      ...['开书-构思与验证.md', '开书-读者与情绪定位.md', '开书-书名与简介.md', '开书-参考作品利用.md', '人物设计-主角.md', '人物设计-金手指设计.md', '人物设计-配角与群像.md', '人物设计-反派.md', '人物设计-弧光与关系.md', '人物设计-人物卡工具.md', '世界观-规则与铁则.md', '世界观-力量体系与天花板.md', '世界观-地图与势力.md', '世界观-经济与原创性.md', '大纲-主线与骨架.md', '大纲-激励事件与首尾.md', '大纲-换图与支线.md', '大纲-伏笔埋收.md', '大纲-牌局与结构检查.md', '卷纲-卷功能与结构.md', '卷纲-节奏与高潮.md', '卷纲-情节类型骨架.md'].map((file) => ({ skill: 'novel-design', file })),
      ...['章纲-章型与开篇.md', '章纲-冲突与爽点.md', '章纲-场景与节奏.md'].map((file) => ({ skill: 'novel-outline', file })),
      { skill: 'novel-outline', file: '章纲-信息与情绪.md' },
      ...['正文-展示与对白.md', '正文-场景与动作.md', '正文-视角落地.md', '正文-文笔修炼.md', '正文-开场转场与特殊戏.md', '正文-中文行文规范.md'].map((file) => ({ skill: 'novel-drafting', file })),
      ...['排障-索引与改稿流程.md', '排障-专项修复.md', '排障-长篇防崩.md'].map((file) => ({ skill: 'novel-director', file })),
    ]
    const headingsByFile = new Map<string, Set<string>>()
    const headingsOf = (skill: string, file: string): Set<string> => {
      const key = `${skill}/${file}`
      let set = headingsByFile.get(key)
      if (set === undefined) {
        const text = fs.readFileSync(path.join(__dirname, '..', 'skills', skill, 'references', file), 'utf8')
        set = new Set([...text.matchAll(/^## (§[\d.]+)/gm)].map((m) => m[1]!))
        headingsByFile.set(key, set)
      }
      return set
    }
    const headingsAll = new Set<string>()
    for (const { skill: s, file: fl } of kbAllFiles) for (const h of headingsOf(s, fl)) headingsAll.add(h)
    for (const { skill, file, chapter } of kbChapters) {
      const p = path.join(__dirname, '..', 'skills', skill, 'references', file)
      expect(fs.existsSync(p), `${skill}/references/${file} 应存在`).toBe(true)
      const text = fs.readFileSync(p, 'utf8')
      expect(text.startsWith('# '), `${file}: 应以一级标题开头`).toBe(true)
      expect(text, `${file}: 头部应含净版版本戳（唯一元信息）`).toContain(stamp)
      for (const banned of ['**来源**：', '编者推断', '可信度', '内容：原话', '理论锚点']) {
        expect(text, `${file}: 净版不应残留「${banned}」`).not.toContain(banned)
      }
      expect(text.match(/T0\d\d/g), `${file}: 净版不应残留 T 编号理论锚点`).toBeNull()
      // 引用一致性：SKILL 里全部 §x.y 引用逐一反查分发件标题（跨章引用按全映射落到对应技能包），悬空即失败
      const skillText = readSkill(skill)
      const mentioned = [...new Set([...skillText.matchAll(/§\d+\.\d+/g)].map((m) => m[0]!))]
      expect(mentioned.filter((ref) => ref.slice(1).split('.')[0] === chapter).length,
        `${skill} SKILL 应含 §${chapter}.x 判据引用`).toBeGreaterThan(0)
      const dangling = mentioned.filter((ref) => !headingsAll.has(ref))
      expect(dangling, `${skill} SKILL 的以下 §x.y 引用在分发件中无对应标题：${dangling.join('、')}`).toEqual([])
      expect(headingsOf(skill, file).size, `${file}: §x.y 标题数应大于零`).toBeGreaterThan(0)
    }
    // 接线防回退：三 SKILL 判据行＋排障索引入口＋改稿章程内联摘要（跨包引用不可达，走内联方案）
    expect(readSkill('novel-outline')).toContain('判据：读 [章纲-信息与情绪](references/章纲-信息与情绪.md)')
    expect(readSkill('novel-outline')).toContain('章纲域已全拆分件化，整件读、不按节切读')
    const checks = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-outline', 'agents', '写前十查.md'), 'utf8')
    expect(checks).toContain('判据延伸：读 [章纲-章型与开篇](../references/章纲-章型与开篇.md)')
    expect(readSkill('novel-drafting')).toContain('按卡头节源对应的《正文-*》拆分件整读')
    const cards = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-drafting', 'agents', '写作卡.md'), 'utf8')
    expect(cards).toContain('卡头节源→件对照')
    expect(cards).toContain('§7.13→正文-中文行文规范')
    expect(cards).toContain('§6.2→章纲-章型与开篇')
    expect(readSkill('novel-drafting')).toContain('按当前场景选择性引用')
    expect(readSkill('novel-drafting')).toContain('§7.13（中文行文怎么不怪异')
    expect(readSkill('novel-director')).toContain('[排障-索引与改稿流程](references/排障-索引与改稿流程.md) 的 **§8.0 排障索引**')
    expect(readSkill('novel-director')).toContain('「中期崩盘」→§8.8')
    const charter = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-revision', 'agents', '改稿章程.md'), 'utf8')
    expect(charter).toContain('改稿方向判据（内联摘要）')
    expect(charter).toContain('完整判据在《工作台总控》技能包 references/排障-索引与改稿流程.md')
    // 跨包相对链接在 DSH resourceBase 解析语义下不可达（技能基目录的 ../../ 逃出 skills 树）且章程整体内联进隔离子代理——禁用链接形态
    expect(charter, '改稿章程不得用跨包相对链接').not.toContain('](../')
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
    expect(readSkill('novel-settle')).toContain('agents/沉淀对账.md')
  })

  it('零机器味：SKILL 与 agents/references 全部不含黑名单词', () => {
    const walkMd = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name)
        // assets/ 是数据种子面（灵感库零件卡等采集语料，黑名单词可能作内容词出现），不是指令面——不扫
        return e.isDirectory() ? (e.name === 'assets' ? [] : walkMd(p)) : e.name.endsWith('.md') ? [p] : []
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

  it('frontmatter：全表 invocation 字段值锁定', () => {
    // 11 份技能统一 false/false：模型可加载（director 路由可达）、无用户斜杠入口。
    // 误改任一值会静默改变入口语义（技能变成自然语言触发或冒出斜杠命令），故整表锁定。
    for (const s of EXPECTED_SKILLS) {
      const fm = readFrontmatter(readSkill(s.name))
      expect(fm['disable-model-invocation'], `${s.中文名}: disable-model-invocation 应为 false（模型可加载）`).toBe(false)
      expect(fm['user-invocable'], `${s.中文名}: user-invocable 应为 false（无用户斜杠入口，入口收敛在 director 路由）`).toBe(false)
    }
  })

  it('工具文档覆盖：作者环境注册的每个工具名至少在一篇技能 .md 中出现（边界匹配）', () => {
    // 递归收集 skills/ 下全部 .md（SKILL.md、agents/、references/、scripts/ 等）
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

describe('0.0.31 架构改进批（#4 KB 分发自动化＋#5 novel-tools 按域拆分）', () => {
  const extractScript = path.join(__dirname, '..', 'scripts', 'kb-extract.mjs')
  const stamp = '> 知识库净版 · 源版本 v2.4.7 · 净版纪律见 docs/标准/技能编写规范.md'
  // v2.4.5 阶段5a：08 拆 3 件入 kbPieces、08/0A 整文件退役——kbWhole 清空（分发面已无数字前缀整章件）
  const kbWhole: string[] = []
  const kbPieces = ['开书-构思与验证.md', '开书-读者与情绪定位.md', '开书-书名与简介.md', '开书-参考作品利用.md', '人物设计-主角.md', '人物设计-金手指设计.md', '人物设计-配角与群像.md', '人物设计-反派.md', '人物设计-弧光与关系.md', '人物设计-人物卡工具.md', '世界观-规则与铁则.md', '世界观-力量体系与天花板.md', '世界观-地图与势力.md', '世界观-经济与原创性.md', '大纲-主线与骨架.md', '大纲-激励事件与首尾.md', '大纲-换图与支线.md', '大纲-伏笔埋收.md', '大纲-牌局与结构检查.md', '卷纲-卷功能与结构.md', '卷纲-节奏与高潮.md', '卷纲-情节类型骨架.md', '章纲-信息与情绪.md', '章纲-章型与开篇.md', '章纲-冲突与爽点.md', '章纲-场景与节奏.md', '正文-展示与对白.md', '正文-场景与动作.md', '正文-视角落地.md', '正文-文笔修炼.md', '正文-开场转场与特殊戏.md', '正文-中文行文规范.md', '排障-索引与改稿流程.md', '排障-专项修复.md', '排障-长篇防崩.md']

  it('kb-extract.mjs 存在且 --check 模式全链路可跑：夹具源 --write→--check 退出码 0，篡改→退出码 1', () => {
    expect(fs.existsSync(extractScript), 'packages/bundle/scripts/kb-extract.mjs 应存在').toBe(true)
    // 夹具源：35 件齐全（映射表全覆盖——v2.4.2 起拆分件带件头三要素；v2.4.4 阶段4 06/07 拆 9 件入 kbPieces，存根件阶段 1 已在列不重复计；v2.4.5 阶段5a 08 拆 3 件入 kbPieces、08/0A 出 kbWhole——工单'36'系 34−2+3 误算，实列 35），带来源行/#卡括注/T 编号锚/文末空行四类可剥元素
    const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-extract-spec-'))
    try {
      for (const [i, f] of kbWhole.entries()) {
        fs.writeFileSync(path.join(ws, f), `# 第${i + 1}章 测试\n\n正文一句（卡#1）与锚（T042）。\n\n**来源**：作家实战（卡#1）；内容：原话+归纳｜可信度：高\n\n---\n\n\n`)
      }
      for (const f of kbPieces) {
        fs.writeFileSync(path.join(ws, f), `# ${f.replace(/\.md$/, '')}\n\n> 件定位：测试\n> 消费位：测试\n\n---\n\n正文一句（卡#1）与锚（T042）。\n\n**来源**：作家实战（卡#1）；内容：原话+归纳｜可信度：高\n\n---\n\n\n`)
      }
      const out = path.join(ws, 'out')
      const run = (args: string[]) => spawnSync(process.execPath, [extractScript, ...args], { encoding: 'utf8' })
      const w = run(['--source', ws, '--write', '--out', out])
      expect(w.status, `--write 应退出码 0（stderr: ${w.stderr}）`).toBe(0)
      // 净版产物：版本戳在位、来源行/卡括注/T 锚剥净、文末空行收一
      const cleaned = fs.readFileSync(path.join(out, 'novel-outline', 'references', '章纲-章型与开篇.md'), 'utf8')
      expect(cleaned.startsWith('# 章纲-章型与开篇\n\n')).toBe(true)
      expect(cleaned).toContain(stamp)
      expect(cleaned).not.toContain('**来源**：')
      expect(cleaned).not.toContain('卡#1')
      expect(cleaned).not.toContain('T042')
      expect(cleaned.endsWith('---\n')).toBe(true)
      // --check 对刚写的产物＝逐字节一致（退出码 0）；篡改一件＝漂移（退出码 1）
      expect(run(['--source', ws, '--check', '--out', out]).status).toBe(0)
      fs.appendFileSync(path.join(out, 'novel-outline', 'references', '章纲-章型与开篇.md'), 'x')
      const drifted = run(['--source', ws, '--check', '--out', out])
      expect(drifted.status, '--check 检出漂移应退出码 1').toBe(1)
      expect(drifted.stdout).toContain('漂移')
    } finally {
      fs.rmSync(ws, { recursive: true, force: true })
    }
  })

  const kbSource = process.env.ABZU_KB_SOURCE
  it(`KB 分发件与源逐字节一致${kbSource === undefined ? '（已跳过：未设 ABZU_KB_SOURCE——KB 源目录在仓库外，CI 环境无源；本机设 ABZU_KB_SOURCE 后此用例真比对）' : ''}`, () => {
    if (kbSource === undefined) return
    const r = spawnSync(process.execPath, [extractScript, '--source', kbSource, '--check'], { encoding: 'utf8' })
    expect(r.status, `分发件与 KB 源有漂移（stderr: ${r.stderr}）`).toBe(0)
  })

  it('novel-tools 按域拆分至 src/tools/，兼容薄壳聚合入口工作', () => {
    const toolsDir = path.join(__dirname, '..', 'src', 'tools')
    for (const f of ['shared.ts', 'reference-tools.ts', 'design-tools.ts', 'outline-tools.ts', 'drafting-tools.ts', 'review-tools.ts', 'revision-tools.ts', 'settle-tools.ts', 'index.ts']) {
      expect(fs.existsSync(path.join(toolsDir, f)), `src/tools/${f} 应存在`).toBe(true)
    }
    // 兼容薄壳：外部 import 路径不变，只做再导出
    const shell = fs.readFileSync(path.join(__dirname, '..', 'src', 'novel-tools.ts'), 'utf8')
    expect(shell).toContain("export * from './tools/index'")
    // 聚合入口真跑：注册表经薄壳产出且顺序与名单逐项相等（拆分零行为变化的防回退钉）
    const tools = createNovelTools({ workspaceRoot: () => undefined, bookRootOfBookId: () => undefined })
    expect(tools.map((t) => t.name)).toEqual([...NOVEL_TOOL_NAMES])
  })
})
