import React, { useState } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  PhoneCall,
  ShieldAlert,
  Info,
  Building,
} from 'lucide-react';
import { ChecklistItem } from '../types';
import { EMERGENCY_CONTACTS } from '../data/initialData';

interface ChecklistTabProps {
  checklist: ChecklistItem[];
  onUpdateChecklist: (items: ChecklistItem[]) => void;
  onShowToast: (msg: string) => void;
}

export const ChecklistTab: React.FC<ChecklistTabProps> = ({
  checklist,
  onUpdateChecklist,
  onShowToast,
}) => {
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<ChecklistItem['category']>('서류/결제');
  const [selectedFilter, setSelectedFilter] = useState<string>('전체');

  const categories = ['전체', '서류/결제', '통신/앱', '전자기기', '건강/위생', '의류/기타'];

  const filteredItems =
    selectedFilter === '전체'
      ? checklist
    : checklist.filter((item) => item.category === selectedFilter);

  const completedCount = checklist.filter((item) => item.checked).length;
  const progressPercent = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  const handleToggle = (id: string) => {
    onUpdateChecklist(
      checklist.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const newItem: ChecklistItem = {
      id: `cl-${Date.now()}`,
      text: newText.trim(),
      category: newCategory,
      checked: false,
    };

    onUpdateChecklist([...checklist, newItem]);
    setNewText('');
    onShowToast(`"${newItem.text}" 항목이 추가되었습니다.`);
  };

  const handleDelete = (id: string) => {
    onUpdateChecklist(checklist.filter((item) => item.id !== id));
    onShowToast('체크리스트 항목이 삭제되었습니다.');
  };

  return (
    <div className="space-y-4">
      {/* Progress Card */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-100 flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-amber-400" />
            <span>여행 준비 완료율</span>
          </span>
          <span className="font-mono font-bold text-amber-400">
            {completedCount} / {checklist.length} 완료 ({progressPercent}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-1.5 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedFilter(cat)}
            className={`py-1 px-2.5 rounded-xl transition ${
              selectedFilter === cat
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`p-3.5 bg-slate-900 rounded-2xl border transition-all duration-150 space-y-1.5 ${
              item.checked ? 'border-slate-800/60 opacity-60 bg-slate-950/40' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between gap-2.5">
              <div
                onClick={() => handleToggle(item.id)}
                className="flex items-start space-x-2.5 cursor-pointer flex-1"
              >
                <button type="button" className="mt-0.5 text-slate-400 hover:text-emerald-400 transition">
                  {item.checked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600" />
                  )}
                </button>
                <div className="space-y-0.5">
                  <span
                    className={`text-xs font-semibold block leading-tight ${
                      item.checked ? 'line-through text-slate-500' : 'text-slate-100'
                    }`}
                  >
                    {item.text}
                  </span>
                  <span className="text-[10px] text-slate-400">{item.category}</span>
                </div>
              </div>

              <button
                onClick={() => handleDelete(item.id)}
                className="p-1 text-slate-500 hover:text-red-400 rounded-lg transition"
                title="삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {item.tip && (
              <div className="flex items-start gap-1 text-[11px] text-slate-400 bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 ml-6">
                <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>{item.tip}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Custom Item Form */}
      <form onSubmit={handleAdd} className="bg-slate-900 rounded-2xl p-3 border border-slate-800 flex gap-2">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="새 준비물 입력 (예: 목베개, 선글라스)..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value as any)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-[11px] text-slate-300 focus:outline-none"
        >
          <option value="서류/결제">서류/결제</option>
          <option value="통신/앱">통신/앱</option>
          <option value="전자기기">전자기기</option>
          <option value="건강/위생">건강/위생</option>
          <option value="의류/기타">의류/기타</option>
        </select>
        <button
          type="submit"
          className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold transition shrink-0"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>

      {/* Emergency Contacts Card */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3 shadow-md">
        <h3 className="font-bold text-sm text-red-400 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span>긴급 비상 연락처 (주칭다오 영사관 & 긴급전화)</span>
        </h3>

        <div className="space-y-2 text-xs">
          {EMERGENCY_CONTACTS.map((item, idx) => (
            <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">{item.title}</span>
                {item.tel && (
                  <a
                    href={`tel:${item.tel.replace(/[^0-9+]/g, '')}`}
                    className="font-mono text-cyan-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <PhoneCall className="w-3 h-3 text-cyan-400" />
                    <span>{item.tel}</span>
                  </a>
                )}
              </div>
              {item.emergencyTel && (
                <div className="text-[11px] text-red-300 flex items-center justify-between">
                  <span>24시 긴급 당직:</span>
                  <a href={`tel:${item.emergencyTel}`} className="font-mono font-bold hover:underline">
                    {item.emergencyTel}
                  </a>
                </div>
              )}
              {item.address && (
                <p className="text-[11px] text-slate-400">주소: {item.address}</p>
              )}
              {item.hours && (
                <p className="text-[10px] text-slate-500">업무시간: {item.hours}</p>
              )}
              {item.note && (
                <p className="text-[10px] text-slate-500">{item.note}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
