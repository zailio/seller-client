// components/ProductDetailsTab.jsx
'use client';

import { memo } from 'react';
import styles from './css/details.module.css';
import { IoCloseCircle } from "react-icons/io5";
import KeyValueSelector from './keyupload';

const ProductDetailsTab = memo(({
    formData,
    handleInputChange,
    quickPoints,
    currentQuickPoint,
    setCurrentQuickPoint,
    addQuickPoint,
    removeQuickPoint,
    selectedHighlight,
    setSelectedHighlight,
    addNotification
}) => (
    <div className={styles.form_section}>
        <h2>Product Details & Specifications</h2>

        <div className={styles.form_group}>
            <label htmlFor="gender">Gender:</label>
            <select
                id="gender"
                value={formData.gender}
                onChange={handleInputChange}
            >
                <option value="" disabled>Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="unisex">Unisex</option>
            </select>
        </div>
        <div className={styles.inventory_section}>
            <h3 className={styles.subsection_title}>Inventory & Physical Properties</h3>

            <div className={styles.inventory_grid}>
                <div className={styles.form_group}>
                    <label htmlFor="quantity">Stock Quantity: <span>(required*)</span></label>
                    <input
                        type="number"
                        id="quantity"
                        min="1"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        placeholder="Available stock"
                        required
                    />
                </div>

                <div className={styles.form_group}>
                    <label htmlFor="weight">Product Weight (grams): <span>(Crucial for Delivery*)</span></label>
                    <input
                        type="number"
                        id="weight"
                        min="0"
                        step="0.01"
                        value={formData.weight}
                        onChange={handleInputChange}
                        placeholder="e.g. 500"
                        required
                    />
                    <small style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                        * Delivery charge: ₹95 base. Extra ₹40 for each kg. Charges may vary based on customer location. Any additional cost will be refunded to your account.
                    </small>
                </div>
            </div>

            <div className={styles.shipment_dimensions}>
                <h4 className={styles.dimension_title}>Shipment Dimensions (cm)</h4>
                <div className={styles.dimensions_grid}>
                    <div className={styles.form_group}>
                        <label htmlFor="shipment_length">Length:</label>
                        <input
                            type="number"
                            id="shipment_length"
                            min="0"
                            step="0.1"
                            value={formData.shipment_length}
                            onChange={handleInputChange}
                            placeholder="0.0"
                        />
                    </div>
                    <div className={styles.form_group}>
                        <label htmlFor="shipment_width">Width:</label>
                        <input
                            type="number"
                            id="shipment_width"
                            min="0"
                            step="0.1"
                            value={formData.shipment_width}
                            onChange={handleInputChange}
                            placeholder="0.0"
                        />
                    </div>
                    <div className={styles.form_group}>
                        <label htmlFor="shipment_height">Height:</label>
                        <input
                            type="number"
                            id="shipment_height"
                            min="0"
                            step="0.1"
                            value={formData.shipment_height}
                            onChange={handleInputChange}
                            placeholder="0.0"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div className={styles.points_section}>
            <div>
                <label>Quick Points:</label>
                <div className={styles.point_input}>
                    <input
                        type="text"
                        placeholder="Enter quick point"
                        value={currentQuickPoint}
                        onChange={(e) => setCurrentQuickPoint(e.target.value)}
                    />
                    <button
                        className={styles.add_point}
                        onClick={addQuickPoint}
                        disabled={!currentQuickPoint.trim()}
                    >
                        +
                    </button>
                </div>
                <ul className={styles.points_list}>
                    {quickPoints.map((point, index) => (
                        <li key={index}>
                            {point}
                            <button
                                className={styles.remove_point}
                                onClick={() => removeQuickPoint(index)}
                            >
                                <IoCloseCircle size={16} />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        <KeyValueSelector
            addNotification={addNotification}
            selectedHighlight={selectedHighlight}
            setSelectedHighlight={setSelectedHighlight}
        />
    </div>
));

export default ProductDetailsTab;