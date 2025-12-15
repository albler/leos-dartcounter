const { createApp, ref, reactive, computed, onMounted, onUnmounted, watch } = Vue;
const { createRouter, createWebHistory } = VueRouter;

// API configuration
const API_BASE_URL = '/api';
const WS_URL = '/ws';

// Available player names
const availableNames = ['Leo', 'Alex', 'Jakob', 'Philip', 'Patrick', 'Elisabeth', 'Bernhard', 'Thomas'];

// Checkout suggestions tables
// Format: array of darts needed, e.g., ['T20', 'T20', 'D20'] for 170

// Double Out checkout table (must finish on a double)
const doubleOutTable = {
    170: ['T20', 'T20', 'D25'],
    167: ['T20', 'T19', 'D25'],
    164: ['T20', 'T18', 'D25'],
    161: ['T20', 'T17', 'D25'],
    160: ['T20', 'T20', 'D20'],
    158: ['T20', 'T20', 'D19'],
    157: ['T20', 'T19', 'D20'],
    156: ['T20', 'T20', 'D18'],
    155: ['T20', 'T19', 'D19'],
    154: ['T20', 'T18', 'D20'],
    153: ['T20', 'T19', 'D18'],
    152: ['T20', 'T20', 'D16'],
    151: ['T20', 'T17', 'D20'],
    150: ['T20', 'T18', 'D18'],
    149: ['T20', 'T19', 'D16'],
    148: ['T20', 'T20', 'D14'],
    147: ['T20', 'T17', 'D18'],
    146: ['T20', 'T18', 'D16'],
    145: ['T20', 'T19', 'D14'],
    144: ['T20', 'T20', 'D12'],
    143: ['T20', 'T17', 'D16'],
    142: ['T20', 'T14', 'D20'],
    141: ['T20', 'T19', 'D12'],
    140: ['T20', 'T20', 'D10'],
    139: ['T20', 'T13', 'D20'],
    138: ['T20', 'T18', 'D12'],
    137: ['T20', 'T19', 'D10'],
    136: ['T20', 'T20', 'D8'],
    135: ['T20', 'T17', 'D12'],
    134: ['T20', 'T14', 'D16'],
    133: ['T20', 'T19', 'D8'],
    132: ['T20', 'T16', 'D12'],
    131: ['T20', 'T13', 'D16'],
    130: ['T20', 'T18', 'D8'],
    129: ['T19', 'T16', 'D12'],
    128: ['T18', 'T14', 'D16'],
    127: ['T20', 'T17', 'D8'],
    126: ['T19', 'T19', 'D6'],
    125: ['T20', 'T19', 'D4'],
    124: ['T20', 'T16', 'D8'],
    123: ['T19', 'T16', 'D9'],
    122: ['T18', 'T18', 'D7'],
    121: ['T20', 'T11', 'D14'],
    120: ['T20', 'S20', 'D20'],
    119: ['T19', 'T12', 'D13'],
    118: ['T20', 'S18', 'D20'],
    117: ['T20', 'S17', 'D20'],
    116: ['T20', 'S16', 'D20'],
    115: ['T20', 'S15', 'D20'],
    114: ['T20', 'S14', 'D20'],
    113: ['T20', 'S13', 'D20'],
    112: ['T20', 'T12', 'D8'],
    111: ['T20', 'S19', 'D16'],
    110: ['T20', 'S10', 'D20'],
    109: ['T20', 'S9', 'D20'],
    108: ['T20', 'S16', 'D16'],
    107: ['T19', 'S10', 'D20'],
    106: ['T20', 'S6', 'D20'],
    105: ['T20', 'S13', 'D16'],
    104: ['T18', 'S18', 'D16'],
    103: ['T19', 'S6', 'D20'],
    102: ['T20', 'S10', 'D16'],
    101: ['T17', 'S10', 'D20'],
    100: ['T20', 'D20'],
    99: ['T19', 'S10', 'D16'],
    98: ['T20', 'D19'],
    97: ['T19', 'D20'],
    96: ['T20', 'D18'],
    95: ['T19', 'D19'],
    94: ['T18', 'D20'],
    93: ['T19', 'D18'],
    92: ['T20', 'D16'],
    91: ['T17', 'D20'],
    90: ['T18', 'D18'],
    89: ['T19', 'D16'],
    88: ['T20', 'D14'],
    87: ['T17', 'D18'],
    86: ['T18', 'D16'],
    85: ['T19', 'D14'],
    84: ['T20', 'D12'],
    83: ['T17', 'D16'],
    82: ['T14', 'D20'],
    81: ['T19', 'D12'],
    80: ['T20', 'D10'],
    79: ['T13', 'D20'],
    78: ['T18', 'D12'],
    77: ['T19', 'D10'],
    76: ['T20', 'D8'],
    75: ['T17', 'D12'],
    74: ['T14', 'D16'],
    73: ['T19', 'D8'],
    72: ['T16', 'D12'],
    71: ['T13', 'D16'],
    70: ['T18', 'D8'],
    69: ['T19', 'D6'],
    68: ['T20', 'D4'],
    67: ['T17', 'D8'],
    66: ['T10', 'D18'],
    65: ['T19', 'D4'],
    64: ['T16', 'D8'],
    63: ['T13', 'D12'],
    62: ['T10', 'D16'],
    61: ['T15', 'D8'],
    60: ['S20', 'D20'],
    59: ['S19', 'D20'],
    58: ['S18', 'D20'],
    57: ['S17', 'D20'],
    56: ['S16', 'D20'],
    55: ['S15', 'D20'],
    54: ['S14', 'D20'],
    53: ['S13', 'D20'],
    52: ['S12', 'D20'],
    51: ['S11', 'D20'],
    50: ['D25'],
    49: ['S9', 'D20'],
    48: ['S16', 'D16'],
    47: ['S15', 'D16'],
    46: ['S6', 'D20'],
    45: ['S13', 'D16'],
    44: ['S12', 'D16'],
    43: ['S11', 'D16'],
    42: ['S10', 'D16'],
    41: ['S9', 'D16'],
    40: ['D20'],
    39: ['S7', 'D16'],
    38: ['D19'],
    37: ['S5', 'D16'],
    36: ['D18'],
    35: ['S3', 'D16'],
    34: ['D17'],
    33: ['S1', 'D16'],
    32: ['D16'],
    31: ['S15', 'D8'],
    30: ['D15'],
    29: ['S13', 'D8'],
    28: ['D14'],
    27: ['S11', 'D8'],
    26: ['D13'],
    25: ['S9', 'D8'],
    24: ['D12'],
    23: ['S7', 'D8'],
    22: ['D11'],
    21: ['S5', 'D8'],
    20: ['D10'],
    19: ['S3', 'D8'],
    18: ['D9'],
    17: ['S1', 'D8'],
    16: ['D8'],
    15: ['S7', 'D4'],
    14: ['D7'],
    13: ['S5', 'D4'],
    12: ['D6'],
    11: ['S3', 'D4'],
    10: ['D5'],
    9: ['S1', 'D4'],
    8: ['D4'],
    7: ['S3', 'D2'],
    6: ['D3'],
    5: ['S1', 'D2'],
    4: ['D2'],
    3: ['S1', 'D1'],
    2: ['D1']
};

