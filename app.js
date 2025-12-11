// Available player names
const availableNames = ['Leo', 'Alex', 'Jakob', 'Philip', 'Patrick', 'Elisabeth', 'Bernhard', 'Thomas'];

// Game state
const state = {
    players: [],
    currentPlayer: 0,
    dartsThrown: 0,
    modifier: 1,
    history: [],
    startingScore: 301,
    selectedNames: []
};

// DOM elements - Setup screen
const setupScreen = document.getElementById('setupScreen');
const gameScreen = document.getElementById('gameScreen');
const nameBtns = document.querySelectorAll('.name-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const playerListEl = document.getElementById('playerList');
const startGameBtn = document.getElementById('startGameBtn');

// DOM elements - Game screen
const scoreDisplayEl = document.getElementById('scoreDisplay');
const activePlayerEl = document.getElementById('activePlayer');
const dartsLeftEl = document.getElementById('dartsLeft');
const modifierBtns = document.querySelectorAll('.modifier-btn');
const scoreBtns = document.querySelectorAll('.score-btn');
const undoBtn = document.getElementById('undoBtn');
const nextPlayerBtn = document.getElementById('nextPlayerBtn');
const resetBtn = document.getElementById('resetBtn');

// Initialize
function init() {
    setupSetupScreen();
    setupGameEventListeners();
}

function setupSetupScreen() {
    // Name button clicks
    nameBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.dataset.name;
            togglePlayerSelection(name, btn);
        });
    });

    // Mode button clicks
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const score = parseInt(btn.dataset.score);
            state.startingScore = score;
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Start game button
    startGameBtn.addEventListener('click', startGame);
}

function togglePlayerSelection(name, btn) {
    const index = state.selectedNames.indexOf(name);

    if (index === -1) {
        // Add player
        state.selectedNames.push(name);
        btn.classList.add('selected');
    } else {
        // Remove player
        state.selectedNames.splice(index, 1);
        btn.classList.remove('selected');
    }

    updatePlayerList();
}

function updatePlayerList() {
    if (state.selectedNames.length === 0) {
        playerListEl.innerHTML = '<span class="no-players">No players selected</span>';
        startGameBtn.disabled = true;
    } else {
        playerListEl.innerHTML = state.selectedNames
            .map((name, i) => `<span class="player-tag">${i + 1}. ${name}<button class="remove-player" data-name="${name}">&times;</button></span>`)
            .join('');
        startGameBtn.disabled = state.selectedNames.length < 2;

        // Add remove button listeners
        document.querySelectorAll('.remove-player').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const name = btn.dataset.name;
                const nameBtn = document.querySelector(`.name-btn[data-name="${name}"]`);
                togglePlayerSelection(name, nameBtn);
            });
        });
    }
}

function startGame() {
    if (state.selectedNames.length < 2) return;

    // Initialize players
    state.players = state.selectedNames.map(name => ({
        name: name,
        score: state.startingScore,
        currentThrow: 0
    }));

    state.currentPlayer = 0;
    state.dartsThrown = 0;
    state.modifier = 1;
    state.history = [];

    // Build player score cards
    buildScoreDisplay();

    // Switch screens
    setupScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    setActiveModifier(1);
    updateDisplay();
}

function buildScoreDisplay() {
    scoreDisplayEl.innerHTML = state.players.map((player, i) => `
        <div class="player" id="player${i}">
            <h2>${player.name}</h2>
            <div class="score" id="score${i}">${player.score}</div>
            <div class="current-throw">Current: <span id="current${i}">0</span></div>
        </div>
    `).join('');
}

function setupGameEventListeners() {
    // Modifier buttons
    modifierBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modifier = parseInt(btn.dataset.modifier);
            setActiveModifier(modifier);
        });
    });

    // Score buttons
    scoreBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const value = parseInt(btn.dataset.value);
            handleScore(value);
        });
    });

    // Control buttons
    undoBtn.addEventListener('click', handleUndo);
    nextPlayerBtn.addEventListener('click', handleNextPlayer);
    resetBtn.addEventListener('click', handleReset);
}

function setActiveModifier(modifier) {
    state.modifier = modifier;

    modifierBtns.forEach(btn => {
        const btnModifier = parseInt(btn.dataset.modifier);
        btn.classList.toggle('active', btnModifier === modifier);
    });

    updateScoreButtonLabels();
}

