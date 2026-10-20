'use client';

import { createContext, useState, useContext, useEffect, useCallback } from 'react';
// Create the context
const SharedDataContext = createContext();

// Create the provider
export const SharedDataProvider = ({ children }) => {
  const [device, setDevice] = useState('web');
  const [currentAlert, genAlert] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [topLineLoad, setTopLineLoad] = useState(false);

  const [loginInfo, setloginInfo] = useState({
    status: false,
    message: '',
    type: null,
  });
  const [currentRoom, setCurrentRoom] = useState(false);

  const addNotification = useCallback((data) => {
    const notif = [...notifications];
    const newNotification = {
      id: Date.now(),
      ...data,
    };
    const index = notif.findIndex(n => n.tag === newNotification.tag);
    if (index !== -1) {
      notif[index] = newNotification;
    } else {
      notif.push(newNotification);
    }
    setNotifications(notif);
  }, [notifications]);

  useEffect(() => {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('div-ref__c='));

    if (cookie) {
      setDevice(cookie.split('=')[1]);
    }
  }, []);


  return (
    <SharedDataContext.Provider value={{
      device,
      loginInfo,
      setloginInfo,
      notifications,
      setNotifications,
      addNotification,
      currentRoom,
      setCurrentRoom,
      currentAlert,
      genAlert,
      topLineLoad,
      setTopLineLoad
    }}>
      {children}
    </SharedDataContext.Provider>
  );
};
export const useStore = () => useContext(SharedDataContext)