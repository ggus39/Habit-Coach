import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { parseEther } from 'viem';
import { Page } from '../types';
import { HABIT_ESCROW_ADDRESS, HABIT_ESCROW_ABI, PenaltyType } from '../contracts';

interface CreateChallengeProps {
  setPage: (page: Page) => void;
}

// 习惯类型映射
const habitTypes = {
  reading: { name: '阅读', description: '每日 30 分钟阅读', icon: 'menu_book', color: 'blue' },
  running: { name: '跑步', description: '每日 5 公里挑战', icon: 'directions_run', color: 'orange' },
  coding: { name: '编程', description: '每日 1 次 Commit', icon: 'code', color: 'emerald' },
};

const CreateChallenge: React.FC<CreateChallengeProps> = ({ setPage }) => {
  const { isConnected, address } = useAccount();

  // 表单状态
  const [selectedHabit, setSelectedHabit] = useState<keyof typeof habitTypes>('reading');
  const [stakeAmount, setStakeAmount] = useState(0.01); // ETH
  const [targetDays, setTargetDays] = useState(21);
  const [penaltyType, setPenaltyType] = useState<PenaltyType>(PenaltyType.Charity);

  // 读取用户挑战数量
  const { data: challengeCount } = useReadContract({
    address: HABIT_ESCROW_ADDRESS,
    abi: HABIT_ESCROW_ABI,
    functionName: 'challengeCount',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // 读取所有可能的挑战 (假设上限是 10 个，但用户说只能发起 3 个，我们读前 3 个或者更多以防万一)
  // 为了简单，我们只读前 5 个，因为 challengeCount 应该很小
  // 使用 useReadContracts 批量读取会更优雅，但这里复用 ChallengeList 的分开读取逻辑简单直接
  const { data: challenge0 } = useReadContract({
    address: HABIT_ESCROW_ADDRESS,
    abi: HABIT_ESCROW_ABI,
    functionName: 'getChallenge',
    args: address && challengeCount && challengeCount > 0n ? [address, 0n] : undefined,
    query: { enabled: !!address && !!challengeCount && challengeCount > 0n },
  });

  const { data: challenge1 } = useReadContract({
    address: HABIT_ESCROW_ADDRESS,
    abi: HABIT_ESCROW_ABI,
    functionName: 'getChallenge',
    args: address && challengeCount && challengeCount > 1n ? [address, 1n] : undefined,
    query: { enabled: !!address && !!challengeCount && challengeCount > 1n },
  });

  const { data: challenge2 } = useReadContract({
    address: HABIT_ESCROW_ADDRESS,
    abi: HABIT_ESCROW_ABI,
    functionName: 'getChallenge',
    args: address && challengeCount && challengeCount > 2n ? [address, 2n] : undefined,
    query: { enabled: !!address && !!challengeCount && challengeCount > 2n },
  });

  // 获取当前所有 Active 的挑战描述
  const [activeHabitKeys, setActiveHabitKeys] = useState<string[]>([]);

  React.useEffect(() => {
    const keys: string[] = [];
    // Helper to check challenge
    const check = (c: any) => {
      if (c && c.status === 0) { // 0 = Active
        // 匹配 habitTypes
        if (c.habitDescription.includes('阅读')) keys.push('reading');
        if (c.habitDescription.includes('跑步')) keys.push('running');
        if (c.habitDescription.includes('编程')) keys.push('coding');
      }
    };
    check(challenge0);
    check(challenge1);
    check(challenge2);
    setActiveHabitKeys(keys);
  }, [challenge0, challenge1, challenge2]);

  // 合约写入
  const { data: hash, isPending, writeContract, error } = useWriteContract();

  // 等待交易确认
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // 计算预估奖励 (仅作前端展示近似值，实际以链上为准)
  // 公式: 100 * (stake / 0.01) * (days / 7)
  const estimatedReward = Math.floor(100 * (stakeAmount / 0.01) * (targetDays / 7));

  // 处理创建挑战
  const handleCreateChallenge = async () => {
    if (!isConnected) {
      alert('请先连接钱包');
      return;
    }

    if (activeHabitKeys.includes(selectedHabit)) {
      alert('该类型的挑战正在进行中，请先完成后再开启新挑战');
      return;
    }

    const habitDescription = `${habitTypes[selectedHabit].name} - ${habitTypes[selectedHabit].description}`;

    writeContract({
      address: HABIT_ESCROW_ADDRESS,
      abi: HABIT_ESCROW_ABI,
      functionName: 'createChallenge',
      args: [
        BigInt(targetDays),
        penaltyType,
        habitDescription,
      ],
      value: parseEther(stakeAmount.toString()),
      chain: sepolia,
      account: address,
      // 手动设置 Gas Limit 避免 "transaction gas limit too high" 错误
      // 某些钱包或 RPC 会估算出一个过高的值 (如 2100万) 导致超过区块上限
      gas: BigInt(500000),
    });
  };

  // 交易成功后跳转
  if (isSuccess) {
    setTimeout(() => setPage(Page.CHALLENGE_LIST), 2000);
  }

  return (
    <div className="layout-container flex h-full grow flex-col">
      <div className="px-4 md:px-10 lg:px-20 xl:px-48 flex flex-1 justify-center py-12">
        <div className="layout-content-container flex flex-col w-full max-w-[1100px] flex-1">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Left Sidebar Steps */}
            <div className="hidden lg:flex flex-col w-64 shrink-0 pt-4">
              <div className="mb-12">
                <h1 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight mb-2">开启新的习惯挑战</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">设定目标，质押资金，赢得自我</p>
              </div>
              <div className="flex flex-col gap-8 relative">
                {[
                  { step: 1, title: '习惯选择', desc: '选择你想养成的习惯' },
                  { step: 2, title: '目标设定', desc: '设定挑战天数' },
                  { step: 3, title: '质押金额', desc: '承诺你的决心' },
                  { step: 4, title: '失败去向', desc: '如果未完成...' },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-4">
                    <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-md shadow-primary/20">
                      {item.step}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-slate-400">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 bg-sky-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-sky-100 dark:border-slate-700">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-2xl font-variation-fill">lightbulb</span>
                  <div>
                    <h4 className="text-primary font-bold mb-1">小贴士</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      研究表明，当有真金白银作为赌注时，习惯养成的成功率会提高 3 倍。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="flex-1 flex flex-col gap-6">
              {/* 习惯选择 */}
              <section id="step-habit" className="bg-white dark:bg-surface-dark rounded-2xl p-8 shadow-soft border border-slate-100 dark:border-slate-800">
                <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-8">选择你想养成的习惯</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Object.entries(habitTypes).map(([key, habit]) => {
                    const isActive = activeHabitKeys.includes(key);
                    return (
                      <div
                        key={key}
                        onClick={() => !isActive && setSelectedHabit(key as keyof typeof habitTypes)}
                        className={`group cursor-pointer rounded-2xl p-6 transition-all border-2 relative 
                        ${isActive ? 'opacity-50 cursor-not-allowed bg-slate-100 border-transparent grayscale' :
                            selectedHabit === key ? 'bg-slate-50/50 border-primary card-selected-icon' : 'bg-slate-50/50 border-transparent hover:border-slate-200'}`}
                      >
                        {isActive && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 bg-slate-200 text-slate-500 text-[10px] rounded font-bold">
                            进行中
                          </div>
                        )}

                        <div className={`mb-4 aspect-square w-full overflow-hidden rounded-xl bg-${habit.color}-100/50 flex items-center justify-center`}>
                          <span className={`material-symbols-outlined text-4xl text-${habit.color}-500`}>{habit.icon}</span>
                        </div>
                        <h4 className="mb-1 text-base font-bold text-slate-900">{habit.name}</h4>
                        <p className="text-xs text-slate-500">{habit.description}</p>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* 目标设定 */}
              <section id="step-goal" className="bg-white dark:bg-surface-dark rounded-2xl p-8 shadow-soft border border-slate-100 dark:border-slate-800">
                <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-8">设定挑战目标</h3>
                <div className="flex flex-col gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">目标天数</label>
                    <div className="relative">
                      <input
                        className="block w-full rounded-xl border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-3 text-slate-900 dark:text-white focus:border-primary focus:ring-primary text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        type="number"
                        value={targetDays}
                        onChange={(e) => setTargetDays(Number(e.target.value))}
                        min={7} // 合约限制最少7天
                        max={365}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <span className="text-slate-400 text-sm">天</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 ml-1">最少 7 天。坚持越久，奖励越多。</p>
                  </div>
                </div>
              </section>

              {/* 质押金额 */}
              <section id="step-stake" className="bg-white dark:bg-surface-dark rounded-2xl p-8 shadow-soft border border-slate-100 dark:border-slate-800">
                <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-8">承诺金额 (Staking)</h3>
                <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl p-8">
                  <div className="flex justify-between items-end mb-8">
                    <span className="text-sm text-slate-500 font-medium">质押金额</span>
                    <div className="text-right">
                      <span className="text-3xl font-display font-black text-primary">{stakeAmount}</span>
                      <span className="text-base font-bold text-slate-900 ml-1">ETH</span>
                    </div>
                  </div>
                  <div className="mb-10">
                    <input
                      className="w-full"
                      max="1"
                      min="0.01"
                      step="0.01"
                      type="range"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(Number(e.target.value))}
                    />
                    <div className="flex justify-between mt-3 text-[10px] font-medium text-slate-400">
                      <span>0.01 ETH</span>
                      <span>1 ETH</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">锁定期</span>
                      <span className="text-sm font-bold text-slate-900">{targetDays} 天</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">预计奖励</span>
                      <span className="text-sm font-bold text-emerald-500">≈ {estimatedReward.toLocaleString()} STRICT</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 惩罚类型选择 */}
              <section id="step-penalty" className="bg-white dark:bg-surface-dark rounded-2xl p-8 shadow-soft border border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-8">如果失败，资金去向?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { type: PenaltyType.Charity, icon: 'volunteer_activism', color: 'pink', title: '捐赠慈善', desc: '资金将自动捐赠给以太坊基金会或公共物品。' },
                    { type: PenaltyType.Burn, icon: 'local_fire_department', color: 'orange', title: '销毁 (Burn)', desc: '资金将被永久销毁，发送至黑洞地址。' },
                    { type: PenaltyType.Dev, icon: 'emoji_events', color: 'purple', title: '项目方', desc: '支持项目持续发展。' },
                  ].map((option) => (
                    <label key={option.type} className="cursor-pointer group">
                      <input
                        checked={penaltyType === option.type}
                        onChange={() => setPenaltyType(option.type)}
                        className="peer sr-only"
                        name="penalty"
                        type="radio"
                      />
                      <div className="h-full rounded-2xl border-2 border-slate-100 bg-white p-5 transition-all peer-checked:border-primary peer-checked:bg-sky-50/30">
                        <div className="flex justify-between items-start mb-4">
                          <div className={`size-9 rounded-full bg-${option.color}-50 text-${option.color}-500 flex items-center justify-center`}>
                            <span className="material-symbols-outlined text-xl">{option.icon}</span>
                          </div>
                          <div className="text-primary opacity-0 peer-checked:opacity-100">
                            <span className="material-symbols-outlined text-xl font-variation-fill">check_circle</span>
                          </div>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 mb-2">{option.title}</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              {/* 提交按钮 */}
              <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between gap-6 mb-12">
                <div className="flex flex-col pl-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">总计质押</span>
                  <span className="text-2xl font-black text-slate-900">{stakeAmount} ETH</span>
                </div>

                {error && (
                  <div className="text-red-500 text-sm">{error.message}</div>
                )}

                {isSuccess ? (
                  <div className="flex-1 bg-emerald-500 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-xl">check_circle</span>
                    挑战创建成功！跳转中...
                  </div>
                ) : (
                  <button
                    onClick={handleCreateChallenge}
                    disabled={isPending || isConfirming || !isConnected}
                    className="flex-1 bg-primary hover:bg-sky-500 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                    {!isConnected ? '请先连接钱包' : isPending ? '等待确认...' : isConfirming ? '交易确认中...' : '批准并开启挑战'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateChallenge;