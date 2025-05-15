// أعلى السّكربت
let movementScore   = 0;
let moving          = false;
let movementTimeout = null;
const ACCEL_THRESHOLD = 0.2;  // العتبة للحسّاس

// في onDeviceMotion
function onDeviceMotion(e) {
  const acc = e.accelerationIncludingGravity || { x:0, y:0, z:0 };
  const delta = Math.hypot(acc.x, acc.y, acc.z) - ACCEL_THRESHOLD;

  if (delta > 0) {
    // فيه حركة
    moving = true;
    // لو عايز تعتبر أنّ الحركة مستمرة حتى لو وقف فجأة بسرعة
    clearTimeout(movementTimeout);
    movementTimeout = setTimeout(() => {
      moving = false;  // بعد 200ms من السكون ندّي فرصة نعتبره ثابت
    }, 200);
  }
}

// في startRound بدلّ الـ countdown الحالي
function startRound() {
  showScreen('balanceGameScreen');
  timerDOM.textContent        = formatTime(roundTime);
  movementScore               = 0;
  movementDisplay.textContent = '0';
  moving                      = false;

  window.addEventListener('devicemotion', onDeviceMotion);

  let remaining = roundTime;
  clearInterval(countdownId);

  countdownId = setInterval(() => {
    remaining--;
    timerDOM.textContent = formatTime(remaining);

    // هِنا نزوّد العداد بس لو في حركة
    if (moving) {
      movementScore++;
    }

    movementDisplay.textContent = movementScore.toFixed(0);

    if (remaining <= 0) {
      clearInterval(countdownId);
      endRound();
    }
  }, 1000);  // صار التحديث كل 1 ثانية عشان يقيس ثواني حركة واضحة
}
