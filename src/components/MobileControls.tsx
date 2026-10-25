import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, MessageSquareWarning, MessageSquare, Shield, Sparkles } from 'lucide-react';
import { AttackBecauseOptions } from '../types/game';

interface MobileControlsProps {
  onMoveLeftStart: () => void;
  onMoveLeftEnd: () => void;
  onMoveRightStart: () => void;
  onMoveRightEnd: () => void;
  onJumpStart: () => void;
  onJumpEnd: () => void;
  onAttackBecause: (options?: AttackBecauseOptions) => void;
  hasSpeechAttack: boolean;
  cooldownRemaining?: number;
  canInteract?: boolean;
  onInteract?: () => void;
  interactLabel?: string;
  onParry?: () => void;
  onUltimateLipstick?: () => void;
  energy?: number;
  maxEnergy?: number;
  isParrying?: boolean;
  parryCooldown?: number;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMoveLeftStart,
  onMoveLeftEnd,
  onMoveRightStart,
  onMoveRightEnd,
  onJumpStart,
  onJumpEnd,
  onAttackBecause,
  hasSpeechAttack,
  cooldownRemaining = 0,
  canInteract = false,
  onInteract,
  interactLabel = 'NÓI CHUYỆN',
  onParry,
  onUltimateLipstick,
  energy = 0,
  maxEnergy = 100,
  isParrying = false,
  parryCooldown = 0,
}) => {
  const isOnCooldown = cooldownRemaining > 0;
  const isUltimateReady = energy >= maxEnergy;

  return (
    <div className="absolute inset-x-0 bottom-4 px-4 sm:px-8 z-20 flex items-end justify-between pointer-events-none select-none touch-none">
      {/* Left / Right Movement Buttons - Enlarged & Translucent Glass */}
      <div className="flex items-center gap-3 sm:gap-4 pointer-events-auto touch-none">
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMoveLeftStart();
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            onMoveLeftEnd();
          }}
          onPointerCancel={(e) => {
            e.preventDefault();
            onMoveLeftEnd();
          }}
          className="w-18 h-18 sm:w-20 sm:h-20 bg-stone-950/25 active:bg-amber-500/40 border-2 border-white/25 active:border-amber-300/80 text-white/90 active:text-white rounded-3xl flex items-center justify-center shadow-2xl backdrop-blur-md active:scale-95 touch-none cursor-pointer transition-transform"
          aria-label="Sang trái"
        >
          <ArrowLeft className="w-9 h-9 sm:w-10 sm:h-10" />
        </button>

        <button
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMoveRightStart();
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            onMoveRightEnd();
          }}
          onPointerCancel={(e) => {
            e.preventDefault();
            onMoveRightEnd();
          }}
          className="w-18 h-18 sm:w-20 sm:h-20 bg-stone-950/25 active:bg-amber-500/40 border-2 border-white/25 active:border-amber-300/80 text-white/90 active:text-white rounded-3xl flex items-center justify-center shadow-2xl backdrop-blur-md active:scale-95 touch-none cursor-pointer transition-transform"
          aria-label="Sang phải"
        >
          <ArrowRight className="w-9 h-9 sm:w-10 sm:h-10" />
        </button>
      </div>

      {/* Right Action Buttons: Parry, Attack, Ultimate 3 Lipstick Boxes, BECAUSE, Jump */}
      <div className="flex flex-col items-end gap-2 sm:gap-3 pointer-events-auto touch-none">
        {/* Top mini-action row: Ultimate Lipstick & Parry & Basic Attack */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 1. Chiêu Tối Thượng: 3 Hộp Son (10 sát thương/hộp) */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onUltimateLipstick?.();
            }}
            disabled={!isUltimateReady}
            className={`h-12 sm:h-14 px-3 sm:px-4 rounded-2xl border-2 flex items-center gap-1.5 shadow-2xl backdrop-blur-md active:scale-95 touch-none cursor-pointer transition-all ${
              isUltimateReady
                ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 border-rose-300 text-white animate-bounce'
                : 'bg-stone-900/40 border-stone-700/40 text-stone-400 opacity-60'
            }`}
            aria-label="Chiêu tối thượng: 3 Hộp Son (10 DMG/hộp)"
          >
            <span className="text-base sm:text-lg">💄</span>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black leading-tight">3 HỘP SON</span>
              <span className="text-[8px] font-mono leading-none">
                {isUltimateReady ? 'SẴN SÀNG! (10 DMG)' : `${Math.round(energy)}% NỘI NĂNG`}
              </span>
            </div>
          </button>

          {/* 2. Đỡ đòn (Parry) */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onParry?.();
            }}
            disabled={parryCooldown > 0}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 flex flex-col items-center justify-center shadow-xl backdrop-blur-md active:scale-95 touch-none cursor-pointer transition-all ${
              isParrying
                ? 'bg-sky-500/80 border-sky-300 text-white animate-pulse'
                : parryCooldown > 0
                ? 'bg-stone-900/40 border-stone-700/40 text-stone-500 cursor-not-allowed'
                : 'bg-sky-500/25 active:bg-sky-500/50 border-sky-400/40 active:border-sky-300 text-sky-200'
            }`}
            aria-label="Đỡ đòn Parry"
            title="Đỡ đòn Parry (Phím C)"
          >
            <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[9px] font-black tracking-tight mt-0.5">
              {isParrying ? 'ĐỠ' : parryCooldown > 0 ? `${parryCooldown.toFixed(1)}s` : 'PARRY'}
            </span>
          </button>
        </div>

        {/* Bottom row: BECAUSE, Interact & Jump */}
        <div className="flex items-center gap-3 sm:gap-4">
          {hasSpeechAttack && (
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAttackBecause();
              }}
              disabled={isOnCooldown}
              className={`w-16 h-16 sm:w-18 sm:h-18 border-2 rounded-3xl flex flex-col items-center justify-center shadow-2xl backdrop-blur-md active:scale-95 touch-none cursor-pointer transition-all ${
                isOnCooldown
                  ? 'bg-stone-900/20 border-stone-600/30 text-stone-400 opacity-60 cursor-not-allowed'
                  : 'bg-amber-500/25 active:bg-amber-500/50 border-amber-300/40 active:border-amber-300 text-amber-200'
              }`}
              aria-label="Tung chiêu BECAUSE"
            >
              <MessageSquareWarning className="w-6 h-6 sm:w-7 sm:h-7" />
              <span className="text-[10px] font-black tracking-tight mt-0.5">BECAUSE!</span>
              {isOnCooldown && (
                <span className="text-[9px] font-mono text-amber-300 font-bold -mt-0.5">
                  {cooldownRemaining.toFixed(1)}s
                </span>
              )}
            </button>
          )}

          {/* Dynamic Interaction Button */}
          {canInteract && (
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onInteract?.();
              }}
              className="w-16 h-16 sm:w-18 sm:h-18 bg-teal-500/90 active:bg-teal-400 border-2 border-teal-200 text-stone-950 font-black rounded-3xl flex flex-col items-center justify-center shadow-2xl backdrop-blur-md active:scale-95 touch-none cursor-pointer transition-all animate-pulse"
              aria-label="Tương tác"
            >
              <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
              <span className="text-[10px] font-black tracking-tight mt-0.5">{interactLabel}</span>
            </button>
          )}

          {/* Jump Button */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onJumpStart();
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              onJumpEnd();
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              onJumpEnd();
            }}
            className="w-18 h-18 sm:w-20 sm:h-20 bg-emerald-600/30 active:bg-emerald-500/60 border-2 border-emerald-400/40 active:border-emerald-300 text-white rounded-3xl flex flex-col items-center justify-center shadow-2xl backdrop-blur-md active:scale-95 touch-none cursor-pointer transition-transform"
            aria-label="Nhảy cao"
          >
            <ArrowUp className="w-8 h-8 sm:w-9 sm:h-9" />
            <span className="text-[10px] tracking-tight -mt-0.5 font-extrabold">NHẢY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
