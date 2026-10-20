// components/PricingOffersTab.jsx
'use client';

import { memo } from 'react';
import styles from './css/pricing.module.css';
import { IoCloseCircle, IoAdd } from "react-icons/io5";

const PricingOffersTab = memo(({
    formData,
    handleInputChange,
    setFormData,
    amounts,
    comboOffers,
    comboSummaries,
    currentComboOffer,
    setCurrentComboOffer,
    addComboOffer,
    removeComboOffer,
    addNotification
}) => (
    <div className={styles.form_section}>
        <h2>Pricing & Offers</h2>

        <div className={styles.pricing_grid}>
            <div className={styles.form_group}>
                <label htmlFor="price">MRP: <span>(required*)</span></label>
                <input
                    type="number"
                    id="price"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                />
            </div>

            <div className={styles.form_group}>
                <label htmlFor="discount">Selling Price: <span>(required*)</span></label>
                <input
                    type="number"
                    id="discount"
                    min="0"
                    value={formData.discount}
                    onChange={handleInputChange}
                    required
                />
            </div>

            <div className={styles.form_group}>
                <label htmlFor="cost">Product Cost: <span>(Internal*)</span></label>
                <input
                    type="number"
                    id="cost"
                    min="0"
                    placeholder='Used for profit calculation'
                    value={formData.cost}
                    onChange={handleInputChange}
                    required
                />
            </div>

            <div className={styles.form_group}>
                <label htmlFor="quantity">Stock Quantity: <span>(required*)</span></label>
                <input
                    type="number"
                    id="quantity"
                    min="0"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                />
            </div>

            <div className={styles.form_group}>
                <label htmlFor="affiliate_commission">Affiliate Commission (%):</label>
                <input
                    type="number"
                    id="affiliate_commission"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.affiliate_commission}
                    onChange={handleInputChange}
                    placeholder="0.0"
                />
            </div>
        </div>

        {/* Pricing Summary */}
        {formData.price && formData.discount && (
            <div className={styles.pricing_summary}>
                <h4>Pricing Summary</h4>
                <div className={styles.summary_row}>
                    <span>MRP:</span>
                    <span>₹{amounts.price.toFixed(2)}</span>
                </div>
                <div className={styles.summary_row}>
                    <span>Selling Price:</span>
                    <span>₹{amounts.discount.toFixed(2)}</span>
                </div>
                <div className={styles.summary_row}>
                    <span>You Save:</span>
                    <span className={styles.savings}>₹{amounts.savings.toFixed(2)}</span>
                </div>
                <div className={styles.summary_row}>
                    <span>Delivery Charge:</span>
                    <span>₹{amounts.deliveryCharge.toFixed(2)}</span>
                </div>
                <div className={styles.summary_row}>
                    <span>Subtotal:</span>
                    <span>₹{amounts.subtotal.toFixed(2)}</span>
                </div>
                <div className={styles.summary_row}>
                    <span>Gateway Fee (2.5%):</span>
                    <span>₹{amounts.gatewayFee.toFixed(2)}</span>
                </div>
                <div className={styles.summary_row + ' ' + styles.total}>
                    <span><strong>Net Amount:</strong></span>
                    <span><strong>₹{amounts.netAmount.toFixed(2)}</strong></span>
                </div>
            </div>
        )}

        {/* Combo Offers Section */}
        <div className={styles.form_group} style={{ marginTop: '20px' }}>
            <label>Combo Offers (MAX - 5)</label>
            <div className={styles.compination}>
                <div>
                    <label htmlFor="comboQuantity">Quantity:</label>
                    <input
                        type="number"
                        id="comboQuantity"
                        min="1"
                        value={currentComboOffer.quantity}
                        onChange={(e) => setCurrentComboOffer(prev => ({
                            ...prev,
                            quantity: e.target.value
                        }))}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="comboPerUnit">Per Unit Price:</label>
                    <input
                        type="number"
                        id="comboPerUnit"
                        min="0"
                        value={currentComboOffer.perUnit}
                        onChange={(e) => setCurrentComboOffer(prev => ({
                            ...prev,
                            perUnit: e.target.value
                        }))}
                        required
                    />
                </div>
                <button
                    className={styles.addBtn}
                    onClick={addComboOffer}
                    disabled={!currentComboOffer.quantity || !currentComboOffer.perUnit || comboOffers.length >= 5}
                >
                    <IoAdd size={25} />
                </button>
            </div>

            {comboOffers.length > 0 && (
                <div className={styles.comboOffersList}>
                    <h4>Active Combo Offers:</h4>
                    {comboOffers.map((offer, index) => {
                        const summary = comboSummaries[index];
                        return (
                            <div key={index} className={styles.comboOfferItem}>
                                <div className={styles.combo_main_info}>
                                    <div className={styles.combo_basic}>
                                        <span className={styles.combo_quantity}>
                                            Buy {offer.quantity} @ ₹{offer.perUnit}/unit
                                        </span>
                                        <span style={{ fontWeight: 'bold', color: '#16a34a' }}>Total: ₹{offer.total}</span>
                                    </div>
                                    {formData.price && summary && (
                                        <div className={styles.combo_summary}>
                                            <div className={styles.combo_summary_row}>
                                                <span>Original MRP Total:</span>
                                                <span>₹{summary.originalPriceTotal.toFixed(2)}</span>
                                            </div>
                                            <div className={styles.combo_summary_row}>
                                                <span>Combo Price:</span>
                                                <span>₹{summary.total.toFixed(2)}</span>
                                            </div>
                                            <div className={styles.combo_summary_row}>
                                                <span>You Save:</span>
                                                <span className={styles.combo_savings}>₹{summary.savingsCombo.toFixed(2)}</span>
                                            </div>
                                            <div className={styles.combo_summary_row + ' ' + styles.combo_total}>
                                                <span><strong>Net Amount:</strong></span>
                                                <span><strong>₹{summary.netAmountCombo.toFixed(2)}</strong></span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button className={styles.removeComboOffer} onClick={() => removeComboOffer(index)}>
                                    <IoCloseCircle size={18} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    </div>
));

export default PricingOffersTab;