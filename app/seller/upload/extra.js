// components/ExtrasAttachmentsTab.jsx
'use client';

import { memo } from 'react';
import styles from './css/extra.module.css';
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

const ExtrasAttachmentsTab = memo(({
    formData,
    handleInputChange,
}) => (
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
            {/* seperate packing like current db actioned data */}
            <div className={styles.checkbox_single}>
                <p>seperate pakcing like Information will been rcorded, its is used to for handling delivery charge by same package or not</p>
                
                <ul>
                    <li>tick this if <strong>fragile</strong> like seprate packign needed product</li>
                    <li>untick if product allow 2 and more items in a single order(its help to prevent seprate delivery charge on same address pickup)</li>
                    <li>qubic weight will calculated, not vary for invalid shipment charge</li>
                </ul>
                <div className={styles.checkbox_item}>
                    <input id="s_p" type="checkbox" checked={formData.s_p} onChange={handleInputChange} />
                    <label htmlFor="s_p">Seperate Packaging</label>
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
    </div>
));

ExtrasAttachmentsTab.displayName = 'ExtrasAttachmentsTab';
export default ExtrasAttachmentsTab;