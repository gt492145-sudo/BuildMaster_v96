(function (global) {
    'use strict';

    const STAKE_ALIGN_PX = 28;
    const ZOOM_MIN = 1;
    const ZOOM_MAX = 4;
    const ZOOM_STEP = 0.35;

    function createViewport() {
        return { zoom: 1, panX: 0, panY: 0 };
    }

    const stakeState = {
        image: null,
        verified: false,
        showCrosshair: true,
        showPoints: true,
        bound: false,
        activeIndex: 0,
        markedIds: new Set(),
        crosshairX: null,
        crosshairY: null,
        layout: null,
        dragging: false,
        gesture: null,
        viewport: createViewport(),
        pulse: 0,
        animId: 0
    };

    const electricalState = {
        image: null,
        verified: false,
        bound: false,
        probeX: null,
        probeY: null,
        dragging: false,
        gesture: null,
        viewport: createViewport(),
        steps: { probeSet: false, measured: false, relayTested: false },
        measuredValue: null,
        relayFlash: null,
        measureAnim: null,
        pulse: 0,
        animId: 0
    };

    let stakeExportsWrapped = false;

    function bmT(key, vars) {
        return (typeof global.BM_T === 'function') ? global.BM_T(key, vars) : key;
    }

    function toast(msg) {
        if (typeof global.showToast === 'function') global.showToast(msg);
    }

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function dist(ax, ay, bx, by) {
        return Math.hypot(ax - bx, ay - by);
    }

    function readImageFile(file, callback) {
        if (!file || !/^image\//.test(file.type || '')) {
            toast(bmT('sim.toastNeedImage'));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => callback(img);
            img.onerror = () => toast(bmT('sim.toastImageError'));
            img.src = String(reader.result || '');
        };
        reader.onerror = () => toast(bmT('sim.toastImageError'));
        reader.readAsDataURL(file);
    }

    function getStakePointsForSim() {
        if (Array.isArray(global.bimLayoutPoints) && global.bimLayoutPoints.length) {
            return global.bimLayoutPoints
                .map((p) => ({
                    id: String(p.id),
                    x: Number(p.x),
                    y: Number(p.y),
                    label: String(p.pointType || p.id || '')
                }))
                .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
        }
        const body = global.document.getElementById('bimLayoutBody');
        if (!body) return [];
        const points = [];
        body.querySelectorAll('tr').forEach((tr) => {
            const cells = tr.querySelectorAll('td');
            if (cells.length < 6) return;
            const x = Number(cells[4].textContent);
            const y = Number(cells[5].textContent);
            if (!Number.isFinite(x) || !Number.isFinite(y)) return;
            points.push({
                id: cells[0].textContent.trim(),
                x,
                y,
                label: cells[3].textContent.trim() || cells[0].textContent.trim()
            });
        });
        return points;
    }

    function computePointBounds(points) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        points.forEach((p) => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        });
        if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
        if (maxX - minX < 1e-6) maxX = minX + 1;
        if (maxY - minY < 1e-6) maxY = minY + 1;
        return { minX, minY, maxX, maxY };
    }

    function mapPointToCanvas(p, bounds, padX, padY, drawW, drawH) {
        const nx = (p.x - bounds.minX) / (bounds.maxX - bounds.minX);
        const ny = (p.y - bounds.minY) / (bounds.maxY - bounds.minY);
        return { x: padX + nx * drawW, y: padY + (1 - ny) * drawH };
    }

    function computeImageFrame(img, w, h) {
        const scale = Math.min(w / img.width, h / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        return { dx: (w - drawW) / 2, dy: (h - drawH) / 2, drawW, drawH, scale };
    }

    function setupHiDpiCanvas(canvas) {
        const rect = canvas.getBoundingClientRect();
        const dpr = global.devicePixelRatio || 1;
        const w = Math.max(280, Math.round(rect.width || canvas.clientWidth || 640));
        const h = Math.max(240, Math.round(w * 0.65));
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { ctx, w, h, dpr };
    }

    function canvasPointerPos(canvas, event) {
        const rect = canvas.getBoundingClientRect();
        const lw = canvas.clientWidth || rect.width || 1;
        const lh = canvas.clientHeight || rect.height || 1;
        return {
            x: (event.clientX - rect.left) * (lw / rect.width),
            y: (event.clientY - rect.top) * (lh / rect.height)
        };
    }

    function screenToWorld(x, y, viewport) {
        return {
            x: (x - viewport.panX) / viewport.zoom,
            y: (y - viewport.panY) / viewport.zoom
        };
    }

    function paintFieldPhoto(ctx, img, w, h) {
        const frame = computeImageFrame(img, w, h);
        ctx.save();
        try {
            ctx.filter = 'contrast(1.1) saturate(1.08) brightness(1.04)';
        } catch (_e) {}
        ctx.drawImage(img, frame.dx, frame.dy, frame.drawW, frame.drawH);
        ctx.restore();
        return frame;
    }

    function drawViewfinderOverlay(ctx, w, h) {
        const m = 14;
        const len = 22;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 2;
        [[m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]].forEach(([x, y, sx, sy]) => {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + sx * len, y);
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + sy * len);
            ctx.stroke();
        });
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(0, 0, w, 18);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('● REC  FIELD LIVE', w / 2, 12);
        ctx.restore();
    }

    function drawSurveyReticle(ctx, cx, cy, size, aligned, pulse) {
        const ring = STAKE_ALIGN_PX + Math.sin(pulse * 0.12) * (aligned ? 2 : 0);
        ctx.save();
        ctx.strokeStyle = aligned ? 'rgba(166, 227, 161, 0.95)' : 'rgba(255, 64, 129, 0.92)';
        ctx.lineWidth = aligned ? 2.5 : 2;
        ctx.beginPath();
        ctx.arc(cx, cy, ring, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.stroke();
        for (let i = -3; i <= 3; i++) {
            if (i === 0) continue;
            const tick = i * (size / 4);
            ctx.beginPath();
            ctx.moveTo(cx + tick, cy - 4);
            ctx.lineTo(cx + tick, cy + 4);
            ctx.moveTo(cx - 4, cy + tick);
            ctx.lineTo(cx + 4, cy + tick);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(cx - size, cy);
        ctx.lineTo(cx + size, cy);
        ctx.moveTo(cx, cy - size);
        ctx.lineTo(cx, cy + size);
        ctx.stroke();
        ctx.setLineDash([4, 5]);
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, cy + size * 1.35);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = aligned ? '#a6e3a1' : '#ff4081';
        ctx.fill();
        if (aligned) {
            ctx.strokeStyle = `rgba(166, 227, 161, ${0.35 + Math.sin(pulse * 0.15) * 0.25})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, ring + 6 + Math.sin(pulse * 0.15) * 3, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawDeviationBadge(ctx, w, h, pxDev, aligned) {
        const bw = 168;
        const bh = 44;
        const x = w - bw - 10;
        const y = h - bh - 10;
        ctx.fillStyle = 'rgba(17, 17, 27, 0.84)';
        ctx.strokeStyle = aligned ? 'rgba(166,227,161,0.5)' : 'rgba(250,179,135,0.45)';
        ctx.lineWidth = 1;
        ctx.fillRect(x, y, bw, bh);
        ctx.strokeRect(x, y, bw, bh);
        ctx.fillStyle = aligned ? '#a6e3a1' : '#fab387';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(aligned ? bmT('sim.stakeLocked') : bmT('sim.stakeAdjusting'), x + 10, y + 18);
        ctx.fillStyle = '#cdd6f4';
        ctx.font = '11px sans-serif';
        ctx.fillText(bmT('sim.stakeDeviation', { px: String(Math.round(pxDev)) }), x + 10, y + 34);
    }

    function drawMultimeterOverlay(ctx, w, h, x, y, reading, color, showReading) {
        const mw = 118;
        const mh = 72;
        const mx = clamp(x - mw / 2, 8, w - mw - 8);
        const my = clamp(y - mh - 18, 8, h - mh - 8);
        ctx.save();
        ctx.strokeStyle = 'rgba(30,30,40,0.95)';
        ctx.fillStyle = 'rgba(24,24,34,0.94)';
        ctx.lineWidth = 2;
        ctx.fillRect(mx, my, mw, mh);
        ctx.strokeRect(mx, my, mw, mh);
        ctx.fillStyle = 'rgba(12, 42, 28, 0.95)';
        ctx.fillRect(mx + 8, my + 22, mw - 16, 28);
        ctx.fillStyle = color;
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(showReading ? `${reading} V` : '--- V', mx + mw / 2, my + 42);
        ctx.fillStyle = '#9aa5ce';
        ctx.font = '9px sans-serif';
        ctx.fillText('DIGITAL MULTIMETER', mx + mw / 2, my + 14);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(mx + mw / 2, my + mh);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
    }

    function drawRelayLamp(ctx, w, relayOn, flash) {
        const x = w - 54;
        const y = 28;
        const lit = flash || relayOn;
        ctx.fillStyle = 'rgba(17,17,27,0.78)';
        ctx.fillRect(x - 8, y - 14, 62, 28);
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = lit ? (relayOn ? '#a6e3a1' : '#6c7086') : '#45475a';
        ctx.fill();
        ctx.fillStyle = '#cdd6f4';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(relayOn ? 'RLY ON' : 'RLY OFF', x + 12, y + 4);
    }

    function resetStakeOperation() {
        stakeState.activeIndex = 0;
        stakeState.markedIds = new Set();
        stakeState.crosshairX = null;
        stakeState.crosshairY = null;
        stakeState.verified = false;
        stakeState.layout = null;
        stakeState.viewport = createViewport();
        stakeState.pulse = 0;
    }

    function resetElectricalOperation() {
        electricalState.probeX = null;
        electricalState.probeY = null;
        electricalState.verified = false;
        electricalState.viewport = createViewport();
        electricalState.steps = { probeSet: false, measured: false, relayTested: false };
        electricalState.measuredValue = null;
        electricalState.relayFlash = null;
        electricalState.measureAnim = null;
        electricalState.pulse = 0;
    }

    function buildStakeLayout(w, h) {
        const points = getStakePointsForSim();
        if (!stakeState.image) {
            return { w, h, points: [], screenPoints: [], bounds: null, frame: null };
        }
        const bounds = computePointBounds(points);
        const frame = computeImageFrame(stakeState.image, w, h);
        const screenPoints = points.map((p) => ({
            ...p,
            sx: mapPointToCanvas(p, bounds, frame.dx, frame.dy, frame.drawW, frame.drawH).x,
            sy: mapPointToCanvas(p, bounds, frame.dx, frame.dy, frame.drawW, frame.drawH).y
        }));
        return { w, h, points, screenPoints, bounds, frame };
    }

    function getActiveStakeScreenPoint(layout) {
        if (!layout || !layout.screenPoints.length) return null;
        const idx = clamp(stakeState.activeIndex, 0, layout.screenPoints.length - 1);
        return { point: layout.screenPoints[idx], index: idx, total: layout.screenPoints.length };
    }

    function ensureStakeCrosshair(layout) {
        const active = getActiveStakeScreenPoint(layout);
        if (!active) return;
        if (stakeState.crosshairX == null || stakeState.crosshairY == null) {
            stakeState.crosshairX = active.point.sx;
            stakeState.crosshairY = active.point.sy;
        }
    }

    function isStakeAligned(layout) {
        const active = getActiveStakeScreenPoint(layout);
        if (!active || stakeState.crosshairX == null) return false;
        return dist(stakeState.crosshairX, stakeState.crosshairY, active.point.sx, active.point.sy) <= STAKE_ALIGN_PX;
    }

    function getStakeDeviation(layout) {
        const active = getActiveStakeScreenPoint(layout);
        if (!active || stakeState.crosshairX == null) return STAKE_ALIGN_PX + 1;
        return dist(stakeState.crosshairX, stakeState.crosshairY, active.point.sx, active.point.sy);
    }

    function updateStakeOpPanel(layout) {
        const opEl = global.document.getElementById('stakeSimOpLabel');
        const markBtn = global.document.getElementById('stakeSimMarkBtn');
        const confirmBtn = global.document.querySelector('#stakeFieldSimulator .field-simulator-confirm-btn');
        const points = layout ? layout.points : [];
        const marked = stakeState.markedIds.size;
        const total = points.length;
        const active = getActiveStakeScreenPoint(layout);
        const aligned = isStakeAligned(layout);

        if (opEl) {
            if (!stakeState.image) opEl.textContent = bmT('sim.stakeOpIdle');
            else if (!total) opEl.textContent = bmT('sim.stakeOpNoPoints');
            else if (active) {
                opEl.textContent = bmT(aligned ? 'sim.stakeOpLocked' : 'sim.stakeOpStep', {
                    current: String(active.index + 1),
                    total: String(total),
                    label: String(active.point.label || active.point.id).slice(0, 16),
                    marked: String(marked)
                });
            }
        }
        if (markBtn) {
            markBtn.disabled = !(stakeState.image && total && active && !stakeState.markedIds.has(active.point.id) && aligned);
        }
        if (confirmBtn) confirmBtn.disabled = !(stakeState.image && total > 0 && marked === total);
    }

    function setStakeSimStatus(text, ok) {
        const el = global.document.getElementById('stakeSimStatus');
        if (!el) return;
        el.textContent = text;
        el.dataset.ok = ok ? '1' : '0';
    }

    function setElectricalSimStatus(text, ok) {
        const el = global.document.getElementById('electricalSimStatus');
        if (!el) return;
        el.textContent = text;
        el.dataset.ok = ok ? '1' : '0';
    }

    function updateElectricalOpPanel() {
        const opEl = global.document.getElementById('electricalSimOpLabel');
        const measureBtn = global.document.getElementById('electricalSimMeasureBtn');
        const relayBtn = global.document.getElementById('electricalSimRelayBtn');
        const confirmBtn = global.document.querySelector('#electricalModePage .field-simulator-confirm-btn');
        const steps = electricalState.steps;
        const params = readElectricalParams();
        const verdict = evaluateVoltage(params.voltage);

        if (opEl) {
            if (!electricalState.image) opEl.textContent = bmT('sim.electricalOpIdle');
            else if (!steps.probeSet) opEl.textContent = bmT('sim.electricalOpProbe');
            else if (!steps.measured) opEl.textContent = bmT('sim.electricalOpMeasure');
            else if (!steps.relayTested) opEl.textContent = bmT('sim.electricalOpRelay');
            else opEl.textContent = bmT('sim.electricalOpDone');
        }
        if (measureBtn) measureBtn.disabled = !(electricalState.image && steps.probeSet && !steps.measured);
        if (relayBtn) relayBtn.disabled = !(electricalState.image && steps.measured && !steps.relayTested);
        if (confirmBtn) {
            confirmBtn.disabled = !(electricalState.image && steps.probeSet && steps.measured && steps.relayTested && verdict.level !== 'bad');
        }
    }

    function scheduleStakeAnim() {
        if (stakeState.animId) return;
        const tick = () => {
            if (!stakeState.image) { stakeState.animId = 0; return; }
            stakeState.pulse += 1;
            redrawStakeFieldSimulator();
            stakeState.animId = global.requestAnimationFrame(tick);
        };
        stakeState.animId = global.requestAnimationFrame(tick);
    }

    function stopStakeAnim() {
        if (stakeState.animId) global.cancelAnimationFrame(stakeState.animId);
        stakeState.animId = 0;
    }

    function scheduleElectricalAnim() {
        if (electricalState.animId) return;
        const tick = () => {
            if (!electricalState.image) { electricalState.animId = 0; return; }
            electricalState.pulse += 1;
            if (electricalState.measureAnim != null) {
                electricalState.measureAnim += 0.04;
                if (electricalState.measureAnim >= 1) electricalState.measureAnim = 1;
            }
            redrawElectricalFieldSimulator();
            electricalState.animId = global.requestAnimationFrame(tick);
        };
        electricalState.animId = global.requestAnimationFrame(tick);
    }

    function stopElectricalAnim() {
        if (electricalState.animId) global.cancelAnimationFrame(electricalState.animId);
        electricalState.animId = 0;
    }

    function redrawStakeFieldSimulator() {
        const canvas = global.document.getElementById('stakeSimCanvas');
        if (!canvas) return;
        const { ctx, w, h } = setupHiDpiCanvas(canvas);
        stakeState.layout = buildStakeLayout(w, h);
        const layout = stakeState.layout;
        const vp = stakeState.viewport;

        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);

        if (!stakeState.image) {
            ctx.fillStyle = '#8fa8c4';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(bmT('sim.stakeEmptyHint'), w / 2, h / 2);
            setStakeSimStatus(bmT('sim.stakeStatusIdle'), false);
            updateStakeOpPanel(layout);
            stopStakeAnim();
            return;
        }

        scheduleStakeAnim();
        ctx.save();
        ctx.translate(vp.panX, vp.panY);
        ctx.scale(vp.zoom, vp.zoom);
        paintFieldPhoto(ctx, stakeState.image, w, h);
        ensureStakeCrosshair(layout);
        const active = getActiveStakeScreenPoint(layout);
        const aligned = isStakeAligned(layout);

        if (stakeState.showPoints && layout.screenPoints.length) {
            layout.screenPoints.forEach((p) => {
                const isActive = active && p.id === active.point.id;
                const isMarked = stakeState.markedIds.has(p.id);
                ctx.beginPath();
                ctx.fillStyle = isMarked ? 'rgba(166,227,161,0.95)' : (isActive ? 'rgba(255,209,102,0.95)' : 'rgba(137,180,250,0.82)');
                ctx.arc(p.sx, p.sy, isActive ? 9 : 6, 0, Math.PI * 2);
                ctx.fill();
                if (isMarked) {
                    ctx.fillStyle = '#11111b';
                    ctx.font = 'bold 10px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('✓', p.sx, p.sy + 4);
                }
            });
        }

        if (active && !stakeState.markedIds.has(active.point.id)) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255,209,102,0.55)';
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.arc(active.point.sx, active.point.sy, STAKE_ALIGN_PX, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

        if (stakeState.showCrosshair && stakeState.crosshairX != null) {
            drawSurveyReticle(ctx, stakeState.crosshairX, stakeState.crosshairY, Math.min(w, h) * 0.11, aligned, stakeState.pulse);
        }
        ctx.restore();

        drawViewfinderOverlay(ctx, w, h);
        drawDeviationBadge(ctx, w, h, getStakeDeviation(layout), aligned);

        ctx.fillStyle = 'rgba(17,17,27,0.78)';
        ctx.fillRect(8, 24, Math.min(w - 16, 360), 24);
        ctx.fillStyle = '#cdd6f4';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(bmT('sim.stakeHudDrag'), 14, 40);
        ctx.fillStyle = 'rgba(17,17,27,0.78)';
        ctx.fillRect(8, h - 58, 120, 22);
        ctx.fillStyle = '#89b4fa';
        ctx.font = '10px sans-serif';
        ctx.fillText(bmT('sim.zoomLevel', { z: String(Math.round(vp.zoom * 100)) }), 14, h - 44);

        const marked = stakeState.markedIds.size;
        const total = layout.points.length;
        let statusKey = 'sim.stakeStatusNoPoints';
        if (total) {
            if (stakeState.verified) statusKey = 'sim.stakeStatusVerified';
            else if (marked === total) statusKey = 'sim.stakeStatusAllMarked';
            else statusKey = 'sim.stakeStatusReady';
        }
        setStakeSimStatus(bmT(statusKey, { count: String(total), marked: String(marked) }), stakeState.verified);
        updateStakeOpPanel(layout);
    }

    function readElectricalParams() {
        const voltage = Number(global.document.getElementById('mechaVoltage')?.value) || 0;
        const current = Number(global.document.getElementById('mechaCurrent')?.value) || 0;
        const relay = global.document.querySelector('input[name="mechaRelayStatus"]:checked')?.value || 'ON';
        return { voltage, current, power: voltage * current, relay };
    }

    function evaluateVoltage(voltage) {
        if (voltage <= 0) return { level: 'bad', label: bmT('sim.electricalLevelBad') };
        const nominal = voltage <= 130 ? 110 : (voltage <= 260 ? 220 : 380);
        const diff = Math.abs(voltage - nominal);
        const tolerance = nominal * 0.12;
        if (diff <= tolerance * 0.5) return { level: 'ok', label: bmT('sim.electricalLevelOk'), nominal };
        if (diff <= tolerance) return { level: 'warn', label: bmT('sim.electricalLevelWarn'), nominal };
        return { level: 'bad', label: bmT('sim.electricalLevelBad'), nominal };
    }

    function getElectricalReading(params) {
        if (electricalState.measuredValue == null) return params.voltage;
        if (electricalState.measureAnim == null) return electricalState.measuredValue;
        const t = electricalState.measureAnim;
        const start = params.voltage * 0.2;
        return Math.round((start + (electricalState.measuredValue - start) * t) * 10) / 10;
    }

    function redrawElectricalFieldSimulator() {
        const canvas = global.document.getElementById('electricalSimCanvas');
        if (!canvas) return;
        const { ctx, w, h } = setupHiDpiCanvas(canvas);
        const vp = electricalState.viewport;

        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);

        if (!electricalState.image) {
            ctx.fillStyle = '#8fa8c4';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(bmT('sim.electricalEmptyHint'), w / 2, h / 2 - 12);
            setElectricalSimStatus(bmT('sim.electricalStatusIdle'), false);
            updateElectricalOpPanel();
            stopElectricalAnim();
            return;
        }

        scheduleElectricalAnim();
        if (electricalState.probeX == null) electricalState.probeX = w * 0.5;
        if (electricalState.probeY == null) electricalState.probeY = h * 0.42;

        ctx.save();
        ctx.translate(vp.panX, vp.panY);
        ctx.scale(vp.zoom, vp.zoom);
        paintFieldPhoto(ctx, electricalState.image, w, h);
        ctx.restore();

        const params = readElectricalParams();
        const verdict = evaluateVoltage(params.voltage);
        const colors = { ok: '#a6e3a1', warn: '#fab387', bad: '#f38ba8' };
        const color = colors[verdict.level] || colors.bad;
        const reading = getElectricalReading(params);
        const showReading = electricalState.steps.measured;

        drawMultimeterOverlay(ctx, w, h, electricalState.probeX, electricalState.probeY, reading, color, showReading || electricalState.measureAnim != null);
        drawViewfinderOverlay(ctx, w, h);
        drawRelayLamp(ctx, w, params.relay === 'ON', electricalState.relayFlash);

        ctx.fillStyle = 'rgba(17,17,27,0.82)';
        const panelW = Math.min(w - 20, 300);
        const panelH = 96;
        const panelX = (w - panelW) / 2;
        const panelY = h - panelH - 8;
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = 'rgba(137,180,250,0.35)';
        ctx.strokeRect(panelX, panelY, panelW, panelH);
        ctx.fillStyle = '#eef8ff';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(bmT('sim.electricalHudTitle'), panelX + 12, panelY + 20);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = color;
        ctx.fillText(`${reading} V · ${params.current} A · ${params.power} W`, panelX + 12, panelY + 40);
        ctx.fillStyle = '#cdd6f4';
        ctx.fillText(bmT('sim.electricalHudRelay', { relay: electricalState.relayFlash || params.relay }), panelX + 12, panelY + 58);
        if (showReading) {
            ctx.fillStyle = color;
            ctx.fillText(verdict.label, panelX + 12, panelY + 76);
        }

        ctx.fillStyle = 'rgba(17,17,27,0.78)';
        ctx.fillRect(8, 24, Math.min(w - 16, 360), 24);
        ctx.fillStyle = '#cdd6f4';
        ctx.font = '11px sans-serif';
        ctx.fillText(bmT('sim.electricalHudDrag'), 14, 40);

        let statusKey = 'sim.electricalStatusReady';
        if (electricalState.verified) statusKey = 'sim.electricalStatusVerified';
        else if (verdict.level === 'bad') statusKey = 'sim.electricalStatusBad';
        else if (electricalState.steps.relayTested) statusKey = 'sim.electricalStatusOpDone';
        setElectricalSimStatus(bmT(statusKey, { voltage: String(params.voltage) }), electricalState.verified);
        updateElectricalOpPanel();
    }

    function applyZoom(viewport, canvas, delta, focusX, focusY) {
        const prev = viewport.zoom;
        const next = clamp(prev + delta, ZOOM_MIN, ZOOM_MAX);
        if (next === prev) return;
        const fx = focusX != null ? focusX : canvas.clientWidth / 2;
        const fy = focusY != null ? focusY : canvas.clientHeight / 2;
        viewport.panX = fx - ((fx - viewport.panX) / prev) * next;
        viewport.panY = fy - ((fy - viewport.panY) / prev) * next;
        viewport.zoom = next;
    }

    function bindViewportGestures(canvas, state, onWorldPointer) {
        const pointers = new Map();

        const pinchInfo = () => {
            const pts = Array.from(pointers.values());
            if (pts.length < 2) return null;
            const dx = pts[1].x - pts[0].x;
            const dy = pts[1].y - pts[0].y;
            return {
                dist: Math.hypot(dx, dy),
                midX: (pts[0].x + pts[1].x) / 2,
                midY: (pts[0].y + pts[1].y) / 2
            };
        };

        canvas.addEventListener('wheel', (event) => {
            if (!state.image) return;
            event.preventDefault();
            const pos = canvasPointerPos(canvas, event);
            applyZoom(state.viewport, canvas, event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP, pos.x, pos.y);
            onWorldPointer();
        }, { passive: false });

        canvas.addEventListener('pointerdown', (event) => {
            if (!state.image) return;
            const pos = canvasPointerPos(canvas, event);
            pointers.set(event.pointerId, pos);
            canvas.setPointerCapture(event.pointerId);
            if (pointers.size === 1) {
                state.gesture = { type: 'move', startX: pos.x, startY: pos.y };
                const world = screenToWorld(pos.x, pos.y, state.viewport);
                state.crosshairX = world.x;
                state.crosshairY = world.y;
                state.probeX = pos.x;
                state.probeY = pos.y;
                if (state.steps) {
                    state.steps.probeSet = true;
                    state.verified = false;
                }
                onWorldPointer();
            } else if (pointers.size === 2) {
                const pin = pinchInfo();
                state.gesture = { type: 'pinch', startDist: pin.dist, startZoom: state.viewport.zoom, startPanX: state.viewport.panX, startPanY: state.viewport.panY, midX: pin.midX, midY: pin.midY };
            }
        });

        canvas.addEventListener('pointermove', (event) => {
            if (!pointers.has(event.pointerId)) return;
            const pos = canvasPointerPos(canvas, event);
            pointers.set(event.pointerId, pos);
            if (pointers.size >= 2 && state.gesture && state.gesture.type === 'pinch') {
                const pin = pinchInfo();
                if (!pin) return;
                const ratio = pin.dist / state.gesture.startDist;
                const nextZoom = clamp(state.gesture.startZoom * ratio, ZOOM_MIN, ZOOM_MAX);
                state.viewport.zoom = nextZoom;
                state.viewport.panX = state.gesture.midX - (state.gesture.midX - state.gesture.startPanX) * (nextZoom / state.gesture.startZoom);
                state.viewport.panY = state.gesture.midY - (state.gesture.midY - state.gesture.startPanY) * (nextZoom / state.gesture.startZoom);
                onWorldPointer();
                return;
            }
            if (pointers.size === 1 && state.gesture && state.gesture.type === 'move') {
                const world = screenToWorld(pos.x, pos.y, state.viewport);
                if ('crosshairX' in state) {
                    state.crosshairX = world.x;
                    state.crosshairY = world.y;
                }
                state.probeX = pos.x;
                state.probeY = pos.y;
                onWorldPointer();
            }
        });

        const endPointer = (event) => {
            pointers.delete(event.pointerId);
            if (pointers.size < 2) state.gesture = pointers.size === 1 ? { type: 'move' } : null;
            try { canvas.releasePointerCapture(event.pointerId); } catch (_e) {}
        };
        canvas.addEventListener('pointerup', endPointer);
        canvas.addEventListener('pointercancel', endPointer);
    }

    function bindStakeCanvasInteraction() {
        const canvas = global.document.getElementById('stakeSimCanvas');
        if (!canvas || canvas.dataset.opBound === '1') return;
        canvas.dataset.opBound = '1';
        bindViewportGestures(canvas, stakeState, redrawStakeFieldSimulator);
    }

    function bindElectricalCanvasInteraction() {
        const canvas = global.document.getElementById('electricalSimCanvas');
        if (!canvas || canvas.dataset.opBound === '1') return;
        canvas.dataset.opBound = '1';
        bindViewportGestures(canvas, electricalState, redrawElectricalFieldSimulator);
    }

    function simZoomIn(mode) {
        const state = mode === 'electrical' ? electricalState : stakeState;
        const canvas = global.document.getElementById(mode === 'electrical' ? 'electricalSimCanvas' : 'stakeSimCanvas');
        if (!canvas || !state.image) return;
        applyZoom(state.viewport, canvas, ZOOM_STEP);
        if (mode === 'electrical') redrawElectricalFieldSimulator();
        else redrawStakeFieldSimulator();
    }

    function simZoomOut(mode) {
        const state = mode === 'electrical' ? electricalState : stakeState;
        const canvas = global.document.getElementById(mode === 'electrical' ? 'electricalSimCanvas' : 'stakeSimCanvas');
        if (!canvas || !state.image) return;
        applyZoom(state.viewport, canvas, -ZOOM_STEP);
        if (mode === 'electrical') redrawElectricalFieldSimulator();
        else redrawStakeFieldSimulator();
    }

    function simZoomReset(mode) {
        const state = mode === 'electrical' ? electricalState : stakeState;
        state.viewport = createViewport();
        if (mode === 'electrical') redrawElectricalFieldSimulator();
        else redrawStakeFieldSimulator();
    }

    function onStakeImageSelected(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        readImageFile(file, (img) => {
            stakeState.image = img;
            resetStakeOperation();
            const stage = global.document.getElementById('stakeSimCanvas')?.closest('.field-simulator-stage');
            if (stage) stage.classList.add('field-simulator-stage--live');
            redrawStakeFieldSimulator();
        });
    }

    function onElectricalImageSelected(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        readImageFile(file, (img) => {
            electricalState.image = img;
            resetElectricalOperation();
            const stage = global.document.getElementById('electricalSimCanvas')?.closest('.field-simulator-stage');
            if (stage) stage.classList.add('field-simulator-stage--live');
            redrawElectricalFieldSimulator();
        });
    }

    function snapStakeCrosshairToTarget() {
        const layout = stakeState.layout;
        const active = getActiveStakeScreenPoint(layout);
        if (!active) return;
        stakeState.crosshairX = active.point.sx;
        stakeState.crosshairY = active.point.sy;
        redrawStakeFieldSimulator();
        toast(bmT('sim.stakeSnapped'));
    }

    function stakeSimMarkCurrentPoint() {
        const layout = stakeState.layout;
        const active = getActiveStakeScreenPoint(layout);
        if (!active) return toast(bmT('sim.stakeNeedPoints'));
        if (!isStakeAligned(layout)) return toast(bmT('sim.stakeNeedAlign'));
        stakeState.markedIds.add(active.point.id);
        stakeState.verified = false;
        if (stakeState.activeIndex < active.total - 1) stakeState.activeIndex += 1;
        const next = getActiveStakeScreenPoint(layout);
        if (next) {
            stakeState.crosshairX = next.point.sx;
            stakeState.crosshairY = next.point.sy;
        }
        redrawStakeFieldSimulator();
        toast(bmT('sim.stakeMarkedToast', { current: String(stakeState.markedIds.size), total: String(active.total) }));
    }

    function stakeSimPrevPoint() {
        if (!stakeState.layout || !stakeState.layout.screenPoints.length) return;
        stakeState.activeIndex = Math.max(0, stakeState.activeIndex - 1);
        const active = getActiveStakeScreenPoint(stakeState.layout);
        if (active) {
            stakeState.crosshairX = active.point.sx;
            stakeState.crosshairY = active.point.sy;
        }
        redrawStakeFieldSimulator();
    }

    function stakeSimNextPoint() {
        if (!stakeState.layout || !stakeState.layout.screenPoints.length) return;
        stakeState.activeIndex = Math.min(stakeState.layout.screenPoints.length - 1, stakeState.activeIndex + 1);
        const active = getActiveStakeScreenPoint(stakeState.layout);
        if (active) {
            stakeState.crosshairX = active.point.sx;
            stakeState.crosshairY = active.point.sy;
        }
        redrawStakeFieldSimulator();
    }

    function electricalSimMeasureVoltage() {
        if (!electricalState.image) return toast(bmT('sim.electricalNeedImage'));
        if (!electricalState.steps.probeSet) return toast(bmT('sim.electricalNeedProbe'));
        const params = readElectricalParams();
        const verdict = evaluateVoltage(params.voltage);
        if (verdict.level === 'bad') return toast(bmT('sim.electricalBadVoltage'));
        const jitter = (Math.random() - 0.5) * params.voltage * 0.015;
        electricalState.measuredValue = Math.round((params.voltage + jitter) * 10) / 10;
        electricalState.measureAnim = 0;
        electricalState.steps.measured = true;
        electricalState.verified = false;
        scheduleElectricalAnim();
        toast(bmT('sim.electricalMeasuredToast', { value: String(electricalState.measuredValue) }));
    }

    function electricalSimTestRelay() {
        if (!electricalState.steps.measured) return toast(bmT('sim.electricalNeedMeasure'));
        const params = readElectricalParams();
        electricalState.relayFlash = params.relay === 'ON' ? 'ON ⚡' : 'OFF ⛔';
        electricalState.steps.relayTested = true;
        electricalState.verified = false;
        redrawElectricalFieldSimulator();
        toast(bmT('sim.electricalRelayToast', { relay: params.relay }));
    }

    function confirmStakeFieldSimulator() {
        if (!stakeState.image) return toast(bmT('sim.stakeNeedImage'));
        const total = getStakePointsForSim().length;
        if (!total) return toast(bmT('sim.stakeNeedPoints'));
        if (stakeState.markedIds.size < total) return toast(bmT('sim.stakeNeedAllMarked'));
        stakeState.verified = true;
        redrawStakeFieldSimulator();
        toast(bmT('sim.stakeVerifiedToast'));
    }

    function confirmElectricalFieldSimulator() {
        if (!electricalState.image) return toast(bmT('sim.electricalNeedImage'));
        if (!electricalState.steps.probeSet) return toast(bmT('sim.electricalNeedProbe'));
        if (!electricalState.steps.measured) return toast(bmT('sim.electricalNeedMeasure'));
        if (!electricalState.steps.relayTested) return toast(bmT('sim.electricalNeedRelayTest'));
        const params = readElectricalParams();
        if (evaluateVoltage(params.voltage).level === 'bad') return toast(bmT('sim.electricalBadVoltage'));
        electricalState.verified = true;
        redrawElectricalFieldSimulator();
        toast(bmT('sim.electricalVerifiedToast'));
    }

    function requireStakeSimVerified() {
        if (stakeState.verified) return true;
        toast(bmT('sim.stakeNeedVerify'));
        return false;
    }

    function wrapStakeExportFunctions() {
        if (stakeExportsWrapped) return;
        ['exportBimLayoutPoints', 'exportBimLayoutQaReport', 'exportBimConstructionPackage'].forEach((name) => {
            const original = global[name];
            if (typeof original !== 'function') return;
            global[name] = function wrappedStakeExport(...args) {
                if (!requireStakeSimVerified()) return undefined;
                return original.apply(this, args);
            };
        });
        const genOriginal = global.generateBimLayoutPoints;
        if (typeof genOriginal === 'function') {
            global.generateBimLayoutPoints = function wrappedGenerateBimLayoutPoints(...args) {
                const result = genOriginal.apply(this, args);
                resetStakeOperation();
                redrawStakeFieldSimulator();
                return result;
            };
        }
        stakeExportsWrapped = true;
    }

    function bindStakeFieldSimulator() {
        if (stakeState.bound) return;
        global.document.getElementById('stakeSimImageInput')?.addEventListener('change', onStakeImageSelected);
        bindStakeCanvasInteraction();
        global.addEventListener('resize', () => {
            if (global.getCurrentWorkMode && global.getCurrentWorkMode() === 'stake') redrawStakeFieldSimulator();
        });
        stakeState.bound = true;
        wrapStakeExportFunctions();
        redrawStakeFieldSimulator();
    }

    function bindElectricalFieldSimulator() {
        if (electricalState.bound) return;
        global.document.getElementById('electricalSimImageInput')?.addEventListener('change', onElectricalImageSelected);
        bindElectricalCanvasInteraction();
        ['mechaVoltage', 'mechaCurrent'].forEach((id) => {
            global.document.getElementById(id)?.addEventListener('input', () => {
                resetElectricalOperation();
                redrawElectricalFieldSimulator();
            });
        });
        global.document.querySelectorAll('input[name="mechaRelayStatus"]').forEach((el) => {
            el.addEventListener('change', () => {
                resetElectricalOperation();
                redrawElectricalFieldSimulator();
            });
        });
        global.addEventListener('resize', () => {
            if (global.getCurrentWorkMode && global.getCurrentWorkMode() === 'electrical') redrawElectricalFieldSimulator();
        });
        electricalState.bound = true;
        redrawElectricalFieldSimulator();
    }

    function initStakeFieldSimulator() {
        bindStakeFieldSimulator();
        redrawStakeFieldSimulator();
    }

    function initElectricalFieldSimulator() {
        bindElectricalFieldSimulator();
        redrawElectricalFieldSimulator();
    }

    function toggleStakeSimCrosshair() {
        stakeState.showCrosshair = !stakeState.showCrosshair;
        redrawStakeFieldSimulator();
    }

    function toggleStakeSimPoints() {
        stakeState.showPoints = !stakeState.showPoints;
        redrawStakeFieldSimulator();
    }

    global.initStakeFieldSimulator = initStakeFieldSimulator;
    global.initElectricalFieldSimulator = initElectricalFieldSimulator;
    global.redrawStakeFieldSimulator = redrawStakeFieldSimulator;
    global.redrawElectricalFieldSimulator = redrawElectricalFieldSimulator;
    global.confirmStakeFieldSimulator = confirmStakeFieldSimulator;
    global.confirmElectricalFieldSimulator = confirmElectricalFieldSimulator;
    global.toggleStakeSimCrosshair = toggleStakeSimCrosshair;
    global.toggleStakeSimPoints = toggleStakeSimPoints;
    global.stakeSimMarkCurrentPoint = stakeSimMarkCurrentPoint;
    global.stakeSimPrevPoint = stakeSimPrevPoint;
    global.stakeSimNextPoint = stakeSimNextPoint;
    global.stakeSimSnapToTarget = snapStakeCrosshairToTarget;
    global.electricalSimMeasureVoltage = electricalSimMeasureVoltage;
    global.electricalSimTestRelay = electricalSimTestRelay;
    global.stakeSimZoomIn = () => simZoomIn('stake');
    global.stakeSimZoomOut = () => simZoomOut('stake');
    global.stakeSimZoomReset = () => simZoomReset('stake');
    global.electricalSimZoomIn = () => simZoomIn('electrical');
    global.electricalSimZoomOut = () => simZoomOut('electrical');
    global.electricalSimZoomReset = () => simZoomReset('electrical');
    global.isStakeSimulatorVerified = () => stakeState.verified;
    global.isElectricalSimulatorVerified = () => electricalState.verified;
})(typeof window !== 'undefined' ? window : globalThis);
