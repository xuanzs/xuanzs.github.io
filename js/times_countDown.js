document.addEventListener("DOMContentLoaded", () => {
  const startBtn   = document.getElementById("startBtn");
  const inputPanel = document.getElementById("inputPanel");
  const timerWrap  = document.getElementById("timerWrap");

  const dHH = document.getElementById("dHH");
  const dMM = document.getElementById("dMM");
  const dSS = document.getElementById("dSS");
  const statusEl  = document.getElementById("status");
  const beepAudio = document.getElementById("beepAudio");

  let clockTimerId = null;

  // ✅ 记录开始时间 & 下一次响铃时间
  let startTimeMs = null;
  let nextBeepAtMs = null;

  const BEEP_EVERY_MIN = 29.80;
  const BEEP_INTERVAL_MS = BEEP_EVERY_MIN * 60 * 1000;

  const pad2 = (n) => String(n).padStart(2, "0");

  function renderNowTime() {
    const now = new Date();
    dHH.textContent = pad2(now.getHours());
    dMM.textContent = pad2(now.getMinutes());
    dSS.textContent = pad2(now.getSeconds());
  }

  function playBeep() {
    if (!beepAudio) return;
    beepAudio.currentTime = 0;
    beepAudio.play().catch(() => {
      // 如果浏览器阻止自动播放，这里不报错
    });
  }

  function tick() {
    // 1) 永远更新现实时间
    renderNowTime();

    // 2) 如果已开始，检查是否到 30 分钟提醒
    if (startTimeMs && nextBeepAtMs) {
      const nowMs = Date.now();
      if (nowMs >= nextBeepAtMs) {
        playBeep();

        // ⚠️ 用 while 防止“页面后台太久”一次跳过很多轮
        while (nextBeepAtMs <= nowMs) {
          nextBeepAtMs += BEEP_INTERVAL_MS;
        }
      }
    }
  }

  function startRealClock() {
    // 切换界面
    inputPanel.classList.add("hidden");
    timerWrap.classList.remove("hidden");

    // 记录开始时刻 & 设置第一次响铃（30分钟后）
    startTimeMs = Date.now();
    nextBeepAtMs = startTimeMs + BEEP_INTERVAL_MS;

    statusEl.textContent = "RUNNING...";
    renderNowTime();

    // 每秒刷新一次现实时间
    clockTimerId = setInterval(tick, 1000);
    tick();
  }

  startBtn.addEventListener("click", () => {
    if (clockTimerId) return;
    startRealClock();
  });
});
