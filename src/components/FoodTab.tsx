import React, { useState } from 'react';
import {
  Beer,
  Utensils,
  AlertTriangle,
  Volume2,
  Sparkles,
  Plus,
  Trash2,
  Compass,
  Car,
  Calendar,
  X,
  MapPin,
} from 'lucide-react';
import { BEER_GUIDE, FOOD_DELICACIES } from '../data/initialData';
import { FoodPlaceItem, DayNumber } from '../types';
import { speakChinese } from '../utils/tts';
import { openAmap } from '../utils/geo';

interface FoodTabProps {
  foodPlaces: FoodPlaceItem[];
  onUpdateFoodPlaces: (places: FoodPlaceItem[]) => void;
  onAddToItinerary: (foodPlace: FoodPlaceItem, day: DayNumber) => void;
  onOpenTaxiModal: (data: {
    title: string;
    cnText: string;
    pinyin?: string;
    krDesc?: string;
    addressCn?: string;
  }) => void;
  onShowToast: (msg: string) => void;
}

export const FoodTab: React.FC<FoodTabProps> = ({
  foodPlaces,
  onUpdateFoodPlaces,
  onAddToItinerary,
  onOpenTaxiModal,
  onShowToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'food' | 'beer' | 'tips'>('food');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  // Add restaurant modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNameCn, setNewNameCn] = useState('');
  const [newCategory, setNewCategory] = useState<FoodPlaceItem['category']>('맛집');
  const [newRecommended, setNewRecommended] = useState('');
  const [newPrice, setNewPrice] = useState('인당 ¥50~80');
  const [newAddressCn, setNewAddressCn] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Target day selector for adding to schedule
  const [addToScheduleId, setAddToScheduleId] = useState<string | null>(null);

  const categories = ['전체', '맛집', '생맥주펍', '야시장', '카페/디저트', '해산물'];

  const filteredPlaces =
    selectedCategory === '전체'
      ? foodPlaces
      : foodPlaces.filter((p) => p.category === selectedCategory);

  const handleSpeak = (text: string) => {
    const match = text.match(/"([^"]+)"/);
    const chineseText = match ? match[1] : text;

    const ok = speakChinese(chineseText);
    if (!ok) {
      onShowToast('음성 재생을 지원하지 않는 브라우저입니다.');
    } else {
      onShowToast('🔊 중국어 음성을 재생합니다.');
    }
  };

  const handleAddFoodPlace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      onShowToast('식당/맛집 이름을 입력해주세요.');
      return;
    }

    const newPlace: FoodPlaceItem = {
      id: `custom-fp-${Date.now()}`,
      name: newName.trim(),
      nameCn: newNameCn.trim() || newName.trim(),
      pinyin: '',
      category: newCategory,
      recommendedDish: newRecommended.trim() || '현지 추천 메뉴',
      priceRange: newPrice.trim() || '인당 ¥60',
      addressCn: newAddressCn.trim() || newNameCn.trim() || '青岛市',
      notes: newNotes.trim() || '내가 가고 싶은 위시 식당',
      isCustom: true,
    };

    onUpdateFoodPlaces([newPlace, ...foodPlaces]);
    setShowAddModal(false);
    setNewName('');
    setNewNameCn('');
    setNewRecommended('');
    setNewAddressCn('');
    setNewNotes('');
    onShowToast(`"${newPlace.name}" 맛집이 추가되었습니다!`);
  };

  const handleDeleteFoodPlace = (id: string) => {
    if (window.confirm('이 맛집 항목을 삭제하시겠습니까?')) {
      onUpdateFoodPlaces(foodPlaces.filter((p) => p.id !== id));
      onShowToast('맛집 항목이 삭제되었습니다.');
    }
  };

  const handleConfirmAddToSchedule = (place: FoodPlaceItem, day: DayNumber) => {
    onAddToItinerary(place, day);
    setAddToScheduleId(null);
    onShowToast(`"${place.name}"이(가) Day ${day} 일정표에 추가되었습니다!`);
  };

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-sm">
        <button
          onClick={() => setActiveSubTab('food')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'food'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>추천 맛집 & 내 식당</span>
        </button>
        <button
          onClick={() => setActiveSubTab('beer')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'beer'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Beer className="w-4 h-4" />
          <span>원장 맥주 가이드</span>
        </button>
        <button
          onClick={() => setActiveSubTab('tips')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'tips'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>식도락 안전수칙</span>
        </button>
      </div>

      {/* SUB-TAB 1: FOOD PLACES (RECOMMENDED + USER ADDED) */}
      {activeSubTab === 'food' && (
        <div className="space-y-3.5">
          {/* Header & Add Button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-amber-400" />
                <span>칭다오 맛집 & 맥주 펍 ({foodPlaces.length}곳)</span>
              </h2>
              <p className="text-[11px] text-slate-400">가고 싶은 식당을 직접 추가하고 바로 일정표에 넣을 수 있습니다.</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1 shadow-md transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>맛집 추가</span>
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`py-1 px-2.5 rounded-xl transition ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Add Restaurant Modal */}
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
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">가고 싶은 식당/맛집 등록</h3>
                    <p className="text-[11px] text-slate-400">칭다오에서 먹고 싶은 식당 정보를 저장하세요.</p>
                  </div>
                </div>

                <form onSubmit={handleAddFoodPlace} className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">식당명 (한국어) *</label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="예: 루하이 해산물 구이, 춘화루 본점"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">식당명 (中文)</label>
                      <input
                        type="text"
                        value={newNameCn}
                        onChange={(e) => setNewNameCn(e.target.value)}
                        placeholder="예: 鲁海海鲜烧烤"
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
                        <option value="맛집">맛집/로컬식당</option>
                        <option value="생맥주펍">생맥주펍/원장</option>
                        <option value="야시장">야시장/꼬치</option>
                        <option value="해산물">해산물 요리</option>
                        <option value="카페/디저트">카페/디저트</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">추천 메뉴 / 시그니처 요리</label>
                    <input
                      type="text"
                      value={newRecommended}
                      onChange={(e) => setNewRecommended(e.target.value)}
                      placeholder="예: 매운 가리비 볶음, 칭다오 원장 맥주, 탕수육"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">예상 가격대</label>
                      <input
                        type="text"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        placeholder="예: 인당 ¥50~70"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">중국어 주소</label>
                      <input
                        type="text"
                        value={newAddressCn}
                        onChange={(e) => setNewAddressCn(e.target.value)}
                        placeholder="예: 市南区中山路..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">메모 / 꿀팁</label>
                    <input
                      type="text"
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="예: 대기 시간 30분 있음, 브레이크 타임 없음"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none"
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
                      className="py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md"
                    >
                      등록하기
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Food Places Cards */}
          <div className="space-y-3">
            {filteredPlaces.map((place) => (
              <div
                key={place.id}
                className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-2.5 shadow-sm hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        {place.category}
                      </span>
                      {place.isCustom && (
                        <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                          내가 추가함
                        </span>
                      )}
                      <h3 className="font-bold text-sm text-slate-100">{place.name}</h3>
                    </div>
                    <p className="text-sm font-black text-amber-400 mt-1 select-all">{place.nameCn}</p>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {place.priceRange}
                    </span>
                    {place.isCustom && (
                      <button
                        onClick={() => handleDeleteFoodPlace(place.id)}
                        className="p-1 text-slate-500 hover:text-red-400 rounded-lg ml-1"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1 text-xs">
                  <div className="text-slate-300">
                    <strong className="text-amber-300">추천 메뉴:</strong> {place.recommendedDish}
                  </div>
                  {place.notes && (
                    <div className="text-[11px] text-slate-400">
                      <strong className="text-slate-500">팁/특징:</strong> {place.notes}
                    </div>
                  )}
                  {place.addressCn && (
                    <div className="text-[10px] text-slate-500 truncate">
                      📍 {place.addressCn}
                    </div>
                  )}
                </div>

                {/* Add to Schedule Selector Overlay */}
                {addToScheduleId === place.id && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl space-y-1.5 animate-in fade-in duration-150">
                    <span className="text-xs font-bold text-amber-300 block">
                      어느 날짜 일정표에 추가하시겠습니까?
                    </span>
                    <div className="flex items-center gap-1.5">
                      {([1, 2, 3] as DayNumber[]).map((d) => (
                        <button
                          key={d}
                          onClick={() => handleConfirmAddToSchedule(place, d)}
                          className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
                        >
                          Day {d} 일정에 넣기
                        </button>
                      ))}
                      <button
                        onClick={() => setAddToScheduleId(null)}
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
                    onClick={() => setAddToScheduleId(addToScheduleId === place.id ? null : place.id)}
                    className="flex-1 py-1.5 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl font-bold flex items-center justify-center gap-1 transition"
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>일정표에 추가</span>
                  </button>

                  <button
                    onClick={() =>
                      onOpenTaxiModal({
                        title: place.name,
                        cnText: place.addressCn || place.nameCn,
                        pinyin: place.pinyin,
                        krDesc: `${place.name} (${place.recommendedDish})`,
                        addressCn: place.addressCn,
                      })
                    }
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl font-bold flex items-center justify-center gap-1 transition"
                  >
                    <Car className="w-3.5 h-3.5 text-cyan-400" />
                    <span>택시 카드</span>
                  </button>

                  <button
                    onClick={() => openAmap(place.nameCn, place.addressCn)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-xl"
                    title="고덕지도 열기"
                  >
                    <Compass className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 4대 대표 요리 참고 */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <h3 className="font-bold text-xs text-amber-400">칭다오 시그니처 4대 미식 상식</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {FOOD_DELICACIES.map((food, idx) => (
                <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="font-bold text-slate-200 text-[11px] truncate">{food.name}</div>
                  <div className="text-[10px] text-amber-400 font-mono">{food.priceRange}</div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">{food.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BEER GUIDE */}
      {activeSubTab === 'beer' && (
        <div className="space-y-3.5">
          <div className="bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 p-4 rounded-2xl border border-amber-500/30">
            <h2 className="font-black text-sm text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>칭다오에 왔다면 무조건 마셔야 할 5대 맥주</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              칭다오 맥주는 공장 번호와 보관 방식에 따라 맛이 완전히 다릅니다. 특히 당일 생산 효모가 살아있는 <strong className="text-amber-400">원장(原浆)</strong>과 <strong className="text-amber-400">비닐봉지 생맥주</strong>는 절대 놓치지 마세요!
            </p>
          </div>

          <div className="space-y-3">
            {BEER_GUIDE.map((beer, i) => (
              <div
                key={i}
                className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-2.5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      {beer.tag}
                    </span>
                    <h3 className="font-bold text-sm text-slate-100 mt-1">{beer.name}</h3>
                  </div>
                  <div className="text-right text-[11px] text-cyan-400 font-mono">
                    <span>도수 {beer.alcohol}</span>
                    <span className="block text-[10px] text-slate-400">{beer.shelfLife}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{beer.desc}</p>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="text-slate-500 font-semibold shrink-0">📍 추천 음용 장소:</span>
                    <span className="text-slate-300">{beer.whereToDrink}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-800/80">
                    <div className="text-amber-300 text-[11px] font-medium truncate">
                      💡 주문 팁: {beer.orderTip}
                    </div>
                    <button
                      onClick={() => handleSpeak(beer.orderTip)}
                      className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 transition"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>주문 음성</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: FOOD SAFETY TIPS */}
      {activeSubTab === 'tips' && (
        <div className="space-y-3">
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3 shadow-sm">
            <h3 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>여행자 필수 위생 & 식사 에티켓</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <h4 className="font-bold text-slate-100 text-xs">1. 수돗물 절대 음용 금지 (생수 구매)</h4>
                <p className="text-slate-400 text-[11px]">
                  호텔 수돗물(양치 포함)은 석회질이 포함되어 배탈의 원인이 됩니다. 반드시 편의점/마트에서 빨간 뚜껑의 농푸산천(农夫山泉 / 약 2元) 또는 왓슨스(Watsons) 생수를 구매해 마시세요.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <h4 className="font-bold text-slate-100 text-xs">2. 고수(샹차이) 못 드시는 분 필수 문장</h4>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono text-sm font-black text-amber-400">不要香菜 (Bú yào xiāngcài)</span>
                  <button
                    onClick={() => handleSpeak('不要香菜')}
                    className="px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>음성</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <h4 className="font-bold text-slate-100 text-xs">3. 조개·해산물 섭취 주의</h4>
                <p className="text-slate-400 text-[11px]">
                  바지락 볶음(라차오갈라)을 먹을 때 입이 벌어지지 않은 조개는 상했을 위험이 있으니 억지로 열어 먹지 마세요. 생맥주와 차가운 해산물을 과식하면 장염이 오기 쉬우니 정로환/지사제를 챙겨두세요.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <h4 className="font-bold text-slate-100 text-xs">4. 테이블 휴지 및 물티슈 유료</h4>
                <p className="text-slate-400 text-[11px]">
                  대부분의 중국 로컬 식당에서는 테이블 위에 놓인 비닐 포장된 식기나 물티슈를 뜯으면 결제서(小票)에 1~2元씩 추가됩니다. 아까우신 분들은 개인 포켓 티슈를 가방에 상시 지참하세요!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
