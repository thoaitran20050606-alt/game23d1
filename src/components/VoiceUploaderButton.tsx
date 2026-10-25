import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Upload, RotateCcw, Play, Check } from 'lucide-react';
import {
  getBecauseVoice,
  setBecauseVoice,
  resetBecauseVoice,
  subscribeBecauseVoice,
} from '../utils/voiceManager';
import { sounds } from '../audio/soundEffects';

interface VoiceUploaderButtonProps {
  variant?: 'compact' | 'full';
}

export const VoiceUploaderButton: React.FC<VoiceUploaderButtonProps> = ({
  variant = 'compact',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentVoiceUrl, setCurrentVoiceUrl] = useState<string>(getBecauseVoice());
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasCustomVoice, setHasCustomVoice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkCustom = () => {
      try {
        const saved = localStorage.getItem('phuoc_custom_because_voice');
        setHasCustomVoice(Boolean(saved && saved.startsWith('data:audio')));
      } catch {
        setHasCustomVoice(false);
      }
    };
    checkCustom();

    return subscribeBecauseVoice((url) => {
      setCurrentVoiceUrl(url);
      checkCustom();
    });
  }, []);

  const handlePlayPreview = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPlaying(true);
    await sounds.playBecauseVoicePreview();
    setTimeout(() => setIsPlaying(false), 1100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac|weba|webm)$/i)) {
      alert('Vui lòng chọn tệp âm thanh (MP3, WAV, M4A, OGG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setBecauseVoice(dataUrl);
        setIsOpen(false);
        // Play preview immediately so user hears it confirmed!
        sounds.playBecauseVoicePreview();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetBecauseVoice();
    setIsOpen(false);
    sounds.playBecauseVoicePreview();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1.5 rounded-lg border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
          variant === 'compact'
            ? 'px-2.5 py-1.5 bg-amber-950/70 border-amber-500/40 text-amber-300 hover:bg-amber-900/80 shadow-sm'
            : 'px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950'
        }`}
        title="Voice BECAUSE! (Bì câu!)"
      >
        <Volume2 className={`w-3.5 h-3.5 ${isPlaying ? 'text-amber-300 animate-pulse' : 'text-amber-400'}`} />
        <span>Voice: Bì câu {hasCustomVoice ? '(Đã tải lên)' : '(Mặc định)'}</span>
      </button>

      {/* Modal Popup for Testing & Uploading Custom Voice */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-sm select-none">
          <div className="w-full max-w-md bg-stone-900 border-2 border-amber-500/60 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-stone-100">
                  Voice Chiêu Thức "BECAUSE!"
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-stone-400 hover:text-stone-100 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Mỗi khi Phước tung chiêu <strong className="text-amber-300">"BECAUSE!"</strong> (nhấn Chuột Trái hoặc phím F),
              giọng hô gốc <span className="text-amber-300 font-bold">"Bì câu!"</span> sẽ được phát ngay lập tức.
            </p>

            <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-stone-200">Âm thanh hiện tại:</p>
                <p className="text-[11px] text-amber-400">
                  {hasCustomVoice ? '⭐ Tệp âm thanh do bạn tải lên' : '🎙️ Giọng gốc: "Bì câu!" (Chuẩn)'}
                </p>
              </div>

              <button
                onClick={handlePlayPreview}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-stone-100 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Nghe thử</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <Upload className="w-4 h-4" />
                <span>Tải lên tệp âm thanh của bạn (MP3, WAV, M4A)</span>
              </button>

              {hasCustomVoice && (
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-1.5 w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi phục voice gốc mặc định</span>
                </button>
              )}
            </div>

            <p className="text-[10px] text-stone-400 text-center">
              Âm thanh được lưu an toàn trên trình duyệt của bạn với độ trễ 0ms.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
