'use strict';

const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PORT) || 8080;
const WEB_DIR = path.join(__dirname, '..', 'web');

const WORLD_WIDTH = 1200;
const WORLD_HEIGHT = 800;
const PARTICLE_RADIUS = 15;
const COLLISION_DISTANCE = PARTICLE_RADIUS * 2.2;
const DEFAULT_VELOCITY_RANGE = 4;
const INITIAL_COUNT = 30;

const TICK_RATE = 30;
const SNAPSHOT_RATE = 12;
const BET_WINDOW_MS = 30000;
const ROUND_END_MS = 3000;
const STARTING_BALANCE = 1000;

const CHAT_RATE_LIMIT_MS = 1200;
const MAX_CHAT_LEN = 160;

const TYPES = {
  STONE: 0,
  PAPER: 1,
  SCISSORS: 2
};

const state = {
  particles: [],
  round: {
    roundId: 0,
    status: 'running',
    betsOpen: true,
    betClosesAt: 0,
    winnerType: null,
    endsAt: 0
  }
};

const balances = new Map();
const betsByRound = new Map();
const clients = new Map();
const chatHistory = [];

let particleIdCounter = 1;
let nextRoundTimer = null;

function makeId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'u_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function getBalance(userId) {
  if (!balances.has(userId)) balances.set(userId, STARTING_BALANCE);
  return balances.get(userId);
}

function setBalance(userId, value) {
  balances.set(userId, Math.max(0, Math.floor(value)));
  return balances.get(userId);
}

function createParticle(type) {
  const x = Math.random() * (WORLD_WIDTH - PARTICLE_RADIUS * 2) + PARTICLE_RADIUS;
  const y = Math.random() * (WORLD_HEIGHT - PARTICLE_RADIUS * 2) + PARTICLE_RADIUS;
  const vx = (Math.random() - 0.5) * DEFAULT_VELOCITY_RANGE;
  const vy = (Math.random() - 0.5) * DEFAULT_VELOCITY_RANGE;
  return {
    id: particleIdCounter++,
    type,
    x,
    y,
    vx,
    vy
  };
}

function createParticles() {
  const particles = [];
  for (let type = 0; type < 3; type += 1) {
    for (let i = 0; i < INITIAL_COUNT; i += 1) {
      particles.push(createParticle(type));
    }
  }
  return particles;
}

function startRound() {
  state.round.roundId += 1;
  state.round.status = 'running';
  state.round.betsOpen = true;
  state.round.betClosesAt = Date.now() + BET_WINDOW_MS;
  state.round.winnerType = null;
  state.round.endsAt = 0;
  state.particles = createParticles();
  betsByRound.set(state.round.roundId, new Map());
  broadcastRoundState();
}

function endRound(winnerType) {
  state.round.status = 'finished';
  state.round.betsOpen = false;
  state.round.winnerType = winnerType;
  state.round.endsAt = Date.now() + ROUND_END_MS;
  broadcastRoundState();
  settleBets(winnerType);

  if (nextRoundTimer) clearTimeout(nextRoundTimer);
  nextRoundTimer = setTimeout(() => {
    startRound();
  }, ROUND_END_MS);
}

function applyGameRule(p1, p2) {
  let winner = null;
  let loser = null;

  if (p1.type === TYPES.STONE && p2.type === TYPES.SCISSORS) {
    winner = p1;
    loser = p2;
  } else if (p1.type === TYPES.SCISSORS && p2.type === TYPES.PAPER) {
    winner = p1;
    loser = p2;
  } else if (p1.type === TYPES.PAPER && p2.type === TYPES.STONE) {
    winner = p1;
    loser = p2;
  } else if (p2.type === TYPES.STONE && p1.type === TYPES.SCISSORS) {
    winner = p2;
    loser = p1;
  } else if (p2.type === TYPES.SCISSORS && p1.type === TYPES.PAPER) {
    winner = p2;
    loser = p1;
  } else if (p2.type === TYPES.PAPER && p1.type === TYPES.STONE) {
    winner = p2;
    loser = p1;
  }

  if (winner && loser) {
    loser.type = winner.type;
  }
}

