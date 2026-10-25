/**
 * NPC Thuận Sprite Renderer
 * Character: Thuận (Boy in white AIA football jersey, black shorts with blue knee pads,
 * bandaged forehead, bruised, barefoot)
 * Source asset: /assets/aistudio/thuan_transparent.png (1024x1024 transparent sprite sheet)
 * Role: Beaten by Ý who was looking for Phước, runs to Phước to plead for help and warns Phước!
 */

const thuanImg = new Image();
thuanImg.src = '/assets/aistudio/thuan_transparent.png';
let isThuanImgLoaded = false;
thuanImg.onload = () => {
  isThuanImgLoaded = true;
};

export interface ThuanRenderOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  facing: 'left' | 'right';
  state: 'stand_tired' | 'run_panic' | 'cower' | 'hurt_kneel' | 'cheer';
  animTimer: number;
  speechBubble?: {
    text: string;
    timer: number;
  };
}

interface SpriteFrameDef {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  flipX?: boolean;
  footOffsetY?: number;
}

// Scanned exact bounding boxes from thuan_transparent.png (1024x1024)
// Naturally faces RIGHT.
const THUAN_STAND_FRAMES: SpriteFrameDef[] = [
  { sx: 52, sy: 0, sw: 99, sh: 256 },
  { sx: 210, sy: 0, sw: 104, sh: 256 },
  { sx: 370, sy: 0, sw: 105, sh: 256 },
  { sx: 532, sy: 0, sw: 106, sh: 256 },
];

const THUAN_RUN_FRAMES: SpriteFrameDef[] = [
  { sx: 28, sy: 256, sw: 159, sh: 256 },
  { sx: 202, sy: 256, sw: 154, sh: 256 },
  { sx: 373, sy: 256, sw: 129, sh: 256 },
  { sx: 519, sy: 256, sw: 148, sh: 256 },
  { sx: 679, sy: 256, sw: 140, sh: 256 },
  { sx: 841, sy: 256, sw: 147, sh: 256 },
];

const THUAN_HURT_SLIDE_FRAMES: SpriteFrameDef[] = [
  { sx: 43, sy: 512, sw: 167, sh: 256 },
  { sx: 238, sy: 512, sw: 250, sh: 256 },
  { sx: 537, sy: 512, sw: 243, sh: 256 },
  { sx: 834, sy: 512, sw: 135, sh: 256 },
];

const THUAN_KNEEL_FRAMES: SpriteFrameDef[] = [
  { sx: 576, sy: 768, sw: 192, sh: 256 }, // Crawling/getting up
  { sx: 813, sy: 768, sw: 175, sh: 256 }, // Kneeling on one knee, pleading
];

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
 * Fallback vector pixel art if spritesheet is loading
 */
function drawVectorThuanFallback(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Bandage / headband
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(width * 0.32, height * 0.16, width * 0.36, 6);
  ctx.fillStyle = '#EF4444';
  ctx.fillRect(width * 0.52, height * 0.16, 4, 6);

  // Black Hair
  ctx.fillStyle = '#18181B';
  ctx.fillRect(width * 0.30, height * 0.08, width * 0.40, height * 0.12);

  // Face
  ctx.fillStyle = '#FED7AA';
  ctx.fillRect(width * 0.32, height * 0.22, width * 0.36, height * 0.18);

  // White AIA football jersey
  ctx.fillStyle = '#F1F5F9';
  ctx.fillRect(width * 0.28, height * 0.40, width * 0.44, height * 0.28);
  ctx.fillStyle = '#DC2626';
  ctx.font = 'bold 7px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AIA', width * 0.5, height * 0.56);

  // Black shorts & blue knee pads
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(width * 0.32, height * 0.68, width * 0.36, height * 0.14);
  ctx.fillStyle = '#2563EB';
  ctx.fillRect(width * 0.32, height * 0.82, width * 0.14, 6);
  ctx.fillRect(width * 0.54, height * 0.82, width * 0.14, 6);
}

export function drawThuanNPC(ctx: CanvasRenderingContext2D, opt: ThuanRenderOptions) {
  const { x, y, width, height, facing, state, animTimer, speechBubble } = opt;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  // Facing flip: Naturally faces RIGHT
  ctx.save();
  if (facing === 'left') {
    ctx.scale(-1, 1);
    ctx.translate(-width, 0);
  }

  if (isThuanImgLoaded) {
    let frame = THUAN_STAND_FRAMES[0];
    let bobY = 0;

    if (state === 'hurt_kneel' || state === 'cower') {
      const idx = Math.floor(animTimer * 2) % THUAN_KNEEL_FRAMES.length;
      frame = THUAN_KNEEL_FRAMES[idx];
      bobY = 3;
    } else if (state === 'run_panic') {
      const idx = Math.floor(animTimer * 12) % THUAN_RUN_FRAMES.length;
      frame = THUAN_RUN_FRAMES[idx];
    } else if (state === 'cheer') {
      frame = THUAN_STAND_FRAMES[1];
      bobY = Math.abs(Math.sin(animTimer * 8)) * -6;
    } else {
      // Panting tired
      const idx = Math.floor(animTimer * 3) % THUAN_STAND_FRAMES.length;
      frame = THUAN_STAND_FRAMES[idx];
      bobY = Math.sin(animTimer * 2.5) * 1.5;
    }

    drawAlignedFrame(ctx, thuanImg, frame, width, height, bobY);
  } else {
    drawVectorThuanFallback(ctx, width, height);
  }

  ctx.restore(); // Undo facing flip

  // Name Tag
  ctx.fillStyle = '#93C5FD';
  ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Thuận (Cầu Cứu)', width / 2, -10);

  // Speech bubble callout if active
  if (speechBubble && speechBubble.timer > 0) {
    ctx.save();
    const text = speechBubble.text;
    ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
    const textW = ctx.measureText(text).width;
    const bW = Math.max(90, textW + 16);
    const bH = 24;
    const bX = width / 2 - bW / 2;
    const bY = -38;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bX, bY, bW, bH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#BAE6FD';
    ctx.textAlign = 'center';
    ctx.fillText(text, width / 2, bY + 16);
    ctx.restore();
  }

  ctx.restore();
}
