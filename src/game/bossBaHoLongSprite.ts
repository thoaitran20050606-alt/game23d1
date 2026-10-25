/**
 * Detailed 16-Bit Pixel Canvas Renderer for Boss Bá Hộ Long
 * Model updated to faithfully match the user's uploaded sprite sheet (image_c8b70a01.png):
 * - Handsome young Vietnamese rich boy wearing a red soccer jersey (Santander/white stripes on shoulders)
 * - Black sports shorts with gold emblem & dark slides/sandals
 * - Slick side-parted black hair
 * - Always holding modern black smartphone (texting, taking photos, phone flash attack, flinging dice/cash)
 * - Complete animation set:
 *   * Idle texting & looking around (Row 0)
 *   * 5-frame run cycle holding smartphone (Row 1)
 *   * Jump / Air dash & Kneeling hurt/defeated pose (Row 2)
 *   * Phone flash attack, windup & projectile throw with sparkle (Row 3)
 */

import { Boss } from '../types/game';

const baHoLongSheetImg = new Image();
baHoLongSheetImg.src = '/assets/aistudio/baholong_transparent.png';
let isSheetLoaded = false;
baHoLongSheetImg.onload = () => {
  isSheetLoaded = true;
};

export interface BaHoLongRenderOptions {
  boss: Boss;
  timer: number;
}

interface SpriteFrameDef {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  footOffsetY?: number;
}

// Bounding coordinates scanned from /public/assets/aistudio/baholong_transparent.png (1024x1024)
// Base sprites naturally face RIGHT.
const BAHOLONG_IDLE_FRAMES: SpriteFrameDef[] = [
  { sx: 86, sy: 30, sw: 95, sh: 226 },   // Looking at phone with text puff
  { sx: 339, sy: 30, sw: 96, sh: 226 },  // Typing on phone
  { sx: 595, sy: 30, sw: 95, sh: 226 },  // Glancing up
  { sx: 851, sy: 30, sw: 94, sh: 226 },  // Smirking with phone
];

const BAHOLONG_RUN_FRAMES: SpriteFrameDef[] = [
  { sx: 40, sy: 256, sw: 152, sh: 256 },
  { sx: 227, sy: 256, sw: 154, sh: 256 },
  { sx: 452, sy: 286, sw: 139, sh: 226 },
  { sx: 651, sy: 256, sw: 144, sh: 256 },
  { sx: 855, sy: 256, sw: 145, sh: 256 },
];

const BAHOLONG_JUMP_ASCEND: SpriteFrameDef = { sx: 89, sy: 523, sw: 89, sh: 240 };
const BAHOLONG_JUMP_PEAK: SpriteFrameDef = { sx: 342, sy: 514, sw: 85, sh: 239 };
const BAHOLONG_JUMP_FALL: SpriteFrameDef = { sx: 533, sy: 536, sw: 200, sh: 232 };
const BAHOLONG_DEFEATED_FRAME: SpriteFrameDef = { sx: 816, sy: 568, sw: 140, sh: 200, footOffsetY: 5 };

const BAHOLONG_FLASH_FRAME: SpriteFrameDef = { sx: 65, sy: 788, sw: 143, sh: 236 };
const BAHOLONG_PHOTO_FRAME: SpriteFrameDef = { sx: 283, sy: 788, sw: 148, sh: 236 };
const BAHOLONG_WINDUP_FRAME: SpriteFrameDef = { sx: 550, sy: 768, sw: 185, sh: 256 };
const BAHOLONG_THROW_FRAME: SpriteFrameDef = { sx: 811, sy: 768, sw: 171, sh: 256 };

