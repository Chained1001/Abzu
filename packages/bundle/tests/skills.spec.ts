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
    const pacing = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-review', 'agents', '节奏与张力审读.md'), 'utf8')
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

  it('KB 06/07/08 批：净版三件存在带版本戳零标注残留；outline/drafting/director 三 SKILL §x.y 引用逐一命中分发件标题', () => {
    // 域随技能走：06→novel-outline、07→novel-drafting、08→novel-director；引用测试逻辑与 E5′ 一致，只扩解析范围
    const kbChapters: ReadonlyArray<{ readonly skill: string; readonly file: string; readonly chapter: string }> = [
      { skill: 'novel-outline', file: '06_章纲.md', chapter: '6' },
      { skill: 'novel-drafting', file: '07_正文写作.md', chapter: '7' },
      { skill: 'novel-director', file: '08_修订排障.md', chapter: '8' },
    ]
    const stamp = '> 知识库净版 · 源版本 v2.0.2 · 净版纪律见 docs/design/增强实施计划.md §二'
    // 章→分发件全映射（1-5 在 novel-design），三 SKILL 里出现的任何 §x.y 都要能落到对应文件
    const chapterFile: Record<string, { skill: string; file: string }> = {
      '1': { skill: 'novel-design', file: '01_开书.md' }, '2': { skill: 'novel-design', file: '02_人物设计.md' },
      '3': { skill: 'novel-design', file: '03_世界观设计.md' }, '4': { skill: 'novel-design', file: '04_大纲.md' },
      '5': { skill: 'novel-design', file: '05_卷纲.md' }, '6': { skill: 'novel-outline', file: '06_章纲.md' },
      '7': { skill: 'novel-drafting', file: '07_正文写作.md' }, '8': { skill: 'novel-director', file: '08_修订排障.md' },
    }
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
      const dangling = mentioned.filter((ref) => {
        const target = chapterFile[ref.slice(1).split('.')[0]!]
        return target === undefined || !headingsOf(target.skill, target.file).has(ref)
      })
      expect(dangling, `${skill} SKILL 的以下 §x.y 引用在分发件中无对应标题：${dangling.join('、')}`).toEqual([])
      expect(headingsOf(skill, file).size, `${file}: §x.y 标题数应大于零`).toBeGreaterThan(0)
    }
    // 接线防回退：三 SKILL 判据行＋排障索引入口＋改稿章程内联摘要（跨包引用不可达，走内联方案）
    expect(readSkill('novel-outline')).toContain('判据：读 [06_章纲](references/06_章纲.md)')
    expect(readSkill('novel-outline')).toContain('按 `## §x.y` 标题定位后只读该节，不整文件读入')
    const checks = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-outline', 'agents', '写前十查.md'), 'utf8')
    expect(checks).toContain('判据延伸：读 [06_章纲](../references/06_章纲.md) §6.1')
    expect(readSkill('novel-drafting')).toContain('判据：读 [07_正文写作](references/07_正文写作.md) §7.1')
    expect(readSkill('novel-drafting')).toContain('按当前场景选择性引用')
    expect(readSkill('novel-drafting')).toContain('§7.13（中文行文怎么不怪异')
    expect(readSkill('novel-director')).toContain('[08_修订排障](references/08_修订排障.md) 的 **§8.0 排障索引**')
    expect(readSkill('novel-director')).toContain('「中期崩盘」→§8.8')
    const charter = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-revision', 'agents', '改稿章程.md'), 'utf8')
    expect(charter).toContain('改稿方向判据（内联摘要）')
    expect(charter).toContain('完整判据在 novel-director 技能包的 references/08_修订排障.md')
    // 跨包相对链接在 DSH resourceBase 解析语义下不可达（技能基目录的 ../../ 逃出 skills 树）且章程整体内联进隔离子代理——禁用链接形态
    expect(charter, '改稿章程不得用跨包相对链接').not.toContain('](../')
  })

  it('E3 写作管线批：写前十查底本＋细纲固定小节＋连写三档＋热回看＋篇幅三岔＋四级扫描', () => {
    // 写前十查：底本存在，机器四查＋过目单六查＋「呈确认前的检查不是门禁」纪律
    const tenChecks = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-outline', 'agents', '写前十查.md'), 'utf8')
    expect(tenChecks).toContain('机器四查')
    expect(tenChecks).toContain('过目单六查')
    expect(tenChecks).toContain('不是门禁')
    expect(tenChecks).toContain('预期兑现区间')
    expect(tenChecks).toContain('重启条件')
    // 细纲固定小节：冲突与爽点/章末双钩＋既有节固定行＋可选单元增补不参与确认校验
    const outline = readSkill('novel-outline')
    expect(outline).toContain('写前十查')
    expect(outline).toContain('`### 冲突与爽点`')
    expect(outline).toContain('`### 章末双钩`')
    expect(outline).toContain('信息预算四行')
    expect(outline).toContain('本章新埋：零')
    expect(outline).toContain('不参与确认校验')
    // 连写三档＋差异呈报＋回归简报＋手写章回流（novel-director）
    const director = readSkill('novel-director')
    expect(director).toContain('单章委托')
    expect(director).toContain('连写授权')
    expect(director).toContain('到点收尾')
    expect(director).toContain('差异呈报')
    expect(director).toContain('回归简报')
    expect(director).toContain('novel_import_draft')
    // 热回看＋手写回流反推细纲（novel-drafting）
    const drafting = readSkill('novel-drafting')
    expect(drafting).toContain('交稿自查（热回看）')
    expect(drafting).toContain('热回查：POV✓ 禁入✓ 事实✓')
    expect(drafting).toContain('手写回流反推细纲')
    expect(drafting).toContain('不可先审读后补细纲')
    // 篇幅三岔（novel-review SKILL）＋冷回看判据增补（全量＋单维底本）
    const review = readSkill('novel-review')
    expect(review).toContain('篇幅处置建议分级')
    expect(review).toContain('事件膨胀法')
    expect(review).toContain('一次净删')
    const sweep = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-review', 'agents', '全量审读.md'), 'utf8')
    expect(sweep).toContain('主角＋处境＋钩')
    expect(sweep).toContain('章末双钩')
    expect(sweep).toContain('契约四问')
    expect(sweep).toContain('证伪式检查')
    const infoDim = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-review', 'agents', '信息披露审读.md'), 'utf8')
    expect(infoDim).toContain('多给了')
    expect(infoDim).toContain('漏给了')
    expect(infoDim).toContain('应忘锚点')
    // polish 四级扫描定位表＋段长方差检查
    const clean = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-polish', 'references', '1-表达清理.md'), 'utf8')
    expect(clean).toContain('tier1')
    expect(clean).toContain('tier2')
    expect(clean).toContain('tier3')
    expect(clean).toContain('tier4')
    expect(clean).toContain('命中≠错误，不打分，不为清零改稿')
    const reshape = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-polish', 'references', '2-节奏与重塑.md'), 'utf8')
    expect(reshape).toContain('段长方差检查')
    expect(reshape).toContain('脚本未实装')
  })

  it('思考增强批：design 全景开场/待改清单/跨轨道自检/卷级交叉思考/规则连锁＋outline 写时整合＋drafting 写作心智', () => {
    // 大纲阶段三件：路径 B 全景开场＋对谈纪律第 7 条待改清单＋步骤 5/6 之间跨轨道自检
    const design = readSkill('novel-design')
    expect(design).toContain('全景开场')
    expect(design).toContain('待改清单')
    expect(design).toContain('跨轨道自检')
    // 卷纲：步骤 6 判据行后的卷级交叉思考
    expect(design).toContain('卷级交叉思考')
    // 设定：步骤 2 判据行后的规则连锁
    expect(design).toContain('规则连锁')
    // 章纲：步骤 2 落候选末尾的写时整合
    expect(readSkill('novel-outline')).toContain('写时整合')
    // 起草：任务包第 0 件写作心智＋三条心智防回退
    const drafting = readSkill('novel-drafting')
    expect(drafting).toContain('写作心智')
    expect(drafting).toContain('入戏')
    expect(drafting).toContain('一气呵成')
    expect(drafting).toContain('角色自决')
  })

  it('0.0.13 方法论提卡批：标尺触发时机重映射＋四判据接线＋呈报表合并＋路径 A 适用面＋旧格式降级＋灵感域接线＋体感回灌', () => {
    // A. 标尺触发时机列：CC 仓坐标词零命中（fork 不存在的消费位），新消费位逐行在位
    const scale = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-design', 'references', '参考标尺.md'), 'utf8')
    for (const cc of ['批1 A.3', '编辑评审 E1', '卷纲评审']) {
      expect(scale, `参考标尺不应残留 CC 仓坐标「${cc}」`).not.toContain(cc)
    }
    expect(scale).toContain('章纲·写前十查⑥爽点铺垫＋审读·节奏与张力维')
    expect(scale).toContain('卷纲·卷级交叉思考（伏笔兑现×读者期待）')
    expect(scale).toContain('章纲·写前十查⑤平章检查')
    expect(scale).toContain('卷纲·卷级交叉思考（换图×世界观扩展）')
    expect(scale).toContain('审读·线索与伏笔维（对照账本线索到期）')
    expect(scale).toContain('卷纲·卷级交叉思考；章级脚本未实装（未接线）')
    // B. 四处缺失判据引用接线（§x.y 逐一反查由既有引用一致性测试自动扩展覆盖）
    expect(readSkill('novel-outline')).toContain('§6.7（信息怎么分配')
    expect(readSkill('novel-design')).toContain('§5.3（本卷大高潮怎么设')
    expect(readSkill('novel-drafting')).toContain('§7.5（叙述视角技术')
    const checks = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-outline', 'agents', '写前十查.md'), 'utf8')
    expect(checks).toContain('02_人物设计 §2.18')
    expect(checks).toContain('03_世界观设计 §3.9')
    expect(checks).toContain('完整版在《定调设计》技能包')
    expect(checks, '写前十查不得用跨包相对链接（02/03 在 novel-design 包）').not.toContain('](../novel-design')
    // C1. 呈确认件统一格式：门槛＋十查双轨合并一张表
    const outline = readSkill('novel-outline')
    expect(outline).toContain('呈确认件统一格式')
    expect(outline).toContain('失败＝工具必拒，改完再呈')
    expect(outline).toContain('两类检查一张表呈报，别分成两轮')
    expect(checks).toContain('别分成两轮')
    // C2. 路径 A 增强件适用面
    expect(readSkill('novel-design')).toContain('路径 A 同样执行')
    // C3. 旧细纲格式降级规则
    const sweep = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-review', 'agents', '全量审读.md'), 'utf8')
    expect(sweep).toContain('节缺失（旧格式）')
    expect(sweep).toContain('不为格式差异产出伪缺陷')
    // C5. 卷末体感回灌
    expect(readSkill('novel-settle')).toContain('本卷写作过程有什么踩坑或方法论不对的地方')
    expect(readSkill('novel-settle')).toContain('下次开卷时对齐')
    // D. 灵感域两处轻接线（可选判据不阻塞＋书名候选步）
    const inspiration = readSkill('novel-inspiration')
    expect(inspiration).toContain('收敛时可参考（可选）')
    expect(inspiration).toContain('§1.2（读者画像三空')
    expect(inspiration).toContain('§1.9（一句话故事四要素')
    expect(inspiration).toContain('§1.7（元素组合出新意')
    expect(inspiration).toContain('未加载不阻塞')
    expect(inspiration).toContain('（可选）作者需要起书名时')
    expect(inspiration).toContain('三条路各 1-2 个（反差公式/堆标签/动词情绪）')
    expect(inspiration).toContain('再生成一轮')
  })

  it('0.0.14 世界书模板批：三模板落位＋三端接线＋认知节独立于事实切片', () => {
    // A. 三模板存在：人物档案/世界规则/力量体系——只管正文骨架,frontmatter 约定不变,留白合法
    const tplDir = path.join(__dirname, '..', 'skills', 'novel-design', 'templates', '世界书')
    const tpl: Record<string, string> = {}
    for (const name of ['人物档案', '世界规则', '力量体系']) {
      const p = path.join(tplDir, `${name}条目模板.md`)
      expect(fs.existsSync(p), `novel-design/templates/世界书/${name}条目模板.md 应存在`).toBe(true)
      tpl[name] = fs.readFileSync(p, 'utf8')
      expect(tpl[name], `${name}模板: 应声明 frontmatter 约定不变`).toContain('frontmatter 照世界书既有约定')
      expect(tpl[name], `${name}模板: 应声明留白合法`).toContain('留白合法')
    }
    // B. 人物档案：三支柱判据词（欲望根/外在目标/致命弱点）＋声线＋认知节四行
    expect(tpl['人物档案']).toContain('欲望根')
    expect(tpl['人物档案']).toContain('外在目标')
    expect(tpl['人物档案']).toContain('致命弱点')
    expect(tpl['人物档案']).toContain('口癖')
    expect(tpl['人物档案']).toContain('### 认知')
    for (const line of ['知道：', '怀疑：', '隐瞒：', '称呼：']) {
      expect(tpl['人物档案'], `人物档案认知节应含「${line}」行`).toContain(line)
    }
    // 认知节是独立小节,标题不得与沉淀事实切片标记（### 事实@第N章）冲突
    expect(tpl['人物档案']).not.toContain('### 事实@')
    // C. 世界规则：铁则表行与写前十查②「规则行」语义对齐＋暗面四行（「打破条件」列名对齐参考标尺）
    expect(tpl['世界规则']).toContain('铁则表')
    expect(tpl['世界规则']).toContain('规则行')
    for (const line of ['谁在受害：', '成本：', '例外：', '打破条件：']) {
      expect(tpl['世界规则'], `世界规则暗面应含「${line}」行`).toContain(line)
    }
    // D. 力量体系：境界表四列＋金手指轨道位＋对手梯队映射；台阶数值只引标尺不内联
    expect(tpl['力量体系']).toContain('| 台阶 | 名称 | 能力边界 | 越级条件 |')
    expect(tpl['力量体系']).toContain('金手指轨道位')
    expect(tpl['力量体系']).toContain('对手梯队映射')
    expect(tpl['力量体系']).toContain('references/参考标尺.md')
    expect(tpl['力量体系'], '力量体系模板不得内联标尺台阶数值（单源在参考标尺）').not.toContain('8-10')
    // E. 三端接线：design 双路径引用三模板；settle 认知节增量维护；写前十查②数据源指明
    const design = readSkill('novel-design')
    expect(design).toContain('[人物档案条目模板](templates/世界书/人物档案条目模板.md)')
    expect(design).toContain('[世界规则条目模板](templates/世界书/世界规则条目模板.md)')
    expect(design).toContain('[力量体系条目模板](templates/世界书/力量体系条目模板.md)')
    expect(design).toContain('留白合法，不强制填满')
    const settle = readSkill('novel-settle')
    expect(settle).toContain('### 认知')
    expect(settle).toContain('新知道、称呼变化、新隐瞒')
    expect(settle).toContain('novel_confirm_worldbook_entry')
    const checks = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-outline', 'agents', '写前十查.md'), 'utf8')
    expect(checks).toContain('世界书/力量体系/')
    expect(checks).toContain('境界表与金手指轨道位')
    expect(checks).toContain('世界书/世界规则/')
    expect(checks).toContain('铁则表')
  })

  it('0.0.15 补强批：时间行＋核心情绪前→后＋激励事件三问＋反派正当性两问＋待回填协议', () => {
    // A1. 时间行：细纲固定行含时间行（起止＋上章末衔接）；写前十查④接钩预检带时间衔接核对
    const outline = readSkill('novel-outline')
    expect(outline).toContain('时间行')
    const checks = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-outline', 'agents', '写前十查.md'), 'utf8')
    expect(checks).toContain('时间行的上章末时间衔接')
    // A2. 核心情绪前→后：情绪节固定行（SKILL＋规格模板）＋⑨与落点行的分工区分
    expect(outline).toContain('核心情绪前→后')
    const sect = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-outline', 'templates', '章细纲固定小节规格.md'), 'utf8')
    expect(sect).toContain('核心情绪前→后')
    expect(checks).toContain('前→后是位移')
    expect(checks).toContain('落点是读者离开时带什么')
    // A3. 激励事件三问：KB 锚 §4.12（04_大纲.md 标题存在由引用一致性测试另守），三要素措辞对齐
    const design = readSkill('novel-design')
    expect(design).toContain('激励事件三问')
    expect(design).toContain('时机压力')
    expect(design).toContain('命中必然')
    expect(design).toContain('无法回避')
    expect(design).toContain('§4.12')
    // A4. 反派正当性两问：KB 锚 §2.10（02_人物设计.md 标题存在由引用一致性测试另守）
    expect(design).toContain('立场正当性')
    expect(design).toContain('体量正当性')
    expect(design).toContain('§2.10')
    // A5. 待回填协议：design 条目起稿处＋settle 认知节维护处——不强制回填、写入时补缺节、不重写未变动条目
    expect(design).toContain('不强制回填旧条目')
    expect(design).toContain('不为回填主动重写未变动条目')
    const settle = readSkill('novel-settle')
    expect(settle).toContain('不强制回填旧条目')
    expect(settle).toContain('按当版模板补齐缺节')
    expect(settle).toContain('不为回填重写未变动内容')
  })

  it('0.0.17 模板拆出批：组织/地图条目模板＋三份规格模板拆位＋SKILL 引用＋注册单源', () => {
    // A. 组织/地图条目模板存在：风格对齐既有三份（frontmatter 约定不变＋留白合法）
    const tplDir = path.join(__dirname, '..', 'skills', 'novel-design', 'templates', '世界书')
    for (const name of ['组织', '地图']) {
      const p = path.join(tplDir, `${name}条目模板.md`)
      expect(fs.existsSync(p), `novel-design/templates/世界书/${name}条目模板.md 应存在`).toBe(true)
      const t = fs.readFileSync(p, 'utf8')
      expect(t).toContain('frontmatter 照世界书既有约定')
      expect(t).toContain('留白合法')
    }
    // 组织模板承接反派两问词汇；地图模板喂换图 SOP（只引标尺不重写数值）
    const org = fs.readFileSync(path.join(tplDir, '组织条目模板.md'), 'utf8')
    expect(org).toContain('立场正当性')
    expect(org).toContain('体量正当性')
    const map = fs.readFileSync(path.join(tplDir, '地图条目模板.md'), 'utf8')
    expect(map).toContain('换图 SOP')
    expect(map).toContain('references/参考标尺.md')
    expect(map).toContain('人物、关系、地点、组织、规则、物件')
    // B. design 条目起稿处五份模板列全（含路径 A 的五份计数行）
    const design = readSkill('novel-design')
    expect(design).toContain('[组织条目模板](templates/世界书/组织条目模板.md)')
    expect(design).toContain('[地图条目模板](templates/世界书/地图条目模板.md)')
    expect(design).toContain('人物档案/世界规则/力量体系/组织/地图五份')
    // C. 规格模板拆位：三份存在＋规格细节在模板（表列/取数算式/四核对项）＋双 SKILL 各带一行引用
    const ladder = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-design', 'templates', '对手梯队子表规格.md'), 'utf8')
    expect(ladder).toContain('取数：标尺·固定层＋比例层×衰减×题材')
    expect(ladder).toContain('| 层级 | 存活周期 | 代表对手 | 出牌与去向 |')
    expect(design).toContain('[对手梯队子表规格](templates/对手梯队子表规格.md)')
    const vol = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-design', 'templates', '卷纲固定段规格.md'), 'utf8')
    expect(vol).toContain('压力升级检查')
    expect(vol).toContain('终局暗手')
    expect(vol).toContain('方向选择')
    expect(design).toContain('[卷纲固定段规格](templates/卷纲固定段规格.md)')
    const sect = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-outline', 'templates', '章细纲固定小节规格.md'), 'utf8')
    expect(sect, '章细纲固定小节规格：四固定小节＋时间行＋前→后＋既有断言词全量在位').toContain('### 冲突与爽点')
    expect(sect).toContain('### 章末双钩')
    expect(sect).toContain('信息预算四行')
    expect(sect).toContain('本章新埋：零')
    expect(sect).toContain('时间行')
    // D. 注册单源：artifact-contract 登记五份条目模板（世界书模板经名字数组拼路径）＋三份规格模板
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    expect(contract).toContain("['人物档案', '世界规则', '力量体系', '组织', '地图']")
    for (const rel of [
      'skills/novel-design/templates/对手梯队子表规格.md',
      'skills/novel-design/templates/卷纲固定段规格.md',
      'skills/novel-outline/templates/章细纲固定小节规格.md',
    ]) {
      expect(contract, `artifact-contract 应登记 ${rel}`).toContain(`'${rel}'`)
    }
  })

  it('雷点清单批：清单落位＋契约第六部候选菜单＋写前十查内联快扫', () => {
    const p = path.join(__dirname, '..', 'skills', 'novel-design', 'references', '雷点清单.md')
    expect(fs.existsSync(p), '雷点清单.md 应存在').toBe(true)
    const text = fs.readFileSync(p, 'utf8')
    for (const cat of ['感情线', '人设', '爽点战力', '剧情', '叙事信息', '节奏兑现', '文笔']) {
      expect(text, `雷点清单应含「${cat}」类节`).toContain(cat)
    }
    expect(text).toContain('绿帽')
    expect(text).toContain('圣母')
    expect(text).toContain('多源共识')
    expect(text).toContain('知识库§')
    const design = readSkill('novel-design')
    expect(design).toContain('[雷点清单](references/雷点清单.md)')
    const checks = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-outline', 'agents', '写前十查.md'), 'utf8')
    expect(checks).toContain('雷点快扫')
    expect(checks).toContain('references/雷点清单.md')
    const outline = readSkill('novel-outline')
    expect(outline).toContain('雷点快扫行')
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
