interface Watchlist {
  id: string;
  name: string;
  description: string;
  stocks: string[]; // Array of stock tickers
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "investment_outlook_watchlists";

/**
 * Get all watchlists from localStorage
 */
export function getAllWatchlists(): Watchlist[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading watchlists:", error);
    return [];
  }
}

/**
 * Get a specific watchlist by ID
 */
export function getWatchlist(id: string): Watchlist | null {
  const watchlists = getAllWatchlists();
  return watchlists.find((w) => w.id === id) || null;
}

/**
 * Create a new watchlist
 */
export function createWatchlist(
  name: string,
  description: string,
  stocks: string[] = []
): Watchlist {
  const watchlists = getAllWatchlists();
  const now = new Date().toISOString();
  const newWatchlist: Watchlist = {
    id: `watchlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    stocks,
    createdAt: now,
    updatedAt: now
  };

  watchlists.push(newWatchlist);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlists));

  return newWatchlist;
}

/**
 * Update an existing watchlist
 */
export function updateWatchlist(
  id: string,
  updates: Partial<Omit<Watchlist, "id" | "createdAt">>
): Watchlist | null {
  const watchlists = getAllWatchlists();
  const index = watchlists.findIndex((w) => w.id === id);

  if (index === -1) return null;

  const updated: Watchlist = {
    ...watchlists[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  watchlists[index] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlists));

  return updated;
}

/**
 * Delete a watchlist
 */
export function deleteWatchlist(id: string): boolean {
  const watchlists = getAllWatchlists();
  const filtered = watchlists.filter((w) => w.id !== id);

  if (filtered.length === watchlists.length) return false;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Add stocks to a watchlist
 */
export function addStocksToWatchlist(id: string, stocks: string[]): Watchlist | null {
  const watchlist = getWatchlist(id);
  if (!watchlist) return null;

  const updatedStocks = Array.from(new Set([...watchlist.stocks, ...stocks]));
  return updateWatchlist(id, { stocks: updatedStocks });
}

/**
 * Remove stocks from a watchlist
 */
export function removeStocksFromWatchlist(id: string, stocks: string[]): Watchlist | null {
  const watchlist = getWatchlist(id);
  if (!watchlist) return null;

  const updatedStocks = watchlist.stocks.filter((s) => !stocks.includes(s));
  return updateWatchlist(id, { stocks: updatedStocks });
}

/**
 * Clear all stocks from a watchlist
 */
export function clearWatchlist(id: string): Watchlist | null {
  return updateWatchlist(id, { stocks: [] });
}

/**
 * Check if a stock is in a watchlist
 */
export function isStockInWatchlist(watchlistId: string, ticker: string): boolean {
  const watchlist = getWatchlist(watchlistId);
  return watchlist ? watchlist.stocks.includes(ticker) : false;
}

/**
 * Export watchlist as JSON
 */
export function exportWatchlistAsJSON(id: string): string | null {
  const watchlist = getWatchlist(id);
  if (!watchlist) return null;

  return JSON.stringify(watchlist, null, 2);
}

/**
 * Import watchlist from JSON
 */
export function importWatchlistFromJSON(jsonString: string): Watchlist | null {
  try {
    const data = JSON.parse(jsonString);

    // Validate structure
    if (!data.name || !Array.isArray(data.stocks)) {
      throw new Error("Invalid watchlist format");
    }

    // Create new watchlist with imported data
    return createWatchlist(data.name, data.description || "", data.stocks);
  } catch (error) {
    console.error("Error importing watchlist:", error);
    return null;
  }
}

/**
 * Duplicate a watchlist
 */
export function duplicateWatchlist(id: string, newName?: string): Watchlist | null {
  const watchlist = getWatchlist(id);
  if (!watchlist) return null;

  const name = newName || `${watchlist.name} (Copy)`;
  return createWatchlist(name, watchlist.description, [...watchlist.stocks]);
}

/**
 * Get statistics for a watchlist
 */
export function getWatchlistStats(id: string): {
  stockCount: number;
  createdAt: string;
  updatedAt: string;
  lastModified: string;
} | null {
  const watchlist = getWatchlist(id);
  if (!watchlist) return null;

  return {
    stockCount: watchlist.stocks.length,
    createdAt: watchlist.createdAt,
    updatedAt: watchlist.updatedAt,
    lastModified: new Date(watchlist.updatedAt).toLocaleDateString()
  };
}
