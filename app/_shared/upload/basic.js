'use client';

import { memo, useState, useRef, useCallback, useEffect, useMemo } from 'react';
import config from '../../../utils/config';
import styles from './css/basic.module.css';
import { ImSpinner2 } from 'react-icons/im';
import {
    MdFormatBold, MdFormatItalic, MdFormatUnderlined,
    MdFormatListBulleted, MdFormatListNumbered,
    MdImage, MdVideoLibrary, MdFormatQuote,
    MdSave, MdFormatAlignLeft, MdFormatAlignCenter, MdFormatAlignRight,
    MdDeleteOutline, MdCrop,
} from 'react-icons/md';
import { RiH1, RiH2, RiH3, RiParagraph } from 'react-icons/ri';
import { BsTypeH4 } from 'react-icons/bs';
import {
    MdTitle, MdInventory2, MdWarehouse, MdSubtitles,
    MdLocalOffer, MdCategory, MdSearch
} from 'react-icons/md';

// ─────────────────────────────────────────────────────────────
// Tiny debounce helper
// ─────────────────────────────────────────────────────────────
function debounce(fn, ms) {
    let timer;
    const debounced = (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
    debounced.cancel = () => clearTimeout(timer);
    return debounced;
}

// ─────────────────────────────────────────────────────────────
// Alignment helpers
// ─────────────────────────────────────────────────────────────
const ALIGN_MARGINS = {
    left: { marginLeft: '0', marginRight: 'auto' },
    center: { marginLeft: 'auto', marginRight: 'auto' },
    right: { marginLeft: 'auto', marginRight: '0' },
};

function applyMediaAlign(el, align) {
    const { marginLeft, marginRight } = ALIGN_MARGINS[align] ?? ALIGN_MARGINS.left;
    el.style.display = 'block';
    el.style.float = 'none';
    el.style.marginLeft = marginLeft;
    el.style.marginRight = marginRight;
    el.style.marginTop = '8px';
    el.style.marginBottom = '8px';
}

// ─────────────────────────────────────────────────────────────
// cleanHTML — guard paragraphs inside blockquotes
// ─────────────────────────────────────────────────────────────
function cleanHTML(container) {
    const spans = container.querySelectorAll('span');
    spans.forEach(span => {
        if (!span.attributes.length) {
            const text = span.textContent || '';
            if (!text.trim()) { span.remove(); return; }
        }
        if (span.attributes.length === 1 && span.hasAttribute('style')) {
            const style = span.getAttribute('style') || '';
            const cleaned = style.replace(/\s/g, '');
            if (
                !cleaned ||
                cleaned === 'font-weight:normal' ||
                cleaned === 'font-style:normal' ||
                cleaned === 'text-decoration:none' ||
                cleaned === 'font-weight:normal;font-style:normal;text-decoration:none'
            ) {
                while (span.firstChild) span.parentNode.insertBefore(span.firstChild, span);
                span.remove();
                return;
            }
        }
    });

    const paragraphs = container.querySelectorAll('p');
    paragraphs.forEach(p => {
        if (p.closest('blockquote')) return;
        if (!p.textContent.trim() && !p.querySelector('img, video, br')) p.remove();
    });

    return container;
}

// ─────────────────────────────────────────────────────────────
// ImageCropModal — canvas-based crop UI
// ─────────────────────────────────────────────────────────────
const ImageCropModal = ({ src, onSave, onCancel }) => {
    const canvasRef = useRef(null);
    const imgRef = useRef(null);
    const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
    const [dragging, setDragging] = useState(false);
    const [startPos, setStartPos] = useState(null);
    const [imgLoaded, setImgLoaded] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            imgRef.current = img;
            setImgLoaded(true);
        };
        img.src = src;
    }, [src]);

    useEffect(() => {
        if (!imgLoaded || !canvasRef.current || !imgRef.current) return;
        const canvas = canvasRef.current;
        const img = imgRef.current;
        const maxW = containerRef.current?.clientWidth || 600;
        const scale = Math.min(1, maxW / img.naturalWidth);
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        if (crop.w > 0 && crop.h > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img,
                (crop.x / canvas.width) * img.naturalWidth,
                (crop.y / canvas.height) * img.naturalHeight,
                (crop.w / canvas.width) * img.naturalWidth,
                (crop.h / canvas.height) * img.naturalHeight,
                crop.x, crop.y, crop.w, crop.h
            );
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.strokeRect(crop.x, crop.y, crop.w, crop.h);
            // Rule-of-thirds guides
            ctx.strokeStyle = 'rgba(59,130,246,0.4)';
            ctx.lineWidth = 0.5;
            for (let i = 1; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(crop.x + (crop.w / 3) * i, crop.y);
                ctx.lineTo(crop.x + (crop.w / 3) * i, crop.y + crop.h);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(crop.x, crop.y + (crop.h / 3) * i);
                ctx.lineTo(crop.x + crop.w, crop.y + (crop.h / 3) * i);
                ctx.stroke();
            }
        }
    }, [imgLoaded, crop]);

    const getPos = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: Math.max(0, Math.min(canvas.width, clientX - rect.left)),
            y: Math.max(0, Math.min(canvas.height, clientY - rect.top)),
        };
    };

    const onMouseDown = (e) => {
        e.preventDefault();
        const pos = getPos(e, canvasRef.current);
        setStartPos(pos);
        setDragging(true);
        setCrop({ x: pos.x, y: pos.y, w: 0, h: 0 });
    };

    const onMouseMove = (e) => {
        if (!dragging || !startPos) return;
        e.preventDefault();
        const pos = getPos(e, canvasRef.current);
        setCrop({
            x: Math.min(startPos.x, pos.x),
            y: Math.min(startPos.y, pos.y),
            w: Math.abs(pos.x - startPos.x),
            h: Math.abs(pos.y - startPos.y),
        });
    };

    const onMouseUp = () => setDragging(false);

    const handleSave = () => {
        if (!imgRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const img = imgRef.current;
        const scaleX = img.naturalWidth / canvas.width;
        const scaleY = img.naturalHeight / canvas.height;

        const outW = crop.w > 10 ? Math.round(crop.w * scaleX) : img.naturalWidth;
        const outH = crop.h > 10 ? Math.round(crop.h * scaleY) : img.naturalHeight;
        const srcX = crop.w > 10 ? Math.round(crop.x * scaleX) : 0;
        const srcY = crop.h > 10 ? Math.round(crop.y * scaleY) : 0;

        const out = document.createElement('canvas');
        out.width = outW;
        out.height = outH;
        out.getContext('2d').drawImage(img, srcX, srcY, outW, outH, 0, 0, outW, outH);
        out.toBlob(blob => onSave(blob), 'image/png', 0.92);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.65)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
        }}>
            <div style={{
                background: '#1e1e1e', borderRadius: 12, padding: 20,
                maxWidth: '90vw', maxHeight: '90vh', display: 'flex',
                flexDirection: 'column', gap: 12,
            }}>
                <p style={{ color: '#ccc', fontSize: 13, margin: 0 }}>
                    Drag to select a crop area. Leave empty to use full image.
                </p>
                <div ref={containerRef} style={{ overflow: 'auto', maxHeight: '65vh' }}>
                    <canvas
                        ref={canvasRef}
                        style={{ cursor: 'crosshair', display: 'block', maxWidth: '100%', userSelect: 'none' }}
                        onMouseDown={onMouseDown}
                        onMouseMove={onMouseMove}
                        onMouseUp={onMouseUp}
                        onMouseLeave={onMouseUp}
                        onTouchStart={onMouseDown}
                        onTouchMove={onMouseMove}
                        onTouchEnd={onMouseUp}
                    />
                </div>
                {crop.w > 0 && crop.h > 0 && (
                    <p style={{ color: '#888', fontSize: 12, margin: 0 }}>
                        Crop: {Math.round(crop.w)} × {Math.round(crop.h)}px
                    </p>
                )}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onCancel}
                        style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid #555', background: 'transparent', color: '#ccc', cursor: 'pointer', fontSize: 13 }}>
                        Cancel
                    </button>
                    <button type="button" onClick={handleSave}
                        style={{ padding: '7px 16px', borderRadius: 6, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                        Apply Crop
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// ImageControls — slider resize (10–100%) + align + crop + delete
// ─────────────────────────────────────────────────────────────
const ImageControls = ({ el, onClose, onDelete, onCrop, containerRef }) => {
    if (!el) return null;

    const currentPct = parseInt(el.style.width, 10) || 60;
    const [pct, setPct] = useState(currentPct);

    const handleSlider = (e) => {
        const v = Number(e.target.value);
        setPct(v);
        el.style.width = v + '%';
        el.style.height = 'auto';
    };

    return (
        <div
            ref={containerRef}
            style={{
                display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8,
                padding: '8px 10px', background: '#1e1e2e', borderRadius: 8,
                border: '1px solid #374151', marginBottom: 6,
            }}
            onMouseDown={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
        >
            {/* Size slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 160px' }}>
                <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>SIZE</span>
                <input
                    type="range" min={10} max={100} step={1} value={pct}
                    onChange={handleSlider}
                    style={{ flex: 1, accentColor: '#3b82f6', minWidth: 80 }}
                />
                <span style={{ fontSize: 12, color: '#e2e8f0', minWidth: 34, textAlign: 'right' }}>{pct}%</span>
            </div>

            <div style={{ width: 1, height: 20, background: '#374151' }} />

            {/* Alignment */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>ALIGN</span>
                {['left', 'center', 'right'].map(a => (
                    <button key={a} type="button" title={a}
                        onClick={() => applyMediaAlign(el, a)}
                        style={{ padding: '3px 6px', borderRadius: 4, border: '1px solid #374151', background: 'transparent', color: '#d1d5db', cursor: 'pointer', fontSize: 13 }}>
                        {a === 'left' ? '⇤' : a === 'center' ? '⇔' : '⇥'}
                    </button>
                ))}
            </div>

            <div style={{ width: 1, height: 20, background: '#374151' }} />

            {/* Crop */}
            <button type="button" title="Crop image" onClick={onCrop}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, border: '1px solid #374151', background: 'transparent', color: '#60a5fa', cursor: 'pointer', fontSize: 12 }}>
                <MdCrop size={14} /> Crop
            </button>

            {/* Delete */}
            <button type="button" title="Remove" onClick={onDelete}
                style={{ padding: '3px 7px', borderRadius: 4, border: '1px solid #374151', background: 'transparent', color: '#f87171', cursor: 'pointer' }}>
                <MdDeleteOutline size={14} />
            </button>

            {/* Close */}
            <button type="button" onClick={onClose}
                style={{ padding: '3px 7px', borderRadius: 4, border: '1px solid #374151', background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontSize: 12 }}>
                ✕
            </button>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// ToolBtn
// ─────────────────────────────────────────────────────────────
const ToolBtn = ({ title, onClick, children, active, disabled, className = '' }) => (
    <button
        type="button"
        title={title}
        onClick={onClick}
        disabled={disabled}
        className={[
            styles.toolBtn,
            active ? styles.toolBtnActive : '',
            disabled ? styles.toolBtnDisabled : '',
            className,
        ].filter(Boolean).join(' ')}
    >
        {children}
    </button>
);

const Sep = () => <div className={styles.toolDivider} />;

// ─────────────────────────────────────────────────────────────
// Helper: convert a blockquote direct-child node into a plain
// block element (<p> or its original tag if already a block).
// ─────────────────────────────────────────────────────────────
function toPlainBlock(node) {
    const BLOCK_TAGS = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'ul', 'ol', 'pre'];
    if (node.nodeType !== Node.ELEMENT_NODE) {
        const p = document.createElement('p');
        p.appendChild(node.cloneNode(true));
        return p;
    }
    const tag = node.nodeName.toLowerCase();
    if (BLOCK_TAGS.includes(tag)) return node.cloneNode(true);
    const p = document.createElement('p');
    p.appendChild(node.cloneNode(true));
    return p;
}

// ─────────────────────────────────────────────────────────────
// Helper: split blockquote children into before / mid / after
// relative to the user's selection range.
// Skips pure-whitespace text nodes (they aren't real lines).
// ─────────────────────────────────────────────────────────────
function classifyBQChildren(bqEl, range) {
    const before = [], mid = [], after = [];
    Array.from(bqEl.childNodes).forEach(child => {
        if (child.nodeType === Node.TEXT_NODE && !child.textContent.trim()) return;
        let inSel = false;
        try {
            // intersectsNode is reliable and simple
            inSel = range.intersectsNode(child);
        } catch { return; }
        if (inSel) {
            mid.push(child);
        } else {
            // Use document order: if child comes before the selection start → before, else → after
            const pos = range.comparePoint
                ? range.comparePoint(child, 0)
                : (range.startContainer.compareDocumentPosition(child) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
            if (pos > 0) after.push(child);
            else before.push(child);
        }
    });
    return { before, mid, after };
}

// ─────────────────────────────────────────────────────────────
// Rich Description Editor
// ─────────────────────────────────────────────────────────────
const DescriptionEditor = ({
    auth, session_id, value, onChange, addNotification, setFullPageLoading,
}) => {
    const editorRef = useRef(null);
    const imageInputRef = useRef(null);
    const videoInputRef = useRef(null);
    const pendingMedia = useRef(new Map());
    const lastWrittenRef = useRef('');
    const userEditedRef = useRef(false);
    const preBlockquoteState = useRef(null);

    const imgControlsRef = useRef(null);

    const [isSaving, setIsSaving] = useState(false);
    const [activeImgEl, setActiveImgEl] = useState(null);
    const [activeFormats, setActiveFormats] = useState({});
    const [pendingCount, setPendingCount] = useState(0);
    const [hasSelection, setHasSelection] = useState(false);
    const [selectedTextCase, setSelectedTextCase] = useState(null);
    const [cropSrc, setCropSrc] = useState(null);
    const [cropTargetEl, setCropTargetEl] = useState(null);

    // ── Inject server HTML ────────────────────────────────────
    useEffect(() => {
        if (userEditedRef.current) return;
        if (!editorRef.current) return;
        if (!value || typeof value !== 'string') return;
        const trimmed = value.trim();
        if (!trimmed) return;
        if (trimmed === lastWrittenRef.current) return;
        editorRef.current.innerHTML = value;
        lastWrittenRef.current = trimmed;
    }, [value]);

    // ── Revoke blob URLs on unmount ───────────────────────────
    useEffect(() => {
        return () => {
            pendingMedia.current.forEach((_val, tempId) => {
                const el = editorRef.current?.querySelector(`#${tempId}`);
                const src = el?.src || el?.querySelector('source')?.src;
                if (src?.startsWith('blob:')) URL.revokeObjectURL(src);
            });
        };
    }, []);

    // ── Click outside image → deselect ───────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (!activeImgEl) return;
            const clickedImg = e.target === activeImgEl;
            const clickedControls = imgControlsRef.current?.contains(e.target);
            if (!clickedImg && !clickedControls) {
                activeImgEl.classList.remove(styles.imgSelected);
                setActiveImgEl(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [activeImgEl]);

    // ── Read current format state ─────────────────────────────
    const updateFormats = useCallback(() => {
        if (!editorRef.current) return;
        const active = document.activeElement;
        const editorHasFocus = editorRef.current === active || editorRef.current.contains(active);
        const sel = window.getSelection();
        const selInEditor = sel && sel.rangeCount > 0 &&
            editorRef.current.contains(sel.getRangeAt(0).commonAncestorContainer);
        if (!editorHasFocus && !selInEditor) return;

        const hasSel = sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed && selInEditor;
        setHasSelection(!!hasSel);

        if (hasSel) {
            const selectedText = sel.toString();
            if (selectedText && selectedText.trim() && /[a-zA-Z]/.test(selectedText)) {
                const isAllUpper = selectedText === selectedText.toUpperCase();
                const isAllLower = selectedText === selectedText.toLowerCase();
                setSelectedTextCase(isAllUpper ? 'upper' : isAllLower ? 'lower' : 'mixed');
            } else {
                setSelectedTextCase(null);
            }
        } else {
            setSelectedTextCase(null);
        }

        const q = (cmd) => { try { return document.queryCommandState(cmd); } catch { return false; } };

        let headingTag = null;
        if (sel && sel.rangeCount > 0) {
            let node = sel.getRangeAt(0).startContainer;
            while (node && node !== editorRef.current) {
                const name = node.nodeName;
                if (name === 'H1') { headingTag = 'h1'; break; }
                if (name === 'H2') { headingTag = 'h2'; break; }
                if (name === 'H3') { headingTag = 'h3'; break; }
                if (name === 'H4') { headingTag = 'h4'; break; }
                if (name === 'P') { headingTag = 'p'; break; }
                node = node.parentElement;
            }
        }

        const blockVal = (() => { try { return document.queryCommandValue('formatBlock').toLowerCase(); } catch { return ''; } })();
        const isParagraph = headingTag === 'p' || blockVal === 'p' ||
            (!headingTag && !['h1', 'h2', 'h3', 'h4', 'blockquote', 'pre'].includes(blockVal));

        let inBlockquote = false;
        if (sel && sel.rangeCount > 0) {
            let node = sel.getRangeAt(0).startContainer;
            if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
            while (node && node !== editorRef.current) {
                if (node.nodeName === 'BLOCKQUOTE') { inBlockquote = true; break; }
                node = node.parentElement;
            }
        }

        let liAlign = null;
        if (sel && sel.rangeCount > 0) {
            let node = sel.getRangeAt(0).startContainer;
            while (node && node !== editorRef.current) {
                if (node.nodeName === 'LI') { liAlign = node.style?.textAlign || null; break; }
                node = node.parentElement;
            }
        }
        const inList = liAlign !== null;

        setActiveFormats({
            bold: q('bold'),
            italic: q('italic'),
            underline: q('underline'),
            alignLeft: inList ? (liAlign === '' || liAlign === 'left' || !liAlign) : q('justifyLeft'),
            alignCenter: inList ? liAlign === 'center' : q('justifyCenter'),
            alignRight: inList ? liAlign === 'right' : q('justifyRight'),
            orderedList: q('insertOrderedList'),
            unorderedList: q('insertUnorderedList'),
            h1: headingTag === 'h1',
            h2: headingTag === 'h2',
            h3: headingTag === 'h3',
            h4: headingTag === 'h4',
            paragraph: isParagraph && !headingTag ? true : headingTag === 'p',
            blockquote: inBlockquote,
        });
    }, []);

    const updateFormatsDebounced = useMemo(
        () => debounce(updateFormats, 60),
        [updateFormats]
    );

    useEffect(() => {
        document.addEventListener('selectionchange', updateFormatsDebounced);
        return () => {
            updateFormatsDebounced.cancel();
            document.removeEventListener('selectionchange', updateFormatsDebounced);
        };
    }, [updateFormatsDebounced]);

    // ── Sync HTML → parent ────────────────────────────────────
    const syncContent = useCallback(() => {
        if (!editorRef.current) return;
        const html = editorRef.current.innerHTML;
        const normalized = (html === '' || html === '<br>') ? '' : html;
        if (!userEditedRef.current && normalized.trim() === lastWrittenRef.current) return;
        onChange({ target: { id: 'description', value: normalized } });
    }, [onChange]);

    const cleanAndSync = useCallback(() => {
        if (!editorRef.current) return;
        const cleaned = editorRef.current.cloneNode(true);
        cleanHTML(cleaned);

        if (cleaned.innerHTML !== editorRef.current.innerHTML) {
            const sel = window.getSelection();
            const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
            editorRef.current.innerHTML = cleaned.innerHTML;
            if (range && editorRef.current.contains(range.commonAncestorContainer)) {
                try {
                    sel.removeAllRanges();
                    sel.addRange(range);
                } catch {
                    const newRange = document.createRange();
                    newRange.selectNodeContents(editorRef.current);
                    newRange.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(newRange);
                }
            }
        }
        syncContent();
    }, [syncContent]);

    // ── Toolbar helpers ───────────────────────────────────────
    const cmd = useCallback((command, val = null) => {
        editorRef.current?.focus();
        try { document.execCommand(command, false, val); }
        catch (e) { console.warn('Command failed:', command, e); }
        setTimeout(() => { if (editorRef.current) cleanHTML(editorRef.current); }, 0);
        syncContent();
        requestAnimationFrame(updateFormats);
    }, [syncContent, updateFormats]);

    const applyBlockFormat = useCallback((tag) => {
        const editor = editorRef.current;
        if (!editor) return;
        editor.focus();

        const sel = window.getSelection();
        const hasSel = sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed &&
            editor.contains(sel.getRangeAt(0).commonAncestorContainer);

        if (!hasSel) {
            let currentTag = 'p';
            if (sel && sel.rangeCount > 0) {
                let node = sel.getRangeAt(0).startContainer;
                if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
                while (node && node !== editor) {
                    const t = node.nodeName.toLowerCase();
                    if (['p', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'pre'].includes(t)) {
                        currentTag = t;
                        break;
                    }
                    node = node.parentElement;
                }
            }
            const targetTag = currentTag === tag ? 'p' : tag;
            document.execCommand('formatBlock', false, targetTag);
        } else {
            const range = sel.getRangeAt(0);
            const blocks = [];
            const topLevelElements = editor.querySelectorAll(
                ':scope > p, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > div, :scope > blockquote, :scope > ul, :scope > ol'
            );

            topLevelElements.forEach(block => {
                if (block.closest('blockquote') && block !== editor.querySelector(':scope > blockquote')) return;
                if (range.intersectsNode(block)) blocks.push(block);
            });

            if (blocks.length > 0) {
                const allMatchTarget = blocks.every(b => b.tagName.toLowerCase() === tag);
                const targetTag = allMatchTarget ? 'p' : tag;
                blocks.forEach(block => {
                    if (block.tagName.toLowerCase() === targetTag) return;
                    const newEl = document.createElement(targetTag);
                    while (block.firstChild) newEl.appendChild(block.firstChild);
                    Array.from(block.attributes).forEach(attr => {
                        if (attr.name !== 'id' && attr.name !== 'class')
                            newEl.setAttribute(attr.name, attr.value);
                    });
                    block.parentNode.replaceChild(newEl, block);
                });
            } else {
                document.execCommand('formatBlock', false, tag);
            }
        }

        setTimeout(() => { if (editorRef.current) cleanHTML(editorRef.current); }, 0);
        syncContent();
        requestAnimationFrame(updateFormats);
    }, [syncContent, updateFormats]);

    const convertToParagraph = useCallback(() => applyBlockFormat('p'), [applyBlockFormat]);
    const insertHeading = useCallback((tag) => applyBlockFormat(tag), [applyBlockFormat]);

    // ── Case transform ────────────────────────────────────────
    const transformCase = useCallback((toUpper) => {
        const editor = editorRef.current;
        if (!editor) return;
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.getRangeAt(0).collapsed) return;
        const range = sel.getRangeAt(0);
        if (!editor.contains(range.commonAncestorContainer)) return;
        const selectedText = range.toString();
        if (!selectedText.trim()) return;

        const isAllUpper = /[a-zA-Z]/.test(selectedText) && selectedText === selectedText.toUpperCase();
        const isAllLower = /[a-zA-Z]/.test(selectedText) && selectedText === selectedText.toLowerCase();
        if (toUpper && isAllUpper) return;
        if (!toUpper && isAllLower) return;

        const transformed = toUpper ? selectedText.toUpperCase() : selectedText.toLowerCase();
        editor.focus();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('delete', false);
        document.execCommand('insertText', false, transformed);
        syncContent();
        requestAnimationFrame(updateFormats);
    }, [syncContent, updateFormats]);

    // ── Alignment ─────────────────────────────────────────────
    const applyAlign = useCallback((align) => {
        const editor = editorRef.current;
        if (!editor) return;
        editor.focus();

        const effectiveAlign =
            (align === 'left' && activeFormats.alignLeft) ||
                (align === 'center' && activeFormats.alignCenter) ||
                (align === 'right' && activeFormats.alignRight)
                ? 'left' : align;

        const cmdMap = { left: 'justifyLeft', center: 'justifyCenter', right: 'justifyRight' };
        document.execCommand(cmdMap[effectiveAlign], false, null);

        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const liSet = new Set();
            const walkUp = (node) => {
                let n = node;
                while (n && n !== editor) {
                    if (n.nodeName === 'LI') { liSet.add(n); break; }
                    n = n.parentElement;
                }
            };
            walkUp(range.startContainer);
            walkUp(range.endContainer);
            editor.querySelectorAll('li').forEach(li => { if (range.intersectsNode(li)) liSet.add(li); });
            liSet.forEach(li => {
                if (effectiveAlign === 'left') {
                    li.style.removeProperty('text-align');
                } else {
                    li.style.textAlign = effectiveAlign;
                }
                li.querySelectorAll('div[style*="text-align"], span[style*="text-align"]').forEach(el => {
                    el.style.removeProperty('text-align');
                    if (!el.style.length && el.tagName === 'DIV') el.replaceWith(...el.childNodes);
                });
            });
        }

        syncContent();
        requestAnimationFrame(updateFormats);
    }, [activeFormats, syncContent, updateFormats]);

    // ─────────────────────────────────────────────────────────
    // toggleBlockquote — surgical partial removal
    //
    // ADDING (not currently in blockquote):
    //   Wrap the current selection / cursor line in a <blockquote>.
    //
    // REMOVING — cursor only (no text selected):
    //   Unwrap the entire blockquote → plain paragraphs.
    //
    // REMOVING — text selection spanning some lines:
    //   Strategy: keep the ORIGINAL blockquote alive but containing
    //   only the UN-selected lines.  The selected lines are extracted
    //   and inserted as plain <p> elements immediately after the
    //   blockquote.  This way no "new" blockquote is ever created —
    //   the same element stays in the DOM, just smaller.
    //
    //   Special case A — ALL lines selected:
    //     Same as cursor-only: remove the blockquote entirely.
    //
    //   Special case B — only the first N lines selected (no "after"):
    //     Remove selected lines from the top of the blockquote,
    //     insert plain <p>s before the blockquote.
    //
    //   Special case C — only the last N lines selected (no "before"):
    //     Remove selected lines from the bottom of the blockquote,
    //     insert plain <p>s after the blockquote.
    //
    //   Normal case — middle lines selected (has before AND after):
    //     Remove selected lines from the blockquote (which retains
    //     before+after as one continuous blockquote), then insert the
    //     plain <p>s right after the blockquote.
    // ─────────────────────────────────────────────────────────
    const toggleBlockquote = useCallback(() => {
        const editor = editorRef.current;
        if (!editor) return;
        editor.focus();

        const isActive = activeFormats.blockquote;

        if (!isActive) {
            // ── Adding blockquote ─────────────────────────────
            const q = (c) => { try { return document.queryCommandState(c); } catch { return false; } };
            const fmt = (() => { try { return document.queryCommandValue('formatBlock').toLowerCase(); } catch { return ''; } })();
            if (q('insertOrderedList')) preBlockquoteState.current = { type: 'ol' };
            else if (q('insertUnorderedList')) preBlockquoteState.current = { type: 'ul' };
            else if (['h1', 'h2', 'h3', 'h4'].includes(fmt)) preBlockquoteState.current = { type: fmt };
            else preBlockquoteState.current = { type: 'p' };
            document.execCommand('formatBlock', false, 'blockquote');

        } else {
            // ── Removing blockquote ───────────────────────────────────────
            // Walk up from selection to find the enclosing <blockquote>
            const sel = window.getSelection();
            let bqEl = null;
            if (sel && sel.rangeCount > 0) {
                let node = sel.getRangeAt(0).commonAncestorContainer;
                if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
                while (node && node !== editor) {
                    if (node.nodeName === 'BLOCKQUOTE') { bqEl = node; break; }
                    node = node.parentElement;
                }
            }

            if (!bqEl) {
                // No blockquote found — plain fallback
                document.execCommand('formatBlock', false, 'p');
                preBlockquoteState.current = null;
                setTimeout(() => { if (editorRef.current) cleanHTML(editorRef.current); }, 0);
                syncContent();
                requestAnimationFrame(updateFormats);
                return;
            }

            const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
            const hasTextSelection = range && !range.collapsed;

            if (!hasTextSelection) {
                // ── No selection: unwrap entire blockquote ────────────────
                const parent = bqEl.parentNode;
                const frag = document.createDocumentFragment();
                while (bqEl.firstChild) frag.appendChild(bqEl.firstChild);
                parent.replaceChild(frag, bqEl);

                const prev = preBlockquoteState.current;
                if (prev) {
                    if (prev.type === 'ul') document.execCommand('insertUnorderedList', false, null);
                    else if (prev.type === 'ol') document.execCommand('insertOrderedList', false, null);
                    else if (['h1', 'h2', 'h3', 'h4'].includes(prev.type))
                        document.execCommand('formatBlock', false, prev.type);
                }

            } else {
                // ── Text selection: remove only the selected lines ────────
                //
                // Snapshot children BEFORE any DOM mutation.
                // classifyBQChildren uses range.intersectsNode which is reliable.
                const { before, mid, after } = classifyBQChildren(bqEl, range);

                if (mid.length === 0) {
                    // Nothing matched — bail gracefully, do nothing
                } else if (before.length === 0 && after.length === 0) {
                    // ── ALL lines selected → unwrap entire blockquote ──────
                    const parent = bqEl.parentNode;
                    const frag = document.createDocumentFragment();
                    mid.forEach(n => frag.appendChild(toPlainBlock(n)));
                    parent.replaceChild(frag, bqEl);

                } else if (before.length === 0) {
                    // ── Selected lines are at the TOP ─────────────────────
                    // Snapshot clones before touching the DOM
                    const plainNodes = mid.map(n => toPlainBlock(n));
                    mid.forEach(n => bqEl.removeChild(n));
                    const frag = document.createDocumentFragment();
                    plainNodes.forEach(n => frag.appendChild(n));
                    bqEl.parentNode.insertBefore(frag, bqEl);

                } else if (after.length === 0) {
                    // ── Selected lines are at the BOTTOM ──────────────────
                    const plainNodes = mid.map(n => toPlainBlock(n));
                    mid.forEach(n => bqEl.removeChild(n));
                    const frag = document.createDocumentFragment();
                    plainNodes.forEach(n => frag.appendChild(n));
                    bqEl.parentNode.insertBefore(frag, bqEl.nextSibling);

                } else {
                    // ── Selected lines are in the MIDDLE ──────────────────
                    // Result: <blockquote>before</blockquote>
                    //         <p>mid (plain)</p>
                    //         <blockquote>after</blockquote>
                    //
                    // Snapshot everything as clones first (before any DOM changes)
                    const plainNodes = mid.map(n => toPlainBlock(n));
                    const afterClones = after.map(n => n.cloneNode(true));

                    // Remove mid + after from the original bqEl
                    // (bqEl now contains only the "before" nodes)
                    [...mid, ...after].forEach(n => bqEl.removeChild(n));

                    // Build plain fragment
                    const plainFrag = document.createDocumentFragment();
                    plainNodes.forEach(n => plainFrag.appendChild(n));

                    // Build after-blockquote
                    const bqAfter = document.createElement('blockquote');
                    afterClones.forEach(n => bqAfter.appendChild(n));

                    // Insert: bqEl … plainFrag … bqAfter
                    const anchor = bqEl.nextSibling;
                    bqEl.parentNode.insertBefore(bqAfter, anchor);
                    bqEl.parentNode.insertBefore(plainFrag, bqAfter);
                }
            }

            preBlockquoteState.current = null;
        }

        setTimeout(() => { if (editorRef.current) cleanHTML(editorRef.current); }, 0);
        syncContent();
        requestAnimationFrame(updateFormats);
    }, [activeFormats, syncContent, updateFormats]);

    // ── Image click → show controls ──────────────────────────
    const handleEditorClick = useCallback((e) => {
        if (e.target.tagName === 'IMG') {
            if (activeImgEl && activeImgEl !== e.target) activeImgEl.classList.remove(styles.imgSelected);
            e.target.classList.add(styles.imgSelected);
            setActiveImgEl(e.target);
        }
    }, [activeImgEl]);

    const deleteActiveImg = useCallback(() => {
        if (activeImgEl) {
            const id = activeImgEl.id;
            if (id) { pendingMedia.current.delete(id); setPendingCount(pendingMedia.current.size); }
            activeImgEl.remove();
            setActiveImgEl(null);
            syncContent();
        }
    }, [activeImgEl, syncContent]);

    // ── Crop handlers ─────────────────────────────────────────
    const handleOpenCrop = useCallback(() => {
        if (!activeImgEl) return;
        setCropSrc(activeImgEl.src);
        setCropTargetEl(activeImgEl);
    }, [activeImgEl]);

    const handleCropSave = useCallback((blob) => {
        if (!cropTargetEl) { setCropSrc(null); setCropTargetEl(null); return; }
        const tempId = `media-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const objectURL = URL.createObjectURL(blob);
        const file = new File([blob], 'cropped.png', { type: 'image/png' });

        const oldId = cropTargetEl.id;
        if (oldId) { pendingMedia.current.delete(oldId); }

        cropTargetEl.src = objectURL;
        cropTargetEl.id = tempId;
        cropTargetEl.setAttribute('data-pending', 'true');
        cropTargetEl.classList.add(styles.pendingMedia);
        pendingMedia.current.set(tempId, { file, type: 'image' });
        setPendingCount(pendingMedia.current.size);

        syncContent();
        setCropSrc(null);
        setCropTargetEl(null);
    }, [cropTargetEl, syncContent]);

    // ── Stage media ───────────────────────────────────────────
    const stageFiles = useCallback((files, type) => {
        const filtered = Array.from(files).filter(f =>
            type === 'image' ? f.type.startsWith('image/') : f.type.startsWith('video/')
        );
        if (!filtered.length) return;
        filtered.forEach(file => {
            const tempId = `media-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const objectURL = URL.createObjectURL(file);
            pendingMedia.current.set(tempId, { file, type });
            setPendingCount(pendingMedia.current.size);
            editorRef.current?.focus();
            const commonStyle = 'display:block;float:none;margin-left:0;margin-right:auto;margin-top:8px;margin-bottom:8px;';
            const html = type === 'image'
                ? `<img id="${tempId}" src="${objectURL}" alt="product image" class="${styles.editorImg} ${styles.pendingMedia}" data-pending="true" style="width:60%;height:auto;${commonStyle}"/>`
                : `<video id="${tempId}" controls class="${styles.editorVideo} ${styles.pendingMedia}" data-pending="true" style="width:100%;${commonStyle}"><source src="${objectURL}" /></video>`;
            document.execCommand('insertHTML', false, html);
            syncContent();
        });
    }, [syncContent]);

    const onDrop = useCallback((e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        const images = Array.from(files).filter(f => f.type.startsWith('image/'));
        const videos = Array.from(files).filter(f => f.type.startsWith('video/'));
        if (images.length) stageFiles(images, 'image');
        if (videos.length) stageFiles(videos, 'video');
    }, [stageFiles]);

    const onPaste = useCallback((e) => {
        const items = Array.from(e.clipboardData?.items || []);
        const imgItem = items.find(i => i.type.startsWith('image/'));
        if (imgItem) { e.preventDefault(); stageFiles([imgItem.getAsFile()], 'image'); }
    }, [stageFiles]);

    // ── Keyboard shortcuts ────────────────────────────────────
    const handleKeyDown = useCallback((e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'b') { e.preventDefault(); cmd('bold'); }
            if (e.key === 'i') { e.preventDefault(); cmd('italic'); }
            if (e.key === 'u') { e.preventDefault(); cmd('underline'); }
        }
    }, [cmd]);

    // ── Upload helper ─────────────────────────────────────────
    const uploadOne = useCallback(async (tempId, file, type) => {
        const el = editorRef.current?.querySelector(`#${tempId}`);
        if (el) { el.style.opacity = '0.45'; el.style.outline = '2px dashed #3b82f6'; }
        const form = new FormData();
        form.append('file', file, file.name || 'upload.png');
        form.append('session_id', session_id);
        const endpoint = type === 'image' ? '/api/to_url' : '/seller/upload-description-video';
        const res = await fetch(config.SERVER_URL + endpoint, {
            method: 'POST',
            headers: { Authorization: `Bearer ${auth}` },
            body: form,
        });
        if (!res.ok) throw new Error(res.statusText);
        const { url } = await res.json();
        if (el) {
            if (type === 'image') { URL.revokeObjectURL(el.src); el.src = url; }
            else {
                const source = el.querySelector('source');
                if (source) { URL.revokeObjectURL(source.src); source.src = url; }
                el.load();
            }
            el.removeAttribute('id');
            el.removeAttribute('data-pending');
            el.style.opacity = '';
            el.style.outline = '';
            el.classList.remove(styles.pendingMedia);
        }
        pendingMedia.current.delete(tempId);
    }, [auth, session_id]);

    const handleSave = useCallback(async () => {
        if (!editorRef.current) return;
        const pending = Array.from(pendingMedia.current.entries());
        if (!pending.length) return;
        setIsSaving(true);
        setFullPageLoading(true);

        const results = await Promise.allSettled(
            pending.map(([tempId, { file, type }]) => uploadOne(tempId, file, type))
        );

        const anyFailed = results.some(r => r.status === 'rejected');
        if (anyFailed) {
            results.forEach((r, i) => {
                if (r.status === 'rejected') {
                    const [tempId, { type }] = pending[i];
                    const el = editorRef.current?.querySelector(`#${tempId}`);
                    if (el) el.style.outline = '2px solid #ef4444';
                    addNotification({ h2: 'Upload failed', desc: `A ${type} could not be uploaded.` });
                }
            });
        }

        setPendingCount(pendingMedia.current.size);
        cleanAndSync();
        setIsSaving(false);
        setFullPageLoading(false);
        if (!anyFailed) addNotification({ h2: 'Saved', desc: 'All media uploaded successfully.' });
    }, [uploadOne, cleanAndSync, addNotification, setFullPageLoading]);

    const hasPending = pendingCount > 0;

    return (
        <div className={styles.editorWrapper}>

            {/* Crop modal */}
            {cropSrc && (
                <ImageCropModal
                    src={cropSrc}
                    onSave={handleCropSave}
                    onCancel={() => { setCropSrc(null); setCropTargetEl(null); }}
                />
            )}

            {/* Header */}
            <div className={styles.editorHeader}>
                <label className={styles.editorLabel}>
                    Product Description <span className={styles.req}>(required*)</span>
                </label>
                {hasPending && (
                    <button type="button" onClick={handleSave} disabled={isSaving} className={styles.saveBtn}>
                        {isSaving
                            ? <><ImSpinner2 className={styles.spinIcon} /> Uploading…</>
                            : <><MdSave size={14} /> Save media</>
                        }
                    </button>
                )}
            </div>

            {/* Pending badge */}
            {hasPending && !isSaving && (
                <div className={styles.pendingBadge}>
                    <MdImage size={13} />
                    {pendingCount} file{pendingCount > 1 ? 's' : ''} staged — click <strong>Save media</strong> to upload
                </div>
            )}

            {/* Toolbar */}
            <div className={styles.toolbar} style={{ flexWrap: 'wrap', gap: '2px 4px' }}>

                <div className={styles.toolGroup}>
                    <span className={styles.toolGroupLabel}>FORMAT</span>
                    <ToolBtn title="Paragraph" active={activeFormats.paragraph} onClick={convertToParagraph}>
                        <RiParagraph />
                    </ToolBtn>
                    <ToolBtn title="Heading 1" active={activeFormats.h1} onClick={() => insertHeading('h1')}>
                        <RiH1 />
                    </ToolBtn>
                    <ToolBtn title="Heading 2" active={activeFormats.h2} onClick={() => insertHeading('h2')}>
                        <RiH2 />
                    </ToolBtn>
                    <ToolBtn title="Heading 3" active={activeFormats.h3} onClick={() => insertHeading('h3')}>
                        <RiH3 />
                    </ToolBtn>
                    <ToolBtn title="Heading 4" active={activeFormats.h4} onClick={() => insertHeading('h4')}>
                        <BsTypeH4 />
                    </ToolBtn>
                </div>

                <Sep />

                <div className={styles.toolGroup}>
                    <ToolBtn title="Bold (Ctrl+B)" active={activeFormats.bold} onClick={() => cmd('bold')}>
                        <MdFormatBold />
                    </ToolBtn>
                    <ToolBtn title="Italic (Ctrl+I)" active={activeFormats.italic} onClick={() => cmd('italic')}>
                        <MdFormatItalic />
                    </ToolBtn>
                    <ToolBtn title="Underline (Ctrl+U)" active={activeFormats.underline} onClick={() => cmd('underline')}>
                        <MdFormatUnderlined />
                    </ToolBtn>
                    <ToolBtn
                        title={activeFormats.blockquote ? 'Remove blockquote' : 'Add blockquote'}
                        active={activeFormats.blockquote}
                        onClick={toggleBlockquote}
                    >
                        <MdFormatQuote />
                    </ToolBtn>
                </div>

                <Sep />

                <div className={styles.toolGroup}>
                    <span className={styles.toolGroupLabel}>CASE</span>
                    <ToolBtn
                        title={hasSelection ? (selectedTextCase === 'upper' ? 'Already UPPERCASE' : 'Convert to UPPERCASE') : 'Select text first'}
                        disabled={!hasSelection}
                        active={hasSelection && selectedTextCase === 'upper'}
                        onClick={() => transformCase(true)}
                        className={styles.caseBtn}
                    >
                        <span className={styles.caseBtnText}>AA</span>
                    </ToolBtn>
                    <ToolBtn
                        title={hasSelection ? (selectedTextCase === 'lower' ? 'Already lowercase' : 'Convert to lowercase') : 'Select text first'}
                        disabled={!hasSelection}
                        active={hasSelection && selectedTextCase === 'lower'}
                        onClick={() => transformCase(false)}
                        className={styles.caseBtn}
                    >
                        <span className={styles.caseBtnTextLower}>aa</span>
                    </ToolBtn>
                </div>

                <Sep />

                <div className={styles.toolGroup}>
                    <span className={styles.toolGroupLabel}>ALIGN</span>
                    <ToolBtn title="Left" active={activeFormats.alignLeft} onClick={() => applyAlign('left')}>
                        <MdFormatAlignLeft />
                    </ToolBtn>
                    <ToolBtn title="Center" active={activeFormats.alignCenter} onClick={() => applyAlign('center')}>
                        <MdFormatAlignCenter />
                    </ToolBtn>
                    <ToolBtn title="Right" active={activeFormats.alignRight} onClick={() => applyAlign('right')}>
                        <MdFormatAlignRight />
                    </ToolBtn>
                </div>

                <Sep />

                <div className={styles.toolGroup}>
                    <ToolBtn title="Bullet list" active={activeFormats.unorderedList} onClick={() => cmd('insertUnorderedList')}>
                        <MdFormatListBulleted />
                    </ToolBtn>
                    <ToolBtn title="Numbered list" active={activeFormats.orderedList} onClick={() => cmd('insertOrderedList')}>
                        <MdFormatListNumbered />
                    </ToolBtn>
                </div>

                <Sep />

                <div className={styles.toolGroup}>
                    <ToolBtn title="Insert image" onClick={() => imageInputRef.current?.click()}>
                        <MdImage /><span className={styles.toolLabel}>IMAGE</span>
                    </ToolBtn>
                    <ToolBtn title="Insert video" onClick={() => videoInputRef.current?.click()}>
                        <MdVideoLibrary /><span className={styles.toolLabel}>VIDEO</span>
                    </ToolBtn>
                </div>
            </div>

            {/* Image controls — shown when an image is selected */}
            {activeImgEl && (
                <ImageControls
                    el={activeImgEl}
                    containerRef={imgControlsRef}
                    onClose={() => { activeImgEl.classList.remove(styles.imgSelected); setActiveImgEl(null); }}
                    onDelete={deleteActiveImg}
                    onCrop={handleOpenCrop}
                />
            )}

            {/* Editable area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className={styles.editor}
                onInput={() => { userEditedRef.current = true; syncContent(); }}
                onBlur={cleanAndSync}
                onClick={handleEditorClick}
                onMouseUp={updateFormats}
                onKeyUp={updateFormats}
                onKeyDown={handleKeyDown}
                onFocus={updateFormats}
                onDrop={onDrop}
                onDragOver={e => e.preventDefault()}
                onPaste={onPaste}
                data-placeholder="Write your product description… drag & drop images or use the toolbar."
            />

            <input ref={imageInputRef} type="file" accept="image/*" multiple hidden
                onChange={e => { stageFiles(e.target.files, 'image'); e.target.value = ''; }} />
            <input ref={videoInputRef} type="file" accept="video/*" multiple hidden
                onChange={e => { stageFiles(e.target.files, 'video'); e.target.value = ''; }} />
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// BasicInfoTab
// ─────────────────────────────────────────────────────────────
const BasicInfoTab = memo(({
    setFullPageLoading,
    auth, session_id, formData, handleInputChange,
    selectedCategory, setSelectedCategory,
    selectedSubCategory, setSelectedSubCategory,
    searchedCategory, searchedSubCategory, setSearchedSubCategory,
    isLoading, searchQuery, setSearchQuery, handleSearch,
    loadedSku, warehouse, selectedWareHouse, setSelectedWareHouse,
    addNotification,
}) => {
    const [_loadSub, setSubLoad] = useState(null);

    const getSubCat = async (data) => {
        setSubLoad(data.id);
        setSelectedCategory(data);
        try {
            const res = await fetch(config.SERVER_URL + '/seller/upload/get-sub-category', {
                method: 'POST',
                body: JSON.stringify({ session_id, ...data }),
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` },
            });
            if (!res.ok) throw new Error(`Error: ${res.statusText}`);
            const result = await res.json();
            if (result.data.status) setSearchedSubCategory(result.data.list);
        } catch {
            addNotification({ h2: 'Error', desc: 'There was a problem with your request, try again later.' });
        } finally {
            setSubLoad(null);
        }
    };

    return (
        <div className={styles.form_section}>
            <h2>Basic Product Information</h2>

            <div className={styles.inventory_grid}>
                <div className={styles.form_group}>
                    <label htmlFor="title">
                        <MdTitle size={14} className={styles.labelIcon} />
                        Product Title <span>(required*)</span>
                    </label>
                    <input type="text" id="title" value={formData.title} onChange={handleInputChange} required />
                </div>
                {loadedSku === false && (
                    <div className={styles.form_group}>
                        <label htmlFor="sku">
                            <MdInventory2 size={14} className={styles.labelIcon} />
                            Product SKU <span>(required*)</span>
                        </label>
                        <input type="text" id="sku" value={formData.sku} onChange={handleInputChange} required />
                    </div>
                )}
                <div className={styles.form_group}>
                    <label htmlFor="warehouseName">
                        <MdWarehouse size={14} className={styles.labelIcon} />
                        Select Warehouse <span>(required*)</span>
                    </label>
                    <select
                        className={styles.selectBox}
                        value={selectedWareHouse || ''}
                        onChange={(e) => setSelectedWareHouse(e.target.value)}
                    >
                        <option disabled value="">Select Warehouse</option>
                        {Array.isArray(warehouse) && warehouse.map((w, id) => (
                            <option key={'wh' + id} value={w.name}>{w.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.form_group}>
                <label htmlFor="subtitle">
                    <MdSubtitles size={14} className={styles.labelIcon} />
                    Product Subtitle <span>(required*)</span>
                </label>
                <input type="text" id="subtitle" value={formData.subtitle} onChange={handleInputChange} required />
            </div>

            <div className={styles.form_group}>
                <DescriptionEditor
                    setFullPageLoading={setFullPageLoading}
                    auth={auth} session_id={session_id}
                    value={formData.description}
                    onChange={handleInputChange}
                    addNotification={addNotification}
                />
            </div>


            <div className={styles.form_group}>
                <label htmlFor="categorie">
                    <MdCategory size={14} className={styles.labelIcon} />
                    Categories
                </label>
                <div className={styles.categoriesList}>
                    {searchedCategory.length > 0 && (
                        <div className={styles.tagContainer}>
                            <span className={styles.tagHint}>Search results:</span>
                            {searchedCategory.map((data, index) =>
                                _loadSub === data.id ? (
                                    <ImSpinner2 key={`searched-${data.id || index}`} size={22} className={'spin ' + styles.searchIcon} />
                                ) : (
                                    <button
                                        key={`searched-${data.id || index}`}
                                        onClick={() => getSubCat(data)}
                                        className={[styles.tag, selectedCategory?.name === data.name ? styles.selected : '', isLoading ? styles.loading : ''].join(' ')}
                                    >
                                        {data.name}
                                    </button>
                                )
                            )}
                        </div>
                    )}
                    {searchedSubCategory.length > 0 && (
                        <>
                            <h4 id={styles.subCatHead}>Sub-categories of: <strong>{selectedCategory?.name}</strong></h4>
                            <div className={styles.tagContainer}>
                                <span className={styles.tagHint}>Search results:</span>
                                {searchedSubCategory.map((data, index) => (
                                    <button
                                        key={`searched-${data.id || index}`}
                                        onClick={() => setSelectedSubCategory(data)}
                                        className={[styles.tag, selectedSubCategory?.name === data.name ? styles.selected : '', isLoading ? styles.loading : ''].join(' ')}
                                    >
                                        {data.name}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                <form onSubmit={handleSearch} className={styles.searchForm}>
                    <MdSearch size={16} className={styles.searchIconInline} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Category..."
                        required
                        className={styles.searchInput}
                    />
                    <button type="submit" className={styles.searchButton}>
                        {isLoading
                            ? <><span className={styles.spinner} /><span className={styles.buttonText}>Searching…</span></>
                            : <span className={styles.buttonText}>Search</span>
                        }
                    </button>
                </form>
            </div>
        </div>
    );
});

export default BasicInfoTab;