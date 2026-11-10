// components/ReviewUploadTab.jsx
'use client';

import { memo } from 'react';
import styles from './css/review.module.css';
import { ImSpinner2 } from 'react-icons/im';
import { IoWarningOutline } from "react-icons/io5";

const ReviewUploadTab = memo(({
    formData,
    selectedSubCategory,
    onUpload,
    imgDon,
    uploadProduct,
    loadedSku,
    amounts
}) => (
    <div className={styles.form_section}>
        <h2>Review & Upload</h2>

        <div className={styles.review_summary}>
            <h3>Product Summary</h3>

            <div className={styles.review_grid}>
                <div className={styles.review_section}>
                    <h4>Basic Information</h4>
                    <div className={styles.review_item}><span>Title:</span> <span>{formData.title || 'Not set'}</span></div>
                    <div className={styles.review_item}><span>Category:</span> <span>{selectedSubCategory?.name || 'Not set'}</span></div>
                    <div className={styles.review_item}><span>SKU:</span> <span>{formData.sku || 'Auto-generated'}</span></div>
                </div>

                <div className={styles.review_section}>
                    <h4>Pricing & Logistics</h4>
                    <div className={styles.review_item}><span>MRP:</span> <span>₹{formData.price}</span></div>
                    <div className={styles.review_item}><span>Selling Price:</span> <span>₹{formData.discount}</span></div>
                    <div className={styles.review_item}><span>Weight:</span> <span>{formData.weight} g</span></div>
                    <div className={styles.review_item}><span>Delivery Charge:</span>
                        <span style={{ color: amounts.deliveryCharge > 0 ? '#ea580c' : '#16a34a', fontWeight: 'bold' }}>
                            {formData.delivery_charge === 'free' ? 'FREE' : `₹${amounts.deliveryCharge}`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Category Based Rules Section */}
            <div className={styles.review_section} style={{ marginTop: '20px', borderLeft: '4px solid #2563eb' }}>
                <h4>Category & Business Rules</h4>
                <div className={styles.review_item}>
                    <span>Return Period:</span>
                    <span style={{ fontWeight: '500' }}>{selectedSubCategory?.return ? '3 days' : 'N/A'}</span>
                </div>
                <div className={styles.review_item}>
                    <span>Replacement:</span>
                    <span style={{ color: selectedSubCategory?.replacements ? '#16a34a' : '#ef4444' }}>
                        {selectedSubCategory?.replacements ? '7 days' : 'N/A'}
                    </span>
                </div>
                <div className={styles.review_item}>
                    <span>OpenBox Delivery:</span>
                    <span style={{ color: selectedSubCategory?.open_box_delivery ? '#16a34a' : '#ef4444' }}>
                        {selectedSubCategory?.open_box_delivery ? 'Required' : 'N/A'}
                    </span>
                    <span>
                        An additional cost may be deducted for OpenBox. This is dynamic based on product price.
                    </span>
                </div>
                <div className={styles.review_item}>
                    <span>Payment Type:</span>
                    <span style={{ color: selectedSubCategory?.payment_type === 'cod' ? '#16a34a' : '#ef4444' }}>
                        {selectedSubCategory?.payment_type || 'N/A'}
                    </span>
                </div>
            </div>

            {/* Disclaimer Note */}
            <div style={{
                marginTop: '25px',
                padding: '15px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fcd34d',
                borderRadius: '8px',
                display: 'flex',
                gap: '10px',
                alignItems: 'start'
            }}>
                <IoWarningOutline size={30} color="#d97706" style={{ minWidth: '30px' }} />
                <div>
                    <h5 style={{ margin: '0 0 5px 0', color: '#b45309', fontSize: '0.95rem' }}>Important Delivery Note</h5>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e', lineHeight: '1.4' }}>
                        Delivery charge: ₹95 base price, extra ₹40 for each additional kg. This may vary based on customer location. Any additional cost collected will be refunded to your account.
                    </p>
                </div>
            </div>
        </div>

        <div className={styles.upload_action}>
            <button
                disabled={onUpload || imgDon !== true}
                className={styles.btn}
                onClick={uploadProduct}>
                {onUpload ? (
                    <>
                        <ImSpinner2 className={styles.spinner} />
                        <span className={styles.buttonText}>
                            {loadedSku ? "UPDATING PRODUCT..." : "UPLOADING PRODUCT..."}
                        </span>
                    </>
                ) : (
                    <span className={styles.buttonText}>
                        {loadedSku ? "UPDATE PRODUCT" : "UPLOAD PRODUCT"}
                    </span>
                )}
            </button>
        </div>
    </div>
));

export default ReviewUploadTab;