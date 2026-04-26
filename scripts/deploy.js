const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const solc = require('solc');
require('dotenv').config();

async function main() {
    console.log("🚀 Starting Deployment to Monad Testnet...");

    const rpcUrl = process.env.MONAD_RPC || 'https://testnet-rpc.monad.xyz';
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    const signerAddress = process.env.SIGNER_ADDRESS;

    if (!privateKey || !signerAddress) {
        console.error("❌ Missing environment variables in .env (DEPLOYER_PRIVATE_KEY or SIGNER_ADDRESS)");
        return;
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`📡 Deployer Address: ${wallet.address}`);
    const balance = await wallet.getBalance();
    console.log(`💰 Balance: ${ethers.utils.formatEther(balance)} MON`);

    if (balance.eq(0)) {
        console.error("❌ Insufficient MON for deployment!");
        return;
    }

    // Compile Contract
    console.log("🛠  Compiling SquadRunnerBoard.sol...");
    const contractPath = path.join(__dirname, '../contracts/ScoreBoard.sol');
    const source = fs.readFileSync(contractPath, 'utf8');

    const input = {
        language: 'Solidity',
        sources: { 'ScoreBoard.sol': { content: source } },
        settings: { outputSelection: { '*': { '*': ['*'] } } }
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    
    if (output.errors) {
        output.errors.forEach(err => console.error(err.formattedMessage));
        if (output.errors.some(err => err.severity === 'error')) return;
    }

    const contractData = output.contracts['ScoreBoard.sol']['SquadRunnerBoard'];
    const abi = contractData.abi;
    const bytecode = contractData.evm.bytecode.object;

    // Deploy
    console.log("⏳ Sending Deployment Transaction...");
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy(signerAddress);

    console.log(`🔗 Transaction Hash: ${contract.deployTransaction.hash}`);
    await contract.deployed();

    console.log(`✅ Contract Deployed Successfully!`);
    console.log(`📍 Address: ${contract.address}`);

    // Update .env (Simple append/replace logic)
    let envContent = fs.readFileSync('.env', 'utf8');
    if (envContent.includes('CONTRACT_ADDRESS=')) {
        envContent = envContent.replace(/CONTRACT_ADDRESS=0x[a-fA-F0-9]{40}/, `CONTRACT_ADDRESS=${contract.address}`);
    } else {
        envContent += `\nCONTRACT_ADDRESS=${contract.address}`;
    }
    fs.writeFileSync('.env', envContent);
    console.log("📝 Updated .env with new contract address.");

    // Help for web3.js
    console.log(`\n👉 ATENÇÃO: Atualize o CONTRACT_ADDRESS no seu arquivo 'web3.js' para: ${contract.address}`);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
