/**
 * OffensiveEditorOverlay — in-game DOM overlay for editing custom large offensives.
 * Singleton exported as `offensiveEditorOverlay`.
 *
 * Usage:
 *   offensiveEditorOverlay.toggle(fromGame);   // open / close
 *   offensiveEditorOverlay.show(fromGame);
 *   offensiveEditorOverlay.hide();
 *
 * When `fromGame` is true the overlay emits EventBus events so GameScene can
 * freeze physics while the editor is open.
 */

import { EventBus } from '../utils/EventBus.js';

const STORAGE_KEY = 'medieval_survivor_offensives';

// ── helpers ───────────────────────────────────────────────────────────────────
function genId() {
  return 'off_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}
function esc(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function triggerWave(day, timing) {
  const d = parseInt(day) || 1;
  if (timing === 'wave1') return (d - 1) * 3 + 1;
  if (timing === 'wave2') return (d - 1) * 3 + 2;
  if (timing === 'any')   return (d - 1) * 3 + 1;
  return d * 3;  // night
}

const TIMING_LABEL = { wave1:'☀ 白天第1波', wave2:'☀ 白天第2波', night:'🌙 夜晚波', any:'✦ 每波' };
const DIR_LABEL    = { random:'🎲 隨機', north:'↑ 北方', south:'↓ 南方', west:'← 西方', east:'→ 東方' };
const UNIT_EMOJI   = { bandit:'🗡', archer:'🏹', heavy:'🛡', mage:'🔮' };
const UNIT_NAME    = { bandit:'強盜', archer:'弓箭手', heavy:'重甲兵', mage:'法師' };

// ── CSS (injected once) ───────────────────────────────────────────────────────
const CSS = `
#oeo-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.80);
  z-index: 9000; display: flex; align-items: center; justify-content: center;
  padding: 12px; font-family: 'Segoe UI','Microsoft JhengHei',sans-serif;
}
.oeo-panel {
  background: #22190e; border: 1px solid #7a5c30; border-radius: 8px;
  width: 100%; max-width: 740px; max-height: 92vh;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 12px 50px rgba(0,0,0,.8);
}
.oeo-header {
  padding: 12px 16px; border-bottom: 1px solid #5a4020;
  display: flex; align-items: center; gap: 10px; flex-shrink: 0;
}
.oeo-header h2 { font-size: 16px; color: #f0c060; flex: 1; letter-spacing:1px; }
.oeo-header-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.oeo-toolbar {
  padding: 8px 14px; border-bottom: 1px solid #3a2810;
  display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap;
}
.oeo-list {
  flex: 1; overflow-y: auto; padding: 10px 14px;
  display: flex; flex-direction: column; gap: 8px;
}
.oeo-footer {
  padding: 7px 14px; border-top: 1px solid #3a2810;
  display: flex; gap: 14px; align-items: center; flex-shrink: 0;
  font-size: 12px; color: #8a7860; flex-wrap: wrap;
}
.oeo-footer strong { color: #d8c8a8; }

/* Buttons */
.oeo-btn {
  padding: 5px 13px; border: 1px solid; border-radius: 4px; font-size: 12px;
  cursor: pointer; font-family: inherit; transition: background .15s;
}
.oeo-sm { padding: 3px 9px; font-size: 11px; }
.oeo-btn-gold  { background: rgba(212,164,58,.15); border-color:#d4a43a; color:#d4a43a; }
.oeo-btn-gold:hover  { background: rgba(212,164,58,.3); color:#f0c060; }
.oeo-btn-green { background: rgba(58,138,58,.15);  border-color:#3a8a3a; color:#55cc55; }
.oeo-btn-green:hover { background: rgba(58,138,58,.3); }
.oeo-btn-blue  { background: rgba(34,85,170,.2);   border-color:#2255aa; color:#4488dd; }
.oeo-btn-blue:hover  { background: rgba(34,85,170,.35); }
.oeo-btn-red   { background: rgba(204,51,51,.15);  border-color:#cc3333; color:#ff5555; }
.oeo-btn-red:hover   { background: rgba(204,51,51,.3); }
.oeo-btn-dim   { background: rgba(90,64,32,.2);    border-color:#5a4020; color:#8a7860; }
.oeo-btn-dim:hover   { background: rgba(90,64,32,.4); color:#d8c8a8; }

/* Cards */
.oeo-empty {
  text-align: center; padding: 40px 20px; color: #5a4820;
  border: 2px dashed #3a2810; border-radius: 6px;
}
.oeo-card {
  background: #2a1f10; border: 1px solid #3a2810; border-radius: 5px;
  padding: 10px 12px; display: grid; grid-template-columns: 1fr auto;
  gap: 8px; transition: border-color .15s;
}
.oeo-card:hover { border-color: #5a4020; }
.oeo-card.disabled { opacity: .45; }
.oeo-card-name {
  font-size: 15px; font-weight: bold; color: #f0c060;
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.oeo-tag {
  font-size: 10px; font-weight: normal; padding: 1px 5px;
  border-radius: 3px; border: 1px solid;
}
.oeo-tag-night { background: rgba(51,68,102,.4); border-color:#6688cc; color:#6688cc; }
.oeo-tag-day1  { background: rgba(212,164,58,.12); border-color:#d4a43a; color:#d4a43a; }
.oeo-tag-day2  { background: rgba(240,192,96,.12); border-color:#f0c060; color:#f0c060; }
.oeo-tag-any   { background: rgba(90,64,32,.3);    border-color:#5a4020; color:#8a7860; }
.oeo-meta { display: flex; gap: 10px; font-size: 12px; color: #6a5840; flex-wrap: wrap; }
.oeo-meta strong { color: #a8987a; }
.oeo-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
.oeo-chip {
  font-size: 11px; padding: 1px 7px; border-radius: 10px;
  border: 1px solid #5a4020; background: rgba(90,64,32,.2); color: #a89878;
}
.oeo-chip-bandit { border-color:#886644; color:#ccaa88; }
.oeo-chip-archer { border-color:#448844; color:#88cc88; }
.oeo-chip-heavy  { border-color:#886688; color:#ccaacc; }
.oeo-chip-mage   { border-color:#4466aa; color:#88aadd; }
.oeo-chip-elite  { border-color:#cc9900; color:#ffcc44; }
.oeo-card-actions {
  display: flex; flex-direction: column; gap: 5px; align-items: flex-end;
}
.oeo-action-row { display: flex; gap: 5px; }

/* Toggle */
.oeo-toggle {
  position:relative; width:38px; height:20px; cursor:pointer; flex-shrink:0;
}
.oeo-toggle input { display:none; }
.oeo-toggle-track {
  position:absolute; inset:0; background:#3a2a14;
  border:1px solid #5a4020; border-radius:10px; transition:background .2s;
}
.oeo-toggle-thumb {
  position:absolute; top:3px; left:3px; width:12px; height:12px;
  background:#6a5840; border-radius:50%; transition:transform .2s,background .2s;
}
.oeo-toggle input:checked ~ .oeo-toggle-track  { background:rgba(58,138,58,.35); border-color:#3a8a3a; }
.oeo-toggle input:checked ~ .oeo-toggle-thumb { transform:translateX(18px); background:#55cc55; }

/* Modal */
.oeo-modal-bg {
  position: absolute; inset: 0; background: rgba(0,0,0,.6);
  display: flex; align-items: center; justify-content: center; padding: 12px; z-index: 1;
}
.oeo-modal {
  background: #1e1508; border: 1px solid #7a5c30; border-radius: 7px;
  width: 100%; max-width: 560px; max-height: 88vh; overflow-y: auto;
  box-shadow: 0 8px 40px rgba(0,0,0,.8);
}
.oeo-modal-header {
  padding: 12px 16px; border-bottom: 1px solid #3a2810;
  display: flex; align-items: center; gap: 10px;
}
.oeo-modal-header h3 { font-size: 15px; color: #f0c060; flex: 1; }
.oeo-modal-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; }
.oeo-modal-footer {
  padding: 10px 16px; border-top: 1px solid #3a2810;
  display: flex; justify-content: flex-end; gap: 8px;
}

/* Form */
.oeo-section-title {
  font-size: 10px; text-transform: uppercase; letter-spacing:1.5px;
  color: #6a5840; border-bottom: 1px solid #2a1e0c; padding-bottom: 4px;
}
.oeo-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.oeo-form-group { display: flex; flex-direction: column; gap: 4px; }
.oeo-full { grid-column: 1 / -1; }
.oeo-form-group label { font-size: 11px; color: #6a5840; }
.oeo-modal input[type=text],
.oeo-modal input[type=number],
.oeo-modal select,
.oeo-modal textarea {
  background: rgba(90,64,32,.2); border: 1px solid #3a2810; border-radius: 4px;
  color: #f0e8d0; padding: 6px 9px; font-size: 12px; font-family: inherit;
  width: 100%; outline: none; transition: border-color .15s; box-sizing: border-box;
}
.oeo-modal input:focus,
.oeo-modal select:focus,
.oeo-modal textarea:focus { border-color: #d4a43a; }
.oeo-modal select option { background: #1e1508; }
.oeo-radio-group { display: flex; gap: 6px; flex-wrap: wrap; }
.oeo-radio-opt {
  display: flex; align-items: center; gap: 4px; padding: 4px 9px;
  background: rgba(90,64,32,.2); border: 1px solid #3a2810; border-radius: 4px;
  cursor: pointer; font-size: 12px; color: #a89878; transition: border-color .15s;
}
.oeo-radio-opt input { width: auto; margin: 0; accent-color: #d4a43a; }
.oeo-radio-opt:has(input:checked) { border-color: #d4a43a; background: rgba(212,164,58,.12); color:#f0c060; }
.oeo-unit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.oeo-unit-row {
  display: flex; align-items: center; gap: 8px; padding: 6px 10px;
  background: rgba(90,64,32,.15); border: 1px solid #3a2810; border-radius: 4px;
}
.oeo-unit-row span { font-size: 13px; flex: 1; color: #a89878; }
.oeo-unit-row input { width: 56px !important; text-align: center; padding: 3px 5px !important; }
.oeo-elite-box {
  background: rgba(200,160,0,.07); border: 1px solid rgba(200,160,0,.25);
  border-radius: 4px; padding: 10px 12px; color: #a89878; font-size: 13px;
}
.oeo-elite-box input[type=checkbox] { accent-color: #d4a43a; }
.oeo-preview {
  background: rgba(212,164,58,.07); border: 1px solid rgba(212,164,58,.2);
  border-radius: 4px; padding: 8px 12px; font-size: 12px; color: #6a5840;
}
.oeo-preview strong { color: #d4a43a; }

/* Toast */
#oeo-toast {
  position: fixed; bottom: 20px; right: 20px;
  background: #1e1508; border: 1px solid #3a8a3a; color: #55cc55;
  padding: 8px 16px; border-radius: 5px; font-size: 12px;
  z-index: 9999; pointer-events: none;
  opacity: 0; transform: translateY(8px); transition: opacity .2s, transform .2s;
  font-family: 'Segoe UI','Microsoft JhengHei',sans-serif;
}
#oeo-toast.show { opacity: 1; transform: translateY(0); }

/* Scrollbar */
.oeo-list::-webkit-scrollbar,
.oeo-modal::-webkit-scrollbar { width: 5px; }
.oeo-list::-webkit-scrollbar-track,
.oeo-modal::-webkit-scrollbar-track { background: #1a1008; }
.oeo-list::-webkit-scrollbar-thumb,
.oeo-modal::-webkit-scrollbar-thumb { background: #3a2810; border-radius: 3px; }
`;

// ── Main class ─────────────────────────────────────────────────────────────────
class OffensiveEditorOverlay {
  constructor() {
    this._el         = null;
    this._toast      = null;
    this._toastTimer = null;
    this._visible    = false;
    this._fromGame   = false;
    this._offensives = [];
    this._editingId  = null;
    this._keyBlocker = null;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  show(fromGame = false) {
    this._fromGame = fromGame;
    if (!this._el) this._build();
    this._loadState();
    this._render();
    this._el.style.display = 'flex';
    this._visible = true;
    if (fromGame) EventBus.emit('offensive_editor_opened');
  }

  hide() {
    if (!this._el) return;
    this._closeModal();
    this._el.style.display = 'none';
    this._visible = false;
    if (this._fromGame) EventBus.emit('offensive_editor_closed');
    this._fromGame = false;
  }

  toggle(fromGame = false) {
    if (this._visible) this.hide();
    else this.show(fromGame);
  }

  // ── Build DOM ───────────────────────────────────────────────────────────────

  _build() {
    // Inject CSS once
    if (!document.getElementById('oeo-style')) {
      const style = document.createElement('style');
      style.id    = 'oeo-style';
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    // Toast element
    if (!document.getElementById('oeo-toast')) {
      this._toast = document.createElement('div');
      this._toast.id = 'oeo-toast';
      document.body.appendChild(this._toast);
    } else {
      this._toast = document.getElementById('oeo-toast');
    }

    // Overlay
    this._el = document.createElement('div');
    this._el.id = 'oeo-overlay';
    this._el.innerHTML = this._getHTML();
    document.body.appendChild(this._el);

    // Close on backdrop click
    this._el.addEventListener('click', (e) => {
      if (e.target === this._el) this.hide();
    });

    // Block ALL keyboard events from reaching Phaser while overlay is visible.
    // Use capture phase (true) so we intercept before Phaser's document listeners.
    this._keyBlocker = (e) => {
      if (!this._visible) return;
      if (e.key === 'Escape') {
        const modal = this._el.querySelector('#oeo-modal-bg');
        if (modal && modal.style.display !== 'none') this._closeModal();
        else this.hide();
      }
      // Stop every key event from propagating to Phaser
      e.stopImmediatePropagation();
    };
    document.addEventListener('keydown', this._keyBlocker, true);

    this._wireEvents();
  }

  _getHTML() {
    return `
<div class="oeo-panel">
  <div class="oeo-header">
    <h2>⚔ 大型攻勢編輯器</h2>
    <div class="oeo-header-btns">
      <button class="oeo-btn oeo-btn-blue"  id="oeo-import">📂 匯入</button>
      <button class="oeo-btn oeo-btn-gold"  id="oeo-export">💾 匯出</button>
      <button class="oeo-btn oeo-btn-green" id="oeo-apply">🎮 套用至遊戲</button>
      <button class="oeo-btn oeo-btn-dim"   id="oeo-close">✕ 關閉</button>
    </div>
  </div>
  <div class="oeo-toolbar">
    <button class="oeo-btn oeo-btn-gold" id="oeo-add">＋ 新增攻勢</button>
    <button class="oeo-btn oeo-btn-dim"  id="oeo-sort">⇅ 依天數排序</button>
    <div style="margin-left:auto;display:flex;gap:6px">
      <button class="oeo-btn oeo-btn-dim oeo-sm" id="oeo-enable-all">全部啟用</button>
      <button class="oeo-btn oeo-btn-dim oeo-sm" id="oeo-disable-all">全部停用</button>
      <button class="oeo-btn oeo-btn-red oeo-sm" id="oeo-clear-all">清除全部</button>
    </div>
  </div>
  <div class="oeo-list" id="oeo-list"></div>
  <div class="oeo-footer">
    <span>攻勢數量：<strong id="oeo-stat-count">0</strong></span>
    <span>已啟用：<strong id="oeo-stat-enabled">0</strong></span>
    <span id="oeo-stat-storage">—</span>
    <span style="margin-left:auto;font-size:11px;color:#3a2810">匯出 JSON 可長期保存，下次匯入後按「套用至遊戲」生效</span>
  </div>
  <input type="file" id="oeo-file-input" accept=".json" style="display:none">

  <!-- Edit/Add Modal (positioned inside panel so backdrop blur stays in-panel) -->
  <div class="oeo-modal-bg" id="oeo-modal-bg" style="display:none">
    <div class="oeo-modal">
      <div class="oeo-modal-header">
        <h3 id="oeo-modal-title">新增攻勢</h3>
        <button class="oeo-btn oeo-btn-dim oeo-sm" id="oeo-modal-close">✕</button>
      </div>
      <div class="oeo-modal-body">

        <div class="oeo-section-title">基本資訊</div>
        <div class="oeo-form-group oeo-full">
          <label>攻勢名稱（顯示在遊戲警告文字中）</label>
          <input type="text" id="oeo-f-name" placeholder="例：北方蠻族大軍" maxlength="30">
        </div>
        <div class="oeo-form-group oeo-full">
          <label>備註（選填，僅在此編輯器中顯示）</label>
          <textarea id="oeo-f-desc" rows="2" placeholder="設計說明..."></textarea>
        </div>

        <div class="oeo-section-title">觸發時機</div>
        <div class="oeo-form-row">
          <div class="oeo-form-group">
            <label>第幾天觸發（1天 = 3波）</label>
            <input type="number" id="oeo-f-day" min="1" max="99" value="3">
          </div>
          <div class="oeo-form-group">
            <label>延遲秒數後才出現</label>
            <input type="number" id="oeo-f-delay" min="0" max="60" value="5">
          </div>
        </div>
        <div class="oeo-form-group">
          <label>當天的哪一波</label>
          <div class="oeo-radio-group">
            <label class="oeo-radio-opt"><input type="radio" name="oeo-timing" value="wave1"> ☀ 白天第1波</label>
            <label class="oeo-radio-opt"><input type="radio" name="oeo-timing" value="wave2"> ☀ 白天第2波</label>
            <label class="oeo-radio-opt"><input type="radio" name="oeo-timing" value="night" checked> 🌙 夜晚波</label>
            <label class="oeo-radio-opt"><input type="radio" name="oeo-timing" value="any"> ✦ 每波都觸發</label>
          </div>
        </div>

        <div class="oeo-section-title">攻擊方向</div>
        <div class="oeo-radio-group">
          <label class="oeo-radio-opt"><input type="radio" name="oeo-dir" value="random" checked> 🎲 隨機</label>
          <label class="oeo-radio-opt"><input type="radio" name="oeo-dir" value="north"> ↑ 北方</label>
          <label class="oeo-radio-opt"><input type="radio" name="oeo-dir" value="south"> ↓ 南方</label>
          <label class="oeo-radio-opt"><input type="radio" name="oeo-dir" value="west"> ← 西方</label>
          <label class="oeo-radio-opt"><input type="radio" name="oeo-dir" value="east"> → 東方</label>
        </div>

        <div class="oeo-section-title">參戰單位數量</div>
        <div class="oeo-unit-grid">
          <div class="oeo-unit-row"><span>🗡 強盜</span><input type="number" id="oeo-u-bandit" min="0" max="50" value="0"></div>
          <div class="oeo-unit-row"><span>🏹 弓箭手</span><input type="number" id="oeo-u-archer" min="0" max="50" value="0"></div>
          <div class="oeo-unit-row"><span>🛡 重甲兵</span><input type="number" id="oeo-u-heavy" min="0" max="50" value="0"></div>
          <div class="oeo-unit-row"><span>🔮 黑暗法師</span><input type="number" id="oeo-u-mage" min="0" max="50" value="0"></div>
        </div>
        <div class="oeo-form-row">
          <div class="oeo-form-group">
            <label>生成間隔 ms（每隻之間，預設 300）</label>
            <input type="number" id="oeo-f-interval" min="50" max="2000" value="300">
          </div>
        </div>

        <div class="oeo-section-title">精英敵人（Elite）</div>
        <div class="oeo-elite-box">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" id="oeo-e-enabled"> 加入精英敵人
          </label>
          <div id="oeo-elite-fields" style="display:none;margin-top:10px">
            <div class="oeo-form-row">
              <div class="oeo-form-group">
                <label>精英類型</label>
                <select id="oeo-e-type">
                  <option value="random">🎲 隨機</option>
                  <option value="bandit">🗡 強盜精英</option>
                  <option value="archer">🏹 弓箭手精英</option>
                  <option value="heavy">🛡 重甲精英</option>
                  <option value="mage">🔮 法師精英</option>
                </select>
              </div>
              <div class="oeo-form-group">
                <label>精英數量（1–3）</label>
                <input type="number" id="oeo-e-count" min="1" max="3" value="1">
              </div>
            </div>
          </div>
        </div>

        <div class="oeo-preview" id="oeo-preview">
          <strong>預覽：</strong><span id="oeo-preview-text">請輸入單位數量</span>
          <div id="oeo-preview-wave" style="margin-top:3px;font-size:11px">觸發波次：—</div>
        </div>

      </div>
      <div class="oeo-modal-footer">
        <button class="oeo-btn oeo-btn-dim"  id="oeo-modal-cancel">取消</button>
        <button class="oeo-btn oeo-btn-gold" id="oeo-modal-save">儲存</button>
      </div>
    </div>
  </div>
</div>`;
  }

  // ── Wire up all events ──────────────────────────────────────────────────────

  _wireEvents() {
    const $ = (id) => this._el.querySelector('#' + id);

    $('oeo-close').onclick        = () => this.hide();
    $('oeo-add').onclick          = () => this._openAddModal();
    $('oeo-sort').onclick         = () => this._sort();
    $('oeo-enable-all').onclick   = () => { this._offensives.forEach(o => o.enabled = true);  this._render(); };
    $('oeo-disable-all').onclick  = () => { this._offensives.forEach(o => o.enabled = false); this._render(); };
    $('oeo-clear-all').onclick    = () => this._clearAll();
    $('oeo-import').onclick       = () => $('oeo-file-input').click();
    $('oeo-export').onclick       = () => this._export();
    $('oeo-apply').onclick        = () => this._apply();

    $('oeo-file-input').onchange  = (e) => this._onFileLoad(e);

    $('oeo-modal-close').onclick  = () => this._closeModal();
    $('oeo-modal-cancel').onclick = () => this._closeModal();
    $('oeo-modal-save').onclick   = () => this._saveOffensive();
    $('oeo-e-enabled').onchange   = () => {
      const show = $('oeo-e-enabled').checked;
      $('oeo-elite-fields').style.display = show ? 'block' : 'none';
      this._updatePreview();
    };

    // Live preview listeners
    ['oeo-f-day','oeo-f-delay','oeo-f-interval',
     'oeo-u-bandit','oeo-u-archer','oeo-u-heavy','oeo-u-mage','oeo-e-count']
      .forEach(id => { const el = $(id); if (el) el.oninput = () => this._updatePreview(); });
    this._el.querySelectorAll('input[name=oeo-timing], input[name=oeo-dir]')
      .forEach(el => { el.onchange = () => this._updatePreview(); });
  }

  // ── Render card list ────────────────────────────────────────────────────────

  _render() {
    const list = this._el.querySelector('#oeo-list');
    this._updateStats();

    if (this._offensives.length === 0) {
      list.innerHTML = `<div class="oeo-empty">尚無攻勢設定。點擊「＋ 新增攻勢」開始建立自訂事件。</div>`;
      return;
    }
    list.innerHTML = this._offensives.map(o => this._cardHTML(o)).join('');

    // Wire card buttons
    this._offensives.forEach(o => {
      const toggleEl = this._el.querySelector(`#oeo-toggle-${o.id}`);
      const editEl   = this._el.querySelector(`#oeo-edit-${o.id}`);
      const dupEl    = this._el.querySelector(`#oeo-dup-${o.id}`);
      const delEl    = this._el.querySelector(`#oeo-del-${o.id}`);
      if (toggleEl) toggleEl.onchange = () => { o.enabled = toggleEl.checked; this._updateStats(); };
      if (editEl)   editEl.onclick    = () => this._openEditModal(o.id);
      if (dupEl)    dupEl.onclick     = () => this._duplicate(o.id);
      if (delEl)    delEl.onclick     = () => this._delete(o.id);
    });
  }

  _cardHTML(o) {
    const units = o.units || {};
    const totalUnits = Object.values(units).reduce((s, v) => s + (v||0), 0);
    const eliteCount = o.elite?.enabled ? (o.elite.count||1) : 0;
    const timing = o.triggerTiming || 'night';
    const tagClass = { wave1:'oeo-tag-day1', wave2:'oeo-tag-day2', night:'oeo-tag-night', any:'oeo-tag-any' }[timing] || '';
    const waveNum = triggerWave(o.triggerDay, timing);
    const waveStr = timing === 'any'
      ? `第${o.triggerDay}天 所有波`
      : `第${o.triggerDay}天 → 第${waveNum}波`;

    const chips = [
      ...Object.entries(units).filter(([,v]) => v > 0).map(([t,v]) =>
        `<span class="oeo-chip oeo-chip-${t}">${UNIT_EMOJI[t]} ${UNIT_NAME[t]}×${v}</span>`),
      ...(eliteCount ? [`<span class="oeo-chip oeo-chip-elite">⭐ 精英×${eliteCount}</span>`] : []),
    ].join('') || '<span style="color:#3a2810;font-size:11px">（無單位）</span>';

    return `
<div class="oeo-card ${o.enabled ? '' : 'disabled'}">
  <div>
    <div class="oeo-card-name">
      ${esc(o.name)}
      <span class="oeo-tag ${tagClass}">${TIMING_LABEL[timing]||''}</span>
    </div>
    <div class="oeo-meta">
      <span>📅 ${waveStr}</span>
      <span>🧭 ${DIR_LABEL[o.direction]||'隨機'}</span>
      <span>⏱ 延遲${o.delaySeconds||0}s</span>
      <span>共 <strong>${totalUnits+eliteCount}</strong> 名</span>
    </div>
    <div class="oeo-chips">${chips}</div>
    ${o.description ? `<div style="font-size:11px;color:#4a3820;margin-top:3px">${esc(o.description)}</div>` : ''}
  </div>
  <div class="oeo-card-actions">
    <div class="oeo-action-row">
      <label class="oeo-toggle">
        <input type="checkbox" id="oeo-toggle-${o.id}" ${o.enabled ? 'checked' : ''}>
        <div class="oeo-toggle-track"></div>
        <div class="oeo-toggle-thumb"></div>
      </label>
    </div>
    <div class="oeo-action-row">
      <button class="oeo-btn oeo-btn-dim oeo-sm" id="oeo-edit-${o.id}">✏</button>
      <button class="oeo-btn oeo-btn-dim oeo-sm" id="oeo-dup-${o.id}">⧉</button>
      <button class="oeo-btn oeo-btn-red oeo-sm" id="oeo-del-${o.id}">🗑</button>
    </div>
  </div>
</div>`;
  }

  _updateStats() {
    const q = (id) => this._el.querySelector('#' + id);
    q('oeo-stat-count').textContent   = this._offensives.length;
    q('oeo-stat-enabled').textContent = this._offensives.filter(o => o.enabled).length;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const inSync = stored &&
        JSON.stringify(JSON.parse(stored).offensives) === JSON.stringify(this._offensives);
      const el = q('oeo-stat-storage');
      el.textContent = inSync ? '✓ 已套用至遊戲' : '⚠ 尚未套用';
      el.style.color = inSync ? '#55cc55' : '#d4a43a';
    } catch(e) {}
  }

  // ── Modal ───────────────────────────────────────────────────────────────────

  _openAddModal() {
    this._editingId = null;
    this._el.querySelector('#oeo-modal-title').textContent = '新增攻勢';
    this._resetForm();
    this._openModal();
  }

  _openEditModal(id) {
    const o = this._offensives.find(x => x.id === id);
    if (!o) return;
    this._editingId = id;
    this._el.querySelector('#oeo-modal-title').textContent = '編輯攻勢';
    this._populateForm(o);
    this._openModal();
  }

  _openModal() {
    this._el.querySelector('#oeo-modal-bg').style.display = 'flex';
    this._updatePreview();
  }

  _closeModal() {
    if (!this._el) return;
    this._el.querySelector('#oeo-modal-bg').style.display = 'none';
    this._editingId = null;
  }

  _resetForm() {
    const $ = (id) => this._el.querySelector('#' + id);
    $('oeo-f-name').value     = '';
    $('oeo-f-desc').value     = '';
    $('oeo-f-day').value      = '3';
    $('oeo-f-delay').value    = '5';
    $('oeo-f-interval').value = '300';
    this._el.querySelector('input[name=oeo-timing][value=night]').checked    = true;
    this._el.querySelector('input[name=oeo-dir][value=random]').checked      = true;
    ['bandit','archer','heavy','mage'].forEach(t => { $('oeo-u-'+t).value = '0'; });
    $('oeo-e-enabled').checked = false;
    $('oeo-elite-fields').style.display = 'none';
    $('oeo-e-type').value  = 'random';
    $('oeo-e-count').value = '1';
  }

  _populateForm(o) {
    const $ = (id) => this._el.querySelector('#' + id);
    $('oeo-f-name').value     = o.name || '';
    $('oeo-f-desc').value     = o.description || '';
    $('oeo-f-day').value      = o.triggerDay || 1;
    $('oeo-f-delay').value    = o.delaySeconds || 0;
    $('oeo-f-interval').value = o.spawnIntervalMs || 300;
    const tEl = this._el.querySelector(`input[name=oeo-timing][value=${o.triggerTiming||'night'}]`);
    if (tEl) tEl.checked = true;
    const dEl = this._el.querySelector(`input[name=oeo-dir][value=${o.direction||'random'}]`);
    if (dEl) dEl.checked = true;
    const units = o.units || {};
    ['bandit','archer','heavy','mage'].forEach(t => { $('oeo-u-'+t).value = units[t] || 0; });
    const elite = o.elite || {};
    $('oeo-e-enabled').checked = !!elite.enabled;
    $('oeo-elite-fields').style.display = elite.enabled ? 'block' : 'none';
    $('oeo-e-type').value  = elite.type  || 'random';
    $('oeo-e-count').value = elite.count || 1;
  }

  _saveOffensive() {
    const $ = (id) => this._el.querySelector('#' + id);
    const name = $('oeo-f-name').value.trim();
    if (!name) { this._toast_show('請填寫攻勢名稱', true); return; }

    const o = {
      id:   this._editingId || genId(),
      name,
      description:    $('oeo-f-desc').value.trim(),
      enabled:        this._editingId
        ? (this._offensives.find(x => x.id === this._editingId)?.enabled ?? true) : true,
      triggerDay:     parseInt($('oeo-f-day').value)      || 1,
      triggerTiming:  this._el.querySelector('input[name=oeo-timing]:checked')?.value || 'night',
      direction:      this._el.querySelector('input[name=oeo-dir]:checked')?.value   || 'random',
      delaySeconds:   parseInt($('oeo-f-delay').value)    || 0,
      spawnIntervalMs:parseInt($('oeo-f-interval').value) || 300,
      units: {
        bandit: parseInt($('oeo-u-bandit').value) || 0,
        archer: parseInt($('oeo-u-archer').value) || 0,
        heavy:  parseInt($('oeo-u-heavy').value)  || 0,
        mage:   parseInt($('oeo-u-mage').value)   || 0,
      },
      elite: {
        enabled: $('oeo-e-enabled').checked,
        type:    $('oeo-e-type').value  || 'random',
        count:   parseInt($('oeo-e-count').value) || 1,
      },
    };

    if (this._editingId) {
      const idx = this._offensives.findIndex(x => x.id === this._editingId);
      if (idx !== -1) this._offensives[idx] = o;
    } else {
      this._offensives.push(o);
    }
    this._closeModal();
    this._render();
    this._toast_show(this._editingId ? '已更新攻勢設定' : '已新增攻勢');
  }

  // ── CRUD helpers ────────────────────────────────────────────────────────────

  _delete(id) {
    if (!confirm('確定要刪除此攻勢？')) return;
    this._offensives = this._offensives.filter(o => o.id !== id);
    this._render();
    this._toast_show('已刪除');
  }

  _duplicate(id) {
    const o = this._offensives.find(x => x.id === id);
    if (!o) return;
    const copy = JSON.parse(JSON.stringify(o));
    copy.id   = genId();
    copy.name = copy.name + ' (複製)';
    const idx = this._offensives.findIndex(x => x.id === id);
    this._offensives.splice(idx + 1, 0, copy);
    this._render();
    this._toast_show('已複製攻勢');
  }

  _sort() {
    const order = { wave1:0, wave2:1, night:2, any:3 };
    this._offensives.sort((a, b) => {
      const da = a.triggerDay * 4 + (order[a.triggerTiming] || 0);
      const db = b.triggerDay * 4 + (order[b.triggerTiming] || 0);
      return da - db;
    });
    this._render();
    this._toast_show('已依天數排序');
  }

  _clearAll() {
    if (!confirm(`確定要清除全部 ${this._offensives.length} 個攻勢？`)) return;
    this._offensives = [];
    this._render();
    this._toast_show('已清除所有攻勢');
  }

  // ── Storage ─────────────────────────────────────────────────────────────────

  _loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this._offensives = data.offensives || [];
      } else {
        this._offensives = [];
      }
    } catch(e) { this._offensives = []; }
  }

  _apply() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: '1.0', offensives: this._offensives
    }));
    this._updateStats();
    this._toast_show('✓ 已套用至遊戲！下一波開始時生效。');
  }

  _export() {
    const data = { version:'1.0', exportedAt: new Date().toISOString(), offensives: this._offensives };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `offensives_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    this._toast_show('已匯出 JSON 檔案');
  }

  _onFileLoad(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const imported = data.offensives || [];
        if (!Array.isArray(imported)) throw new Error('格式錯誤');
        if (confirm(`匯入 ${imported.length} 個攻勢？（會取代現有設定）`)) {
          this._offensives = imported;
          this._render();
          this._toast_show(`✓ 已匯入 ${imported.length} 個攻勢`);
        }
      } catch(err) {
        alert('匯入失敗：' + err.message);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  // ── Preview ─────────────────────────────────────────────────────────────────

  _updatePreview() {
    if (!this._el) return;
    const $ = (id) => this._el.querySelector('#' + id);
    const bandit = parseInt($('oeo-u-bandit').value) || 0;
    const archer = parseInt($('oeo-u-archer').value) || 0;
    const heavy  = parseInt($('oeo-u-heavy').value)  || 0;
    const mage   = parseInt($('oeo-u-mage').value)   || 0;
    const total  = bandit + archer + heavy + mage;
    const eliteOn = $('oeo-e-enabled').checked;
    const elite   = eliteOn ? (parseInt($('oeo-e-count').value) || 1) : 0;
    const day    = parseInt($('oeo-f-day').value) || 1;
    const timing = this._el.querySelector('input[name=oeo-timing]:checked')?.value || 'night';
    const wave   = triggerWave(day, timing);
    const waveStr = timing === 'any'
      ? `第${day}天 波次 ${(day-1)*3+1}–${day*3}`
      : `第${day}天 → 第${wave}波`;
    const parts = [];
    if (bandit) parts.push(`強盜×${bandit}`);
    if (archer) parts.push(`弓箭手×${archer}`);
    if (heavy)  parts.push(`重甲兵×${heavy}`);
    if (mage)   parts.push(`法師×${mage}`);
    if (elite)  parts.push(`精英×${elite}`);
    $('oeo-preview-text').textContent =
      total + elite > 0 ? parts.join('、') + `（共 ${total+elite} 名）` : '無單位';
    $('oeo-preview-wave').textContent = '觸發波次：' + waveStr;
  }

  // ── Toast ───────────────────────────────────────────────────────────────────

  _toast_show(msg, isError = false) {
    if (!this._toast) return;
    this._toast.textContent  = msg;
    this._toast.style.borderColor = isError ? '#cc3333' : '#3a8a3a';
    this._toast.style.color       = isError ? '#ff5555' : '#55cc55';
    this._toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this._toast?.classList.remove('show'), 2500);
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────
export const offensiveEditorOverlay = new OffensiveEditorOverlay();
