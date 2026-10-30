import React, { useState } from 'react';
import { X, Image as ImageIcon, Plus, Upload, Calendar, FileText, ExternalLink, Sparkles } from 'lucide-react';
import { ScheduleItem, ItemAttachment } from '../types';
import { compressImageFile } from '../utils/attachmentStorage';

interface OfflineVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  allItinerary: ScheduleItem[];
  onAddAttachmentToItem: (itemId: string, attachment: ItemAttachment) => void;
  onOpenViewer: (attachment: ItemAttachment, scheduleTitle: string) => void;
  onShowToast: (msg: string) => void;
}

export const OfflineVaultModal: React.FC<OfflineVaultModalProps> = ({
  isOpen,
  onClose,
  allItinerary,
  onAddAttachmentToItem,
  onOpenViewer,
  onShowToast,
}) => {
  const [targetItemId, setTargetItemId] = useState<string>(allItinerary[0]?.id || '');
  const [customName, setCustomName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  // Flatten all attachments with schedule info
  const allVaultItems: { item: ScheduleItem; attachment: ItemAttachment }[] = [];
  allItinerary.forEach((item) => {
    (item.attachments || []).forEach((att) => {
      allVaultItems.push({ item, attachment: att });
    });
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !targetItemId) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressImageFile(file);
        const newAttachment: ItemAttachment = {
          id: `att-${Date.now()}-${i}`,
          name: customName.trim() || file.name.replace(/\.[^/.]+$/, '') || '캡쳐 바우처',
          dataUrl: compressed,
          size: file.size,
          type: file.type,
          createdAt: new Date().toISOString(),
        };
        onAddAttachmentToItem(targetItemId, newAttachment);
      }
      setCustomName('');
      onShowToast('사진이 오프라인 보관함에 안전하게 저장되었습니다!');
    } catch (err) {
      console.error(err);
      onShowToast('사진 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                <span>오프라인 캡쳐 사진 & 바우처 보관함</span>
              </h2>
              <p className="text-xs text-slate-400">
                인터넷/eSIM이 안 터져도 비행기 모드에서 즉시 확인 가능합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Upload Box */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" />
            <span>새 캡쳐 사진 / 바우처 추가하기</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">연결할 일정 선택</label>
              <select
                value={targetItemId}
                onChange={(e) => setTargetItemId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:border-cyan-400 text-xs"
              >
                {allItinerary.map((item) => (
                  <option key={item.id} value={item.id}>
                    Day {item.day} - {item.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">사진 이름 / 설명</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="예: 호텔 체크인 바우처 QR, 지하철 노선도"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
              />
            </div>
          </div>

          <label className="block w-full py-2.5 px-3 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-800 text-cyan-200 rounded-xl text-xs font-bold text-center cursor-pointer transition">
            <Upload className="w-4 h-4 inline-block mr-1.5 text-cyan-400" />
            <span>{isUploading ? '압축 저장 중...' : '앨범에서 캡쳐 사진/파일 선택'}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>

        {/* Saved Photos Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200">
              저장된 캡쳐 사진 ({allVaultItems.length}장)
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>오프라인 캐시 완료</span>
            </span>
          </div>

          {allVaultItems.length === 0 ? (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-1.5">
              <p className="text-xs font-semibold text-slate-400">아직 저장된 캡쳐 사진이 없습니다.</p>
              <p className="text-[11px] text-slate-500">
                호텔 예약 바우처, 비행기 티켓 QR, 맥주박물관 모바일 입장권을 미리 저장해두세요!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {allVaultItems.map(({ item, attachment }) => (
                <div
                  key={attachment.id}
                  onClick={() => onOpenViewer(attachment, item.title)}
                  className="bg-slate-950 rounded-xl border border-slate-800 hover:border-amber-400/80 p-2 cursor-pointer transition group space-y-1.5"
                >
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-900 relative">
                    <img
                      src={attachment.dataUrl}
                      alt={attachment.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                      <span className="text-[10px] font-bold text-amber-300 truncate">
                        Day {item.day}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 truncate">{attachment.name}</h4>
                    <p className="text-[10px] text-slate-400 truncate">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
