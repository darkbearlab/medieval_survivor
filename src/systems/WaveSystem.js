import { CONFIG }   from '../config.js';
import { EventBus } from '../utils/EventBus.js';
import { Enemy, scaleCfg } from '../entities/Enemy.js';
import { Archer }   from '../entities/enemies/Archer.js';
import { Heavy }    from '../entities/enemies/Heavy.js';
import { Mage }     from '../entities/enemies/Mage.js';
import { DayNightSystem } from './DayNightSystem.js';

/**
 * Wave pattern (repeating cycle of 3):
 *   Cycle pos 1 — Day, Bandits only
 *   Cycle pos 2 — Day, Bandits + Archers (40%)
 *   Cycle pos 3 — NIGHT, all types, 1.8× enemy count
 */
export class WaveSystem {
  constructor(scene) {
    this.scene       = scene;
    this.currentWave = 0;
    this.phase       = 'prep';     // 'prep' | 'wave' | 'intermission'
    this.countdown   = CONFIG.WAVES.PREP_TIME;
  }

  /** Returns 1, 2, or 3 for the current wave's position in the cycle. */
  _cyclePos(wave) {
    return ((wave - 1) % 3) + 1;
  }

  update(delta) {
    this.countdown -= delta / 1000;

    if (this.phase === 'wave') {
      if (this.scene.enemies.countActive(true) === 0) this._endWave();
    } else if (this.countdown <= 0) {
      this._startWave();
    }
  }

  _startWave() {
    this.currentWave++;
    this.phase     = 'wave';
    this.countdown = 0;

    const pos      = this._cyclePos(this.currentWave);
    const base     = 3 + this.currentWave * 3;
    const rawCount = pos === 3 ? Math.round(base * 1.8) : base;
    const count    = Math.max(1, Math.round(rawCount * CONFIG.WAVES.SPAWN_MULT));

    this._spawnEnemies(count, pos);
    EventBus.emit('wave_started', this.currentWave);
  }

  _endWave() {
    this.phase     = 'intermission';
    this.countdown = CONFIG.WAVES.BETWEEN_TIME;
    EventBus.emit('wave_ended', this.currentWave);
  }

  _spawnEnemies(count, cyclePos) {
    const { WORLD_WIDTH, WORLD_HEIGHT } = CONFIG;
    const scene  = this.scene;
    const margin = 60;

    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 320, () => {
        if (scene.isGameOver) return;

        // Pick spawn edge
        const edge = Phaser.Math.Between(0, 3);
        let x, y;
        switch (edge) {
          case 0: x = Phaser.Math.Between(margin, WORLD_WIDTH - margin); y = margin; break;
          case 1: x = Phaser.Math.Between(margin, WORLD_WIDTH - margin); y = WORLD_HEIGHT - margin; break;
          case 2: x = margin; y = Phaser.Math.Between(margin, WORLD_HEIGHT - margin); break;
          default: x = WORLD_WIDTH - margin; y = Phaser.Math.Between(margin, WORLD_HEIGHT - margin);
        }

        // Pick enemy type by cycle position
        let enemy;
        const r = Math.random();
        const wave = this.currentWave;
        if (cyclePos === 1) {
          enemy = new Enemy(scene, x, y, scaleCfg(CONFIG.ENEMIES.BANDIT, wave));
        } else if (cyclePos === 2) {
          if (wave >= 9 && r < 0.12)      enemy = new Mage(scene, x, y, wave);
          else if (r < 0.40)              enemy = new Archer(scene, x, y, wave);
          else                            enemy = new Enemy(scene, x, y, scaleCfg(CONFIG.ENEMIES.BANDIT, wave));
        } else {
          // Night wave — Mages appear from wave 9 (third night)
          if (wave >= 9 && r < 0.20)     enemy = new Mage(scene, x, y, wave);
          else if (r < 0.30)             enemy = new Archer(scene, x, y, wave);
          else if (r < 0.55)             enemy = new Heavy(scene, x, y, wave);
          else                           enemy = new Enemy(scene, x, y, scaleCfg(CONFIG.ENEMIES.BANDIT, wave));
        }

        scene.enemies.add(enemy.sprite);
      });
    }
  }
}
