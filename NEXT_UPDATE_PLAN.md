# Next Update Plan — Phase 7：打磨（音效 / 特效 / 存檔 / 平衡調整）

> Phase 5（採集所 + 維修工）與 Phase 6（兵營 + 法師塔 + 集結模式）已於 2026-03-26 全部完成。
> 本文件描述 Phase 7 的規劃方向。

---

## 當前開發狀態（Phase 1–6 完成）

| Phase | 完成內容 | 日期 |
|-------|----------|------|
| 1 | 核心可玩原型（WASD、自動攻擊、波次、EventBus） | 2026-03-24 |
| 2 | 建築系統（城牆 / 箭塔 / B 鍵選單 / 升級面板） | 2026-03-25 |
| 3 | 深度內容（日夜 / 弓箭手 / 重甲兵 / A*） | 2026-03-25 |
| 4 | 功能擴充（鐵匠 / 訓練場 / 食堂 / 法師敵人） | 2026-03-25 |
| 5 | 自動化建築（採集所 / 維修工 / 暫停 / 金幣兌換 / 平衡設定） | 2026-03-26 |
| 6 | 友方單位（兵營 / 士兵 / 法師塔 / 友方法師 / F 鍵集結） | 2026-03-26 |

---

## Codebase Quick Reference

| Pattern | Where to look |
|---|---|
| Building template | `src/entities/buildings/Blacksmith.js` |
| Building with update loop | `src/entities/buildings/Tower.js` |
| Auto-unit spawning | `src/entities/buildings/Barracks.js` |
| Friendly unit AI (leash + rally) | `src/entities/Soldier.js` |
| AoE projectile (friendly) | `src/entities/AlliedMage.js` + `GameScene._triggerAlliedExplosion()` |
| Physics groups setup | `GameScene.create()` |
| Collision setup | `GameScene.create()` (colliders section) |
| Building placement | `BuildingSystem.tryPlace()` |
| Build menu entries | `src/ui/BuildMenu.js` defs array |
| Upgrade panel | `src/ui/UpgradePanel.js` — `_refresh()`, nameMap |
| Balance settings | `src/scenes/MenuScene.js` BALANCE_SETTINGS array |

---

## Phase 7 — 打磨（規劃中）

### Feature 1 — 音效系統

使用 Phaser 3 的 Web Audio API (`this.sound`) 或直接用 `AudioContext` 生成程式音效（與貼圖相同，不使用外部檔案）。

建議優先順序：
1. **玩家攻擊** — 短促擊打音（440Hz 方波，30ms）
2. **敵人受傷 / 死亡** — 低頻打擊
3. **建築受傷** — 石頭碰撞音
4. **波次警告** — 緊張鼓聲 / 警報音
5. **法師 AoE 爆炸** — 低頻轟爆
6. **資源採集** — 輕快木頭/石頭音

程式生成音效範例（`AudioContext`）：
```js
function playSound(type) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  // ... 依 type 設定 frequency / duration / waveform
}
```

---

### Feature 2 — 視覺特效強化

目前特效（`_triggerExplosion`、tower 射擊）基本可用，可強化：

1. **敵人死亡粒子** — 小紅點散射（用 Phaser Graphics 快速建立，無需外部圖片）
2. **建築損毀效果** — HP < 30% 時在建築上方持續冒煙（`scene.add.circle()` tween loop）
3. **採集特效** — 採集資源時飄出木頭/石頭小圖示
4. **兵營/法師塔召喚特效** — 士兵/法師生成時顯示光環

建議技術：全部用 `scene.add.circle()` / `scene.add.rectangle()` + tween，與現有爆炸特效一致。

---

### Feature 3 — 存檔系統

使用 `localStorage` 儲存最高成績與解鎖設定。

#### 資料結構
```js
const saveData = {
  highScore: {
    waveReached: 0,
    timeSurvived: 0,   // ms
    enemiesKilled: 0,
  },
  // 可選：記錄玩家偏好的平衡設定
  lastBalanceSettings: {},
};
```

#### 實作要點
- `GameOverScene.js`：遊戲結束時讀取舊記錄，若有破關紀錄則更新並顯示「新紀錄！」
- `MenuScene.js`：顯示最高波次記錄
- 存檔 key：`medieval_survivor_save`
- 不需要複雜存檔結構，一次 `JSON.stringify/parse` 即可

---

### Feature 4 — 平衡調整建議

根據 Phase 6 完成後的觀察，以下數值值得重新調整：

| 項目 | 目前值 | 建議調整方向 |
|------|--------|-------------|
| 友方法師召喚速率 | 12000ms | 可降至 10000ms（法師太稀少）|
| 重甲兵 HP | 220 | Wave 6 之前可降至 180 |
| 弓箭手 building damage | 3 | 維持（已調整過）|
| 採集所範圍 | 130px | 可升至 150px（感覺偏小）|
| 兵營 Lv2 士兵上限 | 4 | 維持 |
| 法師塔 AoE 半徑 | 60px | 維持 |

---

## 實作優先順序建議

1. **存檔（Feature 3）** — 最容易實作，立即增加遊戲留存感
2. **音效（Feature 1）** — 程式生成，不需外部資源，大幅提升遊戲感
3. **建築損毀特效（Feature 2 部分）** — 視覺回饋強化，難度適中
4. **平衡調整（Feature 4）** — 數值微調，直接改 config.js

---

## Phase 7 Files Changed（預估）

| File | Change |
|---|---|
| `src/utils/SoundManager.js` | **NEW** — 程式生成音效管理器 |
| `src/scenes/GameScene.js` | 呼叫 SoundManager、建築損毀特效 |
| `src/scenes/GameOverScene.js` | localStorage 存讀高分 |
| `src/scenes/MenuScene.js` | 顯示最高記錄 |
| `src/config.js` | 平衡數值微調 |
| `src/entities/Enemy.js` | 死亡粒子特效 |

---

*最後更新：2026-03-26（Phase 6 完成，Phase 7 規劃草案）*
