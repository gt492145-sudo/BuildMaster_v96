    function bmT(key, vars) {
        return (typeof window.BM_T === 'function') ? window.BM_T(key, vars) : key;
    }

    function initTouchCoach() {
        applyCoachMode();
        applyAiCoachMode();
        if (localStorage.getItem(COACH_DISABLED_KEY) === '1') return;
        if (!coachBound) {
            document.addEventListener('click', handleCoachInteraction, true);
            document.addEventListener('touchstart', handleCoachInteraction, { passive: true, capture: true });
            const aiInput = document.getElementById('coachAiInput');
            if (aiInput) {
                aiInput.addEventListener('keydown', ev => {
                    if (ev.key === 'Enter') askAiCoachManual();
                });
            }
            coachBound = true;
        }
        setTimeout(() => {
            speakCoach(bmT('coach.welcomeBoot'));
        }, 550);
    }

    function maybeStartCoachGuide() {
        const disabled = localStorage.getItem(COACH_DISABLED_KEY) === '1';
        const done = localStorage.getItem(COACH_GUIDE_DONE_KEY) === '1';
        if (disabled || done) return;
        setTimeout(() => startCoachGuide(false), 1000);
    }

    function getAiCoachConfig() {
        return {
            model: localStorage.getItem(AI_COACH_MODEL_KEY) || 'gpt-4.1-mini'
        };
    }

    function isAiCoachAllowedForCurrentLevel() {
        return hasFeatureEntitlement('aiCoach');
    }

    function applyAiCoachMode() {
        const allowedForLevel = isAiCoachAllowedForCurrentLevel();
        const backendConfigured = !!(backendSessionState.integrations && backendSessionState.integrations.aiCoachConfigured);
        aiCoachState.enabled = AI_API_ENABLED && backendConfigured && allowedForLevel && localStorage.getItem(AI_COACH_ENABLED_KEY) === '1';
        const btn = document.getElementById('aiCoachToggle');
        const askBtn = document.getElementById('coachAiAskBtn');
        const askInput = document.getElementById('coachAiInput');
        if (btn) btn.innerText = !allowedForLevel
            ? bmT('aiCoach.memberOnly')
            : (!backendSessionState.integrations || !backendSessionState.integrations.aiCoachConfigured)
            ? bmT('aiCoach.backendUnset')
            : (AI_API_ENABLED
            ? (aiCoachState.enabled ? bmT('aiCoach.on') : bmT('aiCoach.off'))
            : bmT('aiCoach.disabled'));
        if (askBtn) askBtn.disabled = !aiCoachState.enabled || aiCoachState.busy;
        if (askInput) askInput.disabled = !aiCoachState.enabled;
    }

    async function toggleAiCoachMode() {
        if (!(await ensureFeatureAccess('aiCoach', bmT('aiCoach.accessDenied')))) {
            aiCoachState.enabled = false;
            applyAiCoachMode();
            return;
        }
        if (!AI_API_ENABLED) {
            localStorage.setItem(AI_COACH_ENABLED_KEY, '0');
            aiCoachState.enabled = false;
            applyAiCoachMode();
            return showToast(bmT('toast.aiApiDisabled'));
        }
        if (!backendSessionState.integrations || !backendSessionState.integrations.aiCoachConfigured) {
            localStorage.setItem(AI_COACH_ENABLED_KEY, '0');
            aiCoachState.enabled = false;
            applyAiCoachMode();
            return showToast(bmT('toast.aiBackendKeyMissing'));
        }
        const next = !aiCoachState.enabled;
        if (next) {
            localStorage.setItem(AI_COACH_ENABLED_KEY, '1');
            if (!localStorage.getItem(AI_COACH_MODEL_KEY)) localStorage.setItem(AI_COACH_MODEL_KEY, 'gpt-4.1-mini');
            // 開啟 AI 時同步開啟解說員，避免「AI 開了但點擊無回應」的誤解。
            if (localStorage.getItem(COACH_DISABLED_KEY) === '1') {
                localStorage.setItem(COACH_DISABLED_KEY, '0');
                applyCoachMode();
                initTouchCoach();
            }
            applyAiCoachMode();
            speakCoach(bmT('coach.aiOpenedPrompt'));
            return showToast(bmT('toast.aiCoachOn'));
        }
        localStorage.setItem(AI_COACH_ENABLED_KEY, '0');
        applyAiCoachMode();
        showToast(bmT('toast.aiCoachOff'));
    }

    async function askAiCoach(promptText) {
        if (!AI_API_ENABLED) throw new Error('AI API disabled');
        const config = getAiCoachConfig();
        const buildBimIfcAiContext = (questionText) => {
            const q = String(questionText || '').trim();
            const qaLevel = bimModelData ? getQaLevelByScore(calcBIMQaScore(bimModelData)) : '-';
            const qaScore = bimModelData ? calcBIMQaScore(bimModelData) : 0;
            const topTypes = bimModelData
                ? Object.entries(bimModelData.typeCounts || {})
                    .sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0))
                    .slice(0, 10)
                    .map(([type, count]) => `${formatIfcTypeDisplay(type)}:${count}`)
                : [];
            const sampleElements = bimModelData
                ? (Array.isArray(bimModelData.elements) ? bimModelData.elements.slice(0, 8) : [])
                    .map(e => `${e.id}/${formatIfcTypeDisplay(e.type)}${e.name ? `(${e.name})` : ''}`)
                : [];
            const warnings = bimModelData
                ? (Array.isArray(bimModelData.warnings) ? bimModelData.warnings.slice(0, 6) : [])
                : [];
            const estimateRows = Array.isArray(bimEstimateRows) ? bimEstimateRows : [];
            const unmatched = estimateRows.filter(r => !r || !r.price || r.materialName === '未匹配').length;
            const estimatedTotal = estimateRows.reduce((sum, row) => sum + (Number(row && row.amount) || 0), 0);
            const ruleCount = Object.keys(bimRuleMap || {}).length;
            const floorTag = String((document.getElementById('floor_tag') && document.getElementById('floor_tag').value) || '').trim() || '未設定';
            const hasModel = !!bimModelData;

            return [
                '【BIM/IFC 專業上下文】',
                '你是 BIM/IFC 工程助理，優先依據以下模型資料回答；若資料不足，請明確指出缺什麼資料。',
                `目前問題：${q || '（未提供）'}`,
                `模型已載入：${hasModel ? '是' : '否'}`,
                `模型檔名：${hasModel ? (bimModelData.fileName || '未命名') : '未載入'}`,
                `IFC 實體總數：${hasModel ? (Number(bimModelData.totalEntities) || 0) : 0}`,
                `主要構件數：${hasModel ? (Number(bimModelData.totalElements) || 0) : 0}`,
                `BIM QA：${qaLevel} / ${qaScore}`,
                `工程量摘要：長度 ${hasModel ? Number(bimModelData.qtyLength || 0).toFixed(2) : '0.00'}、面積 ${hasModel ? Number(bimModelData.qtyArea || 0).toFixed(2) : '0.00'}、體積 ${hasModel ? Number(bimModelData.qtyVolume || 0).toFixed(2) : '0.00'}、數量 ${hasModel ? Number(bimModelData.qtyCount || 0).toFixed(2) : '0.00'}`,
                `Top IFC 類型：${topTypes.length ? topTypes.join(' | ') : '無'}`,
                `元素樣本：${sampleElements.length ? sampleElements.join(' | ') : '無'}`,
                `模型警告：${warnings.length ? warnings.join(' | ') : '無'}`,
                `估價筆數：${estimateRows.length}（未匹配 ${unmatched}）`,
                `BIM 估價總額(試算)：${Math.round(estimatedTotal).toLocaleString()} 元`,
                `自訂規則筆數：${ruleCount}`,
                `目前樓層/分區：${floorTag}`,
                `看圖記憶庫：${getAutoInterpretMemoryStore().length} 筆`,
                `最近看圖結果：${autoInterpretLastReport ? `${autoInterpretLastReport.type} / ${autoInterpretLastReport.quantity}件 / 信心 ${Math.round((Number(autoInterpretLastReport.overallConfidence) || 0) * 100)}%` : '尚無'}`,
                `最近記憶匹配：${autoInterpretLastReport && Number(autoInterpretLastReport.memorySimilarity || 0) > 0 ? `${Math.round(Number(autoInterpretLastReport.memorySimilarity || 0) * 100)}%` : '尚無'}`,
                `最近欄位 QA：${autoInterpretLastReport && autoInterpretLastReport.fieldConfidenceSummary ? autoInterpretLastReport.fieldConfidenceSummary : '尚無'}`,
                '回答規則：',
                '1) 先給結論（1~2句）；2) 再列依據（模型數字）；3) 最後給下一步（可執行按鈕/操作）。',
                '4) 若問題要求「數量/估價/風險」，務必列出對應 IFC 類型與影響。'
            ].join('\n');
        };
        if (!(await ensureFeatureAccess('aiCoach', bmT('aiCoach.accessDenied')))) {
            throw new Error('AI coach denied');
        }
        aiCoachState.busy = true;
        applyAiCoachMode();
        try {
            const data = await apiRequest('/ai/coach', {
                method: 'POST',
                body: {
                    model: config.model,
                    prompt: promptText,
                    context: buildBimIfcAiContext(promptText)
                },
                retries: 0,
                timeoutMs: 20000
            });
            const text = data && data.answer ? String(data.answer || '').trim() : '';
            if (!text) throw new Error('AI 回應為空');
            return text;
        } finally {
            aiCoachState.busy = false;
            applyAiCoachMode();
        }
    }

    function getTargetBrief(target) {
        const id = target.id ? `#${target.id}` : '';
        const tag = String(target.tagName || '').toLowerCase();
        const text = String((target.innerText || target.value || target.placeholder || '')).trim().slice(0, 40);
        return `${tag}${id}${text ? ` (${text})` : ''}`;
    }

    async function askAiCoachFromTarget(target) {
        if (!aiCoachState.enabled || aiCoachState.busy) return;
        const brief = getTargetBrief(target);
        const promptText = `使用者剛點擊介面元素：${brief}。請用 2~4 句說明用途、何時用、下一步。`;
        speakCoach(bmT('coach.aiThinking'));
        try {
            const answer = await askAiCoach(promptText);
            speakCoach(answer);
        } catch (e) {
            console.warn('AI 解說失敗', e);
            showToast(bmT('toast.aiCoachUnavailable'));
        }
    }

    async function askAiCoachManual() {
        if (!aiCoachState.enabled) return showToast(bmT('toast.aiCoachNeedEnable'));
        if (aiCoachState.busy) return showToast(bmT('toast.aiCoachBusy'));
        const input = document.getElementById('coachAiInput');
        const q = String((input && input.value) || '').trim();
        if (!q) return showToast(bmT('toast.aiCoachNeedQuestion'));
        speakCoach(bmT('coach.aiReplying'));
        try {
            const answer = await askAiCoach(`使用者問題：${q}`);
            speakCoach(answer);
            if (input) input.value = '';
        } catch (e) {
            console.warn('AI 手動提問失敗', e);
            showToast(bmT('toast.aiCoachReplyFailed'));
        }
    }

    function handleCoachInteraction(e) {
        if (localStorage.getItem(COACH_DISABLED_KEY) === '1') return;
        if (coachGuideState.active) return;
        const now = Date.now();
        if (e.type === 'touchstart') coachLastTouchAt = now;
        if (e.type === 'click' && now - coachLastTouchAt < COACH_TOUCH_TO_CLICK_GUARD_MS) return;
        if (now - coachLastInteractionAt < COACH_CLICK_THROTTLE_MS) return;
        const target = e.target;
        if (!target || !target.closest) return;
        if (target.closest('#touchCoach')) return;
        const targetSig = getTargetBrief(target);
        if (targetSig && targetSig === coachLastTargetSig && now - coachLastInteractionAt < COACH_DUPLICATE_TARGET_MS) return;
        coachLastInteractionAt = now;
        coachLastTargetSig = targetSig;

        const message = resolveCoachMessage(target);
        if (message) return speakCoach(message);
        if (aiCoachState.enabled && !aiCoachState.busy) {
            askAiCoachFromTarget(target);
            return;
        }
        const fallback = getGenericCoachFallback(target);
        if (fallback) speakCoach(fallback);
    }

    function getGenericCoachFallback(target) {
        if (target.closest('#touchCoach, #coachGuidePanel')) return '';
        const cluster = target.closest('.action-cluster');
        if (cluster) {
            const titleEl = cluster.querySelector('.action-cluster-title, .group-title');
            const title = titleEl ? String(titleEl.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 28) : '';
            if (title) return bmT('coach.hint.clusterHelp', { title });
        }
        const essentialRoot = target.closest('.drawing-panel, .calc-panel, #freeWarRoomCard, #electricalModePage, #stakeFieldSimulator');
        if (essentialRoot && target.closest('button, input, select, textarea, a[href], [role="button"], label')) {
            return bmT('coach.hint.essentialBrowse');
        }
        return '';
    }

    function coachHintSpecificityScore(target, matched) {
        if (!matched || !target) return -1;
        let depth = 0;
        let node = target;
        while (node && node !== matched) {
            depth += 1;
            node = node.parentElement;
        }
        const subtree = matched.querySelectorAll ? matched.querySelectorAll('*').length : 0;
        return -subtree + depth * 10;
    }

    function resolveCoachMessage(target) {
        const rules = (typeof BM_COACH_HINT_RULES !== 'undefined' && BM_COACH_HINT_RULES) || [];
        const essential = (typeof BM_COACH_ESSENTIAL_HINT_KEYS !== 'undefined' && BM_COACH_ESSENTIAL_HINT_KEYS) || null;
        let bestMessage = '';
        let bestScore = -1;
        for (let i = 0; i < rules.length; i += 1) {
            const entry = rules[i];
            const sel = entry && entry.sel ? entry.sel : (Array.isArray(entry) ? entry[0] : '');
            const key = entry && entry.key ? entry.key : (Array.isArray(entry) ? entry[1] : '');
            if (!sel || !key) continue;
            if (essential && !essential.has(key)) continue;
            try {
                const matched = target.closest(sel);
                if (!matched) continue;
                const score = coachHintSpecificityScore(target, matched);
                if (score > bestScore) {
                    bestScore = score;
                    bestMessage = bmT('coach.hint.' + key);
                }
            } catch (_e) {}
        }
        return bestMessage;
    }

    function speakCoach(message, keepOpen) {
        const coach = document.getElementById('touchCoach');
        const coachText = document.getElementById('coachText');
        if (!coach || !coachText) return;
        if (coachText.innerText !== message) coachText.innerText = message;
        coach.classList.remove('hide');

        if (coachTimer) clearTimeout(coachTimer);
        const shouldKeepOpen = !!keepOpen || coachGuideState.active;
        if (!shouldKeepOpen) {
            coachTimer = setTimeout(() => {
                coach.classList.add('hide');
            }, 4600);
        }
    }

    function hideCoach(remember) {
        const coach = document.getElementById('touchCoach');
        if (coach) coach.classList.add('hide');
        coachGuideState.active = false;
        setCoachGuidePanelVisible(false);
        if (remember) {
            localStorage.setItem(COACH_DISABLED_KEY, '1');
            applyCoachMode();
        }
    }

    function applyCoachMode() {
        const disabled = localStorage.getItem(COACH_DISABLED_KEY) === '1';
        const btn = document.getElementById('coachToggle');
        const guideBtn = document.getElementById('coachGuideBtn');
        if (btn) btn.innerText = disabled ? bmT('coach.off') : bmT('coach.on');
        if (guideBtn) guideBtn.disabled = disabled;
        if (disabled) {
            const coach = document.getElementById('touchCoach');
            if (coach) coach.classList.add('hide');
            coachGuideState.active = false;
            setCoachGuidePanelVisible(false);
        }
    }

    function toggleCoachMode() {
        const disabled = localStorage.getItem(COACH_DISABLED_KEY) === '1';
        localStorage.setItem(COACH_DISABLED_KEY, disabled ? '0' : '1');
        applyCoachMode();
        if (disabled) {
            initTouchCoach();
            speakCoach(bmT('coach.openedRules'));
            showToast(bmT('toast.coachOn'));
        } else {
            showToast(bmT('toast.coachOff'));
        }
    }

    function setCoachGuidePanelVisible(visible) {
        const panel = document.getElementById('coachGuidePanel');
        if (!panel) return;
        panel.classList.toggle('hide', !visible);
    }

    function getCoachGuideTarget(stepIndex) {
        const step = COACH_GUIDE_STEPS[stepIndex];
        if (!step) return null;
        return document.querySelector(step.selector);
    }

    function renderCoachGuideStep() {
        const step = COACH_GUIDE_STEPS[coachGuideState.stepIndex];
        if (!step) return;
        const stepText = document.getElementById('coachGuideStep');
        const prevBtn = document.getElementById('coachGuidePrev');
        const nextBtn = document.getElementById('coachGuideNext');
        const doneBtn = document.getElementById('coachGuideDone');
        if (stepText) stepText.innerText = bmT('coach.guideStep', { n: coachGuideState.stepIndex + 1, total: COACH_GUIDE_STEPS.length });
        if (prevBtn) prevBtn.disabled = coachGuideState.stepIndex <= 0;
        if (nextBtn) nextBtn.disabled = coachGuideState.stepIndex >= COACH_GUIDE_STEPS.length - 1;
        if (doneBtn) doneBtn.disabled = coachGuideState.stepIndex < COACH_GUIDE_STEPS.length - 1;

        speakCoach(step.messageKey ? bmT(step.messageKey) : (step.message || ''), true);
        const target = getCoachGuideTarget(coachGuideState.stepIndex);
        if (target && target.scrollIntoView) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function startCoachGuide(force) {
        if (localStorage.getItem(COACH_DISABLED_KEY) === '1') {
            if (force) showToast(bmT('toast.guideNeedCoach'));
            return;
        }
        coachGuideState.active = true;
        coachGuideState.stepIndex = 0;
        setCoachGuidePanelVisible(true);
        renderCoachGuideStep();
        if (force) showToast(bmT('toast.guideStart'));
    }

    function prevCoachGuideStep() {
        if (!coachGuideState.active) return;
        coachGuideState.stepIndex = Math.max(0, coachGuideState.stepIndex - 1);
        renderCoachGuideStep();
    }

    function nextCoachGuideStep() {
        if (!coachGuideState.active) return;
        coachGuideState.stepIndex = Math.min(COACH_GUIDE_STEPS.length - 1, coachGuideState.stepIndex + 1);
        renderCoachGuideStep();
    }

    function finishCoachGuide() {
        coachGuideState.active = false;
        setCoachGuidePanelVisible(false);
        localStorage.setItem(COACH_GUIDE_DONE_KEY, '1');
        speakCoach(bmT('coach.guideFinished'));
        showToast(bmT('toast.guideDone'));
        if (typeof recordRatingEngagement === 'function') recordRatingEngagement('coach_guide');
    }

    function applyContrastMode() {
        const autoEnabled = localStorage.getItem(CONTRAST_AUTO_KEY) === '1';
        if (autoEnabled) {
            const hour = new Date().getHours();
            const shouldEnable = (hour >= 18 || hour < 6);
            document.body.classList.toggle('high-contrast', shouldEnable);
            const btnAuto = document.getElementById('contrastAutoToggle');
            if (btnAuto) btnAuto.innerText = bmT('contrast.autoOn');
            const btnManual = document.getElementById('contrastToggle');
            if (btnManual) btnManual.innerText = shouldEnable ? bmT('contrast.night') : bmT('contrast.day');
            return;
        }

        const enabled = localStorage.getItem(CONTRAST_MODE_KEY) === '1';
        document.body.classList.toggle('high-contrast', enabled);
        const btn = document.getElementById('contrastToggle');
        if (btn) btn.innerText = enabled ? bmT('contrast.on') : bmT('contrast.off');
        const btnAuto = document.getElementById('contrastAutoToggle');
        if (btnAuto) btnAuto.innerText = bmT('contrast.autoOff');
    }

    function toggleContrastMode() {
        localStorage.setItem(CONTRAST_AUTO_KEY, '0');
        const isEnabled = localStorage.getItem(CONTRAST_MODE_KEY) === '1';
        localStorage.setItem(CONTRAST_MODE_KEY, isEnabled ? '0' : '1');
        applyContrastMode();
        showToast(isEnabled ? bmT('toast.contrastOff') : bmT('toast.contrastOn'));
    }

    function applyAutoContrastMode() {
        const autoEnabled = localStorage.getItem(CONTRAST_AUTO_KEY) === '1';
        if (!autoEnabled && localStorage.getItem(CONTRAST_AUTO_KEY) === null) {
            localStorage.setItem(CONTRAST_AUTO_KEY, '1');
        }
    }

    function toggleAutoContrastMode() {
        const autoEnabled = localStorage.getItem(CONTRAST_AUTO_KEY) === '1';
        localStorage.setItem(CONTRAST_AUTO_KEY, autoEnabled ? '0' : '1');
        applyContrastMode();
        showToast(autoEnabled ? bmT('toast.autoContrastOff') : bmT('toast.autoContrastOn'));
    }

    function applySunlightMode() {
        const enabled = localStorage.getItem(SUNLIGHT_MODE_KEY) === '1';
        document.body.classList.toggle('sunlight-readable', enabled);
        const btn = document.querySelector('#sunlightToggle span');
        if (btn) btn.textContent = bmT('drawer.sunlight', { state: enabled ? bmT('common.on') : bmT('common.off') });
    }

    function toggleSunlightMode() {
        const enabled = localStorage.getItem(SUNLIGHT_MODE_KEY) === '1';
        localStorage.setItem(SUNLIGHT_MODE_KEY, enabled ? '0' : '1');
        applySunlightMode();
        showToast(enabled ? bmT('toast.sunlightOff') : bmT('toast.sunlightOn'));
    }

    function applyWarRoomStatus() {
        const btn = document.getElementById('btnWarRoom');
        if (!btn) return;
        isWarRoomActive = localStorage.getItem(WAR_ROOM_KEY) === '1';
        if (!demoModeEnabled) {
            isWarRoomActive = false;
            localStorage.setItem(WAR_ROOM_KEY, '0');
        }
        if (isWarRoomActive) {
            btn.innerText = bmT('warRoom.live');
            btn.style.color = '#fff';
            btn.style.background = '#00c853';
            btn.style.boxShadow = '0 0 15px #00e676';
            if (!warRoomTimer) startMockRemoteDataStream();
            return;
        }
        btn.innerText = bmT('warRoom.offline');
        btn.style.background = '';
        btn.style.color = '#00e676';
        btn.style.boxShadow = 'none';
        btn.style.borderColor = '#00e676';
    }

    function toggleWarRoom() {
        if (!featureFlags.warRoom) {
            return showToast(bmT('toast.warRoomDisabled'));
        }
        if (!demoModeEnabled) {
            return showToast(bmT('toast.demoWarRoomDisabled'));
        }
        isWarRoomActive = !isWarRoomActive;
        localStorage.setItem(WAR_ROOM_KEY, isWarRoomActive ? '1' : '0');
        const btn = document.getElementById('btnWarRoom');
        if (!btn) return;

        if (isWarRoomActive) {
            btn.innerText = bmT('warRoom.connecting');
            btn.style.background = 'rgba(0, 230, 118, 0.2)';
            btn.style.color = '#00e676';
            btn.style.boxShadow = 'none';
            showToast(bmT('toast.warRoomConnecting'));

            if (warRoomConnectTimer) clearTimeout(warRoomConnectTimer);
            warRoomConnectTimer = setTimeout(() => {
                if (!isWarRoomActive) return;
                btn.innerText = bmT('warRoom.live');
                btn.style.color = '#fff';
                btn.style.background = '#00c853';
                btn.style.boxShadow = '0 0 15px #00e676';
                showToast(bmT('toast.warRoomConnected'));
                startMockRemoteDataStream();
                applyFeatureControlStatus();
            }, 1500);
            return;
        }

        if (warRoomConnectTimer) {
            clearTimeout(warRoomConnectTimer);
            warRoomConnectTimer = null;
        }
        if (warRoomTimer) {
            clearInterval(warRoomTimer);
            warRoomTimer = null;
        }
        warRoomList = [];
        renderTable();
        btn.innerText = bmT('warRoom.offline');
        btn.style.background = '';
        btn.style.color = '#00e676';
        btn.style.boxShadow = 'none';
        btn.style.borderColor = '#00e676';
        applyFeatureControlStatus();
        showToast(bmT('toast.warRoomDisconnected'));
    }

    const MEMBER_CHAT_FRIENDS_KEY = 'bm_69:member_chat_friends';
    const MEMBER_CHAT_LOGS_KEY = 'bm_69:member_chat_logs';
    const MEMBER_CHAT_CHANNEL_KEY = 'bm_69:member_chat_channel';
    const PUBLIC_CHAT_POLL_MS = 5000;
    const DIRECT_CHAT_POLL_MS = 5000;
    const GROUP_CHAT_POLL_MS = 5000;
    let memberChatActiveFriend = '';
    let memberChatActiveGroupId = 0;
    let memberChatAnimateLast = false;
    let memberChatChannelMode = 'local';
    let publicChatMessages = [];
    let publicChatSinceId = 0;
    let publicChatPollTimer = null;
    let publicChatRefreshing = false;
    let serverFriendContacts = [];
    let directChatMessages = [];
    let directChatSinceId = 0;
    let directChatPollTimer = null;
    let directChatRefreshing = false;
    let directChatVoiceCache = new Map();
    let directChatVoiceRecorder = null;
    let directChatVoiceStream = null;
    let directChatVoiceChunks = [];
    let directChatVoiceRecording = false;
    let directChatVoiceRecordStartedAt = 0;
    let directChatVoiceRecordTimer = null;
    let directChatVoiceAudioEl = null;
    const DIRECT_CHAT_VOICE_MAX_MS = 60000;
    let serverGroups = [];
    let groupChatMessages = [];
    let groupChatSinceId = 0;
    let groupChatPollTimer = null;
    let groupChatRefreshing = false;

    function normalizeMemberChatChannelMode(mode) {
        if (mode === 'public') return 'public';
        if (mode === 'friends') return 'friends';
        if (mode === 'groups') return 'groups';
        return 'local';
    }

    function loadMemberChatChannelMode() {
        try {
            return normalizeMemberChatChannelMode(localStorage.getItem(MEMBER_CHAT_CHANNEL_KEY));
        } catch (_e) {
            return 'local';
        }
    }

    function isPublicChatChannelMode() {
        return memberChatChannelMode === 'public';
    }

    function isFriendsChatChannelMode() {
        return memberChatChannelMode === 'friends';
    }

    function isGroupChatChannelMode() {
        return memberChatChannelMode === 'groups';
    }

    function isLocalChatChannelMode() {
        return memberChatChannelMode === 'local';
    }

    function canUseMemberChatApi() {
        return typeof isMemberSession === 'function'
            && isMemberSession()
            && typeof shouldSkipRemoteApi === 'function'
            && !shouldSkipRemoteApi()
            && typeof apiRequest === 'function';
    }

    function canUsePublicChatApi() {
        return canUseMemberChatApi();
    }

    function formatPublicChatTime(iso) {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    function mapPublicChatMessageRow(msg) {
        return {
            type: 'text',
            sender: msg.account,
            text: msg.text,
            time: formatPublicChatTime(msg.createdAt),
            ts: new Date(msg.createdAt).getTime(),
            status: 'delivered',
            publicId: Number(msg.id) || 0
        };
    }

    function mergePublicChatMessages(incoming, reset) {
        if (reset) {
            publicChatMessages = incoming.slice();
        } else if (incoming.length) {
            const seen = new Set(publicChatMessages.map((row) => row.publicId));
            incoming.forEach((row) => {
                if (!seen.has(row.publicId)) {
                    publicChatMessages.push(row);
                    seen.add(row.publicId);
                }
            });
            publicChatMessages.sort((a, b) => (a.publicId || 0) - (b.publicId || 0));
            if (publicChatMessages.length > 200) {
                publicChatMessages = publicChatMessages.slice(-200);
            }
        }
        publicChatSinceId = publicChatMessages.reduce(
            (max, row) => Math.max(max, row.publicId || 0),
            publicChatSinceId
        );
    }

    function stopPublicChatPolling() {
        if (publicChatPollTimer) {
            clearInterval(publicChatPollTimer);
            publicChatPollTimer = null;
        }
    }

    function startPublicChatPolling() {
        stopPublicChatPolling();
        if (!isPublicChatChannelMode() || !canUsePublicChatApi()) return;
        publicChatPollTimer = setInterval(() => {
            if (!isPublicChatChannelMode()) {
                stopPublicChatPolling();
                return;
            }
            refreshPublicChatMessages().catch(() => {});
        }, PUBLIC_CHAT_POLL_MS);
    }

    async function refreshPublicChatMessages(options = {}) {
        if (!isPublicChatChannelMode()) return;
        if (publicChatRefreshing) return;
        if (!canUsePublicChatApi()) {
            publicChatMessages = [];
            renderMemberChatMessages();
            renderMemberChatQuickPreview();
            updateMemberChatIdentity();
            return;
        }
        publicChatRefreshing = true;
        try {
            const since = options.initial ? 0 : publicChatSinceId;
            const payload = await apiRequest(`/chat/public/messages?since=${since}&limit=100`);
            const incoming = (Array.isArray(payload.messages) ? payload.messages : [])
                .map(mapPublicChatMessageRow);
            mergePublicChatMessages(incoming, !!options.initial);
            renderMemberChatMessages();
            renderMemberChatQuickPreview();
            updateMemberChatIdentity();
        } catch (error) {
            if (options.showError) {
                showToast(error.message || bmT('toast.publicChatLoadFailed'));
            }
        } finally {
            publicChatRefreshing = false;
        }
    }

    async function sendPublicChatMessage(text) {
        if (!canUsePublicChatApi()) {
            showToast(bmT('toast.publicChatLoginRequired'));
            return false;
        }
        const trimmed = String(text || '').trim().slice(0, 280);
        if (!trimmed) {
            showToast(bmT('toast.needMessage'));
            return false;
        }
        try {
            const payload = await apiRequest('/chat/public/messages', {
                method: 'POST',
                body: { text: trimmed }
            });
            if (payload && payload.message) {
                mergePublicChatMessages([mapPublicChatMessageRow(payload.message)], false);
                memberChatAnimateLast = true;
                renderMemberChatMessages();
                renderMemberChatQuickPreview();
                memberChatAnimateLast = false;
            } else {
                await refreshPublicChatMessages({ initial: true, showError: true });
            }
            return true;
        } catch (error) {
            showToast(error.message || bmT('toast.publicChatSendFailed'));
            return false;
        }
    }

    function isDirectChatVoicePlaceholderText(text) {
        const normalized = String(text || '').trim();
        return normalized === '語音訊息'
            || normalized.endsWith('語音訊息')
            || /voice message/i.test(normalized);
    }

    function mapDirectChatMessageRow(msg) {
        let messageType = String(msg.messageType || 'text').trim().toLowerCase() === 'voice'
            ? 'voice'
            : 'text';
        if (messageType !== 'voice' && (msg.hasVoice || Number(msg.audioDurationMs) > 0)) {
            messageType = 'voice';
        }
        if (messageType !== 'voice' && isDirectChatVoicePlaceholderText(msg.text)) {
            messageType = 'voice';
        }
        const row = {
            type: messageType,
            sender: msg.senderAccount,
            text: String(msg.text || ''),
            time: formatPublicChatTime(msg.createdAt),
            ts: new Date(msg.createdAt).getTime(),
            status: 'delivered',
            directId: Number(msg.id) || 0,
            audioMime: String(msg.audioMime || ''),
            audioDurationMs: Math.max(0, Number(msg.audioDurationMs) || 0),
            hasVoice: messageType === 'voice' || !!msg.hasVoice
        };
        if (msg.audioBase64) {
            directChatVoiceCache.set(row.directId, {
                mime: row.audioMime || 'audio/webm',
                base64: String(msg.audioBase64),
                durationMs: row.audioDurationMs
            });
        }
        return row;
    }

    function mergeDirectChatMessages(incoming, reset) {
        if (reset) {
            directChatMessages = incoming.slice();
        } else if (incoming.length) {
            const seen = new Set(directChatMessages.map((row) => row.directId));
            incoming.forEach((row) => {
                if (!seen.has(row.directId)) {
                    directChatMessages.push(row);
                    seen.add(row.directId);
                }
            });
            directChatMessages.sort((a, b) => (a.directId || 0) - (b.directId || 0));
            if (directChatMessages.length > 200) {
                directChatMessages = directChatMessages.slice(-200);
            }
        }
        directChatSinceId = directChatMessages.reduce(
            (max, row) => Math.max(max, row.directId || 0),
            directChatSinceId
        );
    }

    function getMutualFriendContacts() {
        return serverFriendContacts.filter((entry) => entry && entry.canChat);
    }

    function getFriendContact(account) {
        const peer = normalizeMemberAccount(account);
        return serverFriendContacts.find((entry) => normalizeMemberAccount(entry.account) === peer) || null;
    }

    function stopDirectChatPolling() {
        if (directChatPollTimer) {
            clearInterval(directChatPollTimer);
            directChatPollTimer = null;
        }
    }

    function startDirectChatPolling() {
        stopDirectChatPolling();
        if (!isFriendsChatChannelMode() || !canUseMemberChatApi() || !memberChatActiveFriend) return;
        if (!getFriendContact(memberChatActiveFriend)?.canChat) return;
        directChatPollTimer = setInterval(() => {
            if (!isFriendsChatChannelMode()) {
                stopDirectChatPolling();
                return;
            }
            refreshDirectChatMessages().catch(() => {});
        }, DIRECT_CHAT_POLL_MS);
    }

    async function refreshServerFriendContacts(options = {}) {
        if (!isFriendsChatChannelMode()) return;
        if (!canUseMemberChatApi()) {
            serverFriendContacts = [];
            renderMemberChatFriends();
            return;
        }
        try {
            const payload = await apiRequest('/chat/friends');
            serverFriendContacts = Array.isArray(payload.friends) ? payload.friends : [];
            renderMemberChatFriends();
            if (options.showError === false) return;
        } catch (error) {
            if (options.showError) {
                showToast(error.message || bmT('toast.friendListLoadFailed'));
            }
        }
    }

    async function refreshDirectChatMessages(options = {}) {
        if (!isFriendsChatChannelMode() || !memberChatActiveFriend) return;
        if (directChatRefreshing) return;
        const peer = normalizeMemberAccount(memberChatActiveFriend);
        const contact = getFriendContact(peer);
        if (!contact || !contact.canChat) {
            directChatMessages = [];
            renderMemberChatMessages();
            renderMemberChatQuickPreview();
            return;
        }
        if (!canUseMemberChatApi()) {
            directChatMessages = [];
            renderMemberChatMessages();
            renderMemberChatQuickPreview();
            updateMemberChatIdentity();
            return;
        }
        directChatRefreshing = true;
        try {
            const since = options.initial ? 0 : directChatSinceId;
            const payload = await apiRequest(
                `/chat/direct/messages?peer=${encodeURIComponent(peer)}&since=${since}&limit=100`
            );
            const incoming = (Array.isArray(payload.messages) ? payload.messages : [])
                .map(mapDirectChatMessageRow);
            mergeDirectChatMessages(incoming, !!options.initial);
            renderMemberChatMessages();
            renderMemberChatQuickPreview();
            updateMemberChatIdentity();
        } catch (error) {
            if (options.showError) {
                showToast(error.message || bmT('toast.directChatLoadFailed'));
            }
        } finally {
            directChatRefreshing = false;
        }
    }

    async function sendDirectChatMessage(text) {
        const peer = normalizeMemberAccount(memberChatActiveFriend);
        const contact = getFriendContact(peer);
        if (!peer || !contact || !contact.canChat) {
            showToast(bmT('toast.directChatNeedMutual'));
            return false;
        }
        if (!canUseMemberChatApi()) {
            showToast(bmT('toast.directChatLoginRequired'));
            return false;
        }
        const trimmed = String(text || '').trim().slice(0, 280);
        if (!trimmed) {
            showToast(bmT('toast.needMessage'));
            return false;
        }
        try {
            const payload = await apiRequest('/chat/direct/messages', {
                method: 'POST',
                body: { peer, text: trimmed }
            });
            if (payload && payload.message) {
                mergeDirectChatMessages([mapDirectChatMessageRow(payload.message)], false);
                memberChatAnimateLast = true;
                renderMemberChatMessages();
                renderMemberChatQuickPreview();
                memberChatAnimateLast = false;
            } else {
                await refreshDirectChatMessages({ initial: true, showError: true });
            }
            return true;
        } catch (error) {
            showToast(error.message || bmT('toast.directChatSendFailed'));
            return false;
        }
    }

    function formatMemberChatVoiceDuration(ms) {
        const totalSec = Math.max(1, Math.round((Number(ms) || 0) / 1000));
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        return `${min}:${String(sec).padStart(2, '0')}`;
    }

    function getDirectChatVoiceMimeType() {
        if (typeof MediaRecorder === 'undefined') return '';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
        if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
        return '';
    }

    function canUseDirectChatVoice() {
        return isFriendsChatChannelMode()
            && canUseMemberChatApi()
            && !!memberChatActiveFriend
            && !!getFriendContact(memberChatActiveFriend)?.canChat
            && typeof navigator !== 'undefined'
            && !!navigator.mediaDevices
            && typeof navigator.mediaDevices.getUserMedia === 'function'
            && typeof MediaRecorder !== 'undefined'
            && !!getDirectChatVoiceMimeType();
    }

    function updateDirectChatVoiceStatus(text, visible) {
        const statusEl = document.getElementById('memberChatVoiceStatus');
        if (!statusEl) return;
        statusEl.hidden = !visible;
        statusEl.textContent = String(text || '');
    }

    function blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = String(reader.result || '');
                const base64 = result.includes(',') ? result.split(',')[1] : result;
                resolve(base64);
            };
            reader.onerror = () => reject(new Error('VOICE_ENCODE_FAILED'));
            reader.readAsDataURL(blob);
        });
    }

    function stopDirectChatVoiceStream() {
        if (directChatVoiceStream) {
            directChatVoiceStream.getTracks().forEach((track) => track.stop());
            directChatVoiceStream = null;
        }
    }

    function stopDirectChatVoiceRecording(options = {}) {
        if (directChatVoiceRecordTimer) {
            clearInterval(directChatVoiceRecordTimer);
            directChatVoiceRecordTimer = null;
        }
        const recorder = directChatVoiceRecorder;
        directChatVoiceRecorder = null;
        directChatVoiceRecording = false;
        directChatVoiceRecordStartedAt = 0;
        const holdBtn = document.getElementById('memberChatVoiceHoldBtn');
        if (holdBtn) holdBtn.classList.remove('is-recording');
        if (!options.keepStatus) {
            updateDirectChatVoiceStatus('', false);
        }
        if (recorder && recorder.state !== 'inactive') {
            try {
                recorder.stop();
            } catch (_e) {}
        } else {
            stopDirectChatVoiceStream();
        }
    }

    async function sendDirectChatVoiceBlob(blob, durationMs, mimeType) {
        const peer = normalizeMemberAccount(memberChatActiveFriend);
        if (!peer || !getFriendContact(peer)?.canChat) {
            showToast(bmT('toast.directChatNeedMutual'));
            return false;
        }
        if (!canUseMemberChatApi()) {
            showToast(bmT('toast.directChatLoginRequired'));
            return false;
        }
        try {
            const audioBase64 = await blobToBase64(blob);
            const payload = await apiRequest('/chat/direct/voice', {
                method: 'POST',
                body: {
                    peer,
                    mimeType,
                    audioBase64,
                    durationMs
                }
            });
            if (payload && payload.message) {
                mergeDirectChatMessages([mapDirectChatMessageRow(payload.message)], false);
                memberChatAnimateLast = true;
                renderMemberChatMessages();
                renderMemberChatQuickPreview();
                memberChatAnimateLast = false;
                showToast(bmT('toast.directChatVoiceSent'));
            } else {
                await refreshDirectChatMessages({ initial: true, showError: true });
            }
            return true;
        } catch (error) {
            showToast(error.message || bmT('toast.directChatVoiceSendFailed'));
            return false;
        }
    }

    async function startDirectChatVoiceRecording() {
        if (directChatVoiceRecording) return;
        if (!canUseDirectChatVoice()) {
            showToast(bmT('toast.directChatVoiceUnavailable'));
            return;
        }
        try {
            directChatVoiceStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            const mimeType = getDirectChatVoiceMimeType();
            directChatVoiceChunks = [];
            directChatVoiceRecorder = new MediaRecorder(directChatVoiceStream, mimeType ? { mimeType } : undefined);
            directChatVoiceRecorder.addEventListener('dataavailable', (event) => {
                if (event.data && event.data.size > 0) {
                    directChatVoiceChunks.push(event.data);
                }
            });
            directChatVoiceRecorder.addEventListener('stop', async () => {
                const chunks = directChatVoiceChunks.slice();
                const startedAt = directChatVoiceRecordStartedAt;
                const usedMime = mimeType || 'audio/webm';
                stopDirectChatVoiceStream();
                directChatVoiceChunks = [];
                updateDirectChatVoiceStatus('', false);
                const durationMs = Math.max(500, Date.now() - startedAt);
                if (!chunks.length) return;
                const blob = new Blob(chunks, { type: usedMime });
                if (durationMs < 500) {
                    showToast(bmT('toast.directChatVoiceTooShort'));
                    return;
                }
                await sendDirectChatVoiceBlob(blob, Math.min(durationMs, DIRECT_CHAT_VOICE_MAX_MS), usedMime || 'audio/webm');
            }, { once: true });
            directChatVoiceRecorder.start();
            directChatVoiceRecording = true;
            directChatVoiceRecordStartedAt = Date.now();
            const holdBtn = document.getElementById('memberChatVoiceHoldBtn');
            if (holdBtn) holdBtn.classList.add('is-recording');
            updateDirectChatVoiceStatus(bmT('page1.friendsVoiceRecording', { sec: 0 }), true);
            directChatVoiceRecordTimer = setInterval(() => {
                if (!directChatVoiceRecording) return;
                const elapsed = Date.now() - directChatVoiceRecordStartedAt;
                const sec = Math.floor(elapsed / 1000);
                updateDirectChatVoiceStatus(bmT('page1.friendsVoiceRecording', { sec }), true);
                if (elapsed >= DIRECT_CHAT_VOICE_MAX_MS) {
                    stopDirectChatVoiceRecording({ keepStatus: true });
                }
            }, 250);
        } catch (error) {
            stopDirectChatVoiceRecording();
            showToast(bmT('toast.directChatVoiceMicDenied'));
        }
    }

    function cancelDirectChatVoiceRecording() {
        if (!directChatVoiceRecording) return;
        const recorder = directChatVoiceRecorder;
        directChatVoiceRecorder = null;
        directChatVoiceChunks = [];
        directChatVoiceRecording = false;
        directChatVoiceRecordStartedAt = 0;
        if (directChatVoiceRecordTimer) {
            clearInterval(directChatVoiceRecordTimer);
            directChatVoiceRecordTimer = null;
        }
        const holdBtn = document.getElementById('memberChatVoiceHoldBtn');
        if (holdBtn) holdBtn.classList.remove('is-recording');
        updateDirectChatVoiceStatus('', false);
        if (recorder && recorder.state !== 'inactive') {
            recorder.onstop = null;
            try {
                recorder.stop();
            } catch (_e) {}
        }
        stopDirectChatVoiceStream();
    }

    async function fetchDirectChatVoicePayload(directId) {
        const cached = directChatVoiceCache.get(Number(directId));
        if (cached && cached.base64) return cached;
        const peer = normalizeMemberAccount(memberChatActiveFriend);
        if (!peer) throw new Error('PEER_REQUIRED');
        const payload = await apiRequest(
            `/chat/direct/voice?peer=${encodeURIComponent(peer)}&id=${encodeURIComponent(Number(directId) || 0)}`
        );
        const msg = payload && payload.message;
        if (!msg || !msg.audioBase64) throw new Error('VOICE_NOT_FOUND');
        const entry = {
            mime: msg.audioMime || 'audio/webm',
            base64: String(msg.audioBase64),
            durationMs: Number(msg.audioDurationMs) || 0
        };
        directChatVoiceCache.set(Number(directId), entry);
        return entry;
    }

    async function playDirectChatVoice(directId) {
        const id = Number(directId) || 0;
        if (!id) return;
        try {
            const entry = await fetchDirectChatVoicePayload(id);
            if (directChatVoiceAudioEl) {
                directChatVoiceAudioEl.pause();
                directChatVoiceAudioEl = null;
            }
            directChatVoiceAudioEl = new Audio(`data:${entry.mime};base64,${entry.base64}`);
            await directChatVoiceAudioEl.play();
        } catch (error) {
            showToast(error.message || bmT('toast.directChatVoicePlayFailed'));
        }
    }

    function bindDirectChatVoiceControls() {
        const holdBtn = document.getElementById('memberChatVoiceHoldBtn');
        if (!holdBtn || holdBtn.dataset.boundVoice === '1') return;
        holdBtn.dataset.boundVoice = '1';
        holdBtn.addEventListener('pointerdown', (event) => {
            if (!canUseDirectChatVoice()) return;
            event.preventDefault();
            if (holdBtn.setPointerCapture) {
                try { holdBtn.setPointerCapture(event.pointerId); } catch (_e) {}
            }
            startDirectChatVoiceRecording();
        });
        const finish = (event) => {
            if (!directChatVoiceRecording) return;
            event.preventDefault();
            stopDirectChatVoiceRecording();
        };
        holdBtn.addEventListener('pointerup', finish);
        holdBtn.addEventListener('pointerleave', cancelDirectChatVoiceRecording);
        holdBtn.addEventListener('pointercancel', cancelDirectChatVoiceRecording);
    }

    async function addServerFriendContact(account) {
        const peer = normalizeMemberAccount(account);
        if (!peer) return showToast(bmT('toast.needFriendName'));
        const me = normalizeMemberAccount(backendSessionState && backendSessionState.account);
        if (peer === me) return showToast(bmT('toast.friendSameAsSelf'));
        if (!canUseMemberChatApi()) {
            showToast(bmT('toast.directChatLoginRequired'));
            return;
        }
        try {
            const payload = await apiRequest('/chat/friends', {
                method: 'POST',
                body: { account: peer }
            });
            await refreshServerFriendContacts();
            memberChatActiveFriend = peer;
            if (payload && payload.friend && payload.friend.canChat) {
                directChatSinceId = 0;
                await refreshDirectChatMessages({ initial: true });
                startDirectChatPolling();
                showToast(bmT('toast.friendMutualReady', { friend: peer }));
            } else {
                showToast(bmT('toast.friendWaitingMutual', { friend: peer }));
            }
        } catch (error) {
            showToast(error.message || bmT('toast.friendAddFailed'));
        }
    }

    function mapGroupChatMessageRow(msg) {
        return {
            type: 'text',
            sender: msg.senderAccount,
            text: msg.text,
            time: formatPublicChatTime(msg.createdAt),
            ts: new Date(msg.createdAt).getTime(),
            status: 'delivered',
            groupId: Number(msg.groupId) || 0,
            groupMsgId: Number(msg.id) || 0
        };
    }

    function mergeGroupChatMessages(incoming, reset) {
        if (reset) {
            groupChatMessages = incoming.slice();
        } else if (incoming.length) {
            const seen = new Set(groupChatMessages.map((row) => row.groupMsgId));
            incoming.forEach((row) => {
                if (!seen.has(row.groupMsgId)) {
                    groupChatMessages.push(row);
                    seen.add(row.groupMsgId);
                }
            });
            groupChatMessages.sort((a, b) => (a.groupMsgId || 0) - (b.groupMsgId || 0));
            if (groupChatMessages.length > 200) {
                groupChatMessages = groupChatMessages.slice(-200);
            }
        }
        groupChatSinceId = groupChatMessages.reduce(
            (max, row) => Math.max(max, row.groupMsgId || 0),
            groupChatSinceId
        );
    }

    function getActiveGroupEntry() {
        const id = Number(memberChatActiveGroupId) || 0;
        return serverGroups.find((entry) => Number(entry.id) === id) || null;
    }

    function stopGroupChatPolling() {
        if (groupChatPollTimer) {
            clearInterval(groupChatPollTimer);
            groupChatPollTimer = null;
        }
    }

    function startGroupChatPolling() {
        stopGroupChatPolling();
        if (!isGroupChatChannelMode() || !canUseMemberChatApi() || !memberChatActiveGroupId) return;
        if (!getActiveGroupEntry()) return;
        groupChatPollTimer = setInterval(() => {
            if (!isGroupChatChannelMode()) {
                stopGroupChatPolling();
                return;
            }
            refreshGroupChatMessages().catch(() => {});
        }, GROUP_CHAT_POLL_MS);
    }

    async function refreshServerGroups(options = {}) {
        if (!isGroupChatChannelMode()) return;
        if (!canUseMemberChatApi()) {
            serverGroups = [];
            renderMemberChatGroups();
            return;
        }
        try {
            const payload = await apiRequest('/chat/groups');
            serverGroups = Array.isArray(payload.groups) ? payload.groups : [];
            renderMemberChatGroups();
            if (options.showError === false) return;
        } catch (error) {
            if (options.showError) {
                showToast(error.message || bmT('toast.groupListLoadFailed'));
            }
        }
    }

    async function refreshGroupChatMessages(options = {}) {
        if (!isGroupChatChannelMode() || !memberChatActiveGroupId) return;
        if (groupChatRefreshing) return;
        const groupId = Number(memberChatActiveGroupId) || 0;
        if (!groupId || !getActiveGroupEntry()) {
            groupChatMessages = [];
            renderMemberChatMessages();
            renderMemberChatQuickPreview();
            return;
        }
        if (!canUseMemberChatApi()) {
            groupChatMessages = [];
            renderMemberChatMessages();
            renderMemberChatQuickPreview();
            updateMemberChatIdentity();
            return;
        }
        groupChatRefreshing = true;
        try {
            const since = options.initial ? 0 : groupChatSinceId;
            const payload = await apiRequest(
                `/chat/groups/messages?group=${encodeURIComponent(groupId)}&since=${since}&limit=100`
            );
            const incoming = (Array.isArray(payload.messages) ? payload.messages : [])
                .map(mapGroupChatMessageRow);
            mergeGroupChatMessages(incoming, !!options.initial);
            renderMemberChatMessages();
            renderMemberChatQuickPreview();
            updateMemberChatIdentity();
        } catch (error) {
            if (options.showError) {
                showToast(error.message || bmT('toast.groupChatLoadFailed'));
            }
        } finally {
            groupChatRefreshing = false;
        }
    }

    async function sendGroupChatMessage(text) {
        const groupId = Number(memberChatActiveGroupId) || 0;
        if (!groupId || !getActiveGroupEntry()) {
            showToast(bmT('toast.groupChatPickFirst'));
            return false;
        }
        if (!canUseMemberChatApi()) {
            showToast(bmT('toast.groupChatLoginRequired'));
            return false;
        }
        const trimmed = String(text || '').trim().slice(0, 280);
        if (!trimmed) {
            showToast(bmT('toast.needMessage'));
            return false;
        }
        try {
            const payload = await apiRequest('/chat/groups/messages', {
                method: 'POST',
                body: { groupId, text: trimmed }
            });
            if (payload && payload.message) {
                mergeGroupChatMessages([mapGroupChatMessageRow(payload.message)], false);
                memberChatAnimateLast = true;
                renderMemberChatMessages();
                renderMemberChatQuickPreview();
                memberChatAnimateLast = false;
            } else {
                await refreshGroupChatMessages({ initial: true, showError: true });
            }
            return true;
        } catch (error) {
            showToast(error.message || bmT('toast.groupChatSendFailed'));
            return false;
        }
    }

    async function createServerGroup(name) {
        const groupName = String(name || '').trim().slice(0, 48);
        if (!groupName) return showToast(bmT('toast.needGroupName'));
        if (!canUseMemberChatApi()) {
            showToast(bmT('toast.groupChatLoginRequired'));
            return;
        }
        try {
            const payload = await apiRequest('/chat/groups', {
                method: 'POST',
                body: { name: groupName }
            });
            await refreshServerGroups();
            if (payload && payload.group && payload.group.id) {
                memberChatActiveGroupId = Number(payload.group.id) || 0;
                groupChatSinceId = 0;
                await refreshGroupChatMessages({ initial: true });
                startGroupChatPolling();
            }
            showToast(bmT('toast.groupCreated', { name: groupName }));
        } catch (error) {
            showToast(error.message || bmT('toast.groupCreateFailed'));
        }
    }

    async function addServerGroupMember(account) {
        const peer = normalizeMemberAccount(account);
        const groupId = Number(memberChatActiveGroupId) || 0;
        if (!groupId) return showToast(bmT('toast.groupChatPickFirst'));
        if (!peer) return showToast(bmT('toast.needFriendName'));
        const me = normalizeMemberAccount(backendSessionState && backendSessionState.account);
        if (peer === me) return showToast(bmT('toast.friendSameAsSelf'));
        if (!canUseMemberChatApi()) {
            showToast(bmT('toast.groupChatLoginRequired'));
            return;
        }
        try {
            await apiRequest('/chat/groups/members', {
                method: 'POST',
                body: { groupId, account: peer }
            });
            await refreshServerGroups();
            showToast(bmT('toast.groupMemberAdded', { account: peer }));
        } catch (error) {
            showToast(error.message || bmT('toast.groupMemberAddFailed'));
        }
    }

    function syncMemberChatChannelUi() {
        const localTab = document.getElementById('memberChatTabLocal');
        const friendsTab = document.getElementById('memberChatTabFriends');
        const groupsTab = document.getElementById('memberChatTabGroups');
        const publicTab = document.getElementById('memberChatTabPublic');
        const badge = document.getElementById('memberChatChannelBadge');
        const localTools = document.getElementById('memberChatLocalTools');
        const groupTools = document.getElementById('memberChatGroupTools');
        const localHint = document.getElementById('memberChatLocalHint');
        const friendsHint = document.getElementById('memberChatFriendsHint');
        const groupsHint = document.getElementById('memberChatGroupsHint');
        const publicHint = document.getElementById('memberChatPublicHint');
        const panel = document.getElementById('memberChatPanel');
        const quickInput = document.getElementById('memberChatQuickInput');
        const messageInput = getMemberChatInputElement();
        const isPublic = isPublicChatChannelMode();
        const isFriends = isFriendsChatChannelMode();
        const isGroups = isGroupChatChannelMode();

        if (localTab) localTab.classList.toggle('is-active', isLocalChatChannelMode());
        if (friendsTab) friendsTab.classList.toggle('is-active', isFriends);
        if (groupsTab) groupsTab.classList.toggle('is-active', isGroups);
        if (publicTab) publicTab.classList.toggle('is-active', isPublic);
        if (badge) {
            badge.textContent = isPublic
                ? bmT('page1.publicBadge')
                : (isFriends
                    ? bmT('page1.friendsBadge')
                    : (isGroups ? bmT('page1.groupsBadge') : bmT('page1.chatBadge')));
        }
        if (localTools) localTools.hidden = isPublic || isGroups;
        if (groupTools) groupTools.hidden = !isGroups;
        if (localHint) localHint.hidden = !isLocalChatChannelMode();
        if (friendsHint) friendsHint.hidden = !isFriends;
        if (groupsHint) groupsHint.hidden = !isGroups;
        if (publicHint) publicHint.hidden = !isPublic;
        if (panel) {
            panel.classList.toggle('is-public-lobby', isPublic);
            panel.classList.toggle('is-friends-chat', isFriends);
            panel.classList.toggle('is-groups-chat', isGroups);
        }
        if (quickInput) {
            quickInput.placeholder = isPublic
                ? bmT('page1.publicQuickPh')
                : (isFriends
                    ? bmT('page1.friendsQuickPh')
                    : (isGroups ? bmT('page1.groupsQuickPh') : bmT('page1.quickPh')));
        }
        if (messageInput) {
            messageInput.placeholder = isPublic
                ? bmT('page1.publicMessagePh')
                : (isFriends
                    ? bmT('page1.friendsMessagePh')
                    : (isGroups ? bmT('page1.groupsMessagePh') : bmT('page1.messagePh')));
        }
        const voiceWrap = document.getElementById('memberChatVoiceWrap');
        if (voiceWrap) {
            voiceWrap.hidden = !isFriends || !canUseDirectChatVoice();
        }
        bindDirectChatVoiceControls();
        updateMemberChatIdentity();
        renderMemberChatMessages();
        renderMemberChatQuickPreview();
    }

    function switchMemberChatChannelMode(mode) {
        memberChatChannelMode = normalizeMemberChatChannelMode(mode);
        try {
            localStorage.setItem(MEMBER_CHAT_CHANNEL_KEY, memberChatChannelMode);
        } catch (_e) {}
        stopPublicChatPolling();
        stopDirectChatPolling();
        stopGroupChatPolling();
        if (memberChatChannelMode === 'public') {
            publicChatSinceId = 0;
            refreshPublicChatMessages({ initial: true }).catch(() => {});
            startPublicChatPolling();
        } else if (memberChatChannelMode === 'friends') {
            directChatSinceId = 0;
            directChatMessages = [];
            directChatVoiceCache.clear();
            stopDirectChatVoiceRecording();
            refreshServerFriendContacts().then(() => {
                if (memberChatActiveFriend) {
                    refreshDirectChatMessages({ initial: true }).catch(() => {});
                    startDirectChatPolling();
                }
            }).catch(() => {});
        } else if (memberChatChannelMode === 'groups') {
            groupChatSinceId = 0;
            groupChatMessages = [];
            refreshServerGroups().then(() => {
                if (memberChatActiveGroupId) {
                    refreshGroupChatMessages({ initial: true }).catch(() => {});
                    startGroupChatPolling();
                }
            }).catch(() => {});
        }
        syncMemberChatChannelUi();
    }

    window.refreshPublicChatAfterLogin = function refreshPublicChatAfterLogin(clearOnly) {
        if (clearOnly) {
            publicChatMessages = [];
            publicChatSinceId = 0;
            serverFriendContacts = [];
            directChatMessages = [];
            directChatSinceId = 0;
            directChatVoiceCache.clear();
            stopDirectChatVoiceRecording();
            serverGroups = [];
            groupChatMessages = [];
            groupChatSinceId = 0;
            stopPublicChatPolling();
            stopDirectChatPolling();
            stopGroupChatPolling();
            if (isPublicChatChannelMode() || isFriendsChatChannelMode() || isGroupChatChannelMode()) {
                syncMemberChatChannelUi();
            }
            return;
        }
        if (isGroupChatChannelMode()) {
            refreshServerGroups().then(() => {
                if (memberChatActiveGroupId) {
                    groupChatSinceId = 0;
                    refreshGroupChatMessages({ initial: true }).catch(() => {});
                    startGroupChatPolling();
                }
                syncMemberChatChannelUi();
            }).catch(() => {});
        }
        if (isFriendsChatChannelMode()) {
            refreshServerFriendContacts().then(() => {
                if (memberChatActiveFriend) {
                    directChatSinceId = 0;
                    refreshDirectChatMessages({ initial: true }).catch(() => {});
                    startDirectChatPolling();
                }
                syncMemberChatChannelUi();
            }).catch(() => {});
        }
        if (isPublicChatChannelMode()) {
            publicChatSinceId = 0;
            refreshPublicChatMessages({ initial: true }).catch(() => {});
            startPublicChatPolling();
            syncMemberChatChannelUi();
        }
    };

    function renderMemberChatMessageRows(body, rows) {
        let lastSender = '';
        let lastRowType = '';
        let lastDay = '';
        const parts = [];
        rows.forEach((row, index) => {
            const dayKey = getMemberChatDayKey(row);
            if (dayKey !== lastDay) {
                parts.push(`<div class="member-chat-day-divider">${escapeHTML(formatMemberChatDayLabel(dayKey))}</div>`);
                lastDay = dayKey;
                lastSender = '';
                lastRowType = '';
            }
            const me = isCurrentMemberChatSender(row.sender);
            const rowType = row.type || 'text';
            const compact = !me && row.sender === lastSender && rowType === 'text' && lastRowType === 'text';
            lastSender = row.sender;
            lastRowType = rowType;
            const animate = memberChatAnimateLast && index === rows.length - 1;
            if (rowType === 'calc-card') {
                parts.push(buildMemberChatCalcCardMarkup(row, { compact, animate }));
            } else {
                parts.push(buildMemberChatBubbleMarkup(row, { compact, animate }));
            }
        });
        body.innerHTML = parts.join('');
        body.scrollTop = body.scrollHeight;
    }

    function hashMemberChatHue(name) {
        const s = String(name || '訪客');
        let h = 0;
        for (let i = 0; i < s.length; i += 1) {
            h = ((h << 5) - h + s.charCodeAt(i)) | 0;
        }
        return Math.abs(h) % 360;
    }

    function getMemberChatAvatarStyle(name) {
        const hue = hashMemberChatHue(name);
        return `--chat-avatar-bg: linear-gradient(145deg, hsl(${hue} 38% 34%), hsl(${(hue + 24) % 360} 32% 24%));`;
    }

    function getMemberChatInitials(name) {
        const n = normalizeMemberChatDisplayName(name);
        if (n === bmT('guest') || n === '訪客') return bmT('guest').charAt(0) || 'G';
        const cleaned = n.replace(/[_\-.]/g, ' ').trim();
        const parts = cleaned.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) return (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase();
        if (/[\u4e00-\u9fff]/.test(cleaned)) return cleaned.slice(0, 1);
        return cleaned.slice(0, 2).toUpperCase();
    }

    function getMemberChatDayKey(row) {
        if (row && row.ts) {
            return new Date(Number(row.ts)).toLocaleDateString('zh-TW', { year: 'numeric', month: 'numeric', day: 'numeric' });
        }
        return new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'numeric', day: 'numeric' });
    }

    function formatMemberChatDayLabel(dayKey) {
        const today = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'numeric', day: 'numeric' });
        if (dayKey === today) return '今天';
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('zh-TW', { year: 'numeric', month: 'numeric', day: 'numeric' });
        if (dayKey === yesterday) return '昨天';
        return dayKey;
    }

    function createMemberChatMessage(sender, text) {
        const now = new Date();
        return {
            type: 'text',
            sender,
            text: String(text || '').trim().slice(0, 280),
            time: now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }),
            ts: now.getTime(),
            status: 'delivered'
        };
    }

    let lastMemberChatCalcSnapshot = null;

    function ensureMemberChatLobbyChannel() {
        const friends = loadMemberChatFriends();
        if (!friends.includes('群組大廳')) {
            friends.unshift('群組大廳');
            saveMemberChatFriends(friends);
        }
        if (!memberChatActiveFriend || !loadMemberChatFriends().includes(memberChatActiveFriend)) {
            memberChatActiveFriend = '群組大廳';
        }
        return '群組大廳';
    }

    function createMemberChatCalcCardMessage(payload) {
        const now = new Date();
        return {
            type: 'calc-card',
            sender: getCurrentMemberChatIdentity(),
            time: now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }),
            ts: now.getTime(),
            status: 'delivered',
            card: {
                title: String(payload.title || '試算結果'),
                name: String(payload.name || '未命名項目'),
                floor: String(payload.floor || '未分層'),
                quantity: String(payload.quantity || '-'),
                unitPrice: String(payload.unitPrice || '-'),
                subtotal: String(payload.subtotal || '-'),
                formula: String(payload.formula || ''),
                note: String(payload.note || ''),
                source: String(payload.source || '第1頁 · 試算'),
                isDeduct: !!payload.isDeduct
            }
        };
    }

    function buildMemberChatCalcCardMarkup(row, options = {}) {
        const preview = !!options.preview;
        const animate = !!options.animate;
        const me = isCurrentMemberChatSender(row.sender);
        const card = row.card || {};
        const title = escapeHTML(card.title || '試算結果');
        const name = escapeHTML(card.name || '未命名項目');
        const floor = escapeHTML(card.floor || '未分層');
        const quantity = escapeHTML(card.quantity || '-');
        const unitPrice = escapeHTML(card.unitPrice || '-');
        const subtotal = escapeHTML(card.subtotal || '-');
        const formula = escapeHTML(card.formula || '');
        const note = escapeHTML(card.note || '');
        const source = escapeHTML(card.source || '');
        const time = escapeHTML(String(row.time || ''));
        const tick = escapeHTML(row.status === 'delivered' ? '已送達' : '已送出');
        const rowCls = [
            'member-chat-row',
            me ? 'me' : 'other',
            'calc-card-row',
            card.isDeduct ? 'is-deduct' : '',
            animate ? 'is-enter' : ''
        ].filter(Boolean).join(' ');

        if (preview) {
            return `<div class="member-chat-preview-row${me ? ' me' : ''}"><div class="member-chat-preview-bubble member-chat-preview-calc">📊 ${name} · ${subtotal}</div></div>`;
        }

        const formulaBlock = formula
            ? `<div class="member-chat-calc-formula">${formula}</div>`
            : '';
        const noteBlock = note
            ? `<div class="member-chat-calc-note">${note}</div>`
            : '';

        return `<div class="${rowCls}"><div class="member-chat-bubble-wrap"><div class="member-chat-bubble member-chat-calc-card"><div class="member-chat-calc-kicker">📊 ${title}</div><div class="member-chat-calc-title">${name}</div><dl class="member-chat-calc-grid"><div><dt>樓層</dt><dd>${floor}</dd></div><div><dt>數量</dt><dd>${quantity}</dd></div><div><dt>單價</dt><dd>${unitPrice}</dd></div><div><dt>小計</dt><dd class="member-chat-calc-subtotal">${subtotal}</dd></div></dl>${formulaBlock}${noteBlock}<div class="member-chat-calc-source">${source}</div><div class="member-chat-meta"><span class="member-chat-time">${time}</span><span class="member-chat-tick">${tick}</span></div></div></div></div>`;
    }

    function pushMemberChatCalcResult(payload, options = {}) {
        if (!payload || typeof payload !== 'object') return false;
        const channel = ensureMemberChatLobbyChannel();
        const logs = loadMemberChatLogs();
        const rows = Array.isArray(logs[channel]) ? logs[channel] : [];
        rows.push(createMemberChatCalcCardMessage(payload));
        logs[channel] = rows.slice(-120);
        saveMemberChatLogs(logs);
        lastMemberChatCalcSnapshot = { ...payload };
        memberChatActiveFriend = channel;
        memberChatAnimateLast = true;
        renderMemberChatFriends();
        memberChatAnimateLast = false;
        if (!options.silent) {
            showToast(bmT('toast.estimateSentLobby'));
        }
        return true;
    }

    function shareLastCalcResultToMemberChat() {
        if (!lastMemberChatCalcSnapshot) {
            return showToast(bmT('toast.noEstimateYet'));
        }
        pushMemberChatCalcResult(lastMemberChatCalcSnapshot, { silent: false });
    }

    function buildMemberChatBubbleMarkup(row, options = {}) {
        if (row && row.type === 'calc-card' && row.card) {
            return buildMemberChatCalcCardMarkup(row, options);
        }
        if (row && (row.type === 'voice' || row.hasVoice)) {
            const compact = !!options.compact;
            const preview = !!options.preview;
            const animate = !!options.animate;
            const me = isCurrentMemberChatSender(row.sender);
            const displayName = normalizeMemberChatDisplayName(row.sender);
            const sender = escapeHTML(displayName);
            const time = escapeHTML(String(row.time || ''));
            const durationText = formatMemberChatVoiceDuration(row.audioDurationMs);
            const playLabel = escapeHTML(bmT('page1.friendsVoicePlayShort', { duration: durationText }));
            const tick = escapeHTML(row.status === 'delivered' ? '已送達' : '已送出');
            const directId = Number(row.directId) || 0;
            const rowCls = [
                me ? 'member-chat-row me' : 'member-chat-row other',
                'voice-row',
                compact ? 'is-compact' : '',
                animate ? 'is-enter' : ''
            ].filter(Boolean).join(' ');
            if (preview) {
                return `<div class="member-chat-preview-row${me ? ' me' : ''}"><div class="member-chat-preview-bubble member-chat-preview-voice"><span class="member-chat-voice-play-icon" aria-hidden="true"></span><span>${playLabel}</span></div></div>`;
            }
            const senderLine = (!me && !compact)
                ? `<div class="member-chat-sender">${sender}</div>`
                : '';
            const avatarStyle = getMemberChatAvatarStyle(displayName);
            const initials = escapeHTML(getMemberChatInitials(displayName));
            const avatar = `<div class="member-chat-avatar" style="${avatarStyle}" aria-hidden="true">${initials}</div>`;
            return `<div class="${rowCls}">${avatar}<div class="member-chat-bubble-wrap">${senderLine}<div class="member-chat-bubble member-chat-voice-bubble"><button type="button" class="member-chat-voice-play" onclick="playDirectChatVoice(${directId})" aria-label="${escapeHTML(bmT('page1.friendsVoicePlay'))}"><span class="member-chat-voice-play-icon" aria-hidden="true"></span><span class="member-chat-voice-play-text">${playLabel}</span></button><div class="member-chat-meta"><span class="member-chat-time">${time}</span><span class="member-chat-tick">${tick}</span></div></div></div></div>`;
        }
        const compact = !!options.compact;
        const preview = !!options.preview;
        const animate = !!options.animate;
        const me = isCurrentMemberChatSender(row.sender);
        const displayName = normalizeMemberChatDisplayName(row.sender);
        const sender = escapeHTML(displayName);
        const time = escapeHTML(String(row.time || ''));
        const text = escapeHTML(String(row.text || ''));
        const tick = escapeHTML(row.status === 'delivered' ? '已送達' : '已送出');
        const rowCls = [
            me ? 'member-chat-row me' : 'member-chat-row other',
            compact ? 'is-compact' : '',
            animate ? 'is-enter' : ''
        ].filter(Boolean).join(' ');
        const avatarStyle = getMemberChatAvatarStyle(displayName);
        const initials = escapeHTML(getMemberChatInitials(displayName));

        if (preview) {
            return `<div class="member-chat-preview-row${me ? ' me' : ''}"><div class="member-chat-preview-bubble">${text}</div></div>`;
        }

        const senderLine = (!me && !compact)
            ? `<div class="member-chat-sender">${sender}</div>`
            : '';
        const avatar = `<div class="member-chat-avatar" style="${avatarStyle}" aria-hidden="true">${initials}</div>`;

        return `<div class="${rowCls}">${avatar}<div class="member-chat-bubble-wrap">${senderLine}<div class="member-chat-bubble"><div class="member-chat-text">${text}</div><div class="member-chat-meta"><span class="member-chat-time">${time}</span><span class="member-chat-tick">${tick}</span></div></div></div></div>`;
    }

    function renderMemberChatQuickPreview() {
        const preview = document.getElementById('memberChatQuickPreview');
        if (!preview) return;
        if (isPublicChatChannelMode()) {
            const rows = publicChatMessages.slice(-3);
            preview.innerHTML = rows.length
                ? rows.map((row) => buildMemberChatBubbleMarkup(row, { preview: true })).join('')
                : '';
            return;
        }
        if (isFriendsChatChannelMode()) {
            const rows = directChatMessages.slice(-3);
            preview.innerHTML = rows.length
                ? rows.map((row) => buildMemberChatBubbleMarkup(row, { preview: true })).join('')
                : '';
            return;
        }
        if (isGroupChatChannelMode()) {
            const rows = groupChatMessages.slice(-3);
            preview.innerHTML = rows.length
                ? rows.map((row) => buildMemberChatBubbleMarkup(row, { preview: true })).join('')
                : '';
            return;
        }
        const friends = loadMemberChatFriends();
        const channel = friends.includes('群組大廳') ? '群組大廳' : (friends[0] || '');
        if (!channel) {
            preview.innerHTML = '';
            return;
        }
        const logs = loadMemberChatLogs();
        const rows = Array.isArray(logs[channel]) ? logs[channel] : [];
        if (!rows.length) {
            preview.innerHTML = '';
            return;
        }
        preview.innerHTML = rows.slice(-3).map((row) => buildMemberChatBubbleMarkup(row, { preview: true })).join('');
    }

    function getMemberChatGroupListElement() {
        return document.getElementById('memberChatGroupSelect');
    }

    function getMemberChatFriendListElement() {
        return document.getElementById('memberChatFriendList') || document.getElementById('memberChatFriendSelect');
    }

    function getMemberChatHintElement() {
        return document.getElementById('memberChatHint') || document.getElementById('memberChatStatus');
    }

    function getMemberChatMessageBodyElement() {
        return document.getElementById('memberChatBody') || document.getElementById('memberChatMessageList');
    }

    function getMemberChatInputElement() {
        return document.getElementById('memberChatInput') || document.getElementById('memberChatMessageInput');
    }

    function normalizeMemberChatName(value) {
        return String(value || '').trim().slice(0, 24);
    }

    function loadMemberChatFriends() {
        try {
            const raw = JSON.parse(localStorage.getItem(MEMBER_CHAT_FRIENDS_KEY) || '[]');
            if (!Array.isArray(raw)) return [];
            const seen = new Set();
            return raw
                .map(normalizeMemberChatName)
                .filter((name) => name && !seen.has(name) && seen.add(name));
        } catch (_e) {
            return [];
        }
    }

    function saveMemberChatFriends(list) {
        localStorage.setItem(MEMBER_CHAT_FRIENDS_KEY, JSON.stringify(Array.isArray(list) ? list : []));
    }

    function loadMemberChatLogs() {
        try {
            const raw = JSON.parse(localStorage.getItem(MEMBER_CHAT_LOGS_KEY) || '{}');
            return raw && typeof raw === 'object' ? raw : {};
        } catch (_e) {
            return {};
        }
    }

    function saveMemberChatLogs(map) {
        localStorage.setItem(MEMBER_CHAT_LOGS_KEY, JSON.stringify(map && typeof map === 'object' ? map : {}));
    }

    function normalizeMemberChatDisplayName(value) {
        const raw = String(value || '').trim();
        const account = normalizeMemberAccount(raw);
        if (!account || account === 'local' || account === 'local-pro') return bmT('guest');
        if (raw === 'local' || raw === 'local-pro') return bmT('guest');
        return account || raw || bmT('guest');
    }

    function getCurrentMemberChatIdentity() {
        const account = normalizeMemberAccount(backendSessionState && backendSessionState.account);
        return normalizeMemberChatDisplayName(account);
    }

    function isCurrentMemberChatSender(sender) {
        return normalizeMemberChatDisplayName(sender) === getCurrentMemberChatIdentity();
    }

    function updateMemberChatIdentity(friendCount = null) {
        const identityEl = document.getElementById('memberChatIdentity');
        const toggleBtn = document.getElementById('memberChatToggleBtn');
        const panel = document.getElementById('memberChatPanel');
        const statusEl = document.getElementById('memberChatStatus');
        const me = getCurrentMemberChatIdentity();

        if (isPublicChatChannelMode()) {
            if (identityEl) {
                identityEl.innerText = canUsePublicChatApi()
                    ? bmT('page1.publicIdentity', { account: me })
                    : bmT('page1.publicIdentityGuest');
            }
            if (statusEl) {
                statusEl.innerText = canUsePublicChatApi()
                    ? bmT('page1.publicStatusOnline')
                    : bmT('page1.publicStatusOffline');
            }
            if (toggleBtn && panel) {
                toggleBtn.innerText = panel.hidden ? bmT('page1.toggleOpen') : bmT('page1.toggleClose');
            }
            return;
        }

        if (isFriendsChatChannelMode()) {
            const mutualFriends = getMutualFriendContacts();
            const pendingCount = serverFriendContacts.filter((entry) => entry && !entry.canChat).length;
            if (identityEl) {
                identityEl.innerText = canUseMemberChatApi()
                    ? bmT('page1.friendsIdentity', { account: me })
                    : bmT('page1.friendsIdentityGuest');
            }
            if (statusEl) {
                if (!canUseMemberChatApi()) {
                    statusEl.innerText = bmT('page1.friendsStatusOffline');
                } else if (memberChatActiveFriend) {
                    statusEl.innerText = bmT('page1.friendsStatusChat', {
                        friend: memberChatActiveFriend,
                        mutual: mutualFriends.length,
                        pending: pendingCount
                    });
                } else {
                    statusEl.innerText = bmT('page1.friendsStatusReady', {
                        mutual: mutualFriends.length,
                        pending: pendingCount
                    });
                }
            }
            if (toggleBtn && panel) {
                toggleBtn.innerText = panel.hidden ? bmT('page1.toggleOpen') : bmT('page1.toggleClose');
            }
            return;
        }

        if (isGroupChatChannelMode()) {
            const activeGroup = getActiveGroupEntry();
            if (identityEl) {
                identityEl.innerText = canUseMemberChatApi()
                    ? bmT('page1.groupsIdentity', { account: me })
                    : bmT('page1.groupsIdentityGuest');
            }
            if (statusEl) {
                if (!canUseMemberChatApi()) {
                    statusEl.innerText = bmT('page1.groupsStatusOffline');
                } else if (activeGroup) {
                    statusEl.innerText = bmT('page1.groupsStatusChat', {
                        group: activeGroup.name,
                        members: activeGroup.memberCount || 0,
                        total: serverGroups.length
                    });
                } else {
                    statusEl.innerText = bmT('page1.groupsStatusReady', {
                        total: serverGroups.length
                    });
                }
            }
            if (toggleBtn && panel) {
                toggleBtn.innerText = panel.hidden ? bmT('page1.toggleOpen') : bmT('page1.toggleClose');
            }
            return;
        }

        const resolvedFriendCount = Number.isFinite(Number(friendCount)) ? Number(friendCount) : loadMemberChatFriends().length;
        if (identityEl) {
            identityEl.innerText = memberChatActiveFriend
                ? `目前身份：${me}｜對話對象：${memberChatActiveFriend}`
                : `目前身份：${me}`;
        }
        if (statusEl) {
            statusEl.innerText = memberChatActiveFriend
                ? `好友 ${resolvedFriendCount}｜對話：${memberChatActiveFriend}`
                : `好友 ${resolvedFriendCount}`;
        }
        if (toggleBtn && panel) {
            toggleBtn.innerText = panel.hidden ? bmT('page1.toggleOpen') : bmT('page1.toggleClose');
        }
    }

    function renderMemberChatGroups() {
        const listEl = getMemberChatGroupListElement();
        const hintEl = getMemberChatHintElement();

        if (!listEl) return;
        if (!canUseMemberChatApi()) {
            listEl.innerHTML = `<option value="">${escapeHTML(bmT('page1.groupsLoginRequired'))}</option>`;
            memberChatActiveGroupId = 0;
            updateMemberChatIdentity(0);
            renderMemberChatMessages();
            return;
        }

        const optionParts = [];
        if (!serverGroups.length) {
            optionParts.push(`<option value="">${escapeHTML(bmT('page1.groupsCreateFirst'))}</option>`);
            memberChatActiveGroupId = 0;
        } else {
            serverGroups.forEach((entry) => {
                const label = bmT('page1.groupsOptionLabel', {
                    name: entry.name,
                    members: entry.memberCount || 0
                });
                optionParts.push(`<option value="${Number(entry.id) || 0}">${escapeHTML(label)}</option>`);
            });
            if (!memberChatActiveGroupId || !serverGroups.some((entry) => Number(entry.id) === Number(memberChatActiveGroupId))) {
                memberChatActiveGroupId = Number(serverGroups[0].id) || 0;
            }
        }

        listEl.innerHTML = optionParts.join('');
        listEl.value = memberChatActiveGroupId ? String(memberChatActiveGroupId) : '';
        const activeGroup = getActiveGroupEntry();
        if (hintEl) {
            hintEl.innerText = activeGroup
                ? bmT('page1.groupsHintActive', {
                    group: activeGroup.name,
                    members: activeGroup.memberCount || 0,
                    total: serverGroups.length
                })
                : bmT('page1.groupsHintIdle', { total: serverGroups.length });
        }
        updateMemberChatIdentity(serverGroups.length);
        renderMemberChatMessages();
    }

    function renderMemberChatFriends() {
        const listEl = getMemberChatFriendListElement();
        const hintEl = getMemberChatHintElement();

        if (isGroupChatChannelMode()) {
            renderMemberChatGroups();
            return;
        }

        if (isFriendsChatChannelMode()) {
            if (!listEl) return;
            if (!canUseMemberChatApi()) {
                if (listEl.tagName === 'SELECT') {
                    listEl.innerHTML = `<option value="">${escapeHTML(bmT('page1.friendsLoginRequired'))}</option>`;
                }
                memberChatActiveFriend = '';
                updateMemberChatIdentity(0);
                renderMemberChatMessages();
                return;
            }

            const mutualFriends = getMutualFriendContacts();
            const pendingFriends = serverFriendContacts.filter((entry) => entry && !entry.canChat);
            const optionParts = [];

            if (!mutualFriends.length && !pendingFriends.length) {
                optionParts.push(`<option value="">${escapeHTML(bmT('page1.friendsAddFirst'))}</option>`);
                memberChatActiveFriend = '';
            } else {
                mutualFriends.forEach((entry) => {
                    optionParts.push(`<option value="${escapeHTML(entry.account)}">${escapeHTML(entry.account)}</option>`);
                });
                pendingFriends.forEach((entry) => {
                    const label = entry.addedByMe
                        ? bmT('page1.friendsPendingOut', { account: entry.account })
                        : bmT('page1.friendsPendingIn', { account: entry.account });
                    optionParts.push(`<option value="" disabled>${escapeHTML(label)}</option>`);
                });
                if (!memberChatActiveFriend || !mutualFriends.some((entry) => entry.account === memberChatActiveFriend)) {
                    memberChatActiveFriend = mutualFriends[0] ? mutualFriends[0].account : '';
                }
            }

            if (listEl.tagName === 'SELECT') {
                listEl.innerHTML = optionParts.join('');
                listEl.value = memberChatActiveFriend || '';
            }
            if (hintEl) {
                hintEl.innerText = memberChatActiveFriend
                    ? bmT('page1.friendsHintActive', {
                        friend: memberChatActiveFriend,
                        mutual: mutualFriends.length,
                        pending: pendingFriends.length
                    })
                    : bmT('page1.friendsHintIdle', { mutual: mutualFriends.length, pending: pendingFriends.length });
            }
            updateMemberChatIdentity(mutualFriends.length);
            renderMemberChatMessages();
            return;
        }

        const friends = loadMemberChatFriends();
        if (!listEl) return;
        if (!friends.length) {
            if (listEl.tagName === 'SELECT') {
                listEl.innerHTML = '<option value="">請先加入好友</option>';
            } else {
                listEl.innerHTML = '<div class="member-chat-empty">尚未新增好友，先輸入好友名稱加入。</div>';
            }
            if (hintEl) hintEl.innerText = '先新增至少 1 位好友，再開始聊天。';
            memberChatActiveFriend = '';
            updateMemberChatIdentity(0);
            renderMemberChatMessages();
            return;
        }
        if (!friends.includes(memberChatActiveFriend)) {
            memberChatActiveFriend = friends[0];
        }
        if (listEl.tagName === 'SELECT') {
            listEl.innerHTML = friends.map((friend) => `<option value="${escapeHTML(friend)}">${escapeHTML(friend)}</option>`).join('');
            listEl.value = memberChatActiveFriend;
        } else {
            listEl.innerHTML = friends.map((friend) => {
                const activeClass = friend === memberChatActiveFriend ? ' active' : '';
                return `<button type="button" class="member-chat-friend-btn${activeClass}" onclick="selectMemberChatFriend('${escapeHTML(friend)}')">${escapeHTML(friend)}</button>`;
            }).join('');
        }
        if (hintEl) hintEl.innerText = `好友 ${friends.length}｜目前對話：${memberChatActiveFriend}`;
        updateMemberChatIdentity(friends.length);
        renderMemberChatMessages();
    }

    function renderMemberChatMessages() {
        const body = getMemberChatMessageBodyElement();
        if (!body) return;

        if (isPublicChatChannelMode()) {
            if (!canUsePublicChatApi()) {
                body.innerHTML = `<div class="member-chat-empty">${escapeHTML(bmT('page1.publicLoginRequired'))}</div>`;
                renderMemberChatQuickPreview();
                return;
            }
            if (!publicChatMessages.length) {
                body.innerHTML = `<div class="member-chat-empty">${escapeHTML(bmT('page1.publicNoMessages'))}</div>`;
                renderMemberChatQuickPreview();
                return;
            }
            renderMemberChatMessageRows(body, publicChatMessages);
            renderMemberChatQuickPreview();
            return;
        }

        if (isFriendsChatChannelMode()) {
            if (!canUseMemberChatApi()) {
                body.innerHTML = `<div class="member-chat-empty">${escapeHTML(bmT('page1.friendsLoginRequired'))}</div>`;
                renderMemberChatQuickPreview();
                return;
            }
            if (!memberChatActiveFriend) {
                body.innerHTML = `<div class="member-chat-empty">${escapeHTML(bmT('page1.friendsPickFriend'))}</div>`;
                renderMemberChatQuickPreview();
                return;
            }
            const contact = getFriendContact(memberChatActiveFriend);
            if (!contact || !contact.canChat) {
                body.innerHTML = `<div class="member-chat-empty">${escapeHTML(bmT('page1.friendsNeedMutual', { friend: memberChatActiveFriend }))}</div>`;
                renderMemberChatQuickPreview();
                return;
            }
            if (!directChatMessages.length) {
                body.innerHTML = `<div class="member-chat-empty">${escapeHTML(bmT('page1.friendsNoMessages', { friend: memberChatActiveFriend }))}</div>`;
                renderMemberChatQuickPreview();
                return;
            }
            renderMemberChatMessageRows(body, directChatMessages);
            renderMemberChatQuickPreview();
            return;
        }

        if (isGroupChatChannelMode()) {
            if (!canUseMemberChatApi()) {
                body.innerHTML = `<div class="member-chat-empty">${escapeHTML(bmT('page1.groupsLoginRequired'))}</div>`;
                renderMemberChatQuickPreview();
                return;
            }
            if (!memberChatActiveGroupId || !getActiveGroupEntry()) {
                body.innerHTML = `<div class="member-chat-empty">${escapeHTML(bmT('page1.groupsPickGroup'))}</div>`;
                renderMemberChatQuickPreview();
                return;
            }
            if (!groupChatMessages.length) {
                const activeGroup = getActiveGroupEntry();
                body.innerHTML = `<div class="member-chat-empty">${escapeHTML(bmT('page1.groupsNoMessages', { group: activeGroup ? activeGroup.name : '' }))}</div>`;
                renderMemberChatQuickPreview();
                return;
            }
            renderMemberChatMessageRows(body, groupChatMessages);
            renderMemberChatQuickPreview();
            return;
        }

        if (!memberChatActiveFriend) {
            body.innerHTML = '<div class="member-chat-empty">請先新增好友並選擇對話對象。</div>';
            renderMemberChatQuickPreview();
            return;
        }
        const logs = loadMemberChatLogs();
        const rows = Array.isArray(logs[memberChatActiveFriend]) ? logs[memberChatActiveFriend] : [];
        if (!rows.length) {
            body.innerHTML = `<div class="member-chat-empty">與 ${escapeHTML(memberChatActiveFriend)} 尚無對話，輸入訊息後送出。</div>`;
            renderMemberChatQuickPreview();
            return;
        }
        renderMemberChatMessageRows(body, rows);
    }

    function createMemberChatGroup() {
        const input = document.getElementById('memberChatGroupNameInput');
        if (!input) return;
        const name = String(input.value || '').trim().slice(0, 48);
        if (!name) return showToast(bmT('toast.needGroupName'));
        input.value = '';
        createServerGroup(name);
    }

    function addMemberChatGroupMember() {
        const input = document.getElementById('memberChatGroupMemberInput');
        if (!input) return;
        const account = normalizeMemberAccount(input.value);
        if (!account) return showToast(bmT('toast.needFriendName'));
        input.value = '';
        addServerGroupMember(account);
    }

    function selectMemberChatGroup(groupId) {
        const id = Number(groupId) || 0;
        if (!id) return;
        memberChatActiveGroupId = id;
        groupChatSinceId = 0;
        refreshGroupChatMessages({ initial: true }).then(() => {
            startGroupChatPolling();
        }).catch(() => {});
        renderMemberChatGroups();
    }

    function addMemberChatFriend() {
        const input = document.getElementById('memberChatFriendInput');
        if (!input) return;
        if (isFriendsChatChannelMode()) {
            const account = normalizeMemberAccount(input.value);
            if (!account) return showToast(bmT('toast.needFriendName'));
            input.value = '';
            addServerFriendContact(account);
            return;
        }
        const friend = normalizeMemberChatName(input.value);
        if (!friend) return showToast(bmT('toast.needFriendName'));
        const me = getCurrentMemberChatIdentity();
        if (friend === me) return showToast(bmT('toast.friendSameAsSelf'));
        const friends = loadMemberChatFriends();
        if (!friends.includes(friend)) friends.push(friend);
        saveMemberChatFriends(friends);
        input.value = '';
        memberChatActiveFriend = friend;
        renderMemberChatFriends();
        showToast(bmT('toast.friendAdded', { friend }));
    }

    function selectMemberChatFriend(friend) {
        const name = isFriendsChatChannelMode()
            ? normalizeMemberAccount(friend)
            : normalizeMemberChatName(friend);
        if (!name) return;
        memberChatActiveFriend = name;
        if (isFriendsChatChannelMode()) {
            directChatSinceId = 0;
            directChatVoiceCache.clear();
            stopDirectChatVoiceRecording();
            refreshDirectChatMessages({ initial: true }).then(() => {
                startDirectChatPolling();
            }).catch(() => {});
        }
        renderMemberChatFriends();
    }

    function switchMemberChatFriend(friend) {
        selectMemberChatFriend(friend);
    }

    function sendMemberChatMessage() {
        const input = getMemberChatInputElement();
        if (!input) return;
        const text = String(input.value || '').trim().slice(0, 280);
        if (!text) return showToast(bmT('toast.needMessage'));
        if (isPublicChatChannelMode()) {
            sendPublicChatMessage(text).then((ok) => {
                if (ok) input.value = '';
            });
            return;
        }
        if (isFriendsChatChannelMode()) {
            sendDirectChatMessage(text).then((ok) => {
                if (ok) input.value = '';
            });
            return;
        }
        if (isGroupChatChannelMode()) {
            sendGroupChatMessage(text).then((ok) => {
                if (ok) input.value = '';
            });
            return;
        }
        if (!memberChatActiveFriend) return showToast(bmT('toast.selectFriendFirst'));
        const logs = loadMemberChatLogs();
        const friend = memberChatActiveFriend;
        const friendRows = Array.isArray(logs[friend]) ? logs[friend] : [];
        const sender = getCurrentMemberChatIdentity();
        friendRows.push(createMemberChatMessage(sender, text));
        logs[friend] = friendRows.slice(-120);
        saveMemberChatLogs(logs);
        input.value = '';
        memberChatAnimateLast = true;
        renderMemberChatMessages();
        memberChatAnimateLast = false;
    }

    function quickSendMemberChatMessage() {
        const quickInput = document.getElementById('memberChatQuickInput');
        const quickHint = document.getElementById('memberChatLocalHint');
        if (!quickInput) return;
        const text = String(quickInput.value || '').trim().slice(0, 280);
        if (!text) return showToast(bmT('toast.needChatContent'));

        if (isPublicChatChannelMode()) {
            sendPublicChatMessage(text).then((ok) => {
                if (!ok) return;
                quickInput.value = '';
                const panel = document.getElementById('memberChatPanel');
                if (panel && panel.hidden) {
                    panel.hidden = false;
                    panel.classList.add('is-open');
                }
                showToast(bmT('toast.messageSent'));
            });
            return;
        }

        if (isFriendsChatChannelMode()) {
            sendDirectChatMessage(text).then((ok) => {
                if (!ok) return;
                quickInput.value = '';
                const panel = document.getElementById('memberChatPanel');
                if (panel && panel.hidden) {
                    panel.hidden = false;
                    panel.classList.add('is-open');
                }
                showToast(bmT('toast.messageSent'));
            });
            return;
        }

        if (isGroupChatChannelMode()) {
            sendGroupChatMessage(text).then((ok) => {
                if (!ok) return;
                quickInput.value = '';
                const panel = document.getElementById('memberChatPanel');
                if (panel && panel.hidden) {
                    panel.hidden = false;
                    panel.classList.add('is-open');
                }
                showToast(bmT('toast.messageSent'));
            });
            return;
        }

        if (!memberChatActiveFriend) {
            const friends = loadMemberChatFriends();
            if (!friends.length) {
                const defaultFriend = '群組大廳';
                saveMemberChatFriends([defaultFriend]);
                memberChatActiveFriend = defaultFriend;
            }
            memberChatActiveFriend = loadMemberChatFriends()[0];
        }
        const logs = loadMemberChatLogs();
        const friend = memberChatActiveFriend;
        const friendRows = Array.isArray(logs[friend]) ? logs[friend] : [];
        const sender = getCurrentMemberChatIdentity();
        friendRows.push(createMemberChatMessage(sender, text));
        logs[friend] = friendRows.slice(-120);
        saveMemberChatLogs(logs);
        quickInput.value = '';
        const panel = document.getElementById('memberChatPanel');
        if (panel && panel.hidden) {
            panel.hidden = false;
            panel.classList.add('is-open');
        }
        memberChatAnimateLast = true;
        renderMemberChatFriends();
        memberChatAnimateLast = false;
        if (quickHint) {
            quickHint.innerText = `已送出到：${friend}（可在下方會員聊天持續對話）`;
        }
        showToast(bmT('toast.messageSent'));
    }

    function openMemberChatPanel() {
        const panel = document.getElementById('memberChatPanel');
        if (!panel) return;
        panel.hidden = false;
        panel.classList.add('is-open');
        updateMemberChatIdentity();
        if (isPublicChatChannelMode()) {
            refreshPublicChatMessages({ initial: !publicChatMessages.length }).catch(() => {});
            startPublicChatPolling();
        } else {
            renderMemberChatFriends();
        }
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        showToast(bmT('toast.memberChatOpened'));
    }

    function closeMemberChatPanel() {
        const panel = document.getElementById('memberChatPanel');
        if (!panel) return;
        panel.hidden = true;
        panel.classList.remove('is-open');
        updateMemberChatIdentity();
    }

    function toggleMemberChatPanel(forceOpen) {
        const panel = document.getElementById('memberChatPanel');
        if (!panel) return;
        const next = typeof forceOpen === 'boolean' ? forceOpen : panel.hidden;
        if (next) {
            openMemberChatPanel();
            return;
        }
        closeMemberChatPanel();
    }

    Object.assign(window, {
        addMemberChatFriend,
        addMemberChatGroupMember,
        createMemberChatGroup,
        sendMemberChatMessage,
        quickSendMemberChatMessage,
        selectMemberChatFriend,
        selectMemberChatGroup,
        switchMemberChatFriend,
        switchMemberChatChannelMode,
        playDirectChatVoice,
        openMemberChatPanel,
        closeMemberChatPanel,
        toggleMemberChatPanel,
        pushMemberChatCalcResult,
        shareLastCalcResultToMemberChat
    });

    function startMockRemoteDataStream() {
        if (!featureFlags.warRoom || !demoModeEnabled) return;
        if (warRoomTimer) clearInterval(warRoomTimer);

        const colleagues = ['B1-機電組 老王', '2F-泥作組 陳主任', '總部-採購部', 'A棟-鋼筋班 阿明'];
        const mockItems = ['預拌混凝土_3000psi', '竹節鋼筋(SD420W)', '模板工程(大樓)', '開挖土方'];

        warRoomTimer = setInterval(() => {
            if (!isWarRoomActive) return;

            const colleague = colleagues[Math.floor(Math.random() * colleagues.length)];
            const item = mockItems[Math.floor(Math.random() * mockItems.length)];
            const qty = Math.floor(Math.random() * 50) + 10;
            const price = Math.floor(Math.random() * 3000) + 500;

            const pushData = {
                floor: '☁️ 雲端',
                name: `[${colleague}] ${item}`,
                res: qty,
                up: price,
                totalCost: qty * price,
                cat: inferCategoryFromName(item),
                unit: 'M³/Kg',
                source: 'warroom'
            };

            warRoomList.unshift(pushData);
            renderTable();

            document.body.style.boxShadow = 'inset 0 0 30px rgba(0, 230, 118, 0.4)';
            setTimeout(() => { document.body.style.boxShadow = 'none'; }, 500);
            showToast(bmT('toast.liveSync', { colleague, qty, item }));
        }, 6000);
    }

    function appendMobileTestLog(message) {
        if (!isMobileViewport()) return;
        const body = document.getElementById('mobileTestLogBody');
        if (!body) return;
        const row = document.createElement('div');
        row.className = 'mobile-test-log-item';
        const stamp = new Date().toLocaleTimeString('zh-TW', { hour12: false });
        row.textContent = `[${stamp}] ${message}`;
        body.prepend(row);
        while (body.children.length > 24) {
            body.removeChild(body.lastChild);
        }
    }

    function toggleMobileTestLog() {
        const box = document.getElementById('mobileTestLog');
        if (!box) return;
        box.classList.toggle('collapsed');
        const btn = box.querySelector('.mobile-test-log-actions .mobile-test-log-btn');
        if (btn) btn.textContent = box.classList.contains('collapsed') ? bmT('mobile.testLogBtn') : bmT('drawer.collapse');
    }

    function clearMobileTestLog() {
        const body = document.getElementById('mobileTestLogBody');
        if (!body) return;
        body.innerHTML = '';
        const filter = document.getElementById('mobileTestLogFilter');
        if (filter) filter.value = '';
        appendMobileTestLog('已清除測試紀錄');
    }

    function filterMobileTestLog(keyword) {
        const body = document.getElementById('mobileTestLogBody');
        if (!body) return;
        const query = String(keyword || '').trim().toLowerCase();
        body.querySelectorAll('.mobile-test-log-item').forEach(row => {
            const text = (row.textContent || '').toLowerCase();
            row.hidden = query ? !text.includes(query) : false;
        });
    }

    async function copyMobileTestLog() {
        const body = document.getElementById('mobileTestLogBody');
        if (!body) return;
        const lines = Array.from(body.querySelectorAll('.mobile-test-log-item:not([hidden])'))
            .map(row => (row.textContent || '').trim())
            .filter(Boolean);
        if (!lines.length) {
            showToast(bmT('toast.noTestLog'));
            return;
        }
        const text = lines.join('\n');
        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(text);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.setAttribute('readonly', '');
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            showToast(bmT('toast.testLogCopied'));
        } catch (_error) {
            showToast(bmT('toast.copyFailed'));
        }
    }

    function showToast(m) {
        const t = document.getElementById("toast");
        t.innerText = m;
        t.className = "show";
        appendMobileTestLog(`Toast: ${m}`);
        setTimeout(() => t.className = "", 3000);
    }
    
    // --- 安全防護：CSV 匯出注入處理 ---
    function sanitizeCSVField(field) {
        if (typeof field !== 'string') field = field.toString();
        // 如果開頭是 =, +, -, @，前面加上單引號防止 Excel 當作公式執行
        if (/^[=+\-@]/.test(field)) {
            field = "'" + field;
        }
        // 如果內容有逗號，用雙引號包起來
        if (field.includes(',')) {
            field = `"${field}"`;
        }
        return field;
    }

    function exportToCSV() {
        if (list.length === 0) {
            return showToast(bmT('toast.noExportData'));
        }

        let csvContent = "\uFEFF樓層,工種大類,自訂項目(部位),基準數量,施工數量,調整係數,單位,發包單價,基準金額,施工金額\n";
        
        list.forEach(item => {
            let catMap = { 'CEMENT': '混凝土', 'MOLD': '模板', 'EARTH': '土方', 'STEEL': '鋼筋' };
            let catName = catMap[item.cat] || item.cat;
            
            let sFloor = sanitizeCSVField(item.floor);
            let sName = sanitizeCSVField(item.name);
            
            const adjustedQty = Number(item.res || 0);
            const baseQty = Number.isFinite(Number(item.baseRes)) ? Number(item.baseRes) : adjustedQty;
            const adjustFactor = Number.isFinite(Number(item.adjustFactor)) ? Number(item.adjustFactor) : 1;
            const adjustedCost = Number(item.totalCost || 0);
            const baseCost = Number.isFinite(Number(item.baseTotalCost)) ? Number(item.baseTotalCost) : adjustedCost;
            csvContent += `${sFloor},${catName},${sName},${baseQty.toFixed(2)},${adjustedQty.toFixed(2)},${adjustFactor.toFixed(3)},${item.unit},${item.up},${Math.round(baseCost)},${Math.round(adjustedCost)}\n`;
        });

        const totalMoney = document.getElementById('totalMoney').innerText.replace(/,/g, '');
        csvContent += `\n,,,,,,預估總計金額,${totalMoney}\n`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `ConstructionMaster_黑洞報表_${new Date().getTime()}.csv`;
        link.click();
        showToast(bmT('toast.reportDownloaded'));
        if (typeof recordRatingEngagement === 'function') recordRatingEngagement('export_report');
    }

    function calcMeasureQaScore() {
        const starts = Math.max(1, measureQaStats.measureStarts || 0);
        const successRate = (measureQaStats.measureSuccess || 0) / starts;
        const avgTilt = measureQaStats.tiltSamples > 0 ? (measureQaStats.tiltSum / measureQaStats.tiltSamples) : 0;
        const strictBlocks = Number(measureQaStats.strictBlocks || 0);
        const smartSessions = Number(measureQaStats.smartSessions || 0);
        const smartCompleted = Number(measureQaStats.smartCompleted || 0);
        const smartSuccessRate = smartSessions > 0 ? (smartCompleted / smartSessions) : 1;
        const smartFallbacks = Number(measureQaStats.smartFallbacks || 0);
        const smartLowConfidence = Number(measureQaStats.smartLowConfidence || 0);

        let score = 100;
        score -= Math.max(0, Math.round((1 - successRate) * 40));
        score -= Math.max(0, Math.round(Math.max(0, avgTilt - 5) * 3));
        score -= Math.min(20, strictBlocks * 2);
        score -= Math.max(0, Math.round((1 - smartSuccessRate) * 12));
        score -= Math.min(8, smartFallbacks * 2);
        score -= Math.min(10, smartLowConfidence * 2);
        return Math.max(0, Math.min(100, score));
    }

    async function exportMeasureQaReport() {
        if (!(await ensureFeatureAccess('measureQaReport', '量圖 QA 匯出暫時不可用'))) {
            return;
        }
        let qaPayload;
        try {
            qaPayload = await apiRequest('/qa/measure', {
                method: 'POST',
                body: { measureQaStats },
                retries: 0,
                timeoutMs: 15000
            });
        } catch (error) {
            console.warn('量圖 QA 匯出失敗', error);
            return showToast((error && error.message) || bmT('toast.measureQaExportFailed'));
        }
        const avgTilt = Number(qaPayload && qaPayload.avgTilt ? qaPayload.avgTilt : 0);
        const qaScore = Number(qaPayload && qaPayload.qaScore ? qaPayload.qaScore : 0);
        const qaLevel = qaPayload && qaPayload.qaLevel ? qaPayload.qaLevel : getQaLevelByScore(qaScore);
        const projectName = (document.getElementById('project_name') && document.getElementById('project_name').value) || '未命名專案';
        const reportRows = [
            ['報告時間', new Date().toLocaleString('zh-TW')],
            ['專案名稱', projectName],
            ['量圖輔助', measureAssistState.enabled ? '開' : '關'],
            ['量圖嚴格模式', measureAssistState.strict ? '開' : '關'],
            ['嚴格模式門檻(度)', String(MEASURE_STRICT_TILT_DEG)],
            ['定比例啟動次數', String(measureQaStats.calibrationStarts)],
            ['定比例成功次數', String(measureQaStats.calibrationSuccess)],
            ['測量啟動次數', String(measureQaStats.measureStarts)],
            ['測量完成次數', String(measureQaStats.measureSuccess)],
            ['智慧量圖啟動次數', String(measureQaStats.smartSessions || 0)],
            ['智慧量圖完成次數', String(measureQaStats.smartCompleted || 0)],
            ['智慧量圖吸附次數', String(measureQaStats.smartSnapUses || 0)],
            ['智慧量圖手動修正次數', String(measureQaStats.smartManualAdjusts || 0)],
            ['智慧量圖拖曳修正次數', String(measureQaStats.smartDragAdjusts || 0)],
            ['智慧量圖低信心回退次數', String(measureQaStats.smartFallbacks || 0)],
            ['智慧量圖低信心警示次數', String(measureQaStats.smartLowConfidence || 0)],
            ['傾斜樣本數', String(measureQaStats.tiltSamples)],
            ['平均傾斜角(度)', avgTilt.toFixed(2)],
            ['最大傾斜角(度)', measureQaStats.tiltMax.toFixed(2)],
            ['嚴格模式擋下次數', String(measureQaStats.strictBlocks)],
            ['QA分數', String(qaScore)],
            ['QA等級', qaLevel],
            ['目前傾斜角(度)', Number(measureAssistState.tiltDeg || 0).toFixed(2)],
            ['統計起算時間', new Date(measureQaStats.startedAt).toLocaleString('zh-TW')]
        ];

        let csvContent = '\uFEFF項目,數值\n';
        reportRows.forEach(([k, v]) => {
            const sk = sanitizeCSVField(k);
            const sv = sanitizeCSVField(v);
            csvContent += `${sk},${sv}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `ConstructionMaster_量圖QA報告_${new Date().getTime()}.csv`;
        link.click();
        if (typeof addAuditLog === 'function') {
            addAuditLog('匯出量圖QA報告', `等級 ${qaLevel} / 分數 ${qaScore} / 測量完成 ${measureQaStats.measureSuccess} 次`);
        }
        showToast(bmT('toast.measureQaExported', { level: qaLevel, score: qaScore }));
    }

    function isMobileViewport() {
        return window.matchMedia('(max-width: 768px)').matches;
    }

    function syncMobileBlueprintStatusCard() {
        const qualitySource = document.getElementById('blueprint-quality-info');
        const autoSource = document.getElementById('blueprint-auto-interpret-info');
        const qualityTarget = document.getElementById('mobileBlueprintQualityInfo');
        const autoTarget = document.getElementById('mobileBlueprintAutoInterpretInfo');
        const summary = document.getElementById('mobileBlueprintStatusSummary');
        if (!qualitySource || !autoSource || !qualityTarget || !autoTarget || !summary) return;
        qualityTarget.textContent = qualitySource.textContent || bmT('mobile.qualityPending');
        qualityTarget.style.color = qualitySource.style.color || '#c7d6e6';
        autoTarget.textContent = autoSource.textContent || bmT('mobile.autoPending');
        autoTarget.style.color = autoSource.style.color || '#bfe7ff';
        const qualityShort = (qualityTarget.textContent || '')
            .replace(/^圖紙品質:\s*/, '')
            .replace(/（過暗）/g, '偏暗')
            .replace(/（過亮）/g, '偏亮')
            .replace(/可用/g, 'OK');
        const autoShort = (autoTarget.textContent || '')
            .replace(/^自動判讀:\s*/, '')
            .replace(/單一運算/g, '單算')
            .replace(/已完成/g, '完成')
            .replace(/尚未執行/g, '未執行');
        const compact = `${qualityShort || '待檢查'} / ${autoShort || '未執行'}`;
        summary.textContent = compact.length > 18 ? `${compact.slice(0, 17)}...` : compact;
    }

    function toggleMobileBlueprintStatusCard(forceOpen) {
        const card = document.getElementById('mobileBlueprintStatus');
        if (!card || !isMobileViewport()) return;
        const next = typeof forceOpen === 'boolean' ? forceOpen : card.classList.contains('collapsed');
        card.classList.toggle('collapsed', !next);
        card.setAttribute('aria-hidden', next ? 'false' : 'true');
        syncMobileBlueprintStatusCard();
    }

    function toggleMobileLeftDrawer(forceOpen) {
        const drawer = document.getElementById('mobileLeftDrawer');
        const tab = document.getElementById('mobileLeftTab');
        if (!drawer || !isMobileViewport()) return;
        const next = typeof forceOpen === 'boolean' ? forceOpen : !drawer.classList.contains('open');
        if (next) toggleMobileFuncDrawer(false);
        drawer.classList.toggle('open', next);
        drawer.setAttribute('aria-hidden', next ? 'false' : 'true');
        if (tab) tab.textContent = next ? bmT('drawer.collapse') : bmT('drawer.alignTab');
    }

    function toggleMobileFuncDrawer(forceOpen) {
        const drawer = document.getElementById('mobileFuncDrawer');
        const tab = document.getElementById('mobileFuncTab');
        if (!drawer || !isMobileViewport()) return;
        const next = typeof forceOpen === 'boolean' ? forceOpen : !drawer.classList.contains('open');
        if (next) {
            toggleMobileLeftDrawer(false);
            const testLog = document.getElementById('mobileTestLog');
            if (testLog) testLog.classList.add('collapsed');
        }
        drawer.classList.toggle('open', next);
        drawer.setAttribute('aria-hidden', next ? 'false' : 'true');
        if (tab) tab.textContent = next ? bmT('drawer.collapse') : bmT('drawer.tab');
    }

    function updateMobileFocusLabel() {
        const label = document.querySelector('#mobileFocusBtn span');
        if (!label) return;
        const mode = localStorage.getItem(MOBILE_VIEW_MODE_KEY) || 'normal';
        const modeText = mode === 'clear' ? bmT('drawer.viewClear') : (mode === 'normal' ? bmT('drawer.viewNormal') : bmT('drawer.viewAuto'));
        label.textContent = bmT('drawer.viewMode', { mode: modeText });
    }

    function applyMobileViewMode(mode, opts = {}) {
        const normalized = (mode === 'clear' || mode === 'normal' || mode === 'auto') ? mode : 'normal';
        localStorage.setItem(MOBILE_VIEW_MODE_KEY, normalized);
        const activeMeasure = typeof isMeasureInteractionMode === 'function'
            ? isMeasureInteractionMode(drawMode)
            : (drawMode === 'calibration' || drawMode === 'measure');
        if (normalized === 'clear') {
            document.body.classList.toggle('mobile-focus-mode', activeMeasure);
        } else if (normalized === 'normal') {
            document.body.classList.remove('mobile-focus-mode');
        } else {
            document.body.classList.toggle('mobile-focus-mode', activeMeasure);
        }
        updateMobileFocusLabel();
        if (!opts.silent) {
            const text = normalized === 'clear' ? '釋放畫面' : (normalized === 'normal' ? '一般模式' : '自動釋放');
            appendMobileTestLog(`視圖模式: ${text}`);
            if (normalized === 'clear' && !activeMeasure) {
                showToast(bmT('toast.focusModeAutoApply'));
            }
        }
    }

    function cycleMobileViewMode() {
        const current = localStorage.getItem(MOBILE_VIEW_MODE_KEY) || 'normal';
        const next = current === 'normal' ? 'auto' : (current === 'auto' ? 'clear' : 'normal');
        applyMobileViewMode(next);
    }

    function updateMobileChaosLabel() {
        const btn = document.querySelector('#monkeyBtn span');
        if (!btn) return;
        btn.textContent = bmT('drawer.chaosState', { state: chaosMonkeyMode ? bmT('common.on') : bmT('common.off') });
    }

    function toggleAutoMeasure() {
        if (!scalePixelsPerUnit) {
            startCalibration();
            return showToast(bmT('toast.calibrateFirst'));
        }
        if (!measureAssistState.enabled) {
            toggleMeasureAssist();
        }
        startMeasure();
        showToast(bmT('toast.autoMeasureStarted'));
        toggleMobileFuncDrawer(false);
    }

    function syncMobileMeasureModeUI() {
        if (!isMobileViewport()) {
            document.body.classList.remove('mobile-measure-mode');
            updateTouchInteractionMode();
            renderManualMeasurePad();
            renderManualPrecisionOverlay();
            return;
        }
        const activeMeasure = isMeasureInteractionMode(drawMode);
        document.body.classList.toggle('mobile-measure-mode', activeMeasure);
        const mode = localStorage.getItem(MOBILE_VIEW_MODE_KEY) || 'normal';
        if (mode === 'auto') {
            document.body.classList.toggle('mobile-focus-mode', activeMeasure);
        } else if (mode === 'clear') {
            document.body.classList.toggle('mobile-focus-mode', activeMeasure);
        } else {
            document.body.classList.remove('mobile-focus-mode');
        }
        if (activeMeasure && mode !== 'normal') {
            const box = document.getElementById('mobileTestLog');
            if (box) box.classList.add('collapsed');
        }
        updateTouchInteractionMode();
        renderManualMeasurePad();
        renderManualPrecisionOverlay();
    }

    function getUserLevelGuideLines(level) {
        if (level === 'pro') {
            return [
                '【會員3（專家）｜放樣說明與排查】',
                '',
                'A. 推薦操作順序',
                '1) 匯入模型檔 -> 生成放樣點',
                '2) 控制點配準（建議 3 點）',
                '3) 跑偏差熱圖 + 置信度分層',
                '4) 產生補點建議 -> 現場抽驗 -> 匯出施工包',
                '',
                'B. 專家頁常見問題',
                '• 配準後 RMS 偏高：補第3控制點，並重做配準',
                '• 熱圖偏紅偏多：先跑「強化放樣」再重跑熱圖',
                '• 高信心點太少：先做高精度修正 + 分群 QA',
                '',
                'C. 驗收門檻',
                '• RMS <= 0.05 再進場',
                '• 高信心點比例建議 >= 60%',
                '• 抽驗 5 點至少 4 點通過'
            ];
        }
        if (level === 'standard') {
            return [
                '【會員2（工程）｜放樣說明與排查】',
                '',
                'A. 推薦操作順序',
                '1) 先生成放樣點',
                '2) 做高精度修正 + 自動分群',
                '3) 執行放樣 QA',
                '4) 需要時再做控制點配準',
                '',
                'B. 工程頁常見問題',
                '• 放樣點重複：先做高精度修正',
                '• QA 分數低：先分群，再重跑 QA',
                '• 匯出前不放心：先跑偏差熱圖看紅黃綠',
                '',
                'C. 驗收門檻',
                '• QA 建議 >= A',
                '• 紅色偏差點需先處理再施工'
            ];
        }
        return [
            '【會員1（基礎）｜放樣說明與排查】',
            '',
            'A. 推薦操作順序',
            '1) 先按「產生放樣點」',
            '2) 再按「強化放樣」',
            '3) 最後按「執行放樣 QA」',
            '',
            'B. 新手頁常見問題',
            '• 沒有放樣點：先確認模型檔已載入',
            '• 點太亂：先按強化放樣',
            '• 不知道能不能施工：看 QA 等級與偏差熱圖',
            '',
            'C. 新手檢查',
            '• QA 至少 B',
            '• 紅點不多再出圖'
        ];
    }

    function showCalcResetGuide() {
        const level = getCurrentUserLevel();
        alert(getUserLevelGuideLines(level).join('\n'));
    }

    function openBlueprintFilePicker() {
        const mobileInput = document.getElementById('mobileBlueprintFileInput');
        const desktopInput = document.getElementById('fileInput');
        const useMobile = typeof isMobileViewport === 'function' && isMobileViewport() && mobileInput;
        const target = useMobile ? mobileInput : desktopInput;
        if (!target) {
            showToast('找不到圖紙上傳入口，請重新整理頁面。');
            return;
        }
        target.value = '';
        target.click();
    }
    window.openBlueprintFilePicker = openBlueprintFilePicker;

    async function runMobileQuickAction(action) {
        appendMobileTestLog(`觸發功能: ${action}`);
        switch (action) {
        case 'scan':
            await autoQuantumScan();
            break;
        case 'toggle-focus':
            cycleMobileViewMode();
            break;
        case 'toggle-chaos':
            await toggleChaosMonkey();
            break;
        case 'start-bm-autotest':
            await startBmAutoTestFromUi();
            break;
        case 'usage-guide':
            showCalcResetGuide();
            break;
        case 'lidar-measure-guide':
            window.open('lidar-measure-guide.html', '_blank', 'noopener,noreferrer');
            break;
        case 'owner-lock':
            await handleOwnerLockAction();
            break;
        case 'owner-pass-change':
            await changeOwnerPassword();
            break;
        case 'measure':
            if (typeof startMeasure === 'function') startMeasure();
            break;
        case 'scale':
            if (typeof startCalibration === 'function') startCalibration();
            break;
        case 'clear':
            if (typeof clearCanvas === 'function') clearCanvas();
            break;
        case 'fit-view':
            if (typeof fitBlueprintToViewport === 'function') fitBlueprintToViewport();
            break;
        case 'pick-blueprint':
            if (typeof openBlueprintFilePicker === 'function') openBlueprintFilePicker();
            break;
        case 'enhance-image':
            if (typeof autoEnhanceImage === 'function') autoEnhanceImage();
            break;
        case 'reset-image-filter':
            if (typeof resetImageFilter === 'function') resetImageFilter();
            break;
        case 'remove-image':
            if (typeof removeLoadedImage === 'function') removeLoadedImage();
            break;
        case 'mode-calc':
            setWorkMode('calc');
            break;
        case 'mode-stake':
            setWorkMode('stake');
            break;
        case 'mode-electrical':
            setWorkMode('electrical');
            break;
        case 'mode-convert':
            setWorkMode('convert');
            break;
        case 'top':
            window.scrollTo({ top: 0, behavior: 'smooth' });
            break;
        default:
            break;
        }
        toggleMobileFuncDrawer(false);
    }

    function initMobileFuncDrawer() {
        const drawer = document.getElementById('mobileFuncDrawer');
        const leftDrawer = document.getElementById('mobileLeftDrawer');
        if (!drawer) return;
        drawer.addEventListener('click', (event) => {
            const target = event.target.closest('[data-mobile-action]');
            if (!target) return;
            const action = target.getAttribute('data-mobile-action');
            runMobileQuickAction(action);
        });
        document.addEventListener('click', (event) => {
            if (!isMobileViewport()) return;
            if (!drawer.classList.contains('open')) return;
            if (event.target.closest('#mobileFuncDrawer')) return;
            toggleMobileFuncDrawer(false);
        });
        document.addEventListener('click', (event) => {
            if (!isMobileViewport() || !leftDrawer) return;
            if (!leftDrawer.classList.contains('open')) return;
            if (event.target.closest('#mobileLeftDrawer')) return;
            toggleMobileLeftDrawer(false);
        });
        window.addEventListener('resize', () => {
            if (!isMobileViewport()) {
                toggleMobileFuncDrawer(false);
                toggleMobileLeftDrawer(false);
                document.body.classList.remove('mobile-focus-mode');
                document.body.classList.remove('mobile-measure-mode');
            }
            applyMobileViewMode(localStorage.getItem(MOBILE_VIEW_MODE_KEY) || 'normal', { silent: true });
            syncMobileMeasureModeUI();
        });
        applyMobileViewMode(localStorage.getItem(MOBILE_VIEW_MODE_KEY) || 'normal', { silent: true });
        applySunlightMode();
        syncMobileMeasureModeUI();
        syncMobileBlueprintStatusCard();
        updateOwnerLockButton();
        appendMobileTestLog('手機測試紀錄面板已啟用');
    }

    function initMemberChatUI() {
        const friends = loadMemberChatFriends();
        if (!friends.length) {
            saveMemberChatFriends(['群組大廳']);
        }
        if (!memberChatActiveFriend) {
            memberChatActiveFriend = loadMemberChatFriends()[0] || '群組大廳';
        }
        memberChatChannelMode = loadMemberChatChannelMode();
        updateMemberChatIdentity();
        renderMemberChatFriends();
        renderMemberChatQuickPreview();
        bindDirectChatVoiceControls();
        syncMemberChatChannelUi();
        if (memberChatChannelMode === 'public') {
            refreshPublicChatMessages({ initial: true }).catch(() => {});
            startPublicChatPolling();
        } else if (memberChatChannelMode === 'friends') {
            refreshServerFriendContacts().then(() => {
                if (memberChatActiveFriend) {
                    refreshDirectChatMessages({ initial: true }).catch(() => {});
                    startDirectChatPolling();
                }
            }).catch(() => {});
        } else if (memberChatChannelMode === 'groups') {
            refreshServerGroups().then(() => {
                if (memberChatActiveGroupId) {
                    refreshGroupChatMessages({ initial: true }).catch(() => {});
                    startGroupChatPolling();
                }
            }).catch(() => {});
        }
    }

