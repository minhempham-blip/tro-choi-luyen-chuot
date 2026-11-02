/**
 * Web Speech API helper for reading instructions and giving mascot encouragement in Vietnamese.
 */

class SpeechService {
  private enabled = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private viVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.initVoices();
      };
    }
  }

  private initVoices() {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    // Look for Vietnamese voice first (vi, vi-VN)
    this.viVoice = voices.find(v => v.lang.toLowerCase().includes('vi')) || null;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (!val) {
      this.stop();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public speak(_text: string, onEnd?: () => void) {
    // Voice speech is explicitly disabled in games
    onEnd?.();
  }
}

export const speechService = new SpeechService();
