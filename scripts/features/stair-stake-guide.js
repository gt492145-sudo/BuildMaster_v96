(function (global) {
    'use strict';

    const STAIR_STORAGE_KEY = 'bm_stair_stake_drawing_v1';
    const PROJECT_STORAGE_PREFIX = 'bm_stake_project_points_v1:';

    const stairState = {
        enabled: false,
        drawingType: 'plan',
        projectName: '',
        pointSource: '',
        points: [],
        corrections: [],
        pointRecords: {}
    };

    function bmT(key, vars) {
        return (typeof global.BM_T === 'function') ? global.BM_T(key, vars) : key;
    }

    function toast(msg) {
        if (typeof global.showToast === 'function') global.showToast(msg);
    }

    function readProjectName() {
        return String(global.document.getElementById('stakeProjectName')?.value || '').trim();
    }

    function projectStorageKey(name) {
        const slug = (name || 'default').replace(/[^\w\u4e00-\u9fff-]+/g, '_').slice(0, 48);
        return PROJECT_STORAGE_PREFIX + slug;
    }

    function persistProjectBundle() {
        const name = readProjectName() || stairState.projectName || 'default';
        stairState.projectName = name;
        try {
            global.localStorage.setItem(projectStorageKey(name), JSON.stringify({
                projectName: name,
                drawingType: stairState.drawingType,
                pointSource: stairState.pointSource,
                points: stairState.points
            }));
        } catch (_e) {}
    }

    function loadProjectBundle(name) {
        try {
            const raw = global.localStorage.getItem(projectStorageKey(name));
            if (!raw) return false;
            const data = JSON.parse(raw);
            if (!Array.isArray(data.points) || !data.points.length) return false;
            applyStakePoints(data.points, data.pointSource || 'saved', {
                projectName: data.projectName || name,
                drawingType: data.drawingType,
                silent: true
            });
            return true;
        } catch (_e) {
            return false;
        }
    }

    function normalizePoint(row, index) {
        const id = String(row.id || row.pointId || ('P' + (index + 1))).trim();
        const x = Number(row.x);
        const y = Number(row.y);
        if (!id || !Number.isFinite(x) || !Number.isFinite(y)) return null;
        return {
            id,
            x,
            y,
            label: String(row.label || row.name || id).trim(),
            pointType: String(row.type || row.pointType || 'layout').trim(),
            source: row.source || 'custom'
        };
    }

    function parseStakePointsCsv(text) {
        const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (!lines.length) return [];
        const splitLine = (line) => (line.includes('\t') ? line.split('\t') : line.split(','));
        let start = 0;
        const firstCells = splitLine(lines[0]).map((c) => c.trim().toLowerCase());
        if (firstCells.includes('x') && (firstCells.includes('y') || firstCells.includes('id'))) {
            start = 1;
        }
        const points = [];
        for (let i = start; i < lines.length; i += 1) {
            const cells = splitLine(lines[i]).map((c) => c.trim());
            if (cells.length < 3) continue;
            const row = cells.length >= 4
                ? { id: cells[0], x: cells[1], y: cells[2], label: cells[3], type: cells[4] || 'layout' }
                : { x: cells[0], y: cells[1], label: cells[2] || ('P' + (points.length + 1)) };
            const point = normalizePoint(row, points.length);
            if (point) points.push(point);
        }
        return points;
    }

    function applyStakePoints(points, source, options) {
        const opts = options || {};
        if (!points.length) return toast(bmT('stair.needPoints'));
        stairState.points = points.map((p, i) => normalizePoint(p, i)).filter(Boolean);
        if (!stairState.points.length) return toast(bmT('stair.csvInvalid'));
        stairState.enabled = true;
        stairState.pointSource = source || 'custom';
        stairState.corrections = [];
        stairState.pointRecords = {};
        if (opts.projectName) stairState.projectName = opts.projectName;
        else stairState.projectName = readProjectName() || bmT('stair.projectDefault');
        if (opts.drawingType === 'elevation' || opts.drawingType === 'plan') {
            stairState.drawingType = opts.drawingType;
        } else {
            stairState.drawingType = readDrawingType();
        }
        global.bimLayoutPoints = stairState.points.slice();
        persistDrawingType(stairState.drawingType);
        syncDrawingTypeUi();
        persistProjectBundle();
        updateStakePointsPreview();
        if (!opts.silent && typeof global.resetStakeFieldOperation === 'function') {
            global.resetStakeFieldOperation();
        }
        if (typeof global.redrawStakeFieldSimulator === 'function') {
            global.redrawStakeFieldSimulator();
        }
        if (!opts.silent) {
            toast(bmT('stair.toastApplied', {
                count: String(stairState.points.length),
                project: stairState.projectName
            }));
        }
    }

    function planStairPoints() {
        return [
            { id: 'ST-P1', x: 1.0, y: 1.0, label: bmT('stair.ptPlanStart'), pointType: 'landing' },
            { id: 'ST-P2', x: 2.2, y: 1.35, label: bmT('stair.ptPlanTread3'), pointType: 'tread' },
            { id: 'ST-P3', x: 3.6, y: 1.85, label: bmT('stair.ptPlanTread6'), pointType: 'tread' },
            { id: 'ST-P4', x: 4.8, y: 2.35, label: bmT('stair.ptPlanMidLanding'), pointType: 'landing' },
            { id: 'ST-P5', x: 5.4, y: 2.85, label: bmT('stair.ptPlanDirCheck'), pointType: 'direction' },
            { id: 'ST-P6', x: 6.8, y: 3.55, label: bmT('stair.ptPlanTread12'), pointType: 'tread' },
            { id: 'ST-P7', x: 8.0, y: 4.1, label: bmT('stair.ptPlanTop'), pointType: 'landing' }
        ];
    }

    function elevationStairPoints() {
        return [
            { id: 'ST-E1', x: 1.0, y: 0.0, label: bmT('stair.ptElevL1'), pointType: 'floor' },
            { id: 'ST-E2', x: 2.4, y: 0.6, label: bmT('stair.ptElevTread3'), pointType: 'tread' },
            { id: 'ST-E3', x: 3.8, y: 1.2, label: bmT('stair.ptElevTread6'), pointType: 'tread' },
            { id: 'ST-E4', x: 5.0, y: 1.8, label: bmT('stair.ptElevMid'), pointType: 'landing' },
            { id: 'ST-E5', x: 6.2, y: 2.4, label: bmT('stair.ptElevTread10'), pointType: 'tread' },
            { id: 'ST-E6', x: 7.5, y: 3.0, label: bmT('stair.ptElevL2'), pointType: 'floor' },
            { id: 'ST-E7', x: 4.0, y: 2.0, label: bmT('stair.ptElevHandrail'), pointType: 'handrail' }
        ];
    }

    function loadStakeSampleC2Plan() {
        const projectInput = global.document.getElementById('stakeProjectName');
        if (projectInput) projectInput.value = 'D棟 C2特別安全梯';
        const typeEl = global.document.getElementById('stairDrawingType');
        if (typeEl) typeEl.value = 'plan';
        const points = [
            { id: 'P1', x: 0, y: 0, label: 'C2下口平台角', pointType: 'landing' },
            { id: 'P2', x: 84, y: 0, label: '第一跑第4踏', pointType: 'tread' },
            { id: 'P3', x: 168, y: 0, label: '第一跑第7踏/转向', pointType: 'tread' },
            { id: 'P4', x: 168, y: 60, label: '中间平台中点', pointType: 'landing' },
            { id: 'P5', x: 120, y: 120, label: '第二跑第3踏', pointType: 'tread' },
            { id: 'P6', x: 60, y: 120, label: '第二跑第5踏', pointType: 'tread' },
            { id: 'P7', x: 0, y: 120, label: 'C2上口平台角', pointType: 'landing' },
            { id: 'P8', x: 0, y: 60, label: '上行方向校验', pointType: 'direction' }
        ];
        applyStakePoints(points, 'sample-c2', { drawingType: 'plan', projectName: 'D棟 C2特別安全梯' });
        toast(bmT('stair.toastC2Sample'));
    }

    function loadStairStakeDemoPoints() {
        const type = readDrawingType();
        const points = (type === 'elevation' ? elevationStairPoints() : planStairPoints()).map((p) => ({
            ...p,
            source: 'demo-' + type
        }));
        applyStakePoints(points, 'demo', { drawingType: type });
        toast(bmT('stair.toastDemo'));
    }

    function loadStairStakePoints() {
        loadStairStakeDemoPoints();
    }

    function useBimLayoutPointsForStakeGuide() {
        let points = [];
        if (Array.isArray(global.bimLayoutPoints) && global.bimLayoutPoints.length) {
            points = global.bimLayoutPoints.slice();
        } else if (typeof global.getStakePointsForSim === 'function') {
            points = global.getStakePointsForSim().filter((p) => p && Number.isFinite(p.x));
        }
        if (!points.length) return toast(bmT('stair.needBimPoints'));
        applyStakePoints(points, 'bim');
    }

    function importStakePointsCsvFile(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const points = parseStakePointsCsv(String(reader.result || ''));
            if (!points.length) return toast(bmT('stair.csvInvalid'));
            applyStakePoints(points, 'csv');
            event.target.value = '';
        };
        reader.onerror = () => toast(bmT('stair.csvReadError'));
        reader.readAsText(file, 'UTF-8');
    }

    function downloadStakePointsCsvTemplate() {
        const sample = [
            'id,x,y,label,type',
            'P1,0,0,下平台,landing',
            'P2,0.28,0.18,第1踏,tread',
            'P3,0.56,0.36,第2踏,tread',
            'P4,1.20,0.80,中間平台,landing',
            bmT('stair.csvHintComment')
        ].join('\n');
        const blob = new Blob([sample], { type: 'text/plain;charset=utf-8' });
        const link = global.document.createElement('a');
        link.download = 'stake_points_template.csv';
        link.href = global.URL.createObjectURL(blob);
        link.style.display = 'none';
        global.document.body.appendChild(link);
        link.click();
        global.document.body.removeChild(link);
        global.URL.revokeObjectURL(link.href);
        toast(bmT('stair.toastTemplate'));
    }

    function saveStakeProjectPoints() {
        if (!stairState.points.length) return toast(bmT('stair.needPoints'));
        persistProjectBundle();
        toast(bmT('stair.toastSaved', { project: stairState.projectName || readProjectName() }));
    }

    function restoreStakeProjectPoints() {
        const name = readProjectName();
        if (!name) return toast(bmT('stair.needProjectName'));
        if (!loadProjectBundle(name)) return toast(bmT('stair.noSavedProject'));
        toast(bmT('stair.toastRestored', { project: name }));
    }

    function readDrawingType() {
        const el = global.document.getElementById('stairDrawingType');
        return el && el.value === 'elevation' ? 'elevation' : 'plan';
    }

    function persistDrawingType(type) {
        try {
            global.localStorage.setItem(STAIR_STORAGE_KEY, type);
        } catch (_e) {}
    }

    function syncDrawingTypeUi() {
        const el = global.document.getElementById('stairDrawingType');
        if (el) el.value = stairState.drawingType;
        const badge = global.document.getElementById('stairDrawingBadge');
        if (badge) {
            badge.textContent = stairState.drawingType === 'elevation'
                ? bmT('stair.badgeElevation')
                : bmT('stair.badgePlan');
        }
        const sourceEl = global.document.getElementById('stakePointSourceLabel');
        if (sourceEl) {
            sourceEl.textContent = stairState.enabled
                ? bmT('stair.sourceActive', {
                    count: String(stairState.points.length),
                    source: sourceLabel(stairState.pointSource)
                })
                : bmT('stair.sourceIdle');
        }
    }

    function sourceLabel(source) {
        const map = {
            csv: bmT('stair.sourceCsv'),
            bim: bmT('stair.sourceBim'),
            demo: bmT('stair.sourceDemo'),
            saved: bmT('stair.sourceSaved'),
            custom: bmT('stair.sourceCustom')
        };
        return map[source] || source || bmT('stair.sourceCustom');
    }

    function updateStakePointsPreview() {
        const el = global.document.getElementById('stakePointsPreview');
        if (!el) return;
        if (!stairState.points.length) {
            el.textContent = bmT('stair.previewEmpty');
            return;
        }
        el.textContent = stairState.points.map((p) =>
            `${p.id} | X=${p.x} | Y=${p.y} | ${p.label || ''}`
        ).join('\n');
    }

    function clearStairStakeMode() {
        stairState.enabled = false;
        stairState.points = [];
        stairState.pointSource = '';
        stairState.corrections = [];
        stairState.pointRecords = {};
        updateStakePointsPreview();
        syncDrawingTypeUi();
        if (typeof global.resetStakeFieldOperation === 'function') {
            global.resetStakeFieldOperation();
        }
        if (typeof global.redrawStakeFieldSimulator === 'function') {
            global.redrawStakeFieldSimulator();
        }
    }

    function getStairStakePointsOverride() {
        if (!stairState.enabled || !stairState.points.length) return null;
        return stairState.points.map((p) => ({
            id: p.id,
            x: p.x,
            y: p.y,
            label: p.label || p.id,
            pointType: p.pointType || 'layout'
        }));
    }

    function directionFromDelta(dx, dy) {
        if (Math.hypot(dx, dy) < 10) {
            return { key: 'stair.dirOk', arrow: '●', label: bmT('stair.dirOk') };
        }
        if (Math.abs(dx) >= Math.abs(dy)) {
            return dx > 0
                ? { key: 'stair.dirRight', arrow: '→', label: bmT('stair.dirRight') }
                : { key: 'stair.dirLeft', arrow: '←', label: bmT('stair.dirLeft') };
        }
        return dy > 0
            ? { key: 'stair.dirDown', arrow: '↓', label: bmT('stair.dirDown') }
            : { key: 'stair.dirUp', arrow: '↑', label: bmT('stair.dirUp') };
    }

    function onStakeCrosshairMoved(payload) {
        if (!stairState.enabled || !payload || !payload.activePoint) return;
        const id = payload.activePoint.id;
        const prev = payload.prevDeviationPx;
        const next = payload.deviationPx;
        if (!Number.isFinite(prev) || !Number.isFinite(next)) return;

        const dir = directionFromDelta(payload.deltaX, payload.deltaY);
        if (!stairState.pointRecords[id]) {
            stairState.pointRecords[id] = { corrections: 0, maxDeviation: next };
        }
        stairState.pointRecords[id].maxDeviation = Math.max(stairState.pointRecords[id].maxDeviation || 0, next);

        if (next > prev + 4 && next > 20) {
            const msg = bmT('stair.correctionLog', {
                id,
                dir: dir.label,
                from: String(Math.round(prev)),
                to: String(Math.round(next))
            });
            stairState.corrections.push({ time: new Date().toISOString(), pointId: id, message: msg });
            stairState.pointRecords[id].corrections += 1;
            if (stairState.corrections.length > 40) stairState.corrections.shift();
            const dirEl = global.document.getElementById('stakeSimDirLabel');
            if (dirEl) {
                dirEl.textContent = bmT('stair.dirGuideWrong', { dir: dir.label, arrow: dir.arrow });
                dirEl.dataset.level = 'warn';
            }
        } else if (next < prev - 2) {
            const dirEl = global.document.getElementById('stakeSimDirLabel');
            if (dirEl) {
                dirEl.textContent = bmT('stair.dirGuideGood', { dir: dir.label, arrow: dir.arrow });
                dirEl.dataset.level = 'ok';
            }
        }
    }

    function updateStairDirectionPanel(payload) {
        const dirEl = global.document.getElementById('stakeSimDirLabel');
        if (!dirEl) return;
        if (!stairState.enabled || !payload || !payload.activePoint) {
            dirEl.textContent = bmT('stair.dirIdle');
            dirEl.dataset.level = '';
            return;
        }
        if (payload.aligned) {
            dirEl.textContent = bmT('stair.dirLocked');
            dirEl.dataset.level = 'ok';
            return;
        }
        const dir = directionFromDelta(payload.deltaX, payload.deltaY);
        dirEl.textContent = bmT('stair.dirGuide', { dir: dir.label, arrow: dir.arrow });
        dirEl.dataset.level = 'info';
    }

    function isStakeFieldSimulatorVerified() {
        return typeof global.getStakeFieldSimulatorState === 'function'
            && global.getStakeFieldSimulatorState().verified;
    }

    function buildStairFieldReportText() {
        const sim = typeof global.getStakeFieldSimulatorState === 'function'
            ? global.getStakeFieldSimulatorState()
            : { verified: false, markedIds: [], points: [] };
        const drawingLabel = stairState.drawingType === 'elevation'
            ? bmT('stair.badgeElevation')
            : bmT('stair.badgePlan');
        const lines = [
            '==================================================',
            bmT('stair.reportTitle'),
            '==================================================',
            bmT('stair.reportTime') + new Date().toLocaleString(),
            bmT('stair.reportProject') + (stairState.projectName || readProjectName() || bmT('stair.projectDefault')),
            bmT('stair.reportDrawing') + drawingLabel,
            bmT('stair.reportSource') + sourceLabel(stairState.pointSource),
            bmT('stair.reportSim') + (sim.verified ? bmT('stair.reportSimOk') : bmT('stair.reportSimPending')),
            bmT('stair.reportMarked', { marked: String(sim.markedIds.length), total: String(sim.points.length) }),
            '--------------------------------------------------',
            bmT('stair.reportPointsHeader')
        ];
        sim.points.forEach((p, idx) => {
            const rec = stairState.pointRecords[p.id] || {};
            lines.push([
                String(idx + 1),
                p.id,
                p.label || '',
                p.x,
                p.y,
                sim.markedIds.includes(p.id) ? bmT('stair.reportMarkedYes') : bmT('stair.reportMarkedNo'),
                String(rec.corrections || 0),
                String(Math.round(rec.maxDeviation || 0)) + 'px'
            ].join(' | '));
        });
        lines.push('--------------------------------------------------');
        lines.push(bmT('stair.reportCorrectionHeader'));
        if (stairState.corrections.length) {
            stairState.corrections.forEach((c) => lines.push(c.message));
        } else {
            lines.push(bmT('stair.reportNoCorrection'));
        }
        lines.push('==================================================');
        lines.push(sim.verified ? bmT('stair.reportConclusionOk') : bmT('stair.reportConclusionPending'));
        return lines.join('\n');
    }

    function exportStairStakeFieldReport() {
        if (!stairState.enabled) return toast(bmT('stair.needLoad'));
        if (!isStakeFieldSimulatorVerified()) return toast(bmT('stair.needSimVerify'));
        const text = buildStairFieldReportText();
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const link = global.document.createElement('a');
        const projectSlug = (stairState.projectName || 'project').replace(/[^\w-]+/g, '_').slice(0, 24);
        link.download = `stake_field_report_${projectSlug}.txt`;
        link.href = global.URL.createObjectURL(blob);
        link.style.display = 'none';
        global.document.body.appendChild(link);
        link.click();
        global.document.body.removeChild(link);
        global.URL.revokeObjectURL(link.href);
        toast(bmT('stair.toastExported'));
    }

    function initStairStakeGuide() {
        try {
            const saved = global.localStorage.getItem(STAIR_STORAGE_KEY);
            if (saved === 'elevation' || saved === 'plan') stairState.drawingType = saved;
        } catch (_e) {}
        syncDrawingTypeUi();
        updateStakePointsPreview();
        global.document.getElementById('stairDrawingType')?.addEventListener('change', syncDrawingTypeUi);
        global.document.getElementById('stakeProjectName')?.addEventListener('change', () => {
            const name = readProjectName();
            if (name) loadProjectBundle(name);
        });
        global.document.getElementById('stakePointsCsvInput')?.addEventListener('change', importStakePointsCsvFile);
    }

    global.getStairStakePointsOverride = getStairStakePointsOverride;
    global.onStakeCrosshairMoved = onStakeCrosshairMoved;
    global.updateStairDirectionPanel = updateStairDirectionPanel;
    global.loadStairStakePoints = loadStairStakePoints;
    global.loadStakeSampleC2Plan = loadStakeSampleC2Plan;
    global.loadStairStakeDemoPoints = loadStairStakeDemoPoints;
    global.useBimLayoutPointsForStakeGuide = useBimLayoutPointsForStakeGuide;
    global.importStakePointsCsvFile = importStakePointsCsvFile;
    global.downloadStakePointsCsvTemplate = downloadStakePointsCsvTemplate;
    global.saveStakeProjectPoints = saveStakeProjectPoints;
    global.restoreStakeProjectPoints = restoreStakeProjectPoints;
    global.parseStakePointsCsv = parseStakePointsCsv;
    global.clearStairStakeMode = clearStairStakeMode;
    global.exportStairStakeFieldReport = exportStairStakeFieldReport;
    global.buildStairFieldReportText = buildStairFieldReportText;
    global.isStairStakeModeEnabled = () => stairState.enabled;
    global.initStairStakeGuide = initStairStakeGuide;

    if (global.document) {
        if (global.document.readyState === 'loading') {
            global.document.addEventListener('DOMContentLoaded', initStairStakeGuide);
        } else {
            initStairStakeGuide();
        }
    }
})(typeof window !== 'undefined' ? window : globalThis);
