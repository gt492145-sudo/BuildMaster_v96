(function (global) {
    'use strict';
    const RULES = [
    {
        "sel": "#calcMeasureCluster",
        "key": "calcMeasureCluster",
        "msg": "【說明】智慧量測區，尺寸會回填右側試算欄。【操作】①上傳圖紙 ②「🧠智慧定比例」點兩點輸入真實長度 ③「✨智慧量圖」量尺寸；可按「▶30秒示範」。"
    },
    {
        "sel": "button[onclick=\"startSmartCalibration()\"]",
        "key": "startSmartCalibration",
        "msg": "【說明】用兩點＋真實長度建立圖面比例。【操作】按此→在圖上點兩點→輸入實際距離→看到比例已設再量圖。"
    },
    {
        "sel": "button[onclick=\"startSmartMeasure()\"]",
        "key": "startSmartMeasure",
        "msg": "【說明】依已設比例量取構件尺寸。【操作】按此→在圖上點起點與終點→數值自動填入右側欄位。"
    },
    {
        "sel": "#calcAiVisionCluster",
        "key": "calcAiVisionCluster",
        "msg": "這一組是第三頁 AI 看圖辨識：依序可做快速判讀、精準辨識、讀柱樑尺寸標註，再把結果送進自動估算。"
    },
    {
        "sel": "#calcIbmCluster",
        "key": "calcIbmCluster",
        "msg": "這一組是第三頁 IBM 自動計算區：先做估算與匯入清單，第四頁放樣功能不會在這裡顯示。"
    },
    {
        "sel": "#stakeExecutionCluster",
        "key": "stakeExecutionCluster",
        "msg": "這一組是第四頁放樣執行設定：先勾選柱、牆、梁與放樣高精度，再執行一鍵放樣流程或 IBM 雲端放樣。"
    },
    {
        "sel": "#stakeQaCluster",
        "key": "stakeQaCluster",
        "msg": "這一組是第四頁放樣 QA 檢核：集中做控制點配準、偏差熱圖、穩定度重測、分群與放樣 QA。"
    },
    {
        "sel": "#stakeExportCluster",
        "key": "stakeExportCluster",
        "msg": "這一組是第四頁放樣輸出與現場工具：完成 QA 後再匯出放樣點、QA 報告、施工包，或開啟補點建議與現場抽驗。"
    },
    {
        "sel": "#stakeFieldSimulator",
        "key": "stakeFieldSimulator",
        "msg": "現場放樣對位：對齊工地照片與放樣點，確認現場位置是否正確（不影響座標計算）。"
    },
    {
        "sel": ".electrical-section--sim",
        "key": "electricalFieldSim",
        "msg": "現場電壓對位：對齊現場照片與電壓量測點，確認接線位置。"
    },
    {
        "sel": "#ifcInput",
        "key": "ifcInput",
        "msg": "這裡上傳模型檔，系統會做 BIM QA 解析與構件統計。"
    },
    {
        "sel": "#ifcSearch",
        "key": "ifcSearch",
        "msg": "可輸入構件類型或 #ID 查詢模型，例如 牆、柱、梁、#123。"
    },
    {
        "sel": "#bimRuleIfcType",
        "key": "bimRuleIfcType",
        "msg": "先輸入構件類型，例如 牆、柱、梁。"
    },
    {
        "sel": "#bimRuleMaterial",
        "key": "bimRuleMaterial",
        "msg": "選擇要對應的材料，估價時會優先套用這條規則。"
    },
    {
        "sel": "button[onclick=\"saveBimRule()\"]",
        "key": "saveBimRule",
        "msg": "儲存規則後，BIM 自動估價會優先採用你的自訂映射。"
    },
    {
        "sel": "button[onclick=\"deleteBimRule()\"]",
        "key": "deleteBimRule",
        "msg": "刪除指定構件類型的自訂規則，會回到系統預設匹配。"
    },
    {
        "sel": "button[onclick=\"exportBimRules()\"]",
        "key": "exportBimRules",
        "msg": "匯出目前 BIM 規則檔（JSON），可跨裝置共用。"
    },
    {
        "sel": "button[onclick=\"triggerImportBimRules()\"]",
        "key": "triggerImportBimRules",
        "msg": "匯入規則檔（JSON），快速套用既有 BIM 匹配設定。"
    },
    {
        "sel": "button[onclick=\"resetBimRules()\"]",
        "key": "resetBimRules",
        "msg": "清空全部 BIM 規則，恢復系統預設匹配。"
    },
    {
        "sel": "button[onclick=\"generateBIMEstimate()\"]",
        "key": "generateBIMEstimate",
        "msg": "依構件類型與材料單價自動產生 IBM/BIM 估價預覽表。"
    },
    {
        "sel": "button[onclick=\"importBIMEstimateToList()\"]",
        "key": "importBIMEstimateToList",
        "msg": "把 IBM/BIM 估價結果一鍵匯入主清單，直接進入總價彙整。"
    },
    {
        "sel": "button[onclick=\"runQuantumAutoStakeLayout()\"]",
        "key": "runQuantumAutoStakeLayout",
        "msg": "核心自進放樣：自動執行生成點位、高精度修正、分群 QA 與放樣 QA。"
    },
    {
        "sel": "button[onclick=\"generateBimLayoutPoints()\"]",
        "key": "generateBimLayoutPoints",
        "msg": "從模型自動抽取放樣點（柱心、牆端點、梁端點）。"
    },
    {
        "sel": "button[onclick=\"runBimLayoutQa()\"]",
        "key": "runBimLayoutQa",
        "msg": "執行放樣 QA，檢查重複點、缺漏與越界，產生分數。"
    },
    {
        "sel": "button[onclick=\"exportBimLayoutPoints()\"]",
        "key": "exportBimLayoutPoints",
        "msg": "匯出放樣點 CSV，可交給儀器或現場施工使用。"
    },
    {
        "sel": "button[onclick=\"exportBimLayoutQaReport()\"]",
        "key": "exportBimLayoutQaReport",
        "msg": "匯出放樣 QA 報告 CSV，作為交付與稽核依據。"
    },
    {
        "sel": "#bimLayoutBody",
        "key": "bimLayoutBody",
        "msg": "這裡是放樣點預覽表，最多先顯示前 200 筆。"
    },
    {
        "sel": "#bimLayoutQaSummary",
        "key": "bimLayoutQaSummary",
        "msg": "這裡會顯示放樣 QA 的分數與關鍵指標。"
    },
    {
        "sel": "#bimUnmatchedType",
        "key": "bimUnmatchedType",
        "msg": "這裡列出尚未匹配的構件類型，先選一個要修正的類型。"
    },
    {
        "sel": "#bimUnmatchedMaterial",
        "key": "bimUnmatchedMaterial",
        "msg": "這裡選要套用的材料，選好後可單筆或批次修復。"
    },
    {
        "sel": "button[onclick=\"applyUnmatchedRuleOnce()\"]",
        "key": "applyUnmatchedRuleOnce",
        "msg": "把選定材料套用到目前這個未匹配構件類型，並立即重算。"
    },
    {
        "sel": "button[onclick=\"applyUnmatchedRuleAll()\"]",
        "key": "applyUnmatchedRuleAll",
        "msg": "把同一材料批次套用到所有未匹配構件類型，適合快速補齊規則。"
    },
    {
        "sel": "#unitFrom') || target.closest('#unitTo",
        "key": "unitFrom",
        "msg": "先選來源與目標單位，再按換算。若單位不同類型會提示不相容。"
    },
    {
        "sel": "button[onclick=\"runUnitConvert()\"]",
        "key": "runUnitConvert",
        "msg": "單位換算器：先選來源/目標單位，快速核對數值是否一致。"
    },
    {
        "sel": "button[onclick=\"createDataSnapshot(\\'手動快照\\')\"]",
        "key": "createDataSnapshot",
        "msg": "手動建立版本快照，會保存規則、估價與清單狀態。"
    },
    {
        "sel": "button[onclick=\"rollbackLatestSnapshot()\"]",
        "key": "rollbackLatestSnapshot",
        "msg": "一鍵回到最近快照，適合誤操作後立即復原。"
    },
    {
        "sel": "button[onclick=\"rollbackLatestSnapshot(\\'rules\\')\"]",
        "key": "rollbackLatestSnapshot",
        "msg": "只回滾最近快照中的 BIM 規則，不影響主清單。"
    },
    {
        "sel": "button[onclick=\"rollbackLatestSnapshot(\\'list\\')\"]",
        "key": "rollbackLatestSnapshot",
        "msg": "只回滾最近快照中的主清單，不影響 BIM 規則。"
    },
    {
        "sel": "button[onclick=\"rollbackLatestSnapshot(\\'estimate\\')\"]",
        "key": "rollbackLatestSnapshot",
        "msg": "只回滾最近快照中的 BIM 估價表，不會改動規則與主清單。"
    },
    {
        "sel": "button[onclick=\"exportSnapshots()\"]",
        "key": "exportSnapshots",
        "msg": "匯出所有快照為 JSON，可做備份或跨裝置還原。"
    },
    {
        "sel": "button[onclick=\"triggerImportSnapshots()\"]",
        "key": "triggerImportSnapshots",
        "msg": "匯入快照 JSON，把歷史版本帶回本機。"
    },
    {
        "sel": "#bimEstimateBody",
        "key": "bimEstimateBody",
        "msg": "這裡是 IBM/BIM 估價預覽，可先確認匹配結果再匯入。"
    },
    {
        "sel": "#regionSelect",
        "key": "regionSelect",
        "msg": "可選地區價目；若地區資料筆數太少，系統會自動改用全台完整價目。"
    },
    {
        "sel": "button[onclick=\"autoDetectRegion()\"]",
        "key": "autoDetectRegion",
        "msg": "按這裡才會要求抓取目前工地，並把所在地區套用到價目與天氣。"
    },
    {
        "sel": "#siteWeatherInfo') || target.closest('#siteWeatherSafety') || target.closest('#siteWeatherNews",
        "key": "siteWeatherInfo",
        "msg": "這裡顯示工地即時天氣與施工建議，系統會自動更新。"
    },
    {
        "sel": "#materialSearch",
        "key": "materialSearch",
        "msg": "輸入關鍵字搜尋材料，例如：模板、混凝土、鋼筋。"
    },
    {
        "sel": "#materialSelect",
        "key": "materialSelect",
        "msg": "材料清單順序為：名稱、計價單位、價錢。"
    },
    {
        "sel": "#materialCountChip",
        "key": "materialCountChip",
        "msg": "這裡顯示目前載入的價目筆數，正常應該是多筆資料。"
    },
    {
        "sel": "button[onclick=\"applySelectedMaterialPrice()\"]",
        "key": "applySelectedMaterialPrice",
        "msg": "把選好的材料單價帶入「單價欄」，省去手動輸入。"
    },
    {
        "sel": "#fileInput",
        "key": "fileInput",
        "msg": "這格是圖紙上傳框：先選圖片，再做定比例與量測。"
    },
    {
        "sel": "button[onclick=\"changeZoom(0.2)\"]",
        "key": "zoomIn",
        "msg": "放大圖面，方便點更精準的位置。"
    },
    {
        "sel": "button[onclick=\"changeZoom(-0.2)\"]",
        "key": "zoomOut",
        "msg": "縮小圖面，方便看整體配置。"
    },
    {
        "sel": "button[onclick=\"toggleMeasureAssist()\"]",
        "key": "toggleMeasureAssist",
        "msg": "量圖輔助：只在定比例與測量時提示手機傾斜，幫你提高量圖穩定度。"
    },
    {
        "sel": "button[onclick=\"calibrateMeasureAssist()\"]",
        "key": "calibrateMeasureAssist",
        "msg": "量圖校正：開始量圖前先校正，可降低手持角度偏差。"
    },
    {
        "sel": "button[onclick=\"toggleMeasureStrictMode()\"]",
        "key": "toggleMeasureStrictMode",
        "msg": "量圖嚴格模式：傾斜角超過門檻會暫停取點，避免誤測。"
    },
    {
        "sel": "#measureAssistInfo",
        "key": "measureAssistInfo",
        "msg": "這裡顯示量圖輔助狀態與目前傾斜角度。"
    },
    {
        "sel": "button[onclick=\"toggleGyroMode()\"]",
        "key": "toggleGyroMode",
        "msg": "陀螺儀輔助：手機傾斜可控制 3D 視角，提升操作穩定度。"
    },
    {
        "sel": "button[onclick=\"calibrateGyroBaseline()\"]",
        "key": "calibrateGyroBaseline",
        "msg": "校正陀螺儀：啟用後先保持手機不動 1 秒，能降低漂移誤差。"
    },
    {
        "sel": "#gyroInfo",
        "key": "gyroInfo",
        "msg": "這裡顯示陀螺儀狀態：未啟用、啟用中或追蹤中。"
    },
    {
        "sel": "button[onclick=\"startCalibration()\"]",
        "key": "startCalibration",
        "msg": "定比例功能：先點兩點，再輸入真實長度，系統就知道比例。"
    },
    {
        "sel": "button[onclick=\"startMeasure()\"]",
        "key": "startMeasure",
        "msg": "量測功能：點起點和終點，距離會自動填入欄位。"
    },
    {
        "sel": "button[onclick=\"clearCanvas()\"]",
        "key": "clearCanvas",
        "msg": "清空目前標註線段與點位，不會刪掉你的清單資料。"
    },
    {
        "sel": "#scale-info",
        "key": "scaleInfo",
        "msg": "這裡顯示比例狀態；看到「已設」就可以開始量測。"
    },
    {
        "sel": "#project_name",
        "key": "project_name",
        "msg": "專案名稱欄：用來識別這次工程。"
    },
    {
        "sel": "#floor_tag",
        "key": "floor_tag",
        "msg": "樓層/分區欄：每筆項目會帶入這個位置標籤。"
    },
    {
        "sel": "#memberAccountInput",
        "key": "memberAccountInput",
        "msg": "輸入會員帳號（英文/數字），可為不同使用者設定各自密碼。"
    },
    {
        "sel": "#memberPasswordInput",
        "key": "memberPasswordInput",
        "msg": "輸入會員密碼後按儲存，之後可用該帳號+密碼登入。"
    },
    {
        "sel": "button[onclick=\"saveMemberCode()\"]",
        "key": "saveMemberCode",
        "msg": "儲存會員密碼（本機），建立或更新會員登入資料。"
    },
    {
        "sel": "button[onclick=\"deleteMemberCodeFromInput()\"]",
        "key": "deleteMemberCodeFromInput",
        "msg": "刪除指定會員帳號，刪除後將不能用該帳號登入。"
    },
    {
        "sel": "#memberCodeBody",
        "key": "memberCodeBody",
        "msg": "這裡是目前可登入的會員帳號清單（本機儲存）。"
    },
    {
        "sel": "#coachToggle",
        "key": "coachToggle",
        "msg": "可在這裡一鍵開關解說員；開啟後點擊任何功能區都會出現說明，含群組聊天、試算卡片與隱私權對照提示。"
    },
    {
        "sel": "#levelBasicBtn",
        "key": "levelBasicBtn",
        "msg": "會員1（基礎）：保留最必要功能，適合快速上手。"
    },
    {
        "sel": "#levelStandardBtn",
        "key": "levelStandardBtn",
        "msg": "會員2（工程）：開啟量圖輔助、QA 報告與部分進階工具。"
    },
    {
        "sel": "#levelProBtn",
        "key": "levelProBtn",
        "msg": "會員3（專家）：顯示完整 BIM/規則/快照等高階模組。"
    },
    {
        "sel": "#workCalcBtn",
        "key": "workCalcBtn",
        "msg": "計算模式：固定對應第1到3頁，包含工種試算、智慧量圖、AI 看圖辨識、IBM 自動估算與報表輸出。"
    },
    {
        "sel": "#workStakeBtn",
        "key": "workStakeBtn",
        "msg": "放樣模式：固定對應第4頁，包含模型解析、放樣點抽取、控制點配準、放樣 QA 與施工包輸出。"
    },
    {
        "sel": "#workElectricalBtn",
        "key": "workElectricalBtn",
        "msg": "電機模式：設定電壓／電流／腳本模式，一鍵匯出 mecha_config.txt 供本機 Python 或現場測試（僅存裝置）。"
    },
    {
        "sel": "#aiCoachToggle",
        "key": "aiCoachToggle",
        "msg": "AI 解說員：可在規則解說外補充更彈性的操作建議（需先完成後端代理設定）。"
    },
    {
        "sel": "#coachAiInput",
        "key": "coachAiInput",
        "msg": "可直接問 BIM/IFC 問題，例如「IFC 裡柱有幾根？未匹配有哪些？」再按問AI。"
    },
    {
        "sel": "#coachAiAskBtn",
        "key": "coachAiAskBtn",
        "msg": "送出你輸入的問題給 AI 解說員，回覆會顯示在氣泡中。"
    },
    {
        "sel": "#coachGuideBtn",
        "key": "coachGuideBtn",
        "msg": "點這裡可重跑新手導覽，含第1頁聊天、試算卡片泡泡與隱私權說明。"
    },
    {
        "sel": "#contrastToggle",
        "key": "contrastToggle",
        "msg": "高對比模式：加強文字與按鈕對比，夜間或戶外較好辨識。"
    },
    {
        "sel": "#contrastAutoToggle",
        "key": "contrastAutoToggle",
        "msg": "自動高對比：傍晚到清晨自動切換，白天恢復一般模式。"
    },
    {
        "sel": "#calcPage1Btn",
        "key": "calcPage1Btn",
        "msg": "第1頁：簡單試算＋本機群組聊天。聊天與試算📊卡片為裝置本機示範，非雲端即時多人；詳見公開隱私權（Google Sites／privacy.html）。"
    },
    {
        "sel": "#calcPage2Btn",
        "key": "calcPage2Btn",
        "msg": "第2頁：圖面量測與完整工程功能（含進階試算、IBM 工具）。"
    },
    {
        "sel": "#btnWarRoom') || target.closest('#btnCtrlWarRoom",
        "key": "btnWarRoom",
        "msg": "戰情室：連線後可同步雲端資料列；離線時仍可本機試算。"
    },
    {
        "sel": "#btnCtrlVoice",
        "key": "btnCtrlVoice",
        "msg": "語音助理總開關：開啟後可在藍圖頁用麥克風口述尺寸自動填欄。"
    },
    {
        "sel": "#btnCtrlAiVision",
        "key": "btnCtrlAiVision",
        "msg": "AI 盤點總開關：控制 AI 看圖辨識相關按鈕是否顯示。"
    },
    {
        "sel": "#btnCtrlLaser",
        "key": "btnCtrlLaser",
        "msg": "藍牙雷射尺總開關：關閉後隱藏連線雷射尺相關功能。"
    },
    {
        "sel": "#btnWarRoomRows",
        "key": "btnWarRoomRows",
        "msg": "控制是否在清單中顯示戰情室雲端資料列。"
    },
    {
        "sel": "button[onclick=\"startVoiceAgent()\"]",
        "key": "startVoiceAgent",
        "msg": "工地語音助理：對著手機說尺寸（如長5寬3高2），系統會自動填入欄位。"
    },
    {
        "sel": "a[href*=\"buildmaster-privacy\"], a[href=\"privacy.html\"]",
        "key": "privacyLink",
        "msg": "公開隱私權政策（Google Sites 為準、站內 privacy.html 為摘要）：本機群組聊天與試算卡片僅存於裝置，不上傳雲端；與 App Store 版 Construction Master 一致。"
    },
    {
        "sel": "#freeWarRoomCard",
        "key": "freeWarRoomCard",
        "msg": "第1頁交流區：群組大廳為本機泡泡對話；按「吸入計算清單」後，試算結果會自動變成📊卡片泡泡。資料僅存本機，換裝置不同步。"
    },
    {
        "sel": "#memberChatQuickPreview",
        "key": "memberChatQuickPreview",
        "msg": "群組聊天預覽：最近訊息與試算卡片會即時顯示；僅本機示範，不會上傳伺服器。"
    },
    {
        "sel": "#memberChatQuickInput, .member-chat-quick-send",
        "key": "memberChatQuickInput",
        "msg": "群組大廳：輸入文字快速送出（本機泡泡）；試算完成也會自動推送📊卡片到此頻道。"
    },
    {
        "sel": "#memberChatPanel, #memberChatMessageList",
        "key": "memberChatPanel",
        "msg": "會員聊天：可加入好友、切換對象；文字與試算卡片皆存於本機。公開隱私說明見 Google Sites／privacy.html。"
    },
    {
        "sel": "#mobileFuncTab, #mobileFuncDrawer",
        "key": "mobileFuncTab",
        "msg": "手機功能抽屜：集中 3D、量測、日照等戰術工具。"
    },
    {
        "sel": "#mobileLeftTab, #mobileLeftDrawer",
        "key": "mobileLeftTab",
        "msg": "對位抽屜：手動量測與對位微調工具。"
    },
    {
        "sel": "#globalWeatherTicker",
        "key": "globalWeatherTicker",
        "msg": "工地氣象快報：顯示目前天氣與施工安全提示。"
    },
    {
        "sel": "button[onclick=\"fitBlueprintToViewport()\"]",
        "key": "fitBlueprintToViewport",
        "msg": "適配視圖：把圖紙縮放到最適合螢幕的大小。"
    },
    {
        "sel": "button[onclick=\"removeLoadedImage()\"]",
        "key": "removeLoadedImage",
        "msg": "移除目前載入的圖紙，可重新上傳。"
    },
    {
        "sel": "button[onclick=\"connectLaserRuler()\"]",
        "key": "connectLaserRuler",
        "msg": "連線藍牙雷射尺，量到的距離可直接帶入量測。"
    },
    {
        "sel": "button[onclick=\"toggle3DView()\"]",
        "key": "toggle3DView",
        "msg": "3D 檢視：把圖面轉成立體視角觀看。"
    },
    {
        "sel": "button[onclick=\"toggle360Spin()\"]",
        "key": "toggle360Spin",
        "msg": "360 翻轉：自動旋轉 3D 視角。"
    },
    {
        "sel": "button[onclick=\"reset3DView()\"]",
        "key": "reset3DView",
        "msg": "重設 3D 視角到預設位置。"
    },
    {
        "sel": "button[onclick=\"startEdgeAIVision()\"]",
        "key": "startEdgeAIVision",
        "msg": "AI 視覺點料：用相機或圖面自動辨識構件數量。"
    },
    {
        "sel": "#calcType",
        "key": "calcType",
        "msg": "工種公式選擇區：不同工種會套不同計算公式。"
    },
    {
        "sel": "#customName",
        "key": "customName",
        "msg": "自訂部位名稱：例如 C2柱、外牆A區。"
    },
    {
        "sel": "#v1",
        "key": "v1",
        "msg": "尺寸欄 v1：通常是長度或規格。"
    },
    {
        "sel": "#v2",
        "key": "v2",
        "msg": "尺寸欄 v2：通常是寬度或單排長度。"
    },
    {
        "sel": "#v3",
        "key": "v3",
        "msg": "尺寸欄 v3：通常是高度、深度或層數。"
    },
    {
        "sel": "#qty",
        "key": "qty",
        "msg": "數量欄：同一構件的重複數量。"
    },
    {
        "sel": "#unitPrice",
        "key": "unitPrice",
        "msg": "單價欄：輸入後會即時計算每筆小計。"
    },
    {
        "sel": ".preview-bar",
        "key": "previewBar",
        "msg": "即時預覽區：顯示目前算出的數量與金額。"
    },
    {
        "sel": "#shareCalcChatBtn",
        "key": "shareCalcChatBtn",
        "msg": "將最近一次試算結果以📊卡片泡泡再送到群組大廳（本機示範，非雲端廣播）。"
    },
    {
        "sel": ".btn-add",
        "key": "btnAdd",
        "msg": "主按鈕：把目前資料加入計算清單，並自動同步試算📊卡片到群組大廳（本機聊天，不上傳雲端）。"
    },
    {
        "sel": "#listBody",
        "key": "listBody",
        "msg": "明細清單：可檢查每筆數量、單價與金額。"
    },
    {
        "sel": ".btn-export",
        "key": "btnExport",
        "msg": "匯出按鈕：下載 Excel/CSV 報表。"
    },
    {
        "sel": "button[onclick=\"exportMeasureQaReport()\"]",
        "key": "exportMeasureQaReport",
        "msg": "匯出量圖 QA 報告：包含平均傾斜角、最大傾斜與嚴格模式擋下次數。"
    },
    {
        "sel": ".btn-clear",
        "key": "btnClear",
        "msg": "重置按鈕：清空所有資料並重新開始。"
    },
    {
        "sel": ".footer-bar",
        "key": "footerBar",
        "msg": "底部總覽：顯示各工種加總與總預算。"
    },
    {
        "sel": ".drawing-panel",
        "key": "drawingPanel",
        "msg": "左側是圖紙操作區：上傳、定比例、量測都在這裡。"
    },
    {
        "sel": ".calc-panel",
        "key": "calcPanel",
        "msg": "右側是主控制區：計算模式只顯示第1到3頁內容，放樣模式只顯示第四頁內容；兩邊現在已分開顯示。"
    }
];
    /** 會員常用主流程：解說員說明用途＋操作步驟；細部按鈕仍靠導覽或 30 秒示範 */
    const ESSENTIAL_HINT_KEYS = new Set([
        'calcMeasureCluster',
        'startSmartCalibration',
        'startSmartMeasure',
        'stakeExecutionCluster',
        'stakeQaCluster',
        'stakeExportCluster',
        'stakeFieldSimulator',
        'ifcInput',
        'generateBimLayoutPoints',
        'fileInput',
        'workCalcBtn',
        'workStakeBtn',
        'workElectricalBtn',
        'calcPage1Btn',
        'calcPage2Btn',
        'coachGuideBtn',
        'coachToggle',
        'freeWarRoomCard',
        'memberChatQuickInput',
        'memberChatPanel',
        'calcType',
        'previewBar',
        'btnAdd',
        'btnExport',
        'drawingPanel',
        'calcPanel',
        'privacyLink',
        'electricalFieldSim',
    ]);
    const HINTS = {
        'zh-TW': {
            'coach.hint.calcMeasureCluster': "【說明】智慧量測區，尺寸會回填右側試算欄。【操作】①上傳圖紙 ②按「🧠智慧定比例」點兩點輸入真實長度 ③按「✨智慧量圖」量尺寸；不懂可按「▶30秒示範」。",
            'coach.hint.startSmartCalibration': "【說明】用兩點＋真實長度建立圖面比例。【操作】按此鈕→在圖上點兩點→輸入實際距離→看到「比例已設」再量圖。",
            'coach.hint.startSmartMeasure': "【說明】依已設比例量取構件尺寸。【操作】按此鈕→在圖上點起點與終點→數值自動填入右側 v1/v2 欄。",
            'coach.hint.calcAiVisionCluster': "這一組是第三頁 AI 看圖辨識：依序可做快速判讀、精準辨識、讀柱樑尺寸標註，再把結果送進自動估算。",
            'coach.hint.calcIbmCluster': "這一組是第三頁 IBM 自動計算區：先做估算與匯入清單，第四頁放樣功能不會在這裡顯示。",
            'coach.hint.stakeExecutionCluster': "【說明】放樣執行區：選構件類型與精度後產點放樣。【操作】①上傳 IFC ②勾選柱/牆/梁 ③按「生成放樣點」或「一鍵放樣」。",
            'coach.hint.stakeQaCluster': "【說明】放樣 QA：檢查偏差、重複點與穩定度。【操作】填控制點 design/field 座標→按「控制點配準」→再按「執行放樣 QA」看分數。",
            'coach.hint.stakeExportCluster': "【說明】QA 通過後的輸出與現場工具。【操作】按「匯出放樣點 CSV」交儀器；或「匯出 QA 報告」存稽核；現場對照可開現場對位。",
            'coach.hint.stakeFieldSimulator': "【說明】用工地照片對照放樣點位置（視覺確認，不改座標）。【操作】上傳照片→拖曳對齊點位→按「確認對位」；可按「▶30秒示範」。",
            'coach.hint.electricalFieldSim': "【說明】用現場照片對照電壓/接線量測點。【操作】上傳照片→對齊標記→確認；參數填好後可匯出 mecha_config.txt。",
            'coach.hint.ifcInput': "【說明】上傳 IFC/模型做 BIM 解析與構件統計。【操作】按此選檔→等解析完成→到放樣區按「生成放樣點」。座標依上傳檔內容。",
            'coach.hint.ifcSearch': "可輸入構件類型或 #ID 查詢模型，例如 牆、柱、梁、#123。",
            'coach.hint.bimRuleIfcType': "先輸入構件類型，例如 牆、柱、梁。",
            'coach.hint.bimRuleMaterial': "選擇要對應的材料，估價時會優先套用這條規則。",
            'coach.hint.saveBimRule': "儲存規則後，BIM 自動估價會優先採用你的自訂映射。",
            'coach.hint.deleteBimRule': "刪除指定構件類型的自訂規則，會回到系統預設匹配。",
            'coach.hint.exportBimRules': "匯出目前 BIM 規則檔（JSON），可跨裝置共用。",
            'coach.hint.triggerImportBimRules': "匯入規則檔（JSON），快速套用既有 BIM 匹配設定。",
            'coach.hint.resetBimRules': "清空全部 BIM 規則，恢復系統預設匹配。",
            'coach.hint.generateBIMEstimate': "依構件類型與材料單價自動產生 IBM/BIM 估價預覽表。",
            'coach.hint.importBIMEstimateToList': "把 IBM/BIM 估價結果一鍵匯入主清單，直接進入總價彙整。",
            'coach.hint.runQuantumAutoStakeLayout': "核心自進放樣：自動執行生成點位、高精度修正、分群 QA 與放樣 QA。",
            'coach.hint.generateBimLayoutPoints': "【說明】從模型抽柱心、牆端、梁端放樣點。【操作】確認已上傳 IFC 且勾選構件→按此→在表格預覽→再跑 QA。",
            'coach.hint.runBimLayoutQa': "執行放樣 QA，檢查重複點、缺漏與越界，產生分數。",
            'coach.hint.exportBimLayoutPoints': "匯出放樣點 CSV，可交給儀器或現場施工使用。",
            'coach.hint.exportBimLayoutQaReport': "匯出放樣 QA 報告 CSV，作為交付與稽核依據。",
            'coach.hint.bimLayoutBody': "這裡是放樣點預覽表，最多先顯示前 200 筆。",
            'coach.hint.bimLayoutQaSummary': "這裡會顯示放樣 QA 的分數與關鍵指標。",
            'coach.hint.bimUnmatchedType': "這裡列出尚未匹配的構件類型，先選一個要修正的類型。",
            'coach.hint.bimUnmatchedMaterial': "這裡選要套用的材料，選好後可單筆或批次修復。",
            'coach.hint.applyUnmatchedRuleOnce': "把選定材料套用到目前這個未匹配構件類型，並立即重算。",
            'coach.hint.applyUnmatchedRuleAll': "把同一材料批次套用到所有未匹配構件類型，適合快速補齊規則。",
            'coach.hint.unitFrom': "先選來源與目標單位，再按換算。若單位不同類型會提示不相容。",
            'coach.hint.runUnitConvert': "單位換算器：先選來源/目標單位，快速核對數值是否一致。",
            'coach.hint.createDataSnapshot': "手動建立版本快照，會保存規則、估價與清單狀態。",
            'coach.hint.rollbackLatestSnapshot': "一鍵回到最近快照，適合誤操作後立即復原。",
            'coach.hint.rollbackLatestSnapshot': "只回滾最近快照中的 BIM 規則，不影響主清單。",
            'coach.hint.rollbackLatestSnapshot': "只回滾最近快照中的主清單，不影響 BIM 規則。",
            'coach.hint.rollbackLatestSnapshot': "只回滾最近快照中的 BIM 估價表，不會改動規則與主清單。",
            'coach.hint.exportSnapshots': "匯出所有快照為 JSON，可做備份或跨裝置還原。",
            'coach.hint.triggerImportSnapshots': "匯入快照 JSON，把歷史版本帶回本機。",
            'coach.hint.bimEstimateBody': "這裡是 IBM/BIM 估價預覽，可先確認匹配結果再匯入。",
            'coach.hint.regionSelect': "可選地區價目；若地區資料筆數太少，系統會自動改用全台完整價目。",
            'coach.hint.autoDetectRegion': "按這裡才會要求抓取目前工地，並把所在地區套用到價目與天氣。",
            'coach.hint.siteWeatherInfo': "這裡顯示工地即時天氣與施工建議，系統會自動更新。",
            'coach.hint.materialSearch': "輸入關鍵字搜尋材料，例如：模板、混凝土、鋼筋。",
            'coach.hint.materialSelect': "材料清單順序為：名稱、計價單位、價錢。",
            'coach.hint.materialCountChip': "這裡顯示目前載入的價目筆數，正常應該是多筆資料。",
            'coach.hint.applySelectedMaterialPrice': "把選好的材料單價帶入「單價欄」，省去手動輸入。",
            'coach.hint.fileInput': "【說明】圖紙上傳入口。【操作】按此選 JPG/PNG→上傳後到左側量測區定比例、量圖。",
            'coach.hint.zoomIn': "放大圖面，方便點更精準的位置。",
            'coach.hint.zoomOut': "縮小圖面，方便看整體配置。",
            'coach.hint.toggleMeasureAssist': "量圖輔助：只在定比例與測量時提示手機傾斜，幫你提高量圖穩定度。",
            'coach.hint.calibrateMeasureAssist': "量圖校正：開始量圖前先校正，可降低手持角度偏差。",
            'coach.hint.toggleMeasureStrictMode': "量圖嚴格模式：傾斜角超過門檻會暫停取點，避免誤測。",
            'coach.hint.measureAssistInfo': "這裡顯示量圖輔助狀態與目前傾斜角度。",
            'coach.hint.toggleGyroMode': "陀螺儀輔助：手機傾斜可控制 3D 視角，提升操作穩定度。",
            'coach.hint.calibrateGyroBaseline': "校正陀螺儀：啟用後先保持手機不動 1 秒，能降低漂移誤差。",
            'coach.hint.gyroInfo': "這裡顯示陀螺儀狀態：未啟用、啟用中或追蹤中。",
            'coach.hint.startCalibration': "定比例功能：先點兩點，再輸入真實長度，系統就知道比例。",
            'coach.hint.startMeasure': "量測功能：點起點和終點，距離會自動填入欄位。",
            'coach.hint.clearCanvas': "清空目前標註線段與點位，不會刪掉你的清單資料。",
            'coach.hint.scaleInfo': "這裡顯示比例狀態；看到「已設」就可以開始量測。",
            'coach.hint.project_name': "專案名稱欄：用來識別這次工程。",
            'coach.hint.floor_tag': "樓層/分區欄：每筆項目會帶入這個位置標籤。",
            'coach.hint.memberAccountInput': "輸入會員帳號（英文/數字），可為不同使用者設定各自密碼。",
            'coach.hint.memberPasswordInput': "輸入會員密碼後按儲存，之後可用該帳號+密碼登入。",
            'coach.hint.saveMemberCode': "儲存會員密碼（本機），建立或更新會員登入資料。",
            'coach.hint.deleteMemberCodeFromInput': "刪除指定會員帳號，刪除後將不能用該帳號登入。",
            'coach.hint.memberCodeBody': "這裡是目前可登入的會員帳號清單（本機儲存）。",
            'coach.hint.coachToggle': "【說明】開關解說員泡泡。【操作】開啟後點主要區塊會同時看到用途與操作步驟；細部按「新手導覽」或「▶30秒示範」。",
            'coach.hint.levelBasicBtn': "會員1（基礎）：保留最必要功能，適合快速上手。",
            'coach.hint.levelStandardBtn': "會員2（工程）：開啟量圖輔助、QA 報告與部分進階工具。",
            'coach.hint.levelProBtn': "會員3（專家）：顯示完整 BIM/規則/快照等高階模組。",
            'coach.hint.workCalcBtn': "【說明】計算模式＝第1～3頁（試算、量圖、報表）。【操作】按此切換→再按「第1頁」或「第2頁」開始。",
            'coach.hint.workStakeBtn': "【說明】放樣模式＝第4頁（模型、QA、輸出）。【操作】按此切換→上傳 IFC→依序：執行→QA→匯出。",
            'coach.hint.workElectricalBtn': "【說明】電機模式：電壓/腳本/繼電器設定。【操作】填硬體參數→選腳本模式→按匯出 mecha_config.txt（僅存本機）。",
            'coach.hint.aiCoachToggle': "AI 解說員：可在規則解說外補充更彈性的操作建議（需先完成後端代理設定）。",
            'coach.hint.coachAiInput': "可直接問 BIM/IFC 問題，例如「IFC 裡柱有幾根？未匹配有哪些？」再按問AI。",
            'coach.hint.coachAiAskBtn': "送出你輸入的問題給 AI 解說員，回覆會顯示在氣泡中。",
            'coach.hint.coachGuideBtn': "【說明】逐步新手導覽（含聊天、卡片、隱私）。【操作】按此開始→跟著高亮步驟走→完成後可隨時重跑。",
            'coach.hint.contrastToggle': "高對比模式：加強文字與按鈕對比，夜間或戶外較好辨識。",
            'coach.hint.contrastAutoToggle': "自動高對比：傍晚到清晨自動切換，白天恢復一般模式。",
            'coach.hint.calcPage1Btn': "【說明】第1頁：快速試算＋本機群組聊天（非雲端）。【操作】選工種填尺寸→按「加入清單」→試算變📊卡片；聊天在下方輸入框。",
            'coach.hint.calcPage2Btn': "【說明】第2頁：圖面量測與完整工程功能。【操作】左側上傳圖紙→智慧定比例→智慧量圖→右側加入清單/匯出。",
            'coach.hint.btnWarRoom': "戰情室：連線後可同步雲端資料列；離線時仍可本機試算。",
            'coach.hint.btnCtrlVoice': "語音助理總開關：開啟後可在藍圖頁用麥克風口述尺寸自動填欄。",
            'coach.hint.btnCtrlAiVision': "AI 盤點總開關：控制 AI 看圖辨識相關按鈕是否顯示。",
            'coach.hint.btnCtrlLaser': "藍牙雷射尺總開關：關閉後隱藏連線雷射尺相關功能。",
            'coach.hint.btnWarRoomRows': "控制是否在清單中顯示戰情室雲端資料列。",
            'coach.hint.startVoiceAgent': "工地語音助理：對著手機說尺寸（如長5寬3高2），系統會自動填入欄位。",
            'coach.hint.privacyLink': "公開隱私權政策（Google Sites 為準、站內 privacy.html 為摘要）：本機群組聊天與試算卡片僅存於裝置，不上傳雲端；與 App Store 版 Construction Master 一致。",
            'coach.hint.freeWarRoomCard': "【說明】第1頁群組大廳（本機泡泡，換機不同步）。【操作】輸入訊息送出；試算按「加入清單」後📊卡片會自動出現在此。",
            'coach.hint.memberChatQuickPreview': "群組聊天預覽：最近訊息與試算卡片會即時顯示；僅本機示範，不會上傳伺服器。",
            'coach.hint.memberChatQuickInput': "【說明】群組大廳快速輸入。【操作】打字→按送出；試算卡片也會推送到此頻道。",
            'coach.hint.memberChatPanel': "【說明】會員聊天面板（本機）。【操作】選對象→輸入訊息；可加好友，資料不上傳雲端。",
            'coach.hint.mobileFuncTab': "手機功能抽屜：集中 3D、量測、日照等戰術工具。",
            'coach.hint.mobileLeftTab': "對位抽屜：手動量測與對位微調工具。",
            'coach.hint.globalWeatherTicker': "工地氣象快報：顯示目前天氣與施工安全提示。",
            'coach.hint.fitBlueprintToViewport': "適配視圖：把圖紙縮放到最適合螢幕的大小。",
            'coach.hint.removeLoadedImage': "移除目前載入的圖紙，可重新上傳。",
            'coach.hint.connectLaserRuler': "連線藍牙雷射尺，量到的距離可直接帶入量測。",
            'coach.hint.toggle3DView': "3D 檢視：把圖面轉成立體視角觀看。",
            'coach.hint.toggle360Spin': "360 翻轉：自動旋轉 3D 視角。",
            'coach.hint.reset3DView': "重設 3D 視角到預設位置。",
            'coach.hint.startEdgeAIVision': "AI 視覺點料：用相機或圖面自動辨識構件數量。",
            'coach.hint.calcType': "【說明】選工種公式（混凝土、模板等）。【操作】下拉選工種→填 v1/v2/v3→看預覽列→按「加入清單」。",
            'coach.hint.customName': "自訂部位名稱：例如 C2柱、外牆A區。",
            'coach.hint.v1': "尺寸欄 v1：通常是長度或規格。",
            'coach.hint.v2': "尺寸欄 v2：通常是寬度或單排長度。",
            'coach.hint.v3': "尺寸欄 v3：通常是高度、深度或層數。",
            'coach.hint.qty': "數量欄：同一構件的重複數量。",
            'coach.hint.unitPrice': "單價欄：輸入後會即時計算每筆小計。",
            'coach.hint.previewBar': "【說明】即時試算預覽。【操作】填完尺寸後先看這裡確認數量/金額，無誤再按「加入清單」。",
            'coach.hint.shareCalcChatBtn': "將最近一次試算結果以📊卡片泡泡再送到群組大廳（本機示範，非雲端廣播）。",
            'coach.hint.btnAdd': "【說明】加入計算清單並推📊卡片到群組大廳。【操作】確認預覽無誤→按此→到清單表或聊天區查看。",
            'coach.hint.listBody': "明細清單：可檢查每筆數量、單價與金額。",
            'coach.hint.btnExport': "【說明】匯出 Excel/CSV 報表。【操作】清單有資料→按此→選格式下載，可交業主或會計。",
            'coach.hint.exportMeasureQaReport': "匯出量圖 QA 報告：包含平均傾斜角、最大傾斜與嚴格模式擋下次數。",
            'coach.hint.btnClear': "重置按鈕：清空所有資料並重新開始。",
            'coach.hint.footerBar': "底部總覽：顯示各工種加總與總預算。",
            'coach.hint.drawingPanel': "【說明】左側圖紙區：上傳、定比例、量測。【操作】①選檔上傳 ②智慧定比例 ③智慧量圖；可看「▶30秒示範」。",
            'coach.hint.calcPanel': "【說明】右側主控：計算1～3頁或放樣第4頁。【操作】用上方模式與分頁切換；各區塊標題旁有操作示範。",
            'coach.hint.clusterHelp': "【說明】「{title}」功能區。【操作】先看區內按鈕順序操作；需要逐步帶領請按「▶30秒示範」或「新手導覽」。",
            'coach.hint.essentialBrowse': "【說明】這是主流程相關控制項。【操作】若不清楚用途，請點區塊標題或開「新手導覽」；也可按「▶30秒示範」看操作。",
        },
        en: {
            'coach.hint.calcMeasureCluster': "What: smart measure on pages 1–3. How: upload drawing → Smart scale (2 points + real length) → Smart measure → values fill calc fields. Try ▶ 30s demo.",
            'coach.hint.startSmartCalibration': "What: set drawing scale. How: tap → pick 2 points → enter real distance → wait for scale ready.",
            'coach.hint.startSmartMeasure': "What: measure with scale set. How: tap → pick start/end on drawing → values fill v1/v2 fields.",
            'coach.hint.calcAiVisionCluster': "Page 3 AI vision: quick read, precise detect, column/beam tags, then send to auto estimate.",
            'coach.hint.calcIbmCluster': "Page 3 IBM auto calc: estimate and import list; staking is on page 4, not here.",
            'coach.hint.stakeExecutionCluster': "Page 4 layout setup: pick column/wall/beam and precision, then one-click layout or IBM cloud layout.",
            'coach.hint.stakeQaCluster': "Page 4 layout QA: control points, deviation heatmap, stability retest, grouping, layout QA.",
            'coach.hint.stakeExportCluster': "Page 4 export & field tools: after QA, export points, QA report, field package, fill suggestions, spot check.",
            'coach.hint.ifcInput': "Upload a model file for BIM QA parsing and element statistics.",
            'coach.hint.ifcSearch': "Search by element type or #ID, e.g. wall, column, beam, #123.",
            'coach.hint.bimRuleIfcType': "Enter element type, e.g. wall, column, beam.",
            'coach.hint.bimRuleMaterial': "Pick a material; estimates prefer this mapping rule.",
            'coach.hint.saveBimRule': "Save rule: BIM estimates prefer your custom mapping.",
            'coach.hint.deleteBimRule': "Delete custom rule for this type; revert to defaults.",
            'coach.hint.exportBimRules': "Export BIM rules JSON for backup or sharing.",
            'coach.hint.triggerImportBimRules': "Import rules JSON.",
            'coach.hint.resetBimRules': "Clear all BIM rules; restore defaults.",
            'coach.hint.generateBIMEstimate': "Build IBM/BIM estimate preview from types and prices.",
            'coach.hint.importBIMEstimateToList': "Import IBM/BIM estimate into the main list.",
            'coach.hint.runQuantumAutoStakeLayout': "Auto layout: points, precision, group QA, layout QA.",
            'coach.hint.generateBimLayoutPoints': "Extract layout points from the model.",
            'coach.hint.runBimLayoutQa': "Run layout QA for duplicates, gaps, score.",
            'coach.hint.exportBimLayoutPoints': "Export layout points CSV.",
            'coach.hint.exportBimLayoutQaReport': "Export layout QA report CSV.",
            'coach.hint.bimLayoutBody': "Layout point preview table (first 200 rows).",
            'coach.hint.bimLayoutQaSummary': "Shows layout QA score and key metrics.",
            'coach.hint.bimUnmatchedType': "Lists unmatched element types — pick one to fix.",
            'coach.hint.bimUnmatchedMaterial': "Pick material to apply; fix one type or batch all.",
            'coach.hint.applyUnmatchedRuleOnce': "Apply material to selected unmatched type.",
            'coach.hint.applyUnmatchedRuleAll': "Batch-apply material to all unmatched types.",
            'coach.hint.unitFrom': "先選來源與目標單位，再按換算。若單位不同類型會提示不相容。",
            'coach.hint.runUnitConvert': "Unit converter: verify numbers before estimating.",
            'coach.hint.createDataSnapshot': "Create manual snapshot of rules, estimate, list.",
            'coach.hint.rollbackLatestSnapshot': "Roll back to latest snapshot.",
            'coach.hint.rollbackLatestSnapshot': "Roll back to latest snapshot.",
            'coach.hint.rollbackLatestSnapshot': "Roll back to latest snapshot.",
            'coach.hint.rollbackLatestSnapshot': "Roll back to latest snapshot.",
            'coach.hint.exportSnapshots': "Export all snapshots as JSON.",
            'coach.hint.triggerImportSnapshots': "Import snapshot JSON.",
            'coach.hint.bimEstimateBody': "IBM/BIM estimate preview — confirm matches before import.",
            'coach.hint.regionSelect': "Pick regional prices; sparse region files fall back to nationwide catalog.",
            'coach.hint.autoDetectRegion': "Detect site and apply region to prices and weather.",
            'coach.hint.siteWeatherInfo': "這裡顯示工地即時天氣與施工建議，系統會自動更新。",
            'coach.hint.materialSearch': "Search materials, e.g. formwork, concrete, rebar.",
            'coach.hint.materialSelect': "Material list order: name, unit, price.",
            'coach.hint.materialCountChip': "Shows loaded price record count (should be many rows).",
            'coach.hint.applySelectedMaterialPrice': "Apply selected material price to the price field.",
            'coach.hint.fileInput': "Blueprint upload: pick an image, then set scale and measure.",
            'coach.hint.zoomIn': "Zoom in for precise points.",
            'coach.hint.zoomOut': "Zoom out to see the whole drawing.",
            'coach.hint.toggleMeasureAssist': "Measure assist: tilt hints during scale and measure.",
            'coach.hint.calibrateMeasureAssist': "Calibrate measure assist before measuring.",
            'coach.hint.toggleMeasureStrictMode': "Strict measure: blocks points when tilt is too high.",
            'coach.hint.measureAssistInfo': "Measure assist status and current tilt angle.",
            'coach.hint.toggleGyroMode': "Gyro assist: tilt controls 3D view.",
            'coach.hint.calibrateGyroBaseline': "Calibrate gyro: hold still ~1s after enable.",
            'coach.hint.gyroInfo': "Gyro status: off, on, or tracking.",
            'coach.hint.startCalibration': "Set scale: two points + real length.",
            'coach.hint.startMeasure': "Measure: start/end points fill distance fields.",
            'coach.hint.clearCanvas': "Clear canvas marks; list data is kept.",
            'coach.hint.scaleInfo': "Scale status — start measuring when set.",
            'coach.hint.project_name': "Project name for this job.",
            'coach.hint.floor_tag': "Floor/zone tag applied to each line item.",
            'coach.hint.memberAccountInput': "Member account (alphanumeric); set password per user.",
            'coach.hint.memberPasswordInput': "Save password locally, then log in with account + password.",
            'coach.hint.saveMemberCode': "Save member password locally.",
            'coach.hint.deleteMemberCodeFromInput': "Delete member account.",
            'coach.hint.memberCodeBody': "Local list of member accounts.",
            'coach.hint.coachToggle': "Toggle coach. Main workflow areas only—not every button. Use Quick tour or ▶ 30s demo for details.",
            'coach.hint.stakeFieldSimulator': "Stake field alignment: align site photo with layout points (visual check only).",
            'coach.hint.electricalFieldSim': "Voltage field alignment: align site photo with measurement points.",
            'coach.hint.levelBasicBtn': "Tier 1 (Basic): essentials for quick start.",
            'coach.hint.levelStandardBtn': "Tier 2 (Standard): measure assist, QA export, some advanced tools.",
            'coach.hint.levelProBtn': "Tier 3 (Pro): full BIM, rules, snapshots, and more.",
            'coach.hint.workCalcBtn': "Calc mode: pages 1–3 — trades, smart measure, AI vision, IBM, reports.",
            'coach.hint.workStakeBtn': "Stake mode: page 4 — model QA, layout points, alignment, QA, field package.",
            'coach.hint.workElectricalBtn': "Electrical mode: voltage/current/script settings; export mecha_config.txt locally for Python or field tests.",
            'coach.hint.aiCoachToggle': "AI coach adds flexible tips beyond rule text (needs backend proxy).",
            'coach.hint.coachAiInput': "Ask BIM/IFC questions, e.g. column count or unmatched types, then Ask AI.",
            'coach.hint.coachAiAskBtn': "Send your question; reply appears in the bubble.",
            'coach.hint.coachGuideBtn': "Re-run quick tour: page 1 chat, estimate cards, privacy notes.",
            'coach.hint.contrastToggle': "High contrast for night or outdoor readability.",
            'coach.hint.contrastAutoToggle': "Auto contrast evenings to morning; normal by day.",
            'coach.hint.calcPage1Btn': "Page 1: quick calc + local group chat (device only, not cloud). See privacy page.",
            'coach.hint.calcPage2Btn': "Page 2: blueprint measure and full engineering tools.",
            'coach.hint.btnWarRoom': "戰情室：連線後可同步雲端資料列；離線時仍可本機試算。",
            'coach.hint.btnCtrlVoice': "Voice assistant master switch: speak dimensions on blueprint page.",
            'coach.hint.btnCtrlAiVision': "AI vision master switch.",
            'coach.hint.btnCtrlLaser': "Bluetooth laser master switch.",
            'coach.hint.btnWarRoomRows': "Show or hide war-room cloud rows in the list.",
            'coach.hint.startVoiceAgent': "Voice agent: speak dimensions to fill fields.",
            'coach.hint.privacyLink': "Public privacy policy: local chat/cards stay on device; matches App Store app.",
            'coach.hint.freeWarRoomCard': "Page 1 hub: local lobby bubbles; estimates become 📊 cards after add-to-list.",
            'coach.hint.memberChatQuickPreview': "Chat preview: recent messages and cards locally only.",
            'coach.hint.memberChatQuickInput': "群組大廳：輸入文字快速送出（本機泡泡）；試算完成也會自動推送📊卡片到此頻道。",
            'coach.hint.memberChatPanel': "會員聊天：可加入好友、切換對象；文字與試算卡片皆存於本機。公開隱私說明見 Google Sites／privacy.html。",
            'coach.hint.mobileFuncTab': "手機功能抽屜：集中 3D、量測、日照等戰術工具。",
            'coach.hint.mobileLeftTab': "對位抽屜：手動量測與對位微調工具。",
            'coach.hint.globalWeatherTicker': "Site weather ticker and safety tips.",
            'coach.hint.fitBlueprintToViewport': "Fit blueprint to screen.",
            'coach.hint.removeLoadedImage': "Remove blueprint to upload again.",
            'coach.hint.connectLaserRuler': "Connect Bluetooth laser for measure.",
            'coach.hint.toggle3DView': "3D blueprint view.",
            'coach.hint.toggle360Spin': "360° spin in 3D.",
            'coach.hint.reset3DView': "Reset 3D view.",
            'coach.hint.startEdgeAIVision': "AI vision count from camera or blueprint.",
            'coach.hint.calcType': "Trade formula picker — each trade uses different math.",
            'coach.hint.customName': "Custom part name, e.g. C2 column, wall zone A.",
            'coach.hint.v1': "Dimension v1: usually length or spec.",
            'coach.hint.v2': "Dimension v2: usually width or run length.",
            'coach.hint.v3': "Dimension v3: usually height, depth, or layers.",
            'coach.hint.qty': "Quantity: repeat count for the same item.",
            'coach.hint.unitPrice': "Unit price: updates line subtotals live.",
            'coach.hint.previewBar': "Live preview of quantity and amount.",
            'coach.hint.shareCalcChatBtn': "Send latest estimate as 📊 card to local group lobby.",
            'coach.hint.btnAdd': "Add to list and sync 📊 card to local group lobby (not cloud).",
            'coach.hint.listBody': "Line list: check qty, unit price, amount per row.",
            'coach.hint.btnExport': "Export Excel/CSV report.",
            'coach.hint.exportMeasureQaReport': "Export measure QA report (tilt stats).",
            'coach.hint.btnClear': "Reset all data and start over.",
            'coach.hint.footerBar': "Footer totals by trade and budget.",
            'coach.hint.drawingPanel': "What: left blueprint area. How: upload → smart scale → smart measure. See ▶ 30s demo.",
            'coach.hint.calcPanel': "What: right main panel (calc 1–3 or stake 4). How: switch mode/page at top; demos beside cluster titles.",
            'coach.hint.clusterHelp': "What: “{title}” area. How: follow buttons in order, or tap ▶ 30s demo / Quick tour.",
            'coach.hint.essentialBrowse': "What: main-flow control. How: tap cluster title, Quick tour, or ▶ 30s demo if unsure.",
        },
        ja: {
            'coach.hint.calcMeasureCluster': "第1〜3ページのスマート計測：スマート尺度→スマート計測。寸法は右側の計算欄へ。",
            'coach.hint.calcAiVisionCluster': "第3ページAI視覚：快速読取・精密認識・柱梁寸法→自動見積へ。",
            'coach.hint.calcIbmCluster': "第3ページIBM自動計算：見積とリスト取込。墨出しは第4ページ。",
            'coach.hint.stakeExecutionCluster': "第4ページ墨出し設定：柱・壁・梁と高精度を選び一括／IBMクラウド墨出し。",
            'coach.hint.stakeQaCluster': "第4ページ墨出しQA：基準点合わせ、偏差、安定度、グループQA。",
            'coach.hint.stakeExportCluster': "第4ページ出力：QA後に点・QAレポート・施工パッケージ、補点・抽検。",
            'coach.hint.ifcInput': "モデルをアップロードしてBIM QA解析と部材統計。",
            'coach.hint.ifcSearch': "部材タイプまたは#IDで検索（壁・柱・梁・#123）。",
            'coach.hint.bimRuleIfcType': "部材タイプを入力（壁・柱・梁など）。",
            'coach.hint.bimRuleMaterial': "対応材料を選択。見積でこのルールを優先。",
            'coach.hint.saveBimRule': "儲存規則後，BIM 自動估價會優先採用你的自訂映射。",
            'coach.hint.deleteBimRule': "刪除指定構件類型的自訂規則，會回到系統預設匹配。",
            'coach.hint.exportBimRules': "匯出目前 BIM 規則檔（JSON），可跨裝置共用。",
            'coach.hint.triggerImportBimRules': "匯入規則檔（JSON），快速套用既有 BIM 匹配設定。",
            'coach.hint.resetBimRules': "清空全部 BIM 規則，恢復系統預設匹配。",
            'coach.hint.generateBIMEstimate': "依構件類型與材料單價自動產生 IBM/BIM 估價預覽表。",
            'coach.hint.importBIMEstimateToList': "把 IBM/BIM 估價結果一鍵匯入主清單，直接進入總價彙整。",
            'coach.hint.runQuantumAutoStakeLayout': "核心自進放樣：自動執行生成點位、高精度修正、分群 QA 與放樣 QA。",
            'coach.hint.generateBimLayoutPoints': "【說明】從模型抽柱心、牆端、梁端放樣點。【操作】確認已上傳 IFC 且勾選構件→按此→在表格預覽→再跑 QA。",
            'coach.hint.runBimLayoutQa': "執行放樣 QA，檢查重複點、缺漏與越界，產生分數。",
            'coach.hint.exportBimLayoutPoints': "匯出放樣點 CSV，可交給儀器或現場施工使用。",
            'coach.hint.exportBimLayoutQaReport': "匯出放樣 QA 報告 CSV，作為交付與稽核依據。",
            'coach.hint.bimLayoutBody': "墨出し点プレビュー表（最大200件）。",
            'coach.hint.bimLayoutQaSummary': "墨出しQAスコアと主要指標。",
            'coach.hint.bimUnmatchedType': "未マッチ部材タイプ一覧 — 修正対象を選択。",
            'coach.hint.bimUnmatchedMaterial': "適用材料を選択。単体または一括修正。",
            'coach.hint.applyUnmatchedRuleOnce': "把選定材料套用到目前這個未匹配構件類型，並立即重算。",
            'coach.hint.applyUnmatchedRuleAll': "把同一材料批次套用到所有未匹配構件類型，適合快速補齊規則。",
            'coach.hint.unitFrom': "先選來源與目標單位，再按換算。若單位不同類型會提示不相容。",
            'coach.hint.runUnitConvert': "單位換算器：先選來源/目標單位，快速核對數值是否一致。",
            'coach.hint.createDataSnapshot': "手動スナップショット（ルール・見積・リスト）。",
            'coach.hint.rollbackLatestSnapshot': "直近スナップショットへロールバック。",
            'coach.hint.rollbackLatestSnapshot': "直近スナップショットへロールバック。",
            'coach.hint.rollbackLatestSnapshot': "直近スナップショットへロールバック。",
            'coach.hint.rollbackLatestSnapshot': "直近スナップショットへロールバック。",
            'coach.hint.exportSnapshots': "匯出所有快照為 JSON，可做備份或跨裝置還原。",
            'coach.hint.triggerImportSnapshots': "匯入快照 JSON，把歷史版本帶回本機。",
            'coach.hint.bimEstimateBody': "IBM/BIM見積プレビュー — 取込前にマッチを確認。",
            'coach.hint.regionSelect': "地域単価を選択。件数が少ないと全国版に切替。",
            'coach.hint.autoDetectRegion': "按這裡才會要求抓取目前工地，並把所在地區套用到價目與天氣。",
            'coach.hint.siteWeatherInfo': "這裡顯示工地即時天氣與施工建議，系統會自動更新。",
            'coach.hint.materialSearch': "材料キーワード検索（型枠・コンクリート・鉄筋等）。",
            'coach.hint.materialSelect': "材料リスト：名称・単位・単価の順。",
            'coach.hint.materialCountChip': "読込単価件数（通常は多数）。",
            'coach.hint.applySelectedMaterialPrice': "把選好的材料單價帶入「單價欄」，省去手動輸入。",
            'coach.hint.fileInput': "図面アップロード → 尺度設定 → 計測。",
            'coach.hint.zoomIn': "放大圖面，方便點更精準的位置。",
            'coach.hint.zoomOut': "縮小圖面，方便看整體配置。",
            'coach.hint.toggleMeasureAssist': "量圖輔助：只在定比例與測量時提示手機傾斜，幫你提高量圖穩定度。",
            'coach.hint.calibrateMeasureAssist': "量圖校正：開始量圖前先校正，可降低手持角度偏差。",
            'coach.hint.toggleMeasureStrictMode': "量圖嚴格模式：傾斜角超過門檻會暫停取點，避免誤測。",
            'coach.hint.measureAssistInfo': "計測補助状態と現在の傾き角。",
            'coach.hint.toggleGyroMode': "陀螺儀輔助：手機傾斜可控制 3D 視角，提升操作穩定度。",
            'coach.hint.calibrateGyroBaseline': "校正陀螺儀：啟用後先保持手機不動 1 秒，能降低漂移誤差。",
            'coach.hint.gyroInfo': "ジャイロ状態：オフ／オン／追跡中。",
            'coach.hint.startCalibration': "定比例功能：先點兩點，再輸入真實長度，系統就知道比例。",
            'coach.hint.startMeasure': "量測功能：點起點和終點，距離會自動填入欄位。",
            'coach.hint.clearCanvas': "清空目前標註線段與點位，不會刪掉你的清單資料。",
            'coach.hint.scaleInfo': "尺度状態 — 設定後に計測開始。",
            'coach.hint.project_name': "プロジェクト名。",
            'coach.hint.floor_tag': "階／ゾーンタグ（各行に付与）。",
            'coach.hint.memberAccountInput': "会員アカウント（英数字）。",
            'coach.hint.memberPasswordInput': "パスワード保存後、アカウント+PWでログイン。",
            'coach.hint.saveMemberCode': "儲存會員密碼（本機），建立或更新會員登入資料。",
            'coach.hint.deleteMemberCodeFromInput': "刪除指定會員帳號，刪除後將不能用該帳號登入。",
            'coach.hint.memberCodeBody': "ログイン可能な会員一覧（ローカル）。",
            'coach.hint.coachToggle': "解説員のオン／オフ。主要フローのみ（全ボタンではない）。詳細は「初心者ガイド」または「▶ 30秒デモ」。",
            'coach.hint.stakeFieldSimulator': "現場墨出し照合：現場写真と墨出し点を照合（座標計算には影響しません）。",
            'coach.hint.electricalFieldSim': "電圧現場シミュレータ：現場写真と測定点を照合。",
            'coach.hint.levelBasicBtn': "会員1（ベーシック）：必要最小機能。",
            'coach.hint.levelStandardBtn': "会員2（標準）：計測補助・QA出力等。",
            'coach.hint.levelProBtn': "会員3（プロ）：BIM・ルール・スナップショット全機能。",
            'coach.hint.workCalcBtn': "計算モード：第1〜3ページ（工種・計測・AI・IBM）。",
            'coach.hint.workStakeBtn': "墨出しモード：第4ページ（モデル・墨出し・QA）。",
            'coach.hint.workElectricalBtn': "電気モード：電圧・電流・スクリプト設定、mecha_config.txt を端末へ出力。",
            'coach.hint.aiCoachToggle': "AI解説：ルール外の柔軟なアドバイス（バックエンド要）。",
            'coach.hint.coachAiInput': "BIM/IFC質問を入力し「AIに質問」。",
            'coach.hint.coachAiAskBtn': "質問送信 — 返答は吹き出しに表示。",
            'coach.hint.coachGuideBtn': "初心者ガイドを再実行。",
            'coach.hint.contrastToggle': "高コントラスト（夜間・屋外向け）。",
            'coach.hint.contrastAutoToggle': "自動コントラスト（夕方〜朝）。",
            'coach.hint.calcPage1Btn': "第1ページ：簡易試算＋ローカルチャット（端末のみ）。",
            'coach.hint.calcPage2Btn': "第2ページ：図面計測と全機能。",
            'coach.hint.btnWarRoom': "戰情室：連線後可同步雲端資料列；離線時仍可本機試算。",
            'coach.hint.btnCtrlVoice': "音声アシスタント総スイッチ。",
            'coach.hint.btnCtrlAiVision': "AI視覚総スイッチ。",
            'coach.hint.btnCtrlLaser': "Bluetoothレーザー総スイッチ。",
            'coach.hint.btnWarRoomRows': "リストの作戦室行表示切替。",
            'coach.hint.startVoiceAgent': "工地語音助理：對著手機說尺寸（如長5寬3高2），系統會自動填入欄位。",
            'coach.hint.privacyLink': "公開プライバシー：ローカルチャット／カードは端末のみ。",
            'coach.hint.freeWarRoomCard': "第1ページ：ロビー吹き出し、試算は📊カード化（ローカル）。",
            'coach.hint.memberChatQuickPreview': "チャットプレビュー（ローカルのみ）。",
            'coach.hint.memberChatQuickInput': "群組大廳：輸入文字快速送出（本機泡泡）；試算完成也會自動推送📊卡片到此頻道。",
            'coach.hint.memberChatPanel': "會員聊天：可加入好友、切換對象；文字與試算卡片皆存於本機。公開隱私說明見 Google Sites／privacy.html。",
            'coach.hint.mobileFuncTab': "手機功能抽屜：集中 3D、量測、日照等戰術工具。",
            'coach.hint.mobileLeftTab': "對位抽屜：手動量測與對位微調工具。",
            'coach.hint.globalWeatherTicker': "現場気象ティッカー。",
            'coach.hint.fitBlueprintToViewport': "適配視圖：把圖紙縮放到最適合螢幕的大小。",
            'coach.hint.removeLoadedImage': "移除目前載入的圖紙，可重新上傳。",
            'coach.hint.connectLaserRuler': "連線藍牙雷射尺，量到的距離可直接帶入量測。",
            'coach.hint.toggle3DView': "3D 檢視：把圖面轉成立體視角觀看。",
            'coach.hint.toggle360Spin': "360 翻轉：自動旋轉 3D 視角。",
            'coach.hint.reset3DView': "重設 3D 視角到預設位置。",
            'coach.hint.startEdgeAIVision': "AI 視覺點料：用相機或圖面自動辨識構件數量。",
            'coach.hint.calcType': "工種公式選択。",
            'coach.hint.customName': "部位名（例：C2柱）。",
            'coach.hint.v1': "寸法v1：長さ等。",
            'coach.hint.v2': "寸法v2：幅等。",
            'coach.hint.v3': "寸法v3：高さ・深さ等。",
            'coach.hint.qty': "数量。",
            'coach.hint.unitPrice': "単価（小計自動更新）。",
            'coach.hint.previewBar': "リアルタイムプレビュー。",
            'coach.hint.shareCalcChatBtn': "最新試算を📊カードでロビーへ（ローカル）。",
            'coach.hint.btnAdd': "リスト追加＋📊カードをローカルロビーへ。",
            'coach.hint.listBody': "明細リスト。",
            'coach.hint.btnExport': "Excel/CSV出力。",
            'coach.hint.exportMeasureQaReport': "匯出量圖 QA 報告：包含平均傾斜角、最大傾斜與嚴格模式擋下次數。",
            'coach.hint.btnClear': "全データリセット。",
            'coach.hint.footerBar': "フッター合計・予算。",
            'coach.hint.drawingPanel': "左：図面・尺度・計測。",
            'coach.hint.calcPanel': "右：計算1〜3／墨出し4ページ。",
            'coach.hint.clusterHelp': "【説明】「{title}」エリア。【操作】ボタン順に操作、または「▶ 30秒デモ」「初心者ガイド」。",
            'coach.hint.essentialBrowse': "【説明】主フロー関連。【操作】不明ならクラスタ見出し、「初心者ガイド」または「▶ 30秒デモ」。",
        }
    };
    function bootCoachHints() {
        if (global.BM_I18N && global.BM_I18N.registerLocaleKeys) {
            global.BM_I18N.registerLocaleKeys(HINTS);
        }
        global.BM_COACH_HINT_RULES = RULES;
        global.BM_COACH_ESSENTIAL_HINT_KEYS = ESSENTIAL_HINT_KEYS;
    }
    bootCoachHints();
})(typeof window !== 'undefined' ? window : globalThis);