function handleCollisions() {
  for (let i = 0; i < state.particles.length; i += 1) {
    for (let j = i + 1; j < state.particles.length; j += 1) {
      const p1 = state.particles[i];
      const p2 = state.particles[j];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < COLLISION_DISTANCE && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        const dvx = p2.vx - p1.vx;
        const dvy = p2.vy - p1.vy;
        const dvn = dvx * nx + dvy * ny;

        if (dvn < 0) {
          const impulse = dvn;
          p1.vx += impulse * nx;
          p1.vy += impulse * ny;
          p2.vx -= impulse * nx;
          p2.vy -= impulse * ny;

          const overlap = COLLISION_DISTANCE - dist;
          const separationX = (overlap / 2 + 1) * nx;
          const separationY = (overlap / 2 + 1) * ny;
          p1.x -= separationX;
          p1.y -= separationY;
          p2.x += separationX;
          p2.y += separationY;
        }

        if (p1.type !== p2.type) {
          applyGameRule(p1, p2);
        }
      }
    }
  }
}

function updateGame() {
  const now = Date.now();

  if (state.round.status === 'running' && state.round.betsOpen && now >= state.round.betClosesAt) {
    state.round.betsOpen = false;
    broadcastRoundState();
  }

  if (state.round.status !== 'running') return;

  state.particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x - PARTICLE_RADIUS < 0 || p.x + PARTICLE_RADIUS > WORLD_WIDTH) {
      p.vx *= -1;
      p.x = Math.max(PARTICLE_RADIUS, Math.min(WORLD_WIDTH - PARTICLE_RADIUS, p.x));
    }

    if (p.y - PARTICLE_RADIUS < 0 || p.y + PARTICLE_RADIUS > WORLD_HEIGHT) {
      p.vy *= -1;
      p.y = Math.max(PARTICLE_RADIUS, Math.min(WORLD_HEIGHT - PARTICLE_RADIUS, p.y));
    }
  });

  handleCollisions();

  const winnerType = checkWinner();
  if (winnerType !== null) {
    endRound(winnerType);
  }
}

function checkWinner() {
  const counts = getCounts();
  const nonZero = counts.filter(count => count > 0);
  if (nonZero.length === 1) {
    return counts.findIndex(count => count > 0);
  }
  return null;
}

function getCounts() {
  const counts = [0, 0, 0];
  state.particles.forEach(p => {
    counts[p.type] += 1;
  });
  return counts;
}

function buildSnapshot() {
  return {
    type: 'snapshot',
    ts: Date.now(),
    particles: state.particles.map(p => ({
      id: p.id,
      type: p.type,
      x: p.x,
      y: p.y
    })),
    counts: getCounts()
  };
}

function getRoundState() {
  return {
    type: 'roundState',
    roundId: state.round.roundId,
    status: state.round.status,
    betsOpen: state.round.betsOpen,
    betClosesAt: state.round.betClosesAt,
    winnerType: state.round.winnerType,
    endsAt: state.round.endsAt
  };
}

function broadcastRoundState() {
  broadcast(getRoundState());
}

function settleBets(winnerType) {
  const bets = betsByRound.get(state.round.roundId);
  if (!bets) return;

  bets.forEach((bet, userId) => {
    if (bet.choice === winnerType) {
      const newBalance = setBalance(userId, getBalance(userId) + bet.amount * 2);
      sendToUser(userId, {
        type: 'betUpdate',
        roundId: state.round.roundId,
        choice: bet.choice,
        amount: bet.amount,
        result: 'won',
        balance: newBalance
      });
    } else {
      sendToUser(userId, {
        type: 'betUpdate',
        roundId: state.round.roundId,
        choice: bet.choice,
        amount: bet.amount,
        result: 'lost',
        balance: getBalance(userId)
      });
    }
  });
}

function send(ws, payload) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcast(payload) {
  const message = JSON.stringify(payload);
  clients.forEach((info, ws) => {
    if (ws.readyState === 1) {
      ws.send(message);
    }
  });
}

