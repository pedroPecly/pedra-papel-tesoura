/**
 * MAIN.JS
 * Live arena client (render-only)
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const connectionStatus = document.getElementById('connectionStatus');
const winnerText = document.getElementById('winner');
const stoneCountEl = document.getElementById('stoneCount');
const paperCountEl = document.getElementById('paperCount');
const scissorsCountEl = document.getElementById('scissorsCount');

const roundIdEl = document.getElementById('roundId');
const roundStatusEl = document.getElementById('roundStatus');
const roundTimerEl = document.getElementById('roundTimer');
const balanceValueEl = document.getElementById('balanceValue');
const betAmountInput = document.getElementById('betAmount');
const placeBetBtn = document.getElementById('placeBetBtn');
const betFeedbackEl = document.getElementById('betFeedback');
const betButtons = Array.from(document.querySelectorAll('.bet-btn'));
const livePanel = document.getElementById('livePanel');
const livePanelContent = document.getElementById('livePanelContent');
const toggleLivePanelBtn = document.getElementById('toggleLivePanelBtn');

const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessagesEl = document.getElementById('chatMessages');

const victoryModal = document.getElementById('victoryModal');
const victoryEmoji = document.getElementById('victoryEmoji');
const victoryType = document.getElementById('victoryType');
const victoryCountdownEl = document.getElementById('victoryCountdown');

const MAX_CHAT_MESSAGES = 120;
const SNAPSHOT_BUFFER_MS = 150;
const LIVE_PANEL_STORAGE_KEY = 'livePanelCollapsed';

let worldWidth = typeof WORLD_WIDTH !== 'undefined' ? WORLD_WIDTH : 1200;
let worldHeight = typeof WORLD_HEIGHT !== 'undefined' ? WORLD_HEIGHT : 800;

let view = { scale: 1, offsetX: 0, offsetY: 0 };
let snapshots = [];
let ws = null;
let wsReady = false;
let reconnectTimer = null;
let roundState = null;
let countdownTimer = null;
let userId = localStorage.getItem('liveUserId') || null;
let selectedBetType = null;
let balanceValue = 0;
let panelTabOffset = null;

function getWsUrl() {
    if (window.LIVE_ARENA_WS_URL) return window.LIVE_ARENA_WS_URL;
    if (window.location && window.location.host) {
        const proto = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        return proto + window.location.host + '/ws';
    }
    return 'ws://localhost:8080/ws';
}

function setConnectionStatus(text, isLive) {
    if (connectionStatus) {
        connectionStatus.textContent = text;
        connectionStatus.style.color = isLive ? '#4ade80' : '#93c5fd';
    }
}

function positionTabAtEdge() {
    if (!toggleLivePanelBtn || !livePanel) return;
    const panelRect = livePanel.getBoundingClientRect();
    if (panelTabOffset === null) {
        const tabRect = toggleLivePanelBtn.getBoundingClientRect();
        panelTabOffset = tabRect.top - panelRect.top;
    }
    const top = Math.round(panelRect.top + panelTabOffset);
    toggleLivePanelBtn.style.top = `${top}px`;
    toggleLivePanelBtn.style.left = 'auto';
    toggleLivePanelBtn.style.right = '0';
}

function setLivePanelCollapsed(collapsed) {
    document.body.classList.toggle('panel-collapsed', collapsed);
    if (livePanelContent) {
        livePanelContent.setAttribute('aria-hidden', collapsed ? 'true' : 'false');
    }
    if (toggleLivePanelBtn) {
        toggleLivePanelBtn.setAttribute('aria-expanded', (!collapsed).toString());
        toggleLivePanelBtn.textContent = collapsed ? '<' : '>';
        toggleLivePanelBtn.setAttribute('aria-label', collapsed ? 'Mostrar painel' : 'Ocultar painel');
        if (collapsed) {
            positionTabAtEdge();
        } else {
            toggleLivePanelBtn.style.top = '';
            toggleLivePanelBtn.style.right = '';
            toggleLivePanelBtn.style.left = '';
        }
    }
    localStorage.setItem(LIVE_PANEL_STORAGE_KEY, collapsed ? '1' : '0');
}

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth || window.innerWidth;
    const cssHeight = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
    canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
    view = computeView();
}

function computeView() {
    const scale = Math.min(canvas.width / worldWidth, canvas.height / worldHeight);
    const drawWidth = worldWidth * scale;
    const drawHeight = worldHeight * scale;
    return {
        scale,
        offsetX: (canvas.width - drawWidth) / 2,
        offsetY: (canvas.height - drawHeight) / 2
    };
}

function pushSnapshot(snapshot) {
    if (!snapshot || !snapshot.particles) return;
    snapshots.push(snapshot);
    while (snapshots.length > 30) {
        snapshots.shift();
    }
}

function getInterpolatedSnapshot(renderTime) {
    if (snapshots.length === 0) return null;
    while (snapshots.length >= 2 && snapshots[1].ts <= renderTime) {
        snapshots.shift();
    }
    if (snapshots.length === 1) return snapshots[0];

    const a = snapshots[0];
    const b = snapshots[1];
    const span = Math.max(1, b.ts - a.ts);
    const t = Math.max(0, Math.min(1, (renderTime - a.ts) / span));

    const particles = a.particles.map((p, idx) => {
        const p2 = b.particles[idx] || p;
        return {
            x: p.x + (p2.x - p.x) * t,
            y: p.y + (p2.y - p.y) * t,
            type: p2.type
        };
    });

    return { particles };
}

function renderFrame() {
    const renderTime = Date.now() - SNAPSHOT_BUFFER_MS;
    const snapshot = getInterpolatedSnapshot(renderTime);
    if (snapshot) {
        drawSnapshot(snapshot);
    }
    requestAnimationFrame(renderFrame);
}

function drawSnapshot(snapshot) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(view.scale, 0, 0, view.scale, view.offsetX, view.offsetY);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${PARTICLE_RADIUS * 2}px Arial`;

    snapshot.particles.forEach(p => {
        ctx.fillText(EMOJIS[p.type], p.x, p.y);
    });
}

function updateCounts(counts) {
    if (!counts || counts.length < 3) return;
    stoneCountEl.textContent = counts[TYPES.STONE];
    paperCountEl.textContent = counts[TYPES.PAPER];
    scissorsCountEl.textContent = counts[TYPES.SCISSORS];
}

function setBalance(value) {
    balanceValue = Number(value) || 0;
    if (balanceValueEl) balanceValueEl.textContent = balanceValue;
}

function setBetFeedback(text, isError) {
    if (!betFeedbackEl) return;
    betFeedbackEl.textContent = text || '';
    betFeedbackEl.style.color = isError ? '#f87171' : '#fbbf24';
}

function typeName(type) {
    const names = ['Pedra', 'Papeis', 'Tesoura'];
    return names[type] || 'Desconhecido';
}

function updateRoundUi() {
    if (!roundState) return;
    if (roundIdEl) roundIdEl.textContent = roundState.roundId;

    if (roundStatusEl) {
        if (roundState.status === 'running') {
            roundStatusEl.textContent = roundState.betsOpen ? 'Apostas abertas' : 'Apostas encerradas';
        } else if (roundState.status === 'finished') {
            roundStatusEl.textContent = 'Rodada encerrada';
        } else {
            roundStatusEl.textContent = 'Aguardando...';
        }
    }

    updateRoundTimer();
    updateBetControls();
    updateWinner();
}

function updateRoundTimer() {
    if (!roundState || !roundTimerEl) return;
    const now = Date.now();

    if (roundState.status === 'running') {
        if (roundState.betsOpen && roundState.betClosesAt) {
            const seconds = Math.max(0, Math.ceil((roundState.betClosesAt - now) / 1000));
            roundTimerEl.textContent = seconds > 0 ? `Apostas fecham em ${seconds}s` : 'Apostas encerradas';
        } else {
            roundTimerEl.textContent = 'Apostas encerradas';
        }
    } else if (roundState.status === 'finished' && roundState.endsAt) {
        const seconds = Math.max(0, Math.ceil((roundState.endsAt - now) / 1000));
        roundTimerEl.textContent = `Reinicia em ${seconds}s`;
        if (victoryCountdownEl) victoryCountdownEl.textContent = Math.max(0, seconds);
    } else {
        roundTimerEl.textContent = '';
    }
}

function updateWinner() {
    if (!roundState || roundState.status !== 'finished') {
        if (winnerText) winnerText.textContent = '';
        hideVictoryModal();
        return;
    }

    const winnerType = roundState.winnerType;
    if (winnerText) winnerText.textContent = `Vencedor: ${typeName(winnerType)}`;
    showVictoryModal(winnerType);
}

function showVictoryModal(winnerType) {
    if (!victoryModal) return;
    victoryEmoji.textContent = EMOJIS[winnerType] || '';
    victoryType.textContent = typeName(winnerType);
    victoryModal.classList.remove('hidden');
}

function hideVictoryModal() {
    if (!victoryModal) return;
    victoryModal.classList.add('hidden');
}

function updateBetControls() {
    const betsOpen = !!(roundState && roundState.status === 'running' && roundState.betsOpen);
    betButtons.forEach(btn => {
        btn.disabled = !betsOpen;
    });
    if (placeBetBtn) placeBetBtn.disabled = !betsOpen || selectedBetType === null;
}

function appendChatMessage(message) {
    if (!chatMessagesEl || !message) return;
    const line = document.createElement('div');
    line.className = 'chat-message';

    const ts = message.ts || Date.now();
    const time = new Date(ts).toISOString().slice(11, 16);
    const user = message.userId ? message.userId.slice(0, 6) : 'anon';

    line.textContent = `[${time}] ${user}: ${message.text}`;
    chatMessagesEl.appendChild(line);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;

    while (chatMessagesEl.children.length > MAX_CHAT_MESSAGES) {
        chatMessagesEl.removeChild(chatMessagesEl.firstChild);
    }
}

function connect() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }

    setConnectionStatus('Conectando...', false);
    ws = new WebSocket(getWsUrl());

    ws.addEventListener('open', () => {
        wsReady = true;
        setConnectionStatus('Ao vivo', true);
        sendMessage({ type: 'join', userId });
    });

    ws.addEventListener('message', event => {
        let data = null;
        try {
            data = JSON.parse(event.data);
        } catch (err) {
            return;
        }
        handleMessage(data);
    });

    ws.addEventListener('close', () => {
        wsReady = false;
        setConnectionStatus('Desconectado - tentando reconectar', false);
        reconnectTimer = setTimeout(connect, 2000);
    });

    ws.addEventListener('error', () => {
        wsReady = false;
        setConnectionStatus('Erro de conexao', false);
    });
}

function handleMessage(message) {
    if (!message || !message.type) return;

    if (message.type === 'welcome') {
        if (message.userId) {
            userId = message.userId;
            localStorage.setItem('liveUserId', userId);
        }
        if (message.world) {
            worldWidth = message.world.width || worldWidth;
            worldHeight = message.world.height || worldHeight;
            resizeCanvas();
        }
        if (message.balance !== undefined) setBalance(message.balance);
        if (message.roundState) {
            roundState = message.roundState;
            updateRoundUi();
        }
        if (message.snapshot) {
            pushSnapshot(message.snapshot);
            if (message.snapshot.counts) updateCounts(message.snapshot.counts);
        }
        if (message.chat && Array.isArray(message.chat)) {
            message.chat.forEach(msg => appendChatMessage(msg));
        }
        return;
    }

    if (message.type === 'snapshot') {
        pushSnapshot(message);
        if (message.counts) updateCounts(message.counts);
        return;
    }

    if (message.type === 'roundState') {
        roundState = message;
        updateRoundUi();
        return;
    }

    if (message.type === 'chatMessage') {
        appendChatMessage(message);
        return;
    }

    if (message.type === 'betUpdate') {
        if (message.balance !== undefined) setBalance(message.balance);
        if (message.result === 'won') {
            setBetFeedback('Aposta vencedora!', false);
        } else if (message.result === 'lost') {
            setBetFeedback('Aposta perdida.', true);
        } else if (message.status === 'accepted') {
            setBetFeedback('Aposta registrada.', false);
        }
        return;
    }

    if (message.type === 'error') {
        setBetFeedback(message.message || 'Erro no servidor', true);
    }
}

function sendMessage(payload) {
    if (!wsReady || !ws || ws.readyState !== WebSocket.OPEN) {
        setBetFeedback('Sem conexao com o servidor', true);
        return;
    }
    ws.send(JSON.stringify(payload));
}

function selectBetType(type) {
    selectedBetType = type;
    betButtons.forEach(btn => {
        const btnType = Number(btn.dataset.bet);
        btn.classList.toggle('active', btnType === type);
    });
    updateBetControls();
}

function placeBet() {
    if (!roundState || roundState.status !== 'running' || !roundState.betsOpen) {
        setBetFeedback('Apostas encerradas.', true);
        return;
    }

    const amount = Number(betAmountInput.value);
    if (!selectedBetType && selectedBetType !== 0) {
        setBetFeedback('Escolha um tipo para apostar.', true);
        return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
        setBetFeedback('Valor invalido.', true);
        return;
    }

    sendMessage({
        type: 'placeBet',
        roundId: roundState.roundId,
        choice: selectedBetType,
        amount
    });
}

function setupUi() {
    window.addEventListener('resize', resizeCanvas);

    if (toggleLivePanelBtn) {
        toggleLivePanelBtn.addEventListener('click', () => {
            const isCollapsed = document.body.classList.contains('panel-collapsed');
            setLivePanelCollapsed(!isCollapsed);
        });
    }

    betButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            selectBetType(Number(btn.dataset.bet));
        });
    });

    if (placeBetBtn) {
        placeBetBtn.addEventListener('click', placeBet);
    }

    if (chatForm) {
        chatForm.addEventListener('submit', event => {
            event.preventDefault();
            const text = chatInput.value.trim();
            if (!text) return;
            sendMessage({ type: 'chatMessage', text });
            chatInput.value = '';
        });
    }

    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(updateRoundTimer, 500);
}

function init() {
    resizeCanvas();
    setupUi();
    const storedCollapsed = localStorage.getItem(LIVE_PANEL_STORAGE_KEY) === '1';
    setLivePanelCollapsed(storedCollapsed);
    connect();
    renderFrame();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
