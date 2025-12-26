/**
 * Watchlist Service
 * 
 * Handles watchlist CRUD operations and stock management
 */

import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../db";
import {
  watchlists,
  watchlistStocks,
  InsertWatchlist,
  InsertWatchlistStock,
  Watchlist,
  WatchlistStock,
} from "../../drizzle/schema";

export class WatchlistError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = "WatchlistError";
  }
}

/**
 * Get all watchlists for a user
 */
export async function getUserWatchlists(userId: number): Promise<Watchlist[]> {
  const db = await getDb();
  if (!db) {
    throw new WatchlistError("Database not available", 503);
  }

  try {
    const result = await db
      .select()
      .from(watchlists)
      .where(eq(watchlists.userId, userId))
      .orderBy(desc(watchlists.createdAt));

    return result;
  } catch (error) {
    console.error("Error fetching user watchlists:", error);
    throw new WatchlistError("Failed to fetch watchlists", 500);
  }
}

/**
 * Get a specific watchlist by ID
 */
export async function getWatchlistById(
  watchlistId: number,
  userId: number
): Promise<Watchlist | null> {
  const db = await getDb();
  if (!db) {
    throw new WatchlistError("Database not available", 503);
  }

  try {
    const result = await db
      .select()
      .from(watchlists)
      .where(
        and(
          eq(watchlists.id, watchlistId),
          eq(watchlists.userId, userId)
        )
      )
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    throw new WatchlistError("Failed to fetch watchlist", 500);
  }
}

/**
 * Create a new watchlist
 */
export async function createWatchlist(
  data: InsertWatchlist
): Promise<Watchlist> {
  const db = await getDb();
  if (!db) {
    throw new WatchlistError("Database not available", 503);
  }

  try {
    const result = await db.insert(watchlists).values(data);
    const insertId = Number(result[0].insertId);

    // Fetch the created watchlist
    const created = await db
      .select()
      .from(watchlists)
      .where(eq(watchlists.id, insertId))
      .limit(1);

    if (created.length === 0) {
      throw new WatchlistError("Failed to retrieve created watchlist", 500);
    }

    return created[0];
  } catch (error) {
    console.error("Error creating watchlist:", error);
    throw new WatchlistError("Failed to create watchlist", 500);
  }
}

/**
 * Update a watchlist
 */
export async function updateWatchlist(
  watchlistId: number,
  userId: number,
  data: Partial<InsertWatchlist>
): Promise<Watchlist> {
  const db = await getDb();
  if (!db) {
    throw new WatchlistError("Database not available", 503);
  }

  try {
    // Verify ownership
    const existing = await getWatchlistById(watchlistId, userId);
    if (!existing) {
      throw new WatchlistError("Watchlist not found", 404);
    }

    await db
      .update(watchlists)
      .set(data)
      .where(
        and(
          eq(watchlists.id, watchlistId),
          eq(watchlists.userId, userId)
        )
      );

    // Fetch updated watchlist
    const updated = await getWatchlistById(watchlistId, userId);
    if (!updated) {
      throw new WatchlistError("Failed to retrieve updated watchlist", 500);
    }

    return updated;
  } catch (error) {
    if (error instanceof WatchlistError) throw error;
    console.error("Error updating watchlist:", error);
    throw new WatchlistError("Failed to update watchlist", 500);
  }
}

/**
 * Delete a watchlist
 */
export async function deleteWatchlist(
  watchlistId: number,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new WatchlistError("Database not available", 503);
  }

  try {
    // Verify ownership
    const existing = await getWatchlistById(watchlistId, userId);
    if (!existing) {
      throw new WatchlistError("Watchlist not found", 404);
    }

    // Delete all stocks in the watchlist first
    await db
      .delete(watchlistStocks)
      .where(eq(watchlistStocks.watchlistId, watchlistId));

    // Delete the watchlist
    await db
      .delete(watchlists)
      .where(
        and(
          eq(watchlists.id, watchlistId),
          eq(watchlists.userId, userId)
        )
      );
  } catch (error) {
    if (error instanceof WatchlistError) throw error;
    console.error("Error deleting watchlist:", error);
    throw new WatchlistError("Failed to delete watchlist", 500);
  }
}

/**
 * Get all stocks in a watchlist
 */
