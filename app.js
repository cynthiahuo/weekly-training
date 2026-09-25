/* ============================================================
   一周训练 · 核心逻辑
   计划模型：每周 7 天，每天 → 部位（多选）+ 锻炼次数 + 每次动作个数 + 每个动作组数
   生成规则：同一天里，每个「次」都覆盖当天所有部位，动作按部位轮转分配；
             次数 > 1 时用偏移量错开，避免两次练到完全一样的动作。
   ============================================================ */
(function () {
  "use strict";

  var DATA = window.TRAINING_DATA;
  if (!DATA || !DATA.parts) {
    document.body.insertAdjacentHTML("afterbegin",
      '<p style="padding:16px;color:#c0492f;font-size:14px">数据加载失败：请确认 data.js 已正确加载。</p>');
    return;
  }

  /* ---------- 常量 ---------- */
  var LS = {
    plan: "wt2_plan",
    ovr: "wt2_ovr",
    prog: "wt2_prog",
    hist: "wt2_hist",
    view: "wt2_view",
    rest: "wt2_rest"
  };
  var DAYS = [
    { key: "mon", label: "周一" }, { key: "tue", label: "周二" },
    { key: "wed", label: "周三" }, { key: "thu", label: "周四" },
    { key: "fri", label: "周五" }, { key: "sat", label: "周六" },
    { key: "sun", label: "周日" }
  ];
  var PART = {};
  DATA.parts.forEach(function (p) { PART[p.key] = p; });

  var MIN_SESS = 1, MAX_SESS = 3, MIN_PER = 2, MAX_PER = 6;

  var $ = function (id) { return document.getElementById(id); };
  function lsGet(k, dflt) {
    try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : dflt; } catch (e) { return dflt; }
  }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ---------- 状态 ---------- */
  var blank = function () { return { parts: [], sessions: 1, perSession: 3, rounds: 3 }; };
  var overrides = lsGet(LS.ovr, {}) || {};
  var progress = lsGet(LS.prog, {}) || {};
  var history = lsGet(LS.hist, []) || [];
  var restSec = lsGet(LS.rest, 60) || 60;
  var planRaw = lsGet(LS.plan, null);
  var plan = (planRaw && typeof planRaw === "object") ? planRaw : {};
  var thisDayKey = DAYS[(new Date().getDay() + 6) % 7].key;
  var viewDay = lsGet(LS.view, thisDayKey);

  DAYS.forEach(function (d) {
    var c = plan[d.key] || {};
    plan[d.key] = {
      parts: Array.isArray(c.parts) ? c.parts.filter(function (k) { return !!PART[k]; }) : [],
      sessions: clamp(c.sessions || 1, MIN_SESS, MAX_SESS),
      perSession: clamp(c.perSession || 3, MIN_PER, MAX_PER),
      rounds: clamp(c.rounds || 3, 2, 4)
    };
  });
  if (!DAY_KEYS().some(function (k) { return k === viewDay; })) viewDay = thisDayKey;
  // 首次使用（本机从未保存过计划）：自动套用第一个模板
  if (!planRaw) {
    applyPreset(DATA.presets[0].plan, true);
    savePlan();
  }

  function DAY_KEYS() { return DAYS.map(function (d) { return d.key; }); }
  function clamp(n, a, b) { n = parseInt(n, 10); if (isNaN(n)) n = a; return Math.max(a, Math.min(b, n)); }
  function dayIdx(k) { return DAY_KEYS().indexOf(k); }
  function todayKey() { return DAYS[(new Date().getDay() + 6) % 7].key; }

  function savePlan() { lsSet(LS.plan, plan); }
  function saveOvr() { lsSet(LS.ovr, overrides); }
  function saveProg() { lsSet(LS.prog, progress); }
  function saveHist() { history = history.slice(0, 60); lsSet(LS.hist, history); }

  function applyPreset(p, silent) {
    DAYS.forEach(function (d) {
      var c = p[d.key] || {};
      plan[d.key] = {
        parts: (c.parts || []).filter(function (k) { return !!PART[k]; }),
        sessions: clamp(c.sessions || 1, MIN_SESS, MAX_SESS),
        perSession: clamp(c.perSession || 3, MIN_PER, MAX_PER),
        rounds: clamp(c.rounds || 3, 2, 4)
      };
    });
    overrides = {};
    if (!silent) { savePlan(); saveOvr(); }
  }

  /* ---------- 进度 key（按自然周，周一为界，每周自动归零） ---------- */
  function weekMonday() {
    var d = new Date();
    var off = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - off);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function pKey(dayKey, sIdx) { return weekMonday() + "|" + dayKey + "|" + sIdx; }
  function getProg(dayKey, sIdx) { return progress[pKey(dayKey, sIdx)] || null; }

  /* ---------- 工具 ---------- */
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function fmtClock(d) { return pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function fmtDate(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function fmtStamp(d) {
    return fmtDate(d) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  }
  function fmtDur(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return h + ":" + pad(m) + ":" + pad(sec);
    return m + ":" + pad(sec);
  }

  var toastTimer = null;
  function toast(msg) {
    var el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2200);
  }
  function partChip(key, ghost) {
    var p = PART[key];
    if (!p) return "";
    if (ghost) return '<span class="chip chip-ghost">' + p.name + "</span>";
    return '<span class="chip" style="background:' + p.color + '">' + p.name + "</span>";
  }
  function partsText(keys) {
    return keys.map(function (k) { return PART[k] ? PART[k].name : k; }).join(" · ");
  }

  /* ---------- 生成某天某一次的动作清单 ---------- */
  function buildSession(dayKey, sIdx) {
    var cfg = plan[dayKey];
    var keys = cfg.parts;
    if (!keys.length) return [];
    var out = [];
    var used = {};
    for (var i = 0; i < cfg.perSession; i++) {
      var pk = keys[(i + sIdx) % keys.length];
      var c = used[pk] || 0; used[pk] = c + 1;
      var lib = PART[pk].ex;
      var idx = (sIdx * 2 + c) % lib.length;
      var ovrKey = dayKey + "|" + sIdx + "|" + i;
      if (typeof overrides[ovrKey] === "number") idx = ((overrides[ovrKey] % lib.length) + lib.length) % lib.length;
      out.push({ part: pk, idx: idx, ex: lib[idx], slot: i, ovrKey: ovrKey });
    }
    return out;
  }
  function dayTotalSets(dayKey) {
    var c = plan[dayKey];
    if (!c.parts.length) return 0;
    return c.sessions * c.perSession * c.rounds;
  }
  function sessionTotalSets(dayKey) {
    var c = plan[dayKey];
    if (!c.parts.length) return 0;
    return c.perSession * c.rounds;
  }

  /* ============================================================
     渲染：星期条
     ============================================================ */
  function renderDayStrip(scrollToActive) {
    var wrap = $("dayStrip");
    var tk = todayKey();
    wrap.innerHTML = DAYS.map(function (d) {
      var c = plan[d.key];
      var cls = "day-chip";
      if (d.key === viewDay) cls += " active";
      if (d.key === tk) cls += " is-today";
      cls += c.parts.length ? " has-plan" : " rest";
      return '<button class="' + cls + '" data-act="viewday" data-day="' + d.key + '">' +
        d.label + '<span class="dc-dot"></span></button>';
    }).join("");
    // 把当前选中的那一天滚到可见位置（手机窄屏下后几天会藏在右侧）
    if (scrollToActive) {
      var el = wrap.querySelector(".day-chip.active");
      if (el) {
        var target = el.offsetLeft - (wrap.clientWidth - el.offsetWidth) / 2;
        var max = wrap.scrollWidth - wrap.clientWidth;
        wrap.scrollLeft = Math.max(0, Math.min(max, target));
      }
    }
  }

  /* ============================================================
     渲染：今日页
     ============================================================ */
  function renderToday() {
    var wrap = $("todayBody");
    var cfg = plan[viewDay];
    var label = DAYS[dayIdx(viewDay)].label;

    if (!cfg.parts.length) {
      wrap.innerHTML =
        '<div class="block">' +
        '<div class="block-head"><span class="block-title">' + label + ' · 休息日</span></div>' +
        '<p class="muted">这一天还没有安排训练。到「计划」页选个部位，或者直接套用一个模板。</p>' +
        '<div class="sync-row" style="margin-top:12px">' +
        '<button class="btn btn-primary" data-act="gotoplan">去制定计划</button>' +
        '<button class="btn btn-line" data-act="quickstart">随便给我排一天</button>' +
        "</div></div>";
      renderRestBarVisibility();
      return;
    }

    var html = "";
    // 日进度
    var doneAll = 0, totalAll = dayTotalSets(viewDay);
    for (var s = 0; s < cfg.sessions; s++) doneAll += sessDone(viewDay, s);
    var pct = totalAll ? Math.round(doneAll / totalAll * 100) : 0;
    html += '<div class="pcard"><div class="phead"><div>' + label + '进度</div>' +
      "<span>" + doneAll + " / " + totalAll + " 组</span></div>" +
      '<div class="bar"><i style="width:' + pct + '%"></i></div></div>';

    // 各次训练
    for (var si = 0; si < cfg.sessions; si++) {
      html += sessionCard(viewDay, si);
    }
    wrap.innerHTML = html;
    updateRestBar();
  }

  function sessDone(dayKey, sIdx) {
    var pr = getProg(dayKey, sIdx);
    if (!pr || !pr.sets) return 0;
    return Object.keys(pr.sets).reduce(function (n, k) { return n + (pr.sets[k] || 0); }, 0);
  }

  function sessionCard(dayKey, sIdx) {
    var cfg = plan[dayKey];
    var list = buildSession(dayKey, sIdx);
    var pr = getProg(dayKey, sIdx) || {};
    var running = pr.start && !pr.end;
    var finished = pr.start && pr.end;
    var done = sessDone(dayKey, sIdx), total = sessionTotalSets(dayKey);

    var h = '<div class="session">';
    h += '<div class="sess-head">' +
      '<div class="sess-no' + (finished ? " done" : "") + '">' + (finished ? "✓" : (sIdx + 1)) + "</div>" +
      '<div class="sess-meta"><div class="sess-title">第 ' + (sIdx + 1) + " 次训练 · " +
      (running ? "进行中" : (finished ? "已完成" : "待开始")) + "</div>" +
      '<div class="sess-sub">' + cfg.perSession + " 个动作 × " + cfg.rounds + " 组 · " + done + "/" + total + " 组</div></div>" +
      '<div class="sess-time" id="sessTime' + sIdx + '">' +
      (finished ? fmtDur(new Date(pr.end) - new Date(pr.start)) : (running ? "0:00" : "—")) +
      "<small>" + (finished ? fmtClock(new Date(pr.start)) + "–" + fmtClock(new Date(pr.end)) : (running ? fmtClock(new Date(pr.start)) + " 开始" : "时长")) +
      "</small></div></div>";

    h += '<div class="sess-body">';
    list.forEach(function (it) {
      var sets = (pr.sets && pr.sets[it.slot]) || 0;
      var p = PART[it.part];
      h += '<div class="ex">' +
        '<div class="ex-top">' +
        '<span class="ex-part" style="background:' + p.color + '">' + p.short + "</span>" +
        '<span class="ex-name">' + it.ex.name + "</span>" +
        '<span class="ex-right">' +
        '<span class="ex-target">' + it.ex.target + "</span>" +
        '<button class="ex-swap" data-act="swap" data-day="' + dayKey + '" data-s="' + sIdx + '" data-slot="' + it.slot + '" aria-label="换动作">⇄</button>' +
        "</span></div>" +
        '<div class="ex-tip">' + it.ex.tip + "</div>" +
        '<div class="ex-eq">器材：' + it.ex.eq + "</div>" +
        '<div class="ex-sets"><span class="lbl">已完成</span>';
      for (var r = 1; r <= cfg.rounds; r++) {
        h += '<button class="setbtn' + (sets >= r ? " on" : "") + '" data-act="set" data-day="' + dayKey +
          '" data-s="' + sIdx + '" data-slot="' + it.slot + '" data-r="' + r + '">' + r + "</button>";
      }
      h += "</div></div>";
    });
    h += "</div>";

    h += '<div class="sess-foot">';
    if (!running && !finished) {
      h += '<button class="btn btn-primary btn-grow" data-act="starter" data-day="' + dayKey + '" data-s="' + sIdx + '">开始第 ' + (sIdx + 1) + " 次</button>";
    } else if (running) {
      h += '<button class="btn btn-danger btn-grow" data-act="ender" data-day="' + dayKey + '" data-s="' + sIdx + '">结束这次训练</button>';
    } else {
      h += '<button class="btn btn-line btn-grow" data-act="again" data-day="' + dayKey + '" data-s="' + sIdx + '">再来一次</button>';
      h += '<button class="btn btn-primary btn-grow" data-act="sync" data-day="' + dayKey + '" data-s="' + sIdx + '">写入健康</button>';
    }
    h += "</div></div>";
    return h;
  }

  /* ============================================================
     渲染：计划页
     ============================================================ */
  function renderPlan() {
    $("presetList").innerHTML = DATA.presets.map(function (p, i) {
      return '<button class="preset" data-act="preset" data-i="' + i + '">' +
        '<span><span class="preset-name">' + p.name + '</span><span class="preset-desc">' + p.desc + "</span></span>" +
        '<span class="preset-arrow">›</span></button>';
    }).join("");

    var tk = todayKey();
    $("planList").innerHTML = DAYS.map(function (d) {
      var c = plan[d.key];
      var partsHtml = c.parts.length
        ? c.parts.map(function (k) { return partChip(k); }).join("")
        : '<span class="plan-empty">休息日</span>';
      var vol = c.parts.length
        ? "每天 " + c.sessions + " 次 · 每次 " + c.perSession + " 个动作 · " + c.rounds + " 组（共 " + dayTotalSets(d.key) + " 组）"
        : "未安排训练";
      return '<button class="plan-row" data-act="editday" data-day="' + d.key + '">' +
        '<span class="plan-day">' + d.label + (d.key === tk ? "<small>今天</small>" : "<small>&nbsp;</small>") + "</span>" +
        '<span class="plan-main"><span class="plan-parts">' + partsHtml + '</span>' +
        '<span class="plan-vol">' + vol + "</span></span>" +
        '<span class="plan-arrow">›</span></button>';
    }).join("");

    var trainDays = DAYS.filter(function (d) { return plan[d.key].parts.length; }).length;
    $("planSummary").textContent = "一周练 " + trainDays + " 天";
  }

  /* ============================================================
     渲染：记录页
     ============================================================ */
  function renderLog() {
    var h = '<div class="block-head"><span class="block-title">训练历史</span>' +
      (history.length ? '<span class="block-hint">' + history.length + " 条</span>" : "") + "</div>";
    if (!history.length) {
      h += '<div class="log-empty">还没有记录<br />到「今日」页开始第一次训练吧</div>';
    } else {
      history.forEach(function (x) {
        h += '<div class="log-row"><div class="log-date">' + x.date + " " + x.dayLabel +
          "<small>" + x.parts + "</small></div>" +
          '<div class="log-info"><b>' + x.sets + " 组</b><span>" + x.duration + "</span></div></div>";
      });
      h += '<div style="margin-top:12px"><button class="btn btn-ghost full" data-act="clearhist">清空记录</button></div>';
    }
    $("logBlock").innerHTML = h;
  }

  /* ============================================================
     渲染：动作库
     ============================================================ */
  function renderLib() {
    $("libBody").innerHTML = DATA.parts.map(function (p) {
      return '<div class="lib-card">' +
        '<div class="lib-head"><span class="chip" style="background:' + p.color + '">' + p.name + "</span>" +
        '<span class="lib-count">' + p.ex.length + " 个动作</span></div>" +
        '<div class="lib-desc">' + p.desc + "</div>" +
        p.ex.map(function (e) {
          return '<div class="lib-item"><div class="lib-item-top">' +
            '<span class="lib-item-name">' + e.name + '</span>' +
            '<span class="lib-item-eq">' + e.eq + "</span>" +
            '<span class="lib-item-rep">' + e.target + "</span></div>" +
            '<div class="lib-item-tip">' + e.tip + "</div></div>";
        }).join("") +
        "</div>";
    }).join("");
  }

  /* ============================================================
     底部抽屉：某天设置
     ============================================================ */
  var draft = null, draftDay = null;

  function openSheet(html) {
    $("sheetBody").innerHTML = html;
    $("sheet").classList.add("show");
    $("sheetMask").classList.add("show");
  }
  function closeSheet() {
    $("sheet").classList.remove("show");
    $("sheetMask").classList.remove("show");
  }

  function openDayEditor(dayKey) {
    draftDay = dayKey;
    draft = JSON.parse(JSON.stringify(plan[dayKey]));
    paintDayEditor();
  }

  function paintDayEditor() {
    var d = DAYS[dayIdx(draftDay)];
    var h = "<h3>" + d.label + " · 训练设置</h3>" +
      '<p class="sheet-sub">先选这天要练的部位，再决定练几次、每次几个动作。</p>';

    h += '<div class="field"><div class="field-label">练哪些部位 <em>可多选</em></div><div class="part-grid">';
    DATA.parts.forEach(function (p) {
      var on = draft.parts.indexOf(p.key) >= 0;
      h += '<button class="part-pick' + (on ? " on" : "") + '" data-act="togglepart" data-part="' + p.key + '"' +
        (on ? ' style="background:' + p.color + '"' : "") + ">" +
        '<span class="sw" style="background:' + (on ? "#fff" : p.color) + '"></span>' + p.name + "</button>";
    });
    h += "</div></div>";

    h += '<div class="field"><div class="field-label">每天锻炼几次 <em>1 ~ 3 次</em></div>' +
      '<div class="stepper">' +
      '<button class="step-btn" data-act="sess" data-v="-1"' + (draft.sessions <= MIN_SESS ? " disabled" : "") + ">−</button>" +
      '<div class="step-val"><b>' + draft.sessions + '</b><span>次 / 天</span></div>' +
      '<button class="step-btn" data-act="sess" data-v="1"' + (draft.sessions >= MAX_SESS ? " disabled" : "") + ">+</button>" +
      "</div></div>";

    h += '<div class="field"><div class="field-label">每次锻炼几个动作 <em>2 ~ 6 个</em></div>' +
      '<div class="stepper">' +
      '<button class="step-btn" data-act="per" data-v="-1"' + (draft.perSession <= MIN_PER ? " disabled" : "") + ">−</button>" +
      '<div class="step-val"><b>' + draft.perSession + '</b><span>个 / 次</span></div>' +
      '<button class="step-btn" data-act="per" data-v="1"' + (draft.perSession >= MAX_PER ? " disabled" : "") + ">+</button>" +
      "</div></div>";

    h += '<div class="field"><div class="field-label">每个动作做几组</div><div class="seg">' +
      [2, 3, 4].map(function (r) {
        return '<button class="' + (draft.rounds === r ? "on" : "") + '" data-act="rounds" data-v="' + r + '">' + r + " 组</button>";
      }).join("") + "</div></div>";

    h += '<div class="field"><div class="field-label">组间休息</div><div class="seg">' +
      [60, 90, 120].map(function (r) {
        return '<button class="' + (restSec === r ? "on" : "") + '" data-act="rest" data-v="' + r + '">' + r + " 秒</button>";
      }).join("") + "</div></div>";

    // 预览
    var totalSets = draft.parts.length ? draft.sessions * draft.perSession * draft.rounds : 0;
    // 估算：每组耗时约 40 秒 + 组间休息
    var mins = totalSets ? Math.max(4, Math.round(totalSets * (40 + restSec) / 60)) : 0;
    h += '<div class="preview">';
    if (!draft.parts.length) {
      h += "当前是<b>休息日</b>，保存后这天不安排训练。";
    } else {
      h += "<b>" + d.label + "：" + draft.parts.length + " 个部位 · " + draft.sessions + " 次 × " +
        draft.perSession + " 个动作 × " + draft.rounds + " 组</b><br />" +
        "共 <b>" + totalSets + " 组</b>，预计用时约 <b>" + mins + " 分钟</b>（含 " + restSec + " 秒组间休息）。<br />" +
        "部位：" + partsText(draft.parts);
    }
    h += "</div>";

    h += '<div class="sheet-actions">' +
      '<button class="btn btn-plain" data-act="sheetcancel">取消</button>' +
      '<button class="btn btn-primary" data-act="sheetsave">保存</button></div>';

    openSheet(h);
  }

  /* ============================================================
     训练进度操作
     ============================================================ */
  function startSession(dayKey, sIdx) {
    var k = pKey(dayKey, sIdx);
    progress[k] = { start: new Date().toISOString(), end: null, sets: {} };
    saveProg();
    toast("第 " + (sIdx + 1) + " 次开始，加油 💪");
    renderToday();
    startTick();
  }

  function endSession(dayKey, sIdx) {
    var k = pKey(dayKey, sIdx);
    var pr = progress[k];
    if (!pr || !pr.start) return;
    pr.end = new Date().toISOString();
    saveProg();
    var st = new Date(pr.start), en = new Date(pr.end);
    var done = sessDone(dayKey, sIdx);
    history.unshift({
      date: fmtDate(en),
      dayLabel: DAYS[dayIdx(dayKey)].label,
      parts: partsText(plan[dayKey].parts),
      sets: done,
      duration: fmtDur(en - st),
      start: fmtStamp(st),
      end: fmtStamp(en),
      minutes: Math.max(1, Math.round((en - st) / 60000))
    });
    saveHist();
    stopTick();
    toast("本次 " + done + " 组完成，可写入 Apple 健康");
    renderToday();
    renderLog();
  }

  function resetSession(dayKey, sIdx) {
    var k = pKey(dayKey, sIdx);
    delete progress[k];
    saveProg();
    renderToday();
  }

  function toggleSet(dayKey, sIdx, slot, r) {
    var k = pKey(dayKey, sIdx);
    var pr = progress[k];
    if (!pr || !pr.start) { toast("先点「开始第 " + (sIdx + 1) + " 次」再记组数"); return; }
    if (pr.end) { toast("这次已经结束了，点「再来一次」重开"); return; }
    var cur = (pr.sets && pr.sets[slot]) || 0;
    pr.sets[slot] = (cur === r) ? r - 1 : r;
    saveProg();
    renderToday();
    if (pr.sets[slot] > cur) startRest();
  }

  function swapExercise(dayKey, sIdx, slot) {
    var cfg = plan[dayKey];
    var keys = cfg.parts;
    var pk = keys[(slot + sIdx) % keys.length];
    var used = {};
    var c = 0;
    for (var i = 0; i <= slot; i++) {
      var kk = keys[(i + sIdx) % keys.length];
      if (kk === pk) c++;
    }
    var lib = PART[pk].ex;
    var ovrKey = dayKey + "|" + sIdx + "|" + slot;
    var cur = typeof overrides[ovrKey] === "number" ? overrides[ovrKey] : (sIdx * 2 + c - 1) % lib.length;
    overrides[ovrKey] = (cur + 1) % lib.length;
    saveOvr();
    renderToday();
    toast("已换成：" + lib[overrides[ovrKey]].name);
  }

  /* ============================================================
     计时器
     ============================================================ */
  var tick = null;
  function startTick() {
    stopTick();
    tick = setInterval(function () {
      var any = false;
      for (var s = 0; s < plan[viewDay].sessions; s++) {
        var pr = getProg(viewDay, s);
        var el = $("sessTime" + s);
        if (pr && pr.start && !pr.end) {
          any = true;
          if (el) el.innerHTML = fmtDur(Date.now() - new Date(pr.start).getTime()) +
            "<small>" + fmtClock(new Date(pr.start)) + " 开始</small>";
        }
      }
      if (!any) stopTick();
    }, 1000);
  }
  function stopTick() { if (tick) { clearInterval(tick); tick = null; } }

  /* ============================================================
     组间休息倒计时
     ============================================================ */
  var restTimer = null, restLeft = 0;
  function startRest() {
    restLeft = restSec;
    $("restBar").classList.add("show");
    updateRestBar();
    runRestCountdown();
  }
  function runRestCountdown() {
    clearInterval(restTimer);
    restTimer = setInterval(function () {
      restLeft--;
      if (restLeft <= 0) {
        clearInterval(restTimer); restTimer = null;
        $("restBar").classList.remove("show");
        toast("休息结束，继续下一组 💪");
      } else updateRestBar();
    }, 1000);
  }
  function stopRest() {
    clearInterval(restTimer); restTimer = null;
    $("restBar").classList.remove("show");
  }
  function updateRestBar() {
    $("restCount").textContent = restLeft > 0 ? restLeft : restSec;
  }
  function renderRestBarVisibility() { stopRest(); }

  /* ============================================================
     Apple 健康同步
     ============================================================ */
  function buildMinutes(dayKey, sIdx) {
    var pr = getProg(dayKey, sIdx);
    if (!pr || !pr.start || !pr.end) return 0;
    return Math.max(1, Math.round((new Date(pr.end) - new Date(pr.start)) / 60000));
  }
  function shortcutUrl(minutes) {
    return "shortcuts://run-shortcut?name=" + encodeURIComponent(DATA.shortcutName) +
      "&input=text&text=" + encodeURIComponent(String(minutes));
  }
  function openSync(dayKey, sIdx) {
    var mins = buildMinutes(dayKey, sIdx);
    if (!mins) { toast("先完成一次训练（开始 → 结束）"); return; }
    var url = shortcutUrl(mins);
    var st = new Date(getProg(dayKey, sIdx).start);
    $("syncTitle").textContent = "写入 Apple 健康";
    $("syncDesc").textContent = DAYS[dayIdx(dayKey)].label + " 第 " + (sIdx + 1) + " 次 · " +
      fmtClock(st) + " 开始 · 共 " + mins + " 分钟。" +
      "点「打开快捷指令」运行「记训练」即可写入体能训练。";
    $("syncPreview").textContent = url;
    $("modalSync").classList.add("open");
    drawQr(url);
  }
  function drawQr(url) {
    var canvas = $("qrCanvas"), ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (window.qrcode) {
      try {
        var qr = window.qrcode(0, "M");
        qr.addData(url); qr.make();
        var count = qr.getModuleCount(), size = canvas.width;
        var cell = Math.floor(size / (count + 4));
        var offset = Math.floor((size - cell * count) / 2);
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = "#111";
        for (var r = 0; r < count; r++) for (var c = 0; c < count; c++) {
          if (qr.isDark(r, c)) ctx.fillRect(offset + c * cell, offset + r * cell, cell, cell);
        }
        return;
      } catch (e) { /* fallthrough */ }
    }
    ctx.fillStyle = "#f4f6f4"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /* ============================================================
     标签切换
     ============================================================ */
  function switchTab(name) {
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (b) {
      b.classList.toggle("is-active", b.dataset.tab === name);
    });
    Array.prototype.forEach.call(document.querySelectorAll(".page"), function (p) {
      p.classList.toggle("is-active", p.id === "page-" + name);
    });
    window.scrollTo(0, 0);
    if (name === "plan") renderPlan();
    if (name === "log") renderLog();
    if (name === "today") renderToday();
  }

  /* ============================================================
     事件绑定
     ============================================================ */
  function bind() {
    // 标签栏
    $("tabbar").addEventListener("click", function (e) {
      var b = e.target && e.target.closest ? e.target.closest(".tab") : null;
      if (b) switchTab(b.dataset.tab);
    });

    // 弹窗 / 抽屉按钮
    $("btnSafety").onclick = function () { $("modalSafety").classList.add("open"); };
    $("modalSafetyClose").onclick = function () { $("modalSafety").classList.remove("open"); };
    $("btnInstall").onclick = function () { $("modalHelp").classList.add("open"); };
    $("modalHelpClose").onclick = function () { $("modalHelp").classList.remove("open"); };
    $("modalClose").onclick = function () { $("modalSync").classList.remove("open"); };
    $("btnTestSync").onclick = function () {
      window.location.href = shortcutUrl(5);
    };
    $("btnHowto").onclick = function () { $("modalHelp").classList.add("open"); };
    $("syncGo").onclick = function () {
      var v = $("syncPreview").textContent;
      if (v && v.indexOf("shortcuts://") === 0) window.location.href = v;
    };
    $("btnCopyLink").onclick = function () {
      var v = $("syncPreview").textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(v).then(function () { toast("链接已复制"); },
          function () { toast("长按下方链接复制"); });
      } else toast("长按下方链接复制");
    };
    $("restSkip").onclick = stopRest;
    $("restPlus").onclick = function () {
      restLeft = (restLeft > 0 ? restLeft : 0) + 30;
      updateRestBar();
      runRestCountdown();
    };
    $("sheetMask").onclick = closeSheet;
    Array.prototype.forEach.call(document.querySelectorAll(".modal"), function (m) {
      m.addEventListener("click", function (e) { if (e.target === m) m.classList.remove("open"); });
    });

    // 今日页（事件委托）
    $("page-today").addEventListener("click", function (e) {
      var t = e.target && e.target.closest ? e.target.closest("[data-act]") : null;
      if (!t) return;
      var a = t.dataset.act, d = t.dataset.day, s = parseInt(t.dataset.s, 10);
      if (a === "viewday") {
        viewDay = d; lsSet(LS.view, viewDay);
        renderDayStrip(true); renderToday(); startTick();
      } else if (a === "starter") startSession(d, s);
      else if (a === "ender") endSession(d, s);
      else if (a === "again") resetSession(d, s);
      else if (a === "set") toggleSet(d, s, parseInt(t.dataset.slot, 10), parseInt(t.dataset.r, 10));
      else if (a === "swap") swapExercise(d, s, parseInt(t.dataset.slot, 10));
      else if (a === "sync") openSync(d, s);
      else if (a === "gotoplan") switchTab("plan");
      else if (a === "quickstart") {
        plan[viewDay] = { parts: ["chest", "back", "abs"], sessions: 1, perSession: 3, rounds: 3 };
        savePlan(); saveOvr();
        toast("已排好：胸 + 背 + 腹");
        renderDayStrip(false); renderToday(); renderPlan();
      }
    });

    // 计划页
    $("page-plan").addEventListener("click", function (e) {
      var t = e.target && e.target.closest ? e.target.closest("[data-act]") : null;
      if (!t) return;
      var a = t.dataset.act;
      if (a === "preset") {
        var p = DATA.presets[parseInt(t.dataset.i, 10)];
        applyPreset(p.plan);
        renderPlan(); renderDayStrip(false); renderToday();
        toast("已套用模板：" + p.name);
      } else if (a === "editday") openDayEditor(t.dataset.day);
    });

    // 记录页
    $("page-log").addEventListener("click", function (e) {
      var t = e.target && e.target.closest ? e.target.closest("[data-act]") : null;
      if (!t) return;
      if (t.dataset.act === "clearhist") {
        if (history.length && window.confirm("确定清空所有训练记录？（不可恢复）")) {
          history = []; saveHist(); renderLog(); toast("记录已清空");
        }
      }
    });

    // 抽屉内
    $("sheetBody").addEventListener("click", function (e) {
      var t = e.target && e.target.closest ? e.target.closest("[data-act]") : null;
      if (!t) return;
      var a = t.dataset.act, v = parseInt(t.dataset.v, 10);
      if (a === "togglepart") {
        var k = t.dataset.part, i = draft.parts.indexOf(k);
        if (i >= 0) draft.parts.splice(i, 1); else draft.parts.push(k);
        // 保持与动作库顺序一致
        draft.parts.sort(function (x, y) { return orderOf(x) - orderOf(y); });
        paintDayEditor();
      } else if (a === "sess") {
        draft.sessions = clamp(draft.sessions + v, MIN_SESS, MAX_SESS); paintDayEditor();
      } else if (a === "per") {
        draft.perSession = clamp(draft.perSession + v, MIN_PER, MAX_PER); paintDayEditor();
      } else if (a === "rounds") {
        draft.rounds = v; paintDayEditor();
      } else if (a === "rest") {
        restSec = v; lsSet(LS.rest, restSec); paintDayEditor();
      } else if (a === "sheetcancel") {
        closeSheet();
      } else if (a === "sheetsave") {
        plan[draftDay] = draft;
        savePlan(); saveOvr();
        closeSheet();
        renderPlan(); renderDayStrip(false); renderToday();
        toast(DAYS[dayIdx(draftDay)].label + " 已保存");
      }
    });
  }
  function orderOf(k) {
    for (var i = 0; i < DATA.parts.length; i++) if (DATA.parts[i].key === k) return i;
    return 99;
  }

  /* ============================================================
     启动
     ============================================================ */
  $("tips").innerHTML = DATA.tips.map(function (t) {
    return '<div class="tip-item"><b>' + t.icon + "</b><span>" + t.text + "</span></div>";
  }).join("");

  renderDayStrip(true);
  renderToday();
  renderPlan();
  renderLog();
  renderLib();
  bind();
  startTick();

  // Service Worker：网络优先，离线可回退缓存
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
})();
