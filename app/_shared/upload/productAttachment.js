// components/ProductAttachmentTab.jsx
'use client';

import { memo, useState } from 'react';
import styles from './css/productAttachments.module.css';
import {  FaDocker, FaEye, FaHeart, FaProductHunt, FaSearch } from 'react-icons/fa';
import AttachmentManager from './attachments';
import config from '../../../utils/config';
import { ImSpinner2 } from 'react-icons/im';
import { MdClose, MdDone } from 'react-icons/md';
import { IoDocument } from 'react-icons/io5';

const ProductAttachmentTab = memo(({
    session_id,
    auth,
    pid,
    attachments,
    setAttachments,
    addNotification,
    selectedCategory,
    linkedProducts,
    setLinkedProducts
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [list, setList] = useState(null);


    const handleSearch = async () => {
        if (!selectedCategory?.name) {
            addNotification({
                h2: 'Error',
                desc: 'first choose a category from "basic" Tab!'
            })
            return;
        }
        try {
            setIsLoading(true);
            const res = await fetch(config.SERVER_URL + '/seller/upload/search-upload-product', {
                method: 'POST',
                body: JSON.stringify({
                    session_id: session_id,
                    id: pid,
                    category: selectedCategory.name,
                    category_id: selectedCategory.id,
                }),
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth}`
                }
            });
            if (!res.ok) throw new Error(`Error: ${res.statusText}`);
            const result = await res.json();
            if (result.data.status) {
                setList(result.data.list);
            }
        } catch (e) {
            addNotification({
                h2: 'Error',
                desc: 'There was a problem with your requst, try again later'
            })
            return;
        } finally {
            setIsLoading(false);
        };
    };

    const linkProduct = (product) => {
        if (linkedProducts.length >= 5) {
            addNotification('Maximum 5 products can be linked', 'error');
            return;
        }

        if (!linkedProducts.find(p => p.id === product.id)) {
            setLinkedProducts([...linkedProducts, product]);
            setSearchQuery('');
        }
    };

    const unlinkProduct = (productId) => {
        setLinkedProducts(linkedProducts.filter(p => p.id !== productId));
    };

    const untickAll = () => {
        setLinkedProducts([]);
    };

    return (
        <div className={styles.twoGrid}>
            <div className={styles.productTicker}>
                <h2><FaProductHunt className={styles.icon} /> You Combined Products</h2>
                <p>This will help you to add your own products when customer try to purchase, they can purchase two or more from your own with less delivery charge</p>

                <div className={styles.tickerHeader}>
                    <div className={styles.searchRow}>
                        <input
                            type="text"
                            placeholder="Search products to attach..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                        {
                            isLoading
                                ? <ImSpinner2
                                    className={styles.searchIcon + ' spin'}
                                    size={40}
                                    style={{
                                        background: 'none'
                                    }}
                                />
                                : <FaSearch
                                    onClick={handleSearch}
                                    className={styles.searchIcon}
                                    size={40}
                                />
                        }
                    </div>

                    <div className={styles.selectedToolbar}>
                        <div className={styles.tickBadge}>
                            <MdDone /> <span>{linkedProducts.length}</span> attached
                        </div>
                        {linkedProducts.length > 0 && (
                            <button
                                className={styles.untickAll}
                                onClick={untickAll}
                                title="Remove all"
                            >
                                <MdClose /> remove all
                            </button>
                        )}
                    </div>
                </div>

                {/* Search Results */}
                {Array.isArray(list) && list.length > 0 && (
                    <ul className={styles.productList}>
                        {list.map(product => (
                            <li
                                key={product.id}
                                className={styles.productItem}
                                onClick={() => linkProduct(product)}
                            >
                                <img
                                    className={styles.productImg}
                                    src={product.image[0]}
                                    alt={product.subtitle}
                                />
                                <div className={styles.productInfo}>
                                    <span className={styles.productName}>{product.title}</span>
                                    <div className={styles.productMeta}>
                                        <span className={styles.productRate}>
                                            <strong>₹{product.discount}</strong>
                                            <del>₹{product.price}</del>
                                        </span>
                                        <span className={styles.stars}>
                                            <span> <FaHeart
                                                size={12}
                                                className={styles.heart}
                                            />
                                                {product.likes}</span>
                                            <span>
                                                <FaEye
                                                    size={12}
                                                    className={styles.eye}
                                                />
                                                {product.views}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.tickWrap}>
                                    <input
                                        type="checkbox"
                                        checked={linkedProducts.some(p => p.id === product.id)}
                                        readOnly
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Selected Products Section */}
                <div className={styles.selectedSection}>
                    <div className={styles.selectedTitle}>
                        <IoDocument /> attached products ({linkedProducts.length}/5)
                    </div>
                    <div className={styles.selectedChips}>
                        {linkedProducts.length === 0 ? (
                            <div className={styles.emptySelection}>— none attached —</div>
                        ) : (
                            linkedProducts.map(product => (
                                <div key={product.id} className={styles.chip}>
                                    <img
                                        className={styles.productImg}
                                        src={product.image[0]}
                                        alt={product.subtitle}
                                    />
                                    <span className={styles.chipName}>{product.title}</span>
                                    <button
                                        className={styles.chipUntick}
                                        onClick={() => unlinkProduct(product.id)}
                                        title="Remove"
                                    >
                                        <MdClose />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            <AttachmentManager
                addNotification={addNotification}
                attachments={attachments}
                setAttachments={setAttachments}
            />
        </div>
    );
});

export default ProductAttachmentTab;