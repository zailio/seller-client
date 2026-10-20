import { useEffect, useRef, useCallback } from 'react';
import Link from "next/link";
import styles from './css/messages.module.css';
import { useWebSocket } from '../context/ws';
import { useStore } from '../context/store';

const Notification = () => {
    const { socket } = useWebSocket();
    const { notifications, setNotifications, addNotification } = useStore();

    // Refs
    const notificationRefs = useRef({});
    const containerRef = useRef(null);
    const swipeData = useRef({});
    const isAnimating = useRef(false);

    useEffect(() => {
        if (!socket) return;
        const handleMessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.event === 'notification') addNotification(data.data);
        };

        socket.addEventListener('message', handleMessage);
        return () => {
            socket.removeEventListener('message', handleMessage);
        };
    }, [socket]);

    // Add new notification
    useEffect(() => {
        const div = document.querySelector(`.${styles.container}`);
        if (!div) return;
        div.scrollTo({ top: 0, behavior: "smooth" });
    }, [notifications]);

    // Remove notification
    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Auto-remove after 5 seconds
    useEffect(() => {
        const timers = notifications.map(notification => {
            const timeout = (notification.timeout === null || notification.timeout === undefined)
                ? 5000
                : notification.timeout;
            if (timeout) return setTimeout(() => {
                removeNotification(notification.id);
            }, timeout);
        });
        return () => timers.forEach(timer => clearTimeout(timer));
    }, [notifications, removeNotification]);

    // Update active notification on scroll
    const updateActiveNotification = useCallback(() => {
        if (isAnimating.current || !containerRef.current) return;

        const container = containerRef.current;
        const containerHeight = container.clientHeight;

        let activeId = null;
        let maxVisibleRatio = 0;

        Object.entries(notificationRefs.current).forEach(([id, element]) => {
            if (!element) return;

            const rect = element.getBoundingClientRect();
            const visibleHeight = Math.min(rect.bottom, containerHeight) - Math.max(rect.top, 0);
            const visibleRatio = visibleHeight / rect.height;

            if (visibleRatio > maxVisibleRatio) {
                maxVisibleRatio = visibleRatio;
                activeId = id;
            }

            // Update opacity and scale based on visibility
            element.style.opacity = 0.5 + (visibleRatio * 0.5);
            element.style.transform = `scale(${0.98 + (visibleRatio * 0.02)}) translateX(-50%)`;
        });

        // Update active state
        Object.entries(notificationRefs.current).forEach(([id, element]) => {
            if (!element) return;
            element.classList.toggle(styles.active, id === activeId);
        });
    }, []);

    // Snap to nearest notification when scrolling stops
    const snapToNearestNotification = useCallback(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const scrollTop = container.scrollTop;
        let closestElement = null;
        let smallestDistance = Infinity;

        Object.values(notificationRefs.current).forEach(element => {
            if (!element) return;
            const distance = Math.abs(element.offsetTop - scrollTop);
            if (distance < smallestDistance) {
                smallestDistance = distance;
                closestElement = element;
            }
        });

        if (closestElement) {
            isAnimating.current = true;
            container.scrollTo({
                top: closestElement.offsetTop,
                behavior: 'smooth'
            });

            setTimeout(() => {
                isAnimating.current = false;
            }, 300);
        }
    }, []);

    // Handle scroll events with debouncing
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let scrollTimeout;

        const handleScroll = () => {
            clearTimeout(scrollTimeout);
            updateActiveNotification();
            scrollTimeout = setTimeout(() => {
                snapToNearestNotification();
            }, 100);
        };

        container.addEventListener('scroll', handleScroll);
        return () => {
            container.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimeout);
        };
    }, [updateActiveNotification, snapToNearestNotification]);

    // Check if the event target is an interactive element
    const isInteractiveElement = (target) => {
        return target.closest('a, button, .nav, .closeButton') !== null;
    };

    // Swipe handlers
    const handleTouchStart = useCallback((id, e) => {
        if (!notificationRefs.current[id] || isInteractiveElement(e.target)) return;

        swipeData.current[id] = {
            startX: e.touches[0].clientX,
            startY: e.touches[0].clientY,
            isSwiping: false
        };
        notificationRefs.current[id].classList.add(styles.swiping);
    }, []);

    const handleTouchMove = useCallback((id, e) => {
        const element = notificationRefs.current[id];
        const data = swipeData.current[id];
        if (!element || !data) return;

        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;

        if (Math.abs(x - data.startX) > Math.abs(y - data.startY)) {
            data.isSwiping = true;

            const deltaX = x - data.startX;
            element.style.transform = `translateX(${deltaX}px) scale(${1 - Math.abs(deltaX) / 500}) translateX(-50%)`;
            element.style.opacity = 1 - Math.abs(deltaX) / 200;
            data.deltaX = deltaX;
        }
    }, []);

    const handleTouchEnd = useCallback((id) => {
        const element = notificationRefs.current[id];
        const data = swipeData.current[id];
        if (!element || !data) return;

        element.classList.remove(styles.swiping);

        if (data.isSwiping && Math.abs(data.deltaX) > 100) {
            removeNotification(id);
        } else {
            element.style.transform = '';
            element.style.opacity = '';
        }

        delete swipeData.current[id];
    }, [removeNotification]);

    // Mouse handlers for desktop
    const handleMouseDown = useCallback((id, e) => {
        if (!notificationRefs.current[id] || isInteractiveElement(e.target)) return;

        swipeData.current[id] = {
            startX: e.clientX,
            startY: e.clientY,
            isSwiping: false
        };
        notificationRefs.current[id].classList.add(styles.swiping);
    }, []);

    const handleMouseMove = useCallback((e) => {
        Object.entries(swipeData.current).forEach(([id, data]) => {
            const element = notificationRefs.current[id];
            if (!element || !data || !data.isSwiping) return;

            const x = e.clientX;
            const deltaX = x - data.startX;
            element.style.transform = `translateX(${deltaX}px) scale(${1 - Math.abs(deltaX) / 500}) translateX(-50%)`;
            element.style.opacity = 1 - Math.abs(deltaX) / 200;
            data.deltaX = deltaX;
        });
    }, []);

    const handleMouseUp = useCallback(() => {
        Object.entries(swipeData.current).forEach(([id, data]) => {
            const element = notificationRefs.current[id];
            if (!element || !data) return;

            element.classList.remove(styles.swiping);

            if (data.isSwiping && Math.abs(data.deltaX) > 100) {
                removeNotification(id);
            } else {
                element.style.transform = '';
                element.style.opacity = '';
            }
        });

        swipeData.current = {};
    }, [removeNotification]);

    // Set up mouse event listeners
    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    // Set initial active state
    useEffect(() => {
        updateActiveNotification();
    }, [notifications, updateActiveNotification]);

    // Stop propagation for interactive elements
    const stopPropagation = useCallback((e) => {
        e.stopPropagation();
    }, []);

    return (
        <div className={styles.container} ref={containerRef}>
            {notifications.map((notification) => (
                <div
                    key={'notif' + notification.id}
                    ref={el => notificationRefs.current[notification.id] = el}
                    className={styles.notification}
                    onTouchStart={(e) => handleTouchStart(notification.id, e)}
                    onTouchMove={(e) => handleTouchMove(notification.id, e)}
                    onTouchEnd={() => handleTouchEnd(notification.id)}
                    onMouseDown={(e) => handleMouseDown(notification.id, e)}
                >
                    <div
                        className={styles.closeButton}
                        onClick={(e) => {
                            stopPropagation(e);
                            removeNotification(notification.id);
                        }}
                        onMouseDown={stopPropagation}
                        onTouchStart={stopPropagation}
                    >
                        &times;
                    </div>

                    <div className={styles.header}>
                        <div className={styles.appInfo}>
                            <span className={styles.appName}>{notification.h2}</span>
                        </div>
                    </div>

                    <div className={styles.content}>{notification.desc}</div>
                    {notification.actions &&
                        notification.actions.length ?
                        <div className={styles.action}>
                            {notification.actions.map((a, i) => (
                                <Link
                                    key={'notifaction' + i}
                                    className={styles.nav}
                                    href={a.url}
                                    onClick={stopPropagation}
                                    onMouseDown={stopPropagation}
                                    onTouchStart={stopPropagation}
                                >
                                    {a.text}
                                </Link>
                            ))}
                        </div> : null}
                </div>
            ))}
        </div>
    );
};

export default Notification;