function sendToUser(userId, payload) {
  clients.forEach((info, ws) => {
    if (info.userId === userId) {
      send(ws, payload);
    }
  });
}

function addChatMessage(userId, text) {
  const message = {
    type: 'chatMessage',
    id: makeId(),
    userId,
    text,
    ts: Date.now()
  };

  chatHistory.push(message);
  while (chatHistory.length > 50) {
    chatHistory.shift();
  }

  broadcast(message);
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const safePath = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = path.join(WEB_DIR, safePath);

  if (!filePath.startsWith(WEB_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    }[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
}

const server = http.createServer(serveStatic);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  if (request.url === '/ws') {
    wss.handleUpgrade(request, socket, head, ws => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', ws => {
  clients.set(ws, { userId: null, lastChatAt: 0 });

  ws.on('message', data => {
    let message = null;
    try {
      message = JSON.parse(data.toString());
    } catch (err) {
      return;
    }

    if (!message || !message.type) return;

    const info = clients.get(ws) || { userId: null, lastChatAt: 0 };

    if (message.type === 'join') {
      const id = message.userId || makeId();
      info.userId = id;
      clients.set(ws, info);

      send(ws, {
        type: 'welcome',
        userId: id,
        balance: getBalance(id),
        world: {
          width: WORLD_WIDTH,
          height: WORLD_HEIGHT,
          particleRadius: PARTICLE_RADIUS
        },
        roundState: getRoundState(),
        snapshot: buildSnapshot(),
        chat: chatHistory
      });
      return;
    }

    if (!info.userId) return;

    if (message.type === 'chatMessage') {
      const now = Date.now();
      const rawText = String(message.text || '').trim();
      if (!rawText) return;

      if (rawText.length > MAX_CHAT_LEN) {
        send(ws, { type: 'error', message: 'Mensagem muito longa.' });
        return;
      }

      if (now - info.lastChatAt < CHAT_RATE_LIMIT_MS) {
        send(ws, { type: 'error', message: 'Aguarde para enviar outra mensagem.' });
        return;
      }

      info.lastChatAt = now;
      clients.set(ws, info);
      addChatMessage(info.userId, rawText);
      return;
    }

    if (message.type === 'placeBet') {
      if (state.round.status !== 'running' || !state.round.betsOpen) {
        send(ws, { type: 'error', message: 'Apostas encerradas.' });
        return;
      }

      if (message.roundId !== state.round.roundId) {
        send(ws, { type: 'error', message: 'Rodada invalida.' });
        return;
      }

      const choice = Number(message.choice);
      const amount = Math.floor(Number(message.amount));
      if (![TYPES.STONE, TYPES.PAPER, TYPES.SCISSORS].includes(choice)) {
        send(ws, { type: 'error', message: 'Escolha invalida.' });
        return;
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        send(ws, { type: 'error', message: 'Valor invalido.' });
        return;
      }

      const bets = betsByRound.get(state.round.roundId) || new Map();
      if (bets.has(info.userId)) {
        send(ws, { type: 'error', message: 'Voce ja apostou nesta rodada.' });
        return;
      }

      const balance = getBalance(info.userId);
      if (amount > balance) {
        send(ws, { type: 'error', message: 'Saldo insuficiente.' });
        return;
      }

      setBalance(info.userId, balance - amount);
      bets.set(info.userId, { choice, amount });
      betsByRound.set(state.round.roundId, bets);

      send(ws, {
        type: 'betUpdate',
        roundId: state.round.roundId,
        choice,
        amount,
        status: 'accepted',
        balance: getBalance(info.userId)
      });
      return;
    }

    if (message.type === 'requestSync') {
      send(ws, buildSnapshot());
      send(ws, getRoundState());
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

startRound();
setInterval(updateGame, Math.round(1000 / TICK_RATE));
setInterval(() => {
  broadcast(buildSnapshot());
}, Math.round(1000 / SNAPSHOT_RATE));

server.listen(PORT, () => {
  console.log(`Live arena server running on http://localhost:${PORT}`);
});
