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

// Tamanho do raio das partículas em pixels
const PARTICLE_RADIUS = 15;

// Distância para detectar colisão
const COLLISION_DISTANCE = PARTICLE_RADIUS * 2.2;

// Velocidade padrão das partículas (vx e vy)
const DEFAULT_VELOCITY_RANGE = 4;

// Configuração de FPS (requestAnimationFrame é ~60fps)
const FPS_TARGET = 60;
