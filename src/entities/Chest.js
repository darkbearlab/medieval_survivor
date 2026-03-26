/**
 * Chest — dropped by Elite enemies on death.
 * Player stands nearby for CHEST_COLLECT_TIME ms to open it,
 * triggering a weapon upgrade choice.
 */
export class Chest {
  constructor(scene, x, y) {
    this.scene     = scene;
    this.x         = x;
    this.y         = y;
    this.collected = false;

    this.sprite = scene.add.image(x, y, 'chest').setDepth(5).setScale(1.2);

    // Gentle pulse to attract attention
    scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.45, scaleY: 1.45,
      yoyo: true, repeat: -1, duration: 680,
    });

    // Gold glow ring
    this._ring = scene.add.circle(x, y, 18, 0xFFCC00, 0.15).setDepth(4);
    scene.tweens.add({
      targets: this._ring,
      alpha: 0.35, scaleX: 1.3, scaleY: 1.3,
      yoyo: true, repeat: -1, duration: 680,
    });

    // "開啟" label — visible only while player is nearby
    this._label = scene.add.text(x, y - 30, '靠近開啟', {
      fontSize: '11px', color: '#FFD700',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(6).setAlpha(0);
  }

  showLabel()  { if (this._label) this._label.setAlpha(1); }
  hideLabel()  { if (this._label) this._label.setAlpha(0); }

  collect() {
    if (this.collected) return;
    this.collected = true;
    this.destroy();
    // GameScene will show upgrade choice on receipt of this call
  }

  destroy() {
    if (this.sprite && this.sprite.active) this.scene.tweens.add({
      targets: this.sprite, alpha: 0, scaleX: 2, scaleY: 2, duration: 350,
      onComplete: () => { if (this.sprite) this.sprite.destroy(); },
    });
    if (this._ring)  this._ring.destroy();
    if (this._label) this._label.destroy();
    this._ring  = null;
    this._label = null;
  }
}
