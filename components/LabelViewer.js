'use client';

// In-page viewer for label PDFs (shipping labels, packing slips, fulfilment sheets).
//
// Browsers differ a lot in showing / printing PDFs (iOS Safari and many Android
// browsers cannot show a PDF in a frame, and printing an embedded PDF is unreliable),
// so the PDF is drawn with pdf.js — the same rendering everywhere — and printing uses
// high-resolution page images in a print-only container sized to the PDF's own pages.
//
// The server deletes a label PDF after its first download, so the viewer works on the
// Blob that was already downloaded and never fetches it again.
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiDownload, FiExternalLink, FiPrinter, FiX, FiZoomIn, FiZoomOut } from 'react-icons/fi';
import styles from './css/labelViewer.module.css';

const PRINT_DPI = 300; // sharp barcodes on 203/300 dpi printers and office printers
const PT_PER_INCH = 72;

let pdfjsPromise = null;
function loadPdfjs() {
    if (!pdfjsPromise) {
        pdfjsPromise = import('pdfjs-dist').then((pdfjs) => {
            // served from /public (copied by the postinstall script) so it resolves the
            // same way under Turbopack and webpack
            pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
            return pdfjs;
        });
    }
    return pdfjsPromise;
}

function PageCanvas({ doc, pageNumber, zoom }) {
    const canvasRef = useRef(null);
    useEffect(() => {
        let cancelled = false;
        let task = null;
        (async () => {
            const page = await doc.getPage(pageNumber);
            if (cancelled) return;
            const canvas = canvasRef.current;
            const ratio = window.devicePixelRatio || 1;
            const cssWidth = Math.min(canvas.parentElement.clientWidth, 900) * zoom;
            const base = page.getViewport({ scale: 1 });
            const viewport = page.getViewport({ scale: (cssWidth / base.width) * ratio });
            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            canvas.style.width = `${Math.floor(viewport.width / ratio)}px`;
            canvas.style.height = `${Math.floor(viewport.height / ratio)}px`;
            task = page.render({ canvas, canvasContext: canvas.getContext('2d'), viewport });
            try {
                await task.promise;
            } catch (e) {
                // cancelled by a newer render (zoom / resize)
            }
        })();
        return () => {
            cancelled = true;
            if (task) task.cancel();
        };
    }, [doc, pageNumber, zoom]);
    return <canvas ref={canvasRef} className={styles.page} aria-label={`Page ${pageNumber}`} />;
}

/**
 * props:
 *   blob        the downloaded PDF (Blob)
 *   fileName    used for "Download"
 *   title       shown in the header ("Shipping label · 3 orders")
 *   onClose     () => void
 *   addNotification  the app's notification function
 */
