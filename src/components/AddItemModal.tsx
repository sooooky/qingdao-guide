import React, { useState } from 'react';
import { X, Plus, MapPin } from 'lucide-react';
import { ScheduleItem, DayNumber } from '../types';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDay: DayNumber;
  onAdd: (item: ScheduleItem) => void;
  onShowToast: (msg: string) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  defaultDay,
  onAdd,
  onShowToast,
}) => {
  const [day, setDay] = useState<DayNumber>(defaultDay);
  const [title, setTitle] = useState('');
  const [titleCn, setTitleCn] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [category, setCategory] = useState<ScheduleItem['category']>('attraction');
  const [startTime, setStartTime] = useState('14:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [transitMinutes, setTransitMinutes] = useState(20);
  const [estimatedCostCny, setEstimatedCostCny] = useState(0);
  const [desc, setDesc] = useState('');
  const [addressCn, setAddressCn] = useState('');
  const [tips, setTips] = useState('');
  const [cilantroWarning, setCilantroWarning] = useState(false);
  const [beerSpecial, setBeerSpecial] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onShowToast('일정 제목을 입력해주세요.');
      return;
    }

    const newItem: ScheduleItem = {
      id: `custom-${Date.now()}`,
      day,
      startTime: startTime || '12:00',
      durationMinutes: Number(durationMinutes) || 60,
      transitMinutes: Number(transitMinutes) || 15,
      title: title.trim(),
      titleCn: titleCn.trim() || title.trim(),
      pinyin: pinyin.trim(),
      category,
      desc: desc.trim() || '사용자 추가 일정',
      estimatedCostCny: Number(estimatedCostCny) || 0,
      completed: false,
      addressCn: addressCn.trim() || titleCn.trim() || '青岛市',
      tips: tips.trim(),
      badges: {
        cilantroWarning,
        beerSpecial,
        alipayRequired: true,
      },
      lat: 36.0671, // default central Qingdao
      lng: 120.3826,
    };

    onAdd(newItem);
    onShowToast(`"${title}" 일정이 추가되었습니다.`);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">새 일정 추가</h2>
            <p className="text-xs text-slate-400">원하는 장소나 맛집을 직접 일정표에 추가하세요.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Day selection */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold">여행 날짜</label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDay(d as DayNumber)}
                  className={`py-2 rounded-xl font-bold transition ${
                    day === d
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  Day {d}
                </button>
              ))}
            </div>
          </div>

          {/* Title KR & CN */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold">장소 / 일정명 (한국어) *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 루쉰 공원, 진취덕 오리구이"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">중국어 표기 (中文)</label>
              <input
                type="text"
                value={titleCn}
                onChange={(e) => setTitleCn(e.target.value)}
                placeholder="예: 鲁迅公园"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="attraction">관광/명소</option>
                <option value="food">식당/맛집</option>
                <option value="shopping">쇼핑/야시장</option>
                <option value="transport">교통/이동</option>
                <option value="hotel">숙소/호텔</option>
              </select>
            </div>
          </div>

          {/* Detailed Chinese Address */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>중국어 세부 주소 (택시 기사 소통 및 지도용)</span>
            </label>
            <input
              type="text"
              value={addressCn}
              onChange={(e) => setAddressCn(e.target.value)}
              placeholder="예: 青岛市市南区琴屿路1号"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono text-[11px]"
            />
          </div>

          {/* Time & Durations */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">시작 시간</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-cyan-400 font-mono text-center focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">체류 (분)</label>
              <input
                type="number"
                min={5}
                step={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-slate-200 text-center focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">예상비용(¥)</label>
              <input
                type="number"
                min={0}
                value={estimatedCostCny}
                onChange={(e) => setEstimatedCostCny(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-amber-400 text-center font-bold focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Description & Tips */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold">메모 / 꿀팁</label>
            <input
              type="text"
              value={tips}
              onChange={(e) => setTips(e.target.value)}
              placeholder="예: 일몰 30분 전 방문 추천, 토마토탕 주문"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Special Badges Checkboxes */}
          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
              <input
                type="checkbox"
                checked={cilantroWarning}
                onChange={(e) => setCilantroWarning(e.target.checked)}
                className="rounded accent-amber-500 w-4 h-4"
              />
              <span>🌿 고수 주의 (식당)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
              <input
                type="checkbox"
                checked={beerSpecial}
                onChange={(e) => setBeerSpecial(e.target.checked)}
                className="rounded accent-amber-500 w-4 h-4"
              />
              <span>🍺 맥주 명소</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
            >
              취소
            </button>
            <button
              type="submit"
              className="py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition shadow-lg"
            >
              일정 등록하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
