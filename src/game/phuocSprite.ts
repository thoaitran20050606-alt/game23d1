/**
 * Pixel Sprite Sheet Canvas Renderer for Phước
 * Faithfully matches the user's uploaded sprite sheet (image_17775318.png):
 * - Sharp pixel-art young man with black glasses, short neat bangs
 * - Black and white polo / short-sleeve shirt (black sleeves, white torso, crisp black collar)
 * - Black slim trousers & black/grey sneakers
 * - Complete animation set:
 *   * Idle breath & glasses adjustment (Row 0)
 *   * 6-frame run cycle (Row 1)
 *   * Jump / Air / Land frames (Row 2)
 *   * Shout Punch, Throw Item, Parry Guard & Victory Celebration (Row 3)
 */

export interface PhuocRenderOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  facing: 'left' | 'right';
  state: 'idle' | 'run' | 'jump' | 'fall' | 'shout' | 'celebrate';
  animTimer: number;
  isInvulnerable?: boolean;
  isParrying?: boolean;
}

interface SpriteFrameDef {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  footOffsetY?: number;
}

const phuocSheetImg = new Image();
phuocSheetImg.src = '/assets/aistudio/phuoc_transparent.png';
let isPhuocSheetLoaded = false;
phuocSheetImg.onload = () => {
  isPhuocSheetLoaded = true;
};

// Exact pixel bounds from /public/assets/aistudio/phuoc_transparent.png (1024x1024)
// The character naturally faces RIGHT.
const PHUOC_IDLE_FRAMES: SpriteFrameDef[] = [
  { sx: 51, sy: 25, sw: 98, sh: 231 },
  { sx: 215, sy: 25, sw: 98, sh: 231 },
  { sx: 378, sy: 25, sw: 115, sh: 231 },
  { sx: 542, sy: 25, sw: 119, sh: 231 }, // Adjusting glasses
];

const PHUOC_RUN_FRAMES: SpriteFrameDef[] = [
  { sx: 35, sy: 256, sw: 139, sh: 251 },
  { sx: 194, sy: 256, sw: 144, sh: 251 },
  { sx: 358, sy: 256, sw: 139, sh: 256 },
  { sx: 527, sy: 256, sw: 129, sh: 252 },
  { sx: 706, sy: 281, sw: 114, sh: 226 },
  { sx: 859, sy: 281, sw: 135, sh: 226 },
];

const PHUOC_JUMP_TAKEOFF: SpriteFrameDef = { sx: 40, sy: 532, sw: 150, sh: 236 };
const PHUOC_JUMP_ASCEND: SpriteFrameDef = { sx: 220, sy: 532, sw: 144, sh: 236 };
const PHUOC_JUMP_PEAK: SpriteFrameDef = { sx: 384, sy: 512, sw: 144, sh: 221 };
const PHUOC_FALL_FRAME: SpriteFrameDef = { sx: 552, sy: 532, sw: 145, sh: 236 };

const PHUOC_SHOUT_FRAME: SpriteFrameDef = { sx: 40, sy: 783, sw: 181, sh: 241 };
const PHUOC_THROW_FRAME: SpriteFrameDef = { sx: 240, sy: 783, sw: 186, sh: 241 };
const PHUOC_PARRY_FRAME: SpriteFrameDef = { sx: 440, sy: 783, sw: 144, sh: 241 };
const PHUOC_CELEBRATE_FRAME: SpriteFrameDef = { sx: 624, sy: 783, sw: 165, sh: 241 };

