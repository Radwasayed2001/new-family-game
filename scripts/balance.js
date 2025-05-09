// scripts/balance.js
// Dependencies: loadPlayers(), showScreen(id)

document.addEventListener('DOMContentLoaded', () => {
  const playersBalance    = loadPlayers();
  let roundTimeBalance    = 120; // seconds
  let currentIndexBalance = 0;
  let timerIdBalance      = null;
  let secondsLeftBalance  = 0;
  let movementSum         = 0;   // accumulate movement magnitude

  // Will hold per-player results:
  // { name, movementScore, roundPoints, totalPoints }
  const resultsBalance = playersBalance.map(name => ({
    name,
    movementScore: 0,
    roundPoints: 0,
    totalPoints: parseInt(localStorage.getItem(name)) || 0
  }));

  // DOM refs
  const timeSlider     = document.getElementById('balanceTimeSlider');
  const timeValue      = document.getElementById('balanceTimeValue');
  const backRulesBtn   = document.getElementById('backToRulesBtnBalance');
  const startBtn       = document.getElementById('startBalanceBtn');
  const startSetBtn    = document.getElementById('startBalanceSettingsBtn');
  const passText       = document.getElementById('balancePassText');
  const passNextBtn    = document.getElementById('balancePassNextBtn');
  const currPlayerSpan = document.getElementById('balanceCurrentPlayer');
  const timerDisplay   = document.getElementById('balanceTimer');
  const resultsBody    = document.getElementById('balanceResultsBody');
  const replayBtn      = document.getElementById('balanceReplayBtn');
  const backGamesBtn   = document.getElementById('balanceBackBtn');

  // Navigation
  document.getElementById('backToGamesBtnBalance')
    .onclick = () => showScreen('gamesScreen');
  backRulesBtn.onclick   = () => showScreen('balanceRulesScreen');
  startBtn.onclick       = () => showScreen('balanceSettingsScreen');

  // Slider
  timeSlider.addEventListener('input', e => {
    roundTimeBalance = +e.target.value;
    const minutes = Math.floor(roundTimeBalance/60);
    timeValue.textContent = `${minutes} دقيقة${minutes > 1 ? 'ات' : ''}`;
  });

  // After settings → first turn
  startSetBtn.onclick = () => {
    secondsLeftBalance = roundTimeBalance;
    currentIndexBalance = 0;
    nextPass();
  };

  function nextPass() {
    if (currentIndexBalance >= playersBalance.length) {
      return showFinalResults();
    }
    const player = playersBalance[currentIndexBalance];
    passText.textContent = `📱 الدور على: ${player}`;
    currPlayerSpan.textContent = player;
    showScreen('balancePassScreen');
  }

  passNextBtn.onclick = () => {
    showGameScreen();
    startMeasurement();
  };

  function showGameScreen() {
    timerDisplay.textContent = formatTime(roundTimeBalance);
    showScreen('balanceGameScreen');
  }

  function startMeasurement() {
    clearInterval(timerIdBalance);
    secondsLeftBalance = roundTimeBalance;
    movementSum = 0;
    // Listen to device motion
    window.addEventListener('devicemotion', onMotion);
    timerDisplay.textContent = formatTime(secondsLeftBalance);

    timerIdBalance = setInterval(() => {
      secondsLeftBalance--;
      timerDisplay.textContent = formatTime(secondsLeftBalance);
      if (secondsLeftBalance <= 0) {
        clearInterval(timerIdBalance);
        window.removeEventListener('devicemotion', onMotion);
        recordMovement();
      }
    }, 1000);
  }

  function onMotion(e) {
    const a = e.accelerationIncludingGravity;
    // magnitude of acceleration vector
    const mag = Math.sqrt((a.x||0)**2 + (a.y||0)**2 + (a.z||0)**2);
    movementSum += mag;
  }

  function recordMovement() {
    // store this player’s movementScore
    resultsBalance[currentIndexBalance].movementScore = movementSum;
    currentIndexBalance++;
    nextPass();
  }

  function formatTime(sec) {
    const m = Math.floor(sec/60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2,'0')}`;
  }

  function showFinalResults() {
    // rank by movementScore ascending (least moved first)
    const sorted = [...resultsBalance].sort((a,b) =>
      a.movementScore - b.movementScore
    );

    // assign roundPoints: 1st→20, 2nd→10, 3rd→5
    sorted.forEach((r,i) => {
      if (i === 0) r.roundPoints = 20;
      else if (i === 1) r.roundPoints = 10;
      else if (i === 2) r.roundPoints = 5;
      else r.roundPoints = 0;
      // update total
      r.totalPoints += r.roundPoints;
      localStorage.setItem(r.name, r.totalPoints);
    });

    // build table
    resultsBody.innerHTML = sorted.map((r,i) => `
      <tr>
        <td>${i+1}</td>
        <td>${r.name}</td>
        <td>${r.roundPoints}</td>
        <td>${r.totalPoints}</td>
      </tr>
    `).join('');

    showScreen('balanceResultsScreen');
  }

  replayBtn.onclick    = () => showScreen('balanceRulesScreen');
  backGamesBtn.onclick = () => showScreen('gamesScreen');
});
