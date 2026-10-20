'use client';


import { useState, useEffect, useRef } from 'react';
import { FaArrowLeft, FaLocationArrow } from "react-icons/fa";
import { FaCircleChevronDown } from "react-icons/fa6";

import styles from './css/chat.module.css';
import Loader from '../../../components/wait';
import config from '../../../utils/config';
import { makeid } from '../../../utils/fn';

export default function ChatInterface({
  auth,
  session,
  send,
  rooms,
  setRooms,
  chats,
  setChats,
  currentRoom,
  setCurrentRoom,
  onUpdate,
  setUpdate
}) {
  const [newMessage, setNewMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);


  const scrollRef = useRef(null);
  const prevScroll = useRef(0);
  const [scrollState, setScrollState] = useState('bottom');// 'top', 'bottom', or null
  useEffect(() => {
    const handleScroll = () => {
      const el = scrollRef.current;
      if (!el) return;
      const current = el.scrollTop;
      if (current < prevScroll.current && scrollState !== 'top') {
        setScrollState('top');
      } else if (current > prevScroll.current && scrollState !== 'bottom') {
        setScrollState('bottom');
      };
      prevScroll.current = current;
    };

    const el = scrollRef.current;
    el?.addEventListener('scroll', handleScroll);

    return () => el?.removeEventListener('scroll', handleScroll);
  }, [scrollState, currentRoom]);


  useEffect(() => {
    if (rooms) return;
    async function serverData() {
      try {
        const res = await fetch(config.SERVER_URL + '/seller/chat_rooms', {
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
          setRooms(result.data.data);
        } else throw Error('error');
      } catch (e) {
        console.log(e);
      };
    };
    serverData();
  }, []);

  useEffect(() => {
    if (!onUpdate) return;
    const doc = scrollRef.current;
    if (doc && scrollState !== 'top') {
      doc.scrollTo({ top: doc.scrollHeight, behavior: "smooth" });
      setUpdate(0);
    };
  }, [onUpdate, scrollState]);

  const scrollDown = () => {
    const doc = scrollRef.current;
    if (doc) doc.scrollTo({ top: doc.scrollHeight, behavior: "smooth" });
  };

  useEffect(() => {
    if (!currentRoom) return;
    async function serverData() {
      if (chats[currentRoom.chatid]) return;
      try {
        const res = await fetch(config.SERVER_URL + '/seller/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth}`

          },
          body: JSON.stringify({
            id: currentRoom.chatid,
            session_id: session
          }),
        });
        if (!res.ok) {
          throw new Error(`Error: ${res.statusText}`);
        };
        const result = await res.json();
        if (result.data.status) {
          setChats(prev => ({ ...prev, [currentRoom.chatid]: result.data.message }));
        } else throw Error('error');
      } catch (e) {
        console.log(e);
      };
    };
    serverData();
  }, [currentRoom, chats]);
  const selectRoom = (roomId) => {
    const info = rooms.find(a => a.chatid === roomId);
    setCurrentRoom(info);
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const chat_s = { ...chats[currentRoom.chatid] };
    if (!chat_s.today) chat_s.today = [];
    chat_s.today.push({
      id: makeid(3, 'int'),
      text: newMessage,
      img: null,
      type: 'sent',
      seen: 0,
      time: new Date().toLocaleDateString('en-US', config.time_option)
    });
    send({
      path: 'chats',
      event: 'seller_user_chat',
      data: {
        chat_id: currentRoom.chatid,
        auth: auth,
        message: newMessage,
        attachments: []
      }
    });
    setChats(prev => ({
      ...prev,
      [currentRoom.chatid]: chat_s
    }));
    setNewMessage('');
  };


  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className={styles.appContainer}>
      {/* Sidebar - Room List */}
      {showSidebar && (
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>Customers Chats</div>
          <ul className={styles.roomList}>
            {rooms ? rooms.map((room) => (
              <li
                key={room.chatid}
                className={`${styles.roomItem} ${currentRoom?.chatid === room.chatid ? styles.active : ''}`}
                onClick={() => selectRoom(room.chatid)}
              >
                <div className={styles.logo}>
                  <img src={room.icon} alt={room.username} />
                </div>

                <div className={styles.room_info}>
                  <div className={styles.user_row}>
                    <div id={styles.username}>{room.username}</div>
                    <div id={styles.time}>{new Date(room.messaged_time).toLocaleString('en-IN', config.time_option)}</div>
                  </div>
                  <div id={styles.last_message}>{room.last_message}</div>
                </div>
              </li>
            )) : <Loader />}
          </ul>
        </div>
      )}
      {/* Chat Area */}
      {currentRoom && (
        <div className={styles.chatArea}>
          <div className={styles.chatHeader}>
            <button
              className={styles.backButton}
              onClick={() => {
                setCurrentRoom(false);
              }}
            >
              <FaArrowLeft size={25} />
            </button>
            <div className={styles.logo}>
              <img src={currentRoom.icon} alt={currentRoom.username} />
            </div>
            <div className={styles.room_info}>
              <h1>{currentRoom.username}</h1>
              <span id={styles.span}>
                {currentRoom.status === 'online' ?
                  'online'
                  : `last seen at ${new Date(currentRoom.status).toLocaleTimeString('en-US', config.time_option)}`}
              </span>
            </div>
          </div>

          <div className={styles.chatMessages} ref={scrollRef}>
            {chats[currentRoom.chatid] && Object.keys(chats[currentRoom.chatid]).length ? Object.entries(chats[currentRoom.chatid]).map(([key, value], index) => (
              <div key={'chat-section' + index} className={styles.chats_section}>
                <p className={styles.category}><span>{key}</span></p>
                {
                  value && value.length ? value.map((msg, i) => (
                    <div
                      key={'chat' + i}
                      data-msg-id={msg.id}
                      className={`${styles.message} ${msg.type === 'received' ? styles.received : styles.sent}`}
                      ref={(e) => {
                        // if (msg.type === 'received' && msg.seen !== 2) reed.current[i] = e;
                      }}>
                      {msg.image ? (
                        <div className={styles.message_bubble}>
                          {msg.text && <div>{msg.text}</div>}
                          <div className={styles.message_image}>
                            <img src={msg.image} alt="Message" />
                          </div>
                        </div>
                      ) : (
                        <p className={styles.message_bubble}>
                          {msg.text}
                        </p>
                      )}
                      <div className={styles.messageTime}>{new Date(msg.time).toLocaleTimeString('en-US', config.time_option)}</div>
                      {msg.type === 'sent' && <span className={styles.message_status}>
                        {msg.seen === 0 ? 'send' : msg.seen === 1 ? 'received' : 'seen'}
                      </span>}
                    </div>
                  )) : chats[currentRoom.chatid] ? <h1 className={styles.start_cn}></h1>
                    : <Loader />
                }
              </div>
            )) : <h1 className={styles.start_cn}></h1>}
            {
              currentRoom &&
              <>
                {scrollState === 'top' &&
                  onUpdate &&
                  <span className={styles.bottm_count}>{onUpdate}
                  </span>}
                {scrollState === 'top' && <FaCircleChevronDown
                  className={styles.bottm} size={25}
                  onClick={scrollDown} />}
              </>
            }
          </div >
          <div className={styles.chatInput}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              autoComplete="off"
            />
            <button onClick={sendMessage}>
              <FaLocationArrow size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};