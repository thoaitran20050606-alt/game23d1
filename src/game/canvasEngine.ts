/**
 * Canvas 2D Game Engine for Hành Trình Phước
 * High-performance 60fps physics, zero-lag input, robust collision detection,
 * and character model matching the user's reference sprite sheet.
 */

import {
  Player,
  Boss,
  EnemyOtter,
  Projectile,
  BossAttack,
  Collectible,
  Platform,
  Particle,
  LevelData,
  BossStoryEvent,
  AttackBecauseOptions,
  MobileAimMode,
  ThoaiQuestState,
} from '../types/game';
import { sounds } from '../audio/soundEffects';
import { drawPhuoc } from './phuocSprite';
import { drawOtter } from './otterSprite';
import { Level1Scenery } from './level1Scenery';
import { Level2Scenery } from './level2Scenery';
import { Level4Scenery } from './level4Scenery';
import { drawCsgtBoss } from './bossCsgtSprite';
import { drawBaHoLongBoss } from './bossBaHoLongSprite';
import { drawBossY, drawBobaCup, drawBobaPearl, drawBill50k } from './bossYSprite';
import { drawThuanNPC } from './thuanNpcSprite';
import { drawThoai } from './thoaiNpcSprite';
import { drawTruongMiniBoss, drawSingleSlipper, drawDroppedSlippers } from './truongMiniBossSprite';
import { TamPhuocSchoolScenery } from './tamPhuocSchoolScenery';
import { getStoryEventLines } from '../data/storyDialogues';

export interface EngineCallbacks {
  onLevelComplete: (nextLevelId: number) => void;
  onVictory: () => void;
  onGameOver: (reason?: string) => void;
  onScoreUpdate: (score: number, coins: number, health: number) => void;
  onBossHealthUpdate?: (hp: number, maxHp: number, bossName?: string) => void;
  onTimeUpdate?: (timeLeft: number) => void;
  onCooldownUpdate?: (cooldownRemaining: number, maxCooldown: number) => void;
  onBossStoryEvent?: (event: BossStoryEvent) => void;
  onEnergyUpdate?: (energy: number, maxEnergy: number) => void;
  onParryStateUpdate?: (isParrying: boolean, parryCooldown: number) => void;
}

