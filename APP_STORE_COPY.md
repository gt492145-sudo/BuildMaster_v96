# App Store Connect 對齊清單（V9.7 · build 9627 · 2026-06-18）

## 必須一致（Xcode ↔ Connect ↔ GitHub Pages）

| 項目 | App Store Connect | Xcode（Documents 專案） | GitHub Pages |
|------|-------------------|-------------------------|--------------|
| 版本 Version | **9.7** | MARKETING_VERSION = **9.7** | — |
| 建置 Build | **9627**（上傳後選這個） | CURRENT_PROJECT_VERSION = **9627** | `?build=9627` |
| Bundle ID | **tw.buildmaster.constructionmaster** | tw.buildmaster.constructionmaster | — |
| iOS 送審 Scheme | — | **LiDARRangefinder** | — |
| **macOS 送審 Scheme** | — | **ConstructionMasterMac** | `&platform=mac` |
| 送審 Xcode 專案 | — | `~/Documents/LiDARRangefinder/LiDARRangefinder.xcodeproj` | — |
| 隱私權政策最後更新 | **2026-06-18** | 與 Google Sites、`privacy.html` 一致 | `privacy.html` |

**不要**用 `com.aji.buildmaster...` 那份 Dev 專案更新此 Connect App。

---

## App 資訊（App Information）

| 欄位 | 建議值 |
|------|--------|
| 名稱 | Construction Master |
| 副標題 | 工程計算與試算工作區 |
| 主要語言 | 繁體中文 |
| 類別 | 工具程式 |
| 隱私權政策 URL | https://sites.google.com/view/buildmaster-privacy/首頁 |

---

## iOS App 版本 9.7（此版送審重點 · 2026-06-18）

### 定價與供應

- **免費**（無 App 內購買入口）
- 可用國家／地區：依你原本設定

### App 審查資訊（Review Information）

- **需要登入：取消勾選**
- 示範帳號：留空（不需要）
- 備註（英文，可直接貼）：

```text
This build (V9.7 / 9627) is the Construction Master calculation workspace. Privacy policy last updated: 2026-06-18.

- Launch: WebView opens https://gt492145-sudo.github.io/BuildMaster_v96/index.html?build=9627&iosreview=1&logo=v2
- No login required. Users enter the main workspace immediately.
- UI languages: Traditional Chinese, English, Japanese (follows device / URL lang= parameter).
- Three work modes: Calc (🧮), Stake (📍), Electrical (⚡). Each mode is independent; data stays on device.
- Page 1 = simple calc + local demo group chat (bubble UI); Page 2 = full features + blueprint; staking + electrical have field simulators (photos processed locally only).
- Field simulators gate some exports (stake CSV/QA/package; electrical mecha_config.txt) after on-device confirmation only.
- Operation demos / tutorial animations (~30s): preferences stored locally (bm_69:feature_demo:*); may bridge to native for playback coordination only, not uploaded to developer server.
- Group chat on Page 1 is LOCAL only (messages stored on device, not a live multi-user server). Default channel: "群組大廳". Sender shows as "訪客" (Guest) without login.
- After "Add to list" (吸入計算清單), calc results auto-post as structured 📊 card bubbles to the same local chat (device-only, not uploaded).
- In-app Coach (解說員) explains features including local chat privacy; aligned with public Privacy Policy URL.
- Optional in-app rating prompt (after meaningful use): preferences stored locally only; 4–5 stars may invoke Apple's SKStoreReviewController (no data sent to developer server for the prompt itself).
- NOT in this version: native AR/LiDAR at app launch (future update).
- Free app; no in-app purchase UI; no third-party ads.

Please test on iPad with a clean install. No demo account required.
```

### 此版本的新增功能（What's New · 繁中）

