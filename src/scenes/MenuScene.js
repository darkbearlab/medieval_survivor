import { CONFIG } from '../config.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { WIDTH, HEIGHT } = CONFIG;

    // Background gradient (simulated with layered rectangles)
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x0d1b2a);
    this.add.rectangle(WIDTH / 2, HEIGHT - 100, WIDTH, 200, 0x1a0a00, 0.5);

    // Title
    this.add.text(WIDTH / 2, HEIGHT / 2 - 150, 'MEDIEVAL SURVIVOR', {
      fontSize: '52px',
      fontFamily: 'Georgia, "Times New Roman", serif',
      color: '#FFD700',
      stroke: '#8B0000',
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, HEIGHT / 2 - 90, '中世紀生存塔防', {
      fontSize: '22px',
      fontFamily: 'serif',
      color: '#C8A832',
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, HEIGHT / 2 - 55, '保護村莊，抵禦波次攻擊', {
      fontSize: '16px',
      color: '#888888',
    }).setOrigin(0.5);

    // Start button
    const btnBg = this.add.rectangle(WIDTH / 2, HEIGHT / 2 + 30, 220, 58, 0x8B0000)
      .setInteractive({ useHandCursor: true });
    const btnText = this.add.text(WIDTH / 2, HEIGHT / 2 + 30, '開始遊戲', {
      fontSize: '26px',
      color: '#FFD700',
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(0xAA1111);
      btnText.setScale(1.05);
    });
    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(0x8B0000);
      btnText.setScale(1);
    });
    btnBg.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // Controls
    const ctrlStyle = { fontSize: '14px', color: '#666666' };
    this.add.text(WIDTH / 2, HEIGHT - 90, '操作說明', {
      fontSize: '15px', color: '#888888',
    }).setOrigin(0.5);
    this.add.text(WIDTH / 2, HEIGHT - 65,
      'WASD / 方向鍵 移動   左鍵點擊採集資源（靠近後）   消滅敵人保護村莊中心',
      ctrlStyle).setOrigin(0.5);

    // Pulsing border effect on button
    this.tweens.add({
      targets: btnBg,
      scaleX: 1.02,
      scaleY: 1.02,
      yoyo: true,
      repeat: -1,
      duration: 900,
    });
  }
}
