/**
 * Dialogue Audio Player Service
 * Handles audio playback for all story cutscenes, in-game dialogue modals,
 * and NPC interactions.
 *
 * Supports inserting audio directly in code via the `audio` or `audioUrl` field.
 * Plays the custom audio file if provided; otherwise plays character-specific
 * procedural speech synthesizer blips.
 */

import { sounds } from './soundEffects';
import { StoryDialogueLine } from '../types/game';

// Auto-glob all audio files placed in src/assets/audio/ so paths like
// '/assets/audio/chaoem.mp3', 'chaoem.mp3', or direct imports resolve seamlessly in Vite!
const localAudioModules = import.meta.glob<{ default: string }>(
  '../assets/audio/**/*.{mp3,wav,ogg,m4a,aac}',
  { eager: true }
);

/**
 * Resolves an audio source string (e.g. '/assets/audio/chaoem.mp3', 'chaoem.mp3', or imported asset)
 * to a browser-loadable URL.
 */
export function resolveAudioUrl(source?: string): string | undefined {
  if (!source || typeof source !== 'string') return undefined;
  const trimmed = source.trim();
  if (!trimmed) return undefined;

  // Already a full URL, base64 data URI, or blob URL
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Extract base filename (e.g. "chaoem.mp3")
  const fileName = trimmed.split(/[/\\]/).pop()?.toLowerCase();

  // Search through all audio files found in src/assets/audio
  for (const [modulePath, mod] of Object.entries(localAudioModules)) {
    const assetUrl = (mod as { default?: string })?.default || (mod as unknown as string);
    if (!assetUrl) continue;

    const moduleFileName = modulePath.split(/[/\\]/).pop()?.toLowerCase();
    const cleanModulePath = modulePath.replace(/^[./\\]+/, '').toLowerCase();
    const cleanTrimmed = trimmed.replace(/^[./\\]+/, '').toLowerCase();

    // Match by exact filename or path endings
    if (
      (fileName && moduleFileName === fileName) ||
      cleanModulePath === cleanTrimmed ||
      modulePath === trimmed ||
      cleanModulePath.endsWith(cleanTrimmed) ||
      cleanTrimmed.endsWith(cleanModulePath)
    ) {
      return assetUrl;
    }
  }

  // Return the original path (e.g. for files served from /public/)
  return trimmed;
}

type AudioStateListener = (isPlaying: boolean, currentAudioSrc?: string) => void;

class DialogueAudioPlayer {
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioSrc: string | undefined = undefined;
  private isPlaying: boolean = false;
  private listeners: Set<AudioStateListener> = new Set();
  private synthCtx: AudioContext | null = null;

  constructor() {
    // Stop audio on page hide/unload
    if (typeof window !== 'undefined') {
      window.addEventListener('blur', () => this.stop());
    }
  }

  public subscribe(listener: AudioStateListener): () => void {
    this.listeners.add(listener);
    listener(this.isPlaying, this.currentAudioSrc);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.isPlaying, this.currentAudioSrc));
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.synthCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.synthCtx = new AudioContextClass();
      }
    }
    if (this.synthCtx && this.synthCtx.state === 'suspended') {
      this.synthCtx.resume().catch(() => {});
    }
    return this.synthCtx;
  }

  /**
   * Play procedural character dialogue speech blip when no custom audio file is inserted in code.
   */
  private playCharacterSynth(role: StoryDialogueLine['role'] = 'phuoc') {
    if (sounds.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    let baseFreq = 480;
    let type: OscillatorType = 'sine';
    let blipCount = 3;

    switch (role) {
      case 'phuoc':
        baseFreq = 440; // Warm, determined
        type = 'triangle';
        blipCount = 3;
        break;
      case 'truc':
        baseFreq = 680; // High, sweet, gentle
        type = 'sine';
        blipCount = 3;
        break;
      case 'baholong':
        baseFreq = 180; // Pompous, deep, comical
        type = 'sawtooth';
        blipCount = 4;
        break;
      case 'csgt':
        baseFreq = 320; // Firm, authoritative, radio chirp
        type = 'square';
        blipCount = 2;
        break;
      case 'thoai':
        baseFreq = 540; // Friendly, energetic
        type = 'sine';
        blipCount = 3;
        break;
      case 'truong':
        baseFreq = 190; // Boisterous bully
        type = 'sawtooth';
        blipCount = 3;
        break;
      case 'y':
        baseFreq = 620; // Feisty, expressive, tea lover
        type = 'triangle';
        blipCount = 3;
        break;
      case 'thuan':
        baseFreq = 390; // Bruised, weary, pleading
        type = 'sine';
        blipCount = 3;
        break;
    }

    const now = ctx.currentTime;
    for (let i = 0; i < blipCount; i++) {
      const startTime = now + i * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(baseFreq * (1 + (i % 2 === 0 ? 0.08 : -0.05)), startTime);
      osc.frequency.linearRampToValueAtTime(baseFreq * 1.15, startTime + 0.04);

      gain.gain.setValueAtTime(role === 'baholong' || role === 'truong' ? 0.06 : 0.09, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.048);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.05);
    }
  }

  /**
   * Plays dialogue audio for a given dialogue line.
   * If `line.audio` or `line.audioUrl` is present, it loads and plays that custom audio file.
   * If absent, it plays a pleasant character-specific speech synth blip.
   */
  public play(line?: Partial<StoryDialogueLine> | null): void {
    this.stop();

    if (!line) return;
    if (sounds.isMuted) return;

    const rawSource = line.audio || line.audioUrl;
    const audioSource = resolveAudioUrl(rawSource);

    if (audioSource && typeof audioSource === 'string' && audioSource.trim().length > 0) {
      try {
        const audio = new Audio(audioSource);
        audio.volume = 1.0;
        this.currentAudio = audio;
        this.currentAudioSrc = audioSource;
        this.isPlaying = true;
        this.notify();

        audio.onended = () => {
          this.isPlaying = false;
          this.currentAudio = null;
          this.currentAudioSrc = undefined;
          this.notify();
        };

        audio.onerror = (e) => {
          console.warn('Could not play custom dialogue audio:', { rawSource, resolvedSource: audioSource }, e);
          this.isPlaying = false;
          this.currentAudio = null;
          this.currentAudioSrc = undefined;
          this.notify();
          // Fallback to synth if custom file failed to load
          this.playCharacterSynth(line.role || 'phuoc');
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            // Autoplay restrictions or invalid source
            console.warn('Audio play error:', err);
            this.isPlaying = false;
            this.notify();
            this.playCharacterSynth(line.role || 'phuoc');
          });
        }
      } catch (err) {
        console.warn('Failed to initialize Audio element:', err);
        this.playCharacterSynth(line.role || 'phuoc');
      }
    } else {
      // No custom audio provided in code: use character sound blip
      this.playCharacterSynth(line.role || 'phuoc');
    }
  }

  /**
   * Stops any currently playing dialogue audio immediately.
   */
  public stop(): void {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.currentAudio = null;
    }
    this.currentAudioSrc = undefined;
    if (this.isPlaying) {
      this.isPlaying = false;
      this.notify();
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentAudioSrc(): string | undefined {
    return this.currentAudioSrc;
  }
}

export const dialoguePlayer = new DialogueAudioPlayer();
