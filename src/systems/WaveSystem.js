import { CONFIG }   from '../config.js';
import { EventBus } from '../utils/EventBus.js';
import { Enemy, scaleCfg } from '../entities/Enemy.js';
import { Archer }   from '../entities/enemies/Archer.js';
import { Heavy }    from '../entities/enemies/Heavy.js';
import { Mage }     from '../entities/enemies/Mage.js';
import { Elite }    from '../entities/Elite.js';
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
    this.waveElapsed = 0;
  }

  /** Returns 1, 2, or 3 for the current wave's position in the cycle. */
  _cyclePos(wave) {
    return ((wave - 1) % 3) + 1;
  }

  update(delta) {
    this.countdown -= delta / 1000;

    if (this.phase === 'wave') {
      this.waveElapsed += delta / 1000;
      const cleared = this.scene.enemies.countActive(true) === 0;
      const timeout = this.waveElapsed >= CONFIG.WAVES.WAVE_TIME_LIMIT;
      if (cleared || timeout) this._endWave(timeout && !cleared);
    } else if (this.countdown <= 0) {
      this._startWave();
    }
  }

  _startWave() {
    this.currentWave++;
    this.phase       = 'wave';
    this.countdown   = 0;
    this.waveElapsed = 0;
    this.scene.soundManager?.play('new_wave');

    const pos      = this._cyclePos(this.currentWave);
    const base     = 3 + this.currentWave * 3;
    const rawCount = pos === 3 ? Math.round(base * 1.8) : base;
    const count    = Math.max(1, Math.round(rawCount * CONFIG.WAVES.SPAWN_MULT));

    this._spawnEnemies(count, pos);
    this._spawnElite(this.currentWave);

    // Coordinated assault: from 6th night (wave 18) onward, every night wave
    if (pos === 3 && this.currentWave >= 18) {
      this.scene.time.delayedCall(4000, () => {
        if (!this.scene.isGameOver) this._triggerCoordinatedAssault();
      });
    }

    // Custom offensives from editor
    this._checkCustomOffensives(this.currentWave);

    EventBus.emit('wave_started', this.currentWave);
  }

  _endWave(forced = false) {
    this.phase     = 'intermission';
    this.countdown = forced ? 0 : CONFIG.WAVES.BETWEEN_TIME;
    EventBus.emit('wave_ended', this.currentWave);
  }

  _spawnElite(wave) {
    const { WORLD_WIDTH, WORLD_HEIGHT } = CONFIG;
    const scene  = this.scene;
    const margin = 60;

    // Appears SPAWN_DELAY ms into the wave so players aren't immediately overwhelmed
    scene.time.delayedCall(CONFIG.ELITE.SPAWN_DELAY, () => {
      if (scene.isGameOver) return;

      const edge = Phaser.Math.Between(0, 3);
      let x, y;
      switch (edge) {
        case 0: x = Phaser.Math.Between(margin, WORLD_WIDTH - margin); y = margin;                break;
        case 1: x = Phaser.Math.Between(margin, WORLD_WIDTH - margin); y = WORLD_HEIGHT - margin; break;
        case 2: x = margin;                y = Phaser.Math.Between(margin, WORLD_HEIGHT - margin); break;
        default: x = WORLD_WIDTH - margin; y = Phaser.Math.Between(margin, WORLD_HEIGHT - margin);
      }

      // Type pool grows with wave number
      const types = wave >= 5
        ? ['bandit', 'archer', 'heavy', 'mage']
        : wave >= 3
          ? ['bandit', 'archer', 'heavy']
          : ['bandit', 'archer'];
      const eliteType = types[Phaser.Math.Between(0, types.length - 1)];

      const elite = new Elite(scene, x, y, eliteType, wave);
      scene.enemies.add(elite.sprite);
      scene._showEliteAlert(elite._nameTag ? elite._nameTag.text : '⚔ 精英敵人');
    });
  }

  _triggerCoordinatedAssault() {
    const { WORLD_WIDTH, WORLD_HEIGHT } = CONFIG;
    const scene  = this.scene;
    const wave   = this.currentWave;
    const margin = 40;

    // Pick direction
    const dirIndex = Phaser.Math.Between(0, 3);
    const dirNames = ['北方', '南方', '西方', '東方'];
    const dirName  = dirNames[dirIndex];

    // Pick theme — heavier types unlock later
    const themes = [
      { key: 'archer',  name: '弓箭手突擊',  type: 'archer'  },
      { key: 'heavy',   name: '重甲衝鋒',    type: 'heavy'   },
      { key: 'bandit',  name: '強盜猛攻',    type: 'bandit'  },
    ];
    if (wave >= 21) themes.push({ key: 'mage', name: '黑暗法師軍團', type: 'mage' });
    const theme = themes[Phaser.Math.Between(0, themes.length - 1)];

    // How many in the assault — scales with wave
    const assaultCount = Math.min(6 + Math.floor((wave - 18) / 3) * 2, 18);

    scene._showCoordinatedAssaultAlert(dirName, theme.name);

    for (let i = 0; i < assaultCount; i++) {
      scene.time.delayedCall(i * 200, () => {
        if (scene.isGameOver) return;

        let x, y;
        const spread = 120;
        const mid = 0.5;
        switch (dirIndex) {
          case 0: // North
            x = Phaser.Math.Between(Math.round(WORLD_WIDTH * (mid - 0.15)), Math.round(WORLD_WIDTH * (mid + 0.15)));
            y = margin + Phaser.Math.Between(-spread / 2, spread / 2);
            break;
          case 1: // South
            x = Phaser.Math.Between(Math.round(WORLD_WIDTH * (mid - 0.15)), Math.round(WORLD_WIDTH * (mid + 0.15)));
            y = WORLD_HEIGHT - margin + Phaser.Math.Between(-spread / 2, spread / 2);
            break;
          case 2: // West
            x = margin + Phaser.Math.Between(-spread / 2, spread / 2);
            y = Phaser.Math.Between(Math.round(WORLD_HEIGHT * (mid - 0.15)), Math.round(WORLD_HEIGHT * (mid + 0.15)));
            break;
          default: // East
            x = WORLD_WIDTH - margin + Phaser.Math.Between(-spread / 2, spread / 2);
            y = Phaser.Math.Between(Math.round(WORLD_HEIGHT * (mid - 0.15)), Math.round(WORLD_HEIGHT * (mid + 0.15)));
        }
        x = Phaser.Math.Clamp(x, margin, WORLD_WIDTH - margin);
        y = Phaser.Math.Clamp(y, margin, WORLD_HEIGHT - margin);

        let enemy;
        switch (theme.type) {
          case 'archer': enemy = new Archer(scene, x, y, wave); break;
          case 'heavy':  enemy = new Heavy(scene, x, y, wave);  break;
          case 'mage':   enemy = new Mage(scene, x, y, wave);   break;
          default:       enemy = new Enemy(scene, x, y, scaleCfg(CONFIG.ENEMIES.BANDIT, wave));
        }
        scene.enemies.add(enemy.sprite);
      });
    }
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

  // ── Custom offensives (loaded from offensive-editor.html via localStorage) ──

  _checkCustomOffensives(waveNum) {
    let data;
    try {
      const raw = localStorage.getItem('medieval_survivor_offensives');
      if (!raw) {
        console.log('[CustomOffensive] 無資料（localStorage 為空，請先在編輯器按「套用至遊戲」）');
        return;
      }
      data = JSON.parse(raw);
    } catch(e) {
      console.warn('[CustomOffensive] 解析 localStorage 失敗:', e);
      return;
    }

    const offensives = data.offensives || [];
    console.log(`[CustomOffensive] 第 ${waveNum} 波，共 ${offensives.length} 個攻勢設定`);

    for (const cfg of offensives) {
      if (!cfg.enabled) {
        console.log(`  ↳ 「${cfg.name}」已停用，跳過`);
        continue;
      }
      const day    = cfg.triggerDay    || 1;
      const timing = cfg.triggerTiming || 'night';
      let target, matches = false;
      if (timing === 'any') {
        const first = (day - 1) * 3 + 1;
        matches = waveNum >= first && waveNum <= day * 3;
        target  = `第${day}天任意波 (${first}–${day*3})`;
      } else {
        if (timing === 'wave1')      target = (day - 1) * 3 + 1;
        else if (timing === 'wave2') target = (day - 1) * 3 + 2;
        else                         target = day * 3;
        matches = waveNum === target;
        target  = `第${day}天${timing} → 第${target}波`;
      }
      console.log(`  ↳ 「${cfg.name}」觸發條件：${target}，目前波：${waveNum}，${matches ? '✓ 觸發！' : '✗ 不符'}`);
      if (matches) this._triggerCustomOffensive(cfg, waveNum);
    }
  }

  _triggerCustomOffensive(cfg, waveNum) {
    const scene  = this.scene;
    const { WORLD_WIDTH, WORLD_HEIGHT } = CONFIG;
    const margin     = 40;
    const delayMs    = (cfg.delaySeconds || 0) * 1000;
    const intervalMs = cfg.spawnIntervalMs || 300;

    // Resolve direction
    const dirMap  = { north: 0, south: 1, west: 2, east: 3 };
    const dirIndex = cfg.direction === 'random'
      ? Phaser.Math.Between(0, 3)
      : (dirMap[cfg.direction] ?? Phaser.Math.Between(0, 3));
    const dirNames = ['北方', '南方', '西方', '東方'];

    // Build spawn queue from unit counts
    const queue = [];
    const units = cfg.units || {};
    for (const [type, count] of Object.entries(units)) {
      for (let i = 0; i < (count || 0); i++) queue.push(type);
    }

    // Show alert
    scene.time.delayedCall(delayMs, () => {
      if (scene.isGameOver) return;
      scene._showCoordinatedAssaultAlert(dirNames[dirIndex], cfg.name || '大型攻勢');
    });

    // Spawn regular units
    queue.forEach((type, i) => {
      scene.time.delayedCall(delayMs + 1200 + i * intervalMs, () => {
        if (scene.isGameOver) return;
        const { x, y } = this._spawnPosFromDir(dirIndex, WORLD_WIDTH, WORLD_HEIGHT, margin);
        let enemy;
        switch (type) {
          case 'archer': enemy = new Archer(scene, x, y, waveNum); break;
          case 'heavy':  enemy = new Heavy(scene, x, y, waveNum);  break;
          case 'mage':   enemy = new Mage(scene, x, y, waveNum);   break;
          default:       enemy = new Enemy(scene, x, y, scaleCfg(CONFIG.ENEMIES.BANDIT, waveNum));
        }
        scene.enemies.add(enemy.sprite);
      });
    });

    // Spawn elites
    if (cfg.elite?.enabled) {
      const eliteCount = Math.min(cfg.elite.count || 1, 3);
      const eliteTypes = cfg.elite.type === 'random'
        ? ['bandit', 'archer', 'heavy', 'mage'] : [cfg.elite.type];
      for (let i = 0; i < eliteCount; i++) {
        scene.time.delayedCall(delayMs + 2000 + i * 600, () => {
          if (scene.isGameOver) return;
          const { x, y } = this._spawnPosFromDir(dirIndex, WORLD_WIDTH, WORLD_HEIGHT, margin);
          const eliteType = eliteTypes[Phaser.Math.Between(0, eliteTypes.length - 1)];
          const elite = new Elite(scene, x, y, eliteType, waveNum);
          scene.enemies.add(elite.sprite);
          scene._showEliteAlert(elite._nameTag?.text || '⚔ 精英敵人');
        });
      }
    }
  }

  _spawnPosFromDir(dirIndex, W, H, margin) {
    const spread = 120;
    const mid = 0.5;
    let x, y;
    switch (dirIndex) {
      case 0: // North
        x = Phaser.Math.Between(Math.round(W*(mid-0.15)), Math.round(W*(mid+0.15)));
        y = margin + Phaser.Math.Between(-spread/2, spread/2);
        break;
      case 1: // South
        x = Phaser.Math.Between(Math.round(W*(mid-0.15)), Math.round(W*(mid+0.15)));
        y = H - margin + Phaser.Math.Between(-spread/2, spread/2);
        break;
      case 2: // West
        x = margin + Phaser.Math.Between(-spread/2, spread/2);
        y = Phaser.Math.Between(Math.round(H*(mid-0.15)), Math.round(H*(mid+0.15)));
        break;
      default: // East
        x = W - margin + Phaser.Math.Between(-spread/2, spread/2);
        y = Phaser.Math.Between(Math.round(H*(mid-0.15)), Math.round(H*(mid+0.15)));
    }
    return {
      x: Phaser.Math.Clamp(x, margin, W - margin),
      y: Phaser.Math.Clamp(y, margin, H - margin),
    };
  }
}
