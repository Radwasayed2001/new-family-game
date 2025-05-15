// scripts/balance.js
// Dependencies: loadPlayers(), showScreen(id)
let countdownId = null;

document.addEventListener('DOMContentLoaded', () => {
  const players = loadPlayers();
  let roundTime = 10;       // default seconds
  let currentIdx = 0;

  // count of shakes (debounced)
  let movementScore = 0;
  const ACCEL_THRESHOLD = 2.0;  // ignore small jitters
  let lastShakeTime = 0;
  const SHAKE_DEBOUNCE = 200;    // ms between counts

  // per-player results
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
  startBtn.onclick      = () => {
    if (players.length < 1) {
      return showAlert('error','لعبة التوازن تتطلب لاعب واحد على الأقل للعب!');
    }
    showScreen('balanceSettingsScreen');
  };

  // slider: 10–60 seconds
  slider.min = 10;
  slider.max = 60;
  slider.step = 1;
  slider.value = roundTime;
  timeValue.textContent = `${roundTime} ثانية`;
  slider.addEventListener('input', e => {
    roundTime = +e.target.value;
    timeValue.textContent = `${roundTime} ثانية`;
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

  passNextBtn.onclick = () => requestMotionPermission(startRound);

  function requestMotionPermission(cb) {
    if (typeof DeviceMotionEvent !== 'undefined' &&
        DeviceMotionEvent.requestPermission) {
      DeviceMotionEvent.requestPermission()
        .then(res => {
          if (res === 'granted') cb();
          else alert('يرجى تمكين حسّاس الحركة من الإعدادات');
        })
        .catch(console.error);
    } else {
      cb();
    }
  }

  function startRound() {
    showScreen('balanceGameScreen');
    movementScore = 0;
    movementDisplay.textContent = '0';
    window.addEventListener('devicemotion', onDeviceMotion);

    let remaining = roundTime;
    timerDOM.textContent = formatTime(remaining);

    clearInterval(countdownId);
    countdownId = setInterval(() => {
      remaining--;
      timerDOM.textContent = formatTime(remaining);
      movementDisplay.textContent = movementScore;
      if (remaining <= 0) {
        clearInterval(countdownId);
        endRound();
      }
    }, 1000);
  }

  function onDeviceMotion(e) {
    const acc = e.accelerationIncludingGravity || { x:0, y:0, z:0 };
    const mag = Math.hypot(acc.x, acc.y, acc.z);
    const now = Date.now();
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
    const sorted = [...results].sort((a,b)=> a.movement - b.movement);

    // award points
    if (sorted[0]) sorted[0].roundPoints = 20;
    if (sorted[1]) sorted[1].roundPoints = 10;
    if (sorted[2]) sorted[2].roundPoints = 5;

    // update totals & persist
    sorted.forEach(r => {
      r.totalPoints += r.roundPoints;
      localStorage.setItem(r.name, r.totalPoints);
    });

    // render table
    resultsBody.innerHTML = sorted.map((r,i)=>`
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
    const m = Math.floor(sec/60), s = sec%60;
    return `${m}:${s.toString().padStart(2,'0')}`;
  }

  replayBtn.onclick    = () => showScreen('balanceRulesScreen');
  backGamesBtn.onclick = () => showScreen('gamesScreen');
});
