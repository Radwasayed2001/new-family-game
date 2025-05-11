// scripts/wink.js
// Dependencies: loadPlayers(), showScreen(id)
document.addEventListener('DOMContentLoaded', () => {
  const players       = loadPlayers();
  

  // --- State ---
  let killerIndex     = null;
  let eliminated      = new Set();
  let scores          = {};
  const PRE_VOTE_TIME = 15;    // seconds

  // load historic scores
  players.forEach(p => scores[p] = parseInt(localStorage.getItem(p))||0);

  let preTimerId, preRemaining;
  let voteTally       = {};
  let voteTurn        = 0;     // index of whose turn to vote
  let remaining;               // array of alive players

  // --- DOM refs ---
  const showScreenById    = id => showScreen(id);

  // Settings / Roles
  const backToGames       = document.getElementById('backToGamesBtnWink');
  const startWink         = document.getElementById('startWinkBtn');
  const confirmSet        = document.getElementById('confirmWinkSettingsBtn');
  const backRulesBtn      = document.getElementById('backToRulesBtnWink');

  // Role reveal
  const passText          = document.getElementById('winkPassText');
  const passNextBtn       = document.getElementById('winkPassNextBtn');
  const roleTitle         = document.getElementById('winkRoleTitle');
  const roleExplain       = document.getElementById('winkRoleExplain');
  const roleDoneBtn       = document.getElementById('winkRoleDoneBtn');

  // Pre-vote
  const preTimerEl        = document.getElementById('winkPreTimer');
  const markVictimBtn     = document.getElementById('winkMarkVictimBtn');
  const callVoteBtn       = document.getElementById('winkCallVoteBtn');

  // Victim selection
  const victimList        = document.getElementById('winkVictimList');

  // Per-player vote
  const votePrompt        = document.getElementById('winkVotePrompt');
  const voteOptions       = document.getElementById('winkVoteOptions');
  const voteSubmitBtn     = document.getElementById('winkSubmitVoteBtn');

  // Innocent screen
  const innocentText           = document.getElementById('winkInnocentText');
  const innocentContinueBtn    = document.getElementById('winkInnocentContinueBtn');
  const innocentScreenId       = 'winkInnocentScreen';

  // Results
  const resultsText       = document.getElementById('winkResultsText');
  const resultsBody       = document.getElementById('winkResultsBody');
  const replayBtn         = document.getElementById('winkReplayBtn');
  const endBtn            = document.getElementById('winkEndBtn');

  // Screen identifiers
  const settingsScreen    = 'winkSettingsScreen';
  const passScreen        = 'winkPassScreen';
  const roleScreen        = 'winkRoleScreen';
  const preVoteScreen     = 'winkPreVoteScreen';
  const victimScreen      = 'winkVictimScreen';
  const voteScreen        = 'winkVoteScreen';
  const resultScreen      = 'winkResultsScreen';

  // --- Flow ---
  backToGames.onclick    = () => showScreenById('gamesScreen');
  startWink.onclick      = () => {
    if (players.length < 5) {
       return showAlert('error','لا يمكن اللعب بأقل من 5 لاعبين!');
    }
    showScreenById(settingsScreen)

  };
  backRulesBtn.onclick   = () => showScreenById('winkRulesScreen');

  confirmSet.onclick     = () => {
    killerIndex = Math.floor(Math.random() * players.length);
    eliminated.clear();
    showNextRole(0);
  };

  function showNextRole(i) {
    if (i >= players.length) {
      return beginPreVote();
    }
    const p = players[i];
    passText.textContent = `📱 ${p} يكشف دوره ▶️`;
    passNextBtn.onclick = () => {
      const isKiller = (i === killerIndex);
      roleTitle.textContent   = isKiller ? 'أنت القاتل' : 'أنت بريء';
      roleExplain.textContent = isKiller
        ? 'غمز للاعب سرّاً لإقصائه'
        : 'ابقَ هادئاً ولا تكشف شيئاً';
      showScreenById(roleScreen);
      roleDoneBtn.onclick = () => showNextRole(i+1);
    };
    showScreenById(passScreen);
  }

  // --- Pre-vote phase ---
  function beginPreVote() {
    remaining = players.filter(p => !eliminated.has(p));
    preRemaining = PRE_VOTE_TIME;
    preTimerEl.textContent = preRemaining;
    showScreenById(preVoteScreen);

    clearInterval(preTimerId);
    preTimerId = setInterval(() => {
      preRemaining--;
      preTimerEl.textContent = preRemaining;
      if (preRemaining <= 0) {
        clearInterval(preTimerId);
        beginPreVote();
      }
    }, 1000);

    markVictimBtn.onclick = () => {
      clearInterval(preTimerId);
      pickVictim();
    };
    callVoteBtn.onclick   = () => {
      clearInterval(preTimerId);
      startVoting();
    };
  }

  // --- Victim selection ---
  // --- Victim selection ---
function pickVictim() {
  victimList.innerHTML = '';
  remaining.forEach(p => {
    const li = document.createElement('li');
    const btn= document.createElement('button');
    btn.textContent = p;
    btn.className   = 'btn btn-warning player-btn';
    btn.onclick     = () => {
      // إذا كان الضحية المُختار هو القاتل نفسه
      if (players[killerIndex] === p) {
        // اعرض شاشة خطأ أو رسالة
        alert('❌ قمتم باستبعاد القاتل. القاتل هو الوحيد من يستطيع الغمز واستبعاد أحد اللاعبين. انتهت الجولة ولا يمكن الإستمرار بدون القاتل');
        // مباشرةً نعيد تخصيص قاتل جديد ونرجع للقوانين
        startNewRound();
      } else {
        // عملية الاستبعاد العادية
        eliminated.add(p);
        startVoting();
      }
    };
    li.appendChild(btn);
    victimList.appendChild(li);
  });
  showScreenById(victimScreen);
}

// دالة لإعادة ضبط الجولة بالكامل مع قاتل جديد
function startNewRound() {
  // اختر قاتل جديد عشوائي
  killerIndex = Math.floor(Math.random() * players.length);
  // أفرغ مجموعة المستبعدين
  eliminated.clear();
  // عدّل الدفق ليبدأ من كشف الأدوار من جديد
  showNextRole(0);
}


  // --- Per-player voting ---
  function startVoting() {
    remaining = players.filter(p => !eliminated.has(p));
    voteTally = {};
    voteTurn  = 0;
    askNextVote();
  }

  function askNextVote() {
    if (voteTurn >= remaining.length) {
      tallyVotes();
      return;
    }
    const voter = remaining[voteTurn];
    votePrompt.textContent = `🕵️ ${voter} يصوّت`;
    voteOptions.innerHTML = remaining
      .map(cand => `
        <label>
          <input type="radio" name="suspect" value="${cand}">
          ${cand}
        </label>
      `).join('<br>');
    voteOptions.querySelector('input').checked = true;
    voteSubmitBtn.onclick = recordVote;
    showScreenById(voteScreen);
  }

  function recordVote() {
    const choice = voteOptions.querySelector('input[name="suspect"]:checked').value;
    voteTally[choice] = (voteTally[choice] || 0) + 1;
    voteTurn++;
    askNextVote();
  }

  // --- Tally and result ---
  function tallyVotes() {
    let top = null, max = 0;
    Object.entries(voteTally).forEach(([name,cnt]) => {
      if (cnt > max) { max = cnt; top = name; }
    });

    if (top === players[killerIndex]) {
      // innocents win
      remaining.filter(p => p !== top).forEach(p => {
        scores[p] += 25;
        localStorage.setItem(p, scores[p]);
      });
      showRoundResult(`✅ اكتشفتم القاتل (${top})! كل بريء يحصل على 25 نقطة`);
    } else {
      // wrong guess → eliminate then either innocent screen or killer wins
      eliminated.add(top);
      const innocentsLeft = players.length - eliminated.size - 1;
      if (innocentsLeft < 2) {
        const k = players[killerIndex];
        scores[k] += 100;
        localStorage.setItem(k, scores[k]);
        showRoundResult(`😎 القاتل (${k}) انتصر! يحصل على 100 نقطة`);
      } else {
        // show innocent screen
        innocentText.textContent = `اللاعب ${top} بريء وليس هو القاتل.`;
        innocentContinueBtn.onclick = () => beginPreVote();
        showScreenById(innocentScreenId);
      }
    }
  }

  // Show round result + score table
  function showRoundResult(txt) {
    resultsText.textContent = txt;
    resultsBody.innerHTML = players.map((p,i) => `
      <tr>
        <td>${i+1}</td>
        <td>${p}</td>
        <td>${scores[p]}</td>
        <td>${localStorage.getItem(p) || 0}</td>
      </tr>
    `).join('');
    showScreenById(resultScreen);
  }

  replayBtn.onclick      = () => {
    if (players.length < 5) {
       return showAlert('error','لا يمكن اللعب بأقل من 5 لاعبين!');
    }
    showScreenById(settingsScreen)

  };
  endBtn.onclick    = () => showScreenById('gamesScreen');
});