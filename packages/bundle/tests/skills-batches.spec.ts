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
    expect(scale).toContain('数字是参考区间，不是配额')
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
    // v3：消费位列并入「口径／说明」与规划三段，钉节结构与本表边界
    expect(scale).toContain('覆盖大纲 → 卷纲 → 幕纲三段规划')
    expect(scale).toContain('## 零、先定档')
    expect(scale).toContain('## 一、大纲')
    expect(scale).toContain('## 二、卷纲')
    expect(scale).toContain('## 三、幕纲')
    expect(scale).toContain('章纲与正文执行期不查本表')
    // B. 四处缺失判据引用接线（§x.y 逐一反查由既有引用一致性测试自动扩展覆盖）
    //（0.0.56 边界重划：outline 判据行随步骤卡试点改指针句；design 卷纲判据行随卷规划移入 novel-arcplan）
    expect(readSkill('novel-outline')).toContain('《章纲-信息与情绪》等四件，整读')
    expect(readSkill('novel-arcplan')).toContain('《定调设计》技能包 references/卷纲-节奏与高潮.md、卷纲-情节类型骨架.md、卷纲-卷功能与结构.md（整读）')
    expect(readSkill('novel-drafting')).toContain('§7.5（叙述视角技术')
    const checks = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
    //（v2.4.2 阶段2 拆分：02_人物设计 §2.18 并入《人物设计-金手指设计》；v2.4.3 阶段3 拆分：03_世界观设计 §3.9 并入《世界观-力量体系与天花板》——断言随裁同步）
    expect(checks).toContain('《人物设计-金手指设计》（跨包：novel-design/references/，整读）')
    expect(checks).toContain('《世界观-力量体系与天花板》（跨包：novel-design/references/，整读）')
    expect(checks).toContain('完整版在《定调设计》技能包')
    expect(checks, '写前十查不得用跨包相对链接（人物/03 判据在 novel-design 包）').not.toContain('](../novel-design')
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
    // C5.（0.0.50：体感回灌改为下卷注意事项——问句与去处随批改写，断言钉新口径）
    //（0.0.56 边界重划：下卷注意事项三钉随卷末节移入 novel-arcplan）
    expect(readSkill('novel-arcplan')).toContain('有什么要提醒下一卷注意的')
    expect(readSkill('novel-arcplan')).toContain('下卷注意·卷<NN+1>')
    expect(readSkill('novel-arcplan')).toContain('这条属于产品反馈，不记进书里')
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
    // A3. 激励事件三问：KB 锚 §4.12（标题在《大纲-激励事件与首尾》，由引用一致性测试另守），三要素措辞对齐
    //（0.0.40 心智批·设计：激励事件三问并入「首尾镜像」同场对照条目——断言随裁同步，三问本体未动）
    const design = readSkill('novel-design')
    expect(design).toContain('**首尾镜像**')
    expect(design).toContain('时机压力')
    expect(design).toContain('命中必然')
    expect(design).toContain('无法回避')
    expect(design).toContain('§4.12')
    // A4. 反派正当性两问：KB 锚 §2.10（标题在《人物设计-反派》，由引用一致性测试另守）
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
    // B. design 条目起稿处模板列全（含路径 A 的计数行；0.0.26 流程首波批：世界书模板五→六，加局规则；0.0.51 开书流程批：六→七，加世界常量）
    const design = readSkill('novel-design')
    expect(design).toContain('[组织条目模板](templates/世界书/组织条目模板.md)')
    expect(design).toContain('[地图条目模板](templates/世界书/地图条目模板.md)')
    expect(design).toContain('人物档案/世界规则/力量体系/组织/地图/局规则/世界常量七份')
    // C. 规格模板拆位：三份存在＋规格细节在模板（表列/取数算式/四核对项）＋双 SKILL 各带一行引用
    const ladder = fs.readFileSync(skillFile('novel-design', 'templates/对手梯队子表规格.md'), 'utf8')
    expect(ladder).toContain('取数：参考标尺·<行 ID>')
    expect(ladder).toContain('| 层级 | 存活周期 | 代表对手 | 出牌与去向 |')
    expect(design).toContain('[对手梯队子表规格](templates/对手梯队子表规格.md)')
    const vol = fs.readFileSync(skillFile('novel-arcplan', 'templates/卷纲固定段规格.md'), 'utf8')
    expect(vol).toContain('压力升级检查')
    expect(vol).toContain('终局暗手')
    expect(vol).toContain('方向选择')
    //（0.0.56 边界重划：卷纲固定段规格移入 novel-arcplan）
    expect(readSkill('novel-arcplan')).toContain('[卷纲固定段规格](templates/卷纲固定段规格.md)')
    const sect = fs.readFileSync(skillFile('novel-outline', 'templates/章细纲固定小节规格.md'), 'utf8')
    expect(sect, '章细纲固定小节规格：四固定小节＋时间行＋前→后＋既有断言词全量在位').toContain('### 冲突与爽点')
    expect(sect).toContain('### 章末双钩')
    expect(sect).toContain('信息预算四行')
    expect(sect).toContain('本章新埋：零')
    expect(sect).toContain('时间行')
    // D. 注册单源：artifact-contract 登记条目模板（世界书模板经名字数组拼路径；0.0.26 流程首波批：数组加局规则）＋三份规格模板
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    //（0.0.51 开书流程批：世界书模板数组加「世界常量」——六→七）
    expect(contract).toContain("['人物档案', '世界规则', '力量体系', '组织', '地图', '局规则', '世界常量']")
    for (const rel of [
      'skills/novel-design/templates/对手梯队子表规格.md',
      'skills/novel-arcplan/templates/卷纲固定段规格.md',
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
    expect(drafting).toContain('深挖时按卡头节源→件对照整读对应拆分件，不按节切读')
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
    // C.（0.0.50 删作者记忆与默认文风批：首章文风建档门整节删除，本组 C 块断言随功能退役——
    //     替代断言见「0.0.50 删作者记忆与默认文风批」组；负断言保留防回退）
    expect(drafting, '文风默认化裁定：不留从其他作品学习文风的口子').not.toContain('从已导入的参考书归纳')
    expect(drafting, '梗密度档不设（例子型机械不入产品）').not.toContain('梗密度档')
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
    const volSpec = fs.readFileSync(skillFile('novel-arcplan', 'templates/卷纲固定段规格.md'), 'utf8')
    expect(volSpec).toContain('心动位')
    expect(volSpec).toContain('情绪锚不是顺序锚')
    expect(volSpec).toContain('源出 B 仓章循环设计')
    expect(readSkill('novel-arcplan'), '0.0.56 边界重划：心动位行随卷规划移入 arcplan').toContain('心动位行')
    const sectSpec = fs.readFileSync(skillFile('novel-outline', 'templates/章细纲固定小节规格.md'), 'utf8')
    expect(sectSpec).toContain('单元行标 `★`')
    expect(sectSpec).toContain('卷纲「心动位」')
    expect(readSkill('novel-outline')).toContain('标 `★`')
    // F. 注册单源：artifact-contract 登记写作卡
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    expect(contract).toContain("'skills/novel-drafting/agents/写作卡.md'")
    // G. KB 节级健康断言：分发件逐二级节行跨度 ≤ 上限（v2.4.1 阶段1 04/05 拆 9 件、v2.4.2 阶段2 02 拆 6 件、v2.4.3 阶段3 01/03 拆 8 件、v2.4.4 阶段4 06 拆 3 件＋存根归位、07 拆 6 件、v2.4.5 阶段5a 08 拆 3 件＋0A 退役，共 35 件——工单'36'系 34−2+3 误算，实列 35）。
    // 实测依据（2026-10-10，0.0.15 批前测量）：二级节最大行跨度 103 行（§8.5 毒点怎么查，
    // v2.4.5 起随排障域拆分在《排障-专项修复》），向上取整到十位＝110。目的＝拦知识库
    // 升版导致的节膨胀，不是改现有文件。
    const kbFiles: ReadonlyArray<{ readonly skill: string; readonly file: string }> = [
      ...['开书-构思与验证.md', '开书-读者与情绪定位.md', '开书-书名与简介.md', '开书-参考作品利用.md', '人物设计-主角.md', '人物设计-金手指设计.md', '人物设计-配角与群像.md', '人物设计-反派.md', '人物设计-弧光与关系.md', '人物设计-人物卡工具.md', '世界观-规则与铁则.md', '世界观-力量体系与天花板.md', '世界观-地图与势力.md', '世界观-经济与原创性.md', '大纲-主线与骨架.md', '大纲-激励事件与首尾.md', '大纲-换图与支线.md', '大纲-伏笔埋收.md', '大纲-牌局与结构检查.md', '卷纲-卷功能与结构.md', '卷纲-节奏与高潮.md', '卷纲-情节类型骨架.md']
        .map((file) => ({ skill: 'novel-design', file })),
      ...['章纲-章型与开篇.md', '章纲-冲突与爽点.md', '章纲-场景与节奏.md', '章纲-信息与情绪.md'].map((file) => ({ skill: 'novel-outline', file })),
      ...['正文-展示与对白.md', '正文-场景与动作.md', '正文-视角落地.md', '正文-文笔修炼.md', '正文-开场转场与特殊戏.md', '正文-中文行文规范.md'].map((file) => ({ skill: 'novel-drafting', file })),
      ...['排障-索引与改稿流程.md', '排障-专项修复.md', '排障-长篇防崩.md'].map((file) => ({ skill: 'novel-director', file })),
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
    //（0.0.58 素材库批：采风检索底本随灵感库整体迁入 novel-forage）
    const writerPath = skillFile('novel-design', 'agents/作家评审.md')
    const readerPath = skillFile('novel-design', 'agents/读者评审.md')
    const researcherPath = skillFile('novel-forage', 'agents/采风检索.md')
    for (const p of [writerPath, readerPath, researcherPath]) {
      expect(fs.existsSync(p), `${p} 应存在`).toBe(true)
    }
    const writer = fs.readFileSync(writerPath, 'utf8')
    const reader = fs.readFileSync(readerPath, 'utf8')
    const researcher = fs.readFileSync(researcherPath, 'utf8')
    expect(writer).toContain('name: writer-reviewer')
    expect(reader).toContain('name: reader-reviewer')
    expect(researcher).toContain('name: researcher')
    // B. 作家评审：引证纪律（逐字引文）＋对象-判据路由（04_故事剧情/05_卷纲 相关节）＋根因三选一＋待采风标记＋首评声明
    expect(writer).toContain('逐字引文')
    expect(writer).toContain('大纲-主线与骨架')
    expect(writer).toContain('卷纲-节奏与高潮')
    expect(writer).toContain('§4.15')
    expect(writer).toContain('§5.1')
    for (const root of ['设定根源', '主线根源', '规格根源']) {
      expect(writer, `作家评审根因三选一应含「${root}」`).toContain(root)
    }
    expect(writer).toContain('【待采风：查询词】')
    //（04 评审台账批：首评声明升级为「首评默认＋增量复评」——旧「只做首评」退役）
    expect(writer).toContain('首评默认')
    expect(writer).toContain('增量复评')
    expect(writer).toContain('书房/评审/')
    // C. 读者评审：弃书点预测＋雷点清单逐类＋读者语言/判据双要求＋画像来源
    expect(reader).toContain('弃书点预测')
    expect(reader).toContain('雷点清单')
    expect(reader).toContain('结论说人话、判据走格式')
    expect(reader).toContain('读者画像')
    expect(reader).toContain('§5.4')
    //（04 评审台账批：首评声明升级为「首评默认＋增量复评」——旧「只做首评」退役）
    expect(reader).toContain('首评默认')
    expect(reader).toContain('增量复评')
    // D. 采风代理：两源顺序（0.0.58 起素材库＋网络，知识库源退役）＋孤证＋永不存原文＋热梗半衰期例外＋只写暂存＋站点经验
    expect(researcher).toContain('两源')
    expect(researcher).toContain('孤证')
    expect(researcher).toContain('永不存原文')
    expect(researcher).toContain('半衰期')
    expect(researcher).toContain('热梗例外')
    expect(researcher).toContain('_待裁决_采风_')
    expect(researcher).toContain('_采风站点经验')
    expect(researcher).toContain('只采国内源')
    // E. design SKILL 接线：确认前审查（0.0.51 起两席评审并入其第三部分）＋书房/评审/＋待采风转《素材库与采风》
    const design = readSkill('novel-design')
    expect(design).toContain('**确认前审查**')
    expect(design).toContain('③**两席评审的发现项（可选）**')
    expect(design).toContain('书房/评审/')
    expect(design).toContain('【待采风：查询词】')
    //（T4 编辑席实装批：评审两席→三席；0.0.48 写作范围清理：编辑席并入作家席，回到两席——断言随裁同步）
    expect(design).toContain('两席独立互不通气')
    expect(design).toContain('评审不是新门禁')
    expect(design).toContain('[作家评审](agents/作家评审.md)')
    expect(design).toContain('[读者评审](agents/读者评审.md)')
    expect(design, '旧「确认前评审（可选）」节名应随确认前审查合并退役').not.toContain('确认前评审（可选）')
    // F. forage SKILL：灵感库八部（0.0.58 素材库批十类→八部重排）＋一部一册＋池库分工＋暂存与归档纪律＋Off-limits 放行采风 agent
    const forage = readSkill('novel-forage')
    for (const cat of ['人', '地', '物', '事', '知', '言', '象', '镜']) {
      expect(forage, `灵感库应含「${cat}」部`).toContain(`\`${cat}/\``)
    }
    expect(forage).toContain('一部一册')
    expect(forage).toContain('两库互不合并')
    expect(forage).toContain('_待裁决_采风_')
    expect(forage).toContain('[采风检索](agents/采风检索.md)')
    expect(forage).toContain('除采风检索')
    // G. 注册单源：artifact-contract 登记三份 agents（pack-check 按 referenceDocs 校验打包面）
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    for (const rel of [
      'skills/novel-design/agents/作家评审.md',
      'skills/novel-design/agents/读者评审.md',
      'skills/novel-forage/agents/采风检索.md',
    ]) {
      expect(contract, `artifact-contract 应登记 ${rel}`).toContain(`'${rel}'`)
    }
  })

  it('0.0.15 认知调研批：写作心智四改＋章型简章＋段级刷新＋人物自决类轻量通道', () => {
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
    // B. 章型双轴三文件同步：判据词在 outline SKILL；简章细则在规格模板；十查放宽在写前十查底本
    const outline = readSkill('novel-outline')
    expect(outline).toContain('章型双轴')
    for (const kw of ['关键', '过渡', '简章', '卷首', '卷内高潮', '心动位', '换图', '卷末兑现', '主战层级']) {
      expect(outline, `章型双轴判据应含「${kw}」`).toContain(kw)
    }
    expect(outline).toContain('简章口径')
    expect(outline).toContain('确认协议不变')
    expect(outline).toContain('⑧隔章')
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
    // C. 段级刷新（0.0.52 幕纲批：段级刷新退役，改幕末结算——旧「滚动窗口段级刷新」「卷内段级滚窗」措辞清零，钉新文本）
    expect(outline, '0.0.52 幕纲批：旧「滚动窗口段级刷新」措辞应清零').not.toContain('滚动窗口段级刷新')
    expect(outline).toContain('幕末结算与卷纲偏差分档')
    expect(outline).toContain('不是每章滚一次')
    expect(outline).toContain('novel_roll_window')
    const design = readSkill('novel-design')
    expect(design, '0.0.52 幕纲批：旧「卷内段级滚窗」措辞应清零').not.toContain('卷内段级滚窗')
    expect(design).toContain('段级刷新改幕末结算')
    expect(design).toContain('不是每章滚一次')
    // D. 人物自决类轻量通道：勘误通道旁——单章行动/冲突字段、无下游承诺变更、不跑影响分析
    expect(outline).toContain('人物自决类')
    expect(outline).toContain('人物不会这么做')
    expect(outline).toContain('不跑影响分析')
    expect(outline).toContain('有下游影响时仍按下一行走影响分析前置呈报')
  })

  it('0.0.15 灵感库升级批：八类＋零件卡九列＋翻库三式三去向＋存量盘点＋红线两例外＋outline 双参照与补充来源', () => {
    //（0.0.58 素材库批：灵感库正文整体迁入 novel-forage，旧钉逐条改指新口径）
    // A. 八部在位（0.0.58 十类→八部重排）＋古词三子标＋建库初始化
    const forage = readSkill('novel-forage')
    for (const cat of ['人', '地', '物', '事', '知', '言', '象', '镜']) {
      expect(forage, `灵感库应含「${cat}」部`).toContain(`\`${cat}/\``)
    }
    for (const sub of ['诗词古文', '雅称谚典', '意象母题']) {
      expect(forage, `象部应含「${sub}」子标`).toContain(sub)
    }
    expect(forage).toContain('建库初始化')
    expect(forage).toContain('八个部子目录')
    // B. 零件卡十列（0.0.58 加时效列）：骨/魂显式两列＋化用启示＋已用于回写＋时效三态；「层级（骨/魂）」列退役防回退
    for (const col of ['关键词（2-4个）', '一句话（骨）', '为什么好（魂·原理一句）', '化用启示', '反例（何时不可信/不可用）', '已用于', '时效']) {
      expect(forage, `零件卡字段应含「${col}」列`).toContain(col)
    }
    expect(forage, '时效三态值式应在位').toContain('时效｜首发YYYY-MM-DD｜半衰期约N月')
    expect(forage, '时效三态值式应在位（年代锚）').toContain('年代锚｜流行于YYYY年代')
    expect(forage, '「层级（骨/魂）」列应退役（信息显式化为骨/魂两列）').not.toContain('层级（骨/魂）')
    expect(forage).toContain('消费后回写')
    // C. 翻库三式＋三去向＋过期软提示＋裁决交互＋池库互转＋拆书边界＋索引对账
    for (const way of ['按部翻', '按关键词 grep', '按场景需求问']) {
      expect(forage, `翻库三式应含「${way}」`).toContain(way)
    }
    for (const dest of ['入材料包', '固化进人物档案', '激发新点子入灵感池']) {
      expect(forage, `翻库三去向应含「${dest}」`).toContain(dest)
    }
    expect(forage).toContain('已过半衰期')
    expect(forage).toContain('建议复核')
    expect(forage).toContain('入/弃/改道')
    expect(forage).toContain('池库互转')
    expect(forage).toContain('有原文＝拆书机制卡')
    expect(forage).toContain('最近更新')
    expect(forage).toContain('计数对账')
    // D. researcher 底本（novel-forage/agents）：八部路由＋触发源⑤存量盘点＋红线两例外＋参考书去重（可选）
    const researcher = fs.readFileSync(skillFile('novel-forage', 'agents/采风检索.md'), 'utf8')
    expect(researcher).toContain('八部')
    expect(researcher).toContain('存量盘点')
    expect(researcher).toContain('跳过网络源')
    expect(researcher).toContain('公有领域语料（诗词古文/雅称谚典）逐字入库合法')
    expect(researcher).toContain('单句例证 ≤1 句且必标出处')
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
    const vol = fs.readFileSync(skillFile('novel-arcplan', 'templates/卷纲固定段规格.md'), 'utf8')
    const scale = fs.readFileSync(skillFile('novel-design', 'references/参考标尺.md'), 'utf8')
    const ladder = fs.readFileSync(skillFile('novel-design', 'templates/对手梯队子表规格.md'), 'utf8')
    const sect = fs.readFileSync(skillFile('novel-outline', 'templates/章细纲固定小节规格.md'), 'utf8')
    const researcher = fs.readFileSync(skillFile('novel-forage', 'agents/采风检索.md'), 'utf8')
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
    expect(readSkill('novel-arcplan'), '0.0.56 边界重划：结构类型行随卷规划移入 arcplan').toContain('结构类型行')
    // 5. 升级间隔：压力升级检查第⑤核对项＋标尺定性化（不再留【待校准】）
    expect(vol).toContain('本卷升级位')
    expect(vol).toContain('世界书/力量体系/')
    expect(readSkill('novel-arcplan'), '0.0.56 边界重划：五核对项随卷规划移入 arcplan').toContain('五核对项')
    expect(scale).toContain('升级间隔')
    expect(scale).not.toContain('【待校准】')
    expect(scale).toContain('卷内应有升级位')
    expect(scale).toContain('跨卷不宜空转')
    // 6. 对手梯队出场注记：出场密度＋情绪积累，留白合法
    expect(ladder).toContain('出场注记')
    expect(ladder).toContain('出场密度')
    expect(ladder).toContain('情绪积累')
    // 7. 角色出场频率预警（防神隐）：0.0.52 幕纲批起判据正文前移幕纲规格「备料自查」段（单源），outline 备料段只留核对指针
    const memoSpec16 = fs.readFileSync(skillFile('novel-arcplan', 'templates/幕纲固定段规格.md'), 'utf8')
    expect(memoSpec16).toContain('距上次出场')
    expect(memoSpec16).toContain('超 10 章未出场')
    expect(memoSpec16).toContain('防神隐预警')
    // 8. 采风红线对齐现实工具（F6/F7/F8）：新口径在位＋旧口径零命中防回退
    expect(researcher).toContain('国内域名优先，内容必须中文')
    expect(researcher).toContain('能进页时补核')
    expect(researcher).toContain('不同域名才计')
    expect(researcher, 'F6 旧含糊口径应退役').not.toContain('国内站与中文站方可入库')
    // 9. 判级保守默认＋简章安全行：拿不准按关键章＋核心节名含起止边界（0.0.18 F40 起简章核心节六→七，补前置条件核对结果）
    expect(outline).toContain('拿不准按 `关键`')
    expect(sect).toContain('七个')
    expect(sect).toContain('「起止边界」')
    expect(sect).toContain('至少保留承上行')
    // 10. 任务包输出要求对齐草稿契约八项：首稿四项之外的注明由流程补
    expect(drafting).toContain('来源快照')
    expect(drafting).toContain('保真风险')
    expect(drafting).toContain('由流程各阶段补')
    // 11.（0.0.50：作者层文风画像删除——防撞名断言随功能退役；drafting 改钉三样文风基准措辞）
    expect(drafting).toContain('文风基准')
    expect(drafting).toContain('本书记忆里的文风锚点条目')
    expect(settle).toContain('## 决策')
    // 12. POV 接力章合法态：序列写法（主 POV＋接力副 POV）
    expect(sect).toContain('序列写法')
    expect(sect).toContain('接力副 POV')
    // 13. 卷级情绪基调行
    expect(vol).toContain('情绪基调')
    expect(vol).toContain('溺水感')
    // 14.（0.0.50：章名风格原钉在画像手法层，画像删除后断言退役——章名风格属本书契约第五部调整，不再单设画像层）
    // 15. 旧取数速查已并入 §四 4.1 长度换算参考（不再保留题材算例）
    expect(scale).toContain('## 附：长度换算')
    expect(scale).not.toContain('200 万字·都市')
    // 16. 升级关系第四来源：三来源扩四
    expect(design).toContain('四来源之一')
    expect(design).toContain('同层内变')
  })

  it('灵感库扩展批：类别八→十＋生产通道三条＋起名翻库双册——命名词语/设定概念/三子标/日常暂存/类简称扩/防回退旧八类零命中', () => {
    //（0.0.58 素材库批：十类口径改八部，正文在 novel-forage；本组旧钉随迁并保留防回退负断言）
    const forage = readSkill('novel-forage')
    const inspiration = readSkill('novel-inspiration')
    const researcher = fs.readFileSync(skillFile('novel-forage', 'agents/采风检索.md'), 'utf8')
    // A. 八部在位（0.0.58 重排）：SKILL 建库初始化＋researcher 查询类型表同步
    for (const cat of ['人', '地', '物', '事', '知', '言', '象', '镜']) {
      expect(forage, `灵感库应含「${cat}」部`).toContain(`\`${cat}/\``)
      expect(researcher, `采风检索查询类型表应含「${cat}」部`).toContain(`（${cat}）`)
    }
    expect(forage).toContain('八个部子目录')
    // B. 言部命名三子标＋原理/反例口径＋知部设定概念边界句
    for (const sub of ['人名', '地名', '组织·器物·功法名']) {
      expect(forage, `言部应含「${sub}」子标`).toContain(sub)
    }
    for (const kw of ['罕见真实姓氏', '公有领域事实可逐字', '声韵搭配法', '人物气质与名字气质的匹配法', '构词法', '真实古地名雅称', '构词模式与用字库', '音韵/字形/联想原理', '拗口组合/歧义谐音/气质错配']) {
      expect(forage, `言部定义应含「${kw}」`).toContain(kw)
    }
    for (const kw of ['可跨书复用', '换个故事还能用', '池库分工不破']) {
      expect(forage, `知部设定概念边界句应含「${kw}」`).toContain(kw)
    }
    // 部总数 8 封顶（防碎片化原则句随八部重排）
    expect(forage).toContain('部总数 8 封顶')
    expect(forage).toContain('不开第九部')
    // C. 日常积累第三生产通道：三条明示＋日常暂存件＋来源口径＋不经采风代理
    expect(forage).toContain('生产通道三条')
    expect(forage).toContain('日常随手积累')
    expect(forage).toContain('_待裁决_日常_')
    expect(forage).toContain('日常积累·')
    expect(forage).toContain('作者口述出处')
    expect(forage).toContain('不经采风代理')
    // D. 部简称表（0.0.58 十值改八值）：枚举单源在采风 agent 底本，SKILL 指路不重述
    expect(researcher, '部简称枚举应为八值（单源在采风检索）').toContain('人/地/物/事/知/言/象/镜')
    expect(forage, 'SKILL 部简称枚举应指路单源').toContain('部简称八值〔人/地/物/事/知/言/象/镜〕与可信度四态枚举单源在 [采风检索](agents/采风检索.md)')
    // E. 起名翻库双册（0.0.58 八部重排后为 言/＋象/ 两册，取词句在 inspiration 七要素可选步、管法指 novel-forage）
    expect(inspiration).toContain('`言/`（命名构词）')
    expect(inspiration).toContain('`象/`（雅称谚典')
    expect(inspiration).toContain('两册零件卡取词')
    // F. 防回退：类别清单旧八类/十类表述零命中（forage 两文件）；inspiration 灵感库正文零命中（负钉）
    expect(forage, '不应残留「八个类别」旧表述').not.toContain('八个类别')
    expect(forage, '不应残留「八类」旧表述').not.toContain('八类')
    expect(forage, '不应残留「十个类别」旧表述').not.toContain('十个类别')
    expect(researcher, '不应残留「八类」旧表述').not.toContain('八类')
    expect(inspiration, 'inspiration 不应残留灵感库正文（已拆出，只留指针）').not.toContain('一类一册')
    expect(inspiration).not.toContain('零件卡字段')
  })

  it('0.0.17 种子随包批：种子落位（八册零件卡＋索引）＋初始化全量展开＋库已存在不动＋残缺补拷＋注册单源', () => {
    //（0.0.58 素材库批：种子随技能迁入 novel-forage 并八部重排——地/物/事为空册（子标先立、行待采）；
    //    只断结构性事实与宽松下限，不硬编码总数——种子将来升级不应红测试）
    const seedDir = skillFile('novel-forage', 'assets/灵感库种子')
    const indexPath = path.join(seedDir, '索引.md')
    expect(fs.existsSync(indexPath), 'assets/灵感库种子/索引.md 应存在').toBe(true)
    const index = fs.readFileSync(indexPath, 'utf8')
    for (const part of ['人', '地', '物', '事', '知', '言', '象', '镜']) {
      expect(index, `种子索引应含「${part}」部行`).toContain(`| ${part} |`)
    }
    const cards = fs.readdirSync(seedDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => path.join(seedDir, e.name, '零件卡.md'))
    expect(cards.length, '种子零件卡册数宽松下限 ≥8（八部各一册）').toBeGreaterThanOrEqual(8)
    let rows = 0
    for (const p of cards) {
      expect(fs.existsSync(p), `${p} 应存在`).toBe(true)
      rows += (fs.readFileSync(p, 'utf8').match(/^\| \S+-\d{8}-\d{2} \|/gm) ?? []).length
    }
    expect(rows, '种子零件总数宽松下限 ≥100（不硬编码当前总数）').toBeGreaterThanOrEqual(100)
    // B. 初始化改种子展开：forage SKILL 措辞（种子路径/全量展开/库已存在则不动/残缺仅补拷不覆盖）
    const forage = readSkill('novel-forage')
    expect(forage).toContain('assets/灵感库种子')
    expect(forage).toContain('全量展开')
    expect(forage).toContain('起步 131 条')
    expect(forage).toContain('采集说明随册保留')
    expect(forage).toContain('库已存在则不动')
    expect(forage).toContain('不合并不覆盖')
    expect(forage).toContain('仅补拷库中缺失且种子中存在的件')
    expect(forage).toContain('不覆盖库中已有件')
    // C. 注册单源：artifact-contract 登记种子（打包面精确等值断言由 pack-check 另守——skills/ 下 .md 缺一即红）
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    expect(contract).toContain("['人', '地', '物', '事', '知', '言', '象', '镜']")
    expect(contract).toContain("'skills/novel-forage/assets/灵感库种子/索引.md'")
  })

  it('0.0.18 修复批：关键章两档＋浮动语义钉死与现状注记＋第四形态＋自评行落位＋⑧隔章定义＋简章七节＋数值建议句＋种子与沙盘逐字一致', () => {
    const outline = readSkill('novel-outline')
    const design = readSkill('novel-design')
    const drafting = readSkill('novel-drafting')
    const review = readSkill('novel-review')
    const checks = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
    const sect = fs.readFileSync(skillFile('novel-outline', 'templates/章细纲固定小节规格.md'), 'utf8')
    // F34 关键章枚举两新档：档词＋判据源（SKILL 枚举与底本③同步——到期命中即关键章定级）
    expect(outline).toContain('段内（章组）高潮')
    expect(outline).toContain('伏笔到期兑现')
    expect(outline, '章组高潮章判据源应指幕纲层（卷纲层无章组）').toContain('幕纲「章组排布」段点名的章组')
    expect(checks).toContain('伏笔/线索到期兑现章')
    // F35 浮动语义钉死：各档独立（过渡档允许低于主区间下限＝下浮即其用途、高潮档允许高于主上限）
    expect(design).toContain('各档独立：过渡档允许低于主区间下限（下浮即其用途）、高潮档允许高于主上限')
    // F36 目标句＋现状注记成对出现（design/review 同步——core 契约解析器接受浮动行落地前，脚本遇浮动行报配置错误）
    for (const t of [design, review]) {
      expect(t).toContain('全带核对')
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
    expect(outline).toContain('放宽口径见 [写前十查](agents/写前十查.md) 章型放宽节')
    // F40 简章核心节七节：前置条件核对结果一句话版入简章（SKILL＋规格同步）
    expect(sect).toContain('七个')
    for (const kw of ['视角与焦点', '信息边界', '情绪与节奏目标', '起止边界', '前置条件核对结果', '冲突与爽点', '章末双钩']) {
      expect(sect, `简章核心节应含「${kw}」`).toContain(kw)
    }
    expect(sect).toContain('无前置条件')
    expect(outline, '简章口径应指向规格单源').toContain('「简章」节')
    expect(sect, '规格文件应有「一句话版」口径').toContain('一句话版')
    // F42 种子与沙盘逐字一致：（0.0.58 素材库批退役——种子八部重排＋十列追加后与沙盘不再逐字一致，
    //    沙盘同步属仓外档案维护，不设仓内断言；沙盘在仓外路径经 ABZU_SEED_SANDBOX 注入的历史口径一并废止）
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
    expect(settle, '锚点段问句应在位').toContain('挑一段满意的收进文风锚点吗')
    expect(settle, '锚点问应限定前五章（0.0.50 由首章扩到前五章）').toContain('本书前五章（第 1–5 章）定稿呈报时各问一次')
    expect(settle, '五问之后改作者点名').toContain('之后作者主动点名时再收')
  })

  it('0.0.19 审查修复批：共享测试 helper', () => {
    // 共享测试 helper：文件存在且两 spec 均导入（防回退回各自副本）
    expect(fs.existsSync(path.join(__dirname, 'skill-test-helpers.ts')), 'tests/skill-test-helpers.ts 应存在').toBe(true)
    expect(fs.readFileSync(path.join(__dirname, 'skills-batches.spec.ts'), 'utf8')).toContain("from './skill-test-helpers'")
    expect(fs.readFileSync(path.join(__dirname, 'skills-core.spec.ts'), 'utf8')).toContain("from './skill-test-helpers'")
  })

  it('0.0.20 审查修复批：G 代价已结单源消歧＋严重程度双词表映射＋五核对项＋采风四态＋settle 已兑现', () => {
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
    // C. 五核对项（含本卷升级位）在技能层在位
    expect(readSkill('novel-arcplan'), '0.0.56 边界重划：五核对项技能层在 novel-arcplan').toContain('五核对项')
    // D. 采风可信度四态：表格四行（已证实/孤证/推测/归纳），三态标题不得回潮
    const researcher = fs.readFileSync(skillFile('novel-forage', 'agents/采风检索.md'), 'utf8')
    expect(researcher).toContain('可信度四态')
    expect(researcher, '三态标题不得回潮（表本就四行）').not.toContain('可信度三态')
    // F. settle 卷摘要候选读侧措辞与产品输出串对齐（已兑现并入）
    expect(readSkill('novel-arcplan'), '0.0.56 边界重划：卷摘要候选读侧句随卷末节移入 arcplan').toContain('账本已收/进行中/已兑现线索')
  })

  it('0.0.21 行文清晰度批：路径基准三式＋术语四处归一＋书名号违例修正＋序号对齐＋--校验 用法行＋ev 双名', () => {
    const director = readSkill('novel-director')
    const outline = readSkill('novel-outline')
    const drafting = readSkill('novel-drafting')
    const design = readSkill('novel-design')
    const settle = readSkill('novel-settle')
    const inspiration = readSkill('novel-inspiration')
    const researcher = fs.readFileSync(skillFile('novel-forage', 'agents/采风检索.md'), 'utf8')
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
    expect(design).toContain('<工作范围>/书房/开书/<书名>/种子底子.md')
    // A3. 构想快照孤例改裸书仓式（书仓根工件不带 <书仓>/ 前缀）
    expect(inspiration).toContain('| 构想快照 | `构想/构想快照.md` |')
    // A4. 规格模板判据位改包根语境式
    expect(sectSpec).toContain('本技能包 references/ 下章纲-*拆分件')
    // A5. 书名号违例四处修正后形态（书名号只用于书/文章名，技能包引用用链接式或技能包路径）
    expect(outline).toContain('按 [写前十查](agents/写前十查.md) 底本文末的高发雷点内联判据快扫')
    expect(settle).toContain('《细纲备料》技能包 agents/写前十查.md ④接钩预检的末行读取位')
    const clean = fs.readFileSync(skillFile('novel-polish', 'references/1-表达清理.md'), 'utf8')
    expect(clean).toContain('词表单源在审读 novel-review 技能包 SKILL「参考线速览表」')
    const reshape = fs.readFileSync(skillFile('novel-polish', 'references/2-节奏与重塑.md'), 'utf8')
    expect(reshape).toContain('总判据是本书文风基准（契约第五部调整＋本书锚点＋默认文风）')
    // A6. director 排障入口跨包定位句＋改稿章程加载名（全表唯一断点修复）
    expect(director).toContain('§4.x/§5.x＝《定调设计》技能包 references/ 下大纲-*与卷纲-*拆分件')
    expect(director).toContain('§6.x＝《细纲备料》技能包 references/ 下章纲-*拆分件（§6.7 在《章纲-信息与情绪》）')
    const charter = fs.readFileSync(skillFile('novel-revision', 'agents/改稿章程.md'), 'utf8')
    expect(charter).toContain('完整判据在《工作台总控》技能包 references/排障-索引与改稿流程.md')
    // B. 术语四处归一：新词在位
    expect(outline).toContain('确认细纲落真源')
    expect(checks).toContain('候选细纲落盘后')
    expect(sectSpec).toContain('候选细纲正文')
    expect(readSkill('novel-review')).toContain('**全量审读（默认）**')
    // B2.（0.0.50：文风类条目措辞随作者层删除改口——「记忆文风条目」退役）
    expect(outline).toContain('本书记忆有文风类条目时')
    expect(sectSpec).toContain('本书记忆有文风类条目时')
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
    // C. 序号＝部简称＋采集日期＋两位序（对齐零件卡字段定义，消数据漂移；0.0.58 类简称改部简称）
    expect(researcher).toContain('序号＝部简称＋采集日期＋两位序（同日顺延）')
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
  })

  it('0.0.22 简称清理批：独立「标尺」全称化（取数算式行/模板/审读/参考标尺自指）＋类简称标识符保留', () => {
    const ladder = fs.readFileSync(skillFile('novel-design', 'templates/对手梯队子表规格.md'), 'utf8')
    const scale = fs.readFileSync(skillFile('novel-design', 'references/参考标尺.md'), 'utf8')
    // A. 取数算式行协议串全称化后在位，旧串清零
    expect(ladder).toContain('取数：参考标尺·<行 ID>')
    expect(ladder).not.toContain('取数：标尺·')
    // C. 参考标尺.md 内部自指全称化（未校准标注×2＋卡是法句＋校准流程；「下一轮校准」句随 0.0.48 校准计划节移出退役）
    //    （0.0.25 批裁定同步：每章字数行改 3500 基准后「卡是法参考标尺是默认」句废止，改钉新句「快节奏短章型须作者显式下调才可用」——作者裁定压过校准默认）
    expect(scale).toContain('快节奏档 2100–2500')
    expect(scale).not.toContain('该题材参考标尺未校准')
    expect(scale).not.toContain('待参考标尺校准流程定')
    expect(scale).toContain('## 附：长度换算')
    // D. 全 skills prose 独立「标尺」零命中（负向断言，排除参考标尺子串与 assets/）
    //    白名单两处豁免：标尺校准_六书.json＝仓库外校准产物文件名（文件名不改名）；
    //    KB 净版 人物设计-弧光与关系.md「存在本身就是标尺」＝弧光行比喻用法（非参考标尺简称），净版纪律只报告待作者裁定
    const skillsRoot = path.join(__dirname, '..', 'skills')
    const walkMd = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
      .flatMap((e) => (e.isDirectory() && e.name !== 'assets' ? walkMd(path.join(dir, e.name)) : [path.join(dir, e.name)]))
      .filter((p) => p.endsWith('.md'))
    for (const f of walkMd(skillsRoot)) {
      const text = fs.readFileSync(f, 'utf8')
        .split('标尺校准_六书.json').join('')
        .split('存在本身就是标尺').join('')
        // 票 07：「标尺使用日志.md」是固定工件名（专名），不算独立简称；其余仍须全称
        .split('标尺使用日志').join('')
      expect(text, `${path.relative(skillsRoot, f)}: 独立「标尺」应全称化为「参考标尺」`).not.toMatch(/(?<!参考)标尺/)
    }
    // E. 类简称表＝序号前缀标识符协议（0.0.36 改指路单源；0.0.58 素材库批：十值改八值、单源随迁 novel-forage）
    expect(readSkill('novel-forage')).toContain('部简称八值〔人/地/物/事/知/言/象/镜〕与可信度四态枚举单源在 [采风检索](agents/采风检索.md)')
    const researcher = fs.readFileSync(skillFile('novel-forage', 'agents/采风检索.md'), 'utf8')
    expect(researcher).toContain('部简称＝人/地/物/事/知/言/象/镜')
    expect(researcher).toContain('序号＝部简称＋采集日期＋两位序')
  })

  it('0.0.23 狗头军师吸收批：判据落点规则＋三处行为化示范＋发现项处置三列表＋评审主问题行', () => {
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
    for (const node of ['| 改稿 |', '| 细纲 |', '| 备料 |', '| 沉淀（账本更正） |', '| 作者裁决（主控动作，非返回节点） |']) {
      expect(review, `处置三列表应覆盖处置行「${node}」`).toContain(node)
    }
    // 0.0.54 润色后移：表达层行不再返回「润色」节点，改「留润色」纯处置批（由润色一并处理）
    expect(review, '表达层处置行应改「留润色」口径').toContain('改动说明写『留润色』（纯处置批），由润色一并处理')
    // E. 两席评审报告：主问题行（总评前）＋问题清单 ★ 标＋复评回归句；互指纪律不变
    const writer = fs.readFileSync(skillFile('novel-design', 'agents/作家评审.md'), 'utf8')
    for (const [label, text] of [['作家评审', writer], ['读者评审', reader]] as const) {
      expect(text, `${label}: 报告头主问题行应在位`).toContain('**主问题（仅一个）**：{全部发现')
      expect(text, `${label}: 主问题行应紧邻总评之前`).toMatch(/\*\*主问题（仅一个）\*\*：\{全部发现[^\n]*\}\n\n## 总评/)
      expect(text, `${label}: 问题清单 ★ 标规则在位`).toContain('# 列行首标 ★')
      expect(text, `${label}: 复评回归句在位`).toContain('复评优先回归主问题——主问题未解不改次要项结论')
      expect(text, `${label}: 两席互指纪律不变`).toContain('两席互不通气，各自独立出具')
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
    expect(checksTenQian, 'novel-outline/agents/写前十查.md ④接钩预检应是章末状态末行的消费位（0.0.54 起先读十查机械④行）').toContain('上一章章摘要末行')
    expect(checksTenQian).toContain('上一章定稿正文最后一段')
    // 对撞③ 七件文件名：settle SKILL 落盘七件列表 vs core/src/prepare/pack.ts 待定稿包七件逐字（强化既有 contains 级断言）
    const packLine = settle.split('\n').find((l) => l.includes('落盘七件到'))
    expect(packLine, 'novel-settle/SKILL.md 应有「落盘七件到」列表行').toBeDefined()
    const skillFiles = packLine!.slice(packLine!.indexOf('——') + 2).split('。')[0]!.split(' / ').map((s) => s.trim())
    expect(skillFiles.length, `七件文件名对撞：novel-settle/SKILL.md 列了 ${skillFiles.length} 件，packages/core/src/prepare/pack.ts 待定稿包七件为 ${待定稿包七件.length} 件`).toBe(待定稿包七件.length)
    for (const [i, name] of [...待定稿包七件].entries()) {
      expect(`${skillFiles[i]}.md`, `七件文件名对撞失败（第 ${i + 1} 件）：SKILL 侧 novel-settle/SKILL.md=「${skillFiles[i]}」 vs core 侧 packages/core/src/prepare/pack.ts=「${name}」`).toBe(name)
    }
    // 对撞④ 灵感库十列表头（0.0.58 加时效列）：novel-forage SKILL 零件卡字段行 vs assets 种子册表头行（基础名逐字逐序，带注列「一句话（骨）」全形逐字）
    const forageSkill = readSkill('novel-forage')
    const fieldLine = forageSkill.split('\n').find((l) => l.includes('**零件卡字段**'))
    expect(fieldLine, 'novel-forage/SKILL.md 应有「**零件卡字段**」行').toBeDefined()
    const baseName = (s: string): string => s.replace(/（[^）]*）/g, '').trim()
    const skillCols = fieldLine!.slice(fieldLine!.indexOf('：`') + 2).split('`')[0]!.split('｜').map(baseName)
    const seed = fs.readFileSync(skillFile('novel-forage', 'assets/灵感库种子/人/零件卡.md'), 'utf8')
    const headerRow = seed.split('\n').find((l) => l.startsWith('| 序号'))
    expect(headerRow, 'assets/灵感库种子/人/零件卡.md 应有表头行（| 序号 …）').toBeDefined()
    const seedCols = headerRow!.split('|').slice(1, -1).map((c) => baseName(c.trim()))
    expect(skillCols.length, `灵感库表头对撞：novel-forage/SKILL.md 列了 ${skillCols.length} 列，assets 种子册表头为 ${seedCols.length} 列`).toBe(seedCols.length)
    expect(seedCols.length, '灵感库表头对撞：assets 种子册表头应为十列（0.0.58 加时效）').toBe(10)
    for (const [i, name] of seedCols.entries()) {
      expect(skillCols[i], `灵感库表头对撞失败（第 ${i + 1} 列）：SKILL 侧 novel-forage/SKILL.md=「${skillCols[i]}」 vs 种子侧 assets/灵感库种子/人/零件卡.md=「${name}」`).toBe(name)
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
      // 0.0.54 润色后移：表达层行改「留润色」纯处置批（主控记处置、由润色一并处理），同为非返回节点行
      if (action.includes('主控动作') || action.includes('留润色')) { controllerRows += 1; continue }
      expect(nodeEnum, `三列表动作列对撞失败：「${action}」不在 agents/全量审读.md 建议返回节点枚举 ${JSON.stringify(nodeEnum)} 内`).toContain(action)
    }
    expect(controllerRows, '三列表对撞：主控动作/留润色行应恰两行（作者裁决＋0.0.54 表达层留润色），且须带非返回节点标注').toBe(2)
    expect(reviewSkill.slice(tableStart, tableEnd), '三列表对撞：主控动作行的停止条件应引用步骤 6 六值单源（无法判断不算；0.0.30 枚举加已转提案）').toContain('六值之一')
  })

  it('0.0.24 反推落地首批：钩型配比两层制＋双钩三列＋调剂行＋升级四件＋悼亡法双挂＋定格问号＋信息边界判据＋篇幅双模式', () => {
    // A1 标尺行：章节与卷节奏参照「章末钩型配比」两层制——硬红线/参考区间/双书实测数（诡秘 62、大奉约 78，泄压 6.4%/5%——出处两书报告，区间并陈不平均）
    const scale = fs.readFileSync(skillFile('novel-design', 'references/参考标尺.md'), 'utf8')
    // v3 裁定：章末钩型配比整行移出标尺，红线改内联在写前十查与审读红线件（两处都要在）
    expect(scale, '标尺不再有章末钩型配比行').not.toContain('章末钩型配比')
    const preWrite = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
    expect(preWrite).toContain('泄压钩只居高潮余波位，不得插在大战／高潮段内')
    expect(preWrite).toContain('**红线（任何篇幅都适用，踩线＝🔴 呈报）**')
    expect(preWrite).toContain('**配比区间（仅 ≥50 章窗口适用；单幕、单弧内不按区间判分）**')
    expect(preWrite).toContain('张力驱动档张力类 **60–80%**')
    expect(preWrite).toContain('情感驱动档张力类 **25–40%**')
    expect(preWrite).toContain('泄压类张力档 **≤10%**、情感档 **≤15%**')
    const reviewSkill = fs.readFileSync(skillFile('novel-review', 'SKILL.md'), 'utf8')
    expect(reviewSkill).toContain('危机钩兑现距钩章 **≤5 章**')
    // A1 判据①：章末双钩节三列口径（钩型｜承诺｜兑现章号）＋定格即问号（A3 协同技法）
    const sect = fs.readFileSync(skillFile('novel-outline', 'templates/章细纲固定小节规格.md'), 'utf8')
    expect(sect).toContain('**承诺列**＋**兑现章号列**')
    expect(sect).toContain('三列口径：钩型｜承诺（下章拿什么还）｜兑现章号')
    // v3 裁定反转：章级红线不再指路标尺（标尺已无该行），规格内联阈值
    expect(sect).toContain('**兑现红线（任何篇幅适用）**')
    expect(sect).toContain('危机钩（即时威胁型）兑现章号距钩章 ≤5 章')
    expect(sect).toContain('泄压钩只居高潮余波位，不插在大战／高潮段内')
    expect(sect).toContain('定格即问号——泄压与牵引兼得')
    expect(sect).toContain('信息释放分级')
    // A1 判据②：写前十查⑩兑现章号半句＋红线表内联
    const checks = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
    expect(checks).toContain('兑现章号是否踩红线（阈值见本节末红线表，跨弧钩登记到期章）')
    expect(checks).toContain('**红线（任何篇幅都适用，踩线＝🔴 呈报）**')
    expect(checks, 'v3：写前十查内联红线阈值').toContain('≤5 章')
    expect(checks).toContain('承诺列或兑现章号列缺失＝补写再呈')
    expect(checks).not.toContain('「章末钩型配比」行')
    // A4 调剂行：高潮后 2 章内必回低烈度＋三式＋与 §6.1 分工（防同规则双源）
    const vol = fs.readFileSync(skillFile('novel-arcplan', 'templates/卷纲固定段规格.md'), 'utf8')
    expect(vol).toContain('## 高潮后调剂（弧线段内固定核对行）')
    expect(vol).toContain('高潮章后 2 章内**必须**回低烈度')
    expect(vol).toContain('日常（生活线回稳）/喜剧（社交喜剧章）/清算（余债收拾）')
    expect(vol).toContain('全卷不连续三章及以上钝收')
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
    // A11 悼亡法双挂：备料自查（补埋窗口，0.0.52 幕纲批起判据正文前移到幕纲规格「备料自查」段、单源）＋写作卡死亡章判据（两处互指）
    const outline = readSkill('novel-outline')
    expect(outline, '0.0.52 幕纲批：备料段改指针＋一句核对').toContain('备料自查前移')
    expect(outline).toContain('幕纲里排的这一章要埋／要兑现的，细纲里有了吗')
    expect(outline).toContain('改已确认细纲走重入勘误通道')
    const memoSpec = fs.readFileSync(skillFile('novel-arcplan', 'templates/幕纲固定段规格.md'), 'utf8')
    expect(memoSpec, '0.0.52 幕纲批：五项自查判据单源应在幕纲规格').toContain('死亡预埋自查（悼亡法）')
    expect(memoSpec).toContain('死前 3 章内是否已埋 ≥2 处日常细节')
    expect(memoSpec).toContain('不等到死亡章才发现无物可收')
    expect(memoSpec).toContain('埋设决策发生在章纲层')
    const cards = fs.readFileSync(skillFile('novel-drafting', 'agents/写作卡.md'), 'utf8')
    expect(cards).toContain('本章写人物死亡时：回收死前埋设的日常细节至少一处')
    expect(cards).toContain('不给大段独白补设定')
    expect(cards).toContain('「死亡预埋自查」')
    // A3 信息边界两条：揭示 ≤70%＋末尾新问号＋钝·定格豁免（定格即问号协同）
    expect(sect).toContain('揭示量 ≤70%')
    expect(sect).toContain('章末留一个指向下层真相的新问号')
    expect(sect).toContain('钝·定格章豁免强问号')
    // P16 篇幅双模式：浮动式/恒定式＋内容承担节奏为纲（变更记录留痕断言随 0.0.48 移出运行时退役）
    expect(scale).toContain('浮动式与恒定式皆合法')
    expect(scale).toContain('章长归契约／起草／审读')
    expect(scale).toContain('章纲层不写死字数')
  })

  it('0.0.25 配给与台账批：信息释放台账三接线＋信息释放行＋钩型双轴＋调剂对连钝＋③伏笔/验证到期＋3500 基准＋单元配给', () => {
    // B3 信息释放台账：结构单源在 novel-design 建账行（书房路径＋揭示域清单＋登记行式＋状态枚举）；工件契约表加行
    const design = readSkill('novel-design')
    //（0.0.56 边界重划：台账建账段原文移入 novel-arcplan「卷规划」节——建账结构钉随迁；design 侧留路径 A 提及与工件契约行）
    const arcplan = readSkill('novel-arcplan')
    expect(design).toContain('信息释放台账建账')
    expect(arcplan).toContain('`<工作范围>/书房/信息释放/<书名>.md`')
    expect(arcplan).toContain('揭示域清单')
    expect(arcplan).toContain('未知/部分/已释')
    expect(arcplan).toContain('累计已释 x/y＝z%｜新问号一句')
    expect(arcplan).toContain('累计为信息行不作案据')
    expect(arcplan).toContain('本章可释集')
    expect(arcplan).toContain('力量体系条目同批')
    expect(design).toContain('| 信息释放台账 |')
    expect(design).toContain('种子底子先例')
    expect(arcplan).toContain('卷02 起不开新账')
    // 接线②：备料自查信息释放规划前移幕纲规格（0.0.52 幕纲批：判据正文单源在幕纲规格「备料自查」，outline 备料段只留核对指针）
    const outline = readSkill('novel-outline')
    expect(outline).toContain('备料自查前移')
    expect(outline).toContain('幕纲固定段规格.md「备料自查」')
    const memoSpec = fs.readFileSync(skillFile('novel-arcplan', 'templates/幕纲固定段规格.md'), 'utf8')
    expect(memoSpec).toContain('信息释放规划（读台账）')
    expect(memoSpec).toContain('「未建账」')
    expect(memoSpec).toContain('同一信息再次释放须换载体')
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
    // v3：双轴映射随钩型配比行移出标尺，改内联在写前十查（两轴枚举单源仍在规格）
    const preWrite = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
    expect(preWrite).toContain('张力类＝带威胁或期待供给的钩')
    expect(preWrite).toContain('泄压类＝功能动机轴为泄压的钩')
    expect(preWrite).toContain('日常·中性不参与张力／泄压计量')
    expect(checks).toContain('钩型：断点·危机｜承诺：…｜兑现章号：…')
    // M13 调剂对连钝：相连钝收＝调剂组成部分，红线按章整体烈度判
    const vol = fs.readFileSync(skillFile('novel-arcplan', 'templates/卷纲固定段规格.md'), 'utf8')
    expect(vol).toContain('调剂对（高潮章＋调剂章）相连钝收＝调剂的组成部分')
    expect(vol).toContain('不计入「连续钝收」红线')
    expect(vol).toContain('红线按章整体烈度判')
    // R4 ③扩词：伏笔/验证到期——核对对象加力量体系升级节点验证窗口与排期（双记位兜底）；0.0.52 幕纲批判据正文移入幕纲规格「备料自查」段（单源）
    expect(checks).toContain('**伏笔/验证到期**')
    expect(checks).toContain('验证 ≤3 章窗口与本书落砣排期')
    expect(checks).toContain('近期窗口条目＋账本双记位漏写时本查兜底')
    expect(memoSpec).toContain('**验证到期自查**')
    expect(memoSpec).toContain('近期窗口条目＋`账本/线索.md`')
    // 字数 3500 基准：标尺行＋design 示例新数值＋outline 分配重心改相对比例（不内联章长字数）
    const scale = fs.readFileSync(skillFile('novel-design', 'references/参考标尺.md'), 'utf8')
    expect(scale).toContain('基准 3500–4500 字')
    expect(scale).toContain('快节奏档 2100–2500')
    expect(scale).toContain('长章档 5500+')
    expect(scale).toContain('章纲层不写死字数')
    expect(design).toContain('- 目标汉字数: 4000')
    expect(design).toContain('- 下限汉字数: 3500')
    expect(design).toContain('- 上限汉字数: 4500')
    expect(design).not.toContain('- 目标汉字数: 2000')
    expect(outline).toContain('按本章重心分配')
    expect(outline).toContain('不取章长档、不锁段比')
    expect(outline, '章纲不直接引用章长标尺 L2-A4-01（票 06 去标尺化）').not.toContain('L2-A4-01')
    expect(outline).toContain('是分配重心例，不是固定比例或结构')
    expect(outline).not.toContain('四千字示例')
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
    // v3 裁定：红线不进参考标尺，改由派发材料的章级执行红线件承担
    expect(sweepReview).toContain('照派发材料的章级执行红线件')
    expect(sweepReview, '审读底本不应重述危机钩阈值数值').not.toContain('危机类 ≤5 章')
    expect(sweepReview).toContain('承诺兑现')
    // R4② 卷纲调剂行补 A4 两判据（大战/高潮段禁泄压钩插入；大战前可排纯喜剧章作蓄压调剂）
    expect(vol).toContain('大战/高潮段禁泄压钩插入')
    expect(vol).toContain('大战前可排纯喜剧章作蓄压调剂')
    // R2 写前十查信息释放行同步本章口径句（0.0.44 审查批：判据全文收成规格指针，句面钉随裁）
    expect(checks).toContain('判据全文——含终卷收束豁免／钝·定格豁免／新问号核对——见')
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
  })

  it('06 章纲去标尺化：章纲不引章长标尺，字数归契约/起草/审读，按幕分批仍作生产参数', () => {
    const outline = readSkill('novel-outline')
    const sect = fs.readFileSync(skillFile('novel-outline', 'templates/章细纲固定小节规格.md'), 'utf8')
    const checks = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
    const drafting = readSkill('novel-drafting')
    // A. 章纲不直接引用章长标尺行（L2-A4-01）——章长归契约/起草/审读
    expect(outline, '章纲不得引用 L2-A4-01 章长行').not.toContain('L2-A4-01')
    expect(outline, '章纲不得转述「每章字数」行').not.toContain('每章字数')
    expect(outline, '章长不按参考标尺取数').toContain('章长不按参考标尺取数')
    // B. 章纲只继承三源：幕纲／契约字数带／账本承诺与信息边界
    expect(outline).toContain('章纲只继承幕纲、契约字数带、账本承诺/信息边界')
    expect(outline).toContain('字数核验在起草／审读')
    // C. L2-A4-06 按幕分批仍作生产参数（标尺只到幕纲，分批阈值仍取该行）
    expect(outline).toContain('「L2-A4-06 幕内分批出细纲」行')
    // D. 可选预期字数保留为规划辅助，不是门禁；实际核验在起草/审读
    expect(sect).toContain('规划辅助，不是门禁')
    expect(sect).toContain('实际字数核验在《正文起草》核验字数脚本与《全面审读》')
    expect(checks).toContain('规划辅助，不是章长门禁')
    // E. 起草侧：契约字数带＋核验脚本在位（行为不变）
    expect(drafting).toContain('篇幅继承契约“章节篇幅”字数带')
    expect(drafting).toContain('scripts/核验字数.mjs')
    expect(drafting).toContain('契约字数带仍由审读阶段确定性脚本复核')
    // F. 章纲不内联章长数值（单源仍在参考标尺与契约）
    expect(outline, '章纲不写死字数区间').not.toMatch(/[0-9]+\s*[-–~]\s*[0-9]+\s*字/)
  })

  it('0.0.26 标尺 v0.5 五书校准批：驱动类型分带＋新四行＋五题材修正＋末卷扩＋v0.5 变更', () => {
    const scale = fs.readFileSync(skillFile('novel-design', 'references/参考标尺.md'), 'utf8')
    // 1. v3 裁定：钩型配比行整行移出标尺，驱动分带口径改内联在写前十查
    const preWrite = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
    expect(scale, '标尺不再有章末钩型配比行').not.toContain('章末钩型配比')
    expect(preWrite).toContain('张力驱动档张力类 **60–80%**')
    expect(preWrite).toContain('情感驱动档张力类 **25–40%**')
    expect(preWrite).toContain('泄压类张力档 **≤10%**、情感档 **≤15%**')
    expect(preWrite).toContain('情感重场可替代张力钩')
    expect(preWrite).toContain('情感档 **≤15%**')
    expect(scale, '标尺无钩型配比行').not.toContain('分带不改')
    // 2. 冲突②裁决：大爽点三口径分驱
    expect(scale).toContain('张力驱动：每 15 章（约 5–7 万字）')
    expect(scale).toContain('间隔容忍至 25–30 万字')
    expect(scale).toContain('大会战间隔 75–100 章')
    // 3. 冲突③④裁决：首高潮分档＋末卷弹性扩
    expect(scale).toContain('前置至 ≤2 万字')
    expect(scale).toContain('情感慢热档可延至约 25 万字位')
    expect(scale).toContain('战役极端慢热档 50 万字位')
    expect(scale).toContain('终卷收束期 60–110 万字')
    expect(scale).toContain('卷体量约 3.5 倍为常态参考')
    expect(scale).toContain('非终卷不得套用')
    // 4. 四行按 v3 口径钉行 ID（样本标注与自证已整组退役）
    const rowText = (id: string) => {
      const line = scale.split('\n').find((l) => l.startsWith(`| ${id} |`))
      expect(line, `参考标尺应有 ${id} 行`).toBeDefined()
      return line!
    }
    expect(rowText('L2-A4-03')).toContain('颁布→战术→执行意外→翻解→结算→间歇')
    expect(rowText('L2-A4-03')).toContain('起手 2–9 章，中后期可至 30–60 章')
    expect(rowText('L2-A2-01')).toContain('完结期常态 +19%–34%')
    expect(rowText('L2-A1-04')).toContain('核心真相置倒数 5%')
    expect(rowText('L2-A1-04')).toContain('悬疑型信息:期待型信息约 7:3')
    expect(rowText('L2-A1-04')).toContain('信息释放台账的方法论母行')
    // 5. 反派分层与人物计数口径（v3 行 ID 定位）
    expect(rowText('L1-07')).toContain('终局层允许非人格化承担者')
    expect(rowText('L2-A6-01')).toContain('8–10')
    expect(rowText('L1-06')).toContain('情感线可计第二主线')
    // 6. 冲突⑦裁决：三线断档互为替身豁免
    expect(rowText('L2-A5-01')).toContain('双分身互补在场时按线族合计')
    expect(rowText('L2-A5-01')).toContain('默认值可调')
    // 7. 外挂包已移除：不再保留题材包/题材修正表
    expect(scale).not.toContain('题材包')
    expect(scale).not.toContain('题材修正')
    expect(scale).not.toContain('都市情感（都市子档）')
    expect(scale).not.toContain('历史（历史穿越）')
    expect(scale).toContain('## 附：长度换算')
    // 8. 每章字数三档锚点（3500 基准不动）
    expect(rowText('L2-A4-01')).toContain('基准 3500–4500 字')
    expect(rowText('L2-A4-01')).toContain('快节奏档 2100–2500')
    expect(rowText('L2-A4-01')).toContain('章纲层不写死字数')
  })

  it('0.0.26 流程首波批：局规则条目模板＋史实基线资产位＋情感主线槽位族＋台账扩列＋伏笔账本升级', () => {
    const design = readSkill('novel-design')
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
    const vol = fs.readFileSync(skillFile('novel-arcplan', 'templates/卷纲固定段规格.md'), 'utf8')
    expect(vol).toContain('## 情感线节拍（弧线段内可选行）')
    expect(vol).toContain('误会-和解循环周期 {N-M 章}')
    expect(vol).toContain('情感重场：{章组}')
    expect(vol).toContain('参考 10-15 章，大周期以事件弧计')
    expect(vol).toContain('不因情绪类豁免调剂')
    // 上下文升级：台账清单扩「载体」「知情圈」两列——（0.0.56 边界重划：建账段单源随卷规划移入 novel-arcplan；outline 备料消费＋settle 更新同步不动）
    const arcplan26 = readSkill('novel-arcplan')
    expect(arcplan26).toContain('载体｜知情圈｜释放章')
    expect(arcplan26).toContain('同一信息再次释放须换载体（日记/对话/通灵/古迹式为参照，自报载体亦可）')
    expect(arcplan26).toContain('知情圈＝哪些角色已知（角色间信息差')
    const memoSpec2 = fs.readFileSync(skillFile('novel-arcplan', 'templates/幕纲固定段规格.md'), 'utf8')
    expect(memoSpec2, '0.0.52 幕纲批：信息释放规划判据前移幕纲规格「备料自查」段').toContain('同一信息再次释放须换载体（对照清单「载体」列）')
    expect(memoSpec2).toContain('对照「知情圈」列——谁知道谁不知道')
    expect(settle).toContain('实际载体与知情圈变化随同次更新（「载体」/「知情圈」列）')
    // N6 伏笔账本升级：沉淀对账线索行式扩口径＋保温强化＋对账方法第 6 条；outline 备料保温自查接线
    const reconcile = fs.readFileSync(skillFile('novel-settle', 'agents/沉淀对账.md'), 'utf8')
    expect(reconcile).toContain('- 口径：事件型 | 关系型')
    expect(reconcile).toContain('- 保温强化：第NNNN章 | 无')
    expect(reconcile).toContain('兑现前必有强化触点')
    expect(reconcile).toContain('无强化触点就兑现的列入对账差异呈报，不默默收线')
    expect(memoSpec2, '0.0.52 幕纲批：伏笔保温自查判据正文移入幕纲规格「备料自查」段').toContain('**伏笔保温自查**')
    expect(memoSpec2).toContain('对照 `账本/线索.md` 该条的保温强化行')
    expect(memoSpec2).toContain('先在本章或邻章排一次闲笔式强化触点再兑现')
    // 注册单源：artifact-contract 登记局规则条目模板（经名字数组拼路径——完整数组断言在 0.0.14 模板拆出批 D 节，本组钉数组含「局规则」）
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    //（0.0.51 开书流程批：数组尾随「世界常量」）
    expect(contract).toContain("', '地图', '局规则', '世界常量']")
  })

  it('0.0.26 独立审查修复批：C1/C2 口径修正＋R1-R4 必修＋O1-O2＋Nit——卷体量 3.5 倍口径/情感档 25-40/前传 4-83/泄压出处改引/单元循环型枚举/7:3 标注/对话上限 0.45/口径注与区间收敛＋v0.5-F 留痕', () => {
    const scale = fs.readFileSync(skillFile('novel-design', 'references/参考标尺.md'), 'utf8')
    const vol = fs.readFileSync(skillFile('novel-arcplan', 'templates/卷纲固定段规格.md'), 'utf8')
    // C1 单卷体量行：口径收敛为连载卷/实体卷分列，不写死万字
    const volumeRow = scale.split('\n').find((l) => l.includes('| L2-A3-01 |'))
    expect(volumeRow, '参考标尺应有单卷体量行 L2-A3-01').toBeDefined()
    expect(volumeRow!).not.toContain('5.3 倍')
    expect(volumeRow!).toContain('卷口径先钉死')
    // C2 章长行三档在位，章长归契约/起草/审读
    const chapterRow = scale.split('\n').find((l) => l.includes('| L2-A4-01 |'))
    expect(chapterRow, '参考标尺应有每章字数行 L2-A4-01').toBeDefined()
    expect(chapterRow!).not.toContain('25-50')
    expect(chapterRow!).toContain('章长归契约／起草／审读')
    // R3 卷纲结构类型枚举补单元循环型（枚举单源在模板）
    expect(vol).toContain('单元循环型（单元六段循环：颁布→战术→执行意外→翻解→结算→间歇')
    expect(vol).toContain('节拍口径见《定调设计》技能包 references/参考标尺.md 节奏基准「单元循环节拍」行，该行在本类型选中时生效')
    expect(scale).toContain('结构型选单元循环时生效')
    // O1 历史行对话占比上限随外挂包移除（不再作为题材修正值）
    expect(scale).not.toContain('对话占比上限 0.45')
    // v3：标尺不再带样本编号与逐行自证，支线双口径保留
    expect(scale).toContain('只保留结论，不逐行自证')
    expect(scale).toContain('4＝在用支线口径，含 1 弃线则 5–6')
  })

  it('0.0.27 文笔专项批：散文卡组七卡＋行文自查三 AI 味判据＋润色两密度定位＋版本纪律全套', () => {
    // A. 散文卡组：组节在位（不走场景挑选/整组带/场景卡优先三纪律）＋卡头与理论出处标注（0.0.31 起七卡→八卡——修辞上探卡入组）
    const cards = fs.readFileSync(skillFile('novel-drafting', 'agents/写作卡.md'), 'utf8')
    expect(cards).toContain('## 散文卡组（文笔层八卡，按索引读 1–2 张）')
    expect(cards).toContain('不走场景功能挑选')
    expect(cards).toContain('默认按 `写作卡-索引.md` 只读与本单元最相关的 1–2 张')
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
    // F. 版本纪律全套钉随当前版走——0.0.28 实测落地批起移入 0.0.28 组接力（本组原 0.0.27 钉同步退役；当前口径随版本走，见 0.0.19 组 A 注）
  })

  it('0.0.28 卷01 实测落地批：浮动档区间化＋画像卡组仲裁与长句配额＋前史隐喻行＋A 轴句＋格单源＋细则回写＋卷末契约三行＋画像名防漂移＋版本纪律全套', () => {
    const design = readSkill('novel-design')
    const review = readSkill('novel-review')
    const drafting = readSkill('novel-drafting')
    const settle = readSkill('novel-settle')
    const sect = fs.readFileSync(skillFile('novel-outline', 'templates/章细纲固定小节规格.md'), 'utf8')
    const power = fs.readFileSync(skillFile('novel-design', 'templates/世界书/力量体系条目模板.md'), 'utf8')
    const game = fs.readFileSync(skillFile('novel-design', 'templates/世界书/局规则条目模板.md'), 'utf8')
    const world = fs.readFileSync(skillFile('novel-design', 'templates/世界书/世界规则条目模板.md'), 'utf8')
    // A. F9 浮动档区间化：design 示例改区间式＋±12.5% 容差带（独立审查 R1——沙盘工作口径与 F9 建议句原值）＋单值式清零；三消费位档区间口径；F36 现状注记措辞同步（core 未实装注记保留）；R4 起草验收句补含容差带
    expect(design).toContain('章型浮动: 常规 3500-4500｜过渡 2800-3200｜高潮 4000-5500')
    expect(design).toContain('各档写「低-高」区间、各档给 ±12.5% 容差带')
    expect(review).toContain('容差带口径照《定调设计》章节篇幅节（单源）')
    expect(design).not.toContain('常规 3500｜过渡 2800｜高潮 4500')
    for (const t of [design, review, sect, drafting]) {
      expect(t, '浮动档四个消费位都应改档区间口径').toContain('档区间')
    }
    expect(design).toContain('由人工按档判')
    expect(drafting).toContain('浮动档区间（含容差带）判')
    expect(review).toContain('审读按本章章型的浮动档区间判差额')
    expect(review).toContain('core 契约解析器接受浮动行落地前，脚本遇浮动行报「配置错误」')
    expect(sect).toContain('目标带＝作品契约「章节篇幅」主区间')
    expect(sect).toContain('合计低于目标带下限＝细纲事件量不足')
    // B.（0.0.50：画像卡组仲裁句与长句配额行随首章文风建档门删除退役——文风立场单源默认文风、密度数值单源写作卡；负断言保留防回退）
    expect(drafting).not.toContain('每段至少一句')
    expect(drafting).not.toContain('试运行实证')
    // C. F3 前史隐喻行：力量体系条目模板金手指轨道位
    expect(power).toContain('前史隐喻：<能力与人物前史的呼应——能力形态即创伤/执念的具象')
    expect(power).toContain('无呼应留白，不硬造')
    // D. F14 A 轴句：章末双钩节——期待钩设计期排期＋S:A 配比参照（0.0.44 审查批：≈7:3 数值收成标尺行指针＋S/A 加注）
    expect(sect).toContain('期待钩（A 轴）在悬模式下应占双钩其一')
    expect(sect).toContain('S:A 配比见《定调设计》技能包 references/参考标尺.md「信息释放分级」行')
    expect(sect).toContain('期待钩靠设计期排期，不是写时顺手')
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
    // H. F19 卷末触发句＋契约三行（独立审查 C1——次序改先对账后摘要，对齐同节既有句与 F19 原文；
    //    0.0.52 幕纲批：段级刷新退役——触发句改三件一批、段级刷新行改「幕纲」行）
    //（0.0.56 边界重划：幕末结算与卷末两节移入 novel-arcplan，触发句与工件契约行钉随迁）
    const arcSettle = readSkill('novel-arcplan')
    expect(arcSettle).toContain('卷对账→卷摘要→下卷注意事项，三件一批')
    expect(arcSettle).toContain('| 卷摘要 | `故事剧情/卷规划/卷<NN>/卷摘要.md` |')
    expect(arcSettle).toContain('| 卷对账（卷级） | `<工作范围>/书房/卷末/<书名>/卷<NN>-卷对账.md` |')
    expect(arcSettle).toContain('| 幕纲 | `故事剧情/卷规划/卷NN/幕纲/幕NN-<幕名>.md` |')
    expect(settle, '0.0.52 幕纲批：段级刷新行应清零').not.toContain('| 段级刷新 |')
    // I.（0.0.50：文风画像条目随作者层删除，文件名防漂移断言退役；AI 痕迹行画像措辞改基准）
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
    expect(selfCheck).toContain('与本书文风基准〔契约第五部调整＋本书锚点〕冲突时基准优先')
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
    expect(review).toContain('只改顺序，内容不变')
    expect(review).toContain('卷级常量')
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
    // D.（0.0.50：作者层记忆模块 memory/author.ts 与 novel_record_memory 删除，记忆守卫断言随功能退役；
    //     本书记忆唯一写入路径是定稿沉淀，同名冲突由沉淀的「旧格式或未知条目冲突」守卫承接，见 core settlement/memory 测试）
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
    const skeletonCriteria = design.split('\n').find((l) => l.startsWith('   判据：读 [大纲-主线与骨架](references/大纲-主线与骨架.md)'))
    expect(skeletonCriteria, '骨架步骤 3 判据行应在位').toBeDefined()
    //（v2.4.2 阶段2 拆分：§2.5/§2.14/§2.17 所在整件《人物设计-弧光与关系》入判据行——断言随裁同步）
    expect(skeletonCriteria!, '骨架判据行应含 §2.5/§2.14/§2.17 所在件（人物设计-弧光与关系）').toContain('人物设计-弧光与关系')
    expect(design).toContain('**弧光三型**（全书大纲「主角目标与成长轨迹」部对谈时过一遍；判据 §2.5 主角成长弧怎么排）')
    expect(design).toContain('起点信念')
    expect(design).toContain('扁平坚守（核心信念从没变，存在本身就是标尺）')
    expect(design).toContain('**弧光落地两问**（全书大纲「人物弧线与关系发展」部对谈时过一遍；判据 §2.17 人物弧光怎么落地）')
    expect(design).toContain('把成长拿走这个故事还成立吗')
    expect(design).toContain('**核心关系矩阵**（全书大纲「人物弧线与关系发展」部对谈时过一遍；判据 §2.14 人物关系怎么织）')
    expect(design).toContain('主角/对手/导师/伙伴/镜像')
    expect(design).toContain('设计变化节点')
    expect(design).toContain('关系一动，剧情自己长')
    // B. 件3：力量体系模板境界表天花板行（§3.3——最高位谁在那里/够撑到末境吗/到顶新目标＋终局位阶锚互指）
    expect(power).toContain('- 天花板：<本体系当前最高位——谁在那里、为什么多数人到不了/到了会怎样')
    expect(power).toContain('够撑到全书最后一个境界吗')
    expect(power).toContain('到顶之后主角的新目标')
    expect(power).toContain('天花板即终局对手的位阶锚，与「对手梯队映射」终局行对照')
    // C. 件4：世界书步骤 2 判据行补 §2.7＋配角功能一问（八功能对号＋零功能砍或合并＋独立动机）
    const worldCriteria = design.split('\n').find((l) => l.startsWith('   判据：读 [人物设计-主角](references/人物设计-主角.md)'))
    expect(worldCriteria, '世界书步骤 2 判据行应在位').toBeDefined()
    expect(worldCriteria!, '世界书判据行应含 §2.7 所在件（配角与群像）').toContain('人物设计-配角与群像')
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
    // D. 件4 情绪词典：升级链＋张力三表现＋场景-感官通道对照（附.5 出处标注随 0.0.49 方法论冲突批移出运行时）
    expect(cards).toContain('直接说（低）→生理反应（中）→生理反应＋动作＋环境烘托（高）')
    expect(cards).toContain('压抑（越想忍越忍不住）')
    expect(cards).toContain('反差（表面平静内心翻江倒海）')
    expect(cards).toContain('递进（从一点点不舒服到彻底爆发）')
    expect(cards).toContain('打斗＝视觉＋听觉')
    expect(cards).toContain('密室＝触觉＋听觉＋嗅觉')
    expect(cards, '0.0.49 方法论冲突批：附录出处标注应移出运行时').not.toContain('〔知识库附录')
    // E. 件5 开场钩型：开场卡双节源＋黄金三百字三判据＋六钩型＋三低级错误＋SKILL 开场位半句与 §6.2 深挖位
    expect(cards).toContain('## 开场卡 ←§7.10＋§6.2')
    expect(cards).toContain('黄金三百字自查（首章与卷首章执行）')
    expect(cards).toContain('前三行进人')
    expect(cards).toContain('前 300 字立冲突')
    expect(cards, '开篇「前 1000 字给钩」两尺口径已随 0.0.44 方法论审查修复批删除（KB §6.2/§7.10 无此口径）').not.toContain('前 1000 字给钩')
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
    // G. 件7 悬空指针清零：0.0.49 方法论冲突批——附录指针与蒸馏来源标注全部移出运行时，references/ 任何行不得再出现附.N（novel-polish 的附.4 词表另批处理，不在遍历范围）
    const skillsDir = path.join(__dirname, '..', 'skills')
    for (const skill of ['novel-design', 'novel-outline', 'novel-drafting', 'novel-director']) {
      const refDir = path.join(skillsDir, skill, 'references')
      if (!fs.existsSync(refDir)) continue
      for (const f of fs.readdirSync(refDir).filter((n) => n.endsWith('.md'))) {
        for (const line of fs.readFileSync(path.join(refDir, f), 'utf8').split('\n')) {
          expect(line, `${skill}/references/${f} 不应残留附.N 指针或蒸馏来源标注`).not.toMatch(/附\.[0-9]/)
        }
      }
    }
    // H. 版本不升：批号 0.0.31 同版本 0.0.30 内追加——版本件零改动，版本纪律全套断言在 0.0.31 产品体验批组（0.0.31 版起接力）
  })

  it('0.0.31 产品体验批：浮动条款前置护栏', () => {
    // 浮动条款前置护栏：高级选项定位＋core 限制前置（护栏先于浮动示例行）；既有语义与现状注记不动（0.0.18/0.0.28 批断言继续成立）
    const design = readSkill('novel-design')
    expect(design).toContain('高级选项，非默认推荐')
    expect(design).toContain('如需使用请知悉此限制')
    expect(design.indexOf('高级选项，非默认推荐'), '护栏应前置于浮动示例行').toBeLessThan(design.indexOf('章型浮动: 常规 3500-4500'))
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
    //    （0.0.52 幕纲批：分档触发点从「滚动窗口段级刷新」移入「幕末结算与卷纲偏差分档」——判据边界与单源位置随裁同步）
    expect(outline).toContain('**卷纲偏差分档**')
    expect(outline).toContain('小偏差（线索方向/弧线细节/心动位移位，不影响卷末兑现与主战层级）')
    expect(outline).toContain('直接改候选卷纲再确认（版本+1）')
    expect(outline).toContain('不跑影响分析（同轻量改纲通道）')
    expect(outline).toContain('大偏差（卷末兑现变了/主战层级升了/分卷接口动了）')
    expect(outline).toContain('走《卷幕规划》纲修订＋影响分析前置呈报')
    expect(design).toContain('**卷纲偏差处理分档**')
    expect(design).toContain('分档边界定义单源在《细纲备料》重入节「幕末结算与卷纲偏差分档」')
    expect(design, '0.0.52 幕纲批：旧「滚动窗口段级刷新」指针应清零').not.toContain('滚动窗口段级刷新')
    expect(design, 'design 侧不得重述分档边界定义（单源在 outline 侧）').not.toContain('心动位移位，不影响卷末兑现与主战层级')
    expect(outline, '旧单通道句应清零').not.toContain('卷纲要动先走')
    expect(design, '旧单通道句应清零').not.toContain('卷纲要修订先走')
    // B. 工单 05 路径 A 呈报减负：design 步骤 3 摘要过目＋看细节指引
    expect(design).toContain('**摘要过目**（默认第一步）')
    expect(design).toContain('5-8 行人话摘要')
    expect(design).toContain('「看细节」')
    expect(design).toContain('想看任何一件的全文，点名即可')
    expect(design).toContain('即视为确认整包（含留白）')
    expect(design, '旧整份过目句应清零').not.toContain('整份呈作者过目')
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
    // A. 工单 01 灵感库主动供给：备料段「自主补充材料」节内自动匹配——SKILL 留触发与指针，检索式/取用列/跳过口径随常驻瘦身下沉到 references/补充材料操作.md
    const outline = readSkill('novel-outline')
    const supplement = outline.slice(outline.indexOf('## 备料段'), outline.indexOf('## 工件契约'))
    const supplementRef = fs.readFileSync(skillFile('novel-outline', 'references/补充材料操作.md'), 'utf8')
    expect(supplement, 'outline 备料段应含「灵感库自动匹配」小节').toContain('**灵感库自动匹配**')
    expect(supplement).toContain('只取两列 ≤3 条')
    expect(supplement).toContain('正式入包仍走补充通道')
    expect(supplement, 'SKILL 应指向补充材料操作 reference').toContain('[补充材料操作](references/补充材料操作.md)')
    expect(supplementRef).toContain('grep `<工作范围>/书房/灵感库/*/零件卡.md`')
    expect(supplementRef).toContain('场景元素＋设定域＋情绪词')
    expect(supplementRef).toContain('「化用启示」列＋「一句话（骨）」列')
    expect(supplementRef).toContain('≤3 条')
    expect(supplementRef).toContain('正式入包仍走既有补充通道')
    expect(supplementRef).toContain('灵感库未建时直接跳过不提示')
    // 四步补充操作细节随迁 reference：字段名/哈希往返/编号改移除/快照路径不得丢失
    for (const detail of ['`材料清单哈希`', '`补充预览[].原文`', '`来源.读取哈希`', '`{操作: 移除, 编号}`', '`补充/<编号>.md`']) {
      expect(supplementRef, `补充操作 reference 应含「${detail}」`).toContain(detail)
    }
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
    expect(readSkill('novel-arcplan'), '0.0.57 规模批：幕末结算步 1 改为核对 pending 遗留(草稿区随定稿清理,读不到候选事实段原文)').toContain('核对写时发现遗留')
    expect(settle).toContain('记到本卷卷纲「线索推进」节（标「写时发现」来源）')
    expect(settle).toContain('作者确认后在后续细纲排期')
    expect(settle).toContain('作者确认后改世界书')
    expect(settle).toContain('走影响分析前置呈报流程')
    expect(settle).toContain('分拣结果呈报作者，不自动落盘')
    // C. 版本纪律全套：两 package.json 同版本＋CHANGELOG 有该版本条目＋README×2 提到它。
    // 版本号从 bundle/package.json 读，不写死：此断言守的是「四处一致」这个性质，不是某个具体版本。
    const rootPkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'package.json'), 'utf8'))
    const bundlePkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))
    const version = bundlePkg.version
    expect(rootPkg.version, `根 package.json 版本应与 bundle 一致（${version}）`).toBe(version)
    expect(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'CHANGELOG.md'), 'utf8'), `CHANGELOG 应有 ${version} 条目`).toContain(`## [${version}]`)
    for (const readme of ['README.md', 'packages/bundle/README.md']) {
      expect(fs.readFileSync(path.join(__dirname, '..', '..', '..', readme), 'utf8'), `${readme} 应含当前版本 ${version}`).toContain(version)
    }
  })

  it('0.0.50 删作者记忆与默认文风批：默认文风文件＋drafting 三样文风基准＋settle 决策去向与下卷注意事项＋作者记忆全树清零＋注册单源', () => {
    // A. 默认文风：文件存在＋五层标题在位＋不含数字（数值单源在写作卡）
    const stylePath = skillFile('novel-drafting', 'references/默认文风.md')
    expect(fs.existsSync(stylePath), 'novel-drafting/references/默认文风.md 应存在').toBe(true)
    const style = fs.readFileSync(stylePath, 'utf8')
    for (const layer of ['## 叙述者', '## 表达逻辑', '## 节奏', '## 语言', '## 情绪与趣味', '## 数值参照']) {
      expect(style, `默认文风应含「${layer}」层`).toContain(layer)
    }
    expect(style).toContain('优先于本文件')
    expect(style).toContain('数值单源在《正文起草》技能包 agents/写作卡.md')
    for (const line of style.split('\n')) {
      expect(line, `默认文风不得含数字（数值单源在写作卡）：${line.slice(0, 30)}`).not.toMatch(/[0-9]/)
    }
    // B. drafting：首章文风建档门与文风画像清零＋文风基准三样
    const drafting = readSkill('novel-drafting')
    expect(drafting, '首章文风建档门应整节删除').not.toContain('首章文风建档门')
    expect(drafting).not.toContain('文风画像·')
    expect(drafting).toContain('①作品契约「叙事方式与文风基调」分部原文（本书相对默认文风的调整，优先）')
    expect(drafting).toContain('②本书记忆里的文风锚点条目')
    expect(drafting).toContain('默认文风.md` 全文')
    expect(drafting).toContain('①②与③冲突时以①②为准')
    // C. settle：偏离处置走本书层记忆·决策＋锚点扩前五章＋novel_record_memory 清零
    const settle = readSkill('novel-settle')
    expect(settle, 'settle SKILL 不应再引用 novel_record_memory').not.toContain('novel_record_memory')
    expect(settle).toContain('把处置结论作为 `## 决策` 下的一个条目补进沉淀候选的本书层记忆段')
    expect(settle).toContain('本书前五章（第 1–5 章）定稿呈报时各问一次「从本章挑一段满意的收进文风锚点吗」')
    expect(settle).toContain('| 本书层记忆·决策条目 | `本书记忆/<条目名>.md` |')
    //（0.0.56 边界重划：下卷注意事项便签三钉随卷末节移入 novel-arcplan）
    const arc50 = readSkill('novel-arcplan')
    expect(arc50).toContain('下卷注意·卷<NN+1>')
    expect(arc50).toContain('`relPath: 故事剧情/分卷布局.md`，`节名: 卷间衔接`')
    expect(arc50).toContain('这条属于产品反馈，不记进书里')
    const reconcile = fs.readFileSync(skillFile('novel-settle', 'agents/沉淀对账.md'), 'utf8')
    expect(reconcile, '沉淀对账底本记忆类别应收窄为两类').toContain('本书层记忆两类是 `文风`／`决策`')
    // D. design：第五部只记相对默认的调整＋卷规划读「下卷注意」便签
    const design = readSkill('novel-design')
    expect(design).toContain('只写本书相对默认文风的调整')
    expect(design).toContain('沿用默认文风')
    //（0.0.56 边界重划：卷规划读便签句移入 novel-arcplan）
    expect(readSkill('novel-arcplan')).toContain('「卷间衔接」节的待补便签')
    expect(readSkill('novel-arcplan')).toContain('下卷注意·卷NN')
    // E. 润色与审读：同一套文风基准
    expect(readSkill('novel-polish')).toContain('文风基准和硬约束')
    expect(readSkill('novel-polish')).toContain('references/默认文风.md 全文')
    const reshape = fs.readFileSync(skillFile('novel-polish', 'references/2-节奏与重塑.md'), 'utf8')
    expect(reshape).toContain('以本书文风基准（契约第五部调整＋本书锚点＋默认文风）为准')
    const review = readSkill('novel-review')
    expect(review).toContain('默认文风速查')
    expect(review).toContain('references/默认文风-速查.md')
    expect(review).toContain('默认文风.md 全文')
    const styleReview = fs.readFileSync(skillFile('novel-review', 'agents/文风与表达审读.md'), 'utf8')
    expect(styleReview).toContain('文风贴合对照本书文风基准')
    const sweep = fs.readFileSync(skillFile('novel-review', 'agents/全量审读.md'), 'utf8')
    expect(sweep).toContain('贴合本书文风基准（契约第五部调整＞本书锚点＞默认文风')
    // F. 注册单源：artifact-contract 登记默认文风
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    expect(contract, 'artifact-contract 应登记 默认文风').toContain("'默认文风'")
    // G. 全树清零：skills 下 grep 不到 novel_record_memory 与「作者记忆」；工具名单不含该工具
    const skillsRoot = path.join(__dirname, '..', 'skills')
    const walkMd = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
      .flatMap((e) => (e.isDirectory() ? walkMd(path.join(dir, e.name)) : [path.join(dir, e.name)]))
      .filter((p) => p.endsWith('.md'))
    for (const f of walkMd(skillsRoot)) {
      const text2 = fs.readFileSync(f, 'utf8')
      expect(text2, `${path.relative(skillsRoot, f)}: novel_record_memory 应清零`).not.toContain('novel_record_memory')
      expect(text2, `${path.relative(skillsRoot, f)}: 「作者记忆」应清零`).not.toContain('作者记忆')
      expect(text2, `${path.relative(skillsRoot, f)}: 「文风画像」应清零`).not.toContain('文风画像')
    }
    const toolNames = fs.readFileSync(path.join(__dirname, '..', 'src', 'tools', 'index.ts'), 'utf8')
    expect(toolNames, '工具名单不应再含 novel_record_memory').not.toContain("'novel_record_memory'")
  })

  it('0.0.35 流程修复后沿批（flow-fix 03+07）：批量细纲＋连写叠加＋审读沉淀并行＋十查⑥⑧脚本化＋批量滚窗——同版本 0.0.32，版本件由前批管', () => {
    const outline = readSkill('novel-outline')
    const director = readSkill('novel-director')
    // A. 工单 03 批量细纲（0.0.52 幕纲批：并入「按幕成批出细纲」，设为默认节奏；旧「批量细纲（可选分支）」节名退役）
    const batchStart = outline.indexOf('**按幕成批出细纲')
    expect(batchStart, 'outline 应含「按幕成批出细纲」节').toBeGreaterThanOrEqual(0)
    const batch = outline.slice(batchStart, outline.indexOf('1. **读窗口、卷纲与本幕幕纲**'))
    expect(batchStart, '按幕成批出细纲节应在章型双轴之后').toBeGreaterThan(outline.indexOf('**章型双轴'))
    for (const kw of [
      '进入一幕的第一章前',
      '读本幕幕纲',
      '一次性排出来',
      '幕内分批',
      '幕内分批出细纲',
      //（0.0.62 审查修复批：「一次 N ≤5 章」数字退役，改《参考标尺》『幕内分批出细纲』行上限指针）
      '一次按《参考标尺》「L2-A4-06 幕内分批出细纲」行上限取',
      '场景卡选择跨章看',
      '钩型配比跨章规划',
      '危机钩兑现章号跨章排、张力类占比按本幕窗口算而非单章',
      '伏笔排期一批过',
      '跨章保温触点同批排定',
      '灵感库自动匹配一次跑本批',
      '原「批量细纲」通道并入本节',
    ]) {
      expect(batch, `按幕成批出细纲节应含「${kw}」`).toContain(kw)
    }
    // 批量呈报（首章全目/后续差异）＋逐章确认（core 协议不动）＋批量滚窗＋写时发现反馈闭环
    for (const kw of [
      '首章全目呈报（含十查全项）',
      '后续章只呈差异与各章十查🔴项',
      '确认仍逐章',
      '`novel_confirm_outline` 逐章调用（core 协议不动——**规划粒度变，确认粒度不变**',
      '同步改再呈',
      '批量滚窗',
      '`novel_roll_window` 逐条调用补位（core 协议不动，只是组装时机变）',
      '批量写时发现反馈',
      '在下一章细纲组装时优先消化',
    ]) {
      expect(batch, `按幕成批出细纲节应含「${kw}」`).toContain(kw)
    }
    // B. director 连写授权档：叠加句＋审读沉淀并行（并行的是对账准备，不是入档）
    const relay = director.slice(director.indexOf('2. **连写授权**'), director.indexOf('3. **到点收尾**'))
    expect(relay, '连写授权档应含叠加句').toContain('与按幕成批出细纲叠加')
    expect(relay).toContain('先按《细纲备料》「按幕成批出细纲」一次排本幕候选，再逐章走起草循环')
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
    expect(checks).toContain('一次输出③④⑥⑧四查的机械结果')
    expect(checks).toContain('机械行是候选不是结论')
    expect(checks, '旧口径「机械比对由你做」应清零').not.toContain('机械比对由你做')
    expect(fs.existsSync(skillFile('novel-outline', 'scripts/十查机械.mjs')), 'novel-outline/scripts/十查机械.mjs 薄入口应存在').toBe(true)
    expect(fs.readFileSync(skillFile('novel-outline', 'scripts/十查机械.mjs'), 'utf8')).toContain('tenChecksCli')
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    expect(contract, '十查机械薄入口应在 artifact-contract thinScripts 注册').toContain("['skills/novel-outline/scripts/十查机械.mjs', 'tenChecksCli']")
    const cliSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'scripts', 'ten-checks-cli.ts'), 'utf8')
    expect(cliSrc, 'CLI 实现应只算不写').toContain('只算不写')
    expect(fs.readFileSync(path.join(__dirname, '..', 'src', 'index.ts'), 'utf8'), 'bundle index 应导出 tenChecksCli').toContain("export { tenChecksCli } from './scripts/ten-checks-cli'")
  })

  it('0.0.36 全量审查修复批：快档数值单源＋出处注记全清＋审读沉淀并行开闸＋修辞预算指针＋灵感库枚举指路＋标尺三值勘误——同版本 0.0.32，版本件由前批管', () => {
    const design = readSkill('novel-design')
    const settle = readSkill('novel-settle')
    const director = readSkill('novel-director')
    const cards = fs.readFileSync(skillFile('novel-drafting', 'agents/写作卡.md'), 'utf8')
    const clean = fs.readFileSync(skillFile('novel-polish', 'references/1-表达清理.md'), 'utf8')
    const volSpec = fs.readFileSync(skillFile('novel-arcplan', 'templates/卷纲固定段规格.md'), 'utf8')
    const ladder = fs.readFileSync(skillFile('novel-design', 'templates/对手梯队子表规格.md'), 'utf8')
    const power = fs.readFileSync(skillFile('novel-design', 'templates/世界书/力量体系条目模板.md'), 'utf8')
    const game = fs.readFileSync(skillFile('novel-design', 'templates/世界书/局规则条目模板.md'), 'utf8')
    const sect = fs.readFileSync(skillFile('novel-outline', 'templates/章细纲固定小节规格.md'), 'utf8')
    const scale = fs.readFileSync(skillFile('novel-design', 'references/参考标尺.md'), 'utf8')
    // A. C1 快档数值单源：design 三档话术改指行 ID（数值单源在标尺 L2-A4-01），旧 2300-2500 与「十日/道诡型」清零
    expect(design).toContain('快节奏档')
    expect(design, '设计消费点应引 L2-A4-01 行 ID').toContain('「L2-A4-01 每章字数」行')
    expect(design, '三档数值不得在 SKILL 重述（单源在标尺）').not.toContain('2100-2500')
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
    //（0.0.52 幕纲批：伏笔保温自查判据正文前移幕纲规格「备料自查」段——断点改钉单源件）
    const memoSpec36 = fs.readFileSync(skillFile('novel-arcplan', 'templates/幕纲固定段规格.md'), 'utf8')
    expect(memoSpec36).toContain('兑现前必有强化触点')
    expect(volSpec).toContain('误会-和解小循环周期按本书节奏拟（参考 10-15 章，大周期以事件弧计——实证与节拍口径见《定调设计》技能包 references/参考标尺.md 节奏基准「单元循环节拍」行）')
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
    // E. M1 灵感库枚举指路（完整枚举单源在采风检索——单源侧正断言见 0.0.22 简称清理批 E 节；
    //    0.0.58 素材库批：枚举单源随灵感库迁入 novel-forage，十值改八值）
    expect(readSkill('novel-forage')).toContain('部简称八值〔人/地/物/事/知/言/象/镜〕与可信度四态枚举单源在 [采风检索](agents/采风检索.md)')
    expect(readSkill('novel-forage'), 'SKILL 完整枚举应退役').not.toContain('类简称＝古词/台词/剧情/人物/历史/文化/影动/现实/命名/设定')
    // F. 低等级项：参照带措辞归一＋标尺三值＋settle 派发模板路径补尖括号＋design 窗口路径统一
    expect(cards).toContain('参照书章节相邻双代词起句 0-0.7%')
    expect(cards, '「人类五书样本」出处措辞应清零').not.toContain('人类五书样本')
    expect(cards, '「人类对照章节」出处措辞应清零').not.toContain('人类对照章节')
    expect(clean).toContain('参照书章节相邻双代词起句 0-0.7%')
    expect(clean).toContain('参照带约 3-6 处/千字')
    expect(scale).toContain('每 15 章（约 5–7 万字）')
    expect(scale).toContain('终卷收束期 60–110 万字')
    expect(scale).toContain('3.5 倍')
    //（0.0.62 审查修复批：settle 派发模板路径随草稿区键带章号批刷为 `卷<NN>-<NNNN>-<章名>`）
    expect(settle).toContain('<粘贴 草稿区/草稿/卷<NN>-<NNNN>-<章名>/稿<N>.md 全文>')
    expect(design).toContain('`故事剧情/卷规划/卷<NN>/近期窗口.md`')
    expect(design, 'design 工件表「卷NN」路径式应统一为「卷<NN>」').not.toContain('故事剧情/卷规划/卷NN/')
  })

  it('0.0.37 挂账修复批（core 三件＋技能三件＋十查补测）', () => {
    // A. 危机钩红线单源化收尾：ruler 单源保留阈值（0.0.26 批 A 节已钉），review 任务包摘录扩含钩型配比行
    const scale = fs.readFileSync(skillFile('novel-design', 'references/参考标尺.md'), 'utf8')
    // v3 裁定：阈值不进标尺，单源在审读派发固定件与写前十查
    expect(scale).not.toContain('危机钩')
    const reviewSkill = fs.readFileSync(skillFile('novel-review', 'SKILL.md'), 'utf8')
    expect(reviewSkill).toContain('危机钩兑现距钩章 **≤5 章**')
    expect(reviewSkill).toContain('章级红线不再取参考标尺')
    // B. 写作卡选卡映射单源：卡头节带映射句，drafting 只留指路不再重述映射与 § 对照表
    const cards = fs.readFileSync(skillFile('novel-drafting', 'agents/写作卡.md'), 'utf8')
    expect(cards).toContain('选卡映射：推进场景带推进卡｜塑造场景带塑造卡｜动作高潮场景带动作卡｜环境展开场景带环境卡｜转场/分镜切换场景带转场卡')
    expect(cards).toContain('「场景功能」枚举单源在《细纲备料》技能包 templates/章细纲固定小节规格.md')
    const drafting = readSkill('novel-drafting')
    expect(drafting).toContain('写作卡-索引')
    expect(drafting).toContain('原文内联**任务包')
    expect(drafting).toContain('按卡头节源对应的《正文-*》拆分件整读')
    expect(cards).toContain('卡头节源→件对照（07 已拆《正文-*》六件＋06 一节；拆分件整件读）')
    expect(cards).toContain('§7.1/§7.2/§7.8/§7.9→正文-展示与对白')
    expect(drafting, 'SKILL 不应重述选卡映射').not.toContain('推进场景带推进卡；塑造场景带塑造卡')
    // C. 情绪直说张力修复：绝对禁令改按场景定档，升级链原文保留（0.0.26 批 E 节钉的链式串继续成立）
    expect(cards).toContain('情绪按场景定档：过场可直接说，情绪场景按升级链落笔')
    expect(cards).toContain('情绪场景至少落在生理反应档')
    expect(cards, '绝对禁令句应清零').not.toContain('情绪不直接说，按升级链落笔')
  })

  it('0.0.38 心智批·起草：R1-R8 重写＋删除句 8 句清零＋R4 改判＋双锚排位＋自评行判据式', () => {
    const drafting = readSkill('novel-drafting')
    // A. 新第 0 件八条句正钉（条名粗体短名＋各条运行时形态关键短语——条序 R1→R8）
    const mindPins = [
      '**写前重读**：开笔第一动作＝重读上章末尾与衔接段，逐行点名读近三章「语态样本：」行（位于任务包末尾）找回语感；首章改读文风基准',
      '**双位视角**：场景内只写他能知道、感到、害怕的；埋伏笔挖钩放烟幕时切出来对信息差——读者读到而角色不知道的部分由你控制',
      '**在场**：直接呈现画面（他看到的/听到的/闻到的），不写"这时他看到了..."',
      '**节奏跟随**：按场景类型给节奏：打斗快、独白慢、对话跳；笔墨花在读者最关心的地方，不平均用力',
      //（0.0.55 章节循环技能批：角色自决加停笔报告、一气呵成改对包核对——句面随批更新）
      '**角色自决**：写到"他不会这么做"就跟角色走，候选事实段注明偏离与原因；单元立不住（人物不肯动、因果接不上、事件量明显不够写）时不硬写到底——**停笔交停笔报告**：只交一份报告不交稿，写明「哪个单元、为什么立不住、建议细纲怎么改（一两句）」，主控走《细纲备料》重入节的轻量改纲通道改细纲后再派；牵动伏笔或窗口的停笔同上，不硬掰',
      '**找乐子**：开写前问哪里好玩：能埋会心的梗、能反的套路、能更活的人物就做；平淡过渡段生个事——小意外/小冲突/小反转；梗必须从人物嘴里长出来',
      '**读者在场**：落笔前想一下：他此刻盼着什么、你在哪吊他胃口、他会猜到吗——会猜到就绕开或放假烟雾弹引他猜错',
      '**一气呵成**：从第一句写到章末钩不中断——中断会把分析腔带进后文；**对包核对**——写到衣着、称谓、物价、能力表现等具体处对照材料包；包里没有的不编造具体数值与专名，写过去并就地标 `〔待查：…〕`；禁入泄露/POV 漂当场自改，事实错对材料包核验再改',
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
    expect(drafting).toContain('单元级配给＝参考带宽（带宽值照章细纲规格预期字数行）')
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
    //（0.0.56 边界重划：判据行随步骤卡试点改「判据取件」句——锚同步）
    const uEnd = outline.indexOf('   - 判据取件（步骤卡试点）')
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
    expect(checks).toContain('**红线（任何篇幅都适用，踩线＝🔴 呈报）**')
    expect(checks).toContain('**配比区间（仅 ≥50 章窗口适用；单幕、单弧内不按区间判分）**')
  })

  it('0.0.40 心智批·设计：D1-D8 调度索引化触发点八钉＋D5 首尾镜像合并＋追问句本体保留', () => {
    const design = readSkill('novel-design')
    // A. 触发点钉位八钉：各条运行时形态关键短语落在对应步骤区（架构 §4.1 运行时形态列——判据本体不动，只钉位与对齐）
    const s2 = design.indexOf('2. **世界书**')
    const s3 = design.indexOf('3. **全书大纲**')
    const s4 = design.indexOf('4. **分卷布局**')
    const review = design.indexOf('**确认前审查**')
    const toolsSection = design.indexOf('## 工具')
    //（0.0.56 边界重划：步骤 5/6 整节移入 novel-arcplan，区锚随撤）
    for (const [label, anchor] of [['步骤 2', s2], ['步骤 3', s3], ['步骤 4', s4], ['确认前审查', review]] as const) {
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
    inRegion('**首尾镜像**（全书大纲对谈「故事阶段与关键转折」谈到开端与「结局与终局」时，两端互为镜像，同场对照着过', s3, s4, 'D5 首尾镜像')
    inRegion('结局处他的哪个具体选择，是开头那个他不会做的？指不出这个选择，变化就还停在宣告', s3, s4, 'D5 收束验核句')
    // D6 弧光验核→骨架两部位（三型三句＋落地两问，本体不动）
    inRegion('**弧光三型**（全书大纲「主角目标与成长轨迹」部对谈时过一遍', s3, s4, 'D6 弧光三型')
    inRegion('**弧光落地两问**（全书大纲「人物弧线与关系发展」部对谈时过一遍', s3, s4, 'D6 弧光落地两问')
    // D7 卷级交叉思考→卷纲确认前（运行时形态尾句三线断档越线重排落位——数值照标尺单源）
    //（0.0.56 边界重划：卷级交叉思考随卷规划移入 novel-arcplan——SKILL 单源＋核心问句挂步骤卡-卷规划各步「同时想」）
    const arcSkill40 = readSkill('novel-arcplan')
    const arcCard40 = fs.readFileSync(skillFile('novel-arcplan', 'templates/步骤卡-卷规划.md'), 'utf8')
    expect(arcSkill40).toContain('**卷级交叉思考**（卷纲正文写完、确认工具调用前过一遍')
    expect(arcSkill40).toContain('三线断档红线」行核对')
    expect(arcSkill40).toContain('越线必须重排，不得带病确认')
    expect(arcCard40).toContain('卷级交叉思考·三线断档红线')
    expect(arcCard40).toContain('越线必须重排，不得带病确认')
    // D8 跨轨道自检→确认前审查第二部分（0.0.51 开书流程批：五轨自检并入确认前审查一次呈报）
    inRegion('②**跨轨道自检错位项**：', review, toolsSection, 'D8 跨轨道自检')
    inRegion('不错位则报告"五轨对齐"', review, toolsSection, 'D8 五轨对齐句')
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
      '**弱段定位**：章型读细纲 frontmatter 的 `章型`（不自行按对白占比重判——单源在细纲，重判与审读侧对不上），逐段对照随包数值行扫密度异常段列重点清单；自评「读者会跳读的段」有就优先复核，没有不等于全章没弱段，得意句不给豁免',
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
    // E. 停机条件三句：作者手改稿不跑（0.0.54 起对齐「作者稿默认不润色」句）＋定向单批只扫相关维度＋文风未定不编造
    expect(polish).toContain('作者稿默认不润色')
    expect(polish).toContain('作者点名要润色才派')
    expect(polish).toContain('定向单批时润色心智的弱段定位扫描只扫该节相关维度，重点段清单不越节')
    expect(reshape).toContain('基准缺书级内容时按「未定」处理,不编造特征——改写与接缝核只对照原稿存量语态判')
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
    expect(selfCheck).toContain('破折号解释装置（双判：位置判＋功能判，密度参考带 0-1/千字【待实测校准】）：数「——」——位置判：高显著位才合法，不在高显著位＝候选；功能判：引出解释／限定／点题即候选，不论密度；命中候选自查哪些在引解释，拆句或删、让上下文自明（本书文风基准申报破折号为保留技法时按基准另判）')
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

  it('0.0.45 方法论审查修复批：C1 润色密度口径＋R1 开篇两尺删除与适用边界＋R2 憋屈三口径＋R3 ≤70% 指针化＋R4 毛边豁免＋R5 钝收档差＋R6 标尺触发位＋N 系单源指针＋审读参考线速览表', () => {
    const reshape = fs.readFileSync(skillFile('novel-polish', 'references/2-节奏与重塑.md'), 'utf8')
    const cards = fs.readFileSync(skillFile('novel-drafting', 'agents/写作卡.md'), 'utf8')
    const checks = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
    const outline = readSkill('novel-outline')
    const design = readSkill('novel-design')
    const review = readSkill('novel-review')
    const scale = fs.readFileSync(skillFile('novel-design', 'references/参考标尺.md'), 'utf8')
    const mineList = fs.readFileSync(skillFile('novel-design', 'references/雷点清单.md'), 'utf8')
    const vol = fs.readFileSync(skillFile('novel-arcplan', 'templates/卷纲固定段规格.md'), 'utf8')
    const sweep = fs.readFileSync(skillFile('novel-review', 'agents/全量审读.md'), 'utf8')
    const struct = fs.readFileSync(skillFile('novel-review', 'agents/章节结构审读.md'), 'utf8')
    const style = fs.readFileSync(skillFile('novel-review', 'agents/文风与表达审读.md'), 'utf8')
    // A. C1 润色密度互斥修复：三对数值行参照带（软预算）＋画像优先；旧「不设跨作品统一数量上限」清零
    expect(reshape).toContain('**密度判断**：以随包三对数值行为参照带（软预算——超标先自查哪句可删哪句该留），本书文风基准申报疏密偏好时基准优先')
    expect(reshape).not.toContain('不设跨作品统一数量上限')
    // B. R1 开篇钩位两尺：写作卡删「前 1000 字给钩」（负断言在 0.0.31 组随裁）＋「在乎」句折入 300 字项；review 两底本补适用边界
    expect(cards).toContain('读者脑子里得有一个「然后呢？」的问题——悬念前先建立在乎：读者还不在乎结果时悬置它只是干等')
    expect(sweep).toContain('前 300 字核对「主角＋处境＋钩」三件是否立齐（首章与卷首章硬核，余章对照细纲判）')
    expect(struct).toContain('主角＋处境＋钩（首章与卷首章硬核，余章对照细纲判）')
    // C. R2 憋屈三口径：KB 分发件与雷点清单都改挂《参考标尺》憋屈剧情上限行
    //（v2.4.5 阶段5a：§8.5 随排障域拆分落《排障-专项修复》——断言随裁）
    //（0.0.49 方法论冲突批：§8.5 毒点逐条清单单源到雷点清单，「憋屈隐忍」条目随清单移出排障侧，判据句由下方雷点清单断言承接）
    const kbTroubleshoot = fs.readFileSync(skillFile('novel-director', 'references/排障-专项修复.md'), 'utf8')
    expect(kbTroubleshoot, '0.0.49 方法论冲突批：毒点条目应单源在雷点清单').not.toContain('羞辱后还手时限照《参考标尺》憋屈剧情上限行')
    expect(kbTroubleshoot).not.toContain('羞辱一章就打脸')
    // 0.0.87 单源收敛：数值单源在审读 SKILL，雷点清单只记现象并指回；此处断言指针而非数值
    expect(mineList).toContain('单源在《全面审读》第二部分章级执行红线')
    expect(mineList).not.toContain('羞辱一章内打脸')
    // D. R3 信息释放行指针化（写前十查句面钉在 0.0.25 组随裁）；此处钉 outline SKILL 步骤 5 简版豁免口径句
    expect(outline).toContain('豁免口径见规格')
    // E. R4 §7.8 毛边豁免补入（KB 分发件侧——v2.4.4 阶段4 起随 §7.8 落《正文-展示与对白》）
    const kbShowTell = fs.readFileSync(skillFile('novel-drafting', 'references/正文-展示与对白.md'), 'utf8')
    expect(kbShowTell).toContain('毛边对白（结巴／口癖／答非所问／无信息量客套）是人味不是废话——功能审判只删删完什么都不剩的空转对白')
    // F. R5 钝收档差：三章及以上红线＋高潮后 1-2 章余波钝收合法（主句钉在 0.0.24 组随裁）
    expect(vol).toContain('高潮后 1-2 章余波钝收合法')
    // G. R6 标尺触发位失实修复：憋屈行触发位钉在 0.0.13 组随裁；章末钩子行→审读·章节结构维；写前十查雷点快扫行补憋屈句
    // v3：消费位列删除，触发位信息并入规划三段；此处钉红线已下沉且标尺无章级行
    expect(scale).not.toContain('章级·draft 回看')
    expect(scale).not.toContain('审读·章节结构维')
    expect(checks).toContain('**憋屈连续超线**')
    // H. N1 字数示例改标尺指针；N5/N12/N13 数值单源指针句面钉在 0.0.28/0.0.38/0.0.39 组随裁
    expect(design).toContain('三档话术与基准照 references/参考标尺.md「L2-A4-01 每章字数」行取（示例数值仅格式演示）')
    // I. N7 格言预算指针：两底本改「数值随派发材料写作卡摘录行」，≤2/章 数值不再内联
    for (const t of [sweep, style]) {
      expect(t).toContain('数值随派发材料写作卡摘录行')
      expect(t).not.toContain('（≤2/章）提示均匀感')
    }
    // J. N9 审读参考线速览表：单源一段在 review SKILL 派发模板＋八底本数值行改指针（读者承诺审读无通用参考线数值行）
    for (const row of [
      '对话密度 | 1.5 次/百字（快节奏对话流）',
      '段落均值 80 字；超 200 字段计数',
      '短篇 10 个内',
      '低于三成为漂移候选',
      '5-15 处/千字（体裁分档警戒线）；词表 6 词：心想/意识到/感到/觉得/认为/明白',
      '场景切换套路标记 | 5 处/千字（与此同时/另一边/画面一转）',
      '同一标记 ≥3 次',
      '消失超 50% 篇幅后复现',
      '连续 ≥3 段纯叙述（无对话、无动作 beat，段长≥20 字）',
      '常见套话词表 | 11 词：眼中闪过/嘴角勾起/眼眶微红/不可置信/眼底闪过/咬了咬唇/身子一颤/心头一紧/倒吸一口凉气/目光一凝/瞳孔一缩',
    ]) {
      expect(review, `参考线速览表应含「${row}」`).toContain(row)
    }
    expect(review).toContain('**参考线速览表单源**：十份审读底本（全量审读＋九份单维底本）的参考线数值一律对照第二部分速览表')
    expect(review).toContain('段末格言化参照（对白金句密度）：从《正文起草》技能包 agents/写作卡.md「AI 痕迹六条」原样摘录段末格言化行随包')
    const agentDir = path.join(__dirname, '..', 'skills', 'novel-review', 'agents')
    for (const f of ['全量审读.md', '章节结构审读.md', '人物与关系审读.md', '情节与因果审读.md', '信息披露审读.md', '线索与伏笔审读.md', '节奏与张力审读.md', '文风与表达审读.md']) {
      expect(fs.readFileSync(path.join(agentDir, f), 'utf8'), `${f}: 底本参考线数值行应对照随包参考线速览表`).toContain('对照随包参考线速览表')
    }
    for (const stale of ['参考线 1.5/百字', '参考线 80 字', '短篇参考线 10', '体裁参考线 5~15', '超 5 处/千字', '超 50% 篇幅后复现']) {
      expect(sweep, `全量审读不应残留内联参考线数值「${stale}」`).not.toContain(stale)
    }
    expect(style, '文风底本不应残留套话词表内联').not.toContain('眼中闪过/嘴角勾起')
    // K. N10-N11 跨包单源声明：事件化四件（世界书模板升级节点行）＋平章三型（章细纲规格可选增补行）
    expect(checks).toContain('定义单源在世界书模板-力量体系条目「升级节点」行')
    expect(checks).toContain('三型枚举单源在 [章细纲固定小节规格](../templates/章细纲固定小节规格.md) 可选增补行')
    // L. 顺手批：KB 自引表金手指版清零（四版统一）——v2.4.4 阶段4 起自引表随章头块落 06 源侧壳（不分发），断言随裁退役；主语密度 0-0.7% 钉在 0.0.36 组随裁
    // M. 润色 tier3 词表交叉引用改指速览表（文风底本已不内联词表）
    const clean = fs.readFileSync(skillFile('novel-polish', 'references/1-表达清理.md'), 'utf8')
    expect(clean).toContain('词表单源在审读 novel-review 技能包 SKILL「参考线速览表」，与本行一致')
  })

  it('T2 附录蒸馏批：九项类型特化蒸为通用机制并入对应件（v2.4.6，作者逐项批准）', () => {
    const ref = (skill: string, file: string) => fs.readFileSync(path.join(__dirname, '..', 'skills', skill, 'references', file), 'utf8')
    // 八块落位（附.7/附.8 合并对照块）
    expect(ref('novel-design', '大纲-牌局与结构检查.md')).toContain('### 智斗剧情通用件')
    expect(ref('novel-design', '大纲-牌局与结构检查.md')).toContain('读者复盘三遍仍合理')
    expect(ref('novel-design', '人物设计-弧光与关系.md')).toContain('### 情感线张力总纲与能动性')
    expect(ref('novel-design', '人物设计-弧光与关系.md')).toContain('只哭不抗=弃读位')
    expect(ref('novel-design', '大纲-主线与骨架.md')).toContain('### 悬疑张力通用件：四支柱与三层真相')
    expect(ref('novel-design', '大纲-主线与骨架.md')).toContain('第一层揭开后故事还有劲吗')
    expect(ref('novel-design', '大纲-主线与骨架.md')).toContain('### 全书核心疑问与缺席者技法')
    expect(ref('novel-design', '卷纲-节奏与高潮.md')).toContain('### 情绪兑现两型供血（两型互为对照）')
    expect(ref('novel-design', '卷纲-节奏与高潮.md')).toContain('两型不混同一本账')
    expect(ref('novel-design', '开书-读者与情绪定位.md')).toContain('### 笔墨随题材调配')
    expect(ref('novel-outline', '章纲-信息与情绪.md')).toContain('### 信息差定向爆破：掉马时机')
    expect(ref('novel-outline', '章纲-信息与情绪.md')).toContain('悬念还在吗？读者还记得吗')
    expect(ref('novel-director', '排障-长篇防崩.md')).toContain('### 循环/重生/时间线题材一致性体制（条件触发）')
    expect(ref('novel-director', '排障-长篇防崩.md')).toContain('读者会拿第 1 章的声明来审你')
    // 蒸馏块净版纪律：块内不残留来源行/理论锚
    for (const [file, title] of [['卷纲-节奏与高潮.md', '情绪兑现两型供血'], ['排障-长篇防崩.md', '一致性体制']] as const) {
      const text = ref('novel-design' === 'x' ? 'novel-director' : (file.startsWith('排障') ? 'novel-director' : 'novel-design'), file)
      const block = text.slice(text.indexOf(title) - 5)
      expect(block, `${file} 蒸馏块不应残留来源行`).not.toContain('**来源**：')
      expect(block).not.toMatch(/T0\d\d/)
    }
  })

  it('T4 编辑席并入作家席（0.0.48 写作范围清理）：编辑评审底本退役＋作家评审接 D5 续航与体量（参考标尺对照表四态＋待校准纪律）＋design 两席串行接线＋润色删除测试＋注册单源', () => {
    // A. 编辑评审底本退役：文件删除；作家评审承接参考标尺对标
    expect(fs.existsSync(skillFile('novel-design', 'agents/编辑评审.md')), '编辑评审已并入作家评审，底本应删除').toBe(false)
    const writer = fs.readFileSync(skillFile('novel-design', 'agents/作家评审.md'), 'utf8')
    expect(writer).toContain('name: writer-reviewer')
    // B. 输入清单整读参考标尺＋判据引用格式＋对标纪律三条（参考标尺自身约定）
    expect(writer).toContain('| ✅ | 判据目录下 `参考标尺.md` | 续航与体量维的数值尺——整读，逐行对照产出参考标尺对照表 |')
    expect(writer).toContain('参考标尺对标的判据引用格式＝行 ID＋旧行名（如「L2-A3-01 单卷体量」行）')
    expect(writer).toContain('标 `对照` 强度的行只作模式档参照，不作硬门禁')
    expect(writer).toContain('未覆盖模式／边界外形态：按本书自报档处理并标注「模式未覆盖」——绝不编造档位系数')
    expect(writer).toContain('版权铁律：差异化核对只以契约「核心看点与差异化」部申报为准')
    // C. D5 续航与体量（骨架/分卷）＋卷纲参考标尺执行/字数逻辑/卷间节奏＋粗锚降级
    expect(writer).toContain('D5 续航与体量：')
    for (const sec of ['§1.6', '§1.7', '§5.5']) {
      expect(writer, `作家评审应引判据节 ${sec}`).toContain(sec)
    }
    expect(writer).toContain('「卷目标与卷末状态」卷行·字数')
    expect(writer).toContain('「L2-A5-01 三线断档红线」行')
    expect(writer).toContain('参考标尺执行（逐行对照产出参考标尺对照表）：')
    expect(writer).toContain('卷间节奏：连卷压抑检测')
    expect(writer).toContain('粗锚降级检查')
    // D. 报告：对照表四态＋低置信计数＋维列含 D5
    expect(writer).toContain('✅达标 ｜ ⚠️低置信／经验候选（仅提示，不计入）｜ ❌超标（升级为问题清单条目）｜ 不适用')
    expect(writer).toContain('- 计数：🔴{x} 🟡{x} 🔵{x}（⚠️低置信／经验候选 {x} 项仅提示，不计入）')
    expect(writer).toContain('D4 节奏 / D5 续航与体量')
    // E. 写作范围：市场面内容不随迁
    for (const stale of ['上架', '签约', '付费', '货架', '撞名', '责编', '门面']) {
      expect(writer, `作家评审不应带入市场面内容「${stale}」`).not.toContain(stale)
    }
    // F. design SKILL 两席串行接线：作家→读者＋报告落盘行＋工件契约行
    const design = readSkill('novel-design')
    expect(design).toContain('按作家→读者串行')
    expect(design).toContain('两席独立互不通气')
    expect(design).toContain('{对象}_作家.md`、`{对象}_读者.md` | 无 |')
    for (const stale of ['编辑评审', '三席', '_编辑.md']) {
      expect(design, `design SKILL 不应残留「${stale}」`).not.toContain(stale)
    }
    // G. 注册单源：artifact-contract 不再登记编辑评审
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    expect(contract).not.toContain('编辑评审')
    // H. 润色批 2 对话节删除测试：口径与审读侧 §7.8 单源（引节号不重述全文；0.0.49 方法论冲突批对齐 §7.8 原文三要素「剧情/人物/情绪」）
    const reshape = fs.readFileSync(skillFile('novel-polish', 'references/2-节奏与重塑.md'), 'utf8')
    expect(reshape).toContain('**删除测试**：盖住这句对白再读，剧情/人物/情绪三者无损＝可删候选（删后语义不塌才准删；塌则留）——口径与《正文起草》技能包 references/正文-展示与对白.md §7.8 单源（引节号，不重述全文）')
  })

  it('0.0.48 写作范围清理批：参考标尺去平台与更新节奏行＋校准史移出运行时＋雷点清单与排障索引写作化＋润色批 3 退役＋判据件读者数据措辞', () => {
    const ref = (skill: string, file: string) => fs.readFileSync(skillFile(skill, file), 'utf8')
    // A. 参考标尺：第七节签约/上架、日更建议行、平台读者口味注、运营对冲句移除；校准计划与变更记录移出（沿革在技术文档第 7 节）
    const scale = ref('novel-design', 'references/参考标尺.md')
    for (const stale of ['签约', '上架', '日更', '双更', '番茄', '运营', '## 校准计划', '## 变更记录', '留痕见变更记录']) {
      expect(scale, `参考标尺不应残留「${stale}」`).not.toContain(stale)
    }
    expect(scale).toContain('## 附：体量对账')
    expect(scale).toContain('倍率单源在本行')
    const techDoc = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'docs', '标准', '判据体系.md'), 'utf8')
    expect(techDoc).toContain('**参考标尺的校准沿革**')
    // B. 雷点清单：断更/太监行删除、差评与新书期/基本盘措辞改读者体验、变更记录移出
    const mines = ref('novel-design', 'references/雷点清单.md')
    for (const stale of ['断更', '太监', '差评', '基本盘', '新书期', '## 变更记录']) {
      expect(mines, `雷点清单不应残留「${stale}」`).not.toContain(stale)
    }
    // 0.0.53 知识库 v2.8 集成：节奏兑现类补「情感空头支票」增为 5 条
    expect(mines).toContain('## 六、节奏兑现（5 条）')
    expect(mines).toContain('| 结局兑现不了前文承诺，读者回头否定整本书 |')
    // C. 排障索引：症状改为重读感受或审读发现，非结构因素排除段与数据下滑措辞退役
    const trouble = ref('novel-director', 'references/排障-索引与改稿流程.md')
    for (const stale of ['数据', '掉订', '断更', '封面', '章评', '追读缓降']) {
      expect(trouble, `排障索引不应残留「${stale}」`).not.toContain(stale)
    }
    expect(trouble).toContain('| 症状（重读感受或审读发现） | 最可能病因 | 先查 | 再查 | 操作量级 |')
    expect(trouble).toContain('### 应急菜单（短期止血，各有代价）')
    const director = readSkill('novel-director')
    expect(director).toContain('（症状→病因层→查哪节→操作量级＋应急菜单）')
    expect(director).not.toContain('被骂')
    // D. 润色：批 3 平台格式退役（文件删除、两批制、注册表不再登记）
    expect(fs.existsSync(skillFile('novel-polish', 'references/3-平台格式.md')), '润色批 3 平台格式应已删除').toBe(false)
    const polish = readSkill('novel-polish')
    expect(polish).toContain('## 批次（两批；可按作者要求定向执行）')
    expect(polish).toContain('**默认顺序：批 1 → 批 2**')
    expect(polish).not.toContain('平台')
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    expect(contract).toContain("['1-表达清理', '2-节奏与重塑'].map")
    // E. 判据件：读者反馈/追订/掉订改写作中的自查发现
    const deck = ref('novel-design', 'references/大纲-牌局与结构检查.md')
    expect(deck).not.toContain('读者反馈')
    expect(deck).not.toContain('追订')
    expect(deck).toContain('按写作中的发现调整')
    const mapPiece = ref('novel-design', 'references/大纲-换图与支线.md')
    expect(mapPiece).not.toContain('掉订')
    expect(mapPiece).toContain('新图开局是全书熟悉感最低、最容易接不上的窗口')
  })

  it('T3 小修回补批：十件小修清账——9 项新落＋1 项核实已在位（KB v2.4.7，内容面收官）', () => {
    const ref = (skill: string, file: string) => fs.readFileSync(path.join(__dirname, '..', 'skills', skill, file), 'utf8')
    // 项1：附.5 屈辱感判据行落塑造卡（1e7ff06 虚报件回补——判据形态；〔附.5〕溯源标注随 0.0.49 方法论冲突批移出）
    const cards = ref('novel-drafting', 'agents/写作卡.md')
    expect(cards).toContain('屈辱感不写「他很屈辱」，写：他想反抗但动不了（耳鸣、血液上涌、指尖发麻）')
    expect(cards).toContain('最大的否定是无视；他清醒地看着自己受辱却主动屈从')
    expect(cards).toContain('读者看了会不会跟着揪心')
    expect(cards, '0.0.49 方法论冲突批：附录出处标注应移出运行时').not.toContain('〔知识库附录')
    // 项9：行文自查卡插入语行（§7.13 话语标记/语序域，判据式）
    expect(cards).toContain('- 插入语：「说实话／不得不说／某种程度上」式句首插入语成串即删')
    // 项2：附.4 残留四词入 tier4＋其余七词已有位锚（0.0.55 清理：「（附.4，附录不分发）」半句已删，钉句随批更新）
    const clean = ref('novel-polish', 'references/1-表达清理.md')
    expect(clean).toContain('慎用句式清单残留四词')
    for (const w of ['眼神微眯（高频套路表情', 'A市／法拉利（偷懒地名品牌名', '车祸失忆（狗血梗契机']) {
      expect(clean, `tier4 应含残留词目「${w}」`).toContain(w)
    }
    expect(clean).toContain('对白标签族「淡淡道／他说他道」改法在批 2「标签与动作」行')
    // 项3：象征物半层——润色意象节＋细纲★位（两处引 §4.11 溯源）
    const reshape = ref('novel-polish', 'references/2-节奏与重塑.md')
    expect(reshape).toContain('对象带象征义时意象节加查半层——物是否复现、含义是否递进（判据源 §4.11')
    const outlineSpec = ref('novel-outline', 'templates/章细纲固定小节规格.md')
    expect(outlineSpec).toContain('★单元的对象带象征义时加查半层——物是否复现、含义是否递进（判据源 §4.11')
    // 项4：世界书模板增行×2（稀缺资源四问→地图；经济循环→世界规则；源出 §3.10）
    expect(ref('novel-design', 'templates/世界书/地图条目模板.md')).toContain('- 稀缺资源四问：<这张图上人人想要的资源——谁垄断／别人要付什么代价／谁在受害／什么条件下打破垄断')
    expect(ref('novel-design', 'templates/世界书/世界规则条目模板.md')).toContain('- 经济循环：<这条规则让什么流动起来')
    // 项5：层层垫高入作家评审骨架 D1 尾行（挂 §4.13）
    expect(ref('novel-design', 'agents/作家评审.md')).toContain('6. 层层垫高了吗——每个反转的赌注/规模比上一个高吗，还是一路平推到赢（§4.13；故事阶段与关键转折）')
    // 项6：七底版可选菜单入 design 步骤3（源 §2.12 关系公式型——菜单+判据形态）
    const design = ref('novel-design', 'SKILL.md')
    expect(design).toContain('**关系底版菜单（可选）**：感情线对谈时把七种关系底版作候选过一遍（判据 §2.12 感情线怎么写不尬·关系公式型）')
    for (const b of ['欢喜冤家', '黑暗救赎', '霸道总裁', '青梅竹马', '纯洁暧昧', '假戏真做', '相爱相杀']) {
      expect(design, `七底版应含「${b}」`).toContain(b)
    }
    // 项7：§1.1 画面三问半句（KB 源修补的分发面）＋§2.1 五要素枚举已在位现状锚
    expect(ref('novel-design', 'references/开书-构思与验证.md')).toContain('能用一句话说出**核心画面**，过一遍画面三问：')
    expect(ref('novel-design', 'references/人物设计-主角.md'), '项7 之 §2.1 五要素枚举应已在位（现状锚）').toContain('身份定完，再过一遍五要素：')
    // 项8：§8.10 双部件检索位行（KB 源修补的分发面）
    expect(ref('novel-director', 'references/排障-长篇防崩.md')).toContain('| 双部件检索位 | 决策点回查先走台账再叠人设卡：亲历记忆从状态四栏的变更史与"谁知道"栏检索')
    // 项10：§6.6 铺垫三件事并入判断标准区（KB 源修补的分发面）
    expect(ref('novel-outline', 'references/章纲-场景与节奏.md')).toContain('铺垫段只写叠 BUFF 的三件事吗？（反派多嚣张／众人多看衰／主角有什么暗牌')
    // 0.0.53 知识库 v2.8 集成重戳：三处源侧修补件的净版戳（全量戳位由 skills-core 净版纪律断言守）
    for (const [skill, file] of [['novel-design', 'references/开书-构思与验证.md'], ['novel-director', 'references/排障-长篇防崩.md'], ['novel-outline', 'references/章纲-场景与节奏.md']] as const) {
      expect(ref(skill, file), `${file} 净版戳应为 v2.8/v2.9`).toMatch(/源版本 v2\.(?:8|9)/)
    }
  })

  it('0.0.51 开书流程批：参考标尺体量对账与四行＋升级点指针化＋确认前审查＋分卷粗排到全书＋路径 A 体量提示＋世界常量模板＋力量量级表与已展示锚点＋设计动机行', () => {
    const scale = fs.readFileSync(skillFile('novel-design', 'references/参考标尺.md'), 'utf8')
    const design = readSkill('novel-design')
    const ref = (skill: string, file: string) => fs.readFileSync(skillFile(skill, file), 'utf8')
    // A. 参考标尺：体量对账小节＋对账项＋两种用途说明
    expect(scale).toContain('## 附：体量对账')
    expect(scale).toContain('判据单源在本节，其他文件指向这里')
    expect(scale).toContain('章纲与正文执行期不查本表')
    expect(scale).toContain('## 附：长度换算')
    expect(scale).toContain('不按题材加系数')
    for (const item of ['主要人物（核心圈）', '支线', '贯穿伏笔', '大地图', '反派层级与反派密度口径', '关键事件', '续航线', '升级位', '势力与组织', '核心谜团', '卷数与单卷体量', '幕数与幕级检查']) {
      expect(scale, `体量对账对账项应含「${item}」`).toContain(item)
    }
    expect(scale).toContain('低于建议下限的项必须「补足」或「写明理由」')
    // B. 四条体量行已定性化/区间化＋500 万以上不外推
    expect(scale).toContain('| L1-16 |')
    expect(scale).toContain('卷内应有升级位')
    expect(scale).toContain('不设「每 N 章一升级」')
    expect(scale).toContain('| L2-ACT-01B |')
    expect(scale).toContain('卷内单元幕长（幕纲产品单位）')
    expect(scale).toContain('| L1-08 |')
    expect(scale).toContain('| L2-A8-06 |')
    expect(scale).toContain('500 万字以上不外推')
    expect(scale).toContain('超出统计范围')
    // C. 开书-读者与情绪定位：升级点数字已移出（指针化）
    const reader = ref('novel-design', 'references/开书-读者与情绪定位.md')
    expect(reader).not.toContain('50 个升级点')
    expect(reader).not.toContain('20 章、6 万字')
    expect(reader).not.toContain('300 万字不崩')
    expect(reader).toContain('数量照《参考标尺》升级点行')
    // D. design SKILL：体量对账落点路径＋确认前审查一次呈报四部分＋分卷粗排到全书＋路径 A 体量提示
    expect(design).toContain('书房/开书/<书名>/设计草案/体量对账.md')
    expect(design).toContain('**确认前审查**')
    expect(design).toContain('①**体量对账表的不足项**')
    expect(design).toContain('②**跨轨道自检错位项**')
    expect(design).toContain('③**两席评审的发现项（可选）**')
    expect(design).toContain('④**待改清单**')
    expect(design).toContain('分卷粗排到全书')
    expect(design).toContain('粗排时「故事阶段分配」小节标题不带状态')
    expect(design).toContain('卷行一律用阿拉伯数字两位（卷01、卷12）')
    expect(design).toContain('末附一行**体量提示**')
    expect(design).toContain('预定篇幅约需 M 卷（按 L2-A3-01／L1-11 单卷体量行估）')
    // E. 世界常量模板：存在＋五节在位
    const constPath = skillFile('novel-design', 'templates/世界书/世界常量条目模板.md')
    expect(fs.existsSync(constPath), '世界常量条目模板应存在').toBe(true)
    const constTpl = fs.readFileSync(constPath, 'utf8')
    expect(constTpl).toContain('frontmatter 照世界书既有约定')
    expect(constTpl).toContain('留白合法')
    for (const sec of ['## 时代基线', '## 风物速查', '## 称谓与礼制', '## 度量与物价', '## 技术水平']) {
      expect(constTpl, `世界常量模板应含「${sec}」节`).toContain(sec)
    }
    expect(constTpl).toContain('在定稿沉淀时回写进本条目')
    expect(design).toContain('[世界常量条目模板](templates/世界书/世界常量条目模板.md)')
    // F. 力量体系模板：量级表＋同阶差距＋已展示锚点
    const power = ref('novel-design', 'templates/世界书/力量体系条目模板.md')
    expect(power).toContain('## 量级表')
    expect(power).toContain('| 台阶 | 力量 | 速度 | 破坏范围 | 以一敌几 | 续航 | 感知范围 | 恢复 | 越阶代价 |')
    expect(power).toContain('- 同阶差距：')
    expect(power).toContain('## 已展示锚点')
    expect(power).toContain('- 第N章｜<人物>｜<展示了什么>')
    // G. 四份模板设计动机行
    for (const name of ['世界规则', '力量体系', '组织', '地图']) {
      expect(ref('novel-design', `templates/世界书/${name}条目模板.md`), `${name}条目模板应含设计动机行`)
        .toContain('- 设计动机：<这个设定替故事解决什么问题')
    }
    // H. artifact-contract 登记世界常量模板
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    expect(contract, 'artifact-contract 应登记世界常量模板').toContain("'世界常量'")
  })

  it('0.0.52 幕纲批：幕纲工件与写入目标＋幕纲固定段规格＋按幕成批出细纲＋幕末结算六步＋读者评审幕正文对象＋注册单源＋段级刷新清零', () => {
    const design = readSkill('novel-design')
    const outline = readSkill('novel-outline')
    const settle = readSkill('novel-settle')
    // A. 幕纲固定段规格：文件存在＋六个必备段名在位（逐字对齐 core 的 幕纲必备段）＋可选段备料自查
    const memoPath = skillFile('novel-arcplan', 'templates/幕纲固定段规格.md')
    expect(fs.existsSync(memoPath), 'novel-arcplan/templates/幕纲固定段规格.md 应存在（0.0.56 边界重划迁移）').toBe(true)
    const memo = fs.readFileSync(memoPath, 'utf8')
    for (const sec of ['## 本幕故事', '## 线与伏笔', '## 出场人物', '## 查证清单', '## 章组排布', '## 幕末结算']) {
      expect(memo, `幕纲规格应含必备段「${sec}」`).toContain(sec)
    }
    expect(memo, '幕纲规格应含可选段备料自查').toContain('## 备料自查（可选段）')
    expect(memo).toContain('故事剧情/卷规划/卷NN/幕纲/幕NN-<幕名>.md')
    expect(memo).toContain('幕纲段落不完整:<段名>')
    expect(memo).toContain('留白合法')
    expect(memo, '备料自查五项判据单源在本规格').toContain('出场频率自查（防神隐预警）')
    expect(memo).toContain('死亡预埋自查（悼亡法）')
    expect(memo).toContain('信息释放规划（读台账）')
    expect(memo).toContain('**验证到期自查**')
    expect(memo).toContain('**伏笔保温自查**')
    expect(memo, '体量数值单源在参考标尺（本规格不重述数字）').toContain('体量数值单源在《参考标尺》')
    // B.（0.0.56 边界重划：分幕与第一幕幕纲整段移入 novel-arcplan，钉随迁；design 留工件契约「幕纲」行与路径 A 提及）
    const arcDesign = readSkill('novel-arcplan')
    expect(arcDesign).toContain('**分幕与第一幕幕纲**（卷纲确认后）')
    expect(arcDesign).toContain('在卷纲「叙事结构」段把本卷分成若干幕')
    expect(arcDesign).toContain('只为**第一幕**写幕纲')
    expect(arcDesign).toContain('目标: 幕纲')
    expect(arcDesign).toContain('后续幕不在开卷时写')
    expect(arcDesign).toContain('幕是章序调整的授权范围')
    expect(design).toContain('| 幕纲 | `故事剧情/卷规划/卷<NN>/幕纲/幕<NN>-<幕名>.md` |')
    expect(design, '路径 A 也写第一幕幕纲').toContain('第一卷分幕一行')
    // C. outline SKILL：按幕成批出细纲＋来源引用幕纲
    expect(outline).toContain('**按幕成批出细纲（默认节奏）**')
    expect(outline).toContain('进入一幕的第一章前')
    expect(outline).toContain('幕内分批')
    expect(outline).toContain('规划粒度变，确认粒度不变')
    expect(outline).toContain('1. **读窗口、卷纲与本幕幕纲**')
    expect(outline, '确认细纲来源引用加幕纲引用').toContain('来源:故事剧情/卷规划/卷01/幕纲/幕01-<幕名>.md@<版本>')
    expect(outline, '备料段改指针＋一句核对').toContain('备料自查前移')
    expect(outline).toContain('幕纲里排的这一章要埋／要兑现的，细纲里有了吗')
    expect(outline, '旧「滚动窗口段级刷新」措辞清零').not.toContain('滚动窗口段级刷新')
    expect(outline, '旧「批量细纲（可选分支」节名退役').not.toContain('**批量细纲（可选分支')
    // D.（0.0.56 边界重划：幕末结算六步与卷末三件批移入 novel-arcplan，钉随迁；settle 留节头指针）
    const arcSettle52 = readSkill('novel-arcplan')
    expect(arcSettle52).toContain('## 幕末结算（一幕写完时，替代原段级刷新）')
    for (const step of ['核对写时发现遗留', '核对线与伏笔', '更新出场人物状态', '读者通读（可选，作者要才跑）', '写入幕末结算段', '写下一幕幕纲']) {
      expect(arcSettle52, `幕末结算六步应含「${step}」`).toContain(step)
    }
    expect(arcSettle52).toContain('卷对账→卷摘要→下卷注意事项，三件一批')
    expect(arcSettle52).toContain('卷的最后一幕的幕末结算与卷末流程合并做，不重复')
    expect(arcSettle52).toContain('| 幕纲 | `故事剧情/卷规划/卷NN/幕纲/幕NN-<幕名>.md` |')
    expect(settle, '段级刷新行应清零').not.toContain('| 段级刷新 |')
    expect(settle, '0.0.56 边界重划：settle 幕末结算只留指针').toContain('已拆出到《卷幕规划》技能包')
    expect(arcSettle52).toContain('《定调设计》技能包 `agents/读者评审.md`')
    expect(arcSettle52).toContain('「一幕的定稿正文」')
    // E. 读者评审底本：对象类型加「幕正文」＋检查清单小节（原有三张不删）
    const reader = fs.readFileSync(skillFile('novel-design', 'agents/读者评审.md'), 'utf8')
    expect(reader).toContain('全书大纲 / 分卷 / 卷纲 / 幕纲 / 幕正文')
    expect(reader).toContain('### 对象＝幕正文（一幕的定稿正文，0.0.52 幕纲批新增对象类型）')
    expect(reader).toContain('R1 雷点扫描')
    expect(reader).toContain('R2 弃书点预测（本对象最重要）')
    expect(reader).toContain('R3 情绪兑现')
    expect(reader).toContain('**按章定位**')
    expect(reader, '原有三张对象不删').toContain('### 对象＝全书大纲（九部）')
    expect(reader).toContain('### 对象＝分卷（八部）')
    expect(reader).toContain('### 对象＝卷纲（四段＋固定段）')
    // F. 章细纲简写单元试点：规格含节＋标注试点＋字段名保留说明
    const sectSpec = fs.readFileSync(skillFile('novel-outline', 'templates/章细纲固定小节规格.md'), 'utf8')
    expect(sectSpec).toContain('## 简写单元（试点，过渡章可用）')
    expect(sectSpec).toContain('试点声明')
    expect(sectSpec).toContain('关键章仍用全规格')
    expect(sectSpec).toContain('字段名不省')
    expect(sectSpec).toContain('`novel_confirm_outline` 仍校验每单元六个字段名')
    // G. 注册单源：artifact-contract 登记幕纲规格
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    expect(contract, 'artifact-contract 应登记幕纲固定段规格（0.0.56 边界重划移入 novel-arcplan）').toContain("'skills/novel-arcplan/templates/幕纲固定段规格.md'")
    // H. 全 skills 无「段级刷新」；「10-30 章」仅参考标尺
    const skillsRoot = path.join(__dirname, '..', 'skills')
    const walkMd = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
      .flatMap((e) => (e.isDirectory() ? walkMd(path.join(dir, e.name)) : [path.join(dir, e.name)]))
      .filter((p) => p.endsWith('.md'))
    for (const f of walkMd(skillsRoot)) {
      const text = fs.readFileSync(f, 'utf8')
      // 「段级刷新」只允许出现在「替代原段级刷新」「段级刷新改幕末结算」这类声明退役的措辞里
      for (const line of text.split('\n')) {
        if (line.includes('段级刷新')) {
          expect(line, `${path.relative(skillsRoot, f)}: 「段级刷新」只能用于声明退役`).toMatch(/替代原段级刷新|段级刷新改幕末结算/)
        }
      }
    }
    const scale = fs.readFileSync(skillFile('novel-design', 'references/参考标尺.md'), 'utf8')
    for (const f of walkMd(skillsRoot)) {
      if (path.basename(f) === '参考标尺.md') continue
      expect(fs.readFileSync(f, 'utf8'), `${path.relative(skillsRoot, f)}: 幕长数值单源应在参考标尺`).not.toMatch(/一幕约 10-30 章|一幕约 10–30 章/)
    }
    expect(scale).toContain('章数中位 25')
    expect(scale, '幕内分批阈值单源在参考标尺').toContain('幕内分批出细纲')
  })

  it('0.0.53 知识库 v2.8 集成：新增写作技巧逐条落位＋未收录内容负断言＋幕纲规格三处补充', () => {
    const ref = (skill: string, file: string) => fs.readFileSync(skillFile(skill, file), 'utf8')
    // A. novel-design：世界观与人物
    expect(ref('novel-design', 'references/世界观-力量体系与天花板.md'), '规模跟随主角整段').toContain('**规模跟随主角**：人物境界、事件规模、好处兑现、设定披露，一切都跟着主角当前境界走')
    expect(ref('novel-design', 'references/世界观-力量体系与天花板.md'), '事件匹配型一行').toContain('| 事件匹配型 | 大事件的规模也要匹配主角当前境界')
    expect(ref('novel-design', 'references/世界观-力量体系与天花板.md'), '身份被外挂拔空错误行').toContain('| 身份被外挂拔空 |')
    expect(ref('novel-design', 'references/世界观-规则与铁则.md'), '金手指边界型').toContain('| 金手指边界型 |')
    expect(ref('novel-design', 'references/世界观-规则与铁则.md'), '克苏鲁抓灵魂型').toContain('| 克苏鲁抓灵魂型 |')
    expect(ref('novel-design', 'references/人物设计-主角.md'), '非人主角适用').toContain('| 从种族差异往下推（非人主角适用） |')
    expect(ref('novel-design', 'references/人物设计-主角.md'), '主角不能闲着心法').toContain('主角不能闲着')
    expect(ref('novel-design', 'references/人物设计-人物卡工具.md'), '人物表防崩型').toContain('| 人物表防崩型（无大纲作者适用） |')
    expect(ref('novel-design', 'references/人物设计-人物卡工具.md'), '塑人靠情节心法').toContain('塑人靠情节、对白、肢体动作和办的事')
    expect(ref('novel-design', 'references/人物设计-反派.md'), '反派不当众挑衅心法').toContain('反派可以心里不服，但别让他跳出来当众挑衅')
    expect(ref('novel-design', 'references/人物设计-弧光与关系.md'), '暧昧到底型').toContain('| 暧昧到底型 |')
    expect(ref('novel-design', 'references/人物设计-弧光与关系.md'), '关系错位型').toContain('| 关系错位型 |')
    expect(ref('novel-design', 'references/人物设计-弧光与关系.md'), '有限信息系统替代重生').toContain('可用"有限信息系统"替代重生')
    expect(ref('novel-design', 'references/人物设计-弧光与关系.md'), '长线感情线重聚信息差').toContain('重聚时的信息差')
    expect(ref('novel-design', 'references/人物设计-弧光与关系.md'), '评论区攒素材半句应删').not.toContain('这类日常微细节素材可从网上评论区攒')
    expect(ref('novel-design', 'references/人物设计-配角与群像.md'), '异文化真实感心法').toContain('异文化题材（西幻等）的真实感不靠主角的骑士、魔法设定')
    expect(ref('novel-design', 'references/人物设计-配角与群像.md'), '群像价值观载体心法').toContain('群像的魅力不在于同，而在于不同——每个角色都是不同价值观的载体')
    expect(ref('novel-design', 'references/人物设计-配角与群像.md'), '贴标签不是脸谱化心法').toContain('贴标签不是脸谱化')
    expect(ref('novel-design', 'references/人物设计-配角与群像.md'), '条件反射型一行').toContain('| 条件反射型 |')
    expect(ref('novel-design', 'references/人物设计-配角与群像.md'), '双赢写美女后半句应删').not.toContain('别过度迎合少数发声读者')
    expect(ref('novel-design', 'references/人物设计-金手指设计.md'), '真实难点型').toContain('| 真实难点型 |')
    // B. novel-design：卷纲/故事剧情/开书
    expect(ref('novel-design', 'references/卷纲-节奏与高潮.md'), '节奏是信息分配权心法').toContain('节奏本质是手里的**信息分配权**')
    expect(ref('novel-design', 'references/卷纲-节奏与高潮.md'), '空间收缩型').toContain('| 空间收缩型（适用：围困/追杀/副本类封闭危机） |')
    expect(ref('novel-design', 'references/卷纲-卷功能与结构.md'), '作者产能段应不收').not.toContain('码字是大脑持续高速运转的高消耗劳动')
    expect(ref('novel-design', 'references/大纲-主线与骨架.md'), '日常事业流撑长法').toContain('**日常/事业流的另一套撑长法（分歧保留）**')
    expect(ref('novel-design', 'references/大纲-主线与骨架.md'), '剧情从人物互动里长出来').toContain('**剧情从人物互动里长出来**')
    expect(ref('novel-design', 'references/大纲-伏笔埋收.md'), '草蛇灰线·人物编织型').toContain('| 草蛇灰线·人物编织型 |')
    expect(ref('novel-design', 'references/大纲-伏笔埋收.md'), '远期兑现型').toContain('| 远期兑现型（跨章大悬念） |')
    expect(ref('novel-design', 'references/大纲-伏笔埋收.md'), '远期兑现型改后措辞').toContain('中间走岔路看风景也不偏离终点')
    expect(ref('novel-design', 'references/大纲-换图与支线.md'), '资源耗尽型').toContain('| 资源耗尽型（氛围枯竭） |')
    expect(ref('novel-design', 'references/大纲-换图与支线.md'), '换图必然损失开头味道').toContain('换图必然损失一点开头的味道与代入感')
    expect(ref('novel-design', 'references/大纲-换图与支线.md'), '氛围资源预警自查').toContain('氛围资源预警：这张图的核心氛围/类型卖点')
    expect(ref('novel-design', 'references/大纲-牌局与结构检查.md'), '大高潮锚点法').toContain('| 大高潮锚点法 |')
    expect(ref('novel-design', 'references/大纲-牌局与结构检查.md'), '大高潮锚点法去上架').toContain('写出一段后再补大纲')
    expect(ref('novel-design', 'references/大纲-牌局与结构检查.md'), '锚点法不含上架前后').not.toContain('等上架前后再补大纲')
    expect(ref('novel-design', 'references/大纲-牌局与结构检查.md'), '极致细纲人物小传派去作者名').toContain('有作者做几万字细纲＋逐个人物小传，用人物行为逻辑托底防跑偏')
    expect(ref('novel-design', 'references/大纲-牌局与结构检查.md'), '场景卡三要素型').toContain('| 场景卡三要素型（单章细纲颗粒度） |')
    expect(ref('novel-design', 'references/大纲-牌局与结构检查.md'), '写不出时回头复盘').toContain('**写不出时回头复盘、重写大纲**')
    expect(ref('novel-design', 'references/大纲-牌局与结构检查.md'), '切书判断应不收').not.toContain('等过早期推荐位')
    expect(ref('novel-design', 'references/大纲-牌局与结构检查.md'), '十万菜团括注应不收').not.toContain('十万菜团经验')
    expect(ref('novel-design', 'references/开书-参考作品利用.md'), '拆具体技法').toContain('| 拆具体技法 |')
    expect(ref('novel-design', 'references/开书-参考作品利用.md'), '跟风热门题材无基本功').toContain('| 跟风热门题材无基本功 |')
    expect(ref('novel-design', 'references/开书-参考作品利用.md'), '五白分轨应不收').not.toContain('五白分轨')
    expect(ref('novel-design', 'references/开书-构思与验证.md'), '影视漫画/热点桥段改编式').toContain('| 影视漫画/热点桥段改编式 |')
    expect(ref('novel-design', 'references/开书-构思与验证.md'), '七步拼搭型').toContain('| 七步拼搭型（碎灵感组装成完整设定） |')
    expect(ref('novel-design', 'references/开书-构思与验证.md'), '类同人降门槛').toContain('| 类同人降门槛 |')
    expect(ref('novel-design', 'references/开书-构思与验证.md'), '细分空白域').toContain('| 细分空白域 |')
    expect(ref('novel-design', 'references/开书-构思与验证.md'), '舞台自由度型').toContain('| 舞台自由度型 |')
    expect(ref('novel-design', 'references/开书-构思与验证.md'), '年代借力型').toContain('| 年代借力型 |')
    expect(ref('novel-design', 'references/开书-构思与验证.md'), '纯跟风八股无亮点').toContain('| 纯跟风八股无亮点 |')
    expect(ref('novel-design', 'references/开书-构思与验证.md'), '写错题材核心卖点').toContain('| 写错题材核心卖点 |')
    expect(ref('novel-design', 'references/开书-构思与验证.md'), '明末突围例子').toContain('明末突围用**类型杂交+对立张力**')
    expect(ref('novel-design', 'references/开书-构思与验证.md'), '知识型题材案头验证').toContain('知识型题材（学霸/专业文）还要做**案头验证**')
    expect(ref('novel-design', 'references/开书-构思与验证.md'), '编辑筛选测试应不收').not.toContain('编辑筛选测试')
    expect(ref('novel-design', 'references/开书-读者与情绪定位.md'), '氛围流主情绪基调').toContain('**氛围流作品的主情绪=全书基调，开篇就定死**')
    expect(ref('novel-design', 'references/开书-读者与情绪定位.md'), '借成熟框架是捷径').toContain('**借成熟框架是捷径**')
    expect(ref('novel-design', 'references/开书-读者与情绪定位.md'), '说教式探讨人性').toContain('| 说教式探讨人性 |')
    expect(ref('novel-design', 'references/开书-读者与情绪定位.md'), '内核不变论去作者名').toContain('网文的故事内核二十年没变')
    expect(ref('novel-design', 'references/开书-读者与情绪定位.md'), '放松段改后措辞').toContain('放松段要短，并带出新的钩')
    expect(ref('novel-design', 'references/开书-读者与情绪定位.md'), '现实动机应不收').not.toContain('现实动机**：玄幻长线追订')
    // C. novel-outline：章纲四件
    expect(ref('novel-outline', 'references/章纲-章型与开篇.md'), '章末不留钩改后断法').toContain('断在动作刚起、结果未出的临界点')
    expect(ref('novel-outline', 'references/章纲-章型与开篇.md'), '章末钩断法去括注').toContain('- 章末钩子的断法：几乎每章末都留一个钩')
    expect(ref('novel-outline', 'references/章纲-章型与开篇.md'), '章末钩断法不含西幻经验括注').not.toContain('（西幻经验）')
    expect(ref('novel-outline', 'references/章纲-章型与开篇.md'), '背景设定大科普改后').toContain('取舍时先让读者爽，别光顾着自己爽')
    expect(ref('novel-outline', 'references/章纲-章型与开篇.md'), '开头打磨法去作者名').toContain('首章与卷首章值得多版对比')
    expect(ref('novel-outline', 'references/章纲-章型与开篇.md'), '开头打磨法不含黑山老鬼').not.toContain('黑山老鬼')
    expect(ref('novel-outline', 'references/章纲-章型与开篇.md'), '黄金一页制去作者名').toContain('黄金一页制：读者的耐心已经从"黄金三章"缩到"黄金一页"')
    expect(ref('novel-outline', 'references/章纲-章型与开篇.md'), '黄金一页制不含稚嫩小菠萝').not.toContain('稚嫩小菠萝')
    expect(ref('novel-outline', 'references/章纲-章型与开篇.md'), '信息差钩玩法B样板').toContain('信息差钩玩法B的样板')
    expect(ref('novel-outline', 'references/章纲-章型与开篇.md'), '章末钩写不出向下延伸改写').toContain('写不出钩子时，可以往下多写一个小场景把钩带出来')
    expect(ref('novel-outline', 'references/章纲-章型与开篇.md'), '开篇钩情绪双向心法').toContain('开篇钩的情绪方向可双向')
    expect(ref('novel-outline', 'references/章纲-冲突与爽点.md'), '延迟满足型改后').toContain('爽点要攒着压着放，别一上来连放')
    expect(ref('novel-outline', 'references/章纲-冲突与爽点.md'), '关系生梗型').toContain('| 关系生梗型（幽默） |')
    expect(ref('novel-outline', 'references/章纲-冲突与爽点.md'), '固定升级线型').toContain('| 固定升级线型 |')
    expect(ref('novel-outline', 'references/章纲-冲突与爽点.md'), '科普认知爽点型').toContain('| 科普认知爽点型 |')
    expect(ref('novel-outline', 'references/章纲-冲突与爽点.md'), '爽点落在作者身上').toContain('| 爽点落在作者身上 |')
    expect(ref('novel-outline', 'references/章纲-冲突与爽点.md'), '爽点连放错误行').toContain('| 爽点连放/刺激不换样 |')
    expect(ref('novel-outline', 'references/章纲-冲突与爽点.md'), '力量感三招心法').toContain('力量感三招')
    expect(ref('novel-outline', 'references/章纲-冲突与爽点.md'), '幻影式反转心法').toContain('幻影式反转')
    expect(ref('novel-outline', 'references/章纲-冲突与爽点.md'), '这类读者这个篇幅保留').toContain('这类读者、这个篇幅')
    expect(ref('novel-outline', 'references/章纲-场景与节奏.md'), '情绪转向型改后').toContain('一章里至少出现一到两次情绪升降')
    expect(ref('novel-outline', 'references/章纲-场景与节奏.md'), '链条循环型').toContain('| 链条循环型 |')
    expect(ref('novel-outline', 'references/章纲-信息与情绪.md'), '爽感预期型改后').toContain('底牌结构必须提前设计进框架，不能写到哪临时塞')
    expect(ref('novel-outline', 'references/章纲-信息与情绪.md'), '期待感分层经营心法').toContain('期待感是分层经营的')
    // D. novel-drafting：正文六件
    expect(ref('novel-drafting', 'references/正文-场景与动作.md'), '氛围流追问').toContain('氛围流追问：这段氛围我要的是"味"还是"吓"')
    expect(ref('novel-drafting', 'references/正文-场景与动作.md'), '氛围即爽点型').toContain('| 氛围即爽点型 |')
    expect(ref('novel-drafting', 'references/正文-场景与动作.md'), '民俗采风型').toContain('| 民俗采风型 |')
    expect(ref('novel-drafting', 'references/正文-场景与动作.md'), '氛围流同属过程即卖点').toContain('**氛围流同属"过程即卖点"**')
    expect(ref('novel-drafting', 'references/正文-场景与动作.md'), '战术博弈型').toContain('| 战术博弈型 |')
    expect(ref('novel-drafting', 'references/正文-展示与对白.md'), '情绪外化五法').toContain('情绪外化五法')
    expect(ref('novel-drafting', 'references/正文-视角落地.md'), '代入感三层').toContain('代入感三层')
    expect(ref('novel-drafting', 'references/正文-视角落地.md'), '反应镜头型').toContain('| 反应镜头型（适用：要用旁人反衬主角实力/气场时） |')
    expect(ref('novel-drafting', 'references/正文-文笔修炼.md'), '三删键去水型').toContain('| 三删键去水型 |')
    expect(ref('novel-drafting', 'references/正文-文笔修炼.md'), '镜头调度型').toContain('| 镜头调度型 |')
    expect(ref('novel-drafting', 'references/正文-文笔修炼.md'), '跟打拉片应不收').not.toContain('跟打拉片')
    expect(ref('novel-drafting', 'references/正文-开场转场与特殊戏.md'), '分镜式型改后').toContain('写之前先在脑内把这段当漫画/动漫分镜完整放一遍')
    expect(ref('novel-drafting', 'references/正文-开场转场与特殊戏.md'), '身份碰撞型').toContain('| 身份碰撞型 |')
    expect(ref('novel-drafting', 'references/正文-开场转场与特殊戏.md'), '圆满前夕撕碎型').toContain('| 圆满前夕撕碎型 |')
    expect(ref('novel-drafting', 'references/正文-开场转场与特殊戏.md'), '物是人非型').toContain('| 物是人非型 |')
    expect(ref('novel-drafting', 'references/正文-开场转场与特殊戏.md'), '群像转场型').toContain('| 群像转场型（适用：多视角群像文） |')
    expect(ref('novel-drafting', 'references/正文-开场转场与特殊戏.md'), '过渡段四公式').toContain('过渡段四公式')
    // E. novel-director：排障件＋雷点清单
    expect(ref('novel-director', 'references/排障-索引与改稿流程.md'), '先掂量是否大问题').toContain('先掂量这是不是大问题了吗')
    expect(ref('novel-director', 'references/排障-索引与改稿流程.md'), '先掂量不含切书推荐位').not.toContain('两三万字就切成本太低')
    expect(ref('novel-director', 'references/排障-索引与改稿流程.md'), '日常过渡型').toContain('| 日常过渡型 |')
    expect(ref('novel-director', 'references/排障-索引与改稿流程.md'), '日常过渡不含保住更新').not.toContain('保住更新不断更')
    expect(ref('novel-director', 'references/排障-索引与改稿流程.md'), '素材四分库应不收').not.toContain('素材四分库')
    expect(ref('novel-director', 'references/排障-专项修复.md'), '19大毒点应不收').not.toContain('19大毒点')
    expect(ref('novel-director', 'references/排障-长篇防崩.md'), '作者产能节应不收').not.toContain('§8.11')
    expect(ref('novel-director', 'references/排障-长篇防崩.md'), '语音码字应不收').not.toContain('语音码字')
    // 雷点清单：五项补缺入对应类
    const mines = ref('novel-design', 'references/雷点清单.md')
    expect(mines, '人设类增为主线无动机').toContain('## 二、人设（5 条）')
    expect(mines, '叙事信息类增为五条').toContain('## 五、叙事信息（5 条）')
    expect(mines, '节奏兑现类增为五条').toContain('## 六、节奏兑现（5 条）')
    for (const row of ['| **主角无动机** |', '| **回忆杀** |', '| **人口普查式开场** |', '| **系统刷屏** |', '| **情感空头支票** |']) {
      expect(mines, `雷点清单应含补缺行「${row}」`).toContain(row)
    }
    // F. 幕纲固定段规格：三处补充在位
    const memo = fs.readFileSync(skillFile('novel-arcplan', 'templates/幕纲固定段规格.md'), 'utf8')
    expect(memo, '线与伏笔段加远期兑现点').toContain('- 远期兑现点：本幕往后三五十章内要兑现的大盼头')
    expect(memo, '幕末结算段加主角收获盘点').toContain('- 主角本幕收获盘点：本幕主角得到了什么')
    expect(memo, '本幕故事段加阶段目标与终极悬念').toContain('本幕的阶段目标（读者在本幕盼什么）与本幕推进的终极悬念（读者长期追什么），各写一句。')
    // G. 净版戳与未收录内容的全局负断言
    const skillsRoot = path.join(__dirname, '..', 'skills')
    const walkMd = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
      .flatMap((e) => (e.isDirectory() ? walkMd(path.join(dir, e.name)) : [path.join(dir, e.name)]))
      .filter((p) => p.endsWith('.md'))
    const banned = ['五白分轨', '跟打拉片', '编辑筛选测试', '§8.11', '语音码字', '乌贼', '肘子', '黑山老鬼', '稚嫩小菠萝', '风凌天下', '十万菜团']
    for (const f of walkMd(skillsRoot)) {
      const text = fs.readFileSync(f, 'utf8')
      for (const b of banned) {
        expect(text, `${path.relative(skillsRoot, f)}: 不应含未收录内容「${b}」`).not.toContain(b)
      }
    }
  })
  it('0.0.54 润色后移批：director 路由顺序与 novel_record_polish＋drafting 首稿待审稿＋polish「审核通过后」与承接＋review 表达层「留润色」＋settle 前置句＋写前十查③④读脚本', () => {
    // A. director：章节面路由表按新推导顺序（审核→改稿→润色），润色行经 novel_record_polish 承接/跳过
    const director = readSkill('novel-director')
    const chapterTable = director.slice(director.indexOf('章节面：'), director.indexOf('## 提交纪律'))
    const 审核At = chapterTable.indexOf('| 审核 |')
    const 改稿At = chapterTable.indexOf('| 改稿 |')
    const 润色At = chapterTable.indexOf('| 润色 |')
    expect(审核At, '章节面表应有 审核 行').toBeGreaterThan(-1)
    expect(改稿At, '章节面表应有 改稿 行').toBeGreaterThan(-1)
    expect(润色At, '章节面表应有 润色 行').toBeGreaterThan(-1)
    expect(审核At, '审核行应在改稿行之前').toBeLessThan(改稿At)
    expect(改稿At, '改稿行应在润色行之前').toBeLessThan(润色At)
    expect(chapterTable).toContain('novel_record_polish')
    expect(chapterTable).toContain('审核通过后润色')
    // 章内接续：机械步骤改为 备料 → 起草 → 审读 → 润色
    expect(director).toContain('备料 → 起草 → 审读 → 润色')
    // 子代理交接表润色行补「审核通过的待审稿」
    expect(director).toContain('审核通过的待审稿')
    // B. drafting：首稿 角色: 待审稿、选定: true；播报进入《全面审读》；作者稿角色新语义
    const drafting = readSkill('novel-drafting')
    expect(drafting).toContain('`角色: 待审稿`、`生成模块: 写稿`、`版本: 1`')
    expect(drafting).toContain('初稿完成，进入《全面审读》')
    expect(drafting).toContain('交审传 `角色: 待审稿`（默认用法），作者暂存不等交审传 `角色: 草稿`')
    expect(drafting).toContain('缺 `角色` 的稿到不了审核位')
    // C. polish：审核通过后使用＋取源＝当前唯一待审稿＋第 5 步登记承接＋作者稿默认不润色登记跳过
    const polish = readSkill('novel-polish')
    expect(polish).toContain('审核通过后使用')
    expect(polish).toContain('当前唯一待审稿')
    expect(polish).toContain('novel_record_polish')
    expect(polish).toContain('作者稿默认不润色')
    expect(polish).toContain('承接登记成功后播报进入《定稿沉淀》')
    expect(polish, 'polish 不应再播报进入《全面审读》').not.toContain('润色完成播报进入《全面审读》')
    // D. review：表达层发现项留润色＋标准流程末尾进入《精修润色》
    const review = readSkill('novel-review')
    expect(review).toContain('留润色')
    expect(review).toContain('审核完成后进入《精修润色》')
    // 审读底本「建议返回节点」行里的「润色」保留（意为留给润色）
    expect(fs.readFileSync(skillFile('novel-review', 'agents/全量审读.md'), 'utf8')).toContain('润色 / 改稿 / 细纲 / 备料 / 沉淀（账本更正）/ 吃书补偿呈报')
    // E. revision 第 5 步末进入《精修润色》
    expect(readSkill('novel-revision')).toContain('审核完成后进入《精修润色》')
    // F. settle 组包前置补「审核完成且润色已承接（或已登记跳过）」
    expect(readSkill('novel-settle')).toContain('审核完成＋润色已承接或已登记跳过')
    // G. 写前十查③④两条改为先读脚本输出行
    const tenChecks = fs.readFileSync(skillFile('novel-outline', 'agents/写前十查.md'), 'utf8')
    expect(tenChecks).toContain('③伏笔到期')
    expect(tenChecks).toContain('④接钩')
    expect(tenChecks).toContain('出场间隔')
    expect(tenChecks).toContain('幕纲固定段规格.md 备料自查第 1 项')
    // H. 全 skills 不再出现旧播报句（润色后移后旧口径清零）
    const skillsRoot = path.join(__dirname, '..', 'skills')
    const walkMd = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
      .flatMap((e) => (e.isDirectory() ? walkMd(path.join(dir, e.name)) : [path.join(dir, e.name)]))
      .filter((f) => f.endsWith('.md'))
    for (const f of walkMd(skillsRoot)) {
      const text = fs.readFileSync(f, 'utf8')
      expect(text, `${path.relative(skillsRoot, f)}: 不应再含旧播报「初稿完成，进入《精修润色》」`).not.toContain('初稿完成，进入《精修润色》')
      expect(text, `${path.relative(skillsRoot, f)}: 不应再含旧播报「润色完成播报进入《全面审读》」`).not.toContain('润色完成播报进入《全面审读》')
    }
  })

  it('0.0.55 章节循环技能批：查证行＋停笔报告＋待查＋九维审读＋默认处置口径＋沉淀六段与三行制＋取舍行＋规模跟随主角＋对白过句＋三处清理', () => {
    const ref = (skill: string, file: string) => fs.readFileSync(skillFile(skill, file), 'utf8')
    // A. 细纲查证行：规格行式＋outline SKILL 定位段说明（前置条件核对结果节内＋全路径自动切片口径）
    const outlineSpec = ref('novel-outline', 'templates/章细纲固定小节规格.md')
    expect(outlineSpec).toContain('`- 查证：<世界书条目仓内路径>｜<查什么>`')
    expect(outlineSpec).toContain('查证行（写在「前置条件核对结果」节内）')
    const outline = readSkill('novel-outline')
    expect(outline).toContain('查证行（行式见规格「既有节固定行」节）写在「前置条件核对结果」节内')
    expect(outline).toContain('查证行务必写条目全路径')
    // B. 起草停笔报告＋对包核对与待查
    const drafting = readSkill('novel-drafting')
    expect(drafting).toContain('**停笔交停笔报告**：只交一份报告不交稿')
    expect(drafting).toContain('停笔报告优于硬写凑稿')
    expect(drafting).toContain('整章新稿**（含候选事实段）或**停笔报告**（不产稿，草稿区无新文件，状态不变）')
    expect(drafting).toContain('**对包核对**——写到衣着、称谓、物价、能力表现等具体处对照材料包')
    expect(drafting).toContain('`- 待查：<缺的东西>｜<出现在哪一段>`')
    expect(drafting).toContain('**待查项汇总**：收稿后把候选事实段待查项汇总')
    expect(drafting, '负断言：写作心智旧句「不中断不查证」应清零').not.toContain('不中断不查证')
    // C. 九维审读：review SKILL＋全量审读.md＋新单维底本存在＋director agents 计数
    const review = readSkill('novel-review')
    expect(review).toContain('一次派发跑完 9 维')
    expect(review).toContain('一次全量报告要回写 9 次')
    expect(review).toContain('十份审读底本（全量审读＋九份单维底本）')
    expect(review).toContain('世界常量与量级切片：')
    const sweep = ref('novel-review', 'agents/全量审读.md')
    expect(sweep).toContain('# 审读底本：全量审读（9 维合并章程）')
    expect(sweep).toContain('## 维度 9:世界内合理性审读')
    expect(sweep).toContain('依此 9 个维度逐节给出')
    expect(sweep).toContain('世界内合理性审读', 'frontmatter 模块名清单应含第九维')
    const worldConsistencyPath = skillFile('novel-review', 'agents/世界内合理性审读.md')
    expect(fs.existsSync(worldConsistencyPath), 'novel-review/agents/世界内合理性审读.md 应存在').toBe(true)
    const worldConsistency = fs.readFileSync(worldConsistencyPath, 'utf8')
    expect(worldConsistency).toContain('模块名: 世界内合理性审读')
    expect(worldConsistency).toContain('## 审读第一步：真源优先')
    expect(worldConsistency).toContain('## 七层常理')
    expect(worldConsistency).toContain('未建世界常量')
    const director = readSkill('novel-director')
    expect(director).toContain('共 9 份；连同全量审读，agents 目录共 10 个文件')
    // D. 默认处置口径：review SKILL 步骤 6＋director 章内接续
    expect(review).toContain('**默认处置口径（0.0.55）**')
    expect(director).toContain('建议级按《全面审读》默认处置口径处理，定稿呈报汇总')
    // E. 沉淀六段与三行制呈报：沉淀对账第六节＋settle 步骤 1/3/4＋director 交接表
    const reconcile = ref('novel-settle', 'agents/沉淀对账.md')
    expect(reconcile).toContain('# 入档后回写候选')
    for (const section of ['## 人物认知增量', '## 金手指代价', '## 常量回写候选', '## 写时发现分拣建议']) {
      expect(reconcile, `第六节应含 ${section}`).toContain(section)
    }
    expect(reconcile).toContain('不进待定稿包七件、只供主控呈报')
    const settle = readSkill('novel-settle')
    expect(settle).toContain('六段 Markdown（五段时间线变更/账本变更/本书层记忆候选/章摘要/事实变更＋第六节「入档后回写候选」')
    expect(settle).toContain('「**本章只需看这几处**」三行制')
    expect(settle).toContain('按作者在定稿呈报里的表态逐件回写')
    expect(director).toContain('六段候选（五段＋入档后回写候选），不写文件')
    // F. 取舍行：规格可选增补＋outline 写时整合
    expect(outlineSpec).toContain('`- 取舍：为保 <A> 弃 <B>，理由一句`')
    expect(outline).toContain('**取舍显形**')
    // G. 规模跟随主角：幕纲出场人物段＋写前十查②
    const memo = ref('novel-arcplan', 'templates/幕纲固定段规格.md')
    expect(memo).toContain('**人物规模跟随主角当前位阶**')
    const tenChecks = ref('novel-outline', 'agents/写前十查.md')
    expect(tenChecks).toContain('出场人物规模是否跟随主角当前位阶（对照幕纲『出场人物』段）一并核')
    // H. 对白过句：polish 润色心智＋批 2 判据
    const polish = readSkill('novel-polish')
    expect(polish).toContain('**对白过句**：批 2 时对白逐句过三问')
    expect(ref('novel-polish', 'references/2-节奏与重塑.md')).toContain('对白逐句过三问')
    // I. 三处清理：附录不分发清零＋全仓（skills＋docs）旧敏感词清零（字面量用转义拼，保证 grep 核对面也干净）
    expect(ref('novel-polish', 'references/1-表达清理.md'), '附录不分发应清零').not.toContain('附录不分发')
    const skillsRoot = path.join(__dirname, '..', 'skills')
    const walkMd = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
      .flatMap((e) => (e.isDirectory() ? walkMd(path.join(dir, e.name)) : [path.join(dir, e.name)]))
      .filter((p) => p.endsWith('.md'))
    for (const f of [...walkMd(skillsRoot), ...walkMd(path.join(__dirname, '..', '..', '..', 'docs'))]) {
      const text = fs.readFileSync(f, 'utf8')
      const legacyWord = '\u732B\u817B' // 旧措辞字面不落盘（含本测试文件），转义拼接
      expect(text, `${f}: 不应含旧敏感词`).not.toContain(legacyWord)
    }
    // J. 润色承接后再要求润色＝换稿
    expect(polish).toContain('**承接登记后再要求润色＝换稿**')
  })

  it('0.0.56 边界重划批：novel-arcplan 技能与关键句＋两张步骤卡＋规格迁移＋design/settle 瘦身＋章细纲步骤卡试点＋director 路由＋注册单源', () => {
    const arc = readSkill('novel-arcplan')
    // A. SKILL 存在与关键句：多方向五条、台账建账、幕末结算六步、卷末四件
    for (const pin of [
      '### 强制多方向（本卷首次确认卷纲前必跑；卷纲修订与滚窗不跑，路径 A 不跑）',
      '不参与发散', '典型版', '代价与放弃项', '`已排除走向` 只记作者明确否决的走向',
      '### 卷规划', '信息释放台账建账', '揭示域清单', '卷02 起不开新账', '五核对项', '结构类型行', '心动位行',
      '**卷级交叉思考**（卷纲正文写完、确认工具调用前过一遍', '三线断档红线」行核对', '越线必须重排，不得带病确认',
      '**分幕与第一幕幕纲**（卷纲确认后）', '只为**第一幕**写幕纲', '目标: 幕纲', '幕是章序调整的授权范围',
      '## 幕末结算（一幕写完时，替代原段级刷新）',
      '核对写时发现遗留', '核对线与伏笔', '更新出场人物状态', '读者通读（可选，作者要才跑）', '写入幕末结算段', '写下一幕幕纲',
      '幕纲未建的旧书（未分幕）：本流程跳过',
      '## 卷末与卷摘要（当前卷收束后）', '卷对账→卷摘要→下卷注意事项，三件一批', '候选（只算不写）', '卷摘要候选.mjs', '目标: 卷摘要', '不设上限、不截断', '下卷注意·卷<NN+1>：',
      '《定调设计》技能包 references/卷纲-节奏与高潮.md、卷纲-情节类型骨架.md、卷纲-卷功能与结构.md（整读）',
      '按 [步骤卡-卷规划](templates/步骤卡-卷规划.md)', '按 [步骤卡-幕末结算](templates/步骤卡-幕末结算.md) 走',
    ]) {
      expect(arc, `novel-arcplan SKILL 应含「${pin.slice(0, 18)}…」`).toContain(pin)
    }
    // B. 两张步骤卡存在且含步序、六字段与深挖指针
    const cardVol = fs.readFileSync(skillFile('novel-arcplan', 'templates/步骤卡-卷规划.md'), 'utf8')
    for (const step of ['## 步 1 读上卷遗产', '## 步 2 多方向（首卷纲前必跑）', '## 步 3 卷末画面与压力升级检查', '## 步 4 分幕（每幕一行）', '## 步 5 第一幕幕纲（照规格）', '## 步 6 台账与窗口', '## 步 7 呈确认写入']) {
      expect(cardVol, `步骤卡-卷规划应含步序「${step}」`).toContain(step)
    }
    for (const field of ['- 先做：', '- 再做：', '- 同时想：', '- 延伸到：', '- 判据要点：', '- 深挖：']) {
      expect(cardVol.split('\n').filter((l) => l.trim().startsWith(field)).length, `步骤卡-卷规划七步均应带「${field}」`).toBe(7)
    }
    expect(cardVol).toContain('《定调设计》技能包 references/卷纲-节奏与高潮.md')
    expect(cardVol).toContain('卷级交叉思考·三线断档红线')
    const cardAct = fs.readFileSync(skillFile('novel-arcplan', 'templates/步骤卡-幕末结算.md'), 'utf8')
    for (const step of ['## 步 1 核对写时发现遗留', '## 步 2 核线与伏笔', '## 步 3 更新人物状态', '## 步 4 读者通读（可选，作者要才跑）', '## 步 5 写幕末结算段', '## 步 6 写下一幕幕纲']) {
      expect(cardAct, `步骤卡-幕末结算应含步序「${step}」`).toContain(step)
    }
    expect(cardAct).toContain('《定调设计》技能包 references/大纲-伏笔埋收.md')
    expect(cardAct).toContain('《定调设计》技能包 agents/读者评审.md 的「对象＝幕正文」节')
    expect(cardAct).toContain('templates/幕纲固定段规格.md「幕末结算」节')
    // C. 两份规格在新位置且内容未变（对一两句钉）；旧位置清零
    const volSpec = fs.readFileSync(skillFile('novel-arcplan', 'templates/卷纲固定段规格.md'), 'utf8')
    const memoSpec = fs.readFileSync(skillFile('novel-arcplan', 'templates/幕纲固定段规格.md'), 'utf8')
    expect(fs.existsSync(skillFile('novel-design', 'templates/卷纲固定段规格.md'))).toBe(false)
    expect(fs.existsSync(skillFile('novel-design', 'templates/幕纲固定段规格.md'))).toBe(false)
    expect(volSpec).toContain('层层递进引爆型')
    expect(volSpec).toContain('## 方向选择（末尾小节，强制多方向确认后才有）')
    expect(memoSpec).toContain('## 备料自查（可选段）')
    expect(memoSpec).toContain('**人物规模跟随主角当前位阶**')
    // D. design 瘦身：无多方向/卷规划正文，只有指针；对谈纪律第 6 条整件读保留（开书不试点）
    const design = readSkill('novel-design')
    expect(design).toContain('步骤 5/6 见《卷幕规划》技能包')
    for (const stale of ['不参与发散', '典型版', '代价与放弃项', '信息释放台账建账（卷01 卷纲首次确认前，一次性）**：从全书大纲与世界书条目提取', '**分幕与第一幕幕纲**（卷纲确认后）', '**卷级交叉思考**（卷纲正文写完']) {
      expect(design, `design 多方向/卷规划正文「${stale.slice(0, 14)}…」应清零（只有指针）`).not.toContain(stale)
    }
    expect(design, '开书不试点：对谈纪律第 6 条整件读保留').toContain('判据**整件读入**，不按节切读')
    // E. settle 瘦身：无幕末结算六步与卷末正文，只有指针；工件契约四行与工具表便签行随迁
    const settle = readSkill('novel-settle')
    expect(settle, 'settle 幕末结算留指针').toContain('已拆出到《卷幕规划》技能包——六步')
    for (const stale of ['**写入幕末结算段**：把上述结果', '**写下一幕幕纲**：按', '**更新出场人物状态**：本幕主要人物', '卷对账→卷摘要→下卷注意事项，三件一批——卷的最后一幕', '目标: 卷摘要', '卷摘要候选.mjs --book']) {
      expect(settle, `settle 幕末/卷末正文「${stale.slice(0, 14)}…」应清零（只有指针）`).not.toContain(stale)
    }
    for (const row of [
      '| 卷摘要 | `故事剧情/卷规划/卷<NN>/卷摘要.md` |',
      '| 卷对账（卷级） | `<工作范围>/书房/卷末/<书名>/卷<NN>-卷对账.md` |',
      '| 幕纲 | `故事剧情/卷规划/卷NN/幕纲/幕NN-<幕名>.md` |',
      '| 下卷注意事项 | `故事剧情/分卷布局.md`「卷间衔接」节的待补便签 |',
    ]) {
      expect(settle, `settle 工件契约行「${row.slice(0, 6)}…」应随迁 arcplan`).not.toContain(row)
      expect(arc, `arcplan 工件契约应含「${row.slice(0, 6)}…」`).toContain(row)
    }
    expect(settle, '工具表 novel_note_pending 卷末便签行应随迁').not.toContain('| `novel_note_pending` |')
    // F. 章细纲步骤卡试点（第二处）：卡步序＋outline 接线句
    const outline = readSkill('novel-outline')
    const cardChapter = fs.readFileSync(skillFile('novel-outline', 'templates/步骤卡-章细纲.md'), 'utf8')
    expect(outline).toContain('思考程序按 [步骤卡-章细纲](templates/步骤卡-章细纲.md) 走')
    expect(outline).toContain('深挖判据件（照步骤卡「深挖」列）：《章纲-信息与情绪》等四件，整读')
    expect(outline).toContain('写时整合是落定位段各节时的心智，步骤卡是落笔前的排程——两者并用不互斥')
    for (const step of ['## 步 1 本章任务', '## 步 2 核心场面', '## 步 3 停在哪', '## 步 4 怎么走过去', '## 步 5 边界与核对', '## 步 6 写前十查与呈确认']) {
      expect(cardChapter, `步骤卡-章细纲应含步序「${step}」`).toContain(step)
    }
    for (const field of ['- 先做：', '- 再做：', '- 同时想：', '- 延伸到：', '- 判据要点：', '- 深挖：']) {
      expect(cardChapter.split('\n').filter((l) => l.trim().startsWith(field)).length, `步骤卡-章细纲六步均应带「${field}」`).toBe(6)
    }
    expect(cardChapter).toContain('《章纲-信息与情绪》的 §6.7「信息怎么分配」')
    // G. director 技能加载表 12 行含 arcplan＋节点路由指针
    const director = readSkill('novel-director')
    expect(director).toContain('| 卷幕规划 | `novel-arcplan` |')
    expect(director).toContain('| 当前卷规划 | 《卷幕规划》')
    expect(director).toContain('幕末则走《卷幕规划》幕末结算六步')
    // H. 注册单源：artifact-contract 加 arcplan 技能与三张步骤卡、两模板路径改新位置
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    expect(contract).toContain("'novel-arcplan'")
    for (const rel of [
      'skills/novel-arcplan/templates/卷纲固定段规格.md',
      'skills/novel-arcplan/templates/幕纲固定段规格.md',
      'skills/novel-arcplan/templates/步骤卡-卷规划.md',
      'skills/novel-arcplan/templates/步骤卡-幕末结算.md',
      'skills/novel-outline/templates/步骤卡-章细纲.md',
    ]) {
      expect(contract, `artifact-contract 应登记 ${rel}`).toContain(`'${rel}'`)
    }
    expect(contract, '旧位置注册应清零（卷纲固定段规格）').not.toContain("'skills/novel-design/templates/卷纲固定段规格.md'")
    expect(contract, '旧位置注册应清零（幕纲固定段规格）').not.toContain("'skills/novel-design/templates/幕纲固定段规格.md'")
  })
})
describe('skills 批次防回退断言组·0.0.57 规模批', () => {
  it('0.0.57 长篇规模批：settle 清理句＋arcplan 幕末结算第 1 步新口径＋草稿清理薄入口注册＋版本字段契约句', () => {
    // A. settle 沉淀步:定稿清理句(五处+快照+写时发现先分拣)
    const settle = readSkill('novel-settle')
    expect(settle).toContain('入档成功后自动清理本章草稿区五处')
    expect(settle).toContain('入档前先完成写时发现分拣')
    expect(settle).toContain('草稿清理.mjs')
    // B. arcplan 幕末结算第 1 步新口径(草稿区随定稿清理,核对 pending 遗留)
    const arc = readSkill('novel-arcplan')
    expect(arc).toContain('核对写时发现遗留')
    expect(arc).toContain('novel_note_pending` 里标「写时发现」来源的未消化条目')
    const card = fs.readFileSync(skillFile('novel-arcplan', 'templates/步骤卡-幕末结算.md'), 'utf8')
    expect(card).toContain('## 步 1 核对写时发现遗留')
    expect(card).toContain('草稿区随定稿清理')
    // C. 草稿清理薄入口:文件在+artifact-contract thinScripts 注册
    expect(fs.existsSync(skillFile('novel-settle', 'scripts/草稿清理.mjs')), '草稿清理.mjs 应存在').toBe(true)
    const thin = fs.readFileSync(skillFile('novel-settle', 'scripts/草稿清理.mjs'), 'utf8')
    expect(thin).toContain("draftCleanupCli")
    // 薄入口必须指向 lib/cli.js（只依赖 Node 内置的独立运行库），不能指向 lib/index.js
    // ——后者把 @deepseek-ai/* 留给宿主提供，普通 Node 进程跑到它会 Cannot find package。
    expect(thin).toContain("lib/cli.js")
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    expect(contract, 'artifact-contract thinScripts 应注册草稿清理').toContain("['skills/novel-settle/scripts/草稿清理.mjs', 'draftCleanupCli']")
    // D. 版本字段契约句(novel-design 与 novel-arcplan 工件契约)
    expect(readSkill('novel-design')).toContain('0.0.57 起 frontmatter 版本字段')
    expect(arc).toContain('0.0.57 起 frontmatter 版本字段')
    // E. 文档同步:书仓格式新键段
    const format = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'docs', '标准', '书仓格式.md'), 'utf8')
    expect(format).toContain('卷NN-NNNN-章名')
    expect(format).toContain('旧格式 `卷NN-章名`（无章号）读侧兼容')
    expect(format).toContain('0.0.57 起 frontmatter 带版本字段')
  })
})

