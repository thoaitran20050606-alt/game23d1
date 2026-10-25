/**
 * NPC Thoại Sprite Renderer
 * Model: Image 1 (/assets/aistudio/thoai_transparent.png - 1024x1024 transparent sprite sheet)
 * High School student in crisp white uniform shirt and dark trousers.
 * Smooth proportional animations with zero jitter, no square box, and rich quest-reactive states.
 */

import { ThoaiQuestState } from '../types/game';
import { drawSingleSlipper } from './truongMiniBossSprite';

const thoaiImg = new Image();
thoaiImg.src = '/assets/aistudio/thoai_transparent.png';
let isThoaiImgLoaded = false;
thoaiImg.onload = () => {
  isThoaiImgLoaded = true;
};

export interface ThoaiRenderOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  facing?: 'left' | 'right';
  state?: 'idle' | 'walk' | 'wave' | 'worry' | 'celebrate';
  questState: ThoaiQuestState;
  animTimer: number;
  isPlayerNearby: boolean;
}

interface SpriteFrameDef {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  flipX?: boolean;
  footOffsetY?: number;
}

// Sub-rectangle frame coordinates from thoai_transparent.png (1024x1024)
// Note: All base frames naturally face LEFT.
const THOAI_STAND_FRAME: SpriteFrameDef = { sx: 633, sy: 94, sw: 98, sh: 193 };
const THOAI_WORRY_FRAME: SpriteFrameDef = { sx: 919, sy: 94, sw: 72, sh: 193 };
const THOAI_WAVE_FRAME: SpriteFrameDef = { sx: 286, sy: 568, sw: 114, sh: 158 };
const THOAI_JUMP_FRAME: SpriteFrameDef = { sx: 880, sy: 760, sw: 106, sh: 201 };

const THOAI_WALK_FRAMES: SpriteFrameDef[] = [
  { sx: 18, sy: 568, sw: 110, sh: 158 },  // Stride Left
  { sx: 414, sy: 568, sw: 86, sh: 158 },   // Passing Step 1
  { sx: 157, sy: 568, sw: 100, sh: 158 },  // Stride Right
  { sx: 553, sy: 568, sw: 73, sh: 158 },   // Passing Step 2
];

function drawAlignedFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  frame: SpriteFrameDef,
  targetWidth: number,
  targetHeight: number,
  bobY: number = 0
) {
  // Uniform scale based on reference height 180px
  const scale = targetHeight / 180;
  const drawW = frame.sw * scale;
  const drawH = frame.sh * scale;
  const drawX = (targetWidth - drawW) / 2;
  const drawY = targetHeight - drawH + bobY + (frame.footOffsetY || 0) * scale;

  ctx.save();
  if (frame.flipX) {
    ctx.translate(targetWidth / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-targetWidth / 2, 0);
  }
  ctx.drawImage(
    img,
    frame.sx,
    frame.sy,
    frame.sw,
    frame.sh,
    Math.round(drawX),
    Math.round(drawY),
    Math.round(drawW),
    Math.round(drawH)
  );
  ctx.restore();
}

