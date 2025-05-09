// Dependencies: loadPlayers(), showScreen(id)
document.addEventListener('DOMContentLoaded', () => {
  const playersBalance = loadPlayers();
  let roundTimeBalance = 10;     // seconds
  let currentIdxBalance = 0;
  let countdownIdBalance = null;

  // count of shakes
  let movementScore = 0;
  const ACCEL_THRESHOLD = 0.7;    // lower threshold for extra sensitivity
  let lastShakeTime = 0;
  const SHAKE_DEBOUNCE = 200;     // shorter debounce

  // per-player results
  const results = playersBalance.map(name => ({
    name,
    movement: 0,
    roundPoints: 0,
    totalPoints: parseInt(localStorage.getItem(name)) || 0
  }));

  // DOM refs
  const sliderBalance          = document.getElementById('balanceTimeSlider');
  const timeValueBalance       = document.getElementById('balanceTimeValue');
  const backRulesBtnBalance    = document.getElementById('backToRulesBtnBalance');
  const startBtnBalance        = document.getElementById('startBalanceBtn');
  const launchBtnBalance       = document.getElementById('startBalanceSettingsBtn');
  const passTextBalance        = document.getElementById('balancePassText');
  const passNextBtnBalance     = document.getElementById('balancePassNextBtn');
  const timerDOMBalance        = document.getElementById('balanceTimer');
  const playerDOMBalance       = document.getElementById('balanceCurrentPlayer');
  const movementDisplayBalance = document.getElementById('balanceMovementDisplay');
  const resultsBodyBalance     = document.getElementById('balanceResultsBody');
  const replayBtnBalance       = document.getElementById('balanceReplayBtn');
  const backGamesBtnBalance    = document.getElementById('balanceBackBtn');

  // navigation
  document.getElementById('backToGamesBtnBalance')
          .onclick = () => showScreen('gamesScreen');
  backRulesBtnBalance.onclick  = () => showScreen('balanceRulesScreen');
  startBtnBalance.onclick      = () => showScreen('balanceSettingsScreen');

  // sliderBalance controlling roundTimeBalance
  sliderBalance.addEventListener('input', e => {
    roundTimeBalance = +e.target.value;
    timeValueBalance.textContent = `${roundTimeBalance} ثانية`;
  });

  // after settings → first pass
  launchBtnBalance.onclick = () => {
    currentIdxBalance = 0;
    results.forEach(r => { r.movement = 0; r.roundPoints = 0; });
    nextPass();
  };

  function nextPass() {
    if (currentIdxBalance >= playersBalance.length) {
      return showFinalResults();
    }
    const name = playersBalance[currentIdxBalance];
    passTextBalance.textContent  = `📱 الدور على: ${name}`;
    playerDOMBalance.textContent = name;
    showScreen('balancePassScreen');
  }

  passNextBtnBalance.onclick = () => startRound();

  function startRound() {
    showScreen('balanceGameScreen');
    timerDOMBalance.textContent        = formatTime(roundTimeBalance);
    movementScore               = 0;
    movementDisplayBalance.textContent = '0';
    lastShakeTime               = 0;

    // listen for motion
    window.addEventListener('devicemotion', onDeviceMotion);

    let remaining = roundTimeBalance;
    clearInterval(countdownIdBalance);
    countdownIdBalance = setInterval(() => {
      remaining--;
      timerDOMBalance.textContent        = formatTime(remaining);
      movementDisplayBalance.textContent = movementScore;
      if (remaining <= 0) {
        clearInterval(countdownIdBalance);
        endRound();
      }
    }, 1000);
  }

  function onDeviceMotion(e) {
    const acc = e.accelerationIncludingGravity || { x:0,y:0,z:0 };
    const mag = Math.hypot(acc.x, acc.y, acc.z);
    const now = Date.now();
    if (mag > ACCEL_THRESHOLD && now - lastShakeTime > SHAKE_DEBOUNCE) {
      movementScore++;
      lastShakeTime = now;
    }
  }

  function endRound() {
    clearInterval(countdownIdBalance);
    window.removeEventListener('devicemotion', onDeviceMotion);
    results[currentIdxBalance].movement = movementScore;
    currentIdxBalance++;
    nextPass();
  }

  function showFinalResults() {
    const sorted = [...results].sort((a,b) => a.movement - b.movement);
    if (sorted[0]) sorted[0].roundPoints = 20;
    if (sorted[1]) sorted[1].roundPoints = 10;
    if (sorted[2]) sorted[2].roundPoints = 5;
    sorted.forEach(r => {
      r.totalPoints += r.roundPoints;
      localStorage.setItem(r.name, r.totalPoints);
    });
    resultsBodyBalance.innerHTML = sorted.map((r,i) => `
      <tr>
        <td>${i+1}</td>
        <td>${r.name}</td>
        <td>${r.movement}</td>
        <td>${r.roundPoints}</td>
        <td>${r.totalPoints}</td>
      </tr>
    `).join('');
    showScreen('balanceResultsScreen');
  }

  function formatTime(sec) {
    const m = Math.floor(sec/60), s = sec % 60;
    return `${m}:${s.toString().padStart(2,'0')}`;
  }

  replayBtnBalance.onclick    = () => showScreen('balanceRulesScreen');
  backGamesBtnBalance.onclick = () => showScreen('gamesScreen');
});
