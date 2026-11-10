// Main ProductUploadPage.jsx (refactored with imports)
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import styles from './css/main.module.css';
import config from '../../../utils/config';
import { useWebSocket } from '../../../context/ws';
import { FaSearch } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';

// Import components
import BasicInfoTab from './basic';
import ProductDetailsTab from './details';
import PricingOffersTab from './pricing';
import MediaAttributesTab from './media';
import ExtrasAttachmentsTab from './extra';
import ProductAttachmentTab from './productAttachment';
import ReviewUploadTab from './reviewAndUpload';
import TabNavigation from './tab';

// utils/predefinedOptions.js
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
    ],
    // Common swatches for the product color-composition picker (Media tab).
    // Each product upload represents ONE color composition (1-3 colors) —
    // e.g. a black+white dress and a red+black dress are separate uploads.
    colorPalette: [
        { name: 'Black', hex: '#000000' },
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Grey', hex: '#9CA3AF' },
        { name: 'Red', hex: '#DC2626' },
        { name: 'Maroon', hex: '#7F1D1D' },
        { name: 'Pink', hex: '#EC4899' },
        { name: 'Orange', hex: '#F97316' },
        { name: 'Yellow', hex: '#EAB308' },
        { name: 'Beige', hex: '#E7D8C0' },
        { name: 'Brown', hex: '#78350F' },
        { name: 'Green', hex: '#16A34A' },
        { name: 'Olive', hex: '#65A30D' },
        { name: 'Teal', hex: '#0D9488' },
        { name: 'Blue', hex: '#2563EB' },
        { name: 'Navy', hex: '#1E3A8A' },
        { name: 'Purple', hex: '#9333EA' },
    ],
};

const MAX_COLORS = 3;
const MAX_SIZE_LENGTH = 20;
const MAX_VARIANTS = 30;

const isHosted = (src) => typeof src === 'string' && /^https?:\/\//.test(src);

// Fresh initial form every time (used for first render and for the reset after upload).
// `size` is a free-text field (max 20 chars) — one size per product upload,
// e.g. "Free Size", "Medium", "M", "42". Different sizes/colors of the
// same item are separate uploads, linked via `variantsIds`.
const getInitialForm = () => ({
    image: [],
    have_BA: false,        // true = this product has before & after images
    before_img: '',        // single image (local data URL until uploaded, then hosted URL)
    after_img: '',
    allow_affiliation: false,
    allow_event_offer: false, // product joins the seller's event offers (birthday / festivals)
    title: '',
    sku: '',
    subtitle: '',
    description: '',
    price: '',
    discount: '',
    cost: '',
    size: 'Free Size',
    color: [], // up to MAX_COLORS hex strings — this upload's color composition
    delivery_type: 'standard',
    gender: '',
    weight: '',
    quantity: '',
    shipment_width: '',
    shipment_height: '',
    shipment_length: '',
    affiliate_commission: '',
    product_condition: 'new',
    warranty_type: 'no_warranty',
    warranty_period: '',
    packaging_type: 'standard',
    s_p: false,
    battery_required: false,
    dangerous_goods: false,
    fragile_item: false,
    liquid_item: false,
    care_instructions: '',
    country_of_origin: 'India',
    hs_code: '',
    battery_type: '',
    assembly_required: false,
});