// Triple Out checkout table (must finish on a triple)
const tripleOutTable = {
    180: ['T20', 'T20', 'T20'],
    177: ['T20', 'T19', 'T20'],
    174: ['T20', 'T18', 'T20'],
    171: ['T20', 'T17', 'T20'],
    168: ['T20', 'T16', 'T20'],
    165: ['T19', 'T18', 'T20'],
    162: ['T20', 'T14', 'T20'],
    159: ['T20', 'T13', 'T20'],
    156: ['T20', 'T12', 'T20'],
    153: ['T20', 'T11', 'T20'],
    150: ['T20', 'T10', 'T20'],
    147: ['T20', 'T9', 'T20'],
    144: ['T20', 'T8', 'T20'],
    141: ['T20', 'T7', 'T20'],
    138: ['T20', 'T6', 'T20'],
    135: ['T20', 'T5', 'T20'],
    132: ['T20', 'T4', 'T20'],
    129: ['T20', 'T3', 'T20'],
    126: ['T20', 'T2', 'T20'],
    123: ['T20', 'T1', 'T20'],
    120: ['T20', 'T20'],
    117: ['T20', 'T19'],
    114: ['T20', 'T18'],
    111: ['T20', 'T17'],
    108: ['T20', 'T16'],
    105: ['T20', 'T15'],
    102: ['T20', 'T14'],
    99: ['T20', 'T13'],
    96: ['T20', 'T12'],
    93: ['T20', 'T11'],
    90: ['T20', 'T10'],
    87: ['T20', 'T9'],
    84: ['T20', 'T8'],
    81: ['T20', 'T7'],
    78: ['T20', 'T6'],
    75: ['T20', 'T5'],
    72: ['T20', 'T4'],
    69: ['T20', 'T3'],
    66: ['T20', 'T2'],
    63: ['T20', 'T1'],
    60: ['T20'],
    57: ['T19'],
    54: ['T18'],
    51: ['T17'],
    48: ['T16'],
    45: ['T15'],
    42: ['T14'],
    39: ['T13'],
    36: ['T12'],
    33: ['T11'],
    30: ['T10'],
    27: ['T9'],
    24: ['T8'],
    21: ['T7'],
    18: ['T6'],
    15: ['T5'],
    12: ['T4'],
    9: ['T3'],
    6: ['T2'],
    3: ['T1']
};

