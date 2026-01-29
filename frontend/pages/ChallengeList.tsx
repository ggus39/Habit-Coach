import React, { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { Page } from '../types';
import {
  HABIT_ESCROW_ADDRESS,
  HABIT_ESCROW_ABI,
  Challenge,
  ChallengeStatus
} from '../contracts';

interface ChallengeListProps {
  setPage: (page: Page) => void;
}

// 状态标签颜色映射
const statusConfig = {
  [ChallengeStatus.Active]: { label: '进行中', bgClass: 'bg-emerald-50', textClass: 'text-emerald-600' },
  [ChallengeStatus.Completed]: { label: '已完成', bgClass: 'bg-blue-50', textClass: 'text-blue-600' },
  [ChallengeStatus.Failed]: { label: '已失败', bgClass: 'bg-pink-50', textClass: 'text-pink-600' },
  [ChallengeStatus.Withdrawn]: { label: '已退出', bgClass: 'bg-slate-100', textClass: 'text-slate-500' },
};

// 习惯图标映射
const getHabitIcon = (description: string) => {
  if (description.includes('阅读')) return { icon: 'menu_book', color: 'blue' };
  if (description.includes('跑步')) return { icon: 'directions_run', color: 'orange' };
  if (description.includes('编程')) return { icon: 'code', color: 'purple' };
  return { icon: 'trending_up', color: 'emerald' };
};

const ChallengeList: React.FC<ChallengeListProps> = ({ setPage }) => {
  const { address, isConnected } = useAccount();
  const [challenges, setChallenges] = useState<(Challenge & { id: number })[]>([]);

  // 读取用户挑战数量
  const { data: challengeCount } = useReadContract({
    address: HABIT_ESCROW_ADDRESS,
    abi: HABIT_ESCROW_ABI,
    functionName: 'challengeCount',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // 读取每个挑战的详情
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

  // 组合挑战数据
  useEffect(() => {
    console.log('Challenge 0:', challenge0);
    console.log('Challenge 1:', challenge1);
    console.log('Challenge 2:', challenge2);

    const allChallenges: (Challenge & { id: number })[] = [];
    if (challenge0) allChallenges.push({ ...(challenge0 as unknown as Challenge), id: 0 });
    if (challenge1) allChallenges.push({ ...(challenge1 as unknown as Challenge), id: 1 });
    if (challenge2) allChallenges.push({ ...(challenge2 as unknown as Challenge), id: 2 });

    console.log('All Challenges:', allChallenges);
    setChallenges(allChallenges);
  }, [challenge0, challenge1, challenge2]);

  // 活跃挑战
  const activeChallenges = challenges.filter(c => c.status === ChallengeStatus.Active);
  // 已完成/失败挑战
  const completedChallenges = challenges.filter(c => c.status !== ChallengeStatus.Active);

  // 计算进度百分比
  const getProgress = (challenge: Challenge) => {
    if (challenge.targetDays === 0n) return 0;
    return Number(challenge.completedDays * 100n / challenge.targetDays);
  };

  // 格式化日期
  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString('zh-CN');
  };

  return (
    <main className="max-w-7xl mx-auto w-full px-6 py-10 lg:px-10 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 mb-2">我的挑战项目</h1>
          <p className="text-slate-500">追踪你的习惯进度，管理你的 Web3 资产质押</p>
        </div>
        <button onClick={() => setPage(Page.CREATE_CHALLENGE)} className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-sky-500 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-primary/30 group">
          <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
          开启新挑战
        </button>
      </div>

      {!isConnected ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">account_balance_wallet</span>
          <h3 className="text-xl font-bold text-slate-700 mb-2">请先连接钱包</h3>
          <p className="text-slate-400">连接钱包后即可查看你的挑战列表</p>
        </div>
      ) : challenges.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">emoji_events</span>
          <h3 className="text-xl font-bold text-slate-700 mb-2">还没有挑战</h3>
          <p className="text-slate-400 mb-6">开启你的第一个习惯挑战，用真金白银激励自己！</p>
          <button onClick={() => setPage(Page.CREATE_CHALLENGE)} className="bg-primary hover:bg-sky-500 text-white font-bold py-3 px-6 rounded-xl transition-all">
            开启新挑战
          </button>
        </div>
      ) : (
        <>
          {/* 进行中的挑战 */}
          {activeChallenges.length > 0 && (
            <section className="mb-16">
              <div className="flex items-center gap-2 mb-6">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-lg font-bold text-slate-800">正在进行中 ({activeChallenges.length})</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {activeChallenges.map((challenge) => {
                  const habitInfo = getHabitIcon(challenge.habitDescription);
                  const progress = getProgress(challenge);
                  return (
                    <div key={challenge.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`size-12 rounded-2xl bg-${habitInfo.color}-50 text-${habitInfo.color}-500 flex items-center justify-center`}>
                            <span className="material-symbols-outlined text-2xl">{habitInfo.icon}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{challenge.habitDescription.split(' - ')[0]}</h4>
                            <p className="text-xs text-slate-400">{challenge.habitDescription.split(' - ')[1] || ''}</p>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-lg ${statusConfig[challenge.status].bgClass} ${statusConfig[challenge.status].textClass} text-[10px] font-bold uppercase tracking-wider`}>
                          {statusConfig[challenge.status].label}
                        </div>
                      </div>
                      <div className="space-y-4 flex-1">
                        <div>
                          <div className="flex justify-between text-xs mb-2">
                            <span className="text-slate-500 font-medium">当前进度</span>
                            <span className="text-primary font-bold">{Number(challenge.completedDays)} / {Number(challenge.targetDays)} 天</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full shadow-[0_0_8px_rgba(19,182,236,0.3)]" style={{ width: `${progress}%` }}></div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">开始日期</p>
                            <p className="text-sm font-bold text-slate-700">{formatDate(challenge.startTime)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">质押金额</p>
                            <p className="text-lg font-display font-black text-slate-900">{parseFloat(formatEther(challenge.stakeAmount)).toFixed(4)} <span className="text-xs font-bold text-slate-400">ETH</span></p>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setPage(Page.CHALLENGE_DETAIL)} className="w-full mt-6 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 group">
                        查看详情
                        <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 已完成的挑战 */}
          {completedChallenges.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800">历史挑战</h3>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    <tr>
                      <th className="px-6 py-4">习惯名称</th>
                      <th className="px-6 py-4">开始时间</th>
                      <th className="px-6 py-4">最终成绩</th>
                      <th className="px-6 py-4">质押金额</th>
                      <th className="px-6 py-4 text-right">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {completedChallenges.map((challenge) => {
                      const habitInfo = getHabitIcon(challenge.habitDescription);
                      return (
                        <tr key={challenge.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`size-8 rounded-lg bg-${habitInfo.color}-50 text-${habitInfo.color}-500 flex items-center justify-center`}>
                                <span className="material-symbols-outlined text-lg">{habitInfo.icon}</span>
                              </div>
                              <span className="text-sm font-bold text-slate-700">{challenge.habitDescription.split(' - ')[0]}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">{formatDate(challenge.startTime)}</td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              {Number(challenge.completedDays)} / {Number(challenge.targetDays)} 天
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-slate-700">{parseFloat(formatEther(challenge.stakeAmount)).toFixed(4)} ETH</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusConfig[challenge.status].bgClass} ${statusConfig[challenge.status].textClass}`}>
                              {statusConfig[challenge.status].label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      <div className="fixed bottom-8 right-8 z-40">
        <button className="size-14 bg-white rounded-full shadow-2xl border border-slate-100 flex items-center justify-center text-primary hover:scale-110 transition-transform group relative">
          <span className="material-symbols-outlined text-2xl">smart_toy</span>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
          <div className="absolute right-full mr-4 bg-slate-900 text-white text-[10px] py-1 px-3 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            AI 教练正在线
          </div>
        </button>
      </div>
    </main>
  );
};

export default ChallengeList;