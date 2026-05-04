# Pedra, Papel e Tesoura - Arena Ao Vivo

Arena ao vivo de Pedra, Papel e Tesoura com simulacao autoritativa no servidor, chat e apostas com pontos virtuais.

## 🎮 Caracteristicas

- **Arena ao vivo sincronizada** para todos os clientes
- **Simulacao autoritativa** no servidor com snapshots
- **Chat em tempo real** com rate limit basico
- **Apostas com pontos virtuais** por rodada
- **Tela de vitoria** com modal
- **Contador em tempo real** de cada tipo
- **Design responsivo** para desktop, tablet e mobile

## 📋 Estrutura do Projeto

```
pedra papel tesoura/
├── web/                    # Frontend (HTML, CSS, JS)
│   ├── index.html
│   ├── css/
│   └── js/
├── server/                 # Backend WebSocket (Node.js)
│   ├── index.js
│   ├── package.json
│   └── README.md
├── .gitignore
└── README.md
```

## 🚀 Como Usar

### Rodar localmente
1. Acesse a pasta `server`
2. Instale as dependencias: `npm install`
3. Inicie o servidor: `npm start`
4. Abra http://localhost:8080

O servidor serve o frontend em `/` e o WebSocket em `/ws`.

## 🎯 Regras do Jogo

- **Pedra (🪨)** vence **Tesoura (✂️)**
- **Tesoura (✂️)** vence **Papel (📄)**
- **Papel (📄)** vence **Pedra (🪨)**

Quando dois emojis diferentes colidem, o perdedor se transforma no tipo vencedor!

## 🔧 Tecnologias

- **HTML5** - Estrutura
- **CSS3** - Estilos e animacoes
- **JavaScript (ES6+)** - Logica e fisica
- **Node.js** - Servidor e WebSocket
- **Canvas 2D API** - Renderizacao

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

### Sincronizacao Ao Vivo

- **Simulacao autoritativa** no servidor
- **Snapshots** enviados aos clientes
- **Interpolacao** no cliente para suavidade

## ⚙️ Parametros Configuraveis

Edite `web/js/constants.js` para alterar:

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

