import { WeaponBase } from './WeaponBase.js';

export class ArcaneStaff extends WeaponBase {
  constructor(scene, player) {
    super(scene, player, 'arcane_staff');
    this.aoeRadius = 80;
  }

  _doAttack(time) {
    const target = this._findNearest(this.player.x, this.player.y, this.range);
    if (!target) return false;
    this._fire(this.player.x, this.player.y, target, this.totalDamage, 0xCC44FF);
    this.scene.soundManager.play('player_shoot');
    return true;
  }

  onHit(px, py, entity, dmg) {
    // AoE explosion on every hit
    const r     = this.aoeRadius;
    const outer = this.scene.add.circle(px, py, r,        0x6600CC, 0.40).setDepth(20);
    const inner = this.scene.add.circle(px, py, r * 0.45, 0xDD88FF, 0.75).setDepth(21);
    this.scene.tweens.add({
      targets: [outer, inner], alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 400,
      onComplete: () => { outer.destroy(); inner.destroy(); },
    });
    this.scene.enemies.getChildren().forEach(sprite => {
      if (!sprite.active) return;
      const e = sprite.getData('entity');
      if (!e || e.dead) return;
      if (Phaser.Math.Distance.Between(px, py, sprite.x, sprite.y) < r)
        e.takeDamage(Math.round(dmg * 0.65));
    });
  }

  applyLevel(lvCfg, rarity, newLevel) {
    if (!lvCfg) return;
    const val = (lvCfg.values && lvCfg.values[rarity]) || 0;
    if (lvCfg.effect === 'atk')  this.bonusDamage += val;
    if (lvCfg.effect === 'rate') this.rateBonus = Math.min(this.rateBonus + val, this.rate - 200);
  }
}
