import React from 'react';
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { Page } from '../types';

interface HeaderProps {
  currentPage: Page;
  setPage: (page: Page) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, setPage }) => {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  const getLinkClass = (page: Page) => {
    const baseClass = "text-sm font-medium py-5 border-b-2 transition-colors cursor-pointer";
    const activeClass = "text-primary border-primary font-bold";
    const inactiveClass = "text-slate-600 dark:text-slate-300 border-transparent hover:text-primary";

    return `${baseClass} ${currentPage === page ? activeClass : inactiveClass}`;
  };

  // 格式化地址显示
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // 格式化余额显示
  const formatBalance = (bal: typeof balance) => {
    if (!bal) return '0.00';
    return parseFloat(bal.formatted).toFixed(4);
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-100 dark:border-slate-800 bg-surface-light dark:bg-surface-dark px-6 lg:px-10 sticky top-0 z-50 h-16">
      <div className="flex items-center gap-2 text-slate-900 dark:text-white cursor-pointer" onClick={() => setPage(Page.CREATE_CHALLENGE)}>
        <div className="size-8 text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl font-bold">token</span>
        </div>
        <h2 className="text-xl font-display font-bold leading-tight">HabitStaker</h2>
      </div>
      <nav className="hidden md:flex items-center gap-8 h-full">
        <a className={getLinkClass(Page.HOME)} onClick={() => setPage(Page.CREATE_CHALLENGE)}>首页</a>
        <a className={getLinkClass(Page.CHALLENGE_LIST)} onClick={() => setPage(Page.CHALLENGE_LIST)}>挑战列表</a>
        <a className={getLinkClass(Page.DASHBOARD)} onClick={() => setPage(Page.DASHBOARD)}>数据看板</a>
      </nav>
      <div className="flex items-center gap-4">
        {isConnected ? (
          <>
            {/* 显示余额 */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {formatBalance(balance)} {balance?.symbol || 'ETH'}
              </span>
            </div>
            {/* 显示地址和断开连接 */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-primary transition-colors"
              onClick={() => disconnect()}
              title="点击断开连接"
            >
              <span className="material-symbols-outlined text-base text-primary">account_balance_wallet</span>
              <span className="text-sm font-mono text-slate-600 dark:text-slate-300">{formatAddress(address!)}</span>
            </div>
          </>
        ) : (
          /* 连接钱包按钮 */
          <button
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-sky-500 text-white font-bold rounded-lg transition-colors shadow-md shadow-primary/20"
            onClick={() => {
              const metaMask = connectors.find((c) => c.name === 'MetaMask');
              if (metaMask) {
                connect({ connector: metaMask });
              } else {
                connect({ connector: connectors[0] });
              }
            }}
            disabled={isPending}
          >
            <span className="material-symbols-outlined text-base">account_balance_wallet</span>
            {isPending ? '连接中...' : '连接钱包'}
          </button>
        )}
        <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 border-2 border-white shadow-sm cursor-pointer" style={{ backgroundImage: 'url("https://picsum.photos/100/100")' }}></div>
      </div>
    </header>
  );
};

export default Header;