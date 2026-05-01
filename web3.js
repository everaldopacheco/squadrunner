// ─── Web3 Configuration ──────────────────────────────────────────────────
const CONTRACT_ADDRESS = '0xB61F6dfD38C09A4eE430a183343adcEE9e4c9683'; // NEW RESET CONTRACT
const CHAIN_ID = 10143; // Monad Testnet
const ABI = [
  "function submitScore(uint32 score, uint8 charId, bytes calldata signature) external",
  "function getLeaderboard() external view returns (tuple(address player, uint32 score, uint8 charId, uint32 timestamp)[] memory)",
  "function bestScore(address) view returns (uint32)"
];

let provider, signer, contract;
let userAddress = null;

// ─── Web3 Initialization ──────────────────────────────────────────────
async function initWeb3() {
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);

    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length > 0) {
        userAddress = accounts[0];
        updateWalletUI();
      } else {
        userAddress = null;
        updateWalletUI();
      }
    });

    window.ethereum.on('chainChanged', () => window.location.reload());

    // Wire up listeners
    const connBtn = document.getElementById('connect-wallet-btn');
    const discBtn = document.getElementById('disconnect-wallet-btn');
    const saveYesBtn = document.getElementById('save-yes-btn');
    const saveNoBtn = document.getElementById('save-no-btn');
  
    if (connBtn) connBtn.addEventListener('click', connectWallet);
    if (discBtn) discBtn.addEventListener('click', disconnectWallet);
    if (saveYesBtn) saveYesBtn.addEventListener('click', submitScoreToChain);
    
    if (saveNoBtn) {
      saveNoBtn.addEventListener('click', () => {
        const modal = document.getElementById('save-score-modal');
        if (modal) modal.classList.add('hidden');
      });
    }

    const closeBtn = document.getElementById('close-modal-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const modal = document.getElementById('save-score-modal');
        if (modal) modal.classList.add('hidden');
      });
    }

    try {
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        userAddress = accounts[0];
        signer = provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        updateWalletUI();
      }
    } catch (e) {
      console.log("Auto-connect check skipped:", e.message);
    }
  }
}

function disconnectWallet() {
  userAddress = null;
  signer = null;
  contract = null;
  updateWalletUI();
  alert("Wallet Disconnected.");
}

function updateWalletUI() {
  const connBtn = document.getElementById('connect-wallet-btn');
  const info = document.getElementById('wallet-info');
  const addrLabel = document.getElementById('wallet-address');

  if (userAddress) {
    if (connBtn) connBtn.classList.add('hidden');
    if (info) info.classList.remove('hidden');
    if (addrLabel) addrLabel.innerText = userAddress.slice(0, 6) + '...' + userAddress.slice(-4);
  } else {
    if (connBtn) connBtn.classList.remove('hidden');
    if (info) info.classList.add('hidden');
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    alert('Metamask not detected!');
    return;
  }
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const tempAddr = accounts[0];

    // 1. Force Network Switch
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x279F' }], // 10143
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x279F',
            chainName: 'Monad Testnet',
            nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
            rpcUrls: ['https://testnet-rpc.monad.xyz'],
            blockExplorerUrls: ['https://testnet.monadexplorer.com']
          }]
        });
      }
    }

    // 2. Challenge Signature
    const challengeMessage = `Welcome to Squad Parrots Runner!\n\nSign this to verify your wallet session.\nTimestamp: ${Date.now()}`;
    const tempProvider = new ethers.providers.Web3Provider(window.ethereum);
    const tempSigner = tempProvider.getSigner();
    
    const signature = await tempSigner.signMessage(challengeMessage);
    console.log("Authentication successful:", signature);

    // 3. Finalize
    userAddress = tempAddr;
    provider = tempProvider;
    signer = tempSigner;
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    updateWalletUI();
    fetchLeaderboard();
    
    alert("Wallet Verified & Connected!");
  } catch (err) {
    console.error(err);
    alert('Connection Failed: ' + (err.message || err));
  }
}

