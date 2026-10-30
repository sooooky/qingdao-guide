import React, { useState } from 'react';
import { Volume2, VolumeX, Compass, MapPin, X } from 'lucide-react';
import { speakChinese } from '../utils/tts';
import { openAmap, openBaidu } from '../utils/geo';

interface TaxiModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    title: string;
    cnText: string;
    pinyin?: string;
    krDesc?: string;
    addressCn?: string;
  } | null;
  onShowToast: (msg: string) => void;
}

export const TaxiModal: React.FC<TaxiModalProps> = ({ isOpen, onClose, data, onShowToast }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!isOpen || !data) return null;

  const textToSpeak = data.cnText.startsWith('请') || data.cnText.startsWith('师傅')
    ? data.cnText
    : `请带我去 ${data.cnText}`;

  const handleSpeak = () => {
    setIsPlaying(true);
    const ok = speakChinese(
      textToSpeak,
      () => setIsPlaying(true),
      () => setIsPlaying(false)
    );
    if (!ok) {
      setIsPlaying(false);
      onShowToast('현재 브라우저 환경에서 음성 합성을 지원하지 않습니다.');
    } else {
      onShowToast('🔊 중국어 음성을 재생합니다.');
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
        className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-800 transition"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge Header */}
        <div className="text-center pt-1">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
            🚕 택시 기사님께 이 화면을 그대로 보여주세요
          </span>
        </div>

        {/* Content Box */}
        <div className="bg-slate-950/90 rounded-2xl p-5 border border-slate-800 text-center space-y-3">
          <p className="text-xs text-slate-400 font-medium">{data.title}</p>

          <h2 className="text-2xl sm:text-3xl font-black text-amber-400 tracking-wide leading-tight select-all">
            {data.cnText}
          </h2>

          {data.pinyin && (
            <p className="text-xs text-cyan-300 font-mono select-all">{data.pinyin}</p>
          )}

          {data.krDesc && (
            <p className="text-xs text-slate-300 border-t border-slate-800/80 pt-2 font-medium">
              뜻: {data.krDesc}
            </p>
          )}
        </div>

        {/* TTS Playback Button */}
        <button
          onClick={handleSpeak}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg ${
            isPlaying
              ? 'bg-amber-500 text-slate-950 scale-95 ring-2 ring-amber-400'
              : 'bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-700/80 active:scale-98'
          }`}
        >
          {isPlaying ? (
            <>
              <VolumeX className="w-4 h-4 animate-pulse" />
              <span>재생 중... (중국어 음성)</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>🔊 기사님께 중국어 음성 들려주기</span>
            </>
          )}
        </button>

        {/* Map Links */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => openAmap(data.title, data.addressCn || data.cnText)}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>고덕지도 길찾기</span>
          </button>
          <button
            onClick={() => openBaidu(data.title, data.addressCn || data.cnText)}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>바이두 길찾기</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition"
        >
          화면 닫기
        </button>
      </div>
    </div>
  );
};
