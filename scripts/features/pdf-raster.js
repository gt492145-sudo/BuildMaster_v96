(function initBuildMasterPdfRaster(global) {
    'use strict';

    const MAX_PDF_BYTES = 25 * 1024 * 1024;
    const MAX_RENDER_SIDE = 4096;

    function hasNativePdfRaster() {
        try {
            return !!(global.webkit
                && global.webkit.messageHandlers
                && global.webkit.messageHandlers.bmRasterizePdf);
        } catch (_e) {
            return false;
        }
    }

    function ensurePdfJs() {
        if (global.pdfjsLib) {
            if (!global.pdfjsLib.GlobalWorkerOptions.workerSrc) {
                global.pdfjsLib.GlobalWorkerOptions.workerSrc = 'scripts/vendor/pdf.worker.min.js';
            }
            return Promise.resolve(global.pdfjsLib);
        }
        return Promise.reject(new Error('PDFJS_UNAVAILABLE'));
    }

    function rasterizePdfArrayBufferViaPdfJs(arrayBuffer, pageNumber) {
        return ensurePdfJs().then(function (pdfjsLib) {
            return pdfjsLib.getDocument({ data: arrayBuffer }).promise.then(function (pdf) {
                const pageIndex = Math.max(1, Math.min(Number(pageNumber) || 1, pdf.numPages));
                return pdf.getPage(pageIndex).then(function (page) {
                    const baseViewport = page.getViewport({ scale: 1 });
                    const maxSide = Math.max(baseViewport.width, baseViewport.height);
                    const scale = maxSide > MAX_RENDER_SIDE ? (MAX_RENDER_SIDE / maxSide) : 1;
                    const viewport = page.getViewport({ scale: scale });
                    const canvas = global.document.createElement('canvas');
                    canvas.width = Math.floor(viewport.width);
                    canvas.height = Math.floor(viewport.height);
                    const ctx = canvas.getContext('2d');
                    if (!ctx) throw new Error('PDF_CANVAS_FAILED');
                    return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function () {
                        return {
                            dataUrl: canvas.toDataURL('image/png'),
                            pageCount: pdf.numPages,
                            pageIndex: pageIndex
                        };
                    });
                });
            });
        });
    }

    function rasterizePdfViaNative(file, pageNumber) {
        return new Promise(function (resolve, reject) {
            const reader = new FileReader();
            reader.onerror = function () { reject(new Error('PDF_READ_FAILED')); };
            reader.onload = function () {
                const dataUrl = String(reader.result || '');
                if (!dataUrl) {
                    reject(new Error('PDF_READ_FAILED'));
                    return;
                }
                const requestId = 'pdf_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
                global.__bmPdfRasterWaiters = global.__bmPdfRasterWaiters || {};
                global.__bmPdfRasterWaiters[requestId] = { resolve: resolve, reject: reject };
                global.setTimeout(function () {
                    if (!global.__bmPdfRasterWaiters || !global.__bmPdfRasterWaiters[requestId]) return;
                    delete global.__bmPdfRasterWaiters[requestId];
                    reject(new Error('PDF_NATIVE_TIMEOUT'));
                }, 45000);
                try {
                    global.webkit.messageHandlers.bmRasterizePdf.postMessage({
                        requestId: requestId,
                        dataUrl: dataUrl,
                        page: Number(pageNumber) || 1,
                        maxSide: MAX_RENDER_SIDE
                    });
                } catch (error) {
                    delete global.__bmPdfRasterWaiters[requestId];
                    reject(error);
                }
            };
            reader.readAsDataURL(file);
        });
    }

    global.__bmOnPdfRasterResult = function __bmOnPdfRasterResult(result) {
        const payload = result || {};
        const requestId = String(payload.requestId || '');
        const waiters = global.__bmPdfRasterWaiters || {};
        const waiter = waiters[requestId];
        if (!waiter) return;
        delete waiters[requestId];
        if (payload.ok) {
            waiter.resolve({
                dataUrl: String(payload.dataUrl || ''),
                pageCount: Number(payload.pageCount) || 1,
                pageIndex: Number(payload.pageIndex) || 1
            });
        } else {
            waiter.reject(new Error(String(payload.detail || 'PDF_NATIVE_FAILED')));
        }
    };

    function rasterizePdfFile(file, options) {
        const pageNumber = options && options.page ? Number(options.page) : 1;
        if (!file) return Promise.reject(new Error('PDF_MISSING'));
        if (file.size > MAX_PDF_BYTES) return Promise.reject(new Error('PDF_TOO_LARGE'));
        const isPdf = /\.pdf$/i.test(String(file.name || '')) || String(file.type || '').toLowerCase() === 'application/pdf';
        if (!isPdf) return Promise.reject(new Error('PDF_NOT_PDF'));

        if (hasNativePdfRaster()) {
            return file.arrayBuffer()
                .then(function (buffer) {
                    return rasterizePdfArrayBufferViaPdfJs(buffer, pageNumber);
                })
                .catch(function () {
                    return rasterizePdfViaNative(file, pageNumber);
                });
        }
        return file.arrayBuffer().then(function (buffer) {
            return rasterizePdfArrayBufferViaPdfJs(buffer, pageNumber);
        });
    }

    global.BuildMasterPdfRaster = {
        rasterizeFile: rasterizePdfFile,
        hasNative: hasNativePdfRaster
    };
}(typeof window !== 'undefined' ? window : globalThis));
