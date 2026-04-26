# 🦜 Squad Parrots Runner - Web3 Documentation

Este projeto foi profissionalizado para suportar integração completa com a **Monad Testnet**. Abaixo estão as instruções para gerenciar os contratos e a infraestrutura.

## 🛠️ Requisitos
- Node.js v16+
- Carteira MetaMask com rede Monad Testnet configurada.

## 📁 Estrutura do Projeto
- `/contracts`: Contém o código Solidity (`ScoreBoard.sol`).
- `/scripts`: Scripts de automação (Deploy e Admin).
- `web3.js`: Lógica de integração frontend (Ethers.js).
- `.env`: Configurações de ambiente (Chaves e Endereços).

## 🚀 Como fazer o Deploy de um Novo Contrato
Se você precisar trocar o contrato oficial, siga estes passos:
1. Verifique se o seu `.env` tem a `DEPLOYER_PRIVATE_KEY` com saldo em MON.
2. Execute o comando:
   ```bash
   node scripts/deploy.js
   ```
3. O script irá compilar o contrato, fazer o deploy e atualizar o endereço no arquivo `.env` automaticamente.
4. **IMPORTANTE**: Copie o novo endereço exibido no terminal e atualize a variável `CONTRACT_ADDRESS` no topo do arquivo `web3.js`.

## 🛡️ Dashboard de Administração
Para gerenciar o contrato atual sem precisar de ferramentas externas:
- **Ver Status (Dono e Signer):**
  ```bash
  node scripts/admin.js status
  ```
- **Trocar o Signer (Carteira que valida os scores):**
  ```bash
  node scripts/admin.js set-signer <0x_ENDEREÇO_NOVO>
  ```

## 🔐 Segurança do Backend (Supabase)
O jogo utiliza uma **Edge Function** no Supabase para assinar os scores e evitar fraudes.
1. Certifique-se de que a função `sign-score` está implantada no projeto `zakhouunpnbierefgmoo`.
2. O segredo `SIGNER_PRIVATE_KEY` no painel do Supabase deve ser a **chave privada** correspondente ao `SIGNER_ADDRESS` configurado no contrato inteligente.

## 🎮 Mapeamento de Personagens
No Hall of Fame, os personagens são exibidos pelos nomes:
- 0: CHOG
- 1: EMO
- 2: MONCOCK
- 3: BOB
- 4: MONIGGA

---
*Squad Parrots to the moon! 🚀*
