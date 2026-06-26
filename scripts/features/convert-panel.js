(function initBuildMasterConvertPanel(global) {
    'use strict';

    const MAX_MODEL_BYTES = 40 * 1024 * 1024;
    const MODEL3D_EXT = /\.(obj|gltf|glb|dae|stl|usd|usda|usdc)$/i;
    const USDZ_EXT = /\.usdz$/i;

    let selectedFile = null;
    let selectedDataUrl = null;
    let convertPending = false;

    function bmT(key, vars) {
        return (typeof global.BM_T === 'function') ? global.BM_T(key, vars) : key;
    }

    function formatBytes(bytes) {
        if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    function fileKind(name) {
        if (USDZ_EXT.test(name || '')) return 'usdz';
        if (MODEL3D_EXT.test(name || '')) return 'model3d';
        return '';
    }

    function setConvertStatus(text, ok) {
        const box = global.document.getElementById('convertStatusBox');
        if (!box) return;
        box.textContent = text;
        box.dataset.ok = ok ? '1' : '0';
    }

    function setConvertPreview(text) {
        const pre = global.document.getElementById('convertUsdzPreview');
        if (pre) pre.textContent = text;
    }

    function readPhysicalWidthMeters() {
        const input = global.document.getElementById('convertUsdzWidthM');
        const value = Number(input && input.value);
        if (!Number.isFinite(value) || value <= 0.05) return null;
        return value;
    }

    function readPlacementMode() {
        const select = global.document.getElementById('convertUsdzPlacement');
        return select ? String(select.value || 'wall') : 'wall';
    }

    function updateConvertPreview() {
        if (!selectedFile) {
            setConvertPreview(bmT('convert.previewEmpty'));
            return;
        }
        const kind = fileKind(selectedFile.name);
        const lines = [
            bmT('convert.previewFile', { name: selectedFile.name }),
            bmT('convert.previewSize', { size: formatBytes(selectedFile.size) }),
            bmT('convert.previewKind', { kind: kind === 'usdz' ? bmT('convert.kindUsdz') : bmT('convert.kindModel3d') }),
            bmT('convert.previewWidth', { width: readPhysicalWidthMeters() || bmT('convert.previewWidthAuto') }),
            bmT('convert.previewPlacement', { mode: readPlacementMode() })
        ];
        if (kind === 'model3d') {
            lines.push(bmT('convert.previewNativeConvert'));
        }
        setConvertPreview(lines.join('\n'));
    }

    function handleConvertFileInput(event) {
        const file = event && event.target && event.target.files && event.target.files[0];
        selectedFile = null;
        selectedDataUrl = null;
        convertPending = false;
        if (!file) {
            setConvertStatus(bmT('convert.statusIdle'), false);
            updateConvertPreview();
            return;
        }
        const kind = fileKind(file.name);
        if (!kind) {
            setConvertStatus(bmT('convert.errorExt'), false);
            updateConvertPreview();
            return;
        }
        if (file.size > MAX_MODEL_BYTES) {
            setConvertStatus(bmT('convert.errorSize', { max: '40 MB' }), false);
            updateConvertPreview();
            return;
        }
        const reader = new FileReader();
        reader.onload = function () {
            selectedFile = file;
            selectedDataUrl = String(reader.result || '');
            setConvertStatus(bmT('convert.statusReady', { name: file.name }), true);
            updateConvertPreview();
        };
        reader.onerror = function () {
            setConvertStatus(bmT('convert.errorRead'), false);
        };
        reader.readAsDataURL(file);
    }

    function buildModelPayload() {
        if (!selectedFile || !selectedDataUrl) return null;
        const kind = fileKind(selectedFile.name);
        if (!kind) return null;
        const payload = {
            kind: kind,
            dataUrl: selectedDataUrl,
            fileName: selectedFile.name,
            placementMode: readPlacementMode(),
            source: 'web-convert-page'
        };
        const widthM = readPhysicalWidthMeters();
        if (widthM) payload.physicalWidthM = widthM;
        return payload;
    }

    function onModel3DConverted(result) {
        convertPending = false;
        if (result && result.ok) {
            setConvertStatus(bmT('convert.statusConverted', { name: result.detail || '' }), true);
            if (typeof global.showToast === 'function') {
                const cfg = global.BuildMasterNativeAR && typeof global.BuildMasterNativeAR.readConfig === 'function'
                    ? global.BuildMasterNativeAR.readConfig()
                    : {};
                if (cfg.platform === 'mac') {
                    global.showToast(bmT('convert.toastMacUsdzSaved', { name: result.detail || '' }));
                } else {
                    global.showToast(bmT('convert.toastConverted'));
                }
            }
            return;
        }
        const detail = (result && result.detail) ? String(result.detail) : bmT('convert.errorConvert');
        setConvertStatus(detail, false);
        if (typeof global.showToast === 'function') {
            global.showToast(detail);
        }
    }

    function sendConvertAndOpenNativeAR() {
        const payload = buildModelPayload();
        if (!payload) {
            if (typeof global.showToast === 'function') {
                global.showToast(bmT('convert.toastMissingFile'));
            }
            return false;
        }
        if (global.BuildMasterProAccess && !global.BuildMasterProAccess.guardAR()) {
            return false;
        }
        if (payload.kind === 'usdz') {
            if (global.BuildMasterNativeAR && typeof global.BuildMasterNativeAR.sendUSDZAndOpen === 'function') {
                return global.BuildMasterNativeAR.sendUSDZAndOpen(payload);
            }
        } else if (global.BuildMasterNativeAR && typeof global.BuildMasterNativeAR.convertModel3DAndOpen === 'function') {
            convertPending = true;
            setConvertStatus(bmT('convert.statusConverting'), false);
            global.BuildMasterNativeAR.onModel3DConverted = onModel3DConverted;
            return global.BuildMasterNativeAR.convertModel3DAndOpen(payload);
        }
        if (typeof global.showToast === 'function') {
            global.showToast(bmT('ar.toastComingSoon'));
        }
        return false;
    }

    function sendBlueprintFlatAndOpenNativeAR() {
        if (global.BuildMasterProAccess && !global.BuildMasterProAccess.guardAR()) {
            return false;
        }
        const blueprint = global.BuildMasterNativeAR && typeof global.BuildMasterNativeAR.collectBlueprint === 'function'
            ? global.BuildMasterNativeAR.collectBlueprint()
            : null;
        if (!blueprint || !blueprint.dataUrl) {
            if (typeof global.showToast === 'function') {
                global.showToast(bmT('ar.blueprintMissing'));
            }
            return false;
        }
        const payload = {
            kind: 'blueprintFlat',
            dataUrl: blueprint.dataUrl,
            fileName: 'blueprint-flat.png',
            placementMode: readPlacementMode(),
            source: 'web-blueprint-flat',
            physicalWidthM: blueprint.physicalWidthM || readPhysicalWidthMeters()
        };
        if (global.BuildMasterNativeAR && typeof global.BuildMasterNativeAR.convertModel3DAndOpen === 'function') {
            convertPending = true;
            setConvertStatus(bmT('convert.statusConvertingBlueprint'), false);
            global.BuildMasterNativeAR.onModel3DConverted = onModel3DConverted;
            return global.BuildMasterNativeAR.convertModel3DAndOpen(payload);
        }
        if (typeof global.showToast === 'function') {
            global.showToast(bmT('ar.toastComingSoon'));
        }
        return false;
    }

    function initConvertPanel() {
        const input = global.document.getElementById('convertUsdzInput');
        if (input && input.dataset.bound !== '1') {
            input.dataset.bound = '1';
            input.addEventListener('change', handleConvertFileInput);
        }
        updateConvertPreview();
    }

    global.initConvertPanel = initConvertPanel;
    global.sendUsdzAndOpenNativeAR = sendConvertAndOpenNativeAR;
    global.sendConvertAndOpenNativeAR = sendConvertAndOpenNativeAR;
    global.sendBlueprintFlatAndOpenNativeAR = sendBlueprintFlatAndOpenNativeAR;
    global.handleConvertUsdzInput = handleConvertFileInput;

    if (global.document && global.document.readyState !== 'loading') {
        initConvertPanel();
    } else if (global.document) {
        global.document.addEventListener('DOMContentLoaded', initConvertPanel);
    }
})(typeof window !== 'undefined' ? window : globalThis);
