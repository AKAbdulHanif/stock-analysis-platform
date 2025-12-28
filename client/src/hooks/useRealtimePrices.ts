import { useState, useEffect, useRef, useCallback } from 'react';

export interface RealtimePrice {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  volume?: number;
  timestamp: number;
}

interface UseRealtimePricesOptions {
  enabled?: boolean;
  reconnectDelay?: number;
}

export function useRealtimePrices(
  tickers: string[],
  options: UseRealtimePricesOptions = {}
) {
  const { enabled = true, reconnectDelay = 3000 } = options;

  const [prices, setPrices] = useState<Map<string, RealtimePrice>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscribedTickersRef = useRef<Set<string>>(new Set());

  const connect = useCallback(() => {
    if (!enabled || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // Determine WebSocket URL based on current location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/prices`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        setError(null);

        // Subscribe to tickers
        if (tickers.length > 0) {
          ws.send(
            JSON.stringify({
              type: 'subscribe',
              tickers,
            })
          );
          tickers.forEach((ticker) => subscribedTickersRef.current.add(ticker));
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'price_update') {
            const priceData: RealtimePrice = {
              ticker: message.ticker,
              ...message.data,
            };

            setPrices((prev) => {
              const next = new Map(prev);
              next.set(message.ticker, priceData);
              return next;
            });
          }
        } catch (err) {
          console.error('[WebSocket] Error parsing message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[WebSocket] Error:', event);
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setIsConnected(false);
        wsRef.current = null;
        subscribedTickersRef.current.clear();

        // Attempt to reconnect
        if (enabled) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[WebSocket] Attempting to reconnect...');
            connect();
          }, reconnectDelay);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[WebSocket] Connection error:', err);
      setError('Failed to connect to WebSocket');
    }
  }, [enabled, tickers, reconnectDelay]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    subscribedTickersRef.current.clear();
    setIsConnected(false);
  }, []);

  const subscribe = useCallback((newTickers: string[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const tickersToSubscribe = newTickers.filter(
      (ticker) => !subscribedTickersRef.current.has(ticker)
    );

    if (tickersToSubscribe.length > 0) {
      wsRef.current.send(
        JSON.stringify({
          type: 'subscribe',
          tickers: tickersToSubscribe,
        })
      );

      tickersToSubscribe.forEach((ticker) =>
        subscribedTickersRef.current.add(ticker)
      );
    }
  }, []);

  const unsubscribe = useCallback((tickersToRemove: string[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const tickersToUnsubscribe = tickersToRemove.filter((ticker) =>
      subscribedTickersRef.current.has(ticker)
    );

    if (tickersToUnsubscribe.length > 0) {
      wsRef.current.send(
        JSON.stringify({
          type: 'unsubscribe',
          tickers: tickersToUnsubscribe,
        })
      );

      tickersToUnsubscribe.forEach((ticker) =>
        subscribedTickersRef.current.delete(ticker)
      );

      // Remove prices for unsubscribed tickers
      setPrices((prev) => {
        const next = new Map(prev);
        tickersToUnsubscribe.forEach((ticker) => next.delete(ticker));
        return next;
      });
    }
  }, []);

  // Connect on mount and when tickers change
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Update subscriptions when tickers change
  useEffect(() => {
    if (!isConnected || !wsRef.current) {
      return;
    }

    const currentTickers = Array.from(subscribedTickersRef.current);
    const tickersToAdd = tickers.filter((t) => !currentTickers.includes(t));
    const tickersToRemove = currentTickers.filter((t) => !tickers.includes(t));

    if (tickersToAdd.length > 0) {
      subscribe(tickersToAdd);
    }

    if (tickersToRemove.length > 0) {
      unsubscribe(tickersToRemove);
    }
  }, [tickers, isConnected, subscribe, unsubscribe]);

  return {
    prices,
    isConnected,
    error,
    subscribe,
    unsubscribe,
  };
}
