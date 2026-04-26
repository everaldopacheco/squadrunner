const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    const rpcUrl = process.env.MONAD_RPC || 'https://testnet-rpc.monad.xyz';
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    const contractAddr = process.env.CONTRACT_ADDRESS;

    if (!privateKey || !contractAddr) {
        console.error("❌ Missing DEPLOYER_PRIVATE_KEY or CONTRACT_ADDRESS in .env");
        return;
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    const abi = [
        "function signer() view returns (address)",
        "function owner() view returns (address)",
        "function setSigner(address _signer) external",
        "function transferOwnership(address _newOwner) external",
        "function leaderboard(uint256) view returns (address player, uint32 score, uint8 charId, uint32 timestamp)"
    ];

    const contract = new ethers.Contract(contractAddr, abi, wallet);

    console.log(`\n🛡  SQUAD ADMIN DASHBOARD`);
    console.log(`══════════════════════════════`);
    console.log(`📍 Contract: ${contractAddr}`);
    
    const currentSigner = await contract.signer();
    const currentOwner = await contract.owner();

    console.log(`👤 Owner:  ${currentOwner}`);
    console.log(`🔑 Signer: ${currentSigner}`);
    console.log(`══════════════════════════════\n`);

    const command = process.argv[2];

    if (command === 'set-signer') {
        const newSigner = process.argv[3];
        if (!ethers.utils.isAddress(newSigner)) {
            console.error("❌ Invalid address");
            return;
        }
        console.log(`⏳ Updating signer to ${newSigner}...`);
        const tx = await contract.setSigner(newSigner);
        await tx.wait();
        console.log("✅ Signer updated!");
    } else if (command === 'status') {
        console.log("✅ All systems operational.");
    } else {
        console.log("Usage:");
        console.log("  node scripts/admin.js status");
        console.log("  node scripts/admin.js set-signer <address>");
    }
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