export function drawThoai(ctx: CanvasRenderingContext2D, opt: ThoaiRenderOptions) {
  const {
    x,
    y,
    width,
    height,
    facing = 'left',
    state = 'idle',
    questState,
    animTimer,
    isPlayerNearby,
  } = opt;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  // Natural idle/motion bob
  let bobY = 0;
  if (state === 'walk') {
    bobY = Math.abs(Math.sin(animTimer * 10)) * 2;
  } else if (state === 'celebrate') {
    bobY = -Math.abs(Math.sin(animTimer * 12)) * 6; // Joyful hop
  } else if (state === 'worry') {
    bobY = Math.sin(animTimer * 14) * 0.8; // Shivering
  } else {
    bobY = Math.sin(animTimer * 3.5) * 1.2; // Gentle breathing
  }

  // Interaction halo when player is nearby
  if (isPlayerNearby) {
    ctx.save();
    const haloColor =
      questState === 'slippers_recovered'
        ? 'rgba(250, 204, 21, 0.4)'
        : questState === 'completed'
        ? 'rgba(74, 222, 128, 0.35)'
        : 'rgba(56, 189, 248, 0.35)';
    const grad = ctx.createRadialGradient(width / 2, height / 2, 8, width / 2, height / 2, 38);
    grad.addColorStop(0, haloColor);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Facing flip:
  // Base sprite sheet faces LEFT! Flip horizontally if facing RIGHT!
  ctx.save();
  if (facing === 'right') {
    ctx.scale(-1, 1);
    ctx.translate(-width, 0);
  }

  if (isThoaiImgLoaded && thoaiImg.naturalWidth > 0) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (state === 'walk') {
      const walkIdx = Math.floor((animTimer * 7) % THOAI_WALK_FRAMES.length);
      drawAlignedFrame(ctx, thoaiImg, THOAI_WALK_FRAMES[walkIdx], width, height, bobY);
    } else if (state === 'wave') {
      drawAlignedFrame(ctx, thoaiImg, THOAI_WAVE_FRAME, width, height, bobY);
    } else if (state === 'celebrate') {
      drawAlignedFrame(ctx, thoaiImg, THOAI_JUMP_FRAME, width, height, bobY);
    } else if (state === 'worry') {
      drawAlignedFrame(ctx, thoaiImg, THOAI_WORRY_FRAME, width, height, bobY);
    } else {
      drawAlignedFrame(ctx, thoaiImg, THOAI_STAND_FRAME, width, height, bobY);
    }

    ctx.restore();

    // Slipper wear state:
    // If completed: Thoại wears his bright yellow honeycomb slippers on both feet!
    if (questState === 'completed') {
      ctx.save();
      const slipperY = height - 4 + bobY;
      drawSingleSlipper(ctx, 4, slipperY, 14, 8, '#FACC15');
      drawSingleSlipper(ctx, width - 18, slipperY, 14, 8, '#FACC15');
      ctx.restore();
    } else {
      // Barefoot shiver drops when not completed
      if (state === 'worry') {
        ctx.fillStyle = '#67E8F9';
        ctx.beginPath();
        const dropY = height - 2 + bobY;
        ctx.arc(width + 2, dropY, 2, 0, Math.PI * 2);
        ctx.arc(-2, dropY - 2, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // Procedural fallback (High school student uniform)
    const cx = width / 2;
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(cx - 12, 0 + bobY, 24, 15);
    ctx.fillStyle = '#FED7AA';
    ctx.fillRect(cx - 10, 8 + bobY, 20, 14);
    ctx.fillStyle = '#18181B';
    ctx.fillRect(cx - 6, 13 + bobY, 3, 3);
    ctx.fillRect(cx + 3, 13 + bobY, 3, 3);
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(cx - 12, 22 + bobY, 24, 20);
    ctx.fillStyle = '#64748B';
    ctx.fillRect(cx - 6, 22 + bobY, 12, 5);
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(cx - 11, 42 + bobY, 10, 16);
    ctx.fillRect(cx + 1, 42 + bobY, 10, 16);
  }

  ctx.restore(); // Restore facing flip

  // Celebratory sparkles & hearts when slippers recovered / completed
  if (questState === 'completed' || questState === 'slippers_recovered') {
    ctx.save();
    for (let s = 0; s < 3; s++) {
      const sAngle = animTimer * 4 + (s * Math.PI * 2) / 3;
      const sx = width / 2 + Math.cos(sAngle) * 22;
      const sy = -8 + bobY + Math.sin(sAngle) * 8;
      ctx.fillStyle = s === 0 ? '#FACC15' : s === 1 ? '#4ADE80' : '#F43F5E';
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Overhead Tag & Quest Balloon
  ctx.save();
  const balloonY = -28 + bobY;

  if (questState === 'slippers_recovered') {
    // Player has the slippers! Big glowing callout to return them
    const pulse = Math.sin(animTimer * 8) * 2;
    ctx.fillStyle = '#FACC15';
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-22, balloonY - 6 + pulse, width + 44, 24, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#78350F';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👟 TRẢ DÉP (Nhấn E)', width / 2, balloonY + 10 + pulse);
  } else if (questState === 'not_started') {
    const pulse = Math.sin(animTimer * 5) * 2;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-16, balloonY - 4 + pulse, width + 32, 22, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💬 THOẠI (Nhấn E)', width / 2, balloonY + 11 + pulse);

    // Bouncing exclamation mark
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(width + 14, balloonY + 6 + pulse, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.fillText('!', width + 14, balloonY + 9 + pulse);
  } else if (questState === 'accepted') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-14, balloonY, width + 28, 20, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FBBF24';
    ctx.font = 'bold 9.5px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Chờ anh lấy lại dép...', width / 2, balloonY + 14);
  } else {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-10, balloonY, width + 20, 18, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#34D399';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🗝️ Cổng đã mở!', width / 2, balloonY + 13);
  }

  // Name tag under feet
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  ctx.roundRect(-8, height + 4, width + 16, 16, 4);
  ctx.fill();
  ctx.strokeStyle = questState === 'completed' ? '#10B981' : '#38BDF8';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = questState === 'completed' ? '#34D399' : '#E2E8F0';
  ctx.font = 'bold 9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const label =
    questState === 'completed'
      ? 'Thoại (Đã có dép 👟)'
      : questState === 'slippers_recovered'
      ? 'Thoại (Đang đợi dép)'
      : 'Thoại (Bị mất dép)';
  ctx.fillText(label, width / 2, height + 15);

  ctx.restore();
  ctx.restore();
}