export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;

  public level: LevelData;
  public player: Player;
  public boss: Boss | null = null;
  public enemies: EnemyOtter[] = [];
  public collectibles: Collectible[] = [];
  public platforms: Platform[] = [];
  public projectiles: Projectile[] = [];
  public bossAttacks: BossAttack[] = [];
  public particles: Particle[] = [];

  // Countdown timer for level
  public timeLeft = 120;
  private lastReportedTime = -1;

  // Attack cooldown constraint tracking (Phước 2.5s cooldown)
  public readonly maxAttackCooldown = 2.5;
  private lastReportedCooldown = -1;

  // Safe ground checkpoint coordinates for pitfall recovery
  private lastSafeGroundedX = 80;
  private lastSafeGroundedY = 448;

  // Cached callback state to avoid unnecessary React re-renders
  private lastReportedScore = -1;
  private lastReportedCoins = -1;
  private lastReportedHealth = -1;
  private lastReportedBossHp = -1;
  private lastReportedEnergy = -1;
  private lastReportedParrying = false;

  // Camera viewport
  public cameraX = 0;
  public cameraY = 0;
  public viewportWidth = 960;
  public viewportHeight = 540;

  // Input states
  private keysHeld: Record<string, boolean> = {};
  private jumpBuffered = false;

  // Game loop & simulation
  private animFrameId: number | null = null;
  private lastTime = 0;
  public isRunning = false;
  public isPaused = false;

  // Stats
  public score = 0;
  public coins = 0;
  public becauseShoutsCount = 0;

  // Level 1: Thoại NPC & Trường Mini-Boss (THPT Tam Phước)
  public thoaiQuestState: ThoaiQuestState = 'not_started';
  public hasThoaiSlippers = false;
  public hasBridgeKey = false;
  public level1Area: 'river' | 'tam_phuoc_school' = 'river';
  public thoaiX = 1750;
  public thoaiY = 438;
  public thoaiVx = 0;
  public thoaiFacing: 'left' | 'right' = 'left';
  public thoaiState: 'idle' | 'walk' | 'wave' | 'worry' | 'celebrate' = 'worry';
  public thoaiAnimTimer = 0;
  public readonly thoaiWidth = 38;
  public readonly thoaiHeight = 52;
  public readonly schoolDoorX = 1860;
  public readonly schoolDoorY = 370;
  public readonly schoolDoorWidth = 70;
  public readonly schoolDoorHeight = 120;
  private lastRiverX = 1840;
  private lastRiverY = 438;

  // Trường Mini-Boss State inside THPT Tam Phước
  public truongDefeated = false;
  public truongIntroPlayed = false;
  public truongHp = 250;
  public truongMaxHp = 250;
  public truongX = 750;
  public truongY = 406;
  public truongVx = -1.3;
  public truongVy = 0;
  public truongWidth = 44;
  public truongHeight = 64;
  public truongFacing: 'left' | 'right' = 'left';
  public truongState:
    | 'idle'
    | 'patrol'
    | 'steal_slipper'
    | 'taunt_slipper'
    | 'dash_slipper'
    | 'throw_slipper'
    | 'rain_slipper'
    | 'stunned'
    | 'defeated' = 'patrol';
  public truongAnimTimer = 0;
  public truongStateTimer = 0;
  public truongAttackCooldown = 2.0;
  public truongInvulnerableTimer = 0;
  public truongDialogueBubble?: { text: string; timer: number };
  public truongEnraged = false;
  public truongPatrolStartX = 750;
  public droppedSlippersPos: { x: number; y: number } | null = null;

  // Level 3: Thuận NPC & Boss Ý State
  public thuanX = 180;
  public thuanY = 440;
  public thuanFacing: 'left' | 'right' = 'right';
  public thuanState: 'stand_tired' | 'run_panic' | 'cower' | 'hurt_kneel' | 'cheer' = 'hurt_kneel';
  public thuanAnimTimer = 0;
  public thuanSpeechBubble?: { text: string; timer: number };
  public level3IntroPlayed = false;
  public hasDinhKey = false;

  // Stored platforms for river vs school
  private riverPlatforms: Platform[] = [];
  private schoolPlatforms: Platform[] = [
    { x: 0, y: 470, width: 1200, height: 130, type: 'ground' },
    { x: 190, y: 380, width: 120, height: 20, type: 'brick' },
    { x: 520, y: 340, width: 160, height: 20, type: 'brick' },
    { x: 880, y: 380, width: 120, height: 20, type: 'brick' },
  ];
  // Collectibles for river vs school (User request: thêm vài cục trái tim ở màn đánh boss Trường)
  private riverCollectibles: Collectible[] = [];
  private schoolCollectibles: Collectible[] = [
    { id: 'school-heart-1', x: 235, y: 320, width: 28, height: 28, type: 'heart_heal', collected: false, bobOffset: 0 },
    { id: 'school-heart-2', x: 585, y: 280, width: 28, height: 28, type: 'heart_heal', collected: false, bobOffset: 1.5 },
    { id: 'school-heart-3', x: 925, y: 320, width: 28, height: 28, type: 'heart_heal', collected: false, bobOffset: 3.0 },
    { id: 'school-heart-4', x: 420, y: 425, width: 28, height: 28, type: 'heart_heal', collected: false, bobOffset: 2.2 },
  ];

  // Screen shake
  private screenShake = 0;

  // Background river waves timer
  private riverTimer = 0;

  // Aim Trajectory preview (for mobile drag-to-aim)
  public aimTrajectory: { active: boolean; angle: number } | null = null;
  // Tap-to-aim visual effect on canvas
  public tapTargetEffect: { x: number; y: number; life: number; maxLife: number } | null = null;

  public setAimTrajectory(angleRad: number, active: boolean) {
    if (!active) {
      this.aimTrajectory = null;
    } else {
      this.aimTrajectory = { active: true, angle: angleRad };
    }
  }

  public triggerTapTargetEffect(x: number, y: number) {
    this.tapTargetEffect = { x, y, life: 0.35, maxLife: 0.35 };
  }

  constructor(canvas: HTMLCanvasElement, level: LevelData, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;
    this.callbacks = callbacks;
    this.level = level;

    this.player = this.createInitialPlayer(level.spawnPoint.x, level.spawnPoint.y);
    this.initLevel(level);
  }

  private createInitialPlayer(x: number, y: number): Player {
    return {
      x,
      y,
      vx: 0,
      vy: 0,
      width: 34,
      height: 50,
      facing: 'right',
      isGrounded: false,
      health: 3,
      maxHealth: 3,
      invulnerableTimer: 0,
      attackCooldown: 0,
      isAttacking: false,
      speechShoutTimer: 0,
      state: 'idle',
      animTimer: 0,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      mobileJumpSustainTimer: 0,
      energy: 0,
      maxEnergy: 100,
      isParrying: false,
      parryTimer: 0,
      parryCooldown: 0,
    };
  }

  public initLevel(level: LevelData) {
    this.level = level;
    this.platforms = JSON.parse(JSON.stringify(level.platforms));
    this.enemies = JSON.parse(JSON.stringify(level.enemies));
    this.collectibles = JSON.parse(JSON.stringify(level.collectibles));
    this.boss = level.boss ? JSON.parse(JSON.stringify(level.boss)) : null;

    this.projectiles = [];
    this.bossAttacks = [];
    this.particles = [];
    this.player.x = level.spawnPoint.x;
    this.player.y = level.spawnPoint.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isGrounded = false;
    this.cameraX = 0;
    this.lastSafeGroundedX = level.spawnPoint.x;
    this.lastSafeGroundedY = level.spawnPoint.y;

    // Initialize Countdown Timer for Level
    this.timeLeft = level.timeLimit || 100;
    this.lastReportedTime = -1;
    this.player.attackCooldown = 0;
    this.lastReportedCooldown = -1;

    this.lastReportedScore = -1;
    this.lastReportedCoins = -1;
    this.lastReportedHealth = -1;
    this.lastReportedBossHp = -1;

    if (this.boss && this.callbacks.onBossHealthUpdate) {
      const bossName =
        this.boss.bossType === 'baholong'
          ? 'Bá Hộ Long'
          : this.boss.bossType === 'y'
          ? 'Boss Ý (Trà Sữa & 50K)'
          : 'Công an';
      this.callbacks.onBossHealthUpdate(this.boss.health, this.boss.maxHealth, bossName);
    }
    if (level.id === 3) {
      this.thuanX = 180;
      this.thuanY = 440;
      this.thuanFacing = 'right';
      this.thuanState = 'hurt_kneel';
      this.level3IntroPlayed = false;
      this.hasDinhKey = false;
    }
    if (this.callbacks.onTimeUpdate) {
      this.callbacks.onTimeUpdate(Math.ceil(this.timeLeft));
    }
    if (this.callbacks.onCooldownUpdate) {
      this.callbacks.onCooldownUpdate(0, this.maxAttackCooldown);
    }

    // Reset Level 1 Thoại Quest & THPT Tam Phước Sub-Area
    if (level.id === 1) {
      this.riverPlatforms = JSON.parse(JSON.stringify(level.platforms));
      this.level1Area = 'river';
      this.thoaiQuestState = 'not_started';
      this.hasThoaiSlippers = false;
      this.hasBridgeKey = false;
      this.thoaiX = 1750;
      this.thoaiY = 438;
      this.thoaiVx = 0;
      this.thoaiFacing = 'left';
      this.thoaiState = 'worry';
      this.thoaiAnimTimer = 0;
      this.truongDefeated = false;
      this.truongHp = 250;
      this.truongMaxHp = 250;
      this.truongX = 750;
      this.truongY = 406;
      this.truongVy = 0;
      this.truongFacing = 'left';
      this.truongState = 'patrol';
      this.truongStateTimer = 0;
      this.truongEnraged = false;
      this.droppedSlippersPos = null;
      this.schoolCollectibles = [
        { id: 'school-heart-1', x: 235, y: 320, width: 28, height: 28, type: 'heart_heal', collected: false, bobOffset: 0 },
        { id: 'school-heart-2', x: 585, y: 280, width: 28, height: 28, type: 'heart_heal', collected: false, bobOffset: 1.5 },
        { id: 'school-heart-3', x: 925, y: 320, width: 28, height: 28, type: 'heart_heal', collected: false, bobOffset: 3.0 },
        { id: 'school-heart-4', x: 420, y: 425, width: 28, height: 28, type: 'heart_heal', collected: false, bobOffset: 2.2 },
      ];
    }

    // Dynamic Level Opening Character Speeches
    if (level.id === 1) {
      this.setPlayerSpeech('Trúc ơi hãy đợi anh! Anh sẽ vượt Sông Buông cứu em!', 3.5);
    } else if (level.id === 2) {
      this.setPlayerSpeech('Phố Huyện! Cháu có lý lẽ chính đáng để cứu bạn gái... BECAUSE!', 3.5);
    } else if (level.id === 3) {
      this.setPlayerSpeech('Sau cú té xe, Long trốn vào cổng dinh! Anh tới cứu em đây, Trúc!', 3.5);
    } else {
      this.setPlayerSpeech('Bá Hộ Long! Đại lộ Sài Gòn đêm nay sẽ là hồi kết!', 3.5);
    }
  }

  public setPlayerSpeech(text: string, duration = 2.4) {
    this.player.dialogueBubble = {
      text,
      timer: duration,
    };
  }

  public start() {
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    sounds.startBgm(this.level.id);

    // Màn 3: Tự động kích hoạt đối thoại 3 người mở màn (Thuận cầu cứu Phước, đối đầu Boss Ý)
    if (this.level.id === 3 && !this.level3IntroPlayed && this.callbacks.onBossStoryEvent) {
      this.level3IntroPlayed = true;
      setTimeout(() => {
        if (!this.isRunning) return;
        this.pause();
        if (this.callbacks.onBossStoryEvent) {
          this.callbacks.onBossStoryEvent({
            stage: 'y_intro',
            speaker: 'Thuận & Ý',
            currentDialogIndex: 0,
            dialogues: [],
            lines: getStoryEventLines('y_intro'),
          });
        }
      }, 350);
    }

    const loop = (currentTime: number) => {
      if (!this.isRunning) return;
      const rawDt = (currentTime - this.lastTime) / 1000;
      const dt = Math.min(rawDt, 0.04); // clamp dt
      this.lastTime = currentTime;

      if (!this.isPaused) {
        this.update(dt);
      }
      this.render();

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    sounds.stopBgm();
  }

  public pause() {
    this.isPaused = true;
    sounds.pauseBgm();
  }

  public resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
    if (this.level.id === 1 && this.level1Area === 'tam_phuoc_school' && !this.truongDefeated) {
      sounds.startBossMusic('truong');
    } else if (this.level.id === 3 && this.boss && this.boss.state !== 'defeated') {
      sounds.startBossMusic('y');
    } else {
      sounds.resumeBgm();
    }
  }

  // Instant responsive input handling
  public handleKeyDown(code: string) {
    this.keysHeld[code] = true;
    if (code === 'Space' || code === 'KeyW' || code === 'ArrowUp') {
      this.performJump();
    }
    if (code === 'KeyF') {
      this.triggerBecauseAttack();
    }
    if (code === 'KeyC' || code === 'KeyS' || code === 'ArrowDown') {
      this.triggerParry();
    }
    // Phím E gán cho Chiêu Tối Thượng (3 Hộp Son) theo yêu cầu người dùng
    if (code === 'KeyE' || code === 'KeyK' || code === 'KeyQ' || code === 'KeyU') {
      if (code === 'KeyE' && (this.isNearThoai() || this.isNearSchoolDoor() || this.isNearSchoolExit())) {
        this.handleInteract();
      } else {
        this.triggerUltimateLipstick();
      }
    }
    if (code === 'Enter') {
      this.handleInteract();
    }
  }

  public handleKeyUp(code: string) {
    this.keysHeld[code] = false;
  }

  public performJump(fromMobile: boolean = false) {
    const p = this.player;
    if (p.isGrounded || p.coyoteTimer > 0) {
      p.vy = -12.0;
      p.isGrounded = false;
      p.coyoteTimer = 0;
      p.jumpBufferTimer = 0;
      this.jumpBuffered = false;
      if (fromMobile) {
        this.keysHeld['Space'] = true;
        p.mobileJumpSustainTimer = 0.32;
      }
      sounds.playJump();
      this.spawnJumpDust();
    } else {
      // Buffer jump for responsive landing leap
      this.jumpBuffered = true;
      p.jumpBufferTimer = 0.18;
    }
  }

  public isNearThoai(): boolean {
    return (
      this.level.id === 1 &&
      this.level1Area === 'river' &&
      Math.abs(this.player.x - this.thoaiX) < 85 &&
      Math.abs(this.player.y - this.thoaiY) < 95
    );
  }

  public isNearSchoolDoor(): boolean {
    return (
      this.level.id === 1 &&
      this.level1Area === 'river' &&
      Math.abs(this.player.x - (this.schoolDoorX + 35)) < 85 &&
      Math.abs(this.player.y - (this.schoolDoorY + 60)) < 110
    );
  }

  public isNearSchoolExit(): boolean {
    return (
      this.level.id === 1 &&
      this.level1Area === 'tam_phuoc_school' &&
      this.player.x < 140
    );
  }

  public handleInteract() {
    if (this.isNearThoai()) {
      this.interactWithThoai();
    } else if (this.isNearSchoolDoor()) {
      this.enterTamPhuocSchool();
    } else if (this.isNearSchoolExit()) {
      this.exitTamPhuocSchool();
    }
  }

  public interactWithThoai() {
    if (this.level.id !== 1 || this.level1Area !== 'river') return;

    if (this.thoaiQuestState === 'not_started') {
      this.pause();
      if (this.callbacks.onBossStoryEvent) {
        this.callbacks.onBossStoryEvent({
          stage: 'thoai_intro',
          speaker: 'Thoại',
          currentDialogIndex: 0,
          dialogues: [],
          lines: getStoryEventLines('thoai_intro'),
        });
      }
      this.thoaiQuestState = 'accepted';
      this.setPlayerSpeech('Vào THPT Tam Phước dạy tên Trường một bài học thôi!', 3.0);
    } else if (this.thoaiQuestState === 'accepted') {
      this.pause();
      if (this.callbacks.onBossStoryEvent) {
        this.callbacks.onBossStoryEvent({
          stage: 'thoai_waiting',
          speaker: 'Thoại',
          currentDialogIndex: 0,
          dialogues: [],
          lines: getStoryEventLines('thoai_waiting'),
        });
      }
    } else if (this.thoaiQuestState === 'slippers_recovered') {
      this.pause();
      sounds.playKeyGet();
      if (this.callbacks.onBossStoryEvent) {
        this.callbacks.onBossStoryEvent({
          stage: 'thoai_return_slippers',
          speaker: 'Thoại',
          currentDialogIndex: 0,
          dialogues: [],
          lines: getStoryEventLines('thoai_return_slippers'),
        });
      }
      this.hasBridgeKey = true;
      this.thoaiQuestState = 'completed';
      this.score += 1000;
      this.spawnHeartHealParticles(this.thoaiX + 20, this.thoaiY);
      this.setPlayerSpeech('Đã có Chìa Khóa Cổng! Mau tiến sang Màn 2 thôi!', 3.5);
    } else {
      this.pause();
      if (this.callbacks.onBossStoryEvent) {
        this.callbacks.onBossStoryEvent({
          stage: 'thoai_completed',
          speaker: 'Thoại',
          currentDialogIndex: 0,
          dialogues: [],
          lines: getStoryEventLines('thoai_completed'),
        });
      }
    }
  }

  public enterTamPhuocSchool() {
    if (this.level.id !== 1 || this.level1Area === 'tam_phuoc_school') return;
    sounds.playDoorWarp();
    this.lastRiverX = this.player.x;
    this.lastRiverY = this.player.y;
    this.level1Area = 'tam_phuoc_school';
    this.platforms = this.schoolPlatforms;
    // Swap collectibles: Place hearts in Trường mini-boss arena!
    this.riverCollectibles = this.collectibles;
    this.collectibles = this.schoolCollectibles;
    this.player.x = 160;
    this.player.y = 410;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.facing = 'right';
    this.cameraX = 0;

    // Report mini-boss health if Trường is not yet defeated
    if (!this.truongDefeated) {
      sounds.startBossMusic('truong');
      if (this.callbacks.onBossHealthUpdate) {
        this.callbacks.onBossHealthUpdate(
          this.truongHp,
          this.truongMaxHp,
          'Trường - Trùm Bắt Nạt Trộm Dép (THPT Tam Phước)'
        );
      }
    }

    // Trigger Trường Intro Story Dialogue Modal if not yet played
    if (!this.truongDefeated && !this.truongIntroPlayed && this.callbacks.onBossStoryEvent) {
      this.truongIntroPlayed = true;
      this.pause();
      this.callbacks.onBossStoryEvent({
        stage: 'truong_intro',
        speaker: 'Trường',
        currentDialogIndex: 0,
        dialogues: [],
        lines: getStoryEventLines('truong_intro'),
      });
    }

    this.setPlayerSpeech('Trường đâu mau trả dép cho Thoại!', 2.5);
  }

  public exitTamPhuocSchool() {
    if (this.level.id !== 1 || this.level1Area !== 'tam_phuoc_school') return;
    sounds.playDoorWarp();
    sounds.startBgm(1);
    this.level1Area = 'river';
    this.platforms = this.riverPlatforms;
    // Restore river collectibles
    this.schoolCollectibles = this.collectibles;
    this.collectibles = this.riverCollectibles;
    this.player.x = 1840;
    this.player.y = 438;
    this.player.vx = 0;
    this.player.vy = 0;
    this.cameraX = Math.max(0, this.player.x - this.viewportWidth * 0.4);

    // Clear mini boss HP from HUD in river area
    if (this.callbacks.onBossHealthUpdate) {
      this.callbacks.onBossHealthUpdate(undefined as any, undefined as any, undefined);
    }

    if (this.hasThoaiSlippers && this.thoaiQuestState !== 'completed') {
      this.setPlayerSpeech('Đã lấy được dép rồi! Mau lại gặp Thoại để trả dép!', 3.0);
    }
  }

  public damageTruong(amount: number) {
    if (this.truongDefeated || this.truongInvulnerableTimer > 0) return;
    this.truongHp = Math.max(0, this.truongHp - amount);
    this.truongInvulnerableTimer = 0.42;
    this.truongState = 'stunned';
    this.truongStateTimer = 0.42;
    this.screenShake = 0.6;
    sounds.playBossHurt();

    // Spawn damage stars
    for (let p = 0; p < 8; p++) {
      this.particles.push({
        x: this.truongX + this.truongWidth / 2,
        y: this.truongY + this.truongHeight / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        size: Math.random() * 5 + 2,
        color: '#FACC15',
        alpha: 1,
        life: 0.4,
        maxLife: 0.4,
        shape: 'star',
      });
    }

    if (this.callbacks.onBossHealthUpdate) {
      this.callbacks.onBossHealthUpdate(
        this.truongHp,
        this.truongMaxHp,
        'Trường - Trùm Bắt Nạt Trộm Dép (THPT Tam Phước)'
      );
    }

    // Phase 2 Enrage at <= 125 HP (50% of 250 HP)
    if (this.truongHp <= 125 && !this.truongEnraged) {
      this.truongEnraged = true;
      this.screenShake = 1.0;
      this.truongDialogueBubble = {
        text: 'BECAUSE GÌ?! TAO NỔI ĐIÊN RỒI! BÃO DÉP TỔ ONG HUỶ DIỆT!!!',
        timer: 2.8,
      };
      this.executeTruongRainSlipperAttack();
    }

    if (this.truongHp <= 0) {
      this.truongHp = 0;
      this.truongDefeated = true;
      this.truongState = 'defeated';
      sounds.startBgm(1);
      this.truongDialogueBubble = {
        text: 'Ui da! Tớ chừa rồi, trả dép cho Thoại đây!',
        timer: 3.5,
      };
      if (this.callbacks.onBossHealthUpdate) {
        this.callbacks.onBossHealthUpdate(
          0,
          this.truongMaxHp,
          'Trường - Đã đầu hàng trả dép'
        );
      }
      sounds.playVictory();
      this.score += 2000;
      this.droppedSlippersPos = { x: this.truongX, y: 440 };

      // Spawn victory fanfare particles
      for (let p = 0; p < 24; p++) {
        this.particles.push({
          x: this.truongX + this.truongWidth / 2,
          y: this.truongY + 20,
          vx: (Math.random() - 0.5) * 10,
          vy: -Math.random() * 8 - 3,
          size: Math.random() * 6 + 3,
          color: ['#FACC15', '#4ADE80', '#38BDF8', '#F43F5E'][p % 4],
          alpha: 1,
          life: 0.8,
          maxLife: 0.8,
          shape: 'star',
        });
      }
    }
  }

  private executeTruongStealAction() {
    if (this.truongDefeated) return;
    this.truongState = 'steal_slipper';
    this.truongStateTimer = 2.2;
    const dir = this.player.x < this.truongX ? -1 : 1;
    this.truongFacing = dir === -1 ? 'left' : 'right';
    this.truongVx = dir * (this.truongEnraged ? 2.4 : 1.6);

    const stealShouts = [
      'Hí hí! Lén trộm thêm đôi dép tổ ong nữa!',
      'Dép để ở kệ trường à? Tao lấy luôn!',
      'Dép tổ ong của Thoại êm quá, giờ là của tao!',
      'Trộm sạch dép THPT Tam Phước xem ai cản được tao!',
    ];
    this.truongDialogueBubble = {
      text: stealShouts[Math.floor(Math.random() * stealShouts.length)],
      timer: 2.0,
    };

    sounds.playCoin();
    for (let p = 0; p < 6; p++) {
      this.particles.push({
        x: this.truongX + this.truongWidth / 2,
        y: this.truongY + 28,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3,
        size: Math.random() * 4 + 2,
        color: '#FDE047',
        alpha: 1,
        life: 0.45,
        maxLife: 0.45,
        shape: 'star',
      });
    }
  }

  private executeTruongTauntAction() {
    if (this.truongDefeated) return;
    this.truongState = 'taunt_slipper';
    this.truongStateTimer = 1.8;
    this.truongVx = 0;
    this.truongFacing = this.player.x < this.truongX ? 'left' : 'right';

    const tauntLines = [
      'Đố Phước lấy lại được đôi dép này đấy!',
      'Dép tổ ong huyền thoại giờ là của tao!',
      'Mày chỉ biết hét BECAUSE thôi à? Thách dám đụng tao!',
      'Haha! Cả trường Tam Phước này tao trùm, mày là ai?!',
    ];
    this.truongDialogueBubble = {
      text: tauntLines[Math.floor(Math.random() * tauntLines.length)],
      timer: 1.8,
    };
  }

  private executeTruongDashAction() {
    if (this.truongDefeated) return;
    this.truongState = 'dash_slipper';
    this.truongStateTimer = 0.9;
    const dir = this.player.x < this.truongX ? -1 : 1;
    this.truongFacing = dir === -1 ? 'left' : 'right';
    this.truongVx = dir * (this.truongEnraged ? 7.6 : 6.0);

    this.truongDialogueBubble = {
      text: 'Lao vào cướp dép! Tránh đường ra mau!',
      timer: 1.2,
    };
    sounds.playSlipperThrow();
  }

  private executeTruongSlipperAttack() {
    if (this.truongDefeated) return;
    this.truongState = 'throw_slipper';
    this.truongStateTimer = 0.75;
    const dir = this.player.x < this.truongX ? -1 : 1;
    this.truongFacing = dir === -1 ? 'left' : 'right';

    sounds.playSlipperThrow();
    const taunts = [
      'Dép Tổ Ong bay thẳng vào mặt!',
      'Né thử chiếc dép lào này xem!',
      'Dép thần tốc! Đỡ lấy Phước!',
      'Dép trộm được ném sướng tay thật!',
    ];
    this.truongDialogueBubble = {
      text: taunts[Math.floor(Math.random() * taunts.length)],
      timer: 1.6,
    };

    const count = this.truongEnraged ? 3 : (Math.random() > 0.4 ? 2 : 1);
    for (let i = 0; i < count; i++) {
      const speed = (this.truongEnraged ? 8.0 : 6.8) + i * 1.8;
      const angle = -0.12 - (i - 1) * 0.18;
      this.bossAttacks.push({
        id: Math.random().toString(),
        x: this.truongX + (dir === 1 ? this.truongWidth : 0),
        y: this.truongY + 18 + i * 6,
        vx: dir * Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        type: 'slipper_throw',
        width: 28,
        height: 16,
        life: 2.8,
        rotation: 0,
        rotationSpeed: dir * (12 + Math.random() * 6),
      });
    }
  }

  private executeTruongRainSlipperAttack() {
    if (this.truongDefeated) return;
    this.truongState = 'rain_slipper';
    this.truongStateTimer = 1.2;
    sounds.playTruongUltimateSkill();
    this.screenShake = 0.6;

    this.truongDialogueBubble = {
      text: 'MƯA DÉP BÁT NHÃ RƠI TỪ NÓC TRƯỜNG ĐÂY!',
      timer: 1.8,
    };

    const centerTargetX = this.player.x;
    const offsets = this.truongEnraged ? [-160, -90, -20, 50, 120, 180] : [-130, -40, 50, 140];
    offsets.forEach((off, idx) => {
      setTimeout(() => {
        if (this.truongDefeated || this.isPaused) return;
        sounds.playSlipperThrow();
        const dropX = Math.max(160, Math.min(1050, centerTargetX + off));
        this.bossAttacks.push({
          id: Math.random().toString(),
          x: dropX,
          y: -20,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 6.5 + Math.random() * 2.5,
          type: 'slipper_rain',
          width: 28,
          height: 16,
          life: 3.0,
          rotation: Math.random() * Math.PI,
          rotationSpeed: (Math.random() - 0.5) * 15,
        });
      }, idx * 160);
    });
  }

  private updateThoaiNPC(dt: number) {
    this.thoaiAnimTimer += dt;

    if (this.thoaiQuestState === 'completed') {
      if (this.isNearThoai()) {
        this.thoaiFacing = this.player.x < this.thoaiX ? 'left' : 'right';
        this.thoaiState = 'celebrate';
        this.thoaiVx = 0;
      } else {
        // Happily pacing and jumping on the island
        if (Math.sin(this.riverTimer * 1.5) > 0.4) {
          this.thoaiState = 'celebrate';
          this.thoaiVx = 0;
        } else {
          this.thoaiState = 'walk';
          const speed = 0.8;
          if (Math.abs(this.thoaiVx) < 0.2) {
            this.thoaiVx = this.thoaiFacing === 'left' ? -speed : speed;
          }
          this.thoaiX += this.thoaiVx * 60 * dt;
          if (this.thoaiX <= 1720) {
            this.thoaiX = 1720;
            this.thoaiVx = speed;
            this.thoaiFacing = 'right';
          } else if (this.thoaiX >= 1795) {
            this.thoaiX = 1795;
            this.thoaiVx = -speed;
            this.thoaiFacing = 'left';
          }
        }
      }
      return;
    }

    if (this.isNearThoai()) {
      this.thoaiFacing = this.player.x < this.thoaiX ? 'left' : 'right';
      this.thoaiVx = 0;
      if (this.hasThoaiSlippers) {
        this.thoaiState = 'wave';
      } else {
        this.thoaiState = 'worry';
      }
    } else {
      // Gentle pacing or shivering on the island platform
      const cycle = Math.floor(this.riverTimer / 3.5) % 2;
      if (cycle === 0) {
        this.thoaiState = 'walk';
        const speed = 0.6;
        if (Math.abs(this.thoaiVx) < 0.2) {
          this.thoaiVx = this.thoaiFacing === 'left' ? -speed : speed;
        }
        this.thoaiX += this.thoaiVx * 60 * dt;
        if (this.thoaiX <= 1720) {
          this.thoaiX = 1720;
          this.thoaiVx = speed;
          this.thoaiFacing = 'right';
        } else if (this.thoaiX >= 1790) {
          this.thoaiX = 1790;
          this.thoaiVx = -speed;
          this.thoaiFacing = 'left';
        }
      } else {
        this.thoaiState = 'worry';
        this.thoaiVx = 0;
      }
    }
  }

  private updateThuanNPC(dt: number) {
    this.thuanAnimTimer += dt;
    if (this.thuanSpeechBubble) {
      this.thuanSpeechBubble.timer -= dt;
      if (this.thuanSpeechBubble.timer <= 0) {
        this.thuanSpeechBubble = undefined;
      }
    }

    if (this.boss && this.boss.state === 'defeated') {
      this.thuanState = 'cheer';
      this.thuanFacing = 'right';
      return;
    }

    // Facing player or boss
    this.thuanFacing = this.player.x < this.thuanX ? 'left' : 'right';

    // Cheerful or warning callouts during fight
    if (!this.thuanSpeechBubble && Math.random() < 0.007) {
      const shouts = [
        'Phước ơi né ly trà sữa kìa!',
        'Bấm phím C đỡ đòn parry kìa Phước!',
        'Né hạt trân châu đang nảy kìa!',
        'Vì Trúc anh Phước cố lên!',
        'Đánh bại con Ý hung dữ cứu tao với!',
      ];
      this.thuanSpeechBubble = {
        text: shouts[Math.floor(Math.random() * shouts.length)],
        timer: 2.4,
      };
    }
  }

  private updateTruongMiniBoss(dt: number) {
    if (this.level1Area !== 'tam_phuoc_school') return;

    this.truongAnimTimer += dt;
    if (this.truongInvulnerableTimer > 0) this.truongInvulnerableTimer -= dt;
    if (this.truongDialogueBubble) {
      this.truongDialogueBubble.timer -= dt;
      if (this.truongDialogueBubble.timer <= 0) {
        this.truongDialogueBubble = undefined;
      }
    }

    if (this.truongDefeated) {
      this.truongVx = 0;
      this.truongVy += 24 * dt;
      this.truongY += this.truongVy * 60 * dt;
      if (this.truongY + this.truongHeight >= 470) {
        this.truongY = 470 - this.truongHeight;
        this.truongVy = 0;
      }
      return;
    }

    // Gravity & Vertical Physics for smooth jumping and platform standing
    const GRAVITY = 26;
    this.truongVy += GRAVITY * dt;
    if (this.truongVy > 12) this.truongVy = 12;

    const prevY = this.truongY;
    this.truongY += this.truongVy * 60 * dt;

    // Platform landing on ground or desks
    if (this.truongVy >= 0) {
      const prevBottom = prevY + this.truongHeight;
      const currentBottom = this.truongY + this.truongHeight;
      let landed = false;
      for (const plat of this.platforms) {
        if (
          this.truongX + this.truongWidth > plat.x + 6 &&
          this.truongX < plat.x + plat.width - 6
        ) {
          if (prevBottom <= plat.y + 16 && currentBottom >= plat.y) {
            this.truongY = plat.y - this.truongHeight;
            this.truongVy = 0;
            landed = true;
            break;
          }
        }
      }
      if (!landed && this.truongY + this.truongHeight >= 470) {
        this.truongY = 470 - this.truongHeight;
        this.truongVy = 0;
      }
    }

    // AI Jump to chase player if player is on classroom desks
    const isGrounded = this.truongVy === 0;
    if (isGrounded && this.player.y < this.truongY - 40 && Math.abs(this.player.x - this.truongX) < 280) {
      if (Math.random() < 0.035) {
        this.truongVy = -11.5;
        sounds.playJump();
      }
    }

    // Decrement state timer
    if (this.truongStateTimer > 0) {
      this.truongStateTimer -= dt;
      if (this.truongStateTimer <= 0) {
        if (this.truongState === 'steal_slipper') {
          // After sneaking & stealing, boast!
          this.executeTruongTauntAction();
          return;
        } else if (this.truongState === 'taunt_slipper') {
          // After taunting, throw or dash
          if (Math.random() > 0.45) {
            this.executeTruongSlipperAttack();
          } else {
            this.truongState = 'patrol';
          }
          return;
        } else if (this.truongState === 'dash_slipper') {
          if (Math.random() > 0.5) {
            this.executeTruongSlipperAttack();
          } else {
            this.truongState = 'patrol';
          }
          return;
        } else {
          this.truongState = 'patrol';
        }
      }
    }

    // Movement by state & fixing walking direction (NO MOONWALKING!)
    if (this.truongState === 'patrol') {
      const walkSpeed = this.truongEnraged ? 2.2 : 1.4;
      if (Math.abs(this.truongVx) < 0.5) {
        this.truongVx = this.truongFacing === 'left' ? -walkSpeed : walkSpeed;
      }
      this.truongX += this.truongVx * 60 * dt;
      // Facing MUST match the velocity direction when walking forward!
      this.truongFacing = this.truongVx < 0 ? 'left' : 'right';

      if (Math.abs(this.truongX - this.truongPatrolStartX) > 220) {
        this.truongVx *= -1;
        this.truongFacing = this.truongVx < 0 ? 'left' : 'right';
      }
    } else if (this.truongState === 'steal_slipper') {
      this.truongX += this.truongVx * 60 * dt;
      this.truongFacing = this.truongVx < 0 ? 'left' : 'right';
    } else if (this.truongState === 'dash_slipper') {
      this.truongX += this.truongVx * 60 * dt;
      this.truongFacing = this.truongVx < 0 ? 'left' : 'right';

      // Dust particles behind dash
      if (Math.random() > 0.4) {
        this.particles.push({
          x: this.truongX + (this.truongVx > 0 ? 0 : this.truongWidth),
          y: this.truongY + this.truongHeight - 4,
          vx: -this.truongVx * 0.2,
          vy: -Math.random() * 2,
          size: Math.random() * 4 + 2,
          color: '#E2E8F0',
          alpha: 0.7,
          life: 0.25,
          maxLife: 0.25,
          shape: 'circle',
        });
      }

      // Check dash collision damage on player
      const p = this.player;
      if (
        p.invulnerableTimer <= 0 &&
        p.x + p.width > this.truongX + 6 &&
        p.x < this.truongX + this.truongWidth - 6 &&
        p.y + p.height > this.truongY + 10 &&
        p.y < this.truongY + this.truongHeight
      ) {
        sounds.playSlipperSlap();
        this.handlePlayerDamage();
      }
    } else if (this.truongState === 'taunt_slipper' || this.truongState === 'throw_slipper') {
      // Facing player when taunting or throwing
      this.truongFacing = this.player.x < this.truongX ? 'left' : 'right';
    }

    // Clamp inside school yard bounds & bounce off boundaries
    if (this.truongX < 260) {
      this.truongX = 260;
      if (this.truongVx < 0) {
        this.truongVx = Math.abs(this.truongVx);
        this.truongFacing = 'right';
      }
    } else if (this.truongX > 1080) {
      this.truongX = 1080;
      if (this.truongVx > 0) {
        this.truongVx = -Math.abs(this.truongVx);
        this.truongFacing = 'left';
      }
    }

    // Attack cooldown timer
    this.truongAttackCooldown -= dt;
    if (this.truongAttackCooldown <= 0 && (this.truongState === 'patrol' || this.truongStateTimer <= 0)) {
      this.truongAttackCooldown = this.truongEnraged ? 1.6 : 2.5;

      const roll = Math.random();
      if (roll < 0.30) {
        // Hành động 1: Lén lút trộm dép!
        this.executeTruongStealAction();
      } else if (roll < 0.50) {
        // Hành động 2: Khoe dép tổ ong trộm được!
        this.executeTruongTauntAction();
      } else if (roll < 0.72) {
        // Hành động 3: Ném dép tổ ong!
        this.executeTruongSlipperAttack();
      } else if (roll < 0.88) {
        // Hành động 4: Lao vào cướp dép (Dash)
        this.executeTruongDashAction();
      } else {
        // Hành động 5: Mưa dép bát nhã
        this.executeTruongRainSlipperAttack();
      }
    }
  }

  /**
   * Tích lũy nội năng cho Phước khi đánh thường hoặc parry
   */
  public addPlayerEnergy(amount: number) {
    const p = this.player;
    const oldEnergy = p.energy;
    p.energy = Math.min(p.maxEnergy, Math.max(0, p.energy + amount));
    if (p.energy >= p.maxEnergy && oldEnergy < p.maxEnergy) {
      sounds.playCoin();
      this.setPlayerSpeech('ĐÃ ĐỦ NỘI NĂNG! 💄 3 HỘP SON SẴN SÀNG!', 2.2);
      this.particles.push({
        x: p.x + p.width / 2,
        y: p.y - 12,
        vx: 0,
        vy: -1.8,
        size: 13,
        color: '#F43F5E',
        alpha: 1,
        life: 0.9,
        maxLife: 0.9,
        shape: 'letter',
        char: '💄 3 HỘP SON SẴN SÀNG! (Phím E)',
      });
    }
  }

  /**
   * Cơ chế Parry (Đỡ đòn & Phản đòn)
   * Trong cửa sổ 0.45s, triệt tiêu 100% sát thương, phản đòn và tích +35 nội năng!
   */
  public triggerParry() {
    const p = this.player;
    if (p.parryCooldown && p.parryCooldown > 0) {
      sounds.playCooldownClick();
      return;
    }
    p.isParrying = true;
    p.parryTimer = 0.45; // 450ms active parry window
    p.parryCooldown = 0.75;
    sounds.playParry();
    this.setPlayerSpeech('THẾ THỦ! PARRY! 🛡️', 1.2);

    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: p.x + p.width / 2,
        y: p.y + p.height / 2,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        size: Math.random() * 4 + 2,
        color: '#38BDF8',
        alpha: 1,
        life: 0.35,
        maxLife: 0.35,
        shape: 'star',
      });
    }
  }

  /**
   * Chiêu Thức Tối Thượng: Ném 3 Hộp Son (Sát thương 10 mỗi hộp)
   * Kích hoạt khi dùng chiêu BECAUSE hoặc Parry tích đủ nội năng (100%)
   */
  public triggerUltimateLipstick() {
    const p = this.player;
    if (p.energy < p.maxEnergy) {
      sounds.playCooldownClick();
      this.setPlayerSpeech(`Chưa đủ nội năng! Cần 100% (${Math.round(p.energy)}/100)`, 1.5);
      return;
    }

    // Consume all energy
    p.energy = 0;
    p.attackCooldown = 0.8;
    p.isAttacking = true;
    p.speechShoutTimer = 0.45;
    this.screenShake = 1.0;
    sounds.playPhuocLipstickSkill();

    this.setPlayerSpeech('SET SON 500K HUYỀN THOẠI! ĐỠ LẤY NÀY! 💄💄💄', 2.5);

    const dir = p.facing === 'right' ? 1 : -1;
    const spawnX = p.facing === 'right' ? p.x + p.width + 6 : p.x - 26;
    const spawnY = p.y + 14;

    // Throw 3 Lipstick Boxes:
    // Sát thương mỗi hộp là 10 theo đúng yêu cầu người dùng!
    const angles = [-0.18, 0, 0.18];
    angles.forEach((angle, idx) => {
      setTimeout(() => {
        if (!this.isRunning || this.isPaused) return;
        const speed = 14.0;
        const vx = dir * Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        this.projectiles.push({
          id: 'lipstick-' + Math.random().toString(),
          x: spawnX,
          y: spawnY + (idx - 1) * 8,
          vx,
          vy,
          text: 'SON 500K 💄',
          size: 20,
          color: '#F43F5E',
          life: 2.0,
          maxLife: 2.0,
          isFromPlayer: true,
          rotation: (Math.random() - 0.5) * 0.2,
          scale: 1.0,
          projType: 'lipstick',
          damage: 10, // Exact 10 damage per box!
        });

        for (let g = 0; g < 6; g++) {
          this.particles.push({
            x: spawnX,
            y: spawnY,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            size: Math.random() * 4 + 2,
            color: ['#F43F5E', '#FDA4AF', '#FACC15', '#C084FC'][g % 4],
            alpha: 1,
            life: 0.4,
            maxLife: 0.4,
            shape: 'star',
          });
        }
      }, idx * 100);
    });
  }

  public handleCanvasClick(targetX?: number, targetY?: number) {
    if (this.level.hasSpeechAttack) {
      if (targetX !== undefined && targetY !== undefined) {
        this.triggerTapTargetEffect(targetX, targetY);
        this.triggerBecauseAttack({ targetX, targetY });
      } else {
        this.triggerBecauseAttack();
      }
    }
  }

  public triggerBecauseAttack(optionsOrTargetX?: number | AttackBecauseOptions, maybeTargetY?: number) {
    if (!this.level.hasSpeechAttack) return;
    if (this.player.attackCooldown > 0) {
      // Play tactile click indicating recharge constraint
      sounds.playCooldownClick();
      return;
    }

    // Exact 2.5-second recharge constraint as requested by the user:
    // "thời gian mỗi lần tung chiêu because là 2.5 giây"
    this.player.attackCooldown = 2.5;
    this.player.speechShoutTimer = 0.35;
    this.player.isAttacking = true;
    this.becauseShoutsCount++;

    sounds.playBecauseAttack();

    // Tích lũy nội năng khi dùng chiêu BECAUSE cho chiêu tối thượng (Mỗi lần +15% theo yêu cầu người dùng)
    this.addPlayerEnergy(15);
    this.particles.push({
      x: this.player.x + this.player.width / 2,
      y: this.player.y - 12,
      vx: 0,
      vy: -1.2,
      size: 11,
      color: '#38BDF8',
      alpha: 1,
      life: 0.6,
      maxLife: 0.6,
      shape: 'letter',
      char: '+15% NỘI NĂNG ⚡ (BECAUSE!)',
    });

    // Chiêu because chỉ hiện "BECAUSE!" thôi không sửa thành bởi vì hay lí lẽ
    const chosenPhrase = 'BECAUSE!';

    // Random Hero Dialogue Shout
    const heroShouts = [
      'Chân lý là đây: BECAUSE!',
      'Sức mạnh tình yêu: BECAUSE!',
      'Đừng hòng cậy tiền ép người!',
      'Chính nghĩa sẽ thắng: BECAUSE!',
      'BECAUSE! Ta sẽ cứu được Trúc!',
    ];
    this.setPlayerSpeech(heroShouts[Math.floor(Math.random() * heroShouts.length)], 1.8);

    let targetX: number | undefined;
    let targetY: number | undefined;
    let mode: MobileAimMode = 'auto';
    let customAngleRad: number | undefined;

    if (typeof optionsOrTargetX === 'object' && optionsOrTargetX !== null) {
      targetX = optionsOrTargetX.targetX;
      targetY = optionsOrTargetX.targetY;
      mode = optionsOrTargetX.mode || 'auto';
      customAngleRad = optionsOrTargetX.customAngleRad;
    } else if (typeof optionsOrTargetX === 'number') {
      targetX = optionsOrTargetX;
      targetY = maybeTargetY;
    }

    let vx = this.player.facing === 'right' ? 14 : -14;
    let vy = -1;

    // 1. Direct screen tap / click coordinates
    if (targetX !== undefined && targetY !== undefined) {
      const worldTargetX = targetX + this.cameraX;
      const worldTargetY = targetY + this.cameraY;
      const dx = worldTargetX - (this.player.x + this.player.width / 2);
      const dy = worldTargetY - (this.player.y + 16);
      const mag = Math.hypot(dx, dy);
      if (mag > 0) {
        vx = (dx / mag) * 14;
        vy = (dy / mag) * 14;
      }
    }
    // 2. Drag angle from mobile joystick
    else if (customAngleRad !== undefined) {
      vx = Math.cos(customAngleRad) * 14;
      vy = Math.sin(customAngleRad) * 14;
    }
    // 3. Preset aim modes
    else if (mode === 'up') {
      vx = 0;
      vy = -14;
    } else if (mode === 'diagonal') {
      const dirX = this.player.facing === 'right' ? 1 : -1;
      vx = dirX * 14 * 0.7071;
      vy = -14 * 0.7071;
    } else if (mode === 'straight') {
      const dirX = this.player.facing === 'right' ? 1 : -1;
      vx = dirX * 14;
      vy = -1;
    }
    // 4. Auto-Aim (Default smart lock onto Boss or nearest enemy)
    else {
      let lockedTarget = false;
      if (this.boss && this.boss.state !== 'defeated') {
        const distToBoss = Math.abs(this.boss.x - this.player.x);
        if (distToBoss < 850) {
          const bCenterX = this.boss.x + this.boss.width / 2;
          const bCenterY = this.boss.y + this.boss.height * 0.45;
          const pCenterX = this.player.x + this.player.width / 2;
          const pCenterY = this.player.y + 16;
          const dx = bCenterX - pCenterX;
          const dy = bCenterY - pCenterY;
          const mag = Math.hypot(dx, dy);
          if (mag > 0) {
            vx = (dx / mag) * 14;
            vy = (dy / mag) * 14;
            lockedTarget = true;
          }
        }
      }

      if (!lockedTarget) {
        const aliveEnemies = this.enemies.filter(
          (e) => e.state === 'alive' && Math.abs(e.x - this.player.x) < 550
        );
        if (aliveEnemies.length > 0) {
          aliveEnemies.sort(
            (a, b) =>
              Math.hypot(a.x - this.player.x, a.y - this.player.y) -
              Math.hypot(b.x - this.player.x, b.y - this.player.y)
          );
          const e = aliveEnemies[0];
          const eCenterX = e.x + e.width / 2;
          const eCenterY = e.y + e.height / 2;
          const pCenterX = this.player.x + this.player.width / 2;
          const pCenterY = this.player.y + 16;
          const dx = eCenterX - pCenterX;
          const dy = eCenterY - pCenterY;
          const mag = Math.hypot(dx, dy);
          if (mag > 0) {
            vx = (dx / mag) * 14;
            vy = (dy / mag) * 14;
            lockedTarget = true;
          }
        }
      }

      if (!lockedTarget) {
        const dirX = this.player.facing === 'right' ? 1 : -1;
        vx = dirX * 14;
        vy = -1;
      }
    }

    // Auto-update facing direction so Phước faces where he shouts!
    if (vx > 0.5) {
      this.player.facing = 'right';
    } else if (vx < -0.5) {
      this.player.facing = 'left';
    }

    const startX = this.player.facing === 'right' ? this.player.x + this.player.width + 4 : this.player.x - 24;
    const startY = this.player.y + 12;

    this.projectiles.push({
      id: Math.random().toString(),
      x: startX,
      y: startY,
      vx,
      vy,
      text: chosenPhrase,
      size: 18,
      color: '#FACC15',
      life: 1.2,
      maxLife: 1.2,
      isFromPlayer: true,
      rotation: (Math.random() - 0.5) * 0.15,
      scale: 0.85,
    });

    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 4 + vx * 0.15,
        vy: (Math.random() - 0.5) * 4 + vy * 0.15,
        size: Math.random() * 4 + 2,
        color: '#FEF08A',
        alpha: 1,
        life: 0.35,
        maxLife: 0.35,
        shape: 'star',
      });
    }
  }

  private spawnJumpDust() {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: this.player.x + this.player.width / 2,
        y: this.player.y + this.player.height,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 2,
        size: Math.random() * 4 + 2,
        color: '#E4E4E7',
        alpha: 0.8,
        life: 0.28,
        maxLife: 0.28,
        shape: 'circle',
      });
    }
  }

  // Main simulation update
  private update(dt: number) {
    this.riverTimer += dt;
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 10);
    }

    // Level Time Countdown
    this.timeLeft = Math.max(0, this.timeLeft - dt);
    const roundedTime = Math.ceil(this.timeLeft);
    if (this.callbacks.onTimeUpdate && roundedTime !== this.lastReportedTime) {
      this.lastReportedTime = roundedTime;
      this.callbacks.onTimeUpdate(roundedTime);
    }

    if (this.timeLeft <= 0) {
      sounds.playGameOver();
      this.callbacks.onGameOver('Hết thời gian! Hãy di chuyển nhanh hơn để kịp cứu Trúc!');
      return;
    }

    this.updatePlayer(dt);
    this.updatePlatforms(dt);
    this.updateEnemies(dt);

    if (this.boss) {
      this.updateBoss(dt);
    }

    // NPC Thoại on Sông Buông river island
    if (this.level.id === 1 && this.level1Area === 'river') {
      this.updateThoaiNPC(dt);
    }

    // NPC Thuận in Level 3
    if (this.level.id === 3) {
      this.updateThuanNPC(dt);
    }

    // Trường Mini-Boss in THPT Tam Phước
    if (this.level.id === 1 && this.level1Area === 'tam_phuoc_school') {
      this.updateTruongMiniBoss(dt);

      // Check pickup for dropped slippers
      if (this.droppedSlippersPos && !this.hasThoaiSlippers) {
        const dist = Math.hypot(
          this.player.x + this.player.width / 2 - (this.droppedSlippersPos.x + 20),
          this.player.y + this.player.height / 2 - (this.droppedSlippersPos.y + 10)
        );
        if (dist < 45) {
          this.hasThoaiSlippers = true;
          this.thoaiQuestState = 'slippers_recovered';
          sounds.playKeyGet();
          this.score += 500;
          this.spawnHeartHealParticles(this.droppedSlippersPos.x + 20, this.droppedSlippersPos.y);
          this.setPlayerSpeech('Đã nhặt Đôi Dép Của Thoại! Mau trở về cổng trả cho em!', 3.5);
        }
      }

      // Check player stomp on Trường (crisp responsive Mario-style window)
      if (!this.truongDefeated) {
        const p = this.player;
        if (
          p.x + p.width > this.truongX + 4 &&
          p.x < this.truongX + this.truongWidth - 4 &&
          p.y + p.height > this.truongY + 4 &&
          p.y < this.truongY + this.truongHeight
        ) {
          const isStomp = p.vy > 0 && p.y + p.height <= this.truongY + 34;
          if (isStomp) {
            p.vy = -10.5;
            this.damageTruong(25);
            sounds.playStomp();
            this.screenShake = 0.5;
          } else if (p.invulnerableTimer <= 0 && this.truongInvulnerableTimer <= 0) {
            this.handlePlayerDamage();
          }
        }
      }
    }

    this.updateProjectiles(dt);
    this.updateCollectibles();
    this.updateParticles(dt);
    if (this.tapTargetEffect) {
      this.tapTargetEffect.life -= dt;
      if (this.tapTargetEffect.life <= 0) {
        this.tapTargetEffect = null;
      }
    }
    this.updateCamera();
    this.checkLevelGoal();

    // Attack cooldown reporting for HUD
    if (this.callbacks.onCooldownUpdate) {
      const remaining = Math.max(0, this.player.attackCooldown);
      if (Math.abs(remaining - this.lastReportedCooldown) > 0.04 || remaining === 0) {
        this.lastReportedCooldown = remaining;
        this.callbacks.onCooldownUpdate(remaining, this.maxAttackCooldown);
      }
    }

    // Energy reporting for HUD & Mobile Controls
    if (this.callbacks.onEnergyUpdate && Math.round(this.player.energy) !== this.lastReportedEnergy) {
      this.lastReportedEnergy = Math.round(this.player.energy);
      this.callbacks.onEnergyUpdate(this.player.energy, this.player.maxEnergy);
    }

    // Parry state reporting
    const isParryingNow = Boolean(this.player.isParrying && this.player.parryTimer && this.player.parryTimer > 0);
    if (this.callbacks.onParryStateUpdate && isParryingNow !== this.lastReportedParrying) {
      this.lastReportedParrying = isParryingNow;
      this.callbacks.onParryStateUpdate(isParryingNow, this.player.parryCooldown || 0);
    }

    // Notify React only when values actually change (stops full re-renders!)
    if (
      this.score !== this.lastReportedScore ||
      this.coins !== this.lastReportedCoins ||
      this.player.health !== this.lastReportedHealth
    ) {
      this.lastReportedScore = this.score;
      this.lastReportedCoins = this.coins;
      this.lastReportedHealth = this.player.health;
      this.callbacks.onScoreUpdate(this.score, this.coins, this.player.health);
    }
  }

  private updatePlayer(dt: number) {
    const p = this.player;

    if (p.invulnerableTimer > 0) p.invulnerableTimer -= dt;
    if (p.attackCooldown > 0) p.attackCooldown -= dt;
    if (p.speechShoutTimer > 0) {
      p.speechShoutTimer -= dt;
      if (p.speechShoutTimer <= 0) p.isAttacking = false;
    }
    if (p.parryTimer && p.parryTimer > 0) {
      p.parryTimer -= dt;
      if (p.parryTimer <= 0) p.isParrying = false;
    }
    if (p.parryCooldown && p.parryCooldown > 0) p.parryCooldown -= dt;
    if (p.jumpBufferTimer > 0) {
      p.jumpBufferTimer -= dt;
      if (p.jumpBufferTimer <= 0) this.jumpBuffered = false;
    }
    if (p.coyoteTimer > 0) p.coyoteTimer -= dt;

    if (p.dialogueBubble) {
      p.dialogueBubble.timer -= dt;
      if (p.dialogueBubble.timer <= 0) {
        p.dialogueBubble = undefined;
      }
    }

    p.animTimer += dt;

    // Buffered jump execution upon touching ground
    if ((this.jumpBuffered || p.jumpBufferTimer > 0) && p.isGrounded) {
      this.performJump();
    }

    // Horizontal Movement
    const moveLeft = this.keysHeld['KeyA'] || this.keysHeld['ArrowLeft'];
    const moveRight = this.keysHeld['KeyD'] || this.keysHeld['ArrowRight'];

    const ACCEL = 32;
    const MAX_SPEED = 5.4;
    const FRICTION = p.isGrounded ? 22 : 8;

    if (moveLeft && !moveRight) {
      p.vx = Math.max(p.vx - ACCEL * dt, -MAX_SPEED);
      p.facing = 'left';
    } else if (moveRight && !moveLeft) {
      p.vx = Math.min(p.vx + ACCEL * dt, MAX_SPEED);
      p.facing = 'right';
    } else {
      if (p.vx > 0) {
        p.vx = Math.max(0, p.vx - FRICTION * dt);
      } else if (p.vx < 0) {
        p.vx = Math.min(0, p.vx + FRICTION * dt);
      }
    }

    // Gravity (clamped fall speed to prevent platform tunneling)
    const GRAVITY = 28;
    p.vy += GRAVITY * dt;
    if (p.vy > 12) p.vy = 12;

    // Mobile jump sustain timer decrement
    if (p.mobileJumpSustainTimer !== undefined && p.mobileJumpSustainTimer > 0) {
      p.mobileJumpSustainTimer -= dt;
      if (p.mobileJumpSustainTimer <= 0) {
        if (!this.keysHeld['Space'] && !this.keysHeld['KeyW'] && !this.keysHeld['ArrowUp']) {
          p.mobileJumpSustainTimer = 0;
        }
      }
    }

    // Variable jump height - sustains full peak height matching computer
    const jumpHeld =
      this.keysHeld['Space'] ||
      this.keysHeld['KeyW'] ||
      this.keysHeld['ArrowUp'] ||
      (p.mobileJumpSustainTimer !== undefined && p.mobileJumpSustainTimer > 0);

    if (!jumpHeld && p.vy < -4) {
      p.vy *= 0.65;
    }

    // 1. Move X and check side blocking
    p.x += p.vx * 60 * dt;
    this.checkHorizontalPlatformCollisions(p);

    const currentMaxX =
      this.level.id === 1 && this.level1Area === 'tam_phuoc_school' ? 1200 : this.level.width;

    if (p.x < 0) {
      p.x = 0;
      p.vx = 0;
    }
    if (p.x + p.width > currentMaxX) {
      p.x = currentMaxX - p.width;
      p.vx = 0;
    }

    // 2. Move Y with precise swept landing logic (Solves T2 floor drop bug!)
    const prevY = p.y;
    const wasGrounded = p.isGrounded;
    p.y += p.vy * 60 * dt;

    if (p.vy >= 0) {
      // Falling down or standing: check top landing (Mario one-way landing)
      let landed = false;
      const prevBottom = prevY + p.height;
      const currentBottom = p.y + p.height;

      for (const plat of this.platforms) {
        // Horizontal overlap
        const overlapsX = p.x + p.width > plat.x + 2 && p.x < plat.x + plat.width - 2;
        if (!overlapsX) continue;

        // Feet crossed platform top surface from above
        if (prevBottom <= plat.y + 16 && currentBottom >= plat.y) {
          p.y = plat.y - p.height;
          p.vy = 0;
          p.isGrounded = true;
          landed = true;

          // Carry along moving platforms
          if (plat.isMoving && plat.speed && plat.direction) {
            p.x += plat.speed * plat.direction * 60 * dt;
          }

          // Record safe recovery point
          if (plat.type === 'ground' || plat.type === 'bridge_wood') {
            this.lastSafeGroundedX = p.x;
            this.lastSafeGroundedY = p.y;
          }
          break;
        }
      }

      if (!landed) {
        p.isGrounded = false;
      }
    } else {
      // Rising upwards (JUMPING):
      // Mario-style one-way platforms: Never block head from underneath! Pass through freely!
      p.isGrounded = false;
    }

    // Coyote time trigger when stepping off a ledge
    if (wasGrounded && !p.isGrounded && p.vy >= 0) {
      p.coyoteTimer = 0.12;
    }

    // Determine visual animation state
    if (p.speechShoutTimer > 0) {
      p.state = 'shout';
    } else if (!p.isGrounded) {
      p.state = p.vy < 0 ? 'jump' : 'fall';
    } else if (Math.abs(p.vx) > 0.4) {
      p.state = 'run';
    } else {
      p.state = 'idle';
    }

    // Water pitfall in Sông Buông: safe recovery
    if (p.y > 530) {
      this.handleWaterPitfall();
    }
  }

  private checkHorizontalPlatformCollisions(p: Player) {
    for (const plat of this.platforms) {
      // Only block against ground barricades/walls, never elevated platform steps
      if (plat.type === 'barricade') {
        if (
          p.x < plat.x + plat.width &&
          p.x + p.width > plat.x &&
          p.y + p.height > plat.y + 12 &&
          p.y < plat.y + plat.height - 4
        ) {
          if (p.vx > 0) {
            p.x = plat.x - p.width;
            p.vx = 0;
          } else if (p.vx < 0) {
            p.x = plat.x + plat.width;
            p.vx = 0;
          }
        }
      }
    }
  }

  private handleWaterPitfall() {
    const p = this.player;
    p.health--;
    sounds.playPlayerHurt();
    this.screenShake = 1.0;

    if (p.health <= 0) {
      sounds.playGameOver();
      this.callbacks.onGameOver();
      return;
    }

    // Safely respawn at the last verified solid ground platform
    p.x = this.lastSafeGroundedX;
    p.y = this.lastSafeGroundedY;
    p.vx = 0;
    p.vy = 0;
    p.isGrounded = true;
    p.invulnerableTimer = 1.6;
  }

  private updatePlatforms(dt: number) {
    for (const plat of this.platforms) {
      if (plat.isMoving && plat.speed && plat.direction && plat.minX !== undefined && plat.maxX !== undefined) {
        plat.x += plat.speed * plat.direction * 60 * dt;
        if (plat.x <= plat.minX) {
          plat.x = plat.minX;
          plat.direction = 1;
        } else if (plat.x + plat.width >= plat.maxX) {
          plat.x = plat.maxX - plat.width;
          plat.direction = -1;
        }
      }
    }
  }

  private updateEnemies(dt: number) {
    for (const otter of this.enemies) {
      if (otter.state === 'squished') {
        otter.squishTimer -= dt;
        if (otter.squishTimer <= 0) {
          otter.state = 'dead';
        }
        continue;
      }
      if (otter.state === 'dead') continue;

      otter.animTimer += dt;

      if (otter.isJumper) {
        otter.jumpTimer = (otter.jumpTimer || 0) + dt;
        if (otter.jumpTimer > 2.2) {
          otter.vy = -6.5;
          otter.jumpTimer = 0;
        }
        otter.vy += 20 * dt;
        otter.y += otter.vy * 60 * dt;
        if (otter.y > 450) {
          otter.y = 450;
          otter.vy = 0;
        }
      }

      otter.x += otter.vx * 60 * dt;
      if (Math.abs(otter.x - otter.startX) > otter.patrolDistance) {
        otter.vx *= -1;
        otter.facing = otter.vx > 0 ? 'right' : 'left';
      }

      // Player stomp or hurt
      const p = this.player;
      if (
        p.x + p.width > otter.x + 4 &&
        p.x < otter.x + otter.width - 4 &&
        p.y + p.height > otter.y + 4 &&
        p.y < otter.y + otter.height
      ) {
        const isStomp = p.vy > 0 && p.y + p.height <= otter.y + 20;
        if (isStomp) {
          otter.state = 'squished';
          otter.squishTimer = 0.35;
          p.vy = this.keysHeld['Space'] || this.keysHeld['KeyW'] ? -11.5 : -8.5;
          sounds.playStomp();
          this.score += 150;

          for (let i = 0; i < 6; i++) {
            this.particles.push({
              x: otter.x + otter.width / 2,
              y: otter.y,
              vx: (Math.random() - 0.5) * 5,
              vy: -Math.random() * 4 - 2,
              size: Math.random() * 5 + 3,
              color: '#38BDF8',
              alpha: 1,
              life: 0.45,
              maxLife: 0.45,
              shape: 'splash',
            });
            this.particles.push({
              x: otter.x + otter.width / 2,
              y: otter.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              size: Math.random() * 5 + 2,
              color: '#FBBF24',
              alpha: 1,
              life: 0.35,
              maxLife: 0.35,
              shape: 'star',
            });
          }
        } else {
          if (p.invulnerableTimer <= 0) {
            this.handlePlayerDamage();
          }
        }
      }
    }
  }

  private updateBoss(dt: number) {
    const b = this.boss;
    if (!b) return;

    b.animTimer += dt;
    if (b.invulnerableTimer > 0) b.invulnerableTimer -= dt;
    if (b.dialogueBubble) {
      b.dialogueBubble.timer -= dt;
      if (b.dialogueBubble.timer <= 0) b.dialogueBubble = undefined;
    }

    if (b.state === 'defeated') return;

    // Berserk / Enrage Phase Trigger at <= 50% HP
    const isUnderHalfHp = b.health <= b.maxHealth * 0.5;
    if (isUnderHalfHp && !b.isEnraged) {
      b.isEnraged = true;
      this.screenShake = 1.3;
      sounds.playBossHurt();
      sounds.setBossEnraged(true);

      const enrageShout =
        b.bossType === 'baholong'
          ? 'MÀY DÁM ĐỤNG VÀO TAO?! TAO NỔI ĐIÊN RỒI! BẢO TÁP ĐÔ LA VÀ XÚC XẮC CUỒNG NỘ!!!'
          : b.bossType === 'y'
          ? 'ANH KHÔNG QUAY LẠI VỚI EM THÌ ĐỪNG HÒNG ĐẾN ĐƯỢC CHỖ CON TRÚC! BÃO TRÀ SỮA & 50K TOÀN LỰC!!!'
          : 'CHỐNG NGƯỜI THI HÀNH CÔNG VỤ?! BẮN LIÊN THANH TỔNG LỰC!!!';

      b.dialogueBubble = {
        text: enrageShout,
        timer: 2.8,
      };

      // Fiery enrage explosion particles
      for (let p = 0; p < 25; p++) {
        this.particles.push({
          x: b.x + b.width / 2,
          y: b.y + b.height / 2,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12,
          size: Math.random() * 6 + 3,
          color: Math.random() > 0.5 ? '#EF4444' : '#DC2626',
          alpha: 1,
          life: 0.6,
          maxLife: 0.6,
          shape: 'star',
        });
      }
    }

    if (b.state === 'stunned') {
      b.stunTimer -= dt;
      if (b.stunTimer <= 0) {
        b.state = 'idle';
        b.isShootingGun = false;
        b.phaseTimer = b.isEnraged ? 0.45 : 0.9;
      }
      return;
    }

    if (b.isShootingGun && b.gunShootTimer !== undefined) {
      b.gunShootTimer -= dt;
      if (b.gunShootTimer <= 0) {
        b.isShootingGun = false;
      }
    }

    // Attacks happen 1.6x faster when enraged
    const phaseDt = b.isEnraged ? dt * 1.6 : dt;
    b.phaseTimer -= phaseDt;
    b.attackCooldown -= phaseDt;

    const p = this.player;
    b.facing = p.x < b.x ? 'left' : 'right';

    if (b.phaseTimer <= 0) {
      if (b.bossType === 'baholong') {
        const rand = Math.random();
        if (rand < 0.42) {
          // Dice Throw Volley (Vũ khí xúc xắc ném dồn dập)
          this.executeBaHoLongDiceAttack();
        } else if (rand < 0.78) {
          // Chiêu ném tiền đô la & xấp tiền của Bá Hộ Long
          this.executeBaHoLongMoneyAttack();
        } else if (rand < 0.93) {
          b.state = 'jump_slam';
          b.phaseTimer = b.isEnraged ? 1.2 : 1.8;
          b.vy = b.isEnraged ? -13.0 : -10.5;
        } else {
          b.state = 'whistle_attack';
          b.phaseTimer = b.isEnraged ? 0.9 : 1.4;
          this.executeBaHoLongTaunt();
        }
      } else if (b.bossType === 'y') {
        // Boss Ý: Quăng ly trà sữa, bão trân châu đen nảy, phóng tiền 50k
        const rand = Math.random();
        if (rand < 0.44) {
          this.executeYBobaAttack();
        } else if (rand < 0.76) {
          this.executeYPearlAttack();
        } else {
          this.executeY50kAttack();
        }
      } else {
        // Boss CSGT: Gun shooting attack, Whistle wave, Citation ticket, Jump slam
        const rand = Math.random();
        if (rand < 0.40) {
          // GUN SHOOTING ATTACK!
          b.state = 'gun_attack';
          b.isShootingGun = true;
          b.gunShootTimer = b.isEnraged ? 1.4 : 1.2;
          b.phaseTimer = b.isEnraged ? 1.2 : 1.7;
          this.executeBossGunAttack();
        } else if (rand < 0.68) {
          b.state = 'whistle_attack';
          b.phaseTimer = b.isEnraged ? 0.9 : 1.4;
          this.executeBossWhistleAttack();
        } else if (rand < 0.86) {
          b.state = 'citation_attack';
          b.phaseTimer = b.isEnraged ? 1.0 : 1.5;
          this.executeBossCitationAttack();
        } else {
          b.state = 'jump_slam';
          b.phaseTimer = b.isEnraged ? 1.2 : 1.8;
          b.vy = b.isEnraged ? -12.5 : -10;
        }
      }
    }

    if (b.state === 'jump_slam') {
      b.vy += (b.isEnraged ? 28 : 24) * dt;
      b.y += b.vy * 60 * dt;
      const jumpSpeed = b.isEnraged ? 3.4 : 2.2;
      b.x += (b.facing === 'left' ? -jumpSpeed : jumpSpeed) * 60 * dt;

      if (b.y >= (b.bossType === 'baholong' ? 365 : 404)) {
        b.y = b.bossType === 'baholong' ? 365 : 404;
        b.vy = 0;
        b.state = 'idle';
        this.screenShake = b.isEnraged ? 1.4 : 1.0;
        sounds.playBossHurt();

        const shockType = b.bossType === 'baholong' ? 'cane_shock' : 'ground_shock';
        // Base shockwaves
        this.bossAttacks.push({
          id: Math.random().toString(),
          x: b.x - 20,
          y: 470,
          vx: -6.5,
          vy: 0,
          type: shockType,
          width: 24,
          height: 24,
          life: 1.6,
        });
        this.bossAttacks.push({
          id: Math.random().toString(),
          x: b.x + b.width + 10,
          y: 470,
          vx: 6.5,
          vy: 0,
          type: shockType,
          width: 24,
          height: 24,
          life: 1.6,
        });

        // Enraged creates DOUBLE fast secondary shockwaves!
        if (b.isEnraged) {
          this.bossAttacks.push({
            id: Math.random().toString(),
            x: b.x - 30,
            y: 470,
            vx: -10.5,
            vy: 0,
            type: shockType,
            width: 28,
            height: 28,
            life: 1.8,
          });
          this.bossAttacks.push({
            id: Math.random().toString(),
            x: b.x + b.width + 20,
            y: 470,
            vx: 10.5,
            vy: 0,
            type: shockType,
            width: 28,
            height: 28,
            life: 1.8,
          });
        }
      }
    } else if (b.state === 'idle') {
      const walkSpeed = b.isEnraged ? 2.4 : 1.3;
      b.x += (b.facing === 'left' ? -walkSpeed : walkSpeed) * 60 * dt;
      const minX = b.bossType === 'y' ? 1200 : 720;
      const maxX = b.bossType === 'y' ? 2050 : 1880;
      if (b.x < minX) {
        b.x = minX;
        b.facing = 'right';
      }
      if (b.x > maxX) {
        b.x = maxX;
        b.facing = 'left';
      }
    }

    if (
      p.invulnerableTimer <= 0 &&
      p.x + p.width > b.x + 8 &&
      p.x < b.x + b.width - 8 &&
      p.y + p.height > b.y + 8 &&
      p.y < b.y + b.height
    ) {
      this.handlePlayerDamage();
    }
  }

  /**
   * Final Boss Bá Hộ Long Specialty Attack: Throwing Pairs of Rolling Dice
   * In Enrage Phase (50% HP): Throws 5 continuous bursts of 3 dice each at high velocity!
   */
  private executeBaHoLongDiceAttack() {
    if (!this.boss) return;
    const b = this.boss;
    const dir = b.facing === 'left' ? -1 : 1;
    b.state = 'dice_throw';
    b.phaseTimer = b.isEnraged ? 1.8 : 2.6;

    const taunts = b.isEnraged
      ? [
          'BÃO XÚC XẮC CUỒNG NỘ! CHẾT ĐI PHƯỚC!',
          'XÚC XẮC TỬ THẦN! NÉ SAO ĐƯỢC NỮA?!',
          'TAO NỔI ĐIÊN RỒI! ĐỠ LẤY BÃO XÚC XẮC NÀY!',
        ]
      : [
          'XÚC XẮC ĐỊNH MỆNH! ĐỠ LẤY PHƯỚC!',
          'NÉ THỬ CẶP XÚC XẮC NÀY XEM!',
          'TAO SẼ DÙNG XÚC XẮC ĐÈ BẸP MÀY!',
        ];

    b.dialogueBubble = {
      text: taunts[Math.floor(Math.random() * taunts.length)],
      timer: 1.8,
    };

    if (b.isEnraged) {
      sounds.playBaHoLongUltimateSkill();
    }

    // When enraged: 5 rapid bursts every 200ms! Otherwise 4 bursts every 300ms
    const bursts = b.isEnraged ? [0, 200, 400, 600, 800] : [0, 300, 600, 900];
    const diceCountPerBurst = b.isEnraged ? 3 : 2;

    bursts.forEach((delay, burstIdx) => {
      setTimeout(() => {
        if (!this.boss || this.boss.state === 'stunned' || this.boss.state === 'defeated' || this.isPaused) return;

        sounds.playDiceThrow();
        const spawnX = this.boss.x + (dir === 1 ? this.boss.width : 0);
        const spawnY = this.boss.y + 24;

        for (let d = 0; d < diceCountPerBurst; d++) {
          let angle: number;
          let speed: number;

          if (d === 0) {
            // High lob arc
            angle = -0.32 - Math.random() * 0.45;
            speed = (b.isEnraged ? 7.2 : 5.8) + Math.random() * 3.0;
          } else if (d === 1) {
            // Mid arc
            angle = -0.15 - Math.random() * 0.4;
            speed = (b.isEnraged ? 6.5 : 4.8) + Math.random() * 3.5;
          } else {
            // Fast skimming ground roller (Enrage extra!)
            angle = -0.05 - Math.random() * 0.2;
            speed = 8.5 + Math.random() * 3.5;
          }

          this.bossAttacks.push({
            id: Math.random().toString(),
            x: spawnX,
            y: spawnY - d * 5,
            vx: dir * Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            type: 'dice_shot',
            width: 24,
            height: 24,
            life: 3.5,
            rotation: Math.random() * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * (b.isEnraged ? 25 : 16),
            bounceCount: 0,
            pipNumber: Math.floor(Math.random() * 6) + 1,
          });
        }

        if (burstIdx === 0) {
          this.screenShake = b.isEnraged ? 0.7 : 0.5;
        }
      }, delay);
    });
  }

  /**
   * Bá Hộ Long Money Throw Attack (Ném xấp tiền đô la $100 & lốc xoáy tiền mặt)
   * In Enrage Phase (50% HP): Unleashes 5 hurricane waves with 5 flying bills and stacks each!
   */
  private executeBaHoLongMoneyAttack() {
    if (!this.boss) return;
    const b = this.boss;
    const dir = b.facing === 'left' ? -1 : 1;
    b.state = 'money_throw';
    b.phaseTimer = b.isEnraged ? 1.7 : 2.4;

    const taunts = b.isEnraged
      ? [
          'BÃO TIỀN ĐÔ HUỶ DIỆT! TAO RẢI TIỀN CHÔN SỐNG MÀY!',
          'TIỀN NHIỀU ĐỂ LÀM GÌ?! ĐỂ ĐÈ CHẾT THẰNG PHƯỚC!',
          'LỐC XOÁY ĐÔ LA TỔNG LỰC ĐÂY!',
        ]
      : [
          'TIỀN NÀY! CẦM LẤY RỒI BIẾN KHỎI SÀI GÒN!',
          'TAO KHÔNG THIẾU TIỀN! ĐỠ LẤY BÃO ĐÔ LA NÀY!',
          'BÃO TIỀN ĐÔ ĐÂY! ĐỠ ĐƯỢC KHÔNG PHƯỚC?!',
          'XÈNG ĐÂU MÀ ĐẤU LẠI TIỀN CỦA TAO?!',
        ];

    b.dialogueBubble = {
      text: taunts[Math.floor(Math.random() * taunts.length)],
      timer: 1.8,
    };

    sounds.playBaHoLongUltimateSkill();

    // When enraged: 5 waves spaced 190ms apart! Otherwise 3 waves at 280ms
    const waves = b.isEnraged ? [0, 190, 380, 570, 760] : [0, 280, 560];
    const itemsPerWave = b.isEnraged ? 5 : 3;

    waves.forEach((delay, waveIdx) => {
      setTimeout(() => {
        if (!this.boss || this.boss.state === 'stunned' || this.boss.state === 'defeated' || this.isPaused) return;

        sounds.playMoneyThrow();
        const spawnX = this.boss.x + (dir === 1 ? this.boss.width : 0);
        const spawnY = this.boss.y + 26;

        for (let i = 0; i < itemsPerWave; i++) {
          const angle = -0.35 + (i * (0.6 / itemsPerWave)) + (Math.random() - 0.5) * 0.08;
          const speed = (b.isEnraged ? 6.8 : 5.2) + i * 1.1 + Math.random() * 1.5;
          const isStack = (i % 2 === 1) && (waveIdx % 2 === 1 || b.isEnraged);

          this.bossAttacks.push({
            id: Math.random().toString(),
            x: spawnX,
            y: spawnY + (i - 2) * 8,
            vx: dir * Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            type: isStack ? 'money_stack' : 'dollar_bill',
            width: isStack ? 32 : 28,
            height: isStack ? 18 : 14,
            life: 3.2,
            rotation: Math.random() * Math.PI,
            rotationSpeed: dir * (b.isEnraged ? 10 : 6),
          });
        }

        // Green money sparkles
        for (let p = 0; p < (b.isEnraged ? 7 : 4); p++) {
          this.particles.push({
            x: spawnX,
            y: spawnY,
            vx: (Math.random() - 0.5) * (b.isEnraged ? 7 : 4),
            vy: -Math.random() * 4,
            size: Math.random() * 3 + 2,
            color: '#4ADE80',
            alpha: 1,
            life: 0.35,
            maxLife: 0.35,
            shape: 'star',
          });
        }

        if (waveIdx === 0) {
          this.screenShake = b.isEnraged ? 0.6 : 0.4;
        }
      }, delay);
    });
  }

  /**
   * CSGT Gun Shooting Attack (Súng lục bắn đạn liên thanh tốc độ cao)
   * In Enrage Phase (50% HP): Fires continuous triple-tap bursts at higher speed!
   */
  private executeBossGunAttack() {
    if (!this.boss) return;
    const b = this.boss;
    const dir = b.facing === 'left' ? -1 : 1;
    b.dialogueBubble = {
      text: b.isEnraged ? 'BẮN CẢNH CÁO TỔNG LỰC! ĐẦU HÀNG MAU!' : 'ĐỨNG LẠI! GIƠ TAY LÊN!',
      timer: 1.6,
    };

    sounds.playCsgtUltimateSkill();

    const bulletShots = b.isEnraged ? [200, 380, 540] : [320, 560];

    bulletShots.forEach((delay, idx) => {
      setTimeout(() => {
        if (!this.boss || this.boss.state === 'stunned' || this.boss.state === 'defeated' || this.isPaused) return;
        sounds.playGunshot();
        this.screenShake = b.isEnraged ? 0.8 : 0.6;

        this.bossAttacks.push({
          id: Math.random().toString(),
          x: this.boss.x + (dir === 1 ? this.boss.width + 12 : -12),
          y: this.boss.y + 36,
          vx: dir * (b.isEnraged ? 13.5 : 11.0),
          vy: idx === 1 ? -0.8 : idx === 2 ? 0.8 : 0,
          type: 'bullet_shot',
          width: 22,
          height: 10,
          life: 2.5,
        });
      }, delay);
    });
  }

  private executeBossWhistleAttack() {
    if (!this.boss) return;
    const b = this.boss;
    sounds.playBossWhistle();
    const dir = b.facing === 'left' ? -1 : 1;

    const count = b.isEnraged ? 5 : 3;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (!this.boss || this.boss.state === 'stunned' || this.boss.state === 'defeated' || this.isPaused) return;
        this.bossAttacks.push({
          id: Math.random().toString(),
          x: this.boss.x + (dir === 1 ? this.boss.width : 0),
          y: this.boss.y + 24,
          vx: dir * ((b.isEnraged ? 7.0 : 5.5) + i * 1.5),
          vy: (i - Math.floor(count / 2)) * 1.3,
          type: 'whistle_wave',
          width: 28,
          height: 28,
          life: 2.2,
        });
      }, i * (b.isEnraged ? 130 : 180));
    }
  }

  private executeBossCitationAttack() {
    if (!this.boss) return;
    const dir = this.boss.facing === 'left' ? -1 : 1;

    for (let i = 0; i < 2; i++) {
      setTimeout(() => {
        if (!this.boss || this.boss.state === 'stunned' || this.boss.state === 'defeated') return;
        this.bossAttacks.push({
          id: Math.random().toString(),
          x: this.boss.x + (dir === 1 ? this.boss.width : 0),
          y: this.boss.y + 30,
          vx: dir * 7.0,
          vy: -2 + i * 3,
          type: 'citation_paper',
          width: 22,
          height: 28,
          life: 2.4,
          rotation: 0,
        });
      }, i * 220);
    }
  }

  private executeBaHoLongTaunt() {
    if (!this.boss) return;
    const lines = [
      'Trúc là của tao! Mày nghèo đừng mơ!',
      'Mày chỉ có set son 500k mà đòi đú!',
      'Tao giàu nứt đố đổ vách, mày có gì?!',
    ];
    this.boss.dialogueBubble = {
      text: lines[Math.floor(Math.random() * lines.length)],
      timer: 1.8,
    };
  }

  /**
   * Boss Ý Attack 1: Quăng Ly Trà Sữa (Boba Cup Throw)
   */
  private executeYBobaAttack() {
    if (!this.boss) return;
    const b = this.boss;
    const dir = b.facing === 'left' ? -1 : 1;
    b.state = 'boba_throw';
    b.phaseTimer = b.isEnraged ? 1.4 : 2.0;

    const taunts = b.isEnraged
      ? [
          'BÃO TRÀ SỮA TRÂN CHÂU ĐƯỜNG ĐEN! NÉ SAO ĐƯỢC?!',
          'TRÀ SỮA TO BỰ ĐÈ BẸP TÌNH CẢM VỚI CON TRÚC ĐÂY!',
          'KHÔNG THEO EM THÌ UỐNG TRÀ SỮA TRỪ CƠM NHÉ!',
        ]
      : [
          'Trà sữa full topping em mua cho anh nè, uống đi mà quay lại với em!',
          'Uống một ngụm trà sữa cho ngọt giọng đi anh Phước!',
          'Đỡ lấy ly trà sữa trân châu tình yêu của em nè!',
        ];

    b.dialogueBubble = {
      text: taunts[Math.floor(Math.random() * taunts.length)],
      timer: 1.8,
    };

    if (b.isEnraged) {
      sounds.playBossYUltimateSkill();
    } else {
      sounds.playBobaSplash();
    }

    const cupCount = b.isEnraged ? 2 : 1;
    for (let c = 0; c < cupCount; c++) {
      setTimeout(() => {
        if (!this.boss || this.boss.state === 'stunned' || this.boss.state === 'defeated' || this.isPaused) return;
        const spawnX = this.boss.x + (dir === 1 ? this.boss.width : 0);
        const spawnY = this.boss.y + 16 - c * 8;
        const speed = (b.isEnraged ? 9.5 : 7.5) + c * 1.5;
        const angle = -0.15 - c * 0.15;

        this.bossAttacks.push({
          id: Math.random().toString(),
          x: spawnX,
          y: spawnY,
          vx: dir * Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          type: 'boba_cup',
          width: 26,
          height: 36,
          life: 3.2,
          rotation: 0,
          rotationSpeed: dir * (b.isEnraged ? 9 : 6),
        });
      }, c * 220);
    }
  }

  /**
   * Boss Ý Attack 2: Bão Trân Châu Đen Nảy Tưng Tưng (Black Boba Pearl Barrage)
   */
  private executeYPearlAttack() {
    if (!this.boss) return;
    const b = this.boss;
    const dir = b.facing === 'left' ? -1 : 1;
    b.state = 'pearl_barrage';
    b.phaseTimer = b.isEnraged ? 1.5 : 2.2;

    const taunts = b.isEnraged
      ? [
          'BÃO TRÂN CHÂU ĐEN BẮN TƯNG TƯNG ĐÂY!',
          'HÀNG LOẠT TRÂN CHÂU HOÀNG KIM NÈ!',
        ]
      : [
          'Trân châu dai giòn, đố anh né được!',
          'Ăn trân châu để nhớ lại kỷ niệm ngày xưa đi anh!',
        ];

    b.dialogueBubble = {
      text: taunts[Math.floor(Math.random() * taunts.length)],
      timer: 1.8,
    };

    const count = b.isEnraged ? 5 : 3;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (!this.boss || this.boss.state === 'stunned' || this.boss.state === 'defeated' || this.isPaused) return;
        const spawnX = this.boss.x + (dir === 1 ? this.boss.width : 0);
        const spawnY = this.boss.y + 24;
        const angle = -0.1 - (i * 0.08);
        const speed = (b.isEnraged ? 8.0 : 6.0) + Math.random() * 2.5;

        this.bossAttacks.push({
          id: Math.random().toString(),
          x: spawnX,
          y: spawnY,
          vx: dir * Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          type: 'boba_pearl',
          width: 16,
          height: 16,
          life: 3.5,
          bounceCount: 0,
        });
      }, i * (b.isEnraged ? 120 : 180));
    }
  }

  /**
   * Boss Ý Attack 3: Phóng Mưa Tiền 50.000 VNĐ Polymer (50K Banknote Throw)
   */
  private executeY50kAttack() {
    if (!this.boss) return;
    const b = this.boss;
    const dir = b.facing === 'left' ? -1 : 1;
    b.state = 'money50k_throw';
    b.phaseTimer = b.isEnraged ? 1.3 : 1.9;

    const taunts = [
      '50K NÈ! CẦM TIỀN MUA TRÀ SỮA RỒI BỎ CON TRÚC ĐI!',
      'TIỀN 50K EM ĐÃ SẴN SÀNG CHO ANH TIÊU XÀI ĐÂY!',
      'ĐỠ LẤY MƯA TIỀN 50K POLYMER HỒNG TÍM NÀY!',
    ];

    b.dialogueBubble = {
      text: taunts[Math.floor(Math.random() * taunts.length)],
      timer: 1.8,
    };

    const count = b.isEnraged ? 4 : 2;
    for (let i = 0; i < count; i++) {
      const angle = -0.25 + i * 0.18;
      const speed = b.isEnraged ? 8.5 : 7.0;
      this.bossAttacks.push({
        id: Math.random().toString(),
        x: this.boss.x + (dir === 1 ? this.boss.width : 0),
        y: this.boss.y + 28 + (i - 1) * 8,
        vx: dir * Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        type: 'bill_50k',
        width: 32,
        height: 18,
        life: 2.8,
        rotation: 0,
        rotationSpeed: dir * 7,
      });
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.life -= dt;
      proj.x += proj.vx * 60 * dt;
      proj.y += proj.vy * 60 * dt;
      proj.scale = Math.min(1.25, proj.scale + dt * 0.8);

      if (this.boss && this.boss.state !== 'defeated') {
        const b = this.boss;
        if (
          proj.x + 40 > b.x &&
          proj.x < b.x + b.width &&
          proj.y + 20 > b.y &&
          proj.y < b.y + b.height
        ) {
          const hitDmg = proj.damage !== undefined ? proj.damage : 10;
          b.health = Math.max(0, b.health - hitDmg);
          b.invulnerableTimer = 0.3;
          b.state = 'stunned';
          b.stunTimer = 0.45;
          b.vx = proj.vx > 0 ? 3 : -3;
          this.screenShake = 0.9;
          if (proj.projType === 'lipstick') {
            sounds.playLipstickHit();
          } else {
            sounds.playBossHurt();
          }

          if (this.callbacks.onBossHealthUpdate && b.health !== this.lastReportedBossHp) {
            this.lastReportedBossHp = b.health;
            this.callbacks.onBossHealthUpdate(b.health, b.maxHealth);
          }

          // === BOSS CSGT STORY DIALOGUE MILESTONES ===
          if (b.bossType === 'csgt') {
            if (b.health <= 50 && !b.hit50PercentCutscene && this.callbacks.onBossStoryEvent) {
              b.hit50PercentCutscene = true;
              this.pause();
              this.callbacks.onBossStoryEvent({
                stage: 'phase_csgt_50',
                speaker: 'Trưởng Trạm CSGT',
                currentDialogIndex: 0,
                dialogues: [],
                lines: getStoryEventLines('phase_csgt_50'),
              });
              this.projectiles.splice(i, 1);
              continue;
            }
          }

          // === BOSS Ý STORY DIALOGUE MILESTONES (Màn 3) ===
          if (b.bossType === 'y') {
            if (b.health <= 50 && !b.hit50PercentCutscene && this.callbacks.onBossStoryEvent) {
              b.hit50PercentCutscene = true;
              this.pause();
              this.callbacks.onBossStoryEvent({
                stage: 'y_50',
                speaker: 'Ý, Thuận & Phước',
                currentDialogIndex: 0,
                dialogues: [],
                lines: getStoryEventLines('y_50'),
              });
              this.projectiles.splice(i, 1);
              continue;
            }

            if (b.health <= 0 && !b.hit100PercentCutscene && this.callbacks.onBossStoryEvent) {
              b.hit100PercentCutscene = true;
              b.state = 'defeated';
              this.hasDinhKey = true;
              this.thuanState = 'cheer';
              this.score += 2500;
              sounds.playVictory();
              this.pause();
              this.callbacks.onBossStoryEvent({
                stage: 'y_defeated',
                speaker: 'Ý, Thuận & Phước',
                currentDialogIndex: 0,
                dialogues: [],
                lines: getStoryEventLines('y_defeated'),
              });
              this.projectiles.splice(i, 1);
              continue;
            }
          }

          // === BÁ HỘ LONG STORY DIALOGUE MILESTONES (User Request) ===
          if (b.bossType === 'baholong') {
            // Milestone 1: Lost >= 30% HP (Health <= 70)
            if (b.health <= 70 && !b.hit30PercentCutscene && this.callbacks.onBossStoryEvent) {
              b.hit30PercentCutscene = true;
              this.pause();
              this.callbacks.onBossStoryEvent({
                stage: 'phase1_30',
                speaker: 'Bá Hộ Long',
                currentDialogIndex: 0,
                dialogues: [],
                lines: getStoryEventLines('phase1_30'),
              });
              this.projectiles.splice(i, 1);
              continue;
            }

            // Milestone 2: Enraged at <= 50% HP
            if (b.health <= 50 && !b.hit50PercentCutscene && this.callbacks.onBossStoryEvent) {
              b.hit50PercentCutscene = true;
              this.pause();
              this.callbacks.onBossStoryEvent({
                stage: 'phase_long_50',
                speaker: 'Bá Hộ Long',
                currentDialogIndex: 0,
                dialogues: [],
                lines: getStoryEventLines('phase_long_50'),
              });
              this.projectiles.splice(i, 1);
              continue;
            }

            // Milestone 3: Lost >= 70% HP (Health <= 30)
            if (b.health <= 30 && !b.hit70PercentCutscene && this.callbacks.onBossStoryEvent) {
              b.hit70PercentCutscene = true;
              this.pause();
              this.callbacks.onBossStoryEvent({
                stage: 'phase2_70',
                speaker: 'Bá Hộ Long',
                currentDialogIndex: 0,
                dialogues: [],
                lines: getStoryEventLines('phase2_70'),
              });
              this.projectiles.splice(i, 1);
              continue;
            }

            // Milestone 4: Lost 100% HP (Health <= 0)
            if (b.health <= 0 && !b.hit100PercentCutscene && this.callbacks.onBossStoryEvent) {
              b.hit100PercentCutscene = true;
              b.state = 'defeated';
              this.pause();
              this.callbacks.onBossStoryEvent({
                stage: 'phase3_100',
                speaker: 'Bá Hộ Long',
                currentDialogIndex: 0,
                dialogues: [],
                lines: getStoryEventLines('phase3_100'),
              });
              this.projectiles.splice(i, 1);
              continue;
            }
          }

          const remarks = [
            'Bởi vì cái gì?! Sao lý luận vững thế?!',
            'Áaa! Lý lẽ quá thuyết phục, ta đuối lý!',
            'Khoan! Cậu nói nghe chí lý quá...',
            'Đừng nói BECAUSE nữa, nhức đầu quá!',
          ];
          b.dialogueBubble = {
            text: remarks[Math.floor(Math.random() * remarks.length)],
            timer: 1.8,
          };

          for (let p = 0; p < 10; p++) {
            this.particles.push({
              x: proj.x,
              y: proj.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              size: Math.random() * 5 + 3,
              color: '#FACC15',
              alpha: 1,
              life: 0.45,
              maxLife: 0.45,
              shape: 'star',
            });
          }

          if (b.health <= 0) {
            b.state = 'defeated';
            b.isShootingGun = false;
            sounds.playVictory();
            this.score += 2000;
          }

          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Check collision against Trường mini-boss in THPT Tam Phước
      if (this.level.id === 1 && this.level1Area === 'tam_phuoc_school' && !this.truongDefeated) {
        if (
          proj.x + 36 > this.truongX &&
          proj.x < this.truongX + this.truongWidth &&
          proj.y + 20 > this.truongY &&
          proj.y < this.truongY + this.truongHeight
        ) {
          const hitDmg = proj.damage !== undefined ? proj.damage : 20;
          if (proj.projType === 'lipstick') {
            sounds.playLipstickHit();
          }
          this.damageTruong(hitDmg);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Check collision against otters / enemies
      let hitEnemy = false;
      for (const enemy of this.enemies) {
        if (enemy.state === 'alive') {
          if (
            proj.x + 36 > enemy.x &&
            proj.x < enemy.x + enemy.width &&
            proj.y + 20 > enemy.y &&
            proj.y < enemy.y + enemy.height
          ) {
            enemy.state = 'squished';
            enemy.squishTimer = 0.5;
            sounds.playStomp();
            this.score += 200;
            this.screenShake = 0.4;
            for (let p = 0; p < 6; p++) {
              this.particles.push({
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: Math.random() * 4 + 2,
                color: '#FACC15',
                alpha: 1,
                life: 0.35,
                maxLife: 0.35,
                shape: 'star',
              });
            }
            this.projectiles.splice(i, 1);
            hitEnemy = true;
            break;
          }
        }
      }
      if (hitEnemy) continue;

      if (proj.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    for (let j = this.bossAttacks.length - 1; j >= 0; j--) {
      const atk = this.bossAttacks[j];
      atk.life -= dt;

      // Handle custom physics for Dice Shots (Gravity & Bouncing!)
      if (atk.type === 'boba_cup') {
        atk.vy += 18 * dt;
        atk.x += atk.vx * 60 * dt;
        atk.y += atk.vy * 60 * dt;
        atk.rotation = (atk.rotation || 0) + (atk.rotationSpeed || 8) * dt;

        // Ground splatter
        if (atk.y >= 475) {
          sounds.playBobaSplash();
          for (let sp = 0; sp < 8; sp++) {
            this.particles.push({
              x: atk.x + atk.width / 2,
              y: 490,
              vx: (Math.random() - 0.5) * 6,
              vy: -Math.random() * 4 - 1,
              size: Math.random() * 4 + 2,
              color: sp % 2 === 0 ? '#FDE68A' : '#78350F',
              alpha: 0.9,
              life: 0.35,
              maxLife: 0.35,
              shape: 'splash',
            });
          }
          this.bossAttacks.splice(j, 1);
          continue;
        }
      } else if (atk.type === 'boba_pearl') {
        atk.vy += 22 * dt;
        atk.x += atk.vx * 60 * dt;
        atk.y += atk.vy * 60 * dt;

        if (atk.y >= 485 && atk.vy > 0) {
          atk.y = 485;
          atk.vy = -atk.vy * 0.65;
          atk.vx *= 0.85;
          atk.bounceCount = (atk.bounceCount || 0) + 1;
        }
      } else if (atk.type === 'bill_50k') {
        atk.x += atk.vx * 60 * dt;
        atk.y += (atk.vy + Math.sin(this.riverTimer * 9 + (atk.rotation || 0)) * 0.45) * 60 * dt;
        if (atk.rotation !== undefined) {
          atk.rotation += (atk.rotationSpeed || 8) * dt;
        }
      } else if (atk.type === 'dice_shot') {
        atk.vy += 22 * dt;
        atk.x += atk.vx * 60 * dt;
        atk.y += atk.vy * 60 * dt;
        atk.rotation = (atk.rotation || 0) + (atk.rotationSpeed || 10) * dt;

        // Ground bounce on road surface at y = 470
        if (atk.y >= 470 && atk.vy > 0) {
          atk.y = 470;
          atk.vy = -atk.vy * 0.65;
          atk.vx *= 0.85;
          atk.bounceCount = (atk.bounceCount || 0) + 1;

          for (let s = 0; s < 2; s++) {
            this.particles.push({
              x: atk.x + 12,
              y: atk.y + 12,
              vx: (Math.random() - 0.5) * 4,
              vy: -Math.random() * 3 - 1,
              size: 3,
              color: '#F87171',
              alpha: 1,
              life: 0.25,
              maxLife: 0.25,
              shape: 'star',
            });
          }
        }
      } else if (atk.type === 'dollar_bill' || atk.type === 'money_stack') {
        atk.x += atk.vx * 60 * dt;
        atk.y += (atk.vy + Math.sin(this.riverTimer * 7 + (atk.rotation || 0)) * 0.45) * 60 * dt;
        if (atk.rotation !== undefined) {
          atk.rotation += (atk.rotationSpeed || 6) * dt;
        }
      } else if (atk.type === 'slipper_throw' || atk.type === 'slipper_rain' || atk.type === 'slipper_shockwave') {
        atk.x += atk.vx * 60 * dt;
        atk.y += atk.vy * 60 * dt;
        if (atk.rotationSpeed) {
          atk.rotation = (atk.rotation || 0) + atk.rotationSpeed * dt;
        }
      } else {
        atk.x += atk.vx * 60 * dt;
        atk.y += atk.vy * 60 * dt;
        if (atk.rotation !== undefined) {
          atk.rotation += dt * 8;
        }
      }

      const p = this.player;
      if (
        p.invulnerableTimer <= 0 &&
        p.x + p.width > atk.x &&
        p.x < atk.x + atk.width &&
        p.y + p.height > atk.y &&
        p.y < atk.y + atk.height
      ) {
        // CƠ CHẾ PARRY (ĐỠ ĐÒN & PHẢN ĐÒN HOÀN HẢO)
        if (p.isParrying && p.parryTimer && p.parryTimer > 0) {
          sounds.playParrySuccessSkill();
          this.screenShake = 0.8;
          this.addPlayerEnergy(15); // Thưởng +15% nội năng khi căn đỡ đòn chuẩn (theo yêu cầu người dùng)

          // Deflection sparks
          for (let sp = 0; sp < 10; sp++) {
            this.particles.push({
              x: atk.x + atk.width / 2,
              y: atk.y + atk.height / 2,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              size: Math.random() * 5 + 3,
              color: ['#38BDF8', '#FDE047', '#FFFFFF', '#60A5FA'][sp % 4],
              alpha: 1,
              life: 0.45,
              maxLife: 0.45,
              shape: 'star',
            });
          }

          // Floating combat text: "PARRY! 🛡️ (+15% NỘI NĂNG)"
          this.particles.push({
            x: p.x + p.width / 2,
            y: p.y - 14,
            vx: 0,
            vy: -1.6,
            size: 13,
            color: '#38BDF8',
            alpha: 1,
            life: 0.85,
            maxLife: 0.85,
            shape: 'letter',
            char: 'PARRY! 🛡️ (+15% NỘI NĂNG)',
          });

          // Deflect projectile back at boss with bonus speed!
          const deflectDir = p.facing === 'right' ? 1 : -1;
          this.projectiles.push({
            id: 'reflected-' + Math.random().toString(),
            x: atk.x,
            y: atk.y,
            vx: deflectDir * 16,
            vy: -1.5,
            text: 'PHẢN ĐÒN ⚡',
            size: 16,
            color: '#38BDF8',
            life: 1.5,
            maxLife: 1.5,
            isFromPlayer: true,
            rotation: 0,
            scale: 0.9,
            projType: 'reflected',
            damage: 15,
          });

          this.bossAttacks.splice(j, 1);
          continue;
        }

        if (atk.type === 'slipper_throw' || atk.type === 'slipper_rain' || atk.type === 'slipper_shockwave') {
          sounds.playSlipperSlap();
        } else if (atk.type === 'boba_cup' || atk.type === 'boba_pearl') {
          sounds.playBobaSplash();
        }
        this.handlePlayerDamage();
        this.bossAttacks.splice(j, 1);
        continue;
      }

      if (atk.life <= 0) {
        this.bossAttacks.splice(j, 1);
      }
    }
  }

  private updateCollectibles() {
    const p = this.player;
    for (const c of this.collectibles) {
      if (c.collected) continue;
      c.bobOffset += 0.05;

      if (
        p.x + p.width > c.x &&
        p.x < c.x + c.width &&
        p.y + p.height > c.y &&
        p.y < c.y + c.height
      ) {
        c.collected = true;
        if (c.type === 'lotus_coin') {
          this.coins++;
          this.score += 50;
          sounds.playCoin();
        } else if (c.type === 'grapefruit_heal') {
          p.health = Math.min(p.maxHealth, p.health + 1);
          this.score += 100;
          this.timeLeft = Math.min(240, this.timeLeft + 5);
          sounds.playHeal();
        } else if (c.type === 'heart_heal') {
          // Reaching heart restores HP and gives +10s bonus time!
          p.health = Math.min(p.maxHealth, p.health + 1);
          this.score += 250;
          this.timeLeft = Math.min(240, this.timeLeft + 10);
          sounds.playHeartHeal();
          this.spawnHeartHealParticles(c.x + c.width / 2, c.y + c.height / 2);
        }

        for (let i = 0; i < 6; i++) {
          this.particles.push({
            x: c.x + c.width / 2,
            y: c.y + c.height / 2,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 4 + 2,
            color: c.type === 'lotus_coin' ? '#FACC15' : '#4ADE80',
            alpha: 1,
            life: 0.35,
            maxLife: 0.35,
            shape: 'star',
          });
        }
      }
    }
  }

  private spawnHeartHealParticles(x: number, y: number) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 5 - 2,
        size: Math.random() * 5 + 3,
        color: ['#F43F5E', '#FB7185', '#FDA4AF', '#FDE047'][i % 4],
        alpha: 1,
        life: 0.7,
        maxLife: 0.7,
        shape: 'heart',
      });
    }

    // Floating text feedback "+1 HP ❤️ (+10s)"
    this.particles.push({
      x,
      y: y - 12,
      vx: 0,
      vy: -1.6,
      size: 13,
      color: '#F43F5E',
      alpha: 1,
      life: 0.85,
      maxLife: 0.85,
      shape: 'letter',
      char: '+1 HP ❤️ (+10s)',
    });

    this.setPlayerSpeech('Trái tim tiếp sức! Vì Trúc anh sẽ cố lên!', 1.8);
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.life -= dt;
      part.x += part.vx * 60 * dt;
      part.y += part.vy * 60 * dt;
      part.alpha = Math.max(0, part.life / part.maxLife);

      if (part.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private handlePlayerDamage() {
    const p = this.player;
    p.health--;
    p.invulnerableTimer = 1.5;
    p.vy = -6;
    p.vx = p.facing === 'right' ? -4 : 4;
    this.screenShake = 0.8;
    sounds.playPlayerHurt();

    if (p.health > 0) {
      this.setPlayerSpeech('Đau đấy, nhưng vì Trúc anh không bỏ cuộc!', 1.6);
    } else {
      sounds.playGameOver();
      this.callbacks.onGameOver('Bạn đã hết máu!');
    }
  }

  private updateCamera() {
    const currentMaxX =
      this.level.id === 1 && this.level1Area === 'tam_phuoc_school' ? 1200 : this.level.width;
    const targetCamX = this.player.x - this.viewportWidth * 0.4;
    this.cameraX += (targetCamX - this.cameraX) * 0.14;
    this.cameraX = Math.max(0, Math.min(this.cameraX, currentMaxX - this.viewportWidth));
  }

  private checkLevelGoal() {
    const p = this.player;
    const g = this.level.goalPoint;

    if (this.boss && this.boss.state !== 'defeated') {
      return;
    }

    if (this.level.id === 1) {
      if (this.level1Area !== 'river') return;

      // Gate locked without Thoại's bridge key
      if (!this.hasBridgeKey) {
        if (
          p.x + p.width > g.x &&
          p.x < g.x + g.width &&
          p.y + p.height > g.y &&
          p.y < g.y + g.height
        ) {
          p.x = g.x - p.width - 6;
          p.vx = 0;
          this.setPlayerSpeech(
            'Cổng đã bị khóa! Cần chìa khóa của Thoại ở giữa Sông Buông để qua Màn 2!',
            3.0
          );
        }
        return;
      }
    }

    if (
      p.x + p.width > g.x &&
      p.x < g.x + g.width &&
      p.y + p.height > g.y &&
      p.y < g.y + g.height
    ) {
      sounds.playVictory();
      if (this.level.id === 1) {
        this.callbacks.onLevelComplete(2);
      } else if (this.level.id === 2) {
        this.callbacks.onLevelComplete(3);
      } else if (this.level.id === 3) {
        this.callbacks.onLevelComplete(4);
      } else {
        this.callbacks.onVictory();
      }
    }
  }

  // Rendering Loop
  public render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.viewportWidth, this.viewportHeight);

    ctx.save();

    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake * 8;
      const shakeY = (Math.random() - 0.5) * this.screenShake * 8;
      ctx.translate(shakeX, shakeY);
    }

    this.drawParallaxBackground(ctx);

    ctx.translate(-Math.floor(this.cameraX), 0);

    if (this.level.id === 1) {
      if (this.level1Area === 'river') {
        Level1Scenery.drawRiver(ctx, this.level.width, this.level.height, this.riverTimer);
        Level1Scenery.drawEnvironment(ctx, this.cameraX, this.riverTimer);

        // Entrance Gate to THPT Tam Phước
        TamPhuocSchoolScenery.drawEntranceDoorInLevel1(
          ctx,
          this.schoolDoorX,
          this.schoolDoorY,
          this.schoolDoorWidth,
          this.schoolDoorHeight,
          this.riverTimer,
          this.isNearSchoolDoor()
        );

        // NPC Thoại
        drawThoai(ctx, {
          x: this.thoaiX,
          y: this.thoaiY,
          width: this.thoaiWidth,
          height: this.thoaiHeight,
          facing: this.thoaiFacing,
          state: this.thoaiState,
          questState: this.thoaiQuestState,
          animTimer: this.thoaiAnimTimer,
          isPlayerNearby: this.isNearThoai(),
        });

        this.drawPlatforms(ctx);
        this.drawGoalPoint(ctx);
        this.drawCollectibles(ctx);
        this.drawEnemies(ctx);
      } else {
        // THPT Tam Phước Arena
        TamPhuocSchoolScenery.drawEnvironment(ctx, 1200, 600, this.riverTimer);
        TamPhuocSchoolScenery.drawExitDoor(ctx, 50, 350, 70, 120, this.riverTimer);

        this.drawPlatforms(ctx);

        // Dropped slippers if available
        if (this.droppedSlippersPos && !this.hasThoaiSlippers) {
          drawDroppedSlippers(ctx, this.droppedSlippersPos.x, this.droppedSlippersPos.y, this.riverTimer);
        }

        // Mini-Boss Trường
        drawTruongMiniBoss(ctx, {
          x: this.truongX,
          y: this.truongY,
          width: this.truongWidth,
          height: this.truongHeight,
          facing: this.truongFacing,
          state: this.truongState,
          animTimer: this.truongAnimTimer,
          invulnerableTimer: this.truongInvulnerableTimer,
          isEnraged: this.truongEnraged,
          hp: this.truongHp,
          maxHp: this.truongMaxHp,
        });

        // Speech Bubble for Trường
        if (this.truongDialogueBubble) {
          ctx.save();
          const bubbleX = this.truongX + this.truongWidth / 2;
          const bubbleY = this.truongY - 14;
          ctx.font = 'bold 11px system-ui, sans-serif';
          const textW = ctx.measureText(this.truongDialogueBubble.text).width;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(bubbleX - textW / 2 - 8, bubbleY - 22, textW + 16, 22, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#F87171';
          ctx.textAlign = 'center';
          ctx.fillText(this.truongDialogueBubble.text, bubbleX, bubbleY - 7);
          ctx.restore();
        }
      }
    } else {
      if (this.level.id === 2) {
        Level2Scenery.drawEnvironment(ctx, this.cameraX, this.riverTimer);
      } else if (this.level.id === 3) {
        this.drawLevel3Environment(ctx);
      } else if (this.level.id === 4) {
        this.drawLevel4Environment(ctx);
      }

      this.drawPlatforms(ctx);
      this.drawGoalPoint(ctx);
      this.drawCollectibles(ctx);
      this.drawEnemies(ctx);
    }

    if (this.boss) {
      this.drawBoss(ctx);
    }

    this.drawProjectiles(ctx);

    // Render Phước with the exact character model from user's sprite sheet!
    const isBossDefeated = this.boss && this.boss.state === 'defeated';
    const playerRenderState = isBossDefeated ? 'celebrate' : this.player.state;

    drawPhuoc(ctx, {
      x: this.player.x,
      y: this.player.y,
      width: this.player.width,
      height: this.player.height,
      facing: this.player.facing,
      state: playerRenderState,
      animTimer: this.player.animTimer,
      isInvulnerable: this.player.invulnerableTimer > 0,
      isParrying: !!(this.player.isParrying && this.player.parryTimer && this.player.parryTimer > 0),
    });

    // Render Parry Shield aura when player is parrying
    if (this.player.isParrying && this.player.parryTimer && this.player.parryTimer > 0) {
      ctx.save();
      const pX = this.player.facing === 'right' ? this.player.x + this.player.width + 4 : this.player.x - 4;
      const pY = this.player.y + this.player.height / 2;
      const pulse = Math.sin(this.riverTimer * 22) * 2.5;

      // Outer cyan-gold hexagonal guard arc
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const startAngle = this.player.facing === 'right' ? -Math.PI / 2.2 : Math.PI / 1.8;
      const endAngle = this.player.facing === 'right' ? Math.PI / 2.2 : Math.PI * 1.45;
      ctx.arc(pX, pY, 26 + pulse, startAngle, endAngle);
      ctx.stroke();

      // Golden inner barrier
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pX, pY, 20, startAngle, endAngle);
      ctx.stroke();

      // Shield crest glow
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.fill();

      // Text callout
      ctx.fillStyle = '#38BDF8';
      ctx.font = '900 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PARRY 🛡️', this.player.x + this.player.width / 2, this.player.y - 14);
      ctx.restore();
    }

    this.drawPlayerDialogueBubble(ctx);

    this.drawParticles(ctx);

    // Draw Aim Trajectory (if active on mobile drag)
    if (this.aimTrajectory && this.aimTrajectory.active) {
      const pX = this.player.x + (this.player.facing === 'right' ? this.player.width + 2 : -2);
      const pY = this.player.y + 16;
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pX, pY);
      const targetLength = 240;
      const endX = pX + Math.cos(this.aimTrajectory.angle) * targetLength;
      const endY = pY + Math.sin(this.aimTrajectory.angle) * targetLength;
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Glowing targeting endpoint
      ctx.setLineDash([]);
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(endX, endY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Outer targeting ring
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(endX, endY, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Tap-to-Aim Ripple Effect
    if (this.tapTargetEffect) {
      const tX = this.tapTargetEffect.x + this.cameraX;
      const tY = this.tapTargetEffect.y;
      const progress = 1 - this.tapTargetEffect.life / this.tapTargetEffect.maxLife;
      const radius = 10 + progress * 24;
      const alpha = Math.max(0, 1 - progress);

      ctx.save();
      ctx.strokeStyle = `rgba(250, 204, 21, ${alpha})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(tX, tY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshair tick marks
      ctx.beginPath();
      ctx.moveTo(tX - radius - 4, tY);
      ctx.lineTo(tX - 4, tY);
      ctx.moveTo(tX + 4, tY);
      ctx.lineTo(tX + radius + 4, tY);
      ctx.moveTo(tX, tY - radius - 4);
      ctx.lineTo(tX, tY - 4);
      ctx.moveTo(tX, tY + 4);
      ctx.lineTo(tX, tY + radius + 4);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  private drawParallaxBackground(ctx: CanvasRenderingContext2D) {
    const w = this.viewportWidth;
    const h = this.viewportHeight;

    if (this.level.id === 1) {
      if (this.level1Area === 'tam_phuoc_school') return;
      Level1Scenery.drawParallax(ctx, w, h, this.cameraX, this.riverTimer);
      return;
    }

    if (this.level.id === 2) {
      Level2Scenery.drawParallax(ctx, w, h, this.cameraX, this.riverTimer);
      return;
    }

    if (this.level.id === 3) {
      this.drawLevel3Parallax(ctx, w, h);
      return;
    }

    if (this.level.id === 4) {
      this.drawLevel4Parallax(ctx, w, h);
      return;
    }
  }

  private drawLevel3Parallax(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Nightfall sky over outer mansion estate
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#0F172A');
    skyGrad.addColorStop(0.6, '#1E293B');
    skyGrad.addColorStop(1, '#334155');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Moon
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(w - 120, 60, 26, 0, Math.PI * 2);
    ctx.fill();

    // Silhouetted bamboo groves & curved mansion tiled roofs in distance
    ctx.fillStyle = '#090D16';
    for (let x = 0; x <= w + 100; x += 140) {
      const rx = x - ((this.cameraX * 0.15) % 140);
      ctx.beginPath();
      ctx.moveTo(rx - 20, h - 120);
      ctx.lineTo(rx + 60, h - 180);
      ctx.lineTo(rx + 140, h - 120);
      ctx.fill();
    }
  }

  private drawLevel3Environment(ctx: CanvasRenderingContext2D) {
    // 1. NPC Thuận taking refuge & cheering
    drawThuanNPC(ctx, {
      x: this.thuanX,
      y: this.thuanY,
      width: 46,
      height: 64,
      facing: this.thuanFacing,
      state: this.thuanState,
      animTimer: this.thuanAnimTimer,
      speechBubble: this.thuanSpeechBubble,
    });

    // 2. Red glowing paper lanterns along walls
    for (let x = 160; x <= this.level.width; x += 360) {
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.ellipse(x, 260, 10, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FDE047';
      ctx.fillRect(x - 2, 268, 4, 8);
    }
  }

  private drawLevel4Parallax(ctx: CanvasRenderingContext2D, w: number, h: number) {
    Level4Scenery.drawParallaxBackground(ctx, this.cameraX, this.riverTimer);
  }

  private drawLevel4Environment(ctx: CanvasRenderingContext2D) {
    // 1. Fallen motorbike stuck beside highway guardrail (near spawn point)
    Level4Scenery.drawCrashedMotorbike(ctx, 160, 440, this.riverTimer);

    // 2. Sweet Trúc resting safely on highway sidewalk beside motorbike
    const isBossDefeated = Boolean(this.boss && this.boss.state === 'defeated');
    Level4Scenery.drawInjuredTruc(ctx, 90, 445, this.riverTimer, isBossDefeated);

    // 3. Orange Traffic Cones & Highway Markers along the arena
    for (let px = 580; px <= this.level.width - 200; px += 360) {
      ctx.save();
      // Orange highway safety cone
      ctx.fillStyle = '#EA580C';
      ctx.beginPath();
      ctx.moveTo(px, 470);
      ctx.lineTo(px + 7, 446);
      ctx.lineTo(px + 14, 470);
      ctx.closePath();
      ctx.fill();

      // White reflective tape
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(px + 3, 456, 8, 4);

      // Base plate
      ctx.fillStyle = '#C2410C';
      ctx.fillRect(px - 2, 468, 18, 3);
      ctx.restore();
    }
  }

  private drawPlatforms(ctx: CanvasRenderingContext2D) {
    for (const plat of this.platforms) {
      if (plat.type === 'ground') {
        if (this.level.id === 1) {
          // Lush Green Grassy Riverbank Top Layer matching reference image
          ctx.fillStyle = '#15803D';
          ctx.fillRect(plat.x, plat.y, plat.width, 16);
          // Highlight Grass Tuft Edge
          ctx.fillStyle = '#4ADE80';
          ctx.fillRect(plat.x, plat.y, plat.width, 4);
          for (let gx = plat.x; gx < plat.x + plat.width; gx += 10) {
            ctx.fillStyle = '#86EFAC';
            ctx.fillRect(gx, plat.y - 3, 3, 4);
            ctx.fillStyle = '#22C55E';
            ctx.fillRect(gx + 3, plat.y - 2, 2, 3);
          }

          // Rich Stratified Soil & Cliff Rock Face
          ctx.fillStyle = '#78350F';
          ctx.fillRect(plat.x, plat.y + 16, plat.width, plat.height - 16);
          ctx.fillStyle = '#92400E';
          for (let ry = plat.y + 24; ry < plat.y + plat.height; ry += 18) {
            ctx.fillRect(plat.x, ry, plat.width, 4);
          }
          // Earth roots dangling into water
          ctx.fillStyle = '#451A03';
          for (let rx = plat.x + 8; rx < plat.x + plat.width; rx += 28) {
            ctx.fillRect(rx, plat.y + 16, 2, 8);
          }
        } else if (this.level.id === 2) {
          // Asphalt road with white dash lane markings matching reference photo
          ctx.fillStyle = '#334155';
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          // Concrete curb edge
          ctx.fillStyle = '#94A3B8';
          ctx.fillRect(plat.x, plat.y, plat.width, 6);
          // White dashed lane markings
          ctx.fillStyle = '#F8FAFC';
          for (let rx = plat.x + 20; rx < plat.x + plat.width; rx += 80) {
            ctx.fillRect(rx, plat.y + 36, 40, 6);
          }
        } else if (this.level.id === 3) {
          // Courtyard ancient flagstone tiles
          ctx.fillStyle = '#475569';
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          ctx.fillStyle = '#64748B';
          ctx.fillRect(plat.x, plat.y, plat.width, 6);
        } else {
          // Level 4: Saigon Highway Bridge Asphalt with white markings & hazard barriers
          ctx.fillStyle = '#1E293B';
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          // Concrete curb top
          ctx.fillStyle = '#475569';
          ctx.fillRect(plat.x, plat.y, plat.width, 5);
          // White dashed lane divider markings
          ctx.fillStyle = '#F8FAFC';
          for (let rx = plat.x + 20; rx < plat.x + plat.width; rx += 80) {
            ctx.fillRect(rx, plat.y + 24, 38, 4);
          }
          // Red-white reflective concrete guardrail along the bottom
          for (let rx = plat.x; rx < plat.x + plat.width; rx += 36) {
            ctx.fillStyle = '#DC2626';
            ctx.fillRect(rx, plat.y + plat.height - 14, 18, 14);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(rx + 18, plat.y + plat.height - 14, 18, 14);
          }
        }
      } else if (plat.type === 'bridge_wood') {
        if (this.level.id === 1) {
          // Bamboo bridge walkway slats
          ctx.fillStyle = '#CA8A04';
          ctx.fillRect(plat.x, plat.y, plat.width, 14);
          ctx.fillStyle = '#EAB308';
          for (let bx = plat.x; bx < plat.x + plat.width; bx += 8) {
            ctx.fillRect(bx, plat.y, 6, 14);
            ctx.fillStyle = '#78350F';
            ctx.fillRect(bx + 6, plat.y, 2, 14);
            ctx.fillStyle = '#EAB308';
          }
        } else if (this.level.id === 4) {
          // Level 4: Steel highway overhead gantry / elevated bridge beam
          ctx.fillStyle = '#334155';
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          ctx.fillStyle = '#FACC15';
          ctx.fillRect(plat.x, plat.y, plat.width, 4);
          // Yellow-black caution stripes
          for (let sx = plat.x; sx < plat.x + plat.width; sx += 20) {
            ctx.fillStyle = '#0F172A';
            ctx.fillRect(sx, plat.y, 10, 4);
          }
        } else {
          ctx.fillStyle = '#B45309';
          ctx.fillRect(plat.x, plat.y, plat.width, 16);
          ctx.fillStyle = '#78350F';
          ctx.fillRect(plat.x, plat.y + 16, plat.width, plat.height - 16);
        }
      } else if (plat.type === 'hyacinth_raft') {
        // Floating water hyacinth raft (Đám bèo tây / hoa súng)
        ctx.fillStyle = '#14532D';
        ctx.beginPath();
        ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 10);
        ctx.fill();

        ctx.fillStyle = '#166534';
        for (let bx = plat.x + 8; bx < plat.x + plat.width - 8; bx += 14) {
          ctx.beginPath();
          ctx.ellipse(bx, plat.y + 8, 8, 5, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Blooming Water Lily Blossoms
        ctx.fillStyle = '#C084FC';
        ctx.beginPath();
        ctx.arc(plat.x + 18, plat.y + 6, 6, 0, Math.PI * 2);
        ctx.arc(plat.x + plat.width / 2, plat.y + 5, 7, 0, Math.PI * 2);
        ctx.arc(plat.x + plat.width - 18, plat.y + 6, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (plat.type === 'bamboo_pole') {
        ctx.fillStyle = '#EAB308';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.fillStyle = '#CA8A04';
        for (let by = plat.y + 15; by < plat.y + plat.height; by += 25) {
          ctx.fillRect(plat.x, by, plat.width, 4);
        }
      } else if (plat.type === 'barricade') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.fillStyle = '#DC2626';
        for (let s = 0; s < plat.height; s += 20) {
          ctx.fillRect(plat.x, plat.y + s, plat.width, 10);
        }
      } else if (plat.type === 'dinh_roof') {
        // Traditional Red Curved Tile Roof
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.fillStyle = '#FBBF24';
        ctx.fillRect(plat.x - 6, plat.y - 4, plat.width + 12, 6);
      } else {
        // 'brick' / scaffolding / stilt steps
        if (this.level.id === 1) {
          ctx.fillStyle = '#15803D';
          ctx.fillRect(plat.x, plat.y, plat.width, 6);
          ctx.fillStyle = '#78350F';
          ctx.fillRect(plat.x, plat.y + 6, plat.width, plat.height - 6);
        } else if (this.level.id === 2) {
          // Steel Scaffolding platforms
          ctx.fillStyle = '#64748B';
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          ctx.fillStyle = '#94A3B8';
          ctx.fillRect(plat.x, plat.y, plat.width, 4);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
        } else {
          ctx.fillStyle = '#B45309';
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        }
      }
    }
  }

  private drawGoalPoint(ctx: CanvasRenderingContext2D) {
    const g = this.level.goalPoint;

    if (this.level.id === 1) {
      if (this.level1Area === 'tam_phuoc_school') return;

      ctx.save();
      const isUnlocked = this.hasBridgeKey;

      // Wooden support pillars
      ctx.fillStyle = isUnlocked ? '#065F46' : '#78350F';
      ctx.fillRect(g.x + 8, g.y, 14, g.height);
      ctx.fillRect(g.x + g.width - 22, g.y, 14, g.height);

      // Thatched eaved roof on top of gate
      ctx.fillStyle = isUnlocked ? '#047857' : '#B45309';
      ctx.beginPath();
      ctx.moveTo(g.x - 8, g.y + 12);
      ctx.lineTo(g.x + g.width / 2, g.y - 14);
      ctx.lineTo(g.x + g.width + 8, g.y + 12);
      ctx.closePath();
      ctx.fill();

      // Lacquered signboard
      ctx.fillStyle = isUnlocked ? '#059669' : '#DC2626';
      ctx.fillRect(g.x - 12, g.y + 18, g.width + 24, 34);
      ctx.strokeStyle = isUnlocked ? '#34D399' : '#FACC15';
      ctx.lineWidth = 2;
      ctx.strokeRect(g.x - 12, g.y + 18, g.width + 24, 34);

      ctx.fillStyle = '#FEF08A';
      ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isUnlocked ? '🔓 CỔNG ĐÃ MỞ: MÀN 2' : '🔒 CỔNG KHÓA: CẦN CHÌA KHÓA', g.x + g.width / 2, g.y + 38);

      if (!isUnlocked) {
        // Locked iron bars across the gateway
        ctx.fillStyle = '#475569';
        for (let bx = g.x + 24; bx < g.x + g.width - 24; bx += 12) {
          ctx.fillRect(bx, g.y + 55, 4, g.height - 60);
        }

        // Heavy padlock
        const padX = g.x + g.width / 2;
        const padY = g.y + g.height / 2 + 10;
        ctx.fillStyle = '#EAB308';
        ctx.beginPath();
        ctx.arc(padX, padY - 8, 10, Math.PI, 0);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#94A3B8';
        ctx.stroke();

        ctx.fillStyle = '#CA8A04';
        ctx.fillRect(padX - 12, padY - 6, 24, 20);
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(padX, padY + 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Callout prompt below gate
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.beginPath();
        ctx.roundRect(g.x - 30, g.y + g.height + 6, g.width + 60, 20, 5);
        ctx.fill();
        ctx.fillStyle = '#F87171';
        ctx.font = 'bold 9px system-ui, sans-serif';
        ctx.fillText('Nói chuyện với Thoại ở giữa sông!', g.x + g.width / 2, g.y + g.height + 19);
      } else {
        // Glowing portal arch
        const pGrad = ctx.createLinearGradient(0, g.y + 50, 0, g.y + g.height);
        pGrad.addColorStop(0, 'rgba(52, 211, 153, 0.7)');
        pGrad.addColorStop(1, 'rgba(5, 150, 105, 0.3)');
        ctx.fillStyle = pGrad;
        ctx.fillRect(g.x + 22, g.y + 52, g.width - 44, g.height - 52);

        // Pulsating green arrow
        const arrowY = g.y + 85 + Math.sin(this.riverTimer * 5) * 6;
        ctx.fillStyle = '#34D399';
        ctx.beginPath();
        ctx.moveTo(g.x + g.width / 2, arrowY + 14);
        ctx.lineTo(g.x + g.width / 2 - 14, arrowY - 8);
        ctx.lineTo(g.x + g.width / 2 + 14, arrowY - 8);
        ctx.fill();
      }

      ctx.restore();
    } else {
      const isOpen = this.boss && this.boss.state === 'defeated';
      ctx.fillStyle = isOpen ? '#059669' : '#991B1B';
      ctx.fillRect(g.x, g.y, g.width, g.height);

      ctx.fillStyle = '#FDE047';
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isOpen ? 'CỔNG MỞ' : 'KHÓA CHẶT', g.x + g.width / 2, g.y + 30);
      ctx.fillText(isOpen ? 'CỨU TRÚC!' : 'CẦN CHÌA KHÓA', g.x + g.width / 2, g.y + 50);
    }
  }

  private drawCollectibles(ctx: CanvasRenderingContext2D) {
    for (const c of this.collectibles) {
      if (c.collected) continue;

      if (c.type === 'heart_heal') {
        Level2Scenery.drawHeart(ctx, c, this.riverTimer);
        continue;
      }

      if (this.level.id === 1) {
        if (c.type === 'lotus_coin') {
          Level1Scenery.drawGoldCoin(ctx, c, this.riverTimer);
        } else {
          Level1Scenery.drawPomelo(ctx, c, this.riverTimer);
        }
      } else {
        const bobY = c.y + Math.sin(c.bobOffset + this.riverTimer * 3.5) * 4;
        if (c.type === 'lotus_coin') {
          ctx.save();
          ctx.translate(c.x + c.width / 2, bobY + c.height / 2);
          ctx.fillStyle = '#F59E0B';
          ctx.beginPath();
          ctx.arc(0, 0, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FDE047';
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#D97706';
          ctx.fillRect(-2, -4, 4, 8);
          ctx.restore();
        } else {
          Level1Scenery.drawPomelo(ctx, c, this.riverTimer);
        }
      }
    }
  }

  private drawEnemies(ctx: CanvasRenderingContext2D) {
    for (const otter of this.enemies) {
      drawOtter(ctx, {
        x: otter.x,
        y: otter.y,
        width: otter.width,
        height: otter.height,
        facing: otter.facing,
        state: otter.state,
        squishTimer: otter.squishTimer,
        animTimer: otter.animTimer,
        isJumper: otter.isJumper,
      });
    }
  }

  private drawBoss(ctx: CanvasRenderingContext2D) {
    const b = this.boss;
    if (!b) return;

    if (b.bossType === 'baholong') {
      drawBaHoLongBoss(ctx, { boss: b, timer: this.riverTimer });
    } else if (b.bossType === 'y') {
      drawBossY(ctx, {
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        facing: b.facing,
        state: b.state,
        animTimer: b.animTimer,
        invulnerableTimer: b.invulnerableTimer,
        isEnraged: b.isEnraged,
        hp: b.health,
        maxHp: b.maxHealth,
      });
    } else {
      drawCsgtBoss(ctx, { boss: b, timer: this.riverTimer });
    }
  }

  private drawProjectiles(ctx: CanvasRenderingContext2D) {
    // 1. Phước's Projectiles (BECAUSE Shouts, 3 Hộp Son Tối Thượng, Phản đòn)
    for (const proj of this.projectiles) {
      ctx.save();
      ctx.translate(proj.x, proj.y);
      ctx.rotate(proj.rotation);
      ctx.scale(proj.scale, proj.scale);

      if (proj.projType === 'lipstick') {
        // Chiêu Tối Thượng: 3 Hộp Son (Sát thương 10 mỗi hộp)
        const spin = (2.0 - proj.life) * 8;
        ctx.rotate(spin);

        // Holographic aura
        ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
        ctx.beginPath();
        ctx.arc(6, 0, 22, 0, Math.PI * 2);
        ctx.fill();

        // 1. Gold Base Tube
        ctx.fillStyle = '#B45309';
        ctx.fillRect(-15, -7, 16, 14);
        ctx.fillStyle = '#FDE047';
        ctx.fillRect(-14, -6, 14, 12);
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(-10, -5, 4, 10);

        // 2. Gold Neck Ring
        ctx.fillStyle = '#EAB308';
        ctx.fillRect(1, -7.5, 4, 15);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(2, -6, 2, 3);

        // 3. Luxurious Ruby Red Lipstick Bullet with slanted tip
        ctx.fillStyle = '#BE123C';
        ctx.beginPath();
        ctx.moveTo(5, -6);
        ctx.lineTo(19, -6);
        ctx.lineTo(26, 0);
        ctx.lineTo(19, 6);
        ctx.lineTo(5, 6);
        ctx.closePath();
        ctx.fill();

        // Lipstick shiny highlight
        ctx.fillStyle = '#FB7185';
        ctx.beginPath();
        ctx.moveTo(7, -4);
        ctx.lineTo(17, -4);
        ctx.lineTo(22, 0);
        ctx.lineTo(7, -1);
        ctx.closePath();
        ctx.fill();

        // Floating label
        ctx.fillStyle = '#F43F5E';
        ctx.font = '900 10px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SON 500K 💄', 5, -12);

        ctx.restore();
        continue;
      }

      if (proj.projType === 'reflected') {
        // Reflected projectile
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.roundRect(-4, -12, 90, 26, 8);
        ctx.fill();
        ctx.fillStyle = '#0F172A';
        ctx.font = '900 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(proj.text, 40, 5);
        ctx.restore();
        continue;
      }

      ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(20, 8, 30 * (1 - proj.life / proj.maxLife), 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.roundRect(-4, -14, 100, 36, 12);
      ctx.fill();

      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.roundRect(-2, -12, 96, 32, 10);
      ctx.fill();

      ctx.fillStyle = '#92400E';
      ctx.font = '900 16px "Rowdies", "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(proj.text, 46, 10);

      ctx.restore();
    }

    // 2. Boss Attacks (Whistles, Bullets, Citations, Money Bags, Ground Shocks)
    for (const atk of this.bossAttacks) {
      ctx.save();
      ctx.translate(atk.x, atk.y);

      if (atk.type === 'dice_shot') {
        Level4Scenery.drawDice(ctx, atk);
      } else if (atk.type === 'dollar_bill') {
        Level4Scenery.drawDollarBill(ctx, atk);
      } else if (atk.type === 'money_stack') {
        Level4Scenery.drawMoneyStack(ctx, atk);
      } else if (atk.type === 'bullet_shot') {
        // High-speed glowing golden pistol bullet with speed lines & muzzle smoke
        const dir = atk.vx > 0 ? 1 : -1;

        // Tracer streak
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(10, 5);
        ctx.lineTo(10 - dir * 26, 5);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(10, 5);
        ctx.lineTo(10 - dir * 16, 5);
        ctx.stroke();

        // Golden Bullet Head
        ctx.fillStyle = '#FDE047';
        ctx.beginPath();
        ctx.ellipse(10, 5, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(8, 3.5, 4, 3);
      } else if (atk.type === 'money_bag') {
        if (atk.rotation !== undefined) ctx.rotate(atk.rotation);
        // Rich Landlord Money Sack
        ctx.fillStyle = '#D97706';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FDE047';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#78350F';
        ctx.font = '900 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('$', 0, 4);
      } else if (atk.type === 'whistle_wave') {
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(10, 10, 14, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
      } else if (atk.type === 'citation_paper') {
        if (atk.rotation !== undefined) ctx.rotate(atk.rotation);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-10, -14, 20, 28);
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-10, -14, 20, 28);
        ctx.fillStyle = '#DC2626';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText('PHẠT!', -8, 2);
      } else if (atk.type === 'slipper_throw' || atk.type === 'slipper_rain' || atk.type === 'slipper_shockwave') {
        if (atk.rotation !== undefined) ctx.rotate(atk.rotation);
        drawSingleSlipper(ctx, -atk.width / 2, -atk.height / 2, atk.width, atk.height, '#FDE047');
      } else if (atk.type === 'cane_shock' || atk.type === 'ground_shock') {
        ctx.fillStyle = atk.type === 'cane_shock' ? '#A855F7' : '#F59E0B';
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(12, 0);
        ctx.lineTo(24, 20);
        ctx.closePath();
        ctx.fill();
      } else if (atk.type === 'boba_cup') {
        drawBobaCup(ctx, atk);
      } else if (atk.type === 'boba_pearl') {
        drawBobaPearl(ctx, atk);
      } else if (atk.type === 'bill_50k') {
        drawBill50k(ctx, atk);
      }

      ctx.restore();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const part of this.particles) {
      ctx.save();
      ctx.globalAlpha = part.alpha;
      ctx.fillStyle = part.color;

      if (part.shape === 'star') {
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (part.shape === 'heart') {
        ctx.beginPath();
        ctx.moveTo(part.x, part.y + 4);
        ctx.bezierCurveTo(part.x - 5, part.y, part.x - 5, part.y - 4, part.x - 2, part.y - 4);
        ctx.bezierCurveTo(part.x, part.y - 4, part.x, part.y - 2, part.x, part.y);
        ctx.bezierCurveTo(part.x, part.y - 2, part.x, part.y - 4, part.x + 2, part.y - 4);
        ctx.bezierCurveTo(part.x + 5, part.y - 4, part.x + 5, part.y, part.x, part.y + 4);
        ctx.fill();
      } else if (part.shape === 'letter' && part.char) {
        ctx.font = '900 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 3;
        ctx.fillText(part.char, part.x, part.y);
        ctx.shadowBlur = 0;
      } else if (part.shape === 'splash') {
        ctx.beginPath();
        ctx.ellipse(part.x, part.y, part.size, part.size * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawPlayerDialogueBubble(ctx: CanvasRenderingContext2D) {
    const p = this.player;
    if (p.dialogueBubble && p.dialogueBubble.timer > 0) {
      const text = p.dialogueBubble.text;
      ctx.save();
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      const textW = ctx.measureText(text).width;
      const bubbleW = Math.max(90, textW + 20);
      const bubbleH = 26;
      const cx = p.x + p.width / 2;
      const bubbleX = cx - bubbleW / 2;
      const bubbleY = p.y - 38;

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, [8]);
      ctx.fill();

      ctx.strokeStyle = '#047857';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Pointer tail
      ctx.beginPath();
      ctx.moveTo(cx - 5, bubbleY + bubbleH);
      ctx.lineTo(cx, bubbleY + bubbleH + 6);
      ctx.lineTo(cx + 5, bubbleY + bubbleH);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      ctx.fillStyle = '#065F46';
      ctx.textAlign = 'center';
      ctx.fillText(text, cx, bubbleY + 17);
      ctx.restore();
    }
  }
}
