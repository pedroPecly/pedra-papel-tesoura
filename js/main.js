/**
 * MAIN.JS
 * Ponto de entrada da aplicação
 * Gerencia inicialização e eventos do usuário
 */

// Referências do DOM
const canvas = document.getElementById('gameCanvas');
const resetBtn = document.getElementById('resetBtn');
const pauseBtn = document.getElementById('pauseBtn');
const winnerText = document.getElementById('winner');
const stoneCountEl = document.getElementById('stoneCount');
const paperCountEl = document.getElementById('paperCount');
const scissorsCountEl = document.getElementById('scissorsCount');

// Elementos do Modal de Vitória
const victoryModal = document.getElementById('victoryModal');
const victoryEmoji = document.getElementById('victoryEmoji');
const victoryType = document.getElementById('victoryType');
const victoryRestartBtn = document.getElementById('victoryRestartBtn');
const victoryCountdownEl = document.getElementById('victoryCountdown');

// Instâncias
let game;
let inputManager;
// Timers para reinício automático
let victoryCountdownInterval = null;

/**
 * Atualiza a exibição das estatísticas
 */
function updateStats() {
    const counts = game.getCounts();
    stoneCountEl.textContent = counts[TYPES.STONE];
    paperCountEl.textContent = counts[TYPES.PAPER];
    scissorsCountEl.textContent = counts[TYPES.SCISSORS];
}

/**
 * Atualiza a exibição do vencedor
 */
function updateWinner() {
    if (game.gameWinner) {
        winnerText.textContent = `Vencedor: ${game.gameWinner}`;
        showVictoryModal(game.gameWinner);
    } else {
        winnerText.textContent = '';
    }
}

/**
 * Loop principal de animação
 */
function animate() {
    // Atualizar lógica do jogo
    game.update();

    // Renderizar
    game.render();

    // Atualizar UI
    updateStats();
    updateWinner();

    // Próximo frame
    requestAnimationFrame(animate);
}

/**
 * Reseta o jogo
 */
function handleReset() {
    game.initParticles();
    game.isPaused = false;
    pauseBtn.textContent = '⏸️ Pausar';
    
    // Resetar estado de entrada
    inputManager.deselectParticle();
    
    updateStats();
    updateWinner();
}

/**
 * Toggle pausa
 */
function handlePause() {
    game.togglePause();
    pauseBtn.textContent = game.isPaused ? '▶️ Retomar' : '⏸️ Pausar';
}

/**
 * Mostra o modal de vitória
 * @param {string} emoji - Emoji do vencedor
 */
function showVictoryModal(emoji) {
    victoryEmoji.textContent = emoji;
    victoryType.textContent = getVictoryTypeName(emoji);
    // Se já está visível, não re-iniciar o timer
    if (!victoryModal.classList.contains('hidden')) return;

    victoryModal.classList.remove('hidden');

    // Pausar jogo ao mostrar vitória
    game.isPaused = true;
    pauseBtn.textContent = '▶️ Retomar';

    // Iniciar contagem regressiva para reiniciar automaticamente
    startVictoryAutoRestart(5);
}

/**
 * Esconde o modal de vitória
 */
function hideVictoryModal() {
    victoryModal.classList.add('hidden');
    clearVictoryAutoRestart();
}

/**
 * Obtém o nome do tipo baseado no emoji
 * @param {string} emoji - Emoji
 * @returns {string} Nome do tipo
 */
function getVictoryTypeName(emoji) {
    const types = {
        '🪨': 'Pedra',
        '📄': 'Papel',
        '✂️': 'Tesoura'
    };
    return types[emoji] || 'Desconhecido';
}

/**
 * Inicializa a aplicação
 */
function init() {
    // Criar instância do jogo
    game = new Game(canvas);
    
    // Criar gerenciador de entrada
    inputManager = new InputManager(canvas, game);
    
    // Inicializar partículas
    game.initParticles();
    
    // Atualizar UI
    updateStats();
    updateWinner();
    
    // Adicionar event listeners
    resetBtn.addEventListener('click', handleReset);
    pauseBtn.addEventListener('click', handlePause);
    victoryRestartBtn.addEventListener('click', handleVictoryRestart);
    // Se o usuário clicar no botão manualmente, garantir limpeza dos timers
    victoryRestartBtn.addEventListener('click', () => clearVictoryAutoRestart());
    
    // Iniciar loop de animação
    animate();
}

/**
 * Handler para reiniciar a partir do modal de vitória
 */
function handleVictoryRestart() {
    // Limpar timers e reiniciar
    clearVictoryAutoRestart();
    hideVictoryModal();
    handleReset();
}

/**
 * Inicia a contagem regressiva exibida no modal e chama reinício ao final
 * @param {number} seconds
 */
function startVictoryAutoRestart(seconds = 5) {
    clearVictoryAutoRestart();
    let remaining = Math.max(1, Math.floor(seconds));
    if (victoryCountdownEl) victoryCountdownEl.textContent = remaining;

    victoryCountdownInterval = setInterval(() => {
        remaining -= 1;
        if (victoryCountdownEl) victoryCountdownEl.textContent = Math.max(0, remaining);
        if (remaining <= 0) {
            clearVictoryAutoRestart();
            handleVictoryRestart();
        }
    }, 1000);
}

function clearVictoryAutoRestart() {
    if (victoryCountdownInterval) {
        clearInterval(victoryCountdownInterval);
        victoryCountdownInterval = null;
    }
    if (victoryCountdownEl) victoryCountdownEl.textContent = '5';
}

// Iniciar aplicação quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
