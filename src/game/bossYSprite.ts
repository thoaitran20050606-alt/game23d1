/**
 * Boss Ý Sprite Renderer & Boba Tea Combat Sprites
 * Character: Ý (Girl with fluffy bear-ear hat, round spectacles, navy blue knitted sweater, crossbody sling bag)
 * Source asset: /assets/aistudio/y_transparent.png (1024x1024 transparent sprite sheet)
 * Attacks: Ly Trà Sữa khổng lồ, Bão Trân Châu Đen nảy tưng tưng, và Tờ Tiền 50K Polymer!
 */

const yImg = new Image();
yImg.src = '/assets/aistudio/y_transparent.png';
let isYImgLoaded = false;
yImg.onload = () => {
  isYImgLoaded = true;
};

export interface YRenderOptions {
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

// Exact sprite bounding coordinates scanned from y_transparent.png (1024x1024)
// Base sprites naturally face RIGHT.
const Y_IDLE_FRAMES: SpriteFrameDef[] = [
  { sx: 56, sy: 0, sw: 122, sh: 256 },
  { sx: 319, sy: 0, sw: 123, sh: 256 },
  { sx: 572, sy: 0, sw: 122, sh: 256 },
  { sx: 831, sy: 0, sw: 123, sh: 256 },
];

const Y_WALK_FRAMES: SpriteFrameDef[] = [
  { sx: 46, sy: 256, sw: 131, sh: 256 },
  { sx: 217, sy: 256, sw: 117, sh: 256 },
  { sx: 378, sy: 256, sw: 119, sh: 256 },
  { sx: 542, sy: 256, sw: 118, sh: 256 },
  { sx: 701, sy: 256, sw: 122, sh: 256 },
  { sx: 858, sy: 256, sw: 131, sh: 256 },
];

const Y_JUMP_FRAMES: SpriteFrameDef[] = [
  { sx: 75, sy: 512, sw: 115, sh: 256 },
  { sx: 314, sy: 512, sw: 153, sh: 256 },
  { sx: 563, sy: 512, sw: 151, sh: 256 },
  { sx: 836, sy: 512, sw: 117, sh: 256 },
];

const Y_THROW_FRAMES: SpriteFrameDef[] = [
  { sx: 66, sy: 768, sw: 154, sh: 256 },  // Windup raise arm
  { sx: 322, sy: 768, sw: 168, sh: 256 }, // Throw release boba!
];

const Y_TAUNT_FRAME: SpriteFrameDef = { sx: 565, sy: 768, sw: 147, sh: 256 };
const Y_CELEBRATE_FRAME: SpriteFrameDef = { sx: 823, sy: 768, sw: 143, sh: 256 };
const Y_STUNNED_FRAME: SpriteFrameDef = { sx: 836, sy: 512, sw: 117, sh: 256 };
const Y_DEFEATED_FRAME: SpriteFrameDef = { sx: 836, sy: 512, sw: 117, sh: 256, footOffsetY: 6 };

function drawAlignedFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  frame: SpriteFrameDef,
  targetWidth: number,
  targetHeight: number,
  bobY: number = 0
) {
  const scale = targetHeight / 210;
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

/**
 * Fallback vector pixel art if spritesheet is still loading
 */
function drawVectorYFallback(ctx: CanvasRenderingContext2D, width: number, height: number, isEnraged: boolean) {
  // Bear Ear Hat
  ctx.fillStyle = '#E5C494';
  ctx.beginPath();
  ctx.arc(width * 0.28, height * 0.16, 12, 0, Math.PI * 2);
  ctx.arc(width * 0.72, height * 0.16, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#D4A373';
  ctx.beginPath();
  ctx.arc(width * 0.28, height * 0.16, 7, 0, Math.PI * 2);
  ctx.arc(width * 0.72, height * 0.16, 7, 0, Math.PI * 2);
  ctx.fill();

  // Hat main dome
  ctx.fillStyle = '#E5C494';
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.28, 22, 0, Math.PI * 2);
  ctx.fill();

  // Face
  ctx.fillStyle = '#FFDFC4';
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.32, 14, 0, Math.PI * 2);
  ctx.fill();

  // Glasses
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(width * 0.42, height * 0.32, 5, 0, Math.PI * 2);
  ctx.arc(width * 0.58, height * 0.32, 5, 0, Math.PI * 2);
  ctx.stroke();

  // Navy blue sweater
  ctx.fillStyle = isEnraged ? '#1E293B' : '#1E3A8A';
  ctx.fillRect(width * 0.32, height * 0.46, width * 0.36, height * 0.30);

  // Crossbody sling bag
  ctx.strokeStyle = '#FDE047';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(width * 0.36, height * 0.46);
  ctx.lineTo(width * 0.64, height * 0.72);
  ctx.stroke();

  ctx.fillStyle = '#FBBF24';
  ctx.beginPath();
  ctx.arc(width * 0.65, height * 0.72, 7, 0, Math.PI * 2);
  ctx.fill();

  // Dark Pants & Shoes
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(width * 0.36, height * 0.76, width * 0.12, height * 0.20);
  ctx.fillRect(width * 0.52, height * 0.76, width * 0.12, height * 0.20);
}

