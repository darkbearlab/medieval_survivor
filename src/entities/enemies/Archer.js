import { CONFIG }   from '../../config.js';
import { EventBus } from '../../utils/EventBus.js';
import { Enemy, scaleCfg } from '../Enemy.js';

/**
 * Archer — low HP, ranged.
 * Always attacks the nearest target (player, soldiers, buildings, TC).
 * Backs away if target is within KEEP_MIN.
 */
export class Archer extends Enemy {
  constructor(scene, x, y, wave = 1) {
    super(scene, x, y, scaleCfg(CONFIG.ENEMIES.ARCHER, wave));
  }

  update(time) {
    if (this.dead || !this.sprite.active) return;

    const cfg = CONFIG.ENEMIES.ARCHER;
    const bs  = this.scene.buildingSystem;
    const tc  = this.scene.townCenter;

    // ── Find nearest target ──────────────────────────────────────────────────
    let target = null;
    let bestDist = Infinity;

    const check = (entity) => {
      if (!entity || entity.dead) return;
      const d = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, entity.x, entity.y);
      if (d < bestDist) { bestDist = d; target = entity; }
    };

    const player = this.scene.player;
    if (player && !player.isDead) check(player);

    for (const list of [bs.soldiers, bs.alliedMages]) {
      if (!list) continue;
      for (const u of list) check(u);
    }

    const bLists = [bs.walls, bs.towers, bs.smiths, bs.trainingGrounds,
                    bs.cafeterias, bs.gatheringPosts, bs.repairWorkshops,
                    bs.barracks, bs.mageTowers];
    for (const list of bLists) {
      if (!list) continue;
      for (const b of list) check(b);
    }

    check(tc);

    if (!target) return;

    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, target.x, target.y);
    const isTc = target === tc;

    if (isTc && dist < CONFIG.TOWN_CENTER.RADIUS + 16) {
      // TC melee fallback
      if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
      if (time - this.lastAttack > this.attackRate) {
        this.lastAttack = time;
        tc.takeDamage(this.damage);
        EventBus.emit('town_hp_changed', tc.hp, tc.maxHp);
        if (tc.hp <= 0 && !this.scene.isGameOver) this.scene.gameOver();
      }
    } else if (dist < cfg.KEEP_MIN) {
      // Back away
      const angle = Phaser.Math.Angle.Between(target.x, target.y, this.sprite.x, this.sprite.y);
      if (this.sprite.body) this.sprite.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
      this.sprite.setFlipX(Math.cos(angle) < 0);
    } else if (dist < cfg.RANGE) {
      // In range — stop and fire
      if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
      if (time - this.lastAttack > this.attackRate) {
        this.lastAttack = time;
        this.scene._fireEnemyProjectile(this.sprite.x, this.sprite.y, target, this.damage);
      }
    } else {
      this._followPath(time, target.x, target.y);
    }

    this._drawHpBar();
  }
}
