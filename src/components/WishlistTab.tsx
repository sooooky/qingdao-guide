import React, { useState } from 'react';
import {
  Heart,
  Plus,
  Trash2,
  Compass,
  Car,
  Calendar,
  CheckCircle2,
  Circle,
  Sparkles,
  Clock,
  MapPin,
  X,
  ExternalLink,
} from 'lucide-react';
import { WishlistItem, DayNumber } from '../types';
import { openAmap } from '../utils/geo';

interface WishlistTabProps {
  wishlist: WishlistItem[];
  onUpdateWishlist: (items: WishlistItem[]) => void;
  onAddToItinerary: (wishItem: WishlistItem, day: DayNumber) => void;
  onOpenTaxiModal: (data: {
    title: string;
    cnText: string;
    pinyin?: string;
    krDesc?: string;
    addressCn?: string;
  }) => void;
  onShowToast: (msg: string) => void;
}

export const WishlistTab: React.FC<WishlistTabProps> = ({
  wishlist,
  onUpdateWishlist,
  onAddToItinerary,
  onOpenTaxiModal,
  onShowToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [showAddModal, setShowAddModal] = useState(false);
  const [scheduleTargetId, setScheduleTargetId] = useState<string | null>(null);

  // Form states for adding custom wishlist spot
  const [newTitle, setNewTitle] = useState('');
  const [newTitleCn, setNewTitleCn] = useState('');
  const [newCategory, setNewCategory] = useState<WishlistItem['category']>('풍경/포토');
  const [newDesc, setNewDesc] = useState('');
  const [newWhyVisit, setNewWhyVisit] = useState('');
  const [newTimeNeeded, setNewTimeNeeded] = useState(60);
  const [newAddressCn, setNewAddressCn] = useState('');

  const categories = ['전체', '풍경/포토', '카페/골목', '야경/바', '해변/자연', '문화/역사'];

  const filteredItems =
    selectedCategory === '전체'
      ? wishlist
      : wishlist.filter((w) => w.category === selectedCategory);

  const visitedCount = wishlist.filter((w) => w.visited).length;

  const handleToggleVisited = (id: string) => {
    onUpdateWishlist(
      wishlist.map((w) => (w.id === id ? { ...w, visited: !w.visited } : w))
    );
  };

  const handleAddCustomWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      onShowToast('명소 이름을 입력해주세요.');
      return;
    }

    const newItem: WishlistItem = {
      id: `custom-wish-${Date.now()}`,
      title: newTitle.trim(),
      titleCn: newTitleCn.trim() || newTitle.trim(),
      pinyin: '',
      category: newCategory,
      desc: newDesc.trim() || '내가 가보고 싶은 위시 스팟',
      addressCn: newAddressCn.trim() || newTitleCn.trim() || '青岛市',
      timeNeededMinutes: Number(newTimeNeeded) || 60,
      visited: false,
      whyVisit: newWhyVisit.trim() || '시간 여유가 될 때 방문 추천',
      isCustom: true,
      lat: 36.0671,
      lng: 120.3826,
    };

    onUpdateWishlist([newItem, ...wishlist]);
    setShowAddModal(false);
    setNewTitle('');
    setNewTitleCn('');
    setNewDesc('');
    setNewWhyVisit('');
    setNewAddressCn('');
    onShowToast(`"${newItem.title}" 위시 명소가 등록되었습니다!`);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('이 위시리스트 항목을 삭제하시겠습니까?')) {
      onUpdateWishlist(wishlist.filter((w) => w.id !== id));
      onShowToast('위시리스트 항목이 삭제되었습니다.');
    }
  };

  const handleConfirmAddToSchedule = (wishItem: WishlistItem, day: DayNumber) => {
    onAddToItinerary(wishItem, day);
    setScheduleTargetId(null);
    onShowToast(`"${wishItem.title}"이(가) Day ${day} 일정표로 전송되었습니다!`);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Progress */}
      <div className="bg-gradient-to-r from-rose-500/15 via-slate-900 to-slate-900 rounded-2xl p-4 border border-rose-500/30 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Heart className="w-5 h-5 fill-rose-500/40 text-rose-400" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <span>여유 시간 주변 명소 위시리스트</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                메인 일정 외에 시간이 남거나 동선이 맞을 때 갈 수 있는 후보지입니다.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="py-1.5 px-3 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md transition active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>위시 추가</span>
          </button>
        </div>

        {/* Progress Strip */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
          <span className="text-slate-400">
            총 {wishlist.length}곳 중 <strong className="text-rose-400">{visitedCount}곳</strong> 방문 완료
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            원클릭으로 스케줄러(Day 1~3) 연동 가능
          </span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-1.5 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`py-1 px-2.5 rounded-xl transition ${
              selectedCategory === cat
                ? 'bg-rose-500 text-white font-bold shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add Wishlist Item Modal */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-md w-full shadow-2xl relative space-y-3.5 max-h-[90vh] overflow-y-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">새 위시리스트 명소 등록</h3>
                <p className="text-[11px] text-slate-400">여유 시간이 생길 때 방문할 명소를 기록하세요.</p>
              </div>
            </div>

            <form onSubmit={handleAddCustomWish} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">명소 이름 (한국어) *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="예: 롱화루 독일풍 골목, 노산 케이블카"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">명소명 (中文)</label>
                  <input
                    type="text"
                    value={newTitleCn}
                    onChange={(e) => setNewTitleCn(e.target.value)}
                    placeholder="예: 龙华路老街"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-bold placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">카테고리</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none"
                  >
                    <option value="풍경/포토">풍경/포토</option>
                    <option value="카페/골목">카페/골목</option>
                    <option value="야경/바">야경/바</option>
                    <option value="해변/자연">해변/자연</option>
                    <option value="문화/역사">문화/역사</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">추천 이유 / 꿀팁</label>
                <input
                  type="text"
                  value={newWhyVisit}
                  onChange={(e) => setNewWhyVisit(e.target.value)}
                  placeholder="예: 노을 질 때 붉은 암초 뷰 최고, 인생 사진 명소"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">예상 소요 시간 (분)</label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={newTimeNeeded}
                    onChange={(e) => setNewTimeNeeded(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-400 font-mono text-center focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">중국어 세부 주소</label>
                  <input
                    type="text"
                    value={newAddressCn}
                    onChange={(e) => setNewAddressCn(e.target.value)}
                    placeholder="예: 市南区..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">간단한 설명</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="명소의 주요 볼거리나 특징을 적어보세요."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-black rounded-xl shadow-md"
                >
                  위시 등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wishlist Cards */}
      <div className="space-y-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`bg-slate-900 rounded-2xl p-4 border transition-all duration-150 space-y-2.5 shadow-sm ${
              item.visited
                ? 'border-slate-800/60 opacity-60 bg-slate-950/40'
                : 'border-slate-800 hover:border-rose-500/40'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start space-x-2.5 flex-1">
                <button
                  onClick={() => handleToggleVisited(item.id)}
                  className="mt-0.5 text-slate-400 hover:text-emerald-400 transition"
                  title={item.visited ? '미방문으로 변경' : '방문 완료 체크'}
                >
                  {item.visited ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500" />
                  )}
                </button>

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                      {item.category}
                    </span>
                    {item.isCustom && (
                      <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                        내가 추가함
                      </span>
                    )}
                    <h3
                      className={`font-bold text-sm text-slate-100 ${
                        item.visited ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs font-black text-amber-400 select-all">{item.titleCn}</p>
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                <span className="text-[11px] font-mono text-cyan-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>약 {item.timeNeededMinutes}분</span>
                </span>
                {item.isCustom && (
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1 text-slate-500 hover:text-red-400 rounded-lg ml-1"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>

            {/* Why visit highlight note */}
            {item.whyVisit && (
              <div className="bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 text-xs text-rose-200 flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong>추천 이유:</strong> {item.whyVisit}
                </span>
              </div>
            )}

            {item.addressCn && (
              <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{item.addressCn}</span>
              </div>
            )}

            {/* Target Day Selector Overlay */}
            {scheduleTargetId === item.id && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl space-y-1.5 animate-in fade-in duration-150">
                <span className="text-xs font-bold text-amber-300 block">
                  어느 날짜 일정표에 넣으시겠습니까?
                </span>
                <div className="flex items-center gap-1.5">
                  {([1, 2, 3] as DayNumber[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => handleConfirmAddToSchedule(item, d)}
                      className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
                    >
                      Day {d} 일정에 넣기
                    </button>
                  ))}
                  <button
                    onClick={() => setScheduleTargetId(null)}
                    className="px-2.5 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-1.5 text-xs">
              <button
                onClick={() =>
                  setScheduleTargetId(scheduleTargetId === item.id ? null : item.id)
                }
                className="flex-1 py-1.5 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl font-bold flex items-center justify-center gap-1 transition"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>일정에 넣기</span>
              </button>

              <button
                onClick={() =>
                  onOpenTaxiModal({
                    title: item.title,
                    cnText: item.addressCn || item.titleCn,
                    pinyin: item.pinyin,
                    krDesc: `${item.title} (${item.desc})`,
                    addressCn: item.addressCn,
                  })
                }
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl font-bold flex items-center justify-center gap-1 transition"
              >
                <Car className="w-3.5 h-3.5 text-cyan-400" />
                <span>택시 카드</span>
              </button>

              <button
                onClick={() => openAmap(item.titleCn, item.addressCn)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-xl"
                title="고덕지도 열기"
              >
                <Compass className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
