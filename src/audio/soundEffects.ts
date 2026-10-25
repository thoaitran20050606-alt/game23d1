/**
 * Procedural Web Audio API Sound Synthesizer
 * Zero external audio latency, reliable on all browsers, fully toggleable.
 */

import { getBecauseVoice, getPreloadedVoiceBuffer } from '../utils/voiceManager';
import { getBossCustomBgm } from '../data/bossMusicConfig';
import { resolveAudioUrl } from './dialoguePlayer';

/**
 * ============================================================================
 * CẤU HÌNH ÂM THANH CHIÊU TỐI THƯỢNG (BOSS) & KỸ NĂNG NHÂN VẬT CHÍNH
 * ============================================================================
 * 
 * BẠN CÓ THỂ DỄ DÀNG THÊM FILE ÂM THANH THEO CÁC CÁCH SAU:
 * 
 * 💡 CÁCH 1 (Khuyên dùng - Thả file vào thư mục):
 *    Thả file (.mp3, .wav, .m4a, .ogg) vào `src/assets/audio/` hoặc `public/assets/audio/`
 *    Sau đó chỉ cần điền tên file hoặc đường dẫn vào trường tương ứng bên dưới:
 *       phuocUltimateLipstick: 'nem_son.mp3',
 *       hoặc phuocUltimateLipstick: '/assets/audio/nem_son.mp3',
 * 
 * 💡 CÁCH 2 (Import trực tiếp ở đầu file):
 *    import amThanhNemSon from '../assets/audio/ten_file.mp3';
 *    Sau đó gán:
 *       phuocUltimateLipstick: amThanhNemSon,
 * 
 * 💡 CÁCH 3 (Link âm thanh Online):
 *    phuocUltimateLipstick: 'https://example.com/sound.mp3',
 * 
 * ----------------------------------------------------------------------------
 * GHI CHÚ:
 * - Để trống `''` theo mặc định: Game sẽ tự động phát âm thanh giả lập 8-bit Synth
 *   và không gây ra bất kỳ lỗi nào!
 * ============================================================================
 */
export const SKILL_AUDIO_CONFIG = {
  // 1. Phước - Chiêu tối thượng: Ném 3 Hộp Son 500k (Phím E)
  phuocUltimateLipstick: '',

  // 2. Phước - Đỡ đòn & Phản đòn thành công (Parry khiên chặn đứng đòn đánh)
  phuocParrySuccess: '',

  // 3. Boss Bá Hộ Long (Màn 4) - Chiêu tối thượng: Bão Đô La & Bão Xúc Xắc Cuồng Nộ
  bossBaHoLongUltimate: '',

  // 4. Boss CSGT (Màn 2) - Chiêu tối thượng: Bão Đạn Súng Lục Bắn Cảnh Cáo Tổng Lực
  bossCsgtUltimate: '',

  // 5. Boss Trường (Màn 1) - Chiêu tối thượng: Mưa Dép Bát Nhã từ nóc trường
  bossTruongUltimate: '',

  // 6. Boss Ý (Màn 3) - Chiêu tối thượng: Bão Trà Sữa, Trân Châu & Mưa Tiền 50K
  bossYUltimate: '',
};

class SoundController {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  private bgmInterval: number | null = null;
  private currentBgmLevel: number = 0;
  private customBgmAudio: HTMLAudioElement | null = null;
  private currentBossMusicKey: string | null = null;

  constructor() {
    // Try to load mute preference from localStorage
    try {
      const saved = localStorage.getItem('phuoc_game_muted');
      if (saved !== null) {
        this.isMuted = saved === 'true';
      }
    } catch {
      // ignore
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('phuoc_game_muted', String(this.isMuted));
    } catch {
      // ignore
    }

    if (this.customBgmAudio) {
      this.customBgmAudio.muted = this.isMuted;
    }

    if (this.isMuted) {
      this.stopBgm(false);
    } else {
      if (this.currentBossMusicKey) {
        this.startBossMusic(this.currentBossMusicKey);
      } else if (this.currentBgmLevel > 0) {
        this.startBgm(this.currentBgmLevel);
      }
    }
    return this.isMuted;
  }