```text
V9.7 更新（2026-06-18）：
• 三種工作模式：🧮 計算、📍 放樣、⚡ 電機（各自獨立，資料僅存本機）
• 操作示範與教學動畫（約 30 秒）；偏好僅存本機，可略過／不再自動顯示
• 放樣／電機現場模擬器（照片本機處理）；完成後解鎖本機匯出
• 介面支援繁中／英／日三語
• 第1頁本機群組聊天＋試算📊卡片；解說員與公開隱私權一致（2026-06-18）
• 五星評分提示（偏好僅存本機）
• 免登入、免費、無訂閱／無廣告
• 原生 AR／LiDAR 將於後續版本加入
```

---

## 描述（Description · 繁中建議）

Construction Master 是面向工地與工程現場的計算與試算工具。

本版（V9.7 · build 9627）提供：
• 三種工作模式：🧮 計算、📍 放樣、⚡ 電機
• 第1頁：簡單工程試算與本機群組聊天（文字泡泡＋試算📊卡片，不需登入）
• 第2頁：圖面量測、完整計算與進階試算
• 放樣／電機：現場模擬器（照片本機處理）與本機匯出
• 操作示範與教學動畫（偏好僅存本機）
• 介面語言：繁中／英／日

第1頁聊天為裝置本機示範（含試算卡片泡泡），非雲端即時多人聊天室。解說員會說明此範圍，與公開隱私權政策（最後更新 2026-06-18）一致。

本版尚未包含：原生 AR／LiDAR App 入口（後續更新）。

本 App 免費使用，開啟後無需登入即可進入主工作區。

隱私權政策：https://sites.google.com/view/buildmaster-privacy/首頁

---

## 行銷宣傳文字（Promotional Text · 170 字內）

Construction Master V9.7：三模式工程試算（計算／放樣／電機），繁中／英／日。本機聊天、操作示範、現場模擬器。免費免登入；隱私政策 2026-06-18 更新。

---

## 回覆 Apple Resolution Center（英文）

```text
Hello App Review Team,

Thank you for your review. Build 9.7 (9627) updates the calculation workspace with three work modes (calc/stake/electrical), operation demo animations, field simulators, trilingual UI, and updated privacy policy (2026-06-18).

1. Login: no password required on launch; WebView opens the main workspace immediately.
2. Group chat: local device demo only (not a live server). Page 1 quick input + 📊 calc card bubbles after "Add to list".
3. Privacy: aligned with https://sites.google.com/view/buildmaster-privacy/首頁 and in-app privacy summary (privacy.html).
4. Rating prompt: stored on device only (bm_69:app_rating_v1); does not upload preferences to our server.
5. Free build; no IAP UI; no ads.

Web URL: https://gt492145-sudo.github.io/BuildMaster_v96/index.html?build=9627&iosreview=1&logo=v2

Please test with a clean install on iPad. No demo account required.

Thank you.
```

---

## Google Sites 隱私頁（請手動貼上 · 2026-06-18）

