/**
 * WeaponMount — a lightweight offensive attachment to the player.
 * Has NO physics body, NO sprite, NO HP.
 * Sits at the player's position (or orbits it) and auto-fires at nearby enemies.
 * Instantiated by GameScene._applyUpgrade() on boss kill.
 */
export class WeaponMount {
  constructor(scene, player, cfg) {
    this.scene       = scene;
    this.player      = player;
    this.cfg         = cfg;
    this.lastShot    = 0;
    this.orbitAngle  = cfg.initialAngle || 0;
  }

  get x() {
    if (this.cfg.ORBIT_RADIUS) {
      return this.player.x + Math.cos(this.orbitAngle) * this.cfg.ORBIT_RADIUS;
    }
    return this.player.x;
  }

  get y() {
    if (this.cfg.ORBIT_RADIUS) {
      return this.player.y + Math.sin(this.orbitAngle) * this.cfg.ORBIT_RADIUS;
    }
    return this.player.y;
  }

  update(time, delta) {
    if (this.player.isDead) return;

    if (this.cfg.ORBIT_RADIUS) {
      this.orbitAngle += this.cfg.ORBIT_SPEED * delta;
    }

    if (time - this.lastShot < this.cfg.RATE) return;

    const target = this.scene._findNearestEnemy(this.x, this.y, this.cfg.RANGE);
    if (!target) return;

    this.lastShot = time;
    this.scene._fireProjectile(this.x, this.y, target, this.cfg.DAMAGE, false, this.cfg.TINT || null);
  }
}
