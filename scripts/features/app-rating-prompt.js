(function (global) {
    'use strict';

    const STORAGE_KEY = 'bm_69:app_rating_v1';
    const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
    const MIN_SESSIONS = 2;
    const MIN_ENGAGEMENT = 1;
    const PROMPT_DELAY_MS = 1600;
    const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=com.wenwenming.constructionmaster';

    function bmT(key, vars) {
        return (typeof global.BM_T === 'function') ? global.BM_T(key, vars) : key;
    }

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (_e) {
            return {};
        }
    }

    function saveState(state) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (_e) {}
    }

    function shouldNeverShow() {
        const state = loadState();
        return !!state.neverAsk || (Number(state.ratedStars) || 0) >= 4;
    }

    function canShowPrompt() {
        const state = loadState();
        if (state.neverAsk) return false;
        if ((Number(state.ratedStars) || 0) >= 4) return false;
        if (state.dismissedAt && (Date.now() - Number(state.dismissedAt)) < COOLDOWN_MS) return false;
        if ((Number(state.sessions) || 0) < MIN_SESSIONS) return false;
        if ((Number(state.engagementScore) || 0) < MIN_ENGAGEMENT) return false;
        return true;
    }

    function requestNativeReview() {
        try {
            if (global.webkit && global.webkit.messageHandlers && global.webkit.messageHandlers.bmRequestReview) {
                global.webkit.messageHandlers.bmRequestReview.postMessage({});
                return true;
            }
            if (global.ConstructionMaster && typeof global.ConstructionMaster.requestReview === 'function') {
                global.ConstructionMaster.requestReview();
                return true;
            }
        } catch (_e) {}
        return false;
    }

    function openStoreFallback() {
        try {
            if (global.ConstructionMaster && typeof global.ConstructionMaster.openStoreListing === 'function') {
                global.ConstructionMaster.openStoreListing();
                return;
            }
        } catch (_e2) {}
        try {
            global.open(ANDROID_STORE_URL, '_blank', 'noopener,noreferrer');
        } catch (_e3) {}
    }

    function hideRatingPrompt() {
        const overlay = global.document.getElementById('appRatingPrompt');
        if (!overlay) return;
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
    }

    function setSelectedStars(count) {
        const stars = global.document.querySelectorAll('#appRatingStars .app-rating-star');
        stars.forEach((btn, idx) => {
            const active = idx < count;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-checked', active ? 'true' : 'false');
        });
        const submitBtn = global.document.getElementById('appRatingSubmitBtn');
        if (submitBtn) submitBtn.disabled = count < 1;
        const root = global.document.getElementById('appRatingPrompt');
        if (root) root.dataset.selected = String(count);
    }

    let overlay = null;

    function submitRating(stars) {
        const state = loadState();
        state.ratedStars = stars;
        state.ratedAt = Date.now();
        if (stars >= 4) {
            state.neverAsk = true;
            if (!requestNativeReview()) openStoreFallback();
        } else {
            state.dismissedAt = Date.now();
        }
        saveState(state);
        hideRatingPrompt();
        const msg = stars >= 4 ? bmT('rating.thanksHigh') : bmT('rating.thanksLow');
        if (typeof global.showToast === 'function') global.showToast(msg);
    }

    function dismissRatingPrompt(later) {
        const state = loadState();
        state.dismissedAt = Date.now();
        if (!later) state.neverAsk = true;
        saveState(state);
        hideRatingPrompt();
    }

    function showRatingPromptModal() {
        if (!canShowPrompt()) return;
        overlay = global.document.getElementById('appRatingPrompt');
        if (!overlay || overlay.classList.contains('open')) return;
        setSelectedStars(0);
        if (typeof global.BM_I18N !== 'undefined' && global.BM_I18N.applyDomI18n) {
            global.BM_I18N.applyDomI18n(overlay);
        }
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        const state = loadState();
        state.promptShownAt = Date.now();
        saveState(state);
    }

    function maybeScheduleRatingPrompt() {
        if (!canShowPrompt()) return;
        if (global._bmRatingTimer) clearTimeout(global._bmRatingTimer);
        global._bmRatingTimer = setTimeout(showRatingPromptModal, PROMPT_DELAY_MS);
    }

    function recordRatingEngagement(reason) {
        if (shouldNeverShow()) return;
        const state = loadState();
        state.engagementScore = (Number(state.engagementScore) || 0) + 1;
        const milestones = Array.isArray(state.milestones) ? state.milestones.slice() : [];
        if (reason && milestones.indexOf(reason) === -1) milestones.push(reason);
        state.milestones = milestones;
        saveState(state);
        maybeScheduleRatingPrompt();
    }

    function initAppRatingPrompt() {
        if (shouldNeverShow()) return;
        const state = loadState();
        state.sessions = (Number(state.sessions) || 0) + 1;
        state.lastSessionAt = Date.now();
        saveState(state);
        if ((Number(state.engagementScore) || 0) >= MIN_ENGAGEMENT) {
            maybeScheduleRatingPrompt();
        }

        overlay = global.document.getElementById('appRatingPrompt');
        if (!overlay || overlay.dataset.bound === '1') return;
        overlay.dataset.bound = '1';

        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) dismissRatingPrompt(true);
        });

        const starsWrap = global.document.getElementById('appRatingStars');
        if (starsWrap) {
            starsWrap.addEventListener('click', (event) => {
                const btn = event.target.closest('.app-rating-star');
                if (!btn) return;
                const value = Number(btn.getAttribute('data-star')) || 0;
                setSelectedStars(value);
            });
        }

        const submitBtn = global.document.getElementById('appRatingSubmitBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                const selected = Number(overlay.dataset.selected) || 0;
                if (selected < 1) return;
                submitRating(selected);
            });
        }

        const laterBtn = global.document.getElementById('appRatingLaterBtn');
        if (laterBtn) laterBtn.addEventListener('click', () => dismissRatingPrompt(true));

        const neverBtn = global.document.getElementById('appRatingNeverBtn');
        if (neverBtn) neverBtn.addEventListener('click', () => dismissRatingPrompt(false));
    }

    global.recordRatingEngagement = recordRatingEngagement;
    global.initAppRatingPrompt = initAppRatingPrompt;

    if (global.document) {
        if (global.document.readyState === 'loading') {
            global.document.addEventListener('DOMContentLoaded', initAppRatingPrompt);
        } else {
            initAppRatingPrompt();
        }
    }
})(typeof window !== 'undefined' ? window : globalThis);
