// components/ExtrasAttachmentsTab.jsx
'use client';

import { memo, useState, useEffect, useCallback, useRef } from 'react';
import styles from './css/extra.module.css';
import config from '../../../utils/config';

const predefinedOptions = {
    productCondition: [
        { value: 'new', label: 'Brand New' },
        { value: 'refurbished', label: 'Refurbished' },
        { value: 'used_like_new', label: 'Used - Like New' },
        { value: 'used_good', label: 'Used - Good' },
        { value: 'used_fair', label: 'Used - Fair' }
    ],
    warrantyType: [
        { value: 'no_warranty', label: 'No Warranty' },
        { value: 'seller_warranty', label: 'Seller Warranty' },
        { value: 'brand_warranty', label: 'Brand Warranty' },
        { value: 'international_warranty', label: 'International Warranty' }
    ],
    warrantyPeriod: [
        { value: '1_month', label: '1 Month' },
        { value: '3_months', label: '3 Months' },
        { value: '6_months', label: '6 Months' },
        { value: '1_year', label: '1 Year' },
        { value: '2_years', label: '2 Years' },
        { value: 'lifetime', label: 'Lifetime' }
    ],
    packagingType: [
        { value: 'standard', label: 'Standard Packaging' },
        { value: 'gift_ready', label: 'Gift Ready' },
        { value: 'eco_friendly', label: 'Eco-Friendly' },
        { value: 'premium', label: 'Premium Packaging' }
    ]
};

const isHosted = (src) => typeof src === 'string' && /^https?:\/\//.test(src);

// The tab unmounts when the seller switches tabs, so fetched creator payouts
// are cached at module level (keyed by sub-category) to avoid calling the API
// every time the tab opens.
const affiliateCache = new Map();

// One image slot (before OR after): empty drop area -> preview with remove button.
const BeforeAfterSlot = ({ id, label, src, disabled, onSelect, onRemove }) => (
    <div className={styles.ba_card}>
        <div className={styles.ba_card_head}>
            <span className={styles.ba_card_label}>{label}</span>
            {src && (
                <span className={`${styles.ba_badge} ${isHosted(src) ? styles.ba_badge_done : ''}`}>
                    {isHosted(src) ? 'Uploaded' : 'Not uploaded'}
                </span>
            )}
        </div>

        {src ? (
            <div className={styles.ba_preview}>
                <img src={src} alt={`${label} preview`} draggable={false} />
                {!disabled && (
                    <button
                        type="button"
                        className={styles.ba_remove}
                        onClick={onRemove}
                        aria-label={`Remove ${label} image`}
                    >
                        ✕
                    </button>
                )}
            </div>
        ) : (
            <label htmlFor={id} className={styles.ba_drop}>
                <span className={styles.ba_drop_icon}>+</span>
                <span>Add {label.toLowerCase()} image</span>
                <small>16:8 ratio works best</small>
            </label>
        )}

        <input
            id={id}
            type="file"
            accept="image/*"
            className={styles.ba_file_input}
            onChange={onSelect}
            disabled={disabled}
        />
    </div>
);

