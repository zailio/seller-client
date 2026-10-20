import { useState, useEffect, useRef } from 'react';
import styles from './css/deliveryWarehouse.module.css';
import { ImSpinner2 } from 'react-icons/im';
import { CiEdit } from "react-icons/ci";
import {
  FaShippingFast, FaExternalLinkAlt, FaWarehouse,
  FaTags, FaWallet, FaHistory, FaRupeeSign, FaImage,
  FaTimes, FaCheck, FaSearchMinus, FaSearchPlus,
  FaSave, FaCrop, FaRedo, FaUndo,
  FaClock
} from 'react-icons/fa';
import config from '../../../utils/config';
import 'cropperjs/dist/cropper.css';

const DeliveryWarehousePage = ({
  auth,
  session,
  addNotification,
  warehouse,
  setWareHouse
}) => {
  const [activeTab, setActiveTab] = useState('warehouses');
  const [sellerLogo, setSellerLogo] = useState(null);
  const [tempImg, setTempImg] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef(null);
  const cropperRef = useRef(null);
  const previewRef = useRef(null);
  const [isSavingLogo, setIsSavingLogo] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [subm, setSubm] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [walletBalance, setWalletBalance] = useState(2450.00);
  const [transactions, setTransactions] = useState([
    { id: 1, date: '2025-11-01', time: '10:30 AM', desc: 'Wallet Recharge', type: 'credit', amount: 5000 },
    { id: 2, date: '2025-11-02', time: '02:45 PM', desc: 'Shipping Label #AWB123456', type: 'debit', amount: 120 },
    { id: 3, date: '2025-11-03', time: '11:20 AM', desc: 'Shipping Label #AWB987654', type: 'debit', amount: 240 },
    { id: 4, date: '2025-11-05', time: '09:15 AM', desc: 'Refund for Order #9988', type: 'credit', amount: 120 },
  ]);

  // Days of week for pickup
  const daysOfWeek = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
  ];

  // Time options for pickup (hour:minute AM/PM)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        const displayMinute = minute.toString().padStart(2, '0');
        const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const display = `${displayHour}:${displayMinute} ${period}`;
        options.push({ value, display });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const [formData, setFormData] = useState({
    name: '',
    registered_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    pin: '',
    country: 'India',
    return_address: '',
    return_city: '',
    return_pin: '',
    return_state: '',
    return_country: 'India',
    // Pickup settings
    pickup_days: [], // Array of selected days
    pickup_time: '09:00',
  });

  // Helper function to format time for display
  const formatTimeForDisplay = (timeValue) => {
    if (!timeValue) return '';
    const [hour, minute] = timeValue.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  // Helper function to get day abbreviations
  const getDayAbbreviation = (day) => {
    const abbreviations = {
      'Monday': 'Mon',
      'Tuesday': 'Tue',
      'Wednesday': 'Wed',
      'Thursday': 'Thu',
      'Friday': 'Fri',
      'Saturday': 'Sat',
      'Sunday': 'Sun'
    };
    return abbreviations[day] || day.substring(0, 3);
  };

  // Initialize cropper when image is loaded
  useEffect(() => {
    if (showCropper && tempImg) {
      const image = document.getElementById('cropper-image');
      if (image && !cropperRef.current) {
        cropperRef.current = new window.Cropper(image, {
          aspectRatio: 2,
          viewMode: 1,
          preview: previewRef.current,
          zoomable: true,
          scalable: true,
          autoCropArea: 0.8,
          guides: true,
          center: true,
          highlight: false,
          cropBoxMovable: true,
          cropBoxResizable: true,
          zoomOnWheel: true,
          ready() {
            console.log('Cropper initialized');
          },
          crop(event) {
            setZoomLevel(event.detail.scaleX || 1);
          }
        });
      }
    }

    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
    };
  }, [showCropper, tempImg]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'pickup_days') {
      // Handle day checkbox
      setFormData(prev => {
        // Ensure currentDays is always an array
        const currentDays = Array.isArray(prev.pickup_days) ? [...prev.pickup_days] : [];

        if (checked) {
          // Add day if checked and not already included
          if (!currentDays.includes(value)) {
            return { ...prev, pickup_days: [...currentDays, value] };
          }
        } else {
          // Remove day if unchecked
          return { ...prev, pickup_days: currentDays.filter(day => day !== value) };
        }
        return prev;
      });
    } else if (type === 'checkbox') {
      // Handle other checkboxes
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      // Handle regular inputs
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setTempImg(reader.result);
        setShowCropper(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCrop = async () => {
    if (cropperRef.current) {
      try {
        const canvas = cropperRef.current.getCroppedCanvas({
          width: 200,
          height: 100,
          fillColor: '#fff',
          imageSmoothingEnabled: true,
          imageSmoothingQuality: 'high',
        });

        if (canvas) {
          const croppedImage = canvas.toDataURL('image/jpeg', 0.92);
          setSellerLogo(croppedImage);
          setShowCropper(false);
          setTempImg(null);
          if (fileInputRef.current) fileInputRef.current.value = '';

          if (cropperRef.current) {
            cropperRef.current.destroy();
            cropperRef.current = null;
          }

          addNotification({ h2: "Success", desc: "Logo cropped successfully. Click Save to apply." });
        }
      } catch (e) {
        console.error(e);
        addNotification({ h2: "Error", desc: "Failed to crop image" });
      }
    }
  };

  const handleZoomIn = () => {
    if (cropperRef.current) {
      cropperRef.current.zoom(0.1);
    }
  };

  const handleZoomOut = () => {
    if (cropperRef.current) {
      cropperRef.current.zoom(-0.1);
    }
  };

  const handleRotateLeft = () => {
    if (cropperRef.current) {
      cropperRef.current.rotate(-90);
    }
  };

  const handleRotateRight = () => {
    if (cropperRef.current) {
      cropperRef.current.rotate(90);
    }
  };

  const handleReset = () => {
    if (cropperRef.current) {
      cropperRef.current.reset();
    }
  };

  const handleSaveBranding = async () => {
    if (!sellerLogo) {
      addNotification({ h2: "Info", desc: "No logo selected to save." });
      return;
    }
    setIsSavingLogo(true);
    setTimeout(() => {
      setIsSavingLogo(false);
      addNotification({ h2: "Saved", desc: "Branding settings saved successfully." });
    }, 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubm(true);

    // Validate pickup days - ensure it's an array and has items
    const pickupDays = Array.isArray(formData.pickup_days) ? formData.pickup_days : [];
    if (pickupDays.length === 0) {
      addNotification({ h2: "Error", desc: "Please select at least one pickup day" });
      setSubm(false);
      return;
    }

    const submissionData = {
      ...formData,
      pickup_days: pickupDays, // Ensure it's an array
      pickup_time_display: formatTimeForDisplay(formData.pickup_time),
      pickup_days_abbr: pickupDays.map(day => getDayAbbreviation(day)).join(', ')
    };

    try {
      const res = await fetch(config.SERVER_URL + `/seller/${editingWarehouse ? 'update-ware-house' : 'add-ware-houses'}`, {
        method: 'POST',
        body: JSON.stringify({
          session_id: session,
          data: submissionData
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth}`,
        }
      });

      if (!res.ok) throw new Error(`Error: ${res.statusText}`);

      const result = await res.json();
      if (result.data.status) {
        if (editingWarehouse) {
          setWareHouse(warehouse.map(w =>
            w.id === editingWarehouse.id ? { ...editingWarehouse, ...submissionData } : w
          ));
          addNotification({
            h2: "Updated",
            desc: `Warehouse updated successfully`
          });
        } else {
          const newWarehouse = {
            id: Date.now(),
            ...submissionData,
            created_at: new Date().toLocaleString()
          };
          setWareHouse([...warehouse, newWarehouse]);
          addNotification({
            h2: "Created",
            desc: `Warehouse added successfully`
          });
        }
      } else throw new Error(`Error`);
    } catch (_) {
      addNotification({ h2: "Error", desc: "Warehouse adding not completed" });
    } finally {
      setSubm(false);
      resetForm();
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentAmount || paymentAmount <= 0) return;
    setIsProcessingPayment(true);
    setTimeout(() => {
      const amount = parseFloat(paymentAmount);
      setWalletBalance(prev => prev + amount);
      setTransactions([
        {
          id: Date.now(),
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          desc: 'Wallet Recharge',
          type: 'credit',
          amount: amount
        },
        ...transactions
      ]);
      setIsProcessingPayment(false);
      setShowPaymentModal(false);
      setPaymentAmount('');
      addNotification({
        h2: "Success",
        desc: `Successfully added ₹${amount} to your wallet`
      });
    }, 1500);
  };

  const resetForm = () => {
    setFormData({
      name: '', registered_name: '', phone: '', email: '', address: '',
      city: '', pin: '', country: 'India', return_address: '', return_city: '',
      return_pin: '', return_state: '', return_country: 'India',
      pickup_days: [], pickup_time: '09:00',
    });
    setShowCreateForm(false);
    setEditingWarehouse(null);
  };

  const editWarehouse = (warehouse) => {
    setFormData({
      name: warehouse.name || '',
      registered_name: warehouse.registered_name || '',
      phone: warehouse.phone || '',
      email: warehouse.email || '',
      address: warehouse.address || '',
      city: warehouse.city || '',
      pin: warehouse.pin || '',
      country: warehouse.country || 'India',
      return_address: warehouse.return_address || '',
      return_city: warehouse.return_city || '',
      return_pin: warehouse.return_pin || '',
      return_state: warehouse.return_state || '',
      return_country: warehouse.return_country || 'India',
      // Pickup settings with defaults for old warehouses
      pickup_days: Array.isArray(warehouse.pickup_days) ? warehouse.pickup_days : [],
      pickup_time: warehouse.pickup_time || '09:00',
    });
    setEditingWarehouse(warehouse);
    setShowCreateForm(true);
  };

  const copyReturnAddress = () => {
    setFormData(prev => ({
      ...prev, return_address: prev.address, return_city: prev.city,
      return_pin: prev.pin, return_state: prev.city
    }));
  };

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      addNotification({ h2: "Error", desc: "Please enter your Delhivery API key" });
      return;
    }
    setIsConnecting(true);
    try {
      const res = await fetch(config.SERVER_URL + `/seller/connect-delhivery`, {
        method: 'POST',
        body: JSON.stringify({ session_id: session, api_key: apiKey }),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` }
      });
      if (!res.ok) throw new Error(`Error: ${res.statusText}`);
      const result = await res.json();
      if (result.data.status) {
        setWareHouse(result.data.data);
      } else throw new Error(result.data.message);
    } catch (e) {
      addNotification({ h2: "Error", desc: e.message });
    } finally {
      setIsConnecting(false);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const closeCropper = () => {
    setShowCropper(false);
    setTempImg(null);
    if (cropperRef.current) {
      cropperRef.current.destroy();
      cropperRef.current = null;
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showCreateForm) resetForm();
        if (showPaymentModal) setShowPaymentModal(false);
        if (showCropper) closeCropper();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showCreateForm, showPaymentModal, showCropper]);

  const renderWarehousesTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Warehouse Management</h2>
        <button className={styles.primaryBtn} onClick={() => setShowCreateForm(true)}>
          <span className={styles.btnIcon}>+</span> Add Warehouse
        </button>
      </div>

      <div className={styles.warehouseListContainer}>
        <div className={styles.warehouseGrid}>
          {warehouse.map(w => (
            <div key={w.id} className={styles.warehouseCard}>
              <div className={styles.warehouseHeader}>
                <h3 className={styles.warehouseName}>{w.name}</h3>
                <div className={styles.warehouseActions}>
                  <button className={styles.actionBtn} onClick={() => editWarehouse(w)} title="Edit Warehouse">
                    <CiEdit size={22} />
                  </button>
                </div>
              </div>

              {/* Pickup Schedule Display */}
              {Array.isArray(w.pickup_days) && w.pickup_days.length > 0 ? (
                <div className={styles.pickupSchedule}>
                  <div className={styles.pickupBadge}>
                    <FaClock className={styles.pickupIcon} />
                    <span className={styles.pickupDays}>
                      {w.pickup_days_abbr || w.pickup_days.map(day => getDayAbbreviation(day)).join(', ')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className={styles.pickupSchedule} style={{ background: '#fef9c3', borderLeftColor: '#ca8a04' }}>
                  <div className={styles.pickupBadge}>
                    <FaClock className={styles.pickupIcon} style={{ color: '#ca8a04' }} />
                    <span className={styles.pickupDays} style={{ color: '#854d0e' }}>
                      Pickup schedule not set
                    </span>
                  </div>
                  <div className={styles.pickupTime} style={{ color: '#854d0e' }}>
                    Click edit to configure pickup days and time
                  </div>
                </div>
              )}

              <div className={styles.warehouseDetails}>
                <p><strong>Phone:</strong> {w.phone}</p>
                <p><strong>Email:</strong> {w.email}</p>
                <p><strong>Address:</strong> {w.address}, {w.city} - {w.pin}</p>
                <p><strong>Return Address:</strong> {w.return_address}, {w.return_city} - {w.return_pin}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreateForm && (
        <div className={styles.modalOverlay} onClick={resetForm}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>{editingWarehouse ? 'Edit Warehouse' : 'Create New Warehouse'}</h3>
                <button className={styles.closeBtn} onClick={resetForm}>×</button>
              </div>

              {/* Pickup Schedule Section */}
              <div className={styles.pickupSection}>
                <h4 className={styles.sectionSubtitle}>Pickup Schedule</h4>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Pickup Days <span className={styles.required}>*</span></label>
                  <div className={styles.daysGrid}>
                    {daysOfWeek.map(day => (
                      <label key={day} className={styles.dayCheckbox}>
                        <input
                          type="checkbox"
                          name="pickup_days"
                          value={day}
                          checked={formData.pickup_days && Array.isArray(formData.pickup_days) ? formData.pickup_days.includes(day) : false}
                          onChange={handleInputChange}
                        />
                        <span className={styles.dayLabel}>{day.substring(0, 3)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Pickup Time</label>
                    <select
                      name="pickup_time"
                      value={formData.pickup_time}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      {timeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.display}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Warehouse Name <span className={styles.required}>*</span></label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={styles.input} required readOnly={!!editingWarehouse} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Registered Name<span className={styles.required}>*(optional)</span></label>
                    <input type="text" name="registered_name" value={formData.registered_name} onChange={handleInputChange} className={styles.input} />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Phone <span className={styles.required}>*</span></label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className={styles.input} required maxLength="10" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={styles.input} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Address</label>
                  <textarea name="address" value={formData.address} onChange={handleInputChange} className={styles.textarea} rows="3" />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>City</label>
                    <input type="text" name="city" value={formData.city} onChange={handleInputChange} className={styles.input} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Pincode <span className={styles.required}>*</span></label>
                    <input type="text" name="pin" value={formData.pin} onChange={handleInputChange} className={styles.input} required maxLength="6" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Country</label>
                    <select name="country" value={formData.country} onChange={handleInputChange} className={styles.select}><option value="India">India</option></select>
                  </div>
                </div>
                <div className={styles.sectionDivider}>
                  <h4 className={styles.sectionSubtitle}>Return Address</h4>
                  <button type="button" className={styles.copyBtn} onClick={copyReturnAddress}>Copy from above</button>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Return Address <span className={styles.required}>*</span></label>
                  <textarea name="return_address" value={formData.return_address} onChange={handleInputChange} className={styles.textarea} rows="3" required />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Return City</label>
                    <input type="text" name="return_city" value={formData.return_city} onChange={handleInputChange} className={styles.input} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Return Pincode</label>
                    <input type="text" name="return_pin" value={formData.return_pin} onChange={handleInputChange} className={styles.input} maxLength="6" />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Return State</label>
                    <input type="text" name="return_state" value={formData.return_state} onChange={handleInputChange} className={styles.input} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Return Country</label>
                    <select name="return_country" value={formData.return_country} onChange={handleInputChange} className={styles.select}>
                      <option value="India">India</option><option value="USA">USA</option><option value="UK">UK</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button type="button" className={styles.secondaryBtn} onClick={resetForm}>Cancel</button>
                  <button type="submit" className={styles.primaryBtn} disabled={subm}>
                    {subm ? <ImSpinner2 className={styles.spinner} /> : editingWarehouse ? 'Update Warehouse' : 'Create Warehouse'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderLabelsTab = () => (
    <div className={styles.tabContent} style={{ background: '#f8fafc' }}>
      <div className={styles.labelsContainer}>
        <div className={styles.brandingSection}>
          <div className={styles.brandingCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Branding Settings</h3>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Upload Brand Logo</label>
              <div
                className={styles.logoUploadArea}
                onClick={triggerFileInput}
              >
                {sellerLogo ? (
                  <img src={sellerLogo} alt="Seller Logo" className={styles.logoImage} />
                ) : (
                  <div className={styles.logoUploadPlaceholder}>
                    <FaImage className={styles.uploadIcon} />
                    <div className={styles.uploadText}>Click to upload<br />(2:1 Ratio recommended)</div>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleLogoSelect} accept="image/*" className={styles.fileInput} />

              {sellerLogo && (
                <div className={styles.logoActions}>
                  <button
                    className={styles.removeBtn}
                    onClick={() => { setSellerLogo(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className={styles.saveBranding}>
              <button
                className={styles.saveBtn}
                onClick={handleSaveBranding}
                disabled={isSavingLogo}
              >
                {isSavingLogo ? <ImSpinner2 className={styles.spinner} /> : <><FaSave /> Save Branding</>}
              </button>
            </div>
          </div>
        </div>

        <div className={styles.previewSection}>
          <div className={styles.previewLabel}>LIVE PREVIEW (A4)</div>
          <div className={styles.labelPreview}>
            <div className={styles.shippingLabel}>
              <div className={styles.labelHeader}>
                <h1>KreyaFit</h1>
              </div>

              <div className={styles.labelColumns}>
                <div className={styles.column}>
                  <div className={styles.labelSection}>
                    <div className={styles.sectionTitle}>Customer Information</div>
                    <div className={styles.address}>
                      <strong>Name:</strong> Name<br />
                      Sample Address [automatic]<br />
                      <strong>PIN:</strong> [Picode]
                    </div>
                  </div>
                </div>

                <div className={styles.column}>
                  <div className={styles.labelSection}>
                    <div className={styles.sectionTitle}>Payment Details</div>
                    <div className={styles.paymentDetails}>
                      <strong>Type:</strong> prepaid<br />
                      <strong>Paid:</strong> ₹249<br />
                      <strong>Saved:</strong> ₹-200<br />
                      <strong>Date:</strong> {new Date().toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${styles.labelSection} ${styles.sellerAddress}`}>
                <div className={styles.sectionTitle}>Seller Address:</div>
                <div className={styles.address}>
                  sample address , pincode: 673000, calicut, kerala
                </div>
              </div>

              <div className={styles.divider}></div>

              <div className={styles.labelSection}>
                <table className={styles.labelTable}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Discount</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Sealing Machine for Food Packaging</td>
                      <td>1</td>
                      <td>₹449</td>
                      <td>₹249</td>
                      <td>₹249</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className={styles.returnQrSection}>
                <div className={styles.returnAddress}>
                  <div className={styles.labelSection}>
                    <div className={styles.sectionTitle}>Return Address:</div>
                    <div className={styles.address}>
                      sample address , pincode: 673000, calicut, kerala
                    </div>
                  </div>

                  <div
                    className={styles.labelLogo}
                    onClick={triggerFileInput}
                  >
                    {sellerLogo ? (
                      <img src={sellerLogo} alt="Seller Logo" className={styles.logoImage} />
                    ) : (
                      <div className={styles.logoUploadText}>
                        Click to upload<br />Seller Logo
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.qrSection}>
                  <div className={styles.qrCode}>
                    [QR CODE]
                  </div>
                  <div className={styles.qrText}>
                    <strong>Scan & Review</strong><br />
                    Share your review by<br />
                    scanning this code
                  </div>
                </div>
              </div>

              <div className={styles.barcodeSection}>
                <div className={styles.barcode}>
                  [BARCODE IMAGE - 0000000000000]
                </div>
                <div className={styles.awbNumber}>
                  0 0 0 0 0 0 0 0 0 0 0 0 0<br />
                  AWB# 0000000000000
                </div>
                <div className={styles.thankYou}>
                  Thank you for shopping with us!
                </div>
              </div>

              <div className={styles.copyright}>
                &copy; 2025 KreyaFit Online. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentsTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Wallet & Payments</h2>
      </div>

      <div className={styles.walletCard}>
        <div className={styles.walletBalance}>
          <div>
            <div className={styles.balanceLabel}>Current Wallet Balance</div>
            <div className={styles.balanceAmount}>₹{walletBalance.toFixed(2)}</div>
          </div>
          <button
            className={styles.addMoneyBtn}
            onClick={() => setShowPaymentModal(true)}
          >
            <FaRupeeSign /> Add Money
          </button>
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <h3 className={styles.transactionsTitle}>
          <FaHistory /> Transaction History
        </h3>
      </div>

      <div className={styles.transactionsContainer}>
        <table className={styles.transactionsTable}>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Description</th>
              <th>Type</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>
                  {tx.date} {tx.time}
                </td>
                <td>{tx.desc}</td>
                <td>
                  <span className={`${styles.typeBadge} ${tx.type === 'credit' ? styles.credit : styles.debit}`}>
                    {tx.type === 'credit' ? 'Credited' : 'Deducted'}
                  </span>
                </td>
                <td className={`${styles.amount} ${tx.type === 'credit' ? styles.creditAmount : styles.debitAmount}`}>
                  {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPaymentModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Add Funds to Wallet</h3>
                <button
                  className={styles.closeBtn}
                  onClick={() => setShowPaymentModal(false)}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handlePaymentSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Enter Amount (₹)</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="e.g. 1000"
                    min="1"
                    required
                  />
                </div>
                <div className={styles.formActions}>
                  <button type="button" className={styles.secondaryBtn} onClick={() => setShowPaymentModal(false)}>Cancel</button>
                  <button type="submit" className={styles.primaryBtn} disabled={isProcessingPayment}>
                    {isProcessingPayment ? (
                      <>
                        <ImSpinner2 size={20} className={styles.spinner} /> Processing
                      </>
                    ) : 'Pay & Add Balance'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.container}>
      {Array.isArray(warehouse) ? (
        <div className={styles.wrapper}>
          <div className={styles.tabContainer}>
            <div className={styles.tabHeader}>
              <button
                className={`${styles.tabBtn} ${activeTab === 'warehouses' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('warehouses')}
              >
                <FaWarehouse className={styles.tabIcon} /> Warehouses
              </button>
              <button
                className={`${styles.tabBtn} ${activeTab === 'labels' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('labels')}
              >
                <FaTags className={styles.tabIcon} /> Labels & Branding
              </button>
              <button
                className={`${styles.tabBtn} ${activeTab === 'payments' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('payments')}
              >
                <FaWallet className={styles.tabIcon} /> Wallet
              </button>
            </div>

            {activeTab === 'warehouses' && renderWarehousesTab()}
            {activeTab === 'labels' && renderLabelsTab()}
            {activeTab === 'payments' && renderPaymentsTab()}
          </div>
        </div>
      ) : (
        <div className={styles.integrationContainer}>
          <div className={styles.integrationHeader}>
            <h1>
              <FaShippingFast className={styles.headerIcon} />
              <span>Connect Delhivery Account</span>
            </h1>
          </div>

          <div className={styles.integrationContent}>
            <div className={styles.formGroup}>
              <label htmlFor="api-key">Delhivery API Key</label>
              <input
                type="password"
                id="api-key"
                className={styles.apiInput}
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isConnecting}
              />
            </div>

            <button
              className={styles.connectBtn}
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Account'}
            </button>

            <a
              href="https://help.delhivery.com/docs/api-token-generation"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.tutorialLink}
            >
              <FaExternalLinkAlt className={styles.linkIcon} />
              How to get API Key - Tutorial
            </a>
          </div>
        </div>
      )}

      {showCropper && (
        <div className={styles.cropperModalOverlay}>
          <div className={styles.cropperModal}>
            <div className={styles.cropperModalContent}>
              <div className={styles.cropperHeader}>
                <h3>Adjust Logo (2:1 Ratio)</h3>
                <button className={styles.cropperCloseBtn} onClick={closeCropper}>×</button>
              </div>

              <div className={styles.cropperContainer}>
                <div className={styles.cropperMain}>
                  <img
                    id="cropper-image"
                    src={tempImg}
                    alt="Crop"
                    crossOrigin="anonymous"
                  />
                </div>

                <div className={styles.cropperSidebar}>
                  <div className={styles.previewBox}>
                    <h4>Preview</h4>
                    <div
                      ref={previewRef}
                      className={styles.preview}
                    />
                    <div className={styles.previewInfo}>
                      <div>Zoom: {Math.round(zoomLevel * 100)}%</div>
                      <div>Ratio: 2:1 (200×100px)</div>
                    </div>
                  </div>

                  <div className={styles.cropperControls}>
                    <div className={styles.zoomControls}>
                      <button onClick={handleZoomOut} className={styles.controlBtn}>
                        <FaSearchMinus />
                      </button>
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.1}
                        value={zoomLevel}
                        onChange={(e) => {
                          setZoomLevel(e.target.value);
                          if (cropperRef.current) {
                            cropperRef.current.zoomTo(parseFloat(e.target.value));
                          }
                        }}
                        className={styles.zoomSlider}
                      />
                      <button onClick={handleZoomIn} className={styles.controlBtn}>
                        <FaSearchPlus />
                      </button>
                    </div>

                    <div className={styles.actionControls}>
                      <button onClick={handleReset} className={styles.actionBtn}>
                        <FaUndo /> Reset
                      </button>
                      <button onClick={handleRotateLeft} className={styles.actionBtn}>
                        <FaRedo style={{ transform: 'scaleX(-1)' }} /> Rotate
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.cropperFooter}>
                <button onClick={closeCropper} className={styles.cancelBtn}>
                  <FaTimes /> Cancel
                </button>
                <button onClick={handleCrop} className={styles.applyBtn}>
                  <FaCheck /> Apply Crop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryWarehousePage;