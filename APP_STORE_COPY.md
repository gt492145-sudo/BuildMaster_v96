# App Store Connect 對齊清單（V9.7 · build 9611 · 2026-06-15）

## 必須一致（Xcode ↔ Connect）

| 項目 | App Store Connect | Xcode（Documents 專案） |
|------|-------------------|-------------------------|
| 版本 Version | **9.7** | MARKETING_VERSION = **9.7** |
| 建置 Build | **9611**（上傳後選這個） | CURRENT_PROJECT_VERSION = **9611** |
| Bundle ID | **tw.buildmaster.constructionmaster** | tw.buildmaster.constructionmaster |
| 送審 Xcode 專案 | — | `~/Documents/LiDARRangefinder/LiDARRangefinder.xcodeproj` |
| 隱私權政策最後更新 | **2026-06-15** | 與 Google Sites、`privacy.html` 一致 |

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

## iOS App 版本 9.7（此版送審重點 · 2026-06-15）

### 定價與供應

- **免費**（無 App 內購買入口）
- 可用國家／地區：依你原本設定

### App 審查資訊（Review Information）

- **需要登入：取消勾選**
- 示範帳號：留空（不需要）
- 備註（英文，可直接貼）：

```text
This build (V9.7 / 9611) is the Construction Master calculation workspace. Privacy policy last updated: 2026-06-15.

- Launch: WebView opens https://gt492145-sudo.github.io/BuildMaster_v96/index.html?build=9611&iosreview=1&logo=v2
- No login required. Users enter the main workspace immediately.
- UI languages: Traditional Chinese, English, Japanese (follows device / URL lang= parameter).
- Page 1 = simple calc + local demo group chat (bubble UI); Page 2 = full features + blueprint + advanced tools; Page 3 = staking mode.
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
V9.7 更新（2026-06-15）：
• 介面支援繁中／英／日三語
• 第1頁群組聊天區更醒目；本機聊天＋試算📊卡片說明與公開隱私權一致
• 使用一段時間後可選擇性顯示五星評分提示（偏好僅存本機；4–5 星可開 App Store 官方評分）
• 解說員提示同步三語化
• 免登入即可使用計算工作區；本版仍為免費 App，無訂閱／無廣告
• 原生 AR／LiDAR 將於後續版本加入
```

---

## 描述（Description · 繁中建議）

Construction Master 是面向工地與工程現場的計算與試算工具。

本版（V9.7 · build 9611）提供：
• 第1頁：簡單工程試算與本機群組聊天（文字泡泡＋試算📊卡片，不需登入）
• 第2頁：圖面量測、完整計算與進階試算
• 第3頁：BIM 放樣與 QA 工作區
• 介面語言：繁中／英／日

第1頁聊天為裝置本機示範（含試算卡片泡泡），非雲端即時多人聊天室。解說員會說明此範圍，與公開隱私權政策（最後更新 2026-06-15）一致。

本版尚未包含：原生 AR／LiDAR App 入口（後續更新）。

本 App 免費使用，開啟後無需登入即可進入主工作區。

隱私權政策：https://sites.google.com/view/buildmaster-privacy/首頁

---

## 行銷宣傳文字（Promotional Text · 170 字內）

Construction Master V9.7：工程試算工作區，繁中／英／日。第1頁本機聊天＋試算卡片、第2頁全功能量圖、第3頁放樣。免費免登入；隱私政策 2026-06-15 更新。

---

## 回覆 Apple Resolution Center（英文）

```text
Hello App Review Team,

Thank you for your review. Build 9.7 (9611) updates the calculation workspace with trilingual UI, clearer local group-chat disclosure, and an optional local-only rating prompt (SKStoreReviewController for 4–5 stars). Privacy policy last updated: 2026-06-15.

1. Login: no password required on launch; WebView opens the main workspace immediately.
2. Group chat: local device demo only (not a live server). Page 1 quick input + 📊 calc card bubbles after "Add to list".
3. Privacy: aligned with https://sites.google.com/view/buildmaster-privacy/首頁 and in-app privacy summary (privacy.html).
4. Rating prompt: stored on device only (bm_69:app_rating_v1); does not upload preferences to our server.
5. Free build; no IAP UI; no ads.

Web URL: https://gt492145-sudo.github.io/BuildMaster_v96/index.html?build=9611&iosreview=1&logo=v2

Please test with a clean install on iPad. No demo account required.

Thank you.
```

