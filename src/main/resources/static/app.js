const { createApp, ref, reactive, computed, onMounted, onUnmounted, watch } = Vue;
const { createRouter, createWebHistory } = VueRouter;

// API configuration
const API_BASE_URL = '/api';
const WS_URL = '/ws';

// Available player names
const availableNames = ['Leo', 'Alex', 'Jakob', 'Philip', 'Patrick', 'Elisabeth', 'Bernhard', 'Thomas'];

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

        const ws = createWebSocketService();

        const generateQRCode = () => {
            if (qrCodeRef.value && sessionCode.value) {
                const gameUrl = `${window.location.origin}/game/${sessionCode.value}`;
                qrCodeRef.value.innerHTML = '';
                new QRCode(qrCodeRef.value, {
                    text: gameUrl,
                    width: 88,
                    height: 88,
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
