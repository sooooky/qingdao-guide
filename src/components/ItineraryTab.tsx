import React, { useState } from 'react';
import {
  Clock,
  ArrowUp,
  ArrowDown,
  Archive,
  RotateCcw,
  Plus,
  Trash2,
  Compass,
  MapPin,
  Car,
  CheckCircle2,
  Circle,
  Sparkles,
  AlertCircle,
  Footprints,
  Flame,
  Beer as BeerIcon,
  FileText,
  Image as ImageIcon,
  Upload,
  Check,
  X,
  Paperclip,
} from 'lucide-react';
import { ScheduleItem, DayNumber, ItemAttachment } from '../types';
import { openAmap, openBaidu, recalculateCascade } from '../utils/geo';
import { compressImageFile } from '../utils/attachmentStorage';

interface ItineraryTabProps {
  allItinerary: ScheduleItem[];
  backupPool: ScheduleItem[];
  exchangeRate: number;
  onUpdateItinerary: (items: ScheduleItem[]) => void;
  onUpdateBackupPool: (items: ScheduleItem[]) => void;
  onOpenTaxiModal: (data: {
    title: string;
    cnText: string;
    pinyin?: string;
    krDesc?: string;
    addressCn?: string;
  }) => void;
  onOpenAttachmentViewer: (
    attachment: ItemAttachment,
    scheduleTitle: string,
    onDelete?: (attId: string) => void
  ) => void;
  onOpenAddItem: (day: DayNumber) => void;
  onShowToast: (msg: string) => void;
}

