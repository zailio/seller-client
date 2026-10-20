'use client';

import { useState, useEffect } from 'react';
import {
  FaSave, FaStore, FaPhone, FaMapMarkerAlt, FaClock,
  FaTrash, FaPlus, FaTimes,
  FaCopy, FaChevronDown, FaSort, FaEye,
  FaExternalLinkAlt, FaEdit, FaInfoCircle, FaGlobe, FaBuilding,
} from 'react-icons/fa';
import { MdEmail, MdInfo, MdLocalOffer } from 'react-icons/md';
import { BsShop, BsTelephone } from 'react-icons/bs';
import { RiStore2Line, RiStore3Line } from 'react-icons/ri';
import { TbBuildingStore } from 'react-icons/tb';

import FullPageLoading from '../../../components/FullPageLoading';

import styles from './css/shop.module.css';
import config from '../../../utils/config';

// Default weekly hours
const createDefaultHours = () => ({
  monday: { open: '09:00', close: '18:00', closed: false },
  tuesday: { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday: { open: '09:00', close: '18:00', closed: false },
  friday: { open: '09:00', close: '18:00', closed: false },
  saturday: { open: '10:00', close: '16:00', closed: false },
  sunday: { open: '11:00', close: '15:00', closed: true },
});

// Shop factory (fresh ids/dates on every call)
const createShop = (name = 'New Shop') => {
  const now = new Date().toISOString();
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    type: 'shop',
    name,
    description: '',
    status: 'active',
    isPrimary: false,

    // Contact
    inchargeName: '',
    phone: '',
    email: '',

    // Location
    location: { address: '', url: '' },

    // Operating hours
    todayStatus: 'open',
    active_time: createDefaultHours(),

    // Shop specific
    shopType: 'retail',
    areaSqft: '',
    rentAmount: '',
    leaseEndDate: '',
    openingDate: '',

    // External URLs
    external_url: [
      { id: Date.now() + Math.floor(Math.random() * 1000) + 1, title: 'Shop Website', url: '' },
    ],

    // Meta
    createdAt: now,
    updatedAt: now,
  };
};

// Day configuration
const DAYS = [
  { id: 'monday', name: 'Monday', short: 'Mon' },
  { id: 'tuesday', name: 'Tuesday', short: 'Tue' },
  { id: 'wednesday', name: 'Wednesday', short: 'Wed' },
  { id: 'thursday', name: 'Thursday', short: 'Thu' },
  { id: 'friday', name: 'Friday', short: 'Fri' },
  { id: 'saturday', name: 'Saturday', short: 'Sat' },
  { id: 'sunday', name: 'Sunday', short: 'Sun' },
];

// Shop types
const SHOP_TYPES = [
  { id: 'retail', name: 'Retail Shop', icon: <BsShop /> },
  { id: 'wholesale', name: 'Wholesale Shop', icon: <TbBuildingStore /> },
  { id: 'outlet', name: 'Outlet', icon: <RiStore3Line /> },
  { id: 'kiosk', name: 'Kiosk', icon: <MdLocalOffer /> },
  { id: 'showroom', name: 'Showroom', icon: <FaBuilding /> },
];

// Common external URL headings
const URL_HEADINGS = [
  'Website',
  'Product Catalog',
  'Brochure',
  'Menu',
  'Price List',
  'Catalog PDF',
  'Video Tour',
  'Virtual Tour',
  'Booking Page',
  'Order Form',
];

const MAX_EXTERNAL_URLS = 5;

// Validate a single shop. Returns { errors, tab }
const validateShop = (shop) => {
  const errors = {};
  let tab = null;

  if (!shop?.name?.trim()) {
    errors.name = 'Name is required';
    tab = tab || 'shop-info';
  }

  if (!shop?.location?.address?.trim()) {
    errors.address = 'Address is required';
    tab = tab || 'location';
  }

  if (shop?.email && !/\S+@\S+\.\S+/.test(shop.email)) {
    errors.email = 'Invalid email format';
    tab = tab || 'contact';
  }

  if (shop?.phone && !/^[\d\s\-+()]+$/.test(shop.phone)) {
    errors.phone = 'Invalid phone number';
    tab = tab || 'contact';
  }

  shop?.external_url?.forEach((url, index) => {
    if (url.title && url.url) {
      try {
        new URL(url.url);
      } catch (_) {
        errors[`externalUrl_${index}`] = 'Invalid URL format';
        tab = tab || 'urls';
      }
    }
  });

  return { errors, tab };
};

