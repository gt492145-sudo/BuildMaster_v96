(function initBuildMasterReportPdfExport(global) {
    'use strict';

    function bmT(key, vars) {
        return (typeof global.BM_T === 'function') ? global.BM_T(key, vars) : key;
    }

    function ensureJsPdf() {
        if (global.jspdf && global.jspdf.jsPDF) return Promise.resolve(global.jspdf.jsPDF);
        return Promise.reject(new Error('JSPDF_UNAVAILABLE'));
    }

    function readBlueprintImageData() {
        const img = global.document.getElementById('blueprint');
        if (!img || !img.src || String(img.src).indexOf('data:image') !== 0) return null;
        const width = Number(img.naturalWidth) || 0;
        const height = Number(img.naturalHeight) || 0;
        if (width < 8 || height < 8) return null;
        const mimeMatch = String(img.src).match(/^data:(image\/[a-zA-Z0-9+.-]+);/);
        const format = mimeMatch && mimeMatch[1] ? mimeMatch[1].split('/')[1].toUpperCase().replace('JPEG', 'JPEG') : 'PNG';
        return { src: String(img.src), width: width, height: height, format: format === 'JPG' ? 'JPEG' : format };
    }

    function fitImageToPage(imgWidth, imgHeight, pageWidth, pageHeight, margin) {
        const maxW = pageWidth - margin * 2;
        const maxH = pageHeight - margin * 2;
        const ratio = Math.min(maxW / imgWidth, maxH / imgHeight, 1);
        const drawW = imgWidth * ratio;
        const drawH = imgHeight * ratio;
        return {
            x: margin + (maxW - drawW) / 2,
            y: margin + (maxH - drawH) / 2,
            w: drawW,
            h: drawH
        };
    }

    function exportToPDF() {
        const rows = Array.isArray(global.list) ? global.list : [];
        if (!rows.length && !readBlueprintImageData()) {
            if (typeof global.showToast === 'function') {
                global.showToast(bmT('toast.noExportData'));
            }
            return false;
        }

        return ensureJsPdf().then(function (jsPDF) {
            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 12;
            let y = margin;

            doc.setFontSize(15);
            doc.text('Construction Master', margin, y);
            y += 7;
            doc.setFontSize(11);
            doc.text(bmT('page2.exportPdfTitle'), margin, y);
            y += 8;
            doc.setFontSize(9);
            doc.text(new Date().toLocaleString('zh-TW'), margin, y);
            y += 8;

            if (rows.length) {
                doc.setFont(undefined, 'bold');
                doc.text(bmT('page2.exportPdfTableHead'), margin, y);
                y += 6;
                doc.setFont(undefined, 'normal');
                rows.forEach(function (item) {
                    const line = [
                        String(item.floor || ''),
                        String(item.name || ''),
                        String(Number(item.res || 0).toFixed(2)),
                        String(item.unit || ''),
                        String(Math.round(Number(item.totalCost || 0)))
                    ].join(' | ');
                    const wrapped = doc.splitTextToSize(line, pageWidth - margin * 2);
                    wrapped.forEach(function (part) {
                        if (y > pageHeight - margin) {
                            doc.addPage();
                            y = margin;
                        }
                        doc.text(part, margin, y);
                        y += 5;
                    });
                });
                const totalEl = global.document.getElementById('totalMoney');
                const totalText = totalEl ? String(totalEl.innerText || '').trim() : '';
                if (totalText) {
                    y += 2;
                    if (y > pageHeight - margin) {
                        doc.addPage();
                        y = margin;
                    }
                    doc.setFont(undefined, 'bold');
                    doc.text(bmT('page2.exportPdfTotal', { total: totalText }), margin, y);
                }
            }

            const blueprint = readBlueprintImageData();
            if (blueprint) {
                doc.addPage();
                doc.setFontSize(12);
                doc.text(bmT('page2.exportPdfBlueprintPage'), margin, margin);
                const box = fitImageToPage(blueprint.width, blueprint.height, pageWidth, pageHeight, margin + 8);
                doc.addImage(blueprint.src, blueprint.format, box.x, box.y + 4, box.w, box.h, undefined, 'FAST');
            }

            doc.save('ConstructionMaster_' + new Date().getTime() + '.pdf');
            if (typeof global.showToast === 'function') {
                global.showToast(bmT('toast.pdfDownloaded'));
            }
            if (typeof global.recordRatingEngagement === 'function') {
                global.recordRatingEngagement('export_report_pdf');
            }
            return true;
        }).catch(function () {
            if (typeof global.showToast === 'function') {
                global.showToast(bmT('toast.pdfExportFailed'));
            }
            return false;
        });
    }

    global.exportToPDF = exportToPDF;
}(typeof window !== 'undefined' ? window : globalThis));