export async function getWatchlistStocks(
  watchlistId: number,
  userId: number
): Promise<WatchlistStock[]> {
  const db = await getDb();
  if (!db) {
    throw new WatchlistError("Database not available", 503);
  }

  try {
    // Verify ownership
    const watchlist = await getWatchlistById(watchlistId, userId);
    if (!watchlist) {
      throw new WatchlistError("Watchlist not found", 404);
    }

    const result = await db
      .select()
      .from(watchlistStocks)
      .where(eq(watchlistStocks.watchlistId, watchlistId))
      .orderBy(desc(watchlistStocks.addedAt));

    return result;
  } catch (error) {
    if (error instanceof WatchlistError) throw error;
    console.error("Error fetching watchlist stocks:", error);
    throw new WatchlistError("Failed to fetch watchlist stocks", 500);
  }
}

/**
 * Add a stock to a watchlist
 */
export async function addStockToWatchlist(
  watchlistId: number,
  userId: number,
  ticker: string
): Promise<WatchlistStock> {
  const db = await getDb();
  if (!db) {
    throw new WatchlistError("Database not available", 503);
  }

  try {
    // Verify ownership
    const watchlist = await getWatchlistById(watchlistId, userId);
    if (!watchlist) {
      throw new WatchlistError("Watchlist not found", 404);
    }

    // Check if stock already exists in watchlist
    const existing = await db
      .select()
      .from(watchlistStocks)
      .where(
        and(
          eq(watchlistStocks.watchlistId, watchlistId),
          eq(watchlistStocks.ticker, ticker.toUpperCase())
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new WatchlistError("Stock already in watchlist", 409);
    }

    // Add stock
    const data: InsertWatchlistStock = {
      watchlistId,
      ticker: ticker.toUpperCase(),
    };

    const result = await db.insert(watchlistStocks).values(data);
    const insertId = Number(result[0].insertId);

    // Fetch the created stock
    const created = await db
      .select()
      .from(watchlistStocks)
      .where(eq(watchlistStocks.id, insertId))
      .limit(1);

    if (created.length === 0) {
      throw new WatchlistError("Failed to retrieve added stock", 500);
    }

    return created[0];
  } catch (error) {
    if (error instanceof WatchlistError) throw error;
    console.error("Error adding stock to watchlist:", error);
    throw new WatchlistError("Failed to add stock to watchlist", 500);
  }
}

/**
 * Remove a stock from a watchlist
 */
export async function removeStockFromWatchlist(
  watchlistId: number,
  userId: number,
  ticker: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new WatchlistError("Database not available", 503);
  }

  try {
    // Verify ownership
    const watchlist = await getWatchlistById(watchlistId, userId);
    if (!watchlist) {
      throw new WatchlistError("Watchlist not found", 404);
    }

    // Remove stock
    await db
      .delete(watchlistStocks)
      .where(
        and(
          eq(watchlistStocks.watchlistId, watchlistId),
          eq(watchlistStocks.ticker, ticker.toUpperCase())
        )
      );
  } catch (error) {
    if (error instanceof WatchlistError) throw error;
    console.error("Error removing stock from watchlist:", error);
    throw new WatchlistError("Failed to remove stock from watchlist", 500);
  }
}

/**
 * Get all stocks across all user's watchlists (for alert monitoring)
 */
export async function getAllUserWatchlistStocks(
  userId: number
): Promise<string[]> {
  const db = await getDb();
  if (!db) {
    throw new WatchlistError("Database not available", 503);
  }

  try {
    // Get all user's watchlist IDs
    const userWatchlists = await getUserWatchlists(userId);
    const watchlistIds = userWatchlists.map((w) => w.id);

    if (watchlistIds.length === 0) {
      return [];
    }

    // Get all unique tickers from these watchlists
    const stocks = await db
      .select()
      .from(watchlistStocks)
      .where(eq(watchlistStocks.watchlistId, watchlistIds[0])); // TODO: Fix this to handle multiple IDs

    // Get unique tickers
    const uniqueTickers = [...new Set(stocks.map((s) => s.ticker))];
    return uniqueTickers;
  } catch (error) {
    console.error("Error fetching all user watchlist stocks:", error);
    throw new WatchlistError("Failed to fetch user stocks", 500);
  }
}
