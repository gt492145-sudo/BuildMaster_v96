# App Store Connect 對齊清單（V9.6 · build 9605）

## 必須一致（Xcode ↔ Connect）

| 項目 | App Store Connect | Xcode（Documents 專案） |
|------|-------------------|-------------------------|
| 版本 Version | **9.6** | MARKETING_VERSION = **9.6** |
| 建置 Build | **9605**（上傳後選這個） | CURRENT_PROJECT_VERSION = **9605** |
| Bundle ID | **tw.buildmaster.constructionmaster** | tw.buildmaster.constructionmaster.LiDARRangefinder |
| 送審 Xcode 專案 | — | `~/Documents/LiDARRangefinder/LiDARRangefinder.xcodeproj` |

**不要**用 `com.aji.buildmaster...` 那份 Dev 專案更新此 Connect App。

---

## App 資訊（App Information）

| 欄位 | 建議值 |
|------|--------|
| 名稱 | Construction Master V9.6 |
| 副標題 | 工程計算與試算工作區 |
| 主要語言 | 繁體中文 |
| 類別 | 工具程式 |
| 隱私權政策 URL | https://sites.google.com/view/buildmaster-privacy/首頁 |

---

## iOS App 版本 9.6（此版送審重點）

### 定價與供應

- **免費**（無 App 內購買入口）
- 可用國家／地區：依你原本設定

### App 審查資訊（Review Information）

- **需要登入：取消勾選**
- 示範帐号：留空（不需要）
- 備註（英文，可直接貼）：

```text
This build (V9.6 / 9605) is the Construction Master calculation workspace.

- Launch: WebView opens https://gt492145-sudo.github.io/BuildMaster_v96/index.html
- No login required. Page 1 = simple calc + group chat; Page 2 = full features + blueprint; Page 3 = advanced; Page 4 = staking (separate mode).
- NOT in this version: native AR/LiDAR at app launch (future update).
- Free app; no in-app purchase UI.

Please test on iPad with a clean install. No demo account required.
```

### 此版本的新增功能（What's New · 繁中）

```text
V9.6 更新：
• 免登入即可使用計算工作區
• 第1頁：簡單試算＋群組聊天；第2頁：圖面全功能；第3頁：進階試算；第4頁：放樣
• 修正 iPad 登入卡住問題
• 本版為免費計算 App；原生 AR／LiDAR 將於後續版本加入
```

---

## 描述（Description · 繁中建議）

Construction Master 是面向工地與工程現場的計算與試算工具。

本版（V9.6）提供：
• 第1頁：簡單工程試算與會員群組聊天
• 第2頁：圖面量測與完整計算功能
• 第3頁：進階試算與 IBM 相關工具
• 第4頁：BIM 放樣與 QA 工作區

本版尚未包含：原生 AR／LiDAR App 入口（後續更新）。

本 App 免費使用，開啟後無需登入即可進入主工作區。

隱私權政策：https://sites.google.com/view/buildmaster-privacy/首頁

---

## 行銷宣傳文字（Promotional Text · 170 字內）

Construction Master V9.6：工程計算與試算工作區。第1頁簡單+聊天、第2頁全功能量圖、第3頁進階、第4頁放樣。免費免登入；原生 AR／LiDAR 後續更新。

---

## 回覆 Apple Resolution Center（英文）

```text
Hello App Review Team,

Thank you for the feedback on build 9.6.

We fixed the iPad login issue and clarified scope:

1. Login: the app no longer requires a password on launch. Users enter the main workspace immediately via WebView.
2. Pages: Page 1 simple calc + chat; Page 2 full features; Page 3 advanced; Page 4 staking. Native AR/LiDAR is not enabled in this version.
3. Payments: free build with no in-app purchase UI.

Web URL: https://gt492145-sudo.github.io/BuildMaster_v96/index.html

Please test with a clean install on iPad. No demo account is required.

Thank you.
```

---

## 送審前 Checklist

- [ ] GitHub Pages 已 push 最新 v96（含免登入、三页切换）
- [ ] Xcode Archive 来自 **Documents/LiDARRangefinder**，Build **9605**
- [ ] Connect 選 build **9605** 送審
- [ ] 取消「需要登入」
- [ ] 隐私 URL 与 Google Sites 一致
