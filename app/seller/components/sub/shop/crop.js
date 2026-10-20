'use client';

import { useEffect, useRef, useState } from 'react';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { FaTimes, FaCheck, FaUndo, FaRedo, FaSearchPlus, FaSearchMinus } from 'react-icons/fa';
import { ImSpinner2 } from 'react-icons/im';
import styles from '../css/crop.module.css';

export default function ImageCropperModal({ image, type, onCropComplete, onClose }) {
    const imageRef = useRef(null);
    const previewRef = useRef(null);
    const cropperRef = useRef(null);
    const [cropper, setCropper] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [loading, setIsLoading] = useState(false);
    // Define aspect ratios based on type
    const getAspectRatio = () => {
        switch (type) {
            case 'banner':
                return 4 / 2; // 4:1 for banners
            case 'img':
                return 1; // 1:1 for logos
            case 'storePhoto':
            case 'gallery':
                return 4 / 3; // 4:3 for store photos
            default:
                return 1;
        }
    };

    const getCropTitle = () => {
        switch (type) {
            case 'banner':
                return 'Crop Banner (4:1)';
            case 'logo':
                return 'Crop Logo (1:1)';
            case 'storePhoto':
                return 'Crop Store Photo (4:3)';
            default:
                return 'Crop Image';
        }
    };

    const getCropDimensions = () => {
        switch (type) {
            case 'banner':
                return { width: 1600, height: 400 }; // 4:1 ratio
            case 'img':
                return { width: 400, height: 400 }; // 1:1 ratio
            case 'storePhoto':
                return { width: 800, height: 600 }; // 4:3 ratio
            default:
                return { width: 800, height: 600 };
        }
    };

    const aspectRatio = getAspectRatio();
    const cropTitle = getCropTitle();
    const cropDimensions = getCropDimensions();

    useEffect(() => {
        if (imageRef.current && image) {
            // Initialize cropper
            const cropperInstance = new Cropper(imageRef.current, {
                aspectRatio,
                viewMode: 1,
                preview: previewRef.current,
                responsive: true,
                restore: true,
                checkCrossOrigin: false,
                autoCropArea: 0.8,
                guides: true,
                center: true,
                highlight: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false,
                zoomable: true,
                zoomOnTouch: true,
                zoomOnWheel: true,
                minContainerWidth: 200,
                minContainerHeight: 200,
                minCanvasWidth: 200,
                minCanvasHeight: 200,
                minCropBoxWidth: 50,
                minCropBoxHeight: 50,
                ready() {
                    console.log('Cropper ready');
                    setZoomLevel(cropperInstance.getData().scaleX || 1);
                },
                crop(event) {
                    setZoomLevel(event.detail.scaleX || 1);
                }
            });

            cropperRef.current = cropperInstance;
            setCropper(cropperInstance);

            return () => {
                if (cropperInstance) {
                    cropperInstance.destroy();
                }
            };
        }
    }, [image, aspectRatio]);

    const handleCrop = () => {
        setIsLoading(true);
        if (cropper) {
            const canvas = cropper.getCroppedCanvas({
                width: cropDimensions.width,
                height: cropDimensions.height,
                fillColor: '#fff',
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high',
            });

            if (canvas) {
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `cropped-${type}.jpg`, {
                            type: 'image/jpeg'
                        });
                        onCropComplete(file); // Pass both if needed
                    }
                    setIsLoading(false);
                }, 'image/jpeg', 0.92);
            }
        }
    };

    const handleZoomIn = () => {
        if (cropper) {
            cropper.zoom(0.1);
        }
    };

    const handleZoomOut = () => {
        if (cropper) {
            cropper.zoom(-0.1);
        }
    };

    const handleRotateLeft = () => {
        if (cropper) {
            cropper.rotate(-90);
        }
    };

    const handleRotateRight = () => {
        if (cropper) {
            cropper.rotate(90);
        }
    };

    const handleReset = () => {
        if (cropper) {
            cropper.reset();
        }
    };

    const handleClear = () => {
        if (cropper) {
            cropper.clear();
        }
    };


    // Get recommended aspect ratios based on type
    const getRecommendedRatios = () => {
        switch (type) {
            case 'banner':
                return [
                    { ratio: 4 / 1, label: '4:1 (Banner)' },
                    { ratio: 3 / 1, label: '3:1 (Header)' },
                    { ratio: 2 / 1, label: '2:1 (Wide)' }
                ];
            case 'logo':
                return [
                    { ratio: 1, label: '1:1 (Square)' },
                    { ratio: 4 / 3, label: '4:3 (Standard)' },
                    { ratio: 3 / 2, label: '3:2 (Photo)' }
                ];
            case 'storePhoto':
                return [
                    { ratio: 4 / 3, label: '4:3 (Store Photo)' },
                    { ratio: 3 / 2, label: '3:2 (Photo)' },
                    { ratio: 16 / 9, label: '16:9 (Widescreen)' }
                ];
            default:
                return [
                    { ratio: 4 / 3, label: '4:3 (Standard)' },
                    { ratio: 1, label: '1:1 (Square)' },
                    { ratio: 16 / 9, label: '16:9 (Widescreen)' }
                ];
        }
    };

    const recommendedRatios = getRecommendedRatios();

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <div className={styles.modalTitle}>
                        <h3>{cropTitle}</h3>
                        <div className={styles.dimensionsInfo}>
                            Output: {cropDimensions.width}×{cropDimensions.height}px
                        </div>
                    </div>
                    <button onClick={onClose} className={styles.closeButton}>
                        <FaTimes />
                    </button>
                </div>

                <div className={styles.cropperContainer}>
                    <div className={styles.mainCropper}>
                        <img
                            ref={imageRef}
                            src={image}
                            alt="Crop"
                            className={styles.cropperImage}
                            crossOrigin="anonymous"
                        />
                    </div>

                    <div className={styles.previewSection}>
                        <h4>Preview</h4>
                        <div
                            ref={previewRef}
                            className={`${styles.previewBox} ${type === 'banner' ? styles.previewBanner :
                                type === 'logo' ? styles.previewLogo :
                                    styles.previewPhoto
                                }`}
                        />
                        <div className={styles.previewInfo}>
                            <div className={styles.zoomInfo}>
                                <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.toolbar}>
                    <div className={styles.toolbarLeft}>
                        <div className={styles.toolbarGroup}>
                            <span className={styles.toolbarLabel}>Zoom:</span>
                            <button onClick={handleZoomIn} className={styles.toolbarButton}>
                                <FaSearchPlus />
                            </button>
                            <button onClick={handleZoomOut} className={styles.toolbarButton}>
                                <FaSearchMinus />
                            </button>
                        </div>

                        <div className={styles.toolbarGroup}>
                            <span className={styles.toolbarLabel}>Rotate:</span>
                            <button onClick={handleRotateLeft} className={styles.toolbarButton}>
                                <FaUndo />
                            </button>
                            <button onClick={handleRotateRight} className={styles.toolbarButton}>
                                <FaRedo />
                            </button>
                        </div>

                        <button onClick={handleReset} className={styles.toolbarButton}>
                            Reset
                        </button>
                        <button onClick={handleClear} className={styles.toolbarButton}>
                            Clear
                        </button>
                    </div>

                    <div className={styles.toolbarRight}>
                        <button onClick={onClose} className={styles.toolbarButtonCancel}>
                            Cancel
                        </button>
                        <button onClick={handleCrop} className={styles.toolbarButtonConfirm}>
                            {loading
                                ? <ImSpinner2 className='spin' />
                                : <>
                                    <FaCheck /> Apply Crop
                                </>
                            }
                        </button>
                    </div>
                </div>

                <div className={styles.instructions}>
                    <div className={styles.instructionsHeader}>
                        <h4>Instructions:</h4>
                        <div className={styles.currentType}>
                            Type: <span className={styles.typeBadge}>{type}</span>
                        </div>
                    </div>
                    <ul>
                        <li>Drag the crop box to reposition</li>
                        <li>Use mouse wheel to zoom in/out</li>
                        <li>Click and drag to move the image</li>
                        <li>Use toolbar buttons for precise adjustments</li>
                        <li className={styles.importantNote}>
                            <strong>Important:</strong> {
                                type === 'banner' ? 'Banner must maintain 4:1 ratio' :
                                    type === 'logo' ? 'Logo must maintain 1:1 ratio' :
                                        'Recommended ratio is 4:3'
                            }
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}