站內 `privacy.html` 已更新（2026-06-18 · V9.7 · build 9627）；請到 [Google Sites 隱私頁](https://sites.google.com/view/buildmaster-privacy/首頁) 同步：

1. 頁首「最後更新」改為 **2026 年 6 月 18 日**，適用版本 **V9.7 · build 9627**
2. 在「本版 App 功能範圍」或同等段落**新增／替換**下方 **§A–§F 補充條款**
3. 確認 **§6.2 本機群組聊天**、**§6.4 五星評分提示** 與 App 內文案一致

### 貼上區塊 A：頁首摘要（可放在「最後更新」下方）

```text
【V9.7 · build 9627 · 2026-06-18 補充】
Construction Master（工程計算工作區）提供三種獨立工作模式：🧮 計算、📍 放樣、⚡ 電機。除先前已說明之本機群組聊天、解說員與五星評分提示外，本版另含「操作示範與教學動畫」與「現場模擬器」。下列資料均僅存於您裝置，不會因此自動上傳至開發者伺服器。
```

### 貼上區塊 B：§2.0 三種工作模式

```text
2.0 三種工作模式（計算／放樣／電機）

App 提供三種彼此獨立的工作模式，可從頂部或選單切換：
• 🧮 計算模式：工程試算、圖面量測、第 1 頁本機群組聊天等。
• 📍 放樣模式：放樣工具、QA 與「現場放樣模擬器」。
• ⚡ 電機模式：機電參數設定、「電壓現場模擬器」，以及本機匯出 mecha_config.txt。

各模式下的輸入、偏好與匯出檔案僅存於您裝置本機。放樣模式部分匯出（CSV、QA 報表、封包）與電機模式之 mecha_config.txt 下載，需先完成對應現場模擬器之操作確認後才會解鎖；此為 App 內流程設計，不涉及雲端驗證。
```

### 貼上區塊 C：§2.2 操作示範與教學動畫

```text
2.2 操作示範與教學動畫

為協助新使用者熟悉介面，App 可能顯示「操作示範與教學動畫」，包含但不限於：約 30 秒的功能操作示範、解說員（Coach）導覽、新手導覽步驟，以及現場模擬器介面中的教學動畫提示。此類內容僅在您的裝置上播放，用於說明按鈕位置與操作流程。

• 是否自動顯示、您按「略過／不再自動顯示／終止」、各示範之播放次數與時間戳記等偏好，僅記錄於裝置本機（localStorage 鍵前綴：bm_69:feature_demo:，以及 bm_69:coach_guide_done 等解說員相關鍵），不會因此自動傳送給開發者伺服器。
• 示範動畫可能透過 App 內 WebView 向 iOS／Android 原生層回報播放進度或完成事件，僅用於 App 內協調介面行為，不向開發者後端上傳。
• 您可隨時關閉解說員或選擇不再自動顯示示範；清除 App 本機資料後，相關偏好可能重置。
```

### 貼上區塊 D：§2.3 現場模擬器

```text
2.3 現場模擬器（放樣／電機）

放樣模式與電機模式各提供現場模擬器，供您上傳或選取現場照片（JPG／PNG），在 App 內模擬現場操作步驟。

• 您上傳或選取之照片僅用於 App 內顯示與本機流程確認，不會因此自動上傳至開發者伺服器或第三方雲端。
• 完成模擬器確認後，方可解鎖部分本機匯出（放樣 CSV／QA／封包，或電機 mecha_config.txt）。匯出檔案由您裝置本機產生或下載，是否分享給他人由您自行決定。
```

### 貼上區塊 E：§2.4 電機模式與 mecha_config.txt

```text
2.4 電機模式與 mecha_config.txt

電機模式可設定電壓、電流、腳本模式、繼電器狀態等工程參數，並匯出 mecha_config.txt 文字檔，供您在本機 Python 腳本或現場測試環境讀取。上述參數與匯出檔僅存於或產生於您裝置；App 不會將 mecha_config.txt 內容自動上傳至開發者伺服器。
```

### 貼上區塊 F：§2.5 App 內 WebView 與原生橋接

```text
2.5 App 內 WebView 與原生橋接

iOS／Android App 以 WebView 載入 Construction Master 網頁工作區；部分功能（例如操作示範進度、評分提示）可能透過 App 內 JavaScript 與原生程式之橋接溝通。此橋接僅在 App 與 WebView 之間運作，用於呼叫系統評分 API、協調動畫或介面狀態，不向開發者自有後端傳送個人資料或試算內容。
```

### 保留不變（若 Google Sites 已有）

```text
【V9.7 · build 9611 · 2026-06-15 · 仍適用】
• iOS／Android App 無需登入即可進入主工作區；介面支援繁中／英／日。
• 第 1 頁「群組聊天／群組大廳」為裝置本機示範（文字泡泡＋試算📊卡片），訊息存於裝置本機，不會自動同步到其他裝置或雲端。
• 未登入時聊天身份顯示為「訪客」；非即時多人連線聊天室。
• App 內「解說員」會說明上述範圍，與本公開隱私頁一致。
• 五星評分提示：顯示偏好僅存本機（bm_69:app_rating_v1）；4–5 星可呼叫 Apple 官方評分 API 或開啟 Play 商店；不向開發者伺服器上傳評分偏好。
• 原生 AR／LiDAR 功能將於後續 App 更新加入。
```

---

## iPad 清安装實測清單（送審前必做）

在 **iPad** 上刪除 App 後重裝，或 Settings → Safari → 清除網站資料後再測。

| # | 步驟 | 預期結果 | 通過 |
|---|------|----------|------|
| 1 | 全新安裝後打開 App | 直接進入工作區，**不出現**密碼鎖屏卡住 | ☐ |
| 2 | 確認頂部有「第1頁／第2頁」 | 可切換，頁面內容隨頁變化 | ☐ |
| 3 | 第1頁 → 聊天快速輸入框輸入「測試」按 Enter | 出現右側文字泡泡，身份為「訪客」 | ☐ |
| 3b | 第1頁 → 試算後按「吸入計算清單」 | 群組大廳出現📊試算卡片泡泡（本機） | ☐ |
| 4 | 點「開啟會員聊天群組」 | 面板打開，顯示「目前身份：訪客」 | ☐ |
| 5 | 點「解說員」→ 點聊天區 | 解說說明本機聊天／試算卡片與隱私範圍 | ☐ |
| 6 | 切換到第2頁 | 出現圖面／全功能區域 | ☐ |
| 7 | 切換到「放樣模式」 | 進入放樣工作區 | ☐ |
| 8 | 全程無需輸入帳號密碼 | 無卡住、無 404 主頁 | ☐ |
| 9 | （可選）第二次開啟並完成試算吸入 | 約 1.6 秒後可能出現五星評分提示；可選「之後再說」 | ☐ |

測完後在 Connect 選 build **9627**，取消「需要登入」，貼上方英文審查備註。

---

## macOS 清安装實測清單（送審前必做 · 與 iOS 同日送審）

在 **Mac** 上刪除 Construction Master 後重裝（或清除 App 資料）。

| # | 步驟 | 預期結果 | 通過 |
|---|------|----------|------|
| 1 | Mac App Store 或 TestFlight 安裝後開啟 | 獨立視窗載入工作區，**不需登入** | ☐ |
| 2 | 確認頂部三模式：計算／放樣／電機 | 可切換，內容隨模式變化 | ☐ |
| 3 | 計算模式 → 本機聊天輸入「測試」 | 出現訪客泡泡（本機） | ☐ |
| 4 | 放樣模式 → 現場模擬器上傳照片 | 僅本機顯示，完成後可匯出 | ☐ |
| 5 | 電機模式 → 設定參數 | 完成模擬器後可下載 mecha_config.txt（本機） | ☐ |
| 6 | 可能出現操作示範動畫 | 可略過／不再自動顯示 | ☐ |
| 7 | 全程無 404、無密碼鎖屏 | 與 iOS 相同 Web 內容 | ☐ |

測完後 Connect → **macOS App** → 版本 **9.7** → 建置 **9627** → **新增以供審查**。

---

## 送審前 Checklist（2026-06-18 · iOS + macOS 同日）

- [ ] GitHub Pages 已 push（build=9627、三模式、示範動畫、現場模擬器、privacy.html）
- [ ] Google Sites 隱私頁已更新為 **2026-06-18 · V9.7 · 9627**（完整版）
- [ ] iPad 清安裝實測全部打勾
- [ ] **Mac 清安裝實測全部打勾**
- [ ] Xcode Archive **LiDARRangefinder**（iOS），Build **9627** → Upload
- [ ] Xcode Archive **ConstructionMasterMac**（macOS），Build **9627** → Upload
- [ ] Connect iOS 版本 **9.7**、Build **9627** 送審
- [ ] Connect **macOS App** 版本 **9.7**、Build **9627** 送審（與 iOS 分開按「新增以供審查」）
- [ ] 取消「需要登入」（iOS 與 macOS 皆然）
- [ ] Mac 截圖（1280×800 等）已上傳
- [ ] App 隱私：維持「未收集資料」

---

## macOS App（方案 B · ConstructionMasterMac）

### Xcode 專案

| 項目 | 值 |
|------|-----|
| 專案 | `~/Documents/LiDARRangefinder/LiDARRangefinder.xcodeproj` |
| Scheme | **ConstructionMasterMac**（不是 LiDARRangefinder） |
| Target | ConstructionMasterMac |
| Version / Build | **9.7 / 9627**（與 iOS 相同） |
| Bundle ID | tw.buildmaster.constructionmaster |
| 入口 | WebView → `BuildMaster_v96/index.html?build=9627&iosreview=1&logo=v2&platform=mac&lang=...` |

原始碼：`ConstructionMasterMac/ConstructionMasterMacApp.swift`、`MacWebCalcHostView.swift`

### 本機測試

1. Xcode 開啟專案  
2. 上方 Scheme 選 **ConstructionMasterMac**  
3. 目的地選 **My Mac**  
4. ▶ Run → 應開啟獨立視窗載入工程工作區  

### Archive 上傳（Mac App Store）

1. Scheme：**ConstructionMasterMac**  
2. 目的地：**Any Mac (Apple Silicon)** 或 **My Mac**  
3. **Product → Archive**  
4. Organizer → **Distribute App → App Store Connect → Upload**  
5. Connect → 左側 **macOS App** → 版本 **9.7** → **建置版本** 選剛上傳的 Mac build **9627**  
6. 填 **此版本的新增功能**（可沿用 iOS 9.7 文案，加一句「Mac 版工程試算工作區」）  
7. 補 **Mac 截圖**（1280×800 等）→ **新增以供審查**  

### macOS 審查備註（英文 · 可貼）

```text
This macOS build (V9.7 / 9627) wraps the same Construction Master web workspace in a native Mac app (WKWebView). Privacy policy last updated: 2026-06-18.

- URL: https://gt492145-sudo.github.io/BuildMaster_v96/index.html?build=9627&iosreview=1&logo=v2&platform=mac
- No login required. Free app; no IAP; no ads.
- Three work modes: Calc, Stake, Electrical (device-local data).
- Operation demo / tutorial animations: local preferences only (bm_69:feature_demo:*); native bridge for playback coordination only.
- Field simulators (stake/electrical): photos processed on device only; gates local exports after on-device confirmation.
- Page 1 local demo group chat (device-only). Same privacy policy as iOS.
- Optional rating prompt uses local storage only; 4–5 stars may call SKStoreReviewController.

Please test on a clean Mac install. No demo account required.
```

### macOS 此版本新增功能（繁中 · 可貼）

```text
Construction Master Mac 版（V9.7 · 2026-06-18）：
• Mac App Store 獨立 App，開啟即進入工程試算工作區
• 與 iOS 相同：三工作模式（計算／放樣／電機）、免登入、三語、本機群組聊天
• 操作示範與教學動畫、現場模擬器（照片本機處理）
• 內容與 GitHub Pages 工作區同步；免費、無訂閱、無廣告
• 隱私權政策：https://sites.google.com/view/buildmaster-privacy/首頁
```

### 注意

- **iOS build 9627 ≠ macOS build 9627 在 Connect 的建置列表**：必須用 **ConstructionMasterMac** 各 Archive 上傳一次，才會出現在 Connect **macOS App** 建置列表（建置號可同為 9627，但是不同平台的上傳物）。  
- 使用者從 **Mac App Store** 下載；若只用瀏覽器，不必下載 App。  
- 隱私權 URL 與 iOS 相同：https://sites.google.com/view/buildmaster-privacy/首頁  