// ============== API Service ==============
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

// ============== WebSocket Service ==============
const createWebSocketService = () => {
    let stompClient = null;
    let isConnected = false;
    let onMessageCallback = null;

    return {
        connect(sessionCode, onMessage) {
            onMessageCallback = onMessage;
            return new Promise((resolve, reject) => {
                const socket = new SockJS(WS_URL);
                stompClient = Stomp.over(socket);
                stompClient.debug = null;

                stompClient.connect({}, () => {
                    isConnected = true;
                    stompClient.subscribe(`/topic/session/${sessionCode}`, (message) => {
                        const gameState = JSON.parse(message.body);
                        if (onMessageCallback) onMessageCallback(gameState);
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

        sendThrow(sessionCode, points, version) {
            if (!isConnected) return;
            stompClient.send(`/app/session/${sessionCode}/throw`, {}, JSON.stringify({
                points: points,
                expectedVersion: version
            }));
        },

        sendUndo(sessionCode) {
            if (!isConnected) return;
            stompClient.send(`/app/session/${sessionCode}/undo`, {}, '{}');
        },

        sendNextPlayer(sessionCode) {
            if (!isConnected) return;
            stompClient.send(`/app/session/${sessionCode}/next`, {}, '{}');
        },

        sendReset(sessionCode) {
            if (!isConnected) return;
            stompClient.send(`/app/session/${sessionCode}/reset`, {}, '{}');
        },

        sendStart(sessionCode) {
            if (!isConnected) return;
            stompClient.send(`/app/session/${sessionCode}/start`, {}, '{}');
        },

        isConnected() {
            return isConnected;
        }
    };
};

// ============== Session Screen Component ==============
const SessionScreen = {
    template: `
        <div class="container">
            <header>
                <h1>Darts Counter</h1>
            </header>

            <div class="setup-section">
                <h2>Game Session</h2>
                <p class="setup-hint">Play with friends on multiple devices</p>

                <div class="session-buttons">
                    <button class="session-btn create" @click="createSession">Create New Game</button>
                    <button class="session-btn join" @click="showJoin = !showJoin">Join Game</button>
                </div>

                <div class="join-section" v-if="showJoin">
                    <h3>Enter Session Code:</h3>
                    <input
                        type="text"
                        v-model="joinCode"
                        class="session-input"
                        maxlength="6"
                        placeholder="ABC123"
                        @input="joinCode = joinCode.toUpperCase()"
                        @keypress.enter="joinSession"
                    >
                    <button class="start-btn" @click="joinSession">Join</button>
                </div>

                <div class="connection-status" :class="statusClass" v-if="statusMessage">
                    <span>{{ statusMessage }}</span>
                </div>
            </div>
        </div>
    `,
    setup() {
        const router = VueRouter.useRouter();
        const showJoin = ref(false);
        const joinCode = ref('');
        const statusMessage = ref('');
        const statusClass = ref('');

        const createSession = () => {
            router.push('/setup');
        };

        const joinSession = async () => {
            const code = joinCode.value.trim().toUpperCase();
            if (code.length !== 6) {
                statusMessage.value = 'Please enter a 6-character session code';
                statusClass.value = 'error';
                return;
            }

            statusMessage.value = 'Joining session...';
            statusClass.value = '';

            try {
                const gameState = await api.joinSession(code);
                if (gameState.status === 'ACTIVE') {
                    router.push(`/game/${code}`);
                } else {
                    router.push(`/setup?join=${code}`);
                }
            } catch (error) {
                statusMessage.value = 'Failed to join: ' + error.message;
                statusClass.value = 'error';
            }
        };

        return { showJoin, joinCode, statusMessage, statusClass, createSession, joinSession };
    }
};

// ============== Setup Screen Component ==============
const SetupScreen = {
    template: `
        <div class="container">
            <header>
                <h1>Darts Counter</h1>
                <div class="session-code-display" v-if="sessionCode">
                    Session: <span>{{ sessionCode }}</span>
                </div>
            </header>

            <div class="setup-section">
                <h2>Select Players</h2>
                <p class="setup-hint">Tap names to add players (in playing order)</p>

                <div class="name-grid">
                    <button
                        v-for="name in availableNames"
                        :key="name"
                        class="name-btn"
                        :class="{ selected: selectedNames.includes(name) }"
                        @click="togglePlayer(name)"
                    >
                        {{ name }}
                    </button>
                </div>

                <div class="selected-players">
                    <h3>Playing Order:</h3>
                    <div class="player-list">
                        <span v-if="selectedNames.length === 0" class="no-players">No players selected</span>
                        <span v-for="(name, i) in selectedNames" :key="name" class="player-tag">
                            {{ i + 1 }}. {{ name }}
                            <button class="remove-player" @click.stop="removePlayer(name)">&times;</button>
                        </span>
                    </div>
                </div>

                <div class="game-mode">
                    <h3>Starting Score:</h3>
                    <div class="mode-buttons">
                        <button
                            class="mode-btn"
                            :class="{ active: startingScore === 301 }"
                            @click="startingScore = 301"
                        >301</button>
                        <button
                            class="mode-btn"
                            :class="{ active: startingScore === 501 }"
                            @click="startingScore = 501"
                        >501</button>
                    </div>
                </div>

                <div class="game-mode">
                    <h3>Out Mode:</h3>
                    <div class="mode-buttons">
                        <button
                            class="mode-btn"
                            :class="{ active: outMode === 'double' }"
                            @click="outMode = 'double'"
                        >Double Out</button>
                        <button
                            class="mode-btn"
                            :class="{ active: outMode === 'triple' }"
                            @click="outMode = 'triple'"
                        >Triple Out</button>
                    </div>
                </div>

                <button
                    class="start-btn"
                    :disabled="selectedNames.length < 2"
                    @click="startGame"
                >Start Game</button>

                <div class="connection-status" :class="statusClass" v-if="statusMessage">
                    <span>{{ statusMessage }}</span>
                </div>
            </div>
        </div>
    `,
    setup() {
        const router = VueRouter.useRouter();
        const route = VueRouter.useRoute();

        const selectedNames = ref([]);
        const startingScore = ref(301);
        const outMode = ref('double');
        const sessionCode = ref('');
        const statusMessage = ref('');
        const statusClass = ref('');
        const ws = createWebSocketService();

        const togglePlayer = (name) => {
            const index = selectedNames.value.indexOf(name);
            if (index === -1) {
                selectedNames.value.push(name);
            } else {
                selectedNames.value.splice(index, 1);
            }
        };

        const removePlayer = (name) => {
            const index = selectedNames.value.indexOf(name);
            if (index !== -1) {
                selectedNames.value.splice(index, 1);
            }
        };

        const startGame = async () => {
            if (selectedNames.value.length < 2) return;

            statusMessage.value = 'Starting game...';
            statusClass.value = '';

            try {
                // Save out mode to localStorage for the game screen
                localStorage.setItem('outMode', outMode.value);

                // Create session
                const gameState = await api.createSession(selectedNames.value, startingScore.value);
                sessionCode.value = gameState.sessionCode;

                // Connect to WebSocket
                await ws.connect(sessionCode.value, (state) => {
                    if (state.status === 'ACTIVE') {
                        router.push(`/game/${sessionCode.value}`);
                    }
                });

                // Start the game
                ws.sendStart(sessionCode.value);
            } catch (error) {
                statusMessage.value = 'Failed to start game: ' + error.message;
                statusClass.value = 'error';
            }
        };

        // Handle joining an existing session
        onMounted(async () => {
            const joinSessionCode = route.query.join;
            if (joinSessionCode) {
                sessionCode.value = joinSessionCode;
                try {
                    const gameState = await api.getSession(joinSessionCode);
                    selectedNames.value = gameState.players.map(p => p.name);
                    startingScore.value = gameState.startingScore;
                } catch (error) {
                    statusMessage.value = 'Failed to load session';
                    statusClass.value = 'error';
                }
            }
        });

        return {
            availableNames,
            selectedNames,
            startingScore,
            outMode,
            sessionCode,
            statusMessage,
            statusClass,
            togglePlayer,
            removePlayer,
            startGame
        };
    }
};

// ============== Game Screen Component ==============
const GameScreen = {
    template: `
        <div class="container">
            <header>
                <h1>DART TOP <span class="version">3.5</span></h1>
                <div class="session-code-display">
                    <div class="qr-wrapper">
                        <div class="qr-code" ref="qrCodeRef"></div>
                        <span class="code-overlay">{{ sessionCode }}</span>
                    </div>
                </div>
            </header>

            <div class="score-display">
                <div
                    v-for="(player, i) in players"
                    :key="i"
                    class="player"
                    :class="{ active: currentPlayer === i }"
                >
                    <h2>{{ player.name }}</h2>
                    <div class="score">{{ player.score }}</div>
                    <div class="current-throw">{{ player.currentThrow }}</div>
                </div>
            </div>

            <div class="dart-tracker">
                <div
                    v-for="(dart, i) in darts"
                    :key="i"
                    class="dart-slot"
                    :class="{ filled: dart.value !== '-' }"
                >
                    <span class="dart-label">DART {{ i + 1 }}</span>
                    <span class="dart-value">{{ dart.value }}</span>
                </div>
            </div>

            <!-- Out Suggestion -->
            <div class="out-suggestion" v-if="outSuggestion">
                <span class="out-label">OUT:</span>
                <span class="out-darts">
                    <span v-for="(dart, i) in outSuggestion.darts" :key="i" class="out-dart">{{ dart }}</span>
                </span>
            </div>

            <div class="game-input-area">
                <div class="modifiers">
                    <button
                        v-for="mod in modifiers"
                        :key="mod.value"
                        class="modifier-btn"
                        :class="{ active: modifier === mod.value }"
                        @click="modifier = mod.value"
                    >{{ mod.label }}</button>
                </div>

                <div class="number-grid">
                    <button
                        v-for="n in 20"
                        :key="n"
                        class="score-btn"
                        @click="handleScore(n)"
                    >{{ getButtonLabel(n) }}</button>
                    <div class="bull-container">
                        <button class="score-btn bull" @click="handleScore(25)">{{ getBullLabel(25) }}</button>
                        <button class="score-btn bull" @click="handleScore(50)">{{ getBullLabel(50) }}</button>
                    </div>
                </div>
            </div>

            <div class="controls">
                <button class="control-btn miss" @click="handleMiss">✕ Miss</button>
                <button class="control-btn undo" @click="handleUndo">↩ Undo</button>
                <button class="control-btn newgame" @click="handleNewGame">New Game</button>
            </div>

            <!-- Winner Overlay -->
            <div class="winner-overlay" v-if="winner">
                <h2>{{ winner }} Wins!</h2>
                <button @click="handleNewGame">New Game</button>
            </div>
        </div>
    `,
    setup() {
        const router = VueRouter.useRouter();
        const route = VueRouter.useRoute();

        const sessionCode = ref(route.params.code);
        const players = ref([]);
        const currentPlayer = ref(0);
        const dartsThrown = ref(0);
        const modifier = ref(1);
        const version = ref(0);
        const winner = ref(null);
        const currentTurnThrows = ref([]);
        const qrCodeRef = ref(null);
        const outMode = ref(localStorage.getItem('outMode') || 'double');

        const ws = createWebSocketService();

        // Get checkout suggestion for current player
        const getCheckoutSuggestion = (score, dartsRemaining) => {
            const isTripleOut = outMode.value === 'triple';
            const maxCheckout = isTripleOut ? 180 : 170;
            const minCheckout = isTripleOut ? 3 : 2;

            if (score < minCheckout || score > maxCheckout) return null;

            const table = isTripleOut ? tripleOutTable : doubleOutTable;
            const checkout = table[score];
            if (!checkout) return null;

            // Check if we have enough darts for this checkout
            if (checkout.length > dartsRemaining) return null;

            return checkout;
        };

        const outSuggestion = computed(() => {
            if (players.value.length === 0) return null;

            const player = players.value[currentPlayer.value];
            if (!player) return null;

            const dartsRemaining = 3 - dartsThrown.value;
            if (dartsRemaining <= 0) return null;

            const suggestion = getCheckoutSuggestion(player.score, dartsRemaining);
            if (!suggestion) return null;

            return {
                score: player.score,
                darts: suggestion,
                mode: outMode.value
            };
        });

        const generateQRCode = () => {
            if (qrCodeRef.value && sessionCode.value) {
                const gameUrl = `${window.location.origin}/game/${sessionCode.value}`;
                qrCodeRef.value.innerHTML = '';
                new QRCode(qrCodeRef.value, {
                    text: gameUrl,
                    width: 140,
                    height: 140,
                    colorDark: '#333',
                    colorLight: '#fff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
        };

        const modifiers = [
            { value: 1, label: 'Single (x1)' },
            { value: 2, label: 'Double (x2)' },
            { value: 3, label: 'Triple (x3)' }
        ];

        const getButtonLabel = (n) => {
            if (modifier.value === 1) return n;
            const prefix = modifier.value === 2 ? 'D' : 'T';
            return `${prefix}${n} (${n * modifier.value})`;
        };

        const getBullLabel = (base) => {
            return base === 25 ? '25' : '50';
        };

        const darts = computed(() => {
            return [0, 1, 2].map(i => ({
                value: currentTurnThrows.value[i]?.notation || '-'
            }));
        });

        const formatDartNotation = (baseValue, mod, points) => {
            if (baseValue === 0) return 'Miss';
            if (baseValue === 25) {
                return mod === 2 || points === 50 ? 'D-Bull (50)' : 'Bull (25)';
            }
            if (mod === 1) return `${baseValue}`;
            const prefix = mod === 2 ? 'd' : 't';
            return `${prefix}${baseValue} (${points})`;
        };

        const handleStateUpdate = (gameState) => {
            if (gameState.message && gameState.message.startsWith('Error:')) {
                alert(gameState.message);
                return;
            }

            const playerChanged = currentPlayer.value !== gameState.currentPlayerIndex;
            const dartsReset = gameState.dartsThrown < dartsThrown.value;

            currentPlayer.value = gameState.currentPlayerIndex;
            dartsThrown.value = gameState.dartsThrown;
            version.value = gameState.version;

            if (playerChanged || dartsReset) {
                currentTurnThrows.value = [];
            }

            if (gameState.players) {
                players.value = gameState.players.map(p => ({
                    name: p.name,
                    score: p.score,
                    currentThrow: p.currentThrow
                }));
            }

            if (gameState.status === 'FINISHED' && gameState.winnerName) {
                winner.value = gameState.winnerName;
            } else {
                winner.value = null;
            }
        };

        const handleScore = (baseValue) => {
            if (dartsThrown.value >= 3) return;

            let actualModifier = modifier.value;

            // Handle 50 as double bull
            if (baseValue === 50) {
                baseValue = 25;
                actualModifier = 2;
            }

            // Bull can only be single or double
            if (baseValue === 25 && actualModifier === 3) {
                actualModifier = 2;
            }

            const points = baseValue * actualModifier;
            const notation = formatDartNotation(baseValue, actualModifier, points);

            currentTurnThrows.value.push({ baseValue, modifier: actualModifier, points, notation });
            ws.sendThrow(sessionCode.value, points, version.value);
            modifier.value = 1;
        };

        const handleMiss = () => {
            if (dartsThrown.value >= 3) return;
            currentTurnThrows.value.push({ baseValue: 0, modifier: 1, points: 0, notation: 'Miss' });
            ws.sendThrow(sessionCode.value, 0, version.value);
        };

        const handleUndo = () => {
            if (currentTurnThrows.value.length > 0) {
                currentTurnThrows.value.pop();
            }
            ws.sendUndo(sessionCode.value);
        };

        const handleNewGame = () => {
            ws.disconnect();
            router.push('/');
        };

        onMounted(async () => {
            try {
                // Get current game state
                const gameState = await api.getSession(sessionCode.value);

                if (gameState.status !== 'ACTIVE') {
                    router.push('/');
                    return;
                }

                handleStateUpdate(gameState);

                // Connect to WebSocket for live updates
                await ws.connect(sessionCode.value, handleStateUpdate);

                // Generate QR code
                generateQRCode();
            } catch (error) {
                console.error('Failed to load game:', error);
                router.push('/');
            }
        });

        onUnmounted(() => {
            ws.disconnect();
        });

        return {
            sessionCode,
            players,
            currentPlayer,
            modifier,
            modifiers,
            darts,
            winner,
            qrCodeRef,
            outSuggestion,
            getButtonLabel,
            getBullLabel,
            handleScore,
            handleMiss,
            handleUndo,
            handleNewGame
        };
    }
};

// ============== Router Setup ==============
const routes = [
    { path: '/', component: SessionScreen },
    { path: '/setup', component: SetupScreen },
    { path: '/game/:code', component: GameScreen }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// ============== App Setup ==============
const app = createApp({
    template: '<router-view></router-view>'
});

app.use(router);
app.mount('#app');
