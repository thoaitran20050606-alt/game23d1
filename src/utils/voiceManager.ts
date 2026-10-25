/**
 * Voice Manager for Phước's "BECAUSE!" (Bì câu!) Shout
 * Manages original voice audio clip and supports user custom audio upload/persistence in localStorage.
 */

import defaultVoiceUrl from '../assets/audio/bì cau.m4a';

const VOICE_STORAGE_KEY = 'phuoc_custom_because_voice';

type Listener = (voiceUrl: string) => void;
const listeners = new Set<Listener>();

let cachedAudioBuffer: AudioBuffer | null = null;
let cachedAudioCtx: AudioContext | null = null;

export function getBecauseVoice(): string {
  try {
    const saved = localStorage.getItem(VOICE_STORAGE_KEY);
    if (saved && (saved.startsWith('data:audio') || saved.startsWith('blob:'))) {
      return saved;
    }
  } catch {
    // ignore
  }
  return defaultVoiceUrl;
}

export function setBecauseVoice(dataUrl: string) {
  try {
    localStorage.setItem(VOICE_STORAGE_KEY, dataUrl);
  } catch {
    // ignore
  }
  cachedAudioBuffer = null; // Invalidate cache
  listeners.forEach((fn) => fn(dataUrl));
}

export function resetBecauseVoice() {
  try {
    localStorage.removeItem(VOICE_STORAGE_KEY);
  } catch {
    // ignore
  }
  cachedAudioBuffer = null;
  listeners.forEach((fn) => fn(defaultVoiceUrl));
}

export function subscribeBecauseVoice(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Preloads and caches the AudioBuffer in Web Audio API for 0ms latency instantaneous playback!
 */
export async function getPreloadedVoiceBuffer(ctx: AudioContext): Promise<AudioBuffer | null> {
  if (cachedAudioBuffer && cachedAudioCtx === ctx) {
    return cachedAudioBuffer;
  }
  try {
    cachedAudioCtx = ctx;
    const url = getBecauseVoice();
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    cachedAudioBuffer = await ctx.decodeAudioData(arrayBuffer);
    return cachedAudioBuffer;
  } catch (err) {
    console.warn('Failed to decode because voice buffer:', err);
    return null;
  }
}
