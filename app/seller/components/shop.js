'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useDropzone } from 'react-dropzone';
import {
  FaSave, FaStore, FaPhone, FaMapMarkerAlt, FaClock,
  FaImages, FaTrash, FaPlus, FaTimes, FaUpload, FaCamera,
  FaCopy, FaChevronDown, FaSort, FaEye,
  FaExternalLinkAlt, FaEdit, FaInfoCircle, FaGlobe, FaBuilding,
} from 'react-icons/fa';
import { MdEmail, MdInfo, MdPhoto, MdLocalOffer } from 'react-icons/md';
import { BsShop, BsTelephone } from 'react-icons/bs';
import { RiStore2Line, RiStore3Line } from 'react-icons/ri';
import { TbBuildingStore } from 'react-icons/tb';

import FullPageLoading from '../../../components/FullPageLoading';

import styles from './css/shop.module.css';
import config from '../../../utils/config';

// Dynamically import ImageCropper
const ImageCropper = dynamic(() => import('./sub/shop/crop'), {
  ssr: false,
  loading: () => <div className={styles.loadingCropper}>Loading image editor...</div>
});

// Store template (Main Business Location - MANDATORY)
const initialStoreTemplate = {
  type: 'store',
  status: 'active',

  contactPerson: '',
  email: '',

  // Location

  // Operating Hours
  todayStatus: 'open',
  active_time: {
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '10:00', close: '16:00', closed: false },
    sunday: { open: '11:00', close: '15:00', closed: true }
  },

  // Images (Only for Store)
  banner: '',
  img: '',

  // Additional Info
  gstNumber: '',
  licenseNumber: '',
  desc: '',

  // Meta
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Shop template (Additional Selling Point - OPTIONAL)
const initialShopTemplate = {
  id: null,
  type: 'shop',
  name: 'New Shop',
  description: '',
  status: 'active',
  isPrimary: false,

  // Contact
  inchargeName: '',
  phone: '',
  email: '',

  // Location
  address: '',

  // Operating Hours
  todayStatus: 'open',
  active_time: {
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '10:00', close: '16:00', closed: false },
    sunday: { open: '11:00', close: '15:00', closed: true }
  },

  // Shop Specific
  shopType: 'retail',
  areaSqft: '',
  rentAmount: '',
  leaseEndDate: '',
  openingDate: '',

  // External URLs
  external_url: [
    { id: Date.now() + 1, title: 'Shop Website', url: '' },
  ],

  // Meta
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Day configuration
const DAYS = [
  { id: 'monday', name: 'Monday', short: 'Mon' },
  { id: 'tuesday', name: 'Tuesday', short: 'Tue' },
  { id: 'wednesday', name: 'Wednesday', short: 'Wed' },
  { id: 'thursday', name: 'Thursday', short: 'Thu' },
  { id: 'friday', name: 'Friday', short: 'Fri' },
  { id: 'saturday', name: 'Saturday', short: 'Sat' },
  { id: 'sunday', name: 'Sunday', short: 'Sun' }
];

// Shop types
const SHOP_TYPES = [
  { id: 'retail', name: 'Retail Shop', icon: <BsShop /> },
  { id: 'wholesale', name: 'Wholesale Shop', icon: <TbBuildingStore /> },
  { id: 'outlet', name: 'Outlet', icon: <RiStore3Line /> },
  { id: 'kiosk', name: 'Kiosk', icon: <MdLocalOffer /> },
  { id: 'showroom', name: 'Showroom', icon: <FaBuilding /> }
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
  'Order Form'
];


