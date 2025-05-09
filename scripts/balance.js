// scripts/balance.js
// Dependencies: loadPlayers(), showScreen(id)

document.addEventListener('DOMContentLoaded', () => {
  const players = loadPlayers();
  let roundTime = 10;     // default seconds
  let currentIdx = 0;
  let countdownId = null;

  // count of shakes
  let movementScore = 0;
  const ACCEL_THRESHOLD = 1.2; // tune as needed
  let lastShakeTime = 0;
  const SHAKE_DEBOUNCE = 300; // ms

  // per-player records
  const results = players.map(name => ({
    name,
    movement: 0,
    roundPoints: 0,
    totalPoints: parseInt(localStorage.getItem(name)) || 0
  }));

  // DOM refs
  const slider          = document.getElementById('balanceTimeSlider');
  const timeValue       = document.getElementById('balanceTimeValue');
  const backRulesBtn    = document.getElementById('backToRulesBtnBalance');
  const startBtn        = document.getElementById('startBalanceBtn');
  const launchBtn       = document.getElementById('startBalanceSettingsBtn');
  const passText        = document.getElementById('balancePassText');
  const passNextBtn     = document.getElementById('balancePassNextBtn');
  const timerDOM        = document.getElementById('balanceTimer');
  const playerDOM       = document.getElementById('balanceCurrentPlayer');
  const movementDisplay = document.getElementById('balanceMovementDisplay');
  const resultsBody     = document.getElementById('balanceResultsBody');
  const replayBtn       = document.getElementById('balanceReplayBtn');
  const backGamesBtn    = document.getElementById('balanceBackBtn');

  // navigation
  document.getElementById('backToGamesBtnBalance')
          .onclick = () => showScreen('gamesScreen');
  backRulesBtn.onclick  = () => showScreen('balanceRulesScreen');
  startBtn.onclick      = () => showScreen('balanceSettingsScreen');

  // slider controlling roundTime
  slider.addEventListener('input', e => {
    roundTime = +e.target.value;
    const min = Math.floor(roundTime/60);
    timeValue.textContent = `${min} دقيقة${min>1?'ن':''}`;
  });

  // after settings → first pass
  launchBtn.onclick = () => {
    currentIdx = 0;
    results.forEach(r => { r.movement = 0; r.roundPoints = 0; });
    nextPass();
  };

  function nextPass() {
    if (currentIdx >= players.length) {
      return showFinalResults();
    }
    const name = players[currentIdx];
    passText.textContent  = `📱 الدور على: ${name}`;
    playerDOM.textContent = name;
    showScreen('balancePassScreen');
  }

  passNextBtn.onclick = () => startRound();

  function startRound() {
    showScreen('balanceGameScreen');
    timerDOM.textContent        = formatTime(roundTime);
    movementScore               = 0;
    movementDisplay.textContent = '0';
    lastShakeTime               = 0;

    // watch device motion
    window.addEventListener('devicemotion', onDeviceMotion);

    let remaining = roundTime;
    clearInterval(countdownId);
    countdownId = setInterval(() => {
      remaining--;
      timerDOM.textContent        = formatTime(remaining);
      movementDisplay.textContent = movementScore;
      if (remaining <= 0) {
        clearInterval(countdownId);
        endRound();
      }
    }, 1000);
  }

  function onDeviceMotion(e) {
    const acc = e.accelerationIncludingGravity || { x:0,y:0,z:0 };
    const mag = Math.hypot(acc.x, acc.y, acc.z);
    const now = Date.now();
    // if above threshold and debounce time passed → count one shake
    if (mag > ACCEL_THRESHOLD && now - lastShakeTime > SHAKE_DEBOUNCE) {
      movementScore++;
      lastShakeTime = now;
    }
  }

  function endRound() {
    clearInterval(countdownId);
    window.removeEventListener('devicemotion', onDeviceMotion);
    results[currentIdx].movement = movementScore;
    currentIdx++;
    nextPass();
  }

  function showFinalResults() {
    // sort by fewest shakes
    const sorted = [...results].sort((a,b) => a.movement - b.movement);

    // award points
    if (sorted[0]) sorted[0].roundPoints = 20;
    if (sorted[1]) sorted[1].roundPoints = 10;
    if (sorted[2]) sorted[2].roundPoints = 5;

    // update totals & storage
    sorted.forEach(r => {
      r.totalPoints += r.roundPoints;
      localStorage.setItem(r.name, r.totalPoints);
    });

    // render table
    resultsBody.innerHTML = sorted.map((r,i) => `
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
    const m = Math.floor(sec/60),
          s = sec % 60;
    return `${m}:${s.toString().padStart(2,'0')}`;
  }

  replayBtn.onclick    = () => showScreen('balanceRulesScreen');
  backGamesBtn.onclick = () => showScreen('gamesScreen');
});
