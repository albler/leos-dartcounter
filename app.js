// Backend configuration
const API_BASE_URL = 'http://localhost:8080/api';
const WS_URL = 'http://localhost:8080/ws';

// Available player names
const availableNames = ['Leo', 'Alex', 'Jakob', 'Philip', 'Patrick', 'Elisabeth', 'Bernhard', 'Thomas'];

// Game state (will be synchronized with backend)
const state = {
    players: [],
    currentPlayer: 0,
    dartsThrown: 0,
    modifier: 1,
    history: [],
    startingScore: 301,
    selectedNames: [],
    sessionCode: null,
    version: 0,
    isHost: false,
    status: 'WAITING'
};

// WebSocket connection
let stompClient = null;
let isConnected = false;

// DOM elements - Session screen
const sessionScreen = document.getElementById('sessionScreen');
const createSessionBtn = document.getElementById('createSessionBtn');
const joinSessionBtn = document.getElementById('joinSessionBtn');
const joinSection = document.getElementById('joinSection');
const sessionCodeInput = document.getElementById('sessionCodeInput');
const confirmJoinBtn = document.getElementById('confirmJoinBtn');
const connectionStatus = document.getElementById('connectionStatus');
const statusText = document.getElementById('statusText');

// DOM elements - Setup screen
const setupScreen = document.getElementById('setupScreen');
const gameScreen = document.getElementById('gameScreen');
const nameBtns = document.querySelectorAll('.name-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const playerListEl = document.getElementById('playerList');
const startGameBtn = document.getElementById('startGameBtn');
const setupCurrentCode = document.getElementById('setupCurrentCode');

// DOM elements - Game screen
const scoreDisplayEl = document.getElementById('scoreDisplay');
const modifierBtns = document.querySelectorAll('.modifier-btn');
const scoreBtns = document.querySelectorAll('.score-btn');
const undoBtn = document.getElementById('undoBtn');
const missBtn = document.getElementById('missBtn');
const resetBtn = document.getElementById('resetBtn');
const currentSessionCode = document.getElementById('currentSessionCode');
const dartSlots = [
    document.getElementById('dart1'),
    document.getElementById('dart2'),
    document.getElementById('dart3')
];

// Track current turn throws for dart tracker display
let currentTurnThrows = [];

// Format dart notation like "d4 (8)" for doubles, "t20 (60)" for triples
function formatDartNotation(baseValue, modifier, points) {
    if (baseValue === 0) {
        return 'Miss';
    }
    if (baseValue === 25) {
        if (modifier === 2 || points === 50) {
            return 'D-Bull (50)';
        }
        return 'Bull (25)';
    }

    let prefix = '';
    if (modifier === 1) {
        prefix = 's';
    } else if (modifier === 2) {
        prefix = 'd';
    } else if (modifier === 3) {
        prefix = 't';
    }

    if (modifier === 1) {
        return `${baseValue}`;
    }
    return `${prefix}${baseValue} (${points})`;
}

// Update dart tracker display
function updateDartTracker() {
    dartSlots.forEach((slot, index) => {
        const valueEl = slot.querySelector('.dart-value');
        if (index < currentTurnThrows.length) {
            const throwData = currentTurnThrows[index];
            valueEl.textContent = throwData.notation;
            slot.classList.add('filled');
        } else {
            valueEl.textContent = '-';
            slot.classList.remove('filled');
        }
    });
}

// API Service
const api = {
    async createSession(playerNames, startingScore) {
        const response = await fetch(`${API_BASE_URL}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerNames, startingScore })
        });
        if (!response.ok) throw new Error('Failed to create session');
        return response.json();
    },

    async getSession(code) {
        const response = await fetch(`${API_BASE_URL}/sessions/${code}`);
        if (!response.ok) throw new Error('Session not found');
        return response.json();
    },

    async joinSession(code) {
        const response = await fetch(`${API_BASE_URL}/sessions/${code}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to join session');
        return response.json();
    },

    async startGame(code) {
        const response = await fetch(`${API_BASE_URL}/sessions/${code}/start`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to start game');
        return response.json();
    }
};

// WebSocket Service
const ws = {
    connect(sessionCode) {
        return new Promise((resolve, reject) => {
            const socket = new SockJS(WS_URL);
            stompClient = Stomp.over(socket);
            stompClient.debug = null; // Disable debug logging

            stompClient.connect({}, () => {
                isConnected = true;
                // Subscribe to session updates
                stompClient.subscribe(`/topic/session/${sessionCode}`, (message) => {
                    const gameState = JSON.parse(message.body);
                    handleStateUpdate(gameState);
                });
                resolve();
            }, (error) => {
                isConnected = false;
                reject(error);
            });
        });
    },

    disconnect() {
        if (stompClient) {
            stompClient.disconnect();
            isConnected = false;
        }
    },

    sendThrow(points) {
        if (!isConnected || !state.sessionCode) return;
        stompClient.send(`/app/session/${state.sessionCode}/throw`, {}, JSON.stringify({
            points: points,
            expectedVersion: state.version
        }));
    },

    sendUndo() {
        if (!isConnected || !state.sessionCode) return;
        stompClient.send(`/app/session/${state.sessionCode}/undo`, {}, '{}');
    },

    sendNextPlayer() {
        if (!isConnected || !state.sessionCode) return;
        stompClient.send(`/app/session/${state.sessionCode}/next`, {}, '{}');
    },

    sendReset() {
        if (!isConnected || !state.sessionCode) return;
        stompClient.send(`/app/session/${state.sessionCode}/reset`, {}, '{}');
    },

    sendStart() {
        if (!isConnected || !state.sessionCode) return;
        stompClient.send(`/app/session/${state.sessionCode}/start`, {}, '{}');
    },

    sendSync() {
        if (!isConnected || !state.sessionCode) return;
        stompClient.send(`/app/session/${state.sessionCode}/sync`, {}, '{}');
    }
};

// Handle state updates from server
function handleStateUpdate(gameState) {
    if (gameState.message && gameState.message.startsWith('Error:')) {
        alert(gameState.message);
        return;
    }

    // Check if player changed or darts reset to clear tracker
    const playerChanged = state.currentPlayer !== gameState.currentPlayerIndex;
    const dartsReset = gameState.dartsThrown < state.dartsThrown;

    // Update local state from server
    state.sessionCode = gameState.sessionCode;
    state.currentPlayer = gameState.currentPlayerIndex;
    state.dartsThrown = gameState.dartsThrown;
    state.startingScore = gameState.startingScore;
    state.status = gameState.status;
    state.version = gameState.version;

    // Reset dart tracker if turn changed
    if (playerChanged || dartsReset) {
        currentTurnThrows = [];
        updateDartTracker();
    }

    // Update players
    if (gameState.players) {
        state.players = gameState.players.map(p => ({
            name: p.name,
            score: p.score,
            currentThrow: p.currentThrow,
            playerOrder: p.playerOrder
        }));
    }

    // Handle different game statuses
    if (gameState.status === 'FINISHED' && gameState.winnerName) {
        showWinner(gameState.winnerName);
    } else if (gameState.status === 'ACTIVE' && gameScreen.classList.contains('hidden')) {
        // Game started - switch to game screen
        buildScoreDisplay();
        setupScreen.classList.add('hidden');
        sessionScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        updateSessionCodeDisplays();
    }

    // Update display
    if (!gameScreen.classList.contains('hidden')) {
        updateDisplay();
    }

    // Show message if present
    if (gameState.message && !gameState.message.startsWith('Error:')) {
        showStatus(gameState.message, 'connected');
    }
}

// Initialize
function init() {
    setupSessionScreen();
    setupSetupScreen();
    setupGameEventListeners();
}

function setupSessionScreen() {
    createSessionBtn.addEventListener('click', handleCreateSession);
    joinSessionBtn.addEventListener('click', () => {
        joinSection.classList.toggle('hidden');
    });
    confirmJoinBtn.addEventListener('click', handleJoinSession);
    sessionCodeInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
    sessionCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleJoinSession();
    });
}

async function handleCreateSession() {
    showStatus('Creating session...', '');
    connectionStatus.classList.remove('hidden');
    state.isHost = true;

    // Move to setup screen to select players
    sessionScreen.classList.add('hidden');
    setupScreen.classList.remove('hidden');
    connectionStatus.classList.add('hidden');
}

async function handleJoinSession() {
    const code = sessionCodeInput.value.trim().toUpperCase();
    if (code.length !== 6) {
        alert('Please enter a 6-character session code');
        return;
    }

    showStatus('Joining session...', '');
    connectionStatus.classList.remove('hidden');

    try {
        const gameState = await api.joinSession(code);
        state.sessionCode = code;
        state.isHost = false;

        await ws.connect(code);
        showStatus('Connected!', 'connected');

        // Apply the received state
        handleStateUpdate(gameState);

        // Move to appropriate screen based on game status
        if (gameState.status === 'WAITING') {
            // Show setup screen for waiting games
            state.selectedNames = gameState.players.map(p => p.name);
            state.startingScore = gameState.startingScore;
            updatePlayerListFromServer();
            sessionScreen.classList.add('hidden');
            setupScreen.classList.remove('hidden');
            updateSessionCodeDisplays();
        } else if (gameState.status === 'ACTIVE') {
            // Go directly to game screen
            buildScoreDisplay();
            sessionScreen.classList.add('hidden');
            gameScreen.classList.remove('hidden');
            updateSessionCodeDisplays();
            updateDisplay();
        }
    } catch (error) {
        showStatus('Failed to join: ' + error.message, 'error');
    }
}

function showStatus(message, className) {
    statusText.textContent = message;
    connectionStatus.className = 'connection-status';
    if (className) {
        connectionStatus.classList.add(className);
    }
    connectionStatus.classList.remove('hidden');
}

function updateSessionCodeDisplays() {
    if (state.sessionCode) {
        setupCurrentCode.textContent = state.sessionCode;
        currentSessionCode.textContent = state.sessionCode;
    }
}

function updatePlayerListFromServer() {
    // Update UI to reflect server state
    nameBtns.forEach(btn => {
        const name = btn.dataset.name;
        btn.classList.toggle('selected', state.selectedNames.includes(name));
    });
    modeBtns.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.score) === state.startingScore);
    });
    updatePlayerList();
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

