# Medieval Survivor — 中世紀生存塔防遊戲

> 以 HTML + Phaser 3 製作的 Rogue-lite 生存塔防遊戲。玩家扮演村莊守護者，在開放世界中採集資源、建造與升級建築，並在波次攻擊中抵禦強盜與外敵。

---

## 遊戲概念

- **類吸血鬼生存者**：俯視視角，自動攻擊，波次敵人，角色成長
- **資源採集**：在地圖上砍樹、採石、收割糧食
- **建築系統**：建造城牆、塔樓、農場、礦場等，每種建築可多段升級
- **塔防元素**：防守核心建築（村莊中心），敵人有明確進攻路線
- **波次系統**：白天採集建設，夜晚抵禦敵人；波次越後難度越高

---

## 技術棧

| 技術 | 用途 |
|------|------|
| HTML5 | 入口頁面 |
| Phaser 3 | 遊戲引擎（場景、物理、渲染） |
| Vanilla JS (ES Modules) | 遊戲邏輯 |
| Tiled (選用) | 地圖編輯 |

---

## 專案目錄結構

```
medieval_survivor/
├── index.html                  # 遊戲入口
├── README.md
│
├── src/
│   ├── main.js                 # Phaser 初始化、場景註冊
│   ├── config.js               # 全域常數（解析度、物理設定、版本）
│   │
│   ├── scenes/                 # Phaser Scene 類別
│   │   ├── BootScene.js        # 資源預載（assets preload）
│   │   ├── MenuScene.js        # 主選單
│   │   ├── GameScene.js        # 主遊戲場景（核心邏輯）
│   │   ├── UIScene.js          # HUD 疊加層（與 GameScene 並行運行）
│   │   └── GameOverScene.js    # 結算畫面
│   │
│   ├── systems/                # 各子系統（被 GameScene 引用）
│   │   ├── WaveSystem.js       # 波次生成、計時、難度曲線
│   │   ├── EnemySystem.js      # 敵人 AI、尋路、狀態機
│   │   ├── CombatSystem.js     # 傷害計算、命中、死亡處理
│   │   ├── ResourceSystem.js   # 資源節點管理、採集互動
│   │   ├── BuildingSystem.js   # 建築放置、升級、碰撞
│   │   ├── EconomySystem.js    # 資源貨幣（木材/石材/糧食/金幣）
│   │   └── DayNightSystem.js   # 日夜週期、光照、波次觸發
│   │
│   ├── entities/               # 遊戲物件類別
│   │   ├── Player.js           # 玩家（移動、自動攻擊、技能）
│   │   ├── Enemy.js            # 敵人基底類別
│   │   ├── enemies/
│   │   │   ├── Bandit.js       # 輕裝強盜（快、弱）
│   │   │   ├── Raider.js       # 重裝劫匪（慢、強）
│   │   │   └── BossEnemy.js    # 波次 Boss
│   │   ├── Building.js         # 建築基底類別
│   │   ├── buildings/
│   │   │   ├── TownCenter.js   # 村莊核心（HP 歸零即遊戲結束）
│   │   │   ├── Wall.js         # 城牆（阻擋敵人）
│   │   │   ├── Tower.js        # 箭塔（自動攻擊）
│   │   │   ├── Farm.js         # 農場（定期產糧食）
│   │   │   ├── Lumbermill.js   # 伐木場（提升木材採集效率）
│   │   │   └── Mine.js         # 礦場（提升石材採集效率）
│   │   ├── ResourceNode.js     # 資源節點（樹木、岩石、農田）
│   │   └── Projectile.js       # 投射物（箭矢、石彈）
│   │
│   ├── ui/                     # UI 元件（在 UIScene 中使用）
│   │   ├── HUD.js              # 資源顯示、HP 條、波次倒計時
│   │   ├── BuildMenu.js        # 建築選擇面板
│   │   ├── UpgradePanel.js     # 建築升級介面
│   │   └── WaveAlert.js        # 波次警告提示
│   │
│   └── utils/
│       ├── EventBus.js         # 全域事件匯流排（場景間通訊）
│       ├── PathFinder.js       # A* 尋路（敵人找路到目標）
│       └── ObjectPool.js       # 物件池（子彈、特效重複利用）
│
└── assets/
    ├── images/
    │   ├── player/             # 玩家角色 spritesheet
    │   ├── enemies/            # 各類敵人 spritesheet
    │   ├── buildings/          # 建築圖集
    │   ├── resources/          # 資源節點圖（樹、石、農田）
    │   ├── ui/                 # UI 圖示、按鈕
    │   └── tileset/            # 地圖圖塊集
    ├── tilemaps/
    │   └── world.json          # Tiled 地圖（JSON 格式）
    └── audio/
        ├── bgm/                # 背景音樂
        └── sfx/                # 音效
```