---

## Google Sites 隱私頁（請手動貼上 · 2026-06-15）

站內 `privacy.html` 已更新（2026-06-15 · V9.7 · build 9611）；請到 [Google Sites 隱私頁](https://sites.google.com/view/buildmaster-privacy/首頁) 同步：

1. 頁首「最後更新」改為 **2026 年 6 月 15 日**，適用版本 **V9.7 · build 9611**
2. 新增 **§6.4 App 內五星評分提示**（本機偏好 + SKStoreReviewController／Play 商店）
3. 確認 **§6.2 本機群組聊天** 與 App 內文案一致

```text
【V9.7 · build 9611 · 2026-06-15】
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

測完後在 Connect 選 build **9611**，取消「需要登入」，貼上方英文審查備註。

---

## 送審前 Checklist

- [ ] GitHub Pages 已 push（build=9611、三語、聊天、評分提示）
- [ ] Google Sites 隱私頁已更新為 **2026-06-15 · V9.7 · 9611**（含評分段落）
- [ ] iPad 清安裝實測全部打勾
- [ ] Xcode Archive 來自 **Documents/LiDARRangefinder**，Build **9611**
- [ ] Connect 版本 **9.7**、Build **9611** 送審
- [ ] 取消「需要登入」
- [ ] App 隱私：維持「未收集資料」（評分偏好僅本機；SKStoreReviewController 為 Apple 系統 API）

---

## macOS App（方案 B · ConstructionMasterMac）

### Xcode 專案

| 項目 | 值 |
|------|-----|
| 專案 | `~/Documents/LiDARRangefinder/LiDARRangefinder.xcodeproj` |
| Scheme | **ConstructionMasterMac**（不是 LiDARRangefinder） |
| Target | ConstructionMasterMac |
| Version / Build | **9.7 / 9611**（與 iOS 相同） |
| Bundle ID | tw.buildmaster.constructionmaster |
| 入口 | WebView → `BuildMaster_v96/index.html?build=9611&iosreview=1&logo=v2&platform=mac&lang=...` |

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
5. Connect → 左側 **macOS App** → 版本 **9611**（或 9.7）→ **建置版本** 選剛上傳的 Mac build  
6. 填 **此版本的新增功能**（可沿用 iOS 9.7 文案，加一句「Mac 版工程試算工作區」）  
7. 補 **Mac 截圖**（1280×800 等）→ **新增以供審查**  

### macOS 審查備註（英文 · 可貼）

```text
This macOS build (V9.7 / 9611) wraps the same Construction Master web workspace in a native Mac app (WKWebView).

- URL: https://gt492145-sudo.github.io/BuildMaster_v96/index.html?build=9611&iosreview=1&logo=v2&platform=mac
- No login required. Free app; no IAP; no ads.
- Page 1 local demo group chat (device-only). Same privacy policy as iOS.
- Optional rating prompt uses local storage only; 4–5 stars may call SKStoreReviewController.

Please test on a clean Mac install. No demo account required.
```

### macOS 此版本新增功能（繁中 · 可貼）

```text
Construction Master Mac 版（V9.7）：
• Mac App Store 獨立 App，開啟即進入工程試算工作區
• 與 iOS 相同：免登入、三語、本機群組聊天、解說員、試算卡片
• 內容與網頁工作區同步更新；免費、無訂閱、無廣告
```

### 注意

- **iOS build 9611 ≠ macOS build 9611**：必須用 **ConstructionMasterMac** 各 Archive 上傳一次，才會出現在 Connect **macOS App** 建置列表。  
- 使用者從 **Mac App Store** 下載；若只用瀏覽器，不必下載 App。  
- 隱私權 URL 與 iOS 相同：https://sites.google.com/view/buildmaster-privacy/首頁  
