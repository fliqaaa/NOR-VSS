/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioSynthManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMutedState() {
    return this.isMuted;
  }

  public playScan() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn('Audio synthesis not supported or blocked:', e);
    }
  }

  public playPlace() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      // Low frequency drop
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.5);
      gain1.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);

      // Higher chime sparkle
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
      osc2.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.1); // E5
      osc2.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.2); // G5
      gain2.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);

      osc1.start();
      osc1.stop(this.ctx.currentTime + 0.5);
      osc2.start();
      osc2.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn(e);
    }
  }

  public playSelect() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(1174.66, this.ctx.currentTime + 0.25); // D6

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn(e);
    }
  }

  public playClose() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(392.00, this.ctx.currentTime); // G4
      osc.frequency.exponentialRampToValueAtTime(196.00, this.ctx.currentTime + 0.25); // G3

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn(e);
    }
  }
}

export const audioSynth = new AudioSynthManager();
