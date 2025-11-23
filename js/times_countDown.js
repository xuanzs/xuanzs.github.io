document.addEventListener("DOMContentLoaded", () => {
  const startBtn   = document.getElementById("startBtn");
  const inputPanel = document.getElementById("inputPanel");
  const timerWrap  = document.getElementById("timerWrap");

  const dHH = document.getElementById("dHH");
  const dMM = document.getElementById("dMM");
  const dSS = document.getElementById("dSS");
  const statusEl  = document.getElementById("status");
  const beepAudio = document.getElementById("beepAudio");

  const DEFAULT_SECONDS = 90 * 60; // 90分钟
  let remaining = DEFAULT_SECONDS;
  let timerId = null;

  const pad2 = (n) => String(n).padStart(2, "0");

  function render(sec){
    const hh = Math.floor(sec / 3600);
    const mm = Math.floor((sec % 3600) / 60);
    const ss = sec % 60;
    dHH.textContent = pad2(hh);
    dMM.textContent = pad2(mm);
    dSS.textContent = pad2(ss);
  }

  function playBeep(){
    if (!beepAudio) return;
    beepAudio.currentTime = 0;
    beepAudio.play().catch(()=>{});
  }

  function startCountdown(){
    // 切换界面：隐藏面板、显示全屏倒计时
    inputPanel.classList.add("hidden");
    timerWrap.classList.remove("hidden");

    statusEl.textContent = "RUNNING...";
    render(remaining);

    timerId = setInterval(() => {
      remaining--;

      // 每 15 分钟提醒一次（900s）
      if (remaining > 0 && remaining % (15 * 60) === 0) {
        playBeep();
      }

      if (remaining <= 0){
        remaining = 0;
        render(0);
        statusEl.textContent = "TIME UP";
        playBeep();
        clearInterval(timerId);
        timerId = null;
        return;
      }

      render(remaining);
    }, 1000);
  }

  // 只能按一次 Start
  startBtn.addEventListener("click", () => {
    if (timerId) return;
    startCountdown();
  });
});