describe('skills 批次防回退断言组·0.0.58 素材库批', () => {
  it('0.0.58 素材库与采风批：八部重排＋十列时效＋两源采风＋站点路由表＋融合三条＋四分管法＋桥段参照＋inspiration 负钉＋director 13 行＋种子索引八部行', () => {
    const forage = readSkill('novel-forage')
    const researcher = fs.readFileSync(skillFile('novel-forage', 'agents/采风检索.md'), 'utf8')
    // A. 八部名与子标（建库初始化八目录＋各部子标）
    for (const kw of ['`人/`', '`地/`', '`物/`', '`事/`', '`知/`', '`言/`', '`象/`', '`镜/`']) {
      expect(forage, `建库初始化应含「${kw}」部目录`).toContain(kw)
    }
    for (const sub of ['人设标签', '反差矛盾点', '方言风物', '地域景观', '现实场所', '年代器物', '物价', '日常物件', '时事与社会情绪', '真实案件奇闻', '历史事件', '冷知识', '行业职业细节', '游戏规则机制', '设定概念模式', '金句语感', '命名构词', '黑话', '诗词古文', '雅称谚典', '意象母题', '文化元素', '感官素材', '影视动漫桥段', '对标观察']) {
      expect(forage, `八部子标应含「${sub}」`).toContain(sub)
    }
    expect(forage).toContain('部总数 8 封顶')
    // B. 零件卡十列时效（三态值式＋必填口径＋种子既有行机械补长青）
    expect(forage).toContain('已用于｜时效')
    expect(forage).toContain('时效三态')
    expect(forage).toContain('默认且**必填**——长青就写长青')
    expect(forage).toContain('时效｜首发YYYY-MM-DD｜半衰期约N月')
    expect(forage).toContain('年代锚｜流行于YYYY年代')
    expect(forage).toContain('供年代文/重生文对表')
    let appended = 0
    for (const d of ['人', '知', '言', '象', '镜']) {
      const card = fs.readFileSync(skillFile('novel-forage', `assets/灵感库种子/${d}/零件卡.md`), 'utf8')
      appended += (card.match(/长青 \|$/gm) ?? []).length
    }
    expect(appended, '种子既有零件行应机械追加长青（人17＋知10＋言54＋象40＋镜10＝131）').toBe(131)
    // C. 两源采风（素材库＋网络；知识库源退役——负断言）
    expect(forage).toContain('**两源**')
    expect(researcher).toContain('检索流程（两源依次）')
    expect(researcher).toContain('第一源·素材库')
    expect(researcher).toContain('降级素材库单源')
    expect(researcher, '底本不应残留「知识库＝」三源句').not.toContain('知识库＝')
    expect(researcher, '知识库第一源口径应退役').not.toContain('第一源·知识库')
    // D. 站点路由表（六类需求×首选备选，站名写通称）
    expect(researcher).toContain('站点路由表')
    for (const row of ['时事热点与社会情绪', '行业职业细节', '冷知识', '方言风物', '游戏机制', '影视桥段']) {
      expect(researcher, `站点路由表应含「${row}」需求行`).toContain(row)
    }
    expect(researcher).toContain('站名写通称不写死域名')
    expect(researcher).toContain('先经验后默认')
    // E. 融合三条（选→化→落→记 之后）
    expect(forage).toContain('融合规则三条')
    expect(forage).toContain('叙述者慎用')
    expect(forage).toContain('只取**机制**不搬原句')
    expect(forage).toContain('**不娱乐化**')
    // F. 四分管法（检索视图，不另建目录）
    expect(forage).toContain('四分管法（检索视图）')
    for (const v of ['人设标签库', '剧情钩子库', '金句语感库', '对标拆书库']) {
      expect(forage, `四分视图应含「${v}」`).toContain(v)
    }
    expect(forage).toContain('素材仍存八部不分家')
    // G. 触发源六个（新增幕纲锚点缺素材；arcplan 侧接线句）
    expect(forage).toContain('触发源六个')
    expect(forage).toContain('幕纲锚点缺素材')
    expect(researcher).toContain('幕纲锚点缺素材')
    expect(readSkill('novel-arcplan')).toContain('标【待采风】的项在写幕纲时即可派《素材库与采风》')
    // H. 桥段参照（剧情结构写法零件迁出灵感库）：判据件存在＋四件结构＋outline 双参照①指针
    const bridge = fs.readFileSync(skillFile('novel-outline', 'references/桥段参照.md'), 'utf8')
    expect(bridge).toContain('卡文桥段的写法参照，细纲双参照①机制卡之外的本地参照面')
    for (const piece of ['**意图**', '**判据**', '**路径**', '**错误**']) {
      expect(bridge, `桥段参照四件结构应含「${piece}」`).toContain(piece)
    }
    expect(readSkill('novel-outline')).toContain('本地桥段参照见本技能包 references/桥段参照.md（写前找桥段范式时读）')
    // I. inspiration 无灵感库正文（负钉）＋指针与 Off-limits 新口径
    const inspiration = readSkill('novel-inspiration')
    expect(inspiration).toContain('已独立成《素材库与采风》')
    expect(inspiration, 'inspiration 不应残留建库正文（建库初始化）').not.toContain('十个类别子目录')
    expect(inspiration, 'inspiration 不应残留翻库正文（三去向）').not.toContain('翻到零件后三去向')
    expect(inspiration, 'inspiration 不应残留裁决归档正文').not.toContain('裁决交互与归档')
    expect(inspiration).toContain('本技能不派子代理（采风 agent 在《素材库与采风》）')
    // J. director 13 行（技能表加「素材库与采风｜novel-forage」）
    const director = readSkill('novel-director')
    expect(director).toContain('| 素材库与采风 | `novel-forage` |')
    const routes = [...director.matchAll(/^\| ([^|]+) \| `(novel-[a-z-]+)` \|$/gm)]
    expect(routes, '技能加载表应为 13 行').toHaveLength(13)
    // K. 种子迁移后 索引.md 八部行（每部一行：部名｜零件数｜一句话范围｜最近更新）
    const seedIndex = fs.readFileSync(skillFile('novel-forage', 'assets/灵感库种子/索引.md'), 'utf8')
    for (const part of ['人', '地', '物', '事', '知', '言', '象', '镜']) {
      expect(seedIndex, `种子索引应含「${part}」部行`).toContain(`| ${part} |`)
    }
    expect(seedIndex).toContain('＝131')
    // L. intake 标签清理（'记忆提案'→'本书记忆提案'）
    const intake = fs.readFileSync(path.join(__dirname, '..', '..', 'core', 'src', 'inspire', 'intake.ts'), 'utf8')
    expect(intake).toContain("'本书记忆提案'")
    expect(intake, 'intake 不应残留旧标签字面量').not.toContain("'记忆提案'")
    // M. 注册单源：artifact-contract 登记 forage 技能＋agents＋种子＋桥段参照
    const contract = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'artifact-contract.mjs'), 'utf8')
    expect(contract).toContain("'novel-forage'")
    expect(contract).toContain("'skills/novel-forage/agents/采风检索.md'")
    expect(contract).toContain("'skills/novel-outline/references/桥段参照.md'")
    expect(contract).toContain("'skills/novel-forage/assets/灵感库种子/索引.md'")
  })
})

