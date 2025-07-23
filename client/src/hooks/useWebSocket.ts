import { useEffect, useState, useCallback, useRef } from 'react';

const getWebSocketUrl = () => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws`;
};

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

type MessageHandler = (data: any) => void;

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, MessageHandler[]>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      const wsUrl = getWebSocketUrl();
      console.log('Connecting to WebSocket:', wsUrl);

      // Validate URL before creating WebSocket
      try {
        new URL(wsUrl);
      } catch (urlError) {
        console.error('Invalid WebSocket URL:', wsUrl);
        return;
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setReconnectAttempt(0);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const handlers = handlersRef.current.get(message.type) || [];
          handlers.forEach(handler => {
            try {
              handler(message);
            } catch (handlerError) {
              console.error('Error in message handler:', handlerError);
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempt < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempt + 1})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempt(prev => prev + 1);
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnected(false);
    }
  }, [reconnectAttempt]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, []);

  const onMessage = useCallback((type: string, handler: MessageHandler) => {
    const current = handlersRef.current.get(type) || [];
    handlersRef.current.set(type, [...current, handler]);
  }, []);

  const offMessage = useCallback((type: string, handler?: MessageHandler) => {
    if (handler) {
      const current = handlersRef.current.get(type) || [];
      handlersRef.current.set(type, current.filter(h => h !== handler));
    } else {
      handlersRef.current.delete(type);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [connect]);

  return {
    isConnected,
    sendMessage,
    onMessage,
    offMessage,
  };
}