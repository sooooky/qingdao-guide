import React from 'react';
import { Download, RefreshCw, Menu, Share2 } from 'lucide-react';
import { TabKey, TABS } from './Navigation';

interface HeaderProps {
  onOpenNav: () => void;
  currentTab: TabKey;
  onOpenShare: () => void;
  onOpenBackup: () => void;
  onOpenVault: () => void;
  vaultCount: number;
  onReset: () => void;
  exchangeRate: number;
  isLiveConnected?: boolean;
  roomId?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNav,
  currentTab,
  onOpenShare,
  onOpenBackup,
  onOpenVault,
  vaultCount,
  onReset,
  exchangeRate,
  isLiveConnected = true,
  roomId,
}) => {
  const currentTabInfo = TABS.find((t) => t.key === currentTab);
  const CurrentIcon = currentTabInfo?.icon;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 py-2.5 shadow-md">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Menu Drawer Toggle Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenNav}
            className="p-2 -ml-1 text-slate-200 hover:text-amber-400 bg-slate-800/90 hover:bg-slate-800 rounded-xl flex items-center gap-2 border border-slate-700/80 active:scale-95 transition shadow-sm"
            aria-label="왼쪽 메뉴 열기"
          >
            <Menu className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-black text-slate-100 hidden xs:inline">메뉴</span>
          </button>

          {/* Current Active Tab Indicator Badge */}
          <div className="flex items-center space-x-1.5 pl-1">
            {CurrentIcon && (
              <span className="hidden sm:inline-block">
                <CurrentIcon className={`w-4 h-4 ${currentTabInfo.color}`} />
              </span>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base text-slate-100 tracking-tight">
                  {currentTabInfo?.label || '칭다오 플래너'}
                </span>
                <span className="text-[10px] text-amber-400/90 font-mono hidden sm:inline">
                  (1元={exchangeRate}원)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Real-time Share & Live Collab Button */}
          <button
            onClick={onOpenShare}
            className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            title="실시간 링크 공유 & 일정 텍스트 복사"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] whitespace-nowrap font-extrabold">공유하기</span>
            {isLiveConnected && (
              <span
                className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                title={`실시간 연동 중 (방: ${roomId || ''})`}
              />
            )}
          </button>

          {/* Offline Screenshots Vault Button */}
          <button
            onClick={onOpenVault}
            className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1"
            title="인터넷 없이 보는 캡쳐/바우처 보관함"
          >
            <span className="text-xs">📷</span>
            <span className="text-[11px] whitespace-nowrap hidden sm:inline">오프라인 보관함</span>
            {vaultCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                {vaultCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenBackup}
            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1"
            title="데이터 백업 및 복원"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-[11px] whitespace-nowrap hidden md:inline">백업</span>
          </button>

          <button
            onClick={onReset}
            className="p-1.5 text-slate-400 hover:text-red-400 active:scale-95 bg-slate-800/60 hover:bg-slate-800 rounded-xl transition"
            title="데이터 초기화"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
