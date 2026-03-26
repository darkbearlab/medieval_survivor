import { CONFIG } from '../config.js';
import { EventBus } from '../utils/EventBus.js';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
  }

  init(data) {
    this.waveReached  = data.wave         || 0;
    this.timeLimit    = data.timeLimit    || CONFIG.GAME_MODES.TIMED.DURATION;
    this.characterKey = data.characterKey || 'ranger';
    this.gameMode     = data.gameMode     || 'timed';

    const SAVE_KEY = 'medieval_survivor_save';
    let save = {};
    try { save = JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch (e) { save = {}; }
    const prevBest = save.victoryBest?.waveReached || 0;
    this.isNewRecord = this.waveReached > prevBest;
    this.prevBest    = prevBest;
    if (this.isNewRecord) {
      save.victoryBest = { waveReached: this.waveReached };
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    }
  }

  create() {
    const { WIDTH: W, HEIGHT: H } = CONFIG;

    EventBus.removeAllListeners();

    // Background
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88);

    // Gold particle burst (simple tween stars)
    for (let i = 0; i < 18; i++) {
      const star = this.add.text(
        Phaser.Math.Between(W / 2 - 320, W / 2 + 320),
        Phaser.Math.Between(H / 2 - 200, H / 2 + 200),
        '★', { fontSize: '20px', color: '#FFD700' }
      ).setAlpha(0).setDepth(1);
      this.tweens.add({
        targets: star, alpha: 1, delay: Phaser.Math.Between(0, 600),
        duration: 400, yoyo: true, repeat: -1,
        repeatDelay: Phaser.Math.Between(300, 1200),
      });
    }

    // ── Title ──────────────────────────────────────────────────────────────
    this.add.text(W / 2, 100, '勝　利　！', {
      fontSize: '64px', fontFamily: 'Georgia, serif',
      color: '#FFD700', stroke: '#AA6600', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(5);

    const timedMin = Math.floor(this.timeLimit / 60);
    this.add.text(W / 2, 182, `成功堅守村莊 ${timedMin} 分鐘！`, {
      fontSize: '24px', color: '#FFFFFF',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(5);

    this.add.text(W / 2, 226, `抵禦至第  ${this.waveReached}  波`, {
      fontSize: '22px', color: '#FFCC44',
    }).setOrigin(0.5).setDepth(5);

    if (this.isNewRecord) {
      this.add.text(W / 2, 260, '🏆 新紀錄！', {
        fontSize: '16px', color: '#FFD700', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(5);
    } else if (this.prevBest > 0) {
      this.add.text(W / 2, 260, `最高紀錄：第 ${this.prevBest} 波`, {
        fontSize: '13px', color: '#888888',
      }).setOrigin(0.5).setDepth(5);
    }

    // ── Separator ──────────────────────────────────────────────────────────
    const g = this.add.graphics().setDepth(5);
    g.lineStyle(1, 0x886600, 0.7);
    g.lineBetween(W / 2 - 300, 284, W / 2 + 300, 284);

    // Character + mode summary
    const charName = CONFIG.CHARACTERS[this.characterKey]?.name || this.characterKey;
    this.add.text(W / 2, 306, `角色：${charName}`, {
      fontSize: '16px', color: '#AAAAAA',
    }).setOrigin(0.5).setDepth(5);

    // ── Buttons ────────────────────────────────────────────────────────────
    const retryBtn = this.add.rectangle(W / 2 - 140, 420, 220, 50, 0x8B6600)
      .setInteractive({ useHandCursor: true }).setDepth(5);
    this.add.text(W / 2 - 140, 420, '再戰一局', {
      fontSize: '22px', color: '#FFD700',
    }).setOrigin(0.5).setDepth(6);
    retryBtn.on('pointerover', () => retryBtn.setFillStyle(0xBB8800));
    retryBtn.on('pointerout',  () => retryBtn.setFillStyle(0x8B6600));
    retryBtn.on('pointerdown', () => {
      this.scene.stop('VictoryScene');
      this.scene.start('GameScene', {
        characterKey: this.characterKey,
        gameMode:     this.gameMode,
        timeLimit:    this.timeLimit,
      });
    });

    const menuBtn = this.add.rectangle(W / 2 + 140, 420, 220, 50, 0x1a2a3a)
      .setStrokeStyle(1, 0x446688).setInteractive({ useHandCursor: true }).setDepth(5);
    this.add.text(W / 2 + 140, 420, '回到主選單', {
      fontSize: '22px', color: '#88CCFF',
    }).setOrigin(0.5).setDepth(6);
    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x223344));
    menuBtn.on('pointerout',  () => menuBtn.setFillStyle(0x1a2a3a));
    menuBtn.on('pointerdown', () => {
      this.scene.stop('VictoryScene');
      this.scene.start('MenuScene');
    });

    const selectBtn = this.add.rectangle(W / 2, 488, 220, 38, 0x0d1b2a)
      .setStrokeStyle(1, 0x336633).setInteractive({ useHandCursor: true }).setDepth(5);
    this.add.text(W / 2, 488, '換個角色', {
      fontSize: '16px', color: '#88CC88',
    }).setOrigin(0.5).setDepth(6);
    selectBtn.on('pointerover', () => selectBtn.setFillStyle(0x162a16));
    selectBtn.on('pointerout',  () => selectBtn.setFillStyle(0x0d1b2a));
    selectBtn.on('pointerdown', () => {
      this.scene.stop('VictoryScene');
      this.scene.start('CharacterSelectScene');
    });

    // Fade in
    this.cameras.main.setAlpha(0);
    this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: 700 });
  }
}
