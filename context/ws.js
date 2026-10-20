'use client';

import config from '../utils/config';
import { getServerCookie } from '../app/actions';
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const WebSocketContext = createContext(null);


export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  // Singleton connection instance
  const connect = useCallback(() => {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return
    }

    const ws = new WebSocket(config.WS_URL);
    ws.onopen = async () => {
      setIsConnected(true)
      console.log('WebSocket connected')
      // Send authentication if needed
      const auth = await getServerCookie('AUTH-T');
      ws.send(JSON.stringify({ path: 'AUTH', token: auth }));
    };

    ws.onclose = () => {
      setIsConnected(false)
      console.log('WebSocket disconnected')
      // Auto-reconnect after delay
      setTimeout(connect, 3000)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    setSocket(ws)
  }, [socket])

  useEffect(() => {
    // Only connect on client side
    if (typeof window !== 'undefined' && !config.demo) {
      connect()
    }

    return () => {
      // Don't close connection here - we want it to persist
    }
  }, [connect])

  const send = useCallback((data) => {
    if (isConnected && socket) {
      socket.send(JSON.stringify(data))
    }
  }, [socket, isConnected])

  return (
    <WebSocketContext.Provider value={{ socket, isConnected, send }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocket = () => useContext(WebSocketContext)