---

## 核心遊戲流程

```
BootScene（載入資源）
    ↓
MenuScene（開始遊戲）
    ↓
GameScene ←──────────────────────────────────────────┐
    │                                                  │
    ├─ DayNightSystem                                  │
    │     白天：採集時間（計時器倒數）                    │
    │     夜晚：波次開始（WaveSystem 生成敵人）           │
    │                                                  │
    ├─ 玩家行動（WASD 移動、自動攻擊、點擊採集/建造）      │
    │                                                  │
    ├─ ResourceSystem：採集 → EconomySystem 增加資源     │
    │                                                  │
    ├─ BuildingSystem：消耗資源 → 放置/升級建築           │
    │                                                  │
    ├─ WaveSystem → EnemySystem → CombatSystem         │
    │     生成敵人    AI 移動        傷害處理             │
    │                                                  │
    └─ 若 TownCenter.hp <= 0 → GameOverScene ──────────┘
```

---

## 資源種類

| 資源 | 來源 | 用途 |
|------|------|------|
| 木材 (Wood) | 砍樹、伐木場 | 建造城牆、農場、伐木場 |
| 石材 (Stone) | 採石、礦場 | 建造箭塔、礦場、城牆升級 |
| 糧食 (Food) | 收割、農場 | 維持玩家 HP 回復、解鎖兵種 |
| 金幣 (Gold) | 擊殺敵人、礦場 | 高階建築升級、購買特殊強化 |

---

## 建築升級樹（初版規劃）

```
城牆 Lv1（木） → Lv2（石材強化） → Lv3（帶箭垛，偶發自動攻擊）
箭塔 Lv1（攻速慢）→ Lv2（攻速+、射程+）→ Lv3（三連射）
農場 Lv1（慢產糧）→ Lv2（產量x2）→ Lv3（自動收割）
伐木場/礦場 Lv1 → Lv2（範圍採集）→ Lv3（自動派工）
村莊中心（核心，HP 即遊戲存活指標，可升級提升上限）
```

---

## 敵人波次設計

| 波次 | 敵人組合 | 特色 |
|------|---------|------|
| 1–3 | 輕裝強盜 | 教學期，單線進攻 |
| 4–6 | 強盜 + 重裝劫匪 | 多線進攻開始 |
| 7–9 | 混合 + 攻城機具 | 對建築高傷害 |
| 10+ | 隨機 Boss + 混合 | 無上限，難度持續提升 |

---

## 操作方式

| 操作 | 功能 |
|------|------|
| WASD / 方向鍵 | 移動玩家 |
| 左鍵點擊 | 與資源節點互動（採集）|
| B | 開啟建造選單 |
| 建造選單 + 點擊地圖 | 放置建築 |
| 點擊建築 | 開啟升級面板 |
| ESC | 暫停遊戲 |

---

## 開發階段規劃

### Phase 1 — 核心可玩原型
- [ ] 基礎地圖場景、玩家移動
- [ ] 資源節點採集與 HUD 顯示
- [ ] 簡易敵人 AI + 第一波波次
- [ ] TownCenter HP + GameOver

### Phase 2 — 建築系統
- [ ] 建造選單 UI
- [ ] 城牆、箭塔放置
- [ ] 建築升級介面
- [ ] 碰撞（敵人被城牆阻擋）

### Phase 3 — 深度內容
- [ ] 日夜週期
- [ ] 完整資源種類與建築樹
- [ ] 多種敵人類型
- [ ] A* 尋路

### Phase 4 — 打磨
- [ ] 音效與 BGM
- [ ] 粒子特效
- [ ] 存檔系統（localStorage）
- [ ] 平衡性調整

---

## 快速啟動

```bash
# 直接開啟（若無 CORS 問題）
open index.html

# 或啟動本地伺服器（推薦）
npx serve .
# 或
python -m http.server 8080
```

瀏覽器開啟 `http://localhost:8080`

---

## 技術備註

- **Phaser 版本**：3.x（CDN 引入，無需 npm）
- **ES Modules**：所有 `src/` 下使用 `import/export`，需透過 HTTP server 執行
- **物件池**：子彈與特效透過 `ObjectPool.js` 重複利用，避免 GC 卡頓
- **場景分離**：`GameScene`（邏輯）與 `UIScene`（介面）並行，避免 UI 被相機影響
- **EventBus**：跨場景通訊統一走事件匯流排，不直接互相引用

---

*最後更新：2026-03-24*
