(function initBuildMasterNativeARBridge(global) {
    'use strict';

    const OPEN_MESSAGE = 'bmOpenAR';
    const PASS_BLUEPRINT_MESSAGE = 'bmPassBlueprint';
    const PASS_USDZ_MESSAGE = 'bmPassUSDZ';
    const CONVERT_MODEL3D_MESSAGE = 'bmConvertModel3D';
    const EXPORT_MESSAGE = 'bmExportARMeasurements';

    function hasNativeHandler(name) {
        try {
            return !!(global.webkit
                && global.webkit.messageHandlers
                && global.webkit.messageHandlers[name]);
        } catch (_e) {
            return false;
        }
    }

    function hasAndroidHandler(name) {
        try {
            return !!(global.BuildMasterNative
                && typeof global.BuildMasterNative[name] === 'function');
        } catch (_e) {
            return false;
        }
    }

    function postNativeMessage(name, payload) {
        const body = payload || {};
        if (hasNativeHandler(name)) {
            global.webkit.messageHandlers[name].postMessage(body);
            return true;
        }
        if (hasAndroidHandler(name)) {
            global.BuildMasterNative[name](JSON.stringify(body));
            return true;
        }
        return false;
    }

    function readNativeARConfig() {
        const cfg = global.__bmNativeARConfig || {};
        return {
            enabled: cfg.enabled === true,
            canOpen: cfg.canOpen === true,
            canConvertUSDZ: cfg.canConvertUSDZ === true || cfg.canOpen === true,
            platform: String(cfg.platform || global.__bmNativePlatform || ''),
            source: String(cfg.source || 'native-shell')
        };
    }

    function readScalePixelsPerUnit() {
        try {
            if (typeof global.scalePixelsPerUnit === 'number' && global.scalePixelsPerUnit > 0) {
                return global.scalePixelsPerUnit;
            }
        } catch (_e) { /* ignore */ }
        return 0;
    }

    function readLayoutAlignmentState() {
        try {
            if (global.layoutAlignmentState && typeof global.layoutAlignmentState === 'object') {
                return global.layoutAlignmentState;
            }
        } catch (_e) { /* ignore */ }
        return null;
    }

    function collectBlueprintPayloadFromPage() {
        const img = global.document && global.document.getElementById('blueprint');
        if (!img || !img.src || String(img.src).indexOf('data:') !== 0) {
            return null;
        }
        const widthPx = Number(img.naturalWidth) || 0;
        const heightPx = Number(img.naturalHeight) || 0;
        if (widthPx < 8 || heightPx < 8) return null;

        const scale = readScalePixelsPerUnit();
        let physicalWidthM = null;
        if (scale > 0) {
            physicalWidthM = widthPx / scale;
        }

        const alignment = readLayoutAlignmentState();
        const payload = {
            dataUrl: String(img.src),
            widthPx: widthPx,
            heightPx: heightPx,
            source: 'web-page2-blueprint'
        };
        if (physicalWidthM && Number.isFinite(physicalWidthM) && physicalWidthM > 0.05) {
            payload.physicalWidthM = physicalWidthM;
        }
        if (alignment) {
            payload.alignment = {
                tx: alignment.tx,
                ty: alignment.ty,
                rotationDeg: alignment.rotationDeg,
                scale: alignment.scale
            };
        }
        return payload;
    }

    function openNativeAR(options) {
        if (global.BuildMasterProAccess && !global.BuildMasterProAccess.guardAR()) {
            return false;
        }
        const payload = Object.assign({ source: 'web-ui' }, options || {});
        if (postNativeMessage(OPEN_MESSAGE, payload)) {
            return true;
        }
        if (typeof global.showToast === 'function') {
            global.showToast(global.BM_T ? global.BM_T('ar.toastComingSoon') : '原生 AR 封測中，請用 TestFlight 或 ARPrototype 實機測試');
        }
        return false;
    }

    function passBlueprintToNativeAR(options) {
        const blueprint = (options && options.blueprint) || collectBlueprintPayloadFromPage();
        if (!blueprint || !blueprint.dataUrl) {
            if (typeof global.showToast === 'function') {
                global.showToast(global.BM_T ? global.BM_T('ar.blueprintMissing') : '請先在第 2 頁上傳圖紙');
            }
            return false;
        }
        const payload = Object.assign({ source: 'web-pass-blueprint' }, options || {}, blueprint);
        if (postNativeMessage(PASS_BLUEPRINT_MESSAGE, payload)) {
            return true;
        }
        if (postNativeMessage(OPEN_MESSAGE, payload)) {
            return true;
        }
        return false;
    }

    function sendBlueprintAndOpenNativeAR(options) {
        if (global.BuildMasterProAccess && !global.BuildMasterProAccess.guardAR()) {
            return false;
        }
        const blueprint = collectBlueprintPayloadFromPage();
        if (!blueprint) {
            return openNativeAR(Object.assign({ source: 'web-open-without-blueprint' }, options || {}));
        }
        const payload = Object.assign({ source: 'web-blueprint-and-open' }, options || {}, blueprint);
        if (postNativeMessage(OPEN_MESSAGE, payload)) {
            return true;
        }
        return passBlueprintToNativeAR({ blueprint: blueprint });
    }

    function passUSDZToNativeAR(options) {
        const usdz = options && options.usdz;
        if (!usdz || !usdz.dataUrl) {
            if (typeof global.showToast === 'function') {
                global.showToast(global.BM_T ? global.BM_T('convert.toastMissingFile') : '請先選擇 USDZ 檔案');
            }
            return false;
        }
        const payload = Object.assign({ kind: 'usdz', source: 'web-pass-usdz' }, options || {}, usdz);
        if (postNativeMessage(PASS_USDZ_MESSAGE, payload)) {
            return true;
        }
        if (postNativeMessage(OPEN_MESSAGE, payload)) {
            return true;
        }
        return false;
    }

    function sendUSDZAndOpenNativeAR(usdzPayload, options) {
        if (global.BuildMasterProAccess && !global.BuildMasterProAccess.guardAR()) {
            return false;
        }
        const payload = Object.assign({ kind: 'usdz', source: 'web-usdz-and-open' }, options || {}, usdzPayload || {});
        if (!payload.dataUrl) {
            if (typeof global.showToast === 'function') {
                global.showToast(global.BM_T ? global.BM_T('convert.toastMissingFile') : '請先選擇 USDZ 檔案');
            }
            return false;
        }
        if (postNativeMessage(PASS_USDZ_MESSAGE, payload)) {
            return true;
        }
        if (postNativeMessage(OPEN_MESSAGE, payload)) {
            return true;
        }
        if (typeof global.showToast === 'function') {
            global.showToast(global.BM_T ? global.BM_T('ar.toastComingSoon') : '原生 AR 封測中');
        }
        return false;
    }

    function convertModel3DAndOpenNativeAR(modelPayload, options) {
        const cfg = readNativeARConfig();
        const convertOnly = cfg.canConvertUSDZ && !cfg.canOpen;
        if (!convertOnly && global.BuildMasterProAccess && !global.BuildMasterProAccess.guardAR()) {
            return false;
        }
        const payload = Object.assign({ source: 'web-convert-model3d' }, options || {}, modelPayload || {});
        if (!payload.dataUrl) {
            if (typeof global.showToast === 'function') {
                global.showToast(global.BM_T ? global.BM_T('convert.toastMissingFile') : '請先選擇 3D 模型');
            }
            return false;
        }
        if (postNativeMessage(CONVERT_MODEL3D_MESSAGE, payload)) {
            return true;
        }
        if (typeof global.showToast === 'function') {
            global.showToast(global.BM_T
                ? global.BM_T(convertOnly ? 'convert.toastNativeConvertOnlyMac' : 'convert.toastNativeConvertOnly')
                : 'App 內轉 USDZ 需 iOS / Mac 原生殼');
        }
        return false;
    }

    function exportNativeARMeasurements() {
        return postNativeMessage(EXPORT_MESSAGE, { action: 'export' });
    }

    function applyNativeARUI() {
        const cfg = readNativeARConfig();
        if (global.document && global.document.body) {
            global.document.body.dataset.nativeAr = cfg.canOpen ? '1' : '0';
        }
        const chip = global.document.getElementById('nativeArChip');
        if (!chip) return;
        if (cfg.canOpen) {
            chip.hidden = false;
            chip.classList.add('native-ar-chip--ready');
            chip.setAttribute('role', 'button');
            chip.tabIndex = 0;
            if (global.BM_T) {
                chip.textContent = global.BM_T('header.chipArReady');
                chip.title = global.BM_T('header.chipArReady');
            }
        } else {
            chip.classList.remove('native-ar-chip--ready');
            chip.removeAttribute('role');
            chip.tabIndex = -1;
        }
    }

    function bindNativeARChip() {
        const chip = global.document.getElementById('nativeArChip');
        if (!chip || chip.dataset.bound === '1') return;
        chip.dataset.bound = '1';
        const activate = function (event) {
            if (event) event.preventDefault();
            sendBlueprintAndOpenNativeAR({ source: chip.dataset.arSource || 'header-chip' });
        };
        chip.addEventListener('click', activate);
        chip.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') activate(event);
        });
    }

    global.BuildMasterNativeAR = {
        readConfig: readNativeARConfig,
        open: openNativeAR,
        collectBlueprint: collectBlueprintPayloadFromPage,
        passBlueprint: passBlueprintToNativeAR,
        openWithBlueprint: sendBlueprintAndOpenNativeAR,
        passUSDZ: passUSDZToNativeAR,
        sendUSDZAndOpen: sendUSDZAndOpenNativeAR,
        convertModel3DAndOpen: convertModel3DAndOpenNativeAR,
        onModel3DConverted: null,
        exportMeasurements: exportNativeARMeasurements,
        refreshUI: function () {
            applyNativeARUI();
            bindNativeARChip();
        }
    };

    global.openNativeAR = openNativeAR;
    global.passBlueprintToNativeAR = passBlueprintToNativeAR;
    global.sendBlueprintAndOpenNativeAR = sendBlueprintAndOpenNativeAR;
    global.passUSDZToNativeAR = passUSDZToNativeAR;
    global.sendUSDZAndOpenNativeAR = sendUSDZAndOpenNativeAR;
    global.convertModel3DAndOpenNativeAR = convertModel3DAndOpenNativeAR;

    if (global.document && global.document.readyState !== 'loading') {
        applyNativeARUI();
        bindNativeARChip();
    } else if (global.document) {
        global.document.addEventListener('DOMContentLoaded', function () {
            applyNativeARUI();
            bindNativeARChip();
        });
    }
})(typeof window !== 'undefined' ? window : globalThis);
