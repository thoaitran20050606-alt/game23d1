import React, { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import { StoryDialogueLine } from '../types/game';
import { dialoguePlayer } from '../audio/dialoguePlayer';

interface CutsceneDialogueLineProps {
  line: StoryDialogueLine;
  badgeClassName?: string;
  textClassName?: string;
}

export const CutsceneDialogueLine: React.FC<CutsceneDialogueLineProps> = ({
  line,
  badgeClassName,
  textClassName,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    return dialoguePlayer.subscribe((playing, currentSrc) => {
      if (line.audio && currentSrc === line.audio) {
        setIsPlaying(playing);
      } else {
        setIsPlaying(false);
      }
    });
  }, [line.audio]);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    dialoguePlayer.play(line);
  };

  let roleColor = 'bg-stone-800 text-stone-200 border-stone-700';
  if (line.role === 'phuoc') {
    roleColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  } else if (line.role === 'truc') {
    roleColor = 'bg-pink-500/20 text-pink-300 border-pink-500/40';
  } else if (line.role === 'baholong') {
    roleColor = 'bg-purple-500/30 text-purple-200 border-purple-500/40';
  } else if (line.role === 'csgt') {
    roleColor = 'bg-sky-500/30 text-sky-200 border-sky-500/40';
  } else if (line.role === 'thoai') {
    roleColor = 'bg-teal-500/20 text-teal-300 border-teal-500/40';
  } else if (line.role === 'truong') {
    roleColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  }

  return (
    <div className="flex items-start justify-between gap-2 p-1 rounded-lg hover:bg-stone-900/60 transition-colors group">
      <div className="flex items-start gap-2 text-xs flex-1">
        <span
          className={`shrink-0 px-2 py-0.5 rounded border text-[11px] font-bold ${
            badgeClassName || roleColor
          }`}
        >
          {line.speaker}:
        </span>
        <p className={`text-stone-200 italic leading-relaxed ${textClassName || ''}`}>
          "{line.text}"
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
        {line.audio && (
          <span className="hidden sm:inline-flex text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-mono">
            audio
          </span>
        )}
        <button
          type="button"
          onClick={handlePlay}
          title={line.audio ? 'Nghe âm thanh lồng tiếng' : 'Phát âm thanh hội thoại'}
          className={`p-1 rounded-md transition-all cursor-pointer border ${
            isPlaying
              ? 'bg-amber-500 text-stone-950 border-amber-400 scale-105 shadow-sm'
              : 'bg-stone-800/80 hover:bg-amber-500/20 hover:text-amber-300 text-stone-400 border-stone-700'
          }`}
        >
          <Volume2 className={`w-3.5 h-3.5 ${isPlaying ? 'animate-bounce text-stone-950' : ''}`} />
        </button>
      </div>
    </div>
  );
};
