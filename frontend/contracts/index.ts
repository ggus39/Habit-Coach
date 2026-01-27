// HabitEscrow 合约地址 (Sepolia)
export const HABIT_ESCROW_ADDRESS = '0xba1180cC038342d9be147cfeC8490af8c44aCE44' as const;

// StrictToken 合约地址 (Sepolia)
export const STRICT_TOKEN_ADDRESS = '0xcECDE33801aDa871ABD5cd0406248B8A70a6FC32' as const;

// HabitEscrow ABI - 仅包含前端需要的函数
export const HABIT_ESCROW_ABI = [
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
    // 紧急退出
    {
        name: 'emergencyWithdraw',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: '_challengeId', type: 'uint256' }],
        outputs: [],
    },
    // 使用复活卡
    {
        name: 'useResurrection',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: '_challengeId', type: 'uint256' }],
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
    // 获取挑战详情
    {
        name: 'getChallenge',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: '_user', type: 'address' },
            { name: '_challengeId', type: 'uint256' },
        ],
        outputs: [
            {
                name: '',
                type: 'tuple',
                components: [
                    { name: 'stakeAmount', type: 'uint256' },
                    { name: 'targetDays', type: 'uint256' },
                    { name: 'completedDays', type: 'uint256' },
                    { name: 'startTime', type: 'uint256' },
                    { name: 'penaltyType', type: 'uint8' },
                    { name: 'status', type: 'uint8' },
                    { name: 'resurrectionUsed', type: 'bool' },
                    { name: 'habitDescription', type: 'string' },
                ],
            },
        ],
    },
    // 获取用户挑战数量
    {
        name: 'challengeCount',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    // 计算预估奖励
    {
        name: 'calculateReward',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: '_stakeAmount', type: 'uint256' },
            { name: '_targetDays', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
    },
    // 获取奖励池余额
    {
        name: 'getRewardPoolBalance',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
    },
    // 事件
    {
        name: 'ChallengeCreated',
        type: 'event',
        inputs: [
            { name: 'user', type: 'address', indexed: true },
            { name: 'challengeId', type: 'uint256', indexed: true },
            { name: 'stakeAmount', type: 'uint256', indexed: false },
            { name: 'targetDays', type: 'uint256', indexed: false },
            { name: 'penaltyType', type: 'uint8', indexed: false },
        ],
    },
] as const;

// StrictToken ABI - ERC20 标准接口
export const STRICT_TOKEN_ABI = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'totalSupply',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'symbol',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'string' }],
    },
    {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }],
    },
] as const;

// 惩罚类型枚举
export enum PenaltyType {
    Burn = 0,    // 销毁
    Charity = 1, // 慈善
    Dev = 2,     // 项目方
}

// 挑战状态枚举
export enum ChallengeStatus {
    Active = 0,     // 进行中
    Completed = 1,  // 已完成
    Failed = 2,     // 已失败
    Withdrawn = 3,  // 已退出
}

// 挑战数据类型
export interface Challenge {
    stakeAmount: bigint;
    targetDays: bigint;
    completedDays: bigint;
    startTime: bigint;
    penaltyType: PenaltyType;
    status: ChallengeStatus;
    resurrectionUsed: boolean;
    habitDescription: string;
}
