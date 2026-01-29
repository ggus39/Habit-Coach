import React from 'react';
import { Icon } from '../components/Icon';


import { Page } from '../types';
import { useAccount, useReadContract } from 'wagmi';
import { HABIT_ESCROW_ABI, HABIT_ESCROW_ADDRESS, Challenge, ChallengeStatus } from '../contracts';
import { useState, useEffect } from 'react';

// 习惯图标映射
const getHabitIcon = (description: string) => {
  if (description.includes('阅读')) return { icon: 'menu_book', color: 'blue' };
  if (description.includes('跑步')) return { icon: 'directions_run', color: 'orange' };
  if (description.includes('编程')) return { icon: 'code', color: 'purple' };
  return { icon: 'trending_up', color: 'emerald' };
};

interface DashboardProps {
  setPage?: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setPage }) => {
  const { address, isConnected } = useAccount();

  //读取挑战数量
  const { data: challengeCount } = useReadContract({
    address: HABIT_ESCROW_ADDRESS,
    abi: HABIT_ESCROW_ABI,
    functionName: 'challengeCount',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  // 读取每个挑战的详情 (Copied from ChallengeList)
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

  const [activeChallenges, setActiveChallenges] = useState<(Challenge & { id: number })[]>([]);

  useEffect(() => {
    const all: (Challenge & { id: number })[] = [];
    if (challenge0) all.push({ ...(challenge0 as unknown as Challenge), id: 0 });
    if (challenge1) all.push({ ...(challenge1 as unknown as Challenge), id: 1 });
    if (challenge2) all.push({ ...(challenge2 as unknown as Challenge), id: 2 });

    // Filter only active challenges
    const active = all.filter(c => c.status === ChallengeStatus.Active);
    setActiveChallenges(active);
  }, [challenge0, challenge1, challenge2]);

  // 获取最新的挑战ID (保留原有逻辑作为备用，或者用于其他目的)
  const activeChallengeId = challengeCount ? Number(challengeCount) - 1 : undefined;

  const [githubStatus, setGithubStatus] = useState<{
    connected: boolean;
    username?: string;
    avatarUrl?: string;
  }>({ connected: false });
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);

  // 后端 API 基础路径
  const API_BASE = 'https://frp-oil.com:16292/agent';

  // 1. 获取 GitHub 绑定状态
  const fetchGithubStatus = async () => {
    if (!address) return;
    try {
      const resp = await fetch(`${API_BASE}/github/status?walletAddress=${address}`);
      const data = await resp.json();
      // 后端返回的是 githubUsername，映射到前端的 username
      setGithubStatus({
        connected: data.connected,
        username: data.githubUsername,
        avatarUrl: data.githubAvatarUrl
      });
    } catch (e) {
      console.error('获取 GitHub 状态失败', e);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchGithubStatus();
    }
  }, [isConnected, address]);

  // 处理 OAuth 回调后的参数
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('github_connected') === 'true') {
      fetchGithubStatus();
      // 清除 URL 参数
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // 2. 发起 GitHub 授权
  const handleConnectGitHub = () => {
    if (!address) {
      alert('请先连接钱包');
      return;
    }
    // 直接跳转到后端授权接口
    window.location.href = `${API_BASE}/github/auth?walletAddress=${address}`;
  };

  // 3. 检查今日打卡
  const handleCheckCommits = async (isAuto = false) => {
    if (!address || !githubStatus.connected) return;
    setIsChecking(true);
    setCheckResult(null);

    let succcesCount = 0;
    let txHashes: string[] = [];
    let clockedIn = false;

    try {
      if (activeChallenges.length === 0) {
        // Fallback or just check 0 if exists? Or just display logic. 
        // If no active challenges, maybe just check generic status?
        // But for "Today's Tasks", we typically iterate active ones.
        // Let's keep the generic check just in case, or skip?
        // If no active challenges, let's just do a generic check to show "Clocked In" status generally?
        // But wait, user wants one-to-one mapping.
        // If 0 active challenges, the list is empty, nothing to check.
        setCheckResult("当前无进行中的挑战");
      } else {
        // Iterate all active challenges
        for (const challenge of activeChallenges) {
          // 只处理 "编程" 挑战 (GitHub 挑战)
          if (!challenge.habitDescription.includes('编程')) continue;

          let url = `${API_BASE}/github/check?walletAddress=${address}&challengeId=${challenge.id}`;
          const resp = await fetch(url);
          const data = await resp.json();

          if (data.clockedIn) {
            clockedIn = true;
            succcesCount++;
            if (data.txHash) txHashes.push(data.txHash);
          }
        }

        if (clockedIn) {
          let msg = `今日已打卡 ✅`;
          if (txHashes.length > 0) msg += `\n交易哈希: ${txHashes.join(', ')}`;
          setCheckResult(msg);

          if (!isAuto) alert(msg);
        } else if (succcesCount === 0 && activeChallenges.some(c => c.habitDescription.includes('编程'))) {
          // 只有当有 编程 挑战 且未打卡时才提示未完成，否则不打扰
          const msg = '今日尚未检测到有效提交，请继续加油 ❌';
          setCheckResult(msg);
          if (!isAuto) alert(msg);
        }
      }

    } catch (e) {
      setCheckResult('检查失败，请重试');
      console.error(e);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (githubStatus.connected && activeChallenges.length > 0) {
      // 简单防抖或只触发一次? 依赖项变化可能会触发多次，但 items 数量变化不频繁
      handleCheckCommits(true);
    }
  }, [githubStatus.connected, activeChallenges.length]);

  const navigate = (path: string) => {
    console.log('Navigate to:', path);
    // setPage(Page.CHALLENGE_DETAIL); 
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">全局数据看板</h1>
          <p className="text-slate-400 mt-2 text-lg font-medium">查看所有习惯挑战的汇总表现与 Web3 资产状态。</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white border border-slate-100 px-4 py-2 rounded-full shadow-soft">
          <Icon name="circle" fill className="text-emerald-500 text-xs" />
          <span>AI 正在同步 <span className="font-bold text-slate-700">GitHub 数据源</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface p-6 rounded-2xl border border-slate-100 shadow-soft flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-slate-400">总质押金额</span>
            <div className="p-2 bg-sky-50 rounded-lg text-primary">
              <Icon name="account_balance" className="text-xl" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-slate-900 tracking-tight">0.05</span>
            <span className="text-lg font-bold text-slate-400 mb-1">ETH</span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-emerald-600">
            <Icon name="payments" className="text-sm" />
            <span>当前锁定中：1 个挑战</span>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-slate-100 shadow-soft flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-slate-400">连续坚持天数</span>
            <div className="p-2 bg-orange-50 rounded-lg text-orange-500">
              <Icon name="local_fire_department" fill className="text-xl" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-slate-900 tracking-tight">3</span>
            <span className="text-lg font-bold text-slate-400 mb-1">天</span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-slate-400">
            <span>距离下个奖励等级还差 4 天</span>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-slate-100 shadow-soft flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-slate-400">累计获得 STRICT</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Icon name="verified" fill className="text-xl" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-slate-900 tracking-tight">500</span>
            <span className="text-lg font-bold text-slate-400 mb-1">STRICT</span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-emerald-600">
            <Icon name="trending_up" className="text-sm" />
            <span>挖矿效率：1.5x</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 flex flex-col gap-6">
          <div className="bg-surface p-8 rounded-2xl border border-slate-100 shadow-soft">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Icon name="task_alt" className="text-primary" />
                今日任务概览
              </h3>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Today's Habits</span>
            </div>
            <div className="space-y-6">
              {activeChallenges.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">暂无进行中的挑战</div>
              ) : (
                activeChallenges.map((challenge) => {
                  const habitInfo = getHabitIcon(challenge.habitDescription);
                  // 仅 "编程" 挑战显示 "已完成" (GitHub 打卡)，其他暂时保持 "进行中"
                  const isGitHubHabit = challenge.habitDescription.includes('编程');
                  const isClockedIn = isGitHubHabit && checkResult?.includes('已打卡');

                  return (
                    <div key={challenge.id} className="flex items-center gap-6 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                      <div className={`size-12 rounded-xl bg-${habitInfo.color}-50 text-${habitInfo.color}-600 flex items-center justify-center`}>
                        <Icon name={habitInfo.icon} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-700 text-base">
                          {challenge.habitDescription.split(' - ')[0]}
                        </h4>
                      </div>
                      <div>
                        {isClockedIn ? (
                          <div className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-bold">
                            <Icon name="check_circle" className="text-lg" fill />
                            <span>已完成</span>
                          </div>
                        ) : (
                          <div className="px-4 py-1.5 bg-sky-50 text-sky-500 rounded-lg text-sm font-bold text-center">
                            进行中
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="bg-surface p-6 rounded-2xl border border-slate-100 shadow-soft">
            <h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
              <Icon name="sync" className="text-primary" />
              数据源连接
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-slate-900">
                    <Icon name="terminal" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">GitHub</p>
                    <p className={`text-[10px] font-bold ${githubStatus.connected ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {githubStatus.connected ? `@${githubStatus.username}` : '未连接'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={githubStatus.connected ? undefined : handleConnectGitHub}
                  className={`text-xs font-bold ${githubStatus.connected ? 'text-slate-400' : 'text-primary'}`}
                >
                  {githubStatus.connected ? '已绑定' : '连接'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-sky-50/50 p-6 rounded-2xl border border-sky-100 shadow-soft">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Icon name="psychology" fill />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">AI 状态更新</h4>
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest">AI Agent</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {githubStatus.connected
                ? `你好 ${githubStatus.username}！我已经准备好监督你的代码库了。记得每天 Push 哦，否则你的质押金就有危险了！`
                : "请先连接 GitHub 账号。Money is Justice —— 只有通过代码证明你的进步，才能获得奖励。"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;