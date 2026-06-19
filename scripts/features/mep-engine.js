(function (global) {
    'use strict';

    const WIRE_TABLE = [
        { mm2: 1.6, amp: 15 },
        { mm2: 2.0, amp: 20 },
        { mm2: 3.5, amp: 28 },
        { mm2: 5.5, amp: 37 },
        { mm2: 8.0, amp: 49 },
        { mm2: 14, amp: 66 },
        { mm2: 22, amp: 88 },
        { mm2: 38, amp: 118 },
        { mm2: 60, amp: 150 }
    ];

    const BREAKER_STEPS = [15, 20, 30, 40, 50, 60, 75, 100, 125, 160, 200, 250, 315, 400];

    function bmT(key, vars) {
        return (typeof global.BM_T === 'function') ? global.BM_T(key, vars) : key;
    }

    function readPhaseFactor() {
        const phase = global.document.getElementById('mechaPhase')?.value || 'single';
        return phase === 'three' ? Math.sqrt(3) : 1;
    }

    function readMepCalcInputs() {
        const loadKw = Number(global.document.getElementById('mepLoadKw')?.value) || 0;
        const pf = Number(global.document.getElementById('mepPowerFactor')?.value) || 0.85;
        const lengthM = Number(global.document.getElementById('mepCableLength')?.value) || 0;
        const voltage = Number(global.document.getElementById('mechaVoltage')?.value) || 220;
        const phase = global.document.getElementById('mechaPhase')?.value || 'single';
        const pfSafe = Math.max(0.5, Math.min(pf, 1));
        return { loadKw, pf: pfSafe, lengthM, voltage, phase };
    }

    function calcLoadCurrent(loadKw, voltage, phase, pf) {
        if (loadKw <= 0 || voltage <= 0 || pf <= 0) return 0;
        if (phase === 'three') {
            return (loadKw * 1000) / (Math.sqrt(3) * voltage * pf);
        }
        return (loadKw * 1000) / (voltage * pf);
    }

    function suggestWireSize(currentA) {
        if (currentA <= 0) return null;
        const required = currentA * 1.25;
        for (let i = 0; i < WIRE_TABLE.length; i += 1) {
            if (WIRE_TABLE[i].amp >= required) return WIRE_TABLE[i];
        }
        return WIRE_TABLE[WIRE_TABLE.length - 1];
    }

    function suggestBreaker(currentA) {
        if (currentA <= 0) return null;
        const required = currentA * 1.25;
        for (let i = 0; i < BREAKER_STEPS.length; i += 1) {
            if (BREAKER_STEPS[i] >= required) return BREAKER_STEPS[i];
        }
        return BREAKER_STEPS[BREAKER_STEPS.length - 1];
    }

    function calcVoltageDropPct(currentA, lengthM, wireMm2, voltage, phase) {
        if (currentA <= 0 || lengthM <= 0 || wireMm2 <= 0 || voltage <= 0) return 0;
        const rho = 0.0175;
        const factor = phase === 'three' ? Math.sqrt(3) : 2;
        const dropV = (factor * currentA * lengthM * rho) / wireMm2;
        return (dropV / voltage) * 100;
    }

    function formatNum(n, digits) {
        if (!Number.isFinite(n)) return '—';
        return String(Math.round(n * Math.pow(10, digits)) / Math.pow(10, digits));
    }

    function setResult(id, text, level) {
        const node = global.document.getElementById(id);
        if (!node) return;
        node.textContent = text;
        node.classList.remove('mep-calc-result--ok', 'mep-calc-result--warn', 'mep-calc-result--bad');
        if (level) node.classList.add('mep-calc-result--' + level);
    }

    function refreshMepEngine() {
        const input = readMepCalcInputs();
        const currentA = calcLoadCurrent(input.loadKw, input.voltage, input.phase, input.pf);
        const wire = suggestWireSize(currentA);
        const breaker = suggestBreaker(currentA);
        const dropPct = wire
            ? calcVoltageDropPct(currentA, input.lengthM, wire.mm2, input.voltage, input.phase)
            : 0;

        setResult('mepCalcCurrent', currentA > 0
            ? bmT('mep.calcCurrentValue', { value: formatNum(currentA, 1) })
            : '—', currentA > 0 ? 'ok' : '');

        if (wire) {
            setResult('mepCalcWire', bmT('mep.calcWireValue', {
                mm2: formatNum(wire.mm2, 1),
                amp: String(wire.amp)
            }), 'ok');
        } else {
            setResult('mepCalcWire', '—');
        }

        if (breaker) {
            setResult('mepCalcBreaker', bmT('mep.calcBreakerValue', { value: String(breaker) }), 'ok');
        } else {
            setResult('mepCalcBreaker', '—');
        }

        let dropLevel = '';
        if (dropPct > 0) {
            if (dropPct <= 3) dropLevel = 'ok';
            else if (dropPct <= 5) dropLevel = 'warn';
            else dropLevel = 'bad';
        }
        setResult('mepCalcVdrop', dropPct > 0
            ? bmT('mep.calcVdropValue', { pct: formatNum(dropPct, 2) })
            : '—', dropLevel);

        const note = global.document.getElementById('mepCalcNote');
        if (note) {
            if (input.loadKw <= 0) {
                note.textContent = bmT('mep.calcNoteIdle');
            } else if (dropPct > 5) {
                note.textContent = bmT('mep.calcNoteHighDrop');
            } else if (currentA > 0 && wire && currentA * 1.25 > wire.amp) {
                note.textContent = bmT('mep.calcNoteOverload');
            } else {
                note.textContent = bmT('mep.calcNoteOk');
            }
        }
    }

    function bindMepCalcField(id) {
        const el = global.document.getElementById(id);
        if (!el || el.dataset.mepBound === '1') return;
        el.dataset.mepBound = '1';
        el.addEventListener('input', refreshMepEngine);
        el.addEventListener('change', refreshMepEngine);
    }

    function initMepEngine() {
        bindMepCalcField('mepLoadKw');
        bindMepCalcField('mepPowerFactor');
        bindMepCalcField('mepCableLength');
        bindMepCalcField('mechaVoltage');
        bindMepCalcField('mechaPhase');
        refreshMepEngine();
    }

    global.initMepEngine = initMepEngine;
    global.refreshMepEngine = refreshMepEngine;

    if (global.document) {
        if (global.document.readyState === 'loading') {
            global.document.addEventListener('DOMContentLoaded', initMepEngine);
        } else {
            initMepEngine();
        }
    }
})(typeof window !== 'undefined' ? window : globalThis);
