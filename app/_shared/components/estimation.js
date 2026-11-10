'use client';

import { useState, useEffect } from 'react';
import styles from './css/estimated-profit.module.css';
import Loader from '../../../components/wait';
import {
    FaSearch,
    FaChevronRight,
    FaChevronLeft
} from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import config from '../../../utils/config';


const EstimatedProduct = ({
    auth,
    session,
    addNotification,
    setFullPageLoading
}) => {
    const [timeFilter, setTimeFilter] = useState('all');
    const [productData, setProductData] = useState(false);
    const [filter, setFilter] = useState(false);
    const [skuSearch, setSkuSearch] = useState('');
    const [loadedSku, setLoadedSku] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (productData && productData !== 'error') return;
        async function serverData() {
            try {
                const res = await fetch(config.SERVER_URL + '/seller/product-estimation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${auth}`

                    },
                    body: JSON.stringify({ session_id: session }),
                });
                if (!res.ok) {
                    throw new Error(`Error: ${res.statusText}`);
                };
                const result = await res.json();
                if (result.data.status) {
                    setProductData(result.data.list);
                } else throw Error('error');
            } catch (e) {
                console.log(e);
                setProductData('error');
            }
        };
        serverData();
    }, []);

    const loadSKUProduct = async (e) => {
        e.preventDefault();
        if (!skuSearch) {
            addNotification({
                h2: 'Need Query!',
                desc: 'Need SKU value, you can get it from "PRODUCT MANAGE" tab',
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
                    sku: skuSearch
                }),
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth}`
                }
            });
            if (!res.ok) {
                throw new Error(`Error: ${res.statusText}`);
            };
            const result = await res.json();
            if (result.data.status) {
                addNotification({
                    h2: 'Product available!',
                    desc: `an product "${result.data.data.title}" found.`,
                    tag: 'done',
                });
                setLoadedSku(result.data.data);
            } else {
                addNotification({
                    h2: 'Product Not found!',
                    desc: `given SKU is invalid, copy an valid one from "MANAGE PRODUCTS" tab.`,
                    tag: 'done',
                });
                if (loadedSku) setLoadedSku(false);
            }
        } catch (e) {
            console.log(e);
        } finally {
            setFullPageLoading(false);
        }
    };

    const averageProfitMargin = 98;
    const totalPages = 5;
    return (
        <div className={styles.container}>
            <div className={styles.titleHeader}>
                <h1>Estimated Profit</h1>
                <form onSubmit={loadSKUProduct} className={styles.skuSearch}>
                    <input
                        type="text"
                        required
                        value={skuSearch}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (!value) return;
                            setSkuSearch(value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase());
                        }}
                        placeholder='to update a product search by SKU'
                    />
                    {
                        loadedSku
                            ? <MdClose size={20} onClick={() => setLoadedSku(false)} />
                            : <FaSearch size={20} onClick={loadSKUProduct} />
                    }
                </form>
            </div>
            {/* Dashboard Stats */}
            <div className={styles.dashboardStats}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total Products</div>
                    <div className={styles.statValue}>5</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Avg. Profit Margin</div>
                    <div className={`${styles.statValue} ${averageProfitMargin >= 0 ? styles.profit : styles.loss}`}>
                        {averageProfitMargin}%
                    </div>
                </div>
            </div>

            <div className={styles.tableContainer}>
                {
                    productData === false ? (
                        <Loader />
                    ) : productData === 'error' ? (
                        <h3 id={styles.error}>Internal Server Errror</h3>
                    ) : (
                        <>
                            {loadedSku ? (
                                <table className={styles.table}>
                                    <thead className={styles.tableHead}>
                                        <tr>
                                            <th>ID</th>
                                            <th>Product Name</th>
                                            <th className={styles.currency}>Direct Price</th>
                                            <th className={styles.currency}>Price (MRP)</th>
                                            <th className={styles.currency}>Selling Price</th>
                                            <th className={styles.currency}>Courier Charge</th>
                                            <th className={styles.currency}>Extra Charges</th>
                                            <th className={styles.currency}>Total Cost</th>
                                            <th className={styles.currency}>Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody className={styles.tableBody}>
                                        <tr className={styles.tableRow}>
                                            <td className={styles.idColumn}>{loadedSku.id}</td>
                                            <td className={styles.productName}>{loadedSku.title}</td>
                                            <td className={styles.currency}>{loadedSku.cost}</td>
                                            <td className={styles.currency}>{loadedSku.price}</td>
                                            <td className={styles.currency}>{loadedSku.discount}</td>
                                            <td className={styles.currency}>{loadedSku.delivery_charge}</td>
                                            <td className={styles.currency}>0%</td>
                                            <td className={styles.currency}>{loadedSku.total_cost}</td>
                                            <td className={`${styles.currency} ${loadedSku.profit >= 0 ? styles.positive : styles.negative}`}>
                                                {loadedSku.profit}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            ) : (
                                <>
                                    <table className={styles.table}>
                                        <thead className={styles.tableHead}>
                                            <tr>
                                                <th>ID</th>
                                                <th>Product Name</th>
                                                <th className={styles.currency}>Direct Price</th>
                                                <th className={styles.currency}>Price (MRP)</th>
                                                <th className={styles.currency}>Selling Price</th>
                                                <th className={styles.currency}>Courier Charge</th>
                                                <th className={styles.currency}>Extra Charges</th>
                                                <th className={styles.currency}>Total Cost</th>
                                                <th className={styles.currency}>Profit</th>
                                            </tr>
                                        </thead>
                                        <tbody className={styles.tableBody}>
                                            {productData.map((product) => (
                                                <tr key={product.id} className={styles.tableRow}>
                                                    <td className={styles.idColumn}>{product.id}</td>
                                                    <td className={styles.productName}>{product.title}</td>
                                                    <td className={styles.currency}>{product.cost}</td>
                                                    <td className={styles.currency}>{product.price}</td>
                                                    <td className={styles.currency}>{product.discount}</td>
                                                    <td className={styles.currency}>{product.delivery_charge}</td>
                                                    <td className={styles.currency}>0%</td>
                                                    <td className={styles.currency}>{product.total_cost}</td>
                                                    <td className={`${styles.currency} ${product.profit >= 0 ? styles.positive : styles.negative}`}>
                                                        {product.profit}
                                                    </td>
                                                    <td className={styles.currency}>{product.totalRevenue}</td>
                                                </tr>
                                            ))}
                                            {/* {productData.length > 0 && (
                                        <tr className={styles.totalRow}>
                                            <td colSpan="2">TOTAL</td>
                                            <td className={styles.currency}>{totals.directPrice}</td>
                                            <td className={styles.currency}>{totals.mrp}</td>
                                            <td className={styles.currency}>{totals.sellingPrice}</td>
                                            <td className={styles.currency}>{totals.couponOff}</td>
                                            <td className={styles.currency}>{totals.courierCharge}</td>
                                            <td className={styles.currency}>{totals.extraCharges}</td>
                                            <td className={styles.currency}>{totals.totalCost}</td>
                                            <td className={`${styles.currency} ${totals.profit >= 0 ? styles.positive : styles.negative}`}>
                                                {totals.profit}
                                            </td>
                                            <td className={styles.currency}>{totals.totalRevenue}</td>
                                        </tr>
                                    )} */}
                                        </tbody>
                                    </table>

                                    {productData.length === 0 && (
                                        <div className={styles.noData}>
                                            No products found for the selected time period.
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )
                }
            </div>
            <div className={styles.paginationContainer}>
                <div className={styles.paginationText}>
                    Showing <span>{currentPage}</span> of{" "}
                    <span>{filter ? totalPages[filter] : totalPages.all}</span> Pages
                </div>
                <div className={styles.paginationControls}>
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={styles.paginationButton}
                    >
                        <FaChevronLeft />
                    </button>

                    {Array.from({
                        length: filter
                            ? totalPages[filter]
                            : totalPages.all
                    }).map((_, idx) => (
                        <button
                            key={idx + 1}
                            className={`${styles.paginationButton} ${idx + 1 === currentPage ? styles.paginationButtonActive : ''
                                }`}
                            onClick={() => setCurrentPage(idx + 1)}
                        >
                            {idx + 1}
                        </button>
                    ))}

                    <button
                        disabled={currentPage === (filter ? totalPages[filter] : totalPages.all)}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={styles.paginationButton}
                    >
                        <FaChevronRight />
                    </button>
                </div>
            </div>
            <div className={styles.footerNote}>
                <p><strong>Formulas:</strong> Total Cost = Direct Price + Courier Charge + Extra Charges | Profit = (Selling Price - Coupon Off) - Total Cost | Total Revenue = Selling Price - Coupon Off</p>
            </div>
        </div >
    );
};

export default EstimatedProduct;