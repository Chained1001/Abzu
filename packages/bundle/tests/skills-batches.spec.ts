import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

function skillPath(name: string): string {
  return path.join(__dirname, '..', 'skills', name, 'SKILL.md')
}

function readSkill(name: string): string {
  return fs.readFileSync(skillPath(name), 'utf8')
}

describe('skills 批次防回退断言组（0.0.14 模板批起）', () => {
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

  it('0.0.14 模板拆出批：组织/地图条目模板＋三份规格模板拆位＋SKILL 引用＋注册单源', () => {
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

  it('0.0.15 提卡与缺口批：写作卡八卡＋drafting 改线＋文风建档门二支四层＋趣味层＋读者在场心智与自评行＋拆书消费接线＋语态样本行＋卷纲心动位＋KB 节级健康断言', () => {
    // A. 写作卡：文件存在＋frontmatter 式样＋八卡卡名与卡头节源在位
    const cardsPath = path.join(__dirname, '..', 'skills', 'novel-drafting', 'agents', '写作卡.md')
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
    expect(drafting).toContain('深挖时按 §x.y 只读该节（07_正文写作.md），不整文件读入')
    expect(drafting).toContain('卡原文随任务包')
    // B2. 趣味层接线：写作心智找乐子条＋趣味卡按场景标签带卡（幽默/轻松/玩梗单元）
    expect(drafting).toContain('找乐子')
    expect(drafting).toContain('幽默/轻松/玩梗标签的单元时带趣味卡')
    // B3. 作家思维原则化：心智「读者在场＋主动性」条（一气呵成之前）＋热回看自愿自评行＋润色复核接线
    expect(drafting).toContain('读者在场')
    expect(drafting).toContain('吊他胃口')
    expect(drafting).toContain('自评：最得意')
    expect(readSkill('novel-polish')).toContain('没劲段')
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
    const mech = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-analyze', 'references', '机制与灵感.md'), 'utf8')
    expect(mech).toContain('重推演四步')
    expect(readSkill('novel-analyze')).toContain('重推演四步')
    // D. 语态样本行：settle SKILL＋沉淀对账底本同步，且末行位保留给章末状态
    const settle = readSkill('novel-settle')
    expect(settle).toContain('语态样本：')
    expect(settle).toContain('语态样本不得占末行')
    expect(settle).toContain('从本章挑一段满意的收进文风锚点吗')
    const reconcile = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-settle', 'agents', '沉淀对账.md'), 'utf8')
    expect(reconcile).toContain('语态样本：<本章自认最佳一句正文>')
    expect(reconcile).toContain('放在章末状态行之前')
    // E. 卷纲心动位：规格＋design SKILL 步骤 6＋章细纲规格与 SKILL 的 ★ 可选行
    const volSpec = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-design', 'templates', '卷纲固定段规格.md'), 'utf8')
    expect(volSpec).toContain('心动位')
    expect(volSpec).toContain('情绪锚不是顺序锚')
    expect(volSpec).toContain('源出 B 仓章循环设计')
    expect(readSkill('novel-design')).toContain('心动位行')
    const sectSpec = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-outline', 'templates', '章细纲固定小节规格.md'), 'utf8')
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
      const text = fs.readFileSync(path.join(__dirname, '..', 'skills', skill, 'references', file), 'utf8')
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
    const writerPath = path.join(__dirname, '..', 'skills', 'novel-design', 'agents', '作家评审.md')
    const readerPath = path.join(__dirname, '..', 'skills', 'novel-design', 'agents', '读者评审.md')
    const researcherPath = path.join(__dirname, '..', 'skills', 'novel-inspiration', 'agents', '采风检索.md')
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
    // 写前重读居首＋入戏双位（两把椅子）＋读者在场博弈（假烟雾弹）＋找乐子主动面（生个事）
    const drafting = readSkill('novel-drafting')
    expect(drafting).toContain('写前重读')
    expect(drafting).toContain('近期正文衔接')
    expect(drafting).toContain('入戏（双位）')
    expect(drafting).toContain('操控者视角')
    expect(drafting).toContain('两把椅子都要坐')
    expect(drafting).toContain('假烟雾弹')
    expect(drafting).toContain('生个事')
    expect(drafting).toContain('过渡不是班车是路')
    expect(drafting).toContain('给没意思的制造意思')
    // 写前重读必须是心智块第一条（在「入戏」之前）
    const mind = drafting.indexOf('## 写作心智')
    expect(mind).toBeGreaterThanOrEqual(0)
    expect(drafting.indexOf('**写前重读**', mind), '写前重读应居心智块条目首位').toBeLessThan(drafting.indexOf('**入戏（双位）**', mind))
    // B. 章纲分级三文件同步：判据词在 outline SKILL；简章细则在规格模板；十查放宽在写前十查底本
    const outline = readSkill('novel-outline')
    expect(outline).toContain('章纲分级')
    for (const kw of ['关键章', '过渡章', '简章', '卷首章', '卷内高潮章', '心动位', '换图章', '卷末兑现', '主战层级']) {
      expect(outline, `章纲分级判据应含「${kw}」`).toContain(kw)
    }
    expect(outline).toContain('一行带过或显式留白')
    expect(outline).toContain('确认协议不变')
    expect(outline).toContain('隔章跑')
    const sectSpec = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-outline', 'templates', '章细纲固定小节规格.md'), 'utf8')
    expect(sectSpec).toContain('简章')
    expect(sectSpec).toContain('过渡章')
    for (const kw of ['视角与焦点', '信息边界', '情绪与节奏目标', '冲突与爽点', '章末双钩']) {
      expect(sectSpec, `简章核心节应含「${kw}」`).toContain(kw)
    }
    expect(sectSpec).toContain('一行带过或显式留白')
    expect(sectSpec).toContain('留白合法')
    expect(sectSpec).toContain('六字段照抄不省')
    const checks = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-outline', 'agents', '写前十查.md'), 'utf8')
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
    const researcher = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-inspiration', 'agents', '采风检索.md'), 'utf8')
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
    const tpl = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-design', 'templates', '世界书', '力量体系条目模板.md'), 'utf8')
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
    const checks = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-outline', 'agents', '写前十查.md'), 'utf8')
    expect(checks).toContain('本章动用金手指时三查')
    for (const kw of ['代价已结否', '越档', '泄底']) {
      expect(checks, `写前十查②三查应含「${kw}」`).toContain(kw)
    }
    expect(checks).toContain('当场落账')
    expect(checks).toContain('不知道的人表现出知道')
    // D. 写后账：settle SKILL＋沉淀对账底本同步落账行——使用型逐章落账、持有型状态变化才记
    const settle = readSkill('novel-settle')
    expect(settle).toContain('「G 代价已结·第N章」')
    expect(settle).toContain('持有型代价不逐章落账（持有即持续状态），状态变化时才记')
    const reconcile = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-settle', 'agents', '沉淀对账.md'), 'utf8')
    expect(reconcile).toContain('「G 代价已结·第N章」')
    expect(reconcile).toContain('持有型不逐章登记（持有即持续状态）')
    expect(reconcile).toContain('先报缺不编')
  })

  it('0.0.16 修复批：篇幅三连＋反推四件＋P1 九项——回炉扩写/字数前置/章型浮动/结构类型/本卷升级位/出场注记/出场频率/采风红线/判级保守/八项对齐/防撞名/POV 序列/情绪基调/章名风格/速查表/第四来源', () => {
    const drafting = readSkill('novel-drafting')
    const review = readSkill('novel-review')
    const design = readSkill('novel-design')
    const outline = readSkill('novel-outline')
    const settle = readSkill('novel-settle')
    const vol = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-design', 'templates', '卷纲固定段规格.md'), 'utf8')
    const scale = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-design', 'references', '参考标尺.md'), 'utf8')
    const ladder = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-design', 'templates', '对手梯队子表规格.md'), 'utf8')
    const sect = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-outline', 'templates', '章细纲固定小节规格.md'), 'utf8')
    const researcher = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-inspiration', 'agents', '采风检索.md'), 'utf8')
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
    const researcher = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-inspiration', 'agents', '采风检索.md'), 'utf8')
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
    // D. 类简称表扩：两文件枚举加「命名/设定」
    for (const t of [inspiration, researcher]) {
      expect(t, '类简称枚举应含「命名/设定」').toContain('命名/设定')
    }
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
    const seedDir = path.join(__dirname, '..', 'skills', 'novel-inspiration', 'assets', '灵感库种子')
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
    const checks = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-outline', 'agents', '写前十查.md'), 'utf8')
    const sect = fs.readFileSync(path.join(__dirname, '..', 'skills', 'novel-outline', 'templates', '章细纲固定小节规格.md'), 'utf8')
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
    // F38 自评行落位＋字数口径：热回查/自评行固定属候选事实段末尾（正文区之外），验收口径四不计
    expect(drafting).toContain('热回查行与自评行固定属候选事实段末尾')
    expect(drafting).toContain('不含 frontmatter、候选事实段、热回查行与自评行')
    // F39 ⑧隔章定义：比对序列重启的首章与孤立过渡章照常比对，不隔（SKILL 与底本措辞一致）
    for (const t of [outline, checks]) {
      expect(t).toContain('比对序列重启的首章与孤立过渡章（前后皆关键章）照常比对，不隔')
    }
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
      const seedDir = path.join(__dirname, '..', 'skills', 'novel-inspiration', 'assets', '灵感库种子')
      for (const [seedRel, sandboxRel] of [['人物原型', '人物原型'], ['剧情结构', '剧情结构']] as const) {
        const seed = fs.readFileSync(path.join(seedDir, seedRel, '零件卡.md'))
        const sandbox = fs.readFileSync(path.join(sandboxRoot, sandboxRel, '零件卡.md'))
        expect(Buffer.compare(seed, sandbox) === 0, `种子与沙盘应逐字节一致：${seedRel}/零件卡.md`).toBe(true)
      }
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

  it('升格问补钉：novel-settle 首章末升格问关键词在位', () => {
    // 首章定稿呈报的升格问（0.0.16 升格问机制）——问句本体与首章限定词都在位才防回退：
    // 限定词丢了＝每章都问（退化）；问句丢了＝锚点段采集断链
    const settle = readSkill('novel-settle')
    expect(settle, '首章末升格问应在位').toContain('挑一段满意的收进文风锚点吗')
    expect(settle, '升格问应限定首章').toContain('首章呈报时加问一句')
  })
})
