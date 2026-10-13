import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { 材料包十段, 待定稿包七件 } from '@abzu/core'
import { readSkill, skillFile } from './skill-test-helpers'

describe('skills 批次防回退断言组（0.0.14 模板批起）', () => {
  it('E1 标尺批：参考标尺单源资产落位 + 三消费视图接线 + 审读分档区间', () => {
    // 标尺单源资产：文件存在、头部含单源声明（数值只存标尺,SKILL 与底本不内联）
    const scalePath = skillFile('novel-design', 'references/参考标尺.md')
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
    const pacing = fs.readFileSync(skillFile('novel-review', 'agents/节奏与张力审读.md'), 'utf8')
    expect(pacing).toContain('分档参考区间')
    expect(pacing).toContain('候选，不是及格线')
  })

  it('E3 写作管线批：写前十查底本＋细纲固定小节＋连写三档＋热回看＋篇幅三岔＋四级扫描', () => {
    // 写前十查：底本存在，机器四查＋过目单六查＋「呈确认前的检查不是门禁」纪律
    const tenChecks = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
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
    const sweep = fs.readFileSync(skillFile('novel-review', 'agents/全量审读.md'), 'utf8')
    expect(sweep).toContain('主角＋处境＋钩')
    expect(sweep).toContain('章末双钩')
    expect(sweep).toContain('契约四问')
    expect(sweep).toContain('证伪式检查')
    const infoDim = fs.readFileSync(skillFile('novel-review', 'agents/信息披露审读.md'), 'utf8')
    expect(infoDim).toContain('多给了')
    expect(infoDim).toContain('漏给了')
    expect(infoDim).toContain('应忘锚点')
    // polish 四级扫描定位表＋段长方差检查
    const clean = fs.readFileSync(skillFile('novel-polish', 'references/1-表达清理.md'), 'utf8')
    expect(clean).toContain('tier1')
    expect(clean).toContain('tier2')
    expect(clean).toContain('tier3')
    expect(clean).toContain('tier4')
    expect(clean).toContain('命中≠错误，不打分，不为清零改稿')
    const reshape = fs.readFileSync(skillFile('novel-polish', 'references/2-节奏与重塑.md'), 'utf8')
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
    // 起草：任务包第 0 件写作心智＋三条心智防回退（0.0.38 心智批 R2 由「入戏（双位）」改名「双位视角」——断言随裁同步）
    const drafting = readSkill('novel-drafting')
    expect(drafting).toContain('写作心智')
    expect(drafting).toContain('双位视角')
    expect(drafting).toContain('一气呵成')
    expect(drafting).toContain('角色自决')
  })

  it('0.0.13 方法论提卡批：标尺触发时机重映射＋四判据接线＋呈报表合并＋路径 A 适用面＋旧格式降级＋灵感域接线＋体感回灌', () => {
    // A. 标尺触发时机列：CC 仓坐标词零命中（fork 不存在的消费位），新消费位逐行在位
    const scale = fs.readFileSync(skillFile('novel-design', 'references/参考标尺.md'), 'utf8')
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
    const checks = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
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
    const sweep = fs.readFileSync(skillFile('novel-review', 'agents/全量审读.md'), 'utf8')
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
    const tplDir = skillFile('novel-design', 'templates/世界书')
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
    // 0.0.25 独立审查 O3：升级节点行排期示例「2-3/8-10」为落砣章段非台阶数——旧全文件「8-10」负断言收窄为台阶定位行数值负断言
    const powerStepLine = tpl['力量体系'].split('\n').find((l) => l.startsWith('- 台阶定位：'))
    expect(powerStepLine, '力量体系模板应有「- 台阶定位：」行').toBeDefined()
    expect(powerStepLine!, '力量体系模板台阶定位行不得内联台阶数值（单源在参考标尺）').not.toMatch(/\d/)
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
    const checks = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
    expect(checks).toContain('世界书/力量体系/')
    expect(checks).toContain('境界表与金手指轨道位')
    expect(checks).toContain('世界书/世界规则/')
    expect(checks).toContain('铁则表')
  })

  it('0.0.15 补强批：时间行＋核心情绪前→后＋激励事件三问＋反派正当性两问＋待回填协议', () => {
    // A1. 时间行：细纲固定行含时间行（起止＋上章末衔接）；写前十查④接钩预检带时间衔接核对
    const outline = readSkill('novel-outline')
    expect(outline).toContain('时间行')
    const checks = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
    expect(checks).toContain('时间行的上章末时间衔接')
    // A2. 核心情绪前→后：情绪节固定行（SKILL＋规格模板）＋⑨与落点行的分工区分
    expect(outline).toContain('核心情绪前→后')
    const sect = fs.readFileSync(skillFile('novel-outline', 'templates/章细纲固定小节规格.md'), 'utf8')
    expect(sect).toContain('核心情绪前→后')
    expect(checks).toContain('前→后是位移')
    expect(checks).toContain('落点是读者离开时带什么')
    // A3. 激励事件三问：KB 锚 §4.12（04_大纲.md 标题存在由引用一致性测试另守），三要素措辞对齐
    //（0.0.40 心智批·设计：激励事件三问并入「首尾镜像」同场对照条目——断言随裁同步，三问本体未动）
    const design = readSkill('novel-design')
    expect(design).toContain('**首尾镜像**')
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
    expect(settle).toContain('按《定调设计》技能包 templates/世界书/ 对应条目模板补齐缺节')
    expect(settle).toContain('不为回填重写未变动内容')
  })

  it('0.0.14 模板拆出批：组织/地图条目模板＋三份规格模板拆位＋SKILL 引用＋注册单源', () => {
    // A. 组织/地图条目模板存在：风格对齐既有三份（frontmatter 约定不变＋留白合法）
    const tplDir = skillFile('novel-design', 'templates/世界书')
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
    // B. design 条目起稿处模板列全（含路径 A 的计数行；0.0.26 流程首波批：世界书模板五→六，加局规则）
    const design = readSkill('novel-design')
    expect(design).toContain('[组织条目模板](templates/世界书/组织条目模板.md)')
    expect(design).toContain('[地图条目模板](templates/世界书/地图条目模板.md)')
    expect(design).toContain('人物档案/世界规则/力量体系/组织/地图/局规则六份')
    // C. 规格模板拆位：三份存在＋规格细节在模板（表列/取数算式/四核对项）＋双 SKILL 各带一行引用
    const ladder = fs.readFileSync(skillFile('novel-design', 'templates/对手梯队子表规格.md'), 'utf8')
    expect(ladder).toContain('取数：参考标尺·固定层＋比例层×衰减×题材')
    expect(ladder).toContain('| 层级 | 存活周期 | 代表对手 | 出牌与去向 |')
    expect(design).toContain('[对手梯队子表规格](templates/对手梯队子表规格.md)')
    const vol = fs.readFileSync(skillFile('novel-design', 'templates/卷纲固定段规格.md'), 'utf8')
    expect(vol).toContain('压力升级检查')
    expect(vol).toContain('终局暗手')
    expect(vol).toContain('方向选择')
    expect(design).toContain('[卷纲固定段规格](templates/卷纲固定段规格.md)')
    const sect = fs.readFileSync(skillFile('novel-outline', 'templates/章细纲固定小节规格.md'), 'utf8')
    expect(sect, '章细纲固定小节规格：四固定小节＋时间行＋前→后＋既有断言词全量在位').toContain('### 冲突与爽点')
    expect(sect).toContain('### 章末双钩')
    expect(sect).toContain('信息预算四行')
    expect(sect).toContain('本章新埋：零')
    expect(sect).toContain('时间行')
    // D. 注册单源：artifact-contract 登记条目模板（世界书模板经名字数组拼路径；0.0.26 流程首波批：数组加局规则）＋三份规格模板
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    expect(contract).toContain("['人物档案', '世界规则', '力量体系', '组织', '地图', '局规则']")
    for (const rel of [
      'skills/novel-design/templates/对手梯队子表规格.md',
      'skills/novel-design/templates/卷纲固定段规格.md',
      'skills/novel-outline/templates/章细纲固定小节规格.md',
    ]) {
      expect(contract, `artifact-contract 应登记 ${rel}`).toContain(`'${rel}'`)
    }
  })

  it('0.0.15 提卡与缺口批：写作卡八卡＋drafting 改线＋文风建档门二支四层＋趣味层＋读者在场心智与自评行＋拆书消费接线＋语态样本行＋卷纲心动位＋KB 节级健康断言', () => {
    // A. 写作卡：文件存在＋frontmatter 式样＋八卡卡名与卡头节源在位
    const cardsPath = skillFile('novel-drafting', 'agents/写作卡.md')
    expect(fs.existsSync(cardsPath), 'novel-drafting/agents/写作卡.md 应存在').toBe(true)
    const cards = fs.readFileSync(cardsPath, 'utf8')
    for (const card of ['推进卡 ←§7.1＋§7.7', '塑造卡 ←§7.2＋§7.9', '动作卡 ←§7.3', '环境卡 ←§7.4', '开场卡 ←§7.10', '趣味卡 ←§7.12', 'POV 自查卡 ←§7.5', '行文自查卡 ←§7.13']) {
      expect(cards, `写作卡应含「${card}」卡头`).toContain(`## ${card}`)
    }
    // 趣味卡只留 §7.12 幽默机制（例子型机械不设：梗三问/梗密度档零命中防回退——玩梗供给走灵感库热梗通道，写作时刻原则由心智「找乐子」条承担）
    expect(cards).toContain('笑点从人物身上长出来')
    expect(cards).not.toContain('梗三问')
    // B. drafting SKILL 改线：写作卡引用＋卡原文内联措词＋深挖句保留
    const drafting = readSkill('novel-drafting')
    expect(drafting).toContain('[写作卡](agents/写作卡.md)')
    expect(drafting).toContain('**原文内联**任务包')
    expect(drafting).toContain('深挖时按 §x.y 只读该节（[07_正文写作](references/07_正文写作.md)），不整文件读入')
    expect(drafting).toContain('卡原文随任务包')
    // B2. 趣味层接线：写作心智找乐子条＋趣味卡按场景标签带卡（0.0.33 选卡映射单源移写作卡——映射句见卡头节）
    expect(drafting).toContain('找乐子')
    expect(cards).toContain('幽默/轻松/玩梗标签的单元时带趣味卡')
    // B3. 作家思维原则化：心智「读者在场＋主动性」条（一气呵成之前）＋热回看自愿自评行＋润色复核接线
    //（0.0.38 心智批起草侧重写：自评行提示语改判据式、标签退役「没劲段」——0.0.41 润色批消费口径已同步改「读者会跳读的段」，本钉翻正为负断言）
    expect(drafting).toContain('读者在场')
    expect(drafting).toContain('吊他胃口')
    expect(drafting).toContain('自评：最得意')
    expect(readSkill('novel-polish'), '旧「没劲段」标签应全 polish 清零（0.0.41 翻正）').not.toContain('没劲段')
    // C. 首章文风建档门二支＋四层画像：文风默认化（不留参考书学习口子）＋关键词与入档工具实接
    expect(drafting).toContain('首章文风建档门')
    expect(drafting, '文风默认化裁定：不留从其他作品学习文风的口子').not.toContain('从已导入的参考书归纳')
    expect(drafting).toContain('自带满意段')
    expect(drafting).toContain('默认推导')
    expect(drafting).toContain('这是兜底不是建议')
    expect(drafting).toContain('句法层')
    expect(drafting).toContain('手法层')
    expect(drafting).toContain('逻辑层')
    expect(drafting).toContain('语态层')
    expect(drafting, '梗密度档不设（例子型机械不入产品）').not.toContain('梗密度档')
    expect(drafting).toContain('保留技法采集')
    expect(drafting).toContain('novel_record_memory')
    expect(drafting).toContain('书房/开书/<书名>/种子底子.md')
    expect(drafting).toContain('矛盾项呈作者裁决')
    // C2. 拆书消费接线：细纲期机制卡参照（借魂不借形＋novel_reference_query）＋重推演四步（机制与灵感.md＋analyze SKILL）
    const outline = readSkill('novel-outline')
    expect(outline).toContain('借魂不借形')
    expect(outline).toContain('novel_reference_query')
    const mech = fs.readFileSync(skillFile('novel-analyze', 'references/机制与灵感.md'), 'utf8')
    expect(mech).toContain('重推演四步')
    expect(readSkill('novel-analyze')).toContain('重推演四步')
    // D. 语态样本行：settle SKILL＋沉淀对账底本同步，且末行位保留给章末状态
    const settle = readSkill('novel-settle')
    expect(settle).toContain('语态样本：')
    expect(settle).toContain('语态样本不得占末行')
    expect(settle).toContain('从本章挑一段满意的收进文风锚点吗')
    const reconcile = fs.readFileSync(skillFile('novel-settle', 'agents/沉淀对账.md'), 'utf8')
    expect(reconcile).toContain('语态样本：<本章自认最佳一句正文>')
    expect(reconcile).toContain('放在章末状态行之前')
    // E. 卷纲心动位：规格＋design SKILL 步骤 6＋章细纲规格与 SKILL 的 ★ 可选行
    const volSpec = fs.readFileSync(skillFile('novel-design', 'templates/卷纲固定段规格.md'), 'utf8')
    expect(volSpec).toContain('心动位')
    expect(volSpec).toContain('情绪锚不是顺序锚')
    expect(volSpec).toContain('源出 B 仓章循环设计')
    expect(readSkill('novel-design')).toContain('心动位行')
    const sectSpec = fs.readFileSync(skillFile('novel-outline', 'templates/章细纲固定小节规格.md'), 'utf8')
    expect(sectSpec).toContain('单元行标 `★`')
    expect(sectSpec).toContain('卷纲「心动位」')
    expect(readSkill('novel-outline')).toContain('标 `★`')
    // F. 注册单源：artifact-contract 登记写作卡
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    expect(contract).toContain("'skills/novel-drafting/agents/写作卡.md'")
    // G. KB 节级健康断言：九件分发件逐二级节行跨度 ≤ 上限。
    // 实测依据（2026-10-10，0.0.15 批前测量）：九件全部二级节最大行跨度 103 行
    // （08_修订排障.md §8.5 毒点怎么查），向上取整到十位＝110。0A_第一性原理层无
    // § 节但「原语」同为二级节，一并受上限约束。目的＝拦知识库升版导致的节膨胀，
    // 不是改现有文件。
    const kbFiles: ReadonlyArray<{ readonly skill: string; readonly file: string }> = [
      ...['01_开书.md', '02_人物设计.md', '03_世界观设计.md', '04_大纲.md', '05_卷纲.md', '0A_第一性原理层.md']
        .map((file) => ({ skill: 'novel-design', file })),
      { skill: 'novel-outline', file: '06_章纲.md' },
      { skill: 'novel-drafting', file: '07_正文写作.md' },
      { skill: 'novel-director', file: '08_修订排障.md' },
    ]
    const SECTION_LINE_CAP = 110
    for (const { skill, file } of kbFiles) {
      const text = fs.readFileSync(skillFile(skill, `references/${file}`), 'utf8')
      const lines = text.replace(/\r\n/g, '\n').split('\n')
      const starts: number[] = []
      lines.forEach((line, i) => { if (/^## /.test(line)) starts.push(i) })
      expect(starts.length, `${file}: 二级节数应大于零`).toBeGreaterThan(0)
      for (let s = 0; s < starts.length; s += 1) {
        const end = s + 1 < starts.length ? starts[s + 1]! : lines.length
        const span = end - starts[s]!
        expect(span, `${file} ${lines[starts[s]!]!.trim()}: 节行跨度 ${span} 超上限 ${SECTION_LINE_CAP}（知识库升版节膨胀）`).toBeLessThanOrEqual(SECTION_LINE_CAP)
      }
    }
  })

  it('0.0.15 评审采风批：评审两席底本＋采风代理＋灵感库结构＋双 SKILL 接线＋注册单源', () => {
    // A. 三底本存在＋frontmatter name（agents 目录惯例：英文 kebab name＋中文 description）
    const writerPath = skillFile('novel-design', 'agents/作家评审.md')
    const readerPath = skillFile('novel-design', 'agents/读者评审.md')
    const researcherPath = skillFile('novel-inspiration', 'agents/采风检索.md')
    for (const p of [writerPath, readerPath, researcherPath]) {
      expect(fs.existsSync(p), `${p} 应存在`).toBe(true)
    }
    const writer = fs.readFileSync(writerPath, 'utf8')
    const reader = fs.readFileSync(readerPath, 'utf8')
    const researcher = fs.readFileSync(researcherPath, 'utf8')
    expect(writer).toContain('name: writer-reviewer')
    expect(reader).toContain('name: reader-reviewer')
    expect(researcher).toContain('name: researcher')
    // B. 作家评审：引证纪律（逐字引文）＋对象-判据路由（04_大纲/05_卷纲 相关节）＋根因三选一＋待采风标记＋首评声明
    expect(writer).toContain('逐字引文')
    expect(writer).toContain('04_大纲')
    expect(writer).toContain('05_卷纲')
    expect(writer).toContain('§4.15')
    expect(writer).toContain('§5.1')
    for (const root of ['设定根源', '主线根源', '规格根源']) {
      expect(writer, `作家评审根因三选一应含「${root}」`).toContain(root)
    }
    expect(writer).toContain('【待采风：查询词】')
    expect(writer).toContain('只做首评')
    expect(writer).toContain('书房/评审/')
    // C. 读者评审：弃书点预测＋雷点清单逐类＋读者语言/判据双要求＋画像来源
    expect(reader).toContain('弃书点预测')
    expect(reader).toContain('雷点清单')
    expect(reader).toContain('结论说人话、判据走格式')
    expect(reader).toContain('读者画像')
    expect(reader).toContain('§5.4')
    expect(reader).toContain('只做首评')
    // D. 采风代理：三源顺序＋孤证＋永不存原文＋热梗半衰期例外＋只写暂存＋站点经验
    expect(researcher).toContain('三源')
    expect(researcher).toContain('孤证')
    expect(researcher).toContain('永不存原文')
    expect(researcher).toContain('半衰期')
    expect(researcher).toContain('热梗例外')
    expect(researcher).toContain('_待裁决_采风_')
    expect(researcher).toContain('_采风站点经验')
    expect(researcher).toContain('只采国内源')
    // E. design SKILL 接线：确认前评审（可选）节＋书房/评审/＋待采风转《灵感与立项》＋步骤 3/4/6 各半句（节＋三处接线≥4 次命中）
    const design = readSkill('novel-design')
    expect(design).toContain('确认前评审（可选）')
    expect(design).toContain('书房/评审/')
    expect(design).toContain('【待采风：查询词】')
    expect(design).toContain('两席独立互不通气')
    expect(design).toContain('评审不是新门禁')
    expect((design.match(/确认前评审（可选）/g) ?? []).length,
      '「确认前评审（可选）」应≥4 次命中（节＋步骤 3/4/6 接线）').toBeGreaterThanOrEqual(4)
    expect(design).toContain('[作家评审](agents/作家评审.md)')
    expect(design).toContain('[读者评审](agents/读者评审.md)')
    // F. inspiration SKILL：灵感库八类（0.0.15 批内六→八扩容，升级批详断言见灵感库升级批）＋一类一册＋池库分工＋暂存与归档纪律＋Off-limits 放行采风子代理
    const inspiration = readSkill('novel-inspiration')
    for (const cat of ['历史事实', '文化元素', '剧情结构', '人物原型', '台词金句', '古词古句·意象', '影视动漫', '现实生活']) {
      expect(inspiration, `灵感库应含「${cat}」类`).toContain(cat)
    }
    expect(inspiration).toContain('一类一册')
    expect(inspiration).toContain('两库互不合并')
    expect(inspiration).toContain('_待裁决_采风_')
    expect(inspiration).toContain('[采风检索](agents/采风检索.md)')
    expect(inspiration).toContain('除采风检索')
    // G. 注册单源：artifact-contract 登记三份 agents（pack-check 按 referenceDocs 校验打包面）
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    for (const rel of [
      'skills/novel-design/agents/作家评审.md',
      'skills/novel-design/agents/读者评审.md',
      'skills/novel-inspiration/agents/采风检索.md',
    ]) {
      expect(contract, `artifact-contract 应登记 ${rel}`).toContain(`'${rel}'`)
    }
  })

  it('0.0.15 认知调研批：写作心智四改＋章纲分级简章＋段级刷新＋人物自决类轻量通道', () => {
    // A. 写作心智四改（novel-drafting 任务包第 0 件，依据 2026-10-10 认知调研）：
    // 写前重读居首＋双位视角＋读者在场博弈（假烟雾弹）＋找乐子主动面（生个事）
    //（0.0.38 心智批起草 R1-R8 重写：旧句断言随裁同步——双位/找乐子旧措辞改钉新句，身份句改负断言；详组见 0.0.38）
    const drafting = readSkill('novel-drafting')
    expect(drafting).toContain('写前重读')
    expect(drafting).toContain('近期正文衔接')
    expect(drafting).toContain('双位视角')
    expect(drafting).toContain('切出来对信息差')
    expect(drafting, '身份表述「两把椅子」应清零（0.0.38 删除句 4）').not.toContain('两把椅子')
    expect(drafting).toContain('假烟雾弹')
    expect(drafting).toContain('生个事')
    expect(drafting).toContain('小意外/小冲突/小反转')
    expect(drafting).toContain('能反的套路')
    // 写前重读必须是心智块第一条（在「双位视角」之前）
    const mind = drafting.indexOf('## 写作心智')
    expect(mind).toBeGreaterThanOrEqual(0)
    expect(drafting.indexOf('**写前重读**', mind), '写前重读应居心智块条目首位').toBeLessThan(drafting.indexOf('**双位视角**', mind))
    // B. 章纲分级三文件同步：判据词在 outline SKILL；简章细则在规格模板；十查放宽在写前十查底本
    const outline = readSkill('novel-outline')
    expect(outline).toContain('章纲分级')
    for (const kw of ['关键章', '过渡章', '简章', '卷首章', '卷内高潮章', '心动位', '换图章', '卷末兑现', '主战层级']) {
      expect(outline, `章纲分级判据应含「${kw}」`).toContain(kw)
    }
    expect(outline).toContain('一行带过或显式留白')
    expect(outline).toContain('确认协议不变')
    expect(outline).toContain('隔章跑')
    const sectSpec = fs.readFileSync(skillFile('novel-outline', 'templates/章细纲固定小节规格.md'), 'utf8')
    expect(sectSpec).toContain('简章')
    expect(sectSpec).toContain('过渡章')
    for (const kw of ['视角与焦点', '信息边界', '情绪与节奏目标', '冲突与爽点', '章末双钩']) {
      expect(sectSpec, `简章核心节应含「${kw}」`).toContain(kw)
    }
    expect(sectSpec).toContain('一行带过或显式留白')
    expect(sectSpec).toContain('留白合法')
    expect(sectSpec).toContain('六字段照抄不省')
    const checks = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
    expect(checks).toContain('过渡章')
    expect(checks).toContain('机器四查照常')
    expect(checks).toContain('隔章跑')
    // C. 段级刷新：outline 重入节＋design 重入·卷纲修订处各一段（对齐细纲一段一段节律）
    expect(outline).toContain('滚动窗口段级刷新')
    expect(outline).toContain('不是每章滚一次')
    expect(outline).toContain('novel_roll_window')
    const design = readSkill('novel-design')
    expect(design).toContain('卷内段级滚窗')
    expect(design).toContain('不是每章滚一次')
    // D. 人物自决类轻量通道：勘误通道旁——单章行动/冲突字段、无下游承诺变更、不跑影响分析
    expect(outline).toContain('人物自决类')
    expect(outline).toContain('人物不会这么做')
    expect(outline).toContain('不跑影响分析')
    expect(outline).toContain('有下游影响则仍走影响分析前置呈报')
  })

  it('0.0.15 灵感库升级批：八类＋零件卡九列＋翻库三式三去向＋存量盘点＋红线两例外＋outline 双参照与补充来源', () => {
    // A. 八类在位（原六类不动＋新增台词金句/古词古句·意象）＋古词三子标＋建库初始化
    const inspiration = readSkill('novel-inspiration')
    for (const cat of ['历史事实', '文化元素', '剧情结构', '人物原型', '台词金句', '古词古句·意象', '影视动漫', '现实生活']) {
      expect(inspiration, `灵感库应含「${cat}」类`).toContain(cat)
    }
    for (const sub of ['诗词古文', '雅称谚典', '意象母题']) {
      expect(inspiration, `古词古句·意象应含「${sub}」子标`).toContain(sub)
    }
    expect(inspiration).toContain('建库初始化')
    expect(inspiration).toContain('十个类别子目录')
    // B. 零件卡九列：骨/魂显式两列＋化用启示＋已用于回写；「层级（骨/魂）」列退役防回退
    for (const col of ['关键词（2-4个）', '一句话（骨）', '为什么好（魂·原理一句）', '化用启示', '反例（何时不可信/不可用）', '已用于']) {
      expect(inspiration, `零件卡字段应含「${col}」列`).toContain(col)
    }
    expect(inspiration, '「层级（骨/魂）」列应退役（信息显式化为骨/魂两列）').not.toContain('层级（骨/魂）')
    expect(inspiration).toContain('消费后回写')
    // C. 翻库三式＋三去向＋过期软提示＋裁决交互＋池库互转＋拆书边界＋索引对账
    for (const way of ['按类翻', '按关键词 grep', '按场景需求问']) {
      expect(inspiration, `翻库三式应含「${way}」`).toContain(way)
    }
    for (const dest of ['入材料包', '固化进人物档案', '激发新点子入灵感池']) {
      expect(inspiration, `翻库三去向应含「${dest}」`).toContain(dest)
    }
    expect(inspiration).toContain('采集已逾')
    expect(inspiration).toContain('建议复核')
    expect(inspiration).toContain('入/弃/改道')
    expect(inspiration).toContain('池库互转')
    expect(inspiration).toContain('有原文＝拆书机制卡')
    expect(inspiration).toContain('最近更新')
    expect(inspiration).toContain('计数对账')
    // D. researcher 底本：十类路由＋触发源⑤存量盘点＋红线两例外＋范围句扩两句＋参考书去重（可选）
    const researcher = fs.readFileSync(skillFile('novel-inspiration', 'agents/采风检索.md'), 'utf8')
    expect(researcher).toContain('十类')
    expect(researcher).toContain('存量盘点')
    expect(researcher).toContain('跳过网络源')
    expect(researcher).toContain('公有领域语料（诗词古文/雅称谚典）逐字入库合法')
    expect(researcher).toContain('单句例证 ≤1 句且必标出处')
    expect(researcher).toContain('含设定脑洞与桥段实例')
    expect(researcher).toContain('名场面解析归此类')
    expect(researcher).toContain('有原文＝拆书机制卡')
    expect(researcher, '沉淀提案字段表应退役「层级（骨/魂）」列').not.toContain('层级（骨/魂）')
    expect(researcher).toContain('书房/参考书/*/机制')
    // E. outline 双参照（机制卡之外 grep 灵感库零件卡）＋备料补充来源句
    const outline = readSkill('novel-outline')
    expect(outline).toContain('双参照（可选）')
    expect(outline).toContain('灵感库/*/零件卡.md')
    expect(outline).toContain('「化用启示」读作写法参照')
    expect(outline).toContain('借骨不借皮')
    expect(outline).toContain('「翻灵感库」')
  })

  it('0.0.15 金手指管理批：轨道位四行＋design 落四行指针＋写前十查②三查＋settle 落账行', () => {
    // A. 档案位：力量体系模板金手指轨道位四行（枚举单源在模板）——代价分型两型＋反制＋代劳边界＋可见度牌
    const tpl = fs.readFileSync(skillFile('novel-design', 'templates/世界书/力量体系条目模板.md'), 'utf8')
    for (const kw of ['代价分型', '使用型', '持有型', '反制方式', '代劳边界', '可见度牌']) {
      expect(tpl, `金手指轨道位应含「${kw}」行`).toContain(kw)
    }
    expect(tpl).toContain('每次动用即付/累积')
    expect(tpl).toContain('持有即招祸')
    expect(tpl).toContain('两型可并存各记')
    expect(tpl).toContain('无＋理由')
    expect(tpl).toContain('只给伴奏不给成品')
    expect(tpl).toContain('没有反制的金手指没有戏')
    // B. 设计期追问：design SKILL 四轨道追问尾接落位句（只带四行名指针，枚举值不重述——单源防回退）
    const design = readSkill('novel-design')
    expect(design).toContain('金手指轨道位落四行（代价分型/反制方式/代劳边界/可见度牌')
    expect(design).toContain('想不出的行留白不编')
    expect(design, '分型枚举值单源在模板，SKILL 不得重述').not.toContain('每次动用即付')
    expect(design, '分型枚举值单源在模板，SKILL 不得重述').not.toContain('持有即招祸')
    // C. 写前查：检查②「本章动用金手指时三查」——代价已结否/越档/泄底（认知对照可见度牌）
    const checks = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
    expect(checks).toContain('本章动用金手指时三查')
    for (const kw of ['代价已结否', '越档', '泄底']) {
      expect(checks, `写前十查②三查应含「${kw}」`).toContain(kw)
    }
    expect(checks).toContain('当场落账')
    expect(checks).toContain('不知道的人表现出知道')
    // D. 写后账：settle SKILL 落账（主 Agent worldbook 路径）＋沉淀对账底本核对职责——使用型逐章、持有型状态变化才记
    //（0.0.20 批 G 单源消歧：落账单源＝主 Agent，子代理只核对不落账，断言随裁定更新）
    const settle = readSkill('novel-settle')
    expect(settle).toContain('「G 代价已结·第N章」')
    expect(settle).toContain('持有型代价不逐章落账（持有即持续状态），状态变化时才记')
    const reconcile = fs.readFileSync(skillFile('novel-settle', 'agents/沉淀对账.md'), 'utf8')
    expect(reconcile, '对账方法 5 应核对代价结清状态').toContain('核对代价是否在正文确已落地')
    expect(reconcile, '子代理不落 G 行——G 行字样只出现在禁写指示里').toContain('不在事实变更段写「G 代价已结」行')
    expect(reconcile).toContain('持有型不逐章核对（持有即持续状态）')
    expect(reconcile).toContain('先报缺不编')
  })

  it('0.0.16 修复批：篇幅三连＋反推四件＋P1 九项——回炉扩写/字数前置/章型浮动/结构类型/本卷升级位/出场注记/出场频率/采风红线/判级保守/八项对齐/防撞名/POV 序列/情绪基调/章名风格/速查表/第四来源', () => {
    const drafting = readSkill('novel-drafting')
    const review = readSkill('novel-review')
    const design = readSkill('novel-design')
    const outline = readSkill('novel-outline')
    const settle = readSkill('novel-settle')
    const vol = fs.readFileSync(skillFile('novel-design', 'templates/卷纲固定段规格.md'), 'utf8')
    const scale = fs.readFileSync(skillFile('novel-design', 'references/参考标尺.md'), 'utf8')
    const ladder = fs.readFileSync(skillFile('novel-design', 'templates/对手梯队子表规格.md'), 'utf8')
    const sect = fs.readFileSync(skillFile('novel-outline', 'templates/章细纲固定小节规格.md'), 'utf8')
    const researcher = fs.readFileSync(skillFile('novel-inspiration', 'agents/采风检索.md'), 'utf8')
    // 1. F24 回炉扩写档：review 篇幅处置显式档＋drafting 处置枚举照抄（两文件都在位）
    for (const t of [drafting, review]) {
      expect(t, '回炉扩写应为两技能共用的显式处置档').toContain('回炉扩写')
      expect(t).toContain('一次为限')
    }
    // 2. F25 字数验收前置：drafting 收稿即机械数＋判据单源（事件膨胀法全文只在 drafting）
    expect(drafting).toContain('收稿即机械数正文字数')
    expect(drafting).toContain('不拖到审读')
    expect(drafting).toContain('事件膨胀法')
    expect(drafting).toContain('零信息假拍不算数')
    expect(drafting).toContain('0-2 件卫星事件但不引新冲突')
    // 3. F26 章型浮动条款：design 契约节＋review 核对按浮动档判
    expect(design).toContain('章型浮动')
    expect(design).toContain('各档独立')
    for (const t of [design, review, drafting]) {
      expect(t, '三处篇幅消费位都应认章型浮动档').toContain('浮动档')
    }
    // 4. 卷纲结构类型行：枚举单源在规格文件
    expect(vol).toContain('结构类型')
    for (const kw of ['层层递进引爆型', '旋涡式', '高峰夹平原式', '游历爆发型', '连续高潮余韵型']) {
      expect(vol, `结构类型枚举应含「${kw}」`).toContain(kw)
    }
    expect(design).toContain('结构类型行')
    // 5. 升级间隔：压力升级检查第⑤核对项＋标尺【待校准】行
    expect(vol).toContain('本卷升级位')
    expect(vol).toContain('世界书/力量体系/')
    expect(design).toContain('五核对项')
    expect(scale).toContain('升级间隔')
    expect(scale).toContain('【待校准】')
    expect(scale).toContain('卷内至少一处升级位')
    expect(scale).toContain('跨卷不宜空转')
    // 6. 对手梯队出场注记：出场密度＋情绪积累，留白合法
    expect(ladder).toContain('出场注记')
    expect(ladder).toContain('出场密度')
    expect(ladder).toContain('情绪积累')
    // 7. 角色出场频率预警（防神隐）：备料段自查距上次出场
    expect(outline).toContain('距上次出场')
    expect(outline).toContain('超 10 章未出场')
    expect(outline).toContain('防神隐')
    // 8. 采风红线对齐现实工具（F6/F7/F8）：新口径在位＋旧口径零命中防回退
    expect(researcher).toContain('国内域名优先，内容必须中文')
    expect(researcher).toContain('能进页时补核')
    expect(researcher).toContain('不同域名才计')
    expect(researcher, 'F6 旧含糊口径应退役').not.toContain('国内站与中文站方可入库')
    // 9. 判级保守默认＋简章安全行：拿不准按关键章＋核心节名含起止边界（0.0.18 F40 起简章核心节六→七，补前置条件核对结果）
    expect(outline).toContain('判定拿不准时按关键章走')
    expect(sect).toContain('七个')
    expect(sect).toContain('「起止边界」')
    expect(sect).toContain('至少保留承上行')
    // 10. 任务包输出要求对齐草稿契约八项：首稿四项之外的注明由流程补
    expect(drafting).toContain('来源快照')
    expect(drafting).toContain('保真风险')
    expect(drafting).toContain('由流程各阶段补')
    // 11. 建档门防撞名＋文风条目措辞统一（作者层/本书记忆两通道）
    expect(drafting).toContain('文风画像·{书名}')
    expect(drafting).toContain('记忆文风条目（作者层')
    expect(drafting).toContain('本书记忆文风条目')
    expect(settle).toContain('带书名后缀')
    // 12. POV 接力章合法态：序列写法（主 POV＋接力副 POV）
    expect(sect).toContain('序列写法')
    expect(sect).toContain('接力副 POV')
    // 13. 卷级情绪基调行
    expect(vol).toContain('情绪基调')
    expect(vol).toContain('溺水感')
    // 14. 章名风格进画像手法层
    expect(drafting).toContain('章名风格')
    expect(drafting).toContain('梗化情绪式')
    // 15. 取数速查表补 200 万字·都市算例行
    expect(scale).toContain('200 万字·都市')
    // 16. 升级关系第四来源：三来源扩四
    expect(design).toContain('四来源之一')
    expect(design).toContain('同层内变')
  })

  it('灵感库扩展批：类别八→十＋生产通道三条＋起名翻库双册——命名词语/设定概念/三子标/日常暂存/类简称扩/防回退旧八类零命中', () => {
    const inspiration = readSkill('novel-inspiration')
    const researcher = fs.readFileSync(skillFile('novel-inspiration', 'agents/采风检索.md'), 'utf8')
    // A. 十类在位：原八类不动＋命名词语/设定概念，两文件同步（SKILL 建库初始化＋researcher 路由表）
    for (const cat of ['历史事实', '文化元素', '剧情结构', '人物原型', '台词金句', '古词古句·意象', '影视动漫', '现实生活', '命名词语', '设定概念']) {
      expect(inspiration, `灵感库应含「${cat}」类`).toContain(cat)
      expect(researcher, `采风检索路由表应含「${cat}」类`).toContain(cat)
    }
    expect(inspiration).toContain('十个类别子目录')
    // B. 命名词语三子标＋原理/反例口径＋设定概念边界句
    for (const sub of ['人名', '地名', '组织·器物·功法名']) {
      expect(inspiration, `命名词语应含「${sub}」子标`).toContain(sub)
    }
    for (const kw of ['罕见真实姓氏', '公有领域事实可逐字', '声韵搭配法', '人物气质与名字气质的匹配法', '构词法', '真实古地名雅称', '构词模式与用字库', '音韵/字形/联想原理', '拗口组合/歧义谐音/气质错配']) {
      expect(inspiration, `命名词语定义应含「${kw}」`).toContain(kw)
    }
    for (const kw of ['可跨书复用', '换个故事还能用', '池库分工不破']) {
      expect(inspiration, `设定概念边界句应含「${kw}」`).toContain(kw)
    }
    // 类别总数 10 封顶（防碎片化原则句保留）
    expect(inspiration).toContain('类别总数 10 封顶')
    expect(inspiration).toContain('不开第十一类')
    // C. 日常积累第三生产通道：三条明示＋日常暂存件＋来源口径＋不经采风代理
    expect(inspiration).toContain('生产通道三条')
    expect(inspiration).toContain('日常随手积累')
    expect(inspiration).toContain('_待裁决_日常_')
    expect(inspiration).toContain('日常积累·')
    expect(inspiration).toContain('作者口述出处')
    expect(inspiration).toContain('不经采风代理')
    // D. 类简称表扩：枚举单源在采风检索（0.0.36 全量审查修复批起 SKILL 改指路不重述——断言随裁同步）
    expect(researcher, '类简称枚举应含「命名/设定」（单源在采风检索）').toContain('命名/设定')
    expect(inspiration, 'SKILL 类简称枚举应指路单源').toContain('类简称十值与可信度四态枚举单源在 [采风检索](agents/采风检索.md)')
    // E. 起名翻库双册：翻库句扩为古词古句·意象＋命名词语两册取词
    expect(inspiration).toContain('古词古句·意象/零件卡.md')
    expect(inspiration).toContain('命名词语/零件卡.md')
    expect(inspiration).toContain('两册零件卡取词')
    // F. 防回退：类别清单旧八类表述零命中（两文件）
    expect(inspiration, '不应残留「八个类别」旧表述').not.toContain('八个类别')
    expect(inspiration, '不应残留「八类」旧表述').not.toContain('八类')
    expect(researcher, '不应残留「八类」旧表述').not.toContain('八类')
  })

  it('0.0.17 种子随包批：种子落位（八册零件卡＋索引）＋初始化全量展开＋库已存在不动＋残缺补拷＋注册单源', () => {
    // A. 种子落位：assets/灵感库种子/——历史事实/现实生活为种子空类（索引计数 0，不建册）；
    //    只断结构性事实与宽松下限，不硬编码总数——种子将来升级不应红测试
    const seedDir = skillFile('novel-inspiration', 'assets/灵感库种子')
    const indexPath = path.join(seedDir, '索引.md')
    expect(fs.existsSync(indexPath), 'assets/灵感库种子/索引.md 应存在').toBe(true)
    const index = fs.readFileSync(indexPath, 'utf8')
    for (const cat of ['历史事实', '文化元素', '剧情结构', '人物原型', '台词金句', '古词古句·意象', '影视动漫', '现实生活', '命名词语', '设定概念']) {
      expect(index, `种子索引应含「${cat}」类行`).toContain(`| ${cat} |`)
    }
    const cards = fs.readdirSync(seedDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => path.join(seedDir, e.name, '零件卡.md'))
    expect(cards.length, '种子零件卡册数宽松下限 ≥8（空类不建册）').toBeGreaterThanOrEqual(8)
    let rows = 0
    for (const p of cards) {
      expect(fs.existsSync(p), `${p} 应存在`).toBe(true)
      rows += (fs.readFileSync(p, 'utf8').match(/^\| \S+-\d{8}-\d{2} \|/gm) ?? []).length
    }
    expect(rows, '种子零件总数宽松下限 ≥100（不硬编码当前总数）').toBeGreaterThanOrEqual(100)
    // B. 初始化改种子展开：SKILL 措辞（种子路径/全量展开/库已存在则不动/残缺仅补拷不覆盖）
    const inspiration = readSkill('novel-inspiration')
    expect(inspiration).toContain('assets/灵感库种子')
    expect(inspiration).toContain('全量展开')
    expect(inspiration).toContain('起步 150 条')
    expect(inspiration).toContain('采集说明随册保留')
    expect(inspiration).toContain('库已存在则不动')
    expect(inspiration).toContain('不合并不覆盖')
    expect(inspiration).toContain('仅补拷库中缺失且种子中存在的件')
    expect(inspiration).toContain('不覆盖库中已有件')
    // C. 注册单源：artifact-contract 登记种子（打包面精确等值断言由 pack-check 另守——skills/ 下 .md 缺一即红）
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    expect(contract).toContain("['文化元素', '剧情结构', '人物原型', '台词金句', '古词古句·意象', '影视动漫', '命名词语', '设定概念']")
    expect(contract).toContain("'skills/novel-inspiration/assets/灵感库种子/索引.md'")
  })

  it('0.0.18 修复批：关键章两档＋浮动语义钉死与现状注记＋第四形态＋自评行落位＋⑧隔章定义＋简章七节＋数值建议句＋种子与沙盘逐字一致', () => {
    const outline = readSkill('novel-outline')
    const design = readSkill('novel-design')
    const drafting = readSkill('novel-drafting')
    const review = readSkill('novel-review')
    const checks = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
    const sect = fs.readFileSync(skillFile('novel-outline', 'templates/章细纲固定小节规格.md'), 'utf8')
    // F34 关键章枚举两新档：档词＋判据源（SKILL 枚举与底本③同步——到期命中即关键章定级）
    expect(outline).toContain('段内（章组）高潮章')
    expect(outline).toContain('伏笔/线索到期兑现章')
    expect(outline).toContain('章组排期')
    expect(checks).toContain('伏笔/线索到期兑现章')
    // F35 浮动语义钉死：各档独立（过渡档允许低于主区间下限＝下浮即其用途、高潮档允许高于主上限）
    expect(design).toContain('各档独立：过渡档允许低于主区间下限（下浮即其用途）、高潮档允许高于主上限')
    // F36 目标句＋现状注记成对出现（design/review 同步——core 契约解析器接受浮动行落地前，脚本遇浮动行报配置错误）
    for (const t of [design, review]) {
      expect(t).toContain('按全带（全档最小值～全档最大值）核对')
      expect(t).toContain('报「配置错误」')
    }
    // F41 浮动档数值建议句：按本书已发稿实测产出分布拟
    expect(design).toContain('回炉扩写可拉 30-50%')
    expect(design).toContain('数值应落在分布带内')
    // F37 回炉后第四形态（排在三选之前）：枚举单源在 drafting、review 引用
    for (const t of [drafting, review]) {
      expect(t).toContain('细纲没错只是写得薄：写足再交')
    }
    expect(drafting).toContain('零新卫星事件、纯信息加密补写一轮')
    expect(review).toContain('处置枚举单源在《正文起草》验收步')
    // F38 自评行落位＋字数口径：热回查/自评行固定属候选事实段末尾（正文区之外）；0.0.30 起验收步改核验字数.mjs 脚本口径（口径句随脚本化改写，断言随裁同步）
    expect(drafting).toContain('热回查行与自评行固定属候选事实段末尾')
    expect(drafting).toContain('不含 frontmatter 与草稿候选事实段')
    // F39 ⑧隔章定义：口径单源在写前十查底本（0.0.21 批改 SKILL 侧重复口径为指针，断言随裁同步）
    expect(checks).toContain('比对序列重启的首章与孤立过渡章（前后皆关键章）照常比对，不隔')
    expect(outline).toContain('放宽口径见 [写前十查](agents/写前十查.md) 章纲分级放宽节')
    // F40 简章核心节七节：前置条件核对结果一句话版入简章（SKILL＋规格同步）
    expect(sect).toContain('七个')
    for (const kw of ['视角与焦点', '信息边界', '情绪与节奏目标', '起止边界', '前置条件核对结果', '冲突与爽点', '章末双钩']) {
      expect(sect, `简章核心节应含「${kw}」`).toContain(kw)
    }
    expect(sect).toContain('无前置条件')
    expect(outline).toContain('「前置条件核对结果」一句话版')
    // F42 种子与沙盘逐字一致（抽两册 Buffer 比对）：沙盘在仓外，路径经 ABZU_SEED_SANDBOX 注入——
    // 仓内不得硬编码个人绝对路径（check:public 红闸）；未注入时本断言跳过，注入时逐字节校验同步纪律。
    const sandboxRoot = process.env.ABZU_SEED_SANDBOX
    if (sandboxRoot !== undefined && sandboxRoot !== '') {
      const seedDir = skillFile('novel-inspiration', 'assets/灵感库种子')
      for (const [seedRel, sandboxRel] of [['人物原型', '人物原型'], ['剧情结构', '剧情结构']] as const) {
        const seed = fs.readFileSync(path.join(seedDir, seedRel, '零件卡.md'))
        const sandbox = fs.readFileSync(path.join(sandboxRoot, sandboxRel, '零件卡.md'))
        expect(Buffer.compare(seed, sandbox) === 0, `种子与沙盘应逐字节一致：${seedRel}/零件卡.md`).toBe(true)
      }
    }
  })

  it('雷点清单批：清单落位＋契约第六部候选菜单＋写前十查内联快扫', () => {
    const p = skillFile('novel-design', 'references/雷点清单.md')
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
    const checks = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
    expect(checks).toContain('雷点快扫')
    expect(checks).toContain('references/雷点清单.md')
    const outline = readSkill('novel-outline')
    expect(outline).toContain('雷点快扫行')
  })

  it('升格问补钉：novel-settle 首章末升格问关键词在位', () => {
    // 首章定稿呈报的升格问（0.0.16 升格问机制）——问句本体与首章限定词都在位才防回退：
    // 限定词丢了＝每章都问（退化）；问句丢了＝锚点段采集断链
    const settle = readSkill('novel-settle')
    expect(settle, '首章末升格问应在位').toContain('挑一段满意的收进文风锚点吗')
    expect(settle, '升格问应限定首章').toContain('首章呈报时加问一句')
  })

  it('0.0.19 审查修复批：docs/user 裸版本号零残留＋profile 名统一＋共享测试 helper＋蓝图 v1.4 与单源收拢台账', () => {
    const docsUser = path.join(__dirname, '..', '..', '..', 'docs', 'user')
    const userDocs = fs.readdirSync(docsUser).filter((name) => name.endsWith('.md'))
    expect(userDocs.length, 'docs/user 应收集到教程 .md').toBeGreaterThan(0)
    // A. 版本口径：0.0.5/0.0.18 零残留；0.0.4 仅允许「0.0.4 起/0.0.4 移除」历史叙事（鲸鱼娘桌宠沿革句）；当前口径随版本走，0.0.19 起由各版批组的零残留负断言接力（0.0.20 组断言 0.0.19 清零）
    for (const f of userDocs) {
      const text = fs.readFileSync(path.join(docsUser, f), 'utf8')
      expect(text, `${f}: 不应残留陈旧当前口径 0.0.5`).not.toContain('0.0.5')
      expect(text, `${f}: 不应残留上一版 0.0.18`).not.toContain('0.0.18')
      const stale4 = [...text.matchAll(/0\.0\.4(?! 起| 移除)/g)].map((m) => m[0])
      expect(stale4, `${f}: 0.0.4 只允许出现在「0.0.4 起/0.0.4 移除」历史叙事里`).toHaveLength(0)
    }
    // B. profile 名：--profile scriptor 在 docs/user 零命中（de-brand 收尾；迁移/旧 profile 语境唯一合法保留面是 docs/maintenance，现无残留）
    let scriptorFlags = 0
    for (const f of userDocs) {
      scriptorFlags += (fs.readFileSync(path.join(docsUser, f), 'utf8').match(/--profile scriptor/g) ?? []).length
    }
    expect(scriptorFlags, 'docs/user 不应残留 --profile scriptor 示例（新装/日常示例统一 --profile abzu）').toBe(0)
    expect(fs.readFileSync(path.join(docsUser, 'install.md'), 'utf8'), '安装示例应使用 --profile abzu').toContain('--profile abzu')
    // C. 共享测试 helper：文件存在且两 spec 均导入（防回退回各自副本）
    expect(fs.existsSync(path.join(__dirname, 'skill-test-helpers.ts')), 'tests/skill-test-helpers.ts 应存在').toBe(true)
    expect(fs.readFileSync(path.join(__dirname, 'skills-batches.spec.ts'), 'utf8')).toContain("from './skill-test-helpers'")
    expect(fs.readFileSync(path.join(__dirname, 'skills-core.spec.ts'), 'utf8')).toContain("from './skill-test-helpers'")
    // D. 蓝图 v1.4：勘误与澄清关键词（E1 落点/E6 复原表述/横切纪律 4 成本可见性落地形态）
    const blueprint = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'docs', 'design', '增强实施计划.md'), 'utf8')
    expect(blueprint).toContain('v1.4')
    expect(blueprint, 'E1 落点应为实装路径 docs/CONTEXT.md').toContain('docs/CONTEXT.md')
    expect(blueprint, 'E6 复原表述应按实装更新').toContain('复原为原样受管单通道')
    expect(blueprint, '纪律 4 澄清：用量记录在批报告与会话用量统计').toContain('批报告与会话用量统计')
    expect(blueprint, '纪律 4 澄清：宿主不向技能暴露 token 计数').toContain('宿主不向技能暴露会话 token 计数')
    expect(blueprint).toContain('2026-10-11 澄清')
    // E. 遗留台账：core 解冻批候选（单源收拢清单）三行关键词
    expect(blueprint).toContain('core 解冻批候选')
    expect(blueprint).toContain('BOM 剥离三处合一')
    expect(blueprint).toContain("'# 近期窗口'")
    expect(blueprint).toContain('目录列举 helper 跨包合一')
  })

  it('0.0.20 审查修复批：G 代价已结单源消歧＋严重程度双词表映射＋CONTEXT 五核对项＋采风四态＋蓝图 E5′ 已落地与解冻清单扩容＋settle 已兑现＋版本零残留', () => {
    // A. G 代价已结落账单源＝主 Agent 走 worldbook 确认路径：子代理只核对不落账（旧指示「在事实变更…附一行 G 行」不得回潮）
    const reconcile = fs.readFileSync(skillFile('novel-settle', 'agents/沉淀对账.md'), 'utf8')
    expect(reconcile, '对账方法 5 应交回主 Agent 落账').toContain('由主 Agent')
    expect(reconcile, '落账路径应指到 worldbook 确认工具').toContain('novel_confirm_worldbook_entry')
    expect(reconcile, '子代理不得在事实变更段写 G 行').not.toContain('在事实变更对应力量体系条目内容末附一行')
    const settleSkill = readSkill('novel-settle')
    expect(settleSkill, '技能步骤 4 应指回子代理核对职责（互指单源）').toContain('只核对不落账')
    // B. 严重程度双词表不并轨、显式映射：两文件各带一行（低↔仅供参考、中↔建议、高↔硬伤）
    const reviewSkill = readSkill('novel-review')
    const fullReview = fs.readFileSync(skillFile('novel-review', 'agents/全量审读.md'), 'utf8')
    for (const [label, text] of [['SKILL', reviewSkill], ['全量审读', fullReview]] as const) {
      expect(text, `${label}: 低↔仅供参考`).toContain('低↔仅供参考')
      expect(text, `${label}: 中↔建议`).toContain('中↔建议')
      expect(text, `${label}: 高↔硬伤`).toContain('高↔硬伤')
    }
    // C. CONTEXT 术语与技能层一致：五核对项（含本卷升级位），四核对项不得回潮
    const context = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'docs', 'CONTEXT.md'), 'utf8')
    expect(context).toContain('五核对项')
    expect(context).toContain('本卷升级位')
    expect(context, 'CONTEXT 不得回潮四核对项旧口径').not.toContain('四核对项')
    expect(readSkill('novel-design'), 'novel-design SKILL 五核对项应在位').toContain('五核对项')
    // D. 采风可信度四态：表格四行（已证实/孤证/推测/归纳），三态标题不得回潮
    const researcher = fs.readFileSync(skillFile('novel-inspiration', 'agents/采风检索.md'), 'utf8')
    expect(researcher).toContain('可信度四态')
    expect(researcher, '三态标题不得回潮（表本就四行）').not.toContain('可信度三态')
    // E. 蓝图：E5′ 余件状态刷新（已落地标记＋差异生成法保持按需后落）＋解冻清单扩容新行关键词
    const blueprint = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'docs', 'design', '增强实施计划.md'), 'utf8')
    expect(blueprint).toContain('余件（状态刷新')
    expect(blueprint).toContain('**按需后落**')
    for (const kw of ['采风纪律——**已落地**', '灵感库——**已落地**', '设计侧评审——**已落地**']) {
      expect(blueprint, `E5′ 余件应含「${kw}」`).toContain(kw)
    }
    for (const kw of ['卷纲四段四写', '事实块头正则', '草稿角色枚举']) {
      expect(blueprint, `core 解冻批候选扩容应含「${kw}」`).toContain(kw)
    }
    // F. settle 卷摘要候选读侧措辞与产品输出串对齐（已兑现并入）
    expect(settleSkill).toContain('账本已收/进行中/已兑现线索')
    // G. 版本零残留：docs/user＋docs/maintenance 当前口径 0.0.19 清零（历史叙事在 CHANGELOG/蓝图，不在用户文档）
    for (const dir of ['user', 'maintenance'] as const) {
      const docsDir = path.join(__dirname, '..', '..', '..', 'docs', dir)
      for (const f of fs.readdirSync(docsDir).filter((name) => name.endsWith('.md'))) {
        expect(fs.readFileSync(path.join(docsDir, f), 'utf8'), `docs/${dir}/${f}: 不应残留上一版 0.0.19`).not.toContain('0.0.19')
      }
    }
  })

  it('0.0.21 行文清晰度批：路径基准三式＋术语四处归一＋书名号违例修正＋序号对齐＋--校验 用法行＋ev 双名＋版本零残留', () => {
    const director = readSkill('novel-director')
    const outline = readSkill('novel-outline')
    const drafting = readSkill('novel-drafting')
    const design = readSkill('novel-design')
    const settle = readSkill('novel-settle')
    const inspiration = readSkill('novel-inspiration')
    const researcher = fs.readFileSync(skillFile('novel-inspiration', 'agents/采风检索.md'), 'utf8')
    const mech = fs.readFileSync(skillFile('novel-analyze', 'references/机制与灵感.md'), 'utf8')
    const checks = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
    const sectSpec = fs.readFileSync(skillFile('novel-outline', 'templates/章细纲固定小节规格.md'), 'utf8')
    // A. 路径引用基准三式落 director「文件纪律」
    expect(director).toContain('引用路径基准（三式）')
    expect(director).toContain('技能包文件＝链接式')
    expect(director).toContain('书仓根文件＝裸相对路径')
    expect(director).toContain('`<工作范围>/` 前缀')
    // A2. 裸书房路径与 {工作范围根} 旧记法清零（五文件）
    for (const [label, text] of [['novel-drafting', drafting], ['novel-design', design], ['novel-inspiration', inspiration], ['采风检索', researcher], ['机制与灵感', mech]] as const) {
      expect(text, `${label}: 不应残留裸书房路径`).not.toContain('`书房/')
      expect(text, `${label}: 不应残留 {工作范围根} 旧记法`).not.toContain('{工作范围根}')
    }
    expect(drafting).toContain('<工作范围>/书房/开书/<书名>/种子底子.md')
    expect(design).toContain('<工作范围>/书房/开书/<书名>/种子底子.md')
    // A3. 构想快照孤例改裸书仓式（书仓根工件不带 <书仓>/ 前缀）
    expect(inspiration).toContain('| 构想快照 | `构想/构想快照.md` |')
    // A4. 规格模板判据位改包根语境式
    expect(sectSpec).toContain('本技能包 references/06_章纲.md')
    // A5. 书名号违例四处修正后形态（书名号只用于书/文章名，技能包引用用链接式或技能包路径）
    expect(outline).toContain('按 [写前十查](agents/写前十查.md) 底本文末的高发雷点内联判据快扫')
    expect(settle).toContain('《细纲备料》技能包 agents/写前十查.md ④接钩预检的末行读取位')
    const clean = fs.readFileSync(skillFile('novel-polish', 'references/1-表达清理.md'), 'utf8')
    expect(clean).toContain('novel-review 技能包 agents/文风与表达审读.md')
    const reshape = fs.readFileSync(skillFile('novel-polish', 'references/2-节奏与重塑.md'), 'utf8')
    expect(reshape).toContain('总判据是契约「叙事方式与文风基调」分部')
    // A6. director 排障入口跨包定位句＋改稿章程加载名（全表唯一断点修复）
    expect(director).toContain('§4.x＝《定调设计》技能包 references/04_大纲.md')
    expect(director).toContain('§6.x＝《细纲备料》技能包 references/06_章纲.md')
    const charter = fs.readFileSync(skillFile('novel-revision', 'agents/改稿章程.md'), 'utf8')
    expect(charter).toContain('完整判据在《工作台总控》技能包 references/08_修订排障.md')
    // B. 术语四处归一：新词在位
    expect(outline).toContain('确认细纲落真源')
    expect(checks).toContain('候选细纲落盘后')
    expect(sectSpec).toContain('候选细纲正文')
    expect(readSkill('novel-review')).toContain('**全量审读（默认）**')
    // B2. 记忆文风条目：两处改口＋条目名不变
    expect(outline).toContain('本书记忆有记忆文风条目时')
    expect(sectSpec).toContain('本书记忆有记忆文风条目时')
    expect(drafting).toContain('文风画像·{书名}')
    // B3. CONTEXT 术语表追加两行（0.0.22 简称清理批裁定删「标尺」简称行，断言随裁定更新——剩记忆文风条目行）
    const context = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'docs', 'CONTEXT.md'), 'utf8')
    expect(context).toContain('| 记忆文风条目 | 文风建档门产物类名')
    // B4. 旧词全树清零（确认章细纲/细纲候选/全量体检/全量章程）
    const skillsRoot = path.join(__dirname, '..', 'skills')
    const walkMd = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
      .flatMap((e) => (e.isDirectory() ? walkMd(path.join(dir, e.name)) : [path.join(dir, e.name)]))
      .filter((p) => p.endsWith('.md'))
    for (const f of walkMd(skillsRoot)) {
      const text = fs.readFileSync(f, 'utf8')
      for (const old of ['确认章细纲', '细纲候选', '全量体检', '全量章程']) {
        expect(text, `${path.relative(skillsRoot, f)}: 归一旧词「${old}」应清零`).not.toContain(old)
      }
    }
    // C. 序号＝类简称＋采集日期＋两位序（对齐零件卡字段定义，消数据漂移）
    expect(researcher).toContain('序号＝类简称＋采集日期＋两位序（同日顺延）')
    // D. 最小导出用法行补 --校验（须与 --目标 同传）
    const exportCli = fs.readFileSync(skillFile('novel-export', 'scripts/最小导出.mjs'), 'utf8')
    expect(exportCli).toContain('[--目标 目录] [--校验 true]（须与 --目标 同传）')
    // E. ev 双名（证据（ev）身份）
    expect(readSkill('novel-analyze')).toContain('证据（ev）身份')
    // F. 呈确认件五名归一（outline＋写前十查）
    for (const [label, text] of [['novel-outline', outline], ['写前十查', checks]] as const) {
      expect(text, `${label}: 呈确认件旧名「呈确认播报」应清零`).not.toContain('呈确认播报')
      expect(text, `${label}: 呈确认件旧名「呈报表」应清零`).not.toContain('呈报表')
      expect(text, `${label}: 呈确认件旧名「作者过目件」应清零`).not.toContain('作者过目件')
    }
    expect(checks).toContain('呈确认件＝一张表（与《细纲备料》SKILL 步骤 5 同格式）')
    // G. 幽灵节点退役（建议返回节点只剩真实两值）
    const styleReview = fs.readFileSync(skillFile('novel-review', 'agents/文风与表达审读.md'), 'utf8')
    expect(styleReview).toContain('| 建议返回节点 | 润色 / 改稿 |')
    expect(styleReview).not.toContain('润色（重生成）')
    // H. 收尾域五文件弯引号清零（半角分号随行文同步，协议串/代码块豁免）
    for (const [label, p] of [
      ['settle SKILL', skillFile('novel-settle', 'SKILL.md')],
      ['沉淀对账', skillFile('novel-settle', 'agents/沉淀对账.md')],
      ['revision SKILL', skillFile('novel-revision', 'SKILL.md')],
      ['改稿章程', skillFile('novel-revision', 'agents/改稿章程.md')],
      ['export SKILL', skillFile('novel-export', 'SKILL.md')],
    ] as const) {
      const text = fs.readFileSync(p, 'utf8')
      expect(text, `${label}: 弯引号应清零`).not.toContain('“')
      expect(text, `${label}: 弯引号应清零`).not.toContain('”')
    }
    // I. 版本零残留：docs/user＋docs/maintenance 当前口径 0.0.20 清零（历史叙事在 CHANGELOG/蓝图，不在用户文档）
    for (const dir of ['user', 'maintenance'] as const) {
      const docsDir = path.join(__dirname, '..', '..', '..', 'docs', dir)
      for (const f of fs.readdirSync(docsDir).filter((name) => name.endsWith('.md'))) {
        expect(fs.readFileSync(path.join(docsDir, f), 'utf8'), `docs/${dir}/${f}: 不应残留上一版 0.0.20`).not.toContain('0.0.20')
      }
    }
  })

  it('0.0.22 简称清理批：独立「标尺」全称化（取数算式行/模板/审读/参考标尺自指）＋CONTEXT 简称行删除＋类简称标识符保留＋版本零残留', () => {
    const ladder = fs.readFileSync(skillFile('novel-design', 'templates/对手梯队子表规格.md'), 'utf8')
    const scale = fs.readFileSync(skillFile('novel-design', 'references/参考标尺.md'), 'utf8')
    const context = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'docs', 'CONTEXT.md'), 'utf8')
    // A. 取数算式行协议串全称化后在位（规格模板＋CONTEXT 术语表两处同串），旧串清零
    expect(ladder).toContain('取数：参考标尺·固定层＋比例层×衰减×题材')
    expect(context).toContain('取数：参考标尺·固定层＋比例层×衰减×题材')
    expect(ladder).not.toContain('取数：标尺·')
    expect(context).not.toContain('取数：标尺·')
    // B. CONTEXT 简称行删除（术语表不立缩略词）；记忆文风条目行保留（类名/条目名两层命名，非简称）
    expect(context).not.toContain('简称')
    expect(context).toContain('| 记忆文风条目 | 文风建档门产物类名')
    // C. 参考标尺.md 内部自指全称化（未校准标注×2＋卡是法句＋校准流程＋下一轮校准）
    //    （0.0.25 批裁定同步：每章字数行改 3500 基准后「卡是法参考标尺是默认」句废止，改钉新句「快节奏短章型须作者显式下调才可用」——作者裁定压过校准默认）
    expect(scale).toContain('该题材参考标尺未校准')
    expect(scale).toContain('快节奏短章型须作者显式下调才可用')
    expect(scale).toContain('待参考标尺校准流程定')
    expect(scale).toContain('下一轮参考标尺校准')
    // D. 全 skills prose 与 CONTEXT 独立「标尺」零命中（负向断言，排除参考标尺子串与 assets/）
    //    白名单两处豁免：标尺校准_六书.json＝仓库外校准产物文件名（文件名不改名）；
    //    KB 净版 02_人物设计.md「存在本身就是标尺」＝弧光行比喻用法（非参考标尺简称），净版纪律只报告待作者裁定
    const skillsRoot = path.join(__dirname, '..', 'skills')
    const walkMd = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
      .flatMap((e) => (e.isDirectory() && e.name !== 'assets' ? walkMd(path.join(dir, e.name)) : [path.join(dir, e.name)]))
      .filter((p) => p.endsWith('.md'))
    for (const f of [...walkMd(skillsRoot), path.join(__dirname, '..', '..', '..', 'docs', 'CONTEXT.md')]) {
      const text = fs.readFileSync(f, 'utf8')
        .split('标尺校准_六书.json').join('')
        .split('存在本身就是标尺').join('')
      expect(text, `${path.relative(skillsRoot, f)}: 独立「标尺」应全称化为「参考标尺」`).not.toMatch(/(?<!参考)标尺/)
    }
    // E. 类简称表＝序号前缀标识符协议（0.0.36 全量审查修复批起 SKILL 完整枚举退役改指路单源——防误伤钉改挂单源侧与指针句）
    expect(readSkill('novel-inspiration')).toContain('类简称十值与可信度四态枚举单源在 [采风检索](agents/采风检索.md)')
    const researcher = fs.readFileSync(skillFile('novel-inspiration', 'agents/采风检索.md'), 'utf8')
    expect(researcher).toContain('类简称＝古词/台词/剧情/人物/历史/文化/影动/现实/命名/设定')
    expect(researcher).toContain('序号＝类简称＋采集日期＋两位序')
    // F. 版本零残留：docs/user＋docs/maintenance 当前口径 0.0.21 清零（历史叙事在 CHANGELOG/蓝图，不在用户文档）
    for (const dir of ['user', 'maintenance'] as const) {
      const docsDir = path.join(__dirname, '..', '..', '..', 'docs', dir)
      for (const f of fs.readdirSync(docsDir).filter((name) => name.endsWith('.md'))) {
        expect(fs.readFileSync(path.join(docsDir, f), 'utf8'), `docs/${dir}/${f}: 不应残留上一版 0.0.21`).not.toContain('0.0.21')
      }
    }
  })

  it('0.0.23 狗头军师吸收批：判据落点规则＋三处行为化示范＋发现项处置三列表＋评审主问题行＋版本零残留', () => {
    // A. 判据落点规则落在写前十查纪律段；⑦动机三问第一问行为化（内核欲望→可观察问句）
    const checks = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
    expect(checks).toContain('判据落点规则：引用知识库判据时，把抽象概念转成对本章工件的可观察问句')
    expect(checks).toContain('有不使劲的选择吗」式）')
    expect(checks).toContain('主角为什么非干不可——他在本章的每个选择，往哪个欲望上使劲？有不使劲的选择吗？')
    expect(checks).not.toContain('（内核欲望没变吗）？')
    // B. 结局镜像卡「完成了变化」行为化示范（novel-design SKILL）
    expect(readSkill('novel-design')).toContain('结局处他的哪个具体选择，是开头那个他不会做的？指不出这个选择，变化就还停在宣告')
    // C. 读者评审弃书点预测判断落点行为化（划走行为定位）
    const reader = fs.readFileSync(skillFile('novel-design', 'agents/读者评审.md'), 'utf8')
    expect(reader).toContain('用读者行为问自己：读到哪一行我会划走')
    // D. 发现项处置三列表：三列列名＋六处置各一行＋停止条件可检验纪律＋篇幅条款衔接
    const review = readSkill('novel-review')
    expect(review).toContain('发现项处置三列表')
    expect(review).toContain('| 信号（发现类型/严重度） | 动作（返回节点或主控动作） | 停止条件（修完的可检验状态） |')
    expect(review).toContain('不写「改好为止」式空话')
    expect(review).toContain('篇幅类发现项按上方「篇幅处置建议分级」走')
    for (const node of ['| 润色 |', '| 改稿 |', '| 细纲 |', '| 备料 |', '| 沉淀（账本更正） |', '| 作者裁决（主控动作，非返回节点） |']) {
      expect(review, `处置三列表应覆盖处置行「${node}」`).toContain(node)
    }
    // E. 两席评审报告：主问题行（总评前）＋问题清单 ★ 标＋复评回归句；互指纪律不变
    const writer = fs.readFileSync(skillFile('novel-design', 'agents/作家评审.md'), 'utf8')
    for (const [label, text] of [['作家评审', writer], ['读者评审', reader]] as const) {
      expect(text, `${label}: 报告头主问题行应在位`).toContain('**主问题（仅一个）**：{全部发现')
      expect(text, `${label}: 主问题行应紧邻总评之前`).toMatch(/\*\*主问题（仅一个）\*\*：\{全部发现[^\n]*\}\n\n## 总评/)
      expect(text, `${label}: 问题清单 ★ 标规则在位`).toContain('# 列行首标 ★')
      expect(text, `${label}: 复评回归句在位`).toContain('复评优先回归主问题——主问题未解不改次要项结论')
      expect(text, `${label}: 两席互指纪律不变`).toContain('两席互不通气，各自独立出具')
    }
    // F. 版本零残留：docs/user＋docs/maintenance 当前口径 0.0.22 清零（历史叙事在 CHANGELOG/蓝图，不在用户文档）
    for (const dir of ['user', 'maintenance'] as const) {
      const docsDir = path.join(__dirname, '..', '..', '..', 'docs', dir)
      for (const f of fs.readdirSync(docsDir).filter((name) => name.endsWith('.md'))) {
        expect(fs.readFileSync(path.join(docsDir, f), 'utf8'), `docs/${dir}/${f}: 不应残留上一版 0.0.22`).not.toContain('0.0.22')
      }
    }
  })

  it('协议串对齐批（铁律 7 机器化）：运行时文本点名的脚本协议串与脚本源码实际字符串逐字对撞——五组', () => {
    // 对撞① 材料包十段名：novel-outline SKILL 备料段列的十段 vs core/src/assembly/sections.ts 段名数组逐字
    const outline = readSkill('novel-outline')
    const segLine = outline.split('\n').find((l) => l.startsWith('本章任务与确认细纲／'))
    expect(segLine, 'novel-outline/SKILL.md 应有十段名列表行（本章任务与确认细纲／…）').toBeDefined()
    const skillSegs = segLine!.split('。')[0]!.trim().split('／')
    expect(skillSegs.length, `材料包段名对撞：novel-outline/SKILL.md 列了 ${skillSegs.length} 段，packages/core/src/assembly/sections.ts 材料包十段为 ${材料包十段.length} 段`).toBe(材料包十段.length)
    for (const [i, name] of [...材料包十段].entries()) {
      expect(skillSegs[i], `材料包段名对撞失败（第 ${i + 1} 段）：SKILL 侧 novel-outline/SKILL.md=「${skillSegs[i]}」 vs core 侧 packages/core/src/assembly/sections.ts=「${name}」`).toBe(name)
    }
    // 对撞② 章摘要固定行：语态样本：/章末状态： 在 novel-settle SKILL 与 agents/沉淀对账.md 双侧同串＋末行纪律同口径＋写前十查④消费末行
    //    core 侧现实（0.0.23 批 grep 核验）：core 生产源码（读侧 summary/index.ts、写侧 prepare/pack.ts）零内联此二串——
    //    固定行是沉淀子代理协议串，core 以章摘要整文件为传输单元；core 侧仅在测试侧出现（tests/helpers/fixture-book.ts 的「章末状态」与 settlement-candidates.spec.ts 的夹具）
    const settle = readSkill('novel-settle')
    const reconcile = fs.readFileSync(skillFile('novel-settle', 'agents/沉淀对账.md'), 'utf8')
    for (const [label, text] of [['novel-settle/SKILL.md', settle], ['novel-settle/agents/沉淀对账.md', reconcile]] as const) {
      expect(text, `${label}: 章摘要固定行「语态样本：」缺失`).toContain('语态样本：')
      expect(text, `${label}: 章摘要固定行「章末状态：」缺失`).toContain('章末状态：')
    }
    expect(settle, 'novel-settle/SKILL.md: 末行纪律口径应与沉淀对账一致').toContain('语态样本不得占末行')
    expect(reconcile, 'novel-settle/agents/沉淀对账.md: 末行纪律口径应与 settle SKILL 一致').toContain('末行位留给章末状态')
    const checksTenQian = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
    expect(checksTenQian, 'novel-outline/agents/写前十查.md ④接钩预检应是章末状态末行的消费位').toContain('末行＋上一章定稿末段')
    // 对撞③ 七件文件名：settle SKILL 落盘七件列表 vs core/src/prepare/pack.ts 待定稿包七件逐字（强化既有 contains 级断言）
    const packLine = settle.split('\n').find((l) => l.includes('落盘七件到'))
    expect(packLine, 'novel-settle/SKILL.md 应有「落盘七件到」列表行').toBeDefined()
    const skillFiles = packLine!.slice(packLine!.indexOf('——') + 2).split('。')[0]!.split(' / ').map((s) => s.trim())
    expect(skillFiles.length, `七件文件名对撞：novel-settle/SKILL.md 列了 ${skillFiles.length} 件，packages/core/src/prepare/pack.ts 待定稿包七件为 ${待定稿包七件.length} 件`).toBe(待定稿包七件.length)
    for (const [i, name] of [...待定稿包七件].entries()) {
      expect(`${skillFiles[i]}.md`, `七件文件名对撞失败（第 ${i + 1} 件）：SKILL 侧 novel-settle/SKILL.md=「${skillFiles[i]}」 vs core 侧 packages/core/src/prepare/pack.ts=「${name}」`).toBe(name)
    }
    // 对撞④ 灵感库九列表头：novel-inspiration SKILL 零件卡字段行 vs assets 种子册表头行（基础名逐字逐序，带注列「一句话（骨）」全形逐字）
    const inspiration = readSkill('novel-inspiration')
    const fieldLine = inspiration.split('\n').find((l) => l.includes('**零件卡字段**'))
    expect(fieldLine, 'novel-inspiration/SKILL.md 应有「**零件卡字段**」行').toBeDefined()
    const baseName = (s: string): string => s.replace(/（[^）]*）/g, '').trim()
    const skillCols = fieldLine!.slice(fieldLine!.indexOf('：`') + 2).split('`')[0]!.split('｜').map(baseName)
    const seed = fs.readFileSync(skillFile('novel-inspiration', 'assets/灵感库种子/人物原型/零件卡.md'), 'utf8')
    const headerRow = seed.split('\n').find((l) => l.startsWith('| 序号'))
    expect(headerRow, 'assets/灵感库种子/人物原型/零件卡.md 应有表头行（| 序号 …）').toBeDefined()
    const seedCols = headerRow!.split('|').slice(1, -1).map((c) => baseName(c.trim()))
    expect(skillCols.length, `灵感库表头对撞：novel-inspiration/SKILL.md 列了 ${skillCols.length} 列，assets 种子册表头为 ${seedCols.length} 列`).toBe(seedCols.length)
    expect(seedCols.length, '灵感库表头对撞：assets 种子册表头应为九列').toBe(9)
    for (const [i, name] of seedCols.entries()) {
      expect(skillCols[i], `灵感库表头对撞失败（第 ${i + 1} 列）：SKILL 侧 novel-inspiration/SKILL.md=「${skillCols[i]}」 vs 种子侧 assets/灵感库种子/人物原型/零件卡.md=「${name}」`).toBe(name)
    }
    expect(fieldLine!, '带注列全形：SKILL 侧「一句话（骨）」应与种子表头逐字一致').toContain('一句话（骨）')
    expect(headerRow!, '带注列全形：种子表头「一句话（骨）」应与 SKILL 逐字一致').toContain('一句话（骨）')
    // 对撞⑤ 脚本用法行 vs 参数解析代码实际接受的 flag（三份 .mjs 头注 ↔ bundle/src/scripts 三个 CLI；抽 --校验/--book/--变更路径 三例）
    const usageFlags = (text: string): string[] => {
      const usage = text.split('\n').find((l) => l.includes('node <resourceBase>/scripts/'))
      expect(usage, '薄入口头注应有「node <resourceBase>/scripts/…」用法行').toBeDefined()
      return [...new Set(usage!.match(/--[\p{L}]+/gu) ?? [])]
    }
    const cliSrc = (name: string): string => fs.readFileSync(path.join(__dirname, '..', 'src', 'scripts', name), 'utf8')
    // ⑤-a 最小导出.mjs ↔ export-cli.ts（allowed 白名单集合）；样例 --校验
    const exportEntry = fs.readFileSync(skillFile('novel-export', 'scripts/最小导出.mjs'), 'utf8')
    const exportCli = cliSrc('export-cli.ts')
    const allowedMatch = exportCli.match(/new Set\(\[((?:\s*'[^']+',?)+)\]\)/)
    expect(allowedMatch, 'packages/bundle/src/scripts/export-cli.ts 应有 allowed 选项集合字面量').toBeDefined()
    const allowed = allowedMatch![1]!.match(/'([^']+)'/g)!.map((s) => s.slice(1, -1))
    expect(new Set(usageFlags(exportEntry)), '用法行 flag 对撞失败：skills/novel-export/scripts/最小导出.mjs 头注用法行 vs packages/bundle/src/scripts/export-cli.ts allowed 集合').toEqual(new Set(allowed))
    expect(exportEntry, '--校验 样例：用法行应有同传条款').toContain('[--校验 true]（须与 --目标 同传）')
    expect(exportCli, '--校验 样例：解析侧白名单应含 --校验').toContain("'--校验'")
    expect(exportCli, '--校验 样例：解析侧错误信息应与用法行口径一致').toContain('校验须传 --校验 true 和 --目标 目录')
    // ⑤-b 影响分析.mjs ↔ impact-cli.ts（argValue 名全集）；样例 --变更路径
    const impactEntry = fs.readFileSync(skillFile('novel-outline', 'scripts/影响分析.mjs'), 'utf8')
    const impactCli = cliSrc('impact-cli.ts')
    const impactFlags = [...new Set([...impactCli.matchAll(/argValue\(argv, '([^']+)'\)/g)].map((m) => `--${m[1]!}`))]
    expect(impactFlags.length, 'packages/bundle/src/scripts/impact-cli.ts 应解析至少一个命名选项').toBeGreaterThan(0)
    expect(new Set(usageFlags(impactEntry)), '用法行 flag 对撞失败：skills/novel-outline/scripts/影响分析.mjs 头注用法行 vs packages/bundle/src/scripts/impact-cli.ts argValue 名全集').toEqual(new Set(impactFlags))
    expect(impactEntry, '--变更路径 样例：用法行应有占位说明').toContain('--变更路径 <相对路径>')
    expect(impactCli, '--变更路径 样例：解析侧应取同名参数').toContain("argValue(argv, '变更路径')")
    expect(impactCli, '--变更路径 样例：解析侧错误信息应与用法行口径一致').toContain('必须传 --变更路径 书仓内相对路径')
    // ⑤-c 材料备料.mjs ↔ materials-cli.ts；样例 --book
    const materialsEntry = fs.readFileSync(skillFile('novel-outline', 'scripts/材料备料.mjs'), 'utf8')
    const materialsCli = cliSrc('materials-cli.ts')
    const materialsFlags = [...new Set([...materialsCli.matchAll(/argValue\(argv, '([^']+)'\)/g)].map((m) => `--${m[1]!}`))]
    expect(new Set(usageFlags(materialsEntry)), '用法行 flag 对撞失败：skills/novel-outline/scripts/材料备料.mjs 头注用法行 vs packages/bundle/src/scripts/materials-cli.ts argValue 名全集').toEqual(new Set(materialsFlags))
    expect(materialsEntry, '--book 样例：用法行应有占位说明').toContain('--book <bookRoot>')
    expect(materialsCli, '--book 样例：解析侧应取同名参数').toContain("argValue(argv, 'book')")
    expect(materialsCli, '--book 样例：解析侧错误信息应与用法行口径一致').toContain('必须传 --book 书仓路径')
    // 对撞⑥ 发现项处置三列表的动作列 ↔ 九份审读底本「建议返回节点」枚举单源（0.0.23 审查批补：新增枚举表自身要有单源保护）
    const reviewSkill = readSkill('novel-review')
    const tableStart = reviewSkill.indexOf('**发现项处置三列表**')
    expect(tableStart, 'novel-review/SKILL.md 应有「发现项处置三列表」').toBeGreaterThanOrEqual(0)
    const tableEnd = reviewSkill.indexOf('派发前核对', tableStart)
    const tableRows = reviewSkill.slice(tableStart, tableEnd).split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| 信号') && !l.startsWith('|---'))
    expect(tableRows.length, `三列表对撞：应有 6 行数据行，实得 ${tableRows.length}`).toBe(6)
    const fullSweep = fs.readFileSync(skillFile('novel-review', 'agents/全量审读.md'), 'utf8')
    const nodeEnumLine = fullSweep.split('\n').find((l) => l.includes('| 建议返回节点 |'))
    expect(nodeEnumLine, 'novel-review/agents/全量审读.md 应有「建议返回节点」枚举行（九底本单源）').toBeDefined()
    const nodeEnum = nodeEnumLine!.split('|')[2]!.split('/').map((s) => s.trim()).filter(Boolean)
    let controllerRows = 0
    for (const row of tableRows) {
      const action = row.split('|')[2]!.trim()
      if (action.includes('主控动作')) { controllerRows += 1; continue }
      expect(nodeEnum, `三列表动作列对撞失败：「${action}」不在 agents/全量审读.md 建议返回节点枚举 ${JSON.stringify(nodeEnum)} 内`).toContain(action)
    }
    expect(controllerRows, '三列表对撞：主控动作行应恰一行（作者裁决），且须带非返回节点标注').toBe(1)
    expect(reviewSkill.slice(tableStart, tableEnd), '三列表对撞：主控动作行的停止条件应引用步骤 6 六值单源（无法判断不算；0.0.30 枚举加已转提案）').toContain('六值之一')
  })

  it('0.0.24 反推落地首批：钩型配比两层制＋双钩三列＋调剂行＋升级四件＋悼亡法双挂＋定格问号＋信息边界判据＋篇幅双模式＋版本零残留', () => {
    // A1 标尺行：追读力量化区「章末钩型配比」两层制——硬红线/参考区间/双书实测数（诡秘 62、大奉约 78，泄压 6.4%/5%——出处两书报告，区间并陈不平均）
    const scale = fs.readFileSync(skillFile('novel-design', 'references/参考标尺.md'), 'utf8')
    expect(scale).toContain('| 章末钩型配比 |')
    // 0.0.26 标尺 v0.5 批裁定同步：配比行改驱动类型分带后【待校准】前缀退役（两带均有五书实证），断言改钉两层制本体（分带详断言见 0.0.26 组）
    expect(scale).toContain('两层制')
    expect(scale).toContain('硬红线（任何尺度适用）')
    expect(scale).toContain('危机钩（即时威胁型）兑现章号距钩章 ≤5 章')
    expect(scale).toContain('泄压钩只居高潮余波位')
    expect(scale).toContain('参考区间（仅 ≥50 章窗口适用')
    // 0.0.25 独立审查 R3：参考区间改出处可溯式（张力 60-80 取整自双书 62/78、泄压 ≤10 上浮留余）；无出处的 55-70 清零——负断言只钉配比行，变更记录 v0.4-D 历史记述保留
    // 0.0.26 标尺 v0.5 批裁定同步：区间按驱动类型前缀分裂（张力驱动档 60-80% 三书并陈/情感驱动档 25-40%），旧「双书并陈」区间串随三书实证退役，断言随裁同步
    expect(scale).toContain('张力类 60-80%')
    expect(scale).toContain('三书并陈取整区间')
    expect(scale).toContain('张力档 ≤10%（双书 5%-6.4% 上浮留余）')
    const hookRatioRow = scale.split('\n').find((l) => l.includes('| 章末钩型配比 |'))
    expect(hookRatioRow, '参考标尺应有「章末钩型配比」行').toBeDefined()
    expect(hookRatioRow!, '配比行不得残留无出处的 55-70 区间').not.toContain('55-70')
    expect(scale).toContain('诡秘张力类 62%')
    expect(scale).toContain('大奉约 78%')
    // 0.0.26 独立审查 R2 同步：情感档泄压 ≤15% 出处改引重生啊（原误挂张力档双书 6.4%/5% 数据），断言随出处改钉重生啊口径串
    expect(scale).toContain('情感档 ≤15%（重生啊单书口径：泄压类＝温情收束')
    // A1 判据①：章末双钩节三列口径（钩型｜承诺｜兑现章号）＋定格即问号（A3 协同技法）
    const sect = fs.readFileSync(skillFile('novel-outline', 'templates/章细纲固定小节规格.md'), 'utf8')
    expect(sect).toContain('**承诺列**＋**兑现章号列**')
    expect(sect).toContain('三列口径：钩型｜承诺（下章拿什么还）｜兑现章号')
    // 0.0.33 挂账修复（危机钩红线单源化）：规格不再重述阈值，指路参考标尺该行
    expect(sect).toContain('危机类即时威胁钩兑现时限踩线与否按本行末参考标尺指路判')
    expect(sect, '规格不应重述危机钩阈值数值').not.toContain('≤5 章')
    expect(sect).toContain('定格即问号——泄压与牵引兼得')
    expect(sect).toContain('「章末钩型配比」行')
    // A1 判据②：写前十查⑩兑现章号半句＋标尺行指引（0.0.33 阈值改指路不重述）
    const checks = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
    expect(checks).toContain('兑现章号是否踩红线（危机钩红线阈值与定义见下判据延伸所指参考标尺「章末钩型配比」行')
    expect(checks, '写前十查不应重述危机钩阈值数值').not.toContain('≤5 章')
    expect(checks).toContain('承诺列或兑现章号列缺失＝补写再呈')
    expect(checks).toContain('「章末钩型配比」行')
    // A4 调剂行：高潮后 2 章内必回低烈度＋三式＋与 §6.1 分工（防同规则双源）
    const vol = fs.readFileSync(skillFile('novel-design', 'templates/卷纲固定段规格.md'), 'utf8')
    expect(vol).toContain('## 高潮后调剂（弧线段内固定核对行）')
    expect(vol).toContain('高潮章后 2 章内**必须**回低烈度')
    expect(vol).toContain('日常（生活线回稳）/喜剧（社交喜剧章）/清算（余债收拾）')
    expect(vol).toContain('全卷不连续两章钝收')
    expect(vol).toContain('§6.1 管单章怎么收束')
    expect(vol).toContain('本行管卷级调剂节奏')
    // A5 升级节点：模板行事件化四件＋写前十查②核对（两处互指）
    const tpl = fs.readFileSync(skillFile('novel-design', 'templates/世界书/力量体系条目模板.md'), 'utf8')
    expect(tpl).toContain('- 升级节点：')
    expect(tpl).toContain('事件化四件')
    expect(tpl).toContain('有对手或见证在场，不闭关数值跳')
    expect(tpl).toContain('验证 ≤3 章')
    expect(tpl).toContain('代价三笔强度正相关')
    expect(tpl).toContain('《细纲备料》技能包 agents/写前十查.md 检查②')
    expect(checks).toContain('时核对事件化四件')
    expect(checks).toContain('「升级节点」行')
    expect(checks).toContain('缺件＝🔴 呈报')
    // A11 悼亡法双挂：备料段自查（补埋窗口）＋写作卡死亡章判据（两处互指）
    const outline = readSkill('novel-outline')
    expect(outline).toContain('死亡预埋自查（悼亡法）')
    expect(outline).toContain('死前 3 章内是否已埋 ≥2 处日常细节')
    expect(outline).toContain('不等到死亡章才发现无物可收')
    const cards = fs.readFileSync(skillFile('novel-drafting', 'agents/写作卡.md'), 'utf8')
    expect(cards).toContain('本章写人物死亡时：回收死前埋设的日常细节至少一处')
    expect(cards).toContain('不给大段独白补设定')
    expect(cards).toContain('「死亡预埋自查」')
    // A3 信息边界两条：揭示 ≤70%＋末尾新问号＋钝·定格豁免（定格即问号协同）
    expect(sect).toContain('揭示量 ≤70%')
    expect(sect).toContain('章末留一个指向下层真相的新问号')
    expect(sect).toContain('钝·定格章豁免强问号')
    // P16 篇幅双模式：浮动式/恒定式＋内容承担节奏为纲＋标尺变更记录
    expect(scale).toContain('篇幅双模式皆合法（内容承担节奏为纲）')
    expect(scale).toContain('浮动式＝章长作事件烈度放大器')
    expect(scale).toContain('恒定式＝章长收窄恒定、节奏全部由内容承担')
    expect(scale).toContain('v0.4-D')
    // 版本零残留：docs/user＋docs/maintenance 当前口径 0.0.23 清零（历史叙事在 CHANGELOG，不在用户文档）
    for (const dir of ['user', 'maintenance'] as const) {
      const docsDir = path.join(__dirname, '..', '..', '..', 'docs', dir)
      for (const f of fs.readdirSync(docsDir).filter((name) => name.endsWith('.md'))) {
        expect(fs.readFileSync(path.join(docsDir, f), 'utf8'), `docs/${dir}/${f}: 不应残留上一版 0.0.23`).not.toContain('0.0.23')
      }
    }
  })

  it('0.0.25 配给与台账批：信息释放台账三接线＋信息释放行＋钩型双轴＋调剂对连钝＋③伏笔/验证到期＋3500 基准＋单元配给＋版本零残留', () => {
    // B3 信息释放台账：结构单源在 novel-design 建账行（书房路径＋揭示域清单＋登记行式＋状态枚举）；工件契约表加行
    const design = readSkill('novel-design')
    expect(design).toContain('信息释放台账建账')
    expect(design).toContain('`<工作范围>/书房/信息释放/<书名>.md`')
    expect(design).toContain('揭示域清单')
    expect(design).toContain('未知/部分/已释')
    expect(design).toContain('累计已释 x/y＝z%｜新问号一句')
    expect(design).toContain('累计为信息行不作案据')
    expect(design).toContain('本章可释集')
    expect(design).toContain('力量体系条目同批')
    expect(design).toContain('| 信息释放台账 |')
    expect(design).toContain('种子底子先例')
    expect(design).toContain('卷02 起不开新账')
    // 接线②：outline 备料段读台账规划本章揭示量（未建账如实注明，不编造清单）
    const outline = readSkill('novel-outline')
    expect(outline).toContain('信息释放规划（读台账）')
    expect(outline).toContain('「未建账」')
    // 接线③：写前十查信息释放行（固定行，接雷点快扫行后——揭示登记＋累计 ≤70% 核对＋零揭示预警）＋配给合计半句
    const checks = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
    expect(checks).toContain('信息释放行')
    expect(checks).toContain('连续 2 章零揭示＝信息饥渴预警（呈报不拦卡）')
    expect(checks).toContain('配给合计核对（呈确认件半句）')
    expect(outline).toContain('**信息释放行**（固定行，接雷点快扫行后）')
    expect(outline).toContain('信息饥渴预警')
    expect(outline).toContain('**配给合计核对**（半句）')
    // 信息边界 ≤70% 判据＝本章口径（0.0.25 独立审查 R2：累计 x/y＝z% 只是信息行不作案据），未建账退回弱判据，终卷收束豁免
    const sect = fs.readFileSync(skillFile('novel-outline', 'templates/章细纲固定小节规格.md'), 'utf8')
    expect(sect).toContain('本章计划释出条目占本章可释集')
    expect(sect).toContain('台账累计 x/y＝z% 为信息行不作案据')
    expect(sect).toContain('终卷收束章豁免上限——收束期允许满释，如实登记')
    expect(sect).toContain('退回「仍不知道」行非空才算预算守住的弱判据并注明')
    expect(sect, '累计口径旧判据应清零（改本章口径）').not.toContain('按信息释放台账累计核对')
    // 接线④：settle 沉淀更新台账（状态流转＋登记行追加，无账跳过不开新账）
    const settle = readSkill('novel-settle')
    expect(settle).toContain('信息释放台账')
    expect(settle).toContain('未知→部分→已释')
    expect(settle).toContain('无账跳过不开新账')
    // A1 钩型双轴：形态×动机两轴枚举（七动机词单源在章细纲规格——0.0.25 独立审查 O1 补第七值「情绪」）＋行式；标尺映射句；写前十查⑩示例
    expect(sect).toContain('收束形态轴枚举：信息/断点/钝·定格/宣言/反讽')
    expect(sect).toContain('功能动机轴枚举：危机/升级/验证/揭示/泄压/日常/情绪')
    expect(sect).toContain('章末双钩的情绪钩落「情绪」')
    expect(sect).toContain('两轴枚举单源在本规格')
    expect(sect).toContain('钩型：断点·危机｜承诺：…｜兑现章号：…')
    const scale = fs.readFileSync(skillFile('novel-design', 'references/参考标尺.md'), 'utf8')
    expect(scale).toContain('双轴映射')
    expect(scale).toContain('张力类＝形态×动机组合中带威胁/期待供给的组合')
    expect(scale).toContain('泄压类＝功能动机轴为泄压')
    expect(scale).toContain('日常·中性不参与张力/泄压计量')
    expect(checks).toContain('钩型：断点·危机｜承诺：…｜兑现章号：…')
    // M13 调剂对连钝：相连钝收＝调剂组成部分，红线按章整体烈度判
    const vol = fs.readFileSync(skillFile('novel-design', 'templates/卷纲固定段规格.md'), 'utf8')
    expect(vol).toContain('调剂对（高潮章＋调剂章）相连钝收＝调剂的组成部分')
    expect(vol).toContain('不计入「不连续两钝」红线')
    expect(vol).toContain('红线按章整体烈度判')
    // R4 ③扩词：伏笔/验证到期——核对对象加力量体系升级节点验证窗口与排期（双记位兜底）；备料段自查行点名双记位
    expect(checks).toContain('**伏笔/验证到期**')
    expect(checks).toContain('验证 ≤3 章窗口与本书落砣排期')
    expect(checks).toContain('近期窗口条目＋账本双记位漏写时本查兜底')
    expect(outline).toContain('**验证到期自查**')
    expect(outline).toContain('近期窗口条目＋`账本/线索.md`')
    // 字数 3500 基准：标尺行＋v0.4-E 留痕＋design 示例新数值＋outline 四千字示例（旧两千字示例清零）
    expect(scale).toContain('**3500-4500 字**')
    expect(scale).toContain('作者裁定 2026-10-11：基准与下限抬至 3500')
    expect(scale).toContain('快节奏短章型须作者显式下调才可用')
    expect(scale).toContain('过渡档下浮例外照旧')
    expect(scale).toContain('v0.4-E')
    expect(design).toContain('- 目标汉字数: 4000')
    expect(design).toContain('- 下限汉字数: 3500')
    expect(design).toContain('- 上限汉字数: 4500')
    expect(design).not.toContain('- 目标汉字数: 2000')
    expect(outline).toContain('四千字示例')
    expect(outline).not.toContain('两千字示例')
    expect(outline).not.toContain('预计汉字数')
    // 单元配给：预期字数增补行＋「加单元（加事）不硬堆字」＋drafting 配给表＋写作卡判据
    expect(sect).toContain('`- 预期字数：{正整数}`')
    expect(sect).toContain('加单元（加事）不硬堆字')
    const drafting = readSkill('novel-drafting')
    expect(drafting).toContain('逐单元预期字数配给表')
    expect(drafting).toContain('细纲未带该行时按各单元目标自拟配给并注明自拟')
    const cards = fs.readFileSync(skillFile('novel-drafting', 'agents/写作卡.md'), 'utf8')
    expect(cards).toContain('单元没写够配给先查有没有漏拍的戏（缺拍补拍），不是加描写凑数')
    // 独立审查修复批（0.0.24/0.0.25 两批审查 R1-R4 必修＋O1-O3＋两 Nit；版本保持 0.0.25）
    // R4① review 侧钩型兑现接线：全量审读维度 1 章末双钩核对处回查兑现章号登记与红线（0.0.33 阈值随任务包摘录，底本不抄数）
    const sweepReview = fs.readFileSync(skillFile('novel-review', 'agents/全量审读.md'), 'utf8')
    expect(sweepReview).toContain('红线（危机钩兑现时限——阈值在派发材料的参考标尺摘录「章末钩型配比」行，底本不抄数值）')
    expect(sweepReview, '审读底本不应重述危机钩阈值数值').not.toContain('危机类 ≤5 章')
    expect(sweepReview).toContain('上一次呈报的钩是否按期兑现')
    // R4② 卷纲调剂行补 A4 两判据（大战/高潮段禁泄压钩插入；大战前可排纯喜剧章作蓄压调剂）
    expect(vol).toContain('大战/高潮段禁泄压钩插入')
    expect(vol).toContain('大战前可排纯喜剧章作蓄压调剂')
    // R2 写前十查信息释放行同步本章口径句
    expect(checks).toContain('本章计划释出条目占本章可释集')
    expect(checks).toContain('是信息行不作案据')
    // O2 配给核对回退：细纲未带配给行＝呈报「未配给」不判红
    expect(checks).toContain('细纲未带配给行＝呈报「未配给」，不判红')
    // O3 排期落位：力量体系升级节点行带排期取数位（写前十查③与备料验证到期自查）
    const powerTpl = fs.readFileSync(skillFile('novel-design', 'templates/世界书/力量体系条目模板.md'), 'utf8')
    expect(powerTpl).toContain('排期＝各阶预计落砣章段（如 2-3/8-10）')
    expect(powerTpl).toContain('写前十查③与备料验证到期自查的取数位')
    // Nit① ⑩钩诺呈报行示例带兑现章号；Nit② 「加单元不加字」旧措辞清零（统一为「加单元（加事）不硬堆字」）
    expect(checks).toContain('情绪钩承诺…｜兑现章号：…')
    expect(checks).not.toContain('加单元不加字')
    // R3 标尺变更记录 v0.4-F 留痕（参考区间出处可溯改版）
    expect(scale).toContain('v0.4-F')
    // R1 docs 旧两千字示例零残留：upgrade-backup 含 3500/4000 新值＋不含 2000/1600/2400，docs 全目录旧数值清零
    const upgradeBackup = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'docs', 'user', 'upgrade-backup.md'), 'utf8')
    for (const v of ['- 目标汉字数: 4000', '- 下限汉字数: 3500', '- 上限汉字数: 4500']) {
      expect(upgradeBackup, `upgrade-backup 应含 3500 基准新值「${v}」`).toContain(v)
    }
    for (const staleNum of ['2000', '1600', '2400']) {
      expect(upgradeBackup, `upgrade-backup 不应残留旧两千字示例数值「${staleNum}」`).not.toContain(staleNum)
    }
    const docsRoot = path.join(__dirname, '..', '..', '..', 'docs')
    const walkDocs = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
      .flatMap((e) => (e.isDirectory() ? walkDocs(path.join(dir, e.name)) : [path.join(dir, e.name)]))
      .filter((p) => p.endsWith('.md'))
    for (const f of walkDocs(docsRoot)) {
      const text = fs.readFileSync(f, 'utf8')
      // 0.0.43 收口缩面：仅「模型写作机制调研.md」豁免 '2000'（LongWriter 研究引文，非篇幅示例），精确文件名匹配；其余数值全目录全量扫
      // 0.0.44 独立化批：设计源存档/证据存档为归档区（历史证据原文携旧数值），整树豁免——活文档仍全量扫
      const archived = f.includes('设计源存档') || f.includes('证据存档')
      const staleNums = archived ? [] : path.basename(f) === '模型写作机制调研.md' ? ['1600', '2400'] : ['2000', '1600', '2400']
      for (const staleNum of staleNums) {
        expect(text, `docs 全目录不应残留旧篇幅数值「${staleNum}」：${path.relative(docsRoot, f)}`).not.toContain(staleNum)
      }
    }
    // 版本零残留：docs/user＋docs/maintenance 当前口径 0.0.24 清零（历史叙事在 CHANGELOG，不在用户文档）
    for (const dir of ['user', 'maintenance'] as const) {
      const docsDir = path.join(__dirname, '..', '..', '..', 'docs', dir)
      for (const f of fs.readdirSync(docsDir).filter((name) => name.endsWith('.md'))) {
        expect(fs.readFileSync(path.join(docsDir, f), 'utf8'), `docs/${dir}/${f}: 不应残留上一版 0.0.24`).not.toContain('0.0.24')
      }
    }
  })

  it('0.0.26 标尺 v0.5 五书校准批：驱动类型分带＋新四行＋五题材修正＋末卷扩＋v0.5 变更＋版本零残留', () => {
    const scale = fs.readFileSync(skillFile('novel-design', 'references/参考标尺.md'), 'utf8')
    // 1. 冲突①裁决（最大冲突）：钩型配比驱动类型分带——两带前缀＋硬红线不动＋情感重场替代张力钩＋泄压分档
    expect(scale).toContain('两层制·驱动类型分带（五书实证 2026-10-11）')
    expect(scale).toContain('张力驱动档〔玄幻/悬疑/无限流〕')
    expect(scale).toContain('情感驱动档〔都市情感/女频〕')
    expect(scale).toContain('张力类 25-40%（重生啊实测 25-35% 取整上浮）＋情绪类 40-60%＋情感重场替代张力钩')
    expect(scale).toContain('情感档 ≤15%')
    expect(scale).toContain('分带不改')
    // 2. 冲突②裁决：大爽点三口径分驱
    expect(scale).toContain('口径分驱（五书实证 2026-10-11，三口径并列）')
    expect(scale).toContain('每 15 章（≈5-7 万字）章制')
    expect(scale).toContain('间隔容忍至 25-30 万字')
    expect(scale).toContain('大会战间隔 75-100 章（卷单位）')
    // 3. 冲突③④裁决：首高潮分档＋末卷弹性扩
    expect(scale).toContain('前置至 ≤2 万字')
    expect(scale).toContain('都市情感慢热档 ×1.7≈**25 万字**')
    expect(scale).toContain('历史文极端慢热档 **50 万字位**')
    expect(scale).toContain('终卷收束期 60-110 万')
    expect(scale).toContain('重生啊末卷 107 万＝常态卷（20-30 万）3.5 倍')
    expect(scale).toContain('非终卷仍守 40 万')
    // 4. 新四行（每行五书证据标注＋【部分校准】或实测标注）：单元循环节拍/前传章型/终卷通胀律/信息释放分级
    expect(scale).toContain('| 单元循环节拍 |')
    expect(scale).toContain('颁布→战术→执行意外→翻解→结算→间歇')
    expect(scale).toContain('起手 2-9 章→中后期可涨至 30-60 章、极值 48')
    expect(scale).toContain('| 前传章型·篇幅曲线 |')
    expect(scale).toContain('篇幅随位格递增（4-83 章）且与情感权重正相关')
    expect(scale).toContain('死亡/终局前的前史揭底＝情绪蓄满装置')
    expect(scale).toContain('| 终卷通胀律 |')
    expect(scale).toContain('常态 +19%-34%；极端峰值 2-5 倍')
    expect(scale).toContain('放量渐次（终卷前 10-15 章起）不突变')
    expect(scale).toContain('| 信息释放分级 |')
    expect(scale).toContain('核心真相（题眼）置**倒数 5%**')
    expect(scale).toContain('悬念型信息:期待型信息配比——悬疑型 ≈7:3（n=1，十日钩型口径移植、仅参考）；情感型待证')
    expect(scale).toContain('信息释放台账的方法论母行')
    // 5. 冲突⑤⑥裁决＋固定层/比例层五书实证替换
    expect(scale).toContain('平面谱＝0 阶特例')
    expect(scale).toContain('事业台阶型 3-4 阶')
    expect(scale).toContain('终局层允许非人格化承担者')
    expect(scale).toContain('出场频率自查口径限核心圈 8-10 人')
    expect(scale).toContain('情感线计第二主线')
    expect(scale).toContain('口径分事件型/关系型两栏')
    // 6. 冲突⑦裁决：三线断档互为替身豁免
    expect(scale).toContain('「互为替身」豁免口径')
    expect(scale).toContain('线族合计在场')
    // 7. 题材修正表五题材＋合并规则（历史新增＋都市情感子档＋子档优先）
    expect(scale).toContain('| 都市情感（都市子档） |')
    expect(scale).toContain('| 历史（历史穿越） |')
    expect(scale).toContain('地图（战线）×1.3')
    expect(scale).toContain('会战间隔 ×5（卷单位——大会战 75-100 章）')
    expect(scale).toContain('小爽点 ×0.7')
    expect(scale).toContain('章长长档强制（5500+）')
    expect(scale).toContain('子档优先于父档')
    // 8. 每章字数三档锚点＋快档口径钉死＋恒定式三例外（3500 基准不动）
    expect(scale).toContain('快节奏档 2100-2500')
    expect(scale).toContain('口径必须钉死「正文汉字数」脚本口径')
    expect(scale).toContain('恒定式三例外')
    expect(scale).toContain('基准裁定不动')
    expect(scale).toContain('**3500-4500 字**')
    // 9. v0.5 变更行＋校准计划五书批留痕
    expect(scale).toContain('v0.5 2026-10-12：0.0.26 五书校准批')
    expect(scale).toContain('2026-10-11 五书校准批（v0.5）已完成')
    // 版本零残留：docs/user＋docs/maintenance 当前口径 0.0.25 清零（历史叙事在 CHANGELOG，不在用户文档）
    for (const dir of ['user', 'maintenance'] as const) {
      const docsDir = path.join(__dirname, '..', '..', '..', 'docs', dir)
      for (const f of fs.readdirSync(docsDir).filter((name) => name.endsWith('.md'))) {
        expect(fs.readFileSync(path.join(docsDir, f), 'utf8'), `docs/${dir}/${f}: 不应残留上一版 0.0.25`).not.toContain('0.0.25')
      }
    }
  })

  it('0.0.26 流程首波批：局规则条目模板＋史实基线资产位＋情感主线槽位族＋台账扩列＋伏笔账本升级＋设计案文档', () => {
    const design = readSkill('novel-design')
    const outline = readSkill('novel-outline')
    const settle = readSkill('novel-settle')
    // N1 局规则条目模板：文件存在＋风格两签＋六字段关键词＋规则设计学枚举单源在模板
    const tplDir = skillFile('novel-design', 'templates/世界书')
    const gameTplPath = path.join(tplDir, '局规则条目模板.md')
    expect(fs.existsSync(gameTplPath), 'novel-design/templates/世界书/局规则条目模板.md 应存在').toBe(true)
    const gameTpl = fs.readFileSync(gameTplPath, 'utf8')
    expect(gameTpl).toContain('frontmatter 照世界书既有约定')
    expect(gameTpl).toContain('留白合法')
    for (const kw of ['## 表面规则（角色所知）', '## 隐藏层（真规则，可多层）', '## 漏洞空间（可被利用处）', '## 反制与代价', '## 与情节的咬合点', '颁布原句', '字面缝隙即解法空间', '主持者人格＝规则纹理', '惩罚求生直觉', '可加注/可篡改', '夺取规则颁布权']) {
      expect(gameTpl, `局规则模板应含「${kw}」`).toContain(kw)
    }
    // N1 接线：design 世界书步骤声明「局规则」模块＋模板链接；工件契约注册（见下方 contract 断言）
    expect(design).toContain('[局规则条目模板](templates/世界书/局规则条目模板.md)')
    expect(design).toContain('模块「局规则」登记（首次确认条目时自动登记进 `世界书/模块声明.md`）')
    // N2 史实基线资产位：世界书步骤建账行＋工件契约表加行＋五律/轨道清单/现实依据回指
    expect(design).toContain('**史实基线（历史文用，可选）**')
    expect(design).toContain('`<工作范围>/书房/史实基线/<书名>.md`')
    expect(design).toContain('小史实保真换大史实自由五律')
    for (const kw of ['小史实保真（官制/地理/死法内核）', '大史实可破（战役/存亡）', '破轨必配锚（改写处配史实细节背书，改越大锚越密）', '史实污点人物优先清算', '未来文本按四式注入（前移/反用/保留原话/提前入场）']) {
      expect(design, `史实基线五律应含「${kw}」`).toContain(kw)
    }
    expect(design).toContain('史实事件｜默认结局｜改写方向｜锚点保真点')
    expect(design).toContain('现实依据：<书房/史实基线/<书名>.md 的轨道条目名>')
    expect(design).toContain('| 史实基线 |')
    // N4 情感主线槽位族：骨架子位（双线/单线＋收束形态）＋契约六部挂点＋卷纲情感线节拍行
    expect(design).toContain('**情感主线（可选子位）**')
    expect(design).toContain('`### 情感主线`')
    expect(design).toContain('双线（事业线＋情感线并行，情感线计主线不计支线）')
    expect(design).toContain('单线（情感线即唯一主线）')
    expect(design).toContain('渐近线式（永远逼近永不官宣——不解决而共存，收束落在行为互认不落在名分）')
    expect(design).toContain('**情感主线声明（可选）**')
    const vol = fs.readFileSync(skillFile('novel-design', 'templates/卷纲固定段规格.md'), 'utf8')
    expect(vol).toContain('## 情感线节拍（弧线段内可选行）')
    expect(vol).toContain('误会-和解循环周期 {N-M 章}')
    expect(vol).toContain('情感重场：{章组}')
    expect(vol).toContain('参考 10-15 章，大周期以事件弧计')
    expect(vol).toContain('不因情绪类豁免调剂')
    // 上下文升级：台账清单扩「载体」「知情圈」两列——design 建账行单源＋outline 备料消费＋settle 更新同步
    expect(design).toContain('载体｜知情圈｜释放章')
    expect(design).toContain('同一信息再次释放须换载体（日记/对话/通灵/古迹式为参照，自报载体亦可）')
    expect(design).toContain('知情圈＝哪些角色已知（角色间信息差')
    expect(outline).toContain('同一信息再次释放须换载体（对照清单「载体」列）')
    expect(outline).toContain('对照「知情圈」列——谁知道谁不知道')
    expect(settle).toContain('实际载体与知情圈变化随同次更新（「载体」/「知情圈」列）')
    // N6 伏笔账本升级：沉淀对账线索行式扩口径＋保温强化＋对账方法第 6 条；outline 备料保温自查接线
    const reconcile = fs.readFileSync(skillFile('novel-settle', 'agents/沉淀对账.md'), 'utf8')
    expect(reconcile).toContain('- 口径：事件型 | 关系型')
    expect(reconcile).toContain('- 保温强化：第NNNN章 | 无')
    expect(reconcile).toContain('兑现前必有强化触点')
    expect(reconcile).toContain('无强化触点就兑现的列入对账差异呈报，不默默收线')
    expect(outline).toContain('**伏笔保温自查**')
    expect(outline).toContain('对照 `账本/线索.md` 该条的保温强化行')
    expect(outline).toContain('先在本章或邻章排一次闲笔式强化触点再兑现')
    // 新工件提案落设计侧：因果链图与穿帮防御设计案存在且标注待实装裁定（不进运行时件）
    const designDoc = path.join(__dirname, '..', '..', '..', 'docs', 'design', '因果链图与穿帮防御.md')
    expect(fs.existsSync(designDoc), 'docs/design/因果链图与穿帮防御.md 应存在（设计侧设计案）').toBe(true)
    const proposal = fs.readFileSync(designDoc, 'utf8')
    expect(proposal).toContain('待实装裁定')
    expect(proposal).toContain('依赖闭包')
    expect(proposal).toContain('孤悬节点')
    expect(proposal).toContain('主角语自洽')
    expect(proposal).toContain('叙述者预叙红线')
    expect(proposal).toContain('记忆错乱自觉豁免')
    expect(proposal).toContain('时代锚点登记表')
    // 注册单源：artifact-contract 登记局规则条目模板（经名字数组拼路径——完整数组断言在 0.0.14 模板拆出批 D 节，本组钉数组含「局规则」）
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    expect(contract).toContain("', '地图', '局规则']")
  })

  it('0.0.26 独立审查修复批：C1/C2 口径修正＋R1-R4 必修＋O1-O2＋Nit——卷体量 3.5 倍口径/情感档 25-40/前传 4-83/泄压出处改引/单元循环型枚举/7:3 标注/对话上限 0.45/口径注与区间收敛＋v0.5-F 留痕', () => {
    const scale = fs.readFileSync(skillFile('novel-design', 'references/参考标尺.md'), 'utf8')
    const vol = fs.readFileSync(skillFile('novel-design', 'templates/卷纲固定段规格.md'), 'utf8')
    // C1 单卷体量行：章长峰值 5.3 倍口径退役、卷体量 3.5 倍口径落位——行内零残留（变更记录 v0.5 行历史记述保留，O2 核到的诡秘半句保留）
    const volumeRow = scale.split('\n').find((l) => l.includes('| 单卷体量 |'))
    expect(volumeRow, '参考标尺应有「单卷体量」行').toBeDefined()
    expect(volumeRow!).not.toContain('5.3 倍')
    expect(volumeRow!).toContain('章长峰值另见终卷通胀律行')
    expect(volumeRow!).toContain('诡秘后三部章数递减而单卷体量上浮')
    // C1 终卷通胀律行：警戒与章长峰值关系句＋打破条件情感峰例外
    expect(scale).toContain('章长极端峰值可超警戒，卷体量口径 3.5 倍为常态参考')
    expect(scale).toContain('重生啊番外婚礼章 5.3 倍')
    // C2 情感档张力类上缘 40%：行内 25-50 零残留（变更记录 v0.5 行历史记述保留）
    const hookRow = scale.split('\n').find((l) => l.includes('| 章末钩型配比 |'))
    expect(hookRow, '参考标尺应有「章末钩型配比」行').toBeDefined()
    expect(hookRow!).not.toContain('25-50')
    expect(hookRow!).toContain('25-40%（重生啊实测 25-35% 取整上浮）')
    // R1 前传章型最小 4 章：行内 3-83 零残留
    const prequelRow = scale.split('\n').find((l) => l.includes('| 前传章型·篇幅曲线 |'))
    expect(prequelRow, '参考标尺应有「前传章型·篇幅曲线」行').toBeDefined()
    expect(prequelRow!).not.toContain('3-83')
    // R2 情感档泄压出处改引重生啊（原误挂张力档双书数据）
    expect(hookRow!).toContain('情感档 ≤15%（重生啊单书口径：泄压类＝温情收束')
    // R3 卷纲结构类型枚举补单元循环型（十日报告点名缺口——枚举单源在模板）＋与标尺单元循环节拍行互指闭合
    expect(vol).toContain('单元循环型（单元六段循环：颁布→战术→执行意外→翻解→结算→间歇')
    expect(vol).toContain('节拍口径见《定调设计》技能包 references/参考标尺.md 节奏基准「单元循环节拍」行，该行在本类型选中时生效')
    expect(scale).toContain('卷纲结构类型选单元循环型时本行生效')
    // R4 信息释放分级行：5/5 归属钉在分级排期方法论（配比句 n=1 不在此实证内）
    expect(scale).toContain('分级排期方法论 ✅五书实证 2026-10-11')
    // O1 历史行对话占比上限＋都市情感 2300-3000 恒定带弃置留痕（变更记录）
    expect(scale).toContain('对话占比上限 0.45（绍宋实测对话段占比 0.32-0.41 上浮）')
    expect(scale).toContain('2300-3000 恒定带」弃置留痕')
    // Nit：诡秘 3144 字符口径注＋支线双口径注
    expect(scale).toContain('诡秘 3144 系**字符口径**')
    expect(scale).toContain('4＝在用支线口径，含 1 弃线则 5-6')
    // v0.5-F 变更留痕
    expect(scale).toContain('v0.5-F 2026-10-12：0.0.26 独立审查修复批')
  })

  it('0.0.27 文笔专项批：散文卡组七卡＋行文自查三 AI 味判据＋润色两密度定位＋设计侧认知根源＋版本纪律全套', () => {
    // A. 散文卡组：组节在位（不走场景挑选/整组带/场景卡优先三纪律）＋卡头与理论出处标注（0.0.31 起七卡→八卡——修辞上探卡入组）
    const cards = fs.readFileSync(skillFile('novel-drafting', 'agents/写作卡.md'), 'utf8')
    expect(cards).toContain('## 散文卡组（文笔层八卡，随任务包整组带）')
    expect(cards).toContain('不走场景功能挑选')
    expect(cards).toContain('随任务包整组内联')
    expect(cards).toContain('与场景卡判据冲突时场景卡优先')
    for (const card of [
      '### 句法节奏卡〔theory-cards T015/T017/T022〕',
      '### 零回指卡〔theory-cards T019〕',
      '### 对白工学卡〔theory-cards T020/T028/T021/T027〕',
      '### 话题-述位卡〔theory-cards T026〕',
      '### 前景化卡〔theory-cards T014〕',
      '### 中心切换卡〔theory-cards T012〕',
      '### 连接词卡〔theory-cards T030/T024〕',
    ]) {
      expect(cards, `散文卡组应含卡头「${card}」`).toContain(card)
    }
    // 散文卡组插位：场景九卡（0.0.31 转场卡入列）之后、POV/行文自查两卡之前（「末两卡」口径不破）
    expect(cards.indexOf('## 趣味卡')).toBeLessThan(cards.indexOf('## 散文卡组'))
    expect(cards.indexOf('## 散文卡组')).toBeLessThan(cards.indexOf('## POV 自查卡'))
    // B. 每卡至少一句关键判据防漂移（含人类参照带判据与五类转移单源不重述）
    expect(cards).toContain('整段一个长度＝节奏死')
    expect(cards).toContain('标点即呼吸')
    expect(cards).toContain('两连叙述句都以「他／她」起头＝机器感')
    expect(cards).toContain('中断不锁死省略')
    expect(cards).toContain('引号是提示不是许可证')
    expect(cards).toContain('跨场景重复的才算人物声音')
    expect(cards).toContain('已知信息前置、新信息置尾')
    expect(cards).toContain('首提不省也不强造话题位')
    expect(cards).toContain('打破常规句式处＝意义重点处')
    expect(cards).toContain('满页破格＝没有前景化只有噪音')
    expect(cards).toContain('无声滑换中心＝读者回溯')
    expect(cards).toContain('隐式关系唯一可读时零连接词')
    expect(cards).toContain('把每个隐含关系都显式化＝机器感')
    // 五类转移枚举单源在行文自查卡标点条——散文卡组只引用不重述
    const fiveShifts = (cards.match(/话题／人物／活动／时间／空间/g) ?? []).length
    expect(fiveShifts, '五类转移枚举应单源在行文自查卡（散文卡组引用口径不重述枚举）').toBe(1)
    // C. 行文自查卡三条 AI 味判据（0.0.33 判据瘦身批起改指针式——判据正文单源散文卡组，自查卡只留指针句；
    //    断言随裁同步：旧六条判据正文断言退役，指针句＋负断言详版见 0.0.33 流程修复批组；
    //    T 出处标注随自查卡三行删去——卡头出处断言由本组 A 节卡头循环承载）
    expect(cards).toContain('句长均质化：按散文卡组句法节奏卡三判据自查')
    // D. 润色 tier4 扫描补两密度定位（人类带数值＋T 出处＋跨包指针到散文卡组）
    const clean = fs.readFileSync(skillFile('novel-polish', 'references/1-表达清理.md'), 'utf8')
    expect(clean).toContain('主语重复密度')
    expect(clean).toContain('相邻双代词起句 0-0.7%')
    expect(clean).toContain('连接词密度')
    expect(clean).toContain('3-6 处/千字')
    expect(clean).toContain('theory-cards T019')
    expect(clean).toContain('theory-cards T030')
    expect(clean).toContain('《正文起草》技能包 agents/写作卡.md 散文卡组零回指卡')
    // E. 设计侧认知根源：独立小文件＋T009/T010 假说层定位＋provisional 边界＋参照带＋筛卡记录
    const designDoc = path.join(__dirname, '..', '..', '..', 'docs', 'design', '散文卡组与AI味认知根源.md')
    expect(fs.existsSync(designDoc), 'docs/design/散文卡组与AI味认知根源.md 应存在（设计侧，不进运行时分发件）').toBe(true)
    const rootCause = fs.readFileSync(designDoc, 'utf8')
    expect(rootCause).toContain('knowledge-telling')
    expect(rootCause).toContain('转述知识而非转化知识')
    expect(rootCause).toContain('T009')
    expect(rootCause).toContain('T010')
    expect(rootCause).toContain('provisional')
    expect(rootCause).toContain('五书人类参照带')
    expect(rootCause).toContain('筛卡记录')
    // F. 版本纪律全套钉随当前版走——0.0.28 实测落地批起移入 0.0.28 组接力（本组原 0.0.27 钉同步退役；当前口径随版本走，见 0.0.19 组 A 注）
  })

  it('0.0.28 卷01 实测落地批：浮动档区间化＋画像卡组仲裁与长句配额＋前史隐喻行＋A 轴句＋对白章型子带＋格单源＋细则回写＋卷末契约三行＋画像名防漂移＋解冻批第⑬项＋版本纪律全套', () => {
    const design = readSkill('novel-design')
    const review = readSkill('novel-review')
    const drafting = readSkill('novel-drafting')
    const settle = readSkill('novel-settle')
    const sect = fs.readFileSync(skillFile('novel-outline', 'templates/章细纲固定小节规格.md'), 'utf8')
    const power = fs.readFileSync(skillFile('novel-design', 'templates/世界书/力量体系条目模板.md'), 'utf8')
    const game = fs.readFileSync(skillFile('novel-design', 'templates/世界书/局规则条目模板.md'), 'utf8')
    const world = fs.readFileSync(skillFile('novel-design', 'templates/世界书/世界规则条目模板.md'), 'utf8')
    const proseDoc = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'docs', 'design', '散文卡组与AI味认知根源.md'), 'utf8')
    const plan = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'docs', 'design', '增强实施计划.md'), 'utf8')
    // A. F9 浮动档区间化：design 示例改区间式＋±12.5% 容差带（独立审查 R1——沙盘工作口径与 F9 建议句原值）＋单值式清零；三消费位档区间口径；F36 现状注记措辞同步（core 未实装注记保留）；R4 起草验收句补含容差带
    expect(design).toContain('章型浮动: 常规 3500-4500｜过渡 2800-3200｜高潮 4000-5500')
    expect(design).toContain('各档写「低-高」区间、各档给 ±12.5% 容差带')
    expect(review).toContain('各档 ±12.5% 容差带')
    expect(design).not.toContain('常规 3500｜过渡 2800｜高潮 4500')
    for (const t of [design, review, sect, drafting]) {
      expect(t, '浮动档四个消费位都应改档区间口径').toContain('档区间')
    }
    expect(design).toContain('此时差额由人工按本章章型的档区间（含容差带）判')
    expect(drafting).toContain('浮动档区间（含容差带）判')
    expect(review).toContain('审读按本章章型的浮动档区间判差额')
    expect(review).toContain('core 契约解析器接受浮动行落地前脚本遇浮动行报「配置错误」')
    expect(sect).toContain('目标带＝作品契约「章节篇幅」主区间')
    expect(sect).toContain('合计低于目标带下限＝细纲事件量不足')
    // B. F11 仲裁句＋长句配额：画像优先、卡组兜底＋SD 带兜底下限＋句法层长句配额行（首次建档推导；独立审查 R2——示例改 M27 试运行原参数「每章 ≥3 处 ≥40 字」；Nit①——SD 三批批型事实句）
    expect(drafting).toContain('画像优先、卡组兜底')
    expect(drafting).toContain('散文卡组句长 SD 带作兜底下限、不低于带下缘')
    expect(drafting).toContain('长句配额：每章 ≥3 处 ≥40 字')
    expect(drafting).not.toContain('每段至少一句')
    expect(drafting).not.toContain('试运行实证')
    expect(drafting).toContain('首次建档时推导')
    // C. F3 前史隐喻行：力量体系条目模板金手指轨道位
    expect(power).toContain('前史隐喻：<能力与人物前史的呼应——能力形态即创伤/执念的具象')
    expect(power).toContain('无呼应留白，不硬造')
    // D. F14 A 轴句：章末双钩节——期待钩设计期排期＋S:A≈7:3 参照
    expect(sect).toContain('期待钩（A 轴）在悬模式下应占双钩其一')
    expect(sect).toContain('S:A≈7:3')
    expect(sect).toContain('期待钩靠设计期排期，不是写时顺手')
    // E. F12 对白占比章型子带：设计侧散文文档三档子带＋书级带只作书级参照（独立审查 R3——引谱改 1-4 全卷实测 3.3-36.7%；R2——长句配额参数单源行）
    expect(proseDoc).toContain('对白占比章型子带')
    for (const band of ['对白戏章 30-50%', '叙事章 10-25%', '独行章 3-10%']) {
      expect(proseDoc, `对白子带应含「${band}」`).toContain(band)
    }
    expect(proseDoc).toContain('单章统计先分章型再对子带')
    expect(proseDoc).toContain('3.3-36.7%')
    expect(proseDoc).not.toContain('7.4-36.7')
    expect(proseDoc).toContain('每章 ≥3 处 ≥40 字')
    // F. F18 时限格单源：局规则条目模板（Optional——换算自定义须单源标注，1-4 文书格先例）
    expect(game).toContain('时限单位统一用「格」')
    expect(game).toContain('{N} 格＝{N}×12 小时')
    expect(game).toContain('或自定义换算但全书一致')
    expect(game).toContain('换算全书自定义但须单源')
    // G. F20 细则回写：settle 沉淀步——复现 ≥2 次必须回写条目（独立审查 R5——两模板「程序细则（正文生长）」行落位＋settle 回写指向行名；Optional——阈值出处标注）
    expect(settle).toContain('复现 ≥2 次的细则必须回写')
    expect(settle, '阈值出处注记应退役（0.0.36 全量审查修复批）').not.toContain('阈值出处')
    expect(settle).toContain('防设定漂移')
    expect(settle).toContain('「程序细则（正文生长）」行登记')
    expect(game).toContain('程序细则（正文生长）：<正文自创的程序条款——复现 ≥2 次必须回写此行，防设定漂移>')
    expect(world).toContain('程序细则（正文生长）：<正文自创的程序条款——复现 ≥2 次必须回写此行，防设定漂移>')
    // H. F19 卷末触发句＋契约三行（独立审查 C1——次序改先对账后摘要，对齐同节既有句与 F19 原文）
    expect(settle).toContain('卷对账→卷摘要→段级刷新→体感回灌，四件一批')
    expect(settle).toContain('| 卷摘要 | `大纲/卷规划/卷<NN>/卷摘要.md` |')
    expect(settle).toContain('| 卷对账（卷级） | `大纲/卷规划/卷<NN>/卷对账.md` |')
    expect(settle).toContain('| 段级刷新 | `大纲/卷规划/卷<NN>/段级刷新.md` |')
    // I. F13/F1 文风画像文件名防漂移：间隔号·无空格＋漂移字形清单
    expect(drafting).toContain('间隔符用间隔号「·」且两侧无空格')
    expect(drafting).toContain('均为漂移字形')
    // J. F17 core 缺位族登记：增强计划解冻批候选第⑬项
    expect(plan).toContain('⑬运行时工件名带章号位')
    expect(plan).toContain('双撞名时-{NNNN} 章号后缀式（七楼-16 式）')
    // K. 版本纪律全套钉随当前版走——0.0.29 收尾批起移入 0.0.29 组接力（本组原 0.0.28 钉同步退役；当前口径随版本走，见 0.0.19 组 A 注）
  })

  it('0.0.29 收尾批：像人写作第一批（预算四指标＋环境卡主物件＋类型学六条＋广域视野）＋效率首两项（审读前缀重排＋润色批2修订式）＋版本纪律全套', () => {
    const cards = fs.readFileSync(skillFile('novel-drafting', 'agents/写作卡.md'), 'utf8')
    // A. AI 痕迹类型学六条合并行（独立审查 R2：预算四条并入——预算值嵌入行首括号；R1 出处改参照书章节；O5 待校准标注；连接词双限并入堆积行）
    const selfCheckStart = cards.indexOf('## 行文自查卡')
    const selfCheck = cards.slice(selfCheckStart)
    const mergedRows = [
      '段末格言化（≤2/章）：数「不是…（就）是／而是」式收尾',
      '比喻超密且均匀（≤2/千字）：数「像／仿佛／犹如／宛如」',
      //（0.0.42 判据微修批：破折号行由单密度线改双判——位置判＋功能判＋密度参考带 0-1/千字，断言随裁同步；新句详钉见 0.0.42 判据微修批组）
      '破折号解释装置（双判：位置判＋功能判，密度参考带 0-1/千字【待实测校准】）',
      '三连列举节奏：「A、B、C」三项式',
      '清单式全景描写：每到新场景重新全要素清点',
      '对白零冗余：句句是打磨过的信息位'
    ]
    for (const row of mergedRows) {
      expect(selfCheck, `合并行应钉「${row.slice(0, 12)}…」`).toContain(row)
    }
    expect(selfCheck).toContain('AI 痕迹类型学六条')
    expect(selfCheck).toContain('自查预算不是硬规则')
    expect(selfCheck).toContain('参照书章节 0-2.1/千字')
    //（0.0.42 判据微修批：破折号行改双判口径，旧参照句「参照书章节近零（外推）」随裁退役——改负断言防回退）
    expect(selfCheck, '旧参照句「参照书章节近零（外推）」应退役（0.0.42 双判改写）').not.toContain('参照书章节近零（外推）')
    // 0.0.33 判据瘦身批起：连接词上下限数值带三句随自查卡连接词条指针化退役（判据单源散文卡组连接词卡，
    // 数值带另存润色 tier4「3-6 处/千字」），断言随裁同步——指针句详断言见 0.0.33 流程修复批组
    expect(selfCheck).toContain('模型倾向按固定间距均匀洒满')
    expect(selfCheck).toContain('文风画像句法层冲突时画像优先')
    expect(selfCheck, '旧「修辞预算四条」独立节应退役').not.toContain('修辞预算四条')
    expect(selfCheck, '旧出处「人类五书 0-2.1/千字」应退役').not.toContain('人类五书 0-2.1/千字')
    expect(selfCheck, '旧出处「中文网文人类近零」应退役').not.toContain('中文网文人类近零')
    expect(selfCheck, '旧「连接词下限」独立行式应退役').not.toContain('连接词下限 ≥2.9/千字')
    // R3 塑造卡毛边豁免＋O1 主物件逐镜单点
    expect(cards).toContain('毛边豁免：结巴／口癖／无信息量客套给对白留人味')
    expect(cards).toContain('一「场」可有多件但逐镜单点——主物件随镜头切换，不锁全场景')
    // B. 环境卡改写：主物件单一化＋POV 职业滤镜＋信息集中律；四作用判据保留、旧感官通道行退役
    const envStart = cards.indexOf('## 环境卡')
    const envEnd = cards.indexOf('## 开场卡')
    expect(envStart, '写作卡应有环境卡').toBeGreaterThanOrEqual(0)
    const env = cards.slice(envStart, envEnd)
    expect(env).toContain('只选一件主物件')
    expect(env).toContain('给文学化处理')
    expect(env).toContain('判据只在主角会注意的那一件上执行')
    expect(env).toContain('职业／执念会让他先看什么')
    expect(env).toContain('信息集中律')
    expect(env).toContain('同一信息只允许一个意象承载')
    expect(env).toContain('四作用之一')
    expect(env, '环境卡旧的场景级感官通道行应退役').not.toContain('按场景核心变化挑 1-2 条感官通道')
    // C. AI 痕迹类型学六名全在位（selfCheck 切片见 A 节——合并后六名仍各领一行）
    for (const kw of ['段末格言化', '比喻超密且均匀', '破折号解释装置', '三连列举节奏', '清单式全景描写', '对白零冗余']) {
      expect(selfCheck, `类型学应含「${kw}」`).toContain(kw)
    }
    // D. 广域四件①②③：写前重读点亮语态样本行＋任务包广域视野节（卷末方向句＋情绪承诺句＋常量标注）
    //（0.0.38 心智批起 R1 重写——语态样本点名读句随运行时形态改写，语态样本行同时改包尾注入，钉见 0.0.38 组）
    const drafting = readSkill('novel-drafting')
    expect(drafting).toContain('逐行点名读近三章「语态样本：」行')
    expect(drafting).toContain('**广域视野**')
    expect(drafting).toContain('「卷末兑现」段取首句')
    expect(drafting).toContain('「阅读体验与情绪承诺」分部取首句')
    expect(drafting).toContain('只给方向句不给路线图')
    expect(drafting).toContain('只给一句不给分部全文')
    expect(drafting).toContain('卷级／书级常量')
    expect(drafting, '广域行前缀缓存旁注应退役（Nit——设计说明不留运行时）').not.toContain('前缀缓存友好')
    expect(drafting).toContain('不代拟')
    // E. 开源判据吸收三条（润色侧）：三名＋来源标注
    const clean = fs.readFileSync(skillFile('novel-polish', 'references/1-表达清理.md'), 'utf8')
    for (const kw of ['表演式表达', '空洞拔高', '均匀节奏']) {
      expect(clean, `开源吸收应含「${kw}」条`).toContain(kw)
    }
    expect(clean).toContain('开源吸收三条（同提示级——命中回原文核对作用，无作用的才动）')
    expect(clean, '出处注记「源出方向二类型学」应退役（0.0.36 全量审查修复批）').not.toContain('源出方向二')
    expect(clean, 'humanizer/de-slop 具体名不留运行时（O4——仓内无源）').not.toContain('humanizer')
    // F. 审读派发模板前缀重排：固定件前置句＋底本节先于指纹行＋章别节名在位
    const review = readSkill('novel-review')
    expect(review).toContain('固定件前置、章别件后置')
    expect(review).toContain('吃 provider 前缀缓存')
    expect(review).toContain('只改排列顺序，材料内容不变')
    expect(review).toContain('卷级常量（章别不变时缓存友好）')
    expect(review, '缓存价说明不留运行时（O3）').not.toContain('缓存价约 1/10')
    expect(review.indexOf('=== 第一部分：你的审读底本（固定件） ===')).toBeGreaterThanOrEqual(0)
    expect(review.indexOf('=== 第二部分：判据参考（固定件） ===')).toBeGreaterThan(review.indexOf('=== 第一部分：你的审读底本（固定件） ==='))
    expect(review.indexOf('=== 第三部分：本章任务与材料（章别件')).toBeGreaterThan(review.indexOf('=== 第二部分：判据参考（固定件） ==='))
    expect(review.indexOf('审读指纹：<原样粘贴')).toBeGreaterThan(review.indexOf('=== 第三部分：本章任务与材料（章别件'))
    // G. 润色批 2 修订指令集：参考文档输出形态节＋SKILL 流程句＋批 1 仍全文标注
    const reshape = fs.readFileSync(skillFile('novel-polish', 'references/2-节奏与重塑.md'), 'utf8')
    expect(reshape).toContain('输出形态(修订指令集,不整篇重写)')
    expect(reshape).toContain('定位(段落位置＋原句首几字)＋改法(往哪改、为什么)＋改后句段')
    expect(reshape).toContain('批 1 仍输出全文')
    const polish = readSkill('novel-polish')
    expect(polish).toContain('批 2 输出修订指令集（定位＋改法，不重抄全文）')
    expect(polish).toContain('批 1 输出全文中间版（表达清理是逐句工作，需完整上下文）')
    // H. 版本纪律全套钉随当前版走——0.0.30 上游同步批起移入 0.0.30 组接力（本组原 0.0.29 钉同步退役；当前口径随版本走，见 0.0.19 组 A 注）
  })

  it('0.0.30 上游同步批：已转提案枚举＋checkForwarded 三重验链＋核验字数脚本＋事务 writeDurable/fsync＋lock 30s 超时与退出确认＋记忆守卫新增不覆盖＋版本纪律全套', () => {
    // A. 族⑥ 已转提案：core 枚举＋apply 校验链＋工具 schema＋SKILL 措辞
    const recordSrc = fs.readFileSync(path.join(__dirname, '..', '..', 'core', 'src', 'evidence', 'record.ts'), 'utf8')
    expect(recordSrc).toContain("'已转提案'")
    expect(recordSrc).toContain('转交提案')
    expect(recordSrc).toContain('storedDisposition')
    const applySrc = fs.readFileSync(path.join(__dirname, '..', '..', 'core', 'src', 'revise', 'apply.ts'), 'utf8')
    expect(applySrc).toContain('function checkForwarded')
    expect(applySrc).toContain('只用于影响真源的发现项')
    expect(applySrc).toContain('先用 novel_resolve_proposal 呈报作者裁决')
    expect(applySrc).toContain('未关联本章这条发现项')
    expect(applySrc).toContain('function illegalDisposition')
    const proposalSrc = fs.readFileSync(path.join(__dirname, '..', '..', 'core', 'src', 'revise', 'proposal.ts'), 'utf8')
    expect(proposalSrc).toContain('关联发现项')
    // 0.0.31 架构改进批：工具实现按域拆至 src/tools/，源码断言改读拆分后全目录
    const tools = fs.readdirSync(path.join(__dirname, '..', 'src', 'tools'))
      .filter((f) => f.endsWith('.ts'))
      .map((f) => fs.readFileSync(path.join(__dirname, '..', 'src', 'tools', f), 'utf8')).join('\n')
    expect(tools).toContain("'已转提案']")
    expect(tools).toContain('已转提案时传已通过且关联本发现项的四位提案编号')
    expect(tools).toContain('从审核转交的提案须登记原发现项身份')
    const review = readSkill('novel-review')
    expect(review).toContain('`已转提案` 六个')
    expect(review).toContain('七个取值')
    expect(review).toContain('六值之一')
    const revision = readSkill('novel-revision')
    expect(revision).toContain('已转提案')
    expect(revision).toContain('关联发现项')
    // B. 族⑤ 核验字数：三件套存在＋起草 SKILL 接线句
    expect(fs.existsSync(skillFile('novel-drafting', 'scripts/核验字数.mjs')), '核验字数.mjs 薄入口应存在').toBe(true)
    expect(fs.existsSync(path.join(__dirname, '..', 'src', 'scripts', 'draft-length-cli.ts')), 'draft-length-cli.ts 应存在').toBe(true)
    expect(fs.existsSync(path.join(__dirname, '..', '..', 'core', 'src', 'repo', 'draft-length.ts')), 'core draft-length.ts 应存在').toBe(true)
    const drafting = readSkill('novel-drafting')
    expect(drafting).toContain('scripts/核验字数.mjs')
    expect(drafting).toContain('保存文本哈希')
    expect(drafting).toContain('字数未核验')
    // C. 族①②③ 数据安全批：事务 writeDurable/fsync＋隔离区＋lock 超时与退出确认＋rel-path 单源
    const txnSrc = fs.readFileSync(path.join(__dirname, '..', '..', 'core', 'src', 'repo', 'transaction.ts'), 'utf8')
    expect(txnSrc).toContain('function writeDurable')
    expect(txnSrc).toContain('fs.fsyncSync(fd)')
    expect(txnSrc).toContain('function syncDir')
    expect(txnSrc).toContain('quarantine')
    expect(txnSrc).toContain('TransactionConflictError')
    expect(txnSrc).toContain('持久化确认失败')
    const lockSrc = fs.readFileSync(path.join(__dirname, '..', '..', 'core', 'src', 'repo', 'lock.ts'), 'utf8')
    expect(lockSrc, 'GUARD_STALE_MS 已随死参数退役（0.0.33 挂账修复）').not.toContain('GUARD_STALE_MS')
    expect(lockSrc).toContain('export function lockIsStale')
    expect(lockSrc).toContain('acquireWriterMutex')
    expect(lockSrc).toContain('class BookLockError')
    expect(lockSrc).toContain('请等 30 秒后重试一次')
    expect(fs.existsSync(path.join(__dirname, '..', '..', 'core', 'src', 'repo', 'rel-path.ts')), 'rel-path.ts 单源应存在').toBe(true)
    // D. 族④ 记忆守卫：新增不覆盖＋更新须原文（scope=book 不跟——上游直写绕裁决链，见 CHANGELOG 声明）
    const authorSrc = fs.readFileSync(path.join(__dirname, '..', '..', 'core', 'src', 'memory', 'author.ts'), 'utf8')
    expect(authorSrc).toContain('不得用新增覆盖')
    expect(authorSrc).toContain('记忆原文已变化')
    expect(authorSrc).toContain('更新记忆须先读取并提供完整原文')
    expect(tools).toContain('同名条目已存在时新增被拒')
    // E. 新增 spec 文件存在性（上游 10 个新 spec 的落位核对）
    for (const spec of ['transaction-fsync.spec.ts', 'transaction-quarantine.spec.ts', 'lock-recovery.spec.ts', 'rel-path.spec.ts', 'draft-length-feedback.spec.ts']) {
      expect(fs.existsSync(path.join(__dirname, '..', '..', 'core', 'tests', spec)), `core/tests/${spec} 应存在`).toBe(true)
    }
    expect(fs.existsSync(path.join(__dirname, '..', 'tests', 'draft-length-cli.spec.ts')), 'bundle/tests/draft-length-cli.spec.ts 应存在').toBe(true)
    // F. 版本纪律全套钉随当前版走——0.0.31 产品体验批起移入 0.0.31 组接力（本组原 0.0.30 钉同步退役；当前口径随版本走，见 0.0.19 组 A 注）
  })

  it('0.0.32 设计域补入批：骨架判据行补 §2.5/§2.14/§2.17＋弧光与关系三子弹＋天花板行＋配角八功能＋三次灾难节号＋D2-5 改挂 §4.7', () => {
    const design = readSkill('novel-design')
    const power = fs.readFileSync(skillFile('novel-design', 'templates/世界书/力量体系条目模板.md'), 'utf8')
    const writer = fs.readFileSync(skillFile('novel-design', 'agents/作家评审.md'), 'utf8')
    // A. 件1＋件2：骨架步骤 3 判据行零 02 节缺位闭合——判据行补 §2.5/§2.14/§2.17（§2.14 关系矩阵随批同补），三子弹带部定位与判据节
    const skeletonCriteria = design.split('\n').find((l) => l.startsWith('   判据：读 [04_大纲](references/04_大纲.md) §4.15'))
    expect(skeletonCriteria, '骨架步骤 3 判据行应在位').toBeDefined()
    for (const sec of ['§2.5', '§2.14', '§2.17']) {
      expect(skeletonCriteria!, `骨架判据行应含 ${sec}（02 章节号缺位闭合）`).toContain(sec)
    }
    expect(design).toContain('**弧光三型**（骨架「主角目标与成长轨迹」部对谈时过一遍；判据 §2.5 主角成长弧怎么排）')
    expect(design).toContain('起点信念')
    expect(design).toContain('扁平坚守（核心信念从没变，存在本身就是标尺）')
    expect(design).toContain('**弧光落地两问**（骨架「人物弧线与关系发展」部对谈时过一遍；判据 §2.17 人物弧光怎么落地）')
    expect(design).toContain('把成长拿走这个故事还成立吗')
    expect(design).toContain('**核心关系矩阵**（骨架「人物弧线与关系发展」部对谈时过一遍；判据 §2.14 人物关系怎么织）')
    expect(design).toContain('主角/对手/导师/伙伴/镜像')
    expect(design).toContain('设计变化节点')
    expect(design).toContain('关系一动，剧情自己长')
    // B. 件3：力量体系模板境界表天花板行（§3.3——最高位谁在那里/够撑到末境吗/到顶新目标＋终局位阶锚互指）
    expect(power).toContain('- 天花板：<本体系当前最高位——谁在那里、为什么多数人到不了/到了会怎样')
    expect(power).toContain('够撑到全书最后一个境界吗')
    expect(power).toContain('到顶之后主角的新目标')
    expect(power).toContain('天花板即终局对手的位阶锚，与「对手梯队映射」终局行对照')
    // C. 件4：世界书步骤 2 判据行补 §2.7＋配角功能一问（八功能对号＋零功能砍或合并＋独立动机）
    const worldCriteria = design.split('\n').find((l) => l.startsWith('   判据：读 [02_人物设计](references/02_人物设计.md) §2.2'))
    expect(worldCriteria, '世界书步骤 2 判据行应在位').toBeDefined()
    expect(worldCriteria!, '世界书判据行应含 §2.7').toContain('§2.7')
    expect(design).toContain('**配角功能一问**（人物档案条目起稿时逐个常驻配角过一遍；判据 §2.7 配角功能怎么配）')
    for (const fn of ['情绪（拉扯情绪）', '困境（制造会恶化的阻碍）', '方法（给解决途径）', '冲突（扛最终对决）', '背景（攒嘲讽质疑、结局释放）', '伪装（误导再转折）', '任务（强制开支线）', '全局（分阶段推大方向）']) {
      expect(design, `配角八功能应含「${fn}」`).toContain(fn)
    }
    expect(design).toContain('零功能配角砍掉或与同功能配角合并')
    expect(design).toContain('答不上＝工具人，补独立动机')
    // D. 件5：作家评审 D1-3 补 §1.10（三次灾难法——每一灾逼出决定开新方向半句）
    const d13 = writer.split('\n').find((l) => l.includes('每一灾都必要吗'))
    expect(d13, 'D1-3 每一灾问句应在位').toBeDefined()
    expect(d13!).toContain('§1.10＋§4.14')
    expect(d13!).toContain('逼出决定、开出新方向')
    // E. 件6：D2-5 收线四件事节号改挂 §4.7（内容源出 §4.7 兜底收线；§4.8 伏笔埋收由 D2-4 独占）
    const d25 = writer.split('\n').find((l) => l.includes('收线四件事'))
    expect(d25, 'D2-5 收线四件事应在位').toBeDefined()
    expect(d25!).toContain('§4.7')
    expect(d25!, 'D2-5 判据不得再挂 §4.8').not.toContain('§4.8')
    // F. 版本不升：批号 0.0.32 同版本 0.0.30 内追加——版本件零改动，版本纪律全套断言在 0.0.31 产品体验批组（0.0.31 版起接力）
  })

  it('0.0.31 正文域补入批：转场卡双源＋四轴＋对白诊断 §7.8＋修辞上探卡＋情绪三表现＋开场钩型黄金三百字＋外貌行＋悬空指针清零', () => {
    const cards = fs.readFileSync(skillFile('novel-drafting', 'agents/写作卡.md'), 'utf8')
    const drafting = readSkill('novel-drafting')
    // A. 件1 转场卡：卡头双源（§7.11＋theory-cards T052）＋切可以硬不能无故＋四轴关键词＋快切节奏标记＋转场不断钩＋SKILL 场景映射与深挖位
    expect(cards).toContain('## 转场卡 ←§7.11＋theory-cards T052')
    expect(cards).toContain('转场可以硬，但不能无故')
    for (const axis of ['事件（延续还是换新）', '焦点（视角人物换没换）', '地点（换没换）', '时间（连续、向前跳、倒叙还是并行）']) {
      expect(cards, `转场四轴应含「${axis}」`).toContain(axis)
    }
    expect(cards).toContain('快切合法但须节奏标记')
    expect(cards).toContain('转场不断钩')
    // 0.0.33 选卡映射单源移写作卡：SKILL 映射句与 § 对照表退役，改钉卡头
    expect(cards).toContain('转场/分镜切换场景带转场卡')
    expect(cards).toContain('## 转场卡 ←§7.11')
    // B. 件2 对白诊断：两审读底本引 §7.8（删除测试/标点节拍/毛边豁免不判废话）
    const style = fs.readFileSync(skillFile('novel-review', 'agents/文风与表达审读.md'), 'utf8')
    const sweep = fs.readFileSync(skillFile('novel-review', 'agents/全量审读.md'), 'utf8')
    for (const src of [style, sweep]) {
      expect(src).toContain('对白质量按 §7.8')
      expect(src).toContain('删掉后剧情／人物／情绪均无变化＝冗余对白')
      expect(src).toContain('情绪越激烈句子越短')
      expect(src).toContain('是人味不是冗余，不')
    }
    // C. 件3 修辞上探卡：卡头＋高显著位＋四技巧＋与前景化卡分工（加东西 vs 破规则）
    expect(cards).toContain('### 修辞上探卡 ←§7.6')
    expect(cards).toContain('上探只砸高显著位')
    expect(cards).toContain('五感×修辞组合拳')
    expect(cards).toContain('通感迁移三步')
    expect(cards).toContain('陌生化搭配')
    expect(cards).toContain('顶真回环')
    expect(cards).toContain('两卡不重叠')
    // D. 件4 情绪词典：升级链＋张力三表现＋场景-感官通道对照＋附.5 出处标注
    expect(cards).toContain('直接说（低）→生理反应（中）→生理反应＋动作＋环境烘托（高）')
    expect(cards).toContain('压抑（越想忍越忍不住）')
    expect(cards).toContain('反差（表面平静内心翻江倒海）')
    expect(cards).toContain('递进（从一点点不舒服到彻底爆发）')
    expect(cards).toContain('打斗＝视觉＋听觉')
    expect(cards).toContain('密室＝触觉＋听觉＋嗅觉')
    expect(cards).toContain('〔知识库附录·附.5〕')
    // E. 件5 开场钩型：开场卡双节源＋黄金三百字三判据＋六钩型＋三低级错误＋SKILL 开场位半句与 §6.2 深挖位
    expect(cards).toContain('## 开场卡 ←§7.10＋§6.2')
    expect(cards).toContain('黄金三百字自查（首章与卷首章执行）')
    expect(cards).toContain('前三行进人')
    expect(cards).toContain('前 300 字立冲突')
    expect(cards).toContain('前 1000 字给钩')
    for (const hook of ['危机型（生存缺口', '悬念型（信息缺口', '情感型（关系缺口', '炸裂型（认知缺口', '认知错位钩', '信息差钩']) {
      expect(cards, `开场钩型应含「${hook}」`).toContain(hook)
    }
    expect(cards).toContain('文笔堆砌辞藻／第一章出场五六个人物／埋一堆伏笔乱切视角')
    // 0.0.33 选卡映射单源移写作卡：开场位半句与 §6.2 节源注随映射迁移，drafting 只留指路
    expect(cards).toContain('首章与卷首章按开场卡黄金三百字判据自查')
    expect(cards).toContain('§6.2（黄金三百字')
    // F. 件6 外貌：塑造卡一行＋人物档案模板记忆点扩句（模板侧同判据）
    expect(cards).toContain('写五官是照片，写习惯性动作才是活人')
    expect(cards).toContain('不清单式罗列〔§2.6〕')
    const profile = fs.readFileSync(skillFile('novel-design', 'templates/世界书/人物档案条目模板.md'), 'utf8')
    expect(profile).toContain('习惯性动作/标记物优先于五官描述')
    expect(profile).toContain('判据 §2.6 主角外貌怎么写')
    // G. 件7 悬空指针清零：references/ 下任何含「附.N」的行必须同带「不分发」诚实标注（09_附录 整体未分发，不留裸指针也不内联附录内容）
    const skillsDir = path.join(__dirname, '..', 'skills')
    for (const skill of fs.readdirSync(skillsDir)) {
      const refDir = path.join(skillsDir, skill, 'references')
      if (!fs.existsSync(refDir)) continue
      for (const f of fs.readdirSync(refDir).filter((n) => n.endsWith('.md'))) {
        for (const line of fs.readFileSync(path.join(refDir, f), 'utf8').split('\n')) {
          if (/附\.[0-9]/.test(line)) {
            expect(line, `${skill}/references/${f} 附录指针须带「不分发」诚实标注（附录未分发）`).toContain('不分发')
          }
        }
      }
    }
    // H. 版本不升：批号 0.0.31 同版本 0.0.30 内追加——版本件零改动，版本纪律全套断言在 0.0.31 产品体验批组（0.0.31 版起接力）
  })

  it('0.0.31 产品体验批：新手路径 A 默认（beginner 触发话术＋路径 B 标进阶＋弹头人话）＋CONTEXT 术语表按旅程补全（≥30 条）＋浮动条款前置护栏＋版本纪律全套', () => {
    const beginner = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'docs', 'user', 'beginner.md'), 'utf8')
    const firstBook = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'docs', 'user', 'first-book.md'), 'utf8')
    const context = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'docs', 'CONTEXT.md'), 'utf8')
    // A. 路径 A 默认：beginner 第 5 节含路径 A 触发话术（快速开写＋先跑起来再细化），路径 B 降级进阶小节且话术原文保留；两文件同款
    for (const [label, doc] of [['beginner.md', beginner], ['first-book.md', firstBook]] as const) {
      expect(doc, `${label}: 路径 A 触发话术应在位`).toContain('快速开写，先跑起来再细化')
      expect(doc, `${label}: 路径 B 应标进阶`).toContain('进阶——逐部细聊')
      expect(doc, `${label}: 路径 B 话术原文应保留`).toContain('使用逐部设计流程')
      expect(doc.indexOf('快速开写，先跑起来再细化'), `${label}: 路径 A 话术应先于路径 B 话术出现`).toBeLessThan(doc.indexOf('使用逐部设计流程'))
    }
    // B. 首章前术语人话：确认点弹头不再用契约骨架式系统词（整包设计过目在位，旧弹头串清零）
    expect(beginner).toContain('整包设计过目')
    expect(beginner, '旧作品定调弹头串应清零').not.toContain('这里选择作品契约、故事骨架、分卷布局和卷规划')
    expect(beginner, '旧章细纲弹头串应清零').not.toContain('场景推进、读者承诺和章尾悬念')
    expect(beginner).toContain('增强索引')
    expect(beginner, '嵌入/场景识别/重排序三行应并入增强索引一行').not.toContain('| **嵌入 API** |')
    // C. CONTEXT 术语表按旅程补全：数据行 ≥30（7 条既有＋首章旅程 33 条）；旅程锚点术语在位
    const contextRows = context.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| 术语') && !l.startsWith('| ---')).length
    expect(contextRows, 'CONTEXT.md 术语数据行应 ≥30').toBeGreaterThanOrEqual(30)
    for (const term of ['| 快速开写（路径 A） |', '| 逐部设计流程（路径 B） |', '| 写前十查 |', '| 吃书补偿 |']) {
      expect(context, `CONTEXT.md 应含旅程术语行「${term}」`).toContain(term)
    }
    // D. 浮动条款前置护栏：高级选项定位＋core 限制前置（护栏先于浮动示例行）；既有语义与现状注记不动（0.0.18/0.0.28 批断言继续成立）
    const design = readSkill('novel-design')
    expect(design).toContain('高级选项，非默认推荐')
    expect(design).toContain('如需使用请知悉此限制')
    expect(design.indexOf('高级选项，非默认推荐'), '护栏应前置于浮动示例行').toBeLessThan(design.indexOf('章型浮动: 常规 3500-4500'))
    // E. 版本纪律全套钉随当前版走——0.0.34 流程修复批（flow-fix 01-02）起移入 0.0.34 组接力（本组原 0.0.31 钉同步退役；当前口径随版本走，见 0.0.19 组 A 注）
  })

  it('0.0.31 数据保护批：草稿区/书房独立仓版本化（ensureDraftGit/snapshotDraft＋tools/result 观察者）＋一键备份三件套（core＋CLI＋薄入口注册＋SKILL 表）＋status 快照复用防回退', () => {
    // A. #2 draft-git 模块存在＋导出接线＋.abzu 排除
    const draftGitPath = path.join(__dirname, '..', '..', 'core', 'src', 'repo', 'draft-git.ts')
    expect(fs.existsSync(draftGitPath), 'core/src/repo/draft-git.ts 应存在').toBe(true)
    const draftGit = fs.readFileSync(draftGitPath, 'utf8')
    expect(draftGit).toContain('export function ensureDraftGit')
    expect(draftGit).toContain('export function snapshotDraft')
    expect(draftGit).toContain('export function ensureStudyGit')
    expect(draftGit).toContain('export function snapshotStudy')
    expect(draftGit).toContain(':(exclude).abzu')
    expect(fs.readFileSync(path.join(__dirname, '..', '..', 'core', 'src', 'index.ts'), 'utf8'), 'core index 应导出 draft-git').toContain("./repo/draft-git")
    // B. #2 接线：导入/记忆写后快照＋文件工具写后观察者（tools/result）
    const novelTools = fs.readdirSync(path.join(__dirname, '..', 'src', 'tools'))
      .filter((f) => f.endsWith('.ts'))
      .map((f) => fs.readFileSync(path.join(__dirname, '..', 'src', 'tools', f), 'utf8')).join('\n')
    expect(novelTools, '作者稿导入后应快照草稿区').toContain('快照: 作者稿导入')
    expect(novelTools, '作者手改摄入后应快照草稿区').toContain('快照: 作者手改')
    expect(novelTools, '作者记忆写入后应快照书房').toContain('快照: 作者记忆')
    const gates = fs.readFileSync(path.join(__dirname, '..', 'src', 'gates.ts'), 'utf8')
    expect(gates, '文件工具写后快照应挂 tools/result 观察者').toContain("'tools/result'")
    expect(gates).toContain('attachDraftSnapshotToAgent')
    // C. #3 一键备份三件套：core backup（哈希口径单源＋manifest 最后落盘）＋CLI＋薄入口注册＋SKILL 工具表
    const backup = fs.readFileSync(path.join(__dirname, '..', '..', 'core', 'src', 'repo', 'backup.ts'), 'utf8')
    expect(backup, '备份哈希口径应复用 materialHash（与 computeExport 同源）').toContain('materialHash')
    expect(backup).toContain("'manifest.json'")
    // 0.0.33 TOCTOU 修复后：整轮只取一次时戳＋mkdir 原子占位
    expect(backup).toContain('const stamp = localStamp()')
    const thinEntry = path.join(__dirname, '..', 'skills', 'novel-export', 'scripts', '一键备份.mjs')
    expect(fs.existsSync(thinEntry), 'novel-export/scripts/一键备份.mjs 薄入口应存在').toBe(true)
    expect(fs.readFileSync(thinEntry, 'utf8')).toContain('backupCli')
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    expect(contract, '一键备份薄入口应在 artifact-contract thinScripts 注册').toContain("['skills/novel-export/scripts/一键备份.mjs', 'backupCli']")
    expect(fs.readFileSync(path.join(__dirname, '..', 'src', 'index.ts'), 'utf8'), 'bundle index 应导出 backupCli').toContain("export { backupCli } from './scripts/backup-cli'")
    const exportSkill = readSkill('novel-export')
    expect(exportSkill, 'SKILL 备份工具表应在位').toContain('## 备份工具表')
    expect(exportSkill).toContain('替代手工备份流程')
    expect(exportSkill).toContain('不替代网盘同步／异地容灾')
    expect(exportSkill).toContain('scripts/一键备份.mjs --book')
    // D. #7 status 优化防回退：复用 listResumable 已算好的快照，不逐章重调 renderStatusCard
    expect(novelTools, 'statusCard 应复用 listResumable 快照（r.statusCard）').toContain('statusCard: r.statusCard')
    expect(novelTools, '不得回退为每章重调 renderStatusCard').not.toContain('renderStatusCard(bookRoot, r.key)')
    const bench = path.join(__dirname, '..', '..', '..', 'scripts', 'benchmarks', 'benchmark-status.mjs')
    expect(fs.existsSync(bench), '长篇性能护栏基准 scripts/benchmarks/benchmark-status.mjs 应存在').toBe(true)
    const benchText = fs.readFileSync(bench, 'utf8')
    expect(benchText).toContain('listResumable')
    expect(benchText).toContain('BUDGET_MS')
    const rootPkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'package.json'), 'utf8')) as { scripts: Record<string, string> }
    expect(rootPkg.scripts['benchmark:status'], 'npm 应有 benchmark:status 入口').toContain('benchmark-status.mjs')
  })

  it('0.0.33 流程修复批（flow-fix 04-06）：卷纲偏差处理分档＋路径 A 摘要过目＋自查卡判据指针化——同版本 0.0.32，版本件由并行批管', () => {
    const outline = readSkill('novel-outline')
    const design = readSkill('novel-design')
    // A. 工单 04 卷纲轻量演化：outline 侧分档定义全文＋design 侧指针引用（两 SKILL 各含分档关键词）
    expect(outline).toContain('**卷纲偏差处理分档**')
    expect(outline).toContain('小偏差（线索推进方向调整/弧线细节微调/心动位移位，不影响卷末兑现与主战层级）')
    expect(outline).toContain('直接改候选卷纲→再确认（版本+1）')
    expect(outline).toContain('不跑影响分析（与细纲人物自决轻量改纲同款通道）')
    expect(outline).toContain('大偏差（卷末兑现变了/主战层级升了/分卷接口动了）')
    expect(outline).toContain('仍走《定调设计》卷纲修订＋影响分析前置呈报')
    expect(design).toContain('**卷纲偏差处理分档**')
    expect(design).toContain('分档定义在《细纲备料》技能包「滚动窗口段级刷新」节')
    expect(design, 'design 侧不得重述分档边界定义（单源在 outline 侧）').not.toContain('心动位移位，不影响卷末兑现与主战层级')
    expect(outline, '旧单通道句应清零').not.toContain('卷纲要动先走')
    expect(design, '旧单通道句应清零').not.toContain('卷纲要修订先走')
    // B. 工单 05 路径 A 呈报减负：design 步骤 3 摘要过目＋看细节指引＋beginner 第 5 节同步
    expect(design).toContain('**摘要过目**（默认第一步）')
    expect(design).toContain('5-8 行人话摘要')
    expect(design).toContain('「看细节」')
    expect(design).toContain('想看任何一件的全文，点名即可')
    expect(design).toContain('即视为确认整包（含留白）')
    expect(design, '旧整份过目句应清零').not.toContain('整份呈作者过目')
    const beginner = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'docs', 'user', 'beginner.md'), 'utf8')
    expect(beginner).toContain('先用几行人话摘要给你过目')
    expect(beginner).toContain('想看哪件的全文，点名即可')
    expect(beginner).toContain('说「看细节」或点名某件才展开全文')
    // C. 工单 06 判据瘦身：自查卡三处指针句＋旧判据正文清零（判据单源散文卡组，七卡不动）
    const cards = fs.readFileSync(skillFile('novel-drafting', 'agents/写作卡.md'), 'utf8')
    for (const ptr of [
      '零回指：按散文卡组零回指卡三判据自查',
      '连接词：按散文卡组连接词卡四判据自查',
      '句长均质化：按散文卡组句法节奏卡三判据自查',
    ]) {
      expect(cards, `自查卡应含指针句「${ptr}」`).toContain(ptr)
    }
    for (const stale of ['零回指过度回避', '连接词堆积', '句句补全「他／她」起头＝机器感', '删到一句一词', '整段句长挤在同一档', '五书句长标准差 16-46 字', '2.91-6.28/千字']) {
      expect(cards, `自查卡重复判据正文「${stale}」应清零（单源在散文卡组）`).not.toContain(stale)
    }
    for (const card of ['### 句法节奏卡〔theory-cards T015/T017/T022〕', '### 零回指卡〔theory-cards T019〕', '### 连接词卡〔theory-cards T030/T024〕']) {
      expect(cards, `散文卡组卡头「${card}」应保留（写时判据不动）`).toContain(card)
    }
  })

  it('0.0.34 流程修复批（flow-fix 01-02）：灵感库主动供给（outline 备料段自动匹配）＋写时发现登记位（drafting 可选交子段＋settle 分拣三去向）＋版本纪律全套', () => {
    // A. 工单 01 灵感库主动供给：备料段「自主补充材料」节内自动匹配——关键词 grep 全路径＋不整卡内联只取两列 ≤3 条＋正式入包走补充通道＋未建跳过不提示
    const outline = readSkill('novel-outline')
    const supplement = outline.slice(outline.indexOf('## 备料段'), outline.indexOf('## 工件契约'))
    expect(supplement, 'outline 备料段应含「灵感库自动匹配」小节').toContain('**灵感库自动匹配**')
    expect(supplement).toContain('grep `<工作范围>/书房/灵感库/*/零件卡.md`')
    expect(supplement).toContain('场景元素＋设定域＋情绪词')
    expect(supplement).toContain('「化用启示」列＋「一句话（骨）」列')
    expect(supplement).toContain('≤3 条')
    expect(supplement).toContain('正式入包仍走既有补充通道')
    expect(supplement).toContain('灵感库未建时直接跳过不提示')
    // B1. 工单 02 写时发现登记位：drafting 候选事实段协议后接可选交子段——标题与前产行式＋三类示例＋宁少勿滥（本章已写走候选事实）
    const drafting = readSkill('novel-drafting')
    const candidateProtocol = drafting.slice(drafting.indexOf('**候选事实段（必交）**'), drafting.indexOf('2. 派发并等待完成'))
    expect(candidateProtocol, 'drafting 候选事实段协议应含「写时发现（可选交）」子段').toContain('**写时发现（可选交）**')
    expect(candidateProtocol).toContain('`## 写时发现`')
    expect(candidateProtocol).toContain('`- 前瞻：<想到的东西→建议落到哪>`')
    expect(candidateProtocol).toContain('只有留给后续的才进')
    // B2. settle 沉淀步写时发现分拣：三去向（新伏笔/人物设定经 novel_note_pending＋改窗口卷纲记待改走影响分析）＋呈报不自动落盘＋无该节跳过
    const settle = readSkill('novel-settle')
    expect(settle).toContain('**写时发现分拣**')
    expect(settle).toContain('`## 写时发现`')
    expect(settle).toContain('记线索/承诺（标「写时发现」来源）')
    expect(settle).toContain('作者确认后入账本')
    expect(settle).toContain('作者确认后改世界书')
    expect(settle).toContain('走影响分析前置呈报流程')
    expect(settle).toContain('分拣结果呈报作者，不自动落盘')
    // C. 版本纪律全套：两 package.json 0.0.34＋CHANGELOG 条目＋README×2＋docs/user＋docs/maintenance 0.0.33 零残留（0.0.43 心智批收口接力）
    const rootPkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'package.json'), 'utf8'))
    const bundlePkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))
    expect(rootPkg.version, '根 package.json 版本应为 0.0.34').toBe('0.0.34')
    expect(bundlePkg.version, 'bundle package.json 版本应为 0.0.34').toBe('0.0.34')
    expect(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'CHANGELOG.md'), 'utf8')).toContain('## [0.0.34]')
    for (const readme of ['README.md', 'packages/bundle/README.md']) {
      expect(fs.readFileSync(path.join(__dirname, '..', '..', '..', readme), 'utf8'), `${readme} 应含当前版本 0.0.34`).toContain('0.0.34')
    }
    for (const dir of ['user', 'maintenance'] as const) {
      const docsDir = path.join(__dirname, '..', '..', '..', 'docs', dir)
      for (const f of fs.readdirSync(docsDir).filter((name) => name.endsWith('.md'))) {
        expect(fs.readFileSync(path.join(docsDir, f), 'utf8'), `docs/${dir}/${f}: 不应残留上一版 0.0.33`).not.toContain('0.0.33')
      }
    }
  })

  it('0.0.35 流程修复后沿批（flow-fix 03+07）：批量细纲＋连写叠加＋审读沉淀并行＋十查⑥⑧脚本化＋批量滚窗——同版本 0.0.32，版本件由前批管', () => {
    const outline = readSkill('novel-outline')
    const director = readSkill('novel-director')
    // A. 工单 03 批量细纲：可选分支落位（章纲分级之后、标准流程步骤 1 之前）＋触发/跨章钩型排期/差异呈报/逐章确认四关键词
    const batchStart = outline.indexOf('**批量细纲')
    expect(batchStart, 'outline 应含「批量细纲」节').toBeGreaterThanOrEqual(0)
    const batch = outline.slice(batchStart, outline.indexOf('1. **读窗口与卷纲**'))
    expect(batchStart, '批量细纲节应在章纲分级之后').toBeGreaterThan(outline.indexOf('**章纲分级'))
    for (const kw of [
      '触发条件',
      '「规划本章到第 N 章」「规划到本章+3」',
      '默认一章一纲，批量是显式指令',
      'N ≤5 章',
      '场景卡选择跨章看',
      '钩型配比跨章规划',
      '危机钩兑现章号跨章排、张力类占比按 N 章窗口算而非单章',
      '伏笔排期一批过',
      '跨章保温触点同批排定',
      '灵感库自动匹配一次跑 N 章',
    ]) {
      expect(batch, `批量细纲节应含「${kw}」`).toContain(kw)
    }
    // 批量呈报（首章全目/后续差异＋十查基线带后续章）＋逐章确认（core 协议不动）＋批量滚窗＋写时发现反馈闭环
    for (const kw of [
      '首章全目呈报（含十查全项）',
      '后续章差异呈报',
      '首章十查的基线带到后续章',
      '确认仍逐章',
      '`novel_confirm_outline` 逐章调用（core 协议不动——规划粒度变，确认粒度不变）',
      '同步改再呈',
      '批量滚窗',
      '`novel_roll_window` 逐条调用补位（core 协议不动，只是组装时机变）',
      '批量写时发现反馈',
      '在下一章细纲组装时优先消化',
    ]) {
      expect(batch, `批量细纲节应含「${kw}」`).toContain(kw)
    }
    // B. director 连写授权档：叠加句＋审读沉淀并行（并行的是对账准备，不是入档）
    const relay = director.slice(director.indexOf('2. **连写授权**'), director.indexOf('3. **到点收尾**'))
    expect(relay, '连写授权档应含叠加句').toContain('批量细纲与连写可叠加')
    expect(relay).toContain('先按《细纲备料》「批量细纲」一次组装 3 章细纲，再逐章走起草循环')
    expect(relay, '连写授权档应含审读沉淀并行指引').toContain('**审读沉淀并行**')
    for (const kw of ['读正文＋候选事实段做分拣准备', '由主控沿《定稿沉淀》沉淀步骤 2-4 补完（处置→定稿→入档）', '并行的是对账准备，不是入档', '审读发现项未处置完不得入档']) {
      expect(relay, `审读沉淀并行应含「${kw}」`).toContain(kw)
    }
    // C. 工单 07 十查⑥⑧脚本化：SKILL 步骤 4 指引＋底本⑥⑧改「跑脚本读结果＋模型判断」＋脚本存在且注册
    expect(outline, 'outline 步骤 4 应含脚本化⑥⑧指引').toContain('⑥⑧的机械部分先跑本技能包 `node <resourceBase>/scripts/十查机械.mjs')
    expect(outline).toContain('读结果再叠模型判断')
    const checks = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
    expect(checks, '写前十查⑥应改脚本化口径').toContain('机械部分先跑 `node <resourceBase>/scripts/十查机械.mjs')
    expect(checks, '写前十查⑧应改脚本化口径').toContain('机械部分跑同一次 `node <resourceBase>/scripts/十查机械.mjs`')
    expect(checks).toContain('一次输出⑥⑧两查的机械结果')
    expect(checks).toContain('机械行是候选不是结论')
    expect(checks, '旧口径「机械比对由你做」应清零').not.toContain('机械比对由你做')
    expect(fs.existsSync(skillFile('novel-outline', 'scripts/十查机械.mjs')), 'novel-outline/scripts/十查机械.mjs 薄入口应存在').toBe(true)
    expect(fs.readFileSync(skillFile('novel-outline', 'scripts/十查机械.mjs'), 'utf8')).toContain('tenChecksCli')
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    expect(contract, '十查机械薄入口应在 artifact-contract thinScripts 注册').toContain("['skills/novel-outline/scripts/十查机械.mjs', 'tenChecksCli']")
    const cliSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'scripts', 'ten-checks-cli.ts'), 'utf8')
    expect(cliSrc, 'CLI 实现应只算不写').toContain('只算不写')
    expect(fs.readFileSync(path.join(__dirname, '..', 'src', 'index.ts'), 'utf8'), 'bundle index 应导出 tenChecksCli').toContain("export { tenChecksCli } from './scripts/ten-checks-cli'")
    // D. CHANGELOG 后沿批节＋「近五章机械比对」解冻声明（增强实施计划二期冻结面，本批落技能薄入口层）
    const changelog = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'CHANGELOG.md'), 'utf8')
    expect(changelog).toContain('流程修复后沿批 flow-fix 03+07')
    expect(changelog, 'CHANGELOG 应声明「近五章机械比对」解冻实装').toContain('近五章机械比对')
    expect(changelog).toContain('解冻')
  })

  it('0.0.36 全量审查修复批：快档数值单源＋出处注记全清＋审读沉淀并行开闸＋修辞预算指针＋灵感库枚举指路＋标尺三值勘误——同版本 0.0.32，版本件由前批管', () => {
    const design = readSkill('novel-design')
    const outline = readSkill('novel-outline')
    const settle = readSkill('novel-settle')
    const director = readSkill('novel-director')
    const inspiration = readSkill('novel-inspiration')
    const cards = fs.readFileSync(skillFile('novel-drafting', 'agents/写作卡.md'), 'utf8')
    const clean = fs.readFileSync(skillFile('novel-polish', 'references/1-表达清理.md'), 'utf8')
    const volSpec = fs.readFileSync(skillFile('novel-design', 'templates/卷纲固定段规格.md'), 'utf8')
    const ladder = fs.readFileSync(skillFile('novel-design', 'templates/对手梯队子表规格.md'), 'utf8')
    const power = fs.readFileSync(skillFile('novel-design', 'templates/世界书/力量体系条目模板.md'), 'utf8')
    const game = fs.readFileSync(skillFile('novel-design', 'templates/世界书/局规则条目模板.md'), 'utf8')
    const sect = fs.readFileSync(skillFile('novel-outline', 'templates/章细纲固定小节规格.md'), 'utf8')
    const scale = fs.readFileSync(skillFile('novel-design', 'references/参考标尺.md'), 'utf8')
    // A. C1 快档数值单源：design 三档话术与标尺 2100-2500 对齐，旧 2300-2500 与「十日/道诡型」清零
    expect(design).toContain('快节奏档 2100-2500（十日型）')
    expect(design, '旧「2300-2500」漂移值应清零').not.toContain('2300-2500')
    expect(design, '标尺单源无「道诡型」，SKILL 不重述').not.toContain('道诡')
    // B. R1 出处注记负断言：skills/ 树（assets 种子数据除外）七类出处零命中（〔theory-cards T 编号〕与〔§x.y〕卡头合法声明不在其列）
    const skillsRoot = path.join(__dirname, '..', 'skills')
    const walkMd = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
      .flatMap((e) => (e.isDirectory() && e.name !== 'assets' ? walkMd(path.join(dir, e.name)) : [path.join(dir, e.name)]))
      .filter((f) => f.endsWith('.md'))
    for (const f of walkMd(skillsRoot)) {
      const text = fs.readFileSync(f, 'utf8')
      for (const marker of ['源出成品反推', '五书共识', '1-4 实测', '1-4 复现', '试运行实证', '方向二抽样', '阈值出处']) {
        expect(text, `${path.relative(skillsRoot, f)}: 出处注记「${marker}」应清零`).not.toContain(marker)
      }
    }
    // B2. R1 正断言：判据句与数值保留（抽四处关键位）
    expect(outline).toContain('兑现前必有强化触点')
    expect(volSpec).toContain('误会-和解小循环周期按本书节奏拟（参考 10-15 章，大周期以事件弧计）')
    expect(sect).toContain('期待钩靠设计期排期，不是写时顺手')
    expect(game).toContain('换算随本书设定自拟口径、不默认小时换算')
    expect(game).not.toContain('1-4')
    expect(ladder).toContain('可留白不强制、不参与取数。')
    expect(power).toContain('四件合称事件化四件，章级核对位＝《细纲备料》技能包 agents/写前十查.md 检查②；')
    // C. R2 审读沉淀并行开闸：settle 步骤 1 前置句＋director 主控归属句
    expect(settle).toContain('（审核完成后、组包前；审读子代理仍在跑时可先做候选事实段的写时发现分拣与对账准备——见《工作台总控》审读沉淀并行句）')
    expect(director).toContain('由主控沿《定稿沉淀》沉淀步骤 2-4 补完（处置→定稿→入档）')
    expect(director, '主控专属步骤不归子代理名下').not.toContain('沉淀子代理补完剩余步骤')
    // D. R3 修辞预算指针改指 AI 痕迹六条（悬空指针修复——「修辞预算四条」节名已不存在；0.0.42 判据微修批：破折号数值随裁 ≤4/千字→0-1/千字，断言随裁同步）
    expect(cards).toContain('密度上限同行文自查卡 AI 痕迹六条中三对带数值行（格言 ≤2/章、比喻 ≤2/千字、破折号 0-1/千字）')
    expect(cards, '悬空指针「修辞预算四条」应全文件清零').not.toContain('修辞预算四条')
    // E. M1 灵感库枚举指路（完整枚举单源在采风检索——单源侧正断言见 0.0.22 简称清理批 E 节）
    expect(inspiration).toContain('类简称十值与可信度四态枚举单源在 [采风检索](agents/采风检索.md)')
    expect(inspiration, 'SKILL 完整枚举应退役').not.toContain('类简称＝古词/台词/剧情/人物/历史/文化/影动/现实/命名/设定')
    // F. 低等级项：参照带措辞归一＋标尺三值＋settle 派发模板路径补尖括号＋design 窗口路径统一
    expect(cards).toContain('参照书章节相邻双代词起句不足 1%')
    expect(cards, '「人类五书样本」出处措辞应清零').not.toContain('人类五书样本')
    expect(cards, '「人类对照章节」出处措辞应清零').not.toContain('人类对照章节')
    expect(clean).toContain('参照书章节相邻双代词起句 0-0.7%')
    expect(clean).toContain('参照带约 3-6 处/千字')
    expect(scale).toContain('每 15 章（≈5-7 万字）章制')
    expect(scale).toContain('极值 48')
    expect(scale).toContain('常态卷（20-30 万）3.5 倍')
    expect(settle).toContain('<粘贴 草稿区/草稿/卷<NN>-<章名>/稿<N>.md 全文>')
    expect(design).toContain('`大纲/卷规划/卷<NN>/近期窗口.md`')
    expect(design, 'design 工件表「卷NN」路径式应统一为「卷<NN>」').not.toContain('大纲/卷规划/卷NN/')
    // G. CHANGELOG 全量审查修复批节＋出处去向留痕
    const changelog = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'CHANGELOG.md'), 'utf8')
    expect(changelog).toContain('全量审查修复批')
  })

  it('0.0.37 挂账修复批（core 三件＋技能三件＋十查补测）', () => {
    // A. 危机钩红线单源化收尾：ruler 单源保留阈值（0.0.26 批 A 节已钉），review 任务包摘录扩含钩型配比行
    const scale = fs.readFileSync(skillFile('novel-design', 'references/参考标尺.md'), 'utf8')
    expect(scale).toContain('危机钩（即时威胁型）兑现章号距钩章 ≤5 章')
    const reviewSkill = fs.readFileSync(skillFile('novel-review', 'SKILL.md'), 'utf8')
    expect(reviewSkill).toContain('每章字数三档、节拍分档与章末钩型配比行（全量审读维度 1 的危机钩兑现红线用）')
    // B. 写作卡选卡映射单源：卡头节带映射句，drafting 只留指路不再重述映射与 § 对照表
    const cards = fs.readFileSync(skillFile('novel-drafting', 'agents/写作卡.md'), 'utf8')
    expect(cards).toContain('选卡映射：推进场景带推进卡｜塑造场景带塑造卡｜动作高潮场景带动作卡｜环境展开场景带环境卡｜转场/分镜切换场景带转场卡')
    expect(cards).toContain('「场景功能」枚举单源在《细纲备料》技能包 templates/章细纲固定小节规格.md')
    const drafting = readSkill('novel-drafting')
    expect(drafting).toContain('按确认细纲/材料包各单元「场景功能」标注与卡头选卡映射把对应卡**原文内联**任务包')
    expect(drafting).toContain('按所选卡卡头标注的节源（[07_正文写作](references/07_正文写作.md) 的 §x.y）只读该节')
    expect(drafting, 'SKILL 不应重述选卡映射').not.toContain('推进场景带推进卡；塑造场景带塑造卡')
    // C. 情绪直说张力修复：绝对禁令改按场景定档，升级链原文保留（0.0.26 批 E 节钉的链式串继续成立）
    expect(cards).toContain('情绪按场景定档：过场可直接说，情绪场景按升级链落笔')
    expect(cards).toContain('情绪场景至少落在生理反应档')
    expect(cards, '绝对禁令句应清零').not.toContain('情绪不直接说，按升级链落笔')
    // D. CHANGELOG 挂账修复批节
    const changelog = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'CHANGELOG.md'), 'utf8')
    expect(changelog).toContain('挂账修复批')
  })

  it('0.0.38 心智批·起草：R1-R8 重写＋删除句 8 句清零＋R4 改判＋双锚排位＋自评行判据式', () => {
    const drafting = readSkill('novel-drafting')
    // A. 新第 0 件八条句正钉（条名粗体短名＋各条运行时形态关键短语——条序 R1→R8）
    const mindPins = [
      '**写前重读**：开笔第一动作＝重读上章末尾与衔接段，逐行点名读近三章「语态样本：」行（位于任务包末尾）找回语感；首章改读文风基准',
      '**双位视角**：场景内只写他能知道、感到、害怕的；埋伏笔挖钩放烟幕时切出来对信息差——读者读到而角色不知道的部分由你控制',
      '**在场**：直接呈现画面（他看到的/听到的/闻到的），不写"这时他看到了..."',
      '**节奏跟随**：按场景类型给节奏：打斗快、独白慢、对话跳；笔墨花在读者最关心的地方，不平均用力',
      '**角色自决**：写到"他不会这么说"就跟角色走，候选事实段注明偏离与原因；牵动伏笔或窗口的停笔走轻量改纲，不硬掰',
      '**找乐子**：开写前问哪里好玩：能埋会心的梗、能反的套路、能更活的人物就做；平淡过渡段生个事——小意外/小冲突/小反转；梗必须从人物嘴里长出来',
      '**读者在场**：落笔前想一下：他此刻盼着什么、你在哪吊他胃口、他会猜到吗——会猜到就绕开或放假烟雾弹引他猜错',
      '**一气呵成**：从第一句写到章末钩，不中断不查证不换语态——中断会把分析腔带进后文；不确定的先写过去标待定；禁入泄露/POV 漂当场自改，事实错对材料包核验再改',
    ]
    let prev = -1
    for (const pin of mindPins) {
      const at = drafting.indexOf(pin)
      expect(at, `心智条应在位：「${pin.slice(0, 12)}…」`).toBeGreaterThanOrEqual(0)
      expect(at, `心智条应按 R1→R8 排序：「${pin.slice(0, 12)}…」`).toBeGreaterThan(prev)
      prev = at
    }
    // B. 删除句清单 8 句负断言（架构 §4.3——标题注/括注/身份句/比喻句/情绪化判据逐句清零）
    for (const stale of [
      '不是规则，是进入状态的方式',
      '怎么接收信息',
      '放下分析脑',
      '你是他在经历这个场景',
      '不是你在描述他经历',
      '你是作家不是角色，两把椅子都要坐',
      '场景自己有呼吸',
      '这是你的场子',
      '写得你自己都不想停',
      '让这个场景活起来',
      //（0.0.41 同步注：负断言关键词改全形锚「入戏（双位）」——裸词「入戏」会被「引入戏剧性」类正常文本假红）
      '入戏（双位）',
    ]) {
      expect(drafting, `删除句应清零：「${stale}」`).not.toContain(stale)
    }
    // C. R4 改判（G1 两级改造落起草侧）：单元配给降参考带宽＋写时节奏赢＋误判落自评行＋章级合计带判
    expect(drafting).toContain('单元级配给＝参考带宽（±50% 浮动【待实测分位定值】）')
    expect(drafting).toContain('写时按场景类型给节奏赢过配给')
    expect(drafting).toContain('误判的段落落自评行供润色复核')
    expect(drafting).toContain('章级合计仍按目标字数区间判——合计不足加事不加字')
    expect(drafting, '「配给赢」旧口径应不存在（本 SKILL 从未实装该句——防回退钉）').not.toContain('配给赢')
    // D. 任务包排位双锚：第 0 件居首保持＋语态样本行包尾注入（生成点前最后一读）＋同型约束（0.0.42 判据微修批：「抽出，注入」改「移至」——包内唯一份，断言随裁同步）
    expect(drafting).toContain('**任务包第 0 件·写作心智**（排所有其他件之前）')
    expect(drafting).toContain('移至任务包最末——生成点前最后一读')
    expect(drafting).toContain('样本选与本章场景功能同型的段落（打斗章锚打斗样本）')
    expect(drafting.indexOf('生成点前最后一读'), '语态样本包尾注入应排在任务包清单最末（写时发现之后）').toBeGreaterThan(drafting.indexOf('**写时发现（可选交）**'))
    // E. 自评行判据式改造：「没劲段」16/16 全空实证——改读者跳读判据自问，保留不返工句
    expect(drafting).toContain('读者会跳读的段〈章内位置或「无」——按"删掉这段读者损失什么"判〉')
    expect(drafting).toContain('不是错误项、不因它返工，供润色参考')
    expect(drafting, '旧「没劲段」提示语应退役（起草侧）').not.toContain('没劲段')
  })

  it('0.0.39 心智批·细纲：写时整合 O1-O4 重写＋单元排布 U1-U3＋预期字数两级配给＋§6.6 漂移清理', () => {
    const outline = readSkill('novel-outline')
    const sect = fs.readFileSync(skillFile('novel-outline', 'templates/章细纲固定小节规格.md'), 'utf8')
    const checks = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
    // A. 写时整合四条按架构 §4.2 O1-O4 运行时形态重写（总纲句保留＋条名短名＋条序 O1→O4 递增）
    expect(outline).toContain('不是先写完再逐项查，而是写时就同时想')
    const oPins = [
      '**情绪接力**：写「情绪与节奏目标」时同时想——上章末读者带什么情绪走、本章转到什么情绪、本章在卷里是铺垫期、高潮期还是收束期',
      '**信息边界推演**：写「信息边界」时同时想——读者此刻最渴望知道什么、最不想让他们知道什么、哪个信息给一半比全给更抓人',
      '**冲突强度定位**：写「冲突与爽点」时同时想——冲突强度在卷里排第几、上一章是什么级别、读者看完这章够不够"想翻下一章"',
      '**双钩还债预检**：写「章末双钩」时同时想——下章细纲已经排了什么（近期窗口可读）、这个钩下章拿什么还、下章没排时钩子够不够指引下章方向',
    ]
    let prevO = -1
    for (const pin of oPins) {
      const at = outline.indexOf(pin)
      expect(at, `写时整合条应在位：「${pin.slice(0, 12)}…」`).toBeGreaterThanOrEqual(0)
      expect(at, `O1→O4 条序递增：「${pin.slice(0, 12)}…」`).toBeGreaterThan(prevO)
      prevO = at
    }
    // 停机条件句内短语（高频项：本卷首章改读卷摘要／过渡章简章降级×3／卷末章跨卷登记）
    expect(outline).toContain('本卷首章无上章时改读卷摘要末段')
    expect(outline).toContain('过渡章简章只跑前两问')
    //（0.0.42 判据微修批：释放量对账补 ≤70% 口径锚指向章细纲固定小节规格「信息边界」行——断言随裁同步）
    expect(outline).toContain('过渡章简章只跑「最不想让他们知道」＋释放量对账（≤70% 口径见章细纲固定小节规格『信息边界』行）两问')
    expect(outline).toContain('过渡章简章降为强度一句判断')
    expect(outline).toContain('卷末章（下章为下卷首章）兑现章号跨卷登记，不判兑现距离')
    // B. 单元排布 U1-U3 三句钉（架构 §5.2 运行时形态列原文——挂细纲段条目后、判据行前）
    expect(outline).toContain('**单元排布**（细纲段单元列表落笔时）')
    const uAnchor = outline.indexOf('**细纲段**：叙事单元列表')
    const uStart = outline.indexOf('**单元排布**（细纲段单元列表落笔时）')
    const uEnd = outline.indexOf('   - 判据：读 [06_章纲]')
    expect(uAnchor, '挂点锚（细纲段条目）应在位').toBeGreaterThanOrEqual(0)
    expect(uStart, '单元排布应挂在细纲段条目之后').toBeGreaterThan(uAnchor)
    expect(uEnd, '判据行锚应在位').toBeGreaterThanOrEqual(0)
    expect(uStart, '单元排布应在判据行之前').toBeLessThan(uEnd)
    const uPins = [
      '**拆并**：拆单元时数维度：时空-POV-目标变了几个，全同且功能同就合并；情绪大转向同场也切；长跨度压成连排小条',
      '**排序**：排单元先顺时间线；最大信息单元前后配铺垫和反应；大战中途可插一拍众生反应；末单元只开一个问号',
      '**配字**：配字先问读者最想看哪一秒：那一秒给足，交接带过，钩一两句；合计不足加事不加字',
    ]
    let prevU = -1
    for (const pin of uPins) {
      const at = outline.indexOf(pin)
      expect(at, `单元排布条应在位：「${pin.slice(0, 10)}…」`).toBeGreaterThanOrEqual(0)
      expect(at, `U1→U3 条序递增：「${pin.slice(0, 10)}…」`).toBeGreaterThan(prevU)
      prevU = at
    }
    // C. 预期字数两级配给（G1 两级改造落细纲侧——与 0.0.38 起草侧口径一致：参考带宽＋写时赢＋章级合计）
    expect(sect).toContain('**单元级预期字数＝参考带宽**（±50% 浮动【待实测分位定值】')
    expect(sect).toContain('写时按场景类型给节奏赢过配给')
    expect(sect).toContain('**章级合计仍按本章目标带判**')
    expect(sect).toContain('合计低于目标带下限＝细纲事件量不足→加单元（加事）不硬堆字')
    expect(sect, '旧单级口径「各单元预期合计对照本章目标带判」应退役（两级改造后单元级不再判合计）').not.toContain('各单元预期合计对照本章目标带判')
    // D. §6.6 漂移清理（0.0.33 审查发现 2——§6.6 通篇节奏密度无钩内容；钩判据单源＝参考标尺章末钩型配比行＋规格「章末双钩」节）
    expect(outline, 'SKILL 判据行「章末钩相关判据」失实半句应清零').not.toContain('章末钩相关判据')
    expect(outline, 'SKILL 不应残留 §6.6→章末双钩失实绑定').not.toContain('§6.6（节奏密度怎么控）')
    expect(checks, '写前十查⑩判据延伸「章末留钩与钝收边界」失实半句应清零').not.toContain('章末留钩与钝收边界')
    expect(checks).toContain('红线与配比区间取《定调设计》技能包 references/参考标尺.md 追读力量化区「章末钩型配比」行')
  })

  it('0.0.40 心智批·设计：D1-D8 调度索引化触发点八钉＋D5 首尾镜像合并＋追问句本体保留', () => {
    const design = readSkill('novel-design')
    // A. 触发点钉位八钉：各条运行时形态关键短语落在对应步骤区（架构 §4.1 运行时形态列——判据本体不动，只钉位与对齐）
    const s2 = design.indexOf('2. **世界书**')
    const s3 = design.indexOf('3. **故事骨架**')
    const s4 = design.indexOf('4. **分卷布局**')
    const s5 = design.indexOf('5. **强制多方向**')
    const s6 = design.indexOf('6. **卷规划**')
    const review = design.indexOf('**确认前评审（可选）**')
    for (const [label, anchor] of [['步骤 2', s2], ['步骤 3', s3], ['步骤 4', s4], ['步骤 5', s5], ['步骤 6', s6], ['确认前评审', review]] as const) {
      expect(anchor, `区锚 ${label} 应在位`).toBeGreaterThanOrEqual(0)
    }
    const inRegion = (pin: string, lo: number, hi: number, label: string) => {
      const at = design.indexOf(pin)
      expect(at, `${label} 应在位：「${pin.slice(0, 14)}…」`).toBeGreaterThanOrEqual(0)
      expect(at, `${label} 应钉在对应步骤区：「${pin.slice(0, 14)}…」`).toBeGreaterThan(lo)
      expect(at, `${label} 不得越出对应步骤区：「${pin.slice(0, 14)}…」`).toBeLessThan(hi)
    }
    // D1 规则连锁→世界规则条目写入前（致命冲突修掉半句＝运行时形态对齐补钉）
    inRegion('**规则连锁**：写新世界规则条目前 read 本模块已有条目', s2, s3, 'D1 规则连锁')
    inRegion('同一事实两说的致命冲突修掉', s2, s3, 'D1 致命冲突对齐句')
    // D2 金手指四轨道→力量体系对谈期（追问句本体不动，只钉触发点）
    inRegion('**金手指四轨道追问**（§2.4 力量体系对谈期过一遍）', s2, s3, 'D2 金手指四轨道')
    // D3 暗面一问→铁则对谈处
    inRegion('**暗面一问**（§3.1/§3.8 对谈时每条铁则问一次）：谁在规则下受害？', s2, s3, 'D3 暗面一问')
    // D4 配角功能一问→人物档案起稿处
    inRegion('**配角功能一问**（人物档案条目起稿时逐个常驻配角过一遍', s2, s3, 'D4 配角功能一问')
    // D5 首尾镜像→骨架对谈开端与结局两部同场对照（合并案落地）
    inRegion('**首尾镜像**（骨架对谈「故事阶段与关键转折」谈到开端与「结局与终局」时，两端互为镜像，同场对照着过', s3, s4, 'D5 首尾镜像')
    inRegion('结局处他的哪个具体选择，是开头那个他不会做的？指不出这个选择，变化就还停在宣告', s3, s4, 'D5 收束验核句')
    // D6 弧光验核→骨架两部位（三型三句＋落地两问，本体不动）
    inRegion('**弧光三型**（骨架「主角目标与成长轨迹」部对谈时过一遍', s3, s4, 'D6 弧光三型')
    inRegion('**弧光落地两问**（骨架「人物弧线与关系发展」部对谈时过一遍', s3, s4, 'D6 弧光落地两问')
    // D7 卷级交叉思考→卷纲确认前（运行时形态尾句三线断档越线重排落位——数值照标尺单源）
    inRegion('**卷级交叉思考**（卷纲正文写完、确认工具调用前过一遍）', s6, review, 'D7 卷级交叉思考')
    inRegion('三线断档红线」行核对', s6, review, 'D7 三线断档标尺行核对')
    inRegion('越线必须重排，不得带病确认', s6, review, 'D7 越线重排句')
    // D8 跨轨道自检→路径 B 五步聊完、写入前最后一道
    inRegion('**跨轨道自检**（五步聊完、写入前最后一道', s5, s6, 'D8 跨轨道自检')
    // B. D5 合并句钉：开端三问×结局两问同场对照；独立条目负断言（原为两处独立卡）
    expect(design).toContain('开端三问——为什么偏偏此刻发生（时机压力）？')
    expect(design).toContain('结局两问——让主角回到开头那一刻，他不会再做同样选择吗？')
    expect(design, '原独立卡「结局镜像卡」应清零（并入首尾镜像）').not.toContain('**结局镜像卡**')
    expect(design, '原独立卡「激励事件三问」应清零（并入首尾镜像）').not.toContain('**激励事件三问**')
    expect(design, '旧引语「结局倒推两问」应随合并退役').not.toContain('结局倒推两问')
    // C. 判据句本体保留正钉（追问原文未搬动改写——抽四句逐字核）
    expect(design).toContain('为什么偏偏此刻发生（时机压力）？为什么砸中这个主角（命中必然——绑定过往创伤，不是天降巧合）？主角为什么不躲开（无法回避——彻底打破日常，回不去了）？三问接不上＝开端只是「事情发生了」不是「不得不发生」')
    expect(design).toContain('让主角回到开头那一刻，他不会再做同样选择吗？激励事件砸出的创伤，在结局怎么被主题回应？两问都接不上，结局部还只是「赢了」不是「完成了变化」')
    expect(design).toContain('把主角拿走他还想干什么——答不上＝工具人，补独立动机')
    expect(design).toContain('谁在规则下受害？——受害处即冲突土壤；答不出受害者，这条铁则还只是设定不是压力')
  })

  it('0.0.41 心智批·润色：P1-P5 任务包第 0 件＋先后序句＋三分判进批 1/批 2＋三类去向位＋自评行新口径＋「没劲段」全 polish 清零', () => {
    const polish = readSkill('novel-polish')
    const clean = fs.readFileSync(skillFile('novel-polish', 'references/1-表达清理.md'), 'utf8')
    const reshape = fs.readFileSync(skillFile('novel-polish', 'references/2-节奏与重塑.md'), 'utf8')
    // A. 任务包第 0 件·润色心智：置顶锚＋先后序句＋P1-P5 五条正钉（条序 P1→P5 递增——架构 §5.1 各条「运行时形态」列原文，P1 标签随 0.0.38 起草侧改「读者会跳读的段」；0.0.43 审查修——括注去渗入、P1/P5 数值可达措辞、核验对象改候选事实段）
    expect(polish).toContain('**任务包第 0 件·润色心智**（排所有其他件之前）')
    expect(polish).toContain('三类判断先后序＝删留 → 节奏 → 语态——删除候选先过删留判，删定后判节奏，局部改定后核全章语态')
    const pPins = [
      '**弱段定位**：动手前先按对白占比粗判章型，逐段对照随包数值行扫密度异常段列重点清单；自评「读者会跳读的段」有就优先复核，没有不等于全章没弱段，得意句不给豁免',
      '**删留三分判**：每个删除候选先过三问：读者缺后文信息吗、是有意的强调伏笔复沓吗、删后节奏变差吗——全过才删，拿不准保留标注；改写只换说法不换事实',
      '**位置判**：改修辞先问位置：在情绪峰/出场/转折上吗——不在就删或降直陈；段末警句改成收在动作、悬问或具体物上',
      '**语态接缝核**：指令集落稿前核接缝：改动段与未动段之间口吻称谓句式没换挡；不顺处改动向存量语态收敛，不逐字找平',
      '**停机与转呈**：每段过四闸——无必改级命中、三分判全过、密度在随包数值行带内、承担钩伏笔功能——全过整段不进指令集；毛边不足和事实疑点不自己动手，转审读或对候选事实段核验；删减近两成收手呈作者',
    ]
    let prevP = -1
    for (const pin of pPins) {
      const at = polish.indexOf(pin)
      expect(at, `润色心智条应在位：「${pin.slice(0, 10)}…」`).toBeGreaterThanOrEqual(0)
      expect(at, `心智条应按 P1→P5 排序：「${pin.slice(0, 10)}…」`).toBeGreaterThan(prevP)
      prevP = at
    }
    // A2. 数值可达通道：组包时从写作卡摘录数值行随包（子代理隔离读不到技能包——跨技能摘录先例＝审读动态摘录标尺行）
    expect(polish).toContain('从《正文起草》技能包 agents/写作卡.md 末节「AI 痕迹六条」原样摘录三对带数值行随包')
    // B. P1 自评行消费接线：新标签＋为空不推断＋得意句不保护（0.0.38 起草侧格式对齐——旧『没劲段』标签退役）
    expect(polish).toContain('段末草稿自评行的「读者会跳读的段」非空时列最优先复核——作润色重点输入，仍只改表达不改事实')
    expect(polish).toContain('为空不据此推断全章无弱段；「最得意」不作保护依据')
    const polishRoot = path.join(__dirname, '..', 'skills', 'novel-polish')
    const walkPolish = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
      .flatMap((e) => (e.isDirectory() ? walkPolish(path.join(dir, e.name)) : [path.join(dir, e.name)]))
      .filter((p) => p.endsWith('.md'))
    for (const f of walkPolish(polishRoot)) {
      expect(fs.readFileSync(f, 'utf8'), `${path.relative(polishRoot, f)}: 旧「没劲段」标签应清零`).not.toContain('没劲段')
    }
    // C. P2 三分判进批 1/批 2 执行指引：三问序＋信息层一票否决＋拿不准保留＋标注（批 2 另带只换说法不换事实）
    expect(clean).toContain('删除前三问按信息→情绪→节奏序过')
    expect(clean).toContain('是→不删,后两问不再问(信息层一票否决)')
    expect(clean).toContain('是→保留并标注')
    expect(clean).toContain('三问全过才删;拿不准→保留＋标注')
    expect(reshape).toContain('改写前三问(每次等义改写前按信息→情绪→节奏序过)')
    expect(reshape).toContain('缺→该句不进改写(信息层一票否决)')
    expect(reshape).toContain('拿不准→保留＋标注;改写只换说法不换事实')
    // D. P5 转呈通道：回传物三类去向位＋两成收手句（收手措辞与主控验收「删减不超过两成」对齐——收手在前、验收在后）
    expect(polish).toContain('三类去向位——**保留并标注项**')
    expect(polish).toContain('**待作者裁决项**')
    expect(polish).toContain('**转审读项**（对白毛边不足、事实疑点对不上候选事实段、人设/逻辑/节奏一类内容问题，只记不改）')
    expect(polish).toContain('累计删减近两成即收手，剩余删除候选保留＋标注呈作者')
    // E. 停机条件三句：作者手改稿不跑（现行句对齐钉）＋定向单批只扫相关维度＋文风未定不编造
    expect(polish).toContain('的待审稿都不主动派，作者点名要润色才派')
    expect(polish).toContain('定向单批时润色心智的弱段定位扫描只扫该节相关维度，重点段清单不越节')
    expect(reshape).toContain('分部未定时如实按「未定」处理,不编造特征——改写与接缝核只对照原稿存量语态判')
  })

  it('0.0.42 判据微修批：破折号双判＋段长变异上限＋语态样本移至＋释放量对账锚', () => {
    const cards = fs.readFileSync(skillFile('novel-drafting', 'agents/写作卡.md'), 'utf8')
    const drafting = readSkill('novel-drafting')
    const outline = readSkill('novel-outline')
    const reshape = fs.readFileSync(skillFile('novel-polish', 'references/2-节奏与重塑.md'), 'utf8')
    // A. 破折号双判：位置判（高显著位才合法）＋功能判（引出解释／限定／点题即候选，不论密度）＋密度参考带 0-1/千字【待实测校准】；改法句与画像豁免句保留；旧单密度线全文件清零（含修辞上探卡引用行）
    const selfCheckStart = cards.indexOf('## 行文自查卡')
    expect(selfCheckStart, '写作卡应有行文自查卡').toBeGreaterThanOrEqual(0)
    const selfCheck = cards.slice(selfCheckStart)
    expect(selfCheck).toContain('破折号解释装置（双判：位置判＋功能判，密度参考带 0-1/千字【待实测校准】）：数「——」——位置判：高显著位才合法，不在高显著位＝候选；功能判：引出解释／限定／点题即候选，不论密度；命中候选自查哪些在引解释，拆句或删、让上下文自明（文风画像句法层申报破折号为保留技法时按画像另判）')
    expect(cards, '旧单密度线「≤4/千字」应全文件清零（含修辞上探卡引用行）').not.toContain('≤4/千字')
    expect(cards).toContain('密度上限同行文自查卡 AI 痕迹六条中三对带数值行（格言 ≤2/章、比喻 ≤2/千字、破折号 0-1/千字）')
    // B. 段长变异上限：短句对合并抬方差不得过头上限——段长变异对照参照带（人类 0.55-0.75）【待实测定值】，方差不是越大越人味
    expect(reshape).toContain('短句对合并抬段长方差不得过头上限：段长变异对照参照带（人类 0.55-0.75）【待实测定值】，方差不是越大越人味，超出带上限回退部分合并')
    // C. 语态样本「抽出」改「移至」：包内唯一份——R1 写前读与生成前末读同一份
    expect(drafting).toContain('「语态样本：」行从材料包「近期正文衔接」段移至任务包最末——生成点前最后一读')
    expect(drafting, '「抽出」措辞应清零（语态样本包尾注入条）').not.toContain('抽出')
    // D. 释放量对账补锚：≤70% 口径指向章细纲固定小节规格「信息边界」行（锚真实在位——规格件含该口径）
    expect(outline).toContain('释放量对账（≤70% 口径见章细纲固定小节规格『信息边界』行）两问')
    const sect = fs.readFileSync(skillFile('novel-outline', 'templates/章细纲固定小节规格.md'), 'utf8')
    expect(sect).toContain('揭示量 ≤70%')
  })

  it('0.0.43 心智批·G2 落地＋收口缩面：场景升级行＋带宽浮动停机＋R1 包尾注', () => {
    const drafting = readSkill('novel-drafting')
    // A. G2 场景权重写时升级（改造采纳案的运行时落地——总账复核发现 2）：准则句（升级合法＋限配给带宽内浮动＋超出交回＋登记位）
    expect(drafting).toContain('场景功能写时升级合法（预判为调剂的单元写出实功能、反之为重场让路降调剂均可），但仅限该单元配给带宽内浮动；超出带宽或牵动走向的升级走偏离建议交回，不自行落实。升级发生时在候选事实段「场景升级」行登记。')
    // B. 候选事实段「场景升级」前缀行（第五类）
    expect(drafting).toContain('`- 场景升级：<单元>｜<细纲预判功能→实际写成的功能>`')
    // C. R1 语态样本位置注（句面张力消解——样本行物理在包尾，R1 写前读同一份）
    expect(drafting).toContain('逐行点名读近三章「语态样本：」行（位于任务包末尾）找回语感')
  })
})
