/**
 * CLASSE INPUT MANAGER
 * Gerencia entrada de mouse para controlar partículas
 * Permite clicar e arrastar para controlar um emoji individualmente
 */

class InputManager {
    /**
     * Construtor do gerenciador de entrada
     * @param {HTMLCanvasElement} canvas - Elemento canvas
     * @param {Game} game - Instância do jogo
     */
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        
        // Estado de entrada
        this.selectedParticle = null;
        this.isMouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.prevMouseX = 0;
        this.prevMouseY = 0;
        
        // Rastreamento de velocidade
        this.lastMouseTime = 0;
        this.mouseVelocityX = 0;
        this.mouseVelocityY = 0;
        this.throwMultiplier = 0.8; // Multiplicador de força ao arremessar (0.8 = 80% da velocidade do mouse)
        
        // Configuração
        this.selectionRadius = PARTICLE_RADIUS * 2.5; // Raio para detectar clique
        
        // Bind do contexto (necessário para event listeners)
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        
        // Adicionar event listeners
        this.addEventListeners();
    }

    /**
     * Adiciona os event listeners do mouse ao canvas
     */
    addEventListeners() {
        this.canvas.addEventListener('mousedown', this.onMouseDown);
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
        this.canvas.addEventListener('mouseleave', this.onMouseLeave);
    }

    /**
     * Remove os event listeners do mouse
     */
    removeEventListeners() {
        this.canvas.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
        this.canvas.removeEventListener('mouseleave', this.onMouseLeave);
    }

    /**
     * Obtém a posição do mouse em relação ao canvas
     * @param {MouseEvent} event - Evento do mouse
     * @returns {Object} Objeto com propriedades x e y
     */
    getMousePos(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    /**
     * Encontra a partícula mais próxima ao clique
     * @param {number} x - Posição X do mouse
     * @param {number} y - Posição Y do mouse
     * @returns {Particle|null} A partícula encontrada ou null
     */
    findParticleAtPosition(x, y) {
        // Percorrer as partículas em ordem reversa (desenho de topo)
        for (let i = this.game.particles.length - 1; i >= 0; i--) {
            const particle = this.game.particles[i];
            const dx = particle.x - x;
            const dy = particle.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.selectionRadius) {
                return particle;
            }
        }
        return null;
    }

    /**
     * Handler para mousedown
     * @param {MouseEvent} event - Evento do mouse
     */
    onMouseDown(event) {
        const pos = this.getMousePos(event);
        const particle = this.findParticleAtPosition(pos.x, pos.y);

        if (particle) {
            this.selectedParticle = particle;
            this.isMouseDown = true;
            this.mouseX = pos.x;
            this.mouseY = pos.y;
            this.prevMouseX = pos.x;
            this.prevMouseY = pos.y;
            this.lastMouseTime = performance.now();
            
            // Marcar partícula como controlada
            particle.isControlled = true;
            
            // Alterar cursor
            this.canvas.style.cursor = 'grabbing';
            
            // Prevenir comportamento padrão
            event.preventDefault();
        }
    }

    /**
     * Handler para mousemove
     * @param {MouseEvent} event - Evento do mouse
     */
    onMouseMove(event) {
        const pos = this.getMousePos(event);
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastMouseTime;
        
        // Se uma partícula está selecionada, mover com o mouse e calcular velocidade
        if (this.selectedParticle && this.isMouseDown) {
            // Calcular velocidade do mouse (pixels/ms)
            if (deltaTime > 0) {
                this.mouseVelocityX = (pos.x - this.prevMouseX) / deltaTime;
                this.mouseVelocityY = (pos.y - this.prevMouseY) / deltaTime;
            }
            
            // Atualizar posição anterior
            this.prevMouseX = this.mouseX;
            this.prevMouseY = this.mouseY;
            this.lastMouseTime = currentTime;
            this.mouseX = pos.x;
            this.mouseY = pos.y;
            
            // Mover partícula para seguir o mouse
            this.selectedParticle.x = this.mouseX;
            this.selectedParticle.y = this.mouseY;
            
            // Limitar a posição dentro do canvas
            const radius = PARTICLE_RADIUS;
            this.selectedParticle.x = Math.max(radius, Math.min(this.canvas.width - radius, this.selectedParticle.x));
            this.selectedParticle.y = Math.max(radius, Math.min(this.canvas.height - radius, this.selectedParticle.y));
        } else {
            // Atualizar posição do mouse e velocidade mesmo sem seleção
            this.prevMouseX = this.mouseX;
            this.prevMouseY = this.mouseY;
            this.lastMouseTime = currentTime;
            this.mouseX = pos.x;
            this.mouseY = pos.y;
            
            // Alterar cursor se estiver sobre uma partícula
            const particle = this.findParticleAtPosition(pos.x, pos.y);
            this.canvas.style.cursor = particle ? 'grab' : 'auto';
        }
    }

    /**
     * Handler para mouseup
     * Aplica velocidade baseada no movimento do mouse ao arremessar
     */
    onMouseUp() {
        if (this.selectedParticle) {
            // Aplicar velocidade baseada no movimento do mouse durante o arrasto
            // Multiplicador dá mais "força" ao arremesso
            this.selectedParticle.vx = this.mouseVelocityX * this.throwMultiplier;
            this.selectedParticle.vy = this.mouseVelocityY * this.throwMultiplier;
            
            this.selectedParticle.isControlled = false;
        }

        this.selectedParticle = null;
        this.isMouseDown = false;
        this.mouseVelocityX = 0;
        this.mouseVelocityY = 0;
        this.canvas.style.cursor = 'auto';
    }

    /**
     * Handler para mouseleave
     * Aplica velocidade e liberta o emoji
     */
    onMouseLeave() {
        if (this.selectedParticle) {
            // Aplicar velocidade ao sair com o mouse
            this.selectedParticle.vx = this.mouseVelocityX * this.throwMultiplier;
            this.selectedParticle.vy = this.mouseVelocityY * this.throwMultiplier;
            this.selectedParticle.isControlled = false;
        }

        this.selectedParticle = null;
        this.isMouseDown = false;
        this.mouseVelocityX = 0;
        this.mouseVelocityY = 0;
        this.canvas.style.cursor = 'auto';
    }

    /**
     * Obtém a partícula selecionada
     * @returns {Particle|null}
     */
    getSelectedParticle() {
        return this.selectedParticle;
    }

    /**
     * Deseleciona a partícula atual
     */
    deselectParticle() {
        if (this.selectedParticle) {
            this.selectedParticle.isControlled = false;
        }
        this.selectedParticle = null;
        this.isMouseDown = false;
        this.canvas.style.cursor = 'auto';
    }

    /**
     * Define o multiplicador de força ao arremessar
     * @param {number} multiplier - Valor entre 0.1 e 2.0 (recomendado 0.5 a 1.5)
     */
    setThrowMultiplier(multiplier) {
        this.throwMultiplier = Math.max(0.1, Math.min(2.0, multiplier));
    }

    /**
     * Obtém o multiplicador de força atual
     * @returns {number} Multiplicador de força
     */
    getThrowMultiplier() {
        return this.throwMultiplier;
    }
}
