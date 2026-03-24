import { CONFIG } from '../config.js';
import { EventBus } from '../utils/EventBus.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.waveReached = data.wave || 0;
  }

  create() {
    const { WIDTH, HEIGHT } = CONFIG;

    EventBus.removeAllListeners();

    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.88);

    this.add.text(WIDTH / 2, HEIGHT / 2 - 130, 'GAME OVER', {
      fontSize: '60px',
      fontFamily: 'Georgia, serif',
      color: '#FF2222',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, HEIGHT / 2 - 55, '村莊已淪陷！', {
      fontSize: '26px',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, HEIGHT / 2 - 10, `成功抵禦到第  ${this.waveReached}  波`, {
      fontSize: '30px',
      color: '#FFD700',
    }).setOrigin(0.5);

    // Retry button
    const btn = this.add.rectangle(WIDTH / 2, HEIGHT / 2 + 80, 220, 58, 0x8B0000)
      .setInteractive({ useHandCursor: true });
    const btnText = this.add.text(WIDTH / 2, HEIGHT / 2 + 80, '再試一次', {
      fontSize: '26px',
      color: '#FFD700',
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setFillStyle(0xAA1111));
    btn.on('pointerout', () => btn.setFillStyle(0x8B0000));
    btn.on('pointerdown', () => {
      this.scene.stop('GameOverScene');
      this.scene.start('MenuScene');
    });

    // Fade in
    this.cameras.main.setAlpha(0);
    this.tweens.add({
      targets: this.cameras.main,
      alpha: 1,
      duration: 600,
    });
  }
}
