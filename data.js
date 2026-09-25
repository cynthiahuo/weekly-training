/* ============================================================
   一周训练 · 动作库 & 计划模板
   器材：哑铃 2kg / 4kg、弹力带、徒手（无单杠）
   整理依据：主流增肌训练动作共识（复合动作优先 + 孤立动作补充），
   尽量用「高性价比」动作：一个动作覆盖多个肌束 / 可渐进超负荷。
   注意：用户有高血压 → 全部动作标注「不憋气、不力竭」。
   ============================================================ */

var TRAINING_DATA = {
  /* ---------- 部位 & 动作库 ---------- */
  parts: [
    {
      key: "chest",
      name: "胸肌",
      short: "胸",
      color: "#d9542b",
      desc: "推类复合动作为主，上胸 + 中胸 + 下胸分角度覆盖",
      ex: [
        { name: "哑铃地面卧推", eq: "2×4kg", target: "12 个", tip: "仰卧屈膝，肘约 45° 不外张；下放到手肘轻触地面再推起" },
        { name: "哑铃仰卧飞鸟", eq: "2kg", target: "12 个", tip: "肘微屈角度全程不变，像抱大树，只做 2kg，感受胸口拉开" },
        { name: "标准俯卧撑", eq: "徒手", target: "10 个", tip: "身体成一条直线，核心收紧；撑不住就换跪姿版" },
        { name: "跪姿俯卧撑", eq: "徒手", target: "12 个", tip: "膝盖着地降难度，胸口贴近地面再推起，别只点头" },
        { name: "上斜俯卧撑（手扶沙发）", eq: "徒手", target: "15 个", tip: "手撑高更省力也更好找上胸，肩胛先下沉再推" },
        { name: "下斜俯卧撑（脚垫高）", eq: "徒手", target: "8 个", tip: "脚垫高练下胸，注意别拱腰，慢慢做" },
        { name: "弹力带站姿夹胸", eq: "弹力带", target: "15 个", tip: "带子绕背后，双手向胸前合拢，顶峰停 1 秒" },
        { name: "哑铃仰卧上拉", eq: "4kg", target: "12 个", tip: "仰卧双手托一只哑铃过头，肘微屈，感受胸廓拉开" }
      ]
    },
    {
      key: "back",
      name: "背肌",
      short: "背",
      color: "#2b6cb0",
      desc: "划船练厚度、下拉练宽度、后束练体态，三个方向都要有",
      ex: [
        { name: "单臂哑铃划船", eq: "4kg", target: "12 个/侧", tip: "一手扶椅背平，先收肩胛再拉肘；肘贴身体拉向髋部" },
        { name: "俯身双臂划船", eq: "2×4kg", target: "12 个", tip: "俯身约 45°，背部平直，哑铃贴腿拉向小腹，别耸肩" },
        { name: "弹力带坐姿划船", eq: "弹力带", target: "15 个", tip: "带子绕脚掌坐直，先夹肩胛再拉肘，别用腰前后晃" },
        { name: "弹力带高位下拉", eq: "弹力带", target: "15 个", tip: "带子固定高处，肘往下走拉向锁骨，想象把肩膀按下去" },
        { name: "弹力带直臂下压", eq: "弹力带", target: "15 个", tip: "手臂伸直往腿侧压，背部发力，感受背阔肌收紧" },
        { name: "超人式", eq: "徒手", target: "12 次", tip: "俯卧同时抬起手脚，顶点停 2 秒，脖子放松别后仰" },
        { name: "哑铃耸肩", eq: "2×4kg", target: "20 个", tip: "只做垂直上下耸肩，不转圈，头保持中立" },
        { name: "弹力带面拉", eq: "弹力带", target: "15 个", tip: "拉向脸侧、手肘抬高，改善含胸圆肩，也能护肩" }
      ]
    },
    {
      key: "shoulder",
      name: "肩膀",
      short: "肩",
      color: "#b7791f",
      desc: "小肌群，轻重量高次数为主；肩袖热身别省",
      ex: [
        { name: "哑铃侧平举", eq: "2kg", target: "15 个", tip: "抬到与肩同高即可，肘微屈，全程沉肩别耸肩" },
        { name: "哑铃肩上推举", eq: "2×4kg", target: "12 个", tip: "核心收紧，腰背贴稳不反弓；推到手臂伸展但不锁死" },
        { name: "哑铃俯身飞鸟", eq: "2kg", target: "15 个", tip: "俯身接近水平，向两侧打开，感受后肩收缩" },
        { name: "哑铃前平举", eq: "2kg", target: "12 个/侧", tip: "抬到肩高就停，别借力甩起，慢放" },
        { name: "弹力带面拉", eq: "弹力带", target: "15 个", tip: "拉到鼻梁高度，肘高过手，后肩发力" },
        { name: "弹力带肩外旋", eq: "弹力带", target: "15 个/侧", tip: "肘夹紧身体屈 90°，只做外旋；练前热身首选" }
      ]
    },
    {
      key: "biceps",
      name: "肱二头肌",
      short: "肱二",
      color: "#6b46c1",
      desc: "小肌群，靠精准刺激；每周 2~3 次即可，别天天练",
      ex: [
        { name: "哑铃交替弯举", eq: "2kg", target: "15 个/侧", tip: "大臂贴紧身体，只动小臂；不甩不耸肩" },
        { name: "锤式弯举", eq: "2×4kg", target: "12 个/侧", tip: "拳眼朝上、手腕中立，练肱肌让手臂更厚" },
        { name: "集中弯举", eq: "2kg", target: "12 个/侧", tip: "手肘顶在大腿内侧固定，顶峰夹紧停 1 秒" },
        { name: "上斜哑铃弯举", eq: "2kg", target: "12 个/侧", tip: "坐姿后仰，手臂在身后下垂起步，拉长二头长头" },
        { name: "弹力带弯举", eq: "弹力带", target: "15 个", tip: "脚踩带子，全程保持张力，下放慢数 2 秒" },
        { name: "正握弯举（反握）", eq: "2kg", target: "15 个", tip: "掌心朝下，练前臂和肱桡肌，手腕别塌下去" },
        { name: "21 响礼炮", eq: "2kg", target: "21 个", tip: "下半程 7 + 上半程 7 + 全程 7；重量一定要轻" },
        { name: "静力保持弯举", eq: "2kg", target: "30 秒", tip: "弯到 90° 保持不动，正常呼吸，感受持续紧张" }
      ]
    },
    {
      key: "triceps",
      name: "肱三头肌",
      short: "肱三",
      color: "#b83280",
      desc: "手臂围度的大头；复合推类 + 长头过顶动作搭配",
      ex: [
        { name: "俯身臂屈伸", eq: "2kg", target: "20 个/侧", tip: "大臂固定贴身体，只把小臂向后伸直，顶峰停 1 秒" },
        { name: "颈后臂屈伸", eq: "4kg", target: "12 个", tip: "双手托哑铃在颈后，肘朝前收窄别外张；练长头最有效" },
        { name: "仰卧臂屈伸", eq: "2×4kg", target: "12 个", tip: "仰卧举臂向头后弯肘，肘不外扩，慢下慢上" },
        { name: "钻石俯卧撑", eq: "徒手", target: "8 个", tip: "双手在胸口下方成三角，肘贴身体；撑不住换跪姿" },
        { name: "凳上臂屈伸", eq: "徒手", target: "12 个", tip: "背对椅子双手撑边缘，屈肘下沉，肩膀别往前顶" },
        { name: "弹力带下压", eq: "弹力带", target: "15 个", tip: "带子固定高处，肘夹紧不动，把带子往下压直" },
        { name: "哑铃窄距卧推", eq: "2×4kg", target: "12 个", tip: "仰卧两只哑铃靠拢，肘贴身，推到手臂伸直" }
      ]
    },
    {
      key: "abs",
      name: "腹肌",
      short: "腹",
      color: "#0f9d8c",
      desc: "上腹 / 下腹 / 侧腹 + 抗旋转，呼吸配合比次数重要",
      ex: [
        { name: "卷腹", eq: "徒手", target: "15 个", tip: "下巴留一拳，用腹部把肩胛卷离地，别用手拉脖子" },
        { name: "仰卧举腿", eq: "徒手", target: "12 个", tip: "腰贴地，腿慢放不落地；腰一酸就减小幅度" },
        { name: "俄罗斯转体", eq: "4kg", target: "20 个", tip: "坐姿后仰，转的是胸椎不是手；腹斜肌发力" },
        { name: "平板支撑", eq: "徒手", target: "30 秒", tip: "肘在肩正下方，屁股别翘别塌；全程正常呼吸不憋气" },
        { name: "侧平板", eq: "徒手", target: "25 秒/侧", tip: "身体成一条线，髋部向上顶，别往下坐" },
        { name: "死虫式", eq: "徒手", target: "12 个/侧", tip: "对侧手脚同时伸展，腰始终贴地，慢速配合呼吸" },
        { name: "鸟狗式", eq: "徒手", target: "12 个/侧", tip: "四点支撑，对侧手脚伸出，骨盆保持水平不晃" },
        { name: "慢速登山跑", eq: "徒手", target: "20 次", tip: "手撑地交替提膝，慢一点更稳，别拱背" },
        { name: "站姿提膝收腹", eq: "徒手", target: "15 个/侧", tip: "手扶墙站稳，抬膝向胸口，主动用腹部把膝拉上来" }
      ]
    },
    {
      key: "glutes",
      name: "臀腿（膝盖友好）",
      short: "臀腿",
      color: "#4a7c2f",
      desc: "全程膝盖不内扣、不超过脚尖；不做深蹲跳和箭步蹲",
      ex: [
        { name: "臀桥", eq: "徒手", target: "15 次", tip: "顶点夹臀停 2 秒，腰不要过度反弓" },
        { name: "单腿臀桥", eq: "徒手", target: "12 次/侧", tip: "不稳就先做双腿版，骨盆保持水平" },
        { name: "蚌式开合", eq: "徒手", target: "15 次/侧", tip: "侧卧骨盆不动，膝盖慢开慢合" },
        { name: "侧卧抬腿", eq: "徒手", target: "15 次/侧", tip: "身体成一条线，腿向侧上方抬，别前后晃" },
        { name: "站姿提踵", eq: "徒手", target: "20 次", tip: "扶墙保持平衡，下放时感受小腿拉伸" },
        { name: "俯卧腿弯举", eq: "徒手", target: "12 次", tip: "俯卧收小腿，动作要慢，全程不憋气" },
        { name: "哑铃直腿硬拉", eq: "2×4kg", target: "12 次", tip: "哑铃贴腿下放，感受大腿后侧拉伸，腰背保持平直" },
        { name: "臀推（靠沙发）", eq: "徒手", target: "15 次", tip: "肩背靠沙发，顶点夹臀 2 秒再放下" }
      ]
    }
  ],

  /* ---------- 整周模板（一键套用） ---------- */
  presets: [
    {
      name: "推拉腿 6 练",
      desc: "经典分化：推日 / 拉日 / 核心臀腿，各练两天",
      plan: {
        mon: { parts: ["chest", "triceps", "shoulder"], sessions: 1, perSession: 4, rounds: 3 },
        tue: { parts: ["back", "biceps"], sessions: 1, perSession: 4, rounds: 3 },
        wed: { parts: ["abs", "glutes"], sessions: 1, perSession: 4, rounds: 3 },
        thu: { parts: ["chest", "triceps", "shoulder"], sessions: 1, perSession: 4, rounds: 3 },
        fri: { parts: ["back", "biceps"], sessions: 1, perSession: 4, rounds: 3 },
        sat: { parts: ["abs", "glutes"], sessions: 1, perSession: 4, rounds: 3 },
        sun: { parts: [], sessions: 1, perSession: 3, rounds: 3 }
      }
    },
    {
      name: "隔天练 · 上下肢",
      desc: "一周 4 练，休息更充分，适合刚开始规律训练",
      plan: {
        mon: { parts: ["chest", "back", "biceps", "triceps"], sessions: 1, perSession: 4, rounds: 3 },
        tue: { parts: ["abs", "glutes"], sessions: 1, perSession: 4, rounds: 3 },
        wed: { parts: [], sessions: 1, perSession: 3, rounds: 3 },
        thu: { parts: ["chest", "back", "shoulder", "biceps"], sessions: 1, perSession: 4, rounds: 3 },
        fri: { parts: ["abs", "glutes"], sessions: 1, perSession: 4, rounds: 3 },
        sat: { parts: [], sessions: 1, perSession: 3, rounds: 3 },
        sun: { parts: [], sessions: 1, perSession: 3, rounds: 3 }
      }
    },
    {
      name: "每天短练 · 早晚两次",
      desc: "每天两个部位、每次 3 个动作；晚上再补一次腹肌",
      plan: {
        mon: { parts: ["chest", "triceps"], sessions: 2, perSession: 3, rounds: 3 },
        tue: { parts: ["back", "biceps"], sessions: 2, perSession: 3, rounds: 3 },
        wed: { parts: ["shoulder", "abs"], sessions: 2, perSession: 3, rounds: 3 },
        thu: { parts: ["chest", "back"], sessions: 2, perSession: 3, rounds: 3 },
        fri: { parts: ["biceps", "triceps"], sessions: 2, perSession: 3, rounds: 3 },
        sat: { parts: ["abs", "glutes"], sessions: 2, perSession: 3, rounds: 3 },
        sun: { parts: ["abs"], sessions: 1, perSession: 3, rounds: 3 }
      }
    },
    {
      name: "手臂专项周",
      desc: "肱二 + 肱三为主，配合胸背与核心",
      plan: {
        mon: { parts: ["biceps", "triceps"], sessions: 1, perSession: 4, rounds: 3 },
        tue: { parts: ["chest", "abs"], sessions: 1, perSession: 4, rounds: 3 },
        wed: { parts: ["biceps", "triceps"], sessions: 1, perSession: 4, rounds: 3 },
        thu: { parts: ["back", "abs"], sessions: 1, perSession: 4, rounds: 3 },
        fri: { parts: ["biceps", "triceps", "shoulder"], sessions: 1, perSession: 4, rounds: 3 },
        sat: { parts: ["abs", "glutes"], sessions: 1, perSession: 4, rounds: 3 },
        sun: { parts: [], sessions: 1, perSession: 3, rounds: 3 }
      }
    }
  ],

  /* ---------- 安全提示 ---------- */
  tips: [
    { icon: "🫁", text: "全程不憋气：发力时呼气、还原时吸气。有高血压这条最重要，一憋气血压会瞬间升高" },
    { icon: "🦵", text: "膝盖友好：所有下肢动作保持膝盖与脚尖同方向，不内扣、不蹲过脚尖" },
    { icon: "💪", text: "不求力竭：每组保留 2~3 次余量，动作质量永远优先于次数和重量" },
    { icon: "⏱️", text: "组间休息 60~90 秒；出现头晕、胸闷、眼前发黑立刻停下坐好" },
    { icon: "🌡️", text: "练前热身 5 分钟（原地踏步 + 手臂绕环 + 肩外旋），练后拉伸 5 分钟" },
    { icon: "💊", text: "高血压注意：练前确认当天已按时服药；清晨血压偏高时不做大强度训练" },
    { icon: "😴", text: "同一部位训练间隔至少 48 小时，肌肉是在休息时长出来的" }
  ],

  shortcutName: "记训练"
};