// Move the item at `from` to index `to`. Always returns a NEW array (never mutates).
const reorderArray = (arr, from, to) => {
    if (!Array.isArray(arr)) return arr;
    if (from === to) return arr;
    if (from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
    const next = [...arr];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
};

export default function ProductUploadPage({
    auth,
    session,
    addNotification,
    setFullPageLoading,
    warehouse,
    genAlert,
    initialSku = '',
    onInitialSkuUsed,
}) {
    const { socket, send } = useWebSocket();


    const [selectedWareHouse, setSelectedWareHouse] = useState('');
    const [skuSearch, setSkuSearch] = useState(initialSku || '');
    // Role-specific brand rules come from the server (/seller/upload/context):
    // seller → Generic (no brand), brand → its own brand, distributor → an approved brand.
    const [brandContext, setBrandContext] = useState(null);
    const [selectedBrandId, setSelectedBrandId] = useState('');
    const [loadedSku, setLoadedSku] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [onUpload, setOnUpload] = useState(false);
    const [searchedCategory, setSearchedCategory] = useState([]);
    const [searchedSubCategory, setSearchedSubCategory] = useState([]);
    const [imgDon, setImgDon] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('basic');
    const [attachments, setAttachments] = useState([]);
    const [selectedHighlight, setSelectedHighlight] = useState([]);
    const [comboOffers, setComboOffers] = useState([]);
    const [currentComboOffer, setCurrentComboOffer] = useState({ quantity: '', perUnit: '' });
    const [quickPoints, setQuickPoints] = useState([]);
    const [currentQuickPoint, setCurrentQuickPoint] = useState('');
    const [pid, setId] = useState(null);

    // product attachment (different-product cross-sell, unrelated to size/color)
    const [linkedProducts, setLinkedProducts] = useState([]);

    // ---- before / after upload in progress (Extras tab) ----
    // Whether the product HAS before/after images lives in formData.have_BA
    const [baUploading, setBaUploading] = useState(false);

    // ---- variants (same item, other size/color — linked via signed variant_id tokens) ----
    // Each entry is a signed variant_id token minted server-side by
    // /seller/upload/similar-sub-category, tying it to (sub_category, product_id).
    // The backend re-verifies the HMAC on save, so no extra SQL lookup is needed
    // to confirm the linked product is in the same sub-category.
    const [variantsIds, setVariantsIds] = useState([]);

    // Consolidated Form State including new rules
    const [formData, setFormData] = useState(getInitialForm);

    // Both before & after are hosted URLs -> nothing left to upload
    const baUploaded = isHosted(formData.before_img) && isHosted(formData.after_img);

    // WebSocket Logic
    useEffect(() => {
        if (!socket) return;
        const handleMessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.event === 'category') {
                if (!Array.isArray(data.data) || !data.data.length) {
                    return addNotification({ h2: 'Not found', desc: 'No category found.', tag: 'info' });
                };
                setSearchedCategory(data.data);
                setIsLoading(false);
            };
        };
        socket.addEventListener('message', handleMessage);
        return () => { socket.removeEventListener('message', handleMessage); };
    }, [socket, addNotification]);

    // Debounced Category Search Logic (157ms)
    useEffect(() => {
        if (!searchQuery || searchQuery.trim() === '') {
            setSearchedCategory([]);
            return;
        }

        const debounceTimer = setTimeout(() => {
            setIsLoading(true);
            send({ path: 'search', event: 'category', data: { text: searchQuery } });
        }, 157);

        return () => {
            clearTimeout(debounceTimer);
        };
    }, [searchQuery, send]);

    // Recalculate Amounts - UPDATED LOGIC FOR DYNAMIC DELIVERY
    const amounts = useMemo(() => {
        const price = parseFloat(formData.price) || 0;
        const discount = parseFloat(formData.discount) || 0;

        // Weight calculation: 95 base + 40 per KG
        const weightVal = parseFloat(formData.weight) || 0;
        const deliveryCharge = weightVal > 0 ? 95 + ((weightVal / 1000) * 40) : 0;

        // "never add to final discount instead it - it" implies subtraction
        // Subtotal = Selling Price
        const subtotal = discount;
        const gatewayFee = subtotal * 0.025;

        // Net Amount = Selling Price - Delivery - Gateway
        const netAmount = subtotal - deliveryCharge - gatewayFee;

        return {
            price,
            discount,
            deliveryCharge,
            subtotal,
            gatewayFee,
            netAmount,
            savings: price - discount
        };
    }, [formData.price, formData.discount, formData.weight]);

    // Dummy Summaries for Combos to avoid breaking
    const comboSummaries = useMemo(() => {
        return comboOffers.map(() => ({
            originalPriceTotal: 0, total: 0, savingsCombo: 0, deliveryCharge: 0, subtotalCombo: 0, gatewayFeeCombo: 0, netAmountCombo: 0
        }));
    }, [comboOffers]);

    // Handle Input (also handles the `allow_affiliation` switch and `have_BA` — checkboxes with those ids)
    const handleInputChange = useCallback((e) => {
        const { id, type, checked, value } = e.target;
        if (id === 'sku') {
            setFormData(prev => ({ ...prev, [id]: value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase() }));
        } else {
            setFormData(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }));
        }
    }, []);

    // ---- Color handlers ----
    // Toggling an already-selected color removes it; toggling a new one adds
    // it as long as we're under MAX_COLORS.
    const toggleColor = useCallback((hex) => {
        setFormData(prev => {
            const has = prev.color.includes(hex);
            if (has) return { ...prev, color: prev.color.filter(c => c !== hex) };
            if (prev.color.length >= MAX_COLORS) {
                addNotification({ h2: 'Color limit', desc: `You can pick up to ${MAX_COLORS} colors for one product.`, tag: 'info' });
                return prev;
            }
            return { ...prev, color: [...prev.color, hex] };
        });
    }, [addNotification]);

    const removeColor = useCallback((hex) => {
        setFormData(prev => ({ ...prev, color: prev.color.filter(c => c !== hex) }));
    }, []);

    // ---- Size handler ----
    // Free text, capped at MAX_SIZE_LENGTH. Seller's own words — "Free Size",
    // "Medium", "M", "42", whatever fits.
    const onSizeChange = useCallback((value) => {
        setFormData(prev => ({ ...prev, size: (value || '').slice(0, MAX_SIZE_LENGTH) }));
    }, []);

    // Uploads ONE local (data URL) image to the server.
    // Already-hosted images are returned untouched. Never rejects: resolves {url, ok}.
    const uploadDataUrl = useCallback((src, tag, label) => new Promise((resolve) => {
        if (typeof src !== 'string' || !src.startsWith('data:')) {
            return resolve({ url: src, ok: true });
        }

        const fail = (h2, desc) => {
            addNotification({ h2, desc, tag });
            resolve({ url: src, ok: false });
        };

        fetch(src)
            .then(res => res.blob())
            .then(blob => {
                const uploadForm = new FormData();
                uploadForm.append('formatImg', 'jpg');
                uploadForm.append('file', blob, 'upload.png');

                const xhr = new XMLHttpRequest();

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        let percent = (event.loaded / event.total) * 100;
                        if (percent > 99) percent = 99;
                        addNotification({
                            h2: 'Uploading...',
                            desc: `${label} - ${percent.toFixed(2)}%`,
                            tag,
                        });
                    }
                };

                xhr.onload = () => {
                    if (xhr.status !== 200) return fail('Error!', `${label} upload failed.`);
                    try {
                        const res = JSON.parse(xhr.responseText);
                        if (!res.url) return fail('Error!', `${label} upload failed.`);
                        addNotification({
                            h2: 'Uploaded!',
                            desc: `${label} uploaded successfully.`,
                            tag,
                        });
                        resolve({ url: res.url, ok: true });
                    } catch (_) {
                        fail('Error!', `${label} upload failed.`);
                    }
                };

                xhr.onerror = () => fail('Network Error!', `${label} failed.`);

                xhr.open('POST', `${config.SERVER_URL}/api/get_url`);
                xhr.setRequestHeader('Authorization', `Bearer ${auth}`);
                xhr.send(uploadForm);
            })
            .catch(() => fail('Fetch Error!', `${label} fetch failed.`));
    }), [auth, addNotification]);

    // ---- Image handlers ----
    const handleImageUpload = useCallback((e) => {
        if (imgDon === 'on') return; // an upload is running, don't touch the list
        const files = Array.from(e.target.files);
        if (!files.length) return;
        const newImages = new Array(files.length);
        let loaded = 0;
        files.forEach((file, i) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                newImages[i] = ev.target.result;
                loaded += 1;
                if (loaded === files.length) {
                    setFormData(prev => ({ ...prev, image: [...prev.image, ...newImages] }));
                    // new local files were added, so images need uploading again
                    setImgDon(false);
                }
            };
            reader.readAsDataURL(file);
        });
    }, [imgDon]);

    const rmImg = useCallback((i) => {
        if (imgDon === 'on') return; // don't change the list while uploading
        setFormData(prev => ({ ...prev, image: prev.image.filter((_, index) => index !== i) }));
    }, [imgDon]);

    // Drag-and-drop reorder (called by MediaAttributesTab on drop).
    // First image = cover image, so this order is what gets saved.
    const onImagesReorder = useCallback((from, to) => {
        if (imgDon === 'on') return; // don't reorder while uploading
        setFormData(prev => ({
            ...prev,
            image: reorderArray(prev.image, from, to),
        }));
    }, [imgDon]);

    // Uploads every local image in parallel, but keeps the ORIGINAL ORDER:
    // results are collected by index and written to state once, after all finish.
    // Images that are already hosted (http/https URLs) are kept as they are.
    const uploadImg = useCallback(async () => {
        const originals = [...formData.image];
        if (!originals.length) return;
        const total = originals.length;
        setImgDon('on');

        // Promise.all keeps results in the same order as `originals`
        const results = await Promise.all(
            originals.map((src, i) => uploadDataUrl(src, `uploading_${i}`, `Image ${i + 1}/${total}`))
        );
        const allOk = results.every(r => r.ok);

        setFormData(prev => ({ ...prev, image: results.map(r => r.url) }));
        // true only when every image is hosted; otherwise let the seller retry
        setImgDon(allOk ? true : false);
    }, [formData.image, uploadDataUrl]);

    // ---- Before / After handlers ----
    const onBeforeAfterSelect = useCallback((kind, e) => {
        if (baUploading) return;
        const file = e.target.files && e.target.files[0];
        e.target.value = ''; // allow picking the same file again later
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            return addNotification({ h2: 'Invalid file', desc: 'Please choose an image file.', tag: 'error' });
        }
        const key = kind === 'before' ? 'before_img' : 'after_img';
        const reader = new FileReader();
        reader.onload = (ev) => {
            setFormData(prev => ({ ...prev, [key]: ev.target.result }));
        };
        reader.readAsDataURL(file);
    }, [baUploading, addNotification]);

    const onBeforeAfterRemove = useCallback((kind) => {
        if (baUploading) return;
        const key = kind === 'before' ? 'before_img' : 'after_img';
        setFormData(prev => ({ ...prev, [key]: '' }));
    }, [baUploading]);

    // Submit for the before/after pair: uploads both in parallel.
    // Failed ones stay local so the seller can press the button again.
    const uploadBeforeAfter = useCallback(async () => {
        if (baUploading) return;
        if (!formData.before_img || !formData.after_img) {
            return addNotification({ h2: 'Before/After!', desc: 'Please add both the before and after image.', tag: 'error' });
        }
        setBaUploading(true);
        const [before, after] = await Promise.all([
            uploadDataUrl(formData.before_img, 'uploading_before', 'Before image'),
            uploadDataUrl(formData.after_img, 'uploading_after', 'After image'),
        ]);
        setFormData(prev => ({ ...prev, before_img: before.url, after_img: after.url }));
        setBaUploading(false);
        if (before.ok && after.ok) {
            addNotification({ h2: 'Uploaded!', desc: 'Before & After images are ready.', tag: 'done' });
        }
    }, [baUploading, formData.before_img, formData.after_img, uploadDataUrl, addNotification]);

    // Point handlers
    const addQuickPoint = useCallback(() => {
        if (currentQuickPoint) { setQuickPoints(p => [...p, currentQuickPoint]); setCurrentQuickPoint(''); }
    }, [currentQuickPoint]);
    const removeQuickPoint = useCallback((i) => setQuickPoints(p => p.filter((_, x) => x !== i)), []);

    // Combo handlers
    const addComboOffer = useCallback(() => {
        if (currentComboOffer.quantity && currentComboOffer.perUnit) {
            const total = (currentComboOffer.quantity * currentComboOffer.perUnit).toFixed(2);
            setComboOffers(p => [...p, { ...currentComboOffer, total }]);
            setCurrentComboOffer({ quantity: '', perUnit: '' });
        }
    }, [currentComboOffer]);
    const removeComboOffer = useCallback((i) => setComboOffers(p => p.filter((_, x) => x !== i)), []);

    // Search Category (Manual Trigger)
    const handleSearch = useCallback((e) => {
        e.preventDefault();
        setIsLoading(true);
        send({ path: 'search', event: 'category', data: { text: searchQuery } });
    }, [searchQuery, send]);

    useEffect(() => {
        let cancelled = false;
        fetch(config.SERVER_URL + '/seller/upload/context', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` },
            body: JSON.stringify({ session_id: session }),
        })
            .then((res) => res.json())
            .then((json) => {
                if (cancelled || !json?.data?.status) return;
                setBrandContext(json.data);
                if (json.data.brand_mode === 'choose_approved_brand' && json.data.brands?.length === 1) {
                    setSelectedBrandId(String(json.data.brands[0].id));
                }
            })
            .catch(() => { });
        return () => { cancelled = true; };
    }, [auth, session]);

    // Opened from Products → "Edit": load that SKU straight into update mode.
    const autoLoadedSku = useRef(false);
    useEffect(() => {
        if (!initialSku || autoLoadedSku.current) return;
        autoLoadedSku.current = true;
        setSkuSearch(initialSku);
        loadSKUProduct(null, initialSku);
        if (onInitialSkuUsed) onInitialSkuUsed();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialSku]);

    // SKU Load - RESTORED: Exact logic with Server API
    const loadSKUProduct = async (e, skuOverride) => {
        if (e && e.preventDefault) e.preventDefault();
        const skuQuery = skuOverride || skuSearch;
        if (!skuQuery) {
            addNotification({
                h2: 'Need Query!',
                desc: 'Need SKU value.',
                tag: 'error',
            });
            return;
        };
        setFullPageLoading(true);
        try {
            const res = await fetch(config.SERVER_URL + '/seller/search-by-sku', {
                method: 'POST',
                body: JSON.stringify({
                    session_id: session,
                    sku: skuQuery
                }),
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth}`
                }
            });
            if (!res.ok) throw new Error(`Error: ${res.statusText}`);
            const result = await res.json();
            if (result.data.status) {
                addNotification({ h2: 'Product available!', desc: `Product "${result.data.data.title}" found.`, tag: 'done' });
                const handleConfirm = () => {
                    // TODO: "add as variant" flow is not implemented yet
                    addNotification({
                        h2: 'Not available',
                        desc: 'Adding as a variant is not available yet.',
                        tag: 'info'
                    });
                }
                const handleCancel = () => {
                    // Merge found data with form
                    const frmKyes = Object.keys(formData);
                    const json = {};
                    frmKyes.forEach(each => {
                        if (result.data.data[each]) {
                            if (Array.isArray(result.data.data[each]) && (typeof result.data.data[each]) !== (typeof formData[each])) {
                                if (typeof formData[each] === 'string') json[each] = result.data.data[each].join(',');
                            } else {
                                json[each] = result.data.data[each];
                            };
                        } else {
                            json[each] = formData[each];
                        };
                    });
                    if (Array.isArray(result.data.data.listed_catgeory)) {
                        setSearchedCategory(result.data.data.listed_catgeory);
                        const partData = result.data.data.listed_catgeory.find(a =>
                            a.name === result.data.data.category
                        );
                        setSelectedCategory(partData);
                        setSearchQuery(result.data.data.category);
                    }

                    if (Array.isArray(result.data.data.listed_siblings)) {
                        setSearchedSubCategory(result.data.data.listed_siblings);
                        const partData = result.data.data.listed_siblings.find(a =>
                            a.name === result.data.data.sub_category
                        );
                        setSelectedSubCategory(partData);
                    };

                    // colors: server should return an array of hex strings (<= MAX_COLORS) 
                    if (Array.isArray(result.data.data.color)) {
                        json.color = result.data.data.color.slice(0, MAX_COLORS);
                    } else {
                        json.color = formData.color;
                    }

                    // size: free-text, cap at MAX_SIZE_LENGTH just in case
                    json.size = (result.data.data.size || formData.size || 'Free Size').slice(0, MAX_SIZE_LENGTH);

                    // before / after + affiliation: set explicitly so a saved `false`/empty
                    // value never falls back to stale form state in the merge above
                    json.before_img = result.data.data.before_img || '';
                    json.after_img = result.data.data.after_img || '';
                    json.have_BA = Boolean(json.before_img && json.after_img);
                    json.allow_affiliation = Boolean(result.data.data.allow_affiliation);
                    json.allow_event_offer = Boolean(result.data.data.allow_event_offer);

                    setFormData(json);
                    setQuickPoints(result.data.data.quick_msg || []);
                    setComboOffers(result.data.data.combo_offers || []);
                    setSelectedHighlight(result.data.data.highlight || []);

                    // variants: signed variant_id tokens previously linked to this product
                    if (Array.isArray(result.data.data.variantsIds)) {
                        setVariantsIds(result.data.data.variantsIds);
                    } else {
                        setVariantsIds([]);
                    }

                    setImgDon(true);
                    setLoadedSku(result.data.sku);
                    setSelectedWareHouse(result.data.warehouseName);
                    setId(result.data.data.id);
                };
                genAlert({
                    title: 'Product Found',
                    message: `
        <p>
            <strong>${result.data.data.title}</strong>
        </p>
        <p>
            Is this a <strong>variant</strong> of an existing product?
        </p>
        <p>
            <strong>Yes:</strong> Add as a variant<br>
            <strong>No:</strong> Update the existing product
        </p>
    `,
                    confirmText: 'Yes, Add as Variant',
                    cancelText: 'No, Update Product',
                    onConfirm: handleConfirm,
                    onClose: handleCancel,
                    isHtml: true
                });
            } else {
                addNotification({ h2: 'Product Not found!', desc: `Invalid SKU.`, tag: 'done' });
                if (loadedSku) setLoadedSku(false);
            }
        } catch (e) {
            console.log(e);
        } finally {
            setFullPageLoading(false);
        }
    };

    // Upload Action - RESTORED: Exact logic with validations and API call
    const uploadProduct = async () => {
        if (!selectedWareHouse) return addNotification({ h2: 'Upload!', desc: `Please select a warehouse.`, tag: 'error' });
        if (!loadedSku && brandContext?.brand_mode === 'choose_approved_brand' && !selectedBrandId) {
            return addNotification({ h2: 'Brand!', desc: `Choose which of your approved brands this product belongs to.`, tag: 'error' });
        }
        if (!imgDon || imgDon !== true) return addNotification({ h2: 'Upload!', desc: `Please Upload Images first.`, tag: 'error' });
        if (formData.image.length === 0) return addNotification({ h2: 'Upload!', desc: `Please upload at least one product image`, tag: 'error' });
        if (!formData.color.length) return addNotification({ h2: 'Color!', desc: `Please select at least one color for this product.`, tag: 'error' });
        if (formData.color.length > MAX_COLORS) return addNotification({ h2: 'Color!', desc: `A product can have at most ${MAX_COLORS} colors.`, tag: 'error' });
        if (!formData.size || !formData.size.trim()) return addNotification({ h2: 'Size!', desc: `Please enter a size (use "Free Size" if it doesn't apply).`, tag: 'error' });
        if (formData.size.length > MAX_SIZE_LENGTH) return addNotification({ h2: 'Size!', desc: `Size can be at most ${MAX_SIZE_LENGTH} characters.`, tag: 'error' });

        if (parseFloat(formData.discount) > parseFloat(formData.price)) return addNotification({ h2: 'Price!', desc: `Discount price cannot be greater than MRP`, tag: 'error' });
        if (!formData.quantity || parseInt(formData.quantity) <= 0) return addNotification({ h2: 'Quantity!', desc: `Please enter a valid quantity`, tag: 'error' });
        if (variantsIds.length > MAX_VARIANTS) return addNotification({ h2: 'Variants!', desc: `A product can link up to ${MAX_VARIANTS} variants.`, tag: 'error' });

        // Before / After (Extras tab): when have_BA is true both images must exist and be uploaded
        if (formData.have_BA) {
            if (!formData.before_img || !formData.after_img) {
                return addNotification({ h2: 'Before/After!', desc: `Please add both the before and after image.`, tag: 'error' });
            }
            if (!baUploaded) {
                return addNotification({ h2: 'Before/After!', desc: `Please upload the before & after images first.`, tag: 'error' });
            }
        }

        setOnUpload(true);

        const newProduct = {
            ...formData,
            attachments,
            attached_products: linkedProducts,
            // signed variant_id tokens — backend re-verifies (sub_category, product_id)
            // against the HMAC before persisting, no extra SQL lookup needed
            variantsIds: [...variantsIds],
            highlight: selectedHighlight,
            category: selectedCategory?.name,
            sub_category: selectedSubCategory?.name,
            quick_msg: [...quickPoints],
            combo_offers: [...comboOffers],
            color: [...formData.color].slice(0, MAX_COLORS),
            size: formData.size.slice(0, MAX_SIZE_LENGTH),
            have_BA: Boolean(formData.have_BA),
            before_img: formData.have_BA ? formData.before_img : '',
            after_img: formData.have_BA ? formData.after_img : '',
            allow_affiliation: Boolean(formData.allow_affiliation),
            allow_event_offer: Boolean(formData.allow_event_offer),
            price: parseFloat(formData.price) || 0,
            discount: parseFloat(formData.discount) || 0,
            weight: parseFloat(formData.weight) || 0,
            quantity: parseInt(formData.quantity) || 0,
            shipment_width: parseFloat(formData.shipment_width) || 0,
            shipment_height: parseFloat(formData.shipment_height) || 0,
            shipment_length: parseFloat(formData.shipment_length) || 0,
            affiliate_commission: parseFloat(formData.affiliate_commission) || 0
        };

        try {
            const res = await fetch(config.SERVER_URL + `/seller/upload/${loadedSku ? 'update-product' : ''}`, {
                method: 'POST',
                body: JSON.stringify({
                    session_id: session,
                    warehouseName: selectedWareHouse,
                    ...newProduct,
                    // Only distributors send a brand; the server decides it for everyone else.
                    ...(brandContext?.brand_mode === 'choose_approved_brand' && selectedBrandId
                        ? { brand_id: Number(selectedBrandId) }
                        : {}),
                }),
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth}`
                }
            });

            if (!res.ok) throw new Error(`Error: ${res.statusText}`);
            const result = await res.json();

            if (result.data.status) {
                addNotification({ h2: 'Uploaded!', desc: `Product uploaded successfully.`, tag: 'done' });
                setOnUpload(false);
                setSelectedWareHouse('');
                // Reset form
                setFormData(getInitialForm());
                setQuickPoints([]);
                setComboOffers([]);
                setSelectedHighlight([]);
                setAttachments([]);
                setVariantsIds([]);
                setBaUploading(false);
                setImgDon(false);
                setLoadedSku(false);
                setId(null);
            } else {
                addNotification({ h2: 'Error!', desc: result.data.message, tag: 'err' });
                setOnUpload(false);
            }
        } catch (e) {
            setOnUpload(false);
            console.log(e);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.titleHeader}>
                <h1>Product Upload Center</h1>
                <form onSubmit={loadSKUProduct} className={styles.skuSearch}>
                    <input type="text" value={skuSearch} onChange={(e) => setSkuSearch(e.target.value.toUpperCase())} placeholder='Update by SKU' />
                    {loadedSku ? <MdClose size={20} onClick={() => setLoadedSku(false)} /> : <FaSearch size={20} onClick={loadSKUProduct} />}
                </form>
            </div>

            {brandContext && !loadedSku && (
                <div className={styles.brandBanner} data-mode={brandContext.brand_mode}>
                    {brandContext.brand_mode === 'generic' && (
                        <p><strong>Generic product.</strong> Seller uploads are listed without a brand, so there is nothing to choose here.</p>
                    )}
                    {brandContext.brand_mode === 'own_brand' && (
                        <p><strong>Listed under your brand:</strong> {brandContext.brand?.name}</p>
                    )}
                    {brandContext.brand_mode === 'choose_approved_brand' && (
                        brandContext.brands?.length ? (
                            <label className={styles.brandPicker}>
                                <span><strong>Brand</strong> — only brands that approved you are listed</span>
                                <select value={selectedBrandId} onChange={(e) => setSelectedBrandId(e.target.value)}>
                                    <option value="">Choose a brand…</option>
                                    {brandContext.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </label>
                        ) : (
                            <p><strong>No approved brands yet.</strong> Request access from a brand in <em>My Brands</em> before uploading.</p>
                        )
                    )}
                </div>
            )}

            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === 'basic' && <BasicInfoTab
                setFullPageLoading={setFullPageLoading}
                session_id={session}
                auth={auth}
                formData={formData}
                handleInputChange={handleInputChange}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedSubCategory={selectedSubCategory}
                setSelectedSubCategory={setSelectedSubCategory}
                searchedCategory={searchedCategory}
                searchedSubCategory={searchedSubCategory}
                setSearchedSubCategory={setSearchedSubCategory}
                isLoading={isLoading}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleSearch={handleSearch}
                loadedSku={loadedSku}
                warehouse={warehouse}
                selectedWareHouse={selectedWareHouse}
                setSelectedWareHouse={setSelectedWareHouse}
                addNotification={addNotification}
            />}

            {activeTab === 'details' && <ProductDetailsTab
                formData={formData}
                handleInputChange={handleInputChange}
                quickPoints={quickPoints}
                currentQuickPoint={currentQuickPoint}
                setCurrentQuickPoint={setCurrentQuickPoint}
                addQuickPoint={addQuickPoint}
                removeQuickPoint={removeQuickPoint}
                selectedHighlight={selectedHighlight}
                setSelectedHighlight={setSelectedHighlight}
                addNotification={addNotification}
            />}

            {activeTab === 'pricing' && <PricingOffersTab
                formData={formData} handleInputChange={handleInputChange} setFormData={setFormData}
                amounts={amounts} comboOffers={comboOffers} comboSummaries={comboSummaries}
                currentComboOffer={currentComboOffer} setCurrentComboOffer={setCurrentComboOffer}
                addComboOffer={addComboOffer} removeComboOffer={removeComboOffer}
                addNotification={addNotification}
            />}

            {activeTab === 'media' && <MediaAttributesTab
                session_id={session}
                auth={auth}
                formData={formData} handleImageUpload={handleImageUpload}
                rmImg={rmImg} imgDon={imgDon} uploadImg={uploadImg}
                onImagesReorder={onImagesReorder}
                colorPalette={predefinedOptions.colorPalette}
                toggleColor={toggleColor} removeColor={removeColor}
                maxColors={MAX_COLORS}
                onSizeChange={onSizeChange}
                selectedSubCategory={selectedSubCategory}
                currentProductId={pid}
                variantsIds={variantsIds}
                onVariantsChange={setVariantsIds}
                maxVariants={MAX_VARIANTS}
            />}

            {activeTab === 'extras' && <ExtrasAttachmentsTab
                formData={formData} handleInputChange={handleInputChange}
                attachments={attachments} setAttachments={setAttachments}
                addNotification={addNotification}
                onBeforeAfterSelect={onBeforeAfterSelect}
                onBeforeAfterRemove={onBeforeAfterRemove}
                uploadBeforeAfter={uploadBeforeAfter}
                baUploading={baUploading}
                baUploaded={baUploaded}
                auth={auth}
                session_id={session}
                selectedSubCategory={selectedSubCategory}
            />}

            {activeTab === 'attachments' && <ProductAttachmentTab
                session_id={session}
                auth={auth}
                pid={pid}
                attachments={attachments}
                setAttachments={setAttachments}
                addNotification={addNotification}
                selectedCategory={selectedCategory}
                linkedProducts={linkedProducts}
                setLinkedProducts={setLinkedProducts}
            />}

            {activeTab === 'upload' && <ReviewUploadTab
                formData={formData}
                selectedSubCategory={selectedSubCategory}
                quickPoints={quickPoints}
                selectedHighlight={selectedHighlight}
                attachments={attachments}
                comboOffers={comboOffers}
                variantsIds={variantsIds}
                onUpload={onUpload}
                imgDon={imgDon}
                uploadProduct={uploadProduct}
                predefinedOptions={predefinedOptions}
                loadedSku={loadedSku}
                amounts={amounts}
            />}
        </div>
    );
}