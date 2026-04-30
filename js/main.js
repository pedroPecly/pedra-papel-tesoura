/**
 * MAIN.JS
 * Ponto de entrada da aplicação
 * Gerencia inicialização e eventos do usuário
 */

// Referências do DOM
const canvas = document.getElementById('gameCanvas');
const increaseVelocityBtn = document.getElementById('increaseVelocityBtn');
const decreaseVelocityBtn = document.getElementById('decreaseVelocityBtn');
const velocityValue = document.getElementById('velocityValue');
const winnerText = document.getElementById('winner');
const stoneCountEl = document.getElementById('stoneCount');
const paperCountEl = document.getElementById('paperCount');
const scissorsCountEl = document.getElementById('scissorsCount');

// Elementos do Modal de Vitória
const victoryModal = document.getElementById('victoryModal');
const victoryEmoji = document.getElementById('victoryEmoji');
const victoryType = document.getElementById('victoryType');
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
function resetGame() {
    game.initParticles();
    game.isPaused = false;

    // Resetar estado de entrada
    inputManager.deselectParticle();

    updateStats();
    updateWinner();
    updateVelocityDisplay();
}

/**
 * Aumenta a velocidade de todas as partículas
 */
function handleIncreaseVelocity() {
    game.increaseVelocity();
    updateVelocityDisplay();
}

/**
 * Diminui a velocidade de todas as partículas
 */
function handleDecreaseVelocity() {
    game.decreaseVelocity();
    updateVelocityDisplay();
}

/**
 * Atualiza a exibição do indicador de velocidade
 * Anima o valor quando muda
 */
function updateVelocityDisplay() {
    const velocityInfo = game.getVelocityInfo();
    
    // Atualizar texto de velocidade
    velocityValue.textContent = velocityInfo.percentage + '%';
    
    // Adicionar animação de pulse
    velocityValue.classList.remove('updated');
    // Forçar reflow para reiniciar a animação
    void velocityValue.offsetWidth;
    velocityValue.classList.add('updated');
    
    // Desabilitar/habilitar botões conforme necessário
    increaseVelocityBtn.disabled = !velocityInfo.canIncrease;
    decreaseVelocityBtn.disabled = !velocityInfo.canDecrease;
    
    // Ajustar aparência dos botões desabilitados
    if (!velocityInfo.canIncrease) {
        increaseVelocityBtn.style.opacity = '0.5';
        increaseVelocityBtn.style.cursor = 'not-allowed';
    } else {
        increaseVelocityBtn.style.opacity = '1';
        increaseVelocityBtn.style.cursor = 'pointer';
    }
    
    if (!velocityInfo.canDecrease) {
        decreaseVelocityBtn.style.opacity = '0.5';
        decreaseVelocityBtn.style.cursor = 'not-allowed';
    } else {
        decreaseVelocityBtn.style.opacity = '1';
        decreaseVelocityBtn.style.cursor = 'pointer';
    }
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
    
    // Inicializar jogo
    resetGame();
    
    // Adicionar event listeners
    increaseVelocityBtn.addEventListener('click', handleIncreaseVelocity);
    decreaseVelocityBtn.addEventListener('click', handleDecreaseVelocity);
    
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
    resetGame();
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
