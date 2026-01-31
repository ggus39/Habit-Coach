/**
 * 测试脚本：在 Sepolia 测试网上创建交易记录
 * 用于填充 README 中的链上交易记录表格
 * 
 * 使用方法:
 * 1. 安装依赖: npm install ethers dotenv
 * 2. 创建 .env 文件并填写私钥: PRIVATE_KEY=your_private_key
 * 3. 运行: node scripts/test-transactions.js
 */

const { ethers } = require('ethers');
require('dotenv').config();

// 合约地址 (Kite AI Testnet)
const HABIT_ESCROW_ADDRESS = '0x6E577Db34B60fEb65c19b26a91c309B969bAA12F';
const STRICT_TOKEN_ADDRESS = '0x3f7120711c122274b9cB4d8D72A16B49e06d86f1';

// HabitEscrow ABI (仅包含需要的函数)
const HABIT_ESCROW_ABI = [
    // 创建挑战
    {
        name: 'createChallenge',
        type: 'function',
        stateMutability: 'payable',
        inputs: [
            { name: '_targetDays', type: 'uint256' },
            { name: '_penaltyType', type: 'uint8' },
            { name: '_habitDescription', type: 'string' },
        ],
        outputs: [],
    },
    // 领取奖励
    {
        name: 'claimReward',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: '_challengeId', type: 'uint256' }],
        outputs: [],
    },
    // Agent: 记录每日完成
    {
        name: 'recordDayComplete',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_user', type: 'address' },
            { name: '_challengeId', type: 'uint256' },
        ],
        outputs: [],
    },
    // Agent: 执行 Slash
    {
        name: 'slash',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_user', type: 'address' },
            { name: '_challengeId', type: 'uint256' },
        ],
        outputs: [],
    },
    // 获取挑战数量
    {
        name: 'challengeCount',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    // 获取 Agent 地址
    {
        name: 'agent',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'address' }],
    },
];

// Kite AI Testnet RPC URL
const RPC_URL = 'https://rpc-testnet.gokite.ai/';