export function drawPhuoc(ctx: CanvasRenderingContext2D, opt: PhuocRenderOptions) {
  const { x, y, width, height, facing, state, animTimer, isInvulnerable, isParrying } = opt;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  // Flashing effect when taking damage
  if (isInvulnerable && Math.floor(animTimer * 24) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }

  // Flip horizontally if facing left (sprite naturally faces right)
  if (facing === 'left') {
    ctx.scale(-1, 1);
    ctx.translate(-width, 0);
  }

  // If the transparent sprite sheet is loaded, render high fidelity frame
  if (isPhuocSheetLoaded && phuocSheetImg.complete && phuocSheetImg.naturalWidth > 0) {
    let frame: SpriteFrameDef;

    if (isParrying) {
      frame = PHUOC_PARRY_FRAME;
    } else if (state === 'celebrate') {
      frame = PHUOC_CELEBRATE_FRAME;
    } else if (state === 'shout') {
      frame = PHUOC_SHOUT_FRAME;
    } else if (state === 'jump') {
      frame = animTimer < 0.2 ? PHUOC_JUMP_ASCEND : PHUOC_JUMP_PEAK;
    } else if (state === 'fall') {
      frame = PHUOC_FALL_FRAME;
    } else if (state === 'run') {
      const idx = Math.floor((animTimer * 11) % PHUOC_RUN_FRAMES.length);
      frame = PHUOC_RUN_FRAMES[idx];
    } else {
      // Idle breath / glance
      const idleIdx = Math.floor((animTimer * 2.2) % PHUOC_IDLE_FRAMES.length);
      frame = PHUOC_IDLE_FRAMES[idleIdx];
    }

    // Scale reference height ~235px to target player height (50px)
    const scale = height / 232;
    const drawW = frame.sw * scale;
    const drawH = frame.sh * scale;
    const drawX = (width - drawW) / 2;
    const drawY = height - drawH + (frame.footOffsetY || 0) * scale;

    ctx.drawImage(
      phuocSheetImg,
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
    return;
  }

  // ==========================================
  // FALLBACK VECTOR/PIXEL ART MATCHING THE MODEL
  // ==========================================
  const runFrame = Math.floor((animTimer * 12) % 6);
  let bodyBobY = 0;
  if (state === 'run') {
    bodyBobY = runFrame % 2 === 1 ? -2 : 0;
  } else if (state === 'idle') {
    bodyBobY = Math.sin(animTimer * 3) * 1;
  }

  const cx = width / 2;
  const legTopY = 32 + bodyBobY;
  const pantsColor = '#18181B'; // Black pants
  const shoeColor = '#27272A';  // Black/grey sneakers
  const soleColor = '#E2E8F0';  // White sneaker edge

  // Legs & Shoes
  if (state === 'run') {
    const legOffset = Math.sin(animTimer * 12) * 5;
    ctx.fillStyle = pantsColor;
    ctx.fillRect(cx - 6, legTopY, 5, 12 + legOffset);
    ctx.fillRect(cx + 1, legTopY, 5, 12 - legOffset);
    ctx.fillStyle = shoeColor;
    ctx.fillRect(cx - 7, legTopY + 11 + legOffset, 7, 4);
    ctx.fillRect(cx + 1, legTopY + 11 - legOffset, 7, 4);
    ctx.fillStyle = soleColor;
    ctx.fillRect(cx - 7, legTopY + 14 + legOffset, 7, 1.5);
    ctx.fillRect(cx + 1, legTopY + 14 - legOffset, 7, 1.5);
  } else if (state === 'jump' || state === 'fall') {
    ctx.fillStyle = pantsColor;
    ctx.fillRect(cx - 6, legTopY, 5, 9);
    ctx.fillRect(cx + 1, legTopY + 2, 5, 8);
    ctx.fillStyle = shoeColor;
    ctx.fillRect(cx - 7, legTopY + 8, 7, 4);
    ctx.fillRect(cx + 1, legTopY + 9, 7, 4);
  } else {
    ctx.fillStyle = pantsColor;
    ctx.fillRect(cx - 6, legTopY, 5, 13);
    ctx.fillRect(cx + 1, legTopY, 5, 13);
    ctx.fillStyle = shoeColor;
    ctx.fillRect(cx - 7, legTopY + 12, 7, 4);
    ctx.fillRect(cx + 1, legTopY + 12, 7, 4);
    ctx.fillStyle = soleColor;
    ctx.fillRect(cx - 7, legTopY + 15, 7, 1.5);
    ctx.fillRect(cx + 1, legTopY + 15, 7, 1.5);
  }

  // Torso: Black & White Polo Shirt
  const torsoY = 17 + bodyBobY;
  ctx.fillStyle = '#FFFFFF'; // White center torso
  ctx.fillRect(cx - 6, torsoY, 12, 16);
  ctx.fillStyle = '#18181B'; // Black sleeves
  ctx.fillRect(cx - 9, torsoY, 4, 10);
  ctx.fillRect(cx + 5, torsoY, 4, 10);
  // Black collar & placket
  ctx.fillStyle = '#18181B';
  ctx.fillRect(cx - 3, torsoY, 6, 3);
  ctx.fillRect(cx - 1, torsoY + 3, 2, 6);

  // Arms
  const skinColor = '#FED7AA';
  if (state === 'shout') {
    ctx.fillStyle = skinColor;
    ctx.fillRect(cx + 6, torsoY + 3, 14, 5); // Punch/pointing
  } else if (state === 'celebrate') {
    ctx.fillStyle = skinColor;
    ctx.fillRect(cx - 9, torsoY - 8, 4, 10);
    ctx.fillRect(cx + 5, torsoY - 8, 4, 10);
  } else if (isParrying) {
    ctx.fillStyle = skinColor;
    ctx.fillRect(cx + 3, torsoY + 1, 6, 8); // Guard forearm
  } else {
    ctx.fillStyle = skinColor;
    ctx.fillRect(cx + 5, torsoY + 7, 4, 6);
  }

  // Head, Face & Glasses
  const headY = 10 + bodyBobY;
  ctx.fillStyle = '#FDBA74';
  ctx.fillRect(cx - 2, headY + 5, 4, 3); // Neck

  // Black Hair
  ctx.fillStyle = '#18181B';
  ctx.fillRect(cx - 7, headY - 8, 14, 9);
  ctx.fillRect(cx - 8, headY - 5, 3, 7);

  // Face
  ctx.fillStyle = skinColor;
  ctx.fillRect(cx - 5, headY - 1, 10, 8);

  // Black-Rimmed Glasses with reflective white lens
  ctx.fillStyle = '#18181B';
  ctx.fillRect(cx - 5, headY, 10, 4);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(cx - 4, headY + 1, 3, 2);
  ctx.fillRect(cx + 1, headY + 1, 3, 2);

  ctx.restore();
}
