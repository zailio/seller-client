import { useEffect, useState } from 'react';
import {
  FaCalendar,
  FaUserCircle,
  FaLock,
  FaCog,
  FaBell,
  FaCreditCard,
  FaShieldAlt,
  FaCheckCircle,
  FaUserPlus,
  FaHeart,
  FaComment,
  FaShoppingBag,
  FaTruck,
  FaTag,
  FaTimes
} from 'react-icons/fa';
import { FiUsers } from "react-icons/fi";
import { IoCopyOutline } from "react-icons/io5";
import { CiRead } from "react-icons/ci";
import { ImSpinner2 } from 'react-icons/im';
import { MdOutlineNotInterested } from "react-icons/md";
import ShadeLoading from '../../../components/shade_loading';
import styles from './css/sellerPofile.module.css';
import config from '../../../utils/config';

const notificationTypes = ['All', 'order', 'shipping', 'promo', 'follower', 'like', 'comment', 'security'];


const SellerProfile = ({
  auth,
  session,
  addNotification,
  genAlert,
  formData,
  setFormData,

}) => {
  const [load, setLoad] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [dom, setDom] = useState(0);
  const [domain, setDomain] = useState(false);

  //account status - private - public
  const [accountVisibility, setAccountVisibility] = useState('publicAccount');
  const [backup, setBackup] = useState(null);
  // Notification state
  const [notificationSettings, setNotificationSettings] = useState({
    allEnabled: true,
    categories: {
      social: { enabled: true, expanded: true },
      orders: { enabled: true, expanded: true },
      promotions: { enabled: false, expanded: true },
      security: { enabled: true, expanded: true }
    },
    notifications: [
      { id: 1, type: 'follower', message: '@john_doe started following you', time: '2 hours ago', read: false },
      { id: 2, type: 'like', message: '@sara_smith liked your product', time: '5 hours ago', read: false },
      { id: 3, type: 'comment', message: '@alex_jones: "Great product!"', time: '1 day ago', read: true },
      { id: 4, type: 'order', message: 'New order received #12345', time: '3 hours ago', read: false },
      { id: 5, type: 'shipping', message: 'Order #12345 has been shipped', time: '1 day ago', read: true },
      { id: 6, type: 'promo', message: 'Special discount: 20% off all products', time: '2 days ago', read: true },
      { id: 7, type: 'security', message: 'New login detected from Chrome, Windows', time: '5 minutes ago', read: false }
    ]
  });
  const [selectedNotif, setSelectedNotif] = useState(0);
  // Notification handlers
  const toggleAllNotifications = () => {
    const newState = !notificationSettings.allEnabled;
    setNotificationSettings(prev => ({
      ...prev,
      allEnabled: newState,
      categories: {
        social: { ...prev.categories.social, enabled: newState },
        orders: { ...prev.categories.orders, enabled: newState },
        promotions: { ...prev.categories.promotions, enabled: newState },
        security: { ...prev.categories.security, enabled: newState }
      }
    }));
  };

  const dismissNotification = (id) => {
    setNotificationSettings(prev => ({
      ...prev,
      notifications: prev.notifications.filter(notification => notification.id !== id)
    }));
  };

  const markAsRead = (id) => {
    setNotificationSettings(prev => ({
      ...prev,
      notifications: prev.notifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    }));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'follower': return <FaUserPlus />;
      case 'like': return <FaHeart />;
      case 'comment': return <FaComment />;
      case 'order': return <FaShoppingBag />;
      case 'shipping': return <FaTruck />;
      case 'promo': return <FaTag />;
      case 'security': return <FaShieldAlt />;
    }
  };

  const getCategoryNotifications = (category) => {
    const typeMap = {
      social: ['follower', 'like', 'comment'],
      orders: ['order', 'shipping'],
      promotions: ['promo'],
      security: ['security']
    };
    return notificationSettings.notifications.filter(notification =>
      typeMap[category].includes(notification.type)
    );
  };

  // Existing useEffect and other functions remain the same
  useEffect(() => {
    if (!load) return;
    async function serverData() {
      try {
        const res = await fetch(config.SERVER_URL + '/seller/get-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth}`
          },
          body: JSON.stringify({
            session_id: session
          }),
        });
        if (!res.ok) {
          throw new Error(`Error: ${res.statusText}`);
        };
        const result = await res.json();
        if (result.data.status) {
          setDomain(result.data.sub_dom);
          setFormData(result.data.data);
          setAccountVisibility(result.data.account_isibility);
        } else throw Error('error');
      } catch (e) {
        console.log(e);
      } finally {
        setLoad(false);
      }
    };
    serverData();
  }, []);

  useEffect(() => {
    if (!domain) return;
    if (load) return;
    if (dom) setDom(0);
    const timer = setTimeout(async () => {
      if (domain.trim() !== '') {
        setDom(102);
        try {
          const response = await fetch(config.SERVER_URL + '/seller/check-domain', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth}`
            },
            body: JSON.stringify({
              session_id: session,
              dom: domain
            }),
          });
          if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
          };
          const resp = await response.json();
          setDom(resp.data.statusCode)
          if (resp.data.status) setFormData(prev => ({ ...prev, sub_dom: domain }));
        } catch (e) {
          console.log(e);
        };
      };
    }, 1500);

    return () => clearTimeout(timer);
  }, [domain]);

  const save = async (e) => {
    e.preventDefault();
    setLoad(true);
    try {
      const response = await fetch(config.SERVER_URL + '/seller/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth}`
        },
        body: JSON.stringify({
          session_id: session,
          data: formData
        }),
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      };
      const resp = await response.json();
    } catch (e) {
      console.log(e);
    } finally {
      setLoad(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImage = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.match('image.*')) {
      addNotification({
        h2: 'only Image',
        desc: 'Please select a valid image file (JPEG, PNG, etc.)'
      });
      return;
    };
    const maxSize = 3 * 1024 * 1024;
    if (file.size > maxSize) {
      addNotification({
        h2: 'Max Size',
        desc: 'Image size must be less than 5MB'
      });
      return;
    };
    setLoad(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await fetch(`${config.SERVER_URL}/api/get_url`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth}`
        },
        body: data
      });
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      };
      const resp = await response.json();
      setFormData(prev => ({
        ...prev,
        icon: resp.url
      }));
    } catch (e) {
      console.log(e);
    } finally {
      setLoad(false);
    }
  };

  const goseToMyPgae = () => {
    if (!domain) {
      addNotification({
        h2: 'add subdomain',
        desc: 'Please add a subdomain and save befor load your page'
      });
    } else {
      const currentHost = window.location.hostname; // e.g., 'example.com'
      const domainParts = currentHost.split('.');
      const baseDomain = domainParts.length > 2
        ? domainParts.slice(-2).join('.')
        : currentHost;
      const url = `https://${formData.sub_dom}.${baseDomain}`;
      window.open(url, '_blank');
    };
  };

  const copyWebPage = async () => {
    if (!domain) {
      addNotification({
        h2: 'add subdomain',
        desc: 'Please add a subdomain and save befor Copy your page'
      });
    } else {
      const currentHost = window.location.hostname; // e.g., 'example.com'
      const domainParts = currentHost.split('.');
      const baseDomain = domainParts.length > 2
        ? domainParts.slice(-2).join('.')
        : currentHost;
      const url = `https://${formData.sub_dom}.${baseDomain}`;
      try {
        await navigator.clipboard.writeText(url);
        addNotification({
          h2: 'Copy !',
          desc: 'Copied to clipboard!'
        });
      } catch (err) {
        addNotification({
          h2: 'Copy !',
          desc: 'Failed to copy'
        });
      }
    };
  };

  const handleConfirm = async () => {
    try {
      const res = await fetch(config.SERVER_URL + `/seller/change-account-type`, {
        method: 'POST',
        body: JSON.stringify({
          session_id: session,
          update: accountVisibility
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth}`,
        }
      });
      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      };
      const response = await res.json();
      if (!response.data.status) throw Error(`there was problem while like the product`);
      addNotification({
        h2: 'profile updated',
        desc: 'Your changes have been saved successfully'
      });
    } catch (e) {
      console.log(e);
      setAccountVisibility(backup);
      addNotification({
        h2: 'Error occurred',
        desc: 'Failed to update profile. Please try again.',
      });
    }
  };

  const handleCancel = () => {
    console.log('Action cancelled');
    setAccountVisibility(backup);
  };

  const handleVisibilityChange = (e) => {
    setBackup(accountVisibility);
    setAccountVisibility(e.target.id);
    genAlert({
      title: `Change Account to ${accountVisibility === 'privateAccount' ? "Private" : 'Public'}?`,
      message: accountVisibility === 'privateAccount'
        ? ` By setting your account to private:
              <ul style={{ margin: '0.5rem 0 1rem 1rem', paddingLeft: '1rem' }}>
                <li>Only your approved followers will see your profile and products</li>
                <li>New visitors will need to request to follow you</li>
                <li>Your existing products won't appear in public searches</li>
              </ul>
              Are you sure you want to make this change?`
        : ` By setting your account to public:
              <ul style={{ margin: '0.5rem 0 1rem 1rem', paddingLeft: '1rem' }}>
                <li>Anyone can view your profile and products</li>
                <li>Your products will appear in public searches</li>
                <li>New visitors won't need approval to see your content</li>
              </ul>
              Are you sure you want to make this change?`,
      confirmText: `Yes, make ${accountVisibility === 'privateAccount' ? "Private" : 'Public'}?`,
      cancelText: `No, keep ${accountVisibility === 'privateAccount' ? 'Public' : "Private"}?`,
      onConfirm: handleConfirm,
      onClose: handleCancel,
      isHtml: true
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Selected visibility:', accountVisibility);
    // Here you would typically send the data to your API
  };
  return (
    <div className={styles.container}>
      {load && <ShadeLoading />}
      <div className={styles.profileHeader}>
        <div className={styles.headerContent}>
          <div className={styles.profileImageContainer}>
            <img
              src={formData.icon}
              alt="Profile"
              className={styles.profileImg}
            />
          </div>
          <div className={styles.profileInfo}>
            <h3>{formData.username}</h3>
            <span className={styles.span}><FaCalendar className={styles.icon} />joint at: {new Date(formData.createdAt).toLocaleDateString('en-US', config.time_and_date)}</span>
            <div className={styles.flex}>
              <button className={styles.viewMyPage} onClick={goseToMyPgae}>
                <CiRead size={20} />
                <span>View</span>
              </button>
              <IoCopyOutline size={27} onClick={copyWebPage} />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.contentWrapper}>
        {/* Left Navigation */}
        <div className={styles.sidebar}>
          <div className={styles.settingsCard}>
            <ul className={styles.navList}>
              <li>
                <button
                  className={`${styles.navLink} ${activeTab === 'profile' ? styles.active : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <FaUserCircle className={styles.icon} />Profile
                </button>
              </li>
              <li>
                <button
                  className={`${styles.navLink} ${activeTab === 'privacy' ? styles.active : ''}`}
                  onClick={() => setActiveTab('privacy')}
                >
                  <FaLock className={styles.icon} />Privacy
                </button>
              </li>
              <li>
                <button
                  className={`${styles.navLink} ${activeTab === 'account' ? styles.active : ''}`}
                  onClick={() => setActiveTab('account')}
                >
                  <FaCog className={styles.icon} />Account
                </button>
              </li>
              <li>
                <button
                  className={`${styles.navLink} ${activeTab === 'notifications' ? styles.active : ''}`}
                  onClick={() => setActiveTab('notifications')}
                >
                  <FaBell className={styles.icon} />Notifications
                </button>
              </li>
              <li>
                <button
                  className={`${styles.navLink} ${activeTab === 'payment' ? styles.active : ''}`}
                  onClick={() => setActiveTab('payment')}
                >
                  <FaCreditCard className={styles.icon} />Payment
                </button>
              </li>
              <li>
                <button
                  className={`${styles.navLink} ${activeTab === 'security' ? styles.active : ''}`}
                  onClick={() => setActiveTab('security')}
                >
                  <FaShieldAlt className={styles.icon} />Security
                </button>
              </li>
              <li>
                <button
                  className={`${styles.navLink} ${activeTab === 'followers' ? styles.active : ''}`}
                  onClick={() => setActiveTab('followers')}
                >
                  <FiUsers className={styles.icon} />followers
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Content */}
        <div className={styles.mainContent}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <h5><FaUserCircle className={styles.icon} />Profile Information</h5>
              </div>
              <div className={styles.cardBody}>
                <form onSubmit={save}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="username">Seller Name</label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="sub_dom">Sub Domain</label>
                      <div className={styles.twoContent}>
                        <input
                          type="text"
                          readOnly={dom === 102}
                          id="sub_dom"
                          name="sub_dom"
                          value={domain}
                          onChange={(e) => setDomain(e.target.value)}
                        />
                        {dom === 102 ? <ImSpinner2 size={25} className={styles.spinner} /> :
                          dom === 404 ?
                            <MdOutlineNotInterested
                              size={25}
                              style={{
                                color: 'rgb(255, 51, 51)'
                              }}
                              className={styles.vibrate} /> :
                            dom === 403 ? <FaLock
                              size={25}
                              style={{
                                color: 'red'
                              }}
                              className={styles.vibrate} /> :
                              dom === 200 ? <FaCheckCircle
                                size={25}
                                style={{
                                  color: 'rgb(19, 249, 96)'
                                }}
                                className={styles.success} /> :
                                null
                        }
                      </div>
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="number">Phone Number</label>
                      <input
                        type="number"
                        id="number"
                        name="number"
                        value={formData.number}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="email">Email Address</label>
                      <div className={styles.twoContent}>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="profilePhoto">Profile Photo</label>
                    <input type="file" id="profilePhoto" onChange={handleImage} />
                  </div>
                  <button type="submit" className={styles.primaryBtn} disabled={dom === 102}>Update Profile</button>
                </form>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <h5><FaLock className={styles.icon} />Privacy Settings</h5>
              </div>
              <div className={styles.cardBody}>
                <form onSubmit={handleSubmit}>
                  <div className={styles.section}>
                    <h6>Account Visibility</h6>
                    <div className={styles.radioGroup}>
                      <input
                        type="radio"
                        id="publicAccount"
                        name="accountVisibility"
                        checked={accountVisibility === 'publicAccount'}
                        onChange={handleVisibilityChange}
                      />
                      <label htmlFor="publicAccount">
                        Public Account - Anyone can view your profile and products
                      </label>
                    </div>
                    <div className={styles.radioGroup}>
                      <input
                        type="radio"
                        id="privateAccount"
                        name="accountVisibility"
                        checked={accountVisibility === 'privateAccount'}
                        onChange={handleVisibilityChange}
                      />
                      <label htmlFor="privateAccount">
                        Private Account - Only approved followers can view your profile and products
                      </label>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className={styles.settingsCard}>
              <div className={styles.cardHeader}>
                <h5><FaBell className={styles.icon} />Notification Settings</h5>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={notificationSettings.allEnabled}
                    onChange={toggleAllNotifications}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.selection}>
                  {notificationTypes.map((value, index) => (
                    <span
                      key={`notif-${index}`}
                      className={selectedNotif === index ? styles.active : ''}
                      onClick={() => setSelectedNotif(index)}
                    >
                      {value}
                    </span>
                  ))}
                </div>
                <div className={styles.notifications}>
                  {Object.entries(notificationSettings.categories).map(([category, { enabled, expanded }]) => (
                    <div key={category} className={styles.notificationCategory}>
                      {expanded && (
                        <div className={styles.notificationList}>
                          {getCategoryNotifications(category).length > 0 ? (
                            getCategoryNotifications(category).map(notification => (
                              <div
                                key={notification.id}
                                className={`${styles.notificationItem} ${notification.read ? styles.read : ''}`}
                                data-type={notification.type}
                                onClick={() => markAsRead(notification.id)}
                              >
                                <div className={styles.notificationIconContainer}>
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className={styles.notificationContent}>
                                  <p>{notification.message}</p>
                                  <span className={styles.notificationTime}>{notification.time}</span>
                                </div>
                                <button
                                  className={styles.notificationClose}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismissNotification(notification.id);
                                  }}
                                >
                                  <FaTimes />
                                </button>
                              </div>
                            ))
                          ) : (
                            <p style={{ color: '#6c757d', fontStyle: 'italic', margin: '1rem 0' }}>
                              No {category} notifications
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Reusable ToggleSwitch component
const ToggleSwitch = ({ label, description, defaultChecked = false }) => {
  return (
    <div className={styles.toggleSwitchContainer}>
      <div>
        <label className={styles.toggleLabel}>{label}</label>
        <p className={styles.toggleDescription}>{description}</p>
      </div>
      <label className={styles.switch}>
        <input type="checkbox" defaultChecked={defaultChecked} />
        <span className={styles.slider}></span>
      </label>
    </div>
  );
};

export default SellerProfile;