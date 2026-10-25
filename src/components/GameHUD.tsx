import React, { useState, useEffect } from 'react';
import { Heart, Volume2, VolumeX, Pause, Play, Sparkles, Clock, Zap } from 'lucide-react';
import { getPhuocAvatar, subscribePhuocAvatar } from '../utils/avatarManager';

interface GameHUDProps {
  levelId: number;
  levelName: string;
  score: number;
  coins: number;
  health: number;
  maxHealth: number;
  timeLeft: number;
  cooldownRemaining?: number;
  maxCooldown?: number;
  hasSpeechAttack?: boolean;
  bossHp?: number;
  bossMaxHp?: number;
  bossName?: string;
  isMuted: boolean;
  isPaused: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  energy?: number;
  maxEnergy?: number;
  isParrying?: boolean;
  parryCooldown?: number;
  onTriggerParry?: () => void;
  onTriggerUltimateLipstick?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  levelId,
  levelName,
  score,
  coins,
  health,
  maxHealth,
  timeLeft,
  cooldownRemaining = 0,
  maxCooldown = 2.5,
  hasSpeechAttack = false,
  bossHp,
  bossMaxHp,
  bossName,
  isMuted,
  isPaused,
  onToggleMute,
  onTogglePause,
  energy = 0,
  maxEnergy = 100,
  isParrying = false,
  parryCooldown = 0,
  onTriggerParry,
  onTriggerUltimateLipstick,
}) => {
  const [phuocAvatar, setPhuocAvatarState] = useState<string>(getPhuocAvatar());

  useEffect(() => {
    return subscribePhuocAvatar((newUrl) => {
      setPhuocAvatarState(newUrl);
    });
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isBossFight = bossHp !== undefined && bossMaxHp !== undefined && bossHp > 0;
  const isTruong = bossName?.includes('Trường') || (levelId === 1 && bossHp !== undefined);
  const currentBossTitle = bossName || (
    levelId === 4
      ? 'BÁ HỘ LONG (TRÙM CUỐI)'
      : levelId === 2
      ? 'TRƯỞNG TRẠM TUẦN TRA (MINI-BOSS CÔNG AN)'
      : 'TRƯỜNG - TRÙM BẮT NẠT TRỘM DÉP (THPT TAM PHƯỚC)'
  );
  const bossIcon = isTruong ? '👟' : levelId === 4 ? '👑' : '👮';

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3.5 select-none">
      {/* Top Status Bar Cluster */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Left cluster: Player HP, Lotus Coins & Score + Energy Bar right underneath */}
        <div className="flex flex-col items-start gap-1.5 pointer-events-auto">
          {/* Main Health & Stats Bar */}
          <div className="flex items-center gap-3 bg-stone-950/85 border border-stone-800/80 rounded-xl px-3.5 py-2 text-stone-100 shadow-md backdrop-blur-sm">
            {/* Phuoc avatar */}
            <div className="flex items-center gap-2 pr-1 border-r border-stone-800">
              <img
                src={phuocAvatar}
                alt="Phước"
                className="w-7 h-7 rounded-full object-cover border-2 border-amber-400"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-bold text-amber-300 hidden sm:inline">Phước</span>
            </div>

            {/* Hearts */}
            <div className="flex items-center gap-1">
              {Array.from({ length: maxHealth }).map((_, idx) => (
                <Heart
                  key={idx}
                  className={`w-5 h-5 transition-transform duration-200 ${
                    idx < health
                      ? 'text-rose-500 fill-rose-500 scale-100'
                      : 'text-stone-600 fill-stone-800 scale-90'
                  }`}
                />
              ))}
            </div>

            <span className="text-stone-700">|</span>

            {/* Lotus Coins */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <span className="text-sm">🪷</span>
              <span className="tabular-nums font-mono text-sm">{coins}</span>
            </div>

            <span className="text-stone-700">|</span>

            {/* Score */}
            <div className="text-xs font-semibold text-stone-300">
              <span>ĐIỂM: </span>
              <span className="tabular-nums font-mono font-bold text-stone-100 text-sm">{score}</span>
            </div>
          </div>

          {/* Thanh nội năng hiển thị ngay góc trên dưới thanh máu (theo đúng yêu cầu của người dùng) */}
          <div className="flex items-center gap-2">
            {energy >= maxEnergy ? (
              <button
                onClick={() => onTriggerUltimateLipstick?.()}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 border-2 border-rose-300 text-white font-extrabold text-xs shadow-xl animate-bounce hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Nhấn phím E hoặc chạm vào đây để ném 3 Hộp Son (10 sát thương/hộp)"
              >
                <span className="text-sm">💄</span>
                <span className="tracking-wide">TỐI THƯỢNG [E]: 3 HỘP SON!</span>
                <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-black">10 DMG/HỘP</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-stone-950/85 border border-stone-800/80 rounded-lg px-2.5 py-1 shadow-sm backdrop-blur-sm text-xs">
                <span className="text-sky-400 font-extrabold flex items-center gap-1 text-[11px]">
                  <Zap className="w-3 h-3 text-sky-400 fill-current" />
                  <span>NỘI NĂNG:</span>
                </span>
                <div className="w-24 sm:w-28 h-2 bg-stone-900 rounded-full overflow-hidden border border-stone-700">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 via-indigo-400 to-pink-500 transition-all duration-150"
                    style={{ width: `${Math.min(100, (energy / maxEnergy) * 100)}%` }}
                  />
                </div>
                <span className="font-mono text-stone-200 font-bold tabular-nums text-[11px]">
                  {Math.round(energy)}%
                </span>
                <span className="text-stone-400 text-[10px] hidden sm:inline">(+15%/lần)</span>
              </div>
            )}

            {/* Parry Indicator bên cạnh thanh nội năng */}
            {isParrying ? (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/30 border border-sky-400 text-sky-200 font-black text-[11px] shadow-sm animate-pulse backdrop-blur-sm">
                <span>🛡️</span>
                <span>PARRY!</span>
              </div>
            ) : parryCooldown > 0 ? (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-950/70 border border-stone-800 text-[10px] text-stone-400 font-mono backdrop-blur-sm">
                <span>🛡️ {parryCooldown.toFixed(1)}s</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-950/70 border border-stone-800 text-[10px] text-stone-400 backdrop-blur-sm">
                <span className="text-sky-300 font-semibold">[C] Parry</span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Boss HP Bar OR Level Badge */}
        {isBossFight ? (
          <div className="flex-1 max-w-md bg-stone-950/85 border border-stone-800 rounded-xl p-2.5 shadow-lg flex flex-col gap-1.5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-amber-400 flex items-center gap-1">
                <span>{bossIcon}</span> {currentBossTitle}
              </span>
              <span className="font-mono font-bold text-rose-400 tabular-nums">
                {bossHp} / {bossMaxHp} HP
              </span>
            </div>
            {/* Health Bar track */}
            <div className="w-full h-3 bg-stone-900 rounded-full overflow-hidden border border-stone-700/80">
              <div
                className={`h-full transition-all duration-150 ${
                  bossHp > 30 ? 'bg-gradient-to-r from-amber-500 to-rose-600' : 'bg-rose-600 animate-pulse'
                }`}
                style={{ width: `${Math.max(0, (bossHp / bossMaxHp) * 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-stone-300 flex items-center justify-between">
              <span>
                {isTruong ? (
                  <>Đòn đánh: <span className="text-amber-300 font-bold">BECAUSE!</span> hoặc <span className="text-emerald-400 font-bold">Nhảy Đạp Đầu</span></>
                ) : (
                  <>Đòn đánh: <span className="text-amber-300 font-bold">BECAUSE!</span> (Thu hồi 2.5s)</>
                )}
              </span>
              <span className="text-amber-400 font-semibold">[Chuột Trái / F]</span>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 bg-stone-950/75 border border-stone-800/80 rounded-xl px-4 py-2 text-stone-200 shadow-md backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold tracking-wide text-emerald-300">{levelName}</span>
          </div>
        )}

        {/* Right cluster: Level Timer, Attack Cooldown & Audio / Pause Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Level Countdown Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-md font-mono font-bold text-xs sm:text-sm tabular-nums backdrop-blur-sm transition-all ${
              timeLeft <= 20
                ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-stone-950/80 border-stone-800 text-amber-300'
            }`}
            title="Thời gian còn lại của màn chơi"
          >
            <Clock className={`w-4 h-4 ${timeLeft <= 20 ? 'text-rose-400 animate-spin' : 'text-amber-400'}`} />
            <span>{formatTime(timeLeft)}</span>
          </div>

          {/* Cooldown Gauge */}
          {hasSpeechAttack && (
            <div
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-md text-xs backdrop-blur-sm ${
                cooldownRemaining > 0
                  ? 'bg-stone-950/90 border-amber-500/40 text-amber-200'
                  : 'bg-amber-950/50 border-amber-400 text-amber-300'
              }`}
              title="Thời gian hồi chiêu đòn nói BECAUSE (2.5 giây)"
            >
              <Zap className={`w-3.5 h-3.5 ${cooldownRemaining === 0 ? 'text-amber-300 animate-bounce' : 'text-stone-500'}`} />
              <span className="font-extrabold text-[11px]">BECAUSE</span>
              {cooldownRemaining > 0 ? (
                <div className="flex items-center gap-1 font-mono text-[11px] text-amber-400 font-bold tabular-nums">
                  <div className="w-10 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 transition-all duration-75"
                      style={{ width: `${Math.max(0, 100 - (cooldownRemaining / maxCooldown) * 100)}%` }}
                    />
                  </div>
                  <span>{cooldownRemaining.toFixed(1)}s</span>
                </div>
              ) : (
                <span className="text-emerald-400 font-black text-[10px] tracking-wide animate-pulse">SẴN SÀNG</span>
              )}
            </div>
          )}

          {/* Audio & Pause Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleMute}
              className="p-2 rounded-xl bg-stone-950/80 border border-stone-800 text-stone-200 hover:bg-stone-800 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'Bật âm' : 'Tắt âm'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={onTogglePause}
              className="p-2 rounded-xl bg-stone-950/80 border border-stone-800 text-stone-200 hover:bg-stone-800 hover:text-white transition-colors cursor-pointer"
              title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
            >
              {isPaused ? <Play className="w-4 h-4 text-amber-400 fill-current" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Quiet Control Helper */}
      <div className="w-full flex justify-center">
        <div className="hidden md:flex items-center gap-3 bg-stone-950/80 border border-stone-800/60 rounded-full px-4 py-1.5 text-xs text-stone-300 shadow-sm backdrop-blur-sm">
          <span>
            <strong className="text-stone-100">A/D</strong> Chạy
          </span>
          <span className="text-stone-600">·</span>
          <span>
            <strong className="text-stone-100">Space/W</strong> Nhảy
          </span>
          <span className="text-stone-600">·</span>
          <span className="text-sky-300 font-bold">
            [C] Đỡ đòn (Parry)
          </span>
          {hasSpeechAttack && (
            <>
              <span className="text-stone-600">·</span>
              <span className="text-yellow-400 font-bold">
                [F / Chuột] BECAUSE! (+15% Nội năng)
              </span>
            </>
          )}
          <span className="text-stone-600">·</span>
          <span className="text-pink-400 font-bold">
            [E] 3 Hộp Son (10 dmg/hộp)
          </span>
          <span className="text-stone-600">·</span>
          <span className="text-rose-400 font-semibold">
            ❤️ Trái tim (+1 HP & +10s)
          </span>
        </div>
      </div>
    </div>
  );
};
