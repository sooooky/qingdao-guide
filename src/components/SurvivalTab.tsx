import React, { useState } from 'react';
import {
  MessageSquare,
  Volume2,
  Copy,
  Plus,
  Check,
  Languages,
  Maximize2,
  Trash2,
  Loader2,
  Search,
} from 'lucide-react';
import { SurvivalPhrase } from '../types';
import { speakChinese } from '../utils/tts';
import { translateKoreanText } from '../utils/translator';

interface SurvivalTabProps {
  phrases: SurvivalPhrase[];
  onUpdatePhrases: (phrases: SurvivalPhrase[]) => void;
  onOpenTaxiModal: (data: {
    title: string;
    cnText: string;
    pinyin?: string;
    krDesc?: string;
    addressCn?: string;
  }) => void;
  onShowToast: (msg: string) => void;
}

export const SurvivalTab: React.FC<SurvivalTabProps> = ({
  phrases,
  onUpdatePhrases,
  onOpenTaxiModal,
  onShowToast,
}) => {
  const [phraseFilter, setPhraseFilter] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom phrase translation & creation state
  const [showAddPhrase, setShowAddPhrase] = useState(false);
  const [koreanInput, setKoreanInput] = useState('');
  const [translatedCn, setTranslatedCn] = useState('');
  const [translatedPinyin, setTranslatedPinyin] = useState('');
  const [translatedEn, setTranslatedEn] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SurvivalPhrase['category']>('사용자 추가');
  const [isTranslating, setIsTranslating] = useState(false);

  // Playing audio state
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

  // Auto-translate Korean input to Chinese, Pinyin, and English
  const handlePerformTranslation = async (textToTranslate?: string) => {
    const text = (textToTranslate !== undefined ? textToTranslate : koreanInput).trim();
    if (!text) {
      onShowToast('번역할 한국어 문장을 입력해주세요.');
      return;
    }

    setIsTranslating(true);
    try {
      const result = await translateKoreanText(text);
      setTranslatedCn(result.cn);
      setTranslatedPinyin(result.pinyin);
      setTranslatedEn(result.en);
      onShowToast('✨ 중국어와 영어로 번역되었습니다.');
    } catch (err) {
      console.error(err);
      onShowToast('번역 중 오류가 발생했습니다. 직접 입력하실 수도 있습니다.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Quick preset click handler
  const handleQuickPreset = (presetText: string) => {
    setKoreanInput(presetText);
    handlePerformTranslation(presetText);
  };

  // Save new custom phrase
  const handleSaveCustomPhrase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!koreanInput.trim() || !translatedCn.trim()) {
      onShowToast('한국어와 중국어 번역문을 모두 입력해주세요.');
      return;
    }

    const newPhrase: SurvivalPhrase = {
      id: `custom-phrase-${Date.now()}`,
      kr: koreanInput.trim(),
      cn: translatedCn.trim(),
      pinyin: translatedPinyin.trim(),
      en: translatedEn.trim() || undefined,
      audioText: translatedCn.trim(),
      category: selectedCategory,
      isCustom: true,
    };

    onUpdatePhrases([newPhrase, ...phrases]);
    onShowToast(`"${newPhrase.kr}" 회화가 목록에 추가되었습니다.`);

    // Reset form
    setKoreanInput('');
    setTranslatedCn('');
    setTranslatedPinyin('');
    setTranslatedEn('');
    setShowAddPhrase(false);
  };

  // Delete custom phrase
  const handleDeleteCustomPhrase = (id: string, text: string) => {
    if (window.confirm(`"${text}" 회화를 삭제하시겠습니까?`)) {
      onUpdatePhrases(phrases.filter((p) => p.id !== id));
      onShowToast('회화가 삭제되었습니다.');
    }
  };

  const phraseCategories = ['전체', '사용자 추가', '식당', '쇼핑', '결제', '택시', '응급', '기타'];

  const filteredPhrases = phrases.filter((p) => {
    const matchesCategory =
      phraseFilter === '전체' ? true : p.category === phraseFilter || (phraseFilter === '사용자 추가' && p.isCustom);
    const matchesSearch =
      !searchQuery.trim() ||
      p.kr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.cn.includes(searchQuery) ||
      (p.pinyin && p.pinyin.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.en && p.en.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const quickPresets = [
    '따뜻한 물 한 잔 주세요',
    '얼음물 부탁드립니다',
    '와이파이 비밀번호가 뭐예요?',
    '트렁크 열어주세요',
    '물티슈 좀 더 주실 수 있나요?',
    '앞접시 2개 주세요',
    '추천 메뉴가 무엇인가요?',
    '남은 것 포장해주세요',
    '짐 보관 가능한가요?',
    '수건 더 주세요',
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <span>서바이벌 필수 중국어 & 한·중·영 번역</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            한국어로 입력하면 중국어(간체/병음)와 영어로 실시간 번역되며 원클릭 음성 재생을 지원합니다.
          </p>
        </div>
        <button
          onClick={() => setShowAddPhrase(!showAddPhrase)}
          className="self-start sm:self-auto py-2 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ 회화 추가 / 번역기</span>
        </button>
      </div>

      {/* ADD PHRASE & AUTO-TRANSLATE DRAWER */}
      {showAddPhrase && (
        <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-4 space-y-3.5 text-xs shadow-2xl animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm">
              <Languages className="w-4 h-4 text-emerald-400" />
              <span>한국어 ➔ 중국어(中文) & 영어(EN) 자동 번역기</span>
            </h3>
            <span className="text-[10px] text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
              오프라인 사전 + 온라인 듀얼
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1.5">
              ⚡ 자주 쓰는 여행 표현 빠른 선택:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleQuickPreset(preset)}
                  className="px-2 py-1 bg-slate-950 hover:bg-emerald-950 hover:border-emerald-600 border border-slate-800 rounded-lg text-[11px] text-slate-300 transition"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Korean Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 block">
              한국어 문장 입력 <span className="text-emerald-400">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={koreanInput}
                onChange={(e) => setKoreanInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePerformTranslation();
                  }
                }}
                placeholder="예: 따뜻한 물 한 잔만 부탁드립니다, 젓가락 하나 더 주세요"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                disabled={isTranslating}
                onClick={() => handlePerformTranslation()}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-black rounded-xl flex items-center gap-1.5 shadow-md transition shrink-0"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>번역 중...</span>
                  </>
                ) : (
                  <>
                    <Languages className="w-3.5 h-3.5" />
                    <span>번역 실행</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Translation Output / Editable Fields */}
          <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400">번역 결과 (수정 가능):</span>
              {translatedCn && (
                <button
                  type="button"
                  onClick={() => handleSpeak('preview-tts', translatedCn)}
                  className="text-[11px] font-bold text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 px-2.5 py-0.5 rounded-lg flex items-center gap-1 transition"
                >
                  <Volume2 className="w-3 h-3 text-cyan-400" />
                  <span>중국어 발음 미리듣기</span>
                </button>
              )}
            </div>

            {/* Chinese */}
            <div>
              <label className="text-[10px] text-amber-400 block mb-0.5 font-bold">
                중국어 간체 (中文)
              </label>
              <input
                type="text"
                value={translatedCn}
                onChange={(e) => setTranslatedCn(e.target.value)}
                placeholder="번역 버튼을 누르거나 직접 중국어를 입력하세요"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base font-black text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Pinyin */}
            <div>
              <label className="text-[10px] text-cyan-400 block mb-0.5 font-bold">
                발음 병음 (Pinyin)
              </label>
              <input
                type="text"
                value={translatedPinyin}
                onChange={(e) => setTranslatedPinyin(e.target.value)}
                placeholder="발음 가이드 (병음)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* English */}
            <div>
              <label className="text-[10px] text-emerald-400 block mb-0.5 font-bold">
                영어 번역 (English)
              </label>
              <input
                type="text"
                value={translatedEn}
                onChange={(e) => setTranslatedEn(e.target.value)}
                placeholder="영어 번역문"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Category Selection */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">카테고리</label>
              <div className="flex flex-wrap gap-1.5">
                {(['사용자 추가', '식당', '쇼핑', '결제', '택시', '응급', '기타'] as const).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        selectedCategory === cat
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddPhrase(false)}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleSaveCustomPhrase}
              disabled={!koreanInput.trim() || !translatedCn.trim()}
              className="flex-2 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>회화 목록에 저장하기</span>
            </button>
          </div>
        </div>
      )}

      {/* Search and Category Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="회화 검색 (고수, 맥주, 알리페이, 계산, 화장실 등)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          {phraseCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setPhraseFilter(cat)}
              className={`py-1 px-2.5 rounded-xl transition ${
                phraseFilter === cat
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
              {cat === '사용자 추가' && (
                <span className="ml-1 text-[10px] opacity-80">
                  ({phrases.filter((p) => p.isCustom || p.category === '사용자 추가').length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Phrases Cards List */}
      <div className="space-y-3">
        {filteredPhrases.length === 0 ? (
          <div className="text-center py-10 bg-slate-900 rounded-2xl border border-dashed border-slate-800 text-slate-400">
            <p className="text-xs">해당 검색어나 카테고리의 회화가 없습니다.</p>
            <button
              onClick={() => setShowAddPhrase(true)}
              className="mt-2 text-xs font-bold text-emerald-400 hover:underline"
            >
              + 새 회화 번역 & 추가하기
            </button>
          </div>
        ) : (
          filteredPhrases.map((p) => (
            <div
              key={p.id}
              className={`bg-slate-900 rounded-2xl p-4 border transition space-y-2.5 shadow-sm ${
                p.isCustom
                  ? 'border-emerald-500/40 hover:border-emerald-400/70'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        p.isCustom
                          ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40'
                          : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      }`}
                    >
                      {p.category}
                    </span>
                    {p.isCustom && (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                        직접 추가
                      </span>
                    )}
                  </div>

                  {/* Korean */}
                  <h3 className="text-sm font-bold text-slate-100">{p.kr}</h3>

                  {/* Chinese */}
                  <p className="text-xl sm:text-2xl font-black text-amber-400 select-all tracking-wide leading-tight">
                    {p.cn}
                  </p>

                  {/* Pinyin */}
                  {p.pinyin && (
                    <p className="text-xs text-cyan-300 font-mono">{p.pinyin}</p>
                  )}

                  {/* English */}
                  {p.en && (
                    <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5 pt-0.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 shrink-0">
                        EN
                      </span>
                      <span>{p.en}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  {/* Copy Chinese */}
                  <button
                    onClick={() => handleCopy(p.id, p.cn)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition"
                    title="중국어 복사"
                  >
                    {copiedId === p.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  {/* Fullscreen View */}
                  <button
                    onClick={() =>
                      onOpenTaxiModal({
                        title: p.kr,
                        cnText: p.cn,
                        pinyin: p.pinyin,
                        krDesc: p.en ? `${p.kr} (${p.en})` : p.kr,
                      })
                    }
                    className="p-2 text-amber-400 hover:text-amber-300 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
                    title="화면 크게 보여주기"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  {/* Delete Custom Phrase */}
                  {p.isCustom && (
                    <button
                      onClick={() => handleDeleteCustomPhrase(p.id, p.kr)}
                      className="p-2 text-rose-400 hover:text-rose-300 rounded-xl bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-800/60 transition"
                      title="회화 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* TTS Play Button */}
              <div className="flex gap-2 pt-1 border-t border-slate-800">
                <button
                  onClick={() => handleSpeak(p.id, p.audioText || p.cn)}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                    playingId === p.id
                      ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                      : 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 border border-cyan-800/80 active:scale-98'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{playingId === p.id ? '음성 재생 중...' : '🔊 점원에게 중국어 음성 들려주기'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