async function startGame() {
    if (state.selectedNames.length < 2) return;

    try {
        showStatus('Starting game...', '');
        connectionStatus.classList.remove('hidden');

        if (state.isHost && !state.sessionCode) {
            // Create session on backend
            const gameState = await api.createSession(state.selectedNames, state.startingScore);
            state.sessionCode = gameState.sessionCode;
            updateSessionCodeDisplays();

            // Connect to WebSocket
            await ws.connect(state.sessionCode);

            // Start the game
            await api.startGame(state.sessionCode);
        } else if (state.sessionCode) {
            // Already in a session, just start via WebSocket
            ws.sendStart();
        }

        connectionStatus.classList.add('hidden');
    } catch (error) {
        showStatus('Failed to start game: ' + error.message, 'error');
    }
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

    // Score buttons (number grid + bull buttons)
    scoreBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const value = parseInt(btn.dataset.value);
            // Handle 50 button as double bull
            if (value === 50) {
                handleScoreWithModifier(25, 2);
            } else {
                handleScore(value);
            }
        });
    });

    // Control buttons
    missBtn.addEventListener('click', () => handleScoreWithModifier(0, 1));
    undoBtn.addEventListener('click', handleUndo);
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
    let actualModifier = state.modifier;

    // Bull (25) can only be single or double (no triple)
    if (baseValue === 25 && actualModifier === 3) {
        actualModifier = 2;
    }

    // Miss is always 0
    if (baseValue === 0) {
        actualModifier = 1;
    }

    handleScoreWithModifier(baseValue, actualModifier);
}