export default function SellerShops({
  auth,
  session,
  addNotification,
  genAlert,
  store,
  setStore,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationList, setShowLocationList] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [dragIndex, setDragIndex] = useState(null);

  // Initialize shops
  useEffect(() => {
    if (typeof store !== 'object' || store === null) return;

    const initialShops = Array.isArray(store.shops)
      ? store.shops.map((shop) => ({
        ...createShop(shop.name),
        ...shop,
        type: 'shop',
        location: { address: '', url: '', ...(shop.location || {}) },
        active_time: { ...createDefaultHours(), ...(shop.active_time || {}) },
        external_url: Array.isArray(shop.external_url) ? shop.external_url : [],
      }))
      : [];

    setShops(initialShops);
    setIsLoading(false);
  }, []);

  // Active shop
  const activeShop = shops[activeItemIndex] || null;
  const shopCount = shops.length;
  const openCount = shops.filter((s) => s.todayStatus === 'open').length;

  // Add shop
  const addShop = () => {
    const newShop = createShop(`Shop ${shopCount + 1}`);
    const updated = [...shops, newShop];
    setShops(updated);
    setActiveItemIndex(updated.length - 1);
    setActiveTab('shop-info');
    setFormErrors({});
  };

  // Update a field on the active shop (supports dotted paths like "location.address")
  const updateShop = (field, value) => {
    setShops((prev) =>
      prev.map((shop, index) => {
        if (index !== activeItemIndex) return shop;

        const updated = { ...shop, updatedAt: new Date().toISOString() };

        if (field.includes('.')) {
          const keys = field.split('.');
          let current = updated;
          for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = { ...current[keys[i]] };
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = value;
        } else {
          updated[field] = value;
        }

        return updated;
      })
    );
  };

  // External URLs
  const updateExternalUrl = (urlIndex, field, value) => {
    setShops((prev) =>
      prev.map((shop, index) => {
        if (index !== activeItemIndex) return shop;
        const updatedUrls = [...(shop.external_url || [])];
        updatedUrls[urlIndex] = { ...updatedUrls[urlIndex], [field]: value };
        return { ...shop, external_url: updatedUrls, updatedAt: new Date().toISOString() };
      })
    );
  };

  const addExternalUrl = () => {
    const newUrl = { id: Date.now(), title: '', url: '' };
    setShops((prev) =>
      prev.map((shop, index) => {
        if (index !== activeItemIndex) return shop;
        return {
          ...shop,
          external_url: [...(shop.external_url || []), newUrl],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const removeExternalUrl = (urlIndex) => {
    setShops((prev) =>
      prev.map((shop, index) => {
        if (index !== activeItemIndex) return shop;
        return {
          ...shop,
          external_url: (shop.external_url || []).filter((_, i) => i !== urlIndex),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Operating hours
  const updateActiveTime = (day, field, value) => {
    setShops((prev) =>
      prev.map((shop, index) => {
        if (index !== activeItemIndex) return shop;
        return {
          ...shop,
          active_time: {
            ...shop.active_time,
            [day]: {
              ...shop.active_time[day],
              [field]: field === 'closed' ? !shop.active_time[day].closed : value,
            },
          },
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Delete
  const deleteShop = (index) => {
    const updated = shops.filter((_, i) => i !== index);
    setShops(updated);
    setFormErrors({});

    if (index < activeItemIndex || activeItemIndex >= updated.length) {
      setActiveItemIndex(Math.max(0, activeItemIndex - 1));
    }
  };

  const makeConfirm = (index) => {
    const shopToDelete = shops[index];

    genAlert({
      title: `Are you sure you want to delete ${shopToDelete.name}?`,
      message: `
    If you delete <b>${shopToDelete.name}</b>:
    <ul style={{ margin: '0.5rem 0 1rem 1rem', paddingLeft: '1rem' }}>
      <li>Customers won't see this shop</li>
    </ul>
    <i style='color:red'>This action can't be retrieved</i>?
  `,
      confirmText: 'Yes, Delete',
      cancelText: 'No',
      onConfirm: () => deleteShop(index),
      isHtml: true,
    });
  };

  // Duplicate
  const duplicateShop = (index) => {
    const shopToCopy = shops[index];
    const now = new Date().toISOString();
    const baseId = Date.now();

    const duplicated = {
      ...JSON.parse(JSON.stringify(shopToCopy)),
      id: baseId,
      name: `${shopToCopy.name} (Copy)`,
      isPrimary: false,
      createdAt: now,
      updatedAt: now,
    };
    duplicated.external_url = (duplicated.external_url || []).map((url, i) => ({
      ...url,
      id: baseId + i + 1,
    }));

    const updated = [...shops, duplicated];
    setShops(updated);
    setActiveItemIndex(updated.length - 1);
  };

  // Reorder (drag & drop)
  const moveShop = (fromIndex, toIndex) => {
    if (
      fromIndex === null ||
      Number.isNaN(fromIndex) ||
      fromIndex === toIndex ||
      toIndex < 0 ||
      toIndex >= shops.length
    ) return;

    const updated = [...shops];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setShops(updated);
    setActiveItemIndex(toIndex);
  };

  // Toggle open/closed for a specific shop
  const toggleTodayStatus = (index) => {
    setShops((prev) =>
      prev.map((shop, i) =>
        i === index
          ? {
            ...shop,
            todayStatus: shop.todayStatus === 'open' ? 'closed' : 'open',
            updatedAt: new Date().toISOString(),
          }
          : shop
      )
    );
  };

  // Save
  const handleSave = async () => {
    // Validate every shop; jump to the first invalid one
    for (let i = 0; i < shops.length; i++) {
      const { errors, tab } = validateShop(shops[i]);
      if (Object.keys(errors).length > 0) {
        setActiveItemIndex(i);
        if (tab) setActiveTab(tab);
        setFormErrors(errors);
        addNotification({
          h2: 'Error',
          desc: `${shops[i].name || 'Shop'}: ${errors[Object.keys(errors)[0]]}`,
        });
        return;
      }
    }

    setFormErrors({});
    setIsSubmitting(true);

    try {
      const res = await fetch(config.SERVER_URL + '/seller/save-shop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth}`,
        },
        body: JSON.stringify({
          session_id: session,
          data: shops,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      }

      const response = await res.json();
      if (response.data && response.data.data) {
        setStore({ ...store, ...response.data.data });
      }

      addNotification({
        h2: 'Success',
        desc: 'Shops saved successfully!',
      });
    } catch (error) {
      console.error('Save error:', error);
      addNotification({
        h2: 'Error',
        desc: 'Error saving. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // URL helpers
  const copyUrlToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    addNotification({
      h2: 'Success',
      desc: 'URL copied to clipboard!',
    });
  };

  const testUrl = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FaEye /> },
    { id: 'shop-info', label: 'Shop Info', icon: <FaStore /> },
    { id: 'contact', label: 'Contact', icon: <FaPhone /> },
    { id: 'location', label: 'Location', icon: <FaMapMarkerAlt /> },
    { id: 'hours', label: 'Hours', icon: <FaClock /> },
    { id: 'urls', label: 'External URLs', icon: <FaGlobe /> },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div style={{ position: 'relative', height: '100vh' }}>
        <FullPageLoading />
      </div>
    );
  }

  // Empty state
  if (shops.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyStateIcon}>
          <FaStore />
        </div>
        <h2 className={styles.emptyStateTitle}>No Shops Yet</h2>
        <p className={styles.emptyStateDescription}>
          Add your first shop so customers can find your selling points.
        </p>
        <div className={styles.emptyStateActions}>
          <button onClick={addShop} className={styles.primaryButton}>
            <FaPlus /> Add Your First Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <button
              className={styles.mobileMenuButton}
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <RiStore2Line />
            </button>
            <div>
              <h1 className={styles.headerTitle}>Shops</h1>
              <p className={styles.headerSubtitle}>Manage your shop locations</p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <div className={styles.headerStats}>
              <div className={styles.statPill}>
                <FaStore />
                <span>{shopCount} Shop{shopCount !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className={`${styles.saveButton} ${isSubmitting ? styles.saving : ''}`}
            >
              {isSubmitting ? (
                <>
                  <div className={styles.buttonSpinner}></div>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div className={styles.mobileMenuOverlay}>
            <div className={styles.mobileMenu}>
              <div className={styles.mobileMenuHeader}>
                <h3>Your Shops</h3>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className={styles.closeMenuButton}
                >
                  <FaTimes />
                </button>
              </div>
              <div className={styles.mobileStoreList}>
                {shops.map((shop, index) => (
                  <div
                    key={shop.id}
                    className={`${styles.mobileStoreItem} ${activeItemIndex === index ? styles.mobileStoreActive : ''}`}
                    onClick={() => {
                      setActiveItemIndex(index);
                      setShowMobileMenu(false);
                    }}
                  >
                    <div className={styles.mobileStoreIcon}>
                      <FaStore />
                    </div>
                    <div className={styles.mobileStoreInfo}>
                      <div className={styles.mobileStoreName}>
                        {shop.name}
                        <span className={`${styles.typeBadge} ${styles.typeShop}`}>Shop</span>
                      </div>
                      <div className={styles.mobileStoreStatus}>
                        <span className={`${styles.mobileStatusDot} ${shop.todayStatus === 'open' ? styles.statusOpen : styles.statusClosed}`}></span>
                        {shop.todayStatus === 'open' ? 'Open Now' : 'Closed'}
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => {
                    addShop();
                    setShowMobileMenu(false);
                  }}
                  className={styles.mobileAddButton}
                >
                  <FaPlus /> Add New Shop
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Layout */}
        <div className={styles.layout}>
          {/* Sidebar - Shops List */}
          <aside className={`${styles.sidebar} ${showLocationList ? styles.sidebarVisible : ''}`}>
            <div className={styles.sidebarHeader}>
              <h2 className={styles.sidebarTitle}>
                <RiStore2Line />
                Your Shops
              </h2>
            </div>

            <div className={styles.storeList}>
              {shops.map((shop, index) => (
                <div
                  key={shop.id}
                  draggable
                  onDragStart={(e) => {
                    setDragIndex(index);
                    e.dataTransfer.setData('text/plain', String(index));
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    moveShop(dragIndex, index);
                    setDragIndex(null);
                  }}
                  onDragEnd={() => setDragIndex(null)}
                  className={`${styles.storeCard} ${activeItemIndex === index ? styles.storeCardActive : ''} ${styles.storeCardTypeShop}`}
                  onClick={() => {
                    setActiveItemIndex(index);
                    setFormErrors({});
                  }}
                >
                  <div className={styles.storeCardHeader}>
                    <div className={styles.storeCardIcon}>
                      <div className={styles.shopLogoPlaceholder}>
                        <FaStore />
                      </div>
                      <div className={styles.locationTypeBadge}>Shop</div>
                    </div>
                    <div className={styles.storeCardInfo}>
                      <div className={styles.storeCardTitle}>
                        <h3 className={styles.storeName}>{shop.name}</h3>
                        <div className={styles.storeBadges}>
                          <span className={`${styles.statusBadge} ${shop.todayStatus === 'open' ? styles.statusOpen : styles.statusClosed}`}>
                            {shop.todayStatus === 'open' ? 'Open Now' : 'Closed'}
                          </span>
                          <span className={styles.shopTypeBadge}>
                            {SHOP_TYPES.find((t) => t.id === shop.shopType)?.name || 'Shop'}
                          </span>
                        </div>
                      </div>
                      <p className={styles.storeLocation}>
                        {shop.location?.address
                          ? `${shop.location.address.substring(0, 30)}${shop.location.address.length > 30 ? '...' : ''}`
                          : 'No address'}
                      </p>
                      {shop.phone && (
                        <div className={styles.storeContacts}>
                          <span className={styles.contactItem}>
                            <BsTelephone /> {shop.phone}
                          </span>
                        </div>
                      )}
                      {shop.description && (
                        <p className={styles.shopDescription}>{shop.description}</p>
                      )}
                    </div>
                  </div>

                  <div className={styles.storeCardActions}>
                    <div className={styles.storePosition}>Shop {index + 1}</div>
                    <div className={styles.storeActionButtons}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTodayStatus(index);
                        }}
                        className={`${styles.toggleStatusButton} ${shop.todayStatus === 'open' ? styles.statusOpen : styles.statusClosed}`}
                        title={shop.todayStatus === 'open' ? 'Mark as closed' : 'Mark as open'}
                      >
                        {shop.todayStatus === 'open' ? 'Open' : 'Closed'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateShop(index);
                        }}
                        className={styles.actionButton}
                        title="Duplicate Shop"
                      >
                        <FaCopy />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          makeConfirm(index);
                        }}
                        className={styles.deleteButton}
                        title="Delete Shop"
                      >
                        <FaTrash />
                      </button>
                      <div className={styles.dragHandle}>
                        <FaSort />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Shop Button */}
              <button onClick={addShop} className={styles.addShopCard}>
                <div className={styles.addShopContent}>
                  <FaStore />
                  <span>Add New Shop</span>
                </div>
              </button>
            </div>

            {/* Stats */}
            <div className={styles.storeStats}>
              <h3 className={styles.statsTitle}>Shop Summary</h3>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <FaStore />
                  </div>
                  <div>
                    <div className={styles.statValue}>{shopCount}</div>
                    <div className={styles.statLabel}>Shop{shopCount !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <FaClock />
                  </div>
                  <div>
                    <div className={styles.statValue}>{openCount}</div>
                    <div className={styles.statLabel}>Open Now</div>
                  </div>
                </div>
              </div>
              <div className={styles.statsNote}>
                <MdInfo />
                <p>You can add multiple shops. Drag to reorder.</p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className={styles.content}>
            {/* Mobile Selector */}
            <div className={styles.mobileSelector}>
              <button
                onClick={() => setShowLocationList(!showLocationList)}
                className={styles.mobileSelectorButton}
              >
                <div className={styles.mobileSelectorContent}>
                  <FaStore />
                  <div className={styles.mobileSelectorInfo}>
                    <div className={styles.mobileSelectorLabel}>Currently Editing</div>
                    <div className={styles.mobileSelectorStore}>{activeShop?.name}</div>
                  </div>
                </div>
                <FaChevronDown className={showLocationList ? styles.chevronUp : styles.chevronDown} />
              </button>
            </div>

            {/* Active Shop Header */}
            {activeShop && (
              <div className={styles.storeHeader}>
                <div className={styles.storeHeaderContent}>
                  <div className={styles.storeLogoContainer}>
                    <div className={styles.storeLogoWrapper}>
                      <div className={styles.shopLogoPlaceholderLarge}>
                        <FaStore />
                      </div>
                    </div>
                  </div>

                  <div className={styles.storeHeaderInfo}>
                    <div className={styles.storeHeaderTop}>
                      <div>
                        <h2 className={styles.storeHeaderName}>
                          {activeShop.name}
                          <span className={`${styles.headerTypeBadge} ${styles.typeShop}`}>Shop</span>
                          <span className={styles.shopTypeBadgeHeader}>
                            {SHOP_TYPES.find((t) => t.id === activeShop.shopType)?.name || 'Shop'}
                          </span>
                        </h2>

                        {activeShop.description && (
                          <p className={styles.storeHeaderDescription}>
                            {activeShop.description}
                          </p>
                        )}

                        <div className={styles.locationQuickInfo}>
                          <div className={styles.infoItem}>
                            <FaMapMarkerAlt />
                            <span>{activeShop.location?.address || 'Location not set'}</span>
                          </div>
                          <div className={`${styles.todayStatus} ${activeShop.todayStatus === 'open' ? styles.statusOpen : styles.statusClosed}`}>
                            <span className={styles.statusDot}></span>
                            {activeShop.todayStatus === 'open' ? 'Open Today' : 'Closed Today'}
                          </div>
                        </div>

                        {/* External URLs Preview */}
                        {activeShop.external_url?.filter((url) => url.url).length > 0 && (
                          <div className={styles.external_urlPreview}>
                            {activeShop.external_url
                              .filter((url) => url.url)
                              .slice(0, 3)
                              .map((url) => (
                                <a
                                  key={url.id}
                                  href={url.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.urlPreview}
                                >
                                  <FaGlobe />
                                  <span>{url.title || 'Link'}</span>
                                </a>
                              ))}
                            {activeShop.external_url.filter((url) => url.url).length > 3 && (
                              <span className={styles.moreUrls}>
                                +{activeShop.external_url.filter((url) => url.url).length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className={styles.storeStatus}>
                        <button
                          onClick={() => toggleTodayStatus(activeItemIndex)}
                          className={`${styles.statusToggleButton} ${activeShop.todayStatus === 'open' ? styles.statusOpen : styles.statusClosed}`}
                        >
                          {activeShop.todayStatus === 'open' ? 'Mark as Closed' : 'Mark as Open'}
                        </button>
                        {activeShop.updatedAt && (
                          <div className={styles.lastUpdated}>
                            Last updated: {new Date(activeShop.updatedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs Navigation */}
            <div className={styles.tabsContainer}>
              <nav className={styles.tabs}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                  >
                    <span className={styles.tabIcon}>{tab.icon}</span>
                    <span className={styles.tabLabel}>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
              {activeTab === 'overview' && activeShop && (
                <div className={styles.tabSection}>
                  <h3 className={styles.sectionTitle}>Shop Overview</h3>

                  <div className={styles.overviewGrid}>
                    <div className={styles.overviewCard}>
                      <div className={styles.overviewCardHeader}>
                        <h4 className={styles.overviewCardTitle}>
                          <FaInfoCircle /> Basic Information
                        </h4>
                        <button onClick={() => setActiveTab('shop-info')} className={styles.editButton}>
                          <FaEdit /> Edit
                        </button>
                      </div>
                      <div className={styles.overviewDetails}>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Name:</span>
                          <span className={styles.detailValue}>{activeShop.name}</span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Description:</span>
                          <span className={styles.detailValue}>{activeShop.description || 'Not set'}</span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Shop Type:</span>
                          <span className={styles.detailValue}>
                            {SHOP_TYPES.find((t) => t.id === activeShop.shopType)?.name || 'Not set'}
                          </span>
                        </div>
                        {activeShop.openingDate && (
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Opening Date:</span>
                            <span className={styles.detailValue}>
                              {new Date(activeShop.openingDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.overviewCard}>
                      <div className={styles.overviewCardHeader}>
                        <h4 className={styles.overviewCardTitle}>
                          <FaMapMarkerAlt /> Location
                        </h4>
                        <button onClick={() => setActiveTab('location')} className={styles.editButton}>
                          <FaEdit /> Edit
                        </button>
                      </div>
                      <div className={styles.overviewDetails}>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Address:</span>
                          <span className={styles.detailValue}>{activeShop.location?.address || 'Not set'}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.overviewCard}>
                      <div className={styles.overviewCardHeader}>
                        <h4 className={styles.overviewCardTitle}>
                          <FaPhone /> Contact
                        </h4>
                        <button onClick={() => setActiveTab('contact')} className={styles.editButton}>
                          <FaEdit /> Edit
                        </button>
                      </div>
                      <div className={styles.overviewDetails}>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Incharge:</span>
                          <span className={styles.detailValue}>{activeShop.inchargeName || 'Not set'}</span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Phone:</span>
                          <span className={styles.detailValue}>{activeShop.phone || 'Not set'}</span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Email:</span>
                          <span className={styles.detailValue}>{activeShop.email || 'Not set'}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.overviewCard}>
                      <div className={styles.overviewCardHeader}>
                        <h4 className={styles.overviewCardTitle}>
                          <FaClock /> Operating Hours
                        </h4>
                        <button onClick={() => setActiveTab('hours')} className={styles.editButton}>
                          <FaEdit /> Edit
                        </button>
                      </div>
                      <div className={styles.hoursOverview}>
                        {DAYS.map((day) => {
                          const dayHours = activeShop.active_time[day.id];
                          return (
                            <div key={day.id} className={styles.dayOverview}>
                              <span className={styles.dayNameShort}>{day.short}</span>
                              <span className={`${styles.dayHours} ${dayHours.closed ? styles.dayClosed : ''}`}>
                                {dayHours.closed ? 'Closed' : `${dayHours.open} - ${dayHours.close}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className={styles.overviewCard}>
                      <div className={styles.overviewCardHeader}>
                        <h4 className={styles.overviewCardTitle}>
                          <FaGlobe /> External Links
                        </h4>
                        <button onClick={() => setActiveTab('urls')} className={styles.editButton}>
                          <FaEdit /> Edit
                        </button>
                      </div>
                      <div className={styles.urlsOverview}>
                        {activeShop.external_url?.filter((url) => url.url).length > 0 ? (
                          activeShop.external_url
                            .filter((url) => url.url)
                            .map((url) => (
                              <div key={url.id} className={styles.urlOverviewItem}>
                                <div className={styles.urlHeading}>{url.title || 'Link'}</div>
                                <div className={styles.urlValue}>
                                  <a href={url.url} target="_blank" rel="noopener noreferrer">
                                    {url.url.length > 40 ? `${url.url.substring(0, 40)}...` : url.url}
                                  </a>
                                </div>
                              </div>
                            ))
                        ) : (
                          <div className={styles.noUrls}>No external links added</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'shop-info' && activeShop && (
                <div className={styles.tabSection}>
                  <h3 className={styles.sectionTitle}>Shop Information</h3>
                  <p className={styles.sectionSubtitle}>Shops are your selling points</p>

                  <div className={styles.formSection}>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                          Shop Name *
                          {formErrors.name && (
                            <span className={styles.errorText}> - {formErrors.name}</span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={activeShop.name}
                          onChange={(e) => updateShop('name', e.target.value)}
                          className={`${styles.formInput} ${formErrors.name ? styles.inputError : ''}`}
                          placeholder="Enter shop name"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Description</label>
                        <textarea
                          value={activeShop.description}
                          onChange={(e) => updateShop('description', e.target.value)}
                          rows="2"
                          className={styles.formTextarea}
                          placeholder="Describe your shop"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Incharge Name *</label>
                        <input
                          type="text"
                          value={activeShop.inchargeName}
                          onChange={(e) => updateShop('inchargeName', e.target.value)}
                          className={styles.formInput}
                          placeholder="Shop incharge/manager name"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Shop Type</label>
                        <div className={styles.shopTypeGrid}>
                          {SHOP_TYPES.map((shopType) => (
                            <label
                              key={shopType.id}
                              className={`${styles.shopTypeOption} ${activeShop.shopType === shopType.id ? styles.shopTypeSelected : ''}`}
                            >
                              <input
                                type="radio"
                                name="shopType"
                                value={shopType.id}
                                checked={activeShop.shopType === shopType.id}
                                onChange={(e) => updateShop('shopType', e.target.value)}
                                className={styles.shopTypeRadio}
                              />
                              <div className={styles.shopTypeContent}>
                                <span className={styles.shopTypeIcon}>{shopType.icon}</span>
                                <span className={styles.shopTypeName}>{shopType.name}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Area (sq ft)</label>
                        <input
                          type="text"
                          value={activeShop.areaSqft}
                          onChange={(e) => updateShop('areaSqft', e.target.value)}
                          className={styles.formInput}
                          placeholder="e.g., 1200"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Opening Date</label>
                        <input
                          type="date"
                          value={activeShop.openingDate}
                          onChange={(e) => updateShop('openingDate', e.target.value)}
                          className={styles.formInput}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Rent Amount (Monthly)</label>
                        <input
                          type="text"
                          value={activeShop.rentAmount}
                          onChange={(e) => updateShop('rentAmount', e.target.value)}
                          className={styles.formInput}
                          placeholder="e.g., 50000"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Lease End Date</label>
                        <input
                          type="date"
                          value={activeShop.leaseEndDate}
                          onChange={(e) => updateShop('leaseEndDate', e.target.value)}
                          className={styles.formInput}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'contact' && activeShop && (
                <div className={styles.tabSection}>
                  <h3 className={styles.sectionTitle}>Contact Information</h3>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Incharge Name *</label>
                      <input
                        type="text"
                        value={activeShop.inchargeName}
                        onChange={(e) => updateShop('inchargeName', e.target.value)}
                        className={styles.formInput}
                        placeholder="Shop incharge/manager name"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <FaPhone /> Phone Number *
                        {formErrors.phone && (
                          <span className={styles.errorText}> - {formErrors.phone}</span>
                        )}
                      </label>
                      <input
                        type="tel"
                        value={activeShop.phone}
                        onChange={(e) => updateShop('phone', e.target.value)}
                        className={`${styles.formInput} ${formErrors.phone ? styles.inputError : ''}`}
                        placeholder="+1 (123) 456-7890"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <MdEmail /> Email Address
                        {formErrors.email && (
                          <span className={styles.errorText}> - {formErrors.email}</span>
                        )}
                      </label>
                      <input
                        type="email"
                        value={activeShop.email}
                        onChange={(e) => updateShop('email', e.target.value)}
                        className={`${styles.formInput} ${formErrors.email ? styles.inputError : ''}`}
                        placeholder="contact@example.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'location' && activeShop && (
                <div className={styles.tabSection}>
                  <h3 className={styles.sectionTitle}>Shop Location</h3>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Address *
                        {formErrors.address && (
                          <span className={styles.errorText}> - {formErrors.address}</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={activeShop.location?.address || ''}
                        onChange={(e) => updateShop('location.address', e.target.value)}
                        className={`${styles.formInput} ${formErrors.address ? styles.inputError : ''}`}
                        placeholder="Street address"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <FaMapMarkerAlt /> Maps URL
                      </label>
                      <input
                        type="url"
                        value={activeShop.location?.url || ''}
                        onChange={(e) => updateShop('location.url', e.target.value)}
                        className={styles.formInput}
                        placeholder="https://maps.uniyel.com/?q=..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'hours' && activeShop && (
                <div className={styles.tabSection}>
                  <h3 className={styles.sectionTitle}>Operating Hours</h3>

                  <div className={styles.hoursSection}>
                    <div className={styles.hoursGrid}>
                      {DAYS.map((day) => {
                        const dayHours = activeShop.active_time[day.id];
                        return (
                          <div key={day.id} className={styles.dayCard}>
                            <div className={styles.dayHeader}>
                              <div className={styles.dayName}>
                                <span className={styles.dayFull}>{day.name}</span>
                                <span className={styles.dayShort}>{day.short}</span>
                              </div>
                              <label className={styles.closedToggle}>
                                <input
                                  type="checkbox"
                                  checked={dayHours.closed}
                                  onChange={() => updateActiveTime(day.id, 'closed')}
                                  className={styles.toggleInput}
                                />
                                <span className={styles.toggleSlider}></span>
                                <span className={styles.toggleLabel}>
                                  {dayHours.closed ? 'Closed' : 'Open'}
                                </span>
                              </label>
                            </div>

                            {!dayHours.closed && (
                              <div className={styles.timeInputs}>
                                <div className={styles.timeGroup}>
                                  <label>Open</label>
                                  <input
                                    type="time"
                                    value={dayHours.open}
                                    onChange={(e) => updateActiveTime(day.id, 'open', e.target.value)}
                                    className={styles.timeInput}
                                  />
                                </div>
                                <div className={styles.timeGroup}>
                                  <label>Close</label>
                                  <input
                                    type="time"
                                    value={dayHours.close}
                                    onChange={(e) => updateActiveTime(day.id, 'close', e.target.value)}
                                    className={styles.timeInput}
                                  />
                                </div>
                              </div>
                            )}

                            {dayHours.closed && (
                              <div className={styles.closedMessage}>
                                <FaTimes />
                                <span>Closed all day</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className={styles.hoursNote}>
                      <MdInfo />
                      <p>Set your regular business hours. These will be displayed to customers.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'urls' && activeShop && (
                <div className={styles.tabSection}>
                  <h3 className={styles.sectionTitle}>External URLs</h3>
                  <p className={styles.sectionSubtitle}>Add links to your website, catalogs, or other resources</p>

                  <div className={styles.urlsSection}>
                    <div className={styles.urlsList}>
                      {(activeShop.external_url || []).map((url, index) => (
                        <div key={url.id} className={styles.urlItem}>
                          <div className={styles.urlItemHeader}>
                            <div className={styles.urlNumber}>URL #{index + 1}</div>
                            <button
                              onClick={() => removeExternalUrl(index)}
                              className={styles.removeUrlButton}
                            >
                              <FaTimes />
                            </button>
                          </div>

                          <div className={styles.urlForm}>
                            <div className={styles.formGroup}>
                              <label className={styles.formLabel}>
                                Heading
                                {formErrors[`externalUrl_${index}`] && (
                                  <span className={styles.errorText}> - Invalid URL</span>
                                )}
                              </label>
                              <div className={styles.urlHeadingInput}>
                                <input
                                  type="text"
                                  value={url.title}
                                  onChange={(e) => updateExternalUrl(index, 'title', e.target.value)}
                                  className={styles.formInput}
                                  placeholder="e.g., Website, Catalog, Menu"
                                  list="urlHeadings"
                                />
                                <datalist id="urlHeadings">
                                  {URL_HEADINGS.map((title) => (
                                    <option key={title} value={title} />
                                  ))}
                                </datalist>
                              </div>
                            </div>

                            <div className={styles.formGroup}>
                              <label className={styles.formLabel}>URL *</label>
                              <div className={styles.urlInputGroup}>
                                <input
                                  type="url"
                                  value={url.url}
                                  onChange={(e) => updateExternalUrl(index, 'url', e.target.value)}
                                  className={`${styles.formInput} ${formErrors[`externalUrl_${index}`] ? styles.inputError : ''}`}
                                  placeholder="https://example.com"
                                />
                                <div className={styles.urlActions}>
                                  {url.url && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => copyUrlToClipboard(url.url)}
                                        className={styles.urlActionButton}
                                        title="Copy URL"
                                      >
                                        <FaCopy />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => testUrl(url.url)}
                                        className={styles.urlActionButton}
                                        title="Test URL"
                                      >
                                        <FaExternalLinkAlt />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={addExternalUrl}
                      className={styles.addUrlButton}
                      disabled={(activeShop.external_url?.length || 0) >= MAX_EXTERNAL_URLS}
                    >
                      <FaPlus /> Add Another URL
                    </button>

                    <div className={styles.urlsNote}>
                      <MdInfo />
                      <p>
                        Add up to {MAX_EXTERNAL_URLS} external links. Use titles like "Website", "Product Catalog", "Brochure", etc.
                        Customers will see these links on your shop page.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}