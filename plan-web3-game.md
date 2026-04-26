# MONAD RUNNER — Plano de Implementação Web3
### Prompt de Contexto Completo por Etapas

---

## 🧠 CONTEXTO GERAL DO PROJETO

**Você é um desenvolvedor Full Stack especialista em blockchain e contratos inteligentes (Solidity, EVM, ethers.js).**

O projeto base é um jogo web chamado **Squad Runner** — um runner 2D com 5 personagens jogáveis, inimigos, coleta de moedas, boost e trilha sonora procedural. O jogo já está desenvolvido e dividido em 3 arquivos:

- `squad_runner.html` — estrutura HTML com seleção de personagem, canvas do jogo e leaderboard
- `style.css` — toda a estilização visual
- `game.js` — toda a lógica do jogo (física, sprites, obstáculos, música, colisão)

**Objetivo:** Transformar esse jogo em um **Web3 Game** rodando na **Monad Testnet (chainId: 10143)**, onde:

1. O usuário precisa **conectar sua carteira** (MetaMask ou outra compatível com EVM) para jogar
2. Ao final da partida, o usuário pode **salvar seu score on-chain** pagando apenas o gas
3. Existe um **leaderboard global** armazenado no contrato inteligente
4. Um **backend leve** assina os scores para prevenir trapaças

**Rede alvo:** Monad Testnet
- Chain ID: `10143` (hex: `0x279F`)
- RPC: `https://testnet-rpc.monad.xyz`
- Explorer: `https://testnet.monadexplorer.com`
- Token nativo: MON