describe('skills 批次防回退断言组·0.0.59 标尺指针化批', () => {
  it('0.0.59 标尺指针化批：判据件升级点容量线行数字改纯指针（数量与节奏照参考标尺）＋单源在参考标尺', () => {
    const reader = fs.readFileSync(skillFile('novel-design', 'references/开书-读者与情绪定位.md'), 'utf8')
    // A. 判据件第 196 行升级点容量线行：删「每点约 20 章」数字，改纯指针（0.0.59 指针化——数量与节奏都照参考标尺）
    expect(reader).toContain('数量与节奏照《参考标尺》升级点行')
    // B. 负钉：判据件不再含升级点数字（单源在 参考标尺.md 升级点行，数字钉由 0.0.51 组「约 50 个撑 300 万字、每点约 20 章」守）
    expect(reader, '判据件不应残留「每点约 20 章」数字（单源在参考标尺）').not.toContain('每点约 20 章')
  })
})

describe('skills 批次防回退断言组·0.0.62 审查修复批', () => {
  it('0.0.62 审查修复批：draft-paths 章号比对＋六技能新键路径抽查＋revision 承接句＋幕纲规格单源注＋outline N≤5 指针句', () => {
    // A. P2-1 draft-paths 章号比对：认领循环带「已定位章不认领别章同名候选」守卫（0000 占位与旧格式无号仍可认领）
    const draftPaths = fs.readFileSync(path.join(__dirname, '..', '..', 'core', 'src', 'repo', 'draft-paths.ts'), 'utf8')
    expect(draftPaths, 'resolveCandidateOutlineRel 应含章号比对守卫').toContain('候选章 > 0 && 候选章 !== (key.章 ?? 0)')
    // B. P2-2 六技能新键路径抽查两处＋全套负钉（旧两段式 `卷<NN>-<章名>` 清零）
    const drafting = readSkill('novel-drafting')
    expect(drafting).toContain('稿件路径＝`草稿区/草稿/卷<NN>-<NNNN>-<章名>/稿<N>.md`（章号四位，与确认细纲同号）')
    const settle = readSkill('novel-settle')
    expect(settle).toContain('`草稿区/定稿准备/卷<NN>-<NNNN>-<章名>/`（七件＋`清单.json`）')
    for (const name of ['novel-outline', 'novel-drafting', 'novel-review', 'novel-revision', 'novel-polish', 'novel-settle']) {
      expect(readSkill(name), `${name} SKILL 不应残留旧两段式路径 卷<NN>-<章名>`).not.toContain('卷<NN>-<章名>')
    }
    // C. P3-15 revision 承接句
    expect(readSkill('novel-revision')).toContain('润色经 `novel_record_polish` 登记承接（作者稿登记跳过）')
    // D. P3-14 幕纲固定段规格「≤3 章」升级节点单源注
    const actSpec = fs.readFileSync(skillFile('novel-arcplan', 'templates/幕纲固定段规格.md'), 'utf8')
    expect(actSpec).toContain('定义单源在《定调设计》技能包 templates/世界书/力量体系条目模板.md『升级节点』行')
    // E. P3-13 outline N≤5 指针句（数字退役，单源在参考标尺「幕内分批出细纲」行）
    const outline = readSkill('novel-outline')
    expect(outline).toContain('一次按《参考标尺》「L2-A4-06 幕内分批出细纲」行上限取')
    expect(outline, '「一次 N ≤5 章」数字应退役（单源在参考标尺）').not.toContain('一次 N ≤5 章')
  })
})

