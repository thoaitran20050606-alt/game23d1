/**
 * Mini-Boss Trường Sprite Renderer & Slipper Projectiles
 * Model: Image 2 (/assets/aistudio/truong_transparent.png - 1024x1024 transparent sprite sheet)
 * Black collared shirt, blue jeans, sneakers, bully swagger.
 * Attacks with iconic Vietnamese slippers ("Dép Tổ Ong" & "Dép Lào")!
 * Features smooth proportional frame animations for walking, sneaking, stealing slippers, taunting, jumping, and throwing!
 * Zero aspect jitter, transparent background, and accurate facing direction.
 */

const truongImg = new Image();
truongImg.src = '/assets/aistudio/truong_transparent.png';
let isTruongImgLoaded = false;
truongImg.onload = () => {
  isTruongImgLoaded = true;
};

export interface TruongRenderOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  facing: 'left' | 'right';
  state: string;
  animTimer: number;
  invulnerableTimer: number;
  isEnraged?: boolean;
  hp?: number;
  maxHp?: number;
}

interface SpriteFrameDef {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  flipX?: boolean;
  footOffsetY?: number;
}

// Sub-rectangle frame coordinates from truong_transparent.png (1024x1024)
// Note: All base frames naturally face LEFT.
const TRUONG_STAND_FRAME: SpriteFrameDef = { sx: 632, sy: 94, sw: 99, sh: 193 };
const TRUONG_TAUNT_FRAME: SpriteFrameDef = { sx: 286, sy: 569, sw: 114, sh: 157 };
const TRUONG_DASH_FRAME: SpriteFrameDef = { sx: 650, sy: 760, sw: 106, sh: 201 };
const TRUONG_JUMP_FRAME: SpriteFrameDef = { sx: 150, sy: 760, sw: 126, sh: 201 };
const TRUONG_STUNNED_FRAME: SpriteFrameDef = { sx: 910, sy: 95, sw: 81, sh: 192 };
const TRUONG_DEFEATED_FRAME: SpriteFrameDef = { sx: 15, sy: 760, sw: 126, sh: 201, footOffsetY: 4 };

// In Row 4 Col 3 (punch/throw), arm is on the right, so we flipX internally to point forward (LEFT)!
const TRUONG_THROW_FRAME: SpriteFrameDef = { sx: 420, sy: 760, sw: 131, sh: 201, flipX: true };

const TRUONG_WALK_FRAMES: SpriteFrameDef[] = [
  { sx: 18, sy: 568, sw: 111, sh: 158 },  // Stride Left
  { sx: 414, sy: 568, sw: 84, sh: 158 },   // Passing Step 1
  { sx: 157, sy: 568, sw: 101, sh: 158 },  // Stride Right
  { sx: 554, sy: 569, sw: 72, sh: 157 },   // Passing Step 2
];

const TRUONG_SNEAK_STEAL_FRAMES: SpriteFrameDef[] = [
  { sx: 15, sy: 760, sw: 126, sh: 201 },  // Crouch sneak
  { sx: 280, sy: 760, sw: 131, sh: 201 }, // Low sneak crawl
  { sx: 760, sy: 760, sw: 96, sh: 201 },  // Sneak stride
];

function drawAlignedFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  frame: SpriteFrameDef,
  targetWidth: number,
  targetHeight: number,
  bobY: number = 0
) {
  // Uniform proportional scale anchored to 180px reference height
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

export function drawTruongMiniBoss(ctx: CanvasRenderingContext2D, opt: TruongRenderOptions) {
  const {
    x,
    y,
    width,
    height,
    facing,
    state,
    animTimer,
    invulnerableTimer,
    isEnraged,
    hp = 250,
    maxHp = 250,
  } = opt;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  // Damage blink
  if (invulnerableTimer > 0 && Math.floor(animTimer * 24) % 2 === 0) {
    ctx.globalAlpha = 0.45;
  }

  // Draw motion blur trail when dashing / running fast
  if (state === 'dash_slipper') {
    ctx.save();
    const trailOffset = facing === 'left' ? 14 : -14;
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(trailOffset, 4, width, height - 4);
    ctx.restore();
  }

  // Facing flip:
  // Default sprite sheet sprites face LEFT!
  // When facing RIGHT, flip horizontally so he faces RIGHT!
  // When facing LEFT, do NOT flip so he faces LEFT!
  ctx.save();
  if (facing === 'right') {
    ctx.scale(-1, 1);
    ctx.translate(-width, 0);
  }

  const isDefeated = state === 'defeated';
  const isThrowing = state === 'throw_slipper' || state === 'slipper_throw';
  const isStealing = state === 'steal_slipper';
  const isTaunting = state === 'taunt_slipper';
  const isDashing = state === 'dash_slipper';
  const isStunned = state === 'stunned';
  const isRaining = state === 'rain_slipper';
  const isJumping = state === 'jump' || state === 'fall';

  // Smooth bobbing based on action
  let bobY = 0;
  if (isDefeated) {
    bobY = 6;
  } else if (isStealing) {
    bobY = 3 + Math.sin(animTimer * 10) * 1.5; // Low crouching sneak bob
  } else if (isDashing) {
    bobY = Math.abs(Math.sin(animTimer * 16)) * 2;
  } else if (state === 'patrol') {
    bobY = Math.abs(Math.sin(animTimer * 9)) * 2; // Natural walking bounce
  } else {
    bobY = Math.sin(animTimer * 4) * 1.2; // Idle breathing
  }

  if (isTruongImgLoaded && truongImg.naturalWidth > 0) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (isDefeated) {
      drawAlignedFrame(ctx, truongImg, TRUONG_DEFEATED_FRAME, width, height, bobY);
    } else if (isStunned) {
      drawAlignedFrame(ctx, truongImg, TRUONG_STUNNED_FRAME, width, height, bobY);
    } else if (isJumping) {
      drawAlignedFrame(ctx, truongImg, TRUONG_JUMP_FRAME, width, height, bobY);
    } else if (isThrowing || isRaining) {
      drawAlignedFrame(ctx, truongImg, TRUONG_THROW_FRAME, width, height, bobY);
    } else if (isStealing) {
      const stealFrameIdx = Math.floor((animTimer * 6) % TRUONG_SNEAK_STEAL_FRAMES.length);
      drawAlignedFrame(ctx, truongImg, TRUONG_SNEAK_STEAL_FRAMES[stealFrameIdx], width, height, bobY);
    } else if (isTaunting) {
      drawAlignedFrame(ctx, truongImg, TRUONG_TAUNT_FRAME, width, height, bobY);
    } else if (isDashing) {
      drawAlignedFrame(ctx, truongImg, TRUONG_DASH_FRAME, width, height, bobY);
    } else {
      const walkFrameIdx = Math.floor((animTimer * 7) % TRUONG_WALK_FRAMES.length);
      drawAlignedFrame(ctx, truongImg, TRUONG_WALK_FRAMES[walkFrameIdx], width, height, bobY);
    }

    ctx.restore();
  } else {
    // Procedural fallback (Black shirt, blue jeans, sneakers)
    const cx = width / 2;
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(cx - 14, 0 + bobY, 28, 16);
    ctx.fillStyle = '#FED7AA';
    ctx.fillRect(cx - 11, 8 + bobY, 22, 16);
    ctx.fillStyle = '#1E1B4B';
    ctx.fillRect(cx - 14, 24 + bobY, 28, 22);
    const legSwing = Math.sin(animTimer * 10) * 4;
    ctx.fillStyle = '#2563EB';
    ctx.fillRect(cx - 12 - legSwing, 46 + bobY, 11, 18);
    ctx.fillRect(cx + 1 + legSwing, 46 + bobY, 11, 18);
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(cx - 14 - legSwing, height - 6 + bobY, 12, 6);
    ctx.fillRect(cx + 2 + legSwing, height - 6 + bobY, 12, 6);
  }

  // ==========================================
  // STOLEN SLIPPER IN HAND VISUALS!
  // ==========================================
  // 1. When sneaking / stealing slippers: holding slipper close to chest with sparkle
  if (isStealing && !isDefeated) {
    ctx.save();
    const slipperBob = Math.sin(animTimer * 12) * 2;
    ctx.translate(6, 26 + bobY + slipperBob);
    ctx.rotate(-0.3);
    drawSingleSlipper(ctx, 0, 0, 20, 11, '#FDE047');
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(10, 5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. When taunting: waving the stolen yellow honeycomb slipper high above head!
  if (isTaunting && !isDefeated) {
    ctx.save();
    const waveAngle = Math.sin(animTimer * 14) * 0.35;
    ctx.translate(width / 2 - 2, -8 + bobY);
    ctx.rotate(waveAngle);
    drawSingleSlipper(ctx, -12, -6, 22, 12, '#FDE047');
    drawSingleSlipper(ctx, 0, -4, 22, 12, '#FACC15');

    for (let s = 0; s < 3; s++) {
      const starAngle = animTimer * 5 + s * 2;
      const sx = Math.cos(starAngle) * 16;
      const sy = -12 + Math.sin(starAngle) * 8;
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 3. When winding up throwing attack: slipper spinning ready in forward hand
  if (isThrowing && !isDefeated) {
    ctx.save();
    ctx.translate(-12, 18 + bobY);
    ctx.rotate(Math.sin(animTimer * 22) * 0.45);
    drawSingleSlipper(ctx, 0, 0, 24, 13, '#FDE047');
    ctx.restore();
  }

  // 4. When dashing / charging with slippers
  if (isDashing && !isDefeated) {
    ctx.save();
    ctx.translate(-4, 22 + bobY);
    ctx.rotate(-0.2);
    drawSingleSlipper(ctx, 0, 0, 20, 11, '#FDE047');
    ctx.restore();
  }

  // Enraged flame aura if under 50% HP
  if (isEnraged && !isDefeated) {
    ctx.save();
    ctx.shadowColor = '#EF4444';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 3;
    ctx.strokeRect(-4, -4 + bobY, width + 8, height + 8);

    for (let f = 0; f < 3; f++) {
      const fx = Math.sin(animTimer * 10 + f * 2) * (width / 2) + width / 2;
      const fy = -6 - Math.abs(Math.sin(animTimer * 12 + f)) * 10;
      ctx.fillStyle = f % 2 === 0 ? '#F97316' : '#EF4444';
      ctx.beginPath();
      ctx.arc(fx, fy + bobY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore(); // restore facing flip

  // ==========================================
  // DEFEATED STARS & SURRENDER BANNER
  // ==========================================
  if (isDefeated) {
    ctx.save();
    for (let s = 0; s < 4; s++) {
      const starAngle = animTimer * 4 + (s * Math.PI * 2) / 4;
      const starX = width / 2 + Math.cos(starAngle) * 20;
      const starY = -14 + Math.sin(starAngle) * 6;
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(starX, starY, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-24, -36, width + 48, 20, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 9.5px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏳️ "Tớ trả dép cho Thoại đây!"', width / 2, -22);
    ctx.restore();
  }

  // ==========================================
  // FLOATING MINI-BOSS HEALTH BAR (Above Head)
  // ==========================================
  if (!isDefeated) {
    ctx.save();
    const barW = 76;
    const barH = 8;
    const barX = width / 2 - barW / 2;
    const barY = -28;

    ctx.shadowColor = isEnraged ? 'rgba(239, 68, 68, 0.6)' : 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 6;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.roundRect(barX - 4, barY - 14, barW + 8, barH + 18, 5);
    ctx.fill();

    ctx.strokeStyle = isEnraged ? '#EF4444' : '#F59E0B';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = isEnraged ? '#FCA5A5' : '#FDE047';
    ctx.font = 'bold 8.5px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    const statusText = isEnraged
      ? '🔥 TRƯỜNG (CUỒNG NỘ)'
      : isStealing
      ? '👟 TRƯỜNG (RÌNH TRỘM DÉP)'
      : isTaunting
      ? '😏 TRƯỜNG (KHOE DÉP)'
      : isDashing
      ? '💨 TRƯỜNG (LAO CƯỚP DÉP)'
      : '👟 TRƯỜNG (TRÙM TRỘM DÉP)';
    ctx.fillText(statusText, width / 2, barY - 4);

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 3);
    ctx.fill();

    const hpRatio = Math.max(0, Math.min(1, hp / maxHp));
    const fillW = barW * hpRatio;

    if (fillW > 0) {
      let hpGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
      if (hpRatio > 0.5) {
        hpGrad.addColorStop(0, '#22C55E');
        hpGrad.addColorStop(1, '#FACC15');
      } else if (hpRatio > 0.25) {
        hpGrad.addColorStop(0, '#F59E0B');
        hpGrad.addColorStop(1, '#EF4444');
      } else {
        hpGrad.addColorStop(0, '#EF4444');
        hpGrad.addColorStop(1, '#DC2626');
      }
      ctx.fillStyle = hpGrad;
      ctx.beginPath();
      ctx.roundRect(barX, barY, fillW, barH, 3);
      ctx.fill();
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 7.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${hp}/${maxHp} HP`, width / 2, barY + 6.5);

    ctx.restore();
  }

  // Action tag under feet
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  ctx.roundRect(-10, height + 4, width + 20, 16, 4);
  ctx.fill();
  ctx.strokeStyle = isEnraged ? '#EF4444' : '#38BDF8';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = isDefeated ? '#94A3B8' : isEnraged ? '#F87171' : '#38BDF8';
  ctx.font = 'bold 9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const footLabel = isDefeated
    ? 'Đã chịu thua'
    : isStealing
    ? 'Đang lén trộm dép!'
    : isTaunting
    ? 'Khoe dép Thoại!'
    : isDashing
    ? 'Lao vào cướp dép!'
    : isThrowing
    ? 'Ném Dép Tổ Ong!'
    : 'THPT Tam Phước';
  ctx.fillText(footLabel, width / 2, height + 15);
  ctx.restore();

  ctx.restore();
}

/**
 * Draws an iconic Vietnamese "Dép Tổ Ong" (honeycomb slipper) or "Dép Lào"
 */
export function drawSingleSlipper(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string = '#FACC15'
) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = color;
  ctx.strokeStyle = '#854D0E';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'rgba(113, 63, 18, 0.45)';
  const dotCount = 4;
  for (let i = 0; i < dotCount; i++) {
    const dx = 4 + (i * (w - 8)) / (dotCount - 1);
    ctx.beginPath();
    ctx.arc(dx, h / 2 - 2, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(dx, h / 2 + 2, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#B45309';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.25, 1);
  ctx.quadraticCurveTo(w * 0.5, h * 0.5, w * 0.75, 1);
  ctx.stroke();

  ctx.restore();
}

/**
 * Renders the glowing dropped "Đôi Dép Của Thoại" on the ground
 */
export function drawDroppedSlippers(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  animTimer: number
) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  const bobY = Math.sin(animTimer * 5) * 4;

  ctx.save();
  const grad = ctx.createRadialGradient(20, 10 + bobY, 4, 20, 10 + bobY, 42);
  grad.addColorStop(0, 'rgba(250, 204, 21, 0.5)');
  grad.addColorStop(0.5, 'rgba(250, 204, 21, 0.2)');
  grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(20, 10 + bobY, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(6, 4 + bobY);
  ctx.rotate(-0.15);
  drawSingleSlipper(ctx, 0, 0, 26, 14, '#FDE047');
  ctx.restore();

  ctx.save();
  ctx.translate(18, 6 + bobY);
  ctx.rotate(0.12);
  drawSingleSlipper(ctx, 0, 0, 26, 14, '#FDE047');
  ctx.restore();

  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = '#FACC15';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-16, -24 + bobY, 72, 20, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FDE047';
  ctx.font = 'bold 9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('👟 DÉP CỦA THOẠI', 20, -10 + bobY);

  for (let s = 0; s < 4; s++) {
    const sAngle = animTimer * 3 + (s * Math.PI) / 2;
    const sx = 20 + Math.cos(sAngle) * 26;
    const sy = 10 + bobY + Math.sin(sAngle) * 16;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(sx, sy, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
