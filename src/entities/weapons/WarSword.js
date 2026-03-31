import { WeaponBase } from './WeaponBase.js';

// Arc spread: 120° total cone (±60° from facing direction)
const ARC_HALF_DEG = 60;
const ARC_HALF_RAD = ARC_HALF_DEG * (Math.PI / 180);
const SWING_MS     = 180; // duration of one arc sweep animation

export class WarSword extends WeaponBase {
  constructor(scene, player) {
    super(scene, player, 'war_sword');
    this._comboCount  = 1;     // 1 → 2 at Lv2, 2 → 3 at Lv7
    this._knockback   = false; // enabled at Lv3
    this._spinSlash   = false; // enabled at Lv8 (360° after last combo swing)
    this._swingIndex  = 0;     // increments each swing; even=CW, odd=CCW
    console.log('[WarSword] constructor called — weapon created');
  }

  _doAttack(time) {
    const target = this._findNearest(this.player.x, this.player.y, this.range);
    if (!target) return false;

    console.log('[WarSword] _doAttack — swinging, comboCount=', this._comboCount);

    const faceAngle = Phaser.Math.Angle.Between(
      this.player.x, this.player.y, target.x, target.y
    );

    for (let i = 0; i < this._comboCount; i++) {
      const swingIndex = this._swingIndex + i;
      this.scene.time.delayedCall(i * (SWING_MS + 40), () => {
        if (this.player.isDead) return;
        this._swing(this.player.x, this.player.y, faceAngle, swingIndex);

        // After the LAST swing, optionally do 360° spin
        if (this._spinSlash && i === this._comboCount - 1) {
          this.scene.time.delayedCall(SWING_MS + 40, () => {
            if (this.player.isDead) return;
            this._spinSlash360(this.player.x, this.player.y);
          });
        }
      });
    }

    this._swingIndex += this._comboCount; // advance so next attack continues alternating
    return true;
  }

  // ── Single arc swing ─────────────────────────────────────────────────────

  _swing(x, y, faceAngle, swingIndex) {
    console.log('[WarSword] _swing called, swingIndex=', swingIndex);
    const dmg       = this.totalDamage;
    const clockwise = (swingIndex % 2 === 0);

    this._drawSweep(x, y, faceAngle, clockwise);
    this.scene.soundManager.play('player_shoot');

    // Damage all enemies in the arc immediately
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

  /**
   * Animated sweep: the "blade" (bright line from centre) sweeps across the arc.
   * A fading trail marks where the blade has passed.
   * clockwise = true → sweep from (face - 60°) to (face + 60°)
   * clockwise = false → sweep from (face + 60°) to (face - 60°)
   */
  _drawSweep(cx, cy, faceAngle, clockwise) {
    const r          = this.range;
    const startAngle = clockwise
      ? faceAngle - ARC_HALF_RAD
      : faceAngle + ARC_HALF_RAD;
    const endAngle   = clockwise
      ? faceAngle + ARC_HALF_RAD
      : faceAngle - ARC_HALF_RAD;
    // anticlockwise parameter for Phaser arc: opposite of our clockwise flag
    const acw        = !clockwise;

    const gfx   = this.scene.add.graphics().setDepth(15);
    const state = { t: 0 };

    this.scene.tweens.add({
      targets:  state,
      t:        1,
      duration: SWING_MS,
      ease:     'Sine.easeOut',
      onUpdate: () => {
        gfx.clear();
        const t       = state.t;
        const curAngle = startAngle + (endAngle - startAngle) * t;

        // --- Trail (filled swept sector) ---
        // Fades from opaque at root to transparent at tip, and dims as t approaches 1
        gfx.fillStyle(0xFF5500, 0.35 * (1 - t * 0.4));
        gfx.beginPath();
        gfx.moveTo(cx, cy);
        gfx.arc(cx, cy, r, startAngle, curAngle, acw);
        gfx.closePath();
        gfx.fillPath();

        // --- Arc edge of the trail (soft glow) ---
        if (t > 0.05) {
          gfx.lineStyle(2, 0xFF8833, 0.5 * (1 - t));
          gfx.beginPath();
          gfx.arc(cx, cy, r * 0.85, startAngle, curAngle, acw);
          gfx.strokePath();
        }

        // --- Blade leading edge (bright line from centre to arc) ---
        const bx = cx + Math.cos(curAngle) * r;
        const by = cy + Math.sin(curAngle) * r;
        // outer bright tip line
        gfx.lineStyle(3, 0xFFFFCC, 0.95);
        gfx.beginPath();
        gfx.moveTo(cx + Math.cos(curAngle) * r * 0.15, cy + Math.sin(curAngle) * r * 0.15);
        gfx.lineTo(bx, by);
        gfx.strokePath();
        // inner handle line (slightly dimmer)
        gfx.lineStyle(2, 0xFFDD88, 0.6);
        gfx.beginPath();
        gfx.moveTo(cx, cy);
        gfx.lineTo(cx + Math.cos(curAngle) * r * 0.2, cy + Math.sin(curAngle) * r * 0.2);
        gfx.strokePath();

        // --- Bright tip flash (small circle at blade end) ---
        gfx.fillStyle(0xFFFFFF, 0.7 * (1 - t));
        gfx.fillCircle(bx, by, 4);
      },
      onComplete: () => {
        // Quick flash-out of the full arc silhouette
        gfx.clear();
        gfx.fillStyle(0xFF5500, 0.12);
        gfx.beginPath();
        gfx.moveTo(cx, cy);
        gfx.arc(cx, cy, r, startAngle, endAngle, acw);
        gfx.closePath();
        gfx.fillPath();
        this.scene.tweens.add({
          targets: gfx, alpha: 0, duration: 90,
          onComplete: () => gfx.destroy(),
        });
      },
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