export const ItineraryTab: React.FC<ItineraryTabProps> = ({
  allItinerary,
  backupPool,
  exchangeRate,
  onUpdateItinerary,
  onUpdateBackupPool,
  onOpenTaxiModal,
  onOpenAttachmentViewer,
  onOpenAddItem,
  onShowToast,
}) => {
  const [selectedDay, setSelectedDay] = useState<'all' | 'backup' | DayNumber>(1);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Personal notes inline editor state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<string>('');

  // Uploading indicator
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);

  // Active items
  const activeItems =
    selectedDay === 'backup'
      ? backupPool
      : selectedDay === 'all'
      ? allItinerary
      : allItinerary.filter((i) => i.day === selectedDay);

  // Stats calculation
  const totalCostCny = activeItems.reduce((acc, curr) => acc + (curr.estimatedCostCny || 0), 0);
  const totalCostKrw = Math.round(totalCostCny * exchangeRate);
  const completedCount = activeItems.filter((i) => i.completed).length;

  const handleToggleComplete = (id: string, isBackup: boolean) => {
    if (isBackup) {
      onUpdateBackupPool(
        backupPool.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
      );
    } else {
      onUpdateItinerary(
        allItinerary.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
      );
    }
  };

  const handleFieldChange = (
    id: string,
    field: keyof ScheduleItem,
    value: any,
    isBackup: boolean
  ) => {
    if (isBackup) {
      onUpdateBackupPool(
        backupPool.map((item) => (item.id === id ? { ...item, [field]: value } : item))
      );
    } else {
      onUpdateItinerary(
        allItinerary.map((item) => (item.id === id ? { ...item, [field]: value } : item))
      );
    }
  };

  const handleMoveOrder = (id: string, direction: 'up' | 'down') => {
    const list = [...allItinerary];
    const currentIndex = list.findIndex((i) => i.id === id);
    if (currentIndex === -1) return;

    if (direction === 'up' && currentIndex > 0) {
      const temp = list[currentIndex];
      list[currentIndex] = list[currentIndex - 1];
      list[currentIndex - 1] = temp;
      onUpdateItinerary(list);
      onShowToast('일정 순서가 위로 이동되었습니다.');
    } else if (direction === 'down' && currentIndex < list.length - 1) {
      const temp = list[currentIndex];
      list[currentIndex] = list[currentIndex + 1];
      list[currentIndex + 1] = temp;
      onUpdateItinerary(list);
      onShowToast('일정 순서가 아래로 이동되었습니다.');
    }
  };

  const handleCascadeCascade = () => {
    if (typeof selectedDay === 'number') {
      const dayItems = allItinerary.filter((i) => i.day === selectedDay);
      if (dayItems.length === 0) return;
      const updatedDayItems = recalculateCascade(dayItems);
      const remainingItems = allItinerary.filter((i) => i.day !== selectedDay);
      onUpdateItinerary([...remainingItems, ...updatedDayItems].sort((a, b) => a.day - b.day));
      onShowToast(`Day ${selectedDay} 일정 시작 시간이 순서대로 자동 계산되었습니다!`);
    } else {
      onShowToast('특정 Day(1, 2, 3)를 선택한 후 시간을 정렬해주세요.');
    }
  };

  const handleMoveToBackup = (item: ScheduleItem) => {
    onUpdateItinerary(allItinerary.filter((i) => i.id !== item.id));
    onUpdateBackupPool([item, ...backupPool]);
    onShowToast(`"${item.title}" 항목이 예비 목록으로 이동되었습니다.`);
  };

  const handleRestoreFromBackup = (item: ScheduleItem, targetDay: DayNumber) => {
    onUpdateBackupPool(backupPool.filter((i) => i.id !== item.id));
    onUpdateItinerary([...allItinerary, { ...item, day: targetDay }]);
    onShowToast(`"${item.title}" 항목이 Day ${targetDay} 일정으로 복원되었습니다.`);
  };

  const handleDeleteItem = (id: string, isBackup: boolean) => {
    if (window.confirm('정말 이 일정을 삭제하시겠습니까?')) {
      if (isBackup) {
        onUpdateBackupPool(backupPool.filter((i) => i.id !== id));
      } else {
        onUpdateItinerary(allItinerary.filter((i) => i.id !== id));
      }
      onShowToast('일정이 삭제되었습니다.');
    }
  };

  const handleStartEditNote = (item: ScheduleItem) => {
    setEditingNoteId(item.id);
    setNoteInput(item.personalNotes || '');
  };

  const handleSaveNote = (itemId: string, isBackup: boolean) => {
    if (isBackup) {
      onUpdateBackupPool(
        backupPool.map((i) => (i.id === itemId ? { ...i, personalNotes: noteInput.trim() } : i))
      );
    } else {
      onUpdateItinerary(
        allItinerary.map((i) => (i.id === itemId ? { ...i, personalNotes: noteInput.trim() } : i))
      );
    }
    setEditingNoteId(null);
    onShowToast('개인 메모가 저장되었습니다.');
  };

  const handleAttachmentUpload = async (
    itemId: string,
    files: FileList | null,
    isBackup: boolean
  ) => {
    if (!files || files.length === 0) return;
    setUploadingItemId(itemId);

    try {
      const newAttachments: ItemAttachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressImageFile(file);
        newAttachments.push({
          id: `att-${Date.now()}-${i}`,
          name: file.name.replace(/\.[^/.]+$/, '') || '캡쳐 사진',
          dataUrl: compressed,
          size: file.size,
          type: file.type,
          createdAt: new Date().toISOString(),
        });
      }

      if (isBackup) {
        onUpdateBackupPool(
          backupPool.map((i) =>
            i.id === itemId
              ? { ...i, attachments: [...(i.attachments || []), ...newAttachments] }
              : i
          )
        );
      } else {
        onUpdateItinerary(
          allItinerary.map((i) =>
            i.id === itemId
              ? { ...i, attachments: [...(i.attachments || []), ...newAttachments] }
              : i
          )
        );
      }
      onShowToast(`${newAttachments.length}장의 사진이 오프라인 보관함에 저장되었습니다!`);
    } catch (err) {
      console.error(err);
      onShowToast('사진 압축 및 저장 중 오류가 발생했습니다.');
    } finally {
      setUploadingItemId(null);
    }
  };

  const handleDeleteAttachment = (
    itemId: string,
    attachmentId: string,
    isBackup: boolean
  ) => {
    if (isBackup) {
      onUpdateBackupPool(
        backupPool.map((i) =>
          i.id === itemId
            ? { ...i, attachments: (i.attachments || []).filter((a) => a.id !== attachmentId) }
            : i
        )
      );
    } else {
      onUpdateItinerary(
        allItinerary.map((i) =>
          i.id === itemId
            ? { ...i, attachments: (i.attachments || []).filter((a) => a.id !== attachmentId) }
            : i
        )
      );
    }
    onShowToast('캡쳐 사진이 삭제되었습니다.');
  };

  return (
    <div className="space-y-3.5">
      {/* Day Selector Segmented Bar */}
      <div className="flex items-center justify-between bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-sm">
        {([1, 2, 3] as DayNumber[]).map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              selectedDay === d
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Day {d}
          </button>
        ))}
        <button
          onClick={() => setSelectedDay('all')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition ${
            selectedDay === 'all'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setSelectedDay('backup')}
          className={`px-3 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1 ${
            selectedDay === 'backup'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>예비 ({backupPool.length})</span>
        </button>
      </div>

      {/* Summary Stat Strip */}
      <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div>
            <span className="text-[10px] text-slate-400 block">
              {selectedDay === 'backup'
                ? '예비 후보지'
                : selectedDay === 'all'
                ? '전체 총 비용'
                : `Day ${selectedDay} 예상 경비`}
            </span>
            <div className="flex items-baseline gap-1.5 font-bold">
              <span className="text-amber-400 text-sm font-black">¥{totalCostCny}</span>
              <span className="text-[11px] text-slate-400">({totalCostKrw.toLocaleString()}원)</span>
            </div>
          </div>
          <div className="border-l border-slate-800 pl-3">
            <span className="text-[10px] text-slate-400 block">방문 진행률</span>
            <span className="text-cyan-400 font-bold">
              {completedCount}/{activeItems.length} 완료
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {typeof selectedDay === 'number' && (
            <button
              onClick={handleCascadeCascade}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-xl text-[11px] font-bold transition flex items-center gap-1"
              title="이전 일정 체류 및 이동시간 기준 다음 시작시간 자동 계산"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>시간 연쇄정렬</span>
            </button>
          )}

          <button
            onClick={() => onOpenAddItem(typeof selectedDay === 'number' ? selectedDay : 1)}
            className="py-1.5 px-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-[11px] font-black transition flex items-center gap-1 shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>일정 추가</span>
          </button>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {activeItems.length === 0 ? (
          <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-400">등록된 일정이 없습니다.</p>
            <button
              onClick={() => onOpenAddItem(typeof selectedDay === 'number' ? selectedDay : 1)}
              className="py-2 px-4 bg-amber-500 text-slate-950 rounded-xl font-bold text-xs"
            >
              새 일정 추가하기
            </button>
          </div>
        ) : (
          activeItems.map((item, idx) => {
            const isBackup = selectedDay === 'backup';
            const isEditing = editingId === item.id;

            return (
              <div
                key={item.id}
                className={`bg-slate-900/90 rounded-2xl p-4 border transition-all duration-150 space-y-3 ${
                  item.completed
                    ? 'border-slate-800/60 opacity-70 bg-slate-950/40'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Card Top Row: Time, Day, Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleComplete(item.id, isBackup)}
                      className="text-slate-400 hover:text-emerald-400 transition"
                      title={item.completed ? '미방문으로 변경' : '방문 완료 체크'}
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500" />
                      )}
                    </button>

                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-mono font-bold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>{item.startTime}</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        Day {item.day} · {idx + 1}번째
                      </span>
                    </div>
                  </div>

                  {/* Reorder and backup controls */}
                  <div className="flex items-center space-x-1">
                    {!isBackup && (
                      <>
                        <button
                          onClick={() => handleMoveOrder(item.id, 'up')}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/80 hover:bg-slate-800 transition"
                          title="위로 이동"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveOrder(item.id, 'down')}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/80 hover:bg-slate-800 transition"
                          title="아래로 이동"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveToBackup(item)}
                          className="p-1.5 text-emerald-400 hover:text-emerald-300 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition"
                          title="예비 일정 보관함으로 이동"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {isBackup && (
                      <div className="flex items-center space-x-1">
                        {([1, 2, 3] as DayNumber[]).map((d) => (
                          <button
                            key={d}
                            onClick={() => handleRestoreFromBackup(item, d)}
                            className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-lg text-[10px] font-bold flex items-center gap-1"
                            title={`Day ${d} 일정으로 복원`}
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Day {d} 복원</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => handleDeleteItem(item.id, isBackup)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition"
                      title="완전 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title & Cost */}
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3
                      className={`font-bold text-sm text-slate-100 ${
                        item.completed ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {item.title}
                    </h3>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-amber-400">
                        ¥{item.estimatedCostCny}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        약 {Math.round(item.estimatedCostCny * exchangeRate).toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-amber-400/90 mt-0.5 select-all">
                    {item.titleCn} {item.pinyin && <span className="text-slate-400 text-[11px] font-normal">({item.pinyin})</span>}
                  </p>

                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.desc}</p>
                </div>

                {/* Editable Chinese Name & Address Inputs */}
                <div className="space-y-1.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] gap-2">
                    <span className="text-slate-400 font-semibold shrink-0">📍 장소명(中文):</span>
                    <input
                      type="text"
                      value={item.titleCn}
                      onChange={(e) => handleFieldChange(item.id, 'titleCn', e.target.value, isBackup)}
                      className="bg-slate-900 text-amber-300 font-bold px-2 py-0.5 rounded border border-slate-700/80 text-right w-full max-w-[220px] focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] gap-2">
                    <span className="text-slate-400 font-semibold shrink-0">🏠 세부주소(中文):</span>
                    <input
                      type="text"
                      value={item.addressCn}
                      onChange={(e) => handleFieldChange(item.id, 'addressCn', e.target.value, isBackup)}
                      className="bg-slate-900 text-slate-200 px-2 py-0.5 rounded border border-slate-700/80 text-right w-full max-w-[220px] focus:outline-none focus:border-cyan-400 text-[11px]"
                    />
                  </div>
                </div>

                {/* Practical Tips & Badges */}
                <div className="space-y-1.5">
                  {item.tips && (
                    <div className="flex items-start gap-1.5 text-xs text-slate-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-xl">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{item.tips}</span>
                    </div>
                  )}

                  {/* Clean unboxed metadata tags (frontend-design zero-pill discipline) */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400 pt-0.5">
                    <span>체류 {item.durationMinutes}분</span>
                    <span aria-hidden="true">·</span>
                    <span>이동 약 {item.transitMinutes}분</span>
                    {item.badges.beerSpecial && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <BeerIcon className="w-3 h-3 inline" /> 맥주 성지
                        </span>
                      </>
                    )}
                    {item.badges.cilantroWarning && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Flame className="w-3 h-3 inline" /> 고수 주의
                        </span>
                      </>
                    )}
                    {item.badges.walkingLevel === 'high' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-cyan-400 font-semibold flex items-center gap-1">
                          <Footprints className="w-3 h-3 inline" /> 보행량 많음
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* --- 1. Personal Offline Traveler Notes (여행자 개인 메모) --- */}
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5">
                  {editingNoteId === item.id ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          <span>오프라인 여행자 메모 작성</span>
                        </span>
                        <span className="text-[10px] text-slate-400">인터넷 없이도 상시 확인 가능</span>
                      </div>
                      <textarea
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="예: 호텔 예약번호 CN-88392 / 보증금 200元 현금 준비 / 지하철 3번 출구"
                        rows={2}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 text-xs"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingNoteId(null)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold"
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveNote(item.id, isBackup)}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px]"
                        >
                          메모 저장
                        </button>
                      </div>
                    </div>
                  ) : item.personalNotes ? (
                    <div className="flex items-start justify-between gap-2 text-xs">
                      <div className="flex items-start gap-1.5 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 block">내 메모:</span>
                          <p className="text-slate-200 text-xs whitespace-pre-wrap break-words font-medium">
                            {item.personalNotes}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartEditNote(item)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold px-2 py-0.5 bg-slate-900 rounded-md shrink-0 border border-slate-800"
                      >
                        수정
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartEditNote(item)}
                      className="w-full py-1 text-[11px] text-slate-400 hover:text-amber-400 flex items-center justify-center gap-1 transition"
                    >
                      <Plus className="w-3 h-3" />
                      <span>오프라인 메모 추가 (예약번호, 입장권 코드 등)</span>
                    </button>
                  )}
                </div>

                {/* --- 2. Offline Screenshots & Vouchers (캡쳐 사진/바우처 첨부) --- */}
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                      <span>오프라인 캡쳐 사진/바우처</span>
                      {(item.attachments || []).length > 0 && (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded font-mono">
                          {item.attachments?.length}장
                        </span>
                      )}
                    </div>

                    <label className="cursor-pointer py-1 px-2.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800/60 rounded-lg text-[11px] font-bold flex items-center gap-1 transition">
                      <Upload className="w-3 h-3 text-cyan-400" />
                      <span>{uploadingItemId === item.id ? '저장 중...' : '+ 사진/캡쳐 첨부'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={uploadingItemId === item.id}
                        onChange={(e) => handleAttachmentUpload(item.id, e.target.files, isBackup)}
                      />
                    </label>
                  </div>

                  {/* Thumbnail Row */}
                  {(item.attachments || []).length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                      {item.attachments?.map((att) => (
                        <div
                          key={att.id}
                          className="relative group rounded-lg overflow-hidden border border-slate-800 bg-slate-900"
                        >
                          <div
                            onClick={() =>
                              onOpenAttachmentViewer(att, item.title, (id) =>
                                handleDeleteAttachment(item.id, id, isBackup)
                              )
                            }
                            className="aspect-video cursor-pointer w-full overflow-hidden"
                          >
                            <img
                              src={att.dataUrl}
                              alt={att.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>

                          <div className="p-1 bg-slate-950/90 flex items-center justify-between gap-1">
                            <span className="text-[10px] text-slate-300 truncate font-medium">
                              {att.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(item.id, att.id, isBackup)}
                              className="text-slate-500 hover:text-red-400 transition shrink-0 p-0.5"
                              title="삭제"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      공항이나 현지에서 인터넷이 안 될 때를 대비해 바우처나 지도를 미리 캡쳐해 첨부해두세요.
                    </p>
                  )}
                </div>

                {/* Action Buttons: Amap, Baidu, Taxi Flashcard */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-1.5">
                  <button
                    onClick={() => openAmap(item.titleCn, item.addressCn)}
                    className="flex-1 py-2 px-2 bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition active:scale-95"
                  >
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    <span>고덕지도</span>
                  </button>

                  <button
                    onClick={() => openBaidu(item.titleCn, item.addressCn)}
                    className="flex-1 py-2 px-2 bg-blue-950/70 hover:bg-blue-900 text-blue-300 border border-blue-800/80 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition active:scale-95"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>바이두지도</span>
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
                    className="py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition active:scale-95"
                  >
                    <Car className="w-3.5 h-3.5 text-amber-400" />
                    <span>택시 번역</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
