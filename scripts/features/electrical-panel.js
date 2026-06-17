(function (global) {
    'use strict';

    function bmT(key, vars) {
        return (typeof global.BM_T === 'function') ? global.BM_T(key, vars) : key;
    }

    function readRelayStatus() {
        const checked = global.document.querySelector('input[name="mechaRelayStatus"]:checked');
        return checked ? checked.value : 'ON';
    }

    function buildMechaConfigText() {
        const voltage = Number(global.document.getElementById('mechaVoltage')?.value) || 0;
        const current = Number(global.document.getElementById('mechaCurrent')?.value) || 0;
        const mode = String(global.document.getElementById('mechaWorkMode')?.value || 'calc_mode');
        const relay = readRelayStatus();
        const powerOutput = voltage * current;
        const simVerified = typeof global.isElectricalSimulatorVerified === 'function'
            && global.isElectricalSimulatorVerified();
        const lines = [
            '==================================================',
            '   CONSTRUCTION MASTER - 機電硬體控制組態檔案',
            '==================================================',
            '發佈時間：' + new Date().toLocaleString(),
            '系統工作模式：' + mode,
            '實體控制電壓：' + voltage + ' V',
            '實體控制電流：' + current + ' A',
            '自動計算總功率：' + powerOutput + ' W',
            '繼電器開關狀態：' + relay,
            '現場模擬確認：' + (simVerified ? '已通過' : '未確認'),
            '==================================================',
            '[STATUS] 數據封裝完畢。此檔案可直接供本地驅動腳本讀取。'
        ];
        return lines.join('\n');
    }

    function downloadMechaConfigFile() {
        if (typeof global.isElectricalSimulatorVerified === 'function'
            && !global.isElectricalSimulatorVerified()) {
            if (typeof global.showToast === 'function') {
                global.showToast(bmT('sim.electricalNeedVerifyDownload'));
            }
            return;
        }
        const fileContent = buildMechaConfigText();
        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const downloadLink = global.document.createElement('a');
        downloadLink.download = 'mecha_config.txt';
        downloadLink.href = global.URL.createObjectURL(blob);
        downloadLink.style.display = 'none';
        global.document.body.appendChild(downloadLink);
        downloadLink.click();
        global.document.body.removeChild(downloadLink);
        global.URL.revokeObjectURL(downloadLink.href);
        if (typeof global.showToast === 'function') {
            global.showToast(bmT('electrical.toastDownloaded'));
        }
    }

    function updateMechaPowerPreview() {
        const el = global.document.getElementById('mechaPowerPreview');
        if (!el) return;
        const voltage = Number(global.document.getElementById('mechaVoltage')?.value) || 0;
        const current = Number(global.document.getElementById('mechaCurrent')?.value) || 0;
        el.textContent = bmT('electrical.powerPreview', { power: String(voltage * current) });
    }

    function initElectricalPanel() {
        ['mechaVoltage', 'mechaCurrent'].forEach((id) => {
            const input = global.document.getElementById(id);
            if (!input || input.dataset.bound === '1') return;
            input.dataset.bound = '1';
            input.addEventListener('input', updateMechaPowerPreview);
        });
        updateMechaPowerPreview();
        if (typeof global.initElectricalFieldSimulator === 'function') {
            global.initElectricalFieldSimulator();
        }
    }

    global.downloadMechaConfigFile = downloadMechaConfigFile;
    global.initElectricalPanel = initElectricalPanel;

    if (global.document) {
        if (global.document.readyState === 'loading') {
            global.document.addEventListener('DOMContentLoaded', initElectricalPanel);
        } else {
            initElectricalPanel();
        }
    }
})(typeof window !== 'undefined' ? window : globalThis);
