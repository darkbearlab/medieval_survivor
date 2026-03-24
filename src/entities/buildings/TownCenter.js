import { CONFIG } from '../../config.js';

export class TownCenter {
  constructor(scene, x, y) {
    this.scene = scene;
    this.hp    = CONFIG.TOWN_CENTER.HP;
    this.maxHp = CONFIG.TOWN_CENTER.HP;

    this.sprite = scene.add.sprite(x, y, 'town_center');
    this.sprite.setDepth(3);
    this.sprite.setData('entity', this);

    scene.add.text(x, y - 48, '村莊中心', {
      fontSize: '13px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(20);
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
