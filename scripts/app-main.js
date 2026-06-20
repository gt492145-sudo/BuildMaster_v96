    function exposeInlineActionHandlers() {
        Object.assign(window, {
            submitSecurityCode,
            enterLocalOfflineDemoFromButton,
            setUserLevel,
            setWorkMode,
            setCalcSubPage,
            toggleCoachMode,
            toggleAiCoachMode,
            toggleWarRoom,
            addMemberChatFriend,
            sendMemberChatMessage,
            quickSendMemberChatMessage,
            selectMemberChatFriend,
            switchMemberChatFriend,
            openMemberChatPanel,
            closeMemberChatPanel,
            toggleMemberChatPanel,
            startCoachGuide,
            toggleContrastMode,
            toggleAutoContrastMode,
            startBmAutoTestFromUi,
            shareLastCalcResultToMemberChat,
            downloadMechaConfigFile,
            confirmStakeFieldSimulator,
            confirmElectricalFieldSimulator,
            toggleStakeSimCrosshair,
            toggleStakeSimPoints,
            redrawStakeFieldSimulator,
            stakeSimSnapToTarget,
            stakeSimMarkCurrentPoint,
            stakeSimPrevPoint,
            stakeSimNextPoint,
            electricalSimMeasureVoltage,
            stakeSimZoomIn,
            stakeSimZoomOut,
            stakeSimZoomReset,
            electricalSimZoomIn,
            electricalSimZoomOut,
            electricalSimZoomReset,
            startFeatureDemo,
            stopFeatureDemo,
            setFeatureDemoLoopMode,
            getFeatureDemoLoopMode,
            getFeatureDemoProgress,
            setFeatureDemoProgress,
            setFeatureDemoDynamicProperty,
            getFeatureDemoDynamicProperties,
            setFeatureDemoPlaybackMode,
            setFeatureDemoColorProvider,
            resetFeatureDemoPlayback,
            addFeatureDemoFinishListener,
            getFeatureDemoPlayback
        });
    }

    const bindTapAction = (window.BuildMasterSharedUiModule && window.BuildMasterSharedUiModule.bindTapAction)
        ? window.BuildMasterSharedUiModule.bindTapAction
        : function fallbackBindTapAction(element, handler) {
            if (!element || typeof handler !== 'function') return;
            let lastInvokeAt = 0;
            const invoke = (event) => {
        const now = Date.now();
                if (now - lastInvokeAt < 450) return;
                lastInvokeAt = now;
                handler(event);
            };
            element.addEventListener('touchend', (event) => {
                event.preventDefault();
                invoke(event);
            }, { passive: false });
            element.addEventListener('click', (event) => {
                invoke(event);
            });
        };

    function bindPrimaryHeaderActions() {
        bindTapAction(document.getElementById('workCalcBtn'), () => setWorkMode('calc'));
        bindTapAction(document.getElementById('workStakeBtn'), () => setWorkMode('stake'));
        bindTapAction(document.getElementById('workElectricalBtn'), () => setWorkMode('electrical'));
        bindTapAction(document.getElementById('workConvertBtn'), () => setWorkMode('convert'));
        bindTapAction(document.getElementById('calcPage1Btn'), () => setCalcSubPage(1));
        bindTapAction(document.getElementById('calcPage2Btn'), () => setCalcSubPage(2));
        bindTapAction(document.getElementById('coachToggle'), () => toggleCoachMode());
        bindTapAction(document.getElementById('aiCoachToggle'), () => toggleAiCoachMode());
        bindTapAction(document.getElementById('btnWarRoom'), () => toggleWarRoom());
        bindTapAction(document.getElementById('coachGuideBtn'), () => startCoachGuide(true));
        bindTapAction(document.getElementById('contrastToggle'), () => toggleContrastMode());
        bindTapAction(document.getElementById('contrastAutoToggle'), () => toggleAutoContrastMode());
        bindTapAction(document.getElementById('securityEnterBtn'), () => {
            const bridge = window.BuildMasterAuthBridge || {};
            if (typeof bridge.shouldSkipLoginGate === 'function' && bridge.shouldSkipLoginGate()) {
                bridge.enterLocalOfflineDemoFromButton().catch((e) => console.warn(e));
                return;
            }
            submitSecurityCode();
        });
    }

    exposeInlineActionHandlers();
    bindPrimaryHeaderActions();
    initMobileFuncDrawer();
    initMemberChatUI();
    if (typeof initFeatureDemos === 'function') initFeatureDemos();
    applyQaProfile(currentQaProfile, true);
    applyBimSpecPreset(currentBimSpecPreset, true);
    renderAutoInterpretMemoryPanel();
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') {
            sessionStorage.removeItem(OWNER_UNLOCK_SESSION_KEY);
            updateOwnerLockButton();
        }
    });
