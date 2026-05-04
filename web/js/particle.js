/**
 * CLASSE PARTICLE
 * Representa uma partícula (emoji) na simulação
 */

class Particle {
    /**
     * Construtor da partícula
     * @param {number} x - Posição X inicial
     * @param {number} y - Posição Y inicial
     * @param {number} type - Tipo da partícula (STONE, PAPER, ou SCISSORS)
     */
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        
        // Velocidade aleatória inicial
        this.vxBase = (Math.random() - 0.5) * DEFAULT_VELOCITY_RANGE;
        this.vyBase = (Math.random() - 0.5) * DEFAULT_VELOCITY_RANGE;
        
        // Velocidade atual (será escalada pelo multiplicador global)
        this.vx = this.vxBase;
        this.vy = this.vyBase;
        
        // Estado de controle pelo usuário
        this.isControlled = false;
    }

    /**
     * Atualiza a velocidade atual com base no multiplicador global
     * Deve ser chamada antes de update() para aplicar o multiplicador
     */
    updateVelocityByMultiplier() {
        const multiplier = window.getVelocityMultiplier ? window.getVelocityMultiplier() : 1.0;
        this.vx = this.vxBase * multiplier;
        this.vy = this.vyBase * multiplier;
    }

    /**
     * Atualiza a posição da partícula a cada frame
     * Aplica bounce nas bordas do canvas
     * @param {number} canvasWidth - Largura do canvas
     * @param {number} canvasHeight - Altura do canvas
     */
    update(canvasWidth, canvasHeight) {
        // Se está sendo controlada pelo usuário, não aplicar física de movimento
        if (this.isControlled) {
            return;
        }

        // Atualizar posição
        this.x += this.vx;
        this.y += this.vy;

        // Bounce nas bordas horizontais
        if (this.x - PARTICLE_RADIUS < 0 || this.x + PARTICLE_RADIUS > canvasWidth) {
            this.vx *= -1;
            this.x = Math.max(PARTICLE_RADIUS, Math.min(canvasWidth - PARTICLE_RADIUS, this.x));
        }

        // Bounce nas bordas verticais
        if (this.y - PARTICLE_RADIUS < 0 || this.y + PARTICLE_RADIUS > canvasHeight) {
            this.vy *= -1;
            this.y = Math.max(PARTICLE_RADIUS, Math.min(canvasHeight - PARTICLE_RADIUS, this.y));
        }
    }

    /**
     * Desenha a partícula no canvas
     * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
     */
    draw(ctx) {
        // Desenhar halo/glow se a partícula está sendo controlada
        if (this.isControlled) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, PARTICLE_RADIUS * 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, PARTICLE_RADIUS * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Desenhar o emoji
        ctx.font = `${PARTICLE_RADIUS * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(EMOJIS[this.type], this.x, this.y);
    }

    /**
     * Calcula a distância para outra partícula
     * @param {Particle} other - A outra partícula
     * @returns {number} A distância euclidiana
     */
    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
