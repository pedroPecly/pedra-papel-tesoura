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

// Instâncias
let game;
let inputManager;

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
    victoryModal.classList.remove('hidden');
    
    // Pausar jogo ao mostrar vitória
    game.isPaused = true;
    pauseBtn.textContent = '▶️ Retomar';
}

/**
 * Esconde o modal de vitória
 */
function hideVictoryModal() {
    victoryModal.classList.add('hidden');
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
    
    // Iniciar loop de animação
    animate();
}

/**
 * Handler para reiniciar a partir do modal de vitória
 */
function handleVictoryRestart() {
    hideVictoryModal();
    handleReset();
}

// Iniciar aplicação quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
