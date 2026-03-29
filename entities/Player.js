import { CONFIG }   from '../config.js';
import { EventBus } from '../utils/EventBus.js';

export class Player {
  constructor(scene, x, y, characterKey = 'ranger') {
    this.scene        = scene;
    this.characterKey = characterKey;

    const charCfg = CONFIG.CHARACTERS[characterKey] || CONFIG.CHARACTERS.ranger;
    const weapKey  = charCfg.STARTING_WEAPON || 'hunter_bow';
    const weapCfg  = CONFIG.WEAPONS[weapKey]  || CONFIG.WEAPONS.hunter_bow;

    this.sprite = scene.physics.add.sprite(x, y, charCfg.TEXTURE || 'player');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDepth(10);
    this.sprite.setData('entity', this);

    this.hp          = charCfg.HP;
    this.maxHp       = charCfg.HP;
    this.isDead      = false;

    // Flat bonuses (added by buildings at runtime)
    this.defense     = 0;   // flat damage subtraction (blacksmith)

    // Character-specific stats (survivability — stays on character)
    this.defensePct  = charCfg.DEFENSE_PCT || 0;
    this.speed       = charCfg.SPEED;

    // damageMult is a character multiplier applied to all equipped weapons
    this.weaponKey   = weapKey;    // starting weapon key (kept for reference/UI)
    this.damageMult  = weapCfg.DAMAGE_MULT || 1.0;

    // Equipped weapons — GameScene populates this after Player is created
    this.equippedWeapons = [];
  }

  update(cursors) {
    if (this.isDead) return;

    const speed = this.speed;
    let vx = 0, vy = 0;

    if (cursors.left.isDown  || cursors.leftArrow.isDown)  vx = -speed;
    if (cursors.right.isDown || cursors.rightArrow.isDown) vx =  speed;
    if (cursors.up.isDown    || cursors.upArrow.isDown)    vy = -speed;
    if (cursors.down.isDown  || cursors.downArrow.isDown)  vy =  speed;

    if (vx !== 0 && vy !== 0) { vx *= 0.7071; vy *= 0.7071; }

    if (this.sprite.body) this.sprite.body.setVelocity(vx, vy);

    if (vx < 0) this.sprite.setFlipX(true);
    if (vx > 0) this.sprite.setFlipX(false);
  }

  takeDamage(amount) {
    if (this.isDead) return;
    // 1) flat reduction from buildings
    // 2) percentage reduction from warrior passive
    const afterFlat = Math.max(0, amount - this.defense);
    const effective = Math.max(1, Math.round(afterFlat * (1 - this.defensePct)));
    this.hp = Math.max(0, this.hp - effective);
    EventBus.emit('player_hp_changed', this.hp, this.maxHp);

    this.sprite.setTint(0xFF4444);
    this.scene.time.delayedCall(150, () => {
      if (this.sprite && this.sprite.active) this.sprite.clearTint();
    });

    if (this.hp <= 0) this._die();
  }

  _die() {
    if (this.isDead) return;
    this.isDead = true;
    if (this.sprite.body) {
      this.sprite.body.setVelocity(0, 0);
      this.sprite.body.enable = false;
    }
    this.scene.tweens.add({
      targets: this.sprite, alpha: 0, duration: 600,
      onComplete: () => { this.scene.gameOver(); },
    });
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