function updateScoreButtonLabels() {
    scoreBtns.forEach(btn => {
        const baseValue = parseInt(btn.dataset.value);

        if (baseValue === 0) {
            btn.textContent = 'Miss';
        } else if (baseValue === 25) {
            if (state.modifier === 3) {
                btn.textContent = '50';
            } else {
                btn.textContent = baseValue * state.modifier;
            }
        } else {
            btn.textContent = baseValue * state.modifier;
        }
    });
}

function handleScore(baseValue) {
    const player = state.players[state.currentPlayer];

    let actualModifier = state.modifier;

    // Bull (25) can only be single or double (no triple)
    if (baseValue === 25 && actualModifier === 3) {
        actualModifier = 2;
    }

    // Miss is always 0
    if (baseValue === 0) {
        actualModifier = 1;
    }

    const points = baseValue * actualModifier;
    const newScore = player.score - points;

    // Check for bust
    if (newScore < 0 || newScore === 1) {
        handleBust();
        return;
    }

    // Save state for undo
    state.history.push({
        player: state.currentPlayer,
        previousScore: player.score,
        previousCurrentThrow: player.currentThrow,
        previousDartsThrown: state.dartsThrown,
        points: points
    });

    // Update score
    player.score = newScore;
    player.currentThrow += points;
    state.dartsThrown++;

    // Check for win
    if (newScore === 0) {
        handleWin();
        return;
    }

    // Check if turn is over (3 darts thrown)
    if (state.dartsThrown >= 3) {
        setTimeout(() => {
            switchPlayer();
        }, 500);
    }

    setActiveModifier(1);
    updateDisplay();
}

function handleBust() {
    const player = state.players[state.currentPlayer];

    alert(`Bust! ${player.name}'s score reset to ${player.score + player.currentThrow}`);

    player.score += player.currentThrow;
    player.currentThrow = 0;

    switchPlayer();
}

function switchPlayer() {
    const currentPlayer = state.players[state.currentPlayer];
    currentPlayer.currentThrow = 0;

    state.currentPlayer = (state.currentPlayer + 1) % state.players.length;
    state.dartsThrown = 0;

    setActiveModifier(1);
    updateDisplay();
}

function handleWin() {
    const winner = state.players[state.currentPlayer];

    const overlay = document.createElement('div');
    overlay.className = 'winner-overlay';
    overlay.innerHTML = `
        <h2>${winner.name} Wins!</h2>
        <button onclick="this.parentElement.remove(); handleReset();">New Game</button>
    `;
    document.body.appendChild(overlay);
}

function handleUndo() {
    if (state.history.length === 0) return;

    const lastAction = state.history.pop();

    state.currentPlayer = lastAction.player;
    state.players[lastAction.player].score = lastAction.previousScore;
    state.players[lastAction.player].currentThrow = lastAction.previousCurrentThrow;
    state.dartsThrown = lastAction.previousDartsThrown;

    updateDisplay();
}

function handleNextPlayer() {
    switchPlayer();
}

function handleReset() {
    // Reset selections
    state.selectedNames = [];
    state.startingScore = 301;
    nameBtns.forEach(btn => btn.classList.remove('selected'));
    modeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.score === '301');
    });
    updatePlayerList();

    // Switch back to setup screen
    gameScreen.classList.add('hidden');
    setupScreen.classList.remove('hidden');
}

function updateDisplay() {
    // Update all player scores
    state.players.forEach((player, i) => {
        const scoreEl = document.getElementById(`score${i}`);
        const currentEl = document.getElementById(`current${i}`);
        const playerEl = document.getElementById(`player${i}`);

        if (scoreEl) scoreEl.textContent = player.score;
        if (currentEl) currentEl.textContent = player.currentThrow;
        if (playerEl) playerEl.classList.toggle('active', state.currentPlayer === i);
    });

    // Update active player indicator
    const currentPlayerName = state.players[state.currentPlayer]?.name || 'Player';
    activePlayerEl.textContent = `${currentPlayerName}'s Turn`;
    dartsLeftEl.textContent = `Darts: ${3 - state.dartsThrown}`;
}

// Start the app
init();
