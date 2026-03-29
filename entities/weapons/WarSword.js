import { WeaponBase } from './WeaponBase.js';

// Arc spread: 120° total cone (±60° from the facing direction)
const ARC_HALF_DEG = 60;
const ARC_HALF_RAD = ARC_HALF_DEG * (Math.PI / 180);

export class WarSword extends WeaponBase {
  constructor(scene, player) {
    super(scene, player, 'war_sword');
  }

  _doAttack(time) {
    const target = this._findNearest(this.player.x, this.player.y, this.range);
    if (!target) return false;

    const faceAngle = Phaser.Math.Angle.Between(
      this.player.x, this.player.y, target.x, target.y
    );
    const dmg = this.totalDamage;

    // Damage all enemies inside the arc
    let hitAny = false;
    this.scene.enemies.getChildren().forEach(sprite => {
      if (!sprite.active) return;
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, sprite.x, sprite.y
      );
      if (dist > this.range) return;
      const ang  = Phaser.Math.Angle.Between(
        this.player.x, this.player.y, sprite.x, sprite.y
      );
      const diff = Phaser.Math.Angle.Wrap(ang - faceAngle);
      if (Math.abs(diff) <= ARC_HALF_RAD) {
        const entity = sprite.getData('entity');
        if (entity && !entity.dead) {
          entity.takeDamage(dmg);
          hitAny = true;
        }
      }
    });

    // Draw arc visual regardless of hitting anything (swing happened)
    this._drawArc(this.player.x, this.player.y, faceAngle);

    // Global modifiers (hit effects at player position for sword)
    if (hitAny) {
      if (this.player._explosiveShots)
        this.scene._triggerMountExplosion(this.player.x, this.player.y, Math.round(dmg * 0.5), this.player._explosiveShots);
      if (this.player._frostBolt)
        this.scene.enemies.getChildren().forEach(sprite => {
          if (!sprite.active) return;
          const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y);
          if (dist > this.range) return;
          const ang  = Phaser.Math.Angle.Between(this.player.x, this.player.y, sprite.x, sprite.y);
          const diff = Phaser.Math.Angle.Wrap(ang - faceAngle);
          if (Math.abs(diff) <= ARC_HALF_RAD) {
            const entity = sprite.getData('entity');
            if (entity && !entity.dead) this.scene._applyFrost(entity, this.player._frostBolt);
          }
        });
    }

    return true;  // swing always resets timer even if no enemies in range
  }

  _drawArc(x, y, faceAngle) {
    const gfx = this.scene.add.graphics().setDepth(15);
    // Outer glow
    gfx.fillStyle(0xFF6633, 0.45);
    gfx.slice(x, y, this.range, faceAngle - ARC_HALF_RAD, faceAngle + ARC_HALF_RAD, false);
    gfx.fillPath();
    // Inner bright edge
    gfx.lineStyle(3, 0xFFAA55, 0.85);
    gfx.beginPath();
    gfx.arc(x, y, this.range * 0.9, faceAngle - ARC_HALF_RAD, faceAngle + ARC_HALF_RAD, false);
    gfx.strokePath();

    this.scene.tweens.add({
      targets: gfx, alpha: 0, duration: 220,
      onComplete: () => gfx.destroy(),
    });
  }

  applyLevel(lvCfg, rarity, newLevel) {
    // Placeholder — per-level design TBD
    if (!lvCfg) return;
    const val = (lvCfg.values && lvCfg.values[rarity]) || 0;
    if (lvCfg.effect === 'atk')  this.bonusDamage += val;
    if (lvCfg.effect === 'rate') this.rateBonus = Math.min(this.rateBonus + val, this.rate - 200);
  }
}
