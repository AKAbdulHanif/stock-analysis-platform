/**
 * Portfolio Performance Service
 * 
 * Calculates portfolio performance metrics including returns, volatility, and Sharpe ratio
 */

import { eq, and, gte, desc } from "drizzle-orm";
import { getDb } from "../db";
import {
  portfolioSnapshots,
  watchlistStocks,
  InsertPortfolioSnapshot,
} from "../../drizzle/schema";
import { getStockQuote } from "./yahooFinanceService";

export class PortfolioPerformanceError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = "PortfolioPerformanceError";
  }
}

export interface PerformanceMetrics {
  totalReturn: number; // Cumulative return percentage
  dailyReturn: number; // Today's return percentage
  volatility: number; // Standard deviation of returns (annualized)
  sharpeRatio: number; // Risk-adjusted return
  maxDrawdown: number; // Maximum peak-to-trough decline
  currentValue: number; // Current portfolio value
  initialValue: number; // Starting portfolio value
}

export interface PerformanceDataPoint {
  date: Date;
  value: number;
  return: number;
  cumulativeReturn: number;
}

/**
 * Calculate current portfolio value based on watchlist stocks
 */
export async function calculatePortfolioValue(watchlistId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new PortfolioPerformanceError("Database not available", 503);
  }

  try {
    // Get all stocks in the watchlist
    const stocks = await db
      .select()
      .from(watchlistStocks)
      .where(eq(watchlistStocks.watchlistId, watchlistId));

    if (stocks.length === 0) {
      return 0;
    }

    // Fetch current prices for all stocks
    let totalValue = 0;
    for (const stock of stocks) {
      try {
        const quote = await getStockQuote(stock.ticker);
        // Assume 1 share per stock for simplicity (can be extended to support quantities)
        totalValue += quote.price;
      } catch (error) {
        console.error(`Error fetching price for ${stock.ticker}:`, error);
        // Skip stocks that fail to fetch
      }
    }

    return totalValue;
  } catch (error) {
    console.error(`Error calculating portfolio value for watchlist ${watchlistId}:`, error);
    throw new PortfolioPerformanceError("Failed to calculate portfolio value", 500);
  }
}

/**
 * Record daily portfolio snapshot
 */
export async function recordPortfolioSnapshot(
  watchlistId: number,
  totalValue: number
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new PortfolioPerformanceError("Database not available", 503);
  }

  try {
    // Get previous snapshot to calculate returns
    const previousSnapshots = await db
      .select()
      .from(portfolioSnapshots)
      .where(eq(portfolioSnapshots.watchlistId, watchlistId))
      .orderBy(desc(portfolioSnapshots.date))
      .limit(1);

    let dailyReturn = 0;
    let cumulativeReturn = 0;

    if (previousSnapshots.length > 0) {
      const prevSnapshot = previousSnapshots[0];
      const prevValue = parseFloat(prevSnapshot.totalValue);
      
      // Calculate daily return
      dailyReturn = ((totalValue - prevValue) / prevValue) * 100;
      
      // Calculate cumulative return from previous cumulative + daily
      const prevCumulative = parseFloat(prevSnapshot.cumulativeReturn || "0");
      cumulativeReturn = prevCumulative + dailyReturn;
    }

    // Insert new snapshot
    await db.insert(portfolioSnapshots).values({
      watchlistId,
      date: new Date(),
      totalValue: totalValue.toString(),
      dailyReturn: dailyReturn.toString(),
      cumulativeReturn: cumulativeReturn.toString(),
    });

    console.log(
      `Portfolio snapshot recorded for watchlist ${watchlistId}: $${totalValue.toFixed(2)} (${dailyReturn.toFixed(2)}% daily, ${cumulativeReturn.toFixed(2)}% cumulative)`
    );
  } catch (error) {
    console.error(`Error recording portfolio snapshot for watchlist ${watchlistId}:`, error);
    throw new PortfolioPerformanceError("Failed to record portfolio snapshot", 500);
  }
}

/**
 * Get portfolio performance history
 */
export async function getPortfolioHistory(
  watchlistId: number,
  days: number = 30
): Promise<PerformanceDataPoint[]> {
  const db = await getDb();
  if (!db) {
    throw new PortfolioPerformanceError("Database not available", 503);
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const snapshots = await db
      .select()
      .from(portfolioSnapshots)
      .where(
        and(
          eq(portfolioSnapshots.watchlistId, watchlistId),
          gte(portfolioSnapshots.date, cutoffDate)
        )
      )
      .orderBy(desc(portfolioSnapshots.date));

    return snapshots.map(snapshot => ({
      date: new Date(snapshot.date),
      value: parseFloat(snapshot.totalValue),
      return: parseFloat(snapshot.dailyReturn || "0"),
      cumulativeReturn: parseFloat(snapshot.cumulativeReturn || "0"),
    }));
  } catch (error) {
    console.error(`Error fetching portfolio history for watchlist ${watchlistId}:`, error);
    throw new PortfolioPerformanceError("Failed to fetch portfolio history", 500);
  }
}

/**
 * Calculate performance metrics
 */
export async function calculatePerformanceMetrics(
  watchlistId: number,
  days: number = 30
): Promise<PerformanceMetrics> {
  const history = await getPortfolioHistory(watchlistId, days);

  if (history.length === 0) {
    throw new PortfolioPerformanceError("No performance data available", 404);
  }

  const currentValue = history[0].value;
  const initialValue = history[history.length - 1].value;
  const totalReturn = ((currentValue - initialValue) / initialValue) * 100;
  const dailyReturn = history[0].return;

  // Calculate volatility (standard deviation of returns)
  const returns = history.map(h => h.return);
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized (252 trading days)

  // Calculate Sharpe ratio (assume 2% risk-free rate)
  const riskFreeRate = 2;
  const excessReturn = (totalReturn / days) * 365 - riskFreeRate; // Annualized
  const sharpeRatio = volatility > 0 ? excessReturn / volatility : 0;

  // Calculate max drawdown
  let maxDrawdown = 0;
  let peak = history[history.length - 1].value;
  
  for (let i = history.length - 1; i >= 0; i--) {
    const value = history[i].value;
    if (value > peak) {
      peak = value;
    }
    const drawdown = ((peak - value) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return {
    totalReturn,
    dailyReturn,
    volatility,
    sharpeRatio,
    maxDrawdown,
    currentValue,
    initialValue,
  };
}