describe('skills 批次防回退断言组·0.0.63 DSH 适配批', () => {
  it('0.0.63 DSH 基线适配：基线/依赖版本/working-directory/invariants 移除/宿主验收 profile', () => {
    const root = path.join(__dirname, '..', '..', '..')
    // A. 基线版本、commit 与 dist-tag
    const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'dsh-baseline.json'), 'utf8'))
    expect(baseline.source).toMatchObject({
      tag: 'dsh-v0.2.1-rc.3',
      version: '0.2.1-rc.3',
      commit: '1f81c047fc48fa190a683e469daa699857e9afe8',
      sessionFormat: 4,
    })
    expect(baseline.registry).toMatchObject({ version: '0.2.1-rc.3', sourceDistTag: 'next' })
    // B. bundle 的 DSH 依赖全部随基线（catalog 项由 workspace 单源守）
    const bundlePkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))
    for (const [name, version] of Object.entries({ ...bundlePkg.devDependencies, ...bundlePkg.peerDependencies })) {
      if (!name.startsWith('@deepseek-ai/dsh') || version === 'catalog:') continue
      expect(version, `${name} 应随 DSH 0.2.1-rc.3 基线`).toBe('0.2.1-rc.3')
    }
    expect(bundlePkg.devDependencies['@deepseek-ai/dsh-invariants'], 'DSH 0.2.1 已移除 dsh-invariants').toBeUndefined()
    expect(bundlePkg.devDependencies['@deepseek-ai/dsh-working-directory']).toBe('0.2.1-rc.3')
    // C. catalog 与 lockfile 不再残留旧基线
    const workspace = fs.readFileSync(path.join(root, 'pnpm-workspace.yaml'), 'utf8')
    expect(workspace).toContain("'@deepseek-ai/cordis': 4.0.5")
    expect(workspace).not.toContain('0.2.0-rc.2')
    // D. 真实宿主验收 profile 补 working-directory（tool-fs 0.2.1 的 inject 前置）
    const profile = fs.readFileSync(path.join(__dirname, 'fixtures', 'host-loader.mjs'), 'utf8')
    expect(profile).toContain("{ id: 'working-directory', name: '@deepseek-ai/dsh-working-directory' }")
  })
})

