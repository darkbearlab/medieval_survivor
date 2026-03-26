import { CONFIG }   from '../../config.js';
import { EventBus } from '../../utils/EventBus.js';
import { Enemy }    from '../Enemy.js';

/**
 * Archer — low HP, ranged.
 * Priority: player (always chase) → soldiers → buildings (reduced damage) → TC (melee).
 * Backs away from player/soldiers if they get too close.
 */
export class Archer extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, CONFIG.ENEMIES.ARCHER);
  }

  update(time) {
    if (this.dead || !this.sprite.active) return;

    const cfg = CONFIG.ENEMIES.ARCHER;
    const tc  = this.scene.townCenter;
    const bs  = this.scene.buildingSystem;

    // ── Priority 1: Player ───────────────────────────────────────────────────
    let target          = null;
    let isBuildingTarget = false;

    const player = this.scene.player;
    if (player && !player.isDead) {
      target = player;
    }

    // ── Priority 2: Nearest alive soldier ────────────────────────────────────
    if (!target && bs.soldiers) {
      let bestDist = Infinity;
      for (const s of bs.soldiers) {
        if (s.dead) continue;
        const d = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, s.x, s.y);
        if (d < bestDist) { bestDist = d; target = s; }
      }
    }

    // ── Priority 3: Nearest non-wall building (reduced damage) ───────────────
    if (!target) {
      let bestDist = Infinity;
      const bLists = [bs.towers, bs.smiths, bs.trainingGrounds, bs.cafeterias, bs.gatheringPosts, bs.repairWorkshops, bs.barracks];
      for (const list of bLists) {
        if (!list) continue;
        for (const b of list) {
          if (b.dead) continue;
          const d = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, b.x, b.y);
          if (d < bestDist) { bestDist = d; target = b; }
        }
      }
      if (target) isBuildingTarget = true;
    }

    // ── Priority 4: Town center (melee fallback) ──────────────────────────────
    const isTc = !target;
    if (isTc) target = tc;

    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, target.x, target.y);

    if (isTc) {
      if (dist < CONFIG.TOWN_CENTER.RADIUS + 16) {
        if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
        if (time - this.lastAttack > this.attackRate) {
          this.lastAttack = time;
          tc.takeDamage(this.damage);
          EventBus.emit('town_hp_changed', tc.hp, tc.maxHp);
          if (tc.hp <= 0 && !this.scene.isGameOver) this.scene.gameOver();
        }
      } else {
        this._followPath(time, tc.x, tc.y);
      }
    } else if (!isBuildingTarget && dist < cfg.KEEP_MIN) {
      // Back away from player / soldier if too close
      const angle = Phaser.Math.Angle.Between(target.x, target.y, this.sprite.x, this.sprite.y);
      if (this.sprite.body) this.sprite.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
      this.sprite.setFlipX(Math.cos(angle) < 0);
    } else if (dist < cfg.RANGE) {
      // In range — stop and fire
      if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
      if (time - this.lastAttack > this.attackRate) {
        this.lastAttack = time;
        const dmg = isBuildingTarget ? cfg.BUILDING_DAMAGE : this.damage;
        this.scene._fireEnemyProjectile(this.sprite.x, this.sprite.y, target, dmg);
      }
    } else {
      this._followPath(time, target.x, target.y);
    }

    this._drawHpBar();
  }
}
