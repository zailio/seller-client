'use client';

import { useState, useEffect } from 'react';
import {
    FaSearch,
    FaFilter,
    FaBullhorn,
    FaEllipsisV,
    FaBan,
    FaCheckCircle,
    FaChevronLeft,
    FaChevronRight
} from 'react-icons/fa';
import { ImSpinner2 } from 'react-icons/im';
import { IoCopyOutline, IoChatbubbleEllipsesOutline } from "react-icons/io5";
import CommentSection from './sub/manage/comment';

import styles from './css/productMenage.module.css';
import Loader from '../../../components/wait';
import config from '../../../utils/config';
import { useWebSocket } from '../../../context/ws';

const filterOptions = [
    { value: false, label: 'All Products' },
    { value: 'active', label: 'Active Only' },
    { value: 'inactive', label: 'Out of Stock' },
];


const ProductManagement = ({
    auth, session,
    addNotification,
    initialProducts,
    setInitialProducts,
    totalPages,
    setTotalPages
}) => {
    const { socket, send } = useWebSocket();
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [onSearch, setOnSearch] = useState(false);
    const [openMenus, setOpenMenus] = useState({});
    const [filter, setFilter] = useState(false);
    const [filterd, setFilterd] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [visibleList, setVisibleList] = useState([]);
    const [pageRange, setPageRange] = useState([0, 5]);
    const [modal, setModal] = useState(false);
    const [promoteData, setPromoteData] = useState({
        type: '',
        duration: '',
        discount: ''
    });
    //review
    const [listComments, setListComments] = useState(false);
    const [commentReplyies, setCommentReplyies] = useState({});
    const [questions, setQuestions] = useState(false);

    const [filterAction, setFilterAction] = useState(false);

    const toggleMenu = (productId) => {
        setOpenMenus(prev => ({
            [productId]: !prev[productId]
        }));
    };

    useEffect(() => {
        if (!loading) return;
        async function serverData() {
            try {
                const res = await fetch(config.SERVER_URL + '/seller/product_manage', {
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
                    setInitialProducts(result.data.list);
                    setTotalPages(prev => ({
                        ...prev,
                        all: result.data.count
                    }));
                    setVisibleList(result.data.list);
                } else throw Error('error');
            } catch (e) {
                console.log(e);
                setInitialProducts({ status: 'error' });
            } finally {
                setLoading(false);
            };
        };
        serverData();
    }, []);

    useEffect(() => {
        if (!initialProducts) return;
        const page = ((currentPage - 1) * 5) + 1;
        const start = (currentPage - 1) * 5;
        const end = currentPage * 5;
        setPageRange([start, end]);

        if (filter) {
            if (filterd[filter]?.[page]) {
                setVisibleList(filterd[filter].slice(start, end));
            } else {
                setVisibleList([]);
            };
        };

        if (initialProducts[page]) {
            setLoading(false);
            setVisibleList(initialProducts.slice(start, end));
            return;
        };
        async function serverData() {
            setLoading(true);
            try {
                const res = await fetch(config.SERVER_URL + '/seller/next-page-product', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${auth}`

                    },
                    body: JSON.stringify({
                        session_id: session,
                        filter: filter,
                        page: currentPage
                    }),
                });
                if (!res.ok) {
                    throw new Error(`Error: ${res.statusText}`);
                };
                const result = await res.json();
                if (result.data.status) {
                    setInitialProducts(prev => [...prev, ...result.data.list]);
                    setVisibleList(result.data.list);
                } else throw Error('error');
            } catch (e) {
                console.log(e);
            } finally {
                setLoading(false);
            };
        };
        serverData();
    }, [currentPage]);

    useEffect(() => {
        if (!initialProducts) return;
        setCurrentPage(1);
        if (!filter) {
            setVisibleList(initialProducts.slice(0, 5));
            return;
        };
        if (filterd[filter]) {
            setVisibleList(filterd[filter].slice(0, 5));
            return;
        }
        async function serverData() {
            setLoading(true);
            try {
                const res = await fetch(config.SERVER_URL + '/seller/filtered-product', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${auth}`

                    },
                    body: JSON.stringify({
                        session_id: session,
                        filter: filter
                    }),
                });
                if (!res.ok) {
                    throw new Error(`Error: ${res.statusText}`);
                };
                const result = await res.json();
                if (result.data.status) {
                    setTotalPages(prev => ({
                        ...prev,
                        [filter]: result.data.count
                    }));
                    if (Array.isArray(result.data.list)) {
                        setFilterd(prev => ({
                            ...prev,
                            [filter]: [...result.data.list, ...(prev[filter] ?? [])]
                        }));
                        setVisibleList(result.data.list);
                    } else {
                        setVisibleList([]);
                    };
                } else throw Error('error');
            } catch (e) {
                console.log(e);
            } finally {
                setLoading(false);
            };
        };
        serverData();
    }, [filter]);

    useEffect(() => {
        if (!modal || !['active', 'inactive'].find(a => a === modal.type)) return;
        async function serverData() {
            try {
                const res = await fetch(config.SERVER_URL + '/seller/change-stock', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${auth}`

                    },
                    body: JSON.stringify({
                        session_id: session,
                        type: modal.type,
                        id: modal.productId
                    }),
                });
                if (!res.ok) {
                    throw new Error(`Error: ${res.statusText}`);
                };
                const result = await res.json();
                if (result.data.status) {
                    const total = [...initialProducts].map(a => {
                        if (a.id === result.data.data.id) {
                            return { ...a, isAvailable: result.data.data.updated_to }
                        } else return a;
                    });
                    setInitialProducts(total);
                    setFilterd({});
                    setFilter(false);
                    setVisibleList(total.slice(...pageRange));
                } else throw Error('error');
            } catch (e) {
                console.log(e);
            } finally {
                setModal(false);
            };
        };
        serverData();
    }, [modal]);

    const StatusBadge = ({ status }) => {
        const badgeClass = `${styles.statusBadge} ${status === 'active' ?
            styles.statusActive :
            styles.statusOutOfStock
            }`;

        const statusText = {
            'active': 'Active',
            'inactive': 'Out of Stock'
        };

        return (
            <span className={badgeClass}>
                {statusText[status]}
            </span>
        );
    };

    const searchNow = async (e) => {
        e.preventDefault();
        setOnSearch(true);
        try {
            const res = await fetch(config.SERVER_URL + '/seller/search-manage-product', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth}`

                },
                body: JSON.stringify({
                    session_id: session,
                    query: search,
                }),
            });
            if (!res.ok) {
                throw new Error(`Error: ${res.statusText}`);
            };
            const result = await res.json();
            if (result.data.status) {
                setVisibleList(result.data.list)
            } else throw Error('error');
        } catch (e) {
            console.log(e);
        } finally {
            setOnSearch(false);
            setSearch('');
        };
    };

    const copyIt = (sku) => {
        navigator.clipboard
            .writeText(sku)
            .then(() => {
                console.log("Text copied to clipboard");
            })
            .catch(_ => {
                addNotification({
                    h2: 'ERROR!',
                    desc: `Failed to copy text.`,
                });
            });
    };


    return (
        <div className={styles.container}>
            {modal && modal.type !== 'review' &&
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContainer}>
                        <div className={`${styles.modalHeader} ${modal.type === 'inactive' ? styles.modalHeaderBan :
                            styles.modalHeaderPromote
                            }`}>
                            <h3 className={styles.modalTitle}>
                                {
                                    modal.type === 'inactive'
                                        ? 'Inactive Product'
                                        : modal.type === 'active'
                                            ? 'activate Product'
                                            : 'Promote Product'
                                }
                            </h3>
                        </div>

                        <div className={styles.modalBody}>
                            {modal.type === 'inactive'
                                ? (
                                    <div className={styles.modalForm}>
                                        <div className={styles.formGroup}>
                                            <Loader />
                                        </div>
                                    </div>
                                )
                                : modal.type === 'active'
                                    ? (
                                        <div className={styles.modalForm}>
                                            <div className={styles.formGroup}>
                                                <Loader />
                                            </div>
                                        </div>)
                                    : (
                                        <div className={styles.modalForm}>
                                            <div className={styles.formGroup}>
                                                <label className={styles.formLabel}>Promotion type:</label>
                                                <select
                                                    className={styles.formSelect}
                                                    value={promoteData.type}
                                                    onChange={(e) => setPromoteData({ ...promoteData, type: e.target.value })}
                                                >
                                                    <option value="">Select promotion type</option>
                                                    <option>Featured on homepage</option>
                                                    <option>Category spotlight</option>
                                                    <option>Email campaign</option>
                                                    <option>Social media feature</option>
                                                    <option>Special discount</option>
                                                </select>
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.formLabel}>Duration:</label>
                                                <select
                                                    className={styles.formSelect}
                                                    value={promoteData.duration}
                                                    onChange={(e) => setPromoteData({ ...promoteData, duration: e.target.value })}
                                                >
                                                    <option value="">Select duration</option>
                                                    <option>1 day</option>
                                                    <option>3 days</option>
                                                    <option>1 week</option>
                                                    <option>2 weeks</option>
                                                    <option>1 month</option>
                                                </select>
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.formLabel}>Discount (optional):</label>
                                                <div className={styles.discountInput}>
                                                    <input
                                                        type="number"
                                                        className={styles.discountField}
                                                        placeholder="0"
                                                        value={promoteData.discount}
                                                        onChange={(e) => setPromoteData({ ...promoteData, discount: e.target.value })}
                                                    />
                                                    <span className={styles.discountSuffix}>%</span>
                                                </div>
                                            </div>
                                            <div className={styles.modalFooter}>
                                                <button
                                                    onClick={() => setModal({ show: false, type: '', productId: null })}
                                                    className={styles.modalCancelButton}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => setModal(false)}
                                                    className={`${styles.modalConfirmButton} ${modal.type === 'remove' ? styles.confirmRemove :
                                                        modal.type === 'ban' ? styles.confirmBan :
                                                            styles.confirmPromote
                                                        }`}
                                                >
                                                    Confirm
                                                </button>
                                            </div>
                                        </div>
                                    )
                            }
                        </div>
                    </div>
                </div>}
            {modal.type === 'review' && <CommentSection
                auth={auth}
                session={session}
                setModal={setModal}
                addNotification={addNotification}
                productId={modal.productId}
                comment={3}
                question={5}
                listComments={listComments}
                setListComments={setListComments}
                commentReplyies={commentReplyies}
                setCommentReplyies={setCommentReplyies}
                questions={questions}
                setQuestions={setQuestions}
                close={() => setModal(false)}
            />}
            <div className={styles.contentWrapper}>
                <div className={styles.searchFlexContainer}>
                    <div className={styles.filterContainer}>
                        <button
                            className={styles.filterButton}
                            onClick={() => setFilterAction(prev => !prev)}
                        >
                            <FaFilter className={styles.filterIcon} />
                            {filter
                                ? <span className={styles.filterOptionActive}>{filter}</span>
                                : <span>Filters</span>}
                        </button>
                        {filterAction && <div className={styles.filterDropdown}>
                            {filterOptions.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        setFilter(option.value);
                                        setCurrentPage(1);
                                        setFilterAction(false);
                                    }}
                                    className={`${styles.filterOption} ${filter === option.value ? styles.filterOptionActive : ''
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>}
                    </div>

                    <form onSubmit={searchNow} className={styles.skuSearch}>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search products by name"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            disabled={onSearch}
                            className={styles.searchButton}
                        >
                            {onSearch
                                ? <ImSpinner2 size={20} className={styles.spinn} />
                                : <>
                                    <FaSearch className={styles.searchIcon} />
                                    <span>Search</span>
                                </>}
                        </button>
                    </form>
                </div>
                {
                    loading
                        ? <div className={styles.tableContainer} style={{ padding: '20px' }}>
                            <Loader />
                        </div>
                        : initialProducts && initialProducts.status === 'error' ?
                            <div className={styles.error}>
                                <h1>Internal Server Error</h1>
                            </div>
                            : <table className={styles.productTable}>
                                <thead className={styles.tableHeader}>
                                    <tr>
                                        <th className={styles.tableHeaderCell}>ID</th>
                                        <th className={styles.tableHeaderCell}>Product</th>
                                        <th className={styles.tableHeaderCell}>Price</th>
                                        <th className={styles.tableHeaderCell}>Status</th>
                                        <th className={styles.tableHeaderCell}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className={styles.tableBody}>
                                    {visibleList.length > 0 ? (
                                        visibleList.map(product => (
                                            <tr key={product.id} className={styles.tableRow}>
                                                <td className={styles.tableCell}>#{product.id}</td>
                                                <td className={styles.tableCell}>
                                                    <div className={styles.productInfo}>
                                                        <img
                                                            src={product.image[0]}
                                                            alt={product.name}
                                                            className={styles.productImage}
                                                        />
                                                        <div>
                                                            <div className={styles.productName}>{product.title}</div>
                                                            <div className={styles.productSku}>{product.subtitle}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={styles.tableCell + ' ' + styles.twocol}>
                                                    <span>₹{product.price.toFixed(2)}</span>
                                                    <span className={styles.productSku}>₹{product.discount.toFixed(2)}</span>
                                                </td>
                                                <td className={styles.tableCell}>
                                                    <StatusBadge status={product.isAvailable} />
                                                </td>
                                                <td className={styles.tableCell}>
                                                    <div className={styles.actionButtons}>
                                                        <button
                                                            className={styles.promoteButton}
                                                            disabled={product.isAvailable !== 'active'}
                                                            onClick={() => setModal({
                                                                show: true,
                                                                type: 'promote',
                                                                productId: product.id
                                                            })}
                                                        >
                                                            <FaBullhorn className={styles.actionIcon} /> Promote
                                                        </button>

                                                        <div className={styles.moreActions}>
                                                            <button
                                                                className={styles.moreActionsButton}
                                                                onClick={() => toggleMenu(product.id)}
                                                            >
                                                                <FaEllipsisV />
                                                            </button>
                                                            {openMenus[product.id] && (
                                                                <div className={styles.moreActionsMenu}>
                                                                    <button
                                                                        className={styles.moreActionsOption}
                                                                        onClick={() => {
                                                                            addNotification({
                                                                                h2: 'Copy!',
                                                                                desc: `Product SKU copied to clipboard!`,
                                                                            });
                                                                            copyIt(product.sku);
                                                                        }}
                                                                    >
                                                                        <IoCopyOutline className={styles.moreActionsIcon} /> COPY SKU
                                                                    </button>
                                                                    {product.isAvailable === 'inactive' ? (
                                                                        <button
                                                                            className={styles.moreActionsOption}
                                                                            onClick={() => {
                                                                                setModal({
                                                                                    show: true,
                                                                                    type: 'active',
                                                                                    productId: product.id
                                                                                });
                                                                                toggleMenu(product.id);
                                                                            }}
                                                                        >
                                                                            <FaCheckCircle className={styles.moreActionsIcon} /> restok
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            className={styles.moreActionsOption}
                                                                            onClick={() => {
                                                                                setModal({
                                                                                    show: true,
                                                                                    type: 'inactive',
                                                                                    productId: product.id
                                                                                });
                                                                                toggleMenu(product.id);
                                                                            }}
                                                                        >
                                                                            <FaBan className={styles.moreActionsIcon} /> set stokout
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        className={styles.moreActionsOption}
                                                                        onClick={() => {
                                                                            addNotification({
                                                                                h2: 'Copy!',
                                                                                desc: `Ad URL copied to clipboard!`,
                                                                            });
                                                                            copyIt(product.sku);
                                                                        }}
                                                                    >
                                                                        <IoCopyOutline className={styles.moreActionsIcon} /> Copy Ad Url
                                                                    </button>
                                                                    <button
                                                                        className={styles.moreActionsOption}
                                                                        onClick={() => {
                                                                            setModal({
                                                                                show: true,
                                                                                type: 'review',
                                                                                productId: product.id
                                                                            });
                                                                            toggleMenu(product.id);
                                                                        }}
                                                                    >
                                                                        <IoChatbubbleEllipsesOutline className={styles.moreActionsIcon} /> view reviews
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr className={styles.tableRow}>
                                            <td colSpan={6} className={styles.noResultsCell}>
                                                No products found matching your criteria
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                }
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
            </div >
        </div >
    );
};

export default ProductManagement;