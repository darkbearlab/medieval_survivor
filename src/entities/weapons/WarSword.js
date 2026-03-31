import { WeaponBase } from './WeaponBase.js';

// Arc spread: 120° total cone (±60° from facing direction)
const ARC_HALF_DEG = 60;
const ARC_HALF_RAD = ARC_HALF_DEG * (Math.PI / 180);

export class WarSword extends WeaponBase {
  constructor(scene, player) {
    super(scene, player, 'war_sword');
    this._comboCount  = 1;     // 1 → 2 at Lv2, 2 → 3 at Lv7
    this._knockback   = false; // enabled at Lv3
    this._spinSlash   = false; // enabled at Lv8 (360° after last combo swing)
    console.log('[WarSword] constructor called — weapon created');
  }

  _doAttack(time) {
    const target = this._findNearest(this.player.x, this.player.y, this.range);
    if (!target) return false;

    console.log('[WarSword] _doAttack — swinging, comboCount=', this._comboCount);

    const faceAngle = Phaser.Math.Angle.Between(
      this.player.x, this.player.y, target.x, target.y
    );

    // Queue each swing in the combo with a 180 ms gap
    for (let i = 0; i < this._comboCount; i++) {
      this.scene.time.delayedCall(i * 180, () => {
        if (this.player.isDead) return;
        this._swing(this.player.x, this.player.y, faceAngle);

        // After the LAST swing, optionally do 360° spin
        if (this._spinSlash && i === this._comboCount - 1) {
          this.scene.time.delayedCall(160, () => {
            if (this.player.isDead) return;
            this._spinSlash360(this.player.x, this.player.y);
          });
        }
      });
    }

    return true; // always advance timer (swing happened even if no hit)
  }

  // ── Single arc swing ─────────────────────────────────────────────────────

  _swing(x, y, faceAngle) {
    console.log('[WarSword] _swing called');
    const dmg = this.totalDamage;
    this._drawArc(x, y, faceAngle);
    this.scene.soundManager.play('player_shoot');

    this.scene.enemies.getChildren().forEach(sprite => {
      if (!sprite.active) return;
      const dist = Phaser.Math.Distance.Between(x, y, sprite.x, sprite.y);
      if (dist > this.range) return;
      const ang  = Phaser.Math.Angle.Between(x, y, sprite.x, sprite.y);
      const diff = Phaser.Math.Angle.Wrap(ang - faceAngle);
      if (Math.abs(diff) > ARC_HALF_RAD) return;

      const entity = sprite.getData('entity');
      if (!entity || entity.dead) return;

      entity.takeDamage(dmg);

      if (this._knockback && sprite.body) {
        sprite.body.setVelocity(Math.cos(ang) * 220, Math.sin(ang) * 220);
        this.scene.time.delayedCall(200, () => {
          if (sprite.active && sprite.body) sprite.body.setVelocity(0, 0);
        });
      }

      if (this.player._frostBolt) {
        this.scene._applyFrost(entity, this.player._frostBolt);
      }
    });
  }

  // ── 360° spin slash (Lv8) ────────────────────────────────────────────────

  _spinSlash360(x, y) {
    const dmg = Math.round(this.totalDamage * 0.8);
    this._drawCircle(x, y);
    this.scene.soundManager.play('player_shoot');

    this.scene.enemies.getChildren().forEach(sprite => {
      if (!sprite.active) return;
      const dist = Phaser.Math.Distance.Between(x, y, sprite.x, sprite.y);
      if (dist > this.range) return;
      const entity = sprite.getData('entity');
      if (entity && !entity.dead) entity.takeDamage(dmg);
    });
  }

  // ── Visuals ───────────────────────────────────────────────────────────────

  _drawArc(x, y, faceAngle) {
    const gfx        = this.scene.add.graphics().setDepth(15);
    const r          = this.range;
    const startAngle = faceAngle - ARC_HALF_RAD;
    const endAngle   = faceAngle + ARC_HALF_RAD;

    // Filled pie slice
    gfx.fillStyle(0xFF6633, 0.45);
    gfx.beginPath();
    gfx.moveTo(x, y);
    gfx.arc(x, y, r, startAngle, endAngle, false);
    gfx.closePath();
    gfx.fillPath();

    // Bright arc edge
    gfx.lineStyle(3, 0xFFAA55, 0.85);
    gfx.beginPath();
    gfx.arc(x, y, r * 0.9, startAngle, endAngle, false);
    gfx.strokePath();

    this.scene.tweens.add({
      targets: gfx, alpha: 0, duration: 220,
      onComplete: () => gfx.destroy(),
    });
  }

  _drawCircle(x, y) {
    const gfx = this.scene.add.graphics().setDepth(15);
    const r   = this.range;

    gfx.fillStyle(0xFF4400, 0.50);
    gfx.beginPath();
    gfx.arc(x, y, r, 0, Math.PI * 2, false);
    gfx.fillPath();

    gfx.lineStyle(4, 0xFF8833, 0.90);
    gfx.beginPath();
    gfx.arc(x, y, r * 0.88, 0, Math.PI * 2, false);
    gfx.strokePath();

    this.scene.tweens.add({
      targets: gfx, alpha: 0, duration: 350,
      onComplete: () => gfx.destroy(),
    });
  }

  // ── Level-up handler ──────────────────────────────────────────────────────

  applyLevel(lvCfg, rarity, newLevel) {
    if (!lvCfg) return;
    const val = (lvCfg.values && lvCfg.values[rarity]) || 0;
    switch (lvCfg.effect) {
      case 'atk':
        this.bonusDamage += val;
        break;
      case 'combo_2':
        this._comboCount = 2;
        break;
      case 'knockback':
        this._knockback = true;
        break;
      case 'range':
        this.range += val;
        break;
      case 'combo_3':
        this._comboCount = 3;
        break;
      case 'spin_slash':
        this._spinSlash = true;
        break;
      case 'transform':
        this.bonusDamage += val;
        this.player.speed += lvCfg.speedBonus || 25;
        break;
    }
  }
}
