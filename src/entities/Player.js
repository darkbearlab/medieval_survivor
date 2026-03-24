import { CONFIG } from '../config.js';

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;

    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDepth(10);
    this.sprite.setData('entity', this);

    this.hp    = CONFIG.PLAYER.HP;
    this.maxHp = CONFIG.PLAYER.HP;
  }

  update(cursors) {
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

    this.sprite.setVelocity(vx, vy);

    // Flip sprite to face movement direction
    if (vx < 0) this.sprite.setFlipX(true);
    if (vx > 0) this.sprite.setFlipX(false);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
