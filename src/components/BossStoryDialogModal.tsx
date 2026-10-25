import React, { useState, useEffect } from 'react';
import { ArrowRight, Swords, Heart, ShieldAlert, Sparkles, MessageSquare, Volume2, VolumeX } from 'lucide-react';
import { BossStoryEvent, StoryDialogueLine } from '../types/game';
import { getBaHoLongAvatar, getPhuocAvatar } from '../utils/avatarManager';
import { getStoryEventLines } from '../data/storyDialogues';
import { dialoguePlayer } from '../audio/dialoguePlayer';
import bossOfficerImg from '../assets/images/boss_patrol_officer_1792342260575.jpg';
import trucImg from '../assets/images/portrait_phuoc_glasses_truc_1792344215672.jpg';

interface BossStoryDialogModalProps {
  event: BossStoryEvent;
  onNextOrResume: () => void;
  onEndGameKiss: () => void;
}

export const BossStoryDialogModal: React.FC<BossStoryDialogModalProps> = ({
  event,
  onNextOrResume,
  onEndGameKiss,
}) => {
  const [dialogIdx, setDialogIdx] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const baHoLongAvatar = getBaHoLongAvatar();
  const phuocAvatar = getPhuocAvatar();

  const isFinalPhase = event.stage === 'phase3_100';

  // Retrieve base lines from central data or event
  const predefinedLines = getStoryEventLines(event.stage);

  // Build standard list of lines, merging custom audio paths from central data
  const rawLines: StoryDialogueLine[] = event.lines && event.lines.length > 0
    ? event.lines
    : predefinedLines.length > 0
    ? predefinedLines
    : event.dialogues.map((text) => ({
        speaker: event.speaker || 'Bá Hộ Long',
        role: (event.speaker?.toLowerCase().includes('phước')
          ? 'phuoc'
          : event.speaker?.toLowerCase().includes('trúc')
          ? 'truc'
          : event.speaker?.toLowerCase().includes('công an') || event.speaker?.toLowerCase().includes('csgt')
          ? 'csgt'
          : 'baholong') as 'phuoc' | 'baholong' | 'csgt' | 'truc',
        text,
        audio: '',
      }));

  const lines: StoryDialogueLine[] = rawLines.map((line, idx) => {
    // If line doesn't have custom audio, check if predefined line has audio inserted in code
    const fallbackAudio = predefinedLines[idx]?.audio || predefinedLines[idx]?.audioUrl;
    return {
      ...line,
      audio: line.audio || fallbackAudio,
    };
  });

  const totalLines = lines.length;
  const isLastLine = dialogIdx >= totalLines - 1;
  const currentLine = lines[dialogIdx] || lines[0] || {
    speaker: event.speaker,
    role: 'baholong',
    text: event.dialogues[0] || '',
  };

  // Subscribe to audio playback state
  useEffect(() => {
    const unsub = dialoguePlayer.subscribe((playing) => {
      setIsPlayingAudio(playing);
    });
    return () => unsub();
  }, []);

  // Trigger audio playback whenever dialogue index advances
  useEffect(() => {
    if (currentLine) {
      dialoguePlayer.play(currentLine);
    }
    return () => {
      dialoguePlayer.stop();
    };
  }, [dialogIdx, currentLine.text, currentLine.audio]);

  const handleReplayAudio = () => {
    dialoguePlayer.play(currentLine);
  };

  const handleAction = () => {
    dialoguePlayer.stop();
    if (isFinalPhase && isLastLine) {
      onEndGameKiss();
      return;
    }

    if (!isLastLine) {
      setDialogIdx(dialogIdx + 1);
    } else {
      onNextOrResume();
    }
  };

  // Determine avatar and theme based on active speaker role
  let avatarSrc = baHoLongAvatar;
  let borderColor = 'border-purple-500/70';
  let badgeColor = 'text-purple-300 border-purple-500/40 bg-purple-950/60';
  let speakerName = currentLine.speaker;

  if (currentLine.role === 'phuoc') {
    avatarSrc = phuocAvatar;
    borderColor = 'border-emerald-500/70';
    badgeColor = 'text-emerald-300 border-emerald-500/40 bg-emerald-950/60';
  } else if (currentLine.role === 'truc') {
    avatarSrc = trucImg;
    borderColor = 'border-pink-500/70';
    badgeColor = 'text-pink-300 border-pink-500/40 bg-pink-950/60';
  } else if (currentLine.role === 'csgt') {
    avatarSrc = bossOfficerImg;
    borderColor = 'border-sky-500/70';
    badgeColor = 'text-sky-300 border-sky-500/40 bg-sky-950/60';
  } else if (currentLine.role === 'thoai') {
    avatarSrc = currentLine.customAvatar || '/assets/aistudio/download_0fa48a28.jpg';
    borderColor = 'border-teal-400/80';
    badgeColor = 'text-teal-300 border-teal-500/40 bg-teal-950/60';
  } else if (currentLine.role === 'truong') {
    avatarSrc = currentLine.customAvatar || '/assets/aistudio/download__1__1ee8a84c.jpg';
    borderColor = 'border-rose-500/80';
    badgeColor = 'text-rose-300 border-rose-500/40 bg-rose-950/60';
  } else if (currentLine.role === 'y') {
    avatarSrc = currentLine.customAvatar || '/assets/aistudio/y_transparent.png';
    borderColor = 'border-pink-500/80';
    badgeColor = 'text-pink-300 border-pink-500/40 bg-pink-950/70';
  } else if (currentLine.role === 'thuan') {
    avatarSrc = currentLine.customAvatar || '/assets/aistudio/thuan_transparent.png';
    borderColor = 'border-blue-400/80';
    badgeColor = 'text-blue-300 border-blue-500/40 bg-blue-950/70';
  }

  // Header Stage Tag
  let stageTag = 'ĐỐI THOẠI CHIẾN ĐẤU';
  let stageTagColor = 'text-amber-400 border-amber-500/40 bg-amber-950/60';
  if (event.stage === 'phase1_30') {
    stageTag = 'BÁ HỘ LONG MẤT 30% MÁU - ĐỐI THOẠI NẢY LỬA';
    stageTagColor = 'text-amber-300 border-amber-500/40 bg-amber-950/70';
  } else if (event.stage === 'phase_long_50' || event.stage === 'phase_csgt_50') {
    stageTag = 'CẢNH BÁO: BOSS HÓA ĐIÊN 50% HP TỔNG LỰC!';
    stageTagColor = 'text-rose-400 border-rose-500/60 bg-rose-950/80';
  } else if (event.stage === 'phase2_70') {
    stageTag = 'BÁ HỘ LONG HOẢNG LOẠN - MẤT 70% MÁU';
    stageTagColor = 'text-rose-300 border-rose-500/40 bg-rose-950/70';
  } else if (event.stage === 'phase3_100') {
    stageTag = 'BÁ HỘ LONG QUỲ GỤC CHỊU THUA - PHƯỚC CỨU ĐƯỢC TRÚC!';
    stageTagColor = 'text-emerald-400 border-emerald-500/50 bg-emerald-950/80';
  } else if (event.stage === 'thoai_intro') {
    stageTag = 'CẦU SÔNG BUÔNG - GẶP THOẠI BỊ CƯỚP DÉP';
    stageTagColor = 'text-teal-300 border-teal-500/50 bg-teal-950/80';
  } else if (event.stage === 'thoai_waiting') {
    stageTag = 'NHIỆM VỤ: TIẾN VÀO THPT TAM PHƯỚC LẤY LẠI DÉP';
    stageTagColor = 'text-amber-300 border-amber-500/50 bg-amber-950/80';
  } else if (event.stage === 'thoai_return_slippers') {
    stageTag = 'HOÀN THÀNH: TRẢ DÉP CHO THOẠI & NHẬN CHÌA KHÓA MÀN 2!';
    stageTagColor = 'text-emerald-300 border-emerald-500/50 bg-emerald-950/80';
  } else if (event.stage === 'thoai_completed') {
    stageTag = 'CỔNG SÔNG BUÔNG ĐÃ MỞ: SẴN SÀNG SANG MÀN 2!';
    stageTagColor = 'text-emerald-400 border-emerald-500/50 bg-emerald-950/80';
  } else if (event.stage === 'truong_intro') {
    stageTag = 'SÂN TRƯỜNG THPT TAM PHƯỚC - ĐỐI MẶT TRÙM BẮT NẠT TRƯỜNG';
    stageTagColor = 'text-rose-300 border-rose-500/50 bg-rose-950/80';
  } else if (event.stage === 'truong_defeated') {
    stageTag = 'TRƯỜNG BỊ HẠ GỤC - ĐÃ RƠI RA ĐÔI DÉP CỦA THOẠI!';
    stageTagColor = 'text-amber-300 border-amber-500/50 bg-amber-950/80';
  } else if (event.stage === 'y_intro') {
    stageTag = 'MÀN 3: CỔNG DINH CƠ - CỨU THUẬN & ĐỐI ĐẦU BOSS Ý!';
    stageTagColor = 'text-pink-300 border-pink-500/50 bg-pink-950/80';
  } else if (event.stage === 'y_50') {
    stageTag = 'CẢNH BÁO: BOSS Ý HÓA ĐIÊN 50% HP - BÃO TRÀ SỮA & 50K!';
    stageTagColor = 'text-rose-400 border-rose-500/60 bg-rose-950/80';
  } else if (event.stage === 'y_defeated') {
    stageTag = 'Ý BỊ ĐÁNH BẠI - THUẬN ĐƯỢC CỨU & TRAO CHÌA KHÓA CỔNG MÀN 4!';
    stageTagColor = 'text-emerald-300 border-emerald-500/50 bg-emerald-950/80';
  }

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center p-3 md:p-8 bg-stone-950/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-4xl bg-stone-900/95 border-2 border-amber-500/70 rounded-2xl p-4 md:p-6 shadow-2xl flex flex-col md:flex-row gap-4 md:gap-6 items-center">
        {/* Left: Speaker Portrait */}
        <div className={`relative shrink-0 w-28 h-32 md:w-40 md:h-44 rounded-xl overflow-hidden border-2 ${borderColor} shadow-lg bg-stone-950 flex flex-col items-center`}>
          <img
            src={avatarSrc}
            alt={speakerName}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-0 inset-x-0 bg-stone-950/90 py-1 text-center text-[10px] md:text-xs font-black uppercase tracking-wider text-stone-200">
            {speakerName}
          </div>
        </div>

        {/* Right: Dialogue Text Container */}
        <div className="flex-1 w-full flex flex-col justify-between min-h-[130px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] md:text-xs font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${stageTagColor}`}>
                <MessageSquare className="w-3.5 h-3.5" />
                {stageTag}
              </span>
              <span className="text-xs text-stone-400 font-mono">
                {dialogIdx + 1} / {totalLines}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${badgeColor}`}>
                  {speakerName}:
                </span>
                {currentLine.audio && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Âm thanh code
                  </span>
                )}
              </div>

              {/* Quick Replay Audio Button */}
              <button
                type="button"
                onClick={handleReplayAudio}
                title="Nghe lại âm thanh câu thoại"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                  isPlayingAudio
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-sm'
                    : 'bg-stone-800/80 hover:bg-stone-700 text-stone-300 border-stone-700'
                }`}
              >
                <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-bounce text-amber-400' : 'text-stone-400'}`} />
                <span>{isPlayingAudio ? 'Đang phát...' : 'Nghe lại'}</span>
              </button>
            </div>

            <div className="bg-stone-950/75 border border-stone-800 rounded-xl p-3 md:p-4 my-1">
              <p className="text-base md:text-xl font-black text-amber-300 tracking-wide font-sans leading-snug">
                "{currentLine.text}"
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end mt-2">
            <button
              onClick={handleAction}
              className={`flex items-center gap-2 px-5 py-2.5 md:py-3 rounded-xl font-black text-xs md:text-sm tracking-wide shadow-lg transition-all active:scale-95 cursor-pointer ${
                isFinalPhase && isLastLine
                  ? 'bg-rose-500 hover:bg-rose-400 text-stone-950 shadow-rose-900/50'
                  : !isLastLine
                  ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-stone-950'
              }`}
            >
              {isFinalPhase && isLastLine ? (
                <>
                  <Heart className="w-4 h-4 fill-current text-rose-950" />
                  <span>Đoàn Tụ & Trao Nụ Hôn Yêu Thương ❤️</span>
                </>
              ) : !isLastLine ? (
                <>
                  <span>Tiếp theo</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Swords className="w-4 h-4" />
                  <span>Tiếp tục chiến đấu!</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
