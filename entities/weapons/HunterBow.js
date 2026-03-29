import { WeaponBase } from './WeaponBase.js';

export class HunterBow extends WeaponBase {
  constructor(scene, player) {
    super(scene, player, 'hunter_bow');
    this._splitCount  = 0;    // sub-arrows per hit
    this._piercing    = false; // Lv10 transform
  }

  _doAttack(time) {
    const target = this._findNearest(this.player.x, this.player.y, this.range);
    if (!target) return false;

    const dmg = this.totalDamage;
    this._fire(this.player.x, this.player.y, target, dmg, null, {
      piercing: this._piercing,
    });
    this.scene.soundManager.play('player_shoot');

    // dual_shot extra arrows (global modifier still on player)
    const extras = this.player._extraShots || 0;
    for (let s = 0; s < extras; s++) {
      const off       = ((s % 2 === 0 ? 1 : -1) * (Math.ceil((s + 1) / 2) * 18)) * (Math.PI / 180);
      const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
      const fake = {
        x: this.player.x + Math.cos(baseAngle + off) * 400,
        y: this.player.y + Math.sin(baseAngle + off) * 400,
      };
      this._fire(this.player.x, this.player.y, fake, Math.round(dmg * 0.8), null, {
        piercing: this._piercing,
      });
    }
    return true;
  }

  onHit(px, py, entity, dmg, angle, isPiercing, isSplit) {
    if (this._splitCount > 0 && !isSplit) {
      this._triggerSplit(px, py, Math.round(dmg * 0.7), angle);
    }
  }

  _triggerSplit(x, y, damage, baseAngle) {
    const SPREAD   = Math.PI * (40 / 180); // ±40°
    const OFFSET   = 32;
    const sx = x + Math.cos(baseAngle) * OFFSET;
    const sy = y + Math.sin(baseAngle) * OFFSET;
    for (let i = 0; i < this._splitCount; i++) {
      const a    = baseAngle + (Math.random() * 2 - 1) * SPREAD;
      const fake = { x: sx + Math.cos(a) * 500, y: sy + Math.sin(a) * 500 };
      this._fire(sx, sy, fake, damage, 0xAADDFF, { isSplit: true });
    }
  }

  applyLevel(lvCfg, rarity, newLevel) {
    if (!lvCfg) return;
    const val = (lvCfg.values && lvCfg.values[rarity]) || 0;
    switch (lvCfg.effect) {
      case 'atk':
        this.bonusDamage += val;
        break;
      case 'rate':
        this.rateBonus = Math.min(this.rateBonus + val, this.rate - 200);
        break;
      case 'split':
        this._splitCount += val;
        break;
      case 'transform':
        this.range        = 9999;
        this._piercing    = true;
        // Keep all accumulated atk / rate / split
        this.player.sprite.setTint(0xFFEE44);
        this.scene.time.delayedCall(800, () => {
          if (this.player.sprite?.active) this.player.sprite.clearTint();
        });
        break;
    }
  }
}
