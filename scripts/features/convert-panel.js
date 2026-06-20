(function initBuildMasterConvertPanel(global) {
    'use strict';

    const MAX_USDZ_BYTES = 40 * 1024 * 1024;
    let selectedUsdzFile = null;
    let selectedUsdzDataUrl = null;

    function bmT(key, vars) {
        return (typeof global.BM_T === 'function') ? global.BM_T(key, vars) : key;
    }

    function formatBytes(bytes) {
        if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
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
        if (!selectedUsdzFile) {
            setConvertPreview(bmT('convert.previewEmpty'));
            return;
        }
        const lines = [
            bmT('convert.previewFile', { name: selectedUsdzFile.name }),
            bmT('convert.previewSize', { size: formatBytes(selectedUsdzFile.size) }),
            bmT('convert.previewWidth', { width: readPhysicalWidthMeters() || bmT('convert.previewWidthAuto') }),
            bmT('convert.previewPlacement', { mode: readPlacementMode() })
        ];
        setConvertPreview(lines.join('\n'));
    }

    function handleUsdzFileInput(event) {
        const file = event && event.target && event.target.files && event.target.files[0];
        selectedUsdzFile = null;
        selectedUsdzDataUrl = null;
        if (!file) {
            setConvertStatus(bmT('convert.statusIdle'), false);
            updateConvertPreview();
            return;
        }
        if (!/\.usdz$/i.test(file.name)) {
            setConvertStatus(bmT('convert.errorExt'), false);
            updateConvertPreview();
            return;
        }
        if (file.size > MAX_USDZ_BYTES) {
            setConvertStatus(bmT('convert.errorSize', { max: '40 MB' }), false);
            updateConvertPreview();
            return;
        }
        const reader = new FileReader();
        reader.onload = function () {
            selectedUsdzFile = file;
            selectedUsdzDataUrl = String(reader.result || '');
            setConvertStatus(bmT('convert.statusReady', { name: file.name }), true);
            updateConvertPreview();
        };
        reader.onerror = function () {
            setConvertStatus(bmT('convert.errorRead'), false);
        };
        reader.readAsDataURL(file);
    }

    function buildUsdzPayload() {
        if (!selectedUsdzFile || !selectedUsdzDataUrl) return null;
        const payload = {
            kind: 'usdz',
            dataUrl: selectedUsdzDataUrl,
            fileName: selectedUsdzFile.name,
            placementMode: readPlacementMode(),
            source: 'web-convert-page'
        };
        const widthM = readPhysicalWidthMeters();
        if (widthM) payload.physicalWidthM = widthM;
        return payload;
    }

    function sendUsdzAndOpenNativeAR() {
        const payload = buildUsdzPayload();
        if (!payload) {
            if (typeof global.showToast === 'function') {
                global.showToast(bmT('convert.toastMissingFile'));
            }
            return false;
        }
        if (global.BuildMasterNativeAR && typeof global.BuildMasterNativeAR.sendUSDZAndOpen === 'function') {
            return global.BuildMasterNativeAR.sendUSDZAndOpen(payload);
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
            input.addEventListener('change', handleUsdzFileInput);
        }
        updateConvertPreview();
    }

    global.initConvertPanel = initConvertPanel;
    global.sendUsdzAndOpenNativeAR = sendUsdzAndOpenNativeAR;
    global.handleConvertUsdzInput = handleUsdzFileInput;

    if (global.document && global.document.readyState !== 'loading') {
        initConvertPanel();
    } else if (global.document) {
        global.document.addEventListener('DOMContentLoaded', initConvertPanel);
    }
})(typeof window !== 'undefined' ? window : globalThis);
