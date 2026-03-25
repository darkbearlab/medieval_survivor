import { CONFIG } from '../config.js';
import { EventBus } from '../utils/EventBus.js';

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;

    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDepth(10);
    this.sprite.setData('entity', this);

    this.hp    = CONFIG.PLAYER.HP;
    this.maxHp = CONFIG.PLAYER.HP;
    this.isDead = false;
  }

  update(cursors) {
    if (this.isDead) return;

    const speed = CONFIG.PLAYER.SPEED;
    let vx = 0;
    let vy = 0;

    if (cursors.left.isDown  || cursors.leftArrow.isDown)  vx = -speed;
    if (cursors.right.isDown || cursors.rightArrow.isDown) vx =  speed;
    if (cursors.up.isDown    || cursors.upArrow.isDown)    vy = -speed;
    if (cursors.down.isDown  || cursors.downArrow.isDown)  vy =  speed;

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    if (this.sprite.body) this.sprite.body.setVelocity(vx, vy);

    // Flip sprite to face movement direction
    if (vx < 0) this.sprite.setFlipX(true);
    if (vx > 0) this.sprite.setFlipX(false);
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.hp = Math.max(0, this.hp - amount);
    EventBus.emit('player_hp_changed', this.hp, this.maxHp);

    // Red tint flash
    this.sprite.setTint(0xFF4444);
    this.scene.time.delayedCall(150, () => {
      if (this.sprite && this.sprite.active) {
        this.sprite.clearTint();
      }
    });

    if (this.hp <= 0) {
      this._die();
    }
  }

  _die() {
    if (this.isDead) return;
    this.isDead = true;

    if (this.sprite.body) {
      this.sprite.body.setVelocity(0, 0);
      this.sprite.body.enable = false;
    }

    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      duration: 600,
      onComplete: () => {
        this.scene.gameOver();
      },
    });
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
