// All sound is generated locally. No samples, network requests, or autoplay.
const clampVolume = (value, fallback) => Number.isFinite(Number(value)) ? Math.max(0, Math.min(1, Number(value))) : fallback;
const SOUNDS = {
  inventory_stored: [[660,0,.08,'sine',.14],[990,.07,.12,'sine',.14]],
  shield_hit: [[160,0,.1,'triangle',.19,700],[880,.06,.18,'sine',.16]],
  blast_hit: [[90,0,.22,'sawtooth',.15,35],[260,.02,.17,'triangle',.12,70]],
  laser_shot: [[1480, 0, .085, 'sawtooth', .07, 390], [2100, 0, .04, 'sine', .06, 900]],
  fire_activate: [[110, 0, .24, 'sawtooth', .10, 360], [220, .05, .28, 'triangle', .14, 660]],
  sticky_catch: [[620, 0, .075, 'sine', .20, 170], [240, .05, .10, 'triangle', .10, 340]],
  paddle_hit: [[460, 0, .07, 'sine', .30, 710]],
  wall_hit: [[230, 0, .055, 'triangle', .20, 180]],
  brick_hit: [[650, 0, .06, 'triangle', .22, 450]],
  brick_break: [[880, 0, .10, 'triangle', .25, 420], [1320, .025, .08, 'sine', .12, 660]],
  steel_hit: [[1620, 0, .12, 'sine', .15, 1490], [2390, 0, .075, 'triangle', .08, 2180]],
  powerup_spawn: [[440, 0, .12, 'sine', .19], [660, .08, .14, 'sine', .19]],
  powerup_pickup: [[523.25, 0, .12, 'triangle', .18], [659.25, .08, .12, 'triangle', .18], [783.99, .16, .22, 'sine', .22]],
  lose_life: [[330, 0, .20, 'triangle', .22, 150], [150, .13, .28, 'sine', .22, 65]],
  level_clear: [[523.25, 0, .18, 'triangle', .20], [659.25, .12, .18, 'triangle', .20], [783.99, .24, .18, 'triangle', .20], [1046.5, .36, .42, 'sine', .22]],
  game_over: [[392, 0, .23, 'triangle', .19], [311.13, .20, .23, 'triangle', .19], [261.63, .40, .25, 'triangle', .19], [130.81, .62, .55, 'sine', .22]],
  high_score: [[523.25, 0, .12, 'triangle', .20], [659.25, .10, .12, 'triangle', .20], [783.99, .20, .12, 'triangle', .20], [1046.5, .30, .20, 'triangle', .20], [1318.51, .47, .40, 'sine', .17]]
};

export class AudioManager {
  constructor(settings = {}) {
    this.musicVolume = clampVolume(settings.musicVolume, .25);
    this.sfxVolume = clampVolume(settings.sfxVolume, .65);
    this.context = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.timer = null;
    this.paused = false;
    this.voices = new Set();
    this.step = 0;
    this.nextNote = 0;
  }

  async unlock() {
    try {
      if (!this.context) {
        const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Context) return false;
        this.context = new Context();
        this.musicBus = this.context.createGain();
        this.sfxBus = this.context.createGain();
        this.musicBus.gain.value = this.musicVolume;
        this.sfxBus.gain.value = this.sfxVolume;
        this.musicBus.connect(this.context.destination);
        this.sfxBus.connect(this.context.destination);
      }
      if (this.context.state !== 'running') await this.context.resume();
      if (!this.paused) this._startMusic();
      return this.context.state === 'running';
    } catch { return false; } // Audio unavailable must never stop gameplay.
  }

  _tone(bus, frequency, start, duration, type = 'sine', amplitude = .15, endFrequency = frequency) {
    if (!this.context || this.voices.size >= 96) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(amplitude, start + Math.min(.008, duration / 4));
    envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
    envelope.gain.setValueAtTime(0, start + duration + .005);
    oscillator.connect(envelope);
    envelope.connect(bus);
    const voice = { oscillator, envelope, bus };
    this.voices.add(voice);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
      this.voices.delete(voice);
    };
    oscillator.start(start);
    oscillator.stop(start + duration + .015);
  }

  play(name) {
    if (!this.context || this.context.state !== 'running' || this.paused || this.sfxVolume === 0 || !SOUNDS[name]) return;
    const now = this.context.currentTime;
    for (const [hz, delay, duration, type, volume, end] of SOUNDS[name]) {
      this._tone(this.sfxBus, hz, now + delay, duration, type, volume, end);
    }
  }

  setVolumes(music, sfx) {
    this.musicVolume = clampVolume(music, this.musicVolume);
    this.sfxVolume = clampVolume(sfx, this.sfxVolume);
    if (!this.context) return;
    for (const [bus, volume] of [[this.musicBus, this.musicVolume], [this.sfxBus, this.sfxVolume]]) {
      bus.gain.cancelScheduledValues(this.context.currentTime);
      bus.gain.setValueAtTime(volume, this.context.currentTime);
    }
    if (!this.musicVolume) this._stopMusic();
    else if (!this.paused) this._startMusic();
  }

  _startMusic() {
    if (this.timer !== null || !this.musicVolume || this.paused || this.context?.state !== 'running') return;
    this.nextNote = this.context.currentTime + .06;
    const schedule = () => {
      if (this.context.state !== 'running' || this.paused) return;
      const now = this.context.currentTime;
      if (this.nextNote < now) this.nextNote = now + .04;
      const melody = [261.63, 392, 523.25, 392, 233.08, 349.23, 466.16, 349.23, 207.65, 311.13, 415.3, 311.13, 233.08, 349.23, 466.16, 349.23];
      while (this.nextNote < now + .15) {
        this._tone(this.musicBus, melody[this.step % melody.length], this.nextNote, .40, 'sine', .065);
        if (this.step % 4 === 0) this._tone(this.musicBus, melody[this.step % melody.length] / 2, this.nextNote, .95, 'sine', .07);
        this.step++;
        this.nextNote += .30;
      }
    };
    schedule();
    this.timer = globalThis.setInterval(schedule, 80);
  }

  _stopMusic() {
    if (this.timer !== null) globalThis.clearInterval(this.timer);
    this.timer = null;
    for (const voice of this.voices) {
      if (voice.bus === this.musicBus) {
        voice.envelope.gain.cancelScheduledValues(this.context.currentTime);
        voice.envelope.gain.setValueAtTime(0, this.context.currentTime);
        try { voice.oscillator.stop(); } catch { /* Already ended. */ }
      }
    }
  }

  suspend() {
    this.paused = true;
    this._stopMusic();
    for (const voice of this.voices) {
      voice.envelope.gain.cancelScheduledValues(this.context.currentTime);
      voice.envelope.gain.setValueAtTime(0, this.context.currentTime);
      try { voice.oscillator.stop(); } catch { /* Already ended. */ }
    }
  }

  async resume() {
    this.paused = false;
    // Creating an AudioContext is reserved for the user's unlock gesture.
    if (!this.context) return false;
    return this.unlock();
  }
}