export function drawBaHoLongBoss(ctx: CanvasRenderingContext2D, opt: BaHoLongRenderOptions) {
  const { boss, timer } = opt;

  ctx.save();
  ctx.translate(Math.round(boss.x), Math.round(boss.y));

  // Invulnerability blink
  if (boss.invulnerableTimer > 0 && Math.floor(boss.animTimer * 20) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }

  const cx = boss.width / 2;
  const isDefeated = boss.state === 'defeated';
  const isStunned = boss.state === 'stunned';
  const isDiceThrow = boss.state === 'dice_throw';
  const isMoneyThrow = boss.state === 'money_throw' || boss.state === 'citation_attack';
  const isJumpOrFall = boss.state === 'jump_slam';

  // Enraged visual aura if boss is under 50% HP
  if (boss.isEnraged && !isDefeated) {
    ctx.save();
    for (let f = 0; f < 6; f++) {
      const flameX = cx + (Math.sin(timer * 18 + f * 1.5) * 26);
      const flameY = boss.height - 15 - ((timer * 40 + f * 16) % (boss.height + 10));
      const fRadius = 6 + Math.sin(timer * 20 + f) * 3;
      ctx.fillStyle = f % 2 === 0 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(234, 179, 8, 0.45)';
      ctx.beginPath();
      ctx.arc(flameX, flameY, Math.max(2, fRadius), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Ground shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
  ctx.beginPath();
  ctx.ellipse(cx, boss.height - 3, 30, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Flip horizontally if facing left (since transparent sprite sheet naturally faces RIGHT)
  ctx.save();
  if (boss.facing === 'left') {
    ctx.scale(-1, 1);
    ctx.translate(-boss.width, 0);
  }

  if (isSheetLoaded && baHoLongSheetImg.complete && baHoLongSheetImg.naturalWidth > 0) {
    let frame: SpriteFrameDef;

    if (isDefeated || isStunned) {
      frame = BAHOLONG_DEFEATED_FRAME;
    } else if (isDiceThrow) {
      frame = boss.animTimer % 0.4 < 0.2 ? BAHOLONG_WINDUP_FRAME : BAHOLONG_THROW_FRAME;
    } else if (isMoneyThrow) {
      frame = boss.animTimer % 0.4 < 0.2 ? BAHOLONG_FLASH_FRAME : BAHOLONG_PHOTO_FRAME;
    } else if (isJumpOrFall) {
      frame = boss.vy < 0 ? BAHOLONG_JUMP_ASCEND : BAHOLONG_JUMP_FALL;
    } else if (boss.state === 'patrol' || Math.abs(boss.vx) > 0.3) {
      const runIdx = Math.floor((boss.animTimer * 10) % BAHOLONG_RUN_FRAMES.length);
      frame = BAHOLONG_RUN_FRAMES[runIdx];
    } else {
      const idleIdx = Math.floor((boss.animTimer * 2.5) % BAHOLONG_IDLE_FRAMES.length);
      frame = BAHOLONG_IDLE_FRAMES[idleIdx];
    }

    // Scale reference height ~240px to target boss height (105px)
    const scale = boss.height / 238;
    const drawW = frame.sw * scale;
    const drawH = frame.sh * scale;
    const drawX = (boss.width - drawW) / 2;
    const drawY = boss.height - drawH + (frame.footOffsetY || 0) * scale;

    ctx.drawImage(
      baHoLongSheetImg,
      frame.sx,
      frame.sy,
      frame.sw,
      frame.sh,
      Math.round(drawX),
      Math.round(drawY),
      Math.round(drawW),
      Math.round(drawH)
    );

    ctx.restore(); // Restore facing flip

    drawHealthBar(ctx, boss, cx);
    drawDialogueBubble(ctx, boss, cx);
    ctx.restore();
    return;
  }

  // ==========================================
  // FALLBACK VECTOR/PIXEL ART MATCHING RED JERSEY
  // ==========================================
  const legOffset = Math.sin(boss.animTimer * 10) * 6;
  const legTopY = 66;

  // 1. Legs & Shorts
  ctx.fillStyle = '#18181B'; // Black sports shorts
  ctx.fillRect(cx - 16, 52, 32, 18);
  // Gold crest on shorts
  ctx.fillStyle = '#FACC15';
  ctx.fillRect(cx - 12, 60, 4, 4);

  // Legs
  ctx.fillStyle = '#FED7AA'; // Skin
  ctx.fillRect(cx - 14, legTopY, 10, 22 + legOffset);
  ctx.fillRect(cx + 4, legTopY, 10, 22 - legOffset);

  // Black slides / sandals
  ctx.fillStyle = '#18181B';
  ctx.fillRect(cx - 16, legTopY + 20 + legOffset, 14, 5);
  ctx.fillRect(cx + 2, legTopY + 20 - legOffset, 14, 5);

  // 2. Torso: Red Soccer Jersey with white shoulder stripes
  ctx.fillStyle = '#DC2626'; // Red jersey body
  ctx.fillRect(cx - 18, 26, 36, 30);

  // White shoulder stripes (adidas style)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(cx - 16, 26, 2, 8);
  ctx.fillRect(cx - 12, 26, 2, 8);
  ctx.fillRect(cx + 10, 26, 2, 8);
  ctx.fillRect(cx + 14, 26, 2, 8);

  // Chest white crest / logo
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚽', cx, 42);

  // 3. Arms & Smartphone
  ctx.fillStyle = '#FED7AA';
  ctx.fillRect(cx + 14, 30, 8, 16);
  // Black Smartphone
  ctx.fillStyle = '#09090B';
  ctx.fillRect(cx + 18, 32, 7, 13);
  ctx.fillStyle = '#38BDF8'; // Screen glow
  ctx.fillRect(cx + 19, 34, 5, 9);

  // 4. Head & Black Side-part hair
  ctx.fillStyle = '#FDBA74'; // Neck
  ctx.fillRect(cx - 4, 21, 8, 6);

  ctx.fillStyle = '#18181B'; // Hair
  ctx.beginPath();
  ctx.arc(cx, 14, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FED7AA'; // Face
  ctx.beginPath();
  ctx.arc(cx, 16, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // Restore flip

  drawHealthBar(ctx, boss, cx);
  drawDialogueBubble(ctx, boss, cx);
  ctx.restore();
}

function drawHealthBar(ctx: CanvasRenderingContext2D, boss: Boss, centerX: number) {
  const barW = 100;
  const barH = 10;
  const barX = centerX - barW / 2;
  const barY = -28;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 4);
  ctx.fill();

  const pct = Math.max(0, Math.min(1, boss.health / boss.maxHealth));
  const hpGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  if (boss.isEnraged) {
    hpGrad.addColorStop(0, '#EF4444');
    hpGrad.addColorStop(1, '#DC2626');
  } else {
    hpGrad.addColorStop(0, '#F59E0B');
    hpGrad.addColorStop(1, '#EF4444');
  }

  ctx.fillStyle = hpGrad;
  ctx.roundRect(barX, barY, Math.max(0, barW * pct), barH, 3);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 8.5px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  const bossLabel = boss.isEnraged ? 'BÁ HỘ LONG (CUỒNG NỘ)' : 'BÁ HỘ LONG';
  ctx.fillText(`${bossLabel} ${Math.ceil(boss.health)}/${boss.maxHealth}`, centerX, barY - 4);
  ctx.restore();
}

function drawDialogueBubble(ctx: CanvasRenderingContext2D, boss: Boss, centerX: number) {
  if (boss.dialogueBubble && boss.dialogueBubble.timer > 0) {
    ctx.save();
    const text = boss.dialogueBubble.text;
    ctx.font = 'bold 11px system-ui, sans-serif';
    const textW = ctx.measureText(text).width;
    const bubbleW = textW + 16;
    const bubbleH = 22;
    const bubbleX = centerX - bubbleW / 2;
    const bubbleY = -56;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.strokeStyle = boss.isEnraged ? '#EF4444' : '#F59E0B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = boss.isEnraged ? '#FCA5A5' : '#FEF08A';
    ctx.textAlign = 'center';
    ctx.fillText(text, centerX, bubbleY + 15);
    ctx.restore();
  }
}
