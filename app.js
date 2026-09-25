/* 一周训练 · 核心逻辑 */
(function () {
  "use strict";

  var DATA = window.TRAINING_DATA || (typeof TRAINING_DATA !== "undefined" ? TRAINING_DATA : null);
  if (!DATA || !DATA.days) {
    document.body.insertAdjacentHTML("afterbegin",
      '<p style="padding:16px;color:#c0492f;font-size:14px">数据加载失败：请确认 data.js 已正确加载。</p>');
    return;
  }
  var LS_STATE = "wt_state_v1";
  var LS_HISTORY = "wt_history_v1";

  var $ = function (id) { return document.getElementById(id); };

  /* ---------- 状态 ---------- */
  var state = {
    dayIndex: (new Date().getDay() + 6) % 7, // 周一=0
    sessionStart: null,   // Date ISO
    sessionEnd: null,
    dots: {}              // { "0": [r,r,...] 每个动作的轮数 0-3 }
  };
  var history = [];
  var timerInterval = null;

  function loadState() {
    try {
      var s = JSON.parse(localStorage.getItem(LS_STATE) || "null");
      if (s && typeof s.dayIndex === "number") {
        state.dayIndex = s.dayIndex;
        state.sessionStart = s.sessionStart || null;
        state.sessionEnd = s.sessionEnd || null;
        state.dots = s.dots || {};
      }
      history = JSON.parse(localStorage.getItem(LS_HISTORY) || "[]");
      if (!Array.isArray(history)) history = [];
    } catch (e) { /* 忽略损坏数据 */ }
  }

  function saveState() {
    try { localStorage.setItem(LS_STATE, JSON.stringify(state)); } catch (e) {}
  }
  function saveHistory() {
    try {
      history = history.slice(0, 30);
      localStorage.setItem(LS_HISTORY, JSON.stringify(history));
    } catch (e) {}
  }

  /* ---------- 工具 ---------- */
  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function fmtClock(d) {
    return pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  function fmtDate(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  /* 快捷指令需要的格式: 2025-01-15T10:30:00 */
  function fmtStamp(d) {
    return fmtDate(d) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  }
  function fmtDuration(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return h + ":" + pad(m) + ":" + pad(sec);
    return pad(m) + ":" + pad(sec);
  }

  function dayTotal(day) {
    return day.groups.reduce(function (n, g) { return n + g.exercises.length * 3; }, 0);
  }
  function dayDone(idx) {
    var arr = state.dots[idx] || [];
    return arr.reduce(function (n, r) { return n + (r || 0); }, 0);
  }

  var toastTimer = null;
  function toast(msg) {
    var el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2200);
  }

  /* ---------- 渲染 ---------- */
  function renderDays() {
    var wrap = $("days");
    wrap.innerHTML = "";
    var todayIdx = (new Date().getDay() + 6) % 7;
    DATA.days.forEach(function (d, i) {
      var b = document.createElement("button");
      b.className = "day-chip" + (i === state.dayIndex ? " active" : "") + (i === todayIdx ? " is-today" : "");
      b.innerHTML = d.label + (i === todayIdx ? "<small>今天</small>" : "<small>&nbsp;</small>");
      b.onclick = function () {
        if (state.sessionStart && !state.sessionEnd) {
          toast("先结束当前训练再切换日期");
          return;
        }
        state.dayIndex = i;
        saveState();
        renderAll();
      };
      wrap.appendChild(b);
    });
  }

  function renderSession() {
    var d = DATA.days[state.dayIndex];
    $("sessionTitle").textContent = d.label + " · " + d.title;
    $("sessionSub").textContent = d.sub;
    $("statSets").textContent = dayDone(state.dayIndex) + "/" + dayTotal(d);

    var btn = $("btnSession");
    var pill = $("timerPill");
    var todayIdx = (new Date().getDay() + 6) % 7;
    var pillPrefix = (state.dayIndex === todayIdx ? "今天 " : "") + d.label;

    if (state.sessionStart && !state.sessionEnd) {
      btn.textContent = "结束训练";
      btn.classList.add("running");
      $("btnSync").disabled = true;
      $("statTimeRange").textContent = fmtClock(new Date(state.sessionStart)) + " – 进行中";
      pill.textContent = pillPrefix + " · " + fmtDuration(Date.now() - new Date(state.sessionStart).getTime());
      startTimer();
    } else if (state.sessionStart && state.sessionEnd) {
      btn.textContent = "再练一次";
      btn.classList.remove("running");
      $("btnSync").disabled = false;
      var st = new Date(state.sessionStart), en = new Date(state.sessionEnd);
      $("statTimeRange").textContent = fmtClock(st) + " – " + fmtClock(en);
      $("statTime").textContent = fmtDuration(en - st);
      pill.textContent = pillPrefix + " · 已完成 " + fmtDuration(en - st);
      stopTimer();
    } else {
      btn.textContent = "开始训练";
      btn.classList.remove("running");
      $("btnSync").disabled = true;
      $("statTime").textContent = "—";
      $("statTimeRange").textContent = "未开始";
      pill.textContent = pillPrefix;
      stopTimer();
    }
  }

  function renderProgress() {
    var d = DATA.days[state.dayIndex];
    var done = dayDone(state.dayIndex), total = dayTotal(d);
    $("progressText").textContent = done + " / " + total + " 组完成";
    $("progressBar").style.width = total ? (done / total * 100) + "%" : "0%";
  }

  function renderExercises() {
    var wrap = $("exercises");
    wrap.innerHTML = "";
    var d = DATA.days[state.dayIndex];
    var arr = state.dots[state.dayIndex] || [];

    d.groups.forEach(function (g) {
      var gc = document.createElement("div");
      gc.className = "group-card";

      var gn = document.createElement("div");
      gn.className = "group-name";
      gn.textContent = g.name;
      gc.appendChild(gn);

      g.exercises.forEach(function (ex, i) {
        var gi = d.groups.indexOf(g);
        var flatIdx = d.groups.slice(0, gi).reduce(function (n, gg) { return n + gg.exercises.length; }, 0) + i;
        var rounds = arr[flatIdx] || 0;

        var ec = document.createElement("div");
        ec.className = "exercise";

        var row = document.createElement("div");
        row.className = "ex-row";
        row.innerHTML = '<div class="ex-name">' + ex.name + '</div><div class="ex-target">' + ex.target + "</div>";

        var tip = document.createElement("div");
        tip.className = "ex-tip";
        tip.textContent = "💡 " + ex.tip;

        var dots = document.createElement("div");
        dots.className = "ex-dots";
        dots.innerHTML = '<span class="dots-label">完成轮次</span>';

        [1, 2, 3].forEach(function (r) {
          var dot = document.createElement("button");
          dot.className = "dot" + (rounds >= r ? " on" : "");
          dot.textContent = r;
          dot.onclick = function () {
            if (!state.sessionStart) {
              toast("先点「开始训练」再记录组次");
              return;
            }
            var a = state.dots[state.dayIndex] || (state.dots[state.dayIndex] = []);
            var cur = a[flatIdx] || 0;
            a[flatIdx] = (cur === r) ? r - 1 : r; // 点当前值=减一，实现可撤销
            saveState();
            renderExercises();
            renderProgress();
            renderSession();
          };
          dots.appendChild(dot);
        });

        ec.appendChild(row);
        ec.appendChild(tip);
        ec.appendChild(dots);
        gc.appendChild(ec);
      });

      wrap.appendChild(gc);
    });
  }

  function renderTips() {
    var wrap = $("tips");
    wrap.innerHTML = "";
    DATA.tips.forEach(function (t) {
      var el = document.createElement("div");
      el.className = "tip-item";
      el.innerHTML = "<b>" + t.icon + "</b><span>" + t.text + "</span>";
      wrap.appendChild(el);
    });
  }

  function renderHistory() {
    var wrap = $("history");
    wrap.innerHTML = "";
    if (!history.length) {
      wrap.innerHTML = '<div class="history-empty">还没有记录，练完一次就会出现在这里</div>';
      return;
    }
    history.forEach(function (h) {
      var row = document.createElement("div");
      row.className = "history-row";
      row.innerHTML = '<span class="h-date">' + h.date + " " + h.dayLabel + '</span>' +
        '<span class="h-info">' + h.sets + " 组 · " + h.duration + "</span>";
      wrap.appendChild(row);
    });
  }

  function renderAll() {
    renderDays();
    renderSession();
    renderProgress();
    renderExercises();
    renderHistory();
  }

  /* ---------- 计时器 ---------- */
  function startTimer() {
    stopTimer();
    timerInterval = setInterval(function () {
      if (!state.sessionStart || state.sessionEnd) return stopTimer();
      var st = new Date(state.sessionStart).getTime();
      $("statTime").textContent = fmtDuration(Date.now() - st);
      var pill = $("timerPill");
      var d = DATA.days[state.dayIndex];
      var todayIdx = (new Date().getDay() + 6) % 7;
      var prefix = (state.dayIndex === todayIdx ? "今天 " : "") + d.label;
      pill.textContent = prefix + " · " + fmtDuration(Date.now() - st);
    }, 1000);
  }
  function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  /* ---------- 会话控制 ---------- */
  function toggleSession() {
    if (!state.sessionStart || state.sessionEnd) {
      // 开始新一轮
      state.sessionStart = new Date().toISOString();
      state.sessionEnd = null;
      state.dots[state.dayIndex] = [];
      saveState();
      toast("训练开始，加油 💪");
    } else {
      // 结束
      state.sessionEnd = new Date().toISOString();
      var st = new Date(state.sessionStart), en = new Date(state.sessionEnd);
      var d = DATA.days[state.dayIndex];
      var done = dayDone(state.dayIndex);
      history.unshift({
        date: fmtDate(en),
        dayLabel: d.label,
        sets: done,
        duration: fmtDuration(en - st),
        start: fmtStamp(st),
        end: fmtStamp(en)
      });
      saveHistory();
      saveState();
      toast("本次 " + done + " 组完成！可写入 Apple 健康");
      $("btnSyncBottom").style.display = "";
    }
    renderAll();
  }

  /* ---------- Apple 健康同步 ---------- */
  /* 传给快捷指令的内容 = 本次训练的分钟数（整数），快捷指令只需一个「记录体能训练」动作 */
  function buildMinutes() {
    if (!state.sessionStart || !state.sessionEnd) return 0;
    var ms = new Date(state.sessionEnd) - new Date(state.sessionStart);
    return Math.max(1, Math.round(ms / 60000));
  }

  function buildShortcutUrl() {
    return "shortcuts://run-shortcut?name=" + encodeURIComponent(DATA.shortcutName) +
      "&input=text&text=" + encodeURIComponent(String(buildMinutes()));
  }

  function openSyncModal() {
    if (!state.sessionStart || !state.sessionEnd) {
      toast("先完成一次训练（开始→结束）");
      return;
    }
    var url = buildShortcutUrl();
    $("syncPreview").textContent = "本次训练 " + buildMinutes() + " 分钟 · " + url;
    $("modal").classList.add("open");

    // 桌面：优先尝试用二维码库渲染，失败则给出链接
    drawQr(url);
  }

  function drawQr(url) {
    var canvas = $("qrCanvas");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (window.qrcode) {
      try {
        var qr = window.qrcode(0, "M");
        qr.addData(url);
        qr.make();
        var count = qr.getModuleCount();
        var size = canvas.width;
        var cell = Math.floor(size / (count + 4));
        var offset = Math.floor((size - cell * count) / 2);
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = "#111";
        for (var r = 0; r < count; r++) {
          for (var c = 0; c < count; c++) {
            if (qr.isDark(r, c)) {
              ctx.fillRect(offset + c * cell, offset + r * cell, cell, cell);
            }
          }
        }
        return;
      } catch (e) { /* 落到文字 */ }
    }
    ctx.fillStyle = "#f4f6f4";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#6b7a74";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("二维码库未加载", canvas.width / 2, canvas.height / 2);
  }

  function doSync() {
    var url = buildShortcutUrl();
    window.location.href = url;
  }

  /* ---------- 安装提示 ---------- */
  var deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
  });

  function promptInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt = null;
    } else {
      toast("iPhone：Safari 分享 → 添加到主屏幕");
    }
  }

  /* ---------- 事件绑定 ---------- */
  function bind() {
    $("btnSession").addEventListener("click", toggleSession);
    $("btnSync").addEventListener("click", openSyncModal);
    $("btnSyncBottom").addEventListener("click", openSyncModal);
    $("btnInstall").addEventListener("click", promptInstall);
    $("btnTips").addEventListener("click", function () { $("modalTips").classList.add("open"); });
    $("modalTipsClose").addEventListener("click", function () { $("modalTips").classList.remove("open"); });
    $("modalClose").addEventListener("click", function () { $("modal").classList.remove("open"); });
    $("btnCopyLink").addEventListener("click", function () {
      var url = buildShortcutUrl();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { toast("链接已复制"); });
      } else {
        toast("长按预览区复制链接");
      }
    });
    // 弹窗里再给一个大按钮直接跳快捷指令
    var syncGo = document.createElement("button");
    syncGo.className = "btn btn-primary";
    syncGo.textContent = "打开快捷指令";
    syncGo.style.width = "100%";
    syncGo.onclick = doSync;
    document.querySelector("#modal .modal-actions").after(syncGo);

    // 测试入口：不依赖真实训练，直接用 5 分钟测试数据跑一遍快捷指令
    var testGo = document.createElement("button");
    testGo.className = "btn btn-line";
    testGo.textContent = "测试：用 5 分钟测试数据试跑一次";
    testGo.style.width = "100%";
    testGo.style.marginTop = "8px";
    testGo.onclick = function () {
      window.location.href = "shortcuts://run-shortcut?name=" +
        encodeURIComponent(DATA.shortcutName) + "&input=text&text=5";
    };
    document.querySelector("#modal .modal-card").appendChild(testGo);
  }

  /* ---------- 启动 ---------- */
  loadState();
  bind();
  renderTips();
  renderAll();
})();
