(function (global) {
    'use strict';

    const UPDATE_BUILD = '9644';
    const DISMISS_PREFIX = 'bm_update_marquee_dismiss_';
    const UPDATE_ITEM_KEYS = [
        'update.itemBuild9644',
        'update.itemModes',
        'update.itemFieldAlign',
        'update.itemStair',
        'update.itemMep',
        'update.itemC2Sample'
    ];

    function bmT(key, vars) {
        return (typeof global.BM_T === 'function') ? global.BM_T(key, vars) : key;
    }

    function readBuildFromUrl() {
        try {
            const build = new URLSearchParams(global.location.search).get('build');
            if (build) return String(build);
        } catch (_e) {}
        return UPDATE_BUILD;
    }

    function dismissStorageKey() {
        return DISMISS_PREFIX + readBuildFromUrl();
    }

    function isDismissed() {
        try {
            return global.localStorage.getItem(dismissStorageKey()) === '1';
        } catch (_e) {
            return false;
        }
    }

    function buildMarqueeText() {
        const sep = '   ·   ';
        const parts = UPDATE_ITEM_KEYS.map((key) => bmT(key));
        return parts.join(sep) + sep + parts.join(sep);
    }

    function renderUpdateMarquee() {
        const bar = global.document.getElementById('appUpdateMarquee');
        const inner = global.document.getElementById('appUpdateMarqueeInner');
        const buildLabel = global.document.getElementById('appUpdateBuildLabel');
        if (!bar || !inner) return;

        if (buildLabel) {
            buildLabel.textContent = bmT('update.buildLabel', { build: readBuildFromUrl() });
        }

        inner.textContent = buildMarqueeText();
        inner.style.animation = 'none';
        void inner.offsetWidth;
        const duration = Math.max(18, Math.min(42, inner.textContent.length * 0.14));
        inner.style.animation = `app-update-marquee-scroll ${duration}s linear infinite`;

        bar.hidden = isDismissed();
        bar.classList.toggle('app-update-marquee--hidden', isDismissed());
    }

    function dismissUpdateMarquee() {
        try {
            global.localStorage.setItem(dismissStorageKey(), '1');
        } catch (_e) {}
        const bar = global.document.getElementById('appUpdateMarquee');
        if (bar) {
            bar.hidden = true;
            bar.classList.add('app-update-marquee--hidden');
        }
    }

    function openStakeModeFromMarquee() {
        if (typeof global.setWorkMode === 'function') {
            global.setWorkMode('stake');
        }
        if (typeof global.showToast === 'function') {
            global.showToast(bmT('update.toastStake'));
        }
    }

    function initUpdateMarquee() {
        renderUpdateMarquee();
        global.document.getElementById('appUpdateMarqueeDismiss')?.addEventListener('click', (event) => {
            event.stopPropagation();
            dismissUpdateMarquee();
        });
        global.document.getElementById('appUpdateMarqueeAction')?.addEventListener('click', openStakeModeFromMarquee);
        global.document.getElementById('appUpdateMarquee')?.addEventListener('click', () => {
            openStakeModeFromMarquee();
        });
        global.addEventListener('bm:languagechange', renderUpdateMarquee);
    }

    global.initUpdateMarquee = initUpdateMarquee;
    global.renderUpdateMarquee = renderUpdateMarquee;

    if (global.document) {
        if (global.document.readyState === 'loading') {
            global.document.addEventListener('DOMContentLoaded', initUpdateMarquee);
        } else {
            initUpdateMarquee();
        }
    }
})(typeof window !== 'undefined' ? window : globalThis);
