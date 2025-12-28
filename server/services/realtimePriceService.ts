import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { getStockQuote } from './yahooFinanceService';

interface PriceSubscription {
  ticker: string;
  clients: Set<WebSocket>;
}

class RealtimePriceService {
  private wss: WebSocketServer | null = null;
  private subscriptions: Map<string, PriceSubscription> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_FREQUENCY_MS = 5000; // Update every 5 seconds

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws/prices' });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[WebSocket] Client connected');

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      });

      ws.on('close', () => {
        console.log('[WebSocket] Client disconnected');
        this.unsubscribeClient(ws);
      });

      ws.on('error', (error) => {
        console.error('[WebSocket] Client error:', error);
      });
    });

    // Start price update loop
    this.startPriceUpdates();

    console.log('[WebSocket] Server initialized on /ws/prices');
  }

  private handleClientMessage(ws: WebSocket, data: any) {
    const { type, tickers } = data;

    if (type === 'subscribe' && Array.isArray(tickers)) {
      tickers.forEach((ticker: string) => {
        this.subscribe(ticker, ws);
      });
      console.log(`[WebSocket] Client subscribed to: ${tickers.join(', ')}`);
    } else if (type === 'unsubscribe' && Array.isArray(tickers)) {
      tickers.forEach((ticker: string) => {
        this.unsubscribe(ticker, ws);
      });
      console.log(`[WebSocket] Client unsubscribed from: ${tickers.join(', ')}`);
    }
  }

  private subscribe(ticker: string, ws: WebSocket) {
    if (!this.subscriptions.has(ticker)) {
      this.subscriptions.set(ticker, {
        ticker,
        clients: new Set(),
      });
    }

    const subscription = this.subscriptions.get(ticker)!;
    subscription.clients.add(ws);

    // Send initial price immediately
    this.sendPriceUpdate(ticker);
  }

  private unsubscribe(ticker: string, ws: WebSocket) {
    const subscription = this.subscriptions.get(ticker);
    if (subscription) {
      subscription.clients.delete(ws);

      // Clean up subscription if no clients left
      if (subscription.clients.size === 0) {
        this.subscriptions.delete(ticker);
      }
    }
  }

  private unsubscribeClient(ws: WebSocket) {
    // Remove client from all subscriptions
    for (const [ticker, subscription] of this.subscriptions.entries()) {
      subscription.clients.delete(ws);

      // Clean up empty subscriptions
      if (subscription.clients.size === 0) {
        this.subscriptions.delete(ticker);
      }
    }
  }

  private startPriceUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      const tickers = Array.from(this.subscriptions.keys());

      if (tickers.length === 0) {
        return;
      }

      // Update all subscribed tickers
      for (const ticker of tickers) {
        await this.sendPriceUpdate(ticker);
      }
    }, this.UPDATE_FREQUENCY_MS);
  }

  private async sendPriceUpdate(ticker: string) {
    try {
      const quote = await getStockQuote(ticker);

      const subscription = this.subscriptions.get(ticker);
      if (!subscription || subscription.clients.size === 0) {
        return;
      }

      const priceData = {
        type: 'price_update',
        ticker,
        data: {
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          marketCap: quote.marketCap,
          volume: quote.volume,
          timestamp: Date.now(),
        },
      };

      const message = JSON.stringify(priceData);

      // Send to all subscribed clients
      subscription.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } catch (error) {
      console.error(`[WebSocket] Error fetching price for ${ticker}:`, error);
    }
  }

  shutdown() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    this.subscriptions.clear();
    console.log('[WebSocket] Server shutdown');
  }

  getActiveSubscriptions() {
    return Array.from(this.subscriptions.entries()).map(([ticker, sub]) => ({
      ticker,
      clientCount: sub.clients.size,
    }));
  }
}

export const realtimePriceService = new RealtimePriceService();
