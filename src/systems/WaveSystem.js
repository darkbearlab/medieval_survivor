import { CONFIG }  from '../config.js';
import { EventBus } from '../utils/EventBus.js';
import { Enemy }    from '../entities/Enemy.js';

export class WaveSystem {
  constructor(scene) {
    this.scene        = scene;
    this.currentWave  = 0;
    this.phase        = 'prep';   // 'prep' | 'wave' | 'intermission'
    this.countdown    = CONFIG.WAVES.PREP_TIME;
  }

  update(delta) {
    // delta is in ms; convert to seconds for countdown
    this.countdown -= delta / 1000;

    if (this.phase === 'wave') {
      // Check if all enemies defeated
      if (this.scene.enemies.countActive(true) === 0) {
        this._endWave();
      }
    } else if (this.countdown <= 0) {
      this._startWave();
    }
  }

  _startWave() {
    this.currentWave++;
    this.phase     = 'wave';
    this.countdown = 0;

    const count = 3 + this.currentWave * 2;
    this._spawnEnemies(count);
    EventBus.emit('wave_started', this.currentWave);
  }

  _endWave() {
    this.phase     = 'intermission';
    this.countdown = CONFIG.WAVES.BETWEEN_TIME;
    EventBus.emit('wave_ended', this.currentWave);
  }

  _spawnEnemies(count) {
    const { WORLD_WIDTH, WORLD_HEIGHT } = CONFIG;
    const scene  = this.scene;
    const margin = 60;

    for (let i = 0; i < count; i++) {
      const delay = i * 350;
      this.scene.time.delayedCall(delay, () => {
        if (scene.isGameOver) return;

        const edge = Phaser.Math.Between(0, 3);
        let x, y;
        switch (edge) {
          case 0: x = Phaser.Math.Between(margin, WORLD_WIDTH - margin); y = margin;                  break;
          case 1: x = Phaser.Math.Between(margin, WORLD_WIDTH - margin); y = WORLD_HEIGHT - margin;   break;
          case 2: x = margin;                  y = Phaser.Math.Between(margin, WORLD_HEIGHT - margin); break;
          case 3: x = WORLD_WIDTH - margin;    y = Phaser.Math.Between(margin, WORLD_HEIGHT - margin); break;
        }

        const enemy = new Enemy(scene, x, y);
        scene.enemies.add(enemy.sprite);
      });
    }
  }
}
