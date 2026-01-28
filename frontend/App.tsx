import React, { useState } from 'react';
import Header from './components/Header';
import CreateChallenge from './pages/CreateChallenge';
import ChallengeList from './pages/ChallengeList';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ChallengeDetail from './pages/ChallengeDetail';
import { Page } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);

  const renderPage = () => {
    switch (currentPage) {
      case Page.HOME:
        return <LandingPage setPage={setCurrentPage} />;
      case Page.CREATE_CHALLENGE:
        return <CreateChallenge setPage={setCurrentPage} />;
      case Page.CHALLENGE_LIST:
        return <ChallengeList setPage={setCurrentPage} />;
      case Page.DASHBOARD:
        return <Dashboard setPage={setCurrentPage} />;
      case Page.CHALLENGE_DETAIL:
        return <ChallengeDetail setPage={setCurrentPage} />;
      default:
        return <ChallengeList setPage={setCurrentPage} />;
    }
  };

  if (currentPage === Page.HOME) {
    return (
      <div className="font-sans">
        {renderPage()}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-sans">
      <Header currentPage={currentPage} setPage={setCurrentPage} />
      <div className="flex-grow flex flex-col">
        {renderPage()}
      </div>
      <footer className="mt-auto border-t border-slate-100 dark:border-slate-800 bg-surface-light dark:bg-surface-dark py-8">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 opacity-40">
            <span className="material-symbols-outlined text-xl">token</span>
            <span className="text-sm font-bold">HabitStaker © 2024</span>
          </div>
          <div className="flex gap-8 text-xs font-bold text-slate-400">
            <a className="hover:text-primary transition-colors" href="#">隐私政策</a>
            <a className="hover:text-primary transition-colors" href="#">使用条款</a>
            <a className="hover:text-primary transition-colors" href="#">API 文档</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;