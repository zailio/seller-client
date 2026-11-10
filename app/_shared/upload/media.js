// components/MediaAttributesTab.jsx
'use client';

import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import styles from './css/media.module.css';
import { IoCloseCircle, IoWarning } from "react-icons/io5";
import config from '../../../utils/config';


const SIZE_PRESETS = ['Free Size', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
const MAX_SIZE_LENGTH = 20;

const MOUSE_DRAG_THRESHOLD = 5;    // px before a mouse drag begins
const TOUCH_CANCEL_THRESHOLD = 10; // px of movement during long-press that means "user is scrolling"
const TOUCH_LONG_PRESS_MS = 220;   // hold time before a touch/pen drag begins
const EDGE_SCROLL_ZONE = 70;       // px from viewport edge that triggers auto-scroll
const EDGE_SCROLL_SPEED = 14;

// Where does item `i` sit while `from` is being dragged over `to`?
const getPreviewIndex = (i, from, to) => {
    if (from === null || to === null || i === from) return i;
    if (from < to && i > from && i <= to) return i - 1;
    if (from > to && i >= to && i < from) return i + 1;
    return i;
};

const MediaAttributesTab = memo(({
    auth,
    session_id,
    formData,
    handleImageUpload,
    rmImg,
    uploadImg,
    onImagesReorder,     // (fromIndex, toIndex) => void
    colorPalette,
    toggleColor,
    removeColor,
    maxColors,
    onSizeChange,
    selectedSubCategory, // selectedSubCategory.name, .id
    currentProductId,    // exclude self from candidates
    variantsIds = [],    // array of signed variant_id tokens (controlled)
    onVariantsChange,    // (nextArray) => void
    maxVariants = 30
}) => {
    const [customColor, setCustomColor] = useState('#888888');
    const [variantCandidates, setVariantCandidates] = useState([]);
    const [loadingVariants, setLoadingVariants] = useState(false);

    // ---- image drag state ----
    const [dragIndex, setDragIndex] = useState(null);
    const [overIndex, setOverIndex] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const gridRef = useRef(null);
    const itemRefs = useRef([]);
    const dragRef = useRef(null);
    const rafRef = useRef(null);
    const onReorderRef = useRef(onImagesReorder);
    onReorderRef.current = onImagesReorder;

    const selected = formData.colors || [];
    const atLimit = selected.length >= maxColors;
    const variantsAtLimit = variantsIds.length >= maxVariants;

    // ---- load similar-sub-category candidates on mount / sub-category change ----
    useEffect(() => {
        if (!selectedSubCategory?.id) return;
        let cancelled = false;

        const loadCandidates = async () => {
            setLoadingVariants(true);
            try {
                const res = await fetch(`${config.SERVER_URL}/seller/upload/similar-sub-category`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${auth}`,
                    },
                    body: JSON.stringify({ session_id, sub_category: selectedSubCategory.name }),
                });
                const json = await res.json();
                if (cancelled) return;

                if (json?.status && json.data?.status && Array.isArray(json.data.list)) {
                    setVariantCandidates(json.data.list);
                } else {
                    setVariantCandidates([]);
                }
            } catch (e) {
                console.error('Failed to load variant candidates', e);
                if (!cancelled) setVariantCandidates([]);
            } finally {
                if (!cancelled) setLoadingVariants(false);
            }
        };

        loadCandidates();
        return () => { cancelled = true; };
    }, [selectedSubCategory?.id, session_id, auth]);

    const visibleCandidates = useMemo(
        () => variantCandidates.filter(p => String(p.product_id ?? p.id) !== String(currentProductId)),
        [variantCandidates, currentProductId]
    );

    const toggleVariant = (product) => {
        if (!product.variant_id) return;
        const isSelected = variantsIds.includes(product.variant_id);
        if (isSelected) {
            onVariantsChange(variantsIds.filter(id => id !== product.variant_id));
        } else {
            if (variantsAtLimit) return;
            onVariantsChange([...variantsIds, product.variant_id]);
        }
    };

    // =====================================================================
    // Image sortable drag (Pointer Events: mouse + touch + pen, no libraries)
    // Other tiles slide to open a gap at the drop position.
    // =====================================================================

    // Block page scroll on touch devices while a drag is active.
    // Must be a non-passive native listener (React's touch handlers are passive).
    useEffect(() => {
        const grid = gridRef.current;
        if (!grid) return;
        const blockScroll = (e) => {
            if (dragRef.current?.active && e.cancelable) e.preventDefault();
        };
        grid.addEventListener('touchmove', blockScroll, { passive: false });
        return () => grid.removeEventListener('touchmove', blockScroll);
    }, []);

    // Nearest slot (by center distance) to a pointer position, in page coordinates.
    const findNearestSlot = useCallback((pageX, pageY) => {
        const d = dragRef.current;
        if (!d) return null;
        let best = d.index;
        let bestDist = Infinity;
        for (let i = 0; i < d.slots.length; i++) {
            const s = d.slots[i];
            const dist = (pageX - (s.x + s.w / 2)) ** 2 + (pageY - (s.y + s.h / 2)) ** 2;
            if (dist < bestDist) { bestDist = dist; best = i; }
        }
        return best;
    }, []);

    const updateDrag = useCallback(() => {
        const d = dragRef.current;
        if (!d || !d.active) return;
        const ox = d.lastX - d.startX + (window.scrollX - d.startScrollX);
        const oy = d.lastY - d.startY + (window.scrollY - d.startScrollY);
        setDragOffset({ x: ox, y: oy });
        setOverIndex(findNearestSlot(d.lastX + window.scrollX, d.lastY + window.scrollY));
    }, [findNearestSlot]);

    const stopLoop = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
    };

    const startLoop = useCallback(() => {
        const tick = () => {
            const d = dragRef.current;
            if (!d || !d.active) { rafRef.current = null; return; }
            if (d.lastY < EDGE_SCROLL_ZONE) window.scrollBy(0, -EDGE_SCROLL_SPEED);
            else if (d.lastY > window.innerHeight - EDGE_SCROLL_ZONE) window.scrollBy(0, EDGE_SCROLL_SPEED);
            updateDrag();
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
    }, [updateDrag]);

    const activateDrag = useCallback(() => {
        const d = dragRef.current;
        if (!d || d.active) return;

        // Snapshot every tile's natural slot (page coordinates) before anything moves.
        const sx = window.scrollX;
        const sy = window.scrollY;
        const slots = [];
        for (let i = 0; i < d.count; i++) {
            const el = itemRefs.current[i];
            if (!el) { slots.push({ x: 0, y: 0, w: 0, h: 0 }); continue; }
            const r = el.getBoundingClientRect();
            slots.push({ x: r.left + sx, y: r.top + sy, w: r.width, h: r.height });
        }
        const gridRect = gridRef.current.getBoundingClientRect();
        d.slots = slots;
        d.gridX = gridRect.left + sx;
        d.gridY = gridRect.top + sy;
        d.startScrollX = sx;
        d.startScrollY = sy;
        d.startX = d.lastX;
        d.startY = d.lastY;
        d.active = true;

        setDragIndex(d.index);
        setOverIndex(d.index);
        setDragOffset({ x: 0, y: 0 });

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate(10); } catch (_) { /* ignore */ }
        }
        startLoop();
    }, [startLoop]);

    const resetDrag = useCallback(() => {
        const d = dragRef.current;
        if (d?.timer) clearTimeout(d.timer);
        stopLoop();
        dragRef.current = null;
        setDragIndex(null);
        setOverIndex(null);
        setDragOffset({ x: 0, y: 0 });
    }, []);

    useEffect(() => () => {
        const d = dragRef.current;
        if (d?.timer) clearTimeout(d.timer);
        stopLoop();
    }, []);

    const handlePointerDown = (e, index) => {
        if (dragRef.current) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (formData.image.length < 2) return;

        try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }

        dragRef.current = {
            pointerId: e.pointerId,
            pointerType: e.pointerType,
            index,
            count: formData.image.length,
            startX: e.clientX,
            startY: e.clientY,
            lastX: e.clientX,
            lastY: e.clientY,
            startScrollX: window.scrollX,
            startScrollY: window.scrollY,
            slots: [],
            gridX: 0,
            gridY: 0,
            active: false,
            timer: null,
        };

        if (e.pointerType !== 'mouse') {
            dragRef.current.timer = setTimeout(activateDrag, TOUCH_LONG_PRESS_MS);
        }
    };

    const handlePointerMove = (e) => {
        const d = dragRef.current;
        if (!d || d.pointerId !== e.pointerId) return;

        if (!d.active) {
            const dist = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
            d.lastX = e.clientX;
            d.lastY = e.clientY;
            if (d.pointerType === 'mouse') {
                if (dist > MOUSE_DRAG_THRESHOLD) activateDrag();
            } else if (dist > TOUCH_CANCEL_THRESHOLD) {
                // user is scrolling, not dragging
                resetDrag();
            }
            return;
        }

        d.lastX = e.clientX;
        d.lastY = e.clientY;
        e.preventDefault();
        updateDrag();
    };

    const handlePointerUp = (e) => {
        const d = dragRef.current;
        if (!d || d.pointerId !== e.pointerId) return;

        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }

        if (d.active) {
            const target = findNearestSlot(d.lastX + window.scrollX, d.lastY + window.scrollY);
            if (target !== null && target !== d.index && typeof onReorderRef.current === 'function') {
                onReorderRef.current(d.index, target);
            }
        }
        resetDrag();
    };

    const handlePointerCancel = (e) => {
        const d = dragRef.current;
        if (!d || d.pointerId !== e.pointerId) return;
        resetDrag();
    };

    const dragging = dragIndex !== null && dragRef.current?.active;
    const slots = dragging ? dragRef.current.slots : null;

    const getItemStyle = (index) => {
        if (!dragging || !slots) return undefined;

        if (index === dragIndex) {
            return { transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(1.05)` };
        }

        const newIdx = getPreviewIndex(index, dragIndex, overIndex);
        const from = slots[index];
        const to = slots[newIdx];
        if (!from || !to) return { transform: 'translate(0px, 0px)' };
        return { transform: `translate(${to.x - from.x}px, ${to.y - from.y}px)` };
    };

    const placeholderStyle = (() => {
        if (!dragging || !slots || overIndex === null) return null;
        const s = slots[overIndex];
        const d = dragRef.current;
        if (!s) return null;
        return {
            left: s.x - d.gridX,
            top: s.y - d.gridY,
            width: s.w,
            height: s.h,
        };
    })();

    return (
        <div className={styles.form_section}>
            <h2>Media & Attributes</h2>

            {/* ---- Color composition ---- */}
            <div className={styles.form_group}>
                <label>
                    Product Color: <span>(required*, up to {maxColors})</span>
                </label>
                <p className={styles.colorHelpText}>
                    Pick the color(s) that make up this exact product. A black+white version
                    and a red+black version of the same item are two separate uploads —
                    each one gets its own color composition here.
                </p>

                <div className={styles.paletteGrid}>
                    {colorPalette.map((c) => {
                        const isSelected = selected.includes(c.hex);
                        const disabled = !isSelected && atLimit;
                        return (
                            <button
                                type="button"
                                key={c.hex}
                                className={`${styles.swatchBtn} ${isSelected ? styles.swatchSelected : ''}`}
                                style={{ backgroundColor: c.hex }}
                                onClick={() => toggleColor(c.hex)}
                                disabled={disabled}
                                title={c.name}
                            >
                                {isSelected && <span className={styles.swatchCheck}>✓</span>}
                            </button>
                        );
                    })}

                    <div className={styles.customColorWrap} title="Custom color">
                        <input
                            type="color"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            className={styles.customColorInput}
                        />
                        <button
                            type="button"
                            className={styles.customColorAddBtn}
                            onClick={() => toggleColor(customColor)}
                            disabled={atLimit}
                        >
                            + Add
                        </button>
                    </div>
                </div>

                {selected.length > 0 && (
                    <div className={styles.selectedColorsRow}>
                        {selected.map((hex) => (
                            <span key={hex} className={styles.selectedColorChip}>
                                <span className={styles.selectedColorDot} style={{ backgroundColor: hex }} />
                                {hex}
                                <button type="button" onClick={() => removeColor(hex)} className={styles.selectedColorRemove}>
                                    <IoCloseCircle size={16} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {atLimit && (
                    <p className={styles.colorLimitNote}>
                        Maximum {maxColors} colors reached. Remove one to pick another.
                    </p>
                )}
            </div>

            {/* ---- Size ---- */}
            <div className={styles.form_group}>
                <label>
                    Product Size: <span>(required*, one size per listing)</span>
                </label>
                <p className={styles.colorHelpText}>
                    Enter the size for this exact product — "Free Size", "Medium", "M", "42",
                    whatever fits how you sell it. A product with 3 sizes and 2 colors means
                    up to 6 separate uploads, linked below as variants.
                </p>

                <div className={styles.sizePresetsRow}>
                    {SIZE_PRESETS.map((preset) => (
                        <button
                            type="button"
                            key={preset}
                            className={`${styles.sizePresetBtn} ${formData.size === preset ? styles.sizePresetActive : ''}`}
                            onClick={() => onSizeChange(preset)}
                        >
                            {preset}
                        </button>
                    ))}
                </div>

                <input
                    type="text"
                    className={styles.sizeInput}
                    value={formData.size}
                    onChange={(e) => onSizeChange(e.target.value)}
                    maxLength={MAX_SIZE_LENGTH}
                    placeholder="e.g. Free Size, Medium, M, 42"
                />
                <span className={styles.sizeCharCount}>
                    {(formData.size || '').length}/{MAX_SIZE_LENGTH}
                </span>
            </div>

            {/* ---- Variants: grid of tickable rows, same sub-category, up to maxVariants ---- */}
            <div className={styles.form_group}>
                <label>
                    Variants: <span>(optional, up to {maxVariants})</span> — {variantsIds.length}/{maxVariants} selected
                </label>
                <p className={styles.colorHelpText}>
                    Tick this product's other size or color versions from the same sub-category
                    so buyers can switch between them from this listing.
                </p>

                <div className={styles.variantsWarning}>
                    <IoWarning size={16} className={styles.variantsWarningIcon} />
                    <span>
                        Only link genuine variants of this exact product. Linking unrelated or
                        non-genuine items to inflate visibility can get your seller account shadow banned.
                    </span>
                </div>

                {loadingVariants && (
                    <p className={styles.variantsLoading}>Loading similar products…</p>
                )}

                {!loadingVariants && visibleCandidates.length === 0 && (
                    <p className={styles.variantsEmpty}>No other products found in this sub-category yet.</p>
                )}

                {!loadingVariants && visibleCandidates.length > 0 && (
                    <div className={styles.variantsGrid}>
                        {visibleCandidates.map((p) => {
                            const key = p.product_id ?? p.id;
                            const isSelected = variantsIds.includes(p.variant_id);
                            const disabled = !isSelected && variantsAtLimit;
                            const img = Array.isArray(p.image) ? p.image[0] : p.image;
                            const colors = p.colors && p.colors.length > 0
                                ? p.colors
                                : (p.color ? [p.color] : []);
                            const sizeLabel = (p.size && String(p.size).trim()) ? p.size : 'Free Size';

                            return (
                                <button
                                    type="button"
                                    key={key}
                                    className={`${styles.variantCell} ${isSelected ? styles.variantCellSelected : ''} ${disabled ? styles.variantCellDisabled : ''}`}
                                    onClick={() => toggleVariant(p)}
                                    disabled={disabled}
                                >
                                    <span className={`${styles.variantCheckbox} ${isSelected ? styles.variantCheckboxChecked : ''}`}>
                                        {isSelected && '✓'}
                                    </span>

                                    <div className={styles.variantCellBody}>
                                        {/* row 1: image + product info */}
                                        <div className={styles.variantRow1}>
                                            <span className={styles.variantThumb}>
                                                {img ? (
                                                    <img src={img} alt={p.title} />
                                                ) : (
                                                    <span className={styles.variantThumbFallback}>{(p.title || '?').slice(0, 2)}</span>
                                                )}
                                            </span>

                                            <div className={styles.variantInfo}>
                                                <span className={styles.variantTitle} title={p.title}>{p.title}</span>
                                                <span className={styles.variantPrices}>
                                                    {p.price !== undefined && <span className={styles.variantAmount}>₹{p.price}</span>}
                                                    {p.discount !== undefined && <span className={styles.variantSelling}>₹{p.discount}</span>}
                                                </span>
                                            </div>
                                        </div>

                                        {/* row 2: colors + size */}
                                        <div className={styles.variantRow2}>
                                            <span className={styles.variantColorsGroup}>
                                                {colors.length > 0 ? (
                                                    colors.slice(0, 4).map((hex, i) => (
                                                        <span
                                                            key={hex + i}
                                                            className={styles.variantColorDot}
                                                            style={{ backgroundColor: hex }}
                                                            title={hex}
                                                        />
                                                    ))
                                                ) : (
                                                    <span className={styles.variantColorNone}>—</span>
                                                )}
                                                {colors.length > 4 && (
                                                    <span className={styles.variantColorMore}>+{colors.length - 4}</span>
                                                )}
                                            </span>

                                            <span className={styles.variantSizeBadge}>{sizeLabel}</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {variantsAtLimit && (
                    <p className={styles.colorLimitNote}>
                        Maximum {maxVariants} linked variants reached. Untick one to add another.
                    </p>
                )}
            </div>

            {/* ---- Images ---- */}
            <div className={styles.form_group}>
                <label>Upload Product Images:</label>
                <input
                    type="file"
                    id="image_upload"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                />
                {formData.image.length > 1 && (
                    <p className={styles.colorHelpText} style={{ marginTop: 12, marginBottom: 0 }}>
                        Drag to reorder (touch: press and hold, then drag). The first image is the cover.
                    </p>
                )}
                <div
                    className={`${styles.image_upload} ${dragging ? styles.sorting : ''}`}
                    ref={gridRef}
                >
                    {placeholderStyle && (
                        <div className={styles.dropPlaceholder} style={placeholderStyle} />
                    )}

                    {formData.image.map((img, index) => {
                        const isDragging = dragging && dragIndex === index;
                        const isShifting = dragging && dragIndex !== index;
                        return (
                            <div
                                className={`${styles.listed_images} ${isDragging ? styles.dragging : ''} ${isShifting ? styles.shifting : ''}`}
                                key={'image' + index}
                                ref={(el) => { itemRefs.current[index] = el; }}
                                style={getItemStyle(index)}
                                onPointerDown={(e) => handlePointerDown(e, index)}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={handlePointerCancel}
                                onContextMenu={(e) => e.preventDefault()}
                                onDragStart={(e) => e.preventDefault()}
                            >
                                <IoCloseCircle
                                    size={25}
                                    className={styles.rm_img}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={() => rmImg(index)}
                                />
                                <span className={styles.image_number}>{index + 1}</span>
                                <img
                                    src={img}
                                    alt={`Product ${index + 1}`}
                                    className={styles.uploaded_image}
                                    draggable={false}
                                />
                            </div>
                        );
                    })}
                </div>
                {formData.image.length > 0 && (
                    <button
                        className={styles.upload_img}
                        onClick={uploadImg}
                    >
                        Upload Images to Server
                    </button>
                )}
            </div>
        </div>
    );
});

export default MediaAttributesTab;