import { EventBus } from '../utils/EventBus.js';
import { CONFIG }   from '../config.js';

export class HUD {
  constructor(scene) {
    this.scene      = scene;
    this.hpBarWidth = 300;
    this.playerHpBarWidth = 160;
    this._create();
    this._subscribe();
  }

  _create() {
    const s = this.scene;
    const W = CONFIG.WIDTH;
    const H = CONFIG.HEIGHT;

    const txtStyle = {
      fontSize: '17px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2,
    };

    // --- Resource panel (top-left) ---
    s.add.rectangle(130, 70, 250, 115, 0x000000, 0.55).setOrigin(0.5);

    this.woodText  = s.add.text(18, 18, '木材:  10', txtStyle);
    this.stoneText = s.add.text(18, 44, '石材:  5',  txtStyle);
    this.foodText  = s.add.text(18, 70, '糧食:  0',  txtStyle);
    this.goldText  = s.add.text(18, 96, '金幣:  0',  txtStyle);

    // Color accents
    this.woodText.setColor('#90EE90');
    this.stoneText.setColor('#C0C0C0');
    this.foodText.setColor('#FFD700');
    this.goldText.setColor('#FFD700');

    // --- Wave info (top-right) ---
    s.add.rectangle(W - 115, 62, 220, 95, 0x000000, 0.55).setOrigin(0.5);

    this.waveText = s.add.text(W - 18, 18, 'Wave -', {
      fontSize: '22px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(1, 0);

    this.phaseText = s.add.text(W - 18, 50, '準備開始', {
      fontSize: '14px',
      color: '#AAAAAA',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(1, 0);

    this.countdownText = s.add.text(W - 18, 72, '30s', {
      fontSize: '24px',
      color: '#FF8C00',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(1, 0);

    // --- TownCenter HP bar (bottom-center) ---
    s.add.text(W / 2, H - 72, '村莊中心', {
      fontSize: '14px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.hpBarGraphics = s.add.graphics();
    this.hpBarText = s.add.text(W / 2, H - 50, `${CONFIG.TOWN_CENTER.HP} / ${CONFIG.TOWN_CENTER.HP}`, {
      fontSize: '13px',
      color: '#FFFFFF',
    }).setOrigin(0.5).setDepth(1);

    this._drawHpBar(CONFIG.TOWN_CENTER.HP, CONFIG.TOWN_CENTER.HP);

    // --- Player HP bar (bottom-left) ---
    s.add.text(16, H - 72, '勇者', {
      fontSize: '14px',
      color: '#88BBFF',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0, 0);

    this.playerHpBarGraphics = s.add.graphics();
    this.playerHpText = s.add.text(16 + this.playerHpBarWidth / 2, H - 50,
      `${CONFIG.PLAYER.HP} / ${CONFIG.PLAYER.HP}`, {
      fontSize: '13px',
      color: '#FFFFFF',
    }).setOrigin(0.5).setDepth(1);

    this._drawPlayerHpBar(CONFIG.PLAYER.HP, CONFIG.PLAYER.HP);

    // --- Day/Night indicator (top-right, below wave panel) ---
    this.dayNightText = s.add.text(W - 18, 118, '☀ 白天', {
      fontSize: '15px', color: '#FFD700',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(1);

    // --- Build hint (bottom, near center-right) ---
    this.buildHint = s.add.text(W / 2 + 10, H - 16, '[B] 建造選單', {
      fontSize: '13px',
      color: '#886644',
    }).setOrigin(0, 0.5);

    // --- Collect hint ---
    this.collectHint = s.add.text(W / 2 - 10, H - 16, '靠近資源自動採集', {
      fontSize: '13px',
      color: '#555555',
    }).setOrigin(1, 0.5);

    // --- Build failed message ---
    this.buildFailText = s.add.text(W / 2, H - 100, '', {
      fontSize: '16px',
      color: '#FF4444',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(110).setAlpha(0);
  }

  _subscribe() {
    this._onResources    = (r) => this._updateResources(r);
    this._onTownHp       = (hp, max) => this._drawHpBar(hp, max);
    this._onPlayerHp     = (hp, max) => this._drawPlayerHpBar(hp, max);
    this._onBuildFailed  = (msg) => this._showBuildFailed(msg);
    this._onDayPhase     = (phase) => this._updateDayNight(phase);

    EventBus.on('resources_updated', this._onResources);
    EventBus.on('town_hp_changed',   this._onTownHp);
    EventBus.on('player_hp_changed', this._onPlayerHp);
    EventBus.on('build_failed',      this._onBuildFailed);
    EventBus.on('day_phase_changed', this._onDayPhase);
  }

  _updateResources(res) {
    this.woodText.setText(`木材:  ${res.wood}`);
    this.stoneText.setText(`石材:  ${res.stone}`);
    this.foodText.setText(`糧食:  ${res.food}`);
    this.goldText.setText(`金幣:  ${res.gold}`);
  }

  _drawHpBar(hp, maxHp) {
    const W   = CONFIG.WIDTH;
    const H   = CONFIG.HEIGHT;
    const bW  = this.hpBarWidth;
    const bH  = 20;
    const bX  = W / 2 - bW / 2;
    const bY  = H - 60;
    const pct = Math.max(0, hp / maxHp);

    this.hpBarGraphics.clear();

    // Background
    this.hpBarGraphics.fillStyle(0x222222, 0.85);
    this.hpBarGraphics.fillRect(bX, bY, bW, bH);

    // Fill
    const color = pct > 0.5 ? 0x22CC44 : pct > 0.25 ? 0xFFAA00 : 0xFF2222;
    this.hpBarGraphics.fillStyle(color);
    this.hpBarGraphics.fillRect(bX, bY, bW * pct, bH);

    // Border
    this.hpBarGraphics.lineStyle(1, 0x888888, 0.8);
    this.hpBarGraphics.strokeRect(bX, bY, bW, bH);

    if (this.hpBarText) {
      this.hpBarText.setText(`${Math.ceil(hp)} / ${maxHp}`);
    }
  }

  _drawPlayerHpBar(hp, maxHp) {
    const H   = CONFIG.HEIGHT;
    const bW  = this.playerHpBarWidth;
    const bH  = 20;
    const bX  = 16;
    const bY  = H - 60;
    const pct = Math.max(0, hp / maxHp);

    this.playerHpBarGraphics.clear();

    // Background
    this.playerHpBarGraphics.fillStyle(0x222222, 0.85);
    this.playerHpBarGraphics.fillRect(bX, bY, bW, bH);

    // Fill
    const color = pct > 0.5 ? 0x2288FF : pct > 0.25 ? 0xFFAA00 : 0xFF2222;
    this.playerHpBarGraphics.fillStyle(color);
    this.playerHpBarGraphics.fillRect(bX, bY, bW * pct, bH);

    // Border
    this.playerHpBarGraphics.lineStyle(1, 0x6688AA, 0.8);
    this.playerHpBarGraphics.strokeRect(bX, bY, bW, bH);

    if (this.playerHpText) {
      this.playerHpText.setText(`${Math.ceil(hp)} / ${maxHp}`);
    }
  }

  _showBuildFailed(msg) {
    if (!this.buildFailText) return;
    this.buildFailText.setText(msg).setAlpha(1);
    this.scene.tweens.add({
      targets: this.buildFailText,
      alpha: 0,
      delay: 800,
      duration: 400,
    });
  }

  // Called every frame from UIScene to update wave countdown
  update(waveSystem) {
    if (!waveSystem) return;

    const wave      = waveSystem.currentWave;
    const phase     = waveSystem.phase;
    const countdown = Math.ceil(Math.max(0, waveSystem.countdown));

    this.waveText.setText(wave > 0 ? `Wave  ${wave}` : 'Wave  -');

    if (phase === 'prep') {
      this.phaseText.setText('準備開始');
      this.countdownText.setText(`${countdown}s`).setColor('#FF8C00');
    } else if (phase === 'wave') {
      this.phaseText.setText('波次進行中！');
      this.countdownText.setText('');
    } else {
      this.phaseText.setText('下一波倒計時');
      this.countdownText.setText(`${countdown}s`).setColor('#44CC88');
    }
  }

  _updateDayNight(phase) {
    if (!this.dayNightText) return;
    if (phase === 'night') {
      this.dayNightText.setText('☾ 夜晚').setColor('#6688FF');
    } else {
      this.dayNightText.setText('☀ 白天').setColor('#FFD700');
    }
  }

  destroy() {
    EventBus.off('resources_updated', this._onResources);
    EventBus.off('town_hp_changed',   this._onTownHp);
    EventBus.off('player_hp_changed', this._onPlayerHp);
    EventBus.off('build_failed',      this._onBuildFailed);
    EventBus.off('day_phase_changed', this._onDayPhase);
  }
}
