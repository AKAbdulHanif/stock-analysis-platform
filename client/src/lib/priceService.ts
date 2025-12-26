/**
 * Price Service - Manages live price updates and caching
 * Uses simulated price movements with realistic market behavior
 */

export interface PriceData {
  ticker: string;
  currentPrice: number;
  previousPrice: number;
  change: number; // percentage
  changeAmount: number;
  lastUpdated: string;
  isLive: boolean;
}

interface PriceCache {
  [ticker: string]: PriceData;
}

const PRICE_CACHE_KEY = "investment_outlook_prices";
const PRICE_UPDATE_INTERVAL = 5000; // 5 seconds

// Base prices for stocks
const BASE_PRICES: Record<string, number> = {
  TSM: 298,
  NVDA: 188,
  AVGO: 340,
  ASML: 1065,
  UNH: 220,
  JNJ: 1071,
  JPM: 245,
  BAC: 38,
  GLD: 210,
  SLV: 32
};

/**
 * Get cached prices from localStorage
 */
export function getCachedPrices(): PriceCache {
  try {
    const cached = localStorage.getItem(PRICE_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
}

/**
 * Save prices to cache
 */
function cachePrices(prices: PriceCache): void {
  try {
    localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify(prices));
  } catch {
    // Silently fail if storage is full
  }
}

/**
 * Generate realistic price movement using random walk
 * Simulates intraday volatility and market trends
 */
function generatePriceMovement(
  basePrice: number,
  volatility: number = 0.02 // 2% daily volatility
): number {
  // Random walk with mean reversion
  const randomChange = (Math.random() - 0.5) * 2 * volatility;
  const newPrice = basePrice * (1 + randomChange);
  
  // Add slight trend (50% chance up, 50% chance down)
  const trendBias = (Math.random() - 0.5) * 0.005;
  return newPrice * (1 + trendBias);
}

/**
 * Get current price for a stock
 * Returns cached price if available and recent, otherwise generates new price
 */
export function getStockPrice(ticker: string): PriceData {
  const cache = getCachedPrices();
  const basePrice = BASE_PRICES[ticker] || 100;
  const now = new Date();

  // Check if cached price is still valid (less than 5 seconds old)
  if (cache[ticker]) {
    const lastUpdated = new Date(cache[ticker].lastUpdated);
    const ageMs = now.getTime() - lastUpdated.getTime();
    
    if (ageMs < PRICE_UPDATE_INTERVAL) {
      return cache[ticker];
    }
  }

  // Generate new price
  const previousPrice = cache[ticker]?.currentPrice || basePrice;
  const currentPrice = generatePriceMovement(previousPrice);
  const changeAmount = currentPrice - previousPrice;
  const change = (changeAmount / previousPrice) * 100;

  const priceData: PriceData = {
    ticker,
    currentPrice: parseFloat(currentPrice.toFixed(2)),
    previousPrice: parseFloat(previousPrice.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changeAmount: parseFloat(changeAmount.toFixed(2)),
    lastUpdated: now.toISOString(),
    isLive: true
  };

  // Update cache
  cache[ticker] = priceData;
  cachePrices(cache);

  return priceData;
}

/**
 * Get prices for multiple stocks
 */
export function getStockPrices(tickers: string[]): PriceData[] {
  return tickers.map((ticker) => getStockPrice(ticker));
}

/**
 * Subscribe to price updates
 * Returns unsubscribe function
 */
export function subscribeToPriceUpdates(
  tickers: string[],
  callback: (prices: Record<string, PriceData>) => void
): () => void {
  const intervalId = setInterval(() => {
    const prices: Record<string, PriceData> = {};
    tickers.forEach((ticker) => {
      prices[ticker] = getStockPrice(ticker);
    });
    callback(prices);
  }, PRICE_UPDATE_INTERVAL);

  return () => clearInterval(intervalId);
}

/**
 * Reset prices to base values
 */
export function resetPrices(): void {
  try {
    localStorage.removeItem(PRICE_CACHE_KEY);
  } catch {
    // Silently fail
  }
}

/**
 * Get price history for a stock (simulated)
 */
export function getPriceHistory(
  ticker: string,
  periods: number = 24
): Array<{ time: string; price: number }> {
  const basePrice = BASE_PRICES[ticker] || 100;
  const history = [];
  const now = new Date();

  for (let i = periods - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * PRICE_UPDATE_INTERVAL);
    const volatility = 0.015;
    const price = generatePriceMovement(basePrice, volatility);

    history.push({
      time: time.toLocaleTimeString(),
      price: parseFloat(price.toFixed(2))
    });
  }

  return history;
}

/**
 * Calculate unrealized P&L for a trade
 */
export function calculateUnrealizedPnL(
  entryPrice: number,
  currentPrice: number,
  quantity: number = 1
): {
  pnl: number;
  pnlPercent: number;
  pnlPerShare: number;
} {
  const pnlPerShare = currentPrice - entryPrice;
  const pnl = pnlPerShare * quantity;
  const pnlPercent = (pnlPerShare / entryPrice) * 100;

  return {
    pnl: parseFloat(pnl.toFixed(2)),
    pnlPercent: parseFloat(pnlPercent.toFixed(2)),
    pnlPerShare: parseFloat(pnlPerShare.toFixed(2))
  };
}
