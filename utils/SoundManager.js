/**
 * SoundManager — programmatic Web Audio sound effects.
 * No external audio files required; all sounds synthesised at runtime.
 *
 * Usage:
 *   this.soundManager = new SoundManager();
 *   this.soundManager.play('player_shoot');
 *
 * Supported types:
 *   player_shoot  — short arrow-release click
 *   enemy_hit     — soft flesh thud
 *   enemy_die     — descending death tone
 *   building_hit  — stone-collision noise burst
 *   explosion     — low-frequency rumble
 *   collect       — bright resource-collect ding
 *   wave_alert    — three-beep alarm (wave incoming)
 *   new_wave      — rising horn (wave starts)
 */
export class SoundManager {
  constructor() {
    this._ctx = null;
    // Per-sound cooldowns (ms) to prevent audio spam
    this._lastPlayed = {};
    this._cooldowns  = {
      player_shoot: 80,
      enemy_hit:    40,
      enemy_die:    60,
      building_hit: 300,
      explosion:    150,
      collect:      200,
      wave_alert:   2000,
      new_wave:     2000,
    };
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  play(type) {
    try {
      const ctx = this._getCtx();
      if (!ctx) return;

      // Cooldown guard — prevents same sound overlapping too rapidly
      const now = performance.now();
      const cd  = this._cooldowns[type] || 0;
      if (this._lastPlayed[type] && now - this._lastPlayed[type] < cd) return;
      this._lastPlayed[type] = now;

      switch (type) {
        case 'player_shoot':  this._shoot(ctx);       break;
        case 'enemy_hit':     this._hit(ctx);          break;
        case 'enemy_die':     this._die(ctx);          break;
        case 'building_hit':  this._buildingHit(ctx);  break;
        case 'explosion':     this._explosion(ctx);    break;
        case 'collect':       this._collect(ctx);      break;
        case 'wave_alert':    this._waveAlert(ctx);    break;
        case 'new_wave':      this._newWave(ctx);      break;
      }
    } catch (e) { /* AudioContext may be blocked in some browsers */ }
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  _getCtx() {
    if (!this._ctx) {
      try {
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { return null; }
    }
    // Resume if suspended (autoplay policy)
    if (this._ctx.state === 'suspended') this._ctx.resume();
    return this._ctx;
  }

  /** Short high-frequency click — arrow/projectile release */
  _shoot(ctx) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(700, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }

  /** Soft percussive thud — enemy takes damage */
  _hit(ctx) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.10);
    gain.gain.setValueAtTime(0.10, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.13);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.13);
  }

  /** Descending tone — enemy dies */
  _die(ctx) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.28);
    gain.gain.setValueAtTime(0.13, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.30);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.30);
  }

  /** Low-pass filtered noise burst — enemy hits a stone/wood building */
  _buildingHit(ctx) {
    const frames = Math.floor(ctx.sampleRate * 0.18);
    const buf    = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data   = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src    = ctx.createBufferSource();
    src.buffer   = buf;
    const filter = ctx.createBiquadFilter();
    filter.type  = 'lowpass';
    filter.frequency.value = 350;
    const gain   = ctx.createGain();
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    src.start(ctx.currentTime);
    src.stop(ctx.currentTime + 0.18);
  }

  /** Low-frequency noise rumble — mage/player AoE explosion */
  _explosion(ctx) {
    const frames = Math.floor(ctx.sampleRate * 0.45);
    const buf    = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data   = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src    = ctx.createBufferSource();
    src.buffer   = buf;
    const filter = ctx.createBiquadFilter();
    filter.type  = 'lowpass';
    filter.frequency.value = 180;
    const gain   = ctx.createGain();
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.38, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    src.start(ctx.currentTime);
    src.stop(ctx.currentTime + 0.45);
  }

  /** Bright two-note ding — resource or farm collected */
  _collect(ctx) {
    const freqs = [880, 1200];
    freqs.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      const t  = ctx.currentTime + i * 0.07;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.10, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  /** Three rapid square-wave beeps — new wave incoming alert */
  _waveAlert(ctx) {
    for (let i = 0; i < 3; i++) {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = 660;
      const t = ctx.currentTime + i * 0.22;
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.start(t);
      osc.stop(t + 0.16);
    }
  }

  /** Rising sawtooth horn — wave actually starts */
  _newWave(ctx) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(380, ctx.currentTime + 0.45);
    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.52);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.52);
  }
}
