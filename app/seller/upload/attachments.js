'use client';

import { useState } from 'react';
import styles from './css/attachments.module.css';
import { FaImage, FaKeyboard, FaPaperclip, FaCloudUploadAlt, FaUpload, FaTrash, FaInfoCircle } from 'react-icons/fa';

const AttachmentManager = ({ addNotification, attachments, setAttachments }) => {
    const [imageAdded, setImageAdded] = useState(false);
    const addAttachment = (inputType) => {
        if (inputType === 'image' && imageAdded) {
            return addNotification({
                h2: 'one image!',
                desc: 'You can only add one image upload per product.'
            });
        }

        const newAttachment = { inputType };
        if (inputType === 'image') {
            newAttachment.count = 1
            setImageAdded(true);
        } else {
            newAttachment.inputType = 'text';
            newAttachment.label = ''
        };
        setAttachments([...attachments, newAttachment]);
    };

    const removeAttachment = (id, inputType) => {
        setAttachments(attachments.filter((_, key) => key !== id));
        if (inputType === 'image') setImageAdded(false);
    };
    const updateAttachment = (id, value, key) => {
        setAttachments(prev => {
            return prev.map((data, index) => {
                if (index === id) return { ...data, [key]: value };
                return data;
            });
        });
    };
    return (
        <div className={styles.formSection}>
            <h2><FaPaperclip className={styles.icon} /> Additional Collections</h2>
            <p>Select the type of attachment you want to add: its help to collect data like image, dob, name liek infos from customer</p>

            <div className={styles.attachmentOptions}>
                {!imageAdded && (
                    <div
                        className={styles.attachmentOption}
                        onClick={() => addAttachment('image')}
                    >
                        <FaImage className={styles.optionIcon} />
                        Image Upload
                    </div>
                )}
                <div
                    className={styles.attachmentOption}
                    onClick={() => addAttachment('input')}
                >
                    <FaKeyboard className={styles.optionIcon} />
                    Input Field
                </div>
            </div>

            <div className={styles.addedAttachments}>
                {attachments.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FaCloudUploadAlt className={styles.emptyIcon} />
                        <h3>No attachments added yet</h3>
                        <p>Start by selecting an attachment type above</p>
                    </div>
                ) : (
                    attachments.map((attachment, key) => (
                        <div className={styles.attachmentItem} key={key + 'attachments'}>
                            <div className={styles.attachmentHeader}>
                                {attachment.inputType === 'image' ? (
                                    <FaImage className={styles.attachmentIcon} />
                                ) : (
                                    <FaKeyboard className={styles.attachmentIcon} />
                                )}
                                <div className={styles.attachmentInfo}>
                                    {attachment.inputType === 'image' ? (
                                        <>
                                            <div className={styles.attachmentTitle}>
                                                <span>Image Upload</span>
                                                <FaInfoCircle className={styles.badge} />
                                            </div>
                                            <input
                                                className={styles.formControl} required
                                                value={attachment.count}
                                                onChange={(e) => updateAttachment(key, e.target.value, 'count')}
                                                max={10}
                                                type='number'
                                                placeholder='enter the number of images allowed'
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <div className={styles.attachmentTitle}>Input Field</div>
                                            <div className={styles.formGroup}>
                                                <label>Field Label</label>
                                                <input
                                                    type="text"
                                                    className={styles.formControl} required
                                                    value={attachment.label}
                                                    onChange={(e) => updateAttachment(key, e.target.value, 'label')}
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Field Type</label>
                                                <select
                                                    className={styles.formControl}
                                                    value={attachment.inputType}
                                                    onChange={(e) => updateAttachment(key, e.target.value, 'inputType')}
                                                >
                                                    <option value="text">Text</option>
                                                    <option value="number">Number</option>
                                                    <option value="email">Email</option>
                                                    <option value="date">Date</option>
                                                </select>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className={styles.attachmentControls}>
                                <button
                                    className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}
                                    onClick={() => removeAttachment(key, attachment.type)}
                                >
                                    <FaTrash /> Remove
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AttachmentManager;