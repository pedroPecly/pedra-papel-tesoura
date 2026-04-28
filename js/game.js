/**
 * CLASSE GAME
 * Gerencia a lógica principal da simulação
 */

class Game {
    /**
     * Construtor do jogo
     * @param {HTMLCanvasElement} canvas - Elemento canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.isPaused = false;
        this.gameWinner = null;
        
        // Setup canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    /**
     * Redimensiona o canvas para preencher a janela
     */
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * Inicializa as partículas
     * Cria 30 partículas de cada tipo em posições aleatórias
     */
    initParticles() {
        this.particles = [];
        this.gameWinner = null;

        for (let type = 0; type < 3; type++) {
            for (let i = 0; i < INITIAL_COUNT; i++) {
                const x = Math.random() * (this.canvas.width - PARTICLE_RADIUS * 2) + PARTICLE_RADIUS;
                const y = Math.random() * (this.canvas.height - PARTICLE_RADIUS * 2) + PARTICLE_RADIUS;
                this.particles.push(new Particle(x, y, type));
            }
        }
    }

    /**
     * Verifica se há um vencedor
     * Um tipo vence quando é o único restante
     */
    checkWinner() {
        const counts = [0, 0, 0];
        this.particles.forEach(p => counts[p.type]++);

        const nonZeroTypes = counts.filter(c => c > 0).length;

        if (nonZeroTypes === 1) {
            const winnerType = counts.findIndex(c => c > 0);
            this.gameWinner = EMOJIS[winnerType];
        }
    }

    /**
     * Aplica a lógica de vencedor na colisão
     * @param {Particle} p1 - Primeira partícula
     * @param {Particle} p2 - Segunda partícula
     */
    applyGameRule(p1, p2) {
        let winner, loser;

        // Lógica: Pedra > Tesoura, Tesoura > Papel, Papel > Pedra
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

    /**
     * Detecta e processa colisões entre partículas
     * Aplica física realista com impulso e transforma perdedores
     * Partículas iguais também colidem e se repelem fisicamente
     */
    handleCollisions() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];

                // Não aplicar colisão se alguma partícula está sendo controlada
                if (p1.isControlled || p2.isControlled) {
                    continue;
                }

                const distance = p1.distanceTo(p2);
                
                // Verificar se estão colidindo (tipos iguais ou diferentes)
                if (distance < COLLISION_DISTANCE) {
                    // Calcular o vetor de colisão
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    // Normalizar o vetor (se não for zero)
                    if (dist > 0) {
                        const nx = dx / dist;
                        const ny = dy / dist;

                        // Calcular velocidades relativas
                        const dvx = p2.vx - p1.vx;
                        const dvy = p2.vy - p1.vy;
                        const dvn = dvx * nx + dvy * ny;

                        // Só aplicar impulso se estão se movendo um em direção ao outro
                        if (dvn < 0) {
                            // Aplicar impulso (troca de velocidades na direção da colisão)
                            const impulse = dvn;
                            p1.vx += impulse * nx;
                            p1.vy += impulse * ny;
                            p2.vx -= impulse * nx;
                            p2.vy -= impulse * ny;

                            // Afastar as partículas para evitar sobreposição
                            const overlap = COLLISION_DISTANCE - distance;
                            const separationX = (overlap / 2 + 1) * nx;
                            const separationY = (overlap / 2 + 1) * ny;
                            p1.x -= separationX;
                            p1.y -= separationY;
                            p2.x += separationX;
                            p2.y += separationY;
                        }

                        // Aplicar regra do jogo apenas se tipos são diferentes
                        if (p1.type !== p2.type) {
                            this.applyGameRule(p1, p2);
                        }
                    }
                }
            }
        }
    }

    /**
     * Atualiza o estado do jogo a cada frame
     */
    update() {
        if (this.isPaused) return;

        // Atualizar posições das partículas
        this.particles.forEach(p => p.update(this.canvas.width, this.canvas.height));

        // Detectar e processar colisões
        this.handleCollisions();

        // Verificar vencedor
        this.checkWinner();
    }

    /**
     * Renderiza todas as partículas
     */
    render() {
        // Limpar canvas
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Desenhar partículas
        this.particles.forEach(p => p.draw(this.ctx));
    }

    /**
     * Toggle do pausa
     */
    togglePause() {
        this.isPaused = !this.isPaused;
    }

    /**
     * Obtém as contagens atuais de cada tipo
     * @returns {Array<number>} Array com contagens [stones, papers, scissors]
     */
    getCounts() {
        const counts = [0, 0, 0];
        this.particles.forEach(p => counts[p.type]++);
        return counts;
    }
}