function handleScoreWithModifier(baseValue, modifier) {
    if (state.dartsThrown >= 3) return;

    const points = baseValue * modifier;
    const notation = formatDartNotation(baseValue, modifier, points);

    // Track throw locally for dart display
    currentTurnThrows.push({ baseValue, modifier, points, notation });
    updateDartTracker();

    // Send throw to backend
    ws.sendThrow(points);

    // Reset modifier to single after throw
    setActiveModifier(1);
}

function showWinner(winnerName) {
    // Remove existing overlay if any
    const existingOverlay = document.querySelector('.winner-overlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.className = 'winner-overlay';
    overlay.innerHTML = `
        <h2>${winnerName} Wins!</h2>
        <button onclick="this.parentElement.remove(); handleReset();">New Game</button>
    `;
    document.body.appendChild(overlay);
}

function handleUndo() {
    // Remove last throw from tracker
    if (currentTurnThrows.length > 0) {
        currentTurnThrows.pop();
        updateDartTracker();
    }
    ws.sendUndo();
}

function handleNextPlayer() {
    ws.sendNextPlayer();
}

function handleReset() {
    // Remove winner overlay if present
    const overlay = document.querySelector('.winner-overlay');
    if (overlay) overlay.remove();

    // Disconnect WebSocket
    ws.disconnect();

    // Reset local state
    state.selectedNames = [];
    state.startingScore = 301;
    state.sessionCode = null;
    state.isHost = false;
    state.players = [];
    state.version = 0;

    // Reset dart tracker
    currentTurnThrows = [];
    updateDartTracker();

    // Reset UI
    nameBtns.forEach(btn => btn.classList.remove('selected'));
    modeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.score === '301');
    });
    updatePlayerList();
    setupCurrentCode.textContent = '------';
    currentSessionCode.textContent = '------';

    // Switch back to session screen
    gameScreen.classList.add('hidden');
    setupScreen.classList.add('hidden');
    sessionScreen.classList.remove('hidden');
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
}

// Start the app
init();
