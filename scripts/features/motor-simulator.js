(function (global) {
    'use strict';

    const MotorState = {
        stop: 'stop',
        forward: 'forward',
        reverse: 'reverse',
        tripped: 'tripped'
    };

    function bmT(key, vars) {
        return (typeof global.BM_T === 'function') ? global.BM_T(key, vars) : key;
    }

    function createMotorSimulator() {
        return {
            motor: MotorState.stop,
            isThermalOverload: false,
            opLogs: []
        };
    }

    const sim = createMotorSimulator();

    function pushLog(key, vars) {
        sim.opLogs.push(bmT(key, vars || {}));
        renderMotorSimulator();
    }

    function pressForwardButton() {
        if (sim.isThermalOverload) {
            pushLog('motor.logThermalTrip');
            return;
        }
        if (sim.motor === MotorState.reverse) {
            pushLog('motor.logInterlockReverse');
            return;
        }
        sim.motor = MotorState.forward;
        pushLog('motor.logForward');
    }

    function pressReverseButton() {
        if (sim.isThermalOverload) {
            pushLog('motor.logThermalTrip');
            return;
        }
        if (sim.motor === MotorState.forward) {
            pushLog('motor.logInterlockForward');
            return;
        }
        sim.motor = MotorState.reverse;
        pushLog('motor.logReverse');
    }

    function pressStopButton() {
        if (sim.motor === MotorState.tripped) {
            pushLog('motor.logStopTripped');
        } else {
            pushLog('motor.logStop');
        }
        sim.motor = MotorState.stop;
        renderMotorSimulator();
    }

    function triggerOverload() {
        sim.isThermalOverload = true;
        sim.motor = MotorState.tripped;
        pushLog('motor.logOverload');
    }

    function resetThermalOverload() {
        if (!sim.isThermalOverload) {
            pushLog('motor.logResetIdle');
            return;
        }
        sim.isThermalOverload = false;
        sim.motor = MotorState.stop;
        pushLog('motor.logResetOk');
    }

    function clearMotorLogs() {
        sim.opLogs = [];
        renderMotorSimulator();
    }

    function exportMotorReport() {
        const lines = [
            bmT('motor.reportTitle'),
            bmT('motor.reportState', { state: motorStateLabel(sim.motor) }),
            bmT('motor.reportThermal', { ok: sim.isThermalOverload ? bmT('motor.thermalTripped') : bmT('motor.thermalNormal') }),
            '--------------------------------------------------'
        ];
        if (!sim.opLogs.length) {
            lines.push(bmT('motor.reportEmpty'));
        } else {
            sim.opLogs.forEach((log) => lines.push(log));
        }
        return lines.join('\n');
    }

    function downloadMotorReport() {
        const text = exportMotorReport();
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const link = global.document.createElement('a');
        link.download = 'motor_control_report.txt';
        link.href = global.URL.createObjectURL(blob);
        link.style.display = 'none';
        global.document.body.appendChild(link);
        link.click();
        global.document.body.removeChild(link);
        global.URL.revokeObjectURL(link.href);
        if (typeof global.showToast === 'function') {
            global.showToast(bmT('motor.toastDownloaded'));
        }
    }

    function motorStateLabel(state) {
        const map = {
            stop: bmT('motor.stateStop'),
            forward: bmT('motor.stateForward'),
            reverse: bmT('motor.stateReverse'),
            tripped: bmT('motor.stateTripped')
        };
        return map[state] || state;
    }

    function getMotorSimulatorStatus() {
        const tripped = sim.isThermalOverload || sim.motor === MotorState.tripped;
        return {
            motor: sim.motor,
            isThermalOverload: sim.isThermalOverload,
            opLogs: sim.opLogs.slice(),
            hasOps: sim.opLogs.length > 0,
            canExportConfig: !tripped
        };
    }

    function isMotorSimulatorExportReady() {
        return getMotorSimulatorStatus().canExportConfig;
    }

    function renderMotorSimulator() {
        const stateEl = global.document.getElementById('motorStateLabel');
        const thermalEl = global.document.getElementById('motorThermalLabel');
        const logEl = global.document.getElementById('motorOpLog');
        const lamp = global.document.getElementById('motorStatusLamp');

        if (stateEl) {
            stateEl.textContent = motorStateLabel(sim.motor);
            stateEl.className = 'motor-state-label motor-state-label--' + sim.motor;
        }
        if (thermalEl) {
            thermalEl.textContent = sim.isThermalOverload
                ? bmT('motor.thermalTripped')
                : bmT('motor.thermalNormal');
            thermalEl.className = 'motor-thermal-label' + (sim.isThermalOverload ? ' motor-thermal-label--tripped' : '');
        }
        if (logEl) {
            logEl.textContent = sim.opLogs.length
                ? sim.opLogs.join('\n')
                : bmT('motor.logEmpty');
        }
        if (lamp) {
            lamp.className = 'motor-status-lamp motor-status-lamp--' + sim.motor;
            lamp.setAttribute('aria-label', motorStateLabel(sim.motor));
        }

        const preview = global.document.getElementById('motorReportPreview');
        if (preview) {
            preview.textContent = exportMotorReport();
        }

        if (typeof global.refreshMepDashboard === 'function') {
            global.refreshMepDashboard();
        }
    }

    function initMotorSimulator() {
        renderMotorSimulator();
    }

    global.pressMotorForward = pressForwardButton;
    global.pressMotorReverse = pressReverseButton;
    global.pressMotorStop = pressStopButton;
    global.triggerMotorOverload = triggerOverload;
    global.resetMotorThermal = resetThermalOverload;
    global.clearMotorLogs = clearMotorLogs;
    global.downloadMotorReport = downloadMotorReport;
    global.exportMotorReport = exportMotorReport;
    global.getMotorSimulatorStatus = getMotorSimulatorStatus;
    global.isMotorSimulatorExportReady = isMotorSimulatorExportReady;
    global.initMotorSimulator = initMotorSimulator;

    if (global.document) {
        if (global.document.readyState === 'loading') {
            global.document.addEventListener('DOMContentLoaded', initMotorSimulator);
        } else {
            initMotorSimulator();
        }
    }
})(typeof window !== 'undefined' ? window : globalThis);