export default function SellerBusinessLocations({
  auth,
  session,
  addNotification,
  genAlert,
  store,
  setStore,
  setFullPageLoading
}) {
  console.log(store);

  const [activeTab, setActiveTab] = useState('overview');
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [businessLocations, setBusinessLocations] = useState([]);
  const [originalBusinessLocations, setOriginalBusinessLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageCropperOpen, setImageCropperOpen] = useState(false);
  const [cropperConfig, setCropperConfig] = useState(null);
  const [showLocationList, setShowLocationList] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [viewType, setViewType] = useState('all');

  // Initialize business locations
  useEffect(() => {
    if (typeof store != 'object') return;
    // Demo data - always start with one store
    const demoStore = {
      ...store,
      ...initialStoreTemplate,
      gstNumber: 'GST123456789',
      status: 'active',
      external_url: []
    };

    setBusinessLocations([demoStore]);
    setOriginalBusinessLocations([demoStore]);
    setIsLoading(false);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isLoading && businessLocations.length > 0) {
      localStorage.setItem('seller_business_locations', JSON.stringify(businessLocations));
    }
  }, [businessLocations, isLoading]);

  // Active business location
  const activeLocation = businessLocations[activeItemIndex] || null;

  // Check if seller has store (should always have at least one)
  const hasStore = businessLocations.some(location => location.type === 'store');
  const storeCount = businessLocations.filter(location => location.type === 'store').length;
  const shopCount = businessLocations.filter(location => location.type === 'shop').length;

  // Add Store (Only one store allowed - this should only be called if store was deleted)
  const addStore = () => {
    if (hasStore) {
      addNotification({
        h2: 'Error',
        desc: 'You can only have one store. Please edit your existing store.'
      });
      return;
    }

    const newStore = {
      ...initialStoreTemplate,
      id: Date.now(),
      name: 'My Store',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedLocations = [...businessLocations, newStore];
    setBusinessLocations(updatedLocations);
    setOriginalBusinessLocations(updatedLocations);
    setActiveItemIndex(updatedLocations.length - 1);
    setActiveTab('store-info');
  };

  // Add Shop
  const addShop = () => {
    const newShop = {
      ...initialShopTemplate,
      id: Date.now(),
      name: `Shop ${shopCount + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedLocations = [...businessLocations, newShop];
    setBusinessLocations(updatedLocations);
    setOriginalBusinessLocations(updatedLocations);
    setActiveItemIndex(updatedLocations.length - 1);
    setActiveTab('shop-info');
  };

  // Update location field
  const updateLocation = (field, value) => {
    setBusinessLocations(prev => {
      if (field.includes('.')) {
        const keys = field.split('.');
        return prev.map((location, index) => {
          if (index !== activeItemIndex) return location;

          const updated = { ...location };
          let current = updated;

          for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            current[key] = { ...current[key] };
            current = current[key];
          }

          current[keys[keys.length - 1]] = value;
          updated.updatedAt = new Date().toISOString();
          return updated;
        });
      }

      return prev.map((location, index) =>
        index === activeItemIndex ? {
          ...location,
          [field]: value,
          updatedAt: new Date().toISOString()
        } : location
      );
    });
  };

  // Update external URLs
  const updateExternalUrl = (urlIndex, field, value) => {
    setBusinessLocations(prev => prev.map((location, index) => {
      if (index === activeItemIndex) {
        const updatedUrls = [...location.external_url];
        updatedUrls[urlIndex] = {
          ...updatedUrls[urlIndex],
          [field]: value
        };
        return {
          ...location,
          external_url: updatedUrls,
          updatedAt: new Date().toISOString()
        };
      }
      return location;
    }));
  };

  // Add new external URL
  const addExternalUrl = () => {
    const newUrl = {
      id: Date.now(),
      title: '',
      url: ''
    };

    setBusinessLocations(prev => prev.map((location, index) => {
      if (index === activeItemIndex) {
        return {
          ...location,
          external_url: [...location.external_url, newUrl],
          updatedAt: new Date().toISOString()
        };
      }
      return location;
    }));
  };

  // Remove external URL
  const removeExternalUrl = (urlIndex) => {
    setBusinessLocations(prev => prev.map((location, index) => {
      if (index === activeItemIndex) {
        const updatedUrls = location.external_url.filter((_, index) => index !== urlIndex);
        return {
          ...location,
          external_url: updatedUrls,
          updatedAt: new Date().toISOString()
        };
      }
      return location;
    }));
  };

  // Update operating hours
  const updateActiveTime = (day, field, value) => {
    setBusinessLocations(prev => prev.map((location, index) => {
      if (index === activeItemIndex) {
        const updatedHours = {
          ...location.active_time,
          [day]: {
            ...location.active_time[day],
            [field]: field === 'closed' ? !location.active_time[day].closed : value
          }
        };
        return {
          ...location,
          active_time: updatedHours,
          updatedAt: new Date().toISOString()
        };
      }
      return location;
    }));
  };

  const makeConfirm = (index) => {
    const locationToDelete = businessLocations[index];

    // Cannot delete the only store
    if (locationToDelete.type === 'store' && storeCount <= 1) {
      addNotification({
        h2: 'Error',
        desc: 'Store is mandatory. You must have at least one store.'
      });
      return;
    }

    genAlert({
      title: `Are you sure you want to delete ${locationToDelete.name}?`,
      message: `
    If you delete <b>${locationToDelete.name}</b>:
    <ul style={{ margin: '0.5rem 0 1rem 1rem', paddingLeft: '1rem' }}>
      <li>Customers won't see this shop</li>
    </ul>
    <i style='color:red'>This action can't be retrieved</i>?
  `,
      confirmText: "Yes, Delete",
      cancelText: "No",
      onConfirm: () => deleteLocation(index),
      isHtml: true
    });
  };

  // Delete location
  const deleteLocation = (index) => {
    const updatedLocations = businessLocations.filter((_, i) => i !== index);
    setBusinessLocations(updatedLocations);
    setOriginalBusinessLocations(updatedLocations);

    if (updatedLocations.length === 0) {
      addStore();
    } else if (index === activeItemIndex) {
      setActiveItemIndex(Math.max(0, index - 1));
    }
  };

  // Duplicate location
  const duplicateLocation = (index) => {
    const locationToCopy = businessLocations[index];

    // If duplicating store, change type to shop (only one store allowed)
    const isStore = locationToCopy.type === 'store';
    const newType = isStore ? 'shop' : locationToCopy.type;
    const newName = isStore ? `Shop ${shopCount + 1}` : `${locationToCopy.name} (Copy)`;

    const duplicatedLocation = {
      ...JSON.parse(JSON.stringify(locationToCopy)),
      id: Date.now(),
      name: newName,
      type: newType,
      isPrimary: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Clear images if duplicating store to shop
      ...(isStore ? {
        banner: '',
        img: '',
      } : {})
    };

    const updatedLocations = [...businessLocations, duplicatedLocation];
    setBusinessLocations(updatedLocations);
    setOriginalBusinessLocations(updatedLocations);
    setActiveItemIndex(businessLocations.length);
  };

  // Handle image upload (only for store)
  const handleImageUpload = (type, files) => {
    if (activeLocation?.type !== 'store') return;

    const file = files[0];
    if (!file) return;

    let aspectRatio = 1;
    if (type === 'banner') aspectRatio = 4 / 1;
    if (type === 'image') aspectRatio = 1;

    const imageUrl = URL.createObjectURL(file);

    setCropperConfig({
      img: imageUrl,
      aspectRatio,
      type,
      onCrop: async (croppedImage) => {
        if (type === 'banner') {
          setFullPageLoading(true);
          const res = await uploadImagesToServer(croppedImage, type);
          setFullPageLoading(false);
          if (!res.data || !res.data.url) {
            addNotification({
              h2: 'Error',
              desc: 'There was a problem while uploading the banner',
            });
            return;
          };
          updateLocation('banner', res.data.url);
        } else if (type === 'img') {
          setFullPageLoading(true);
          const res = await uploadImagesToServer(croppedImage, type);
          setFullPageLoading(false);
          if (!res.data || !res.data.url) {
            addNotification({
              h2: 'Error',
              desc: 'There was a problem while uploading the image',
            });
            return;
          };
          updateLocation('img', res.data.url);
        }
        URL.revokeObjectURL(imageUrl);
        setImageCropperOpen(false);
      },
      onCancel: () => {
        URL.revokeObjectURL(imageUrl);
        setImageCropperOpen(false);
      }
    });

    setImageCropperOpen(true);
  };

  // Dropzone configurations
  const { getRootProps: getBannerRootProps, getInputProps: getBannerInputProps } = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    onDrop: (files) => handleImageUpload('banner', files),
    disabled: activeLocation?.type !== 'store'
  });

  const { getRootProps: getLogoRootProps, getInputProps: getLogoInputProps } = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    onDrop: (files) => handleImageUpload('img', files),
    disabled: activeLocation?.type !== 'store'
  });

  // Function to upload images to server using FormData
  const uploadImagesToServer = async (file, key) => {
    const formData = new FormData();
    formData.append('session_id', session);
    formData.append('save_key', key)
    formData.append('image', file, 'image.jpg');

    try {
      const res = await fetch(config.SERVER_URL + '/seller/upload-shop-images', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth}`
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }
      const result = await res.json();
      console.log(result);
      return result;
    } catch (error) {
      console.error('Image upload error:', error);
      return {
        status: false,
        data: null
      }
    }
  };


  // Helper function to check if string is base64/image data
  function isBase64Image(str) {
    if (!str) return false;
    // Check if it's a data URL
    if (str.startsWith('data:image/')) return true;
    // Or check if it's plain base64 (optional)
    const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
    return str.length > 1000 && base64Regex.test(str);
  }

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!activeLocation?.name?.trim()) {
      if (activeTab != 'overview') setActiveTab('overview');
      errors.name = 'Name is required';
    }

    if (!activeLocation?.location?.address) {
      if (activeTab != 'location') setActiveTab('location');
      errors.address = 'Address is required';
    }

    if (activeLocation?.email && !/\S+@\S+\.\S+/.test(activeLocation.email)) {
      if (activeTab != 'contact') setActiveTab('contact');
      errors.email = 'Invalid email format';
    }

    if (activeLocation?.phone && !/^[\d\s\-\+\(\)]+$/.test(activeLocation.phone)) {
      errors.phone = 'Invalid phone number';
    }

    // Validate external URLs
    activeLocation?.external_url?.forEach((url, index) => {
      if (url.title && url.url) {
        try {
          new URL(url.url);
        } catch (_) {
          errors[`externalUrl_${index}`] = 'Invalid URL format';
        }
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle save - now with image upload
  const handleSave = async () => {
    if (!validateForm()) {
      addNotification({
        h2: 'Error',
        desc: 'Please fix the errors before saving'
      });
      setTimeout(() => {
        addNotification({
          h2: 'Error',
          desc: formErrors[Object.keys(formErrors)[0]]
        });
      }, 500);
      return;
    }

    setIsSubmitting(true);

    try {
      // Now save the updated locations data
      const res = await fetch(config.SERVER_URL + '/seller/save-shop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth}`
        },
        body: JSON.stringify({
          session_id: session,
          data: businessLocations,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      }
      const response = await res.json();
      if (response.data && response.data.data) {
        setStore(
          ...store,
          response.data.data
        );
      };
      addNotification({
        h2: 'Success',
        desc: activeLocation.type === 'store'
          ? 'Store saved successfully!'
          : 'Shop saved successfully!'
      });
    } catch (error) {
      console.error('Save error:', error);
      addNotification({
        h2: 'Error',
        desc: 'Error saving. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle today status
  const toggleTodayStatus = () => {
    const newStatus = activeLocation?.todayStatus === 'open' ? 'closed' : 'open';
    updateLocation('todayStatus', newStatus);
  };

  // Copy URL to clipboard
  const copyUrlToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    addNotification({
      h2: 'Success',
      desc: 'URL copied to clipboard!'
    });
  };

  // Test URL
  const testUrl = (url) => {
    window.open(url, '_blank');
  };

  // Tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FaEye /> },
    { id: 'store-info', label: 'Store Info', icon: <FaStore />, showFor: 'store' },
    { id: 'shop-info', label: 'Shop Info', icon: <FaStore />, showFor: 'shop' },
    { id: 'contact', label: 'Contact', icon: <FaPhone /> },
    { id: 'location', label: 'Location', icon: <FaMapMarkerAlt /> },
    { id: 'hours', label: 'Hours', icon: <FaClock /> },
    { id: 'urls', label: 'External URLs', icon: <FaGlobe /> },
    { id: 'images', label: 'Images', icon: <FaImages />, showFor: 'store' },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        position: "relative",
        height: '100vh',
      }}>
        <FullPageLoading />
      </div>
    );
  }

  // If somehow no store exists (shouldn't happen), show add store screen
  if (!hasStore) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyStateIcon}>
          <FaStore />
        </div>
        <h2 className={styles.emptyStateTitle}>Store Required</h2>
        <p className={styles.emptyStateDescription}>
          Your store is mandatory for your business profile. Please create your store first.
        </p>
        <div className={styles.emptyStateActions}>
          <button onClick={addStore} className={styles.primaryButton}>
            <FaPlus /> Create Your Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Image Cropper Modal */}
      {imageCropperOpen && cropperConfig && (
        <ImageCropper
          image={cropperConfig.img}
          aspectRatio={cropperConfig.aspectRatio}
          type={cropperConfig.type}
          onCropComplete={cropperConfig.onCrop}
          onClose={cropperConfig.onCancel}
        />
      )}

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
              <h1 className={styles.headerTitle}>Business Locations</h1>
              <p className={styles.headerSubtitle}>
                Manage your store and shop locations
              </p>
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
                <h3>Your Locations</h3>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className={styles.closeMenuButton}
                >
                  <FaTimes />
                </button>
              </div>
              <div className={styles.mobileStoreList}>
                {businessLocations.map((location, index) => (
                  <div
                    key={location.id}
                    className={`${styles.mobileStoreItem} ${activeItemIndex === index ? styles.mobileStoreActive : ''}`}
                    onClick={() => {
                      setActiveItemIndex(index);
                      setShowMobileMenu(false);
                    }}
                  >
                    <div className={styles.mobileStoreIcon}>
                      {location.type === 'store' ? <FaStore /> : <FaStore />}
                    </div>
                    <div className={styles.mobileStoreInfo}>
                      <div className={styles.mobileStoreName}>
                        {location.name}
                        <span className={`${styles.typeBadge} ${location.type === 'store' ? styles.typeStore : styles.typeShop}`}>
                          {location.type === 'store' ? 'Store' : 'Shop'}
                        </span>
                      </div>
                      <div className={styles.mobileStoreStatus}>
                        <span className={`${styles.mobileStatusDot} ${location.todayStatus === 'open' ? styles.statusOpen : styles.statusClosed}`}></span>
                        {location.todayStatus === 'open' ? 'Open Now' : 'Closed'}
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
          {/* Sidebar - Locations List */}
          <aside className={`${styles.sidebar} ${showLocationList ? styles.sidebarVisible : ''}`}>
            <div className={styles.sidebarHeader}>
              <h2 className={styles.sidebarTitle}>
                <RiStore2Line />
                Business Locations
              </h2>
              <div className={styles.sidebarActions}>
                <div className={styles.viewTypeButtons}>
                  <button
                    onClick={() => setViewType('all')}
                    className={`${styles.viewTypeButton} ${viewType === 'all' ? styles.viewTypeActive : ''}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setViewType('stores')}
                    className={`${styles.viewTypeButton} ${viewType === 'stores' ? styles.viewTypeActive : ''}`}
                  >
                    Store
                  </button>
                  <button
                    onClick={() => setViewType('shops')}
                    className={`${styles.viewTypeButton} ${viewType === 'shops' ? styles.viewTypeActive : ''}`}
                  >
                    Shops
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.storeList}>
              {/* Store Card (Always visible) */}
              {businessLocations
                .filter(location => location.type === 'store')
                .map((store, index) => {
                  const originalIndex = businessLocations.findIndex(l => l.id === store.id);
                  const hasNewImages = isBase64Image(store.banner) || isBase64Image(store.img);

                  return (
                    <div
                      key={store.id + Math.random()}
                      className={`${styles.storeCard} ${activeItemIndex === originalIndex ? styles.storeCardActive : ''} ${styles.storeCardTypeStore}`}
                      onClick={() => setActiveItemIndex(originalIndex)}
                    >
                      <div className={styles.storeCardHeader}>
                        <div className={styles.storeCardIcon}>
                          {store.img ? (
                            <img src={store.img} alt="" className={styles.storeLogo} />
                          ) : (
                            <div className={styles.storeLogoPlaceholder}>
                              <FaStore />
                            </div>
                          )}
                          <div className={styles.locationTypeBadge}>
                            Store
                          </div>
                          {hasNewImages && (
                            <div className={styles.unsavedImageIndicator} title="Unsaved images">
                              <FaImages />
                            </div>
                          )}
                        </div>
                        <div className={styles.storeCardInfo}>
                          <div className={styles.storeCardTitle}>
                            <h3 className={styles.storeName}>{store.name}</h3>
                            <div className={styles.storeBadges}>
                              <span className={`${styles.statusBadge} ${store.todayStatus === 'open' ? styles.statusOpen : styles.statusClosed}`}>
                                {store.todayStatus === 'open' ? 'Open Now' : 'Closed'}
                              </span>
                            </div>
                          </div>
                          <p className={styles.storeLocation}>
                            {store.city || 'Location not set'}
                          </p>
                          <div className={styles.storeContacts}>
                            {store.phone && (
                              <span className={styles.contactItem}>
                                <BsTelephone /> {store.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={styles.storeCardActions}>
                        <div className={styles.storeActionButtons}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTodayStatus();
                            }}
                            className={`${styles.toggleStatusButton} ${store.todayStatus === 'open' ? styles.statusOpen : styles.statusClosed}`}
                            title={store.todayStatus === 'open' ? 'Mark as closed' : 'Mark as open'}
                          >
                            {store.todayStatus === 'open' ? 'Open' : 'Closed'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateLocation(originalIndex);
                            }}
                            className={styles.actionButton}
                            title="Duplicate as Shop"
                          >
                            <FaCopy />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {/* Shop Cards */}
              {businessLocations
                .filter(location =>
                  (viewType === 'all' || viewType === 'shops') &&
                  location.type === 'shop'
                )
                .map((shop, index) => {
                  const originalIndex = businessLocations.findIndex(l => l.id === shop.id);
                  return (
                    <div
                      key={shop.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', originalIndex)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                        // Move shop logic here
                      }}
                      className={`${styles.storeCard} ${activeItemIndex === originalIndex ? styles.storeCardActive : ''} ${styles.storeCardTypeShop}`}
                      onClick={() => setActiveItemIndex(originalIndex)}
                    >
                      <div className={styles.storeCardHeader}>
                        <div className={styles.storeCardIcon}>
                          <div className={styles.shopLogoPlaceholder}>
                            <FaStore />
                          </div>
                          <div className={styles.locationTypeBadge}>
                            Shop
                          </div>
                        </div>
                        <div className={styles.storeCardInfo}>
                          <div className={styles.storeCardTitle}>
                            <h3 className={styles.storeName}>{shop.name}</h3>
                            <div className={styles.storeBadges}>
                              <span className={`${styles.statusBadge} ${shop.todayStatus === 'open' ? styles.statusOpen : styles.statusClosed}`}>
                                {shop.todayStatus === 'open' ? 'Open Now' : 'Closed'}
                              </span>
                              <span className={styles.shopTypeBadge}>
                                {SHOP_TYPES.find(t => t.id === shop.shopType)?.name || 'Shop'}
                              </span>
                            </div>
                          </div>
                          <p className={styles.storeLocation}>
                            {shop.address ? `${shop.address.substring(0, 30)}${shop.address.length > 30 ? '...' : ''}` : 'No address'}
                          </p>
                          {shop.description && (
                            <p className={styles.shopDescription}>{shop.description}</p>
                          )}
                        </div>
                      </div>

                      <div className={styles.storeCardActions}>
                        <div className={styles.storePosition}>
                          Shop {index + 1}
                        </div>
                        <div className={styles.storeActionButtons}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTodayStatus();
                            }}
                            className={`${styles.toggleStatusButton} ${shop.todayStatus === 'open' ? styles.statusOpen : styles.statusClosed}`}
                            title={shop.todayStatus === 'open' ? 'Mark as closed' : 'Mark as open'}
                          >
                            {shop.todayStatus === 'open' ? 'Open' : 'Closed'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateLocation(originalIndex);
                            }}
                            className={styles.actionButton}
                            title="Duplicate Shop"
                          >
                            <FaCopy />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              makeConfirm(originalIndex)
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
                  );
                })}

              {/* Add Shop Button */}
              {viewType !== 'stores' && (
                <button
                  onClick={addShop}
                  className={styles.addShopCard}
                >
                  <div className={styles.addShopContent}>
                    <FaStore />
                    <span>Add New Shop</span>
                  </div>
                </button>
              )}
            </div>

            {/* Stats */}
            <div className={styles.storeStats}>
              <h3 className={styles.statsTitle}>Business Summary</h3>
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
                    <div className={styles.statValue}>
                      {businessLocations.filter(l => l.todayStatus === 'open').length}
                    </div>
                    <div className={styles.statLabel}>Open Now</div>
                  </div>
                </div>
              </div>
              <div className={styles.statsNote}>
                <MdInfo />
                <p>Store is mandatory. You can add multiple shops.</p>
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
                  {activeLocation?.type === 'store' ? <FaStore /> : <FaStore />}
                  <div className={styles.mobileSelectorInfo}>
                    <div className={styles.mobileSelectorLabel}>Currently Editing</div>
                    <div className={styles.mobileSelectorStore}>{activeLocation?.name}</div>
                  </div>
                </div>
                <FaChevronDown className={showLocationList ? styles.chevronUp : styles.chevronDown} />
              </button>
            </div>

            {/* Active Location Header */}
            {activeLocation && (
              <div className={styles.storeHeader}>
                {/* Banner (Only for Store) */}
                {activeLocation.type === 'store' && (
                  <div className={styles.storeBanner}>
                    {activeLocation.banner ? (
                      <img
                        src={activeLocation.banner}
                        alt="Store banner"
                        className={styles.banner}
                      />
                    ) : (
                      <div className={styles.bannerPlaceholder}>
                        <MdPhoto />
                        <span>Store banner image (Recommended: 1600×400)</span>
                      </div>
                    )}
                    <div
                      {...getBannerRootProps()}
                      className={styles.bannerUploadOverlay}
                    >
                      <input {...getBannerInputProps()} />
                      <div className={styles.uploadOverlayContent}>
                        <FaCamera />
                        <span>Change Banner</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className={styles.storeHeaderContent}>
                  <div className={styles.storeLogoContainer}>
                    <div className={styles.storeLogoWrapper}>
                      {activeLocation.type === 'store' ? (
                        activeLocation.img ? (
                          <img
                            src={activeLocation.img}
                            alt="Store image"
                            className={styles.storeHeaderLogo}
                          />
                        ) : (
                          <div className={styles.storeLogoPlaceholderLarge}>
                            <FaStore />
                          </div>
                        )
                      ) : (
                        <div className={styles.shopLogoPlaceholderLarge}>
                          <FaStore />
                        </div>
                      )}

                      {activeLocation.type === 'store' && (
                        <div
                          {...getLogoRootProps()}
                          className={styles.logoUploadOverlay}
                        >
                          <input {...getLogoInputProps()} />
                          <FaCamera />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.storeHeaderInfo}>
                    <div className={styles.storeHeaderTop}>
                      <div>
                        <h2 className={styles.storeHeaderName}>
                          {activeLocation.name}
                          <span className={`${styles.headerTypeBadge} ${activeLocation.type === 'store' ? styles.typeStore : styles.typeShop}`}>
                            {activeLocation.type === 'store' ? 'Store' : 'Shop'}
                          </span>
                          {activeLocation.type === 'shop' && (
                            <span className={styles.shopTypeBadgeHeader}>
                              {SHOP_TYPES.find(t => t.id === activeLocation.shopType)?.name || 'Shop'}
                            </span>
                          )}
                        </h2>

                        {activeLocation.type === 'shop' && activeLocation.description && (
                          <p className={styles.storeHeaderDescription}>
                            {activeLocation.description}
                          </p>
                        )}

                        <div className={styles.locationQuickInfo}>
                          <div className={styles.infoItem}>
                            <FaMapMarkerAlt />
                            <span>{activeLocation.city || 'Location not set'}</span>
                          </div>
                          <div className={`${styles.todayStatus} ${activeLocation.todayStatus === 'open' ? styles.statusOpen : styles.statusClosed}`}>
                            <span className={styles.statusDot}></span>
                            {activeLocation.todayStatus === 'open' ? 'Open Today' : 'Closed Today'}
                          </div>
                        </div>

                        {/* External URLs Preview */}
                        {
                          activeLocation.external_url ? activeLocation.external_url.filter(url => url.url).length > 0 && (
                            <div className={styles.external_urlPreview}>
                              {activeLocation.external_url
                                .filter(url => url.url)
                                .slice(0, 3)
                                .map((url, index) => (
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
                              {activeLocation.external_url.filter(url => url.url).length > 3 && (
                                <span className={styles.moreUrls}>
                                  +{activeLocation.external_url.filter(url => url.url).length - 3} more
                                </span>
                              )}
                            </div>
                          ) : null
                        }
                      </div>

                      <div className={styles.storeStatus}>
                        <button
                          onClick={toggleTodayStatus}
                          className={`${styles.statusToggleButton} ${activeLocation.todayStatus === 'open' ? styles.statusOpen : styles.statusClosed}`}
                        >
                          {activeLocation.todayStatus === 'open' ? 'Mark as Closed' : 'Mark as Open'}
                        </button>
                        {activeLocation.updatedAt && (
                          <div className={styles.lastUpdated}>
                            Last updated: {new Date(activeLocation.updatedAt).toLocaleDateString()}
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
                {tabs
                  .filter(tab => {
                    if (tab.showFor === 'store' && activeLocation?.type !== 'store') return false;
                    if (tab.showFor === 'shop' && activeLocation?.type !== 'shop') return false;
                    return true;
                  })
                  .map((tab) => (
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
              {activeTab === 'overview' && activeLocation && (
                <div className={styles.tabSection}>
                  <h3 className={styles.sectionTitle}>
                    {activeLocation.type === 'store' ? 'Store Overview' : 'Shop Overview'}
                  </h3>

                  <div className={styles.overviewGrid}>
                    <div className={styles.overviewCard}>
                      <div className={styles.overviewCardHeader}>
                        <h4 className={styles.overviewCardTitle}>
                          <FaInfoCircle /> Basic Information
                        </h4>
                        <button
                          onClick={() => setActiveTab(activeLocation.type === 'store' ? 'store-info' : 'shop-info')}
                          className={styles.editButton}
                        >
                          <FaEdit /> Edit
                        </button>
                      </div>
                      <div className={styles.overviewDetails}>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Name:</span>
                          <span className={styles.detailValue}>{activeLocation.name}</span>
                        </div>
                        {activeLocation.type === 'shop' && (
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Description:</span>
                            <span className={styles.detailValue}>{activeLocation.description || 'Not set'}</span>
                          </div>
                        )}
                        {activeLocation.type === 'store' && (
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>GST Number:</span>
                            <span className={styles.detailValue}>{activeLocation.gstNumber || 'Not set'}</span>
                          </div>
                        )}
                        {activeLocation.type === 'shop' && (
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Shop Type:</span>
                            <span className={styles.detailValue}>
                              {SHOP_TYPES.find(t => t.id === activeLocation.shopType)?.name || 'Not set'}
                            </span>
                          </div>
                        )}
                        {activeLocation.type === 'shop' && activeLocation.openingDate && (
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Opening Date:</span>
                            <span className={styles.detailValue}>
                              {new Date(activeLocation.openingDate).toLocaleDateString()}
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
                        <button
                          onClick={() => setActiveTab('location')}
                          className={styles.editButton}
                        >
                          <FaEdit /> Edit
                        </button>
                      </div>
                      <div className={styles.overviewDetails}>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Address:</span>
                          <span className={styles.detailValue}>{activeLocation.location?.address || 'Not set'}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.overviewCard}>
                      <div className={styles.overviewCardHeader}>
                        <h4 className={styles.overviewCardTitle}>
                          <FaPhone /> Contact
                        </h4>
                        <button
                          onClick={() => setActiveTab('contact')}
                          className={styles.editButton}
                        >
                          <FaEdit /> Edit
                        </button>
                      </div>
                      <div className={styles.overviewDetails}>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>
                            {activeLocation.type === 'store' ? 'Contact Person:' : 'Incharge:'}
                          </span>
                          <span className={styles.detailValue}>
                            {activeLocation.type === 'store'
                              ? activeLocation.contactPerson || 'Not set'
                              : activeLocation.inchargeName || 'Not set'
                            }
                          </span>
                        </div>
                        {activeLocation.type === 'shop' && <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Phone:</span>
                          <span className={styles.detailValue}>{activeLocation.phone || 'Not set'}</span>
                        </div>}
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Email:</span>
                          <span className={styles.detailValue}>{activeLocation.email || 'Not set'}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.overviewCard}>
                      <div className={styles.overviewCardHeader}>
                        <h4 className={styles.overviewCardTitle}>
                          <FaClock /> Operating Hours
                        </h4>
                        <button
                          onClick={() => setActiveTab('hours')}
                          className={styles.editButton}
                        >
                          <FaEdit /> Edit
                        </button>
                      </div>
                      <div className={styles.hoursOverview}>
                        {DAYS.map((day) => {
                          const dayHours = activeLocation.active_time[day.id];
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
                        <button
                          onClick={() => setActiveTab('urls')}
                          className={styles.editButton}
                        >
                          <FaEdit /> Edit
                        </button>
                      </div>
                      <div className={styles.urlsOverview}>
                        {activeLocation.external_url ? activeLocation.external_url.filter(url => url.url).length > 0 ? (
                          activeLocation.external_url
                            .filter(url => url.url)
                            .map((url, index) => (
                              <div key={url.id} className={styles.urlOverviewItem}>
                                <div className={styles.urlHeading}>{url.title || 'Link'}</div>
                                <div className={styles.urlValue}>
                                  <a href={url.url} target="_blank" rel="noopener noreferrer">
                                    {url.url.substring(0, 40)}...
                                  </a>
                                </div>
                              </div>
                            ))
                        ) : (
                          <div className={styles.noUrls}>No external links added</div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'store-info' && activeLocation?.type === 'store' && (
                <div className={styles.tabSection}>
                  <h3 className={styles.sectionTitle}>Store Information</h3>
                  <p className={styles.sectionSubtitle}>Store is your main business location (mandatory)</p>

                  <div className={styles.formSection}>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                          Store Name *
                          {formErrors.name && (
                            <span className={styles.errorText}> - {formErrors.name}</span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={activeLocation.name}
                          onChange={(e) => updateLocation('name', e.target.value)}
                          className={`${styles.formInput} ${formErrors.name ? styles.inputError : ''}`}
                          placeholder="Enter store name"
                        />
                        <div className={styles.formHelp}>This is your main business location name</div>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Contact Person *</label>
                        <input
                          type="text"
                          value={activeLocation.contactPerson}
                          onChange={(e) => updateLocation('contactPerson', e.target.value)}
                          className={styles.formInput}
                          placeholder="Store manager/owner name"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>GST Number</label>
                        <input
                          type="text"
                          value={activeLocation.gstNumber}
                          onChange={(e) => updateLocation('gstNumber', e.target.value)}
                          className={styles.formInput}
                          placeholder="GSTINXXXXXXXXXX"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>License Number</label>
                        <input
                          type="text"
                          value={activeLocation.licenseNumber}
                          onChange={(e) => updateLocation('licenseNumber', e.target.value)}
                          className={styles.formInput}
                          placeholder="Business license number"
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Additional Description</label>
                      <textarea
                        value={activeLocation.desc}
                        onChange={(e) => updateLocation('desc', e.target.value)}
                        rows="3"
                        className={styles.formTextarea}
                        placeholder="Any additional information about your store..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'shop-info' && activeLocation?.type === 'shop' && (
                <div className={styles.tabSection}>
                  <h3 className={styles.sectionTitle}>Shop Information</h3>
                  <p className={styles.sectionSubtitle}>Shops are additional selling points (optional)</p>

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
                          value={activeLocation.name}
                          onChange={(e) => updateLocation('name', e.target.value)}
                          className={`${styles.formInput} ${formErrors.name ? styles.inputError : ''}`}
                          placeholder="Enter shop name"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Description</label>
                        <textarea
                          value={activeLocation.description}
                          onChange={(e) => updateLocation('description', e.target.value)}
                          rows="2"
                          className={styles.formTextarea}
                          placeholder="Describe your shop"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Incharge Name *</label>
                        <input
                          type="text"
                          value={activeLocation.inchargeName}
                          onChange={(e) => updateLocation('inchargeName', e.target.value)}
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
                              className={`${styles.shopTypeOption} ${activeLocation.shopType === shopType.id ? styles.shopTypeSelected : ''}`}
                            >
                              <input
                                type="radio"
                                name="shopType"
                                value={shopType.id}
                                checked={activeLocation.shopType === shopType.id}
                                onChange={(e) => updateLocation('shopType', e.target.value)}
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
                          value={activeLocation.areaSqft}
                          onChange={(e) => updateLocation('areaSqft', e.target.value)}
                          className={styles.formInput}
                          placeholder="e.g., 1200"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Opening Date</label>
                        <input
                          type="date"
                          value={activeLocation.openingDate}
                          onChange={(e) => updateLocation('openingDate', e.target.value)}
                          className={styles.formInput}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Rent Amount (Monthly)</label>
                        <input
                          type="text"
                          value={activeLocation.rentAmount}
                          onChange={(e) => updateLocation('rentAmount', e.target.value)}
                          className={styles.formInput}
                          placeholder="e.g., 50000"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Lease End Date</label>
                        <input
                          type="date"
                          value={activeLocation.leaseEndDate}
                          onChange={(e) => updateLocation('leaseEndDate', e.target.value)}
                          className={styles.formInput}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'contact' && activeLocation && (
                <div className={styles.tabSection}>
                  <h3 className={styles.sectionTitle}>Contact Information</h3>

                  <div className={styles.formGrid}>
                    {activeLocation.type === 'store' ? (
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Contact Person *</label>
                        <input
                          type="text"
                          value={activeLocation.contactPerson}
                          onChange={(e) => updateLocation('contactPerson', e.target.value)}
                          className={styles.formInput}
                          placeholder="Store manager/owner name"
                        />
                      </div>
                    ) : (
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Incharge Name *</label>
                        <input
                          type="text"
                          value={activeLocation.inchargeName}
                          onChange={(e) => updateLocation('inchargeName', e.target.value)}
                          className={styles.formInput}
                          placeholder="Shop incharge/manager name"
                        />
                      </div>
                    )}

                    {activeLocation.type === 'shop' && <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <FaPhone /> Phone Number *
                        {formErrors.phone && (
                          <span className={styles.errorText}> - {formErrors.phone}</span>
                        )}
                      </label>
                      <input
                        type="tel"
                        value={activeLocation.phone}
                        onChange={(e) => updateLocation('phone', e.target.value)}
                        className={`${styles.formInput} ${formErrors.phone ? styles.inputError : ''}`}
                        placeholder="+1 (123) 456-7890"
                      />
                    </div>}

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <MdEmail /> Email Address
                        {formErrors.email && (
                          <span className={styles.errorText}> - {formErrors.email}</span>
                        )}
                      </label>
                      <input
                        type="email"
                        value={activeLocation.email}
                        onChange={(e) => updateLocation('email', e.target.value)}
                        className={`${styles.formInput} ${formErrors.email ? styles.inputError : ''}`}
                        placeholder="contact@example.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'location' && activeLocation && (
                <div className={styles.tabSection}>
                  <h3 className={styles.sectionTitle}>
                    {activeLocation.type === 'store' ? 'Store Location' : 'Shop Location'}
                  </h3>

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
                        value={activeLocation.location?.address || ""}
                        onChange={(e) => updateLocation('location.address', e.target.value)}
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
                        value={activeLocation.location?.url || ""}
                        onChange={(e) => updateLocation('location.url', e.target.value)}
                        className={styles.formInput}
                        placeholder="https://maps.uniyel.com/?q=..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'hours' && activeLocation && (
                <div className={styles.tabSection}>
                  <h3 className={styles.sectionTitle}>Operating Hours</h3>

                  <div className={styles.hoursSection}>

                    <div className={styles.hoursGrid}>
                      {DAYS.map((day) => {
                        const dayHours = activeLocation.active_time[day.id];
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

              {activeTab === 'urls' && activeLocation && (
                <div className={styles.tabSection}>
                  <h3 className={styles.sectionTitle}>External URLs</h3>
                  <p className={styles.sectionSubtitle}>Add links to your website, catalogs, or other resources</p>

                  <div className={styles.urlsSection}>
                    <div className={styles.urlsList}>
                      {activeLocation.external_url ? activeLocation.external_url.map((url, index) => (
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
                                  {URL_HEADINGS.map(title => (
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
                      )) : null}
                    </div>

                    <button
                      onClick={addExternalUrl}
                      className={styles.addUrlButton}
                      disabled={activeLocation.external_url?.length >= 5}
                    >
                      <FaPlus /> Add Another URL
                    </button>

                    <div className={styles.urlsNote}>
                      <MdInfo />
                      <p>
                        Add up to 5 external links. Use titles like "Website", "Product Catalog", "Brochure", etc.
                        Customers will see these links on your {activeLocation.type === 'store' ? 'store' : 'shop'} page.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'images' && activeLocation?.type === 'store' && (
                <div className={styles.tabSection}>
                  <h3 className={styles.sectionTitle}>Store Images</h3>
                  <p className={styles.sectionSubtitle}>Add images for your store (not available for shops)</p>

                  <div className={styles.imagesSection}>
                    <div className={styles.uploadSections}>
                      <div className={styles.uploadSection}>
                        <h4 className={styles.uploadSectionTitle}>Store Banner (4:1 ratio)</h4>
                        <div className={styles.uploadDescription}>
                          Recommended size: 1600×400px. This appears at the top of your store page.
                        </div>
                        <div
                          {...getBannerRootProps()}
                          className={styles.bannerUploadArea}
                        >
                          <input {...getBannerInputProps()} />
                          <div className={styles.uploadContent}>
                            {activeLocation.banner ? (
                              <>
                                <img
                                  src={activeLocation.banner}
                                  alt="Store banner"
                                  className={styles.bannerPreview}
                                />
                                <div className={styles.uploadOverlayText}>
                                  <FaCamera />
                                  <span>Change Banner</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <FaUpload />
                                <p className={styles.uploadTitle}>Upload Store Banner</p>
                                <p className={styles.uploadInfo}>
                                  Drag & drop or click to browse
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                        {isBase64Image(activeLocation.banner) && (
                          <div className={styles.unsavedImageWarning}>
                            <FaImages />
                            <span>Banner not saved - will be uploaded when you save</span>
                          </div>
                        )}
                      </div>

                      <div className={styles.uploadSection}>
                        <h4 className={styles.uploadSectionTitle}>Store Logo (1:1 ratio)</h4>
                        <div className={styles.uploadDescription}>
                          Recommended size: 400×400px. This appears in search results and your store profile.
                        </div>
                        <div
                          {...getLogoRootProps()}
                          className={styles.logoUploadArea}
                        >
                          <input {...getLogoInputProps()} />
                          <div className={styles.uploadContent}>
                            {activeLocation.img ? (
                              <>
                                <img
                                  src={activeLocation.img}
                                  alt="Store image"
                                  className={styles.logoPreview}
                                />
                                <div className={styles.uploadOverlayText}>
                                  <FaCamera />
                                  <span>Change Logo</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <FaUpload />
                                <p className={styles.uploadTitle}>Upload Store Logo</p>
                                <p className={styles.uploadInfo}>
                                  Drag & drop or click to browse
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                        {isBase64Image(activeLocation.img) && (
                          <div className={styles.unsavedImageWarning}>
                            <FaImages />
                            <span>Logo not saved - will be uploaded when you save</span>
                          </div>
                        )}
                      </div>
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