export function drawBossY(ctx: CanvasRenderingContext2D, opt: YRenderOptions) {
  const {
    x,
    y,
    width,
    height,
    facing,
    state,
    animTimer,
    invulnerableTimer,
    isEnraged = false,
    hp = 100,
    maxHp = 100,
  } = opt;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  // Damage blink
  if (invulnerableTimer > 0 && Math.floor(animTimer * 24) % 2 === 0) {
    ctx.globalAlpha = 0.45;
  }

  // Aura when enraged
  if (isEnraged) {
    ctx.save();
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const pulse = Math.sin(animTimer * 12) * 4;
    ctx.arc(width / 2, height / 2, width * 0.65 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Facing flip:
  // Base sprites naturally face RIGHT.
  // When facing LEFT, flip horizontally so she faces LEFT!
  ctx.save();
  if (facing === 'left') {
    ctx.scale(-1, 1);
    ctx.translate(-width, 0);
  }

  if (isYImgLoaded) {
    let frame = Y_IDLE_FRAMES[0];
    let bobY = 0;

    if (state === 'defeated') {
      frame = Y_DEFEATED_FRAME;
      bobY = 4;
    } else if (state === 'stunned') {
      frame = Y_STUNNED_FRAME;
      bobY = Math.sin(animTimer * 18) * 2;
    } else if (state === 'boba_throw' || state === 'throw') {
      const idx = Math.floor(animTimer * 8) % Y_THROW_FRAMES.length;
      frame = Y_THROW_FRAMES[idx];
    } else if (state === 'pearl_barrage' || state === 'jump_slam') {
      const idx = Math.floor(animTimer * 10) % Y_JUMP_FRAMES.length;
      frame = Y_JUMP_FRAMES[idx];
    } else if (state === 'money50k_throw' || state === 'taunt') {
      frame = Y_TAUNT_FRAME;
    } else if (state === 'patrol' || state === 'walk') {
      const walkSpeed = isEnraged ? 14 : 9;
      const idx = Math.floor(animTimer * walkSpeed) % Y_WALK_FRAMES.length;
      frame = Y_WALK_FRAMES[idx];
    } else {
      // Idle breathing
      const idleIdx = Math.floor(animTimer * 4) % Y_IDLE_FRAMES.length;
      frame = Y_IDLE_FRAMES[idleIdx];
      bobY = Math.sin(animTimer * 3.5) * 1.5;
    }

    drawAlignedFrame(ctx, yImg, frame, width, height, bobY);
  } else {
    drawVectorYFallback(ctx, width, height, isEnraged);
  }

  ctx.restore(); // Undo facing flip

  // Stun stars above head
  if (state === 'stunned') {
    ctx.save();
    for (let s = 0; s < 3; s++) {
      const angle = animTimer * 7 + (s * Math.PI * 2) / 3;
      const starX = width / 2 + Math.cos(angle) * 18;
      const starY = -10 + Math.sin(angle) * 6;
      ctx.fillStyle = '#FACC15';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💫', starX, starY);
    }
    ctx.restore();
  }

  // Mini Health Bar above Ý during battle
  if (state !== 'defeated' && maxHp > 0) {
    const barW = 54;
    const barH = 5;
    const barX = (width - barW) / 2;
    const barY = -12;
    const hpPct = Math.max(0, Math.min(1, hp / maxHp));

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    ctx.fillStyle = isEnraged ? '#F43F5E' : '#EC4899';
    ctx.fillRect(barX, barY, barW * hpPct, barH);

    ctx.fillStyle = '#FCE7F3';
    ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Ý (Trà Sữa & 50K)', width / 2, barY - 4);
  }

  ctx.restore();
}

/**
 * Vẽ Ly Trà Sữa Bay (Boba Cup Attack)
 */
export function drawBobaCup(ctx: CanvasRenderingContext2D, atk: { x: number; y: number; width: number; height: number; rotation?: number }) {
  ctx.save();
  ctx.translate(atk.x + atk.width / 2, atk.y + atk.height / 2);
  if (atk.rotation !== undefined) ctx.rotate(atk.rotation);

  // Cup body dimensions
  const cupW = 24;
  const cupH = 34;

  // 1. Ice Milk Tea liquid gradient
  const teaGrad = ctx.createLinearGradient(0, -cupH / 2, 0, cupH / 2);
  teaGrad.addColorStop(0, '#FDE68A'); // Creamy milk froth top
  teaGrad.addColorStop(0.35, '#D97706'); // Warm sweet milk tea
  teaGrad.addColorStop(1, '#92400E'); // Rich black tea bottom

  ctx.fillStyle = teaGrad;
  ctx.beginPath();
  ctx.moveTo(-cupW / 2 + 2, -cupH / 2);
  ctx.lineTo(cupW / 2 - 2, -cupH / 2);
  ctx.lineTo(cupW / 2 - 5, cupH / 2);
  ctx.lineTo(-cupW / 2 + 5, cupH / 2);
  ctx.closePath();
  ctx.fill();

  // 2. Black Boba Pearls at bottom of cup
  ctx.fillStyle = '#171717';
  const pearls = [
    [-5, cupH / 2 - 5], [0, cupH / 2 - 4], [5, cupH / 2 - 6],
    [-3, cupH / 2 - 10], [3, cupH / 2 - 9],
  ];
  pearls.forEach(([px, py]) => {
    ctx.beginPath();
    ctx.arc(px, py, 3.2, 0, Math.PI * 2);
    ctx.fill();
    // Shiny pearl glint
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(px - 1, py - 2, 1.2, 1.2);
    ctx.fillStyle = '#171717';
  });

  // 3. Clear plastic cup rim & dome lid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(0, -cupH / 2, cupW / 2, 3.5, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Dome lid
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.arc(0, -cupH / 2, 9, Math.PI, 0);
  ctx.fill();
  ctx.stroke();

  // 4. Slanted colorful Boba Straw
  ctx.strokeStyle = '#EC4899';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(2, -cupH / 2 - 12);
  ctx.lineTo(-2, cupH / 2 - 6);
  ctx.stroke();

  // 5. Playful cup sticker logo
  ctx.fillStyle = '#BE185D';
  ctx.beginPath();
  ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 6px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Ý', 0, 2);

  ctx.restore();
}

/**
 * Vẽ Hạt Trân Châu Đen Nảy (Boba Pearl Projectile)
 */
export function drawBobaPearl(ctx: CanvasRenderingContext2D, atk: { x: number; y: number; width: number; height: number; rotation?: number }) {
  ctx.save();
  ctx.translate(atk.x + atk.width / 2, atk.y + atk.height / 2);

  // Black chewy boba ball
  ctx.fillStyle = '#0A0A0A';
  ctx.beginPath();
  ctx.arc(0, 0, atk.width / 2, 0, Math.PI * 2);
  ctx.fill();

  // Brownish-caramel rim glow
  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Bright reflection glint
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(-atk.width * 0.22, -atk.height * 0.22, atk.width * 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Vẽ Tờ Tiền 50.000 VNĐ Polymer (50K Bill Projectile)
 */
export function drawBill50k(ctx: CanvasRenderingContext2D, atk: { x: number; y: number; width: number; height: number; rotation?: number }) {
  ctx.save();
  ctx.translate(atk.x + atk.width / 2, atk.y + atk.height / 2);
  if (atk.rotation !== undefined) ctx.rotate(atk.rotation);

  const w = atk.width;
  const h = atk.height;

  // 1. Signature Pink-Purple Vietnamese 50,000 VND Banknote
  ctx.fillStyle = '#DB2777'; // Pinkish-magenta base
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 3);
  ctx.fill();

  // 2. Inner ornate border
  ctx.strokeStyle = '#F472B6';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4);

  // 3. Clear oval polymer security window
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.ellipse(-w / 2 + 7, 0, 4, h * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. Value text: "50.000"
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 8px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('50k', w * 0.15, 2.5);

  ctx.restore();
}
