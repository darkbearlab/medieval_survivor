import { CONFIG }   from '../../config.js';
import { EventBus } from '../../utils/EventBus.js';
import { Enemy }    from '../Enemy.js';

/**
 * Archer — low HP, ranged, prioritises player.
 * Keeps minimum distance (backs away if player too close).
 * Fires enemy projectiles at player; falls back to direct TC damage when player dead.
 */
export class Archer extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, CONFIG.ENEMIES.ARCHER);
  }

  update(time) {
    if (this.dead || !this.sprite.active) return;

    const cfg    = CONFIG.ENEMIES.ARCHER;
    const player = this.scene.player;
    const tc     = this.scene.townCenter;

    const pAlive = player && !player.isDead && player.sprite && player.sprite.active;
    const pDist  = pAlive
      ? Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, player.x, player.y)
      : Infinity;

    if (pAlive) {
      if (pDist < cfg.KEEP_MIN) {
        // Back away from player
        const angle = Phaser.Math.Angle.Between(player.x, player.y, this.sprite.x, this.sprite.y);
        if (this.sprite.body) this.sprite.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
        this.sprite.setFlipX(Math.cos(angle) < 0);
      } else if (pDist < cfg.RANGE) {
        // In range — stop and fire
        if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
        if (time - this.lastAttack > this.attackRate) {
          this.lastAttack = time;
          this.scene._fireEnemyProjectile(this.x, this.y, player.sprite, this.damage);
          this._showDamageNumber(this.x, this.y - 28);
        }
      } else {
        // Chase player
        this._followPath(time, player.x, player.y);
      }
    } else {
      // Player dead — melee attack town center
      const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, tc.x, tc.y);
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
    }

    this._drawHpBar();
  }
}
