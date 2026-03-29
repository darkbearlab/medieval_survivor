import { CONFIG }   from '../config.js';
import { EventBus } from '../utils/EventBus.js';

/**
 * DayNightSystem — manages day/night visual overlay.
 * Pattern: wave 1 (day), wave 2 (day), wave 3 (NIGHT), repeat.
 * Night waves have a dark-blue overlay darkening the ground layer.
 */
export class DayNightSystem {
  constructor(scene) {
    this.scene   = scene;
    this.isNight = false;

    // Screen-fixed dark overlay (depth 3: above ground/terrain, below buildings/characters)
    this.overlay = scene.add.rectangle(
      CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2,
      CONFIG.WIDTH, CONFIG.HEIGHT,
      0x00003a, 0
    ).setScrollFactor(0).setDepth(3);

    this._onWaveStarted = (n) => this._onStart(n);
    this._onWaveEnded   = (n) => this._onEnd(n);
    EventBus.on('wave_started', this._onWaveStarted);
    EventBus.on('wave_ended',   this._onWaveEnded);
  }

  /** Returns true for wave 3, 6, 9 … */
  static isNightWave(waveNum) {
    return ((waveNum - 1) % 3) === 2;
  }

  _onStart(waveNum) {
    if (DayNightSystem.isNightWave(waveNum)) {
      this.isNight = true;
      this.scene.tweens.add({
        targets: this.overlay, fillAlpha: 0.46, duration: 2500,
      });
      EventBus.emit('day_phase_changed', 'night');
    } else {
      EventBus.emit('day_phase_changed', 'day');
    }
  }

  _onEnd(waveNum) {
    if (DayNightSystem.isNightWave(waveNum)) {
      this.isNight = false;
      this.scene.tweens.add({
        targets: this.overlay, fillAlpha: 0, duration: 2500,
      });
      EventBus.emit('day_phase_changed', 'day');
    }
  }

  destroy() {
    EventBus.off('wave_started', this._onWaveStarted);
    EventBus.off('wave_ended',   this._onWaveEnded);
    if (this.overlay) this.overlay.destroy();
  }
}