  public playJump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.14);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.17);
  }

  public playStomp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Squishy cartoon bounce
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.linearRampToValueAtTime(150, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.2);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playCoin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    osc2.frequency.setValueAtTime(1975.53, now + 0.08); // B6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.08);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  public playHeal() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.18, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.16);
    });
  }

  /**
   * Authentic Voice Shout for "BECAUSE!" (Bì câu!)
   * Plays the original voice clip with 100% sound fidelity, plus subtle energetic impact.
   */
  public async playBecauseAttack() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // 1. Play authentic voice ("Bì câu!") with original sound preservation
    try {
      const buffer = await getPreloadedVoiceBuffer(this.ctx);
      if (buffer && this.ctx) {
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.95, this.ctx.currentTime);
        source.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        source.start(0);
      } else {
        const audio = new Audio(getBecauseVoice());
        audio.volume = 0.95;
        audio.play().catch(() => {});
      }
    } catch {
      const audio = new Audio(getBecauseVoice());
      audio.volume = 0.95;
      audio.play().catch(() => {});
    }

    // 2. Add punchy dramatic backing impact
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public async playBecauseVoicePreview() {
    this.initCtx();
    if (!this.ctx) return;
    try {
      const buffer = await getPreloadedVoiceBuffer(this.ctx);
      if (buffer && this.ctx) {
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(0);
        return;
      }
    } catch {
      // fallback
    }
    const audio = new Audio(getBecauseVoice());
    audio.volume = 1.0;
    audio.play().catch(() => {});
  }

  public playBossHurt() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.12);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playBossWhistle() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    // Whistle trill between 2100 and 2600Hz
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.setValueAtTime(2100, now + 0.05);
    osc.frequency.setValueAtTime(2500, now + 0.1);
    osc.frequency.setValueAtTime(2200, now + 0.15);
    osc.frequency.setValueAtTime(2600, now + 0.2);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playPlayerHurt() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.18);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playVictory() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [
      { f: 523.25, d: 0.15, offset: 0 },
      { f: 659.25, d: 0.15, offset: 0.15 },
      { f: 783.99, d: 0.15, offset: 0.3 },
      { f: 1046.50, d: 0.45, offset: 0.45 },
    ];

    notes.forEach((n) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.offset);
      gain.gain.setValueAtTime(0.25, now + n.offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.offset + n.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + n.offset);
      osc.stop(now + n.offset + n.d);
    });
  }

  public playGunshot() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.16);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playHeartHeal() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6 uplifting harp chime
    notes.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.05);
      gain.gain.setValueAtTime(0.25, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.22);
    });
  }

  private lastDiceSoundTime: number = 0;

  public playDiceThrow() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Throttle so rapid dice bursts don't create harsh loud noise
    if (now - this.lastDiceSoundTime < 0.16) return;
    this.lastDiceSoundTime = now;

    // Extremely soft, gentle, quiet wooden dice tap (low gain 0.025, rounded sine)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.035);

    gain.gain.setValueAtTime(0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playMoneyThrow() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Pleasant rustling cash flutter / dollar bills whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playKiss() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Sweet popping kiss sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playCooldownClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(280, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playSlipperThrow() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Whizzing whistling cartoon projectile whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playSlipperSlap() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Thwack / slap sound of rubber slipper landing
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playKeyGet() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Bright celebratory fanfare: E5 G#5 B5 E6
    const notes = [659.25, 830.61, 987.77, 1318.51];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.28, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.3);
    });
  }

  public playDoorWarp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Magical chime warp transition
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playGameOver() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 392, 349.23, 293.66];
    notes.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now + idx * 0.2);
      gain.gain.setValueAtTime(0.2, now + idx * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.2 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.2);
      osc.stop(now + idx * 0.2 + 0.26);
    });
  }

  private isBossEnragedState: boolean = false;

  public setBossEnraged(enraged: boolean) {
    this.isBossEnragedState = enraged;
    if (this.currentBgmLevel === 4) {
      if (!this.isMuted) {
        if (enraged) {
          this.startBossMusic('baholong_enraged');
        } else {
          this.startBossMusic('baholong');
        }
      }
    } else if (this.currentBgmLevel === 2) {
      if (!this.isMuted) {
        this.startBossMusic('csgt');
      }
    }
  }

  /**
   * Phát nhạc đánh Boss hoặc Mini-Boss:
   * 1. Kiểm tra xem người dùng có cấu hình file nhạc trong `src/data/bossMusicConfig.ts` hay không.
   * 2. Nếu có, phát file âm thanh đó (loop, tự động điều chỉnh âm lượng).
   * 3. Nếu không, tự động phát nhạc Boss Synth 8-bit hào hùng mặc định.
   */
  public startBossMusic(bossKey: string) {
    this.currentBossMusicKey = bossKey;
    if (bossKey === 'baholong' || bossKey === 'baholong_enraged') {
      this.currentBgmLevel = 4;
    } else if (bossKey === 'csgt') {
      this.currentBgmLevel = 2;
    } else if (bossKey === 'y') {
      this.currentBgmLevel = 3;
    } else if (bossKey === 'truong') {
      this.currentBgmLevel = 1;
    }

    if (this.isMuted) return;

    // Dừng nhạc nền cũ
    this.stopCustomBgm();
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }

    // 1. Kiểm tra file nhạc tùy chỉnh trong cấu hình bossMusicConfig.ts
    let customPath = getBossCustomBgm(bossKey);
    // Nếu phase 2 cuồng nộ chưa có file riêng thì tự động kế thừa nhạc của phase 1
    if (!customPath && bossKey === 'baholong_enraged') {
      customPath = getBossCustomBgm('baholong');
    }

    const resolvedUrl = customPath ? resolveAudioUrl(customPath) : undefined;

    if (resolvedUrl) {
      try {
        const audio = new Audio(resolvedUrl);
        audio.loop = true;
        audio.volume = 0.65;
        audio.muted = this.isMuted;
        audio.onerror = () => {
          // File tải lỗi (ví dụ chưa copy file vào hoặc link lỗi) -> Tự động phát Synth BGM
          const isEnraged = bossKey === 'baholong_enraged' || this.isBossEnragedState;
          this.startBossBgm(isEnraged);
        };
        audio.play().catch(() => {
          // Autoplay fallback: phát synth nếu trình duyệt chặn phát nhạc tự động
          const isEnraged = bossKey === 'baholong_enraged' || this.isBossEnragedState;
          this.startBossBgm(isEnraged);
        });
        this.customBgmAudio = audio;
        return;
      } catch {
        // Fallback to synth below
      }
    }

    // 2. Không có file tùy chỉnh -> Phát Synth BGM mặc định
    const isEnraged = bossKey === 'baholong_enraged' || this.isBossEnragedState;
    this.startBossBgm(isEnraged);
  }

  private stopCustomBgm() {
    if (this.customBgmAudio) {
      try {
        this.customBgmAudio.pause();
        this.customBgmAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.customBgmAudio = null;
    }
  }

  /**
   * Dramatic Boss Fight BGM (Procedural Web Audio Retro Synth)
   * Tuned with moderate, comfortable volume (gain ~0.035 - 0.048) so it is dramatic
   * without being loud, harsh, or drowning out game sound effects.
   */
  public startBossBgm(isEnraged: boolean = false) {
    this.isBossEnragedState = isEnraged;
    if (this.isMuted) return;
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.initCtx();
    if (!this.ctx) return;

    // Dramatic minor chord progression: Dm -> Bb -> Gm -> A (tense boss showdown)
    const bassline = isEnraged
      ? [146.83, 174.61, 146.83, 220.00, 116.54, 146.83, 116.54, 174.61, 98.00, 116.54, 146.83, 196.00, 110.00, 146.83, 220.00, 246.94]
      : [146.83, 146.83, 174.61, 146.83, 116.54, 116.54, 146.83, 116.54, 98.00, 98.00, 116.54, 146.83, 110.00, 110.00, 146.83, 220.00];

    const leadMotif = isEnraged
      ? [587.33, 659.25, 698.46, 880.00, 783.99, 698.46, 659.25, 587.33]
      : [293.66, 349.23, 440.00, 523.25, 466.16, 392.00, 440.00, 349.23];

    let step = 0;
    // Enraged tempo: 150ms per step, Regular boss tempo: 195ms per step
    const intervalMs = isEnraged ? 150 : 195;

    this.bgmInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Driving Synth Bass (Soft triangle wave with subtle cut)
      const bassFreq = bassline[step % bassline.length];
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(bassFreq, now);

      // Low volume (0.04 max) for gentle dramatic presence
      const bVol = isEnraged ? 0.048 : 0.038;
      bassGain.gain.setValueAtTime(bVol, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + (intervalMs / 1000) * 0.95);

      bassOsc.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + (intervalMs / 1000));

      // 2. Lead Dramatic Tension Melody (every 2 steps)
      if (step % 2 === 0) {
        const leadIdx = Math.floor(step / 2) % leadMotif.length;
        const leadFreq = leadMotif[leadIdx];
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = isEnraged ? 'sawtooth' : 'sine';
        leadOsc.frequency.setValueAtTime(leadFreq, now);

        // Very soft lead level (0.025 regular, 0.032 enraged)
        const lVol = isEnraged ? 0.032 : 0.024;
        leadGain.gain.setValueAtTime(lVol, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + (intervalMs / 1000) * 1.6);

        leadOsc.connect(leadGain);
        leadGain.connect(this.ctx.destination);
        leadOsc.start(now);
        leadOsc.stop(now + (intervalMs / 1000) * 1.7);
      }

      // 3. Subtle Tension Pulse Kick/Hi-Hat
      if (step % 4 === 0) {
        // Soft low punch
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(110, now);
        kickOsc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
        kickGain.gain.setValueAtTime(0.035, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        kickOsc.connect(kickGain);
        kickGain.connect(this.ctx.destination);
        kickOsc.start(now);
        kickOsc.stop(now + 0.09);
      }

      step++;
    }, intervalMs);
  }

  public startBgm(level: number) {
    this.currentBgmLevel = level;
    if (this.isMuted) return;

    if (level === 2) {
      // Level 2 Mini-Boss CSGT
      this.startBossMusic('csgt');
      return;
    }
    if (level === 3) {
      // Level 3 Boss Ý (Trà Sữa & 50K)
      this.startBossMusic('y');
      return;
    }
    if (level === 4) {
      // Level 4 Final Boss Bá Hộ Long
      this.startBossMusic(this.isBossEnragedState ? 'baholong_enraged' : 'baholong');
      return;
    }

    // Peaceful Level 1 & 3 BGM
    this.currentBossMusicKey = null;
    this.stopCustomBgm();
    this.stopBgm(false);
    this.initCtx();
    if (!this.ctx) return;

    // Gentle pentatonic Vietnamese countryside arpeggio (C D E G A)
    const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
    let step = 0;

    this.bgmInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      const now = this.ctx.currentTime;

      // Melodic calm breeze
      const noteIdx = (step % 8 === 0 || step % 8 === 4) ? (step % pentatonic.length) : (step * 2) % pentatonic.length;
      const freq = pentatonic[noteIdx];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
      step++;
    }, 420);
  }

  public stopBgm(clearKey: boolean = true) {
    if (clearKey) {
      this.currentBossMusicKey = null;
    }
    this.stopCustomBgm();
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  public pauseBgm() {
    if (this.customBgmAudio) {
      try {
        this.customBgmAudio.pause();
      } catch {
        // ignore
      }
    }
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  public resumeBgm() {
    if (this.isMuted) return;
    if (this.customBgmAudio) {
      this.customBgmAudio.play().catch(() => {});
      return;
    }
    if (this.currentBossMusicKey) {
      this.startBossMusic(this.currentBossMusicKey);
    } else if (this.currentBgmLevel > 0) {
      this.startBgm(this.currentBgmLevel);
    }
  }

  /**
   * Crisp, metallic shield clash & energy deflection for Perfect Parry
   */
  public playParry() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // High-pitched crystal ping
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1400, now);
    osc1.frequency.exponentialRampToValueAtTime(800, now + 0.18);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Deep resonant metallic bell chime
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(580, now);
    osc2.frequency.linearRampToValueAtTime(920, now + 0.08);
    gain2.gain.setValueAtTime(0.35, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.28);
  }

  /**
   * Punch / melee basic attack whoosh & impact
   */
  public playPunch() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Sparkling power blast when launching 3 Lipstick boxes
   */
  public playUltimateLipstick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Magical chime ascending glissando
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const noteTime = now + idx * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);
      gain.gain.setValueAtTime(0.28, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.22);
    });
  }

  /**
   * Pop / critical hit when lipstick strikes target
   */
  public playLipstickHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
    gain.gain.setValueAtTime(0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * Helper phát file âm thanh tùy chỉnh cho kỹ năng:
   * - Nếu cấu hình có đường dẫn hợp lệ: phát file âm thanh đó.
   * - Nếu để trống ('') hoặc file lỗi: tự động chạy âm thanh Procedural Synth dự phòng.
   */
  public playCustomAudio(
    audioSrc: string | undefined,
    fallbackSynth?: () => void,
    volume: number = 0.85
  ) {
    if (this.isMuted) return;

    const resolved = resolveAudioUrl(audioSrc);
    if (resolved) {
      try {
        const audio = new Audio(resolved);
        audio.volume = Math.max(0, Math.min(1, volume));
        audio.play().catch(() => {
          if (fallbackSynth) fallbackSynth();
        });
        return;
      } catch {
        if (fallbackSynth) fallbackSynth();
        return;
      }
    }

    if (fallbackSynth) {
      fallbackSynth();
    }
  }

  /**
   * 1. Phát âm thanh khi Phước tung Chiêu Tối Thượng: Ném 3 Hộp Son 500k
   */
  public playPhuocLipstickSkill() {
    this.playCustomAudio(SKILL_AUDIO_CONFIG.phuocUltimateLipstick, () => {
      this.playUltimateLipstick();
    });
  }

  /**
   * 2. Phát âm thanh khi Phước Đỡ đòn & Phản đòn thành công (Parry Success)
   */
  public playParrySuccessSkill() {
    this.playCustomAudio(SKILL_AUDIO_CONFIG.phuocParrySuccess, () => {
      this.playParry();
    });
  }

  /**
   * 3. Phát âm thanh Chiêu Tối Thượng của Boss Bá Hộ Long (Màn 4): Bão Đô La & Bão Xúc Xắc Cuồng Nộ
   */
  public playBaHoLongUltimateSkill() {
    this.playCustomAudio(SKILL_AUDIO_CONFIG.bossBaHoLongUltimate, () => {
      this.playMoneyThrow();
    });
  }

  /**
   * 4. Phát âm thanh Chiêu Tối Thượng của Boss CSGT (Màn 2): Bão Đạn Súng Cảnh Cáo Tổng Lực
   */
  public playCsgtUltimateSkill() {
    this.playCustomAudio(SKILL_AUDIO_CONFIG.bossCsgtUltimate, () => {
      this.playGunshot();
    });
  }

  /**
   * 5. Phát âm thanh Chiêu Tối Thượng của Boss Trường (Màn 1): Mưa Dép Bát Nhã
   */
  public playTruongUltimateSkill() {
    this.playCustomAudio(SKILL_AUDIO_CONFIG.bossTruongUltimate, () => {
      this.playSlipperThrow();
    });
  }

  /**
   * 6. Phát âm thanh Chiêu Tối Thượng của Boss Ý (Màn 3): Bão Trà Sữa & Mưa Tiền 50K
   */
  public playBossYUltimateSkill() {
    this.playCustomAudio(SKILL_AUDIO_CONFIG.bossYUltimate, () => {
      this.playBobaSplash();
    });
  }

  public playBobaSplash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(460, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }
}

export const sounds = new SoundController();
