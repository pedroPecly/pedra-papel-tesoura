/**
 * CONSTANTES DA APLICAÇÃO
 * Configurações centralizadas para a simulação de Pedra, Papel e Tesoura
 */

// Tipos de partículas
const TYPES = {
    STONE: 0,
    PAPER: 1,
    SCISSORS: 2
};

// Emojis correspondentes aos tipos
const EMOJIS = ['🪨', '📄', '✂️'];

// Quantidade inicial de cada tipo
const INITIAL_COUNT = 30;

// Valores dimensionais (serão recalculados dinamicamente)
let PARTICLE_RADIUS = 15; // px (valor base)
let COLLISION_DISTANCE = PARTICLE_RADIUS * 2.2;
let DEFAULT_VELOCITY_RANGE = 4; // px per frame (base)

/**
 * Atualiza escalas responsivas com base no tamanho do canvas/janela
 * @param {number} width
 * @param {number} height
 */
function updateResponsiveScale(width, height) {
    // Base para escala: menor dimensão da viewport
    const minDim = Math.min(Math.max(width, 200), Math.max(height, 200));

    // Calcular um raio proporcional: entre 8px e 36px
    const radius = Math.round(Math.max(8, Math.min(36, Math.floor(minDim * 0.02))));
    PARTICLE_RADIUS = radius;

    // Distância de colisão proporcional ao raio
    COLLISION_DISTANCE = Math.round(PARTICLE_RADIUS * 2.2);

    // Velocidade base proporcional à dimensão (maiores telas -> velocidades levemente maiores)
    const baseRange = Math.max(2, Math.min(8, Math.round(minDim * 0.004)));

    // Ajuste por devicePixelRatio (dispositivos móveis com alta DPR tendem a reduzir percepção de velocidade)
    const dpi = (typeof window !== 'undefined' && window.devicePixelRatio) ? Math.max(1, Math.round(window.devicePixelRatio)) : 1;

    const newRange = Math.max(2, Math.min(12, Math.round(baseRange * dpi)));

    // Calcular fator de escala relativa para ajustar partículas existentes
    const oldRange = DEFAULT_VELOCITY_RANGE || 1;
    DEFAULT_VELOCITY_RANGE = newRange;
    window._velocityScaleFactor = DEFAULT_VELOCITY_RANGE / oldRange;
}

// Exportar para escopo global (disponível às outras scripts no navegador)
window.updateResponsiveScale = updateResponsiveScale;

// Configuração de FPS (requestAnimationFrame é ~60fps)
const FPS_TARGET = 60;
