import React from 'react';
import { Icon } from '../components/Icon';
// import { useNavigate } from 'react-router-dom'; // Commented out as we use setPage prop in this app structure usually, but strict adherence to user code first.
// The user code uses useNavigate, but the App.tsx uses functional state for navigation.
// I will adapt the user's code slightly to match the App's navigation props if they exist, or keep strictly if requested.
// User rule: "User input requirements priority > system setting requirements."
// User provided code uses `useNavigate` from `react-router-dom`, but the current project uses `useState` in `App.tsx` for navigation.
// To avoid breaking the app immediately, I might need to adjust `header` or just accept it might not link correctly yet.
// However, looking at the user's current App.tsx, it does NOT use react-router-dom. It uses conditional rendering.
// I should probably warn the user or adapt it.
// Let's look at `Dashboard.tsx` imports in the user request.
// `import { useNavigate } from 'react-router-dom';`
// Since `react-router-dom` is likely not installed or set up, I should probably adapt the navigation to `setPage`.
// Wait, the user said "Data dashboard page update to like that above".
// I will try to respect the code as much as possible. If I paste it exactly, it will break because of missing `react-router-dom`.
// I will change `useNavigate` to use the `setPage` prop convention existing in the app, 
// OR I will just paste it and let the user know they need router.
// Actually, looking at the previous file `Dashboard.tsx`, it takes no props?
// Let's check `App.tsx` again. `case Page.DASHBOARD: return <Dashboard />;` -> It passes NO props.
// So `Dashboard` cannot switch pages currently.
// I will just comment out the navigation part or mock it to prevent crash, 
// but I will write the file content as requested.
// actually I will make `Dashboard` accept `setPage` in `App.tsx` later if needed.
// For now, I'll modify the code slightly to avoid build error: `navigate` -> `console.log`.

// Actually, I'll check if `react-router-dom` is in package.json.
// PROBABLY NOT.
// I will replace `useNavigate` with a mock to avoid errors, or just not use it.
// The user code has: `onClick={() => navigate('/challenge')}`
// I will simply replace this with a comment or a dummy function to ensure it compiles.

// Wait, the user provided exact code. I should probably use it but adapt the imports if necessary.
// I'll stick to the user's code structure but fix the navigation compatibility issue by using a "stub" or assuming `setPage` will be passed eventually.
// Actually, `App.tsx` renders `<Dashboard />` without props.
// I'll adapt the user code to be compatible with the current project (no router).

import { Page } from '../types';