async function submitScoreToChain() {
  if (!userAddress || !contract) {
    alert("Please connect and verify your wallet first!");
    return;
  }

  const yesBtn = document.getElementById('save-yes-btn');
  const modal = document.getElementById('save-score-modal');
  const originalText = yesBtn.innerText;
  
  try {
    yesBtn.innerText = "SIGNING...";
    yesBtn.disabled = true;

    const data = typeof window.getSquadData === 'function' ? window.getSquadData() : { score: 0, charId: 0 };
    const scoreVal = Math.floor(Number(data.score) || 0);
    const charIdVal = Math.floor(Number(data.charId) || 0);

    // Request signature from Supabase Backend
    const resp = await fetch('https://zakhouunpnbierefgmoo.supabase.co/functions/v1/sign-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player: userAddress, score: scoreVal, charId: charIdVal })
    });

    const result = await resp.json();
    if (result.error) throw new Error("Backend Error: " + result.error);
    
    const backendSignature = result.signature;
    if (!backendSignature || typeof backendSignature !== 'string') {
        throw new Error("Invalid signature received from backend.");
    }

    yesBtn.innerText = "WAIT...";
    
    // Create fresh contract instance for the transaction
    const txSigner = new ethers.providers.Web3Provider(window.ethereum).getSigner();
    const liveContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, txSigner);

    const tx = await liveContract.submitScore(
      scoreVal, 
      charIdVal, 
      backendSignature.trim(), 
      { gasLimit: 500000 }
    );
    
    await tx.wait();

    // Show success in modal instead of alert
    const questionDiv = document.getElementById('modal-question');
    const successDiv = document.getElementById('modal-success');
    const txLink = document.getElementById('tx-link');
    
    if (questionDiv) questionDiv.classList.add('hidden');
    if (successDiv) successDiv.classList.remove('hidden');
    if (txLink) txLink.href = `https://testnet.monadexplorer.com/tx/${tx.hash}`;

    fetchLeaderboard();
  } catch (e) {
    console.error(e);
    alert("Save Failed: " + (e.message || "Unknown error"));
  } finally {
    yesBtn.innerText = originalText;
    yesBtn.disabled = false;
  }
}

async function fetchLeaderboard() {
  const tempProvider = new ethers.providers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
  const tempContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, tempProvider);
  try {
    const scores = await tempContract.getLeaderboard();
    renderLeaderboard(scores);
  } catch (e) {
    console.error("Leaderboard fetch failed:", e);
  }
}

function renderLeaderboard(scores) {
  const list = document.getElementById('score-list');
  if (!list) return;

  const CHAR_NAMES = [
    "PARROT TRADOOOOR", 
    "PARROT ROYAL", 
    "PARROT CHAD", 
    "PARROT JETPACK", 
    "PARROT WHALE",
    "PARROT NEON"
  ];

  list.innerHTML = '';
  // Sort by score descending
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  
  sorted.forEach((entry, idx) => {
    const li = document.createElement('li');
    li.className = 'leaderboard-entry';
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.padding = '5px 0';
    li.style.borderBottom = '1px solid rgba(255,105,180,0.2)';

    const addr = entry.player.slice(0, 6) + '...' + entry.player.slice(-4);
    const name = CHAR_NAMES[entry.charId] || "PARROT";

    li.innerHTML = `
      <span style="color: #00ff00;">#${idx + 1} ${addr} <small style="color: #ff00ff; font-size: 8px;">[${name}]</small></span>
      <span style="font-weight: bold; color: #fff;">${entry.score}</span>
    `;
    list.appendChild(li);
  });
}

// Start
initWeb3();
window.connectWallet = connectWallet;
window.submitScoreToChain = submitScoreToChain;
window.fetchLeaderboard = fetchLeaderboard;
