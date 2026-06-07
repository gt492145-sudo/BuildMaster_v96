# App Store Connect 對齊清單（V9.6 · build 9606）

## 必須一致（Xcode ↔ Connect）

| 項目 | App Store Connect | Xcode（Documents 專案） |
|------|-------------------|-------------------------|
| 版本 Version | **9.6** | MARKETING_VERSION = **9.6** |
| 建置 Build | **9606**（上傳後選這個） | CURRENT_PROJECT_VERSION = **9606** |
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
This build (V9.6 / 9606) is the Construction Master calculation workspace.

- Launch: WebView opens https://gt492145-sudo.github.io/BuildMaster_v96/index.html
- No login required. Users enter the main workspace immediately.
- Page 1 = simple calc + local demo group chat (bubble UI); Page 2 = full features + blueprint + advanced tools; Page 3 = staking mode.
- Group chat on Page 1 is a LOCAL demo only (messages stored on device, not a live multi-user server). Default channel: "群組大廳". Sender shows as "訪客" (Guest) without login. Type a message in the quick input and press Enter to test.
- After "Add to list" (吸入計算清單), calc results auto-post as structured 📊 card bubbles to the same local chat (still device-only, not uploaded).
- In-app Coach (解說員) explains features including local chat privacy; aligned with public Privacy Policy URL.
- NOT in this version: native AR/LiDAR at app launch (future update).
- Free app; no in-app purchase UI.

Please test on iPad with a clean install. No demo account required.
```

### 此版本的新增功能（What's New · 繁中）

```text
V9.6 更新：
• 免登入即可使用計算工作區
• 第1頁：簡單試算＋本機群組聊天（泡泡對話＋試算📊卡片）；第2頁：圖面全功能（含進階試算）；第3頁：放樣
• 解說員可說明聊天／試算卡片為本機示範，與公開隱私權一致
• 修正 iPad 登入卡住問題
• 本版為免費計算 App；原生 AR／LiDAR 將於後續版本加入
```

---

## 描述（Description · 繁中建議）

Construction Master 是面向工地與工程現場的計算與試算工具。

本版（V9.6）提供：
• 第1頁：簡單工程試算與本機群組聊天（文字泡泡＋試算📊卡片，不需登入）
• 第2頁：圖面量測、完整計算與進階試算（含 IBM 相關工具）
• 第3頁：BIM 放樣與 QA 工作區

第1頁聊天為裝置本機示範（含試算卡片泡泡），非雲端即時多人聊天室。解說員會說明此範圍，與公開隱私權政策一致。

本版尚未包含：原生 AR／LiDAR App 入口（後續更新）。

本 App 免費使用，開啟後無需登入即可進入主工作區。

隱私權政策：https://sites.google.com/view/buildmaster-privacy/首頁

---

## 行銷宣傳文字（Promotional Text · 170 字內）

Construction Master V9.6：工程計算與試算工作區。第1頁簡單+本機聊天、第2頁全功能量圖（含進階）、第3頁放樣。免費免登入；原生 AR／LiDAR 後續更新。

---

## 回覆 Apple Resolution Center（英文）

```text
Hello App Review Team,

Thank you for the feedback on build 9.6.

We fixed the iPad login issue and clarified scope:

1. Login: the app no longer requires a password on launch. Users enter the main workspace immediately via WebView.
2. Pages: Page 1 simple calc + local demo group chat (bubble UI); Page 2 full features (including advanced tools); Page 3 staking mode. Native AR/LiDAR is not enabled in this version.
3. Group chat: local device demo only (not a live server chat). No account needed. On Page 1, type a message and press Enter — chat bubbles appear under "群組大廳". After adding a calc row, a 📊 result card bubble is auto-posted locally.
4. Coach narrator explains features including local-chat privacy scope (aligned with Privacy Policy URL).
5. Payments: free build with no in-app purchase UI.

Web URL: https://gt492145-sudo.github.io/BuildMaster_v96/index.html

Please test with a clean install on iPad. No demo account is required.

Thank you.
```

---

## Google Sites 隱私頁（請手動貼上）

站內 `privacy.html` 已更新；請到 [Google Sites 隱私頁](https://sites.google.com/view/buildmaster-privacy/首頁) 新增或同步以下段落：

```text
【V9.6 · 免登入、本機聊天與試算卡片】
• iOS App 無需登入即可進入主工作區。
• 第 1 頁「群組聊天」為裝置本機示範（文字泡泡＋試算📊卡片），訊息存於裝置本機，不會自動同步到其他裝置或雲端。
• 未登入時聊天身份顯示為「訪客」；「群組大廳」為本機預設頻道，非即時多人連線聊天室。
• App 內「解說員」會說明上述範圍，與本公開隱私頁一致。
• 原生 AR／LiDAR 功能將於後續 App 更新加入。
```

---

## iPad 清安装实测清单（送审前必做）

在 **iPad** 上删除 App 后重装，或 Settings → Safari → 清除网站数据后再测。

| # | 步骤 | 预期结果 | 通过 |
|---|------|----------|------|
| 1 | 全新安装后打开 App | 直接进入工作区，**不出现**密码锁屏卡住 | ☐ |
| 2 | 确认顶部有「第1页／第2页」 | 可切换，页面内容随页变化 | ☐ |
| 3 | 第1页 → 聊天快速输入框输入「测试」按 Enter | 出现右侧文字泡泡，身份为「访客」 | ☐ |
| 3b | 第1页 → 试算后按「吸入计算清单」 | 群组大厅出现📊试算卡片泡泡（本机） | ☐ |
| 4 | 点「开启会员聊天群组」 | 面板打开，显示「目前身份：访客」 | ☐ |
| 5 | 点右上角「解说员」→ 点聊天区 | 解说说明本机聊天／试算卡片与隐私范围 | ☐ |
| 6 | 切换到第2页 | 出现图面／全功能区域 | ☐ |
| 7 | 切换到「放样模式」 | 进入放样工作区 | ☐ |
| 8 | 全程无需输入账号密码 | 无卡住、无 404 主页 | ☐ |

测完后在 Connect 选 build **9606**，取消「需要登入」，贴上方的英文审查备注。

---

## 送审前 Checklist

- [x] GitHub Pages 已 push（免登入、两页计算+放样、泡泡聊天、访客身份）
- [ ] Google Sites 隐私页已手动贴上「本机聊天」段落
- [ ] iPad 清安装实测 7 项全部打勾
- [ ] Xcode Archive 来自 **Documents/LiDARRangefinder**，Build **9606**
- [ ] Connect 选 build **9606** 送审
- [ ] 取消「需要登入」
