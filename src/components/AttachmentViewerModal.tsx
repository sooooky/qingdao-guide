import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Trash2, Calendar, FileText } from 'lucide-react';
import { ItemAttachment } from '../types';

interface AttachmentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: ItemAttachment | null;
  scheduleTitle?: string;
  onDelete?: (attachmentId: string) => void;
  onShowToast: (msg: string) => void;
}

export const AttachmentViewerModal: React.FC<AttachmentViewerModalProps> = ({
  isOpen,
  onClose,
  attachment,
  scheduleTitle,
  onDelete,
  onShowToast,
}) => {
  const [zoom, setZoom] = useState(1);

  if (!isOpen || !attachment) return null;

  const handleZoomIn = () => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))));
  const handleResetZoom = () => setZoom(1);

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = attachment.dataUrl;
      link.download = attachment.name || `qingdao_voucher_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowToast('이미지가 다운로드되었습니다.');
    } catch {
      onShowToast('다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = () => {
    if (window.confirm('이 캡쳐 사진을 삭제하시겠습니까?')) {
      if (onDelete) {
        onDelete(attachment.id);
      }
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div
        className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 shadow-lg z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-0.5 truncate pr-3">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold truncate">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{scheduleTitle || '일정 첨부 캡쳐'}</span>
          </div>
          <p className="text-[11px] text-slate-300 font-semibold truncate">{attachment.name}</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={handleZoomOut}
            className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition"
            title="축소"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="px-2 py-1 text-slate-300 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono transition"
            title="원본 크기"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition"
            title="확대"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 text-cyan-400 hover:text-cyan-300 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
            title="저장"
          >
            <Download className="w-4 h-4" />
          </button>
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-2 text-red-400 hover:text-red-300 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
              title="삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-800 transition ml-1"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="flex-1 flex items-center justify-center overflow-auto my-2 p-2 relative"
        onClick={onClose}
      >
        <div
          className="transition-transform duration-100 ease-out flex items-center justify-center max-w-full max-h-full"
          style={{ transform: `scale(${zoom})` }}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={attachment.dataUrl}
            alt={attachment.name}
            className="max-w-[90vw] max-h-[75vh] object-contain rounded-xl shadow-2xl border border-slate-800 bg-black/40"
          />
        </div>
      </div>

      {/* Bottom Hint Bar */}
      <div
        className="bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 text-center text-xs text-slate-400 flex items-center justify-between z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>오프라인 저장 완료 (비행기 모드에서도 바로 확인 가능)</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          등록: {attachment.createdAt.slice(0, 10)}
        </span>
      </div>
    </div>
  );
};