describe('skills 批次防回退断言组·0.0.65 门禁单源批', () => {
  it('0.0.65 门禁单源：core decideBookWrite / bundle 委托 / 文档残余 / 两组不变量测试在位', () => {
    const root = path.join(__dirname, '..', '..', '..')
    const core = fs.readFileSync(path.join(root, 'packages/core/src/gate/preExecute.ts'), 'utf8')
    expect(core).toContain('export function decideBookWrite')
    expect(core).toContain('return decideBookWrite(bookRoot, target)')
    const bundleGates = fs.readFileSync(path.join(root, 'packages/bundle/src/gates.ts'), 'utf8')
    expect(bundleGates).toContain('decideBookWrite')
    expect(bundleGates, 'bundle 不应再自行组合写稿门槛').not.toMatch(/gateWriteDraft\s*\(/)
    const docs = fs.readFileSync(path.join(root, 'docs/技术/现状.md'), 'utf8')
    expect(docs).toContain('文件工具写入不受 Abzu 门禁保护')
    expect(fs.existsSync(path.join(root, 'packages/core/tests/gate-decide.spec.ts'))).toBe(true)
    expect(fs.existsSync(path.join(root, 'packages/bundle/tests/gate-invariants.spec.ts'))).toBe(true)
  })
})

describe('skills 批次防回退断言组·0.0.66 v2.9 方法论批', () => {
  it('0.0.66 v2.9-A/B：关键判据/模板在位，铁则口径未被静默改写', () => {
    const root = path.join(__dirname, '..', '..', '..')
    const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8')
    expect(read('packages/bundle/skills/novel-drafting/references/正文-场景与动作.md')).toContain('打斗五步与燃点')
    expect(read('packages/bundle/skills/novel-drafting/references/正文-展示与对白.md')).toContain('对话三层与人物语言四层')
    expect(read('packages/bundle/skills/novel-outline/references/章纲-信息与情绪.md')).toContain('信息差三型与两个条件')
    expect(read('packages/bundle/skills/novel-design/templates/世界书/人物档案条目模板.md')).toContain('选择链（可选')
    expect(read('packages/bundle/skills/novel-arcplan/templates/卷纲固定段规格.md')).toContain('卷末三锚点核对')
    expect(read('packages/bundle/skills/novel-outline/references/章纲-场景与节奏.md')).toContain('情感容量与四层弧线')
    expect(read('packages/bundle/skills/novel-outline/references/章纲-章型与开篇.md')).toContain('黄金三章分工')
    expect(read('packages/bundle/skills/novel-design/SKILL.md')).toContain('世界观-地图与势力')
    // 铁则“绝对不能打破”是既有口径，v2.9-B 不得静默改成“默认不可打破”
    expect(read('packages/bundle/skills/novel-design/references/世界观-规则与铁则.md')).toContain('绝对不能打破')
    expect(read('packages/bundle/skills/novel-design/references/世界观-规则与铁则.md')).not.toContain('默认不可打破')
  })
})

describe('skills 批次防回退断言组·0.0.67 v2.9-C 裁决批', () => {
  it('0.0.67：大纲记录型定稿＋可写性自检＋铁则默认绝对与登记例外', () => {
    const root = path.join(__dirname, '..', '..', '..')
    const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8')
    const outline = read('packages/bundle/skills/novel-design/references/大纲-牌局与结构检查.md')
    expect(outline).toContain('大纲确认点、初衷三层与可写性')
    expect(outline).toContain('废弃方案')
    expect(outline).toContain('每 3–5 万字')
    expect(read('packages/bundle/skills/novel-outline/templates/章细纲固定小节规格.md')).toContain('可写性自检')
    expect(read('packages/bundle/skills/novel-director/references/排障-长篇防崩.md')).toContain('大纲校准（每 3–5 万字）')
    const rules = read('packages/bundle/skills/novel-design/references/世界观-规则与铁则.md')
    expect(rules).toContain('默认绝对不能打破')
    expect(rules).toContain('作者显式')
    expect(rules).not.toContain('默认不可打破')
    const template = read('packages/bundle/skills/novel-design/templates/世界书/世界规则条目模板.md')
    expect(template).toContain('例外：')
    expect(template).toContain('打破条件：')
    expect(template).toContain('破例记录：')
    expect(read('packages/bundle/skills/novel-review/agents/世界内合理性审读.md')).toContain('铁则破例另查')
  })
})

describe('skills 批次防回退断言组·0.0.68 性能批', () => {
  it('0.0.68：compact/懒装配/进度截断/材料摘要/沉淀与审读契约修复在位', () => {
    const root = path.join(__dirname, '..', '..', '..')
    const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8')
    expect(read('packages/bundle/src/scripts/materials-cli.ts')).toContain('全文')
    expect(read('packages/core/src/progress/index.ts')).toContain('chapterListText')
    expect(read('packages/core/src/recovery/index.ts')).toContain('includeInjection')
    expect(read('packages/bundle/skills/novel-settle/SKILL.md')).toContain('五段解析器输入＋第六节')
    expect(read('packages/bundle/skills/novel-review/agents/全量审读.md')).toContain('v2.9 补充判据')
    expect(read('packages/bundle/skills/novel-review/SKILL.md')).toContain('近期正文衔接')
    expect(read('packages/bundle/skills/novel-review/SKILL.md')).toContain('回写工具会按')
    expect(read('packages/bundle/skills/novel-design/SKILL.md')).toContain('由人工按档判')
    expect(read('packages/bundle/src/tools/review-tools.ts')).toContain('JSON.stringify(value)')
  })
})

describe('skills 批次防回退断言组·0.0.71 材料/任务包去重批', () => {
  it('0.0.71：固定文档预算 ≤ 基线 80%，任务包单一来源句在位', () => {
    const root = path.join(__dirname, '..', '..', '..')
    const skills = path.join(root, 'packages', 'bundle', 'skills')
    const files = [
      'novel-outline/SKILL.md',
      'novel-outline/templates/步骤卡-章细纲.md',
      'novel-outline/templates/步骤卡-写前十查.md',
      'novel-drafting/SKILL.md',
      'novel-drafting/agents/写作卡-索引.md',
      'novel-drafting/references/默认文风.md',
      'novel-review/SKILL.md',
      'novel-review/agents/全量审读.md',
      'novel-drafting/references/默认文风-速查.md',
      'novel-revision/SKILL.md',
      'novel-revision/agents/改稿章程.md',
      'novel-polish/SKILL.md',
      'novel-polish/references/1-表达清理.md',
      'novel-polish/references/2-节奏与重塑.md',
      'novel-settle/SKILL.md',
      'novel-settle/agents/沉淀对账.md',
    ]
    const total = files.reduce((sum, rel) => sum + fs.readFileSync(path.join(skills, rel), 'utf8').length, 0)
    expect(total, `固定文档 ${total} 应 ≤ 61,826（基线 77,283 的 80%）`).toBeLessThanOrEqual(61826)
    const drafting = fs.readFileSync(path.join(skills, 'novel-drafting/SKILL.md'), 'utf8')
    expect(drafting).toContain('任务包单一来源')
    expect(drafting).toContain('不重复材料包全文')
    expect(fs.existsSync(path.join(root, 'scripts/benchmarks/fixed-docs.mjs'))).toBe(true)
  })
})

describe('skills 批次防回退断言组·0.0.72 v2.9 步骤消费批', () => {
  it('0.0.72：三条流程块有步骤级消费位，文档收口口径在位', () => {
    const root = path.join(__dirname, '..', '..', '..')
    const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8')
    expect(read('packages/bundle/skills/novel-design/SKILL.md')).toContain('大纲记录（v2.9-18')
    expect(read('packages/bundle/skills/novel-arcplan/SKILL.md')).toContain('卷末三锚点核对')
    expect(read('packages/bundle/skills/novel-revision/SKILL.md')).toContain('三层修订法')
    expect(read('packages/bundle/skills/novel-outline/templates/步骤卡-章细纲.md')).toContain('黄金三章分工做软检查')
    expect(read('docs/标准/工程规范.md')).toContain('patch 作批次号')
    expect(read('docs/产品/怎么走.md')).toContain('三行必报')
  })
})

describe('skills 批次防回退断言组·0.0.69/0.0.70 token 大头批', () => {
  it('0.0.69/0.0.70：设计四卡/细纲十查/写作卡索引/默认文风速查在位，卡不冒充判据单源', () => {
    const root = path.join(__dirname, '..', '..', '..')
    const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8')
    for (const name of ['契约', '世界书', '全书大纲', '分卷']) {
      const text = read(`packages/bundle/skills/novel-design/templates/步骤卡-${name}.md`)
      expect(text, `步骤卡-${name} 应有深挖指针`).toContain('深挖')
      expect(text.length, `步骤卡-${name} 应保持轻量`).toBeLessThan(2500)
    }
    const ten = read('packages/bundle/skills/novel-outline/templates/步骤卡-写前十查.md')
    expect(ten).toContain('①')
    expect(ten).toContain('⑩')
    expect(ten).toContain('深挖')
    expect(read('packages/bundle/skills/novel-design/SKILL.md')).toContain('步骤卡-契约')
    expect(read('packages/bundle/skills/novel-outline/SKILL.md')).toContain('步骤卡-写前十查')
    const cardIndex = read('packages/bundle/skills/novel-drafting/agents/写作卡-索引.md')
    expect(cardIndex).toContain('不整份读')
    expect(read('packages/bundle/skills/novel-drafting/references/默认文风-速查.md')).toContain('完整判据')
    expect(read('packages/bundle/skills/novel-drafting/SKILL.md')).toContain('写作卡-索引')
    expect(read('packages/bundle/skills/novel-review/SKILL.md')).toContain('默认文风-速查')
    expect(read('packages/bundle/skills/novel-polish/SKILL.md')).toContain('默认文风-速查')
    const contract = read('packages/bundle/scripts/artifact-contract.mjs')
    for (const p of ['步骤卡-契约', '步骤卡-世界书', '步骤卡-全书大纲', '步骤卡-分卷', '步骤卡-写前十查', '写作卡-索引', '默认文风-速查']) expect(contract).toContain(p)
  })
})

describe('skills 批次防回退断言组·世界内合理性真源优先＋七层常理批', () => {
  it('世界内合理性：真源路由→条目/版本→四判定，七层常理与预测—验证，报告字段齐全', () => {
    const root = path.join(__dirname, '..', '..', '..')
    const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8')
    const world = read('packages/bundle/skills/novel-review/agents/世界内合理性审读.md')
    // 第一步：提取断言→路由真源→查条目/版本→四判定
    expect(world).toContain('## 审读第一步：真源优先')
    for (const step of ['### 1. 提取正文断言', '### 2. 路由真源', '### 3. 查条目与版本', '### 4. 判定四值']) {
      expect(world, `第一步应含「${step}」`).toContain(step)
    }
    for (const source of ['世界书条目', '力量体系', '世界常量', '人物档案', '账本', '定稿', '近期衔接']) {
      expect(world, `真源类型应含「${source}」`).toContain(source)
    }
    for (const verdict of ['有依据', '冲突', '设定缺口', '留白合法']) {
      expect(world, `判定四值应含「${verdict}」`).toContain(verdict)
    }
    expect(world, '设定缺口不得用常识补标准').toContain('不得凭常识、历史常识或类型惯例替作者补标准')
    expect(world).toContain('真源冲突')
    // 七层常理
    for (const layer of ['物理空间', '身体生命', '资源经济', '社会制度', '信息认知', '能力规则', '叙事因果']) {
      expect(world, `七层常理应含「${layer}」`).toContain(layer)
    }
    // 预测—验证与只拦负载
    expect(world).toContain('## 预测—验证')
    for (const field of ['**预期**', '**文本**', '**差距**', '**判合理**']) {
      expect(world, `预测—验证应含「${field}」`).toContain(field)
    }
    expect(world).toContain('只拦负载问题')
    expect(world).toContain('类型惯例')
    expect(world).toContain('铁则破例另查')
    // 报告字段：真源类型/路径与版本、判定、常理层、预期/文本/差距、负载性
    const report = world.slice(world.indexOf('【世界内合理性审读报告】'))
    for (const field of ['真源类型:', '真源路径与版本:', '判定:', '常理层:', '预期:', '文本:', '差距:', '负载性:']) {
      expect(report, `报告应带字段「${field}」`).toContain(field)
    }
    // 全量审读维度 9 同步：口径改真源/七层/预测—验证/设定缺口，旧的六条枚举清零
    const sweep = read('packages/bundle/skills/novel-review/agents/全量审读.md')
    for (const word of ['真源', '七层常理', '预测—验证', '设定缺口', '负载性', '常理层']) {
      expect(sweep, `维度 9 摘要应含「${word}」`).toContain(word)
    }
    expect(sweep, '旧六条口径不得回潮').not.toContain('查什么六条')
    // 派发模板仍备齐真源材料槽位
    const reviewSkill = read('packages/bundle/skills/novel-review/SKILL.md')
    for (const slot of ['相关设定摘要：', '世界常量与量级切片：', '近期正文衔接（维度 9 用）：', '账本到期线索摘录：']) {
      expect(reviewSkill, `派发模板应含真源材料槽位「${slot}」`).toContain(slot)
    }
  })
})

describe('skills 批次防回退断言组·07 起草心流分层批', () => {
  it('07：任务包带场景问题一行；写时三红线与交稿后热回看分层；候选事实/热回查/自评/停笔报告保留', () => {
    const drafting = readSkill('novel-drafting')
    // 场景问题：每单元一行，细纲没有时主控在包内补，不新增必填字段、不反向改细纲
    expect(drafting).toContain('**场景问题**')
    expect(drafting).toContain('场景问题：谁想要什么，但什么阻挡；结束时什么变了')
    expect(drafting).toContain('不新增必填字段，不反向改细纲')
    // 两层心智：写时只守三红线，写作卡/AI 痕迹/句法自查移交稿后热回看
    expect(drafting).toContain('写时三红线')
    expect(drafting).toContain('交稿后热回看')
    expect(drafting).toContain('POV 不漂／禁入信息不泄／事实与材料包一致')
    expect(drafting).toContain('写作卡、AI 痕迹、句法自查等不边走笔边逐条过')
    expect(drafting).toContain('写时不过卡，留到交稿后热回看')
    // 既有交付物与检查不因分层删除
    expect(drafting).toContain('## 草稿候选事实')
    expect(drafting).toContain('热回查：POV✓ 禁入✓ 事实✓')
    expect(drafting).toContain('自评：最得意')
    expect(drafting).toContain('**停笔交停笔报告**：只交一份报告不交稿')
  })
})

describe('skills 批次防回退断言组·变更影响分析批', () => {
  it('05：L0-L4 分级＋变更包十八字段＋依赖顺序＋吃书补偿/回归＋双 SKILL 指针＋注册单源', () => {
    const root = path.join(__dirname, '..', '..', '..')
    const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8')
    const refPath = path.join(root, 'packages/bundle/skills/novel-design/references/变更影响分析.md')
    expect(fs.existsSync(refPath), 'novel-design/references/变更影响分析.md 应存在').toBe(true)
    const text = fs.readFileSync(refPath, 'utf8')
    // A. 分级：五级与五个级名全在位；定级不得只写代号
    for (const level of ['L0', 'L1', 'L2', 'L3', 'L4']) expect(text, `分级应含「${level}」`).toContain(level)
    for (const name of ['表达', '局部事实', '剧情人物', '硬设定契约', '已定稿已发布']) {
      expect(text, `分级名称应含「${name}」`).toContain(name)
    }
    expect(text).toContain('就高不就低')
    // B. 变更包字段：十八项逐项钉在模板节，散文里偶然出现不算
    const packStart = text.indexOf('### 必填字段')
    const packEnd = text.indexOf('### 受影响工件怎么取')
    expect(packStart).toBeGreaterThanOrEqual(0)
    expect(packEnd).toBeGreaterThan(packStart)
    const pack = text.slice(packStart, packEnd)
    for (const field of ['旧', '新', '原因', '影响人物', '影响关系', '影响能力', '影响知识', '影响社会', '事件链', '伏笔', '读者承诺', '受影响工件', '已写章节处理', '最小改法', '彻底改法', '吃书补偿', '回归验证', '作者裁决']) {
      expect(pack, `变更包字段应含「${field}」行`).toContain(`| ${field} |`)
    }
    // C. 依赖顺序：逐层先后不可跳
    expect(text).toContain('契约 → 世界书 → 全书大纲 → 分卷 → 卷纲 → 幕纲 → 细纲 → 正文 → 账本/摘要')
    const orderSection = text.slice(text.indexOf('### 顺序链'), text.indexOf('### 逐层改法'))
    expect(orderSection).toContain('不可跳层')
    // D. 已写章节与回归：四件补偿＋定稿只增不改＋回归表
    for (const item of ['正文补偿', '认知补偿', '承诺补偿', '账本／摘要补偿']) {
      expect(text, `吃书补偿四件应含「${item}」`).toContain(item)
    }
    expect(text).toContain('定稿区只增不改')
    expect(text).toContain('影响分析复跑')
    expect(text).toContain('通过标准')
    // E. 三例：职业变更／知识来源变更／剧情 A→B 各一
    for (const example of ['例一：职业变更', '例二：知识来源变更', '例三：剧情 A→B']) {
      expect(text, `应含「${example}」`).toContain(example)
    }
    // F. 双 SKILL 指针：何时必须读＋何时走提案/作者裁决
    const design = readSkill('novel-design')
    expect(design).toContain('[变更影响分析](references/变更影响分析.md)')
    expect(design).toContain('L0-L4')
    expect(design).toContain('L2 以上或命中已定稿/已发布，走提案与作者裁决')
    const arcplan = readSkill('novel-arcplan')
    expect(arcplan).toContain('references/变更影响分析.md')
    expect(arcplan).toContain('L0-L4')
    expect(arcplan).toContain('L2 以上走提案与作者裁决')
    // G. 注册单源：artifact-contract 登记（pack-check 按 referenceDocs 校验打包面）
    const contract = read('packages/bundle/scripts/artifact-contract.mjs')
    expect(contract).toContain("'skills/novel-design/references/变更影响分析.md'")
  })
})

describe('skills 批次防回退断言组·08 拆书机制消费闭环批', () => {
  it('08：细纲机制使用登记＋任务包参考机制段＋消费回看，可选不阻塞正文', () => {
    const outline = readSkill('novel-outline')
    // 细纲消费入口：标志场景/作者点名触发检索，命中即登记五字段；可选、不强制每章、未拆书跳过
    expect(outline).toContain('或作者点名时')
    expect(outline).toContain('novel_reference_query search')
    expect(outline).toContain('机制使用登记')
    expect(outline).toContain('机制卡／版本／借什么原理／不借什么／用在哪单元')
    expect(outline).toContain('写进候选细纲可选增补行或材料包补充')
    expect(outline).toContain('不参与确认校验')
    expect(outline).toContain('不强制每章查')
    expect(outline).toContain('未拆书跳过')
    expect(outline).toContain('借魂不借形')
    // 起草任务包：可选段最多 1-2 条＋内联关键行＋借/不借边界；无则写「无」，不许子代理自编
    const drafting = readSkill('novel-drafting')
    expect(drafting).toContain('**本章参考机制（可选）**')
    expect(drafting).toContain('带最多 1-2 条')
    expect(drafting).toContain('内联机制卡的关键行')
    expect(drafting).toContain('借什么原理、不借什么')
    expect(drafting).toContain('无登记或未拆书写「无」')
    expect(drafting).toContain('子代理不得自行编机制')
    expect(drafting).toContain('参考机制只是分析建议')
    // 分析侧消费回看：登记位置＋卷末回看；不改 save-idea/机制版本协议，失败不阻塞正文
    const mech = fs.readFileSync(skillFile('novel-analyze', 'references/机制与灵感.md'), 'utf8')
    expect(mech).toContain('## 消费回看')
    expect(mech).toContain('机制使用登记')
    expect(mech).toContain('卷末回看')
    expect(mech).toContain('不改机制版本')
    expect(mech).toContain('save-idea 的依据字段与版本协议')
    expect(mech).toContain('机制消费失败不阻塞正文')
  })
})

describe('skills 批次防回退断言组·02 设计两席真源查询＋人类预测批', () => {
  it('02：作家席真源摘要/断言路由/设定缺口，读者席第一遍预测且不读世界书，两席人类五问与报告字段', () => {
    const root = path.join(__dirname, '..', '..', '..')
    const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8')
    const writer = read('packages/bundle/skills/novel-design/agents/作家评审.md')
    const reader = read('packages/bundle/skills/novel-design/agents/读者评审.md')
    const design = read('packages/bundle/skills/novel-design/SKILL.md')

    // A. 作家席：任务包真源摘要槽位＋断言→真源→条目/版本→四判定
    expect(writer, '作家席任务包应有真源摘要槽位').toContain('| 真源摘要 | 宿主自备 |')
    expect(writer, '真源摘要只带相关条目，不塞完整世界书').toContain('不塞完整世界书')
    for (const step of ['### 1. 提取计划断言', '### 2. 路由真源', '### 3. 查条目与版本', '### 4. 判定四值']) {
      expect(writer, `作家席真源查询应含「${step}」`).toContain(step)
    }
    for (const source of ['契约', '世界书条目', '力量体系', '世界常量', '人物档案', '账本', '定稿', '计划本身']) {
      expect(writer, `作家席真源类型应含「${source}」`).toContain(source)
    }
    for (const verdict of ['有依据', '冲突', '设定缺口', '留白合法']) {
      expect(writer, `作家席判定四值应含「${verdict}」`).toContain(verdict)
    }
    expect(writer, '无真源写设定缺口，不得凭常识补标准').toContain('不得凭常识、历史常识或类型惯例替作者补标准')
    expect(writer).toContain('真源冲突')
    expect(writer, '旧口径（一律不读真源、事实全归章级审读）不得回潮').not.toContain('| 世界书/、账本/、定稿/ | 事实一致性归章级《全面审读》；本席只审设计侧工件本身 |')

    // B. 读者席：第一遍预测—验证＋不读世界书/账本/真源摘要＋信息不足报阅读问题而非设定缺口
    expect(reader).toContain('## 第一遍预测—验证（先当读者，再当评审）')
    expect(reader, '第一遍要写「作为目标读者我预期……」').toContain('作为目标读者我预期')
    for (const part of ['文本给', '差距']) {
      expect(reader, `预测—验证应含「${part}」`).toContain(part)
    }
    expect(reader, '读者席仍不读世界书与账本').toContain('| 世界书/、账本/ |')
    expect(reader, '宿主不向读者席传真源摘要').toContain('宿主不向本席传真源摘要')
    expect(reader, '正文没给足信息报阅读问题、不报设定缺口').toContain('不报设定缺口')
    expect(reader, '读者席不得长出真源路由（那是作家席流程）').not.toContain('### 2. 路由真源')
    expect(reader, '读者席输入清单不得出现真源摘要 ✅ 槽').not.toContain('| ✅ | 宿主随包的「真源摘要」')

    // C. 两席人类五问：五问逐句在位＋只拦负载＋类型惯例可合法
    for (const [label, text] of [['作家席', writer], ['读者席', reader]] as const) {
      expect(text, `${label}: 人类五问节应在位`).toContain('## 人类五问（只拦负载）')
      for (const q of ['我预期什么', '文本给了什么', '这需要什么前提', '谁付代价', '谁看见谁善后']) {
        expect(text, `${label}: 人类五问应含「${q}」`).toContain(q)
      }
      expect(text, `${label}: 只拦负载问题`).toContain('只拦负载问题')
      expect(text, `${label}: 类型惯例可合法`).toContain('类型惯例')
      expect(text, `${label}: 两席互不通气纪律不变`).toContain('两席互不通气，各自独立出具')
    }

    // D. 报告字段与票 01 对齐：真源/判定/常理层/预期/文本/差距/负载性（问题清单逐列在位）
    expect(writer).toContain('| # | 维 | 严重度 | 位置 | 引证 | 问题 | 判据 | 真源 | 判定 | 常理层 | 预期 | 文本 | 差距 | 负载性 | 根因 | 建议 |')
    expect(reader).toContain('| # | 类 | 严重度 | 位置 | 引证 | 问题（读者语言） | 判据 | 真源 | 判定 | 常理层 | 预期 | 文本 | 差距 | 负载性 | 根因 | 建议 |')
    for (const [label, text] of [['作家席', writer], ['读者席', reader]] as const) {
      for (const col of ['| 真源 |', '| 判定 |', '| 常理层 |', '| 预期 |', '| 文本 |', '| 差距 |', '| 负载性 |']) {
        expect(text, `${label}: 报告应带字段列「${col}」`).toContain(col)
      }
    }
    expect(reader, '读者席真源列恒不适用').toContain('不适用（本席不读真源）')
    expect(reader, '读者席判定值不得含设定缺口').toContain('不得出现「设定缺口」')
    expect(writer).toContain('- 真源摘要：{宿主提供的真源类型与条目范围；缺项列「未提供」}')

    // E. design SKILL 派发段：作家席传真源摘要、读者席三参数隔离、两席预测—验证与人类五问
    expect(design, '派发段应给作家席加真源摘要').toContain('作家席另加「真源摘要」')
    expect(design, '读者席只带三参数、不传真源摘要').toContain('读者席只带三参数')
    expect(design).toContain('不塞完整世界书')
    expect(design).toContain('第一遍预测—验证＋人类五问')
    expect(design).toContain('读者席真源列恒「不适用（本席不读真源）」')
    expect(design).toContain('按作家→读者串行')
  })
})

describe('skills 批次防回退断言组·03 幕纲两席评审与关键幕门禁批', () => {
  it('03：两席支持幕纲与六固定段，检查点分席，arcplan 派发/门禁，报告路径落到幕NN', () => {
    const root = path.join(__dirname, '..', '..', '..')
    const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8')
    const writer = read('packages/bundle/skills/novel-design/agents/作家评审.md')
    const reader = read('packages/bundle/skills/novel-design/agents/读者评审.md')
    const arcplan = read('packages/bundle/skills/novel-arcplan/SKILL.md')
    const memoSpec = read('packages/bundle/skills/novel-arcplan/templates/幕纲固定段规格.md')

    // A. 两席对象类型增加幕纲＋对象路径（真源路径与规格一致）
    for (const [label, text] of [['作家席', writer], ['读者席', reader]] as const) {
      expect(text, `${label}: 对象类型应列幕纲`).toMatch(/对象类型 \| 全书大纲 \/ 分卷 \/ 卷纲 \/ 幕纲/)
      expect(text, `${label}: 幕纲对象路径应在位`).toContain('故事剧情/卷规划/卷NN/幕纲/幕NN-<幕名>.md')
      expect(text, `${label}: 报告路径应增幕NN`).toContain('{对象}：全书大纲/分卷/卷NN/幕NN')
    }

    // B. 六固定段：规格段标题＋作家席逐段检查点
    const sixSegments = ['本幕故事', '线与伏笔', '出场人物', '查证清单', '章组排布', '幕末结算']
    for (const seg of sixSegments) {
      expect(memoSpec, `幕纲规格应含固定段「${seg}」`).toContain(`## ${seg}`)
      expect(writer, `作家席幕纲检查应含固定段「${seg}」`).toContain(`**${seg}**`)
    }

    // C. 作家席检查点：故事五要素/旧新悬念远期到期/想要状态与规模/章数章组高潮调剂章序/结算/边界
    for (const kw of ['起因', '目标', '阻碍', '高潮画面', '幕末状态']) {
      expect(writer, `作家席本幕故事应含「${kw}」`).toContain(kw)
    }
    for (const kw of ['旧线', '新埋伏笔', '展开的悬念', '远期兑现点', '到期承诺']) {
      expect(writer, `作家席线与伏笔应含「${kw}」`).toContain(kw)
    }
    expect(writer).toContain('想要')
    expect(writer).toContain('状态')
    expect(writer, '作家席应核人物规模随主角位阶').toContain('人物规模随主角当前位阶')
    expect(writer, '作家席应核章数（不写数字）').toContain('章组章数合计')
    expect(writer).toContain('高潮后调剂')
    expect(writer).toContain('章序可在幕内调整')
    expect(writer, '作家席只审幕级结构与因果').toContain('只审幕级结构与因果')
    expect(writer, '作家席不审逐句文笔').toContain('不审逐句文笔')

    // D. 读者席检查点：读者盼什么/幕末钩/情绪曲线/弃书点/信息给足＋两条隔离
    for (const kw of ['本幕读者盼什么', '幕末钩', '情绪曲线', '弃书点', '信息是否给足']) {
      expect(reader, `读者席幕纲检查应含「${kw}」`).toContain(kw)
    }
    expect(reader, '读者席不审章级正文事实').toContain('不审章级正文事实')
    expect(reader, '读者席不读世界书与账本').toContain('不读世界书与账本')
    expect(reader, '幕纲合法留白不误报信息不足').toContain('段标 `〔留白〕` 是合法状态')

    // E. arcplan 派发与门禁：第一幕/关键幕两席、普通幕作家席或作者跳过、串行不通气、不拦卡但关键幕硬伤呈报
    expect(arcplan, 'arcplan 应有幕纲评审节').toContain('### 幕纲评审与关键幕门禁')
    expect(arcplan).toContain('第一幕与关键幕')
    expect(arcplan).toContain('普通幕至少派作家评审')
    expect(arcplan).toContain('作者明确跳过')
    expect(arcplan).toContain('作家→读者串行')
    expect(arcplan).toContain('两席独立互不通气')
    expect(arcplan).toContain('评审不拦卡')
    expect(arcplan, '关键幕硬伤未处置不得确认写入/开写整幕').toContain('不得确认写入幕纲、不得开写整幕')
    expect(arcplan).toContain('先呈报作者裁决')

    // F. 报告路径与 02 字段口径：幕NN_作家/幕NN_读者，真源/预测/负载性沿用（读者席真源不适用）
    expect(arcplan).toContain('幕NN_作家.md')
    expect(arcplan).toContain('幕NN_读者.md')
    for (const [label, text] of [['作家席', writer], ['读者席', reader]] as const) {
      for (const col of ['| 真源 |', '| 判定 |', '| 常理层 |', '| 预期 |', '| 文本 |', '| 差距 |', '| 负载性 |']) {
        expect(text, `${label}: 幕纲报告应沿用 02 字段「${col}」`).toContain(col)
      }
    }
    expect(reader).toContain('不适用（本席不读真源）')
    expect(arcplan).toContain('读者席真源列恒「不适用（本席不读真源）」')
  })
})

describe('skills 批次防回退断言组·04 设计评审台账批', () => {
  it('04：报告头六字段＋七列处置台账＋处置七值/负责人/复评状态＋增量复评＋两席与 SKILL 接线', () => {
    const root = path.join(__dirname, '..', '..', '..')
    const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8')
    const writer = read('packages/bundle/skills/novel-design/agents/作家评审.md')
    const reader = read('packages/bundle/skills/novel-design/agents/读者评审.md')
    const design = read('packages/bundle/skills/novel-design/SKILL.md')
    const arcplan = read('packages/bundle/skills/novel-arcplan/SKILL.md')

    for (const [label, text] of [['作家席', writer], ['读者席', reader]] as const) {
      // A. 报告头：评审编号/对象类型/对象路径与版本或哈希/判据版本/评审日期轮次/主问题
      for (const field of ['- 评审编号：', '- 对象类型：', '- 对象路径与版本/哈希：', '- 判据版本：', '- 评审日期/轮次：', '**主问题（仅一个）**：']) {
        expect(text, `${label}: 报告头应含「${field}」`).toContain(field)
      }
      // B. 处置台账七列（列名与列序逐字）
      expect(text, `${label}: 处置台账应七列齐`).toContain('| 发现项编号 | 严重度 | 是否负载 | 处置 | 负责人 | 复评状态 | 备注 |')
      // C. 处置七值（单源写法逐字）＋负责人四值＋复评状态四值
      expect(text, `${label}: 处置七值应齐`).toContain('待处理 / 已解决 / 已修改 / 作者保留 / 已驳回 / 无法判断 / 已转提案')
      expect(text, `${label}: 负责人四值应齐`).toContain('作者 / 主控 / 设计 / 卷幕')
      expect(text, `${label}: 复评状态四值应齐`).toContain('待复评 / 通过 / 不通过 / 不适用')
      for (const value of ['待处理', '已解决', '已修改', '作者保留', '已驳回', '无法判断', '已转提案']) {
        expect(text, `${label}: 处置值「${value}」应在位`).toContain(value)
      }
      // D. 增量复评：新节＋只回归上一轮＋不重读全文＋新编号引用上轮＋主问题未解不改次要项＋通过条件
      expect(text, `${label}: 应有增量复评节`).toContain('## 复评（增量）')
      expect(text, `${label}: 只回归上轮主问题与待复评项`).toContain('只回归上轮主问题＋处置台账「待复评」项')
      expect(text, `${label}: 复评不重读全文`).toContain('不重读全文')
      expect(text, `${label}: 复评新编号引用上轮编号`).toContain('引用上轮编号')
      expect(text, `${label}: 主问题未解不改次要项结论`).toContain('主问题未解不改次要项结论')
      expect(text, `${label}: 复评通过条件四条应在位`).toContain('复评通过条件（四条全中才判通过）')
      // E. 首评默认＋旧「无复评机制」清零＋两席独立/不互读报告不变
      expect(text, `${label}: 首评默认`).toContain('首评默认')
      expect(text, `${label}: 增量复评`).toContain('增量复评')
      expect(text, `${label}: 旧「无复评机制」应清零`).not.toContain('本底本无复评机制')
      expect(text, `${label}: 旧「只做首评」应清零`).not.toContain('只做首评')
      expect(text, `${label}: 两席互不通气纪律不变`).toContain('两席互不通气，各自独立出具')
      expect(text, `${label}: 禁读其他评审报告不变`).toContain('禁读其他评审报告')
      // F. 处置与复评消费字段：来源映射/负责人路由/复评状态映射齐备
      expect(text, `${label}: 处置值应有含义与复评状态默认映射`).toContain('复评状态四值')
      expect(text, `${label}: 负责人应带根因预填路由`).toContain('按根因预填')
    }

    // G. 读者席特有：弃书点行以「弃-」并入台账
    expect(reader, '读者席弃书点行应并入处置台账').toContain('弃-{#}')
    expect(reader, '读者席复评回归范围应含弃书点行').toContain('（含弃书点行）')
    expect(writer, '作家席台账编号与问题清单同号').toContain('发现项编号＝问题清单 #')

    // H. design SKILL ③：首评默认/增量复评、落盘后主控读主问题与台账、作者裁决、按需复评、书房资产不入 git
    expect(design, 'SKILL 派发段应改首评默认＋增量复评').toContain('两席均首评默认，收到复评请求走增量复评')
    expect(design, 'SKILL 应写报告头与七列台账').toContain('七列（发现项编号/严重度/是否负载/处置/负责人/复评状态/备注）')
    expect(design, 'SKILL 应写报告落盘后的主控消费').toContain('报告落盘后')
    expect(design, 'SKILL 应要求读主问题与处置台账').toContain('主问题')
    expect(design).toContain('处置台账')
    expect(design, 'SKILL 应要求作者裁决').toContain('作者裁决')
    expect(design, 'SKILL 应要求改完按需派增量复评').toContain('按需派增量复评')
    expect(design).toContain('只回归上轮主问题＋处置台账「待复评」项')
    expect(design, 'SKILL 应明确报告仍是书房资产').toContain('评审报告仍是书房资产')
    expect(design, 'SKILL 应明确不入书仓 git').toContain('不入书仓 git')
    expect(design, '旧「两席均只做首评」应清零').not.toContain('两席均只做首评')

    // I. arcplan 幕纲批次同步复评口径（底本同一套，门禁段消费台账）
    expect(arcplan, '幕纲派发应同步首评默认＋增量复评').toContain('收到复评请求走增量复评')
    expect(arcplan, '幕纲报告字段应带七列处置台账').toContain('七列处置台账')
    expect(arcplan, '幕纲报告落盘后应读主问题与台账').toContain('报告落盘后主控读主问题与处置台账')
    expect(arcplan, '旧「两席均只做首评」应清零').not.toContain('两席均只做首评')
  })
})

describe('skills 批次防回退断言组·06 设定就绪与设定债批', () => {
  it('06：八类检查表＋必须/可留白分层＋设定债定义/格式/路径＋不要求开书前写满＋变更包衔接＋注册单源', () => {
    const root = path.join(__dirname, '..', '..', '..')
    const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8')
    const refPath = path.join(root, 'packages/bundle/skills/novel-design/references/设定就绪与设定债.md')
    expect(fs.existsSync(refPath), 'novel-design/references/设定就绪与设定债.md 应存在').toBe(true)
    const text = fs.readFileSync(refPath, 'utf8')

    // A. 检查表：八类设定逐类在位＋按故事需求裁剪
    expect(text).toContain('## 三、八类检查表')
    for (const category of ['力量', '经济', '社会', '地理', '日常', '信息', '军事', '超自然']) {
      expect(text, `检查表应含「${category}」类`).toContain(`| ${category} |`)
    }
    expect(text).toContain('按故事需求裁剪')

    // B. 分层：不适用/可留白/必须三态＋必须只到可执行
    expect(text).toContain('## 二、按故事需求裁剪：必须与可留白')
    for (const state of ['不适用', '可留白', '必须']) expect(text).toContain(state)
    expect(text).toContain('必须只到可执行')
    expect(text).toContain('没有的类就写「不适用」')

    // C. 设定债定义与边界：已依赖＋真源未定义；评审只报缺口不补标准
    expect(text).toContain('设定债＝已经依赖、但真源尚未定义的设定')
    expect(text).toContain('已依赖处')
    expect(text).toContain('设定缺口')
    expect(text).toContain('评审不凭空补')
    expect(text).toContain('不把「未定义」当「可自由编」')

    // D. 记录格式：八字段＋五状态＋固定路径
    for (const field of ['编号', '设定类', '已依赖处', '缺什么', '影响', '状态', '作者裁决', '补写落点']) {
      expect(text, `设定债字段应含「${field}」`).toContain(`| ${field} |`)
    }
    for (const state of ['待补', '已补', '作者保留留白', '已升级变更包', '已失效']) {
      expect(text, `设定债状态应含「${state}」`).toContain(state)
    }
    expect(text).toContain('书房/开书/<书名>/设定债.md')
    expect(text).toContain('书房资产、非真源、不入书仓 git')

    // E. 不要求开书前写满、不是门禁、债不挡开写
    expect(text).toContain('不要求开书前写满')
    expect(text).toContain('不是开书门禁')
    expect(text).toContain('债不挡开写')

    // F. 与 05 衔接：补写改变硬设定/已定稿走 L0-L4 变更包，不直接写死
    expect(text).toContain('[变更影响分析](变更影响分析.md)')
    expect(text).toContain('L0-L4')
    expect(text).toContain('不直接写死')
    expect(text).toContain('定稿区只增不改')

    // G. SKILL 入口：reference 链接＋路径＋作者裁决＋不代补＋变更包；工件契约登记设定债资产位
    const design = readSkill('novel-design')
    expect(design).toContain('[设定就绪与设定债](references/设定就绪与设定债.md)')
    expect(design).toContain('<工作范围>/书房/开书/<书名>/设定债.md')
    expect(design).toContain('设定债')
    expect(design).toContain('作者裁决补还是留')
    expect(design).toContain('不把「未定义」当「可自由编」')
    expect(design).toContain('L0-L4')
    expect(design).toContain('不直接写死')
    expect(design).toContain('| 设定债 |')

    // H. 注册单源：artifact-contract 登记（pack-check 按 referenceDocs 校验打包面）
    const contract = read('packages/bundle/scripts/artifact-contract.mjs')
    expect(contract).toContain("'skills/novel-design/references/设定就绪与设定债.md'")
  })
})

describe('skills 批次防回退断言组·09 卷末设定审计批', () => {
  it('09：五类清单＋三去向＋卷末三件后顺序＋固定路径与便签回填＋06 设定债/05 变更包衔接＋边界与失败不阻塞＋注册单源', () => {
    const root = path.join(__dirname, '..', '..', '..')
    const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8')
    const arc = readSkill('novel-arcplan')
    const refPath = path.join(root, 'packages/bundle/skills/novel-arcplan/references/卷末设定审计.md')
    expect(fs.existsSync(refPath), 'novel-arcplan/references/卷末设定审计.md 应存在').toBe(true)
    const text = fs.readFileSync(refPath, 'utf8')

    // A. 审计五类：新增设定（世界书条目/人物档案/力量体系/世界常量/账本线索）＋候选事实未回写＋设定债状态＋真源冲突＋过期/废弃
    for (const category of ['新增设定', '候选事实未回写', '设定债状态', '真源冲突', '过期/废弃设定']) {
      expect(text, `审计五类应含「${category}」`).toContain(category)
    }
    for (const kw of ['世界书条目', '人物档案', '力量体系', '世界常量', '账本线索']) {
      expect(text, `新增设定类应覆盖「${kw}」`).toContain(kw)
    }

    // B. 三去向：回写／待补／冲突裁决
    for (const dest of ['回写', '待补', '冲突裁决']) {
      expect(text, `三去向应含「${dest}」`).toContain(dest)
    }
    expect(text).toContain('每条发现只归一个')

    // C. 卷末顺序：三件批之后跑审计（SKILL 侧顺序＋短指针＋路径）
    const batchAt = arc.indexOf('卷对账→卷摘要→下卷注意事项，三件一批')
    const auditAt = arc.indexOf('卷末设定审计')
    expect(batchAt, 'arcplan SKILL 应有卷末三件批句').toBeGreaterThanOrEqual(0)
    expect(auditAt, 'arcplan SKILL 卷末段应加设定审计短指针').toBeGreaterThan(batchAt)
    expect(arc).toContain('[卷末设定审计](references/卷末设定审计.md)')
    expect(arc).toContain('<工作范围>/书房/开书/<书名>/卷NN-设定审计.md')
    expect(arc, '审计件须标书房资产非真源').toContain('书房资产非真源')
    expect(arc, '待补/冲突须回填下卷注意事项').toContain('待补/冲突并成一句')
    expect(arc).toContain('下卷注意·卷<NN+1>：')
    expect(arc).toContain('下一卷规划步 1 读取')
    expect(text).toContain('书房/开书/<书名>/卷NN-设定审计.md')
    expect(text).toContain('不入书仓 git')

    // D. 与 06 设定债衔接：字段/五态/补写通道不重写、只指路＋三去向对应
    expect(text).toContain('设定就绪与设定债.md')
    expect(text).toContain('设定债.md')
    for (const state of ['待补', '已补', '作者保留留白', '已升级变更包', '已失效']) {
      expect(text, `06 设定债五态应含「${state}」`).toContain(state)
    }
    for (const dest of ['补写', '保留留白', '升级变更包']) {
      expect(text, `与 06 三去向对应应含「${dest}」`).toContain(dest)
    }

    // E. 与 05 变更包衔接：冲突走 L0-L4 定级、出变更包、作者裁决
    expect(text).toContain('变更影响分析.md')
    expect(text).toContain('L0-L4')
    expect(text).toContain('变更包')
    expect(text).toContain('作者裁决')

    // F. 边界：已定稿事实不静默改＋回写只经沉淀/确认工具＋候选未回写不当已确认设定＋冲突不拿正文当裁判
    expect(text).toContain('已定稿事实不能静默改')
    expect(arc).toContain('已定稿事实不得静默改')
    expect(arc).toContain('回写只经沉淀/确认工具')
    expect(text).toContain('候选事实未回写不能当已确认设定')
    expect(text).toContain('不拿正文当裁判')
    expect(text).toContain('novel_confirm_worldbook_entry')
    expect(text).toContain('novel_apply_retcon')

    // G. 失败不阻塞卷末但必须呈报
    expect(text).toContain('失败不阻塞')
    expect(text).toContain('必须呈报')
    expect(arc).toContain('审计不拦卷末')

    // H. 交接：卷摘要不改＋下卷注意事项＋下一卷规划消费
    expect(text).toContain('审计不改卷摘要')
    expect(text).toContain('下卷注意事项')
    expect(text).toContain('下一卷规划')
    expect(text).toContain('步 1')
    expect(text).toContain('卷间衔接')

    // I. 责任人与作者裁决
    expect(text).toContain('责任人')
    expect(text).toContain('作者裁决')

    // J. 预算边界：审计正文只落 arcplan reference，不把 fixed-docs 与 settle 撑大
    const fixedDocs = read('scripts/benchmarks/fixed-docs.mjs')
    expect(fixedDocs, '新 reference 不进 fixed-docs 预算').not.toContain('卷末设定审计')
    const settle = readSkill('novel-settle')
    expect(settle, '审计正文不落 settle（fixed-docs 已计入 settle）').not.toContain('卷末设定审计')

    // K. 注册单源：artifact-contract 登记新 reference（pack-check 按 referenceDocs 校验打包面）
    const contract = read('packages/bundle/scripts/artifact-contract.mjs')
    expect(contract).toContain("'skills/novel-arcplan/references/卷末设定审计.md'")
  })
})

describe('skills 批次防回退断言组·10 风险分级评审门禁批', () => {
  it('10：对象×风险×强度表＋L0-L4＋关键卷/幕＋低风险留白＋作者降级记录＋三 SKILL 指针＋director 限额＋注册单源', () => {
    const root = path.join(__dirname, '..', '..', '..')
    const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8')
    const refPath = skillFile('novel-director', 'references/评审分级与门禁.md')
    expect(fs.existsSync(refPath), 'novel-director/references/评审分级与门禁.md 应存在').toBe(true)
    const text = fs.readFileSync(refPath, 'utf8')

    // A. 对象轴七类：骨架/分卷/卷纲/幕纲/章纲/正文/表达各一行
    for (const obj of ['全书大纲', '分卷', '卷纲', '幕纲', '章纲', '正文', '表达']) {
      expect(text, `对象应含「${obj}」`).toContain(`| ${obj} |`)
    }

    // B. 风险轴：L0-L4＋关键卷/幕、普通、过渡；冲突取高不取低
    for (const level of ['L0', 'L1', 'L2', 'L3', 'L4']) {
      expect(text, `风险级应含「${level}」`).toContain(level)
    }
    for (const risk of ['关键卷/幕', '普通', '过渡']) {
      expect(text, `风险档应含「${risk}」`).toContain(risk)
    }
    expect(text, '冲突取高不取低').toContain('取高不取低')

    // C. 强度轴：两席/作家/单维/确定性/润色五档齐（另加全量/留白）
    for (const strength of ['两席', '作家', '单维', '确定性', '润色']) {
      expect(text, `审查强度应含「${strength}」`).toContain(strength)
    }

    // D. 对象×风险×强度默认表：表头＋七行逐行钉（低风险可留白，不搞全量最严）
    expect(text).toContain('## 二、默认表（对象 × 风险 × 强度）')
    expect(text).toContain('| 对象 | 高档（关键卷/幕、L3-L4、首次确认） | 普通（L2、常规推进） | 过渡（L0-L1、过渡章/幕） |')
    const rows = [
      '| 全书大纲 | 两席 | 作家 | 留白（走 05 影响分析，不派评审） |',
      '| 分卷 | 两席 | 作家 | 留白（走 05 影响分析，不派评审） |',
      '| 卷纲 | 两席 | 作家 | 单维（章节结构或情节与因果） |',
      '| 幕纲 | 两席 | 作家（作者可跳过） | 单维（章节结构） |',
      '| 章纲 | 单维（按承载维度选信息披露/情节与因果/章节结构之一） | 确定性（十查机械＋固定小节规格核对） | 留白 |',
      '| 正文 | 全量审读＋定向加深 | 全量审读 | 确定性＋单维（章节结构或文风与表达） |',
      '| 表达 | 润色 | 润色 | 润色（作者稿可登记跳过） |',
    ]
    for (const row of rows) expect(text, `默认表行应在位：${row}`).toContain(row)

    // E. 升级规则：硬设定/已定稿/读者承诺变更至少升一档；只升不降
    for (const trigger of ['触发硬设定', '命中已定稿/已发布', '读者承诺变更']) {
      expect(text, `升级触发应含「${trigger}」`).toContain(trigger)
    }
    expect(text).toContain('至少升一档')
    expect(text).toContain('只升不降')

    // F. 低风险留白合法：不搞全量最严；留白不是漏审
    expect(text).toContain('低风险留白合法')
    expect(text).toContain('不搞全量最严')
    expect(text).toContain('留白不是漏审')

    // G. 作者降级/跳过记录：门禁是默认强度＋固定字段＋书房资产落点
    expect(text).toContain('门禁是默认强度')
    expect(text).toContain('作者可显式降级/跳过并记录')
    expect(text).toContain('评审分级记录.md')
    for (const field of ['默认强度', '实际强度', '降级/跳过理由', '作者裁决', '硬伤处置']) {
      expect(text, `记录字段应含「${field}」`).toContain(`| ${field} |`)
    }
    expect(text).toContain('书房资产非真源')
    expect(text).toContain('不入书仓 git')

    // H. 关键卷/幕硬伤：未处置不得静默开写，作者可带伤确认
    expect(text).toContain('关键卷/幕的 🔴 硬伤未处置')
    expect(text).toContain('不得静默开写')
    expect(text).toContain('带伤确认')

    // I. 三个 SKILL 指针：director 短指针＋长度限额，design/arcplan 按表路由
    const director = readSkill('novel-director')
    expect(director, 'director 应有分级门禁短指针').toContain('[评审分级与门禁](references/评审分级与门禁.md)')
    expect(director).toContain('作者降级/跳过须记录')
    expect(director.length, `SKILL 本体 ${director.length} 字符，超过瘦身上限 8500`).toBeLessThanOrEqual(8500)

    const design = readSkill('novel-design')
    expect(design, 'design 应指向分级门禁表').toContain('references/评审分级与门禁.md')
    expect(design).toContain('作者可显式降级/跳过并记录')
    expect(design).toContain('全书大纲/分卷与关键卷两席')
    expect(design, '旧「不默认强制」应清零').not.toContain('不默认强制')

    const arcplan = readSkill('novel-arcplan')
    expect(arcplan, 'arcplan 应指向分级门禁表').toContain('references/评审分级与门禁.md')
    expect(arcplan).toContain('关键卷/幕两席')
    expect(arcplan).toContain('作者可显式降级/跳过并记录')

    // J. 阶段地图横切同步：过渡章可轻审/留白，不回落「9 维不跳过」
    const stage = read('packages/bundle/skills/novel-director/references/阶段地图.md')
    expect(stage).toContain('评审分级与门禁.md')
    expect(stage).toContain('过渡章可轻审或留白')

    // K. 注册单源：artifact-contract 登记（pack-check 按 referenceDocs 校验打包面）
    const contract = read('packages/bundle/scripts/artifact-contract.mjs')
    expect(contract).toContain("'skills/novel-director/references/评审分级与门禁.md'")
  })
})

describe('skills 批次防回退断言组·参考标尺链路去书名化', () => {
  it('参考标尺及其直接消费链零具体书名/角色名，校准来源只用匿名样本编号', () => {
    const root = path.join(__dirname, '..', '..', '..')
    const skills = path.join(root, 'packages', 'bundle', 'skills')
    // 只守标尺的直接消费链；不把黑名单扩散到其他技能或 references。
    const chain = [
      'novel-design/references/参考标尺.md',
      'novel-design/references/本书节奏基线.md',
      'novel-design/SKILL.md',
      'novel-arcplan/SKILL.md',
      'novel-outline/SKILL.md',
      'novel-review/SKILL.md',
      'novel-design/agents/作家评审.md',
    ]
    const blacklist = [
      '大奉打更人', '大奉',
      '诡秘之主', '诡秘',
      '我真没想重生啊', '重生啊',
      '绍宋', '十日终焉', '十日',
      '斗破苍穹', '斗破',
      '道诡异仙', '道诡',
      '魏渊', '罗塞尔', '徐芷溪',
    ]
    for (const rel of chain) {
      const text = fs.readFileSync(path.join(skills, rel), 'utf8')
      for (const name of blacklist) {
        expect(text, `${rel}: 不应出现具体书名/角色名「${name}」`).not.toContain(name)
      }
    }
    const scale = fs.readFileSync(path.join(skills, chain[0]), 'utf8')
    // v3：匿名样本组整组退役，标尺只声明依据来源与不逐行自证
    expect(scale).toContain('依据热门成品书的结构共性与公开写作经验整理')
    expect(scale).toContain('只保留结论，不逐行自证')
    expect(scale).not.toContain('S1–S5')
    expect(scale).not.toContain('EV-')
  })

  it('票 04 证据台账退役（v3）：台账删除、标尺去自证、注册注销、不进 fixed-docs', () => {
    const root = path.join(__dirname, '..', '..', '..')
    const skills = path.join(root, 'packages', 'bundle', 'skills')
    // 证据台账整件退役：标尺不再逐行自证，只声明依据来源
    expect(fs.existsSync(path.join(skills, 'novel-design', 'references', '证据台账.md')), '证据台账应已删除').toBe(false)
    const scale = fs.readFileSync(path.join(skills, 'novel-design', 'references', '参考标尺.md'), 'utf8')
    expect(scale, '标尺不应再有台账短指针').not.toContain('证据台账')
    expect(scale, '标尺不应再有行内 EV 编号').not.toMatch(/EV-\d{2}/)
    expect(scale, '标尺应声明只保留结论不逐行自证').toContain('只保留结论，不逐行自证')
    // 注册单源＋预算面：注销登记，仍不进每章固定文档预算
    const contract = fs.readFileSync(path.join(root, 'packages', 'bundle', 'scripts', 'artifact-contract.mjs'), 'utf8')
    expect(contract, 'artifact-contract 不应再登记证据台账').not.toContain('证据台账')
    const fixedDocs = fs.readFileSync(path.join(root, 'scripts', 'benchmarks', 'fixed-docs.mjs'), 'utf8')
    expect(fixedDocs, '证据台账不进 fixed-docs 预算').not.toContain('证据台账')
  })
})