async function main() {
    console.log('='.repeat(60));
    console.log('Strict Habit Coach - 测试交易脚本');
    console.log('='.repeat(60));

    // 检查私钥
    if (!process.env.PRIVATE_KEY) {
        console.error('错误: 请在 .env 文件中设置 PRIVATE_KEY');
        console.log('\n创建 .env 文件:');
        console.log('PRIVATE_KEY=your_private_key_here');
        process.exit(1);
    }

    // 初始化 Provider 和 Wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(HABIT_ESCROW_ADDRESS, HABIT_ESCROW_ABI, wallet);

    console.log(`\n📍 钱包地址: ${wallet.address}`);

    // 获取余额
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 ETH 余额: ${ethers.formatEther(balance)} ETH`);

    if (balance < ethers.parseEther('0.001')) {
        console.error('\n⚠️ KITE 余额不足，请先获取测试 KITE');
        console.log('Kite Faucet: https://faucet.gokite.ai/');
        process.exit(1);
    }

    // 获取当前 Agent 地址
    const agentAddress = await contract.agent();
    console.log(`🤖 Agent 地址: ${agentAddress}`);
    const isAgent = wallet.address.toLowerCase() === agentAddress.toLowerCase();
    console.log(`📋 当前钱包是否为 Agent: ${isAgent ? '是 ✅' : '否 ❌'}`);

    console.log('\n' + '-'.repeat(60));
    console.log('开始执行交易...');
    console.log('-'.repeat(60));

    const txHashes = {
        createChallenge: null,
        slash: null,
        claimReward: null,
    };

    // 1. 创建挑战
    console.log('\n📝 [1/3] 创建挑战...');
    const stakeAmount = ethers.parseEther('0.01'); // 最低质押 0.01 ETH
    const targetDays = 7; // 7 天挑战
    const penaltyType = 0; // Burn
    const habitDescription = 'Test Challenge for README Demo';

    const createTx = await contract.createChallenge(
        targetDays,
        penaltyType,
        habitDescription,
        { value: stakeAmount }
    );
    console.log(`   交易已提交: ${createTx.hash}`);

    const createReceipt = await createTx.wait();
    console.log(`   ✅ 交易确认! Block: ${createReceipt.blockNumber}`);
    txHashes.createChallenge = createTx.hash;

    // 获取挑战 ID
    const challengeCount = await contract.challengeCount(wallet.address);
    const challengeId = Number(challengeCount) - 1;
    console.log(`   🎯 挑战 ID: ${challengeId}`);

    // 2. AI Slash (仅当当前钱包是 Agent 时)
    if (isAgent) {
        console.log('\n⚡ [2/3] 执行 AI Slash...');

        // 需要先创建一个新的挑战来 Slash（因为上一个挑战我们要保留用于 claimReward）
        console.log('   创建用于 Slash 的挑战...');
        const slashTx1 = await contract.createChallenge(
            targetDays,
            penaltyType,
            'Challenge to be Slashed for Demo',
            { value: stakeAmount }
        );
        await slashTx1.wait();

        const newChallengeId = Number(await contract.challengeCount(wallet.address)) - 1;

        const slashTx = await contract.slash(wallet.address, newChallengeId);
        console.log(`   交易已提交: ${slashTx.hash}`);

        const slashReceipt = await slashTx.wait();
        console.log(`   ✅ 交易确认! Block: ${slashReceipt.blockNumber}`);
        txHashes.slash = slashTx.hash;
    } else {
        console.log('\n⚡ [2/3] 跳过 AI Slash (当前钱包不是 Agent)');
        console.log('   提示: 如果需要测试 Slash，请使用 Agent 钱包运行此脚本');
    }

    // 3. 领取奖励 (需要先完成所有天数)
    if (isAgent) {
        console.log('\n🏆 [3/3] 测试领取奖励...');

        // 创建一个新挑战用于完成
        console.log('   创建用于完成的挑战...');
        const rewardTx1 = await contract.createChallenge(
            7,
            0,
            'Challenge to Complete for Demo',
            { value: stakeAmount }
        );
        await rewardTx1.wait();

        const rewardChallengeId = Number(await contract.challengeCount(wallet.address)) - 1;

        // 模拟完成 7 天
        console.log('   模拟完成 7 天打卡...');
        for (let day = 1; day <= 7; day++) {
            const dayTx = await contract.recordDayComplete(wallet.address, rewardChallengeId);
            await dayTx.wait();
            console.log(`   Day ${day}/7 ✓`);
        }

        // 领取奖励
        console.log('   领取奖励...');
        const claimTx = await contract.claimReward(rewardChallengeId);
        console.log(`   交易已提交: ${claimTx.hash}`);

        const claimReceipt = await claimTx.wait();
        console.log(`   ✅ 交易确认! Block: ${claimReceipt.blockNumber}`);
        txHashes.claimReward = claimTx.hash;
    } else {
        console.log('\n🏆 [3/3] 跳过领取奖励 (需要 Agent 先完成打卡记录)');
    }

    // 输出结果
    console.log('\n' + '='.repeat(60));
    console.log('📊 交易结果汇总 (用于 README)');
    console.log('='.repeat(60));
    console.log('\n复制以下内容到 README.md:\n');

    console.log('| 操作 | 交易哈希 | 区块浏览器 |');
    console.log('|------|---------|-----------|');

    if (txHashes.createChallenge) {
        console.log(`| 创建挑战 | \`${txHashes.createChallenge.slice(0, 10)}...\` | [查看](https://sepolia.etherscan.io/tx/${txHashes.createChallenge}) |`);
    }
    if (txHashes.slash) {
        console.log(`| AI Slash | \`${txHashes.slash.slice(0, 10)}...\` | [查看](https://sepolia.etherscan.io/tx/${txHashes.slash}) |`);
    }
    if (txHashes.claimReward) {
        console.log(`| 领取奖励 | \`${txHashes.claimReward.slice(0, 10)}...\` | [查看](https://sepolia.etherscan.io/tx/${txHashes.claimReward}) |`);
    }

    console.log('\n✅ 完成!');
}

main().catch((error) => {
    console.error('错误:', error.message);
    process.exit(1);
});
