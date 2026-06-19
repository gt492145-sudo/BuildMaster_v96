(function (global) {
    'use strict';

    const STORAGE_PREFIX = 'bm_mep_v97_';

    function bmT(key, vars) {
        return (typeof global.BM_T === 'function') ? global.BM_T(key, vars) : key;
    }

    function readRelayStatus() {
        const checked = global.document.querySelector('input[name="mechaRelayStatus"]:checked');
        return checked ? checked.value : 'ON';
    }

    function readMechaParams() {
        const voltage = Number(global.document.getElementById('mechaVoltage')?.value) || 0;
        const current = Number(global.document.getElementById('mechaCurrent')?.value) || 0;
        const mode = String(global.document.getElementById('mechaWorkMode')?.value || 'calc_mode');
        const relay = readRelayStatus();
        const subsystem = String(global.document.getElementById('mechaSubsystem')?.value || 'power');
        const phase = String(global.document.getElementById('mechaPhase')?.value || 'single');
        const frequency = String(global.document.getElementById('mechaFrequency')?.value || '60');
        const factor = phase === 'three' ? Math.sqrt(3) : 1;
        const powerOutput = Math.round(voltage * current * factor);
        const simVerified = typeof global.isElectricalSimulatorVerified === 'function'
            && global.isElectricalSimulatorVerified();
        return {
            voltage,
            current,
            mode,
            relay,
            subsystem,
            phase,
            frequency,
            powerOutput,
            simVerified
        };
    }

    function subsystemLabel(value) {
        const map = {
            power: bmT('electrical.subsystemPower'),
            hvac: bmT('electrical.subsystemHvac'),
            plumbing: bmT('electrical.subsystemPlumbing'),
            controls: bmT('electrical.subsystemControls')
        };
        return map[value] || value;
    }

    function readElectricalSimProgress() {
        if (typeof global.getElectricalSimulatorProgress !== 'function') {
            return { hasPhoto: false, probeSet: false, measured: false, relayTested: false, verified: false };
        }
        return global.getElectricalSimulatorProgress();
    }

    function computeAlignScore(params, sim) {
        let score = 0;
        if (params.voltage >= 90 && params.voltage <= 440 && params.current > 0) score += 25;
        if (sim.hasPhoto) score += 25;
        if (sim.probeSet && sim.measured && sim.relayTested) score += 25;
        if (sim.verified) score += 25;
        return score;
    }

    function readMotorSimulatorBlock() {
        if (typeof global.getMotorSimulatorStatus !== 'function') {
            return {
                canExportConfig: true,
                motorLabel: bmT('motor.stateStop'),
                thermalLabel: bmT('motor.thermalNormal'),
                logs: []
            };
        }
        const motor = global.getMotorSimulatorStatus();
        const motorLabel = typeof global.exportMotorReport === 'function'
            ? (motor.motor === 'forward' ? bmT('motor.stateForward')
                : motor.motor === 'reverse' ? bmT('motor.stateReverse')
                    : motor.motor === 'tripped' ? bmT('motor.stateTripped')
                        : bmT('motor.stateStop'))
            : bmT('motor.stateStop');
        return {
            canExportConfig: motor.canExportConfig,
            motorLabel,
            thermalLabel: motor.isThermalOverload ? bmT('motor.thermalTripped') : bmT('motor.thermalNormal'),
            logs: motor.opLogs || []
        };
    }

    function buildMechaConfigText() {
        const p = readMechaParams();
        const sim = readElectricalSimProgress();
        const motorBlock = readMotorSimulatorBlock();
        const alignScore = computeAlignScore(p, sim);
        const phaseLabel = p.phase === 'three' ? bmT('electrical.phaseThree') : bmT('electrical.phaseSingle');
        const lines = [
            '==================================================',
            '   CONSTRUCTION MASTER - MEP 機電控制組態 V9.7',
            '==================================================',
            '發佈時間：' + new Date().toLocaleString(),
            'App 版本：9.7',
            '虛實對齊度：' + alignScore + '%',
            'MEP 子系統：' + subsystemLabel(p.subsystem),
            '相序：' + phaseLabel,
            '頻率：' + p.frequency + ' Hz',
            '系統工作模式：' + p.mode,
            '實體控制電壓：' + p.voltage + ' V',
            '實體控制電流：' + p.current + ' A',
            '自動計算總功率：' + p.powerOutput + ' W',
            '繼電器開關狀態：' + p.relay,
            '現場模擬確認：' + (p.simVerified ? '已通過' : '未確認'),
            '馬達演練狀態：' + motorBlock.motorLabel,
            '積熱電驛 TH-RY：' + motorBlock.thermalLabel,
            '--------------------------------------------------',
            bmT('motor.configSectionTitle')
        ];
        if (motorBlock.logs.length) {
            motorBlock.logs.forEach((log) => lines.push(log));
        } else {
            lines.push(bmT('motor.reportEmpty'));
        }
        lines.push(
            '==================================================',
            '[STATUS] 數據封裝完畢。此檔案可直接供本地 motor.py 或測試腳本讀取。'
        );
        return lines.join('\n');
    }

    function downloadMechaConfigFile() {
        if (typeof global.isElectricalSimulatorVerified === 'function'
            && !global.isElectricalSimulatorVerified()) {
            if (typeof global.showToast === 'function') {
                global.showToast(bmT('sim.electricalNeedVerifyDownload'));
            }
            refreshMepDashboard();
            return;
        }
        if (typeof global.isMotorSimulatorExportReady === 'function'
            && !global.isMotorSimulatorExportReady()) {
            if (typeof global.showToast === 'function') {
                global.showToast(bmT('motor.needResetDownload'));
            }
            refreshMepDashboard();
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
        refreshMepDashboard();
    }

    function updateMechaPowerPreview() {
        const el = global.document.getElementById('mechaPowerPreview');
        if (!el) return;
        const p = readMechaParams();
        const suffix = p.phase === 'three' ? bmT('electrical.powerThreePhase') : '';
        el.textContent = bmT('electrical.powerPreview', { power: String(p.powerOutput) }) + suffix;
    }

    function setPipelineStepDone(stepId, done) {
        const el = global.document.getElementById(stepId);
        if (!el) return;
        el.classList.toggle('mep-pipeline-step--done', !!done);
    }

    function setPipelineStepActive(stepId, active) {
        const el = global.document.getElementById(stepId);
        if (!el) return;
        el.classList.toggle('mep-pipeline-step--active', !!active);
    }

    function refreshMepDashboard() {
        const p = readMechaParams();
        const sim = readElectricalSimProgress();
        const score = computeAlignScore(p, sim);

        const scoreLabel = global.document.getElementById('mepAlignScoreLabel');
        if (scoreLabel) {
            scoreLabel.textContent = bmT('electrical.alignScore', { score: String(score) });
        }
        const bar = global.document.getElementById('mepAlignBar');
        const fill = global.document.getElementById('mepAlignBarFill');
        if (bar) {
            bar.setAttribute('aria-valuenow', String(score));
        }
        if (fill) {
            fill.style.width = score + '%';
        }

        const paramsOk = p.voltage >= 90 && p.voltage <= 440 && p.current > 0;
        const motorReady = typeof global.isMotorSimulatorExportReady !== 'function'
            || global.isMotorSimulatorExportReady();
        const exportReady = p.simVerified && motorReady;

        setPipelineStepDone('mepStepParams', paramsOk);
        setPipelineStepDone('mepStepPhoto', sim.hasPhoto);
        setPipelineStepDone('mepStepSimulate', sim.probeSet && sim.measured && sim.relayTested);
        setPipelineStepDone('mepStepExport', exportReady);

        ['mepStepParams', 'mepStepPhoto', 'mepStepSimulate', 'mepStepExport'].forEach((id) => {
            setPipelineStepActive(id, false);
        });
        if (!paramsOk) setPipelineStepActive('mepStepParams', true);
        else if (!sim.hasPhoto) setPipelineStepActive('mepStepPhoto', true);
        else if (!(sim.probeSet && sim.measured && sim.relayTested)) setPipelineStepActive('mepStepSimulate', true);
        else if (!exportReady) setPipelineStepActive('mepStepExport', true);

        const setText = (id, text) => {
            const node = global.document.getElementById(id);
            if (node) node.textContent = text;
        };
        setText('mepLiveVoltage', String(p.voltage));
        setText('mepLiveCurrent', String(p.current));
        setText('mepLivePower', String(p.powerOutput));
        setText('mepLiveRelay', p.relay);
        setText('mepLiveSubsystem', subsystemLabel(p.subsystem));

        const preview = global.document.getElementById('mechaConfigPreview');
        if (preview) {
            preview.textContent = buildMechaConfigText();
        }

        const downloadBtn = global.document.getElementById('mechaDownloadBtn');
        if (downloadBtn) {
            downloadBtn.disabled = !exportReady;
            downloadBtn.classList.toggle('electrical-download-btn--locked', !exportReady);
            if (!motorReady) {
                downloadBtn.title = bmT('motor.needResetDownload');
            } else if (!p.simVerified) {
                downloadBtn.title = bmT('sim.electricalNeedVerifyDownload');
            } else {
                downloadBtn.title = '';
            }
        }
    }

    function persistMechaField(id, key) {
        const el = global.document.getElementById(id);
        if (!el) return;
        const storageKey = STORAGE_PREFIX + key;
        const saved = global.localStorage.getItem(storageKey);
        if (saved != null && saved !== '') {
            el.value = saved;
        }
        if (el.dataset.bound === '1') return;
        el.dataset.bound = '1';
        el.addEventListener('change', () => {
            global.localStorage.setItem(storageKey, el.value);
            updateMechaPowerPreview();
            refreshMepDashboard();
            if (typeof global.refreshMepEngine === 'function') global.refreshMepEngine();
        });
        el.addEventListener('input', () => {
            updateMechaPowerPreview();
            refreshMepDashboard();
            if (typeof global.refreshMepEngine === 'function') global.refreshMepEngine();
        });
    }

    function initElectricalPanel() {
        ['mechaVoltage', 'mechaCurrent'].forEach((id) => {
            const input = global.document.getElementById(id);
            if (!input || input.dataset.bound === '1') return;
            input.dataset.bound = '1';
            const storageKey = STORAGE_PREFIX + id;
            const saved = global.localStorage.getItem(storageKey);
            if (saved != null && saved !== '') input.value = saved;
            input.addEventListener('input', () => {
                global.localStorage.setItem(storageKey, input.value);
                updateMechaPowerPreview();
                refreshMepDashboard();
            });
        });

        persistMechaField('mechaWorkMode', 'mechaWorkMode');
        persistMechaField('mechaSubsystem', 'mechaSubsystem');
        persistMechaField('mechaPhase', 'mechaPhase');
        persistMechaField('mechaFrequency', 'mechaFrequency');

        global.document.querySelectorAll('input[name="mechaRelayStatus"]').forEach((radio) => {
            if (radio.dataset.bound === '1') return;
            radio.dataset.bound = '1';
            radio.addEventListener('change', refreshMepDashboard);
        });

        updateMechaPowerPreview();
        refreshMepDashboard();

        if (typeof global.initElectricalFieldSimulator === 'function') {
            global.initElectricalFieldSimulator();
        }
        refreshMepDashboard();
    }

    global.buildMechaConfigText = buildMechaConfigText;
    global.refreshMepDashboard = refreshMepDashboard;
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
