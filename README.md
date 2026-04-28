# Pedra, Papel e Tesoura - Simulação Visual Automática

Uma aplicação web interativa que simula uma batalha automática entre emojis de Pedra, Papel e Tesoura. Os emojis se movem aleatoriamente pela tela, colidem fisicamente e se transformam de acordo com as regras do jogo.

## 🎮 Características

- **30 emojis de cada tipo** (🪨 Pedra, 📄 Papel, ✂️ Tesoura) se movendo aleatoriamente
- **Colisões realistas** com física de impulso e bounce nas bordas
- **Transformações automáticas** quando um tipo colide com outro
- **Colisões entre iguais** - Emojis do mesmo tipo também colidem e se repelem
- **Tela de vitória** - Modal elegante e animado quando um tipo vencer
- **Controle com mouse** - Clique e arraste um emoji para controlá-lo manualmente
- **Contador em tempo real** de cada tipo
- **Detector de vencedor** quando um tipo domina a tela
- **Controles interativos** para pausar e reiniciar
- **Design responsivo** que funciona em qualquer tamanho de tela
- **Performance otimizada** com Canvas 2D

## 📋 Estrutura do Projeto

```
pedra papel tesoura/
├── index.html              # Arquivo principal HTML
├── css/
│   └── style.css          # Estilos da aplicação
├── js/
│   ├── constants.js       # Constantes globais
│   ├── particle.js        # Classe Particle
│   ├── game.js            # Classe Game (lógica principal)
│   ├── input-manager.js   # Gerenciador de entrada do mouse
│   └── main.js            # Inicialização e eventos
├── .gitignore             # Arquivos a ignorar no git
└── README.md              # Este arquivo
```

## 🚀 Como Usar

1. Abra `index.html` em um navegador web moderno (Chrome, Firefox, Edge, Safari)
2. Veja os emojis se movendo aleatoriamente
3. Observe as transformações quando eles colidem
4. Aguarde até um tipo vencer e dominar toda a tela

### Controles

- **🔄 Reiniciar** - Recomeça a simulação com 30 de cada tipo
- **⏸️ Pausar** - Pausa/Retoma a simulação
- **Mouse** - Clique e arraste um emoji para controlá-lo com o mouse
  - Posicione o mouse sobre um emoji (o cursor muda para "grab")
  - Clique e segure para selecionar
  - Arraste rapidamente para aumentar a força do arremesso
  - **Solte para arremessar** - O emoji sai com a velocidade baseada no seu movimento! 🎯
  - Um halo dourado indica que o emoji está sendo controlado
  - Emojis controlados não colidem com outros emojis (até serem soltos)
  - A **direção e velocidade realistas** dependem de como você move o mouse

### Tela de Vitória

Quando um tipo de emoji domina toda a tela:

- ✨ Uma tela de vitória elegante com animações aparece
- 🎉 O emoji vencedor é exibido em grande tamanho
- ⏸️ O jogo pausa automaticamente
- 🔄 Clique em **"Jogar Novamente"** para reiniciar

## 🎯 Regras do Jogo

- **Pedra (🪨)** vence **Tesoura (✂️)**
- **Tesoura (✂️)** vence **Papel (📄)**
- **Papel (📄)** vence **Pedra (🪨)**

Quando dois emojis diferentes colidem, o perdedor se transforma no tipo vencedor!

## 🔧 Tecnologias

- **HTML5** - Estrutura
- **CSS3** - Estilos e animações
- **JavaScript (ES6+)** - Lógica e física
- **Canvas 2D API** - Renderização

## 📐 Conceitos Implementados

### Physics (Física)

- Detecção de colisão com cálculo de distância euclidiana
- Impulso realista: troca de velocidades na direção da colisão
- **Colisões universais:** Todas as partículas colidem (mesmo tipo ou não)
- Transformação apenas entre tipos diferentes
- Bounce elástico nas bordas
- Normalização de vetores para cálculos precisos

### Game Logic (Lógica do Jogo)

- Aplicação das regras de Pedra-Papel-Tesoura
- Transformação de partículas apenas entre tipos diferentes
- Contagem de tipos em tempo real
- Detecção de vencedor

### Code Organization (Organização de Código)

- **Separação de responsabilidades**: HTML, CSS e JS em arquivos diferentes
- **Modularização**: Cada classe em seu próprio arquivo
- **Constantes centralizadas**: Fácil ajuste de parâmetros
- **Documentação com JSDoc**: Comentários estruturados

### Input Management (Gerenciamento de Entrada)

- **Detecção de clique**: Busca por partícula sob o cursor
- **Raio de seleção**: Detecta cliques num raio expandido para melhor UX
- **Arrastar em tempo real**: Movimento suave com o mouse
- **Feedback visual**: Halo dourado indica seleção
- **Cursor dinâmico**: Muda entre "auto", "grab" e "grabbing"
- **Limites de canvas**: Impede movimento fora da tela
- **Isolamento de colisões**: Partículas controladas não colidem

## ⚙️ Parâmetros Configuráveis

Edite `js/constants.js` para alterar:

```javascript
INITIAL_COUNT       // Quantidade inicial de cada tipo (padrão: 30)
PARTICLE_RADIUS     // Tamanho dos emojis (padrão: 15)
COLLISION_DISTANCE  // Distância para detectar colisão
DEFAULT_VELOCITY_RANGE // Velocidade máxima das partículas
```

## 🎨 Customização

### Mudar emojis

Edite o array `EMOJIS` em `js/constants.js`:

```javascript
const EMOJIS = ['🌟', '🎯', '⚡']; // Seus emojis aqui
```

## 🎨 Customização Avançada

### Mudar cores

Edite o arquivo `css/style.css`:

```css
body {
    background: linear-gradient(135deg, #sua-cor-1 0%, #sua-cor-2 100%);
}
```

## 🌐 Compatibilidade

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

## 📦 Requisitos

Nenhum! A aplicação é totalmente standalone e não requer dependências externas.

## 🌐 Deploy Online (Grátis)

Quer deixar sua aplicação online para o mundo acessar? Temos um **guia passo-a-passo completo**!

**[Guia Completo: Deploy no Vercel →](docs/DEPLOY_VERCEL.md)**

Neste guia você aprenderá:
- Como configurar Git e repositório GitHub
- Como conectar com Vercel
- Como fazer deploy automático
- Como compartilhar seu projeto
- Dicas profissionais

**Resultado:** Sua app online em minutos, totalmente grátis!

Exemplo: `https://seu-usuario.vercel.app`

## 💡 Ideias de Expansão

- [x] ✨ Tela de vitória elegante com animações
- [x] 🎯 Arremesso realista com velocidade e direção
- [ ] Adicionar som quando ocorrem colisões
- [ ] Som de vitória ao terminar
- [ ] Mostrar gráfico de evolução das populações
- [ ] Modo multiplayer com controle do usuário
- [ ] Diferentes níveis de dificuldade
- [ ] Temas de cores personalizáveis
- [ ] Exportar vídeo da simulação
- [ ] Velocidade ajustável
- [ ] Suporte a touch/toque para dispositivos móveis
- [ ] Múltiplas partículas selecionadas ao mesmo tempo (Ctrl+Clique)
- [ ] Histórico de simulações com estatísticas
- [ ] Confetti/Partículas de celebração ao vencer
- [ ] Trilha visual ao arremessar
- [ ] Indicador de força de arremesso

## 📄 Licença

Livre para uso pessoal e educacional.

## 👨‍💻 Autor

Desenvolvido como exemplo de projeto web profissional.

---

**Divirta-se observando a batalha épica entre Pedra, Papel e Tesoura!** 🎮✨
