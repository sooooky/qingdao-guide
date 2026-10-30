import React, { useState } from 'react';
import { X, Download, Upload, Copy, Check, AlertTriangle } from 'lucide-react';
import { ScheduleItem, ExpenseItem, ChecklistItem, FoodPlaceItem, WishlistItem, SurvivalPhrase } from '../types';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    allItinerary: ScheduleItem[];
    backupPool: ScheduleItem[];
    expenses: ExpenseItem[];
    checklist: ChecklistItem[];
    foodPlaces?: FoodPlaceItem[];
    wishlist?: WishlistItem[];
    phrases?: SurvivalPhrase[];
    exchangeRate: number;
  };
  onImport: (importedData: any) => void;
  onShowToast: (msg: string) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  data,
  onImport,
  onShowToast,
}) => {
  const [pastedJson, setPastedJson] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const jsonString = JSON.stringify(data, null, 2);

  const handleDownload = () => {
    try {
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qingdao_travel_plan_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onShowToast('JSON 파일이 다운로드되었습니다.');
    } catch {
      onShowToast('다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      onShowToast('일정 데이터가 클립보드에 복사되었습니다.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onShowToast('클립보드 복사 권한이 없습니다.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.allItinerary || parsed.expenses) {
          onImport(parsed);
          onShowToast('백업 파일에서 일정을 성공적으로 복원했습니다!');
          onClose();
        } else {
          onShowToast('올바른 칭다오 플래너 JSON 형식이 아닙니다.');
        }
      } catch {
        onShowToast('JSON 파일을 파싱할 수 없습니다.');
      }
    };
    reader.readAsText(file);
  };

  const handlePasteImport = () => {
    if (!pastedJson.trim()) {
      onShowToast('붙여넣을 JSON 텍스트를 입력해주세요.');
      return;
    }
    try {
      const parsed = JSON.parse(pastedJson);
      onImport(parsed);
      onShowToast('JSON 텍스트에서 성공적으로 복원했습니다!');
      onClose();
    } catch {
      onShowToast('입력된 텍스트가 유효한 JSON이 아닙니다.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
            <Download className="w-4 h-4 text-cyan-400" />
            <span>일정 백업 및 동행자 공유</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            수정한 모든 일정과 경비 내역을 JSON으로 저장하거나 친구에게 공유하세요.
          </p>
        </div>

        {/* Export Section */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
          <span className="text-xs font-bold text-amber-400">1. 현재 데이터 내보내기</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownload}
              className="py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Download className="w-4 h-4" />
              <span>JSON 파일 다운로드</span>
            </button>
            <button
              onClick={handleCopy}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '복사 완료' : '텍스트 복사'}</span>
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <span className="text-xs font-bold text-cyan-400">2. 백업 파일 또는 텍스트 불러오기</span>
          
          <label className="block w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-dashed border-slate-600 text-slate-300 hover:text-white rounded-xl text-xs font-semibold text-center cursor-pointer transition">
            <Upload className="w-4 h-4 inline-block mr-1 text-cyan-400" />
            <span>JSON 파일 선택하기 (.json)</span>
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          <div className="space-y-1.5">
            <textarea
              value={pastedJson}
              onChange={(e) => setPastedJson(e.target.value)}
              placeholder="또는 백업받은 JSON 코드를 여기에 붙여넣으세요..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-[11px] font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handlePasteImport}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
            >
              텍스트로 복원 적용하기
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-amber-400/80 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>복원 시 현재 기기에 저장된 일정이 교체됩니다.</span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
        >
          닫기
        </button>
      </div>
    </div>
  );
};