const ExtrasAttachmentsTab = memo(({
    formData,
    handleInputChange,
    // before / after (`formData.have_BA` === true means before & after images exist)
    onBeforeAfterSelect,     // (kind: 'before' | 'after', event) => void
    onBeforeAfterRemove,     // (kind) => void
    uploadBeforeAfter,       // () => Promise<void>
    baUploading,
    baUploaded,
    // affiliation amount API
    auth,
    session_id,
    selectedSubCategory,
    addNotification,
}) => {
    const haveBA = Boolean(formData.have_BA);
    const bothSelected = Boolean(formData.before_img && formData.after_img);

    // Yes / No for "has before & after". The answer lives in formData.have_BA,
    // so a loaded product with have_BA = true opens this section already filled.
    const setHaveBA = (value) => {
        if (baUploading || haveBA === value) return;
        handleInputChange({ target: { id: 'have_BA', type: 'checkbox', checked: value } });
        // "No" -> drop any picked / saved image so nothing stale gets saved
        if (!value) {
            onBeforeAfterRemove('before');
            onBeforeAfterRemove('after');
        }
    };

    // Remove one image. If that leaves BOTH slots empty, the answer flips back
    // to "No" (have_BA = false). Removing just one keeps "Yes".
    const removeSlot = (kind) => {
        if (baUploading) return;
        const other = kind === 'before' ? formData.after_img : formData.before_img;
        onBeforeAfterRemove(kind);
        if (!other) {
            handleInputChange({ target: { id: 'have_BA', type: 'checkbox', checked: false } });
        }
    };

    // ---- affiliation payout (display only) ----
    // Fetched from the server here. It is NEVER sent with upload / update —
    // only the `allow_affiliation` boolean is saved with the product.
    const subCategoryName = selectedSubCategory?.name || '';
    const [affiliateAmount, setAffiliateAmount] = useState(
        () => affiliateCache.get(subCategoryName) ?? null
    );
    const [affiliateLoading, setAffiliateLoading] = useState(false);
    const [affiliateError, setAffiliateError] = useState(false);

    // keep the latest notifier without making it an effect dependency
    const notifyRef = useRef(addNotification);
    notifyRef.current = addNotification;
    // sub-category of the latest request, to ignore out-of-date responses
    const requestKeyRef = useRef(subCategoryName);

    const fetchAffiliateAmount = useCallback(async () => {
        const key = subCategoryName;
        requestKeyRef.current = key;
        setAffiliateLoading(true);
        setAffiliateError(false);
        try {
            const res = await fetch(`${config.SERVER_URL}/seller/upload/affiliation-amount`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth}`
                },
                body: JSON.stringify({ session_id, sub_category: key }),
            });
            if (!res.ok) throw new Error(`Error: ${res.statusText}`);
            const result = await res.json();
            const amount = Number(result?.data?.amount);
            if (!result?.data?.status || !Number.isFinite(amount)) {
                throw new Error('Invalid affiliation amount');
            }
            affiliateCache.set(key, amount);
            if (requestKeyRef.current === key) setAffiliateAmount(amount);
        } catch (e) {
            console.log(e);
            if (requestKeyRef.current === key) {
                setAffiliateError(true);
                if (notifyRef.current) {
                    notifyRef.current({ h2: 'Affiliation!', desc: 'Could not load the creator payout amount.', tag: 'error' });
                }
            }
        } finally {
            if (requestKeyRef.current === key) setAffiliateLoading(false);
        }
    }, [auth, session_id, subCategoryName]);

    // Load when affiliation is on (and again if the sub-category changes).
    // A failed request is not retried automatically — the seller uses Retry.
    useEffect(() => {
        if (!formData.allow_affiliation) return;
        const cached = affiliateCache.get(subCategoryName);
        if (cached !== undefined) {
            setAffiliateAmount(cached);
            setAffiliateError(false);
            return;
        }
        setAffiliateAmount(null);
        fetchAffiliateAmount();
    }, [formData.allow_affiliation, subCategoryName, fetchAffiliateAmount]);

    return (
        <div className={styles.form_section}>
            <h2>Extras & Attachments</h2>

            <div className={styles.predefined_section}>
                <h3 className={styles.subsection_title}>Product Specifications</h3>
                <div className={styles.predefined_grid}>
                    <div className={styles.form_group}>
                        <label htmlFor="product_condition">Condition:</label>
                        <select
                            id="product_condition"
                            value={formData.product_condition}
                            onChange={handleInputChange}
                        >
                            {predefinedOptions.productCondition.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.form_group}>
                        <label htmlFor="warranty_type">Warranty:</label>
                        <select
                            id="warranty_type"
                            value={formData.warranty_type}
                            onChange={handleInputChange}
                        >
                            {predefinedOptions.warrantyType.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    {formData.warranty_type !== 'no_warranty' && (
                        <div className={styles.form_group}>
                            <label htmlFor="warranty_period">Period:</label>
                            <select
                                id="warranty_period"
                                value={formData.warranty_period}
                                onChange={handleInputChange}
                            >
                                <option value="">Select Period</option>
                                {predefinedOptions.warrantyPeriod.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className={styles.form_group}>
                        <label htmlFor="packaging_type">Packaging:</label>
                        <select
                            id="packaging_type"
                            value={formData.packaging_type}
                            onChange={handleInputChange}
                        >
                            {predefinedOptions.packagingType.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.form_group}>
                        <label htmlFor="country_of_origin">Country of Origin:</label>
                        <input
                            type="text"
                            id="country_of_origin"
                            value={formData.country_of_origin}
                            onChange={handleInputChange}
                            placeholder="e.g., India"
                        />
                    </div>
                </div>

                {/* separate packaging */}
                <div className={styles.checkbox_single}>
                    <p>
                        Separate packaging information is recorded to decide whether delivery
                        charges are applied once or per item for the same package.
                    </p>

                    <ul>
                        <li>Tick this if the product is <strong>fragile</strong> or otherwise needs separate packing.</li>
                        <li>Untick if the product allows 2 or more items in a single order (this avoids a separate delivery charge for the same pickup address).</li>
                        <li>Volumetric weight is calculated automatically, so invalid shipment charges are not applied.</li>
                    </ul>
                    <div className={styles.checkbox_item}>
                        <input id="s_p" type="checkbox" checked={formData.s_p} onChange={handleInputChange} />
                        <label htmlFor="s_p">Separate Packaging</label>
                    </div>
                </div>

                {/* Checkboxes for safety */}
                <div className={styles.checkbox_group}>
                    <div className={styles.checkbox_item}>
                        <input id="dangerous_goods" type="checkbox" checked={formData.dangerous_goods} onChange={handleInputChange} />
                        <label htmlFor="dangerous_goods">Dangerous Goods</label>
                    </div>
                    <div className={styles.checkbox_item}>
                        <input id="fragile_item" type="checkbox" checked={formData.fragile_item} onChange={handleInputChange} />
                        <label htmlFor="fragile_item">Fragile Item</label>
                    </div>
                    <div className={styles.checkbox_item}>
                        <input id="liquid_item" type="checkbox" checked={formData.liquid_item} onChange={handleInputChange} />
                        <label htmlFor="liquid_item">Liquid Item</label>
                    </div>
                </div>
            </div>

            {/* ================= Before / After images ================= */}
            <div className={styles.ba_section}>
                <h3 className={styles.ba_title}>Before &amp; After Images</h3>
                <p className={styles.ba_question}>
                    Does this product have before &amp; after images?
                </p>

                <div className={styles.ba_choice_row}>
                    <button
                        type="button"
                        className={`${styles.ba_choice_btn} ${haveBA ? styles.ba_choice_active : ''}`}
                        onClick={() => setHaveBA(true)}
                        disabled={baUploading}
                    >
                        Yes
                    </button>
                    <button
                        type="button"
                        className={`${styles.ba_choice_btn} ${!haveBA ? styles.ba_choice_active : ''}`}
                        onClick={() => setHaveBA(false)}
                        disabled={baUploading}
                    >
                        No
                    </button>
                </div>

                {haveBA && (
                    <>
                        <div className={styles.ba_grid}>
                            <BeforeAfterSlot
                                id="before_img_input"
                                label="Before"
                                src={formData.before_img}
                                disabled={baUploading}
                                onSelect={(e) => onBeforeAfterSelect('before', e)}
                                onRemove={() => removeSlot('before')}
                            />
                            <BeforeAfterSlot
                                id="after_img_input"
                                label="After"
                                src={formData.after_img}
                                disabled={baUploading}
                                onSelect={(e) => onBeforeAfterSelect('after', e)}
                                onRemove={() => removeSlot('after')}
                            />
                        </div>

                        <div className={styles.ba_actions}>
                            {baUploaded ? (
                                <span className={styles.ba_done}>✓ Before &amp; After uploaded</span>
                            ) : (
                                <button
                                    type="button"
                                    className={styles.ba_submit}
                                    onClick={uploadBeforeAfter}
                                    disabled={!bothSelected || baUploading}
                                >
                                    {baUploading
                                        ? 'Uploading…'
                                        : bothSelected
                                            ? 'Upload Before & After'
                                            : 'Add both images to upload'}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* ================= Affiliation ================= */}
            <div className={styles.aff_section}>
                <div className={styles.aff_row}>
                    <div className={styles.aff_text}>
                        <h3 className={styles.aff_title}>Allow Affiliation</h3>
                        <p className={styles.aff_desc}>
                            Let creators promote this product and earn when it sells.
                        </p>
                    </div>

                    <label className={styles.switch} htmlFor="allow_affiliation">
                        <input
                            id="allow_affiliation"
                            type="checkbox"
                            checked={Boolean(formData.allow_affiliation)}
                            onChange={handleInputChange}
                        />
                        <span className={styles.switch_track}>
                            <span className={styles.switch_thumb} />
                        </span>
                        <span className={styles.switch_text}>
                            {formData.allow_affiliation ? 'On' : 'Off'}
                        </span>
                    </label>
                </div>

                {formData.allow_affiliation && (
                    <div className={styles.aff_info}>
                        {affiliateLoading && (
                            <>
                                <span className={styles.aff_skeleton} />
                                <span className={styles.aff_info_text}>Fetching creator payout…</span>
                            </>
                        )}

                        {!affiliateLoading && affiliateError && (
                            <div className={styles.aff_error}>
                                <span className={styles.aff_error_text}>
                                    Couldn't load the creator payout amount.
                                </span>
                                <button
                                    type="button"
                                    className={styles.aff_retry}
                                    onClick={fetchAffiliateAmount}
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        {!affiliateLoading && !affiliateError && affiliateAmount !== null && (
                            <>
                                <span className={styles.aff_amount}>₹{affiliateAmount}</span>
                                <span className={styles.aff_info_text}>
                                    will be shared with the creator once the product is sold through their link.
                                    The marketplace fee will not be deducted from this Product.
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* ================= Event offers ================= */}
            <div className={styles.aff_section}>
                <div className={styles.aff_row}>
                    <div className={styles.aff_text}>
                        <h3 className={styles.aff_title}>Event Offers</h3>
                        <p className={styles.aff_desc}>
                            Give customers your event discount on this product — on their birthday and during
                            Uniyel festival events you have joined in Event Offers.
                        </p>
                    </div>

                    <label className={styles.switch} htmlFor="allow_event_offer">
                        <input
                            id="allow_event_offer"
                            type="checkbox"
                            checked={Boolean(formData.allow_event_offer)}
                            onChange={handleInputChange}
                        />
                        <span className={styles.switch_track}>
                            <span className={styles.switch_thumb} />
                        </span>
                        <span className={styles.switch_text}>
                            {formData.allow_event_offer ? 'On' : 'Off'}
                        </span>
                    </label>
                </div>
                {formData.allow_event_offer && (
                    <div className={styles.aff_info}>
                        <span className={styles.aff_info_text}>
                            The % you set for each event (Event Offers page) is taken off this product’s selling price. You fund the discount.
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
});

ExtrasAttachmentsTab.displayName = 'ExtrasAttachmentsTab';
export default ExtrasAttachmentsTab;