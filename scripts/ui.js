
const playerScreen = document.getElementById('playerScreen');
const gamesScreen = document.getElementById('gamesScreen');
const playerNameInput = document.getElementById('playerName');
const addPlayerButton = document.getElementById('addPlayer');
const playerCountElement = document.getElementById('playerCount');
const playerListElement = document.getElementById('playerList');
const startButton = document.getElementById('startButton');
const backButton = document.getElementById('backButton');
const gamesGrid = document.querySelector('.games-grid');
// const guessInput = document.getElementById("guessInput");
const submitGuessButton = document.getElementById("submitGuessButton");
/**
 * Switch between screens
 * @param {string} screenId - The ID of the screen to show
 */
function showScreen(screenId) {
  console.log("uiuiuiuiuiuiuiuiuiuiu")
  // Hide all screens
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  
  // Show the target screen
  document.getElementById(screenId).classList.add('active');
}

/**
 * Update the player count display
 * @param {number} count - The current player count
 */
function updatePlayerCount(count) {
  playerCountElement.textContent = count;
  
  // Enable or disable start button based on player count
  startButton.disabled = count < MIN_PLAYERS_TO_START;
  
  // Enable or disable add button based on max players
  addPlayerButton.disabled = count >= MAX_PLAYERS || playerNameInput.value.trim() === '';
}

/**
 * Render the player list in the UI
 * @param {Array} players - Array of player names
 */
function renderPlayerList(players) {
  // Clear the current list
  playerListElement.innerHTML = '';
  
  // Add each player to the list
  players.forEach((player, index) => {
    const li = document.createElement('li');
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = player;
    
    const removeButton = document.createElement('button');
    removeButton.classList.add('remove-player');
    removeButton.textContent = '×';
    removeButton.setAttribute('data-index', index);
    
    li.appendChild(nameSpan);
    li.appendChild(removeButton);
    
    playerListElement.appendChild(li);
  });
  
  // Update the player count
  updatePlayerCount(players.length);
}

/**
 * Render the games list in the UI
 */
function renderGamesList() {
  // Clear the current grid
  gamesGrid.innerHTML = '';

  // Get the current number of players
  const playerCount = loadPlayers().length;

  // Add each game to the grid
  GAMES.forEach(game => {
    const gameCard = document.createElement('div');
    gameCard.classList.add('game-card');
    gameCard.dataset.gameId = game.id;

    const isTooFew    = playerCount < game.minPlayers;
    const isTooMany   = playerCount > game.maxPlayers;
    const isPlayable  = !isTooFew && !isTooMany;

    // Shade background if too few players
    if (isTooFew) {
      gameCard.style.backgroundColor = '#dedede';
    // If too many, you can also dim or disallow if you like:
    } else if (isTooMany) {
      gameCard.style.opacity = '0.6';
    }

    gameCard.innerHTML = `
      <h3>${game.name}</h3>
      <div class="players-required">
        <span>عدد اللاعبين:</span>
        <span class="badge">${game.minPlayers}–${game.maxPlayers}</span>
      </div>
      <p>${game.description}</p>
    `;

    if (isPlayable) {
      gameCard.addEventListener('click', () => {
        console.log('Selected game:', game.name);
        console.log('Players:', loadPlayers());
        // ... launch game ...
      });
    }

    gamesGrid.appendChild(gameCard);
  });
}


/**
 * Clear the player name input field
 */
function clearPlayerInput() {
  playerNameInput.value = '';
  addPlayerButton.disabled = true;
}

