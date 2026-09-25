/* 数据：一周训练计划 · 增肌定制 2kg/4kg · 膝盖友好 */
/* 每天分上肢 / 下肢两块，每块 3 个动作，每个动作最多 3 轮 → 全天 18 组 */

const TRAINING_DATA = {
  days: [
    {
      key: "mon",
      label: "周一",
      title: "肱二头肌 + 臀腿",
      sub: "哑铃弯举 · 臀桥 · 蚌式 · 提踵",
      groups: [
        {
          name: "上肢 · 肱二头肌",
          exercises: [
            { name: "2kg 哑铃弯举", target: "25 个", tip: "大臂贴身，只动小臂，不耸肩" },
            { name: "4kg 哑铃弯举", target: "15 个", tip: "慢落快起，顶峰停 1 秒" },
            { name: "2kg 锤式弯举", target: "20 个", tip: "拳眼朝上，手腕保持中立" }
          ]
        },
        {
          name: "下肢 · 臀腿（膝盖友好）",
          exercises: [
            { name: "臀桥", target: "15 次", tip: "顶点夹臀 2 秒，腰不要过度反弓" },
            { name: "蚌式开合", target: "15 次/侧", tip: "侧卧骨盆不动，膝盖慢开慢合" },
            { name: "站姿提踵", target: "20 次", tip: "扶墙保持平衡，下放时感受小腿拉伸" }
          ]
        }
      ]
    },
    {
      key: "tue",
      label: "周二",
      title: "肱三头肌 + 腿后侧",
      sub: "臂屈伸 · 俯卧腿弯举 · 臀桥",
      groups: [
        {
          name: "上肢 · 肱三头肌",
          exercises: [
            { name: "2kg 俯身臂屈伸", target: "25 个", tip: "大臂固定贴身，向后伸直小臂" },
            { name: "4kg 颈后臂屈伸", target: "15 个", tip: "双肘朝前收窄，慢速下放" },
            { name: "2kg 仰卧臂屈伸", target: "20 个", tip: "仰卧举臂向头部弯肘，肘部不外扩" }
          ]
        },
        {
          name: "下肢 · 腿后侧（膝盖友好）",
          exercises: [
            { name: "俯卧腿弯举", target: "12 次", tip: "俯卧收小腿，动作慢，不憋气" },
            { name: "臀桥", target: "15 次", tip: "顶点夹臀 2 秒再放下" },
            { name: "侧卧抬腿", target: "15 次/侧", tip: "身体成一条线，腿向侧上方抬" }
          ]
        }
      ]
    },
    {
      key: "wed",
      label: "周三",
      title: "肩膀 + 臀腿",
      sub: "侧平举 · 肩上推举 · 单腿臀桥",
      groups: [
        {
          name: "上肢 · 肩膀",
          exercises: [
            { name: "2kg 侧平举", target: "20 个", tip: "抬到与肩同高即可，不耸肩" },
            { name: "4kg 肩上推举", target: "15 个", tip: "核心收紧，腰背贴稳不反弓" },
            { name: "2kg 俯身飞鸟", target: "20 个", tip: "俯身 45°，感受后肩收缩" }
          ]
        },
        {
          name: "下肢 · 臀腿（膝盖友好）",
          exercises: [
            { name: "蚌式开合", target: "15 次/侧", tip: "骨盆稳定，慢开慢合" },
            { name: "单腿臀桥", target: "12 次/侧", tip: "难度较高，撑不住就换双腿臀桥" },
            { name: "站姿提踵", target: "20 次", tip: "全程控制，避免弹跳" }
          ]
        }
      ]
    },
    {
      key: "thu",
      label: "周四",
      title: "后背 + 腿后侧",
      sub: "划船 · 耸肩 · 直腿硬拉",
      groups: [
        {
          name: "上肢 · 后背",
          exercises: [
            { name: "4kg 单臂划船", target: "20 个", tip: "背部发力拉向髋部，肘贴身" },
            { name: "4kg 俯身划船", target: "15 个", tip: "俯身保持背部平直，不圆肩" },
            { name: "2kg 耸肩", target: "25 个", tip: "只做垂直耸肩，头部保持中立" }
          ]
        },
        {
          name: "下肢 · 腿后侧（膝盖友好）",
          exercises: [
            { name: "直腿硬拉", target: "12 次", tip: "哑铃贴腿下放，感受大腿后侧拉伸，腰背平直" },
            { name: "臀桥", target: "15 次", tip: "顶点停 2 秒" },
            { name: "蚌式开合", target: "15 次/侧", tip: "侧卧骨盆不前后晃" }
          ]
        }
      ]
    },
    {
      key: "fri",
      label: "周五",
      title: "肱二头肌 + 臀腿",
      sub: "弯举 · 单腿臀桥 · 腿弯举 · 提踵",
      groups: [
        {
          name: "上肢 · 肱二头肌",
          exercises: [
            { name: "2kg 哑铃弯举", target: "25 个", tip: "离心阶段放慢 2 秒效果更好" },
            { name: "4kg 哑铃弯举", target: "15 个", tip: "累了就减量，不要借力甩摆" },
            { name: "2kg 锤式弯举", target: "20 个", tip: "手腕中立不翻腕" }
          ]
        },
        {
          name: "下肢 · 臀腿（膝盖友好）",
          exercises: [
            { name: "单腿臀桥", target: "12 次/侧", tip: "不稳可扶墙或换双腿版" },
            { name: "俯卧腿弯举", target: "12 次", tip: "动作慢，不憋气" },
            { name: "站姿提踵", target: "20 次", tip: "顶点停 1 秒" }
          ]
        }
      ]
    },
    {
      key: "sat",
      label: "周六",
      title: "肱三头肌 + 臀腿",
      sub: "臂屈伸 · 提踵 · 臀桥 · 侧卧抬腿",
      groups: [
        {
          name: "上肢 · 肱三头肌",
          exercises: [
            { name: "2kg 俯身臂屈伸", target: "25 个", tip: "大臂固定，小臂后伸到位" },
            { name: "4kg 颈后臂屈伸", target: "15 个", tip: "肘部内收，下放慢" },
            { name: "2kg 仰卧臂屈伸", target: "20 个", tip: "肩胛稳定，只动肘关节" }
          ]
        },
        {
          name: "下肢 · 臀腿（膝盖友好）",
          exercises: [
            { name: "站姿提踵", target: "20 次", tip: "扶墙，控制下放" },
            { name: "臀桥", target: "15 次", tip: "夹臀上顶，腰不过度反弓" },
            { name: "侧卧抬腿", target: "15 次/侧", tip: "身体不前后倒" }
          ]
        }
      ]
    },
    {
      key: "sun",
      label: "周日",
      title: "肩膀 + 臀腿",
      sub: "侧平举 · 臀推 · 蚌式 · 直腿硬拉",
      groups: [
        {
          name: "上肢 · 肩膀",
          exercises: [
            { name: "2kg 侧平举", target: "20 个", tip: "轻重量高次数，不耸肩" },
            { name: "4kg 肩上推举", target: "15 个", tip: "核心收紧，不塌腰" },
            { name: "2kg 俯身飞鸟", target: "20 个", tip: "背部平直，感受后肩发力" }
          ]
        },
        {
          name: "下肢 · 臀腿（膝盖友好）",
          exercises: [
            { name: "臀推", target: "15 次", tip: "肩背靠凳，顶点夹臀 2 秒" },
            { name: "蚌式开合", target: "15 次/侧", tip: "慢速控制" },
            { name: "直腿硬拉", target: "12 次", tip: "哑铃贴腿，腰背平直" }
          ]
        }
      ]
    }
  ],
  tips: [
    { icon: "🫁", text: "全程不憋气：发力时呼气，还原时吸气（有高血压尤其重要）" },
    { icon: "🦵", text: "膝盖友好：所有下肢动作保持膝盖与脚尖方向一致，不内扣、不过脚尖" },
    { icon: "💪", text: "不求力竭：每组保留 2~3 次余量，动作质量优先于次数" },
    { icon: "⏱️", text: "组间休息 60~90 秒，感到头晕、胸闷立即停止" },
    { icon: "🌡️", text: "练前热身 5 分钟（原地踏步 + 手臂绕环），练后拉伸放松" },
    { icon: "💊", text: "高血压注意：避免大重量憋气类动作，练前确认当天已按时服药" }
  ],
  shortcutName: "记训练"
};
