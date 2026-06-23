(function initBuildMasterProAccess(global) {
    'use strict';

    const TRIAL_AUTO_CALC_KEY = 'bm_pro_trial:autoCalc';
    const TRIAL_AR_KEY = 'bm_pro_trial:ar';
    const TRIAL_INIT_KEY = 'bm_pro_trial:initialized';
    const SUBSCRIBED_KEY = 'bm_pro:subscribed';
    const DEFAULT_AUTO_CALC_TRIAL = 3;
    const DEFAULT_AR_TRIAL = 3;

    function bmT(key, vars) {
        return (typeof global.BM_T === 'function') ? global.BM_T(key, vars) : key;
    }

    function safeGet(key, fallback) {
        try {
            const raw = global.localStorage.getItem(key);
            if (raw === null || raw === '') return fallback;
            return raw;
        } catch (_e) {
            return fallback;
        }
    }

    function safeSet(key, value) {
        try {
            global.localStorage.setItem(key, String(value));
        } catch (_e) { /* ignore */ }
    }

    function readInt(key, fallback) {
        const n = parseInt(String(safeGet(key, fallback)), 10);
        return Number.isFinite(n) ? n : fallback;
    }

    function ensureTrialInitialized() {
        if (safeGet(TRIAL_INIT_KEY, '') === '1') return;
        safeSet(TRIAL_AUTO_CALC_KEY, DEFAULT_AUTO_CALC_TRIAL);
        safeSet(TRIAL_AR_KEY, DEFAULT_AR_TRIAL);
        safeSet(TRIAL_INIT_KEY, '1');
    }

    function isNativeAppShell() {
        try {
            const params = new URLSearchParams(global.location.search);
            if (params.get('nativeapp') === '1') return true;
            return /ConstructionMasterNative/i.test(String(global.navigator && global.navigator.userAgent || ''));
        } catch (_e) {
            return false;
        }
    }

    function readBackendSubscription() {
        try {
            const state = global.backendSessionState;
            if (!state || typeof state !== 'object') return false;
            const billing = state.billing && typeof state.billing === 'object' ? state.billing : {};
            if (billing.active === true || billing.isActive === true) return true;
            if (billing.hasSubscription === true) return true;
            const iso = String(state.accessExpiresAt || '').trim();
            if (iso && billing.hasSubscriptionExpiry) {
                const end = new Date(iso).getTime();
                if (!Number.isNaN(end) && end > Date.now()) return true;
            }
        } catch (_e) { /* ignore */ }
        return false;
    }

    function hasActiveSubscription() {
        if (safeGet(SUBSCRIBED_KEY, '') === '1') return true;
        if (readBackendSubscription()) return true;
        return false;
    }

    function getTrialRemaining(kind) {
        ensureTrialInitialized();
        if (kind === 'ar') return Math.max(0, readInt(TRIAL_AR_KEY, DEFAULT_AR_TRIAL));
        return Math.max(0, readInt(TRIAL_AUTO_CALC_KEY, DEFAULT_AUTO_CALC_TRIAL));
    }

    function canUseFeature(kind) {
        if (!isNativeAppShell()) return true;
        if (hasActiveSubscription()) return true;
        return getTrialRemaining(kind) > 0;
    }

    function consumeTrial(kind) {
        if (!isNativeAppShell()) return true;
        if (hasActiveSubscription()) return true;
        ensureTrialInitialized();
        const key = kind === 'ar' ? TRIAL_AR_KEY : TRIAL_AUTO_CALC_KEY;
        const left = getTrialRemaining(kind);
        if (left <= 0) return false;
        safeSet(key, left - 1);
        syncNativeBridge();
        updateProAccessChip();
        return true;
    }

    function showSubscribePrompt(kind) {
        const autoLeft = getTrialRemaining('autoCalc');
        const arLeft = getTrialRemaining('ar');
        const featureLabel = kind === 'ar'
            ? bmT('proAccess.featureAr')
            : bmT('proAccess.featureAutoCalc');
        const msg = bmT('proAccess.subscribePrompt', {
            feature: featureLabel,
            autoLeft: autoLeft,
            arLeft: arLeft
        });
        if (typeof global.showToast === 'function') {
            global.showToast(msg);
        }
    }

    function guardFeature(kind) {
        if (canUseFeature(kind)) {
            return consumeTrial(kind);
        }
        showSubscribePrompt(kind);
        return false;
    }

    function syncNativeBridge() {
        const payload = {
            subscribed: hasActiveSubscription(),
            autoCalcRemaining: getTrialRemaining('autoCalc'),
            arRemaining: getTrialRemaining('ar')
        };
        try {
            if (global.webkit
                && global.webkit.messageHandlers
                && global.webkit.messageHandlers.bmProAccessSync) {
                global.webkit.messageHandlers.bmProAccessSync.postMessage(payload);
            }
        } catch (_e) { /* ignore */ }
        try {
            if (global.BuildMasterNative
                && typeof global.BuildMasterNative.bmProAccessSync === 'function') {
                global.BuildMasterNative.bmProAccessSync(JSON.stringify(payload));
            }
        } catch (_e2) { /* ignore */ }
        refreshNativeARConfig();
    }

    function refreshNativeARConfig() {
        const canOpen = canUseFeature('ar');
        global.__bmNativeARConfig = {
            enabled: canOpen,
            canOpen: canOpen,
            source: 'pro-access',
            subscribed: hasActiveSubscription(),
            trialRemaining: getTrialRemaining('ar')
        };
        if (global.BuildMasterNativeAR && typeof global.BuildMasterNativeAR.refreshUI === 'function') {
            global.BuildMasterNativeAR.refreshUI();
        }
    }

    function updateProAccessChip() {
        const chip = global.document && global.document.getElementById('proAccessChip');
        if (!chip) return;
        if (!isNativeAppShell()) {
            chip.hidden = true;
            return;
        }
        chip.hidden = false;
        if (hasActiveSubscription()) {
            chip.textContent = bmT('proAccess.chipSubscribed');
            chip.title = bmT('proAccess.chipSubscribedTitle');
            return;
        }
        const autoLeft = getTrialRemaining('autoCalc');
        const arLeft = getTrialRemaining('ar');
        chip.textContent = bmT('proAccess.chipTrial', { autoLeft: autoLeft, arLeft: arLeft });
        chip.title = bmT('proAccess.chipTrialTitle', { autoLeft: autoLeft, arLeft: arLeft });
    }

    async function ensureProAutoCalcAccess() {
        if (!isNativeAppShell()) return true;
        if (guardFeature('autoCalc')) return true;
        return false;
    }

    function guardAR() {
        return guardFeature('ar');
    }

    function applyProPrecisionDefaults() {
        if (!isNativeAppShell()) return;
        const gateInput = global.document && global.document.getElementById('advAutoInterpretGate');
        if (!gateInput) return;
        const current = Number(gateInput.value);
        if (!Number.isFinite(current) || current < 95) {
            gateInput.value = '95';
            if (typeof global.refreshAdvancedEstimate === 'function') {
                global.refreshAdvancedEstimate(true);
            }
        }
    }

    function initProAccess() {
        ensureTrialInitialized();
        applyProPrecisionDefaults();
        refreshNativeARConfig();
        updateProAccessChip();
        syncNativeBridge();
        global.addEventListener('bm:languagechange', updateProAccessChip);
    }

    global.BuildMasterProAccess = {
        isNativeAppShell,
        hasActiveSubscription,
        getTrialRemaining,
        canUseFeature,
        consumeTrial,
        guardFeature,
        guardAR,
        ensureProAutoCalcAccess,
        applyProPrecisionDefaults,
        refreshNativeARConfig,
        updateProAccessChip,
        syncNativeBridge,
        initProAccess
    };
    global.ensureProAutoCalcAccess = ensureProAutoCalcAccess;

    if (global.document) {
        if (global.document.readyState === 'loading') {
            global.document.addEventListener('DOMContentLoaded', initProAccess);
        } else {
            initProAccess();
        }
    }
})(typeof window !== 'undefined' ? window : globalThis);
