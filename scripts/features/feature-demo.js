(function (global) {
    'use strict';

    const STORAGE_PREFIX = 'bm_69:feature_demo:';
    const GLOBAL_LAST_AUTO_KEY = 'bm_69:feature_demo:last_auto_at';
    const LOOP_MODE_KEY = 'bm_69:feature_demo:loop_mode';
    const COOLDOWN_DISMISS_MS = 3 * 24 * 60 * 60 * 1000;
    const COOLDOWN_COMPLETE_MS = 14 * 24 * 60 * 60 * 1000;
    const MIN_GLOBAL_INTERVAL_MS = 12 * 60 * 60 * 1000;
    const MAX_AUTO_SHOWS = 4;
    const AUTO_DELAY_MS = 900;
    const VISIBILITY_RATIO = 0.35;
    const MOVE_BLEND_FRACTION = 0.4;
    const LOOP_MODES = ['once', 'loop', 'pingpong'];
    const PROGRESS_MIN = 0.0;
    const PROGRESS_MAX = 100.0;
    const DYNAMIC_TEXT_KEY_PATH = 'TextLayerNode';
    const DYNAMIC_THEME_KEY_PATH = '**';
    const DYNAMIC_DEFAULT_THEME = '#ffd54f';
    const LOTTIE_PROP = { TEXT: 'TEXT', TYPEFACE: 'TYPEFACE', COLOR_FILTER: 'COLOR_FILTER', COLOR: 'COLOR' };
    const LOTTIE_DEFAULT_FILL_KEYPATH = '**.Fill 1.Color';
    const SEGMENT_LOOP_MODES = ['playOnce', 'loop', 'pingpong'];

    function createCubicBezier(x1, y1, x2, y2) {
        const cx = 3 * x1;
        const bx = 3 * (x2 - x1) - cx;
        const ax = 1 - cx - bx;
        const cy = 3 * y1;
        const by = 3 * (y2 - y1) - cy;
        const ay = 1 - cy - by;

        function sampleX(t) {
            return ((ax * t + bx) * t + cx) * t;
        }

        function sampleY(t) {
            return ((ay * t + by) * t + cy) * t;
        }

        function sampleDX(t) {
            return (3 * ax * t + 2 * bx) * t + cx;
        }

        return function ease(x) {
            if (x <= 0) return 0;
            if (x >= 1) return 1;
            let t = x;
            for (let i = 0; i < 8; i++) {
                const sx = sampleX(t) - x;
                if (Math.abs(sx) < 1e-6) break;
                const dx = sampleDX(t);
                if (Math.abs(dx) < 1e-6) break;
                t -= sx / dx;
            }
            return sampleY(t);
        };
    }

    const EASE = {
        move: createCubicBezier(0.22, 1, 0.36, 1),
        step: createCubicBezier(0.4, 0, 0.2, 1),
        progress: createCubicBezier(0.25, 0.1, 0.25, 1),
        pointer: createCubicBezier(0.34, 1.56, 0.64, 1),
        caption: createCubicBezier(0.22, 0.61, 0.36, 1)
    };

    const DEMOS = [
        {
            id: 'calc_chat',
            mode: 'calc',
            rootSelector: '#freeWarRoomCard',
            titleKey: 'demo.calcChat.title',
            steps: [
                { selector: '#freeWarRoomCard', messageKey: 'demo.calcChat.s1', ms: 6000 },
                { selector: '#memberChatQuickInput', messageKey: 'demo.calcChat.s2', ms: 6000 },
                { selector: '#memberChatPanel', messageKey: 'demo.calcChat.s3', ms: 6000 },
                { selector: '#calcPage2Btn', messageKey: 'demo.calcChat.s4', ms: 6000 },
                { selector: '#coachGuideBtn', messageKey: 'demo.calcChat.s5', ms: 6000 }
            ]
        },
        {
            id: 'calc_measure',
            mode: 'calc',
            rootSelector: '#calcMeasureCluster',
            titleKey: 'demo.calcMeasure.title',
            steps: [
                { selector: '#calcPage2Btn', messageKey: 'demo.calcMeasure.s1', ms: 6000 },
                { selector: '#calcMeasureCluster', messageKey: 'demo.calcMeasure.s2', ms: 6000 },
                { selector: 'button[onclick="startSmartCalibration()"]', messageKey: 'demo.calcMeasure.s3', ms: 6000 },
                { selector: 'button[onclick="startSmartMeasure()"]', messageKey: 'demo.calcMeasure.s4', ms: 6000 },
                { selector: '#calcMeasureCluster', messageKey: 'demo.calcMeasure.s5', ms: 6000 }
            ]
        },
        {
            id: 'calc_ai',
            mode: 'calc',
            rootSelector: '#calcAiVisionCluster',
            titleKey: 'demo.calcAi.title',
            steps: [
                { selector: '#calcAiVisionCluster', messageKey: 'demo.calcAi.s1', ms: 7500 },
                { selector: '#calcAiVisionCluster button', messageKey: 'demo.calcAi.s2', ms: 7500 },
                { selector: '#calcAiVisionCluster', messageKey: 'demo.calcAi.s3', ms: 7500 },
                { selector: '#calcIbmCluster', messageKey: 'demo.calcAi.s4', ms: 7500 }
            ]
        },
        {
            id: 'stake_exec',
            mode: 'stake',
            rootSelector: '#stakeExecutionCluster',
            titleKey: 'demo.stakeExec.title',
            steps: [
                { selector: '#stakeExecutionCluster', messageKey: 'demo.stakeExec.s1', ms: 6000 },
                { selector: '#layoutTypeColumn', messageKey: 'demo.stakeExec.s2', ms: 6000 },
                { selector: 'button[onclick="runDesktopStakingPipeline()"]', messageKey: 'demo.stakeExec.s3', ms: 6000 },
                { selector: 'button[onclick="generateBimLayoutPoints()"]', messageKey: 'demo.stakeExec.s4', ms: 6000 },
                { selector: '#stakeFieldSimulator', messageKey: 'demo.stakeExec.s5', ms: 6000 }
            ]
        },
        {
            id: 'stake_field',
            mode: 'stake',
            rootSelector: '#stakeFieldSimulator',
            titleKey: 'demo.stakeField.title',
            steps: [
                { selector: '#stakeSimImageInput', messageKey: 'demo.stakeField.s1', ms: 6000 },
                { selector: '#stakeSimCanvas', messageKey: 'demo.stakeField.s2', ms: 6000 },
                { selector: '#stakeSimMarkBtn', messageKey: 'demo.stakeField.s3', ms: 6000 },
                { selector: 'button[onclick="confirmStakeFieldSimulator()"]', messageKey: 'demo.stakeField.s4', ms: 6000 },
                { selector: '#stakeExportCluster', messageKey: 'demo.stakeField.s5', ms: 6000 }
            ]
        },
        {
            id: 'stake_qa',
            mode: 'stake',
            rootSelector: '#stakeQaCluster',
            titleKey: 'demo.stakeQa.title',
            steps: [
                { selector: '#stakeQaCluster', messageKey: 'demo.stakeQa.s1', ms: 6000 },
                { selector: 'button[onclick="applyLayoutControlPointAlignment()"]', messageKey: 'demo.stakeQa.s2', ms: 6000 },
                { selector: 'button[onclick="runBimLayoutDeviationHeatmap()"]', messageKey: 'demo.stakeQa.s3', ms: 6000 },
                { selector: 'button[onclick="runBimLayoutQa()"]', messageKey: 'demo.stakeQa.s4', ms: 6000 },
                { selector: '#stakeExportCluster', messageKey: 'demo.stakeQa.s5', ms: 6000 }
            ]
        },
        {
            id: 'electrical_field',
            mode: 'electrical',
            rootSelector: '.electrical-section--sim',
            titleKey: 'demo.electricalField.title',
            steps: [
                { selector: '#electricalSimImageInput', messageKey: 'demo.electricalField.s1', ms: 6000 },
                { selector: '#electricalSimCanvas', messageKey: 'demo.electricalField.s2', ms: 6000 },
                { selector: '#electricalSimMeasureBtn', messageKey: 'demo.electricalField.s3', ms: 6000 },
                { selector: '#electricalSimRelayBtn', messageKey: 'demo.electricalField.s4', ms: 6000 },
                { selector: 'button[onclick="downloadMechaConfigFile()"]', messageKey: 'demo.electricalField.s5', ms: 6000 }
            ]
        }
    ];

    let session = null;
    let rafId = null;
    let overlayBuilt = false;
    let autoTimers = Object.create(null);
    let observers = [];
    let inited = false;

    function bmT(key, vars) {
        return (typeof global.BM_T === 'function') ? global.BM_T(key, vars) : key;
    }

    function toast(msg) {
        if (typeof global.showToast === 'function') global.showToast(msg);
    }

    function getWorkMode() {
        return global.document.body.getAttribute('data-work-mode')
            || global.localStorage.getItem('bm_69:work_mode')
            || 'calc';
    }

    function getDemoDuration(demo) {
        return demo.steps.reduce((sum, step) => sum + step.ms, 0);
    }

    function getLoopMode() {
        const saved = global.localStorage.getItem(LOOP_MODE_KEY);
        return LOOP_MODES.indexOf(saved) >= 0 ? saved : 'once';
    }

    function setLoopMode(mode) {
        if (LOOP_MODES.indexOf(mode) < 0) return;
        global.localStorage.setItem(LOOP_MODE_KEY, mode);
        if (session) {
            session.loopMode = mode;
            if (session.stateMachine) session.stateMachine.loopMode = mode;
        }
        refreshLoopModeUi();
    }

    function readRec(id) {
        try {
            return JSON.parse(global.localStorage.getItem(STORAGE_PREFIX + id) || '{}');
        } catch (e) {
            return {};
        }
    }

    function writeRec(id, rec) {
        global.localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(rec));
    }

    function isCoachGuideActive() {
        const panel = global.document.getElementById('coachGuidePanel');
        return !!(panel && !panel.classList.contains('hide'));
    }

    function isRatingOpen() {
        const el = global.document.getElementById('appRatingPrompt');
        return !!(el && el.classList.contains('open'));
    }

    function shouldAutoShow(demo) {
        const rec = readRec(demo.id);
        if (rec.forever) return false;
        if ((rec.autoShowCount || 0) >= MAX_AUTO_SHOWS) return false;
        const now = Date.now();
        const lastGlobal = parseInt(global.localStorage.getItem(GLOBAL_LAST_AUTO_KEY) || '0', 10);
        if (lastGlobal && now - lastGlobal < MIN_GLOBAL_INTERVAL_MS) return false;
        const lastDismiss = rec.lastDismissAt || 0;
        const lastComplete = rec.lastCompletedAt || 0;
        const lastShown = rec.lastShownAt || 0;
        const anchor = Math.max(lastDismiss, lastComplete, lastShown);
        if (!anchor) return true;
        const useCompleteCooldown = lastComplete >= lastDismiss;
        const cooldown = useCompleteCooldown ? COOLDOWN_COMPLETE_MS : COOLDOWN_DISMISS_MS;
        return now - anchor >= cooldown;
    }

    function isDemoRootVisible(demo) {
        const root = global.document.querySelector(demo.rootSelector);
        if (!root) return false;
        if (getWorkMode() !== demo.mode) return false;
        const style = global.getComputedStyle(root);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        const rect = root.getBoundingClientRect();
        if (rect.width < 8 || rect.height < 8) return false;
        const vh = global.innerHeight || 800;
        const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
        return visible / Math.max(rect.height, 1) >= VISIBILITY_RATIO;
    }

    function measureTargetRect(selector, rootSelector) {
        let target = global.document.querySelector(selector);
        if (!target) target = global.document.querySelector(rootSelector);
        if (!target) return null;
        const rect = target.getBoundingClientRect();
        const pad = 8;
        const top = Math.max(4, rect.top - pad);
        const left = Math.max(4, rect.left - pad);
        const width = Math.min(global.innerWidth - left - 4, rect.width + pad * 2);
        const height = Math.min(global.innerHeight - top - 4, rect.height + pad * 2);
        return { top, left, width, height };
    }

    function buildStepRects(demo) {
        return demo.steps.map((step) => measureTargetRect(step.selector, demo.rootSelector));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function clampProgress(value) {
        const n = Number(value);
        if (!Number.isFinite(n)) return PROGRESS_MIN;
        return Math.min(PROGRESS_MAX, Math.max(PROGRESS_MIN, n));
    }

    function roundProgress(value) {
        return Math.round(clampProgress(value) * 10) / 10;
    }

    function applyProgressState(state, meta) {
        const track = global.document.getElementById('featureDemoProgressTrack');
        const bar = global.document.getElementById('featureDemoProgressBar');
        const fill = global.document.getElementById('featureDemoProgressFill');
        const valueEl = global.document.getElementById('featureDemoProgressValue');
        const gauge = global.document.getElementById('featureDemoGauge');
        const start = state.progressStart;
        const end = state.progressEnd;
        const raw = state.progressRaw;

        if (track) {
            track.style.setProperty('--demo-progress-start', String(start));
            track.style.setProperty('--demo-progress-end', String(end));
            track.style.setProperty('--demo-progress-raw', String(raw));
            track.setAttribute('aria-valuenow', String(end));
            track.setAttribute('aria-valuemin', String(PROGRESS_MIN));
            track.setAttribute('aria-valuemax', String(PROGRESS_MAX));
        }
        if (bar) {
            bar.style.width = end + '%';
            bar.dataset.progressStart = String(start);
            bar.dataset.progressEnd = String(end);
            bar.dataset.progressRaw = String(raw);
        }
        if (fill) {
            fill.style.width = end + '%';
            fill.style.background = 'linear-gradient(90deg, #ffb74d 0%, #ffd54f '
                + start + '%, #ffe082 ' + end + '%, #ffd54f 100%)';
        }
        if (valueEl) {
            valueEl.textContent = bmT('demo.progressValue', { n: end.toFixed(1) });
        }
        if (gauge) {
            gauge.style.setProperty('--demo-progress-end', String(end));
            gauge.style.setProperty('--demo-progress-start', String(start));
            gauge.setAttribute('aria-valuenow', String(end));
        }
        if (session) {
            session.progress = state;
            if (session.stateMachine) session.stateMachine.syncProgressInput(state.progressEnd);
        }
        emitProgressBridge(state, meta || {});
    }

    function emitProgressBridge(state, meta) {
        const payload = Object.assign({
            type: 'progress',
            progressStart: state.progressStart,
            progressEnd: state.progressEnd,
            progressRaw: state.progressRaw,
            progressDelta: state.progressDelta,
            demoId: meta.demoId || (session && session.demo ? session.demo.id : ''),
            loopMode: meta.loopMode || (session ? session.loopMode : getLoopMode()),
            stateMachineName: meta.stateMachineName || (session && session.stateMachine
                ? session.stateMachine.stateMachineName : '')
        }, dynamicProperties.toPayload());
        global.__bmFeatureDemoProgress = payload;
        try {
            global.dispatchEvent(new CustomEvent('bm:featureDemoProgress', { detail: payload }));
        } catch (e) { /* ignore */ }
        const handler = global.webkit
            && global.webkit.messageHandlers
            && global.webkit.messageHandlers.bmFeatureDemo;
        if (handler && typeof handler.postMessage === 'function') {
            try { handler.postMessage(payload); } catch (e2) { /* ignore */ }
        }
        const android = global.ConstructionMaster;
        if (android && typeof android.onFeatureDemoProgress === 'function') {
            try { android.onFeatureDemoProgress(JSON.stringify(payload)); } catch (e3) { /* ignore */ }
        }
    }

    function emitAnimationDidFinish(completed) {
        if (!session) return;
        const payload = Object.assign({
            type: 'finished',
            completed: !!completed,
            demoId: session.demo.id,
            progressEnd: session.progress ? session.progress.progressEnd : PROGRESS_MIN,
            playbackMode: session.playback ? session.playback.playbackMode : 'paused'
        }, dynamicProperties.toPayload());
        global.__bmFeatureDemoFinished = payload;
        try {
            global.dispatchEvent(new CustomEvent('bm:featureDemoFinish', { detail: payload }));
        } catch (e) { /* ignore */ }
        const handler = global.webkit
            && global.webkit.messageHandlers
            && global.webkit.messageHandlers.bmFeatureDemo;
        if (handler && typeof handler.postMessage === 'function') {
            try { handler.postMessage(payload); } catch (e2) { /* ignore */ }
        }
        const android = global.ConstructionMaster;
        if (android && typeof android.onFeatureDemoFinished === 'function') {
            try { android.onFeatureDemoFinished(JSON.stringify(payload)); } catch (e3) { /* ignore */ }
        }
        (finishListeners || []).forEach((fn) => {
            try { fn(payload); } catch (err) { /* ignore */ }
        });
        (session.finishListeners || []).forEach((fn) => {
            try { fn(payload); } catch (err) { /* ignore */ }
        });
    }

    /**
     * 對應 iOS LottiePlaybackMode（paused / playing from→to）
     */
    class FeatureDemoPlaybackController {
        constructor() {
            this.playbackMode = 'playing';
            this.atProgress = PROGRESS_MIN;
            this.fromProgress = PROGRESS_MIN;
            this.toProgress = PROGRESS_MAX;
            this.segmentLoop = 'playOnce';
            this.isCompleted = false;
        }

        normalizeProgress(value) {
            const n = Number(value);
            if (!Number.isFinite(n)) return PROGRESS_MIN;
            if (n >= 0 && n <= 1) return roundProgress(n * PROGRESS_MAX);
            return roundProgress(n);
        }

        pausedAt(atProgress) {
            this.playbackMode = 'paused';
            this.atProgress = this.normalizeProgress(atProgress);
            this.isCompleted = false;
            return this;
        }

        playingFromTo(fromProgress, toProgress, segmentLoop) {
            this.playbackMode = 'playing';
            this.fromProgress = this.normalizeProgress(fromProgress);
            this.toProgress = this.normalizeProgress(toProgress);
            if (this.toProgress < this.fromProgress) {
                const swap = this.toProgress;
                this.toProgress = this.fromProgress;
                this.fromProgress = swap;
            }
            this.segmentLoop = SEGMENT_LOOP_MODES.indexOf(segmentLoop) >= 0 ? segmentLoop : 'playOnce';
            this.isCompleted = false;
            return this;
        }

        toPayload() {
            return {
                playbackMode: this.playbackMode,
                atProgress: this.atProgress,
                fromProgress: this.fromProgress,
                toProgress: this.toProgress,
                segmentLoop: this.segmentLoop,
                isCompleted: this.isCompleted
            };
        }
    }

    const finishListeners = [];

    function addFeatureDemoFinishListener(fn) {
        if (typeof fn !== 'function') return;
        finishListeners.push(fn);
    }

    function normalizeRgbColor(color) {
        if (typeof color === 'string') return color;
        if (!color || typeof color !== 'object') return DYNAMIC_DEFAULT_THEME;
        const channel = (v) => {
            const n = Number(v) || 0;
            const scaled = n <= 1 ? n * 255 : n;
            return Math.min(255, Math.max(0, Math.round(scaled)));
        };
        const r = channel(color.r);
        const g = channel(color.g);
        const b = channel(color.b);
        const toHex = (n) => n.toString(16).padStart(2, '0');
        return '#' + toHex(r) + toHex(g) + toHex(b);
    }

    function setFeatureDemoColorProvider(color, keyPath) {
        const hex = normalizeRgbColor(color);
        dynamicProperties.set(LOTTIE_PROP.COLOR, hex, keyPath || LOTTIE_DEFAULT_FILL_KEYPATH);
        dynamicProperties.set(LOTTIE_PROP.COLOR_FILTER, hex, DYNAMIC_THEME_KEY_PATH);
        dynamicProperties.applyToDom();
        return { color: hex, keyPath: keyPath || LOTTIE_DEFAULT_FILL_KEYPATH };
    }

    function setFeatureDemoPlaybackMode(opts) {
        if (!session) return null;
        opts = opts || {};
        if (opts.mode === 'paused' || opts.playbackMode === 'paused') {
            session.playback.pausedAt(opts.atProgress != null ? opts.atProgress : opts.progress || 0);
            if (rafId) global.cancelAnimationFrame(rafId);
            rafId = null;
            hideCompletedBanner();
            seekSessionToProgress(session.playback.atProgress);
            return session.playback.toPayload();
        }
        const from = opts.fromProgress != null ? opts.fromProgress : (opts.from != null ? opts.from : 0);
        const to = opts.toProgress != null ? opts.toProgress : (opts.to != null ? opts.to : 1);
        const segLoop = opts.segmentLoop || opts.loopMode || 'playOnce';
        session.playback.playingFromTo(from, to, segLoop);
        hideCompletedBanner();
        session.startAt = performance.now();
        seekSessionToProgress(session.playback.fromProgress);
        startAnimationLoop();
        return session.playback.toPayload();
    }

    function seekSessionToProgress(progressEnd) {
        if (!session) return;
        const playback = {
            phaseProgress: progressEnd / PROGRESS_MAX,
            globalProgress: progressEnd,
            elapsed: session.totalMs * (progressEnd / PROGRESS_MAX),
            direction: 1
        };
        const prevEnd = session.progress ? session.progress.progressEnd : PROGRESS_MIN;
        applyProgressState(computeProgressState(playback, prevEnd), {
            demoId: session.demo.id,
            loopMode: session.loopMode,
            stateMachineName: session.stateMachine ? session.stateMachine.stateMachineName : ''
        });
    }

    function showCompletedBanner() {
        const el = global.document.getElementById('featureDemoCompleted');
        if (!el) return;
        el.classList.remove('hide');
        el.textContent = bmT('demo.completedHint');
    }

    function hideCompletedBanner() {
        const el = global.document.getElementById('featureDemoCompleted');
        if (el) el.classList.add('hide');
        if (session && session.playback) session.playback.isCompleted = false;
    }

    function resetFeatureDemoPlayback() {
        if (!session) return;
        setFeatureDemoPlaybackMode({ mode: 'paused', atProgress: 0 });
        hideCompletedBanner();
    }

    /**
     * Web 版狀態機控制器 — 對應 Flutter Rive StateMachineController + SMIInput<double> progress
     */
    class FeatureDemoStateMachine {
        constructor(opts) {
            this.demoId = opts.demoId;
            this.stateMachineName = opts.stateMachineName || ('bm_onboarding_' + opts.demoId);
            this.loopMode = opts.loopMode || 'once';
            this.disposed = false;
            this.progressInput = { name: 'progress', value: PROGRESS_MIN };
        }

        syncProgressInput(value) {
            if (this.disposed) return;
            this.progressInput.value = roundProgress(value);
        }

        setProgressInput(value) {
            this.syncProgressInput(value);
            return this.progressInput.value;
        }

        getProgressInput() {
            return { name: this.progressInput.name, value: this.progressInput.value };
        }

        dispose() {
            this.disposed = true;
            this.progressInput.value = PROGRESS_MIN;
        }
    }

    let activeStateMachine = null;

    function resolveDemoUserName() {
        try {
            const member = global.sessionStorage.getItem('bm_69:member');
            if (member && String(member).trim()) return String(member).trim();
        } catch (e) { /* ignore */ }
        const guest = bmT('page1.identityGuest');
        const parts = guest.split('：');
        if (parts.length > 1 && parts[1].trim()) return parts[1].trim();
        return '訪客';
    }

    /**
     * 對應 Jetpack Compose rememberLottieDynamicProperties（TEXT / TYPEFACE / COLOR_FILTER）
     */
    class FeatureDemoDynamicProperties {
        constructor() {
            this.entries = Object.create(null);
        }

        set(property, value, keyPath) {
            const path = keyPath || DYNAMIC_THEME_KEY_PATH;
            this.entries[property + '@' + path] = { property, value, keyPath: path };
        }

        get(property, keyPath) {
            const hit = this.entries[property + '@' + keyPath];
            return hit ? hit.value : null;
        }

        resolveText() {
            const custom = this.get(LOTTIE_PROP.TEXT, DYNAMIC_TEXT_KEY_PATH);
            if (custom) return String(custom);
            return bmT('demo.welcomeUser', { name: resolveDemoUserName() });
        }

        resolveTypeface() {
            const custom = this.get(LOTTIE_PROP.TYPEFACE, DYNAMIC_TEXT_KEY_PATH);
            return custom ? String(custom) : 'inherit';
        }

        resolveThemeColor() {
            const fill = this.get(LOTTIE_PROP.COLOR, LOTTIE_DEFAULT_FILL_KEYPATH);
            if (fill) return String(fill);
            const custom = this.get(LOTTIE_PROP.COLOR_FILTER, DYNAMIC_THEME_KEY_PATH);
            return custom ? String(custom) : DYNAMIC_DEFAULT_THEME;
        }

        toPayload() {
            return {
                text: this.resolveText(),
                typeface: this.resolveTypeface(),
                themeColor: this.resolveThemeColor(),
                textKeyPath: DYNAMIC_TEXT_KEY_PATH,
                colorKeyPath: DYNAMIC_THEME_KEY_PATH
            };
        }

        applyToDom() {
            const overlay = global.document.getElementById('featureDemoOverlay');
            const welcome = global.document.getElementById('featureDemoWelcomeText');
            const theme = this.resolveThemeColor();
            const font = this.resolveTypeface();
            if (overlay) {
                overlay.style.setProperty('--demo-theme-color', theme);
                overlay.style.setProperty('--demo-typeface', font);
            }
            if (welcome) {
                welcome.textContent = this.resolveText();
                welcome.style.fontFamily = font;
            }
        }
    }

    let dynamicProperties = new FeatureDemoDynamicProperties();

    function setFeatureDemoDynamicProperty(property, value, keyPath) {
        dynamicProperties.set(property, value, keyPath);
        dynamicProperties.applyToDom();
        return dynamicProperties.toPayload();
    }

    function getFeatureDemoDynamicProperties() {
        return dynamicProperties.toPayload();
    }

    function interpolateRect(a, b, t) {
        if (!a) return b;
        if (!b) return a;
        return {
            top: lerp(a.top, b.top, t),
            left: lerp(a.left, b.left, t),
            width: lerp(a.width, b.width, t),
            height: lerp(a.height, b.height, t)
        };
    }

    function applySpotlightRect(rect, pointerPhase) {
        const hole = global.document.getElementById('featureDemoSpotlight');
        const pointer = global.document.getElementById('featureDemoPointer');
        if (!hole || !rect) return;
        hole.style.top = rect.top + 'px';
        hole.style.left = rect.left + 'px';
        hole.style.width = rect.width + 'px';
        hole.style.height = rect.height + 'px';
        if (pointer) {
            const tap = EASE.pointer(pointerPhase);
            const px = rect.left + rect.width * 0.72;
            const py = rect.top + rect.height * 0.55;
            const bounceY = -6 * Math.sin(tap * Math.PI);
            pointer.style.left = px + 'px';
            pointer.style.top = (py + bounceY) + 'px';
            pointer.style.transform = 'scale(' + lerp(1, 0.92, Math.sin(tap * Math.PI)) + ')';
        }
    }

    function computeProgressState(playback, prevEnd) {
        const globalProgress = playback.globalProgress != null
            ? roundProgress(playback.globalProgress)
            : roundProgress(playback.phaseProgress * PROGRESS_MAX);
        const progressRaw = globalProgress;
        const segPhase = playback.segmentPhase != null ? playback.segmentPhase : playback.phaseProgress;
        const progressEnd = roundProgress(
            (playback.fromProgress != null && playback.toProgress != null)
                ? playback.fromProgress + EASE.progress(segPhase) * (playback.toProgress - playback.fromProgress)
                : EASE.progress(playback.phaseProgress) * PROGRESS_MAX
        );
        const progressStart = roundProgress(prevEnd == null ? progressEnd : prevEnd);
        return {
            progressStart,
            progressEnd,
            progressRaw,
            progressDelta: roundProgress(progressEnd - progressStart)
        };
    }

    function getPlaybackState(rawElapsed, totalMs, loopMode, playbackCtrl) {
        const pb = playbackCtrl || {};
        const fromP = pb.fromProgress != null ? pb.fromProgress : PROGRESS_MIN;
        const toP = pb.toProgress != null ? pb.toProgress : PROGRESS_MAX;
        const span = Math.max(0.1, toP - fromP);
        const segMs = totalMs * (span / PROGRESS_MAX);

        if (pb.playbackMode === 'paused') {
            const at = pb.atProgress || PROGRESS_MIN;
            return {
                elapsed: totalMs * (at / PROGRESS_MAX),
                direction: 1,
                cycle: 0,
                phaseProgress: at / PROGRESS_MAX,
                segmentPhase: span > 0 ? (at - fromP) / span : 0,
                globalProgress: at,
                fromProgress: fromP,
                toProgress: toP,
                done: false,
                reversePhase: false,
                paused: true
            };
        }

        const segLoop = pb.segmentLoop || (loopMode === 'once' ? 'playOnce' : loopMode);

        if (segLoop === 'playOnce') {
            const elapsed = Math.min(rawElapsed, segMs);
            const segmentPhase = segMs > 0 ? elapsed / segMs : 1;
            const globalProgress = fromP + span * segmentPhase;
            return {
                elapsed: totalMs * (globalProgress / PROGRESS_MAX),
                direction: 1,
                cycle: 0,
                phaseProgress: globalProgress / PROGRESS_MAX,
                segmentPhase,
                globalProgress,
                fromProgress: fromP,
                toProgress: toP,
                done: rawElapsed >= segMs - 16,
                reversePhase: false,
                paused: false
            };
        }

        if (segLoop === 'loop') {
            const cycle = Math.floor(rawElapsed / segMs);
            const inSeg = rawElapsed % segMs;
            const segmentPhase = segMs > 0 ? inSeg / segMs : 0;
            const globalProgress = fromP + span * segmentPhase;
            return {
                elapsed: totalMs * (globalProgress / PROGRESS_MAX),
                direction: 1,
                cycle,
                phaseProgress: globalProgress / PROGRESS_MAX,
                segmentPhase,
                globalProgress,
                fromProgress: fromP,
                toProgress: toP,
                done: false,
                reversePhase: false,
                paused: false
            };
        }

        if (segLoop === 'pingpong') {
            const cycleLen = segMs * 2;
            const cycle = Math.floor(rawElapsed / cycleLen);
            const inCycle = rawElapsed % cycleLen;
            if (inCycle <= segMs) {
                const segmentPhase = segMs > 0 ? inCycle / segMs : 0;
                const globalProgress = fromP + span * segmentPhase;
                return {
                    elapsed: totalMs * (globalProgress / PROGRESS_MAX),
                    direction: 1,
                    cycle,
                    phaseProgress: globalProgress / PROGRESS_MAX,
                    segmentPhase,
                    globalProgress,
                    fromProgress: fromP,
                    toProgress: toP,
                    done: false,
                    reversePhase: false,
                    paused: false
                };
            }
            const back = inCycle - segMs;
            const segmentPhase = segMs > 0 ? 1 - (back / segMs) : 0;
            const globalProgress = fromP + span * segmentPhase;
            return {
                elapsed: totalMs * (globalProgress / PROGRESS_MAX),
                direction: -1,
                cycle,
                phaseProgress: globalProgress / PROGRESS_MAX,
                segmentPhase,
                globalProgress,
                fromProgress: fromP,
                toProgress: toP,
                done: false,
                reversePhase: true,
                paused: false
            };
        }

        const elapsed = Math.min(rawElapsed, totalMs);
        return {
            elapsed,
            direction: 1,
            cycle: 0,
            phaseProgress: elapsed / totalMs,
            segmentPhase: elapsed / totalMs,
            globalProgress: (elapsed / totalMs) * PROGRESS_MAX,
            fromProgress: fromP,
            toProgress: toP,
            done: rawElapsed >= totalMs,
            reversePhase: false,
            paused: false
        };
    }

    function getStepSegment(demo, elapsed) {
        let acc = 0;
        for (let i = 0; i < demo.steps.length; i++) {
            const stepMs = demo.steps[i].ms;
            if (elapsed < acc + stepMs) {
                return {
                    index: i,
                    prevIndex: Math.max(0, i - 1),
                    local: (elapsed - acc) / stepMs
                };
            }
            acc += stepMs;
        }
        const last = demo.steps.length - 1;
        return { index: last, prevIndex: Math.max(0, last - 1), local: 1 };
    }

    function buildOverlay() {
        if (overlayBuilt) return;
        overlayBuilt = true;
        const root = global.document.createElement('div');
        root.id = 'featureDemoOverlay';
        root.className = 'feature-demo-overlay feature-demo-repaint-boundary';
        root.setAttribute('aria-hidden', 'true');
        root.innerHTML = [
            '<div class="feature-demo-spotlight" id="featureDemoSpotlight"></div>',
            '<div class="feature-demo-pointer" id="featureDemoPointer" aria-hidden="true">👆</div>',
            '<div class="feature-demo-panel" role="dialog" aria-modal="true" aria-labelledby="featureDemoTitle">',
            '  <div class="feature-demo-panel-head">',
            '    <div id="featureDemoTitle" class="feature-demo-title"></div>',
            '    <div id="featureDemoTime" class="feature-demo-time"></div>',
            '  </div>',
            '  <div id="featureDemoWelcomeText" class="feature-demo-welcome-text"></div>',
            '  <div id="featureDemoCycle" class="feature-demo-cycle"></div>',
            '  <div id="featureDemoCaption" class="feature-demo-caption"></div>',
            '  <div class="feature-demo-meter-row">',
            '    <div id="featureDemoGauge" class="feature-demo-gauge" role="meter"',
            '      aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Demo progress gauge"></div>',
            '    <div class="feature-demo-meter-copy">',
            '      <div id="featureDemoProgressValue" class="feature-demo-progress-value">0.0</div>',
            '      <div id="featureDemoProgressTrack" class="feature-demo-progress" role="progressbar"',
            '        aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">',
            '        <div id="featureDemoProgressFill" class="feature-demo-progress-fill"></div>',
            '        <div id="featureDemoProgressBar" class="feature-demo-progress-bar"></div>',
            '      </div>',
            '    </div>',
            '  </div>',
            '  <div class="feature-demo-loop-row">',
            '    <span class="feature-demo-loop-label" id="featureDemoLoopLabel"></span>',
            '    <div class="feature-demo-loop-modes" id="featureDemoLoopModes" role="radiogroup"></div>',
            '  </div>',
            '  <div class="feature-demo-playback-row">',
            '    <button type="button" id="featureDemoPlaySegmentBtn" class="feature-demo-playback-btn feature-demo-playback-btn--primary"></button>',
            '    <button type="button" id="featureDemoResetPlaybackBtn" class="feature-demo-playback-btn"></button>',
            '  </div>',
            '  <div id="featureDemoCompleted" class="feature-demo-completed hide"></div>',
            '  <div class="feature-demo-actions">',
            '    <button type="button" id="featureDemoStopBtn" class="feature-demo-btn feature-demo-btn--stop"></button>',
            '    <button type="button" id="featureDemoNeverBtn" class="feature-demo-btn feature-demo-btn--never"></button>',
            '  </div>',
            '</div>'
        ].join('');
        global.document.body.appendChild(root);

        const modesEl = global.document.getElementById('featureDemoLoopModes');
        LOOP_MODES.forEach((mode) => {
            const btn = global.document.createElement('button');
            btn.type = 'button';
            btn.className = 'feature-demo-loop-btn';
            btn.setAttribute('data-loop-mode', mode);
            btn.setAttribute('role', 'radio');
            btn.addEventListener('click', () => {
                setLoopMode(mode);
                toast(bmT('demo.loopModeToast', { mode: bmT('demo.loop.' + mode) }));
            });
            modesEl.appendChild(btn);
        });

        global.document.getElementById('featureDemoStopBtn').addEventListener('click', () => stopFeatureDemo(false));
        global.document.getElementById('featureDemoNeverBtn').addEventListener('click', () => stopFeatureDemo(true));
        global.document.getElementById('featureDemoPlaySegmentBtn').addEventListener('click', () => {
            setFeatureDemoPlaybackMode({ fromProgress: 0.1, toProgress: 0.9, segmentLoop: 'playOnce' });
        });
        global.document.getElementById('featureDemoResetPlaybackBtn').addEventListener('click', () => {
            resetFeatureDemoPlayback();
        });
    }

    function refreshPlaybackControls() {
        const playBtn = global.document.getElementById('featureDemoPlaySegmentBtn');
        const resetBtn = global.document.getElementById('featureDemoResetPlaybackBtn');
        if (playBtn) playBtn.textContent = bmT('demo.playSegment');
        if (resetBtn) resetBtn.textContent = bmT('demo.resetPlayback');
    }

    function refreshLoopModeUi() {
        const label = global.document.getElementById('featureDemoLoopLabel');
        const mode = session ? session.loopMode : getLoopMode();
        if (label) label.textContent = bmT('demo.loopLabel');
        LOOP_MODES.forEach((m) => {
            const btn = global.document.querySelector('.feature-demo-loop-btn[data-loop-mode="' + m + '"]');
            if (!btn) return;
            btn.textContent = bmT('demo.loop.' + m);
            btn.setAttribute('aria-checked', m === mode ? 'true' : 'false');
            btn.classList.toggle('active', m === mode);
        });
    }

    function refreshOverlayLabels() {
        const title = global.document.getElementById('featureDemoTitle');
        const stopBtn = global.document.getElementById('featureDemoStopBtn');
        const neverBtn = global.document.getElementById('featureDemoNeverBtn');
        if (!session) return;
        if (title) title.textContent = bmT(session.demo.titleKey);
        if (stopBtn) stopBtn.textContent = bmT('demo.stop');
        if (neverBtn) neverBtn.textContent = bmT('demo.never');
        refreshLoopModeUi();
        refreshPlaybackControls();
    }

    function showOverlay() {
        buildOverlay();
        refreshOverlayLabels();
        const overlay = global.document.getElementById('featureDemoOverlay');
        if (overlay) {
            overlay.classList.add('open');
            overlay.setAttribute('aria-hidden', 'false');
        }
        global.document.body.classList.add('feature-demo-active');
        dynamicProperties.applyToDom();
    }

    function hideOverlay() {
        const overlay = global.document.getElementById('featureDemoOverlay');
        if (overlay) {
            overlay.classList.remove('open');
            overlay.setAttribute('aria-hidden', 'true');
        }
        global.document.body.classList.remove('feature-demo-active');
    }

    function updateCaption(stepIndex, localT, direction) {
        const caption = global.document.getElementById('featureDemoCaption');
        if (!caption || !session) return;
        const step = session.demo.steps[stepIndex];
        if (!step) return;
        const fadeInStart = direction < 0 ? 1 - MOVE_BLEND_FRACTION : 0;
        const fadeT = Math.min(1, Math.max(0, (localT - fadeInStart) / MOVE_BLEND_FRACTION));
        caption.textContent = bmT(step.messageKey);
        caption.style.opacity = String(EASE.caption(fadeT));
    }

    function renderFrame(now) {
        if (!session) return;
        const demo = session.demo;
        const totalMs = session.totalMs;
        const rawElapsed = now - session.startAt;
        const playback = getPlaybackState(rawElapsed, totalMs, session.loopMode, session.playback);
        if (playback.paused) {
            rafId = null;
            return;
        }
        const seg = getStepSegment(demo, playback.elapsed);
        const moveT = Math.min(1, seg.local / MOVE_BLEND_FRACTION);
        const easedMove = EASE.move(moveT);
        const fromRect = session.stepRects[seg.prevIndex];
        const toRect = session.stepRects[seg.index];
        const rect = interpolateRect(fromRect, toRect, easedMove);

        if (seg.index !== session.lastRenderedStep) {
            session.lastRenderedStep = seg.index;
            const target = global.document.querySelector(demo.steps[seg.index].selector)
                || global.document.querySelector(demo.rootSelector);
            if (target && target.scrollIntoView) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            }
            session.stepRects = buildStepRects(demo);
        }

        const pointerPhase = (now % 1200) / 1200;
        applySpotlightRect(rect, pointerPhase);
        updateCaption(seg.index, seg.local, playback.direction);

        const timeEl = global.document.getElementById('featureDemoTime');
        const cycleEl = global.document.getElementById('featureDemoCycle');
        const prevEnd = session.progress ? session.progress.progressEnd : PROGRESS_MIN;
        const progressState = computeProgressState(playback, prevEnd);
        applyProgressState(progressState, {
            demoId: demo.id,
            loopMode: session.loopMode,
            stateMachineName: session.stateMachine ? session.stateMachine.stateMachineName : ''
        });
        if (timeEl) {
            const sec = Math.max(0, Math.ceil((totalMs - playback.elapsed) / 1000));
            const dirLabel = playback.reversePhase ? bmT('demo.dirBack') : bmT('demo.dirForward');
            timeEl.textContent = bmT('demo.timeLeftDir', { sec, dir: dirLabel });
        }
        if (cycleEl) {
            if (session.loopMode === 'once') {
                cycleEl.textContent = '';
            } else {
                cycleEl.textContent = bmT('demo.cycleLabel', {
                    n: playback.cycle + 1,
                    mode: bmT('demo.loop.' + session.loopMode)
                });
            }
        }

        if (playback.done) {
            finishFeatureDemo(true);
            return;
        }
        rafId = global.requestAnimationFrame(renderFrame);
    }

    function startAnimationLoop() {
        if (rafId) global.cancelAnimationFrame(rafId);
        session.lastRenderedStep = -1;
        rafId = global.requestAnimationFrame(renderFrame);
    }

    function teardown() {
        if (session && session.stateMachine) {
            session.stateMachine.dispose();
            activeStateMachine = null;
        }
        session = null;
        if (rafId) {
            global.cancelAnimationFrame(rafId);
            rafId = null;
        }
        hideOverlay();
    }

    function playFeatureDemo(demoId, manual) {
        if (session || isCoachGuideActive() || isRatingOpen()) return;
        const demo = DEMOS.find(d => d.id === demoId);
        if (!demo) return;
        if (!manual && !shouldAutoShow(demo)) return;
        if (!isDemoRootVisible(demo)) return;

        const loopMode = manual ? getLoopMode() : 'once';
        const stateMachine = new FeatureDemoStateMachine({
            demoId: demo.id,
            stateMachineName: 'bm_onboarding_' + demo.id,
            loopMode
        });
        activeStateMachine = stateMachine;
        const playback = new FeatureDemoPlaybackController();
        playback.playingFromTo(0, 1, loopMode === 'once' ? 'playOnce' : loopMode);
        session = {
            demo,
            manual: !!manual,
            loopMode,
            stateMachine,
            playback,
            finishListeners: [],
            totalMs: getDemoDuration(demo),
            startAt: performance.now(),
            stepRects: buildStepRects(demo),
            lastRenderedStep: -1,
            progress: {
                progressStart: PROGRESS_MIN,
                progressEnd: PROGRESS_MIN,
                progressRaw: PROGRESS_MIN,
                progressDelta: 0
            }
        };

        if (!manual) {
            const rec = readRec(demo.id);
            rec.lastShownAt = Date.now();
            rec.autoShowCount = (rec.autoShowCount || 0) + 1;
            writeRec(demo.id, rec);
            global.localStorage.setItem(GLOBAL_LAST_AUTO_KEY, String(Date.now()));
        }

        showOverlay();
        hideCompletedBanner();
        startAnimationLoop();
        if (manual) toast(bmT('demo.toastManualStart'));
    }

    function stopFeatureDemo(forever) {
        if (!session) return;
        const demoId = session.demo.id;
        const rawElapsed = performance.now() - session.startAt;
        const completed = session.loopMode === 'once' && rawElapsed >= session.totalMs - 400;
        const rec = readRec(demoId);
        if (forever) {
            rec.forever = 1;
            toast(bmT('demo.toastNever'));
        } else if (completed) {
            rec.lastCompletedAt = Date.now();
            toast(bmT('demo.toastComplete'));
        } else {
            rec.lastDismissAt = Date.now();
            toast(bmT('demo.toastStopped'));
        }
        writeRec(demoId, rec);
        teardown();
    }

    function finishFeatureDemo(fromTimer) {
        if (!session) return;
        const rec = readRec(session.demo.id);
        rec.lastCompletedAt = Date.now();
        writeRec(session.demo.id, rec);
        emitAnimationDidFinish(true);
        const seg = session.playback;
        const isPartialSegment = seg
            && (seg.fromProgress > PROGRESS_MIN + 0.5 || seg.toProgress < PROGRESS_MAX - 0.5);
        if (isPartialSegment) {
            seg.pausedAt(seg.toProgress);
            seg.isCompleted = true;
            showCompletedBanner();
            if (fromTimer) toast(bmT('demo.toastComplete'));
            if (rafId) {
                global.cancelAnimationFrame(rafId);
                rafId = null;
            }
            return;
        }
        if (fromTimer) toast(bmT('demo.toastComplete'));
        teardown();
    }

    function scheduleAutoDemo(demo) {
        if (autoTimers[demo.id]) {
            clearTimeout(autoTimers[demo.id]);
            delete autoTimers[demo.id];
        }
        if (session || !shouldAutoShow(demo)) return;
        autoTimers[demo.id] = global.setTimeout(() => {
            delete autoTimers[demo.id];
            playFeatureDemo(demo.id, false);
        }, AUTO_DELAY_MS);
    }

    function injectReplayButtons() {
        DEMOS.forEach((demo) => {
            const root = global.document.querySelector(demo.rootSelector);
            if (!root || root.querySelector('[data-feature-demo-replay="' + demo.id + '"]')) return;
            const btn = global.document.createElement('button');
            btn.type = 'button';
            btn.className = 'feature-demo-replay-btn';
            btn.setAttribute('data-feature-demo-replay', demo.id);
            btn.textContent = bmT('demo.replayBtn');
            btn.addEventListener('click', (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                playFeatureDemo(demo.id, true);
            });
            const header = root.querySelector('.action-cluster-header');
            if (header) {
                header.appendChild(btn);
            } else if (root.classList.contains('free-war-room-card')) {
                const head = root.querySelector('.free-war-room-card-head');
                if (head) head.appendChild(btn);
                else root.insertBefore(btn, root.firstChild);
            } else {
                root.insertBefore(btn, root.firstChild);
            }
        });
    }

    function setupObservers() {
        if (!('IntersectionObserver' in global)) return;
        observers.forEach(o => o.disconnect());
        observers = [];
        DEMOS.forEach((demo) => {
            const root = global.document.querySelector(demo.rootSelector);
            if (!root) return;
            const obs = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting || entry.intersectionRatio < VISIBILITY_RATIO) return;
                    if (getWorkMode() !== demo.mode) return;
                    scheduleAutoDemo(demo);
                });
            }, { threshold: [0.35, 0.5] });
            obs.observe(root);
            observers.push(obs);
        });
    }

    function onWorkModeMaybeChanged() {
        Object.keys(autoTimers).forEach((id) => {
            clearTimeout(autoTimers[id]);
            delete autoTimers[id];
        });
        if (session && getWorkMode() !== session.demo.mode) stopFeatureDemo(false);
    }

    function initFeatureDemos() {
        if (inited) return;
        inited = true;
        injectReplayButtons();
        setupObservers();
        const body = global.document.body;
        if (body && 'MutationObserver' in global) {
            const modeObs = new MutationObserver(() => onWorkModeMaybeChanged());
            modeObs.observe(body, { attributes: true, attributeFilter: ['data-work-mode'] });
        }
        global.addEventListener('resize', () => {
            if (!session) return;
            session.stepRects = buildStepRects(session.demo);
        }, { passive: true });
    }

    function setFeatureDemoProgress(value) {
        if (!session || !session.stateMachine || session.stateMachine.disposed) return PROGRESS_MIN;
        const v = session.stateMachine.setProgressInput(value);
        session.startAt = performance.now() - (v / PROGRESS_MAX) * session.totalMs;
        return v;
    }

    global.startFeatureDemo = playFeatureDemo;
    global.stopFeatureDemo = stopFeatureDemo;
    global.setFeatureDemoLoopMode = setLoopMode;
    global.getFeatureDemoLoopMode = getLoopMode;
    global.getFeatureDemoProgress = function getFeatureDemoProgress() {
        if (session && session.stateMachine) {
            const input = session.stateMachine.getProgressInput();
            const base = session.progress || {};
            return Object.assign({}, base, { progress: input.value });
        }
        if (!session || !session.progress) {
            return {
                progressStart: PROGRESS_MIN,
                progressEnd: PROGRESS_MIN,
                progressRaw: PROGRESS_MIN,
                progressDelta: 0,
                progress: PROGRESS_MIN
            };
        }
        return Object.assign({ progress: session.progress.progressEnd }, session.progress);
    };
    global.setFeatureDemoProgress = setFeatureDemoProgress;
    global.setFeatureDemoDynamicProperty = setFeatureDemoDynamicProperty;
    global.getFeatureDemoDynamicProperties = getFeatureDemoDynamicProperties;
    global.setFeatureDemoPlaybackMode = setFeatureDemoPlaybackMode;
    global.setFeatureDemoColorProvider = setFeatureDemoColorProvider;
    global.resetFeatureDemoPlayback = resetFeatureDemoPlayback;
    global.addFeatureDemoFinishListener = addFeatureDemoFinishListener;
    global.getFeatureDemoPlayback = function getFeatureDemoPlayback() {
        return session && session.playback ? session.playback.toPayload() : null;
    };
    global.FeatureDemoStateMachine = FeatureDemoStateMachine;
    global.FeatureDemoPlaybackController = FeatureDemoPlaybackController;
    global.FeatureDemoDynamicProperties = FeatureDemoDynamicProperties;
    global.FeatureDemoLottieProperty = LOTTIE_PROP;
    global.initFeatureDemos = initFeatureDemos;

    if (global.document.readyState === 'loading') {
        global.document.addEventListener('DOMContentLoaded', () => global.setTimeout(initFeatureDemos, 700));
    } else {
        global.setTimeout(initFeatureDemos, 700);
    }
})(window);
