import { CONFIG } from '../../config.js';
import { Enemy }  from '../Enemy.js';

/**
 * Mage — ranged, fires slow projectiles that explode on impact.
 * Keeps minimum distance from player. Appears from the third night (wave 9+).
 */
export class Mage extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, CONFIG.ENEMIES.MAGE);
  }

  update(time) {
    if (this.dead || !this.sprite.active) return;

    const cfg    = CONFIG.ENEMIES.MAGE;
    const player = this.scene.player;
    const tc     = this.scene.townCenter;

    const pAlive = player && !player.isDead && player.sprite && player.sprite.active;
    const pDist  = pAlive
      ? Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, player.x, player.y)
      : Infinity;

    if (pAlive) {
      if (pDist < cfg.KEEP_MIN) {
        // Back away
        const angle = Phaser.Math.Angle.Between(player.x, player.y, this.sprite.x, this.sprite.y);
        if (this.sprite.body) this.sprite.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
        this.sprite.setFlipX(Math.cos(angle) < 0);
      } else if (pDist < cfg.RANGE) {
        // In range — stop and fire
        if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
        if (time - this.lastAttack > this.attackRate) {
          this.lastAttack = time;
          this.scene._fireMageProjectile(this.x, this.y, player.sprite, this.damage);
        }
      } else {
        this._followPath(time, player.x, player.y);
      }
    } else {
      // Player dead — fire at town center
      const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, tc.x, tc.y);
      if (dist < cfg.RANGE) {
        if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
        if (time - this.lastAttack > this.attackRate) {
          this.lastAttack = time;
          this.scene._fireMageProjectile(this.x, this.y, tc, this.damage);
        }
      } else {
        this._followPath(time, tc.x, tc.y);
      }
    }

    this._drawHpBar();
  }
}
