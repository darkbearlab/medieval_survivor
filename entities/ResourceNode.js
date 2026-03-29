import { CONFIG } from '../config.js';

export class ResourceNode {
  constructor(scene, x, y, type) {
    this.scene   = scene;
    this.type    = type;   // 'tree' | 'stone'
    this.depleted = false;

    const key = type === 'tree' ? 'resource_tree' : 'resource_stone';
    this.sprite = scene.add.sprite(x, y, key);
    this.sprite.setDepth(2);
    this.sprite.setData('entity', this);
  }

  collect(economy) {
    if (this.depleted) return false;

    const resource = this.type === 'tree' ? 'wood' : 'stone';
    const amount   = this.type === 'tree'
      ? CONFIG.RESOURCES.TREE_YIELD
      : CONFIG.RESOURCES.STONE_YIELD;

    economy.add(resource, amount);
    this._showFloatingText(`+${amount} ${resource === 'wood' ? '木材' : '石材'}`);

    this.depleted = true;
    this.sprite.setAlpha(0.35);

    this.scene.time.delayedCall(CONFIG.RESOURCES.RESPAWN_TIME, () => {
      this.depleted = false;
      this.sprite.setAlpha(1);
    });

    return true;
  }

  _showFloatingText(msg) {
    const x = this.sprite.x;
    const y = this.sprite.y;
    const t = this.scene.add.text(x, y - 10, msg, {
      fontSize: '14px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(50);

    this.scene.tweens.add({
      targets: t,
      y: y - 55,
      alpha: 0,
      duration: 1400,
      onComplete: () => t.destroy(),
    });
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