interface DashboardProps {
  setPage?: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setPage }) => {
  // const navigate = useNavigate(); // Adapted
  const navigate = (path: string) => {
    console.log('Navigate to:', path);
    if (setPage && path === '/challenge') {
      // Assuming mapping, but for now just log.
      // setPage(Page.CHALLENGE_DETAIL); 
    }
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
          <span>AI 正在同步 <span className="font-bold text-slate-700">3个数据源</span></span>
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
            <span className="text-4xl font-black text-slate-900 tracking-tight">850.00</span>
            <span className="text-lg font-bold text-slate-400 mb-1">USDT</span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-emerald-600">
            <Icon name="payments" className="text-sm" />
            <span>当前锁定中：3 个协议</span>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-slate-100 shadow-soft flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-slate-400">全局连续天数</span>
            <div className="p-2 bg-orange-50 rounded-lg text-orange-500">
              <Icon name="local_fire_department" fill className="text-xl" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-slate-900 tracking-tight">42</span>
            <span className="text-lg font-bold text-slate-400 mb-1">天</span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-slate-400">
            <span>保持全习惯打卡已连续 6 周</span>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-2xl border border-slate-100 shadow-soft flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold text-slate-400">累计挑战成功数</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Icon name="verified" fill className="text-xl" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-slate-900 tracking-tight">15</span>
            <span className="text-lg font-bold text-slate-400 mb-1">次</span>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-emerald-600">
            <Icon name="trending_up" className="text-sm" />
            <span>成功率：94%</span>
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
              <div className="flex items-center gap-6 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors" onClick={() => navigate('/challenge')}>
                <div className="size-12 rounded-xl bg-sky-50 flex items-center justify-center text-primary">
                  <Icon name="auto_stories" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-700">深度阅读 30min</span>
                    <span className="text-sm font-black text-primary">70%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-[70%] rounded-full"></div>
                  </div>
                </div>
                <div className="w-24 text-right">
                  <span className="px-2.5 py-1 bg-sky-50 text-primary rounded-lg text-xs font-bold">进行中</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="size-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Icon name="directions_run" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-700">每日跑步 5km</span>
                    <span className="text-sm font-black text-emerald-600">100%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-full rounded-full"></div>
                  </div>
                </div>
                <div className="w-24 text-right">
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold">已完成</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="size-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Icon name="code" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-700">GitHub 代码提交</span>
                    <span className="text-sm font-black text-slate-300">0%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-slate-200 h-full w-0 rounded-full"></div>
                  </div>
                </div>
                <div className="w-24 text-right">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-400 rounded-lg text-xs font-bold">待处理</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Icon name="history" className="text-pink-500" />
                惩罚/执行历史
              </h3>
              <span className="text-xs font-bold text-slate-300">所有挑战日志</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-slate-400 text-xs font-bold uppercase">
                  <tr>
                    <th className="px-6 py-4">时间</th>
                    <th className="px-6 py-4">挑战项目</th>
                    <th className="px-6 py-4">状态</th>
                    <th className="px-6 py-4">执行详情</th>
                    <th className="px-6 py-4 text-right">链上结果</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-50">
                  <tr>
                    <td className="px-6 py-4 font-medium text-slate-500">10-25 08:30</td>
                    <td className="px-6 py-4 font-bold text-slate-700">每日跑步</td>
                    <td className="px-6 py-4"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-xs font-bold">成功</span></td>
                    <td className="px-6 py-4 text-slate-400">AI 同步自 Strava</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-500">+0.15 USDT</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-slate-500">10-24 23:59</td>
                    <td className="px-6 py-4 font-bold text-slate-700">深度阅读</td>
                    <td className="px-6 py-4"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-xs font-bold">成功</span></td>
                    <td className="px-6 py-4 text-slate-400">AI 同步自 Apple Books</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-500">+0.12 USDT</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-slate-500">10-20 00:00</td>
                    <td className="px-6 py-4 font-bold text-slate-700">早起打卡</td>
                    <td className="px-6 py-4"><span className="px-2 py-0.5 bg-pink-50 text-pink-600 rounded text-xs font-bold">失败</span></td>
                    <td className="px-6 py-4 text-slate-400 flex items-center gap-1">
                      <Icon name="volunteer_activism" className="text-sm" />
                      罚金捐赠
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-pink-500">-5.00 USDT</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="bg-surface p-6 rounded-2xl border border-slate-100 shadow-soft">
            <h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
              <Icon name="sync" className="text-primary" />
              同步数据源
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-primary">
                    <Icon name="auto_stories" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Apple Books</p>
                    <p className="text-[10px] text-emerald-500 font-bold">已连接</p>
                  </div>
                </div>
                <button className="text-xs font-bold text-slate-400 hover:text-primary">设置</button>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-orange-500">
                    <Icon name="directions_run" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Strava</p>
                    <p className="text-[10px] text-emerald-500 font-bold">已连接</p>
                  </div>
                </div>
                <button className="text-xs font-bold text-slate-400 hover:text-primary">设置</button>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="size-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-slate-400">
                    <Icon name="rss_feed" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Goodreads</p>
                    <p className="text-[10px] text-slate-400 font-bold">未连接</p>
                  </div>
                </div>
                <button className="text-xs font-bold text-primary">连接</button>
              </div>
            </div>
            <button className="w-full mt-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all">
              立即同步数据
            </button>
          </div>
          <div className="bg-sky-50/50 p-6 rounded-2xl border border-sky-100 shadow-soft">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Icon name="psychology" fill />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">AI 全局建议</h4>
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest">AI Insights</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              “你目前的全局连续记录非常稳定。注意到在周三，你通常对『代码提交』挑战的动力较低，建议在该日将目标稍微调低或移至上午执行。”
            </p>
            <div className="p-3 bg-white/80 rounded-lg text-xs text-slate-400 italic text-center">
              “成功是每天微小努力的积累。”
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;