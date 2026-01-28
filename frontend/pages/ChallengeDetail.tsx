import React from 'react';
import { Icon } from '../components/Icon';
import { Page } from '../types';

interface ChallengeDetailProps {
  setPage?: (page: Page) => void;
}

const ChallengeDetail: React.FC<ChallengeDetailProps> = ({ setPage }) => {
  return (
    <div className="animate-fade-in-up max-w-[1200px] mx-auto px-6 py-8">
      {/* Breadcrumb & Title */}
      <div className="mb-6">
        <div
          className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide cursor-pointer hover:text-slate-600 transition-colors"
        >
          <span onClick={() => setPage && setPage(Page.CHALLENGE_LIST)}>挑战列表</span>
          <Icon name="chevron_right" className="text-base" />
          <span>30天沉浸式阅读挑战</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900">30天阅读挑战详情</h1>
          <div className="flex gap-3">
            <button className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-full text-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
              <Icon name="share" className="text-lg" /> 分享进度
            </button>
            <button className="px-6 py-2.5 bg-primary text-white font-bold rounded-full text-sm shadow-glow hover:bg-primary-dark transition-all flex items-center gap-2">
              <Icon name="sync" className="text-lg" /> 立即同步
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Circular Gauge Card */}
        <div className="lg:col-span-5 bg-surface rounded-2xl p-8 border border-slate-100 shadow-soft flex flex-col justify-between items-center relative overflow-hidden">
          <div className="relative size-64 flex items-center justify-center mt-4">
            {/* Background Circle */}
            <svg className="transform -rotate-90 w-full h-full">
              <circle
                cx="128"
                cy="128"
                r="100"
                stroke="currentColor"
                strokeWidth="16"
                fill="transparent"
                className="text-slate-100"
              />
              {/* Progress Circle (approx 70% for 21 days left out of 30) */}
              <circle
                cx="128"
                cy="128"
                r="100"
                stroke="currentColor"
                strokeWidth="16"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 100}
                strokeDashoffset={2 * Math.PI * 100 * (1 - 0.7)}
                strokeLinecap="round"
                className="text-primary transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-6xl font-black text-slate-900 tracking-tighter">21</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Days Left</span>
            </div>
          </div>

          <div className="w-full grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-50">
            <div className="text-center">
              <p className="text-xs text-slate-400 font-bold mb-1">总期限</p>
              <p className="text-lg font-black text-slate-900">30 天</p>
            </div>
            <div className="text-center border-l border-slate-100">
              <p className="text-xs text-slate-400 font-bold mb-1">当前连胜</p>
              <p className="text-lg font-black text-emerald-500">7 天</p>
            </div>
            <div className="text-center border-l border-slate-100">
              <p className="text-xs text-slate-400 font-bold mb-1">数据同步</p>
              <p className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1">
                Apple Books <span className="block size-2 rounded-full bg-emerald-500"></span>
              </p>
            </div>
          </div>
        </div>

        {/* Calendar Card */}
        <div className="lg:col-span-7 bg-surface rounded-2xl p-8 border border-slate-100 shadow-soft">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <Icon name="calendar_today" className="text-primary" /> 打卡日历
            </h3>
            <div className="flex gap-4 text-xs font-bold text-slate-400">
              <div className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-500"></span> 已达标
              </div>
              <div className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-slate-200"></span> 待打卡
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-3 mb-2">
            {['一', '二', '三', '四', '五', '六', '日'].map((d, i) => (
              <div key={i} className="text-center text-xs font-bold text-slate-300 py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-3">
            {/* Empty slots for offset */}
            <div className="aspect-square"></div>
            <div className="aspect-square"></div>

            {/* Days 1-9 (Completed) */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(day => (
              <div key={day} className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold ${day === 4 || day === 9 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-emerald-50 text-emerald-600'
                }`}>
                {day}
              </div>
            ))}

            {/* Day 10 (Today/Current) */}
            <div className="aspect-square rounded-xl flex items-center justify-center text-sm font-bold border-2 border-dashed border-primary text-primary bg-sky-50 relative">
              10
              <span className="absolute -top-1 -right-1 size-2 bg-primary rounded-full"></span>
            </div>

            {/* Days 11-21 (Future) */}
            {Array.from({ length: 11 }, (_, i) => i + 11).map(day => (
              <div key={day} className="aspect-square rounded-xl flex items-center justify-center text-sm font-bold bg-slate-50 text-slate-300">
                {day}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Staking & Rewards */}
          <div className="bg-surface rounded-2xl p-8 border border-slate-100 shadow-soft">
            <h3 className="text-lg font-bold text-amber-500 flex items-center gap-2 mb-6">
              <Icon name="payments" className="text-amber-500" /> 质押与奖励 (Staking & Rewards)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-50 rounded-xl p-6">
                <p className="text-xs font-bold text-slate-400 mb-2">已质押金额</p>
                <p className="text-3xl font-black text-slate-800">200.00 <span className="text-sm font-bold text-slate-400">USDT</span></p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-6">
                <p className="text-xs font-bold text-emerald-600 mb-2">预估年化收益</p>
                <p className="text-3xl font-black text-emerald-500">12.5% <span className="text-sm font-bold text-emerald-600">APR</span></p>
              </div>
            </div>

            <div className="bg-red-50 rounded-xl p-6 border border-red-100 flex gap-4">
              <div className="text-red-500 pt-1">
                <h4 className="text-xl font-black uppercase leading-none">report</h4>
                <span className="text-[10px] font-bold tracking-widest block text-center mt-1">REPORT</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-500 mb-1">惩罚规则警示</h4>
                <p className="text-xs text-red-400 leading-relaxed font-medium">
                  若今日未能在 24:00 前同步阅读数据，系统将自动扣除当日质押份额 (约 <span className="underline decoration-red-300 cursor-pointer">6.67 USDT</span>) 作为惩罚并捐赠至 Web3 公共物品基金。
                </p>
              </div>
            </div>
          </div>

          {/* Protocol Detail */}
          <div className="bg-surface rounded-2xl p-8 border border-slate-100 shadow-soft">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-sky-500 flex items-center gap-2">
                <Icon name="gavel" className="text-sky-500" /> 对赌协议详情
              </h3>
              <span className="px-3 py-1 bg-sky-50 text-sky-500 rounded-full text-[10px] font-bold uppercase tracking-wide">Protocol Active</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 mb-2">惩罚机制</p>
                <p className="text-xl font-black text-slate-800 mb-1">100% 捐赠</p>
                <p className="text-[10px] text-slate-400">违约金将转入 DAO 金库</p>
              </div>
              <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 mb-2">锁定截止日期</p>
                <p className="text-xl font-black text-slate-800 mb-1">2024-05-30</p>
                <p className="text-[10px] text-slate-400">挑战结束后可全额解锁</p>
              </div>
              <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 mb-2">累计已获奖励</p>
                <p className="text-xl font-black text-emerald-500 mb-1">14.85 <span className="text-xs text-slate-400">USDT</span></p>
                <p className="text-[10px] text-slate-400">包含节点激励与对赌收益</p>
              </div>
            </div>

            <button className="w-full mt-6 bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
              <Icon name="settings_suggest" className="text-xl" /> 管理质押
            </button>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-surface rounded-2xl border border-slate-100 shadow-soft h-full flex flex-col relative overflow-hidden">
            <div className="p-8 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="psychology" className="text-sky-400 text-xl" />
                <h3 className="text-lg font-bold text-slate-900">AI 习惯教练</h3>
              </div>
              <p className="text-xs text-slate-400">您的个性化习惯优化专家</p>
            </div>

            <div className="px-6 flex-1">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none p-6 relative mt-4">
                <svg className="absolute -top-2 left-0 w-4 h-4 text-slate-50 fill-current transform rotate-180" viewBox="0 0 20 20">
                  <path d="M0 0 L20 0 L20 20 Z" />
                </svg>
                <p className="text-sm text-slate-600 italic leading-relaxed font-medium">
                  “嗨！你已经连续坚持阅读 7 天了，这是一个非常了不起的里程碑。根据我们的 AI 模型分析，度过前 10 天是习惯成型的关键。保持现在的节奏，你离彻底养成阅读习惯仅剩最后一步！”
                </p>
              </div>
            </div>

            <div className="p-6 mt-auto">
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  <div className="size-8 rounded-full bg-slate-200 border-2 border-white"></div>
                  <div className="size-8 rounded-full bg-slate-300 border-2 border-white"></div>
                  <div className="size-8 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">+12</div>
                </div>
                <button className="text-xs font-bold text-sky-500 flex items-center gap-1 hover:text-sky-600">
                  查看 AI 报告 <Icon name="trending_up" className="text-sm" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDetail;