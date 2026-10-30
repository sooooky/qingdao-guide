import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Link,
  FileText,
  Users,
  Sparkles,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { ScheduleItem } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  allItinerary: ScheduleItem[];
  exchangeRate: number;
  isOnline?: boolean;
  onCreateNewRoom: () => void;
  onShowToast: (msg: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  roomId,
  allItinerary,
  exchangeRate,
  isOnline = true,
  onCreateNewRoom,
  onShowToast,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Generate full shareable URL preserving base path and search parameters
  const getShareUrl = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomId);
      return url.toString();
    } catch {
      const cleanBase = window.location.href.split('?')[0].split('#')[0];
      return `${cleanBase}?room=${roomId}`;
    }
  };

  const shareUrl = getShareUrl();

  // Generate clean text summary of 3-day itinerary
  const generateItineraryText = (): string => {
    const days = [1, 2, 3] as const;
    const dayTitles: { [key: number]: string } = {
      1: 'Day 1: 칭다오 도착 & 구시가지 로컬 미식 (잔교, 피차이위안, 천주교당, 맥주펍)',
      2: 'Day 2: 칭다오 맥주박물관 & 5.4 광장 야경 (샤오마이다오, 완샹청, 타이둥)',
      3: 'Day 3: 소어산 360도 파노라마 뷰 & 기념품 쇼핑 (샤오위산, 하이디라오, 대윤발)',
    };

    let text = `✈️ [칭다오 2박 3일 스마트 여행 일정표]\n`;
    text += `실시간 공동 편집 방: ${roomId}\n`;
    text += `기준 환율: 1元 ≈ ${exchangeRate}원\n`;
    text += `────────────────────\n\n`;

    days.forEach((day) => {
      const dayItems = allItinerary
        .filter((item) => item.day === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      text += `📅 ${dayTitles[day] || `Day ${day}`}\n`;
      if (dayItems.length === 0) {
        text += `  (등록된 일정이 없습니다)\n`;
      } else {
        dayItems.forEach((item, idx) => {
          const checkMark = item.completed ? '✅' : '•';
          text += `  ${checkMark} [${item.startTime}] ${item.title} (${item.titleCn})\n`;
          if (item.desc) {
            text += `     ${item.desc.slice(0, 45)}${item.desc.length > 45 ? '...' : ''}\n`;
          }
          if (item.addressCn) {
            text += `     📍 ${item.addressCn}\n`;
          }
        });
      }
      text += `\n`;
    });

    text += `────────────────────\n`;
    text += `🔗 실시간 공동 편집 링크:\n${shareUrl}\n`;
    text += `(위 링크로 들어오면 친구와 함께 일정을 추가/수정/체크할 수 있습니다)`;

    return text;
  };

  const itineraryText = generateItineraryText();

  // Copy Option 1: Live Real-time Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      onShowToast('🔗 실시간 공유 링크가 복사되었습니다! 친구에게 보내보세요.');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      onShowToast('클립보드 복사 권한이 없습니다.');
    }
  };

  // Copy Option 2: Itinerary Text
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(itineraryText);
      setCopiedText(true);
      onShowToast('📋 전체 일정 텍스트가 복사되었습니다! 카톡 등에 바로 붙여넣기 하세요.');
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      onShowToast('클립보드 복사 권한이 없습니다.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-2xl animate-in slide-in-from-bottom-4 duration-250 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Share2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-1.5">
                <span>일정 공유 & 실시간 공동 편집</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-emerald-300 font-bold">방: {roomId}</span>
                <span>· Firebase Firestore 실시간 연동</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* OPTION 1: Real-time Live Link */}
        <div className="bg-slate-950/90 border border-emerald-500/40 rounded-2xl p-4 space-y-3 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center border border-emerald-500/40">
                1
              </span>
              <h3 className="font-extrabold text-sm text-emerald-400 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>실시간 공동 편집 링크 복사</span>
              </h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800">
              실시간 자동 동기화
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            이 링크를 동행인에게 보내면 같은 화면을 보며 실시간으로 일정을 추가, 수정,
            완료 체크할 수 있습니다.
          </p>

          {/* URL Box */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 gap-2 text-xs font-mono text-cyan-300 select-all overflow-x-auto">
            <Link className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{shareUrl}</span>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCopyLink}
              className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-95 ${
                copiedLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>링크 복사 완료!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>① 실시간 공유 링크 복사</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                if (window.confirm('현재 방을 떠나 새로운 협업 방을 만드시겠습니까?')) {
                  onCreateNewRoom();
                }
              }}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
              title="새로운 방 생성"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>새 방 만들기</span>
            </button>
          </div>
        </div>

        {/* OPTION 2: Itinerary Text Copy */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-black text-xs flex items-center justify-center border border-cyan-500/40">
                2
              </span>
              <h3 className="font-extrabold text-sm text-cyan-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>일정 텍스트 복사 (카카오톡/메신저용)</span>
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
              메신저 붙여넣기 전용
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            카카오톡, 라인, 텔레그램 채팅방에 바로 붙여넣기 좋은 포맷팅된 일정 요약본입니다.
          </p>

          {/* Text Preview Box */}
          <textarea
            readOnly
            value={itineraryText}
            rows={5}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-[11px] font-mono text-slate-300 resize-none focus:outline-none focus:border-cyan-500 leading-relaxed"
          />

          <button
            onClick={handleCopyText}
            className={`w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-95 ${
              copiedText
                ? 'bg-cyan-600 text-white'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
            }`}
          >
            {copiedText ? (
              <>
                <Check className="w-4 h-4" />
                <span>일정 텍스트 복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>② 일정 텍스트 복사</span>
              </>
            )}
          </button>
        </div>

        {/* Live sync description banner */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <p className="font-bold text-slate-300 flex items-center gap-1">
            <span>💡 실시간 동기화 안내</span>
          </p>
          <p>
            • 나와 친구가 같은 <span className="text-amber-400 font-mono">?room={roomId}</span> URL로
            접속하면 일정을 추가, 수정, 삭제할 때마다 두 화면이 자동으로 즉시 업데이트됩니다.
          </p>
          <p>
            • 오프라인 상태일 때는 기기에 임시 보관되며, 인터넷이 연결되면 자동으로 다시 동기화됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};
