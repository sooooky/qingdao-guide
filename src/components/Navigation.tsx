import React from 'react';
import {
  Calendar,
  Map,
  Calculator,
  Car,
  Beer,
  CheckSquare,
  Heart,
  Languages,
  X,
  Compass,
  Download,
  Camera,
  ChevronRight,
} from 'lucide-react';

export type TabKey =
  | 'itinerary'
  | 'map'
  | 'wishlist'
  | 'food'
  | 'calc'
  | 'taxi'
  | 'survival'
  | 'checklist';

interface NavigationProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  exchangeRate?: number;
  vaultCount?: number;
  onOpenVault?: () => void;
  onOpenBackup?: () => void;
}

export const TABS: {
  key: TabKey;
  label: string;
  subLabel: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
  color: string;
}[] = [
  {
    key: 'itinerary',
    label: '스케줄',
    subLabel: '3일간의 스마트 여행 동선',
    icon: Calendar,
    color: 'text-amber-400',
  },
  {
    key: 'map',
    label: '동선 지도',
    subLabel: '명소·호텔·식당 인터랙티브 맵',
    icon: Map,
    color: 'text-cyan-400',
  },
  {
    key: 'wishlist',
    label: '위시리스트',
    subLabel: '여유 시간에 갈 주변 명소',
    icon: Heart,
    color: 'text-rose-400',
  },
  {
    key: 'food',
    label: '맛집·생맥주',
    subLabel: '원조 칭다오 펍·해산물·야시장',
    icon: Beer,
    color: 'text-amber-300',
  },
  {
    key: 'calc',
    label: '환율·N빵',
    subLabel: '위안화 환율 계산기 및 정산',
    icon: Calculator,
    color: 'text-emerald-400',
  },
  {
    key: 'taxi',
    label: '택시 소통카드',
    subLabel: '목적지 중국어 카드 & Amap',
    icon: Car,
    color: 'text-amber-400',
  },
  {
    key: 'survival',
    label: '중국어·번역',
    subLabel: '한·중·영 자동 번역 & 생존 회화',
    icon: Languages,
    badge: '번역기',
    color: 'text-emerald-400',
  },
  {
    key: 'checklist',
    label: '준비물 체크',
    subLabel: '비자·알리페이·eSIM·짐싸기',
    icon: CheckSquare,
    color: 'text-indigo-400',
  },
];

export const Navigation: React.FC<NavigationProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  exchangeRate = 190,
  vaultCount = 0,
  onOpenVault,
  onOpenBackup,
}) => {
  return (
    <>
      {/* Backdrop for mobile left drawer */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Left Navigation Sidebar / Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-slate-900/98 backdrop-blur-xl border-r border-slate-800 flex flex-col shadow-2xl transition-transform duration-250 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Compass className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-black text-sm text-slate-100 flex items-center gap-1">
                <span>칭다오 스마트</span>
                <span className="text-amber-400 font-extrabold">메뉴</span>
              </h2>
              <p className="text-[10px] text-slate-400">원터치 여행 툴킷</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition active:scale-95"
            aria-label="메뉴 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Currency summary badge */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 text-[11px]">오늘의 기준 환율</span>
          <span className="text-amber-400 font-bold">1元 ≈ {exchangeRate}원</span>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1.5">
          <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            주요 메뉴 바로가기
          </div>

          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  onTabChange(tab.key);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all duration-150 text-left group ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 scale-[1.01]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 active:scale-98'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl transition ${
                      isActive
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-slate-800/90 text-slate-300 group-hover:bg-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : tab.color}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm ${isActive ? 'font-black' : 'font-bold'}`}>
                        {tab.label}
                      </span>
                      {tab.badge && (
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border ${
                            isActive
                              ? 'bg-slate-950 text-amber-300 border-slate-900'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[10px] truncate ${
                        isActive ? 'text-slate-900 font-medium' : 'text-slate-400'
                      }`}
                    >
                      {tab.subLabel}
                    </p>
                  </div>
                </div>

                <ChevronRight
                  className={`w-4 h-4 transition-transform shrink-0 ${
                    isActive ? 'text-slate-950 translate-x-0.5' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Drawer Footer Utilities */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
          {onOpenVault && (
            <button
              onClick={() => {
                onOpenVault();
                onClose();
              }}
              className="w-full py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>오프라인 캡쳐 보관함</span>
              </div>
              {vaultCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                  {vaultCount}
                </span>
              )}
            </button>
          )}

          {onOpenBackup && (
            <button
              onClick={() => {
                onOpenBackup();
                onClose();
              }}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>일정 데이터 백업 / 공유</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