export default function LabelViewer({ blob, fileName, title, onClose, addNotification }) {
    const [doc, setDoc] = useState(null);
    const [error, setError] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [printing, setPrinting] = useState(false);
    const [printPages, setPrintPages] = useState(null); // [{src, wIn, hIn}]
    const [blobUrl, setBlobUrl] = useState(null);

    // one object URL for the life of the viewer: download, "open in new tab" and the
    // built-in browser viewer fallback all use it
    useEffect(() => {
        const pdf = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
        const url = URL.createObjectURL(pdf);
        setBlobUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [blob]);

    useEffect(() => {
        let cancelled = false;
        let loaded = null;
        (async () => {
            try {
                const pdfjs = await loadPdfjs();
                const data = new Uint8Array(await blob.arrayBuffer());
                loaded = await pdfjs.getDocument({ data }).promise;
                if (!cancelled) setDoc(loaded);
            } catch (e) {
                console.error('LabelViewer: pdf.js failed', e);
                if (!cancelled) setError('Preview unavailable here — showing the browser PDF viewer.');
            }
        })();
        return () => {
            cancelled = true;
            if (loaded) loaded.destroy();
        };
    }, [blob]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        document.body.classList.add('label-viewer-open');
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.classList.remove('label-viewer-open');
        };
    }, [onClose]);

    const download = useCallback(() => {
        if (!blobUrl) return;
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName?.endsWith('.pdf') ? fileName : `${fileName || 'label'}.pdf`;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        link.remove();
    }, [blobUrl, fileName]);

    const openInTab = useCallback(() => {
        if (blobUrl) window.open(blobUrl, '_blank', 'noopener');
    }, [blobUrl]);

    // Pages → images at PRINT_DPI, then the browser prints only those, with @page set
    // to the PDF's page size (4x6 in or A4) and no margins.
    const print = useCallback(async () => {
        if (!doc || printing) return;
        setPrinting(true);
        try {
            const pages = [];
            for (let n = 1; n <= doc.numPages; n += 1) {
                const page = await doc.getPage(n);
                const viewport = page.getViewport({ scale: PRINT_DPI / PT_PER_INCH });
                const canvas = document.createElement('canvas');
                canvas.width = Math.floor(viewport.width);
                canvas.height = Math.floor(viewport.height);
                await page.render({ canvas, canvasContext: canvas.getContext('2d'), viewport }).promise;
                const base = page.getViewport({ scale: 1 });
                pages.push({
                    src: canvas.toDataURL('image/png'),
                    wIn: base.width / PT_PER_INCH,
                    hIn: base.height / PT_PER_INCH,
                });
                canvas.width = 0; // free memory early
            }
            setPrintPages(pages);
        } catch (e) {
            setPrinting(false);
            addNotification?.({ h2: 'Print', desc: 'The label could not be prepared for printing.', tag: 'error' });
        }
    }, [doc, printing, addNotification]);

    // once the print images are in the DOM and loaded, open the print dialog
    useEffect(() => {
        if (!printPages) return undefined;
        const images = Array.from(document.querySelectorAll(`.${styles.printRoot} img`));
        let done = false;
        const go = () => {
            if (done) return;
            done = true;
            const after = () => {
                setPrintPages(null);
                setPrinting(false);
                window.removeEventListener('afterprint', after);
            };
            window.addEventListener('afterprint', after);
            window.print();
            // browsers without afterprint (some mobile): clean up later
            setTimeout(after, 60000);
        };
        Promise.all(images.map((img) => (img.complete ? Promise.resolve() : new Promise((r) => { img.onload = r; img.onerror = r; }))))
            .then(() => setTimeout(go, 50));
        return undefined;
    }, [printPages]);

    const pageSizeCss = printPages && printPages.length
        ? `@page { size: ${printPages[0].wIn}in ${printPages[0].hIn}in; margin: 0; }`
        : '';

    const content = (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={title || 'Label'}>
            <div className={styles.sheet}>
                <div className={styles.head}>
                    <div className={styles.titleWrap}>
                        <strong className={styles.title}>{title || 'Label'}</strong>
                        <span className={styles.meta}>
                            {doc ? `${doc.numPages} page${doc.numPages === 1 ? '' : 's'}` : 'Loading…'}
                            {' · saved in this tab only — download to keep it'}
                        </span>
                    </div>
                    <div className={styles.actions}>
                        <button className={styles.iconBtn} onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))} aria-label="Zoom out"><FiZoomOut /></button>
                        <button className={styles.iconBtn} onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} aria-label="Zoom in"><FiZoomIn /></button>
                        <button className={styles.btn} onClick={openInTab} disabled={!blobUrl}><FiExternalLink /> <span>Open</span></button>
                        <button className={styles.btn} onClick={download} disabled={!blobUrl}><FiDownload /> <span>Download</span></button>
                        <button className={`${styles.btn} ${styles.primary}`} onClick={print} disabled={!doc || printing}>
                            <FiPrinter /> <span>{printing ? 'Preparing…' : 'Print'}</span>
                        </button>
                        <button className={styles.iconBtn} onClick={onClose} aria-label="Close"><FiX /></button>
                    </div>
                </div>
                <div className={styles.body}>
                    {error && <div className={styles.error}>{error} <button className={styles.btn} onClick={download}>Download</button></div>}
                    {error && blobUrl && (
                        <iframe src={blobUrl} title={title || 'Label'} style={{ width: '100%', height: '75vh', border: 0, background: '#fff' }} />
                    )}
                    {!error && !doc && <div className={styles.loading}>Loading label…</div>}
                    {doc && Array.from({ length: doc.numPages }, (_, i) => (
                        <PageCanvas key={i} doc={doc} pageNumber={i + 1} zoom={zoom} />
                    ))}
                </div>
            </div>
            {printPages && (
                <div className={styles.printRoot}>
                    <style>{`${pageSizeCss}
@media print {
  body.label-viewer-open > *:not(.${styles.printHost}) { display: none !important; }
}`}</style>
                    {printPages.map((p, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={p.src} alt="" style={{ width: `${p.wIn}in`, height: `${p.hIn}in` }} />
                    ))}
                </div>
            )}
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(<div className={styles.printHost}>{content}</div>, document.body);
}
