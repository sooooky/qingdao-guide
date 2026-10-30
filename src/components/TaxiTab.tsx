import React, { useState } from 'react';
import {
  Car,
  Volume2,
  Plus,
  Compass,
  Sparkles,
  Maximize2,
  Copy,
  Check,
  Search,
} from 'lucide-react';
import { TaxiCard } from '../types';
import { TAXI_CARDS } from '../data/initialData';
import { speakChinese } from '../utils/tts';
import { openAmap } from '../utils/geo';

interface TaxiTabProps {
  onOpenTaxiModal: (data: {
    title: string;
    cnText: string;
    pinyin?: string;
    krDesc?: string;
    addressCn?: string;
  }) => void;
  onShowToast: (msg: string) => void;
}

export const TaxiTab: React.FC<TaxiTabProps> = ({ onOpenTaxiModal, onShowToast }) => {
  const [taxiCards, setTaxiCards] = useState<TaxiCard[]>(() => {
    try {
      const saved = localStorage.getItem('qingdao_custom_taxi_cards_v1');
      return saved ? JSON.parse(saved) : TAXI_CARDS;
    } catch {
      return TAXI_CARDS;
    }
  });

  const [taxiFilter, setTaxiFilter] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddTaxi, setShowAddTaxi] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customCn, setCustomCn] = useState('');
  const [customKr, setCustomKr] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSpeak = (id: string, text: string) => {
    setPlayingId(id);
    const ok = speakChinese(
      text,
      () => setPlayingId(id),
      () => setPlayingId(null)
    );
    if (!ok) {
      setPlayingId(null);
      onShowToast('현재 브라우저 환경에서 음성 재생을 지원하지 않습니다.');
    } else {
      onShowToast('🔊 중국어 음성을 재생합니다.');
    }
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      onShowToast(`"${text}" 복사되었습니다.`);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      onShowToast('복사 권한이 없습니다.');
    }
  };

  const handleAddCustomTaxi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customCn.trim()) {
      onShowToast('명칭과 중국어 주소를 입력해주세요.');
      return;
    }
    const newCard: TaxiCard = {
      id: `custom-taxi-${Date.now()}`,
      title: customTitle.trim(),
      cn:
        customCn.startsWith('请') || customCn.startsWith('师傅')
          ? customCn.trim()
          : `请带我去 ${customCn.trim()}`,
      pinyin: '',
      kr: customKr.trim() || `${customTitle.trim()}(으)로 가주세요.`,
      tag: '사용자 추가',
      addressCn: customCn.trim(),
    };
    const updated = [newCard, ...taxiCards];
    setTaxiCards(updated);
    try {
      localStorage.setItem('qingdao_custom_taxi_cards_v1', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    setCustomTitle('');
    setCustomCn('');
    setCustomKr('');
    setShowAddTaxi(false);
    onShowToast(`"${newCard.title}" 택시 카드가 추가되었습니다.`);
  };

  const taxiCategories = ['전체', '공항/교통', '핵심명소', '쇼핑/식당', '야시장', '전망대', '풍경구', '사용자 추가'];

  const filteredTaxi = taxiCards.filter((c) => {
    const matchesFilter =
      taxiFilter === '전체' ? true : c.tag.includes(taxiFilter) || c.tag === taxiFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cn.includes(searchQuery) ||
      c.kr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.addressCn && c.addressCn.includes(searchQuery));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <Car className="w-5 h-5 text-amber-400" />
            <span>택시 기사님 소통 카드 (목적지 보여주기)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            카드를 누르면 화면 가득 큰 중국어와 고덕지도(Amap) 위치가 열립니다.
          </p>
        </div>
        <button
          onClick={() => setShowAddTaxi(!showAddTaxi)}
          className="self-start sm:self-auto py-2 px-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ 내 호텔/목적지 추가</span>
        </button>
      </div>

      {/* Add Custom Taxi Card Form Drawer */}
      {showAddTaxi && (
        <form
          onSubmit={handleAddCustomTaxi}
          className="bg-slate-900 border border-amber-500/40 rounded-2xl p-4 space-y-3 text-xs shadow-xl animate-in slide-in-from-top-2"
        >
          <h3 className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>새 목적지 (호텔 / 바 / 맛집) 택시 카드 만들기</span>
          </h3>
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">장소명 (한국어) *</label>
            <input
              type="text"
              required
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="예: 우리 호텔 (홀리데이인 칭다오 시티센터)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">중국어 주소 / 명칭 (中文) *</label>
            <input
              type="text"
              required
              value={customCn}
              onChange={(e) => setCustomCn(e.target.value)}
              placeholder="예: 青岛市市南区徐州路1号 青岛颐中皇冠假日酒店"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-bold placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">한국어 설명 / 요청 문구</label>
            <input
              type="text"
              value={customKr}
              onChange={(e) => setCustomKr(e.target.value)}
              placeholder="예: 기사님, 홀리데이인 호텔로 가주세요."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddTaxi(false)}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md"
            >
              카드 등록
            </button>
          </div>
        </form>
      )}

      {/* Search and Category Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="목적지 검색 (공항, 잔교, 완샹청, 맥주박물관 등)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          {taxiCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setTaxiFilter(cat)}
              className={`py-1 px-2.5 rounded-xl transition ${
                taxiFilter === cat
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Taxi Cards List */}
      <div className="space-y-3">
        {filteredTaxi.length === 0 ? (
          <div className="text-center py-10 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            검색 결과가 없습니다.
          </div>
        ) : (
          filteredTaxi.map((c) => (
            <div
              key={c.id}
              className="bg-slate-900 rounded-2xl p-4 border border-slate-800 hover:border-amber-500/60 transition space-y-2.5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  onClick={() =>
                    onOpenTaxiModal({
                      title: c.title,
                      cnText: c.cn,
                      pinyin: c.pinyin,
                      krDesc: c.kr,
                      addressCn: c.addressCn,
                    })
                  }
                  className="cursor-pointer space-y-1.5 flex-1"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      {c.tag}
                    </span>
                    <h3 className="font-bold text-sm text-slate-100">{c.title}</h3>
                  </div>

                  <p className="text-base sm:text-lg font-black text-amber-400 leading-snug">
                    {c.cn}
                  </p>

                  {c.pinyin && (
                    <p className="text-[11px] text-cyan-300 font-mono">{c.pinyin}</p>
                  )}

                  <p className="text-xs text-slate-300 font-medium">{c.kr}</p>

                  {c.addressCn && (
                    <p className="text-[11px] text-slate-400 bg-slate-950/70 px-2 py-1 rounded-lg border border-slate-800">
                      📍 주소: {c.addressCn}
                    </p>
                  )}
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-1.5 text-xs">
                <button
                  onClick={() => handleSpeak(c.id, c.cn)}
                  className={`flex-1 py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
                    playingId === c.id
                      ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{playingId === c.id ? '재생 중...' : '중국어 음성'}</span>
                </button>

                <button
                  onClick={() =>
                    onOpenTaxiModal({
                      title: c.title,
                      cnText: c.cn,
                      pinyin: c.pinyin,
                      krDesc: c.kr,
                      addressCn: c.addressCn,
                    })
                  }
                  className="flex-1 py-2 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>화면 크게 보기</span>
                </button>

                <button
                  onClick={() => handleCopy(c.id, c.addressCn || c.cn)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl"
                  title="주소 복사"
                >
                  {copiedId === c.id ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={() => openAmap(c.title, c.addressCn || c.cn)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-xl"
                  title="고덕지도(Amap) 열기"
                >
                  <Compass className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
