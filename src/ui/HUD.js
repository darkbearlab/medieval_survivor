import { EventBus } from '../utils/EventBus.js';
import { CONFIG }   from '../config.js';

export class HUD {
  constructor(scene) {
    this.scene = scene;
    this._create();
    this._subscribe();
  }

  _create() {
    const s = this.scene;
    const W = CONFIG.WIDTH;
    const H = CONFIG.HEIGHT;

    // ── Town Center HP — thin strip at very top edge ─────────────────────────
    this._tcBarW = 280;
    this._tcBarH = 16;
    this._tcBarX = W / 2 - this._tcBarW / 2;
    this._tcBarY = 2;

    this._tcHpGraphics = s.add.graphics().setDepth(92).setScrollFactor(0);
    this._tcHpText = s.add.text(W / 2, this._tcBarY + this._tcBarH / 2,
      `${CONFIG.TOWN_CENTER.HP} / ${CONFIG.TOWN_CENTER.HP}`, {
        fontSize: '11px', color: '#FFFFFF',
        stroke: '#000000', strokeThickness: 1,
      }).setOrigin(0.5).setDepth(93).setScrollFactor(0);

    this._tcLabel = s.add.text(W / 2, this._tcBarY + this._tcBarH + 3, '村莊中心', {
      fontSize: '11px', color: '#FFD700',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0.5).setDepth(92).setScrollFactor(0);

    this._drawTcBar(CONFIG.TOWN_CENTER.HP, CONFIG.TOWN_CENTER.HP);

    // ── Player HP — top-left ─────────────────────────────────────────────────
    this._playerBarW = 160;
    this._playerBarH = 14;
    this._playerBarX = 10;
    this._playerBarY = 26;

    s.add.text(10, 8, '勇者', {
      fontSize: '13px', color: '#88BBFF',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0, 0).setDepth(92).setScrollFactor(0);

    this._playerHpGraphics = s.add.graphics().setDepth(92).setScrollFactor(0);
    this._playerHpText = s.add.text(
      this._playerBarX + this._playerBarW / 2,
      this._playerBarY + this._playerBarH / 2,
      `${CONFIG.PLAYER.HP} / ${CONFIG.PLAYER.HP}`, {
        fontSize: '11px', color: '#FFFFFF',
        stroke: '#000000', strokeThickness: 1,
      }).setOrigin(0.5).setDepth(93).setScrollFactor(0);

    this._drawPlayerBar(CONFIG.PLAYER.HP, CONFIG.PLAYER.HP);

    // ── Wave info — top-right ─────────────────────────────────────────────────
    s.add.rectangle(W - 115, 68, 220, 120, 0x000000, 0.55)
      .setDepth(90).setScrollFactor(0);

    this.waveText = s.add.text(W - 18, 18, 'Wave -', {
      fontSize: '22px', color: '#FFD700',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(91).setScrollFactor(0);

    this.phaseText = s.add.text(W - 18, 50, '準備開始', {
      fontSize: '14px', color: '#AAAAAA',
      stroke: '#000000', strokeThickness: 1,
    }).setOrigin(1, 0).setDepth(91).setScrollFactor(0);

    this.countdownText = s.add.text(W - 18, 72, '30s', {
      fontSize: '24px', color: '#FF8C00',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(91).setScrollFactor(0);

    // ── Day/Night indicator — top-right, below wave ───────────────────────────
    this.dayNightText = s.add.text(W - 18, 118, '☀ 白天', {
      fontSize: '15px', color: '#FFD700',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(91).setScrollFactor(0);

    // ── Game timer (timed mode only) ──────────────────────────────────────────
    this.gameTimerText = s.add.text(W - 18, 142, '', {
      fontSize: '16px', color: '#44FF88',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(91).setScrollFactor(0).setVisible(false);

    // ── Build-failed flash message ─────────────────────────────────────────────
    this.buildFailText = s.add.text(W / 2, H - 110, '', {
      fontSize: '16px', color: '#FF4444',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(110).setAlpha(0).setScrollFactor(0);
  }

  _subscribe() {
    this._onTownHp   = (hp, max) => this._drawTcBar(hp, max);
    this._onPlayerHp = (hp, max) => this._drawPlayerBar(hp, max);
    this._onBuildFail = (msg)    => this._showBuildFailed(msg);
    this._onDayPhase  = (phase)  => this._updateDayNight(phase);

    EventBus.on('town_hp_changed',   this._onTownHp);
    EventBus.on('player_hp_changed', this._onPlayerHp);
    EventBus.on('build_failed',      this._onBuildFail);
    EventBus.on('day_phase_changed', this._onDayPhase);
  }

  // ── TC HP bar (top-center strip) ─────────────────────────────────────────

  _drawTcBar(hp, maxHp) {
    const g   = this._tcHpGraphics;
    const bX  = this._tcBarX;
    const bY  = this._tcBarY;
    const bW  = this._tcBarW;
    const bH  = this._tcBarH;
    const pct = Math.max(0, hp / maxHp);

    g.clear();
    g.fillStyle(0x111111, 0.85);
    g.fillRect(bX, bY, bW, bH);
    const color = pct > 0.5 ? 0x22CC44 : pct > 0.25 ? 0xFFAA00 : 0xFF2222;
    g.fillStyle(color, 1);
    g.fillRect(bX, bY, bW * pct, bH);
    g.lineStyle(1, 0x555555, 0.9);
    g.strokeRect(bX, bY, bW, bH);

    if (this._tcHpText) this._tcHpText.setText(`${Math.ceil(hp)} / ${maxHp}`);
  }

  // ── Player HP bar (top-left) ──────────────────────────────────────────────

  _drawPlayerBar(hp, maxHp) {
    const g   = this._playerHpGraphics;
    const bX  = this._playerBarX;
    const bY  = this._playerBarY;
    const bW  = this._playerBarW;
    const bH  = this._playerBarH;
    const pct = Math.max(0, hp / maxHp);

    g.clear();
    g.fillStyle(0x111111, 0.85);
    g.fillRect(bX, bY, bW, bH);
    const color = pct > 0.5 ? 0x2288FF : pct > 0.25 ? 0xFFAA00 : 0xFF2222;
    g.fillStyle(color, 1);
    g.fillRect(bX, bY, bW * pct, bH);
    g.lineStyle(1, 0x4466AA, 0.8);
    g.strokeRect(bX, bY, bW, bH);

    if (this._playerHpText) this._playerHpText.setText(`${Math.ceil(hp)} / ${maxHp}`);
  }

  // ── Wave countdown + game timer (called every frame from UIScene) ────────

  update(waveSystem, gameMode, gameTimerMs) {
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

    // Game timer (timed mode)
    if (gameMode === 'timed' && gameTimerMs !== null && gameTimerMs !== undefined) {
      const remaining = Math.max(0, gameTimerMs);
      const totalSec  = Math.ceil(remaining / 1000);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      const color = remaining > 240000 ? '#44FF88' : remaining > 120000 ? '#FFAA00' : '#FF4444';
      this.gameTimerText
        .setText(`⏱ ${m}:${String(s).padStart(2, '0')}`)
        .setColor(color)
        .setVisible(true);
    } else {
      this.gameTimerText.setVisible(false);
    }
  }

  // ── Build-failed message ─────────────────────────────────────────────────

  _showBuildFailed(msg) {
    if (!this.buildFailText) return;
    this.buildFailText.setText(msg).setAlpha(1);
    this.scene.tweens.add({
      targets: this.buildFailText, alpha: 0, delay: 800, duration: 400,
    });
  }

  // ── Day/Night ────────────────────────────────────────────────────────────

  _updateDayNight(phase) {
    if (!this.dayNightText) return;
    if (phase === 'night') {
      this.dayNightText.setText('☾ 夜晚').setColor('#6688FF');
    } else {
      this.dayNightText.setText('☀ 白天').setColor('#FFD700');
    }
  }

  destroy() {
    EventBus.off('town_hp_changed',   this._onTownHp);
    EventBus.off('player_hp_changed', this._onPlayerHp);
    EventBus.off('build_failed',      this._onBuildFail);
    EventBus.off('day_phase_changed', this._onDayPhase);
  }
}
